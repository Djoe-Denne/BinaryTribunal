import { describe, expect, test } from "bun:test"
import { createHash, randomUUID } from "node:crypto"
import { mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { createDb } from "../src/db"
import { createExecutionApi } from "../src/execution-api"
import { setupDeps } from "./helpers"

const hash = (v: unknown): string => createHash("sha256").update(canonical(v)).digest("hex")
function canonical(v: unknown): string { return Array.isArray(v) ? `[${v.map(canonical).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(",")}}` : JSON.stringify(v) }
const auth = { principalId: "operator", token: "fixture-secret" }
const model = { providerID: "openai", id: "gpt-6-astra", variant: "high" }
const schema = { type: "object", properties: { result: { type: "integer" } }, required: ["result"], additionalProperties: false }
const output = { mode: "json_schema", strict: true, name: "result", schema, schemaSha256: hash(schema), route: "openai-responses-v1" }
interface Identity { sessionID: string; agent: string; model: typeof model; kind: string }
interface Hooks {
  beforeHttp(event: Identity & { request: Request }): Promise<void>
  afterHttp(event: Identity & { request: Request; response: Response }): Promise<void>
  beforeWsHandshake(event: Identity & { url: string; headers: Record<string, string> }): Promise<void>
  beforeWsSend(event: Identity & { frame: string }): Promise<void>
  afterWsReceive(event: Identity & { frame: string }): Promise<void>
}
function fixture(config: { optIn?: boolean; hooks?: boolean; capture?: boolean; db?: ReturnType<typeof createDb>; maxRunning?: number } = {}) {
  const deps = setupDeps(config.db), sessions = new Map<string, Record<string, unknown>>(), contexts = new Map<string, unknown[]>()
  let creates = 0, sends = 0
  deps.client.session.create = async input => { const id = input.id!; creates++; sessions.set(id, { id, agent: input.agent, model: input.model, location: { directory: deps.directory }, permissions: input.permission, metadata: input.metadata }); return { data: { id } } }
  deps.client.session.get = async input => ({ data: sessions.get(input.sessionID) })
  if (config.capture !== false) Object.assign(deps.client.session, { readOutputContext: async ({ sessionID }: { sessionID: string }) => contexts.get(sessionID) ?? [] })
  deps.client.session.findIntent = async ({ sessionID }) => contexts.has(sessionID) ? { messageId: "user" } : undefined
  deps.client.session.promptAsync = async input => { sends++; contexts.set(input.sessionID, [{ id: "user", type: "user", metadata: input.metadata }]); return { messageID: "user" } }
  const options = { now: () => 1000, nativeAccessWitness: true, nativeOutputHooks: config.hooks !== false, profile: async () => ({ id: "explore" }), principals: [{ id: auth.principalId, tokenSha256: createHash("sha256").update(auth.token).digest("hex"), directories: [deps.directory], profiles: ["explore"], models: ["openai/gpt-6-astra#high", "fixture/small#high"], ...(config.optIn === false ? {} : { strictOutputModels: ["openai/gpt-6-astra#high"] }) }] }
  const api = createExecutionApi(deps, options) as ReturnType<typeof createExecutionApi> & Hooks
  const scope = { ...auth, directory: deps.directory, missionId: "strict-mission" }
  const ensure = () => api.handle("ensureTeam", { ...scope, teamName: "strict-team", controllerId: "controller", leaseMs: 300000, ...(config.maxRunning === undefined ? {} : { maxRunning: config.maxRunning }) })
  const submit = (extra: Record<string, unknown> = {}) => api.handle("submit", { ...scope, controllerId: "controller", expectedRevision: 1, taskId: "task", attemptId: "attempt", executionId: "execution", idempotencyKey: "key", profile: "explore", model, prompt: "fixture", output, ...extra })
  const record = async () => (await api.handle("inspect", { ...scope, executionId: "execution" })).execution!
  const stored = () => JSON.parse((deps.db.query("SELECT payload FROM execution_record").get() as { payload: string }).payload)
  const identity = (): Identity => ({ sessionID: stored().nativeSessionId, model, agent: "explore", kind: "primary" })
  const http = async () => {
    expect(typeof api.beforeHttp).toBe("function")
    const event = { ...identity(), request: new Request("https://chatgpt.com/backend-api/codex/responses", { method: "POST", headers: { "content-type": "application/json", authorization: "never persist" }, body: JSON.stringify({ model: model.id, input: "private prompt", tools: [] }) }) }
    await api.beforeHttp(event); return event
  }
  const completeHttp = async (request: Identity & { request: Request }) => {
    const event = { ...request, response: new Response('data: {"type":"response.completed","response":{"id":"response-1","status":"completed"}}\n\n', { headers: { "content-type": "text/event-stream" } }) }
    await api.afterHttp(event)
    await event.response.text()
  }
  const answer = (extra: Record<string, unknown> = {}) => { const id = identity().sessionID; contexts.get(id)!.push({ id: "assistant", type: "assistant", agent: "explore", model, finish: "stop", time: { created: 10, completed: 20 }, content: [{ type: "text", text: '{"result":7}' }], ...extra }); sessions.get(id)!.outcome = "succeeded" }
  return { deps, api, options, contexts, sessions, scope, ensure, submit, record, stored, identity, http, completeHttp, answer, counts: () => ({ creates, sends }) }
}

describe("strict execution admission and durable result", () => {
  test.each([{ optIn: false }, { hooks: false }, { capture: false }])("missing strict opt-in/runtime rejects before allocation %#", async config => {
    const f = fixture(config); await f.ensure()
    await expect(f.submit()).rejects.toThrow()
    expect(f.counts()).toEqual({ creates: 1, sends: 0 })
  })
  test("capability reports effective transport plus context, never model catalogue tools", async () => {
    const f = fixture()
    expect((await f.api.handle("capabilities", auth)).capabilities).toMatchObject({ outputSchemaStrict: true, outputSchemaProtocols: ["openai-responses-v1"] })
    const missing = fixture({ capture: false })
    expect((await missing.api.handle("capabilities", auth)).capabilities).toMatchObject({ outputSchemaStrict: false, outputSchemaProtocols: [] })
  })
  test.each([{ output: { ...output, route: "unknown" } }, { output: { ...output, schemaSha256: "bad" } }, { output: { ...output, strict: false } }, { model: { providerID: "fixture", id: "small", variant: "high" } }, { model: { ...model, variant: "default" } }, { profile: "foreign" }])("invalid strict selection/schema rejected before allocation %#", async extra => {
    const f = fixture(); await f.ensure(); await expect(f.submit(extra)).rejects.toThrow(); expect(f.counts()).toEqual({ creates: 1, sends: 0 })
  })
  test("output persists, is part of idempotency, and cannot be changed on replay", async () => {
    const f = fixture(); await f.ensure(); const receipt = await f.submit()
    expect(f.stored().output).toEqual(output)
    expect(await f.submit({ expectedRevision: 0 })).toEqual(receipt)
    await expect(f.submit({ output: { ...output, name: "changed" } })).rejects.toThrow("idempotency")
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })
  test("outcome/report alone never completes strict; missing capture and witness cannot succeed", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    f.sessions.get(f.identity().sessionID)!.outcome = "succeeded"
    const team = f.deps.db.query("SELECT id FROM team WHERE name='strict-team'").get() as { id: string }
    f.deps.db.run("INSERT INTO team_message (id,team_id,from_name,to_name,content,time_created) VALUES (?,?,?,?,?,?)", ["report", team.id, f.stored().memberName, "lead", '<task-result><status>completed</status><summary>claimed success</summary><details>report only</details></task-result>', 1010])
    const reported = await f.record()
    expect(reported.reports?.[0]?.status).toBe("completed")
    expect(reported.state).not.toBe("completed")
    f.answer()
    expect((await f.record()).state).not.toBe("completed")
    expect(f.deps.db.query("SELECT status FROM team_task WHERE id='task'").get()).not.toEqual({ status: "completed" })
  })
  test("valid capture completes only after injection witness and survives reopen/replay without new work", async () => {
    const f = fixture(); await f.ensure(); await f.submit(); await f.completeHttp(await f.http()); f.answer()
    const record = await f.record()
    expect(record).toMatchObject({ state: "completed", output, structuredResult: { value: { result: 7 }, sha256: hash({ result: 7 }), schemaSha256: output.schemaSha256, native: { sessionId: f.identity().sessionID, messageID: "assistant", profile: "explore", model } } })
    expect(f.stored().outputWitnesses).toHaveLength(1)
    expect(f.stored().outputWitnesses[0]).toMatchObject({ executionId: record.executionId, sessionId: record.nativeSessionId, transport: "http", model, schemaSha256: output.schemaSha256, endpoint: "https://chatgpt.com/backend-api/codex/responses" })
    expect(JSON.stringify(f.stored().outputWitnesses)).not.toMatch(/private prompt|never persist|authorization/)
    const reopened = createExecutionApi(f.deps, f.options)
    expect((await reopened.handle("inspect", { ...f.scope, executionId: "execution" })).execution).toEqual(record)
    await reopened.handle("replay", f.scope)
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })
  test("swapped witnesses cannot complete two executions with identical schema, model and wire body", async () => {
    const f = fixture({ maxRunning: 2 }); await f.ensure(); await f.submit()
    await f.submit({ expectedRevision: 2, taskId: "task-b", attemptId: "attempt-b", executionId: "execution-b", idempotencyKey: "key-b" })
    const second = JSON.parse((f.deps.db.query("SELECT payload FROM execution_record WHERE execution_id='execution-b'").get() as { payload: string }).payload) as { nativeSessionId: string }
    const firstRequest = await f.http()
    const secondRequest = { ...firstRequest, sessionID: second.nativeSessionId, request: new Request(firstRequest.request, { body: await firstRequest.request.clone().text() }) }
    await f.api.beforeHttp(secondRequest)
    await f.completeHttp(firstRequest); await f.completeHttp(secondRequest)
    f.answer()
    const assistant = f.contexts.get(f.identity().sessionID)!.at(-1) as Record<string, unknown>
    f.contexts.get(second.nativeSessionId)!.push({ ...structuredClone(assistant), id: "assistant-b" })
    f.sessions.get(second.nativeSessionId)!.outcome = "succeeded"
    const witnesses = f.deps.db.query("SELECT execution_id,payload FROM execution_output_witness ORDER BY id").all() as Array<{ execution_id: string; payload: string }>
    expect(witnesses).toHaveLength(2)
    expect(JSON.parse(witnesses[0]!.payload).requestBodySha256).toBe(JSON.parse(witnesses[1]!.payload).requestBodySha256)
    f.deps.db.run("UPDATE execution_output_witness SET payload=? WHERE execution_id=?", [witnesses[1]!.payload, "execution"])
    f.deps.db.run("UPDATE execution_output_witness SET payload=? WHERE execution_id=?", [witnesses[0]!.payload, "execution-b"])
    const swapped = f.deps.db.query("SELECT execution_id,payload FROM execution_output_witness ORDER BY id").all()
    const reopened = createExecutionApi(f.deps, f.options)
    for (const executionId of ["execution", "execution-b"]) {
      const record = (await reopened.handle("inspect", { ...f.scope, executionId })).execution!
      expect(record.state).not.toBe("completed")
      expect(record.structuredResult).toBeUndefined()
    }
    expect(f.deps.db.query("SELECT execution_id,payload FROM execution_output_witness ORDER BY id").all()).toEqual(swapped)
    expect(f.counts()).toEqual({ creates: 3, sends: 2 })
  })
  test.each(["executionId", "sessionId", "schemaSha256", "model", "legacy"])("every witness must correlate: %s is never hidden or repaired", async field => {
    const f = fixture(); await f.ensure(); await f.submit(); await f.completeHttp(await f.http()); f.answer()
    const original = f.deps.db.query("SELECT payload FROM execution_output_witness WHERE execution_id='execution'").get() as { payload: string }
    const invalid = JSON.parse(original.payload) as Record<string, unknown>
    if (field === "legacy") { delete invalid.executionId; delete invalid.sessionId }
    else invalid[field] = field === "model" ? { ...model, variant: "default" } : field === "schemaSha256" ? "0".repeat(64) : "foreign"
    if (field === "legacy") f.deps.db.run("UPDATE execution_output_witness SET payload=? WHERE execution_id='execution'", [JSON.stringify(invalid)])
    else f.deps.db.run("INSERT INTO execution_output_witness (execution_id,payload) VALUES (?,?)", ["execution", JSON.stringify(invalid)])
    const raw = f.deps.db.query("SELECT payload FROM execution_output_witness ORDER BY id").all()
    const record = await f.record()
    expect(record.state).not.toBe("completed")
    expect(record.structuredResult).toBeUndefined()
    expect(record.outputWitnesses?.at(-1) as unknown).toEqual(invalid)
    expect(record.outputWitnesses).toHaveLength(field === "legacy" ? 1 : 2)
    expect(f.deps.db.query("SELECT payload FROM execution_output_witness ORDER BY id").all()).toEqual(raw)
  })
  test("historical completion with legacy unbound witnesses cannot be accepted after reopen", async () => {
    const f = fixture(); await f.ensure(); await f.submit(); await f.completeHttp(await f.http()); f.answer()
    expect((await f.record()).state).toBe("completed")
    const history = f.deps.db.query("SELECT id,payload FROM execution_event ORDER BY id").all() as Array<{ id: number; payload: string }>
    const raw = JSON.parse((f.deps.db.query("SELECT payload FROM execution_output_witness WHERE execution_id='execution'").get() as { payload: string }).payload)
    delete raw.executionId; delete raw.sessionId
    const legacy = JSON.stringify(raw)
    f.deps.db.run("UPDATE execution_output_witness SET payload=? WHERE execution_id='execution'", [legacy])
    const reopened = createExecutionApi(f.deps, f.options)
    const record = (await reopened.handle("inspect", { ...f.scope, executionId: "execution" })).execution!
    expect(record.state).not.toBe("completed")
    expect(record.structuredResult).toBeUndefined()
    expect(f.deps.db.query("SELECT payload FROM execution_output_witness WHERE execution_id='execution'").get()).toEqual({ payload: legacy })
    expect(f.deps.db.query("SELECT id,payload FROM execution_event WHERE id<=? ORDER BY id").all(history.at(-1)!.id)).toEqual(history)
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })
  test("lost reply/reopen keeps strict provenance without retransmission", async () => {
    const f = fixture(); await f.ensure()
    const send = f.deps.client.session.promptAsync
    f.deps.client.session.promptAsync = async input => { await send(input); throw Object.assign(new Error("reply lost"), { _tag: "TransportError" }) }
    await f.submit(); await new Promise(resolve => setTimeout(resolve, 0)); await f.completeHttp(await f.http()); f.answer()
    const reopened = createExecutionApi(f.deps, f.options)
    const record = (await reopened.handle("inspect", { ...f.scope, executionId: "execution" })).execution!
    expect(record).toMatchObject({ state: "completed", nativeIntentReceipt: { messageId: "user" }, structuredResult: { native: { messageID: "assistant", model } } })
    const before = record.nativeSessionId
    await f.submit({ expectedRevision: 0 })
    expect((await reopened.handle("snapshot", f.scope)).executions?.[0]?.nativeSessionId).toBe(before)
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })
  test("physical database reopen retains output, witness, native refs and immutable result", async () => {
    const directory = join(process.cwd(), ".tmp", "execution-bridge")
    mkdirSync(directory, { recursive: true })
    const filename = join(directory, `strict-${randomUUID()}.db`)
    const f = fixture({ db: createDb(filename) })
    let reopened: ReturnType<typeof createDb> | undefined
    try {
      await f.ensure(); await f.submit(); await f.completeHttp(await f.http()); f.answer()
      const completed = await f.record()
      expect(completed.state).toBe("completed")
      await new Promise(resolve => setTimeout(resolve, 0))
      f.deps.db.close()
      reopened = createDb(filename)
      const api = createExecutionApi({ ...f.deps, db: reopened }, f.options)
      expect((await api.handle("inspect", { ...f.scope, executionId: "execution" })).execution).toEqual(completed)
      expect(f.counts()).toEqual({ creates: 2, sends: 1 })
    } finally {
      if (reopened) reopened.close(); else f.deps.db.close()
      for (const suffix of ["", "-wal", "-shm"]) rmSync(filename + suffix, { force: true })
    }
  })
  test("late delivery ack cannot erase strict result or durable witness", async () => {
    const f = fixture(); await f.ensure()
    const send = f.deps.client.session.promptAsync
    let acknowledge: () => void = () => {}
    f.deps.client.session.promptAsync = async input => { await send(input); await new Promise<void>(resolve => { acknowledge = resolve }) }
    await f.submit(); await new Promise(resolve => setTimeout(resolve, 0)); await f.completeHttp(await f.http()); f.answer()
    const complete = await f.record()
    expect(complete.state).toBe("completed")
    acknowledge(); await new Promise(resolve => setTimeout(resolve, 0))
    expect(await f.record()).toEqual(complete)
  })
  test("strict runtime is rechecked before delayed native transmission", async () => {
    const f = fixture(); await f.ensure()
    const create = f.deps.client.session.create
    f.deps.client.session.create = async input => { const result = await create(input); delete f.deps.client.session.readOutputContext; return result }
    await f.submit(); await new Promise(resolve => setTimeout(resolve, 0))
    expect(f.counts()).toEqual({ creates: 2, sends: 0 })
    expect((await f.record()).state).toBe("failed")
  })
  test("missing read witness blocks strict completion, then verified leaf allows it", async () => {
    const f = fixture(); await f.ensure()
    const access = { action: "read", resource: `${f.deps.directory}/source.asm` }
    await f.submit({ resourceBoundary: [access], expectedAccess: [access] }); await f.completeHttp(await f.http()); f.answer()
    expect((await f.record()).state).not.toBe("completed")
    const event = { sessionID: f.identity().sessionID, agent: "explore", messageID: "read-msg", id: "read-call", tool: "read", input: { filePath: access.resource } }
    await f.api.beforeTool(event); await f.api.observeTool({ ...event, status: "completed" })
    expect((await f.record()).state).toBe("completed")
  })
  test.each([undefined, false])("native-query recovery cannot bypass expected read witnesses without a boundary (%s)", async accessVerified => {
    const f = fixture(); await f.ensure()
    const access = { action: "read", resource: `${f.deps.directory}/source.asm` }
    f.deps.permissionEvaluator = { source: "fixture-native-query", evaluate: async () => ({ effect: "allow" }) }
    await f.submit({ requiredAccess: [access] }); await f.completeHttp(await f.http()); f.answer()
    // Public admission rejects mixed query/boundary inputs. Exercise the durable
    // recovery seam with expectedAccess on a native-query record, not a fake read.
    const persisted = f.stored()
    expect(persisted.selection.resourceBoundary).toBeUndefined()
    expect(persisted.selection.evaluatedAccess).toEqual([expect.objectContaining({ ...access, effect: "allow" })])
    persisted.selection.expectedAccess = [access]
    if (accessVerified !== undefined) persisted.accessVerified = accessVerified
    f.deps.db.run("UPDATE execution_record SET payload=? WHERE execution_id=?", [JSON.stringify(persisted), persisted.executionId])
    const reopened = createExecutionApi(f.deps, f.options)
    const record = (await reopened.handle("inspect", { ...f.scope, executionId: "execution" })).execution!
    expect(record.state).not.toBe("completed")
    expect(record.structuredResult).toBeUndefined()
    expect(record.accessWitnesses ?? []).toHaveLength(0)
    expect(f.deps.db.query("SELECT status FROM team_task WHERE id='task'").get()).not.toEqual({ status: "completed" })
  })
  test.each(["http", "websocket"])("assistant stop and injection witness await the current %s response.completed", async transport => {
    const f = fixture(); await f.ensure(); await f.submit()
    let request: Awaited<ReturnType<typeof f.http>> | undefined
    if (transport === "http") request = await f.http()
    else {
      await f.api.beforeWsHandshake({ ...f.identity(), url: "wss://chatgpt.com/backend-api/codex/responses", headers: {} })
      await f.api.beforeWsSend({ ...f.identity(), frame: JSON.stringify({ type: "response.create", model: model.id, input: [] }) })
      await f.api.afterWsReceive({ ...f.identity(), frame: '{"type":"response.created","response":{"id":"response-1","status":"in_progress"}}' })
    }
    f.answer()
    const pending = await f.record()
    expect(pending.outputWitnesses).toHaveLength(1)
    expect(pending.state).not.toBe("completed")
    expect(pending.structuredResult).toBeUndefined()
    expect((await createExecutionApi(f.deps, f.options).handle("inspect", { ...f.scope, executionId: "execution" })).execution?.state).not.toBe("completed")
    expect(f.deps.db.query("SELECT status FROM team_task WHERE id='task'").get()).not.toEqual({ status: "completed" })
    if (request) await f.completeHttp(request)
    else await f.api.afterWsReceive({ ...f.identity(), frame: '{"type":"response.completed","response":{"id":"response-1","status":"completed"}}' })
    expect((await f.record()).state).toBe("completed")
  })
  test("truncated HTTP stream without response.completed never accepts a native stop capture", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    const request = await f.http()
    const event = { ...request, response: new Response('data: {"type":"response.output_text.done","text":"{\\"result\\":7}"}\n\n', { headers: { "content-type": "text/event-stream" } }) }
    await f.api.afterHttp(event); await event.response.text(); f.answer()
    expect(f.deps.db.query("SELECT 1 FROM execution_output_pending WHERE execution_id='execution'").get()).not.toBeNull()
    const record = await f.record()
    expect(record.state).not.toBe("completed")
    expect(record.structuredResult).toBeUndefined()
    expect(f.deps.db.query("SELECT status FROM team_task WHERE id='task'").get()).not.toEqual({ status: "completed" })
  })
  test.each([{ finish: "length" }, { finish: "content-filter" }, { content: [{ type: "text", text: "not json" }] }, { content: [{ type: "tool" }] }, { model: { ...model, id: "foreign" } }])("invalid capture never accepts %#", async extra => {
    const f = fixture(); await f.ensure(); await f.submit(); await f.completeHttp(await f.http()); f.answer(extra)
    expect((await f.record()).state).toBe("failed")
    expect(f.stored().structuredResult).toBeUndefined()
  })
})

describe("owned strict public hooks", () => {
  test("auxiliary, foreign and legacy traffic unchanged", async () => {
    const f = fixture(); await f.ensure(); await f.submit(); expect(typeof f.api.beforeHttp).toBe("function")
    for (const identity of [{ ...f.identity(), kind: "title" }, { ...f.identity(), sessionID: "foreign" }]) {
      const request = new Request("https://foreign.invalid", { method: "POST", body: "opaque" }); const event = { ...identity, request }
      await f.api.beforeHttp(event); expect(event.request).toBe(request)
      const ws = { ...identity, frame: "unknown auxiliary frame" }
      await f.api.beforeWsSend(ws); expect(ws.frame).toBe("unknown auxiliary frame")
    }
    const legacy = fixture(); await legacy.ensure(); await legacy.submit({ output: undefined })
    const request = new Request("https://foreign.invalid"); const event = { ...legacy.identity(), request }
    await legacy.api.beforeHttp(event); expect(event.request).toBe(request)
  })
  test("native identity drift and unsupported endpoint fail execution without a witness", async () => {
    const f = fixture(); await f.ensure(); await f.submit(); expect(typeof f.api.beforeHttp).toBe("function")
    f.sessions.get(f.identity().sessionID)!.model = { ...model, variant: "default" }
    await expect(f.http()).rejects.toThrow()
    expect((await f.record()).state).toBe("failed")
    expect(f.stored().outputWitnesses ?? []).toHaveLength(0)
  })
  test("unsupported HTTP endpoint blocks primary and permanently fails strict", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    const request = new Request("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: model.id }) })
    await expect(f.api.beforeHttp({ ...f.identity(), request })).rejects.toThrow()
    expect((await f.record()).state).toBe("failed")
  })
  test("WS handshake/send preserves exact model and creates a durable witness; unknown frame blocks", async () => {
    const f = fixture(); await f.ensure(); await f.submit(); expect(typeof f.api.beforeWsHandshake).toBe("function")
    await f.api.beforeWsHandshake({ ...f.identity(), url: "wss://chatgpt.com/backend-api/codex/responses", headers: { authorization: "private" } })
    const event = { ...f.identity(), frame: JSON.stringify({ type: "response.create", model: model.id, input: [], tools: [] }) }
    await f.api.beforeWsSend(event)
    expect(JSON.parse(event.frame)).toMatchObject({ model: model.id, text: { format: { type: "json_schema", strict: true, name: "result", schema } } })
    expect(f.stored().outputWitnesses[0].transport).toBe("websocket")
    expect(f.stored().outputWitnesses[0]).toMatchObject({ executionId: "execution", sessionId: f.identity().sessionID })
    await expect(f.api.beforeWsSend({ ...f.identity(), frame: '{"type":"unknown"}' })).rejects.toThrow()
    expect((await f.record()).state).toBe("failed")
  })
  test("WS without handshake or unallowlisted handshake cannot send", async () => {
    const f = fixture(); await f.ensure(); await f.submit(); expect(typeof f.api.beforeWsSend).toBe("function")
    await expect(f.api.beforeWsSend({ ...f.identity(), frame: JSON.stringify({ type: "response.create", model: model.id }) })).rejects.toThrow()
    const bad = fixture(); await bad.ensure(); await bad.submit()
    await expect(bad.api.beforeWsHandshake({ ...bad.identity(), url: "wss://api.openai.com/v1/responses?unapproved=1", headers: {} })).rejects.toThrow()
    expect((await bad.record()).state).toBe("failed")
  })
  test("strict WS selection cannot silently downgrade to HTTP", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    await f.api.beforeWsHandshake({ ...f.identity(), url: "wss://chatgpt.com/backend-api/codex/responses", headers: {} })
    await expect(f.http()).rejects.toThrow()
    expect((await f.record()).state).toBe("failed")
    expect(f.stored().outputWitnesses ?? []).toHaveLength(0)
  })
  test("identical native requests cannot automatically regenerate after ambiguous transport", async () => {
    const f = fixture(); await f.ensure(); await f.submit(); await f.http()
    await expect(f.http()).rejects.toThrow()
    expect(f.stored().outputWitnesses).toHaveLength(1)
  })
  test("unsettled primary request blocks regeneration even if retry body changes", async () => {
    const f = fixture(); await f.ensure(); await f.submit(); await f.http()
    const request = new Request("https://chatgpt.com/backend-api/codex/responses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: model.id, input: "changed retry body" }) })
    await expect(f.api.beforeHttp({ ...f.identity(), request })).rejects.toThrow()
    expect(f.stored().outputWitnesses).toHaveLength(1)
  })
  test("completed provider response allows the next tool-loop request, with its own witness", async () => {
    for (const transport of ["http", "websocket"]) {
      const f = fixture(); await f.ensure(); await f.submit()
      if (transport === "http") {
        const req = await f.http()
        const event = { ...req, response: new Response('data: {"type":"response.completed","response":{"id":"response-1","status":"completed"}}\n\n', { headers: { "content-type": "text/event-stream" } }) }
        await f.api.afterHttp(event); await event.response.text()
        const request = new Request(req.request, { body: JSON.stringify({ model: model.id, input: "tool loop followup" }) })
        await f.api.beforeHttp({ ...f.identity(), request })
      } else {
        const handshake = { ...f.identity(), url: "wss://chatgpt.com/backend-api/codex/responses", headers: {} }
        await f.api.beforeWsHandshake(handshake)
        await f.api.beforeWsSend({ ...f.identity(), frame: JSON.stringify({ type: "response.create", model: model.id, input: [] }) })
        await f.api.afterWsReceive({ ...f.identity(), frame: '{"type":"response.created","response":{"id":"response-1","status":"in_progress"}}' })
        await f.api.afterWsReceive({ ...f.identity(), frame: '{"type":"response.completed","response":{"id":"response-1","status":"completed"}}' })
        await f.api.beforeWsHandshake(handshake)
        await f.api.beforeWsSend({ ...f.identity(), frame: JSON.stringify({ type: "response.create", model: model.id, input: [], previous_response_id: "response-1" }) })
      }
      expect(f.stored().outputWitnesses).toHaveLength(2)
      f.answer()
      expect((await f.record()).state).not.toBe("completed")
      expect(f.stored().structuredResult).toBeUndefined()
    }
  })
  test("foreign WS response completion cannot release the outstanding generation", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    await f.api.beforeWsHandshake({ ...f.identity(), url: "wss://chatgpt.com/backend-api/codex/responses", headers: {} })
    await f.api.beforeWsSend({ ...f.identity(), frame: JSON.stringify({ type: "response.create", model: model.id, input: [] }) })
    await f.api.afterWsReceive({ ...f.identity(), frame: '{"type":"response.created","response":{"id":"response-1","status":"in_progress"}}' })
    await expect(f.api.afterWsReceive({ ...f.identity(), frame: '{"type":"response.completed","response":{"id":"foreign","status":"completed"}}' })).rejects.toThrow()
    expect((await f.record()).state).toBe("failed")
  })
  test("a refusal encoded as valid JSON is still rejected on HTTP/WS", async () => {
    for (const transport of ["http", "websocket"]) {
      const f = fixture(); await f.ensure(); await f.submit(); const req = await f.http()
      const refusal = JSON.stringify({ type: "response.refusal.done", refusal: '{"result":7}' })
      if (transport === "websocket") await expect(f.api.afterWsReceive({ ...f.identity(), frame: refusal })).rejects.toThrow()
      else {
        const event = { ...req, response: new Response(`data: ${refusal}\n\n`, { headers: { "content-type": "text/event-stream" } }) }
        await f.api.afterHttp(event)
        await expect(event.response.text()).rejects.toThrow()
      }
      f.answer(); expect((await f.record()).state).toBe("failed")
    }
  })
})
