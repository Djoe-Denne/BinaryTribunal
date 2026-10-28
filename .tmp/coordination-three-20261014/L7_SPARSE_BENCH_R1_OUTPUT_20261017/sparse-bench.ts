/**
 * Source-only synthetic fixture generator; NOT a measured benchmark or a product
 * adapter. No imports, I/O, clock, global RNG, native identifiers or runtime hooks.
 * Numeric IDs and edge directions below have only the local meaning documented
 * in PROTOCOL.md. GraphDocument / SimScenario compatibility is NOT established.
 */

export const SPARSE_CASE_SCHEMA = "synthetic-sparse-case/v1" as const;
export const SPARSE_COMMUNITY_SIZE = 64;
export const SPARSE_MAX_TOTAL_DEGREE = 65;
export const SPARSE_EDGE_BUDGET_PER_NODE = 8;

export type SparseCaseSize = 1000 | 10000 | 100000;
export type SparseEdgeKind = "community" | "hub" | "utility" | "bridge";
export type SparseNodeRole = "member" | "hub" | "utility" | "isolate";
export type SparseResourceId = "general" | "specialist";

export interface SparseCaseRequest {
  readonly size: SparseCaseSize;
  readonly seed: number;
  /** A local allocation opt-in, NOT authorization to execute a large benchmark. */
  readonly allowLarge?: boolean;
}

export interface SparseNode {
  /** Dense, case-local integer ID; never an EA, native ID or product identity. */
  readonly id: number;
  readonly durationTicks: number;
  readonly demand: {
    readonly resourceId: SparseResourceId;
    readonly units: 1;
  };
  readonly planted: {
    readonly provenance: "synthetic-topology-not-native-not-llm";
    readonly community: number | null;
    readonly role: SparseNodeRole;
  };
  readonly semantics: {
    /** A mock prepared description, NOT an investigated/accepted function. */
    readonly status: "prepared-synthetic" | "absent";
    readonly description: string | null;
  };
}

export interface SparseEdge {
  readonly from: number;
  readonly to: number;
  readonly kind: SparseEdgeKind;
}

export interface SparseResource {
  readonly id: SparseResourceId;
  readonly initialCapacity: number;
}

export interface SparseCapacityEvent {
  readonly atTick: number;
  /** Stable total order for simultaneous exogenous events. */
  readonly sequence: number;
  readonly kind: "resource-capacity";
  readonly resourceId: SparseResourceId;
  readonly capacity: number;
}

export interface DegreeFrequency {
  readonly degree: number;
  readonly nodeCount: number;
}

export interface SccSizeFrequency {
  readonly size: number;
  readonly componentCount: number;
}

export interface SparseGraphStatistics {
  readonly nodeCount: number;
  readonly edgeCount: number;
  /** E / (N * (N - 1)); zero for N < 2. No self-edges or parallel pairs. */
  readonly directedDensity: number;
  readonly edgeKindCounts: Readonly<Record<SparseEdgeKind, number>>;
  readonly isolatedNodeCount: number;
  readonly semantifiedNodeCount: number;
  readonly semantifiedProportion: number;
  readonly degrees: {
    readonly maximumIn: number;
    readonly maximumOut: number;
    readonly maximumTotal: number;
    readonly incoming: readonly DegreeFrequency[];
    readonly outgoing: readonly DegreeFrequency[];
    readonly total: readonly DegreeFrequency[];
  };
  readonly scc: {
    readonly componentCount: number;
    readonly nontrivialComponentCount: number;
    readonly cyclicNodeCount: number;
    readonly largestComponentSize: number;
    /** Canonical component ID = minimum dense node ID in that SCC. */
    readonly componentIdByNode: readonly number[];
    readonly sizeDistribution: readonly SccSizeFrequency[];
  };
  /** Structural counters, not CPU, time, allocation or memory measurements. */
  readonly work: {
    readonly validatedEdges: number;
    readonly forwardEdgeVisits: number;
    readonly reverseEdgeVisits: number;
    readonly finishedNodes: number;
    readonly assignedNodes: number;
  };
}

export interface SparseCase {
  readonly schemaVersion: typeof SPARSE_CASE_SCHEMA;
  readonly provenance: "synthetic-only-no-native-validation";
  readonly edgeMeaning: "directed-topology-only-adapter-must-assign-dependency-meaning";
  readonly seed: number;
  readonly size: SparseCaseSize;
  readonly nodes: readonly SparseNode[];
  readonly edges: readonly SparseEdge[];
  readonly resources: readonly SparseResource[];
  /** Exogenous availability changes, not simulated task completions. */
  readonly eventTape: readonly SparseCapacityEvent[];
  readonly statistics: SparseGraphStatistics;
  readonly construction: {
    readonly algorithm: "bounded-community-spokes/v1";
    readonly maximumCommunitySize: 64;
    readonly totalDegreeCap: 65;
    readonly edgeBudgetPerNode: 8;
    readonly communityCount: number;
    readonly activeNodeCount: number;
    readonly reservedIsolateCount: number;
    readonly work: {
      readonly createdNodes: number;
      readonly communityVisits: number;
      readonly localRankVisits: number;
      readonly emittedEdges: number;
    };
  };
}

function ownDataValue(record: object, key: string, required: boolean): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined) {
    if (required) throw new TypeError(`Missing own data property: ${key}`);
    return undefined;
  }
  if (!("value" in descriptor)) {
    throw new TypeError(`Accessors are not accepted: ${key}`);
  }
  return descriptor.value;
}

function validateRequest(input: SparseCaseRequest): {
  size: SparseCaseSize;
  seed: number;
  allowLarge: boolean;
} {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("Request must be a plain data record");
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("Request must have a plain or null prototype");
  }

  // Read descriptors, never user getters. Only fixed-size validation metadata is
  // created here; no node, edge, adjacency, stack or histogram is allocated yet.
  const size = ownDataValue(input, "size", true);
  const seed = ownDataValue(input, "seed", true);
  const allowDescriptor = Object.getOwnPropertyDescriptor(input, "allowLarge");
  const allowValue = ownDataValue(input, "allowLarge", false);
  if (allowDescriptor !== undefined && typeof allowValue !== "boolean") {
    throw new TypeError("allowLarge, when present, must be boolean");
  }
  if (size !== 1000 && size !== 10000 && size !== 100000) {
    throw new RangeError("size must be exactly 1000, 10000 or 100000");
  }
  if (typeof seed !== "number") throw new TypeError("seed must be a uint32 number");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError("seed must be an integer in [0, 4294967295]");
  }
  if (size === 100000 && allowValue !== true) {
    throw new RangeError("100000 nodes require explicit allowLarge=true before graph allocation");
  }

  // This small keys array is created AFTER the large-case refusal above.
  const keys = Reflect.ownKeys(input);
  for (const key of keys) {
    if (key !== "size" && key !== "seed" && key !== "allowLarge") {
      throw new TypeError("Unknown request property");
    }
  }
  return { size, seed: seed >>> 0, allowLarge: allowValue === true };
}

/** Fixed integer mixer, not crypto, a global RNG, or a distribution guarantee. */
function mix32(value: number): number {
  let mixed = value >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x7feb352d);
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x846ca68b);
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

function nodeFor(
  id: number,
  seed: number,
  community: number | null,
  role: SparseNodeRole,
): SparseNode {
  const prepared = id % 4 === 0;
  const resourceId = role === "hub" || role === "utility" ? "specialist" : "general";
  return {
    id,
    durationTicks: 1 + (mix32(seed ^ id) % 31),
    demand: { resourceId, units: 1 },
    planted: {
      provenance: "synthetic-topology-not-native-not-llm",
      community,
      role,
    },
    semantics: {
      status: prepared ? "prepared-synthetic" : "absent",
      description: prepared
        ? `SYNTHETIC ${role}; community=${community === null ? "none" : community}; token=${mix32(seed ^ id ^ 0x9e3779b9) % 8}`
        : null,
    },
  };
}

function degreeFrequencies(histogram: Uint32Array): DegreeFrequency[] {
  const result: DegreeFrequency[] = [];
  for (let degree = 0; degree < histogram.length; degree += 1) {
    const nodeCount = histogram[degree]!;
    if (nodeCount !== 0) result.push({ degree, nodeCount });
  }
  return result;
}

/**
 * Pure, bounded source-neutral summary helper for independent small-graph test
 * oracles. Not a general product graph importer. IDs must be dense [0,N), pairs
 * unique, self-edges absent, E<=8N, total degree<=65, N<=100000. N>10000 needs
 * explicit allowLarge=true BEFORE adjacency/stack allocation, independently of
 * the generator's guard. Valid ordinary data inputs run in O(N+E) time/space.
 */
export function summarizeSparseGraph(
  nodeCount: number,
  edges: readonly SparseEdge[],
  semantifiedNodeCount = 0,
  allowLarge = false,
): SparseGraphStatistics {
  if (!Number.isInteger(nodeCount) || nodeCount < 0 || nodeCount > 100000) {
    throw new RangeError("Summary nodeCount must be an integer in [0, 100000]");
  }
  if (typeof allowLarge !== "boolean") throw new TypeError("allowLarge must be boolean");
  if (nodeCount > 10000 && !allowLarge) {
    throw new RangeError("Summary above 10000 nodes requires allowLarge=true before graph allocation");
  }
  if (!Array.isArray(edges)) throw new TypeError("Summary edges must be an array");
  if (edges.length > SPARSE_EDGE_BUDGET_PER_NODE * nodeCount) {
    throw new RangeError("Summary edge budget E<=8N exceeded");
  }
  if (
    !Number.isInteger(semantifiedNodeCount) ||
    semantifiedNodeCount < 0 ||
    semantifiedNodeCount > nodeCount
  ) {
    throw new RangeError("semantifiedNodeCount must be an integer in [0,N]");
  }

  const outgoing: number[][] = new Array<number[]>(nodeCount);
  const incoming: number[][] = new Array<number[]>(nodeCount);
  for (let node = 0; node < nodeCount; node += 1) {
    outgoing[node] = [];
    incoming[node] = [];
  }
  const edgeKindCounts: Record<SparseEdgeKind, number> = {
    community: 0, hub: 0, utility: 0, bridge: 0,
  };
  let validatedEdges = 0;
  for (const edge of edges) {
    if (typeof edge !== "object" || edge === null) throw new TypeError("Invalid edge record");
    const { from, to, kind } = edge;
    if (
      !Number.isInteger(from) || !Number.isInteger(to) ||
      from < 0 || to < 0 || from >= nodeCount || to >= nodeCount
    ) {
      throw new RangeError("Invalid edge endpoint");
    }
    if (from === to) throw new RangeError("Self-edges are outside this fixture contract");
    if (kind !== "community" && kind !== "hub" && kind !== "utility" && kind !== "bridge") {
      throw new TypeError("Invalid synthetic edge kind");
    }
    const fromOutgoing = outgoing[from]!;
    const fromIncoming = incoming[from]!;
    const toOutgoing = outgoing[to]!;
    const toIncoming = incoming[to]!;
    // Check cap BEFORE includes: the duplicate scan is bounded by 65, not N.
    if (
      fromOutgoing.length + fromIncoming.length >= SPARSE_MAX_TOTAL_DEGREE ||
      toOutgoing.length + toIncoming.length >= SPARSE_MAX_TOTAL_DEGREE
    ) {
      throw new RangeError("Total degree cap 65 exceeded");
    }
    if (fromOutgoing.includes(to)) throw new RangeError("Duplicate directed endpoint pair");
    fromOutgoing.push(to);
    toIncoming.push(from);
    edgeKindCounts[kind] += 1;
    validatedEdges += 1;
  }

  const incomingHistogram = new Uint32Array(SPARSE_MAX_TOTAL_DEGREE + 1);
  const outgoingHistogram = new Uint32Array(SPARSE_MAX_TOTAL_DEGREE + 1);
  const totalHistogram = new Uint32Array(SPARSE_MAX_TOTAL_DEGREE + 1);
  let maximumIn = 0;
  let maximumOut = 0;
  let maximumTotal = 0;
  let isolatedNodeCount = 0;
  for (let node = 0; node < nodeCount; node += 1) {
    const inDegree = incoming[node]!.length;
    const outDegree = outgoing[node]!.length;
    const totalDegree = inDegree + outDegree;
    incomingHistogram[inDegree] = incomingHistogram[inDegree]! + 1;
    outgoingHistogram[outDegree] = outgoingHistogram[outDegree]! + 1;
    totalHistogram[totalDegree] = totalHistogram[totalDegree]! + 1;
    maximumIn = Math.max(maximumIn, inDegree);
    maximumOut = Math.max(maximumOut, outDegree);
    maximumTotal = Math.max(maximumTotal, totalDegree);
    if (totalDegree === 0) isolatedNodeCount += 1;
  }

  // Iterative Kosaraju pass 1. Explicit per-frame next-edge cursors avoid both
  // recursion and repeated neighbor rescans on unwind.
  const visited = new Uint8Array(nodeCount);
  const finishOrder: number[] = [];
  const dfsNodes: number[] = [];
  const dfsNext: number[] = [];
  let forwardEdgeVisits = 0;
  for (let root = 0; root < nodeCount; root += 1) {
    if (visited[root] !== 0) continue;
    visited[root] = 1;
    dfsNodes.push(root);
    dfsNext.push(0);
    while (dfsNodes.length !== 0) {
      const top = dfsNodes.length - 1;
      const node = dfsNodes[top]!;
      const next = dfsNext[top]!;
      const neighbors = outgoing[node]!;
      if (next < neighbors.length) {
        const neighbor = neighbors[next]!;
        dfsNext[top] = next + 1;
        forwardEdgeVisits += 1;
        if (visited[neighbor] === 0) {
          visited[neighbor] = 1;
          dfsNodes.push(neighbor);
          dfsNext.push(0);
        }
      } else {
        finishOrder.push(node);
        dfsNodes.pop();
        dfsNext.pop();
      }
    }
  }

  // Iterative transpose pass. Each SCC is relabeled by minimum node ID so its
  // IDs do not depend on adjacency insertion order or a locale-dependent sort.
  const componentIdByNode: number[] = new Array<number>(nodeCount).fill(-1);
  const sizeHistogram = new Uint32Array(nodeCount + 1);
  const stack: number[] = [];
  let componentCount = 0;
  let nontrivialComponentCount = 0;
  let cyclicNodeCount = 0;
  let largestComponentSize = 0;
  let reverseEdgeVisits = 0;
  let assignedNodes = 0;
  for (let index = finishOrder.length - 1; index >= 0; index -= 1) {
    const root = finishOrder[index]!;
    if (componentIdByNode[root] !== -1) continue;
    const members: number[] = [];
    let minimum = root;
    componentIdByNode[root] = root;
    stack.push(root);
    while (stack.length !== 0) {
      const node = stack.pop()!;
      members.push(node);
      minimum = Math.min(minimum, node);
      assignedNodes += 1;
      for (const neighbor of incoming[node]!) {
        reverseEdgeVisits += 1;
        if (componentIdByNode[neighbor] === -1) {
          componentIdByNode[neighbor] = root;
          stack.push(neighbor);
        }
      }
    }
    for (const member of members) componentIdByNode[member] = minimum;
    const size = members.length;
    sizeHistogram[size] = sizeHistogram[size]! + 1;
    componentCount += 1;
    largestComponentSize = Math.max(largestComponentSize, size);
    if (size > 1) {
      nontrivialComponentCount += 1;
      cyclicNodeCount += size;
    }
  }
  const sizeDistribution: SccSizeFrequency[] = [];
  // One N-sized histogram scan, not sorting or comparing component pairs.
  for (let size = 1; size <= nodeCount; size += 1) {
    const count = sizeHistogram[size]!;
    if (count !== 0) sizeDistribution.push({ size, componentCount: count });
  }

  return {
    nodeCount,
    edgeCount: edges.length,
    directedDensity: nodeCount < 2 ? 0 : edges.length / (nodeCount * (nodeCount - 1)),
    edgeKindCounts,
    isolatedNodeCount,
    semantifiedNodeCount,
    semantifiedProportion: nodeCount === 0 ? 0 : semantifiedNodeCount / nodeCount,
    degrees: {
      maximumIn, maximumOut, maximumTotal,
      incoming: degreeFrequencies(incomingHistogram),
      outgoing: degreeFrequencies(outgoingHistogram),
      total: degreeFrequencies(totalHistogram),
    },
    scc: {
      componentCount, nontrivialComponentCount, cyclicNodeCount, largestComponentSize,
      componentIdByNode, sizeDistribution,
    },
    work: {
      validatedEdges, forwardEdgeVisits, reverseEdgeVisits,
      finishedNodes: finishOrder.length, assignedNodes,
    },
  };
}

/**
 * Deterministic bounded-neighborhood synthesis, followed by O(N+E) statistics.
 * The request is validated, including large-case admission, BEFORE graph arrays.
 */
export function generateSparseCase(request: SparseCaseRequest): SparseCase {
  const { size, seed, allowLarge } = validateRequest(request);
  const reservedIsolateCount = Math.floor(size / SPARSE_COMMUNITY_SIZE);
  const activeNodeCount = size - reservedIsolateCount;
  const nodes: SparseNode[] = new Array<SparseNode>(size);
  const edges: SparseEdge[] = [];
  let previousUtility = -1;
  let communityCount = 0;
  let createdNodes = 0;
  let localRankVisits = 0;
  let semantifiedNodeCount = 0;

  for (let base = 0; base < activeNodeCount; base += SPARSE_COMMUNITY_SIZE) {
    const length = Math.min(SPARSE_COMMUNITY_SIZE, activeNodeCount - base);
    // For the three admitted sizes the final block has 25, 52 or 6 nodes.
    if (length < 3) throw new Error("Internal sparse block invariant violated");
    const community = communityCount;
    const topologyBits = mix32(seed ^ community);
    const rotation = topologyBits % length;
    const direction = (topologyBits & 0x80000000) === 0 ? 1 : -1;
    const position = (rank: number): number =>
      base + ((rotation + direction * rank + length) % length);
    const hub = position(0);
    const utility = position(1);
    if (previousUtility !== -1) {
      edges.push({ from: previousUtility, to: hub, kind: "bridge" });
    }

    for (let rank = 0; rank < length; rank += 1) {
      const id = position(rank);
      const role: SparseNodeRole = rank === 0 ? "hub" : rank === 1 ? "utility" : "member";
      nodes[id] = nodeFor(id, seed, community, role);
      createdNodes += 1;
      if (nodes[id]!.semantics.status === "prepared-synthetic") semantifiedNodeCount += 1;
      localRankVisits += 1;

      // One ring plus at most two spokes per source. The last ring edge already
      // targets the hub, so omitting that hub spoke makes endpoint pairs unique.
      edges.push({ from: id, to: position((rank + 1) % length), kind: "community" });
      if (rank >= 2 && rank < length - 1) edges.push({ from: id, to: hub, kind: "hub" });
      if (rank >= 2) edges.push({ from: id, to: utility, kind: "utility" });
    }
    previousUtility = utility;
    communityCount += 1;
  }
  for (let id = activeNodeCount; id < size; id += 1) {
    nodes[id] = nodeFor(id, seed, null, "isolate");
    createdNodes += 1;
    if (nodes[id]!.semantics.status === "prepared-synthetic") semantifiedNodeCount += 1;
  }
  if (edges.length > SPARSE_EDGE_BUDGET_PER_NODE * size) {
    throw new Error("Internal sparse edge budget invariant violated");
  }
  const statistics = summarizeSparseGraph(size, edges, semantifiedNodeCount, allowLarge);

  // New plain arrays/records per case. All policies must use this same canonical
  // case (or independently verified unchanged clones), never policy-local draws.
  const resources: SparseResource[] = [
    { id: "general", initialCapacity: 4 },
    { id: "specialist", initialCapacity: 2 },
  ];
  const eventTape: SparseCapacityEvent[] = [
    { atTick: 0, sequence: 0, kind: "resource-capacity", resourceId: "general", capacity: 4 },
    { atTick: 0, sequence: 1, kind: "resource-capacity", resourceId: "specialist", capacity: 2 },
    { atTick: 100, sequence: 2, kind: "resource-capacity", resourceId: "general", capacity: 2 },
    { atTick: 140, sequence: 3, kind: "resource-capacity", resourceId: "specialist", capacity: 1 },
    { atTick: 260, sequence: 4, kind: "resource-capacity", resourceId: "general", capacity: 4 },
    { atTick: 300, sequence: 5, kind: "resource-capacity", resourceId: "specialist", capacity: 2 },
  ];
  return {
    schemaVersion: SPARSE_CASE_SCHEMA,
    provenance: "synthetic-only-no-native-validation",
    edgeMeaning: "directed-topology-only-adapter-must-assign-dependency-meaning",
    seed, size, nodes, edges, resources, eventTape, statistics,
    construction: {
      algorithm: "bounded-community-spokes/v1",
      maximumCommunitySize: 64,
      totalDegreeCap: 65,
      edgeBudgetPerNode: 8,
      communityCount, activeNodeCount, reservedIsolateCount,
      work: { createdNodes, communityVisits: communityCount, localRankVisits, emittedEdges: edges.length },
    },
  };
}
