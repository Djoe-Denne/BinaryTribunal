import { expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createDb, type Database } from "../src/db"
import { initializeExecutionStore } from "../src/execution-store"
import { setupEnsemble, type V2SetupContext } from "../src/v2-setup"
import { insertMember, insertTeam } from "./helpers"

const directory = "/tmp/test-project"
const strictOutput = { mode: "json_schema", strict: true }

function contextFixture() {
  const hooks = new Map<string, (event: never) => unknown>()
  const prompts: unknown[] = []
  const noop = async () => ({ dispose: async () => {} })
  const ctx = {
    location: { directory }, options: {},
    session: {
      create: async () => { throw new Error("unexpected native session creation") },
      get: async () => undefined,
      prompt: async (input: unknown) => { prompts.push(input) },
      synthetic: async (input: unknown) => { prompts.push(input) },
      switchAgent: async () => {}, switchModel: async () => {}, interrupt: async () => {},
      context: async () => [], active: async () => ({}),
      hook: async (name: string, callback: (event: never) => unknown) => { hooks.set(name, callback); return noop() },
    },
    worktree: { create: async () => { throw new Error("unexpected worktree") }, remove: async () => {}, list: async () => [], refresh: async () => {} },
    permission: {}, event: { subscribe: async function* () {} }, tool: { hook: noop, transform: noop }, shell: { hook: noop },
    rpc: { register: async () => ({ events: { emit: async () => {} } }) },
  } as unknown as V2SetupContext
  return { ctx, hooks, prompts }
}

function seedExecution(db: Database, output: unknown = strictOutput, ready = false) {
  initializeExecutionStore(db)
  insertTeam(db, "strict-team", "PRIVATE_TEAM_NAME", "strict-lead")
  insertMember(db, "strict-team", "worker", "strict-session", ready ? "ready" : "busy", ready ? "idle" : "running")
  db.run("INSERT INTO execution_mission (mission_id,principal_id,directory,team_name,lead_session_id,team_id,revision,controller_id,lease_until) VALUES ('mission','operator',?,'PRIVATE_TEAM_NAME','strict-lead','strict-team',1,'controller',?)", [directory, Date.now() + 30000])
  const record = {
    missionId: "mission", executionId: "execution", taskId: "strict-task", attemptId: "attempt",
    nativeSessionId: "strict-session", memberName: "worker", state: "completed", output,
    prompt: "PRIVATE_AUTHOR_PROMPT", dossier: { text: "PRIVATE_DOSSIER" },
    selection: { profile: "build", directory, model: { providerID: "openai", id: "gpt-6-astra", variant: "high" } },
  }
  db.run("INSERT INTO execution_record (execution_id,mission_id,task_id,attempt_id,idempotency_key,digest,receipt,payload,phase) VALUES ('execution','mission','strict-task','attempt','key','digest','{}',?,'done')", [JSON.stringify(record)])
}

function seedPrivateTeamContent(db: Database) {
  db.run("INSERT INTO team_message (id,team_id,from_name,to_name,content,time_created) VALUES ('private-message','strict-team','other-author','worker','PRIVATE_AUTHOR_RESULT',0)")
  db.run("INSERT INTO team_task (id,team_id,content,status,time_created,time_updated) VALUES ('board-task','strict-team','PRIVATE_BOARD_TASK','pending',0,0)")
}

function systemEvent(sessionID = "strict-session") {
  return { sessionID, system: [{ type: "text", text: "original system" }], messages: [] as unknown[] }
}

test("strict context adds only the schema-bound reminder and leaves private team messages unread", async () => {
  const f = contextFixture()
  const handle = await setupEnsemble(f.ctx, { dbPath: ":memory:", dashboardPort: 0, execution: { principals: [] } })
  try {
    seedExecution(handle.db); seedPrivateTeamContent(handle.db)
    const event = systemEvent()
    await f.hooks.get("context")?.(event as never)
    expect(event.system).toHaveLength(2)
    const reminder = event.system[1]?.text ?? ""
    expect(reminder).toContain("schema-bound final assistant JSON")
    expect(reminder).toContain("no team_message")
    expect(reminder).toContain("no file writes")
    expect(reminder).toContain("approved execution dossier")
    for (const excluded of ["MUST send", "tools.team_message", "team_status", "PRIVATE_", "other-author"]) expect(reminder).not.toContain(excluded)
    expect(event.system[0]).toEqual({ type: "text", text: "original system" })
    expect(handle.db.query("SELECT delivered FROM team_message WHERE id='private-message'").get()).toEqual({ delivered: 0 })
  } finally { await handle.dispose(); handle.db.close() }
})

test("strict final idle creates no automatic prompt or nudge receipt", async () => {
  const f = contextFixture()
  const handle = await setupEnsemble(f.ctx, { dbPath: ":memory:", dashboardPort: 0, execution: { principals: [] } })
  try {
    seedExecution(handle.db)
    handle.registry.register("strict-team", "worker", "strict-session")
    await handle.dispatch({ type: "session.status", data: { sessionID: "strict-session", status: "idle" } })
    expect(f.prompts).toEqual([])
    expect(handle.db.query("SELECT status,last_nudged_at FROM team_member WHERE session_id='strict-session'").get()).toEqual({ status: "ready", last_nudged_at: null })
  } finally { await handle.dispose(); handle.db.close() }
})

test.each([true, false])("startup skips persisted strict completion while ordinary nudges remain (bridge tables: %s)", async withStrict => {
  const root = mkdtempSync(join(tmpdir(), "ensemble-strict-context-")), dbPath = join(root, "state.db")
  const seed = createDb(dbPath)
  try {
    if (withStrict) seedExecution(seed, strictOutput, true)
    else expect(seed.query("SELECT 1 FROM sqlite_master WHERE name='execution_record'").get()).toBeNull()
    insertTeam(seed, "ordinary-team", "ordinary", "ordinary-lead")
    insertMember(seed, "ordinary-team", "ordinary-worker", "ordinary-session")
  } finally { seed.close() }
  const f = contextFixture()
  let handle: Awaited<ReturnType<typeof setupEnsemble>> | undefined
  try {
    handle = await setupEnsemble(f.ctx, { dbPath, dashboardPort: 0, execution: { principals: [] } })
    expect(f.prompts).toHaveLength(1)
    expect(JSON.stringify(f.prompts[0])).toContain("ordinary-session")
    expect(JSON.stringify(f.prompts[0])).toContain("team_message")
    if (withStrict) expect(handle.db.query("SELECT last_nudged_at FROM team_member WHERE session_id='strict-session'").get()).toEqual({ last_nudged_at: null })
  } finally {
    if (handle) { await handle.dispose(); handle.db.close() }
    rmSync(root, { recursive: true, force: true })
  }
})

test("strict compaction preserves the original system without team context", async () => {
  const f = contextFixture()
  const handle = await setupEnsemble(f.ctx, { dbPath: ":memory:", dashboardPort: 0, execution: { principals: [] } })
  try {
    seedExecution(handle.db); seedPrivateTeamContent(handle.db)
    const event = systemEvent()
    await f.hooks.get("compaction")?.(event as never)
    expect(event.system).toEqual([{ type: "text", text: "original system" }])
    expect(handle.db.query("SELECT delivered FROM team_message WHERE id='private-message'").get()).toEqual({ delivered: 0 })
  } finally { await handle.dispose(); handle.db.close() }
})

test.each([undefined, { mode: "json_schema", strict: false }, { mode: "json_schema", strict: 1 }, { mode: "json_object", strict: true }])("legacy/non-strict record keeps ordinary context and nudge behavior: %j", async output => {
  const f = contextFixture()
  const handle = await setupEnsemble(f.ctx, { dbPath: ":memory:", dashboardPort: 0, execution: { principals: [] } })
  try {
    seedExecution(handle.db, output === undefined ? null : output); seedPrivateTeamContent(handle.db)
    const event = systemEvent()
    await f.hooks.get("context")?.(event as never)
    expect(JSON.stringify(event.system)).toContain("MUST send your results to the lead via team_message")
    expect(JSON.stringify(event.system)).toContain("PRIVATE_AUTHOR_RESULT")
    expect(JSON.stringify(event.system)).toContain("tools.team_message")
    const compact = systemEvent()
    await f.hooks.get("compaction")?.(compact as never)
    expect(JSON.stringify(compact.system)).toContain("[Team Context]")
    await handle.dispatch({ type: "session.status", data: { sessionID: "strict-session", status: "idle" } })
    expect(JSON.stringify(f.prompts)).toContain("did not report results")
  } finally { await handle.dispose(); handle.db.close() }
})

test.each(["directory", "team", "session"])("strict output is scoped by its persisted mission and native binding: %s", async mismatch => {
  const f = contextFixture()
  const handle = await setupEnsemble(f.ctx, { dbPath: ":memory:", dashboardPort: 0, execution: { principals: [] } })
  try {
    seedExecution(handle.db)
    if (mismatch === "directory") handle.db.run("UPDATE execution_mission SET directory='/foreign-directory'")
    if (mismatch === "team") handle.db.run("UPDATE execution_mission SET team_id='foreign-team'")
    if (mismatch === "session") handle.db.run("UPDATE execution_record SET payload=json_set(payload,'$.nativeSessionId','foreign-session')")
    const event = systemEvent()
    await f.hooks.get("context")?.(event as never)
    expect(JSON.stringify(event.system)).toContain("MUST send your results to the lead via team_message")
  } finally { await handle.dispose(); handle.db.close() }
})

test("strict initialization guard precedes context substitution; unknown and lead sessions retain their behavior", async () => {
  const f = contextFixture()
  const handle = await setupEnsemble(f.ctx, { dbPath: ":memory:", dashboardPort: 0, execution: { principals: [] } })
  try {
    seedExecution(handle.db)
    handle.registry.register("strict-team", "worker", "strict-session")
    const context = f.hooks.get("context")
    if (!context) throw new Error("context hook was not registered")
    for (const pending of [1, 2]) {
      handle.db.run("UPDATE team_member SET spawn_pending=? WHERE session_id='strict-session'", [pending])
      const event = systemEvent()
      expect(() => context(event as never)).toThrow("initialization")
      expect(event.system).toHaveLength(1)
    }
    const admitted = systemEvent()
    admitted.messages.push({ content: "[Ensemble task strict-session]" })
    context(admitted as never)
    expect(admitted.system[1]?.text).toContain("schema-bound final assistant JSON")
    const unknown = systemEvent("unknown-session")
    context(unknown as never)
    await f.hooks.get("compaction")?.(unknown as never)
    expect(unknown.system).toEqual([{ type: "text", text: "original system" }])
    const lead = systemEvent("strict-lead")
    context(lead as never)
    expect(JSON.stringify(lead.system)).toContain("You are leading team")
    expect(JSON.stringify(lead.system)).not.toContain("schema-bound final assistant JSON")
  } finally { await handle.dispose(); handle.db.close() }
})
