/**118 DATA only. No imports, functions, construction, hashes or trusted records.
 * $tokens are unresolved bindings to future independently retained actual bytes.
 * They are NOT ByteRefs, DB snapshots, handles, fixture evidence or S1 PASS.
 * Manual expectations come from report118 and final pinned contracts, not SUT/QA.
 */
export const REPLACEMENT_118 = {
  status: "SOURCE_INPUTS_ONLY_NOT_S1_OR_RUNTIME_QUALIFIED",
  authority: {
    report: "reports/118-preparer-remplacement-sous-meme-barriere.md",
    finalContracts: ".tmp/mission-v2-20261018-continuous/s1-common-contract-final-plan/inputs/contracts",
    clauses: ["DRAIN_AND_ACTIVATION.md:386:41", "QA_MATRIX.md:132:29", "QA_MATRIX.md:226:24", "EXECUTION_ENVELOPE.md:216:6"],
    publicType: "CandidateReplacementV1:248-252 (already ratified; no new public type)",
  },
  limits: {
    valuesExpectedFromExistingIndependentT0Sources: { durableOriginsIncludingBootstrap: 3, replacements: 1, activationAttempts: 2 },
    acceptedAuthority: ["$retained-origin-HOST-issuer-ownership-firstIssuance-current", "$root-origin-grant", "$policy-asset-bytes-and-current-authorized-record-at-T0"],
    deniedAuthority: ["this DATA object", "caller ceiling/digest", "missing pointer initialized as zero", "candidate-local counter", "restart/new DB as counter reset"],
    counterScopes: { preparation: "same root, complete durable origins", replacement: "same root and continuous barrier, retained chain", activation: "existing same-root chain across OLD/NEW" },
  },
  bindings: {
    notation: "$name resolves once to actual independently retained identity/bytes; equality means byte/ref equality, not label agreement",
    identities: ["$OWN.connection", "$OWN.actual-main-path", "$case", "$owner", "$root", "$lineage", "$active-parent-generation", "$OLD.candidateRef", "$NEW.candidateRef", "$barrier", "$T1.drainEntryRef", "$T1.engagedRef", "$T1.inventoryRef"],
    resolutionRequirements: ["same owned real path via actual connection", "complete HOST record provenance/current/revocations", "source binding before demand", "no manufactured SHA/ref/current from these strings", "no cast of symbolic DATA into a product record"],
    pinnedHistoricalBytes: ["$active-parent.envelope", "$OLD.envelope", "$OLD.run", "$OLD.source-documents", "$T1.drain-entry", "$T1.engaged-cut", "$T1.inventory-cut", "$source-current-before-change"],
  },
} as const;

// Literal semantic source change; all fields other than available are identical.
// HOST acquisition must supply its OWN actual documents for these expected values.
//119 Align both examples with qualified T2 createResourceCompleteInput22-30;
// not an increase after bootstrap or a different root/resource fixture.
export const CURRENT_TEMPLATE_BEFORE_118 = {
  version: "l8-execution-template-v1",
  settings: { profiles: { A: "author", B: "author", R: "reviewer" }, maxConcurrent: 3, familyTtlEvents: 10, maxAdmissionAttempts: 2, retryDelayMs: 1 },
  workers: [
    { workerId: "worker-a", profile: "author", model: "primary", tools: [], accountId: "shared", slots: 4, cpu: 8, gpu: 3, budget: 10, available: true },
    { workerId: "worker-b", profile: "author", model: "alias", tools: [], accountId: "shared", slots: 4, cpu: 8, gpu: 3, budget: 10, available: true },
  ],
  accounts: [{ accountId: "shared", slots: 4, budget: 10 }],
} as const;
export const CURRENT_TEMPLATE_AFTER_118 = {
  version: "l8-execution-template-v1",
  settings: { profiles: { A: "author", B: "author", R: "reviewer" }, maxConcurrent: 3, familyTtlEvents: 10, maxAdmissionAttempts: 2, retryDelayMs: 1 },
  workers: [
    { workerId: "worker-a", profile: "author", model: "primary", tools: [], accountId: "shared", slots: 4, cpu: 8, gpu: 3, budget: 10, available: false },
    { workerId: "worker-b", profile: "author", model: "alias", tools: [], accountId: "shared", slots: 4, cpu: 8, gpu: 3, budget: 10, available: true },
  ],
  accounts: [{ accountId: "shared", slots: 4, budget: 10 }],
} as const;

export const SOURCE_JOINS_118 = {
  acquisitionOrder: ["retain OLD complete source set and source current", "T1 commits original immutable cuts", "independent HOST observes actual reduced worker availability", "HOST retains new template and complete source binding/current", "request explicit NEW preparation", "bind/replan/seal new origin on future authorized gate", "request capability and CAS with latest full preimage"],
  hostCurrentRequired: {
    authority: "independent privileged fixture HOST, not request data or source builder self-attestation",
    connection: "$OWN.connection",
    connectionPath: "$OWN.actual-main-path",
    owner: "$owner",
    rootAccountId: "$root",
    lineageId: "$lineage",
    activeParent: "$active-parent-generation",
    oldTemplateRef: "$current-template-before.ref",
    newTemplateRef: "$current-template-after.ref",
    sourceBindingsRef: "$complete-new-source-bindings.ref",
    currentSequence: "monotone retained current designation; old current document never overwritten",
    liveChecks: ["issuer and ownership", "exact template bytes/ref", "complete documents", "current pointer", "revocation state", "policy authority", "before and after real append"],
    missingOrStale: "HOLD, never UNKNOWN interpreted as permission",
  },
  changeTogether: [
    "admissionSource.executionTemplate bytes/ref (worker.available only semantic template delta)",
    "executionSourceSpec.templateFingerprint and document bytes/ref",
    "admissionSource.context.executionSpecFingerprint and context fingerprint",
    "admissionSource.sourceFingerprints.executionTemplate/executionSourceSpec/context",
    "independent.executionTemplate/executionSourceSpec and all other complete independent sources",
    "explicitly rebuilt planning plan/sidecar/binding with exact new context fingerprints",
    "preparationObservationT0 operational/source/proof/event expectations from actual current snapshot",
    "sourceBindingsRef and source HOST current capability refs",
    "NEW body/envelopeFingerprint/generationId/envelopeRef/runRef/stage refs",
  ],
  preserveExactly: [
    "rootTemplate bytes and root worker/account inventory ceilings", "worker identity/profile/model/account/tools/slots/cpu/gpu/budget", "all template settings",
    "active parent origin/generation; NEW ordinal1 and same parent as OLD", "root/lineage/epoch/rootAllocation/rootLimits/rootSlotGrants/rootModelBindings/rootBootstrapSources",
    "activationPolicy source asset and finite ceilings2/1", "K/rootHash/knowledge ledger/facts/materializations", "fullGraphSnapshot/group source/structural A transport",
    "approvals/input manifest/input bytes/policy file and its real lease/readback", "OLD source bytes and IDs", "T1 entry/engaged cut/inventory cut",
  ],
  noRecomputeAt: ["OLD retry", "source-ref refresh", "origin parse/load/export", "reopen/replay", "CAS itself"],
  newGeneration: { differsFrom: "$OLD.generationId", parentGenerationId: "$active-parent-generation", ordinal: 1, regime: "A", authorizationKind: "transition-a-fixture-v1" },
  incompatibility: "Report exact S1/source/root contradiction before casting, relaxing validation or fabricating K/publication/native proof",
} as const;

// Complete GenerationViewV3 field tables; I is the actual pre-stage inventory
// revision, not assumed zero. h1/c2 is the minimal initial-prepare + T1 route.
// The digest belongs to a separate inventory record, NOT a new public head field.
export const FULL_HEAD_TABLE_118 = [
  {
    phase: "PRE_STAGE_OLD_POINTED",
    head: {
      version: "l8-graph-generation-head-v1", missionId: "$mission", lineageId: "$lineage",
      generationId: "$active-parent-generation", envelopeFingerprint: "$active-parent.envelopeFingerprint", sourceDigest: "$active-parent.sourceDigest",
      rootAccountId: "$root", owner: "$owner", controllerFence: "$controllerFence",
      knowledgeRevision: "$K.revision", planFingerprint: "$active-parent.planFingerprint",
      revision: 2, inventoryRevision: "$I", budgetLedgerRevision: "$budget.revision", budgetLedgerDigest: "$budget.digest",
      activeGenerationId: "$active-parent-generation", activePlanRevision: "$active-plan-revision", sourceMissionRevision: "$mission-source.revision",
      knowledgeRootHash: "$K.rootHash", knowledgeLedgerDigest: "$K.ledgerDigest", knowledgeLedgerRevision: "$K.ledgerRevision",
      preparationCounterRef: "$preparation-counter-used2.ref", controlMode: "DRAIN_NEW_FAMILIES", barrierRootId: "$barrier",
      candidateGenerationId: "$OLD.generationId", candidateRef: "$OLD.candidateRef", candidateRevision: 2,
    },
    separateInventory: { revision: "$I", digest: "$actual-complete-inventory-before-stage.digest", scope: "active work plus all retained origins/staged units/source records; control documents excluded from self-digest and audited separately" },
    eventCursor: "$E", preparationUsed: 2, replacementUsed: 0, activationCounterRef: "$activation-counter-before-stage.ref",
    originStates: { activeParent: "ACTIVE", OLD: "PENDING_DRAIN", NEW: "ABSENT" },
  },
  {
    phase: "POST_STAGE_NEW_NOT_POINTED",
    head: {
      version: "l8-graph-generation-head-v1", missionId: "$mission", lineageId: "$lineage",
      generationId: "$active-parent-generation", envelopeFingerprint: "$active-parent.envelopeFingerprint", sourceDigest: "$active-parent.sourceDigest",
      rootAccountId: "$root", owner: "$owner", controllerFence: "$controllerFence",
      knowledgeRevision: "$K.revision", planFingerprint: "$active-parent.planFingerprint",
      revision: 2, inventoryRevision: "$I+1", budgetLedgerRevision: "$budget.revision", budgetLedgerDigest: "$budget.digest",
      activeGenerationId: "$active-parent-generation", activePlanRevision: "$active-plan-revision", sourceMissionRevision: "$mission-source.revision",
      knowledgeRootHash: "$K.rootHash", knowledgeLedgerDigest: "$K.ledgerDigest", knowledgeLedgerRevision: "$K.ledgerRevision",
      preparationCounterRef: "$preparation-counter-used3.ref", controlMode: "DRAIN_NEW_FAMILIES", barrierRootId: "$barrier",
      candidateGenerationId: "$OLD.generationId", candidateRef: "$OLD.candidateRef", candidateRevision: 2,
    },
    separateInventory: { revision: "$I+1", digest: "$actual-complete-inventory-with-NEW-STAGED.digest", scope: "same complete scope; NEW units STAGED and source docs present; no self-referential control digest" },
    eventCursor: "$E+1", preparationUsed: 3, replacementUsed: 0, activationCounterRef: "$activation-counter-before-stage.ref",
    originStates: { activeParent: "ACTIVE", OLD: "PENDING_DRAIN", NEW: "PREPARED" },
  },
  {
    phase: "POST_CAS_NEW_POINTED_SAME_BARRIER",
    head: {
      version: "l8-graph-generation-head-v1", missionId: "$mission", lineageId: "$lineage",
      generationId: "$active-parent-generation", envelopeFingerprint: "$active-parent.envelopeFingerprint", sourceDigest: "$active-parent.sourceDigest",
      rootAccountId: "$root", owner: "$owner", controllerFence: "$controllerFence",
      knowledgeRevision: "$K.revision", planFingerprint: "$active-parent.planFingerprint",
      revision: 3, inventoryRevision: "$I+2", budgetLedgerRevision: "$budget.revision", budgetLedgerDigest: "$budget.digest",
      activeGenerationId: "$active-parent-generation", activePlanRevision: "$active-plan-revision", sourceMissionRevision: "$mission-source.revision",
      knowledgeRootHash: "$K.rootHash", knowledgeLedgerDigest: "$K.ledgerDigest", knowledgeLedgerRevision: "$K.ledgerRevision",
      preparationCounterRef: "$preparation-counter-used3.ref", controlMode: "DRAIN_NEW_FAMILIES", barrierRootId: "$barrier",
      candidateGenerationId: "$NEW.generationId", candidateRef: "$NEW.candidateRef", candidateRevision: 3,
    },
    separateInventory: { revision: "$I+2", digest: "$actual-complete-inventory-OLD-ABORTED-NEW-PENDING.digest", scope: "same complete scope; OLD/NEW state changes explained by exact replacement event" },
    eventCursor: "$E+2", preparationUsed: 3, replacementUsed: 1, activationCounterRef: "$activation-counter-before-stage.ref",
    originStates: { activeParent: "ACTIVE", OLD: "ABORTED", NEW: "PENDING_DRAIN" },
  },
] as const;

export const ATOMIC_RECORDS_118 = {
  stage: {
    status: "PRIVATE_RECORD_DESIGN_NOT_ISSUED_AUTHORITY",
    identity: "$exact-stage-record.ref",
    purpose: "prepare-replacement-a-fixture",
    links: ["$full-pre-stage-head", "$full-post-stage-head", "$OLD.candidateRef", "$NEW.candidateRef", "$barrier", "$T1.drainEntryRef", "$T1.engagedRef", "$T1.inventoryRef", "$complete-current-sourceBindingsRef", "$source-current-ref", "$origin-grant-ref", "$preparation-counter-before.ref", "$preparation-counter-used3.ref", "$inventory-before-and-after", "$event-before-and-after"],
    retained: ["NEW original body/envelope/run/independent sources", "critical unit IDs/documents/digests all STAGED", "complete critical blobs", "actual source HOST evidence acquired before demand"],
    preparationCharge: 1, replacementCharge: 0, activationCharge: 0,
    retryIdentity: "same complete origin bytes, source refs, observation, old/barrier/cut, capability and retained preimage; no implicit source refresh",
    retryCharge: 0, rollbackCharge: 0,
  },
  replacement: {
    publicRecordShapeAlreadyRatified: {
      barrierRootId: "$barrier", drainEntryRef: "$T1.drainEntryRef", oldCandidateRef: "$OLD.candidateRef", newCandidateRef: "$NEW.candidateRef",
      currentHeadRevision: 2, currentCandidateRevision: 2, sourceBindingsRef: "$complete-current-sourceBindingsRef",
      authorityRecordRefs: ["$private-REPLACE-cap-source-ref", "$current-HOST-source-ref", "$policy-authority-ref", "$exact-stage-record.ref"], controllerFence: "$controllerFence",
    },
    privateAuthority: {
      purpose: "REPLACE_CANDIDATE_A_FIXTURE_ONLY",
      accepted: "backend private connection-bound handle with independently retained current HOST source records",
      distinctFrom: ["bootstrapA", "transitionA/request-drain", "finalA/activate", "public B/native authority"],
      boundTo: ["same actual DB/path/owner/root/lineage", "active parent/ordinal1/A regime", "OLD and NEW full candidate refs", "stage before/after identities", "full current expected head including preparationCounterRef/inventoryRevision", "separate inventory digest/cursor", "barrier/T1 entry/engaged cut/inventory cut", "controller fence and expiry", "all current source/proof refs/revocations", "root T0 authorized finite policy", "replacement counter before/after"],
      cannotBe: ["JSON caller", "matching digest only", "handle from old DB after reopen", "missing provider assumed current", "cap source issued by the replacement request itself"],
    },
    preserved: ["active parent remains ACTIVE", "T1 entry.candidateRef remains OLD", "same barrier and engaged/inventory cuts byte-exact", "all origin/source/run bytes and previous current docs", "all family/claim/body/slot/pin/debit history", "root preparation grant and activation counter"],
    changed: ["candidateRef OLD to NEW", "candidateGenerationId OLD to NEW", "headRevision2 to3", "candidateRevision2 to3", "inventoryRevision I+1 to I+2 and actual digest", "OLD state PENDING_DRAIN to ABORTED with positive superseded reason", "NEW state PREPARED to PENDING_DRAIN", "replacement0 to1", "cursor E+1 toE+2"],
    oldUnitRule: "Retain OLD staged unit bytes and STAGED rows if present; OLD ABORTED provenance makes them non-authorizing. Never READY, delete or reparent them.",
    newUnitRule: "NEW remains STAGED, not READY/active until a separate valid fresh final activation",
    afterRealAppend: ["same actual connection", "controller/source/cap/grant/policy LIVE current and not revoked", "strict current event sequence below controller expiry", "full head/control/counters/inventory postimage", "immutable OLD/T1/engaged bytes", "no extra staged origin or orphan authority/history"],
    failure: "rollback append, state, head, inventory, replacement counter and all in-TX mutations; preserve already committed stage charge3",
  },
  history: {
    enumerate: ["ACTIVE parent with provenance", "OLD immutable original envelope/run/source/preparation+T1", "NEW complete durable stage and charged origin3 even while unpointed", "OLD ABORTED requires exact consumed replacement record/event and reason", "all other committed stages require individual source/charge/disposition proof"],
    never: ["delete old origin/history", "treat all unpointed as valid", "select latest stage on reopen", "refund abandoned stage", "revoke historic commit by requiring its consumed source to stay LIVE forever"],
    liveAuthorityStillRequired: "Every NEW consumption; historic proof never resurrects permission",
  },
} as const;

export const JOURNALS_AND_CATEGORIES_118 = {
  beforeBootstrap: {
    requirement: "actual parent-issued closed producer/operation allocation retained before facts; not this expected list as authority",
    producers: ["own-control92", "parent-policy-file92"],
    newOwnOperations: ["register-independent-current-template-source", "prepare-replacement", "replace-candidate"],
    externalSendExecutorScientificPublisher: "not admitted; require positive independently retained closed-domain evidence, not missing APIs",
  },
  entries: [
    { operation: "register-independent-current-template-source", sequence: "$actual-own-producer-registration-sequence", actor: "$authorized-source-registration-actor", sourceRef: "$independent-HOST-current-source.ref", ownEventKey: null, retainedAuthorityRow: "$actual-registered-source-row", categories: ["sourceCapabilities", "proofs"] },
    { operation: "prepare-replacement", sequence: "$actual-own-producer-stage-sequence", actor: "$current-controller", sourceRef: "$actual-prepare-event-source.ref", ownEventKey: "$actual-prepare-replacement-key", categories: ["origins", "units", "proofs", "sourceCapabilities", "stagedUnits", "stagedBlobs"] },
    { operation: "replace-candidate", sequence: "$actual-own-producer-swap-sequence", actor: "$current-controller", sourceRef: "$actual-swap-event-source.ref", ownEventKey: "$actual-replacement-key", categories: ["origins", "units", "proofs", "sourceCapabilities", "stagedUnits", "stagedBlobs"] },
  ],
  joinEveryEntry: ["actual producer/operation policy", "same domain and exact source bytes/ref", "actor authority/fence", "producer sequence and complete journal cut", "source registration joins actual retained authority row with null OWN event key, never a fabricated event", "prepare/swap join exact actual event key/sequence/payload", "exact categories and complete cuts", "all unpointed/ABORTED/staged rows explained"],
  categories: [
    { name: "origins", expected: "ACTIVE parent, OLD and NEW all retained; exact charged preparation/state provenance" },
    { name: "families", expected: "all active/historical rows unchanged by stage/swap" },
    { name: "units", expected: "all generations including OLD/NEW STAGED; no NEW READY/load authorization" },
    { name: "executions", expected: "all retained execution history; no new execution from stage/swap" },
    { name: "intents", expected: "all retained intents, no transfer to NEW" },
    { name: "outboxes", expected: "all exact old bodies/IDs/states; no new outbox from stage/swap" },
    { name: "attemptsL6", expected: "all old L6 attempts unchanged; not confused with root activation attempts" },
    { name: "publications", expected: "no scientific publication invented; preserve actual history" },
    { name: "publicationReadbacks", expected: "no synthetic COMMITTED receipt/readback; preserve actual history" },
    { name: "claims", expected: "all genuine active claims preserved until independent Q/release, never reassigned" },
    { name: "proofs", expected: "actual source/preparation/replacement/current/HOST/Q proofs with exact provenance" },
    { name: "releases", expected: "all actual releases, none fabricated for replacement" },
    { name: "sourceCapabilities", expected: "complete independent current and retained historical sources plus counters and replacement authority, with control-record accounting explicit" },
    { name: "controllerLeases", expected: "actual historical/current controller leases, no succession or TTL extension" },
    { name: "physicalAllocations", expected: "all actual allocation history; unchanged by replacement itself" },
    { name: "materializations", expected: "only existing real policy asset writes; no K/scientific write invented" },
    { name: "materializationReadbacks", expected: "actual existing asset readback; no synthesized K readback" },
    { name: "stagedUnits", expected: "complete OLD if previously staged and NEW units; no dropping loser/ABORTED history" },
    { name: "stagedBlobs", expected: "all actual stage source blobs and retained cut/ref bytes, exact expected critical set" },
    { name: "requiredFiles", expected: "same real parent-owned root policy asset lease/path/digest; no new file or changed policy" },
  ],
} as const;

// Manual finite scenarios, not executable tests. Exact error labels are semantic
// requirements; future product strings must be ratified before assertions are run.
export const CASES_118 = [
  { id: "R01", input: "minimal bootstrap1/OLD2/T1/current-template true->false/NEW3", expect: "valid future S1 stage, distinct generation same parent ordinal1/root", preparationUsed: 3, replacementUsed: 0, activationDelta: 0 },
  { id: "R02", input: "close/reopen after NEW stage using actual retained current providers on new DB object", expect: "OLD still pointed; NEW PREPARED/STAGED non-authorizing; full head/inventory/counter/cut retained", preparationDelta: 0, replacementDelta: 0 },
  { id: "R03", input: "reserve/admit/activate NEW while only staged; replay/load chooses most recent origin", expect: "HOLD stage is not authorization; no READY, claim, pin, outbox, active-head change or charge" },
  { id: "R04", input: "retry exact NEW preparation after lost reply at full preparation ceiling", expect: "return exact retained stage before new-capacity refusal, no recompute or charge", preparationDelta: 0, replacementDelta: 0 },
  { id: "R05", input: "real stage append then source/controller revoked, expiry reached or postimage altered inside TX", expect: "specific LIVE/TTL/postimage refusal and full rollback to used2/pre-stage head/cursor/inventory; no partial NEW" },
  { id: "R06", input: "valid distinct private replace-A cap/current source with complete post-stage preimage", expect: "one atomic swap to NEW/OLD ABORTED; full table POST_CAS; no RUNNING or work transfer", preparationUsed: 3, replacementUsed: 1, activationDelta: 0 },
  { id: "R07", input: "lost CAS reply then exact same request/source/cap/record retry and reopen", expect: "same retained replacement record, no new event/charge; historical current revocation cannot rewrite the commit or authorize a new action" },
  { id: "R08", input: "real swap append then LIVE source/cap/controller revoked, TTL equality or postimage changed inside TX", expect: "rollback to committed POST_STAGE, used3 and replacement0; append/state/inventory/counter changes absent" },
  { id: "R09", input: "replacement without barrier or different barrier/drainEntry/cut", expect: "specific continuous-barrier/cut refusal before effect" },
  { id: "R10", input: "stale OLD candidate ref, head revision, candidate revision, owner/controller fence", expect: "specific full preimage/CAS refusal; unchanged history/counters" },
  { id: "R11", input: "same h/c as before stage but OLD preparationCounterRef or inventoryRevision/digest/cursor", expect: "refuse stale FULL preimage despite equal h/c; do not overwrite used3 or inventory" },
  { id: "R12", input: "current template source absent/stale/revoked or only request-generated current/digest supplied", expect: "specific UNKNOWN/current/source-authority refusal, never permission or auto-source issuance" },
  { id: "R13", input: "new template false with old spec/context/planning/independent document or incompatible root", expect: "specific binding/S1 refusal, no source-ref refresh fix, no cast/threshold relaxation" },
  { id: "R14", input: "forged JSON handle, wrong DB/path/root, revoked replacement cap or bootstrap/T1/finalA cap used as replacer", expect: "specific private-purpose/scope/current-capability refusal" },
  { id: "R15", input: "missing replacement-policy authority/counter or authorized replacement ceiling already1 used", expect: "UNKNOWN/exhausted refusal, no counter initialization, reset or caller-provided limit" },
  { id: "R16", input: "second distinct NEW after bootstrap+OLD+NEW; asks for fourth durable origin", expect: "specific preparation ceiling3 refusal; preserve committed first stage even if unpointed/abandoned" },
  { id: "R17", input: "wrong active parent/ordinal, B-to-A parent, B/native capability or native/public execution request", expect: "specific parent/regime/authority refusal; no native adapter fallback" },
  { id: "R18", input: "preexisting OLD finalA/ActivationAttempt after swap to NEW", expect: "specific current candidate/head/replacement linkage refusal, never reuse OLD T1case as fresh final" },
  { id: "R19", input: "OLD attempt1 retained, then replacement, then fresh final NEW with current capture/cap and complete Q", expect: "NEW attempt2 binds exact replacementRecordRef, root activation chain preserved; no third attempt permitted", preparationUsed: 3, replacementUsed: 1, activationUsed: 2 },
  { id: "R20", input: "engaged family/claim/Q incomplete across preparation and swap", expect: "same engaged bytes/ownership/cut/claims/pins; final HOLD until genuine Q/release, no implicit retirement or capacity refund" },
  { id: "R21", input: "journal unknown source/operation or omitted NEW stage/OLD ABORTED/counter history in any complete category", expect: "specific source/semantic-join/history refusal, not empty-array laundering" },
  { id: "R22", input: "two genuinely overlapping distinct CAS demands/caps on SAME NEW3 and same post-stage OLD preimage", expect: "exactly one committed swap and replacement charge1; distinct loser stale, not an idempotent success" },
  { id: "R23", input: "serial calls or exact same request retried, represented as a contention test", expect: "NOT contention evidence; only serial stale/idempotence evidence, retain missing actual race proof" },
  { id: "R24", input: "attempt to delete/refund/reissue abandoned stage, rewrite T1 OLD candidateRef or activate NEW during replay", expect: "positive history/cut/root-counter guard refusal; no staged automatic selection" },
] as const;

export const CONTENTION_118 = {
  route: "bootstrap1/OLD2/NEW3, NOT two distinct NEW origins",
  commonStageRef: "$exact-stage-record.ref",
  commonFullPreimage: "$POST_STAGE_NEW_NOT_POINTED complete head and actual inventory/cursor",
  contenders: [
    { requestIdentity: "replacement-demand-A", capRef: "$independent-current-replace-cap-A.ref", newCandidateRef: "$NEW.candidateRef" },
    { requestIdentity: "replacement-demand-B", capRef: "$independent-current-replace-cap-B.ref", newCandidateRef: "$NEW.candidateRef" },
  ],
  trueContentionEvidenceRequired: ["existing owned contention mechanism if available", "actual overlapping requests on same owned SQLite fixture", "both distinct authorized identities with same acquired preimage", "one committed record/swap/charge1 and one stale loser", "captured scheduling/contention evidence, not sequential invocation labels"],
  exactRetrySeparate: "same complete winning identity returns the same record without charge, not a second independent contender",
  unreachable: { route: "bootstrap1+OLD2+NEW_A3+NEW_B4", reason: "authorized durable origin ceiling3", expected: "refuse fourth origin; no refund/new OWN/raised ceiling" },
  QA246_247: "multiple stages only within finite authorized counters; two distinct NEW after OLD not exercised here; no waiver or global S2 acceptance",
  infrastructure: "No harness created by inputs; if no adequate existing owned mechanism, report missing contention evidence and seek approval before significant new infrastructure",
} as const;

export const VERIFICATION_BOUNDARY_118 = {
  executedByTheseInputs: [],
  future: ["parent inspect/ratify sources and complete head/counter choices", "explicit bounded source implementation GO", "independent review with oracles kept disjoint", "parent-owned distinct S1/typing/runtime/contention gate with retained receipts"],
  notClaimed: ["S1 new-source/planning admissibility", "fresh final accepted", "concurrent scheduling exercised", "runtime PASS", "B/native/public scientific activation", "global S2/M2 closure"],
  preserved: ["quota3 fixture106", "131PASS/0FAIL/0SKIP parent116 within its exact source/input/oracle conditions", "closed red112 evidence", "closed115 run evidence and143DB/44assets", "all frozen product/source116", "000b OWNERLEAD open"],
} as const;
