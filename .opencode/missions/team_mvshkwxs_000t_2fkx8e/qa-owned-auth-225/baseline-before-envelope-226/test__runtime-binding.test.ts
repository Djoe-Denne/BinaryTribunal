/** New prospective DATA only; no authority/origin/DB/service is acquired. */
import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { Engine } from "../src/engine";
import { makeBoundDocumentV1 } from "../src/graph-execution-envelope";
import { prepareRuntimeBindingV1, readRuntimeDocumentV1, verifyPreparedRuntimeV1, refuseNativeRuntimeV1 } from "../src/graph-runtime-binding";
import { fixture, preparation } from "./s2-author/s1-source-fixtures";
import { assertNativeRootContinuityV1, type NativeRootLedgerV1 } from "../src/graph-runtime-binding";
import { encodeNativeRestWireImageV1, encodeNativeNotificationWireV1, submitNativeNotificationWireV1, submitNativeRestWireImageV1 } from "../src/native-runtime-transport";
import type { NativeRuntimeAuthorityV1 } from "../src/graph-runtime-binding";
import { assertOwnedNpmHostProvenanceV1, ownedHostLiveFactsMatchV1, ownedWindowsExecutablePathsMatchV1, ownedFileIdentityMatchesV1, ownedFileIdentityDataV1,
  ownedFinalizationBudgetV1, ownedClosureProgressV1, verifyOwnedClosureRowsBoundedV1, assertOwnedClosureFileProofV1,
  type OwnedClosureRowV1, type OwnedClosureFileFactsV1, type OwnedNpmHostProvenanceV1 } from "../src/graph-runtime-binding";
import { assertOwnedAuthIntentV1, ownedAuthStateV1, ownedAuthBudgetV1, assertOwnedAuthRequestV1, ownedAuthConnectBodyV1,
  ownedAuthConnectRouteV1, ownedAuthChallengeV1, ownedAuthStatusProjectionV1, ownedAuthIntegrationProjectionV1, ownedAuthPublicStatusesV1, ownedAuthPrivateRootFactsMatchV1,
  type OwnedAuthIntentV1, type OwnedAuthTransitionV1 } from "../src/graph-runtime-binding";

function offlineOwnedProvenance(): OwnedNpmHostProvenanceV1 {
  const pin = (name: string) => ({ path: `C:/OFFLINE/${name}`, byteLength: 1, sha256: "a".repeat(64) });
  return { version: "rms-owned-npm-host-provenance-v1", runtime: { name: "bun", version: "1.4.2", executable: pin("bun.exe") },
    rawSource: { meaning: "PUBLISHED_NPM_SERVER_DISTRIBUTION_TARBALL", archive: pin("server.tgz") },
    closure: { archives: pin("archives.json"), installed: pin("installed.json"), archiveCount: 367, fileCount: 32227 },
    bootstrap: pin("bootstrap.mjs"), plan: pin("plan.json"),
    custodyPolicy: { version: "rms-owned-http-readonly-policy-v1", rawTargets: ["/api/info", "/openapi.json"], nativeOptions204: true, post: "DENY_ALL" } };
}
function offlineAuthIntent(): OwnedAuthIntentV1 {
  return { version: "rms-owned-auth-intent-v1", id: "OFFLINE_auth", authOnly: true, provider: "openai", method: "chatgpt-headless",
    missionId: "OFFLINE", controllerOwner: "OFFLINE", controllerFence: 1, principalId: "OFFLINE", actorId: "OFFLINE-parent",
    invocationId: "OFFLINE-no-native-invocation", pid: 1, ownPath: "C:/OFFLINE/own.db", programSha256: "a".repeat(64),
    scopeSha256: "b".repeat(64), pinsSha256: "c".repeat(64), issuedAt: 1000, expiresAt: 241000 };
}
test("RMSN-AUTH private root requires empty real parent allocation", () => {
  // Facts are OFFLINE DATA, not a real allocation, ACL/SID proof or native cap.
  const root = "C:/OFFLINE/host180/auth-private-00000000-0000-0000-0000-000000000001";
  const facts = { path: root, realPath: root, directory: true, nonLink: true, entries: 0 };
  expect(ownedAuthPrivateRootFactsMatchV1(root, facts)).toBe(true);
  expect(ownedAuthPrivateRootFactsMatchV1(root, { ...facts, realPath: root.replaceAll("/", "\\").toUpperCase() })).toBe(true);
  for (const corrupt of [{ ...facts, directory: false }, { ...facts, nonLink: false }, { ...facts, entries: 1 },
    { ...facts, entries: -1 }, { ...facts, entries: NaN }, { ...facts, path: `${root}-other` },
    { ...facts, realPath: root.replace("C:", "D:") }, { ...facts, realPath: `${root}/child` },
    { ...facts, realPath: "C:/OFFLINE/other/auth-private-00000000-0000-0000-0000-000000000001" },
    { ...facts, realPath: "auth-private-00000000-0000-0000-0000-000000000001" }, { ...facts, realPath: `file:///${root}` }])
    expect(ownedAuthPrivateRootFactsMatchV1(root, corrupt)).toBe(false);
  expect(ownedAuthPrivateRootFactsMatchV1("relative", { ...facts, path: "relative", realPath: "relative" })).toBe(false);
  expect(ownedAuthPrivateRootFactsMatchV1(`${root}\0`, facts)).toBe(false);
}, 15000);

test("RMSN-AUTH routes bind exact OpenAI headless bytes and known attempt only", () => {
  for (const route of ["/api/info", "/openapi.json", "/api/integration", "/api/integration/openai"])
    expect(() => assertOwnedAuthRequestV1("GET", route, undefined, null)).not.toThrow();
  expect(() => assertOwnedAuthRequestV1("POST", ownedAuthConnectRouteV1, ownedAuthConnectBodyV1, null)).not.toThrow();
  expect(() => assertOwnedAuthRequestV1("GET", `${ownedAuthConnectRouteV1}/con_OFFLINE`, undefined, "con_OFFLINE")).not.toThrow();
  for (const [method, route, body, attempt] of [
    ["POST", ownedAuthConnectRouteV1, '{ "methodID":"chatgpt-headless"}', null],
    ["POST", ownedAuthConnectRouteV1, '{"methodID":"chatgpt-browser"}', null],
    ["POST", ownedAuthConnectRouteV1, ownedAuthConnectBodyV1, "con_OFFLINE"],
    ["POST", "/api/integration/other/connect/oauth", ownedAuthConnectBodyV1, null],
    ["GET", `${ownedAuthConnectRouteV1}/con_UNKNOWN`, undefined, "con_OFFLINE"],
    ["GET", `${ownedAuthConnectRouteV1}/con_OFFLINE?x=1`, undefined, "con_OFFLINE"],
    ["GET", "/api/credential", undefined, null], ["POST", "/api/credential", "{}", null],
    ["GET", "http://127.0.0.1/api/info", undefined, null], ["GET", "/api/%69ntegration", undefined, null],
    ["POST", `${ownedAuthConnectRouteV1}/con_OFFLINE/complete`, "{}", null],
    ["DELETE", `${ownedAuthConnectRouteV1}/con_OFFLINE`, undefined, "con_OFFLINE"],
    ["POST", "/api/session", "{}", null], ["POST", "/api/session/ses_OFFLINE/prompt", "{}", null],
  ] as const) expect(() => assertOwnedAuthRequestV1(method, route, body, attempt)).toThrow();
}, 15000);
test("RMSN-AUTH projections keep challenge private and discard credential and error secrets", () => {
  const raw = { data: { attemptID: "con_OFFLINE", url: "https://auth.openai.com/codex/device", instructions: "Enter code: ABCD-EFGH", mode: "auto", time: { created: 1000, expires: 2000 } } };
  const challenge = ownedAuthChallengeV1(raw, 1500); expect(challenge.code).toBe("ABCD-EFGH");
  for (const data of [{ ...raw.data, url: "https://example.invalid/codex/device" }, { ...raw.data, mode: "code" },
    { ...raw.data, instructions: "Enter code: ABCD-EFGH\nSECRET" }, { ...raw.data, access: "SECRET" }])
    expect(() => ownedAuthChallengeV1({ data }, 1500)).toThrow();
  expect(() => ownedAuthChallengeV1(raw, 2000)).toThrow();
  const status = ownedAuthStatusProjectionV1({ data: { status: "failed", message: "SECRET access refresh ABCD-EFGH", value: "SECRET", time: raw.data.time } });
  const integration = ownedAuthIntegrationProjectionV1({ data: [{ id: "other", value: "SECRET" }, { id: "openai", label: "SECRET",
    methods: [{ id: "chatgpt-headless", type: "oauth", label: "SECRET", form: { token: "SECRET" } }, { type: "env", names: ["SECRET"] }],
    connections: [{ type: "credential", id: "cred_OFFLINE", method: "oauth", label: "SECRET", value: { access: "SECRET" } }, { type: "env", name: "SECRET" }] }] });
  expect(status).toEqual({ status: "FAILED", created: 1000, expires: 2000 });
  const durable = JSON.stringify({ status, integration });
  for (const forbidden of ["SECRET", "ABCD-EFGH", "auth.openai.com", "access", "refresh", "label", "value", "env"])
    expect(durable).not.toContain(forbidden);
  expect(integration.id).toBe("openai"); expect(integration.methods).toEqual([{ id: "chatgpt-headless", type: "oauth" }]);
  const closed = { claimed: true, persisted: false, authStatus: "FAILED", failure: "AUTH_REFUSED", childStarted: true, childClosed: true, scopeClosed: true, exitCode: 0, forced: false };
  expect(ownedAuthPublicStatusesV1(closed)).toEqual({ authentication: "REFUSED", invocation: "REFUSED", closure: "NORMAL" });
  expect(ownedAuthPublicStatusesV1({ ...closed, authStatus: "HOLD", failure: "AUTH_IO_TIMEOUT" })).toEqual({ authentication: "UNKNOWN_OR_PENDING", invocation: "TIMED_OUT", closure: "NORMAL" });
  expect(ownedAuthPublicStatusesV1({ ...closed, persisted: true, authStatus: "COMPLETE", failure: null })).toEqual({ authentication: "PERSISTED", invocation: "COMPLETED_AUTH_ONLY", closure: "NORMAL" });
  expect(ownedAuthPublicStatusesV1({ ...closed, claimed: false, authStatus: "INTENDED", failure: "AUTH_HTTP_REFUSED" })).toEqual({ authentication: "NOT_STARTED", invocation: "REFUSED", closure: "NORMAL" });
  expect(ownedAuthPublicStatusesV1({ ...closed, authStatus: "HOLD", failure: "SECRET imported message" }).invocation).toBe("HOLD");
  expect(JSON.stringify(ownedAuthPublicStatusesV1({ ...closed, failure: "SECRET imported message" }))).not.toContain("SECRET");
}, 15000);
test("RMSN-AUTH claim is sticky across response loss expiry and late completion", () => {
  const intent = offlineAuthIntent(), history: OwnedAuthTransitionV1[] = [];
  const append = (status: OwnedAuthTransitionV1["status"], attemptId: string | null, at = 1100) => {
    const s = ownedAuthStateV1(intent, history), t: OwnedAuthTransitionV1 = { version: "rms-owned-auth-transition-v1", id: intent.id, revision: s.revision + 1, previousDigest: s.digest, status, attemptId, at };
    const next = ownedAuthStateV1(intent, [...history, t]); history.push(t); return next;
  };
  expect(() => assertOwnedAuthIntentV1({ ...intent, provider: "other" })).toThrow();
  expect(() => assertOwnedAuthIntentV1({ ...intent, authOnly: false })).toThrow();
  expect(() => assertOwnedAuthIntentV1({ ...intent, token: "SECRET" })).toThrow();
  expect(append("CONNECT_CLAIMED", null).claimed).toBe(true);
  expect(() => append("CONNECT_CLAIMED", null)).toThrow();
  // Lost CONNECT response: no attempt may be guessed, no reconnect on restart.
  const hold = append("HOLD", null); expect(hold.claimed).toBe(true); expect(hold.stopped).toBe(true);
  expect(ownedAuthStateV1(intent, structuredClone(history))).toEqual(hold);
  expect(() => append("ATTEMPT_KNOWN", "con_GUESSED")).toThrow(); expect(() => append("CONNECT_CLAIMED", null)).toThrow();
  const fresh = offlineAuthIntent(), initial = ownedAuthStateV1(fresh, []);
  expect(() => ownedAuthStateV1(fresh, [{ version: "rms-owned-auth-transition-v1", id: fresh.id, revision: 1, previousDigest: initial.digest,
    status: "CONNECT_CLAIMED", attemptId: null, at: fresh.expiresAt }])).toThrow();
  const known: OwnedAuthTransitionV1[] = []; let state = initial;
  for (const status of ["CONNECT_CLAIMED", "ATTEMPT_KNOWN", "REVOKED"] as const) {
    const t: OwnedAuthTransitionV1 = { version: "rms-owned-auth-transition-v1", id: fresh.id, revision: state.revision + 1,
      previousDigest: state.digest, status, attemptId: status === "CONNECT_CLAIMED" ? null : "con_OFFLINE", at: 1200 };
    known.push(t); state = ownedAuthStateV1(fresh, known);
  }
  expect(() => ownedAuthStateV1(fresh, [...known, { version: "rms-owned-auth-transition-v1", id: fresh.id, revision: state.revision + 1,
    previousDigest: state.digest, status: "COMPLETE", attemptId: "con_OFFLINE", at: 1300 }])).toThrow();
}, 15000);
test("RMSN-AUTH 240s total cutoff stays HOLD through mocked closure and finalization", () => {
  for (const stage of ["status", "close", "receipt", "ui"] as const) {
    let clock = 239999, physicalClosed = false;
    const budget = ownedAuthBudgetV1(0, 240000, () => clock); expect(budget.checkpoint()).toBe(true);
    const mockedBoundary = () => { if (stage === "close") physicalClosed = true; clock = 240001; };
    mockedBoundary(); expect(budget.checkpoint()).toBe(false); physicalClosed = true;
    expect(physicalClosed).toBe(true); expect(budget.checkpoint()).toBe(false); clock = 1; expect(budget.checkpoint()).toBe(false);
  }
  let clock = 1; expect(ownedAuthBudgetV1(0, 240001, () => clock).checkpoint()).toBe(false);
  clock = 120001; expect(ownedFinalizationBudgetV1(0, 120000, () => clock).checkpoint()).toBe(false); // A unchanged
}, 15000);
test("RMSN-OWNED-RO provenance is typed DATA and preserves legacy source meaning", () => {
  const p = offlineOwnedProvenance(), before = structuredClone(p);
  const legacy: NativeRuntimeAuthorityV1["server"] = { version: "2.2.1", pid: 1, binarySha256: "b".repeat(64), sourceSha256: "c".repeat(64), openapiSha256: "d".repeat(64) };
  const legacyBefore = structuredClone(legacy);
  expect(() => assertOwnedNpmHostProvenanceV1(p)).not.toThrow();
  expect(p).toEqual(before); expect(legacy).toEqual(legacyBefore);
  expect(p.rawSource.meaning).toBe("PUBLISHED_NPM_SERVER_DISTRIBUTION_TARBALL");
  expect(legacy.sourceSha256).toBe("c".repeat(64));
}, 15000);
test("RMSN-OWNED-RO malformed provenance and mutable policy are refused", () => {
  for (const corrupt of [
    (p: any) => { p.rawSource.meaning = "DESKTOP_SOURCE"; },
    (p: any) => { p.runtime.version = "1.4.4"; },
    (p: any) => { p.closure.fileCount = 0; },
    (p: any) => { p.bootstrap.path = "relative.mjs"; },
    (p: any) => { p.plan.sha256 = "not-a-pin"; },
    (p: any) => { p.custodyPolicy.post = "ALLOW"; },
    (p: any) => { p.custodyPolicy.rawTargets.push("/api/session"); },
    (p: any) => { p.callerAuthority = true; },
  ]) { const p = offlineOwnedProvenance(); corrupt(p); expect(() => assertOwnedNpmHostProvenanceV1(p)).toThrow(); }
}, 15000);
test("RMSN-OWNED-RO READY executable matches only equivalent full absolute Windows paths", () => {
  // Pure DATA: no process, path I/O, realpath, runtime import or capability mint.
  const plan = "C:/Users/OFFLINE/.bun/bin/bun.exe", native = String.raw`C:\Users\OFFLINE\.bun\bin\bun.exe`;
  for (const path of [plan, native, String.raw`c:\USERS\offline\.BUN\BIN\BUN.EXE`, "c:/Users/OFFLINE/.bun/bin/BUN.exe"]) {
    expect(ownedWindowsExecutablePathsMatchV1(path, plan)).toBe(true);
    expect(ownedWindowsExecutablePathsMatchV1(plan, path)).toBe(true);
  }
  for (const wrong of [null, {}, 1, "", "bun.exe", "Users/OFFLINE/.bun/bin/bun.exe", "C:Users/OFFLINE/.bun/bin/bun.exe",
    "/Users/OFFLINE/.bun/bin/bun.exe", String.raw`\Users\OFFLINE\.bun\bin\bun.exe`,
    "D:/Users/OFFLINE/.bun/bin/bun.exe", "C:/Users/OTHER/.bun/bin/bun.exe", "C:/Users/OFFLINE/.bun/bin/node.exe",
    "C:/prefix/Users/OFFLINE/.bun/bin/bun.exe", `${plan}/suffix`, `file:///${plan}`, `https://example.invalid/${plan}`,
    String.raw`\\server\Users\OFFLINE\.bun\bin\bun.exe`, String.raw`\\?\C:\Users\OFFLINE\.bun\bin\bun.exe`,
    "C://Users/OFFLINE/.bun/bin/bun.exe", "C:/Users/OFFLINE/.bun/./bin/bun.exe", "C:/Users/OFFLINE/.bun/other/../bin/bun.exe",
    `${plan}\0`, `${plan}\n`, `${plan}:stream`, `${plan}.`, `${plan} `, "C:/Users/OFFLINE/.bun/bin/bu?n.exe"]) {
    expect(ownedWindowsExecutablePathsMatchV1(wrong, plan)).toBe(false);
    expect(ownedWindowsExecutablePathsMatchV1(plan, wrong)).toBe(false);
  }
  for (const malformed of [null, "", "bun.exe", "C:relative.exe", "C:/", `${plan}\0`, "file:///C:/bun.exe"])
    expect(ownedWindowsExecutablePathsMatchV1(malformed, malformed)).toBe(false);
}, 15000);

test("RMSN-OWNED-RO expired dead or divergent handle facts are not live", () => {
  // Pure negative oracle only: even the matching DATA case is NOT a cap mint.
  const base = { closed: false, aborted: false, connected: true, exitCode: null as number | null, signalCode: null as string | null,
    pid: 2, expectedPid: 2, parentPid: 1, expectedParentPid: 1, expiresAt: 1000, monotonicExpiry: 500 };
  expect(ownedHostLiveFactsMatchV1(base, 100, 100)).toBe(true);
  for (const change of [{ closed: true }, { aborted: true }, { connected: false }, { exitCode: 0 }, { signalCode: "SIGKILL" },
    { pid: 3 }, { pid: 0 }, { parentPid: 3 }, { expiresAt: 100 }, { monotonicExpiry: 100 }])
    expect(ownedHostLiveFactsMatchV1({ ...base, ...change }, 100, 100)).toBe(false);
  expect(ownedHostLiveFactsMatchV1(base, Number.NaN, 100)).toBe(false);
}, 15000);

test("RMSN-OWNED-RO fs identities beyond 2pow53 remain distinct and serialize as decimal strings", () => {
  const held = { dev: 9007199254740993n, ino: 9007199254740992n };
  expect(ownedFileIdentityMatchesV1(held, { ...held })).toBe(true);
  expect(ownedFileIdentityMatchesV1(held, { ...held, ino: 9007199254740993n })).toBe(false);
  expect(ownedFileIdentityMatchesV1(held, { ...held, dev: 9007199254740992n })).toBe(false);
  const data = ownedFileIdentityDataV1(held);
  expect(data).toEqual({ encoding: "decimal-bigint-v1", devDecimal: "9007199254740993", inoDecimal: "9007199254740992" });
  expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  expect(ownedFileIdentityDataV1({ ...held, ino: 9007199254740993n }).inoDecimal).not.toBe(data.inoDecimal);
}, 15000);

test("RMSN-OWNED-RO finalization cost crossing 120s latches HOLD despite HTTP and scope success", () => {
  // Injected monotonic clock/cost only: no sleeps, fsync, host, DB or native cap.
  for (const overrunStage of ["logs", "receipt-sync", "receipt-readback"]) {
    let clock = 119980;
    const budget = ownedFinalizationBudgetV1(0, 120000, () => clock);
    const facts = { httpMatched: true, scopeClosed: true, receiptStatus: "PROVISIONAL_NOT_ADOPTABLE" };
    expect(budget.checkpoint()).toBe(true);
    for (const stage of ["logs", "receipt-sync", "receipt-readback"]) {
      budget.checkpoint(); // same before/after boundary used around owner I/O
      const simulatedFinalize = () => { clock += stage === overrunStage ? 30 : 1; };
      simulatedFinalize(); budget.checkpoint();
    }
    expect(budget.checkpoint()).toBe(false);
    expect(budget.snapshot().exceeded).toBe(true);
    expect(budget.snapshot().elapsedMs).toBeGreaterThanOrEqual(120000);
    expect(facts.httpMatched && facts.scopeClosed && budget.checkpoint()).toBe(false);
    expect(budget.outcome(facts.httpMatched && facts.scopeClosed)).toBe("HOLD_TOTAL_DEADLINE");
    expect(facts.receiptStatus).toBe("PROVISIONAL_NOT_ADOPTABLE");
    clock = 1; expect(budget.checkpoint()).toBe(false); // restart/backward clock cannot clear HOLD
  }
  let clock = 119999;
  const exactBoundary = ownedFinalizationBudgetV1(0, 120000, () => clock);
  expect(exactBoundary.checkpoint()).toBe(true);
  clock = 120000; expect(exactBoundary.checkpoint()).toBe(false);
}, 15000);

function offlineClosureFacts(row: OwnedClosureRowV1): OwnedClosureFileFactsV1 {
  return { dev: 9007199254740993n, ino: 9007199254740995n, size: BigInt(row.byteLength), mtimeNs: 10n, ctimeNs: 11n,
    regular: true, nonLink: true, canonical: true };
}
test("RMSN-OWNED-RO bounded closure batches verify every row with exact identities", async () => {
  // DECLARED-size admission stubs, including 40MiB alone. No allocation of
  // those payload sizes: limits are nominal, not a buffer/RSS or latency oracle.
  const mib = 1024 * 1024, controller = new AbortController();
  const rows = [20, 12, 1, 1, 40, 1, 1, 1, 1].map((n, i) => ({ path: `OFFLINE/f${i}`, byteLength: n * mib, sha256: "a".repeat(64) }));
  const progress = ownedClosureProgressV1(rows.length), started: string[] = [], hashed: string[] = [], finished: string[] = [];
  const waiting: Array<() => void> = [], observations: Array<{ count: number; declaredBytes: number; rowBytes: number }> = [];
  let done = false, bootstrapCalls = 0;
  const pending = verifyOwnedClosureRowsBoundedV1(rows, progress, {
    signal: controller.signal, elapsedMs: () => 1, check() { controller.signal.throwIfAborted(); }, boundary() {}, onHold() { controller.abort(); },
    async verify(row, context) {
      started.push(row.path); observations.push({ count: progress.inFlight, declaredBytes: progress.reservedDeclaredBytes, rowBytes: row.byteLength });
      context.check("read"); await new Promise<void>(resolve => { waiting.push(resolve); }); context.check("hash");
      hashed.push(row.path); const facts = offlineClosureFacts(row);
      assertOwnedClosureFileProofV1(row, facts, facts, row.byteLength, row.sha256); finished.push(row.path);
    },
  }).then(value => { done = true; return value; });
  for (let turns = 0; turns < 100 && !done; turns++) { await Promise.resolve(); for (const release of waiting.splice(0).reverse()) release(); }
  if (!done) { controller.abort(); for (const release of waiting.splice(0)) release(); }
  const complete = await pending;
  if (complete && progress.phase === "complete" && progress.inFlight === 0) bootstrapCalls++;
  expect(complete).toBe(true); expect(bootstrapCalls).toBe(1);
  expect(progress.verified).toBe(rows.length); expect(progress.settled).toBe(rows.length); expect(progress.failed).toBe(0);
  expect(progress.bytesVerified).toBe(rows.reduce((n, r) => n + r.byteLength, 0)); expect(progress.reservedDeclaredBytes).toBe(0);
  expect(progress.maxInFlight).toBe(4); expect(progress.maxReservedDeclaredBytes).toBe(40 * mib);
  expect(observations.every(v => v.count <= 4 && (v.declaredBytes <= 32 * mib || v.count === 1 && v.rowBytes > 32 * mib))).toBe(true);
  expect(started).toEqual(rows.map(r => r.path)); expect(new Set(hashed).size).toBe(rows.length); expect(hashed.length).toBe(rows.length);
  expect(finished).not.toEqual(started); expect(JSON.stringify(progress)).not.toContain("OFFLINE/");
  const payloads = new Map<string, Buffer>(["alpha", "beta", "gamma"].map((s, i) => [`OFFLINE/bytes${i}`, Buffer.from(s)] as const));
  const actualRows = [...payloads].map(([path, bytes]) => ({ path, byteLength: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }));
  const actualProgress = ownedClosureProgressV1(actualRows.length), actualAbort = new AbortController(); let actualHashes = 0;
  expect(await verifyOwnedClosureRowsBoundedV1(actualRows, actualProgress, { signal: actualAbort.signal, check() {}, boundary() {}, elapsedMs: () => 1,
    onHold() { actualAbort.abort(); }, async verify(row, context) {
      const bytes = payloads.get(row.path)!; context.check("hash"); const digest = createHash("sha256").update(bytes).digest("hex"); actualHashes++;
      assertOwnedClosureFileProofV1(row, offlineClosureFacts(row), offlineClosureFacts(row), bytes.length, digest);
    } })).toBe(true);
  expect(actualHashes).toBe(actualRows.length); expect(actualProgress.verified).toBe(actualRows.length);
  const tiny = Buffer.from("OFFLINE exact bytes"), sha = createHash("sha256").update(tiny).digest("hex");
  const row = { path: "OFFLINE/tiny", byteLength: tiny.length, sha256: sha }, facts = offlineClosureFacts(row);
  expect(() => assertOwnedClosureFileProofV1(row, facts, facts, tiny.length, sha)).not.toThrow();
  expect(() => assertOwnedClosureFileProofV1(row, facts, facts, tiny.length - 1, sha)).toThrow();
  const wrongSha = `${sha[0] === "0" ? "1" : "0"}${sha.slice(1)}`;
  expect(() => assertOwnedClosureFileProofV1(row, facts, facts, tiny.length, wrongSha)).toThrow();
  for (const after of [{ ...facts, ino: facts.ino + 1n }, { ...facts, size: facts.size + 1n }, { ...facts, mtimeNs: 12n },
    { ...facts, ctimeNs: 12n }, { ...facts, regular: false }, { ...facts, nonLink: false }, { ...facts, canonical: false }])
    expect(() => assertOwnedClosureFileProofV1(row, facts, after, tiny.length, sha)).toThrow();
  for (const bad of [[{ ...row, path: "../outside" }], [row, { ...row, path: "offline/TINY" }], [{ ...row, extra: true }]]) {
    let calls = 0; const abort = new AbortController(), p = ownedClosureProgressV1(bad.length);
    expect(await verifyOwnedClosureRowsBoundedV1(bad, p, { signal: abort.signal, check() {}, boundary() {}, elapsedMs: () => 1,
      onHold() { abort.abort(); }, async verify() { calls++; } })).toBe(false);
    expect(p.hold).toBe(true); expect(p.started).toBe(0); expect(calls).toBe(0);
  }
}, 15000);

test("RMSN-OWNED-RO closure abort drains inflight and retains HOLD progress", async () => {
  for (const fault of ["abort", "fence", "deadline", "file"] as const) {
    const controller = new AbortController(), rows = [0, 1, 2, 3, 4].map(i => ({ path: `OFFLINE/p${i}`, byteLength: 1, sha256: "a".repeat(64) }));
    const p = ownedClosureProgressV1(rows.length), waiting: Array<{ resolve(): void; reject(e: Error): void }> = [], returned: string[] = [];
    let fence = 1, clock = 1, done = false, bootstrapCalls = 0;
    const budget = ownedFinalizationBudgetV1(0, 120000, () => clock);
    const pending = verifyOwnedClosureRowsBoundedV1(rows, p, {
      signal: controller.signal, elapsedMs: () => clock,
      check() { controller.signal.throwIfAborted(); if (fence !== 1 || !budget.checkpoint()) throw new Error("OFFLINE custody/deadline changed"); },
      boundary() { if (fence !== 1) throw new Error("OFFLINE fence changed"); }, onHold() { controller.abort(); },
      async verify(row, context) {
        try { context.check("read"); await new Promise<void>((resolve, reject) => { waiting.push({ resolve, reject }); }); context.check("hash"); }
        finally { returned.push(row.path); }
      },
    }).then(value => { done = true; return value; });
    expect(p.admitted).toBe(4); expect(p.inFlight).toBe(4); expect(waiting.length).toBe(4);
    if (fault === "abort") controller.abort();
    else if (fault === "fence") fence = 2;
    else if (fault === "deadline") clock = 120001;
    if (fault === "file") waiting[0]!.reject(new Error("OFFLINE file read failed")); else waiting[0]!.resolve();
    for (let turns = 0; turns < 10 && !p.hold; turns++) await Promise.resolve();
    expect(p.hold).toBe(true); expect(done).toBe(false); expect(p.admitted).toBe(4); expect(p.inFlight).toBeGreaterThan(0);
    // All remaining admitted reads finish late; none can launch row 5 or clear
    // HOLD. This is the deterministic drain oracle, not a real OS abort claim.
    for (const held of waiting.slice(1).reverse()) held.resolve();
    const complete = await pending;
    if (complete && p.phase === "complete" && p.inFlight === 0) bootstrapCalls++;
    expect(complete).toBe(false); expect(bootstrapCalls).toBe(0); expect(p.phase).toBe("HOLD");
    expect(p.admitted).toBe(4); expect(p.started).toBe(4); expect(p.settled).toBe(4); expect(p.failed).toBe(4);
    expect(p.verified).toBe(0); expect(p.bytesVerified).toBe(0); expect(p.inFlight).toBe(0); expect(p.reservedDeclaredBytes).toBe(0);
    expect(returned.length).toBe(4); expect(JSON.stringify(p)).not.toContain("OFFLINE/");
    expect(controller.signal.aborted).toBe(true); expect(p.hold).toBe(true);
    if (fault === "deadline") expect(budget.outcome(true)).toBe("HOLD_TOTAL_DEADLINE");
    let replayIo = 0;
    expect(await verifyOwnedClosureRowsBoundedV1(rows, p, { signal: controller.signal, check() {}, boundary() {}, elapsedMs: () => clock,
      onHold() {}, async verify() { replayIo++; } })).toBe(false);
    expect(replayIo).toBe(0); expect(p.admitted).toBe(4); expect(p.phase).toBe("HOLD");
  }
}, 15000);

test("RMSN- ordered wire is exact, stable, non-waking and cannot authorize its own transport", async () => {
  const request = { commandId: "notification-1", sessionId: "ses_offline", executionId: "exec-offline", unitId: "unit-offline", sequence: 1, action: "notify", reason: "offline control" };
  const image = encodeNativeNotificationWireV1("ses_offline", "offline", request.commandId, request, "a".repeat(64));
  expect(encodeNativeNotificationWireV1("ses_offline", "offline", request.commandId, structuredClone(request), "a".repeat(64))).toEqual(image);
  const parsed = JSON.parse(image.utf8);
  expect(parsed.resume).toBe(false); expect(parsed.delivery).toBe("queue"); expect(parsed.id).toBe(image.messageId);
  expect(JSON.parse(parsed.text).request).toEqual(request);
  expect(image.byteLength).toBe(Buffer.byteLength(image.utf8, "utf8"));
  expect(image.sha256).toBe(createHash("sha256").update(Buffer.from(image.utf8, "utf8")).digest("hex"));
  const divergent = encodeNativeNotificationWireV1("ses_offline", "offline", request.commandId, { ...request, reason: "changed" }, "a".repeat(64));
  expect(divergent.messageId).toBe(image.messageId); expect(divergent.sha256).not.toBe(image.sha256);
  let calls = 0;
  await expect(submitNativeNotificationWireV1(image, {} as import("../src/graph-runtime-binding").NativeRestWireImageV1,
    {} as NativeRuntimeAuthorityV1, { request: async () => { calls++; throw new Error("must not run"); } },
    { check() {}, observed() {}, claim() { return true; }, claimed() { return false; } })).rejects.toThrow("retained REST image/identity refused");
  expect(calls).toBe(0);
});

test("RMSN- REST image counts both exact bodies and a public callback cannot authorize IO", async () => {
  const image = encodeNativeRestWireImageV1({ sessionId: "ses_offline", messageId: "msg_offline", directory: "C:/offline",
    profile: "offline", model: { providerID: "fixture", id: "fixture", variant: "high" },
    permissions: [{ action: "*", resource: "*", effect: "deny" }], text: "λ\nexact frozen inputs", metadata: {}, delivery: "queue", resume: true });
  const sha = (s: string) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
  expect(image.create.sha256).toBe(sha(image.create.utf8)); expect(image.prompt.sha256).toBe(sha(image.prompt.utf8));
  expect(image.totalBodyUtf8Bytes).toBe(Buffer.byteLength(image.create.utf8, "utf8") + Buffer.byteLength(image.prompt.utf8, "utf8"));
  let calls = 0;
  await expect(submitNativeRestWireImageV1(image, {} as NativeRuntimeAuthorityV1, { request: async () => { calls++; throw new Error("must not run"); } },
    { check() {}, claimed() { return false; }, claim() { return true; }, observed() {} })).rejects.toThrow("retained REST image/identity refused");
  expect(calls).toBe(0);
});

const nativeLedger = (): NativeRootLedgerV1 => {
  const ref = makeBoundDocumentV1("offline-root-history", { history: "bootstrap" }).ref;
  return { version: "rms-native-root-ledger-v1", missionId: "offline", lineageId: "lineage", rootAccountId: "root",
    revision: 1, generationId: "generation", headRevision: 1, controllerFence: 1, historyRef: ref,
    origins: [{ originId: "bootstrap", sourceRef: ref }], slots: [{ slotKey: "A", grantRef: ref,
      capUtf8Bytes: 100, acquiredUtf8Bytes: 100, encumberedUtf8Bytes: 20, spentUtf8Bytes: 10, burnedUtf8Bytes: 0 }] };
};
test("RMSN- root continuity preserves bootstrap, grant, cap and monotone debits", () => {
  const before = nativeLedger(), after = structuredClone(before);
  after.revision++; after.slots[0]!.spentUtf8Bytes++;
  expect(() => assertNativeRootContinuityV1(before, after)).not.toThrow();
  expect(before.slots[0]!.spentUtf8Bytes).toBe(10);
  for (const mutate of [
    (x: NativeRootLedgerV1) => { x.origins = []; },
    (x: NativeRootLedgerV1) => { x.slots = []; },
    (x: NativeRootLedgerV1) => { x.rootAccountId = "copy-reset"; },
    (x: NativeRootLedgerV1) => { x.slots[0]!.capUtf8Bytes++; },
    (x: NativeRootLedgerV1) => { x.slots[0]!.spentUtf8Bytes--; },
    (x: NativeRootLedgerV1) => { x.revision--; },
  ]) {
    const changed = structuredClone(before); mutate(changed);
    expect(() => assertNativeRootContinuityV1(before, changed)).toThrow();
  }
});
test("RMSN- root origin replay is unchanged and duplicate identities are refused", () => {
  const ledger = nativeLedger();
  expect(() => assertNativeRootContinuityV1(ledger, structuredClone(ledger))).not.toThrow();
  const duplicate = structuredClone(ledger); duplicate.origins.push(structuredClone(duplicate.origins[0]!));
  expect(() => assertNativeRootContinuityV1(ledger, duplicate)).toThrow();
});

test("Engine preparation consumes v3 DATA without touching a runtime or store", () => {
  const f = fixture();
  // A poisoned receiver independently catches any accidental state access.
  const receiver = new Proxy({}, { get() { throw new Error("preparation touched engine state"); } });
  const result = Engine.prototype.prepareRuntime.call(receiver as Engine, { body: preparation(f), independentSources: f.independent, policy: f.policy });
  if (!result.ok) throw new Error(result.reasons.join(";"));
  const binding = verifyPreparedRuntimeV1(result.value);
  expect(binding.origin.kind).toBe("graph-v3-data");
  expect(binding.origin.stateOwner).toBe("generation-store-v3");
  expect(binding.nativeQualificationRef).toBeNull();
  expect(binding.knowledgeProjectionPolicyRef).toBeNull();
  const raw = Buffer.from(result.value.run.utf8, "utf8");
  expect(result.value.run.ref.byteLength).toBe(raw.length);
  expect(result.value.run.ref.sha256).toBe(createHash("sha256").update(raw).digest("hex"));
  const changed = structuredClone(result.value); changed.run.utf8 += " ";
  expect(() => verifyPreparedRuntimeV1(changed)).toThrow();
  const forged = readRuntimeDocumentV1(result.value.binding);
  forged.nativeQualificationRef = structuredClone(result.value.run.ref);
  changed.run = result.value.run; changed.binding = makeBoundDocumentV1("rms-runtime-binding-v1", forged);
  expect(() => verifyPreparedRuntimeV1(changed)).toThrow();
}, 15000);

test("unknown source versions and invented native terminality stay unusable", () => {
  expect(() => prepareRuntimeBindingV1(makeBoundDocumentV1("fake", { version: "l8-graph-run-v999" }))).toThrow();
  expect(() => refuseNativeRuntimeV1()).toThrow("native-unavailable");
}, 15000);
