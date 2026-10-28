/** Explicit offline fixture authority. No HOST/native provider or RPC exists here. */
import type { Database } from "bun:sqlite";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import { immutableCopy, integer, invariant, nonempty } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import type { BoundDocument, ByteRef } from "./graph-execution-envelope";
import { EventLog } from "./eventlog";
import { checkResourceSourceV1, checkResourceRefV1, closedResourceFieldsV1, resourceRefKeyV1, assertResourceSnapshotV1,
  type ResourceSourceV1, type ResourceAcquisitionV1, type ResourceAssignmentV1, type ResourceCurrentV1 } from "./graph-resource-ledger";

interface Scope { missionId: string; generationId: string; envelopeFingerprint: string; owner: string; controllerFence: number }
export interface FixtureControllerRecordV1 extends Scope { kind: "controller"; expiresAtEvent: number }
export interface FixtureObservationRecordV1 extends Scope {
  kind: "observation"; executionId: string; requestDigest: string; familyFence: number; attempt: number;
  state: "accepted" | "completed" | "stopped" | "failed" | "absent" | "unknown" | "rejected";
  quiescent: boolean;
}
export type FixtureAuthorityRecordV1 = FixtureControllerRecordV1 | FixtureObservationRecordV1;
const brand = Symbol("private offline fixture handle");
export interface FixtureAuthorityHandleV1 { readonly [brand]: true }
const handles = new WeakMap<object, { db: Database; ref: string; revision: number; digest: string }>();
const resourceBrand = Symbol("private offline physical resource witness");
export interface FixtureResourceAcquisitionHandleV1 { readonly [resourceBrand]: "acquisition" }
export interface FixtureResourceWitnessV1 { readonly [resourceBrand]: "witness" }
interface ResourcePin { db: Database; acquisitionRef: ByteRef; remainingRef?: ByteRef; assignmentRef?: ByteRef; currentRevision?: number; currentDigest?: string }
const resourceHandles = new WeakMap<object, ResourcePin>();
interface ResourceRow { kind: string; revision: number; document: string; digest: string; revoked: number }
const resourceKind = (v: ResourceSourceV1) => v.version === "l8-s2-resource-acquisition-fixture-v1" ? "resource-acquisition"
  : v.version === "l8-s2-resource-remaining-fixture-v1" ? "resource-remaining" : "resource-assignment";
/** Always re-read the independently registered bytes, not a request's DTO. */
export function readFixtureResourceSourceV1(db: Database, ref: ByteRef): ResourceSourceV1 {
  const row = db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(resourceRefKeyV1(ref)) as ResourceRow | null;
  invariant(row && !row.revoked && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: resource source missing/revoked/corrupt", "auth");
  const document = JSON.parse(row.document) as BoundDocument<ResourceSourceV1>, value = checkResourceSourceV1(document);
  invariant(canonical(document) === row.document && canonical(document.ref) === canonical(ref) && row.revision === value.revision && row.kind === resourceKind(value), "HOLD: resource source binding", "auth");
  return value;
}
export function readFixtureResourceCurrentV1(db: Database, poolId: string): ResourceCurrentV1 | null {
  nonempty(poolId);
  const row = db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(`resource-current:${poolId}`) as ResourceRow | null;
  if (!row) return null;
  invariant(!row.revoked && row.kind === "resource-current" && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: resource current source revoked/corrupt", "auth");
  const c = JSON.parse(row.document) as ResourceCurrentV1;
  closedResourceFieldsV1(c, ["version", "recordId", "revision", "poolRevision", "poolScope", "acquisitionRef", "remainingRef", "revocationRef"]);
  invariant(c.version === "l8-s2-resource-current-fixture-v1" && c.recordId === `resource-current:${poolId}` && c.poolScope.poolId === poolId
    && c.revision === row.revision && c.revocationRef === null && canonical(c) === row.document, "HOLD: resource current projection");
  integer(c.poolRevision); checkResourceRefV1(c.acquisitionRef); checkResourceRefV1(c.remainingRef); return immutableCopy(c);
}
/** A physical mutation advances the global pool cut, NOT the independent host
 * observation or its revision/remainingRef. That observation is now stale. */
export function advanceFixtureResourcePoolV1(db: Database, poolId: string, expected: number): void {
  const current = readFixtureResourceCurrentV1(db, poolId); invariant(current && current.poolRevision === expected, "HOLD: physical pool projection CAS");
  integer(expected + 1); const next = { ...current, poolRevision: expected + 1 };
  invariant(db.query("UPDATE g3_authority SET document=?,digest=? WHERE record_ref=? AND revision=? AND digest=?")
    .run(canonical(next), fingerprint(next), current.recordId, current.revision, fingerprint(current)).changes === 1, "HOLD: physical pool current CAS lost");
}
function acquisitionFor(db: Database, ref: ByteRef): ResourceAcquisitionV1 {
  const value = readFixtureResourceSourceV1(db, ref);
  invariant(value.version === "l8-s2-resource-acquisition-fixture-v1", "HOLD: acquisition source required");
  const rows = db.query("SELECT document FROM g3_authority WHERE kind='resource-acquisition'").all() as { document: string }[];
  // This fixture tranche has one independently proven physical host domain.
  // A second/domain-transfer needs a new contract, not guessed disjointness.
  invariant(rows.length === 1 && canonical((JSON.parse(rows[0]!.document) as BoundDocument<ResourceSourceV1>).ref) === canonical(ref), "HOLD: acquisition replacement/domain unproven"); return value;
}
export function resolveFixtureResourceAcquisitionV1(db: Database, handle: FixtureResourceAcquisitionHandleV1 | undefined) {
  const pin = handle && typeof handle === "object" ? resourceHandles.get(handle) : undefined;
  invariant(pin && pin.db === db && !pin.assignmentRef, "HOLD: connection-bound acquisition handle missing", "auth");
  return { acquisition: acquisitionFor(db, pin.acquisitionRef), acquisitionRef: immutableCopy(pin.acquisitionRef) };
}
/** requireSnapshot=false is ONLY the retained identity/retry path. It still
 * checks acquisition, Assignment AND original Remaining source revocations.
 * It cannot allocate/emit; new consumption separately checks current + cuts.
 */
export function resolveFixtureResourceWitnessV1(db: Database, handle: FixtureResourceWitnessV1 | undefined, requireSnapshot: boolean) {
  const pin = handle && typeof handle === "object" ? resourceHandles.get(handle) : undefined;
  invariant(pin && pin.db === db && pin.assignmentRef && pin.remainingRef, "HOLD: connection-bound resource witness missing", "auth");
  const acquisition = acquisitionFor(db, pin.acquisitionRef), assignment = readFixtureResourceSourceV1(db, pin.assignmentRef), remaining = readFixtureResourceSourceV1(db, pin.remainingRef);
  invariant(assignment.version === "l8-s2-resource-assignment-fixture-v1" && remaining.version === "l8-s2-resource-remaining-fixture-v1"
    && canonical(assignment.acquisitionRef) === canonical(pin.acquisitionRef) && canonical(remaining.acquisitionRef) === canonical(pin.acquisitionRef)
    && assignment.workScope.poolId === acquisition.poolScope.poolId && canonical(remaining.poolScope) === canonical(acquisition.poolScope), "HOLD: resource witness source join");
  const current = readFixtureResourceCurrentV1(db, acquisition.poolScope.poolId);
  invariant(current && canonical(current.acquisitionRef) === canonical(pin.acquisitionRef), "HOLD: current retained acquisition unavailable");
  if (requireSnapshot) invariant(canonical(current.remainingRef) === canonical(pin.remainingRef) && current.revision === pin.currentRevision && fingerprint(current) === pin.currentDigest, "HOLD: stale current resource witness");
  return { acquisition, remaining, assignment, acquisitionRef: immutableCopy(pin.acquisitionRef), assignmentRef: immutableCopy(pin.assignmentRef), remainingRef: immutableCopy(pin.remainingRef) };
}

function checked(value: FixtureAuthorityRecordV1): FixtureAuthorityRecordV1 {
  assertExecutionJsonV1(value);
  const record = immutableCopy(value);
  invariant(record.kind === "controller" || record.kind === "observation", "fixture authority kind");
  for (const id of [record.missionId, record.generationId, record.owner]) nonempty(id);
  invariant(/^[a-f0-9]{64}$/.test(record.envelopeFingerprint), "fixture envelope fingerprint"); integer(record.controllerFence);
  const base = ["kind", "missionId", "generationId", "envelopeFingerprint", "owner", "controllerFence"];
  const keys = record.kind === "controller" ? [...base, "expiresAtEvent"]
    : [...base, "executionId", "requestDigest", "familyFence", "attempt", "state", "quiescent"];
  invariant(Object.keys(record).length === keys.length && keys.every(k => Object.hasOwn(record, k)), "closed fixture authority record");
  if (record.kind === "controller") integer(record.expiresAtEvent, 1);
  else {
    nonempty(record.executionId); integer(record.familyFence, 1); integer(record.attempt);
    invariant(/^[a-f0-9]{64}$/.test(record.requestDigest) && typeof record.quiescent === "boolean"
      && ["accepted", "completed", "stopped", "failed", "absent", "unknown", "rejected"].includes(record.state), "fixture observation shape");
  }
  return record;
}

/** Fixed module function, not a caller-provided verification callback in a TX. */
export function resolveFixtureAuthorityV1(db: Database, handle: FixtureAuthorityHandleV1): FixtureAuthorityRecordV1 {
  const pin = handle && typeof handle === "object" ? handles.get(handle) : undefined;
  invariant(pin && pin.db === db, "HOLD: unknown/wrong-connection fixture handle", "auth");
  const row = db.query("SELECT revision,document,digest,revoked FROM g3_authority WHERE record_ref=?").get(pin.ref) as
    { revision: number; document: string; digest: string; revoked: number } | null;
  invariant(row && !row.revoked && row.revision === pin.revision && row.digest === pin.digest, "HOLD: revoked/stale fixture handle", "auth");
  const record = checked(JSON.parse(row.document) as FixtureAuthorityRecordV1);
  invariant(canonical(record) === row.document && fingerprint(record) === row.digest, "fixture authority corruption", "schema");
  return record;
}

/** Retained evidence must still resolve to its independently registered fixture
 * source; a persisted proof JSON alone is not a durable authority substitute. */
export function assertFixtureRecordCurrentV1(db: Database, value: FixtureAuthorityRecordV1): void {
  const record = checked(value), digest = fingerprint(record);
  const row = db.query("SELECT document,digest,revoked FROM g3_authority WHERE record_ref=?").get(`fixture:${digest}`) as
    { document: string; digest: string; revoked: number } | null;
  invariant(row && !row.revoked && row.digest === digest && row.document === canonical(record), "HOLD: retained fixture source unavailable/revoked", "auth");
}

/** Constructing this provider requires the privileged, owned fixture connection.
 * Register records only from the synthetic test host. JSON workers receive no DB
 * or provider; a caller boolean, copied handle or selfhash never resolves a handle.
 */
export class FixtureTrustedAuthorityV1 {
  constructor(private readonly db: Database) {}
  register(value: FixtureAuthorityRecordV1): string {
    const record = checked(value), digest = fingerprint(record), ref = `fixture:${digest}`;
    this.db.transaction(() => {
      const old = this.db.query("SELECT document,revoked FROM g3_authority WHERE record_ref=?").get(ref) as { document: string; revoked: number } | null;
      invariant(!old || (old.document === canonical(record) && !old.revoked), "fixture record changed/revoked");
      this.db.query("INSERT OR IGNORE INTO g3_authority VALUES(?,?,1,?,?,0)").run(ref, record.kind, canonical(record), digest);
    }).immediate();
    return ref;
  }
  resolve(ref: string): FixtureAuthorityHandleV1 {
    nonempty(ref);
    const row = this.db.query("SELECT revision,digest,revoked FROM g3_authority WHERE record_ref=?").get(ref) as { revision: number; digest: string; revoked: number } | null;
    invariant(row && !row.revoked, "fixture authority record unavailable", "auth");
    const handle: FixtureAuthorityHandleV1 = Object.freeze({ [brand]: true as const });
    handles.set(handle, { db: this.db, ref, revision: row.revision, digest: row.digest });
    resolveFixtureAuthorityV1(this.db, handle); return handle;
  }
  revoke(ref: string): void {
    const result = this.db.query("UPDATE g3_authority SET revoked=1,revision=revision+1 WHERE record_ref=? AND revoked=0").run(ref);
    invariant(result.changes === 1, "fixture record unavailable/already revoked");
  }
  /** Privileged synthetic HOST only. Never called with a submit-command's data.
   * Documents are registered without issuing executable/native authority. */
  registerResourceSource<T extends ResourceSourceV1>(input: BoundDocument<T>): ByteRef {
    const document = immutableCopy(input), value = checkResourceSourceV1(document), ref = resourceRefKeyV1(document.ref);
    return this.db.transaction(() => {
      const old = this.db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(ref) as ResourceRow | null;
      if (old) {
        invariant(!old.revoked && old.document === canonical(document), "HOLD: resource source changed/revoked");
        readFixtureResourceSourceV1(this.db, document.ref); return immutableCopy(document.ref);
      }
      if (value.version === "l8-s2-resource-acquisition-fixture-v1") {
        invariant(!this.db.query("SELECT 1 FROM g3_authority WHERE kind='resource-acquisition' LIMIT 1").get(), "HOLD: acquisition replacement/alias/unproven domain");
        invariant(!this.db.query("SELECT 1 FROM g3_claims UNION ALL SELECT 1 FROM g3_outbox").get(), "HOLD: unexplained old physical acquisition state");
      } else {
        const acquired = acquisitionFor(this.db, value.acquisitionRef);
        if (value.version === "l8-s2-resource-assignment-fixture-v1") {
          invariant(value.workScope.poolId === acquired.poolScope.poolId && value.workScope.fixtureId === acquired.poolScope.fixtureId, "HOLD: assignment foreign pool");
          const prior = this.db.query("SELECT document FROM g3_authority WHERE kind='resource-assignment'").all() as { document: string }[];
          for (const row of prior) {
            const doc = JSON.parse(row.document) as BoundDocument<ResourceAssignmentV1>, a = checkResourceSourceV1(doc);
            invariant(a.allocationId !== value.allocationId && !(a.workScope.poolId === value.workScope.poolId && a.executionId === value.executionId), "HOLD: fixed Assignment/allocation already retained");
          }
        } else {
          // EventLog is already installed and same connection; no fresh schema or
          // callback. Use its prototype read/replay with the existing DB only.
          const log = Object.assign(Object.create(EventLog.prototype) as EventLog, { db: this.db });
          assertResourceSnapshotV1(this.db, log, acquired, value);
          const current = readFixtureResourceCurrentV1(this.db, acquired.poolScope.poolId);
          invariant(current ? value.revision === current.revision + 1 && canonical(value.previousRef) === canonical(current.remainingRef)
            : value.revision === 1 && value.previousRef === null, "HOLD: resource current CAS/previousRef");
          const next: ResourceCurrentV1 = { version: "l8-s2-resource-current-fixture-v1", recordId: `resource-current:${acquired.poolScope.poolId}`,
            revision: value.revision, poolRevision: value.poolRevision, poolScope: acquired.poolScope, acquisitionRef: value.acquisitionRef, remainingRef: document.ref, revocationRef: null };
          if (current) invariant(this.db.query("UPDATE g3_authority SET revision=?,document=?,digest=? WHERE record_ref=? AND revision=? AND digest=? AND revoked=0")
            .run(next.revision, canonical(next), fingerprint(next), next.recordId, current.revision, fingerprint(current)).changes === 1, "HOLD: stale global resource current CAS");
          else this.db.query("INSERT INTO g3_authority VALUES(?,'resource-current',?,?,?,0)").run(next.recordId, next.revision, canonical(next), fingerprint(next));
        }
      }
      this.db.query("INSERT INTO g3_authority VALUES(?,?,?,?,?,0)").run(ref, resourceKind(value), value.revision, canonical(document), fingerprint(document));
      return immutableCopy(document.ref);
    }).immediate();
  }
  resourceCurrent(poolId: string): ResourceCurrentV1 | null { return readFixtureResourceCurrentV1(this.db, poolId); }
  resolveResourceAcquisition(ref: ByteRef): FixtureResourceAcquisitionHandleV1 {
    acquisitionFor(this.db, ref); const handle: FixtureResourceAcquisitionHandleV1 = Object.freeze({ [resourceBrand]: "acquisition" as const });
    resourceHandles.set(handle, { db: this.db, acquisitionRef: immutableCopy(ref) }); return handle;
  }
  resolveResourceWitness(refs: { acquisitionRef: ByteRef; remainingRef: ByteRef; assignmentRef: ByteRef }): FixtureResourceWitnessV1 {
    assertExecutionJsonV1(refs); closedResourceFieldsV1(refs, ["acquisitionRef", "remainingRef", "assignmentRef"]);
    const acquired = acquisitionFor(this.db, refs.acquisitionRef), current = readFixtureResourceCurrentV1(this.db, acquired.poolScope.poolId);
    invariant(current, "HOLD: resource current source unavailable");
    const handle: FixtureResourceWitnessV1 = Object.freeze({ [resourceBrand]: "witness" as const });
    resourceHandles.set(handle, { db: this.db, ...immutableCopy(refs), currentRevision: current.revision, currentDigest: fingerprint(current) });
    resolveFixtureResourceWitnessV1(this.db, handle, false); return handle;
  }
  revokeResourceSource(ref: ByteRef): void {
    invariant(this.db.query("UPDATE g3_authority SET revoked=1,revision=revision+1 WHERE record_ref=? AND revoked=0").run(resourceRefKeyV1(ref)).changes === 1, "HOLD: resource source missing/already revoked");
  }
}
