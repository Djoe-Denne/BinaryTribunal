import { describe, expect, test } from "bun:test";
import { parsePreparedGraph, prepareGraph } from "../../src/graph-pipeline";
import { canonical, fingerprint } from "../../src/validation";
import { initialSnapshot, missionFixture, preparation, preparationV2, snapshotFixture } from "./fixture-driver";

describe("central immutable graph preparation", () => {
  test("accepted L2/L3/L5 exports are bound, deterministic and detached", () => {
    const input = preparation(snapshotFixture(4, [[0, 1], [2, 3]])), original = canonical(input);
    const first = prepareGraph(input), second = prepareGraph(input);
    expect(canonical(first)).toBe(canonical(second)); expect(canonical(input)).toBe(original);
    expect(first.groups.flatMap(g => g.ownedFunctionIds).length).toBe(4);
    expect(first.planning.plan.selectedUnitIds.length).toBe(4);
    input.snapshot.nodes[0]!.name = "mutated after preparation";
    expect(first.snapshot.nodes[0]!.name).not.toBe("mutated after preparation");
    expect(parsePreparedGraph(JSON.parse(canonical(first)))).toEqual(first);
  });
  test("strict versions, unknown own fields and corrupt bindings fail before use", () => {
    const p = prepareGraph(preparation());
    expect(() => parsePreparedGraph({ ...p, version: "future-v99" })).toThrow();
    const { fingerprint: _digest, ...withUnknown } = { ...p, unexpected: true };
    expect(() => parsePreparedGraph({ ...withUnknown, fingerprint: fingerprint(withUnknown) })).toThrow();
    const changed = structuredClone(p); changed.planning.sidecar.knowledgeRevision++;
    expect(() => parsePreparedGraph(changed)).toThrow();
    expect(() => prepareGraph({ ...preparation(), token: "not journal material" })).toThrow();
  });
  test("SCC aggregation stays functional with a separate A/B/R for each owned function", () => {
    const p = prepareGraph(preparation(snapshotFixture(3, [[0, 1], [1, 0], [2, 2]])));
    const recursive = p.planning.units.find(u => u.ownedFunctionIds.length === 2)!;
    expect(recursive).toBeDefined(); expect(recursive.subIntents).toHaveLength(6);
    for (const r of recursive.subIntents.filter(s => s.role === "R")) {
      expect(r.waitsForSubIntentIds.map(id => recursive.subIntents.find(s => s.subIntentId === id)!.functionId)).toEqual([r.functionId, r.functionId]);
    }
    expect(p.planning.plan.sccs.some(s => s.hasSelfLoop)).toBe(true);
  });
});
describe("prospective source-bound C/N/T accounting", () => {
  function setup() { const request = preparationV2(snapshotFixture(3, [[0, 1], [2, 1]])), current = initialSnapshot(missionFixture(request.snapshot)); return { request, current }; }
  test("actual source config/template/inputs before plan; distinct derived binding afterward", () => {
    const { request, current } = setup(), p = prepareGraph(request, current); expect(p.version).toBe("l8-prepared-graph-v2");
    if (p.version !== "l8-prepared-graph-v2") throw new Error("wrong version");
    expect(p.admissionSource.context.missionConfigFingerprint).toBe(fingerprint(current.config));
    expect(p.admissionSource.context.inputManifestFingerprint).toBe(fingerprint(p.admissionSource.inputManifestSource));
    expect(canonical(p.admissionSource.executionSourceSpec)).not.toContain("planId"); expect(canonical(p.admissionSource.context)).not.toContain("planFingerprint");
    expect(p.planning.units).toHaveLength(3); expect(p.planning.plan.selectedUnitIds).toHaveLength(3);
    for (const unit of p.planning.units) {
      const a = p.planning.sidecar.admissionBudget!.byUnit[unit.unitId]!;
      expect(a.maxNewExecutions).toEqual({ known: true, value: 3 }); expect(a.admissionCapUtf8Bytes).toEqual({ known: true, value: 60000 });
      expect(a.structuralEnvelopeUtf8Bytes).toBeGreaterThan(0); expect(a.structuralEnvelopeUtf8Bytes).toBeLessThan(60000);
    }
    expect(parsePreparedGraph(JSON.parse(canonical(p)))).toEqual(p);
  });
  test("unknown/missing caps stay unknown and select no speculative execution", () => {
    const { request, current } = setup(); delete request.capsByFunction;
    const p = prepareGraph(request, current); expect(p.planning.plan.selectedUnitIds).toHaveLength(0);
    expect(Object.values(p.planning.sidecar.admissionBudget!.byUnit).every(a => !a.admissionCapUtf8Bytes.known && a.maxNewExecutions.value === 3)).toBe(true);
    expect(() => prepareGraph(request)).toThrow("independent actual");
  });
  test("closure-wide T=C*N counts a shared callee once and honors the exact total boundary", () => {
    const { request, current } = setup(); request.policy.totalContextBudgetUtf8Bytes = 540000;
    const p = prepareGraph(request, current); expect(p.planning.plan.selectedUnitIds).toHaveLength(3); expect(p.planning.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBe(540000);
    request.policy.totalContextBudgetUtf8Bytes = 539999; const less = prepareGraph(request, current); expect(less.planning.plan.selectedUnitIds.length).toBeLessThan(3); expect(less.planning.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBeLessThanOrEqual(539999);
    expect(new Set(p.planning.units.flatMap(u => u.ownedFunctionIds)).size).toBe(3);
  });
  test("source generation uses actual nonconstant cycle/revision/epoch/config", () => {
    const { request, current } = setup(); current.revision = 7; current.cycle = 2; current.cycles.push({ ...structuredClone(current.cycles[0]!), number: 2 }); request.budgetEpoch = 9;
    current.config.models.R.id = "changed-model";
    const p = prepareGraph(request, current); if (p.version !== "l8-prepared-graph-v2") throw new Error("wrong version");
    expect(p.admissionSource.context.cycle).toBe(2); expect(p.admissionSource.context.budgetEpoch).toBe(9); expect(p.admissionSource.executionSourceSpec.models.R.id).toBe("changed-model");
  });
  test("strip/unknown/wrong source/hash/budget mutations fail even with outer rehash", () => {
    const { request, current } = setup(), p = prepareGraph(request, current);
    const rehash = (v: any) => { const { fingerprint: _, ...rest } = v; return { ...rest, fingerprint: fingerprint(rest) }; };
    for (const edit of [
      (x: any) => { delete x.admissionSource; }, (x: any) => { x.admissionSource.unexpected = true; },
      (x: any) => { x.admissionSource.context.budgetEpoch++; }, (x: any) => { x.admissionSource.inputManifestFingerprint = "a".repeat(64); },
      (x: any) => { x.planning.sidecar.admissionBudget.byUnit[x.planning.units[0].unitId].maxNewExecutions.value++; },
      (x: any) => { x.planning.sidecar.policy.admissionBudgetMode = undefined; },
    ]) { const copy = structuredClone(p); edit(copy); expect(() => parsePreparedGraph(rehash(copy))).toThrow(); }
    expect(() => prepareGraph({ ...request, capsByFunction: { [request.snapshot.nodes[0]!.id]: { completeBodyMaxUtf8Bytes: { known: true, value: 10000 }, maxNewExecutionsPerRole: { A: 2, B: 1, R: 1 } } } }, current)).toThrow();
  });
  test("descriptors/proxies/inheritance/holes reject without invoking their code", () => {
    const { request, current } = setup(); let invoked = 0;
    const bad = Object.defineProperty({ ...request }, "budgetEpoch", { enumerable: true, get() { invoked++; return 1; } });
    expect(() => prepareGraph(bad, current)).toThrow(); expect(invoked).toBe(0);
    const proxy = new Proxy(request, { ownKeys() { invoked++; return Reflect.ownKeys(request); } }); expect(() => prepareGraph(proxy, current)).toThrow(); expect(invoked).toBe(0);
    expect(() => prepareGraph(Object.assign(Object.create({ inherited: true }), request), current)).toThrow();
    const sparse = { ...request, snapshot: { ...request.snapshot, nodes: new Array(3) } }; expect(() => prepareGraph(sparse, current)).toThrow();
  });
});
