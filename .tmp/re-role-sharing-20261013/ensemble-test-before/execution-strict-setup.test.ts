import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { setupEnsemble, type V2SetupContext } from "../src/v2-setup"
import { createV2Client } from "../src/v2-client"
import { parseExecutionConfig } from "../src/execution-auth"

test.each([undefined, "experimental.ws.send", "http.response"])("strict runtime requires every real transport hook: %s", async missing => {
  const hooks = new Map<string, (event: never) => unknown>()
  const noop = async () => ({ dispose: async () => {} })
  const ctx = {
    location: { directory: "/fixture/strict" }, options: {},
    session: { create: async () => ({ id: "unused" }), get: async () => undefined, prompt: async () => {}, synthetic: async () => {}, switchAgent: async () => {}, switchModel: async () => {}, interrupt: async () => {}, context: async () => [], active: async () => ({}), hook: async (name: string, cb: (event: never) => unknown) => { if (name === missing) throw new Error("unsupported hook"); hooks.set(name, cb); return noop() } },
    worktree: { create: async () => ({ directory: "/fixture/wt" }), remove: async () => {}, list: async () => [], refresh: async () => {} },
    permission: {}, agent: { get: async () => ({ id: "explore" }) }, event: { subscribe: async function* () {} }, tool: { hook: noop, transform: noop }, shell: { hook: noop }, rpc: { register: async () => ({ events: { emit: async () => {} } }) },
  } as unknown as V2SetupContext
  const handle = await setupEnsemble(ctx, { dbPath: ":memory:", dashboardPort: 0, execution: { principals: [{ id: "operator", tokenSha256: createHash("sha256").update("secret").digest("hex"), directories: [ctx.location.directory], profiles: ["explore"], models: ["openai/gpt-6-astra#high"] }] } })
  try {
    const capabilities = (await handle.execution.handle("capabilities", { principalId: "operator", token: "secret" })).capabilities!
    expect(capabilities.outputSchemaStrict).toBe(missing === undefined)
    expect(capabilities.outputSchemaProtocols).toEqual(missing ? [] : ["openai-responses-v1"])
    if (!missing) for (const name of ["http.request", "http.response", "experimental.ws.handshake", "experimental.ws.send", "experimental.ws.receive"]) expect(hooks.has(name)).toBe(true)
    // SDK retry lacks kind: changing it would also affect auxiliary requests.
    expect(hooks.has("retry")).toBe(false)
    expect(hooks.has("provider.request")).toBe(false)
  } finally {
    await handle.dispose()
    try { expect((await handle.execution.handle("capabilities", { principalId: "operator", token: "secret" })).capabilities?.outputSchemaStrict).toBe(false) }
    finally { handle.db.close() }
  }
})

test("V2 capture seam uses only public context scoped by session", async () => {
  const calls: unknown[] = [], messages = [{ id: "owned", type: "assistant" }]
  const ctx = { session: { context: async (input: unknown) => { calls.push(input); return messages } } }
  const client = createV2Client(ctx as unknown as Parameters<typeof createV2Client>[0])
  const capture = (client.session as typeof client.session & { readOutputContext?: (input: { sessionID: string }) => Promise<unknown[]> }).readOutputContext
  expect(typeof capture).toBe("function")
  expect(await capture?.({ sessionID: "native" })).toEqual(messages)
  expect(calls).toEqual([{ sessionID: "native" }])
})

test("operator strictOutputModels is exact, parsed, and a subset of authorized models", () => {
  const principal = { id: "operator", tokenSha256: createHash("sha256").update("secret").digest("hex"), directories: ["/fixture"], profiles: ["explore"], models: ["openai/gpt-6-astra#high"], strictOutputModels: ["openai/gpt-6-astra#high"] }
  expect(parseExecutionConfig({ version: 1, principals: [principal] })[0]).toEqual(principal)
  for (const strictOutputModels of [["openai/gpt-6-astra"], ["openai/gpt-6-astra#default"], ["openai/*"], ["zai/other#high"], "openai/gpt-6-astra#high"]) expect(() => parseExecutionConfig({ version: 1, principals: [{ ...principal, strictOutputModels }] })).toThrow()
})
