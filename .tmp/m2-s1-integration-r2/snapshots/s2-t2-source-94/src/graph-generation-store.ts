/** Private S2 A fixture persistence/T0/T1 and bounded minimal final T2.
 * ZERO submission/scientific-publication IO; B/native/replacement stay HOLD.
 */
import { Database } from "bun:sqlite";
import { existsSync, realpathSync } from "node:fs";
import { basename } from "node:path";
import { EventLog, immutableCopy, integer, invariant, nonempty } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import { assertExecutionJsonV1, bindExecutionSourcesV1, makeGraphRunV3,
  type ParsedExecutionEnvelopeV1, type IndependentlyLoadedSourcesV1, type BoundExecutionV1, type ReadonlyData, type RootLimitsV1, type RootModelBindingsV1,
  type GenerationHeadV1, type CandidateRefV1, type ByteRef, type ActivationAttemptV1 } from "./graph-execution-envelope";
import { candidateStagingV1, finalHostV1, currentFinalAV1, initializeActivationCounterV1, activationCounterV1, appendAttemptV1,
  activationAttemptV1, activationOutcomeV1, writeActivationOutcomeV1, type FinalAHandleV1, type CandidateStagingV1, type ActivationResultV1 } from "./graph-generation-activation";
import { verifyPolicyAssetV1, finalDocumentV1, assertFinalOwnV1, finalAuthorityFactsV1 } from "./graph-final-inventory";
import type { GraphExecutionTemplate } from "./domain";
import { captureAdmissionImageV3, checkAdmissionBodyCapsV3, rootBudgetDataV3, rootSlotKeyV3, safeRootSumV3, type AdmissionImageV3 } from "./graph-generation-budget";
import { FixtureTrustedAuthorityV1, resolveFixtureAuthorityV1, assertFixtureRecordCurrentV1, type FixtureAuthorityHandleV1, type FixtureControllerRecordV1, type FixtureObservationRecordV1 } from "./graph-trusted-authority";
import { resolveFixtureResourceAcquisitionV1, resolveFixtureResourceWitnessV1, readFixtureResourceSourceV1, advanceFixtureResourcePoolV1,
  type FixtureResourceAcquisitionHandleV1, type FixtureResourceWitnessV1 } from "./graph-trusted-authority";
import { checkResourceRequirementV1, readResourceInventoryV1, assertResourceSnapshotV1, resourceWorkerKeyV1, workerDimensions, accountDimensions,
  type ResourceAcquisitionV1, type ResourceAllocationV1, type ResourceAssignmentV1, type ResourceMutationV1 } from "./graph-resource-ledger";
import { resolveFixturePreparationV1, resolveFixtureTransitionAV1, assertFixturePreparationRefV1, type FixturePreparationHandleV1, type FixtureTransitionAHandleV1 } from "./graph-trusted-authority";
import { putTransitionDocumentV1, readTransitionDocumentV1, auditPreparationCounterV1, commitPreparationCounterV1, captureOperationalV1, assertObservationV1,
  checkTransitionSourceV1, auditGenerationHistoryV1, type TransitionCaseV1, type TransitionObservationV1, type PreparedTransitionV1, type PreparedTransitionValueV1, type DrainResultV1 } from "./graph-generation-transition";

const tables = ["g3_meta", "g3_head", "g3_origins", "g3_units", "g3_families", "g3_claims", "g3_root", "g3_slots", "g3_outbox", "g3_authority", "g3_fence", "ff8_events", "ff8_graph_streams", "ff8_harness_metadata"];
const schema = `
CREATE TABLE g3_meta(version INTEGER NOT NULL CHECK(version=1)); INSERT INTO g3_meta VALUES(1);
CREATE TABLE ff8_harness_metadata(component TEXT PRIMARY KEY,version INTEGER NOT NULL);
INSERT INTO ff8_harness_metadata VALUES('graph-generation-fixture',1);
CREATE TABLE g3_head(mission TEXT PRIMARY KEY,lineage TEXT NOT NULL,revision INTEGER NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL);
CREATE TABLE g3_origins(mission TEXT NOT NULL,generation TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,run TEXT NOT NULL,t0 TEXT NOT NULL,state TEXT NOT NULL,PRIMARY KEY(mission,generation));
CREATE TABLE g3_units(mission TEXT NOT NULL,generation TEXT NOT NULL,unit TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL,revision INTEGER NOT NULL,PRIMARY KEY(mission,generation,unit));
CREATE TABLE g3_families(mission TEXT NOT NULL,generation TEXT NOT NULL,unit TEXT NOT NULL,owner TEXT NOT NULL,controller_fence INTEGER NOT NULL,family_fence INTEGER NOT NULL,expires_event INTEGER NOT NULL,state TEXT NOT NULL,PRIMARY KEY(mission,generation,unit));
CREATE TABLE g3_claims(resource_key TEXT PRIMARY KEY,mission TEXT NOT NULL,generation TEXT NOT NULL,unit TEXT NOT NULL,family_fence INTEGER NOT NULL);
CREATE TABLE g3_root(root_id TEXT PRIMARY KEY,mission TEXT NOT NULL UNIQUE,lineage TEXT NOT NULL,revision INTEGER NOT NULL,limits_utf8 TEXT NOT NULL,grants_utf8 TEXT NOT NULL,models_utf8 TEXT NOT NULL,digest TEXT NOT NULL);
CREATE TABLE g3_slots(root_id TEXT NOT NULL,slot_key TEXT NOT NULL,revision INTEGER NOT NULL,state TEXT NOT NULL,grant_ref TEXT NOT NULL,cap INTEGER NOT NULL,debit INTEGER NOT NULL,claim_utf8 TEXT,PRIMARY KEY(root_id,slot_key));
CREATE TABLE g3_outbox(execution_id TEXT PRIMARY KEY,mission TEXT NOT NULL,generation TEXT NOT NULL,unit TEXT NOT NULL,sub_intent TEXT NOT NULL,root_id TEXT NOT NULL,slot_key TEXT NOT NULL,controller_fence INTEGER NOT NULL,family_fence INTEGER NOT NULL,admission_utf8 TEXT NOT NULL,command_utf8 TEXT NOT NULL,raw_sha TEXT NOT NULL,command_sha TEXT NOT NULL,request_digest TEXT NOT NULL,state TEXT NOT NULL,attempt INTEGER NOT NULL,max_attempts INTEGER NOT NULL,retry_delay INTEGER NOT NULL,receipt TEXT,terminal_proof TEXT,UNIQUE(root_id,slot_key));
CREATE TABLE g3_authority(record_ref TEXT PRIMARY KEY,kind TEXT NOT NULL,revision INTEGER NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,revoked INTEGER NOT NULL);
CREATE TABLE g3_fence(singleton INTEGER PRIMARY KEY CHECK(singleton=1),token INTEGER NOT NULL); INSERT INTO g3_fence VALUES(1,0);`;

// Closed descriptors for THIS private schema, not a SQL grammar/migration tool.
// Exact DDL checks retain CHECK clauses; PRAGMAs independently check the actual
// columns/PK/indexes, rather than trusting marker rows or stored SQL alone.
const eventSchema = [
  "CREATE TABLE ff8_graph_streams(mission TEXT PRIMARY KEY, sequence INTEGER NOT NULL DEFAULT 0, time INTEGER NOT NULL DEFAULT 0)",
  "CREATE TABLE ff8_events(mission TEXT NOT NULL, sequence INTEGER NOT NULL, time INTEGER NOT NULL, key TEXT NOT NULL, kind TEXT NOT NULL, unit_id TEXT, payload TEXT NOT NULL, digest TEXT NOT NULL, PRIMARY KEY(mission,sequence), UNIQUE(mission,key))",
];
const primaryKeys: Readonly<Record<string, readonly string[]>> = {
  g3_meta: [], ff8_harness_metadata: ["component"], g3_head: ["mission"], g3_origins: ["mission", "generation"],
  g3_units: ["mission", "generation", "unit"], g3_families: ["mission", "generation", "unit"], g3_claims: ["resource_key"],
  g3_root: ["root_id"], g3_slots: ["root_id", "slot_key"], g3_outbox: ["execution_id"], g3_authority: ["record_ref"],
  g3_fence: ["singleton"], ff8_graph_streams: ["mission"], ff8_events: ["mission", "sequence"],
};
const additionalUnique: Readonly<Record<string, readonly (readonly string[])[]>> = {
  g3_root: [["mission"]], g3_outbox: [["root_id", "slot_key"]], ff8_events: [["mission", "key"]],
};
const normalizedDDL = (sql: string) => sql.trim().replace(/\s+/g, " ").toLowerCase().replace("create table if not exists ", "create table ");

function verifyStructure(db: Database): void {
  const declarations = [...schema.split(";").map(s => s.trim()).filter(s => s.startsWith("CREATE TABLE ")), ...eventSchema];
  for (const ddl of declarations) {
    const name = /^CREATE TABLE (\w+)/.exec(ddl)?.[1];
    invariant(name && tables.includes(name), "private schema descriptor error", "schema");
    const stored = db.query("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(name) as { sql: string } | null;
    invariant(stored && normalizedDDL(stored.sql) === normalizedDDL(ddl), "OWN v3 table constraints differ", "schema");
    const columns = db.query(`PRAGMA table_xinfo('${name}')`).all() as
      { name: string; type: string; notnull: number; dflt_value: string | null; pk: number; hidden: number }[];
    // Only the fixed TEXT/INTEGER declarations above are admitted. Extracting
    // their local descriptors is not parsing an incoming database's SQL.
    const declared = [...ddl.matchAll(/\b(\w+)\s+(TEXT|INTEGER)\b([^,]*)/g)];
    invariant(columns.length === declared.length, "OWN v3 column set differs", "schema");
    const pk = primaryKeys[name]!;
    columns.forEach((column, i) => {
      const match = declared[i]!, attributes = match[3]!;
      const defaultValue = /\bDEFAULT\s+(0|1)\b/.exec(attributes)?.[1] ?? null;
      invariant(column.name === match[1] && column.type.toUpperCase() === match[2]
        && column.notnull === (attributes.includes("NOT NULL") ? 1 : 0) && column.dflt_value === defaultValue
        && column.pk === (pk.indexOf(column.name) + 1) && column.hidden === 0, "OWN v3 physical column/PK differs", "schema");
    });
    const expected = [
      ...(name === "g3_fence" || pk.length === 0 ? [] : [{ origin: "pk", columns: [...pk] }]),
      ...(additionalUnique[name] ?? []).map(key => ({ origin: "u", columns: [...key] })),
    ];
    const indexes = db.query(`PRAGMA index_list('${name}')`).all() as { name: string; unique: number; origin: string; partial: number }[];
    invariant(indexes.length === expected.length, "OWN v3 index set differs", "schema");
    const actual = indexes.map(index => {
      invariant(index.unique === 1 && index.partial === 0 && /^sqlite_autoindex_[A-Za-z0-9_]+$/.test(index.name), "OWN v3 index kind differs", "schema");
      const indexed = db.query(`PRAGMA index_xinfo('${index.name}')`).all() as { name: string | null; key: number; desc: number; coll: string }[];
      const keys = indexed.filter(c => c.key === 1);
      invariant(keys.every(c => c.name !== null && c.desc === 0 && c.coll === "BINARY"), "OWN v3 index columns/collation differ", "schema");
      return { origin: index.origin, columns: keys.map(c => c.name) };
    });
    invariant(canonical(actual.map(canonical).sort()) === canonical(expected.map(canonical).sort()), "OWN v3 PK/UNIQUE indexes differ", "schema");
  }
}

function verifySchema(db: Database): void {
  invariant(!db.query("SELECT 1 FROM sqlite_master WHERE type IN ('view','trigger') LIMIT 1").get(), "foreign SQL objects in OWN v3", "schema");
  const names = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  invariant(names.length === tables.length && names.every(r => tables.includes(r.name)), "foreign/incomplete OWN v3 schema", "schema");
  verifyStructure(db);
  const versions = db.query("SELECT version FROM g3_meta").all() as { version: number }[];
  const metadata = db.query("SELECT component,version FROM ff8_harness_metadata").all() as { component: string; version: number }[];
  invariant(versions.length === 1 && versions[0]!.version === 1 && metadata.length === 1
    && metadata[0]!.component === "graph-generation-fixture" && metadata[0]!.version === 1, "unsupported OWN v3 marker", "schema");
}

/** Never called at module load. Parent owns path admission and fixture lifecycle.
 * Existing files are opened without CREATE, checked before any DDL/PRAGMA writes.
 */
export function openGraphGenerationFixture(path: string): Database {
  nonempty(path);
  invariant(path === ":memory:" || (!/^file:/i.test(path) && !path.includes("?") && !path.includes("#")
    && (!path.includes(":") || (/^[A-Za-z]:[\\/]/.test(path) && !path.slice(2).includes(":")))), "fixture path must be plain, or explicit memory");
  const forbidden = (p: string) => basename(p.replaceAll("\\", "/")).replace(/[ .]+$/, "").toLowerCase() === "ensemble.db";
  invariant(!forbidden(path) && !(existsSync(path) && forbidden(realpathSync(path))), "Ensemble alias forbidden", "auth");
  const existed = path !== ":memory:" && existsSync(path);
  const db = new Database(path, { create: !existed, strict: true });
  try {
    if (existed) verifySchema(db);
    else db.transaction(() => { db.exec(schema); new EventLog(db); verifySchema(db); }).immediate();
    db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;"); return db;
  } catch (error) { db.close(); throw error; }
}

export interface GenerationViewV3 extends GenerationHeadV1 {
  missionId: string; lineageId: string; generationId: string; envelopeFingerprint: string; sourceDigest: string;
  rootAccountId: string; owner: string; controllerFence: number; knowledgeRevision: number; planFingerprint: string;
  revision: number; inventoryRevision: number; budgetLedgerRevision: number; budgetLedgerDigest: string;
  activeGenerationId: string; activePlanRevision: number; sourceMissionRevision: number; knowledgeRootHash: string; knowledgeLedgerDigest: string;
  preparationCounterRef: ByteRef;
}
export interface FamilyLeaseV3 {
  missionId: string; generationId: string; unitId: string; owner: string; controllerFence: number;
  familyFence: number; expiresAtEvent: number; subIntents: ReadonlyData<BoundExecutionV1["planning"]["units"][number]["subIntents"]>;
}
export interface PreparedAdmissionV3 {
  status: "PREPARED" | "BURNED"; generationId: string; unitId: string; subIntentId: string; executionId: string; attemptId: string;
  image: AdmissionImageV3; cap: number; reservedDebit: number; maxAttempts: number; retryDelayMs: number; grantRef: string;
  /** Retained source identities, not a permission to emit. Retry cannot silently
   * substitute a newer observation for a revoked consumption witness. */
  resourceSources: { acquisitionRef: ResourceAllocationV1["acquisitionRef"]; assignmentRef: ResourceAllocationV1["assignmentRef"]; remainingRef: ResourceAllocationV1["assignmentRef"] };
}
interface SlotRow { root_id: string; slot_key: string; revision: number; state: string; grant_ref: string; cap: number; debit: number; claim_utf8: string | null }
interface FamilyRow { mission: string; generation: string; unit: string; owner: string; controller_fence: number; family_fence: number; expires_event: number; state: string }
interface OutboxRow {
  execution_id: string; mission: string; generation: string; unit: string; sub_intent: string; root_id: string; slot_key: string;
  controller_fence: number; family_fence: number; admission_utf8: string; command_utf8: string; raw_sha: string; command_sha: string;
  request_digest: string; state: string; attempt: number; max_attempts: number; retry_delay: number; receipt: string | null; terminal_proof: string | null;
}
function detached<T>(value: T): T { assertExecutionJsonV1(value); return immutableCopy(value); }

export class GraphGenerationStoreV1 {
  constructor(readonly db: Database, readonly events: EventLog) {
    invariant(events.db === db && Object.getPrototypeOf(events) === EventLog.prototype, "same OWN/EventLog connection required"); verifySchema(db);
    // Read/audit old70 remains possible. New consumption never infers an empty
    // pool from old outboxes. If resource events exist, reopen verifies them.
    if (db.query("SELECT 1 FROM ff8_events WHERE kind IN ('g3_resource_allocated','g3_resource_released') LIMIT 1").get()) readResourceInventoryV1(db, events, "");
    const controlled = db.query("SELECT document FROM g3_head").all() as { document: string }[];
    for (const row of controlled) { const head = JSON.parse(row.document) as GenerationViewV3;
      if (head.version === "l8-graph-generation-head-v1") { auditPreparationCounterV1(db, events, head.rootAccountId);
        if (db.query("SELECT 1 FROM g3_authority WHERE kind IN ('activation-counter','activation-attempt','activation-result') LIMIT 1").get()) activationCounterV1(db, head.rootAccountId);
        auditGenerationHistoryV1(db, events, this.read(head.missionId));
        if (head.barrierRootId) this.drainResult(this.read(head.missionId)); } }
  }
  resourceInventory(poolId: string) { nonempty(poolId); return readResourceInventoryV1(this.db, this.events, poolId); }
  private ledger(root: string): string { return fingerprint(this.db.query("SELECT * FROM g3_slots WHERE root_id=? ORDER BY slot_key").all(root)); }
  private origin(mission: string) {
    const head = this.rawHead(mission);
    const row = this.db.query("SELECT document,digest FROM g3_origins WHERE mission=? AND generation=? AND state='ACTIVE'").get(mission, head.generationId) as { document: string; digest: string } | null;
    invariant(row && fingerprint(JSON.parse(row.document)) === row.digest && row.digest === head.sourceDigest, "HOLD: origin corrupted/unavailable", "schema");
    const sources = JSON.parse(row.document) as { origin: ParsedExecutionEnvelopeV1; independent: IndependentlyLoadedSourcesV1 };
    const bound = bindExecutionSourcesV1(sources.origin, sources.independent);
    invariant(bound.ok, "HOLD: full origin/source binding failed", "schema");
    invariant(bound.value.origin.generationId === head.generationId && bound.value.origin.envelope.fingerprint === head.envelopeFingerprint
      && bound.value.snapshot.knowledgeRevision === head.knowledgeRevision && bound.value.planning.plan.fingerprint === head.planFingerprint, "HOLD: head/source mismatch");
    const root = rootBudgetDataV3(bound.value);
    const stored = this.db.query("SELECT limits_utf8,grants_utf8,models_utf8 FROM g3_root WHERE root_id=?").get(head.rootAccountId) as { limits_utf8: string; grants_utf8: string; models_utf8: string } | null;
    invariant(root.rootAccountId === head.rootAccountId && stored?.limits_utf8 === root.limitsUtf8 && stored.grants_utf8 === root.grantsUtf8 && stored.models_utf8 === root.modelsUtf8, "HOLD: immutable root sources changed");
    return bound.value;
  }
  private rawHead(mission: string): GenerationViewV3 {
    const row = this.db.query("SELECT revision,document,digest FROM g3_head WHERE mission=?").get(mission) as { revision: number; document: string; digest: string } | null;
    invariant(row && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: missing/corrupt head", "schema");
    const view = JSON.parse(row.document) as GenerationViewV3;
    invariant(view.missionId === mission && view.revision === row.revision && ["RUNNING", "DRAIN_NEW_FAMILIES", "OPERATOR_PAUSED"].includes(view.controlMode), "HOLD: head projection mismatch");
    if (view.version) invariant(view.version === "l8-graph-generation-head-v1" && view.activeGenerationId === view.generationId, "HOLD: active head identity mismatch"); return view;
  }
  read(mission: string): GenerationViewV3 {
    const view = this.rawHead(mission), root = this.db.query("SELECT revision,digest FROM g3_root WHERE root_id=?").get(view.rootAccountId) as { revision: number; digest: string } | null;
    invariant(root && root.revision === view.budgetLedgerRevision && root.digest === view.budgetLedgerDigest && root.digest === this.ledger(view.rootAccountId), "HOLD: root ledger projection mismatch");
    return detached(view);
  }
  slots(mission: string): readonly SlotRow[] { return detached(this.db.query("SELECT * FROM g3_slots WHERE root_id=? ORDER BY slot_key").all(this.read(mission).rootAccountId) as SlotRow[]); }
  claims(mission: string): readonly { resource_key: string }[] { return detached(this.db.query("SELECT resource_key FROM g3_claims WHERE mission=? ORDER BY resource_key").all(mission) as { resource_key: string }[]); }
  admissions(mission: string): readonly OutboxRow[] { return detached(this.db.query("SELECT * FROM g3_outbox WHERE mission=? ORDER BY execution_id").all(mission) as OutboxRow[]); }
  auditReplay(mission: string) { return this.events.replay(mission, [] as string[], (state, event) => { state.push(event.digest); return state; }); }
  private controller(handle: FixtureAuthorityHandleV1, view: GenerationViewV3): FixtureControllerRecordV1 {
    const record = resolveFixtureAuthorityV1(this.db, handle);
    invariant(record.kind === "controller" && record.missionId === view.missionId && record.generationId === view.generationId
      && record.envelopeFingerprint === view.envelopeFingerprint && record.owner === view.owner && record.controllerFence === view.controllerFence
      && record.expiresAtEvent > this.events.cursor(view.missionId).sequence, "HOLD: current fixture controller unavailable", "auth"); return record;
  }
  private current(handle: FixtureAuthorityHandleV1, expected: GenerationViewV3) {
    const view = this.read(expected.missionId); invariant(canonical(view) === canonical(expected), "stale generation/head/ledger/inventory CAS");
    this.controller(handle, view); return { view, bound: this.origin(view.missionId) };
  }
  private advanceHead(view: GenerationViewV3): GenerationViewV3 {
    const revision = view.revision + 1, budgetLedgerRevision = view.budgetLedgerRevision + 1;
    integer(revision); integer(budgetLedgerRevision); integer(view.inventoryRevision + 1);
    const digest = this.ledger(view.rootAccountId), next = { ...view, revision, inventoryRevision: view.inventoryRevision + 1, budgetLedgerRevision, budgetLedgerDigest: digest };
    invariant(this.db.query("UPDATE g3_root SET revision=?,digest=? WHERE root_id=? AND revision=? AND digest=?").run(budgetLedgerRevision, digest, view.rootAccountId, view.budgetLedgerRevision, view.budgetLedgerDigest).changes === 1, "stale root CAS");
    this.controlCAS(view, next);
    return next;
  }
  private controlCAS(before: GenerationViewV3, after: GenerationViewV3): void {
    integer(before.revision); integer(after.revision); integer(before.candidateRevision); integer(after.candidateRevision);
    // Exact document includes h AND candidateRevision/pointer/barrier/owner/fences,
    // even when preparation intentionally keeps h unchanged. Not h-only CAS.
    invariant(this.db.query("UPDATE g3_head SET revision=?,document=?,digest=? WHERE mission=? AND revision=? AND document=? AND digest=?")
      .run(after.revision, canonical(after), fingerprint(after), before.missionId, before.revision, canonical(before), fingerprint(before)).changes === 1, "stale complete control head CAS");
  }
  private continueFamily(view: GenerationViewV3, lease: FamilyLeaseV3): void {
    if (view.controlMode === "RUNNING") { invariant(view.barrierRootId === null, "HOLD: control projection unknown"); return; }
    invariant(view.controlMode === "DRAIN_NEW_FAMILIES" && view.barrierRootId, "HOLD: paused/unknown execution control");
    const result = this.drainResult(view);
    const cut = result.engaged.value;
    invariant(cut.families.some(f => f.unit === lease.unitId && f.mission === lease.missionId && f.generation === lease.generationId
      && f.family_fence === lease.familyFence && f.controller_fence === lease.controllerFence && f.owner === lease.owner), "HOLD: family absent from immutable drain cut");
  }
  private drainResult(view: GenerationViewV3): DrainResultV1 {
    invariant(view.barrierRootId && view.controlMode === "DRAIN_NEW_FAMILIES", "HOLD: barrier/control projection mismatch");
    const row = this.db.query("SELECT document,digest FROM g3_authority WHERE record_ref=? AND kind='drain-result'").get(`drain:${view.barrierRootId}`) as { document: string; digest: string } | null;
    invariant(row && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: durable drain cut missing/corrupt");
    const result = JSON.parse(row.document) as DrainResultV1;
    const cut = readTransitionDocumentV1<DrainResultV1["engaged"]["value"]>(this.db, result.engaged.document.ref, true);
    const entry = readTransitionDocumentV1<typeof result.value>(this.db, result.document.ref, true);
    const inventory = readTransitionDocumentV1<typeof result.inventory.value>(this.db, result.inventory.document.ref, true);
    // T1-C/88: retained identity is bytes/ref, never transient handle identity.
    // Historical validation must NOT demand that a consumed case remain current:
    // later revocation cannot prevent Q/release or clear a committed barrier.
    const consumed = readTransitionDocumentV1<TransitionCaseV1>(this.db, result.authorizationRef, true);
    checkTransitionSourceV1(consumed);
    const preparation = readTransitionDocumentV1<PreparedTransitionValueV1>(this.db, consumed.preparationRef, true);
    invariant(consumed.version === "l8-fixture-transition-a-case-v1" && consumed.purpose === "request-drain"
      && canonical(consumed.candidateRef) === canonical(entry.candidateRef)
      && canonical(consumed.candidateRef) === canonical(preparation.candidateRef)
      && canonical(consumed.expectedHead) === canonical(preparation.headAfter)
      && consumed.expectedHead.revision === entry.headBefore && consumed.controllerFence === entry.controllerFence
      && consumed.owner === consumed.expectedHead.owner && consumed.controllerFence === consumed.expectedHead.controllerFence
      && canonical(consumed.observationRef) === canonical(preparation.observationRef)
      && canonical(consumed.counterRef) === canonical(preparation.preparationCounterRef)
      && canonical(entry.expectedT0Ref) === canonical(preparation.expectedT0Ref), "HOLD: consumed T1 authority/preparation immutable join mismatch");
    invariant(entry.barrierRootId === view.barrierRootId && entry.headAfter <= view.revision && canonical(entry.candidateRef) === canonical(view.candidateRef)
      && canonical(entry) === canonical(result.value) && canonical(cut) === canonical(result.engaged.value) && canonical(inventory) === canonical(result.inventory.value)
      && canonical(entry.engagedFamiliesRef) === canonical(result.engaged.document.ref) && canonical(entry.inventoryAtCutRef) === canonical(result.inventory.document.ref), "HOLD: barrier/entry/cut immutable join mismatch");
    const events = this.events.replay(view.missionId, [] as ReturnType<EventLog["read"]>, (state, event) => { state.push(event); return state; });
    const event = events.find(e => e.key === `drain:${view.barrierRootId}`);
    invariant(event && event.kind === "g3_drain_entered" && event.sequence === entry.eventSequence && canonical(event.payload) === canonical(result), "HOLD: durable T1 event/result mismatch");
    const candidate = this.db.query("SELECT state FROM g3_origins WHERE mission=? AND generation=?").get(view.missionId, entry.candidateRef.generationId) as { state: string } | null;
    invariant(candidate?.state === "PENDING_DRAIN", "HOLD: barrier candidate state mismatch");
    return detached(result);
  }
  private touch(view: GenerationViewV3, now: number, key: string, kind: string, payload: unknown, unit: string | null): void {
    integer(now); const after = this.advanceHead(view);
    this.events.append(view.missionId, key, kind, now, payload, unit, this.events.cursor(view.missionId).sequence);
    invariant(canonical(this.read(view.missionId)) === canonical(after), "HOLD: complete control postimage changed during append");
  }
  private resourceAcquisition(bound: ReadonlyData<BoundExecutionV1>, acquired: ResourceAcquisitionV1): void {
    const root = JSON.parse(bound.body.admissionSource.budgetLineage.rootLimits.utf8) as RootLimitsV1;
    const template = JSON.parse(root.executionTemplate.utf8) as GraphExecutionTemplate;
    invariant(acquired.maxConcurrent <= template.settings.maxConcurrent, "HOLD: acquisition concurrency exceeds root");
    for (const w of acquired.workers) {
      const original = template.workers.find(x => x.workerId === w.workerId);
      invariant(original && original.profile === w.profile && original.model === w.model && original.accountId === w.accountId, "HOLD: acquisition worker identity differs from root");
      for (const k of workerDimensions) invariant(w[k] <= original[k], "HOLD: acquired worker exceeds root");
    }
    for (const a of acquired.accounts) {
      const original = template.accounts.find(x => x.accountId === a.accountId); invariant(original, "HOLD: acquired account outside root");
      for (const k of accountDimensions) invariant(a[k] <= original[k], "HOLD: acquired account exceeds root");
    }
  }
  private resourceAssignment(view: GenerationViewV3, bound: ReadonlyData<BoundExecutionV1>, lease: FamilyLeaseV3, a: ResourceAssignmentV1, acquired: ResourceAcquisitionV1): void {
    this.resourceAcquisition(bound, acquired);
    const root = JSON.parse(bound.body.admissionSource.budgetLineage.rootLimits.utf8) as RootLimitsV1;
    invariant(root.rootModelBindings, "HOLD: root model bindings missing");
    const expectedWork = { fixtureId: acquired.poolScope.fixtureId, poolId: acquired.poolScope.poolId, missionId: view.missionId,
      generationId: view.generationId, rootAccountId: view.rootAccountId, unitId: lease.unitId, owner: view.owner,
      controllerFence: view.controllerFence, familyFence: lease.familyFence, sourceEnvelopeRef: bound.origin.document.ref,
      sourceTemplateRef: bound.body.admissionSource.executionTemplate.ref, sourcePlanningRef: bound.origin.envelope.planning.ref,
      sourceBindingsRef: root.rootModelBindings.ref };
    invariant(canonical(a.workScope) === canonical(expectedWork) && a.assignment.unitId === lease.unitId && a.assignment.familyLeaseKey === `family:${lease.unitId}`, "HOLD: exact resource work/fences/source refs required");
    const sub = bound.planning.units.find(u => u.unitId === lease.unitId)?.subIntents.find(s => s.subIntentId === a.subIntentId);
    invariant(sub && sub.role === a.role, "HOLD: resource sub-intent role mismatch");
    const requirement = bound.planning.sidecar.resourcesByUnit[lease.unitId];
    invariant(requirement, "HOLD: S1 unit resource requirement unknown"); checkResourceRequirementV1(requirement);
    invariant(canonical(requirement) === canonical(a.requirements), "HOLD: immutable S1 resource demand mismatch");
    const worker = bound.template.workers.find(w => w.workerId === a.assignment.workerId), acqWorker = acquired.workers.find(w => w.workerId === a.assignment.workerId);
    invariant(worker && acqWorker && worker.accountId === a.assignment.accountId && acqWorker.accountId === a.assignment.accountId
      && worker.profile === acqWorker.profile && worker.model === acqWorker.model && worker.profile === bound.template.settings.profiles[a.role]
      && requirement.profiles.includes(worker.profile) && requirement.accounts.includes(worker.accountId)
      && requirement.tools.every(t => worker.tools.includes(t)), "HOLD: fixed worker/profile/account/tools mismatch");
    const bindings = JSON.parse(root.rootModelBindings.utf8) as RootModelBindingsV1;
    const model = bindings.bindings.find(b => b.label === worker.model)?.model;
    invariant(model && canonical(model) === canonical(bound.sourceSpec.models[a.role])
      && requirement.models.some(label => { const ref = bindings.bindings.find(b => b.label === label)?.model; return ref && canonical(ref) === canonical(model); }), "HOLD: explicit model-label/role binding mismatch");
    const account = bound.template.accounts.find(a => a.accountId === worker.accountId), acqAccount = acquired.accounts.find(a => a.accountId === worker.accountId);
    invariant(account && acqAccount, "HOLD: current/acquired account missing");
    for (const k of workerDimensions) invariant(requirement[k] <= worker[k] && requirement[k] <= acqWorker[k], "HOLD: worker declaration/acquisition insufficient");
    for (const k of accountDimensions) invariant(requirement[k] <= account[k] && requirement[k] <= acqAccount[k], "HOLD: account declaration/acquisition insufficient");
  }
  private retainedAllocations(poolId: string): void {
    const inventory = this.resourceInventory(poolId);
    for (const allocation of inventory.active) {
      const source = readFixtureResourceSourceV1(this.db, allocation.assignmentRef), acquired = readFixtureResourceSourceV1(this.db, allocation.acquisitionRef);
      invariant(source.version === "l8-s2-resource-assignment-fixture-v1" && acquired.version === "l8-s2-resource-acquisition-fixture-v1", "HOLD: retained physical sources unavailable");
      const view = this.read(allocation.workScope.missionId), bound = this.origin(view.missionId), scope = allocation.workScope;
      invariant(scope.generationId === view.generationId && scope.owner === view.owner && scope.controllerFence === view.controllerFence, "HOLD: unexplained older physical work");
      const family = this.db.query("SELECT * FROM g3_families WHERE mission=? AND generation=? AND unit=?").get(scope.missionId, scope.generationId, scope.unitId) as FamilyRow | null;
      invariant(family?.state === "ACTIVE" && family.family_fence === scope.familyFence, "HOLD: old physical family unexplained");
      this.resourceAssignment(view, bound, { missionId: scope.missionId, generationId: scope.generationId, unitId: scope.unitId, owner: scope.owner,
        controllerFence: scope.controllerFence, familyFence: scope.familyFence, expiresAtEvent: family.expires_event, subIntents: [] }, source, acquired);
      invariant(canonical(allocation) === canonical(this.allocation(source, allocation.assignmentRef)), "HOLD: allocation/retained Assignment mismatch");
    }
  }
  private allocation(a: ResourceAssignmentV1, assignmentRef: ResourceAllocationV1["assignmentRef"]): ResourceAllocationV1 {
    return { allocationId: a.allocationId, executionId: a.executionId, subIntentId: a.subIntentId, role: a.role,
      workerId: a.assignment.workerId, accountId: a.assignment.accountId, workScope: a.workScope, requirements: a.requirements, assignmentRef, acquisitionRef: a.acquisitionRef };
  }
  installBootstrapA(handle: FixtureAuthorityHandleV1, origin: ReadonlyData<ParsedExecutionEnvelopeV1>, independent: IndependentlyLoadedSourcesV1, now: number, preparationGrant?: FixturePreparationHandleV1): GenerationViewV3 {
    assertExecutionJsonV1(origin); assertExecutionJsonV1(independent);
    const result = bindExecutionSourcesV1(origin, independent); invariant(result.ok, "S1 binding failed");
    const bound = result.value, e = bound.origin.envelope;
    invariant(e.authorizationKind === "bootstrap-a-fixture-v1" && e.mode === "offline-fixture-v1" && e.generation.ordinal === 0 && e.generation.parentGenerationId === null, "HOLD: only fresh bootstrap A supported");
    const run = makeGraphRunV3(bound.origin); invariant(run.ok, "run binding failed");
    const root = rootBudgetDataV3(bound), document = canonical({ origin: bound.origin, independent }), sourceDigest = fingerprint(JSON.parse(document));
    return this.db.transaction(() => {
      const auth = resolveFixtureAuthorityV1(this.db, handle); invariant(auth.kind === "controller", "bootstrap fixture controller required");
      const acquired = resolveFixturePreparationV1(this.db, preparationGrant), budget = auditPreparationCounterV1(this.db, this.events, root.rootAccountId);
      invariant(acquired.value.scope.missionId === e.missionId && acquired.value.scope.lineageId === e.generation.lineageId && acquired.value.scope.rootAccountId === root.rootAccountId
        && canonical(acquired.ref) === canonical(budget.value.grantRef) && canonical(acquired.value.sourceMissionRef) === canonical(e.sourceMissionSnapshot.ref)
        && canonical(acquired.value.rootLimitsRef) === canonical(e.admissionSource.budgetLineage.rootLimits.ref)
        && canonical(acquired.value.rootAllocationRef) === canonical(e.admissionSource.budgetLineage.rootAllocationRef), "HOLD: bootstrap origin grant source mismatch");
      const old = this.db.query("SELECT mission FROM g3_head").all();
      if (old.length) { const view = this.read(e.missionId); this.controller(handle, view); invariant(view.sourceDigest === sourceDigest, "bootstrap immutable identity changed"); this.origin(e.missionId); return view; }
      invariant(this.events.cursor(e.missionId).sequence === e.preparationObservationT0.observedEventSequence && e.preparationObservationT0.headRevision === 0
        && e.preparationObservationT0.controllerFence === auth.controllerFence, "stale bootstrap T0");
      invariant(e.preparationObservationT0.spentBySlot !== null && e.preparationObservationT0.spentBySlot.length === 0
        && e.preparationObservationT0.encumberedBySlot !== null && e.preparationObservationT0.encumberedBySlot.length === 0, "HOLD: bootstrap budget history must be known empty");
      invariant(!this.db.query("SELECT 1 FROM g3_origins UNION ALL SELECT 1 FROM g3_root UNION ALL SELECT 1 FROM g3_claims UNION ALL SELECT 1 FROM g3_outbox").get(), "bootstrap OWN not empty");
      const knowledge = JSON.parse(e.admissionSource.knowledgeSource.utf8) as { rootHash: string; ledgerRevision: number; ledgerDigest: string };
      const view: GenerationViewV3 = { version: "l8-graph-generation-head-v1", missionId: e.missionId, lineageId: e.generation.lineageId, generationId: bound.origin.generationId,
        envelopeFingerprint: e.fingerprint, sourceDigest, rootAccountId: root.rootAccountId, owner: auth.owner, controllerFence: auth.controllerFence,
        knowledgeRevision: bound.snapshot.knowledgeRevision, planFingerprint: bound.planning.plan.fingerprint,
        revision: 1, inventoryRevision: 0, budgetLedgerRevision: 0, budgetLedgerDigest: "", controlMode: "RUNNING",
        activeGenerationId: bound.origin.generationId, activePlanRevision: 1, candidateGenerationId: null, candidateRef: null, candidateRevision: 0, barrierRootId: null,
        sourceMissionRevision: bound.missionSnapshot.revision, knowledgeRootHash: knowledge.rootHash, knowledgeLedgerRevision: knowledge.ledgerRevision,
        knowledgeLedgerDigest: knowledge.ledgerDigest, preparationCounterRef: budget.document.ref };
      this.controller(handle, view);
      this.db.query("INSERT INTO g3_origins VALUES(?,?,?,?,?,?,'ACTIVE')").run(e.missionId, view.generationId, document, sourceDigest, run.value.document.utf8, canonical(e.preparationObservationT0));
      view.preparationCounterRef = commitPreparationCounterV1(this.db, budget, { candidateRef: { generationId: view.generationId, envelopeFingerprint: e.fingerprint,
        envelopeRef: bound.origin.document.ref, runRef: run.value.document.ref }, sourceDigest, commitKey: `bootstrap:${view.generationId}` });
      for (const unit of bound.planning.units) this.db.query("INSERT INTO g3_units VALUES(?,?,?,?,?,?,0)").run(e.missionId, view.generationId, unit.unitId, canonical(unit), fingerprint(unit), bound.planning.plan.selectedUnitIds.includes(unit.unitId) && unit.prerequisites.length === 0 ? "READY" : "BLOCKED");
      for (const grant of root.grants.grants) this.db.query("INSERT INTO g3_slots VALUES(?,?,0,'AUTHORIZED',?,?,?,NULL)").run(root.rootAccountId, rootSlotKeyV3(grant.slot), canonical(grant), grant.bodyCapUtf8Bytes, grant.reservedDebitUtf8Bytes);
      view.budgetLedgerDigest = this.ledger(root.rootAccountId);
      this.db.query("INSERT INTO g3_root VALUES(?,?,?,0,?,?,?,?)").run(root.rootAccountId, e.missionId, view.lineageId, root.limitsUtf8, root.grantsUtf8, root.modelsUtf8, view.budgetLedgerDigest);
      this.db.query("INSERT INTO g3_head VALUES(?,?,?,?,?)").run(e.missionId, view.lineageId, view.revision, canonical(view), fingerprint(view));
      this.events.append(e.missionId, `bootstrap:${view.generationId}`, "g3_bootstrap_fixture", now, view);
      this.controller(handle, view); resolveFixturePreparationV1(this.db, preparationGrant);
      invariant(canonical(this.read(view.missionId)) === canonical(view)
        && canonical(auditPreparationCounterV1(this.db, this.events, root.rootAccountId).document.ref) === canonical(view.preparationCounterRef), "HOLD: bootstrap postimage changed during append"); return detached(view);
    }).immediate();
  }
  private family(lease: FamilyLeaseV3, active: boolean): FamilyRow {
    const row = this.db.query("SELECT * FROM g3_families WHERE mission=? AND generation=? AND unit=?").get(lease.missionId, lease.generationId, lease.unitId) as FamilyRow | null;
    invariant(row && row.owner === lease.owner && row.controller_fence === lease.controllerFence && row.family_fence === lease.familyFence && row.expires_event === lease.expiresAtEvent && row.state === "ACTIVE", "stale family fence");
    if (active) invariant(row.expires_event > this.events.cursor(lease.missionId).sequence, "expired family is not executable"); return row;
  }
  private pointedChild(view: GenerationViewV3) {
    invariant(view.controlMode === "DRAIN_NEW_FAMILIES" && view.barrierRootId && view.candidateRef && view.candidateGenerationId, "HOLD: pointed draining A candidate required");
    this.drainResult(view);
    const row = this.db.query("SELECT document,digest,state FROM g3_origins WHERE mission=? AND generation=?").get(view.missionId, view.candidateGenerationId) as { document: string; digest: string; state: string } | null;
    invariant(row && row.state === "PENDING_DRAIN" && row.digest === fingerprint(JSON.parse(row.document)), "HOLD: pointed candidate unavailable");
    const retained = JSON.parse(row.document) as { origin: ParsedExecutionEnvelopeV1; independent: IndependentlyLoadedSourcesV1 };
    const binding = bindExecutionSourcesV1(retained.origin, retained.independent); invariant(binding.ok && binding.value.origin.envelope.authorizationKind === "transition-a-fixture-v1", "HOLD: final child A binding failed");
    const bound = binding.value, run = makeGraphRunV3(bound.origin); invariant(run.ok && canonical(run.value.document.ref) === canonical(view.candidateRef.runRef)
      && canonical(bound.origin.document.ref) === canonical(view.candidateRef.envelopeRef), "HOLD: final child/run pin mismatch");
    const parent = this.origin(view.missionId), childRoot = rootBudgetDataV3(bound), parentRoot = rootBudgetDataV3(parent);
    invariant(canonical(childRoot) === canonical(parentRoot) && canonical(bound.body.admissionSource.knowledgeSource) === canonical(parent.body.admissionSource.knowledgeSource)
      && canonical(bound.body.activationPolicy) === canonical(parent.body.activationPolicy) && bound.body.activationPolicy.maxActivationAttempts === 2,
      "HOLD: final acquired root/K/policy changed");
    return { bound, row, run: run.value };
  }
  private finalAsset(view: GenerationViewV3, child: ReturnType<GraphGenerationStoreV1["pointedChild"]>) {
    const port = finalHostV1(this.db), registry = finalDocumentV1(port.registry), budget = auditPreparationCounterV1(this.db, this.events, view.rootAccountId);
    const grant = assertFixturePreparationRefV1(this.db, budget.value.grantRef);
    invariant(registry.domain.universeId === grant.value.scope.fixtureId && registry.domain.rootAccountId === view.rootAccountId
      && registry.domain.missionId === view.missionId && registry.domain.lineageId === view.lineageId && registry.domain.owner === view.owner
      && canonical(registry.domain.originOwnershipRef) === canonical(grant.value.rootLineageOwnershipRef), "HOLD: final HOST/root/ownership differs from issued domain");
    const input = JSON.parse(child.bound.body.admissionSource.inputManifestSource.document.utf8) as { commonInputs: { path: string; sha256: string }[]; accessibleRules: string[] };
    const files = input.commonInputs.filter(f => f.sha256 === child.bound.body.activationPolicy.sourcePolicyRef.sha256);
    invariant(input.commonInputs.length === 1 && files.length === 1 && input.accessibleRules.includes(files[0]!.path), "HOLD: minimal final promised file set unsupported/incomplete");
    const asset = verifyPolicyAssetV1(port.asset, files[0]!.path, child.bound.body.activationPolicy.sourcePolicyRef, child.bound.body.admissionSource.inputManifestSource.document.ref);
    return { port, asset };
  }
  retainCandidateForActivation(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, now: number) {
    expected = detached(expected); integer(now);
    return this.db.transaction(() => {
      const { view } = this.current(controller, expected), child = this.pointedChild(view), file = this.finalAsset(view, child);
      const old = candidateStagingV1(this.db, view.candidateGenerationId!); if (old) { auditGenerationHistoryV1(this.db, this.events, view); return old; }
      invariant(!this.db.query("SELECT 1 FROM g3_families UNION ALL SELECT 1 FROM g3_outbox UNION ALL SELECT 1 FROM g3_claims").get(), "HOLD: minimal T2 has engaged/unexplained work");
      const value: CandidateStagingV1 = { version: "l8-candidate-staging-fixture-v1", candidateRef: view.candidateRef!, barrierRootId: view.barrierRootId!,
        unitIds: child.bound.planning.units.map(unit => unit.unitId), blobs: [child.bound.origin.document, child.run.document, child.bound.body.planning,
          child.bound.body.admissionSource.inputManifestSource.document, child.bound.body.admissionSource.knowledgeSource],
        policyReadbackRef: file.port.asset.readback!.ref, policyReadback: file.port.asset.readback!, rootLedgerDigest: view.budgetLedgerDigest, knowledgeRef: child.bound.body.admissionSource.knowledgeSource.ref };
      for (const unit of child.bound.planning.units) this.db.query("INSERT INTO g3_units VALUES(?,?,?,?,?,'STAGED',0)").run(view.missionId, view.candidateGenerationId!, unit.unitId, canonical(unit), fingerprint(unit));
      const document = putTransitionDocumentV1(this.db, value, "candidate-staging"), after = { ...view, inventoryRevision: view.inventoryRevision + 1 };
      this.controlCAS(view, after); initializeActivationCounterV1(this.db, view.rootAccountId, child.bound.body.activationPolicy.sourcePolicyRef, 2);
      this.events.append(view.missionId, `candidate-staging:${view.candidateGenerationId}`, "g3_candidate_staged", now, { document, value });
      this.controller(controller, this.read(view.missionId)); this.finalAsset(this.read(view.missionId), child); auditGenerationHistoryV1(this.db, this.events, after);
      invariant(canonical(this.read(view.missionId)) === canonical(after), "HOLD: staging complete control postimage changed during append");
      return detached({ document, value: readTransitionDocumentV1<CandidateStagingV1>(this.db, document.ref, true) });
    }).immediate();
  }
  activationAttempt(id: string) { return activationAttemptV1(this.db, id); }
  private validateFinalCase(view: GenerationViewV3, finalA: ReturnType<typeof currentFinalAV1>) {
    auditGenerationHistoryV1(this.db, this.events, view);
    const c = finalA.value, child = this.pointedChild(view), staged = candidateStagingV1(this.db, view.candidateGenerationId!);
    invariant(finalA.port.current!.revision === c.hostCurrentRevision, "HOLD: final HOST current revision stale");
    invariant(staged && canonical(staged.document.ref) === canonical(c.stagingRef) && canonical(c.expectedHead) === canonical(view)
      && canonical(c.candidateRef) === canonical(view.candidateRef) && c.barrierRootId === view.barrierRootId
      && canonical(c.drainEntryRef) === canonical(this.drainResult(view).document.ref), "HOLD: final case/preimage/candidate/T1 cut stale");
    this.finalAsset(view, child);
    invariant(finalA.port.snapshot, "HOLD: final inventory source unknown");
    invariant(canonical(finalDocumentV1(finalA.port.snapshot!).assetCurrent) === canonical(finalA.port.asset.current), "HOLD: final file source current revision changed");
    const snapshot = assertFinalOwnV1(this.db, this.events, finalA.port, view, c.candidateRef, c.stagingRef);
    invariant(canonical(finalA.port.snapshot!.ref) === canonical(c.finalInventoryRef) && canonical(snapshot.knowledgeRef) === canonical(child.bound.body.admissionSource.knowledgeSource.ref), "HOLD: final snapshot/knowledge source mismatch");
    const e = c.expectationsT2, slots = this.slots(view.missionId);
    invariant(e.headRevision === view.revision && e.activeGenerationId === view.generationId && e.activePlanRevision === view.activePlanRevision
      && e.sourceMissionRevision === view.sourceMissionRevision && e.controllerFence === view.controllerFence && e.familyFences.length === 0
      && e.knowledgeRevision === view.knowledgeRevision && e.knowledgeRootHash === view.knowledgeRootHash && e.knowledgeLedgerRevision === view.knowledgeLedgerRevision
      && e.knowledgeLedgerDigest === view.knowledgeLedgerDigest && e.inventoryRevision === view.inventoryRevision
      && e.inventoryDigest === c.finalInventoryRef.sha256 && canonical(e.inventoryRef) === canonical(c.finalInventoryRef)
      && e.budgetLedgerRevision === view.budgetLedgerRevision && e.budgetLedgerDigest === view.budgetLedgerDigest
      && canonical(e.spentBySlot) === canonical(slots.filter(s => ["SPENT", "BURNED"].includes(s.state)).map(s => ({ slotKey: s.slot_key, amount: s.debit })))
      && canonical(e.encumberedBySlot) === canonical(slots.filter(s => s.state === "ENCUMBERED").map(s => ({ slotKey: s.slot_key, amount: s.debit }))), "HOLD: full final T2 expectations stale");
    const authority = finalAuthorityFactsV1(this.db, this.events, finalA.port);
    invariant(canonical(e.authorityRecords) === canonical(authority.authorityRecords) && canonical(e.proofRecordRefs) === canonical(authority.proofRecordRefs)
      && canonical(e.releaseRecordRefs) === canonical(authority.releaseRecordRefs) && canonical(e.sourceCapabilityRecordRefs) === canonical(authority.sourceCapabilityRecordRefs)
      && canonical(c.sourceCapabilityRefs) === canonical(authority.sourceCapabilityRecordRefs), "HOLD: final proofs/releases/sourcecaps/current metadata incomplete");
    const stagedFile = finalDocumentV1(staged.value.policyReadback), currentFile = finalDocumentV1(finalA.port.asset.readback!);
    invariant(canonical(staged.value.policyReadbackRef) === canonical(staged.value.policyReadback.ref)
      && canonical(stagedFile.leaseRef) === canonical(currentFile.leaseRef) && canonical(stagedFile.identityRef) === canonical(currentFile.identityRef)
      && stagedFile.path === currentFile.path && stagedFile.utf8 === currentFile.utf8 && stagedFile.sha256 === currentFile.sha256 && stagedFile.byteLength === currentFile.byteLength
      && canonical(staged.value.candidateRef) === canonical(c.candidateRef)
      && staged.value.rootLedgerDigest === view.budgetLedgerDigest && canonical(staged.value.unitIds) === canonical(child.bound.planning.units.map(u => u.unitId)), "HOLD: critical staging changed/incomplete");
    invariant(canonical(staged.value.blobs) === canonical([child.bound.origin.document, child.run.document, child.bound.body.planning,
      child.bound.body.admissionSource.inputManifestSource.document, child.bound.body.admissionSource.knowledgeSource]), "HOLD: critical staged blob set/content mismatch");
    const childController = resolveFixtureAuthorityV1(this.db, this.authorityHandleForFinal(c.controllerChildRef));
    invariant(childController.kind === "controller" && childController.generationId === c.candidateRef.generationId
      && childController.envelopeFingerprint === c.candidateRef.envelopeFingerprint && childController.missionId === view.missionId
      && childController.owner === view.owner && childController.controllerFence === view.controllerFence, "HOLD: distinct child controller binding mismatch");
    return { child, staged, childController };
  }
  private authorityHandleForFinal(ref: string): FixtureAuthorityHandleV1 {
    return new FixtureTrustedAuthorityV1(this.db).resolve(ref);
  }
  appendActivationAttempt(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, authorization: FinalAHandleV1, now: number) {
    expected = detached(expected); integer(now);
    return this.db.transaction(() => {
      const { view } = this.current(controller, expected), finalA = currentFinalAV1(this.db, authorization);
      this.validateFinalCase(view, finalA); const receipt = appendAttemptV1(this.db, this.events, finalA, now);
      invariant(canonical(this.read(view.missionId)) === canonical(view), "HOLD: attempt append changed operational preimage");
      this.controller(controller, view); currentFinalAV1(this.db, authorization); this.validateFinalCase(view, finalA);
      invariant(canonical(activationCounterV1(this.db, view.rootAccountId).document.ref) === canonical(receipt.counterAfterRef), "HOLD: attempt counter postimage changed during append"); return receipt;
    }).immediate();
  }
  activateA(controller: FixtureAuthorityHandleV1, id: string, authorization: FinalAHandleV1, now: number): ActivationResultV1 {
    integer(now); return this.db.transaction(() => {
      const attempt = activationAttemptV1(this.db, id), actual = this.read(attempt.expectedHead.missionId), finalA = currentFinalAV1(this.db, authorization);
      this.controller(controller, actual);
      invariant(canonical(finalA.ref) === canonical(attempt.consumedCaseRef), "HOLD: different final-A case cannot claim retry");
      const committed = activationOutcomeV1(this.db, id);
      if (committed) { invariant(canonical(committed.headAfter) === canonical(actual), "HOLD: activation retry head identity changed"); return committed; }
      invariant(canonical(readTransitionDocumentV1<ActivationAttemptV1>(this.db, attempt.document.ref)) === canonical(attempt.value), "HOLD: current activation attempt revoked/changed");
      const counter = activationCounterV1(this.db, actual.rootAccountId);
      invariant(actual.controlMode !== "OPERATOR_PAUSED", "HOLD: operator pause forbids activation");
      invariant(canonical(counter.document.ref) === canonical(attempt.counterAfterRef), "HOLD: activation counter control postimage stale");
      const staleAssetCurrent = finalA.port.snapshot && canonical(finalDocumentV1(finalA.port.snapshot).assetCurrent) !== canonical(finalA.port.asset.current);
      if (canonical(actual) !== canonical(attempt.expectedHead) || staleAssetCurrent || finalA.port.current!.revision !== finalA.value.hostCurrentRevision) {
        const rejected = writeActivationOutcomeV1(this.db, this.events, { version: "l8-activation-outcome-fixture-v1",
          activationAttemptId: id, attemptRef: attempt.document.ref, consumedCaseRef: finalA.ref, outcome: "REJECTED",
          reason: canonical(actual) !== canonical(attempt.expectedHead) ? "STALE_CONTROL_PREIMAGE" : "STALE_FINAL_SOURCE_CURRENT", headBefore: actual, headAfter: actual, activationRecordRef: null }, now);
        this.controller(controller, actual); currentFinalAV1(this.db, authorization);
        invariant(canonical(this.read(actual.missionId)) === canonical(actual), "HOLD: rejected outcome changed control head"); return rejected;
      }
      const { child } = this.validateFinalCase(actual, finalA), oldSlots = this.slots(actual.missionId);
      invariant(this.db.query("UPDATE g3_origins SET state='RETIRED' WHERE mission=? AND generation=? AND state='ACTIVE'").run(actual.missionId, actual.generationId).changes === 1, "HOLD: old active state CAS lost");
      invariant(this.db.query("UPDATE g3_origins SET state='ACTIVE' WHERE mission=? AND generation=? AND state='PENDING_DRAIN'").run(actual.missionId, actual.candidateGenerationId!).changes === 1, "HOLD: child active state CAS lost");
      this.db.query("UPDATE g3_units SET state='RETIRED',revision=revision+1 WHERE mission=? AND generation=?").run(actual.missionId, actual.generationId);
      for (const unit of child.bound.planning.units) invariant(this.db.query("UPDATE g3_units SET state=?,revision=revision+1 WHERE mission=? AND generation=? AND unit=? AND state='STAGED'")
        .run(child.bound.planning.plan.selectedUnitIds.includes(unit.unitId) && unit.prerequisites.length === 0 ? "READY" : "BLOCKED", actual.missionId, actual.candidateGenerationId!, unit.unitId).changes === 1, "HOLD: staged unit state CAS lost");
      const after: GenerationViewV3 = { ...actual, generationId: actual.candidateGenerationId!, activeGenerationId: actual.candidateGenerationId!, envelopeFingerprint: actual.candidateRef!.envelopeFingerprint,
        sourceDigest: child.row.digest, planFingerprint: child.bound.planning.plan.fingerprint, activePlanRevision: actual.activePlanRevision + 1,
        revision: actual.revision + 1, candidateRevision: actual.candidateRevision + 1, inventoryRevision: actual.inventoryRevision + 1,
        candidateGenerationId: null, candidateRef: null, barrierRootId: null, controlMode: "RUNNING" };
      this.controlCAS(actual, after);
      const activation = putTransitionDocumentV1(this.db, { version: "l8-activation-record-fixture-v1", activationAttemptId: id, attemptRef: attempt.document.ref,
        consumedCaseRef: finalA.ref, headBefore: actual, headAfter: after, candidateRef: attempt.value.candidateRef, stagingRef: attempt.stagingRef,
        knowledgeRef: child.bound.body.admissionSource.knowledgeSource.ref, childEnvelopeRef: child.bound.origin.document.ref }, "activation-record");
      const eventBeforeCommit = this.events.cursor(actual.missionId).sequence;
      const result = writeActivationOutcomeV1(this.db, this.events, { version: "l8-activation-outcome-fixture-v1", activationAttemptId: id, attemptRef: attempt.document.ref,
        consumedCaseRef: finalA.ref, outcome: "COMMITTED", reason: "FINAL_A_QUIESCENT", headBefore: actual, headAfter: after, activationRecordRef: activation.ref }, now);
      this.controller(this.authorityHandleForFinal(attempt.controllerChildRef), this.read(actual.missionId));
      const parentRecord = resolveFixtureAuthorityV1(this.db, controller);
      invariant(parentRecord.kind === "controller" && this.events.cursor(actual.missionId).sequence <= parentRecord.expiresAtEvent, "HOLD: parent controller expired after T2 append");
      currentFinalAV1(this.db, authorization); this.finalAsset(after, { ...child });
      invariant(this.events.cursor(actual.missionId).sequence === eventBeforeCommit + 1 && finalA.port.current!.revision === finalA.value.hostCurrentRevision
        && canonical(finalA.port.snapshot!.ref) === canonical(attempt.inventoryRef)
        && canonical(finalDocumentV1(finalA.port.snapshot!).assetCurrent) === canonical(finalA.port.asset.current), "HOLD: T2 consumed source/journal changed during append");
      invariant(canonical(activationCounterV1(this.db, actual.rootAccountId).document.ref) === canonical(attempt.counterAfterRef), "HOLD: T2 activation counter postimage changed");
      invariant(canonical(this.slots(actual.missionId)) === canonical(oldSlots) && canonical(this.read(actual.missionId)) === canonical(after), "HOLD: T2 changed root slots/postimage");
      auditGenerationHistoryV1(this.db, this.events, after); return result;
    }).immediate();
  }
  prepareInitial(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, origin: ReadonlyData<ParsedExecutionEnvelopeV1>, independent: IndependentlyLoadedSourcesV1,
    grantHandle: FixturePreparationHandleV1, observationRef: ByteRef, now: number): PreparedTransitionV1 {
    expected = detached(expected); assertExecutionJsonV1(origin); assertExecutionJsonV1(independent); integer(now);
    const binding = bindExecutionSourcesV1(origin, independent); invariant(binding.ok, "HOLD: child S1 binding failed");
    const child = binding.value, envelope = child.origin.envelope, run = makeGraphRunV3(child.origin); invariant(run.ok, "HOLD: child run binding failed");
    invariant(envelope.authorizationKind === "transition-a-fixture-v1" && envelope.mode === "offline-fixture-v1", "HOLD: only initial transitionA fixture supported");
    const document = canonical({ origin: child.origin, independent }), sourceDigest = fingerprint(JSON.parse(document));
    return this.db.transaction(() => {
      const actual = this.read(expected.missionId); this.controller(controller, actual);
      const grant = resolveFixturePreparationV1(this.db, grantHandle), budget = auditPreparationCounterV1(this.db, this.events, actual.rootAccountId);
      invariant(canonical(grant.ref) === canonical(budget.value.grantRef) && grant.value.scope.missionId === actual.missionId
        && grant.value.scope.lineageId === actual.lineageId && grant.value.scope.rootAccountId === actual.rootAccountId, "HOLD: transition origin grant scope mismatch");
      const retained = this.db.query("SELECT document,digest FROM g3_authority WHERE record_ref=? AND kind='initial-preparation'").get(`initial:${child.origin.generationId}`) as { document: string; digest: string } | null;
      if (retained) {
        invariant(fingerprint(JSON.parse(retained.document)) === retained.digest, "HOLD: corrupt initial preparation index");
        const saved = JSON.parse(retained.document) as PreparedTransitionV1;
        const value = readTransitionDocumentV1<PreparedTransitionValueV1>(this.db, saved.document.ref, true);
        const row = this.db.query("SELECT document,digest FROM g3_origins WHERE mission=? AND generation=?").get(actual.missionId, child.origin.generationId) as { document: string; digest: string } | null;
        const committed = this.events.read(actual.missionId).find(e => e.key === `prepare:${child.origin.generationId}`);
        invariant(row?.document === document && row.digest === sourceDigest && canonical(value.observationRef) === canonical(observationRef)
          && canonical(value) === saved.document.utf8 && canonical(value.candidateRef) === canonical(saved.candidateRef)
          && committed?.kind === "g3_initial_prepared" && committed.sequence === value.eventAfter && canonical(committed.payload) === canonical(value)
          && (canonical(expected) === canonical(value.headBefore) || canonical(expected) === canonical(actual)), "HOLD: initial retry immutable identity changed");
        return detached(saved); // before capacity check; no re-charge even at ceiling
      }
      const { view, bound } = this.current(controller, expected);
      invariant(view.controlMode === "RUNNING" && view.barrierRootId === null && view.candidateRef === null && view.candidateGenerationId === null, "HOLD: initial candidate slot occupied/draining");
      invariant(budget.value.used < grant.value.ceiling, "HOLD: durable origin grant exhausted/reused");
      invariant(bound.origin.envelope.authorizationKind !== "proposal-b-host-fixture-v1" && envelope.missionId === view.missionId
        && envelope.generation.parentGenerationId === view.generationId && envelope.generation.ordinal === bound.origin.envelope.generation.ordinal + 1
        && envelope.generation.lineageId === view.lineageId && envelope.admissionSource.budgetLineage.rootAccountId === view.rootAccountId
        && canonical(independent.parentEnvelope) === canonical(bound.origin.document), "HOLD: actual active A parent/root/lineage required");
      const observation = readTransitionDocumentV1<TransitionObservationV1>(this.db, observationRef);
      assertObservationV1(observation, view, captureOperationalV1(this.db, this.events, view), this.events.cursor(view.missionId).sequence);
      invariant(canonical(observation.t0) === canonical(envelope.preparationObservationT0)
        && canonical(observation.parentOriginRef) === canonical(bound.origin.document.ref)
        && canonical(observation.sourceMissionRef) === canonical(envelope.sourceMissionSnapshot.ref)
        && canonical(observation.knowledgeRef) === canonical(envelope.admissionSource.knowledgeSource.ref), "HOLD: retained T0/source refs mismatch");
      const candidateRef: CandidateRefV1 = { generationId: child.origin.generationId, envelopeFingerprint: envelope.fingerprint, envelopeRef: child.origin.document.ref, runRef: run.value.document.ref };
      this.db.query("INSERT INTO g3_origins VALUES(?,?,?,?,?,?,'PREPARED')").run(view.missionId, candidateRef.generationId, document, sourceDigest, run.value.document.utf8, canonical(envelope.preparationObservationT0));
      const counterRef = commitPreparationCounterV1(this.db, budget, { candidateRef, sourceDigest, commitKey: `prepare:${candidateRef.generationId}` });
      const after: GenerationViewV3 = { ...view, candidateGenerationId: candidateRef.generationId, candidateRef, candidateRevision: view.candidateRevision + 1, preparationCounterRef: counterRef };
      const value: PreparedTransitionValueV1 = { version: "l8-fixture-initial-preparation-v1", candidateRef, observationRef,
        expectedT0Ref: putTransitionDocumentV1(this.db, { version: "l8-fixture-retained-t0-v1", t0: envelope.preparationObservationT0 }).ref,
        headBefore: view, headAfter: after, eventBefore: observation.eventSequence, eventAfter: observation.eventSequence + 1, preparationCounterRef: counterRef };
      integer(value.eventAfter);
      const prepared: PreparedTransitionV1 = { document: putTransitionDocumentV1(this.db, value, "initial-preparation-record"), candidateRef };
      this.db.query("INSERT INTO g3_authority VALUES(?,'initial-preparation',1,?,?,0)").run(`initial:${candidateRef.generationId}`, canonical(prepared), fingerprint(prepared));
      this.controlCAS(view, after);
      this.events.append(view.missionId, `prepare:${candidateRef.generationId}`, "g3_initial_prepared", now, value, null, observation.eventSequence);
      this.controller(controller, this.read(view.missionId)); resolveFixturePreparationV1(this.db, grantHandle);
      // T0-B/88: operational capture intentionally excludes transition sources.
      // Re-read THIS consumed observation after the real append, in the same TX.
      const observationAfter = readTransitionDocumentV1<TransitionObservationV1>(this.db, observationRef);
      invariant(observationAfter.version === "l8-fixture-transition-observation-v1" && canonical(observationAfter) === canonical(observation),
        "HOLD: consumed T0 observation identity/content changed during append");
      invariant(canonical(captureOperationalV1(this.db, this.events, view)) === canonical(observation.operational), "HOLD: T0 sources changed during commit");
      invariant(canonical(this.read(view.missionId)) === canonical(after)
        && canonical(auditPreparationCounterV1(this.db, this.events, view.rootAccountId).document.ref) === canonical(counterRef), "HOLD: preparation postimage changed during append"); return detached(prepared);
    }).immediate();
  }
  requestDrain(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, authorization: FixtureTransitionAHandleV1, now: number): DrainResultV1 {
    expected = detached(expected); integer(now);
    return this.db.transaction(() => {
      const actual = this.read(expected.missionId); this.controller(controller, actual);
      const source = resolveFixtureTransitionAV1(this.db, authorization), c = source.value;
      const indexed = this.db.query("SELECT document,digest FROM g3_authority WHERE record_ref=? AND kind='initial-preparation'").get(`initial:${c.candidateRef.generationId}`) as { document: string; digest: string } | null;
      invariant(indexed && indexed.digest === fingerprint(JSON.parse(indexed.document)), "HOLD: actual prepared candidate required");
      const prepared = JSON.parse(indexed.document) as PreparedTransitionV1;
      const p = readTransitionDocumentV1<PreparedTransitionValueV1>(this.db, prepared.document.ref, true);
      invariant(canonical(prepared.document.ref) === canonical(c.preparationRef) && canonical(prepared.candidateRef) === canonical(c.candidateRef)
        && canonical(p.observationRef) === canonical(c.observationRef) && c.owner === actual.owner && c.controllerFence === actual.controllerFence, "HOLD: transitionA case/candidate/source/owner mismatch");
      if (actual.barrierRootId) {
        const saved = this.drainResult(actual);
        invariant(canonical(saved.value.candidateRef) === canonical(c.candidateRef) && canonical(expected) === canonical(p.headAfter)
          && canonical(c.expectedHead) === canonical(p.headAfter) && canonical(saved.authorizationRef) === canonical(source.ref), "HOLD: changed drain retry"); return detached(saved);
      }
      const { view, bound } = this.current(controller, expected);
      invariant(view.controlMode === "RUNNING" && canonical(view) === canonical(p.headAfter) && canonical(c.expectedHead) === canonical(p.headAfter)
        && canonical(view.candidateRef) === canonical(c.candidateRef) && view.candidateGenerationId === c.candidateRef.generationId, "HOLD: exact preparation postimage/T0 stale");
      const budget = auditPreparationCounterV1(this.db, this.events, view.rootAccountId);
      invariant(canonical(budget.document.ref) === canonical(c.counterRef) && canonical(c.counterRef) === canonical(p.preparationCounterRef), "HOLD: post-preparation counter changed");
      const grant = assertFixturePreparationRefV1(this.db, budget.value.grantRef).value;
      invariant(grant.version === "l8-fixture-origin-grant-v1" && grant.scope.missionId === view.missionId && grant.scope.lineageId === view.lineageId && grant.scope.rootAccountId === view.rootAccountId, "HOLD: current origin grant unavailable");
      const observation = readTransitionDocumentV1<TransitionObservationV1>(this.db, c.observationRef), operational = captureOperationalV1(this.db, this.events, view);
      // T0 remains historical: only our one recorded prepare event is explained.
      invariant(this.events.cursor(view.missionId).sequence === p.eventAfter && canonical(observation.operational) === canonical(operational)
        && canonical(observation.expectedHead) === canonical(p.headBefore), "HOLD: T0 inventory/source/event cut stale");
      const ownPrepare = this.events.read(view.missionId).find(e => e.key === `prepare:${c.candidateRef.generationId}`);
      invariant(ownPrepare && ownPrepare.sequence === p.eventAfter && canonical(ownPrepare.payload) === canonical(p), "HOLD: own preparation event mismatch");
      const candidate = this.db.query("SELECT document,digest,state FROM g3_origins WHERE mission=? AND generation=?").get(view.missionId, c.candidateRef.generationId) as { document: string; digest: string; state: string } | null;
      invariant(candidate?.state === "PREPARED" && fingerprint(JSON.parse(candidate.document)) === candidate.digest, "HOLD: prepared origin unavailable/corrupt");
      const child = JSON.parse(candidate.document) as { origin: ParsedExecutionEnvelopeV1; independent: IndependentlyLoadedSourcesV1 };
      const binding = bindExecutionSourcesV1(child.origin, child.independent); invariant(binding.ok && child.origin.envelope.authorizationKind === "transition-a-fixture-v1"
        && canonical(child.origin.document.ref) === canonical(c.candidateRef.envelopeRef) && child.origin.envelope.generation.parentGenerationId === view.generationId, "HOLD: current child source binding failed");
      const activeRun = makeGraphRunV3(bound.origin); invariant(activeRun.ok, "HOLD: active run unavailable");
      const unitRows = operational.units as { unit: string; document: string; digest: string }[];
      invariant(unitRows.length === bound.planning.units.length && unitRows.every(row => {
        const unit = bound.planning.units.find(u => u.unitId === row.unit);
        return unit && row.document === canonical(unit) && row.digest === fingerprint(unit);
      }), "HOLD: complete origin unit inventory/source mismatch");
      const families = (operational.families as (FamilyRow & Record<string, unknown>)[]).filter(f => f.state === "ACTIVE").map(f => {
        const unit = bound.planning.units.find(u => u.unitId === f.unit); invariant(unit && f.owner === view.owner && f.controller_fence === view.controllerFence, "HOLD: engaged family unexplained");
        const unitDoc = putTransitionDocumentV1(this.db, { version: "l8-fixture-drain-origin-unit-v1", unit });
        return { ...f, originRef: bound.origin.document.ref, runRef: activeRun.value.document.ref, planningRef: bound.origin.envelope.planning.ref,
          unitRef: unitDoc.ref, lease: { missionId: f.mission, generationId: f.generation, unitId: f.unit, owner: f.owner, controllerFence: f.controller_fence,
            familyFence: f.family_fence, expiresAtEvent: f.expires_event, subIntents: unit.subIntents } };
      });
      for (const claim of operational.claims as { resource_key: string; unit: string; family_fence: number }[]) {
        const family = families.find(f => f.unit === claim.unit && f.family_fence === claim.family_fence);
        invariant(family, "HOLD: claim without engaged family/source");
        const unit = bound.planning.units.find(u => u.unitId === claim.unit)!;
        invariant(claim.resource_key.startsWith("resource-worker:") || unit.ownedFunctionIds.some(id => claim.resource_key === `fn:${id}`)
          || unit.conflicts.some(conflict => conflict.resourceKey === claim.resource_key), "HOLD: unexplained scientific claim");
      }
      for (const row of operational.outboxes as OutboxRow[]) {
        this.outbox(row.execution_id);
        invariant((operational.families as FamilyRow[]).some(f => f.unit === row.unit && f.family_fence === row.family_fence
          && (f.state === "ACTIVE" || ["TERMINAL", "REJECTED"].includes(row.state))), "HOLD: execution/family inventory unexplained");
      }
      const engagedValue = { version: "l8-fixture-engaged-families-v1", originRef: bound.origin.document.ref, families };
      const engagedDocument = putTransitionDocumentV1(this.db, engagedValue, "drain-cut");
      const inventoryValue = { version: "l8-fixture-inventory-at-t1-v1", ...operational }, inventoryDocument = putTransitionDocumentV1(this.db, inventoryValue, "drain-cut");
      const barrierRootId = `barrier:${fingerprint({ candidateRef: c.candidateRef, head: view, engagedRef: engagedDocument.ref, inventoryRef: inventoryDocument.ref })}`;
      const value = { version: "l8-drain-entry-v1" as const, barrierRootId, candidateRef: c.candidateRef, expectedT0Ref: p.expectedT0Ref,
        headBefore: view.revision, headAfter: view.revision + 1, controllerFence: view.controllerFence, engagedFamiliesRef: engagedDocument.ref,
        inventoryAtCutRef: inventoryDocument.ref, eventSequence: p.eventAfter + 1 };
      integer(value.headAfter); integer(value.eventSequence);
      const result: DrainResultV1 = { authorizationRef: source.ref, document: putTransitionDocumentV1(this.db, value, "drain-entry"), value,
        engaged: { document: engagedDocument, value: engagedValue }, inventory: { document: inventoryDocument, value: inventoryValue } };
      this.db.query("INSERT INTO g3_authority VALUES(?,'drain-result',1,?,?,0)").run(`drain:${barrierRootId}`, canonical(result), fingerprint(result));
      invariant(this.db.query("UPDATE g3_origins SET state='PENDING_DRAIN' WHERE mission=? AND generation=? AND state='PREPARED'").run(view.missionId, c.candidateRef.generationId).changes === 1, "HOLD: candidate state CAS lost");
      const after: GenerationViewV3 = { ...view, revision: view.revision + 1, candidateRevision: view.candidateRevision + 1, barrierRootId, controlMode: "DRAIN_NEW_FAMILIES" };
      this.controlCAS(view, after);
      this.events.append(view.missionId, `drain:${barrierRootId}`, "g3_drain_entered", now, result, null, p.eventAfter);
      this.controller(controller, this.read(view.missionId)); resolveFixtureTransitionAV1(this.db, authorization);
      assertFixturePreparationRefV1(this.db, budget.value.grantRef); readTransitionDocumentV1<TransitionObservationV1>(this.db, c.observationRef);
      this.origin(view.missionId);
      invariant(canonical(this.read(view.missionId)) === canonical(after)
        && canonical(auditPreparationCounterV1(this.db, this.events, view.rootAccountId).document.ref) === canonical(budget.document.ref), "HOLD: T1 postimage changed during append");
      this.drainResult(after);
      invariant(canonical(captureOperationalV1(this.db, this.events, view)) === canonical(operational), "HOLD: source/cut changed during T1 commit"); return detached(result);
    }).immediate();
  }
  reserveFamily(handle: FixtureAuthorityHandleV1, expected: GenerationViewV3, unitId: string, ttlEvents: number, now: number, acquisition?: FixtureResourceAcquisitionHandleV1): FamilyLeaseV3 {
    expected = detached(expected); integer(ttlEvents, 2); invariant(ttlEvents <= 10000, "family TTL bound");
    return this.db.transaction(() => {
      const { view, bound } = this.current(handle, expected), unit = bound.planning.units.find(u => u.unitId === unitId);
      invariant(view.controlMode === "RUNNING" && view.barrierRootId === null, "HOLD: durable drain blocks new families"); integer(view.candidateRevision);
      invariant(unit && bound.planning.plan.selectedUnitIds.includes(unitId) && unit.prerequisites.length === 0, "HOLD: unselected unit or prerequisite publication unavailable");
      const resource = resolveFixtureResourceAcquisitionV1(this.db, acquisition);
      this.resourceAcquisition(bound, resource.acquisition); this.retainedAllocations(resource.acquisition.poolScope.poolId);
      const requirement = bound.planning.sidecar.resourcesByUnit[unitId];
      invariant(requirement, "HOLD: S1 resourcesByUnit unknown"); checkResourceRequirementV1(requirement);
      const stored = this.db.query("SELECT document,digest,state FROM g3_units WHERE mission=? AND generation=? AND unit=?").get(view.missionId, view.generationId, unitId) as { document: string; digest: string; state: string } | null;
      invariant(stored?.state === "READY" && stored.document === canonical(unit) && stored.digest === fingerprint(unit), "unit not READY/exact source");
      const grants = rootBudgetDataV3(bound).grants.grants;
      const slots = unit.subIntents.map(sub => {
        const grant = grants.find(g => g.functionId === sub.functionId && g.slot.role === sub.role && canonical(g.slot.functionIdentity) === canonical(sub.harnessIdentity));
        invariant(grant, "missing acquired root grant");
        const row = this.db.query("SELECT * FROM g3_slots WHERE root_id=? AND slot_key=?").get(view.rootAccountId, rootSlotKeyV3(grant.slot)) as SlotRow | null;
        invariant(row?.state === "AUTHORIZED" && row.grant_ref === canonical(grant) && row.cap === grant.bodyCapUtf8Bytes && row.debit === grant.reservedDebitUtf8Bytes, "spent/encumbered/changed root slot"); return row;
      });
      invariant(new Set(slots.map(s => s.slot_key)).size === slots.length, "duplicate family entitlement"); safeRootSumV3(slots.map(s => s.debit));
      const fence = this.db.query("SELECT token FROM g3_fence WHERE singleton=1").get() as { token: number }; integer(fence.token + 1, 1);
      invariant(this.db.query("UPDATE g3_fence SET token=? WHERE singleton=1 AND token=?").run(fence.token + 1, fence.token).changes === 1, "stale family allocator");
      const expiresAtEvent = this.events.cursor(view.missionId).sequence + 1 + ttlEvents; integer(expiresAtEvent);
      const lease: FamilyLeaseV3 = { missionId: view.missionId, generationId: view.generationId, unitId, owner: view.owner, controllerFence: view.controllerFence, familyFence: fence.token + 1, expiresAtEvent, subIntents: unit.subIntents };
      this.db.query("INSERT INTO g3_families VALUES(?,?,?,?,?,?,?,'ACTIVE')").run(view.missionId, view.generationId, unitId, view.owner, view.controllerFence, lease.familyFence, expiresAtEvent);
      for (const key of new Set([...unit.ownedFunctionIds.map(id => `fn:${id}`), ...unit.conflicts.map(c => c.resourceKey)])) {
        invariant(!key.startsWith("resource-worker:"), "HOLD: scientific conflict uses physical namespace");
        this.db.query("INSERT INTO g3_claims VALUES(?,?,?,?,?)").run(key, view.missionId, view.generationId, unitId, lease.familyFence);
      }
      for (const slot of slots) invariant(this.db.query("UPDATE g3_slots SET state='ENCUMBERED',revision=revision+1 WHERE root_id=? AND slot_key=? AND state='AUTHORIZED'").run(view.rootAccountId, slot.slot_key).changes === 1, "slot CAS lost");
      this.db.query("UPDATE g3_units SET state='RESERVED',revision=revision+1 WHERE mission=? AND generation=? AND unit=? AND state='READY'").run(view.missionId, view.generationId, unitId);
      this.touch(view, now, `family:${lease.familyFence}`, "g3_family_reserved", lease, unitId);
      this.controller(handle, this.read(view.missionId)); this.family(lease, true); return detached(lease);
    }).immediate();
  }
  prepareAdmissionV3(handle: FixtureAuthorityHandleV1, expected: GenerationViewV3, lease: FamilyLeaseV3, supplied: unknown, now: number, resourceWitness?: FixtureResourceWitnessV1): PreparedAdmissionV3 {
    expected = detached(expected); lease = detached(lease); const image = captureAdmissionImageV3(supplied);
    const body = JSON.parse(image.admissionUtf8) as { subIntentId: string; role: string; executionId: string; attemptId: string; idempotencyKey: string; command: unknown };
    return this.db.transaction(() => {
      const { view, bound } = this.current(handle, expected); this.continueFamily(view, lease); this.family(lease, true);
      invariant(lease.missionId === view.missionId && lease.generationId === view.generationId && lease.controllerFence === view.controllerFence && lease.owner === view.owner, "foreign family generation/controller");
      const unit = bound.planning.units.find(u => u.unitId === lease.unitId), sub = unit?.subIntents.find(s => s.subIntentId === body.subIntentId);
      invariant(unit && sub && sub.role === body.role && body.idempotencyKey === body.executionId, "exact sub-intent/admission identity required");
      const grant = rootBudgetDataV3(bound).grants.grants.find(g => g.functionId === sub.functionId && g.slot.role === sub.role && canonical(g.slot.functionIdentity) === canonical(sub.harnessIdentity));
      invariant(grant, "exact acquired grant missing");
      const role = sub.role;
      invariant(role === "A" || role === "B" || role === "R", "HOLD: unsupported fixture role");
      // Parent contract70: administrative DATA fixture, NOT an agent InputBundle,
      // blind-safe dossier, scientific prompt or OpenCode/RPC submission. ALL
      // expected content comes from the persisted S1 origin rebound by current(),
      // never from a caller's command/hash or a v1/v2 adapter reconstruction.
      const expectedCommand = {
        version: "l8-s2-bound-fixture-command-v1",
        scope: { missionId: view.missionId, generationId: view.generationId, rootAccountId: view.rootAccountId,
          unitId: unit.unitId, subIntentId: sub.subIntentId, role },
        functionIdentity: grant.slot.functionIdentity,
        profile: bound.template.settings.profiles[role], model: bound.sourceSpec.models[role],
        sourceEnvelope: bound.origin.document,
      };
      // Exhaustive equality closes unknown fields AND every source/ref/UTF-8 byte
      // in the retained document. This gate precedes even the BURNED path.
      invariant(canonical(body.command) === canonical(expectedCommand), "HOLD: bound fixture command mismatch");
      const resource = resolveFixtureResourceWitnessV1(this.db, resourceWitness, false);
      this.resourceAssignment(view, bound, lease, resource.assignment, resource.acquisition);
      invariant(resource.assignment.executionId === body.executionId && resource.assignment.subIntentId === sub.subIntentId && resource.assignment.role === role, "HOLD: fixed resource execution mismatch");
      invariant(sub.waitsForSubIntentIds.length === 0, "HOLD: attributable scientific predecessor results unavailable");
      const key = rootSlotKeyV3(grant.slot), slot = this.db.query("SELECT * FROM g3_slots WHERE root_id=? AND slot_key=?").get(view.rootAccountId, key) as SlotRow | null;
      invariant(slot && slot.grant_ref === canonical(grant) && slot.cap === grant.bodyCapUtf8Bytes && slot.debit === grant.reservedDebitUtf8Bytes, "immutable grant changed");
      const cap = bound.planning.sidecar.admissionBudget?.byUnit[unit.unitId]?.admissionCapUtf8Bytes;
      invariant(cap?.known === true && cap.value !== null, "HOLD: current admission cap unknown");
      const comparison = checkAdmissionBodyCapsV3(image, cap.value, slot.cap);
      invariant(cap.value <= slot.cap, "current cap cannot exceed acquired grant");
      const result: PreparedAdmissionV3 = { status: comparison.fits ? "PREPARED" : "BURNED", generationId: view.generationId, unitId: unit.unitId,
        subIntentId: sub.subIntentId, executionId: body.executionId, attemptId: body.attemptId, image, cap: cap.value, reservedDebit: slot.debit,
        maxAttempts: bound.template.settings.maxAdmissionAttempts, retryDelayMs: bound.template.settings.retryDelayMs, grantRef: slot.grant_ref,
        resourceSources: { acquisitionRef: resource.acquisitionRef, assignmentRef: resource.assignmentRef, remainingRef: resource.remainingRef } };
      if (slot.claim_utf8) {
        invariant(["SPENT", "BURNED"].includes(slot.state) && slot.claim_utf8 === canonical(result), "spent slot body/ID/generation/policy changed");
        if (slot.state === "SPENT") {
          const persisted = this.outbox(body.executionId);
          invariant(persisted.admission_utf8 === image.admissionUtf8 && persisted.mission === view.missionId && persisted.generation === view.generationId
            && persisted.unit === unit.unitId && persisted.sub_intent === sub.subIntentId && persisted.family_fence === lease.familyFence
            && persisted.controller_fence === view.controllerFence && persisted.max_attempts === result.maxAttempts && persisted.retry_delay === result.retryDelayMs, "retry durable identity changed");
        } else invariant(!this.db.query("SELECT 1 FROM g3_outbox WHERE execution_id=?").get(body.executionId), "burned slot has an outbox effect");
        const inventory = this.resourceInventory(resource.acquisition.poolScope.poolId);
        if (slot.state === "SPENT") invariant(inventory.allocations.some(a => a.executionId === body.executionId && canonical(a) === canonical(this.allocation(resource.assignment, resource.assignmentRef))), "HOLD: retained allocation/source changed");
        else invariant(!inventory.allocations.some(a => a.executionId === body.executionId), "HOLD: BURNED has phantom physical allocation");
        return detached(JSON.parse(slot.claim_utf8) as PreparedAdmissionV3);
      }
      invariant(slot.state === "ENCUMBERED", "family entitlement not encumbered");
      const previous = this.db.query("SELECT claim_utf8 FROM g3_slots WHERE claim_utf8 IS NOT NULL").all() as { claim_utf8: string }[];
      invariant(!previous.some(r => (JSON.parse(r.claim_utf8) as PreparedAdmissionV3).executionId === body.executionId), "execution ID already claimed in OWN");
      this.retainedAllocations(resource.acquisition.poolScope.poolId);
      if (comparison.fits) {
        const current = resolveFixtureResourceWitnessV1(this.db, resourceWitness, true);
        const inventory = assertResourceSnapshotV1(this.db, this.events, current.acquisition, current.remaining);
        const a = current.assignment, worker = current.remaining.workers.find(w => w.workerId === a.assignment.workerId), account = current.remaining.accounts.find(c => c.accountId === a.assignment.accountId);
        invariant(worker?.available === true && worker.occupiedBy === null && bound.template.workers.find(w => w.workerId === worker.workerId)?.available === true
          && !inventory.active.some(x => x.workerId === worker.workerId), "HOLD: worker unavailable/exclusive occupation");
        invariant(account, "HOLD: observed account missing");
        for (const k of workerDimensions) invariant(worker[k] !== null && a.requirements[k] <= worker[k]!, "HOLD: worker remaining unknown/insufficient");
        for (const k of accountDimensions) invariant(account[k] !== null && a.requirements[k] <= account[k]!, "HOLD: account remaining unknown/insufficient");
        const root = JSON.parse(bound.body.admissionSource.budgetLineage.rootLimits.utf8) as RootLimitsV1;
        const rootTemplate = JSON.parse(root.executionTemplate.utf8) as GraphExecutionTemplate;
        invariant(current.remaining.maxConcurrentRemaining !== null && current.remaining.maxConcurrentRemaining >= 1
          && inventory.active.length + 1 <= current.acquisition.maxConcurrent && inventory.active.length + 1 <= bound.template.settings.maxConcurrent
          && inventory.active.length + 1 <= rootTemplate.settings.maxConcurrent, "HOLD: physical concurrency unknown/exhausted");
        // The account's current declared ceiling also applies to the GLOBAL set.
        const declared = bound.template.accounts.find(x => x.accountId === a.assignment.accountId)!;
        for (const k of accountDimensions) invariant(safeRootSumV3([...inventory.active.filter(x => x.accountId === declared.accountId).map(x => x.requirements[k]), a.requirements[k]]) <= declared[k], "HOLD: shared account current ceiling exceeded");
      }
      const physicalBefore = this.resourceInventory(resource.acquisition.poolScope.poolId);
      invariant(this.db.query("UPDATE g3_slots SET state=?,revision=revision+1,claim_utf8=? WHERE root_id=? AND slot_key=? AND state='ENCUMBERED' AND claim_utf8 IS NULL").run(comparison.fits ? "SPENT" : "BURNED", canonical(result), view.rootAccountId, key).changes === 1, "slot spend CAS lost");
      if (comparison.fits) this.db.query("INSERT INTO g3_outbox VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'PREPARED',0,?,?,NULL,NULL)").run(body.executionId, view.missionId, view.generationId, unit.unitId, sub.subIntentId, view.rootAccountId, key, view.controllerFence, lease.familyFence, image.admissionUtf8, image.commandUtf8, image.admissionRawSha256, image.commandRawSha256, image.requestDigest, result.maxAttempts, result.retryDelayMs);
      if (comparison.fits) {
        const pool = resource.acquisition.poolScope;
        // Capture was made before inserting the new pin; no unknown/legacy
        // bypass flag and no intermediate incomplete projection is consumed.
        const inventory = physicalBefore, allocation = this.allocation(resource.assignment, resource.assignmentRef);
        invariant(!inventory.allocations.some(a => a.allocationId === allocation.allocationId || a.executionId === allocation.executionId), "HOLD: allocation identity reused");
        this.db.query("INSERT INTO g3_claims VALUES(?,?,?,?,?)").run(resourceWorkerKeyV1(pool, allocation.workerId), view.missionId, view.generationId, lease.unitId, lease.familyFence);
        const mutation: ResourceMutationV1 = { version: "l8-s2-resource-mutation-fixture-v1", poolId: pool.poolId,
          poolScope: pool, poolRevision: inventory.poolRevision + 1, allocation, proofDigest: null };
        advanceFixtureResourcePoolV1(this.db, pool.poolId, inventory.poolRevision);
        this.events.append(view.missionId, `resource:allocate:${allocation.allocationId}`, "g3_resource_allocated", now, mutation, lease.unitId, this.events.cursor(view.missionId).sequence);
      }
      this.touch(view, now, `admission:${view.rootAccountId}:${key}`, comparison.fits ? "g3_admission_prepared" : "g3_slot_burned", result, unit.unitId);
      this.controller(handle, this.read(view.missionId)); this.family(lease, true);
      resolveFixtureResourceWitnessV1(this.db, resourceWitness, false); this.resourceInventory(resource.acquisition.poolScope.poolId);
      return detached(result);
    }).immediate();
  }
  private observation(handle: FixtureAuthorityHandleV1, lease: FamilyLeaseV3): FixtureObservationRecordV1 {
    const record = resolveFixtureAuthorityV1(this.db, handle);
    invariant(record.kind === "observation" && record.missionId === lease.missionId && record.generationId === lease.generationId, "foreign fixture observation"); return record;
  }
  private outbox(id: string): OutboxRow { const row = this.db.query("SELECT * FROM g3_outbox WHERE execution_id=?").get(id) as OutboxRow | null; invariant(row, "unknown execution");
    const image = captureAdmissionImageV3(JSON.parse(row.admission_utf8));
    invariant(image.admissionUtf8 === row.admission_utf8 && image.commandUtf8 === row.command_utf8 && image.admissionRawSha256 === row.raw_sha && image.commandRawSha256 === row.command_sha && image.requestDigest === row.request_digest, "outbox image corruption"); return row;
  }
  reconcileAdmissionV3(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, lease: FamilyLeaseV3, observation: FixtureAuthorityHandleV1, now: number): void {
    this.observe(controller, expected, lease, observation, now, false);
  }
  proveTerminalV3(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, lease: FamilyLeaseV3, proof: FixtureAuthorityHandleV1, now: number): void {
    this.observe(controller, expected, lease, proof, now, true);
  }
  private observe(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, lease: FamilyLeaseV3, handle: FixtureAuthorityHandleV1, now: number, terminal: boolean): void {
    expected = detached(expected); lease = detached(lease);
    this.db.transaction(() => {
      const { view } = this.current(controller, expected), proof = this.observation(handle, lease), row = this.outbox(proof.executionId);
      invariant(row.mission === view.missionId && row.generation === view.generationId && row.unit === lease.unitId && row.request_digest === proof.requestDigest, "observation exact body/generation scope");
      const key = `observation:${terminal ? "terminal" : "admission"}:${fingerprint(proof)}`;
      if (this.events.read(view.missionId).some(e => e.key === key)) return;
      const family = this.db.query("SELECT * FROM g3_families WHERE mission=? AND generation=? AND unit=?").get(lease.missionId, lease.generationId, lease.unitId) as FamilyRow | null;
      const exact = family?.state === "ACTIVE" && proof.envelopeFingerprint === view.envelopeFingerprint && proof.owner === view.owner && proof.controllerFence === view.controllerFence
        && proof.controllerFence === row.controller_fence && proof.familyFence === row.family_fence && proof.familyFence === family.family_fence && lease.familyFence === family.family_fence;
      let effect = "audit_only";
      if (exact && terminal) {
        invariant(proof.quiescent && proof.attempt === row.attempt, "Q requires exact attempt and positive quiescence");
        if (proof.state === "absent" && row.attempt === 0 && row.state === "PREPARED" && !row.receipt) effect = "TERMINAL";
        else if (["completed", "stopped", "failed"].includes(proof.state) && row.receipt && row.attempt > 0 && row.state === "ACCEPTED") {
          const receipt = JSON.parse(row.receipt) as FixtureObservationRecordV1;
          assertFixtureRecordCurrentV1(this.db, receipt);
          invariant(receipt.state === "accepted" && receipt.executionId === proof.executionId && receipt.requestDigest === proof.requestDigest && receipt.attempt === proof.attempt && receipt.familyFence === proof.familyFence && receipt.controllerFence === proof.controllerFence, "Q receipt binding"); effect = "TERMINAL";
        } else if (proof.state === "rejected" && row.attempt > 0 && !row.receipt && ["AMBIGUOUS", "PREPARED"].includes(row.state)) effect = "REJECTED";
        // Attempted absence/unknown never establishes Q or reopens a retry.
        if (effect !== "audit_only") this.db.query("UPDATE g3_outbox SET state=?,terminal_proof=? WHERE execution_id=?").run(effect, canonical(proof), row.execution_id);
      } else if (exact && !terminal && family.expires_event > this.events.cursor(view.missionId).sequence) {
        invariant(proof.attempt >= 1 && proof.attempt <= row.max_attempts && proof.attempt === (row.attempt || 1), "fixture sending attempt binding");
        if (proof.state === "accepted" && ["PREPARED", "AMBIGUOUS"].includes(row.state)) {
          effect = "ACCEPTED"; this.db.query("UPDATE g3_outbox SET state='ACCEPTED',attempt=?,receipt=? WHERE execution_id=?").run(proof.attempt, canonical(proof), row.execution_id);
        } else if (proof.state === "unknown" && row.state === "PREPARED") { effect = "AMBIGUOUS"; this.db.query("UPDATE g3_outbox SET state='AMBIGUOUS',attempt=? WHERE execution_id=?").run(proof.attempt, row.execution_id); }
      }
      this.touch(view, now, key, "g3_fixture_observation", { proof, effect }, lease.unitId); this.controller(controller, this.read(view.missionId));
    }).immediate();
  }
  private currentQ(row: OutboxRow): FixtureObservationRecordV1 {
    invariant(["TERMINAL", "REJECTED"].includes(row.state) && row.terminal_proof, "HOLD: every execution needs exact Q");
    const proof = JSON.parse(row.terminal_proof) as FixtureObservationRecordV1;
    assertFixtureRecordCurrentV1(this.db, proof);
    if (row.receipt) assertFixtureRecordCurrentV1(this.db, JSON.parse(row.receipt) as FixtureObservationRecordV1);
    invariant(proof.executionId === row.execution_id && proof.missionId === row.mission && proof.familyFence === row.family_fence
      && proof.controllerFence === row.controller_fence && proof.generationId === row.generation && proof.attempt === row.attempt && proof.requestDigest === row.request_digest, "Q scope mismatch");
    const event = this.events.read(row.mission).find(e => e.key === `observation:terminal:${fingerprint(proof)}`);
    invariant(event && ["TERMINAL", "REJECTED"].includes((event.payload as { effect: string }).effect)
      && canonical((event.payload as { proof: unknown }).proof) === canonical(proof), "missing durable Q event");
    invariant(!this.events.read(row.mission).some(e => e.kind === "g3_fixture_observation"
      && (e.payload as { proof: FixtureObservationRecordV1; effect: string }).proof.executionId === row.execution_id
      && (e.payload as { proof: FixtureObservationRecordV1; effect: string }).proof.state === "accepted"
      && (e.payload as { effect: string }).effect === "audit_only"), "HOLD: late accepted evidence contradicts Q");
    return proof;
  }
  private releasePhysical(view: GenerationViewV3, lease: FamilyLeaseV3, row: OutboxRow, allocationId: string, now: number): boolean {
    const proof = this.currentQ(row);
    // Allocation event retains canonical pool identity independently of current
    // capacity/source validity. Revoked availability must not prevent stopping.
    const events = this.events.read(view.missionId), event = events.find(e => e.kind === "g3_resource_allocated"
      && (e.payload as ResourceMutationV1).allocation.allocationId === allocationId);
    invariant(event, "HOLD: resource allocation evidence unavailable");
    const retained = event.payload as ResourceMutationV1, allocation = retained.allocation, scope = allocation.workScope;
    invariant(allocation.executionId === row.execution_id && scope.missionId === view.missionId && scope.generationId === view.generationId
      && scope.unitId === lease.unitId && scope.owner === view.owner && scope.controllerFence === view.controllerFence
      && scope.familyFence === lease.familyFence && row.family_fence === lease.familyFence && row.controller_fence === view.controllerFence, "HOLD: release allocation/execution/work mismatch");
    const inventory = this.resourceInventory(scope.poolId);
    if (inventory.released.includes(allocationId)) return false; // never delete a successor's worker
    this.family(lease, false);
    invariant(inventory.active.some(a => a.allocationId === allocationId && canonical(a) === canonical(allocation)), "HOLD: current exact allocation unavailable");
    invariant(this.db.query("DELETE FROM g3_claims WHERE resource_key=? AND mission=? AND generation=? AND unit=? AND family_fence=?")
      .run(resourceWorkerKeyV1(retained.poolScope, allocation.workerId), view.missionId, view.generationId, lease.unitId, lease.familyFence).changes === 1, "HOLD: release physical worker claim mismatch");
    advanceFixtureResourcePoolV1(this.db, scope.poolId, inventory.poolRevision);
    const mutation: ResourceMutationV1 = { version: "l8-s2-resource-mutation-fixture-v1", poolId: scope.poolId, poolScope: retained.poolScope,
      poolRevision: inventory.poolRevision + 1, allocation, proofDigest: fingerprint(proof) };
    this.events.append(view.missionId, `resource:release:${allocationId}`, "g3_resource_released", now, mutation, lease.unitId, this.events.cursor(view.missionId).sequence);
    this.resourceInventory(scope.poolId); return true;
  }
  releaseExecutionResources(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, lease: FamilyLeaseV3, allocationId: string, executionId: string, now: number): void {
    expected = detached(expected); lease = detached(lease); nonempty(allocationId); nonempty(executionId); integer(now);
    this.db.transaction(() => {
      const { view } = this.current(controller, expected), row = this.outbox(executionId);
      this.continueFamily(view, lease);
      invariant(lease.missionId === view.missionId && lease.generationId === view.generationId && lease.owner === view.owner
        && lease.controllerFence === view.controllerFence && row.mission === view.missionId && row.generation === view.generationId
        && row.unit === lease.unitId, "HOLD: exact resource release work required");
      if (this.releasePhysical(view, lease, row, allocationId, now)) this.advanceHead(view);
      this.controller(controller, this.read(view.missionId));
    }).immediate();
  }
  releaseProvenV3(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, lease: FamilyLeaseV3, now: number): void {
    expected = detached(expected); lease = detached(lease);
    this.db.transaction(() => {
      const { view, bound } = this.current(controller, expected); this.continueFamily(view, lease); this.family(lease, false);
      invariant(lease.missionId === view.missionId && lease.generationId === view.generationId && lease.controllerFence === view.controllerFence && lease.owner === view.owner, "release scope/fence");
      const rows = this.db.query("SELECT execution_id FROM g3_outbox WHERE mission=? AND generation=? AND unit=?").all(view.missionId, view.generationId, lease.unitId) as { execution_id: string }[];
      for (const entry of rows) {
        const row = this.outbox(entry.execution_id); this.currentQ(row);
        const event = this.events.read(view.missionId).find(e => e.kind === "g3_resource_allocated" && (e.payload as ResourceMutationV1).allocation.executionId === row.execution_id);
        invariant(event, "HOLD: old/untracked resource allocation is UNKNOWN");
        this.releasePhysical(view, lease, row, (event.payload as ResourceMutationV1).allocation.allocationId, now);
      }
      const unit = bound.planning.units.find(u => u.unitId === lease.unitId); invariant(unit, "HOLD: release unit source unavailable");
      // Deliberately NO family-wide DELETE: a physical worker is released only
      // by releasePhysical after its own exact Q/event/identity validation.
      for (const key of new Set([...unit.ownedFunctionIds.map(id => `fn:${id}`), ...unit.conflicts.map(c => c.resourceKey)])) {
        invariant(!key.startsWith("resource-worker:"), "HOLD: scientific claim uses physical namespace");
        invariant(this.db.query("DELETE FROM g3_claims WHERE resource_key=? AND mission=? AND generation=? AND unit=? AND family_fence=?")
          .run(key, view.missionId, view.generationId, lease.unitId, lease.familyFence).changes === 1, "HOLD: exact fn/G2 claim missing");
      }
      invariant(!this.db.query("SELECT 1 FROM g3_claims WHERE mission=? AND generation=? AND unit=? AND family_fence=?").get(view.missionId, view.generationId, lease.unitId, lease.familyFence), "HOLD: unexplained family claim remains");
      this.db.query("UPDATE g3_families SET state='RELEASED' WHERE mission=? AND generation=? AND unit=? AND family_fence=?").run(view.missionId, view.generationId, lease.unitId, lease.familyFence);
      this.db.query("UPDATE g3_units SET state='CANCELLED',revision=revision+1 WHERE mission=? AND generation=? AND unit=?").run(view.missionId, view.generationId, lease.unitId);
      // Logical ENCUMBERED/SPENT/BURNED entitlements are not refunded by Q.
      this.touch(view, now, `release:${lease.familyFence}`, "g3_family_released", lease, lease.unitId); this.controller(controller, this.read(view.missionId));
    }).immediate();
  }
}
