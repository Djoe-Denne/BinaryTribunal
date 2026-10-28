/**108 Future author fixture composition; manual expectations live in test and107.
 * No top-level construction. Helpers implemented after the manual test cases. */
import { t2Fixture, collectT2, activateT2, reopenT2, nextCandidateT2, type T2Ready93, type T2Fixture93 } from "./t2-fixtures";
import { body } from "./fixtures";
import { resourceWitness, assignmentInput, allocationInput, remainingInput, publishRemaining } from "./resource-fixtures";
import { canonical } from "./s1-source-fixtures";
import type { FamilyLeaseV3, PreparedAdmissionV3 } from "../../src/graph-generation-store";
import type { FixtureObservationRecordV1 } from "../../src/graph-trusted-authority";
import { BURN_ADMISSION_ADDEND_107, CROSS_EPOCH_107 } from "../../../../../../.opencode/missions/team_mvnxgnse_0000_39vpc8/inputs/s2-cross-epoch-fixture-r2/cross-epoch-fixtures";

type Defect108 = "Q-missing" | "Q-wrong-body" | "Q-wrong-attempt" | "Q-wrong-controller-fence" | "Q-wrong-family-fence" | "terminal-but-worker-held";
export interface CrossEpoch108 extends T2Fixture93 {
  a: PreparedAdmissionV3; b: PreparedAdmissionV3; lease: FamilyLeaseV3; qRef: string | null; q: FixtureObservationRecordV1;
  ready108: T2Ready93 | null; retryUnchanged: boolean; failedProofCause: string | null;
  rawHistory(): unknown; childStates(): string[]; lastObservationEffect(): string | null; activationRecords(): number; freshConsumption(): void;
}
const time = (x: T2Fixture93) => x.events.cursor("author").time + 1;
export function crossEpochFixture108(options: { defect?: Defect108 } = {}): CrossEpoch108 {
  let work: { a: PreparedAdmissionV3; b: PreparedAdmissionV3; lease: FamilyLeaseV3; qRef: string | null; q: FixtureObservationRecordV1; retryUnchanged: boolean; failedProofCause: string | null };
  const base = t2Fixture({ parentExpiresAtEvent: 10000, crossEpoch: true, beforePreparation(x) {
    //107 names an absolute familyExpiresAtEvent=1000. reserveFamily takes a
    // duration and itself adds sequence+1: preserve the promised deadline.
    const ttl = CROSS_EPOCH_107.sourceChecksBeforeAnySeal.familyExpiresAtEvent - x.events.cursor("author").sequence - 1;
    if (ttl < 2) throw new Error("HOLD: crossEpoch promised family expiry already unavailable");
    const lease = x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, ttl, time(x), x.acquisition);
    const A = lease.subIntents.find(s => s.role === "A")!, B = lease.subIntents.find(s => s.role === "B")!;
    const aBody = body(x, A.subIntentId, "A"), aWitness = resourceWitness(x, lease);
    const a = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, aBody, time(x), aWitness);
    if (a.status !== "PREPARED" || a.cap !== 100000 || a.image.admissionUtf8Bytes > 100000) throw new Error("HOLD: crossEpoch A does not fit ratified C100000");
    const beforeRetry = { slots: x.store.slots("author"), cursor: x.events.cursor("author") };
    const retry = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, aBody, time(x), aWitness);
    const retryUnchanged = canonical(retry) === canonical(a) && canonical(beforeRetry) === canonical({ slots: x.store.slots("author"), cursor: x.events.cursor("author") });
    const allocation = allocationInput(assignmentInput(x, lease, "A"));
    const oldRemaining = x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef;
    publishRemaining(x, remainingInput(x, "A", [allocation], 2, oldRemaining));
    const bBody = { ...body(x, B.subIntentId, "B"), [BURN_ADMISSION_ADDEND_107.property]: "x".repeat(100001) };
    const b = x.store.prepareAdmissionV3(x.handle, x.store.read("author"), lease, bBody, time(x), resourceWitness(x, lease, "B"));
    if (b.status !== "BURNED" || b.cap !== 100000 || b.image.admissionUtf8Bytes <= 100000) throw new Error("HOLD: crossEpoch B not ratified over-C burn");
    const q: FixtureObservationRecordV1 = { kind: "observation", missionId: "author", generationId: lease.generationId, envelopeFingerprint: x.sealed.envelope.fingerprint,
      owner: lease.owner, controllerFence: lease.controllerFence, familyFence: lease.familyFence, executionId: a.executionId, requestDigest: a.image.requestDigest,
      attempt: 0, state: "absent", quiescent: true };
    if (options.defect === "Q-wrong-body") q.requestDigest = q.requestDigest === "f".repeat(64) ? "e".repeat(64) : "f".repeat(64);
    if (options.defect === "Q-wrong-attempt") q.attempt = 1;
    if (options.defect === "Q-wrong-controller-fence") q.controllerFence += 1;
    if (options.defect === "Q-wrong-family-fence") q.familyFence += 1;
    let qRef: string | null = null, failedProofCause: string | null = null;
    if (options.defect !== "Q-missing") {
      qRef = x.authority.register(q);
      try { x.store.proveTerminalV3(x.handle, x.store.read("author"), lease, x.authority.resolve(qRef), time(x)); }
      catch (error) { if (!["Q-wrong-body", "Q-wrong-attempt"].includes(options.defect ?? "")) throw error; failedProofCause = String((error as Error).message); }
    }
    if (!options.defect) {
      x.store.releaseProvenV3(x.handle, x.store.read("author"), lease, time(x));
      publishRemaining(x, remainingInput(x, "releasedA", [], 3, x.authority.resourceCurrent("pool:synthetic:shared-74")!.remainingRef));
    }
    // Every real work event since bootstrap is now an input to the HOST journal;
    // no expected result is generated from the SUT here.
    x.host93.noteWork108(x.events.read("author"));
    work = { a, b, lease, qRef, q, retryUnchanged, failedProofCause };
  } });
  const x = decorate108({ ...base, ...work!, ready108: null });
  return x;
}
function decorate108(x: Omit<CrossEpoch108, "rawHistory" | "childStates" | "lastObservationEffect" | "activationRecords" | "freshConsumption"> | CrossEpoch108): CrossEpoch108 {
  const y = x as CrossEpoch108;
  y.rawHistory = () => ({ families: y.db.query("SELECT * FROM g3_families ORDER BY mission,generation,unit").all(),
    outboxes: y.db.query("SELECT * FROM g3_outbox ORDER BY execution_id").all(), resource: y.store.resourceInventory("pool:synthetic:shared-74") });
  y.childStates = () => (y.db.query("SELECT state FROM g3_units WHERE generation=? ORDER BY unit").all(y.store.read("author").generationId) as { state: string }[]).map(row => row.state);
  y.lastObservationEffect = () => (y.events.read("author").filter(e => e.kind === "g3_fixture_observation").at(-1)?.payload as { effect: string } | undefined)?.effect ?? null;
  y.activationRecords = () => (y.db.query("SELECT count(*) AS n FROM g3_authority WHERE kind='activation-record'").get() as { n: number }).n;
  y.freshConsumption = () => { nextCandidateT2(y); collectT2(y); };
  return y;
}
export function finishCrossEpoch108(x: CrossEpoch108) { x.ready108 ??= collectT2(x); return activateT2(x, x.ready108); }
export function reopenCrossEpoch108(x: CrossEpoch108, options: { forFreshConsumption?: boolean } = {}): CrossEpoch108 {
  return decorate108({ ...x, ...reopenT2(x, { reconnectRetainedOrigin: options.forFreshConsumption === true }), ready108: x.ready108 });
}
export function invalidateCrossEpoch108(x: CrossEpoch108, defect: string): void {
  if (defect === "Q-revoked-live") { x.authority.revoke(x.qRef!); return; }
  if (defect === "late-accepted-contradiction") {
    const ref = x.authority.register({ ...x.q, attempt: 1, state: "accepted", quiescent: false });
    x.store.reconcileAdmissionV3(x.handle, x.store.read("author"), x.lease, x.authority.resolve(ref), time(x)); x.host93.noteWork108(x.events.read("author")); return;
  }
  if (defect === "unknown-category") { x.ready108 = collectT2(x); x.defect("unknown-category", x.ready108); return; }
  if (defect === "unknown-source-or-producer") {
    const e = x.events.append("author", "cross108:unadmitted", "g3_unowned_publication", time(x), { owner: "not-admitted" });
    x.host93.note("own", "bootstrap", x.finalHost.allocation.ref, e.key); return;
  }
  throw new Error("unknown crossEpoch defect");
}
