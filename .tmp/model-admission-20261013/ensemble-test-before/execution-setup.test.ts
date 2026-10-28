import { expect, test } from "bun:test"
import { setupEnsemble, type V2SetupContext } from "../src/v2-setup"
import { createHash } from "node:crypto"
import { insertTeam, insertMember } from "./helpers"
import type { ExecutionPermissionEvent } from "../src/execution-api"

test("native evaluate hook preserves bridge profile denies while legacy grants remain scoped", async () => {
  const hooks: Array<(event: ExecutionPermissionEvent) => Promise<void> | void> = []
  const toolHooks = new Map<string, (event: never) => unknown>()
  const sessions = new Map<string, Record<string, unknown>>()
  const noop = async () => ({ dispose: async () => {} })
  const directory = "/tmp/test-project"
  const ctx = {
    location: { directory }, options: {},
    session: {
      create: async (input: Record<string, unknown>) => { const id = String(input.id); sessions.set(id, { ...input }); return { id } }, get: async ({ sessionID }: { sessionID: string }) => sessions.get(sessionID),
      prompt: async () => {}, synthetic: async () => {}, switchAgent: async () => {}, switchModel: async () => {}, interrupt: async () => {}, context: async () => [], active: async () => ({}), hook: noop,
    },
    worktree: { create: async () => ({ directory: "/fixture/wt" }), remove: async () => {}, list: async () => [], refresh: async () => {} },
    permission: { hook: async (_name: string, callback: typeof hooks[number]) => { hooks.push(callback); return { dispose: async () => {} } } },
    agent: { get: async () => ({ id: "explore", permissions: [{ action: "execute", resource: "*", effect: "deny" }] }) },
    event: { subscribe: async function* () {} }, tool: { hook: async (name: string, callback: (event: never) => unknown) => { toolHooks.set(name, callback); return { dispose: async () => {} } }, transform: noop }, shell: { hook: noop },
    rpc: { register: async () => ({ events: { emit: async () => {} } }) },
  } as unknown as V2SetupContext
  const credentials = { principalId: "operator", token: "secret" }
  const handle = await setupEnsemble(ctx, { dbPath: ":memory:", dashboardPort: 0, execution: {
    principals: [{ id: "operator", tokenSha256: createHash("sha256").update("secret").digest("hex"), directories: [directory], profiles: ["explore"], models: ["fixture/small#high"] }],
    profile: async () => ({ id: "explore" }),
  } })
  try {
    const scope = { ...credentials, missionId: "permission-mission", directory }
    await handle.execution.handle("ensureTeam", { ...scope, teamName: "permission-team", controllerId: "controller", leaseMs: 30000 })
    const resourceBoundary = [{ action: "read", resource: "/tmp/test-project/authorized/source.asm" }, { action: "execute", resource: "*" }, { action: "team_message", resource: "*" }]
    await handle.execution.handle("submit", { ...scope, controllerId: "controller", expectedRevision: 1, taskId: "task", attemptId: "attempt", executionId: "execution", idempotencyKey: "key", profile: "explore", model: { providerID: "fixture", id: "small", variant: "high" }, prompt: "Report to lead", worktree: false, resourceBoundary, expectedAccess: [resourceBoundary[0]] })
    const worker = handle.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    for (const action of ["execute", "team_results", "team_status", "team_view", "team_message"]) {
      const event = { sessionID: worker.session_id, action, resources: ["*"], effect: "deny" }
      for (const hook of hooks) await hook(event)
      expect(event.effect).toBe("deny")
    }
    expect((await handle.execution.handle("capabilities", credentials)).capabilities?.permissionPreflight).toBe(false)
    expect((await handle.execution.handle("capabilities", credentials)).capabilities?.resourceBoundary).toBe(true)
    const read: ExecutionPermissionEvent = Object.create({ sessionID: worker.session_id, agent: "explore", action: "read", resources: ["/tmp/test-project/authorized/source.asm"], effect: "allow", source: { type: "tool", messageID: "native-message", id: "native-read" } })
    for (const hook of hooks) await hook(read)
    await toolHooks.get("execute.before")?.({ sessionID: worker.session_id, agent: "explore", tool: "read", messageID: "native-message", id: "native-read", input: { filePath: "authorized/source.asm" } } as never)
    await toolHooks.get("execute.after")?.({ sessionID: worker.session_id, agent: "explore", tool: "read", messageID: "native-message", id: "native-read", status: "completed", input: { filePath: "authorized/source.asm" }, result: { content: "fixture output" } } as never)
    expect((await handle.execution.handle("snapshot", scope)).executions?.[0]?.accessVerified).toBe(true)
    await expect(toolHooks.get("execute.before")?.({ sessionID: worker.session_id, tool: "team_message", input: { to: "peer", text: "leak" } } as never)).rejects.toThrow("lead")
    insertTeam(handle.db, "legacy-team", "legacy", "legacy-lead")
    insertMember(handle.db, "legacy-team", "legacy-worker", "legacy-session")
    handle.registry.register("legacy-team", "legacy-worker", "legacy-session")
    const legacy = { sessionID: "legacy-session", action: "execute", resources: ["*"], effect: "deny" }
    for (const hook of hooks) await hook(legacy)
    expect(legacy.effect).toBe("allow")
  } finally { await handle.dispose(); handle.db.close() }
})

test("V2 registers real public execution RPC on an explicitly isolated database", async () => {
  const registered = new Map<string, Record<string, (input: unknown, context: unknown) => Promise<unknown>>>()
  const noop = async () => ({ dispose: async () => {} })
  const ctx = {
    location: { directory: "/fixture/execution" }, options: {},
    session: { create: async () => ({ id: "native" }), get: async () => undefined, prompt: async () => {}, synthetic: async () => {}, switchAgent: async () => {}, switchModel: async () => {}, interrupt: async () => {}, context: async () => [], active: async () => ({}), hook: noop },
    worktree: { create: async () => ({ directory: "/fixture/wt" }), remove: async () => {}, list: async () => [], refresh: async () => {} },
    permission: {}, agent: { get: async () => ({ id: "explore" }) },
    event: { subscribe: async function* () {} }, tool: { hook: noop, transform: noop }, shell: { hook: noop },
    rpc: { register: async (definition: unknown, handlers: Record<string, (input: unknown, context: unknown) => Promise<unknown>>) => { registered.set((definition as { id: string }).id, handlers); return { events: { emit: async () => {} } } } },
  } as unknown as V2SetupContext
  const handle = await setupEnsemble(ctx, { dbPath: ":memory:", dashboardPort: 0 })
  try {
    expect(registered.has("ensemble.execution.v1")).toBe(true)
    const capabilities = registered.get("ensemble.execution.v1")?.capabilities
    await expect(capabilities?.({ principalId: "operator", token: "secret" }, {})).rejects.toThrow("auth")
  } finally { await handle.dispose(); handle.db.close() }
})

test("V2 adapter forwards durable native ID, model, agent and metadata to public create", async () => {
  const { createV2Client } = await import("../src/v2-client")
  const calls: Record<string, unknown>[] = []
  const ctx = { session: { create: async (input: Record<string, unknown>) => { calls.push(input); return { id: String(input.id) } } } }
  const client = createV2Client(ctx as unknown as Parameters<typeof createV2Client>[0])
  await client.session.create({ id: "ses_durable", agent: "explore", model: { providerID: "fixture", id: "small", variant: "high" }, metadata: { "ensemble.execution": "execution" }, directory: "/fixture", permission: [] })
  expect(calls[0]?.id).toBe("ses_durable")
  expect(calls[0]?.model).toEqual({ providerID: "fixture", id: "small", variant: "high" })
  expect((calls[0]?.metadata as Record<string, unknown>)["ensemble.execution"]).toBe("execution")
})
