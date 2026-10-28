import { fingerprint, compareText } from "./validation";
import { compareFunctionId, reconcileClusterRelations, sparseGraph, type ClusterInput, type ClusterPartition, type KnownInteger, type SparseGraph, type StructuralMaturity } from "./cluster";

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
/** Costs are explicit ordinal work estimates, NOT measured tokens/time/bytes of
 * an execution envelope. Unknown source metrics keep unknown estimatedCost.
 * Community-preserving default refuses cross-community provenance loss.
 */
export const DEFAULT_GROUP_CONFIG: Readonly<GroupConfig> = Object.freeze({
  version: "heuristic-group-cost-v1", minSize: 2, maxSize: 8,
  maxContextFunctions: 64, smallPolicy: "preserve-community",
  costSource: "instructions", costPerUnit: 1, fixedCost: 1,
});
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
function requireThat(value: unknown, detail: string): asserts value {
  if (!value) throw new Error(`investigation-groups: ${detail}`);
}
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
  const config = { ...DEFAULT_GROUP_CONFIG, ...overrides };
  for (const key of ["minSize", "maxSize", "maxContextFunctions", "fixedCost"] as const) requireThat(Number.isSafeInteger(config[key]) && config[key] >= (key === "minSize" || key === "maxSize" ? 1 : 0), key);
  requireThat(config.minSize <= config.maxSize, "minimum exceeds maximum");
  requireThat(config.maxSize <= 100000 && config.maxContextFunctions <= 100000, "v1 group transport bounds");
  requireThat(config.version.length > 0 && Number.isFinite(config.costPerUnit) && config.costPerUnit >= 0 && !Object.is(config.costPerUnit, -0) && !Object.is(config.fixedCost, -0), "version/cost");
  requireThat(["instructions", "bytes"].includes(config.costSource), "cost source");
  requireThat(["preserve-community", "attach-adjacent"].includes(config.smallPolicy), "small policy");
  requireThat(input.nodes.length > 0 && partition.communities.length > 0, "empty snapshot/partition: no v1 partition exists; do not synthesize empty groups");
  requireThat(partition.schemaVersion === 1 && partition.snapshotId === input.snapshotId && partition.snapshotFingerprint === input.normalizedFingerprint, "partition snapshot binding");
  const nodes = new Map(input.nodes.map(n => [n.id, n])); requireThat(nodes.size === input.nodes.length, "duplicate node");
  const membership = new Map<string, string>(), communities = new Map(partition.communities.map(c => [c.contentId, c]));
  requireThat(communities.size === partition.communities.length, "duplicate community");
  for (const c of partition.communities) {
    requireThat(c.memberIds.length > 0 && new Set(c.memberIds).size === c.memberIds.length, "empty/duplicate members");
    const members = new Set(c.memberIds); requireThat(new Set(c.kernelIds).size === c.kernelIds.length && c.kernelIds.every(id => members.has(id)), "kernel outside membership");
    requireThat(new Set(c.externalContextIds).size === c.externalContextIds.length && c.externalContextIds.every(id => nodes.has(id) && !members.has(id)), "invalid context");
    for (const id of c.memberIds) { requireThat(nodes.has(id) && !membership.has(id), "partition unknown/duplicate owner"); membership.set(id, c.contentId); }
  }
  requireThat(membership.size === nodes.size, "partition missing function");
  const neighbors = new Map<string, Map<string, number>>(); for (const id of nodes.keys()) neighbors.set(id, new Map());
  const addNeighbor = (a: string, b: string, weight: number) => { if (a === b) return; const map = neighbors.get(a)!; map.set(b, (map.get(b) ?? 0) + weight); };
  // Reconcile before any live/callback filter, including when a supplied graph
  // bypasses fallback adjacency. L2 transport validation alone does not establish
  // relation-wide coherence, and these projections never validate native evidence.
  const relations = reconcileClusterRelations(input);
  if (options.graph) {
    const supplied = options.graph;
    requireThat(supplied.ids.length === nodes.size && new Set(supplied.ids).size === nodes.size && supplied.ids.every(id => nodes.has(id)), "projection node binding");
    // Normalize order/duplicates before adjacency summation and content binding.
    // out/incoming caches on a supplied graph are not used as independent proof.
    const sortedIds = [...supplied.ids].sort(compareFunctionId), index = new Map(sortedIds.map((id, i) => [id, i]));
    const validated = sparseGraph(supplied.ids, supplied.arcs);
    const g = sparseGraph(sortedIds, validated.arcs.map(a => ({ source: index.get(validated.ids[a.source]!)!, target: index.get(validated.ids[a.target]!)!, weight: a.weight })));
    for (const a of g.arcs) { addNeighbor(g.ids[a.source]!, g.ids[a.target]!, a.weight); addNeighbor(g.ids[a.target]!, g.ids[a.source]!, a.weight); }
  } else {
    for (const e of relations) {
      if (e.kind === "callback_candidate" || e.status === "invalidated" || e.retiredInRevision !== null) continue;
      addNeighbor(e.sourceId, e.destinationId, 1); addNeighbor(e.destinationId, e.sourceId, 1);
    }
  }
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
  const configFingerprint = fingerprint(config), groups: InvestigationGroup[] = [];
  const hubSet = new Set(options.hubIds ?? []); requireThat([...hubSet].every(id => nodes.has(id)), "unknown hub");
  /** groupId is a stable logical investigation family, NOT an artifact digest.
   * L8 freezes/reuses bytes only with contextBinding + contentFingerprint. Bind
   * the actual symmetrized adjacency consumed (not transport site multiplicity),
   * source selection, hub ranking set, snapshot, partition and group config.
   * No arbitrary renaming of owned work when derived context changes.
   */
  const projectionSource = options.graph ? "provided-affinity" as const : "raw-active-control-relations" as const;
  const projectionFingerprint = fingerprint({ version: "group-adjacency-v1", nodes: [...nodes.keys()].sort(compareFunctionId),
    adjacency: [...neighbors].sort((a, b) => compareFunctionId(a[0], b[0])).map(([id, links]) => [id, [...links].sort((a, b) => compareFunctionId(a[0], b[0]))]) });
  const hubSetFingerprint = fingerprint([...hubSet].sort(compareFunctionId));
  const contextBinding: GroupMetrics["contextBinding"] = { version: "group-context-binding-v1", projectionSource, projectionFingerprint, hubSetFingerprint,
    bindingFingerprint: fingerprint({ version: "group-context-binding-v1", projectionSource, projectionFingerprint, hubSetFingerprint, snapshotFingerprint: input.normalizedFingerprint, partitionId: partition.partitionId, configFingerprint }) };
  const contextRank = (a: string, b: string) => Number(hubSet.has(b)) - Number(hubSet.has(a)) || compareFunctionId(a, b);
  const contextByCommunity = new Map<string, string[]>(), splitCount = new Map<string, number>();
  const omittedCommunityContextIds: Record<string, string[]> = {};
  for (const c of communities.values()) { const ranked = [...c.externalContextIds].sort(contextRank); contextByCommunity.set(c.contentId, ranked.slice(0, config.maxContextFunctions)); omittedCommunityContextIds[c.contentId] = ranked.slice(config.maxContextFunctions).sort(compareFunctionId); }
  for (const d of drafts) if (d.ids.length) for (const origin of d.origins) splitCount.set(origin, (splitCount.get(origin) ?? 0) + 1);
  const metrics: GroupMetrics = { version: "group-metrics-v1", configFingerprint, partitionId: partition.partitionId, snapshotFingerprint: input.normalizedFingerprint, ownerByFunctionId: {}, uncoveredOwnerByFunctionId: {}, uncoveredCommunityByFunctionId: {}, sourceCommunitiesByGroupId: {}, kernelIdsByGroupId: {}, contextIdListUtf8BytesByGroupId: {}, omittedContextIdsByGroupId: {}, omittedCommunityContextIds, allCapabilityIdsByGroupId: {}, smallGroupIds: [], isolatedIds: [...nodes.keys()].filter(id => neighbors.get(id)!.size === 0).sort(compareFunctionId), hubIds: [...hubSet].sort(compareFunctionId), nonCoveredIds: [], coverageStatus: input.coverage.status, contextBinding, contentFingerprintByGroupId: {}, diagnostics };
  const capabilityBySubject = new Map<string, string[]>(); for (const c of input.capabilities) if (c.subjectKind === "function" && nodes.has(c.subjectId)) { if (!capabilityBySubject.has(c.subjectId)) capabilityBySubject.set(c.subjectId, []); capabilityBySubject.get(c.subjectId)!.push(c.id); }
  for (const draft of drafts) {
    if (!draft.ids.length) {
      for (const id of draft.uncovered) metrics.uncoveredCommunityByFunctionId[id] = draft.origins[0]!;
      if (draft.uncovered.length) diagnostics.push("kernel-empty community: uncovered attribution only, no schema-invalid empty investigation group");
      continue;
    }
    const own = new Set(draft.ids), context = new Set<string>();
    // Shared community context is truncated once, not scanned in full for every
    // subgroup; omissions are lossless once-per-community in the sidecar.
    for (const origin of draft.origins) for (const id of contextByCommunity.get(origin)!) if (!own.has(id)) context.add(id);
    for (const id of draft.ids) for (const neighbor of neighbors.get(id)!.keys()) if (!own.has(neighbor)) context.add(neighbor);
    const ranked = [...context].sort(contextRank);
    const contextFunctionIds = ranked.slice(0, config.maxContextFunctions).sort(compareFunctionId);
    const uncoveredIds = [...new Set([...draft.uncovered, ...draft.ids.filter(id => nodes.get(id)!.status !== "observed" || nodes.get(id)!.functionClass === "incomplete")])].sort(compareFunctionId);
    let cost = config.fixedCost, known = draft.ids.length > 0;
    for (const id of draft.ids) { const n = nodes.get(id)!, value = config.costSource === "instructions" ? n.instructionCount : n.sizeBytes;
      requireThat(value.known === (value.value !== null), "cost metric inconsistent");
      if (!value.known) known = false; else { requireThat(Number.isSafeInteger(value.value) && value.value! >= 0, "cost metric invalid"); cost += Math.ceil(value.value! * config.costPerUnit); }
    }
    requireThat(Number.isSafeInteger(cost) && cost >= 0, "cost overflow");
    const sourceCommunities = [...draft.origins].sort(compareText), primary = sourceCommunities[0]!;
    const groupId = fingerprint({ version: config.version, configFingerprint, partitionId: partition.partitionId, sourceCommunities, ownedFunctionIds: draft.ids, uncoveredIds });
    const allCapabilityIds = [...new Set(draft.ids.flatMap(id => capabilityBySubject.get(id) ?? []))].sort(compareText);
    if (allCapabilityIds.length > 256) diagnostics.push("v1 capabilityIds cap 256: full list preserved in group sidecar");
    const group: InvestigationGroup = { schemaVersion: 1, groupId, partitionId: partition.partitionId, communityContentId: primary, ownedFunctionIds: draft.ids, contextFunctionIds,
      capabilityIds: allCapabilityIds.slice(0, 256), granularity: draft.ids.length === 1 ? "function" : draft.origins.length > 1 || (splitCount.get(primary) ?? 0) > 1 ? "subgroup" : "group",
      estimatedCost: known ? { known: true, value: cost } : { known: false, value: null }, uncoveredIds,
      memberMaturity: draft.ids.map(id => ({ functionId: id, semanticMaturity: nodes.get(id)!.semanticMaturity })) };
    groups.push(group); metrics.sourceCommunitiesByGroupId[groupId] = sourceCommunities; metrics.kernelIdsByGroupId[groupId] = [...draft.ids];
    metrics.allCapabilityIdsByGroupId[groupId] = allCapabilityIds;
    metrics.contextIdListUtf8BytesByGroupId[groupId] = Buffer.byteLength(JSON.stringify(contextFunctionIds), "utf8"); metrics.omittedContextIdsByGroupId[groupId] = ranked.slice(config.maxContextFunctions).sort(compareFunctionId);
    metrics.contentFingerprintByGroupId[groupId] = fingerprint({ version: "group-artifact-content-v1", contextBinding, group, sourceCommunities, allCapabilityIds,
      omittedContextIds: metrics.omittedContextIdsByGroupId[groupId], omittedCommunityContextIds: sourceCommunities.map(id => [id, omittedCommunityContextIds[id]]) });
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
