// Pure legacy graph codecs and admission checks. No producer or persistence value imports.
import { types as utilTypes } from "node:util";
import { assertSnapshotContract, validateStaticJsonSchema, type GraphSnapshotV1, type StaticJsonSchema } from "./graph";
import { canonical, fingerprint, validateKnowledge, normalizeEA, validateSHA } from "./validation";
import { validateREPolicy } from "./re-policy";
import { invariant } from "./graph-persistence-errors";
import type { GraphAdmissionSource, GraphExecutionTemplate, GraphInputSource, PreparedGraph } from "./domain";
import type { ClusterPartition } from "./cluster";
import type { InvestigationGroup } from "./investigation-groups";
import type { KnowledgeCommit } from "./graph-store";
import type { PlannerResult, MissionPlan, PlannerSidecar, AdmissionBudgetContextV1, PlannerPolicy, AdmissionBudgetInputV1, PlannerGraphInput, AdmissionUnitBudget, UnknownableInteger, WorkUnit } from "./planner";
import graphSnapshotSchema from "../schemas/graph-snapshot-v1.schema.json";
import clusterPartitionSchema from "../schemas/cluster-partition-v1.schema.json";
import workUnitSchema from "../schemas/work-unit-v1.schema.json";
import knowledgeCommitSchema from "../schemas/knowledge-commit-v1.schema.json";
import missionPlanSchema from "../schemas/mission-plan-v1.schema.json";
import investigationGroupSchema from "../schemas/investigation-group-v1.schema.json";

const GRAPH_DOCUMENT_SCHEMAS: Record<string, Record<string, any>> = {
  "graph-snapshot": graphSnapshotSchema, "cluster-partition": clusterPartitionSchema,
  "work-unit": workUnitSchema, "knowledge-commit": knowledgeCommitSchema,
  "mission-plan": missionPlanSchema,
};

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


export function oneOf(value: unknown, choices: readonly unknown[]): void { graphCheck(choices.some(choice => choice === value), "invalid enum value"); }


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


export function strings(value: unknown): void { graphArray(value); value.forEach(graphString); }


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


export function validatePlanning(value: unknown, snapshot: GraphSnapshotV1, partition: ClusterPartition, source?: GraphAdmissionSource): asserts value is PlannerResult {
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
  const schema: StaticJsonSchema = investigationGroupSchema;
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


export function validateInputSource(value: unknown, snapshot: GraphSnapshotV1): asserts value is GraphInputSource {
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


export function parseAdmissionSource(value: unknown, snapshot: GraphSnapshotV1, partition: ClusterPartition): GraphAdmissionSource {
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


export function admissionScopeKey(source: GraphAdmissionSource): string {
  return fingerprint({ version: "l8-budget-scope-v1", missionId: source.context.missionId, cycle: source.cycle, budgetEpoch: source.budgetEpoch, contextFingerprint: fingerprint(source.context), allocationFingerprint: source.allocation?.fingerprint ?? null });
}


export function scientificCommitId(value: KnowledgeCommit): string { const { commitId: _ignored, ...content } = value; return fingerprint(content); }


/** Strict L1 schema subset; no regex dialect or runtime schema dependency. */
export function validateSchema(value: unknown, schema: Record<string, any>, path = "document"): void {
  const match = (type: string) => type === "null" ? value === null : type === "integer" ? Number.isSafeInteger(value) : type === "array" ? Array.isArray(value) : type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : typeof value === type;
  invariant((Array.isArray(schema.type) ? schema.type : [schema.type]).some(match), `${path}: schema type mismatch`, "schema");
  if (schema.enum) invariant(schema.enum.includes(value), `${path}: invalid enumeration`, "schema");
  if (typeof value === "number") invariant((schema.minimum === undefined || value >= schema.minimum) && (schema.maximum === undefined || value <= schema.maximum), `${path}: numeric bounds`, "schema");
  if (typeof value === "string") invariant((schema.minLength === undefined || value.length >= schema.minLength) && (schema.maxLength === undefined || value.length <= schema.maxLength), `${path}: text bounds`, "schema");
  if (Array.isArray(value)) {
    invariant((schema.minItems === undefined || value.length >= schema.minItems) && (schema.maxItems === undefined || value.length <= schema.maxItems), `${path}: array bounds`, "schema");
    value.forEach((v, i) => validateSchema(v, schema.items, `${path}[${i}]`));
  } else if (value !== null && typeof value === "object") {
    const r = value as Record<string, unknown>;
    for (const key of schema.required ?? []) invariant(key in r, `${path}: missing ${key}`, "schema");
    for (const [key, v] of Object.entries(r)) {
      invariant(schema.properties?.[key], `${path}: unexpected ${key}`, "schema"); validateSchema(v, schema.properties[key], `${path}.${key}`);
    }
  }
}


export function validateGraphDocument(kind: string, value: unknown): void {
  invariant(["graph-snapshot", "cluster-partition", "work-unit", "knowledge-commit", "mission-plan"].includes(kind), "unsupported graph document", "schema");
  validateSchema(value, GRAPH_DOCUMENT_SCHEMAS[kind]!);
  if (kind === "knowledge-commit") {
    const commit = value as KnowledgeCommit;
    invariant(/^[a-f0-9]{64}$/.test(commit.commitId) && /^[a-f0-9]{64}$/.test(commit.readbackHash) && commit.commitId === scientificCommitId(commit), "scientific content commitId/hash mismatch", "schema");
    invariant(commit.isGitCommit === false && commit.outputRevision === commit.inputRevision + 1 && [1, 2].includes(commit.publicationLevel), "inadmissible scientific publication", "schema");
    invariant(commit.futurePrerequisiteEffect !== "satisfies" || commit.readbackStatus === "verified", "unverified publication cannot satisfy prerequisites", "schema");
    invariant(!/idb/i.test(commit.publicationTargetId) && !/(?:^|[:/\\])ida(?:[:/\\]|$)/i.test(commit.publicationTargetId), "IDB publication outside mission", "schema");
    invariant(new Set(commit.resultIds).size === commit.resultIds.length && new Set(commit.validatedFactIds).size === commit.validatedFactIds.length, "duplicate scientific publication artifacts", "schema");
  }
}


export function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`planner: ${message}`); }


export function nonempty(s: string): boolean { return typeof s === "string" && s.trim().length > 0; }


export function integer(n: number, minimum = 0): boolean { return Number.isSafeInteger(n) && !Object.is(n, -0) && n >= minimum; }


export function digestDocument(value: object): string { const { fingerprint: _ignored, ...content } = value as Record<string, unknown>; return fingerprint(content); }


const ADMISSION_BUDGET_MODE = "complete-admission-cap-v1" as const;


export const ADMISSION_ACCOUNTING_VERSION = "planner-admission-accounting-v1" as const;


const ADMISSION_POLICY_PREFIX = `${ADMISSION_BUDGET_MODE}:`;


/** Inspect descriptors before cloning: structuredClone would otherwise invoke
 * getters and erase prototypes. Shared JSON subobjects are OK, cycles are not. */
function assertBudgetJson(value: unknown): void {
  const pending: Array<{ value: unknown; exit?: boolean }> = [{ value }];
  const visiting = new Set<object>(), visited = new Set<object>();
  while (pending.length) {
    const item = pending.pop()!, x = item.value;
    if (x === null || typeof x === "string" || typeof x === "boolean") continue;
    if (typeof x === "number") { assert(Number.isFinite(x) && !Object.is(x, -0), "noncanonical admission budget number"); continue; }
    assert(typeof x === "object" && !utilTypes.isProxy(x), "admission budget requires plain JSON data");
    if (item.exit) { visiting.delete(x); visited.add(x); continue; }
    assert(!visiting.has(x), "cyclic admission budget data");
    if (visited.has(x)) continue;
    const proto = Object.getPrototypeOf(x), array = Array.isArray(x);
    assert(array ? proto === Array.prototype : proto === Object.prototype || proto === null, "non-JSON admission budget prototype");
    assert(Object.getOwnPropertySymbols(x).length === 0, "symbol in admission budget data");
    const descriptors = Object.getOwnPropertyDescriptors(x);
    if (array) assert(Object.keys(descriptors).length === x.length + 1, "sparse/non-JSON admission budget array");
    visiting.add(x); pending.push({ value: x, exit: true });
    for (const [key, d] of Object.entries(descriptors)) {
      if (array && key === "length") continue;
      assert("value" in d && d.enumerable, "accessor/non-enumerable admission budget data");
      if (array) assert(/^(0|[1-9][0-9]*)$/.test(key) && Number(key) < x.length, "non-JSON admission budget array key");
      pending.push({ value: d.value });
    }
  }
}


function budgetRecord(value: unknown): asserts value is Record<string, unknown> {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), "admission budget object required");
}


function budgetKeys(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> {
  budgetRecord(value);
  assert(Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k)), "unexpected/missing admission budget keys");
}


export function admissionMode(policy: PlannerPolicy, context?: AdmissionBudgetContextV1): boolean {
  assert(policy && typeof policy === "object" && !utilTypes.isProxy(policy), "invalid admission policy object");
  for (const key of ["admissionBudgetMode", "admissionBudget"]) if (key in policy) {
    const d = Object.getOwnPropertyDescriptor(policy, key);
    assert(d && "value" in d && d.enumerable, "inherited/accessor admission budget field");
  }
  if (!Object.hasOwn(policy, "admissionBudgetMode")) {
    assert(!Object.hasOwn(policy, "admissionBudget") && context === undefined, "allocation/context requires explicit admissionBudgetMode");
    return false;
  }
  assertBudgetJson(policy);
  assert(policy.admissionBudgetMode === ADMISSION_BUDGET_MODE, "unsupported admissionBudgetMode");
  // L1/L6's existing text bound is UTF-16 length, not UTF-8 bytes. Do not
  // truncate or constrain the opaque legacy version namespace.
  assert(typeof policy.version === "string" && policy.version.length <= 32 && policy.version.startsWith(ADMISSION_POLICY_PREFIX)
    && nonempty(policy.version.slice(ADMISSION_POLICY_PREFIX.length)), "new admission policy version required (maximum 32 UTF-16 code units)");
  assert(context !== undefined, "independent current admission budget context required");
  validateAdmissionContext(context);
  return true;
}


function validateAdmissionContext(context: AdmissionBudgetContextV1): void {
  assertBudgetJson(context);
  budgetKeys(context, ["version", "missionId", "snapshotId", "snapshotFingerprint", "partitionId", "knowledgeRevision",
    "missionConfigFingerprint", "executionSpecFingerprint", "inputManifestFingerprint", "admissionCodecVersion", "cycle", "budgetEpoch"]);
  assert(context.version === "planner-admission-context-v1", "unsupported admission budget context version");
  for (const s of [context.missionId, context.snapshotId, context.partitionId, context.admissionCodecVersion]) assert(nonempty(s), "missing admission context identity/codec");
  for (const s of [context.snapshotFingerprint, context.missionConfigFingerprint, context.executionSpecFingerprint, context.inputManifestFingerprint]) {
    assert(typeof s === "string" && /^[a-f0-9]{64}$/.test(s), "noncanonical admission context fingerprint");
  }
  assert(integer(context.knowledgeRevision) && integer(context.cycle, 1) && integer(context.budgetEpoch, 1), "invalid admission context revision/cycle/epoch");
}


export function validateAdmissionAllocation(policy: PlannerPolicy, context: AdmissionBudgetContextV1): AdmissionBudgetInputV1 | undefined {
  const allocation = policy.admissionBudget;
  if (allocation === undefined) return undefined;
  budgetKeys(allocation, ["version", "scope", "executionProfile", "context", "capsByFunction", "fingerprint"]);
  assert(allocation.version === ADMISSION_BUDGET_MODE && allocation.scope === "one-immutable-run"
    && allocation.executionProfile === "one-execution-per-subintent-v1", "unsupported admission allocation contract");
  validateAdmissionContext(allocation.context);
  assert(canonical(allocation.context) === canonical(context), "admission allocation differs from current context");
  assert(typeof allocation.fingerprint === "string" && /^[a-f0-9]{64}$/.test(allocation.fingerprint)
    && allocation.fingerprint === digestDocument(allocation), "admission allocation fingerprint mismatch");
  budgetRecord(allocation.capsByFunction);
  for (const [id, cap] of Object.entries(allocation.capsByFunction)) {
    assert(canonicalOwnershipKey(id) === `fn:${id}`, "noncanonical admission cap function");
    budgetKeys(cap, ["completeBodyMaxUtf8Bytes", "maxNewExecutionsPerRole"]);
    const bytes = cap.completeBodyMaxUtf8Bytes;
    budgetKeys(bytes, ["known", "value"]);
    assert(bytes.known === false ? bytes.value === null : bytes.known === true && integer(bytes.value!, 1), "invalid admission cap/unknown value");
    budgetKeys(cap.maxNewExecutionsPerRole, ["A", "B", "R"]);
    assert(Object.values(cap.maxNewExecutionsPerRole).every(n => n === 1), "admission profile requires exactly one new execution per role");
  }
  return allocation;
}


export function assertAdmissionScope(context: AdmissionBudgetContextV1, graph: Pick<PlannerGraphInput, "missionId" | "snapshotId" | "normalizedFingerprint" | "knowledgeRevision">, policy: PlannerPolicy): void {
  assert(context.missionId === graph.missionId && context.snapshotId === graph.snapshotId && context.snapshotFingerprint === graph.normalizedFingerprint
    && context.knowledgeRevision === graph.knowledgeRevision && context.partitionId === policy.partitionId, "admission context differs from graph/partition/revision");
}


export function admissionUnitBudget(structuralBytes: number, functionIds: readonly string[], allocation: AdmissionBudgetInputV1 | undefined): {
  budget: AdmissionUnitBudget; issues: Array<{ code: string; functionIds: string[]; detail: string }>;
} {
  assert(integer(structuralBytes, 1) && functionIds.length > 0 && functionIds.length <= Math.floor(Number.MAX_SAFE_INTEGER / 3), "admission measurement/count overflow");
  const count = functionIds.length * 3, issues: Array<{ code: string; functionIds: string[]; detail: string }> = [];
  const missing = functionIds.filter(id => !allocation || !Object.hasOwn(allocation.capsByFunction, id));
  const unknown = functionIds.filter(id => allocation && Object.hasOwn(allocation.capsByFunction, id) && !allocation.capsByFunction[id]!.completeBodyMaxUtf8Bytes.known);
  if (missing.length) issues.push({ code: allocation ? "admission-cap-missing" : "admission-allocation-missing", functionIds: missing,
    detail: `${ADMISSION_BUDGET_MODE}: explicit complete-body allocation required; structural size is not a substitute` });
  if (unknown.length) issues.push({ code: "admission-cap-unknown", functionIds: unknown, detail: `${ADMISSION_BUDGET_MODE}: complete-body allocation unknown` });
  let cap: UnknownableInteger = { known: false, value: null }, total: UnknownableInteger = { known: false, value: null };
  if (!issues.length) {
    let bytes = structuralBytes;
    for (const id of functionIds) bytes = Math.max(bytes, allocation!.capsByFunction[id]!.completeBodyMaxUtf8Bytes.value!);
    cap = { known: true, value: bytes };
    if (bytes > Math.floor(Number.MAX_SAFE_INTEGER / count)) issues.push({ code: "admission-budget-overflow", functionIds: [...functionIds], detail: `${ADMISSION_BUDGET_MODE}: C*N exceeds safe integer range` });
    else total = { known: true, value: bytes * count };
  }
  return { budget: { structuralEnvelopeUtf8Bytes: structuralBytes, admissionCapUtf8Bytes: cap,
    // The fixed profile and the actual 2+1 sub-intents already determine N,
    // including when a cap is missing/unknown. SCC passes do not multiply N.
    maxNewExecutions: { known: true, value: count }, totalAdmissionUtf8Bytes: total }, issues };
}


export function canonicalOwnershipKey(functionId: string): string {
  const colon = functionId.lastIndexOf(":");
  const module = functionId.slice(0, colon).toLowerCase(); validateSHA(module);
  return `fn:${module}:${normalizeEA(functionId.slice(colon + 1))}`;
}


export function unitIdentity(functionIds: string[], kind: WorkUnit["investigationKind"]): string {
  return `unit:${fingerprint({ investigationKind: kind, functionIds })}`;
}


export const RELATION_VIEW_VERSION = "planner-relations-v1" as const;


const RELATION_POLICY_VERSION = "planner-relation-policy-v2";


export function planningIdentity(snapshot: string, policy: PlannerPolicy, families: string[][], context?: AdmissionBudgetContextV1): string {
  return `plan:${fingerprint({ snapshot, policy, families, relationViewVersion: RELATION_VIEW_VERSION, relationPolicyVersion: RELATION_POLICY_VERSION,
    ...(context ? { admissionAccountingVersion: ADMISSION_ACCOUNTING_VERSION, admissionBudgetContext: context } : {}) })}`;
}


/** Validate the allocation commitment and its accounting after JSON readback.
 * This is not the triple-document binding or a host/L6 authority proof. In
 * particular, L8 must derive expectedContext from its current validated inputs,
 * and still check the original durable binding and the real snapshot. */
export function assertAdmissionBudgetBinding(plan: MissionPlan, sidecar: PlannerSidecar, expectedContext: AdmissionBudgetContextV1): void {
  assertBudgetJson([plan, sidecar, expectedContext]);
  assert(admissionMode(sidecar.policy, expectedContext), "explicit admission budget mode required");
  const allocation = validateAdmissionAllocation(sidecar.policy, expectedContext);
  assertAdmissionScope(expectedContext, { missionId: plan.missionId, snapshotId: plan.snapshotId,
    normalizedFingerprint: sidecar.snapshotFingerprint, knowledgeRevision: plan.knowledgeRevision }, sidecar.policy);
  assert(plan.schemaVersion === 1 && sidecar.schemaVersion === 1 && plan.fingerprint === digestDocument(plan)
    && sidecar.fingerprint === digestDocument(sidecar), "admission plan/sidecar digest mismatch");
  assert(sidecar.planId === plan.planId && sidecar.planFingerprint === plan.fingerprint && sidecar.policyVersion === plan.policyVersion
    && sidecar.policy.version === plan.policyVersion && sidecar.estimationVersion === plan.estimationVersion
    && sidecar.policy.estimationVersion === plan.estimationVersion && sidecar.knowledgeRevision === plan.knowledgeRevision
    && sidecar.policy.partitionId === plan.partitionId, "incoherent admission planning documents");
  const policy = sidecar.policy, accounting = sidecar.admissionBudget;
  assert(Object.hasOwn(sidecar, "admissionBudget") && accounting, "missing admission accounting");
  budgetKeys(accounting, ["version", "context", "allocationFingerprint", "byUnit", "selectedTotalAdmissionUtf8Bytes"]);
  assert(accounting.version === ADMISSION_ACCOUNTING_VERSION && canonical(accounting.context) === canonical(expectedContext)
    && accounting.allocationFingerprint === (allocation?.fingerprint ?? null), "admission accounting context/allocation/version mismatch");
  assert([policy.contextEnvelopeMaxUtf8Bytes, policy.totalContextBudgetUtf8Bytes, policy.maxSelectedUnits].every(n => integer(n))
    && plan.budgets.contextEnvelopeMaxUtf8Bytes === policy.contextEnvelopeMaxUtf8Bytes, "invalid/inconsistent admission planning bounds");
  assert(Array.isArray(plan.units) && Array.isArray(plan.selectedUnitIds), "invalid admission unit sets");
  const unitIds = plan.units.map(u => u.unitId), selected = new Set(plan.selectedUnitIds);
  assert(new Set(unitIds).size === unitIds.length && selected.size === plan.selectedUnitIds.length
    && selected.size <= policy.maxSelectedUnits, "duplicate/excess admission unit selection");
  budgetKeys(accounting.byUnit, unitIds); budgetKeys(sidecar.unitFingerprints, unitIds);
  const expectedEnvelopes: string[] = [], families: string[][] = [];
  const owned = new Set<string>();
  let total = 0;
  for (const unit of plan.units) {
    assert(Array.isArray(unit.ownedFunctionIds) && unit.ownedFunctionIds.length > 0, "missing admission unit ownership");
    for (const id of unit.ownedFunctionIds) {
      assert(canonicalOwnershipKey(id) === `fn:${id}` && !owned.has(id), "noncanonical/duplicate admission function ownership"); owned.add(id);
    }
    assert(unit.unitId === unitIdentity(unit.ownedFunctionIds, policy.investigationKind), "admission allocation changed family identity");
    families.push(unit.ownedFunctionIds);
    const entry = accounting.byUnit[unit.unitId]!;
    budgetKeys(entry, ["structuralEnvelopeUtf8Bytes", "admissionCapUtf8Bytes", "maxNewExecutions", "totalAdmissionUtf8Bytes"]);
    const { budget } = admissionUnitBudget(entry.structuralEnvelopeUtf8Bytes, unit.ownedFunctionIds, allocation);
    assert(canonical(entry) === canonical(budget), "inconsistent admission S/C/N/T accounting");
    assert(canonical(unit.contextEnvelopeUtf8Bytes) === canonical(budget.admissionCapUtf8Bytes), "plan admission cap differs from accounting");
    if (budget.admissionCapUtf8Bytes.known) {
      expectedEnvelopes.push(unit.unitId);
      assert(sidecar.envelopeBytesByUnit[unit.unitId] === budget.admissionCapUtf8Bytes.value, "sidecar admission cap differs from accounting");
    }
    if (selected.has(unit.unitId)) {
      assert(budget.admissionCapUtf8Bytes.known && budget.admissionCapUtf8Bytes.value! <= policy.contextEnvelopeMaxUtf8Bytes
        && budget.totalAdmissionUtf8Bytes.known && !sidecar.diagnostics.some(d => d.unitId === unit.unitId), "unallocable/diagnostic admission unit selected");
      assert(budget.totalAdmissionUtf8Bytes.value! <= policy.totalContextBudgetUtf8Bytes - total, "admission selection exceeds safe total budget");
      total += budget.totalAdmissionUtf8Bytes.value!;
    }
  }
  budgetKeys(sidecar.envelopeBytesByUnit, expectedEnvelopes);
  assert(plan.selectedUnitIds.every(id => unitIds.includes(id)), "unknown selected admission unit");
  const included = plan.decisions.filter(d => d.action === "include").map(d => d.unitId);
  assert(included.length === selected.size && new Set(included).size === included.length && included.every(id => selected.has(id)), "admission decisions differ from selection");
  for (const p of plan.prerequisites) if (selected.has(p.consumerUnitId) && p.kind === "obligatory" && !p.dispensed) {
    assert(p.producerUnitId !== null && selected.has(p.producerUnitId), "incomplete mandatory admission closure");
  }
  assert(integer(accounting.selectedTotalAdmissionUtf8Bytes) && accounting.selectedTotalAdmissionUtf8Bytes === total, "admission selected total mismatch");
  assert(plan.planId === planningIdentity(sidecar.snapshotFingerprint, policy, families, expectedContext), "admission plan identity changed; explicit replan required");
}

