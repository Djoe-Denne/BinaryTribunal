import { describe, expect, test } from "bun:test";
import { runScenario, SimEngine, validateSimPlan, simPlanFromExport, buildContextEnvelope, buildAdmissionEnvelope, utf8ByteLength, assertSafeManifestPath, SIM_INTEGRATION_LIMITS, captureReplayJournal, replayScenarioJournal } from "../../src/simulator";
import { planMission } from "../../src/planner";
import { scenario, plannerFixture, fn, unit } from "./scenarios";
import { verifyTrace } from "./oracle";

const commitAt = (result: ReturnType<typeof runScenario>, id: string): number => result.trace.find(e => e.ev === "committed" && e.unitId === id)!.t;
const startAt = (result: ReturnType<typeof runScenario>, id: string): number => result.trace.find(e => e.ev === "job_start" && e.unitId === id)!.t;
describe("L7 independent scheduler oracle", () => {
  test("A->B/C,D/E->B: B dispatches before slow F finishes; gate is commit, not response", () => {
    const s = scenario(["A", "B", "C", "D", "E", "F"], [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"]]);
    s.durations = new Map(s.plan.units.map(u => [u.unitId, { A: u.unitId === "F" ? 30 : 2, B: u.unitId === "F" ? 35 : 3, R: 1 }]));
    const result = runScenario(s); verifyTrace(s, result);
    expect(result.metrics.outcome).toBe("complete"); expect(startAt(result, "B")).toBe(Math.max(commitAt(result, "D"), commitAt(result, "E")));
    expect(startAt(result, "B")).toBeLessThan(commitAt(result, "F"));
    expect(startAt(result, "A")).toBeGreaterThanOrEqual(Math.max(commitAt(result, "B"), commitAt(result, "C")));
  });
  test("2+1 per function, disjoint A/B outputs, shared family single commit, overlapping read contexts", () => {
    const s = scenario(["A", "B"]); s.plan.units[0]!.ownedFunctionIds.push(fn(100));
    for (const u of s.plan.units) u.contextFunctionIds = [fn(999)];
    const result = runScenario(s); verifyTrace(s, result);
    expect(result.store.committedCount).toBe(2); expect(result.trace.filter(e => e.ev === "job_start" && e.unitId === "A").length).toBe(6);
    expect(result.trace.filter(e => e.ev === "job_start" && e.unitId === "A" && e.role !== "R").some(e => e.t === 0)).toBe(true);
  });
  test("direct conflicts are not transitively closed: A and C overlap although each conflicts B", () => {
    const s = scenario(["A", "B", "C"]);
    s.plan.units[0]!.conflicts = [{ resourceKey: "AB" }]; s.plan.units[1]!.conflicts = [{ resourceKey: "AB" }, { resourceKey: "BC" }]; s.plan.units[2]!.conflicts = [{ resourceKey: "BC" }];
    const result = runScenario(s); verifyTrace(s, result);
    expect(startAt(result, "A")).toBe(startAt(result, "C")); expect(startAt(result, "B")).toBeGreaterThanOrEqual(commitAt(result, "C"));
  });
  test("one-sided withUnitId directly excludes its peer without shared key",()=>{
    const s=scenario(["A","B","C"]);s.plan.units[0]!.conflicts=[{resourceKey:"only:A",withUnitId:"B"}];
    const result=runScenario(s);expect(startAt(result,"B")).toBeGreaterThanOrEqual(commitAt(result,"A"));expect(startAt(result,"C")).toBe(0);
  });
  test("old-plan claims survive until explicit terminal proof, not TTL/current partition",()=>{
    const s=scenario(["A"]);s.config.externalClaims=[{familyId:"old-plan:A",resourceKeys:[`fn:${s.plan.units[0]!.ownedFunctionIds[0]}`]}];
    expect(runScenario(s).store.committedCount).toBe(0);
    s.config.externalClaims[0]!.stoppedAtTick=7;const result=runScenario(s);expect(startAt(result,"A")).toBe(7);expect(result.metrics.outcome).toBe("complete");
  });
  test("caller cannot mutate active frozen plan, durations or account config",()=>{
    const s=scenario(["A","B"],[["B","A"]]),engine=new SimEngine(s);engine.runUntil(0);
    s.plan.units[0]!.ownedFunctionIds.push(fn(999));s.config.accountQuotas={shared:0};s.durations={A:999,B:999,R:999};
    const result=engine.run();expect(result.metrics.outcome).toBe("complete");expect(result.metrics.makespan).toBe(10);expect(result.trace.filter(e=>e.ev==="job_start").length).toBe(6);
  });
  test("all 6 D/E/F completion permutations preserve knowledge causality", () => {
    for (const ds of [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]) {
      const s = scenario(["A", "B", "C", "D", "E", "F"], [["A","B"],["A","C"],["B","D"],["B","E"],["C","F"]]);
      s.durations = new Map(s.plan.units.map(u => [u.unitId, { A: ds[["D","E","F"].indexOf(u.unitId)] ?? 1, B: 1, R: 1 }])); verifyTrace(s, runScenario(s));
    }
  });
  test("account quota shared across worker records; incompatible head cannot hide useful work", () => {
    const s = scenario(["A", "B", "C"], [], 4); s.plan.units[0]!.requiredProfile = "forbidden";
    s.config.accountQuotas = { shared: 1 }; const result = runScenario(s); verifyTrace(s, result);
    expect(result.metrics.committedUnits).toBe(2); expect(result.metrics.outcome).toBe("stuck"); expect(result.units[0]!.state).toBe("READY");
  });
  test("compatible account/tools requirements, not arbitrary free worker count",()=>{
    const s=scenario(["A","B"]);s.plan.units[0]!.requiredAccounts=["missing:account"];s.plan.units[1]!.requiredTools=["gpu"];
    expect(runScenario(s).store.committedCount).toBe(0);
    s.config.workers[0]!.accountId="missing:account";s.config.workers[1]!.tools=["cpu","gpu"];
    expect(runScenario(s).metrics.outcome).toBe("complete");
  });
  test("pause is not completion; all admissions honor pause interval", () => {
    const s = scenario(["A", "B"]); s.incidents = [{ kind: "pause", fromTick: 0, toTick: 10 }];
    const engine = new SimEngine(s); engine.runUntil(5); expect(engine.getUnitState("A")).toBe("READY");
    const result = engine.run(); verifyTrace(s, result); expect(startAt(result, "A")).toBe(10); expect(result.metrics.outcome).toBe("complete");
    expect(runScenario(scenario([], [])).metrics.outcome).toBe("complete");
    const deferred=scenario(["A"]);deferred.plan.selectedUnitIds=[];expect(runScenario(deferred).metrics.outcome).toBe("stuck");expect(runScenario(deferred).metrics.deferredUnits).toBe(1);
  });
  test("two fixture controllers cannot reserve same family", () => {
    const s = scenario(["A"], [], 0); const engine = new SimEngine(s); engine.runUntil(0);
    // No compatible worker => both fail rather than claiming a useful reservation.
    expect(engine.tryReserve("A", "one").ok).toBe(false); expect(engine.tryReserve("A", "two").ok).toBe(false);
    const running = new SimEngine(scenario(["A"])); running.runUntil(0);
    expect(running.tryReserve("A", "other").ok).toBe(false); expect(running.run().units[0]!.attempts).toBe(1);
    const manual = scenario(["A"]); manual.config.autoDispatch = false;
    const race = new SimEngine(manual); race.runUntil(0); expect(race.tryReserve("A", "one").ok).toBe(true); expect(race.tryReserve("A", "two").ok).toBe(false);
  });
  test("loss response recovers same attempt and single publication; double commit rejected", () => {
    const s = scenario(["A", "B"], [["B", "A"]]); s.incidents = [{ kind: "response_lost", unitId: "A", reconcileAfter: 5 }, { kind: "double_commit_attempt", atTick: 20, unitId: "A" }];
    const result = runScenario(s); verifyTrace(s, result); expect(result.metrics.outcome).toBe("complete");
    expect(result.units[0]!.attempts).toBe(1); expect(result.trace.some(e => e.ev === "reconciled_from_outbox")).toBe(true); expect(result.store.rejectedCommits.length).toBe(1);
  });
  test.each(["lease_expired_worker_active", "heartbeat_lost", "ambiguous_stop"] as const)("%s never steals active worker or publishes late family", kind => {
    const s = scenario(["A", "B"], [["B", "A"]], 2); s.durations = { A: 10, B: 12, R: 1 }; s.config.leaseTicks = 4; s.config.heartbeatEvery = 1;
    s.incidents = [kind === "ambiguous_stop" ? { kind, atTick: 2, unitId: "A", confirmWindow: 1 } : { kind, atTick: 2, unitId: "A" }];
    const result = runScenario(s); verifyTrace(s, result); expect(result.store.committedCount).toBe(0); expect(result.units[0]!.attempts).toBe(1);
    expect(result.metrics.usefulWorkerTicks).toBe(0); expect(result.metrics.reworkWorkerTicks).toBeGreaterThan(0); expect(result.metrics.outcome).toBe("stuck");
  });
  test("late response occupies worker after estimated end; no overlap with independent job", () => {
    const s = scenario(["A", "B"], [], 1); s.incidents = [{ kind: "late_result", unitId: "A", delayTicks: 5 }];
    const result = runScenario(s); verifyTrace(s, result); expect(result.metrics.outcome).toBe("complete");
    expect(startAt(result, "B")).toBeGreaterThanOrEqual(11);
  });
  test("controller crash does not imply stopped worker; replay identical at every tick boundary", () => {
    const s = scenario(["A", "B"], [["B", "A"]]); s.incidents = [{ kind: "crash_before_admit", atTick: 0, unitId: "A" }, { kind: "crash_after_admit", atTick: 1, unitId: "A" }];
    const baseline = runScenario(s); verifyTrace(s, baseline);
    for (let tick = 0; tick < 15; tick++) { const engine = new SimEngine(s); engine.runUntil(tick); const result = engine.run(); expect(result.traceHash).toBe(baseline.traceHash); expect(result.decisions).toEqual(baseline.decisions); }
    expect(baseline.units[0]!.attempts).toBe(1);
    const journal = JSON.parse(JSON.stringify(captureReplayJournal(s, baseline))); expect(replayScenarioJournal(journal).traceHash).toBe(baseline.traceHash);
    journal.scenario.config.leaseTicks++; expect(() => replayScenarioJournal(journal)).toThrow("journal");
  });
  test("explicit confirmed stop permits retry; stale old result cannot commit or reuse active worker", () => {
    const s = scenario(["A"], [], 2); s.durations = { A: 10, B: 12, R: 1 };
    s.incidents = [{ kind: "ambiguous_stop", atTick: 1, unitId: "A", confirmWindow: 1 }, { kind: "stop_confirmed", atTick: 3, unitId: "A", retry: true }];
    const result = runScenario(s); verifyTrace(s, result); expect(result.metrics.outcome).toBe("complete"); expect(result.units[0]!.attempts).toBe(2);
    expect(result.trace.filter(e => e.ev === "late_event_ignored").length).toBeGreaterThan(0); expect(result.store.committedCount).toBe(1); expect(result.metrics.reworkWorkerTicks).toBe(6);
  });
  test("bulletins never canonical facts, dependencies, or author context", () => {
    const base = scenario(["A", "B"], [["B", "A"]]);
    const s = structuredClone(base); s.incidents = [
      { kind: "bulletin", atTick: 1, unitId: "A", authorRole: "R", canonical: true },
      { kind: "bulletin", atTick: 1, unitId: "A", authorRole: "unauthorized", canonical: true },
      ...["validScope", "validHash", "coherentTrace"].map(key => ({ kind: "bulletin" as const, atTick: 1, unitId: "A", authorRole: "R" as const, canonical: true, [key]: false })),
    ];
    const normal = runScenario(base), result = runScenario(s); verifyTrace(s, result);
    expect(result.bulletins.filter(b => b.accepted).length).toBe(1); expect(commitAt(result, "A")).toBe(commitAt(normal, "A"));
    expect(result.trace.filter(e => e.ev === "job_start").map(e => e.contextManifest)).toEqual(normal.trace.filter(e => e.ev === "job_start").map(e => e.contextManifest));
    expect(result.store.getCommit("A")!.validatedFactIds).toEqual(normal.store.getCommit("A")!.validatedFactIds);
  });
  test("new dependency/SCC/invalidation during activity fences old immutable context", () => {
    for (const kind of ["new_scc", "invalidate_knowledge", "partition_adoption"] as const) {
      const s = scenario(["A", "B"]); s.incidents = [{ kind, atTick: 1, unitIds: ["A"] }];
      const result = runScenario(s); expect(result.metrics.contextFreshness.staleAttempts).toBe(1);
      expect(result.store.getCommit("A") !== undefined).toBe(kind === "partition_adoption");
      const hashes = result.trace.filter(e => e.unitId === "A" && e.manifest).map(e => e.manifest); expect(new Set(hashes).size).toBe(1);
    }
    const s = scenario(["A", "B"]); s.incidents = [{ kind: "new_dependency", atTick: 1, consumerUnitId: "A", producerUnitId: "B" }];
    expect(runScenario(s).store.getCommit("A")).toBeUndefined();
  });
  test("dynamic conflicting active units retain ownership until actual completion, neither promotes", () => {
    const s = scenario(["A", "B"], [], 4); s.incidents = [{ kind: "new_conflict", atTick: 1, unitIdA: "A", unitIdB: "B", resourceKey: "new:key" }];
    const result = runScenario(s); expect(result.store.committedCount).toBe(0); expect(result.metrics.outcome).toBe("stuck");
  });
});

describe("contract and independent graph oracle", () => {
  test("cyclic quotient, reversed call direction, budget omission, duplicate ownership reject", () => {
    const cyclic = scenario(["A","B"], [["A","B"],["B","A"]]); expect(validateSimPlan(cyclic.plan).some(d => d.code === "quotient_cycle")).toBe(true);
    const missing = scenario(["A","B"], [["A","B"]]); missing.plan.selectedUnitIds = ["A"];
    expect(validateSimPlan(missing.plan).some(d => d.code === "closure_omits_producer")).toBe(true);
    const duplicate = scenario(["A","B"]); duplicate.plan.units[1]!.ownedFunctionIds = [...duplicate.plan.units[0]!.ownedFunctionIds]; expect(() => runScenario(duplicate)).toThrow("plan_non_conformant");
    const backwards = scenario(["A","B"], [["A","B"]]); backwards.plan.g1Edges[0]!.callSourceFunctionId = backwards.plan.units[1]!.ownedFunctionIds[0]!; expect(validateSimPlan(backwards.plan).some(d => d.code === "call_direction_mismatch")).toBe(true);
  });
  test("immutable L5 export A->B/C with artifacts, local SCC recursion and self-loops", () => {
    for (const calls of [[[0,1],[0,2]], [[0,1],[1,0]], [[0,0]]] as Array<Array<[number,number]>>) {
      const f = plannerFixture(3, calls), result = planMission(f.graph, f.groups, f.policy), plan = simPlanFromExport(result);
      expect(validateSimPlan(plan)).toEqual([]); expect(Object.isFrozen(plan)).toBe(true);
      const s = scenario([]); s.plan = plan; const run = runScenario(s); verifyTrace(s, run); expect(run.metrics.outcome).toBe("complete");
    }
  });
  test("large SCC is dependency-exclusive and all functions publish once as one family", () => {
    const n = 128, f = plannerFixture(n, Array.from({ length: n }, (_, i) => [i, (i+1)%n]));
    const exported = planMission(f.graph, f.groups, f.policy); expect(exported.units.length).toBe(1);
    const s = scenario([], [], 16); s.plan = simPlanFromExport(exported);
    const result = runScenario(s); verifyTrace(s, result); expect(result.metrics.outcome).toBe("complete"); expect(result.store.committedCount).toBe(1);
  });
  test("grouped local caller A/B wait callee R, not fake concurrent SCC semantics", () => {
    const f = plannerFixture(2, [[0,1]], [[0,1]]), exported = planMission(f.graph, f.groups, f.policy), s = scenario([]);
    s.plan = simPlanFromExport(exported); const result = runScenario(s); verifyTrace(s,result);
    const caller = result.trace.filter(e=>e.ev==="job_start"&&e.functionId===fn(0));
    const calleeR = result.trace.find(e=>e.ev==="job_done"&&e.functionId===fn(1)&&e.role==="R")!;
    expect(caller.every(e=>e.t>=calleeR.t)).toBe(true); expect(result.store.committedCount).toBe(1);
  });
  test("tampered export fingerprint is not implicitly validated", () => {
    const f = plannerFixture(2, [[0,1]]), r = structuredClone(planMission(f.graph, f.groups, f.policy)); r.units[0]!.contextFunctionIds.push(fn(900)); expect(() => simPlanFromExport(r)).toThrow("fingerprint");
  });
  test("required level2, wrong artifact hash/revision, envelope deficit never fabricated", () => {
    const local = scenario(["A"]); local.plan.units[0]!.requiredPublicationLevel = 2; expect(runScenario(local).store.committedCount).toBe(0);
    const f = plannerFixture(2, [[0,1]]), plan = structuredClone(simPlanFromExport(planMission(f.graph, f.groups, f.policy)));
    const consumer = plan.units.find(u => u.prerequisites.length)!; consumer.prerequisites[0]!.requirement!.artifactSha256 = "0".repeat(64);
    const s = scenario([]); s.plan = plan; expect(runScenario(s).metrics.committedUnits).toBe(1);
  });
  test("unicode full envelope bytes, CRLF line boundaries, unsafe paths, native limits explicitly separated", () => {
    const u = unit("U"); u.contextManifestLines = ["é😀", "界"];
    const text = "é😀\n界"; expect(utf8ByteLength(text)).toBe(10);
    expect(buildContextEnvelope(u, { contextEnvelopeMaxUtf8Bytes: 9, nativeLineCharLimit: 2000 }).withinBudget).toBe(false);
    u.contextManifestLines = ["x".repeat(2000), "y"]; expect(buildContextEnvelope(u, { contextEnvelopeMaxUtf8Bytes: 5000, nativeLineCharLimit: 2000 }).withinLineLimit).toBe(true);
    u.contextManifestLines = ["x".repeat(2001)]; expect(buildContextEnvelope(u, { contextEnvelopeMaxUtf8Bytes: 5000, nativeLineCharLimit: 2000 }).withinLineLimit).toBe(false);
    for (const p of ["../escape", "a/../../escape", "C:\\escape", "\\\\server\\file", "file:ads", "NUL.txt", "trailing.", "trailing "]) expect(() => assertSafeManifestPath("C:\\owned", p)).toThrow("unsafe_manifest_path");
    expect(assertSafeManifestPath("C:\\owned", "outputs/é.json")).toContain("é.json"); expect(SIM_INTEGRATION_LIMITS).toContain("filesystem-junction-symlink-ancestors");
  });
  test("full admission wrapper UTF8 exact boundary and distinct per-unit allocations", () => {
    const u=unit("é😀");u.contextManifestLines=["界é😀"];
    const authority={missionId:"mission:界",planId:"plan:é",controllerId:"sim:fixture"},budget={contextEnvelopeMaxUtf8Bytes:10000,nativeLineCharLimit:2000};
    const envelope=buildAdmissionEnvelope(u,budget,authority);expect(envelope.utf8Bytes).toBeGreaterThan(utf8ByteLength("界é😀"));
    u.allocatedEnvelopeUtf8Bytes=envelope.utf8Bytes;expect(buildAdmissionEnvelope(u,budget,authority).withinBudget).toBe(true);
    u.allocatedEnvelopeUtf8Bytes--;expect(buildAdmissionEnvelope(u,budget,authority).withinBudget).toBe(false);
    const s=scenario(["A","B"]);s.plan.units[0]!.allocatedEnvelopeUtf8Bytes=1;s.plan.units[1]!.allocatedEnvelopeUtf8Bytes=10000;
    const result=runScenario(s);expect(result.store.getCommit("A")).toBeUndefined();expect(result.store.getCommit("B")).toBeDefined();
  });
  test("all directed three-node graphs: independent cycle oracle uses reachability, not lowlinks", () => {
    for (let mask = 0; mask < 512; mask++) {
      const edges: Array<[number,number]> = [];
      for (let bit=0;bit<9;bit++) if (mask & (1<<bit)) edges.push([Math.floor(bit/3),bit%3]);
      const reach = Array.from({length:3}, (_,i)=>new Set([i]));
      // Floyd closure bounded at 3: independent reference, never used in performance corpus.
      for (const [a,b] of edges) reach[a]!.add(b);
      for(let k=0;k<3;k++) for(let i=0;i<3;i++) for(let j=0;j<3;j++) if(reach[i]!.has(k)&&reach[k]!.has(j))reach[i]!.add(j);
      const f=plannerFixture(3,edges), r=planMission(f.graph,f.groups,f.policy);
      const owners=new Map(r.units.flatMap(u=>u.ownedFunctionIds.map(id=>[id,u.unitId] as const)));
      for(let i=0;i<3;i++)for(let j=0;j<3;j++)expect(owners.get(fn(i))===owners.get(fn(j))).toBe(reach[i]!.has(j)&&reach[j]!.has(i));
      expect(validateSimPlan(simPlanFromExport(r))).toEqual([]);
    }
  });
});
