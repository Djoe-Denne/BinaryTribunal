/** OFFLINE literals and intercepted HTTP only. Author has not executed these tests. */
import { expect, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Store } from "../../src/store";
import { GraphStore, type Admission, type WorkUnit } from "../../src/graph-store";
import type { Snapshot, InputBundle } from "../../src/domain";
import type { ControllerAuthority } from "../../src/unit-lease";
import { canonical, fingerprint } from "../../src/validation";
import { makeAtRestImageV1, type AtRestImageV1, type AtRestTransportV1 } from "../../src/graph-native-at-rest";
import { runNativeObservationDataV1, type NativeObservationTransportV1, type NativeObservationDataV1 } from "../../src/graph-native-observations";
import { bindOwnedNativeObservationTransportV1, nativeObservationTransportV1 } from "../../src/native-observation-transport";

const sha = (s: string) => createHash("sha256").update(s).digest("hex"); // independent oracle
const model = { providerID: "fixture", id: "offline", variant: "high" };
const request = { version: "rms-native-at-rest-request-v1" as const, server: { version: "2.1.4" as const, pid: 42 }, directory: "C:/offline-owned" };
const sample = () => makeAtRestImageV1({ missionId: "m", unitId: "unit", executionId: "exec", owner: "controller", controllerFence: 1, familyFence: 1, revision: 0, admissionDigest: "a".repeat(64) }, request,
  { profile: "offline", model, prompt: "offline", dossier: {}, metadata: {} });
const frame = (v: unknown) => `data: ${JSON.stringify(v)}\r\n\r\n`;
const marker = (i: AtRestImageV1, seq?: number) => ({ type: "log.synced", aggregateID: i.sessionId, ...(seq === undefined ? {} : { seq }) });
const event = (i: AtRestImageV1, seq: number, extra = "") => ({ id: `evt_offline_${seq}`, type: "session.execution.started", created: 1,
  durable: { aggregateID: i.sessionId, seq, version: 1 }, data: { sessionID: i.sessionId, metadata: extra } });
function sse(text: string, fragmented = false): Response {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream<Uint8Array>({ start(c) {
    if (fragmented) for (const b of bytes) c.enqueue(Uint8Array.of(b)); else c.enqueue(bytes); c.close();
  } }), { headers: { "content-type": "text/event-stream" } });
}
class Wire implements NativeObservationTransportV1 {
  calls: Array<string | number | null> = []; logText: string; tag = "user"; pid = 42; missing = false; fragmented = false;
  mutate: (() => void) | undefined;
  constructor(readonly image: AtRestImageV1) { this.logText = frame(marker(image, 9)); }
  async info(_s: AbortSignal) { this.calls.push("info"); return Response.json({ version: "2.1.4", pid: this.pid }); }
  async log(after: number | null, _s: AbortSignal) { this.calls.push(after); this.mutate?.(); return sse(this.logText, this.fragmented); }
  async message(_s: AbortSignal) { this.calls.push("message"); return this.missing ? new Response("SECRET refusal", { status: 404 }) : Response.json({ data: { id: this.image.messageId, type: this.tag, text: "SECRET user/tool/native metadata" } }); }
}
const run = (i: AtRestImageV1, w: Wire, check = () => {}, after: number | null = null, prior: NativeObservationDataV1["logItems"] = []) =>
  runNativeObservationDataV1(i, "a".repeat(64), "offline-attempt", after, prior, w, check);

test("OFFLINE fragmented UTF8/CRLF, exclusive gaps, duplicate and independent hashes", async () => {
  const i = sample(), w = new Wire(i); w.fragmented = true;
  const e = event(i, 0, "SECRET-λ"), second = event(i, 7);
  w.logText = `: comment\r\n\r\n${frame(e)}${frame(e)}${frame(second)}${frame(marker(i, 20))}`;
  const d = await run(i, w);
  expect(d.reason).toBe("OK"); expect(d.logComplete).toBe(true); expect(w.calls).toEqual(["info", null, "info", "message", "info"]);
  expect(d.logItems).toHaveLength(3); expect(d.logItems[0]).toMatchObject({ kind: "EVENT", seq: 0, eventIdSha256: sha(e.id),
    eventJsonSha256: sha(canonical({ domain: "native-event-v1", data: e })) });
  expect(d.io[1]!.wirePrefixSha256).toBe(sha(w.logText)); expect(JSON.stringify(d)).not.toContain("SECRET");
  expect(JSON.stringify(d)).not.toContain(e.id); expect(d.progressCommitted).toBe(false);
});
for (const tag of ["agent-switched", "model-switched", "location-switched", "user", "synthetic", "system", "skill", "shell", "assistant", "compaction", "idle"]) {
  test(`OFFLINE envelope projection only, ${tag}; no body qualification`, async () => {
    const i = sample(), w = new Wire(i); w.tag = tag;
    const d = await run(i, w); expect(d.message.nativeType).toBe(tag); expect(d.message.status).toBe("PRESENT");
    expect(Object.keys(d.message).sort()).toEqual(["messageJsonSha256", "nativeType", "status"]);
  });
}
test("empty watermark,404 and missing evidence stay distinct", async () => {
  const i = sample(), w = new Wire(i); w.logText = frame(marker(i)); w.missing = true;
  const d = await run(i, w); expect(d.reason).toBe("OK"); expect(d.logComplete).toBe(true); expect(d.logItems[0]!.seq).toBeNull(); expect(d.message.status).toBe("NOT_FOUND");
  expect((await run(i, w, () => {}, 1)).logComplete).toBe(false);
});
for (const mode of ["failure-after-marker", "unknown", "cut", "divergent", "foreign", "double-json", "unsafe-seq", "frame-limit", "byte-limit", "frame-count"] as const) {
  test(`incomplete old cursor: ${mode}`, async () => {
    const i = sample(), w = new Wire(i), e = event(i, 2);
    w.logText = mode === "failure-after-marker" ? frame(marker(i, 9)) + "event: effect/http-api/stream/failure\ndata: SECRET\n\n"
      : mode === "unknown" ? frame({ ...e, type: "session.UNKNOWN-SECRET" })
      : mode === "cut" ? frame(e) + "data: {"
      : mode === "divergent" ? frame(e) + frame({ ...e, created: 2 })
      : mode === "foreign" ? frame({ ...e, data: { sessionID: "ses_foreign_SECRET" } })
      : mode === "double-json" ? frame(JSON.stringify(marker(i, 9)))
      : mode === "unsafe-seq" ? frame(marker(i, Number.MAX_SAFE_INTEGER + 1))
      : mode === "frame-limit" ? ":" + "x".repeat(65537)
      : mode === "byte-limit" ? ": x\n\n".repeat(60000)
      : frame(marker(i, 9)).repeat(1025);
    const d = await run(i, w, () => {}, 1); expect(d.logComplete).toBe(false); expect(d.reason).not.toBe("OK");
    expect(d.afterCommitted).toBe(1); expect(d.progressCommitted).toBe(false); expect(JSON.stringify(d)).not.toContain("SECRET");
    expect(w.calls.includes("message")).toBe(false);
  });
}
test("revocation while log GET resolves forbids following GET; deadline does not wait for cancel", async () => {
  const i = sample(), w = new Wire(i); let revoked = false; w.mutate = () => { revoked = true; };
  const d = await run(i, w, () => { if (revoked) throw new Error("SECRET authority"); });
  expect(d.reason).toBe("REVOKED"); expect(w.calls).toEqual(["info", null]);
  expect((await runNativeObservationDataV1(i, "a".repeat(64), "attempt", null, [], w, () => {}, performance.now() - 1)).reason).toBe("DEADLINE");
});
test("final identity replacement never completes", async () => {
  const i = sample(), w = new Wire(i), info = w.info.bind(w); let count = 0;
  w.info = async s => { if (++count === 3) w.pid++; return info(s); };
  const d = await run(i, w); expect(d.reason).toBe("SERVICE_IDENTITY"); expect(d.logComplete).toBe(false);
});

// Same acquired graph fixture recipe as native-at-rest.test.ts, no import of test modules.
const fixture = (id: string): any => JSON.parse(readFileSync(join(import.meta.dir, "../fixtures/graph", id, "content.json"), "utf8"));
async function setup() {
  const path = join(mkdtempSync(join(process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Temp/opencode") : process.env.TEMP!, "rms-observation-offline-")), "own.db");
  const store = new Store(path); store.create({ schemaVersion: 1, missionId: "m", revision: 0, config: {}, status: "running", cycle: 1, stage: "explore", candidates: [], cycles: [], intents: [], reconciliations: [], noProgressCycles: 0 } as unknown as Snapshot);
  const authority: ControllerAuthority = { lease: store.acquireLease("m", "controller", 10, 100000), now: 11 }; let graph = new GraphStore(path);
  const snapshot = fixture("communities-obvious"); snapshot.missionId = "m";
  const partition = fixture("hub-external-context"); partition.snapshotId = snapshot.snapshotId; partition.snapshotFingerprint = snapshot.normalizedFingerprint;
  partition.communities = [{ ...partition.communities[0], memberIds: snapshot.nodes.map((n: any) => n.id), kernelIds: [snapshot.nodes[0].id], externalContextIds: [] }];
  graph.putSnapshot(authority, snapshot); graph.putPartition(authority, partition);
  const u = fixture("work-unit-aggregate") as WorkUnit, node = snapshot.nodes[0];
  const unit: WorkUnit = { ...u, unitId: "unit", snapshotId: snapshot.snapshotId, partitionId: partition.partitionId, knowledgeRevision: 1,
    ownedFunctionIds: [node.id], contextFunctionIds: [], requiredPublicationLevel: 1, state: "READY", conflicts: [], prerequisites: [],
    subIntents: u.subIntents.slice(0, 3).map(s => ({ ...s, subIntentId: `unit:${s.role}`, functionId: node.id, harnessIdentity: { sha256: node.moduleSha256, version: "fixture-v1", ea: node.ea }, waitsForSubIntentIds: s.role === "R" ? ["unit:A", "unit:B"] : [] })) };
  graph.addUnit(authority, unit);
  const plan = fixture("plan-scc-cycle"); Object.assign(plan, { planId: "plan:observation:1", missionId: "m", snapshotId: unit.snapshotId, partitionId: unit.partitionId, knowledgeRevision: 1,
    units: [{ unitId: unit.unitId, ownedFunctionIds: unit.ownedFunctionIds, contextFunctionIds: [], requiredPublicationLevel: 1, state: "READY", contextEnvelopeUtf8Bytes: { known: true, value: 4096 } }], prerequisites: [], g1Edges: [], g2Conflicts: [], g3Affinities: [], sccs: [], selectedUnitIds: [unit.unitId], decisions: [{ id: "decision:unit", unitId: unit.unitId, action: "include", reason: "offline frozen fixture" }] });
  const { fingerprint: _fp, ...pc } = plan; plan.fingerprint = fingerprint(pc); const { state: _state, ...uc } = unit;
  const sidecar = { schemaVersion: 1 as const, planId: plan.planId, planFingerprint: plan.fingerprint, snapshotFingerprint: snapshot.normalizedFingerprint, knowledgeRevision: 1, policyVersion: plan.policyVersion, estimationVersion: plan.estimationVersion, policy: { version: plan.policyVersion }, unitFingerprints: { unit: fingerprint(uc) }, envelopeBytesByUnit: { unit: 4096 }, requirementById: {}, dispensationById: {}, externalReceiptById: {}, diagnostics: [] };
  const full = { ...sidecar, fingerprint: fingerprint(sidecar) }, binding = { schemaVersion: 1 as const, planFingerprint: plan.fingerprint, sidecarFingerprint: full.fingerprint };
  graph.freezePlan(authority, plan, full, { ...binding, fingerprint: fingerprint(binding) });
  const lease = graph.reserve(authority, unit.unitId, 1000, graph.reservationExpectation("m")), sub = unit.subIntents.find(s => s.role === "A")!;
  const inputs: InputBundle = { schemaVersion: 1, role: "A", cycle: 1, identity: sub.harnessIdentity, files: [], accessibleRules: [], requiredTools: [], knowledge: { version: "fixture-known-inputs-v1", fingerprint: fingerprint("fixture-known-inputs"), leadsFingerprint: fingerprint([]), files: [] } };
  graph.freezeAdmissionInputs(authority, lease, sub.subIntentId, inputs);
  const executionId = "exec:observation", attemptId = "attempt:observation", header = { schemaVersion: 1, missionId: "m", taskId: "task:observation", executionId, attemptId, cycle: 1, authorId: executionId, identity: sub.harnessIdentity, inputFingerprint: fingerprint(inputs), inputVersions: [], previousResultIds: [] };
  const admission: Admission = { executionId, attemptId, role: "A", subIntentId: sub.subIntentId, idempotencyKey: executionId, command: { taskId: header.taskId, executionId, attemptId, idempotencyKey: executionId, profile: "fixture-worker", model, prompt: "Offline only", dossier: { version: 1, functionId: sub.functionId, function: sub.harnessIdentity, role: "A", cycle: 1, effectiveModel: model, inputs, resultHeader: header }, metadata: { inputFingerprint: fingerprint(inputs) }, context: { mode: "fresh" }, worktree: false, requiredAccess: [] } };
  expect(new TextEncoder().encode(canonical(admission)).length).toBeLessThanOrEqual(4096); graph.prepareAdmission(authority, lease, admission);
  let session: any, inbox: any[] = [];
  const admissionWire: AtRestTransportV1 = { info: async () => ({ version: "2.1.4", pid: 42 }), getSession: async () => session ?? null, getInbox: async () => inbox,
    create: async b => session = structuredClone(b), prompt: async (id, b: any) => { inbox = [{ id: b.id, sessionID: id, type: "user", delivery: "queue", payload: { text: b.text, metadata: b.metadata } }]; return inbox[0]; } };
  const current = () => ({ ...authority, now: Math.max(authority.now, graph.events.cursor("m").time) });
  await graph.admitNativeAtRestV1(current, lease, executionId, request, admissionWire);
  const image = graph.events.read("m").find(e => e.kind === "rms.native-at-rest.image")!.payload as AtRestImageV1;
  return { store, image, lease, authority, executionId, get graph() { return graph; }, current,
    read: (w: NativeObservationTransportV1) => graph.observeNativeAtRestDataV1(current, lease, executionId, w),
    reopen() { graph.close(); graph = new GraphStore(path); }, close() { graph.close(); store.close(); } };
}
test("OWN journal/reopen/exclusive cursor, no outbox/claim/cycle effect", async () => {
  const s = await setup(); try {
    const w = new Wire(s.image), before = s.store.load("m"), outbox = s.graph.admission(s.executionId);
    const claims = s.graph.db.query("SELECT * FROM ff8_unit_claims").all();
    expect((await s.read(w)).afterCommitted).toBe(9); s.reopen();
    expect((await s.read(w)).progressCommitted).toBe(true); expect(w.calls).toContain(9);
    expect(s.store.load("m")).toEqual(before); expect(s.graph.admission(s.executionId)).toEqual(outbox);
    expect(s.graph.db.query("SELECT * FROM ff8_unit_claims").all()).toEqual(claims); expect(s.graph.unit("m", "unit").state).toBe("RESERVED");
    expect(JSON.stringify(s.graph.events.read("m"))).not.toContain("SECRET");
    await expect(s.graph.dispatch(s.current(), s.lease, s.executionId, { submit: async () => { throw new Error("must not execute"); } })).rejects.toThrow("at-rest DATA");
  } finally { s.close(); }
});
test("OWN revocation retains late DATA with old cursor and forbids subsequent reads", async () => {
  const s = await setup(); try {
    const w = new Wire(s.image); w.mutate = () => s.graph.db.query("UPDATE ff8_missions SET lease_token=lease_token+1 WHERE id='m'").run();
    const d = await s.read(w); expect(d.reason).toBe("REVOKED"); expect(d.afterCommitted).toBeNull(); expect(d.progressCommitted).toBe(false);
    expect(w.calls).toEqual(["info", null]); expect(s.graph.events.read("m").some(e => e.kind === "rms.native-observation.result")).toBe(true);
    await expect(s.read(w)).rejects.toThrow(); expect(w.calls).toEqual(["info", null]);
  } finally { s.close(); }
});
test("native port remains inert and injected binder gets no private guard", async () => {
  const p = nativeObservationTransportV1(); await expect(p.info(new AbortController().signal)).rejects.toThrow("OWN binding");
  expect(() => bindOwnedNativeObservationTransportV1(p, () => {}, sample())).toThrow("OWN binding");
  const s = await setup(); try {
    const w = new Wire(s.image); Object.defineProperty(w, "bindCurrent", { get() { throw new Error("SECRET binder must not be read"); } });
    expect((await s.read(w)).progressCommitted).toBe(true);
  } finally { s.close(); }
});
test("actual GET adapter uses retained paths, one operation signal and final identity", async () => {
  const s = await setup(), { Service } = await import("@opencode/client/service");
  const discover = spyOn(Service, "discover").mockResolvedValue({ url: "http://offline.invalid" } as any), headers = spyOn(Service, "headers").mockReturnValue({ authorization: "SECRET credential" });
  const paths: string[] = [], signals: unknown[] = [];
  const http = spyOn(globalThis, "fetch").mockImplementation((async (input: any, init?: RequestInit) => {
    const u = new URL(String(input)); paths.push(u.pathname + u.search); signals.push(init?.signal);
    expect(u.origin).toBe("http://offline.invalid"); expect(init?.method).toBe("GET"); expect(init?.redirect).toBe("error"); expect(init?.body).toBeUndefined();
    if (u.pathname === "/api/info") return Response.json({ version: "2.1.4", pid: 42 });
    if (u.pathname === `/api/experimental/session/${s.image.sessionId}/log`) { expect(u.search).toBe("?follow=false"); return sse(frame(marker(s.image, 10))); }
    expect(u.pathname).toBe(`/api/session/${s.image.sessionId}/message/${s.image.messageId}`); return Response.json({ data: { id: s.image.messageId, type: "user", metadata: "SECRET" } });
  }) as unknown as typeof fetch);
  try { expect((await s.read(nativeObservationTransportV1())).afterCommitted).toBe(10); expect(paths).toHaveLength(5); expect(new Set(signals).size).toBe(1); expect(JSON.stringify(s.graph.events.read("m"))).not.toContain("SECRET"); }
  finally { http.mockRestore(); headers.mockRestore(); discover.mockRestore(); s.close(); }
});
test("post-append event TTL refuses progress atomically", async () => {
  const s = await setup(); try {
    const before = s.graph.events.cursor("m").sequence;
    s.graph.db.query("UPDATE ff8_unit_leases SET expires_event=? WHERE mission='m' AND unit_id='unit'").run(before + 2);
    const d = await s.read(new Wire(s.image)); expect(d.progressCommitted).toBe(false); expect(d.afterCommitted).toBeNull();
    expect(s.graph.events.read("m").filter(e => e.kind === "rms.native-observation.result").every(e => !(e.payload as NativeObservationDataV1).progressCommitted)).toBe(true);
  } finally { s.close(); }
});
test("concurrent completions CAS their original cursor; stale result cannot regress it", async () => {
  const s = await setup(); let release!: () => void, entered!: () => void;
  const ready = new Promise<void>(r => entered = r), held = new Promise<void>(r => release = r);
  try {
    const slow = new Wire(s.image), fast = new Wire(s.image), original = slow.log.bind(slow);
    slow.log = async (after, signal) => { entered(); await held; return original(after, signal); };
    const pending = s.read(slow); await ready;
    fast.logText = frame(marker(s.image, 20)); expect((await s.read(fast)).afterCommitted).toBe(20);
    release(); const stale = await pending; expect(stale.progressCommitted).toBe(false); expect(stale.afterCommitted).toBeNull();
    s.reopen(); const next = new Wire(s.image); next.logText = frame(marker(s.image, 20));
    expect((await s.read(next)).afterCommitted).toBe(20); expect(next.calls).toContain(20);
  } finally { release?.(); s.close(); }
});
test("orphan BEGIN and incomplete prefix reopen without skipping; divergent replay refuses", async () => {
  const s = await setup(); try {
    const c = s.graph.events.cursor("m");
    s.graph.events.append("m", "offline-orphan", "rms.native-observation.begin", c.time,
      { version: "rms-native-observation-begin-v1", imageDigest: fingerprint(s.image), after: null, cursorKey: null }, "unit", c.sequence);
    s.reopen(); const first = new Wire(s.image), e = event(s.image, 0, "SECRET-prefix"); first.logText = frame(e) + "data: {";
    expect((await s.read(first)).afterCommitted).toBeNull(); s.reopen();
    const retry = new Wire(s.image); retry.logText = frame(e) + frame(marker(s.image, 4));
    expect((await s.read(retry)).afterCommitted).toBe(4); expect(retry.calls).toContain(null);
    const conflict = new Wire(s.image); conflict.logText = frame({ ...e, created: 9 }) + frame(marker(s.image, 4));
    const d = await s.read(conflict); expect(d.reason).toBe("DIVERGENT_EVENT"); expect(d.afterCommitted).toBe(4);
  } finally { s.close(); }
});
test("discovery finishing after deadline cannot issue GET; noncooperative cancel is not awaited", async () => {
  const s = await setup(), { Service } = await import("@opencode/client/service");
  let finish!: (v: any) => void;
  const discovery = new Promise<any>(r => finish = r);
  const discover = spyOn(Service, "discover").mockImplementation(() => discovery);
  const originalTimer = globalThis.setTimeout;
  const timer = spyOn(globalThis, "setTimeout").mockImplementation(((fn: (...args: any[]) => void, delay?: number) => {
    expect(delay).toBeLessThanOrEqual(10000); return originalTimer(fn, 1);
  }) as typeof setTimeout);
  const http = spyOn(globalThis, "fetch").mockImplementation((async () => { throw new Error("must not GET"); }) as unknown as typeof fetch);
  try {
    const d = await s.read(nativeObservationTransportV1()); expect(d.reason).toBe("DEADLINE"); expect(d.progressCommitted).toBe(false);
    finish({ url: "http://offline.invalid" }); await Promise.resolve(); await Promise.resolve(); expect(http).not.toHaveBeenCalled();
  } finally { finish?.(undefined); timer.mockRestore(); http.mockRestore(); discover.mockRestore(); s.close(); }
  const i = sample(), w = new Wire(i); let cancelled = false;
  w.info = async () => new Response(new ReadableStream({ cancel() { cancelled = true; return new Promise<void>(() => {}); } }), { headers: { "content-type": "wrong" } });
  expect((await run(i, w)).reason).toBe("BAD_MIME"); expect(cancelled).toBe(true);
});
