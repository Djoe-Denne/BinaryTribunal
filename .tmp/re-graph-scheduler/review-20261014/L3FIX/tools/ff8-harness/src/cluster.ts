import { canonical, fingerprint, compareText } from "./validation";

/** Structural read-only projection, assignable from the L2 GraphSnapshot. L2 owns
 * the full transport types/validator; this boundary never claims to validate an
 * untrusted native snapshot. All results are unadopted proposals (regime A).
 * Implementation version is frozen in content IDs, not a claim of calibration.
 */
export type StructuralMaturity = "none" | "structural" | "partial" | "reconciled" | "published-local";
export interface ClusterNode {
  id: string; moduleSha256: string; rva: string; functionClass: string;
  status: string; semanticMaturity: StructuralMaturity;
  sizeBytes: KnownInteger; instructionCount: KnownInteger;
}
export interface KnownInteger { known: boolean; value: number | null }
/** Full L2 records are assignable, but lightweight fixture projections may omit
 * transport-only fields. Absence must be consistent across a relation's shards;
 * it is not evidence that an omitted native field has been validated. */
export interface ClusterEdge {
  sourceId: string; destinationId: string; kind: string; status: string;
  confidence: string; retiredInRevision: number | null;
  schemaVersion?: number; direction?: string; appearedInRevision?: number;
  schedulerRelevance?: string;
  sites: Array<{ siteRva: string; xrefType: string }>;
}
export interface ClusterInput {
  snapshotId: string; normalizedFingerprint: string; nodes: ClusterNode[];
  edges: ClusterEdge[];
  objects: Array<{ id: string; kind: string }>;
  unresolved: Array<{ fromFunctionId: string; referencedObjectId: string | null; kind: string }>;
  capabilities: Array<{ id: string; subjectId: string; subjectKind: string; capability: string }>;
  coverage: { status: string; uncoveredReason: string | null };
}
export interface Community {
  contentId: string; lineageId: string; parentContentIds: string[];
  memberIds: string[]; kernelIds: string[]; externalContextIds: string[];
  conductance: KnownInteger;
}
export interface ClusterPartition {
  schemaVersion: 1; partitionId: string; lineageId: string; parentLineageId: null;
  snapshotId: string; snapshotFingerprint: string; regime: "A";
  algorithm: string; algorithmVersion: string; configFingerprint: string; seed: string;
  communities: Community[]; modularity: KnownInteger; maturity: "structural"; adopted: false;
}
export const CLUSTER_VERSION = "ff8-structural-1.1.0";
export const LEIDEN_SEED_CONTRACT_VERSION = "partition-v1-explicit-seed-v1";
/** Fail-closed refusals have no partition/metrics artifact. L8 must record this
 * diagnostic, not turn absence into an empty v1 partition or fabricated scores. */
export class ClusterDiagnosticError extends Error {
  constructor(readonly diagnostic: { version: "cluster-refusal-v1"; code: "empty-snapshot-no-partition" | "ppr-score-budget-exceeded"; detail: string; counts?: Record<string, string | number> }) {
    super(`cluster: ${diagnostic.code}: ${diagnostic.detail}; no partition produced`);
    this.name = "ClusterDiagnosticError";
  }
}
export interface WeightConfig {
  version: string; direct: number; tail: number; indirectHigh: number;
  indirectOther: number; thunk: number; dispatch: number; rareData: number;
  memoryWeak: number; memoryWindow: number; rareObjectMaxUsers: number;
  importFactor: number; utilityFactor: number; hubThreshold: number; hubFactor: number;
}
/** Heuristic starting points only: control transfer > uncertain indirect > DATA;
 * callbacks remain hypotheses. Memory proximity OFF by default. No fitted data.
 * Rare-object fanout cap is explicit: dense expansion never hides quadratic work.
 */
export const DEFAULT_WEIGHTS: Readonly<WeightConfig> = Object.freeze({
  version: "heuristic-not-calibrated-v1", direct: 1, tail: 1, indirectHigh: .6,
  indirectOther: .2, thunk: .5, dispatch: .1, rareData: .25, memoryWeak: 0,
  memoryWindow: 256, rareObjectMaxUsers: 8, importFactor: .05,
  utilityFactor: .4, hubThreshold: 16, hubFactor: .1,
});
export interface Arc { source: number; target: number; weight: number }
export interface SparseGraph {
  ids: string[]; arcs: Arc[]; out: Map<number, number>[]; incoming: Map<number, number>[];
  outDegree: number[]; inDegree: number[]; totalWeight: number;
}
export interface Projection {
  graph: SparseGraph; hubIds: string[]; isolatedIds: string[];
  weights: WeightConfig; skippedObjects: string[]; relationCount: number;
  diagnostics: string[];
}
export function compareFunctionId(a: string, b: string): number {
  const ai = a.lastIndexOf(":"), bi = b.lastIndexOf(":");
  const module = compareText(a.slice(0, ai), b.slice(0, bi));
  if (module) return module;
  const av = BigInt(a.slice(ai + 1)), bv = BigInt(b.slice(bi + 1));
  return av < bv ? -1 : av > bv ? 1 : 0;
}
function check(condition: unknown, detail: string): asserts condition {
  if (!condition) throw new Error(`cluster: ${detail}`);
}
function finite(value: number, name: string, positive = false): void {
  check(Number.isFinite(value) && !Object.is(value, -0) && (positive ? value > 0 : value >= 0), name);
}
function integer(value: number, name: string, min = 1): void {
  check(Number.isSafeInteger(value) && value >= min, name);
}
/** Reconcile RAW records, including inactive/hypothesis shards, before selecting
 * a live view. This parallels the pure L2 relation helper without requiring a
 * full GraphSnapshot or claiming transport/provenance validation at this boundary.
 * All relation-wide v1 metadata present in the projection is compared exactly.
 */
export function reconcileClusterRelations(input: ClusterInput): ClusterEdge[] {
  const ids = new Set(input.nodes.map(n => n.id));
  const relations = new Map<string, ClusterEdge>();
  const fields = ["schemaVersion", "direction", "status", "confidence", "appearedInRevision", "retiredInRevision", "schedulerRelevance"] as const;
  for (const edge of input.edges) {
    check(ids.has(edge.sourceId) && ids.has(edge.destinationId), "edge has missing endpoint");
    check(["direct_call", "tail_jump", "indirect_resolved", "thunk", "callback_candidate"].includes(edge.kind), "edge kind");
    const key = canonical([edge.sourceId, edge.destinationId, edge.kind]), previous = relations.get(key);
    if (!previous) { relations.set(key, { ...edge, sites: [...edge.sites] }); continue; }
    for (const field of fields) check(Object.hasOwn(previous, field) === Object.hasOwn(edge, field) && previous[field] === edge[field], `conflicting relation shards: ${field}`);
    previous.sites.push(...edge.sites);
  }
  return [...relations].sort((a, b) => compareText(a[0], b[0])).map(([, edge]) => ({ ...edge,
    sites: [...new Map(edge.sites.map(s => [canonical([s.siteRva, s.xrefType]), s])).values()]
      .sort((a, b) => compareText(a.siteRva, b.siteRva) || compareText(a.xrefType, b.xrefType)),
  }));
}
export function sparseGraph(ids: string[], arcs: Arc[]): SparseGraph {
  check(new Set(ids).size === ids.length, "duplicate graph node");
  const out = ids.map(() => new Map<number, number>()), incoming = ids.map(() => new Map<number, number>());
  // Canonical summation order also covers duplicate arcs with unequal weights;
  // input permutations must not change IEEE-754 rounding in a fixed runtime.
  for (const a of [...arcs].sort((a, b) => a.source - b.source || a.target - b.target || a.weight - b.weight)) {
    integer(a.source, "source", 0); integer(a.target, "target", 0);
    check(a.source < ids.length && a.target < ids.length, "arc outside graph"); finite(a.weight, "weight");
    if (a.weight === 0) continue;
    out[a.source]!.set(a.target, (out[a.source]!.get(a.target) ?? 0) + a.weight);
  }
  const normalized: Arc[] = [];
  for (let source = 0; source < ids.length; source++) {
    const entries = [...out[source]!].sort((a, b) => a[0] - b[0]); out[source] = new Map(entries);
    for (const [target, weight] of entries) {
      check(Number.isFinite(weight), "weight sum overflow");
      incoming[target]!.set(source, weight); normalized.push({ source, target, weight });
    }
  }
  const outDegree = out.map(m => [...m.values()].reduce((a, b) => a + b, 0));
  const inDegree = incoming.map(m => [...m.values()].reduce((a, b) => a + b, 0));
  const totalWeight = outDegree.reduce((a, b) => a + b, 0); check(Number.isFinite(totalWeight) && totalWeight <= Number.MAX_VALUE / 2, "total/volume overflow");
  return { ids: [...ids], arcs: normalized, out, incoming, outDegree, inDegree, totalWeight };
}
export function projectStructural(input: ClusterInput, overrides: Partial<WeightConfig> = {}): Projection {
  const weights = { ...DEFAULT_WEIGHTS, ...overrides };
  check(typeof weights.version === "string" && weights.version.length > 0, "weight version");
  for (const [key, value] of Object.entries(weights)) if (typeof value === "number") finite(value, key);
  integer(weights.rareObjectMaxUsers, "rare users", 2); check(weights.rareObjectMaxUsers <= 64, "rare fanout hard cap 64"); integer(weights.hubThreshold, "hub threshold");
  const nodes = [...input.nodes].sort((a, b) => compareFunctionId(a.id, b.id));
  const ids = nodes.map(n => n.id), index = new Map(ids.map((id, i) => [id, i]));
  check(index.size === nodes.length, "duplicate node identity");
  const relations = reconcileClusterRelations(input).filter(e => e.status !== "invalidated" && e.retiredInRevision === null)
    .map(e => ({ source: index.get(e.sourceId)!, target: index.get(e.destinationId)!, kind: e.kind, confidence: e.confidence }));
  const rawDegree = ids.map(() => new Set<number>());
  for (const r of relations) if (r.kind !== "callback_candidate" && r.source !== r.target) { rawDegree[r.source]!.add(r.target); rawDegree[r.target]!.add(r.source); }
  const hubs = rawDegree.map(d => d.size >= weights.hubThreshold);
  const factor = nodes.map((n, i) => (hubs[i] ? weights.hubFactor : 1) *
    (["import", "external"].includes(n.functionClass) ? weights.importFactor : ["thunk", "wrapper"].includes(n.functionClass) ? weights.utilityFactor : 1));
  const arcs: Arc[] = [];
  const add = (source: number, target: number, weight: number) => { if (weight > 0) arcs.push({ source, target, weight: weight * factor[source]! * factor[target]! }); };
  for (const r of relations) {
    const weight = r.kind === "direct_call" ? weights.direct : r.kind === "tail_jump" ? weights.tail : r.kind === "thunk" ? weights.thunk : r.kind === "callback_candidate" ? weights.dispatch : r.confidence === "high" ? weights.indirectHigh : weights.indirectOther;
    add(r.source, r.target, weight);
  }
  const objects = new Map(input.objects.map(o => [o.id, o]));
  check(objects.size === input.objects.length, "duplicate object");
  const users = new Map<string, Set<number>>();
  for (const r of input.unresolved) if (r.kind === "data_xref" && r.referencedObjectId !== null) {
    check(index.has(r.fromFunctionId) && objects.has(r.referencedObjectId), "data reference missing endpoint");
    let set = users.get(r.referencedObjectId); if (!set) users.set(r.referencedObjectId, set = new Set()); set.add(index.get(r.fromFunctionId)!);
  }
  const skippedObjects: string[] = [];
  for (const [id, set] of [...users].sort((a, b) => compareText(a[0], b[0]))) {
    if (objects.get(id)!.kind === "import" || set.size > weights.rareObjectMaxUsers) { skippedObjects.push(id); continue; }
    const members = [...set].sort((a, b) => a - b);
    for (let a = 0; a < members.length; a++) for (let b = a + 1; b < members.length; b++) {
      const w = weights.rareData / Math.max(1, members.length - 1); add(members[a]!, members[b]!, w); add(members[b]!, members[a]!, w);
    }
  }
  // Adjacent-only memory edges: O(N log N), never all pairs in a window.
  if (weights.memoryWeak > 0) for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1]!, b = nodes[i]!;
    if (a.moduleSha256 === b.moduleSha256 && BigInt(b.rva) - BigInt(a.rva) <= BigInt(Math.floor(weights.memoryWindow))) { add(i - 1, i, weights.memoryWeak); add(i, i - 1, weights.memoryWeak); }
  }
  const graph = sparseGraph(ids, arcs);
  return { graph, hubIds: ids.filter((_, i) => hubs[i]), isolatedIds: ids.filter((_, i) => [...graph.out[i]!.keys(), ...graph.incoming[i]!.keys()].every(j => j === i)), weights,
    skippedObjects, relationCount: relations.length, diagnostics: ["weights heuristic, not calibrated", "DATA/callback/memory are derived affinities, not calls", "raw relation metadata reconciled before live filtering; not native transport validation"] };
}
export function weakComponents(g: SparseGraph, excluded = new Set<number>()): number[][] {
  const seen = new Set<number>(excluded), result: number[][] = [];
  for (let i = 0; i < g.ids.length; i++) if (!seen.has(i)) {
    const group = [i]; seen.add(i);
    for (let q = 0; q < group.length; q++) for (const j of new Set([...g.out[group[q]!]!.keys(), ...g.incoming[group[q]!]!.keys()])) if (!seen.has(j)) { seen.add(j); group.push(j); }
    result.push(group.sort((a, b) => a - b));
  }
  return result;
}
/** Historical comparator: raw active control-flow weak CC, no DATA affinities or
 * attenuation. This preserves the CC rule rather than the accidental giant unit.
 */
export function historicalComponents(input: ClusterInput): string[][] {
  const ids = input.nodes.map(n => n.id).sort(compareFunctionId), idx = new Map(ids.map((id, i) => [id, i]));
  const arcs = reconcileClusterRelations(input).filter(e => e.kind !== "callback_candidate" && e.status !== "invalidated" && e.retiredInRevision === null)
    .map(e => ({ source: idx.get(e.sourceId)!, target: idx.get(e.destinationId)!, weight: 1 }));
  return weakComponents(sparseGraph(ids, arcs)).map(c => c.map(i => ids[i]!));
}
export interface PprConfig { version: "ppr-dense-cell-budget-v1"; maxScoreCells: number; direction: "callee" | "caller" | "both"; damping: number; tolerance: number; maxIterations: number; maxSweepSize: number }
/** Bounds retained dense results AND a conservative 3N working-array allowance.
 * Default 1M numeric cells (8MB raw doubles, not a JS heap/graph byte guarantee).
 * No seeds are dropped. Raising this explicit limit changes configFingerprint.
 */
export const DEFAULT_PPR: Readonly<PprConfig> = Object.freeze({ version: "ppr-dense-cell-budget-v1", maxScoreCells: 1_000_000, direction: "callee", damping: .85, tolerance: 1e-10, maxIterations: 300, maxSweepSize: 128 });
export interface PprBudget { version: "ppr-dense-cell-budget-v1"; nodeCount: number; resultCount: number; retainedScoreCells: number; scratchScoreCells: number; requiredScoreCells: number; maxScoreCells: number }
export function pprScoreBudget(nodeCount: number, resultCount: number, overrides: Partial<PprConfig> = {}): PprBudget {
  const config = { ...DEFAULT_PPR, ...overrides };
  check(config.version === DEFAULT_PPR.version, "PPR budget version"); integer(config.maxScoreCells, "PPR score cell budget");
  integer(nodeCount, "PPR nodes", 0); integer(resultCount, "PPR results");
  const retained = BigInt(nodeCount) * BigInt(resultCount), scratch = 3n * BigInt(nodeCount), required = retained + scratch;
  if (required > BigInt(config.maxScoreCells)) throw new ClusterDiagnosticError({ version: "cluster-refusal-v1", code: "ppr-score-budget-exceeded",
    detail: "dense PPR results plus 3N scratch exceed versioned budget; all seeds refused before score allocation",
    counts: { budgetVersion: config.version, nodeCount, resultCount, retainedScoreCells: retained.toString(), scratchScoreCells: scratch.toString(), requiredScoreCells: required.toString(), maxScoreCells: config.maxScoreCells } });
  return { version: config.version, nodeCount, resultCount, retainedScoreCells: Number(retained), scratchScoreCells: Number(scratch), requiredScoreCells: Number(required), maxScoreCells: config.maxScoreCells };
}
export interface PprResult { scores: number[]; iterations: number; residualL1: number; converged: boolean; danglingPolicy: "personalization"; region: number[]; conductance: number | null }
function directedView(g: SparseGraph, direction: PprConfig["direction"]): SparseGraph {
  check(["caller", "callee", "both"].includes(direction), "PPR direction");
  if (direction === "callee") return g;
  return sparseGraph(g.ids, direction === "caller" ? g.arcs.map(a => ({ source: a.target, target: a.source, weight: a.weight })) : g.arcs.flatMap(a => [{ ...a }, { source: a.target, target: a.source, weight: a.weight }]));
}
export function conductance(g: SparseGraph, members: Iterable<number>): number | null {
  const set = new Set(members); let volume = 0, cut = 0;
  for (const i of set) { check(i >= 0 && i < g.ids.length, "cut member"); volume += g.inDegree[i]! + g.outDegree[i]!;
    for (const [j, w] of g.out[i]!) if (!set.has(j)) cut += w;
    for (const [j, w] of g.incoming[i]!) if (!set.has(j)) cut += w;
  }
  const denominator = Math.min(volume, 2 * g.totalWeight - volume);
  return denominator > 0 ? cut / denominator : null;
}
/** Sweep on the explicit symmetrized affinity view, even for directed PPR.
 * Incremental boundary update costs O(E + N log N), not one E scan per prefix.
 */
export function sweepCut(g: SparseGraph, scores: number[], maxSize: number): { region: number[]; conductance: number | null } {
  integer(maxSize, "sweep max"); check(scores.length === g.ids.length && scores.every(v => Number.isFinite(v) && v >= 0), "sweep scores");
  const rank = g.ids.map((_, i) => i).filter(i => scores[i]! > 0).sort((a, b) => {
    const as = scores[a]! / (g.inDegree[a]! + g.outDegree[a]! || 1), bs = scores[b]! / (g.inDegree[b]! + g.outDegree[b]! || 1); return bs - as || a - b;
  });
  const included = new Set<number>(); let volume = 0, cut = 0, best = Infinity, bestSize = 0;
  for (let k = 0; k < Math.min(maxSize, rank.length); k++) {
    const i = rank[k]!; volume += g.inDegree[i]! + g.outDegree[i]!;
    for (const [j, w] of g.out[i]!) if (j !== i) cut += included.has(j) ? -w : w;
    for (const [j, w] of g.incoming[i]!) if (j !== i) cut += included.has(j) ? -w : w;
    included.add(i); const den = Math.min(volume, 2 * g.totalWeight - volume);
    if (den > 0) { const phi = Math.max(0, cut) / den; if (phi < best - 1e-14) { best = phi; bestSize = k + 1; } }
  }
  return bestSize ? { region: rank.slice(0, bestSize).sort((a, b) => a - b), conductance: best } : { region: rank.slice(0, 1), conductance: null };
}
export function personalizedPageRank(g: SparseGraph, seedIds: string[], overrides: Partial<PprConfig> = {}): PprResult {
  const config = { ...DEFAULT_PPR, ...overrides }; check(config.damping > 0 && config.damping < 1, "damping (0,1)"); finite(config.tolerance, "tolerance", true); integer(config.maxIterations, "iterations"); integer(config.maxSweepSize, "sweep max");
  check(seedIds.length > 0, "PPR seeds required"); const index = new Map(g.ids.map((id, i) => [id, i])), seeds = [...new Set(seedIds)].sort(compareFunctionId);
  pprScoreBudget(g.ids.length, 1, config);
  const teleport = g.ids.map(() => 0); for (const id of seeds) { check(index.has(id), "unknown PPR seed"); teleport[index.get(id)!] = 1 / seeds.length; }
  const view = directedView(g, config.direction); let scores = [...teleport], residualL1 = Infinity, iterations = 0;
  for (; iterations < config.maxIterations;) {
    let dangling = 0; for (let i = 0; i < scores.length; i++) if (view.outDegree[i] === 0) dangling += scores[i]!;
    const next = teleport.map(p => (1 - config.damping + config.damping * dangling) * p);
    for (const a of view.arcs) next[a.target] = next[a.target]! + config.damping * scores[a.source]! * a.weight / view.outDegree[a.source]!;
    residualL1 = scores.reduce((sum, value, i) => sum + Math.abs(value - next[i]!), 0); scores = next; iterations++;
    if (residualL1 <= config.tolerance) break;
  }
  return { scores, iterations, residualL1, converged: residualL1 <= config.tolerance, danglingPolicy: "personalization", ...sweepCut(g, scores, config.maxSweepSize) };
}
/** Directed weighted modularity: sum_C w(C,C)/m - gamma*kout(C)*kin(C)/m².
 * Self loops count once in m/internal, once in each directed degree.
 */
export function directedModularity(g: SparseGraph, labels: number[], resolution = 1): number | null {
  finite(resolution, "resolution", true); check(labels.length === g.ids.length, "label coverage");
  if (!g.totalWeight) return null;
  const totals = new Map<number, { inside: number; out: number; incoming: number }>();
  for (let i = 0; i < labels.length; i++) { integer(labels[i]!, "label", 0); const label = labels[i]!; let t = totals.get(label); if (!t) totals.set(label, t = { inside: 0, out: 0, incoming: 0 }); t.out += g.outDegree[i]!; t.incoming += g.inDegree[i]!; }
  for (const a of g.arcs) if (labels[a.source] === labels[a.target]) totals.get(labels[a.source]!)!.inside += a.weight;
  const result = [...totals.values()].reduce((sum, t) => sum + t.inside / g.totalWeight - resolution * (t.out / g.totalWeight) * (t.incoming / g.totalWeight), 0);
  check(Number.isFinite(result), "modularity overflow"); return result;
}
function rng(seed: string): () => number {
  let state = 2166136261; for (const c of seed) state = Math.imul(state ^ c.charCodeAt(0), 16777619);
  return () => { state += 0x6D2B79F5; let t = Math.imul(state ^ state >>> 15, state | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffled(n: number, random: () => number): number[] {
  const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a;
}
function relabel(labels: number[]): number[] { const map = new Map<number, number>(); return labels.map(l => { if (!map.has(l)) map.set(l, map.size); return map.get(l)!; }); }
function neighborWeights(g: SparseGraph, i: number, labels: number[]): Map<number, number> {
  const weights = new Map<number, number>(); for (const m of [g.out[i]!, g.incoming[i]!]) for (const [j, w] of m) if (i !== j) weights.set(labels[j]!, (weights.get(labels[j]!) ?? 0) + w); return weights;
}
export interface LeidenConfig { seed: string; resolution: number; temperature: number; tolerance: number; maxSweeps: number; maxLevels: number; maxOriginalRounds: number }
export const DEFAULT_LEIDEN: Readonly<LeidenConfig> = Object.freeze({ seed: "ff8-fixture-v1", resolution: 1, temperature: .01, tolerance: 1e-12, maxSweeps: 50, maxLevels: 20, maxOriginalRounds: 10 });
export interface LeidenResult {
  labels: number[]; modularity: number | null; converged: boolean; levels: number;
  moves: number; refinementMerges: number; aggregations: number;
  originalRounds: number; originalMoves: number; originalMaxGain: number;
  originalImprovingMoves: number; originalGainTolerance: number;
  convergenceVersion: "original-local-fixed-point-v1"; seedContractVersion: typeof LEIDEN_SEED_CONTRACT_VERSION;
  boundReached: boolean; connectivityRepaired: boolean;
  objective: "directed-weighted-modularity"; diagnostics: string[];
}
function localMove(g: SparseGraph, initial: number[], config: LeidenConfig, random: () => number): { labels: number[]; moves: number; converged: boolean } {
  const labels = relabel(initial), n = labels.length, sizes = Array(n).fill(0) as number[], ko = Array(n).fill(0) as number[], ki = Array(n).fill(0) as number[];
  for (let i = 0; i < n; i++) { const c = labels[i]!; sizes[c] = sizes[c]! + 1; ko[c] = ko[c]! + g.outDegree[i]!; ki[c] = ki[c]! + g.inDegree[i]!; }
  let moves = 0;
  for (let pass = 0; pass < config.maxSweeps; pass++) {
    let changed = false; const empties = new Set(sizes.map((s, i) => s === 0 ? i : -1).filter(i => i >= 0));
    for (const i of shuffled(n, random)) {
      const old = labels[i]!, out = g.outDegree[i]!, incoming = g.inDegree[i]!;
      sizes[old]!--; ko[old] = ko[old]! - out; ki[old] = ki[old]! - incoming; if (sizes[old] === 0) empties.add(old);
      const links = neighborWeights(g, i, labels), empty = empties.values().next().value as number | undefined;
      const score = (c: number) => (links.get(c) ?? 0) - config.resolution * (out * (ki[c]! / g.totalWeight) + incoming * (ko[c]! / g.totalWeight));
      let best = old, gain = score(old); const candidates = new Set([...links.keys(), old, ...(empty === undefined ? [] : [empty])]);
      for (const c of [...candidates].sort((a, b) => a - b)) { const value = score(c); if (value > gain + config.tolerance) { best = c; gain = value; } }
      labels[i] = best; sizes[best] = sizes[best]! + 1; ko[best] = ko[best]! + out; ki[best] = ki[best]! + incoming; empties.delete(best);
      if (best !== old) { changed = true; moves++; }
    }
    if (!changed) return { labels: relabel(labels), moves, converged: true };
  }
  return { labels: relabel(labels), moves, converged: false };
}
/** Leiden refinement (Traag/Waltman/van Eck 2019, local move → constrained
 * singleton refinement → aggregation initialized by the unrefined parent).
 * Directed null-model extension uses kout*kin. Only singleton nodes are merged,
 * positive-gain adjacent candidates stay inside parent and satisfy connection
 * to that parent. No Louvain/CC relabeling: refinement is an executable phase.
 * Experimental implementation, not certification of all paper guarantees.
 */
function refine(g: SparseGraph, parent: number[], config: LeidenConfig, random: () => number): { labels: number[]; merges: number } {
  const n = parent.length, labels = Array.from({ length: n }, (_, i) => i), size = Array(n).fill(1) as number[];
  const ko = [...g.outDegree], ki = [...g.inDegree], parentOut = Array(n).fill(0) as number[], parentIn = Array(n).fill(0) as number[], boundary = Array(n).fill(0) as number[];
  for (let i = 0; i < n; i++) { parentOut[parent[i]!] += ko[i]!; parentIn[parent[i]!] += ki[i]!; }
  for (const a of g.arcs) if (a.source !== a.target && parent[a.source] === parent[a.target]) { boundary[a.source] += a.weight; boundary[a.target] += a.weight; }
  const connected = (c: number, p: number) => boundary[c]! + config.tolerance >= config.resolution * (ko[c]! * ((parentIn[p]! - ki[c]!) / g.totalWeight) + ki[c]! * ((parentOut[p]! - ko[c]!) / g.totalWeight));
  let merges = 0;
  for (const i of shuffled(n, random)) {
    if (size[i] !== 1 || labels[i] !== i || !connected(i, parent[i]!)) continue;
    const links = neighborWeights(g, i, labels), options: Array<{ c: number; gain: number }> = [];
    for (const [c, weight] of links) if (c !== i && parent[c] === parent[i] && connected(c, parent[i]!)) {
      const gain = weight - config.resolution * (ko[i]! * (ki[c]! / g.totalWeight) + ki[i]! * (ko[c]! / g.totalWeight));
      if (gain > config.tolerance) options.push({ c, gain });
    }
    options.sort((a, b) => a.c - b.c); if (!options.length) continue;
    const max = options.reduce((m, o) => Math.max(m, o.gain), -Infinity); let chosen = options.reduce((a, b) => a.gain >= b.gain ? a : b).c;
    if (config.temperature > 0) { const weights = options.map(o => Math.exp((o.gain - max) / config.temperature)); let point = random() * weights.reduce((a, b) => a + b, 0); for (let j = 0; j < options.length; j++) { point -= weights[j]!; if (point <= 0) { chosen = options[j]!.c; break; } } }
    const cross = links.get(chosen)!; labels[i] = chosen; size[chosen] += size[i]!; size[i] = 0;
    boundary[chosen] += boundary[i]! - 2 * cross; ko[chosen] += ko[i]!; ki[chosen] += ki[i]!; merges++;
  }
  return { labels: relabel(labels), merges };
}
function connectivitySplit(g: SparseGraph, labels: number[]): { labels: number[]; repaired: boolean } {
  const result = labels.map(() => -1); let label = 0;
  for (let i = 0; i < labels.length; i++) if (result[i] === -1) {
    const queue = [i]; result[i] = label;
    for (let q = 0; q < queue.length; q++) for (const j of new Set([...g.out[queue[q]!]!.keys(), ...g.incoming[queue[q]!]!.keys()]))
      if (result[j] === -1 && labels[j] === labels[i]) { result[j] = label; queue.push(j); }
    label++;
  }
  return { labels: result, repaired: label !== new Set(labels).size };
}
/** Attest every ORIGINAL node against every adjacent community and a fresh
 * singleton. Non-adjacent insertion has no positive link term and a nonpositive
 * null-model term, so cannot beat the singleton for nonnegative directed weights.
 * Includes removal from the source community and self-loops in both degrees.
 * O(N+E), no N×community scan. This is local stationarity, not a global optimum.
 * tolerance is in move-score units; the reported ΔQ tolerance is tolerance/m.
 */
function originalMoveAttestation(g: SparseGraph, labels: number[], config: LeidenConfig): { maxGain: number; improvingMoves: number } {
  if (!g.totalWeight) return { maxGain: 0, improvingMoves: 0 };
  const ko = labels.map(() => 0), ki = labels.map(() => 0);
  for (let i = 0; i < labels.length; i++) { ko[labels[i]!] += g.outDegree[i]!; ki[labels[i]!] += g.inDegree[i]!; }
  let maxScoreGain = 0, improvingMoves = 0;
  for (let i = 0; i < labels.length; i++) {
    const old = labels[i]!, out = g.outDegree[i]!, incoming = g.inDegree[i]!, links = neighborWeights(g, i, labels);
    const oldScore = (links.get(old) ?? 0) - config.resolution * (out * ((ki[old]! - incoming) / g.totalWeight) + incoming * ((ko[old]! - out) / g.totalWeight));
    let bestScore = Math.max(oldScore, 0); // singleton (or unchanged singleton)
    for (const [c, weight] of links) if (c !== old) bestScore = Math.max(bestScore, weight - config.resolution * (out * (ki[c]! / g.totalWeight) + incoming * (ko[c]! / g.totalWeight)));
    const gain = bestScore - oldScore;
    check(Number.isFinite(gain), "original move attestation overflow");
    if (gain > config.tolerance) improvingMoves++;
    maxScoreGain = Math.max(maxScoreGain, gain);
  }
  return { maxGain: maxScoreGain / g.totalWeight, improvingMoves };
}
export function leiden(g: SparseGraph, overrides: Partial<LeidenConfig> = {}): LeidenResult {
  const config = { ...DEFAULT_LEIDEN, ...overrides };
  check(typeof config.seed === "string" && config.seed.length > 0 && config.seed.length <= 64 && config.seed.trim().length > 0 && config.seed !== "0" && config.seed !== "none", `explicit Leiden seed (${LEIDEN_SEED_CONTRACT_VERSION}; string 1..64, nonzero, nonblank)`);
  finite(config.resolution, "resolution", true); finite(config.temperature, "temperature"); finite(config.tolerance, "tolerance", true); integer(config.maxLevels, "levels"); integer(config.maxSweeps, "sweeps"); integer(config.maxOriginalRounds, "original rounds");
  const random = rng(config.seed); let final = g.ids.map((_, i) => i);
  let moves = 0, originalMoves = 0, refinementMerges = 0, aggregations = 0, levels = 0, originalRounds = 0;
  let boundReached = false, connectivityRepaired = false, converged = !g.totalWeight;
  let attestation = { maxGain: 0, improvingMoves: 0 };
  // Restart the REAL hierarchy on the ORIGINAL graph with the previous partition.
  // Quotient stability alone is never a convergence certificate (RV3-01).
  if (g.totalWeight) for (let round = 0; round < config.maxOriginalRounds; round++) {
    originalRounds++;
    let current = g, members = g.ids.map((_, i) => [i]), initial = [...final], quotientStopped = false;
    for (let level = 0; level < config.maxLevels; level++) {
      levels++; const moved = localMove(current, initial, config, random); moves += moved.moves;
      if (level === 0) originalMoves += moved.moves;
      for (let i = 0; i < members.length; i++) for (const original of members[i]!) final[original] = moved.labels[i]!;
      const refined = refine(current, moved.labels, config, random); refinementMerges += refined.merges;
      const count = new Set(refined.labels).size;
      if (!moved.converged) { boundReached = true; break; }
      if (count === current.ids.length) { quotientStopped = true; break; }
      const nextMembers = Array.from({ length: count }, () => [] as number[]), nextInitial = Array(count).fill(-1) as number[];
      for (let i = 0; i < members.length; i++) { const c = refined.labels[i]!; for (const original of members[i]!) nextMembers[c]!.push(original); check(nextInitial[c] === -1 || nextInitial[c] === moved.labels[i], "refinement crosses parent"); nextInitial[c] = moved.labels[i]!; }
      current = sparseGraph(nextMembers.map(m => g.ids[m.reduce((a, b) => Math.min(a, b), Infinity)]!), current.arcs.map(a => ({ source: refined.labels[a.source]!, target: refined.labels[a.target]!, weight: a.weight })));
      members = nextMembers; initial = relabel(nextInitial); aggregations++;
    }
    if (!quotientStopped) boundReached = true;
    const split = connectivitySplit(g, relabel(final)); final = split.labels;
    connectivityRepaired ||= split.repaired;
    attestation = originalMoveAttestation(g, final, config);
    // A repaired or bounded proposal remains explicitly nonconverged even when
    // its final certificate happens to have no improving move.
    if (boundReached || connectivityRepaired) break;
    if (attestation.improvingMoves === 0) { converged = true; break; }
    if (round + 1 === config.maxOriginalRounds) boundReached = true;
  }
  return { labels: final, modularity: directedModularity(g, final, config.resolution), converged, levels, moves, refinementMerges, aggregations,
    originalRounds, originalMoves, originalMaxGain: attestation.maxGain, originalImprovingMoves: attestation.improvingMoves,
    originalGainTolerance: g.totalWeight ? config.tolerance / g.totalWeight : 0,
    convergenceVersion: "original-local-fixed-point-v1", seedContractVersion: LEIDEN_SEED_CONTRACT_VERSION, boundReached, connectivityRepaired,
    objective: "directed-weighted-modularity", diagnostics: ["experimental directed Leiden; fixed-environment reproducibility only", "original-node adjacent/singleton gain attestation; local stationarity within tolerance, not global optimality",
      ...(connectivityRepaired ? ["disconnected community split: repaired proposal is nonconverged"] : []), ...(boundReached ? ["iteration bound reached: no convergence claim"] : []),
      ...(!converged && attestation.improvingMoves > 0 ? ["positive original-node gain remains: no convergence claim"] : [])] };
}
export interface ClusterConfig { algorithm: "historical-cc" | "hub-baseline" | "ppr" | "leiden"; weights?: Partial<WeightConfig>; maxCommunitySize?: number; seedIds?: string[]; seedCapabilityIds?: string[]; ppr?: Partial<PprConfig>; leiden?: Partial<LeidenConfig> }
export interface ClusterMetrics { version: "cluster-metrics-v1"; partitionId: string; snapshotFingerprint: string; configFingerprint: string; projection: "directed-affinity/symmetric-conductance"; modularity: number | null; conductanceByContentId: Record<string, number | null>; diagnostics: string[]; ppr: PprResult[]; pprBudget: PprBudget | null; leiden: LeidenResult | null; hubIds: string[]; isolatedIds: string[]; skippedObjectIds: string[]; nodeCount: number; arcCount: number; totalWeight: number }
export interface ClusterResult { partition: ClusterPartition; metrics: ClusterMetrics; projection: Projection }
export function clusterGraph(input: ClusterInput, config: ClusterConfig = { algorithm: "hub-baseline" }): ClusterResult {
  check(["historical-cc", "hub-baseline", "ppr", "leiden"].includes(config.algorithm), "algorithm");
  if (input.nodes.length === 0) throw new ClusterDiagnosticError({ version: "cluster-refusal-v1", code: "empty-snapshot-no-partition", detail: "L2 empty snapshot is valid, but v1 partition requires at least one nonempty community" });
  const max = config.maxCommunitySize ?? 128; integer(max, "community max");
  const projection = projectStructural(input, config.weights), g = projection.graph, index = new Map(g.ids.map((id, i) => [id, i]));
  let groups: number[][]; const ppr: PprResult[] = []; let pprBudget: PprBudget | null = null, lr: LeidenResult | null = null;
  if (config.algorithm === "historical-cc") groups = historicalComponents(input).map(c => c.map(id => index.get(id)!));
  else if (config.algorithm === "hub-baseline") { const excluded = new Set(projection.hubIds.map(id => index.get(id)!)); groups = [...weakComponents(g, excluded), ...[...excluded].map(i => [i])]; }
  else if (config.algorithm === "leiden") { lr = leiden(g, config.leiden); const map = new Map<number, number[]>(); lr.labels.forEach((c, i) => { if (!map.has(c)) map.set(c, []); map.get(c)!.push(i); }); groups = [...map.values()]; }
  else {
    const selectedCapabilities = new Set(config.seedCapabilityIds ?? []), matchedCapabilities = new Set<string>(), seeds = new Set(config.seedIds ?? []);
    for (const c of input.capabilities) if (selectedCapabilities.has(c.id)) {
      check(c.subjectKind === "function", "PPR capability seed must identify a function");
      matchedCapabilities.add(c.id); seeds.add(c.subjectId);
    }
    check(matchedCapabilities.size === selectedCapabilities.size, "unknown PPR capability seed; seeds are not silently dropped");
    check(seeds.size > 0, "PPR entry/capability seeds must be explicit");
    for (const id of seeds) check(index.has(id), "unknown PPR seed");
    pprBudget = pprScoreBudget(g.ids.length, seeds.size, config.ppr);
    const owned = new Set<number>(); groups = [];
    for (const id of [...seeds].sort(compareFunctionId)) { const result = personalizedPageRank(g, [id], config.ppr); ppr.push(result); const group = result.region.filter(i => !owned.has(i)); if (group.length) { groups.push(group); group.forEach(i => owned.add(i)); } }
    groups.push(...weakComponents(g, owned));
  }
  // Scientific Leiden partition is not silently split by investigation bounds.
  // Only baseline cuts at this stage; group builder handles all algorithm sizes.
  if (config.algorithm === "hub-baseline") groups = groups.flatMap(c => { const chunks: number[][] = []; for (let i = 0; i < c.length; i += max) chunks.push(c.slice(i, i + max)); return chunks; });
  groups = groups.map(c => c.sort((a, b) => a - b)).sort((a, b) => a[0]! - b[0]!);
  check(groups.flat().length === g.ids.length && new Set(groups.flat()).size === g.ids.length, "partition coverage/owner uniqueness");
  const effectiveConfig = { algorithm: config.algorithm, weights: projection.weights, maxCommunitySize: max, seedIds: [...new Set(config.seedIds ?? [])].sort(compareFunctionId), seedCapabilityIds: [...new Set(config.seedCapabilityIds ?? [])].sort(compareText), ppr: { ...DEFAULT_PPR, ...config.ppr }, leiden: { ...DEFAULT_LEIDEN, ...config.leiden }, seedContractVersion: LEIDEN_SEED_CONTRACT_VERSION };
  const configFingerprint = fingerprint(effectiveConfig), algorithmVersion = CLUSTER_VERSION, algorithm = config.algorithm;
  const partitionId = fingerprint({ snapshot: input.normalizedFingerprint, configFingerprint, algorithmVersion });
  const conductanceByContentId: Record<string, number | null> = {};
  const communities: Community[] = groups.map(c => {
    const memberIds = c.map(i => g.ids[i]!), own = new Set(c), context = new Set<number>();
    for (const i of c) for (const j of new Set([...g.out[i]!.keys(), ...g.incoming[i]!.keys()])) if (!own.has(j)) context.add(j);
    const contentId = fingerprint({ algorithm, algorithmVersion, configFingerprint, memberIds }); conductanceByContentId[contentId] = conductance(g, c);
    return { contentId, lineageId: `root:${contentId}`, parentContentIds: [], memberIds, kernelIds: [...memberIds], externalContextIds: [...context].sort((a, b) => a - b).map(i => g.ids[i]!), conductance: { known: false, value: null } };
  });
  const labels = g.ids.map(() => 0); groups.forEach((c, label) => c.forEach(i => { labels[i] = label; }));
  return { partition: { schemaVersion: 1, partitionId, lineageId: `root:${partitionId}`, parentLineageId: null, snapshotId: input.snapshotId, snapshotFingerprint: input.normalizedFingerprint, regime: "A", algorithm, algorithmVersion, configFingerprint, seed: algorithm === "leiden" ? effectiveConfig.leiden.seed : algorithm === "ppr" ? fingerprint({ seeds: effectiveConfig.seedIds, capabilities: effectiveConfig.seedCapabilityIds }) : "none", communities, modularity: { known: false, value: null }, maturity: "structural", adopted: false },
    metrics: { version: "cluster-metrics-v1", partitionId, snapshotFingerprint: input.normalizedFingerprint, configFingerprint, projection: "directed-affinity/symmetric-conductance", modularity: directedModularity(g, labels, config.leiden?.resolution ?? 1), conductanceByContentId, diagnostics: [...projection.diagnostics, ...(lr?.diagnostics ?? []), ...(ppr.length ? ["PPR dense scores retained within versioned cell budget (including 3N scratch); not a heap byte bound"] : []), ...(ppr.some(p => !p.converged) ? ["PPR iteration bound reached"] : [])], ppr, pprBudget, leiden: lr, hubIds: projection.hubIds, isolatedIds: projection.isolatedIds, skippedObjectIds: projection.skippedObjects, nodeCount: g.ids.length, arcCount: g.arcs.length, totalWeight: g.totalWeight }, projection };
}
/** Deliberately explicit experiments: callers provide named variants; no claimed
 * calibrated optimum. Comparing same snapshot/config except named weight knobs.
 */
export function weightSensitivity(input: ClusterInput, config: ClusterConfig, variants: Array<{ name: string; weights: Partial<WeightConfig> }>): Array<{ name: string; configFingerprint: string; memberGroups: string[][]; modularity: number | null; changedPairCount: number }> {
  const baseline = clusterGraph(input, config), labels = new Map<string, string>(); baseline.partition.communities.forEach(c => c.memberIds.forEach(id => labels.set(id, c.contentId)));
  check(new Set(variants.map(v => v.name)).size === variants.length, "duplicate sensitivity name");
  return variants.map(v => { const result = clusterGraph(input, { ...config, weights: { ...config.weights, ...v.weights } });
    // Pair agreement via contingency table: O(N), no materialized N² pair list.
    const oldCounts = new Map<string, number>(), newCounts = new Map<string, number>(), intersections = new Map<string, number>();
    for (const c of result.partition.communities) for (const id of c.memberIds) { const old = labels.get(id)!; oldCounts.set(old, (oldCounts.get(old) ?? 0) + 1); newCounts.set(c.contentId, (newCounts.get(c.contentId) ?? 0) + 1); const key = canonical([old, c.contentId]); intersections.set(key, (intersections.get(key) ?? 0) + 1); }
    const pairs = (m: Map<string, number>) => [...m.values()].reduce((s, n) => s + n * (n - 1) / 2, 0);
    return { name: v.name, configFingerprint: result.partition.configFingerprint, memberGroups: result.partition.communities.map(c => c.memberIds), modularity: result.metrics.modularity, changedPairCount: pairs(oldCounts) + pairs(newCounts) - 2 * pairs(intersections) };
  });
}
