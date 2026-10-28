import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canonical, fingerprint } from "../src/validation";
import { clusterGraph, projectStructural, sparseGraph, historicalComponents, personalizedPageRank, sweepCut, conductance, directedModularity, leiden, weightSensitivity, compareFunctionId, type ClusterInput, type ClusterPartition, type SparseGraph } from "../src/cluster";
import { buildInvestigationGroups } from "../src/investigation-groups";

function fixture(name: string): ClusterInput { return JSON.parse(readFileSync(join(import.meta.dir, "fixtures/graph", name, "content.json"), "utf8")); }
const HASH = "a".repeat(64);
function id(i: number): string { return `${HASH}:0x${(16 + i * 16).toString(16).toUpperCase()}`; }
function synthetic(n: number, pairs: Array<[number, number]>): ClusterInput {
  return {
    snapshotId: `synthetic:${n}`, normalizedFingerprint: fingerprint({ n, pairs }),
    nodes: Array.from({ length: n }, (_, i) => ({ id: id(i), moduleSha256: HASH, rva: id(i).split(":")[1]!, functionClass: "internal", status: "observed", semanticMaturity: "structural", sizeBytes: { known: true, value: 16 }, instructionCount: { known: true, value: 4 } })),
    edges: pairs.map(([a, b], i) => ({ sourceId: id(a), destinationId: id(b), kind: "direct_call", status: "observed", confidence: "high", retiredInRevision: null, sites: [{ siteRva: `0x${(i + 1).toString(16).toUpperCase()}`, xrefType: "code" }] })),
    objects: [], unresolved: [], capabilities: [], coverage: { status: "complete", uncoveredReason: null },
  };
}
function fullCoverage(input: ClusterInput, partition: ClusterPartition): void {
  const ids = partition.communities.flatMap(c => c.memberIds);
  expect(ids.length).toBe(input.nodes.length); expect(new Set(ids).size).toBe(ids.length);
  expect(ids.slice().sort(compareFunctionId)).toEqual(input.nodes.map(n => n.id).sort(compareFunctionId));
  for (const c of partition.communities) { expect(c.kernelIds.every(id => c.memberIds.includes(id))).toBe(true); expect(c.externalContextIds.every(id => !c.memberIds.includes(id))).toBe(true); }
}
// Independent dense small-graph oracle directly evaluates all ordered pairs;
// only used for tiny tests (not production nor sparse benchmarks).
function modularityOracle(g: SparseGraph, labels: number[], gamma = 1): number {
  const matrix = g.ids.map(() => g.ids.map(() => 0)); for (const a of g.arcs) matrix[a.source]![a.target] += a.weight;
  let q = 0; for (let i = 0; i < g.ids.length; i++) for (let j = 0; j < g.ids.length; j++) if (labels[i] === labels[j]) q += matrix[i]![j]! - gamma * matrix[i]!.reduce((a, b) => a + b, 0) * matrix.reduce((s, row) => s + row[j]!, 0) / g.totalWeight;
  return q / g.totalWeight;
}
function cutOracle(g: SparseGraph, members: number[]): number | null {
  const selected = new Set(members); let inside = 0, outside = 0, crossing = 0;
  for (const a of g.arcs) { if (selected.has(a.source)) inside += a.weight; else outside += a.weight; if (selected.has(a.target)) inside += a.weight; else outside += a.weight; if (selected.has(a.source) !== selected.has(a.target)) crossing += a.weight; }
  return Math.min(inside, outside) > 0 ? crossing / Math.min(inside, outside) : null;
}
type Schema = { type: string | string[]; enum?: unknown[]; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; items?: Schema; minItems?: number; maxItems?: number; minimum?: number; maximum?: number; minLength?: number; maxLength?: number };
function conforms(value: unknown, schema: Schema): void {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const matches = (t: string) => t === "null" ? value === null : t === "array" ? Array.isArray(value) : t === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : t === "integer" ? Number.isSafeInteger(value) : typeof value === t;
  expect(types.some(matches)).toBe(true); if (schema.enum) expect(schema.enum).toContain(value);
  if (typeof value === "number") { if (schema.minimum !== undefined) expect(value).toBeGreaterThanOrEqual(schema.minimum); if (schema.maximum !== undefined) expect(value).toBeLessThanOrEqual(schema.maximum); }
  if (typeof value === "string") { if (schema.minLength !== undefined) expect(value.length).toBeGreaterThanOrEqual(schema.minLength); if (schema.maxLength !== undefined) expect(value.length).toBeLessThanOrEqual(schema.maxLength); }
  if (Array.isArray(value)) { if (schema.minItems !== undefined) expect(value.length).toBeGreaterThanOrEqual(schema.minItems); if (schema.maxItems !== undefined) expect(value.length).toBeLessThanOrEqual(schema.maxItems); if (schema.items) value.forEach(v => conforms(v, schema.items!)); }
  else if (value !== null && typeof value === "object") { const record = value as Record<string, unknown>; for (const key of schema.required ?? []) expect(Object.hasOwn(record, key)).toBe(true); for (const [k, v] of Object.entries(record)) { if (schema.additionalProperties === false) expect(Object.hasOwn(schema.properties ?? {}, k)).toBe(true); if (schema.properties?.[k]) conforms(v, schema.properties[k]!); } }
}
describe("structural projection and historical baseline", () => {
  test("canonical identity sorting is numeric, not lexical or name based", () => {
    expect([`${HASH}:0x10`, `${HASH}:0x2`].sort(compareFunctionId)).toEqual([`${HASH}:0x2`, `${HASH}:0x10`]);
    const input = fixture("ff8-identity-rename"), changed = structuredClone(input);
    changed.nodes.forEach(n => { Object.assign(n, { name: "renamed" }); }); expect(clusterGraph(input).partition).toEqual(clusterGraph(changed).partition);
  });
  test("historical CC preserves comparison, adapted baseline handles giant hub", () => {
    const input = synthetic(7, [[0, 1], [1, 2], [3, 4], [4, 5], [0, 6], [1, 6], [3, 6], [4, 6]]);
    expect(historicalComponents(input)).toHaveLength(1);
    const result = clusterGraph(input, { algorithm: "hub-baseline", weights: { hubThreshold: 4 }, maxCommunitySize: 2 });
    expect(result.metrics.hubIds).toEqual([id(6)]); expect(result.partition.communities.length).toBeGreaterThan(2); fullCoverage(input, result.partition);
    expect(result.partition.communities.every(c => c.memberIds.length <= 2)).toBe(true);
  });
  test("relation sharding neither multiplies weight nor turns callbacks/DATA into calls", () => {
    const input = synthetic(2, [[0, 1]]), sharded = structuredClone(input); sharded.edges = Array.from({ length: 512 }, (_, i) => ({ ...input.edges[0]!, sites: [{ siteRva: `0x${(100 + i).toString(16)}`, xrefType: "code" }] }));
    expect(projectStructural(input).graph.arcs).toEqual(projectStructural(sharded).graph.arcs);
    expect(clusterGraph(input, { algorithm: "leiden" }).partition).toEqual(clusterGraph(sharded, { algorithm: "leiden" }).partition);
    const callbacks = synthetic(2, [[0, 1]]); callbacks.edges[0]!.kind = "callback_candidate"; callbacks.edges[0]!.status = "inferred"; callbacks.edges[0]!.sites[0]!.xrefType = "data";
    expect(historicalComponents(callbacks)).toHaveLength(2); expect(projectStructural(callbacks).graph.arcs[0]!.weight).toBe(.1);
    expect(callbacks.edges[0]!.kind).toBe("callback_candidate");
  });
  test("retired and invalidated relations disappear; self loops survive", () => {
    const input = synthetic(2, [[0, 0], [0, 1]]); input.edges[1]!.status = "invalidated";
    const p = projectStructural(input); expect(p.graph.arcs).toEqual([{ source: 0, target: 0, weight: 1 }]); expect(p.isolatedIds).toEqual([id(0), id(1)]);
    input.edges[1]!.status = "observed"; input.edges[1]!.retiredInRevision = 1; expect(projectStructural(input).graph.arcs).toHaveLength(1);
  });
  test("rare DATA bounded, imports/hubs explicit, adjacent-only memory", () => {
    const input = synthetic(100, []); input.objects = [{ id: "obj", kind: "global" }]; input.unresolved = input.nodes.map(n => ({ fromFunctionId: n.id, referencedObjectId: "obj", kind: "data_xref" }));
    const p = projectStructural(input); expect(p.skippedObjects).toEqual(["obj"]); expect(p.graph.arcs).toHaveLength(0);
    const memory = projectStructural(input, { memoryWeak: .01, memoryWindow: 32 }); expect(memory.graph.arcs).toHaveLength(198);
    input.unresolved = input.unresolved.slice(0, 2); expect(projectStructural(input).graph.arcs).toHaveLength(2);
    input.nodes[0]!.functionClass = "import"; expect(projectStructural(input).graph.arcs[0]!.weight).toBeCloseTo(.25 * .05);
    expect(() => projectStructural(input, { rareObjectMaxUsers: 1000 })).toThrow("cap");
  });
  test("malformed config/duplicate identities/conflicting shards fail closed", () => {
    const input = synthetic(2, [[0, 1]]);
    expect(() => projectStructural(input, { direct: NaN })).toThrow(); expect(() => clusterGraph(input, { algorithm: "hub-baseline", maxCommunitySize: 0 })).toThrow();
    input.edges.push({ ...input.edges[0]!, confidence: "low" }); expect(() => projectStructural(input)).toThrow("conflicting");
    input.edges.pop(); input.nodes.push(input.nodes[0]!); expect(() => projectStructural(input)).toThrow("duplicate");
  });
});
describe("PPR and independent cut oracles", () => {
  test("two-node dangling exact solution, probability mass, caller direction", () => {
    const g = sparseGraph([id(0), id(1)], [{ source: 0, target: 1, weight: 1 }]);
    const r = personalizedPageRank(g, [id(0)]); expect(r.converged).toBe(true); expect(r.scores[0]).toBeCloseTo(1 / 1.85, 8); expect(r.scores[1]).toBeCloseTo(.85 / 1.85, 8); expect(r.scores.reduce((a, b) => a + b)).toBeCloseTo(1, 10);
    const caller = personalizedPageRank(g, [id(1)], { direction: "caller" }); expect(caller.scores[0]).toBeCloseTo(r.scores[1]!, 8);
    expect(personalizedPageRank(g, [id(1)]).scores).toEqual([0, 1]);
  });
  test("isolated seeds, dedup, explicit limit diagnostics and config rejection", () => {
    const g = sparseGraph([id(0), id(1)], []); expect(personalizedPageRank(g, [id(0), id(0)]).scores).toEqual([1, 0]);
    const edge = sparseGraph(g.ids, [{ source: 0, target: 1, weight: 1 }]); expect(personalizedPageRank(edge, [id(0)], { maxIterations: 1 }).converged).toBe(false);
    for (const config of [{ damping: 1 }, { tolerance: 0 }, { maxIterations: 0 }]) expect(() => personalizedPageRank(edge, [id(0)], config)).toThrow();
    expect(() => personalizedPageRank(edge, [id(9)])).toThrow(); expect(() => personalizedPageRank(edge, [])).toThrow();
  });
  test("conductance matches raw edge oracle including loops and direction", () => {
    const g = sparseGraph([id(0), id(1), id(2), id(3)], [{ source: 0, target: 0, weight: 3 }, { source: 0, target: 1, weight: 2 }, { source: 1, target: 2, weight: .2 }, { source: 2, target: 3, weight: 4 }]);
    for (const set of [[0], [0, 1], [1, 2], [2, 3]]) expect(conductance(g, set)).toBeCloseTo(cutOracle(g, set)!, 12);
    expect(conductance(g, [0, 1, 2, 3])).toBeNull();
    const scores = [4, 3, 2, 1], cut = sweepCut(g, scores, 4); expect(cut.conductance).toBeCloseTo(cutOracle(g, cut.region)!, 12);
    const rank = [0, 1, 2, 3].sort((a, b) => scores[b]! / (g.inDegree[b]! + g.outDegree[b]!) - scores[a]! / (g.inDegree[a]! + g.outDegree[a]!) || a - b);
    const values = rank.map((_, i) => cutOracle(g, rank.slice(0, i + 1))).filter(v => v !== null) as number[]; expect(cut.conductance).toBeCloseTo(Math.min(...values), 12);
  });
  test("entry/capability seeds produce residual cover without duplicate owners", () => {
    const input = fixture("communities-obvious"); input.capabilities = [{ id: "entry-cap", subjectId: input.nodes[0]!.id, subjectKind: "function", capability: "entry" }];
    const result = clusterGraph(input, { algorithm: "ppr", seedCapabilityIds: ["entry-cap"], seedIds: [input.nodes[2]!.id] }); fullCoverage(input, result.partition); expect(result.metrics.ppr).toHaveLength(2);
    expect(() => clusterGraph(input, { algorithm: "ppr" })).toThrow("explicit");
  });
  test("callee/caller/both agree with independent linear-system oracle", () => {
    const g = sparseGraph([id(0), id(1), id(2)], [{ source: 0, target: 1, weight: 3 }, { source: 1, target: 0, weight: 1 }, { source: 1, target: 2, weight: 2 }]);
    for (const direction of ["callee", "caller", "both"] as const) {
      const w = Array.from({ length: 3 }, () => [0, 0, 0]); for (const a of g.arcs) { if (direction !== "caller") w[a.source]![a.target] += a.weight; if (direction !== "callee") w[a.target]![a.source] += a.weight; }
      const seed = [.5, 0, .5], d = .8, degree = w.map(row => row.reduce((a, b) => a + b, 0));
      const equations = Array.from({ length: 3 }, (_, i) => Array.from({ length: 4 }, (_, j) => j === 3 ? (1 - d) * seed[i]! : Number(i === j) - d * (degree[j]! > 0 ? w[j]![i]! / degree[j]! : seed[i]!)));
      for (let pivot = 0; pivot < 3; pivot++) { const divisor = equations[pivot]![pivot]!; for (let j = pivot; j < 4; j++) equations[pivot]![j] /= divisor;
        for (let row = 0; row < 3; row++) if (row !== pivot) { const multiplier = equations[row]![pivot]!; for (let j = pivot; j < 4; j++) equations[row]![j] -= multiplier * equations[pivot]![j]!; }
      }
      const r = personalizedPageRank(g, [id(0), id(2)], { direction, damping: d }); expect(r.converged).toBe(true); for (let i = 0; i < 3; i++) expect(r.scores[i]).toBeCloseTo(equations[i]![3]!, 8);
    }
  });
});
describe("directed weighted Leiden", () => {
  test("modularity oracle: one community zero, disjoint equal edges .5, signed resolution", () => {
    const g = sparseGraph([id(0), id(1), id(2), id(3)], [{ source: 0, target: 1, weight: 1 }, { source: 2, target: 3, weight: 1 }]);
    expect(directedModularity(g, [0, 0, 0, 0])).toBe(0); expect(directedModularity(g, [0, 0, 1, 1])).toBe(.5);
    expect(directedModularity(g, [0, 0, 1, 1], 5)).toBe(-1.5);
    for (const labels of [[0, 0, 1, 1], [0, 1, 0, 1], [0, 1, 2, 3]]) expect(directedModularity(g, labels)).toBeCloseTo(modularityOracle(g, labels), 12);
    expect(directedModularity(sparseGraph([], []), [])).toBeNull();
  });
  test("real refinement + aggregation phases; obvious communities oracle", () => {
    const input = fixture("communities-obvious"), g = projectStructural(input).graph, r = leiden(g);
    expect(r.converged).toBe(true); expect(r.refinementMerges).toBeGreaterThan(0); expect(r.aggregations).toBeGreaterThan(0); expect(new Set(r.labels).size).toBe(2);
    expect(r.labels[0]).toBe(r.labels[1]); expect(r.labels[2]).toBe(r.labels[3]); expect(r.labels[0]).not.toBe(r.labels[2]); expect(r.modularity).toBeCloseTo(modularityOracle(g, r.labels), 12);
    expect(r.objective).toBe("directed-weighted-modularity");
  });
  test("asymmetric weighted graph with loops has real directed objective", () => {
    const g = sparseGraph([id(0), id(1), id(2)], [{ source: 0, target: 1, weight: 9 }, { source: 1, target: 0, weight: 1 }, { source: 1, target: 2, weight: .1 }, { source: 2, target: 2, weight: 2 }]);
    const r = leiden(g, { seed: "directed" }); expect(r.modularity).toBeCloseTo(modularityOracle(g, r.labels), 12); expect(r.modularity!).toBeGreaterThanOrEqual(directedModularity(g, [0, 1, 2])! - 1e-10);
    expect(r.labels[0]).toBe(r.labels[1]); expect(r.labels[2]).not.toBe(r.labels[1]);
  });
  test("deterministic fixed seed/config/input permutations and bounded convergence", () => {
    const input = fixture("bridges-rare"), reversed = structuredClone(input); reversed.nodes.reverse(); reversed.edges.reverse();
    const config = { algorithm: "leiden" as const, leiden: { seed: "known-seed" } };
    expect(clusterGraph(input, config)).toEqual(clusterGraph(reversed, config));
    const limited = leiden(projectStructural(input).graph, { maxSweeps: 1 }); expect(limited.converged).toBe(false); expect(limited.diagnostics.join(" ")).toContain("bound");
    expect(() => leiden(projectStructural(input).graph, { seed: "none" })).toThrow(); expect(() => leiden(projectStructural(input).graph, { resolution: NaN })).toThrow();
    expect(clusterGraph(input, { algorithm: "leiden", leiden: { seed: "different" } }).partition.configFingerprint).not.toBe(clusterGraph(input, config).partition.configFingerprint);
  });
  test("community connectivity invariant across seeds and weighted ring bridges", () => {
    const input = synthetic(12, Array.from({ length: 12 }, (_, i) => [i, (i + 1) % 12] as [number, number])), g = projectStructural(input).graph;
    for (const seed of ["a", "b", "c", "d"]) { const r = leiden(g, { seed }); for (const label of new Set(r.labels)) {
      const members = r.labels.map((c, i) => c === label ? i : -1).filter(i => i >= 0), seen = new Set([members[0]!]), queue = [members[0]!];
      for (let q = 0; q < queue.length; q++) for (const neighbor of [...g.out[queue[q]!]!.keys(), ...g.incoming[queue[q]!]!.keys()]) if (r.labels[neighbor] === label && !seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
      expect(seen.size).toBe(members.length);
    } }
  });
  test("weighted directed property cases: no lost nodes, monotone original objective", () => {
    for (let trial = 0; trial < 50; trial++) {
      const arcs = Array.from({ length: 30 }, (_, j) => ({ source: (j * 7 + trial) % 10, target: (j * j + trial * 3) % 10, weight: ((j * 13 + trial) % 9 + 1) / 3 }));
      const g = sparseGraph(Array.from({ length: 10 }, (_, i) => id(i)), arcs), r = leiden(g, { seed: `property:${trial}` });
      expect(r.labels).toHaveLength(10); expect(r.labels.every(c => Number.isSafeInteger(c) && c >= 0)).toBe(true); expect(r.modularity).toBeCloseTo(modularityOracle(g, r.labels), 12);
      expect(r.modularity!).toBeGreaterThanOrEqual(modularityOracle(g, Array.from({ length: 10 }, (_, i) => i)) - 1e-10);
      expect(leiden(sparseGraph(g.ids, [...arcs].reverse()), { seed: `property:${trial}` })).toEqual(r);
    }
  });
});
describe("groups, coverage, costs and contract transport", () => {
  test("all graph fixtures: complete owner attribution, immutable input, strict schema", () => {
    const partitionSchema: Schema = JSON.parse(readFileSync(join(import.meta.dir, "../schemas/cluster-partition-v1.schema.json"), "utf8"));
    const groupSchema: Schema = JSON.parse(readFileSync(join(import.meta.dir, "../schemas/investigation-group-v1.schema.json"), "utf8"));
    for (const name of ["communities-obvious", "components-disconnected", "hubs-utilities", "cycles-recursion", "indirect-uncertain", "isolates", "bridges-rare", "shared-data", "ff8-chunks-tails", "ff8-imports-thunks", "ff8-data-callback-not-call", "ff8-idb-pe-quarantine", "ff8-multi-module", "ff8-self-loop", "ff8-unknown-metrics", "ff8-coverage-partial-tails"]) {
      const input = fixture(name), before = canonical(input);
      for (const algorithm of ["historical-cc", "hub-baseline", "leiden"] as const) {
        const result = clusterGraph(input, { algorithm }); fullCoverage(input, result.partition); conforms(result.partition, partitionSchema);
        const groups = buildInvestigationGroups(input, result.partition, {}, { graph: result.projection.graph, hubIds: result.metrics.hubIds }); groups.groups.forEach(g => conforms(g, groupSchema));
        const ids = groups.groups.flatMap(g => g.ownedFunctionIds); expect(ids.length).toBe(input.nodes.length); expect(new Set(ids).size).toBe(ids.length);
        groups.groups.forEach(g => { expect(g.ownedFunctionIds.length).toBeLessThanOrEqual(8); expect(g.contextFunctionIds.every(id => !g.ownedFunctionIds.includes(id))).toBe(true); });
      }
      expect(canonical(input)).toBe(before);
    }
  });
  test("balanced maximum splits, minimum attaches only under explicit policy", () => {
    const input = synthetic(17, Array.from({ length: 16 }, (_, i) => [i, i + 1] as [number, number])), p = clusterGraph(input, { algorithm: "historical-cc" }).partition;
    const groups = buildInvestigationGroups(input, p, { minSize: 4, maxSize: 6 }); expect(groups.groups.map(g => g.ownedFunctionIds.length)).toEqual([6, 6, 5]); expect(groups.metrics.smallGroupIds).toHaveLength(0);
    const two = synthetic(2, [[0, 1]]), separate = clusterGraph(two, { algorithm: "hub-baseline", maxCommunitySize: 1 }).partition;
    expect(buildInvestigationGroups(two, separate).groups).toHaveLength(2);
    const attached = buildInvestigationGroups(two, separate, { smallPolicy: "attach-adjacent" }); expect(attached.groups).toHaveLength(1); expect(attached.metrics.sourceCommunitiesByGroupId[attached.groups[0]!.groupId]).toHaveLength(2);
  });
  test("nonkernel is attributed uncovered, unknown costs stay unknown, local maturity retained", () => {
    const input = synthetic(3, [[0, 1], [1, 2]]), p = clusterGraph(input, { algorithm: "historical-cc" }).partition;
    p.communities[0]!.kernelIds = [id(0), id(1)]; input.nodes[0]!.instructionCount = { known: false, value: null }; input.nodes[1]!.status = "quarantined"; input.nodes[1]!.semanticMaturity = "partial";
    const r = buildInvestigationGroups(input, p); expect(r.groups[0]!.estimatedCost).toEqual({ known: false, value: null }); expect(r.metrics.nonCoveredIds).toEqual([id(1), id(2)]);
    expect(r.metrics.ownerByFunctionId[id(2)]).toBeUndefined(); expect(r.metrics.uncoveredOwnerByFunctionId[id(2)]).toBe(r.groups[0]!.groupId); expect(r.groups[0]!.memberMaturity[1]!.semanticMaturity).toBe("partial");
    input.nodes[0]!.instructionCount = { known: true, value: 4 }; expect(buildInvestigationGroups(input, p).groups[0]!.estimatedCost).toEqual({ known: true, value: 9 });
  });
  test("contexts overlap without investigation duplication, cap and byte metric explicit", () => {
    const input = synthetic(5, [[0, 4], [1, 4], [2, 4], [3, 4]]), r = clusterGraph(input, { algorithm: "hub-baseline", weights: { hubThreshold: 4 } });
    const g = buildInvestigationGroups(input, r.partition, { maxContextFunctions: 1 }, { graph: r.projection.graph, hubIds: r.metrics.hubIds });
    expect(g.groups.filter(c => c.contextFunctionIds.includes(id(4))).length).toBe(4); expect(g.groups.filter(c => c.ownedFunctionIds.includes(id(4)))).toHaveLength(1);
    for (const c of g.groups) expect(g.metrics.contextIdListUtf8BytesByGroupId[c.groupId]).toBe(Buffer.byteLength(JSON.stringify(c.contextFunctionIds), "utf8"));
    expect(g.metrics.diagnostics.join(" ")).toContain("not execution envelope");
  });
  test("empty kernel and capability overflow never emit schema-invalid documents", () => {
    const input = synthetic(2, [[0, 1]]), p = clusterGraph(input).partition; p.communities[0]!.kernelIds = [];
    const noKernel = buildInvestigationGroups(input, p); expect(noKernel.groups).toEqual([]); expect(noKernel.metrics.nonCoveredIds).toEqual([id(0), id(1)]); expect(noKernel.metrics.uncoveredCommunityByFunctionId[id(0)]).toBe(p.communities[0]!.contentId);
    p.communities[0]!.kernelIds = [id(0), id(1)]; input.capabilities = Array.from({ length: 300 }, (_, i) => ({ id: `cap:${i}`, subjectId: id(0), subjectKind: "function", capability: "entry" }));
    const r = buildInvestigationGroups(input, p), group = r.groups[0]!; expect(group.capabilityIds).toHaveLength(256); expect(r.metrics.allCapabilityIdsByGroupId[group.groupId]).toHaveLength(300);
    conforms(group, JSON.parse(readFileSync(join(import.meta.dir, "../schemas/investigation-group-v1.schema.json"), "utf8")));
  });
  test("missing membership/binding/duplicate owners and incompatible sizes rejected", () => {
    const input = synthetic(2, []), p = clusterGraph(input).partition;
    expect(() => buildInvestigationGroups(input, p, { minSize: 5, maxSize: 2 })).toThrow();
    expect(() => buildInvestigationGroups(input, { ...p, snapshotFingerprint: "wrong" })).toThrow("binding");
    const missing = structuredClone(p); missing.communities.pop(); expect(() => buildInvestigationGroups(input, missing)).toThrow("missing");
    const duplicate = structuredClone(p); duplicate.communities[1]!.memberIds = [id(0)]; duplicate.communities[1]!.kernelIds = [id(0)]; expect(() => buildInvestigationGroups(input, duplicate)).toThrow("duplicate owner");
  });
  test("metrics lossless sidecar, v1 remains Unknown, sensitivity is not calibration", () => {
    const input = fixture("communities-obvious"), r = clusterGraph(input, { algorithm: "leiden" }); expect(r.metrics.modularity).toBe(.5);
    expect(r.partition.modularity).toEqual({ known: false, value: null }); expect(r.partition.communities.every(c => !c.conductance.known && c.conductance.value === null)).toBe(true); expect(JSON.parse(JSON.stringify(r.metrics))).toEqual(r.metrics);
    const sensitivity = weightSensitivity(input, { algorithm: "leiden" }, [{ name: "same", weights: {} }, { name: "indirect-off", weights: { indirectHigh: 0, indirectOther: 0 } }]); expect(sensitivity[0]!.changedPairCount).toBe(0); expect(sensitivity[1]!.configFingerprint).not.toBe(sensitivity[0]!.configFingerprint);
    expect(weightSensitivity(input, { algorithm: "leiden" }, [{ name: "no-direct", weights: { direct: 0 } }])[0]!.changedPairCount).toBe(2);
    const signed = clusterGraph(synthetic(1, [[0, 0]]), { algorithm: "leiden", leiden: { resolution: 5, temperature: 0 } }); expect(signed.metrics.modularity).toBe(-4); expect(signed.partition.modularity).toEqual({ known: false, value: null }); expect(JSON.parse(JSON.stringify(signed.metrics))).toEqual(signed.metrics);
    expect(r.metrics.diagnostics.join(" ")).toContain("not calibrated");
  });
  test("group permutation determinism and empty graph explicit", () => {
    const input = synthetic(5, [[0, 1], [1, 2], [3, 4]]), r = clusterGraph(input, { algorithm: "leiden" }), changed = structuredClone(input); changed.nodes.reverse(); changed.edges.reverse();
    const p = structuredClone(r.partition); p.communities.reverse(); p.communities.forEach(c => { c.memberIds.reverse(); c.kernelIds.reverse(); c.externalContextIds.reverse(); });
    expect(buildInvestigationGroups(input, r.partition)).toEqual(buildInvestigationGroups(changed, p));
    const empty = synthetic(0, []); expect(clusterGraph(empty, { algorithm: "leiden" }).partition.communities).toEqual([]); expect(buildInvestigationGroups(empty, clusterGraph(empty).partition).groups).toEqual([]);
  });
});
describe("sparse end-to-end benchmarks (not a calibrated performance claim)", () => {
  for (const n of [1000, 10000]) test(`${n} nodes, E=1.25N-1, max raw degree=3; all clustering+groups`, () => {
    // N/4 directed 4-cycles plus one bridge per neighboring block: construction
    // O(N), no all-pairs matrix, no wall-clock assertions on shared CI hardware.
    const pairs: Array<[number, number]> = []; for (let i = 0; i < n; i += 4) { for (let j = 0; j < 4; j++) pairs.push([i + j, i + (j + 1) % 4]); if (i + 4 < n) pairs.push([i + 3, i + 4]); }
    const input = synthetic(n, pairs), start = performance.now(), summaries: unknown[] = [];
    for (const algorithm of ["historical-cc", "hub-baseline", "ppr", "leiden"] as const) {
      const t = performance.now(), result = clusterGraph(input, { algorithm, seedIds: [id(0)], maxCommunitySize: 64 });
      const groups = buildInvestigationGroups(input, result.partition, {}, { graph: result.projection.graph, hubIds: result.metrics.hubIds }); fullCoverage(input, result.partition);
      expect(groups.groups.flatMap(g => g.ownedFunctionIds)).toHaveLength(n); expect(result.metrics.arcCount).toBe(pairs.length);
      summaries.push({ algorithm, ms: Math.round(performance.now() - t), communities: result.partition.communities.length, groups: groups.groups.length, levels: result.metrics.leiden?.levels ?? null, convergence: result.metrics.leiden?.converged ?? result.metrics.ppr.every(r => r.converged) });
    }
    console.log(JSON.stringify({ benchmark: "L3-sparse-v1", N: n, E: pairs.length, density: pairs.length / (n * n), maximumRawDegree: 3, SCCs: n / 4, elapsedMs: Math.round(performance.now() - start), summaries }));
  }, 120000);
});
