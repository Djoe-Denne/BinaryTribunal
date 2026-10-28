import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canonical, fingerprint } from "../src/validation";
import { clusterGraph, projectStructural, sparseGraph, validateSparseGraph, exportSparseGraph, importSparseGraph, weakComponents, historicalComponents, personalizedPageRank, pprScoreBudget, ClusterDiagnosticError, LEIDEN_SEED_CONTRACT_VERSION, NUMERIC_POLICY_VERSION, NUMERIC_SOURCE_BUDGET_VERSION, sweepCut, conductance, directedModularity, leiden, weightSensitivity, compareFunctionId, type Arc, type ClusterInput, type ClusterPartition, type SparseGraph } from "../src/cluster";
import { buildInvestigationGroups } from "../src/investigation-groups";
// Strict JSON shape and cross-field L2 invariants are separate gates. Both L2
// and the independent L3 boundary reject contradictory relation metadata.
// These roundtrips are fixture/offline evidence, not native proof.
import { validateGraphSnapshot, validateGraphSnapshotSchema, projectFunctionRelations, fingerprintWithout, compareEdges, validateStaticJsonSchema, type GraphSnapshotV1 } from "../src/graph";

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
function originalGainOracle(g: SparseGraph, labels: number[], gamma = 1): number {
  if (!g.totalWeight) return 0;
  const q = modularityOracle(g, labels, gamma), targets = [...new Set(labels), Math.max(...labels) + 1]; let best = 0;
  // Enumerate ALL target communities, not just production's adjacent candidates.
  for (let node = 0; node < labels.length; node++) for (const target of targets) {
    const candidate = [...labels]; candidate[node] = target;
    best = Math.max(best, modularityOracle(g, candidate, gamma) - q);
  }
  return best;
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
  test("RV3-02 true L2 transport roundtrip rejects RAW shard metadata before live filters", () => {
    const clean = fixture("communities-obvious") as GraphSnapshotV1, partition = clusterGraph(clean).partition;
    expect(validateGraphSnapshot(clean)).toEqual([]);
    const changes = [{ status: "invalidated" }, { confidence: "low" }, { appearedInRevision: 2 }, { retiredInRevision: 1 }, { schedulerRelevance: "non_blocking" }] as const;
    for (const change of changes) {
      const snapshot = structuredClone(clean), shard = { ...structuredClone(snapshot.edges[0]!), ...change, id: `edge:shard-${Object.keys(change)[0]}` };
      snapshot.edges.push(shard); snapshot.edges.sort(compareEdges); snapshot.normalizedFingerprint = fingerprintWithout(snapshot, "normalizedFingerprint");
      expect(validateGraphSnapshotSchema(snapshot)).toEqual([]);
      expect(validateGraphSnapshot(snapshot).some(error => error.includes("conflicting relation shard metadata"))).toBe(true);
      expect(() => projectFunctionRelations(snapshot)).toThrow("conflicting relation shard metadata");
      const before = canonical(snapshot), boundPartition = { ...partition, snapshotFingerprint: snapshot.normalizedFingerprint };
      for (const edges of [snapshot.edges, [...snapshot.edges].reverse()]) {
        const input = { ...snapshot, edges };
        expect(() => projectStructural(input)).toThrow("conflicting relation shards");
        expect(() => historicalComponents(input)).toThrow("conflicting relation shards");
        expect(() => buildInvestigationGroups(input, boundPartition)).toThrow("conflicting relation shards");
        expect(() => buildInvestigationGroups(input, boundPartition, {}, { graph: projectStructural(clean).graph })).toThrow("conflicting relation shards");
      }
      expect(canonical(snapshot)).toBe(before);
    }
  });
  test("RV3-02 lightweight metadata presence and inactive/hypothesis shards also reconcile", () => {
    for (const kind of ["direct_call", "callback_candidate"]) for (const inactive of [false, true]) {
      const input = synthetic(2, [[0, 1]]), edge = input.edges[0]!;
      Object.assign(edge, { kind, schemaVersion: 1, direction: "source_to_destination", appearedInRevision: 1, schedulerRelevance: "context_only", status: inactive ? "invalidated" : "inferred", retiredInRevision: inactive ? 2 : null });
      for (const change of [{ schemaVersion: 2 }, { direction: "different" }, { confidence: "low" }, { schedulerRelevance: "non_blocking" }, { appearedInRevision: 3 }]) {
        const changed = structuredClone(input); changed.edges.push({ ...edge, ...change }); expect(() => projectStructural(changed)).toThrow("conflicting");
      }
      const missing = structuredClone(input); missing.edges.push({ ...edge }); delete missing.edges[1]!.schemaVersion;
      expect(() => projectStructural(missing)).toThrow("conflicting");
      input.edges.push({ ...edge }); expect(projectStructural(input).relationCount).toBe(inactive ? 0 : 1);
    }
  });
  test("coherent 64/65/129-site L2 shards retain a single logical affinity and deterministic fallback groups", () => {
    const clean = fixture("communities-obvious") as GraphSnapshotV1;
    // The immutable L1 fixture has a 16-byte caller. This synthetic 129-site
    // variant must declare its own larger caller span, not emit out-of-body sites.
    const caller = clean.nodes.find(node => node.id === clean.edges[0]!.sourceId)!;
    const endRvaExclusive = BigInt(clean.edges[0]!.sites[0]!.siteRva) + 129n;
    caller.boundaries[0]!.endRvaExclusive = `0x${endRvaExclusive.toString(16).toUpperCase()}`;
    caller.sizeBytes = { known: true, value: Number(endRvaExclusive - BigInt(caller.rva)) };
    clean.normalizedFingerprint = fingerprintWithout(clean, "normalizedFingerprint");
    expect(validateGraphSnapshot(clean)).toEqual([]);
    for (const count of [64, 65, 129]) {
      const snapshot = structuredClone(clean), source = snapshot.edges[0]!, sites = Array.from({ length: count }, (_, i) => {
        const siteRva = `0x${(BigInt(source.sites[0]!.siteRva) + BigInt(i)).toString(16).toUpperCase()}`;
        return { ...structuredClone(source.sites[0]!), siteRva, provenance: { ...source.sites[0]!.provenance, siteRva } };
      });
      snapshot.edges = snapshot.edges.slice(1);
      for (let start = 0; start < count; start += 64) snapshot.edges.push({ ...source, id: `edge:sites-${start}`, sites: sites.slice(start, start + 64) });
      snapshot.edges.sort(compareEdges); snapshot.normalizedFingerprint = fingerprintWithout(snapshot, "normalizedFingerprint");
      expect(validateGraphSnapshot(snapshot)).toEqual([]);
      expect(projectFunctionRelations(snapshot).find(r => r.sourceId === source.sourceId && r.destinationId === source.destinationId)!.sites).toHaveLength(count);
      expect(projectStructural(snapshot).graph.arcs).toEqual(projectStructural(clean).graph.arcs);
      const result = clusterGraph(snapshot), fallback = buildInvestigationGroups(snapshot, result.partition);
      expect(buildInvestigationGroups({ ...snapshot, edges: [...snapshot.edges].reverse() }, result.partition)).toEqual(fallback);
    }
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
  test("RV3-05 score-cell budget preflight is versioned, exact, overflow-safe and never drops seeds", () => {
    expect(pprScoreBudget(10, 2, { maxScoreCells: 50 }).requiredScoreCells).toBe(50);
    for (const cap of [49, 0, .5, Infinity]) expect(() => pprScoreBudget(10, 2, { maxScoreCells: cap })).toThrow();
    expect(() => pprScoreBudget(1, 1, { version: "unversioned" as never })).toThrow("version");
    expect(() => pprScoreBudget(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { maxScoreCells: Number.MAX_SAFE_INTEGER })).toThrow("ppr-score-budget-exceeded");
    const g = sparseGraph(Array.from({ length: 10 }, (_, i) => id(i)), []);
    expect(() => personalizedPageRank(g, [id(0)], { maxScoreCells: 39 })).toThrow("before score allocation");
    expect(personalizedPageRank(g, [id(0)], { maxScoreCells: 40 }).scores).toHaveLength(10);
    const input = synthetic(10, []), config = { algorithm: "ppr" as const, seedIds: [id(0), id(0), id(1)], ppr: { maxScoreCells: 50 } }, r = clusterGraph(input, config);
    expect(r.metrics.pprBudget).toMatchObject({ resultCount: 2, requiredScoreCells: 50 }); expect(r.metrics.ppr).toHaveLength(2);
    expect(clusterGraph(input, { ...config, ppr: { maxScoreCells: 51 } }).partition.configFingerprint).not.toBe(r.partition.configFingerprint);
    expect(() => clusterGraph(input, { ...config, seedCapabilityIds: ["missing"] })).toThrow("not silently dropped");
    input.capabilities = [{ id: "object-cap", subjectId: "object", subjectKind: "object", capability: "entry" }];
    expect(() => clusterGraph(input, { ...config, seedCapabilityIds: ["object-cap"] })).toThrow("must identify a function");
  });
  for (const n of [1000, 2000]) test(`RV3-05 many-seed oracle N=S=${n}, E=0, SCC=N; refused by default then explicit bounded retention`, () => {
    const input = synthetic(n, []), seedIds = input.nodes.map(n => n.id), start = performance.now();
    let refusal: ClusterDiagnosticError | undefined;
    try { clusterGraph(input, { algorithm: "ppr", seedIds }); } catch (error) { expect(error).toBeInstanceOf(ClusterDiagnosticError); refusal = error as ClusterDiagnosticError; }
    expect(refusal?.diagnostic).toMatchObject({ code: "ppr-score-budget-exceeded", counts: { nodeCount: n, resultCount: n, retainedScoreCells: String(n * n), requiredScoreCells: String(n * (n + 3)) } });
    const result = clusterGraph(input, { algorithm: "ppr", seedIds, ppr: { maxScoreCells: n * (n + 3) } }); fullCoverage(input, result.partition);
    expect(result.metrics.ppr).toHaveLength(n);
    expect(result.metrics.ppr.reduce((sum, r) => sum + r.scores.length, 0)).toBe(n * n);
    result.metrics.ppr.forEach((r, seed) => { expect(r.scores[seed]).toBe(1); expect(r.region).toEqual([seed]); expect(r.scores.reduce((a, b) => a + b)).toBe(1); });
    expect(result.metrics.pprBudget!.requiredScoreCells).toBe(n * (n + 3));
    console.log(JSON.stringify({ benchmark: "L3-PPR-cells-v1", N: n, E: 0, S: n, SCCs: n, maxDegree: 0, retainedCells: n * n, scratchCellAllowance: 3 * n, default: "fail-closed-before-scores", elapsedMs: Math.round(performance.now() - start) }));
  }, 120000);
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
      const gain = originalGainOracle(g, r.labels); expect(r.originalMaxGain).toBeCloseTo(gain, 10);
      if (r.converged) { expect(gain).toBeLessThanOrEqual(r.originalGainTolerance + 1e-10); expect(r.originalImprovingMoves).toBe(0); expect(r.boundReached || r.connectivityRepaired).toBe(false); }
      expect(leiden(sparseGraph(g.ids, [...arcs].reverse()), { seed: `property:${trial}` })).toEqual(r);
    }
  });
  test("RV3-01 quotient stability is NOT original convergence (parent five-node counterexample)", () => {
    const arcs = [[3, 3, 1], [3, 4, 2], [0, 0, 3], [2, 4, 2], [3, 0, 1], [1, 2, 1], [3, 1, 1], [2, 3, 1], [4, 0, 3], [3, 1, 1]].map(([source, target, weight]) => ({ source: source!, target: target!, weight: weight! }));
    const g = sparseGraph(Array.from({ length: 5 }, (_, i) => id(i)), arcs), oldLabels = [0, 1, 1, 1, 1], corrected = [0, 1, 1, 1, 0];
    expect(modularityOracle(g, oldLabels)).toBe(27 / 128); expect(modularityOracle(g, corrected)).toBe(30 / 128);
    const config = { seed: "rv-min:1645", resolution: 1, temperature: 0 };
    const bounded = leiden(g, { ...config, maxOriginalRounds: 1 });
    expect(bounded.labels).toEqual(oldLabels); expect(bounded.modularity).toBe(27 / 128);
    expect(bounded.converged).toBe(false); expect(bounded.boundReached).toBe(true); expect(bounded.originalImprovingMoves).toBeGreaterThan(0);
    expect(bounded.originalMaxGain).toBeCloseTo(originalGainOracle(g, bounded.labels), 12); expect(bounded.diagnostics.join(" ")).toContain("positive original-node gain");
    const r = leiden(g, config);
    expect(r.converged).toBe(true); expect(r.originalRounds).toBeGreaterThan(1); expect(r.refinementMerges).toBeGreaterThan(0); expect(r.aggregations).toBeGreaterThan(0);
    expect(r.modularity).toBeGreaterThanOrEqual(30 / 128); expect(r.modularity).toBeCloseTo(modularityOracle(g, r.labels), 12); expect(originalGainOracle(g, r.labels)).toBeLessThan(1e-12);
    expect(leiden(sparseGraph(g.ids, [...arcs].reverse()), config)).toEqual(r);
    for (const seed of ["rv-min:1645", "rv-min:1646", "rv-loops:v1", "rv-duplicates:v1"]) {
      const trial = leiden(g, { ...config, seed }); expect(trial.originalMaxGain).toBeCloseTo(originalGainOracle(g, trial.labels), 12);
      if (trial.converged) expect(originalGainOracle(g, trial.labels)).toBeLessThan(1e-12);
    }
  });
  test("RV3-04 seed gate follows partition v1 without truncation or silent normalization", () => {
    const input = synthetic(2, [[0, 1]]), g = projectStructural(input).graph;
    for (const seed of ["", " \t\n", "0", "none", "x".repeat(65), 0, null, undefined]) {
      expect(() => leiden(g, { seed: seed as string })).toThrow("explicit Leiden seed");
      expect(() => clusterGraph(input, { algorithm: "leiden", leiden: { seed: seed as string } })).toThrow("explicit Leiden seed");
    }
    for (const seed of ["x".repeat(64), "0:v1", "  explicit:v1  "]) {
      const r = clusterGraph(input, { algorithm: "leiden", leiden: { seed } }); expect(r.partition.seed).toBe(seed);
      expect(r.metrics.leiden!.seedContractVersion).toBe(LEIDEN_SEED_CONTRACT_VERSION);
      expect(validateStaticJsonSchema(r.partition, JSON.parse(readFileSync(join(import.meta.dir, "../schemas/cluster-partition-v1.schema.json"), "utf8")))).toEqual([]);
    }
  });
  test("bounded disconnected-community repair is explicit and never converged", () => {
    const arcs = [[3, 7, 2.25], [0, 1, 2.25], [1, 6, .5], [6, 5, 2.25], [7, 1, 2], [4, 1, .75], [5, 5, 1.25], [2, 1, .75], [3, 4, 2.5], [0, 3, 2.25], [1, 3, 2.25], [6, 4, 1.25], [7, 4, .75], [4, 3, 1.25], [5, 5, 2.75], [2, 4, .25], [3, 6, .25], [0, 6, 1.25], [1, 6, .25], [6, 4, 1.5], [7, 5, .25], [4, 6, 1.5]].map(([source, target, weight]) => ({ source: source!, target: target!, weight: weight! }));
    const g = sparseGraph(Array.from({ length: 8 }, (_, i) => id(i)), arcs), r = leiden(g, { seed: "repair:5298", maxSweeps: 2, maxLevels: 2, maxOriginalRounds: 1 });
    expect(r.connectivityRepaired).toBe(true); expect(r.converged).toBe(false); expect(r.boundReached).toBe(true);
    expect(r.diagnostics.join(" ")).toContain("repaired proposal is nonconverged");
    expect(r.modularity).toBeCloseTo(modularityOracle(g, r.labels), 12); expect(r.originalMaxGain).toBeCloseTo(originalGainOracle(g, r.labels), 12);
    for (const label of new Set(r.labels)) {
      const members = r.labels.map((c, i) => c === label ? i : -1).filter(i => i >= 0), seen = new Set([members[0]!]), queue = [members[0]!];
      for (let q = 0; q < queue.length; q++) for (const j of [...g.out[queue[q]!]!.keys(), ...g.incoming[queue[q]!]!.keys()]) if (r.labels[j] === label && !seen.has(j)) { seen.add(j); queue.push(j); }
      expect(seen.size).toBe(members.length);
    }
  });
  test("original attestation agrees with all-community dense oracle across scales, seeds, loops, duplicates and bounds", () => {
    for (let trial = 0; trial < 24; trial++) {
      const n = 7, scale = [1e-5, 1, 1e5][trial % 3]!, gamma = [.2, 1, 3][trial % 3]!;
      const arcs = Array.from({ length: 20 }, (_, j) => ({ source: (j * 5 + trial) % n, target: (j * j + trial * 3) % n, weight: scale * ((j * 7 + trial) % 5 + 1) / 7 }));
      arcs.push({ ...arcs[3]! }, { source: trial % n, target: trial % n, weight: scale * 3 });
      const g = sparseGraph(Array.from({ length: n }, (_, i) => id(i)), arcs);
      for (const bounded of [false, true]) {
        const config = { seed: `scale:${trial}`, resolution: gamma, temperature: trial % 2 ? 0 : .01, ...(bounded ? { maxSweeps: 1, maxLevels: 1, maxOriginalRounds: 1 } : {}) };
        const r = leiden(g, config), gain = originalGainOracle(g, r.labels, gamma);
        expect(r.originalMaxGain).toBeCloseTo(gain, 9); expect(r.modularity).toBeCloseTo(modularityOracle(g, r.labels, gamma), 9);
        if (r.converged) { expect(gain).toBeLessThanOrEqual(r.originalGainTolerance + 1e-9); expect(r.boundReached || r.connectivityRepaired).toBe(false); }
        expect(leiden(sparseGraph(g.ids, [...arcs].reverse()), config)).toEqual(r);
      }
    }
  });
  test("1200 seeded directed stress cases: raw-matrix oracle verifies convergence, gains and nondecreasing objective", () => {
    // Independent raw-arc matrix, not production degree caches or delta formula.
    // Small N=4..9 only. Xorshift seed fixes data, loops/duplicate arcs retained.
    let state = 87671231; const next = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return state >>> 0; };
    let converged = 0, bounded = 0, repaired = 0, restarts = 0;
    for (let trial = 0; trial < 1200; trial++) {
      const n = 4 + next() % 6, scale = [.001, 1, 1000][trial % 3]!, gamma = [.2, 1, 2.5, 7][trial % 4]!;
      const arcs = Array.from({ length: 3 * n }, () => ({ source: next() % n, target: next() % n, weight: scale * (1 + next() % 17) / 8 })); arcs.push({ ...arcs[0]! });
      const w = Array.from({ length: n }, () => Array(n).fill(0) as number[]); for (const a of arcs) w[a.source]![a.target] += a.weight;
      const out = w.map(row => row.reduce((a, b) => a + b, 0)), incoming = Array.from({ length: n }, (_, j) => w.reduce((s, row) => s + row[j]!, 0)), m = out.reduce((a, b) => a + b, 0);
      const q = (labels: number[]) => { let sum = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (labels[i] === labels[j]) sum += w[i]![j]! / m - gamma * (out[i]! / m) * (incoming[j]! / m); return sum; };
      const g = sparseGraph(Array.from({ length: n }, (_, i) => id(i)), arcs), r = leiden(g, { seed: `stress:${trial}`, resolution: gamma, temperature: trial % 2 ? .01 : 0, ...(trial % 5 === 0 ? { maxOriginalRounds: 1, maxLevels: 1, maxSweeps: 1 } : {}) });
      const base = q(r.labels); let best = 0;
      for (let i = 0; i < n; i++) for (const target of [...new Set(r.labels), n]) { const labels = [...r.labels]; labels[i] = target; best = Math.max(best, q(labels) - base); }
      expect(r.originalMaxGain).toBeCloseTo(best, 9); expect(r.modularity).toBeCloseTo(base, 9);
      expect(base).toBeGreaterThanOrEqual(q(Array.from({ length: n }, (_, i) => i)) - 1e-9);
      if (r.converged) { converged++; expect(best).toBeLessThanOrEqual(r.originalGainTolerance + 1e-9); expect(r.boundReached || r.connectivityRepaired).toBe(false); }
      if (r.boundReached) { bounded++; expect(r.converged).toBe(false); }
      if (r.connectivityRepaired) { repaired++; expect(r.converged).toBe(false); }
      if (r.originalRounds > 1) restarts++;
    }
    console.log(JSON.stringify({ stress: "L3-directed-original-oracle-v1", trials: 1200, rawPRNGSeed: 87671231, converged, bounded, repaired, restarts }));
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
    const empty = structuredClone(fixture("communities-obvious")) as GraphSnapshotV1;
    empty.nodes = []; empty.edges = []; empty.objects = []; empty.unresolved = []; empty.capabilities = []; empty.scope.functionCount = 0;
    empty.normalizedFingerprint = fingerprintWithout(empty, "normalizedFingerprint"); expect(validateGraphSnapshot(empty)).toEqual([]);
    for (const algorithm of ["historical-cc", "hub-baseline", "ppr", "leiden"] as const) {
      let refusal: ClusterDiagnosticError | undefined;
      try { clusterGraph(empty, { algorithm }); } catch (error) { expect(error).toBeInstanceOf(ClusterDiagnosticError); refusal = error as ClusterDiagnosticError; }
      expect(refusal?.diagnostic.code).toBe("empty-snapshot-no-partition");
    }
    expect(() => buildInvestigationGroups(empty, { ...r.partition, snapshotId: empty.snapshotId, snapshotFingerprint: empty.normalizedFingerprint, communities: [] })).toThrow("no v1 partition");
  });
  test("L8 family IDs stay stable while content/context binding follows supplied projection and hubs", () => {
    const input = synthetic(3, []), partition = clusterGraph(input).partition, allIds = input.nodes.map(n => n.id);
    const g = sparseGraph(allIds, [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 2, weight: 2 }]);
    const raw = buildInvestigationGroups(input, partition, { maxContextFunctions: 1 }), a = buildInvestigationGroups(input, partition, { maxContextFunctions: 1 }, { graph: g }), b = buildInvestigationGroups(input, partition, { maxContextFunctions: 1 }, { graph: g, hubIds: [id(2)] });
    expect(raw.groups.map(g => g.groupId)).toEqual(a.groups.map(g => g.groupId)); expect(a.groups.map(g => g.groupId)).toEqual(b.groups.map(g => g.groupId));
    expect(raw.groups[0]!.contextFunctionIds).toEqual([]); expect(a.groups[0]!.contextFunctionIds).toEqual([id(1)]); expect(b.groups[0]!.contextFunctionIds).toEqual([id(2)]);
    for (const pair of [[raw, a], [a, b]]) {
      expect(pair[0]!.metrics.contextBinding.bindingFingerprint).not.toBe(pair[1]!.metrics.contextBinding.bindingFingerprint);
      const groupId = pair[0]!.groups[0]!.groupId; expect(pair[0]!.metrics.contentFingerprintByGroupId[groupId]).not.toBe(pair[1]!.metrics.contentFingerprintByGroupId[groupId]);
    }
    const permuted = sparseGraph([...allIds].reverse(), g.arcs.map(arc => ({ source: 2 - arc.source, target: 2 - arc.target, weight: arc.weight }))).arcs.reverse();
    expect(buildInvestigationGroups(input, partition, { maxContextFunctions: 1 }, { graph: sparseGraph([...allIds].reverse(), permuted), hubIds: [id(2), id(2)] })).toEqual(b);
    expect(JSON.parse(JSON.stringify(b.metrics))).toEqual(b.metrics);
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
      summaries.push({ algorithm, S: algorithm === "ppr" ? 1 : 0, ms: Math.round(performance.now() - t), communities: result.partition.communities.length, groups: groups.groups.length, levels: result.metrics.leiden?.levels ?? null, originalRounds: result.metrics.leiden?.originalRounds ?? null, originalMaxGain: result.metrics.leiden?.originalMaxGain ?? null, bound: result.metrics.leiden?.boundReached ?? false, repair: result.metrics.leiden?.connectivityRepaired ?? false, pprCells: result.metrics.pprBudget?.requiredScoreCells ?? 0, convergence: result.metrics.leiden?.converged ?? result.metrics.ppr.every(r => r.converged) });
    }
    console.log(JSON.stringify({ benchmark: "L3-sparse-v1", N: n, E: pairs.length, density: pairs.length / (n * n), maximumRawDegree: 3, SCCs: n / 4, elapsedMs: Math.round(performance.now() - start), summaries }));
  }, 120000);
});

describe("versioned numeric contract: independent BigInt rational oracles", () => {
  // Intentionally independent of production's bit decoder, integer move formula
  // and sparse candidate search: parse binary strings, use reduced fractions,
  // evaluate dense Q, enumerate ALL destinations, solve PPR by exact elimination.
  type R = { p: bigint; q: bigint };
  const zero: R = { p: 0n, q: 1n }, one: R = { p: 1n, q: 1n };
  function r(p: bigint, q = 1n): R {
    if (q < 0n) { p = -p; q = -q; }
    let a = p < 0n ? -p : p, b = q; while (b) [a, b] = [b, a % b];
    return { p: p / a, q: q / a };
  }
  const add = (a: R, b: R) => r(a.p * b.q + b.p * a.q, a.q * b.q);
  const sub = (a: R, b: R) => r(a.p * b.q - b.p * a.q, a.q * b.q);
  const mul = (a: R, b: R) => r(a.p * b.p, a.q * b.q);
  const div = (a: R, b: R) => r(a.p * b.q, a.q * b.p);
  const cmp = (a: R, b: R) => a.p * b.q < b.p * a.q ? -1 : a.p * b.q > b.p * a.q ? 1 : 0;
  const abs = (a: R) => ({ p: a.p < 0n ? -a.p : a.p, q: a.q });
  const total = (values: R[]) => values.reduce(add, zero);
  const asNumber = (a: R) => Number((a.p << 62n) / a.q) / 2 ** 62;
  function fromNumber(value: number): R {
    const [whole, fraction = ""] = Math.abs(value).toString(2).split(".");
    return r((value < 0 ? -1n : 1n) * BigInt(`0b${whole}${fraction}`), 1n << BigInt(fraction.length));
  }
  function expectRounded(actual: number, exact: R): void {
    expect(Number.isFinite(actual)).toBe(true);
    // Relative (not a near-zero absolute toBeCloseTo) check exercises reports
    // below 1e-300 too. Exact zero gets only one subnormal quantum allowance.
    const allowance = add(mul(abs(exact), r(1n, 1n << 51n)), fromNumber(Number.MIN_VALUE));
    expect(cmp(abs(sub(fromNumber(actual), exact)), allowance)).toBeLessThanOrEqual(0);
  }
  function matrix(n: number, arcs: Arc[]): R[][] {
    const a = Array.from({ length: n }, () => Array.from({ length: n }, () => zero));
    for (const e of arcs) a[e.source]![e.target] = add(a[e.source]![e.target]!, fromNumber(e.weight));
    return a;
  }
  function qOracle(n: number, arcs: Arc[], labels: number[], gamma = 1): R {
    const a = matrix(n, arcs), m = total(a.flat()); if (!m.p) return zero;
    const normalized = a.map(row => row.map(x => div(x, m))), rows = normalized.map(total), columns = a.map((_, j) => total(normalized.map(row => row[j]!)));
    let answer = zero;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (labels[i] === labels[j]) answer = add(answer, sub(normalized[i]![j]!, mul(fromNumber(gamma), mul(rows[i]!, columns[j]!))));
    return answer;
  }
  function movesOracle(n: number, arcs: Arc[], labels: number[], tolerance: number, gamma = 1) {
    const q = qOracle(n, arcs, labels, gamma), threshold = div(fromNumber(tolerance), total(matrix(n, arcs).flat()));
    let max = zero, improving = 0;
    for (let node = 0; node < n; node++) {
      let best = zero;
      for (const target of [...new Set(labels), Math.max(...labels) + 1]) {
        const changed = labels.slice(); changed[node] = target;
        const gain = sub(qOracle(n, arcs, changed, gamma), q); if (cmp(gain, best) > 0) best = gain;
      }
      if (cmp(best, threshold) > 0) improving++;
      if (cmp(best, max) > 0) max = best;
    }
    return { max, improving, threshold };
  }
  function pprOracle(n: number, arcs: Arc[], seeds: number[], direction: "callee" | "caller" | "both", damping: number) {
    const directed = direction === "callee" ? arcs : direction === "caller" ? arcs.map(e => ({ ...e, source: e.target, target: e.source })) : arcs.flatMap(e => [e, { ...e, source: e.target, target: e.source }]);
    const a = matrix(n, directed), rows = a.map(total), p = Array.from({ length: n }, (_, i) => seeds.includes(i) ? r(1n, BigInt(seeds.length)) : zero), d = fromNumber(damping);
    const transition = a.map((row, i) => rows[i]!.p ? row.map(w => div(w, rows[i]!)) : p);
    const b = p.map(v => mul(sub(one, d), v));
    const system = Array.from({ length: n }, (_, target) => [...Array.from({ length: n }, (_, source) => sub(source === target ? one : zero, mul(d, transition[source]![target]!))), b[target]!]);
    for (let k = 0; k < n; k++) {
      const pivot = system.findIndex((row, i) => i >= k && row[k]!.p !== 0n); expect(pivot).toBeGreaterThanOrEqual(k);
      [system[k], system[pivot]] = [system[pivot]!, system[k]!];
      const divisor = system[k]![k]!; system[k] = system[k]!.map(x => div(x, divisor));
      for (let i = 0; i < n; i++) if (i !== k) { const factor = system[i]![k]!; system[i] = system[i]!.map((x, j) => sub(x, mul(factor, system[k]![j]!))); }
    }
    return { solution: system.map(row => row[n]!), residual: (scores: number[]) => total(b.map((v, j) => abs(sub(add(v, total(transition.map((row, i) => mul(d, mul(row[j]!, fromNumber(scores[i]!)))))), fromNumber(scores[j]!))))) };
  }
  function numericRefusal(action: () => unknown): void {
    let error: unknown; try { action(); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(ClusterDiagnosticError);
    expect((error as ClusterDiagnosticError).diagnostic.code).toBe("unsupported-numeric");
    expect((error as ClusterDiagnosticError).diagnostic.detail).toContain(NUMERIC_POLICY_VERSION);
  }
  test("RV3M-06 tiny disjoint cycles: actual equation residual, mass and analytic solution", () => {
    for (const weight of [Number.MIN_VALUE, 1e-320, 1, 2 ** 1000]) {
      const arcs = [[0, 1], [1, 0], [2, 3], [3, 2]].map(([source, target]) => ({ source: source!, target: target!, weight }));
      const result = personalizedPageRank(sparseGraph([id(0), id(1), id(2), id(3)], arcs), [id(0)], { tolerance: 1e-12 });
      const oracle = pprOracle(4, arcs, [0], "callee", .85), residual = oracle.residual(result.scores);
      expect(result.converged).toBe(true); expect(result.numericPolicyVersion).toBe(NUMERIC_POLICY_VERSION);
      expect(result.scores[0]).toBeCloseTo(1 / 1.85, 12); expect(result.scores[1]).toBeCloseTo(.85 / 1.85, 12);
      expect(result.scores.slice(2)).toEqual([0, 0]); expect(result.scoreMass).toBeCloseTo(1, 14);
      expect(cmp(residual, fromNumber(result.residualUpperBound))).toBeLessThanOrEqual(0);
      expect(result.residualUpperBound).toBeLessThanOrEqual(1e-12);
    }
  });
  test("RV3M-07 3u/2u raw tolerance u: exact gain 6/25 beats 1/5", () => {
    const u = Number.MIN_VALUE, arcs = [{ source: 0, target: 1, weight: 3 * u }, { source: 2, target: 3, weight: 2 * u }], graph = sparseGraph([id(0), id(1), id(2), id(3)], arcs);
    const before = movesOracle(4, arcs, [0, 1, 2, 3], u);
    expect(before.max).toEqual(r(6n, 25n)); expect(before.threshold).toEqual(r(1n, 5n));
    const result = leiden(graph, { seed: "rv-subnormal", resolution: 1, temperature: 0, tolerance: u });
    expect(result.converged).toBe(true); expect(result.labels[0]).toBe(result.labels[1]); expect(result.labels[2]).toBe(result.labels[3]);
    expect(result.labels[0]).not.toBe(result.labels[2]); expect(result.modularity).toBe(.48);
    expect(result.originalGainTolerance).toBe(.2); expect(result.originalImprovingMoves).toBe(0);
    expect(result.gainComparison).toBe("exact-binary64-dyadic"); expect(result.toleranceUnits).toBe("raw-weight");
    expect(movesOracle(4, arcs, result.labels, u).improving).toBe(0);
  });
  test("duplicate summands below an ulp cannot certify the rounded aggregate instead of the source", () => {
    const arcs = [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 ** -54 }, { source: 2, target: 3, weight: 1 }];
    const graph = sparseGraph([id(0), id(1), id(2), id(3)], arcs), config = { seed: "duplicate-rounding", temperature: 0, tolerance: .5 };
    expect(graph.arcs[0]!.weight).toBe(1); // binary64 canonical view necessarily rounds
    const result = leiden(graph, config), oracle = movesOracle(4, arcs, result.labels, .5);
    expect(result.originalImprovingMoves).toBe(oracle.improving); expectRounded(result.originalMaxGain, oracle.max);
    if (oracle.improving) { expect(result.converged).toBe(false); expect(result.diagnostics.join(" ")).toContain("no convergence claim"); }
    else expect(cmp(oracle.max, oracle.threshold)).toBeLessThanOrEqual(0);
    // Mathematically each singleton merge exceeds RAW .5 by ~2^-56, although
    // both reported ΔQ numbers round to .25. Never compare the rounded reports.
    expect(movesOracle(4, arcs, [0, 1, 2, 3], .5).improving).toBe(4);
    expect(leiden(sparseGraph(graph.ids, [...arcs].reverse()), config)).toEqual(result);
  });
  test("summand snapshots round-trip binary64 JSON, deterministic bindings and the declared convention", () => {
    for (const scale of [2 ** -1000, 1, 2 ** 990]) {
      const arcs = [{ source: 0, target: 1, weight: scale }, { source: 0, target: 1, weight: scale * 2 ** -54 }, { source: 2, target: 3, weight: scale }];
      const graph = sparseGraph([id(0), id(1), id(2), id(3)], arcs), snapshot = exportSparseGraph(graph);
      expect(snapshot.numericSource!.arcs).toEqual(arcs.slice().sort((a, b) => a.source - b.source || a.target - b.target || a.weight - b.weight));
      expect(snapshot).toEqual(exportSparseGraph(sparseGraph(graph.ids, arcs.slice().reverse())));
      const restored = importSparseGraph(JSON.parse(JSON.stringify(snapshot)));
      expect(restored).toEqual(graph); expect(exportSparseGraph(restored)).toEqual(snapshot);
      const config = { seed: "roundtrip", temperature: 0, tolerance: .5 * scale };
      expect(leiden(restored, config)).toEqual(leiden(graph, config));
      expect(leiden(restored, config).numericGraph.weightConvention).toBe("source-summands-v1");
      for (const direction of ["callee", "caller", "both"] as const) {
        const ppr = personalizedPageRank(restored, [id(0)], { direction, tolerance: 1e-11 });
        expect(ppr).toEqual(personalizedPageRank(graph, [id(0)], { direction, tolerance: 1e-11 }));
        expect(cmp(pprOracle(4, arcs, [0], direction, .85).residual(ppr.scores), fromNumber(ppr.residualUpperBound))).toBeLessThanOrEqual(0);
      }
      expectRounded(directedModularity(restored, [0, 0, 1, 1])!, qOracle(4, arcs, [0, 0, 1, 1]));
      snapshot.numericSource!.arcs[0]!.weight *= 2; // copies, not an alias into graph
      expect(() => validateSparseGraph(graph)).not.toThrow(); numericRefusal(() => importSparseGraph(snapshot));
    }
    const graph = sparseGraph([id(0), id(1)], [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 ** -54 }]);
    const legacy = structuredClone(graph); delete legacy.numericPolicy; delete legacy.numericSource;
    expect(leiden(legacy, { temperature: 0 }).numericGraph.weightConvention).toBe("canonical-arcs-v1");
    expect(exportSparseGraph(legacy).numericPolicy.weightConvention).toBe("canonical-arcs-v1");
    expect(importSparseGraph(exportSparseGraph(legacy)).arcs).toEqual(legacy.arcs);
  });
  test("numeric source/cache mutation, missing metadata and rehashed forgeries fail at every consumer", () => {
    const input = synthetic(4, [[0, 1], [2, 3]]), partition = clusterGraph(input).partition;
    const graph = sparseGraph(input.nodes.map(n => n.id), [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 ** -54 }, { source: 2, target: 3, weight: 1 }]);
    const poisons: Array<(g: SparseGraph) => void> = [
      g => { g.arcs[0]!.weight *= 2; }, g => { g.ids[0] = id(99); },
      g => { g.out[0]!.set(1, 2); }, g => { g.incoming[1]!.set(0, 2); }, g => { g.outDegree[0]!++; }, g => { g.inDegree[1]!++; }, g => { g.totalWeight++; }, g => { g.outDegree[1] = -0; },
      g => { g.numericSource!.arcs[0]!.weight *= 2; }, g => { g.numericSource!.arcs[0]!.source = 99; },
      g => { g.numericSource!.arcs[0]!.weight = 0; }, g => { g.numericSource!.arcs[0]!.weight = -0; }, g => { g.numericSource!.arcs[0]!.weight = Infinity; }, g => { g.numericSource!.arcs[0]!.weight = NaN; },
      g => { g.numericSource!.arcs.reverse(); }, g => { g.numericSource!.rawArcCount++; }, g => { g.numericSource!.maxArcs = 1; },
      g => { (g.numericSource as { version: string }).version = "unknown"; }, g => { g.numericSource!.bindingFingerprint = "0".repeat(64); },
      g => { delete g.numericSource; }, g => { delete g.numericPolicy; }, g => { g.numericPolicy!.weightConvention = "canonical-arcs-v1"; },
      g => {
        g.totalWeight = 99; // attacker can recompute an unkeyed digest, but not make caches concordant
        const s = g.numericSource!;
        const binding = fingerprint({ version: NUMERIC_POLICY_VERSION, weightConvention: "source-summands-v1", projection: { ids: g.ids, arcs: g.arcs, out: g.out.map(m => [...m]), incoming: g.incoming.map(m => [...m]), outDegree: g.outDegree, inDegree: g.inDegree, totalWeight: g.totalWeight }, source: { version: s.version, arcs: s.arcs, rawArcCount: s.rawArcCount, budgetVersion: s.budgetVersion, maxArcs: s.maxArcs } });
        s.bindingFingerprint = g.numericPolicy!.bindingFingerprint = binding;
      },
    ];
    const consumers = [(g: SparseGraph) => validateSparseGraph(g), (g: SparseGraph) => weakComponents(g), (g: SparseGraph) => conductance(g, [0]), (g: SparseGraph) => sweepCut(g, [.5, .5, 0, 0], 2), (g: SparseGraph) => personalizedPageRank(g, [id(0)]), (g: SparseGraph) => directedModularity(g, [0, 0, 1, 1]), (g: SparseGraph) => leiden(g), (g: SparseGraph) => exportSparseGraph(g), (g: SparseGraph) => buildInvestigationGroups(input, partition, {}, { graph: g })];
    for (const poison of poisons) { const bad = structuredClone(graph); poison(bad); for (const consume of consumers) numericRefusal(() => consume(bad)); }
    const missing = exportSparseGraph(graph); delete missing.numericSource; numericRefusal(() => importSparseGraph(missing));
    const changed = structuredClone(graph); validateSparseGraph(changed); changed.outDegree[0]!++; numericRefusal(() => validateSparseGraph(changed)); // no memoized receipt
    const groups = buildInvestigationGroups(input, partition, {}, { graph });
    const rounded = sparseGraph(graph.ids, graph.arcs), roundedGroups = buildInvestigationGroups(input, partition, {}, { graph: rounded });
    expect(groups.groups.map(g => g.groupId)).toEqual(roundedGroups.groups.map(g => g.groupId));
    expect(groups.metrics.contextBinding.bindingFingerprint).not.toBe(roundedGroups.metrics.contextBinding.bindingFingerprint);
  });
  test("retained summand budget is explicit O(raw E), separate from the dense PPR score budget", () => {
    const arcs = [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 }, { source: 1, target: 0, weight: 1 }, { source: 1, target: 0, weight: 2 }];
    let error: unknown; try { sparseGraph([id(0), id(1)], arcs, { maxNumericSourceArcs: 3 }); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(ClusterDiagnosticError); expect((error as ClusterDiagnosticError).diagnostic.code).toBe("numeric-source-budget-exceeded");
    const graph = sparseGraph([id(0), id(1)], arcs, { maxNumericSourceArcs: 8 });
    const result = personalizedPageRank(graph, [id(0)], { direction: "both", maxScoreCells: 8 });
    expect(result.converged).toBe(true); expect(result.numericGraph.budgetVersion).toBe(NUMERIC_SOURCE_BUDGET_VERSION);
    expect(result.numericArcStorage).toEqual({ inputRetainedSummands: 4, viewRetainedSummands: 8, transitionEntries: 8, rowEntries: 8 });
    expect(result.numericGraph.sourceArcCount).toBe(4); expect(result.numericGraph.retainedSourceArcCount).toBe(4);
    expect(sparseGraph([id(0), id(1)], graph.arcs, { maxNumericSourceArcs: 1 }).numericSource).toBeUndefined(); // no extra raw retention for unique arcs
    expect(() => personalizedPageRank(graph, [id(0)], { direction: "both", maxScoreCells: 7 })).toThrow("ppr-score-budget-exceeded");
  });
  test("PPR stagnation below numerical floor is nonconvergence, not a zero-residual PASS", () => {
    const graph = sparseGraph([id(0), id(1)], [{ source: 0, target: 1, weight: 1 }, { source: 1, target: 0, weight: 1 }]);
    const result = personalizedPageRank(graph, [id(0)], { tolerance: Number.MIN_VALUE, maxIterations: 1000 });
    expect(result.converged).toBe(false); expect(result.numericStatus).toBe("roundoff-limited"); expect(result.iterateDeltaL1).toBeLessThanOrEqual(result.residualUpperBound);
    expect(result.residualUpperBound).toBeGreaterThan(Number.MIN_VALUE); expect(result.diagnostics.join(" ")).toContain("requested L1 tolerance not certified");
    const residual = pprOracle(2, graph.arcs, [0], "callee", .85).residual(result.scores);
    expect(cmp(residual, fromNumber(result.residualUpperBound))).toBeLessThanOrEqual(0);
    const proposal = clusterGraph(synthetic(2, [[0, 1], [1, 0]]), { algorithm: "ppr", seedIds: [id(0)], ppr: { tolerance: Number.MIN_VALUE, maxIterations: 1000 } });
    expect(proposal.partition.adopted).toBe(false); expect(proposal.metrics.ppr[0]!.converged).toBe(false);
    expect(proposal.metrics.diagnostics.join(" ")).toContain("roundoff-limited");
  });
  test("scale-covariant raw Leiden tolerance and temperature, seed/permutation/duplicate properties", () => {
    let state = 0x642ac31; const next = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state; };
    const start = performance.now(); let certificates = 0, targets = 0;
    for (let trial = 0; trial < 48; trial++) {
      const n = 2 + next() % 5, raw: Arc[] = [];
      for (let i = 0; i < n * 2; i++) { const edge = { source: next() % n, target: next() % n, weight: 1 + next() % 7 }; raw.push(edge); if (i % 4 === 0) raw.push({ ...edge }); }
      let baseline: number[] | undefined;
      for (const scale of [2 ** -1000, 1, 2 ** 990]) {
        const arcs = raw.map(e => ({ ...e, weight: e.weight * scale })), graph = sparseGraph(Array.from({ length: n }, (_, i) => id(i)), arcs), tolerance = scale * 2 ** -30;
        const config = { seed: `numeric:${trial}`, tolerance, temperature: .125 * scale, resolution: [.5, 1, 2][trial % 3]! };
        const result = leiden(graph, config), oracle = movesOracle(n, graph.arcs, result.labels, tolerance, config.resolution);
        expect(result.labels).toEqual(baseline ?? result.labels); baseline = result.labels;
        expect(leiden(sparseGraph(graph.ids, [...arcs].reverse()), config)).toEqual(result);
        expectRounded(result.modularity!, qOracle(n, graph.arcs, result.labels, config.resolution));
        expectRounded(result.originalMaxGain, oracle.max); expectRounded(result.originalGainTolerance, oracle.threshold); expect(result.originalImprovingMoves).toBe(oracle.improving);
        if (result.converged) { expect(cmp(oracle.max, oracle.threshold)).toBeLessThanOrEqual(0); certificates++; }
        targets += n * (new Set(result.labels).size + 1);
      }
    }
    console.log(JSON.stringify({ oracle: "BigInt-dense-Q-all-targets-v1", seed: "0x642ac31", cases: 144, certificates, targets, elapsedMs: Math.round(performance.now() - start) }));
  }, 120000);
  test("PPR rational Gauss oracle across scales/directions/loops/dangling/duplicates/multiple seeds", () => {
    const raw: Arc[] = [{ source: 0, target: 0, weight: 2 }, { source: 0, target: 1, weight: 3 }, { source: 0, target: 1, weight: 1 }, { source: 1, target: 2, weight: 5 }, { source: 3, target: 1, weight: 1 }];
    for (const direction of ["callee", "caller", "both"] as const) for (const scale of [Number.MIN_VALUE, 2 ** -1000, 1, 2 ** 990]) {
      const arcs = raw.map(e => ({ ...e, weight: e.weight * scale })), graph = sparseGraph(Array.from({ length: 5 }, (_, i) => id(i)), arcs);
      const result = personalizedPageRank(graph, [id(0), id(3)], { direction, tolerance: 1e-11, maxIterations: 1000 }), oracle = pprOracle(5, arcs, [0, 3], direction, .85);
      expect(result.converged).toBe(true); expect(result.scoreMass).toBeCloseTo(1, 13);
      expect(cmp(oracle.residual(result.scores), fromNumber(result.residualUpperBound))).toBeLessThanOrEqual(0);
      result.scores.forEach((value, i) => expect(value).toBeCloseTo(asNumber(oracle.solution[i]!), 10));
      expect(personalizedPageRank(sparseGraph(graph.ids, [...arcs].reverse()), [id(3), id(0)], { direction, tolerance: 1e-11, maxIterations: 1000 })).toEqual(result);
    }
  });
  test("mixed exponents and cancellation retain honest exact original certificates", () => {
    const sets: Arc[][] = [
      [{ source: 0, target: 0, weight: 2 ** 900 }, { source: 0, target: 1, weight: 1 }, { source: 1, target: 0, weight: 2 ** -100 }],
      [{ source: 0, target: 1, weight: 1 }, { source: 1, target: 0, weight: 1 + Number.EPSILON }, { source: 2, target: 2, weight: 2 ** -40 }, { source: 2, target: 1, weight: 2 ** -45 }],
      [{ source: 0, target: 0, weight: 1e300 }, { source: 1, target: 2, weight: 1e-5 }, { source: 2, target: 1, weight: 1e-5 }],
    ];
    for (const arcs of sets) for (const resolution of [1, 1 + Number.EPSILON]) {
      const graph = sparseGraph([id(0), id(1), id(2)], arcs), tolerance = 2 ** -50;
      const result = leiden(graph, { seed: "cancellation", temperature: 0, tolerance, resolution }), oracle = movesOracle(3, arcs, result.labels, tolerance, resolution);
      expect(result.originalImprovingMoves).toBe(oracle.improving); expectRounded(result.modularity!, qOracle(3, arcs, result.labels, resolution));
      expectRounded(result.originalMaxGain, oracle.max); expectRounded(result.originalGainTolerance, oracle.threshold);
      if (result.converged) expect(cmp(oracle.max, oracle.threshold)).toBeLessThanOrEqual(0);
      else expect(result.diagnostics.join(" ")).toContain("no convergence claim");
      const ppr = personalizedPageRank(graph, [id(1)], { maxIterations: 1000, tolerance: 1e-10 }), exact = pprOracle(3, arcs, [1], "callee", .85);
      expect(cmp(exact.residual(ppr.scores), fromNumber(ppr.residualUpperBound))).toBeLessThanOrEqual(0);
      if (ppr.converged) expect(cmp(exact.residual(ppr.scores), fromNumber(1e-10))).toBeLessThanOrEqual(0);
    }
  });
  test("mixed connected components keep scale-invariant cuts, partitions and transition equations", () => {
    const raw = [{ source: 0, target: 1, weight: 1 }, { source: 1, target: 0, weight: 1 }, { source: 2, target: 3, weight: 2 ** -600 }, { source: 3, target: 2, weight: 2 ** -600 }, { source: 1, target: 2, weight: 2 ** -800 }];
    let labels: number[] | undefined, scores: number[] | undefined;
    for (const scale of [2 ** -200, 1, 2 ** 200]) {
      const arcs = raw.map(e => ({ ...e, weight: e.weight * scale })), graph = sparseGraph([id(0), id(1), id(2), id(3)], arcs);
      const result = leiden(graph, { seed: "mixed-scale", temperature: 0, tolerance: scale * 2 ** -700 });
      expect(result.labels).toEqual(labels ?? result.labels); labels = result.labels;
      const oracle = movesOracle(4, arcs, result.labels, scale * 2 ** -700);
      expect(result.originalImprovingMoves).toBe(oracle.improving); if (result.converged) expect(oracle.improving).toBe(0);
      const cut = r(1n, (1n << 202n) + 1n);
      expectRounded(conductance(graph, [0, 1])!, cut); expectRounded(conductance(graph, [2, 3])!, cut);
      const ppr = personalizedPageRank(graph, [id(0)], { tolerance: 1e-11, maxIterations: 1000 });
      expect(ppr.converged).toBe(true); expect(ppr.scores).toEqual(scores ?? ppr.scores); scores = ppr.scores;
      expect(cmp(pprOracle(4, arcs, [0], "callee", .85).residual(ppr.scores), fromNumber(ppr.residualUpperBound))).toBeLessThanOrEqual(0);
    }
  });
  test("representable huge volume works; true overflow/dynamic-range loss refuse explicitly without artifacts", () => {
    const graph = sparseGraph([id(0), id(1)], [{ source: 0, target: 1, weight: 1e308 }]);
    expect(conductance(graph, [0])).toBe(1); expect(directedModularity(graph, [0, 0])).toBe(0);
    expect(personalizedPageRank(graph, [id(0)]).converged).toBe(true);
    expect(leiden(graph, { tolerance: 1e295, temperature: 0 }).converged).toBe(true);
    numericRefusal(() => sparseGraph(graph.ids, [{ source: 0, target: 1, weight: Number.MAX_VALUE }, { source: 0, target: 1, weight: Number.MAX_VALUE }]));
    numericRefusal(() => sparseGraph(graph.ids, [{ source: 0, target: 1, weight: Number.MAX_VALUE }, { source: 1, target: 0, weight: Number.MAX_VALUE }]));
    const mixed = sparseGraph(graph.ids, [{ source: 0, target: 1, weight: Number.MIN_VALUE }, { source: 0, target: 0, weight: 1e308 }]);
    numericRefusal(() => personalizedPageRank(mixed, [id(0)])); numericRefusal(() => leiden(mixed));
    const input = synthetic(2, [[0, 1]]); input.nodes[0]!.functionClass = "import";
    numericRefusal(() => clusterGraph(input, { weights: { direct: Number.MIN_VALUE, importFactor: .5 }, algorithm: "leiden" }));
  });
  test("projection product avoids intermediate under/overflow, preserves bindings and scalar metric schema", () => {
    const input = synthetic(2, [[0, 1]]); input.nodes[0]!.functionClass = "import"; input.nodes[1]!.functionClass = "wrapper";
    for (const [direct, importFactor, utilityFactor, expected] of [[1e-200, 1e-200, 1e200, 1e-200], [1e200, 1e200, 1e-200, 1e200]]) {
      const projection = projectStructural(input, { direct, importFactor, utilityFactor });
      expect(projection.graph.arcs[0]!.weight / expected!).toBeCloseTo(1, 14);
    }
    const tiny = clusterGraph(input, { algorithm: "ppr", seedIds: [id(0)], weights: { direct: Number.MIN_VALUE, importFactor: 1, utilityFactor: 1 } });
    expect(tiny.metrics.numericPolicyVersion).toBe(NUMERIC_POLICY_VERSION); expect(tiny.metrics.ppr[0]!.converged).toBe(true);
    const groups = buildInvestigationGroups(input, tiny.partition, {}, { graph: tiny.projection.graph });
    expect(groups.groups.flatMap(g => g.ownedFunctionIds)).toHaveLength(2); expect(groups.metrics.contextBinding.bindingFingerprint).toHaveLength(64);
    expect(tiny.partition.modularity).toEqual({ known: false, value: null }); expect(tiny.partition.adopted).toBe(false);
  });
});
