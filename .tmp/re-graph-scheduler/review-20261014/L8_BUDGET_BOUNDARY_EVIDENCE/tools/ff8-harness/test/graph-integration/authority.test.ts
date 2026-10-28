import { describe, expect, test } from "bun:test";
import { makeGraphIntent, makeGraphRun, parseGraphIntent, parseGraphRun } from "../../src/graph-adapter";
import { fingerprint } from "../../src/validation";
import { fixtureInputs, graphSpec, initialSnapshot, missionFixture, snapshotFixture } from "./fixture-driver";

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
