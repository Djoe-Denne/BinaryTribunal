import { expect, test } from "bun:test"
import { createHash, randomUUID } from "node:crypto"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { createDb } from "../src/db"
import { createExecutionApi } from "../src/execution-api"
import { setupDeps } from "./helpers"

test("two physical DB handles cannot recover or re-admit another live held creation", async () => {
  const artifact = join(process.cwd(), ".tmp", "execution-bridge")
  mkdirSync(artifact, { recursive: true })
  const filename = join(artifact, `liveness-${randomUUID()}.db`)
  const db1 = createDb(filename)
  const db2 = createDb(filename)
  const deps1 = setupDeps(db1)
  const deps2 = setupDeps(db2)
  const sessions = new Map<string, Record<string, unknown>>()
  let creates = 0
  let release: () => void = () => {}
  let started: () => void = () => {}
  const start = new Promise<void>(resolve => { started = resolve })
  const hold = new Promise<void>(resolve => { release = resolve })
  deps1.client.session.create = async input => {
    creates++
    const id = String(input.id)
    sessions.set(id, { id, agent: input.agent, model: input.model, metadata: input.metadata, location: { directory: deps1.directory } })
    if (input.agent) { started(); await hold }
    return { data: { id } }
  }
  deps1.client.session.get = async input => ({ data: sessions.get(input.sessionID) })
  deps2.client.session = deps1.client.session
  const options = { principals: [{ id: "operator", tokenSha256: createHash("sha256").update("secret").digest("hex"), directories: [deps1.directory], profiles: ["explore"], models: ["fixture/small#high"] }], profile: async () => ({ id: "explore" }) }
  const one = createExecutionApi(deps1, options)
  const two = createExecutionApi(deps2, options)
  const scope = { principalId: "operator", token: "secret", missionId: "m", directory: deps1.directory }
  let pending: Promise<unknown> | undefined
  try {
    const mission = await one.handle("ensureTeam", { ...scope, teamName: "liveness", controllerId: "c", leaseMs: 300000 })
    pending = one.handle("submit", { ...scope, controllerId: "c", expectedRevision: 1, taskId: "t", attemptId: "a", executionId: "e", idempotencyKey: "k", profile: "explore", model: { providerID: "fixture", id: "small", variant: "high" }, prompt: "Bounded fixture task", worktree: false })
    await start
    const reservations = db1.query("SELECT token FROM team_spawn_reservation").all()
    const snapshot = await two.handle("snapshot", scope)
    await two.pump(mission.teamId!)
    expect(snapshot.executions?.[0]?.state).toBe("accepted")
    expect(db2.query("SELECT token FROM team_spawn_reservation").all()).toEqual(reservations)
    expect(creates).toBe(2)
    release(); await pending
    await new Promise(resolve => setTimeout(resolve, 0))
    expect((await two.handle("snapshot", scope)).executions?.[0]?.state).toBe("message_transmitted")
  } finally { release(); await pending?.catch(() => {}); await new Promise(resolve => setTimeout(resolve, 0)); db1.close(); db2.close() }
})
