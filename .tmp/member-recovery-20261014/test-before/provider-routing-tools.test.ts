import { afterEach, describe, expect, test } from "bun:test"
import { getProviderPolicy, saveProviderPolicy } from "../src/provider-policy"
import { executeTeamCreate } from "../src/tools/team-create"
import { executeTeamMessage } from "../src/tools/team-message"
import { executeTeamSpawn } from "../src/tools/team-spawn"
import { executeTeamStatus } from "../src/tools/team-status"
import { buildLeadSystemPrompt, buildTeammateSystemPrompt } from "../src/system-prompt"
import { dispatchNextTask } from "../src/dispatch"
import { withCapacityClient } from "../src/capacity-delivery"
import { setupDeps, insertTeam, insertMember } from "./helpers"

const databases: ReturnType<typeof setupDeps>["db"][] = []
function fixture(createTeam = true) {
  const deps = setupDeps(); databases.push(deps.db)
  if (createTeam) insertTeam(deps.db, "t", "mission", "ses_lead")
  deps.config.modelRouting = { beta: 0.35, models: [
    { id: "openai/strong", intelligenceScore: 90, averageCostPerTask: 0.01, available: true },
    { id: "included/strong", intelligenceScore: 90, averageCostPerTask: 0.2, available: true },
  ] }
  return deps
}
afterEach(() => { databases.splice(0).forEach(db => db.close()) })
function task(deps: ReturnType<typeof fixture>, id = "task") {
  deps.db.run("INSERT INTO team_task (id,team_id,content,status,priority,complexity,risk,time_created,time_updated) VALUES (?,'t','Work','pending','high',50,20,1,1)", [id])
}

describe("mission provider controls and admission", () => {
  test("the lead can persist a creation preference and change it without a text message", async () => {
    const deps = fixture(false)
    await executeTeamCreate(deps, { name: "mission", provider_order: ["included", "openai"] }, "ses_lead")
    const { id } = deps.db.query("SELECT id FROM team").get() as { id: string }
    expect(getProviderPolicy(deps.db, id).providerOrder).toEqual(["included", "openai"])
    const result = await executeTeamMessage(deps, { to: "lead", provider_order: ["openai"] }, "ses_lead")
    expect(result).toContain("openai")
    expect(getProviderPolicy(deps.db, id).providerOrder).toEqual(["openai"])
  })

  test("rejects worker edits and invalid creation orders without partial teams", async () => {
    const deps = fixture()
    insertMember(deps.db, "t", "worker", "ses_worker")
    deps.registry.register("t", "worker", "ses_worker")
    await expect(executeTeamMessage(deps, { to: "lead", provider_order: ["included"] }, "ses_worker")).rejects.toThrow("lead")
    const empty = fixture(false)
    await expect(executeTeamCreate(empty, { name: "bad", provider_order: ["provider/model"] }, "ses_lead")).rejects.toThrow("provider")
    expect(empty.db.query("SELECT COUNT(*) AS n FROM team").get()).toEqual({ n: 0 })
  })

  test("lead, workers and status can read the same stored preference and revision", async () => {
    const deps = fixture()
    saveProviderPolicy(deps.db, "t", ["included", "openai"])
    expect(buildLeadSystemPrompt(deps.db, "t", deps.config)).toContain("included > openai")
    expect(buildTeammateSystemPrompt(deps.db, "t", "worker")).toContain("included > openai")
    expect(await executeTeamStatus(deps, "ses_lead")).toContain("included > openai")
  })

  test("spawn follows the persisted order while an explicit model remains an auditable override", async () => {
    const deps = fixture(); saveProviderPolicy(deps.db, "t", ["included"])
    task(deps)
    await executeTeamSpawn(deps, { name: "a", prompt: "Work", claim_task: "task", worktree: false }, "ses_lead")
    expect(deps.db.query("SELECT model FROM team_member WHERE name = 'a'").get()).toEqual({ model: "included/strong" })
    await executeTeamSpawn(deps, { name: "b", prompt: "Work", complexity: 50, model: "openai/strong", worktree: false }, "ses_lead")
    expect(deps.db.query("SELECT model FROM team_member WHERE name = 'b'").get()).toEqual({ model: "openai/strong" })
  })

  test("a reused idle worker is routed for its new task using the latest mission order", () => {
    const deps = fixture(); deps.config.autoDispatch = true
    saveProviderPolicy(deps.db, "t", ["included"])
    task(deps)
    insertMember(deps.db, "t", "worker", "ses_worker")
    deps.db.run("UPDATE team_member SET model = 'openai/strong' WHERE name = 'worker'")
    expect(dispatchNextTask(deps, "t", "worker")).toBe("task")
    const call = deps.client.calls.find(c => c.method === "session.promptAsync")
    expect(call?.args[0]).toMatchObject({ model: { providerID: "included", modelID: "strong" } })
    expect(deps.db.query("SELECT model FROM team_member WHERE name = 'worker'").get()).toEqual({ model: "included/strong" })
  })

  test("rechecks provider preference after asynchronous session allocation", async () => {
    const deps = fixture()
    task(deps)
    const create = deps.client.session.create
    deps.client.session.create = async options => {
      saveProviderPolicy(deps.db, "t", ["included"])
      return create(options)
    }
    await executeTeamSpawn(deps, { name: "late", prompt: "Work", claim_task: "task", worktree: false }, "ses_lead")
    expect(deps.db.query("SELECT model FROM team_member WHERE name = 'late'").get()).toEqual({ model: "included/strong" })
    expect(deps.client.calls.find(c => c.method === "session.promptAsync")?.args[0]).toMatchObject({ model: { providerID: "included", modelID: "strong" } })
  })

  test("keeps a supervisor's explicit model override when reusing a worker", async () => {
    const deps = fixture(); deps.config.autoDispatch = true
    saveProviderPolicy(deps.db, "t", ["included"])
    await executeTeamSpawn(deps, { name: "pinned", prompt: "Work", model: "openai/strong", worktree: false }, "ses_lead")
    deps.db.run("UPDATE team_member SET status = 'ready', execution_status = 'idle', admission_token = NULL WHERE name = 'pinned'")
    task(deps)
    expect(dispatchNextTask(deps, "t", "pinned")).toBe("task")
    expect(deps.db.query("SELECT model FROM team_member WHERE name = 'pinned'").get()).toEqual({ model: "openai/strong" })
  })

  test("a task retried after transport failure uses the newly saved policy", async () => {
    const deps = fixture(); deps.config.autoDispatch = true
    insertMember(deps.db, "t", "worker", "ses_worker")
    task(deps)
    const original = deps.client.session.promptAsync
    let unavailable = true
    deps.client.session.promptAsync = async options => {
      if (unavailable) throw new Error("Transport offline")
      return original(options)
    }
    deps.client = withCapacityClient(deps.db, deps.client)
    expect(dispatchNextTask(deps, "t", "worker")).toBe("task")
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(deps.db.query("SELECT status,assignee FROM team_task WHERE id = 'task'").get()).toEqual({ status: "pending", assignee: null })
    saveProviderPolicy(deps.db, "t", ["included"])
    unavailable = false
    expect(dispatchNextTask(deps, "t", "worker")).toBe("task")
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(deps.client.calls.find(c => c.method === "session.promptAsync")?.args[0]).toMatchObject({ model: { providerID: "included", modelID: "strong" } })
    expect(deps.db.query("SELECT COUNT(*) AS n FROM team_capacity_queue").get()).toEqual({ n: 0 })
  })
})
