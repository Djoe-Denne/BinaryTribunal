/**93 Future fixture calls, never executed by the source author. */
import { EventLog } from "../../src/eventlog";
import { GraphGenerationStoreV1, openGraphGenerationFixture, type GenerationViewV3 } from "../../src/graph-generation-store";
import { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";
import { sealExecutionEnvelopeV1, type CandidateRefV1, type ExpectationsT2V1 } from "../../src/graph-execution-envelope";
import type { ActivationAttemptRecordV1, FinalAHandleV1, FinalACaseV1 } from "../../src/graph-generation-activation";
import type { FinalSnapshotV1, FinalCategoryEvidenceV1, FinalCategoryV1, FinalHostPortV1, FinalProducerRegistryV1, FinalProducerJournalV1 } from "../../src/graph-final-inventory";
import type { PlannerResult } from "../../src/planner";
import { ownedPath, type seed } from "./fixtures";
import { acquisitionInput } from "./resource-fixtures";
import { registerOriginGrant, childInput } from "./t1-fixtures";
import type { prepare, transitionCase } from "./t1-fixtures";
import type { TransitionCaseV1 } from "../../src/graph-generation-transition";
import { canonical, decoded, document, digest } from "./s1-source-fixtures";
import { allocateFinalCase93, type AssetFault93 } from "./final-host-fixture";

type Base91 = ReturnType<typeof seed>;
export interface T2Ready93 { candidate: CandidateRefV1; expectedHead: GenerationViewV3; finalA: FinalAHandleV1; caseRef: FinalHostPortV1["registry"]["ref"];
  attempt: ActivationAttemptRecordV1; child: ReturnType<typeof childInput>; controllerChildRef: string; connection: Base91["db"] }
export interface T2Fixture93 extends Base91 {
  host93: ReturnType<typeof allocateFinalCase93>; finalHost: FinalHostPortV1; preparation: ReturnType<typeof prepare> | null;
  drainCase: ReturnType<typeof transitionCase> | null; childControllerRef: string | null; closed: boolean;
  defect(name: string, ready: T2Ready93): void; makeAttemptStale(ready: T2Ready93): void; expireControllerAfterAppend(): void;
  originState(generation: string): string; close(): void;
}
function noteLast(x: T2Fixture93, operation: string) {
  const event = x.events.read("author").at(-1)!, already = x.host93.logs.own.entries.some(entry => entry.ownEventKey === event.key);
  const operational = !["g3_activation_attempt", "g3_activation_outcome"].includes(event.kind);
  x.host93.note("own", operation, document("l8-host-observed-control93", { version: "l8-host-observed-control93", eventKey: event.key, digest: event.digest }).ref,
    !already && operational ? event.key : null);
}
export function t2Fixture(options: { asset?: AssetFault93; engaged?: boolean } = {}): T2Fixture93 {
  const host = allocateFinalCase93(), f = host.source, sealed = sealExecutionEnvelopeV1(f.body);
  if (!sealed.ok) throw new Error(sealed.reasons.join(";"));
  const path = ownedPath(), db = openGraphGenerationFixture(path);
  try {
  const events = new EventLog(db), store = new GraphGenerationStoreV1(db, events);
  const originHostPort = host.assign(db, path), authority = new FixtureTrustedAuthorityV1(db, originHostPort);
  const finalHost = host.provider(db, path, options.asset ?? "valid"); authority.registerFinalHost(finalHost);
  const origin = registerOriginGrant(db, authority, f, path, host.grantSources());
  host.note("own", "register-source-controller", origin.grantRef);
  const acquired = acquisitionInput(), acquisitionRef = authority.registerResourceSource(document(acquired.version, acquired)), acquisition = authority.resolveResourceAcquisition(acquisitionRef);
  host.note("own", "register-source-controller", acquisitionRef);
  const controller = authority.register({ kind: "controller", missionId: "author", generationId: sealed.value.generationId, envelopeFingerprint: sealed.value.envelope.fingerprint,
    owner: "synthetic-parent", controllerFence: 0, expiresAtEvent: 8 }), handle = authority.resolve(controller);
  host.note("own", "register-source-controller", document("l8-host-controller-source93", { version: "l8-host-controller-source93", controllerRef: controller }).ref);
  store.installBootstrapA(handle, sealed.value, f.independent, 0, origin.grant);
  const x: T2Fixture93 = { f, sealed: sealed.value, db, events, store, authority, controller, handle, unitId: decoded<PlannerResult>(f.body.planning).units[0]!.unitId,
    path, acquisitionRef, acquisition, originGrant: origin.grant, originGrantRef: origin.grantRef, originHost: host, originHostPort,
    host93: host, finalHost, preparation: null, drainCase: null, childControllerRef: null, closed: false,
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
  if (options.engaged) { x.store.reserveFamily(x.handle, x.store.read("author"), x.unitId, 1000, 1, x.acquisition); }
  nextCandidateT2(x); return x;
  } catch (error) { db.close(); throw error; }
}
export function nextCandidateT2(x: T2Fixture93): void {
  const child = childInput(x), before = x.store.read("author"), preparation = x.store.prepareInitial(x.handle, before, child.origin, child.independent,
    x.originGrant, child.observationRef, x.events.cursor("author").time + 1);
  x.preparation = { child, before, preparation }; noteLast(x, "prepare-initial");
  const record: TransitionCaseV1 = { version: "l8-fixture-transition-a-case-v1", revision: 1, issuer: "synthetic-parent85", purpose: "request-drain",
    caseId: `t1-generation:${child.origin.generationId}`, candidateRef: preparation.candidateRef, preparationRef: preparation.document.ref, observationRef: child.observationRef,
    expectedHead: x.store.read("author"), counterRef: x.authority.preparationCounter(before.rootAccountId).document.ref, owner: before.owner, controllerFence: before.controllerFence };
  const ref = x.authority.registerTransitionDocument(document(record.version, record)); x.drainCase = { ref, record, handle: x.authority.resolveTransitionA(ref) };
  x.store.requestDrain(x.handle, x.store.read("author"), x.drainCase.handle, x.events.cursor("author").time + 1); noteLast(x, "request-drain"); x.childControllerRef = null;
}
/** HOST acquires raw rows itself OUTSIDE TX; does not invoke SUT inventory or
 * expectation builders. Source closure/producer allocation predates bootstrap.
 * Actual observed rows are INPUTS, never golden post-transition expectations. */
function captureHost93(x: T2Fixture93, staging: ReturnType<GraphGenerationStoreV1["retainCandidateForActivation"]>) {
  const rows = (table: string, order: string) => x.db.query(`SELECT * FROM ${table} ORDER BY ${order}`).all();
  const origins = rows("g3_origins", "mission,generation"), families = rows("g3_families", "mission,generation,unit"), units = rows("g3_units", "mission,generation,unit"), outboxes = rows("g3_outbox", "execution_id");
  const allAuthority = rows("g3_authority", "record_ref") as { kind: string; revision: number; revoked: number; document: string }[];
  const control = ["activation-case", "activation-attempt", "activation-receipt", "activation-counter", "activation-counter-current", "activation-outcome", "activation-result", "activation-record", "candidate-staging"];
  const sources = allAuthority.filter(row => !control.includes(row.kind)), asset = x.finalHost.asset, categories: Record<FinalCategoryV1, unknown[]> = {
    origins, families, units, executions: [], intents: [], outboxes, attemptsL6: [], claims: rows("g3_claims", "resource_key"), publications: [], publicationReadbacks: [],
    materializations: asset.readback ? [asset.readback] : [], materializationReadbacks: asset.readback ? [asset.readback] : [],
    proofs: [...sources.filter(row => row.kind === "observation"), asset.readback], releases: [], sourceCapabilities: sources,
    controllerLeases: sources.filter(row => row.kind === "controller"), physicalAllocations: [], stagedUnits: units.filter(row => (row as { state: string }).state === "STAGED"),
    stagedBlobs: allAuthority.filter(row => row.kind === "candidate-staging"), requiredFiles: [asset.lease] };
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
export function collectT2(x: T2Fixture93): T2Ready93 {
  const p = x.preparation!;
  if (!x.childControllerRef) {
    x.childControllerRef = x.authority.register({ kind: "controller", missionId: "author", generationId: p.child.origin.generationId,
      envelopeFingerprint: p.child.origin.envelope.fingerprint, owner: "synthetic-parent", controllerFence: 0, expiresAtEvent: 10000 });
    x.host93.note("own", "register-source-controller", document("l8-host-controller-source93", { version: "l8-host-controller-source93", controllerRef: x.childControllerRef }).ref);
  }
  const staging = x.store.retainCandidateForActivation(x.handle, x.store.read("author"), x.events.cursor("author").time + 1); noteLast(x, "retain-pointed-candidate-units");
  const raw = captureHost93(x, staging), before = x.store.read("author"), slots = x.store.slots("author"), counter = x.authority.activationCounter(before.rootAccountId);
  const sourceCapabilityRefs = [...raw.sources.flatMap((row, i) => row.kind !== "observation" ? [raw.refs[i]!] : []), x.finalHost.registry.ref, x.finalHost.asset.lease.ref];
  const expectations: ExpectationsT2V1 = { headRevision: before.revision, activeGenerationId: before.generationId, activePlanRevision: before.activePlanRevision,
    sourceMissionRevision: before.sourceMissionRevision, controllerFence: before.controllerFence, familyFences: [], knowledgeRevision: before.knowledgeRevision,
    knowledgeRootHash: before.knowledgeRootHash, knowledgeLedgerRevision: before.knowledgeLedgerRevision, knowledgeLedgerDigest: before.knowledgeLedgerDigest,
    inventoryRevision: before.inventoryRevision, inventoryDigest: x.finalHost.snapshot!.ref.sha256, inventoryRef: x.finalHost.snapshot!.ref,
    budgetLedgerRevision: before.budgetLedgerRevision, budgetLedgerDigest: before.budgetLedgerDigest,
    spentBySlot: slots.filter(s => ["SPENT", "BURNED"].includes(s.state)).map(s => ({ slotKey: s.slot_key, amount: s.debit })),
    encumberedBySlot: slots.filter(s => s.state === "ENCUMBERED").map(s => ({ slotKey: s.slot_key, amount: s.debit })),
    proofRecordRefs: [...raw.sources.flatMap((row, i) => row.kind === "observation" ? [raw.refs[i]!] : []), x.finalHost.asset.readback!.ref], releaseRecordRefs: [], sourceCapabilityRecordRefs: sourceCapabilityRefs,
    authorityRecords: raw.sources.map((row, i) => ({ recordRef: raw.refs[i]!, revision: row.revision,
      revocationRef: row.revoked ? document("l8-final-authority-revocation-v1", { version: "l8-final-authority-revocation-v1", recordRef: raw.refs[i]!, revision: row.revision }).ref : null })) };
  const value: FinalACaseV1 = { version: "l8-final-a-case-fixture-v1", issuer: "synthetic-host92", purpose: "activate-a-fixture", caseId: `final:${counter.value.usedAttempts + 1}`, revision: 1,
    hostCurrentRevision: x.finalHost.current!.revision,
    expectedHead: before, candidateRef: before.candidateRef!, barrierRootId: before.barrierRootId!, drainEntryRef: x.store.requestDrain(x.handle, x.drainCase!.record.expectedHead, x.drainCase!.handle, x.events.cursor("author").time).document.ref,
    finalInventoryRef: x.finalHost.snapshot!.ref, stagingRef: staging.document.ref, expectationsT2: expectations, activationCounterBeforeRef: counter.document.ref,
    activationAttemptOrdinal: counter.value.usedAttempts + 1, previousActivationAttemptId: counter.value.latestAttemptId, controllerChildRef: x.childControllerRef, sourceCapabilityRefs };
  const caseDoc = document(value.version, value); x.finalHost.cases.push({ document: caseDoc, revision: 1, currentRef: caseDoc.ref, revocationRef: null });
  const finalA = x.authority.resolveFinalA(caseDoc.ref), attempt = x.store.appendActivationAttempt(x.handle, before, finalA, x.events.cursor("author").time + 1);
  return { candidate: before.candidateRef!, expectedHead: before, finalA, caseRef: caseDoc.ref, attempt, child: p.child, controllerChildRef: x.childControllerRef, connection: x.db };
}
export function activateT2(x: T2Fixture93, ready: T2Ready93) {
  const handle = ready.connection === x.db ? ready.finalA : x.authority.resolveFinalA(ready.caseRef);
  const result = x.store.activateA(x.handle, ready.attempt.activationAttemptId, handle, x.events.cursor("author").time + 1);
  if (result.outcome === "COMMITTED") { if (x.controller !== ready.controllerChildRef) noteLast(x, "activate-a");
    x.controller = ready.controllerChildRef; x.handle = x.authority.resolve(x.controller); x.sealed = ready.child.origin; }
  return result;
}
export function reopenT2(x: T2Fixture93): T2Fixture93 {
  x.close(); const db = openGraphGenerationFixture(x.path), events = new EventLog(db), store = new GraphGenerationStoreV1(db, events), authority = new FixtureTrustedAuthorityV1(db);
  const provider = { ...x.finalHost, connection: db }; authority.registerFinalHost(provider);
  const y: T2Fixture93 = { ...x, db, events, store, authority, handle: authority.resolve(x.controller), finalHost: provider, closed: false,
    close() { if (!y.closed) { y.db.close(); y.closed = true; } } }; return y;
}
