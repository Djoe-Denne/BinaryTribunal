import { describe, expect, test } from "bun:test"
import { assertMissionModelAllowed, normalizeModelSelection, authorizeSessionModel, ownsModelRequestLocation, sessionPolicyDirectory } from "../src/model-authorization"
import { createV2Client } from "../src/v2-client"
import { executeTeamSpawn } from "../src/tools/team-spawn"
import { executeTeamMessage } from "../src/tools/team-message"
import { loadConfig } from "../src/config"
import { setupDeps, insertTeam, insertMember } from "./helpers"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const selected = { id: "fixture/cheap", reasoningEffort: "max", intelligenceScore: 50, averageCostPerTask: 0.1, available: true }
function fixture() {
  const deps = setupDeps(); insertTeam(deps.db, "t1", "team", "lead")
  deps.config.modelRouting = { ...deps.config.modelRouting, selectionConfigured: true, models: [selected, { ...selected, id: "fixture/disabled", available: false }] }
  return deps
}
describe("mandatory model selection authorization", () => {
  test("worker worktrees are protected with the owning mission policy, not local preference overrides", () => {
    const d = fixture(); insertMember(d.db, "t1", "worker", "ses_worker")
    d.db.run("UPDATE team_member SET worktree_dir='/tmp/worker-tree' WHERE name='worker'")
    expect(ownsModelRequestLocation(d, "t1", "ses_worker", "/tmp/worker-tree")).toBe(true)
    expect(ownsModelRequestLocation(d, "t1", "ses_worker", "/tmp/foreign-tree")).toBe(false)
    expect(sessionPolicyDirectory(d, "ses_worker", "/tmp/worker-tree")).toBe("/tmp/test-project")
    d.db.close()
  })
  test("operator pause blocks all models and old lead/member requests without affecting another team", () => {
    const d = fixture(); insertMember(d.db, "t1", "worker", "ses_worker"); insertTeam(d.db, "t2", "other", "other_lead")
    d.config.modelRouting.pausedTeams = ["t1"]
    expect(() => assertMissionModelAllowed(d, "t1", selected.id, "max")).toThrow("paused by the operator")
    for (const id of ["lead", "ses_worker"]) expect(() => authorizeSessionModel(d, id, { providerID: "fixture", id: "cheap", variant: "max" })).toThrow("paused by the operator")
    expect(() => authorizeSessionModel(d, "other_lead", { providerID: "fixture", id: "cheap", variant: "max" })).not.toThrow()
    d.config.modelRouting.pausedTeams = []
    expect(() => authorizeSessionModel(d, "lead", { providerID: "fixture", id: "cheap", variant: "max" })).not.toThrow(); d.db.close()
  })
  test.each(["fixture/disabled", "opencode-go/grok-4.7", "other/cheap"])("explicit override cannot admit %s", model => {
    const d = fixture(); expect(() => assertMissionModelAllowed(d, "t1", model, "max")).toThrow("Model selection denied"); d.db.close()
  })
  test("exact enabled pair accepted; unevaluated/default variant denied", () => {
    const d = fixture(); expect(() => assertMissionModelAllowed(d, "t1", selected.id, "max")).not.toThrow()
    for (const variant of [undefined, "high", "MAX"]) expect(() => assertMissionModelAllowed(d, "t1", selected.id, variant)).toThrow()
    d.db.close()
  })
  test.each(["legacy", "balanced"])("mission disable and zero weight enforced in %s", mode => {
    const d = fixture()
    for (const entry of [{ enabled: false }, { preference: 0 }]) {
      d.db.run("UPDATE team SET model_policy=? WHERE id='t1'", [JSON.stringify({ mode, models: [{ id: selected.id, reasoningEffort: "max", ...entry }] })])
      expect(() => assertMissionModelAllowed(d, "t1", selected.id, "max")).toThrow()
    }
    d.db.close()
  })
  test("mission enabled cannot resurrect a globally unavailable pair", () => {
    const d = fixture(); d.db.run("UPDATE team SET model_policy=? WHERE id='t1'", [JSON.stringify({ models: [{ id: "fixture/disabled", reasoningEffort: "max", enabled: true }] })])
    expect(() => assertMissionModelAllowed(d, "t1", "fixture/disabled", "max")).toThrow(); d.db.close()
  })
  test("mission enabled cannot override a global preference disable", () => {
    const d = fixture(); d.config.modelRouting.preference = { mode: "legacy", maxIntelligenceGap: 2, models: [{ id: selected.id, reasoningEffort: "max", enabled: false }] }
    d.db.run("UPDATE team SET model_policy=? WHERE id='t1'", [JSON.stringify({ models: [{ id: selected.id, reasoningEffort: "max", enabled: true }] })])
    expect(() => assertMissionModelAllowed(d, "t1", selected.id, "max")).toThrow(); d.db.close()
  })
  test("configured empty selection and unknown implicit model are closed", () => {
    const d = fixture(); d.config.modelRouting.models = []
    expect(() => assertMissionModelAllowed(d, "t1", selected.id, "max")).toThrow()
    expect(() => assertMissionModelAllowed(d, "t1", undefined)).toThrow(); d.db.close()
  })
  test("no operator selection retains legacy compatibility", () => {
    const d = setupDeps(); insertTeam(d.db, "t1", "team", "lead")
    expect(() => assertMissionModelAllowed(d, "t1", "fixture/legacy", "high")).not.toThrow(); d.db.close()
  })
  test("pinned suffix becomes a real native variant; ambiguity fails closed", () => {
    expect(normalizeModelSelection("fixture/cheap#max")).toEqual({ model: "fixture/cheap", variant: "max" })
    expect(normalizeModelSelection("fixture/cheap", "max")).toEqual({ model: "fixture/cheap", variant: "max" })
    for (const model of ["fixture/cheap#", "fixture/cheap#max#high", "fixture/cheap ", "cheap"]) expect(() => normalizeModelSelection(model)).toThrow()
    expect(() => normalizeModelSelection("fixture/cheap#max", "high")).toThrow()
  })
  test("spawn rejects before worktree, fork, session or task reservation effects", async () => {
    const d = fixture()
    await expect(executeTeamSpawn(d, { name: "bad", agent: "build", prompt: "never sent", model: "opencode-go/grok-4.7", variant: "high" }, "lead")).rejects.toThrow("Model selection denied")
    expect(d.client.calls).toHaveLength(0)
    expect(d.db.query("SELECT COUNT(*) n FROM team_member").get()).toEqual({ n: 0 }); d.db.close()
  })
  test("in-place model change rejects without changing stored member selection", async () => {
    const d = fixture(); insertMember(d.db, "t1", "worker", "ses_worker")
    d.db.run("UPDATE team_member SET model=?,model_variant=? WHERE name='worker'", [selected.id, "max"])
    await expect(executeTeamMessage(d, { to: "worker", model: "opencode-go/grok-4.7#high" }, "lead")).rejects.toThrow("Model selection denied")
    expect(d.db.query("SELECT model,model_variant FROM team_member WHERE name='worker'").get()).toEqual({ model: selected.id, model_variant: "max" })
    expect(d.client.calls).toHaveLength(0); d.db.close()
  })
  test("authorized in-place update stores native ID/variant separately", async () => {
    const d = fixture(); insertMember(d.db, "t1", "worker", "ses_worker")
    await executeTeamMessage(d, { to: "worker", model: "fixture/cheap#max" }, "lead")
    expect(d.db.query("SELECT model,model_variant FROM team_member WHERE name='worker'").get()).toEqual({ model: selected.id, model_variant: "max" }); d.db.close()
  })
  test("runtime rechecks current policy on every wake, including implicit session model", () => {
    const d = fixture(); insertMember(d.db, "t1", "worker", "ses_worker")
    expect(() => authorizeSessionModel(d, "ses_worker", { providerID: "fixture", id: "cheap", variant: "max" })).not.toThrow()
    d.config.modelRouting.models[0]!.available = false
    expect(() => authorizeSessionModel(d, "ses_worker", { providerID: "fixture", id: "cheap", variant: "max" })).toThrow(); d.db.close()
  })
  test("native client validates before switchAgent, switchModel and prompt; no fallback", async () => {
    const calls: string[] = []
    const ctx = { session: { get: async () => ({ id: "worker", model: { providerID: "fixture", id: "disabled", variant: "max" } }),
      switchAgent: async () => { calls.push("agent") }, switchModel: async () => { calls.push("model") }, prompt: async () => { calls.push("prompt") }, synthetic: async () => { calls.push("synthetic") }, compact: async () => { calls.push("compact") } } }
    const d = fixture(); const client = createV2Client(ctx as never, { authorizeModel: (sessionID, model) => authorizeSessionModel(d, sessionID, model) })
    for (const options of [{ model: { providerID: "fixture", modelID: "disabled" }, variant: "max", agent: "build" }, {}, { synthetic: true }]) {
      await expect(client.session.promptAsync({ sessionID: "worker", parts: [{ type: "text", text: "never sent" }], ...options })).rejects.toThrow()
    }
    await expect(client.continuity!.compact({ sessionID: "worker" })).rejects.toThrow("Model selection denied")
    expect(calls).toEqual([]); d.db.close()
  })
  test("configured empty file remains an explicit denied selection after load", () => {
    const root = mkdtempSync(join(tmpdir(), "ensemble-selection-test-")); mkdirSync(join(root, ".opencode"))
    writeFileSync(join(root, ".opencode/ensemble.json"), JSON.stringify({ modelRouting: { models: [] } }))
    try { const config = loadConfig(root); expect(config.modelRouting.selectionConfigured).toBe(true); expect(config.modelRouting.models).toEqual([]) }
    finally { rmSync(root, { recursive: true, force: true }) }
  })
})
