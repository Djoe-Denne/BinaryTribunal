import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { createExecutionApi, type ExecutionApi, type ExecutionOptions } from "../src/execution-api"
import { executionJsonSha256 } from "../src/execution-output"
import { parseExecutionConfig } from "../src/execution-auth"
import { createDb, type Database } from "../src/db"
import { initializeExecutionStore } from "../src/execution-store"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { setupDeps } from "./helpers"

const auth = { principalId: "operator", token: "sharing-secret" }
const model = { providerID: "fixture", id: "small", variant: "high" }
const schema = { type: "object", properties: { note: { type: "string", maxLength: 100000 } }, required: ["note"], additionalProperties: false }
const communication = { mode: "bulletin", channel: "neighborhood-1", read: true, publish: true, schema, schemaSha256: executionJsonSha256(schema) }
const binding = { tool: "fixture_lookup", accesses: [{ action: "read", resource: "fixture:catalog" }] }
type Bulletin = { id: string; seq: number; channel: string; payload: unknown; payloadSha256: string; schemaSha256: string; author: { executionId: string; sessionId: string; profile: string; model: typeof model } }
type SharingApi = ExecutionApi & { bulletinPublish(sessionID: string, input: unknown): Promise<Bulletin>; bulletinRead(sessionID: string, input: unknown): Promise<{ messages: Bulletin[]; cursor: number }> }

function fixture(overrides: Record<string, unknown> = {}, db?: Database) {
  const deps = setupDeps(db), sessions = new Map<string, Record<string, unknown>>()
  let sends = 0, creates = 0
  deps.client.session.create = async input => { creates++; const id = input.id!; sessions.set(id, { id, agent: input.agent, model: input.model, location: { directory: deps.directory }, metadata: input.metadata }); return { data: { id } } }
  deps.client.session.get = async ({ sessionID }) => ({ data: sessions.get(sessionID) })
  deps.client.session.promptAsync = async () => { sends++; return {} }
  const principal = { id: auth.principalId, tokenSha256: createHash("sha256").update(auth.token).digest("hex"), directories: [deps.directory], profiles: ["explore"], models: ["fixture/small#high"], bulletin: true, nativeToolBindings: [binding] }
  const options = { principals: [principal], now: () => 1000, profile: async (id: string) => ({ id }), nativeAccessWitness: true, nativeBulletinTools: true, nativeToolInventory: async () => [binding.tool], ...overrides } as ExecutionOptions
  let api = createExecutionApi(deps, options) as SharingApi
  const scope = (missionId = "mission") => ({ ...auth, directory: deps.directory, missionId })
  const ensure = (missionId = "mission") => api.handle("ensureTeam", { ...scope(missionId), teamName: missionId, controllerId: "controller", leaseMs: 300000, maxRunning: 20 })
  const submit = async (name: string, revision: number, extra: Record<string, unknown> = {}, missionId = "mission") => {
    await api.handle("submit", { ...scope(missionId), controllerId: "controller", expectedRevision: revision, taskId: `task-${name}`, attemptId: `attempt-${name}`, executionId: name, idempotencyKey: `key-${name}`, profile: "explore", model, prompt: "Complete the bounded task", ...extra })
    await Promise.resolve()
    return (JSON.parse((deps.db.query("SELECT payload FROM execution_record WHERE execution_id=?").get(name) as { payload: string }).payload) as { nativeSessionId: string }).nativeSessionId
  }
  return { deps, sessions, principal, options, scope, ensure, submit, get api() { return api }, restart: (opts = options) => { api = createExecutionApi(deps, opts) as SharingApi; return api }, counts: () => ({ sends, creates }) }
}

describe("explicit scoped bulletin", () => {
  test("mission storage limit counts UTF-8 bytes including immutable message metadata", async () => {
    const f = fixture(); await f.ensure()
    const sessionID = await f.submit("unicode", 1, { communication })
    const payload = { note: "é".repeat(30000) }
    let rejected = false
    for (let i = 0; i < 150; i++) {
      try { await f.api.bulletinPublish(sessionID, { key: `unicode-${i}`, payload }) }
      catch (error) { expect(String(error)).toContain("bulletin mission storage limit"); rejected = true; break }
    }
    expect(rejected).toBe(true)
    const snapshot = await f.api.handle("bulletinSnapshot", f.scope())
    const bytes = snapshot.messages!.reduce((sum, message) => sum + Buffer.byteLength(JSON.stringify(message)), 0)
    expect(bytes).toBeLessThanOrEqual(4194304)
    expect(await f.api.bulletinPublish(sessionID, { key: "unicode-0", payload })).toEqual(snapshot.messages![0]!)
    f.deps.db.close()
  })

  test("native handlers exist independently of a resourceBoundary and never use an RPC author", async () => {
    const f = fixture(); await f.ensure()
    const sessionID = await f.submit("writer", 1, { communication })
    expect(typeof f.api.bulletinPublish).toBe("function")
    const before = f.counts()
    const result = await f.api.bulletinPublish(sessionID, { key: "observation", payload: { note: "provisional" } })
    expect(result.author).toEqual({ executionId: "writer", sessionId: sessionID, model, profile: "explore" })
    expect(result.schemaSha256).toBe(communication.schemaSha256)
    expect(result.payloadSha256).toBe(executionJsonSha256({ note: "provisional" }))
    expect(f.counts()).toEqual(before)
    for (const extra of [{ sessionId: sessionID }, { sessionID }, { author: "writer" }, { channel: "other" }]) await expect(f.api.bulletinPublish(sessionID, { key: "spoof", payload: { note: "x" }, ...extra })).rejects.toThrow()
    await expect(f.api.bulletinPublish("foreign", { key: "k", payload: { note: "x" } })).rejects.toThrow()
    await expect(f.api.handle("bulletinPublish", { ...f.scope(), sessionId: sessionID, key: "rpc", payload: { note: "x" } })).rejects.toThrow()
    f.deps.db.close()
  })

  test("scope, rights, no opt-in, schema and idempotency are enforced with durable cursor receipts", async () => {
    const f = fixture(); await f.ensure(); await f.ensure("other-mission")
    expect(typeof f.api.bulletinRead).toBe("function")
    const a = await f.submit("a", 1, { communication }), b = await f.submit("b", 2, { communication }), c = await f.submit("c", 3, { communication: { ...communication, channel: "other" } })
    const d = await f.submit("d", 1, { communication }, "other-mission"), isolated = await f.submit("isolated", 4)
    const reader = await f.submit("reader", 5, { communication: { ...communication, publish: false } }), writer = await f.submit("writer", 6, { communication: { ...communication, read: false } })
    const first = await f.api.bulletinPublish(a, { key: "one", payload: { note: "first" } })
    expect(await f.api.bulletinPublish(a, { key: "one", payload: { note: "first" } })).toEqual(first)
    await expect(f.api.bulletinPublish(a, { key: "one", payload: { note: "changed" } })).rejects.toThrow()
    for (const payload of [{ note: 2 }, { note: "x", extra: true }, { note: "x".repeat(70000) }]) await expect(f.api.bulletinPublish(a, { key: "bad", payload })).rejects.toThrow()
    for (const sid of [isolated, reader]) await expect(f.api.bulletinPublish(sid, { key: "forbidden", payload: { note: "x" } })).rejects.toThrow()
    for (const sid of [isolated, writer]) await expect(f.api.bulletinRead(sid, {})).rejects.toThrow()
    expect((await f.api.bulletinRead(b, { limit: 1 })).messages).toEqual([first])
    expect((await f.api.bulletinRead(c, {})).messages).toEqual([])
    expect((await f.api.bulletinRead(d, {})).messages).toEqual([])
    f.restart()
    expect((await f.api.bulletinRead(b, {})).messages).toEqual([])
    expect((await f.api.bulletinRead(b, { after: 0 })).messages).toEqual([first])
    expect((await f.api.bulletinRead(b, {})).cursor).toBe(first.seq)
    const inspected = await f.api.handle("inspect", { ...f.scope(), executionId: "b" })
    expect(inspected.execution).toHaveProperty("communicationTrace.received.0.id", first.id)
    const snapshot = await f.api.handle("bulletinSnapshot", f.scope())
    expect(snapshot).toHaveProperty("messages.0.id", first.id)
    await expect(f.api.handle("bulletinSnapshot", { ...f.scope(), token: "wrong" })).rejects.toThrow()
    f.deps.db.close()
  })

  test("malformed contracts fail before native allocation and channel schemas cannot drift", async () => {
    const f = fixture(); await f.ensure()
    const bad = [{ ...communication, schemaSha256: "0".repeat(64) }, { ...communication, read: false, publish: false }, { ...communication, read: "yes" }, { ...communication, channel: "x".repeat(129) }, { ...communication, author: "fake" }, { ...communication, schema: { type: "object", $ref: "remote" } }]
    for (const invalid of bad) await expect(f.submit("bad", 1, { communication: invalid })).rejects.toThrow()
    expect(f.counts().creates).toBe(1)
    await f.submit("valid", 1, { communication })
    const changed = { ...schema, description: "different" }
    await expect(f.submit("changed", 2, { communication: { ...communication, schema: changed, schemaSha256: executionJsonSha256(changed) } })).rejects.toThrow()
    await expect(f.submit("valid", 1, { communication: { ...communication, publish: false } })).rejects.toThrow()
    const revoked = { ...f.options, principals: [{ ...f.principal, bulletin: false }] }
    f.restart(revoked)
    await expect(f.submit("valid", 1, { communication })).rejects.toThrow()
    await expect(f.submit("missing-opt-in", 2, { communication })).rejects.toThrow()
    f.deps.db.close()
  })

  test("native identity changes, paused/stopped writes and guard bypasses fail closed", async () => {
    const f = fixture(); await f.ensure()
    expect(typeof f.api.bulletinPublish).toBe("function")
    const sid = await f.submit("worker", 1, { communication })
    const event = { sessionID: sid, agent: "explore", messageID: "message", id: "call", tool: "execution_bulletin_publish", input: { key: "k", payload: { note: "x" } } }
    await f.api.beforeTool(event)
    for (const patch of [{ agent: "other" }, { model: { ...model, variant: "low" } }, { location: { directory: "/foreign" } }, { metadata: {} }]) {
      const original = f.sessions.get(sid)!; f.sessions.set(sid, { ...original, ...patch })
      await expect(f.api.bulletinPublish(sid, event.input)).rejects.toThrow()
      f.sessions.set(sid, original)
    }
    await f.api.handle("control", { ...f.scope(), controllerId: "controller", expectedRevision: 2, action: "pause" })
    await expect(f.api.beforeTool(event)).rejects.toThrow()
    await expect(f.api.bulletinPublish(sid, event.input)).rejects.toThrow()
    await f.api.handle("control", { ...f.scope(), controllerId: "controller", expectedRevision: 3, action: "resume" })
    await f.api.handle("stop", { ...f.scope(), controllerId: "controller", expectedRevision: 4, executionId: "worker" })
    await expect(f.api.bulletinPublish(sid, event.input)).rejects.toThrow()
    f.deps.db.close()
  })

  test("physical restart/migration retains messages, cursors and receipts without retransmission", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ensemble-bulletin-durable-")), filename = join(directory, "state.db")
    const f = fixture({}, createDb(filename))
    let reopened: Database | undefined
    try {
      await f.ensure()
      const legacy = await f.submit("legacy", 1)
      // Reproduce an attempt16 database: the execution tables exist but no new
      // bulletin tables yet. Additive migration must leave that record untouched.
      f.deps.db.exec("DROP TABLE execution_bulletin_delivery; DROP TABLE execution_bulletin_cursor; DROP TABLE execution_bulletin_message; DROP TABLE execution_bulletin_scope")
      initializeExecutionStore(f.deps.db)
      await expect(f.api.bulletinRead(legacy, {})).rejects.toThrow()
      const a = await f.submit("publisher", 2, { communication }), b = await f.submit("reader", 3, { communication })
      const published = await Promise.all([f.api.bulletinPublish(a, { key: "same", payload: { note: "one" } }), f.api.bulletinPublish(a, { key: "same", payload: { note: "one" } })])
      expect(published[0]).toEqual(published[1])
      await f.api.bulletinRead(b, {})
      const before = f.counts()
      f.deps.db.close()
      reopened = createDb(filename)
      const api = createExecutionApi({ ...f.deps, db: reopened }, f.options)
      expect(await api.bulletinPublish(a, { key: "same", payload: { note: "one" } })).toEqual(published[0])
      expect((await api.bulletinRead(b, {})).messages).toEqual([])
      expect((await api.bulletinRead(b, { after: 0 })).messages).toEqual([published[0]!])
      expect(reopened.query("SELECT COUNT(*) AS n FROM execution_bulletin_delivery").get()).toEqual({ n: 1 })
      expect((await api.handle("inspect", { ...f.scope(), executionId: "legacy" })).execution?.communicationTrace).toBeUndefined()
      expect(f.counts()).toEqual(before)
    } finally { reopened?.close(); if (!reopened) f.deps.db.close(); rmSync(directory, { recursive: true, force: true }) }
  })

  test("missing runtime, malformed reads and stale rights never authorize a handler or after guard", async () => {
    const f = fixture(); await f.ensure()
    const sid = await f.submit("worker", 1, { communication }), isolated = await f.submit("isolated", 2)
    const input = { key: "k", payload: { note: "x" } }
    for (const request of [{ after: -1 }, { after: 1 }, { after: 0.5 }, { limit: 0 }, { limit: 101 }, { channel: communication.channel }, { author: "worker" }]) await expect(f.api.bulletinRead(sid, request)).rejects.toThrow()
    const event = { sessionID: isolated, agent: "explore", messageID: "msg", id: "call", tool: "execution_bulletin_publish", input }
    await expect(f.api.beforeTool(event)).rejects.toThrow()
    await expect(f.api.observeTool({ ...event, status: "completed" })).rejects.toThrow()
    for (const override of [{ nativeBulletinTools: false }, { nativeAccessWitness: false }, { principals: [{ ...f.principal, bulletin: false }] }]) {
      f.restart({ ...f.options, ...override })
      await expect(f.api.bulletinPublish(sid, input)).rejects.toThrow()
      await expect(f.api.bulletinRead(sid, {})).rejects.toThrow()
    }
    expect(f.deps.db.query("SELECT COUNT(*) AS n FROM execution_bulletin_message").get()).toEqual({ n: 0 })
    f.deps.db.close()
  })

  test("strict final capture stays separate from bulletins and recovery rejects revoked policy", async () => {
    const f = fixture({ nativeOutputHooks: true })
    const selectedModel = { providerID: "openai", id: "gpt-6-astra", variant: "high" }
    f.options.principals[0]!.models.push("openai/gpt-6-astra#high")
    f.options.principals[0]!.strictOutputModels = ["openai/gpt-6-astra#high"]
    const context: unknown[] = []
    f.deps.client.session.readOutputContext = async () => context
    f.restart(); await f.ensure()
    const resultSchema = { type: "object", properties: { result: { type: "integer" } }, required: ["result"], additionalProperties: false }
    const output = { mode: "json_schema", strict: true, name: "result", schema: resultSchema, schemaSha256: executionJsonSha256(resultSchema), route: "openai-responses-v1" }
    const sid = await f.submit("strict", 1, { communication, output, model: selectedModel })
    const bulletin = await f.api.bulletinPublish(sid, { key: "lead", payload: { note: "not a final result" } })
    await f.api.bulletinRead(sid, {})
    const record = (await f.api.handle("inspect", { ...f.scope(), executionId: "strict" })).execution!
    expect(record.structuredResult).toBeUndefined()
    const event = { sessionID: sid, agent: "explore", model: selectedModel, kind: "primary", request: new Request("https://chatgpt.com/backend-api/codex/responses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: selectedModel.id, input: "final result", tools: [] }) }) }
    await f.api.beforeHttp(event)
    const response = { ...event, response: new Response('data: {"type":"response.completed","response":{"id":"response","status":"completed"}}\n\n', { headers: { "content-type": "text/event-stream" } }) }
    await f.api.afterHttp(response); await response.response.text()
    context.push({ id: "user", type: "user", metadata: { "ensemble.execution.intent": record.transmissionMarker } }, { id: "tool-turn", type: "assistant", agent: "explore", model: selectedModel, finish: "tool-calls", content: [{ type: "tool", output: bulletin }] }, { id: "final", type: "assistant", agent: "explore", model: selectedModel, finish: "stop", time: { completed: 20 }, content: [{ type: "text", text: '{"result":7}' }] })
    const final = (await f.api.handle("inspect", { ...f.scope(), executionId: "strict" })).execution!
    expect(final.state).toBe("completed")
    expect(final.structuredResult?.value).toEqual({ result: 7 })
    expect(final.communicationTrace?.received[0]?.id).toBe(bulletin.id)
    expect(f.counts().sends).toBe(1)
    f.restart({ ...f.options, principals: [{ ...f.options.principals[0]!, bulletin: false }] })
    const recovered = (await f.api.handle("inspect", { ...f.scope(), executionId: "strict" })).execution!
    expect(recovered.state).toBe("failed")
    expect(recovered.structuredResult).toBeUndefined()
    f.deps.db.close()
  })
})

describe("exact opt-in native bindings", () => {
  test("canonical native permission action plus literal star agrees with selected tool guards and witnesses", async () => {
    const grant = { tool: "fixture_server_lookup", accesses: [{ action: "fixture_server_lookup", resource: "*" }] }
    const f = fixture()
    f.options.principals[0]!.nativeToolBindings = [grant]
    f.options.nativeToolInventory = async () => [grant.tool]
    f.restart(); await f.ensure()
    const sid = await f.submit("canonical", 1, { nativeTools: [grant.tool], resourceBoundary: grant.accesses, expectedAccess: grant.accesses })
    const call = { sessionID: sid, agent: "explore", messageID: "message", id: "call", tool: grant.tool, input: {} }
    await f.api.beforeTool(call)
    const event = { sessionID: sid, agent: "explore", action: grant.tool, resources: ["*"], effect: "allow", source: { type: "tool" as const, messageID: call.messageID, id: call.id } }
    await f.api.enforcePermission(event)
    expect(event.effect).toBe("allow")
    await f.api.observeTool({ ...call, status: "completed" })
    expect((await f.api.handle("inspect", { ...f.scope(), executionId: "canonical" })).execution?.accessWitnesses).toEqual(expect.arrayContaining([expect.objectContaining({ action: grant.tool, resource: "*" })]))
    for (const change of [{ action: "fixture_server_mutate" }, { resources: ["fixture:invented"] }, { resources: ["*", "foreign"] }, { effect: "deny" }, { effect: "ask" }]) {
      const denied = { ...event, ...change, source: { ...event.source, id: "other" } }
      await f.api.enforcePermission(denied)
      expect(denied.effect).not.toBe("allow")
    }
    const isolated = await f.submit("unselected", 2, { resourceBoundary: grant.accesses })
    const denied = { ...event, sessionID: isolated }
    await f.api.enforcePermission(denied)
    expect(denied.effect).toBe("deny")
    f.deps.db.close()
  })

  test("a denied native permission or missing before guard cannot prove selected binding access", async () => {
    const grant = { tool: "fixture_server_lookup", accesses: [{ action: "fixture_server_lookup", resource: "*" }] }
    const f = fixture()
    f.options.principals[0]!.nativeToolBindings = [grant]
    f.options.nativeToolInventory = async () => [grant.tool]
    f.restart(); await f.ensure()
    const sid = await f.submit("checked", 1, { nativeTools: [grant.tool], resourceBoundary: grant.accesses, expectedAccess: grant.accesses })
    const call = { sessionID: sid, agent: "explore", messageID: "message", id: "denied-call", tool: grant.tool, input: {} }
    await f.api.beforeTool(call)
    await f.api.enforcePermission({ ...call, action: grant.tool, resources: ["*"], effect: "deny", source: { type: "tool", messageID: call.messageID, id: call.id } })
    await f.api.observeTool({ ...call, status: "completed" })
    expect((await f.api.handle("inspect", { ...f.scope(), executionId: "checked" })).execution?.accessVerified).toBe(false)
    const unguarded = { ...call, id: "missing-before" }
    await f.api.enforcePermission({ ...unguarded, action: grant.tool, resources: ["*"], effect: "allow", source: { type: "tool", messageID: call.messageID, id: unguarded.id } })
    await f.api.observeTool({ ...unguarded, status: "completed" })
    expect((await f.api.handle("inspect", { ...f.scope(), executionId: "checked" })).execution?.accessVerified).toBe(false)
    f.deps.db.close()
  })

  test("selected inventory IDs are digested and witnessed, undeclared tools remain blocked", async () => {
    const f = fixture(); await f.ensure()
    const sid = await f.submit("bound", 1, { nativeTools: [binding.tool], resourceBoundary: binding.accesses, expectedAccess: binding.accesses })
    const inspected = await f.api.handle("inspect", { ...f.scope(), executionId: "bound" })
    expect(inspected.execution?.selection).toHaveProperty("nativeToolBindings", [binding])
    expect(inspected.execution?.selection.hashes).toHaveProperty("nativeToolBindings", executionJsonSha256([binding]))
    const event = { sessionID: sid, agent: "explore", messageID: "message", id: "call", tool: binding.tool, input: { query: "exact" } }
    await f.api.beforeTool(event)
    await f.api.observeTool({ ...event, status: "completed" })
    expect((await f.api.handle("inspect", { ...f.scope(), executionId: "bound" })).execution?.accessVerified).toBe(true)
    await expect(f.api.beforeTool({ ...event, id: "other", tool: "fixture_mutate" })).rejects.toThrow()
    const isolated = await f.submit("isolated", 2, { resourceBoundary: binding.accesses })
    await expect(f.api.beforeTool({ ...event, sessionID: isolated })).rejects.toThrow()
    for (const nativeToolBindings of [[], [{ ...binding, accesses: [{ action: "edit", resource: "fixture:catalog" }] }]]) {
      f.restart({ ...f.options, principals: [{ ...f.principal, nativeToolBindings }] })
      await expect(f.api.beforeTool(event)).rejects.toThrow()
      await expect(f.submit("bound", 1, { nativeTools: [binding.tool], resourceBoundary: binding.accesses, expectedAccess: binding.accesses })).rejects.toThrow()
    }
    f.deps.db.close()
  })

  test("unavailable inventory, ungranted/duplicate/reserved IDs and absent boundaries refuse admission", async () => {
    for (const overrides of [{ nativeToolInventory: undefined }, { nativeToolInventory: async () => [] }, { nativeAccessWitness: false }]) {
      const f = fixture(overrides); await f.ensure()
      await expect(f.submit("a", 1, { nativeTools: [binding.tool], resourceBoundary: binding.accesses })).rejects.toThrow()
      expect(f.counts().creates).toBe(1); f.deps.db.close()
    }
    const f = fixture(); await f.ensure()
    for (const nativeTools of [[binding.tool, binding.tool], ["other"], ["read"], ["team_message"], ["execution_bulletin_read"], ["fixture_*"], "fixture_lookup"]) await expect(f.submit("a", 1, { nativeTools, resourceBoundary: binding.accesses })).rejects.toThrow()
    await expect(f.submit("a", 1, { nativeTools: [binding.tool] })).rejects.toThrow()
    f.deps.db.close()
  })

  test("operator config preserves opt-ins and rejects malformed or builtin overrides", () => {
    const f = fixture()
    expect(parseExecutionConfig({ version: 1, principals: [f.principal] })[0]).toEqual(f.principal)
    for (const tool of ["read", "edit", "execute", "shell", "bash", "webfetch", "team_message", "execution_bulletin_read", "fixture_*", "fixture?"]) expect(() => parseExecutionConfig({ version: 1, principals: [{ ...f.principal, nativeToolBindings: [{ ...binding, tool }] }] })).toThrow()
    for (const accesses of [[], [{ action: "read", resource: "*" }], [{ action: "read", resource: "x\u0000y" }], [{ action: "read", resource: "../escape" }], [{ action: "read", resource: "fixture:catalog", extra: true }]]) expect(() => parseExecutionConfig({ version: 1, principals: [{ ...f.principal, nativeToolBindings: [{ ...binding, accesses }] }] })).toThrow()
    expect(() => parseExecutionConfig({ version: 1, principals: [{ ...f.principal, bulletin: "true" }] })).toThrow()
    f.deps.db.close()
  })
})
