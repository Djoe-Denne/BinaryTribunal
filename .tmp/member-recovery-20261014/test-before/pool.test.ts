import { describe, test, expect, beforeEach } from "bun:test"
import { setupDeps, insertTeam, setupDb } from "./helpers"
import type { ToolDeps } from "../src/types"
import { nextWorkerName, pumpTeam } from "../src/dispatch"
import { withCapacityClient } from "../src/capacity-delivery"

/** Insert a member with a specific agent type. */
function insertAgentMember(db: ReturnType<typeof setupDb>, teamId: string, name: string, sessionId: string, agent: string, status = "ready") {
  db.run(
    "INSERT INTO team_member (team_id, name, session_id, agent, status, execution_status, spawn_pending, time_created, time_updated) VALUES (?, ?, ?, ?, ?, 'idle', 0, ?, ?)",
    [teamId, name, sessionId, agent, status, Date.now(), Date.now()]
  )
}

function insertTask(db: ReturnType<typeof setupDb>, teamId: string, id: string, opts: { priority?: string; agent?: string | null } = {}) {
  db.run(
    "INSERT INTO team_task (id, team_id, content, status, priority, assignee, agent, time_created, time_updated) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)",
    [id, teamId, `content of ${id}`, "pending", opts.priority ?? "medium", opts.agent ?? null, Date.now(), Date.now()]
  )
}

function insertBusyMember(db: ReturnType<typeof setupDb>, teamId: string, name: string, sessionId: string) {
  insertAgentMember(db, teamId, name, sessionId, "build", "busy")
  db.run("UPDATE team_member SET execution_status = 'running' WHERE team_id = ? AND name = ?", [teamId, name])
}

describe("nextWorkerName", () => {
  test("increments past existing pool workers", () => {
    const db = setupDb()
    insertTeam(db, "t1", "my-team", "lead-sess")
    insertAgentMember(db, "t1", "pool-1", "s1", "build")
    insertAgentMember(db, "t1", "pool-7", "s7", "build", "shutdown")
    expect(nextWorkerName(db, "t1")).toBe("pool-8")
  })

  test("starts at pool-1 on a fresh team", () => {
    const db = setupDb()
    insertTeam(db, "t1", "my-team", "lead-sess")
    expect(nextWorkerName(db, "t1")).toBe("pool-1")
  })
})

describe("pumpTeam", () => {
  let deps: ToolDeps & { client: { calls: Array<{ method: string; args: unknown[] }> } }

  beforeEach(() => {
    deps = setupDeps()
    insertTeam(deps.db, "t1", "my-team", "lead-sess")
  })

  test("is a no-op when both autoDispatch and autoScale are off", async () => {
    insertTask(deps.db, "t1", "task_1")
    insertAgentMember(deps.db, "t1", "alice", "sess-alice", "build")
    deps.registry.register("t1", "alice", "sess-alice")

    await pumpTeam(deps, "t1")
    expect(deps.client.calls).toHaveLength(0)
  })

  test("feeds idle members before spawning (autoDispatch only)", async () => {
    deps.config = { ...deps.config, autoDispatch: true, maxActiveMembers: 5 }
    insertTask(deps.db, "t1", "task_1")
    insertAgentMember(deps.db, "t1", "alice", "sess-alice", "build")
    deps.registry.register("t1", "alice", "sess-alice")

    await pumpTeam(deps, "t1")
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(0)
    const row = deps.db.query("SELECT assignee FROM team_task WHERE id = 'task_1'").get() as { assignee: string | null }
    expect(row.assignee).toBe("alice")
  })

  test("reserves one task per available worker instead of draining the queue into the first", async () => {
    deps.config = { ...deps.config, autoDispatch: true }
    deps.client = withCapacityClient(deps.db, deps.client)
    for (const name of ["alice", "bob"]) {
      insertAgentMember(deps.db, "t1", name, `sess-${name}`, "build")
      deps.registry.register("t1", name, `sess-${name}`)
    }
    for (const id of ["t-a", "t-b", "t-c", "t-d"]) insertTask(deps.db, "t1", id)
    await pumpTeam(deps, "t1")
    const claims = deps.db.query("SELECT assignee,COUNT(*) AS n FROM team_task WHERE status = 'in_progress' GROUP BY assignee ORDER BY assignee").all()
    expect(claims).toEqual([{ assignee: "alice", n: 1 }, { assignee: "bob", n: 1 }])
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(2)
    await pumpTeam(deps, "t1")
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(2)
  })

  test("does not feed an idle worker that still owns unfinished work", async () => {
    deps.config = { ...deps.config, autoDispatch: true }
    insertAgentMember(deps.db, "t1", "alice", "sess-alice", "build")
    deps.registry.register("t1", "alice", "sess-alice")
    insertTask(deps.db, "t1", "current"); insertTask(deps.db, "t1", "next")
    deps.db.run("UPDATE team_task SET assignee = 'alice', status = 'in_progress' WHERE id = 'current'")
    await pumpTeam(deps, "t1")
    expect(deps.client.calls).toHaveLength(0)
  })

  test("enforces capacity when waking existing idle workers", async () => {
    deps.config = { ...deps.config, autoDispatch: true, maxActiveMembers: 1 }
    insertBusyMember(deps.db, "t1", "working", "sess-working")
    insertAgentMember(deps.db, "t1", "alice", "sess-alice", "build")
    deps.registry.register("t1", "alice", "sess-alice")
    insertTask(deps.db, "t1", "next")
    await pumpTeam(deps, "t1")
    expect(deps.client.calls).toHaveLength(0)
  })

  test("fills available slots in one pump and counts starts across concurrent pumps", async () => {
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 3 }
    for (const id of ["t-a", "t-b", "t-c", "t-d"]) insertTask(deps.db, "t1", id)
    await Promise.all([pumpTeam(deps, "t1"), pumpTeam(deps, "t1")])
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(3)
    expect(deps.db.query("SELECT COUNT(DISTINCT assignee) AS n FROM team_task WHERE status = 'in_progress'").get()).toEqual({ n: 3 })
  })

  test("stops scaling when the supervisor disables it during native allocation", async () => {
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 3 }
    for (const id of ["t-a", "t-b", "t-c"]) insertTask(deps.db, "t1", id)
    const create = deps.client.session.create
    deps.client.session.create = async options => {
      deps.db.run("UPDATE team SET auto_scale = 0 WHERE id = 't1'")
      return create(options)
    }
    await pumpTeam(deps, "t1")
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(1)
  })

  test("read-only pool workers claim the explicitly assigned board task", async () => {
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 2 }
    insertTask(deps.db, "t1", "discover", { agent: "explore" })
    await pumpTeam(deps, "t1")
    expect(deps.db.query("SELECT status,assignee FROM team_task WHERE id = 'discover'").get()).toEqual({ status: "in_progress", assignee: "pool-1" })
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(1)
  })

  test("scales up to the cap when work exceeds idle capacity", async () => {
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 2 }
    insertBusyMember(deps.db, "t1", "busy-1", "sess-busy-1")
    deps.registry.register("t1", "busy-1", "sess-busy-1")
    insertTask(deps.db, "t1", "task_1")
    insertTask(deps.db, "t1", "task_2")

    await pumpTeam(deps, "t1")

    const created = deps.client.calls.filter(c => c.method === "session.create")
    expect(created).toHaveLength(1)
    const worker = deps.db.query("SELECT name, agent, status FROM team_member WHERE name LIKE 'pool-%'").get() as { name: string; agent: string; status: string } | null
    expect(worker?.name).toBe("pool-1")
    expect(worker?.agent).toBe("build")
    expect(worker?.status).toBe("busy")

    const claimed = deps.db.query("SELECT id, assignee FROM team_task WHERE assignee = 'pool-1'").get() as { id: string; assignee: string } | null
    expect(claimed?.id).toBe("task_1")
  })

  test("never exceeds the cap", async () => {
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 1 }
    insertBusyMember(deps.db, "t1", "busy-1", "sess-busy-1")
    deps.registry.register("t1", "busy-1", "sess-busy-1")
    insertTask(deps.db, "t1", "task_1")

    await pumpTeam(deps, "t1")
    await Promise.resolve()

    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(0)
  })

  test("does not spawn when no unassigned task remains", async () => {
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 5 }
    insertBusyMember(deps.db, "t1", "busy-1", "sess-busy-1")
    deps.registry.register("t1", "busy-1", "sess-busy-1")
    insertTask(deps.db, "t1", "task_1")
    deps.db.run("UPDATE team_task SET status = 'in_progress', assignee = 'busy-1' WHERE id = 'task_1'")

    await pumpTeam(deps, "t1")

    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(0)
  })

  test("uses the task affinity as the worker agent type", async () => {
    deps.config = { ...deps.config, autoDispatch: true, autoScale: true, maxActiveMembers: 5 }
    insertBusyMember(deps.db, "t1", "busy-1", "sess-busy-1")
    deps.registry.register("t1", "busy-1", "sess-busy-1")
    insertTask(deps.db, "t1", "task_1", { agent: "general" })

    await pumpTeam(deps, "t1")
    await Promise.resolve()

    const worker = deps.db.query("SELECT agent FROM team_member WHERE name LIKE 'pool-%'").get() as { agent: string } | null
    expect(worker?.agent).toBe("general")
  })
})
