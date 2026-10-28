import { describe, expect, test } from "bun:test";
import { graphEvents, preparedGraphRun, readGraphJournal } from "../../src/graph-engine";
import { canonical, fingerprint } from "../../src/validation";
import { graphHarness, preparationV2, snapshotFixture } from "./fixture-driver";

describe("prospective v2 offline vertical (explicit fake ports, no native authority)", () => {
  test("complete A+B -> exact R -> attestation/validation/publication/readback", async () => {
    const h = graphHarness();
    try {
      h.start(); const anchor = canonical(h.store.load(h.missionId).cycles[0]);
      expect(h.runtime.view().intents).toHaveLength(0);
      const first = await h.step(); expect(first.intents.map(r => r.intent.role).sort()).toEqual(["A", "B"]); expect(first.resultIds).toHaveLength(0);
      const second = await h.step(); expect(second.intents.map(r => r.intent.role).sort()).toEqual(["A", "B", "R"]); expect(second.resultIds).toHaveLength(2);
      const r = second.intents.find(r => r.intent.role === "R")!;
      expect(r.intent.inputs.proposals?.map(p => p.resultId)).toEqual(r.intent.previousResultIds);
      expect(new Set(r.intent.inputs.proposals?.map(p => p.document.kind === "proposal" && p.document.role))).toEqual(new Set(["A", "B"]));
      expect(second.intents.filter(r => r.intent.role !== "R").every(r => !r.intent.inputs.proposals && !r.intent.inputs.files.some(f => f.kind === "proposal"))).toBe(true);
      const done = await h.complete(); expect(done.status).toBe("complete"); expect(done.nativeVerified).toBe(false); expect(done.scientificAuthority).toBe(false);
      const events = graphEvents(h.runtime.options.graph, h.missionId), claims = events.filter(e => e.kind === "l8.graph2.execution-claimed");
      expect(claims).toHaveLength(3); expect(events.filter(e => e.kind === "knowledge_committed")).toHaveLength(1); expect(h.host.publications).toHaveLength(1);
      expect(events.some(e => e.kind === "parent_attested")).toBe(true);
      expect(canonical(h.store.load(h.missionId).cycles[0])).toBe(anchor);
      const cursor = h.runtime.options.graph.events.cursor(h.missionId); await h.step(); expect(h.runtime.options.graph.events.cursor(h.missionId)).toEqual(cursor);
      expect(h.engine.inspectGraph(h.missionId).status).toBe("complete");
    } finally { h.close(); }
  });
  test("SCC has six functional slots, not a unit-as-function or second-pass allowance", async () => {
    const h = graphHarness(preparationV2(snapshotFixture(2, [[0, 1], [1, 0]]), 4));
    try {
      h.start(); const run = preparedGraphRun(h.runtime.options.graph, h.missionId)!; expect(run.prepared.planning.units).toHaveLength(1);
      const done = await h.complete(); expect(done.status).toBe("complete"); expect(done.intents).toHaveLength(6);
      expect(new Set(done.intents.map(r => r.subIntentId)).size).toBe(6); expect(new Set(done.intents.map(r => r.intent.identity?.ea)).size).toBe(2);
      const j = readGraphJournal(h.runtime.options.graph, h.store.load(h.missionId));
      expect(j.intents.every(r => r.intent.role !== "R" || r.intent.inputs.proposals!.every(p => canonical(p.document.identity) === canonical(r.intent.identity)))).toBe(true);
      expect(h.host.publications).toHaveLength(1);
    } finally { h.close(); }
  }, 30000);
  test("D/E commits drain B immediately while independent F remains running", async () => {
    const source = snapshotFixture(6, [[0, 1], [1, 2], [1, 3]]), h = graphHarness(preparationV2(source, 6));
    try {
      h.host.holds.add(source.nodes[4]!.id); h.start();
      for (let n = 0; n < 10 && !h.runtime.view().intents.some(r => r.intent.identity?.ea === source.nodes[1]!.ea); n++) await h.step();
      const view = h.runtime.view(), events = graphEvents(h.runtime.options.graph, h.missionId), run = preparedGraphRun(h.runtime.options.graph, h.missionId)!;
      const unitFor = (index: number) => run.prepared.planning.units.find(u => u.ownedFunctionIds.includes(source.nodes[index]!.id))!.unitId;
      const bClaim = events.find(e => e.kind === "l8.graph2.execution-claimed" && e.unitId === unitFor(1))!;
      expect(bClaim).toBeDefined(); for (const i of [2, 3]) expect(events.find(e => e.kind === "knowledge_committed" && e.unitId === unitFor(i))!.sequence).toBeLessThan(bClaim.sequence);
      expect(view.units.find(u => u.unitId === unitFor(4))?.state).toBe("RUNNING"); expect(events.some(e => e.kind === "l8.graph2.result" && e.unitId === unitFor(4))).toBe(false);
      expect(view.intents.filter(r => r.unitId === unitFor(1)).every(r => r.intent.role !== "R")).toBe(true);
      expect(view.intents.length).toBeLessThanOrEqual(18); expect(h.host.publications.length).toBeGreaterThanOrEqual(2);
      // Shared structural callee/source is present exactly once in the plan.
      expect(new Set(run.prepared.planning.units.flatMap(u => u.ownedFunctionIds)).size).toBe(6);
    } finally { h.close(); }
  }, 60000);
  test("legal oversized R is retained verbatim and refused before any pin/claim/outbox", async () => {
    const h = graphHarness(preparationV2(snapshotFixture(1), 2, 20000));
    try {
      h.host.proposalText = `synthetic Unicode é 関 🙂 quote \" slash \\ newline\n${"large exact proposition ".repeat(800)}`;
      h.start(); await h.step(); const view = await h.step();
      expect(view.status).toBe("blocked"); expect(view.refused).toHaveLength(1); expect(view.intents).toHaveLength(2);
      const refused = view.refused[0]!, graph = h.runtime.options.graph;
      expect(refused.intent.role).toBe("R"); expect(refused.intent.inputs.proposals!.every(p => p.content.includes(h.host.proposalText.slice(-100)))).toBe(true);
      expect(Buffer.byteLength(canonical(refused.admission), "utf8")).toBeGreaterThan(20000); expect(graph.admission(refused.intent.executionId)).toBeNull();
      const events = graphEvents(graph, h.missionId); expect(events.filter(e => e.kind === "l8.graph2.execution-claimed")).toHaveLength(2);
      expect(events.filter(e => e.kind === "admission_inputs_frozen")).toHaveLength(2); expect(h.host.submissions).toHaveLength(2); expect(h.host.publications).toHaveLength(0);
      expect(fingerprint(h.runtime.view().refused[0]!.admission)).toBe(fingerprint(refused.admission));
    } finally { h.close(); }
  });
  test("uncertain/partial reconciliation never commits or creates another SCC pass", async () => {
    const h = graphHarness();
    try { h.host.decision = "likely"; h.start(); const done = await h.complete(); expect(done.status).toBe("blocked"); expect(done.intents).toHaveLength(3); expect(h.host.publications).toHaveLength(0); expect(done.units[0]?.state).toBe("FAILED"); }
    finally { h.close(); }
  });
  test("readback mismatch is not COMMITTED; exact recovery neither reopens allocations nor changes publication bytes", async () => {
    const h = graphHarness();
    try {
      h.start(); await h.step(); await h.step(); h.host.corruptReadback = true;
      await expect(h.step()).rejects.toThrow("readback mismatch"); expect(h.runtime.view().status).not.toBe("complete"); expect(h.runtime.view().units[0]?.state).toBe("VALIDATING");
      const ids = h.runtime.view().intents.map(r => r.intent.executionId); h.host.corruptReadback = false;
      expect((await h.step()).status).toBe("complete"); expect(h.runtime.view().intents.map(r => r.intent.executionId)).toEqual(ids); expect(h.host.targets.size).toBe(1);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(1);
    } finally { h.close(); }
  });
});
