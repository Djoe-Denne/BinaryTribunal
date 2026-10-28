/**120 Private synchronous replacement readers/types; no high-level VALUE imports. */
import { enterLocal145, leaveLocal145 } from "./graph-local-measure145";
import type { Database } from "bun:sqlite";
import type { ByteRef, BoundDocument, CandidateRefV1, CandidateReplacementV1, IndependentlyLoadedSourcesV1, ParsedExecutionEnvelopeV1 } from "./graph-execution-envelope";
import type { GenerationViewV3 } from "./graph-generation-store";
import type { TransitionObservationV1 } from "./graph-generation-transition";
import { bindExecutionSourcesV1, makeGraphRunV3, assertExecutionJsonV1 } from "./graph-execution-envelope";
import { EventLog, immutableCopy, invariant, integer } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import { resourceDocumentV1, closedResourceFieldsV1 } from "./graph-resource-ledger";

export interface ReplacementAllocation120 {
  version: "l8-replacement-host-allocation120"; issuer: "independent-fixture-host120";
  connectionPath: string; owner: string; missionId: string; lineageId: string; rootAccountId: string;
  parentGenerationId: string; bootstrapEnvelopeRef: ByteRef; sourcePolicyRef: ByteRef; maxCandidateReplacements: 1; maxActivationAttempts: 2;
}
export interface ReplacementSource120 { version: "l8-replacement-host-source120"; allocationRef: ByteRef; revision: number; independent: IndependentlyLoadedSourcesV1 }
export interface ReplacementCurrent120 { version: "l8-replacement-host-current120"; revision: number; allocationRef: ByteRef; sourceRef: ByteRef; revokedRefs: ByteRef[] }
export interface ReplacementCase120 {
  version: "l8-replacement-host-case120"; purpose: "REPLACE"; requestId: string; allocationRef: ByteRef; sourceBindingsRef: ByteRef;
  currentRef: ByteRef; stageRef: ByteRef; expectedHead: GenerationViewV3; inventoryDigest: string; eventSequence: number;
  drainEntryRef: ByteRef; owner: string; controllerFence: number; policySourceRef: ByteRef;
}
export interface ReplacementHostRecords120 {
  allocation: BoundDocument<ReplacementAllocation120>; sources: BoundDocument<ReplacementSource120>[];
  current: BoundDocument<ReplacementCurrent120> | null; cases: BoundDocument<ReplacementCase120>[];
}
export interface ReplacementHostPort120 {
  readonly connection: Database; records: ReplacementHostRecords120 | null;
  /** Optional shared cache invalidation, never authority. A serialized thread
   * snapshot must carry its observed epoch; HOST invalidates before changing it. */
  readonly epoch?: Int32Array; readonly observedEpoch?: number;
}
export interface ReplacementCounter120 {
  version: "l8-replacement-counter120"; rootAccountId: string; policySourceRef: ByteRef; ceiling: 1; revision: number; used: number;
  previousRef: ByteRef | null; records: ByteRef[]; allocationRef: ByteRef; bootstrapGenerationId: string; bootstrapSourceDigest: string;
}
export interface ReplacementStageValue120 {
  version: "l8-replacement-stage120"; oldCandidateRef: CandidateRefV1; newCandidateRef: CandidateRefV1; barrierRootId: string;
  drainEntryRef: ByteRef; sourceBindingsRef: ByteRef; sourceCurrentRef: ByteRef; observationRef: ByteRef;
  headBefore: GenerationViewV3; headAfter: GenerationViewV3; inventoryBefore: ReturnType<typeof replacementInventory120>; inventoryAfter: ReturnType<typeof replacementInventory120>;
  eventBefore: number; eventAfter: number; preparationCounterRef: ByteRef; sourceDigest: string; grantRef: ByteRef;
  blobs: BoundDocument<unknown>[]; unitIds: string[];
}
export interface ReplacementStage120 { document: BoundDocument<ReplacementStageValue120>; value: ReplacementStageValue120 }
export interface ReplacementRecord120 extends CandidateReplacementV1 { version: "l8-candidate-replacement120" }
export interface ReplacementProof120 {
  version: "l8-replacement-proof120"; recordRef: ByteRef; stageRef: ByteRef; caseRef: ByteRef; sourceCurrentRef: ByteRef;
  headBefore: GenerationViewV3; headAfter: GenerationViewV3; inventoryBefore: ReturnType<typeof replacementInventory120>; inventoryAfter: ReturnType<typeof replacementInventory120>;
  counterBeforeRef: ByteRef; counterAfterRef: ByteRef; eventBefore: number; eventAfter: number; eventKey: string; reason: "superseded-by-explicit-replacement";
}
export interface ReplacementResult120 { document: BoundDocument<ReplacementRecord120>; value: ReplacementRecord120; proofRef: ByteRef }
/**124 Consumed private evidence, never a replacement handle or new authority. */
export interface ReplacementActivationEvidence124 {
  version: "l8-replacement-activation-evidence124"; replacementRecordRef: ByteRef; replacementProofRef: ByteRef;
  replacementCaseRef: ByteRef; finalCaseRef: ByteRef; finalInventoryRef: ByteRef;
  currentRef: ByteRef; sourceRef: ByteRef; cacheEpoch: number | null; records: ReplacementHostRecords120;
}
export const replacementKinds120 = ["replacement-host-allocation120", "replacement-host-source120", "replacement-host-current120", "replacement-host-current-record120", "replacement-host-case120",
  "replacement-counter120", "replacement-counter-current120", "replacement-stage120", "replacement-record120", "replacement-proof120"];
export function exactReplacementDocument120<T extends { version: string }>(doc: BoundDocument<T>): T {
  invariant(doc && typeof doc === "object" && typeof doc.utf8 === "string", "HOLD: replacement source bytes/ref");
  assertExecutionJsonV1(doc); const value = JSON.parse(doc.utf8) as T;
  invariant(canonical(resourceDocumentV1(value)) === canonical(doc), "HOLD: replacement source bytes/ref"); return immutableCopy(value);
}
export function readReplacementDocument120<T extends { version: string }>(db: Database, ref: ByteRef, kind?: string, live = false): { document: BoundDocument<T>; value: T } {
  const row = db.query("SELECT kind,revision,document,digest,revoked FROM g3_authority WHERE record_ref=?").get(`transition:${canonical(ref)}`) as { kind: string; revision: number; document: string; digest: string; revoked: number } | null;
  invariant(row && (!kind || row.kind === kind) && (row.revoked === 0 || row.revoked === 1) && row.revision === 1 + row.revoked
    && (!live || !row.revoked) && row.digest === fingerprint(JSON.parse(row.document)), "HOLD: replacement retained record missing/corrupt/revoked");
  const document = JSON.parse(row.document) as BoundDocument<T>, value = exactReplacementDocument120(document);
  const versions: Record<string, string> = { "replacement-host-allocation120": "l8-replacement-host-allocation120", "replacement-host-source120": "l8-replacement-host-source120",
    "replacement-host-current-record120": "l8-replacement-host-current120", "replacement-host-case120": "l8-replacement-host-case120", "replacement-counter120": "l8-replacement-counter120",
    "replacement-stage120": "l8-replacement-stage120", "replacement-record120": "l8-candidate-replacement120", "replacement-proof120": "l8-replacement-proof120", "origin-counter-record": "l8-fixture-origin-counter-v1",
    "transition-source": "l8-fixture-transition-observation-v1" };
  invariant(canonical(document.ref) === canonical(ref) && versions[row.kind] === value.version, "HOLD: replacement retained ref/version mismatch"); return { document, value };
}
export function replacementDocuments120<T extends { version: string }>(db: Database, kind: string) {
  const rows = db.query("SELECT document,digest FROM g3_authority WHERE kind=? ORDER BY record_ref").all(kind) as { document: string; digest: string }[];
  return rows.map(row => { invariant(row.digest === fingerprint(JSON.parse(row.document)), "HOLD: replacement record corruption");
    const doc = JSON.parse(row.document) as BoundDocument<T>; return readReplacementDocument120<T>(db, doc.ref, kind); });
}
export function replacementInventory120(db: Database) {
  const rows = (table: string, order: string) => db.query(`SELECT * FROM ${table} ORDER BY ${order}`).all();
  return immutableCopy({ origins: rows("g3_origins", "mission,generation"), units: rows("g3_units", "mission,generation,unit"),
    families: rows("g3_families", "mission,generation,unit"), claims: rows("g3_claims", "resource_key"), outboxes: rows("g3_outbox", "execution_id"),
    slots: rows("g3_slots", "root_id,slot_key"), roots: rows("g3_root", "root_id"),
    sources: (rows("g3_authority", "record_ref") as { kind: string }[]).filter(row => ["controller", "observation", "resource-acquisition", "resource-assignment", "resource-remaining", "resource-current"].includes(row.kind)) });
}
/** Exact retained proof/event join, shared by counter/history/activation readers.
 * Reads only; never constructs an EventLog (whose constructor would issue DDL). */
export function replacementProofForRecord120(db: Database, ref: ByteRef) {
  const record = readReplacementDocument120<ReplacementRecord120>(db, ref, "replacement-record120");
  const proofs = replacementDocuments120<ReplacementProof120>(db, "replacement-proof120").filter(p => canonical(p.value.recordRef) === canonical(ref));
  invariant(proofs.length === 1, "HOLD: replacement retained proof missing/ambiguous"); const proof = proofs[0]!, p = proof.value;
  const result = { ...record, proofRef: proof.document.ref };
  const event = db.query("SELECT kind,sequence,time,unit_id,payload,digest FROM ff8_events WHERE mission=? AND key=?").get(p.headBefore.missionId, p.eventKey) as
    { kind: string; sequence: number; time: number; unit_id: string | null; payload: string; digest: string } | null;
  invariant(event?.kind === "g3_candidate_replaced" && event.sequence === p.eventAfter && event.unit_id === null && event.payload === canonical(result)
    && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: result, unitId: null }), "HOLD: replacement counter event/proof mismatch"); return { record, proof };
}
/** History-only audit. LIVE consumption is exclusively in trusted-authority. */
export function assertReplacementActivationEvidence124(db: Database, evidence: ReplacementActivationEvidence124, replacementRef: ByteRef, finalCaseRef: ByteRef, inventoryRef: ByteRef): void {
  assertExecutionJsonV1(evidence);
  closedResourceFieldsV1(evidence, ["version", "replacementRecordRef", "replacementProofRef", "replacementCaseRef", "finalCaseRef", "finalInventoryRef", "currentRef", "sourceRef", "cacheEpoch", "records"]);
  invariant(evidence.version === "l8-replacement-activation-evidence124" && canonical(evidence.replacementRecordRef) === canonical(replacementRef)
    && canonical(evidence.finalCaseRef) === canonical(finalCaseRef) && canonical(evidence.finalInventoryRef) === canonical(inventoryRef), "HOLD: replacement activation consumed final/attempt link");
  if (evidence.cacheEpoch !== null) integer(evidence.cacheEpoch);
  const { record, proof } = replacementProofForRecord120(db, replacementRef), records = evidence.records;
  invariant(canonical(proof.document.ref) === canonical(evidence.replacementProofRef) && canonical(proof.value.caseRef) === canonical(evidence.replacementCaseRef)
    && canonical(record.value.sourceBindingsRef) === canonical(evidence.sourceRef) && records.current
    && canonical(records.current.ref) === canonical(evidence.currentRef), "HOLD: replacement activation consumed replacement/current link");
  closedResourceFieldsV1(records, ["allocation", "sources", "current", "cases"]);
  const current = exactReplacementDocument120<ReplacementCurrent120>(records.current), allocation = exactReplacementDocument120<ReplacementAllocation120>(records.allocation);
  const c = records.cases.find(doc => canonical(doc.ref) === canonical(evidence.replacementCaseRef));
  const source = records.sources.find(doc => canonical(doc.ref) === canonical(evidence.sourceRef));
  invariant(c && source && canonical(current.sourceRef) === canonical(source.ref) && canonical(current.allocationRef) === canonical(records.allocation.ref)
    && allocation.rootAccountId === proof.value.headBefore.rootAccountId && allocation.owner === proof.value.headBefore.owner
    && allocation.parentGenerationId === proof.value.headBefore.generationId
    && !current.revokedRefs.some(ref => [c.ref, source.ref, records.allocation.ref].some(consumed => canonical(ref) === canonical(consumed))), "HOLD: replacement activation consumed source/capability revoked or unjoined");
  const cap = exactReplacementDocument120<ReplacementCase120>(c);
  invariant(cap.purpose === "REPLACE" && canonical(cap.stageRef) === canonical(proof.value.stageRef)
    && canonical(cap.sourceBindingsRef) === canonical(source.ref) && canonical(cap.allocationRef) === canonical(records.allocation.ref), "HOLD: replacement activation consumed case/source join");
  // These retained byte comparisons deliberately ignore today's revoked flags.
  for (const [doc, kind] of [[records.allocation, "replacement-host-allocation120"], [records.current, "replacement-host-current-record120"],
    ...records.sources.map(doc => [doc, "replacement-host-source120"] as const), ...records.cases.map(doc => [doc, "replacement-host-case120"] as const)] as const) {
    exactReplacementDocument120(doc);
    invariant(canonical(readReplacementDocument120(db, doc.ref, kind).document) === canonical(doc), "HOLD: replacement activation consumed retained bytes changed");
  }
}
export function readReplacementCounter120(db: Database, events: EventLog, root: string) {
  const row = db.query("SELECT revision,document,digest,revoked FROM g3_authority WHERE record_ref=? AND kind='replacement-counter-current120'").get(`replacement-counter:${root}`) as { revision: number; document: string; digest: string; revoked: number } | null;
  invariant(row && !row.revoked && row.digest === fingerprint(JSON.parse(row.document)), "HOLD: replacement counter unknown/corrupt");
  const ref = JSON.parse(row.document) as ByteRef, counter = readReplacementDocument120<ReplacementCounter120>(db, ref, "replacement-counter120"), c = counter.value;
  closedResourceFieldsV1(c, ["version", "rootAccountId", "policySourceRef", "ceiling", "revision", "used", "previousRef", "records", "allocationRef", "bootstrapGenerationId", "bootstrapSourceDigest"]);
  integer(c.used); integer(c.revision, 1);
  invariant(c.rootAccountId === root && c.ceiling === 1 && c.used <= 1 && c.records.length === c.used && c.revision === c.used + 1 && row.revision === c.revision, "HOLD: replacement counter reset/exhausted");
  const allocation = readReplacementDocument120<ReplacementAllocation120>(db, c.allocationRef, "replacement-host-allocation120").value;
  invariant(allocation.rootAccountId === root && allocation.maxCandidateReplacements === c.ceiling && canonical(allocation.sourcePolicyRef) === canonical(c.policySourceRef), "HOLD: replacement counter policy provenance");
  const bootstrap = events.read(allocation.missionId).find(e => e.key === `bootstrap:${c.bootstrapGenerationId}`);
  invariant(bootstrap?.kind === "g3_bootstrap_fixture" && (bootstrap.payload as GenerationViewV3).sourceDigest === c.bootstrapSourceDigest
    && (bootstrap.payload as GenerationViewV3).rootAccountId === root && allocation.parentGenerationId === c.bootstrapGenerationId, "HOLD: replacement counter lacks bootstrap provenance");
  const bootstrapRow = db.query("SELECT document,digest FROM g3_origins WHERE mission=? AND generation=?").get(allocation.missionId, c.bootstrapGenerationId) as { document: string; digest: string } | null;
  invariant(bootstrapRow && bootstrapRow.digest === c.bootstrapSourceDigest && bootstrapRow.digest === fingerprint(JSON.parse(bootstrapRow.document)), "HOLD: replacement initial policy origin lost");
  const bootstrapSource = JSON.parse(bootstrapRow.document) as { origin: ParsedExecutionEnvelopeV1 };
  invariant(canonical(bootstrapSource.origin.envelope.activationPolicy) === canonical({ sourcePolicyRef: allocation.sourcePolicyRef,
    maxCandidateReplacements: allocation.maxCandidateReplacements, maxActivationAttempts: allocation.maxActivationAttempts }), "HOLD: replacement initial T0 policy changed");
  invariant(replacementDocuments120(db, "replacement-record120").length === c.used && replacementDocuments120(db, "replacement-proof120").length === c.used
    && replacementDocuments120(db, "replacement-counter120").length === c.used + 1, "HOLD: replacement counter incomplete/orphan history");
  for (const stage of replacementDocuments120<ReplacementStageValue120>(db, "replacement-stage120"))
    invariant(stage.value.headBefore.rootAccountId === root && replacementStage120(db, events, stage.value.newCandidateRef.generationId), "HOLD: replacement orphan/unexplained staged origin");
  if (!c.used) invariant(c.previousRef === null, "HOLD: replacement zero counter has history");
  else {
    invariant(c.previousRef, "HOLD: replacement counter history absent"); const before = readReplacementDocument120<ReplacementCounter120>(db, c.previousRef, "replacement-counter120").value;
    invariant(before.used === 0 && before.revision === 1 && before.records.length === 0 && before.previousRef === null
      && canonical({ ...before, used: 1, revision: 2, previousRef: c.previousRef, records: c.records }) === canonical(c), "HOLD: replacement counter chain reset");
    const { proof } = replacementProofForRecord120(db, c.records[0]!); const p = proof.value;
    invariant(canonical(p.counterBeforeRef) === canonical(c.previousRef) && canonical(p.counterAfterRef) === canonical(ref), "HOLD: replacement counter/proof link");
  }
  return counter;
}
export function replacementStage120(db: Database, events: EventLog, generation: string, live = false): ReplacementStage120 | null {
  const measure145 = enterLocal145("stage");
  let issue145: "returned" | "null" | "thrown" = "returned", text145: string | undefined;
  try {
  const stages = replacementDocuments120<ReplacementStageValue120>(db, "replacement-stage120").filter(s => s.value.newCandidateRef.generationId === generation);
  invariant(stages.length <= 1, "HOLD: ambiguous replacement stage"); if (!stages.length) { issue145 = "null"; return null; }
  const stage = stages[0]!, s = stage.value, row = db.query("SELECT document,digest,run FROM g3_origins WHERE mission=? AND generation=?").get(s.headBefore.missionId, generation) as { document: string; digest: string; run: string } | null;
  if (measure145) { try { text145 = stage.document.utf8; } catch { /* Unavailable bytes only. */ } }
  readReplacementDocument120(db, stage.document.ref, "replacement-stage120", live);
  closedResourceFieldsV1(s, ["version", "oldCandidateRef", "newCandidateRef", "barrierRootId", "drainEntryRef", "sourceBindingsRef", "sourceCurrentRef", "observationRef", "headBefore", "headAfter", "inventoryBefore", "inventoryAfter", "eventBefore", "eventAfter", "preparationCounterRef", "sourceDigest", "grantRef", "blobs", "unitIds"]);
  invariant(row && row.digest === fingerprint(JSON.parse(row.document)) && row.digest === s.sourceDigest, "HOLD: replacement stage origin mismatch");
  const retained = JSON.parse(row.document) as { origin: ParsedExecutionEnvelopeV1; independent: IndependentlyLoadedSourcesV1 }, binding = bindExecutionSourcesV1(retained.origin, retained.independent);
  invariant(binding.ok, "HOLD: replacement historical S1 binding"); const child = binding.value, run = makeGraphRunV3(child.origin);
  invariant(run.ok && canonical(run.value.document) === canonical(resourceDocumentV1(JSON.parse(row.run))), "HOLD: replacement historical run mismatch");
  invariant(canonical(s.newCandidateRef) === canonical({ generationId: child.origin.generationId, envelopeFingerprint: child.origin.envelope.fingerprint,
    envelopeRef: child.origin.document.ref, runRef: run.value.document.ref }) && generation !== s.oldCandidateRef.generationId
    && child.origin.envelope.generation.parentGenerationId === s.headBefore.generationId && child.origin.envelope.authorizationKind === "transition-a-fixture-v1", "HOLD: replacement historical candidate/parent");
  invariant(s.headBefore.barrierRootId === s.barrierRootId && s.headBefore.controlMode === "DRAIN_NEW_FAMILIES"
    && canonical(s.headBefore.candidateRef) === canonical(s.oldCandidateRef) && s.headAfter.inventoryRevision === s.headBefore.inventoryRevision + 1
    && canonical({ ...s.headBefore, inventoryRevision: s.headAfter.inventoryRevision, preparationCounterRef: s.preparationCounterRef }) === canonical(s.headAfter)
    && s.eventAfter === s.eventBefore + 1, "HOLD: replacement stage complete pre/postimage");
  const source = readReplacementDocument120<ReplacementSource120>(db, s.sourceBindingsRef, "replacement-host-source120").value;
  invariant(canonical(source.independent) === canonical(retained.independent), "HOLD: replacement stage/source join");
  const observation = readReplacementDocument120<TransitionObservationV1>(db, s.observationRef, "transition-source", live).value;
  closedResourceFieldsV1(observation, ["version", "revision", "issuer", "expectedHead", "eventSequence", "t0", "operational", "sourceMissionRef", "knowledgeRef", "parentOriginRef"]);
  integer(observation.revision, 1);
  const parent = db.query("SELECT document,digest FROM g3_origins WHERE mission=? AND generation=?").get(s.headBefore.missionId, s.headBefore.generationId) as { document: string; digest: string } | null;
  invariant(parent && parent.digest === fingerprint(JSON.parse(parent.document)) && parent.digest === s.headBefore.sourceDigest, "HOLD: replacement observation parent provenance");
  const parentOrigin = (JSON.parse(parent.document) as { origin: ParsedExecutionEnvelopeV1 }).origin;
  invariant(observation.issuer === "synthetic-parent85" && canonical(observation.expectedHead) === canonical(s.headBefore)
    && observation.eventSequence === s.eventBefore && canonical(observation.t0) === canonical(child.origin.envelope.preparationObservationT0)
    && observation.t0.observedEventSequence === s.eventBefore && observation.t0.inventoryDigest === fingerprint(observation.operational)
    && canonical(observation.sourceMissionRef) === canonical(child.body.sourceMissionSnapshot.ref)
    && canonical(observation.knowledgeRef) === canonical(child.body.admissionSource.knowledgeSource.ref)
    && canonical(observation.parentOriginRef) === canonical(parentOrigin.document.ref)
    && canonical(source.independent.parentEnvelope) === canonical(parentOrigin.document), "HOLD: replacement stage observation/source/preimage join");
  for (const key of ["families", "units", "claims", "outboxes", "slots"] as const) {
    const before = (s.inventoryBefore[key] as { mission?: string; generation?: string; root_id?: string }[]).filter(row => key === "slots"
      ? row.root_id === s.headBefore.rootAccountId : row.mission === s.headBefore.missionId && row.generation === s.headBefore.generationId);
    invariant(canonical(observation.operational[key]) === canonical(before), "HOLD: replacement stage observation/inventory join");
  }
  invariant(canonical(s.unitIds) === canonical(child.planning.units.map(u => u.unitId)) && canonical(s.blobs) === canonical([child.origin.document, run.value.document,
    child.origin.envelope.planning, child.body.admissionSource.inputManifestSource.document, child.body.admissionSource.knowledgeSource]), "HOLD: replacement critical stage incomplete");
  const charged = readReplacementDocument120<{ version: string; used: number; rootAccountId: string; grantRef: ByteRef; origins: { candidateRef: CandidateRefV1; sourceDigest: string; commitKey: string }[] }>(db, s.preparationCounterRef, "origin-counter-record").value;
  invariant(charged.used === 3 && charged.rootAccountId === s.headBefore.rootAccountId && canonical(charged.grantRef) === canonical(s.grantRef)
    && charged.origins.some(o => canonical(o.candidateRef) === canonical(s.newCandidateRef) && o.sourceDigest === s.sourceDigest
      && o.commitKey === `replacement-prepare:${generation}`), "HOLD: replacement stage durable origin charge missing");
  const consumedCurrent = readReplacementDocument120<ReplacementCurrent120>(db, s.sourceCurrentRef, "replacement-host-current-record120").value;
  invariant(canonical(consumedCurrent.sourceRef) === canonical(s.sourceBindingsRef) && canonical(consumedCurrent.allocationRef) === canonical(source.allocationRef)
    && !consumedCurrent.revokedRefs.some(ref => canonical(ref) === canonical(s.sourceBindingsRef) || canonical(ref) === canonical(source.allocationRef)), "HOLD: replacement consumed source-current provenance");
  const event = events.read(s.headBefore.missionId).find(e => e.key === `replacement-prepare:${generation}`);
  invariant(event?.kind === "g3_replacement_prepared" && event.sequence === s.eventAfter && canonical(event.payload) === canonical(s), "HOLD: replacement stage event missing/corrupt"); return stage;
  } catch (error) { issue145 = "thrown"; throw error; }
  finally { if (measure145) leaveLocal145(measure145, issue145, text145); }
}
export function replacementForOld120(db: Database, events: EventLog, generation: string) {
  const records = replacementDocuments120<ReplacementRecord120>(db, "replacement-record120").filter(r => r.value.oldCandidateRef.generationId === generation);
  invariant(records.length <= 1, "HOLD: ambiguous superseded origin"); if (!records.length) return null;
  const record = records[0]!, { proof } = replacementProofForRecord120(db, record.document.ref), p = proof.value, r = record.value;
  closedResourceFieldsV1(r, ["version", "barrierRootId", "drainEntryRef", "oldCandidateRef", "newCandidateRef", "currentHeadRevision", "currentCandidateRevision", "sourceBindingsRef", "authorityRecordRefs", "controllerFence"]);
  closedResourceFieldsV1(p, ["version", "recordRef", "stageRef", "caseRef", "sourceCurrentRef", "headBefore", "headAfter", "inventoryBefore", "inventoryAfter", "counterBeforeRef", "counterAfterRef", "eventBefore", "eventAfter", "eventKey", "reason"]);
  const stage = replacementStage120(db, events, r.newCandidateRef.generationId);
  invariant(stage && canonical(stage.document.ref) === canonical(p.stageRef) && canonical(stage.value.oldCandidateRef) === canonical(r.oldCandidateRef)
    && canonical(stage.value.newCandidateRef) === canonical(r.newCandidateRef) && stage.value.barrierRootId === r.barrierRootId
    && canonical(stage.value.drainEntryRef) === canonical(r.drainEntryRef) && canonical(stage.value.sourceBindingsRef) === canonical(r.sourceBindingsRef), "HOLD: replacement stage/record lineage");
  const c = readReplacementDocument120<ReplacementCase120>(db, p.caseRef, "replacement-host-case120").value;
  const current = readReplacementDocument120<ReplacementCurrent120>(db, p.sourceCurrentRef, "replacement-host-current-record120").value;
  const source = readReplacementDocument120<ReplacementSource120>(db, r.sourceBindingsRef, "replacement-host-source120").value;
  const allocation = readReplacementDocument120<ReplacementAllocation120>(db, source.allocationRef, "replacement-host-allocation120").value;
  invariant(canonical(r.authorityRecordRefs) === canonical([p.caseRef, p.sourceCurrentRef, source.allocationRef, p.stageRef])
    && canonical(c.allocationRef) === canonical(source.allocationRef) && canonical(current.allocationRef) === canonical(source.allocationRef)
    && canonical(current.sourceRef) === canonical(r.sourceBindingsRef) && canonical(c.policySourceRef) === canonical(allocation.sourcePolicyRef)
    && allocation.rootAccountId === p.headBefore.rootAccountId && allocation.owner === p.headBefore.owner && allocation.parentGenerationId === p.headBefore.generationId
    && !current.revokedRefs.some(ref => [p.caseRef, source.allocationRef, r.sourceBindingsRef].some(consumed => canonical(consumed) === canonical(ref))), "HOLD: replacement consumed authority/source/policy provenance");
  invariant(c.purpose === "REPLACE" && canonical(c.expectedHead) === canonical(p.headBefore) && canonical(c.stageRef) === canonical(p.stageRef)
    && canonical(c.sourceBindingsRef) === canonical(r.sourceBindingsRef) && c.inventoryDigest === fingerprint(p.inventoryBefore)
    && c.eventSequence === p.eventBefore && c.controllerFence === r.controllerFence && c.owner === p.headBefore.owner, "HOLD: replacement consumed capability join");
  invariant(p.reason === "superseded-by-explicit-replacement" && p.eventAfter === p.eventBefore + 1
    && p.headBefore.barrierRootId === r.barrierRootId && canonical(p.headBefore.candidateRef) === canonical(r.oldCandidateRef)
    && r.currentHeadRevision === p.headBefore.revision && r.currentCandidateRevision === p.headBefore.candidateRevision
    && canonical({ ...p.headBefore, revision: p.headBefore.revision + 1, candidateRevision: p.headBefore.candidateRevision + 1,
      inventoryRevision: p.headBefore.inventoryRevision + 1, candidateRef: r.newCandidateRef, candidateGenerationId: r.newCandidateRef.generationId }) === canonical(p.headAfter), "HOLD: replacement complete CAS postimage");
  for (const key of ["families", "claims", "outboxes", "slots", "roots", "sources"] as const)
    invariant(canonical(p.inventoryBefore[key]) === canonical(p.inventoryAfter[key]), "HOLD: replacement moved engaged work/rights/source inventory");
  invariant(canonical(p.inventoryBefore.units) === canonical(p.inventoryAfter.units), "HOLD: replacement rewrote staged unit bytes");
  readReplacementCounter120(db, events, p.headBefore.rootAccountId); return { ...record, proofRef: proof.document.ref, proof: p };
}
export function currentReplacement120(db: Database, events: EventLog, view: GenerationViewV3) {
  const records = replacementDocuments120<ReplacementRecord120>(db, "replacement-record120").filter(r => r.value.barrierRootId === view.barrierRootId);
  invariant(records.length <= 1, "HOLD: replacement barrier chain exceeds policy"); if (!records.length) return null;
  const value = records[0]!.value, result = replacementForOld120(db, events, value.oldCandidateRef.generationId);
  invariant(result && canonical(value.newCandidateRef) === canonical(view.candidateRef) && result.proof.headAfter.revision <= view.revision,
    "HOLD: replacement pointed candidate chain mismatch"); return result;
}
export function checkReplacementHost120(db: Database, records: ReplacementHostRecords120) {
  assertExecutionJsonV1(records); invariant(records.current, "HOLD: replacement HOST current unknown");
  closedResourceFieldsV1(records, ["allocation", "sources", "current", "cases"]);
  const allocation = exactReplacementDocument120(records.allocation), current = exactReplacementDocument120(records.current);
  invariant(Array.isArray(records.sources) && Array.isArray(records.cases) && Array.isArray(current.revokedRefs), "HOLD: replacement HOST records/current shape");
  closedResourceFieldsV1(allocation, ["version", "issuer", "connectionPath", "owner", "missionId", "lineageId", "rootAccountId", "parentGenerationId", "bootstrapEnvelopeRef", "sourcePolicyRef", "maxCandidateReplacements", "maxActivationAttempts"]);
  closedResourceFieldsV1(current, ["version", "revision", "allocationRef", "sourceRef", "revokedRefs"]); integer(current.revision, 1);
  const path = (db.query("PRAGMA database_list").all() as { name: string; file: string }[]).find(r => r.name === "main")?.file;
  invariant(allocation.version === "l8-replacement-host-allocation120" && allocation.issuer === "independent-fixture-host120"
    && allocation.maxCandidateReplacements === 1 && allocation.maxActivationAttempts === 2 && path
    && path.replaceAll("\\", "/").toLowerCase() === allocation.connectionPath.replaceAll("\\", "/").toLowerCase()
    && current.version === "l8-replacement-host-current120" && canonical(current.allocationRef) === canonical(records.allocation.ref)
    && !current.revokedRefs.some(r => canonical(r) === canonical(records.allocation.ref) || canonical(r) === canonical(current.sourceRef)), "HOLD: replacement HOST scope/current/revocation");
  const sources = records.sources.map(doc => ({ document: doc, value: exactReplacementDocument120(doc) }));
  invariant(new Set(sources.map(s => canonical(s.document.ref))).size === sources.length, "HOLD: replacement HOST duplicate sources");
  for (const source of sources) { closedResourceFieldsV1(source.value, ["version", "allocationRef", "revision", "independent"]); integer(source.value.revision, 1);
    invariant(source.value.version === "l8-replacement-host-source120" && canonical(source.value.allocationRef) === canonical(records.allocation.ref), "HOLD: replacement HOST source allocation"); }
  const source = sources.find(s => canonical(s.document.ref) === canonical(current.sourceRef)); invariant(source, "HOLD: replacement HOST current source unavailable");
  return { allocation, current, source, allocationRef: records.allocation.ref, currentRef: records.current.ref };
}
