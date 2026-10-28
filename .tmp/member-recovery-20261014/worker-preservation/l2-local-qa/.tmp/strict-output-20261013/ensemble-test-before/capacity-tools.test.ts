import { describe, expect, test } from "bun:test"
import { getTeamCapacity } from "../src/capacity"
import { executeTeamCreate } from "../src/tools/team-create"
import { executeTeamMessage } from "../src/tools/team-message"
import { buildLeadSystemPrompt, buildTeammateSystemPrompt } from "../src/system-prompt"
import { executeTeamStatus } from "../src/tools/team-status"
import { insertTeam, setupDeps } from "./helpers"

describe("supervisor-controlled shared worker budget", () => {
  test("new missions persist a default of thirty or an explicit supervisor override", async () => {
    for (const limit of [undefined, 7]) {
      const deps = setupDeps()
      const result = await executeTeamCreate(deps, { name: "capacity", max_running_members: limit }, "ses_lead")
      const team = deps.db.query("SELECT id,max_running_members FROM team").get() as { id: string; max_running_members: number }
      expect(team.max_running_members).toBe(limit ?? 30)
      expect(result).toContain(` / ${limit ?? 30}`)
      deps.db.close()
    }
  })

  test("an invalid creation limit does not leave a partial team", async () => {
    const deps = setupDeps()
    await expect(executeTeamCreate(deps, { name: "invalid", max_running_members: -1 }, "ses_lead")).rejects.toThrow("limit")
    expect(deps.db.query("SELECT COUNT(*) AS n FROM team").get()).toEqual({ n: 0 })
    deps.db.close()
  })

  test("only the supervisor can change the mission's capacity", async () => {
    const deps = setupDeps(); insertTeam(deps.db, "t", "pool", "ses_lead")
    deps.db.run("INSERT INTO team_member (team_id,name,session_id,agent,status,time_created,time_updated) VALUES ('t','worker','ses_worker','build','ready',1,1)")
    deps.registry.register("t", "worker", "ses_worker")
    await expect(executeTeamMessage(deps, { to: "lead", max_running_members: 2 }, "ses_worker")).rejects.toThrow("lead")
    expect(getTeamCapacity(deps.db, "t").limit).toBe(30)
    await expect(executeTeamMessage(deps, { to: "worker", max_running_members: 2 }, "ses_lead")).rejects.toThrow("lead")
    await expect(executeTeamMessage(deps, { to: "lead", max_running_members: 2 }, "ses_lead")).resolves.toContain(" / 2")
    expect(getTeamCapacity(deps.db, "t").limit).toBe(2)
    expect(deps.client.calls.filter(c => c.method === "session.abort")).toHaveLength(0)
    deps.db.close()
  })

  test("lead, worker and status all report the current stored budget", async () => {
    const deps = setupDeps(); insertTeam(deps.db, "t", "pool", "ses_lead")
    await executeTeamMessage(deps, { to: "lead", max_running_members: 12 }, "ses_lead")
    expect(buildLeadSystemPrompt(deps.db, "t", deps.config)).toContain(" / 12")
    expect(buildTeammateSystemPrompt(deps.db, "t", "worker")).toContain(" / 12")
    expect(await executeTeamStatus(deps, "ses_lead")).toContain(" / 12")
    deps.db.close()
  })

  test("raising capacity drains pending tasks using the mission's shared dispatch policy", async () => {
    const deps = setupDeps(); insertTeam(deps.db, "t", "pool", "ses_lead")
    await executeTeamMessage(deps, { to: "lead", max_running_members: 1, auto_dispatch: true, auto_scale: false }, "ses_lead")
    deps.db.run("INSERT INTO team_member (team_id,name,session_id,agent,status,execution_status,time_created,time_updated) VALUES ('t','working','ses_working','build','busy','running',1,1),('t','free','ses_free','build','ready','idle',1,1)")
    deps.db.run("INSERT INTO team_task (id,team_id,content,status,priority,time_created,time_updated) VALUES ('next','t','Next','pending','high',1,1)")
    await executeTeamMessage(deps, { to: "lead", max_running_members: 2 }, "ses_lead")
    expect(deps.db.query("SELECT assignee,status FROM team_task WHERE id = 'next'").get()).toEqual({ assignee: "free", status: "in_progress" })
    deps.db.close()
  })
})
