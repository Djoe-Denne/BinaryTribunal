import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildGraphSnapshot } from "../../src/graph-normalize";
import { validateGraphSnapshot, type GraphSnapshotV1 } from "../../src/graph";
import { planMission, type ArtifactRequirement, type PlannerPolicy } from "../../src/planner";
import { canonical, hash } from "../../src/validation";
import { SimEngine, runScenario, simPlanFromExport, validateSimPlan,
  type SimIncident, type SimObservation, type SimScenario, type SimUnitFinalState } from "../../src/simulator";
import { scenario } from "./scenarios";

const marker = (unitId: string, atTick: number): SimIncident => ({ kind: "bulletin", unitId, atTick, authorRole: "unauthorized", canonical: false });
const state = (o: { units: readonly SimUnitFinalState[] }, id: string) => o.units.find(u => u.unitId === id)!;
const terminal = (kind: "cancel" | "invalidate_knowledge", id: string, atTick: number): SimIncident =>
  kind === "cancel" ? { kind, unitId: id, atTick } : { kind, unitIds: [id], atTick };
function fixture(ids: string[], calls: Array<[string, string]> = [], workers = 2): SimScenario {
  const s = scenario(ids, calls, workers);
  s.durations = { A: 1, B: 1, R: 1 };
  s.config.heartbeatEvery = 0; s.config.leaseTicks = 100; s.config.maxTicks = 1000;
  return s;
}
function observe(s: SimScenario, id: string, atTick: number): { engine: SimEngine; view: SimObservation } {
  s.incidents = [...s.incidents ?? [], marker(id, atTick)];
  const engine = new SimEngine(s); engine.runUntil(atTick);
  const view = engine.observe();
  expect(engine.observe()).toEqual(view);
  expect(view.metrics.observationEndTick).toBe(atTick);
  expect("store" in view).toBe(false);
  expect(Object.isFrozen(view)).toBe(true);
  return { engine, view };
}

/** A fresh, schema-validated normalizer -> accepted L5 export, not a handwritten L5 graph. */
function localExport() {
  const raw: GraphSnapshotV1 = JSON.parse(readFileSync(join(import.meta.dir, "../fixtures/graph/communities-obvious/content.json"), "utf8"));
  const edge = raw.edges.find(e => e.kind === "direct_call" && e.sourceId !== e.destinationId)!;
  const ids = new Set([edge.sourceId, edge.destinationId]);
  const { snapshot: graph } = buildGraphSnapshot({ missionId: raw.missionId, snapshotId: "snapshot:l7-final-local-v1",
    artifacts: raw.binaryArtifacts, nodes: raw.nodes.filter(n => ids.has(n.id)), edges: [edge], objects: [], unresolved: [], capabilities: [],
    knowledgeRevision: raw.knowledgeRevision, scopeDescription: "two functions, one local original obligation",
    coverage: raw.coverage, toolVersions: raw.toolVersions, configFingerprint: raw.configFingerprint });
  expect(validateGraphSnapshot(graph)).toEqual([]);
  const policy: PlannerPolicy = { version: "l7-final-local-v1", estimationVersion: "l7-final-durations-v1", partitionId: "partition:l7-final-local",
    investigationKind: "decompilation", artifactKind: "reconciled_c", publicationLevel: 1,
    contextEnvelopeMaxUtf8Bytes: 100_000_000, totalContextBudgetUtf8Bytes: 1_000_000_000, maxSelectedUnits: 10,
    sccMaxFunctions: 10, sccMaxIterations: 2, sccCostBudget: 100_000,
    requirementsByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { artifactId: `artifact:final:${n.id}`, artifactSha256: hash(`final:${n.id}`),
      functionId: n.id, moduleSha256: n.moduleSha256, artifactKind: "reconciled_c", minimumRevision: graph.knowledgeRevision + 1,
      maximumRevision: graph.knowledgeRevision + 10, publicationLevel: 1, validation: "fixture-only" }])),
    estimatesByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { version: "l7-final-durations-v1", A: 1, B: 1, R: 1, validation: 1 }])),
    resourcesByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { profiles: ["build"], models: ["offline"], accounts: ["shared"], tools: ["cpu"], slots: 1, cpu: 1, gpu: 0, budget: 1 }])) };
  const exported = planMission(graph, graph.nodes.map((n, i) => ({ groupId: `group:final:${i}`, partitionId: policy.partitionId,
    ownedFunctionIds: [n.id], contextFunctionIds: [] })), policy);
  const base = simPlanFromExport(exported), consumer = base.units.find(u => u.prerequisites.some(p => p.kind === "obligatory"))!;
  const prerequisite = consumer.prerequisites[0]!, producer = prerequisite.producerUnitId!;
  expect(Object.hasOwn(base.source!.prerequisiteEvidence!.requirementById, prerequisite.id!)).toBe(true);
  const s = fixture([]); s.plan = structuredClone(base);
  return { s, base, exported, graph, policy, consumer: consumer.unitId, producer,
    need: s.plan.units.find(u => u.unitId === consumer.unitId)!.prerequisites[0]! };
}

describe("original local requirements remain obligations", () => {
  test("removing only the known need blocks its consumer, not its independent producer", () => {
    const x = localExport(), before = canonical({ base: x.base, exported: x.exported, graph: x.graph, policy: x.policy });
    delete x.need.requirement;
    expect(validateSimPlan(x.s.plan)).toEqual([]);
    const r = runScenario(x.s);
    expect(state(r, x.producer).state).toBe("COMMITTED");
    expect(state(r, x.consumer).state).toBe("BLOCKED");
    expect(r.trace.filter(e => e.ev === "committed").map(e => [e.unitId, e.t])).toEqual([[x.producer, 3]]);
    expect(x.need.requirement).toBeUndefined();
    expect(canonical({ base: x.base, exported: x.exported, graph: x.graph, policy: x.policy })).toBe(before);
  });

  test("a changed hash and other changed original fields cannot weaken or replace the need", () => {
    const edits: Array<(q: ArtifactRequirement) => void> = [
      q => { q.artifactSha256 = hash("wrong-hash"); }, q => { q.artifactId += ":other"; },
      q => { q.functionId += "0"; }, q => { q.moduleSha256 = hash("other-module"); },
      q => { q.artifactKind = "semantic_description"; }, q => { q.minimumRevision = 0; },
      q => { q.maximumRevision += 10; }, q => { q.publicationLevel = 2; }, q => { q.validation = "parent-validated"; },
    ];
    for (const edit of edits) {
      const x = localExport(), original = canonical(x.s.plan.source);
      edit(x.need.requirement!);
      expect(validateSimPlan(x.s.plan)).toEqual([]);
      const r = runScenario(x.s);
      expect(state(r, x.producer).state).toBe("COMMITTED");
      expect(state(r, x.consumer).state).toBe("BLOCKED");
      expect(r.decisions.some(d => d.unitId === x.consumer)).toBe(false);
      expect(canonical(x.s.plan.source)).toBe(original);
    }
  });

  test("intact exports and manual scenarios with no original need retain their legal paths", () => {
    const x = localExport(), r = runScenario(x.s);
    expect(r.trace.filter(e => e.ev === "committed").map(e => [e.unitId, e.t])).toEqual([[x.producer, 3], [x.consumer, 6]]);
    const manual = fixture(["P", "C"], [["C", "P"]]);
    expect(manual.plan.source).toBeUndefined();
    expect(runScenario(manual).units.every(u => u.state === "COMMITTED")).toBe(true);
    const declared = fixture(["P", "C"], [["C", "P"]]);
    declared.plan.units.find(u => u.unitId === "C")!.prerequisites[0]!.requirement = structuredClone(x.need.requirement!);
    const blocked = runScenario(declared);
    expect(state(blocked, "P").state).toBe("COMMITTED");
    expect(state(blocked, "C").state).toBe("BLOCKED");
  });
});

describe("pause measures admission waiting, not suspended work", () => {
  test("RUNNING jobs alone: one-tick pause contributes zero paused ticks and twelve occupied ticks at six", () => {
    const s = fixture(["U"]); s.durations = { A: 10, B: 10, R: 1 };
    s.incidents = [{ kind: "pause", fromTick: 2, toTick: 3 }];
    const { engine, view } = observe(s, "U", 6);
    expect(state(view, "U").state).toBe("RUNNING");
    expect(state(view, "U").waitReason).toBeNull();
    expect(state(view, "U").waitTicks).toBe(0);
    expect(view.metrics.waits.paused).toBe(0);
    expect(view.metrics.occupiedWorkerTicks).toBe(12);
    const before = canonical(view), r = engine.run();
    expect(r.metrics.makespan).toBe(12); expect(r.metrics.waits.paused).toBe(0);
    expect(canonical(view)).toBe(before);
  });

  test("VALIDATING continues through pause: four validation ticks at six, ten at publication", () => {
    const s = fixture(["U"]); s.config.validationTicks = 10;
    s.incidents = [{ kind: "pause", fromTick: 3, toTick: 4 }];
    const { engine, view } = observe(s, "U", 6);
    expect(state(view, "U").state).toBe("VALIDATING");
    expect(state(view, "U").waitReason).toBe("validation");
    expect(view.metrics.waits.validation).toBe(4); expect(view.metrics.waits.paused).toBe(0);
    expect(view.metrics.occupiedWorkerTicks).toBe(3);
    const r = engine.run(); expect(r.metrics.makespan).toBe(12);
    expect(r.metrics.waits.validation).toBe(10); expect(r.metrics.waits.paused).toBe(0);
  });

  test("pending admissions count pause, but a serial role waiting for its running predecessor does not", () => {
    for (const parallel of [true, false]) {
      const s = fixture(["U"], [], 1); s.durations = { A: 10, B: 10, R: 1 }; s.config.rolesParallel = parallel;
      s.incidents = [{ kind: "pause", fromTick: 2, toTick: 3 }];
      const { view } = observe(s, "U", 6);
      expect(view.metrics.waits.paused).toBe(parallel ? 1 : 0);
      expect(view.metrics.waits.resource).toBe(parallel ? 5 : 0);
      expect(state(view, "U").waitReason).toBe(parallel ? "resource" : null);
      expect(view.metrics.occupiedWorkerTicks).toBe(6);
    }
  });

  test("a lost response with no pending admission does not become paused waiting", () => {
    const s = fixture(["U"]);
    s.incidents = [{ kind: "response_lost", unitId: "U", reconcileAfter: 6 }, { kind: "pause", fromTick: 3, toTick: 4 }];
    const { engine, view } = observe(s, "U", 6);
    expect(state(view, "U").state).toBe("RUNNING"); expect(state(view, "U").waitReason).toBeNull();
    expect(view.metrics.waits.paused).toBe(0); expect(view.metrics.occupiedWorkerTicks).toBe(3);
    const r = engine.run(); expect(r.metrics.makespan).toBe(9);
    expect(r.metrics.waits.paused).toBe(0); expect(r.metrics.waits.validation).toBe(1);
  });

  test("READY resource/quota/conflict/barrier causes are masked only for the actual one-tick pause", () => {
    for (const cause of ["resource", "quota", "conflict", "barrier"] as const) {
      const s = fixture(cause === "barrier" ? ["A", "B"] : ["U"], [], cause === "resource" ? 0 : 4), target = cause === "barrier" ? "B" : "U";
      s.durations = { A: 10, B: 10, R: 1 };
      if (cause === "quota") s.config.accountQuotas = { shared: 0 };
      if (cause === "conflict") { s.plan.units[0]!.conflicts.push({ resourceKey: "K" }); s.config.externalClaims = [{ familyId: "old", resourceKeys: ["K"] }]; }
      if (cause === "barrier") { s.config.policy = "fixed_groups"; s.config.groupSize = 1; }
      s.incidents = [{ kind: "pause", fromTick: 2, toTick: 3 }];
      const { view } = observe(s, target, 6);
      expect(state(view, target).state).toBe("READY"); expect(state(view, target).waitReason).toBe(cause);
      expect(state(view, target).waitTicks).toBe(6);
      expect(view.metrics.waits.paused).toBe(1); expect(view.metrics.waits[cause]).toBe(5);
    }
  });

  test("dependency waiting is never paused, even when the producer is resource-blocked", () => {
    const s = fixture(["P", "C"], [["C", "P"]], 0);
    s.incidents = [{ kind: "pause", fromTick: 2, toTick: 3 }];
    const { view } = observe(s, "C", 6);
    expect(state(view, "C").waitReason).toBe("dependency"); expect(state(view, "C").waitTicks).toBe(6);
    expect(view.metrics.waits.dependency).toBe(6); expect(view.metrics.waits.paused).toBe(1);
    expect(view.metrics.waits.resource).toBe(5);
  });

  test("overlapping and contiguous pauses form one union with no same-tick micro-admission", () => {
    for (const reverse of [false, true]) {
      const s = fixture(["A", "B"], [], 4);
      s.incidents = [{ kind: "pause", fromTick: 0, toTick: 3 }, { kind: "pause", fromTick: 2, toTick: 5 },
        { kind: "pause", fromTick: 5, toTick: 7 }, { kind: "pause", fromTick: 4, toTick: 4 }, ...[0, 2, 3, 4, 5, 6, 7].map(t => marker("A", t))];
      if (reverse) s.incidents.reverse();
      const e = new SimEngine(s);
      for (let t = 0; t < 7; t++) { e.runUntil(t); const v = e.observe(); expect(e.observe()).toEqual(v); expect(v.decisions).toEqual([]); }
      e.runUntil(7); const v = e.observe();
      expect(v.decisions.map(d => d.t)).toEqual([7, 7]); expect(v.metrics.waits.paused).toBe(14);
      expect(v.units.every(u => u.waitTicks === 7 && u.waitReason === null)).toBe(true);
      expect(e.run().metrics.makespan).toBe(10);
    }
  });

  test("a released conflict key during pause wakes the parked READY unit at resume", () => {
    const s = fixture(["U"]); s.plan.units[0]!.conflicts.push({ resourceKey: "K" });
    s.config.externalClaims = [{ familyId: "old", resourceKeys: ["K"], stoppedAtTick: 3 }];
    s.incidents = [{ kind: "pause", fromTick: 1, toTick: 5 }];
    const { engine, view } = observe(s, "U", 4);
    expect(view.decisions).toEqual([]); expect(state(view, "U").waitReason).toBe("paused");
    engine.runUntil(5); const resumed = engine.observe();
    expect(state(resumed, "U").dispatchTick).toBe(5);
    expect(resumed.metrics.waits.conflict).toBe(1); expect(resumed.metrics.waits.paused).toBe(4);
  });

  test("resume reparks K1 to K2 without losing K1's independent waiter or its ticket", () => {
    for (const reverseKeys of [false, true]) {
      const s = fixture(["U", "V"], [], 4); s.config.validationTicks = 0;
      s.plan.units[0]!.conflicts = (reverseKeys ? ["K2", "K1"] : ["K1", "K2"]).map(resourceKey => ({ resourceKey }));
      s.plan.units[1]!.conflicts = [{ resourceKey: "K1" }];
      s.config.externalClaims = [{ familyId: "old1", resourceKeys: ["K1"], stoppedAtTick: 3 }, { familyId: "old2", resourceKeys: ["K2"], stoppedAtTick: 7 }];
      s.incidents = [{ kind: "pause", fromTick: 1, toTick: 5 }];
      const r = runScenario(s);
      expect(state(r, "V").dispatchTick).toBe(5); expect(state(r, "U").dispatchTick).toBe(7);
      expect(state(r, "V").waitTicks).toBe(5); expect(state(r, "U").waitTicks).toBe(7);
      expect(r.metrics.waits.paused).toBe(8); expect(r.metrics.waits.conflict).toBe(4);
      expect(r.units.every(u => u.state === "COMMITTED")).toBe(true);
    }
  });

  test("capacity released by running jobs during pause admits waiting work only at resume", () => {
    const s = fixture(["A", "B"]); s.durations = new Map([["A", { A: 2, B: 2, R: 1 }], ["B", { A: 1, B: 1, R: 1 }]]);
    s.incidents = [{ kind: "pause", fromTick: 1, toTick: 5 }];
    const { engine, view } = observe(s, "B", 4);
    expect(state(view, "B").dispatchTick).toBeNull(); expect(state(view, "B").waitReason).toBe("paused");
    engine.runUntil(5); const resumed = engine.observe();
    expect(state(resumed, "B").dispatchTick).toBe(5);
    expect(resumed.metrics.waits.paused).toBe(7); // B [1,5), A's new R [2,5).
    expect(resumed.trace.filter(e => e.ev === "job_start" && e.t > 0 && e.t < 5)).toEqual([]);
  });

  test("a barrier released by validation during pause reaches the existing queue at resume", () => {
    const s = fixture(["A", "B"], [], 4); s.config.policy = "fixed_groups"; s.config.groupSize = 1; s.config.validationTicks = 2;
    s.incidents = [{ kind: "pause", fromTick: 3, toTick: 6 }];
    const { engine, view } = observe(s, "B", 5);
    expect(state(view, "A").state).toBe("COMMITTED"); expect(state(view, "B").dispatchTick).toBeNull();
    engine.runUntil(6); const resumed = engine.observe();
    expect(state(resumed, "B").dispatchTick).toBe(6); expect(resumed.metrics.waits.barrier).toBe(3);
    expect(resumed.metrics.waits.paused).toBe(3); expect(resumed.metrics.waits.validation).toBe(2);
  });

  test("a consumer becoming READY during pause counts dependency then pause, without changing its need", () => {
    const x = localExport(), before = canonical(x.s.plan);
    x.s.incidents = [{ kind: "pause", fromTick: 2, toTick: 5 }];
    const { engine, view } = observe(x.s, x.consumer, 4);
    expect(state(view, x.producer).state).toBe("COMMITTED"); expect(state(view, x.consumer).waitReason).toBe("paused");
    engine.runUntil(5); const resumed = engine.observe();
    expect(state(resumed, x.consumer).dispatchTick).toBe(5); expect(resumed.metrics.waits.dependency).toBe(3);
    expect(resumed.metrics.waits.paused).toBe(2); expect(canonical(x.s.plan)).toBe(before);
  });

  test("pause classification is independent of automatic dispatch and survives unavailable resources at resume", () => {
    for (const manual of [false, true]) {
      const s = fixture(["U"], [], manual ? 2 : 0); s.config.autoDispatch = !manual;
      s.incidents = [{ kind: "pause", fromTick: 1, toTick: 3 }];
      const { view } = observe(s, "U", 6);
      expect(view.decisions).toEqual([]); expect(state(view, "U").waitReason).toBe("resource");
      expect(view.metrics.waits.paused).toBe(2); expect(view.metrics.waits.resource).toBe(4);
    }
  });
});

describe("terminal states close wait intervals without proving worker quiescence", () => {
  for (const kind of ["cancel", "invalidate_knowledge"] as const) {
    test(`${kind} before start never opens dependency or paused waiting`, () => {
      for (const reverse of [false, true]) {
        const s = fixture(["P", "C"], [["C", "P"]]); s.durations = { A: 10, B: 10, R: 1 };
        s.incidents = [terminal(kind, "C", 0), { kind: "pause", fromTick: 0, toTick: 1 }, ...[0, 1, 5].map(t => marker("P", t))];
        if (reverse) s.incidents.reverse();
        const e = new SimEngine(s); e.runUntil(5); const v = e.observe();
        expect(state(v, "C").state).toBe(kind === "cancel" ? "CANCELLED" : "STALE");
        expect(state(v, "C").waitReason).toBeNull(); expect(state(v, "C").waitTicks).toBe(0);
        expect(v.metrics.waits.dependency).toBe(0);
        const before = canonical(v); const r = e.run();
        expect(state(r, "C").waitReason).toBeNull(); expect(state(r, "C").waitTicks).toBe(0);
        expect(canonical(v)).toBe(before);
      }
    });

    test(`${kind} at one preserves the elapsed dependency tick`, () => {
      const s = fixture(["P", "C"], [["C", "P"]]); s.durations = { A: 10, B: 10, R: 1 };
      s.incidents = [terminal(kind, "C", 1), { kind: "pause", fromTick: 2, toTick: 3 }];
      const { engine, view } = observe(s, "C", 5);
      expect(state(view, "C").waitReason).toBeNull(); expect(state(view, "C").waitTicks).toBe(1);
      expect(view.metrics.waits.dependency).toBe(1);
      const r = engine.run(); expect(state(r, "C").waitTicks).toBe(1); expect(state(r, "C").waitReason).toBeNull();
    });

    test(`${kind}: producer callbacks with intact, changed or absent original need cannot revive the consumer`, () => {
      for (const change of ["intact", "hash", "missing"] as const) for (const tick of [0, 1]) {
        const x = localExport();
        if (change === "hash") x.need.requirement!.artifactSha256 = hash("bad-local-need");
        if (change === "missing") delete x.need.requirement;
        x.s.incidents = [terminal(kind, x.consumer, tick)];
        const r = runScenario(x.s);
        expect(state(r, x.producer).state).toBe("COMMITTED");
        expect(state(r, x.consumer).state).toBe(kind === "cancel" ? "CANCELLED" : "STALE");
        expect(state(r, x.consumer).waitReason).toBeNull(); expect(state(r, x.consumer).waitTicks).toBe(tick);
        expect(r.decisions.some(d => d.unitId === x.consumer)).toBe(false);
      }
    });
  }

  test("fenced delayed work retains occupation and conflicts until real completion; observations do not change replay", () => {
    const s = fixture(["A", "B"]); for (const u of s.plan.units) u.conflicts.push({ resourceKey: "shared" });
    s.incidents = [{ kind: "late_result", unitId: "A", delayTicks: 5 }, terminal("cancel", "A", 3),
      { kind: "pause", fromTick: 4, toTick: 5 }, ...Array.from({ length: 11 }, (_, t) => marker("B", t))];
    const e = new SimEngine(s), snapshots: Array<[SimObservation, string]> = [];
    for (let tick = 0; tick <= 10; tick++) {
      e.runUntil(tick); const o = e.observe(); expect(e.observe()).toEqual(o); snapshots.push([o, canonical(o)]);
      if (tick === 6) {
        expect(state(o, "A").state).toBe("STOP_PENDING"); expect(state(o, "A").waitReason).toBeNull();
        expect(state(o, "B").dispatchTick).toBeNull(); expect(o.metrics.occupiedWorkerTicks).toBe(7);
        expect(o.trace.filter(t => t.ev === "execution_released" && t.unitId === "A").length).toBe(2);
      }
    }
    const r = e.run(), direct = runScenario(s);
    expect(state(r, "B").dispatchTick).toBe(7); expect(r.metrics.occupiedWorkerTicks).toBe(11);
    expect(r.trace).toEqual(direct.trace); expect(r.decisions).toEqual(direct.decisions); expect(r.metrics).toEqual(direct.metrics);
    for (const [o, before] of snapshots) expect(canonical(o)).toBe(before);
  });

  test("a fenced validation with no live job still holds its family until explicit stop", () => {
    const s = fixture(["A", "B"], [], 4); s.config.validationTicks = 10;
    for (const u of s.plan.units) u.conflicts.push({ resourceKey: "K" });
    s.incidents = [terminal("cancel", "A", 3), { kind: "pause", fromTick: 4, toTick: 6 }, { kind: "stop_confirmed", unitId: "A", atTick: 8 }];
    const { engine, view } = observe(s, "B", 7);
    expect(state(view, "A").state).toBe("QUARANTINED"); expect(state(view, "A").waitReason).toBeNull();
    expect(state(view, "B").dispatchTick).toBeNull(); expect(view.metrics.occupiedWorkerTicks).toBe(3);
    expect(view.metrics.waits.validation).toBe(1); expect(view.metrics.waits.paused).toBe(2);
    const r = engine.run(); expect(state(r, "B").dispatchTick).toBe(8);
    expect(state(r, "A").state).toBe("CANCELLED"); expect(state(r, "A").waitTicks).toBe(1);
    expect(r.metrics.waits.validation).toBe(11); expect(r.metrics.occupiedWorkerTicks).toBe(6);
  });
});
