// Pure source adjacency and fixed-membership context transforms. Prepared values
// are synchronous internal working data, not serialized validation receipts.
import { fingerprint, compareText } from "./validation";
import { compareFunctionId, reconcileClusterRelations, sparseGraph, validateSparseGraph, type SparseGraph } from "./sparse-graph-codecs";
import type { ClusterInput, ClusterNode } from "./cluster";
import type { GroupConfig, GroupMetrics, InvestigationGroup } from "./investigation-groups";

/** Only fields actually consumed here: no regime-A producer partition type. */
export interface GroupContextCommunity {
  contentId: string; memberIds: readonly string[]; kernelIds: readonly string[];
  externalContextIds: readonly string[];
}
export interface GroupContextPartition {
  schemaVersion: 1; partitionId: string; snapshotId: string; snapshotFingerprint: string;
  communities: readonly GroupContextCommunity[];
}
export type GroupAdjacencySource = { kind: "raw-active-control-relations" } | { kind: "provided-affinity"; graph: SparseGraph };
export interface PreparedGroupContextSource {
  input: ClusterInput; partition: GroupContextPartition; config: GroupConfig;
  nodes: Map<string, ClusterNode>; communities: Map<string, GroupContextCommunity>;
  membership: Map<string, string>; neighbors: Map<string, Map<string, number>>;
  source: GroupAdjacencySource; numericBinding: string | null;
}
export interface BoundGroupContextSource extends PreparedGroupContextSource {
  configFingerprint: string; hubSet: Set<string>; contextBinding: GroupMetrics["contextBinding"];
  contextRank: (a: string, b: string) => number;
  contextByCommunity: Map<string, string[]>; omittedCommunityContextIds: Record<string, string[]>;
  isolatedIds: string[]; hubIds: string[];
}
export interface GroupContextDraft { ids: string[]; origins: string[]; uncovered: string[] }
export interface FixedGroupOwnership { groupId: string; ownedFunctionIds: string[] }
export interface DerivedDraftGroupContext {
  sourceCommunities: string[]; contextFunctionIds: string[]; uncoveredIds: string[];
  omittedContextIds: string[]; contextIdListUtf8Bytes: number;
}
export interface GroupContextDerivation {
  byDraft: Array<DerivedDraftGroupContext | null>; splitCount: Map<string, number>;
  uncoveredCommunityByFunctionId: Record<string, string>;
}
export type FixedGroupContextMetrics = Pick<GroupMetrics, "version" | "configFingerprint" | "partitionId" | "snapshotFingerprint" | "ownerByFunctionId" | "uncoveredOwnerByFunctionId" | "uncoveredCommunityByFunctionId" | "sourceCommunitiesByGroupId" | "kernelIdsByGroupId" | "contextIdListUtf8BytesByGroupId" | "omittedContextIdsByGroupId" | "omittedCommunityContextIds" | "isolatedIds" | "hubIds" | "nonCoveredIds" | "coverageStatus" | "contextBinding">;
export interface FixedGroupContextDerivation {
  contexts: Array<DerivedDraftGroupContext & { groupId: string }>;
  metrics: FixedGroupContextMetrics;
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
/** Internal shared leaf; remaining producer callers retain their refusal text. */
export function requireThat(value: unknown, detail: string): asserts value {
  if (!value) throw new Error(`investigation-groups: ${detail}`);
}

export function prepareGroupContextSource(input: ClusterInput, partition: GroupContextPartition,
  overrides: Partial<GroupConfig>, source: GroupAdjacencySource): PreparedGroupContextSource {
  // An explicit affinity source never falls back to raw if its graph is absent.
  requireThat(source !== null && typeof source === "object" && (source.kind === "raw-active-control-relations" || source.kind === "provided-affinity"), "context adjacency source");
  if (source.kind === "provided-affinity") requireThat(source.graph !== undefined && source.graph !== null, "provided affinity graph missing");
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
  let numericBinding: string | null = null;
  if (source.kind === "provided-affinity") {
    const supplied = source.graph;
    validateSparseGraph(supplied);
    requireThat(supplied.ids.length === nodes.size && new Set(supplied.ids).size === nodes.size && supplied.ids.every(id => nodes.has(id)), "projection node binding");
    // Normalize order/duplicates before adjacency summation and content binding.
    // Numeric source and all caches were checked together; this is consistency,
    // not native proof. The heuristic adjacency uses canonical rounded weights,
    // while its content binding also covers the retained original summands.
    const sortedIds = [...supplied.ids].sort(compareFunctionId), index = new Map(sortedIds.map((id, i) => [id, i]));
    const g = sparseGraph(sortedIds, (supplied.numericSource?.arcs ?? supplied.arcs).map(a => ({ source: index.get(supplied.ids[a.source]!)!, target: index.get(supplied.ids[a.target]!)!, weight: a.weight })), { maxNumericSourceArcs: supplied.numericSource?.maxArcs });
    numericBinding = g.numericPolicy!.bindingFingerprint;
    for (const a of g.arcs) { addNeighbor(g.ids[a.source]!, g.ids[a.target]!, a.weight); addNeighbor(g.ids[a.target]!, g.ids[a.source]!, a.weight); }
  } else {
    for (const e of relations) {
      if (e.kind === "callback_candidate" || e.status === "invalidated" || e.retiredInRevision !== null) continue;
      addNeighbor(e.sourceId, e.destinationId, 1); addNeighbor(e.destinationId, e.sourceId, 1);
    }
  }
  return { input, partition, config, nodes, communities, membership, neighbors, source, numericBinding };
}

export function bindGroupContext(source: PreparedGroupContextSource, hubIds: readonly string[]): BoundGroupContextSource {
  const { input, partition, config, nodes, neighbors, numericBinding, communities } = source;
  const options = { hubIds };
  const configFingerprint = fingerprint(config);
  const hubSet = new Set(options.hubIds ?? []); requireThat([...hubSet].every(id => nodes.has(id)), "unknown hub");
  /** groupId is a stable logical investigation family, NOT an artifact digest.
   * L8 freezes/reuses bytes only with contextBinding + contentFingerprint. Bind
   * the actual symmetrized adjacency consumed (not transport site multiplicity),
   * source selection, hub ranking set, snapshot, partition and group config.
   * No arbitrary renaming of owned work when derived context changes.
   */
  const projectionSource = source.source.kind;
  const projectionFingerprint = fingerprint({ version: "group-adjacency-v2", numericBinding, nodes: [...nodes.keys()].sort(compareFunctionId),
    adjacency: [...neighbors].sort((a, b) => compareFunctionId(a[0], b[0])).map(([id, links]) => [id, [...links].sort((a, b) => compareFunctionId(a[0], b[0]))]) });
  const hubSetFingerprint = fingerprint([...hubSet].sort(compareFunctionId));
  const contextBinding: GroupMetrics["contextBinding"] = { version: "group-context-binding-v1", projectionSource, projectionFingerprint, hubSetFingerprint,
    bindingFingerprint: fingerprint({ version: "group-context-binding-v1", projectionSource, projectionFingerprint, hubSetFingerprint, snapshotFingerprint: input.normalizedFingerprint, partitionId: partition.partitionId, configFingerprint }) };
  const contextRank = (a: string, b: string) => Number(hubSet.has(b)) - Number(hubSet.has(a)) || compareFunctionId(a, b);
  const contextByCommunity = new Map<string, string[]>();
  const omittedCommunityContextIds: Record<string, string[]> = {};
  for (const c of communities.values()) { const ranked = [...c.externalContextIds].sort(contextRank); contextByCommunity.set(c.contentId, ranked.slice(0, config.maxContextFunctions)); omittedCommunityContextIds[c.contentId] = ranked.slice(config.maxContextFunctions).sort(compareFunctionId); }
  return { ...source, configFingerprint, hubSet, contextBinding, contextRank, contextByCommunity, omittedCommunityContextIds,
    isolatedIds: [...nodes.keys()].filter(id => neighbors.get(id)!.size === 0).sort(compareFunctionId), hubIds: [...hubSet].sort(compareFunctionId) };
}

/** Shared context core. Producer drafts are already chosen; no splitting or attachment. */
export function deriveDraftGroupContexts(source: BoundGroupContextSource, drafts: readonly GroupContextDraft[]): GroupContextDerivation {
  const { nodes, neighbors, config, contextRank, contextByCommunity } = source;
  const splitCount = new Map<string, number>();
  for (const d of drafts) if (d.ids.length) for (const origin of d.origins) splitCount.set(origin, (splitCount.get(origin) ?? 0) + 1);
  const byDraft: Array<DerivedDraftGroupContext | null> = [], uncoveredCommunityByFunctionId: Record<string, string> = {};
  for (const draft of drafts) {
    if (!draft.ids.length) {
      for (const id of draft.uncovered) uncoveredCommunityByFunctionId[id] = draft.origins[0]!;
      byDraft.push(null); continue;
    }
    const own = new Set(draft.ids), context = new Set<string>();
    // Shared community context is truncated once, not scanned in full for every
    // subgroup; omissions are lossless once-per-community in the sidecar.
    for (const origin of draft.origins) for (const id of contextByCommunity.get(origin)!) if (!own.has(id)) context.add(id);
    for (const id of draft.ids) for (const neighbor of neighbors.get(id)!.keys()) if (!own.has(neighbor)) context.add(neighbor);
    const ranked = [...context].sort(contextRank);
    const contextFunctionIds = ranked.slice(0, config.maxContextFunctions).sort(compareFunctionId);
    const uncoveredIds = [...new Set([...draft.uncovered, ...draft.ids.filter(id => nodes.get(id)!.status !== "observed" || nodes.get(id)!.functionClass === "incomplete")])].sort(compareFunctionId);
    const sourceCommunities = [...draft.origins].sort(compareText);
    byDraft.push({ sourceCommunities, contextFunctionIds, uncoveredIds,
      omittedContextIds: ranked.slice(config.maxContextFunctions).sort(compareFunctionId),
      contextIdListUtf8Bytes: Buffer.byteLength(JSON.stringify(contextFunctionIds), "utf8") });
  }
  return { byDraft, splitCount, uncoveredCommunityByFunctionId };
}

/** NEW, parent-ratified fixed-ownership adapter, not a byte-exact producer move.
 * Origins/uncovered come from partition membership and fixed owners, never claims
 * in group metrics. The first sorted kernel carries non-kernel members because
 * the producer's first chunk does, and a draft with uncovered work cannot attach.
 */
export function deriveFixedGroupContexts(source: BoundGroupContextSource, groups: readonly FixedGroupOwnership[]): FixedGroupContextDerivation {
  const { nodes, communities, membership, input, partition } = source;
  requireThat(Array.isArray(groups) && groups.length > 0, "fixed groups empty");
  const kernels = new Set<string>(); for (const c of communities.values()) for (const id of c.kernelIds) kernels.add(id);
  const groupIds = new Set<string>(), ownerIndex = new Map<string, number>();
  const drafts: GroupContextDraft[] = groups.map((group: FixedGroupOwnership, groupIndex: number) => {
    requireThat(group !== null && typeof group === "object" && !Array.isArray(group), "fixed group object");
    requireThat(typeof group.groupId === "string" && group.groupId.length > 0 && !groupIds.has(group.groupId), "fixed group ID empty/duplicate"); groupIds.add(group.groupId);
    requireThat(Array.isArray(group.ownedFunctionIds) && group.ownedFunctionIds.length > 0, "fixed group empty ownership");
    for (const id of group.ownedFunctionIds) {
      requireThat(nodes.has(id) && kernels.has(id), "fixed owner unknown/non-kernel");
      requireThat(!ownerIndex.has(id), "duplicate investigation owner"); ownerIndex.set(id, groupIndex);
    }
    const origins = [...new Set(group.ownedFunctionIds.map(id => membership.get(id)!))].sort(compareText);
    return { ids: [...group.ownedFunctionIds], origins, uncovered: [] };
  });
  requireThat(ownerIndex.size === kernels.size, "fixed groups missing kernel owner");
  for (const c of communities.values()) {
    const kernel = new Set(c.kernelIds), uncovered = c.memberIds.filter(id => !kernel.has(id)).sort(compareFunctionId);
    if (!c.kernelIds.length) { drafts.push({ ids: [], origins: [c.contentId], uncovered }); continue; }
    const firstKernel = [...c.kernelIds].sort(compareFunctionId)[0]!;
    drafts[ownerIndex.get(firstKernel)!]!.uncovered.push(...uncovered);
  }
  const derived = deriveDraftGroupContexts(source, drafts);
  const metrics: FixedGroupContextMetrics = { version: "group-metrics-v1", configFingerprint: source.configFingerprint, partitionId: partition.partitionId, snapshotFingerprint: input.normalizedFingerprint,
    ownerByFunctionId: {}, uncoveredOwnerByFunctionId: {}, uncoveredCommunityByFunctionId: derived.uncoveredCommunityByFunctionId,
    sourceCommunitiesByGroupId: Object.create(null), kernelIdsByGroupId: Object.create(null), contextIdListUtf8BytesByGroupId: Object.create(null), omittedContextIdsByGroupId: Object.create(null),
    omittedCommunityContextIds: source.omittedCommunityContextIds, isolatedIds: source.isolatedIds, hubIds: source.hubIds, nonCoveredIds: [], coverageStatus: input.coverage.status, contextBinding: source.contextBinding };
  const contexts = groups.map((group: FixedGroupOwnership, i: number) => {
    const context = derived.byDraft[i]!;
    metrics.sourceCommunitiesByGroupId[group.groupId] = context.sourceCommunities;
    metrics.kernelIdsByGroupId[group.groupId] = [...group.ownedFunctionIds];
    metrics.contextIdListUtf8BytesByGroupId[group.groupId] = context.contextIdListUtf8Bytes;
    metrics.omittedContextIdsByGroupId[group.groupId] = context.omittedContextIds;
    for (const id of group.ownedFunctionIds) metrics.ownerByFunctionId[id] = group.groupId;
    for (const id of context.uncoveredIds) { requireThat(!metrics.uncoveredOwnerByFunctionId[id], "duplicate uncovered attribution"); metrics.uncoveredOwnerByFunctionId[id] = group.groupId; }
    return { groupId: group.groupId, ...context };
  });
  metrics.nonCoveredIds = [...new Set([...Object.keys(metrics.uncoveredOwnerByFunctionId), ...Object.keys(metrics.uncoveredCommunityByFunctionId)])].sort(compareFunctionId);
  requireThat([...nodes.keys()].every(id => metrics.ownerByFunctionId[id] || metrics.uncoveredOwnerByFunctionId[id] || metrics.uncoveredCommunityByFunctionId[id]), "function silently dropped");
  return { contexts, metrics };
}

/** Fixed membership boundary only. This is the PARTITION-context source role;
 * a raw GROUP-adjacency source cannot certify affinity-derived partition context.
 */
export function deriveCommunityContextIds(g: SparseGraph, memberGroups: readonly (readonly string[])[]): string[][] {
  validateSparseGraph(g);
  const index = new Map(g.ids.map((id, i) => [id, i]));
  return memberGroups.map(memberIds => {
    requireThat(new Set(memberIds).size === memberIds.length && memberIds.every(id => index.has(id)), "community context unknown/duplicate member");
    const c = memberIds.map(id => index.get(id)!), own = new Set(c), context = new Set<number>();
    for (const i of c) for (const j of new Set([...g.out[i]!.keys(), ...g.incoming[i]!.keys()])) if (!own.has(j)) context.add(j);
    return [...context].sort((a, b) => a - b).map(i => g.ids[i]!);
  });
}

export function groupContextContentFingerprint(group: InvestigationGroup, contextBinding: GroupMetrics["contextBinding"], sourceCommunities: readonly string[],
  allCapabilityIds: readonly string[], omittedContextIds: readonly string[], omittedCommunityContextIds: Readonly<Record<string, string[]>>): string {
  return fingerprint({ version: "group-artifact-content-v1", contextBinding, group, sourceCommunities, allCapabilityIds,
    omittedContextIds, omittedCommunityContextIds: sourceCommunities.map(id => [id, omittedCommunityContextIds[id]]) });
}
