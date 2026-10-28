/**110 Low-level fixture record readers. No ports, handles or high-level VALUE imports. */
import type { Database } from "bun:sqlite";
import type { FixtureAuthorityRecordV1 } from "./graph-trusted-authority";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import { immutableCopy, integer, invariant, nonempty } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import { checkResourceRefV1, closedResourceFieldsV1, type ResourceCurrentV1 } from "./graph-resource-ledger";

export interface ResourceRow { kind: string; revision: number; document: string; digest: string; revoked: number }

export function checked(value: FixtureAuthorityRecordV1): FixtureAuthorityRecordV1 {
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

/** Retained evidence must still resolve to its independently registered fixture
 * source; a persisted proof JSON alone is not a durable authority substitute. */
export function assertFixtureRecordCurrentV1(db: Database, value: FixtureAuthorityRecordV1): void {
  const record = checked(value), digest = fingerprint(record);
  const row = db.query("SELECT document,digest,revoked FROM g3_authority WHERE record_ref=?").get(`fixture:${digest}`) as
    { document: string; digest: string; revoked: number } | null;
  invariant(row && !row.revoked && row.digest === digest && row.document === canonical(record), "HOLD: retained fixture source unavailable/revoked", "auth");
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
