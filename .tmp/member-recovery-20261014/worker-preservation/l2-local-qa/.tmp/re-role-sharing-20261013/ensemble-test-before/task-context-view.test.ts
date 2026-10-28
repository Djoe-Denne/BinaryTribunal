import { expect, test } from "bun:test"
import { setupDeps, insertTeam } from "./helpers"
import { executeTeamTasksAdd } from "../src/tools/team-tasks-add"
import { startDashboard } from "../src/dashboard"
import { buildMissionSnapshot } from "../src/mission-graph"

test("dashboard and graph expose context decisions and do not label held tasks ready", async () => {
  const deps = setupDeps()
  insertTeam(deps.db, "t", "mission", "ses_lead")
  await executeTeamTasksAdd(deps, { tasks: [{ content: "Held author", priority: "high", context: { mode: "pending", reason: "Clean boundary missing" } }] }, "ses_lead")
  const port = 30000 + Math.floor(Math.random() * 10000)
  const server = await startDashboard(deps.db, port)
  try {
    expect(server).not.toBeNull()
    const state = await (await fetch(`http://127.0.0.1:${port}/api/state`)).json()
    const mission = buildMissionSnapshot(state).missions[0]
    expect(mission?.shared[0]?.context).toMatchObject({ state: "pending", revision: 1, decision: { mode: "pending", reason: "Clean boundary missing" } })
    expect(mission?.shared[0]?.ready).toBe(false)
    expect(mission?.counts).toMatchObject({ ready: 0, blocked: 1 })
  } finally { server?.stop(true); deps.db.close() }
})
