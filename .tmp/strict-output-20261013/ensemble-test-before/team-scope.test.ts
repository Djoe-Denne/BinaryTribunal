import { afterEach, describe, expect, test } from "bun:test"
import path from "node:path"
import { drainCapacityQueue } from "../src/capacity-delivery"
import { startCapacityRuntime, type CapacityRuntime } from "../src/capacity-runtime"
import { dispatchNextTask, pumpTeam } from "../src/dispatch"
import { dispatchV2Event } from "../src/v2-events"
import { executeTeamSpawn, spawnFailures } from "../src/tools/team-spawn"
import { executeTeamTasksAdd } from "../src/tools/team-tasks-add"
import { insertMember, insertTeam, setupDeps } from "./helpers"

const databases: ReturnType<typeof setupDeps>["db"][] = []
const runtimes: CapacityRuntime[] = []
afterEach(() => {
  runtimes.splice(0).forEach(runtime => { runtime.dispose() })
  databases.splice(0).forEach(db => { db.close() })
  spawnFailures.clear()
})

function fixture() {
  const owner = setupDeps()
  databases.push(owner.db)
  insertTeam(owner.db, "t", "owned-mission", "ses_lead")
  insertMember(owner.db, "t", "reader", "ses_reader")
  const foreign = setupDeps(owner.db)
  foreign.directory = `${owner.directory}-other`
  const moves: Array<{ sessionID: string; directory: string }> = []
  const forks: Array<{ sessionID: string; before?: string }> = []
  for (const deps of [owner, foreign]) {
    deps.config = { ...deps.config, autoDispatch: false, autoScale: false, maxActiveMembers: 2 }
    deps.client.continuity = {
      fork: async input => { forks.push(input); return { id: "ses_child" } },
      move: async input => { moves.push(input) },
      switchAgent: async () => {}, compact: async () => {}, remove: async () => {},
    }
  }
  const task = () => owner.db.query("SELECT status,assignee,context_error,context_revision FROM team_task").get()
  const queue = () => owner.db.query("SELECT delivering FROM team_capacity_queue").all()
  const enqueue = () => owner.db.run(
    "INSERT INTO team_capacity_queue (id,team_id,member_name,payload,time_created) VALUES ('wake','t','reader',?,1)",
    [JSON.stringify({ sessionID: "ses_reader", parts: [{ type: "text", text: "Continue" }] })],
  )
  return { owner, foreign, moves, forks, task, queue, enqueue }
}

describe("mission admissions belong to their plugin location", () => {
  for (const mode of ["fresh", "checkpoint"] as const) {
    test(`a foreign pump leaves a ${mode} task intact for its owner`, async () => {
      const f = fixture()
      const context = mode === "fresh"
        ? { mode, reason: "Independent work", worktree: false }
        : { mode, from: "reader", messageID: "msg_boundary", reason: "Approved factual discovery", worktree: false }
      await executeTeamTasksAdd(f.owner, { tasks: [{ content: "Frozen input author", priority: "high", context }] }, "ses_lead")
      f.owner.db.run("UPDATE team SET auto_scale=1,auto_dispatch=0")
      const before = f.task()
      await pumpTeam(f.foreign, "t")
      expect(f.task()).toEqual(before)
      expect(f.foreign.client.calls).toHaveLength(0)
      expect(f.forks).toHaveLength(0)
      expect(f.moves).toHaveLength(0)
      expect(f.owner.db.query("SELECT * FROM team_spawn_reservation").all()).toHaveLength(0)

      await pumpTeam(f.owner, "t")
      expect(f.task()).toMatchObject({ status: "in_progress", assignee: "pool-1", context_error: null })
      if (mode === "checkpoint") {
        expect(f.forks).toEqual([{ sessionID: "ses_reader", before: "msg_boundary" }])
        expect(f.moves).toEqual([{ sessionID: "ses_child", directory: f.owner.directory }])
      }
    })
  }

  test("manual spawn rejects a foreign location before claiming or holding its context", async () => {
    const f = fixture()
    await executeTeamTasksAdd(f.owner, { tasks: [{ content: "Independent author", priority: "high", context: { mode: "fresh", reason: "Independent", worktree: false } }] }, "ses_lead")
    const row = f.owner.db.query("SELECT id FROM team_task").get() as { id: string }
    const before = f.task()
    await expect(executeTeamSpawn(f.foreign, { name: "writer", prompt: "Do the task", claim_task: row.id }, "ses_lead")).rejects.toThrow("directory")
    expect(f.task()).toEqual(before)
    expect(f.foreign.client.calls).toHaveLength(0)
    expect(f.owner.db.query("SELECT * FROM team_spawn_reservation").all()).toHaveLength(0)
  })

  test("foreign auto-dispatch cannot claim or wake an idle member", async () => {
    const f = fixture()
    await executeTeamTasksAdd(f.owner, { tasks: [{ content: "Legacy task", priority: "high" }] }, "ses_lead")
    f.owner.db.run("UPDATE team SET auto_dispatch=1")
    expect(dispatchNextTask(f.foreign, "t", "reader")).toBeNull()
    expect(f.task()).toMatchObject({ status: "pending", assignee: null })
    expect(f.foreign.client.calls).toHaveLength(0)
    expect(dispatchNextTask(f.owner, "t", "reader")).not.toBeNull()
  })

  test("foreign capacity drain cannot consume a persisted wake", async () => {
    const f = fixture()
    f.enqueue()
    drainCapacityQueue(f.foreign, "t")
    await Promise.resolve()
    expect(f.queue()).toEqual([{ delivering: 0 }])
    expect(f.foreign.client.calls).toHaveLength(0)
    drainCapacityQueue(f.owner, "t")
    await Promise.resolve()
    expect(f.queue()).toEqual([])
    expect(f.owner.client.calls.filter(call => call.method === "session.promptAsync")).toHaveLength(1)
  })

  test("foreign event requests cannot arm a capacity wake", async () => {
    const f = fixture()
    f.enqueue()
    const runtime = await startCapacityRuntime(f.foreign)
    runtimes.push(runtime)
    runtime.request("t")
    await new Promise<void>(resolve => setTimeout(resolve, 25))
    expect(f.queue()).toEqual([{ delivering: 0 }])
    expect(f.foreign.client.calls).toHaveLength(0)
  })

  test("equivalent directory spelling still permits the owning instance", async () => {
    const f = fixture()
    await executeTeamTasksAdd(f.owner, { tasks: [{ content: "Local task", priority: "high", context: { mode: "fresh", reason: "Independent", worktree: false } }] }, "ses_lead")
    f.owner.db.run("UPDATE team SET auto_scale=1")
    f.owner.directory = path.resolve(f.owner.directory, ".") + path.sep
    if (process.platform === "win32") f.owner.directory = f.owner.directory.toUpperCase().replaceAll("\\", "/")
    await pumpTeam(f.owner, "t")
    expect(f.task()).toMatchObject({ status: "in_progress", assignee: "pool-1" })
  })

  test("an unbound legacy team cannot admit work from an arbitrary instance", async () => {
    const f = fixture()
    await executeTeamTasksAdd(f.owner, { tasks: [{ content: "Legacy task", priority: "high" }] }, "ses_lead")
    f.owner.db.run("UPDATE team SET project_id='default',auto_scale=1,auto_dispatch=1")
    await pumpTeam(f.owner, "t")
    expect(f.task()).toMatchObject({ status: "pending", assignee: null })
    expect(f.owner.client.calls).toHaveLength(0)
  })
})

describe("global V2 events are owned by the mission directory", () => {
  for (const type of ["session.status", "session.idle", "session.execution.succeeded", "session.execution.failed", "session.execution.started", "session.retry.scheduled"]) {
    test(`${type} cannot be consumed by the wrong instance`, () => {
      const f = fixture()
      const initialStatus = type === "session.execution.started" ? "ready" : "busy"
      f.owner.db.run("UPDATE team_member SET status=?,execution_status='running'", [initialStatus])
      const before = f.owner.db.query("SELECT * FROM team_member").get()
      const event = { type, data: { sessionID: "ses_reader", status: "idle", attempt: 2, at: Date.now() + 1000 } }
      const foreign = dispatchV2Event(f.foreign.db, f.foreign.registry, f.foreign.tracker, event, f.foreign.directory)
      expect(foreign).toBeUndefined()
      expect(f.owner.db.query("SELECT * FROM team_member").get()).toEqual(before)
      const owned = dispatchV2Event(f.owner.db, f.owner.registry, f.owner.tracker, event, f.owner.directory)
      if (type === "session.retry.scheduled") expect(f.owner.db.query("SELECT retry_attempt FROM team_member").get()).toEqual({ retry_attempt: 2 })
      else expect(owned?.to).toBe(type === "session.execution.started" ? "busy" : "ready")
    })
  }
})
