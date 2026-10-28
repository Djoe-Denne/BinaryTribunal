import { describe, expect, test } from "bun:test"
import { getTeamCapacity, reserveSpawnCapacity, setTeamCapacity } from "../src/capacity"
import { withCapacityClient } from "../src/capacity-delivery"
import { startCapacityRuntime } from "../src/capacity-runtime"
import { insertTeam, setupDeps } from "./helpers"

function fixture() {
  const deps = setupDeps()
  insertTeam(deps.db, "t", "pool", "ses_lead")
  deps.db.run("UPDATE team SET project_id = ?", [deps.directory])
  deps.db.run("INSERT INTO team_member (team_id,name,session_id,agent,status,execution_status,time_created,time_updated) VALUES ('t','worker','ses_worker','build','ready','idle',1,1)")
  return deps
}

describe("persisted capacity recovery", () => {
  test("freezes legacy mission defaults once, without overwriting lead overrides", async () => {
    const deps = fixture(); deps.config.maxActiveMembers = 7
    let runtime = await startCapacityRuntime(deps); runtime.dispose()
    expect(getTeamCapacity(deps.db, "t", 99).limit).toBe(7)
    setTeamCapacity(deps.db, "t", 3)
    runtime = await startCapacityRuntime(deps); runtime.dispose()
    expect(getTeamCapacity(deps.db, "t").limit).toBe(3)
    deps.db.close()
  })

  test("releases a crashed spawn's slot and reserved task while retaining live reservations", async () => {
    const deps = fixture()
    reserveSpawnCapacity(deps.db, "t", "crashed")
    reserveSpawnCapacity(deps.db, "t", "alive")
    deps.db.run("UPDATE team_spawn_reservation SET owner_pid = -1 WHERE member_name = 'crashed'")
    deps.db.run("INSERT INTO team_task (id,team_id,content,status,assignee,priority,time_created,time_updated) VALUES ('task','t','Work','in_progress','crashed','high',1,1)")
    const runtime = await startCapacityRuntime(deps); runtime.dispose()
    expect(getTeamCapacity(deps.db, "t").starting).toBe(1)
    expect(deps.db.query("SELECT status,assignee FROM team_task WHERE id = 'task'").get()).toEqual({ status: "pending", assignee: null })
    deps.db.close()
  })

  test("startup resumes a persisted wake when capacity is free", async () => {
    const deps = fixture()
    setTeamCapacity(deps.db, "t", 1)
    const reservation = reserveSpawnCapacity(deps.db, "t", "busy")
    deps.client = withCapacityClient(deps.db, deps.client)
    await deps.client.session.promptAsync({ sessionID: "ses_worker", parts: [{ type: "text", text: "Continue" }] })
    deps.db.run("DELETE FROM team_spawn_reservation WHERE token = ?", [reservation])
    const runtime = await startCapacityRuntime(deps)
    await new Promise<void>(resolve => setTimeout(resolve, 20))
    expect(deps.client.calls.filter(call => call.method === "session.promptAsync")).toHaveLength(1)
    expect(getTeamCapacity(deps.db, "t").waiting).toBe(0)
    runtime.dispose(); deps.db.close()
  })

  test("coalesces event requests and retries due wakes without another user turn", async () => {
    const deps = fixture()
    const runtime = await startCapacityRuntime(deps)
    deps.client = withCapacityClient(deps.db, deps.client)
    deps.db.run("INSERT INTO team_capacity_queue (id,team_id,member_name,payload,time_created,retry_after) VALUES ('wake','t','worker',?,1,?)", [JSON.stringify({ sessionID: "ses_worker", parts: [{ type: "text", text: "Retry" }] }), Date.now() + 30])
    runtime.request("t"); runtime.request("t")
    await new Promise<void>(resolve => setTimeout(resolve, 70))
    expect(deps.client.calls.filter(call => call.method === "session.promptAsync")).toHaveLength(1)
    runtime.dispose(); deps.db.close()
  })

  test("does not touch admissions belonging to another project's active mission", async () => {
    const deps = fixture()
    insertTeam(deps.db, "other", "other", "ses_other")
    deps.db.run("INSERT INTO project (id,name,path,status,time_created,time_updated) VALUES ('/other-project','other','/other-project','active',1,1)")
    deps.db.run("UPDATE team SET project_id = '/other-project' WHERE id = 'other'")
    reserveSpawnCapacity(deps.db, "other", "crashed")
    deps.db.run("UPDATE team_spawn_reservation SET owner_pid = -1 WHERE team_id = 'other'")
    const runtime = await startCapacityRuntime(deps); runtime.dispose()
    expect(getTeamCapacity(deps.db, "other").starting).toBe(1)
    deps.db.close()
  })
})
