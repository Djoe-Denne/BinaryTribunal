/**108 Manual107 expectations BEFORE product implementation. SOURCE ONLY. */
import { expect, spyOn, test } from "bun:test";
import { crossEpochFixture108, finishCrossEpoch108, reopenCrossEpoch108, invalidateCrossEpoch108 } from "./cross-epoch-fixtures";
import { collectT2 } from "./t2-fixtures";

test("crossEpoch preserves real A SPENT/B BURNED/R ENCUMBERED and terminal history through T2/reopen", () => {
  const x = crossEpochFixture108(); try {
    const before = x.store.read("author"), slots = x.store.slots("author"), history = x.rawHistory();
    expect(x.lease.expiresAtEvent).toBe(1000);
    expect(slots.map(s => s.state).sort()).toEqual(["BURNED", "ENCUMBERED", "SPENT"]);
    expect(slots.map(s => [JSON.parse(s.grant_ref).slot.role, s.state]).sort()).toEqual([["A", "SPENT"], ["B", "BURNED"], ["R", "ENCUMBERED"]]);
    expect(slots.find(s => JSON.parse(s.grant_ref).slot.role === "R")!.claim_utf8).toBeNull();
    expect(slots.map(s => [s.cap, s.debit])).toEqual([[100000, 100000], [100000, 100000], [100000, 100000]]);
    expect(slots.reduce((n, s) => n + s.debit, 0)).toBe(300000);
    expect(x.a.status).toBe("PREPARED"); expect(x.a.image.admissionUtf8Bytes).toBeLessThanOrEqual(100000);
    expect(x.b.status).toBe("BURNED"); expect(x.b.image.admissionUtf8Bytes).toBeGreaterThan(100000);
    expect(x.store.admissions("author")).toHaveLength(1); expect(x.store.claims("author")).toEqual([]);
    const pool = x.store.resourceInventory("pool:synthetic:shared-74"); expect(pool.poolRevision).toBe(2);
    expect(pool.active).toEqual([]); expect(pool.allocations).toHaveLength(1); expect(pool.released).toHaveLength(1);
    const result = finishCrossEpoch108(x); expect(result.outcome).toBe("COMMITTED");
    const after = x.store.read("author"); expect(after.revision).toBe(before.revision + 1);
    expect(after.knowledgeLedgerDigest).toBe(before.knowledgeLedgerDigest); expect(after.budgetLedgerDigest).toBe(before.budgetLedgerDigest);
    expect(x.store.slots("author")).toEqual(slots); expect(x.rawHistory()).toEqual(history);
    expect(x.originState(x.lease.generationId)).toBe("RETIRED");
    expect(x.db.query("SELECT state FROM g3_units WHERE generation=? AND unit=?").get(x.lease.generationId, x.unitId)).toEqual({ state: "RETIRED" });
    expect(x.childStates()).toEqual(["BLOCKED"]); expect(x.store.admissions("author")).toHaveLength(1);
    const plan = JSON.parse(x.preparation!.child.origin.envelope.planning.utf8);
    expect(plan.plan.selectedUnitIds).toEqual([]); expect(plan.sidecar.admissionBudget.selectedTotalAdmissionUtf8Bytes).toBe(0);
    expect(() => x.store.reserveFamily(x.handle, after, x.unitId, 1000, x.events.cursor("author").time + 1, x.acquisition)).toThrow("unselected unit or prerequisite publication unavailable");
    const y = reopenCrossEpoch108(x); try {
      expect(y.store.slots("author")).toEqual(slots); expect(y.rawHistory()).toEqual(history);
      expect(finishCrossEpoch108(y)).toEqual(result); expect(y.childStates()).toEqual(["BLOCKED"]);
    } finally { y.close(); }
  } finally { x.close(); }
});
test("crossEpoch exact A retry before Q is a free immutable identity read", () => {
  const x = crossEpochFixture108(); try { expect(x.retryUnchanged).toBe(true); expect(x.store.slots("author").filter(s => s.state === "SPENT")).toHaveLength(1); }
  finally { x.close(); }
});
test.each(["Q-missing", "Q-wrong-body", "Q-wrong-attempt", "Q-wrong-controller-fence", "Q-wrong-family-fence", "terminal-but-worker-held"] as const)("crossEpoch %s cannot retire or activate", defect => {
  const x = crossEpochFixture108({ defect }); try {
    expect(x.failedProofCause).toBe(defect === "Q-wrong-body" ? "observation exact body/generation scope"
      : defect === "Q-wrong-attempt" ? "Q requires exact attempt and positive quiescence" : null);
    if (defect.includes("fence")) expect(x.lastObservationEffect()).toBe("audit_only");
    expect(() => finishCrossEpoch108(x)).toThrow("HOLD: terminal history requires released families");
    expect(x.store.read("author").barrierRootId).not.toBeNull(); expect(x.activationRecords()).toBe(0);
  } finally { x.close(); }
});
test.each(["Q-revoked-live", "late-accepted-contradiction", "unknown-category", "unknown-source-or-producer"] as const)("crossEpoch fresh final %s refuses before activation", defect => {
  const x = crossEpochFixture108(); try {
    invalidateCrossEpoch108(x, defect); const slots = x.store.slots("author");
    const cause = defect === "Q-revoked-live" ? "retained fixture source unavailable/revoked"
      : defect === "late-accepted-contradiction" ? "late accepted evidence contradicts Q"
      : defect === "unknown-category" ? "closed resource record required" : "terminal history has unadmitted operation/producer";
    expect(() => finishCrossEpoch108(x)).toThrow(cause); expect(x.store.slots("author")).toEqual(slots);
    expect(x.store.read("author").barrierRootId).not.toBeNull(); expect(x.activationRecords()).toBe(0);
  } finally { x.close(); }
});
test("crossEpoch committed cut survives later Q revocation but never authorizes fresh consumption", () => {
  const x = crossEpochFixture108(); try {
    const result = finishCrossEpoch108(x), slots = x.store.slots("author"); x.authority.revoke(x.qRef!);
    const y = reopenCrossEpoch108(x); try {
      expect(finishCrossEpoch108(y)).toEqual(result); expect(y.store.slots("author")).toEqual(slots);
      expect(() => y.freshConsumption()).toThrow(); expect(y.activationRecords()).toBe(1);
    } finally { y.close(); }
  } finally { x.close(); }
});
test("crossEpoch Q revoked after the real T2 append is re-read LIVE and rolls back the entire attempt effect", () => {
  const x = crossEpochFixture108(); try {
    x.ready108 = collectT2(x);
    const before = { head: x.store.read("author"), slots: x.store.slots("author"), history: x.rawHistory(), cursor: x.events.cursor("author"),
      proof: x.db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(x.qRef!) };
    const real = x.events.append.bind(x.events); let actuallyRevoked = false;
    const spy = spyOn(x.events, "append").mockImplementation((...args) => {
      const event = real(...args);
      if (args[2] === "g3_generation_activated") {
        x.authority.revoke(x.qRef!);
        actuallyRevoked = (x.db.query("SELECT revoked FROM g3_authority WHERE record_ref=?").get(x.qRef!) as { revoked: number }).revoked === 1;
      }
      return event;
    });
    try { expect(() => finishCrossEpoch108(x)).toThrow("retained fixture source unavailable/revoked"); } finally { spy.mockRestore(); }
    expect(actuallyRevoked).toBe(true); expect(x.activationRecords()).toBe(0);
    expect({ head: x.store.read("author"), slots: x.store.slots("author"), history: x.rawHistory(), cursor: x.events.cursor("author"),
      proof: x.db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(x.qRef!) }).toEqual(before);
  } finally { x.close(); }
});
test("crossEpoch late HOST ACK after retirement is durable audit DATA without borrowing the old controller", () => {
  const x = crossEpochFixture108(); try {
    const result = finishCrossEpoch108(x), slots = x.store.slots("author");
    x.authority.register({ ...x.q, attempt: 1, state: "accepted", quiescent: false });
    // Do not call reconcile with the retired controller as if it were current.
    // The source row is evidence of contradiction, never an accepted receipt.
    const y = reopenCrossEpoch108(x); try {
      expect(finishCrossEpoch108(y)).toEqual(result); expect(y.store.admissions("author")[0]!.receipt).toBeNull();
      expect(() => y.freshConsumption()).toThrow("late accepted evidence contradicts Q");
      expect(y.store.slots("author")).toEqual(slots); expect(y.activationRecords()).toBe(1);
    } finally { y.close(); }
  } finally { x.close(); }
});
