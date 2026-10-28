/** Explicit offline fixture authority. No HOST/native provider or RPC exists here. */
import type { Database } from "bun:sqlite";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import { immutableCopy, integer, invariant, nonempty } from "./eventlog";
import { canonical, fingerprint } from "./validation";

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
}
