import { expect, spyOn, test } from "bun:test";
import { seed, body, ownedPath } from "./fixtures";
import { document } from "./s1-source-fixtures";
import { childInput, prepare, transitionCase, originGrantRequest } from "./t1-fixtures";
import { allocateOriginHostFixture } from "./origin-host-fixture";
import { resourceWitness, remainingInput, publishRemaining } from "./resource-fixtures";
import { EventLog } from "../../src/eventlog";
import { GraphGenerationStoreV1, openGraphGenerationFixture } from "../../src/graph-generation-store";
import { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";
import { readTransitionDocumentV1, type PreparationGrantV1, type TransitionObservationV1 } from "../../src/graph-generation-transition";

//86 literal expectations precede product. No expected post-state from SUT builder.
test("bootstrap counts1; initial prepare counts2 without changing h/L5/K/pool; exact retry0", () => {
  const x = seed(); try {
    expect(x.authority.preparationCounter(x.store.read("author").rootAccountId).value.used).toBe(1);
    const host = x.originHost.grantSources(), grant = readTransitionDocumentV1<PreparationGrantV1>(x.db, x.originGrantRef);
    expect(grant.issuerProvenanceRef).toEqual(host.issuer.ref); expect(grant.rootLineageOwnershipRef).toEqual(host.ownership.ref);
    expect(grant.firstIssuanceEmptyHistoryProofRef).toEqual(host.firstIssuance.ref); expect(grant.hostCurrentRef).toEqual(host.current.ref);
    const p = prepare(x), after = x.store.read("author");
    expect(after.revision).toBe(p.before.revision); expect(after.candidateRevision).toBe(p.before.candidateRevision + 1);
    expect(after.activeGenerationId).toBe(p.before.generationId); expect(after.candidateGenerationId).toBe(p.child.origin.generationId);
    expect(after.controlMode).toBe("RUNNING"); expect(after.budgetLedgerDigest).toBe(p.before.budgetLedgerDigest);
    expect(after.inventoryRevision).toBe(p.before.inventoryRevision); expect(after.knowledgeLedgerRevision).toBe(p.before.knowledgeLedgerRevision);
    expect(x.authority.preparationCounter(after.rootAccountId).value.used).toBe(2);
    const cursor = x.events.cursor("author");
    expect(x.store.prepareInitial(x.handle, p.before, p.child.origin, p.child.independent, x.originGrant, p.child.observationRef, 3)).toEqual(p.preparation);
    expect(x.events.cursor("author")).toEqual(cursor);
  } finally { x.db.close(); }
});
test("T1 includes genuinely reserved family WITHOUT outbox, preserves rights and exact duplicate has no effects", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1, x.acquisition);
    const p = prepare(x), authorization = transitionCase(x, p), before = x.store.read("author"), slots = x.store.slots("author");
    const entry = x.store.requestDrain(x.handle, before, authorization.handle, 3), after = x.store.read("author");
    expect(after.revision).toBe(before.revision + 1); expect(after.candidateRevision).toBe(before.candidateRevision + 1);
    expect(after.controlMode).toBe("DRAIN_NEW_FAMILIES"); expect(after.barrierRootId).toBe(entry.value.barrierRootId);
    expect(after.activeGenerationId).toBe(before.activeGenerationId); expect(after.generationId).not.toBe(p.child.origin.generationId);
    expect(entry.engaged.value.families.map(f => f.unit)).toEqual([lease.unitId]); expect(entry.inventory.value.outboxes).toEqual([]);
    expect(x.store.slots("author")).toEqual(slots); expect(x.authority.preparationCounter(after.rootAccountId).value.used).toBe(2);
    const cursor = x.events.cursor("author"); expect(x.store.requestDrain(x.handle, before, authorization.handle, 4)).toEqual(entry);
    expect(x.events.cursor("author")).toEqual(cursor);
    expect(() => x.store.reserveFamily(x.handle, after, x.unitId, 1000, 4, x.acquisition)).toThrow("HOLD: durable drain blocks new families");
    const absent = { ...lease, unitId: "not-in-cut", familyFence: lease.familyFence + 1 };
    expect(() => x.store.prepareAdmissionV3(x.handle, after, absent, body(x, lease.subIntents[0]!.subIntentId, "A"), 4))
      .toThrow("HOLD: family absent from immutable drain cut");
  } finally { x.db.close(); }
});
test.each(["prepare", "drain"] as const)("%s rollback after real append restores head/counter/origins/events", phase => {
  const x = seed(); try {
    const child = phase === "prepare" ? childInput(x) : undefined, p = phase === "drain" ? prepare(x) : undefined;
    const authorization = p ? transitionCase(x, p) : undefined, before = x.store.read("author"), counter = x.authority.preparationCounter(before.rootAccountId), cursor = x.events.cursor("author");
    const real = x.events.append.bind(x.events), spy = spyOn(x.events, "append").mockImplementation((...args) => { real(...args); throw new Error("after real append"); });
    try { expect(() => phase === "prepare" ? x.store.prepareInitial(x.handle, before, child!.origin, child!.independent, x.originGrant, child!.observationRef, 2)
      : x.store.requestDrain(x.handle, before, authorization!.handle, 3)).toThrow(); } finally { spy.mockRestore(); }
    expect(x.store.read("author")).toEqual(before); expect(x.authority.preparationCounter(before.rootAccountId)).toEqual(counter); expect(x.events.cursor("author")).toEqual(cursor);
  } finally { x.db.close(); }
});
test("observation revoked AFTER the real preparation append rolls back origin/head/counter/event and revocation itself", () => {
  const x = seed(); try {
    const child = childInput(x), before = x.store.read("author"), counter = x.authority.preparationCounter(before.rootAccountId);
    const cursor = x.events.cursor("author"), slots = x.store.slots("author"), real = x.events.append.bind(x.events);
    const spy = spyOn(x.events, "append").mockImplementation((...args) => {
      const event = real(...args);
      if (args[2] === "g3_initial_prepared") x.authority.revokeTransitionDocument(child.observationRef);
      return event; // normal return: ONLY the consuming post-append source guard may reject
    });
    try { expect(() => x.store.prepareInitial(x.handle, before, child.origin, child.independent, x.originGrant, child.observationRef, 2))
      .toThrow("HOLD: transition source unavailable/revoked"); } finally { spy.mockRestore(); }
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
    expect(x.authority.preparationCounter(before.rootAccountId)).toEqual(counter); expect(counter.value.used).toBe(1);
    expect(x.store.slots("author")).toEqual(slots); expect(x.store.read("author").candidateRef).toBeNull();
    expect(x.db.query("SELECT 1 FROM g3_origins WHERE mission=? AND generation=?").get("author", child.origin.generationId)).toBeNull();
    expect(x.db.query("SELECT 1 FROM g3_authority WHERE record_ref=?").get(`initial:${child.origin.generationId}`)).toBeNull();
    expect(readTransitionDocumentV1<TransitionObservationV1>(x.db, child.observationRef)).toEqual(child.observation);
  } finally { x.db.close(); }
});
test.each(["stale-head", "revoked-case", "bootstrap-handle"] as const)("T1 %s refuses without creating barrier", defect => {
  const x = seed(); try {
    const p = prepare(x), authorization = transitionCase(x, p), before = x.store.read("author"), cursor = x.events.cursor("author");
    if (defect === "revoked-case") x.authority.revokeTransitionDocument(authorization.ref);
    expect(() => x.store.requestDrain(x.handle, defect === "stale-head" ? p.before : before,
      defect === "bootstrap-handle" ? x.handle as never : authorization.handle, 3)).toThrow();
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
  } finally { x.db.close(); }
});
test("reservation after T0 makes T1 stale, never refreshes the immutable T0", () => {
  const x = seed(); try {
    const p = prepare(x); x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 3, x.acquisition);
    const authorization = transitionCase(x, p), before = x.store.read("author"), cursor = x.events.cursor("author");
    expect(() => x.store.requestDrain(x.handle, before, authorization.handle, 4)).toThrow();
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
    expect(p.child.origin.envelope.preparationObservationT0).toEqual(p.child.observation.t0);
  } finally { x.db.close(); }
});
test("engaged A continues after T1 with fresh capacity; original R still fails its OWN profile gate", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1, x.acquisition);
    const oldWitness = resourceWitness(x, lease), p = prepare(x), authorization = transitionCase(x, p);
    x.store.requestDrain(x.handle, x.store.read("author"), authorization.handle, 3);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A"), before = x.store.read("author");
    expect(() => x.store.prepareAdmissionV3(x.handle, before, lease, request, 4, oldWitness)).toThrow(); expect(x.store.read("author")).toEqual(before);
    publishRemaining(x, remainingInput(x, "empty", [], 2, x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef));
    const fresh = resourceWitness(x, lease), result = x.store.prepareAdmissionV3(x.handle, before, lease, request, 4, fresh);
    expect(result.status).toBe("PREPARED"); const cursor = x.events.cursor("author");
    expect(x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 5, fresh)).toEqual(result); expect(x.events.cursor("author")).toEqual(cursor);
    const r = lease.subIntents.find(s => s.role === "R")!;
    expect(() => x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, body(x, r.subIntentId, "R"), 5, resourceWitness(x, lease, "R")))
      .toThrow("HOLD: fixed worker/profile/account/tools mismatch");
  } finally { x.db.close(); }
});
test("grant revocation blocks new origin, not accepted identity history", () => {
  const x = seed(); try { const child = childInput(x), before = x.store.read("author"), counter = x.authority.preparationCounter(before.rootAccountId);
    x.authority.revokeTransitionDocument(x.originGrantRef);
    expect(() => x.store.prepareInitial(x.handle, before, child.origin, child.independent, x.originGrant, child.observationRef, 2)).toThrow();
    expect(x.store.read("author")).toEqual(before); expect(x.authority.preparationCounter(before.rootAccountId)).toEqual(counter);
  } finally { x.db.close(); }
});
test("engaged execution can establish Q and release during drain with consumed case revoked and HOST current unknown, without lifting barrier or refunding rights", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1, x.acquisition);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A"), admission = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2, resourceWitness(x, lease));
    const p = prepare(x), c = transitionCase(x, p), drain = x.store.requestDrain(x.handle, x.store.read("author"), c.handle, 3);
    x.authority.revokeTransitionDocument(c.ref); // history remains auditable; not fresh T1 authority
    x.originHostPort.records = null; // missing new-issuance authority must not block stop/Q
    const proof = x.authority.resolve(x.authority.register({ kind: "observation", missionId: "author", generationId: lease.generationId,
      envelopeFingerprint: x.sealed.envelope.fingerprint, owner: lease.owner, controllerFence: lease.controllerFence, familyFence: lease.familyFence,
      executionId: request.executionId, requestDigest: admission.image.requestDigest, attempt: 0, state: "absent", quiescent: true }));
    x.store.proveTerminalV3(x.handle, x.store.read("author"), lease, proof, 4);
    x.store.releaseProvenV3(x.handle, x.store.read("author"), lease, 5);
    expect(x.store.claims("author")).toEqual([]); expect(x.store.resourceInventory("pool:synthetic:shared-74").active).toEqual([]);
    expect(x.store.read("author").barrierRootId).toBe(drain.value.barrierRootId); expect(x.store.read("author").controlMode).toBe("DRAIN_NEW_FAMILIES");
    expect(x.store.slots("author").filter(s => s.state === "SPENT")).toHaveLength(1);
    expect(x.store.slots("author").filter(s => s.state === "ENCUMBERED")).toHaveLength(2);
  } finally { x.db.close(); }
});
test("missing opaque grant blocks bootstrap before origin/counter/event; another DB handle is not authority", () => {
  const x = seed(ownedPath(), false), y = seed(ownedPath(), false); try {
    const root = x.f.body.admissionSource.budgetLineage.rootAccountId;
    expect(x.authority.preparationCounter(root).value.used).toBe(0);
    expect(() => x.store.installBootstrapA(x.handle, x.sealed, x.f.independent, 0)).toThrow("HOLD: private origin grant handle missing/wrong DB");
    expect(() => y.store.installBootstrapA(y.handle, y.sealed, y.f.independent, 0, x.originGrant)).toThrow("HOLD: private origin grant handle missing/wrong DB");
    expect(x.authority.preparationCounter(root).value.used).toBe(0); expect(y.authority.preparationCounter(root).value.used).toBe(0);
    expect(x.events.cursor("author").sequence).toBe(0); expect(y.events.cursor("author").sequence).toBe(0);
  } finally { x.db.close(); y.db.close(); }
});
test("revoked current counter refuses before preparing a new origin", () => {
  const x = seed(); try {
    const child = childInput(x), before = x.store.read("author"), cursor = x.events.cursor("author"), counter = x.authority.preparationCounter(before.rootAccountId);
    x.authority.revokeTransitionDocument(counter.document.ref);
    expect(() => x.store.prepareInitial(x.handle, before, child.origin, child.independent, x.originGrant, child.observationRef, 2)).toThrow("HOLD: transition source unavailable/revoked");
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
  } finally { x.db.close(); }
});
test("B/native source documents cannot mint a transitionA handle", () => {
  const x = seed(); try { const before = x.store.read("author"), cursor = x.events.cursor("author");
    for (const version of ["proposal-b-host-fixture-v1", "native-transition-a-v1"]) expect(() => x.authority.registerTransitionDocument(document(version, { version })))
      .toThrow("HOLD: unsupported transition source/native/B");
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
  } finally { x.db.close(); }
});
test.each(["observation-before-prepare", "grant-before-T1"] as const)("revoked %s source refuses before effects", phase => {
  const x = seed(); try {
    if (phase === "observation-before-prepare") {
      const child = childInput(x), before = x.store.read("author"), cursor = x.events.cursor("author");
      x.authority.revokeTransitionDocument(child.observationRef);
      expect(() => x.store.prepareInitial(x.handle, before, child.origin, child.independent, x.originGrant, child.observationRef, 2))
        .toThrow("HOLD: transition source unavailable/revoked");
      expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
    } else {
      const p = prepare(x), c = transitionCase(x, p), before = x.store.read("author"), cursor = x.events.cursor("author");
      x.authority.revokeTransitionDocument(x.originGrantRef);
      expect(() => x.store.requestDrain(x.handle, before, c.handle, 3)).toThrow("HOLD: transition source unavailable/revoked");
      expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
    }
  } finally { x.db.close(); }
});
test("reopen retains exact T1 barrier/cut/counter and idempotent receipt, never resumes RUNNING", () => {
  const x = seed(); let closed = false; try {
    x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1, x.acquisition);
    const p = prepare(x), c = transitionCase(x, p), beforeT1 = x.store.read("author");
    const entry = x.store.requestDrain(x.handle, beforeT1, c.handle, 3), head = x.store.read("author"), cursor = x.events.cursor("author"), slots = x.store.slots("author");
    x.db.close(); closed = true; const db = openGraphGenerationFixture(x.path);
    try {
      const log = new EventLog(db), store = new GraphGenerationStoreV1(db, log), authority = new FixtureTrustedAuthorityV1(db), controller = authority.resolve(x.controller);
      expect(store.read("author")).toEqual(head); expect(head.controlMode).toBe("DRAIN_NEW_FAMILIES"); expect(head.barrierRootId).toBe(entry.value.barrierRootId);
      expect(authority.preparationCounter(head.rootAccountId).value.used).toBe(2); expect(store.slots("author")).toEqual(slots);
      // No provider was reattached to this reopened connection. Historical
      // audit/receipt is valid, but new preparation authority is UNKNOWN.
      expect(() => authority.resolvePreparationGrant(x.originGrantRef)).toThrow("HOLD: independent origin HOST proofs/current unknown");
      expect(store.requestDrain(controller, beforeT1, authority.resolveTransitionA(c.ref), 4)).toEqual(entry); expect(log.cursor("author")).toEqual(cursor);
      expect(entry.authorizationRef).toEqual(c.ref);
    } finally { db.close(); }
  } finally { if (!closed) x.db.close(); }
});
test("a different current T1 case with otherwise identical bindings cannot claim the first case's receipt", () => {
  const x = seed(); try {
    const p = prepare(x), c = transitionCase(x, p), beforeT1 = x.store.read("author");
    const receipt = x.store.requestDrain(x.handle, beforeT1, c.handle, 3), head = x.store.read("author"), cursor = x.events.cursor("author");
    const counter = x.authority.preparationCounter(head.rootAccountId), slots = x.store.slots("author");
    const cuts = () => x.db.query("SELECT record_ref,document,digest FROM g3_authority WHERE kind IN ('drain-cut','drain-entry','drain-result') ORDER BY record_ref").all();
    const retainedCuts = cuts(), other = { ...c.record, caseId: "distinct-authority-case" };
    const otherRef = x.authority.registerTransitionDocument(document(other.version, other));
    expect(() => x.store.requestDrain(x.handle, beforeT1, x.authority.resolveTransitionA(otherRef), 4)).toThrow("HOLD: changed drain retry");
    expect(x.store.read("author")).toEqual(head); expect(x.events.cursor("author")).toEqual(cursor);
    expect(x.authority.preparationCounter(head.rootAccountId)).toEqual(counter); expect(x.store.slots("author")).toEqual(slots); expect(cuts()).toEqual(retainedCuts);
    expect(receipt.authorizationRef).toEqual(c.ref);
    expect(x.store.requestDrain(x.handle, beforeT1, x.authority.resolveTransitionA(c.ref), 5)).toEqual(receipt);
    expect(x.events.cursor("author")).toEqual(cursor);
  } finally { x.db.close(); }
});
test.each(["unknown-current", "stale-current", "revoked-issuer", "revoked-ownership", "revoked-first"] as const)("HOST %s refuses grant before any origin/head/counter registration", fault => {
  const host = allocateOriginHostFixture(100000, fault), path = ownedPath(), db = openGraphGenerationFixture(path);
  try {
    const port = host.assign(db, path), authority = new FixtureTrustedAuthorityV1(db, port), events = new EventLog(db);
    const grant = originGrantRequest(authority, host.source, path, host.grantSources());
    expect(() => authority.registerPreparationGrant(document(grant.version, grant)))
      .toThrow(fault === "unknown-current" ? "HOLD: independent origin HOST proofs/current unknown" : "HOLD: independent origin HOST current stale/revoked");
    expect(db.query("SELECT 1 FROM g3_origins UNION ALL SELECT 1 FROM g3_head").get()).toBeNull();
    expect(db.query("SELECT 1 FROM g3_authority WHERE kind IN ('origin-grant','origin-grant-domain','origin-counter-current','origin-counter-record','origin-host-source')").get()).toBeNull();
    expect(events.cursor("author").sequence).toBe(0);
  } finally { db.close(); }
});
test("an approval without three proof references cannot authorize first issuance, and references alone without privileged HOST cannot either", () => {
  const host = allocateOriginHostFixture(), path = ownedPath(), db = openGraphGenerationFixture(path);
  try {
    const port = host.assign(db, path), authority = new FixtureTrustedAuthorityV1(db), events = new EventLog(db);
    const grant = originGrantRequest(authority, host.source, path, host.grantSources()), incomplete = JSON.parse(JSON.stringify(grant));
    delete incomplete.issuerProvenanceRef; delete incomplete.rootLineageOwnershipRef; delete incomplete.firstIssuanceEmptyHistoryProofRef;
    expect(() => authority.registerPreparationGrant(document(grant.version, incomplete))).toThrow("HOLD: closed resource record required");
    expect(() => authority.registerPreparationGrant(document(grant.version, grant))).toThrow("HOLD: independent origin HOST proofs/current unknown");
    const provider = new FixtureTrustedAuthorityV1(db, port), missingOwnership = JSON.parse(JSON.stringify(port.records));
    delete missingOwnership.ownership; port.records = missingOwnership;
    expect(() => provider.registerPreparationGrant(document(grant.version, grant))).toThrow("HOLD: closed resource record required");
    expect(db.query("SELECT 1 FROM g3_origins UNION ALL SELECT 1 FROM g3_head").get()).toBeNull();
    expect(db.query("SELECT 1 FROM g3_authority WHERE kind IN ('origin-grant','origin-grant-domain','origin-counter-current','origin-counter-record')").get()).toBeNull();
    expect(events.cursor("author").sequence).toBe(0);
  } finally { db.close(); }
});
test("a retained HOST proof revoked after grant registration refuses bootstrap consumption, while zero history stays auditable", () => {
  const x = seed(ownedPath(), false); try {
    const root = x.f.body.admissionSource.budgetLineage.rootAccountId, before = x.authority.preparationCounter(root), cursor = x.events.cursor("author");
    x.authority.revokeTransitionDocument(x.originHost.grantSources().ownership.ref);
    expect(() => x.store.installBootstrapA(x.handle, x.sealed, x.f.independent, 0, x.originGrant)).toThrow("HOLD: transition source unavailable/revoked");
    expect(x.authority.preparationCounter(root)).toEqual(before); expect(before.value.used).toBe(0);
    expect(x.db.query("SELECT 1 FROM g3_origins UNION ALL SELECT 1 FROM g3_head").get()).toBeNull(); expect(x.events.cursor("author")).toEqual(cursor);
  } finally { x.db.close(); }
});
test("renaming case or path for the SAME retained HOST domain cannot issue another zero budget", () => {
  const x = seed(); let otherDb: ReturnType<typeof openGraphGenerationFixture> | null = null;
  try {
    const original = readTransitionDocumentV1<PreparationGrantV1>(x.db, x.originGrantRef), before = x.store.read("author"), counter = x.authority.preparationCounter(before.rootAccountId), cursor = x.events.cursor("author");
    const renamed = { ...original, scope: { ...original.scope, fixtureId: "renamed-case-same-host-domain" } };
    expect(() => x.authority.registerPreparationGrant(document(renamed.version, renamed))).toThrow("HOLD: grant differs from independent HOST allocation/proofs/current");
    const anotherApproval = x.authority.registerTransitionDocument(document("l8-fixture-origin-approval-v1", {
      version: "l8-fixture-origin-approval-v1", issuer: "synthetic-parent85", caseId: original.scope.fixtureId, decision: "three-durable-origins-bootstrap-included",
      missionId: original.scope.missionId, lineageId: original.scope.lineageId, rootAccountId: original.scope.rootAccountId, connectionPath: original.connectionPath }));
    // Identical approval is the same bytes/ref; a changed valid grant revision is
    // forbidden instead of reinitializing the canonical domain's durable counter.
    expect(anotherApproval).toEqual(original.approvalRef);
    const changedRevision = { ...original, revision: 2 };
    expect(() => x.authority.registerPreparationGrant(document(changedRevision.version, changedRevision))).toThrow("HOLD: approved origin grant85 required");
    expect(x.authority.registerPreparationGrant(document(original.version, original))).toEqual(x.originGrantRef);
    expect(x.authority.preparationCounter(before.rootAccountId)).toEqual(counter); expect(counter.value.used).toBe(1);
    const otherPath = ownedPath(); otherDb = openGraphGenerationFixture(otherPath);
    expect(() => new FixtureTrustedAuthorityV1(otherDb!, x.originHostPort)).toThrow("HOLD: independent origin HOST wrong connection");
    // Even explicitly copying all JSON into a new privileged port cannot change
    // the retained ownership's file assignment into a different actual database.
    const otherAuthority = new FixtureTrustedAuthorityV1(otherDb, { connection: otherDb, records: structuredClone(x.originHostPort.records) });
    const moved = { ...original, connectionPath: otherPath };
    expect(() => otherAuthority.registerPreparationGrant(document(moved.version, moved))).toThrow("HOLD: independent origin HOST ownership/connection mismatch");
    expect(otherDb.query("SELECT 1 FROM g3_authority WHERE kind IN ('origin-grant','origin-grant-domain','origin-counter-current','origin-counter-record')").get()).toBeNull();
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
  } finally { otherDb?.close(); x.db.close(); }
});
// Exhausted3 with candidate=NULL cannot be reached through the authorized
// bootstrap+one INITIAL APIs. Do NOT add a green test that rejects on pointer,
// a fake history injection, SKIP counted PASS, or a staging/activation backdoor.
