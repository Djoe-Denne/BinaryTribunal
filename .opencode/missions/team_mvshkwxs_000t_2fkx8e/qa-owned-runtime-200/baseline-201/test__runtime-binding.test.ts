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
import { assertOwnedNpmHostProvenanceV1, ownedHostLiveFactsMatchV1, type OwnedNpmHostProvenanceV1 } from "../src/graph-runtime-binding";

function offlineOwnedProvenance(): OwnedNpmHostProvenanceV1 {
  const pin = (name: string) => ({ path: `C:/OFFLINE/${name}`, byteLength: 1, sha256: "a".repeat(64) });
  return { version: "rms-owned-npm-host-provenance-v1", runtime: { name: "bun", version: "1.4.2", executable: pin("bun.exe") },
    rawSource: { meaning: "PUBLISHED_NPM_SERVER_DISTRIBUTION_TARBALL", archive: pin("server.tgz") },
    closure: { archives: pin("archives.json"), installed: pin("installed.json"), archiveCount: 367, fileCount: 32227 },
    bootstrap: pin("bootstrap.mjs"), plan: pin("plan.json"),
    custodyPolicy: { version: "rms-owned-http-readonly-policy-v1", rawTargets: ["/api/info", "/openapi.json"], nativeOptions204: true, post: "DENY_ALL" } };
}
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
