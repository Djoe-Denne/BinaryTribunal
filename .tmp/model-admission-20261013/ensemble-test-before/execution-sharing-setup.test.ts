import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { setupEnsemble, type V2SetupContext } from "../src/v2-setup"
import { executionJsonSha256 } from "../src/execution-output"
import type { V2ToolDef } from "../src/v2-tools"

test.each([true, false])("default SDK boundary registers native bulletin tools, isolates context and reports real runtime capabilities (strict=%s)", async strict => {
  const directory = mkdtempSync(join(tmpdir(), "ensemble-sharing-"))
  const tools = new Map<string, V2ToolDef>(), hooks = new Map<string, (event: never) => unknown>(), sessions = new Map<string, Record<string, unknown>>()
  const rpcs = new Map<string, Record<string, (input: unknown, context: unknown) => Promise<unknown>>>()
  const prompts: unknown[] = [], synthetic: unknown[] = [], profileRequests: unknown[] = []
  const noop = async () => ({ dispose: async () => {} })
  const model = { providerID: "openai", id: "gpt-6-astra", variant: "high" }
  mkdirSync(join(directory, ".opencode"))
  writeFileSync(join(directory, ".opencode/ensemble-execution.json"), JSON.stringify({ version: 1, principals: [{ id: "operator", tokenSha256: createHash("sha256").update("secret").digest("hex"), directories: [directory], profiles: ["explore"], models: ["openai/gpt-6-astra#high"], strictOutputModels: ["openai/gpt-6-astra#high"], bulletin: true, nativeToolBindings: [{ tool: "fixture_lookup", accesses: [{ action: "read", resource: "fixture:catalog" }] }] }] }))
  const ctx = {
    location: { directory }, options: {},
    session: { create: async (input: Record<string, unknown>) => { const id = String(input.id); sessions.set(id, input); return { id } }, get: async ({ sessionID }: { sessionID: string }) => sessions.get(sessionID), prompt: async (input: unknown) => { prompts.push(input) }, synthetic: async (input: unknown) => { synthetic.push(input) }, switchAgent: async () => {}, switchModel: async () => {}, interrupt: async () => {}, context: async () => [], active: async () => ({}), hook: async (name: string, fn: (event: never) => unknown) => { hooks.set(name, fn); return noop() } },
    worktree: { create: async () => ({ directory }), remove: async () => {}, list: async () => [], refresh: async () => {} },
    permission: { hook: noop }, agent: { get: async (input: unknown) => { profileRequests.push(input); return { location: { directory }, data: { id: "explore" } } } }, event: { subscribe: async function* () {} },
    tool: { list: async () => [{ id: "fixture_lookup", input: { type: "object" } }, ...Array.from(tools.values()).map(t => ({ id: t.name, input: t.input }))], hook: async (name: string, fn: (event: never) => unknown) => { hooks.set(name, fn); return noop() }, transform: async (fn: (editor: { add(def: V2ToolDef): void }) => void) => { fn({ add: def => { tools.set(def.name, def) } }); return noop() } },
    shell: { hook: noop }, rpc: { register: async (definition: { id: string }, handlers: Record<string, (input: unknown, context: unknown) => Promise<unknown>>) => { rpcs.set(definition.id, handlers); return { events: { emit: async () => {} } } } },
  } as unknown as V2SetupContext
  const handle = await setupEnsemble(ctx, { dbPath: ":memory:", dashboardPort: 0 })
  try {
    expect(tools.has("execution_bulletin_publish")).toBe(true)
    expect(tools.has("execution_bulletin_read")).toBe(true)
    const auth = { principalId: "operator", token: "secret" }, scope = { ...auth, directory, missionId: "strict-sharing" }
    const capabilities = (await handle.execution.handle("capabilities", auth)).capabilities!
    expect(capabilities.scopedBulletin).toBe(true); expect(capabilities.nativeToolBindings).toBe(true)
    const schema = { type: "object", properties: { value: { type: "string" } }, required: ["value"], additionalProperties: false }, schemaSha256 = executionJsonSha256(schema)
    await handle.execution.handle("ensureTeam", { ...scope, teamName: "strict-sharing", controllerId: "controller", leaseMs: 300000 })
    await handle.execution.handle("submit", { ...scope, controllerId: "controller", expectedRevision: 1, executionId: "execution", taskId: "task", attemptId: "attempt", idempotencyKey: "key", profile: "explore", model, prompt: "Return JSON", communication: { mode: "bulletin", channel: "group", read: true, publish: true, schema, schemaSha256 }, ...(strict ? { output: { mode: "json_schema", strict: true, name: "result", schema, schemaSha256, route: "openai-responses-v1" } } : {}) })
    await Promise.resolve(); await Promise.resolve()
    const worker = handle.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    expect(profileRequests).toContainEqual({ agentID: "explore" })
    const context = Object.create({ sessionID: worker.session_id, agent: "explore", messageID: "message", id: "call" })
    const args = { key: "observation", payload: { value: "provisional" } }, event = { ...args, sessionID: worker.session_id, agent: "explore", messageID: "message", id: "call", tool: "execution_bulletin_publish", input: args }
    await hooks.get("execute.before")?.(event as never)
    const result = await tools.get("execution_bulletin_publish")!.execute(args, context)
    const bulletin = JSON.parse(result.content)
    expect(bulletin.author.sessionId).toBe(worker.session_id)
    await hooks.get("execute.after")?.({ ...event, status: "completed", result } as never)
    await expect(tools.get("execution_bulletin_read")!.execute({ sessionID: worker.session_id }, Object.create({ sessionID: "foreign" }))).rejects.toThrow()
    await expect(hooks.get("execute.before")?.({ ...event, tool: "team_message", input: { to: "lead", text: "bypass" } } as never)).rejects.toThrow()
    await expect(rpcs.get("ensemble.execution.v1")!.bulletinSnapshot!({ ...scope, token: "wrong" }, { signal: new AbortController().signal, error: (_type: string, message: string) => new Error(message), sessionID: worker.session_id })).rejects.toThrow()
    const prompt = { sessionID: worker.session_id, messages: [], system: [] as unknown[] }
    expect(hooks.has("context")).toBe(true)
    await hooks.get("context")!(prompt as never)
    expect(JSON.stringify(prompt.system)).not.toContain("provisional")
    expect(prompt.system).toHaveLength(strict ? 1 : 0)
    const compact = { sessionID: worker.session_id, system: [{ type: "text", text: "original" }] }
    await hooks.get("compaction")!(compact as never)
    expect(compact.system).toEqual([{ type: "text", text: "original" }])
    await handle.dispatch({ type: "session.status", data: { sessionID: worker.session_id, status: "idle" } })
    expect(prompts).toHaveLength(1); expect(synthetic).toHaveLength(0)
  } finally { await handle.dispose(); handle.db.close(); rmSync(directory, { recursive: true, force: true }) }
})

test.each(["execute.before", "execute.after", "permission", "inventory", "transform"])("SDK runtime advertises missing native capability honestly: %s", async missing => {
  const noop = async () => ({ dispose: async () => {} })
  const ctx = {
    location: { directory: "/fixture/runtime" }, options: {},
    session: { create: async () => { throw new Error("no native allocation expected") }, get: async () => undefined, prompt: async () => {}, synthetic: async () => {}, switchAgent: async () => {}, switchModel: async () => {}, interrupt: async () => {}, context: async () => [], active: async () => ({}), hook: noop },
    worktree: { create: async () => ({ directory: "/fixture/runtime" }), remove: async () => {}, list: async () => [], refresh: async () => {} },
    permission: missing === "permission" ? {} : { hook: noop }, event: { subscribe: async function* () {} },
    tool: { ...(missing === "inventory" ? {} : { list: async () => [] }), hook: async (name: string) => name === missing ? undefined : noop(), transform: async () => missing === "transform" ? undefined : noop() },
    shell: { hook: noop }, rpc: { register: async () => ({ events: { emit: async () => {} } }) },
  } as unknown as V2SetupContext
  const auth = { principalId: "operator", token: "secret" }
  const handle = await setupEnsemble(ctx, { dbPath: ":memory:", dashboardPort: 0, execution: { principals: [{ id: auth.principalId, tokenSha256: createHash("sha256").update(auth.token).digest("hex"), directories: [ctx.location.directory], profiles: ["explore"], models: ["fixture/small#high"], bulletin: true }] } })
  try {
    const capability = (await handle.execution.handle("capabilities", auth)).capabilities!
    expect(capability.scopedBulletin).toBe(missing === "inventory")
    expect(capability.nativeToolBindings).toBe(missing === "transform")
  } finally { await handle.dispose(); handle.db.close() }
})
