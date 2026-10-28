/**93 Manual expectations written before product implementation. SOURCE ONLY. */
import { expect, spyOn, test } from "bun:test";
import { t2Fixture, stageT2, collectT2, activateT2, reopenT2, nextCandidateT2 } from "./t2-fixtures";
import { document } from "./s1-source-fixtures";

/** Raw OWN before/after oracle, no expected post-state manufactured by SUT. */
function ownRows95(x: ReturnType<typeof t2Fixture>) {
  return ["g3_head", "g3_root", "g3_slots", "g3_origins", "g3_units", "g3_families", "g3_claims", "g3_outbox", "g3_authority", "ff8_events", "ff8_graph_streams"]
    .map(table => ({ table, rows: x.db.query(`SELECT * FROM ${table} ORDER BY rowid`).all() }));
}

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
  const x = t2Fixture({ parentExpiresAtEvent: 10000 }); try {
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
test("parent TTL exact equality at the real T2 append refuses specifically and rolls back every OWN row", () => {
  // Literal oracle: bootstrap/prepare/T1/stage = q4, attempt5 < E6,
  // T2 append6 = E6, whereas the distinct child controller remains valid.
  const E = 6, x = t2Fixture({ parentExpiresAtEvent: E }); try {
    const r = collectT2(x), before = ownRows95(x), cursor = x.events.cursor("author");
    expect(r.attempt.eventBefore + 2).toBe(E); expect(cursor.sequence).toBe(E - 1);
    expect(x.originState(r.candidate.generationId)).toBe("PENDING_DRAIN");
    const real = x.events.append.bind(x.events); const observed: { sequence: number | null } = { sequence: null };
    const spy = spyOn(x.events, "append").mockImplementation((...args) => {
      const event = real(...args); if (args[2] === "g3_generation_activated") observed.sequence = event.sequence; return event;
    });
    try { expect(() => activateT2(x, r)).toThrow("HOLD: parent controller expired after T2 append"); } finally { spy.mockRestore(); }
    expect(observed.sequence).toBe(E); expect(ownRows95(x)).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
    expect(x.store.read("author").barrierRootId).not.toBeNull();
  } finally { x.close(); }
});
test("fresh complete capture cannot launder an unknown publication as an allocated bootstrap journal entry", () => {
  const x = t2Fixture({ parentExpiresAtEvent: 10000 }); try {
    const staged = stageT2(x), head = x.store.read("author"), slots = x.store.slots("author");
    expect(x.finalHost.snapshot).toBeNull();
    expect(x.db.query("SELECT count(*) AS n FROM g3_authority WHERE kind IN ('activation-attempt','activation-record','activation-result')").get()).toEqual({ n: 0 });
    const event = x.events.append("author", "orphan:before-final-capture95", "g3_unowned_publication", x.events.cursor("author").time + 1, { owner: "not-admitted" });
    // Same attack as review94: all keys/cuts/current will be freshly captured,
    // but neither a covered key nor the allocation ref grants that operation.
    x.host93.note("own", "bootstrap", x.finalHost.allocation.ref, event.key);
    const cursorAfterAttack = x.events.cursor("author");
    expect(() => collectT2(x)).toThrow("HOLD: final OWN producer/operation/source/category join mismatch");
    expect(x.finalHost.snapshot).not.toBeNull(); expect(x.finalHost.current!.snapshotRef).toEqual(x.finalHost.snapshot!.ref);
    expect(x.finalHost.current!.journalRefs).toEqual(x.finalHost.journals.map(doc => doc.ref));
    expect(x.authority.activationCounter(x.store.read("author").rootAccountId).value.usedAttempts).toBe(0);
    expect(stageT2(x)).toEqual(staged); expect(x.store.read("author")).toEqual(head);
    expect(x.store.slots("author")).toEqual(slots); expect(x.events.cursor("author")).toEqual(cursorAfterAttack);
    expect(x.store.read("author").controlMode).toBe("DRAIN_NEW_FAMILIES");
    expect(x.db.query("SELECT count(*) AS n FROM g3_authority WHERE kind IN ('activation-record','activation-result')").get()).toEqual({ n: 0 });
  } finally { x.close(); }
});
test("LIVE journal mutation after a real successful append returning normally refuses and rolls back all OWN rows", () => {
  const x = t2Fixture({ parentExpiresAtEvent: 10000 }); try {
    const r = collectT2(x), before = ownRows95(x), oldJournal = x.finalHost.journals[0]!, oldCurrent = structuredClone(x.finalHost.current);
    const real = x.events.append.bind(x.events); let appended = false;
    const spy = spyOn(x.events, "append").mockImplementation((...args) => {
      const event = real(...args);
      if (args[2] === "g3_generation_activated") {
        appended = true;
        const value = JSON.parse(oldJournal.utf8); value.entries.push({ ...value.entries[0], sequence: ++value.lastSequence });
        x.finalHost.journals[0] = document(value.version, value); // no current/cut/revision update; return normally
      }
      return event;
    });
    try { expect(() => activateT2(x, r)).toThrow("HOLD: T2 complete external sources changed during append"); } finally { spy.mockRestore(); }
    expect(appended).toBe(true); expect(ownRows95(x)).toEqual(before);
    expect(x.finalHost.current).toEqual(oldCurrent); expect(x.finalHost.journals[0]!.ref).not.toEqual(oldJournal.ref);
    // External tampering is retained, not falsely claimed to have rolled back.
    expect(x.store.read("author").barrierRootId).not.toBeNull(); expect(x.originState(r.candidate.generationId)).toBe("PENDING_DRAIN");
  } finally { x.close(); }
});
test.each(["unknown-generation", "wrong-envelope-fingerprint", "unexplained-fence"] as const)("fresh honest controller registration %s refuses at the origin/fence scope join", defect => {
  const x = t2Fixture({ parentExpiresAtEvent: 10000 }); try {
    const before = x.store.read("author"), candidate = before.candidateRef!;
    // The known-generation fingerprint negative targets the POINTED candidate;
    // the fence negative targets the actual parent, not a stale/unknown head.
    const generationId = defect === "unknown-generation" ? `l8gen:${"f".repeat(64)}`
      : defect === "wrong-envelope-fingerprint" ? candidate.generationId : before.generationId;
    const fingerprint = defect === "wrong-envelope-fingerprint"
      ? (candidate.envelopeFingerprint === "f".repeat(64) ? "e".repeat(64) : "f".repeat(64)) : before.envelopeFingerprint;
    if (defect === "unknown-generation") expect(x.db.query("SELECT 1 FROM g3_origins WHERE mission=? AND generation=?").get(before.missionId, generationId)).toBeNull();
    if (defect === "wrong-envelope-fingerprint") expect(fingerprint).not.toBe(candidate.envelopeFingerprint);
    const ref = x.authority.register({ kind: "controller", missionId: before.missionId, owner: before.owner, generationId,
      envelopeFingerprint: fingerprint, controllerFence: before.controllerFence + (defect === "unexplained-fence" ? 1 : 0), expiresAtEvent: 10000 });
    // Honest acquisition of the API-created row, same reference encoding as the
    // existing private noteRegistration95, without exporting/changing that helper.
    const row = x.db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(ref);
    expect(row).not.toBeNull();
    x.host93.note("own", "register-source-controller", document("l8-host-registered-source95", { version: "l8-host-registered-source95", row }).ref,
      null, ["sourceCapabilities", "controllerLeases"]);
    expect(() => collectT2(x)).toThrow("HOLD: final controller origin/envelope/fence scope join mismatch");
    expect(x.finalHost.snapshot).not.toBeNull(); expect(x.finalHost.current!.snapshotRef).toEqual(x.finalHost.snapshot!.ref);
    expect(x.finalHost.current!.journalRefs).toEqual(x.finalHost.journals.map(doc => doc.ref));
    expect(x.authority.activationCounter(before.rootAccountId).value.usedAttempts).toBe(0);
    expect(x.store.read("author").barrierRootId).toBe(before.barrierRootId);
    expect(x.db.query("SELECT count(*) AS n FROM g3_authority WHERE kind IN ('activation-attempt','activation-record','activation-result')").get()).toEqual({ n: 0 });
  } finally { x.close(); }
});
