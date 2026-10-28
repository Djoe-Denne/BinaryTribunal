import { afterEach, describe, expect, test } from "bun:test"
import { executeTeamCreate } from "../src/tools/team-create"
import { executeTeamMessage } from "../src/tools/team-message"
import { executeTeamSpawn } from "../src/tools/team-spawn"
import { executeTeamStatus, lastCallTime, lastKnownState } from "../src/tools/team-status"
import { routeMissionTaskModel } from "../src/mission-routing"
import { dispatchNextTask, pumpTeam } from "../src/dispatch"
import { setupDeps, insertTeam, insertMember } from "./helpers"
import type { Database } from "../src/db"
import { buildTeammateSystemPrompt } from "../src/system-prompt"

const databases: ReturnType<typeof setupDeps>["db"][] = []
const policy = { mode: "balanced" as const, maxIntelligenceGap: 2, models: [] }
function fixture(create = true) {
  const deps = setupDeps(); databases.push(deps.db)
  if (create) insertTeam(deps.db, "t", "mission", "ses_lead")
  deps.config.modelRouting = { beta: 0.35, models: [
    { id: "go/glm", reasoningEffort: "max", intelligenceScore: 46, averageCostPerTask: 0.2, available: true, preference: 75 },
    { id: "cursor/grok", reasoningEffort: "Extra High", intelligenceScore: 46, averageCostPerTask: 0.3, available: true, preference: 25 },
  ] }
  return deps
}
afterEach(() => { databases.splice(0).forEach(db => db.close()); lastCallTime.clear(); lastKnownState.clear() })

describe("durable model routing policy", () => {
  test("workers see the effective inherited project policy", () => {
    const deps = fixture()
    deps.config.modelRouting.preference = { ...policy, maxIntelligenceGap: 1 }
    const prompt = buildTeammateSystemPrompt(deps.db, "t", "worker", deps.config)
    expect(prompt).toContain("inherited): balanced; max gap 1")
  })
  test("dispatch joins admission's transaction on hosts without nested transaction support", () => {
    const deps = fixture(); deps.config.autoDispatch = true; deps.config.modelRouting.preference = policy
    const base = deps.db
    let active = false
    const adapter: Database = {
      query: base.query.bind(base), run: base.run.bind(base), exec: base.exec.bind(base), close: base.close.bind(base),
      transaction: fn => (...args) => {
        if (active) throw new Error("cannot start a transaction within a transaction")
        active = true
        try { return base.transaction(fn)(...args) } finally { active = false }
      },
    }
    deps.db = adapter
    insertMember(deps.db, "t", "worker", "ses_worker")
    deps.db.run("INSERT INTO team_task (id,team_id,content,status,priority,complexity,time_created,time_updated) VALUES ('task','t','Work','pending','high',50,1,1)")
    expect(dispatchNextTask(deps, "t", "worker")).toBe("task")
    expect(deps.db.query("SELECT SUM(admissions) AS n FROM team_model_distribution").get()).toEqual({ n: 1 })
  })
  test("unroutable difficult tasks stay queued without starving independent easy work", async () => {
    for (const scale of [false, true]) {
      const deps = fixture(); deps.config.autoDispatch = !scale; deps.config.autoScale = scale
      deps.config.modelRouting.models.push({ id: "openai/strong", reasoningEffort: "high", intelligenceScore: 51, averageCostPerTask: 1, available: true, preference: 0 })
      deps.config.modelRouting.preference = policy
      Array.from({ length: 6 }, (_, i) => deps.db.run("INSERT INTO team_task (id,team_id,content,status,priority,complexity,time_created,time_updated) VALUES (?,'t','Hard','pending','high',100,1,1)", [`hard-${i}`]))
      deps.db.run("INSERT INTO team_task (id,team_id,content,status,priority,complexity,time_created,time_updated) VALUES ('easy','t','Easy','pending','medium',0,2,2)")
      if (scale) await pumpTeam(deps, "t")
      else {
        insertMember(deps.db, "t", "worker", "ses_worker")
        expect(dispatchNextTask(deps, "t", "worker")).toBe("easy")
      }
      expect(deps.db.query("SELECT status FROM team_task WHERE id='easy'").get()).toEqual({ status: "in_progress" })
      expect(deps.db.query("SELECT COUNT(*) AS n FROM team_task WHERE status='pending'").get()).toEqual({ n: 6 })
    }
  })
  test("creation persists an override, and status reports revisioned changes", async () => {
    const deps = fixture(false)
    const args = { name: "mission", model_policy: policy }
    expect(await executeTeamCreate(deps, args, "ses_lead")).toContain("balanced")
    expect(await executeTeamStatus(deps, "ses_lead")).toContain("max gap 2")
    const update = { to: "lead", model_policy: { ...policy, maxIntelligenceGap: 1 }, model_policy_revision: 0 }
    expect(await executeTeamMessage(deps, update, "ses_lead")).toContain("revision 1")
    expect(await executeTeamStatus(deps, "ses_lead")).toContain("max gap 1")
    await expect(executeTeamMessage(deps, update, "ses_lead")).rejects.toThrow("reload")
  })

  test("rejects worker edits, unknown efforts, mixed controls and invalid creation without partial persistence", async () => {
    const deps = fixture()
    insertMember(deps.db, "t", "worker", "ses_worker"); deps.registry.register("t", "worker", "ses_worker")
    const edit = { to: "lead", model_policy: policy }
    await expect(executeTeamMessage(deps, edit, "ses_worker")).rejects.toThrow("lead")
    await expect(executeTeamMessage(deps, { ...edit, model_policy: { ...policy, models: [{ id: "cursor/grok", reasoningEffort: "invented", preference: 100 }] } }, "ses_lead")).rejects.toThrow("catalogue")
    await expect(executeTeamMessage(deps, { ...edit, auto_scale: true }, "ses_lead")).rejects.toThrow("separate")
    const fresh = fixture(false)
    await expect(executeTeamCreate(fresh, { name: "bad", model_policy: { ...policy, maxIntelligenceGap: 99 } }, "ses_lead")).rejects.toThrow("maxIntelligenceGap")
    expect(fresh.db.query("SELECT COUNT(*) AS n FROM team").get()).toEqual({ n: 0 })
  })

  test("preflight is read-only; concurrent admissions share one persisted weighted clock", async () => {
    const deps = fixture(); deps.config.modelRouting.preference = policy
    Array.from({ length: 5 }, () => routeMissionTaskModel(deps, "t", undefined, { complexity: 50 }))
    await Promise.all(Array.from({ length: 4 }, (_, i) => executeTeamSpawn(deps, { name: `w-${i}`, prompt: "Work", complexity: 50, worktree: false }, "ses_lead")))
    expect(deps.db.query("SELECT model,COUNT(*) AS n FROM team_member GROUP BY model ORDER BY model").all()).toEqual([
      { model: "cursor/grok", n: 1 }, { model: "go/glm", n: 3 },
    ])
    const rows = deps.db.query("SELECT admissions,credits FROM team_model_distribution WHERE team_id='t'").all() as { admissions: number; credits: string }[]
    expect(rows).toHaveLength(1)
    expect(rows[0]?.admissions).toBe(4)
    expect(Object.values(JSON.parse(rows[0]!.credits))).toEqual([0, 0])
    expect(routeMissionTaskModel({ ...deps }, "t", undefined, { complexity: 50 })?.selected.id).toBe("go/glm")
  })

  test("policy saved during native allocation wins, with the exact reasoning variant", async () => {
    const deps = fixture()
    const create = deps.client.session.create
    deps.client.session.create = async args => {
      await executeTeamMessage(deps, { to: "lead", model_policy: { ...policy, models: [{ id: "go/glm", reasoningEffort: "max", enabled: false }] } }, "ses_lead")
      return create(args)
    }
    await executeTeamSpawn(deps, { name: "late", prompt: "Work", complexity: 50, worktree: false }, "ses_lead")
    expect(deps.db.query("SELECT model,model_variant FROM team_member WHERE name='late'").get()).toEqual({ model: "cursor/grok", model_variant: "Extra High" })
  })

  test("dispatch consumes once; a pinned model and refused spawn consume no automatic turn", async () => {
    const deps = fixture(); deps.config.modelRouting.preference = policy; deps.config.autoDispatch = true
    insertMember(deps.db, "t", "worker", "ses_worker")
    deps.db.run("INSERT INTO team_task (id,team_id,content,status,priority,complexity,time_created,time_updated) VALUES ('task','t','Work','pending','high',50,1,1)")
    expect(dispatchNextTask(deps, "t", "worker")).toBe("task")
    await executeTeamSpawn(deps, { name: "pinned", prompt: "Work", model: "cursor/grok", variant: "Extra High", complexity: 50, worktree: false }, "ses_lead")
    deps.config.maxActiveMembers = 2
    await expect(executeTeamSpawn(deps, { name: "refused", prompt: "Work", complexity: 50, worktree: false }, "ses_lead")).rejects.toThrow("limit")
    expect(deps.db.query("SELECT SUM(admissions) AS n FROM team_model_distribution WHERE team_id='t'").get()).toEqual({ n: 1 })
  })

  test("a policy exclusion during allocation releases the new session and consumes no turn", async () => {
    const deps = fixture()
    const create = deps.client.session.create
    deps.client.session.create = async args => {
      await executeTeamMessage(deps, { to: "lead", model_policy: { ...policy, models: deps.config.modelRouting.models.map(model => ({ id: model.id, reasoningEffort: model.reasoningEffort, enabled: false })) } }, "ses_lead")
      return create(args)
    }
    await expect(executeTeamSpawn(deps, { name: "excluded", prompt: "Work", complexity: 50, worktree: false }, "ses_lead")).rejects.toThrow("quality floor")
    expect(deps.client.calls.filter(call => call.method === "session.abort")).toHaveLength(1)
    expect(deps.db.query("SELECT COUNT(*) AS n FROM team_model_distribution").get()).toEqual({ n: 0 })
    expect(deps.db.query("SELECT COUNT(*) AS n FROM team_spawn_reservation").get()).toEqual({ n: 0 })
  })
})
