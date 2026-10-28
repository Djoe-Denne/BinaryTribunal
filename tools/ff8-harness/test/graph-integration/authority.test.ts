import { describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { makeGraphIntent, makeGraphRun, parseGraphIntent, parseGraphRun } from "../../src/graph-adapter";
import { fingerprint, hash } from "../../src/validation";
import { fixtureInputs, fixturePath, graphHarness, graphSpec, initialSnapshot, missionFixture, preparationV2, snapshotFixture } from "./fixture-driver";
import { graphEvents, preparedGraphRun } from "../../src/graph-engine";
import { prepareGraph } from "../../src/graph-pipeline";

describe("functional graph attribution is not scientific authority", () => {
  function setup() {
    const source = snapshotFixture(), snapshot = initialSnapshot(missionFixture(source)), run = makeGraphRun(snapshot, graphSpec(source)); snapshot.revision = run.missionRevision;
    const unit = run.prepared.planning.units[0]!, sub = unit.subIntents.find(s => s.role === "A")!, worker = run.workers[0]!;
    const lease = { missionId: run.missionId, unitId: unit.unitId, owner: "fixture-controller", token: 1, expiresAtEvent: 10000, state: "active" as const, resourceKeys: [] };
    return { snapshot, run, unit, sub, worker, lease };
  }
  test("one function per intent with complete stable input/run/family binding", () => {
    const { snapshot, run, unit, sub, worker, lease } = setup();
    const record = makeGraphIntent(run, snapshot, unit, sub, lease, fixtureInputs(snapshot, sub), worker);
    expect(record.intent.identity).toEqual(sub.harnessIdentity); expect(record.intent.identity?.ea).not.toBe(unit.unitId);
    expect(record.admission.executionId).toBe(record.intent.executionId); expect(record.admission.idempotencyKey).toBe(record.intent.executionId);
    expect(parseGraphIntent(record, run, snapshot)).toEqual(record);
    const otherFence = makeGraphIntent(run, snapshot, unit, sub, { ...lease, token: 2 }, fixtureInputs(snapshot, sub), worker);
    expect(otherFence.intent.executionId).not.toBe(record.intent.executionId);
  });
  test("unknown own namespace/version/revision and self-rehashed changed attribution fail", () => {
    const { snapshot, run, unit, sub, worker, lease } = setup();
    const record = makeGraphIntent(run, snapshot, unit, sub, lease, fixtureInputs(snapshot, sub), worker);
    expect(() => parseGraphIntent({ ...record, type: "authority" }, run, snapshot)).toThrow();
    expect(() => parseGraphIntent({ ...record, version: "future-v2" }, run, snapshot)).toThrow();
    expect(() => parseGraphIntent({ ...record, unitId: "unowned" }, run, snapshot)).toThrow();
    expect(() => parseGraphIntent(record, run, { ...snapshot, revision: snapshot.revision + 1 })).toThrow();
    const { fingerprint: _old, ...body } = { ...run, version: "l8-graph-run-v99" };
    expect(() => parseGraphRun({ ...body, fingerprint: fingerprint(body) })).toThrow();
  });
  test("requested provider/model/profile is explicit, never an observed-session substitute", () => {
    const { snapshot, run, unit, sub, worker, lease } = setup();
    expect(() => makeGraphIntent(run, snapshot, unit, sub, lease, fixtureInputs(snapshot, sub), { ...worker, model: "other/provider#default" })).toThrow();
    expect(() => makeGraphIntent(run, snapshot, unit, sub, lease, fixtureInputs(snapshot, sub), { ...worker, profile: "other" })).toThrow();
    const contaminated = fixtureInputs(snapshot, sub); contaminated.files.push({ path: "foreign-proposal", sha256: "a".repeat(64), version: "v1", provenance: "not approved blind", kind: "proposal" });
    expect(() => makeGraphIntent(run, snapshot, unit, sub, lease, contaminated, worker)).toThrow();
  });
});
describe("v2 prevalidation never invents external/scientific authority", () => {
  test("level2/fixture-only receipt is diagnosed before any readiness/satisfaction", () => {
    const request = preparationV2(snapshotFixture(2, [[0, 1]])), current = initialSnapshot(missionFixture(request.snapshot));
    request.policy.externalReceiptsByEdge = { [request.snapshot.edges[0]!.id]: { ...request.policy.requirementsByFunction[request.snapshot.nodes[1]!.id]!, knowledgeRevision: 2, publicationLevel: 2, validation: "fixture-only", producerUnitId: null,
      commitId: "unproven-external", readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" } as any };
    delete (request.policy.externalReceiptsByEdge[request.snapshot.edges[0]!.id] as any).minimumRevision; delete (request.policy.externalReceiptsByEdge[request.snapshot.edges[0]!.id] as any).maximumRevision;
    expect(() => prepareGraph(request, current)).toThrow("level2/fixture-only");
    const h = graphHarness(request); try { expect(() => h.start()).toThrow("external receipt authority import unsupported"); expect(h.host.submissions).toHaveLength(0); expect(h.store.load(h.missionId).cycles[0]?.frozen).toBe(false); } finally { h.close(); }
  });
  test("public self-hashed receipt event is not an artifact/commit/readback proof", () => {
    const h = graphHarness();
    try {
      h.start(); const graph = h.runtime.options.graph, run = preparedGraphRun(graph, h.missionId)!, unit = run.prepared.planning.units[0]!, required = run.prepared.planning.sidecar.policy.requirementsByFunction[unit.ownedFunctionIds[0]!]!;
      const receipt = { artifactId: required.artifactId, artifactSha256: required.artifactSha256, functionId: required.functionId, moduleSha256: required.moduleSha256, artifactKind: required.artifactKind,
        knowledgeRevision: 2, publicationLevel: 1, validation: "fixture-only", producerUnitId: unit.unitId, commitId: "invented-commit", readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
      graph.events.append(h.missionId, "fixture:invalid-receipt", "artifact_receipt", 100, receipt, unit.unitId);
      expect(() => h.runtime.view()).toThrow(); expect(h.host.submissions).toHaveLength(0); expect(graph.satisfies(h.missionId, unit.unitId, 1)).toBe(false);
    } finally { h.close(); }
  });
  test("missing parent/provider or invalid review cannot publish even with all three artifacts", async () => {
    for (const missing of [true, false]) {
      const h = graphHarness();
      try {
        if (missing) delete h.host.ports.parentAuthority; else h.host.invalidReview = true;
        h.start(); await h.step(); await h.step(); await expect(h.step()).rejects.toThrow(); expect(h.host.publications).toHaveLength(0); expect(h.runtime.view().status).not.toBe("complete");
      } finally { h.close(); }
    }
  });
  test("real per-role models/profiles and actual revision/cycle/epoch/input source, no fixture constants", async () => {
    const request = preparationV2(snapshotFixture(1), 3); request.budgetEpoch = 7;
    const models = { A: { providerID: "fixture-a", id: "model-a", variant: "high" }, B: { providerID: "fixture-b", id: "model-b", variant: "max" }, R: { providerID: "fixture-r", id: "model-r", variant: "max" } };
    request.executionTemplate.settings.profiles = { A: "role-a", B: "role-b", R: "role-r" };
    request.executionTemplate.workers = (["A", "B", "R"] as const).map(role => ({ ...request.executionTemplate.workers[0]!, workerId: `worker-${role}`, profile: request.executionTemplate.settings.profiles[role], model: `${models[role].providerID}/${models[role].id}#${models[role].variant}` }));
    const resources = request.policy.resourcesByFunction[request.snapshot.nodes[0]!.id]!; resources.profiles = ["role-a", "role-b", "role-r"]; resources.models = request.executionTemplate.workers.map(w => w.model);
    const input = { path: join(dirname(fixturePath()), "synthetic-é-日本-🙂.asm"), sha256: hash("synthetic sourceé quote\" newline\n"), version: "fixture-input-9", kind: "native" as const, provenance: "offline synthetic source, no native observation" }; request.inputsByFunction[request.snapshot.nodes[0]!.id] = [input];
    const h = graphHarness(request, s => { s.cycle = 2; s.cycles.push({ ...structuredClone(s.cycles[0]!), number: 2 }); Object.assign(s.config.models, models); });
    try {
      h.host.files.set(input.path, "synthetic sourceé quote\" newline\n");
      const lease = h.store.acquireLease(h.missionId, "offline-fixture-controller", 100, 1000000); for (let n = 0; n < 3; n++) { const s = h.store.load(h.missionId); h.store.commit(s, s.revision, lease, 100); }
      h.start(); const run = preparedGraphRun(h.runtime.options.graph, h.missionId)!; expect(run.missionRevision).toBe(4); expect(run.cycle).toBe(2);
      if (run.version !== "l8-graph-run-v2") throw new Error("not v2"); expect(run.prepared.admissionSource.context.budgetEpoch).toBe(7);
      const done = await h.complete(); expect(done.status).toBe("complete");
      for (const record of done.intents) { const role = record.intent.role as "A" | "B" | "R"; expect(record.intent.requestedModel).toEqual(models[role]); expect(record.admission.command.model).toEqual(models[role]); expect((record.admission.command.dossier as any).effectiveModel).toEqual(models[role]); expect(record.intent.inputs.files.some(f => f.path === input.path)).toBe(true); }
      expect(h.store.load(h.missionId).cycles).toHaveLength(2); expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "l8.graph2.execution-claimed")).toHaveLength(3);
    } finally { h.close(); }
  });
  test("level2 uses executed fixture proof tuples; revocation immediately removes satisfaction", async () => {
    const request = preparationV2(snapshotFixture(1)); request.policy.publicationLevel = 2; for (const r of Object.values(request.policy.requirementsByFunction)) { r.publicationLevel = 2; r.validation = "parent-validated"; }
    const h = graphHarness(request);
    try {
      h.start(); expect((await h.complete()).status).toBe("complete"); const graph = h.runtime.options.graph, unit = h.runtime.view().units[0]!, event = graphEvents(graph, h.missionId).find(e => e.kind === "parent_attested")!;
      graph.revokeParentAttestation(h.runtime.options.authority(), (event.payload as any).attestationId, "explicit fixture revocation, no native scientific finding");
      expect(graph.satisfies(h.missionId, unit.unitId, 2)).toBe(false); expect(() => h.runtime.view()).toThrow(); expect(h.host.targets.size).toBe(1);
    } finally { h.close(); }
  });
});
