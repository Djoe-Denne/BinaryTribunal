import { readFileSync } from "node:fs";
import { join } from "node:path";
import { types as utilTypes } from "node:util";
import type { GraphAdmissionSource, GraphExecutionTemplate, GraphInputSource, GraphRunV1, PreparedGraph, PreparedGraphV1, PreparedGraphV2, Snapshot } from "./domain";
import { assertSnapshotContract, validateStaticJsonSchema, type GraphSnapshotV1, type StaticJsonSchema } from "./graph";
import { buildGraphSnapshot, type GraphParts } from "./graph-normalize";
import { clusterGraph, type ClusterConfig, type ClusterPartition } from "./cluster";
import { buildInvestigationGroups, type GroupConfig, type InvestigationGroup } from "./investigation-groups";
import { assertAdmissionBudgetBinding, planMission, type AdmissionBudgetInputV1, type PlannerPolicy, type PlannerResult } from "./planner";
import { validateGraphDocument } from "./graph-store";
import { canonical, fingerprint, hash, validateConfig, validateKnowledge } from "./validation";
import { validateREPolicy } from "./re-policy";

export type GraphPreparation = {
  version: "l8-graph-preparation-v1"; snapshot: GraphSnapshotV1; cluster: ClusterConfig;
  groups: Partial<GroupConfig>; policy: Omit<PlannerPolicy, "partitionId">;
};
export interface GraphPreparationV2 extends Omit<GraphPreparation, "version"> {
  version: "l8-graph-preparation-v2"; executionTemplate: GraphExecutionTemplate;
  inputsByFunction: GraphRunV1["inputsByFunction"]; publicationsByFunction: GraphRunV1["publicationsByFunction"];
  budgetEpoch: number; capsByFunction?: AdmissionBudgetInputV1["capsByFunction"];
}
export const GRAPH_ADMISSION_CODEC = "l8-fixture-admission-codec-v2" as const;
type JsonObject = Record<string, unknown>;
export function graphCheck(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`graph: ${message}`);
}
export function graphObject(value: unknown): JsonObject {
  graphCheck(!utilTypes.isProxy(value), "proxy is not JSON data");
  graphCheck(value !== null && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value)), "plain object required");
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key)!;
    graphCheck(typeof key === "string" && "value" in d && d.enumerable, "accessor/symbol/nonenumerable data refused");
  }
  return value as JsonObject;
}
/** Exact own-key checks, including optional fields. Never use inherited ID lookups. */
export function graphKeys(value: unknown, required: string[], optional: string[] = []): JsonObject {
  const object = graphObject(value), allowed = new Set([...required, ...optional]);
  graphCheck(required.every(key => Object.hasOwn(object, key)) && Object.keys(object).every(key => allowed.has(key)), "unknown or missing field");
  return object;
}
export function graphString(value: unknown): asserts value is string { graphCheck(typeof value === "string" && value.trim().length > 0, "nonempty string required"); }
export function graphInteger(value: unknown, minimum = 0): asserts value is number { graphCheck(Number.isSafeInteger(value) && !Object.is(value, -0) && Number(value) >= minimum, "invalid integer"); }
export function graphNumber(value: unknown): asserts value is number { graphCheck(typeof value === "number" && Number.isFinite(value) && value >= 0, "invalid finite nonnegative number"); }
function oneOf(value: unknown, choices: readonly unknown[]): void { graphCheck(choices.some(choice => choice === value), "invalid enum value"); }
export function graphArray(value: unknown): asserts value is unknown[] { graphCheck(Array.isArray(value), "array required"); }
export function graphJson(value: unknown): void {
  const active = new Set<object>();
  const visit = (v: unknown): void => {
    graphCheck(!utilTypes.isProxy(v), "proxy is not JSON data");
    if (v === null || typeof v === "string" || typeof v === "boolean") return;
    if (typeof v === "number") { graphCheck(Number.isFinite(v), "nonfinite JSON number"); return; }
    graphCheck(typeof v === "object" && !active.has(v), "non-JSON/cyclic data"); active.add(v);
    if (Array.isArray(v)) {
      graphCheck(Object.getPrototypeOf(v) === Array.prototype && Reflect.ownKeys(v).length === v.length + 1, "sparse/extra array fields");
      for (let i = 0; i < v.length; i++) { const d = Object.getOwnPropertyDescriptor(v, String(i)); graphCheck(d && "value" in d && d.enumerable, "array accessor/hole"); visit(d.value); }
    } else for (const d of Object.values(Object.getOwnPropertyDescriptors(graphObject(v)))) visit(d.value);
    active.delete(v);
  };
  visit(value);
}
export function graphCopy<T>(value: T): T { graphJson(value); return JSON.parse(canonical(value)) as T; }
export function graphFreeze<T>(value: T): Readonly<T> {
  const copy = graphCopy(value);
  const freeze = (v: unknown): void => { if (v !== null && typeof v === "object") { Object.values(v).forEach(freeze); Object.freeze(v); } };
  freeze(copy); return copy;
}
export function graphDigest(value: unknown): void {
  const object = graphObject(value), { fingerprint: digest, ...content } = object;
  graphCheck(typeof digest === "string" && /^[a-f0-9]{64}$/.test(digest) && digest === fingerprint(content), "content fingerprint mismatch");
}
function dictionary(value: unknown, validate: (value: unknown) => void): void { Object.values(graphObject(value)).forEach(validate); }
function strings(value: unknown): void { graphArray(value); value.forEach(graphString); }
function requirement(value: unknown): void {
  const r = graphKeys(value, ["artifactId", "artifactSha256", "functionId", "moduleSha256", "artifactKind", "minimumRevision", "maximumRevision", "publicationLevel", "validation"]);
  for (const key of ["artifactId", "functionId"]) graphString(r[key]);
  for (const key of ["artifactSha256", "moduleSha256"]) graphCheck(typeof r[key] === "string" && /^[a-f0-9]{64}$/.test(r[key]), "invalid artifact hash");
  oneOf(r.artifactKind, ["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"]);
  graphInteger(r.minimumRevision); graphInteger(r.maximumRevision); graphCheck(r.minimumRevision <= r.maximumRevision, "artifact revision range");
  oneOf(r.publicationLevel, [1, 2]); oneOf(r.validation, ["fixture-only", "parent-validated"]);
}
function dispensation(value: unknown): void {
  const r = graphKeys(value, ["reason", "policyVersion", "source", "sourceHash", "validation", "knowledgeRevision"]);
  [r.reason, r.policyVersion, r.source].forEach(graphString); graphInteger(r.knowledgeRevision);
  graphCheck(typeof r.sourceHash === "string" && /^[a-f0-9]{64}$/.test(r.sourceHash), "dispensation evidence"); oneOf(r.validation, ["fixture-only", "parent-validated"]);
}
function receipt(value: unknown): void {
  const r = graphKeys(value, ["artifactId", "artifactSha256", "functionId", "moduleSha256", "artifactKind", "knowledgeRevision", "publicationLevel", "validation", "producerUnitId", "commitId", "readbackStatus", "futurePrerequisiteEffect"]);
  const { knowledgeRevision, producerUnitId, commitId, readbackStatus, futurePrerequisiteEffect, ...rest } = r;
  requirement({ ...rest, minimumRevision: knowledgeRevision, maximumRevision: knowledgeRevision });
  graphInteger(knowledgeRevision); if (producerUnitId !== null) graphString(producerUnitId); graphString(commitId);
  oneOf(readbackStatus, ["verified", "pending", "mismatch"]); oneOf(futurePrerequisiteEffect, ["satisfies", "does_not_satisfy", "invalidates_future"]);
}
export function assertReceiptCoherence(value: unknown): void {
  receipt(value); const r = graphObject(value);
  graphCheck(r.publicationLevel !== 2 || r.validation === "parent-validated", "receipt level2/fixture-only is incoherent (upstream OPEN); no relabel");
}
function resource(value: unknown): void {
  const r = graphKeys(value, ["profiles", "models", "tools", "accounts", "slots", "cpu", "gpu", "budget"]);
  [r.profiles, r.models, r.tools, r.accounts].forEach(strings);
  [r.slots, r.cpu, r.gpu, r.budget].forEach(x => graphInteger(x));
}
export function validatePlannerPolicy(value: unknown, partition = true, admission = false): void {
  const r = graphKeys(value, ["version", "estimationVersion", ...(partition ? ["partitionId"] : []), "investigationKind", "artifactKind", "publicationLevel", "contextEnvelopeMaxUtf8Bytes", "totalContextBudgetUtf8Bytes", "maxSelectedUnits", "sccMaxFunctions", "sccMaxIterations", "sccCostBudget", "requirementsByFunction", "estimatesByFunction", "resourcesByFunction"], ["edgeKinds", "dispensationsByEdge", "externalReceiptsByEdge", "extraConflictsByFunction", ...(admission ? ["admissionBudgetMode", "admissionBudget"] : [])]);
  [r.version, r.estimationVersion, ...(partition ? [r.partitionId] : [])].forEach(graphString);
  oneOf(r.investigationKind, ["structural", "decompilation", "semantification"]);
  oneOf(r.artifactKind, ["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"]); oneOf(r.publicationLevel, [1, 2]);
  for (const key of ["contextEnvelopeMaxUtf8Bytes", "totalContextBudgetUtf8Bytes", "maxSelectedUnits", "sccMaxFunctions", "sccMaxIterations", "sccCostBudget"]) graphInteger(r[key]);
  dictionary(r.requirementsByFunction, requirement); dictionary(r.resourcesByFunction, resource);
  dictionary(r.estimatesByFunction, value => {
    const e = graphKeys(value, ["version", "A", "B", "R", "validation"], ["byModel"]); graphString(e.version);
    [e.A, e.B, e.R, e.validation].forEach(graphNumber);
    if (e.byModel !== undefined) dictionary(e.byModel, v => { const x = graphKeys(v, ["A", "B", "R", "validation"]); Object.values(x).forEach(graphNumber); });
  });
  if (r.edgeKinds !== undefined) dictionary(r.edgeKinds, x => oneOf(x, ["obligatory", "optional", "external_satisfied", "unknown_unresolved", "non_blocking"]));
  if (r.dispensationsByEdge !== undefined) dictionary(r.dispensationsByEdge, dispensation);
  if (r.externalReceiptsByEdge !== undefined) dictionary(r.externalReceiptsByEdge, assertReceiptCoherence);
  if (r.extraConflictsByFunction !== undefined) dictionary(r.extraConflictsByFunction, value => { graphArray(value); value.forEach(v => { const x = graphKeys(v, ["id", "kind", "resourceKey", "withUnitId"]); [x.id, x.kind, x.resourceKey].forEach(graphString); if (x.withUnitId !== null) graphString(x.withUnitId); }); });
}
function diagnostic(value: unknown): void {
  const r = graphKeys(value, ["code", "unitId", "functionIds", "detail"]); graphString(r.code); graphString(r.detail); if (r.unitId !== null) graphString(r.unitId); strings(r.functionIds);
}
function validatePlanning(value: unknown, snapshot: GraphSnapshotV1, partition: ClusterPartition, source?: GraphAdmissionSource): asserts value is PlannerResult {
  const r = graphKeys(value, ["plan", "units", "sidecar", "diagnostics", "binding"]);
  validateGraphDocument("mission-plan", r.plan); graphDigest(r.plan);
  graphArray(r.units); r.units.forEach(unit => validateGraphDocument("work-unit", unit));
  const plan = graphObject(r.plan), side = graphKeys(r.sidecar, ["schemaVersion", "policyVersion", "estimationVersion", "planId", "planFingerprint", "snapshotFingerprint", "knowledgeRevision", "policy", "relationView", "requirementById", "dispensationById", "externalReceiptById", "localOrders", "estimatesByUnit", "resourcesByUnit", "envelopeBytesByUnit", "unitFingerprints", "diagnostics", "fingerprint"], source ? ["admissionBudget"] : []);
  graphCheck(side.schemaVersion === 1, "sidecar version"); graphDigest(side); validatePlannerPolicy(side.policy, true, !!source);
  const relations = graphKeys(side.relationView, ["version", "relations"]); graphCheck(relations.version === "planner-relations-v1", "relation view version"); graphArray(relations.relations);
  const sites = (value: unknown): void => { graphArray(value); for (const site of value) { const s = graphKeys(site, ["siteRva", "xrefType", "provenance"]); graphString(s.siteRva); oneOf(s.xrefType, ["code", "data"]); const p = graphKeys(s.provenance, ["moduleSha256", "siteRva", "siteKind", "xrefType", "source", "sourceVersion", "sourceHash", "evidenceSha256"]); for (const key of ["moduleSha256", "source", "sourceVersion", "sourceHash", "evidenceSha256"]) graphString(p[key]); if (p.siteRva !== null) graphString(p.siteRva); oneOf(p.siteKind, ["instruction", "object", "import", "table", "extractor"]); oneOf(p.xrefType, ["code", "data", "none"]); } };
  for (const relation of relations.relations) {
    const x = graphKeys(relation, ["relationId", "sourceId", "destinationId", "kind", "sourceEdgeIds", "sites", "observations"]);
    [x.relationId, x.sourceId, x.destinationId, x.kind].forEach(graphString); strings(x.sourceEdgeIds); sites(x.sites); graphArray(x.observations);
    for (const observation of x.observations) { const o = graphKeys(observation, ["metadata", "sourceEdgeIds", "sites", "sitesBySourceEdgeId"]); strings(o.sourceEdgeIds); sites(o.sites); dictionary(o.sitesBySourceEdgeId, sites); graphKeys(o.metadata, [], ["status", "confidence", "direction", "schemaVersion", "appearedInRevision", "retiredInRevision", "schedulerRelevance"]); }
  }
  dictionary(side.requirementById, requirement); dictionary(side.dispensationById, dispensation); dictionary(side.externalReceiptById, assertReceiptCoherence);
  dictionary(side.resourcesByUnit, resource); dictionary(side.envelopeBytesByUnit, v => graphInteger(v)); dictionary(side.unitFingerprints, graphString);
  graphArray(side.diagnostics); side.diagnostics.forEach(diagnostic); graphArray(r.diagnostics); r.diagnostics.forEach(diagnostic);
  dictionary(side.localOrders, v => { const x = graphKeys(v, ["sccIds", "functionIds", "recursive", "maxIterations", "publication"]); strings(x.sccIds); strings(x.functionIds); graphCheck(typeof x.recursive === "boolean" && x.publication === "whole-unit-only", "local order"); graphInteger(x.maxIterations); });
  dictionary(side.estimatesByUnit, v => { const x = graphKeys(v, ["version", "cost", "modelCosts"]); graphString(x.version); const c = graphKeys(x.cost, ["known", "value"]); graphCheck(typeof c.known === "boolean" && (c.known ? Number.isSafeInteger(c.value) : c.value === null), "cost"); dictionary(x.modelCosts, v => graphInteger(v)); });
  const binding = graphKeys(r.binding, ["schemaVersion", "planFingerprint", "sidecarFingerprint", "fingerprint"]); graphDigest(binding);
  graphCheck(binding.schemaVersion === 1 && binding.planFingerprint === plan.fingerprint && binding.sidecarFingerprint === side.fingerprint && side.planFingerprint === plan.fingerprint && side.planId === plan.planId, "plan binding mismatch");
  graphCheck(plan.missionId === snapshot.missionId && plan.snapshotId === snapshot.snapshotId && plan.partitionId === partition.partitionId && plan.knowledgeRevision === snapshot.knowledgeRevision && side.snapshotFingerprint === snapshot.normalizedFingerprint && side.knowledgeRevision === plan.knowledgeRevision, "snapshot/plan/revision mismatch");
  const units = r.units.map(graphObject), selected = plan.selectedUnitIds;
  graphArray(selected); graphCheck(new Set(units.map(u => u.unitId)).size === units.length, "duplicate unit");
  for (const unit of units) {
    const { state: _state, ...content } = unit;
    graphCheck(unit.snapshotId === snapshot.snapshotId && unit.partitionId === partition.partitionId && unit.knowledgeRevision === snapshot.knowledgeRevision && Object.hasOwn(side.unitFingerprints as object, String(unit.unitId)) && graphObject(side.unitFingerprints)[String(unit.unitId)] === fingerprint(content), "unit content binding");
  }
  graphCheck(selected.every(id => units.some(u => u.unitId === id)), "unknown selected unit");
  graphArray(plan.units);
  graphCheck(plan.units.length === units.length && plan.units.every(entry => {
    const p = graphObject(entry), u = units.find(unit => unit.unitId === p.unitId);
    return !!u && ["ownedFunctionIds", "contextFunctionIds", "requiredPublicationLevel", "state"].every(key => canonical(p[key]) === canonical(u[key]));
  }), "plan/unit projection mismatch");
  if (source) {
    const planning = r as unknown as PlannerResult;
    assertAdmissionBudgetBinding(planning.plan, planning.sidecar, source.context);
    graphCheck(canonical(planning.sidecar.policy.admissionBudget ?? null) === canonical(source.allocation), "source/allocation mismatch");
    for (const unit of planning.units) {
      const structural = { snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint, policyVersion: planning.sidecar.policyVersion,
        unit: { ...unit, state: "PENDING" }, functions: [...unit.ownedFunctionIds, ...unit.contextFunctionIds].map(id => snapshot.nodes.find(n => n.id === id)),
        requirements: unit.prerequisites.map(p => planning.sidecar.requirementById[p.id] ?? null), dispensations: unit.prerequisites.map(p => planning.sidecar.dispensationById[p.id] ?? null) };
      graphCheck(planning.sidecar.admissionBudget!.byUnit[unit.unitId]!.structuralEnvelopeUtf8Bytes === Buffer.byteLength(canonical(structural), "utf8"), "S differs from actual immutable scientific envelope");
    }
  }
}
export function parsePreparedGraph(value: unknown): PreparedGraph {
  graphJson(value); const copy = graphCopy(value), version = graphObject(copy).version;
  graphCheck(version === "l8-prepared-graph-v1" || version === "l8-prepared-graph-v2", "prepared graph version");
  const r = graphKeys(copy, ["version", "snapshot", "partition", "groups", "planning", "fingerprint", ...(version === "l8-prepared-graph-v2" ? ["admissionSource"] : [])]); graphDigest(r);
  const snapshot = assertSnapshotContract(r.snapshot); validateGraphDocument("cluster-partition", r.partition);
  const partition = r.partition as ClusterPartition;
  graphCheck(partition.regime === "A" && partition.adopted === false && partition.snapshotId === snapshot.snapshotId && partition.snapshotFingerprint === snapshot.normalizedFingerprint, "structural partition binding");
  const schema: StaticJsonSchema = JSON.parse(readFileSync(join(import.meta.dir, "..", "schemas", "investigation-group-v1.schema.json"), "utf8"));
  graphArray(r.groups); const owners = new Set<string>();
  for (const group of r.groups) {
    graphCheck(validateStaticJsonSchema(group, schema).length === 0, "group schema"); const g = group as InvestigationGroup;
    graphCheck(g.partitionId === partition.partitionId, "group partition");
    for (const id of g.ownedFunctionIds) { graphCheck(snapshot.nodes.some(n => n.id === id) && !owners.has(id), "duplicate/unknown function owner"); owners.add(id); }
    graphCheck(g.contextFunctionIds.every(id => snapshot.nodes.some(n => n.id === id) && !g.ownedFunctionIds.includes(id)), "group context");
  }
  const source = version === "l8-prepared-graph-v2" ? parseAdmissionSource(r.admissionSource, snapshot, partition) : undefined;
  validatePlanning(r.planning, snapshot, partition, source);
  return r as unknown as PreparedGraph;
}
function structural(snapshot: GraphSnapshotV1, rawCluster: unknown, rawGroups: unknown) {
  const config = graphKeys(rawCluster, ["algorithm"], ["weights", "maxCommunitySize", "seedIds", "seedCapabilityIds", "ppr", "leiden"]);
  oneOf(config.algorithm, ["historical-cc", "hub-baseline", "ppr", "leiden"]);
  if (config.maxCommunitySize !== undefined) graphInteger(config.maxCommunitySize, 1);
  if (config.seedIds !== undefined) strings(config.seedIds); if (config.seedCapabilityIds !== undefined) strings(config.seedCapabilityIds);
  if (config.weights !== undefined) {
    const weights = graphKeys(config.weights, [], ["version", "direct", "tail", "indirectHigh", "indirectOther", "thunk", "dispatch", "rareData", "memoryWeak", "memoryWindow", "rareObjectMaxUsers", "importFactor", "utilityFactor", "hubThreshold", "hubFactor"]);
    for (const [key, value] of Object.entries(weights)) { if (key === "version") graphString(value); else graphNumber(value); }
  }
  if (config.ppr !== undefined) {
    const p = graphKeys(config.ppr, [], ["version", "maxScoreCells", "direction", "damping", "tolerance", "maxIterations", "maxSweepSize"]);
    for (const [key, value] of Object.entries(p)) { if (key === "version") oneOf(value, ["ppr-dense-cell-budget-v1"]); else if (key === "direction") oneOf(value, ["callee", "caller", "both"]); else graphNumber(value); }
  }
  if (config.leiden !== undefined) { const l = graphKeys(config.leiden, [], ["seed", "resolution", "temperature", "tolerance", "maxSweeps", "maxLevels", "maxOriginalRounds"]); for (const [key, value] of Object.entries(l)) { if (key === "seed") graphString(value); else graphNumber(value); } }
  graphKeys(rawGroups, [], ["version", "minSize", "maxSize", "maxContextFunctions", "smallPolicy", "costSource", "costPerUnit", "fixedCost"]);
  const clustered = clusterGraph(snapshot, config as unknown as ClusterConfig), grouping = buildInvestigationGroups(snapshot, clustered.partition, rawGroups as Partial<GroupConfig>, { graph: clustered.projection.graph, hubIds: clustered.projection.hubIds });
  return { clustered, grouping };
}
export function prepareGraph(value: unknown, current?: Snapshot): PreparedGraph {
  graphJson(value);
  if (graphObject(value).version === "l8-graph-preparation-v2") return prepareGraphV2(value, current);
  const r = graphKeys(graphCopy(value), ["version", "snapshot", "cluster", "groups", "policy"]);
  graphCheck(r.version === "l8-graph-preparation-v1", "preparation version");
  const snapshot = assertSnapshotContract(r.snapshot); validatePlannerPolicy(r.policy, false);
  const { clustered, grouping } = structural(snapshot, r.cluster, r.groups);
  const planning = planMission(snapshot, grouping.groups, { ...graphObject(r.policy), partitionId: clustered.partition.partitionId } as unknown as PlannerPolicy);
  const content = { version: "l8-prepared-graph-v1" as const, snapshot, partition: clustered.partition, groups: grouping.groups, planning };
  return parsePreparedGraph({ ...content, fingerprint: fingerprint(content) });
}
function validateFileManifest(value: unknown): void {
  graphArray(value);
  for (const item of value) {
    const f = graphKeys(item, ["path", "sha256", "version", "provenance", "kind"], ["approvedForBlind", "identity"]);
    [f.path, f.version, f.provenance].forEach(graphString); graphCheck(typeof f.sha256 === "string" && /^[a-f0-9]{64}$/.test(f.sha256), "source file hash");
    oneOf(f.kind, ["native", "rule", "knowledge", "proposal", "score", "manifest"]);
    if (f.approvedForBlind !== undefined) graphCheck(typeof f.approvedForBlind === "boolean", "source blind approval");
    if (f.identity !== undefined) Object.values(graphKeys(f.identity, ["sha256", "version", "ea"])).forEach(graphString);
  }
}
export function validateExecutionTemplate(value: unknown): asserts value is GraphExecutionTemplate {
  const r = graphKeys(value, ["version", "settings", "workers", "accounts"]); graphCheck(r.version === "l8-execution-template-v1", "execution template version");
  const s = graphKeys(r.settings, ["profiles", "maxConcurrent", "familyTtlEvents", "maxAdmissionAttempts", "retryDelayMs"]);
  Object.values(graphKeys(s.profiles, ["A", "B", "R"])).forEach(graphString);
  graphInteger(s.maxConcurrent, 1); graphInteger(s.familyTtlEvents, 4); graphCheck(s.familyTtlEvents <= 10000, "event lease bound");
  graphInteger(s.maxAdmissionAttempts, 1); graphCheck(s.maxAdmissionAttempts <= 10, "admission retry bound"); graphInteger(s.retryDelayMs);
  graphArray(r.workers); graphArray(r.accounts); const ids = new Set(), accounts = new Set();
  for (const value of r.accounts) { const a = graphKeys(value, ["accountId", "slots", "budget"]); graphString(a.accountId); graphInteger(a.slots); graphInteger(a.budget); graphCheck(!accounts.has(a.accountId), "duplicate account"); accounts.add(a.accountId); }
  for (const value of r.workers) {
    const w = graphKeys(value, ["workerId", "profile", "model", "tools", "accountId", "slots", "cpu", "gpu", "budget", "available"]);
    [w.workerId, w.profile, w.model, w.accountId].forEach(graphString); strings(w.tools); [w.slots, w.cpu, w.gpu, w.budget].forEach(v => graphInteger(v));
    graphCheck(typeof w.available === "boolean" && !ids.has(w.workerId) && accounts.has(w.accountId), "worker/account inventory"); ids.add(w.workerId);
  }
}
function validateInputSource(value: unknown, snapshot: GraphSnapshotV1): asserts value is GraphInputSource {
  const r = graphKeys(value, ["version", "commonInputs", "cycleKnowledge", "inputsByFunction", "accessibleRules", "requiredTools", "publicationsByFunction", "proposalPolicy"]);
  graphCheck(r.version === "l8-input-source-v1" && r.proposalPolicy === "exact-validated-same-function-A+B-v1", "input source version/policy");
  validateFileManifest(r.commonInputs); validateKnowledge(r.cycleKnowledge); strings(r.accessibleRules); strings(r.requiredTools);
  const ids = new Set(snapshot.nodes.map(n => n.id));
  for (const [id, files] of Object.entries(graphObject(r.inputsByFunction))) { graphCheck(ids.has(id), "unknown input source function"); validateFileManifest(files); }
  for (const [id, value] of Object.entries(graphObject(r.publicationsByFunction))) {
    graphCheck(ids.has(id), "unknown publication function"); const p = graphKeys(value, ["artifactId", "artifactKind", "content"]); graphString(p.artifactId); graphString(p.content);
    oneOf(p.artifactKind, ["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"]);
  }
}
function parseAdmissionSource(value: unknown, snapshot: GraphSnapshotV1, partition: ClusterPartition): GraphAdmissionSource {
  const r = graphKeys(value, ["version", "executionTemplate", "executionTemplateFingerprint", "executionSourceSpec", "executionSourceSpecFingerprint", "inputManifestSource", "inputManifestFingerprint", "admissionCodecVersion", "cycle", "budgetEpoch", "context", "allocation"]);
  graphCheck(r.version === "l8-admission-source-v1" && r.admissionCodecVersion === GRAPH_ADMISSION_CODEC, "admission source/codec version"); graphInteger(r.cycle, 1); graphInteger(r.budgetEpoch, 1);
  validateExecutionTemplate(r.executionTemplate); validateInputSource(r.inputManifestSource, snapshot);
  const spec = graphKeys(r.executionSourceSpec, ["version", "templateFingerprint", "models", "binary", "outputDirectory", "rePolicy"]);
  graphCheck(spec.version === "l8-execution-source-v1" && spec.templateFingerprint === fingerprint(r.executionTemplate), "source spec/template relation");
  const models = graphKeys(spec.models, ["A", "B", "R", "explore", "evaluate"]); for (const model of Object.values(models)) Object.values(graphKeys(model, ["providerID", "id", "variant"])).forEach(graphString);
  Object.values(graphKeys(spec.binary, ["sha256", "version"])).forEach(graphString); graphString(spec.outputDirectory);
  graphCheck(/^[a-f0-9]{64}$/.test(String(graphObject(spec.binary).sha256)), "source binary SHA256");
  if (spec.rePolicy !== null) validateREPolicy(spec.rePolicy);
  graphCheck(r.executionTemplateFingerprint === fingerprint(r.executionTemplate) && r.executionSourceSpecFingerprint === fingerprint(spec) && r.inputManifestFingerprint === fingerprint(r.inputManifestSource), "pre-selection source fingerprints");
  const c = graphKeys(r.context, ["version", "missionId", "snapshotId", "snapshotFingerprint", "partitionId", "knowledgeRevision", "missionConfigFingerprint", "executionSpecFingerprint", "inputManifestFingerprint", "admissionCodecVersion", "cycle", "budgetEpoch"]);
  graphCheck(c.version === "planner-admission-context-v1" && c.missionId === snapshot.missionId && c.snapshotId === snapshot.snapshotId && c.snapshotFingerprint === snapshot.normalizedFingerprint && c.partitionId === partition.partitionId && c.knowledgeRevision === snapshot.knowledgeRevision
    && c.executionSpecFingerprint === r.executionSourceSpecFingerprint && c.inputManifestFingerprint === r.inputManifestFingerprint && c.admissionCodecVersion === r.admissionCodecVersion && c.cycle === r.cycle && c.budgetEpoch === r.budgetEpoch, "independent source/current context relation");
  graphCheck(typeof c.missionConfigFingerprint === "string" && /^[a-f0-9]{64}$/.test(c.missionConfigFingerprint), "config fingerprint");
  if (r.allocation !== null) {
    const allocation = graphKeys(r.allocation, ["version", "scope", "executionProfile", "context", "capsByFunction", "fingerprint"]); graphDigest(allocation);
    graphCheck(allocation.version === "complete-admission-cap-v1" && allocation.scope === "one-immutable-run" && allocation.executionProfile === "one-execution-per-subintent-v1" && canonical(allocation.context) === canonical(c), "allocation context/profile mismatch");
  }
  return r as unknown as GraphAdmissionSource;
}
/** Recompute from actual current host inputs; never take allocation.context as current truth. */
export function assertCurrentAdmissionSource(prepared: PreparedGraphV2, current: Snapshot): void {
  const source = prepared.admissionSource, cycle = current.cycles.find(c => c.number === current.cycle); graphCheck(cycle, "current cycle unavailable");
  validateConfig(current.config); const config = current.config, spec = { ...source.executionSourceSpec, models: config.models, binary: config.binary, outputDirectory: config.outputDirectory, rePolicy: config.rePolicy ?? null };
  const input = { ...source.inputManifestSource, commonInputs: config.commonInputs, cycleKnowledge: cycle.knowledge, accessibleRules: config.accessibleRules, requiredTools: config.requiredTools };
  graphCheck(current.missionId === prepared.snapshot.missionId && current.cycle === source.cycle && fingerprint(config) === source.context.missionConfigFingerprint && fingerprint(spec) === source.context.executionSpecFingerprint && fingerprint(input) === source.context.inputManifestFingerprint, "actual current config/spec/input/cycle differs from allocation sources");
  assertAdmissionBudgetBinding(prepared.planning.plan, prepared.planning.sidecar, source.context);
}
export function admissionScopeKey(source: GraphAdmissionSource): string {
  return fingerprint({ version: "l8-budget-scope-v1", missionId: source.context.missionId, cycle: source.cycle, budgetEpoch: source.budgetEpoch, contextFingerprint: fingerprint(source.context), allocationFingerprint: source.allocation?.fingerprint ?? null });
}
function prepareGraphV2(value: unknown, rawCurrent?: Snapshot): PreparedGraphV2 {
  graphCheck(rawCurrent, "v2 planning requires independent actual mission/cycle/config inputs"); graphJson(rawCurrent);
  const current = graphCopy(rawCurrent); validateConfig(current.config);
  const config = current.config, cycle = current.cycles.find(c => c.number === current.cycle);
  graphCheck(config.fixture === true && cycle, "explicit fixture/current cycle required");
  const r = graphKeys(graphCopy(value), ["version", "snapshot", "cluster", "groups", "policy", "executionTemplate", "inputsByFunction", "publicationsByFunction", "budgetEpoch"], ["capsByFunction"]);
  const snapshot = assertSnapshotContract(r.snapshot); graphCheck(snapshot.missionId === current.missionId, "preparation/current mission mismatch");
  validateExecutionTemplate(r.executionTemplate); graphInteger(r.budgetEpoch, 1); validatePlannerPolicy(r.policy, false);
  const { clustered, grouping } = structural(snapshot, r.cluster, r.groups);
  const executionTemplate = graphCopy(r.executionTemplate), executionSourceSpec = { version: "l8-execution-source-v1" as const, templateFingerprint: fingerprint(executionTemplate), models: config.models, binary: config.binary, outputDirectory: config.outputDirectory, rePolicy: config.rePolicy ?? null };
  const inputManifestSource = { version: "l8-input-source-v1" as const, commonInputs: config.commonInputs, cycleKnowledge: cycle.knowledge, inputsByFunction: r.inputsByFunction, accessibleRules: config.accessibleRules, requiredTools: config.requiredTools, publicationsByFunction: r.publicationsByFunction, proposalPolicy: "exact-validated-same-function-A+B-v1" as const };
  validateInputSource(inputManifestSource, snapshot);
  const context = { version: "planner-admission-context-v1" as const, missionId: current.missionId, snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint, partitionId: clustered.partition.partitionId, knowledgeRevision: snapshot.knowledgeRevision,
    missionConfigFingerprint: fingerprint(config), executionSpecFingerprint: fingerprint(executionSourceSpec), inputManifestFingerprint: fingerprint(inputManifestSource), admissionCodecVersion: GRAPH_ADMISSION_CODEC, cycle: current.cycle, budgetEpoch: r.budgetEpoch };
  const allocationContent = r.capsByFunction === undefined ? null : { version: "complete-admission-cap-v1" as const, scope: "one-immutable-run" as const, executionProfile: "one-execution-per-subintent-v1" as const, context: graphCopy(context), capsByFunction: graphObject(r.capsByFunction) };
  const allocation = allocationContent === null ? null : { ...allocationContent, fingerprint: fingerprint(allocationContent) };
  const policy = { ...graphObject(r.policy), partitionId: clustered.partition.partitionId, admissionBudgetMode: "complete-admission-cap-v1", ...(allocation ? { admissionBudget: allocation } : {}) } as unknown as PlannerPolicy;
  const planning = planMission(snapshot, grouping.groups, policy, context); // the ONLY selection/closure pass
  const admissionSource = parseAdmissionSource({ version: "l8-admission-source-v1", executionTemplate, executionTemplateFingerprint: fingerprint(executionTemplate), executionSourceSpec, executionSourceSpecFingerprint: fingerprint(executionSourceSpec), inputManifestSource,
    inputManifestFingerprint: fingerprint(inputManifestSource), admissionCodecVersion: GRAPH_ADMISSION_CODEC, cycle: current.cycle, budgetEpoch: r.budgetEpoch, context, allocation }, snapshot, clustered.partition);
  const content = { version: "l8-prepared-graph-v2" as const, snapshot, partition: clustered.partition, groups: grouping.groups, planning, admissionSource };
  const prepared = parsePreparedGraph({ ...content, fingerprint: fingerprint(content) }); graphCheck(prepared.version === "l8-prepared-graph-v2", "v2 preparation was stripped"); assertCurrentAdmissionSource(prepared, current); return prepared;
}
/** Offline JSON extraction only. No IDA/native backend, cache mutation or network. */
export function prepareGraphParts(parts: GraphParts, options: Omit<GraphPreparation, "snapshot">): PreparedGraph {
  const source = graphCopy(parts); graphKeys(source, ["missionId", "snapshotId", "artifacts", "nodes", "edges", "objects", "unresolved", "capabilities", "knowledgeRevision", "scopeDescription", "coverage", "toolVersions", "configFingerprint"]);
  return prepareGraph({ ...graphCopy(options), snapshot: buildGraphSnapshot(source).snapshot });
}
