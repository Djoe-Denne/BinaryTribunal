import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canonical, fingerprint, hash } from "../../src/validation";
import { buildGraphSnapshot } from "../../src/graph-normalize";
import { validateGraphSnapshot, type GraphSnapshotV1 } from "../../src/graph";
import { planMission, receiptSatisfies, type ArtifactReceipt, type PlannerPolicy, type PlannerResult } from "../../src/planner";
import { SimEngine, runScenario, simPlanFromExport, validateSimPlan,
  type SimIncident, type SimObservation, type SimPlanInput, type SimRunResult, type SimScenario } from "../../src/simulator";
import { fn, scenario } from "./scenarios";

function graph(edit: (g: GraphSnapshotV1) => void = () => {}, name = "communities-obvious"): GraphSnapshotV1 {
  const g: GraphSnapshotV1 = JSON.parse(readFileSync(join(import.meta.dir, "../fixtures/graph", name, "content.json"), "utf8"));
  edit(g);
  const { snapshot } = buildGraphSnapshot({ missionId: g.missionId, snapshotId: `snapshot:astra-g2:${name}`, artifacts: g.binaryArtifacts,
    nodes: g.nodes, edges: g.edges, objects: g.objects, unresolved: g.unresolved, capabilities: g.capabilities,
    knowledgeRevision: g.knowledgeRevision, scopeDescription: g.scope.description, coverage: g.coverage,
    toolVersions: g.toolVersions, configFingerprint: g.configFingerprint });
  expect(validateGraphSnapshot(snapshot)).toEqual([]);
  return snapshot;
}
function independent(indices = [0, 1, 2, 3]): GraphSnapshotV1 {
  return graph(g => { g.nodes = indices.map(i => g.nodes[i]!); g.edges = []; g.objects = []; g.unresolved = []; });
}
function policy(g: GraphSnapshotV1): PlannerPolicy {
  return { version: "astra-g2-v1", estimationVersion: "astra-estimate-v1", partitionId: "partition:astra-g2", investigationKind: "decompilation",
    artifactKind: "reconciled_c", publicationLevel: 1, contextEnvelopeMaxUtf8Bytes: 100_000_000, totalContextBudgetUtf8Bytes: 1_000_000_000,
    maxSelectedUnits: 100, sccMaxFunctions: 100, sccMaxIterations: 2, sccCostBudget: 100_000,
    resourcesByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { profiles: ["build"], models: ["offline"], accounts: ["shared"], tools: ["cpu"], slots: 1, cpu: 1, gpu: 0, budget: 1 }])),
    estimatesByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { version: "astra-estimate-v1", A: 1, B: 1, R: 1, validation: 1 }])),
    requirementsByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { artifactId: `artifact:${n.id}`, artifactSha256: hash(`fixture:${n.id}`),
      functionId: n.id, moduleSha256: n.moduleSha256, artifactKind: "reconciled_c", minimumRevision: g.knowledgeRevision + 1,
      maximumRevision: g.knowledgeRevision + 100, publicationLevel: 1, validation: "fixture-only" }])) };
}
function exported(g: GraphSnapshotV1, p = policy(g), reverse = false): PlannerResult {
  const groups = g.nodes.filter(n => n.status === "observed" && n.functionClass === "internal").map((n, i) =>
    ({ groupId: `group:${i}`, partitionId: p.partitionId, ownedFunctionIds: [n.id], contextFunctionIds: [] }));
  return planMission(g, reverse ? groups.reverse() : groups, p);
}
function simulated(e: PlannerResult, workers = 8): SimScenario {
  const s = scenario([], [], workers); s.plan = simPlanFromExport(e);
  s.durations = { A: 1, B: 1, R: 1 }; s.config.heartbeatEvery = 0; s.config.leaseTicks = 100; s.config.rolesParallel = true;
  return s;
}
function conflicts(p: PlannerPolicy, fn: string, keys: string[], salt = "0"): void {
  (p.extraConflictsByFunction ??= {})[fn] = keys.map((resourceKey, i) => ({ id: `g2:${salt}:${i}`, kind: "exclusive_write", resourceKey, withUnitId: null }));
}
function ordered(e: PlannerResult) { return [...e.units].sort((a, b) => a.unitId < b.unitId ? -1 : a.unitId > b.unitId ? 1 : 0); }
function at(r: SimRunResult | SimObservation, id: string) { return r.units.find(u => u.unitId === id)!; }
function bulletin(unitId: string, atTick: number): SimIncident { return { kind: "bulletin", unitId, atTick, authorRole: "unauthorized", canonical: false }; }
function noCreditLoss(r: SimRunResult): void {
  const running = new Map<string, number>();
  for (const e of r.trace) {
    if (e.ev === "job_start") { expect(running.has(e.executionId as string)).toBe(false); running.set(e.executionId as string, e.workerId as number); }
    if (e.ev === "execution_released") { expect(running.get(e.executionId as string)).toBe(e.workerId as number); running.delete(e.executionId as string); }
    expect(new Set(running.values()).size).toBe(running.size);
  }
  expect(running.size).toBe(0);
}

describe("G2 multiclé : vrais exports, FIFO et relais borné", () => {
  test("un waiter reparké ne vole pas K1, permutations d'IDs/ordre réel des clés", () => {
    for (let seed = 0; seed < 16; seed++) {
      const g = independent([seed % 4, (seed + 1) % 4]), p = policy(g), [b, c] = ordered(exported(g, p));
      const keys = seed % 2 ? ["K2", "K1"] : ["X", "Y"];
      conflicts(p, b!.ownedFunctionIds[0]!, seed % 4 ? keys : [...keys].reverse(), String(seed));
      const first = exported(g, p, !!(seed % 2)).units.find(u => u.unitId === b!.unitId)!;
      const keyOrder = first.conflicts.map(c => c.resourceKey).filter(k => keys.includes(k));
      expect(keyOrder).toHaveLength(2);
      conflicts(p, c!.ownedFunctionIds[0]!, [keyOrder[0]!], `single:${seed}`);
      for (const scheduling of ["fifo", "event_driven"] as const) {
        const s = simulated(exported(g, p, !!(seed % 2))); s.config.policy = scheduling;
        s.config.externalClaims = [{ familyId: "K1", resourceKeys: [keyOrder[0]!], stoppedAtTick: 5 }, { familyId: "K2", resourceKeys: [keyOrder[1]!], stoppedAtTick: 8 }];
        if (seed % 2) s.config.externalClaims.reverse();
        for (const cancelAt of [4, 5, 6]) {
          const r = runScenario({ ...s, incidents: [{ kind: "cancel", unitId: b!.unitId, atTick: cancelAt }] });
          expect(at(r, c!.unitId).dispatchTick).toBe(5);
          expect(r.decisions.filter(d => d.unitId === c!.unitId)).toHaveLength(1);
          expect(r.metrics.overhead.conflictWaiterPops).toBeLessThanOrEqual(3);
        }
        // Opposite control: B really owns K1, so C waits for B's commit at8.
        s.config.externalClaims.find(c => c.familyId === "K2")!.stoppedAtTick = 3;
        const held = runScenario(s);
        expect(at(held, b!.unitId).dispatchTick).toBe(5); expect(at(held, c!.unitId).dispatchTick).toBe(8);
      }
    }
  });

  test("cycles de clés, pause et ressource indisponible ne bouclent pas", () => {
    for (const paused of [false, true]) {
      const s = scenario(["A", "B", "C"], [], 6); s.config.heartbeatEvery = 0; s.config.leaseTicks = 100;
      s.durations = { A: 1, B: 1, R: 1 };
      s.plan.units.forEach((u, i) => { u.conflicts = [{ resourceKey: `K${i}` }, { resourceKey: `K${(i + 1) % 3}` }]; });
      s.config.externalClaims = [0, 1, 2].map(i => ({ familyId: `old:${i}`, resourceKeys: [`K${i}`], stoppedAtTick: i + 2 }));
      if (paused) s.incidents = [{ kind: "pause", fromTick: 1, toTick: 6 }];
      const r = runScenario(s); expect(r.metrics.outcome).toBe("complete");
      expect(r.metrics.overhead.conflictWaiterPops).toBeLessThanOrEqual(12);
      expect(r.metrics.overhead.conflictWakeKeyVisits).toBeLessThanOrEqual(12);
      noCreditLoss(r);
    }
    const s = scenario(["A", "B", "C", "Z"], [], 3);
    s.plan.units.slice(0, 3).forEach(u => { u.conflicts = [{ resourceKey: "relay" }]; });
    s.plan.units[1]!.requiredProfile = "specialist"; s.plan.units[3]!.requiredProfile = "specialist"; s.config.workers[2]!.profile = "specialist";
    s.durations = new Map(s.plan.units.map(u => [u.unitId, u.unitId === "Z" ? { A: 20, B: 20, R: 1 } : { A: 2, B: 3, R: 1 }]));
    const r = runScenario(s); expect(at(r, "C").dispatchTick).toBe(5); expect(r.metrics.outcome).toBe("complete");
    expect(r.metrics.overhead.conflictWaiterPops).toBeLessThanOrEqual(4);
  });

  test("borne sur N waiters K0/Ki : au plus trois pops par waiter et un pour Z", () => {
    for (const n of [8, 16, 32]) {
      const ids = Array.from({ length: n }, (_, i) => `A${String(i).padStart(3, "0")}`), s = scenario([...ids, "Z"], [], 6);
      s.config.heartbeatEvery = 0; s.config.leaseTicks = 1000; s.durations = { A: 1, B: 1, R: 1 };
      s.plan.units.forEach((u, i) => { u.ownedFunctionIds = [fn(i)]; u.conflicts = [{ resourceKey: "K0" }, ...(i < n ? [{ resourceKey: `K${i + 1}` }] : [])]; });
      s.config.externalClaims = Array.from({ length: n + 1 }, (_, i) => ({ familyId: `old:${i}`, resourceKeys: [`K${i}`], stoppedAtTick: i + 1 }));
      const r = runScenario(s);
      expect(at(r, "Z").dispatchTick).toBe(1); expect(r.metrics.outcome).toBe("complete");
      // Each waiter leaves K0 once, Ki once, and can repark K0 once while Z/another owner holds it.
      expect(r.metrics.overhead.conflictWaiterPops).toBeLessThanOrEqual(3 * n + 1);
      expect(r.metrics.overhead.conflictMembershipUpdates).toBeGreaterThan(0);
    }
  });

  test("un ticket rend K1 si une autre admission prend sa capacité au même dispatch", () => {
    const s = scenario(["A", "B", "C", "D"], [["D", "A"]], 4);
    s.config.policy = "critical_path"; s.config.validationTicks = 0; s.config.heartbeatEvery = 0; s.config.leaseTicks = 100;
    s.config.workers.forEach((w, i) => { w.profile = i < 2 ? "z" : i === 2 ? "p" : "q"; });
    s.plan.units.forEach(u => { u.requiredProfile = u.unitId === "A" ? "z" : u.unitId === "C" ? "q" : "p"; });
    s.plan.units.slice(0, 3).forEach(u => { u.conflicts = [{ resourceKey: "K1" }]; });
    s.durations = new Map(s.plan.units.map(u => [u.unitId, u.unitId === "D" ? { A: 10, B: 10, R: 1 } : { A: 1, B: 1, R: 1 }]));
    const r = runScenario(s);
    expect(at(r, "D").dispatchTick).toBe(2); expect(at(r, "C").dispatchTick).toBe(2);
    expect(at(r, "B").dispatchTick).toBeGreaterThan(2); expect(r.metrics.outcome).toBe("complete"); noCreditLoss(r);
  });
});

describe("G2 multi-holders : aucune libération par fence/état", () => {
  function inventory() {
    const g = independent(), p = policy(g), [a, b, d, c] = ordered(exported(g, p));
    conflicts(p, c!.ownedFunctionIds[0]!, ["X"]);
    return { s: simulated(exported(g, p)), a: a!.unitId, b: b!.unitId, d: d!.unitId, c: c!.unitId };
  }

  test("trois réservations + ancien claim, arrêts partiels/même tick et conflits répétés", () => {
    for (const reverse of [false, true]) {
      const { s, a, b, d, c } = inventory();
      s.config.externalClaims = [{ familyId: "old", resourceKeys: ["X"], stoppedAtTick: 2 }];
      s.durations = new Map(s.plan.units.map(u => [u.unitId, u.unitId === c ? { A: 1, B: 1, R: 1 } : { A: 20, B: 21, R: 1 }]));
      const arrivals: SimIncident[] = [{ kind: "new_conflict", atTick: 1, resourceKey: "X", unitIdA: a, unitIdB: b }, { kind: "new_conflict", atTick: 1, resourceKey: "X", unitIdA: b, unitIdB: d }];
      if (reverse) arrivals.reverse();
      s.incidents = [...arrivals, ...arrivals, { kind: "stop_confirmed", atTick: 3, unitId: a }, { kind: "stop_confirmed", atTick: 3, unitId: b },
        { kind: "stop_confirmed", atTick: 3, unitId: a }, { kind: "stop_confirmed", atTick: 5, unitId: d }];
      const r = runScenario(s);
      expect(at(r, c).dispatchTick).toBe(5); expect(r.decisions.filter(x => x.unitId === c)).toHaveLength(1);
      expect(r.trace.filter(e => e.ev === "execution_released" && e.unitId === d).map(e => e.t)).toEqual([5, 5]);
      noCreditLoss(r);
    }
  });

  test("la première done ne libère pas les autres détenteurs de la nouvelle clé", () => {
    const { s, a, b, d, c } = inventory();
    s.config.externalClaims = [{ familyId: "old", resourceKeys: ["X"], stoppedAtTick: 2 }];
    s.durations = new Map([[a, { A: 4, B: 5, R: 1 }], [b, { A: 6, B: 7, R: 1 }], [d, { A: 8, B: 9, R: 1 }], [c, { A: 1, B: 1, R: 1 }]]);
    s.incidents = [{ kind: "new_conflict", atTick: 1, resourceKey: "X", unitIdA: a, unitIdB: b }, { kind: "new_conflict", atTick: 1, resourceKey: "X", unitIdA: b, unitIdB: d }];
    const r = runScenario(s); expect(at(r, c).dispatchTick).toBe(9); noCreditLoss(r);
  });

  test("une réservation en validation sans job reste détenue après fence", () => {
    const { s, a, b, d, c } = inventory(); s.config.validationTicks = 5;
    s.config.externalClaims = [{ familyId: "old", resourceKeys: ["X"], stoppedAtTick: 4 }];
    s.durations = new Map([[a, { A: 1, B: 1, R: 1 }], [b, { A: 20, B: 21, R: 1 }], [d, { A: 1, B: 1, R: 1 }], [c, { A: 1, B: 1, R: 1 }]]);
    s.incidents = [{ kind: "new_conflict", atTick: 3, resourceKey: "X", unitIdA: a, unitIdB: b }, { kind: "stop_confirmed", atTick: 4, unitId: b }, { kind: "stop_confirmed", atTick: 8, unitId: a }];
    const r = runScenario(s);
    expect(r.trace.some(e => e.unitId === a && e.ev === "unit_state" && e.to === "VALIDATING" && e.t === 2)).toBe(true);
    expect(at(r, c).dispatchTick).toBe(8); expect(at(r, a).commitLevel).toBeNull(); noCreditLoss(r);
  });

  test("les anciens callbacks ne libèrent pas la génération retry récente", () => {
    const { s, a, b, d, c } = inventory();
    s.config.externalClaims = [{ familyId: "old", resourceKeys: ["X"], stoppedAtTick: 2 }];
    s.durations = new Map(s.plan.units.map(u => [u.unitId, u.unitId === c ? { A: 1, B: 1, R: 1 } : { A: 10, B: 11, R: 1 }]));
    s.incidents = [{ kind: "new_conflict", atTick: 1, resourceKey: "X", unitIdA: a, unitIdB: b }, { kind: "new_conflict", atTick: 1, resourceKey: "X", unitIdA: b, unitIdB: d },
      { kind: "stop_confirmed", atTick: 2, unitId: a, retry: true }, { kind: "stop_confirmed", atTick: 3, unitId: b }, { kind: "stop_confirmed", atTick: 4, unitId: d }];
    const r = runScenario(s), second = r.decisions.find(x => x.unitId === a && x.attempt === 2)!;
    expect(second.t).toBe(7); expect(second.token).toBe(2);
    expect(r.trace.some(e => e.ev === "late_event_ignored" && e.unitId === a && e.token === 1 && e.currentToken === 2)).toBe(true);
    expect(r.trace.filter(e => e.ev === "execution_released" && e.unitId === a && e.token === 2).every(e => e.t >= 17)).toBe(true);
    noCreditLoss(r);
  });

  test("claims externes homonymes/chevauchants restent inventaire diagnostiqué, sans écrasement", () => {
    const g = independent([0]), p = policy(g), id = exported(g, p).units[0]!.unitId;
    conflicts(p, g.nodes[0]!.id, ["X", "Y"]);
    for (const finalStop of [7, undefined]) {
      const s = simulated(exported(g, p));
      s.config.externalClaims = [{ familyId: "same", resourceKeys: ["X", "X"], stoppedAtTick: 2 },
        { familyId: "same", resourceKeys: ["X", "Y"], stoppedAtTick: 5 }, { familyId: "third", resourceKeys: ["X"], stoppedAtTick: finalStop }];
      s.incidents = [bulletin(id, 9)];
      const r = runScenario(s); expect(at(r, id).dispatchTick).toBe(finalStop ?? null);
      expect(r.diagnostics.some(d => d.code === "overlapping_external_claims")).toBe(true);
      expect(r.trace.filter(e => e.ev === "external_family_stop_confirmed").map(e => e.claimIndex)).toEqual(finalStop ? [0, 1, 2] : [0, 1]);
      if (!finalStop) { expect(r.metrics.waits.conflict).toBe(9); expect(r.decisions).toEqual([]); }
    }
  });

  test("un overlap direct X ne ferme pas transitivement le voisin Y", () => {
    const g = independent([0, 1, 2]), p = policy(g), [a, b, c] = ordered(exported(g, p));
    conflicts(p, a!.ownedFunctionIds[0]!, ["X"]); conflicts(p, b!.ownedFunctionIds[0]!, ["Y"]); conflicts(p, c!.ownedFunctionIds[0]!, ["Y"]);
    const s = simulated(exported(g, p));
    s.durations = new Map(s.plan.units.map(u => [u.unitId, u.unitId === c!.unitId ? { A: 1, B: 1, R: 1 } : { A: 20, B: 21, R: 1 }]));
    s.incidents = [{ kind: "new_conflict", atTick: 1, resourceKey: "X", unitIdA: a!.unitId, unitIdB: b!.unitId },
      { kind: "stop_confirmed", atTick: 4, unitId: b!.unitId }, { kind: "stop_confirmed", atTick: 6, unitId: a!.unitId }];
    const r = runScenario(s); expect(at(r, c!.unitId).dispatchTick).toBe(4); expect(at(r, c!.unitId).state).toBe("COMMITTED");
    expect(r.trace.some(e => e.ev === "unit_state" && e.unitId === c!.unitId && e.to === "STOP_PENDING")).toBe(false);
  });
});

describe("receipts externes : force/niveau, cohérence puis binding", () => {
  function linked() { return graph(g => { g.edges = g.edges.slice(0, 1); }, "cycles-recursion"); }
  function receipt(p: PlannerPolicy, destination: string, change: Partial<ArtifactReceipt> = {}): ArtifactReceipt {
    const { minimumRevision, maximumRevision: _maximum, ...q } = p.requirementsByFunction[destination]!;
    return { ...q, knowledgeRevision: minimumRevision, producerUnitId: null, commitId: hash("external-fixture-receipt"),
      readbackStatus: "verified", futurePrerequisiteEffect: "satisfies", ...change };
  }
  function external(g: GraphSnapshotV1, p: PlannerPolicy, r: ArtifactReceipt): PlannerResult {
    const edge = g.edges[0]!; p.edgeKinds = { [edge.id]: "external_satisfied" }; p.externalReceiptsByEdge = { [edge.id]: r };
    return exported(g, p);
  }

  test("différentiel L5 sur niveaux/validations cohérents, y compris strictement plus forts", () => {
    const g = linked(), destination = g.edges[0]!.destinationId;
    const coherent = [{ publicationLevel: 1, validation: "fixture-only" }, { publicationLevel: 1, validation: "parent-validated" },
      { publicationLevel: 2, validation: "parent-validated" }] as const;
    for (const required of coherent) for (const supplied of coherent) {
      const p = policy(g); Object.assign(p.requirementsByFunction[destination]!, required);
      const r = receipt(p, destination, supplied), satisfies = receiptSatisfies(p.requirementsByFunction[destination]!, r, null);
      const e = external(g, p, r), plan = simPlanFromExport(e), pre = plan.units.flatMap(u => u.prerequisites)[0]!;
      expect(pre.kind).toBe(satisfies ? "external_satisfied" : "unknown_unresolved");
      expect(validateSimPlan(plan)).toEqual([]);
      if (satisfies) { expect(pre.externalReceipt).toEqual(r); expect(pre.requirement).toEqual(p.requirementsByFunction[destination]!); }
      else expect(pre.externalReceipt).toBeUndefined();
    }
    // These are offline input records only: no native level2 publication is run.
  });

  test("chaque champ de receipt invalide/pending/invalidation reste non satisfaisant", () => {
    const g = linked(), destination = g.edges[0]!.destinationId, p = policy(g), good = receipt(p, destination, { validation: "parent-validated" });
    const e = external(g, p, good), base = simPlanFromExport(e), q = p.requirementsByFunction[destination]!;
    const changes: Partial<ArtifactReceipt>[] = [
      { artifactId: "other" }, { artifactSha256: hash("other") }, { functionId: g.edges[0]!.sourceId }, { moduleSha256: hash("other") },
      { artifactKind: "structural_fact" }, { producerUnitId: "another-family" }, { commitId: "not-sha" },
      { readbackStatus: "pending" }, { readbackStatus: "mismatch" }, { futurePrerequisiteEffect: "does_not_satisfy" },
      { futurePrerequisiteEffect: "invalidates_future" }, { knowledgeRevision: q.minimumRevision - 1 },
      { knowledgeRevision: q.maximumRevision + 1 }, { knowledgeRevision: 1.5 }, { publicationLevel: 3 as 1 },
    ];
    for (const change of changes) {
      const bad = { ...good, ...change }; expect(receiptSatisfies(q, bad, null)).toBe(false);
      const plan = structuredClone(base), pre = plan.units.flatMap(u => u.prerequisites)[0]!;
      pre.externalReceipt = bad; plan.source!.externalReceipts[pre.id!] = structuredClone(bad);
      expect(validateSimPlan(plan).some(d => d.code === "external_receipt_mismatch")).toBe(true);
      expect(() => new SimEngine({ ...scenario([]), plan })).toThrow("plan_non_conformant");
    }
    expect(e.sidecar.externalReceiptById[e.plan.prerequisites[0]!.id]).toEqual(good);
  });

  test("contradiction upstream OPEN : L5 true pour level2/fixture-only, SIM refuse explicitement", () => {
    const g = linked(), destination = g.edges[0]!.destinationId, p = policy(g);
    const contradictory = receipt(p, destination, { publicationLevel: 2, validation: "fixture-only" });
    expect(receiptSatisfies(p.requirementsByFunction[destination]!, contradictory, null)).toBe(true);
    const e = external(g, p, contradictory), plan = simPlanFromExport(e), before = canonical(e);
    expect(e.plan.prerequisites[0]!.kind).toBe("external_satisfied"); expect(e.diagnostics).toEqual([]);
    expect(validateSimPlan(plan).some(d => d.code === "external_receipt_level_validation_conflict")).toBe(true);
    expect(() => new SimEngine({ ...scenario([]), plan })).toThrow("plan_non_conformant");
    expect(canonical(e)).toBe(before); expect(plan.units.flatMap(u => u.prerequisites)[0]!.externalReceipt).toEqual(contradictory);
  });

  test("le binding externe refuse un besoin affaibli même si le receipt pourrait le satisfaire", () => {
    const g = linked(), destination = g.edges[0]!.destinationId, p = policy(g);
    p.requirementsByFunction[destination]!.validation = "parent-validated";
    const good = receipt(p, destination, { publicationLevel: 2 }), base = simPlanFromExport(external(g, p, good));
    for (const change of [{ validation: "fixture-only" as const }, { maximumRevision: 10000 }, { publicationLevel: 2 as const }]) {
      const plan = structuredClone(base), pre = plan.units.flatMap(u => u.prerequisites)[0]!;
      Object.assign(pre.requirement!, change); expect(receiptSatisfies(pre.requirement!, good, null)).toBe(true);
      expect(validateSimPlan(plan).some(d => d.code === "prerequisite_requirement_mismatch")).toBe(true);
    }
  });

  test("obligation locale altérée : producteur avance, consommateur jamais satisfait, source intacte", () => {
    const g = linked(), s = simulated(exported(g)), plan = structuredClone(s.plan);
    const consumer = plan.units.find(u => u.prerequisites.length)!, producer = consumer.prerequisites[0]!.producerUnitId!;
    const source = canonical(plan.source); consumer.prerequisites[0]!.requirement!.artifactSha256 = "0".repeat(64);
    expect(validateSimPlan(plan)).toEqual([]);
    const r = runScenario({ ...s, plan });
    expect(at(r, producer).state).toBe("COMMITTED"); expect(at(r, consumer.unitId).state).toBe("BLOCKED");
    expect(r.store.getCommit(consumer.unitId)).toBeUndefined(); expect(canonical(plan.source)).toBe(source);
    expect(consumer.prerequisites[0]!.requirement!.artifactSha256).toBe("0".repeat(64));
  });
});

describe("unresolved : provenance du record exporté, pas citation inventée", () => {
  test("vrai L2 indirect-uncertain → L5 conserve ID et unknown/null sans call", () => {
    const g = graph(() => {}, "indirect-uncertain"), e = exported(g), s = simulated(e), plan = s.plan;
    const u = plan.units.find(u => u.prerequisites.some(p => p.provenance))!, p = u.prerequisites.find(p => p.provenance)!;
    const raw = g.unresolved.find(r => r.kind !== "data_xref" && u.ownedFunctionIds.includes(r.fromFunctionId))!;
    expect(p.id).toBe(`pre:${fingerprint({ ref: raw.id, unitId: u.unitId })}`);
    expect(p.kind).toBe("unknown_unresolved"); expect(p.producerUnitId).toBeNull();
    expect(p.provenance).toEqual({ version: 1, kind: "exported-unresolved-prerequisite", prerequisiteId: p.id!, consumerUnitId: u.unitId,
      snapshotFingerprint: e.sidecar.snapshotFingerprint, unitFingerprint: e.sidecar.unitFingerprints[u.unitId] });
    expect(p.relationId).toBeUndefined(); expect(p.callSourceFunctionId).toBeUndefined(); expect(p.externalReceipt).toBeUndefined();
    expect(validateSimPlan(plan)).toEqual([]); expect(e.diagnostics).toEqual([]);
    expect(runScenario(s).metrics.outcome).toBe("complete");
    // These hashes bind the supplied export only; the DTO has no fabricated raw ref.
    expect("rawRefId" in p.provenance!).toBe(false);
  });

  test("ID/consumer/type/citation/requirement/FP altérés et anciennes preuves absentes échouent fermés", () => {
    const g = graph(() => {}, "indirect-uncertain"), base = simPlanFromExport(exported(g));
    const requirement = policy(g).requirementsByFunction[g.nodes[0]!.id]!;
    const mutations: Array<(p: SimPlanInput) => void> = [
      p => { p.units[0]!.prerequisites[0]!.id = "pre:wrong"; },
      p => { p.units[0]!.prerequisites[0]!.provenance!.prerequisiteId = "pre:wrong"; },
      p => { p.units[0]!.prerequisites[0]!.provenance!.consumerUnitId = "other"; },
      p => { p.units[0]!.prerequisites[0]!.provenance!.version = 2 as 1; },
      p => { p.units[0]!.prerequisites[0]!.kind = "external_satisfied"; },
      p => { p.units[0]!.prerequisites[0]!.artifactKind = "validated_knowledge"; },
      p => { p.units[0]!.prerequisites[0]!.requiredPublicationLevel = 2; },
      p => { p.units[0]!.prerequisites[0]!.producerUnitId = p.units[0]!.unitId; },
      p => { p.units[0]!.prerequisites[0]!.callSourceFunctionId = p.units[0]!.ownedFunctionIds[0]; },
      p => { p.units[0]!.prerequisites[0]!.relationId = "relation:invented"; },
      p => { p.units[0]!.prerequisites[0]!.requirement = requirement; },
      p => { p.units[0]!.prerequisites[0]!.provenance!.snapshotFingerprint = hash("altered"); },
      p => { p.units[0]!.prerequisites[0]!.provenance!.unitFingerprint = hash("altered"); },
      p => { p.source!.prerequisiteEvidence!.unitFingerprints[p.units[0]!.unitId] = hash("altered"); },
      p => { p.source!.prerequisiteEvidence!.snapshotFingerprint = hash("altered"); },
      p => { p.source!.prerequisiteEvidence!.planFingerprint = hash("altered"); },
      p => { delete p.units[0]!.prerequisites[0]!.provenance; },
      p => { delete p.source!.prerequisiteEvidence; },
      p => { p.source!.prerequisiteEvidence = { version: 2 } as never; },
      p => { p.source!.prerequisiteEvidence = { version: 1 } as never; },
    ];
    for (const mutate of mutations) {
      const plan = structuredClone(base); mutate(plan); expect(validateSimPlan(plan).length).toBeGreaterThan(0);
      expect(() => new SimEngine({ ...scenario([]), plan })).toThrow("plan_non_conformant");
    }
    const old = structuredClone(base); delete old.source!.prerequisiteEvidence;
    expect(validateSimPlan(old).some(d => d.code === "unsupported_prerequisite_provenance")).toBe(true);
    expect(old.source!.prerequisiteEvidence).toBeUndefined();
  });

  test("un unknown provenant d'une vraie relation perdant sa citation reste refusé", () => {
    const g = graph(g => { g.edges = g.edges.slice(0, 1); }, "cycles-recursion"), p = policy(g);
    p.edgeKinds = { [g.edges[0]!.id]: "external_satisfied" };
    const plan = structuredClone(simPlanFromExport(exported(g, p))), pre = plan.units.flatMap(u => u.prerequisites)[0]!;
    expect(pre.kind).toBe("unknown_unresolved"); expect(pre.producerUnitId).toBeNull(); expect(pre.provenance).toBeUndefined();
    expect(validateSimPlan(plan)).toEqual([]);
    delete pre.relationId; delete pre.callSourceFunctionId; delete pre.callDestinationFunctionId;
    expect(validateSimPlan(plan).some(d => d.code === "prerequisite_citation_mismatch")).toBe(true);
  });
});

describe("observation détachée et intervalles ouverts", () => {
  function observeAt(s: SimScenario, id: string, tick: number) {
    s.config.heartbeatEvery = 0; s.config.leaseTicks = 100;
    s.incidents = [...(s.incidents ?? []), bulletin(id, tick)];
    const engine = new SimEngine(s); engine.runUntil(tick); return { engine, observation: engine.observe() };
  }
  test("le cas ouvert réel compte8 ; observer ne mutile ni état ni futur replay", () => {
    const g = independent([0]), p = policy(g); conflicts(p, g.nodes[0]!.id, ["X"]);
    const s = simulated(exported(g, p)), id = s.plan.units[0]!.unitId;
    s.config.externalClaims = [{ familyId: "old", resourceKeys: ["X"], stoppedAtTick: 10 }]; s.incidents = [bulletin(id, 4), bulletin(id, 8)];
    const engine = new SimEngine(s); engine.runUntil(3); expect(engine.observe().metrics.observationEndTick).toBe(0);
    engine.runUntil(8); const obs = engine.observe(), before = canonical(obs);
    expect(obs.version).toBe(1); expect("store" in obs).toBe(false); expect(obs.metrics.waits.conflict).toBe(8); expect(at(obs, id).waitTicks).toBe(8);
    expect(Object.isFrozen(obs)).toBe(true); expect(Object.isFrozen(obs.metrics.waits)).toBe(true); expect(Object.isFrozen(obs.trace[0])).toBe(true);
    expect(() => { obs.metrics.waits.conflict = 999; }).toThrow(); expect(() => obs.trace.push({ t: 99, seq: 99, ev: "forged" })).toThrow();
    const copy = structuredClone(obs); copy.metrics.waits.conflict = 111; copy.units[0]!.state = "COMMITTED";
    expect(canonical(engine.observe())).toBe(before);
    const result = engine.run(), control = runScenario(s);
    expect(result.traceHash).toBe(control.traceHash); expect(result.metrics).toEqual(control.metrics); expect(result.decisions).toEqual(control.decisions);
    expect(canonical(obs)).toBe(before); expect(result.metrics.waits.conflict).toBe(10);
    expect(engine.observe().metrics).toEqual(result.metrics);
  });

  test("additivité par unité : dependency/resource/quota et fermeture à l'annulation", () => {
    const dependent = scenario(["P", "C"], [["C", "P"]], 0);
    const { observation: both } = observeAt(dependent, "C", 8);
    expect(both.metrics.waits.dependency).toBe(8); expect(both.metrics.waits.resource).toBe(8);
    expect(both.units.reduce((n, u) => n + u.waitTicks, 0)).toBe(16);
    dependent.incidents = [{ kind: "cancel", atTick: 3, unitId: "C" }];
    const { observation: cancelled } = observeAt(dependent, "C", 8);
    expect(cancelled.metrics.waits.dependency).toBe(3); expect(at(cancelled, "C").waitReason).toBeNull(); expect(at(cancelled, "C").waitTicks).toBe(3);
    const quota = scenario(["A"], [], 1); quota.config.accountQuotas = { shared: 0 };
    expect(observeAt(quota, "A", 8).observation.metrics.waits.quota).toBe(8);
  });

  test("barrier/pause/validation ouvertes et changements de raison", () => {
    const barrier = scenario(["A", "B"], [], 4); barrier.config.policy = "fixed_groups"; barrier.config.groupSize = 1; barrier.durations = { A: 10, B: 10, R: 1 };
    expect(observeAt(barrier, "B", 3).observation.metrics.waits.barrier).toBe(3);
    const paused = scenario(["A"]); paused.incidents = [{ kind: "pause", fromTick: 0, toTick: 8 }];
    expect(observeAt(paused, "A", 4).observation.metrics.waits.paused).toBe(4);
    const validating = scenario(["A"]); validating.durations = { A: 1, B: 1, R: 1 }; validating.config.validationTicks = 5;
    expect(observeAt(validating, "A", 5).observation.metrics.waits.validation).toBe(3);
    const changing = scenario(["A", "B"], [], 1); changing.plan.units[0]!.conflicts = [{ resourceKey: "X" }];
    changing.config.externalClaims = [{ familyId: "old", resourceKeys: ["X"], stoppedAtTick: 3 }]; changing.durations = { A: 5, B: 5, R: 1 };
    const { observation } = observeAt(changing, "A", 6);
    expect(observation.metrics.waits.conflict).toBe(3); expect(at(observation, "A").waitTicks).toBe(6); expect(at(observation, "A").waitReason).toBe("resource");
    expect(observation.metrics.waits.resource).toBe(8);
  });

  test("observations intercalées pendant fin tardive/fence restent sans effet", () => {
    const s = scenario(["A", "B"], [], 4); s.durations = { A: 1, B: 1, R: 1 }; s.config.heartbeatEvery = 0; s.config.leaseTicks = 100;
    s.plan.units.forEach(u => { u.conflicts = [{ resourceKey: "X" }]; });
    s.incidents = [{ kind: "late_result", unitId: "A", delayTicks: 10 }, { kind: "ambiguous_stop", atTick: 3, unitId: "A", confirmWindow: 1 },
      ...[4, 6, 8, 10].map(t => bulletin("B", t))];
    const engine = new SimEngine(s), snapshots: Array<[SimObservation, string]> = [];
    for (let t = 0; t <= 15; t++) { engine.runUntil(t); const o = engine.observe(); expect(engine.observe()).toEqual(o); snapshots.push([o, canonical(o)]); }
    const result = engine.run(), control = runScenario(s);
    expect(result.traceHash).toBe(control.traceHash); expect(result.metrics).toEqual(control.metrics);
    for (const [snapshot, old] of snapshots) expect(canonical(snapshot)).toBe(old);
    expect(at(result, "B").dispatchTick).toBe(12); expect(result.metrics.occupiedWorkerTicks).toBeGreaterThan(result.metrics.usefulWorkerTicks);
  });
});
