// Parent public API projection: types/signatures/literal protocol tags only; no implementation.
import type { GraphSnapshotV1 } from "./graph";
import type { PreparedGraphTransportV3, PartitionAdoptionTransportV1 } from "./graph-transport";
import type { DecodedGroupSourceV1, ExecutionProjectionV1 } from "./graph-b-projection";
import type { Snapshot, CycleRecord, GraphCycleAnchorV1, GraphCycleAnchorV2, GraphExecutionTemplate, GraphExecutionSource, GraphInputSource, FrozenKnowledge, ArtifactFile, ValidatedFact, FunctionIdentity, ModelRef, Role, StoredResult } from "./domain";
import type { PlannerResult, PlannerPolicy, AdmissionBudgetContextV1, AdmissionBudgetInputV1 } from "./planner";
import type { GroupConfig, GroupMetrics } from "./investigation-groups";
import type { KnowledgeCommit, ArtifactBinding } from "./graph-store";
export type ReadonlyData<T> = T extends object ? {
    readonly [P in keyof T]: ReadonlyData<T[P]>;
} : T;
export type CodecResult<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly reasons: readonly string[];
};
export interface ByteRef {
    kind: string;
    encoding: "utf8-json-v1" | "raw-v1";
    byteLength: number;
    sha256: string;
}
export interface ValueRef {
    kind: string;
    codec: "l8-json-c14n-v1";
    sha256: string;
}
export interface BoundDocument<T> {
    ref: ByteRef;
    utf8: string;
}
export interface BoundBytesV1 {
    ref: ByteRef;
    base64: string;
}
export interface ArtifactBytesV1 {
    file: ArtifactFile;
    bytes: BoundBytesV1;
}
export interface GraphCycleAnchorV3 {
    version: "l8-frozen-cycle-v3";
    lineageId: string;
    generationId: string;
    envelopeFingerprint: string;
    runFingerprint: string;
    envelopeRef: ByteRef;
    runRef: ByteRef;
}
export type ExecutionMissionSnapshotV1 = Omit<Snapshot, "cycles"> & {
    cycles: Array<Omit<CycleRecord, "graph"> & {
        graph?: GraphCycleAnchorV1 | GraphCycleAnchorV2 | GraphCycleAnchorV3;
    }>;
};
export interface ApprovalRecordV1 {
    approvalId: string;
    issuerRef: ByteRef;
    authorityRevision: number;
    functionIdentity: FunctionIdentity;
    fileSha256: string;
    filePath: string;
    sourceResultIds: string[];
    allowedRoles: Role[];
    knowledgeRevision: number;
    decision: "approved" | "denied" | "revoked";
    recordRef: ByteRef;
}
export interface ApprovalSourceV1 {
    version: "l8-approval-source-v1";
    revision: number;
    records: ApprovalRecordV1[];
}
export interface KnowledgeMaterializationV1 {
    fileSha256: string;
    filePath: string;
    resultId: string;
    producer: {
        authorId: string;
        executionId: string;
        sessionId: string;
        model: ModelRef;
    };
    validation: "fixture-only" | "parent-validated";
    revoked: boolean;
    revocationRef: ByteRef | null;
    binding: BoundDocument<ArtifactBinding>;
    commit: BoundDocument<KnowledgeCommit>;
    result: BoundDocument<StoredResult>;
    readback: {
        status: "verified" | "pending" | "mismatch";
        sha256: string;
        recordRef: ByteRef;
    };
}
export interface KnowledgeSourceV1 {
    version: "l8-knowledge-source-v1";
    missionId: string;
    knowledgeRevision: number;
    rootHash: string;
    frozen: FrozenKnowledge;
    files: ArtifactBytesV1[];
    facts: ValidatedFact[];
    materializations: KnowledgeMaterializationV1[];
    ledgerRevision: number;
    ledgerDigest: string;
}
export interface CompleteInputSourceV1 {
    document: BoundDocument<GraphInputSource>;
    files: ArtifactBytesV1[];
}
export interface RootLimitsV1 {
    allocation: BoundDocument<AdmissionBudgetInputV1 | null>;
    contextEnvelopeMaxUtf8Bytes: number;
    totalContextBudgetUtf8Bytes: number;
    maxSelectedUnits: number;
    executionTemplate: BoundDocument<GraphExecutionTemplate>;
}
export interface BudgetLineageV1 {
    version: "l8-budget-lineage-v1";
    rootAccountId: string;
    rootAllocationRef: ByteRef;
    rootLimits: BoundDocument<RootLimitsV1>;
    epoch: number;
}
export interface AdmissionSourceV2 {
    version: "l8-admission-source-v2";
    admissionCodecVersion: "l8-fixture-admission-codec-v2";
    cycle: number;
    budgetEpoch: number;
    executionTemplate: BoundDocument<GraphExecutionTemplate>;
    executionSourceSpec: BoundDocument<GraphExecutionSource>;
    inputManifestSource: CompleteInputSourceV1;
    context: AdmissionBudgetContextV1;
    allocation: AdmissionBudgetInputV1 | null;
    sourceFingerprints: {
        executionTemplate: string;
        executionSourceSpec: string;
        inputManifest: string;
        context: string;
        allocation: string | null;
    };
    knowledgeSource: BoundDocument<KnowledgeSourceV1>;
    approvalSource: BoundDocument<ApprovalSourceV1>;
    budgetLineage: BudgetLineageV1;
}
export interface GroupSourceV1 {
    groupsRef: ValueRef;
    groupingConfig: BoundDocument<GroupConfig>;
    groupingMetrics: BoundDocument<GroupMetrics>;
    communityBinding: BoundDocument<DecodedGroupSourceV1["communityBinding"]>;
    fullContextByGroup: BoundDocument<DecodedGroupSourceV1["fullContextByGroup"]>;
    contextOmissions: BoundDocument<DecodedGroupSourceV1["contextOmissions"]>;
}
export interface PreparationObservationT0 {
    observedEventSequence: number;
    parentGenerationId: string | null;
    headRevision: number;
    activePlanRevision: number | null;
    sourceMissionRevision: number;
    controllerFence: number;
    knowledgeRevision: number;
    knowledgeRootHash: string;
    knowledgeLedgerRevision: number;
    knowledgeLedgerDigest: string;
    budgetLedgerRevision: number;
    budgetLedgerDigest: string;
    spentBySlot: Array<{
        slotKey: string;
        amount: number;
    }> | null;
    encumberedBySlot: Array<{
        slotKey: string;
        amount: number;
    }> | null;
    inventoryRevision: number | null;
    inventoryDigest: string | null;
    partitionStoreDigest: string;
    authorityRecordRefs: ByteRef[] | null;
    proofRecordRefs: ByteRef[] | null;
}
export interface ContractPinsV1 {
    envelopeCodec: ByteRef;
    fullSnapshotSchema: ByteRef;
    fullSnapshotModule: ByteRef;
    proposalCodec: ByteRef;
    plannerCodec: ByteRef;
    inputCodec: ByteRef;
    admissionCodec: ByteRef;
    preparedTransportSchema: ByteRef;
    adoptionTransportSchema: ByteRef;
}
export interface ExecutionEnvelopeCommonV1 {
    version: "l8-execution-envelope-v1";
    mode: "offline-fixture-v1";
    missionId: string;
    generation: {
        lineageId: string;
        ordinal: number;
        parentGenerationId: string | null;
    };
    contractPins: ContractPinsV1;
    preparedTransport: BoundDocument<PreparedGraphTransportV3>;
    fullGraphSnapshot: BoundDocument<GraphSnapshotV1>;
    sourceMissionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
    groupSource: GroupSourceV1;
    planning: BoundDocument<PlannerResult>;
    admissionSource: AdmissionSourceV2;
    activationPolicy: {
        sourcePolicyRef: ByteRef;
        maxActivationAttempts: number;
        maxCandidateReplacements: number;
    };
    preparationObservationT0: PreparationObservationT0;
}
export type ExecutionEnvelopeBodyV1 = ExecutionEnvelopeCommonV1 & ({
    authorizationKind: "bootstrap-a-fixture-v1" | "transition-a-fixture-v1";
    adoptionIntent: null;
    sourceRefs: {
        partitionRef: ValueRef;
        groupsRef: ValueRef;
        proposalEvidenceRef: null;
        lineageRef: null;
        partitionStoreDigest: string;
    };
} | {
    authorizationKind: "proposal-b-host-fixture-v1";
    adoptionIntent: null | {
        kind: "pre-drain-non-authorizing-v1";
        document: BoundDocument<PartitionAdoptionTransportV1>;
    };
    sourceRefs: {
        partitionRef: ValueRef;
        groupsRef: ValueRef;
        proposalEvidenceRef: ValueRef;
        lineageRef: ValueRef;
        partitionStoreDigest: string;
    };
});
export type ExecutionEnvelopeV1 = ExecutionEnvelopeBodyV1 & {
    fingerprint: string;
};
export type ExecutionPreparationBodyV1 = Omit<ExecutionEnvelopeCommonV1, "planning"> & {
    authorizationKind: ExecutionEnvelopeBodyV1["authorizationKind"];
    adoptionIntent: ExecutionEnvelopeBodyV1["adoptionIntent"];
    sourceRefs: ExecutionEnvelopeBodyV1["sourceRefs"];
};
export interface ParsedExecutionEnvelopeV1 {
    document: BoundDocument<ExecutionEnvelopeV1>;
    envelope: ExecutionEnvelopeV1;
    generationId: string;
}
export interface IndependentlyLoadedSourcesV1 {
    fullGraphSnapshot: BoundDocument<GraphSnapshotV1>;
    sourceMissionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
    executionTemplate: BoundDocument<GraphExecutionTemplate>;
    executionSourceSpec: BoundDocument<GraphExecutionSource>;
    inputManifestSource: CompleteInputSourceV1;
    knowledgeSource: BoundDocument<KnowledgeSourceV1>;
    approvalSource: BoundDocument<ApprovalSourceV1>;
    contractPins: ContractPinsV1;
    parentEnvelope: BoundDocument<ExecutionEnvelopeV1> | null;
}
export interface BoundPreparationV1 {
    body: ExecutionPreparationBodyV1;
    snapshot: GraphSnapshotV1;
    missionSnapshot: ExecutionMissionSnapshotV1;
    transport: PreparedGraphTransportV3;
    template: GraphExecutionTemplate;
    sourceSpec: GraphExecutionSource;
    inputSource: GraphInputSource;
    knowledge: KnowledgeSourceV1;
    approvals: ApprovalSourceV1;
    grouping: DecodedGroupSourceV1;
    projection: ExecutionProjectionV1;
}
export interface BoundExecutionV1 extends BoundPreparationV1 {
    origin: ParsedExecutionEnvelopeV1;
    planning: PlannerResult;
}
export interface DerivedExecutionSpecV3 {
    version: "l8-execution-derived-v3";
    sourceSpecFingerprint: string;
    templateFingerprint: string;
    inputManifestFingerprint: string;
    envelopeFingerprint: string;
    planId: string;
    planFingerprint: string;
    sidecarFingerprint: string;
    bindingFingerprint: string;
    snapshotId: string;
    partitionId: string;
    knowledgeRevision: number;
}
export interface GraphRunV3 {
    version: "l8-graph-run-v3";
    mode: "offline-fixture-v1";
    missionId: string;
    generationId: string;
    envelopeFingerprint: string;
    envelope: BoundDocument<ExecutionEnvelopeV1>;
    derivedSpec: DerivedExecutionSpecV3;
    derivedSpecFingerprint: string;
    fingerprint: string;
}
export interface ParsedGraphRunV3 {
    document: BoundDocument<GraphRunV3>;
    run: GraphRunV3;
}
export interface ExecutionInspectionV1 {
    shape: boolean;
    coherent: boolean;
    proposalAdmissible: boolean | null;
    authorityVerified: false;
    activationState: "not-established";
    reasons: readonly string[];
}
export interface CandidateRefV1 {
    generationId: string;
    envelopeFingerprint: string;
    envelopeRef: ByteRef;
    runRef: ByteRef;
}
export interface DrainEntryV1 {
    version: "l8-drain-entry-v1";
    barrierRootId: string;
    candidateRef: CandidateRefV1;
    expectedT0Ref: ByteRef;
    headBefore: number;
    headAfter: number;
    controllerFence: number;
    engagedFamiliesRef: ByteRef;
    inventoryAtCutRef: ByteRef;
    eventSequence: number;
}
export interface ExpectationsT2V1 {
    headRevision: number;
    activeGenerationId: string | null;
    activePlanRevision: number | null;
    sourceMissionRevision: number;
    controllerFence: number;
    familyFences: Array<{
        familyId: string;
        fence: number;
    }>;
    knowledgeRevision: number;
    knowledgeRootHash: string;
    knowledgeLedgerRevision: number;
    knowledgeLedgerDigest: string;
    inventoryRevision: number;
    inventoryDigest: string;
    inventoryRef: ByteRef;
    budgetLedgerRevision: number;
    budgetLedgerDigest: string;
    spentBySlot: Array<{
        slotKey: string;
        amount: number;
    }>;
    encumberedBySlot: Array<{
        slotKey: string;
        amount: number;
    }>;
    proofRecordRefs: ByteRef[];
    releaseRecordRefs: ByteRef[];
    sourceCapabilityRecordRefs: ByteRef[];
    authorityRecords: Array<{
        recordRef: ByteRef;
        revision: number;
        revocationRef: ByteRef | null;
    }>;
}
export type ActivationAttemptV1 = {
    version: "l8-activation-attempt-v1";
    activationAttemptOrdinal: number;
    previousActivationAttemptId: string | null;
    candidateRef: CandidateRefV1;
    barrierRootId: string;
    drainEntryRef: ByteRef;
    replacementRecordRef: ByteRef | null;
    expectationsT2: ExpectationsT2V1;
    authorityRecordRefs: ByteRef[];
} & ({
    authorizationKind: "bootstrap-a-fixture-v1" | "transition-a-fixture-v1";
    finalAdoption: null;
} | {
    authorizationKind: "proposal-b-host-fixture-v1";
    finalAdoption: BoundDocument<PartitionAdoptionTransportV1>;
});
export interface CandidateReplacementV1 {
    barrierRootId: string;
    drainEntryRef: ByteRef;
    oldCandidateRef: CandidateRefV1;
    newCandidateRef: CandidateRefV1;
    currentHeadRevision: number;
    currentCandidateRevision: number;
    sourceBindingsRef: ByteRef;
    authorityRecordRefs: ByteRef[];
    controllerFence: number;
}
export interface GenerationHeadV1 {
    version: "l8-graph-generation-head-v1";
    missionId: string;
    lineageId: string;
    revision: number;
    activeGenerationId: string | null;
    candidateGenerationId: string | null;
    candidateRef: CandidateRefV1 | null;
    activePlanRevision: number | null;
    controlMode: "RUNNING" | "DRAIN_NEW_FAMILIES" | "OPERATOR_PAUSED";
    budgetLedgerRevision: number;
    knowledgeLedgerRevision: number;
    inventoryRevision: number;
    barrierRootId: string | null;
    candidateRevision: number;
}
export declare function assertExecutionJsonV1(value: unknown, parents?: Set<object>): void;
export declare function canonicalExecutionJsonV1(value: unknown): string;
export declare function executionValueRefV1(kind: string, value: unknown): ValueRef;
export declare function makeBoundDocumentV1<T>(kind: string, value: T): BoundDocument<T>;
export declare function makeBoundBytesV1(kind: string, bytes: Uint8Array): BoundBytesV1;
type RecordValue = Record<string, unknown>;
type Rule = (value: unknown) => void;
export declare const EXECUTION_DOCUMENT_KINDS_V1: Readonly<{
    readonly envelope: "l8-execution-envelope-v1";
    readonly run: "l8-graph-run-v3";
    readonly preparedTransport: "l8-prepared-graph-v3";
    readonly adoption: "l8-partition-adoption-v1";
    readonly fullGraphSnapshot: "graph-snapshot-v1";
    readonly sourceMissionSnapshot: "l8-source-mission-snapshot-v1";
    readonly planning: "l8-planning-source-v1";
    readonly executionTemplate: "l8-execution-template-v1";
    readonly executionSourceSpec: "l8-execution-source-v1";
    readonly inputManifest: "l8-input-source-v1";
    readonly knowledge: "l8-knowledge-source-v1";
    readonly approvals: "l8-approval-source-v1";
    readonly rootLimits: "l8-root-limits-v1";
    readonly groupingConfig: "l8-grouping-config-source-v1";
    readonly groupingMetrics: "group-metrics-v1";
    readonly communityBinding: "l8-community-binding-v1";
    readonly fullContextByGroup: "l8-full-context-by-group-v1";
    readonly contextOmissions: "l8-context-omissions-v1";
}>;
export declare function parseExecutionEnvelopeV1(bytes: Uint8Array): CodecResult<ReadonlyData<ParsedExecutionEnvelopeV1>>;
export declare function exportExecutionEnvelopeV1(origin: ReadonlyData<ParsedExecutionEnvelopeV1>): CodecResult<Uint8Array>;
export declare function bindExecutionPreparationV1(raw: unknown, independent: IndependentlyLoadedSourcesV1, policy: PlannerPolicy): CodecResult<ReadonlyData<BoundPreparationV1>>;
export declare function sealExecutionEnvelopeV1(body: unknown): CodecResult<ReadonlyData<ParsedExecutionEnvelopeV1>>;
export declare function bindExecutionSourcesV1(origin: ReadonlyData<ParsedExecutionEnvelopeV1>, independent: IndependentlyLoadedSourcesV1): CodecResult<ReadonlyData<BoundExecutionV1>>;
export declare function inspectExecutionEnvelopeV1(bytes: Uint8Array, independent: IndependentlyLoadedSourcesV1): ExecutionInspectionV1;
export declare function makeGraphRunV3(origin: ReadonlyData<ParsedExecutionEnvelopeV1>): CodecResult<ReadonlyData<ParsedGraphRunV3>>;
export declare function parseGraphRunV3(bytes: Uint8Array): CodecResult<ReadonlyData<ParsedGraphRunV3>>;
export declare function exportGraphRunV3(parsed: ReadonlyData<ParsedGraphRunV3>): CodecResult<Uint8Array>;
