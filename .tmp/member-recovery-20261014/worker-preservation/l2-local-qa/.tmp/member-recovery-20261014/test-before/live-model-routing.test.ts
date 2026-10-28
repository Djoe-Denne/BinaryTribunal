import { expect, test } from "bun:test"
import { liveModelRoutingConfig } from "../src/config"
import { assertMissionModelAllowed } from "../src/model-authorization"
import { executeTeamSpawn } from "../src/tools/team-spawn"
import { executeTeamMessage } from "../src/tools/team-message"
import { setupDeps, insertTeam } from "./helpers"
import { setupEnsemble } from "../src/v2-setup"
import type { V2ToolDef } from "../src/v2-tools"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

function fixture() {
  const deps = setupDeps(); insertTeam(deps.db, "team", "test", "lead")
  let routing = { ...deps.config.modelRouting, selectionConfigured: true, pausedTeams: ["team"], models: [{ id: "fixture/model", reasoningEffort: "max", available: true, intelligenceScore: 50, averageCostPerTask: 0.1 }] }
  deps.config = liveModelRoutingConfig({ ...deps.config, modelRouting: routing }, () => routing)
  return { deps, setRouting: (value: typeof routing) => { routing = value }, get routing() { return routing } }
}

test("resident spawn observes pause removal immediately, no plugin reload or routing bypass", async () => {
  const f = fixture(), input = { name: "worker", prompt: "mock only", model: "fixture/model", variant: "max", worktree: false }
  await expect(executeTeamSpawn(f.deps, input, "lead")).rejects.toThrow("paused by the operator")
  expect(f.deps.client.calls).toEqual([])
  f.setRouting({ ...f.routing, pausedTeams: [] })
  await executeTeamSpawn(f.deps, input, "lead")
  expect(f.deps.client.calls.filter(v => v.method === "session.promptAsync")).toHaveLength(1)
  expect(f.deps.db.query("SELECT model,model_variant FROM team_member WHERE name='worker'").get()).toEqual({ model: "fixture/model", model_variant: "max" })
  f.deps.db.close()
})

test("resident admission sees new pause and model revocation in both directions", async () => {
  const f = fixture(); f.setRouting({ ...f.routing, pausedTeams: [] })
  await executeTeamSpawn(f.deps, { name: "worker", prompt: "mock only", model: "fixture/model", variant: "max", worktree: false }, "lead")
  f.deps.client.calls.length = 0
  f.setRouting({ ...f.routing, pausedTeams: ["team"] })
  await expect(executeTeamMessage(f.deps, { to: "worker", model: "fixture/model#max" }, "lead")).rejects.toThrow("paused by the operator")
  f.setRouting({ ...f.routing, pausedTeams: [], models: f.routing.models.map(m => ({ ...m, available: false })) })
  await expect(executeTeamMessage(f.deps, { to: "worker", model: "fixture/model#max" }, "lead")).rejects.toThrow("absent or unavailable")
  expect(f.deps.client.calls).toEqual([]); f.deps.db.close()
})

test("loss of an established selection stays closed and unrelated configuration remains stable", () => {
  const f = fixture(); const limit = f.deps.config.maxActiveMembers
  f.setRouting({ ...f.routing, pausedTeams: [], selectionConfigured: false, models: [] })
  expect(() => assertMissionModelAllowed(f.deps, "team", "unknown/model", "max")).toThrow("absent or unavailable")
  expect(f.deps.config.maxActiveMembers).toBe(limit)
  f.deps.db.close()
})

test("real setup keeps registered admission tools live after an operator edits the pause file", async () => {
  const directory = mkdtempSync(join(tmpdir(), "ensemble-resume-cache-")), tools = new Map<string, V2ToolDef>(), requests: unknown[] = []
  mkdirSync(join(directory, ".opencode"))
  const writeSelection = (paused: boolean) => writeFileSync(join(directory, ".opencode/ensemble.json"), JSON.stringify({ modelRouting: { pausedTeams: paused ? ["team"] : [], models: [{ id: "fixture/model", reasoningEffort: "max", available: true, intelligenceScore: 50, averageCostPerTask: 0.1 }] } }))
  writeSelection(true)
  const hook = async () => ({ dispose: async () => {} })
  const ctx = { location: { directory }, options: {}, session: {
    create: async () => ({ id: "new-worker" }), get: async () => ({ id: "new-worker" }),
    prompt: async (input: unknown) => { requests.push(input) }, synthetic: async () => {},
    switchAgent: async () => {}, switchModel: async () => {}, interrupt: async () => {}, context: async () => [], active: async () => ({}), hook,
  }, permission: { rules: async () => {} }, tool: { hook, transform: async (cb: (editor: { add(def: V2ToolDef): void }) => void) => { cb({ add: def => tools.set(def.name, def) }); return { dispose: async () => {} } } },
    shell: { hook }, worktree: { create: async () => ({}), remove: async () => {}, list: async () => [], refresh: async () => {} },
    event: { subscribe: () => (async function* () {})() } }
  const handle = await setupEnsemble(ctx as never, { dbPath: ":memory:", dashboardPort: 0 })
  try {
    insertTeam(handle.db, "team", "test", "lead")
    handle.db.run("INSERT INTO project(id,name,path,status,time_created,time_updated) VALUES (?,'fixture',?,'active',0,0)", [directory, directory])
    handle.db.run("UPDATE team SET project_id=? WHERE id='team'", [directory])
    const spawn = tools.get("team_spawn")!, input = { name: "worker", agent: "build", prompt: "mock only", model: "fixture/model", variant: "max", worktree: false }
    await expect(spawn.execute(input, { sessionID: "lead" })).rejects.toThrow("paused by the operator")
    expect(requests).toEqual([])
    writeSelection(false)
    await spawn.execute(input, { sessionID: "lead" })
    expect(requests).toHaveLength(1)
    writeSelection(true)
    await expect(tools.get("team_message")!.execute({ to: "worker", model: "fixture/model#max" }, { sessionID: "lead" })).rejects.toThrow("paused by the operator")
    expect(requests).toHaveLength(1)
  } finally { await handle.dispose(); handle.db.close(); rmSync(directory, { recursive: true, force: true }) }
})
