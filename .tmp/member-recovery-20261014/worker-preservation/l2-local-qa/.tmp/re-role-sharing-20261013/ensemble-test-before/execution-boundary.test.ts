import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { createExecutionApi, type ExecutionPermissionEvent } from "../src/execution-api"
import { matchesExecutionResource, sameExecutionResource, validateExecutionBoundary } from "../src/execution-boundary"
import { executeTeamMessage } from "../src/tools/team-message"
import { setupDeps } from "./helpers"

const auth = { principalId: "operator", token: "fixture-secret" }
const model = { providerID: "fixture", id: "small", variant: "high" }
const boundary = [{ action: "read", resource: "C:/fixture/allowed/source.asm" }, { action: "execute", resource: "*" }, { action: "team_message", resource: "*" }]
const expected = [{ action: "read", resource: "C:/fixture/allowed/source.asm" }]

async function fixture() {
  const deps = setupDeps()
  deps.directory = "C:/fixture"
  const native = new Map<string, Record<string, unknown>>()
  let sends = 0
  deps.client.session.create = async input => {
    const id = input.id ?? "unexpected-id"
    native.set(id, { id, model: input.model, agent: input.agent, metadata: input.metadata, permissions: input.permission, location: { directory: deps.directory } })
    return { data: { id } }
  }
  deps.client.session.get = async input => ({ data: native.get(input.sessionID) })
  deps.client.session.promptAsync = async () => { sends++; return {} }
  const options = { principals: [{ id: "operator", tokenSha256: createHash("sha256").update(auth.token).digest("hex"), directories: [deps.directory], profiles: ["explore"], models: ["fixture/small#high"] }], profile: async () => ({ id: "explore", permissions: [{ action: "read", resource: "*", effect: "deny" }] }), nativeAccessWitness: true }
  const api = createExecutionApi(deps, options)
  const scope = { ...auth, directory: deps.directory, missionId: "boundary-mission" }
  const mission = await api.handle("ensureTeam", { ...scope, teamName: "boundary-team", controllerId: "controller", leaseMs: 300000 })
  const submit = (extra: Record<string, unknown> = {}) => api.handle("submit", { ...scope, controllerId: "controller", expectedRevision: 1, taskId: "task", attemptId: "attempt", executionId: "execution", idempotencyKey: "key", profile: "explore", model, prompt: "Read the authorized resource, report to lead", worktree: false, resourceBoundary: boundary, expectedAccess: expected, ...extra })
  const snapshot = async () => (await api.handle("snapshot", scope)).executions?.[0]
  const worker = () => (deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }).session_id
  const permission = (extra: Partial<ExecutionPermissionEvent> = {}): ExecutionPermissionEvent => ({ sessionID: worker(), agent: "explore", action: "read", resources: ["C:/fixture/allowed/source.asm"], effect: "allow", source: { type: "tool", messageID: "native-message", id: "native-call" }, ...extra })
  const tool = (extra: Record<string, unknown> = {}) => ({ sessionID: worker(), agent: "explore", tool: "read", messageID: "native-message", id: "native-call", status: "completed" as const, ...extra })
  return { deps, api, options, scope, mission, native, submit, snapshot, worker, permission, tool, sends: () => sends }
}

test("boundary normalization permits equivalent OS paths, rejects traversal and broader observed wildcard", () => {
  expect(sameExecutionResource("C:/fixture", "c:\\fixture")).toBe(true)
  expect(sameExecutionResource("/fixture/*", "/fixture/neighbor")).toBe(false)
  expect(matchesExecutionResource("C:/fixture/allowed/**", "c:\\fixture\\allowed\\nested\\source.asm")).toBe(true)
  expect(matchesExecutionResource("C:/fixture/allowed/**", "C:/fixture/allowed/../neighbor.asm")).toBe(false)
  expect(matchesExecutionResource("C:/fixture/allowed/*.asm", "C:/fixture/allowed/*")).toBe(false)
  expect(matchesExecutionResource("/fixture/allowed/**", "/fixture/Allowed/source.asm")).toBe(false)
  expect(matchesExecutionResource("C:/fixture/allowed/source.asm", "C:/fixture/allowed/source.asm:secret")).toBe(false)
  expect(matchesExecutionResource("C:/fixture/allowed/source.asm", "C:/fixture/allowed/Source.asm")).toBe(false)
  expect(() => validateExecutionBoundary([], expected)).toThrow("boundary")
  expect(() => validateExecutionBoundary(boundary, [{ action: "read", resource: "C:/fixture/neighbor.asm" }])).toThrow("expected")
})

test("explicit boundary is stored/digested; capabilities do not promise a permission query", async () => {
  const f = await fixture()
  const receipt = await f.submit()
  expect(receipt.state).toBe("accepted")
  const record = await f.snapshot()
  expect(record?.selection.resourceBoundary).toEqual(boundary)
  expect(record?.selection.expectedAccess).toEqual(expected)
  expect(record?.selection.accessMethod).toBe("native_tool_boundary_witness")
  const caps = (await f.api.handle("capabilities", auth)).capabilities
  expect(caps?.permissionPreflight).toBe(false)
  expect(caps?.resourceBoundary).toBe(true)
  expect(caps?.nativeAccessWitness).toBe(true)
  await expect(f.submit({ resourceBoundary: [{ action: "read", resource: "*" }] })).rejects.toThrow("idempotency")
})

test("native deny/ask inside the boundary are never promoted, neighbor/shell access is denied", async () => {
  const f = await fixture(); await f.submit()
  const denied = f.permission({ effect: "deny" })
  await f.api.enforcePermission(denied)
  expect(denied.effect).toBe("deny")
  const ask = f.permission({ effect: "ask", source: { type: "tool", messageID: "native-message", id: "ask-call" } })
  await f.api.enforcePermission(ask)
  expect(ask.effect).toBe("ask")
  const neighbor = f.permission({ resources: ["C:/fixture/neighbor.asm"], source: { type: "tool", messageID: "native-message", id: "neighbor-call" } })
  await f.api.enforcePermission(neighbor)
  expect(neighbor.effect).toBe("deny")
  const shell = f.permission({ action: "shell", resources: ["cat source.asm"] })
  await f.api.enforcePermission(shell)
  expect(shell.effect).toBe("deny")
  await f.api.observeTool(f.tool())
  expect((await f.snapshot())?.accessWitnesses).toEqual([])
})

test("native allow plus correlated successful native tool yields a durable witness, not supervisor rules", async () => {
  const f = await fixture(); await f.submit()
  await f.api.enforcePermission(f.permission())
  expect((await f.snapshot())?.accessVerified).toBe(false)
  await f.api.observeTool(f.tool())
  const record = await f.snapshot()
  expect(record?.accessVerified).toBe(true)
  expect(record?.accessWitnesses?.[0]).toMatchObject({ sessionId: f.worker(), profile: "explore", action: "read", resource: "C:/fixture/allowed/source.asm", effect: "allow", native: { messageID: "native-message", id: "native-call", tool: "read", status: "completed" } })
  expect(record?.selection.profileInfo).toMatchObject({ permissions: [{ effect: "deny" }] })
  const restarted = createExecutionApi(f.deps, f.options)
  const restored = await restarted.handle("snapshot", f.scope)
  expect(restored.executions?.[0]?.accessWitnesses).toEqual(record?.accessWitnesses)
  await restarted.observeTool(f.tool())
  expect((await restarted.handle("snapshot", f.scope)).executions?.[0]?.accessWitnesses).toHaveLength(1)
})

test("failed tool, mismatched source, profile or session cannot produce an allow witness", async () => {
  const f = await fixture(); await f.submit()
  await f.api.enforcePermission(f.permission())
  await f.api.observeTool(f.tool({ status: "error" }))
  await f.api.observeTool(f.tool({ id: "unrelated-call" }))
  await f.api.observeTool(f.tool({ agent: "supervisor" }))
  await f.api.observeTool(f.tool({ sessionID: f.mission.leadSessionId }))
  expect((await f.snapshot())?.accessWitnesses).toEqual([])
  const wrong = f.permission({ agent: "supervisor", source: { type: "tool", messageID: "native-message", id: "wrong-profile" } })
  await f.api.enforcePermission(wrong)
  expect(wrong.effect).toBe("deny")
})

test("completed native outcome without expected witnesses is explicitly unverified and recoverable", async () => {
  const f = await fixture(); await f.submit()
  await new Promise(resolve => setTimeout(resolve, 0))
  f.native.get(f.worker())!.outcome = "succeeded"
  const record = await f.snapshot()
  expect(record?.state).toBe("completed")
  expect(record?.accessVerified).toBe(false)
  expect(record?.missingExpectedAccess).toEqual(expected)
  expect(record?.verificationBlock).toMatchObject({ category: "input_preconditions", recoverable: true })
  expect(f.sends()).toBe(1)
})

test("umbrella Code Mode completion or missing permission callback never fabricates read success", async () => {
  const f = await fixture(); await f.submit()
  await f.api.enforcePermission(f.permission())
  await f.api.observeTool(f.tool({ tool: "execute" }))
  expect((await f.snapshot())?.accessVerified).toBe(false)
  const other = await fixture(); await other.submit()
  await other.api.observeTool(other.tool())
  expect((await other.snapshot())?.accessWitnesses).toEqual([])
})

test("edit witnesses use native action/resources, not tool input or tool name guesses", async () => {
  const f = await fixture()
  const access = { action: "edit", resource: "C:/fixture/allowed/output.txt" }
  await f.submit({ resourceBoundary: [access], expectedAccess: [access] })
  await f.api.enforcePermission(f.permission({ action: "edit", resources: [access.resource] }))
  await f.api.observeTool(f.tool({ tool: "write" }))
  expect((await f.snapshot())?.accessVerified).toBe(true)
  expect((await f.snapshot())?.accessWitnesses?.[0]?.action).toBe("edit")
})

test("expected access outside the boundary and mixed query/boundary modes reject before native creation", async () => {
  const f = await fixture()
  await expect(f.submit({ expectedAccess: [{ action: "edit", resource: "C:/fixture/neighbor.asm" }] })).rejects.toThrow("expected")
  await expect(f.submit({ requiredAccess: expected })).rejects.toThrow("mode")
  expect(f.native.size).toBe(1)
})

test("bridge member messages cannot target peer/all sessions even via the shared agent tool", async () => {
  const f = await fixture(); await f.submit()
  await expect(executeTeamMessage(f.deps, { to: "peer", text: "leak" }, f.worker())).rejects.toThrow("lead")
  await expect(executeTeamMessage(f.deps, { to: "all", text: "leak" }, f.worker())).rejects.toThrow("lead")
})
