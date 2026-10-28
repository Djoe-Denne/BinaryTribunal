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
export const CLUSTER_VERSION = "ff8-structural-1.2.0";
/** IEEE binary64 inputs, fixed-runtime reproducibility. Leiden tolerance AND
 * temperature retain their RAW weight units (ΔQ tolerance = tolerance / m).
 * PPR tolerance is an absolute L1 equation-residual bound. Neither is enlarged.
 * Scaling is internal, not output probability renormalization. Unrepresentable
 * intermediates fail closed; this is not a universal/global-optimality claim. */
export const NUMERIC_POLICY_VERSION = "scaled-binary64-exact-leiden-interval-ppr-v1";
export const LEIDEN_SEED_CONTRACT_VERSION = "partition-v1-explicit-seed-v1";
/** Fail-closed refusals have no partition/metrics artifact. L8 must record this
 * diagnostic, not turn absence into an empty v1 partition or fabricated scores. */
export class ClusterDiagnosticError extends Error {
  constructor(readonly diagnostic: { version: "cluster-refusal-v1"; code: "empty-snapshot-no-partition" | "ppr-score-budget-exceeded" | "numeric-source-budget-exceeded" | "unsupported-numeric"; detail: string; counts?: Record<string, string | number> }) {
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
export type WeightConvention = "source-summands-v1" | "canonical-arcs-v1";
export const NUMERIC_SOURCE_BUDGET_VERSION = "numeric-source-arc-budget-v1";
/** Extra positive raw summands retained only when Eraw > Ecanonical. A count of
 * arc records, not JS heap bytes. Caller may explicitly raise this per graph;
 * budgets are bound into the snapshot. No edge/seed pruning on budget failure. */
export const DEFAULT_NUMERIC_SOURCE_ARCS = 1_000_000;
export interface NumericSource {
  version: typeof NUMERIC_POLICY_VERSION; arcs: Arc[]; rawArcCount: number;
  budgetVersion: typeof NUMERIC_SOURCE_BUDGET_VERSION; maxArcs: number; bindingFingerprint: string;
}
export interface NumericGraphSummary {
  version: typeof NUMERIC_POLICY_VERSION; weightConvention: WeightConvention;
  canonicalArcCount: number; sourceArcCount: number; retainedSourceArcCount: number;
  sourceArcBudget: number; budgetVersion: typeof NUMERIC_SOURCE_BUDGET_VERSION;
}
export interface SparseGraph {
  ids: string[]; arcs: Arc[]; out: Map<number, number>[]; incoming: Map<number, number>[];
  outDegree: number[]; inDegree: number[]; totalWeight: number;
  numericPolicy?: { version: typeof NUMERIC_POLICY_VERSION; weightConvention: WeightConvention; bindingFingerprint: string };
  numericSource?: NumericSource;
}
// A canonical binary64 sum can round away a duplicate's contribution. Preserve
// the original summands privately for certificates/transitions; otherwise an
// "exact" certificate would only certify the already-rounded aggregate. This
// metadata owns copies, is serializable and content-bound, not native evidence.
// Legacy graphs with NEITHER metadata field explicitly mean canonical arc values;
// no claim to recover pre-canonical original summands is made for that convention.
function summands(g: SparseGraph): Arc[] { return g.numericSource?.arcs ?? g.arcs; }
function numericSummary(g: SparseGraph): NumericGraphSummary {
  return { version: NUMERIC_POLICY_VERSION, weightConvention: g.numericSource ? "source-summands-v1" : "canonical-arcs-v1", canonicalArcCount: g.arcs.length,
    sourceArcCount: summands(g).length, retainedSourceArcCount: g.numericSource?.arcs.length ?? 0,
    sourceArcBudget: g.numericSource?.maxArcs ?? DEFAULT_NUMERIC_SOURCE_ARCS, budgetVersion: NUMERIC_SOURCE_BUDGET_VERSION };
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
function numericFailure(detail: string): never {
  throw new ClusterDiagnosticError({ version: "cluster-refusal-v1", code: "unsupported-numeric", detail: `${NUMERIC_POLICY_VERSION}: ${detail}` });
}
/** Neumaier accumulator, including signed boundary/volume updates. */
class Sum {
  private value = 0; private correction = 0;
  add(x: number): void {
    const next = this.value + x;
    if (!Number.isFinite(next)) numericFailure("sum overflow");
    this.correction += Math.abs(this.value) >= Math.abs(x) ? (this.value - next) + x : (x - next) + this.value;
    this.value = next;
  }
  get total(): number { const x = this.value + this.correction; if (!Number.isFinite(x)) numericFailure("compensated sum overflow"); return x; }
}
function sum(values: Iterable<number>): number { const s = new Sum(); for (const x of values) s.add(x); return s.total; }
const floatBits = new DataView(new ArrayBuffer(8));
function dyadic(x: number): { n: bigint; e: number } {
  floatBits.setFloat64(0, x); const bits = floatBits.getBigUint64(0), exponent = Number((bits >> 52n) & 2047n);
  return { n: (bits & ((1n << 52n) - 1n)) | (exponent ? 1n << 52n : 0n), e: exponent ? exponent - 1075 : -1074 };
}
/** Correctly round a nonnegative rational without Number(bigint) overflow or
 * double rounding at the normal/subnormal boundary. Only reports are rounded;
 * stationarity comparisons below remain exact integer comparisons. */
function ratio(n: bigint, d: bigint): number {
  if (n === 0n) return 0;
  let e = n.toString(2).length - d.toString(2).length;
  if (e >= 0 ? n < (d << BigInt(e)) : (n << BigInt(-e)) < d) e--;
  const shift = Math.max(-1074, e - 52);
  const a = shift < 0 ? n << BigInt(-shift) : n, b = shift > 0 ? d << BigInt(shift) : d;
  let q = a / b; const r = a % b;
  if (2n * r > b || (2n * r === b && (q & 1n) !== 0n)) q++;
  return Number(q) * 2 ** shift;
}
/** Multiply attenuation factors before rounding once. In particular, (tiny *
 * tiny * huge) must not disappear just because the first product underflows. */
function weightProduct(...values: number[]): number {
  if (values.some(x => x === 0)) return 0;
  let n = 1n, e = 0;
  for (const x of values) { const v = dyadic(x); n *= v.n; e += v.e; }
  const result = e >= 0 ? ratio(n << BigInt(e), 1n) : ratio(n, 1n << BigInt(-e));
  if (!(result > 0) || !Number.isFinite(result)) numericFailure("positive affinity product underflow/overflow");
  return result;
}
/** Positive rescaling only; a vanished positive arc is never silently dropped.
 * Local row normalization (PPR) is separate from this objective/cut view. */
function scaledGraph(g: SparseGraph): { graph: SparseGraph; scale: number } {
  const scale = g.arcs.reduce((m, a) => Math.max(m, a.weight), 0);
  if (!scale) return { graph: g, scale: 1 };
  const arcs = summands(g).map(a => {
    const weight = a.weight / scale;
    if (!weight) numericFailure("weight dynamic range loses a positive arc during scaling");
    return { ...a, weight };
  });
  return { graph: sparseGraph(g.ids, arcs, { maxNumericSourceArcs: g.numericSource?.maxArcs }), scale };
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
export function sparseGraph(ids: string[], arcs: Arc[], options: { maxNumericSourceArcs?: number } = {}): SparseGraph {
  return buildSparseGraph(ids, arcs, options.maxNumericSourceArcs ?? DEFAULT_NUMERIC_SOURCE_ARCS, true);
}
function buildSparseGraph(ids: string[], arcs: Arc[], maxArcs: number, retain: boolean): SparseGraph {
  integer(maxArcs, "numeric source arc budget");
  check(Array.isArray(ids) && ids.every(id => typeof id === "string") && Array.isArray(arcs), "graph arrays/IDs");
  check(new Set(ids).size === ids.length, "duplicate graph node");
  const out = ids.map(() => new Map<number, number>()), incoming = ids.map(() => new Map<number, number>());
  // Canonical summation order also covers duplicate arcs with unequal weights;
  // input permutations must not change IEEE-754 rounding in a fixed runtime.
  let previous: Arc | undefined, combined = new Sum();
  const ordered = [...arcs].sort((a, b) => a.source - b.source || a.target - b.target || a.weight - b.weight);
  let nonzero = 0;
  for (const a of ordered) {
    integer(a.source, "source", 0); integer(a.target, "target", 0);
    check(a.source < ids.length && a.target < ids.length, "arc outside graph"); finite(a.weight, "weight");
    if (a.weight === 0) continue;
    nonzero++;
    if (!previous || previous.source !== a.source || previous.target !== a.target) {
      if (previous) out[previous.source]!.set(previous.target, combined.total);
      combined = new Sum(); previous = a;
    }
    combined.add(a.weight);
  }
  if (previous) out[previous.source]!.set(previous.target, combined.total);
  const normalized: Arc[] = [];
  for (let source = 0; source < ids.length; source++) {
    const entries = [...out[source]!].sort((a, b) => a[0] - b[0]); out[source] = new Map(entries);
    for (const [target, weight] of entries) {
      incoming[target]!.set(source, weight); normalized.push({ source, target, weight });
    }
  }
  const outDegree = out.map(m => sum(m.values()));
  const inDegree = incoming.map(m => sum(m.values()));
  const totalWeight = sum(normalized.map(a => a.weight));
  const graph: SparseGraph = { ids: [...ids], arcs: normalized, out, incoming, outDegree, inDegree, totalWeight };
  if (retain) {
    if (nonzero > normalized.length) {
      if (nonzero > maxArcs) throw new ClusterDiagnosticError({ version: "cluster-refusal-v1", code: "numeric-source-budget-exceeded", detail: "positive original summands exceed explicit retained-arc budget; no summands dropped",
        counts: { budgetVersion: NUMERIC_SOURCE_BUDGET_VERSION, rawArcCount: nonzero, canonicalArcCount: normalized.length, maxArcs } });
      graph.numericSource = { version: NUMERIC_POLICY_VERSION, budgetVersion: NUMERIC_SOURCE_BUDGET_VERSION, maxArcs, rawArcCount: nonzero,
        arcs: ordered.filter(a => a.weight > 0).map(a => ({ source: a.source, target: a.target, weight: a.weight })), bindingFingerprint: "" };
    }
    const weightConvention = graph.numericSource ? "source-summands-v1" : "canonical-arcs-v1";
    graph.numericPolicy = { version: NUMERIC_POLICY_VERSION, weightConvention, bindingFingerprint: numericBinding(graph) };
    if (graph.numericSource) graph.numericSource.bindingFingerprint = graph.numericPolicy.bindingFingerprint;
  }
  return graph;
}
function graphProjection(g: SparseGraph) {
  return { ids: g.ids, arcs: g.arcs, out: g.out.map(m => [...m]), incoming: g.incoming.map(m => [...m]), outDegree: g.outDegree, inDegree: g.inDegree, totalWeight: g.totalWeight };
}
function numericBinding(g: SparseGraph): string {
  const source = g.numericSource;
  return fingerprint({ version: NUMERIC_POLICY_VERSION, weightConvention: source ? "source-summands-v1" : "canonical-arcs-v1", projection: graphProjection(g),
    source: source ? { version: source.version, arcs: source.arcs, rawArcCount: source.rawArcCount, budgetVersion: source.budgetVersion, maxArcs: source.maxArcs } : null });
}
/** At every PUBLIC consumer boundary, compare source, canonical arc view AND all
 * caches. No cached validation/WeakMap: caller mutation cannot stale a receipt.
 * Hashes detect inconsistency, not authenticity; these are local affinity data.
 * Internal synchronous phases use already-validated graphs to avoid C×E checks.
 */
export function validateSparseGraph(g: SparseGraph): void {
  try {
    check(Array.isArray(g.ids) && Array.isArray(g.arcs) && Array.isArray(g.out) && Array.isArray(g.incoming) && Array.isArray(g.outDegree) && Array.isArray(g.inDegree), "graph shape");
    check(g.out.every(m => m instanceof Map) && g.incoming.every(m => m instanceof Map), "graph cache maps");
    check([g.out, g.incoming, g.outDegree, g.inDegree].every(a => a.length === g.ids.length), "graph cache coverage");
    for (const x of [...g.outDegree, ...g.inDegree, g.totalWeight]) finite(x, "cached degree/total");
    for (const maps of [g.out, g.incoming]) for (const m of maps) for (const [endpoint, weight] of m) { integer(endpoint, "cache endpoint", 0); check(endpoint < g.ids.length, "cache endpoint"); finite(weight, "cached weight", true); }
    const policy = g.numericPolicy, source = g.numericSource;
    check(policy === undefined || (policy !== null && typeof policy === "object" && !Array.isArray(policy)), "numeric policy object");
    check(source === undefined || (source !== null && typeof source === "object" && !Array.isArray(source)), "numeric source object");
    if (policy) {
      check(policy.version === NUMERIC_POLICY_VERSION && policy.weightConvention === (source ? "source-summands-v1" : "canonical-arcs-v1"), "numeric policy/source missing or version mismatch");
      check(Object.keys(policy).sort().join() === "bindingFingerprint,version,weightConvention", "numeric policy fields");
    } else check(source === undefined, "numeric source requires policy binding");
    if (source) {
      check(source.version === NUMERIC_POLICY_VERSION && source.budgetVersion === NUMERIC_SOURCE_BUDGET_VERSION, "numeric source version");
      check(Object.keys(source).sort().join() === "arcs,bindingFingerprint,budgetVersion,maxArcs,rawArcCount,version", "numeric source fields");
      integer(source.maxArcs, "source budget"); integer(source.rawArcCount, "source count");
      check(Array.isArray(source.arcs) && source.rawArcCount === source.arcs.length && source.rawArcCount <= source.maxArcs && source.rawArcCount > g.arcs.length, "numeric source counts/budget");
      for (const a of source.arcs) { finite(a.weight, "source weight", true); check(Object.keys(a).sort().join() === "source,target,weight", "source arc fields"); }
      const ordered = [...source.arcs].sort((a, b) => a.source - b.source || a.target - b.target || a.weight - b.weight);
      check(canonical(ordered) === canonical(source.arcs), "numeric source canonical ordering");
    }
    const expected = buildSparseGraph(g.ids, summands(g), source?.maxArcs ?? DEFAULT_NUMERIC_SOURCE_ARCS, false);
    check(canonical(graphProjection(g)) === canonical(graphProjection(expected)), "numeric source/projection/cache mismatch");
    if (policy) { const binding = numericBinding(g); check(policy.bindingFingerprint === binding && (!source || source.bindingFingerprint === binding), "numeric source binding mismatch"); }
  } catch (error) {
    if (error instanceof ClusterDiagnosticError) throw error;
    numericFailure(`invalid/stale numeric graph: ${error instanceof Error ? error.message : String(error)}`);
  }
}
export interface SparseGraphSnapshot {
  version: "sparse-graph-numeric-v1"; ids: string[]; arcs: Arc[];
  numericPolicy: NonNullable<SparseGraph["numericPolicy"]>; numericSource?: NumericSource;
}
/** JSON numbers round-trip binary64; Map caches are reconstructed and checked
 * against the binding, never silently revived from untrusted JSON objects. */
export function exportSparseGraph(g: SparseGraph): SparseGraphSnapshot {
  validateSparseGraph(g);
  const graph = g.numericPolicy ? g : sparseGraph(g.ids, g.arcs);
  return JSON.parse(JSON.stringify({ version: "sparse-graph-numeric-v1", ids: graph.ids, arcs: graph.arcs, numericPolicy: graph.numericPolicy, ...(graph.numericSource ? { numericSource: graph.numericSource } : {}) })) as SparseGraphSnapshot;
}
export function importSparseGraph(value: unknown): SparseGraph {
  try {
    check(value !== null && typeof value === "object" && !Array.isArray(value), "numeric graph snapshot");
    const snapshot = value as SparseGraphSnapshot;
    check(snapshot.version === "sparse-graph-numeric-v1" && snapshot.numericPolicy !== undefined, "numeric graph snapshot version/policy");
    check(Object.keys(snapshot).sort().join() === (snapshot.numericSource ? "arcs,ids,numericPolicy,numericSource,version" : "arcs,ids,numericPolicy,version"), "numeric graph snapshot fields");
    const graph = buildSparseGraph(snapshot.ids, snapshot.arcs, DEFAULT_NUMERIC_SOURCE_ARCS, false);
    check(canonical(snapshot.arcs) === canonical(graph.arcs), "snapshot projection is not canonical");
    graph.numericPolicy = structuredClone(snapshot.numericPolicy);
    if (snapshot.numericSource) graph.numericSource = structuredClone(snapshot.numericSource);
    validateSparseGraph(graph); return graph;
  } catch (error) {
    if (error instanceof ClusterDiagnosticError) throw error;
    numericFailure(`invalid numeric graph snapshot: ${error instanceof Error ? error.message : String(error)}`);
  }
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
  const factor = nodes.map((n, i) => [hubs[i] ? weights.hubFactor : 1,
    ["import", "external"].includes(n.functionClass) ? weights.importFactor : ["thunk", "wrapper"].includes(n.functionClass) ? weights.utilityFactor : 1]);
  const arcs: Arc[] = [];
  const add = (source: number, target: number, weight: number) => { if (weight > 0) arcs.push({ source, target, weight: weightProduct(weight, ...factor[source]!, ...factor[target]!) }); };
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
      const w = weightProduct(weights.rareData, 1 / Math.max(1, members.length - 1)); add(members[a]!, members[b]!, w); add(members[b]!, members[a]!, w);
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
  validateSparseGraph(g); return weakComponentsUnchecked(g, excluded);
}
function weakComponentsUnchecked(g: SparseGraph, excluded = new Set<number>()): number[][] {
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
  return weakComponentsUnchecked(sparseGraph(ids, arcs)).map(c => c.map(i => ids[i]!));
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
export interface PprResult {
  scores: number[]; iterations: number; residualL1: number; converged: boolean; danglingPolicy: "personalization"; region: number[]; conductance: number | null;
  numericPolicyVersion: typeof NUMERIC_POLICY_VERSION; residualUpperBound: number; iterateDeltaL1: number; scoreMass: number;
  numericGraph: NumericGraphSummary; numericArcStorage: { inputRetainedSummands: number; viewRetainedSummands: number; transitionEntries: number; rowEntries: number };
  numericStatus: "certified" | "roundoff-limited" | "iteration-bound"; diagnostics: string[];
}
type Interval = { lo: number; hi: number };
function point(x: number): Interval { return { lo: x, hi: x }; }
/** Outward bounds for NONNEGATIVE operations. No epsilon-as-tolerance policy:
 * if the true equation residual cannot be bounded by the requested tolerance,
 * convergence is not certified, even when the iterates are bitwise identical. */
function up(x: number): number {
  if (!Number.isFinite(x)) numericFailure("interval overflow");
  floatBits.setFloat64(0, x); floatBits.setBigUint64(0, floatBits.getBigUint64(0) + 1n); return floatBits.getFloat64(0);
}
function down(x: number): number {
  if (x === 0) return 0;
  floatBits.setFloat64(0, x); floatBits.setBigUint64(0, floatBits.getBigUint64(0) - 1n); return floatBits.getFloat64(0);
}
function plus(a: Interval, b: Interval): Interval {
  if (a.hi === 0) return b; if (b.hi === 0) return a;
  return { lo: down(a.lo + b.lo), hi: up(a.hi + b.hi) };
}
function times(a: Interval, b: Interval): Interval {
  if (a.hi === 0 || b.hi === 0) return point(0);
  if (a.lo === 1 && a.hi === 1) return b; if (b.lo === 1 && b.hi === 1) return a;
  return { lo: down(a.lo * b.lo), hi: up(a.hi * b.hi) };
}
function divided(a: Interval, b: Interval): Interval {
  if (!(b.lo > 0)) numericFailure("normalizer interval includes zero");
  if (a.lo === a.hi && b.lo === b.hi && a.lo === b.lo) return point(1);
  return { lo: down(a.lo / b.hi), hi: up(a.hi / b.lo) };
}
function directedView(g: SparseGraph, direction: PprConfig["direction"]): SparseGraph {
  check(["caller", "callee", "both"].includes(direction), "PPR direction");
  if (direction === "callee") return g;
  return sparseGraph(g.ids, direction === "caller" ? summands(g).map(a => ({ source: a.target, target: a.source, weight: a.weight })) : summands(g).flatMap(a => [{ ...a }, { source: a.target, target: a.source, weight: a.weight }]), { maxNumericSourceArcs: g.numericSource?.maxArcs });
}
export function conductance(g: SparseGraph, members: Iterable<number>): number | null {
  validateSparseGraph(g); return conductanceUnchecked(g, members);
}
function conductanceUnchecked(g: SparseGraph, members: Iterable<number>): number | null {
  const set = new Set(members), volume = new Sum(), cut = new Sum();
  const normalized = (w: number) => {
    const result = w / (g.totalWeight || 1); if (w && !result) numericFailure("conductance positive volume underflow"); return result;
  };
  for (const i of set) { integer(i, "cut member", 0); check(i < g.ids.length, "cut member"); volume.add(normalized(g.inDegree[i]!)); volume.add(normalized(g.outDegree[i]!));
    for (const [j, w] of g.out[i]!) if (!set.has(j)) cut.add(normalized(w));
    for (const [j, w] of g.incoming[i]!) if (!set.has(j)) cut.add(normalized(w));
  }
  // Never subtract nearly equal total/selected volumes: the complement may be
  // many orders of magnitude smaller. Only the larger side needs this scan.
  const outside = new Sum();
  if (volume.total > 1) for (let i = 0; i < g.ids.length; i++) if (!set.has(i)) { outside.add(normalized(g.inDegree[i]!)); outside.add(normalized(g.outDegree[i]!)); }
  const denominator = volume.total > 1 ? Math.min(volume.total, outside.total) : volume.total;
  return denominator > 0 ? cut.total / denominator : null;
}
/** Sweep on the explicit symmetrized affinity view, even for directed PPR.
 * Incremental boundary update costs O(E + N log N), not one E scan per prefix.
 */
export function sweepCut(g: SparseGraph, scores: number[], maxSize: number): { region: number[]; conductance: number | null } {
  validateSparseGraph(g); return sweepCutUnchecked(g, scores, maxSize);
}
function sweepCutUnchecked(g: SparseGraph, scores: number[], maxSize: number): { region: number[]; conductance: number | null } {
  integer(maxSize, "sweep max"); check(scores.length === g.ids.length && scores.every(v => Number.isFinite(v) && v >= 0), "sweep scores");
  g = scaledGraph(g).graph;
  const rank = g.ids.map((_, i) => i).filter(i => scores[i]! > 0).sort((a, b) => {
    const av = g.inDegree[a]! + g.outDegree[a]! || 1, bv = g.inDegree[b]! + g.outDegree[b]! || 1;
    const as = scores[a]! / av, bs = scores[b]! / bv;
    return (Number.isFinite(as) && Number.isFinite(bs) ? bs - as : (Math.log(scores[b]!) - Math.log(bv)) - (Math.log(scores[a]!) - Math.log(av))) || a - b;
  });
  const included = new Set<number>(), volume = new Sum(), outside = new Sum(), cut = new Sum(); let best = Infinity, bestSize = 0;
  for (let i = 0; i < g.ids.length; i++) { outside.add(g.inDegree[i]!); outside.add(g.outDegree[i]!); }
  for (let k = 0; k < Math.min(maxSize, rank.length); k++) {
    const i = rank[k]!; volume.add(g.inDegree[i]!); volume.add(g.outDegree[i]!); outside.add(-g.inDegree[i]!); outside.add(-g.outDegree[i]!);
    for (const [j, w] of g.out[i]!) if (j !== i) cut.add(included.has(j) ? -w : w);
    for (const [j, w] of g.incoming[i]!) if (j !== i) cut.add(included.has(j) ? -w : w);
    included.add(i); const den = Math.min(volume.total, outside.total);
    if (den > 0) { const phi = Math.max(0, cut.total) / den; if (phi < best - 1e-14) { best = phi; bestSize = k + 1; } }
  }
  const region = rank.slice(0, bestSize || 1).sort((a, b) => a - b);
  return { region, conductance: bestSize ? conductanceUnchecked(g, region) : null };
}
export function personalizedPageRank(g: SparseGraph, seedIds: string[], overrides: Partial<PprConfig> = {}): PprResult {
  validateSparseGraph(g); return personalizedPageRankUnchecked(g, seedIds, overrides);
}
function personalizedPageRankUnchecked(g: SparseGraph, seedIds: string[], overrides: Partial<PprConfig> = {}): PprResult {
  const config = { ...DEFAULT_PPR, ...overrides }; check(config.damping > 0 && config.damping < 1, "damping (0,1)"); finite(config.tolerance, "tolerance", true); integer(config.maxIterations, "iterations"); integer(config.maxSweepSize, "sweep max");
  check(seedIds.length > 0, "PPR seeds required"); const index = new Map(g.ids.map((id, i) => [id, i])), seeds = [...new Set(seedIds)].sort(compareFunctionId);
  pprScoreBudget(g.ids.length, 1, config);
  const teleport = g.ids.map(() => 0); for (const id of seeds) { check(index.has(id), "unknown PPR seed"); teleport[index.get(id)!] = 1 / seeds.length; }
  const view = directedView(g, config.direction);
  // O(E) transition metadata, not additional retained score vectors. The 3N
  // scratch budget still covers teleport, old/next scores and the final residual
  // evaluation; attestation is scalar per target and never materializes N×N.
  const incoming = g.ids.map(() => [] as Array<{ source: number; probability: number; bounds: Interval }>);
  const rows = g.ids.map(() => [] as Array<[number, number]>);
  for (const a of summands(view)) rows[a.source]!.push([a.target, a.weight]);
  for (let source = 0; source < view.out.length; source++) {
    const row = rows[source]!; if (!row.length) continue;
    const scale = row.reduce((m, [, w]) => Math.max(m, w), 0);
    const scaled = row.map(([target, w]) => {
      const value = w / scale; if (!value) numericFailure("PPR transition dynamic range loses a positive arc");
      return { target, value, bounds: divided(point(w), point(scale)) };
    });
    const normalizer = sum(scaled.map(a => a.value)), bound = scaled.reduce((s, a) => plus(s, a.bounds), point(0));
    for (const a of scaled) {
      const probability = a.value / normalizer;
      if (!probability) numericFailure("positive PPR transition underflow");
      incoming[a.target]!.push({ source, probability, bounds: divided(a.bounds, bound) });
    }
  }
  const d = config.damping, personalization = divided(point(1), point(seeds.length));
  const step = (scores: number[]): number[] => {
    const dangling = sum(scores.filter((_, i) => view.out[i]!.size === 0)), base = 1 - d + d * dangling;
    return scores.map((_, target) => {
      const s = new Sum(); s.add(base * teleport[target]!);
      for (const a of incoming[target]!) s.add(d * (scores[a.source]! * a.probability));
      return s.total;
    });
  };
  const attest = (scores: number[]): { residualL1: number; residualUpperBound: number } => {
    let dangling = point(0);
    scores.forEach((value, i) => { if (!view.out[i]!.size) dangling = plus(dangling, point(value)); });
    const base = plus({ lo: down(1 - d), hi: up(1 - d) }, times(point(d), dangling));
    const residual = new Sum(); let upper = 0;
    const next = step(scores);
    for (let target = 0; target < scores.length; target++) {
      let bound = teleport[target] ? times(base, personalization) : point(0);
      for (const a of incoming[target]!) bound = plus(bound, times(point(d), times(point(scores[a.source]!), a.bounds)));
      residual.add(Math.abs(next[target]! - scores[target]!));
      const distance = Math.max(Math.abs(bound.lo - scores[target]!), Math.abs(bound.hi - scores[target]!));
      if (distance) upper = up(upper + up(distance));
    }
    return { residualL1: residual.total, residualUpperBound: upper };
  };
  let scores = [...teleport], iterateDeltaL1 = Infinity, iterations = 0;
  let certificate = { residualL1: Infinity, residualUpperBound: Infinity };
  for (; iterations < config.maxIterations;) {
    const next = step(scores);
    iterateDeltaL1 = sum(scores.map((value, i) => Math.abs(value - next[i]!))); scores = next; iterations++;
    if (iterateDeltaL1 <= config.tolerance || iterations === config.maxIterations) {
      certificate = attest(scores);
      if (certificate.residualUpperBound <= config.tolerance || iterateDeltaL1 === 0) break;
    }
  }
  const converged = certificate.residualUpperBound <= config.tolerance;
  // Last-ulp oscillations need not become bitwise stationary. When the interval
  // uncertainty alone exceeds tolerance and also covers the last step, report
  // the numerical limitation rather than suggesting more iterations certify it.
  const roundoffLimited = iterateDeltaL1 === 0 || (certificate.residualUpperBound - certificate.residualL1 > config.tolerance && iterateDeltaL1 <= certificate.residualUpperBound);
  const numericStatus = converged ? "certified" : roundoffLimited ? "roundoff-limited" : "iteration-bound";
  return { scores, iterations, ...certificate, iterateDeltaL1, converged, scoreMass: sum(scores), numericPolicyVersion: NUMERIC_POLICY_VERSION, numericStatus,
    numericGraph: numericSummary(g), numericArcStorage: { inputRetainedSummands: g.numericSource?.arcs.length ?? 0, viewRetainedSummands: view === g ? 0 : view.numericSource?.arcs.length ?? 0, transitionEntries: summands(view).length, rowEntries: summands(view).length },
    diagnostics: ["PPR equation residual bounded by outward binary64 intervals; scores are not post-renormalized", ...(!converged ? [`PPR ${numericStatus}: requested L1 tolerance not certified`] : [])],
    danglingPolicy: "personalization", ...sweepCutUnchecked(g, scores, config.maxSweepSize) };
}
/** Directed weighted modularity: sum_C w(C,C)/m - gamma*kout(C)*kin(C)/m².
 * Self loops count once in m/internal, once in each directed degree.
 */
export function directedModularity(g: SparseGraph, labels: number[], resolution = 1): number | null {
  validateSparseGraph(g); return directedModularityUnchecked(g, labels, resolution);
}
function directedModularityUnchecked(g: SparseGraph, labels: number[], resolution = 1): number | null {
  finite(resolution, "resolution", true); check(labels.length === g.ids.length, "label coverage");
  if (!g.totalWeight) return null;
  const exact = exactGraph(g), r = exactResolution(resolution);
  const totals = new Map<number, { inside: bigint; out: bigint; incoming: bigint }>();
  for (let i = 0; i < labels.length; i++) { integer(labels[i]!, "label", 0); const label = labels[i]!; let t = totals.get(label); if (!t) totals.set(label, t = { inside: 0n, out: 0n, incoming: 0n }); t.out += exact.out[i]!; t.incoming += exact.incoming[i]!; }
  for (const a of exact.arcs) if (labels[a.source] === labels[a.target]) totals.get(labels[a.source]!)!.inside += a.weight;
  let numerator = 0n; for (const t of totals.values()) numerator += t.inside * exact.total * r.d - r.n * t.out * t.incoming;
  const result = (numerator < 0n ? -1 : 1) * ratio(numerator < 0n ? -numerator : numerator, exact.total * exact.total * r.d);
  if (!Number.isFinite(result)) numericFailure("modularity is not representable"); return result;
}
function exactResolution(value: number): { n: bigint; d: bigint } {
  const v = dyadic(value); return v.e >= 0 ? { n: v.n << BigInt(v.e), d: 1n } : { n: v.n, d: 1n << BigInt(-v.e) };
}
/** Exact binary64 arc values as integer multiples of a common power of two.
 * Used only by final metrics/certificates, not the heuristic move loop. */
function exactGraph(g: SparseGraph, tolerance = 0) {
  let exponent = tolerance ? dyadic(tolerance).e : 1024;
  const values = summands(g).map(a => { const value = dyadic(a.weight); exponent = Math.min(exponent, value.e); return { ...a, value }; });
  const out = g.ids.map(() => 0n), incoming = g.ids.map(() => 0n); let total = 0n;
  const arcs = values.map(a => { const weight = a.value.n << BigInt(a.value.e - exponent); out[a.source] += weight; incoming[a.target] += weight; total += weight; return { source: a.source, target: a.target, weight }; });
  const t = dyadic(tolerance);
  return { arcs, out, incoming, total, tolerance: tolerance ? t.n << BigInt(t.e - exponent) : 0n };
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
  convergenceVersion: "original-local-fixed-point-v2"; seedContractVersion: typeof LEIDEN_SEED_CONTRACT_VERSION;
  numericPolicyVersion: typeof NUMERIC_POLICY_VERSION; toleranceUnits: "raw-weight"; gainComparison: "exact-binary64-dyadic";
  numericGraph: NumericGraphSummary;
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
      const score = (c: number) => {
        const result = (links.get(c) ?? 0) - config.resolution * (out * (ki[c]! / g.totalWeight) + incoming * (ko[c]! / g.totalWeight));
        if (!Number.isFinite(result)) numericFailure("Leiden move score overflow"); return result;
      };
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
  const connected = (c: number, p: number) => {
    const threshold = config.resolution * (ko[c]! * ((parentIn[p]! - ki[c]!) / g.totalWeight) + ki[c]! * ((parentOut[p]! - ko[c]!) / g.totalWeight));
    if (!Number.isFinite(threshold)) numericFailure("Leiden refinement threshold overflow");
    return boundary[c]! + config.tolerance >= threshold;
  };
  let merges = 0;
  for (const i of shuffled(n, random)) {
    if (size[i] !== 1 || labels[i] !== i || !connected(i, parent[i]!)) continue;
    const links = neighborWeights(g, i, labels), options: Array<{ c: number; gain: number }> = [];
    for (const [c, weight] of links) if (c !== i && parent[c] === parent[i] && connected(c, parent[i]!)) {
      const gain = weight - config.resolution * (ko[i]! * (ki[c]! / g.totalWeight) + ki[i]! * (ko[c]! / g.totalWeight));
      if (!Number.isFinite(gain)) numericFailure("Leiden refinement gain overflow");
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
 * tolerance is in RAW move-score units; ΔQ tolerance is tolerance/m. Integer
 * dyadics compare both sides exactly, including subnormals and cancellation.
 * No approximate zero or error floor can turn a positive move into a PASS.
 */
function originalMoveAttestation(g: SparseGraph, labels: number[], config: LeidenConfig): { maxGain: number; improvingMoves: number; tolerance: number } {
  if (!g.totalWeight) return { maxGain: 0, improvingMoves: 0, tolerance: 0 };
  const exact = exactGraph(g, config.tolerance), r = exactResolution(config.resolution), m = exact.total;
  const ko = labels.map(() => 0n), ki = labels.map(() => 0n), links = labels.map(() => new Map<number, bigint>());
  for (let i = 0; i < labels.length; i++) { ko[labels[i]!] += exact.out[i]!; ki[labels[i]!] += exact.incoming[i]!; }
  for (const a of exact.arcs) if (a.source !== a.target) {
    const from = links[a.source]!, to = links[a.target]!;
    from.set(labels[a.target]!, (from.get(labels[a.target]!) ?? 0n) + a.weight);
    to.set(labels[a.source]!, (to.get(labels[a.source]!) ?? 0n) + a.weight);
  }
  const threshold = exact.tolerance * m * r.d;
  let maxScoreGain = 0n, improvingMoves = 0;
  for (let i = 0; i < labels.length; i++) {
    const old = labels[i]!, out = exact.out[i]!, incoming = exact.incoming[i]!, neighbors = links[i]!;
    const oldScore = (neighbors.get(old) ?? 0n) * m * r.d - r.n * (out * (ki[old]! - incoming) + incoming * (ko[old]! - out));
    let bestScore = oldScore > 0n ? oldScore : 0n;
    for (const [c, weight] of neighbors) if (c !== old) {
      const value = weight * m * r.d - r.n * (out * ki[c]! + incoming * ko[c]!);
      if (value > bestScore) bestScore = value;
    }
    const gain = bestScore - oldScore;
    if (gain > threshold) improvingMoves++;
    if (gain > maxScoreGain) maxScoreGain = gain;
  }
  const maxGain = ratio(maxScoreGain, m * m * r.d), tolerance = ratio(exact.tolerance, m);
  if (!Number.isFinite(maxGain) || !Number.isFinite(tolerance) || !tolerance) numericFailure("Leiden ΔQ report/tolerance is not representable");
  return { maxGain, improvingMoves, tolerance };
}
export function leiden(g: SparseGraph, overrides: Partial<LeidenConfig> = {}): LeidenResult {
  validateSparseGraph(g);
  const config = { ...DEFAULT_LEIDEN, ...overrides };
  check(typeof config.seed === "string" && config.seed.length > 0 && config.seed.length <= 64 && config.seed.trim().length > 0 && config.seed !== "0" && config.seed !== "none", `explicit Leiden seed (${LEIDEN_SEED_CONTRACT_VERSION}; string 1..64, nonzero, nonblank)`);
  finite(config.resolution, "resolution", true); finite(config.temperature, "temperature"); finite(config.tolerance, "tolerance", true); integer(config.maxLevels, "levels"); integer(config.maxSweeps, "sweeps"); integer(config.maxOriginalRounds, "original rounds");
  const scaled = scaledGraph(g), solver = { ...config, tolerance: config.tolerance / scaled.scale, temperature: config.temperature / scaled.scale };
  if (!Number.isFinite(solver.tolerance) || !solver.tolerance || !Number.isFinite(solver.temperature) || (config.temperature > 0 && !solver.temperature)) numericFailure("raw Leiden tolerance/temperature cannot be represented in scaled units");
  const random = rng(config.seed); let final = g.ids.map((_, i) => i);
  let moves = 0, originalMoves = 0, refinementMerges = 0, aggregations = 0, levels = 0, originalRounds = 0;
  let boundReached = false, connectivityRepaired = false, converged = !g.totalWeight;
  let attestation = { maxGain: 0, improvingMoves: 0, tolerance: 0 };
  // Restart the REAL hierarchy on the ORIGINAL graph with the previous partition.
  // Quotient stability alone is never a convergence certificate (RV3-01).
  if (g.totalWeight) for (let round = 0; round < config.maxOriginalRounds; round++) {
    originalRounds++;
    let current = scaled.graph, members = g.ids.map((_, i) => [i]), initial = [...final], quotientStopped = false;
    for (let level = 0; level < config.maxLevels; level++) {
      levels++; const moved = localMove(current, initial, solver, random); moves += moved.moves;
      if (level === 0) originalMoves += moved.moves;
      for (let i = 0; i < members.length; i++) for (const original of members[i]!) final[original] = moved.labels[i]!;
      const refined = refine(current, moved.labels, solver, random); refinementMerges += refined.merges;
      const count = new Set(refined.labels).size;
      if (!moved.converged) { boundReached = true; break; }
      if (count === current.ids.length) { quotientStopped = true; break; }
      const nextMembers = Array.from({ length: count }, () => [] as number[]), nextInitial = Array(count).fill(-1) as number[];
      for (let i = 0; i < members.length; i++) { const c = refined.labels[i]!; for (const original of members[i]!) nextMembers[c]!.push(original); check(nextInitial[c] === -1 || nextInitial[c] === moved.labels[i], "refinement crosses parent"); nextInitial[c] = moved.labels[i]!; }
      current = sparseGraph(nextMembers.map(m => g.ids[m.reduce((a, b) => Math.min(a, b), Infinity)]!), summands(current).map(a => ({ source: refined.labels[a.source]!, target: refined.labels[a.target]!, weight: a.weight })), { maxNumericSourceArcs: g.numericSource?.maxArcs });
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
  return { labels: final, modularity: directedModularityUnchecked(g, final, config.resolution), converged, levels, moves, refinementMerges, aggregations,
    originalRounds, originalMoves, originalMaxGain: attestation.maxGain, originalImprovingMoves: attestation.improvingMoves,
    originalGainTolerance: attestation.tolerance,
    convergenceVersion: "original-local-fixed-point-v2", seedContractVersion: LEIDEN_SEED_CONTRACT_VERSION, boundReached, connectivityRepaired,
    numericPolicyVersion: NUMERIC_POLICY_VERSION, toleranceUnits: "raw-weight", gainComparison: "exact-binary64-dyadic",
    numericGraph: numericSummary(g),
    objective: "directed-weighted-modularity", diagnostics: ["experimental directed Leiden; fixed-environment reproducibility only", "original-node adjacent/singleton gain attestation; local stationarity within tolerance, not global optimality", "exact dyadic original gain comparison; tolerance/temperature retain raw weight units, reported gain tolerance is ΔQ=tolerance/m",
      ...(connectivityRepaired ? ["disconnected community split: repaired proposal is nonconverged"] : []), ...(boundReached ? ["iteration bound reached: no convergence claim"] : []),
      ...(!converged && attestation.improvingMoves > 0 ? ["positive original-node gain remains: no convergence claim"] : [])] };
}
export interface ClusterConfig { algorithm: "historical-cc" | "hub-baseline" | "ppr" | "leiden"; weights?: Partial<WeightConfig>; maxCommunitySize?: number; seedIds?: string[]; seedCapabilityIds?: string[]; ppr?: Partial<PprConfig>; leiden?: Partial<LeidenConfig> }
export interface ClusterMetrics { version: "cluster-metrics-v1"; numericPolicyVersion: typeof NUMERIC_POLICY_VERSION; numericGraph: NumericGraphSummary; partitionId: string; snapshotFingerprint: string; configFingerprint: string; projection: "directed-affinity/symmetric-conductance"; modularity: number | null; conductanceByContentId: Record<string, number | null>; diagnostics: string[]; ppr: PprResult[]; pprBudget: PprBudget | null; leiden: LeidenResult | null; hubIds: string[]; isolatedIds: string[]; skippedObjectIds: string[]; nodeCount: number; arcCount: number; totalWeight: number }
export interface ClusterResult { partition: ClusterPartition; metrics: ClusterMetrics; projection: Projection }
export function clusterGraph(input: ClusterInput, config: ClusterConfig = { algorithm: "hub-baseline" }): ClusterResult {
  check(["historical-cc", "hub-baseline", "ppr", "leiden"].includes(config.algorithm), "algorithm");
  if (input.nodes.length === 0) throw new ClusterDiagnosticError({ version: "cluster-refusal-v1", code: "empty-snapshot-no-partition", detail: "L2 empty snapshot is valid, but v1 partition requires at least one nonempty community" });
  const max = config.maxCommunitySize ?? 128; integer(max, "community max");
  const projection = projectStructural(input, config.weights), g = projection.graph, index = new Map(g.ids.map((id, i) => [id, i]));
  let groups: number[][]; const ppr: PprResult[] = []; let pprBudget: PprBudget | null = null, lr: LeidenResult | null = null;
  if (config.algorithm === "historical-cc") groups = historicalComponents(input).map(c => c.map(id => index.get(id)!));
  else if (config.algorithm === "hub-baseline") { const excluded = new Set(projection.hubIds.map(id => index.get(id)!)); groups = [...weakComponentsUnchecked(g, excluded), ...[...excluded].map(i => [i])]; }
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
    for (const id of [...seeds].sort(compareFunctionId)) { const result = personalizedPageRankUnchecked(g, [id], config.ppr); ppr.push(result); const group = result.region.filter(i => !owned.has(i)); if (group.length) { groups.push(group); group.forEach(i => owned.add(i)); } }
    groups.push(...weakComponentsUnchecked(g, owned));
  }
  // Scientific Leiden partition is not silently split by investigation bounds.
  // Only baseline cuts at this stage; group builder handles all algorithm sizes.
  if (config.algorithm === "hub-baseline") groups = groups.flatMap(c => { const chunks: number[][] = []; for (let i = 0; i < c.length; i += max) chunks.push(c.slice(i, i + max)); return chunks; });
  groups = groups.map(c => c.sort((a, b) => a - b)).sort((a, b) => a[0]! - b[0]!);
  check(groups.flat().length === g.ids.length && new Set(groups.flat()).size === g.ids.length, "partition coverage/owner uniqueness");
  const effectiveConfig = { algorithm: config.algorithm, numericPolicyVersion: NUMERIC_POLICY_VERSION, weights: projection.weights, maxCommunitySize: max, seedIds: [...new Set(config.seedIds ?? [])].sort(compareFunctionId), seedCapabilityIds: [...new Set(config.seedCapabilityIds ?? [])].sort(compareText), ppr: { ...DEFAULT_PPR, ...config.ppr }, leiden: { ...DEFAULT_LEIDEN, ...config.leiden }, seedContractVersion: LEIDEN_SEED_CONTRACT_VERSION };
  const configFingerprint = fingerprint(effectiveConfig), algorithmVersion = CLUSTER_VERSION, algorithm = config.algorithm;
  const partitionId = fingerprint({ snapshot: input.normalizedFingerprint, configFingerprint, algorithmVersion });
  const conductanceByContentId: Record<string, number | null> = {};
  const communities: Community[] = groups.map(c => {
    const memberIds = c.map(i => g.ids[i]!), own = new Set(c), context = new Set<number>();
    for (const i of c) for (const j of new Set([...g.out[i]!.keys(), ...g.incoming[i]!.keys()])) if (!own.has(j)) context.add(j);
    const contentId = fingerprint({ algorithm, algorithmVersion, configFingerprint, memberIds }); conductanceByContentId[contentId] = conductanceUnchecked(g, c);
    return { contentId, lineageId: `root:${contentId}`, parentContentIds: [], memberIds, kernelIds: [...memberIds], externalContextIds: [...context].sort((a, b) => a - b).map(i => g.ids[i]!), conductance: { known: false, value: null } };
  });
  const labels = g.ids.map(() => 0); groups.forEach((c, label) => c.forEach(i => { labels[i] = label; }));
  return { partition: { schemaVersion: 1, partitionId, lineageId: `root:${partitionId}`, parentLineageId: null, snapshotId: input.snapshotId, snapshotFingerprint: input.normalizedFingerprint, regime: "A", algorithm, algorithmVersion, configFingerprint, seed: algorithm === "leiden" ? effectiveConfig.leiden.seed : algorithm === "ppr" ? fingerprint({ seeds: effectiveConfig.seedIds, capabilities: effectiveConfig.seedCapabilityIds }) : "none", communities, modularity: { known: false, value: null }, maturity: "structural", adopted: false },
    metrics: { version: "cluster-metrics-v1", numericPolicyVersion: NUMERIC_POLICY_VERSION, numericGraph: numericSummary(g), partitionId, snapshotFingerprint: input.normalizedFingerprint, configFingerprint, projection: "directed-affinity/symmetric-conductance", modularity: directedModularityUnchecked(g, labels, config.leiden?.resolution ?? 1), conductanceByContentId, diagnostics: [...projection.diagnostics, ...(lr?.diagnostics ?? []), ...(ppr.length ? ["PPR dense scores retained within versioned cell budget (including 3N scratch); O(raw E) numericArcStorage separately counted; neither is a heap byte bound"] : []), ...ppr.flatMap(p => p.diagnostics)], ppr, pprBudget, leiden: lr, hubIds: projection.hubIds, isolatedIds: projection.isolatedIds, skippedObjectIds: projection.skippedObjects, nodeCount: g.ids.length, arcCount: g.arcs.length, totalWeight: g.totalWeight }, projection };
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
