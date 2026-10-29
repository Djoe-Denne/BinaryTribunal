/** Offline injected wire only. No driver/threads, native transport, CLI or science replay. */
import { expect, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Store } from "../../src/store";
import { GraphStore, type Admission, type WorkUnit } from "../../src/graph-store";
import type { Snapshot, InputBundle } from "../../src/domain";
import type { ControllerAuthority } from "../../src/unit-lease";
import { canonical, fingerprint } from "../../src/validation";
import { compareAtRestInboxV1, compareAtRestSessionV1, makeAtRestImageV1, ReceivedAtRestResponseErrorV1, type AtRestImageV1, type AtRestRequestV1, type AtRestTransportV1 } from "../../src/graph-native-at-rest";
import { bindOwnedAtRestTransportV1, nativeAtRestTransportV1 } from "../../src/native-at-rest-transport";

const request: AtRestRequestV1 = { version: "rms-native-at-rest-request-v1", server: { version: "2.1.4", pid: 42 }, directory: "C:/offline-owned" };
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const fixture = (id: string): any => JSON.parse(readFileSync(join(import.meta.dir, "../fixtures/graph", id, "content.json"), "utf8"));
class Wire implements AtRestTransportV1 {
  session: any = null; inbox: any[] = []; creates = 0; prompts = 0; calls: string[] = [];
  lose = ""; mutate: ((wire: Wire) => void) | undefined; pid = 42;
  async info() { this.calls.push("info"); return { version: "2.1.4", pid: this.pid }; }
  async getSession(_id: string) { this.calls.push("getSession"); return structuredClone(this.session); }
  async getInbox(_id: string) { this.calls.push("getInbox"); return structuredClone(this.inbox); }
  async create(body: Record<string, any>) {
    this.calls.push("create"); this.creates++; this.session ??= structuredClone(body);
    this.mutate?.(this);
    if (this.lose === "create") { this.lose = ""; throw new Error("SECRET credential/body must not reach SQLite"); }
    return structuredClone(this.session); // deliberately ignores divergent duplicate bodies
  }
  async prompt(id: string, body: Record<string, any>) {
    this.calls.push("prompt"); this.prompts++;
    expect(body.resume).toBe(false); expect(body.delivery).toBe("queue");
    if (!this.inbox.length) this.inbox.push({ id: body.id, sessionID: id, type: "user", delivery: "queue", payload: { text: body.text, metadata: body.metadata } });
    this.mutate?.(this);
    if (this.lose === "prompt") { this.lose = ""; throw new Error("SECRET credential/body must not reach SQLite"); }
    return structuredClone(this.inbox[0]);
  }
}
function setup() {
  // Retained OWN evidence, not an existing database and no recursive cleanup.
  const path = join(mkdtempSync(join(process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Temp/opencode") : process.env.TEMP!, "rms-at-rest-offline-")), "own.db");
  const store = new Store(path);
  store.create({ schemaVersion: 1, missionId: "m", revision: 0, config: {}, status: "running", cycle: 1, stage: "explore", candidates: [], cycles: [], intents: [], reconciliations: [], noProgressCycles: 0 } as unknown as Snapshot);
  const authority: ControllerAuthority = { lease: store.acquireLease("m", "controller", 10, 100000), now: 11 };
  let graph = new GraphStore(path);
  const snapshot = fixture("communities-obvious"); snapshot.missionId = "m";
  const partition = fixture("hub-external-context"); partition.snapshotId = snapshot.snapshotId; partition.snapshotFingerprint = snapshot.normalizedFingerprint;
  partition.communities = [{ ...partition.communities[0], memberIds: snapshot.nodes.map((n: any) => n.id), kernelIds: [snapshot.nodes[0].id], externalContextIds: [] }];
  graph.putSnapshot(authority, snapshot); graph.putPartition(authority, partition);
  const u = fixture("work-unit-aggregate") as WorkUnit, node = snapshot.nodes[0];
  const unit: WorkUnit = { ...u, unitId: "unit", snapshotId: snapshot.snapshotId, partitionId: partition.partitionId, knowledgeRevision: 1,
    ownedFunctionIds: [node.id], contextFunctionIds: [], requiredPublicationLevel: 1, state: "READY", conflicts: [], prerequisites: [],
    subIntents: u.subIntents.slice(0, 3).map(s => ({ ...s, subIntentId: `unit:${s.role}`, functionId: node.id,
      harnessIdentity: { sha256: node.moduleSha256, version: "fixture-v1", ea: node.ea }, waitsForSubIntentIds: s.role === "R" ? ["unit:A", "unit:B"] : [] })) };
  graph.addUnit(authority, unit);
  const plan = fixture("plan-scc-cycle");
  // Same 4096-byte synthetic envelope as eventlog.test.ts freeze()/body().
  // Preserve the acquired fixture's 8000-byte ceiling; check the actual body below.
  const envelopeBytes = 4096;
  expect(envelopeBytes).toBeLessThanOrEqual(plan.budgets.contextEnvelopeMaxUtf8Bytes);
  Object.assign(plan, { planId: "plan:at-rest:1", missionId: "m", snapshotId: unit.snapshotId, partitionId: unit.partitionId, knowledgeRevision: 1,
    units: [{ unitId: unit.unitId, ownedFunctionIds: unit.ownedFunctionIds, contextFunctionIds: [], requiredPublicationLevel: 1, state: "READY", contextEnvelopeUtf8Bytes: { known: true, value: envelopeBytes } }],
    prerequisites: [], g1Edges: [], g2Conflicts: [], g3Affinities: [], sccs: [], selectedUnitIds: [unit.unitId], decisions: [{ id: "decision:unit", unitId: unit.unitId, action: "include", reason: "offline frozen fixture" }] });
  const { fingerprint: _fp, ...planContent } = plan; plan.fingerprint = fingerprint(planContent);
  const { state: _state, ...unitContent } = unit;
  const sidecar = { schemaVersion: 1 as const, planId: plan.planId, planFingerprint: plan.fingerprint, snapshotFingerprint: snapshot.normalizedFingerprint,
    knowledgeRevision: 1, policyVersion: plan.policyVersion, estimationVersion: plan.estimationVersion, policy: { version: plan.policyVersion },
    unitFingerprints: { unit: fingerprint(unitContent) }, envelopeBytesByUnit: { unit: envelopeBytes }, requirementById: {}, dispensationById: {}, externalReceiptById: {}, diagnostics: [] };
  const fullSidecar = { ...sidecar, fingerprint: fingerprint(sidecar) }, binding = { schemaVersion: 1 as const, planFingerprint: plan.fingerprint, sidecarFingerprint: fullSidecar.fingerprint };
  graph.freezePlan(authority, plan, fullSidecar, { ...binding, fingerprint: fingerprint(binding) });
  const lease = graph.reserve(authority, unit.unitId, 1000, graph.reservationExpectation("m"));
  const sub = unit.subIntents.find(s => s.role === "A")!;
  const inputs: InputBundle = { schemaVersion: 1, role: "A", cycle: 1, identity: sub.harnessIdentity, files: [], accessibleRules: [], requiredTools: [],
    knowledge: { version: "fixture-known-inputs-v1", fingerprint: fingerprint("fixture-known-inputs"), leadsFingerprint: fingerprint([]), files: [] } };
  graph.freezeAdmissionInputs(authority, lease, sub.subIntentId, inputs);
  const model = { providerID: "fixture", id: "local", variant: "high" }, executionId = "exec:at-rest", attemptId = "attempt:at-rest";
  const header = { schemaVersion: 1, missionId: "m", taskId: "task:at-rest", executionId, attemptId, cycle: 1, authorId: executionId,
    identity: sub.harnessIdentity, inputFingerprint: fingerprint(inputs), inputVersions: [], previousResultIds: [] };
  const admission: Admission = { executionId, attemptId, role: "A", subIntentId: sub.subIntentId, idempotencyKey: executionId,
    command: { taskId: header.taskId, executionId, attemptId, idempotencyKey: executionId, profile: "fixture-worker", model, prompt: "Offline text only",
      dossier: { version: 1, functionId: sub.functionId, function: sub.harnessIdentity, role: "A", cycle: 1, effectiveModel: model, inputs, resultHeader: header },
      metadata: { inputFingerprint: fingerprint(inputs) }, context: { mode: "fresh" }, worktree: false, requiredAccess: [] } };
  expect(new TextEncoder().encode(canonical(admission)).byteLength).toBeLessThanOrEqual(envelopeBytes);
  graph.prepareAdmission(authority, lease, admission);
  return { path, store, authority, lease, executionId, admission, get graph() { return graph; },
    run: (wire: AtRestTransportV1, r = request) => graph.admitNativeAtRestV1(() => ({ ...authority, now: Math.max(authority.now, graph.events.cursor("m").time) }), lease, executionId, r, wire),
    image: () => graph.events.read("m").find(e => e.kind === "rms.native-at-rest.image")!.payload as AtRestImageV1,
    reopen() { graph.close(); graph = new GraphStore(path); }, close() { graph.close(); store.close(); } };
}

test("OWN at-rest retention/reopen/exact retry: no execution receipt, no second native effect", async () => {
  const s = setup(), wire = new Wire(); try {
    const before = s.store.load("m"), first = await s.run(wire), image = s.image();
    expect(first.status).toBe("ADMITTED_AT_REST_ONLY"); expect(first.nativeQualificationRef).toBeNull(); expect(first.executionReceipt).toBeNull();
    expect(image.createSha256).toBe(sha(image.createUtf8)); expect(image.promptSha256).toBe(sha(image.promptUtf8));
    expect(s.graph.admission(s.executionId)?.receipt).toBeNull(); expect(s.graph.unit("m", "unit").state).toBe("RESERVED");
    expect(s.store.load("m")).toEqual(before);
    s.reopen(); expect(await s.run(wire)).toEqual(first); expect(s.image()).toEqual(image);
    expect(wire.creates).toBe(1); expect(wire.prompts).toBe(1);
    await expect(s.run(wire, { ...request, directory: "C:/different" })).rejects.toThrow();
    await expect(s.graph.dispatch(s.authority, s.lease, s.executionId, { submit: async () => { throw new Error("must not execute"); } })).rejects.toThrow("at-rest DATA");
  } finally { s.close(); }
});
for (const phase of ["create", "prompt"]) test(`lost ${phase} response reconciles same OWN identities after reopen`, async () => {
  const s = setup(), wire = new Wire(); wire.lose = phase; try {
    await expect(s.run(wire)).rejects.toThrow("response unknown"); const image = s.image(); s.reopen();
    const result = await s.run(wire); expect(result.sessionId).toBe(image.sessionId); expect(result.messageId).toBe(image.messageId);
    expect(wire.creates).toBe(1); expect(wire.prompts).toBe(1);
    expect(JSON.stringify(s.graph.events.read("m"))).not.toContain("SECRET");
  } finally { s.close(); }
});
test("concurrent calls arbitrate effects, never allocate another image", async () => {
  const s = setup(), wire = new Wire(); try {
    const outcomes = await Promise.allSettled([s.run(wire), s.run(wire)]);
    expect(outcomes.some(o => o.status === "fulfilled")).toBe(true);
    expect(wire.creates).toBe(1); expect(wire.prompts).toBe(1);
    expect(s.graph.events.read("m").filter(e => e.kind === "rms.native-at-rest.image")).toHaveLength(1);
  } finally { s.close(); }
});
test("fence lost during POST keeps hashed late fact, never sends next effect", async () => {
  const s = setup(), wire = new Wire(); wire.mutate = () => { s.graph.db.query("UPDATE ff8_missions SET lease_token=lease_token+1 WHERE id='m'").run(); };
  try {
    await expect(s.run(wire)).rejects.toThrow(); expect(wire.creates).toBe(1); expect(wire.prompts).toBe(0);
    const facts = s.graph.events.read("m").filter(e => e.kind === "rms.native-at-rest.observation").map(e => e.payload as any);
    expect(facts.some(f => f.phase === "create" && !f.authorityCurrentBeforeAppend && /^[a-f0-9]{64}$/.test(f.responseSha256))).toBe(true);
    expect(s.graph.admission(s.executionId)?.receipt).toBeNull();
  } finally { s.close(); }
});
test("consumed/absent inbox never resends a claimed prompt or changes identity", async () => {
  const s = setup(), wire = new Wire(); try {
    await s.run(wire); const image = s.image(); wire.inbox = [];
    await expect(s.run(wire)).rejects.toThrow(); expect(wire.prompts).toBe(1); expect(s.image()).toEqual(image);
    wire.session = null; await expect(s.run(wire)).rejects.toThrow(); expect(wire.creates).toBe(1);
  } finally { s.close(); }
});
for (const field of ["model", "permissions", "location", "agent", "metadata", "parentID"]) test(`native session ${field} collision refuses before prompt`, async () => {
  const s = setup(), wire = new Wire(); wire.mutate = w => { w.session[field] = field === "parentID" ? "foreign-parent" : { divergent: true }; };
  try { await expect(s.run(wire)).rejects.toThrow(); expect(wire.prompts).toBe(0); } finally { s.close(); }
});
test("server replaced, imported family and expired clock refuse without effect", async () => {
  const s = setup(), wire = new Wire(); try {
    wire.pid++; await expect(s.run(wire)).rejects.toThrow(); expect(wire.creates).toBe(0);
    await expect(s.graph.admitNativeAtRestV1(() => s.authority, { ...s.lease, owner: "imported" }, s.executionId, request, wire)).rejects.toThrow();
    s.authority.now = s.authority.lease.expiresAt; await expect(s.run(wire)).rejects.toThrow(); expect(wire.creates).toBe(0);
  } finally { s.close(); }
});
test("post-append TTL exhaustion rolls reservation back before transport", async () => {
  const s = setup(), wire = new Wire(); try {
    s.graph.db.query("UPDATE ff8_unit_leases SET expires_event=? WHERE mission='m' AND unit_id='unit'").run(s.graph.events.cursor("m").sequence + 1);
    await expect(s.run(wire)).rejects.toThrow(); expect(wire.calls).toHaveLength(0);
    expect(s.graph.events.read("m").filter(e => e.kind === "rms.native-at-rest.image")).toHaveLength(0);
  } finally { s.close(); }
});
test("closed wire DTOs reject wake and unqualified attachments; full message payload compared", () => {
  const s = setup(); try {
    const scope: AtRestImageV1["scope"] = { missionId: "m", unitId: "unit", executionId: s.executionId, owner: "controller", controllerFence: 1, familyFence: 1, revision: 0, admissionDigest: "a".repeat(64) };
    for (const extra of [{ resume: true }, { files: [] }, { agents: [] }, { skills: [] }]) expect(() => makeAtRestImageV1(scope, request, { ...s.admission.command, ...extra })).toThrow();
    const image = makeAtRestImageV1(scope, request, s.admission.command);
    const session = JSON.parse(image.createUtf8); compareAtRestSessionV1(image, session);
    expect(() => compareAtRestSessionV1(image, { ...session, authority: "unexpected" })).toThrow();
    const prompt = JSON.parse(image.promptUtf8), item = { id: image.messageId, sessionID: image.sessionId, type: "user", delivery: "queue", payload: { text: prompt.text, metadata: prompt.metadata } };
    expect(compareAtRestInboxV1(image, [item])).toBe(true);
    for (const payload of [{ ...item.payload, text: "different" }, { ...item.payload, metadata: {} }, { ...item.payload, files: [] }]) expect(() => compareAtRestInboxV1(image, [{ ...item, payload }])).toThrow();
    expect(JSON.parse(image.promptUtf8).resume).toBe(false);
  } finally { s.close(); }
});
test("native transport is inert until an OWN operation binds its current-authority guard", async () => {
  const port = nativeAtRestTransportV1();
  for (const call of [() => port.info(), () => port.getSession("ses_foreign"), () => port.create({}), () => port.prompt("ses_foreign", { resume: true })]) {
    await expect(call()).rejects.toThrow("OWN operation binding required");
  }
  // Even a public callback/factory is not an OWN authority capability.
  expect(() => bindOwnedAtRestTransportV1(port, () => {}, {} as AtRestImageV1)).toThrow("OWN operation binding required");
});

test("hostile injected binder never receives a guard or unlocks registered native port", async () => {
  const s = setup(), wire = new Wire(); let binderReads = 0;
  Object.defineProperty(wire, "bindCurrent", { get() { binderReads++; throw new Error("must never read injected binder"); } });
  try {
    expect((await s.run(wire)).status).toBe("ADMITTED_AT_REST_ONLY"); expect(binderReads).toBe(0);
    await expect(nativeAtRestTransportV1().create(JSON.parse(s.image().createUtf8))).rejects.toThrow("OWN operation binding required");
  } finally { s.close(); }
});

/** Real adapter, existing SDK discovery/auth mocked, all HTTP intercepted locally.
 * No new test capability and no alternate product transport constructor. */
async function withHttp(wire: Wire, action: (frames: Array<{ path: string; method: string; init: RequestInit }>) => Promise<void>, abortInfo = false, afterCreateJson?: () => void, refuseInfo = false) {
  const { Service } = await import("@opencode/client/service");
  const frames: Array<{ path: string; method: string; init: RequestInit }> = [];
  const discover = spyOn(Service, "discover").mockResolvedValue({ url: "http://offline.invalid" } as any);
  const headers = spyOn(Service, "headers").mockReturnValue({ authorization: "SECRET-test-credential" });
  const timeout = spyOn(AbortSignal, "timeout");
  // Bun's typeof fetch also carries static helpers (e.g. preconnect). This double
  // replaces only its callable HTTP entry, never those helpers or product types.
  const http = spyOn(globalThis, "fetch").mockImplementation((async (input: any, init?: RequestInit) => {
    const url = new URL(String(input));
    expect(url.origin).toBe("http://offline.invalid");
    expect(init?.redirect).toBe("error"); expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect((init!.signal as AbortSignal & { aborted: boolean }).aborted).toBe(false);
    const method = init?.method ?? "GET", path = url.pathname; frames.push({ path, method, init: init! });
    if (path === "/api/info") {
      if (abortInfo) throw new DOMException("simulated timeout/abandon", "AbortError");
      if (refuseInfo) return new Response("SECRET-HTTP-REFUSAL", { status: 403 });
      return Response.json(await wire.info());
    }
    const match = /^\/api\/session\/(ses_rmsat_[a-f0-9]{32})(\/inbox|\/prompt)?$/.exec(path);
    if (method === "POST" && path === "/api/session") {
      const response = Response.json(await wire.create(JSON.parse(String(init?.body))));
      if (afterCreateJson) {
        const json = response.json.bind(response);
        response.json = async () => { const value = await json(); afterCreateJson(); return value; };
      }
      return response;
    }
    if (!match) throw new Error("unapproved HTTP path");
    if (method === "GET" && match[2] === "/inbox") return Response.json(await wire.getInbox(match[1]!));
    if (method === "GET" && !match[2]) {
      const result = await wire.getSession(match[1]!); return Response.json(result, { status: result === null ? 404 : 200 });
    }
    if (method === "POST" && match[2] === "/prompt") return Response.json(await wire.prompt(match[1]!, JSON.parse(String(init?.body))));
    throw new Error("unapproved HTTP method");
  }) as unknown as typeof fetch);
  try { await action(frames); expect(timeout.mock.calls.length).toBeGreaterThan(0); expect(timeout.mock.calls.every(call => call[0] === 20000)).toBe(true); }
  finally { http.mockRestore(); timeout.mockRestore(); headers.mockRestore(); discover.mockRestore(); }
}

test("actual adapter uses bounded redirect-error HTTP identity and retained exact session/message images", async () => {
  const s = setup(), wire = new Wire();
  try { await withHttp(wire, async frames => {
    const result = await s.run(nativeAtRestTransportV1()), image = s.image();
    expect(result.status).toBe("ADMITTED_AT_REST_ONLY");
    const writes = frames.filter(f => f.method === "POST"); expect(writes).toHaveLength(2);
    expect(String(writes[0]!.init.body)).toBe(image.createUtf8); expect(String(writes[1]!.init.body)).toBe(image.promptUtf8);
    expect(writes[1]!.path).toBe(`/api/session/${image.sessionId}/prompt`);
    expect(frames.filter(f => f.path === "/api/info").length).toBeGreaterThan(0);
    expect(JSON.stringify(s.graph.events.read("m"))).not.toContain("SECRET-test-credential");
  }); } finally { s.close(); }
});

for (const stage of ["fetch", "json"] as const) test(`actual adapter retains received create digest after ${stage} revocation without later POST`, async () => {
  const s = setup(), wire = new Wire();
  const revoke = () => { s.graph.db.query("UPDATE ff8_missions SET lease_token=lease_token+1 WHERE id='m'").run(); };
  if (stage === "fetch") wire.mutate = revoke;
  try { await withHttp(wire, async frames => {
    await expect(s.run(nativeAtRestTransportV1())).rejects.toThrow();
    expect(frames.filter(f => f.method === "POST")).toHaveLength(1);
    const facts = s.graph.events.read("m").filter(e => e.kind === "rms.native-at-rest.observation").map(e => e.payload as any);
    expect(facts.some(f => f.phase === "create" && f.outcome === "response-received" && !f.authorityCurrentBeforeAppend
      && f.responseSha256 === sha(canonical(wire.session)))).toBe(true);
    expect(JSON.stringify(facts)).not.toContain("SECRET-test-credential");
  }, false, stage === "json" ? revoke : undefined); } finally { s.close(); }
});

for (const mode of ["abandon", "different-identity"] as const) test(`actual adapter identity ${mode} refuses before POST with bounded HTTP options`, async () => {
  const s = setup(), wire = new Wire(); if (mode === "different-identity") wire.pid++;
  try { await withHttp(wire, async frames => {
    await expect(s.run(nativeAtRestTransportV1())).rejects.toThrow();
    expect(frames).toHaveLength(1); expect(frames[0]!.path).toBe("/api/info");
    expect(frames.some(f => f.method === "POST")).toBe(false);
  }, mode === "abandon"); } finally { s.close(); }
});

for (const mode of ["malformed", "throwing-getter", "throwing-prototype"] as const) test(`injected received-response ${mode} cannot persist raw exception data`, async () => {
  const s = setup(), wire = new Wire(); let captures = 0;
  let error: unknown = new ReceivedAtRestResponseErrorV1("SECRET-demo");
  if (mode === "malformed") Object.defineProperty(error, "responseSha256", { get() { captures++; return "SECRET-demo"; } });
  if (mode === "throwing-getter") Object.defineProperty(error, "responseSha256", { get() { captures++; throw new Error("SECRET-getter"); } });
  if (mode === "throwing-prototype") error = new Proxy({}, { getPrototypeOf() { throw new Error("SECRET-prototype"); } });
  wire.info = async () => { throw error; };
  try {
    await expect(s.run(wire)).rejects.toThrow("response unknown");
    const events = s.graph.events.read("m"), facts = events.filter(e => e.kind === "rms.native-at-rest.observation").map(e => e.payload as any);
    expect(facts).toHaveLength(1); expect(facts[0].outcome).toBe("unknown-response"); expect(facts[0].responseSha256).toBeNull();
    expect(JSON.stringify(events)).not.toContain("SECRET"); expect(captures).toBe(mode === "throwing-prototype" ? 0 : 1);
    expect(wire.creates).toBe(0); expect(wire.prompts).toBe(0);
  } finally { s.close(); }
});

test("actual HTTP non-ok retains only its validated digest and no raw refusal body", async () => {
  const s = setup(), wire = new Wire();
  try { await withHttp(wire, async frames => {
    await expect(s.run(nativeAtRestTransportV1())).rejects.toThrow("response unknown");
    const events = s.graph.events.read("m"), facts = events.filter(e => e.kind === "rms.native-at-rest.observation").map(e => e.payload as any);
    expect(facts).toHaveLength(1); expect(facts[0].outcome).toBe("response-received-refused");
    expect(facts[0].responseSha256).toBe(sha("SECRET-HTTP-REFUSAL")); expect(JSON.stringify(events)).not.toContain("SECRET");
    expect(frames.some(f => f.method === "POST")).toBe(false);
  }, false, undefined, true); } finally { s.close(); }
});
