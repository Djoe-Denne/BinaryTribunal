import { expect, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { EventLog } from "../../src/eventlog";
import { GraphGenerationStoreV1, openGraphGenerationFixture } from "../../src/graph-generation-store";
import { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";
import { safeRootSumV3 } from "../../src/graph-generation-budget";
import type { ExecutionEnvelopeV1, RootLimitsV1, RootModelBindingsV1 } from "../../src/graph-execution-envelope";
import type { GraphInputSource } from "../../src/domain";
import type { PlannerResult } from "../../src/planner";
import { document } from "./s1-source-fixtures";
import { body, seed, ownedPath, malformedOwnFixture } from "./fixtures";

// Expectations fixed before implementation: no algorithmic producer/oracle and
// no private-table injection. All DB creation remains behind the parent gate.
test("bootstrap needs opaque fixture authority; stale CAS has no extra claim", () => {
  const x = seed(); try {
    const initial = x.store.read("author");
    expect(() => x.store.reserveFamily({} as never, initial, x.unitId, 1000, 1)).toThrow();
    const lease = x.store.reserveFamily(x.handle, initial, x.unitId, 1000, 1);
    expect(lease.generationId).toBe(initial.generationId);
    expect(() => x.store.reserveFamily(x.handle, initial, x.unitId, 1000, 2)).toThrow();
    expect(x.store.claims("author")).toHaveLength(1);
    expect(x.store.slots("author").map(s => s.state)).toEqual(["ENCUMBERED", "ENCUMBERED", "ENCUMBERED"]);
    x.authority.revoke(x.controller);
    expect(() => x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, body(x, lease.subIntents[0]!.subIntentId, "A"), 3)).toThrow();
  } finally { x.db.close(); }
});

test("pin/debit/outbox/journal roll back together on append failure", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const before = x.store.read("author"), cursor = x.events.cursor("author"), slots = x.store.slots("author");
    const real = x.events.append.bind(x.events), spy = spyOn(x.events, "append").mockImplementation((...args) => {
      real(...args); throw new Error("synthetic append failure AFTER real append");
    });
    try { expect(() => x.store.prepareAdmissionV3(x.handle, before, lease, body(x, lease.subIntents[0]!.subIntentId, "A"), 2)).toThrow(); }
    finally { spy.mockRestore(); }
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
    expect(x.store.slots("author")).toEqual(slots); expect(x.store.admissions("author")).toEqual([]);
  } finally { x.db.close(); }
});

test("exact reopen/retry is an identity read; changed body/ID refuses", () => {
  const x = seed(); let reopened: Database | undefined; try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A");
    const first = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2), cursor = x.events.cursor("author");
    x.db.close(); reopened = openGraphGenerationFixture(x.path);
    const log = new EventLog(reopened), store = new GraphGenerationStoreV1(reopened, log), authority = new FixtureTrustedAuthorityV1(reopened);
    const handle = authority.resolve(x.controller);
    expect(store.prepareAdmissionV3(handle, store.read("author"), lease, request, 20)).toEqual(first);
    expect(log.cursor("author")).toEqual(cursor);
    expect(() => store.prepareAdmissionV3(handle, store.read("author"), lease, { ...request, extra: "different complete body" }, 21)).toThrow();
    expect(() => store.prepareAdmissionV3(handle, store.read("author"), lease, { ...request, executionId: "different", idempotencyKey: "different" }, 21)).toThrow();
    expect(store.slots("author").filter(s => s.state === "SPENT")).toHaveLength(1);
  } finally { if (reopened) reopened.close(); else x.db.close(); }
});

test("oversized engaged body burns once, never refunds or dispatches", () => {
  // Cf=1 is not the effective cap: the author fixture retains max(Cf,S).
  // Thus C remains >= its scientific minimum, with acquired root cap unchanged.
  const x = seed(ownedPath(), true, { cap: 1, rootCap: 100000 }); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A");
    const result = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2);
    expect(result.status).toBe("BURNED"); expect(result.image.admissionUtf8Bytes).toBeGreaterThan(result.cap);
    expect(result.reservedDebit).toBe(100000); expect(x.store.admissions("author")).toEqual([]);
    const cursor = x.events.cursor("author");
    expect(x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 20)).toEqual(result);
    expect(x.events.cursor("author")).toEqual(cursor);
    expect(() => x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, { ...request, extra: "different complete body" }, 21)).toThrow();
  } finally { x.db.close(); }
});

test("expiry is not Q; exact never-sent proof permits physical release only", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 3, 1);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A");
    const result = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2);
    for (let i = 0; i < 3; i++) x.events.append("author", `synthetic-clock:${i}`, "fixture-clock", 3, {});
    expect(() => x.store.releaseProvenV3(x.handle, x.store.read("author"), lease, 4)).toThrow();
    const proof = x.authority.register({ kind: "observation", missionId: "author", generationId: lease.generationId,
      envelopeFingerprint: x.sealed.envelope.fingerprint, owner: lease.owner, controllerFence: lease.controllerFence,
      executionId: request.executionId, requestDigest: result.image.requestDigest, familyFence: lease.familyFence,
      attempt: 0, state: "absent", quiescent: true });
    x.store.proveTerminalV3(x.handle, x.store.read("author"), lease, x.authority.resolve(proof), 4);
    x.store.releaseProvenV3(x.handle, x.store.read("author"), lease, 5);
    expect(x.store.claims("author")).toEqual([]);
    expect(x.store.slots("author").filter(s => s.state === "SPENT")).toHaveLength(1);
    expect(x.store.auditReplay("author")).toHaveLength(8);
    expect(x.events.read("author").map(e => e.kind)).toEqual(["g3_bootstrap_fixture", "g3_family_reserved", "g3_admission_prepared",
      "fixture-clock", "fixture-clock", "fixture-clock", "g3_fixture_observation", "g3_family_released"]);
    expect(x.store.auditReplay("author")).toEqual(x.store.auditReplay("author"));
  } finally { x.db.close(); }
});

test("foreign/legacy schema, aliases and wrong EventLog connection refuse", () => {
  expect(() => openGraphGenerationFixture("Ensemble.db")).toThrow();
  const path = ownedPath(), foreign = new Database(path); foreign.exec("CREATE TABLE foreign_table(id INTEGER)"); foreign.close();
  expect(() => openGraphGenerationFixture(path)).toThrow();
  const a = openGraphGenerationFixture(ownedPath()), b = openGraphGenerationFixture(ownedPath());
  try { expect(() => new GraphGenerationStoreV1(a, new EventLog(b))).toThrow(); } finally { a.close(); b.close(); }
});

test("attempted absence and late acceptance are audit only, never Q or retry", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A");
    const first = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2);
    const scope = { kind: "observation" as const, missionId: "author", generationId: lease.generationId,
      envelopeFingerprint: x.sealed.envelope.fingerprint, owner: lease.owner, controllerFence: lease.controllerFence,
      executionId: request.executionId, requestDigest: first.image.requestDigest, familyFence: lease.familyFence, attempt: 1 };
    const unknown = x.authority.resolve(x.authority.register({ ...scope, state: "unknown", quiescent: false }));
    x.store.reconcileAdmissionV3(x.handle, x.store.read("author"), lease, unknown, 3);
    const absent = x.authority.resolve(x.authority.register({ ...scope, state: "absent", quiescent: true }));
    x.store.proveTerminalV3(x.handle, x.store.read("author"), lease, absent, 4);
    expect(x.store.admissions("author")[0]!.state).toBe("AMBIGUOUS");
    expect(() => x.store.releaseProvenV3(x.handle, x.store.read("author"), lease, 5)).toThrow();
    expect(x.store.claims("author")).toHaveLength(1);
    const before = x.events.cursor("author");
    expect(x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 6)).toEqual(first);
    expect(x.events.cursor("author")).toEqual(before); // identity read, NOT a new send
    const stale = x.authority.resolve(x.authority.register({ ...scope, familyFence: lease.familyFence + 1, state: "accepted", quiescent: false }));
    x.store.reconcileAdmissionV3(x.handle, x.store.read("author"), lease, stale, 7);
    expect(x.store.admissions("author")[0]!.state).toBe("AMBIGUOUS");
  } finally { x.db.close(); }
});

test("Q cannot consume revoked accepted fixture evidence; arithmetic never overflows", () => {
  expect(safeRootSumV3([Number.MAX_SAFE_INTEGER, 0])).toBe(Number.MAX_SAFE_INTEGER);
  expect(() => safeRootSumV3([Number.MAX_SAFE_INTEGER, 1])).toThrow();
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A");
    const first = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2);
    const scope = { kind: "observation" as const, missionId: "author", generationId: lease.generationId,
      envelopeFingerprint: x.sealed.envelope.fingerprint, owner: lease.owner, controllerFence: lease.controllerFence,
      executionId: request.executionId, requestDigest: first.image.requestDigest, familyFence: lease.familyFence, attempt: 1 };
    const accepted = x.authority.register({ ...scope, state: "accepted", quiescent: false });
    x.store.reconcileAdmissionV3(x.handle, x.store.read("author"), lease, x.authority.resolve(accepted), 3);
    const terminal = x.authority.register({ ...scope, state: "completed", quiescent: true });
    x.store.proveTerminalV3(x.handle, x.store.read("author"), lease, x.authority.resolve(terminal), 4);
    x.authority.revoke(accepted);
    expect(() => x.store.releaseProvenV3(x.handle, x.store.read("author"), lease, 5)).toThrow();
    expect(x.store.claims("author")).toHaveLength(1);
  } finally { x.db.close(); }
});

test("receipt revoked BEFORE terminal proof forbids TERMINAL and any event", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A");
    const first = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2);
    const scope = { kind: "observation" as const, missionId: "author", generationId: lease.generationId,
      envelopeFingerprint: x.sealed.envelope.fingerprint, owner: lease.owner, controllerFence: lease.controllerFence,
      executionId: request.executionId, requestDigest: first.image.requestDigest, familyFence: lease.familyFence, attempt: 1 };
    const accepted = x.authority.register({ ...scope, state: "accepted", quiescent: false });
    x.store.reconcileAdmissionV3(x.handle, x.store.read("author"), lease, x.authority.resolve(accepted), 3);
    x.authority.revoke(accepted);
    const proof = x.authority.resolve(x.authority.register({ ...scope, state: "completed", quiescent: true }));
    const before = x.store.read("author"), cursor = x.events.cursor("author"), rows = x.store.admissions("author");
    expect(() => x.store.proveTerminalV3(x.handle, before, lease, proof, 4)).toThrow();
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
    expect(x.store.admissions("author")).toEqual(rows);
    expect(x.store.admissions("author")[0]!.state).toBe("ACCEPTED");
    expect(x.store.admissions("author")[0]!.terminal_proof).toBeNull();
  } finally { x.db.close(); }
});

test.each(["g3_claims", "g3_outbox", "g3_meta", "g3_fence"] as const)("same markers with %s constraint removed refuse without rewriting the file", table => {
  const path = malformedOwnFixture(table), before = readFileSync(path);
  expect(() => openGraphGenerationFixture(path)).toThrow();
  expect(readFileSync(path)).toEqual(before);
});

test("internal fixture command is joined exhaustively to retained S1 sources before any new effect", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const request = body(x, lease.subIntents[0]!.subIntentId, "A");
    expect(x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2).status).toBe("PREPARED");
    const referenceBytes = x.sealed.document.utf8;
    type Command = typeof request.command;
    // Each changed command is detached; the independent author input and store
    // origin stay unchanged. The error must come from the content JOIN itself.
    const mutations: ((command: Command) => void)[] = [
      c => { c.profile = "foreign-profile"; },
      c => { c.model.providerID = "foreign-provider"; },
      c => { c.model.id = "foreign-model"; },
      c => { c.model.variant = "foreign-variant"; },
      c => { c.functionIdentity.ea = "0xDEAD"; },
      c => { c.scope.missionId = "foreign-mission"; },
      c => { c.scope.generationId = "foreign-generation"; },
      c => { c.scope.rootAccountId = "b".repeat(64); },
      c => { c.scope.unitId = "foreign-unit"; },
      c => { c.scope.subIntentId = "foreign-sub"; },
      c => { c.scope.role = "B"; },
      c => {
        const envelope = JSON.parse(c.sourceEnvelope.utf8) as ExecutionEnvelopeV1;
        const manifest = envelope.admissionSource.inputManifestSource.document;
        const inputs = JSON.parse(manifest.utf8) as GraphInputSource;
        inputs.accessibleRules = ["foreign-manifest-rule"];
        envelope.admissionSource.inputManifestSource.document = document(manifest.ref.kind, inputs);
        c.sourceEnvelope = document(c.sourceEnvelope.ref.kind, envelope);
      },
      c => {
        const envelope = JSON.parse(c.sourceEnvelope.utf8) as ExecutionEnvelopeV1;
        envelope.admissionSource.context.knowledgeRevision++;
        c.sourceEnvelope = document(c.sourceEnvelope.ref.kind, envelope);
      },
      c => {
        const envelope = JSON.parse(c.sourceEnvelope.utf8) as ExecutionEnvelopeV1;
        const planning = JSON.parse(envelope.planning.utf8) as PlannerResult;
        const cap = planning.sidecar.admissionBudget?.byUnit[c.scope.unitId]?.admissionCapUtf8Bytes;
        if (!cap || cap.value === null) throw new Error("manual nominal current cap absent");
        cap.value++;
        envelope.planning = document(envelope.planning.ref.kind, planning);
        c.sourceEnvelope = document(c.sourceEnvelope.ref.kind, envelope);
      },
      c => {
        const envelope = JSON.parse(c.sourceEnvelope.utf8) as ExecutionEnvelopeV1;
        const rootDoc = envelope.admissionSource.budgetLineage.rootLimits;
        const root = JSON.parse(rootDoc.utf8) as RootLimitsV1;
        if (!root.rootModelBindings) throw new Error("manual nominal root bindings absent");
        const bindings = JSON.parse(root.rootModelBindings.utf8) as RootModelBindingsV1;
        bindings.bindings[0]!.model.id = "foreign-root-model";
        root.rootModelBindings = document(root.rootModelBindings.ref.kind, bindings);
        envelope.admissionSource.budgetLineage.rootLimits = document(rootDoc.ref.kind, root);
        c.sourceEnvelope = document(c.sourceEnvelope.ref.kind, envelope);
      },
    ];
    const wrong: unknown[] = [{}, { version: "l8-functional-binding-v1" }, { version: "l8-functional-binding-v2" },
      { prompt: "not an internal fixture command" }, { ...request.command, extra: "unknown field" }];
    for (const mutate of mutations) { const changed = structuredClone(request.command); mutate(changed); wrong.push(changed); }
    for (const command of wrong) {
      const view = x.store.read("author"), cursor = x.events.cursor("author"), slots = x.store.slots("author"), rows = x.store.admissions("author");
      expect(() => x.store.prepareAdmissionV3(x.handle, view, lease, { ...request, command }, 3)).toThrow("HOLD: bound fixture command mismatch");
      expect(x.store.read("author")).toEqual(view); expect(x.events.cursor("author")).toEqual(cursor);
      expect(x.store.slots("author")).toEqual(slots); expect(x.store.admissions("author")).toEqual(rows);
      expect(x.sealed.document.utf8).toBe(referenceBytes);
    }
  } finally { x.db.close(); }
});
