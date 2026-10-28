import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canonical, fingerprint, hash } from "../src/validation";
import { assertSnapshotContract, fingerprintWithout, type GraphSnapshotV1 } from "../src/graph";
import { buildGraphSnapshot, type GraphParts } from "../src/graph-normalize";
import { compareFunctionIds, stronglyConnectedComponents, topologicalOrder, type DirectedEdge } from "../src/scc";
import { canonicalOwnershipKey, canonicalRelationKey, compareGranularities, evaluateReadiness, pipelineCost, planMission, rankUnits, readySubIntents, receiptSatisfies,
  selectCompatible, selectReadyUnits, unitsConflict, type ArtifactReceipt, type ArtifactRequirement, type PlannerGraphInput,
  type PlannerGroupInput, type PlannerPolicy, type PlannerResult, type PlannerSite, type ResourceRequirement, type WorkUnit } from "../src/planner";

const MODULE = hash("planner-test-module"), ROOT = join(import.meta.dir, "fixtures/graph");
const RESOURCES: ResourceRequirement = { profiles: ["build"], models: ["offline"], tools: ["cpu"], accounts: ["shared"], slots: 1, cpu: 1, gpu: 0, budget: 1 };
const worker = (n: number, accountId = "shared") => ({ workerId: `worker:${n}`, profile: "build", model: "offline", tools: ["cpu"], accountId, slots: 1, cpu: 1, gpu: 0, budget: 100, available: true });
function fn(n: number): string { return `${MODULE}:0x${(n + 1).toString(16).toUpperCase()}`; }
function graph(count: number, calls: [number, number][]): PlannerGraphInput {
  return { schemaVersion: 1, snapshotId: "snapshot:test", missionId: "mission:test", normalizedFingerprint: hash("snapshot"), knowledgeRevision: 2,
    binaryArtifacts: [{ contentSha256: MODULE, versionLabel: "fixture-v1", imageBase: "0x400000" }],
    nodes: Array.from({ length: count }, (_, n) => ({ id: fn(n), moduleSha256: MODULE, rva: fn(n).split(":")[1]!, ea: `0x${(0x400001 + n).toString(16).toUpperCase()}`,
      imageBase: "0x400000", functionClass: "internal", status: "observed" })),
    edges: calls.map(([a, b], i) => ({ id: `edge:${i}`, sourceId: fn(a), destinationId: fn(b), kind: "direct_call", status: "observed", schedulerRelevance: "may_block", retiredInRevision: null })),
    unresolved: [], coverage: { status: "complete", selfLoopsPreserved: true, tailsIterated: true } };
}
function requirement(g: PlannerGraphInput, functionId: string): ArtifactRequirement {
  return { functionId, moduleSha256: functionId.slice(0, functionId.lastIndexOf(":")),
    artifactId: `artifact:${functionId}`, artifactSha256: hash(`C:${functionId}`), artifactKind: "reconciled_c",
    minimumRevision: g.knowledgeRevision + 1, maximumRevision: g.knowledgeRevision + 10, publicationLevel: 1, validation: "fixture-only" };
}
function policy(g: PlannerGraphInput): PlannerPolicy {
  return { version: "planner-test-v1", estimationVersion: "estimates-v1", partitionId: "partition:test", investigationKind: "decompilation",
    artifactKind: "reconciled_c", publicationLevel: 1, contextEnvelopeMaxUtf8Bytes: 100_000_000, totalContextBudgetUtf8Bytes: 1_000_000_000,
    maxSelectedUnits: 100_000, sccMaxFunctions: 100_000, sccMaxIterations: 2, sccCostBudget: 100_000_000,
    requirementsByFunction: Object.fromEntries(g.nodes.map(n => [n.id, requirement(g, n.id)])),
    estimatesByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { version: "estimates-v1", A: 3, B: 5, R: 2, validation: 1,
      byModel: { offline: { A: 2, B: 4, R: 1, validation: 1 } } }])),
    resourcesByFunction: Object.fromEntries(g.nodes.map(n => [n.id, structuredClone(RESOURCES)])) };
}
function groups(g: PlannerGraphInput, selected = g.nodes.map(n => n.id)): PlannerGroupInput[] {
  return selected.map(id => ({ groupId: `group:${id}`, partitionId: "partition:test", ownedFunctionIds: [id], contextFunctionIds: [] }));
}
function build(g: PlannerGraphInput, p = policy(g), gs = groups(g)): PlannerResult { return planMission(g, gs, p); }
function unit(r: PlannerResult, functionId: string): WorkUnit { return r.units.find(u => u.ownedFunctionIds.includes(functionId))!; }
function receipt(r: ArtifactRequirement, producerUnitId: string | null): ArtifactReceipt {
  const { minimumRevision, maximumRevision: _max, ...artifact } = r;
  return { ...artifact, knowledgeRevision: minimumRevision, producerUnitId, commitId: hash(`commit:${r.artifactId}`), readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
}
function ready(r: PlannerResult, u: WorkUnit, receipts: ArtifactReceipt[] = []) {
  return evaluateReadiness({ plan: r.plan, sidecar: r.sidecar, expectedSidecarFingerprint: r.binding.sidecarFingerprint, unit: u, receipts,
    snapshotFingerprint: r.sidecar.snapshotFingerprint, knowledgeRevision: r.plan.knowledgeRevision, validContext: true, cancelled: false });
}
function ranks(r: PlannerResult, kind: "fifo" | "depth" | "critical_path" | "critical_path_influence" | "heft_like" = "critical_path") {
  return rankUnits(r, { readyAtEvent: Object.fromEntries(r.units.map(u => [u.unitId, 0])), aging: { eventNumber: 1, quantum: 100, version: "aging-v1" }, policy: kind });
}
function fixture(name: string): PlannerGraphInput { return JSON.parse(readFileSync(join(ROOT, name, "content.json"), "utf8")); }

/** Independent oracle: repeated breadth-first reachability, not DFS lowlinks. */
function reachable(ids: string[], edges: DirectedEdge[], start: string): Set<string> {
  const seen = new Set([start]), todo = [start];
  for (let i = 0; i < todo.length; i++) for (const e of edges) if (e.from === todo[i] && !seen.has(e.to)) { seen.add(e.to); todo.push(e.to); }
  return seen;
}
function oracleComponents(ids: string[], edges: DirectedEdge[]): string[][] {
  const reach = new Map(ids.map(id => [id, reachable(ids, edges, id)]));
  const unused = new Set(ids), components: string[][] = [];
  for (const id of ids) if (unused.has(id)) {
    const members = ids.filter(other => reach.get(id)!.has(other) && reach.get(other)!.has(id));
    for (const other of members) unused.delete(other); components.push(members.sort(compareFunctionIds));
  }
  return components.sort((a, b) => compareFunctionIds(a[0]!, b[0]!));
}
function validateSchema(value: any, schema: any, path = "$" ): void {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual = value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value;
  expect(types.includes(actual) || (actual === "integer" && types.includes("number")), `${path} type`).toBe(true);
  if (schema.enum) expect(schema.enum.includes(value), `${path} enum`).toBe(true);
  if (value && actual === "object") {
    for (const key of schema.required ?? []) expect(Object.hasOwn(value, key), `${path}.${key} required`).toBe(true);
    for (const [key, item] of Object.entries(value)) { expect(Object.hasOwn(schema.properties, key), `${path}.${key} unexpected`).toBe(true); validateSchema(item, schema.properties[key], `${path}.${key}`); }
  }
  if (actual === "array") value.forEach((v: any, i: number) => validateSchema(v, schema.items, `${path}[${i}]`));
}

describe("iterative SCC + condensation", () => {
  test("empty, isolate, numeric ordering and nontrivial singleton self-loop", () => {
    expect(stronglyConnectedComponents([], []).sccs).toEqual([]);
    const ids = [fn(15), fn(1), fn(0)], c = stronglyConnectedComponents(ids, [{ from: fn(1), to: fn(1) }]);
    expect(c.sccs.map(s => s.functionIds[0])).toEqual([fn(0), fn(1), fn(15)]);
    expect(c.sccs[1]).toMatchObject({ exclusive: true, hasSelfLoop: true, selfLoopPreserved: true });
  });
  test("10k chain and 10k cycle, no recursive stack overflow", () => {
    const ids = Array.from({ length: 10_000 }, (_, i) => fn(i));
    const edges = ids.slice(1).map((id, i) => ({ from: ids[i]!, to: id }));
    const chain = stronglyConnectedComponents(ids, edges);
    expect(chain.sccs.length).toBe(10_000); expect(chain.edges.length).toBe(9999); expect(chain.topologicalOrder.length).toBe(10_000);
    const cycle = stronglyConnectedComponents(ids, [...edges, { from: ids.at(-1)!, to: ids[0]! }]);
    expect(cycle.sccs.length).toBe(1); expect(cycle.sccs[0]!.functionIds.length).toBe(10_000);
  });
  test("all directed graphs on three nodes agree with reachability oracle (512)", () => {
    const ids = [fn(0), fn(1), fn(2)];
    for (let mask = 0; mask < 512; mask++) {
      const edges: DirectedEdge[] = [];
      for (let i = 0; i < 9; i++) if (mask & (1 << i)) edges.push({ from: ids[Math.floor(i / 3)]!, to: ids[i % 3]! });
      const c = stronglyConnectedComponents(ids, edges);
      expect(c.sccs.map(s => s.functionIds)).toEqual(oracleComponents(ids, edges));
      const topo = new Map(c.topologicalOrder.map((id, i) => [id, i]));
      for (const e of c.edges) expect(topo.get(e.from)!).toBeLessThan(topo.get(e.to)!);
      const reordered = stronglyConnectedComponents([...ids].reverse(), [...edges].reverse());
      expect(reordered.sccs).toEqual(c.sccs); expect(reordered.edges).toEqual(c.edges);
    }
  });
  test("missing endpoints, duplicate IDs, artificial DAG cycles reject", () => {
    expect(() => stronglyConnectedComponents([fn(0)], [{ from: fn(0), to: fn(1) }])).toThrow("missing endpoint");
    expect(() => stronglyConnectedComponents([fn(0), fn(0)], [])).toThrow("duplicate");
    expect(() => topologicalOrder(["A", "B"], [{ from: "A", to: "B" }, { from: "B", to: "A" }])).toThrow("cycle");
  });
});

describe("G1 closure, WorkUnit families and budget", () => {
  test("caller A -> B/C and B -> D/E unblocks without unrelated F", () => {
    const g = graph(6, [[0, 1], [0, 2], [1, 3], [1, 4]]), r = build(g);
    const B = unit(r, fn(1)), D = unit(r, fn(3)), E = unit(r, fn(4)), F = unit(r, fn(5));
    const receipts = [receipt(r.sidecar.policy.requirementsByFunction[fn(3)]!, D.unitId), receipt(r.sidecar.policy.requirementsByFunction[fn(4)]!, E.unitId)];
    expect(ready(r, B).ready).toBe(false); expect(ready(r, B, receipts).ready).toBe(true);
    expect(B.prerequisites.some(p => p.producerUnitId === F.unitId)).toBe(false);
    const edge = r.plan.g1Edges.find(e => e.callSourceFunctionId === fn(1) && e.callDestinationFunctionId === fn(3))!;
    expect(edge.fromUnitId).toBe(D.unitId); expect(edge.toUnitId).toBe(B.unitId);
  });
  test("mandatory callee outside requested groups is added before budget selection", () => {
    const g = graph(3, [[0, 1], [1, 2]]), r = build(g, policy(g), groups(g, [fn(0)]));
    expect(r.units.length).toBe(3); expect(r.plan.selectedUnitIds.length).toBe(3);
  });
  test("budget never includes caller without obligatory closure; defers consumer", () => {
    const g = graph(2, [[0, 1]]), p = policy(g); p.maxSelectedUnits = 1;
    const r = build(g, p); expect(r.plan.selectedUnitIds).toEqual([unit(r, fn(1)).unitId]);
    expect(r.plan.decisions.find(d => d.unitId === unit(r, fn(0)).unitId)!.action).toBe("exclude_budget");
    const onlyRoot = build(g, p, groups(g, [fn(0)])); expect(onlyRoot.plan.selectedUnitIds).toEqual([]);
  });
  test("UTF8 envelope includes Unicode metadata, exact byte boundary", () => {
    const g = graph(1, []), p = policy(g); p.partitionId = "partition:関数-café";
    const gs = groups(g); gs[0]!.partitionId = p.partitionId;
    const r = build(g, p, gs), id = r.units[0]!.unitId, n = r.sidecar.envelopeBytesByUnit[id]!;
    p.contextEnvelopeMaxUtf8Bytes = n; expect(build(g, p, gs).plan.selectedUnitIds).toEqual([id]);
    p.contextEnvelopeMaxUtf8Bytes = n - 1; expect(build(g, p, gs).plan.selectedUnitIds).toEqual([]);
    expect(Buffer.byteLength("関数-café", "utf8")).toBeGreaterThan("関数-café".length);
  });
  test("all output v1 documents conform to strict L1 schemas", () => {
    const r = build(graph(3, [[0, 1], [1, 2]]));
    const root = join(import.meta.dir, "../schemas");
    validateSchema(r.plan, JSON.parse(readFileSync(join(root, "mission-plan-v1.schema.json"), "utf8")));
    for (const u of r.units) validateSchema(u, JSON.parse(readFileSync(join(root, "work-unit-v1.schema.json"), "utf8")));
  });
  test("artificial quotient cycle is separated, no fake SCC", () => {
    const g = graph(3, [[2, 1], [1, 0]]), gs = groups(g, []);
    gs.push({ groupId: "bad-merge", partitionId: "partition:test", ownedFunctionIds: [fn(0), fn(2)], contextFunctionIds: [] },
      { groupId: "middle", partitionId: "partition:test", ownedFunctionIds: [fn(1)], contextFunctionIds: [] });
    const r = build(g, policy(g), gs); expect(r.units.length).toBe(3);
    expect(r.diagnostics.some(d => d.code === "artificial-quotient-cycle-separated")).toBe(true);
    expect(r.plan.sccs.every(s => !s.exclusive)).toBe(true);
  });
  test("valid family aggregates single-function intents; callee R gates caller A/B", () => {
    const g = graph(3, [[0, 1]]), gs = [{ groupId: "family", partitionId: "partition:test", ownedFunctionIds: [fn(0), fn(1)], contextFunctionIds: [fn(2)] }];
    const r = build(g, policy(g), gs), u = r.units[0]!;
    expect(u.ownedFunctionIds).toEqual([fn(0), fn(1)]); expect(u.subIntents.length).toBe(6);
    expect(u.subIntents.every(s => s.harnessIdentity.ea === g.nodes.find(n => n.id === s.functionId)!.ea && s.sharesFamilyLease && s.outputDisjoint)).toBe(true);
    expect(u.subIntents.some(s => s.functionId === fn(2))).toBe(false);
    const initial = readySubIntents(u); expect(initial.map(s => [s.functionId, s.role])).toEqual([[fn(1), "A"], [fn(1), "B"]]);
    const A = initial[0]!, B = initial[1]!;
    expect(readySubIntents(u, [A.subIntentId]).some(s => s.role === "R")).toBe(false);
    const R = readySubIntents(u, [A.subIntentId, B.subIntentId]).find(s => s.role === "R")!;
    expect(R.functionId).toBe(fn(1));
    expect(readySubIntents(u, [A.subIntentId, B.subIntentId, R.subIntentId]).map(s => s.role)).toEqual(["A", "B"]);
  });
  test("recursive SCC stays exclusive, sequential local functions, bounded whole-unit publication", () => {
    const g = graph(3, [[0, 1], [1, 0], [2, 0]]), r = build(g), u = unit(r, fn(0));
    expect(u.ownedFunctionIds).toEqual([fn(0), fn(1)]); expect(r.sidecar.localOrders[u.unitId]).toMatchObject({ recursive: true, maxIterations: 2, publication: "whole-unit-only" });
    expect(readySubIntents(u).length).toBe(2); expect(ready(r, unit(r, fn(2))).ready).toBe(false);
    const p = policy(g); p.sccMaxFunctions = 1;
    const oversized = build(g, p); expect(oversized.plan.selectedUnitIds).toEqual([]);
    expect(oversized.diagnostics.some(d => d.code === "scc-budget-bound")).toBe(true);
  });
  test("SCC cannot be absorbed into a proposed cluster", () => {
    const g = graph(3, [[0, 1], [1, 0]]), gs = [{ groupId: "all", partitionId: "partition:test", ownedFunctionIds: g.nodes.map(n => n.id), contextFunctionIds: [] }];
    const r = build(g, policy(g), gs); expect(r.units.length).toBe(2); expect(unit(r, fn(0)).ownedFunctionIds).toEqual([fn(0), fn(1)]);
  });
  test("optional G1 policy cannot erase a confirmed native recursion/self-loop", () => {
    const g = graph(2, [[0, 1], [1, 0], [0, 0]]), p = policy(g);
    p.edgeKinds = { "edge:0": "optional", "edge:1": "non_blocking", "edge:2": "optional" };
    const r = build(g, p); expect(r.units.length).toBe(1); expect(r.plan.sccs[0]).toMatchObject({ exclusive: true, hasSelfLoop: true });
  });
  test("partial ownership cannot hide a native SCC through optional edges or dispensations", () => {
    for (const mode of ["optional", "dispensed"] as const) {
      const g = graph(3, [[0, 1], [1, 0]]), p = policy(g);
      if (mode === "optional") p.edgeKinds = { "edge:0": "optional" };
      else p.dispensationsByEdge = { "edge:0": { reason: "fixture waiver", source: "parent-regression",
        sourceHash: hash("parent-scc-waiver"), policyVersion: p.version, knowledgeRevision: g.knowledgeRevision,
        validation: "fixture-only" } };
      const r = build(g, p, groups(g, [fn(0), fn(2)]));
      const partial = unit(r, fn(0)), independent = unit(r, fn(2));
      expect(r.diagnostics.some(d => d.code === "partial-native-scc" && d.unitId === partial.unitId
        && d.functionIds.includes(fn(1)))).toBe(true);
      expect(r.plan.selectedUnitIds).not.toContain(partial.unitId);
      expect(ready(r, partial).ready).toBe(false);
      expect(r.plan.selectedUnitIds).toContain(independent.unitId);
      expect(ready(r, independent).ready).toBe(true);
      expect(r.units.some(u => u.ownedFunctionIds.includes(fn(1)))).toBe(false);
    }
  });
  test("hypothesis/callback never blocks; tail_jump may_block reverses G1", () => {
    for (const name of ["ff8-data-callback-not-call", "ff8-chunks-tails", "cycles-recursion", "ff8-self-loop"]) {
      const g = fixture(name), r = build(g);
      if (name === "ff8-data-callback-not-call") { expect(r.plan.g1Edges).toEqual([]); expect(r.units.every(u => ready(r, u).ready)).toBe(true); }
      if (name === "ff8-chunks-tails") { expect(r.plan.g1Edges.length).toBe(1); expect(r.plan.g1Edges[0]!.callDestinationFunctionId).toBe(g.edges[0]!.destinationId); }
      if (name === "ff8-self-loop") expect(r.plan.sccs[0]).toMatchObject({ exclusive: true, hasSelfLoop: true });
      if (name === "cycles-recursion") expect(r.units.length).toBe(1);
    }
  });
  test("optional/unknown/unresolved/data objects create no implicit blocking", () => {
    const g = graph(4, [[0, 1], [0, 2], [0, 3]]), p = policy(g);
    p.edgeKinds = { "edge:0": "optional" };
    g.edges[1]!.status = "inferred"; g.edges[2]!.schedulerRelevance = "non_blocking";
    g.unresolved = [{ id: "indirect", fromFunctionId: fn(0), kind: "indirect_call" }, { id: "shared-data", fromFunctionId: fn(0), kind: "data_xref" }];
    const r = build(g, p), u = unit(r, fn(0));
    expect(u.prerequisites.map(p => p.kind).sort()).toEqual(["non_blocking", "optional", "unknown_unresolved", "unknown_unresolved"]);
    expect(ready(r, u).ready).toBe(true);
  });
  test("external satisfaction requires a verified matching receipt, else explicit unknown", () => {
    const g = graph(2, [[0, 1]]); g.nodes[1]!.functionClass = "external";
    const p = policy(g), gs = groups(g, [fn(0)]);
    let r = build(g, p, gs); expect(unit(r, fn(0)).prerequisites[0]!.kind).toBe("unknown_unresolved"); expect(ready(r, r.units[0]!).ready).toBe(true);
    p.externalReceiptsByEdge = { "edge:0": receipt(p.requirementsByFunction[fn(1)]!, null) };
    r = build(g, p, gs); expect(r.units[0]!.prerequisites[0]!.kind).toBe("external_satisfied"); expect(ready(r, r.units[0]!).ready).toBe(true);
  });
  test("quarantined mandatory callee defers consumer, never silently disappears", () => {
    const g = graph(2, [[0, 1]]); g.nodes[1]!.status = "quarantined";
    const r = build(g, policy(g), groups(g, [fn(0)])); expect(r.plan.selectedUnitIds).toEqual([]);
    expect(r.diagnostics.some(d => d.code === "inadmissible-obligatory-callee")).toBe(true);
  });
  test("retired/invalidated calls do not produce G1", () => {
    const g = graph(3, [[0, 1], [0, 2]]); g.edges[0]!.status = "invalidated"; g.edges[1]!.retiredInRevision = 2;
    const r = build(g); expect(r.plan.g1Edges).toEqual([]);
  });
  test("snapshot with stripped loops and historical diagnostic is rejected", () => {
    const g = graph(1, []); g.coverage.selfLoopsPreserved = false;
    expect(() => build(g)).toThrow("self-loops"); g.coverage.selfLoopsPreserved = true; g.coverage.status = "diagnostic";
    expect(() => build(g)).toThrow("historical diagnostic");
  });
  test("all 64 forward DAGs on four nodes satisfy closure under every unit budget", () => {
    const possibles: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    for (let mask = 0; mask < 64; mask++) for (let budget = 0; budget <= 4; budget++) {
      const g = graph(4, possibles.filter((_, i) => mask & (1 << i))), p = policy(g); p.maxSelectedUnits = budget;
      const r = build(g, p), selected = new Set(r.plan.selectedUnitIds);
      for (const id of selected) for (const pre of r.units.find(u => u.unitId === id)!.prerequisites)
        if (pre.kind === "obligatory" && !pre.dispensed) expect(selected.has(pre.producerUnitId!)).toBe(true);
      expect(selected.size).toBeLessThanOrEqual(budget);
    }
  });
  test("10k complete planner chain retains closure, bounded zero-budget selection, cost DAG", () => {
    const g = graph(10_000, Array.from({ length: 9999 }, (_, i) => [i, i + 1] as [number, number]));
    const p = policy(g), r = build(g, p);
    expect(r.units.length).toBe(10_000); expect(r.plan.selectedUnitIds.length).toBe(10_000);
    expect(ranks(r)[0]!.depth).toBe(9999); expect(ranks(r)[0]!.criticalPath).toBe(80_000);
    p.maxSelectedUnits = 0;
    expect(build(g, p).plan.selectedUnitIds).toEqual([]);
  }, 30_000);
  test("granularity ablation compares family admissions, context bytes and dependency count, not false scientific launch savings", () => {
    const g = graph(3, [[0, 1]]), gs = [{ groupId: "family", partitionId: "partition:test", ownedFunctionIds: [fn(0), fn(1)], contextFunctionIds: [fn(2)] }];
    const comparison = compareGranularities(g, gs, policy(g));
    expect(comparison.variants.map(v => v.familyAdmissions)).toEqual([2, 1]);
    expect(comparison.variants.map(v => v.scientificSubIntentCount)).toEqual([6, 6]);
    expect(comparison.variants.map(v => v.obligatoryDependencyCount)).toEqual([1, 0]);
  });
});

describe("versioned artifact/readback and immutable policy sidecars", () => {
  test("COMMITTED label alone not enough; hash/kind/identity/revision/level/validation/readback all match", () => {
    const g = graph(2, [[0, 1]]), r = build(g), A = unit(r, fn(0)), B = unit(r, fn(1)), req = r.sidecar.policy.requirementsByFunction[fn(1)]!;
    const good = receipt(req, B.unitId); expect(ready(r, A, [good]).ready).toBe(true);
    const variants: Partial<ArtifactReceipt>[] = [{ artifactSha256: hash("wrong") }, { artifactId: "wrong" }, { functionId: fn(0) },
      { moduleSha256: hash("wrong-module") }, { artifactKind: "semantic_description" }, { knowledgeRevision: req.minimumRevision - 1 },
      { knowledgeRevision: req.maximumRevision + 1 }, { readbackStatus: "pending" }, { readbackStatus: "mismatch" },
      { futurePrerequisiteEffect: "does_not_satisfy" }, { futurePrerequisiteEffect: "invalidates_future" }, { producerUnitId: A.unitId }, { commitId: "bulletin:R" }];
    for (const patch of variants) expect(ready(r, A, [{ ...good, ...patch }]).ready).toBe(false);
    const level2 = { ...req, publicationLevel: 2 as const, validation: "parent-validated" as const };
    expect(receiptSatisfies(level2, good, B.unitId)).toBe(false);
    expect(receiptSatisfies(level2, { ...good, publicationLevel: 2, validation: "parent-validated" }, B.unitId)).toBe(true);
  });
  test("absent/incoherent sidecars and obligation metadata fail closed", () => {
    const g = graph(2, [[0, 1]]), p = policy(g); delete p.requirementsByFunction[fn(1)];
    const r = build(g, p); expect(ready(r, unit(r, fn(0))).reasons.some(s => s.includes("requirement"))).toBe(true);
    const u = unit(r, fn(1));
    const input = { plan: r.plan, unit: u, receipts: [], expectedSidecarFingerprint: r.sidecar.fingerprint, snapshotFingerprint: g.normalizedFingerprint,
      knowledgeRevision: 2, validContext: true, cancelled: false };
    expect(evaluateReadiness(input).ready).toBe(false);
    const changed = structuredClone(r.sidecar); changed.policyVersion = "unapproved";
    expect(evaluateReadiness({ ...input, sidecar: changed }).ready).toBe(false);
    expect(ready(r, { ...u, ownedFunctionIds: [fn(0)] }).ready).toBe(false);
    expect(Object.isFrozen(r.sidecar.requirementById)).toBe(true); expect(Object.isFrozen(r.sidecar.policy)).toBe(true);
    expect(r.binding.sidecarFingerprint).toBe(r.sidecar.fingerprint);
  });
  test("a newer verified invalidation fences earlier satisfactory receipts, including external receipts", () => {
    const g = graph(2, [[0, 1]]), r = build(g), A = unit(r, fn(0)), B = unit(r, fn(1));
    const good = receipt(r.sidecar.policy.requirementsByFunction[fn(1)]!, B.unitId);
    const invalidation: ArtifactReceipt = { ...good, knowledgeRevision: good.knowledgeRevision + 1, commitId: hash("invalidation"), futurePrerequisiteEffect: "invalidates_future" };
    expect(ready(r, A, [good, invalidation]).ready).toBe(false);
    expect(ready(r, A, [invalidation, good]).ready).toBe(false);
    expect(ready(r, A, [good, { ...invalidation, readbackStatus: "pending" }]).ready).toBe(true);
    g.nodes[1]!.functionClass = "external";
    const p = policy(g); p.externalReceiptsByEdge = { "edge:0": { ...good, producerUnitId: null } };
    const external = build(g, p, groups(g, [fn(0)]));
    expect(ready(external, external.units[0]!, [invalidation]).ready).toBe(false);
  });
  test("state evolves separately from immutable identity, stale revision/context/cancel fail", () => {
    const g = graph(1, []), r = build(g), u = r.units[0]!;
    expect(ready(r, { ...u, state: "READY" }).ready).toBe(true);
    expect(ready(r, { ...u, state: "QUARANTINED" }).ready).toBe(false);
    const input = { plan: r.plan, sidecar: r.sidecar, unit: u, receipts: [], expectedSidecarFingerprint: r.sidecar.fingerprint,
      snapshotFingerprint: g.normalizedFingerprint, knowledgeRevision: 2, validContext: true, cancelled: false };
    for (const patch of [{ knowledgeRevision: 3 }, { snapshotFingerprint: hash("changed") }, { validContext: false }, { cancelled: true }])
      expect(evaluateReadiness({ ...input, ...patch }).ready).toBe(false);
  });
  test("motivated versioned validated dispense journaled; wrong version is no waiver", () => {
    const g = graph(2, [[0, 1]]), p = policy(g); p.maxSelectedUnits = 1;
    p.dispensationsByEdge = { "edge:0": { reason: "Offline structural contract sufficient", policyVersion: p.version, source: "lead-waiver:1", sourceHash: hash("waiver"), validation: "fixture-only", knowledgeRevision: 2 } };
    const r = build(g, p, groups(g, [fn(0)])); expect(r.plan.selectedUnitIds).toEqual([unit(r, fn(0)).unitId]);
    expect(ready(r, unit(r, fn(0))).ready).toBe(true); expect(r.plan.decisions.some(d => d.action === "dispense" && d.reason.includes(p.version))).toBe(true);
    p.dispensationsByEdge["edge:0"]!.policyVersion = "old";
    const invalid = build(g, p, groups(g, [fn(0)])); expect(invalid.plan.selectedUnitIds).toEqual([]);
  });
  test("plan and sidecar canonical hashes and repeated/permuted planning agree", () => {
    const g = graph(4, [[0, 1], [1, 2]]), r = build(g), p = policy(g);
    const reversed = { ...g, nodes: [...g.nodes].reverse(), edges: [...g.edges].reverse() };
    const again = build(reversed, p, groups(g).reverse());
    expect(again.plan).toEqual(r.plan); expect(again.sidecar).toEqual(r.sidecar);
    const { fingerprint: pf, ...pc } = r.plan, { fingerprint: sf, ...sc } = r.sidecar;
    expect(pf).toBe(fingerprint(pc)); expect(sf).toBe(fingerprint(sc));
  });
});

function normalizerParts(g: GraphSnapshotV1): GraphParts {
  return { missionId: g.missionId, snapshotId: g.snapshotId, artifacts: g.binaryArtifacts, nodes: g.nodes, edges: g.edges,
    objects: g.objects, unresolved: g.unresolved, capabilities: g.capabilities, knowledgeRevision: g.knowledgeRevision,
    scopeDescription: g.scope.description, coverage: g.coverage, toolVersions: g.toolVersions, configFingerprint: g.configFingerprint };
}
/** Real frozen L2 normalizer, with L1 fixture metadata and synthetic tail sites.
 * Input segmentation is an adversarial input, NOT a copied normalizer/oracle. */
function transportFixture(siteCount: number, inputLengths = [siteCount]): GraphSnapshotV1 {
  const g = graph(2, [[0, 1]]);
  const seed: GraphSnapshotV1 = JSON.parse(readFileSync(join(ROOT, "ff8-chunks-tails/content.json"), "utf8"));
  const artifact = { ...seed.binaryArtifacts[0]!, artifactId: `mod:${MODULE}`, contentSha256: MODULE,
    provenance: { ...seed.binaryArtifacts[0]!.provenance, moduleSha256: MODULE } };
  const nodes = g.nodes.map((node, i) => ({ ...seed.nodes[i]!, ...node,
    boundaries: i === 0 ? [{ ordinal: 0, rva: node.rva, endRvaExclusive: "0x2", role: "entry" as const },
      { ordinal: 1, rva: "0x1000", endRvaExclusive: "0x1100", role: "tail" as const }]
      : [{ ordinal: 0, rva: node.rva, endRvaExclusive: "0x12", role: "entry" as const }],
    sizeBytes: { known: true, value: i === 0 ? 257 : 16 } }));
  const sites: PlannerSite[] = Array.from({ length: siteCount }, (_, i) => {
    const siteRva = `0x${(0x1000 + i).toString(16).toUpperCase()}`;
    return { siteRva, xrefType: "code", provenance: { moduleSha256: MODULE, siteRva, siteKind: "instruction", xrefType: "code",
      source: "synthetic-tail-sites-not-native", sourceVersion: "v1", sourceHash: hash("synthetic-sites"), evidenceSha256: hash(`proof:${i}`) } };
  });
  expect(inputLengths.reduce((sum, n) => sum + n, 0)).toBe(siteCount);
  let offset = 0;
  const edges = inputLengths.map(length => {
    expect(length > 0).toBe(true);
    const pageSites = sites.slice(offset, offset + length); offset += length;
    return { ...seed.edges[0]!, ...g.edges[0]!, id: "", sites: pageSites };
  });
  const normalized = buildGraphSnapshot({ missionId: g.missionId, snapshotId: g.snapshotId, artifacts: [artifact], nodes, edges,
    objects: [], unresolved: [], capabilities: [], knowledgeRevision: g.knowledgeRevision, coverage: seed.coverage,
    scopeDescription: "synthetic L1/L2 shard interop; not a native completeness claim", toolVersions: seed.toolVersions,
    configFingerprint: seed.configFingerprint });
  expect(normalized.stats.truncatedSiteEdges).toBe(0);
  return normalized.snapshot;
}
/** A different VALID transport packing, not the normalizer's expected output.
 * Refresh the real snapshot digest: old snapshots/plans are never migrated. */
function repackTransport(g: GraphSnapshotV1, lengths: number[]): GraphSnapshotV1 {
  const changed = structuredClone(g), sites = changed.edges.flatMap(e => e.sites);
  expect(lengths.reduce((sum, n) => sum + n, 0)).toBe(sites.length);
  let offset = 0;
  changed.edges = lengths.map((length, i) => {
    expect(length > 0 && length <= 64).toBe(true);
    const page = sites.slice(offset, offset + length); offset += length;
    return { ...changed.edges[0]!, id: `edge:repacked:${i}`, sites: page };
  });
  changed.normalizedFingerprint = fingerprintWithout(changed, "normalizedFingerprint");
  return assertSnapshotContract(changed);
}
function semanticPlan(r: PlannerResult) {
  const { planId: _planId, fingerprint: _fingerprint, ...content } = r.plan;
  return content;
}

describe("semantic relation view is independent of transport shards", () => {
  test("frozen L2 normalizer + strict L1 JSON roundtrip retain 64/65/129 proofs and canonical source record IDs", () => {
    for (const [siteCount, lengths] of [[64, [64]], [65, [64, 1]], [129, [64, 64, 1]]] as const) {
      const g = transportFixture(siteCount), serialized = canonical(g);
      expect(g.edges.map(e => e.sites.length)).toEqual([...lengths]);
      expect(g.edges.flatMap(e => e.sites)).toHaveLength(siteCount);
      expect(g.edges.every(e => e.sites.length <= 64)).toBe(true);
      const restored = assertSnapshotContract(JSON.parse(serialized));
      expect(buildGraphSnapshot(normalizerParts(restored)).snapshot).toEqual(g);
      expect(canonical(g)).toBe(serialized);
      // Different source segmentation feeds the real normalizer, not an oracle
      // implementing its merge/dedupe/shard/ID algorithm.
      expect(transportFixture(siteCount, [1, siteCount - 1])).toEqual(g);
      const parts = structuredClone(normalizerParts(g)); parts.nodes.reverse(); parts.edges.reverse();
      // These are fresh anonymous extraction records; existing IDs/digests are
      // never carried across a changed immutable transport payload.
      for (const edge of parts.edges) { edge.id = ""; edge.sites.reverse(); }
      expect(buildGraphSnapshot(parts).snapshot).toEqual(g);
      const r = build(restored), relation = r.sidecar.relationView.relations[0]!;
      expect(new Set(relation.sites.map(canonical))).toEqual(new Set(g.edges.flatMap(e => e.sites).map(canonical)));
      expect(relation.sourceEdgeIds).toEqual(g.edges.map(e => e.id).sort());
      expect(new Set(relation.observations.flatMap(o => o.sourceEdgeIds))).toEqual(new Set(relation.sourceEdgeIds));
      for (const edge of g.edges) {
        const observation = relation.observations.find(o => o.sourceEdgeIds.includes(edge.id))!;
        expect(new Set(observation.sitesBySourceEdgeId[edge.id]!.map(canonical))).toEqual(new Set(edge.sites.map(canonical)));
        expect(Object.keys(observation.sitesBySourceEdgeId).sort()).toEqual(observation.sourceEdgeIds);
      }
      expect(build(JSON.parse(serialized))).toEqual(r);
    }
  });
  test("64/65/129 sites retain every proof but only one G1/prerequisite/G2/artifact and envelope", () => {
    const results = [transportFixture(64, [64]), transportFixture(65, [64, 1]), transportFixture(129, [64, 64, 1])].map(g => build(g));
    for (const [index, r] of results.entries()) {
      const A = unit(r, fn(0)), relation = r.sidecar.relationView.relations[0]!;
      expect(r.plan.g1Edges).toHaveLength(1); expect(A.prerequisites).toHaveLength(1);
      expect(A.conflicts.filter(c => c.kind === "blocking_dependency")).toHaveLength(1);
      expect(Object.keys(r.sidecar.requirementById)).toHaveLength(1);
      expect(relation.sites).toHaveLength([64, 65, 129][index]!);
      expect(relation.sourceEdgeIds).toHaveLength(index + 1);
      expect(relation.observations).toHaveLength(1);
      expect(relation.observations[0]!.sites).toEqual(relation.sites);
      expect(new Set(relation.sites.map(s => s.provenance.evidenceSha256)).size).toBe(relation.sites.length);
      expect(r.sidecar.relationView.version).toBe("planner-relations-v1");
      expect(A.prerequisites).toEqual(unit(results[0]!, fn(0)).prerequisites);
      expect(r.sidecar.envelopeBytesByUnit).toEqual(results[0]!.sidecar.envelopeBytesByUnit);
      expect(r.sidecar.estimatesByUnit).toEqual(results[0]!.sidecar.estimatesByUnit);
      expect(r.sidecar.resourcesByUnit).toEqual(results[0]!.sidecar.resourcesByUnit);
      expect(r.plan.sccs).toEqual(results[0]!.plan.sccs);
      expect(r.units).toEqual(results[0]!.units);
      for (const kind of ["fifo", "depth", "critical_path", "critical_path_influence", "heft_like"] as const)
        expect(ranks(r, kind)).toEqual(ranks(results[0]!, kind));
      expect(r.plan.selectedUnitIds).toEqual(results[0]!.plan.selectedUnitIds);
      expect(ready(r, A).ready).toBe(false);
      expect(ready(r, A, [receipt(r.sidecar.requirementById[A.prerequisites[0]!.id]!, unit(r, fn(1)).unitId)]).ready).toBe(true);
    }
    // Evidence/transport binding remains intentionally distinct, not concealed by a semantic hash.
    expect(new Set(results.map(r => r.sidecar.fingerprint)).size).toBe(3);
  });
  test("same full content repartitioned preserves budget frontier and relation identity", () => {
    const a = transportFixture(129), b = repackTransport(a, [32, 32, 32, 33]);
    const base = build(a), bytes = base.sidecar.envelopeBytesByUnit[unit(base, fn(0)).unitId]!;
    for (const limit of [bytes - 1, bytes]) {
      const p = policy(a); p.contextEnvelopeMaxUtf8Bytes = limit;
      const ra = build(a, p), rb = build(b, p);
      expect(semanticPlan(ra)).toEqual(semanticPlan(rb)); expect(ra.units).toEqual(rb.units);
      expect(ra.plan.planId).not.toBe(rb.plan.planId); expect(ra.binding).not.toEqual(rb.binding);
      expect(ra.plan.selectedUnitIds.includes(unit(ra, fn(0)).unitId)).toBe(limit === bytes);
      expect(ra.sidecar.relationView.relations[0]!.sites).toEqual(rb.sidecar.relationView.relations[0]!.sites);
    }
    const total = Object.values(base.sidecar.envelopeBytesByUnit).reduce((sum, n) => sum + n, 0);
    for (const limit of [total - 1, total]) {
      const p = policy(a); p.totalContextBudgetUtf8Bytes = limit;
      const ra = build(a, p, groups(a, [fn(0)])), rb = build(b, p, groups(b, [fn(0)]));
      expect(semanticPlan(ra)).toEqual(semanticPlan(rb)); expect(ra.plan.selectedUnitIds.length).toBe(limit === total ? 2 : 0);
    }
    expect(canonicalRelationKey(a.edges[0]!)).toBe(canonicalRelationKey(b.edges[0]!));
    expect(canonicalRelationKey({ ...a.edges[0]!, kind: "tail_jump" })).not.toBe(canonicalRelationKey(a.edges[0]!));
  });
  test("planner-relations-v1 legacy convenience defaults preserve raw absence; appearance is NEVER fabricated", () => {
    const g = graph(2, [[0, 1]]), base = build(g);
    g.edges.push({ ...g.edges[0]!, id: "edge:legacy-defaults", schemaVersion: 1, direction: "source_to_destination", confidence: "unknown" });
    const r = build(g), relation = r.sidecar.relationView.relations[0]!;
    expect(r.units).toEqual(base.units); expect(r.plan.g1Edges).toEqual(base.plan.g1Edges);
    expect(relation.observations).toHaveLength(2);
    expect(relation.observations.every(o => !Object.hasOwn(o.metadata, "appearedInRevision"))).toBe(true);
    expect(relation.observations.some(o => !Object.hasOwn(o.metadata, "confidence"))).toBe(true);
    expect(relation.observations.some(o => o.metadata.confidence === "unknown")).toBe(true);
    expect(build({ ...g, edges: [...g.edges].reverse() })).toEqual(r);
    expect(build(JSON.parse(canonical(g)))).toEqual(r);
    for (const appearance of [0, 1, 2]) {
      const changed = structuredClone(g); changed.edges[1]!.appearedInRevision = appearance;
      for (const edges of [changed.edges, [...changed.edges].reverse()])
        expect(() => build({ ...changed, edges })).toThrow("relation-metadata-conflict");
    }
    const full = transportFixture(65), projected: PlannerGraphInput = structuredClone(full);
    delete projected.edges[1]!.appearedInRevision;
    expect(() => build(projected)).toThrow("relation-metadata-conflict");
    delete projected.edges[0]!.appearedInRevision;
    const unknown = build(projected);
    expect(unknown.sidecar.relationView.relations[0]!.observations.every(o => !Object.hasOwn(o.metadata, "appearedInRevision"))).toBe(true);
    const confidenceMissing: PlannerGraphInput = structuredClone(full); delete confidenceMissing.edges[1]!.confidence;
    expect(() => build(confidenceMissing)).toThrow("relation-metadata-conflict");
    // The versioned conveniences can coexist with full metadata ONLY at the
    // documented projection defaults. Both source appearances remain known=1;
    // raw omissions remain visible and are never labeled native certification.
    const mixed: PlannerGraphInput = structuredClone(full);
    for (const e of mixed.edges) e.confidence = "unknown";
    delete mixed.edges[1]!.schemaVersion; delete mixed.edges[1]!.direction; delete mixed.edges[1]!.confidence;
    const mixedRelation = build(mixed).sidecar.relationView.relations[0]!;
    expect(mixedRelation.observations).toHaveLength(2);
    expect(mixedRelation.observations.every(o => o.metadata.appearedInRevision === 1)).toBe(true);
    expect(mixedRelation.observations.some(o => !Object.hasOwn(o.metadata, "schemaVersion") && !Object.hasOwn(o.metadata, "direction") && !Object.hasOwn(o.metadata, "confidence"))).toBe(true);
    expect(mixedRelation.sites).toHaveLength(65);
  });
  test("explicit invalid metadata never becomes a legacy default, even on retired records", () => {
    for (const patch of [{ schemaVersion: 2 }, { schemaVersion: null }, { direction: "destination_to_source" },
      { direction: null }, { confidence: "unrecognized" }, { confidence: null }]) {
      const g = transportFixture(65); for (const e of g.edges) { e.status = "invalidated"; e.retiredInRevision = 2; Object.assign(e, patch); }
      for (const edges of [g.edges, [...g.edges].reverse()]) expect(() => build({ ...g, edges })).toThrow("relation-metadata-conflict");
    }
    const g = transportFixture(65); Object.assign(g.edges[1]!, { unexpectedMetadata: "must not silently disappear" });
    expect(() => build(g)).toThrow("relation-metadata-conflict");
  });
  test("explicit legacy default equals absent default; conflicting shard edgeKinds fail closed in either order", () => {
    const g = transportFixture(65, [64, 1]), p = policy(g);
    p.edgeKinds = { [g.edges[0]!.id]: "obligatory" };
    expect(build(g, p).plan.g1Edges).toHaveLength(1);
    p.edgeKinds[g.edges[1]!.id] = "optional";
    for (const edges of [g.edges, [...g.edges].reverse()]) expect(() => build({ ...g, edges }, p)).toThrow("relation-policy-conflict");
    p.edgeKinds[g.edges[0]!.id] = "optional";
    const r = build(g, p); expect(unit(r, fn(0)).prerequisites[0]!.kind).toBe("optional");
    expect(r.sidecar.policy.edgeKinds).toEqual(p.edgeKinds);
    for (const invalidKind of [null, "not-a-prerequisite-kind"]) {
      const invalid = policy(g); Object.assign(invalid, { edgeKinds: Object.fromEntries(g.edges.map(e => [e.id, invalidKind])) });
      expect(() => build(g, invalid)).toThrow("invalid legacy edgeKind");
    }
  });
  test("legacy declarations cannot hide policy conflicts behind inferred/context/retired filtering", () => {
    for (const patch of [{ status: "inferred" as const }, { schedulerRelevance: "context_only" as const },
      { schedulerRelevance: "non_blocking" as const }, { retiredInRevision: 2 }, { status: "invalidated" as const }]) {
      const g = transportFixture(65), p = policy(g); for (const e of g.edges) Object.assign(e, patch);
      const [x, y] = g.edges.map(e => e.id);
      p.edgeKinds = { [x!]: "optional", [y!]: "obligatory" };
      for (const edges of [g.edges, [...g.edges].reverse()]) expect(() => build({ ...g, edges }, p)).toThrow("relation-policy-conflict");
      p.edgeKinds[y!] = "optional";
      const r = build(g, p);
      if (patch.status === "inferred") expect(unit(r, fn(0)).prerequisites[0]!.kind).toBe("unknown_unresolved");
      if (patch.retiredInRevision !== undefined || patch.status === "invalidated") expect(r.plan.g1Edges).toHaveLength(0);
      const defaults = policy(g);
      const defaultKind = patch.status === "inferred" ? "unknown_unresolved" : patch.schedulerRelevance ? "non_blocking" : "obligatory";
      defaults.edgeKinds = { [x!]: defaultKind };
      expect(build(g, defaults).units).toEqual(build(g).units);
    }
  });
  test("all 64/65/129 record policies apply once per relation, never by a selected shard or helper multiplication", () => {
    for (const siteCount of [64, 65, 129]) {
      const g = transportFixture(siteCount), p = policy(g);
      const waiver = { reason: "offline fixture", policyVersion: p.version, source: "lead-fixture",
        sourceHash: hash("relation-waiver"), validation: "fixture-only" as const, knowledgeRevision: g.knowledgeRevision };
      for (const kind of ["optional", "non_blocking", "unknown_unresolved"] as const) {
        p.edgeKinds = Object.fromEntries(g.edges.map(e => [e.id, kind]));
        const r = build(g, p, groups(g, [fn(0)])), A = unit(r, fn(0));
        expect(A.prerequisites).toHaveLength(1); expect(A.prerequisites[0]!.kind).toBe(kind);
        expect(r.units).toHaveLength(1); expect(ready(r, A).ready).toBe(true);
        expect(Object.keys(r.sidecar.requirementById)).toHaveLength(1);
      }
      delete p.edgeKinds;
      p.dispensationsByEdge = Object.fromEntries(g.edges.map(e => [e.id, structuredClone(waiver)]));
      const dispensed = build(g, p, groups(g, [fn(0)]));
      expect(dispensed.plan.decisions.filter(d => d.action === "dispense")).toHaveLength(1);
      expect(Object.keys(dispensed.sidecar.dispensationById)).toHaveLength(1);
      expect(unit(dispensed, fn(0)).prerequisites[0]!.dispensed).toBe(true);
      expect(ready(dispensed, unit(dispensed, fn(0))).ready).toBe(true);
      delete p.dispensationsByEdge; g.nodes[1]!.functionClass = "external";
      const external = receipt(p.requirementsByFunction[fn(1)]!, null);
      p.externalReceiptsByEdge = Object.fromEntries(g.edges.map(e => [e.id, structuredClone(external)]));
      const satisfied = build(g, p, groups(g, [fn(0)]));
      expect(unit(satisfied, fn(0)).prerequisites[0]!.kind).toBe("external_satisfied");
      expect(Object.keys(satisfied.sidecar.externalReceiptById)).toHaveLength(1);
      expect(ready(satisfied, unit(satisfied, fn(0))).ready).toBe(true);
    }
  });
  test("ByEdge means record IDs ONLY: stale/repacked/relation keys need explicit rebind, never implicit policy migration", () => {
    const g = transportFixture(129), relationId = canonicalRelationKey(g.edges[0]!);
    const waiver = { reason: "fixture-only waiver", policyVersion: policy(g).version, source: "lead-fixture",
      sourceHash: hash("waiver"), validation: "fixture-only" as const, knowledgeRevision: g.knowledgeRevision };
    for (const key of [relationId, "edge:unknown"]) {
      for (const patch of [{ edgeKinds: { [key]: "optional" as const } }, { dispensationsByEdge: { [key]: waiver } },
        { externalReceiptsByEdge: { [key]: receipt(requirement(g, fn(1)), null) } }])
        expect(() => build(g, { ...policy(g), ...patch })).toThrow("unknown transport record");
    }
    const p = policy(g); p.edgeKinds = Object.fromEntries(g.edges.map(e => [e.id, "optional"]));
    const repacked = repackTransport(g, [32, 32, 32, 33]);
    expect(() => build(repacked, p)).toThrow("explicit rebind required");
    p.edgeKinds = Object.fromEntries(repacked.edges.map(e => [e.id, "optional"]));
    expect(unit(build(repacked, p), fn(0)).prerequisites[0]!.kind).toBe("optional");
  });
  test("legacy waiver and receipt are compared completely, not picked from a winning shard", () => {
    const g = transportFixture(65, [64, 1]), p = policy(g), [x, y] = g.edges.map(e => e.id);
    const waiver = { reason: "offline contract", policyVersion: p.version, source: "lead-waiver", sourceHash: hash("waiver"), validation: "fixture-only" as const, knowledgeRevision: 2 };
    p.dispensationsByEdge = { [x!]: waiver };
    expect(() => build(g, p)).toThrow("relation-policy-conflict");
    p.dispensationsByEdge[y!] = structuredClone(waiver);
    const r = build(g, p); expect(unit(r, fn(0)).prerequisites).toHaveLength(1);
    expect(Object.keys(r.sidecar.dispensationById)).toHaveLength(1);
    for (const patch of [{ reason: "other reason" }, { policyVersion: "other policy" }, { source: "other source" },
      { sourceHash: hash("different-waiver-proof") }, { validation: "parent-validated" as const }, { knowledgeRevision: 1 }]) {
      p.dispensationsByEdge[y!] = { ...waiver, ...patch };
      expect(() => build(g, p)).toThrow("relation-policy-conflict");
      expect(() => build({ ...g, edges: [...g.edges].reverse() }, p)).toThrow("relation-policy-conflict");
    }
    delete p.dispensationsByEdge; g.nodes[1]!.functionClass = "external";
    const external = receipt(p.requirementsByFunction[fn(1)]!, null);
    p.externalReceiptsByEdge = { [x!]: external, [y!]: structuredClone(external) };
    const ext = build(g, p, groups(g, [fn(0)]));
    expect(unit(ext, fn(0)).prerequisites[0]!.kind).toBe("external_satisfied");
    expect(Object.keys(ext.sidecar.externalReceiptById)).toHaveLength(1);
    for (const patch of [{ commitId: hash("other-commit") }, { knowledgeRevision: external.knowledgeRevision + 1 },
      { artifactSha256: hash("other-content") }, { artifactId: "other artifact" }, { functionId: fn(0) }, { moduleSha256: hash("other-module") },
      { artifactKind: "semantic_description" as const }, { publicationLevel: 2 as const }, { validation: "parent-validated" as const },
      { producerUnitId: "other producer" }, { readbackStatus: "pending" as const }, { futurePrerequisiteEffect: "does_not_satisfy" as const }]) {
      p.externalReceiptsByEdge[y!] = { ...external, ...patch };
      expect(() => build(g, p)).toThrow("relation-policy-conflict");
      expect(() => build({ ...g, edges: [...g.edges].reverse() }, p)).toThrow("relation-policy-conflict");
    }
  });
  test("retired relation policies are compared before filtering, including every waiver/receipt proof", () => {
    const g = transportFixture(65), p = policy(g), [x, y] = g.edges.map(e => e.id);
    for (const e of g.edges) { e.status = "invalidated"; e.retiredInRevision = 2; }
    const waiver = { reason: "historical fixture", policyVersion: p.version, source: "lead-fixture",
      sourceHash: hash("historical-waiver"), validation: "fixture-only" as const, knowledgeRevision: 2 };
    p.dispensationsByEdge = { [x!]: waiver };
    expect(() => build(g, p)).toThrow("relation-policy-conflict");
    p.dispensationsByEdge[y!] = structuredClone(waiver);
    const r = build(g, p); expect(r.plan.g1Edges).toHaveLength(0);
    expect(r.sidecar.policy.dispensationsByEdge).toEqual(p.dispensationsByEdge);
    delete p.dispensationsByEdge;
    const external = receipt(requirement(g, fn(1)), null);
    p.externalReceiptsByEdge = { [x!]: external };
    expect(() => build(g, p)).toThrow("relation-policy-conflict");
    p.externalReceiptsByEdge[y!] = structuredClone(external);
    expect(build(g, p).sidecar.policy.externalReceiptsByEdge).toEqual(p.externalReceiptsByEdge);
    p.externalReceiptsByEdge[y!]!.readbackStatus = "mismatch";
    expect(() => build(g, p)).toThrow("relation-policy-conflict");
    expect(() => build({ ...g, edges: [...g.edges].reverse() }, p)).toThrow("relation-policy-conflict");
  });
  test("all metadata/revisions are coherent before retired/invalidated filtering; coherent history keeps every proof", () => {
    const g = transportFixture(65, [64, 1]);
    for (const patch of [{ confidence: "low" as const }, { appearedInRevision: 2 }, { status: "inferred" as const },
      { schedulerRelevance: "non_blocking" as const }, { retiredInRevision: 2 }, { status: "invalidated" as const }]) {
      const changed = structuredClone(g); Object.assign(changed.edges[1]!, patch);
      expect(() => build(changed)).toThrow("relation-metadata-conflict");
      expect(() => build({ ...changed, edges: [...changed.edges].reverse() })).toThrow("relation-metadata-conflict");
    }
    for (const patch of [{ appearedInRevision: 3 }, { appearedInRevision: -1 }, { appearedInRevision: 2, retiredInRevision: 1 }, { retiredInRevision: 3 }]) {
      const changed = structuredClone(g); Object.assign(changed.edges[1]!, patch);
      expect(() => build(changed)).toThrow("relation-revision-conflict");
    }
    for (const e of g.edges) { e.status = "invalidated"; e.appearedInRevision = 0; e.retiredInRevision = 1; }
    const old = { ...structuredClone(g.edges[0]!), id: "edge:retired-history" };
    old.sites = [structuredClone(old.sites![0]!)]; old.sites[0]!.provenance.source = "old-extractor";
    g.edges.push(old);
    const r = build(g), rel = r.sidecar.relationView.relations[0]!;
    expect(rel.observations).toHaveLength(1); expect(rel.sourceEdgeIds).toContain(old.id);
    expect(rel.sites).toHaveLength(66); expect(rel.sites.filter(s => s.siteRva === "0x1000")).toHaveLength(2);
    expect(r.plan.g1Edges).toHaveLength(0); expect(unit(r, fn(0)).prerequisites).toHaveLength(0);
    const original = canonical(g); const again = build(g); expect(canonical(g)).toBe(original);
    expect(again.binding).toEqual(r.binding); expect(Object.isFrozen(g.edges[0]!.sites)).toBe(false);
    expect(Object.isFrozen(rel.sites[0]!.provenance)).toBe(true);
    const retiredOnly = build({ ...g, edges: [old] }); expect(retiredOnly.plan.g1Edges).toHaveLength(0);
    expect(retiredOnly.sidecar.relationView.relations[0]!.sourceEdgeIds).toEqual([old.id]);
  });
  test("permuted shards/sites/provenance yield identical decisions and bound hashes; changed proof/revision fences binding", () => {
    const g = transportFixture(129, [64, 64, 1]), p = policy(g), r = build(g, p);
    const permuted = structuredClone(g); permuted.nodes.reverse(); permuted.edges.reverse();
    for (const edge of permuted.edges) edge.sites!.reverse();
    const again = build(permuted, p, groups(g).reverse()); expect(again).toEqual(r);
    const proofChanged = structuredClone(g); proofChanged.edges[0]!.sites![0]!.provenance.evidenceSha256 = hash("new-proof");
    proofChanged.normalizedFingerprint = fingerprintWithout(proofChanged, "normalizedFingerprint");
    expect(build(proofChanged, p).binding.sidecarFingerprint).not.toBe(r.binding.sidecarFingerprint);
    const revisionChanged = structuredClone(g); revisionChanged.knowledgeRevision++;
    for (const edge of revisionChanged.edges) edge.appearedInRevision = 2;
    expect(build(revisionChanged, p).binding).not.toEqual(r.binding);
    const input = { plan: r.plan, sidecar: build(proofChanged, p).sidecar, unit: unit(r, fn(1)), expectedSidecarFingerprint: r.binding.sidecarFingerprint,
      snapshotFingerprint: g.normalizedFingerprint, knowledgeRevision: g.knowledgeRevision, validContext: true, cancelled: false, receipts: [] };
    expect(evaluateReadiness(input).ready).toBe(false);
  });
  test("lost citation/provenance/source record identity changes immutable evidence bindings, not obligations or old inputs", () => {
    const g = transportFixture(129), r = build(g), original = canonical(g);
    const lost = structuredClone(g); lost.edges[0]!.sites.shift();
    lost.normalizedFingerprint = fingerprintWithout(lost, "normalizedFingerprint"); assertSnapshotContract(lost);
    const changed = build(lost), rel = changed.sidecar.relationView.relations[0]!;
    expect(rel.sites).toHaveLength(128); expect(rel.sourceEdgeIds).toEqual(r.sidecar.relationView.relations[0]!.sourceEdgeIds);
    expect(changed.plan.g1Edges).toEqual(r.plan.g1Edges); expect(changed.units).toEqual(r.units);
    expect(changed.binding).not.toEqual(r.binding); expect(changed.plan.planId).not.toBe(r.plan.planId);
    const idChanged = structuredClone(g); idChanged.edges[0]!.id = "edge:rebound-source-record";
    idChanged.normalizedFingerprint = fingerprintWithout(idChanged, "normalizedFingerprint"); assertSnapshotContract(idChanged);
    const rebound = build(idChanged);
    expect(rebound.sidecar.relationView.relations[0]!.sites).toEqual(r.sidecar.relationView.relations[0]!.sites);
    expect(rebound.sidecar.relationView.relations[0]!.sourceEdgeIds).not.toEqual(r.sidecar.relationView.relations[0]!.sourceEdgeIds);
    expect(rebound.binding).not.toEqual(r.binding);
    const reassociated = structuredClone(g), firstId = reassociated.edges[0]!.id;
    reassociated.edges[0]!.id = reassociated.edges[1]!.id; reassociated.edges[1]!.id = firstId;
    reassociated.normalizedFingerprint = fingerprintWithout(reassociated, "normalizedFingerprint"); assertSnapshotContract(reassociated);
    const reassociatedRelation = build(reassociated).sidecar.relationView.relations[0]!;
    expect(reassociatedRelation.sites).toEqual(r.sidecar.relationView.relations[0]!.sites);
    expect(reassociatedRelation.sourceEdgeIds).toEqual(r.sidecar.relationView.relations[0]!.sourceEdgeIds);
    expect(reassociatedRelation.observations[0]!.sitesBySourceEdgeId).not.toEqual(r.sidecar.relationView.relations[0]!.observations[0]!.sitesBySourceEdgeId);
    for (const fresh of [changed, rebound]) {
      expect(evaluateReadiness({ plan: fresh.plan, sidecar: r.sidecar, unit: unit(fresh, fn(1)), receipts: [],
        expectedSidecarFingerprint: r.binding.sidecarFingerprint, snapshotFingerprint: fresh.sidecar.snapshotFingerprint,
        knowledgeRevision: 2, validContext: true, cancelled: false }).ready).toBe(false);
    }
    expect(canonical(g)).toBe(original); expect(build(g)).toEqual(r);
  });
  test("new plan ID hash is relation-versioned only; legacy plans/units/families and single-function identities are not migrated", () => {
    const g = graph(1, []), p = policy(g), r = build(g, p), u = r.units[0]!;
    const families = r.units.map(x => x.ownedFunctionIds), legacyPlanId = `plan:${fingerprint({ snapshot: g.normalizedFingerprint, policy: p, families })}`;
    expect(r.plan.planId).toBe(`plan:${fingerprint({ snapshot: g.normalizedFingerprint, policy: p, families, relationViewVersion: "planner-relations-v1" })}`);
    expect(r.plan.planId).not.toBe(legacyPlanId);
    expect(u.unitId).toBe(`unit:${fingerprint({ investigationKind: p.investigationKind, functionIds: [fn(0)] })}`);
    expect(u.subIntents.every(s => s.harnessIdentity.sha256 === MODULE && s.harnessIdentity.version === "fixture-v1" && s.harnessIdentity.ea === "0x400001")).toBe(true);
    expect(r.sidecar.schemaVersion).toBe(1); expect(Object.hasOwn(r.plan, "relationViewVersion")).toBe(false);
    // Pre-relation fixture documents keep their exact original hash formula and
    // readiness contract. New versioning is not a migration of stored documents.
    const oldPlan = structuredClone(r.plan); oldPlan.planId = legacyPlanId; oldPlan.fingerprint = fingerprintWithout(oldPlan, "fingerprint");
    const oldSidecar: any = structuredClone(r.sidecar); delete oldSidecar.relationView;
    oldSidecar.planId = legacyPlanId; oldSidecar.planFingerprint = oldPlan.fingerprint; oldSidecar.fingerprint = fingerprintWithout(oldSidecar, "fingerprint");
    const before = canonical({ oldPlan, oldSidecar });
    expect(evaluateReadiness({ plan: oldPlan, sidecar: oldSidecar, unit: u, receipts: [], expectedSidecarFingerprint: oldSidecar.fingerprint,
      snapshotFingerprint: g.normalizedFingerprint, knowledgeRevision: 2, validContext: true, cancelled: false }).ready).toBe(true);
    const active = [{ unit: { ...u, state: "RUNNING" as const }, familyLeaseKey: `family:${u.unitId}`, planId: legacyPlanId, workerMayStillRun: true }];
    expect(selectCompatible([{ unit: u, readiness: ready(r, u), requirements: RESOURCES }], [worker(0)], [{ accountId: "shared", slots: 1, budget: 1 }], active).assignments).toEqual([]);
    expect(canonical({ oldPlan, oldSidecar })).toBe(before);
  });
  test("overlapping transport proofs deduplicate exact citations, not distinct provenance or call kind", () => {
    const g = transportFixture(65, [64, 1]), before = build(g);
    const duplicate = structuredClone(g.edges[0]!); duplicate.id = "edge:duplicate-proof-page";
    duplicate.sites = [structuredClone(g.edges[0]!.sites![0]!)]; g.edges.push(duplicate);
    const repeated = build(g);
    expect(repeated.sidecar.relationView.relations[0]!.sites).toHaveLength(65);
    expect(repeated.sidecar.relationView.relations[0]!.sourceEdgeIds).toContain(duplicate.id);
    expect(repeated.plan).toEqual(before.plan); expect(repeated.units).toEqual(before.units);
    duplicate.sites[0]!.provenance.sourceVersion = "v2";
    expect(build(g).sidecar.relationView.relations[0]!.sites).toHaveLength(66);
    duplicate.kind = "tail_jump";
    const anotherKind = build(g); expect(anotherKind.sidecar.relationView.relations).toHaveLength(2);
    expect(anotherKind.plan.g1Edges).toHaveLength(2); expect(unit(anotherKind, fn(0)).prerequisites).toHaveLength(2);
  });
  test("sharded recursion and in-family calls retain native SCC/local publication gates without transport duplication", () => {
    const g = transportFixture(129, [64, 64, 1]);
    const family = [{ groupId: "joined", partitionId: "partition:test", ownedFunctionIds: [fn(0), fn(1)], contextFunctionIds: [] }];
    const r = build(g, policy(g), family), u = r.units[0]!;
    expect(u.prerequisites).toHaveLength(0); expect(r.plan.g1Edges).toHaveLength(0);
    const B = u.subIntents.find(s => s.functionId === fn(1) && s.role === "R")!;
    for (const s of u.subIntents.filter(s => s.functionId === fn(0) && s.role !== "R")) expect(s.waitsForSubIntentIds).toEqual([B.subIntentId]);
    g.edges.push({ ...g.edges[0]!, id: "edge:reverse-call", sourceId: fn(1), destinationId: fn(0), sites: [] });
    const cycle = build(g); expect(cycle.plan.sccs).toHaveLength(1); expect(cycle.plan.sccs[0]!.exclusive).toBe(true);
    const partial = policy(g); partial.edgeKinds = Object.fromEntries(g.edges.map(e => [e.id, "optional"]));
    const scoped = build(g, partial, groups(g, [fn(0)]));
    expect(scoped.diagnostics.some(d => d.code === "partial-native-scc")).toBe(true); expect(scoped.plan.selectedUnitIds).toHaveLength(0);
  });
});

describe("G2 pairwise exclusion, canonical ownership and G3", () => {
  test("ownership ignores plans/partitions, old living plans block and late workers still block", () => {
    const g = graph(1, []), p = policy(g), r = build(g), u = r.units[0]!;
    p.partitionId = "new-partition"; const gs = groups(g); gs[0]!.partitionId = p.partitionId;
    const newer = build(g, p, gs), candidate = newer.units[0]!;
    expect(candidate.unitId).toBe(u.unitId); expect(canonicalOwnershipKey(fn(0))).toBe(`fn:${fn(0)}`);
    const active = [{ unit: { ...u, state: "RUNNING" as const }, familyLeaseKey: `family:${u.unitId}`, planId: r.plan.planId, workerMayStillRun: true }];
    const selection = selectCompatible([{ unit: candidate, readiness: ready(newer, candidate), requirements: RESOURCES }], [worker(0)], [{ accountId: "shared", slots: 5, budget: 5 }], active);
    expect(selection.assignments).toEqual([]);
    active[0]!.unit.state = "STALE" as any;
    expect(selectCompatible([{ unit: candidate, readiness: ready(newer, candidate), requirements: RESOURCES }], [worker(0)], [{ accountId: "shared", slots: 5, budget: 5 }], active).assignments).toEqual([]);
  });
  test("conflicts are not transitive: A-x-B-y-C permits A and C", () => {
    const r = build(graph(3, [])), [A, B, C] = r.units.map(u => structuredClone(u));
    A!.conflicts.push({ id: "Ax", kind: "exclusive_write", resourceKey: "x", withUnitId: null });
    B!.conflicts.push({ id: "Bx", kind: "exclusive_write", resourceKey: "x", withUnitId: null }, { id: "By", kind: "exclusive_write", resourceKey: "y", withUnitId: null });
    C!.conflicts.push({ id: "Cy", kind: "exclusive_write", resourceKey: "y", withUnitId: null });
    expect(unitsConflict(A!, B!)).toBe(true); expect(unitsConflict(B!, C!)).toBe(true); expect(unitsConflict(A!, C!)).toBe(false);
    const selection = selectCompatible([A!, B!, C!].map(unit => ({ unit, readiness: { ready: true, reasons: [] }, requirements: RESOURCES })), [worker(0), worker(1), worker(2)], [{ accountId: "shared", slots: 3, budget: 3 }], []);
    expect(selection.assignments.map(a => a.unitId)).toEqual([A!.unitId, C!.unitId]);
  });
  test("shared context produces non-blocking G3, no duplicate ownership/investigation", () => {
    const g = graph(3, []), gs = groups(g, [fn(0), fn(1)]); gs.forEach(group => group.contextFunctionIds.push(fn(2)));
    const r = build(g, policy(g), gs); expect(r.units.length).toBe(2); expect(r.plan.g3Affinities).toHaveLength(1);
    expect(r.plan.g3Affinities[0]!.blocking).toBe(false); expect(unitsConflict(r.units[0]!, r.units[1]!)).toBe(false);
  });
  test("blocking dependency/exclusive resource refs are direct pairwise conflicts", () => {
    const r = build(graph(3, [[0, 1], [1, 2]]));
    expect(unitsConflict(unit(r, fn(0)), unit(r, fn(1)))).toBe(true);
    expect(unitsConflict(unit(r, fn(1)), unit(r, fn(2)))).toBe(true);
    expect(unitsConflict(unit(r, fn(0)), unit(r, fn(2)))).toBe(false);
  });
  test("compatible independent family admissions respect tools/models/accounts and shared quota", () => {
    const r = build(graph(3, [])); const candidates = r.units.map(u => ({ unit: u, readiness: ready(r, u), requirements: RESOURCES }));
    const selection = selectCompatible(candidates, [worker(0), worker(1), worker(2)], [{ accountId: "shared", slots: 1, budget: 100 }], []);
    expect(selection.assignments.length).toBe(1);
    expect(selectCompatible(candidates, [{ ...worker(0), model: "forbidden" }], [{ accountId: "shared", slots: 5, budget: 5 }], []).assignments).toEqual([]);
    expect(selectCompatible(candidates, [{ ...worker(0), tools: [] }], [{ accountId: "shared", slots: 5, budget: 5 }], []).assignments).toEqual([]);
    expect(selectCompatible(candidates, [worker(0, "wrong-account")], [{ accountId: "wrong-account", slots: 5, budget: 5 }], []).assignments).toEqual([]);
    expect(selectCompatible(candidates.map(c => ({ ...c, requirements: undefined })), [worker(0)], [{ accountId: "shared", slots: 5, budget: 5 }], []).assignments).toEqual([]);
  });
  test("heterogeneous assignment uses authorized model costs, deterministic fastest idle slot", () => {
    const r = build(graph(1, [])), u = r.units[0]!, req = { ...RESOURCES, models: ["slow", "fast"] };
    const candidates = [{ unit: u, readiness: ready(r, u), requirements: req, modelCosts: { slow: 20, fast: 5 } }];
    const ws = [{ ...worker(0), model: "slow" }, { ...worker(1), model: "fast" }];
    expect(selectCompatible(candidates, ws, [{ accountId: "shared", slots: 1, budget: 1 }], []).assignments[0]!.workerId).toBe("worker:1");
  });
});

describe("offline priorities and deterministic replay", () => {
  test("A/B parallel + R/validation estimates, whole SCC iteration budget", () => {
    expect(pipelineCost({ A: 3, B: 5, R: 2, validation: 1 })).toBe(8);
    expect(() => pipelineCost({ A: NaN, B: 1, R: 1, validation: 1 })).toThrow();
    const r = build(graph(2, [[0, 1], [1, 0]])); expect(r.units[0]!.estimatedCost).toEqual({ known: true, value: 32 });
    const g = graph(1, []), p = policy(g); p.contextEnvelopeMaxUtf8Bytes = -0;
    expect(() => build(g, p)).toThrow("noncanonical numeric");
  });
  test("rank producer = own cost + maximum consumer rank, not callee direction", () => {
    const r = build(graph(4, [[0, 1], [0, 2], [1, 3]])), rs = ranks(r), byFn = (id: string) => rs.find(x => x.unitId === unit(r, id).unitId)!;
    expect(byFn(fn(0)).criticalPath).toBe(8); expect(byFn(fn(1)).criticalPath).toBe(16);
    expect(byFn(fn(3)).criticalPath).toBe(24); expect(byFn(fn(3)).depth).toBe(2);
    const hs = ranks(r, "heft_like"); expect(hs.find(x => x.unitId === unit(r, fn(3)).unitId)!.criticalPath).toBe(18);
  });
  test("all five policies deterministic; aging event prevents starvation, canonical numeric tie", () => {
    const r = build(graph(16, []));
    for (const kind of ["fifo", "depth", "critical_path", "critical_path_influence", "heft_like"] as const)
      expect(ranks(r, kind)).toEqual(ranks(r, kind));
    expect(ranks(r, "fifo").map(x => x.unitId)).toEqual(r.units.map(u => u.unitId));
    const old = unit(r, fn(15));
    const input = { policy: "critical_path" as const, readyAtEvent: Object.fromEntries(r.units.map(u => [u.unitId, u === old ? 0 : 100])), aging: { eventNumber: 100, quantum: 10, version: "aging-v1" } };
    expect(rankUnits(r, input)[0]!.unitId).toBe(old.unitId);
    expect(() => rankUnits(r, { ...input, aging: { ...input.aging, eventNumber: 99 } })).toThrow("ready event");
  });
  test("unknown estimates are not zero; FIFO/depth work, cost policies fail closed", () => {
    const g = graph(2, [[0, 1]]), p = policy(g); delete p.estimatesByFunction[fn(0)];
    const r = build(g, p); expect(unit(r, fn(0)).estimatedCost).toEqual({ known: false, value: null });
    expect(ranks(r, "fifo").every(x => x.criticalPath === null)).toBe(true);
    expect(ranks(r, "depth").length).toBe(2); expect(() => ranks(r, "critical_path")).toThrow("unknown versioned estimate");
  });
  test("ready dispatch preflight follows rank but never admits blocked consumer", () => {
    const g = graph(3, [[0, 1]]), r = build(g);
    const input = { policy: "critical_path" as const, readyAtEvent: Object.fromEntries(r.units.map(u => [u.unitId, 0])), aging: { eventNumber: 1, quantum: 100, version: "aging-v1" } };
    const selected = selectReadyUnits(r, input, { receipts: [], expectedSidecarFingerprint: r.sidecar.fingerprint, snapshotFingerprint: g.normalizedFingerprint, knowledgeRevision: 2, validContext: true, cancelled: false },
      [worker(0), worker(1)], [{ accountId: "shared", slots: 2, budget: 2 }], []);
    expect(selected.assignments.map(a => a.unitId).sort()).toEqual([unit(r, fn(1)).unitId, unit(r, fn(2)).unitId].sort());
  });
  test("source contains no algorithmic LLM/classifier/network/clock call", () => {
    for (const file of ["planner.ts", "scc.ts"]) {
      const source = readFileSync(join(import.meta.dir, "../src", file), "utf8");
      expect(source).not.toMatch(/\b(classify_x86|jev_ask|fetch|Date\.now|setInterval|setTimeout)\s*\(/);
    }
  });
});
