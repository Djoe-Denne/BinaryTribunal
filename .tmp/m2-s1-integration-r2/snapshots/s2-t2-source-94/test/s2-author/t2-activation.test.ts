/**93 Manual expectations written before product implementation. SOURCE ONLY. */
import { expect, spyOn, test } from "bun:test";
import { t2Fixture, collectT2, activateT2, reopenT2, nextCandidateT2 } from "./t2-fixtures";

test("T2 A-to-A commits only after full final inventory and real promised file, without new admission or budget/K effects", () => {
  const x = t2Fixture(); try {
    const r = collectT2(x), before = x.store.read("author"), slots = x.store.slots("author");
    expect(slots).toHaveLength(3); expect(slots.every(slot => slot.state === "AUTHORIZED")).toBe(true);
    const receipt = activateT2(x, r), after = x.store.read("author");
    expect(after.revision).toBe(before.revision + 1); expect(after.activePlanRevision).toBe(before.activePlanRevision + 1);
    expect(after.candidateRevision).toBe(before.candidateRevision + 1); expect(after.activeGenerationId).toBe(r.candidate.generationId);
    expect(after.candidateRef).toBeNull(); expect(after.candidateGenerationId).toBeNull(); expect(after.barrierRootId).toBeNull(); expect(after.controlMode).toBe("RUNNING");
    expect(after.knowledgeRootHash).toBe(before.knowledgeRootHash); expect(after.knowledgeLedgerDigest).toBe(before.knowledgeLedgerDigest);
    expect(after.budgetLedgerDigest).toBe(before.budgetLedgerDigest); expect(x.store.slots("author")).toEqual(slots);
    expect(x.store.admissions("author")).toEqual([]); expect(receipt.attemptRef).toEqual(r.attempt.document.ref);
    expect(x.db.query("SELECT count(*) AS n FROM g3_authority WHERE kind='activation-record'").get()).toEqual({ n: 1 });
  } finally { x.close(); }
});
test("append immutable activation attempt changes only control journal/counter, exact retry is free", () => {
  const x = t2Fixture(); try {
    const head = x.store.read("author"), slots = x.store.slots("author"), r = collectT2(x);
    expect(x.store.read("author")).toEqual(r.expectedHead); expect(r.expectedHead.revision).toBe(head.revision);
    expect(x.store.slots("author")).toEqual(slots); expect(r.attempt.value.activationAttemptOrdinal).toBe(1);
    const cursor = x.events.cursor("author");
    expect(x.store.appendActivationAttempt(x.handle, r.expectedHead, r.finalA, 4)).toEqual(r.attempt);
    expect(x.events.cursor("author")).toEqual(cursor);
  } finally { x.close(); }
});
test("a genuinely reserved family before T0 prevents minimal T2 even without an outbox", () => {
  const x = t2Fixture({ engaged: true }); try {
    const before = x.store.read("author"), slots = x.store.slots("author"); expect(() => collectT2(x)).toThrow();
    expect(x.store.read("author")).toEqual(before); expect(x.store.slots("author")).toEqual(slots); expect(x.store.admissions("author")).toEqual([]);
  } finally { x.close(); }
});
test.each(["unknown-category", "unknown-producer", "orphan", "revoked-source", "revoked-capability", "T1-handle", "bootstrap-handle", "B-native", "paused"] as const)("final %s refuses without lifting barrier or activating", defect => {
  const x = t2Fixture(); try {
    const r = collectT2(x); x.defect(defect, r);
    const before = x.store.read("author"), slots = x.store.slots("author"), cursor = x.events.cursor("author");
    expect(() => activateT2(x, r)).toThrow();
    expect(x.store.read("author")).toEqual(before); expect(x.store.slots("author")).toEqual(slots);
    expect(x.events.cursor("author")).toEqual(cursor); expect(x.store.read("author").barrierRootId).not.toBeNull();
  } finally { x.close(); }
});
test("stale attempt appends rejection outcome without changing immutable attempt/head/barrier/slots", () => {
  const x = t2Fixture(); try {
    const r = collectT2(x), immutable = r.attempt.document, slots = x.store.slots("author"); x.makeAttemptStale(r);
    const before = x.store.read("author"), result = activateT2(x, r);
    expect(result.outcome).toBe("REJECTED"); expect(x.store.read("author")).toEqual(before); expect(x.store.slots("author")).toEqual(slots);
    expect(x.store.activationAttempt(r.attempt.activationAttemptId).document).toEqual(immutable);
    expect(before.barrierRootId).not.toBeNull();
  } finally { x.close(); }
});
test.each(["throw-after-append", "expire-after-append"] as const)("T2 %s rolls back complete commit", fault => {
  const x = t2Fixture(); try {
    const r = collectT2(x), before = x.store.read("author"), cursor = x.events.cursor("author"), slots = x.store.slots("author");
    const real = x.events.append.bind(x.events), spy = spyOn(x.events, "append").mockImplementation((...args) => {
      const event = real(...args);
      if (args[2] === "g3_generation_activated") { if (fault === "throw-after-append") throw new Error("after real T2 append"); x.expireControllerAfterAppend(); }
      return event;
    });
    try { expect(() => activateT2(x, r)).toThrow(); } finally { spy.mockRestore(); }
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor); expect(x.store.slots("author")).toEqual(slots);
    expect(x.originState(r.candidate.generationId)).toBe("PENDING_DRAIN"); expect(x.originState(before.generationId)).toBe("ACTIVE");
  } finally { x.close(); }
});
test("reopen exact activation retry preserves deterministic committed receipt, not another activation", () => {
  const x = t2Fixture(); try {
    const r = collectT2(x), receipt = activateT2(x, r), head = x.store.read("author"), cursor = x.events.cursor("author");
    const y = reopenT2(x); try {
      expect(y.store.read("author")).toEqual(head); expect(activateT2(y, r)).toEqual(receipt); expect(y.events.cursor("author")).toEqual(cursor);
    } finally { y.close(); }
  } finally { x.close(); }
});
test.each(["absent", "altered", "false-readback", "unknown-writer"] as const)("actual isolated policy asset %s cannot produce final authority", asset => {
  const x = t2Fixture({ asset }); try { expect(() => collectT2(x)).toThrow(); expect(x.store.read("author").controlMode).toBe("DRAIN_NEW_FAMILIES"); }
  finally { x.close(); }
});
test("three coherent origins then fourth refused SPECIFICALLY quota3, without candidate-pointer or policy2 shortcut", () => {
  const x = t2Fixture(); try {
    expect(x.authority.preparationCounter(x.store.read("author").rootAccountId).value.used).toBe(2);
    activateT2(x, collectT2(x)); nextCandidateT2(x); expect(x.authority.preparationCounter(x.store.read("author").rootAccountId).value.used).toBe(3);
    activateT2(x, collectT2(x)); const head = x.store.read("author"), cursor = x.events.cursor("author");
    expect(head.candidateRef).toBeNull(); expect(head.controlMode).toBe("RUNNING");
    expect(x.db.query("SELECT count(*) AS n FROM g3_origins").get()).toEqual({ n: 3 });
    expect(x.store.slots("author")).toHaveLength(3); expect(x.store.slots("author").every(slot => slot.state === "AUTHORIZED")).toBe(true);
    expect(() => nextCandidateT2(x)).toThrow("HOLD: durable origin grant exhausted/reused");
    expect(x.store.read("author")).toEqual(head); expect(x.events.cursor("author")).toEqual(cursor);
    expect(x.authority.activationCounter(head.rootAccountId).value.usedAttempts).toBe(2);
    expect(x.authority.preparationCounter(head.rootAccountId).value.used).toBe(3);
  } finally { x.close(); }
});
test("root activation ceiling2 counts rejected attempts and does not reset with new case/current capture", () => {
  const x = t2Fixture(); try {
    const first = collectT2(x); x.makeAttemptStale(first); expect(activateT2(x, first).outcome).toBe("REJECTED");
    const second = collectT2(x); x.makeAttemptStale(second); expect(activateT2(x, second).outcome).toBe("REJECTED");
    const head = x.store.read("author"), cursor = x.events.cursor("author");
    expect(x.authority.activationCounter(head.rootAccountId).value.usedAttempts).toBe(2);
    expect(() => collectT2(x)).toThrow("HOLD: activation attempt root ceiling/stale chain");
    expect(x.store.read("author")).toEqual(head); expect(x.events.cursor("author")).toEqual(cursor); expect(head.barrierRootId).not.toBeNull();
  } finally { x.close(); }
});
test("revoked current activation counter refuses T2 without publishing another outcome or lifting barrier", () => {
  const x = t2Fixture(); try {
    const r = collectT2(x), before = x.store.read("author"), cursor = x.events.cursor("author"), slots = x.store.slots("author");
    x.authority.revokeTransitionDocument(x.authority.activationCounter(before.rootAccountId).document.ref);
    expect(() => activateT2(x, r)).toThrow("HOLD: transition source unavailable/revoked");
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor); expect(x.store.slots("author")).toEqual(slots);
  } finally { x.close(); }
});
