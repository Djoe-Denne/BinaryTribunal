import type { Database } from "bun:sqlite";
import type { ControllerLease } from "./domain";
import { canonical, fingerprint } from "./validation";
import { EventLog, integer, invariant, nonempty } from "./eventlog";
import type { ReservationExpectation } from "./graph-store";

export interface ControllerAuthority { lease: ControllerLease; now: number }
/** v1 frozen contract: EVERY sibling/administrative journal event consumes TTL.
 * L8 must budget/renew against mission traffic, not elapsed milliseconds. No
 * clock reinterpretation is permitted without a new version and approved ADR.
 */
export const UNIT_LEASE_CLOCK_CONTRACT = Object.freeze({ version: 1, clock: "mission-event-sequence", minimumTtlEvents: 2, maximumTtlEvents: 10000, defaultTtlEvents: 100, siblingEventsAdvanceClock: true, expirationProvesWorkerStopped: false });
export interface UnitLease {
  missionId: string; unitId: string; owner: string; token: number; expiresAtEvent: number;
  state: "active" | "quarantined" | "released"; resourceKeys: string[];
}
interface LeaseRow { mission: string; unit_id: string; owner: string; token: number; expires_event: number; state: UnitLease["state"]; resources: string }
export function assertController(db: Database, authority: ControllerAuthority, missionId: string): void {
  integer(authority.now); invariant(authority.lease.missionId === missionId, "controller mission mismatch", "auth");
  const row = db.query("SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(missionId) as { lease_owner: string | null; lease_token: number; lease_until: number } | null;
  invariant(row && row.lease_owner === authority.lease.owner && row.lease_token === authority.lease.token && row.lease_until > authority.now, "stale or expired controller lease", "auth");
}
/** A byte-identical receipt for the already acknowledged SAME generation is
 * corroboration, not a contradictory late acceptance after absence/rejection. */
export function contradictoryAcceptedObservation(row: { execution_id: string; token: number; attempts: number; digest: string; receipt: string | null }, payload: unknown): boolean {
  const observation = payload as Record<string, any> | null;
  if (observation?.executionId !== row.execution_id || observation.receipt?.state !== "accepted") return false;
  const generation = observation.originalGeneration, receipt = observation.receipt;
  return !row.receipt || generation?.attempt !== row.attempts || generation?.token !== row.token || generation?.digest !== row.digest
    || receipt.executionId !== row.execution_id || (receipt.requestDigest !== undefined && receipt.requestDigest !== row.digest)
    || canonical({ ...receipt, requestDigest: row.digest }) !== row.receipt;
}

/** Release safety is checked here as well as at GraphStore's boundary. Legacy
 * v4 TERMINAL/absent rows are evidence, not an irreversible admission fence.
 * A source string or a caller's quiescent boolean cannot release sent work.
 */
export function assertExecutionQuiescence(db: Database, events: EventLog, missionId: string, unitId: string): void {
  const journal = events.read(missionId);
  const verifiedEvent = (key: string, kind: string, payload: unknown) => {
    const event = journal.find(e => e.key === key);
    return !!event && event.kind === kind && event.unitId === unitId && canonical(event.payload) === canonical(payload)
      && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId });
  };
  const rows = db.query("SELECT execution_id,token,attempts,state,body,digest,receipt,terminal_proof FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").all(missionId, unitId) as Array<{ execution_id: string; token: number; attempts: number; state: string; body: string; digest: string; receipt: string | null; terminal_proof: string | null }>;
  for (const row of rows) {
    invariant(["TERMINAL", "REJECTED"].includes(row.state) && row.terminal_proof, "quiescence not proven for every family execution");
    const proof = JSON.parse(row.terminal_proof) as Record<string, any>;
    invariant(proof.executionId === row.execution_id && proof.requestDigest === row.digest && proof.generation?.attempt === row.attempts && proof.generation?.token === row.token && fingerprint(JSON.parse(row.body)) === row.digest, "quiescence proof lacks exact admission generation binding");
    const contradictory = journal.some(event => event.kind === "admission_late_observation" && (event.payload as any)?.executionId === row.execution_id
      && (contradictoryAcceptedObservation(row, event.payload) || event.digest !== fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId })));
    invariant(!contradictory, "quiescence contradicted by late accepted admission; claims retained");
    if (proof.proofKind === "never_sent") {
      invariant(row.state === "TERMINAL" && row.attempts === 0 && !row.receipt && proof.state === "absent" && !journal.some(event => ["admission_sending", "admission_accepted"].includes(event.kind) && (event.payload as any)?.executionId === row.execution_id), "absence after I/O cannot prove quiescence");
      invariant(verifiedEvent(`terminal:${row.execution_id}`, "execution_terminal", { executionId: row.execution_id, status: "absent", proof }), "quiescence missing durable unsent proof");
    } else if (proof.proofKind === "definitive_protocol_rejection") {
      invariant(row.state === "REJECTED" && row.attempts > 0 && !row.receipt && proof.type === "execution_rejected" && proof.state === "rejected"
        && verifiedEvent(`rejection:${row.execution_id}:${row.attempts}`, "admission_rejected", proof), "quiescence missing definitive protocol rejection");
    } else {
      invariant(row.state === "TERMINAL" && row.attempts > 0 && row.receipt && ["completed", "stopped", "failed"].includes(proof.state) && proof.quiescent === true, "absence/unknown proof cannot release sent work");
      const receipt = JSON.parse(row.receipt) as Record<string, unknown>, event = journal.find(e => e.key === `receipt:${row.execution_id}`), accepted = event?.payload as Record<string, any> | undefined;
      invariant(receipt.executionId === row.execution_id && receipt.state === "accepted" && receipt.requestDigest === row.digest && accepted?.requestDigest === row.digest && accepted?.token === row.token && accepted?.attempt === row.attempts
        && ["dispatch", "positive_readback"].includes(accepted?.source) && verifiedEvent(`receipt:${row.execution_id}`, "admission_accepted", accepted) && canonical(accepted?.receipt) === row.receipt, "quiescence terminal requires a bound accepted receipt");
      invariant(verifiedEvent(`terminal:${row.execution_id}`, "execution_terminal", { executionId: row.execution_id, status: proof.state, proof }), "quiescence missing durable terminal proof");
    }
  }
}

/** A/B/R share one family; expiry fences writes but retains every resource claim. */
export class UnitLeaseStore {
  constructor(readonly db: Database, readonly events: EventLog) {
    db.exec(`CREATE TABLE IF NOT EXISTS ff8_graph_fence(id INTEGER PRIMARY KEY CHECK(id=1), token INTEGER NOT NULL);
      INSERT OR IGNORE INTO ff8_graph_fence VALUES(1,0);
      CREATE TABLE IF NOT EXISTS ff8_unit_leases(mission TEXT NOT NULL, unit_id TEXT NOT NULL, owner TEXT NOT NULL,
        token INTEGER NOT NULL, expires_event INTEGER NOT NULL, state TEXT NOT NULL, resources TEXT NOT NULL, PRIMARY KEY(mission,unit_id));
      CREATE TABLE IF NOT EXISTS ff8_unit_claims(resource_key TEXT PRIMARY KEY, mission TEXT NOT NULL, unit_id TEXT NOT NULL, token INTEGER NOT NULL);`);
  }
  private nextFence(): number {
    const row = this.db.query("UPDATE ff8_graph_fence SET token=token+1 WHERE id=1 RETURNING token").get() as { token: number };
    integer(row.token, 1); return row.token;
  }
  get(missionId: string, unitId: string): UnitLease | null {
    const r = this.db.query("SELECT * FROM ff8_unit_leases WHERE mission=? AND unit_id=?").get(missionId, unitId) as LeaseRow | null;
    return r ? { missionId, unitId, owner: r.owner, token: r.token, expiresAtEvent: r.expires_event, state: r.state, resourceKeys: JSON.parse(r.resources) } : null;
  }
  reserve(authority: ControllerAuthority, unitId: string, resourceKeys: string[], ttlEvents: number, expected: ReservationExpectation): UnitLease {
    nonempty(unitId); integer(ttlEvents, 2); invariant(ttlEvents <= 10000, "heartbeat event horizon exceeds bound");
    invariant(resourceKeys.length > 0, "reservation needs canonical resources"); resourceKeys.forEach(nonempty);
    const missionId = authority.lease.missionId, resources = [...new Set(resourceKeys)].sort();
    return this.db.transaction(() => {
      assertController(this.db, authority, missionId);
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_publications p LEFT JOIN ff8_graph_commits c ON c.mission=p.mission AND c.unit_id=p.unit_id WHERE p.mission=? AND p.unit_id=? AND c.unit_id IS NULL").get(missionId, unitId), "fenced/retained publication requires recovery under a new unit/revision; family redispatch forbidden");
      invariant(expected, "family reservation requires durable plan binding");
      const bindingRow = this.db.query("SELECT a.revision,p.binding_hash,p.plan,p.sidecar,p.binding,m.revision AS mission_revision FROM ff8_graph_active_plan a JOIN ff8_graph_plans p ON p.mission=a.mission AND p.plan_id=a.plan_id JOIN ff8_missions m ON m.id=a.mission WHERE a.mission=?").get(missionId) as { revision: number; mission_revision: number; binding_hash: string; plan: string; sidecar: string; binding: string } | null;
      invariant(bindingRow && bindingRow.revision === expected.activePlanRevision && bindingRow.mission_revision === expected.missionRevision && bindingRow.binding_hash === expected.bindingFingerprint, "stale family plan/mission binding");
      const plan = JSON.parse(bindingRow.plan), sidecar = JSON.parse(bindingRow.sidecar), binding = JSON.parse(bindingRow.binding);
      const digest = (value: Record<string, unknown>) => { const { fingerprint: _ignored, ...content } = value; return fingerprint(content); };
      invariant(digest(plan) === expected.planFingerprint && digest(sidecar) === expected.sidecarFingerprint && digest(binding) === expected.bindingFingerprint && plan.knowledgeRevision === expected.knowledgeRevision && plan.selectedUnitIds.includes(unitId), "unbound/stale family plan selection");
      const unit = this.db.query("SELECT state,document FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(missionId, unitId) as { state: string; document: string } | null;
      invariant(unit && unit.state === "READY", "only READY units can own a family");
      const document = JSON.parse(unit.document) as { ownedFunctionIds: string[]; conflicts: Array<{ resourceKey: string }> };
      const { state: _state, ...content } = JSON.parse(unit.document);
      invariant(fingerprint(content) === sidecar.unitFingerprints[unitId], "stale family unit binding");
      const required = [...new Set([...document.ownedFunctionIds.map(id => `fn:${id}`), ...document.conflicts.map(c => c.resourceKey)])].sort();
      invariant(canonical(resources) === canonical(required), "family claim must include all canonical unit resources");
      const old = this.get(missionId, unitId);
      invariant(!old || old.state === "released", "family lease still owned (including quarantined execution)");
      for (const key of resources) invariant(!this.db.query("SELECT 1 FROM ff8_unit_claims WHERE resource_key=?").get(key), `canonical resource already owned: ${key}`);
      const token = this.nextFence(), expiresAtEvent = this.events.cursor(missionId).sequence + 1 + ttlEvents;
      this.db.query("INSERT INTO ff8_unit_leases VALUES(?,?,?,?,?,?,?) ON CONFLICT(mission,unit_id) DO UPDATE SET owner=excluded.owner,token=excluded.token,expires_event=excluded.expires_event,state=excluded.state,resources=excluded.resources").run(missionId, unitId, authority.lease.owner, token, expiresAtEvent, "active", canonical(resources));
      for (const key of resources) this.db.query("INSERT INTO ff8_unit_claims VALUES(?,?,?,?)").run(key, missionId, unitId, token);
      const lease = this.get(missionId, unitId)!;
      this.events.append(missionId, `reserve:${unitId}:${token}`, "unit_reserved", authority.now, { lease, controllerToken: authority.lease.token, bindingFingerprint: expected.bindingFingerprint }, unitId);
      return lease;
    }).immediate();
  }
  assert(lease: UnitLease, authority?: ControllerAuthority): void {
    const r = this.get(lease.missionId, lease.unitId);
    invariant(r && r.state === "active" && r.token === lease.token && r.owner === lease.owner && r.expiresAtEvent > this.events.cursor(lease.missionId).sequence, "stale or expired family fence");
    if (authority) {
      assertController(this.db, authority, lease.missionId);
      const admission = this.events.read(lease.missionId).find(e => e.key === `reserve:${lease.unitId}:${lease.token}`);
      invariant(lease.owner === authority.lease.owner && (admission?.payload as { controllerToken: number } | undefined)?.controllerToken === authority.lease.token, "controller fence changed; active family requires quarantine/readback", "auth");
    }
  }
  heartbeat(authority: ControllerAuthority, lease: UnitLease, ttlEvents: number): UnitLease {
    integer(ttlEvents, 2); invariant(ttlEvents <= 10000, "heartbeat bound exceeded");
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.assert(lease, authority);
      const expires = this.events.cursor(lease.missionId).sequence + 1 + ttlEvents;
      this.db.query("UPDATE ff8_unit_leases SET expires_event=? WHERE mission=? AND unit_id=? AND token=?").run(expires, lease.missionId, lease.unitId, lease.token);
      const renewed = this.get(lease.missionId, lease.unitId)!;
      this.events.append(lease.missionId, `heartbeat:${lease.unitId}:${lease.token}:${this.events.cursor(lease.missionId).sequence + 1}`, "heartbeat", authority.now, { lease: renewed }, lease.unitId); return renewed;
    }).immediate();
  }
  quarantine(authority: ControllerAuthority, lease: UnitLease, reason: string): UnitLease {
    nonempty(reason);
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId);
      const r = this.get(lease.missionId, lease.unitId);
      invariant(r && r.state !== "released", "family not owned");
      if (r.state === "quarantined") return r;
      invariant(r.token === lease.token, "stale quarantine request");
      const token = this.nextFence();
      this.db.query("UPDATE ff8_unit_leases SET state='quarantined',token=? WHERE mission=? AND unit_id=?").run(token, lease.missionId, lease.unitId);
      this.db.query("UPDATE ff8_unit_claims SET token=? WHERE mission=? AND unit_id=?").run(token, lease.missionId, lease.unitId);
      const next = this.get(lease.missionId, lease.unitId)!;
      this.events.append(lease.missionId, `quarantine:${lease.unitId}:${token}`, "unit_quarantined", authority.now, { lease: next, reason }, lease.unitId); return next;
    }).immediate();
  }
  /** GraphStore proves quiescence for every durable outbox before invoking this primitive. */
  releaseProven(authority: ControllerAuthority, lease: UnitLease): void {
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId);
      const r = this.get(lease.missionId, lease.unitId);
      invariant(r && r.token === lease.token && r.state !== "released", "stale release fence");
      assertExecutionQuiescence(this.db, this.events, lease.missionId, lease.unitId);
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_publications WHERE mission=? AND unit_id=? AND readback IS NULL").get(lease.missionId, lease.unitId), "publication still ambiguous");
      this.db.query("DELETE FROM ff8_unit_claims WHERE mission=? AND unit_id=? AND token=?").run(lease.missionId, lease.unitId, lease.token);
      this.db.query("UPDATE ff8_unit_leases SET state='released' WHERE mission=? AND unit_id=?").run(lease.missionId, lease.unitId);
      this.events.append(lease.missionId, `release:${lease.unitId}:${lease.token}`, "unit_released", authority.now, { token: lease.token }, lease.unitId);
    }).immediate();
  }
}
