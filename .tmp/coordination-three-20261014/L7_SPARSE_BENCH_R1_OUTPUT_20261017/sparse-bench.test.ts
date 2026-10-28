/**
 * TEST SOURCES ONLY: authored, not compiled, imported or executed by this worker.
 * Node built-ins + the adjacent NEW source only; no product / FS / DB imports.
 * Counts, SCCs, degree histograms and tape expectations below are closed oracles,
 * NOT outputs of a second generator/summary call. Repeat calls are used only for
 * explicit determinism / independent-result-ownership properties.
 */
import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateSparseCase,
  summarizeSparseGraph,
  SPARSE_CASE_SCHEMA,
  SPARSE_MAX_TOTAL_DEGREE,
  type SparseCase,
  type SparseCaseRequest,
  type SparseEdge,
} from "./sparse-bench.js";

function asRequest(value: unknown): SparseCaseRequest {
  return value as SparseCaseRequest;
}

/** Bounded neighbor checks, NOT an N-by-N endpoint matrix or all-pairs scan. */
function assertEndpointsAndDegreeCap(value: SparseCase): void {
  const outgoing: number[][] = Array.from({ length: value.size }, () => []);
  const incoming: number[] = new Array<number>(value.size).fill(0);
  for (const edge of value.edges) {
    assert.ok(Number.isInteger(edge.from) && Number.isInteger(edge.to));
    assert.ok(edge.from >= 0 && edge.from < value.size);
    assert.ok(edge.to >= 0 && edge.to < value.size);
    assert.notEqual(edge.from, edge.to);
    const neighbors = outgoing[edge.from]!;
    assert.ok(neighbors.length < SPARSE_MAX_TOTAL_DEGREE);
    assert.equal(neighbors.includes(edge.to), false, "unique directed endpoint pair, regardless of kind");
    neighbors.push(edge.to);
    incoming[edge.to] = incoming[edge.to]! + 1;
  }
  for (let node = 0; node < value.size; node += 1) {
    assert.equal(value.nodes[node]!.id, node, "dense unique case-local IDs");
    assert.ok(outgoing[node]!.length + incoming[node]! <= 65);
    if (node >= value.construction.activeNodeCount) {
      assert.equal(outgoing[node]!.length + incoming[node]!, 0);
    }
  }
}

describe("closed independent summary oracles", () => {
  it("two known two-node SCCs, one directed bridge, and one isolated node", () => {
    // Closed graph: {0 <-> 1} -> {2 <-> 3}, plus {4}.
    const edges: readonly SparseEdge[] = Object.freeze([
      Object.freeze({ from: 0, to: 1, kind: "community" as const }),
      Object.freeze({ from: 1, to: 0, kind: "community" as const }),
      Object.freeze({ from: 1, to: 2, kind: "bridge" as const }),
      Object.freeze({ from: 2, to: 3, kind: "community" as const }),
      Object.freeze({ from: 3, to: 2, kind: "community" as const }),
    ]);
    const result = summarizeSparseGraph(5, edges, 2);
    assert.equal(result.nodeCount, 5);
    assert.equal(result.edgeCount, 5);
    assert.equal(result.directedDensity, 1 / 4);
    assert.equal(result.isolatedNodeCount, 1);
    assert.equal(result.semantifiedNodeCount, 2);
    assert.equal(result.semantifiedProportion, 2 / 5);
    assert.deepStrictEqual(result.edgeKindCounts, { community: 4, hub: 0, utility: 0, bridge: 1 });
    assert.deepStrictEqual(result.degrees, {
      maximumIn: 2,
      maximumOut: 2,
      maximumTotal: 3,
      incoming: [
        { degree: 0, nodeCount: 1 },
        { degree: 1, nodeCount: 3 },
        { degree: 2, nodeCount: 1 },
      ],
      outgoing: [
        { degree: 0, nodeCount: 1 },
        { degree: 1, nodeCount: 3 },
        { degree: 2, nodeCount: 1 },
      ],
      total: [
        { degree: 0, nodeCount: 1 },
        { degree: 2, nodeCount: 2 },
        { degree: 3, nodeCount: 2 },
      ],
    });
    assert.deepStrictEqual(result.scc, {
      componentCount: 3,
      nontrivialComponentCount: 2,
      cyclicNodeCount: 4,
      largestComponentSize: 2,
      componentIdByNode: [0, 0, 2, 2, 4],
      sizeDistribution: [
        { size: 1, componentCount: 1 },
        { size: 2, componentCount: 2 },
      ],
    });
    assert.deepStrictEqual(result.work, {
      validatedEdges: 5, forwardEdgeVisits: 5, reverseEdgeVisits: 5,
      finishedNodes: 5, assignedNodes: 5,
    });
    assert.equal(Object.isFrozen(edges), true, "input remains frozen and unchanged");
    assert.deepStrictEqual(edges[2], { from: 1, to: 2, kind: "bridge" });
  });

  it("canonical SCC IDs do not depend on input adjacency ordering", () => {
    const reordered: SparseEdge[] = [
      { from: 3, to: 2, kind: "community" },
      { from: 1, to: 2, kind: "bridge" },
      { from: 2, to: 3, kind: "community" },
      { from: 1, to: 0, kind: "community" },
      { from: 0, to: 1, kind: "community" },
    ];
    const result = summarizeSparseGraph(5, reordered, 2);
    assert.deepStrictEqual(result.scc.componentIdByNode, [0, 0, 2, 2, 4]);
    assert.deepStrictEqual(result.scc.sizeDistribution, [
      { size: 1, componentCount: 1 }, { size: 2, componentCount: 2 },
    ]);
  });

  it("empty graph and isolated singleton have defined density and SCCs", () => {
    const empty = summarizeSparseGraph(0, []);
    assert.equal(empty.directedDensity, 0);
    assert.equal(empty.semantifiedProportion, 0);
    assert.equal(empty.scc.componentCount, 0);
    assert.equal(empty.scc.largestComponentSize, 0);
    assert.deepStrictEqual(empty.scc.componentIdByNode, []);
    assert.deepStrictEqual(empty.scc.sizeDistribution, []);
    const singleton = summarizeSparseGraph(1, [], 1);
    assert.equal(singleton.directedDensity, 0);
    assert.equal(singleton.semantifiedProportion, 1);
    assert.equal(singleton.isolatedNodeCount, 1);
    assert.equal(singleton.scc.nontrivialComponentCount, 0);
    assert.equal(singleton.scc.largestComponentSize, 1);
    assert.deepStrictEqual(singleton.scc.componentIdByNode, [0]);
    assert.deepStrictEqual(singleton.scc.sizeDistribution, [{ size: 1, componentCount: 1 }]);
  });

  it("a three-node chain is acyclic; a three-node ring is one bounded cycle", () => {
    const chain = summarizeSparseGraph(3, [
      { from: 0, to: 1, kind: "bridge" },
      { from: 1, to: 2, kind: "bridge" },
    ]);
    assert.equal(chain.scc.componentCount, 3);
    assert.equal(chain.scc.cyclicNodeCount, 0);
    assert.deepStrictEqual(chain.scc.componentIdByNode, [0, 1, 2]);
    const ring = summarizeSparseGraph(3, [
      { from: 0, to: 1, kind: "community" },
      { from: 1, to: 2, kind: "community" },
      { from: 2, to: 0, kind: "community" },
    ]);
    assert.equal(ring.scc.componentCount, 1);
    assert.equal(ring.scc.cyclicNodeCount, 3);
    assert.equal(ring.scc.largestComponentSize, 3);
    assert.deepStrictEqual(ring.scc.componentIdByNode, [0, 0, 0]);
  });

  it("uses an explicit traversal for a 10000-node deep chain", () => {
    const edges: SparseEdge[] = Array.from({ length: 9999 }, (_, index) => ({
      from: index, to: index + 1, kind: "bridge",
    }));
    const result = summarizeSparseGraph(10000, edges);
    assert.equal(result.scc.componentCount, 10000);
    assert.equal(result.scc.cyclicNodeCount, 0);
    assert.equal(result.scc.largestComponentSize, 1);
    assert.deepStrictEqual(result.scc.sizeDistribution, [{ size: 1, componentCount: 10000 }]);
    assert.equal(result.work.forwardEdgeVisits, 9999);
    assert.equal(result.work.reverseEdgeVisits, 9999);
    for (let node = 0; node < 10000; node += 1) {
      assert.equal(result.scc.componentIdByNode[node], node);
    }
  });

  it("rejects invalid endpoints, self-edges, duplicate pairs, kinds and density budget", () => {
    assert.throws(() => summarizeSparseGraph(2, [{ from: 0, to: 2, kind: "bridge" }]), /endpoint/);
    assert.throws(() => summarizeSparseGraph(2, [{ from: -1, to: 1, kind: "bridge" }]), /endpoint/);
    assert.throws(() => summarizeSparseGraph(2, [{ from: 0.5, to: 1, kind: "bridge" }]), /endpoint/);
    assert.throws(() => summarizeSparseGraph(2, [{ from: 0, to: 0, kind: "community" }]), /Self/);
    assert.throws(() => summarizeSparseGraph(2, [
      { from: 0, to: 1, kind: "community" },
      { from: 0, to: 1, kind: "hub" },
    ]), /Duplicate/);
    const badKind = [{ from: 0, to: 1, kind: "native-call" }] as unknown as SparseEdge[];
    assert.throws(() => summarizeSparseGraph(2, badKind), /kind/);
    const overBudget: SparseEdge[] = Array.from({ length: 9 }, () => ({
      from: 0, to: 0, kind: "community",
    }));
    assert.throws(() => summarizeSparseGraph(1, overBudget), /E<=8N/);
  });

  it("caps neighbor scans at a fixed degree and independently guards large summaries", () => {
    const sixtyFive: SparseEdge[] = Array.from({ length: 65 }, (_, index) => ({
      from: index + 1, to: 0, kind: "hub",
    }));
    assert.equal(summarizeSparseGraph(66, sixtyFive).degrees.maximumTotal, 65);
    assert.throws(() => summarizeSparseGraph(67, [
      ...sixtyFive, { from: 66, to: 0, kind: "hub" },
    ]), /degree cap/);
    assert.throws(() => summarizeSparseGraph(10001, []), /allowLarge=true/);
    assert.throws(() => summarizeSparseGraph(100000, [], 0, false), /allowLarge=true/);
    assert.throws(() => summarizeSparseGraph(-1, []), /nodeCount/);
    assert.throws(() => summarizeSparseGraph(100001, [], 0, true), /nodeCount/);
    assert.throws(() => summarizeSparseGraph(3, [], 4), /semantifiedNodeCount/);
    assert.throws(() => summarizeSparseGraph(3, [], -1), /semantifiedNodeCount/);
    assert.throws(() => summarizeSparseGraph(3, [], 0.5), /semantifiedNodeCount/);
  });
});

describe("admitted sizes, closed counts and bounded work", () => {
  // Analytic constants, not discovered by running the generator:
  // I=floor(N/64), A=N-I, B=ceil(A/64), E=3A-4B-1.
  // Ring=A; hub=A-3B; utility=A-2B; bridge=B-1.
  const expectedCases = [
    {
      size: 1000 as const, isolates: 15, active: 985, communities: 16,
      edges: 2890, ring: 985, hub: 937, utility: 953, bridge: 15,
      semantified: 250, components: 31, fullBlocks: 15, lastBlock: 25,
    },
    {
      size: 10000 as const, isolates: 156, active: 9844, communities: 154,
      edges: 28915, ring: 9844, hub: 9382, utility: 9536, bridge: 153,
      semantified: 2500, components: 310, fullBlocks: 153, lastBlock: 52,
    },
  ];
  for (const expected of expectedCases) {
    it(`${expected.size}: exact counts, SCCs, families, endpoint uniqueness and no pair enumeration`, () => {
      const value = generateSparseCase({ size: expected.size, seed: 0 });
      assert.equal(value.schemaVersion, "synthetic-sparse-case/v1");
      assert.equal(value.schemaVersion, SPARSE_CASE_SCHEMA);
      assert.equal(value.provenance, "synthetic-only-no-native-validation");
      assert.equal(value.edgeMeaning, "directed-topology-only-adapter-must-assign-dependency-meaning");
      assert.equal(value.nodes.length, expected.size);
      assert.equal(value.edges.length, expected.edges);
      assert.ok(value.edges.length <= 8 * expected.size);
      assert.equal(value.statistics.directedDensity, expected.edges / (expected.size * (expected.size - 1)));
      assert.equal(value.statistics.isolatedNodeCount, expected.isolates);
      assert.equal(value.statistics.semantifiedNodeCount, expected.semantified);
      assert.equal(value.statistics.semantifiedProportion, 1 / 4);
      assert.deepStrictEqual(value.statistics.edgeKindCounts, {
        community: expected.ring, hub: expected.hub, utility: expected.utility, bridge: expected.bridge,
      });
      assert.equal(value.statistics.scc.componentCount, expected.components);
      assert.equal(value.statistics.scc.nontrivialComponentCount, expected.communities);
      assert.equal(value.statistics.scc.cyclicNodeCount, expected.active);
      assert.equal(value.statistics.scc.largestComponentSize, 64);
      assert.deepStrictEqual(value.statistics.scc.sizeDistribution, [
        { size: 1, componentCount: expected.isolates },
        { size: expected.lastBlock, componentCount: 1 },
        { size: 64, componentCount: expected.fullBlocks },
      ]);
      assert.equal(value.statistics.degrees.maximumIn, 63);
      assert.equal(value.statistics.degrees.maximumOut, 3);
      assert.equal(value.statistics.degrees.maximumTotal, 65);
      assert.deepStrictEqual(value.construction.work, {
        createdNodes: expected.size,
        communityVisits: expected.communities,
        localRankVisits: expected.active,
        emittedEdges: expected.edges,
      });
      assert.deepStrictEqual(value.statistics.work, {
        validatedEdges: expected.edges,
        forwardEdgeVisits: expected.edges,
        reverseEdgeVisits: expected.edges,
        finishedNodes: expected.size,
        assignedNodes: expected.size,
      });
      assertEndpointsAndDegreeCap(value);

      const roles = { member: 0, hub: 0, utility: 0, isolate: 0 };
      let prepared = 0;
      for (let id = 0; id < expected.size; id += 1) {
        const node = value.nodes[id]!;
        roles[node.planted.role] += 1;
        assert.equal(node.planted.provenance, "synthetic-topology-not-native-not-llm");
        assert.ok(Number.isInteger(node.durationTicks));
        assert.ok(node.durationTicks >= 1 && node.durationTicks <= 31);
        assert.equal(node.demand.units, 1);
        if (id < expected.active) {
          assert.equal(node.planted.community, Math.floor(id / 64));
          assert.equal(value.statistics.scc.componentIdByNode[id], Math.floor(id / 64) * 64);
        } else {
          assert.equal(node.planted.community, null);
          assert.equal(node.planted.role, "isolate");
          assert.equal(value.statistics.scc.componentIdByNode[id], id);
        }
        if (id % 4 === 0) {
          prepared += 1;
          assert.equal(node.semantics.status, "prepared-synthetic");
          assert.ok(node.semantics.description?.startsWith("SYNTHETIC "));
        } else {
          assert.equal(node.semantics.status, "absent");
          assert.equal(node.semantics.description, null);
        }
      }
      assert.equal(prepared, expected.semantified);
      assert.deepStrictEqual(roles, {
        member: expected.active - 2 * expected.communities,
        hub: expected.communities,
        utility: expected.communities,
        isolate: expected.isolates,
      });
      for (const edge of value.edges) {
        const from = value.nodes[edge.from]!;
        const to = value.nodes[edge.to]!;
        if (edge.kind === "bridge") {
          assert.equal(from.planted.role, "utility");
          assert.equal(to.planted.role, "hub");
          assert.equal(Math.floor(edge.to / 64), Math.floor(edge.from / 64) + 1);
        } else {
          assert.equal(from.planted.community, to.planted.community);
        }
      }
    });
  }

  it("1000: degree distributions are independently closed constants", () => {
    const value = generateSparseCase({ size: 1000, seed: 0 });
    assert.deepStrictEqual(value.statistics.degrees.incoming, [
      { degree: 0, nodeCount: 15 },
      { degree: 1, nodeCount: 953 },
      { degree: 24, nodeCount: 2 },
      { degree: 62, nodeCount: 1 },
      { degree: 63, nodeCount: 29 },
    ]);
    assert.deepStrictEqual(value.statistics.degrees.outgoing, [
      { degree: 0, nodeCount: 15 },
      { degree: 1, nodeCount: 17 },
      { degree: 2, nodeCount: 31 },
      { degree: 3, nodeCount: 937 },
    ]);
    assert.deepStrictEqual(value.statistics.degrees.total, [
      { degree: 0, nodeCount: 15 },
      { degree: 3, nodeCount: 16 },
      { degree: 4, nodeCount: 937 },
      { degree: 25, nodeCount: 2 },
      { degree: 63, nodeCount: 1 },
      { degree: 64, nodeCount: 14 },
      { degree: 65, nodeCount: 15 },
    ]);
  });

  it("seed zero has a known first block prefix and a closed first duration", () => {
    // mix32(0)=0: zero rotation, forward ring, hub=0, utility=1.
    const value = generateSparseCase({ size: 1000, seed: 0 });
    assert.equal(value.nodes[0]!.durationTicks, 1);
    assert.equal(value.nodes[0]!.planted.role, "hub");
    assert.equal(value.nodes[1]!.planted.role, "utility");
    assert.deepStrictEqual(value.edges.slice(0, 5), [
      { from: 0, to: 1, kind: "community" },
      { from: 1, to: 2, kind: "community" },
      { from: 2, to: 3, kind: "community" },
      { from: 2, to: 0, kind: "hub" },
      { from: 2, to: 1, kind: "utility" },
    ]);
  });
});

describe("strict request, deterministic values, common inputs", () => {
  it("refuses 100000 without explicit true before any graph path", () => {
    assert.throws(() => generateSparseCase({ size: 100000, seed: 0 }), /before graph allocation/);
    assert.throws(() => generateSparseCase({ size: 100000, seed: 0, allowLarge: false }), /allowLarge=true/);
    assert.throws(() => generateSparseCase(asRequest({ size: 100000, seed: 0, allowLarge: "true" })), /boolean/);
  });

  it("rejects nonliteral sizes, non-uint32 seeds, extra fields and non-data records", () => {
    for (const size of [0, 1, 999, 1001, 9999, 10001, 100001, "1000", NaN, Infinity]) {
      assert.throws(() => generateSparseCase(asRequest({ size, seed: 0 })));
    }
    for (const seed of [-1, 0.5, 4294967296, NaN, Infinity, -Infinity, "0", null, undefined]) {
      assert.throws(() => generateSparseCase(asRequest({ size: 1000, seed })));
    }
    for (const input of [null, undefined, [], 7, "request", { size: 1000 }, { seed: 0 }]) {
      assert.throws(() => generateSparseCase(asRequest(input)));
    }
    assert.throws(() => generateSparseCase(asRequest({ size: 1000, seed: 0, extra: true })), /Unknown/);
    assert.throws(() => generateSparseCase(asRequest({ size: 1000, seed: 0, allowLarge: undefined })), /boolean/);
    const withSymbol = { size: 1000, seed: 0, [Symbol("extra")]: true };
    assert.throws(() => generateSparseCase(asRequest(withSymbol)), /Unknown/);
    const inherited = Object.create({ size: 1000, seed: 0 }) as unknown;
    assert.throws(() => generateSparseCase(asRequest(inherited)), /prototype/);
  });

  it("never invokes input getters and does not mutate a frozen request", () => {
    let getterReads = 0;
    const accessor = Object.defineProperty({ seed: 0 }, "size", {
      enumerable: true,
      get(): number { getterReads += 1; return 1000; },
    });
    assert.throws(() => generateSparseCase(asRequest(accessor)), /Accessors/);
    assert.equal(getterReads, 0);
    const request = Object.freeze({ size: 1000 as const, seed: 0xffffffff, allowLarge: false });
    const value = generateSparseCase(request);
    assert.deepStrictEqual(request, { size: 1000, seed: 4294967295, allowLarge: false });
    assert.equal(value.seed, 4294967295);
    assert.equal(value.nodes.length, 1000);
  });

  it("same uint32 seed gives equal DTO values but fresh independent records", () => {
    for (const seed of [0, 1, 0xffffffff]) {
      const first = generateSparseCase({ size: 1000, seed });
      const repeated = generateSparseCase({ seed, size: 1000 });
      // A repeat is ONLY a determinism property, not an oracle for graph counts.
      assert.deepStrictEqual(repeated, first);
      assert.notStrictEqual(first, repeated);
      assert.notStrictEqual(first.nodes, repeated.nodes);
      assert.notStrictEqual(first.nodes[0], repeated.nodes[0]);
      assert.notStrictEqual(first.nodes[0]!.demand, repeated.nodes[0]!.demand);
      assert.notStrictEqual(first.edges, repeated.edges);
      assert.notStrictEqual(first.eventTape, repeated.eventTape);
      assert.notStrictEqual(first.resources, repeated.resources);
      assert.notStrictEqual(first.statistics.scc.componentIdByNode, repeated.statistics.scc.componentIdByNode);
    }
  });

  it("seed changes payload/topology without changing the closed count envelope", () => {
    const zero = generateSparseCase({ size: 1000, seed: 0 });
    const one = generateSparseCase({ size: 1000, seed: 1 });
    assert.notDeepStrictEqual(zero.nodes.map((node) => node.durationTicks), one.nodes.map((node) => node.durationTicks));
    assert.notDeepStrictEqual(zero.edges, one.edges);
    for (const value of [zero, one]) {
      assert.equal(value.statistics.edgeCount, 2890);
      assert.equal(value.statistics.scc.componentCount, 31);
      assert.equal(value.statistics.isolatedNodeCount, 15);
      assert.equal(value.statistics.degrees.maximumTotal, 65);
      assertEndpointsAndDegreeCap(value);
    }
  });

  it("records one fixed common resource configuration and exogenous event tape", () => {
    const value = generateSparseCase({ size: 1000, seed: 0 });
    assert.deepStrictEqual(value.resources, [
      { id: "general", initialCapacity: 4 },
      { id: "specialist", initialCapacity: 2 },
    ]);
    assert.deepStrictEqual(value.eventTape, [
      { atTick: 0, sequence: 0, kind: "resource-capacity", resourceId: "general", capacity: 4 },
      { atTick: 0, sequence: 1, kind: "resource-capacity", resourceId: "specialist", capacity: 2 },
      { atTick: 100, sequence: 2, kind: "resource-capacity", resourceId: "general", capacity: 2 },
      { atTick: 140, sequence: 3, kind: "resource-capacity", resourceId: "specialist", capacity: 1 },
      { atTick: 260, sequence: 4, kind: "resource-capacity", resourceId: "general", capacity: 4 },
      { atTick: 300, sequence: 5, kind: "resource-capacity", resourceId: "specialist", capacity: 2 },
    ]);
    for (const node of value.nodes) {
      const specialist = node.planted.role === "hub" || node.planted.role === "utility";
      assert.equal(node.demand.resourceId, specialist ? "specialist" : "general");
    }
  });

  // Deliberately disabled. Source presence / allowLarge do not grant runtime or
  // budget permission. Enabling requires a separate parent gate and fresh review.
  it.skip("100000 positive branch: separate explicit large-budget admission required", () => {
    const value = generateSparseCase({ size: 100000, seed: 0, allowLarge: true });
    assert.equal(value.nodes.length, 100000);
    assert.equal(value.edges.length, 289157);
    assert.equal(value.statistics.isolatedNodeCount, 1562);
    assert.equal(value.statistics.semantifiedNodeCount, 25000);
    assert.equal(value.statistics.scc.componentCount, 3101);
    assert.equal(value.statistics.scc.nontrivialComponentCount, 1539);
    assert.deepStrictEqual(value.statistics.scc.sizeDistribution, [
      { size: 1, componentCount: 1562 },
      { size: 6, componentCount: 1 },
      { size: 64, componentCount: 1538 },
    ]);
    assert.ok(value.edges.length <= 800000);
    assertEndpointsAndDegreeCap(value);
  });
});
