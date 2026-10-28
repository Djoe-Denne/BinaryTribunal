import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { createExecutionApi, executionFailure } from "../src/execution-api"
import { setupDeps } from "./helpers"
import { executeTeamTasksAdd } from "../src/tools/team-tasks-add"
import { executeTeamSpawn } from "../src/tools/team-spawn"
import { executeTeamHandoff } from "../src/tools/team-handoff"
import { executeTeamResults } from "../src/tools/team-results"

const auth = { principalId: "operator", token: "fixture-secret" }
const model = { providerID: "fixture", id: "small", variant: "high" }

function fixture() {
  const deps = setupDeps()
  const sessions = new Map<string, Record<string, unknown>>()
  let creates = 0
  let sends = 0
  let now = 1000
  let crash = false
  deps.client.session.create = async options => {
    creates++
    const input = options as typeof options & { id?: string; agent?: string; model?: typeof model; metadata?: Record<string, unknown> }
    const id = input.id ?? `ses_fixture_${creates}`
    sessions.set(id, { id, agent: input.agent, model: input.model, location: { directory: input.directory ?? deps.directory }, metadata: input.metadata, permissions: input.permission })
    if (crash) { crash = false; throw new Error("transport lost after native create") }
    return { data: { id } }
  }
  deps.client.session.get = async ({ sessionID }) => ({ data: sessions.get(sessionID) })
  deps.client.session.promptAsync = async options => { sends++; return { messageID: `message-${sends}`, sessionID: options.sessionID } }
  const options = {
    principals: [{ id: auth.principalId, tokenSha256: createHash("sha256").update(auth.token).digest("hex"), directories: [deps.directory], profiles: ["explore"], models: ["fixture/small#high"], teamNamePrefix: "external-" }],
    now: () => now,
    profile: async (id: string) => ({ id, permissions: [{ action: "edit", resource: "*", effect: "deny" }] }),
  }
  const api = createExecutionApi(deps, options)
  const ensure = () => api.handle("ensureTeam", { ...auth, missionId: "mission-a", directory: deps.directory, teamName: "external-one", controllerId: "controller-a", leaseMs: 100, maxRunning: 1 })
  const submit = (revision = 1, extra: Record<string, unknown> = {}) => api.handle("submit", {
    ...auth, missionId: "mission-a", directory: deps.directory, controllerId: "controller-a", expectedRevision: revision,
    taskId: "task-a", attemptId: "attempt-a", executionId: "execution-a", idempotencyKey: "key-a", profile: "explore", model,
    prompt: "Complete the bounded task", dossier: { historicalExpectedModel: "other/old#low" }, context: { mode: "fresh" }, worktree: false, ...extra,
  })
  return { deps, api, options, sessions, ensure, submit, counts: () => ({ creates, sends }), advance: () => { now += 200 }, crash: () => { crash = true } }
}

describe("generic external execution bridge", () => {
  test("plugin-native Session.NotFoundError is exact absence; other namespace errors remain errors", async () => {
    const f = fixture()
    const get = f.deps.client.session.get
    f.deps.client.session.get = async input => {
      const result = await get(input)
      if (!result.data) throw { _tag: "Session.NotFoundError", sessionID: input.sessionID, message: "" }
      return result
    }
    await f.ensure(); await f.submit()
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
    const other = fixture()
    other.deps.client.session.get = async () => { throw { _tag: "Session.PermissionError", message: "denied" } }
    await expect(other.ensure()).rejects.toMatchObject({ _tag: "Session.PermissionError" })
    expect(other.counts().creates).toBe(0)
  })
  test("delayed created-session visibility recovers exact native ID after handle reopen without a second create", async () => {
    const f = fixture(); await f.ensure(); f.crash()
    const get = f.deps.client.session.get
    let unavailable = 2
    f.deps.client.session.get = async input => {
      const session = f.sessions.get(input.sessionID)
      if (session?.agent === "explore" && unavailable-- > 0) throw Object.assign(new Error("temporarily unavailable"), { _tag: "TransportError" })
      return get(input)
    }
    await f.submit()
    await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    const original = f.deps.db.query("SELECT payload FROM execution_record").get() as { payload: string }
    const reopened = createExecutionApi(f.deps, f.options)
    const snapshot = await reopened.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.nativeSessionId).toBe(JSON.parse(original.payload).nativeSessionId)
    expect(snapshot.executions?.[0]?.state).toBe("message_transmitted")
    expect(snapshot.executions?.[0]?.failure).toBeUndefined()
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })

  test("positive native running/completed clears obsolete transport failure and completes the shared board", async () => {
    const f = fixture(); await f.ensure()
    f.deps.client.session.promptAsync = async () => { throw Object.assign(new Error("receipt lost"), { _tag: "TransportError" }) }
    await f.submit(); await new Promise(resolve => setTimeout(resolve, 0))
    const row = f.deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    f.deps.db.run("UPDATE team_member SET execution_status='running'")
    const scope = { ...auth, missionId: "mission-a", directory: f.deps.directory }
    const running = await f.api.handle("snapshot", scope)
    expect(running.executions?.[0]?.state).toBe("observed_running")
    expect(running.executions?.[0]?.failure).toBeUndefined()
    f.sessions.get(row.session_id)!.outcome = "succeeded"
    const completed = await f.api.handle("snapshot", scope)
    expect(completed.executions?.[0]?.state).toBe("completed")
    expect(completed.executions?.[0]?.failure).toBeUndefined()
    expect(f.deps.db.query("SELECT status FROM team_task WHERE id='task-a'").get()).toEqual({ status: "completed" })
    await f.api.handle("stop", { ...scope, controllerId: "controller-a", expectedRevision: 2, executionId: "execution-a" })
    expect(f.deps.db.query("SELECT status FROM team_task WHERE id='task-a'").get()).toEqual({ status: "completed" })
  })

  test("ambiguous delivery adopts only its own durable user-intent marker without retransmission", async () => {
    const f = fixture(); await f.ensure()
    let marker = ""
    f.deps.client.session.promptAsync = async input => {
      marker = String(input.metadata?.["ensemble.execution.intent"] ?? "")
      throw Object.assign(new Error("accepted but reply lost"), { _tag: "TransportError" })
    }
    f.deps.client.session.findIntent = async input => input.marker === marker ? { messageId: "native-user-intent" } : undefined
    await f.submit(); await new Promise(resolve => setTimeout(resolve, 0))
    expect(marker.length).toBeGreaterThan(0)
    const snapshot = await createExecutionApi(f.deps, f.options).handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.state).toBe("message_transmitted")
    expect(snapshot.executions?.[0]?.nativeIntentReceipt).toEqual({ messageId: "native-user-intent" })
    expect(snapshot.executions?.[0]?.failure).toBeUndefined()
    expect(f.counts().creates).toBe(2)
  })
  test("public SessionNotFoundError permits preallocated creation; empty-message transport errors stay distinct", async () => {
    const f = fixture()
    const get = f.deps.client.session.get
    f.deps.client.session.get = async input => {
      const result = await get(input)
      if (!result.data) throw { _tag: "SessionNotFoundError", sessionID: input.sessionID, name: "SessionNotFoundError" }
      return result
    }
    await f.ensure(); await f.submit()
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
    const transport = { _tag: "TransportError", name: "TransportError", message: "" }
    const details = executionFailure(transport)
    expect(details.message.length).toBeGreaterThan(0)
    expect(details.category).toBe("transport")
    const other = fixture()
    other.deps.client.session.get = async () => { throw transport }
    await expect(other.ensure()).rejects.toMatchObject({ _tag: "TransportError" })
    expect(other.counts().creates).toBe(0)
  })
  test("required access is evaluated against the created worker, never its allowed supervisor", async () => {
    const f = fixture(); const mission = await f.ensure()
    const calls: Array<{ sessionID: string; agent: string; action: string; resources: readonly string[] }> = []
    f.deps.permissionEvaluator = { source: "fixture-native-worker-evaluate", evaluate: async input => {
      calls.push(input)
      expect(f.sessions.has(input.sessionID)).toBe(true)
      return { effect: input.sessionID === mission.leadSessionId ? "allow" : "deny" }
    } }
    await f.submit(1, { requiredAccess: [{ action: "read", resource: "/fixture/exact-source.asm" }] })
    expect(f.counts()).toEqual({ creates: 2, sends: 0 })
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.state).toBe("failed")
    expect(snapshot.executions?.[0]?.failure?.category).toBe("permission")
    expect(snapshot.executions?.[0]?.selection.evaluatedAccess?.[0]).toMatchObject({ action: "read", resource: "/fixture/exact-source.asm", effect: "deny", verifierSource: "fixture-native-worker-evaluate", profile: "explore" })
    expect(calls[0]?.sessionID).toBe(snapshot.executions?.[0]?.nativeSessionId)
    expect(calls.some(c => c.sessionID === mission.leadSessionId)).toBe(false)
  })

  test("missing native evaluation capability explicitly rejects required access before allocation", async () => {
    const f = fixture(); await f.ensure()
    expect((await f.api.handle("capabilities", auth)).capabilities?.permissionPreflight).toBe(false)
    await expect(f.submit(1, { requiredAccess: [{ action: "read", resource: "/fixture/source.asm" }] })).rejects.toThrow("permission")
    expect(f.counts()).toEqual({ creates: 1, sends: 0 })
  })

  test("allow preflight preserves exact action/resources, selection proofs and idempotency digest", async () => {
    const f = fixture(); await f.ensure()
    f.deps.permissionEvaluator = { source: "fixture-native-worker-evaluate", evaluate: async () => ({ effect: "allow" }) }
    const requiredAccess = [{ action: "read", resource: "C:/fixture/source.asm" }, { action: "glob", resource: "C:/fixture/docs/**/*.md" }, { action: "list", resource: "C:/fixture/docs" }]
    const receipt = await f.submit(1, { requiredAccess })
    expect(await f.submit(0, { requiredAccess })).toEqual(receipt)
    await expect(f.submit(2, { requiredAccess: [{ action: "read", resource: "C:/fixture/other.asm" }] })).rejects.toThrow("idempotency")
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.selection.requiredAccess).toEqual(requiredAccess)
    expect(snapshot.executions?.[0]?.selection.evaluatedAccess?.map(({ action, resource, effect }) => ({ action, resource, effect }))).toEqual(requiredAccess.map(a => ({ ...a, effect: "allow" })))
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })

  test.each(["glob", "list"])("denied %s resource is not probed via another tool", async action => {
    const f = fixture(); await f.ensure()
    const evaluated: string[] = []
    f.deps.permissionEvaluator = { source: "fixture-native-worker-evaluate", evaluate: async input => { evaluated.push(input.action); return { effect: "deny" } } }
    await f.submit(1, { requiredAccess: [{ action, resource: "C:/fixture/private/**/*.md" }] })
    expect(f.counts().sends).toBe(0)
    expect(evaluated).toEqual([action])
    expect(f.deps.client.calls.some(c => c.method.includes("read") || c.method.includes("glob"))).toBe(false)
  })

  test("ask is not permission approval; lost-create readback also applies worker preflight", async () => {
    const f = fixture(); await f.ensure(); f.crash()
    f.deps.permissionEvaluator = { source: "fixture-native-worker-evaluate", evaluate: async () => ({ effect: "ask" }) }
    await f.submit(1, { requiredAccess: [{ action: "read", resource: "/fixture/private.asm" }] })
    expect(f.counts()).toEqual({ creates: 2, sends: 0 })
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.failure?.category).toBe("permission")
    expect(snapshot.executions?.[0]?.selection.evaluatedAccess?.[0]?.effect).toBe("ask")
  })

  test("existing preallocated native worker recovery cannot bypass access denial", async () => {
    const f = fixture(); await f.ensure()
    const get = f.deps.client.session.get
    f.deps.client.session.get = async input => {
      const row = f.deps.db.query("SELECT payload FROM execution_record").get() as { payload: string } | null
      const record = row ? JSON.parse(row.payload) as { nativeSessionId: string; executionId: string; missionId: string } : undefined
      if (record?.nativeSessionId === input.sessionID && !f.sessions.has(input.sessionID)) f.sessions.set(input.sessionID, { id: input.sessionID, agent: "explore", model, location: { directory: f.deps.directory }, metadata: { "ensemble.execution": record.executionId, "ensemble.mission": record.missionId } })
      return get(input)
    }
    f.deps.permissionEvaluator = { source: "fixture-native-worker-evaluate", evaluate: async () => ({ effect: "deny" }) }
    await f.submit(1, { requiredAccess: [{ action: "read", resource: "/fixture/denied.asm" }] })
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.state).toBe("failed")
    expect(snapshot.executions?.[0]?.failure?.category).toBe("permission")
    expect(f.counts()).toEqual({ creates: 1, sends: 0 })
  })

  test("native outcome uses SDK succeeded, not an invented success spelling", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    await new Promise(resolve => setTimeout(resolve, 0))
    const row = f.deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    f.sessions.get(row.session_id)!.outcome = "success"
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.state).toBe("message_transmitted")
    f.sessions.get(row.session_id)!.outcome = "succeeded"
    expect((await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })).executions?.[0]?.state).toBe("completed")
  })

  test("bridge worker creation does not override denied execute or inspection tools", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    const row = f.deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    const permissions = f.sessions.get(row.session_id)?.permissions as Array<{ permission: string; action: string }>
    expect(permissions.some(p => p.action === "allow" && ["execute", "team_results", "team_status", "team_view"].includes(p.permission))).toBe(false)
    await expect(executeTeamResults(f.deps, { from: "other-worker" }, row.session_id)).rejects.toThrow("external execution")
  })

  test.each(["observed_running", "completed"])("late native send acknowledgement cannot regress %s", async state => {
    const f = fixture(); await f.ensure()
    let acknowledge: (value: unknown) => void = () => {}
    f.deps.client.session.promptAsync = () => new Promise(resolve => { acknowledge = resolve })
    await f.submit()
    const row = f.deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    if (state === "observed_running") f.deps.db.run("UPDATE team_member SET execution_status='running'")
    else f.sessions.get(row.session_id)!.outcome = "succeeded"
    await f.api.observe(row.session_id)
    acknowledge({ messageID: "late-receipt" })
    await new Promise(resolve => setTimeout(resolve, 0))
    const record = f.deps.db.query("SELECT payload FROM execution_record").get() as { payload: string }
    expect(JSON.parse(record.payload).state).toBe(state)
  })
  test("shared agent tools reject another project's mission even with its lead session ID", async () => {
    const f = fixture(); const mission = await f.ensure()
    const foreign = { ...f.deps, directory: "/foreign" }
    await expect(executeTeamTasksAdd(foreign, { tasks: [{ content: "foreign injection", priority: "medium" }] }, mission.leadSessionId!)).rejects.toThrow("directory")
    await expect(executeTeamSpawn(foreign, { name: "foreign", agent: "explore", prompt: "foreign", worktree: false }, mission.leadSessionId!)).rejects.toThrow("directory")
  })
  test("denies by default, bad/empty tokens, forged sessions and wrong directories", async () => {
    const f = fixture()
    await expect(createExecutionApi(f.deps, { principals: [] }).handle("capabilities", auth)).rejects.toThrow("auth")
    await expect(f.api.handle("capabilities", { ...auth, token: "" })).rejects.toThrow("auth")
    await expect(f.api.handle("capabilities", { ...auth, token: "wrong", sessionID: "lead" })).rejects.toThrow("auth")
    await expect(f.api.handle("ensureTeam", { ...auth, missionId: "other", directory: "/other", teamName: "external-two", controllerId: "a", leaseMs: 100 })).rejects.toThrow("directory")
    expect(f.counts().creates).toBe(0)
  })

  test("creates its own lead, persists opaque task/dossier and selected native ref, not historical prose", async () => {
    const f = fixture()
    const mission = await f.ensure()
    expect(mission.revision).toBe(1)
    const receipt = await f.submit()
    expect(receipt.executionId).toBe("execution-a")
    expect(receipt.revision).toBe(2)
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.selection?.model).toEqual(model)
    expect(snapshot.executions?.[0]?.native?.model).toEqual(model)
    expect(snapshot.executions?.[0]?.selection?.profile).toBe("explore")
    expect(snapshot.executions?.[0]?.dossier).toEqual({ historicalExpectedModel: "other/old#low" })
    expect(snapshot.executions?.[0]?.nativeSessionId).not.toBe(mission.leadSessionId)
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
    const task = f.deps.db.query("SELECT content FROM team_task WHERE id = ?").get("task-a") as { content: string }
    expect(task.content).toContain("Complete the bounded task")
  })

  test("identical retries return original receipt before stale revision; changed payload rejects", async () => {
    const f = fixture(); await f.ensure()
    const receipt = await f.submit()
    expect(await f.submit(0)).toEqual(receipt)
    await expect(f.submit(2, { prompt: "changed" })).rejects.toThrow("idempotency")
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })

  test("concurrent identical submissions both return the same durable original receipt", async () => {
    const f = fixture(); await f.ensure()
    const receipts = await Promise.all([f.submit(), f.submit()])
    expect(receipts[0]).toEqual(receipts[1])
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })

  test("CAS rejects concurrent revisions without duplicate native creation", async () => {
    const f = fixture(); await f.ensure()
    const results = await Promise.allSettled([f.submit(), f.submit(1, { idempotencyKey: "key-b", taskId: "task-b", attemptId: "attempt-b", executionId: "execution-b" })])
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1)
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1)
    expect(f.counts().creates).toBe(2)
  })

  test("concurrent ensureTeam calls durably reserve lead creation once", async () => {
    const f = fixture()
    await Promise.allSettled([f.ensure(), f.ensure()])
    expect(f.counts().creates).toBe(1)
    expect((await f.ensure()).leadSessionId).toBeDefined()
  })

  test("failed preservation must not claim stopped or abort", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    await new Promise(resolve => setTimeout(resolve, 0))
    f.deps.preserveBranch = async () => false
    f.deps.db.run("UPDATE team_member SET worktree_branch='fixture-branch'")
    await expect(f.api.handle("stop", { ...auth, missionId: "mission-a", directory: f.deps.directory, controllerId: "controller-a", expectedRevision: 2, executionId: "execution-a" })).rejects.toThrow("preserve")
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.state).not.toBe("stopped")
    expect(f.deps.client.calls.some(c => c.method === "session.abort")).toBe(false)
  })

  test("controller replacement requires explicit expired-lease recovery", async () => {
    const f = fixture(); await f.ensure(); f.advance()
    await expect(f.submit()).rejects.toThrow("lease")
    await expect(f.api.handle("control", { ...auth, missionId: "mission-a", directory: f.deps.directory, controllerId: "b", expectedRevision: 1, action: "resume" })).rejects.toThrow("controller")
    const recovered = await f.api.handle("control", { ...auth, missionId: "mission-a", directory: f.deps.directory, controllerId: "b", expectedRevision: 1, action: "recover", leaseMs: 100 })
    expect(recovered.revision).toBe(2)
  })

  test("principal and project binding cannot adopt another lead/team", async () => {
    const f = fixture(); await f.ensure()
    const foreign = createExecutionApi({ ...f.deps, directory: "/other" }, f.options)
    await expect(foreign.handle("inspect", { ...auth, missionId: "mission-a", directory: f.deps.directory, executionId: "execution-a" })).rejects.toThrow("directory")
    const other = createExecutionApi(f.deps, { ...f.options, principals: [{ ...f.options.principals[0]!, id: "other" }] })
    await expect(other.handle("snapshot", { ...auth, principalId: "other", missionId: "mission-a", directory: f.deps.directory })).rejects.toThrow("principal")
  })

  test("unsupported inheritance fails before send and never falls back fresh", async () => {
    const f = fixture(); await f.ensure()
    await expect(f.submit(1, { context: { mode: "fork", from: "lead" } })).rejects.toThrow("continuity")
    expect(f.counts()).toEqual({ creates: 1, sends: 0 })
  })

  test("profile/model allowlists reject before acceptance", async () => {
    const f = fixture(); await f.ensure()
    await expect(f.submit(1, { profile: "writer" })).rejects.toThrow("profile")
    await expect(f.submit(1, { model: { ...model, variant: "low" } })).rejects.toThrow("model")
    expect(f.counts().creates).toBe(1)
  })

  test("worker handoff cannot bypass bridge profile admission authority", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    let switched = false
    f.deps.client.continuity = { fork: async () => ({ id: "fork" }), switchAgent: async () => { switched = true }, move: async () => {}, compact: async () => {}, remove: async () => {} }
    const row = f.deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    await expect(executeTeamHandoff(f.deps, { agent: "unauthorized-writer" }, row.session_id)).rejects.toThrow("external execution")
    expect(switched).toBe(false)
  })

  test("pause queues only this mission; resume admits through shared capacity", async () => {
    const f = fixture(); await f.ensure()
    await f.api.handle("control", { ...auth, missionId: "mission-a", directory: f.deps.directory, controllerId: "controller-a", expectedRevision: 1, action: "pause" })
    await f.submit(2)
    expect(f.counts()).toEqual({ creates: 1, sends: 0 })
    await f.api.handle("control", { ...auth, missionId: "mission-a", directory: f.deps.directory, controllerId: "controller-a", expectedRevision: 3, action: "resume" })
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })

  test("native create accepted then lost reply recovers same preallocated ID without duplicate creation", async () => {
    const f = fixture(); await f.ensure(); f.crash()
    const receipt = await f.submit()
    expect(receipt.executionId).toBe("execution-a")
    const restarted = createExecutionApi(f.deps, f.options)
    const snapshot = await restarted.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.nativeSessionId).toBeDefined()
    expect(snapshot.executions?.[0]?.state).toBe("message_transmitted")
    expect(await f.submit(0)).toEqual(receipt)
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })

  test("transport failure during prompt is ambiguous, not rollback or duplicate native send", async () => {
    const f = fixture(); await f.ensure()
    f.deps.client.session.promptAsync = async () => { throw new Error("transport receipt lost") }
    await f.submit()
    await new Promise(resolve => setTimeout(resolve, 0))
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.state).toBe("ambiguous")
    expect(f.deps.client.calls.some(c => c.method === "session.abort")).toBe(false)
    expect(f.deps.db.query("SELECT session_id FROM team_member").get()).not.toBeNull()
  })

  test("public native not-found permits first allocation; other get failures never do", async () => {
    const f = fixture()
    const get = f.deps.client.session.get
    f.deps.client.session.get = async input => { const result = await get(input); if (!result.data) throw Object.assign(new Error("not found"), { status: 404 }); return result }
    await f.ensure(); await f.submit()
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })

  test("stop uses shared branch preservation before abort and cancels queued admission", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    await new Promise(resolve => setTimeout(resolve, 0))
    const order: string[] = []
    f.deps.preserveBranch = async () => { order.push("preserve"); return true }
    f.deps.client.session.abort = async () => { order.push("abort"); return {} }
    f.deps.db.run("UPDATE team_member SET worktree_branch='fixture-branch'")
    await f.api.handle("stop", { ...auth, missionId: "mission-a", directory: f.deps.directory, controllerId: "controller-a", expectedRevision: 2, executionId: "execution-a" })
    expect(order).toEqual(["preserve", "abort"])
  })

  test("authenticated replay applies snapshot recovery without native session recreation", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    f.deps.db.run("UPDATE team_member SET execution_status='running'")
    const response = await f.api.handle("replay", { ...auth, missionId: "mission-a", directory: f.deps.directory, cursor: 0 })
    expect(response.events?.some(e => e.kind === "observed_running")).toBe(true)
    expect(f.counts()).toEqual({ creates: 2, sends: 1 })
  })

  test("missed native completion callback reconciles from public native outcome", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    const row = f.deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    f.sessions.get(row.session_id)!.outcome = "succeeded"
    const snapshot = await f.api.handle("snapshot", { ...auth, missionId: "mission-a", directory: f.deps.directory })
    expect(snapshot.executions?.[0]?.state).toBe("completed")
  })

  test("removing an operator principal on restart prevents queued native admissions", async () => {
    const f = fixture(); const mission = await f.ensure()
    await f.api.handle("control", { ...auth, missionId: "mission-a", directory: f.deps.directory, controllerId: "controller-a", expectedRevision: 1, action: "pause" })
    await f.submit(2)
    const restarted = createExecutionApi(f.deps, { ...f.options, principals: [] })
    f.deps.db.run("UPDATE execution_mission SET paused=0")
    await restarted.pump(mission.teamId!)
    expect(f.counts()).toEqual({ creates: 1, sends: 0 })
  })

  test("durable replay is monotonic; duplicate observations no-op; missed callbacks converge", async () => {
    const f = fixture(); await f.ensure(); await f.submit()
    const row = f.deps.db.query("SELECT session_id FROM team_member").get() as { session_id: string }
    f.deps.db.run("UPDATE team_member SET execution_status='running' WHERE session_id=?", [row.session_id])
    const request = { ...auth, missionId: "mission-a", directory: f.deps.directory }
    const snapshot = await f.api.handle("snapshot", request)
    expect(snapshot.executions?.[0]?.state).toBe("observed_running")
    const before = await f.api.handle("events", { ...request, cursor: 0 })
    await f.api.observe(row.session_id)
    await f.api.observe(row.session_id)
    const after = await f.api.handle("events", { ...request, cursor: 0 })
    expect(after.events).toEqual(before.events)
    expect(after.events?.every((e, i, all) => e.version === 1 && (i === 0 || e.id > all[i - 1]!.id))).toBe(true)
    expect((await f.api.handle("events", { ...request, cursor: after.cursor })).events).toHaveLength(0)
  })

  test("native ref mismatch blocks prompt and is not promoted from historical model text", async () => {
    const f = fixture(); await f.ensure()
    const get = f.deps.client.session.get
    f.deps.client.session.get = async input => { const result = await get(input); return { data: result.data ? { ...(result.data as Record<string, unknown>), model: { ...model, variant: "default" } } : undefined } }
    await f.submit()
    expect(f.counts().sends).toBe(0)
    const inspect = await f.api.handle("inspect", { ...auth, missionId: "mission-a", directory: f.deps.directory, executionId: "execution-a" })
    expect(inspect.execution?.failure?.category).toBe("input")
  })

  test("tokens are never persisted in opaque metadata or error traces", async () => {
    const f = fixture(); await f.ensure(); await f.submit(1, { metadata: { token: auth.token, nested: { authorization: auth.token }, note: auth.token } })
    const stored = f.deps.db.query("SELECT payload FROM execution_record").all()
    expect(JSON.stringify(stored)).not.toContain(auth.token)
  })
})
