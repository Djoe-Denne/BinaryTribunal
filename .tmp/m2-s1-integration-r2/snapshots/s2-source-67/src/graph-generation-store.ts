/** S2 bootstrap-A OWN fixture persistence only. ZERO submission/publication IO.
 * Transition/B/HOST/drain/replacement/succession are HOLD, not simulated success.
 */
import { Database } from "bun:sqlite";
import { existsSync, realpathSync } from "node:fs";
import { basename } from "node:path";
import { EventLog, immutableCopy, integer, invariant, nonempty } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import { assertExecutionJsonV1, bindExecutionSourcesV1, makeGraphRunV3,
  type ParsedExecutionEnvelopeV1, type IndependentlyLoadedSourcesV1, type BoundExecutionV1, type ReadonlyData } from "./graph-execution-envelope";
import { captureAdmissionImageV3, checkAdmissionBodyCapsV3, rootBudgetDataV3, rootSlotKeyV3, safeRootSumV3, type AdmissionImageV3 } from "./graph-generation-budget";
import { resolveFixtureAuthorityV1, assertFixtureRecordCurrentV1, type FixtureAuthorityHandleV1, type FixtureControllerRecordV1, type FixtureObservationRecordV1 } from "./graph-trusted-authority";

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

function verifySchema(db: Database): void {
  invariant(!db.query("SELECT 1 FROM sqlite_master WHERE type IN ('view','trigger') LIMIT 1").get(), "foreign SQL objects in OWN v3", "schema");
  const names = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  invariant(names.length === tables.length && names.every(r => tables.includes(r.name)), "foreign/incomplete OWN v3 schema", "schema");
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
  }
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
  private touch(view: GenerationViewV3, now: number, key: string, kind: string, payload: unknown, unit: string | null): void {
    integer(now); const revision = view.revision + 1, budgetLedgerRevision = view.budgetLedgerRevision + 1;
    integer(revision); integer(budgetLedgerRevision); integer(view.inventoryRevision + 1);
    const digest = this.ledger(view.rootAccountId), next = { ...view, revision, inventoryRevision: view.inventoryRevision + 1, budgetLedgerRevision, budgetLedgerDigest: digest };
    invariant(this.db.query("UPDATE g3_root SET revision=?,digest=? WHERE root_id=? AND revision=? AND digest=?").run(budgetLedgerRevision, digest, view.rootAccountId, view.budgetLedgerRevision, view.budgetLedgerDigest).changes === 1, "stale root CAS");
    invariant(this.db.query("UPDATE g3_head SET revision=?,document=?,digest=? WHERE mission=? AND revision=?").run(revision, canonical(next), fingerprint(next), view.missionId, view.revision).changes === 1, "stale head CAS");
    this.events.append(view.missionId, key, kind, now, payload, unit, this.events.cursor(view.missionId).sequence);
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
  reserveFamily(handle: FixtureAuthorityHandleV1, expected: GenerationViewV3, unitId: string, ttlEvents: number, now: number): FamilyLeaseV3 {
    expected = detached(expected); integer(ttlEvents, 2); invariant(ttlEvents <= 10000, "family TTL bound");
    return this.db.transaction(() => {
      const { view, bound } = this.current(handle, expected), unit = bound.planning.units.find(u => u.unitId === unitId);
      invariant(unit && bound.planning.plan.selectedUnitIds.includes(unitId) && unit.prerequisites.length === 0, "HOLD: unselected unit or prerequisite publication unavailable");
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
      for (const key of new Set([...unit.ownedFunctionIds.map(id => `fn:${id}`), ...unit.conflicts.map(c => c.resourceKey)])) this.db.query("INSERT INTO g3_claims VALUES(?,?,?,?,?)").run(key, view.missionId, view.generationId, unitId, lease.familyFence);
      for (const slot of slots) invariant(this.db.query("UPDATE g3_slots SET state='ENCUMBERED',revision=revision+1 WHERE root_id=? AND slot_key=? AND state='AUTHORIZED'").run(view.rootAccountId, slot.slot_key).changes === 1, "slot CAS lost");
      this.db.query("UPDATE g3_units SET state='RESERVED',revision=revision+1 WHERE mission=? AND generation=? AND unit=? AND state='READY'").run(view.missionId, view.generationId, unitId);
      this.touch(view, now, `family:${lease.familyFence}`, "g3_family_reserved", lease, unitId);
      this.controller(handle, this.read(view.missionId)); this.family(lease, true); return detached(lease);
    }).immediate();
  }
  prepareAdmissionV3(handle: FixtureAuthorityHandleV1, expected: GenerationViewV3, lease: FamilyLeaseV3, supplied: unknown, now: number): PreparedAdmissionV3 {
    expected = detached(expected); lease = detached(lease); const image = captureAdmissionImageV3(supplied);
    const body = JSON.parse(image.admissionUtf8) as { subIntentId: string; role: string; executionId: string; attemptId: string; idempotencyKey: string };
    return this.db.transaction(() => {
      const { view, bound } = this.current(handle, expected); this.family(lease, true);
      invariant(lease.missionId === view.missionId && lease.generationId === view.generationId && lease.controllerFence === view.controllerFence && lease.owner === view.owner, "foreign family generation/controller");
      const unit = bound.planning.units.find(u => u.unitId === lease.unitId), sub = unit?.subIntents.find(s => s.subIntentId === body.subIntentId);
      invariant(unit && sub && sub.role === body.role && body.idempotencyKey === body.executionId, "exact sub-intent/admission identity required");
      invariant(sub.waitsForSubIntentIds.length === 0, "HOLD: attributable scientific predecessor results unavailable");
      const grant = rootBudgetDataV3(bound).grants.grants.find(g => g.functionId === sub.functionId && g.slot.role === sub.role && canonical(g.slot.functionIdentity) === canonical(sub.harnessIdentity));
      invariant(grant, "exact acquired grant missing");
      const key = rootSlotKeyV3(grant.slot), slot = this.db.query("SELECT * FROM g3_slots WHERE root_id=? AND slot_key=?").get(view.rootAccountId, key) as SlotRow | null;
      invariant(slot && slot.grant_ref === canonical(grant) && slot.cap === grant.bodyCapUtf8Bytes && slot.debit === grant.reservedDebitUtf8Bytes, "immutable grant changed");
      const cap = bound.planning.sidecar.admissionBudget?.byUnit[unit.unitId]?.admissionCapUtf8Bytes;
      invariant(cap?.known === true && cap.value !== null, "HOLD: current admission cap unknown");
      const comparison = checkAdmissionBodyCapsV3(image, cap.value, slot.cap);
      invariant(cap.value <= slot.cap, "current cap cannot exceed acquired grant");
      const result: PreparedAdmissionV3 = { status: comparison.fits ? "PREPARED" : "BURNED", generationId: view.generationId, unitId: unit.unitId,
        subIntentId: sub.subIntentId, executionId: body.executionId, attemptId: body.attemptId, image, cap: cap.value, reservedDebit: slot.debit,
        maxAttempts: bound.template.settings.maxAdmissionAttempts, retryDelayMs: bound.template.settings.retryDelayMs, grantRef: slot.grant_ref };
      if (slot.claim_utf8) {
        invariant(["SPENT", "BURNED"].includes(slot.state) && slot.claim_utf8 === canonical(result), "spent slot body/ID/generation/policy changed");
        if (slot.state === "SPENT") {
          const persisted = this.outbox(body.executionId);
          invariant(persisted.admission_utf8 === image.admissionUtf8 && persisted.mission === view.missionId && persisted.generation === view.generationId
            && persisted.unit === unit.unitId && persisted.sub_intent === sub.subIntentId && persisted.family_fence === lease.familyFence
            && persisted.controller_fence === view.controllerFence && persisted.max_attempts === result.maxAttempts && persisted.retry_delay === result.retryDelayMs, "retry durable identity changed");
        } else invariant(!this.db.query("SELECT 1 FROM g3_outbox WHERE execution_id=?").get(body.executionId), "burned slot has an outbox effect");
        return detached(JSON.parse(slot.claim_utf8) as PreparedAdmissionV3);
      }
      invariant(slot.state === "ENCUMBERED", "family entitlement not encumbered");
      const previous = this.db.query("SELECT claim_utf8 FROM g3_slots WHERE claim_utf8 IS NOT NULL").all() as { claim_utf8: string }[];
      invariant(!previous.some(r => (JSON.parse(r.claim_utf8) as PreparedAdmissionV3).executionId === body.executionId), "execution ID already claimed in OWN");
      invariant(this.db.query("UPDATE g3_slots SET state=?,revision=revision+1,claim_utf8=? WHERE root_id=? AND slot_key=? AND state='ENCUMBERED' AND claim_utf8 IS NULL").run(comparison.fits ? "SPENT" : "BURNED", canonical(result), view.rootAccountId, key).changes === 1, "slot spend CAS lost");
      if (comparison.fits) this.db.query("INSERT INTO g3_outbox VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'PREPARED',0,?,?,NULL,NULL)").run(body.executionId, view.missionId, view.generationId, unit.unitId, sub.subIntentId, view.rootAccountId, key, view.controllerFence, lease.familyFence, image.admissionUtf8, image.commandUtf8, image.admissionRawSha256, image.commandRawSha256, image.requestDigest, result.maxAttempts, result.retryDelayMs);
      this.touch(view, now, `admission:${view.rootAccountId}:${key}`, comparison.fits ? "g3_admission_prepared" : "g3_slot_burned", result, unit.unitId);
      this.controller(handle, this.read(view.missionId)); this.family(lease, true); return detached(result);
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
  releaseProvenV3(controller: FixtureAuthorityHandleV1, expected: GenerationViewV3, lease: FamilyLeaseV3, now: number): void {
    expected = detached(expected); lease = detached(lease);
    this.db.transaction(() => {
      const { view } = this.current(controller, expected); this.family(lease, false);
      invariant(lease.missionId === view.missionId && lease.generationId === view.generationId && lease.controllerFence === view.controllerFence && lease.owner === view.owner, "release scope/fence");
      const rows = this.db.query("SELECT execution_id FROM g3_outbox WHERE mission=? AND generation=? AND unit=?").all(view.missionId, view.generationId, lease.unitId) as { execution_id: string }[];
      for (const entry of rows) {
        const row = this.outbox(entry.execution_id); invariant(["TERMINAL", "REJECTED"].includes(row.state) && row.terminal_proof, "HOLD: every execution needs exact Q");
        const proof = JSON.parse(row.terminal_proof) as FixtureObservationRecordV1;
        assertFixtureRecordCurrentV1(this.db, proof);
        if (row.receipt) assertFixtureRecordCurrentV1(this.db, JSON.parse(row.receipt) as FixtureObservationRecordV1);
        invariant(proof.familyFence === row.family_fence && proof.controllerFence === row.controller_fence && proof.generationId === row.generation && proof.attempt === row.attempt && proof.requestDigest === row.request_digest, "Q scope mismatch");
        const event = this.events.read(view.missionId).find(e => e.key === `observation:terminal:${fingerprint(proof)}`);
        invariant(event && ["TERMINAL", "REJECTED"].includes((event.payload as { effect: string }).effect) && canonical((event.payload as { proof: unknown }).proof) === canonical(proof), "missing durable Q event");
        invariant(!this.events.read(view.missionId).some(e => e.kind === "g3_fixture_observation" && (e.payload as { proof: FixtureObservationRecordV1; effect: string }).proof.executionId === row.execution_id
          && (e.payload as { proof: FixtureObservationRecordV1; effect: string }).proof.state === "accepted" && (e.payload as { effect: string }).effect === "audit_only"), "HOLD: late accepted evidence contradicts Q");
      }
      this.db.query("DELETE FROM g3_claims WHERE mission=? AND generation=? AND unit=? AND family_fence=?").run(view.missionId, view.generationId, lease.unitId, lease.familyFence);
      this.db.query("UPDATE g3_families SET state='RELEASED' WHERE mission=? AND generation=? AND unit=? AND family_fence=?").run(view.missionId, view.generationId, lease.unitId, lease.familyFence);
      this.db.query("UPDATE g3_units SET state='CANCELLED',revision=revision+1 WHERE mission=? AND generation=? AND unit=?").run(view.missionId, view.generationId, lease.unitId);
      // Logical ENCUMBERED/SPENT/BURNED entitlements are not refunded by Q.
      this.touch(view, now, `release:${lease.familyFence}`, "g3_family_released", lease, lease.unitId); this.controller(controller, this.read(view.missionId));
    }).immediate();
  }
}
