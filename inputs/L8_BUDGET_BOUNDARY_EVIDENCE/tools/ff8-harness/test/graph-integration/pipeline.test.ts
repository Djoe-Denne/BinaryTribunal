import { describe, expect, test } from "bun:test";
import { parsePreparedGraph, prepareGraph } from "../../src/graph-pipeline";
import { canonical, fingerprint } from "../../src/validation";
import { preparation, snapshotFixture } from "./fixture-driver";

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
