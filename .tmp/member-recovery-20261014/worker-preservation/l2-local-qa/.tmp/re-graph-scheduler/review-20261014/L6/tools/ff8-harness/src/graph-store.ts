import type { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { openOwnDatabase } from "./store";
import { canonical, fingerprint, failureCause, bridgeFailureCategory } from "./validation";
import type { ExecutionClient } from "./client";
import { EventLog, GraphPersistenceError, integer, invariant, nonempty, type ErrorClass, type GraphEvent } from "./eventlog";
import { UnitLeaseStore, assertController, type ControllerAuthority, type UnitLease } from "./unit-lease";

export const GRAPH_SCHEMA_VERSION = 4;
function contentDigest(value: object): string { const { fingerprint: _ignored, ...content } = value as Record<string, unknown>; return fingerprint(content); }

export type WorkUnitState = "PENDING" | "BLOCKED" | "READY" | "RESERVED" | "RUNNING" | "VALIDATING" | "COMMITTED" | "RETRYABLE" | "FAILED" | "STALE" | "CANCELLED" | "STOP_PENDING" | "QUARANTINED";
export interface WorkUnit {
  schemaVersion: 1; unitId: string; snapshotId: string; partitionId: string; knowledgeRevision: number;
  ownedFunctionIds: string[]; contextFunctionIds: string[]; requiredPublicationLevel: number; state: WorkUnitState;
  investigationKind: "structural" | "decompilation" | "semantification"; pipeline: "2+1";
  estimatedCost: { known: boolean; value: number | null };
  subIntents: Array<{ subIntentId: string; functionId: string; role: "explore" | "evaluate" | "A" | "B" | "R"; waitsForSubIntentIds: string[]; harnessIdentity: { sha256: string; version: string; ea: string }; sharesFamilyLease: true; outputDisjoint: true }>;
  prerequisites: Array<{ id: string; kind: string; producerUnitId: string | null; requiredPublicationLevel: number; artifactKind: string; dispensed: boolean; dispensationReason: string | null }>;
  conflicts: Array<{ id: string; kind: string; resourceKey: string; withUnitId: string | null }>;
}
export interface ArtifactRequirement {
  artifactId: string; artifactSha256: string; functionId: string; moduleSha256: string; artifactKind: string;
  minimumRevision: number; maximumRevision: number; publicationLevel: number; validation: "fixture-only" | "parent-validated";
}
export interface ArtifactReceipt extends Omit<ArtifactRequirement, "minimumRevision" | "maximumRevision"> {
  knowledgeRevision: number; producerUnitId: string | null; commitId: string; readbackStatus: "verified" | "pending" | "mismatch";
  futurePrerequisiteEffect: "satisfies" | "does_not_satisfy" | "invalidates_future";
}
export interface PlanBinding { schemaVersion: 1; planFingerprint: string; sidecarFingerprint: string; fingerprint: string }
export interface PersistencePlan {
  schemaVersion: 1; missionId: string; planId: string; snapshotId: string; partitionId: string; knowledgeRevision: number;
  fingerprint: string; policyVersion: string; estimationVersion: string; selectedUnitIds: string[];
  budgets: { contextEnvelopeMaxUtf8Bytes: number };
}
export interface PersistenceSidecar {
  schemaVersion: 1; planId: string; planFingerprint: string; snapshotFingerprint: string; knowledgeRevision: number;
  fingerprint: string; policyVersion: string; estimationVersion: string; policy: { version: string };
  unitFingerprints: Record<string, string>; envelopeBytesByUnit: Record<string, number>;
  requirementById: Record<string, ArtifactRequirement>;
  dispensationById: Record<string, { reason: string; policyVersion: string; source: string; sourceHash: string; validation: string; knowledgeRevision: number }>;
  externalReceiptById: Record<string, ArtifactReceipt>;
  diagnostics: Array<{ unitId: string | null }>;
}
export interface ReservationExpectation {
  bindingFingerprint: string; planFingerprint: string; sidecarFingerprint: string;
  knowledgeRevision: number; activePlanRevision: number; missionRevision: number;
}
/** Privileged HOST capability, never populated from worker/output payloads.
 * Implementations must verify authenticated parent/native identities from the
 * public adapter's cached readbacks. These synchronous hooks perform no RPC in
 * the SQLite transaction and are not scientific truth/signature substitutes.
 */
export interface ParentAuthorityProvider {
  verifyParent(authority: ControllerAuthority): ParentAuthorityIdentity | undefined;
  verifyNativeAuthor(authority: ControllerAuthority, expected: { missionId: string; unitId: string; executionId: string; requestDigest: string }): NativeAuthorIdentity | undefined;
}
export interface ParentAuthorityIdentity {
  version: 1; role: "parent"; missionId: string; controllerOwner: string;
  principalId: string; actorId: string; source: string; sourceHash: string;
}
export interface NativeAuthorIdentity {
  version: 1; missionId: string; executionId: string; requestDigest: string;
  authorId: string; sessionId: string; profile: string;
  model: { providerID: string; id: string; variant: string };
  fresh: true; parentSessionId: null; source: string; sourceHash: string;
}
export interface ParentScientificCheck { id: string; kind: string; outcome: "pass"; evidenceDigest: string; detail: string }
export interface ParentAttestationRequest {
  bindingFingerprint: string; planFingerprint: string; snapshotId: string; knowledgeRevision: number;
  resultIds: string[]; resultDigests: Record<string, string>; evidence: unknown[]; validatedFactIds: string[];
  checks: ParentScientificCheck[];
}
export interface ParentAttestation {
  version: 1; attestationId: string; missionId: string; unitId: string; familyToken: number; controllerToken: number;
  parentActorId: string; parentAuthorityDigest: string;
  bindingFingerprint: string; planFingerprint: string; snapshotId: string; snapshotFingerprint: string; partitionId: string; knowledgeRevision: number;
  resultIds: string[]; resultDigests: Record<string, string>; authorDigests: Record<string, string>;
  evidenceDigest: string; validatedFactIds: string[]; checks: ParentScientificCheck[];
}
export interface GraphStoreOptions { parentAuthority?: ParentAuthorityProvider }
export interface UnitValidation {
  evidence: unknown[]; validatedFactIds: string[]; source: "artifact";
  /** Compatibility only. This boolean grants NO level-2 authorization. */
  parentValidated: boolean; parentAttestationId?: string;
}
export interface KnowledgeCommit {
  schemaVersion: 1; commitId: string; inputRevision: number; outputRevision: number; unitId: string;
  resultIds: string[]; validatedFactIds: string[]; evidence: unknown[]; publicationLevel: number;
  publicationTargetId: string; readbackStatus: "verified" | "pending" | "mismatch"; readbackHash: string;
  futurePrerequisiteEffect: "satisfies" | "does_not_satisfy" | "invalidates_future"; isGitCommit: false;
}
export interface Admission {
  executionId: string; subIntentId: string; attemptId: string; role: string; idempotencyKey: string;
  command: Record<string, unknown>;
  [key: string]: unknown;
}
export interface AdmissionObservation {
  executionId: string; requestDigest: string; state: "accepted" | "absent" | "unknown";
  receipt: Record<string, unknown> | null; proof: string;
}
interface UnitRow { document: string; state: WorkUnitState; revision: number }
interface OutboxRow { mission: string; unit_id: string; execution_id: string; sub_intent: string; token: number; body: string; digest: string; state: string; attempts: number; max_attempts: number; retry_delay: number; next_time: number; receipt: string | null; terminal_proof: string | null }
interface DispatchGeneration { attempt: number; token: number; digest: string }
const transitions: Record<WorkUnitState, WorkUnitState[]> = {
  PENDING: ["BLOCKED", "READY", "CANCELLED", "STALE"], BLOCKED: ["READY", "CANCELLED", "STALE", "FAILED"],
  READY: ["RESERVED", "BLOCKED", "STALE", "CANCELLED"], RESERVED: ["RUNNING", "READY", "STOP_PENDING", "QUARANTINED", "CANCELLED"],
  RUNNING: ["VALIDATING", "RETRYABLE", "FAILED", "STOP_PENDING", "QUARANTINED"], VALIDATING: ["COMMITTED", "RETRYABLE", "FAILED", "BLOCKED"],
  RETRYABLE: ["READY", "FAILED"], STOP_PENDING: ["CANCELLED", "QUARANTINED", "FAILED"], QUARANTINED: [], COMMITTED: [], FAILED: [], STALE: [], CANCELLED: [],
};

/** Strict L1 schema subset; no regex dialect or runtime schema dependency. */
function validateSchema(value: unknown, schema: Record<string, any>, path = "document"): void {
  const match = (type: string) => type === "null" ? value === null : type === "integer" ? Number.isSafeInteger(value) : type === "array" ? Array.isArray(value) : type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : typeof value === type;
  invariant((Array.isArray(schema.type) ? schema.type : [schema.type]).some(match), `${path}: schema type mismatch`, "schema");
  if (schema.enum) invariant(schema.enum.includes(value), `${path}: invalid enumeration`, "schema");
  if (typeof value === "number") invariant((schema.minimum === undefined || value >= schema.minimum) && (schema.maximum === undefined || value <= schema.maximum), `${path}: numeric bounds`, "schema");
  if (typeof value === "string") invariant((schema.minLength === undefined || value.length >= schema.minLength) && (schema.maxLength === undefined || value.length <= schema.maxLength), `${path}: text bounds`, "schema");
  if (Array.isArray(value)) {
    invariant((schema.minItems === undefined || value.length >= schema.minItems) && (schema.maxItems === undefined || value.length <= schema.maxItems), `${path}: array bounds`, "schema");
    value.forEach((v, i) => validateSchema(v, schema.items, `${path}[${i}]`));
  } else if (value !== null && typeof value === "object") {
    const r = value as Record<string, unknown>;
    for (const key of schema.required ?? []) invariant(key in r, `${path}: missing ${key}`, "schema");
    for (const [key, v] of Object.entries(r)) {
      invariant(schema.properties?.[key], `${path}: unexpected ${key}`, "schema"); validateSchema(v, schema.properties[key], `${path}.${key}`);
    }
  }
}
export function validateGraphDocument(kind: string, value: unknown): void {
  invariant(["graph-snapshot", "cluster-partition", "work-unit", "knowledge-commit", "mission-plan"].includes(kind), "unsupported graph document", "schema");
  validateSchema(value, JSON.parse(readFileSync(join(import.meta.dir, "..", "schemas", `${kind}-v1.schema.json`), "utf8")));
}
export function graphErrorClass(error: unknown): Exclude<ErrorClass, "none"> {
  const category = bridgeFailureCategory(error)?.category;
  if (error instanceof GraphPersistenceError) return error.category;
  if (["auth", "refusal", "unauthorized", "forbidden"].includes(category ?? "")) return "auth";
  if (["input", "invalid_input"].includes(category ?? "")) return "input";
  if (["schema", "unsupported_schema"].includes(category ?? "")) return "schema";
  if (category === "quota") return "quota";
  if (category === "scientific_block") return "scientific_block";
  return "outage";
}
function openGraphDatabase(path: string): Database {
  // The legacy OWN opener writes metadata before installing busy_timeout. Only
  // typed SQLite contention is retried, never auth/schema/foreign-file failures.
  for (let attempt = 0; ; attempt++) {
    try { return openOwnDatabase(path, "engine"); }
    catch (error) {
      if ((error as { code?: string } | null)?.code !== "SQLITE_BUSY" || attempt >= 5) throw error;
      Bun.sleepSync(20 * (attempt + 1));
    }
  }
}

/** Additive extension on the existing OWN engine database, never Ensemble's DB.
 * Migrations add the known v1/v3/v4 tables; they are NOT a general column-diff or
 * repair engine for malformed/foreign historical layouts. Legacy scientific
 * records without receipt-bound provenance stay evidence, not prerequisites.
 */
export class GraphStore {
  readonly db: Database;
  readonly events: EventLog;
  readonly leases: UnitLeaseStore;
  private readonly parentAuthority?: Readonly<ParentAuthorityProvider>;
  constructor(readonly path = ":memory:", options: GraphStoreOptions = {}) {
    if (options.parentAuthority) {
      const provider = options.parentAuthority;
      this.parentAuthority = Object.freeze({ verifyParent: provider.verifyParent.bind(provider), verifyNativeAuthor: provider.verifyNativeAuthor.bind(provider) });
    }
    this.db = openGraphDatabase(path);
    try {
      const names = this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;
      const ownTables = new Set(["ff8_harness_metadata", "ff8_missions", "ff8_intents", "ff8_history", "ff8_fixture_targets", "ff8_fixture_publications",
        "ff8_bridge_missions", "ff8_bridge_requests", "ff8_bridge_command_attempts", "ff8_bridge_events", "ff8_bridge_communication_audits",
        "ff8_graph_metadata", "ff8_graph_snapshots", "ff8_graph_partitions", "ff8_graph_units", "ff8_graph_results", "ff8_graph_commits", "ff8_graph_outbox", "ff8_graph_publications", "ff8_graph_streams", "ff8_graph_fence", "ff8_graph_plans", "ff8_graph_active_plan", "ff8_graph_receipts", "ff8_graph_parent_authorities", "ff8_graph_native_authors", "ff8_graph_parent_attestations", "ff8_events", "ff8_unit_leases", "ff8_unit_claims"]);
      invariant(names.every(r => ownTables.has(r.name)), "foreign tables in OWN database", "schema");
      this.db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
      this.db.transaction(() => {
        this.db.exec("CREATE TABLE IF NOT EXISTS ff8_graph_metadata(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL); INSERT OR IGNORE INTO ff8_graph_metadata VALUES(1,0);");
        const version = (this.db.query("SELECT version FROM ff8_graph_metadata WHERE id=1").get() as { version: number }).version;
        invariant(version >= 0 && version <= GRAPH_SCHEMA_VERSION, "unsupported graph schema version", "schema");
        this.db.exec(`CREATE TABLE IF NOT EXISTS ff8_graph_snapshots(id TEXT PRIMARY KEY,digest TEXT NOT NULL,document TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS ff8_graph_partitions(id TEXT PRIMARY KEY,snapshot_id TEXT NOT NULL REFERENCES ff8_graph_snapshots(id),digest TEXT NOT NULL,document TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS ff8_graph_units(mission TEXT NOT NULL,unit_id TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(mission,unit_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_results(mission TEXT NOT NULL,unit_id TEXT NOT NULL,result_id TEXT NOT NULL,execution_id TEXT NOT NULL,token INTEGER NOT NULL,digest TEXT NOT NULL,document TEXT NOT NULL,eligible INTEGER NOT NULL,PRIMARY KEY(mission,result_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_commits(mission TEXT NOT NULL,unit_id TEXT NOT NULL,commit_id TEXT NOT NULL UNIQUE,document TEXT NOT NULL,PRIMARY KEY(mission,unit_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_outbox(mission TEXT NOT NULL,unit_id TEXT NOT NULL,execution_id TEXT PRIMARY KEY,sub_intent TEXT NOT NULL,token INTEGER NOT NULL,body TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,max_attempts INTEGER NOT NULL,retry_delay INTEGER NOT NULL,next_time INTEGER NOT NULL DEFAULT 0,receipt TEXT,terminal_proof TEXT);
          CREATE TABLE IF NOT EXISTS ff8_graph_publications(mission TEXT NOT NULL,unit_id TEXT NOT NULL,token INTEGER NOT NULL,request TEXT NOT NULL,digest TEXT NOT NULL,readback TEXT,PRIMARY KEY(mission,unit_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_plans(mission TEXT NOT NULL,plan_id TEXT NOT NULL,binding_hash TEXT NOT NULL,plan TEXT NOT NULL,sidecar TEXT NOT NULL,binding TEXT NOT NULL,PRIMARY KEY(mission,plan_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_active_plan(mission TEXT PRIMARY KEY,plan_id TEXT NOT NULL,revision INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS ff8_graph_receipts(mission TEXT NOT NULL,commit_id TEXT NOT NULL,artifact_id TEXT NOT NULL,document TEXT NOT NULL,PRIMARY KEY(mission,commit_id,artifact_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_parent_authorities(mission TEXT PRIMARY KEY,document TEXT NOT NULL,digest TEXT NOT NULL,event_key TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS ff8_graph_native_authors(mission TEXT NOT NULL,execution_id TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,PRIMARY KEY(mission,execution_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_parent_attestations(mission TEXT NOT NULL,attestation_id TEXT NOT NULL,unit_id TEXT NOT NULL,token INTEGER NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,event_key TEXT NOT NULL,revocation_event TEXT,PRIMARY KEY(mission,attestation_id));`);
        this.db.query("UPDATE ff8_graph_metadata SET version=? WHERE id=1").run(GRAPH_SCHEMA_VERSION);
      }).immediate();
      this.events = new EventLog(this.db); this.leases = new UnitLeaseStore(this.db, this.events);
    } catch (error) { this.db.close(); throw error; }
  }
  close(): void { this.db.close(); }
  private row(missionId: string, unitId: string): UnitRow {
    const r = this.db.query("SELECT document,state,revision FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(missionId, unitId) as UnitRow | null;
    invariant(r, "unknown work unit"); return r;
  }
  unit(missionId: string, unitId: string): WorkUnit { const r = this.row(missionId, unitId); return { ...JSON.parse(r.document), state: r.state }; }
  private change(authority: ControllerAuthority, unitId: string, state: WorkUnitState, reason: string): void {
    const missionId = authority.lease.missionId, r = this.row(missionId, unitId);
    invariant(transitions[r.state].includes(state), `invalid unit transition ${r.state}->${state}`);
    const updated = this.db.query("UPDATE ff8_graph_units SET state=?,revision=revision+1 WHERE mission=? AND unit_id=? AND revision=?").run(state, missionId, unitId, r.revision);
    invariant(updated.changes === 1, "stale unit revision");
    this.events.append(missionId, `state:${unitId}:${r.revision + 1}`, "unit_state", authority.now, { from: r.state, state, reason }, unitId);
  }
  putSnapshot(authority: ControllerAuthority, snapshot: Record<string, unknown>): void {
    validateGraphDocument("graph-snapshot", snapshot); const id = snapshot.snapshotId as string;
    invariant(snapshot.missionId === authority.lease.missionId, "graph snapshot mission mismatch");
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const digest = fingerprint(snapshot), old = this.db.query("SELECT digest FROM ff8_graph_snapshots WHERE id=?").get(id) as { digest: string } | null;
      invariant(!old || old.digest === digest, "immutable graph snapshot changed");
      this.db.query("INSERT OR IGNORE INTO ff8_graph_snapshots VALUES(?,?,?)").run(id, digest, canonical(snapshot));
      this.events.append(authority.lease.missionId, `snapshot:${id}`, "snapshot_stored", authority.now, snapshot);
    }).immediate();
  }
  putPartition(authority: ControllerAuthority, partition: Record<string, unknown>): void {
    validateGraphDocument("cluster-partition", partition);
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const id = partition.partitionId as string, digest = fingerprint(partition), old = this.db.query("SELECT digest FROM ff8_graph_partitions WHERE id=?").get(id) as { digest: string } | null;
      const source = this.db.query("SELECT document FROM ff8_graph_snapshots WHERE id=?").get(partition.snapshotId as string) as { document: string } | null;
      invariant(source && JSON.parse(source.document).normalizedFingerprint === partition.snapshotFingerprint, "partition snapshot fingerprint mismatch");
      invariant(!old || old.digest === digest, "immutable partition changed");
      this.db.query("INSERT OR IGNORE INTO ff8_graph_partitions VALUES(?,?,?,?)").run(id, partition.snapshotId as string, digest, canonical(partition));
      this.events.append(authority.lease.missionId, `partition:${id}`, "partition_stored", authority.now, partition);
    }).immediate();
  }
  addUnit(authority: ControllerAuthority, unit: WorkUnit): void {
    validateGraphDocument("work-unit", unit);
    invariant(["PENDING", "BLOCKED", "READY"].includes(unit.state), "new unit must be unadmitted");
    invariant(unit.ownedFunctionIds.length > 0 && new Set(unit.ownedFunctionIds).size === unit.ownedFunctionIds.length, "owned functions must be unique");
    for (const id of unit.ownedFunctionIds) invariant(/^[a-f0-9]{64}:0x(?:0|[1-9A-F][0-9A-F]*)$/.test(id), "noncanonical module-hash/RVA function identity");
    invariant(unit.contextFunctionIds.every(id => !unit.ownedFunctionIds.includes(id)), "context function cannot be owned");
    for (const id of unit.ownedFunctionIds) {
      const family = unit.subIntents.filter(s => s.functionId === id);
      invariant(family.length === 3 && ["A", "B", "R"].every(role => family.filter(s => s.role === role).length === 1), "unit needs one A/B/R per function");
      const r = family.find(s => s.role === "R")!, ab = family.filter(s => s.role === "A" || s.role === "B");
      invariant(canonical([...ab[0]!.waitsForSubIntentIds].sort()) === canonical([...ab[1]!.waitsForSubIntentIds].sort()) && canonical([...r.waitsForSubIntentIds].sort()) === canonical(ab.map(s => s.subIntentId).sort()), "invalid blind-family prerequisites");
      for (const author of ab) for (const wait of author.waitsForSubIntentIds) {
        const dependency = unit.subIntents.find(s => s.subIntentId === wait);
        invariant(dependency && dependency.role === "R" && dependency.functionId !== id && unit.ownedFunctionIds.includes(dependency.functionId), "authors may await only an owned other-function R");
      }
    }
    invariant(unit.subIntents.every(s => unit.ownedFunctionIds.includes(s.functionId)) && new Set(unit.subIntents.map(s => s.subIntentId)).size === unit.subIntents.length, "orphan or duplicate sub-intent");
    const indegrees = new Map<string, number>(), consumers = new Map<string, string[]>();
    for (const sub of unit.subIntents) {
      invariant(new Set(sub.waitsForSubIntentIds).size === sub.waitsForSubIntentIds.length, "duplicate sub-intent prerequisite");
      indegrees.set(sub.subIntentId, sub.waitsForSubIntentIds.length);
      for (const wait of sub.waitsForSubIntentIds) {
        invariant(unit.subIntents.some(s => s.subIntentId === wait), "unknown sub-intent prerequisite");
        consumers.set(wait, [...(consumers.get(wait) ?? []), sub.subIntentId]);
      }
    }
    const ready = [...indegrees].filter(([, n]) => n === 0).map(([id]) => id);
    for (let i = 0; i < ready.length; i++) for (const id of consumers.get(ready[i]!) ?? []) {
      const n = indegrees.get(id)! - 1; indegrees.set(id, n); if (n === 0) ready.push(id);
    }
    invariant(ready.length === unit.subIntents.length, "cyclic sub-intent dependency DAG");
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      invariant(this.db.query("SELECT 1 FROM ff8_graph_partitions WHERE id=? AND snapshot_id=?").get(unit.partitionId, unit.snapshotId), "unit snapshot/partition unavailable");
      const snapshot = JSON.parse((this.db.query("SELECT document FROM ff8_graph_snapshots WHERE id=?").get(unit.snapshotId) as { document: string }).document) as { missionId: string; nodes: Array<{ id: string }> };
      invariant(snapshot.missionId === authority.lease.missionId && [...unit.ownedFunctionIds, ...unit.contextFunctionIds].every(id => snapshot.nodes.some(n => n.id === id)), "unit contains fabricated/foreign snapshot functions");
      const old = this.db.query("SELECT digest FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(authority.lease.missionId, unit.unitId) as { digest: string } | null;
      invariant(!old || old.digest === fingerprint(unit), "immutable work unit changed");
      if (old) return;
      if (unit.state === "READY") this.assertPrerequisites(authority.lease.missionId, unit);
      this.db.query("INSERT INTO ff8_graph_units(mission,unit_id,document,digest,state) VALUES(?,?,?,?,?)").run(authority.lease.missionId, unit.unitId, canonical(unit), fingerprint(unit), unit.state);
      this.events.append(authority.lease.missionId, `unit:${unit.unitId}`, "unit_added", authority.now, unit, unit.unitId);
    }).immediate();
  }
  private assertPrerequisites(missionId: string, unit: WorkUnit): void {
    for (const p of unit.prerequisites.filter(p => p.kind === "obligatory" && !p.dispensed)) {
      invariant(p.producerUnitId && this.satisfies(missionId, p.producerUnitId, p.requiredPublicationLevel), `unsatisfied prerequisite: ${p.id}`);
    }
    for (const p of unit.prerequisites.filter(p => p.dispensed)) invariant(p.dispensationReason?.trim(), "dispensation needs versioned rationale");
  }
  private assertNoRetainedPublication(missionId: string, unitId: string): void {
    invariant(!this.db.query("SELECT 1 FROM ff8_graph_publications p LEFT JOIN ff8_graph_commits c ON c.mission=p.mission AND c.unit_id=p.unit_id WHERE p.mission=? AND p.unit_id=? AND c.unit_id IS NULL").get(missionId, unitId), "fenced/retained publication requires recovery under a new unit/revision; READY and redispatch forbidden");
  }
  /** Parent-authorized immutable plan/sidecar binding; no unbound production/test path. */
  freezePlan(authority: ControllerAuthority, plan: PersistencePlan, sidecar: PersistenceSidecar, binding: PlanBinding, expectedActiveRevision = 0): number {
    validateGraphDocument("mission-plan", plan);
    invariant(plan.missionId === authority.lease.missionId && plan.fingerprint === contentDigest(plan) && sidecar.fingerprint === contentDigest(sidecar) && binding.fingerprint === contentDigest(binding), "invalid frozen plan/sidecar/binding digest");
    invariant(binding.schemaVersion === 1 && sidecar.schemaVersion === 1 && binding.planFingerprint === plan.fingerprint && binding.sidecarFingerprint === sidecar.fingerprint && sidecar.planFingerprint === plan.fingerprint && sidecar.planId === plan.planId && sidecar.knowledgeRevision === plan.knowledgeRevision && sidecar.policyVersion === plan.policyVersion && sidecar.policy.version === plan.policyVersion && sidecar.estimationVersion === plan.estimationVersion, "incoherent frozen plan binding");
    return this.db.transaction(() => {
      assertController(this.db, authority, plan.missionId);
      const source = this.db.query("SELECT document FROM ff8_graph_snapshots WHERE id=?").get(plan.snapshotId) as { document: string } | null;
      invariant(source && JSON.parse(source.document).normalizedFingerprint === sidecar.snapshotFingerprint, "frozen plan snapshot mismatch");
      invariant(this.db.query("SELECT 1 FROM ff8_graph_partitions WHERE id=? AND snapshot_id=?").get(plan.partitionId, plan.snapshotId), "frozen plan partition mismatch");
      for (const id of plan.selectedUnitIds) {
        const u = this.unit(plan.missionId, id), { state: _state, ...content } = u;
        invariant(u.snapshotId === plan.snapshotId && u.partitionId === plan.partitionId && u.knowledgeRevision === plan.knowledgeRevision && sidecar.unitFingerprints[id] === fingerprint(content), "frozen unit content/revision mismatch");
      }
      const old = this.db.query("SELECT binding_hash FROM ff8_graph_plans WHERE mission=? AND plan_id=?").get(plan.missionId, plan.planId) as { binding_hash: string } | null;
      invariant(!old || old.binding_hash === binding.fingerprint, "immutable plan binding changed");
      const active = this.db.query("SELECT plan_id,revision FROM ff8_graph_active_plan WHERE mission=?").get(plan.missionId) as { plan_id: string; revision: number } | null;
      if (active?.plan_id === plan.planId) return active.revision;
      invariant((active?.revision ?? 0) === expectedActiveRevision, "stale active plan CAS revision");
      this.db.query("INSERT OR IGNORE INTO ff8_graph_plans VALUES(?,?,?,?,?,?)").run(plan.missionId, plan.planId, binding.fingerprint, canonical(plan), canonical(sidecar), canonical(binding));
      const revision = expectedActiveRevision + 1;
      this.db.query("INSERT INTO ff8_graph_active_plan VALUES(?,?,?) ON CONFLICT(mission) DO UPDATE SET plan_id=excluded.plan_id,revision=excluded.revision").run(plan.missionId, plan.planId, revision);
      this.events.append(plan.missionId, `plan:${revision}`, "plan_frozen", authority.now, { plan, sidecar, binding, activePlanRevision: revision }); return revision;
    }).immediate();
  }
  reservationExpectation(missionId: string): ReservationExpectation {
    const r = this.db.query("SELECT a.revision,p.binding,p.plan FROM ff8_graph_active_plan a JOIN ff8_graph_plans p ON p.mission=a.mission AND p.plan_id=a.plan_id WHERE a.mission=?").get(missionId) as { revision: number; binding: string; plan: string } | null;
    invariant(r, "no durable frozen plan binding"); const binding = JSON.parse(r.binding) as PlanBinding, plan = JSON.parse(r.plan) as PersistencePlan;
    const mission = this.db.query("SELECT revision FROM ff8_missions WHERE id=?").get(missionId) as { revision: number };
    return { bindingFingerprint: binding.fingerprint, planFingerprint: binding.planFingerprint, sidecarFingerprint: binding.sidecarFingerprint, knowledgeRevision: plan.knowledgeRevision, activePlanRevision: r.revision, missionRevision: mission.revision };
  }
  recordKnowledgeReceipt(authority: ControllerAuthority, receipt: ArtifactReceipt): void {
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const c = this.db.query("SELECT unit_id,document FROM ff8_graph_commits WHERE mission=? AND commit_id=?").get(authority.lease.missionId, receipt.commitId) as { unit_id: string; document: string } | null;
      invariant(c && c.unit_id === receipt.producerUnitId, "receipt must reference own scientific COMMITTED unit"); const commit = JSON.parse(c.document) as KnowledgeCommit;
      invariant(receipt.readbackStatus === "verified" && receipt.futurePrerequisiteEffect === "satisfies" && commit.futurePrerequisiteEffect === "satisfies" && receipt.knowledgeRevision === commit.outputRevision && receipt.publicationLevel === commit.publicationLevel && this.satisfies(authority.lease.missionId, c.unit_id, receipt.publicationLevel) && receipt.artifactSha256 === commit.readbackHash && (commit.validatedFactIds.includes(receipt.artifactId) || commit.resultIds.includes(receipt.artifactId)), "receipt not bound to verified publication");
      const u = this.unit(authority.lease.missionId, c.unit_id);
      invariant(u.ownedFunctionIds.includes(receipt.functionId) && receipt.moduleSha256 === receipt.functionId.split(":")[0] && (receipt.publicationLevel !== 2 || receipt.validation === "parent-validated"), "receipt function/module/validation mismatch");
      const prior = this.db.query("SELECT document FROM ff8_graph_receipts WHERE mission=? AND commit_id=? AND artifact_id=?").get(authority.lease.missionId, receipt.commitId, receipt.artifactId) as { document: string } | null;
      invariant(!prior || prior.document === canonical(receipt), "immutable artifact receipt changed"); if (prior) return;
      this.db.query("INSERT INTO ff8_graph_receipts VALUES(?,?,?,?)").run(authority.lease.missionId, receipt.commitId, receipt.artifactId, canonical(receipt));
      this.events.append(authority.lease.missionId, `artifact_receipt:${receipt.commitId}:${receipt.artifactId}`, "artifact_receipt", authority.now, receipt, c.unit_id);
    }).immediate();
  }
  private assertBinding(missionId: string, unit: WorkUnit, expected?: ReservationExpectation): void {
    invariant(expected, "reservation requires explicit durable plan binding expectation");
    invariant(canonical(expected) === canonical(this.reservationExpectation(missionId)), "stale binding/knowledge/mission/active-plan revision");
    const r = this.db.query("SELECT p.plan,p.sidecar,p.binding FROM ff8_graph_active_plan a JOIN ff8_graph_plans p ON p.mission=a.mission AND p.plan_id=a.plan_id WHERE a.mission=?").get(missionId) as { plan: string; sidecar: string; binding: string };
    const plan = JSON.parse(r.plan) as PersistencePlan, sidecar = JSON.parse(r.sidecar) as PersistenceSidecar, binding = JSON.parse(r.binding) as PlanBinding, { state: _state, ...content } = unit;
    invariant(plan.fingerprint === contentDigest(plan) && sidecar.fingerprint === contentDigest(sidecar) && binding.fingerprint === contentDigest(binding) && binding.planFingerprint === plan.fingerprint && binding.sidecarFingerprint === sidecar.fingerprint && sidecar.planFingerprint === plan.fingerprint, "corrupt immutable binding/sidecar/plan digest", "schema");
    invariant(plan.selectedUnitIds.includes(unit.unitId) && sidecar.unitFingerprints[unit.unitId] === fingerprint(content) && unit.knowledgeRevision === expected.knowledgeRevision, "unit not selected/stale frozen unit content");
    const bytes = sidecar.envelopeBytesByUnit[unit.unitId]; integer(bytes);
    invariant(bytes <= plan.budgets.contextEnvelopeMaxUtf8Bytes && !sidecar.diagnostics.some(d => d.unitId === null || d.unitId === unit.unitId), "budget/diagnostic prevents admission");
    for (const p of unit.prerequisites) {
      if (p.dispensed) {
        const d = sidecar.dispensationById[p.id];
        invariant(d && d.reason === p.dispensationReason && d.policyVersion === sidecar.policyVersion && d.knowledgeRevision === unit.knowledgeRevision && d.source.trim() && /^[a-f0-9]{64}$/.test(d.sourceHash) && ["fixture-only", "parent-validated"].includes(d.validation) && (unit.requiredPublicationLevel !== 2 || d.validation === "parent-validated"), "invalid versioned prerequisite dispensation"); continue;
      }
      if (!["obligatory", "external_satisfied"].includes(p.kind)) continue;
      const requirement = sidecar.requirementById[p.id];
      invariant(requirement && requirement.artifactKind === p.artifactKind && requirement.publicationLevel === p.requiredPublicationLevel && /^[a-f0-9]{64}$/.test(requirement.artifactSha256), "missing typed artifact requirement");
      integer(requirement.minimumRevision); integer(requirement.maximumRevision); invariant(requirement.minimumRevision <= requirement.maximumRevision && requirement.functionId.startsWith(`${requirement.moduleSha256}:0x`) && /^[a-f0-9]{64}$/.test(requirement.moduleSha256) && ["fixture-only", "parent-validated"].includes(requirement.validation), "invalid artifact identity/revision requirement");
      const receipts = p.kind === "external_satisfied" ? [sidecar.externalReceiptById[p.id]] : (this.db.query("SELECT document FROM ff8_graph_receipts WHERE mission=?").all(missionId) as Array<{ document: string }>).map(r => JSON.parse(r.document) as ArtifactReceipt);
      invariant(receipts.some(receipt => receipt && receipt.producerUnitId === p.producerUnitId && receipt.readbackStatus === "verified" && receipt.futurePrerequisiteEffect === "satisfies" && receipt.artifactId === requirement.artifactId && receipt.artifactSha256 === requirement.artifactSha256 && receipt.functionId === requirement.functionId && receipt.moduleSha256 === requirement.moduleSha256 && receipt.artifactKind === requirement.artifactKind && receipt.knowledgeRevision >= requirement.minimumRevision && receipt.knowledgeRevision <= requirement.maximumRevision && receipt.publicationLevel >= requirement.publicationLevel && [1, 2].includes(receipt.publicationLevel) && (receipt.validation === "parent-validated" || (receipt.validation === "fixture-only" && requirement.validation === "fixture-only"))), "stale/missing artifact receipt cannot satisfy prerequisite");
    }
  }
  transition(authority: ControllerAuthority, unitId: string, state: WorkUnitState, reason: string): void {
    nonempty(reason);
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      invariant(!["RESERVED", "RUNNING", "VALIDATING", "COMMITTED", "QUARANTINED"].includes(state), "use fenced reservation/result/publication operations");
      const lease = this.leases.get(authority.lease.missionId, unitId);
      invariant(!lease || lease.state === "released" || state === "STOP_PENDING", "active family cannot be released by state change");
      if (state === "READY") { this.assertNoRetainedPublication(authority.lease.missionId, unitId); this.assertPrerequisites(authority.lease.missionId, this.unit(authority.lease.missionId, unitId)); }
      this.change(authority, unitId, state, reason);
    }).immediate();
  }
  reserve(authority: ControllerAuthority, unitId: string, ttlEvents = 100, expected?: ReservationExpectation): UnitLease {
    return this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      this.assertNoRetainedPublication(authority.lease.missionId, unitId);
      const u = this.unit(authority.lease.missionId, unitId); invariant(u.state === "READY", "only READY units can be reserved"); this.assertBinding(authority.lease.missionId, u, expected); this.assertPrerequisites(authority.lease.missionId, u);
      const lease = this.leases.reserve(authority, unitId, [...u.ownedFunctionIds.map(id => `fn:${id}`), ...u.conflicts.map(c => c.resourceKey)], ttlEvents, expected!);
      this.change(authority, unitId, "RESERVED", "canonical family ownership acquired"); return lease;
    }).immediate();
  }
  tick(authority: ControllerAuthority, key: string, count = 1): void {
    integer(count, 1); invariant(count <= 10000, "tick batch bound exceeded");
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      for (let i = 0; i < count; i++) this.events.append(authority.lease.missionId, `tick:${key}:${i}`, "clock_tick", authority.now, { index: i });
    }).immediate();
  }
  expire(authority: ControllerAuthority, unitId: string): UnitLease {
    return this.db.transaction(() => {
      const lease = this.leases.get(authority.lease.missionId, unitId); invariant(lease, "no family lease");
      invariant(lease.expiresAtEvent <= this.events.cursor(lease.missionId).sequence, "family lease has not expired");
      const next = this.leases.quarantine(authority, lease, "heartbeat expired; execution may still be active");
      const state = this.unit(lease.missionId, unitId).state;
      if (state === "VALIDATING") this.change(authority, unitId, "BLOCKED", "expired validation fence; publication quarantined");
      else if (state !== "QUARANTINED" && state !== "BLOCKED") this.change(authority, unitId, "QUARANTINED", "expiry does not prove worker termination"); return next;
    }).immediate();
  }
  prepareAdmission(authority: ControllerAuthority, lease: UnitLease, body: Admission, maxAttempts = 3, retryDelayMs = 1000): string {
    integer(maxAttempts, 1); invariant(maxAttempts <= 10, "admission retry bound exceeded"); integer(retryDelayMs);
    invariant(body.idempotencyKey === body.executionId, "executionId is the admission idempotency key");
    invariant(!["token", "principalId", "controllerId", "expectedRevision", "directory", "missionId"].some(k => k in body), "outbox must not contain authority/secrets");
    const command = body.command;
    invariant(command && command.executionId === body.executionId && command.attemptId === body.attemptId && command.idempotencyKey === body.executionId, "complete bridge admission identity required");
    invariant(!["token", "principalId", "controllerId", "expectedRevision", "directory", "missionId"].some(k => k in command), "bridge command must not contain authority/secrets");
    for (const key of ["taskId", "profile", "prompt"]) invariant(typeof command[key] === "string" && (command[key] as string).trim(), `complete admission missing ${key}`);
    const model = command.model as { providerID: string; id: string; variant: string } | undefined;
    invariant(model && typeof model.providerID === "string" && model.providerID.trim() && typeof model.id === "string" && model.id.trim() && !model.id.includes("#") && typeof model.variant === "string" && model.variant.trim(), "complete native model reference required");
    invariant(command.dossier && command.metadata && (command.context as { mode: string } | undefined)?.mode === "fresh" && command.worktree === false && (command.requiredAccess || (command.expectedAccess && command.resourceBoundary)), "complete fresh dossier/access admission required");
    nonempty(body.attemptId); nonempty(body.executionId);
    const digest = fingerprint(body);
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const unit = this.unit(lease.missionId, lease.unitId), sub = unit.subIntents.find(s => s.subIntentId === body.subIntentId);
      invariant(["RESERVED", "RUNNING"].includes(unit.state), "family is stop-pending/validating/terminal; no new admission");
      const reservation = this.events.read(lease.missionId).find(e => e.key === `reserve:${lease.unitId}:${lease.token}`);
      const bindingHash = (reservation?.payload as { bindingFingerprint: string } | undefined)?.bindingFingerprint;
      const frozen = this.db.query("SELECT plan,sidecar FROM ff8_graph_plans WHERE mission=? AND binding_hash=?").get(lease.missionId, bindingHash ?? "") as { plan: string; sidecar: string } | null;
      invariant(frozen, "missing frozen admission budget");
      const envelopeBytes = JSON.parse(frozen.sidecar).envelopeBytesByUnit[lease.unitId]; integer(envelopeBytes);
      invariant(Buffer.byteLength(canonical(body), "utf8") <= envelopeBytes && envelopeBytes <= JSON.parse(frozen.plan).budgets.contextEnvelopeMaxUtf8Bytes, "complete admission exceeds frozen unit/plan UTF-8 byte budget");
      invariant(sub && sub.role === body.role, "admission sub-intent/role mismatch");
      const old = this.outbox(body.executionId);
      if (old) { invariant(old.digest === digest && old.token === lease.token && old.unit_id === lease.unitId && old.mission === lease.missionId, "admission idempotency contract changed"); return digest; }
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_outbox WHERE mission=? AND unit_id=? AND sub_intent=? AND token=? AND state!='REJECTED'").get(lease.missionId, lease.unitId, body.subIntentId, lease.token), "sub-intent already has an admission");
      for (const dependency of sub.waitsForSubIntentIds) {
        const result = this.db.query("SELECT o.execution_id FROM ff8_graph_results r JOIN ff8_graph_outbox o ON o.execution_id=r.execution_id WHERE r.mission=? AND r.unit_id=? AND o.sub_intent=? AND r.token=? AND r.eligible=1").get(lease.missionId, lease.unitId, dependency, lease.token) as { execution_id: string } | null;
        invariant(result && this.hasScientificCompletion(this.outbox(result.execution_id)!), sub.role === "R" ? "R awaits attributable A+B results" : "author awaits attributable other-function R result");
      }
      this.db.query("INSERT INTO ff8_graph_outbox(mission,unit_id,execution_id,sub_intent,token,body,digest,state,max_attempts,retry_delay) VALUES(?,?,?,?,?,?,?,'PREPARED',?,?)").run(lease.missionId, lease.unitId, body.executionId, body.subIntentId, lease.token, canonical(body), digest, maxAttempts, retryDelayMs);
      this.events.append(lease.missionId, `admission:${body.executionId}`, "admission_prepared", authority.now, { body, digest, token: lease.token, maxAttempts, retryDelayMs }, lease.unitId); return digest;
    }).immediate();
  }
  private outbox(executionId: string): OutboxRow | null { return this.db.query("SELECT * FROM ff8_graph_outbox WHERE execution_id=?").get(executionId) as OutboxRow | null; }
  admission(executionId: string): { state: string; attempts: number; digest: string; receipt: unknown } | null {
    const r = this.outbox(executionId); return r ? { state: r.state, attempts: r.attempts, digest: r.digest, receipt: r.receipt ? JSON.parse(r.receipt) : null } : null;
  }
  /** The client adds its own exact bridge CAS envelope before its network I/O. */
  async dispatch(authority: ControllerAuthority, lease: UnitLease, executionId: string, client: Pick<ExecutionClient, "submit">): Promise<Record<string, unknown>> {
    const row = this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const r = this.outbox(executionId); invariant(r && r.mission === lease.missionId && r.unit_id === lease.unitId && r.token === lease.token, "outbox scope/fence mismatch");
      if (r.receipt) return r;
      invariant(["RESERVED", "RUNNING"].includes(this.unit(lease.missionId, lease.unitId).state), "family stop/validation prevents dispatch");
      invariant(r.state === "PREPARED" && r.attempts < r.max_attempts && authority.now >= r.next_time, "admission ambiguous, blocked, delayed, or retry exhausted");
      this.db.query("UPDATE ff8_graph_outbox SET state='SENDING',attempts=attempts+1 WHERE execution_id=?").run(executionId);
      this.events.append(lease.missionId, `send:${executionId}:${r.attempts + 1}`, "admission_sending", authority.now, { executionId, attempt: r.attempts + 1, digest: r.digest }, lease.unitId); return r;
    }).immediate();
    if (row.receipt) return JSON.parse(row.receipt);
    try {
      const receipt = await client.submit(lease.missionId, JSON.parse(row.body).command);
      this.acceptReceipt(authority, lease, executionId, receipt, { attempt: row.attempts + 1, token: row.token, digest: row.digest }); return receipt;
    } catch (error) {
      this.db.transaction(() => {
        const category = graphErrorClass(error), declared = bridgeFailureCategory(error);
        // Only an explicit no-admission rejection permits retry; transport failures stay ambiguous.
        const rejected = declared && ["auth", "input", "schema", "quota"].includes(category);
        const r = this.outbox(executionId)!;
        const state = rejected ? (category === "quota" && declared.recoverable && r.attempts < r.max_attempts ? "PREPARED" : "REJECTED") : "AMBIGUOUS";
        const updated = this.db.query("UPDATE ff8_graph_outbox SET state=?,next_time=?,terminal_proof=? WHERE execution_id=? AND mission=? AND unit_id=? AND state='SENDING' AND attempts=? AND token=? AND digest=? AND receipt IS NULL").run(state, authority.now + r.retry_delay, rejected ? canonical({ category, cause: failureCause(error) }) : null, executionId, row.mission, row.unit_id, row.attempts + 1, row.token, row.digest);
        this.events.append(lease.missionId, `send_error:${executionId}:${row.attempts + 1}`, updated.changes === 1 ? "admission_error" : "admission_late_observation", Math.max(authority.now, this.events.cursor(lease.missionId).time), { executionId, errorClass: category, cause: failureCause(error), originalGeneration: { attempt: row.attempts + 1, token: row.token, digest: row.digest }, applied: updated.changes === 1, state: updated.changes === 1 ? state : r.state }, lease.unitId);
      }).immediate(); throw error;
    }
  }
  private acceptReceipt(authority: ControllerAuthority, lease: UnitLease, executionId: string, receipt: Record<string, unknown>, generation?: DispatchGeneration): void {
    this.db.transaction(() => {
      const r = this.outbox(executionId)!;
      const observedAuthority = { ...authority, now: Math.max(authority.now, this.events.cursor(lease.missionId).time) };
      if (generation && (r.state !== "SENDING" || r.attempts !== generation.attempt || r.token !== generation.token || r.digest !== generation.digest)) {
        this.events.append(lease.missionId, `late_receipt:${executionId}:${generation.attempt}`, "admission_late_observation", observedAuthority.now, { executionId, receipt, originalGeneration: generation, applied: false, state: r.state }, lease.unitId); return;
      }
      invariant(receipt.executionId === executionId && receipt.state === "accepted" && (receipt.requestDigest === undefined || receipt.requestDigest === r.digest), "receipt execution/digest/accepted status mismatch", "schema");
      const boundReceipt = { ...receipt, requestDigest: r.digest };
      invariant(!r.receipt || r.receipt === canonical(boundReceipt), "immutable admission receipt changed", "schema");
      if (r.receipt) return;
      invariant(!["REJECTED", "TERMINAL"].includes(r.state), "receipt contradicts terminal no-admission proof", "schema");
      const updated = this.db.query("UPDATE ff8_graph_outbox SET state='ACCEPTED',receipt=?,terminal_proof=NULL WHERE execution_id=? AND state=? AND attempts=? AND token=? AND digest=? AND receipt IS NULL").run(canonical(boundReceipt), executionId, r.state, r.attempts, r.token, r.digest);
      invariant(updated.changes === 1, "stale receipt admission generation");
      this.events.append(lease.missionId, `receipt:${executionId}`, "admission_accepted", observedAuthority.now, { executionId, receipt: boundReceipt, requestDigest: r.digest, token: r.token, attempt: r.attempts, source: generation ? "dispatch" : "positive_readback" }, lease.unitId);
      const u = this.unit(lease.missionId, lease.unitId);
      // A delayed native response is retained even after controller/family fencing, never resurrected.
      try { this.leases.assert(lease, observedAuthority); if (u.state === "RESERVED") this.change(observedAuthority, lease.unitId, "RUNNING", "native admission acknowledged"); } catch (error) { if (!(error instanceof GraphPersistenceError)) throw error; }
    }).immediate();
  }
  reconcileAdmission(authority: ControllerAuthority, lease: UnitLease, observation: AdmissionObservation): void {
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId);
      const r = this.outbox(observation.executionId); invariant(r && r.mission === lease.missionId && r.unit_id === lease.unitId && r.token === lease.token && r.digest === observation.requestDigest, "readback admission identity/digest/fence mismatch"); nonempty(observation.proof);
      const eventKey = `reconcile:${r.execution_id}:${r.attempts}:${fingerprint(observation)}`;
      if (this.events.read(lease.missionId).some(event => event.key === eventKey)) return;
      if (observation.state === "accepted") { invariant(observation.receipt, "accepted readback needs receipt"); this.acceptReceipt(authority, lease, r.execution_id, observation.receipt); }
      else if (observation.state === "absent") {
        invariant(!r.receipt, "accepted admission cannot disappear", "schema");
        invariant(["SENDING", "AMBIGUOUS"].includes(r.state), "only ambiguous admissions are reconciled for retry");
        this.leases.assert(lease, authority);
        const state = r.attempts < r.max_attempts ? "PREPARED" : "REJECTED";
        this.db.query("UPDATE ff8_graph_outbox SET state=?,terminal_proof=? WHERE execution_id=?").run(state, canonical(observation), r.execution_id);
      }
      this.events.append(lease.missionId, eventKey, "admission_readback", authority.now, observation, lease.unitId);
    }).immediate();
  }
  private hasAcceptedReceipt(row: OutboxRow): boolean {
    if (!row.receipt) return false;
    const receipt = JSON.parse(row.receipt) as Record<string, unknown>;
    const event = this.events.read(row.mission).find(e => e.key === `receipt:${row.execution_id}`);
    const accepted = event?.payload as { executionId: string; requestDigest: string; token: number; attempt: number; receipt: unknown; source: string } | undefined;
    return receipt.executionId === row.execution_id && receipt.state === "accepted" && receipt.requestDigest === row.digest
      && event?.kind === "admission_accepted" && accepted?.executionId === row.execution_id && accepted.requestDigest === row.digest
      && accepted.token === row.token && accepted.attempt === row.attempts && ["dispatch", "positive_readback"].includes(accepted.source)
      && canonical(accepted.receipt) === row.receipt;
  }
  private hasScientificCompletion(row: OutboxRow): boolean {
    return row.state === "TERMINAL" && !!row.terminal_proof && JSON.parse(row.terminal_proof).state === "completed" && this.hasAcceptedReceipt(row);
  }
  /** No actor parameter: identity comes ONLY from the verified host capability. */
  bootstrapParentAuthority(authority: ControllerAuthority): { identity: ParentAuthorityIdentity; digest: string } {
    return this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      invariant(this.parentAuthority, "level-2 gate: verified host parent authority is not configured", "auth");
      const raw = this.parentAuthority.verifyParent(authority);
      invariant(raw && raw.version === 1 && raw.role === "parent" && raw.missionId === authority.lease.missionId && raw.controllerOwner === authority.lease.owner, "level-2 gate: controller is not an authenticated parent", "auth");
      for (const key of ["principalId", "actorId", "source"] as const) nonempty(raw[key]);
      invariant(/^[a-f0-9]{64}$/.test(raw.sourceHash), "parent authority source digest required", "auth");
      invariant(Object.keys(raw).every(k => ["version", "role", "missionId", "controllerOwner", "principalId", "actorId", "source", "sourceHash"].includes(k)), "parent identity must not include worker payload or mutable authority fields", "auth");
      const identity = JSON.parse(canonical(raw)) as ParentAuthorityIdentity, digest = fingerprint(identity);
      const old = this.db.query("SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?").get(identity.missionId) as { document: string; digest: string; event_key: string } | null;
      if (old) {
        invariant(old.document === canonical(identity) && old.digest === digest, "immutable parent bootstrap identity changed", "auth");
        this.assertAuthorizationEvent(identity.missionId, old.event_key, "parent_authority_bootstrapped", identity); return { identity, digest };
      }
      const eventKey = `parent_authority:${digest}`;
      this.db.query("INSERT INTO ff8_graph_parent_authorities VALUES(?,?,?,?)").run(identity.missionId, canonical(identity), digest, eventKey);
      this.events.append(identity.missionId, eventKey, "parent_authority_bootstrapped", authority.now, identity);
      return { identity, digest };
    }).immediate();
  }
  private assertAuthorizationEvent(missionId: string, key: string, kind: string, payload: unknown): void {
    const event = this.events.read(missionId).find(e => e.key === key);
    invariant(event && event.kind === kind && canonical(event.payload) === canonical(payload)
      && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId }), "authorization event/digest mismatch", "schema");
  }
  private familyPublicationContext(lease: UnitLease): { bindingFingerprint: string; plan: PersistencePlan; sidecar: PersistenceSidecar } {
    const reservation = this.events.read(lease.missionId).find(e => e.key === `reserve:${lease.unitId}:${lease.token}`);
    const bindingFingerprint = (reservation?.payload as { bindingFingerprint: string } | undefined)?.bindingFingerprint;
    invariant(bindingFingerprint, "missing frozen family binding");
    const row = this.db.query("SELECT plan,sidecar,binding FROM ff8_graph_plans WHERE mission=? AND binding_hash=?").get(lease.missionId, bindingFingerprint) as { plan: string; sidecar: string; binding: string } | null;
    invariant(row, "missing immutable parent attestation plan binding");
    const plan = JSON.parse(row.plan) as PersistencePlan, sidecar = JSON.parse(row.sidecar) as PersistenceSidecar, binding = JSON.parse(row.binding) as PlanBinding;
    invariant(contentDigest(plan) === plan.fingerprint && contentDigest(sidecar) === sidecar.fingerprint && contentDigest(binding) === bindingFingerprint && binding.planFingerprint === plan.fingerprint && binding.sidecarFingerprint === sidecar.fingerprint, "parent attestation frozen binding digest mismatch", "schema");
    return { bindingFingerprint, plan, sidecar };
  }
  recordParentAttestation(authority: ControllerAuthority, lease: UnitLease, request: ParentAttestationRequest): ParentAttestation {
    return this.db.transaction(() => {
      this.leases.assert(lease, authority);
      invariant(Object.keys(request).every(k => ["bindingFingerprint", "planFingerprint", "snapshotId", "knowledgeRevision", "resultIds", "resultDigests", "evidence", "validatedFactIds", "checks"].includes(k)), "parent attestation actor/authority must not come from payload", "auth");
      const parent = this.bootstrapParentAuthority(authority), u = this.unit(lease.missionId, lease.unitId), frozen = this.familyPublicationContext(lease);
      invariant(u.state === "RUNNING" && request.bindingFingerprint === frozen.bindingFingerprint && request.planFingerprint === frozen.plan.fingerprint && request.snapshotId === u.snapshotId && request.knowledgeRevision === u.knowledgeRevision && frozen.plan.knowledgeRevision === u.knowledgeRevision, "stale parent attestation unit/fence/binding/snapshot/revision");
      invariant(Array.isArray(request.evidence) && request.evidence.length > 0 && request.validatedFactIds.length > 0 && new Set(request.validatedFactIds).size === request.validatedFactIds.length, "parent attestation evidence/facts required", "scientific_block");
      request.validatedFactIds.forEach(nonempty);
      const evidenceDigest = fingerprint(request.evidence);
      invariant(Array.isArray(request.checks) && request.checks.length > 0 && new Set(request.checks.map(c => c.id)).size === request.checks.length, "parent attestation needs explicit nonempty unique checks", "scientific_block");
      for (const check of request.checks) {
        nonempty(check.id); nonempty(check.kind); nonempty(check.detail);
        invariant(check.outcome === "pass" && check.evidenceDigest === evidenceDigest && Object.keys(check).every(k => ["id", "kind", "outcome", "evidenceDigest", "detail"].includes(k)), "parent scientific check/evidence digest mismatch", "scientific_block");
      }
      invariant(request.resultIds.length === new Set(request.resultIds).size && request.resultIds.length === u.subIntents.length && Object.keys(request.resultDigests).length === request.resultIds.length, "parent attestation needs exact whole-unit result set", "scientific_block");
      const covered = new Set<string>(), authorDigests: Record<string, string> = {}, sessions = new Set<string>();
      for (const resultId of request.resultIds) {
        const result = this.db.query("SELECT execution_id,digest,document,token FROM ff8_graph_results WHERE mission=? AND unit_id=? AND result_id=? AND eligible=1").get(lease.missionId, lease.unitId, resultId) as { execution_id: string; digest: string; document: string; token: number } | null;
        invariant(result && result.token === lease.token && result.digest === fingerprint(JSON.parse(result.document)) && request.resultDigests[resultId] === result.digest, "parent attestation result/digest/fence mismatch", "scientific_block");
        const admission = this.outbox(result.execution_id)!;
        invariant(this.hasScientificCompletion(admission), "parent attestation needs receipt-bound completed artifacts", "scientific_block");
        invariant(!covered.has(admission.sub_intent), "duplicate parent attestation sub-intent result", "scientific_block"); covered.add(admission.sub_intent);
        const native = this.parentAuthority!.verifyNativeAuthor(authority, { missionId: lease.missionId, unitId: lease.unitId, executionId: admission.execution_id, requestDigest: admission.digest });
        invariant(native && native.version === 1 && native.missionId === lease.missionId && native.executionId === admission.execution_id && native.requestDigest === admission.digest && native.fresh === true && native.parentSessionId === null, "level-2 gate: verified native author identity missing/mismatched", "scientific_block");
        for (const key of ["authorId", "sessionId", "profile", "source"] as const) nonempty(native[key]);
        const command = JSON.parse(admission.body).command as Record<string, unknown>, receipt = JSON.parse(admission.receipt!) as Record<string, unknown>, document = JSON.parse(result.document) as Record<string, unknown>;
        invariant(native.profile === command.profile && canonical(native.model) === canonical(command.model) && /^[a-f0-9]{64}$/.test(native.sourceHash)
          && (receipt.nativeSessionId === undefined || receipt.nativeSessionId === native.sessionId) && (receipt.authorId === undefined || receipt.authorId === native.authorId) && (document.authorId === undefined || document.authorId === native.authorId), "native author/model/profile/artifact provenance mismatch", "scientific_block");
        invariant(parent.identity.actorId !== native.authorId && parent.identity.actorId !== native.sessionId && !sessions.has(native.sessionId), "parent actor must be distinct from all fresh native authors", "auth"); sessions.add(native.sessionId);
        const nativeDigest = fingerprint(native), old = this.db.query("SELECT document,digest FROM ff8_graph_native_authors WHERE mission=? AND execution_id=?").get(lease.missionId, admission.execution_id) as { document: string; digest: string } | null;
        invariant(!old || (old.document === canonical(native) && old.digest === nativeDigest), "immutable native author identity changed", "auth");
        if (!old) {
          this.db.query("INSERT INTO ff8_graph_native_authors VALUES(?,?,?,?)").run(lease.missionId, admission.execution_id, canonical(native), nativeDigest);
          this.events.append(lease.missionId, `native_author:${admission.execution_id}`, "native_author_verified", authority.now, native, lease.unitId);
        }
        authorDigests[admission.execution_id] = nativeDigest;
      }
      invariant(u.subIntents.every(sub => covered.has(sub.subIntentId)), "parent attestation does not cover whole unit", "scientific_block");
      const content = { version: 1 as const, missionId: lease.missionId, unitId: lease.unitId, familyToken: lease.token, controllerToken: authority.lease.token, parentActorId: parent.identity.actorId, parentAuthorityDigest: parent.digest, bindingFingerprint: frozen.bindingFingerprint, planFingerprint: frozen.plan.fingerprint, snapshotId: u.snapshotId, snapshotFingerprint: frozen.sidecar.snapshotFingerprint, partitionId: u.partitionId, knowledgeRevision: u.knowledgeRevision, resultIds: [...request.resultIds], resultDigests: { ...request.resultDigests }, authorDigests, evidenceDigest, validatedFactIds: [...request.validatedFactIds], checks: structuredClone(request.checks) };
      const attestation: ParentAttestation = { ...content, attestationId: fingerprint(content) }, digest = fingerprint(attestation), eventKey = `parent_attestation:${attestation.attestationId}`;
      const old = this.db.query("SELECT document,revocation_event FROM ff8_graph_parent_attestations WHERE mission=? AND attestation_id=?").get(lease.missionId, attestation.attestationId) as { document: string; revocation_event: string | null } | null;
      invariant(!old || (old.document === canonical(attestation) && !old.revocation_event), "immutable/revoked parent attestation cannot be overwritten", "auth");
      if (!old) {
        this.db.query("INSERT INTO ff8_graph_parent_attestations VALUES(?,?,?,?,?,?,?,NULL)").run(lease.missionId, attestation.attestationId, lease.unitId, lease.token, canonical(attestation), digest, eventKey);
        this.events.append(lease.missionId, eventKey, "parent_attested", authority.now, attestation, lease.unitId);
      }
      this.leases.assert(lease, authority); return JSON.parse(canonical(attestation)) as ParentAttestation;
    }).immediate();
  }
  parentAttestation(missionId: string, attestationId: string): ParentAttestation {
    const row = this.db.query("SELECT document,digest,event_key,revocation_event FROM ff8_graph_parent_attestations WHERE mission=? AND attestation_id=?").get(missionId, attestationId) as { document: string; digest: string; event_key: string; revocation_event: string | null } | null;
    invariant(row && !row.revocation_event, "level-2 gate: durable nonrevoked parent attestation required", "scientific_block");
    const doc = JSON.parse(row.document) as ParentAttestation, { attestationId: _id, ...content } = doc;
    invariant(fingerprint(content) === attestationId && fingerprint(doc) === row.digest && doc.missionId === missionId, "immutable parent attestation digest mismatch", "schema");
    this.assertAuthorizationEvent(missionId, row.event_key, "parent_attested", doc);
    const parent = this.db.query("SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?").get(missionId) as { document: string; digest: string; event_key: string } | null;
    invariant(parent && fingerprint(JSON.parse(parent.document)) === parent.digest && parent.digest === doc.parentAuthorityDigest && JSON.parse(parent.document).actorId === doc.parentActorId, "attestation immutable parent authority mismatch", "auth");
    this.assertAuthorizationEvent(missionId, parent.event_key, "parent_authority_bootstrapped", JSON.parse(parent.document));
    for (const [executionId, digest] of Object.entries(doc.authorDigests)) {
      const author = this.db.query("SELECT document,digest FROM ff8_graph_native_authors WHERE mission=? AND execution_id=?").get(missionId, executionId) as { document: string; digest: string } | null;
      invariant(author && fingerprint(JSON.parse(author.document)) === digest && author.digest === digest, "attestation native author digest mismatch", "schema");
      this.assertAuthorizationEvent(missionId, `native_author:${executionId}`, "native_author_verified", JSON.parse(author.document));
    }
    return doc;
  }
  revokeParentAttestation(authority: ControllerAuthority, attestationId: string, reason: string): void {
    nonempty(reason);
    this.db.transaction(() => {
      const parent = this.bootstrapParentAuthority(authority), row = this.db.query("SELECT unit_id,revocation_event FROM ff8_graph_parent_attestations WHERE mission=? AND attestation_id=?").get(authority.lease.missionId, attestationId) as { unit_id: string; revocation_event: string | null } | null;
      invariant(row, "unknown parent attestation");
      const payload = { attestationId, actorId: parent.identity.actorId, parentAuthorityDigest: parent.digest, reason }, key = `revoke_parent_attestation:${attestationId}`;
      if (row.revocation_event) { this.assertAuthorizationEvent(authority.lease.missionId, key, "parent_attestation_revoked", payload); return; }
      this.events.append(authority.lease.missionId, key, "parent_attestation_revoked", authority.now, payload, row.unit_id);
      this.db.query("UPDATE ff8_graph_parent_attestations SET revocation_event=? WHERE mission=? AND attestation_id=? AND revocation_event IS NULL").run(key, authority.lease.missionId, attestationId);
    }).immediate();
  }
  private assertParentAttestation(authority: ControllerAuthority, lease: UnitLease, attestationId: string | undefined, resultIds: string[], evidence: unknown[], factIds: string[]): ParentAttestation {
    invariant(attestationId, "level-2 gate: parentValidated boolean is not a parent attestation", "scientific_block");
    this.leases.assert(lease, authority); const parent = this.bootstrapParentAuthority(authority), doc = this.parentAttestation(lease.missionId, attestationId), u = this.unit(lease.missionId, lease.unitId), frozen = this.familyPublicationContext(lease);
    invariant(doc.parentAuthorityDigest === parent.digest && doc.parentActorId === parent.identity.actorId && doc.unitId === lease.unitId && doc.familyToken === lease.token && doc.controllerToken === authority.lease.token && doc.bindingFingerprint === frozen.bindingFingerprint && doc.planFingerprint === frozen.plan.fingerprint && doc.snapshotId === u.snapshotId && doc.snapshotFingerprint === frozen.sidecar.snapshotFingerprint && doc.partitionId === u.partitionId && doc.knowledgeRevision === u.knowledgeRevision, "stale parent attestation actor/unit/fence/binding/plan/snapshot/revision", "scientific_block");
    invariant(canonical(doc.resultIds) === canonical(resultIds) && doc.evidenceDigest === fingerprint(evidence) && canonical(doc.validatedFactIds) === canonical(factIds) && doc.checks.length > 0, "parent attestation result/evidence/facts/checks mismatch", "scientific_block");
    for (const id of doc.resultIds) {
      const result = this.db.query("SELECT digest,document,execution_id,token,eligible FROM ff8_graph_results WHERE mission=? AND unit_id=? AND result_id=?").get(lease.missionId, lease.unitId, id) as { digest: string; document: string; execution_id: string; token: number; eligible: number } | null;
      invariant(result && result.token === lease.token && result.eligible === 1 && result.digest === doc.resultDigests[id] && fingerprint(JSON.parse(result.document)) === result.digest && this.hasScientificCompletion(this.outbox(result.execution_id)!), "stale parent attestation result/digest/fence", "scientific_block");
    }
    return doc;
  }
  proveTerminal(authority: ControllerAuthority, unitId: string, executionId: string, status: "completed" | "stopped" | "failed" | "rejected" | "absent", proof: Record<string, unknown>): void {
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId); const r = this.outbox(executionId);
      invariant(r && r.mission === authority.lease.missionId && r.unit_id === unitId, "terminal proof scope mismatch");
      invariant(["absent", "rejected"].includes(status) || r.attempts > 0, "unsubmitted outbox cannot prove a native execution terminal");
      invariant(proof.executionId === executionId && proof.state === status && proof.requestDigest === r.digest && proof.quiescent === true && typeof proof.source === "string" && proof.source.trim(), "terminal native readback proof required");
      invariant(!["absent", "rejected"].includes(status) || !r.receipt, "accepted execution cannot become absent/rejected");
      if (status === "completed") invariant(["ACCEPTED", "TERMINAL"].includes(r.state) && this.hasAcceptedReceipt(r), "completed requires a durable accepted receipt bound to execution/digest", "scientific_block");
      const body = canonical(proof);
      if (r.state === "TERMINAL") { invariant(r.terminal_proof === body, "terminal proof changed"); return; }
      this.db.query("UPDATE ff8_graph_outbox SET state='TERMINAL',terminal_proof=? WHERE execution_id=?").run(body, executionId);
      this.events.append(r.mission, `terminal:${executionId}`, "execution_terminal", authority.now, { executionId, status, proof }, unitId);
    }).immediate();
  }
  retainResult(authority: ControllerAuthority, lease: UnitLease, executionId: string, resultId: string, document: Record<string, unknown>, source: "artifact" | "bulletin" = "artifact"): boolean {
    nonempty(resultId);
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); const r = this.outbox(executionId);
      invariant(r && r.mission === lease.missionId && r.unit_id === lease.unitId && r.token === lease.token, "result attribution mismatch");
      const digest = fingerprint(document), old = this.db.query("SELECT digest,eligible FROM ff8_graph_results WHERE mission=? AND result_id=?").get(lease.missionId, resultId) as { digest: string; eligible: number } | null;
      let current = true; try { this.leases.assert(lease, authority); } catch { current = false; }
      const eligible = current && source === "artifact" && this.hasScientificCompletion(r);
      if (old) { invariant(old.digest === digest, "result identity changed"); return old.eligible === 1 && eligible; }
      this.db.query("INSERT INTO ff8_graph_results VALUES(?,?,?,?,?,?,?,?)").run(lease.missionId, lease.unitId, resultId, executionId, lease.token, digest, canonical(document), eligible ? 1 : 0);
      this.events.append(lease.missionId, `result:${resultId}`, "result_retained", authority.now, { resultId, executionId, token: lease.token, document, eligible, source }, lease.unitId); return eligible;
    }).immediate();
  }
  validateUnit(authority: ControllerAuthority, lease: UnitLease, resultIds: string[], validation: UnitValidation): void {
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const u = this.unit(lease.missionId, lease.unitId);
      invariant(validation.source === "artifact" && validation.evidence.length > 0 && validation.validatedFactIds.length > 0, "scientific validation evidence required", "scientific_block");
      if (u.requiredPublicationLevel === 2 || validation.parentAttestationId) this.assertParentAttestation(authority, lease, validation.parentAttestationId, resultIds, validation.evidence, validation.validatedFactIds);
      const candidates = this.db.query("SELECT r.result_id,o.sub_intent,o.execution_id FROM ff8_graph_results r JOIN ff8_graph_outbox o ON o.execution_id=r.execution_id WHERE r.mission=? AND r.unit_id=? AND r.token=? AND r.eligible=1").all(lease.missionId, lease.unitId, lease.token) as Array<{ result_id: string; sub_intent: string; execution_id: string }>;
      const results = candidates.filter(candidate => this.hasScientificCompletion(this.outbox(candidate.execution_id)!));
      invariant(resultIds.length === new Set(resultIds).size && resultIds.every(id => results.some(r => r.result_id === id)) && u.subIntents.every(s => results.some(r => r.sub_intent === s.subIntentId && resultIds.includes(r.result_id))), "validation requires all attributable family artifacts", "scientific_block");
      this.change(authority, lease.unitId, "VALIDATING", "family validation executed");
      this.events.append(lease.missionId, `validation:${lease.unitId}:${lease.token}`, "unit_validated", authority.now, { token: lease.token, resultIds, validation }, lease.unitId);
    }).immediate();
  }
  preparePublication(authority: ControllerAuthority, lease: UnitLease, commit: KnowledgeCommit): void {
    validateGraphDocument("knowledge-commit", commit);
    invariant(/^[a-f0-9]{64}$/.test(commit.commitId) && /^[a-f0-9]{64}$/.test(commit.readbackHash), "publication identities must be SHA256 digests", "schema");
    invariant(commit.unitId === lease.unitId && commit.outputRevision === commit.inputRevision + 1 && commit.isGitCommit === false && [1, 2].includes(commit.publicationLevel) && commit.readbackStatus === "pending", "inadmissible scientific publication");
    invariant(!/^(?:idb|ida)(?::|$)/i.test(commit.publicationTargetId), "IDB publication outside mission");
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const u = this.unit(lease.missionId, lease.unitId); invariant(u.state === "VALIDATING" && commit.inputRevision === u.knowledgeRevision && commit.publicationLevel >= u.requiredPublicationLevel, "publication revision/level/state mismatch");
      const event = this.events.read(lease.missionId).find(e => e.key === `validation:${lease.unitId}:${lease.token}`);
      invariant(event, "no executed validation"); const validated = event.payload as { resultIds: string[]; validation: UnitValidation };
      invariant(canonical(commit.resultIds) === canonical(validated.resultIds) && canonical(commit.evidence) === canonical(validated.validation.evidence) && canonical(commit.validatedFactIds) === canonical(validated.validation.validatedFactIds), "publication differs from validated evidence", "scientific_block");
      if (commit.publicationLevel === 2) {
        const attestation = this.assertParentAttestation(authority, lease, validated.validation.parentAttestationId, commit.resultIds, commit.evidence, commit.validatedFactIds);
        const payload = { attestationId: attestation.attestationId, commitDigest: fingerprint(commit), parentAuthorityDigest: attestation.parentAuthorityDigest, token: lease.token };
        const key = `parent_publication:${lease.unitId}`;
        const oldAuthorization = this.events.read(lease.missionId).find(e => e.key === key);
        if (oldAuthorization) this.assertAuthorizationEvent(lease.missionId, key, "parent_publication_authorized", payload);
        else this.events.append(lease.missionId, key, "parent_publication_authorized", authority.now, payload, lease.unitId);
      }
      const old = this.db.query("SELECT digest FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { digest: string } | null;
      invariant(!old || old.digest === fingerprint(commit), "publication idempotency changed");
      if (old) return;
      this.db.query("INSERT INTO ff8_graph_publications VALUES(?,?,?,?,?,NULL)").run(lease.missionId, lease.unitId, lease.token, canonical(commit), fingerprint(commit));
      this.events.append(lease.missionId, `publication:${lease.unitId}`, "publication_prepared", authority.now, commit, lease.unitId);
    }).immediate();
  }
  commitReadback(authority: ControllerAuthority, lease: UnitLease, readback: { targetId: string; hash: string; requestDigest: string; source: string }): KnowledgeCommit {
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId);
      const done = this.db.query("SELECT document FROM ff8_graph_commits WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { document: string } | null;
      if (done) {
        const commit = JSON.parse(done.document) as KnowledgeCommit;
        invariant(commit.publicationTargetId === readback.targetId && commit.readbackHash === readback.hash, "double commit readback changed");
        const prior = this.db.query("SELECT readback FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { readback: string };
        invariant(prior.readback === canonical(readback), "double commit provenance changed"); return commit;
      }
      this.leases.assert(lease, authority);
      const r = this.db.query("SELECT * FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { request: string; digest: string; token: number } | null;
      invariant(r && r.token === lease.token, "missing/fenced durable publication"); const pending = JSON.parse(r.request) as KnowledgeCommit;
      if (pending.publicationLevel === 2) {
        const validationEvent = this.events.read(lease.missionId).find(e => e.key === `validation:${lease.unitId}:${lease.token}`);
        const validation = (validationEvent?.payload as { validation: UnitValidation } | undefined)?.validation;
        const attestation = this.assertParentAttestation(authority, lease, validation?.parentAttestationId, pending.resultIds, pending.evidence, pending.validatedFactIds);
        this.assertAuthorizationEvent(lease.missionId, `parent_publication:${lease.unitId}`, "parent_publication_authorized", { attestationId: attestation.attestationId, commitDigest: r.digest, parentAuthorityDigest: attestation.parentAuthorityDigest, token: lease.token });
      }
      invariant(readback.targetId === pending.publicationTargetId && readback.hash === pending.readbackHash && readback.requestDigest === r.digest && readback.source.trim(), "publication readback mismatch", "scientific_block");
      this.assertQuiescence(lease);
      const commit: KnowledgeCommit = { ...pending, readbackStatus: "verified" };
      this.observePublication(authority, lease.unitId, readback);
      this.db.query("INSERT INTO ff8_graph_commits VALUES(?,?,?,?)").run(lease.missionId, lease.unitId, commit.commitId, canonical(commit));
      this.change(authority, lease.unitId, "COMMITTED", "scientific publication readback verified");
      this.events.append(lease.missionId, `commit:${lease.unitId}`, "knowledge_committed", authority.now, commit, lease.unitId);
      this.leases.releaseProven(authority, lease); return commit;
    }).immediate();
  }
  /** Lost publication replies can be retained even after fencing, without scientific promotion. */
  observePublication(authority: ControllerAuthority, unitId: string, readback: { targetId: string; hash: string; requestDigest: string; source: string }): void {
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const r = this.db.query("SELECT request,digest,readback FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(authority.lease.missionId, unitId) as { request: string; digest: string; readback: string | null } | null;
      invariant(r, "no durable publication intent"); const pending = JSON.parse(r.request) as KnowledgeCommit;
      invariant(readback.targetId === pending.publicationTargetId && readback.hash === pending.readbackHash && readback.requestDigest === r.digest && readback.source.trim(), "publication readback mismatch", "scientific_block");
      const content = canonical(readback); invariant(!r.readback || r.readback === content, "immutable publication readback changed");
      if (r.readback) return;
      this.db.query("UPDATE ff8_graph_publications SET readback=? WHERE mission=? AND unit_id=?").run(content, authority.lease.missionId, unitId);
      this.events.append(authority.lease.missionId, `publication_readback:${unitId}`, "publication_readback", authority.now, readback, unitId);
    }).immediate();
  }
  satisfies(missionId: string, unitId: string, level: number): boolean {
    const r = this.db.query("SELECT document FROM ff8_graph_commits WHERE mission=? AND unit_id=?").get(missionId, unitId) as { document: string } | null;
    if (!r) return false; const c = JSON.parse(r.document) as KnowledgeCommit;
    if (c.publicationLevel === 2 && !this.hasCommittedParentAttestation(missionId, unitId, c)) return false;
    return c.readbackStatus === "verified" && c.futurePrerequisiteEffect === "satisfies" && c.publicationLevel >= level && c.resultIds.every(id => {
      const result = this.db.query("SELECT execution_id FROM ff8_graph_results WHERE mission=? AND unit_id=? AND result_id=? AND eligible=1").get(missionId, unitId, id) as { execution_id: string } | null;
      return result && this.hasScientificCompletion(this.outbox(result.execution_id)!);
    });
  }
  private hasCommittedParentAttestation(missionId: string, unitId: string, commit: KnowledgeCommit): boolean {
    try {
      const publication = this.db.query("SELECT token,digest FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(missionId, unitId) as { token: number; digest: string } | null;
      if (!publication) return false;
      const validationEvent = this.events.read(missionId).find(e => e.key === `validation:${unitId}:${publication.token}`);
      const validation = (validationEvent?.payload as { validation: UnitValidation } | undefined)?.validation;
      if (!validation?.parentAttestationId) return false;
      const attestation = this.parentAttestation(missionId, validation.parentAttestationId);
      if (attestation.unitId !== unitId || attestation.familyToken !== publication.token || canonical(attestation.resultIds) !== canonical(commit.resultIds) || attestation.evidenceDigest !== fingerprint(commit.evidence) || canonical(attestation.validatedFactIds) !== canonical(commit.validatedFactIds)) return false;
      this.assertAuthorizationEvent(missionId, `parent_publication:${unitId}`, "parent_publication_authorized", { attestationId: attestation.attestationId, commitDigest: publication.digest, parentAuthorityDigest: attestation.parentAuthorityDigest, token: publication.token });
      return true;
    } catch { return false; } // Corrupt/legacy/revoked authorizations never unblock consumers.
  }
  private assertQuiescence(lease: UnitLease): void {
    const rows = this.db.query("SELECT state,terminal_proof FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").all(lease.missionId, lease.unitId) as Array<{ state: string; terminal_proof: string | null }>;
    invariant(rows.every(r => ["TERMINAL", "REJECTED"].includes(r.state) && r.terminal_proof), "old execution still active/ambiguous; redispatch forbidden");
  }
  retireFamily(authority: ControllerAuthority, lease: UnitLease, outcome: "RETRYABLE" | "FAILED" | "CANCELLED", reason: string, errorClass: Exclude<ErrorClass, "none">): void {
    nonempty(reason);
    this.db.transaction(() => {
      this.leases.assert(lease, authority); this.assertQuiescence(lease);
      this.change(authority, lease.unitId, outcome, reason);
      this.leases.releaseProven(authority, lease);
      this.events.append(lease.missionId, `retire:${lease.unitId}:${lease.token}`, "family_retired", authority.now, { token: lease.token, outcome, reason, errorClass }, lease.unitId);
    }).immediate();
  }
  releaseQuarantine(authority: ControllerAuthority, unitId: string): void {
    this.db.transaction(() => {
      const lease = this.leases.get(authority.lease.missionId, unitId); invariant(lease && lease.state === "quarantined", "family not quarantined");
      this.assertQuiescence(lease); this.leases.releaseProven(authority, lease);
      // The old revision remains historical. A fresh unit/plan is required; never auto-READY.
      this.events.append(lease.missionId, `quiescent:${unitId}:${lease.token}`, "quarantine_quiescent", authority.now, { token: lease.token }, unitId);
    }).immediate();
  }
  /** Audit projection only: NOT reconstruction of leases/outbox/plan tables.
   * EventLog.replay supports a supplied reducer; repairing/rebuilding materialized
   * state from the journal needs a separate reviewed recovery implementation.
   */
  replay(missionId: string): { states: Record<string, WorkUnitState>; committed: string[]; time: number; sequence: number } {
    return this.events.replay(missionId, { states: {} as Record<string, WorkUnitState>, committed: [] as string[], time: 0, sequence: 0 }, (state, event: GraphEvent) => {
      if (event.kind === "unit_added") state.states[event.unitId!] = (event.payload as WorkUnit).state;
      if (event.kind === "unit_state") state.states[event.unitId!] = (event.payload as { state: WorkUnitState }).state;
      if (event.kind === "knowledge_committed") state.committed.push(event.unitId!);
      state.time = event.time; state.sequence = event.sequence; return state;
    });
  }
}
