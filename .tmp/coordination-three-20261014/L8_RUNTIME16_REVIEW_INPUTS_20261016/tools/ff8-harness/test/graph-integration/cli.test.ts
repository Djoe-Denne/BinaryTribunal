import { describe, expect, spyOn, test } from "bun:test";
import { dirname, join } from "node:path";
import { existsSync, writeFileSync } from "node:fs";
import * as clientModule from "../../src/client";
import { graphOffline, main } from "../../src/cli";
import { fixturePath, graphHarness, initialSnapshot, missionFixture, preparation, preparationV2, preparedFixture } from "./fixture-driver";
import { prepareGraph } from "../../src/graph-pipeline";

describe("offline graph CLI is separate from native/legacy runtime setup", () => {
  test("prepare/group/plan/export/explain return real accepted-module exports without a connection", async () => {
    const dir = dirname(fixturePath()), input = join(dir, "preparation.json"), frozen = join(dir, "prepared.json");
    writeFileSync(input, JSON.stringify(preparation())); writeFileSync(frozen, JSON.stringify(preparedFixture()));
    const connection = spyOn(clientModule, "connectPublic").mockImplementation(async () => { throw new Error("forbidden connection"); });
    const output = spyOn(console, "log").mockImplementation(() => {});
    try {
      for (const command of ["prepare", "cluster", "groups", "plan"]) await main(["graph", command, "--input", input]);
      for (const command of ["export", "explain"]) await main(["graph", command, "--input", frozen]);
      expect(connection).toHaveBeenCalledTimes(0); expect(output).toHaveBeenCalledTimes(6);
    } finally { connection.mockRestore(); output.mockRestore(); }
  });
  test("real dispatch/shadow/adoption/historical simulation never fall through to legacy", async () => {
    const connection = spyOn(clientModule, "connectPublic").mockImplementation(async () => { throw new Error("forbidden connection"); });
    try {
      for (const command of ["dispatch", "shadow", "adopt", "simulate"]) await expect(main(["graph", command])).rejects.toThrow("unavailable");
      expect(connection).toHaveBeenCalledTimes(0);
      expect(() => graphOffline(["prepare", "--input", "missing", "--config", "legacy.json"])).toThrow("usage");
    } finally { connection.mockRestore(); }
  });
  test("v2 offline preparation requires actual context and explain exports complete accounting", () => {
    const dir = dirname(fixturePath()), input = join(dir, "request-v2.json"), context = join(dir, "actual-source.json"), frozen = join(dir, "frozen-v2.json"), request = preparationV2(), actual = initialSnapshot(missionFixture(request.snapshot));
    writeFileSync(input, JSON.stringify(request)); writeFileSync(context, JSON.stringify(actual)); writeFileSync(frozen, JSON.stringify(prepareGraph(request, actual)));
    expect(() => graphOffline(["prepare", "--input", input])).toThrow("independent actual");
    const prepared = graphOffline(["prepare", "--input", input, "--context", context]) as any, explanation = graphOffline(["explain", "--input", frozen]) as any;
    expect(prepared.version).toBe("l8-prepared-graph-v2"); expect(explanation.admissionAccounting).toEqual(prepared.planning.sidecar.admissionBudget); expect(explanation.admissionSource).toEqual(prepared.admissionSource); expect(explanation.nativeVerified).toBe(false);
    expect(() => graphOffline(["export", "--input", frozen, "--context", context])).toThrow("replacement current context");
  });
  test("inspect/replay validate durable journal without acquiring a lease or connecting", async () => {
    const h = graphHarness(), connection = spyOn(clientModule, "connectPublic").mockImplementation(async () => { throw new Error("forbidden connection"); });
    try {
      h.start(); await h.step(); const before = h.runtime.options.graph.events.cursor(h.missionId);
      const view = graphOffline(["inspect", "--state", h.path, "--mission", h.missionId]) as any, replay = graphOffline(["replay", "--state", h.path, "--mission", h.missionId]) as any;
      expect(view.intents).toHaveLength(2); expect(replay.view).toEqual(view); expect(replay.events.length).toBe(before.sequence); expect(h.runtime.options.graph.events.cursor(h.missionId)).toEqual(before); expect(connection).toHaveBeenCalledTimes(0);
      const missing = join(dirname(fixturePath()), "nonexistent.db"); expect(() => graphOffline(["inspect", "--state", missing, "--mission", h.missionId])).toThrow("will not create"); expect(existsSync(missing)).toBe(false);
    } finally { connection.mockRestore(); h.close(); }
  });
  test.each([null, false, { version: "future-v99" }])("marker presence (%j) blocks ALL legacy paths before bridge construction/control", async marker => {
    const h = graphHarness(preparationV2(), s => { (s.cycles[0] as any).graph = marker; }), dir = dirname(h.path), config = join(dir, "runtime-fixture.json"), snapshot = h.store.load(h.missionId);
    const roles = ["explore", "evaluate", "A", "B", "R"];
    writeFileSync(config, JSON.stringify({ schemaVersion: 1, mission: snapshot.config,
      bridge: { directory: dir, principalId: "fixture-principal", controllerId: "fixture-controller", tokenEnv: "OFFLINE_UNUSED_FIXTURE_ENV", teamName: "fixture-unused", leaseMs: 1000, maxRunning: 1 },
      execution: { approvedSources: [], allowedTools: [], projectionRoot: dir, admissionMode: "native-query", profiles: Object.fromEntries(roles.map(r => [r, "fixture-unused"])), roleInstructions: Object.fromEntries(roles.map(r => [r, "offline fixture, no native dispatch"])) },
      publication: { kind: "fixture", database: join(dir, "unused-publication.db"), targets: [] } }));
    const acquire = spyOn(h.store, "acquireLease"), connection = spyOn(clientModule, "connectPublic").mockImplementation(async () => { throw new Error("forbidden connection"); });
    try {
      expect(() => h.engine.attach(h.missionId)).toThrow("graph-owned"); expect(acquire).toHaveBeenCalledTimes(0);
      for (const command of ["init", "tick", "run", "pause", "stop", "resume", "recover", "diagnose"]) await expect(main([command, "--config", config, "--state", h.path])).rejects.toThrow("graph-owned");
      expect(connection).toHaveBeenCalledTimes(0); expect(existsSync(join(dir, "unused-publication.db"))).toBe(false);
    } finally { acquire.mockRestore(); connection.mockRestore(); h.close(); }
  });
});
