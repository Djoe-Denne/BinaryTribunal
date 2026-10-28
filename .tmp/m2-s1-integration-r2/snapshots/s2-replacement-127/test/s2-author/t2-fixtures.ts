/**93 Future fixture calls, never executed by the source author. */
import { EventLog } from "../../src/eventlog";
import { GraphGenerationStoreV1, openGraphGenerationFixture, type GenerationViewV3 } from "../../src/graph-generation-store";
import { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";
import { sealExecutionEnvelopeV1, makeGraphRunV3, type ExecutionEnvelopeBodyV1, type CandidateRefV1, type ExpectationsT2V1 } from "../../src/graph-execution-envelope";
import type { ActivationAttemptRecordV1, FinalAHandleV1, FinalACaseV1 } from "../../src/graph-generation-activation";
import type { FinalSnapshotV1, FinalCategoryEvidenceV1, FinalCategoryV1, FinalHostPortV1, FinalProducerRegistryV1, FinalProducerJournalV1 } from "../../src/graph-final-inventory";
import type { PlannerResult } from "../../src/planner";
import { ownedPath, type seed } from "./fixtures";
import { acquisitionInput } from "./resource-fixtures";
import { registerOriginGrant, childInput, hostObservation } from "./t1-fixtures";
import type { prepare, transitionCase } from "./t1-fixtures";
import type { TransitionCaseV1, FixtureOriginHostPortV1 } from "../../src/graph-generation-transition";
import { canonical, decoded, document, digest } from "./s1-source-fixtures";
import { allocateFinalCase93, type AssetFault93 } from "./final-host-fixture";
import type { ReplacementHostPort120 } from "../../src/graph-generation-replacement";
import { replacementKinds120 } from "../../src/graph-generation-replacement";

type Base91 = ReturnType<typeof seed>;
export interface T2Ready93 { candidate: CandidateRefV1; expectedHead: GenerationViewV3; finalA: FinalAHandleV1; caseRef: FinalHostPortV1["registry"]["ref"];
  attempt: ActivationAttemptRecordV1; child: ReturnType<typeof childInput>; controllerChildRef: string; connection: Base91["db"] }
export interface T2Fixture93 extends Base91 {
  host93: ReturnType<typeof allocateFinalCase93>; finalHost: FinalHostPortV1; preparation: ReturnType<typeof prepare> | null;
  drainCase: ReturnType<typeof transitionCase> | null; childControllerRef: string | null; closed: boolean;
  crossEpoch108?: boolean;
  replacementPort?: ReplacementHostPort120;
  replacementChild120?: ReturnType<typeof childInput>;
  defect(name: string, ready: T2Ready93): void; makeAttemptStale(ready: T2Ready93): void; expireControllerAfterAppend(): void;
  originState(generation: string): string; close(): void;
}
function noteLast(x: T2Fixture93, operation: string) {
  const event = x.events.read("author").at(-1)!, already = x.host93.logs.own.entries.some(entry => entry.ownEventKey === event.key);
  const operational = !["g3_activation_attempt", "g3_activation_outcome"].includes(event.kind);
  if (!already && operational) x.host93.note("own", operation, document("l8-host-own-event-source95", { version: "l8-host-own-event-source95", event }).ref, event.key);
}
function noteRegistration95(db: Base91["db"], host: T2Fixture93["host93"], recordRef: string) {
  const row = db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(recordRef) as { kind: string };
  if (!row) throw new Error("missing actual HOST registration");
  host.note("own", "register-source-controller", document("l8-host-registered-source95", { version: "l8-host-registered-source95", row }).ref, null,
    row.kind === "controller" ? ["sourceCapabilities", "controllerLeases"] : ["sourceCapabilities"]);
}
export function t2Fixture(options: { asset?: AssetFault93; engaged?: boolean; parentExpiresAtEvent?: number; crossEpoch?: boolean; replacement120?: boolean; stopBeforeDrain120?: boolean; beforePreparation?: (fixture: T2Fixture93) => void } = {}): T2Fixture93 {
  const host = allocateFinalCase93(options.crossEpoch ?? false, options.replacement120 ?? false), f = host.source, sealed = sealExecutionEnvelopeV1(f.body);
  if (!sealed.ok) throw new Error(sealed.reasons.join(";"));
  const path = ownedPath(), db = openGraphGenerationFixture(path);
  try {
  const events = new EventLog(db), store = new GraphGenerationStoreV1(db, events);
  const originHostPort = host.assign(db, path), replacementPort = options.replacement120 ? host.replacementProvider120(db, path, sealed.value) : undefined;
  const authority = new FixtureTrustedAuthorityV1(db, originHostPort, replacementPort);
  const finalHost = host.provider(db, path, options.asset ?? "valid"); authority.registerFinalHost(finalHost);
  const origin = registerOriginGrant(db, authority, f, path, host.grantSources());
  noteRegistration95(db, host, `transition:${canonical(origin.grantRef)}`);
  const acquired = acquisitionInput(), acquisitionRef = authority.registerResourceSource(document(acquired.version, acquired)), acquisition = authority.resolveResourceAcquisition(acquisitionRef);
  noteRegistration95(db, host, `resource-source:${canonical(acquisitionRef)}`);
  const controller = authority.register({ kind: "controller", missionId: "author", generationId: sealed.value.generationId, envelopeFingerprint: sealed.value.envelope.fingerprint,
    owner: "synthetic-parent", controllerFence: 0, expiresAtEvent: options.parentExpiresAtEvent ?? 8 }), handle = authority.resolve(controller);
  noteRegistration95(db, host, controller);
  store.installBootstrapA(handle, sealed.value, f.independent, 0, origin.grant);
  const x: T2Fixture93 = { f, sealed: sealed.value, db, events, store, authority, controller, handle, unitId: decoded<PlannerResult>(f.body.planning).units[0]!.unitId,
    path, acquisitionRef, acquisition, originGrant: origin.grant, originGrantRef: origin.grantRef, originHost: host, originHostPort,
    host93: host, finalHost, preparation: null, drainCase: null, childControllerRef: null, closed: false, ...(options.crossEpoch ? { crossEpoch108: true } : {}), ...(replacementPort ? { replacementPort } : {}),
    close() { if (!x.closed) { x.db.close(); x.closed = true; } },
    originState(generation) { return (x.db.query("SELECT state FROM g3_origins WHERE mission=? AND generation=?").get("author", generation) as { state: string }).state; },
    makeAttemptStale() { x.host93.refreshPolicySource(x.finalHost); },
    expireControllerAfterAppend() {
      const row = x.db.query("SELECT document FROM g3_authority WHERE record_ref=?").get(x.controller) as { document: string };
      const expires = (JSON.parse(row.document) as { expiresAtEvent: number }).expiresAtEvent;
      while (x.events.cursor("author").sequence <= expires) { const cursor = x.events.cursor("author");
        x.events.append("author", `ttl-injection:${cursor.sequence}`, "g3_fixture_ttl_elapsed", cursor.time + 1, { purpose: "postappend TTL rollback fault" }); }
    },
    defect(name, ready) {
      if (name === "T1-handle") { ready.finalA = x.drainCase!.handle as never; return; }
      if (name === "bootstrap-handle") { ready.finalA = x.handle as never; return; }
      if (name === "B-native") { ready.finalA = {} as never; return; }
      if (name === "revoked-source") { x.finalHost.current!.revocationRef = document("l8-final-source-revocation93", { version: "l8-final-source-revocation93", source: x.finalHost.registry.ref }).ref; return; }
      if (name === "revoked-capability") { x.finalHost.cases.find(c => canonical(c.document.ref) === canonical(ready.caseRef))!.revocationRef = document("l8-final-case-revocation93", { version: "l8-final-case-revocation93", ref: ready.caseRef }).ref; return; }
      if (name === "orphan") { x.events.append("author", "orphan:unadmitted-producer", "g3_unowned_publication", x.events.cursor("author").time + 1, { owner: "not-admitted" }); return; }
      if (name === "paused") { const before = x.store.read("author"), after = { ...before, controlMode: "OPERATOR_PAUSED" };
        x.db.query("UPDATE g3_head SET document=?,digest=? WHERE mission=?").run(canonical(after), digest(after), "author"); return; }
      if (name === "unknown-category") { const bad = JSON.parse(x.finalHost.snapshot!.utf8); delete bad.categories.claims;
        x.finalHost.snapshot = document(bad.version, bad); x.finalHost.current!.snapshotRef = x.finalHost.snapshot.ref; return; }
      if (name === "unknown-producer") { const bad = JSON.parse(x.finalHost.registry.utf8); bad.producers.push({ producerId: "unadmitted", writes: [] });
        // Input corruption, not a fresh allocation or authority grant.
        Object.assign(x.finalHost.registry, document(bad.version, bad)); x.finalHost.current!.registryRef = x.finalHost.registry.ref;
        const observed = JSON.parse(x.finalHost.snapshot!.utf8); observed.registryRef = x.finalHost.registry.ref;
        x.finalHost.snapshot = document(observed.version, observed); x.finalHost.current!.snapshotRef = x.finalHost.snapshot.ref; return; }
      throw new Error(`unknown fixture defect:${name}`);
    } };
  noteLast(x, "bootstrap");
  // Private author composition only, OUTSIDE every product transaction.
  options.beforePreparation?.(x);
  if (options.engaged) { x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1, x.acquisition); }
  nextCandidateT2(x, { stopBeforeDrain120: options.stopBeforeDrain120 }); return x;
  } catch (error) { db.close(); throw error; }
}
export function nextCandidateT2(x: T2Fixture93, options: { stopBeforeDrain120?: boolean } = {}): void {
  const child = x.crossEpoch108 ? deferChild108(x) : childInput(x), before = x.store.read("author"), preparation = x.store.prepareInitial(x.handle, before, child.origin, child.independent,
    x.originGrant, child.observationRef, x.events.cursor("author").time + 1);
  x.preparation = { child, before, preparation }; noteLast(x, "prepare-initial");
  const record: TransitionCaseV1 = { version: "l8-fixture-transition-a-case-v1", revision: 1, issuer: "synthetic-parent85", purpose: "request-drain",
    caseId: `t1-generation:${child.origin.generationId}`, candidateRef: preparation.candidateRef, preparationRef: preparation.document.ref, observationRef: child.observationRef,
    expectedHead: x.store.read("author"), counterRef: x.authority.preparationCounter(before.rootAccountId).document.ref, owner: before.owner, controllerFence: before.controllerFence };
  const ref = x.authority.registerTransitionDocument(document(record.version, record)); x.drainCase = { ref, record, handle: x.authority.resolveTransitionA(ref) };
  if (options.stopBeforeDrain120) return;
  x.store.requestDrain(x.handle, x.store.read("author"), x.drainCase.handle, x.events.cursor("author").time + 1); noteLast(x, "request-drain"); x.childControllerRef = null;
}
function deferChild108(x: T2Fixture93): ReturnType<typeof childInput> {
  const observation = hostObservation(x), observationRef = x.authority.registerTransitionDocument(document(observation.version, observation));
  const { fingerprint: _old, ...retained } = JSON.parse(x.sealed.document.utf8);
  const planning = decoded<PlannerResult>(retained.planning), stamp = <T extends { fingerprint: string }>(value: T): T => {
    const { fingerprint: _prior, ...rest } = value; return { ...value, fingerprint: digest(rest) };
  };
  planning.plan = stamp({ ...planning.plan, selectedUnitIds: [], decisions: planning.plan.decisions.map(d => ({ ...d, action: "defer" as const, reason: "Root entitlements already SPENT/BURNED/ENCUMBERED" })) });
  if (!planning.sidecar.admissionBudget) throw new Error("HOLD: DEFER source admission budget absent");
  planning.sidecar = stamp({ ...planning.sidecar, planFingerprint: planning.plan.fingerprint,
    admissionBudget: { ...planning.sidecar.admissionBudget, selectedTotalAdmissionUtf8Bytes: 0 } });
  planning.binding = stamp({ ...planning.binding, planFingerprint: planning.plan.fingerprint, sidecarFingerprint: planning.sidecar.fingerprint });
  const source: ExecutionEnvelopeBodyV1 = { ...retained, planning: document("l8-planning-source-v1", planning), authorizationKind: "transition-a-fixture-v1", adoptionIntent: null,
    generation: { lineageId: x.sealed.envelope.generation.lineageId, ordinal: x.sealed.envelope.generation.ordinal + 1, parentGenerationId: x.sealed.generationId }, preparationObservationT0: observation.t0 };
  const sealed = sealExecutionEnvelopeV1(source); if (!sealed.ok) throw new Error(`HOLD: DEFER source S1 contradiction: ${sealed.reasons.join(";")}`);
  const independent = JSON.parse(canonical(x.f.independent)); independent.parentEnvelope = structuredClone(x.sealed.document);
  const run = makeGraphRunV3(sealed.value); if (!run.ok) throw new Error(run.reasons.join(";"));
  return { origin: sealed.value, independent, observation, observationRef, run: run.value };
}
/** HOST acquires raw rows itself OUTSIDE TX; does not invoke SUT inventory or
 * expectation builders. Source closure/producer allocation predates bootstrap.
 * Actual observed rows are INPUTS, never golden post-transition expectations. */
function captureHost93(x: T2Fixture93, staging: ReturnType<GraphGenerationStoreV1["retainCandidateForActivation"]>) {
  const rows = (table: string, order: string) => x.db.query(`SELECT * FROM ${table} ORDER BY ${order}`).all();
  const origins = rows("g3_origins", "mission,generation"), families = rows("g3_families", "mission,generation,unit"), units = rows("g3_units", "mission,generation,unit"), outboxes = rows("g3_outbox", "execution_id");
  const allAuthority = rows("g3_authority", "record_ref") as { kind: string; revision: number; revoked: number; document: string }[];
  const control = ["activation-case", "activation-attempt", "activation-receipt", "activation-counter", "activation-counter-current", "activation-outcome", "activation-result", "activation-record", "candidate-staging", "terminal-history-cut"];
  const sources = allAuthority.filter(row => !control.includes(row.kind)), asset = x.finalHost.asset, categories: Record<FinalCategoryV1, unknown[]> = {
    origins, families, units, executions: [], intents: [], outboxes, attemptsL6: [], claims: rows("g3_claims", "resource_key"), publications: [], publicationReadbacks: [],
    materializations: asset.readback ? [asset.readback] : [], materializationReadbacks: asset.readback ? [asset.readback] : [],
    proofs: [...sources.filter(row => row.kind === "observation" || replacementKinds120.includes(row.kind)), asset.readback], releases: [], sourceCapabilities: sources,
    controllerLeases: sources.filter(row => row.kind === "controller"), physicalAllocations: [], stagedUnits: units.filter(row => (row as { state: string }).state === "STAGED"),
    stagedBlobs: allAuthority.filter(row => row.kind === "candidate-staging" || row.kind === "terminal-history-cut" || row.kind === "replacement-stage120"), requiredFiles: [asset.lease] };
  if (x.crossEpoch108) {
    categories.executions = outboxes;
    categories.intents = (families as { mission: string; generation: string; unit: string }[]).flatMap(f => {
      const row = (units as { mission: string; generation: string; unit: string; document: string }[]).find(u => u.mission === f.mission && u.generation === f.generation && u.unit === f.unit)!;
      return (JSON.parse(row.document) as { subIntents: unknown[] }).subIntents.map(subIntent => ({ mission: f.mission, generation: f.generation, unit: f.unit, subIntent }));
    });
    categories.attemptsL6 = (outboxes as { execution_id: string; admission_utf8: string; attempt: number; state: string; receipt: string | null }[]).map(r => ({ executionId: r.execution_id, attemptId: JSON.parse(r.admission_utf8).attemptId, attempt: r.attempt, state: r.state, receipt: r.receipt }));
    categories.releases = x.events.read("author").filter(e => ["g3_resource_released", "g3_family_released"].includes(e.kind));
    const allocated = x.events.read("author").filter(e => e.kind === "g3_resource_allocated");
    categories.physicalAllocations = allocated.map(e => (e.payload as { allocation: unknown }).allocation);
  }
  // Zero-work categories are opposed to the retained closed producer registry
  // AND complete HOST journals; missing API is never a reason to put [] here.
  x.finalHost.journals = [document(x.host93.logs.own.version, x.host93.logs.own), document(x.host93.logs.file.version, x.host93.logs.file)];
  const registry = decoded<FinalProducerRegistryV1>(x.finalHost.registry), cuts = x.finalHost.journals.map(j => ({ producerId: decoded<FinalProducerJournalV1>(j).producerId, journalRef: j.ref, lastSequence: decoded<FinalProducerJournalV1>(j).lastSequence }));
  const originRefs = (origins as { document: string }[]).map(row => JSON.parse(row.document).origin.document.ref);
  const captured = Object.fromEntries((Object.keys(categories) as FinalCategoryV1[]).map(category => {
    const sourceSnapshot = document("l8-host-category-raw93", { version: "l8-host-category-raw93", category, rows: categories[category] });
    const value: FinalCategoryEvidenceV1 = { version: "l8-final-category-evidence-fixture-v1", category, domain: registry.domain, registryRef: x.finalHost.registry.ref,
      rows: categories[category], sourceSnapshotRef: sourceSnapshot.ref, originRefs, producerCuts: cuts }; return [category, document(value.version, value)];
  })) as FinalSnapshotV1["categories"];
  const head = JSON.parse((x.db.query("SELECT document FROM g3_head WHERE mission=?").get("author") as { document: string }).document) as GenerationViewV3;
  const snapshot: FinalSnapshotV1 = { version: "l8-final-snapshot-fixture-v1", domain: registry.domain, registryRef: x.finalHost.registry.ref,
    expectedHead: head, categories: captured, operationalEventKeys: x.events.read("author").filter(e => !["g3_activation_attempt", "g3_activation_outcome"].includes(e.kind)).map(e => e.key),
    rootLedger: rows("g3_slots", "root_id,slot_key"), knowledgeRef: x.f.body.admissionSource.knowledgeSource.ref, candidateRef: head.candidateRef!, stagingRef: staging.document.ref,
    assetCurrent: structuredClone(asset.current) };
  x.finalHost.snapshot = document(snapshot.version, snapshot); x.finalHost.current = { revision: (x.finalHost.current?.revision ?? 0) + 1,
    registryRef: x.finalHost.registry.ref, snapshotRef: x.finalHost.snapshot.ref, journalRefs: x.finalHost.journals.map(j => j.ref), revocationRef: null };
  const refs = sources.map(row => document("l8-final-authority-row-v1", { version: "l8-final-authority-row-v1", row }).ref);
  return { sources, refs };
}
/**113 Reusable legitimate staging only: no final capture, attempt or activation. */
export function stageT2(x: T2Fixture93) {
  const p = { child: x.replacementChild120 ?? x.preparation!.child };
  if (!x.childControllerRef) {
    x.childControllerRef = x.authority.register({ kind: "controller", missionId: "author", generationId: p.child.origin.generationId,
      envelopeFingerprint: p.child.origin.envelope.fingerprint, owner: "synthetic-parent", controllerFence: 0, expiresAtEvent: 10000 });
    noteRegistration95(x.db, x.host93, x.childControllerRef);
  }
  const staging = x.store.retainCandidateForActivation(x.handle, x.store.read("author"), x.events.cursor("author").time + 1);
  const event = x.events.read("author").find(e => e.key === `candidate-staging:${p.child.origin.generationId}`);
  if (!event || event.kind !== "g3_candidate_staged" || canonical(event.payload) !== canonical(staging)) throw new Error("HOLD: actual pointed-candidate staging event/bytes missing");
  if (!x.host93.logs.own.entries.some(entry => entry.ownEventKey === event.key))
    x.host93.note("own", "retain-pointed-candidate-units", document("l8-host-own-event-source95", { version: "l8-host-own-event-source95", event }).ref, event.key);
  return staging;
}
export function collectT2(x: T2Fixture93): T2Ready93 {
  const p = { child: x.replacementChild120 ?? x.preparation!.child }, staging = stageT2(x);
  const controllerChildRef = x.childControllerRef;
  if (!controllerChildRef) throw new Error("HOLD: staged child controller source missing");
  const raw = captureHost93(x, staging), before = x.store.read("author"), slots = x.store.slots("author"), counter = x.authority.activationCounter(before.rootAccountId);
  const sourceCapabilityRefs = [...raw.sources.flatMap((row, i) => row.kind !== "observation" ? [raw.refs[i]!] : []), x.finalHost.registry.ref, x.finalHost.asset.lease.ref];
  const expectations: ExpectationsT2V1 = { headRevision: before.revision, activeGenerationId: before.generationId, activePlanRevision: before.activePlanRevision,
    sourceMissionRevision: before.sourceMissionRevision, controllerFence: before.controllerFence,
    familyFences: (x.db.query("SELECT mission,generation,unit,family_fence FROM g3_families ORDER BY mission,generation,unit").all() as { mission: string; generation: string; unit: string; family_fence: number }[])
      .map(f => ({ familyId: canonical({ mission: f.mission, generation: f.generation, unit: f.unit }), fence: f.family_fence })), knowledgeRevision: before.knowledgeRevision,
    knowledgeRootHash: before.knowledgeRootHash, knowledgeLedgerRevision: before.knowledgeLedgerRevision, knowledgeLedgerDigest: before.knowledgeLedgerDigest,
    inventoryRevision: before.inventoryRevision, inventoryDigest: x.finalHost.snapshot!.ref.sha256, inventoryRef: x.finalHost.snapshot!.ref,
    budgetLedgerRevision: before.budgetLedgerRevision, budgetLedgerDigest: before.budgetLedgerDigest,
    spentBySlot: slots.filter(s => ["SPENT", "BURNED"].includes(s.state)).map(s => ({ slotKey: s.slot_key, amount: s.debit })),
    encumberedBySlot: slots.filter(s => s.state === "ENCUMBERED").map(s => ({ slotKey: s.slot_key, amount: s.debit })),
    proofRecordRefs: [...raw.sources.flatMap((row, i) => row.kind === "observation" || replacementKinds120.includes(row.kind) ? [raw.refs[i]!] : []), x.finalHost.asset.readback!.ref],
    releaseRecordRefs: x.events.read("author").filter(e => ["g3_resource_released", "g3_family_released"].includes(e.kind)).map(event => document("l8-terminal-release-event108", { version: "l8-terminal-release-event108", event }).ref), sourceCapabilityRecordRefs: sourceCapabilityRefs,
    authorityRecords: raw.sources.map((row, i) => ({ recordRef: raw.refs[i]!, revision: row.revision,
      revocationRef: row.revoked ? document("l8-final-authority-revocation-v1", { version: "l8-final-authority-revocation-v1", recordRef: raw.refs[i]!, revision: row.revision }).ref : null })) };
  const value: FinalACaseV1 = { version: "l8-final-a-case-fixture-v1", issuer: "synthetic-host92", purpose: "activate-a-fixture", caseId: `final:${counter.value.usedAttempts + 1}`, revision: 1,
    hostCurrentRevision: x.finalHost.current!.revision,
    expectedHead: before, candidateRef: before.candidateRef!, barrierRootId: before.barrierRootId!, drainEntryRef: x.store.requestDrain(x.handle, x.drainCase!.record.expectedHead, x.drainCase!.handle, x.events.cursor("author").time).document.ref,
    finalInventoryRef: x.finalHost.snapshot!.ref, stagingRef: staging.document.ref, expectationsT2: expectations, activationCounterBeforeRef: counter.document.ref,
    activationAttemptOrdinal: counter.value.usedAttempts + 1, previousActivationAttemptId: counter.value.latestAttemptId, controllerChildRef, sourceCapabilityRefs };
  const caseDoc = document(value.version, value); x.finalHost.cases.push({ document: caseDoc, revision: 1, currentRef: caseDoc.ref, revocationRef: null });
  const finalA = x.authority.resolveFinalA(caseDoc.ref), attempt = x.store.appendActivationAttempt(x.handle, before, finalA, x.events.cursor("author").time + 1);
  return { candidate: before.candidateRef!, expectedHead: before, finalA, caseRef: caseDoc.ref, attempt, child: p.child, controllerChildRef, connection: x.db };
}
export function activateT2(x: T2Fixture93, ready: T2Ready93) {
  const handle = ready.connection === x.db ? ready.finalA : x.authority.resolveFinalA(ready.caseRef);
  const result = x.store.activateA(x.handle, ready.attempt.activationAttemptId, handle, x.events.cursor("author").time + 1);
  if (result.outcome === "COMMITTED") { if (x.controller !== ready.controllerChildRef) noteLast(x, "activate-a");
    x.controller = ready.controllerChildRef; x.handle = x.authority.resolve(x.controller); x.sealed = ready.child.origin; }
  return result;
}
export function reopenT2(x: T2Fixture93, options: { reconnectRetainedOrigin?: boolean; reconnectRetainedReplacement?: boolean } = {}): T2Fixture93 {
  const retained = options.reconnectRetainedOrigin ? x.originHostPort : undefined;
  const retainedReplacement = options.reconnectRetainedReplacement ? x.replacementPort : undefined;
  if (retainedReplacement && (retainedReplacement.connection !== x.db || !retainedReplacement.records)) throw new Error("HOLD: retained replacement HOST wrong OWN");
  if (retained && (retained.connection !== x.db || !retained.records)) throw new Error("HOLD: retained current origin HOST unavailable on original OWN");
  const before = retained ? { head: x.store.read("author"), preparation: x.authority.preparationCounter(x.store.read("author").rootAccountId),
    activation: x.authority.activationCounter(x.store.read("author").rootAccountId), cursor: x.events.cursor("author"), sources: canonical(retained.records) } : null;
  x.close(); const db = openGraphGenerationFixture(x.path);
  try {
    const events = new EventLog(db), store = new GraphGenerationStoreV1(db, events);
    const path = (db.query("PRAGMA database_list").all() as { name: string; file: string }[]).find(row => row.name === "main")?.file;
    const normalize = (value: string) => value.replaceAll("\\", "/").toLowerCase();
    if (retained && (!path || normalize(path) !== normalize(x.path))) throw new Error("HOLD: reconnected origin HOST requires same actual OWN path");
    // This is a view of the SAME prebootstrap HOST source, not a new assignment,
    // issuer/first-issuance/grant or a stale copy of its current/revocation state.
    let originHostPort: FixtureOriginHostPortV1 | undefined;
    if (retained) {
      const source = retained;
      originHostPort = { connection: db, get records() { return source.records; }, set records(value) { source.records = value; } };
    }
    let replacementPort: ReplacementHostPort120 | undefined;
    if (retainedReplacement) { const source = retainedReplacement; replacementPort = { connection: db, get records() { return source.records; }, set records(value) { source.records = value; },
      ...(source.epoch ? { epoch: source.epoch } : {}), get observedEpoch() { return source.observedEpoch; } }; }
    const authority = new FixtureTrustedAuthorityV1(db, originHostPort, replacementPort), provider = { ...x.finalHost, connection: db };
    authority.registerFinalHost(provider);
    const originGrant = originHostPort ? authority.resolvePreparationGrant(x.originGrantRef) : x.originGrant;
    if (before && (!retained?.records || canonical(retained.records) !== before.sources || canonical(store.read("author")) !== canonical(before.head)
      || canonical(authority.preparationCounter(before.head.rootAccountId)) !== canonical(before.preparation)
      || canonical(authority.activationCounter(before.head.rootAccountId)) !== canonical(before.activation)
      || canonical(events.cursor("author")) !== canonical(before.cursor))) throw new Error("HOLD: retained-source reconnect changed OWN/counters/current");
    const y: T2Fixture93 = { ...x, db, events, store, authority, handle: authority.resolve(x.controller), finalHost: provider, originGrant,
      ...(originHostPort ? { originHostPort } : {}), ...(replacementPort ? { replacementPort } : {}), closed: false,
      close() { if (!y.closed) { y.db.close(); y.closed = true; } } }; return y;
  } catch (error) { db.close(); throw error; }
}
