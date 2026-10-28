import { test, expect } from "bun:test";
import { Engine } from "../src/engine";
import { Store } from "../src/store";
import { FixturePublicationAdapter } from "../src/fixture-publication";
import type { Bridge, MissionConfig, Role } from "../src/domain";
test("grouping is a persistent cycle phase BEFORE evaluation and selection", async () => {
  const store = new Store(), publication = new FixturePublicationAdapter();
  const binary = { sha256: "a".repeat(64), version: "SYNTHETIC-order-v1" }, identity = { ...binary, ea: "0x1000" }, evidence = [{ id: "synthetic", source: "fixture.asm", sha256: "b".repeat(64), detail: "Synthetic phase-order evidence" }];
  const model = { providerID: "fixture", id: "model", variant: "high" }, roles: Role[] = ["explore", "evaluate", "A", "B", "R"];
  const config: MissionConfig = { schemaVersion: 1, missionId: "fixture-order", binary, fixture: true, evaluation: { method: "synthetic", version: "1", maxDifficulty: 5 }, subsetSize: 1, maxCycles: 2, stagnationLimit: 1, models: Object.fromEntries(roles.map(role => [role, model])) as Record<Role, typeof model>, knowledge: { version: "1", fingerprint: "synthetic", leadsFingerprint: "lead", files: [] }, commonInputs: [], accessibleRules: [], requiredTools: [], outputDirectory: "C:/fixture/outputs", fixtureSeeds: { approved: true, candidates: [{ identity, manifestVersion: "1", evidence, inputs: [], dependencies: [] }], assessments: [{ identity, method: "synthetic", version: "1", difficulty: 1, reasons: ["synthetic"], evidence }] } };
  const bridge: Bridge = { async ensureTeam() { throw new Error("no admission in grouping phase"); }, async submit() { throw new Error("no science in grouping"); }, async inspect() { throw new Error("no inspection in grouping"); }, async pauseAdmissions() {}, async stop() {} };
  const engine = new Engine({ store, bridge, publication, inputAccess: { read: async () => ({ status: "missing" }), list: async () => ({ status: "missing" }), tool: async () => false }, controllerId: "order-controller" });
  try { engine.create(config); const explored = await engine.tick(config.missionId); expect(explored.stage).toBe("group"); const grouped = await engine.tick(config.missionId); expect(grouped.stage).toBe("evaluate"); expect(grouped.cycles[0].groups).toHaveLength(1); expect(grouped.cycles[0].frozen).toBe(false); expect(grouped.intents).toHaveLength(0); } finally { store.close(); publication.close(); }
});
