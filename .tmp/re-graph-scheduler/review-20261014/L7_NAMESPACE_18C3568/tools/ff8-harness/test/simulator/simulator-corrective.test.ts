import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hash, canonical } from "../../src/validation";
import { buildGraphSnapshot } from "../../src/graph-normalize";
import { validateGraphSnapshot, type GraphSnapshotV1 } from "../../src/graph";
import { planMission, selectCompatible, type PlannerPolicy, type PlannerResult, type ResourceRequirement, type WorkerCapacity } from "../../src/planner";
import { SimEngine, runScenario, simPlanFromExport, validateSimPlan, planShape, comparePolicies, SIM_RESOURCE_MODEL,
  type SimScenario, type SimRunResult, type SimPolicyKind } from "../../src/simulator";
import { scenario } from "./scenarios";

const POLICIES: SimPolicyKind[] = ["sequential", "fixed_groups", "levels", "fifo", "event_driven", "critical_path", "heterogeneous"];
const resource = (): ResourceRequirement => ({ profiles: ["build"], models: ["offline"], accounts: ["shared"], tools: ["cpu"], slots: 1, cpu: 1, gpu: 0, budget: 1 });
function graph(name = "isolates", edit: (g: GraphSnapshotV1) => void = () => {}): GraphSnapshotV1 {
  const g: GraphSnapshotV1 = JSON.parse(readFileSync(join(import.meta.dir, "../fixtures/graph", name, "content.json"), "utf8")); edit(g);
  const { snapshot } = buildGraphSnapshot({ missionId: g.missionId, snapshotId: `snapshot:corrective:${name}`, artifacts: g.binaryArtifacts, nodes: g.nodes,
    edges: g.edges, objects: g.objects, unresolved: g.unresolved, capabilities: g.capabilities, knowledgeRevision: g.knowledgeRevision,
    scopeDescription: g.scope.description, coverage: g.coverage, toolVersions: g.toolVersions, configFingerprint: g.configFingerprint });
  expect(validateGraphSnapshot(snapshot)).toEqual([]); return snapshot;
}
function policy(g: GraphSnapshotV1): PlannerPolicy {
  return { version: "corrective-v2", estimationVersion: "corrective-estimates-v1", partitionId: "partition:corrective", investigationKind: "decompilation",
    artifactKind: "reconciled_c", publicationLevel: 1, contextEnvelopeMaxUtf8Bytes: 100_000_000, totalContextBudgetUtf8Bytes: 1_000_000_000,
    maxSelectedUnits: 100_000, sccMaxFunctions: 100_000, sccMaxIterations: 2, sccCostBudget: 100_000_000,
    resourcesByFunction: Object.fromEntries(g.nodes.map(n => [n.id, resource()])),
    estimatesByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { version: "corrective-estimates-v1", A: 2, B: 3, R: 1, validation: 1 }])),
    requirementsByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { functionId: n.id, moduleSha256: n.moduleSha256, artifactId: `artifact:${n.id}`,
      artifactSha256: hash(`C:${n.id}`), artifactKind: "reconciled_c", minimumRevision: g.knowledgeRevision + 1, maximumRevision: g.knowledgeRevision + 100,
      publicationLevel: 1, validation: "fixture-only" }])) };
}
function exported(g: GraphSnapshotV1, p = policy(g), groups?: string[][]): PlannerResult {
  return planMission(g, (groups ?? g.nodes.filter(n => n.status === "observed" && n.functionClass === "internal").map(n => [n.id]))
    .map((ids, i) => ({ groupId: `group:${i}`, partitionId: p.partitionId, ownedFunctionIds: ids, contextFunctionIds: [] })), p);
}
function simulation(r: PlannerResult, workers = 6): SimScenario { const s = scenario([], [], workers); s.plan = simPlanFromExport(r); return s; }
function linked(): GraphSnapshotV1 { return graph("cycles-recursion", g => { g.edges = g.edges.slice(0, 1); }); }
function sharedExport(): PlannerResult {
  const g = graph("communities-obvious", g => { g.edges = []; }), p = policy(g);
  p.extraConflictsByFunction = Object.fromEntries(g.nodes.map((n, i) => [n.id, [{ id: `claim:${i}`, kind: "exclusive_write", resourceKey: "shared:x", withUnitId: null }]]));
  return exported(g, p);
}
function ordered(r: PlannerResult): string[] { return r.units.map(u => u.unitId).sort(); }
function assertDecisions(r: SimRunResult): void {
  for (const d of r.decisions) {
    const starts = r.trace.filter(e => e.ev === "job_start" && e.unitId === d.unitId && e.attempt === d.attempt && e.token === d.token);
    expect(d.workerIds).toEqual(starts.map(e => e.workerId as number));
    expect(d.executions.map(e => e.executionId)).toEqual(starts.map(e => e.executionId as string));
    expect(starts.every(e => e.familyId === d.familyId)).toBe(true);
    expect(new Set(d.executions.map(e => e.executionId)).size).toBe(d.executions.length);
  }
}
function assertReservations(r: SimRunResult, slots: number, budget: number): number {
  let s = 0, b = 0, active = 0, peak = 0;
  for (const e of r.trace) if (e.reservation && (e.ev === "job_start" || e.ev === "execution_released")) {
    const q = e.reservation as { slots: number; budget: number }, sign = e.ev === "job_start" ? 1 : -1;
    s += sign * q.slots; b += sign * q.budget; active += sign; peak = Math.max(peak, active);
    expect(s >= 0 && s <= slots).toBe(true); expect(b >= 0 && b <= budget).toBe(true);
  }
  expect([s, b, active]).toEqual([0, 0, 0]); return peak;
}

describe("L7 corrective resources, real L2 -> L5 exports", () => {
  test("RV01 empty intersections and missing metadata never widen into wildcard", () => {
    const g = graph("communities-obvious", g => { g.edges = []; });
    for (const key of ["profiles", "models", "accounts"] as const) {
      const p = policy(g); g.nodes.forEach((n, i) => { p.resourcesByFunction[n.id]![key] = [i % 2 ? "q" : "p"]; });
      const e = exported(g, p, [g.nodes.map(n => n.id)]), s = simulation(e);
      for (const w of s.config.workers) { w.profile = "p"; w.model = "p"; w.accountId = "p"; }
      s.config.accountCapacities = { p: { slots: 6, budget: 1000 } };
      expect(e.sidecar.resourcesByUnit[e.units[0]!.unitId]![key]).toEqual([]);
      const r = runScenario(s); expect(r.store.committedCount).toBe(0); expect(r.decisions).toEqual([]);
      expect(r.diagnostics.some(d => d.code === "resource_intersection_empty")).toBe(true);
    }
    const p = policy(g); delete p.resourcesByFunction[g.nodes[0]!.id];
    const s = simulation(exported(g, p, [g.nodes.map(n => n.id)])), r = runScenario(s);
    expect(s.plan.units[0]!.resources?.kind).toBe("unknown"); expect(r.metrics.committedUnits).toBe(0);
    expect(r.diagnostics.some(d => d.code === "resource_metadata_unknown")).toBe(true);
    const legacy = scenario(["A"]); legacy.plan.units[0]!.requiredProfiles = [];
    expect(runScenario(legacy).metrics.committedUnits).toBe(0);
    expect(runScenario(scenario(["A"])).diagnostics.some(d => d.code === "legacy_synthetic_v1_assumptions")).toBe(true);
  });

  test("RV01 complete envelope survives projection and is reserved undecomposed per execution", () => {
    const g = graph("communities-obvious", g => { g.edges = []; }), p = policy(g);
    for (const n of g.nodes) p.resourcesByFunction[n.id] = { ...resource(), models: ["required-model"], slots: 2, cpu: 4, gpu: 1, budget: 50 };
    const e = exported(g, p, [g.nodes.map(n => n.id)]), s = simulation(e);
    expect(s.plan.units[0]!.resources).toEqual({ kind: "required", requirement: e.sidecar.resourcesByUnit[e.units[0]!.unitId]! });
    expect(runScenario(s).metrics.committedUnits).toBe(0);
    for (const w of s.config.workers) Object.assign(w, { model: "required-model", slots: 2, cpu: 4, gpu: 1, budget: 200 });
    s.config.accountCapacities = { shared: { slots: 2, budget: 199 } }; expect(runScenario(s).decisions).toEqual([]);
    s.config.accountCapacities.shared!.budget = 200;
    const r = runScenario(s); expect(r.metrics.outcome).toBe("complete"); expect(r.metrics.overhead.admissions).toBe(12);
    expect(assertReservations(r, 2, 200)).toBe(1); expect(r.resourceModel).toBe(SIM_RESOURCE_MODEL);
    expect(r.resourceModelLimit).toContain("NOT equivalent");
  });

  test("each profile/model/tool/account/capacity constraint has positive and negative controls", () => {
    const g = graph(), e = exported(g);
    const bad = [ { profile: "wrong" }, { model: "wrong" }, { tools: [] }, { accountId: "other" }, { slots: 0 }, { cpu: 0 }, { budget: 0 } ];
    expect(runScenario(simulation(e)).metrics.committedUnits).toBe(1);
    for (const delta of bad) { const s = simulation(e); for (const w of s.config.workers) Object.assign(w, delta); expect(runScenario(s).metrics.committedUnits).toBe(0); }
    const p = policy(g); p.resourcesByFunction[g.nodes[0]!.id]!.gpu = 1;
    const gpu = simulation(exported(g, p)); expect(runScenario(gpu).metrics.committedUnits).toBe(0);
    gpu.config.workers.forEach(w => { w.gpu = 1; }); expect(runScenario(gpu).metrics.committedUnits).toBe(1);
    for (const missing of ["model", "slots", "cpu", "gpu", "budget"] as const) {
      const s = simulation(e); s.config.workers.forEach(w => { delete w[missing]; });
      const r = runScenario(s); expect(r.metrics.committedUnits).toBe(0); expect(r.diagnostics.some(d => d.code === "worker_metadata_unknown")).toBe(true);
    }
    const s = simulation(e); delete s.config.accountCapacities;
    const r = runScenario(s); expect(r.metrics.committedUnits).toBe(0); expect(r.diagnostics.some(d => d.code === "account_metadata_unknown")).toBe(true);
  });

  test("legal zeros/empty tools work; invalid finite dimensions and overflow fail closed", () => {
    const g = graph(), p = policy(g); p.resourcesByFunction[g.nodes[0]!.id] = { ...resource(), tools: [], cpu: 0, gpu: 0, budget: 0 };
    const s = simulation(exported(g, p)); for (const w of s.config.workers) { w.cpu = 0; w.budget = 0; delete w.tools; }
    s.config.accountCapacities = { shared: { slots: 1, budget: 0 } }; expect(runScenario(s).metrics.committedUnits).toBe(1);
    for (const value of [NaN, Infinity, -1, -0, Number.MAX_SAFE_INTEGER + 1]) for (const target of ["worker", "account", "requirement"] as const) {
      const t = simulation(exported(g));
      if (target === "worker") t.config.workers[0]!.cpu = value;
      if (target === "account") t.config.accountCapacities!.shared!.budget = value;
      if (target === "requirement") { t.plan = structuredClone(t.plan); if (t.plan.units[0]!.resources?.kind === "required") t.plan.units[0]!.resources.requirement.cpu = value; }
      expect(() => runScenario(t)).toThrow();
    }
    const two = graph("components-disconnected"), q = policy(two);
    two.nodes.forEach(n => { q.resourcesByFunction[n.id]!.budget = Number.MAX_SAFE_INTEGER; });
    const overflow = simulation(exported(two, q, [two.nodes.map(n => n.id)]));
    expect(validateSimPlan(overflow.plan).some(d => d.code === "invalid_resource_contract")).toBe(true);
    expect(() => runScenario({ ...simulation(exported(g)), durations: { A: Number.MAX_SAFE_INTEGER, B: 1, R: 1 } })).toThrow("overflow");
  });

  test("v2 never falls back; permutations and model distinctions remain visible", () => {
    const e = exported(graph()), s = simulation(e), before = canonical(s.plan);
    const t = structuredClone(s); t.plan.resourceSemantics = "invalid" as typeof SIM_RESOURCE_MODEL;
    expect(() => runScenario(t)).toThrow("plan_non_conformant");
    const absent = structuredClone(s); delete absent.plan.units[0]!.resources;
    expect(() => runScenario(absent)).toThrow("plan_non_conformant");
    const results = [s, { ...s, config: { ...s.config, workers: [...s.config.workers].reverse() } }].map(runScenario);
    expect(results.map(r => r.metrics.makespan)).toEqual([5, 5]); expect(canonical(s.plan)).toBe(before);
    expect(results.every(r => r.diagnostics.every(d => d.code !== "legacy_synthetic_v1_assumptions"))).toBe(true);
  });

  test("shared-account job quotas are separate; conservative packing is not selectCompatible L5", () => {
    const e = exported(graph("components-disconnected")), s = simulation(e, 4);
    s.config.accountCapacities = { shared: { slots: 2, budget: 2 } };
    const workers: WorkerCapacity[] = s.config.workers.map((w, i) => ({ ...w, workerId: `worker:${i}`, model: w.model!, tools: w.tools!, slots: w.slots!, cpu: w.cpu!, gpu: w.gpu!, budget: w.budget!, available: true }));
    const selected = selectCompatible(e.units.map(unit => ({ unit, readiness: { ready: true, reasons: [] }, requirements: e.sidecar.resourcesByUnit[unit.unitId] })), workers, [{ accountId: "shared", slots: 2, budget: 2 }], []);
    expect(selected.assignments.length).toBe(2);
    const r = runScenario(s); expect(r.metrics.outcome).toBe("complete");
    expect(new Set(r.trace.filter(e => e.ev === "job_start" && e.t === 0).map(e => e.unitId)).size).toBe(1);
    expect(assertReservations(r, 2, 2)).toBe(2);
    s.config.accountQuotas = { shared: 1 }; expect(assertReservations(runScenario(s), 2, 2)).toBe(1);
    const bad = workers.map(w => ({ ...w, model: "wrong" }));
    expect(selectCompatible(e.units.map(unit => ({ unit, readiness: { ready: true, reasons: [] }, requirements: e.sidecar.resourcesByUnit[unit.unitId] })), bad, [{ accountId: "shared", slots: 2, budget: 2 }], []).assignments).toEqual([]);
  });
});

describe("L7 corrective temporal and export interop regressions", () => {
  test("RV02 stale/cancelled G2 waiters do not consume the wakeup, real L5 conflicts", () => {
    const e = sharedExport(), [a,b,c,d] = ordered(e);
    for (const action of ["invalidate_knowledge", "cancel"] as const) {
      const s = simulation(e, 8); s.incidents = action === "cancel" ? [{ kind: "cancel", atTick: 1, unitId: b! }, { kind: "cancel", atTick: 1, unitId: c! }] : [{ kind: action, atTick: 1, unitIds: [b!,c!] }];
      const r = runScenario(s); expect(r.units.find(u => u.unitId === a)!.state).toBe("COMMITTED");
      expect(r.units.find(u => u.unitId === d)!.state).toBe("COMMITTED");
      expect(r.trace.find(e => e.ev === "job_start" && e.unitId === d)!.t).toBe(5);
      expect(r.decisions.filter(x => x.unitId === d)).toHaveLength(1);
    }
  });

  test("RV02 external stop uses the same queue, old claims stay held until proof", () => {
    const e = sharedExport(), ids = ordered(e), s = simulation(e, 8);
    s.config.externalClaims = [{ familyId: "old", resourceKeys: ["shared:x"], stoppedAtTick: 5 }];
    s.incidents = [{ kind: "invalidate_knowledge", atTick: 1, unitIds: ids.slice(0, 3) }];
    const r = runScenario(s); expect(r.trace.filter(e => e.ev === "job_start").every(e => e.t >= 5)).toBe(true);
    expect(r.units.find(u => u.unitId === ids[3])!.state).toBe("COMMITTED");
    const held = simulation(e); held.config.externalClaims = [{ familyId: "still-running", resourceKeys: ["shared:x"] }];
    expect(runScenario(held).decisions).toEqual([]);
  });

  test("G2 wake relays past an unavailable resource contract without dropping that waiter", () => {
    const s = scenario(["A","B","C","Z"], [], 3);
    for (const u of s.plan.units.slice(0,3)) u.conflicts = [{ resourceKey: "shared:relay" }];
    s.plan.units[1]!.requiredProfile = "specialist"; s.plan.units[3]!.requiredProfile = "specialist";
    s.config.workers[2]!.profile = "specialist";
    s.durations = new Map(s.plan.units.map(u => [u.unitId, u.unitId === "Z" ? { A:20,B:20,R:1 } : { A:2,B:3,R:1 }]));
    const r = runScenario(s); expect(r.metrics.outcome).toBe("complete");
    expect(r.trace.find(e => e.ev === "job_start" && e.unitId === "C")!.t).toBe(5);
    expect(r.units.find(u => u.unitId === "B")!.state).toBe("COMMITTED");
    expect(r.metrics.overhead.conflictWaiterPops).toBeGreaterThanOrEqual(2);
  });

  test("holders and account reservations survive late fencing, released only at actual stop/done", () => {
    const e = sharedExport(), [a] = ordered(e), s = simulation(e, 8);
    s.incidents = [{ kind: "late_result", unitId: a!, delayTicks: 10 }, { kind: "ambiguous_stop", unitId: a!, atTick: 4, confirmWindow: 1 }];
    const r = runScenario(s), following = r.trace.filter(e => e.ev === "job_start" && e.unitId !== a);
    expect(following.length).toBeGreaterThan(0); expect(following.every(e => e.t >= 14)).toBe(true);
    expect(r.units.find(u => u.unitId === a)!.state).toBe("QUARANTINED"); assertReservations(r, 8, 1_000_000);
    expect(r.trace.some(e => e.ev === "execution_released" && e.unitId === a && e.t === 14)).toBe(true);
  });

  test("RV03 complete dispensations retain citation, do not activate G1, and cannot dispense other prerequisites", () => {
    const g = linked(), p = policy(g), edge = g.edges[0]!;
    p.dispensationsByEdge = { [edge.id]: { reason: "scoped fixture-only waiver", policyVersion: p.version, source: "corrective:fixture", sourceHash: hash("waiver"), validation: "fixture-only", knowledgeRevision: g.knowledgeRevision } };
    const e = exported(g, p), s = simulation(e), pre = s.plan.units.flatMap(u => u.prerequisites)[0]!;
    expect(validateSimPlan(s.plan)).toEqual([]); expect(e.plan.g1Edges[0]!.kind).toBe("obligatory");
    expect(pre.dispensation?.sourceHash).toBe(hash("waiver")); expect(pre.relationId).toBeTruthy();
    const r = runScenario(s); expect(r.metrics.outcome).toBe("complete"); expect(r.metrics.makespan).toBe(5);
    expect(r.decisions.every(d => d.t === 0)).toBe(true);
    for (const mutate of [ (x: typeof pre) => { delete x.dispensation; }, (x: typeof pre) => { x.dispensation!.sourceHash = hash("other"); }, (x: typeof pre) => { x.dispensation!.knowledgeRevision++; }, (x: typeof pre) => { x.relationId = "wrong"; } ]) {
      const t = structuredClone(s); mutate(t.plan.units.flatMap(u => u.prerequisites)[0]!); expect(() => runScenario(t)).toThrow("plan_non_conformant");
    }
    const mixed = scenario(["A","B","C"], [["A","B"],["A","C"]]);
    mixed.plan.units[0]!.prerequisites[0]!.dispensed = true; mixed.plan.units[0]!.prerequisites[0]!.dispensationReason = "manual v1 scoped waiver";
    const out = runScenario(mixed); expect(out.trace.find(e => e.ev === "job_start" && e.unitId === "A")!.t).toBe(5);
    mixed.plan.selectedUnitIds = ["A","B"]; expect(validateSimPlan(mixed.plan).some(d => d.code === "closure_omits_producer")).toBe(true);
  });

  test("RV06 deferred null producer is represented but not admitted; forged selection/null remains invalid", () => {
    const g = graph("cycles-recursion", g => { g.edges = g.edges.slice(0,1); const n = g.nodes.find(n => n.id === g.edges[0]!.destinationId)!; n.functionClass = "incomplete"; n.status = "incomplete"; });
    const e = exported(g), s = simulation(e), r = runScenario(s);
    expect(e.plan.selectedUnitIds).toEqual([]); expect(validateSimPlan(s.plan)).toEqual([]);
    expect(r.metrics.outcome).toBe("stuck"); expect(r.metrics.deferredUnits).toBe(1); expect(r.metrics.committedUnits).toBe(0); expect(r.decisions).toEqual([]);
    expect(r.units[0]!.state).toBe("BLOCKED"); expect(r.diagnostics.some(d => d.code === "planner_deferred:inadmissible-obligatory-callee")).toBe(true);
    const selected = structuredClone(s); selected.plan.selectedUnitIds = selected.plan.units.map(u => u.unitId);
    expect(() => runScenario(selected)).toThrow("plan_non_conformant");
    const unbound = structuredClone(s); unbound.plan.source!.diagnostics = []; expect(() => runScenario(unbound)).toThrow("plan_non_conformant");
    const erased = structuredClone(s); erased.plan.units[0]!.prerequisites = []; expect(() => runScenario(erased)).toThrow("plan_non_conformant");
    const softened = structuredClone(s); softened.plan.units[0]!.prerequisites[0]!.kind = "unknown_unresolved"; expect(() => runScenario(softened)).toThrow("plan_non_conformant");
    const manual = scenario(["A"]); manual.plan.selectedUnitIds = []; manual.plan.units[0]!.prerequisites = [{ producerUnitId: null, kind: "obligatory", requiredPublicationLevel: 1, dispensed: false }];
    expect(() => runScenario(manual)).toThrow("plan_non_conformant");
  });

  test("external_satisfied requires its real receipt while unknown_unresolved is not satisfaction", () => {
    const g = graph("cycles-recursion", g => { g.edges = g.edges.slice(0,1); g.nodes.find(n => n.id === g.edges[0]!.destinationId)!.functionClass = "external"; }), p = policy(g), edge = g.edges[0]!, req = p.requirementsByFunction[edge.destinationId]!;
    const unknown = simulation(exported(g,p)); expect(unknown.plan.units[0]!.prerequisites[0]!.kind).toBe("unknown_unresolved");
    expect(unknown.plan.units[0]!.prerequisites[0]!.externalReceipt).toBeUndefined(); expect(runScenario(unknown).metrics.committedUnits).toBe(1);
    const { minimumRevision, maximumRevision: _max, ...artifact } = req;
    p.edgeKinds = { [edge.id]: "external_satisfied" };
    p.externalReceiptsByEdge = { [edge.id]: { ...artifact, knowledgeRevision: minimumRevision, producerUnitId: null, commitId: hash("external receipt"), readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" } };
    const s = simulation(exported(g,p)); expect(s.plan.units[0]!.prerequisites[0]!.kind).toBe("external_satisfied"); expect(runScenario(s).metrics.committedUnits).toBe(1);
    const bad = structuredClone(s); delete bad.plan.units[0]!.prerequisites[0]!.externalReceipt; expect(() => runScenario(bad)).toThrow("plan_non_conformant");
  });

  test("RV04 real concurrent export attribution matches every job and independent attempt", () => {
    const e = exported(graph("components-disconnected")), s = simulation(e,4), r = runScenario(s); assertDecisions(r);
    expect(r.decisions.map(d => d.workerIds.length)).toEqual([3,3]);
    const a = ordered(e)[0]!; s.durations = { A: 10, B: 12, R: 1 };
    s.incidents = [{ kind: "ambiguous_stop", atTick: 1, unitId: a, confirmWindow: 1 }, { kind: "stop_confirmed", atTick: 3, unitId: a, retry: true }];
    const retry = runScenario(s); expect(retry.metrics.outcome).toBe("complete"); assertDecisions(retry);
    expect(retry.decisions.filter(d => d.unitId === a).map(d => d.attempt)).toEqual([1,2]);
    expect(retry.trace.some(e => e.ev === "late_event_ignored")).toBe(true); assertReservations(retry,4,1_000_000);
  });

  test("RV05 local DAG, G1 and single validation sink give exact nominal CP and real residual", () => {
    const g = linked(), p = policy(g), e = exported(g,p,[g.nodes.map(n => n.id)]), s = simulation(e,4), engine = new SimEngine(s);
    expect(planShape(s.plan,s.durations,1).criticalPathTicks).toBe(9);
    const snapshot = () => (engine as unknown as { finalize(): SimRunResult }).finalize();
    engine.runUntil(4); expect(snapshot().metrics.estimatedRemainingCriticalPathTicks).toBe(5);
    engine.runUntil(7); expect(snapshot().metrics.estimatedRemainingCriticalPathTicks).toBe(2);
    engine.runUntil(8); expect(snapshot().metrics.estimatedRemainingCriticalPathTicks).toBe(1);
    const r = engine.run(); expect(r.metrics.makespan).toBe(9); expect(r.metrics.criticalPathTicks).toBe(9); expect(r.metrics.estimatedRemainingCriticalPathTicks).toBe(0);
    expect(r.metrics.totalWorkTicks).toBe(12); expect(r.store.committedCount).toBe(1);
    const separate = simulation(exported(g),4); expect(planShape(separate.plan,separate.durations,1).criticalPathTicks).toBe(10);
    for (const speed of [0.5,1,1.5,2,5]) {
      const same = simulation(e,4); same.config.workers.forEach(w => { w.speed = speed; }); same.config.rolesParallel = true;
      for (const row of comparePolicies(same,POLICIES)) { expect(row.outcome).toBe("complete"); expect(row.lowerBoundTicks).toBeLessThanOrEqual(row.makespan); expect(row.rolesParallel).toBe(true); }
    }
  });

  test("useful work excludes latency; occupied work retains late releases after the last publication", () => {
    const e = exported(graph("components-disconnected")), s = simulation(e,4), a = ordered(e)[0]!;
    s.incidents = [{ kind: "late_result", unitId: a, delayTicks: 10 }, { kind: "ambiguous_stop", unitId: a, atTick: 4, confirmWindow: 1 }];
    const r = runScenario(s); expect(r.metrics.publicationEndTick).toBe(5); expect(r.metrics.occupationEndTick).toBe(14);
    expect(r.metrics.occupationHorizonTicks).toBeGreaterThanOrEqual(14); expect(r.metrics.occupiedWorkerTicks).toBe(22);
    expect(r.metrics.usefulWorkerTicks).toBe(6); expect(r.metrics.occupationUtilization).toBe(r.metrics.occupiedWorkerTicks/r.metrics.occupationCapacityTicks);
    assertDecisions(r); assertReservations(r,4,1_000_000);
  });
});
