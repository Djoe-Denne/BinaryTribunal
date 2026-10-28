import { fingerprint, compareText } from "./validation";
import { compareFunctionId, type SparseGraph } from "./sparse-graph-codecs";
import type { ClusterInput, ClusterPartition, KnownInteger, StructuralMaturity } from "./cluster";
import { prepareGroupContextSource, bindGroupContext, deriveDraftGroupContexts, groupContextContentFingerprint, requireThat } from "./group-context-codecs";
export { DEFAULT_GROUP_CONFIG } from "./group-context-codecs";

export interface InvestigationGroup {
  schemaVersion: 1; groupId: string; partitionId: string; communityContentId: string;
  ownedFunctionIds: string[]; contextFunctionIds: string[]; capabilityIds: string[];
  granularity: "function" | "group" | "subgroup";
  estimatedCost: KnownInteger; uncoveredIds: string[];
  memberMaturity: Array<{ functionId: string; semanticMaturity: StructuralMaturity }>;
}
export interface GroupConfig {
  version: string; minSize: number; maxSize: number; maxContextFunctions: number;
  smallPolicy: "preserve-community" | "attach-adjacent";
  costSource: "instructions" | "bytes"; costPerUnit: number; fixedCost: number;
}
export interface GroupMetrics {
  version: "group-metrics-v1"; configFingerprint: string;
  partitionId: string; snapshotFingerprint: string;
  ownerByFunctionId: Record<string, string>;
  uncoveredOwnerByFunctionId: Record<string, string>;
  uncoveredCommunityByFunctionId: Record<string, string>;
  sourceCommunitiesByGroupId: Record<string, string[]>;
  kernelIdsByGroupId: Record<string, string[]>;
  contextIdListUtf8BytesByGroupId: Record<string, number>;
  omittedContextIdsByGroupId: Record<string, string[]>;
  omittedCommunityContextIds: Record<string, string[]>;
  allCapabilityIdsByGroupId: Record<string, string[]>;
  smallGroupIds: string[]; isolatedIds: string[]; hubIds: string[];
  nonCoveredIds: string[]; coverageStatus: string;
  contextBinding: { version: "group-context-binding-v1"; projectionSource: "provided-affinity" | "raw-active-control-relations"; projectionFingerprint: string; hubSetFingerprint: string; bindingFingerprint: string };
  contentFingerprintByGroupId: Record<string, string>;
  diagnostics: string[];
}
export interface GroupResult { groups: InvestigationGroup[]; metrics: GroupMetrics }
/** Split into balanced deterministic blocks: avoids [max,max,1] when a legal
 * distribution exists. Minimum is a target, not an excuse to exceed maximum.
 */
function split(ids: string[], max: number): string[][] {
  if (!ids.length) return [[]]; const count = Math.ceil(ids.length / max), size = Math.floor(ids.length / count), remainder = ids.length % count;
  const result: string[][] = []; let offset = 0;
  for (let i = 0; i < count; i++) { const length = size + (i < remainder ? 1 : 0); result.push(ids.slice(offset, offset + length)); offset += length; }
  return result;
}
export function buildInvestigationGroups(input: ClusterInput, partition: ClusterPartition,
  overrides: Partial<GroupConfig> = {}, options: { graph?: SparseGraph; hubIds?: string[] } = {}): GroupResult {
  const prepared = prepareGroupContextSource(input, partition, overrides, options.graph ? { kind: "provided-affinity", graph: options.graph } : { kind: "raw-active-control-relations" });
  const { config, nodes, neighbors } = prepared;
  type Draft = { ids: string[]; origins: string[]; uncovered: string[] };
  const drafts: Draft[] = [];
  for (const c of [...partition.communities].sort((a, b) => compareFunctionId(a.memberIds.slice().sort(compareFunctionId)[0]!, b.memberIds.slice().sort(compareFunctionId)[0]!))) {
    const ids = c.kernelIds.slice().sort(compareFunctionId), kernel = new Set(ids), uncovered = c.memberIds.filter(id => !kernel.has(id)).sort(compareFunctionId);
    const chunks = split(ids, config.maxSize); chunks.forEach((chunk, i) => drafts.push({ ids: chunk, origins: [c.contentId], uncovered: i === 0 ? uncovered : [] }));
  }
  const diagnostics: string[] = [];
  if (config.smallPolicy === "attach-adjacent") {
    // One indexed pass; a candidate is found through actual neighbors, not an
    // all-pairs scan over groups. Overlap is context only, ownership never copied.
    const draftById = new Map<string, Draft>(); drafts.forEach(d => d.ids.forEach(id => draftById.set(id, d)));
    for (const draft of drafts) if (draft.ids.length > 0 && draft.ids.length < config.minSize && draft.uncovered.length === 0) {
      const candidates = new Map<Draft, number>(); for (const id of draft.ids) for (const [neighbor, weight] of neighbors.get(id)!) { const candidate = draftById.get(neighbor); if (candidate && candidate !== draft && candidate.ids.length + draft.ids.length <= config.maxSize && candidate.ids.length > 0) candidates.set(candidate, (candidates.get(candidate) ?? 0) + weight); }
      const target = [...candidates].sort((a, b) => b[1] - a[1] || compareFunctionId(a[0].ids[0]!, b[0].ids[0]!))[0]?.[0];
      if (target) { const transferred = [...draft.ids]; target.ids = [...target.ids, ...transferred].sort(compareFunctionId); target.origins = [...new Set([...target.origins, ...draft.origins])].sort(compareText); transferred.forEach(id => draftById.set(id, target)); draft.ids = []; diagnostics.push("cross-community small attachment: full origin list retained in sidecar"); }
    }
  }
  const bound = bindGroupContext(prepared, options.hubIds ?? []);
  const { configFingerprint, contextBinding, omittedCommunityContextIds } = bound;
  const splitCount = new Map<string, number>();
  for (const d of drafts) if (d.ids.length) for (const origin of d.origins) splitCount.set(origin, (splitCount.get(origin) ?? 0) + 1);
  const groups: InvestigationGroup[] = [];
  const metrics: GroupMetrics = { version: "group-metrics-v1", configFingerprint, partitionId: partition.partitionId, snapshotFingerprint: input.normalizedFingerprint, ownerByFunctionId: {}, uncoveredOwnerByFunctionId: {}, uncoveredCommunityByFunctionId: {}, sourceCommunitiesByGroupId: {}, kernelIdsByGroupId: {}, contextIdListUtf8BytesByGroupId: {}, omittedContextIdsByGroupId: {}, omittedCommunityContextIds, allCapabilityIdsByGroupId: {}, smallGroupIds: [], isolatedIds: bound.isolatedIds, hubIds: bound.hubIds, nonCoveredIds: [], coverageStatus: input.coverage.status, contextBinding, contentFingerprintByGroupId: {}, diagnostics };
  const capabilityBySubject = new Map<string, string[]>(); for (const c of input.capabilities) if (c.subjectKind === "function" && nodes.has(c.subjectId)) { if (!capabilityBySubject.has(c.subjectId)) capabilityBySubject.set(c.subjectId, []); capabilityBySubject.get(c.subjectId)!.push(c.id); }
  for (const draft of drafts) {
    if (!draft.ids.length) {
      for (const id of draft.uncovered) metrics.uncoveredCommunityByFunctionId[id] = draft.origins[0]!;
      if (draft.uncovered.length) diagnostics.push("kernel-empty community: uncovered attribution only, no schema-invalid empty investigation group");
      continue;
    }
    const context = deriveDraftGroupContexts(bound, [draft]).byDraft[0]!;
    const { contextFunctionIds, uncoveredIds, sourceCommunities } = context;
    let cost = config.fixedCost, known = draft.ids.length > 0;
    for (const id of draft.ids) { const n = nodes.get(id)!, value = config.costSource === "instructions" ? n.instructionCount : n.sizeBytes;
      requireThat(value.known === (value.value !== null), "cost metric inconsistent");
      if (!value.known) known = false; else { requireThat(Number.isSafeInteger(value.value) && value.value! >= 0, "cost metric invalid"); cost += Math.ceil(value.value! * config.costPerUnit); }
    }
    requireThat(Number.isSafeInteger(cost) && cost >= 0, "cost overflow");
    const primary = sourceCommunities[0]!;
    const groupId = fingerprint({ version: config.version, configFingerprint, partitionId: partition.partitionId, sourceCommunities, ownedFunctionIds: draft.ids, uncoveredIds });
    const allCapabilityIds = [...new Set(draft.ids.flatMap(id => capabilityBySubject.get(id) ?? []))].sort(compareText);
    if (allCapabilityIds.length > 256) diagnostics.push("v1 capabilityIds cap 256: full list preserved in group sidecar");
    const group: InvestigationGroup = { schemaVersion: 1, groupId, partitionId: partition.partitionId, communityContentId: primary, ownedFunctionIds: draft.ids, contextFunctionIds,
      capabilityIds: allCapabilityIds.slice(0, 256), granularity: draft.ids.length === 1 ? "function" : draft.origins.length > 1 || (splitCount.get(primary) ?? 0) > 1 ? "subgroup" : "group",
      estimatedCost: known ? { known: true, value: cost } : { known: false, value: null }, uncoveredIds,
      memberMaturity: draft.ids.map(id => ({ functionId: id, semanticMaturity: nodes.get(id)!.semanticMaturity })) };
    groups.push(group); metrics.sourceCommunitiesByGroupId[groupId] = sourceCommunities; metrics.kernelIdsByGroupId[groupId] = [...draft.ids];
    metrics.allCapabilityIdsByGroupId[groupId] = allCapabilityIds;
    metrics.contextIdListUtf8BytesByGroupId[groupId] = context.contextIdListUtf8Bytes; metrics.omittedContextIdsByGroupId[groupId] = context.omittedContextIds;
    metrics.contentFingerprintByGroupId[groupId] = groupContextContentFingerprint(group, contextBinding, sourceCommunities, allCapabilityIds, metrics.omittedContextIdsByGroupId[groupId]!, omittedCommunityContextIds);
    for (const id of draft.ids) { requireThat(!metrics.ownerByFunctionId[id], "duplicate investigation owner"); metrics.ownerByFunctionId[id] = groupId; }
    for (const id of uncoveredIds) { requireThat(!metrics.uncoveredOwnerByFunctionId[id], "duplicate uncovered attribution"); metrics.uncoveredOwnerByFunctionId[id] = groupId; }
    if (draft.ids.length < config.minSize) metrics.smallGroupIds.push(groupId);
  }
  metrics.nonCoveredIds = [...new Set([...Object.keys(metrics.uncoveredOwnerByFunctionId), ...Object.keys(metrics.uncoveredCommunityByFunctionId)])].sort(compareFunctionId);
  if (metrics.smallGroupIds.length) diagnostics.push("minimum target unsatisfied for isolated/community-preserved/kernel-empty residuals; maximum remains strict");
  if (input.coverage.status !== "complete") diagnostics.push(`snapshot coverage ${input.coverage.status}: ${input.coverage.uncoveredReason ?? "no per-function evidence; unknown scope not fabricated"}`);
  diagnostics.push("context byte metric counts serialized ID list only, not execution envelope");
  diagnostics.push("groupId is logical family identity; L8 content reuse requires contextBinding and per-group contentFingerprint");
  requireThat([...nodes.keys()].every(id => metrics.ownerByFunctionId[id] || metrics.uncoveredOwnerByFunctionId[id] || metrics.uncoveredCommunityByFunctionId[id]), "function silently dropped");
  return { groups, metrics };
}
