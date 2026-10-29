import { test, expect, spyOn } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ExecutionClient, type RpcTransport } from "../src/client";
import { prepareRuntimeExecutionV1 } from "../src/graph-execution-prepare";
import { readRuntimeDocumentV1, type DispatchScopeV1 } from "../src/graph-runtime-binding";
import { fixture, preparation, decoded, document, digest } from "./s2-author/s1-source-fixtures";
import { graphHarness } from "./graph-integration/fixture-driver";
function setup(loseReply = false) {
  const root = mkdtempSync(join(tmpdir(), "ff8-client-")); const requests: Record<string, unknown>[] = [];
  let revision = 1; let lost = false; const receipts = new Map<string, Record<string, unknown>>();
  const transport: RpcTransport = { async call(method, input) {
    if (method === "capabilities") return { version: 1, capabilities: { rpc: "ensemble.execution.v1", fresh: true, replay: true } };
    if (method === "ensureTeam") return { version: 1, revision, teamId: "team-test", leadSessionId: "ses-test" };
    if (method === "snapshot") return { version: 1, revision, cursor: 2, admissions: { controllerId: "ctl", leaseUntil: Date.now() + 300000, paused: false }, executions: [...receipts.values()] };
    if (method === "replay") return { version: 1, cursor: 2, events: [{ version: 1, id: 1, missionId: "m", kind: "accepted" }, { version: 1, id: 1, missionId: "m", kind: "accepted" }, { version: 1, id: 2, missionId: "m", kind: "completed" }] };
    if (method === "control") return { version: 1, revision: ++revision };
    if (method === "submit") { requests.push(input); const key = String(input.idempotencyKey); let r = receipts.get(key); if (!r) { if (input.expectedRevision !== revision) throw new Error("stale remote revision"); r = { version: 1, revision: ++revision, executionId: input.executionId, state: "accepted" }; receipts.set(key, r); } if (loseReply && !lost) { lost = true; throw new Error("lost response"); } return r; }
    throw new Error(method);
  } };
  const options = { transport, statePath: join(root, "client.db"), directory: root, principalId: "op", token: () => "TOP-SECRET", controllerId: "ctl", teamName: "external-test", leaseMs: 300000, maxRunning: 2 };
  const cleanup = () => rmSync(root, { recursive: true, force: true });
  return { client: new ExecutionClient(options), options, requests, cleanup, receipts };
}
const body = { executionId: "exec-1", taskId: "task-1", attemptId: "attempt-1", idempotencyKey: "key-1", prompt: "exact dossier", profile: "worker", model: { providerID: "fixture", id: "model", variant: "high" } };
test("RMSO- client derives durable execution target and refuses supplied unit/task aliases without transport", async () => {
  const h = graphHarness(), s = setup(); let client: ExecutionClient | undefined;
  try {
    h.start(); await h.step(); const command = h.host.submissions[0]!.command;
    client = new ExecutionClient({ ...s.options, statePath: h.path }); await client.ensure(h.missionId);
    const metadata = command.metadata as Record<string, unknown>, binding = metadata.graphBinding as Record<string, unknown>;
    await expect(client.submit(h.missionId, { ...command, metadata: { ...metadata, graphBinding: { ...binding, unitId: "unrelated-alias" } } })).rejects.toThrow(/contradicts durable target/);
    await expect(client.submit(h.missionId, { ...command, taskId: "unrelated-task" })).rejects.toThrow(/contradicts durable target/);
    expect(s.requests).toHaveLength(0); expect(h.host.submissions[0]!.command).toEqual(command);
  } finally { client?.close(); h.close(); s.client.close(); s.cleanup(); }
}, 600000);
function obsoleteClientFixture(h: ReturnType<typeof graphHarness>) {
  const command = h.host.submissions[0]!.command, graph = h.runtime.options.graph, authority = h.runtime.options.authority(); graph.bootstrapParentAuthority(authority);
  const unitId = (command.metadata as { graphBinding: { unitId: string } }).graphBinding.unitId;
  const revision = (graph.db.query("SELECT revision FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(h.missionId, unitId) as { revision: number }).revision;
  graph.retainOrderedCommandV1(authority, { commandId: "client-fixture-obsolete", unitId, executionId: null, sessionId: null, action: "obsolete", reason: "voluntary fixture decision", sequence: 1,
    expectedMissionRevision: h.store.load(h.missionId).revision, expectedUnitRevision: revision, expectedEventSequence: graph.events.cursor(h.missionId).sequence,
    expectedFamilyToken: graph.leases.get(h.missionId, unitId)?.token ?? null, notify: false });
  return command;
}
test("RMSO- global execution cannot hide obsolete durable mission behind a supplied mission alias", async () => {
  const h = graphHarness(), s = setup(); let client: ExecutionClient | undefined, transportCalls = 0;
  try {
    h.start(); await h.step(); const command = obsoleteClientFixture(h), original = JSON.stringify(command), transport = s.options.transport;
    client = new ExecutionClient({ ...s.options, statePath: h.path, transport: { async call(method, image) { transportCalls++; return transport.call(method, image); } } });
    // The rejection precedes snapshot/ensure/revision lookup for the alias.
    await expect(client.submit(`${h.missionId}:alias`, command)).rejects.toThrow(/mission.*contradicts durable target/);
    expect(transportCalls).toBe(0); expect(s.requests).toHaveLength(0); expect(JSON.stringify(command)).toBe(original);
  } finally { client?.close(); h.close(); s.client.close(); s.cleanup(); }
}, 600000);
test("RMSO- corrupt decision digest from a normal durable decision is refused before any transport", async () => {
  const h = graphHarness(), s = setup(); let client: ExecutionClient | undefined, transportCalls = 0;
  try {
    h.start(); await h.step(); const command = obsoleteClientFixture(h), graph = h.runtime.options.graph, transport = s.options.transport;
    // Fixture-only corruption after a real private-row + event API decision.
    graph.db.query("UPDATE ff8_graph_ordered_commands SET digest=? WHERE mission=? AND command_id=?").run("wrong-digest", h.missionId, "client-fixture-obsolete");
    client = new ExecutionClient({ ...s.options, statePath: h.path, transport: { async call(method, image) { transportCalls++; return transport.call(method, image); } } });
    await expect(client.submit(h.missionId, command)).rejects.toThrow(/corrupt RMS decision/); expect(transportCalls).toBe(0); expect(s.requests).toHaveLength(0);
  } finally { client?.close(); h.close(); s.client.close(); s.cleanup(); }
}, 600000);
test("RMSO- legitimate legacy command without a graph outbox retains its existing admission path", async () => {
  const s = setup(); try { await s.client.ensure("m"); expect((await s.client.submit("m", body)).executionId).toBe(body.executionId); expect(s.requests).toHaveLength(1); }
  finally { s.client.close(); s.cleanup(); }
}, 600000);
test("client commits submission before send and reuses it after a lost response/reopen", async () => {
  const s = setup(true); try { await s.client.ensure("m"); await expect(s.client.submit("m", body)).rejects.toThrow("lost"); s.client.close(); const next = new ExecutionClient(s.options); const r = await next.submit("m", body); expect(r.state).toBe("accepted"); expect(s.receipts.size).toBe(1); expect(s.requests[0]).toEqual(s.requests[1]); next.close(); expect(readFileSync(s.options.statePath).includes(Buffer.from("TOP-SECRET"))).toBe(false); } finally { s.cleanup(); }
});
test("changed payload under an existing idempotency key is refused locally", async () => {
  const s = setup(); try { await s.client.ensure("m"); await s.client.submit("m", body); await expect(s.client.submit("m", { ...body, prompt: "changed" })).rejects.toThrow(/idempotency/); expect(s.requests).toHaveLength(1); } finally { s.client.close(); s.cleanup(); }
});
test("public client replay hashes native selections, RE policy metadata and scoped communication", async () => {
  for (const field of ["nativeTools", "communication", "metadata"]) {
    const s = setup();
    try {
      await s.client.ensure("m");
      const input = { ...body, nativeTools: ["exact_registered_disasm"], communication: { mode: "bulletin", channel: "assigned", read: true, publish: true, schema: { type: "object", properties: {}, required: [], additionalProperties: false }, schemaSha256: "a".repeat(64) }, metadata: { rePolicyHash: "b".repeat(64) } };
      await s.client.submit("m", input); s.client.close(); const restarted = new ExecutionClient(s.options);
      try { await expect(restarted.submit("m", { ...input, [field]: field === "nativeTools" ? [] : field === "communication" ? { ...input.communication, channel: "other" } : { rePolicyHash: "c".repeat(64) } })).rejects.toThrow(/idempotency/); }
      finally { restarted.close(); }
      expect(s.requests).toHaveLength(1);
    } finally { s.cleanup(); }
  }
});
test("journal consumption tolerates duplicates and restart, using durable cursor", async () => {
  const s = setup(); try { await s.client.ensure("m"); expect(await s.client.replay("m")).toBe(2); s.client.close(); const next = new ExecutionClient(s.options); expect(await next.replay("m")).toBe(2); next.close(); } finally { s.cleanup(); }
});
test("client refuses an unsupported wire version", async () => {
  const s = setup(); s.options.transport = { call: async () => ({ version: 2 }) }; const next = new ExecutionClient(s.options); try { await expect(next.ensure("m")).rejects.toThrow(/version/); } finally { s.client.close(); next.close(); s.cleanup(); }
});
test("bulletinSnapshot uses only public authenticated mission/directory scope and optional assigned channel", async () => {
  const s = setup(), calls: Array<{ method: string; input: Record<string, unknown> }> = [];
  s.options.transport = { call: async (method, input) => { calls.push({ method, input }); return { version: 1, missionId: "m", revision: 2, messages: [] }; } };
  const client = new ExecutionClient(s.options);
  try {
    expect(await client.bulletinSnapshot("m", "assigned")).toEqual({ version: 1, missionId: "m", revision: 2, messages: [] });
    expect(calls).toEqual([{ method: "bulletinSnapshot", input: { missionId: "m", directory: s.options.directory, principalId: "op", token: "TOP-SECRET", channel: "assigned" } }]);
    await client.bulletinSnapshot("m"); expect(calls[1]!.input.channel).toBeUndefined();
  } finally { client.close(); s.client.close(); s.cleanup(); }
});
test("declared admission refusal preserves typed permanent cause and redacts credentials", async () => {
  const s = setup(); s.options.transport = { call: async () => { throw Object.assign(new Error("TOP-SECRET denied"), { type: "execution_rejected", data: { category: "permission", recoverable: false } }); } };
  const next = new ExecutionClient(s.options); try { await expect(next.ensure("m")).rejects.toMatchObject({ category: "permission", recoverable: false, message: "[redacted] denied" }); } finally { next.close(); s.client.close(); s.cleanup(); }
});
test("unaccepted pending command can refresh revision only after snapshot proves no execution", async () => {
  const s = setup(); const real = s.options.transport; let drop = true;
  s.options.transport = { async call(method, input) { if (method === "submit" && drop) { drop = false; throw new Error("cut before acceptance"); } return real.call(method, input); } };
  try { await s.client.ensure("m"); await expect(s.client.submit("m", body)).rejects.toThrow("cut"); await s.client.control("m", "renew"); expect((await s.client.submit("m", body)).state).toBe("accepted"); expect(s.receipts.size).toBe(1); expect(s.requests[0].expectedRevision).toBe(2); } finally { s.client.close(); s.cleanup(); }
});
for (const [native, category, recoverable] of [
  [{ _tag: "UnauthorizedError", message: "TOP-SECRET unauthorized" }, "auth", false],
  [{ _tag: "ForbiddenError", message: "TOP-SECRET forbidden" }, "permission", false],
  [{ _tag: "InvalidRequestError", message: "TOP-SECRET invalid" }, "input", false],
  [{ _tag: "RpcInternalError", type: "rpc.invalid_output", message: "TOP-SECRET invalid output" }, "schema", false],
  [{ _tag: "ServiceUnavailableError", message: "TOP-SECRET unavailable" }, "transport", true],
  [{ _tag: "RpcError", type: "execution_rejected", message: "TOP-SECRET quota", data: { category: "quota", recoverable: true } }, "quota", true],
] as const) test(`public error ${native._tag}/${category} survives submit/inspect/control without invented refusal authority`, async () => {
  for (const operation of ["submit", "inspect", "control"] as const) {
    const s = setup(), real = s.options.transport; let fail = false;
    s.options.transport = { call: async (method, input) => { if (fail && method === operation) throw native; return real.call(method, input); } };
    const client = new ExecutionClient(s.options);
    try {
      await client.ensure("m"); fail = true;
      const action = operation === "submit" ? client.submit("m", body) : operation === "inspect" ? client.inspect("m", body.executionId) : client.control("m", "pause");
      await expect(action).rejects.toMatchObject({ category, recoverable, type: native._tag === "RpcError" ? "execution_rejected" : undefined });
      fail = false;
      if (operation === "submit") expect((await client.submit("m", body)).state).toBe("accepted");
    } finally { client.close(); s.client.close(); s.cleanup(); }
  }
});
for (const state of [
  { executions: [] },
  { admissions: { controllerId: "ctl", leaseUntil: Number.NaN, paused: false }, executions: [] },
  { admissions: { controllerId: "ctl", leaseUntil: Date.now() + 300000, paused: true }, executions: [] },
  { admissions: { controllerId: "ctl", leaseUntil: Date.now() + 300000, paused: false }, executions: [null] },
]) test("ambiguous or paused admission snapshot cannot send a new command", async () => {
  const s = setup(), real = s.options.transport;
  s.options.transport = { call: async (method, input) => method === "snapshot" ? { version: 1, revision: 1, ...state } : real.call(method, input) };
  const client = new ExecutionClient(s.options);
  try { await client.ensure("m"); await expect(client.submit("m", body)).rejects.toThrow(); expect(s.requests).toHaveLength(0); }
  finally { client.close(); s.client.close(); s.cleanup(); }
});
test("invalid acceptance receipt is not cached and retry keeps the original identity", async () => {
  const s = setup(), real = s.options.transport; let invalid = true;
  s.options.transport = { call: async (method, input) => method === "submit" && invalid ? { version: 1, revision: 2, executionId: "other", state: "accepted" } : real.call(method, input) };
  const client = new ExecutionClient(s.options);
  try { await client.ensure("m"); await expect(client.submit("m", body)).rejects.toThrow(/receipt/); invalid = false; expect((await client.submit("m", body)).executionId).toBe(body.executionId); expect(s.receipts.size).toBe(1); }
  finally { client.close(); s.client.close(); s.cleanup(); }
});

test("prospective DATA join/body survive reopen; exact retry has no transport and divergent retry refuses", async () => {
  const s = setup(); let calls = 0;
  s.options.transport = { async call() { calls++; throw new Error("unexpected transport"); } };
  s.options.token = () => { calls++; throw new Error("unexpected token"); };
  const client = new ExecutionClient(s.options);
  let next: ExecutionClient | undefined;
  try {
    const f = fixture(), prepared = prepareRuntimeExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
    if (!prepared.ok) throw new Error(prepared.reasons.join(";"));
    const runtime = prepared.value, run = readRuntimeDocumentV1(runtime.run) as any, envelope = decoded<any>(run.envelope);
    const planning = decoded<any>(envelope.planning), unit = planning.units[0], sub = unit.subIntents.find((x: any) => x.role === "A");
    const input = { schemaVersion: 1, role: "A", cycle: 1, identity: sub.harnessIdentity, files: [], accessibleRules: [], requiredTools: [], knowledge: decoded<any>(envelope.admissionSource.knowledgeSource).frozen };
    const command = { executionId: "prospective-exec", attemptId: "prospective-attempt", taskId: "prospective-task", idempotencyKey: "prospective-key", profile: decoded<any>(envelope.admissionSource.executionTemplate).settings.profiles.A,
      model: decoded<any>(envelope.admissionSource.executionSourceSpec).models.A, prompt: "synthetic DATA only", dossier: { inputs: input }, metadata: { inputFingerprint: digest(input), rmsBinding: { version: "rms-agent-binding-data-v1", runtimeBindingRef: runtime.binding.ref, unitId: unit.unitId, subIntentId: sub.subIntentId, functionId: sub.functionId, role: "A", familyFence: 1, controllerFence: 1 } } };
    const admission = { executionId: command.executionId, attemptId: command.attemptId, idempotencyKey: command.idempotencyKey, subIntentId: sub.subIntentId, role: "A", command };
    const scope: DispatchScopeV1 = { missionId: run.missionId, cycle: 1, unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: "A", familyFence: 1, controllerFence: 1, expectedRevision: 0,
      planRef: envelope.planning.ref, snapshotRef: envelope.fullGraphSnapshot.ref, inputBundle: document("rms-inputs-data-v1", input), outboxRef: document("rms-admission-data-v1", admission).ref };
    const first = client.prepareRuntimeDispatch(runtime, scope, admission), joinData = decoded(first);
    expect(joinData.payloadDigest).toBe(digest(command)); expect(joinData.upstreamBodyDigest).toBe(digest(admission));
    expect(joinData.clientBodyDigest).toBe(digest({ ...command, missionId: scope.missionId, directory: s.options.directory, controllerId: "ctl", expectedRevision: 0 }));
    expect(new Set([joinData.payloadDigest, joinData.upstreamBodyDigest, joinData.clientBodyDigest]).size).toBe(3);
    expect(joinData.rpcBodySha256).toBeNull();
    client.close(); next = new ExecutionClient(s.options);
    expect(next.prepareRuntimeDispatch(runtime, scope, admission)).toEqual(first);
    expect(() => next!.prepareRuntimeDispatch(runtime, { ...scope, expectedRevision: 1 }, admission)).toThrow("conflict");
    await expect(next.submitRuntime(scope.missionId, command.idempotencyKey)).rejects.toThrow("native-unavailable");
    await expect(next.observeRuntime(scope.missionId, command.idempotencyKey)).rejects.toThrow("native-unavailable");
    await expect(next.submit(scope.missionId, command)).rejects.toThrow("legacy submit forbidden");
    expect(calls).toBe(0);
  } finally { next?.close(); client.close(); s.client.close(); s.cleanup(); }
}, 15000);

test("prospective reservation wins while legacy submit awaits snapshot: no legacy emission and retained images unchanged", async () => {
  const s = setup(), real = s.options.transport;
  let entered!: () => void, release!: () => void;
  const snapshotEntered = new Promise<void>(done => { entered = done; });
  const snapshotRelease = new Promise<void>(done => { release = done; });
  let holdSnapshot = false, submitEmissions = 0;
  s.options.transport = { async call(method, input) {
    if (method === "snapshot" && holdSnapshot) { entered(); await snapshotRelease; }
    // Independent effect oracle counts entry, even if the mock later rejects CAS.
    if (method === "submit") submitEmissions++;
    return real.call(method, input);
  } };
  const client = new ExecutionClient(s.options);
  let pending: Promise<{ error: unknown }> | undefined;
  try {
    const f = fixture(), prepared = prepareRuntimeExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
    if (!prepared.ok) throw new Error(prepared.reasons.join(";"));
    const runtime = prepared.value, run = readRuntimeDocumentV1(runtime.run) as any, envelope = decoded<any>(run.envelope);
    const planning = decoded<any>(envelope.planning), unit = planning.units[0], sub = unit.subIntents.find((x: any) => x.role === "A");
    const input = { schemaVersion: 1, role: "A", cycle: 1, identity: sub.harnessIdentity, files: [], accessibleRules: [], requiredTools: [], knowledge: decoded<any>(envelope.admissionSource.knowledgeSource).frozen };
    const command = { executionId: "prospective-race-exec", attemptId: "prospective-race-attempt", taskId: "prospective-race-task", idempotencyKey: "prospective-race-key", profile: decoded<any>(envelope.admissionSource.executionTemplate).settings.profiles.A,
      model: decoded<any>(envelope.admissionSource.executionSourceSpec).models.A, prompt: "synthetic DATA race only", dossier: { inputs: input }, metadata: { inputFingerprint: digest(input), rmsBinding: { version: "rms-agent-binding-data-v1", runtimeBindingRef: runtime.binding.ref, unitId: unit.unitId, subIntentId: sub.subIntentId, functionId: sub.functionId, role: "A", familyFence: 1, controllerFence: 1 } } };
    const admission = { executionId: command.executionId, attemptId: command.attemptId, idempotencyKey: command.idempotencyKey, subIntentId: sub.subIntentId, role: "A", command };
    const scope: DispatchScopeV1 = { missionId: run.missionId, cycle: 1, unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: "A", familyFence: 1, controllerFence: 1, expectedRevision: 0,
      planRef: envelope.planning.ref, snapshotRef: envelope.fullGraphSnapshot.ref, inputBundle: document("rms-inputs-data-v1", input), outboxRef: document("rms-admission-data-v1", admission).ref };
    await client.ensure(scope.missionId); holdSnapshot = true;
    pending = client.submit(scope.missionId, command).then(() => ({ error: undefined }), error => ({ error }));
    await snapshotEntered;
    const retained = client.prepareRuntimeDispatch(runtime, scope, admission);
    release(); const outcome = await pending;
    expect(submitEmissions).toBe(0);
    expect(outcome.error).toBeInstanceOf(Error);
    expect((outcome.error as Error).message).toContain("legacy submit forbidden");
    expect(client.prepareRuntimeDispatch(runtime, scope, admission)).toEqual(retained);
    expect(decoded(retained).clientBodyDigest).toBe(digest({ ...command, missionId: scope.missionId, directory: s.options.directory, controllerId: "ctl", expectedRevision: 0 }));
    expect(decoded(retained).upstreamBodyDigest).toBe(digest(admission));
  } finally { release(); await pending; client.close(); s.client.close(); s.cleanup(); }
}, 15000);

test("prospective retention wins between legacy classification lookup and request read: raw body unchanged", async () => {
  const s = setup(), real = s.options.transport;
  let submitEmissions = 0;
  s.options.transport = { async call(method, input) { if (method === "submit") submitEmissions++; return real.call(method, input); } };
  const a = new ExecutionClient(s.options), b = new ExecutionClient(s.options);
  const observer = new Database(s.options.statePath, { readonly: true });
  let restore: (() => void) | undefined;
  try {
    const f = fixture(), prepared = prepareRuntimeExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
    if (!prepared.ok) throw new Error(prepared.reasons.join(";"));
    const runtime = prepared.value, run = readRuntimeDocumentV1(runtime.run) as any, envelope = decoded<any>(run.envelope);
    const unit = decoded<any>(envelope.planning).units[0], sub = unit.subIntents.find((x: any) => x.role === "A");
    const input = { schemaVersion: 1, role: "A", cycle: 1, identity: sub.harnessIdentity, files: [], accessibleRules: [], requiredTools: [], knowledge: decoded<any>(envelope.admissionSource.knowledgeSource).frozen };
    const command = { executionId: "retention-exec", attemptId: "retention-attempt", taskId: "retention-task", idempotencyKey: "retention-key", profile: decoded<any>(envelope.admissionSource.executionTemplate).settings.profiles.A,
      model: decoded<any>(envelope.admissionSource.executionSourceSpec).models.A, prompt: "synthetic retention DATA only", dossier: { inputs: input }, metadata: { inputFingerprint: digest(input), rmsBinding: { version: "rms-agent-binding-data-v1", runtimeBindingRef: runtime.binding.ref, unitId: unit.unitId, subIntentId: sub.subIntentId, functionId: sub.functionId, role: "A", familyFence: 1, controllerFence: 1 } } };
    const admission = { executionId: command.executionId, attemptId: command.attemptId, idempotencyKey: command.idempotencyKey, subIntentId: sub.subIntentId, role: "A", command };
    const scope: DispatchScopeV1 = { missionId: run.missionId, cycle: 1, unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: "A", familyFence: 1, controllerFence: 1, expectedRevision: 0,
      planRef: envelope.planning.ref, snapshotRef: envelope.fullGraphSnapshot.ref, inputBundle: document("rms-inputs-data-v1", input), outboxRef: document("rms-admission-data-v1", admission).ref };
    await a.ensure(scope.missionId);
    const rawBody = () => (observer.query("SELECT body FROM ff8_bridge_requests WHERE mission=? AND key=?").get(scope.missionId, command.idempotencyKey) as { body: string }).body;
    let armed = true, interpositions = 0, retained: ReturnType<ExecutionClient["prepareRuntimeDispatch"]> | undefined, before: string | undefined;
    const originalQuery = Database.prototype.query;
    const interception = spyOn(Database.prototype, "query").mockImplementation(function(this: Database, sql: string) {
      const statement = originalQuery.call(this, sql);
      if (sql !== "SELECT key FROM ff8_bridge_dispatch_joins WHERE mission=? AND key=?") return statement;
      return new Proxy(statement, { get(target, property) {
        if (property === "get") return (...params: any[]) => {
          const row = target.get(...params);
          // Simulate B's legal interposition AFTER A's empty lookup completes.
          if (armed && row == null) { armed = false; interpositions++; retained = b.prepareRuntimeDispatch(runtime, scope, admission); before = rawBody(); }
          return row;
        };
        const value = Reflect.get(target, property, target); return typeof value === "function" ? value.bind(target) : value;
      } });
    } as typeof Database.prototype.query);
    restore = () => interception.mockRestore();
    const outcome = await a.submit(scope.missionId, command).then(() => ({ error: undefined }), error => ({ error }));
    restore(); restore = undefined;
    expect(interpositions).toBe(1); expect(submitEmissions).toBe(0);
    expect(rawBody()).toBe(before!);
    expect(b.prepareRuntimeDispatch(runtime, scope, admission)).toEqual(retained!);
    expect(outcome.error).toBeInstanceOf(Error);
    expect((outcome.error as Error).message).toContain("legacy submit forbidden");
  } finally { restore?.(); observer.close(); a.close(); b.close(); s.client.close(); s.cleanup(); }
}, 15000);
