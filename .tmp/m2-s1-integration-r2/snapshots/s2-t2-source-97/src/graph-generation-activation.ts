/**93 Private activation records and source capabilities. No IO or public API. */
import type { Database } from "bun:sqlite";
import type { ActivationAttemptV1, BoundDocument, ByteRef, CandidateRefV1, ExpectationsT2V1 } from "./graph-execution-envelope";
import { executionValueRefV1, assertExecutionJsonV1 } from "./graph-execution-envelope";
import type { GenerationViewV3 } from "./graph-generation-store";
import { EventLog, immutableCopy, invariant, integer } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import { closedResourceFieldsV1, resourceDocumentV1 } from "./graph-resource-ledger";
import { putTransitionDocumentV1, readTransitionDocumentV1 } from "./graph-generation-transition";
import { finalDocumentV1, verifyFinalAllocationV1, type FinalHostPortV1, type PolicyAssetReadbackV1 } from "./graph-final-inventory";

export interface CandidateStagingV1 { version: "l8-candidate-staging-fixture-v1"; candidateRef: CandidateRefV1; barrierRootId: string;
  unitIds: string[]; blobs: BoundDocument<unknown>[]; policyReadbackRef: ByteRef; policyReadback: BoundDocument<PolicyAssetReadbackV1>; rootLedgerDigest: string; knowledgeRef: ByteRef }
export interface FinalACaseV1 { version: "l8-final-a-case-fixture-v1"; issuer: "synthetic-host92"; purpose: "activate-a-fixture"; caseId: string; revision: number;
  hostCurrentRevision: number;
  expectedHead: GenerationViewV3; candidateRef: CandidateRefV1; barrierRootId: string; drainEntryRef: ByteRef; finalInventoryRef: ByteRef; stagingRef: ByteRef;
  expectationsT2: ExpectationsT2V1; activationCounterBeforeRef: ByteRef; activationAttemptOrdinal: number; previousActivationAttemptId: string | null;
  controllerChildRef: string; sourceCapabilityRefs: ByteRef[] }
export interface ActivationCounterV1 { version: "l8-activation-counter-fixture-v1"; rootAccountId: string; policySourceRef: ByteRef; maxActivationAttempts: number;
  revision: number; usedAttempts: number; previousRef: ByteRef | null; latestAttemptId: string | null;
  attempts: { ordinal: number; activationAttemptId: string; barrierRootId: string; candidateRef: CandidateRefV1; attemptRef: ByteRef }[] }
export interface ActivationAttemptRecordV1 { document: BoundDocument<ActivationAttemptV1>; value: ActivationAttemptV1; activationAttemptId: string;
  consumedCaseRef: ByteRef; expectedHead: GenerationViewV3; stagingRef: ByteRef; inventoryRef: ByteRef; controllerChildRef: string;
  counterBeforeRef: ByteRef; counterAfterRef: ByteRef; eventBefore: number; eventAfter: number }
export interface ActivationOutcomeV1 { version: "l8-activation-outcome-fixture-v1"; activationAttemptId: string; attemptRef: ByteRef; consumedCaseRef: ByteRef;
  outcome: "COMMITTED" | "REJECTED"; reason: string; headBefore: GenerationViewV3; headAfter: GenerationViewV3; activationRecordRef: ByteRef | null }
export interface ActivationCommitV1 { version: "l8-activation-record-fixture-v1"; activationAttemptId: string; attemptRef: ByteRef; consumedCaseRef: ByteRef;
  headBefore: GenerationViewV3; headAfter: GenerationViewV3; candidateRef: CandidateRefV1; stagingRef: ByteRef; knowledgeRef: ByteRef; childEnvelopeRef: ByteRef }
export interface ActivationResultV1 extends ActivationOutcomeV1 { document: BoundDocument<ActivationOutcomeV1> }
export function candidateStagingV1(db: Database, generation: string): { document: BoundDocument<CandidateStagingV1>; value: CandidateStagingV1 } | null {
  const rows = db.query("SELECT document FROM g3_authority WHERE kind='candidate-staging'").all() as { document: string }[];
  const matches = rows.map(row => JSON.parse(row.document) as BoundDocument<CandidateStagingV1>)
    .filter(doc => JSON.parse(doc.utf8).candidateRef.generationId === generation);
  invariant(matches.length <= 1, "HOLD: multiple staging records for pointed candidate");
  if (!matches.length) return null; const document = matches[0]!, value = readTransitionDocumentV1<CandidateStagingV1>(db, document.ref);
  invariant(canonical(value) === document.utf8, "HOLD: staging source changed"); return { document, value };
}
const brand = Symbol("private final-A activate purpose");
export interface FinalAHandleV1 { readonly [brand]: true }
const providers = new WeakMap<Database, FinalHostPortV1>(), handles = new WeakMap<object, { db: Database; ref: ByteRef }>();
function finalHostBindingV1(db: Database, provider: FinalHostPortV1, allowFirst: boolean): void {
  const binding = resourceDocumentV1({ version: "l8-final-host-prebootstrap-binding-v1", registry: provider.registry,
    creationBeforeBootstrapRef: provider.creationBeforeBootstrapRef, assetLease: provider.asset.lease, allocation: provider.allocation, parentAssignment: provider.parentAssignment });
  const old = db.query("SELECT document,digest,revision,revoked FROM g3_authority WHERE record_ref=? AND kind='final-host-source'").get("final-host-prebootstrap") as { document: string; digest: string; revision: number; revoked: number } | null;
  if (old) { invariant(old.revision === 1 && !old.revoked && old.document === canonical(binding) && old.digest === fingerprint(binding), "HOLD: final HOST prebootstrap source binding changed/revoked"); return; }
  invariant(allowFirst && !db.query("SELECT 1 FROM g3_origins UNION ALL SELECT 1 FROM g3_head UNION ALL SELECT 1 FROM ff8_events").get(),
    "HOLD: final producer closure must be installed before bootstrap, not retrofitted");
  const journals = provider.journals.map(doc => finalDocumentV1(doc));
  invariant(journals.length === 2 && journals.find(j => j.producerId === "own-control92")?.lastSequence === 0
    && journals.every(j => canonical(j.creationRef) === canonical(finalDocumentV1(provider.registry).allocationRef)), "HOLD: final producer allocation/journals not retained before bootstrap");
  db.query("INSERT INTO g3_authority VALUES(?,'final-host-source',1,?,?,0)").run("final-host-prebootstrap", canonical(binding), fingerprint(binding));
}
export function installFinalHostV1(db: Database, provider: FinalHostPortV1): void {
  invariant(provider.connection === db && (!providers.has(db) || providers.get(db) === provider), "HOLD: final HOST provider connection/ownership replacement");
  // Allocation/closed producer records must have been retained by the independent
  // HOST before bootstrap; this installation never derives them from OWN/candidate.
  finalDocumentV1(provider.registry); verifyFinalAllocationV1(db, provider); invariant(provider.creationBeforeBootstrapRef, "HOLD: final producer creation provenance missing");
  finalHostBindingV1(db, provider, true); providers.set(db, provider);
}
export function finalHostV1(db: Database): FinalHostPortV1 {
  const provider = providers.get(db); invariant(provider && provider.connection === db, "HOLD: final HOST provider missing"); finalHostBindingV1(db, provider, false); return provider;
}
export function resolveFinalAV1(db: Database, ref: ByteRef): FinalAHandleV1 {
  const handle: FinalAHandleV1 = Object.freeze({ [brand]: true as const }); handles.set(handle, { db, ref: immutableCopy(ref) });
  const current = currentFinalAV1(db, handle);
  invariant(canonical(putTransitionDocumentV1(db, current.value, "activation-case").ref) === canonical(ref), "HOLD: final-A source retention mismatch"); return handle;
}
export function currentFinalAV1(db: Database, handle: FinalAHandleV1) {
  const pin = handle && typeof handle === "object" ? handles.get(handle) : undefined;
  invariant(pin && pin.db === db, "HOLD: distinct final-A activation handle required"); const port = finalHostV1(db);
  invariant(port.current && !port.current.revocationRef, "HOLD: final HOST capability revoked/unknown");
  const registry = finalDocumentV1(port.registry);
  invariant(canonical(port.current.registryRef) === canonical(port.registry.ref)
    && canonical(registry.producers.map(p => p.producerId).sort()) === canonical(["own-control92", "parent-policy-file92"])
    && port.asset.current && !port.asset.current.revocationRef && !port.asset.current.unknownWriterRef,
    "HOLD: final source/producer/file capability current unknown");
  const record = port.cases.find(row => canonical(row.document.ref) === canonical(pin.ref));
  invariant(record && !record.revocationRef && canonical(record.currentRef) === canonical(pin.ref), "HOLD: final-A case current unavailable/revoked");
  const value = finalDocumentV1(record.document) as FinalACaseV1;
  integer(value.revision, 1); integer(value.hostCurrentRevision, 1); integer(value.activationAttemptOrdinal, 1);
  closedResourceFieldsV1(value, ["version", "issuer", "purpose", "caseId", "revision", "hostCurrentRevision", "expectedHead", "candidateRef", "barrierRootId", "drainEntryRef", "finalInventoryRef", "stagingRef",
    "expectationsT2", "activationCounterBeforeRef", "activationAttemptOrdinal", "previousActivationAttemptId", "controllerChildRef", "sourceCapabilityRefs"]);
  closedResourceFieldsV1(value.expectationsT2, ["headRevision", "activeGenerationId", "activePlanRevision", "sourceMissionRevision", "controllerFence", "familyFences",
    "knowledgeRevision", "knowledgeRootHash", "knowledgeLedgerRevision", "knowledgeLedgerDigest", "inventoryRevision", "inventoryDigest", "inventoryRef", "budgetLedgerRevision", "budgetLedgerDigest",
    "spentBySlot", "encumberedBySlot", "proofRecordRefs", "releaseRecordRefs", "sourceCapabilityRecordRefs", "authorityRecords"]);
  invariant(value.version === "l8-final-a-case-fixture-v1" && value.issuer === "synthetic-host92" && value.purpose === "activate-a-fixture"
    && value.revision === record.revision && value.revision >= 1, "HOLD: final-A purpose/source/version mismatch");
  const persisted = db.query("SELECT 1 FROM g3_authority WHERE record_ref=?").get(`transition:${canonical(pin.ref)}`);
  if (persisted) invariant(canonical(readTransitionDocumentV1<FinalACaseV1>(db, pin.ref)) === canonical(value), "HOLD: final-A source revoked/changed");
  return { value: immutableCopy(value), ref: immutableCopy(pin.ref), port };
}
type Pointer = { revision: number; document: string; digest: string; revoked: number };
export function activationCounterV1(db: Database, root: string) {
  const row = db.query("SELECT revision,document,digest,revoked FROM g3_authority WHERE record_ref=? AND kind='activation-counter-current'").get(`activation-counter:${root}`) as Pointer | null;
  invariant(row && !row.revoked && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: activation root counter unknown/corrupt");
  const ref = JSON.parse(row.document) as ByteRef, value = readTransitionDocumentV1<ActivationCounterV1>(db, ref);
  invariant(value.rootAccountId === root && value.revision === row.revision && value.usedAttempts === value.attempts.length && value.revision === value.usedAttempts + 1
    && value.usedAttempts <= value.maxActivationAttempts && value.maxActivationAttempts === 2, "HOLD: activation root counter history/ceiling mismatch");
  value.attempts.forEach((attempt, i) => { const retained = activationAttemptV1(db, attempt.activationAttemptId);
    invariant(attempt.ordinal === i + 1 && retained.value.activationAttemptOrdinal === i + 1
      && retained.value.previousActivationAttemptId === (i === 0 ? null : value.attempts[i - 1]!.activationAttemptId)
      && canonical(retained.document.ref) === canonical(attempt.attemptRef) && canonical(retained.value.candidateRef) === canonical(attempt.candidateRef)
      && retained.value.barrierRootId === attempt.barrierRootId, "HOLD: activation attempt chain reset/incomplete");
    const before = readTransitionDocumentV1<ActivationCounterV1>(db, retained.counterBeforeRef, true), after = readTransitionDocumentV1<ActivationCounterV1>(db, retained.counterAfterRef, true);
    invariant(before.usedAttempts === i && after.usedAttempts === i + 1 && canonical(after.previousRef) === canonical(retained.counterBeforeRef)
      && canonical(before.attempts) === canonical(value.attempts.slice(0, i)) && canonical(after.attempts) === canonical(value.attempts.slice(0, i + 1))
      && canonical(after.policySourceRef) === canonical(value.policySourceRef), "HOLD: activation counter prefix reset/divergence");
    activationOutcomeV1(db, attempt.activationAttemptId);
  });
  const controlEvents = db.query("SELECT key FROM ff8_events WHERE kind IN ('g3_activation_attempt','g3_activation_outcome','g3_generation_activated')").all() as { key: string }[];
  invariant(controlEvents.every(event => value.attempts.some(attempt => event.key === `activation-attempt:${attempt.activationAttemptId}` || event.key === `activation-outcome:${attempt.activationAttemptId}`)), "HOLD: orphan activation control event");
  const allowedDocs = { "activation-counter": new Set([canonical(ref)]), "activation-attempt": new Set<string>(), "activation-outcome": new Set<string>(), "activation-record": new Set<string>() };
  const receiptKeys = new Set<string>(), resultKeys = new Set<string>();
  for (const entry of value.attempts) {
    const receipt = activationAttemptV1(db, entry.activationAttemptId), outcome = activationOutcomeV1(db, entry.activationAttemptId);
    allowedDocs["activation-counter"].add(canonical(receipt.counterBeforeRef)); allowedDocs["activation-counter"].add(canonical(receipt.counterAfterRef));
    allowedDocs["activation-attempt"].add(canonical(receipt.document.ref)); receiptKeys.add(`activation-attempt:${entry.activationAttemptId}`);
    if (outcome) { allowedDocs["activation-outcome"].add(canonical(outcome.document.ref)); resultKeys.add(`activation-result:${entry.activationAttemptId}`);
      if (outcome.activationRecordRef) allowedDocs["activation-record"].add(canonical(outcome.activationRecordRef)); }
  }
  const rows = db.query("SELECT record_ref,kind,document FROM g3_authority WHERE kind IN ('activation-counter','activation-attempt','activation-receipt','activation-outcome','activation-result','activation-record')").all() as { record_ref: string; kind: string; document: string }[];
  for (const record of rows) {
    if (record.kind === "activation-receipt") invariant(receiptKeys.has(record.record_ref), "HOLD: orphan activation receipt");
    else if (record.kind === "activation-result") invariant(resultKeys.has(record.record_ref), "HOLD: orphan activation result");
    else { const key = canonical(JSON.parse(record.document).ref), set = allowedDocs[record.kind as keyof typeof allowedDocs];
      invariant(set.has(key) && record.record_ref === `transition:${key}`, "HOLD: orphan/aliased activation control document"); }
  }
  invariant((db.query("SELECT count(*) AS n FROM g3_authority WHERE kind='activation-counter-current'").get() as { n: number }).n === 1, "HOLD: orphan activation counter namespace");
  invariant(value.latestAttemptId === (value.attempts.at(-1)?.activationAttemptId ?? null), "HOLD: activation latest counter identity mismatch");
  return { document: { ref, utf8: canonical(value) }, value };
}
export function initializeActivationCounterV1(db: Database, root: string, policyRef: ByteRef, ceiling: number): void {
  invariant(ceiling === 2, "HOLD: fixture activation policy must retain acquired2");
  if (db.query("SELECT 1 FROM g3_authority WHERE record_ref=?").get(`activation-counter:${root}`)) {
    const old = activationCounterV1(db, root); invariant(canonical(old.value.policySourceRef) === canonical(policyRef), "HOLD: root activation policy changed"); return;
  }
  invariant(!db.query("SELECT 1 FROM g3_authority WHERE kind IN ('activation-counter','activation-attempt')").get(), "HOLD: no reset of missing activation counter");
  const value: ActivationCounterV1 = { version: "l8-activation-counter-fixture-v1", rootAccountId: root, policySourceRef: policyRef, maxActivationAttempts: ceiling,
    revision: 1, usedAttempts: 0, previousRef: null, latestAttemptId: null, attempts: [] };
  const doc = putTransitionDocumentV1(db, value, "activation-counter");
  db.query("INSERT INTO g3_authority VALUES(?,'activation-counter-current',1,?,?,0)").run(`activation-counter:${root}`, canonical(doc.ref), fingerprint(doc.ref));
}
export function activationAttemptV1(db: Database, id: string): ActivationAttemptRecordV1 {
  const row = db.query("SELECT document,digest FROM g3_authority WHERE record_ref=? AND kind='activation-receipt'").get(`activation-attempt:${id}`) as { document: string; digest: string } | null;
  invariant(row && row.digest === fingerprint(JSON.parse(row.document)), "HOLD: immutable activation attempt missing/corrupt");
  const receipt = JSON.parse(row.document) as ActivationAttemptRecordV1, value = readTransitionDocumentV1<ActivationAttemptV1>(db, receipt.document.ref, true);
  invariant(canonical(value) === canonical(receipt.value) && canonical(value) === receipt.document.utf8
    && `l8act:${executionValueRefV1("l8-activation-attempt-v1", value).sha256}` === id && receipt.activationAttemptId === id,
    "HOLD: immutable activation attempt identity changed");
  const rowEvent = db.query("SELECT kind,time,payload,unit_id,digest,sequence FROM ff8_events WHERE mission=? AND key=?").get(receipt.expectedHead.missionId, `activation-attempt:${id}`) as { kind: string; time: number; payload: string; unit_id: string | null; digest: string; sequence: number } | null;
  invariant(rowEvent && rowEvent.kind === "g3_activation_attempt" && rowEvent.sequence === receipt.eventAfter && receipt.eventAfter === receipt.eventBefore + 1
    && rowEvent.payload === canonical(receipt) && rowEvent.digest === fingerprint({ kind: rowEvent.kind, time: rowEvent.time, payload: JSON.parse(rowEvent.payload), unitId: rowEvent.unit_id }), "HOLD: activation attempt journal/receipt mismatch");
  return immutableCopy(receipt);
}
export function appendAttemptV1(db: Database, events: EventLog, c: ReturnType<typeof currentFinalAV1>, now: number): ActivationAttemptRecordV1 {
  const body: ActivationAttemptV1 = { version: "l8-activation-attempt-v1", activationAttemptOrdinal: c.value.activationAttemptOrdinal,
    previousActivationAttemptId: c.value.previousActivationAttemptId, candidateRef: c.value.candidateRef, barrierRootId: c.value.barrierRootId,
    drainEntryRef: c.value.drainEntryRef, replacementRecordRef: null, expectationsT2: c.value.expectationsT2, authorizationKind: "transition-a-fixture-v1",
    finalAdoption: null, authorityRecordRefs: [c.ref, ...c.value.sourceCapabilityRefs] };
  assertExecutionJsonV1(body); const id = `l8act:${executionValueRefV1(body.version, body).sha256}`;
  if (db.query("SELECT 1 FROM g3_authority WHERE record_ref=?").get(`activation-attempt:${id}`)) {
    const old = activationAttemptV1(db, id); invariant(canonical(old.consumedCaseRef) === canonical(c.ref), "HOLD: changed activation attempt retry"); return old;
  }
  const before = activationCounterV1(db, c.value.expectedHead.rootAccountId);
  invariant(canonical(before.document.ref) === canonical(c.value.activationCounterBeforeRef) && before.value.usedAttempts < before.value.maxActivationAttempts
    && c.value.activationAttemptOrdinal === before.value.usedAttempts + 1 && c.value.previousActivationAttemptId === before.value.latestAttemptId,
    "HOLD: activation attempt root ceiling/stale chain");
  const document = putTransitionDocumentV1(db, body, "activation-attempt"), next: ActivationCounterV1 = { ...before.value, revision: before.value.revision + 1,
    usedAttempts: before.value.usedAttempts + 1, previousRef: before.document.ref, latestAttemptId: id,
    attempts: [...before.value.attempts, { ordinal: body.activationAttemptOrdinal, activationAttemptId: id, barrierRootId: body.barrierRootId, candidateRef: body.candidateRef, attemptRef: document.ref }] };
  const counter = putTransitionDocumentV1(db, next, "activation-counter"), eventBefore = events.cursor(c.value.expectedHead.missionId).sequence;
  const receipt: ActivationAttemptRecordV1 = { document, value: body, activationAttemptId: id, consumedCaseRef: c.ref, expectedHead: c.value.expectedHead,
    stagingRef: c.value.stagingRef, inventoryRef: c.value.finalInventoryRef, controllerChildRef: c.value.controllerChildRef,
    counterBeforeRef: before.document.ref, counterAfterRef: counter.ref, eventBefore, eventAfter: eventBefore + 1 };
  db.query("INSERT INTO g3_authority VALUES(?,'activation-receipt',1,?,?,0)").run(`activation-attempt:${id}`, canonical(receipt), fingerprint(receipt));
  invariant(db.query("UPDATE g3_authority SET revision=?,document=?,digest=? WHERE record_ref=? AND revision=? AND digest=? AND revoked=0")
    .run(next.revision, canonical(counter.ref), fingerprint(counter.ref), `activation-counter:${next.rootAccountId}`, before.value.revision, fingerprint(before.document.ref)).changes === 1, "HOLD: activation counter CAS lost");
  events.append(c.value.expectedHead.missionId, `activation-attempt:${id}`, "g3_activation_attempt", now, receipt, null, eventBefore);
  return immutableCopy(receipt);
}
export function activationOutcomeV1(db: Database, id: string): ActivationResultV1 | null {
  const row = db.query("SELECT document,digest FROM g3_authority WHERE record_ref=? AND kind='activation-result'").get(`activation-result:${id}`) as { document: string; digest: string } | null;
  if (!row) return null; invariant(row.digest === fingerprint(JSON.parse(row.document)), "HOLD: activation result corrupt");
  const result = JSON.parse(row.document) as ActivationResultV1;
  const value = readTransitionDocumentV1<ActivationOutcomeV1>(db, result.document.ref, true), { document: _doc, ...rest } = result;
  invariant(canonical(value) === canonical(rest) && value.activationAttemptId === id, "HOLD: activation result/outcome mismatch");
  const attempt = activationAttemptV1(db, id);
  invariant(canonical(value.attemptRef) === canonical(attempt.document.ref) && canonical(value.consumedCaseRef) === canonical(attempt.consumedCaseRef), "HOLD: activation outcome/consumed attempt identity mismatch");
  if (value.outcome === "COMMITTED") {
    invariant(value.activationRecordRef, "HOLD: committed outcome lacks activation record");
    const activation = readTransitionDocumentV1<ActivationCommitV1>(db, value.activationRecordRef, true);
    invariant(activation.activationAttemptId === id && canonical(activation.attemptRef) === canonical(attempt.document.ref)
      && canonical(activation.consumedCaseRef) === canonical(value.consumedCaseRef) && canonical(activation.headBefore) === canonical(value.headBefore)
      && canonical(activation.headAfter) === canonical(value.headAfter) && canonical(activation.candidateRef) === canonical(attempt.value.candidateRef)
      && canonical(activation.stagingRef) === canonical(attempt.stagingRef) && canonical(activation.childEnvelopeRef) === canonical(attempt.value.candidateRef.envelopeRef), "HOLD: activation record/outcome/attempt join mismatch");
  } else invariant(value.activationRecordRef === null, "HOLD: rejected outcome cannot reference activation");
  const event = db.query("SELECT kind,time,payload,unit_id,digest FROM ff8_events WHERE mission=? AND key=?").get(value.headBefore.missionId, `activation-outcome:${id}`) as { kind: string; time: number; payload: string; unit_id: string | null; digest: string } | null;
  invariant(event && event.kind === (value.outcome === "COMMITTED" ? "g3_generation_activated" : "g3_activation_outcome") && event.payload === canonical(result)
    && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: JSON.parse(event.payload), unitId: event.unit_id }), "HOLD: activation outcome journal missing/corrupt");
  return immutableCopy(result);
}
export function writeActivationOutcomeV1(db: Database, events: EventLog, value: ActivationOutcomeV1, now: number): ActivationResultV1 {
  integer(now); invariant(!activationOutcomeV1(db, value.activationAttemptId), "HOLD: activation outcome already committed");
  const document = putTransitionDocumentV1(db, value, "activation-outcome"), result = { ...value, document };
  db.query("INSERT INTO g3_authority VALUES(?,'activation-result',1,?,?,0)").run(`activation-result:${value.activationAttemptId}`, canonical(result), fingerprint(result));
  events.append(value.headBefore.missionId, `activation-outcome:${value.activationAttemptId}`, value.outcome === "COMMITTED" ? "g3_generation_activated" : "g3_activation_outcome", now, result);
  return immutableCopy(result);
}
