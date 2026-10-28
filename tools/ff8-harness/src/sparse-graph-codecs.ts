// Exact numeric and structural leaves extracted from cluster.ts; no producer value imports.
// Internal shared exports are limited to actual remaining cluster consumers:
// check, finite, integer, numericFailure, Sum, sum, summands, numericSummary.
import { canonical, fingerprint, compareText } from "./validation";
import type { ClusterInput, ClusterEdge } from "./cluster";

/** IEEE binary64 inputs, fixed-runtime reproducibility. Leiden tolerance AND
 * temperature retain their RAW weight units (ΔQ tolerance = tolerance / m).
 * PPR tolerance is an absolute L1 equation-residual bound. Neither is enlarged.
 * Scaling is internal, not output probability renormalization. Unrepresentable
 * intermediates fail closed; this is not a universal/global-optimality claim. */
export const NUMERIC_POLICY_VERSION = "scaled-binary64-exact-leiden-interval-ppr-v1";

/** Fail-closed refusals have no partition/metrics artifact. L8 must record this
 * diagnostic, not turn absence into an empty v1 partition or fabricated scores. */
export class ClusterDiagnosticError extends Error {
  constructor(readonly diagnostic: { version: "cluster-refusal-v1"; code: "empty-snapshot-no-partition" | "ppr-score-budget-exceeded" | "numeric-source-budget-exceeded" | "unsupported-numeric"; detail: string; counts?: Record<string, string | number> }) {
    super(`cluster: ${diagnostic.code}: ${diagnostic.detail}; no partition produced`);
    this.name = "ClusterDiagnosticError";
  }
}

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
export function summands(g: SparseGraph): Arc[] { return g.numericSource?.arcs ?? g.arcs; }
export function numericSummary(g: SparseGraph): NumericGraphSummary {
  return { version: NUMERIC_POLICY_VERSION, weightConvention: g.numericSource ? "source-summands-v1" : "canonical-arcs-v1", canonicalArcCount: g.arcs.length,
    sourceArcCount: summands(g).length, retainedSourceArcCount: g.numericSource?.arcs.length ?? 0,
    sourceArcBudget: g.numericSource?.maxArcs ?? DEFAULT_NUMERIC_SOURCE_ARCS, budgetVersion: NUMERIC_SOURCE_BUDGET_VERSION };
}

export function compareFunctionId(a: string, b: string): number {
  const ai = a.lastIndexOf(":"), bi = b.lastIndexOf(":");
  const module = compareText(a.slice(0, ai), b.slice(0, bi));
  if (module) return module;
  const av = BigInt(a.slice(ai + 1)), bv = BigInt(b.slice(bi + 1));
  return av < bv ? -1 : av > bv ? 1 : 0;
}
export function check(condition: unknown, detail: string): asserts condition {
  if (!condition) throw new Error(`cluster: ${detail}`);
}
export function finite(value: number, name: string, positive = false): void {
  check(Number.isFinite(value) && !Object.is(value, -0) && (positive ? value > 0 : value >= 0), name);
}
export function integer(value: number, name: string, min = 1): void {
  check(Number.isSafeInteger(value) && value >= min, name);
}
export function numericFailure(detail: string): never {
  throw new ClusterDiagnosticError({ version: "cluster-refusal-v1", code: "unsupported-numeric", detail: `${NUMERIC_POLICY_VERSION}: ${detail}` });
}
/** Neumaier accumulator, including signed boundary/volume updates. */
export class Sum {
  private value = 0; private correction = 0;
  add(x: number): void {
    const next = this.value + x;
    if (!Number.isFinite(next)) numericFailure("sum overflow");
    this.correction += Math.abs(this.value) >= Math.abs(x) ? (this.value - next) + x : (x - next) + this.value;
    this.value = next;
  }
  get total(): number { const x = this.value + this.correction; if (!Number.isFinite(x)) numericFailure("compensated sum overflow"); return x; }
}
export function sum(values: Iterable<number>): number { const s = new Sum(); for (const x of values) s.add(x); return s.total; }

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
