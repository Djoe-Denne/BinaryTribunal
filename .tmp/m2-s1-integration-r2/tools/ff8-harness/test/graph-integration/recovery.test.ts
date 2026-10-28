import { describe, expect, spyOn, test } from "bun:test";
import { dirname, join } from "node:path";
import { Store } from "../../src/store";
import { GraphStore } from "../../src/graph-store";
import { graphInputs, makeGraphIntent, makeGraphRun, type GraphIntentRecordV2 } from "../../src/graph-adapter";
import { graphAnchor, graphCycleProjection, graphEvents, prepareGraphExecution, preparedGraphRun } from "../../src/graph-engine";
import { canonical, fingerprint, hash } from "../../src/validation";
import { assertController } from "../../src/unit-lease";
import { graphHarness, graphSpec, preparationV2, snapshotFixture, sqliteContender, waitSignal } from "./fixture-driver";

function reserved(h: ReturnType<typeof graphHarness>, ttl = 10000) {
  h.start(); const graph = h.runtime.options.graph, run = preparedGraphRun(graph, h.missionId)!;
  if (run.version !== "l8-graph-run-v2") throw new Error("v2 fixture required");
  const authority = h.runtime.options.authority(), unit = run.prepared.planning.units[0]!, sub = unit.subIntents.find(s => s.role === "A")!;
  if (graph.unit(h.missionId, unit.unitId).state !== "READY") graph.transition(authority, unit.unitId, "READY", "real fixture preflight");
  const lease = graph.reserve(authority, unit.unitId, ttl, graph.reservationExpectation(h.missionId));
  const snapshot = h.store.load(h.missionId), record = makeGraphIntent(run, snapshot, unit, sub, lease, graphInputs(run, snapshot, sub), run.workers[0]!, authority.lease.token);
  if (record.version !== "l8-graph-intent-v2") throw new Error("wrong record version");
  return { graph, run, authority, unit, sub, lease, record };
}
function journalFingerprint(graph: GraphStore, missionId: string) { return fingerprint(graphEvents(graph, missionId)); }

describe("v2 original bytes and durable N across real public SQLite boundaries", () => {
  test("v1 anchor/run remain inspectable only, never migrated/resumed by v2", () => {
    const h = graphHarness(); const graph = new GraphStore(h.path);
    try {
      const snapshot = h.store.load(h.missionId), run = makeGraphRun(snapshot, graphSpec(h.request.snapshot)), lease = h.store.acquireLease(h.missionId, "offline-fixture-controller", 100, 1000000), authority = { lease, now: 100 };
      graph.events.append(h.missionId, `l8.graph.prepare:${run.cycle}`, "l8.graph.preparing", 100, { version: "l8-graph-preparing-v1", run });
      Object.assign(snapshot.cycles[0]!, graphCycleProjection(run), { graph: graphAnchor(run), frozen: true, fingerprint: run.prepared.fingerprint }); snapshot.stage = "analyse"; h.store.commit(snapshot, snapshot.revision, lease, 100);
      graph.putSnapshot(authority, run.prepared.snapshot as any); graph.putPartition(authority, run.prepared.partition as any); for (const unit of run.prepared.planning.units) graph.addUnit(authority, unit); graph.freezePlan(authority, run.prepared.planning.plan, run.prepared.planning.sidecar, run.prepared.planning.binding, 0);
      const before = graph.events.cursor(h.missionId); expect(h.engine.inspectGraph(h.missionId).status).toBe("read-only"); expect(h.engine.inspectGraph(h.missionId).readOnly).toBe(true);
      expect(() => h.reopen()).toThrow("v1 graph is inspectable/read-only"); expect(() => h.engine.attach(h.missionId)).toThrow("graph-owned"); expect(graph.events.cursor(h.missionId)).toEqual(before); expect(h.host.submissions).toHaveLength(0);
    } finally { graph.close(); h.close(); }
  });
  test("complete real codec bodies at C-1/C/C+1 without prompt padding or widening", () => {
    const calibration = graphHarness(); let size: number;
    try { const x = reserved(calibration); size = Buffer.byteLength(canonical(x.record.admission), "utf8"); } finally { calibration.close(); }
    for (const delta of [-1, 0, 1]) {
      const h = graphHarness(preparationV2(snapshotFixture(1), 4, size! + delta));
      try {
        const x = reserved(h), actual = Buffer.byteLength(canonical(x.record.admission), "utf8"), before = x.graph.events.cursor(h.missionId);
        expect(actual).toBe(size!); expect(x.run.prepared.planning.sidecar.envelopeBytesByUnit[x.unit.unitId]).toBe(size! + delta);
        if (delta < 0) { expect(() => prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, x.record)).toThrow("exceeds frozen C"); expect(x.graph.events.cursor(h.missionId)).toEqual(before); expect(x.graph.admission(x.record.intent.executionId)).toBeNull(); }
        else { const claim = prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, x.record); expect(claim.admissionUtf8Bytes).toBe(actual); expect(claim.C).toBe(size! + delta); expect(x.graph.admission(x.record.intent.executionId)?.state).toBe("PREPARED"); }
      } finally { h.close(); }
    }
  });
  test.each(["pin", "claim", "prepare"] as const)("throw after real public %s rolls back pin/claim/outbox/cursor", boundary => {
    const h = graphHarness();
    try {
      const x = reserved(h), before = x.graph.events.cursor(h.missionId), journal = journalFingerprint(x.graph, h.missionId);
      // Test-only infrastructure fault wrappers delegate to the REAL public API
      // then throw. No production fault hook, SQL or fabricated return/guard.
      let restore: () => void;
      if (boundary === "pin") { const real = x.graph.freezeAdmissionInputs.bind(x.graph); const spy = spyOn(x.graph, "freezeAdmissionInputs").mockImplementation((...args) => { real(...args); throw new Error("injected-public-pin-reply-loss"); }); restore = () => spy.mockRestore(); }
      else if (boundary === "claim") { const real = x.graph.events.append.bind(x.graph.events); const spy = spyOn(x.graph.events, "append").mockImplementation((...args) => { const result = real(...args); if (args[2] === "l8.graph2.execution-claimed") throw new Error("injected-public-claim-reply-loss"); return result; }); restore = () => spy.mockRestore(); }
      else { const real = x.graph.prepareAdmission.bind(x.graph); const spy = spyOn(x.graph, "prepareAdmission").mockImplementation((...args) => { real(...args); throw new Error("injected-public-prepare-reply-loss"); }); restore = () => spy.mockRestore(); }
      try { expect(() => prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, x.record)).toThrow("injected-public"); } finally { restore(); }
      expect(x.graph.events.cursor(h.missionId)).toEqual(before); expect(journalFingerprint(x.graph, h.missionId)).toBe(journal); expect(x.graph.admission(x.record.intent.executionId)).toBeNull();
      const alternate = structuredClone(x.record.intent.inputs); alternate.files.push({ path: join(dirname(h.path), "explicit-alternate-rollback-fixture.asm"), sha256: hash("alternate"), version: "alternate-v1", provenance: "rollback-only synthetic probe", kind: "native" });
      expect(x.graph.freezeAdmissionInputs(x.authority, x.lease, x.sub.subIntentId, alternate)).toBe(fingerprint(alternate));
      expect(() => x.graph.freezeAdmissionInputs(x.authority, x.lease, x.sub.subIntentId, x.record.intent.inputs)).toThrow();
      expect(graphEvents(x.graph, h.missionId).filter(e => e.kind === "l8.graph2.execution-claimed")).toHaveLength(0);
    } finally { h.close(); }
  });
  test("final family guard detects expiry CAUSED by all three appends, with complete rollback", () => {
    const h = graphHarness();
    try {
      const x = reserved(h, 4), before = x.graph.events.cursor(h.missionId); expect(x.lease.expiresAtEvent - before.sequence).toBe(3);
      const calls: string[] = [], real = x.graph.prepareAdmission.bind(x.graph), spy = spyOn(x.graph, "prepareAdmission").mockImplementation((...args) => { const result = real(...args); calls.push("real-outbox-prepared"); return result; });
      try { expect(() => prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, x.record)).toThrow(); } finally { spy.mockRestore(); }
      expect(calls).toEqual(["real-outbox-prepared"]); expect(x.graph.events.cursor(h.missionId)).toEqual(before); expect(x.graph.admission(x.record.intent.executionId)).toBeNull();
      expect(graphEvents(x.graph, h.missionId).some(e => ["admission_inputs_frozen", "l8.graph2.execution-claimed", "admission_prepared"].includes(e.kind))).toBe(false);
      const alternate = { ...x.record.intent.inputs, accessibleRules: ["alternate-rollback-rule"] };
      expect(x.graph.freezeAdmissionInputs(x.authority, x.lease, x.sub.subIntentId, alternate)).toBe(fingerprint(alternate));
    } finally { h.close(); }
  });
  test("commit reply lost, close BOTH connections/reopen, changed-time exact retry reads original time/body", () => {
    const h = graphHarness(); let reopenedStore: Store | undefined, reopenedGraph: GraphStore | undefined;
    try {
      const x = reserved(h); prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, x.record);
      const cursor = x.graph.events.cursor(h.missionId), journal = journalFingerprint(x.graph, h.missionId), claim = graphEvents(x.graph, h.missionId).find(e => e.kind === "l8.graph2.execution-claimed")!;
      expect(() => { throw new Error("simulated reply lost AFTER real outer commit"); }).toThrow("AFTER real outer commit");
      x.graph.close(); h.store.close(); reopenedStore = new Store(h.path); reopenedGraph = new GraphStore(h.path);
      const retry = prepareGraphExecution(reopenedGraph, reopenedStore, x.run, { ...x.authority, now: x.authority.now + 50 }, x.lease, x.record);
      expect(retry.record).toEqual(x.record); expect(reopenedGraph.events.cursor(h.missionId)).toEqual(cursor); expect(journalFingerprint(reopenedGraph, h.missionId)).toBe(journal);
      expect(graphEvents(reopenedGraph, h.missionId).find(e => e.key === claim.key)?.time).toBe(claim.time); expect(reopenedGraph.admission(x.record.intent.executionId)?.state).toBe("PREPARED"); expect(h.host.submissions).toHaveLength(0);
    } finally { reopenedGraph?.close(); reopenedStore?.close(); h.close(); }
  });
  test("committed N is not refunded by never-sent absence or new generation/controller/pass", () => {
    const h = graphHarness();
    try {
      const x = reserved(h); prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, x.record);
      for (const edit of [(r: GraphIntentRecordV2) => { r.admission.command.prompt += "second body"; }, (r: GraphIntentRecordV2) => { r.admission.executionId += ":second-ID"; }, (r: GraphIntentRecordV2) => { (r.admission.command.metadata as any).pass = 2; }, (r: GraphIntentRecordV2) => { r.controllerToken++; }]) {
        const changed = structuredClone(x.record); edit(changed); const cursor = x.graph.events.cursor(h.missionId); expect(() => prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, changed)).toThrow(); expect(x.graph.events.cursor(h.missionId)).toEqual(cursor);
      }
      x.graph.proveTerminal(x.authority, x.unit.unitId, x.record.intent.executionId, "absent", { executionId: x.record.intent.executionId, state: "absent", requestDigest: fingerprint(x.record.admission), quiescent: true, source: "offline fixture public never-sent proof, not a native absence" });
      x.graph.leases.releaseProven(x.authority, x.lease); x.graph.transition(x.authority, x.unit.unitId, "READY", "explicit new-generation fixture probe");
      const nextLease = x.graph.reserve(x.authority, x.unit.unitId, 10000, x.graph.reservationExpectation(h.missionId)), snapshot = h.store.load(h.missionId);
      const next = makeGraphIntent(x.run, snapshot, x.unit, x.sub, nextLease, graphInputs(x.run, snapshot, x.sub), x.run.workers[0]!, x.authority.lease.token) as GraphIntentRecordV2;
      const before = x.graph.events.cursor(h.missionId); expect(() => prepareGraphExecution(x.graph, h.store, x.run, x.authority, nextLease, next)).toThrow("spent execution slot"); expect(x.graph.events.cursor(h.missionId)).toEqual(before); expect(x.graph.admission(next.intent.executionId)).toBeNull();
      const controller = h.store.acquireLease(h.missionId, x.authority.lease.owner, x.authority.now + 50, 1000000); expect(controller.token).not.toBe(x.authority.lease.token);
      expect(() => prepareGraphExecution(x.graph, h.store, x.run, { lease: controller, now: x.authority.now + 51 }, nextLease, next)).toThrow();
      expect(graphEvents(x.graph, h.missionId).filter(e => e.kind === "l8.graph2.execution-claimed")).toHaveLength(1);
    } finally { h.close(); }
  });
  test("two independent public connections serialize the same slot and refuse a changed execution", () => {
    const h = graphHarness(); let other: GraphStore | undefined, store: Store | undefined;
    try {
      const x = reserved(h); other = new GraphStore(h.path); store = new Store(h.path);
      prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, x.record);
      const before = other.events.cursor(h.missionId); prepareGraphExecution(other, store, x.run, { ...x.authority, now: 120 }, x.lease, x.record); expect(other.events.cursor(h.missionId)).toEqual(before);
      const changed = structuredClone(x.record); changed.admission.command.prompt += "cannot replace"; expect(() => prepareGraphExecution(other!, store!, x.run, x.authority, x.lease, changed)).toThrow();
      expect(graphEvents(other, h.missionId).filter(e => e.kind === "l8.graph2.execution-claimed")).toHaveLength(1);
      // Sequential serialization is NOT called lock contention. Actual overlapping
      // BEGIN/atomic ordinal proof is the separately retained/parent-replayed spike.
    } finally { other?.close(); store?.close(); h.close(); }
  });
  test.each([false, true])("actual overlapping BEGIN on production composition (stale generation=%s)", async stale => {
    const h = graphHarness();
    try {
      const x = reserved(h), signal = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 6));
      const lease = stale ? { ...x.lease, token: x.lease.token + 1 } : x.lease;
      const record = stale ? makeGraphIntent(x.run, h.store.load(h.missionId), x.unit, x.sub, lease, graphInputs(x.run, h.store.load(h.missionId), x.sub), x.run.workers[0]!, x.authority.lease.token) : x.record;
      const other = sqliteContender({ path: h.path, run: x.run, authority: { ...x.authority, now: 120 }, lease, record }, signal); waitSignal(signal, 0, 1);
      let beforeCommitOrder = 0, outerError: unknown;
      try { x.graph.db.transaction(() => {
        prepareGraphExecution(x.graph, h.store, x.run, x.authority, x.lease, x.record);
        Atomics.store(signal, 3, 1); Atomics.store(signal, 1, 1); Atomics.notify(signal, 1); waitSignal(signal, 2, 1);
        Atomics.wait(signal, 4, 0, 350); // actual synchronous write lock hold
        assertController(x.graph.db, x.authority, h.missionId); x.graph.leases.assert(x.lease, x.authority);
        beforeCommitOrder = Atomics.add(signal, 5, 1) + 1;
      }).immediate(); } catch (error) { outerError = error; }
      Atomics.store(signal, 3, 0); const response = await other.result; await other.exit;
      console.log(`L8_SQLITE_CONTENTION ${JSON.stringify({ path: h.path, staleGeneration: stale, beforeCommitOrder, response, outerError: outerError ? String(outerError) : null })}`);
      if (outerError) throw outerError;
      expect(response.fatal).toBeUndefined(); expect(response.closed).toBe(true); expect(response.ok).toBe(!stale);
      expect(response.timing.heldBeforeBegin).toBe(1); expect(response.timing.beginOrder).toBeLessThan(beforeCommitOrder); expect(response.timing.enterOrder).toBeGreaterThan(beforeCommitOrder);
      expect(Number(BigInt(response.timing.endNs) - BigInt(response.timing.beginNs))).toBeGreaterThanOrEqual(250000000);
      expect(graphEvents(x.graph, h.missionId).filter(e => e.kind === "l8.graph2.execution-claimed")).toHaveLength(1);
      expect(x.graph.admission(x.record.intent.executionId)?.state).toBe("PREPARED"); if (stale) expect(response.admission).toBeNull();
    } finally { h.close(); }
  }, 30000);
  test.each([false, true])("crash around real anchor CAS (commit actually applied=%s) resumes original run", committed => {
    const h = graphHarness();
    try {
      const real = h.store.commit.bind(h.store), spy = spyOn(h.store, "commit").mockImplementation((...args) => { if (committed) real(...args); throw new Error("injected anchor reply/crash"); });
      try { expect(() => h.start()).toThrow("injected anchor"); } finally { spy.mockRestore(); }
      expect(h.host.submissions).toHaveLength(0);
      const g = new GraphStore(h.path); let original: string; try { original = preparedGraphRun(g, h.missionId)!.fingerprint; } finally { g.close(); }
      const runtime = h.reopen(); expect(runtime.view().runFingerprint).toBe(original); expect(h.store.load(h.missionId).cycles).toHaveLength(1); expect(h.store.load(h.missionId).revision).toBe(1);
      expect(runtime.view().intents).toHaveLength(0);
    } finally { h.close(); }
  });
  test("stale preparatory orphan does not become a new plan or widen revision", () => {
    const h = graphHarness();
    try {
      const spy = spyOn(h.store, "commit").mockImplementation(() => { throw new Error("before CAS"); }); try { expect(() => h.start()).toThrow("before CAS"); } finally { spy.mockRestore(); }
      const s = h.store.load(h.missionId), lease = h.store.acquireLease(h.missionId, "offline-fixture-controller", 120, 1000000); h.store.commit(s, s.revision, lease, 120);
      expect(() => h.reopen()).toThrow("non-activating orphan"); expect(h.host.submissions).toHaveLength(0); expect(h.store.load(h.missionId).cycles[0]?.frozen).toBe(false);
    } finally { h.close(); }
  });
  test.each(["recordParentAttestation", "validateUnit", "commitReadback", "recordArtifactBinding", "recordKnowledgeReceipt"] as const)("real %s applied then reply lost: original validation/publication/IDs recover", async boundary => {
    const h = graphHarness();
    try {
      h.start(); await h.step(); await h.step(); const graph = h.runtime.options.graph, real = (graph[boundary] as any).bind(graph); let once = true;
      const spy = spyOn(graph, boundary as any).mockImplementation((...args: any[]) => { const result = real(...args); if (once) { once = false; throw new Error(`injected AFTER real ${boundary}`); } return result; });
      try { await expect(h.step()).rejects.toThrow(`AFTER real ${boundary}`); } finally { spy.mockRestore(); }
      const ids = h.runtime.view().intents.map(r => r.intent.executionId); h.reopen(); expect((await h.complete()).status).toBe("complete"); expect(h.runtime.view().intents.map(r => r.intent.executionId)).toEqual(ids);
      expect(h.host.submissions).toHaveLength(3); expect(h.host.targets.size).toBe(1); expect(h.host.publications).toHaveLength(1); expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(1);
    } finally { h.close(); }
  }, 15000);
  test("publication effect before lost write reply is retried with exact original target/digest/bytes", async () => {
    const h = graphHarness();
    try {
      h.host.loseWrites.add(1); h.start(); await h.step(); await h.step(); await expect(h.step()).rejects.toThrow("applied then reply lost");
      const target = [...h.host.targets]; h.reopen(); expect((await h.complete()).status).toBe("complete"); expect([...h.host.targets]).toEqual(target); expect(h.host.submissions).toHaveLength(3); expect(new Set(h.host.publications).size).toBe(1);
    } finally { h.close(); }
  });
  test("typed recoverable rejection retries exact original body after backoff without N charge", async () => {
    const h = graphHarness(preparationV2(snapshotFixture(1), 1));
    try {
      h.host.submissionFailures.push("quota"); h.start(); await h.step(); const first = h.runtime.view().intents[0]!, events = graphEvents(h.runtime.options.graph, h.missionId), claim = events.find(e => e.kind === "l8.graph2.execution-claimed")!;
      expect(h.host.submissions).toHaveLength(1); expect(h.runtime.options.graph.admission(first.intent.executionId)?.state).toBe("PREPARED");
      await h.runtime.step(); expect(h.host.submissions).toHaveLength(1); h.advance(20); await h.runtime.step();
      expect(h.host.submissions[0]?.command).toEqual(h.host.submissions[1]?.command); expect(h.host.submissions[1]?.command.executionId).toBe(first.intent.executionId);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.key === claim.key)).toEqual([claim]); expect((await h.complete()).status).toBe("complete");
    } finally { h.close(); }
  });
  test("definitive input rejection stops the family, but cannot refund/reallocate its one execution", async () => {
    const h = graphHarness();
    try {
      h.host.submissionFailures.push("input"); h.start(); const view = await h.step(); expect(view.status).toBe("blocked"); expect(view.intents).toHaveLength(1); expect(h.host.submissions).toHaveLength(1);
      const graph = h.runtime.options.graph, record = view.intents[0]!; expect(graph.admission(record.intent.executionId)?.state).toBe("REJECTED"); expect(graph.leases.get(h.missionId, record.unitId)?.state).toBe("released");
      await h.step(); expect(h.runtime.view().intents).toHaveLength(1); expect(graphEvents(graph, h.missionId).filter(e => e.kind === "l8.graph2.execution-claimed")).toHaveLength(1);
    } finally { h.close(); }
  });
  test("category alone is ambiguous, never a v6 no-worker/release proof", async () => {
    const h = graphHarness();
    try {
      h.host.executions.submit = async () => { throw { category: "input", recoverable: false, message: "not an execution_rejected protocol reply" }; };
      h.start(); const view = await h.step(), graph = h.runtime.options.graph; expect(view.intents).toHaveLength(2); expect(view.intents.every(r => graph.admission(r.intent.executionId)?.state === "AMBIGUOUS")).toBe(true);
      expect(graph.leases.get(h.missionId, view.units[0]!.unitId)?.state).toBe("active"); expect(h.host.publications).toHaveLength(0); expect(view.resultIds).toHaveLength(0);
    } finally { h.close(); }
  });
  test("accepted-but-lost reply reconciles original execution; fencing retains late artifacts only", async () => {
    const h = graphHarness(preparationV2(snapshotFixture(1), 2));
    try {
      h.host.submissionFailures.push("ambiguous"); h.start(); await h.step(); const original = h.runtime.view().intents[0]!; expect(h.runtime.options.graph.admission(original.intent.executionId)?.state).toBe("AMBIGUOUS");
      await h.step(); expect(h.host.submissions.filter(s => s.command.executionId === original.intent.executionId)).toHaveLength(1); expect((await h.complete()).status).toBe("complete");
    } finally { h.close(); }
    const late = graphHarness(preparationV2(snapshotFixture(1), 2));
    try {
      late.request.executionTemplate.settings.familyTtlEvents = 30; late.start(); await late.step(); const graph = late.runtime.options.graph, unit = late.runtime.view().units[0]!, lease = graph.leases.get(late.missionId, unit.unitId)!;
      while (graph.events.cursor(late.missionId).sequence < lease.expiresAtEvent) { const seq = graph.events.cursor(late.missionId).sequence; graph.events.append(late.missionId, `fixture-expiry:${seq}`, "fixture.neutral", 120, { fixture: true }); }
      const view = await late.step(); expect(view.status).toBe("blocked"); expect(view.resultIds).toHaveLength(0); expect(view.lateResultIds).toHaveLength(2); expect(view.intents).toHaveLength(2);
      expect(graphEvents(graph, late.missionId).filter(e => e.kind === "l8.graph2.late-result")).toHaveLength(2); expect(late.host.publications).toHaveLength(0);
    } finally { late.close(); }
  });
});
