/** DATA contract only. Neither validation nor an adapter's labels attest native acquisition. */
export interface AnalysisIdentityV1 {
  moduleSha256: string;
  imageBase: string;
  analysisSpace: { backend: string; identity: string; revision: string | null };
}
export interface AnalysisRangeV1 { rva: string; endRvaExclusive: string }
export interface StaticAcquisitionRequestV1 {
  version: "rms-static-acquisition-request-v1";
  requestId: string;
  expected: AnalysisIdentityV1;
  scope: { functionRvas: string[]; byteRanges: AnalysisRangeV1[]; includeRelations: boolean };
  limits: { maxFunctions: number; maxChunks: number; maxBytes: number; maxRelations: number; maxSources: number };
}
export interface AnalysisCoverageV1 { status: "complete" | "partial" | "unknown"; reasons: string[] }
export type AnalysisMetricV1 = { known: true; value: number } | { known: false; value: null };
export interface AnalysisSourceV1 {
  id: string;
  role: "observation" | "declaration";
  origin: "fixture" | "adapter-output";
  locator: string;
  sourceVersion: string;
  sourceSha256: string;
  evidenceSha256: string;
}
export interface AnalysisFunctionV1 {
  rva: string; ea: string;
  /** A label, never scientific evidence or a function identity. */
  name: string;
  chunks: Array<AnalysisRangeV1 & { role: "entry" | "tail" }>;
  chunkCoverage: AnalysisCoverageV1;
  sizeBytes: AnalysisMetricV1; instructionCount: AnalysisMetricV1; basicBlockCount: AnalysisMetricV1;
  sourceIds: string[];
}
export interface AnalysisBytesV1 extends AnalysisRangeV1 {
  ea: string;
  content: { kind: "hex"; hex: string } | { kind: "reference"; locator: string; sha256: string };
  sourceIds: string[];
}
export interface AnalysisRelationV1 {
  id: string; fromFunctionRva: string; siteRva: string; siteEa: string;
  kind: "direct_call" | "tail_jump" | "indirect_call" | "indirect_jump" | "data_xref";
  xrefType: "code" | "data";
  target: { kind: "function" | "address"; rva: string } | { kind: "unknown"; reason: string };
  sourceIds: string[];
}
export interface StaticAnalysisFactsV1 {
  version: "rms-static-analysis-facts-v1";
  requestId: string;
  observedIdentity: AnalysisIdentityV1;
  sources: AnalysisSourceV1[];
  functions: AnalysisFunctionV1[];
  bytes: AnalysisBytesV1[];
  relations: AnalysisRelationV1[];
  coverage: AnalysisCoverageV1;
  limitations: string[];
}
export type StaticAcquisitionOutcomeV1 = {
  version: "rms-static-acquisition-outcome-v1"; requestId: string;
} & ({ status: "observed"; facts: StaticAnalysisFactsV1 } | {
  status: "refused" | "error"; reason: string;
});
export interface AnalysisPortV1 {
  readonly version: "rms-analysis-port-v1";
  acquire(request: StaticAcquisitionRequestV1): Promise<StaticAcquisitionOutcomeV1>;
}
function need(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`analysis: ${message}`); }
/** Accept JSON DTOs, not executable properties. Not a sandbox or universal Proxy detector. */
function data(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") { need(Number.isSafeInteger(value), "safe integer required"); return; }
  need(typeof value === "object", "JSON DTO required");
  need(!seen.has(value), "cyclic DTO"); seen.add(value);
  need(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null, "plain DTO required");
  for (const key of Reflect.ownKeys(value)) {
    need(typeof key === "string", "symbol property forbidden");
    const d = Object.getOwnPropertyDescriptor(value, key)!;
    need("value" in d && (d.enumerable || (Array.isArray(value) && key === "length")), "accessor/non-DTO property forbidden");
    if (!(Array.isArray(value) && key === "length")) data(d.value, seen);
  }
  if (Array.isArray(value)) need(Object.keys(value).length === value.length && Object.keys(value).every((k, i) => k === String(i)), "dense DTO array required");
  seen.delete(value);
}
function obj(v: unknown, keys: string): asserts v is Record<string, any> {
  need(v !== null && typeof v === "object" && !Array.isArray(v), "object required");
  const expected = keys.split(" ");
  need(Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k)), `exact fields required: ${keys}`);
}
function text(v: unknown): asserts v is string { need(typeof v === "string" && v.length > 0, "nonempty text required"); }
function sha(v: unknown) { need(typeof v === "string" && /^[a-f0-9]{64}$/.test(v), "lowercase sha256 required"); }
function integer(v: unknown) { need(Number.isSafeInteger(v) && Number(v) >= 0, "nonnegative safe integer required"); }
function addr(v: unknown, positive = false): asserts v is string {
  need(typeof v === "string" && /^0x(?:0|[1-9A-F][0-9A-F]*)$/.test(v), "canonical address required");
  need(!positive || BigInt(v) > 0n, "positive function RVA required");
}
function list(v: unknown): asserts v is any[] { need(Array.isArray(v), "array required"); }
function strings(v: unknown) { list(v); v.forEach(text); }
function identity(v: unknown) {
  obj(v, "moduleSha256 imageBase analysisSpace"); sha(v.moduleSha256); addr(v.imageBase);
  obj(v.analysisSpace, "backend identity revision"); text(v.analysisSpace.backend); text(v.analysisSpace.identity);
  if (v.analysisSpace.revision !== null) text(v.analysisSpace.revision);
}
function range(v: Record<string, any>) { addr(v.rva); addr(v.endRvaExclusive); need(BigInt(v.rva) < BigInt(v.endRvaExclusive), "nonempty range required"); }
function coverage(v: unknown) {
  obj(v, "status reasons"); need(["complete", "partial", "unknown"].includes(v.status), "coverage status required"); strings(v.reasons);
  need(v.status === "complete" ? v.reasons.length === 0 : v.reasons.length > 0, "coverage reasons inconsistent");
}
function metric(v: unknown) { obj(v, "known value"); need(v.known === true || v.known === false, "metric known flag required"); if (v.known) integer(v.value); else need(v.value === null, "unknown metric must be null, not zero"); }
function sameIdentity(a: AnalysisIdentityV1, b: AnalysisIdentityV1) {
  return a.moduleSha256 === b.moduleSha256 && a.imageBase === b.imageBase && a.analysisSpace.backend === b.analysisSpace.backend && a.analysisSpace.identity === b.analysisSpace.identity && a.analysisSpace.revision === b.analysisSpace.revision;
}
function freeze<T>(v: T): T { if (v && typeof v === "object") { Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
/** Detached and frozen; does not confer permissions, native provenance or snapshot admission. */
export function captureAnalysisRequestV1(value: unknown): StaticAcquisitionRequestV1 {
  data(value); obj(value, "version requestId expected scope limits");
  need(value.version === "rms-static-acquisition-request-v1", "request version mismatch"); text(value.requestId); identity(value.expected);
  obj(value.scope, "functionRvas byteRanges includeRelations"); list(value.scope.functionRvas); value.scope.functionRvas.forEach((r: unknown) => addr(r, true));
  need(new Set(value.scope.functionRvas).size === value.scope.functionRvas.length, "duplicate function request");
  list(value.scope.byteRanges); value.scope.byteRanges.forEach((r: unknown) => { obj(r, "rva endRvaExclusive"); range(r); });
  need(typeof value.scope.includeRelations === "boolean", "explicit relation scope required");
  obj(value.limits, "maxFunctions maxChunks maxBytes maxRelations maxSources"); Object.values(value.limits).forEach(integer);
  return freeze(structuredClone(value)) as StaticAcquisitionRequestV1;
}
export function captureAnalysisFactsV1(requestValue: unknown, value: unknown): StaticAnalysisFactsV1 {
  const request = captureAnalysisRequestV1(requestValue);
  data(value); obj(value, "version requestId observedIdentity sources functions bytes relations coverage limitations");
  need(value.version === "rms-static-analysis-facts-v1" && value.requestId === request.requestId, "facts version/request mismatch");
  identity(value.observedIdentity); need(sameIdentity(request.expected, value.observedIdentity), "observed identity mismatch");
  coverage(value.coverage); strings(value.limitations);
  list(value.sources); need(value.sources.length <= request.limits.maxSources, "source limit exceeded");
  const sources = new Map<string, AnalysisSourceV1>();
  for (const s of value.sources) {
    obj(s, "id role origin locator sourceVersion sourceSha256 evidenceSha256"); text(s.id); text(s.locator); text(s.sourceVersion); sha(s.sourceSha256); sha(s.evidenceSha256);
    need(["observation", "declaration"].includes(s.role) && ["fixture", "adapter-output"].includes(s.origin), "source role/origin required");
    need(!sources.has(s.id), "duplicate source"); sources.set(s.id, s as AnalysisSourceV1);
  }
  const refs = (v: unknown) => { strings(v); need((v as string[]).length > 0 && new Set(v as string[]).size === (v as string[]).length, "unique observation references required"); for (const id of v as string[]) need(sources.get(id)?.role === "observation", "missing observation source; declaration is not evidence"); };
  const ea = (rva: string, actual: unknown) => { addr(actual); need(BigInt(actual) === BigInt(request.expected.imageBase) + BigInt(rva), "EA/base/RVA mismatch"); };
  list(value.functions); need(value.functions.length <= request.limits.maxFunctions, "function limit exceeded");
  const functions = new Map<string, AnalysisFunctionV1>(); let chunks = 0;
  for (const f of value.functions) {
    obj(f, "rva ea name chunks chunkCoverage sizeBytes instructionCount basicBlockCount sourceIds"); addr(f.rva, true); ea(f.rva, f.ea);
    need(request.scope.functionRvas.includes(f.rva) && !functions.has(f.rva), "function outside scope or duplicate"); need(typeof f.name === "string", "label required");
    refs(f.sourceIds); coverage(f.chunkCoverage); metric(f.sizeBytes); metric(f.instructionCount); metric(f.basicBlockCount); list(f.chunks); chunks += f.chunks.length;
    let end = 0n;
    for (const c of f.chunks) { obj(c, "rva endRvaExclusive role"); range(c); need(["entry", "tail"].includes(c.role), "chunk role required"); need(BigInt(c.rva) >= end, "unordered/overlapping chunks"); end = BigInt(c.endRvaExclusive); if (c.role === "entry") need(c.rva === f.rva, "entry chunk mismatch"); }
    if (f.chunkCoverage.status === "complete") need(f.chunks.some((c: any) => c.role === "entry"), "complete chunks require entry");
    functions.set(f.rva, f as AnalysisFunctionV1);
  }
  need(chunks <= request.limits.maxChunks, "chunk limit exceeded");
  list(value.bytes); let byteCount = 0n;
  const byteSpans: Array<{ start: bigint; end: bigint }> = [];
  for (const b of value.bytes) {
    obj(b, "rva endRvaExclusive ea content sourceIds"); range(b); ea(b.rva, b.ea); refs(b.sourceIds);
    need(request.scope.byteRanges.some(r => BigInt(b.rva) >= BigInt(r.rva) && BigInt(b.endRvaExclusive) <= BigInt(r.endRvaExclusive)), "bytes outside scope");
    const length = BigInt(b.endRvaExclusive) - BigInt(b.rva); byteCount += length;
    byteSpans.push({ start: BigInt(b.rva), end: BigInt(b.endRvaExclusive) });
    if (b.content?.kind === "hex") { obj(b.content, "kind hex"); need(typeof b.content.hex === "string" && /^(?:[a-f0-9]{2})+$/.test(b.content.hex) && BigInt(b.content.hex.length / 2) === length, "byte hex/range mismatch"); }
    else { obj(b.content, "kind locator sha256"); need(b.content.kind === "reference", "byte content kind required"); text(b.content.locator); sha(b.content.sha256); }
  }
  need(byteCount <= BigInt(request.limits.maxBytes), "byte limit exceeded");
  list(value.relations); need(value.relations.length <= request.limits.maxRelations && (request.scope.includeRelations || value.relations.length === 0), "relation scope/limit exceeded");
  const ids = new Set<string>();
  for (const r of value.relations) {
    obj(r, "id fromFunctionRva siteRva siteEa kind xrefType target sourceIds"); text(r.id); need(!ids.has(r.id), "duplicate relation"); ids.add(r.id);
    addr(r.fromFunctionRva, true); addr(r.siteRva); ea(r.siteRva, r.siteEa); refs(r.sourceIds);
    need(functions.has(r.fromFunctionRva), "relation source function not observed");
    need(["direct_call", "tail_jump", "indirect_call", "indirect_jump", "data_xref"].includes(r.kind), "relation kind required");
    need(r.xrefType === (r.kind === "data_xref" ? "data" : "code"), "DATA cannot be a code call");
    if (r.target?.kind === "unknown") { obj(r.target, "kind reason"); text(r.target.reason); }
    else { obj(r.target, "kind rva"); need(["function", "address"].includes(r.target.kind), "target kind required"); addr(r.target.rva, r.target.kind === "function"); }
  }
  if (value.coverage.status === "complete") {
    need(request.scope.functionRvas.every(r => functions.has(r)), "unobserved targeted function remains unknown");
    need([...functions.values()].every(f => f.chunkCoverage.status === "complete"), "partial chunks cannot claim complete acquisition");
    const ordered = byteSpans.sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
    for (const r of request.scope.byteRanges) {
      let cursor = BigInt(r.rva);
      for (const span of ordered) if (span.start <= cursor && span.end > cursor) cursor = span.end;
      need(cursor >= BigInt(r.endRvaExclusive), "missing byte ranges remain unknown");
    }
  }
  return freeze(structuredClone(value)) as StaticAnalysisFactsV1;
}
export function captureAnalysisOutcomeV1(requestValue: unknown, value: unknown): StaticAcquisitionOutcomeV1 {
  const request = captureAnalysisRequestV1(requestValue); data(value);
  need(value !== null && typeof value === "object", "outcome required");
  if ((value as { status?: unknown }).status === "observed") {
    obj(value, "version requestId status facts");
    need(value.version === "rms-static-acquisition-outcome-v1" && value.requestId === request.requestId, "outcome version/request mismatch");
    return freeze({ version: value.version, requestId: value.requestId, status: "observed", facts: captureAnalysisFactsV1(request, value.facts) });
  }
  obj(value, "version requestId status reason");
  need(value.version === "rms-static-acquisition-outcome-v1" && value.requestId === request.requestId, "outcome version/request mismatch");
  need(value.status === "refused" || value.status === "error", "outcome status required"); text(value.reason);
  return freeze(structuredClone(value)) as StaticAcquisitionOutcomeV1;
}
