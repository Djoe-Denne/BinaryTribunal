/** Prospective DATA boundary. No export grants admission or terminality. */
import { assertExecutionJsonV1, makeBoundDocumentV1, parseGraphRunV3, type BoundDocument, type ByteRef } from "./graph-execution-envelope";
import { parseGraphRun } from "./graph-adapter";
import { captureAdmissionImageV3 } from "./graph-generation-budget";
import { canonical, fingerprint, hash } from "./validation";

export type RuntimeOriginV1 =
  | { kind: "graph-v2-fixture"; runRef: ByteRef; stateOwner: "graph-store-v2" }
  | { kind: "graph-v3-data"; runRef: ByteRef; envelopeRef: ByteRef; generationId: string; stateOwner: "generation-store-v3" };
export interface RuntimeBindingV1 {
  version: "rms-runtime-binding-v1"; origin: RuntimeOriginV1;
  admissionCodec: "l8-fixture-admission-codec-v2" | "rms-agent-admission-v1";
  transport: "offline-fixture-v1" | "opencode-v2-rpc-v1";
  knowledgeProjectionPolicyRef: ByteRef | null; nativeQualificationRef: ByteRef | null;
}
export interface PreparedRuntimeV1 { binding: BoundDocument<RuntimeBindingV1>; run: BoundDocument<unknown> }
/** New domain: none of these DATA records is an authority capability. */
export interface NativeRuntimeBindingV2 {
  version: "rms-native-runtime-binding-v2";
  stateOwner: "graph-store-native-v1";
  mode: "frozen-qualification-only-v1";
  missionId: string; lineageId: string; rootAccountId: string;
  generationId: string; headRevision: number;
  runRef: ByteRef; envelopeRef: ByteRef; planRef: ByteRef; snapshotRef: ByteRef;
  authorityRef: ByteRef;
  knowledgeProjectionPolicyRef: null;
}
/** Host-verified current authorization, not reconstructed from this DATA image. */
export interface NativeRuntimeAuthorityV1 {
  version: "rms-native-runtime-authority-v1";
  missionId: string; lineageId: string; rootAccountId: string; controllerOwner: string;
  controllerFence: number; generationId: string; headRevision: number;
  sourceRefs: ByteRef[]; proofRefs: ByteRef[]; historyRef: ByteRef;
  server: { version: "2.2.1"; pid: number; binarySha256: string; sourceSha256: string; openapiSha256: string };
}
/** Additive DATA domain. Neither these pins nor a parsed JSON object mint custody.
 * Legacy NativeRuntimeAuthorityV1.server.sourceSha256 is deliberately unchanged. */
export interface OwnedHostFilePinV1 { path: string; byteLength: number; sha256: string }
export interface OwnedNpmHostProvenanceV1 {
  version: "rms-owned-npm-host-provenance-v1";
  runtime: { name: "bun"; version: "1.4.2"; executable: OwnedHostFilePinV1 };
  rawSource: { meaning: "PUBLISHED_NPM_SERVER_DISTRIBUTION_TARBALL"; archive: OwnedHostFilePinV1 };
  closure: { archives: OwnedHostFilePinV1; installed: OwnedHostFilePinV1; archiveCount: 367; fileCount: 32227 };
  bootstrap: OwnedHostFilePinV1;
  plan: OwnedHostFilePinV1;
  custodyPolicy: { version: "rms-owned-http-readonly-policy-v1"; rawTargets: ["/api/info", "/openapi.json"]; nativeOptions204: true; post: "DENY_ALL" };
}
/** Pure shape check only; real pinned bytes, live handles and rights are verified
 * by the private parent composition, not by this public validator. */
export function assertOwnedNpmHostProvenanceV1(value: unknown): asserts value is OwnedNpmHostProvenanceV1 {
  assertExecutionJsonV1(value);
  const closed = (v: any, keys: string[]) => check(v && typeof v === "object" && !Array.isArray(v)
    && canonical(Object.keys(v).sort()) === canonical([...keys].sort()), "owned provenance closed shape");
  const pin = (v: any) => { closed(v, ["path", "byteLength", "sha256"]);
    check(typeof v.path === "string" && /^[A-Za-z]:[\\/]/.test(v.path) && !v.path.includes("\0")
      && Number.isSafeInteger(v.byteLength) && v.byteLength > 0 && v.byteLength <= 100 * 1024 * 1024
      && typeof v.sha256 === "string" && /^[a-f0-9]{64}$/.test(v.sha256), "owned provenance pin"); };
  const v = value as OwnedNpmHostProvenanceV1;
  closed(v, ["version", "runtime", "rawSource", "closure", "bootstrap", "plan", "custodyPolicy"]);
  check(v.version === "rms-owned-npm-host-provenance-v1", "owned provenance version");
  closed(v.runtime, ["name", "version", "executable"]); pin(v.runtime.executable);
  check(v.runtime.name === "bun" && v.runtime.version === "1.4.2", "owned runtime version");
  closed(v.rawSource, ["meaning", "archive"]); pin(v.rawSource.archive);
  check(v.rawSource.meaning === "PUBLISHED_NPM_SERVER_DISTRIBUTION_TARBALL", "owned raw source meaning");
  closed(v.closure, ["archives", "installed", "archiveCount", "fileCount"]); pin(v.closure.archives); pin(v.closure.installed);
  check(v.closure.archiveCount === 367 && v.closure.fileCount === 32227, "owned closure counts");
  pin(v.bootstrap); pin(v.plan);
  closed(v.custodyPolicy, ["version", "rawTargets", "nativeOptions204", "post"]);
  check(v.custodyPolicy.version === "rms-owned-http-readonly-policy-v1" && v.custodyPolicy.post === "DENY_ALL"
    && v.custodyPolicy.nativeOptions204 === true && canonical(v.custodyPolicy.rawTargets) === canonical(["/api/info", "/openapi.json"]), "owned readonly policy");
}
/** Pure negative oracle for offline tests. Passing DATA never registers a cap. */
export function ownedHostLiveFactsMatchV1(v: { closed: boolean; aborted: boolean; connected: boolean; exitCode: number | null; signalCode: string | null;
  pid: number; expectedPid: number; parentPid: number; expectedParentPid: number; expiresAt: number; monotonicExpiry: number }, now: number, monotonicNow: number): boolean {
  return v.closed === false && v.aborted === false && v.connected === true && v.exitCode === null && v.signalCode === null
    && Number.isSafeInteger(v.pid) && v.pid > 0 && v.pid === v.expectedPid
    && Number.isSafeInteger(v.parentPid) && v.parentPid > 0 && v.parentPid === v.expectedParentPid
    && Number.isFinite(now) && Number.isFinite(monotonicNow) && Number.isFinite(v.expiresAt) && Number.isFinite(v.monotonicExpiry)
    && now < v.expiresAt && monotonicNow < v.monotonicExpiry;
}
/** Native fs IDs stay BigInt. This pure equality is not an authority/mint. */
export interface OwnedFileIdentityV1 { dev: bigint; ino: bigint }
export function ownedFileIdentityMatchesV1(a: OwnedFileIdentityV1, b: OwnedFileIdentityV1): boolean {
  return typeof a.dev === "bigint" && typeof a.ino === "bigint" && typeof b.dev === "bigint" && typeof b.ino === "bigint"
    && a.dev >= 0n && a.ino > 0n && b.dev >= 0n && b.ino > 0n && a.dev === b.dev && a.ino === b.ino;
}
export function ownedFileIdentityDataV1(v: OwnedFileIdentityV1): { encoding: "decimal-bigint-v1"; devDecimal: string; inoDecimal: string } {
  check(ownedFileIdentityMatchesV1(v, v), "owned exact fs identity required");
  return { encoding: "decimal-bigint-v1", devDecimal: v.dev.toString(10), inoDecimal: v.ino.toString(10) };
}
/** Sticky monotonic deadline oracle. Clock injection is for OFFLINE finalization
 * cost tests only; the private owner constructs its own default-clock instance. */
export function ownedFinalizationBudgetV1(started: number, deadline: number, clock: () => number = () => performance.now()) {
  let last = Number.isFinite(started) ? started : 0;
  let exceeded = !Number.isFinite(started) || started < 0 || !Number.isFinite(deadline) || deadline <= started || deadline - started > 120000;
  const checkpoint = (): boolean => {
    try { const now = clock();
      if (!Number.isFinite(now) || now < last || now < started || now >= deadline) exceeded = true;
      if (Number.isFinite(now) && now >= last) last = now;
    } catch { exceeded = true; }
    return !exceeded;
  };
  return {
    checkpoint,
    outcome(candidate: boolean): "CANDIDATE_WITHIN_DEADLINE" | "HOLD_TOTAL_DEADLINE" | "HOLD" {
      if (!checkpoint()) return "HOLD_TOTAL_DEADLINE";
      return candidate ? "CANDIDATE_WITHIN_DEADLINE" : "HOLD";
    },
    snapshot() { return { startedMonotonicMs: started, deadlineMonotonicMs: deadline, lastMonotonicMs: last,
      elapsedMs: Math.max(0, last - started), exceeded }; },
  };
}
/** Only installed-file preflight DATA. No issuer, capability, transport or RMS
 * scheduling state is created by these bounded, injectable verification steps. */
export interface OwnedClosureRowV1 { readonly path: string; readonly byteLength: number; readonly sha256: string }
/** In-flight/settled describe admitted verification promises, not OS-wide I/O
 * quiescence after an abort. Only complete, non-HOLD verification can gate mint. */
export interface OwnedClosureProgressV1 {
  phase: "manifest" | "verifying" | "draining" | "complete" | "HOLD"; stage: string; hold: boolean;
  total: number; admitted: number; started: number; verified: number; settled: number; failed: number;
  inFlight: number; maxInFlight: number; bytesVerified: number; reservedDeclaredBytes: number; maxReservedDeclaredBytes: number; elapsedMs: number;
}
export function ownedClosureProgressV1(total: number): OwnedClosureProgressV1 {
  return { phase: "manifest", stage: "not-started", hold: false, total, admitted: 0, started: 0, verified: 0, settled: 0, failed: 0,
    inFlight: 0, maxInFlight: 0, bytesVerified: 0, reservedDeclaredBytes: 0, maxReservedDeclaredBytes: 0, elapsedMs: 0 };
}
export interface OwnedClosureFileFactsV1 extends OwnedFileIdentityV1 {
  regular: boolean; nonLink: boolean; canonical: boolean; size: bigint; mtimeNs: bigint; ctimeNs: bigint;
}
export function ownedClosureFileFactsMatchV1(row: OwnedClosureRowV1, a: OwnedClosureFileFactsV1, z: OwnedClosureFileFactsV1): boolean {
  return Number.isSafeInteger(row.byteLength) && row.byteLength >= 0 && row.byteLength <= 100 * 1024 * 1024
    && a.regular && z.regular && a.nonLink && z.nonLink && a.canonical && z.canonical && ownedFileIdentityMatchesV1(a, z)
    && a.size === BigInt(row.byteLength) && z.size === a.size && typeof a.mtimeNs === "bigint" && typeof a.ctimeNs === "bigint"
    && a.mtimeNs === z.mtimeNs && a.ctimeNs === z.ctimeNs;
}
export function assertOwnedClosureFileProofV1(row: OwnedClosureRowV1, a: OwnedClosureFileFactsV1, z: OwnedClosureFileFactsV1,
  bytesRead: number, actualSha256: string): void {
  check(ownedClosureFileFactsMatchV1(row, a, z) && bytesRead === row.byteLength && actualSha256 === row.sha256, "owned installed-file bytes/identity refused");
}
const ownedClosureStagesV1 = new Set(["row-start", "lstat-before", "realpath-before", "read", "hash", "lstat-after", "realpath-after", "verified"]);
/** All path/schema/uniqueness checks happen once, before any row I/O. */
function ownedClosureRowsV1(value: unknown): ReadonlyArray<OwnedClosureRowV1> {
  assertExecutionJsonV1(value); check(Array.isArray(value) && value.length <= 32227, "owned closure rows bound");
  const seen = new Set<string>();
  return Object.freeze(value.map((r: any) => {
    check(r && typeof r === "object" && !Array.isArray(r) && canonical(Object.keys(r).sort()) === canonical(["byteLength", "path", "sha256"])
      && typeof r.path === "string" && !/[\\:\0]/.test(r.path) && r.path.split("/").every((s: string) => s && s !== "." && s !== "..")
      && !seen.has(r.path.toLowerCase()) && Number.isSafeInteger(r.byteLength) && r.byteLength >= 0 && r.byteLength <= 100 * 1024 * 1024
      && typeof r.sha256 === "string" && /^[a-f0-9]{64}$/.test(r.sha256), "owned closure row/path refused");
    seen.add(r.path.toLowerCase()); return Object.freeze({ path: r.path, byteLength: r.byteLength, sha256: r.sha256 });
  }));
}
export interface OwnedClosureCheckV1 { stage(stage: string): void; check(stage: string): void }
export interface OwnedClosureChecksV1 {
  signal: AbortSignal; check(): void; boundary(): void; onHold(): void; elapsedMs(): number;
  verify(row: OwnedClosureRowV1, context: OwnedClosureCheckV1): Promise<void>;
}
/** Fixed 4-file/32MiB DECLARED-size installed-file batches, not a job engine.
 * The reservation is nominal admission accounting, NOT a buffer/RSS hard cap:
 * readFile may allocate more if a file grows after pre-stat; post guards refuse.
 * Public callbacks only produce DATA; the private owner supplies its lexical I/O
 * and independently requires full completion before any child/capability mint. */
export async function verifyOwnedClosureRowsBoundedV1(value: unknown, p: OwnedClosureProgressV1, io: OwnedClosureChecksV1): Promise<boolean> {
  const stop = () => { const first = !p.hold; p.hold = true; p.phase = p.inFlight ? "draining" : "HOLD";
    if (first) try { io.onHold(); } catch { /* HOLD is already sticky; drain still required. */ } };
  const tick = () => { try { const n = io.elapsedMs(); if (!Number.isFinite(n) || n < p.elapsedMs) stop(); else p.elapsedMs = n; } catch { stop(); } };
  const live = () => { tick(); if (p.hold || io.signal.aborted) { stop(); throw new Error("owned closure HOLD"); }
    try { io.check(); if (io.signal.aborted) throw new Error("owned closure abort"); } catch { stop(); throw new Error("owned closure guard refused"); } };
  const onAbort = () => stop(); io.signal.addEventListener("abort", onAbort, { once: true });
  try {
    let rows: ReadonlyArray<OwnedClosureRowV1>;
    try {
      check(!p.hold && p.admitted === 0 && p.started === 0 && p.settled === 0 && p.inFlight === 0, "owned fresh preflight required");
      live(); p.stage = "manifest"; rows = ownedClosureRowsV1(value); check(rows.length === p.total, "owned closure total changed"); live();
      p.phase = "verifying";
    } catch { stop(); tick(); return false; }
    let next = 0;
    while (next < rows.length && !p.hold) {
      try { live(); io.boundary(); live(); } catch { stop(); break; }
      let declaredBytes = 0; const batch: OwnedClosureRowV1[] = [];
      while (next < rows.length && batch.length < 4) {
        const row = rows[next]!;
        if (batch.length && (declaredBytes + row.byteLength > 32 * 1024 * 1024 || declaredBytes > 32 * 1024 * 1024)) break;
        batch.push(row); next++; declaredBytes += row.byteLength;
        if (row.byteLength > 32 * 1024 * 1024) break; // >32MiB, <=100MiB, exclusively alone
      }
      const pending: Promise<void>[] = [];
      for (const row of batch) {
        try { live(); } catch { stop(); break; }
        p.admitted++; p.started++; p.inFlight++; p.reservedDeclaredBytes += row.byteLength;
        p.maxInFlight = Math.max(p.maxInFlight, p.inFlight); p.maxReservedDeclaredBytes = Math.max(p.maxReservedDeclaredBytes, p.reservedDeclaredBytes);
        const stage = (name: string) => { if (!ownedClosureStagesV1.has(name)) { stop(); throw new Error("owned preflight stage refused"); } p.stage = name; tick(); };
        const context: OwnedClosureCheckV1 = { stage, check(name) { stage(name); live(); } };
        pending.push((async () => {
          try { context.check("row-start"); await io.verify(row, context); context.check("verified"); p.verified++; p.bytesVerified += row.byteLength; }
          catch { p.failed++; stop(); }
          finally { p.settled++; p.inFlight--; p.reservedDeclaredBytes -= row.byteLength; tick(); }
        })());
      }
      // Includes every admitted promise, even after abort/expiry/error. No new
      // admission until this sole in-flight batch has a known drained outcome.
      await Promise.allSettled(pending);
      try { live(); io.boundary(); live(); } catch { stop(); }
    }
    tick();
    const expectedBytes = rows.reduce((n, r) => n + r.byteLength, 0);
    if (p.hold || io.signal.aborted || p.verified !== rows.length || p.settled !== rows.length || p.admitted !== rows.length
      || p.failed || p.inFlight || p.reservedDeclaredBytes || p.bytesVerified !== expectedBytes) { stop(); p.phase = "HOLD"; return false; }
    p.phase = "complete"; p.stage = "verified"; return true;
  } finally { io.signal.removeEventListener("abort", onAbort); }
}
export interface NativeRootLedgerV1 {
  version: "rms-native-root-ledger-v1";
  missionId: string; lineageId: string; rootAccountId: string;
  revision: number; generationId: string; headRevision: number;
  controllerFence: number; historyRef: ByteRef;
  /** Includes bootstrap and qualification origins; never an empty-copy reset. */
  origins: Array<{ originId: string; sourceRef: ByteRef }>;
  slots: Array<{ slotKey: string; grantRef: ByteRef; capUtf8Bytes: number;
    acquiredUtf8Bytes: number; encumberedUtf8Bytes: number; spentUtf8Bytes: number; burnedUtf8Bytes: number }>;
}
export interface NativeRestWireImageV1 {
  version: "rms-native-rest-wire-image-v1";
  sessionId: string; messageId: string;
  create: { method: "POST"; route: "/api/session"; utf8: string; sha256: string; byteLength: number };
  prompt: { method: "POST"; route: string; utf8: string; sha256: string; byteLength: number };
  totalBodyUtf8Bytes: number;
  /** Explicitly different from DispatchJoinV1 and its still-null RPC field. */
  domain: "opencode-rest-2.2.1-v1";
}
/** Pure comparison only. The host must independently verify history/provenance. */
export function assertNativeRootContinuityV1(before: NativeRootLedgerV1, after: NativeRootLedgerV1): void {
  assertExecutionJsonV1({ before, after });
  check(before.version === "rms-native-root-ledger-v1" && after.version === before.version, "native ledger version");
  check(before.missionId === after.missionId && before.lineageId === after.lineageId && before.rootAccountId === after.rootAccountId,
    "native root identity changed");
  for (const ledger of [before, after]) {
    [ledger.missionId, ledger.lineageId, ledger.rootAccountId, ledger.generationId].forEach(text);
    [ledger.revision, ledger.headRevision, ledger.controllerFence].forEach(n => integer(n)); byteRef(ledger.historyRef);
    check(ledger.origins.length <= 3 && new Set(ledger.origins.map(o => o.originId)).size === ledger.origins.length, "native origin ceiling/history");
    ledger.origins.forEach(o => { text(o.originId); byteRef(o.sourceRef); });
    check(new Set(ledger.slots.map(s => s.slotKey)).size === ledger.slots.length, "duplicate native slot");
    ledger.slots.forEach(s => {
      text(s.slotKey); byteRef(s.grantRef);
      [s.capUtf8Bytes, s.acquiredUtf8Bytes, s.encumberedUtf8Bytes, s.spentUtf8Bytes, s.burnedUtf8Bytes].forEach(n => integer(n));
      check(s.acquiredUtf8Bytes <= s.capUtf8Bytes && s.encumberedUtf8Bytes <= s.acquiredUtf8Bytes
        && s.spentUtf8Bytes <= s.encumberedUtf8Bytes && s.burnedUtf8Bytes <= s.acquiredUtf8Bytes, "native slot debit bound");
    });
  }
  check(after.revision >= before.revision && after.headRevision >= before.headRevision && after.controllerFence >= before.controllerFence,
    "native ledger revision regressed");
  for (const origin of before.origins) check(after.origins.some(o => canonical(o) === canonical(origin)), "native origin history lost");
  for (const slot of before.slots) {
    const next = after.slots.find(s => s.slotKey === slot.slotKey);
    check(next && canonical(next.grantRef) === canonical(slot.grantRef) && next.capUtf8Bytes === slot.capUtf8Bytes,
      "native slot/grant/cap changed");
    for (const field of ["acquiredUtf8Bytes", "encumberedUtf8Bytes", "spentUtf8Bytes", "burnedUtf8Bytes"] as const)
      check(next[field] >= slot[field], "native debit refunded");
  }
}
export interface DispatchScopeV1 {
  missionId: string; cycle: number; unitId: string; functionId: string; subIntentId: string; role: "A" | "B" | "R";
  familyFence: number; controllerFence: number; expectedRevision: number;
  planRef: ByteRef; snapshotRef: ByteRef; inputBundle: BoundDocument<unknown>; outboxRef: ByteRef;
}
export interface DispatchJoinV1 {
  version: "rms-dispatch-join-v1"; bindingRef: ByteRef; origin: RuntimeOriginV1; scope: DispatchScopeV1;
  taskId: string; attemptId: string; executionId: string; idempotencyKey: string;
  requestedProfile: string; requestedModel: { providerID: string; id: string; variant: string };
  admissionRef: ByteRef; clientBodyRef: ByteRef;
  payloadDigest: string; upstreamBodyDigest: string; clientBodyDigest: string;
  /** No RPC bytes observed. Never substitute the durable body digest. */
  rpcBodySha256: null;
}
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`rms-runtime: ${message}`); }
function closed(value: unknown, keys: string[]): Record<string, any> {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "object required");
  const r = value as Record<string, any>;
  check(Object.keys(r).length === keys.length && keys.every(k => Object.hasOwn(r, k)), "exact fields required"); return r;
}
function text(v: unknown): asserts v is string { check(typeof v === "string" && v.trim().length > 0, "nonempty text required"); }
function integer(v: unknown, min = 0): void { check(Number.isSafeInteger(v) && (v as number) >= min && !Object.is(v, -0), "safe integer required"); }
function byteRef(v: unknown): void {
  const r = closed(v, ["kind", "encoding", "byteLength", "sha256"]); text(r.kind); integer(r.byteLength);
  check(["raw-v1", "utf8-json-v1"].includes(r.encoding) && typeof r.sha256 === "string" && /^[a-f0-9]{64}$/.test(r.sha256), "invalid byte reference");
}
export function readRuntimeDocumentV1<T>(value: BoundDocument<T>): T {
  assertExecutionJsonV1(value); const d = closed(value, ["ref", "utf8"]); byteRef(d.ref); text(d.utf8);
  check(d.ref.encoding === "utf8-json-v1" && Buffer.byteLength(d.utf8, "utf8") === d.ref.byteLength && hash(d.utf8) === d.ref.sha256, "document bytes changed");
  const parsed = JSON.parse(d.utf8); assertExecutionJsonV1(parsed); check(canonical(parsed) === d.utf8, "noncanonical document"); return parsed as T;
}
/** Source bytes only, not a cast between historical run unions. */
export function prepareRuntimeBindingV1(runDocument: BoundDocument<unknown>): PreparedRuntimeV1 {
  const raw = readRuntimeDocumentV1(runDocument) as Record<string, unknown>;
  let origin: RuntimeOriginV1;
  if (raw.version === "l8-graph-run-v3") {
    const parsed = parseGraphRunV3(Buffer.from(runDocument.utf8, "utf8")); check(parsed.ok, "invalid v3 DATA source");
    origin = { kind: "graph-v3-data", runRef: runDocument.ref, envelopeRef: parsed.value.run.envelope.ref,
      generationId: parsed.value.run.generationId, stateOwner: "generation-store-v3" };
  } else {
    const run = parseGraphRun(raw); check(run.version === "l8-graph-run-v2", "only v2 fixture or v3 DATA source");
    origin = { kind: "graph-v2-fixture", runRef: runDocument.ref, stateOwner: "graph-store-v2" };
  }
  const binding = makeBoundDocumentV1<RuntimeBindingV1>("rms-runtime-binding-v1", { version: "rms-runtime-binding-v1", origin,
    admissionCodec: origin.kind === "graph-v2-fixture" ? "l8-fixture-admission-codec-v2" : "rms-agent-admission-v1",
    transport: origin.kind === "graph-v2-fixture" ? "offline-fixture-v1" : "opencode-v2-rpc-v1",
    knowledgeProjectionPolicyRef: null, nativeQualificationRef: null });
  return Object.freeze({ binding, run: makeBoundDocumentV1(runDocument.ref.kind, raw) });
}
export function verifyPreparedRuntimeV1(value: PreparedRuntimeV1): RuntimeBindingV1 {
  assertExecutionJsonV1(value); closed(value, ["binding", "run"]); const actual = prepareRuntimeBindingV1(value.run);
  check(canonical(actual.binding) === canonical(value.binding), "binding/source mismatch or unsupported qualification");
  return readRuntimeDocumentV1(actual.binding);
}
/** Deliberately no enable flag or fixture escape hatch. */
export function refuseNativeRuntimeV1(): never { throw new Error("rms-runtime: native-unavailable; handler/source/version/worker-rights and terminal observer unqualified"); }

export function prepareDispatchJoinV1(runtime: PreparedRuntimeV1, scope: DispatchScopeV1, admission: unknown, body: Record<string, unknown>): BoundDocument<DispatchJoinV1> {
  const binding = verifyPreparedRuntimeV1(runtime); assertExecutionJsonV1({ scope, admission, body });
  closed(scope, ["missionId", "cycle", "unitId", "functionId", "subIntentId", "role", "familyFence", "controllerFence", "expectedRevision", "planRef", "snapshotRef", "inputBundle", "outboxRef"]);
  [scope.missionId, scope.unitId, scope.functionId, scope.subIntentId].forEach(text);
  [scope.cycle, scope.familyFence, scope.controllerFence].forEach(n => integer(n, 1)); integer(scope.expectedRevision);
  [scope.planRef, scope.snapshotRef, scope.outboxRef].forEach(byteRef);
  const inputs = readRuntimeDocumentV1(scope.inputBundle) as Record<string, unknown>;
  const image = captureAdmissionImageV3(admission), a = JSON.parse(image.admissionUtf8), command = a.command;
  const run = readRuntimeDocumentV1(runtime.run) as any;
  const source = binding.origin.kind === "graph-v2-fixture" ? run : readRuntimeDocumentV1(run.envelope) as any;
  const planning = binding.origin.kind === "graph-v2-fixture" ? source.prepared.planning : readRuntimeDocumentV1(source.planning) as any;
  const snapshot = binding.origin.kind === "graph-v2-fixture" ? source.prepared.snapshot : readRuntimeDocumentV1(source.fullGraphSnapshot) as any;
  const unit = planning.units.find((u: any) => u.unitId === scope.unitId), sub = unit?.subIntents.find((s: any) => s.subIntentId === scope.subIntentId);
  check(run.missionId === scope.missionId && sub?.functionId === scope.functionId && sub.role === scope.role && a.role === scope.role && a.subIntentId === scope.subIntentId, "admission/source scope mismatch");
  check(canonical(makeBoundDocumentV1(scope.planRef.kind, planning).ref) === canonical(scope.planRef) && canonical(makeBoundDocumentV1(scope.snapshotRef.kind, snapshot).ref) === canonical(scope.snapshotRef), "plan/snapshot bytes mismatch");
  check(fingerprint(a) === scope.outboxRef.sha256 && scope.outboxRef.byteLength === image.admissionUtf8Bytes, "outbox data image mismatch");
  check(["A", "B", "R"].includes(scope.role) && inputs.role === scope.role && inputs.cycle === scope.cycle && canonical(inputs.identity) === canonical(sub.harnessIdentity), "input projection identity mismatch");
  check(command.dossier && canonical(command.dossier.inputs) === scope.inputBundle.utf8 && command.metadata?.inputFingerprint === fingerprint(inputs), "command/input projection mismatch");
  const cycle = binding.origin.kind === "graph-v2-fixture" ? source.cycle : source.admissionSource.cycle;
  const template = binding.origin.kind === "graph-v2-fixture" ? source : readRuntimeDocumentV1(source.admissionSource.executionTemplate) as any;
  const spec = binding.origin.kind === "graph-v2-fixture" ? source.prepared.admissionSource.executionSourceSpec : readRuntimeDocumentV1(source.admissionSource.executionSourceSpec) as any;
  check(scope.cycle === cycle && command.profile === template.settings.profiles[scope.role] && canonical(command.model) === canonical(spec.models[scope.role]), "source profile/model/cycle mismatch");
  const commandBinding = binding.origin.kind === "graph-v2-fixture" ? command.metadata.graphBinding : command.metadata.rmsBinding;
  check(commandBinding && commandBinding.unitId === scope.unitId && commandBinding.subIntentId === scope.subIntentId && commandBinding.functionId === scope.functionId && commandBinding.role === scope.role, "command scope mismatch");
  if (binding.origin.kind === "graph-v2-fixture") check(commandBinding.familyToken === scope.familyFence && commandBinding.originalControllerToken === scope.controllerFence, "fixture fences mismatch");
  else check(commandBinding.version === "rms-agent-binding-data-v1" && commandBinding.familyFence === scope.familyFence && commandBinding.controllerFence === scope.controllerFence && canonical(commandBinding.runtimeBindingRef) === canonical(runtime.binding.ref), "prospective DATA fences/binding mismatch");
  for (const key of ["executionId", "attemptId", "idempotencyKey"]) check(a[key] === command[key] && body[key] === command[key], "command identity mismatch");
  text(command.taskId); text(command.profile); const model = closed(command.model, ["providerID", "id", "variant"]); Object.values(model).forEach(text);
  const { missionId, directory, controllerId, expectedRevision, ...payload } = body; text(directory); text(controllerId);
  check(missionId === scope.missionId && expectedRevision === scope.expectedRevision && canonical(payload) === image.commandUtf8, "durable body mismatch");
  return makeBoundDocumentV1("rms-dispatch-join-v1", { version: "rms-dispatch-join-v1", bindingRef: runtime.binding.ref, origin: binding.origin, scope,
    taskId: command.taskId, attemptId: a.attemptId, executionId: a.executionId, idempotencyKey: a.idempotencyKey,
    requestedProfile: command.profile, requestedModel: command.model, admissionRef: makeBoundDocumentV1("rms-admission-data-v1", a).ref,
    clientBodyRef: makeBoundDocumentV1("rms-client-body-v1", body).ref, payloadDigest: fingerprint(command), upstreamBodyDigest: image.requestDigest,
    clientBodyDigest: fingerprint(body), rpcBodySha256: null });
}
