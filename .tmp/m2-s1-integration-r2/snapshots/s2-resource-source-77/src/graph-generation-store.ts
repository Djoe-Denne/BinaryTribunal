/** S2 bootstrap-A OWN fixture persistence only. ZERO submission/publication IO.
 * Transition/B/HOST/drain/replacement/succession are HOLD, not simulated success.
 */
import { Database } from "bun:sqlite";
import { existsSync, realpathSync } from "node:fs";
import { basename } from "node:path";
import { EventLog, immutableCopy, integer, invariant, nonempty } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import { assertExecutionJsonV1, bindExecutionSourcesV1, makeGraphRunV3,
  type ParsedExecutionEnvelopeV1, type IndependentlyLoadedSourcesV1, type BoundExecutionV1, type ReadonlyData, type RootLimitsV1, type RootModelBindingsV1 } from "./graph-execution-envelope";
import type { GraphExecutionTemplate } from "./domain";
import { captureAdmissionImageV3, checkAdmissionBodyCapsV3, rootBudgetDataV3, rootSlotKeyV3, safeRootSumV3, type AdmissionImageV3 } from "./graph-generation-budget";
import { resolveFixtureAuthorityV1, assertFixtureRecordCurrentV1, type FixtureAuthorityHandleV1, type FixtureControllerRecordV1, type FixtureObservationRecordV1 } from "./graph-trusted-authority";
import { resolveFixtureResourceAcquisitionV1, resolveFixtureResourceWitnessV1, readFixtureResourceSourceV1, advanceFixtureResourcePoolV1,
  type FixtureResourceAcquisitionHandleV1, type FixtureResourceWitnessV1 } from "./graph-trusted-authority";
import { checkResourceRequirementV1, readResourceInventoryV1, assertResourceSnapshotV1, resourceWorkerKeyV1, workerDimensions, accountDimensions,
  type ResourceAcquisitionV1, type ResourceAllocationV1, type ResourceAssignmentV1, type ResourceMutationV1 } from "./graph-resource-ledger";

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

export interface GenerationViewV3 {
  missionId: string; lineageId: string; generationId: string; envelopeFingerprint: string; sourceDigest: string;
  rootAccountId: string; owner: string; controllerFence: number; knowledgeRevision: number; planFingerprint: string;
  revision: number; inventoryRevision: number; budgetLedgerRevision: number; budgetLedgerDigest: string;
  controlMode: "RUNNING";
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
    invariant(view.missionId === mission && view.revision === row.revision && view.controlMode === "RUNNING", "HOLD: head projection mismatch"); return view;
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
  private advanceHead(view: GenerationViewV3): void {
    const revision = view.revision + 1, budgetLedgerRevision = view.budgetLedgerRevision + 1;
    integer(revision); integer(budgetLedgerRevision); integer(view.inventoryRevision + 1);
    const digest = this.ledger(view.rootAccountId), next = { ...view, revision, inventoryRevision: view.inventoryRevision + 1, budgetLedgerRevision, budgetLedgerDigest: digest };
    invariant(this.db.query("UPDATE g3_root SET revision=?,digest=? WHERE root_id=? AND revision=? AND digest=?").run(budgetLedgerRevision, digest, view.rootAccountId, view.budgetLedgerRevision, view.budgetLedgerDigest).changes === 1, "stale root CAS");
    invariant(this.db.query("UPDATE g3_head SET revision=?,document=?,digest=? WHERE mission=? AND revision=?").run(revision, canonical(next), fingerprint(next), view.missionId, view.revision).changes === 1, "stale head CAS");
  }
  private touch(view: GenerationViewV3, now: number, key: string, kind: string, payload: unknown, unit: string | null): void {
    integer(now); this.advanceHead(view);
    this.events.append(view.missionId, key, kind, now, payload, unit, this.events.cursor(view.missionId).sequence);
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
  installBootstrapA(handle: FixtureAuthorityHandleV1, origin: ReadonlyData<ParsedExecutionEnvelopeV1>, independent: IndependentlyLoadedSourcesV1, now: number): GenerationViewV3 {
    assertExecutionJsonV1(origin); assertExecutionJsonV1(independent);
    const result = bindExecutionSourcesV1(origin, independent); invariant(result.ok, "S1 binding failed");
    const bound = result.value, e = bound.origin.envelope;
    invariant(e.authorizationKind === "bootstrap-a-fixture-v1" && e.mode === "offline-fixture-v1" && e.generation.ordinal === 0 && e.generation.parentGenerationId === null, "HOLD: only fresh bootstrap A supported");
    const run = makeGraphRunV3(bound.origin); invariant(run.ok, "run binding failed");
    const root = rootBudgetDataV3(bound), document = canonical({ origin: bound.origin, independent }), sourceDigest = fingerprint(JSON.parse(document));
    return this.db.transaction(() => {
      const auth = resolveFixtureAuthorityV1(this.db, handle); invariant(auth.kind === "controller", "bootstrap fixture controller required");
      const old = this.db.query("SELECT mission FROM g3_head").all();
      if (old.length) { const view = this.read(e.missionId); this.controller(handle, view); invariant(view.sourceDigest === sourceDigest, "bootstrap immutable identity changed"); this.origin(e.missionId); return view; }
      invariant(this.events.cursor(e.missionId).sequence === e.preparationObservationT0.observedEventSequence && e.preparationObservationT0.headRevision === 0
        && e.preparationObservationT0.controllerFence === auth.controllerFence, "stale bootstrap T0");
      invariant(e.preparationObservationT0.spentBySlot !== null && e.preparationObservationT0.spentBySlot.length === 0
        && e.preparationObservationT0.encumberedBySlot !== null && e.preparationObservationT0.encumberedBySlot.length === 0, "HOLD: bootstrap budget history must be known empty");
      invariant(!this.db.query("SELECT 1 FROM g3_origins UNION ALL SELECT 1 FROM g3_root UNION ALL SELECT 1 FROM g3_claims UNION ALL SELECT 1 FROM g3_outbox").get(), "bootstrap OWN not empty");
      const view: GenerationViewV3 = { missionId: e.missionId, lineageId: e.generation.lineageId, generationId: bound.origin.generationId,
        envelopeFingerprint: e.fingerprint, sourceDigest, rootAccountId: root.rootAccountId, owner: auth.owner, controllerFence: auth.controllerFence,
        knowledgeRevision: bound.snapshot.knowledgeRevision, planFingerprint: bound.planning.plan.fingerprint,
        revision: 1, inventoryRevision: 0, budgetLedgerRevision: 0, budgetLedgerDigest: "", controlMode: "RUNNING" };
      this.controller(handle, view);
      this.db.query("INSERT INTO g3_origins VALUES(?,?,?,?,?,?,'ACTIVE')").run(e.missionId, view.generationId, document, sourceDigest, run.value.document.utf8, canonical(e.preparationObservationT0));
      for (const unit of bound.planning.units) this.db.query("INSERT INTO g3_units VALUES(?,?,?,?,?,?,0)").run(e.missionId, view.generationId, unit.unitId, canonical(unit), fingerprint(unit), bound.planning.plan.selectedUnitIds.includes(unit.unitId) && unit.prerequisites.length === 0 ? "READY" : "BLOCKED");
      for (const grant of root.grants.grants) this.db.query("INSERT INTO g3_slots VALUES(?,?,0,'AUTHORIZED',?,?,?,NULL)").run(root.rootAccountId, rootSlotKeyV3(grant.slot), canonical(grant), grant.bodyCapUtf8Bytes, grant.reservedDebitUtf8Bytes);
      view.budgetLedgerDigest = this.ledger(root.rootAccountId);
      this.db.query("INSERT INTO g3_root VALUES(?,?,?,0,?,?,?,?)").run(root.rootAccountId, e.missionId, view.lineageId, root.limitsUtf8, root.grantsUtf8, root.modelsUtf8, view.budgetLedgerDigest);
      this.db.query("INSERT INTO g3_head VALUES(?,?,?,?,?)").run(e.missionId, view.lineageId, view.revision, canonical(view), fingerprint(view));
      this.events.append(e.missionId, `bootstrap:${view.generationId}`, "g3_bootstrap_fixture", now, view);
      this.controller(handle, view); return detached(view);
    }).immediate();
  }
  private family(lease: FamilyLeaseV3, active: boolean): FamilyRow {
    const row = this.db.query("SELECT * FROM g3_families WHERE mission=? AND generation=? AND unit=?").get(lease.missionId, lease.generationId, lease.unitId) as FamilyRow | null;
    invariant(row && row.owner === lease.owner && row.controller_fence === lease.controllerFence && row.family_fence === lease.familyFence && row.expires_event === lease.expiresAtEvent && row.state === "ACTIVE", "stale family fence");
    if (active) invariant(row.expires_event > this.events.cursor(lease.missionId).sequence, "expired family is not executable"); return row;
  }
  reserveFamily(handle: FixtureAuthorityHandleV1, expected: GenerationViewV3, unitId: string, ttlEvents: number, now: number, acquisition?: FixtureResourceAcquisitionHandleV1): FamilyLeaseV3 {
    expected = detached(expected); integer(ttlEvents, 2); invariant(ttlEvents <= 10000, "family TTL bound");
    return this.db.transaction(() => {
      const { view, bound } = this.current(handle, expected), unit = bound.planning.units.find(u => u.unitId === unitId);
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
      const { view, bound } = this.current(handle, expected); this.family(lease, true);
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
      const { view, bound } = this.current(controller, expected); this.family(lease, false);
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
