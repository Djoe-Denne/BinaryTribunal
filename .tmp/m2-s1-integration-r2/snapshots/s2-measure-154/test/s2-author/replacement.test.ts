/**120 Manual118/119 expectations written before product changes. No top-level fixture. */
import { expect, spyOn, test } from "bun:test";
import { replacementFixture120, stageReplacement120, swapReplacement120, replacementCap120, reopenReplacement120,
  replacementFault120, contendReplacement120, freshReplacementFinal120, invalidateReplacementHost124, ReplacementContenderFailure124 } from "./replacement-fixtures";
import { activateT2 } from "./t2-fixtures";
import { finalOwnRowsV1 } from "../../src/graph-final-inventory";
import { activationOutcomeV1 } from "../../src/graph-generation-activation";
import { canonical, document, digest } from "./s1-source-fixtures";
import { beginLocal145, phaseLocal145, finishLocal145 } from "../../src/graph-local-measure145";
import { replacementStage120 } from "../../src/graph-generation-replacement";

/**136 Manual expectation: no final staging/activation facts, NOT usedAttempts=0. */
function expectNoFinalActivation136(x: ReturnType<typeof replacementFixture120>): void {
  expect(x.db.query("SELECT record_ref FROM g3_authority WHERE kind IN ('candidate-staging','terminal-history-cut') OR kind LIKE 'activation-%' OR record_ref LIKE 'activation-%' ORDER BY record_ref").all()).toEqual([]);
  expect(x.db.query("SELECT key FROM ff8_events WHERE kind='g3_candidate_staged' OR kind LIKE 'g3_activation_%' OR kind='g3_generation_activated' ORDER BY mission,sequence").all()).toEqual([]);
}

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
  const x = replacementFixture120(); try { stageReplacement120(x); expectNoFinalActivation136(x); const before = x.snapshot(), y = reopenReplacement120(x); try {
    expectNoFinalActivation136(y);
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
    expect(after.candidateRef).not.toBeNull();
    expect(after.controlMode).toBe("DRAIN_NEW_FAMILIES"); expect(after.generationId).toBe(h.generationId);
    expect(x.originState(x.oldCandidate.generationId)).toBe("ABORTED"); expect(x.newUnitStates()).toEqual(["STAGED"]);
    expect(x.replacementCounter().value.used).toBe(1); expect(x.cut()).toEqual(before.cut);
    expect(x.activeWork()).toEqual(before.activeWork); expect(x.store.slots("author")).toEqual(before.slots);
    expect(r.value.oldCandidateRef).toEqual(x.oldCandidate); expect(after.candidateRef).toEqual(r.value.newCandidateRef);
  } finally { x.close(); }
});
test("replacement exact CAS lost reply and reopen replay one immutable result without recharge", () => {
  const x = replacementFixture120(); try { stageReplacement120(x); const cap = replacementCap120(x, "lost-reply"), r = swapReplacement120(x, cap), before = x.snapshot();
    expectNoFinalActivation136(x);
    expect(swapReplacement120(x, cap)).toEqual(r); expect(x.snapshot()).toEqual(before);
    const y = reopenReplacement120(x); try { expectNoFinalActivation136(y); expect(swapReplacement120(y, y.authority.resolveReplacement120(cap.ref))).toEqual(r); expect(y.snapshot()).toEqual(before); } finally { y.close(); }
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
  beginLocal145(); let closed145 = false;
  try {
  phaseLocal145("fixture-oldFinal-and-NEW");
  const x = replacementFixture120({ oldFinal: true }); try {
    phaseLocal145("stageNEW"); stageReplacement120(x);
    phaseLocal145("swap"); swapReplacement120(x);
    phaseLocal145("oldActivate");
    const rejected = activateT2(x, x.oldFinal!); expect(rejected.outcome).toBe("REJECTED"); expect(rejected.reason).toBe("STALE_CONTROL_PREIMAGE");
    phaseLocal145("freshCollect");
    const fresh = freshReplacementFinal120(x); expect(fresh.attempt.value.replacementRecordRef).toEqual(x.swap!.document.ref);
    expect(fresh.attempt.value.activationAttemptOrdinal).toBe(2);
    phaseLocal145("freshActivate"); expect(activateT2(x, fresh).outcome).toBe("COMMITTED");
    phaseLocal145("assertions-close");
    expect(x.authority.activationCounter(x.store.read("author").rootAccountId).value.usedAttempts).toBe(2);
    expect(x.authority.preparationCounter(x.store.read("author").rootAccountId).value.used).toBe(3);
  } finally { phaseLocal145("assertions-close"); x.close(); closed145 = true; }
  } finally {
    const report145 = finishLocal145();
    // Construction failure or failed close has no proven closed OWN: purge, but do not emit a misleading readout.
    if (closed145) { try {
      const line145 = JSON.stringify(report145 ?? { diagnostic: "local-145-v1", incomplete: "collector-failure" });
      console.error(typeof line145 === "string" && line145.length <= 16384 ? line145 : '{"diagnostic":"local-145-v1","incomplete":"readout-overflow"}');
    } catch { /* Diagnostic readout never masks the product/assertion/close exception. */ } }
  }
});
test("replacement two genuinely overlapping distinct demands on SAME NEW3 produce one swap/charge and a stale loser", async () => {
  const x = replacementFixture120(); try { stageReplacement120(x); const result = await contendReplacement120(x);
    expect(result.actualBusyDuringWinnerTransaction).toBe(true); expect(result.secondBeginBeforeWinnerCommit).toBe(true);
    expect(result.winnerCommittedBeforeLoserReturned).toBe(true); expect(result.loserError).toContain("replacement full preimage");
    expect(result.requestIdentities).toEqual(["contender-A", "contender-B"]); expect(result.capRefsDistinct).toBe(true);
    expect(result.exitObserved === true).toBe(true);
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
test("replacement validated NEW observation is explained in fresh final and its consumed attempt evidence", () => {
  const x = replacementFixture120(); try { stageReplacement120(x); swapReplacement120(x); const ready = freshReplacementFinal120(x);
    expect(ready.candidate).toEqual(x.stage!.value.newCandidateRef);
    expect(finalOwnRowsV1(x.db, x.events).sources.some(row => row.kind === "transition-source" && canonical(JSON.parse(row.document).ref) === canonical(x.newChild.observationRef))).toBe(true);
    expect(ready.attempt.replacementEvidence124!.replacementRecordRef).toEqual(x.swap!.document.ref);
    expect(ready.attempt.replacementEvidence124!.finalCaseRef).toEqual(ready.caseRef);
    expect(ready.attempt.replacementEvidence124!.finalInventoryRef).toEqual(ready.attempt.inventoryRef);
    expect(activateT2(x, ready).outcome).toBe("COMMITTED");
  } finally { x.close(); }
});
test.each(["unknown-observation", "revoked-stage", "revoked-observation", "forged-stage", "event-join", "observation-source-join"] as const)("replacement final refuses %s without admitting arbitrary transition sources", defect => {
  const x = replacementFixture120(); try { stageReplacement120(x); swapReplacement120(x);
    let expected: string;
    if (defect === "unknown-observation") {
      x.authority.registerTransitionDocument(document(x.newChild.observation.version, { ...x.newChild.observation, revision: x.newChild.observation.revision + 1 }));
      expected = "orphan transition source not explained by committed history";
    } else if (defect === "revoked-stage" || defect === "revoked-observation") {
      const ref = defect === "revoked-stage" ? x.stage!.document.ref : x.newChild.observationRef;
      x.db.query("UPDATE g3_authority SET revoked=1,revision=2 WHERE record_ref=?").run(`transition:${canonical(ref)}`);
      expected = "replacement retained record missing/corrupt/revoked";
    } else if (defect === "forged-stage") {
      const forged = { ...x.stage!.document, utf8: x.stage!.document.utf8 + " " };
      x.db.query("UPDATE g3_authority SET document=?,digest=? WHERE record_ref=?").run(canonical(forged), digest(forged), `transition:${canonical(x.stage!.document.ref)}`);
      expected = "replacement source bytes/ref";
    } else if (defect === "observation-source-join") {
      const observation = { ...x.newChild.observation, knowledgeRef: x.newChild.observation.sourceMissionRef };
      const ref = x.authority.registerTransitionDocument(document(observation.version, observation));
      const value = { ...x.stage!.value, observationRef: ref }, forged = document(value.version, value);
      // Deliberate OWN corruption, no DELETE: a validly encoded stage whose
      // observation points to the wrong scientific source must still refuse.
      x.db.query("UPDATE g3_authority SET record_ref=?,document=?,digest=? WHERE record_ref=?")
        .run(`transition:${canonical(forged.ref)}`, canonical(forged), digest(forged), `transition:${canonical(x.stage!.document.ref)}`);
      expected = "replacement stage observation/source/preimage join";
    } else {
      const event = x.events.read("author").find(event => event.kind === "g3_replacement_prepared")!;
      const payload = { ...x.stage!.value, eventBefore: x.stage!.value.eventBefore + 1 };
      x.db.query("UPDATE ff8_events SET payload=?,digest=? WHERE mission=? AND key=?")
        .run(canonical(payload), digest({ kind: event.kind, time: event.time, payload, unitId: null }), "author", event.key);
      expected = "replacement stage event missing/corrupt";
    }
    const before = x.snapshot(); expect(() => finalOwnRowsV1(x.db, x.events)).toThrow(expected); expect(x.snapshot()).toEqual(before);
  } finally { x.close(); }
});
const hostFaults124 = ["current-unknown", "revoked-cap", "epoch-only", "current-revision", "source-bytes", "case-bytes"] as const;
const hostRefusals124 = { "current-unknown": "replacement HOST current unknown", "revoked-cap": "replacement HOST current registration stale/revoked",
  "epoch-only": "replacement HOST activation consumed evidence changed", "current-revision": "replacement HOST current registration stale/revoked",
  "source-bytes": "replacement source bytes/ref", "case-bytes": "replacement HOST complete source/capability enumeration mismatch" };
test.each([...hostFaults124])("replacement HOST %s after collection before T2 refuses without registering DB", defect => {
  const x = replacementFixture120(); try { stageReplacement120(x); swapReplacement120(x); const ready = freshReplacementFinal120(x), before = x.snapshot();
    expect(ready.attempt.value.replacementRecordRef).toEqual(x.swap!.document.ref); // nominal final/OBS gate has actually been reached
    invalidateReplacementHost124(x, defect); expect(x.snapshot()).toEqual(before);
    expect(() => activateT2(x, ready)).toThrow(hostRefusals124[defect]); expect(x.snapshot()).toEqual(before);
    expect(activationOutcomeV1(x.db, ready.attempt.activationAttemptId)).toBeNull();
  } finally { x.close(); }
});
test.each([...hostFaults124])("replacement HOST %s during real T2 append rolls back all OWN effects", defect => {
  const x = replacementFixture120(); try { stageReplacement120(x); swapReplacement120(x); const ready = freshReplacementFinal120(x), before = x.snapshot();
    const real = x.events.append.bind(x.events); let hookReached = false, appendedOutcomeSeen = false;
    const spy = spyOn(x.events, "append").mockImplementation((...args) => {
      const event = real(...args);
      if (args[2] === "g3_generation_activated") {
        hookReached = true; appendedOutcomeSeen = !!x.db.query("SELECT 1 FROM g3_authority WHERE record_ref=? AND kind='activation-result'").get(`activation-result:${ready.attempt.activationAttemptId}`);
        invalidateReplacementHost124(x, defect);
      }
      return event;
    });
    try { expect(() => activateT2(x, ready)).toThrow(hostRefusals124[defect]); } finally { spy.mockRestore(); }
    expect(hookReached).toBe(true); expect(appendedOutcomeSeen).toBe(true); expect(x.snapshot()).toEqual(before);
    expect(activationOutcomeV1(x.db, ready.attempt.activationAttemptId)).toBeNull();
  } finally { x.close(); }
});
test("replacement committed history remains readable after external HOST invalidation without granting fresh authority", () => {
  const x = replacementFixture120(); try { stageReplacement120(x); swapReplacement120(x); const ready = freshReplacementFinal120(x), result = activateT2(x, ready);
    expect(result.outcome).toBe("COMMITTED"); invalidateReplacementHost124(x, "current-unknown");
    expect(x.store.activationAttempt(ready.attempt.activationAttemptId)).toEqual(ready.attempt);
    expect(activationOutcomeV1(x.db, ready.attempt.activationAttemptId)).toEqual(result);
  } finally { x.close(); }
});
test.each(["after-handshake-before-reply", "after-reply-before-exit"] as const)("replacement contender %s has bounded cleanup and requires observed exit", async fault => {
  const x = replacementFixture120(); try { stageReplacement120(x); const append = x.events.append; let failure: unknown;
    try { await contendReplacement120(x, fault); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(ReplacementContenderFailure124);
    const failed = failure as ReplacementContenderFailure124;
    expect((failed.primaryError as Error).message).toContain(fault === "after-handshake-before-reply" ? "reply deadline" : "exit deadline");
    expect(failed.signalsReleased).toBe(true); expect(failed.spyReleased).toBe(true); expect(x.events.append).toBe(append);
    expect(failed.exitObserved).toBe(true); // Timeout/terminate request alone is NEVER accepted as joined.
    expect(failed.exitCode).not.toBeNull();
    expect(x.events.read("author").filter(event => event.kind === "g3_candidate_replaced")).toHaveLength(1);
    expect(x.replacementCounter().value.used).toBe(1);
  } finally { x.close(); }
}, 15000);
test("replacement reopen after OLD final retains attempt1 and acquired root ceiling2 without initialization or recharge", () => {
  const x = replacementFixture120({ oldFinal: true }); try { stageReplacement120(x); swapReplacement120(x);
    const root = x.store.read("author").rootAccountId, counter = x.authority.activationCounter(root), before = x.snapshot();
    expect(counter.value.usedAttempts).toBe(1); expect(counter.value.maxActivationAttempts).toBe(2);
    const y = reopenReplacement120(x); try {
      expect(y.authority.activationCounter(root)).toEqual(counter); expect(y.snapshot()).toEqual(before);
      expect(y.authority.preparationCounter(root).value.used).toBe(3); expect(y.replacementCounter().value.used).toBe(1);
    } finally { y.close(); }
  } finally { x.close(); }
});
test.each(["missing-pointer", "revoked-pointer", "corrupt-digest", "orphan-result"] as const)("replacement reconnect %s after final staging cannot masquerade as counter absence", defect => {
  const x = replacementFixture120({ oldFinal: true }); try {
    const key = `activation-counter:${x.store.read("author").rootAccountId}`;
    if (defect === "missing-pointer") x.db.query("UPDATE g3_authority SET record_ref=? WHERE record_ref=?").run(`displaced136:${key}`, key);
    else if (defect === "revoked-pointer") x.db.query("UPDATE g3_authority SET revoked=1 WHERE record_ref=?").run(key);
    else if (defect === "corrupt-digest") x.db.query("UPDATE g3_authority SET digest='corrupt136' WHERE record_ref=?").run(key);
    else {
      const orphan = document("l8-activation-outcome-fixture-v1", { version: "l8-activation-outcome-fixture-v1" });
      x.db.query("INSERT INTO g3_authority VALUES(?,'activation-result',1,?,?,0)").run("activation-result:orphan136", canonical(orphan), digest(orphan));
    }
    const before = x.snapshot();
    expect(() => reopenReplacement120(x)).toThrow(defect === "orphan-result" ? "orphan activation result" : "activation root counter unknown/corrupt");
    expect(x.snapshot()).toEqual(before); // The helper must neither repair nor initialize any record.
  } finally { x.close(); }
});
test.each(["candidate-staging", "g3_candidate_staged", "terminal-history-cut"] as const)("replacement reconnect with only orphan %s still requires the strict activation counter", fact => {
  const x = replacementFixture120(); try {
    expectNoFinalActivation136(x);
    if (fact !== "g3_candidate_staged") {
      const version = fact === "candidate-staging" ? "l8-candidate-staging-fixture-v1" : "l8-cross-epoch-terminal-history-cut-fixture-v1";
      const orphan = document(version, { version });
      x.db.query("INSERT INTO g3_authority VALUES(?,?,1,?,?,0)").run(`transition:${canonical(orphan.ref)}`, fact, canonical(orphan), digest(orphan));
    } else x.events.append("author", "orphan-final-staging136", "g3_candidate_staged", x.now(), {});
    const before = x.snapshot(); expect(() => reopenReplacement120(x)).toThrow("activation root counter unknown/corrupt");
    expect(x.snapshot()).toEqual(before);
  } finally { x.close(); }
});
test.each(["candidate-staging:", "activation-attempt:", "activation-outcome:"] as const)("replacement reconnect reserved %s key with unknown kind is not pre-final absence", prefix => {
  const x = replacementFixture120(); try {
    stageReplacement120(x); if (prefix !== "candidate-staging:") swapReplacement120(x);
    expectNoFinalActivation136(x);
    const event = x.events.append("author", `${prefix}orphan138`, "g3_corrupted136", x.now(), {});
    expect(event.kind).toBe("g3_corrupted136"); expect(event.payload).toEqual({});
    expect(x.events.read("author").find(row => row.key === event.key)).toEqual(event); // Real durable EventLog digest, no header evidence.
    const root = x.store.read("author").rootAccountId, before = x.snapshot();
    expect(() => x.authority.activationCounter(root)).toThrow("activation root counter unknown/corrupt");
    expect(() => reopenReplacement120(x)).toThrow("activation root counter unknown/corrupt");
    expect(x.snapshot()).toEqual(before); // In particular no counter initialization or repair on refusal.
  } finally { x.close(); }
});
test.each(["unchanged-hit", "same-ref-bytes", "digest", "revoked-live", "revision"] as const)("replacement stage local pure reuse %s rereads current metadata between enumeration and strict lookup", defect => {
  const x = replacementFixture120(); try {
    stageReplacement120(x);
    const key = `transition:${canonical(x.stage!.document.ref)}`, generation = x.newChild.origin.generationId;
    type Row153 = { record_ref: string; kind: string; revision: number; revoked: number; document: string; digest: string };
    const query153 = x.db.query.bind(x.db), parse153 = JSON.parse.bind(JSON);
    const stored = query153("SELECT * FROM g3_authority WHERE record_ref=?").get(key) as Row153;
    expect(stored.kind).toBe("replacement-stage120"); expect(stored.revision).toBe(1); expect(stored.revoked).toBe(0);
    expect(query153("SELECT record_ref FROM g3_authority WHERE kind='replacement-stage120'").all()).toEqual([{ record_ref: key }]);
    const wrapper = parse153(stored.document) as { ref: { kind: string }; utf8: string }, changed = { ...wrapper, utf8: wrapper.utf8 + " " };
    expect(stored.digest).toBe(digest(wrapper)); expect(canonical(changed.ref)).toBe(canonical(wrapper.ref));
    const changedRaw = canonical(changed), changedDigest = digest(changed), before = x.snapshot(), expected = structuredClone(before);
    const expectedRow = (expected.authority as Row153[]).find(row => row.record_ref === key);
    if (!expectedRow) throw new Error("fixture153 stage row missing");
    if (defect === "same-ref-bytes") { expectedRow.document = changedRaw; expectedRow.digest = changedDigest; }
    else if (defect === "digest") expectedRow.digest = "corrupt153";
    else if (defect === "revoked-live") { expectedRow.revoked = 1; expectedRow.revision = 2; }
    else if (defect === "revision") expectedRow.revision = 17;
    let sourceParses = 0, changedParses = 0, parsesAtMutation = -1, targetReads = 0, mutationReached = false;
    let firstRaw: string | undefined, secondRaw: string | undefined;
    const readKeys: string[] = [], hooked = new WeakSet<object>(), restore153: (() => void)[] = [];
    try {
      // Count the native parse of these exact input bytes, not a SUT-produced expected result or a product hook.
      const parseSpy = spyOn(JSON, "parse").mockImplementation((...args) => {
        if (args[0] === wrapper.utf8) sourceParses++; if (args[0] === changed.utf8) changedParses++;
        return parse153(...args);
      }); restore153.push(() => parseSpy.mockRestore());
      const querySpy = spyOn(x.db, "query").mockImplementation((...args) => {
        const statement = query153(...args);
        if (args[0] === "SELECT kind,revision,document,digest,revoked FROM g3_authority WHERE record_ref=?" && !hooked.has(statement)) {
          hooked.add(statement); const get153 = statement.get.bind(statement);
          const readSpy = spyOn(statement, "get").mockImplementation((...bindings) => {
            if (bindings[0] === key) {
              targetReads++; readKeys.push(key);
              if (targetReads === 2) {
                mutationReached = true; parsesAtMutation = sourceParses; // The first targeted decode has completed.
                if (defect === "same-ref-bytes") query153("UPDATE g3_authority SET document=?,digest=? WHERE record_ref=?").run(changedRaw, changedDigest, key);
                else if (defect === "digest") query153("UPDATE g3_authority SET digest='corrupt153' WHERE record_ref=?").run(key);
                else if (defect === "revoked-live") query153("UPDATE g3_authority SET revoked=1,revision=2 WHERE record_ref=?").run(key);
                else if (defect === "revision") query153("UPDATE g3_authority SET revision=17 WHERE record_ref=?").run(key);
              }
            }
            const row = get153(...bindings); // Always the actual native SELECT, AFTER any intentional corruption.
            if (bindings[0] === key) {
              if (targetReads === 1) firstRaw = (row as Row153 | null)?.document;
              if (targetReads === 2) secondRaw = (row as Row153 | null)?.document;
            }
            return row;
          }); restore153.push(() => readSpy.mockRestore());
        }
        return statement;
      }); restore153.push(() => querySpy.mockRestore());
      if (defect === "unchanged-hit") {
        const first = replacementStage120(x.db, x.events, generation, true);
        if (!first) throw new Error("fixture153 expected retained stage");
        expect(first.value.version).toBe("l8-replacement-stage120");
        expect(Object.isFrozen(first.value)).toBe(true); expect(Object.isFrozen(first.value.unitIds)).toBe(true);
        expect(Object.isFrozen(first.value.inventoryBefore)).toBe(true);
        first.document.ref.kind = "caller-local153"; // Mutable return envelope must not alias cached data or another caller.
        const second = replacementStage120(x.db, x.events, generation, true);
        if (!second) throw new Error("fixture153 expected fresh retained stage");
        expect(second.document.ref.kind).toBe("l8-replacement-stage120");
        expect(first.document).not.toBe(second.document); expect(first.value).not.toBe(second.value);
      } else expect(() => replacementStage120(x.db, x.events, generation, true)).toThrow(defect === "same-ref-bytes"
        ? "HOLD: replacement source bytes/ref" : "HOLD: replacement retained record missing/corrupt/revoked");
    } finally { for (const restore of restore153.reverse()) restore(); }
    expect(mutationReached).toBe(true); expect(parsesAtMutation).toBe(1);
    expect(firstRaw).toBe(stored.document); expect(secondRaw).toBe(defect === "same-ref-bytes" ? changedRaw : stored.document);
    expect(targetReads).toBe(defect === "unchanged-hit" ? 4 : 2);
    expect(readKeys).toEqual(Array(defect === "unchanged-hit" ? 4 : 2).fill(key));
    expect(sourceParses).toBe(defect === "unchanged-hit" ? 2 : 1); expect(changedParses).toBe(defect === "same-ref-bytes" ? 1 : 0);
    expect(x.snapshot()).toEqual(expected); // Exact deliberate corruption only: no legitimate debit/control/activation/event mutation.
  } finally { x.close(); }
});
