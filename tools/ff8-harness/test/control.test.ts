import { expect, spyOn, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createRmsControlV1 } from "../src/rms-control";
import type { ControlDependenciesV1, ControlExecutionSessionV1, ControlSessionV1 } from "../src/ports/control";
import type { MissionConfig, Role, Snapshot } from "../src/domain";
import { createControlExecutionSession, createControlSession, createPublisher, type RuntimeConfig } from "../src/runtime";
import * as clients from "../src/client";
import { Store } from "../src/store";
import { FixturePublicationAdapter } from "../src/fixture-publication";

function harness(status: Snapshot["status"] = "paused") {
  const calls: string[] = [];
  const roles: Role[] = ["explore", "evaluate", "A", "B", "R"];
  const models = Object.fromEntries(roles.map(role => [role, { providerID: "fixture", id: "model", variant: "high" }])) as MissionConfig["models"];
  const mission = { schemaVersion: 1, missionId: "fixture-control", binary: { sha256: "a".repeat(64), version: "SYNTHETIC-v1" }, fixture: true, evaluation: { method: "synthetic", version: "1", maxDifficulty: 5 }, subsetSize: 1, maxCycles: 2, stagnationLimit: 1, models, knowledge: { version: "k1", fingerprint: "synthetic", leadsFingerprint: "lead", files: [] }, commonInputs: [], accessibleRules: [], requiredTools: [], outputDirectory: "unused-fixture-output" } as MissionConfig;
  let snapshot: Snapshot = { schemaVersion: 1, missionId: mission.missionId, revision: 0, config: mission, status, cycle: 1, stage: "explore", candidates: [], cycles: [], intents: [], reconciliations: [], noProgressCycles: 0 };
  let exists = true, failure: Error | undefined;
  const execution: ControlExecutionSessionV1 = {
    async snapshot() { calls.push("native-snapshot"); return { admissions: { controllerId: "controller", leaseUntil: 0 } }; },
    async replay() { calls.push("replay"); return 7; },
    async ensure() { calls.push("ensure"); }, async recover() { calls.push("recover"); }, close() { calls.push("execution-close"); },
  };
  const session: ControlSessionV1 = {
    execution,
    engine: {
      create() { calls.push("create"); exists = true; snapshot.status = "running"; return snapshot; },
      attach() { calls.push("attach"); return snapshot; },
      async tick() { calls.push("tick"); if (failure) throw failure; return snapshot; },
      async resume(_id, _revision, knowledge) { calls.push("resume"); if (knowledge) snapshot.config.knowledge = knowledge; snapshot.status = "running"; return snapshot; },
      async pause() { calls.push("pause"); snapshot.status = "paused"; return snapshot; },
      async stop() { calls.push("stop"); snapshot.status = "stopped"; return snapshot; },
    }, close() { calls.push("session-close"); },
  };
  const deps: ControlDependenciesV1 = {
    mission, repository: { load() { calls.push("load"); if (!exists) throw new Error(`unknown mission: ${mission.missionId}`); return snapshot; } },
    assertLegacySnapshot() { calls.push("guard"); },
    async openExecution() { calls.push("open-execution"); return execution; },
    async openSession() { calls.push("open-session"); return session; },
    now: () => 10, async sleep(ms) { calls.push(`sleep:${ms}`); },
  };
  return { deps, calls, execution, session, snapshot, absent() { exists = false; }, fail(error: Error) { failure = error; }, control: createRmsControlV1(deps) };
}

test("control construction and invalid commands never open dependencies", async () => {
  const h = harness(); expect(h.calls).toEqual([]);
  await expect(h.control.execute({ command: "unknown" as never })).rejects.toThrow("unknown RMS control command");
  for (const [maxSteps, intervalMs] of [[0, 100], [1, 99], [NaN, 100], [1.5, 100]]) await expect(h.control.execute({ command: "run", maxSteps, intervalMs })).rejects.toThrow("explicit --max-steps");
  expect(h.calls).toEqual([]);
});
test("status is offline and init cannot reacquire an existing mission", async () => {
  const h = harness(); expect((await h.control.execute({ command: "status" })).snapshot).toBe(h.snapshot);
  expect(h.calls).toEqual(["load"]); h.calls.length = 0;
  await expect(h.control.execute({ command: "init" })).rejects.toThrow("mission already exists");
  expect(h.calls).toEqual(["load", "guard"]);
});
test("all effectful commands and diagnose refuse the legacy marker before factories or leases", async () => {
  for (const command of ["init", "tick", "run", "pause", "stop", "resume", "recover", "diagnose"] as const) {
    const h = harness(); h.deps.assertLegacySnapshot = () => { throw new Error("graph-owned"); };
    await expect(h.control.execute({ command, maxSteps: 1, intervalMs: 100 })).rejects.toThrow("graph-owned");
    expect(h.calls).toEqual(["load"]);
  }
});
test("init accepts only exact missing mission and never ticks or resumes", async () => {
  const h = harness(); h.absent(); await h.control.execute({ command: "init" });
  expect(h.calls).toEqual(["load", "open-session", "create", "load", "session-close"]);
  const bad = harness(); bad.deps.repository.load = () => { throw new Error("database unavailable"); };
  await expect(bad.control.execute({ command: "init" })).rejects.toThrow("database unavailable"); expect(bad.calls).toEqual([]);
});
test("stopped, completed and running missions cannot resume or recover as a side effect", async () => {
  for (const status of ["stopped", "complete", "running"] as const) {
    const h = harness(status); await expect(h.control.execute({ command: "resume" })).rejects.toThrow();
    expect(h.calls).toEqual(["load", "guard"]); expect(h.snapshot.status).toBe(status);
  }
});
test("diagnose opens only observation execution and disposes on success and error", async () => {
  const h = harness(); const result = await h.control.execute({ command: "diagnose" });
  expect(result.cursor).toBe(7); expect(h.calls).toEqual(["load", "guard", "open-execution", "load", "native-snapshot", "replay", "execution-close"]);
  const bad = harness(); bad.execution.replay = async () => { throw new Error("lost observation"); };
  await expect(bad.control.execute({ command: "diagnose" })).rejects.toThrow("lost observation"); expect(bad.calls.at(-1)).toBe("execution-close");
});
test("pause, stop and recover preserve explicit attach/control ordering", async () => {
  for (const command of ["pause", "stop", "recover"] as const) {
    const h = harness(); await h.control.execute({ command });
    expect(h.calls).toEqual(["load", "guard", "open-session", "attach", ...(command === "recover" ? ["recover"] : ["ensure", command]), "load", "session-close"]);
  }
});
test("explicit resume recovers only an expired admission lease and forwards knowledge", async () => {
  const h = harness(); const knowledge = { ...h.deps.mission.knowledge, version: "k2" };
  await h.control.execute({ command: "resume", knowledge });
  expect(h.calls).toEqual(["load", "guard", "open-session", "attach", "native-snapshot", "recover", "resume", "load", "session-close"]);
  expect(h.snapshot.config.knowledge).toEqual(knowledge); expect(h.snapshot.config.knowledge).not.toBe(knowledge);
  const current = harness(); current.execution.snapshot = async () => ({ admissions: { controllerId: "controller", leaseUntil: 100 } });
  await current.control.execute({ command: "resume" }); expect(current.calls).not.toContain("recover");
});
test("one bounded loop uses injected sleep and closes on tick failure", async () => {
  const h = harness("running"); await h.control.execute({ command: "run", maxSteps: 3, intervalMs: 100 });
  expect(h.calls.filter(c => c === "tick")).toHaveLength(3); expect(h.calls.filter(c => c === "sleep:100")).toHaveLength(2); expect(h.calls.at(-1)).toBe("session-close");
  const done = harness("paused"); await done.control.execute({ command: "run", maxSteps: 3, intervalMs: 100 }); expect(done.calls.filter(c => c === "tick")).toHaveLength(1); expect(done.calls).not.toContain("sleep:100");
  const tick = harness("running"); await tick.control.execute({ command: "tick" }); expect(tick.calls.filter(c => c === "tick")).toHaveLength(1); expect(tick.calls).not.toContain("sleep:100");
  const bad = harness("running"); bad.fail(new Error("tick failure")); await expect(bad.control.execute({ command: "tick" })).rejects.toThrow("tick failure"); expect(bad.calls.at(-1)).toBe("session-close");
});
test("validated bounds and resume knowledge are captured before asynchronous construction", async () => {
  const h = harness("running"), request = { command: "run" as const, maxSteps: 2, intervalMs: 100 };
  h.deps.openSession = async () => { request.maxSteps = 50; request.intervalMs = 0; return h.session; };
  await h.control.execute(request); expect(h.calls.filter(c => c === "tick")).toHaveLength(2); expect(h.calls).toContain("sleep:100"); expect(h.calls).not.toContain("sleep:0");
  const resume = harness(), knowledge = { ...resume.deps.mission.knowledge, version: "k2" };
  resume.deps.openSession = async () => { knowledge.version = "mutated"; return resume.session; };
  await resume.control.execute({ command: "resume", knowledge }); expect(resume.snapshot.config.knowledge.version).toBe("k2");
});

function ownedRuntime() {
  const base = join(process.env.LOCALAPPDATA ?? "C:/Users/djden/AppData/Local", "Temp", "opencode"); mkdirSync(base, { recursive: true });
  const root = mkdtempSync(join(base, "ff8-control-test-"));
  const mission = harness().deps.mission; mission.outputDirectory = join(root, "outputs");
  const roles: Role[] = ["explore", "evaluate", "A", "B", "R"];
  const config: RuntimeConfig = { schemaVersion: 1, mission, bridge: { directory: root, principalId: "fixture-operator", controllerId: "controller", teamName: "external-fixture", tokenEnv: "NO_CONTROL_TEST_TOKEN", leaseMs: 30000, maxRunning: 1 }, execution: { profiles: Object.fromEntries(roles.map(r => [r, "fixture-profile"])) as Record<Role, string>, roleInstructions: Object.fromEntries(roles.map(r => [r, "Synthetic instructions"])) as Record<Role, string>, approvedSources: [], allowedTools: ["read", "edit"], projectionRoot: join(root, "inputs"), admissionMode: "native-boundary-witness" }, publication: { kind: "fixture", database: join(root, "publication.db"), targets: [] } };
  return { root, config, state: join(root, "state.db"), done: () => rmSync(root, { recursive: true, force: true }) };
}
test("adapter sessions use one mocked connection and dispose idempotently without closing borrowed Store", async () => {
  const f = ownedRuntime(); const connection = spyOn(clients, "connectPublic").mockImplementation(async () => ({ async call() { throw new Error("no real RPC allowed"); } }));
  const closed = spyOn(clients.ExecutionClient.prototype, "close"), publicationClosed = spyOn(FixturePublicationAdapter.prototype, "close");
  const store = new Store(f.state);
  try {
    const observation = await createControlExecutionSession(f.config, f.state); expect(connection).toHaveBeenCalledTimes(1); expect(publicationClosed).toHaveBeenCalledTimes(0);
    observation.close(); observation.close(); expect(closed).toHaveBeenCalledTimes(1); expect(() => observation.snapshot("fixture")).toThrow("closed");
    const session = await createControlSession(f.config, join(f.root, "runtime.json"), store, f.state); expect(connection).toHaveBeenCalledTimes(2);
    session.close(); session.close(); expect(closed).toHaveBeenCalledTimes(2); expect(publicationClosed).toHaveBeenCalledTimes(1);
    expect(() => store.load("absent")).toThrow("unknown mission: absent");
  } finally { connection.mockRestore(); closed.mockRestore(); publicationClosed.mockRestore(); store.close(); f.done(); }
});
test("publisher seed and later construction failures dispose acquired owned resources", async () => {
  const f = ownedRuntime(); const connection = spyOn(clients, "connectPublic").mockImplementation(async () => ({ async call() { throw new Error("no real RPC allowed"); } }));
  const closed = spyOn(clients.ExecutionClient.prototype, "close"), publicationClosed = spyOn(FixturePublicationAdapter.prototype, "close");
  const seed = spyOn(FixturePublicationAdapter.prototype, "seedTarget").mockImplementation(() => { throw new Error("seed failure"); });
  const store = new Store(f.state);
  try {
    if (f.config.publication.kind !== "fixture") throw new Error("fixture required"); f.config.publication.targets = ["owned-seed"];
    await expect(createPublisher(f.config, join(f.root, "runtime.json"))).rejects.toThrow("seed failure"); expect(publicationClosed).toHaveBeenCalledTimes(1);
    await expect(createControlSession(f.config, join(f.root, "runtime.json"), store, f.state)).rejects.toThrow("seed failure"); expect(closed).toHaveBeenCalledTimes(1); expect(publicationClosed).toHaveBeenCalledTimes(2);
    seed.mockRestore(); f.config.publication.targets = []; f.config.bridge.controllerId = " ";
    await expect(createControlSession(f.config, join(f.root, "runtime.json"), store, f.state)).rejects.toThrow("explicit controller id"); expect(closed).toHaveBeenCalledTimes(2); expect(publicationClosed).toHaveBeenCalledTimes(3);
    f.config.bridge.controllerId = "controller"; f.config.execution.outputMode = "json-schema-strict";
    await expect(createControlSession(f.config, join(f.root, "runtime.json"), store, f.state)).rejects.toThrow("strict output"); expect(closed).toHaveBeenCalledTimes(3); expect(publicationClosed).toHaveBeenCalledTimes(3);
  } finally { connection.mockRestore(); closed.mockRestore(); publicationClosed.mockRestore(); seed.mockRestore(); store.close(); f.done(); }
});
