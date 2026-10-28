import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { createExecutionApi } from "../src/execution-api"
import { mapExecutionNativeTool } from "../src/execution-native-tools"
import { setupDeps } from "./helpers"

test("public filesystem tool adapters resolve root-relative inputs and reject traversal/foreign paths", () => {
  expect(mapExecutionNativeTool("C:/fixture", "read", { filePath: "inputs/source.asm" })).toEqual([{ action: "read", resource: "C:/fixture/inputs/source.asm" }])
  expect(mapExecutionNativeTool("C:/fixture", "write", { filePath: "outputs/result.json", content: "NEVER RETAIN CONTENT" })).toEqual([{ action: "edit", resource: "C:/fixture/outputs/result.json" }])
  expect(() => mapExecutionNativeTool("C:/fixture", "read", { filePath: "../outside.asm" })).toThrow("traversal")
  expect(() => mapExecutionNativeTool("C:/fixture", "read", { filePath: "D:/foreign.asm" })).toThrow("outside")
  expect(() => mapExecutionNativeTool("C:/fixture", "shell", { command: "cat private" })).toThrow("unmapped")
  expect(mapExecutionNativeTool("C:/fixture", "apply_patch", { patchText: "*** Begin Patch\n*** Update File: outputs/old.txt\n*** Move to: outputs/new.txt\n@@\n-secret\n+private\n*** End Patch" })).toEqual([{ action: "edit", resource: "C:/fixture/outputs/old.txt" }, { action: "edit", resource: "C:/fixture/outputs/new.txt" }])
})

async function fixture() {
  const deps = setupDeps(); deps.directory = "C:/fixture"
  const native = new Map<string, Record<string, unknown>>()
  deps.client.session.create = async input => { const id = String(input.id); native.set(id, { id, model: input.model, agent: input.agent, metadata: input.metadata, permissions: input.permission, location: { directory: deps.directory } }); return { data: { id } } }
  deps.client.session.get = async input => ({ data: native.get(input.sessionID) })
  const options = { principals: [{ id: "operator", tokenSha256: createHash("sha256").update("secret").digest("hex"), directories: [deps.directory], profiles: ["native-profile"], models: ["fixture/small#high"] }], profile: async () => ({ id: "native-profile", permissions: [] }), nativeAccessWitness: true }
  const api = createExecutionApi(deps, options)
  const scope = { principalId: "operator", token: "secret", directory: deps.directory, missionId: "native-tools" }
  await api.handle("ensureTeam", { ...scope, teamName: "native-tools", controllerId: "c", leaseMs: 300000 })
  await api.handle("submit", { ...scope, controllerId: "c", expectedRevision: 1, taskId: "task", attemptId: "attempt", executionId: "execution", idempotencyKey: "key", profile: "native-profile", model: { providerID: "fixture", id: "small", variant: "high" }, prompt: "Bounded task", worktree: false, resourceBoundary: [{ action: "read", resource: "C:/fixture/inputs/source.asm" }, { action: "edit", resource: "C:/fixture/outputs/result.json" }, { action: "execute", resource: "*" }, { action: "team_message", resource: "*" }], expectedAccess: [{ action: "read", resource: "C:/fixture/inputs/source.asm" }, { action: "edit", resource: "C:/fixture/outputs/result.json" }] })
  const worker = (deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }).session_id
  const event = (tool: string, input: unknown, id = "native-call") => ({ sessionID: worker, agent: "native-profile", messageID: "native-message", id, tool, input })
  return { deps, native, api, scope, worker, event, snapshot: async () => (await api.handle("snapshot", scope)).executions?.[0] }
}

test("actual emitted leaf shapes witness success without a permission-evaluate event; umbrella ID reuse is distinct", async () => {
  const f = await fixture()
  const read = f.event("read", { filePath: "inputs/source.asm" })
  await f.api.beforeTool(read)
  await f.api.observeTool({ ...read, status: "completed" })
  const execute = f.event("execute", { code: "opaque" })
  await f.api.beforeTool(execute)
  await f.api.observeTool({ ...execute, status: "completed" })
  const write = f.event("write", { filePath: "outputs/result.json", content: "PRIVATE CONTENT" }, "native-write")
  await f.api.beforeTool(write)
  await f.api.observeTool({ ...write, status: "completed" })
  const record = await f.snapshot()
  expect(record?.accessVerified).toBe(true)
  expect(record?.accessDecisions).toEqual([])
  expect(record?.accessWitnesses?.some(w => w.action === "read" && w.verifierSource === "public.tool.execute.before+execute.after-leaf-success")).toBe(true)
  expect(JSON.stringify(record?.boundaryChecks)).not.toContain("PRIVATE CONTENT")
})

test("actual native root-relative permission resources retain native allow only for exact owned boundary paths", async () => {
  const f = await fixture()
  const read = { sessionID: f.worker, agent: "native-profile", action: "read", resources: ["inputs/source.asm"], effect: "allow", source: { type: "tool" as const, messageID: "native-message", id: "native-call" } }
  await f.api.enforcePermission(read)
  expect(read.effect).toBe("allow")
  expect(read.resources).toEqual(["inputs/source.asm"])
  expect((await f.snapshot())?.accessDecisions?.[0]).toMatchObject({ resources: ["C:/fixture/inputs/source.asm"], nativeResources: ["inputs/source.asm"], nativeEffect: "allow", effect: "allow", boundaryAllowed: true })
  const nativeDeny = { ...read, resources: ["inputs/source.asm"], effect: "deny" }
  await f.api.enforcePermission(nativeDeny)
  expect(nativeDeny.effect).toBe("deny")
  const nativeAsk = { ...read, resources: ["inputs/source.asm"], effect: "ask" }
  await f.api.enforcePermission(nativeAsk)
  expect(nativeAsk.effect).toBe("ask")
  const sentinel = { ...read, resources: ["denied-canary.json"], effect: "allow" }
  await f.api.enforcePermission(sentinel)
  expect(sentinel.effect).toBe("deny")
  const traversal = { ...read, resources: ["../foreign/source.asm"], effect: "allow" }
  await f.api.enforcePermission(traversal)
  expect(traversal.effect).toBe("deny")
  for (const resource of ["D:/foreign/source.asm", "C:inputs/source.asm", "inputs/source.asm:secret", "inputs/source.asm.", "inputs/Source.asm", "\\\\?\\C:\\fixture\\inputs\\source.asm"]) {
    const rejected = { ...read, resources: [resource], effect: "allow" }
    await f.api.enforcePermission(rejected)
    expect(rejected.effect).toBe("deny")
  }
})

test("root-relative native permission receipts match absolute expected read/edit witnesses without changing native resources", async () => {
  const f = await fixture()
  for (const [tool, action, resource, id] of [["read", "read", "inputs/source.asm", "read-call"], ["write", "edit", "outputs/result.json", "write-call"]] as const) {
    const event = f.event(tool, { filePath: resource }, id)
    await f.api.beforeTool(event)
    const permission = { sessionID: f.worker, agent: "native-profile", action, resources: [resource], effect: "allow", source: { type: "tool" as const, messageID: event.messageID, id: event.id } }
    await f.api.enforcePermission(permission)
    expect(permission.effect).toBe("allow")
    await f.api.observeTool({ ...event, status: "completed" })
  }
  const record = await f.snapshot()
  expect(record?.accessVerified).toBe(true)
  expect(record?.missingExpectedAccess).toEqual([])
  expect(record?.accessWitnesses?.some(witness => witness.action === "read" && witness.resource === "C:/fixture/inputs/source.asm")).toBe(true)
  expect(record?.accessWitnesses?.some(witness => witness.action === "edit" && witness.resource === "C:/fixture/outputs/result.json")).toBe(true)
})

test("native denial stays an error; unknown/outside effects block before execution and same-leaf conflicts invalidate", async () => {
  const f = await fixture()
  const read = f.event("read", { filePath: "inputs/source.asm" })
  await f.api.beforeTool(read)
  await f.api.observeTool({ ...read, status: "error" })
  expect((await f.snapshot())?.accessWitnesses).toEqual([])
  await expect(f.api.beforeTool(f.event("read", { filePath: "inputs/neighbor.asm" }))).rejects.toThrow("boundary")
  await expect(f.api.beforeTool(f.event("shell", { command: "arbitrary" }))).rejects.toThrow("unmapped")
  await f.api.observeTool({ ...read, status: "completed" })
  expect((await f.snapshot())?.accessWitnesses).toEqual([])
})

test("missing leaf callback recovers only public own leaf metadata matched to a durable before check", async () => {
  const f = await fixture()
  const read = f.event("read", { filePath: "inputs/source.asm" })
  const write = f.event("write", { filePath: "outputs/result.json" }, "write-call")
  await f.api.beforeTool(read); await f.api.beforeTool(write)
  f.deps.client.session.findToolOutcomes = async input => input.references.map(reference => ({ ...reference, sessionID: f.worker, agent: "native-profile", status: "completed", mappedResources: reference.tool === "read" ? [{ action: "read", resource: "C:/fixture/inputs/source.asm" }] : [{ action: "edit", resource: "C:/fixture/outputs/result.json" }] }))
  f.native.get(f.worker)!.outcome = "succeeded"
  expect((await f.snapshot())?.accessVerified).toBe(true)
  expect((await f.snapshot())?.accessWitnesses).toHaveLength(2)
})
