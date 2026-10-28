import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PreparedGraph } from "./domain";
import { assertSnapshotContract, validateStaticJsonSchema, type GraphSnapshotV1, type StaticJsonSchema } from "./graph";
import { buildGraphSnapshot, type GraphParts } from "./graph-normalize";
import { clusterGraph, type ClusterConfig, type ClusterPartition } from "./cluster";
import { buildInvestigationGroups, type GroupConfig, type InvestigationGroup } from "./investigation-groups";
import { planMission, type PlannerPolicy, type PlannerResult } from "./planner";
import { validateGraphDocument } from "./graph-store";
import { canonical, fingerprint } from "./validation";

export type GraphPreparation = {
  version: "l8-graph-preparation-v1"; snapshot: GraphSnapshotV1; cluster: ClusterConfig;
  groups: Partial<GroupConfig>; policy: Omit<PlannerPolicy, "partitionId">;
};
type JsonObject = Record<string, unknown>;
export function graphCheck(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`graph: ${message}`);
}
export function graphObject(value: unknown): JsonObject {
  graphCheck(value !== null && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value)), "plain object required");
  return value as JsonObject;
}
/** Exact own-key checks, including optional fields. Never use inherited ID lookups. */
export function graphKeys(value: unknown, required: string[], optional: string[] = []): JsonObject {
  const object = graphObject(value), allowed = new Set([...required, ...optional]);
  graphCheck(required.every(key => Object.hasOwn(object, key)) && Object.keys(object).every(key => allowed.has(key)), "unknown or missing field");
  return object;
}
export function graphString(value: unknown): asserts value is string { graphCheck(typeof value === "string" && value.trim().length > 0, "nonempty string required"); }
export function graphInteger(value: unknown, minimum = 0): asserts value is number { graphCheck(Number.isSafeInteger(value) && Number(value) >= minimum, "invalid integer"); }
export function graphNumber(value: unknown): asserts value is number { graphCheck(typeof value === "number" && Number.isFinite(value) && value >= 0, "invalid finite nonnegative number"); }
function oneOf(value: unknown, choices: readonly unknown[]): void { graphCheck(choices.some(choice => choice === value), "invalid enum value"); }
export function graphArray(value: unknown): asserts value is unknown[] { graphCheck(Array.isArray(value), "array required"); }
export function graphJson(value: unknown): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") { graphCheck(Number.isFinite(value), "nonfinite JSON number"); return; }
  if (Array.isArray(value)) { value.forEach(graphJson); return; }
  const object = graphObject(value); Object.values(object).forEach(graphJson);
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
function resource(value: unknown): void {
  const r = graphKeys(value, ["profiles", "models", "tools", "accounts", "slots", "cpu", "gpu", "budget"]);
  [r.profiles, r.models, r.tools, r.accounts].forEach(strings);
  [r.slots, r.cpu, r.gpu, r.budget].forEach(x => graphInteger(x));
}
export function validatePlannerPolicy(value: unknown, partition = true): void {
  const r = graphKeys(value, ["version", "estimationVersion", ...(partition ? ["partitionId"] : []), "investigationKind", "artifactKind", "publicationLevel", "contextEnvelopeMaxUtf8Bytes", "totalContextBudgetUtf8Bytes", "maxSelectedUnits", "sccMaxFunctions", "sccMaxIterations", "sccCostBudget", "requirementsByFunction", "estimatesByFunction", "resourcesByFunction"], ["edgeKinds", "dispensationsByEdge", "externalReceiptsByEdge", "extraConflictsByFunction"]);
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
  if (r.externalReceiptsByEdge !== undefined) dictionary(r.externalReceiptsByEdge, receipt);
  if (r.extraConflictsByFunction !== undefined) dictionary(r.extraConflictsByFunction, value => { graphArray(value); value.forEach(v => { const x = graphKeys(v, ["id", "kind", "resourceKey", "withUnitId"]); [x.id, x.kind, x.resourceKey].forEach(graphString); if (x.withUnitId !== null) graphString(x.withUnitId); }); });
}
function diagnostic(value: unknown): void {
  const r = graphKeys(value, ["code", "unitId", "functionIds", "detail"]); graphString(r.code); graphString(r.detail); if (r.unitId !== null) graphString(r.unitId); strings(r.functionIds);
}
function validatePlanning(value: unknown, snapshot: GraphSnapshotV1, partition: ClusterPartition): asserts value is PlannerResult {
  const r = graphKeys(value, ["plan", "units", "sidecar", "diagnostics", "binding"]);
  validateGraphDocument("mission-plan", r.plan); graphDigest(r.plan);
  graphArray(r.units); r.units.forEach(unit => validateGraphDocument("work-unit", unit));
  const plan = graphObject(r.plan), side = graphKeys(r.sidecar, ["schemaVersion", "policyVersion", "estimationVersion", "planId", "planFingerprint", "snapshotFingerprint", "knowledgeRevision", "policy", "relationView", "requirementById", "dispensationById", "externalReceiptById", "localOrders", "estimatesByUnit", "resourcesByUnit", "envelopeBytesByUnit", "unitFingerprints", "diagnostics", "fingerprint"]);
  graphCheck(side.schemaVersion === 1, "sidecar version"); graphDigest(side); validatePlannerPolicy(side.policy);
  const relations = graphKeys(side.relationView, ["version", "relations"]); graphCheck(relations.version === "planner-relations-v1", "relation view version"); graphArray(relations.relations);
  const sites = (value: unknown): void => { graphArray(value); for (const site of value) { const s = graphKeys(site, ["siteRva", "xrefType", "provenance"]); graphString(s.siteRva); oneOf(s.xrefType, ["code", "data"]); const p = graphKeys(s.provenance, ["moduleSha256", "siteRva", "siteKind", "xrefType", "source", "sourceVersion", "sourceHash", "evidenceSha256"]); for (const key of ["moduleSha256", "source", "sourceVersion", "sourceHash", "evidenceSha256"]) graphString(p[key]); if (p.siteRva !== null) graphString(p.siteRva); oneOf(p.siteKind, ["instruction", "object", "import", "table", "extractor"]); oneOf(p.xrefType, ["code", "data", "none"]); } };
  for (const relation of relations.relations) {
    const x = graphKeys(relation, ["relationId", "sourceId", "destinationId", "kind", "sourceEdgeIds", "sites", "observations"]);
    [x.relationId, x.sourceId, x.destinationId, x.kind].forEach(graphString); strings(x.sourceEdgeIds); sites(x.sites); graphArray(x.observations);
    for (const observation of x.observations) { const o = graphKeys(observation, ["metadata", "sourceEdgeIds", "sites", "sitesBySourceEdgeId"]); strings(o.sourceEdgeIds); sites(o.sites); dictionary(o.sitesBySourceEdgeId, sites); graphKeys(o.metadata, [], ["status", "confidence", "direction", "schemaVersion", "appearedInRevision", "retiredInRevision", "schedulerRelevance"]); }
  }
  dictionary(side.requirementById, requirement); dictionary(side.dispensationById, dispensation); dictionary(side.externalReceiptById, receipt);
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
}
export function parsePreparedGraph(value: unknown): PreparedGraph {
  graphJson(value); const copy = graphCopy(value), r = graphKeys(copy, ["version", "snapshot", "partition", "groups", "planning", "fingerprint"]);
  graphCheck(r.version === "l8-prepared-graph-v1", "prepared graph version"); graphDigest(r);
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
  validatePlanning(r.planning, snapshot, partition);
  return r as unknown as PreparedGraph;
}
export function prepareGraph(value: unknown): PreparedGraph {
  graphJson(value); const r = graphKeys(graphCopy(value), ["version", "snapshot", "cluster", "groups", "policy"]);
  graphCheck(r.version === "l8-graph-preparation-v1", "preparation version");
  const snapshot = assertSnapshotContract(r.snapshot), config = graphKeys(r.cluster, ["algorithm"], ["weights", "maxCommunitySize", "seedIds", "seedCapabilityIds", "ppr", "leiden"]);
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
  graphKeys(r.groups, [], ["version", "minSize", "maxSize", "maxContextFunctions", "smallPolicy", "costSource", "costPerUnit", "fixedCost"]);
  validatePlannerPolicy(r.policy, false);
  const clustered = clusterGraph(snapshot, config as unknown as ClusterConfig), grouping = buildInvestigationGroups(snapshot, clustered.partition, r.groups as Partial<GroupConfig>, { graph: clustered.projection.graph, hubIds: clustered.projection.hubIds });
  const planning = planMission(snapshot, grouping.groups, { ...graphObject(r.policy), partitionId: clustered.partition.partitionId } as unknown as PlannerPolicy);
  const content = { version: "l8-prepared-graph-v1" as const, snapshot, partition: clustered.partition, groups: grouping.groups, planning };
  return parsePreparedGraph({ ...content, fingerprint: fingerprint(content) });
}
/** Offline JSON extraction only. No IDA/native backend, cache mutation or network. */
export function prepareGraphParts(parts: GraphParts, options: Omit<GraphPreparation, "snapshot">): PreparedGraph {
  const source = graphCopy(parts); graphKeys(source, ["missionId", "snapshotId", "artifacts", "nodes", "edges", "objects", "unresolved", "capabilities", "knowledgeRevision", "scopeDescription", "coverage", "toolVersions", "configFingerprint"]);
  return prepareGraph({ ...graphCopy(options), snapshot: buildGraphSnapshot(source).snapshot });
}
