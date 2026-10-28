import { graphCheck, graphObject, graphKeys, graphString, graphInteger, graphNumber, oneOf, graphJson, graphCopy, strings, validatePlannerPolicy, parsePreparedGraph, validateExecutionTemplate, validateInputSource, parseAdmissionSource, GRAPH_ADMISSION_CODEC } from "./graph-pure-codecs";
export { graphCheck, graphObject, graphKeys, graphString, graphInteger, graphNumber, graphArray, graphJson, graphCopy, graphFreeze, graphDigest, assertReceiptCoherence, validatePlannerPolicy, parsePreparedGraph, validateExecutionTemplate, admissionScopeKey, GRAPH_ADMISSION_CODEC } from "./graph-pure-codecs";
import type { GraphAdmissionSource, GraphExecutionTemplate, GraphInputSource, GraphRunV1, PreparedGraph, PreparedGraphV1, PreparedGraphV2, Snapshot } from "./domain";
import { assertSnapshotContract, type GraphSnapshotV1 } from "./graph";
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
/** Recompute from actual current host inputs; never take allocation.context as current truth. */
export function assertCurrentAdmissionSource(prepared: PreparedGraphV2, current: Snapshot): void {
  const source = prepared.admissionSource, cycle = current.cycles.find(c => c.number === current.cycle); graphCheck(cycle, "current cycle unavailable");
  validateConfig(current.config); const config = current.config, spec = { ...source.executionSourceSpec, models: config.models, binary: config.binary, outputDirectory: config.outputDirectory, rePolicy: config.rePolicy ?? null };
  const input = { ...source.inputManifestSource, commonInputs: config.commonInputs, cycleKnowledge: cycle.knowledge, accessibleRules: config.accessibleRules, requiredTools: config.requiredTools };
  graphCheck(current.missionId === prepared.snapshot.missionId && current.cycle === source.cycle && fingerprint(config) === source.context.missionConfigFingerprint && fingerprint(spec) === source.context.executionSpecFingerprint && fingerprint(input) === source.context.inputManifestFingerprint, "actual current config/spec/input/cycle differs from allocation sources");
  assertAdmissionBudgetBinding(prepared.planning.plan, prepared.planning.sidecar, source.context);
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
