import { test, expect } from "bun:test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ExecutionClient, type RpcTransport } from "../src/client";
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
