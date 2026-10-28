import { describe, expect, test } from "bun:test";
import { evaluateReadiness, planMission, readySubIntents, unitsConflict } from "../../src/planner";
import { jsonClone, oracleComponents, oracleDigest, owner, planned, policyFor, reachability,
  readiness, receiptFor, singletonGroups, snapshotOf } from "./graph-interop-support";

describe("L7 interop: normalized graph/groups -> dependency plan -> readiness", () => {
  test("bounded graph census checks SCCs against transitive-closure equivalence, not Tarjan", () => {
    const candidates = [[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 3]] as const;
    for (let mask = 0; mask < 64; mask++) {
      const calls = candidates.filter((_, bit) => (mask & (1 << bit)) !== 0), snapshot = snapshotOf(4, calls);
      const result = planned(snapshot), expected = oracleComponents(4, calls).map(c => c.map(i => snapshot.nodes[i]!.id));
      expect(result.plan.sccs.map(s => s.functionIds).sort()).toEqual(expected.sort());
      expect(result.units.map(u => u.ownedFunctionIds).sort()).toEqual(expected.sort());
      const closure = reachability(4, calls);
      for (const u of result.units) {
        expect(u.subIntents).toHaveLength(3 * u.ownedFunctionIds.length);
        for (const id of u.ownedFunctionIds) expect(u.subIntents.filter(s => s.functionId === id).map(s => s.role).sort()).toEqual(["A", "B", "R"]);
        for (const [a, b] of calls) if (u.ownedFunctionIds.includes(snapshot.nodes[a]!.id) && !u.ownedFunctionIds.includes(snapshot.nodes[b]!.id)) {
          const producer = owner(result, snapshot.nodes[b]!.id);
          expect(result.plan.g1Edges.some(e => e.fromUnitId === producer.unitId && e.toUnitId === u.unitId)).toBe(true);
        }
      }
      for (let limit = 0; limit <= 4; limit++) {
        const partitionId = "partition:bounded-budget", policy = policyFor(snapshot, partitionId); policy.maxSelectedUnits = limit;
        const limited = planMission(snapshot, singletonGroups(snapshot, partitionId), policy);
        const selected = new Set(limited.plan.selectedUnitIds), owned = new Set(limited.units.filter(u => selected.has(u.unitId)).flatMap(u => u.ownedFunctionIds));
        expect(selected.size).toBeLessThanOrEqual(limit);
        for (let a = 0; a < 4; a++) if (owned.has(snapshot.nodes[a]!.id)) for (let b = 0; b < 4; b++)
          if (closure[a]![b]) expect(owned.has(snapshot.nodes[b]!.id)).toBe(true);
      }
    }
  });

  test("D/E commit enables B immediately while F is unfinished; A still waits B/C", () => {
    // indices: A=0 B=1 C=2 D=3 E=4 F=5
    const snapshot = snapshotOf(6, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]]), result = planned(snapshot);
    const units = snapshot.nodes.map(n => owner(result, n.id));
    expect(units.map(u => readiness(result, u).ready)).toEqual([false, false, false, true, true, true]);
    const committed = (indices: number[]) => indices.map(i => receiptFor(result.sidecar.policy.requirementsByFunction[snapshot.nodes[i]!.id]!, units[i]!.unitId));
    for (const order of [[3, 4], [4, 3]]) {
      expect(readiness(result, units[1]!, committed(order.slice(0, 1))).ready).toBe(false);
      expect(units.map(u => readiness(result, u, committed(order)).ready)).toEqual([false, true, false, true, true, true]);
    }
    expect(readiness(result, units[0]!, committed([1])).ready).toBe(false);
    expect(readiness(result, units[0]!, committed([1, 2])).ready).toBe(true);
    const b = units[1]!, authors = readySubIntents(b);
    expect(authors.map(s => s.role).sort()).toEqual(["A", "B"]);
    expect(readySubIntents(b, [authors[0]!.subIntentId]).map(s => s.role)).not.toContain("R");
    expect(readySubIntents(b, authors.map(s => s.subIntentId)).map(s => s.role)).toEqual(["R"]);
  });

  test("callee closure precedes UTF8 and selection budgets; bad quotient merge is separated", () => {
    const snapshot = snapshotOf(3, [[0, 1], [1, 2]]), partitionId = "partition:crossed-quotient", policy = policyFor(snapshot, partitionId);
    const groups = [{ groupId: "merge-ends", partitionId, ownedFunctionIds: [snapshot.nodes[0]!.id, snapshot.nodes[2]!.id], contextFunctionIds: [] },
      { groupId: "middle", partitionId, ownedFunctionIds: [snapshot.nodes[1]!.id], contextFunctionIds: [] }];
    const separated = planMission(snapshot, groups, policy);
    expect(separated.units.map(u => u.ownedFunctionIds)).toEqual(snapshot.nodes.map(n => [n.id]));
    expect(separated.diagnostics.some(d => d.code === "artificial-quotient-cycle-separated")).toBe(true);
    const callerOnly = [singletonGroups(snapshot, partitionId)[0]!];
    const complete = planMission(snapshot, callerOnly, policy);
    expect(complete.units.flatMap(u => u.ownedFunctionIds).sort()).toEqual(snapshot.nodes.map(n => n.id).sort());
    for (const maxSelectedUnits of [0, 1, 2]) {
      const result = planMission(snapshot, callerOnly, { ...policy, maxSelectedUnits });
      expect(result.plan.selectedUnitIds).not.toContain(owner(result, snapshot.nodes[0]!.id).unitId);
    }
    const denied = planMission(snapshot, callerOnly, { ...policy, contextEnvelopeMaxUtf8Bytes: 1 });
    expect(denied.plan.selectedUnitIds).toEqual([]);
    expect(denied.plan.budgets.unit).toBe("utf8-bytes");
  });

  test("immutable revisions and per-function G2 ownership persist across partition labels; G3 never blocks", () => {
    const snapshot = snapshotOf(2), a = planned(snapshot), partitionId = "partition:new-owner-view";
    const b = planMission(snapshot, singletonGroups(snapshot, partitionId), policyFor(snapshot, partitionId));
    expect(unitsConflict(a.units[0]!, b.units[0]!)).toBe(true);
    expect(unitsConflict(a.units[0]!, b.units[1]!)).toBe(false);
    const unit = a.units[0]!, changed = jsonClone(unit); changed.knowledgeRevision++;
    expect(readiness(a, changed).ready).toBe(false);
    expect(evaluateReadiness({ plan: a.plan, sidecar: a.sidecar, unit, receipts: [],
      expectedSidecarFingerprint: a.sidecar.fingerprint, snapshotFingerprint: a.sidecar.snapshotFingerprint,
      knowledgeRevision: 2, validContext: true, cancelled: false }).ready).toBe(false);
    expect(a.plan.fingerprint).toBe(oracleDigest(a.plan, "fingerprint"));
    expect(Object.isFrozen(a.units[0]!.subIntents)).toBe(true);
    expect(a.plan.g3Affinities.every(edge => edge.blocking === false)).toBe(true);
  });

  test("policy-optional edges do not hide a selected fragment of a confirmed native SCC", () => {
    const snapshot = snapshotOf(2, [[0, 1], [1, 0]]), partitionId = "partition:partial-native";
    const policy = policyFor(snapshot, partitionId);
    policy.edgeKinds = Object.fromEntries(snapshot.edges.map(e => [e.id, "optional"]));
    const result = planMission(snapshot, [singletonGroups(snapshot, partitionId)[0]!], policy);
    expect(result.units).toHaveLength(1);
    expect(result.units[0]!.ownedFunctionIds).toEqual([snapshot.nodes[0]!.id]);
    expect(result.diagnostics.some(d => d.code === "partial-native-scc")).toBe(true);
    expect(readiness(result, result.units[0]!).ready).toBe(false);
  });
});
