/**120 Manual118/119 expectations written before product changes. No top-level fixture. */
import { expect, spyOn, test } from "bun:test";
import { replacementFixture120, stageReplacement120, swapReplacement120, replacementCap120, reopenReplacement120,
  replacementFault120, contendReplacement120, freshReplacementFinal120 } from "./replacement-fixtures";
import { activateT2 } from "./t2-fixtures";

test("replacement stage charges origin3 without pointing/authorizing it and preserves the full active root", () => {
  const x = replacementFixture120(); try {
    const before = x.snapshot(), h = x.store.read("author"), s = stageReplacement120(x), after = x.store.read("author");
    expect(after.revision).toBe(h.revision); expect(after.candidateRevision).toBe(h.candidateRevision);
    expect(after.candidateRef).toEqual(h.candidateRef); expect(after.generationId).toBe(h.generationId);
    expect(after.preparationCounterRef).not.toEqual(h.preparationCounterRef); expect(after.inventoryRevision).toBe(h.inventoryRevision + 1);
    expect(x.authority.preparationCounter(h.rootAccountId).value.used).toBe(3);
    expect(x.originState(s.value.newCandidateRef.generationId)).toBe("PREPARED");
    expect(x.store.slots("author")).toEqual(before.slots); expect(x.activeWork()).toEqual(before.activeWork);
    expect(x.replacementCounter().value.used).toBe(0); expect(x.cut()).toEqual(before.cut);
    expect(x.newUnitStates()).toEqual(["STAGED"]); expect(x.store.read("author").controlMode).toBe("DRAIN_NEW_FAMILIES");
  } finally { x.close(); }
});
test("replacement staged reopen retains OLD and cannot reserve/admit NEW or select latest on load", () => {
  const x = replacementFixture120(); try { stageReplacement120(x); const before = x.snapshot(), y = reopenReplacement120(x); try {
    expect(y.snapshot()).toEqual(before); expect(y.newUnitStates()).toEqual(["STAGED"]);
    expect(() => y.store.reserveFamily(y.handle, y.store.read("author"), y.newUnitId(), 20, y.now(), y.acquisition)).toThrow("durable drain blocks new families");
    expect(y.store.read("author").candidateRef).toEqual(y.oldCandidate); expect(y.replacementCounter().value.used).toBe(0);
  } finally { y.close(); } } finally { x.close(); }
});
test("replacement exact preparation lost reply retries for free at ceiling3", () => {
  const x = replacementFixture120(); try { const s = stageReplacement120(x), before = x.snapshot(); expect(stageReplacement120(x)).toEqual(s); expect(x.snapshot()).toEqual(before); }
  finally { x.close(); }
});
test("replacement swap preserves barrier/T1/rights and archives OLD positively without RUNNING", () => {
  const x = replacementFixture120(); try { stageReplacement120(x); const before = x.snapshot(), h = x.store.read("author"), r = swapReplacement120(x), after = x.store.read("author");
    expect(after.revision).toBe(h.revision + 1); expect(after.candidateRevision).toBe(h.candidateRevision + 1);
    expect(after.inventoryRevision).toBe(h.inventoryRevision + 1); expect(after.preparationCounterRef).toEqual(h.preparationCounterRef);
    expect(after.candidateRef).toEqual(x.stage!.value.newCandidateRef); expect(after.barrierRootId).toBe(h.barrierRootId);
    expect(after.controlMode).toBe("DRAIN_NEW_FAMILIES"); expect(after.generationId).toBe(h.generationId);
    expect(x.originState(x.oldCandidate.generationId)).toBe("ABORTED"); expect(x.newUnitStates()).toEqual(["STAGED"]);
    expect(x.replacementCounter().value.used).toBe(1); expect(x.cut()).toEqual(before.cut);
    expect(x.activeWork()).toEqual(before.activeWork); expect(x.store.slots("author")).toEqual(before.slots);
    expect(r.value.oldCandidateRef).toEqual(x.oldCandidate); expect(r.value.newCandidateRef).toEqual(after.candidateRef);
  } finally { x.close(); }
});
test("replacement exact CAS lost reply and reopen replay one immutable result without recharge", () => {
  const x = replacementFixture120(); try { stageReplacement120(x); const cap = replacementCap120(x, "lost-reply"), r = swapReplacement120(x, cap), before = x.snapshot();
    expect(swapReplacement120(x, cap)).toEqual(r); expect(x.snapshot()).toEqual(before);
    const y = reopenReplacement120(x); try { expect(swapReplacement120(y, y.authority.resolveReplacement120(cap.ref))).toEqual(r); expect(y.snapshot()).toEqual(before); } finally { y.close(); }
  } finally { x.close(); }
});
test.each(["stale-old", "stale-head", "stale-fence", "stale-inventory", "same-hc-old-preparation", "current-unknown", "current-revoked", "forged-cap", "wrong-purpose", "revoked-cap", "counter-unknown", "B-native"] as const)("replacement %s refuses specifically without partial swap", defect => {
  const x = replacementFixture120(); try { stageReplacement120(x); const cap = replacementCap120(x, defect), action = replacementFault120(x, cap, defect), before = x.snapshot();
    expect(action).toThrow(defect.startsWith("stale") || defect === "same-hc-old-preparation" ? "replacement full preimage" : defect.includes("current") ? "replacement HOST" : defect === "counter-unknown" ? "replacement counter" : "replacement capability");
    expect(x.snapshot()).toEqual(before); expect(x.cut()).toEqual(x.originalCut);
  } finally { x.close(); }
});
test("replacement fourth origin refuses quota3 and retains the already charged unpointed stage", () => {
  const x = replacementFixture120(); try { stageReplacement120(x); const request = x.fourthStage(), before = x.snapshot();
    expect(request).toThrow("durable origin grant exhausted"); expect(x.snapshot()).toEqual(before);
    expect(x.authority.preparationCounter(x.store.read("author").rootAccountId).value.used).toBe(3); expect(x.replacementCounter().value.used).toBe(0);
  } finally { x.close(); }
});
test.each(["prepare", "swap"] as const)("replacement %s postappend LIVE revocation rolls back the whole transaction", phase => {
  const x = replacementFixture120(); try { if (phase === "swap") stageReplacement120(x); const cap = phase === "swap" ? replacementCap120(x, "rollback") : null, before = x.snapshot();
    const real = x.events.append.bind(x.events); let hit = false;
    const spy = spyOn(x.events, "append").mockImplementation((...args) => { const e = real(...args); if (args[2] === (phase === "prepare" ? "g3_replacement_prepared" : "g3_candidate_replaced")) {
      hit = true; if (x.replacementPort.epoch) Atomics.add(x.replacementPort.epoch, 0, 1); x.replacementPort.records!.current = null;
    } return e; });
    try { expect(() => phase === "prepare" ? stageReplacement120(x) : swapReplacement120(x, cap!)).toThrow("replacement HOST"); } finally { spy.mockRestore(); }
    expect(hit).toBe(true); expect(x.snapshot()).toEqual(before);
  } finally { x.close(); }
});
test("replacement old READY final/attempt cannot activate NEW; fresh final binds replacement and root attempt2", () => {
  const x = replacementFixture120({ oldFinal: true }); try { stageReplacement120(x); swapReplacement120(x);
    const rejected = activateT2(x, x.oldFinal!); expect(rejected.outcome).toBe("REJECTED"); expect(rejected.reason).toBe("STALE_CONTROL_PREIMAGE");
    const fresh = freshReplacementFinal120(x); expect(fresh.attempt.value.replacementRecordRef).toEqual(x.swap!.document.ref);
    expect(fresh.attempt.value.activationAttemptOrdinal).toBe(2); expect(activateT2(x, fresh).outcome).toBe("COMMITTED");
    expect(x.authority.activationCounter(x.store.read("author").rootAccountId).value.usedAttempts).toBe(2);
    expect(x.authority.preparationCounter(x.store.read("author").rootAccountId).value.used).toBe(3);
  } finally { x.close(); }
});
test("replacement two genuinely overlapping distinct demands on SAME NEW3 produce one swap/charge and a stale loser", async () => {
  const x = replacementFixture120(); try { stageReplacement120(x); const result = await contendReplacement120(x);
    expect(result.actualBusyDuringWinnerTransaction).toBe(true); expect(result.secondBeginBeforeWinnerCommit).toBe(true);
    expect(result.winnerCommittedBeforeLoserReturned).toBe(true); expect(result.loserError).toContain("replacement full preimage");
    expect(result.requestIdentities).toEqual(["contender-A", "contender-B"]); expect(result.capRefsDistinct).toBe(true);
    expect(x.replacementCounter().value.used).toBe(1); expect(x.authority.preparationCounter(x.store.read("author").rootAccountId).value.used).toBe(3);
    expect(x.events.read("author").filter(e => e.kind === "g3_candidate_replaced")).toHaveLength(1);
  } finally { x.close(); }
}, 15000);
test("replacement old work/cut stays immutable and a new final capture cannot omit staged/ABORTED origins", () => {
  const x = replacementFixture120(); try { stageReplacement120(x); swapReplacement120(x); const before = x.activeWork();
    const r = freshReplacementFinal120(x); expect(x.activeWork()).toEqual(before); expect(x.cut()).toEqual(x.originalCut);
    expect(r.candidate).toEqual(x.stage!.value.newCandidateRef); expect(x.finalHost.snapshot!.utf8).toContain("ABORTED");
    expect(x.store.admissions("author")).toEqual([]); expect(x.newUnitStates()).toEqual(["STAGED"]);
  } finally { x.close(); }
});
test.each(["prepare", "swap"] as const)("replacement %s TTL equality after its real append is forbidden and rolls back", phase => {
  const x = replacementFixture120({ parentExpiresAtEvent: phase === "prepare" ? 4 : 5 }); try {
    if (phase === "swap") stageReplacement120(x); const cap = phase === "swap" ? replacementCap120(x, "ttl") : null, before = x.snapshot();
    expect(x.events.cursor("author").sequence).toBe(phase === "prepare" ? 3 : 4);
    expect(() => phase === "prepare" ? stageReplacement120(x) : swapReplacement120(x, cap!)).toThrow("current fixture controller unavailable"); expect(x.snapshot()).toEqual(before);
    expect(x.authority.preparationCounter(x.store.read("author").rootAccountId).value.used).toBe(phase === "prepare" ? 2 : 3);
  } finally { x.close(); }
});
test("replacement genuinely absent T1 barrier refuses before any durable stage or charge", () => {
  const x = replacementFixture120({ withoutBarrier: true }); try { const before = x.snapshot();
    expect(x.store.read("author").barrierRootId).toBeNull(); expect(x.cut()).toBeNull();
    expect(() => stageReplacement120(x)).toThrow("barrier/control projection mismatch"); expect(x.snapshot()).toEqual(before);
  } finally { x.close(); }
});
test("replacement old independent template cannot repair NEW binding by a reference refresh", () => {
  const x = replacementFixture120(); try { const before = x.snapshot(), c = x.newChild;
    const bad = { ...c.independent, executionTemplate: x.f.independent.executionTemplate };
    expect(() => x.store.prepareReplacement(x.handle, x.stageExpected, c.origin, bad, x.originGrant, c.observationRef, x.now())).toThrow("replacement child S1 binding failed");
    expect(x.snapshot()).toEqual(before);
  } finally { x.close(); }
});
test("replacement preserves actual engaged family and root encumbrance and refuses final while Q is incomplete", () => {
  const x = replacementFixture120({ engaged: true }); try { const work = x.activeWork(), slots = x.store.slots("author"); stageReplacement120(x); swapReplacement120(x);
    expect(x.activeWork()).toEqual(work); expect(x.store.slots("author")).toEqual(slots); expect(x.cut()).toEqual(x.originalCut);
    expect(() => freshReplacementFinal120(x)).toThrow("terminal history requires released families");
    expect(x.activeWork()).toEqual(work); expect(x.store.slots("author")).toEqual(slots); expect(x.store.read("author").controlMode).toBe("DRAIN_NEW_FAMILIES");
  } finally { x.close(); }
});
