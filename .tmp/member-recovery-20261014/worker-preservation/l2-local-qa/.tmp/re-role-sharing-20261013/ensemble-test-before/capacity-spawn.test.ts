import { describe, expect, test } from "bun:test"
import { getTeamCapacity } from "../src/capacity"
import { withCapacityClient } from "../src/capacity-delivery"
import { executeTeamSpawn } from "../src/tools/team-spawn"
import { setupDeps, insertTeam } from "./helpers"

describe("manual spawn admission", () => {
  test("a board task is reserved before session creation so competing spawns cannot both run it", async () => {
    const deps = setupDeps()
    insertTeam(deps.db, "task-race", "pool", "ses_lead")
    deps.db.run("INSERT INTO team_task (id,team_id,content,status,priority,time_created,time_updated) VALUES ('task','task-race','Work','pending','high',1,1)")
    const create = deps.client.session.create
    deps.client.session.create = async options => {
      expect(deps.db.query("SELECT assignee FROM team_task WHERE id = 'task'").get()).toEqual({ assignee: "a" })
      return create(options)
    }
    const results = await Promise.allSettled(["a", "b"].map(name => executeTeamSpawn(deps, { name, prompt: "Work", claim_task: "task", worktree: false }, "ses_lead", true)))
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1)
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(1)
    deps.db.close()
  })

  test("a failed session creation returns its pre-reserved task to the board", async () => {
    const deps = setupDeps()
    insertTeam(deps.db, "task-failure", "pool", "ses_lead")
    deps.db.run("INSERT INTO team_task (id,team_id,content,status,priority,time_created,time_updated) VALUES ('task','task-failure','Work','pending','high',1,1)")
    deps.client.session.create = async () => { throw new Error("offline") }
    await expect(executeTeamSpawn(deps, { name: "a", prompt: "Work", claim_task: "task", worktree: false }, "ses_lead")).rejects.toThrow("offline")
    expect(deps.db.query("SELECT status,assignee FROM team_task WHERE id = 'task'").get()).toEqual({ status: "pending", assignee: null })
    expect(getTeamCapacity(deps.db, "task-failure").available).toBe(30)
    deps.db.close()
  })

  test("two concurrent spawns cannot allocate the same final slot", async () => {
    const deps = setupDeps()
    insertTeam(deps.db, "capacity-race", "pool", "ses_lead")
    deps.config.maxActiveMembers = 1
    deps.client = withCapacityClient(deps.db, deps.client, 1)
    const results = await Promise.allSettled(["a", "b"].map(name => executeTeamSpawn(deps, { name, prompt: "Work", worktree: false }, "ses_lead")))
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1)
    expect(deps.client.calls.filter(c => c.method === "session.create")).toHaveLength(1)
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(1)
    expect(getTeamCapacity(deps.db, "capacity-race", 1).waiting).toBe(0)
    expect(getTeamCapacity(deps.db, "capacity-race", 1).available).toBe(0)
    expect(deps.db.query("SELECT COUNT(*) AS n FROM team_spawn_reservation").get()).toEqual({ n: 0 })
    deps.db.close()
  })

  test("a failed allocation frees its reservation for the next worker", async () => {
    const deps = setupDeps()
    insertTeam(deps.db, "capacity-failure", "pool", "ses_lead")
    deps.config.maxActiveMembers = 1
    const create = deps.client.session.create
    deps.client.session.create = async () => { throw new Error("test allocation failure") }
    await expect(executeTeamSpawn(deps, { name: "a", prompt: "Work", worktree: false }, "ses_lead")).rejects.toThrow("allocation failure")
    expect(getTeamCapacity(deps.db, "capacity-failure", 1).available).toBe(1)
    deps.client.session.create = create
    await expect(executeTeamSpawn(deps, { name: "b", prompt: "Work", worktree: false }, "ses_lead")).resolves.toContain("b")
    deps.db.close()
  })
})
