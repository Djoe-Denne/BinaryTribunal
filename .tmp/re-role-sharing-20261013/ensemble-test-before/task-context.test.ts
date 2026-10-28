import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { insertMember, insertTeam, setupDeps } from "./helpers"
import { executeTeamTasksAdd } from "../src/tools/team-tasks-add"
import { executeTeamSpawn, spawnFailures } from "../src/tools/team-spawn"
import { executeTeamClaim } from "../src/tools/team-claim"
import { executeTeamTasksList } from "../src/tools/team-tasks-list"
import { pumpTeam } from "../src/dispatch"

describe("task context decisions govern every admission path", () => {
  let deps: ReturnType<typeof setupDeps>
  let forks: Array<{ sessionID: string; before?: string }>
  beforeEach(() => {
    deps = setupDeps()
    insertTeam(deps.db, "t", "context-pool", "ses_lead")
    insertMember(deps.db, "t", "reader", "ses_reader")
    forks = []
    deps.client.continuity = {
      fork: async input => { forks.push(input); return { id: `ses_fork${forks.length}` } },
      switchAgent: async () => {}, move: async () => {}, compact: async () => {}, remove: async () => {},
    }
    spawnFailures.clear()
  })
  afterEach(() => deps.db.close())
  const checkpoint = () => ({ mode: "checkpoint" as const, from: "reader", messageID: "msg_clean", reason: "Frozen factual discovery; independent sibling author" })
  const add = async (context = checkpoint()) => {
    await executeTeamTasksAdd(deps, { tasks: [{ content: "Produce independently", priority: "high", context }] }, "ses_lead")
    return (deps.db.query("SELECT id FROM team_task ORDER BY rowid DESC LIMIT 1").get() as { id: string }).id
  }

  test("autoscale forks sibling authors from the same frozen boundary instead of reusing idle history", async () => {
    await add(); await add()
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 2 }
    await pumpTeam(deps, "t")
    expect(forks).toEqual([{ sessionID: "ses_reader", before: "msg_clean" }, { sessionID: "ses_reader", before: "msg_clean" }])
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(0)
    expect(deps.db.query("SELECT COUNT(DISTINCT assignee) AS n FROM team_task WHERE status='in_progress'").get()).toEqual({ n: 2 })
  })
  test("manual spawn inherits the saved task decision and rejects a conflicting explicit override", async () => {
    const id = await add()
    await expect(executeTeamSpawn(deps, { name: "wrong", prompt: "delta", claim_task: id, context: { mode: "fresh" } }, "ses_lead")).rejects.toThrow("context")
    expect(forks).toHaveLength(0)
    await executeTeamSpawn(deps, { name: "right", prompt: "delta", claim_task: id, worktree: false }, "ses_lead")
    expect(forks[0]).toEqual({ sessionID: "ses_reader", before: "msg_clean" })
  })
  test("manual claims cannot bypass a planned independent session", async () => {
    const id = await add()
    await expect(executeTeamClaim(deps, { task_id: id }, "ses_reader")).rejects.toThrow("context")
    await expect(executeTeamClaim(deps, { task_id: id }, "ses_lead")).rejects.toThrow("context")
  })
  test("explicit fresh is a new session even when a worker is idle", async () => {
    await executeTeamTasksAdd(deps, { tasks: [{ content: "Reconciliation", priority: "medium", context: { mode: "fresh", reason: "Independent reconciliation after A+B" } }] }, "ses_lead")
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 1 }
    await pumpTeam(deps, "t")
    expect(forks).toHaveLength(0)
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(1)
    expect(deps.db.query("SELECT assignee FROM team_task").get()).toEqual({ assignee: "pool-1" })
  })
  test("a pending decision does not starve other ready tasks and is visible on the board", async () => {
    await executeTeamTasksAdd(deps, { tasks: [
      { content: "Needs clean source", priority: "high", context: { mode: "pending", reason: "Reader checkpoint not approved" } },
      { content: "Discovery", priority: "low", context: { mode: "fresh", reason: "Factual reader" } },
    ] }, "ses_lead")
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 1 }
    await pumpTeam(deps, "t")
    expect(deps.db.query("SELECT status FROM team_task WHERE content='Needs clean source'").get()).toEqual({ status: "pending" })
    expect(deps.db.query("SELECT status FROM team_task WHERE content='Discovery'").get()).toEqual({ status: "in_progress" })
    expect(await executeTeamTasksList(deps, "ses_lead")).toContain("Reader checkpoint not approved")
  })
  test("failed native fork is held without a fresh fallback or repeated automatic attempts", async () => {
    await add()
    let attempts = 0
    if (deps.client.continuity) deps.client.continuity.fork = async () => { attempts++; throw new Error("checkpoint message missing") }
    deps.config = { ...deps.config, autoScale: true }
    await pumpTeam(deps, "t"); await pumpTeam(deps, "t")
    expect(attempts).toBe(1)
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(0)
    expect(await executeTeamTasksList(deps, "ses_lead")).toContain("checkpoint message missing")
  })
  test("asynchronous admission rejection releases the task and holds its context", async () => {
    const id = await add()
    deps.client.session.promptAsync = async () => { throw new Error("native prompt admission rejected") }
    deps.config = { ...deps.config, autoScale: true }
    await pumpTeam(deps, "t")
    await new Promise(resolve => setTimeout(resolve, 10))
    await pumpTeam(deps, "t")
    expect(forks).toHaveLength(1)
    expect(deps.db.query("SELECT status,assignee FROM team_task WHERE id=?").get(id)).toEqual({ status: "pending", assignee: null })
    expect(await executeTeamTasksList(deps, "ses_lead")).toContain("native prompt admission rejected")
  })
  test("context is held atomically with release while native rollback is still cleaning up", async () => {
    await add()
    let startCleanup = () => {}, finishCleanup = () => {}
    const started = new Promise<void>(resolve => { startCleanup = resolve })
    const cleanup = new Promise<void>(resolve => { finishCleanup = resolve })
    if (deps.client.continuity) deps.client.continuity.remove = async () => { startCleanup(); await cleanup }
    deps.client.session.promptAsync = async () => { throw new Error("native admission failed") }
    deps.config = { ...deps.config, autoScale: true }
    await pumpTeam(deps, "t")
    await started
    try {
      await pumpTeam(deps, "t")
      expect(forks).toHaveLength(1)
      expect(await executeTeamTasksList(deps, "ses_lead")).toContain("native admission failed")
    } finally { finishCleanup(); await new Promise(resolve => setTimeout(resolve, 10)) }
  })
  test("a mission circuit breaker stops the pump without invalidating every queued context", async () => {
    await add(); await add()
    spawnFailures.set("t", { count: 3, lastError: "native service unavailable" })
    deps.config = { ...deps.config, autoScale: true }
    await pumpTeam(deps, "t")
    expect(deps.db.query("SELECT DISTINCT context_error FROM team_task").all()).toEqual([{ context_error: null }])
    expect(forks).toHaveLength(0)
    spawnFailures.delete("t")
    await pumpTeam(deps, "t")
    expect(forks).toHaveLength(2)
  })
  test("model preference exclusions do not become sticky context failures", async () => {
    const id = await add()
    deps.db.run("UPDATE team_task SET complexity=0,risk=0 WHERE id=?", [id])
    deps.config = { ...deps.config, autoScale: true, modelRouting: {
      beta: 0.35, models: [{ id: "provider/model", available: true, intelligenceScore: 50, averageCostPerTask: 1 }],
      preference: { mode: "balanced", maxIntelligenceGap: 2, models: [{ id: "provider/model", enabled: false }] },
    } }
    await pumpTeam(deps, "t")
    expect(deps.db.query("SELECT context_error FROM team_task WHERE id=?").get(id)).toEqual({ context_error: null })
    deps.config.modelRouting.preference = { mode: "balanced", maxIntelligenceGap: 2, models: [{ id: "provider/model", enabled: true }] }
    await pumpTeam(deps, "t")
    expect(forks).toHaveLength(1)
  })
  test("lead batch updates are revision checked, atomic, preserve dependencies and require decisions for future tasks", async () => {
    const a = await add(), b = await add()
    const updates = [a, b].map(task_id => ({ task_id, revision: 1, context: { mode: "fresh" as const, reason: "Updated pipeline" } }))
    const before = deps.db.query("SELECT id,content,status,depends_on,complexity,risk FROM team_task").all()
    await expect(executeTeamTasksAdd(deps, { tasks: [], context_updates: updates }, "ses_reader")).rejects.toThrow("lead")
    await expect(executeTeamTasksAdd(deps, { tasks: [], context_updates: [updates[0]!, { ...updates[1]!, revision: 0 }] }, "ses_lead")).rejects.toThrow("revision")
    await executeTeamTasksAdd(deps, { tasks: [], context_updates: updates, require_context: true }, "ses_lead")
    expect(deps.db.query("SELECT id,content,status,depends_on,complexity,risk FROM team_task").all()).toEqual(before)
    expect(deps.db.query("SELECT DISTINCT context_revision FROM team_task").all()).toEqual([{ context_revision: 2 }])
    await executeTeamTasksAdd(deps, { tasks: [{ content: "Undecided new task", priority: "high" }] }, "ses_lead")
    const id = (deps.db.query("SELECT id FROM team_task WHERE content='Undecided new task'").get() as { id: string }).id
    await expect(executeTeamSpawn(deps, { name: "no-decision", prompt: "delta", claim_task: id }, "ses_lead")).rejects.toThrow("context")
  })
  test("source identity is bound at creation, not reinterpreted as the lead when later dispatching", async () => {
    await executeTeamTasksAdd(deps, { tasks: [{ content: "Child", priority: "medium", context: { ...checkpoint(), from: "current" } }] }, "ses_reader")
    deps.config = { ...deps.config, autoScale: true }
    await pumpTeam(deps, "t")
    expect(forks[0]?.sessionID).toBe("ses_reader")
  })
  test("autoscale preserves the task's declared directory policy for frozen inputs and scoped outputs", async () => {
    await executeTeamTasksAdd(deps, { tasks: [{ content: "Frozen input author", priority: "high", context: { ...checkpoint(), worktree: false } }] }, "ses_lead")
    deps.config = { ...deps.config, autoScale: true }
    await pumpTeam(deps, "t")
    expect(forks).toHaveLength(1)
    expect(deps.client.calls.filter(c => c.method === "worktree.create")).toHaveLength(0)
  })
  test("explicit task isolation is enforced for fresh read-only workers and cannot fall back to shared files", async () => {
    await executeTeamTasksAdd(deps, { tasks: [{ content: "Isolated review", priority: "high", agent: "explore", context: { mode: "fresh", reason: "Review an isolated checkout", worktree: true } }] }, "ses_lead")
    let attempts = 0
    deps.client.worktree.create = async () => { attempts++; throw new Error("worktree unavailable") }
    deps.config = { ...deps.config, autoScale: true }
    await pumpTeam(deps, "t")
    expect(attempts).toBe(1)
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(0)
    expect(await executeTeamTasksList(deps, "ses_lead")).toContain("worktree unavailable")
  })
  test("invalid batch source has no partial inserts", async () => {
    await expect(executeTeamTasksAdd(deps, { tasks: [
      { content: "Valid", priority: "medium", context: checkpoint() },
      { content: "Invalid", priority: "medium", context: { ...checkpoint(), from: "ses_foreign" } },
    ] }, "ses_lead")).rejects.toThrow("source")
    expect(deps.db.query("SELECT COUNT(*) AS n FROM team_task").get()).toEqual({ n: 0 })
  })
})
