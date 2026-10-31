import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { captureAnalysisRequestV1, captureAnalysisFactsV1, captureAnalysisOutcomeV1, type StaticAcquisitionRequestV1, type StaticAnalysisFactsV1 } from "../../src/ports/analysis";
import { projectAnalysisFactsToGraphV1 } from "../../src/analysis-graph-projection";

// Entirely synthetic. No fixture-driver, filesystem, host, database or native adapter imports.
const sha = "a".repeat(64);
const unknown = () => ({ known: false as const, value: null });
function request(): StaticAcquisitionRequestV1 {
  return { version: "rms-static-acquisition-request-v1", requestId: "synthetic-read", expected: { moduleSha256: sha, imageBase: "0x400000", analysisSpace: { backend: "synthetic", identity: "space-1", revision: null } }, scope: { functionRvas: ["0x1000", "0x2000"], byteRanges: [{ rva: "0x1000", endRvaExclusive: "0x1004" }], includeRelations: true }, limits: { maxFunctions: 2, maxChunks: 2, maxBytes: 4, maxRelations: 4, maxSources: 2 } };
}
function facts(): StaticAnalysisFactsV1 {
  return { version: "rms-static-analysis-facts-v1", requestId: "synthetic-read", observedIdentity: structuredClone(request().expected), sources: [{ id: "s", role: "observation", origin: "fixture", locator: "synthetic:raw-response", sourceVersion: "1", sourceSha256: sha, evidenceSha256: "b".repeat(64) }], functions: ["0x1000", "0x2000"].map((rva, index) => ({ rva, ea: index === 0 ? "0x401000" : "0x402000", name: "not scientific evidence", chunks: [{ rva, endRvaExclusive: index === 0 ? "0x1004" : "0x2004", role: "entry" }], chunkCoverage: { status: "partial", reasons: ["tails not enumerated"] }, sizeBytes: unknown(), instructionCount: { known: true, value: 0 }, basicBlockCount: unknown(), sourceIds: ["s"] })), bytes: [{ rva: "0x1000", endRvaExclusive: "0x1004", ea: "0x401000", content: { kind: "hex", hex: "909090c3" }, sourceIds: ["s"] }], relations: [{ id: "call", fromFunctionRva: "0x1000", siteRva: "0x1001", siteEa: "0x401001", kind: "direct_call", xrefType: "code", target: { kind: "function", rva: "0x2000" }, sourceIds: ["s"] }], coverage: { status: "partial", reasons: ["bounded synthetic observation"] }, limitations: ["fixture; not native acquisition"] };
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
const codec = { canonical, sha256: (v: string) => createHash("sha256").update(v).digest("hex") };
test("hash+RVA identity, explicit graph revision, unknown != zero, no oracle promotion", () => {
  const p = projectAnalysisFactsToGraphV1(request(), facts(), codec, { graphRevision: 17 });
  expect(p.nodes[0]!.id).toBe(`${sha}:0x1000`);
  expect(p.nodes[0]!.sizeBytes).toEqual({ known: false, value: null });
  expect(p.nodes[0]!.instructionCount).toEqual({ known: true, value: 0 });
  expect(p.nodes[0]!.status).toBe("incomplete");
  expect(p.nodes[0]!.semanticMaturity).toBe("none");
  expect(p.nodes[0]!.admissibleAsOracle).toBe(false);
  expect(p.nodes[0]!.byteAgreement).toBe("unknown");
  expect(p.edges[0]!.appearedInRevision).toBe(17);
  expect(Object.keys(p)).not.toContain("binaryArtifacts");
  expect(Object.keys(p)).not.toContain("snapshot");
  for (const graphRevision of [NaN, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) expect(() => projectAnalysisFactsToGraphV1(request(), facts(), codec, { graphRevision })).toThrow("graphRevision");
  expect(() => projectAnalysisFactsToGraphV1(request(), facts(), codec, undefined as any)).toThrow("graphRevision");
});
test("identity divergence and EA/base/RVA discrepancies reject, never retarget", () => {
  for (const change of [(f: StaticAnalysisFactsV1) => { f.observedIdentity.moduleSha256 = "b".repeat(64); }, (f: StaticAnalysisFactsV1) => { f.observedIdentity.analysisSpace.identity = "other"; }, (f: StaticAnalysisFactsV1) => { f.observedIdentity.imageBase = "0x500000"; }, (f: StaticAnalysisFactsV1) => { f.functions[0]!.ea = "0x401001"; }]) {
    const f = facts(); change(f); expect(() => captureAnalysisFactsV1(request(), f)).toThrow();
  }
});
test("DATA never projects as call; unknown direct target never becomes indirect", () => {
  const f = facts(), r = f.relations[0]!;
  r.kind = "data_xref"; r.xrefType = "data";
  let p = projectAnalysisFactsToGraphV1(request(), f, codec, { graphRevision: 1 });
  expect(p.edges).toEqual([]); expect(p.unresolved).toEqual([]); expect(p.unprojected[0]!.reason).toContain("DATA");
  r.kind = "direct_call";
  expect(() => captureAnalysisFactsV1(request(), f)).toThrow("DATA");
  r.xrefType = "code"; r.target = { kind: "unknown", reason: "target unresolved" };
  p = projectAnalysisFactsToGraphV1(request(), f, codec, { graphRevision: 1 });
  expect(p.nodes).toHaveLength(2); expect(p.edges).toEqual([]); expect(p.unresolved).toEqual([]); expect(p.unprojected).toHaveLength(1);
  r.kind = "indirect_call";
  p = projectAnalysisFactsToGraphV1(request(), f, codec, { graphRevision: 1 });
  expect(p.unresolved[0]!.kind).toBe("indirect_call"); expect(p.unresolved[0]!.fabricatedFunction).toBe(false);
});
test("unobserved targets, partial chunks and missing metrics stay unknown", () => {
  const f = facts(); f.functions.pop();
  const p = projectAnalysisFactsToGraphV1(request(), f, codec, { graphRevision: 3 });
  expect(p.nodes).toHaveLength(1); expect(p.edges).toHaveLength(0); expect(p.unprojected).toHaveLength(2);
  f.coverage = { status: "complete", reasons: [] };
  expect(() => captureAnalysisFactsV1(request(), f)).toThrow("remains unknown");
  const g = facts(); g.functions[0]!.sizeBytes = { known: false, value: 0 } as any;
  expect(() => captureAnalysisFactsV1(request(), g)).toThrow("unknown metric");
});
test("complete acquisition cannot hide partial chunks or unread byte holes", () => {
  const f = facts(); f.coverage = { status: "complete", reasons: [] };
  expect(() => captureAnalysisFactsV1(request(), f)).toThrow("partial chunks");
  f.functions.forEach(fn => { fn.chunkCoverage = { status: "complete", reasons: [] }; });
  f.bytes = [];
  expect(() => captureAnalysisFactsV1(request(), f)).toThrow("missing byte ranges");
});
test("scope, limits, raw references and observation sources are checked", () => {
  const f = facts(); f.bytes[0]!.content = { kind: "reference", locator: "synthetic:immutable-bytes", sha256: sha };
  expect(captureAnalysisFactsV1(request(), f).bytes[0]!.content).toEqual(f.bytes[0]!.content);
  f.sources[0]!.role = "declaration";
  expect(() => captureAnalysisFactsV1(request(), f)).toThrow("declaration");
  for (const key of ["maxFunctions", "maxChunks", "maxBytes", "maxRelations", "maxSources"] as const) { const q = request(); q.limits[key] = 0; expect(() => captureAnalysisFactsV1(q, facts())).toThrow(); }
  const g = facts(); g.functions[0]!.rva = "0x3000"; g.functions[0]!.ea = "0x403000";
  expect(() => captureAnalysisFactsV1(request(), g)).toThrow("scope");
});
test("captures and projection are detached/frozen; legacy documents remain unchanged", () => {
  const q = request(), f = facts(), qImage = JSON.stringify(q), fImage = JSON.stringify(f);
  const old = { schemaVersion: 1, idbIdentity: "historical", normalizedFingerprint: sha, rePolicy: { version: 1 } }, image = JSON.stringify(old);
  expect(() => captureAnalysisFactsV1(q, old)).toThrow(); expect(JSON.stringify(old)).toBe(image);
  const captured = captureAnalysisRequestV1(q), p = projectAnalysisFactsToGraphV1(q, f, codec, { graphRevision: 2 });
  expect(JSON.stringify(q)).toBe(qImage); expect(JSON.stringify(f)).toBe(fImage);
  q.expected.analysisSpace.identity = "changed"; f.sources[0]!.locator = "changed";
  expect(captured.expected.analysisSpace.identity).toBe("space-1"); expect(p.sourceFacts.sources[0]!.locator).toBe("synthetic:raw-response");
  expect(Object.isFrozen(p.nodes[0]!.boundaries)).toBe(true); expect(Object.isFrozen(p.sourceFacts)).toBe(true);
});
test("all outcome branches bind version/request; parsing never yields native proof", () => {
  for (const status of ["refused", "error"] as const) {
    const o = { version: "rms-static-acquisition-outcome-v1" as const, requestId: request().requestId, status, reason: "synthetic refusal" };
    expect(captureAnalysisOutcomeV1(request(), o)).toEqual(o);
    expect(() => captureAnalysisOutcomeV1(request(), { ...o, requestId: "foreign" })).toThrow();
  }
  const o = captureAnalysisOutcomeV1(request(), { version: "rms-static-acquisition-outcome-v1", requestId: request().requestId, status: "observed", facts: facts() });
  expect(Object.keys(o)).not.toContain("verified");
  expect(() => captureAnalysisFactsV1(request(), { ...facts(), verified: true })).toThrow();
  const f = facts(); Object.defineProperty(f, "requestId", { get() { throw new Error("should not run"); }, enumerable: true });
  expect(() => captureAnalysisFactsV1(request(), f)).toThrow("accessor");
});
