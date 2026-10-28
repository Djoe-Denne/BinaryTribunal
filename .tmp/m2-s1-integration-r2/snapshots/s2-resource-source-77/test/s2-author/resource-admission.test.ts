import { expect, spyOn, test } from "bun:test";
import { seed, body, ownedPath } from "./fixtures";
import { acquisitionInput, assignmentInput, allocationInput, remainingInput, resourceWitness, publishRemaining, MANUAL_EXPECTATIONS, FINITE_NEGATIVES } from "./resource-fixtures";
import { document } from "./s1-source-fixtures";
import { openGraphGenerationFixture, GraphGenerationStoreV1 } from "../../src/graph-generation-store";
import { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";
import { EventLog } from "../../src/eventlog";

// Written BEFORE ledger implementation76. Expected values are manual74/75,
// not calls to a planner/ledger to construct their own oracle. No SKIP as PASS.
function reserve(x: ReturnType<typeof seed>) { return x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1, x.acquisition); }
function attempt(x: ReturnType<typeof seed>, lease: ReturnType<typeof reserve>, role: "A" | "B" | "R", witness = resourceWitness(x, lease, role)) {
  const request = body(x, lease.subIntents.find(s => s.role === role)!.subIntentId, role);
  return x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, request, Math.max(2, x.events.cursor("author").time), witness);
}
function effects(x: ReturnType<typeof seed>) { return { head: x.store.read("author"), cursor: x.events.cursor("author"),
  claims: x.store.claims("author"), slots: x.store.slots("author"), outbox: x.store.admissions("author"), inventory: x.store.resourceInventory("pool:synthetic:shared-74") }; }
test("new consumption without opaque connection-bound acquisition/witness is HOLD", () => {
  const x = seed(); try {
    const before = effects(x);
    expect(() => x.store.reserveFamily(x.handle, before.head, x.unitId, 1000, 1)).toThrow(); expect(effects(x)).toEqual(before);
    const lease = reserve(x), reserved = effects(x);
    expect(() => x.store.prepareAdmissionV3(x.handle, reserved.head, lease, body(x, lease.subIntents[0]!.subIntentId, "A"), 2)).toThrow();
    expect(effects(x)).toEqual(reserved);
    expect(() => attempt(x, lease, "A", {} as never)).toThrow(); expect(effects(x)).toEqual(reserved);
  } finally { x.db.close(); }
});
test("worker exclusive with spare six-dimensional capacity; distinct alias worker shares account exactly", () => {
  const x = seed(); try {
    const lease = reserve(x), a = assignmentInput(x, lease, "A"); attempt(x, lease, "A");
    const current = x.authority.resourceCurrent("pool:synthetic:shared-74")!;
    publishRemaining(x, remainingInput(x, "A", [allocationInput(a)], 2, current.remainingRef));
    const before = effects(x), same = resourceWitness(x, lease, "B", "worker-a");
    expect(() => attempt(x, lease, "B", same)).toThrow(); expect(effects(x)).toEqual(before);
    // Assignment is FIXED: another worker for that execution is not a retry.
    expect(() => resourceWitness(x, lease, "B", "worker-b")).toThrow();
  } finally { x.db.close(); }
  const y = seed(); try {
    const lease = reserve(y), a = assignmentInput(y, lease, "A"), b = assignmentInput(y, lease, "B");
    attempt(y, lease, "A"); publishRemaining(y, remainingInput(y, "A", [allocationInput(a)], 2, y.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef));
    attempt(y, lease, "B"); const inventory = y.store.resourceInventory("pool:synthetic:shared-74");
    expect(inventory.active.map(a => a.allocationId)).toEqual(MANUAL_EXPECTATIONS.afterAB.active);
    expect(y.store.slots("author").filter(s => s.state === "SPENT")).toHaveLength(2);
    expect(y.store.slots("author").filter(s => s.state === "ENCUMBERED")).toHaveLength(1);
    publishRemaining(y, remainingInput(y, "AB", [allocationInput(a), allocationInput(b)], 3, y.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef));
  } finally { y.db.close(); }
});
test.each(FINITE_NEGATIVES.insufficient)("six dimensions are independent, insufficiency %j has no debit", negative => {
  const x = seed(); try {
    const lease = reserve(x), remaining = remainingInput(x, "empty", [], 1, null);
    if (negative.pool === "shared") Object.assign(remaining.accounts[0]!, { [negative.dimension]: negative.remaining });
    else Object.assign(remaining.workers[0]!, { [negative.dimension]: negative.remaining });
    const ref = publishRemaining(x, remaining), assignment = assignmentInput(x, lease, "A");
    const assignmentRef = x.authority.registerResourceSource(document(assignment.version, assignment));
    const witness = x.authority.resolveResourceWitness({ acquisitionRef: x.acquisitionRef, remainingRef: ref, assignmentRef });
    const before = effects(x); expect(() => attempt(x, lease, "A", witness)).toThrow(); expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test.each(FINITE_NEGATIVES.unknownEach)("unknown %s is HOLD, not zero or infinite", field => {
  const x = seed(); try {
    const lease = reserve(x), remaining = remainingInput(x, "empty", [], 1, null);
    if (field.startsWith("worker.")) Object.assign(remaining.workers[0]!, { [field.slice(7)]: null });
    else if (field.startsWith("account.")) Object.assign(remaining.accounts[0]!, { [field.slice(8)]: null });
    else remaining.maxConcurrentRemaining = null;
    publishRemaining(x, remaining); const witness = resourceWitness(x, lease), before = effects(x);
    expect(() => attempt(x, lease, "A", witness)).toThrow(); expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test.each([false, null] as const)("unavailable %s does not acquire worker", available => {
  const x = seed(); try {
    const lease = reserve(x), remaining = remainingInput(x, "empty", [], 1, null); remaining.workers[0]!.available = available;
    publishRemaining(x, remaining); const witness = resourceWitness(x, lease), before = effects(x);
    expect(() => attempt(x, lease, "A", witness)).toThrow(); expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test("new snapshot invalidates old handle even without a changed work head", () => {
  const x = seed(); try {
    const lease = reserve(x), old = resourceWitness(x, lease), current = x.authority.resourceCurrent("pool:synthetic:shared-74")!;
    publishRemaining(x, remainingInput(x, "empty", [], 2, current.remainingRef)); const before = effects(x);
    expect(() => attempt(x, lease, "A", old)).toThrow(); expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test.each(["acquisition", "remaining", "assignment"] as const)("revoked %s witness source cannot be consumed", which => {
  const x = seed(); try {
    const lease = reserve(x), witness = resourceWitness(x, lease), assignment = assignmentInput(x, lease, "A");
    const refs = { acquisition: x.acquisitionRef, remaining: x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef,
      assignment: document(assignment.version, assignment).ref };
    x.authority.revokeResourceSource(refs[which]); const before = effects(x);
    expect(() => attempt(x, lease, "A", witness)).toThrow(); expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test("pool reset/acquisition replacement/alias pool and false empty set cannot erase A", () => {
  const x = seed(); try {
    const lease = reserve(x); attempt(x, lease, "A"); const before = effects(x), sourceBefore = x.authority.resourceCurrent("pool:synthetic:shared-74");
    const replacement = acquisitionInput(); replacement.recordId = "new-acquisition";
    expect(() => x.authority.registerResourceSource(document(replacement.version, replacement))).toThrow();
    replacement.poolScope.poolId = "renamed-pool";
    expect(() => x.authority.registerResourceSource(document(replacement.version, replacement))).toThrow();
    const empty = remainingInput(x, "empty", [], 2, x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef);
    expect(() => publishRemaining(x, empty)).toThrow(); expect(effects(x)).toEqual(before);
    expect(x.authority.resourceCurrent("pool:synthetic:shared-74")).toEqual(sourceBefore);
    const foreignWork = assignmentInput(x, lease, "B"); foreignWork.workScope.unitId = "another-unit"; foreignWork.assignment.unitId = "another-unit";
    const ref = x.authority.registerResourceSource(document(foreignWork.version, foreignWork));
    expect(() => attempt(x, lease, "B", x.authority.resolveResourceWitness({ acquisitionRef: x.acquisitionRef,
      remainingRef: x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef, assignmentRef: ref }))).toThrow();
    expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test("R is HOLD without reviewer Assignment and entitlement remains encumbered", () => {
  const x = seed(); try { const lease = reserve(x), before = effects(x);
    const r = lease.subIntents.find(s => s.role === "R")!;
    expect(() => x.store.prepareAdmissionV3(x.handle, before.head, lease, body(x, r.subIntentId, "R"), 2)).toThrow("HOLD: connection-bound resource witness missing");
    expect(() => attempt(x, lease, "R")).toThrow("HOLD: fixed worker/profile/account/tools mismatch"); expect(effects(x)).toEqual(before);
    expect(x.store.slots("author").map(s => s.state)).toEqual(["ENCUMBERED", "ENCUMBERED", "ENCUMBERED"]);
  } finally { x.db.close(); }
});
test("physical allocation rolls back with slot/outbox and an AFTER-append failure", () => {
  const x = seed(); try {
    const lease = reserve(x), witness = resourceWitness(x, lease), before = effects(x), real = x.events.append.bind(x.events);
    const spy = spyOn(x.events, "append").mockImplementation((...args) => { real(...args); throw new Error("after append"); });
    try { expect(() => attempt(x, lease, "A", witness)).toThrow(); } finally { spy.mockRestore(); }
    expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test("BURNED validates sources but never occupies a worker; exact retry adds nothing", () => {
  const x = seed(ownedPath(), true, { cap: 1, rootCap: 100000 }); try {
    const lease = reserve(x), witness = resourceWitness(x, lease), first = attempt(x, lease, "A", witness), before = effects(x);
    expect(first.status).toBe("BURNED"); expect(before.inventory.active).toEqual([]);
    expect(before.claims).toHaveLength(1); expect(before.outbox).toEqual([]);
    expect(attempt(x, lease, "A", witness)).toEqual(first); expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test("Q releases exact allocation, not logical debit; old Q cannot erase B reassigned on A worker", () => {
  const x = seed(); try {
    const lease = reserve(x), aWitness = resourceWitness(x, lease), a = attempt(x, lease, "A", aWitness);
    const proof = x.authority.resolve(x.authority.register({ kind: "observation", missionId: "author", generationId: lease.generationId,
      envelopeFingerprint: x.sealed.envelope.fingerprint, owner: lease.owner, controllerFence: lease.controllerFence,
      familyFence: lease.familyFence, executionId: a.executionId, requestDigest: a.image.requestDigest, attempt: 0, state: "absent", quiescent: true }));
    x.store.proveTerminalV3(x.handle, x.store.read("author"), lease, proof, 3);
    x.store.releaseExecutionResources(x.handle, x.store.read("author"), lease, "allocation:A", a.executionId, 4);
    publishRemaining(x, remainingInput(x, "releasedA", [], 2, x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef));
    attempt(x, lease, "B", resourceWitness(x, lease, "B", "worker-a")); const before = effects(x);
    x.store.releaseExecutionResources(x.handle, x.store.read("author"), lease, "allocation:A", a.executionId, 5);
    expect(effects(x)).toEqual(before); expect(before.inventory.active.map(a => a.allocationId)).toEqual(["allocation:B"]);
    expect(attempt(x, lease, "A", aWitness)).toEqual(a); expect(effects(x)).toEqual(before); // no terminal rekindle
    expect(before.slots.filter(s => s.state === "SPENT")).toHaveLength(2);
    expect(() => x.store.releaseProvenV3(x.handle, x.store.read("author"), lease, 6)).toThrow(); expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test.each([
  { slots: 1, budget: 6, afterSlots: 0, afterBudget: 3 },
  { slots: 2, budget: 5, afterSlots: 1, afterBudget: 2 },
] as const)("shared account acquired %j blocks B separately from spare worker capacity", facts => {
  const grant = acquisitionInput(); grant.accounts[0]!.slots = facts.slots; grant.accounts[0]!.budget = facts.budget;
  const x = seed(ownedPath(), true, { cap: 100000, rootCap: 100000 }, grant); try {
    const lease = reserve(x), empty = remainingInput(x, "empty", [], 1, null);
    Object.assign(empty.accounts[0]!, { slots: facts.slots, budget: facts.budget }); publishRemaining(x, empty);
    const a = assignmentInput(x, lease, "A"); attempt(x, lease, "A");
    const after = remainingInput(x, "A", [allocationInput(a)], 2, x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef);
    Object.assign(after.accounts[0]!, { slots: facts.afterSlots, budget: facts.afterBudget }); publishRemaining(x, after);
    const witness = resourceWitness(x, lease, "B"), before = effects(x);
    expect(() => attempt(x, lease, "B", witness)).toThrow(); expect(effects(x)).toEqual(before);
    expect(before.inventory.active.map(a => a.allocationId)).toEqual(["allocation:A"]);
  } finally { x.db.close(); }
});
test.each(["poolRevision", "headRevision", "inventoryRevision", "observedEventSequence"] as const)("stale %s cannot renew source or consume", field => {
  const x = seed(); try {
    const lease = reserve(x), witness = resourceWitness(x, lease), current = x.authority.resourceCurrent("pool:synthetic:shared-74")!;
    const stale = remainingInput(x, "empty", [], 2, current.remainingRef);
    if (field === "poolRevision") stale.poolRevision++; else stale.workCuts[0]![field]++;
    const before = effects(x); expect(() => publishRemaining(x, stale)).toThrow(); expect(effects(x)).toEqual(before);
    x.events.append("author", "host-observation-advanced", "fixture-clock", 3, {}); const advanced = effects(x);
    expect(() => attempt(x, lease, "A", witness)).toThrow(); expect(effects(x)).toEqual(advanced);
  } finally { x.db.close(); }
});
test.each(["sourceEnvelopeRef", "sourceTemplateRef", "sourcePlanningRef", "sourceBindingsRef", "owner", "controllerFence", "familyFence", "generationId"] as const)("fixed Assignment %s mismatch refuses before logical debit", field => {
  const x = seed(); try {
    const lease = reserve(x), a = assignmentInput(x, lease, "A");
    if (field.endsWith("Ref")) Object.assign(a.workScope, { [field]: { ...a.workScope.sourceEnvelopeRef, sha256: "f".repeat(64) } });
    else if (field === "controllerFence" || field === "familyFence") a.workScope[field]++;
    else Object.assign(a.workScope, { [field]: "foreign" });
    const assignmentRef = x.authority.registerResourceSource(document(a.version, a));
    const remainingRef = publishRemaining(x, remainingInput(x, "empty", [], 1, null));
    const witness = x.authority.resolveResourceWitness({ acquisitionRef: x.acquisitionRef, assignmentRef, remainingRef }), before = effects(x);
    expect(() => attempt(x, lease, "A", witness)).toThrow(); expect(effects(x)).toEqual(before);
  } finally { x.db.close(); }
});
test("included set CONTENT, duplicate IDs and missing A are rejected, never re-deducted", () => {
  const x = seed(); try {
    const lease = reserve(x), a = assignmentInput(x, lease, "A"); attempt(x, lease, "A");
    const correct = remainingInput(x, "A", [allocationInput(a)], 2, x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef), before = effects(x);
    for (const change of [
      { includedAllocationIds: [], includedAllocationsDigest: "f".repeat(64) },
      { includedAllocationIds: ["allocation:A", "allocation:A"] },
      { includedAllocationsDigest: "f".repeat(64) },
    ]) { expect(() => publishRemaining(x, { ...structuredClone(correct), ...change })).toThrow(); expect(effects(x)).toEqual(before); }
    publishRemaining(x, correct); const witness = resourceWitness(x, lease, "B");
    expect(attempt(x, lease, "B", witness).status).toBe("PREPARED"); // account1/3 fits ONCE, not account0/0
  } finally { x.db.close(); }
});
test("revoked capacity does not block exact Q/physical stop and does not refund SPENT", () => {
  const x = seed(); try {
    const lease = reserve(x), witness = resourceWitness(x, lease), a = attempt(x, lease, "A", witness);
    x.authority.revokeResourceSource(x.acquisitionRef);
    const proof = x.authority.resolve(x.authority.register({ kind: "observation", missionId: "author", generationId: lease.generationId,
      envelopeFingerprint: x.sealed.envelope.fingerprint, owner: lease.owner, controllerFence: lease.controllerFence, familyFence: lease.familyFence,
      executionId: a.executionId, requestDigest: a.image.requestDigest, attempt: 0, state: "absent", quiescent: true }));
    x.store.proveTerminalV3(x.handle, x.store.read("author"), lease, proof, 3);
    x.store.releaseExecutionResources(x.handle, x.store.read("author"), lease, "allocation:A", a.executionId, 4);
    expect(x.store.resourceInventory("pool:synthetic:shared-74").active).toEqual([]);
    expect(x.store.slots("author").filter(s => s.state === "SPENT")).toHaveLength(1);
    expect(x.store.slots("author").filter(s => s.state === "ENCUMBERED")).toHaveLength(2);
  } finally { x.db.close(); }
});
test("remaining observation/current concurrency cap is independent of logical grants", () => {
  const x = seed(); try {
    const lease = reserve(x), remaining = remainingInput(x, "empty", [], 1, null); remaining.maxConcurrentRemaining = 0;
    publishRemaining(x, remaining); const witness = resourceWitness(x, lease), before = effects(x);
    expect(() => attempt(x, lease, "A", witness)).toThrow(); expect(effects(x)).toEqual(before);
    expect(before.slots.map(s => s.state)).toEqual(["ENCUMBERED", "ENCUMBERED", "ENCUMBERED"]);
  } finally { x.db.close(); }
});
test("acquired concurrency1 admits A once and blocks B despite separate idle worker/account1/3", () => {
  const grant = acquisitionInput(); grant.maxConcurrent = 1;
  const x = seed(ownedPath(), true, { cap: 100000, rootCap: 100000 }, grant); try {
    const lease = reserve(x), empty = remainingInput(x, "empty", [], 1, null); empty.maxConcurrentRemaining = 1; publishRemaining(x, empty);
    const a = assignmentInput(x, lease, "A"); attempt(x, lease, "A");
    const remaining = remainingInput(x, "A", [allocationInput(a)], 2, x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef);
    remaining.maxConcurrentRemaining = 0; publishRemaining(x, remaining);
    const witness = resourceWitness(x, lease, "B"), before = effects(x);
    expect(() => attempt(x, lease, "B", witness)).toThrow("HOLD: physical concurrency unknown/exhausted"); expect(effects(x)).toEqual(before);
    expect(before.inventory.active.map(a => a.allocationId)).toEqual(["allocation:A"]);
    expect(before.slots.filter(s => s.state === "ENCUMBERED")).toHaveLength(2);
  } finally { x.db.close(); }
});
test("reopen verifies physical claims/events, old connection handle is not transferable; retained retry is read only", () => {
  const x = seed(); let closed = false; try {
    const lease = reserve(x), witness = resourceWitness(x, lease), first = attempt(x, lease, "A", witness), before = effects(x);
    const assignment = assignmentInput(x, lease, "A"), current = x.authority.resourceCurrent("pool:synthetic:shared-74")!;
    x.db.close(); closed = true; const db = openGraphGenerationFixture(x.path);
    try { const log = new EventLog(db), store = new GraphGenerationStoreV1(db, log), authority = new FixtureTrustedAuthorityV1(db), controller = authority.resolve(x.controller);
      expect(store.resourceInventory("pool:synthetic:shared-74").active.map(a => a.allocationId)).toEqual(["allocation:A"]);
      const request = body(x, lease.subIntents[0]!.subIntentId, "A");
      expect(() => store.prepareAdmissionV3(controller, store.read("author"), lease, request, 10, witness)).toThrow();
      const fresh = authority.resolveResourceWitness({ acquisitionRef: x.acquisitionRef, remainingRef: current.remainingRef, assignmentRef: document(assignment.version, assignment).ref });
      expect(store.prepareAdmissionV3(controller, store.read("author"), lease, request, 10, fresh)).toEqual(first);
      expect(log.cursor("author")).toEqual(before.cursor);
    } finally { db.close(); }
  } finally { if (!closed) x.db.close(); }
});
