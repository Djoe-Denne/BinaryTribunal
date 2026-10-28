/**92 INPUTS ONLY: nothing constructs/evaluates a fixture at module load.
 * No SUT/SQL/provider/IO/seal/bind calls. Import itself requires a later GO.
 * These DATA checks cannot grant authority or certify producer completeness.
 */
import { canonical, document, decoded } from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/test/s2-author/s1-source-fixtures";
import type { BoundDocument, ByteRef, CandidateRefV1, ExpectationsT2V1, ActivationAttemptV1,
  GenerationHeadV1, DrainEntryV1, ParsedExecutionEnvelopeV1, IndependentlyLoadedSourcesV1, ReadonlyData }
  from "../../../../../.tmp/m2-s1-integration-r2/tools/ff8-harness/src/graph-execution-envelope";

// Independent literal/hash, computed over UTF8 text only, not a SUT-produced oracle.
export const POLICY_UTF8_92 = '{"lineageId":"lineage:author","maxActivationAttempts":2,"maxCandidateReplacements":1,"missionId":"author","version":"l8-activation-policy-source-v1"}';
export const POLICY_BYTE_LENGTH_92 = 149;
export const POLICY_SHA256_92 = "57f51b7201aec0bb8661a96c08d1ae4928d69e85334ea5d8da9cb7bdc2f059ec";
export const PROMISED_POLICY_PATH92 = "synthetic/activation.json";

export const CATEGORY_NAMES92 = ["origins", "families", "units", "executions", "intents", "outboxes", "attemptsL6", "claims",
  "publications", "publicationReadbacks", "materializations", "materializationReadbacks", "proofs", "releases", "sourceCapabilities",
  "controllerLeases", "physicalAllocations", "stagedUnits", "stagedBlobs", "requiredFiles"] as const;
export type Category92 = typeof CATEGORY_NAMES92[number];
export type Json92 = null | boolean | number | string | Json92[] | { [key: string]: Json92 };
export interface Domain92 {
  universeId: string; rootDomainId: string; missionId: string; lineageId: string; rootAccountId: string;
  connectionScopeId: string; ownAssignmentRef: ByteRef; originHostOwnershipRef: ByteRef; owner: string;
}
export interface SourceCurrent92 {
  version: "l8-t2-source-current-fixture-v1"; recordId: string; revision: number; domain: Domain92;
  sourceRef: ByteRef; sourceRevision: number; revocationRef: ByteRef | null;
}
export interface RetainedSource92<T extends { version: string; revision: number }> {
  source: BoundDocument<T>; current: BoundDocument<SourceCurrent92>;
}
export interface Producer92 {
  producerId: "own-control92" | "parent-policy-file92";
  authorityRecordRef: ByteRef; operationPolicyRef: ByteRef; writesCategories: Category92[];
  // Evidence supplied by the HOST that owns the fixture's producer capabilities,
  // not a declaration emitted by the candidate/activation request/driver itself.
  operationJournalSourceRef: ByteRef; capabilityRevocationRef: ByteRef | null;
}
// Literal closed-world input policy, NOT an observation that rows are absent.
// Even a category with no admitted writer needs authoritative enumeration/cuts;
// any actual row without an explained retained origin is a HOLD counterexample.
export const CATEGORY_WRITERS92: { readonly [K in Category92]: readonly Producer92["producerId"][] } = {
  origins: ["own-control92"], families: [], units: ["own-control92"], executions: [], intents: [], outboxes: [], attemptsL6: [], claims: [],
  publications: [], publicationReadbacks: [], materializations: ["parent-policy-file92"], materializationReadbacks: ["parent-policy-file92"],
  proofs: ["own-control92", "parent-policy-file92"], releases: [], sourceCapabilities: ["own-control92"], controllerLeases: ["own-control92"],
  physicalAllocations: [], stagedUnits: ["own-control92"], stagedBlobs: ["own-control92"], requiredFiles: ["parent-policy-file92"],
};
export interface ProducerRegistry92 {
  version: "l8-t2-producer-registry-fixture-v1"; revision: number; domain: Domain92;
  allocationProvenanceRef: ByteRef; producerAdmissionAuthorityRef: ByteRef; producerAdmissionJournalRef: ByteRef;
  creationEventRef: ByteRef; producers: Producer92[];
  admittedOperationPolicy: {
    own: ["bootstrap", "prepare-initial", "request-drain", "retain-pointed-candidate-units", "register-source-controller",
      "append-activation-attempt", "append-outcome", "activate-a"];
    file: ["create-policy-exclusive", "close-policy", "readback-policy", "share-parent-owned-policy-readonly"];
  };
  rejectedOperationClasses: ["external-executor", "dispatcher", "scientific-publisher", "scientific-result-materializer", "native"];
}
export interface ProducerOperation92 {
  sequence: number; producerId: Producer92["producerId"]; operationId: string; operationKind: string;
  sourceRecordRef: ByteRef; ownEventRef: ByteRef | null; affectedCategoryRefs: { category: Category92; rowRefs: ByteRef[] }[];
}
export interface ProducerJournal92 {
  version: "l8-t2-producer-journal-fixture-v1"; revision: number; domain: Domain92; producerId: Producer92["producerId"];
  creationRef: ByteRef; firstSequence: 1; lastSequence: number; entries: ProducerOperation92[];
  // lastSequence=0 is legitimate ONLY for the explicitly retained empty journal
  // of a producer already in the authoritative roster; missing journal is UNKNOWN.
}
export interface CategoryRows92 {
  version: "l8-t2-category-rows-fixture-v1"; revision: number; domain: Domain92; category: Category92;
  rootOriginRefs: ByteRef[]; rows: { key: string; originRef: ByteRef | null; data: BoundDocument<{ version: string; data: Json92 }> }[];
}
export interface CategoryEnumeration92 {
  version: "l8-t2-category-enumeration-fixture-v1"; revision: number; domain: Domain92; category: Category92;
  producerRegistryRef: ByteRef; producerAdmissionJournalRef: ByteRef; rootOriginRefs: ByteRef[]; rowsRef: ByteRef;
  // One cut per producer, including a known producer with zero writes here.
  producerCuts: { producerId: Producer92["producerId"]; fullJournalRef: ByteRef; lastSequence: number; sourceCurrentRef: ByteRef }[];
  sourceStoreSnapshotRef: ByteRef; ownEventSequence: number; authorityEnumerationRef: ByteRef;
}
export interface CategoryEvidence92 {
  rows: RetainedSource92<CategoryRows92>; enumeration: RetainedSource92<CategoryEnumeration92>;
}
export interface FinalInventory92 {
  version: "l8-t2-final-inventory-fixture-v1"; revision: number; domain: Domain92; producerRegistryRef: ByteRef;
  ownFullSnapshotRef: ByteRef; ownEventSequenceBeforeControlAppend: number; rootOriginRefs: ByteRef[];
  categoryRefs: { category: Category92; rowsRef: ByteRef; enumerationRef: ByteRef; rowsCurrentRef: ByteRef; enumerationCurrentRef: ByteRef }[];
  sourceCapabilityRegistryRef: ByteRef; producerAdmissionJournalRef: ByteRef;
}
export interface RootLedger92 {
  version: "l8-t2-root-ledger-fixture-v1"; revision: number; domain: Domain92;
  rootLimitsRef: ByteRef; rootSlotGrantsRef: ByteRef; rootModelBindingsRef: ByteRef; budgetLedgerDigest: string;
  allSlots: { slotKey: string; revision: number; state: "AUTHORIZED" | "ENCUMBERED" | "SPENT" | "BURNED";
    grantRef: ByteRef; acquiredCap: number; debit: number; retainedClaimRef: ByteRef | null }[];
  spentBySlot: { slotKey: string; amount: number }[]; encumberedBySlot: { slotKey: string; amount: number }[];
  physicalPoolSourceRefs: ByteRef[];
}
export interface FinalObservation92 {
  // Supplied by an independently retained privileged source. None is optional
  // and no helper fills missing categories with [] or manufactures proof of Q.
  registry: RetainedSource92<ProducerRegistry92>;
  producerJournals: RetainedSource92<ProducerJournal92>[];
  categories: { [K in Category92]: CategoryEvidence92 };
  inventory: RetainedSource92<FinalInventory92>;
  head: BoundDocument<GenerationHeadV1>; fullControlHeadRef: ByteRef; rootLedgerRef: ByteRef; rootLedger: RetainedSource92<RootLedger92>;
  controllerRecordRef: ByteRef; authorityCurrentRefs: ByteRef[];
}

/** The literal producer policy is input to a privileged HOST allocation. Calling
 * this builder does NOT admit producers, seal their real capabilities, or prove
 * that no additional writer exists. The provider must retain/verify that source.
 * In particular the activation caller must not install the result as authority. */
export function producerPolicy92(retained: {
  domain: Domain92; allocationProvenanceRef: ByteRef; producerAdmissionAuthorityRef: ByteRef;
  producerAdmissionJournalRef: ByteRef; creationEventRef: ByteRef; producers: [Producer92, Producer92];
}): ProducerRegistry92 {
  equal92(retained.producers.map(p => p.producerId).sort(), ["own-control92", "parent-policy-file92"].sort(), "closed fixture producer identities");
  for (const producer of retained.producers) {
    const expected = CATEGORY_NAMES92.filter(category => CATEGORY_WRITERS92[category].includes(producer.producerId));
    equal92([...producer.writesCategories].sort(), [...expected].sort(), "HOST admission must match explicit minimal category writer policy");
  }
  return { version: "l8-t2-producer-registry-fixture-v1", revision: 1, ...copy92(retained),
    admittedOperationPolicy: { own: ["bootstrap", "prepare-initial", "request-drain", "retain-pointed-candidate-units", "register-source-controller",
      "append-activation-attempt", "append-outcome", "activate-a"],
      file: ["create-policy-exclusive", "close-policy", "readback-policy", "share-parent-owned-policy-readonly"] },
    rejectedOperationClasses: ["external-executor", "dispatcher", "scientific-publisher", "scientific-result-materializer", "native"] };
}

export interface ParentFileLease92 {
  version: "l8-t2-parent-file-lease-fixture-v1"; revision: number; parentOwner: string;
  candidateRoot: string; promisedAbsolutePath: string; sourcePolicyRef: ByteRef; sourceInputManifestRef: ByteRef;
  directoryOwnershipRef: ByteRef; exclusiveLeaseRef: ByteRef; collisionObservationRef: ByteRef;
}
export interface MaterializationPlan92 {
  version: "l8-t2-policy-materialization-plan-fixture-v1"; execution: "UNEXECUTED";
  parentLeaseRef: ByteRef; promisedAbsolutePath: string; promisedRelativePath: "synthetic/activation.json";
  sourcePolicyRef: ByteRef; sourceInputManifestRef: ByteRef; utf8: string; expectedByteLength: 149; expectedSha256: string;
  steps: ["verify-parent-directory-and-exclusive-file-lease", "reject-unknown-existing-path-even-if-hash-matches",
    "create-exclusively-no-symlink-follow", "write-exact-utf8-no-bom-no-newline", "close-handle", "read-real-bytes-and-file-identity",
    "compare-full-bytes-length-and-sha", "retain-parent-host-readback", "share-readonly-with-explicit-parent-lease"];
}
export interface MaterializationReadback92 {
  // This record must come from future REAL IO by the parent-owned file provider,
  // not document(plan.utf8), hash(plan), or this file's literal expected SHA.
  version: "l8-t2-policy-file-readback-fixture-v1"; revision: number; parentLeaseRef: ByteRef;
  sourcePolicyRef: ByteRef; sourceInputManifestRef: ByteRef; promisedAbsolutePath: string;
  writeCloseRecordRef: ByteRef; realReadObservationRef: ByteRef; fileIdentityRef: ByteRef;
  directoryOwnershipRef: ByteRef; readUtf8: string; readByteLength: number; readSha256: string;
}
export function materializationPlan92(lease: BoundDocument<ParentFileLease92>, retainedOrigin: ReadonlyData<ParsedExecutionEnvelopeV1>): MaterializationPlan92 {
  const source = decoded(lease), inputSource = retainedOrigin.envelope.admissionSource.inputManifestSource;
  const manifest = decoded(inputSource.document), promised = manifest.commonInputs.filter(file => file.sha256 === POLICY_SHA256_92 && file.kind === "rule");
  equal92(promised.length, 1, "one actual promised policy input in retained manifest");
  equal92(source.promisedAbsolutePath, promised[0]!.path, "plan uses promised path, not caller redirection");
  equal92(manifest.accessibleRules.includes(source.promisedAbsolutePath), true, "same accessible rule");
  const normalizedRoot = source.candidateRoot.replaceAll("\\", "/").replace(/\/$/, ""), normalizedPath = source.promisedAbsolutePath.replaceAll("\\", "/");
  equal92(normalizedPath, `${normalizedRoot}/synthetic/activation.json`, "shared candidate path; unsafe ownership must HOLD/rebind before bootstrap");
  equal92(source.sourcePolicyRef, retainedOrigin.envelope.activationPolicy.sourcePolicyRef, "actual retained policy source");
  equal92(source.sourceInputManifestRef, inputSource.document.ref, "actual retained manifest");
  equal92(source.sourcePolicyRef.sha256, POLICY_SHA256_92, "source policy must be the promised literal, no rewritten hash");
  equal92(source.sourcePolicyRef.byteLength, 149, "policy byte count");
  return { version: "l8-t2-policy-materialization-plan-fixture-v1", execution: "UNEXECUTED", parentLeaseRef: copy92(lease.ref),
    promisedAbsolutePath: source.promisedAbsolutePath, promisedRelativePath: "synthetic/activation.json",
    sourcePolicyRef: copy92(source.sourcePolicyRef), sourceInputManifestRef: copy92(source.sourceInputManifestRef),
    utf8: POLICY_UTF8_92, expectedByteLength: 149, expectedSha256: POLICY_SHA256_92,
    steps: ["verify-parent-directory-and-exclusive-file-lease", "reject-unknown-existing-path-even-if-hash-matches",
      "create-exclusively-no-symlink-follow", "write-exact-utf8-no-bom-no-newline", "close-handle", "read-real-bytes-and-file-identity",
      "compare-full-bytes-length-and-sha", "retain-parent-host-readback", "share-readonly-with-explicit-parent-lease"] };
}

export interface StagedCandidate92 {
  version: "l8-t2-pointed-candidate-staging-fixture-v1"; revision: number; domain: Domain92;
  candidateRef: CandidateRefV1; barrierRootId: string; drainEntryRef: ByteRef; sourceBindingsRef: ByteRef;
  unitRows: { unitId: string; selected: boolean; sourceUnitRef: ByteRef; retainedRowRef: ByteRef; state: "STAGED_NONEXECUTABLE" }[];
  criticalBlobs: { role: "envelope" | "run" | "planning" | "input-source" | "knowledge" | "policy" | "context";
    sourceRef: ByteRef; retainedBytesRef: ByteRef; realFileReadbackRef: ByteRef | null }[];
  requiredFiles: { sourceFileRef: ByteRef; promisedPath: string; realReadbackRef: ByteRef }[];
  rootLedgerRef: ByteRef; knowledgeRef: ByteRef; sourceCapabilityRegistryRef: ByteRef;
}
export interface ActivationCounter92 {
  version: "l8-t2-activation-counter-fixture-v1"; revision: number; domain: Domain92;
  policySourceRef: ByteRef; ceilingScope: "root-aggregate"; maxActivationAttempts: 2;
  previousCounterRef: ByteRef | null; usedAttempts: number; latestAttemptId: string | null;
  attempts: { ordinal: number; activationAttemptId: string; barrierRootId: string; candidateRef: CandidateRefV1; previousActivationAttemptId: string | null }[];
  // A barrier is an index into THIS history, never a fresh independent cap2.
}
export interface AttemptPreimage92 {
  activationAttemptOrdinal: number; previousActivationAttemptId: string | null;
  candidateRef: CandidateRefV1; barrierRootId: string; drainEntryRef: ByteRef; replacementRecordRef: null;
  expectationsT2: ExpectationsT2V1; finalAdoption: null;
}
export interface FinalACase92 {
  version: "l8-t2-final-a-case-fixture-v1"; revision: number; issuer: "synthetic-host92";
  purpose: "activate-a-fixture"; caseId: string; domain: Domain92; controllerFence: number;
  parentOriginRef: ByteRef; candidateSourceBindingsRef: ByteRef; fullControlHeadRef: ByteRef;
  finalInventoryRef: ByteRef; stagedCandidateRef: ByteRef; activationCounterBeforeRef: ByteRef;
  controllerParentRef: ByteRef; controllerChildRef: ByteRef; sourceCapabilityRecordRefs: ByteRef[];
  attemptPreimage: AttemptPreimage92;
  // NO activationAttemptId or ref here: case is bound before the attempt's
  // authorityRecordRefs include case.ref. A final-attempt-id backref would cycle.
}
export interface AttemptOutcome92 {
  version: "l8-t2-activation-outcome-fixture-v1"; activationAttemptId: string; attemptRef: ByteRef;
  outcome: "COMMITTED" | "REJECTED"; reason: string; fullHeadBeforeRef: ByteRef; fullHeadAfterRef: ByteRef;
  candidateRef: CandidateRefV1; barrierRootId: string; activationRecordRef: ByteRef | null;
}
export interface AttemptAppendReceipt92 {
  version: "l8-t2-attempt-append-receipt-fixture-v1"; attemptRef: ByteRef; activationAttemptId: string;
  consumedFinalACaseRef: ByteRef; counterBeforeRef: ByteRef; counterAfterRef: ByteRef;
  controlSequenceBefore: number; controlSequenceAfter: number; expectedFullHeadRef: ByteRef; operationEventKey: string;
  // T2 compares the exact explained control postimage, never requires that the
  // case's before-counter remain current after its OWN successful append.
  // No expected operational/K/ledger/proof/source revision is updated here.
}
export interface RetainedT2Inputs92 {
  // All independently acquired before invoking a future SUT. Data composition
  // below is not the privileged lookup/ownership verifier implemented in S2.
  parent: ReadonlyData<ParsedExecutionEnvelopeV1>; child: ReadonlyData<ParsedExecutionEnvelopeV1>;
  independentChild: ReadonlyData<IndependentlyLoadedSourcesV1>; candidate: CandidateRefV1;
  drain: BoundDocument<DrainEntryV1>; observation: FinalObservation92;
  staged: BoundDocument<StagedCandidate92>; policyFile: RetainedSource92<MaterializationReadback92>;
  activationCounter: RetainedSource92<ActivationCounter92>; finalA: RetainedSource92<FinalACase92>;
}

function copy92<T>(value: ReadonlyData<T>): T { return JSON.parse(canonical(value)) as T; }
function equal92(actual: unknown, expected: unknown, why: string): void {
  if (canonical(actual) !== canonical(expected)) throw new Error(`HOLD fixture92 input: ${why}`);
}
/** Consistency-only joins over already-retained DATA, never an authority oracle.
 * No producer/category enumeration is manufactured, no value defaults to []. */
export function finalInputJoins92(host: RetainedT2Inputs92): void {
  const registry = decoded(host.observation.registry.source), inventory = decoded(host.observation.inventory.source);
  equal92(Object.keys(host.observation.categories).sort(), [...CATEGORY_NAMES92].sort(), "every category explicit, no unknown extra");
  equal92(registry.producers.map(p => p.producerId).sort(), ["own-control92", "parent-policy-file92"].sort(), "retained complete producer roster");
  equal92(inventory.producerRegistryRef, host.observation.registry.source.ref, "inventory/registry retained ref");
  equal92(inventory.categoryRefs.map(c => c.category).sort(), [...CATEGORY_NAMES92].sort(), "complete inventory category index");
  const producerIds = registry.producers.map(p => p.producerId).sort();
  equal92(host.observation.producerJournals.map(j => decoded(j.source).producerId).sort(), producerIds, "one full journal per producer");
  for (const category of CATEGORY_NAMES92) {
    const evidence = host.observation.categories[category], rows = decoded(evidence.rows.source), enumeration = decoded(evidence.enumeration.source);
    equal92(rows.category, category, "row category"); equal92(enumeration.category, category, "enumeration category");
    equal92(rows.domain, registry.domain, "row domain"); equal92(enumeration.domain, registry.domain, "enumeration domain");
    equal92(rows.rootOriginRefs, inventory.rootOriginRefs, "all origins included in each category");
    equal92(enumeration.rootOriginRefs, inventory.rootOriginRefs, "enumeration/all origins");
    equal92(enumeration.rowsRef, evidence.rows.source.ref, "independent enumeration pins rows");
    equal92(enumeration.producerRegistryRef, host.observation.registry.source.ref, "enumeration retained roster");
    equal92(enumeration.producerCuts.map(c => c.producerId).sort(), producerIds, "no missing producer cut even for zero writes");
    const index = inventory.categoryRefs.find(c => c.category === category)!;
    equal92(index.rowsRef, evidence.rows.source.ref, "inventory rows"); equal92(index.enumerationRef, evidence.enumeration.source.ref, "inventory enumeration");
    equal92(index.rowsCurrentRef, evidence.rows.current.ref, "rows current source"); equal92(index.enumerationCurrentRef, evidence.enumeration.current.ref, "enumeration current source");
  }
  const finalA = decoded(host.finalA.source), staging = decoded(host.staged), drain = decoded(host.drain), counter = decoded(host.activationCounter.source);
  const ledger = decoded(host.observation.rootLedger.source);
  equal92(host.observation.rootLedgerRef, host.observation.rootLedger.source.ref, "independent complete logical ledger source");
  equal92(ledger.domain, registry.domain, "complete root ledger domain");
  equal92(finalA.attemptPreimage.expectationsT2.budgetLedgerRevision, ledger.revision, "current ledger revision, not T0/T1");
  equal92(finalA.attemptPreimage.expectationsT2.budgetLedgerDigest, ledger.budgetLedgerDigest, "all slots ledger bytes bound");
  equal92(finalA.attemptPreimage.expectationsT2.spentBySlot, ledger.spentBySlot, "SPENT/BURNED history preserved");
  equal92(finalA.attemptPreimage.expectationsT2.encumberedBySlot, ledger.encumberedBySlot, "engaged rights not refunded across epochs");
  equal92(finalA.purpose, "activate-a-fixture", "distinct FINAL A purpose"); equal92(finalA.finalInventoryRef, host.observation.inventory.source.ref, "final inventory");
  equal92(finalA.stagedCandidateRef, host.staged.ref, "critical data staged before collection");
  equal92(finalA.activationCounterBeforeRef, host.activationCounter.source.ref, "root attempt counter preimage");
  equal92(finalA.attemptPreimage.candidateRef, host.candidate, "opposable candidate"); equal92(drain.candidateRef, host.candidate, "T1 candidate");
  equal92(staging.candidateRef, host.candidate, "staged pointed candidate"); equal92(staging.barrierRootId, drain.barrierRootId, "same continuous barrier");
  equal92(finalA.attemptPreimage.barrierRootId, drain.barrierRootId, "final case T1 barrier"); equal92(finalA.attemptPreimage.drainEntryRef, host.drain.ref, "T1 cut ref");
  equal92(counter.maxActivationAttempts, 2, "existing policy2, no new bound"); equal92(counter.ceilingScope, "root-aggregate", "no reset by new barrier");
  equal92(finalA.attemptPreimage.activationAttemptOrdinal, counter.usedAttempts + 1, "next root ordinal");
  equal92(finalA.attemptPreimage.previousActivationAttemptId, counter.latestAttemptId, "continuous root attempt chain");
  equal92(host.child.envelope.authorizationKind, "transition-a-fixture-v1", "A only");
  equal92(host.child.envelope.activationPolicy.maxActivationAttempts, 2, "ratified policy unchanged");
  equal92(host.child.envelope.generation.parentGenerationId, host.parent.generationId, "actual parent");
  equal92(host.child.envelope.admissionSource.budgetLineage.rootAccountId, registry.domain.rootAccountId, "same acquired root");
  equal92(host.child.envelope.sourceMissionSnapshot.ref, host.parent.envelope.sourceMissionSnapshot.ref, "science source not refreshed");
  const readback = decoded(host.policyFile.source);
  equal92(readback.readUtf8, POLICY_UTF8_92, "REAL provider read bytes, never a synthetic plan receipt");
  equal92(readback.readByteLength, 149, "real read bytes count"); equal92(readback.readSha256, POLICY_SHA256_92, "real read SHA");
}

/** Builds only a REQUEST BD using retained input. Future backend still resolves
 * finalA through its private current port and re-reads real sources/OWN in TX. */
export function activationAttemptInput92(host: RetainedT2Inputs92): BoundDocument<ActivationAttemptV1> {
  finalInputJoins92(host); const finalA = decoded(host.finalA.source);
  const body: ActivationAttemptV1 = { version: "l8-activation-attempt-v1", ...copy92(finalA.attemptPreimage),
    authorizationKind: "transition-a-fixture-v1", finalAdoption: null,
    authorityRecordRefs: [copy92(host.finalA.source.ref), ...copy92(finalA.sourceCapabilityRecordRefs)] };
  return document(body.version, body); // not activationAttemptId, proof or outcome
}

// Closed manual oracles, independent of future store/attempt/counter producers.
export const MANUAL_EXPECTATIONS92 = {
  nominalAtoA: { oldState: "RETIRED", childState: "ACTIVE", headDelta: 1, activePlanDelta: 1, candidateRevisionDelta: 1,
    candidatePointer: null, barrier: null, mode: "RUNNING", rootLedgerDelta: 0, knowledgeDelta: 0, factsReapplied: 0,
    attemptBodiesChanged: 0, activationRecords: 1, committedOutcomes: 1, newAdmissionCount: 0 },
  appendAttempt: { headDelta: 0, candidateRevisionDelta: 0, inventoryDelta: 0, knowledgeDelta: 0, budgetLedgerDelta: 0,
    logicalSlotDelta: 0, attemptCounterDelta: 1, bodiesAppended: 1, outcomesAppended: 0 },
  exactRetry: { activationRecordsAdded: 0, outcomesAdded: 0, attemptCounterDelta: 0, preparationCounterDelta: 0, admissionsAdded: 0 },
  staleAttempt: { outcome: "REJECTED", attemptBodyChanged: 0, activeChanges: 0, barrierLifted: 0, slotDelta: 0 },
  appendFailureRollback: { headChanged: 0, oldRetired: 0, childActivated: 0, barrierLifted: 0, newActivation: 0, newOutcome: 0, eventsAdded: 0 },
  emptyWorkIsNotEmptyInventory: { policyMaterializations: 1, actualPolicyReadbacks: 1, requiredFiles: 1,
    engagedFamilies: 0, executions: 0, scientificPublications: 0 },
  quotaSequence85: [
    { phase: "bootstrap", preparationUsed: 1, activationUsed: 0, activeOrdinal: 0, candidateOrdinal: null },
    { phase: "prepareG1", preparationUsed: 2, activationUsed: 0, activeOrdinal: 0, candidateOrdinal: 1 },
    { phase: "T2G1", preparationUsed: 2, activationUsed: 1, activeOrdinal: 1, candidateOrdinal: null },
    { phase: "prepareG2", preparationUsed: 3, activationUsed: 1, activeOrdinal: 1, candidateOrdinal: 2 },
    { phase: "T2G2", preparationUsed: 3, activationUsed: 2, activeOrdinal: 2, candidateOrdinal: null },
    { phase: "prepareG3-refused-ONLY-origin-quota", preparationUsed: 3, activationUsed: 2, activeOrdinal: 2, candidateOrdinal: null },
  ], // expectations only; NO invented three-origin history/receipts/DB rows
} as const;
export const FINITE_NEGATIVES92 = [
  { mutation: "family-engaged-even-no-outbox", expected: "HOLD_BEFORE_T2", reason: "not quiescent" },
  { mutation: "category-or-producer-unknown", expected: "HOLD_BEFORE_ATTEMPT", reason: "missing completeness is not []" },
  { mutation: "orphan-intent-attempt-claim-publication", expected: "HOLD_BEFORE_T2", reason: "unexplained operation, no active filter" },
  { mutation: "current-source-or-capability-revoked", expected: "HOLD", reason: "LIVE provider/OWN current, not a request boolean" },
  { mutation: "stale-full-head-candidate-barrier-ledger-fences", expected: "REJECTED_OUTCOME_BARRIER_RETAINED", reason: "no refresh of immutable attempt" },
  { mutation: "T1-bootstrap-B-native-handle", expected: "HOLD", reason: "wrong authority purpose/source" },
  { mutation: "operator-paused", expected: "HOLD", reason: "no implicit resume/barrier lift" },
  { mutation: "policy-file-absent-altered-or-readback-inexact", expected: "HOLD", reason: "actual readable promised bytes required" },
  { mutation: "existing-file-unowned-even-exact-hash", expected: "HOLD_BEFORE_WRITE", reason: "no adopt/overwrite by hash" },
  { mutation: "TTL-expires-after-real-T2-append", expected: "ROLLBACK_ENTIRE_T2", reason: "postappend current lease revalidation" },
  { mutation: "reopen-without-current-final-provider", expected: "AUDIT_ONLY_NO_NEW_ACTIVATION", reason: "history does not create current authority" },
] as const;
