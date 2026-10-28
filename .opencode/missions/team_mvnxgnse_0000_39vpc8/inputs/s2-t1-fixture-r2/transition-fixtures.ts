/** Fixture83 INPUTS ONLY. No construction at module load and no seal/bind/plan,
 * DB, native authority or SUT calls. Import/evaluation requires a later GO.
 * Grant85 closes the bound; blueprints require independent current grant/counter
 * verification, never a caller constant. Parent82 sources/DB stay untouched.
 */
import { canonical, decoded, document } from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/test/s2-author/s1-source-fixtures";
export { createResourceCompleteInput as createFreshParentInput83 } from "../s2-resource-complement-r2/resource-fixtures";
import type { BoundDocument, ByteRef, ReadonlyData, ParsedExecutionEnvelopeV1, ParsedGraphRunV3,
  ExecutionEnvelopeV1, ExecutionEnvelopeBodyV1, IndependentlyLoadedSourcesV1, ExecutionMissionSnapshotV1,
  KnowledgeSourceV1, PreparationObservationT0, CandidateRefV1, GenerationHeadV1, DrainEntryV1 } from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/src/graph-execution-envelope";
import type { PlannerPolicy, PlannerResult } from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/src/planner";
import type { FamilyLeaseV3, PreparedAdmissionV3 } from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/src/graph-generation-store";
import type { FixtureControllerRecordV1, FixtureObservationRecordV1 } from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/src/graph-trusted-authority";
import type { AdmissionImageV3 } from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/src/graph-generation-budget";
import type { ResourcePoolScopeV1, ResourceCurrentV1, ResourceInventoryV1 } from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/src/graph-resource-ledger";

function copy<T>(value: ReadonlyData<T>): T { return JSON.parse(canonical(value)) as T; } // detached DATA, not qualification
function equal(left: unknown, right: unknown, reason: string): void {
  if (canonical(left) !== canonical(right)) throw new Error(`HOLD fixture83 input: ${reason}`);
}
function ordered<T>(values: readonly T[], key: (value: T) => string): T[] {
  return [...values].sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
}

export interface SourceRecord83 { ref: ByteRef; revision: number; revocationRef: ByteRef | null }
export interface RootLedgerObservation83 {
  version: "l8-s2-t1-root-observation-fixture-v1"; rootAccountId: string; revision: number; digest: string;
  spentBySlot: { slotKey: string; amount: number }[]; encumberedBySlot: { slotKey: string; amount: number }[];
  rootLimitsRef: ByteRef; rootSlotGrantsRef: ByteRef; rootModelBindingsRef: ByteRef;
}
export interface LocalInventoryObservation83 {
  version: "l8-s2-t1-inventory-observation-fixture-v1"; missionId: string; generationId: string;
  inventoryRevision: number; inventoryDigest: string; observedEventSequence: number; enumerationRef: ByteRef;
}
export interface HostProvenance83 {
  version: "l8-s2-t1-host-provenance-fixture-v1"; issuerIdentity: "synthetic-host83"; fixtureId: "s2-t1-83";
  // A label alone proves NOTHING. Provider binds its private handle to actual DB.
  connectionScopeId: string; recordId: string; revision: number;
  headRef: ByteRef; activeOriginRef: ByteRef; activeRunRef: ByteRef; planRef: ByteRef;
  sourceMissionRef: ByteRef; knowledgeSourceRef: ByteRef; rootLedgerRef: ByteRef; inventoryObservationRef: ByteRef;
  controllerRecordRef: ByteRef; sourceRecords: SourceRecord83[];
}
export interface RetainedHost83 {
  parent: ReadonlyData<ParsedExecutionEnvelopeV1>; parentRun: ReadonlyData<ParsedGraphRunV3>;
  independent: ReadonlyData<IndependentlyLoadedSourcesV1>;
  head: BoundDocument<GenerationHeadV1>; t0: BoundDocument<PreparationObservationT0>;
  mission: BoundDocument<ExecutionMissionSnapshotV1>; knowledge: BoundDocument<KnowledgeSourceV1>;
  planning: BoundDocument<PlannerResult>; rootLedger: BoundDocument<RootLedgerObservation83>;
  inventory: BoundDocument<LocalInventoryObservation83>; controller: BoundDocument<FixtureControllerRecordV1>;
  provenance: BoundDocument<HostProvenance83>;
  // Actual host-retained registration/current records, not part of a request.
  preparationBudget: PreparationBudgetObservation85 | null;
}
export interface PreparationRootScope85 { fixtureId: "s2-t1-83"; missionId: string; lineageId: string; rootAccountId: string }
export interface PreparationGrantHostSources85 {
  scope: PreparationRootScope85; connectionScopeId: string;
  approvedDecisionRef: ByteRef; sourceMissionRef: ByteRef; rootAllocationRef: ByteRef; rootLimitsRef: ByteRef;
  issuerProvenanceRef: ByteRef; rootLineageOwnershipRef: ByteRef; firstIssuanceEmptyHistoryProofRef: ByteRef;
}
export interface PreparationGrant85 extends PreparationGrantHostSources85 {
  version: "l8-s2-durable-origin-grant-fixture-v1"; recordId: string; revision: number;
  issuerIdentity: "synthetic-host85"; purpose: "grant-durable-origins"; ceiling: 3; unit: "durable-origin";
}
export interface PreparationGrantCurrent85 {
  version: "l8-s2-durable-origin-grant-current-fixture-v1"; recordId: string; revision: number;
  scope: PreparationRootScope85; grantRef: ByteRef; grantRevision: number; revocationRef: ByteRef | null;
}
export interface DurableOriginCommit85 {
  origin: CandidateRefV1; ordinal: number; commitEventKey: string;
  stateAtCommit: "ACTIVE_BOOTSTRAP" | "PREPARED" | "STAGED"; // a losing STAGED remains charged
}
export interface PreparationCounter85 {
  version: "l8-s2-durable-origin-counter-fixture-v1"; recordId: string; revision: number;
  scope: PreparationRootScope85; grantRef: ByteRef; previousRef: ByteRef | null;
  usedDurableOrigins: number; committedOrigins: DurableOriginCommit85[];
  rootLineageOwnershipRef: ByteRef; originEnumerationProofRef: ByteRef;
}
export interface PreparationCounterCurrent85 {
  version: "l8-s2-durable-origin-counter-current-fixture-v1"; recordId: string; revision: number;
  scope: PreparationRootScope85; grantRef: ByteRef; counterRef: ByteRef; counterRevision: number; revocationRef: ByteRef | null;
}
export interface PreparationBudgetObservation85 {
  grant: BoundDocument<PreparationGrant85>; currentGrant: BoundDocument<PreparationGrantCurrent85>;
  counter: BoundDocument<PreparationCounter85>; currentCounter: BoundDocument<PreparationCounterCurrent85>;
}
export type PreparationBoundary83 = {
  version: "l8-s2-preparation-boundary-input-fixture-v1"; scope: PreparationRootScope85;
  knownActivationPolicy: ExecutionEnvelopeBodyV1["activationPolicy"];
} & ({ state: "UNKNOWN"; observation: null; effectiveOperation: "HOLD_BEFORE_EFFECT"; negative: "missing-independent-current-grant-or-counter" }
  | { state: "DATA_PRESENT_NOT_AUTHORITY"; observation: PreparationBudgetObservation85;
    effectiveOperation: "CONDITIONAL_ON_PROVIDER_CURRENT_RECORDS_AND_OWN_HISTORY" });
export function preparationBoundary83(parent: ReadonlyData<ParsedExecutionEnvelopeV1>, observed: PreparationBudgetObservation85 | null): PreparationBoundary83 {
  const common = { version: "l8-s2-preparation-boundary-input-fixture-v1" as const,
    scope: { fixtureId: "s2-t1-83" as const, missionId: parent.envelope.missionId, lineageId: parent.envelope.generation.lineageId,
      rootAccountId: parent.envelope.admissionSource.budgetLineage.rootAccountId }, knownActivationPolicy: copy<ExecutionEnvelopeBodyV1["activationPolicy"]>(parent.envelope.activationPolicy) };
  if (observed === null) return { ...common, state: "UNKNOWN", observation: null, effectiveOperation: "HOLD_BEFORE_EFFECT", negative: "missing-independent-current-grant-or-counter" };
  const grant = decoded(observed.grant), currentGrant = decoded(observed.currentGrant), counter = decoded(observed.counter), currentCounter = decoded(observed.currentCounter);
  equal(grant.scope, common.scope, "independent preparation grant scope"); equal(counter.scope, common.scope, "independent preparation counter scope");
  equal(currentGrant.scope, common.scope, "grant current scope"); equal(currentCounter.scope, common.scope, "counter current scope");
  equal(grant.sourceMissionRef, parent.envelope.sourceMissionSnapshot.ref, "grant mission source");
  equal(grant.rootAllocationRef, parent.envelope.admissionSource.budgetLineage.rootAllocationRef, "grant root allocation");
  equal(grant.rootLimitsRef, parent.envelope.admissionSource.budgetLineage.rootLimits.ref, "grant root limits");
  equal(currentGrant.grantRef, observed.grant.ref, "registered grant current ref"); equal(currentGrant.grantRevision, grant.revision, "registered grant revision");
  equal(counter.grantRef, observed.grant.ref, "counter grant ref"); equal(currentCounter.grantRef, observed.grant.ref, "counter current grant ref");
  equal(currentCounter.counterRef, observed.counter.ref, "registered counter current ref"); equal(currentCounter.counterRevision, counter.revision, "registered counter revision");
  equal(grant.ceiling, 3, "approved85 origin ceiling"); equal(grant.unit, "durable-origin", "approved85 counter unit");
  // No caller-supplied count/3/revocation boolean can turn this DATA into a
  // handle. Provider must read registration/current records and OWN history.
  return { ...common, state: "DATA_PRESENT_NOT_AUTHORITY", observation: copy<PreparationBudgetObservation85>(observed), effectiveOperation: "CONDITIONAL_ON_PROVIDER_CURRENT_RECORDS_AND_OWN_HISTORY" };
}
/** New fixture HOST example BEFORE bootstrap. The three proof/provenance refs
 * must be independently retained by the privileged issuer, not made from a
 * request or an empty new DB. Reusing an owned root/lineage in another OWN is
 * not first issuance and cannot initialize this zero counter. Never retrofit82.
 */
export function preparationGrantBeforeBootstrapBlueprint85(host: PreparationGrantHostSources85): PreparationBudgetObservation85 {
  const grant: PreparationGrant85 = { ...copy<PreparationGrantHostSources85>(host), version: "l8-s2-durable-origin-grant-fixture-v1",
    recordId: "host85/durable-origin-grant", revision: 1, issuerIdentity: "synthetic-host85", purpose: "grant-durable-origins", ceiling: 3, unit: "durable-origin" };
  const grantDoc = document(grant.version, grant);
  const currentGrant: PreparationGrantCurrent85 = { version: "l8-s2-durable-origin-grant-current-fixture-v1", recordId: "host85/durable-origin-grant-current",
    revision: 1, scope: copy(host.scope), grantRef: grantDoc.ref, grantRevision: 1, revocationRef: null };
  const counter: PreparationCounter85 = { version: "l8-s2-durable-origin-counter-fixture-v1", recordId: "host85/durable-origin-counter/0", revision: 1,
    scope: copy(host.scope), grantRef: grantDoc.ref, previousRef: null, usedDurableOrigins: 0, committedOrigins: [],
    rootLineageOwnershipRef: copy(host.rootLineageOwnershipRef), originEnumerationProofRef: copy(host.firstIssuanceEmptyHistoryProofRef) };
  const counterDoc = document(counter.version, counter);
  const currentCounter: PreparationCounterCurrent85 = { version: "l8-s2-durable-origin-counter-current-fixture-v1", recordId: "host85/durable-origin-counter-current",
    revision: 1, scope: copy(host.scope), grantRef: grantDoc.ref, counterRef: counterDoc.ref, counterRevision: 1, revocationRef: null };
  return { grant: grantDoc, currentGrant: document(currentGrant.version, currentGrant), counter: counterDoc, currentCounter: document(currentCounter.version, currentCounter) };
}
/** Independent HOST example histories, not a product counter update routine.
 * Explicit post-commit enumeration refs must come from the retained OWN host.
 * Counter, origin and commit event are persisted atomically by future product.
 * No claim that three origins are implemented/committed by this source builder.
 */
export function preparationCounterExamples85(beforeBootstrap: PreparationBudgetObservation85,
  commits: [DurableOriginCommit85, DurableOriginCommit85, DurableOriginCommit85],
  enumerations: [ByteRef, ByteRef, ByteRef]) {
  const zero = decoded(beforeBootstrap.counter), grant = decoded(beforeBootstrap.grant);
  equal(zero.usedDurableOrigins, 0, "new fixture explicit pre-bootstrap zero"); equal(zero.committedOrigins, [], "independent empty history");
  equal(commits[0].stateAtCommit, "ACTIVE_BOOTSTRAP", "first durable origin is bootstrap"); equal(commits[0].ordinal, 0, "bootstrap ordinal");
  if (new Set(commits.map(c => canonical(c.origin.envelopeRef))).size !== 3 || new Set(commits.map(c => c.commitEventKey)).size !== 3)
    throw new Error("HOLD fixture85: three history entries must be distinct commits, not retries");
  const one: PreparationCounter85 = { ...copy(zero), recordId: "host85/durable-origin-counter/1", revision: 2,
    previousRef: beforeBootstrap.counter.ref, usedDurableOrigins: 1, committedOrigins: [copy(commits[0])], originEnumerationProofRef: copy(enumerations[0]) };
  const oneDoc = document(one.version, one);
  const two: PreparationCounter85 = { ...copy(one), recordId: "host85/durable-origin-counter/2", revision: 3,
    previousRef: oneDoc.ref, usedDurableOrigins: 2, committedOrigins: [copy(commits[0]), copy(commits[1])], originEnumerationProofRef: copy(enumerations[1]) };
  const twoDoc = document(two.version, two);
  const three: PreparationCounter85 = { ...copy(two), recordId: "host85/durable-origin-counter/3", revision: 4,
    previousRef: twoDoc.ref, usedDurableOrigins: 3, committedOrigins: copy<DurableOriginCommit85[]>(commits), originEnumerationProofRef: copy(enumerations[2]) };
  const threeDoc = document(three.version, three);
  const observed = (counter: BoundDocument<PreparationCounter85>): PreparationBudgetObservation85 => {
    const v = decoded(counter), current: PreparationCounterCurrent85 = { version: "l8-s2-durable-origin-counter-current-fixture-v1", recordId: "host85/durable-origin-counter-current",
      revision: v.revision, scope: copy(v.scope), grantRef: beforeBootstrap.grant.ref, counterRef: counter.ref, counterRevision: v.revision, revocationRef: null };
    return { grant: copy(beforeBootstrap.grant), currentGrant: copy(beforeBootstrap.currentGrant), counter, currentCounter: document(current.version, current) };
  };
  equal(grant.ceiling, 3, "ratified85 ceiling, not activation/replacement capacity");
  return { afterBootstrap: observed(oneDoc), afterInitialTransition: observed(twoDoc), exhausted: observed(threeDoc) };
}

/** Reads only the supplied retained host DATA when later invoked. These joins
 * are builder consistency checks, never an issuer verification or S1 PASS.
 * A different scientific source requires a separate candidate input, not a
 * guessed update/replan here. No freshly supplied request is an authority source.
 */
export function createTransitionInput83(host: RetainedHost83) {
  const parent = copy<ParsedExecutionEnvelopeV1>(host.parent);
  const original = JSON.parse(parent.document.utf8) as ExecutionEnvelopeV1;
  equal(original, parent.envelope, "parent document/content");
  if (original.authorizationKind === "proposal-b-host-fixture-v1") throw new Error("HOLD fixture83: B to A excluded");
  const head = decoded(host.head), t0 = decoded(host.t0), controller = decoded(host.controller);
  const mission = decoded(host.mission), knowledge = decoded(host.knowledge), ledger = decoded(host.rootLedger), inventory = decoded(host.inventory);
  const provenance = decoded(host.provenance);
  if (head.controlMode !== "RUNNING" || head.candidateGenerationId !== null || head.candidateRef !== null || head.barrierRootId !== null)
    throw new Error("HOLD fixture83: initial candidate requires RUNNING/no candidate/no barrier");
  if (head.activePlanRevision === null) throw new Error("HOLD fixture83: active plan revision independently unknown");
  equal(head.activeGenerationId, parent.generationId, "actual active parent");
  equal(head.missionId, original.missionId, "mission"); equal(head.lineageId, original.generation.lineageId, "lineage");
  equal(host.parentRun.run.generationId, parent.generationId, "retained parent run");
  equal(host.parentRun.run.envelope.ref, parent.document.ref, "parent run/envelope ref");
  equal(controller.generationId, parent.generationId, "controller parent"); equal(controller.controllerFence, t0.controllerFence, "controller fence");
  equal(controller.missionId, original.missionId, "controller mission"); equal(controller.envelopeFingerprint, original.fingerprint, "controller origin");
  equal(t0.parentGenerationId, parent.generationId, "T0 parent"); equal(t0.headRevision, head.revision, "T0 head");
  equal(t0.activePlanRevision, head.activePlanRevision, "T0 activePlan"); equal(t0.sourceMissionRevision, mission.revision, "T0 mission revision");
  equal(t0.knowledgeRevision, knowledge.knowledgeRevision, "T0 K"); equal(t0.knowledgeRootHash, knowledge.rootHash, "T0 K root");
  equal(t0.knowledgeLedgerRevision, knowledge.ledgerRevision, "T0 K ledger revision"); equal(t0.knowledgeLedgerDigest, knowledge.ledgerDigest, "T0 K ledger digest");
  equal(head.knowledgeLedgerRevision, knowledge.ledgerRevision, "head K ledger");
  equal(t0.budgetLedgerRevision, ledger.revision, "T0 budget revision"); equal(t0.budgetLedgerDigest, ledger.digest, "T0 budget digest");
  equal(head.budgetLedgerRevision, ledger.revision, "head budget revision");
  equal(t0.spentBySlot, ledger.spentBySlot, "T0 SPENT"); equal(t0.encumberedBySlot, ledger.encumberedBySlot, "T0 encumbrance");
  equal(t0.inventoryRevision, inventory.inventoryRevision, "T0 inventory revision"); equal(t0.inventoryDigest, inventory.inventoryDigest, "T0 inventory digest");
  equal(t0.partitionStoreDigest, original.sourceRefs.partitionStoreDigest, "retained partition source digest");
  equal(head.inventoryRevision, inventory.inventoryRevision, "head inventory revision"); equal(t0.observedEventSequence, inventory.observedEventSequence, "T0 event cut");
  equal(ledger.rootAccountId, original.admissionSource.budgetLineage.rootAccountId, "same root account");
  equal(t0.rootLimitsRef, ledger.rootLimitsRef, "T0 root limits"); equal(t0.rootSlotGrantsRef, ledger.rootSlotGrantsRef, "T0 root grants"); equal(t0.rootModelBindingsRef, ledger.rootModelBindingsRef, "T0 root models");
  equal(provenance.headRef, host.head.ref, "host head provenance"); equal(provenance.activeOriginRef, parent.document.ref, "host parent provenance");
  equal(provenance.activeRunRef, host.parentRun.document.ref, "host run provenance"); equal(provenance.planRef, host.planning.ref, "host plan provenance");
  equal(provenance.sourceMissionRef, host.mission.ref, "host mission provenance"); equal(provenance.knowledgeSourceRef, host.knowledge.ref, "host K provenance");
  equal(provenance.rootLedgerRef, host.rootLedger.ref, "host budget provenance"); equal(provenance.inventoryObservationRef, host.inventory.ref, "host inventory provenance");
  equal(provenance.controllerRecordRef, host.controller.ref, "host controller provenance");
  // This fixture deliberately retains the parent's scientific sources verbatim.
  equal(host.mission, original.sourceMissionSnapshot, "retained scientific mission bytes");
  equal(host.knowledge, original.admissionSource.knowledgeSource, "retained scientific K bytes"); equal(host.planning, original.planning, "retained planning bytes");
  if (t0.inventoryRevision === null || t0.inventoryDigest === null || t0.spentBySlot === null || t0.encumberedBySlot === null
    || t0.authorityRecordRefs === null || t0.proofRecordRefs === null) throw new Error("HOLD fixture83: T0 inventory/records unknown");
  const { fingerprint: _parentFingerprint, ...retained } = original;
  const body: ExecutionEnvelopeBodyV1 = { ...retained, authorizationKind: "transition-a-fixture-v1", adoptionIntent: null,
    generation: { lineageId: original.generation.lineageId, ordinal: original.generation.ordinal + 1, parentGenerationId: parent.generationId },
    sourceRefs: { ...original.sourceRefs, proposalEvidenceRef: null, lineageRef: null }, preparationObservationT0: copy(t0) };
  const independent = copy<IndependentlyLoadedSourcesV1>(host.independent);
  independent.parentEnvelope = copy(parent.document);
  equal(independent.sourceMissionSnapshot, host.mission, "independent mission"); equal(independent.knowledgeSource, host.knowledge, "independent K");
  const budgetBoundary = preparationBoundary83(host.parent, host.preparationBudget);
  return { state: "UNSEALED_NOT_QUALIFIED" as const, body, independent, policy: decoded<PlannerPolicy>(body.planningPolicy),
    expectedT0: copy(host.t0), parentOriginRef: copy(parent.document.ref), parentRunRef: copy(host.parentRun.document.ref),
    hostProvenanceRef: copy(host.provenance.ref), budgetBoundary: document(budgetBoundary.version, budgetBoundary) };
}

export interface PreparationRecord83 {
  version: "l8-s2-initial-preparation-fixture-v1"; candidateRef: CandidateRefV1; parentRef: CandidateRefV1;
  expectedT0Ref: ByteRef; hostProvenanceRef: ByteRef; headBefore: BoundDocument<GenerationHeadV1>; headAfter: BoundDocument<GenerationHeadV1>;
  eventSequenceBefore: number; eventSequenceAfter: number; preparationBudgetBoundaryRef: ByteRef;
  preparationGrantRef: ByteRef | null; preparationCounterBeforeRef: ByteRef | null; expectedPreparationCounterAfterRef: ByteRef | null;
  candidateState: "PREPARED"; purpose: "initial-preparation-data-only";
}
/** CONDITIONAL on actual provider-current grant85/counter/history. Present JSON
 * is not authority. child and expected counter postimage are HOST DATA, not a
 * request DTO. Future T0 must commit its own counter/origin/event atomically.
 */
export function initialPreparationBlueprint83(host: RetainedHost83, child: CandidateRefV1, expectedCounterAfter: ByteRef | null): BoundDocument<PreparationRecord83> {
  const head = decoded(host.head), t0 = decoded(host.t0), boundary = preparationBoundary83(host.parent, host.preparationBudget);
  if (head.candidateRef !== null || head.candidateGenerationId !== null || head.barrierRootId !== null || head.controlMode !== "RUNNING") throw new Error("HOLD fixture83: candidate slot unavailable");
  equal(head.revision, t0.headRevision, "preparation h");
  const after: GenerationHeadV1 = { ...head, candidateGenerationId: child.generationId, candidateRef: copy(child), candidateRevision: head.candidateRevision + 1 };
  const record: PreparationRecord83 = { version: "l8-s2-initial-preparation-fixture-v1", candidateRef: copy(child),
    parentRef: { generationId: host.parent.generationId, envelopeFingerprint: host.parent.envelope.fingerprint,
      envelopeRef: copy(host.parent.document.ref), runRef: copy(host.parentRun.document.ref) }, expectedT0Ref: copy(host.t0.ref),
    hostProvenanceRef: copy(host.provenance.ref), headBefore: copy(host.head), headAfter: document(host.head.ref.kind, after),
    eventSequenceBefore: t0.observedEventSequence, eventSequenceAfter: t0.observedEventSequence + 1,
    preparationBudgetBoundaryRef: document(boundary.version, boundary).ref,
    preparationGrantRef: host.preparationBudget?.grant.ref ?? null, preparationCounterBeforeRef: host.preparationBudget?.counter.ref ?? null,
    expectedPreparationCounterAfterRef: copy(expectedCounterAfter), candidateState: "PREPARED", purpose: "initial-preparation-data-only" };
  return document(record.version, record);
}

export interface TransitionACase83 {
  version: "l8-s2-transition-a-case-fixture-v1"; issuerIdentity: "synthetic-host83"; recordId: string; caseRevision: number;
  fixtureId: "s2-t1-83"; connectionScopeId: string; purpose: "request-drain"; authorizationKind: "transition-a-fixture-v1";
  missionId: string; rootAccountId: string; owner: string; controllerFence: number;
  parentRef: CandidateRefV1; candidateRef: CandidateRefV1; preparationRecordRef: ByteRef; expectedT0Ref: ByteRef;
  preimageRef: ByteRef; expectedPreparationPostimageRef: ByteRef; hostProvenanceRef: ByteRef;
  sourceRecords: SourceRecord83[]; preparationBudgetBoundaryRef: ByteRef;
  preparationGrantRef: ByteRef | null; expectedPreparationCounterAfterRef: ByteRef | null;
}
export interface TransitionACaseCurrent83 {
  version: "l8-s2-transition-a-case-current-fixture-v1"; issuerIdentity: "synthetic-host83"; recordId: string;
  caseRecordRef: ByteRef; caseRevision: number; revocationRef: ByteRef | null; independentlyObservedHeadRef: ByteRef;
  independentlyObservedPreparationCounterRef: ByteRef; independentlyObservedGrantCurrentRef: ByteRef;
}
export function transitionCaseBlueprint83(host: RetainedHost83, preparation: BoundDocument<PreparationRecord83>) {
  const p = decoded(preparation), provenance = decoded(host.provenance), controller = decoded(host.controller);
  const value: TransitionACase83 = { version: "l8-s2-transition-a-case-fixture-v1", issuerIdentity: "synthetic-host83", recordId: "host83/transition-initial", caseRevision: 1,
    fixtureId: "s2-t1-83", connectionScopeId: provenance.connectionScopeId, purpose: "request-drain", authorizationKind: "transition-a-fixture-v1",
    missionId: host.parent.envelope.missionId, rootAccountId: host.parent.envelope.admissionSource.budgetLineage.rootAccountId, owner: controller.owner,
    controllerFence: controller.controllerFence, parentRef: copy(p.parentRef), candidateRef: copy(p.candidateRef), preparationRecordRef: copy(preparation.ref),
    expectedT0Ref: copy(p.expectedT0Ref), preimageRef: copy(host.head.ref), expectedPreparationPostimageRef: copy(p.headAfter.ref),
    hostProvenanceRef: copy(host.provenance.ref), sourceRecords: ordered(copy<SourceRecord83[]>(provenance.sourceRecords), r => canonical(r.ref)),
    preparationBudgetBoundaryRef: copy(p.preparationBudgetBoundaryRef), preparationGrantRef: copy(p.preparationGrantRef),
    expectedPreparationCounterAfterRef: copy(p.expectedPreparationCounterAfterRef) };
  // Offered HOST DATA, not a registered current-case fact, capability, DB handle
  // or verified postimage. Provider must own/read the independent current record.
  return { effectiveGate: "REQUIRES_CURRENT_GRANT_COUNTER_AND_TRANSITION_CASE" as const, caseDocument: document(value.version, value),
    requiredCurrentRecord: "INDEPENDENT_HOST_RECORD_AT_CONSUMPTION" as const };
}

export interface LogicalSlotAtCut83 {
  rootAccountId: string; slotKey: string; revision: number; role: "A" | "B" | "R";
  state: "AUTHORIZED" | "ENCUMBERED" | "SPENT" | "BURNED"; grantUtf8: string; cap: number; debit: number;
  pin: BoundDocument<PreparedAdmissionV3> | null;
}
export interface FamilyAtCut83 {
  key: { missionId: string; generationId: string; unitId: string }; lease: FamilyLeaseV3; state: "ACTIVE";
  originRef: ByteRef; runRef: ByteRef; planningRef: ByteRef; unitRef: ByteRef; familySourceRecordRef: ByteRef;
  logicalSlotKeys: string[]; executionIds: string[];
}
export interface OutboxAtCut83 {
  executionId: string; attemptId: string; subIntentId: string; role: "A" | "B" | "R";
  key: FamilyAtCut83["key"]; controllerFence: number; familyFence: number; state: string; attempt: number;
  image: AdmissionImageV3; preparedPinRef: ByteRef; fullOutboxRef: ByteRef; preparedEventRef: ByteRef;
  resourceSourceRefs: SourceRecord83[]; receiptRef: ByteRef | null; terminalProofRef: ByteRef | null;
}
export interface PhysicalPoolAtCut83 {
  poolScope: ResourcePoolScopeV1; acquisitionRef: ByteRef; current: BoundDocument<ResourceCurrentV1>;
  // Verbatim audited ledger82 result; no alternate subtraction/availability math.
  ledger: BoundDocument<ResourceInventoryV1>; sourceRecords: SourceRecord83[];
}
export type CoverageName83 = "families" | "units" | "logicalSlots" | "outboxes" | "claims" | "physicalPools" | "observationRecords" | "sourceCapabilities";
export interface Enumeration83 {
  version: "l8-s2-t1-enumeration-fixture-v1"; issuerIdentity: "synthetic-host83"; connectionScopeId: string; revision: number;
  missionId: string; activeGenerationId: string; headRef: ByteRef; inventoryRevision: number; observedEventSequence: number;
  collections: { name: CoverageName83; status: "COMPLETE" | "UNKNOWN"; rowCount: number | null; fullSetRef: ByteRef | null }[];
}
export interface T1Capture83 {
  missionId: string; activeGenerationId: string; rootAccountId: string; controllerFence: number;
  headBefore: BoundDocument<GenerationHeadV1>; expectedT0Ref: ByteRef; observedEventSequence: number; inventoryRevision: number;
  enumeration: BoundDocument<Enumeration83>; families: FamilyAtCut83[]; logicalSlots: LogicalSlotAtCut83[]; outboxes: OutboxAtCut83[];
  units: { key: FamilyAtCut83["key"]; sourceUnitRef: ByteRef; currentState: string; revision: number }[];
  claims: { resourceKey: string; key: FamilyAtCut83["key"]; familyFence: number }[];
  physicalPools: PhysicalPoolAtCut83[]; observationRecords: BoundDocument<FixtureObservationRecordV1>[]; sourceCapabilities: SourceRecord83[];
}
export interface EngagedFamiliesDocument83 {
  version: "l8-s2-t1-engaged-families-fixture-v1"; missionId: string; generationId: string; rootAccountId: string;
  headBeforeRef: ByteRef; controllerFence: number; inventoryRevision: number; observedEventSequence: number; enumerationRef: ByteRef; families: FamilyAtCut83[];
}
export interface InventoryAtCutDocument83 {
  version: "l8-s2-t1-inventory-cut-fixture-v1"; missionId: string; generationId: string; rootAccountId: string;
  headBeforeRef: ByteRef; expectedT0Ref: ByteRef; engagedFamiliesRef: ByteRef; inventoryRevision: number; observedEventSequence: number; enumerationRef: ByteRef;
  units: T1Capture83["units"]; logicalSlots: LogicalSlotAtCut83[]; outboxes: OutboxAtCut83[]; claims: T1Capture83["claims"];
  physicalPools: PhysicalPoolAtCut83[]; observationRecords: T1Capture83["observationRecords"]; sourceCapabilities: SourceRecord83[];
  finalDrainProof: "NOT_ESTABLISHED";
}
/** Deterministic packaging of HOST-captured DATA only, not captureInventory,
 * authority, completeness proof or the future ledger implementation. The
 * provider must compare every set/content to OWN in its consuming transaction.
 */
export function t1CutBlueprints83(capture: T1Capture83) {
  const c = copy<T1Capture83>(capture), coverage = decoded(c.enumeration);
  const required: CoverageName83[] = ["families", "units", "logicalSlots", "outboxes", "claims", "physicalPools", "observationRecords", "sourceCapabilities"];
  if (coverage.collections.length !== required.length || new Set(coverage.collections.map(x => x.name)).size !== required.length
    || required.some(name => !coverage.collections.some(x => x.name === name && x.status === "COMPLETE" && x.rowCount !== null && x.fullSetRef !== null)))
    throw new Error("HOLD fixture83: UNKNOWN/missing enumeration is not empty");
  equal(coverage.missionId, c.missionId, "cut mission"); equal(coverage.activeGenerationId, c.activeGenerationId, "cut generation");
  equal(coverage.headRef, c.headBefore.ref, "cut head"); equal(coverage.inventoryRevision, c.inventoryRevision, "cut inventory");
  equal(coverage.observedEventSequence, c.observedEventSequence, "cut event sequence");
  const families = ordered(c.families, f => canonical(f.key)).map(f => ({ ...f, logicalSlotKeys: [...f.logicalSlotKeys].sort(), executionIds: [...f.executionIds].sort() }));
  const engaged: EngagedFamiliesDocument83 = { version: "l8-s2-t1-engaged-families-fixture-v1", missionId: c.missionId, generationId: c.activeGenerationId,
    rootAccountId: c.rootAccountId, headBeforeRef: c.headBefore.ref, controllerFence: c.controllerFence, inventoryRevision: c.inventoryRevision,
    observedEventSequence: c.observedEventSequence, enumerationRef: c.enumeration.ref, families };
  const engagedDocument = document(engaged.version, engaged);
  const inventory: InventoryAtCutDocument83 = { version: "l8-s2-t1-inventory-cut-fixture-v1", missionId: c.missionId, generationId: c.activeGenerationId,
    rootAccountId: c.rootAccountId, headBeforeRef: c.headBefore.ref, expectedT0Ref: c.expectedT0Ref, engagedFamiliesRef: engagedDocument.ref,
    inventoryRevision: c.inventoryRevision, observedEventSequence: c.observedEventSequence, enumerationRef: c.enumeration.ref,
    units: ordered(c.units, u => canonical(u.key)), logicalSlots: ordered(c.logicalSlots, s => s.slotKey), outboxes: ordered(c.outboxes, o => o.executionId),
    claims: ordered(c.claims, claim => claim.resourceKey), physicalPools: ordered(c.physicalPools, p => p.poolScope.poolId),
    observationRecords: ordered(c.observationRecords, p => canonical(p.ref)), sourceCapabilities: ordered(c.sourceCapabilities, s => canonical(s.ref)), finalDrainProof: "NOT_ESTABLISHED" };
  return { effectiveGate: "REQUIRES_CURRENT_GRANT_COUNTER_AND_TRANSITION_CASE" as const, engagedFamilies: engagedDocument, inventoryAtCut: document(inventory.version, inventory) };
}
export function drainEntryBlueprint83(preparation: BoundDocument<PreparationRecord83>, cuts: ReturnType<typeof t1CutBlueprints83>, barrierRootId: string): BoundDocument<DrainEntryV1> {
  const p = decoded(preparation), post = decoded(p.headAfter), engaged = decoded(cuts.engagedFamilies), inventory = decoded(cuts.inventoryAtCut);
  equal(engaged.headBeforeRef, p.headAfter.ref, "T1 exact preparation postimage"); equal(inventory.expectedT0Ref, p.expectedT0Ref, "T1 immutable T0 ref");
  equal(engaged.generationId, p.parentRef.generationId, "T1 active origin"); equal(inventory.observedEventSequence, p.eventSequenceAfter, "only own T0 event allowed");
  // barrierRootId is the HOST-only expected identity to be committed atomically
  // by the future backend, never an agent-supplied authority or a barrier lift.
  const value: DrainEntryV1 = { version: "l8-drain-entry-v1", barrierRootId, candidateRef: copy(p.candidateRef), expectedT0Ref: copy(p.expectedT0Ref),
    headBefore: post.revision, headAfter: post.revision + 1, controllerFence: engaged.controllerFence,
    engagedFamiliesRef: copy(cuts.engagedFamilies.ref), inventoryAtCutRef: copy(cuts.inventoryAtCut.ref), eventSequence: p.eventSequenceAfter + 1 };
  return document(value.version, value); // conditional DATA; provider-current grant/counter and transition case still required
}
/** Concrete nominal branch from an EXPLICIT complete future host capture. Never
 * create an empty outbox/pool by default because a field/API was absent. */
export function reservedFamilyWithoutOutboxBlueprint83(capture: T1Capture83) {
  if (capture.families.length !== 1 || capture.outboxes.length !== 0 || capture.physicalPools.some(p => decoded(p.ledger).active.length !== 0)
    || capture.families[0]!.executionIds.length !== 0) throw new Error("HOLD fixture83: reserved-no-outbox nominal not observed");
  const family = capture.families[0]!;
  const slots = capture.logicalSlots.filter(s => family.logicalSlotKeys.includes(s.slotKey));
  equal(ordered(slots, s => s.role).map(s => [s.role, s.state, s.pin]), [["A", "ENCUMBERED", null], ["B", "ENCUMBERED", null], ["R", "ENCUMBERED", null]], "reserved A/B/R includes R without worker/outbox");
  return t1CutBlueprints83(capture);
}

/** Literal manual expectations fixed before future SUT implementation. No test,
 * planner/ledger producer or runtime result generated these expectations. */
export const MANUAL_EXPECTATIONS83 = {
  missingCurrentGrantOrCounter: { prepareInitial: "HOLD_BEFORE_EFFECT", newOrigins: 0, newCandidates: 0, newEvents: 0, newCounterDebits: 0, t1: "HOLD_NO_DURABLE_PREPARATION" },
  conditionalOnActualProviderCurrentGrantCounter: {
    preparation: { headDelta: 0, candidateRevisionDelta: 1, eventSequenceDelta: 1, currentCandidates: 1, state: "PREPARED", activeGenerationChanged: false,
      preparationUnits: 1, replacementsUsed: 0, activationAttemptsUsed: 0, logicalDebitDelta: 0, poolRevisionDelta: 0 },
    t1FromPreparationPostimage: { headDelta: 1, candidateRevisionDelta: 1, eventSequenceDelta: 1, state: "PENDING_DRAIN", mode: "DRAIN_NEW_FAMILIES",
      activeGenerationChanged: false, activePlanDelta: 0, knowledgeDelta: 0, logicalDebitDelta: 0, poolRevisionDelta: 0, inventoryRevisionDelta: 0 },
    reservedNoOutbox: { includedFamilies: 1, includedExecutions: 0, physicalOccupations: 0, logicalStates: ["ENCUMBERED", "ENCUMBERED", "ENCUMBERED"], quiescenceEstablished: false },
    exactPreparationRetry: { sameOriginAndRunAndT0: true, newEvents: 0, newPreparationUnits: 0 },
    exactT1Retry: { sameDrainEntryAndBarrierAndCuts: true, newEvents: 0, newHeadChanges: 0 },
    changedT1Identity: { result: "HOLD", newEvents: 0, newCuts: 0 },
    staleOrRevoked: { result: "HOLD", newOrigins: 0, newCuts: 0, newEvents: 0, newLogicalDebit: 0 },
    appendFailureAfterRealAppend: { priorHeadAndCandidateRestored: true, priorBarrierAndEventsRestored: true, counterRestored: true, newLogicalDebit: 0, newWorkerClaims: 0 },
    reserveWinsBeforeT1: { familyInCut: true, frozenAtT1: true }, reserveLosesAfterT1: { result: "HOLD", familyInCut: false, newEntitlements: 0, newClaims: 0 },
    engagedAOrB: { barrierDoesNotReject: true, ownSourceAssignmentCapacityChecksRemain: true },
    firstOriginalR: { barrierDoesNotReject: true, needsOriginalEligibleABAndReviewer: true, effective82: "HOLD_OWN_REVIEWER_PREDECESSOR_GATES", newEntitlements: 0 },
    absentFamilyOrCandidateNotActive: { result: "HOLD", newOutbox: 0, newEntitlements: 0 },
    oldResourceWorkCut: { result: "HOLD_FOR_NEW_OCCUPATION", logicalOrPhysicalConsumption: 0 },
    independentlyRenewedResourceWorkCut: { sameAcquisitionAndIncludedAllocations: true, newQuota: 0, oldClaimsDeductedAgain: 0 },
    identityRetry: { emissionAuthorized: false, newOutbox: 0, newLogicalDebit: 0, newWorkerClaims: 0 },
    bootstrapHandleOrBOrNative: { result: "HOLD", newCuts: 0, activationAuthorized: false },
  },
  approved85: {
    grantRegistrationBeforeBootstrap: { ceiling: 3, unit: "durable-origin", used: 0, durableOrigins: 0, existingRootOrOWNResetAllowed: false },
    bootstrapCommit: { before: 0, after: 1, durableOrigins: 1, counterDelta: 1, originCounterAndEventSameTransaction: true },
    firstTransitionCommit: { before: 1, after: 2, durableOrigins: 2, counterDelta: 1, replacementsUsed: 0, activationAttemptsUsed: 0 },
    thirdDurableOriginPolicyBoundaryOnly: { before: 2, after: 3, counterDelta: 1, implementsReplacementOrActivation: false },
    losingPersistedStagePolicyOnly: { remainsCharged: true, refund: 0, implementsStagingOrReplacement: false },
    exactRetryAtCeiling: { before: 3, after: 3, newOrigin: 0, newEvent: 0, counterDelta: 0 },
    exhaustedNewOrigin: { before: 3, after: 3, result: "HOLD_BEFORE_EFFECT", newOrigins: 0, newCandidates: 0, newEvents: 0 },
    rollbackBeforeCommit: { before: 1, after: 1, newOrigins: 0, newCandidates: 0, newEvents: 0, counterDelta: 0 },
    missingUnknownStaleRevokedOrWrongConnection: { result: "HOLD_BEFORE_EFFECT", newOrigins: 0, newEvents: 0, counterDelta: 0 },
    repeatedGrantOrAnotherOWN: { newCapacity: 0, counterReset: false, missingOwnershipOrHistory: "HOLD" },
  },
} as const;
export const FINITE_NEGATIVES83 = {
  staleT0Each: ["headRevision", "activePlanRevision", "sourceMissionRevision", "controllerFence", "knowledgeRevision", "knowledgeRootHash", "knowledgeLedgerRevision", "knowledgeLedgerDigest", "budgetLedgerRevision", "budgetLedgerDigest", "spentBySlot", "encumberedBySlot", "inventoryRevision", "inventoryDigest"],
  staleCurrentEach: ["candidateRef", "candidateRevision", "preparationPostimage", "caseRevision", "sourceRevision", "revocationRef", "eventSequenceBeyondOwnPreparationAppend"],
  invalidAuthorityEach: ["bootstrap-controller-handle", "bootstrapA-handle", "json-authorizationKind", "selfhashed-request", "wrong-DB", "wrong-owner", "revoked-case", "native", "proposal-b"],
  incompleteCutEach: ["family-reserved-without-outbox-omitted", "missing-unit", "missing-root-slot", "missing-execution", "missing-claim", "pool-allocation-omitted", "source-record-UNKNOWN", "proof-record-enumeration-UNKNOWN"],
  preparationSourceNegativeEach85: ["missing-grant", "missing-current-grant", "missing-counter", "unknown-counter-history", "revoked-grant", "revoked-counter", "stale-grant-current", "stale-counter-current", "wrong-mission-lineage-root", "another-DB", "retrofit82", "empty-new-OWN-same-root", "caller-constant-three", "request-counter-zero", "used-three-new-origin"],
  expectedWhenCurrentGrantOrCounterUnavailable: "HOLD_BEFORE_EFFECT",
} as const;
