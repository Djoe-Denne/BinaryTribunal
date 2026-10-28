import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { loadRuntime } from "../src/runtime";
import { Engine } from "../src/engine";
import { Store } from "../src/store";
import { FixturePublicationAdapter } from "../src/fixture-publication";
import { main } from "../src/cli";
import type { Role, Bridge } from "../src/domain";
function setup() {
  const base = join(process.env.LOCALAPPDATA ?? "C:/Users/djden/AppData/Local", "Temp", "opencode"); mkdirSync(base, { recursive: true }); const root = mkdtempSync(join(base, "ff8-runtime-test-"));
  const roles: Role[] = ["explore", "evaluate", "A", "B", "R"], models = Object.fromEntries(roles.map(role => [role, { providerID: "fixture", id: "model", variant: "high" }]));
  const runtime = { schemaVersion: 1, mission: { schemaVersion: 1, missionId: "fixture-cli", binary: { sha256: "a".repeat(64), version: "SYNTHETIC-v1" }, fixture: true, evaluation: { method: "synthetic", version: "1", maxDifficulty: 5 }, subsetSize: 1, maxCycles: 2, stagnationLimit: 1, models, knowledge: { version: "k1", fingerprint: "synthetic", leadsFingerprint: "lead", files: [] }, commonInputs: [], accessibleRules: [], requiredTools: [], outputDirectory: join(root, "outputs") }, bridge: { directory: root, principalId: "operator", controllerId: "controller", teamName: "external-fixture", tokenEnv: "DO_NOT_READ_FOR_OFFLINE_STATUS", leaseMs: 30000, maxRunning: 1 }, execution: { profiles: Object.fromEntries(roles.map(role => [role, "fixture-profile"])), approvedSources: [], projectionRoot: join(root, "inputs"), roleInstructions: Object.fromEntries(roles.map(role => [role, "Synthetic instructions"])), allowedTools: ["read", "edit"], admissionMode: "native-boundary-witness" }, publication: { kind: "fixture", database: join(root, "publication.db"), targets: [] } };
  const path = join(root, "runtime.json"), save = () => writeFileSync(path, JSON.stringify(runtime)); save();
  return { root, path, runtime, save, done: () => rmSync(root, { recursive: true, force: true }) };
}
test("runtime requires explicit native admission strategy, not a simulated evaluator", () => {
  const f = setup(); try { expect(loadRuntime(f.path).execution.admissionMode).toBe("native-boundary-witness"); f.runtime.execution.admissionMode = ""; f.save(); expect(() => loadRuntime(f.path)).toThrow(/explicit.*admission/); } finally { f.done(); }
});
test("historical run01 cannot be initialized by the new harness", () => {
  const f = setup(); try { f.runtime.mission.missionId = "ff8-decomp-semantics-20261011-r01"; f.save(); expect(() => loadRuntime(f.path)).toThrow(/run01.*stopped/); } finally { f.done(); }
});
test("credential values and forbidden scientific tools are refused in runtime config", () => {
  const f = setup(); try { const value = { ...f.runtime, bridge: { ...f.runtime.bridge, token: "secret" } }; writeFileSync(f.path, JSON.stringify(value)); expect(() => loadRuntime(f.path)).toThrow(/credentials/); f.runtime.execution.allowedTools.push("shell"); f.save(); expect(() => loadRuntime(f.path)).toThrow(/forbid/); } finally { f.done(); }
});
test("CLI status is fully offline and requires neither operator token nor live bridge", async () => {
  const f = setup(); const original = console.log; const lines: string[] = []; let store: Store | undefined;
  try { const config = loadRuntime(f.path), state = join(f.root, "state.db"); store = new Store(state); const offline: Bridge = { async ensureTeam() { throw new Error("must not connect"); }, async submit() { throw new Error("must not submit"); }, async inspect() { throw new Error("must not inspect"); }, async pauseAdmissions() {}, async stop() {} };
    const publication = new FixturePublicationAdapter(); const engine = new Engine({ store, bridge: offline, inputAccess: { read: async () => ({ status: "missing" }), list: async () => ({ status: "missing" }), tool: async () => false }, publication, controllerId: "controller" }); engine.create(config.mission); store.close(); store = undefined; publication.close();
    console.log = (line: string) => { lines.push(line); }; await main(["status", "--config", f.path, "--state", state]); expect(JSON.parse(lines[0]).missionId).toBe("fixture-cli"); expect(JSON.parse(lines[0]).revision).toBe(0);
  } finally { console.log = original; store?.close(); f.done(); }
});
