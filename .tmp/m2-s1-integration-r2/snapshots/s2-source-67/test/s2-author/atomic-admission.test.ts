import { expect, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { EventLog } from "../../src/eventlog";
import { GraphGenerationStoreV1, openGraphGenerationFixture } from "../../src/graph-generation-store";
import { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";
import { safeRootSumV3 } from "../../src/graph-generation-budget";
import { body, seed, ownedPath } from "./fixtures";

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
    expect(() => x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, body(lease.subIntents[0]!.subIntentId, "A"), 3)).toThrow();
  } finally { x.db.close(); }
});

test("pin/debit/outbox/journal roll back together on append failure", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const before = x.store.read("author"), cursor = x.events.cursor("author"), slots = x.store.slots("author");
    const real = x.events.append.bind(x.events), spy = spyOn(x.events, "append").mockImplementation((...args) => {
      real(...args); throw new Error("synthetic append failure AFTER real append");
    });
    try { expect(() => x.store.prepareAdmissionV3(x.handle, before, lease, body(lease.subIntents[0]!.subIntentId, "A"), 2)).toThrow(); }
    finally { spy.mockRestore(); }
    expect(x.store.read("author")).toEqual(before); expect(x.events.cursor("author")).toEqual(cursor);
    expect(x.store.slots("author")).toEqual(slots); expect(x.store.admissions("author")).toEqual([]);
  } finally { x.db.close(); }
});

test("exact reopen/retry is an identity read; changed body/ID refuses", () => {
  const x = seed(); let reopened: Database | undefined; try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const request = body(lease.subIntents[0]!.subIntentId, "A");
    const first = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2), cursor = x.events.cursor("author");
    x.db.close(); reopened = openGraphGenerationFixture(x.path);
    const log = new EventLog(reopened), store = new GraphGenerationStoreV1(reopened, log), authority = new FixtureTrustedAuthorityV1(reopened);
    const handle = authority.resolve(x.controller);
    expect(store.prepareAdmissionV3(handle, store.read("author"), lease, request, 20)).toEqual(first);
    expect(log.cursor("author")).toEqual(cursor);
    expect(() => store.prepareAdmissionV3(handle, store.read("author"), lease, { ...request, command: { prompt: "different" } }, 21)).toThrow();
    expect(() => store.prepareAdmissionV3(handle, store.read("author"), lease, { ...request, executionId: "different", idempotencyKey: "different" }, 21)).toThrow();
    expect(store.slots("author").filter(s => s.state === "SPENT")).toHaveLength(1);
  } finally { if (reopened) reopened.close(); else x.db.close(); }
});

test("oversized engaged body burns once, never refunds or dispatches", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1);
    const request = body(lease.subIntents[0]!.subIntentId, "A", "x".repeat(100001));
    const result = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 2);
    expect(result.status).toBe("BURNED"); expect(x.store.admissions("author")).toEqual([]);
    const cursor = x.events.cursor("author");
    expect(x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, 20)).toEqual(result);
    expect(x.events.cursor("author")).toEqual(cursor);
    expect(() => x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, body(lease.subIntents[0]!.subIntentId, "A"), 21)).toThrow();
  } finally { x.db.close(); }
});

test("expiry is not Q; exact never-sent proof permits physical release only", () => {
  const x = seed(); try {
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 3, 1);
    const request = body(lease.subIntents[0]!.subIntentId, "A");
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
    const request = body(lease.subIntents[0]!.subIntentId, "A");
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
    const request = body(lease.subIntents[0]!.subIntentId, "A");
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
