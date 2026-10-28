/**107 DATA ONLY. No imports, constructors, functions, binding, IO or execution.
 * Selectors below require actual future privileged HOST/OWN sources. They are
 * NOT ByteRefs, accepted receipts, observations or pre-issued capabilities.
 * Manual expectations precede product changes; never generated from SUT output.
 */

export const CROSS_EPOCH_107 = {
  version: "s2-cross-epoch-fixture-input107-v1",
  scope: "one-new-parent-owned-case-before-bootstrap",
  status: "REQUIRED_NOT_OBTAINED",
  previousEvidence: {
    quotaThreeThenFourthSpecificRefusal: "VERIFIED_IN_FIXTURE_106",
    gate105: "CLOSED_116_PASS_0_FAIL_0_SKIP_763_ASSERTIONS",
    reviewedSourceSet: "ae1b4ecca0682d4a733bf316b7c9ffe7119d0a5f3928e0131591cc02047d29f8",
    executedSourceSet: "83121f0349ffc3d565b3dcd9ac406a2476f5350c83046eedf0b752bcf0457d3d",
  },
  sourceChecksBeforeAnySeal: {
    roles: ["A", "B", "R"],
    bodyCapUtf8BytesPerSlot: 100000,
    reservedDebitUtf8BytesPerSlot: 100000,
    slots: 3,
    engagedReservedUtf8Bytes: 300000,
    logicalRemainingUtf8Bytes: 0,
    maxNewExecutionsPerRole: 1,
    pass: 1,
    activationAttemptsCeiling: 2,
    durableOriginsCeilingIncludingBootstrap: 3,
    controllerExpiresAtEvent: 10000,
    familyExpiresAtEvent: 1000,
    sourceMismatchAction: "HOLD_WITH_EXACT_CONTRADICTION_NO_CAST_OR_THRESHOLD_CHANGE",
  },
  mustStayIdenticalWithinCase: [
    "OWN connection/path", "host universe/case/owner", "rootAccountId",
    "rootAllocationRef", "rootLimits bytes/ref", "rootSlotGrants bytes/ref",
    "rootModelBindings bytes/ref", "rootBootstrap sources", "origin issuer/grant",
    "physical acquisition", "asset assignment/lease/path", "policy2/1 bytes149/SHA",
  ],
  producerAcquisition: {
    timing: "independent privileged HOST allocation and complete journals BEFORE bootstrap",
    admitted: ["own-control92", "parent-policy-file92"],
    notAdmittedByIndependentSource: ["sender", "executor", "scientificPublisher", "native"],
    evidence: ["allocation bytes/ref", "root/case/OWN ownership", "operation policy bytes/ref", "all producer journals and cuts"],
    reject: ["caller complete boolean", "missing API implies none", "roster widened after unknown operation"],
  },
} as const;

/** Concrete additive JSON DATA recipe; future helper materializes it only under
 * a separate GO. The 100001 ASCII payload bytes ALONE exceed unchanged C100000.
 * It is not inside command and must not change command's retained S1 bytes. */
export const BURN_ADMISSION_ADDEND_107 = {
  property: "crossEpochFixturePadding107",
  placement: "Admission top-level additional JSON field",
  codePoint: "x",
  asciiByte: 120,
  repeatCount: 100001,
  minimumAddedPayloadUtf8Bytes: 100001,
  capUtf8Bytes: 100000,
  expectedComparison: "actual complete Admission UTF8 > C",
  commandMutation: "FORBIDDEN",
  expectedPin: "BURNED",
  expectedNewOutboxes: 0,
  expectedNewPhysicalAllocations: 0,
  expectedDispatches: 0,
} as const;

export const MANUAL_ROOT_ORACLE_107 = {
  slotA: { role: "A", state: "SPENT", cap: 100000, reservedDebit: 100000, physicalAllocationsEver: 1 },
  slotB: { role: "B", state: "BURNED", cap: 100000, reservedDebit: 100000, physicalAllocationsEver: 0 },
  slotR: { role: "R", state: "ENCUMBERED", cap: 100000, reservedDebit: 100000, physicalAllocationsEver: 0 },
  aggregate: { spent: 100000, burned: 100000, encumbered: 100000, engaged: 300000, remaining: 0, unit: "reserved Admission UTF8 bytes" },
  beforeT0AndAfterT2AndReopen: {
    logicalClaimsPinned: 2,
    slotKeys: 3,
    outboxes: 1,
    outboxState: "TERMINAL",
    outboxAttempt: 0,
    outboxReceipt: null,
    families: 1,
    familyState: "RELEASED",
    activeWorkerAllocations: 0,
    allocationsEver: 1,
    releasedAllocationIds: 1,
    poolRevision: 2,
    currentClaims: 0,
    scientificPublications: 0,
    actualDispatches: 0,
  },
  unchangedAtActivation: [
    "all three slot keys/grants/state/revision/cap/debit/claim bytes",
    "A and B admission/command/raw SHA/IDs/origin/fences/retryPolicy",
    "R origin encumbrance and no claim_utf8", "root revision/digest/limits/grants/model bindings",
    "knowledge root/revision/ledger/facts", "allocation and release history",
  ],
  activationOnly: { headRevisionDelta: 1, activePlanRevisionDelta: 1, candidateRevisionDelta: 1, inventoryRevisionDelta: 1, oldOrigin: "RETIRED", childOrigin: "ACTIVE", candidate: null, barrier: null, mode: "RUNNING" },
  child: { selectedUnitIds: [], selectedTotalAdmissionUtf8Bytes: 0, newReadyUnits: 0, newAdmissions: 0, decision: "DEFER_ROOT_ENTITLEMENTS_ALREADY_ENGAGED" },
} as const;

export const ORDERED_CASE_107 = [
  { step: "allocate-case", api: "new HOST/domain/OWN/asset assignment BEFORE bootstrap", requires: ["closed independent producer roster", "same scientific/root bindings throughout case"] },
  { step: "bootstrap", api: "installBootstrapA", requires: ["fresh case source qualifies S1", "manual C/N/T verified", "real per-case policy file under future parent gate"] },
  { step: "engage", api: "reserveFamily", expect: ["A/B/R ENCUMBERED", "family ACTIVE", "origin unit RESERVED", "fn/G2 claims explained"] },
  { step: "resource-A", api: "publishRemaining/resolveResourceWitness", requires: ["fresh actual empty-pool observation", "exact A assignment/body/worker/account/role source"] },
  { step: "pin-A", api: "prepareAdmissionV3", expect: ["A SPENT", "one PREPARED outbox attempt0/receiptNULL", "one exact physical allocation", "complete actual Admission <= C100000"] },
  { step: "retry-A", api: "prepareAdmissionV3 exact same bytes/IDs/policy/witness", expect: ["same identity result", "zero extra debit/outbox/allocation/event"] },
  { step: "resource-B", api: "publishRemaining/resolveResourceWitness", requires: ["fresh branch A-occupied actual inventory/cut", "exact B assignment", "no scientific predecessor for B"] },
  { step: "burn-B", api: "prepareAdmissionV3 with BURN_ADMISSION_ADDEND_107", expect: ["B BURNED full pin and event", "no B outbox/allocation/dispatch", "R remains ENCUMBERED"] },
  { step: "acquire-Q-A", api: "privileged HOST acquisition then register observation", requires: ["all Q_AND_RETIREMENT_JOINS_107 live predicates", "not an invented accepted receipt"] },
  { step: "commit-Q-A", api: "proveTerminalV3", expect: ["A TERMINAL", "attempt0/receiptNULL unchanged", "exact durable Q event"] },
  { step: "retire-family", api: "releaseProvenV3", expect: ["A worker released by its Q", "family RELEASED", "unit CANCELLED", "no claims", "all three logical rights unchanged"] },
  { step: "refresh-physical", api: "publishRemaining existing releasedA source", requires: ["actual poolRevision2", "current empty occupation", "no logical refund"] },
  { step: "freeze-T0", api: "new child science/DEFER + hostObservation", requires: ["all work above complete before T0", "T0 includes real S/B/E ledger and terminal history", "no later T0 refresh"] },
  { step: "prepare-and-drain", api: "prepareInitial then requestDrain", expect: ["distinct T1 barrier", "head/candidate CAS from exact T0", "no work or slot reset"] },
  { step: "stage-and-final", api: "retain pointed candidate + collect final20 + appendActivationAttempt", requires: ["positive terminal-history audit", "live Q/source/release checks", "retained immutable history cut", "final cuts/fences/current expectations"] },
  { step: "activate", api: "activateA", expect: ["MANUAL_ROOT_ORACLE_107 preserved", "DEFER child nonREADY", "no scientific publication", "all postappend guards retained"] },
  { step: "reopen-replay", api: "future owned reopen + exact committed retry/replay", expect: ["identical committed record/head/slot bytes", "no charge or resurrection", "historical cut not substituted for live permission"] },
] as const;

export const Q_AND_RETIREMENT_JOINS_107 = {
  hostContext: ["independently allocated case/universe", "owned connection", "root/lineage", "closed producer roster since creation", "current journal cuts", "no unexplained emission/receipt/effect"],
  A: {
    actualSources: ["slot A claim bytes", "outbox Admission/command UTF8 and raw hashes", "requestDigest including attemptId", "resource assignment/allocation event", "current authority source bytes/ref/revision/revocation"],
    exactFields: ["missionId", "originGenerationId", "source envelope fingerprint", "unitId/subIntentId", "executionId/attemptId", "owner", "controllerFence/familyFence", "body hash/requestDigest", "attempt=0", "receipt=NULL"],
    existingObservationShape: { kind: "observation", state: "absent", attempt: 0, quiescent: true },
    caseBinding: "in independently retained HOST context/journal, NOT an extra field cast into closed FixtureObservationRecordV1",
    durableProof: ["actual terminal_proof equals current observation bytes", "g3_fixture_observation effect TERMINAL", "no later accepted/audit_only contradiction"],
  },
  B: ["same full pin/C/reservedDebit/retry policy", "actual complete Admission > C", "g3_slot_burned bytes", "no B outbox/attempt/physical allocation/send"],
  R: ["initial family encumbrance", "no claim_utf8 or outbox/attempt/physical allocation/send", "same origin entitlement after retirement/activation"],
  release: ["g3_resource_released exact allocation/worker/proofDigest", "g3_family_released exact original lease/fences", "fn/G2 claims removed only by exact release", "released IDs retained", "no current occupation"],
  scientificRetirement: ["A positively never sent", "B burned before IO", "R never pinned/sent", "all other operations/producers exhaustively explained", "retirement without scientific effect is the DRAIN publication alternative"],
  unavailable: "HOLD_S3_IF_ANY_EMISSION_EFFECT_OR_REQUIRED_PUBLICATION_UNKNOWN",
} as const;

export const FINAL_CATEGORIES_107 = [
  { category: "origins", collect: "all immutable origins, S1 bindings, source digests and current/retired/pointed states" },
  { category: "families", collect: "released original lease/fences/unit and durable release; active families separately forbidden" },
  { category: "units", collect: "all selected/nonselected rows; old CANCELLED then RETIRED, child DEFER/BLOCKED" },
  { category: "executions", collect: "actual A outbox/execution; distinguish B burned pin and R never-created execution" },
  { category: "intents", collect: "all A/B/R source subintents joined to real pins or explicit never-pinned R" },
  { category: "outboxes", collect: "A TERMINAL row with retained bytes/proof; B/R absence independently explained" },
  { category: "attemptsL6", collect: "A actual attempt0 never-sent cut, exact immutable attemptId; no positive send attempt; B/R absent by proof" },
  { category: "claims", collect: "current raw claims empty with exact fn/G2/worker release history, not empty by omission" },
  { category: "publications", collect: "complete producer journals plus per-subintent no-scientific-effect retirement; required/unknown publication HOLD" },
  { category: "publicationReadbacks", collect: "explicit no-publication-retirement evidence, not missing API default[]" },
  { category: "materializations", collect: "actual promised per-case policy file and any other real materializations; unknown/pending HOLD" },
  { category: "materializationReadbacks", collect: "actual exclusive close/read/hash/identity/current proofs, never synthetic readback" },
  { category: "proofs", collect: "all Q/observation sources including audit-only contradictions, retained source metadata and file evidence" },
  { category: "releases", collect: "A resource and family release bytes/events/Q/lease joins; no refund" },
  { category: "sourceCapabilities", collect: "all authority/resource/assignment/remaining/retirement sources, current flags and historical refs" },
  { category: "controllerLeases", collect: "all controllers joined to actual origin/envelope/authorized historical fence; current TTL separately" },
  { category: "physicalAllocations", collect: "all A allocation/release history retained; active occupation0, never global-history[]" },
  { category: "stagedUnits", collect: "only pointed candidate selected/nonselected rows already staged, no post-CAS installation" },
  { category: "stagedBlobs", collect: "critical source bytes and immutable terminal-history cut pinned before final attempt" },
  { category: "requiredFiles", collect: "all promised paths under same parent case lease, actual readable bytes/current writer authority" },
] as const;

export const WORK_EVENT_JOINS_107 = [
  { kind: "g3_family_reserved", producer: "own-control92", unitId: "actual origin unit", categories: ["families", "units", "claims", "intents"], source: "real lease/claims and A/B/R encumbrance change" },
  { kind: "g3_resource_allocated", producer: "own-control92", unitId: "actual origin unit", categories: ["claims", "physicalAllocations"], source: "exact A assignment/acquisition/current inventory and allocation payload" },
  { kind: "g3_admission_prepared", producer: "own-control92", unitId: "actual origin unit", categories: ["executions", "intents", "outboxes", "attemptsL6"], source: "actual A SPENT pin, Admission bytes and outbox attempt0" },
  { kind: "g3_slot_burned", producer: "own-control92", unitId: "actual origin unit", categories: ["intents", "proofs"], source: "actual B BURNED full pin/over-C image, no outbox or physical effect" },
  { kind: "g3_fixture_observation", producer: "own-control92", unitId: "actual origin unit", categories: ["proofs", "outboxes", "attemptsL6"], source: "real current observation and exact effect TERMINAL or audit_only, never relabelled" },
  { kind: "g3_resource_released", producer: "own-control92", unitId: "actual origin unit", categories: ["claims", "releases", "physicalAllocations"], source: "actual allocation, worker, Q proofDigest and pool revision" },
  { kind: "g3_family_released", producer: "own-control92", unitId: "actual origin unit", categories: ["families", "units", "claims", "releases"], source: "real original lease/fences and Q-backed resource/fn/G2 release history" },
] as const;

/** Finite API paths, not SQL corruption and not promises that an invalid proof
 * must throw: mismatched fences are currently an explicit audit_only branch. */
export const FINITE_NEGATIVES_107 = [
  { case: "Q-missing", change: "stop work trace before proveTerminal; keep family/worker active", observe: "release refuses and fresh final holds; no TTL or unknown-event masking" },
  { case: "Q-wrong-body", change: "register actual HOST observation with a distinct validhex requestDigest", observe: "proveTerminal refuses exact body scope; no terminal proof or release" },
  { case: "Q-wrong-attempt", change: "attempt1 absent+quiescent while actual A outbox attempt0", observe: "exact attempt check refuses; no terminal proof or release" },
  { case: "Q-wrong-controller-fence", change: "registered observation fence+1, same valid body/execution", observe: "observation audit_only, never TERMINAL; release/final hold" },
  { case: "Q-wrong-family-fence", change: "registered observation familyFence+1", observe: "observation audit_only, never TERMINAL; release/final hold" },
  { case: "Q-revoked-live", change: "after valid Q/release/T1 revoke consumed proof via authority API, then fresh final sources", observe: "live Q/current source check holds before effect; do not refresh historical T0" },
  { case: "late-accepted-contradiction", change: "after retirement/T1 record adversarial accepted observation via existing API; no actual receipt or dispatch invented", observe: "audit_only event retained, receiptNULL unchanged, currentQ/fresh final HOLD" },
  { case: "terminal-but-worker-held", change: "commit Q but omit release; snapshot real active allocation/family at T0/T1/final", observe: "terminal label insufficient; HOLD occupation/release gate" },
  { case: "unknown-category", change: "fresh final provider lacks one actual mandatory category", observe: "HOLD complete category gate, never substitute []" },
  { case: "unknown-source-or-producer", change: "real extra unadmitted work event/source before fresh collection", observe: "HOLD closed semantic journal join, never amend roster after facts" },
  { case: "committed-history-later-revoked", change: "after successful T2 revoke old Q then reopen under a future parent gate", observe: "immutable committed cut replay does not recharge/resurrect; any new consumption needs live sources and HOLD on contradiction" },
] as const;

export const PRIVATE_CUT_REQUIREMENTS_107 = {
  suggestedDataVersion: "l8-cross-epoch-terminal-history-cut-fixture-v1",
  authenticity: "not instantiated here; actual raw records/documents/events acquired and retained before final attempt",
  contains: ["owned case/root domain", "all family/unit/pin/outbox/allocation histories", "actual Q/receipt source bytes and consumed metadata", "no-send producer journals/cuts", "release event/claim joins", "all slot grants/C/N/T/remaining arithmetic", "explicit retired-without-scientific-effect disposition"],
  persistence: "existing private BD/authority storage and staged critical blobs/refs, no DDL; commit joins immutable cut, not a future attempt hash",
  liveFinalMode: "re-read actual sources/revocations/late evidence before and after append; fail closed",
  committedHistoryMode: "audit the consumed immutable cut and exact commit/event/slot postimages; never turn historical evidence into current authority",
  narrowImplementationSites: ["graph-generation-store", "graph-final-inventory", "graph-generation-transition", "existing private T2 author helpers/tests"],
  forbidden: ["new public S1 types", "new service/framework/global registry", "hidden sender/publisher", "history deletion", "root/slot/counter reset", "scientific COMMITTED/readback fabrication"],
} as const;
