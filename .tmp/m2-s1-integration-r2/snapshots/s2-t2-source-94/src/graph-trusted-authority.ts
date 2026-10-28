/** Explicit offline fixture authority. No HOST/native provider or RPC exists here. */
import type { Database } from "bun:sqlite";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import { immutableCopy, integer, invariant, nonempty } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import type { BoundDocument, ByteRef } from "./graph-execution-envelope";
import { EventLog } from "./eventlog";
import { installFinalHostV1, resolveFinalAV1, activationCounterV1 } from "./graph-generation-activation";
import type { FinalHostPortV1 } from "./graph-final-inventory";
import { checkResourceSourceV1, checkResourceRefV1, closedResourceFieldsV1, resourceRefKeyV1, resourceDocumentV1, assertResourceSnapshotV1,
  type ResourceSourceV1, type ResourceAcquisitionV1, type ResourceAssignmentV1, type ResourceCurrentV1 } from "./graph-resource-ledger";
import { checkTransitionSourceV1, putTransitionDocumentV1, readTransitionDocumentV1, transitionKeyV1, initializePreparationCounterV1, auditPreparationCounterV1,
  type PreparationGrantV1, type TransitionCaseV1, type FixtureOriginHostPortV1,
  type OriginIssuerProvenanceV1, type OriginOwnershipV1, type OriginFirstIssuanceV1, type OriginHostCurrentV1 } from "./graph-generation-transition";

const originBrand = Symbol("private fixture origin grant"), transitionBrand = Symbol("private transition-A purpose T1");
export interface FixturePreparationHandleV1 { readonly [originBrand]: true }
export interface FixtureTransitionAHandleV1 { readonly [transitionBrand]: true }
const originPins = new WeakMap<object, { db: Database; ref: ByteRef }>();
const transitionPins = new WeakMap<object, { db: Database; ref: ByteRef }>();
// A connection capability cache only, NOT ownership/first-issuance evidence.
// Evidence is independently retained HOST records and their exact durable pins.
const originHosts = new WeakMap<Database, FixtureOriginHostPortV1>();
function actualFixturePath(db: Database): string {
  const rows = db.query("PRAGMA database_list").all() as { name: string; file: string }[];
  const path = rows.find(row => row.name === "main")?.file;
  invariant(path, "HOLD: owned file identity required for origin grant"); return path.replaceAll("\\", "/").toLowerCase();
}
function originHostSources(db: Database) {
  const port = originHosts.get(db);
  invariant(port && port.connection === db && port.records, "HOLD: independent origin HOST proofs/current unknown");
  assertExecutionJsonV1(port.records); const records = immutableCopy(port.records);
  closedResourceFieldsV1(records, ["issuer", "ownership", "firstIssuance", "current"]);
  function decoded<T extends { version: string }>(doc: BoundDocument<T>): T {
    const value = JSON.parse(doc.utf8) as T;
    invariant(canonical(resourceDocumentV1(value)) === canonical(doc), "HOLD: independent origin HOST document bytes/ref mismatch"); return value;
  }
  const issuer = decoded<OriginIssuerProvenanceV1>(records.issuer), ownership = decoded<OriginOwnershipV1>(records.ownership);
  const first = decoded<OriginFirstIssuanceV1>(records.firstIssuance), current = decoded<OriginHostCurrentV1>(records.current);
  closedResourceFieldsV1(issuer, ["version", "revision", "issuer", "universeId", "isolation", "completeDomains", "approvedDecision", "ceiling", "unit"]);
  closedResourceFieldsV1(ownership, ["version", "revision", "domain", "issuerProvenanceRef", "connectionScopeId", "connectionPath", "sourceMissionRef", "rootAllocationRef", "rootLimitsRef"]);
  closedResourceFieldsV1(first, ["version", "revision", "domain", "rootLineageOwnershipRef", "enumeration", "issuedGrantRefs", "committedOrigins"]);
  closedResourceFieldsV1(current, ["version", "revision", "domain", "issuerProvenanceRef", "rootLineageOwnershipRef", "firstIssuanceEmptyHistoryProofRef", "issuerRevision", "ownershipRevision", "firstIssuanceRevision", "revokedProofRefs"]);
  closedResourceFieldsV1(ownership.domain, ["universeId", "domainId", "missionId", "lineageId", "rootAccountId"]);
  Object.values(ownership.domain).forEach(nonempty); nonempty(ownership.connectionScopeId); nonempty(ownership.connectionPath);
  invariant(issuer.version === "l8-fixture-origin-host-issuer-v1" && issuer.revision === 1 && issuer.issuer === "synthetic-parent85"
    && issuer.isolation === "independent-synthetic-fixture" && issuer.universeId === ownership.domain.universeId
    && canonical(issuer.completeDomains) === canonical([ownership.domain])
    && issuer.approvedDecision === "three-durable-origins-bootstrap-included" && issuer.ceiling === 3 && issuer.unit === "durable-origin",
    "HOLD: independent origin HOST issuer/universe/policy unproven");
  invariant(ownership.version === "l8-fixture-origin-host-ownership-v1" && ownership.revision === 1
    && canonical(ownership.issuerProvenanceRef) === canonical(records.issuer.ref)
    && actualFixturePath(db) === ownership.connectionPath.replaceAll("\\", "/").toLowerCase(), "HOLD: independent origin HOST ownership/connection mismatch");
  invariant(first.version === "l8-fixture-origin-host-first-issuance-v1" && first.revision === 1
    && canonical(first.domain) === canonical(ownership.domain) && canonical(first.rootLineageOwnershipRef) === canonical(records.ownership.ref)
    && first.enumeration === "complete-before-first-issuance" && canonical(first.issuedGrantRefs) === "[]" && canonical(first.committedOrigins) === "[]",
    "HOLD: independent origin HOST complete first-issuance history unproven");
  invariant(current.version === "l8-fixture-origin-host-current-v1" && current.revision === 1 && canonical(current.domain) === canonical(ownership.domain)
    && canonical(current.issuerProvenanceRef) === canonical(records.issuer.ref) && current.issuerRevision === issuer.revision
    && canonical(current.rootLineageOwnershipRef) === canonical(records.ownership.ref) && current.ownershipRevision === ownership.revision
    && canonical(current.firstIssuanceEmptyHistoryProofRef) === canonical(records.firstIssuance.ref) && current.firstIssuanceRevision === first.revision
    && canonical(current.revokedProofRefs) === "[]", "HOLD: independent origin HOST current stale/revoked");
  return { records, issuer, ownership, first, current, domainKey: `origin-domain:${canonical(ownership.domain)}` };
}
function assertOriginHostGrant(db: Database, grant: PreparationGrantV1, retain: boolean) {
  const host = originHostSources(db), { records, issuer, ownership } = host;
  invariant(grant.scope.fixtureId === ownership.domain.universeId && grant.scope.missionId === ownership.domain.missionId
    && grant.scope.lineageId === ownership.domain.lineageId && grant.scope.rootAccountId === ownership.domain.rootAccountId
    && grant.connectionPath === ownership.connectionPath && grant.ceiling === issuer.ceiling && grant.unit === issuer.unit && grant.issuer === issuer.issuer
    && canonical(grant.sourceMissionRef) === canonical(ownership.sourceMissionRef) && canonical(grant.rootAllocationRef) === canonical(ownership.rootAllocationRef)
    && canonical(grant.rootLimitsRef) === canonical(ownership.rootLimitsRef)
    && canonical(grant.issuerProvenanceRef) === canonical(records.issuer.ref) && canonical(grant.rootLineageOwnershipRef) === canonical(records.ownership.ref)
    && canonical(grant.firstIssuanceEmptyHistoryProofRef) === canonical(records.firstIssuance.ref) && canonical(grant.hostCurrentRef) === canonical(records.current.ref),
    "HOLD: grant differs from independent HOST allocation/proofs/current");
  // Generic transition registration cannot mint these kinds. Reads always compare
  // retained bytes with the LIVE privileged provider, not grant self-hashes.
  for (const doc of Object.values(records)) {
    const value = JSON.parse(doc.utf8) as { version: string };
    if (retain) invariant(canonical(putTransitionDocumentV1(db, value, "origin-host-source")) === canonical(doc), "HOLD: HOST source retention mismatch");
    const retained = readTransitionDocumentV1<{ version: string }>(db, doc.ref);
    invariant(canonical(retained) === canonical(value), "HOLD: HOST retained/live source mismatch");
  }
  return host;
}
export function resolveFixturePreparationV1(db: Database, handle: FixturePreparationHandleV1 | undefined) {
  const pin = handle && typeof handle === "object" ? originPins.get(handle) : undefined;
  invariant(pin && pin.db === db, "HOLD: private origin grant handle missing/wrong DB");
  const value = readTransitionDocumentV1<PreparationGrantV1>(db, pin.ref); checkTransitionSourceV1(value);
  invariant(value.version === "l8-fixture-origin-grant-v1" && value.ceiling === 3 && value.unit === "durable-origin" && value.issuer === "synthetic-parent85"
    && actualFixturePath(db) === value.connectionPath.replaceAll("\\", "/").toLowerCase(), "HOLD: owned origin grant unavailable");
  const approval = readTransitionDocumentV1<{ version: string; issuer: string; caseId: string; decision: string; missionId: string; lineageId: string; rootAccountId: string; connectionPath: string }>(db, value.approvalRef);
  invariant(approval.version === "l8-fixture-origin-approval-v1" && approval.issuer === value.issuer && approval.decision === "three-durable-origins-bootstrap-included"
    && approval.caseId === value.scope.fixtureId && approval.missionId === value.scope.missionId && approval.lineageId === value.scope.lineageId
    && approval.rootAccountId === value.scope.rootAccountId && approval.connectionPath === value.connectionPath, "HOLD: independent origin grant provenance mismatch");
  const host = assertOriginHostGrant(db, value, false);
  const registration = db.query("SELECT revision,document,digest,revoked FROM g3_authority WHERE record_ref=? AND kind='origin-grant-domain'").get(host.domainKey) as { revision: number; document: string; digest: string; revoked: number } | null;
  invariant(registration && registration.revision === 1 && !registration.revoked && registration.document === canonical(pin.ref) && registration.digest === fingerprint(pin.ref), "HOLD: independent domain grant identity changed/unknown");
  return { value, ref: immutableCopy(pin.ref) };
}
/** Consumer-only reference came from the audited OWN counter, not request JSON. */
export function assertFixturePreparationRefV1(db: Database, ref: ByteRef) {
  const handle: FixturePreparationHandleV1 = Object.freeze({ [originBrand]: true as const });
  originPins.set(handle, { db, ref: immutableCopy(ref) }); return resolveFixturePreparationV1(db, handle);
}
export function resolveFixtureTransitionAV1(db: Database, handle: FixtureTransitionAHandleV1 | undefined) {
  const pin = handle && typeof handle === "object" ? transitionPins.get(handle) : undefined;
  invariant(pin && pin.db === db, "HOLD: distinct transitionA/request-drain handle required");
  const value = readTransitionDocumentV1<TransitionCaseV1>(db, pin.ref); checkTransitionSourceV1(value);
  invariant(value.version === "l8-fixture-transition-a-case-v1" && value.purpose === "request-drain" && value.issuer === "synthetic-parent85", "HOLD: transitionA purpose/native/B mismatch");
  const current = db.query("SELECT revision,document,digest,revoked FROM g3_authority WHERE record_ref=? AND kind='transition-case-current'").get(`transition-case:${value.caseId}`) as { revision: number; document: string; digest: string; revoked: number } | null;
  invariant(current && !current.revoked && current.revision === value.revision && current.document === canonical(pin.ref) && current.digest === fingerprint(pin.ref), "HOLD: transitionA case stale/revoked");
  return { value, ref: immutableCopy(pin.ref) };
}

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
  constructor(private readonly db: Database, originHost?: FixtureOriginHostPortV1) {
    if (originHost) {
      invariant(originHost.connection === db, "HOLD: independent origin HOST wrong connection");
      const old = originHosts.get(db);
      invariant(!old || old === originHost, "HOLD: independent origin HOST cannot be replaced on an owned connection");
      originHosts.set(db, originHost);
    }
  }
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
  registerTransitionDocument<T extends { version: string }>(input: BoundDocument<T>): ByteRef {
    const value = JSON.parse(input.utf8) as T; checkTransitionSourceV1(value);
    invariant(value.version !== "l8-fixture-origin-grant-v1", "HOLD: origin grant requires pre-bootstrap issuer port");
    return this.db.transaction(() => {
      const doc = putTransitionDocumentV1(this.db, value); invariant(canonical(doc) === canonical(input), "HOLD: source document bytes mismatch");
      if (value.version === "l8-fixture-transition-a-case-v1") {
        const c = value as unknown as TransitionCaseV1, key = `transition-case:${c.caseId}`;
        const old = this.db.query("SELECT revision,document FROM g3_authority WHERE record_ref=?").get(key) as { revision: number; document: string } | null;
        invariant(!old || old.document === canonical(doc.ref) || c.revision === old.revision + 1, "HOLD: independent case revision required");
        if (!old) this.db.query("INSERT INTO g3_authority VALUES(?,'transition-case-current',?,?,?,0)").run(key, c.revision, canonical(doc.ref), fingerprint(doc.ref));
        else if (old.document !== canonical(doc.ref)) this.db.query("UPDATE g3_authority SET revision=?,document=?,digest=? WHERE record_ref=? AND revision=?").run(c.revision, canonical(doc.ref), fingerprint(doc.ref), key, old.revision);
      }
      return doc.ref;
    }).immediate();
  }
  registerPreparationGrant(input: BoundDocument<PreparationGrantV1>): ByteRef {
    const grant = immutableCopy(JSON.parse(input.utf8) as PreparationGrantV1); checkTransitionSourceV1(grant);
    return this.db.transaction(() => {
      invariant(grant.ceiling === 3 && grant.unit === "durable-origin" && grant.revision === 1, "HOLD: approved origin grant85 required");
      const host = assertOriginHostGrant(this.db, grant, true);
      const owner = this.db.query("SELECT revision,document,digest,revoked FROM g3_authority WHERE record_ref=? AND kind='origin-grant-domain'").get(host.domainKey) as { revision: number; document: string; digest: string; revoked: number } | null;
      invariant(!owner || owner.revision === 1 && !owner.revoked && owner.document === canonical(input.ref) && owner.digest === fingerprint(input.ref), "HOLD: root/lineage domain already has another grant");
      const existing = this.db.query("SELECT 1 FROM g3_authority WHERE record_ref=?").get(transitionKeyV1(input.ref));
      invariant(Boolean(existing) === Boolean(owner), "HOLD: independent domain grant history incomplete; no reset");
      if (!existing) invariant(!this.db.query("SELECT 1 FROM g3_origins UNION ALL SELECT 1 FROM g3_head").get(), "HOLD: no grant retrofit to populated OWN");
      const doc = putTransitionDocumentV1(this.db, grant, "origin-grant"); invariant(canonical(doc) === canonical(input), "HOLD: origin grant bytes mismatch");
      if (!owner) this.db.query("INSERT INTO g3_authority VALUES(?,'origin-grant-domain',1,?,?,0)").run(host.domainKey, canonical(doc.ref), fingerprint(doc.ref));
      const handle: FixturePreparationHandleV1 = Object.freeze({ [originBrand]: true as const }); originPins.set(handle, { db: this.db, ref: doc.ref });
      resolveFixturePreparationV1(this.db, handle);
      if (!existing) initializePreparationCounterV1(this.db, grant.scope.rootAccountId, doc.ref);
      // An exact registration retry is not a zero-history reset.
      auditPreparationCounterV1(this.db, Object.assign(Object.create(EventLog.prototype) as EventLog, { db: this.db }), grant.scope.rootAccountId);
      return doc.ref;
    }).immediate();
  }
  resolvePreparationGrant(ref: ByteRef): FixturePreparationHandleV1 {
    const handle: FixturePreparationHandleV1 = Object.freeze({ [originBrand]: true as const }); originPins.set(handle, { db: this.db, ref: immutableCopy(ref) });
    resolveFixturePreparationV1(this.db, handle); return handle;
  }
  preparationCounter(root: string) {
    const log = Object.assign(Object.create(EventLog.prototype) as EventLog, { db: this.db }); return auditPreparationCounterV1(this.db, log, root);
  }
  registerFinalHost(provider: FinalHostPortV1): void { installFinalHostV1(this.db, provider); }
  resolveFinalA(ref: ByteRef) { return resolveFinalAV1(this.db, ref); }
  activationCounter(root: string) { return activationCounterV1(this.db, root); }
  resolveTransitionA(ref: ByteRef): FixtureTransitionAHandleV1 {
    const handle: FixtureTransitionAHandleV1 = Object.freeze({ [transitionBrand]: true as const }); transitionPins.set(handle, { db: this.db, ref: immutableCopy(ref) });
    resolveFixtureTransitionAV1(this.db, handle); return handle;
  }
  revokeTransitionDocument(ref: ByteRef): void {
    invariant(this.db.query("UPDATE g3_authority SET revoked=1,revision=revision+1 WHERE record_ref=? AND revoked=0").run(transitionKeyV1(ref)).changes === 1, "HOLD: transition source unavailable/already revoked");
  }
}
