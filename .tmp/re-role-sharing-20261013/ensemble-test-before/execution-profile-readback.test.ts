import { expect, test } from "bun:test"
import type { AgentGetOutput, AgentInfo } from "@opencode/client"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { executionJsonSha256 } from "../src/execution-output"
import { setupEnsemble, type V2SetupContext } from "../src/v2-setup"

const auth = { principalId: "operator", token: "fixture-profile-token" }
const profile = "canary-explore"
const model = { providerID: "openai", id: "gpt-6-astra", variant: "high" }
const schema = { type: "object", properties: { result: { type: "string" } }, required: ["result"], additionalProperties: false }
const output = { mode: "json_schema", strict: true, name: "profile_fixture", schema, schemaSha256: executionJsonSha256(schema), route: "openai-responses-v1" }
type SdkReply = (wrapper: AgentGetOutput) => unknown

async function fixture(reply: SdkReply = wrapper => wrapper, injected = false) {
  const directory = mkdtempSync(join(tmpdir(), "ensemble-profile-readback-"))
  const raw: AgentInfo = {
    id: profile, name: "Canary explore", mode: "primary", hidden: false,
    request: { settings: {}, headers: {}, body: {} }, system: "Read the approved execution dossier only.",
    permissions: [{ action: "*", resource: "*", effect: "deny" }, { action: "read", resource: "approved/**", effect: "allow" }],
  }
  // SDK AgentGetOutput, not the Agent.Info contract of an injected profile callback.
  const wrapper: AgentGetOutput = { location: { directory }, data: raw }
  const principal = { id: auth.principalId, tokenSha256: createHash("sha256").update(auth.token).digest("hex"), directories: [directory], profiles: [profile], models: ["openai/gpt-6-astra#high"], strictOutputModels: ["openai/gpt-6-astra#high"] }
  mkdirSync(join(directory, ".opencode"))
  writeFileSync(join(directory, ".opencode", "ensemble-execution.json"), JSON.stringify({ version: 1, principals: [principal] }))
  const calls: unknown[] = []
  let creates = 0, injectedReads = 0
  const noop = async () => ({ dispose: async () => {} })
  const ctx = {
    location: { directory }, options: {},
    agent: { get: async (input: unknown) => { calls.push(input); return reply(wrapper) } },
    session: {
      create: async () => { creates++; throw new Error("session allocation forbidden in profile boundary tests") },
      get: async () => undefined, prompt: async () => {}, synthetic: async () => {},
      switchAgent: async () => {}, switchModel: async () => {}, interrupt: async () => {},
      context: async () => [], active: async () => ({}), hook: noop,
    },
    worktree: { create: async () => { throw new Error("worktree allocation forbidden") }, remove: async () => {}, list: async () => [], refresh: async () => {} },
    permission: {}, event: { subscribe: async function* () {} }, tool: { hook: noop, transform: noop }, shell: { hook: noop },
    rpc: { register: async () => ({ events: { emit: async () => {} } }) },
  } as unknown as V2SetupContext
  const handle = await setupEnsemble(ctx, {
    dbPath: ":memory:", dashboardPort: 0,
    ...(injected ? { execution: { principals: [principal], profile: async () => { injectedReads++; return raw } } } : {}),
  })
  const now = Date.now()
  handle.db.run("INSERT INTO project (id,name,path,status,time_created,time_updated) VALUES (?,'profile-fixture',?,'active',?,?)", [directory, directory, now, now])
  handle.db.run("INSERT INTO team (id,name,project_id,lead_session_id,status,time_created,time_updated) VALUES ('team','profile-fixture',?,'fixture-lead','active',?,?)", [directory, now, now])
  // A paused, pre-seeded mission lets admission validate/persist without any session.create.
  handle.db.run("INSERT INTO execution_mission (mission_id,principal_id,directory,team_name,lead_session_id,team_id,revision,controller_id,lease_until,paused) VALUES ('mission','operator',?,'profile-fixture','fixture-lead','team',1,'controller',?,1)", [directory, now + 300000])
  const submit = () => handle.execution.handle("submit", { ...auth, directory, missionId: "mission", controllerId: "controller", expectedRevision: 1, taskId: "task", attemptId: "attempt", executionId: "execution", idempotencyKey: "key", profile, model, prompt: "offline profile admission", output })
  return {
    handle, raw, wrapper, calls, submit, get creates() { return creates }, get injectedReads() { return injectedReads },
    close: async () => { await handle.dispose(); handle.db.close(); rmSync(directory, { recursive: true, force: true }) },
  }
}

test("default execution profile unwraps the actual SDK AgentGetOutput and retains raw permissions", async () => {
  const f = await fixture()
  try {
    expect("id" in f.wrapper).toBe(false)
    expect(f.wrapper.data.id).toBe(profile)
    expect(await f.submit()).toMatchObject({ state: "accepted", executionId: "execution" })
    expect(f.calls).toEqual([{ agentID: profile }])
    const stored = f.handle.db.query("SELECT payload,phase FROM execution_record WHERE execution_id='execution'").get() as { payload: string; phase: string }
    const record = JSON.parse(stored.payload) as { selection: { profileInfo: unknown; hashes: { profileInfo: string } } }
    expect(record.selection.profileInfo).toEqual(f.raw)
    expect(record.selection.hashes.profileInfo).toBe(executionJsonSha256(f.raw))
    expect(stored.phase).toBe("queued")
    expect(f.creates).toBe(0)
    expect(f.handle.db.query("SELECT COUNT(*) AS count FROM team_member").get()).toEqual({ count: 0 })
  } finally { await f.close() }
})

const invalid: Array<[string, SdkReply]> = [
  ["undefined", () => undefined],
  ["null", () => null],
  ["scalar", () => "not a wrapper"],
  ["array wrapper", wrapper => [wrapper]],
  ["raw Agent.Info fallback", wrapper => wrapper.data],
  // A matching top-level id must never repair missing or mismatched SDK fields.
  ["wrong directory with top-level alias", wrapper => ({ ...wrapper, id: profile, location: { directory: `${wrapper.location.directory}-foreign` } })],
  ["missing location", wrapper => ({ id: profile, data: wrapper.data })],
  ["missing directory", wrapper => ({ ...wrapper, id: profile, location: {} })],
  ["array location", wrapper => ({ ...wrapper, id: profile, location: [wrapper.location] })],
  ["wrong data.id with top-level alias", wrapper => ({ ...wrapper, id: profile, data: { ...wrapper.data, id: "foreign-profile" } })],
  ["missing data.id", wrapper => ({ ...wrapper, id: profile, data: { name: profile } })],
  ["non-string data.id", wrapper => ({ ...wrapper, id: profile, data: { ...wrapper.data, id: 123 } })],
  ["missing data", wrapper => ({ id: profile, location: wrapper.location })],
  ["null data", wrapper => ({ ...wrapper, id: profile, data: null })],
  ["array data", wrapper => ({ ...wrapper, id: profile, data: [wrapper.data] })],
]

test.each(invalid)("default SDK profile rejects %s before allocation", async (_name, reply) => {
  const f = await fixture(reply)
  try {
    await expect(f.submit()).rejects.toMatchObject({ category: "permission", recoverable: false })
    expect(f.calls).toEqual([{ agentID: profile }])
    expect(f.creates).toBe(0)
    expect(f.handle.db.query("SELECT COUNT(*) AS count FROM team_member").get()).toEqual({ count: 0 })
    expect(f.handle.db.query("SELECT COUNT(*) AS count FROM execution_record").get()).toEqual({ count: 0 })
    expect(f.handle.db.query("SELECT revision FROM execution_mission WHERE mission_id='mission'").get()).toEqual({ revision: 1 })
  } finally { await f.close() }
})

test("explicit ExecutionOptions.profile retains its established raw Agent.Info contract", async () => {
  const f = await fixture(() => { throw new Error("SDK default must not replace the injected profile") }, true)
  try {
    expect(await f.submit()).toMatchObject({ state: "accepted" })
    expect(f.calls).toEqual([])
    expect(f.injectedReads).toBe(1)
    expect(f.creates).toBe(0)
    const stored = f.handle.db.query("SELECT payload FROM execution_record").get() as { payload: string }
    expect(JSON.parse(stored.payload).selection.profileInfo).toEqual(f.raw)
  } finally { await f.close() }
})
