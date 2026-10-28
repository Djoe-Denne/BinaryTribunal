/** Offline data codecs only. No store, producer, authority, filesystem or loader. */
import { enterLocal145, leaveLocal145 } from "./graph-local-measure145";
import envelopeSchema from "../schemas/l8-execution-envelope-v1.schema.json";
import runSchema from "../schemas/l8-graph-run-v3.schema.json";
import { types as utilTypes } from "node:util";
import { assertSnapshotContract, validateStaticJsonSchema, type GraphSnapshotV1, type StaticJsonSchema } from "./graph";
import { decodePreparedGraphV3, decodePartitionAdoptionV1, inspectPreparedGraphV3, inspectPartitionAdoptionV1,
  type PreparedGraphTransportV3, type PartitionAdoptionTransportV1 } from "./graph-transport";
import { validateExecutionTemplate, validateInputSource, validatePlanningBindingV1, validateGraphDocument, validatePlannerPolicy, scientificCommitId, assertAdmissionBudgetBinding } from "./graph-pure-codecs";
import { canonicalRelationView } from "./planner-relation-codecs";
import { canonical, fingerprint, hash, validateConfig, validateKnowledge, validateIdentity } from "./validation";
import { validateREPolicy } from "./re-policy";
import { projectExecutionSourcesForL5V1, type DecodedGroupSourceV1, type ExecutionProjectionV1 } from "./graph-b-projection";
import type { Snapshot, CycleRecord, GraphCycleAnchorV1, GraphCycleAnchorV2, GraphExecutionTemplate,
  GraphExecutionSource, GraphInputSource, FrozenKnowledge, ArtifactFile, ValidatedFact, FunctionIdentity,
  ModelRef, Role, StoredResult } from "./domain";
import type { PlannerResult, PlannerPolicy, PlannerGraphInput, AdmissionBudgetContextV1, AdmissionBudgetInputV1 } from "./planner";
import type { GroupConfig, GroupMetrics } from "./investigation-groups";
import type { KnowledgeCommit as UpstreamKnowledgeCommit, ArtifactBinding, WorkUnit, NativeAuthorIdentity, ParentAuthorityIdentity, ParentAttestation } from "./graph-store";
import type { WorkerResult } from "./domain";
import { importSparseGraph, validateSparseGraph, numericSummary, type SparseGraphSnapshot, type NumericGraphSummary, type SparseGraph } from "./sparse-graph-codecs";
import { prepareGroupContextSource, bindGroupContext, deriveFixedGroupContexts, deriveCommunityContextIds } from "./group-context-codecs";
import { derivePlannerUnitEstimate, derivePlannerUnitResources, derivePlannerUnitSubIntents, derivePlannerG3 } from "./planner-derived-codecs";
import type { WeightConfig } from "./cluster";

export type ReadonlyData<T> = T extends object ? { readonly [P in keyof T]: ReadonlyData<T[P]> } : T;
export type CodecResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reasons: readonly string[] };
export interface ByteRef { kind: string; encoding: "utf8-json-v1" | "raw-v1"; byteLength: number; sha256: string }
export interface ValueRef { kind: string; codec: "l8-json-c14n-v1"; sha256: string }
/** T describes the decoded, fully checked value, not a cast of this string. */
export interface BoundDocument<T> { ref: ByteRef; utf8: string }
export interface BoundBytesV1 { ref: ByteRef; base64: string }
export interface ScientificEvidenceV1 { id: string; source: string; sha256: string; detail: string }
export interface KnowledgeCommit extends Omit<UpstreamKnowledgeCommit, "evidence" | "publicationLevel"> {
  evidence: ScientificEvidenceV1[]; publicationLevel: 1 | 2;
}
export interface ArtifactBytesV1 { file: ArtifactFile; bytes: BoundBytesV1 }

/** Dedicated v3 marker; it does not extend either old loader or its union. */
export interface GraphCycleAnchorV3 {
  version: "l8-frozen-cycle-v3"; lineageId: string; generationId: string;
  envelopeFingerprint: string; runFingerprint: string; envelopeRef: ByteRef; runRef: ByteRef;
}
export type ExecutionMissionSnapshotV1 = Omit<Snapshot, "cycles"> & {
  cycles: Array<Omit<CycleRecord, "graph"> & { graph?: GraphCycleAnchorV1 | GraphCycleAnchorV2 | GraphCycleAnchorV3 }>;
};
export interface ApprovalRecordV1 {
  approvalId: string; issuerRef: ByteRef; authorityRevision: number; functionIdentity: FunctionIdentity;
  fileSha256: string; filePath: string; sourceResultIds: string[]; allowedRoles: Role[];
  knowledgeRevision: number; decision: "approved" | "denied" | "revoked"; recordRef: ByteRef;
}
export interface ApprovalSourceV1 { version: "l8-approval-source-v1"; revision: number; records: ApprovalRecordV1[] }
export interface KnowledgeMaterializationV1 {
  fileSha256: string; filePath: string; resultId: string; producer: { authorId: string; executionId: string; sessionId: string; model: ModelRef };
  validation: "fixture-only" | "parent-validated"; revoked: boolean; revocationRef: ByteRef | null;
  binding: BoundDocument<ArtifactBinding>; commit: BoundDocument<KnowledgeCommit>;
  result: BoundDocument<StoredResult>; readback: { status: "verified" | "pending" | "mismatch"; sha256: string; recordRef: ByteRef };
  provenance: BoundDocument<KnowledgeProvenanceV1> | null;
}
export interface RetainedResultDataV1 {
  resultId: string; executionId: string; token: number; document: WorkerResult; eligible: boolean; source: "artifact" | "bulletin";
}
export interface WholeUnitValidationDataV1 {
  token: number; resultIds: string[];
  validation: { evidence: KnowledgeCommit["evidence"]; validatedFactIds: string[]; source: "artifact"; parentValidated: boolean; parentAttestationId?: string };
}
export interface PublicationEffectDataV1 {
  version: 1; missionId: string; unitId: string; token: number; requestDigest: string;
  verifiedEffect: KnowledgeCommit["futurePrerequisiteEffect"];
}
export interface PublicationReadbackDataV1 { targetId: string; hash: string; requestDigest: string; source: string }
export interface HistoricalAdmissionDataV1 {
  version: "l8-historical-admission-data-v1"; missionId: string; unitId: string; executionId: string;
  subIntentId: string; familyToken: number; requestDigest: string;
  command: { profile: string; model: ModelRef };
  receiptIdentity: { executionId: string; requestDigest: string; nativeSessionId?: string; authorId?: string };
}
export interface ResultProvenanceV1 {
  subIntentId: string; stored: BoundDocument<StoredResult>; retained: BoundDocument<RetainedResultDataV1>;
  nativeAuthor: BoundDocument<NativeAuthorIdentity> | null;
  historicalAdmission: BoundDocument<HistoricalAdmissionDataV1> | null;
}
export interface KnowledgeProvenanceV1 {
  version: "l8-knowledge-provenance-v1"; producerUnit: BoundDocument<WorkUnit>; producerPlanning: BoundDocument<PlannerResult>;
  results: ResultProvenanceV1[]; wholeUnitValidation: BoundDocument<WholeUnitValidationDataV1>;
  pendingPublication: BoundDocument<KnowledgeCommit>; publicationEffect: BoundDocument<PublicationEffectDataV1>;
  publicationReadback: BoundDocument<PublicationReadbackDataV1> | null; materializationReadback: BoundDocument<{ sha256: string }> | null;
  parentAuthority: BoundDocument<ParentAuthorityIdentity>; parentAttestation: BoundDocument<ParentAttestation> | null;
}
export interface KnowledgeSourceV1 {
  version: "l8-knowledge-source-v1"; missionId: string; knowledgeRevision: number; rootHash: string;
  frozen: FrozenKnowledge; files: ArtifactBytesV1[]; facts: ValidatedFact[];
  materializations: KnowledgeMaterializationV1[]; ledgerRevision: number; ledgerDigest: string;
}
export interface CompleteInputSourceV1 { document: BoundDocument<GraphInputSource>; files: ArtifactBytesV1[] }
export interface RootSlotKeyV1 { rootAccountId: string; functionIdentity: FunctionIdentity; role: "A" | "B" | "R"; pass: 1 }
export interface RootSlotGrantV1 { slot: RootSlotKeyV1; functionId: string; bodyCapUtf8Bytes: number; reservedDebitUtf8Bytes: number }
export interface RootSlotGrantsV1 {
  version: "l8-root-slot-grants-v1"; missionId: string; lineageId: string; rootAccountId: string;
  rootAllocationRef: ByteRef; sourceSnapshotRef: ByteRef; sourcePlanningRef: ByteRef; sourcePolicyRef: ByteRef; grants: RootSlotGrantV1[];
}
export interface RootModelBindingsV1 {
  version: "l8-root-model-bindings-v1"; missionId: string; lineageId: string; rootAccountId: string;
  sourceExecutionTemplateRef: ByteRef; sourceExecutionSpecRef: ByteRef;
  bindings: { label: string; model: ModelRef }[]; roleLabels: Record<Role, string>;
}
export interface RootBootstrapSourcesV1 {
  snapshot: BoundDocument<GraphSnapshotV1>; missionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
  planning: BoundDocument<PlannerResult>; planningPolicy: BoundDocument<PlannerPolicy>;
  executionTemplate: BoundDocument<GraphExecutionTemplate>; executionSourceSpec: BoundDocument<GraphExecutionSource>;
}
export interface ProjectionPolicySourceV1 {
  version: "l8-projection-policy-source-v1"; producer: "projectStructural"; fullGraphSnapshotRef: ByteRef;
  numericPolicyVersion: "scaled-binary64-exact-leiden-interval-ppr-v1"; weights: WeightConfig;
}
export interface NumericGraphSourceV1 {
  version: "l8-numeric-graph-source-v1"; fullGraphSnapshotRef: ByteRef; producerModuleRef: ByteRef;
  producerPolicy: BoundDocument<ProjectionPolicySourceV1>; graph: BoundDocument<SparseGraphSnapshot>; hubIds: string[]; summary: NumericGraphSummary;
}
export interface PublicContextSourcesV1 {
  version: "l8-public-context-sources-v1"; partitionContext: BoundDocument<NumericGraphSourceV1>;
  groupAdjacency: { kind: "raw-active-control-relations" } | { kind: "provided-affinity"; source: BoundDocument<NumericGraphSourceV1> };
}
export interface RootLimitsV1 {
  allocation: BoundDocument<AdmissionBudgetInputV1 | null>; contextEnvelopeMaxUtf8Bytes: number; totalContextBudgetUtf8Bytes: number;
  maxSelectedUnits: number; executionTemplate: BoundDocument<GraphExecutionTemplate>;
  rootSlotGrants: BoundDocument<RootSlotGrantsV1> | null; rootModelBindings: BoundDocument<RootModelBindingsV1> | null;
}
export interface BudgetLineageV1 {
  version: "l8-budget-lineage-v1"; rootAccountId: string; rootAllocationRef: ByteRef;
  rootLimits: BoundDocument<RootLimitsV1>; epoch: number;
}
export interface AdmissionSourceV2 {
  version: "l8-admission-source-v2"; admissionCodecVersion: "l8-fixture-admission-codec-v2";
  cycle: number; budgetEpoch: number;
  executionTemplate: BoundDocument<GraphExecutionTemplate>; executionSourceSpec: BoundDocument<GraphExecutionSource>;
  inputManifestSource: CompleteInputSourceV1; context: AdmissionBudgetContextV1; allocation: AdmissionBudgetInputV1 | null;
  sourceFingerprints: { executionTemplate: string; executionSourceSpec: string; inputManifest: string; context: string; allocation: string | null };
  knowledgeSource: BoundDocument<KnowledgeSourceV1>; approvalSource: BoundDocument<ApprovalSourceV1>; budgetLineage: BudgetLineageV1;
}
export interface GroupSourceV1 {
  groupsRef: ValueRef; groupingConfig: BoundDocument<GroupConfig>; groupingMetrics: BoundDocument<GroupMetrics>;
  communityBinding: BoundDocument<DecodedGroupSourceV1["communityBinding"]>;
  fullContextByGroup: BoundDocument<DecodedGroupSourceV1["fullContextByGroup"]>;
  contextOmissions: BoundDocument<DecodedGroupSourceV1["contextOmissions"]>;
}
export interface PreparationObservationT0 {
  observedEventSequence: number; parentGenerationId: string | null; headRevision: number; activePlanRevision: number | null;
  sourceMissionRevision: number; controllerFence: number; knowledgeRevision: number; knowledgeRootHash: string;
  knowledgeLedgerRevision: number; knowledgeLedgerDigest: string; budgetLedgerRevision: number; budgetLedgerDigest: string;
  spentBySlot: Array<{ slotKey: string; amount: number }> | null;
  encumberedBySlot: Array<{ slotKey: string; amount: number }> | null;
  inventoryRevision: number | null; inventoryDigest: string | null; partitionStoreDigest: string;
  authorityRecordRefs: ByteRef[] | null; proofRecordRefs: ByteRef[] | null;
  rootLimitsRef: ByteRef | null; rootSlotGrantsRef: ByteRef | null; rootModelBindingsRef: ByteRef | null;
}
export interface ContractPinsV1 {
  envelopeCodec: ByteRef; fullSnapshotSchema: ByteRef; fullSnapshotModule: ByteRef; proposalCodec: ByteRef;
  plannerCodec: ByteRef; inputCodec: ByteRef; admissionCodec: ByteRef; preparedTransportSchema: ByteRef; adoptionTransportSchema: ByteRef;
  domainModule: ByteRef; validationModule: ByteRef; plannerDerivedCodec: ByteRef; functionOrderCodec: ByteRef;
  plannerRelationCodec: ByteRef; sparseGraphCodec: ByteRef; groupContextCodec: ByteRef; lineagePureCodec: ByteRef;
  graphPersistenceErrorsCodec: ByteRef; rePolicyCodec: ByteRef; transportCodec: ByteRef; bProjectionCodec: ByteRef;
  clusterTypesModule: ByteRef; groupTypesModule: ByteRef; envelopeSchema: ByteRef; clusterPartitionSchema: ByteRef;
  workUnitSchema: ByteRef; knowledgeCommitSchema: ByteRef; missionPlanSchema: ByteRef; investigationGroupSchema: ByteRef;
}
export interface ExecutionEnvelopeCommonV1 {
  version: "l8-execution-envelope-v1"; mode: "offline-fixture-v1"; missionId: string;
  generation: { lineageId: string; ordinal: number; parentGenerationId: string | null };
  contractPins: ContractPinsV1; preparedTransport: BoundDocument<PreparedGraphTransportV3>;
  fullGraphSnapshot: BoundDocument<GraphSnapshotV1>; sourceMissionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
  groupSource: GroupSourceV1; planning: BoundDocument<PlannerResult>; admissionSource: AdmissionSourceV2;
  activationPolicy: { sourcePolicyRef: ByteRef; maxActivationAttempts: number; maxCandidateReplacements: number };
  preparationObservationT0: PreparationObservationT0;
  rootBootstrapSources: RootBootstrapSourcesV1 | null; planningPolicy: BoundDocument<PlannerPolicy>; contextSources: PublicContextSourcesV1;
}
export type ExecutionEnvelopeBodyV1 = ExecutionEnvelopeCommonV1 & (
  { authorizationKind: "bootstrap-a-fixture-v1" | "transition-a-fixture-v1"; adoptionIntent: null;
    sourceRefs: { partitionRef: ValueRef; groupsRef: ValueRef; proposalEvidenceRef: null; lineageRef: null; partitionStoreDigest: string } } |
  { authorizationKind: "proposal-b-host-fixture-v1";
    adoptionIntent: null | { kind: "pre-drain-non-authorizing-v1"; document: BoundDocument<PartitionAdoptionTransportV1> };
    sourceRefs: { partitionRef: ValueRef; groupsRef: ValueRef; proposalEvidenceRef: ValueRef; lineageRef: ValueRef; partitionStoreDigest: string } }
);
export type ExecutionEnvelopeV1 = ExecutionEnvelopeBodyV1 & { fingerprint: string };
export type ExecutionPreparationBodyV1 = Omit<ExecutionEnvelopeCommonV1, "planning"> & (
  { authorizationKind: "bootstrap-a-fixture-v1" | "transition-a-fixture-v1"; adoptionIntent: null;
    sourceRefs: { partitionRef: ValueRef; groupsRef: ValueRef; proposalEvidenceRef: null; lineageRef: null; partitionStoreDigest: string } } |
  { authorizationKind: "proposal-b-host-fixture-v1"; adoptionIntent: ExecutionEnvelopeBodyV1["adoptionIntent"];
    sourceRefs: { partitionRef: ValueRef; groupsRef: ValueRef; proposalEvidenceRef: ValueRef; lineageRef: ValueRef; partitionStoreDigest: string } });
export interface ParsedExecutionEnvelopeV1 {
  document: BoundDocument<ExecutionEnvelopeV1>; envelope: ExecutionEnvelopeV1; generationId: string;
}
export interface IndependentlyLoadedSourcesV1 {
  fullGraphSnapshot: BoundDocument<GraphSnapshotV1>; sourceMissionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
  executionTemplate: BoundDocument<GraphExecutionTemplate>; executionSourceSpec: BoundDocument<GraphExecutionSource>;
  inputManifestSource: CompleteInputSourceV1; knowledgeSource: BoundDocument<KnowledgeSourceV1>;
  approvalSource: BoundDocument<ApprovalSourceV1>; contractPins: ContractPinsV1;
  parentEnvelope: BoundDocument<ExecutionEnvelopeV1> | null;
  rootLimits: BoundDocument<RootLimitsV1> | null; rootBootstrapSources: RootBootstrapSourcesV1 | null;
  planningPolicy: BoundDocument<PlannerPolicy>; contextSources: PublicContextSourcesV1;
  groupingConfig: BoundDocument<GroupConfig>; codecBytes: BoundBytesV1[];
}
export interface BoundPreparationV1 {
  body: ExecutionPreparationBodyV1; snapshot: GraphSnapshotV1; missionSnapshot: ExecutionMissionSnapshotV1;
  transport: PreparedGraphTransportV3; template: GraphExecutionTemplate; sourceSpec: GraphExecutionSource;
  inputSource: GraphInputSource; knowledge: KnowledgeSourceV1; approvals: ApprovalSourceV1;
  grouping: DecodedGroupSourceV1; projection: ExecutionProjectionV1;
}
export interface BoundExecutionV1 extends BoundPreparationV1 {
  origin: ParsedExecutionEnvelopeV1; planning: PlannerResult;
}
export interface DerivedExecutionSpecV3 {
  version: "l8-execution-derived-v3"; sourceSpecFingerprint: string; templateFingerprint: string; inputManifestFingerprint: string;
  envelopeFingerprint: string; planId: string; planFingerprint: string; sidecarFingerprint: string; bindingFingerprint: string;
  snapshotId: string; partitionId: string; knowledgeRevision: number;
}
export interface GraphRunV3 {
  version: "l8-graph-run-v3"; mode: "offline-fixture-v1"; missionId: string; generationId: string;
  envelopeFingerprint: string; envelope: BoundDocument<ExecutionEnvelopeV1>;
  derivedSpec: DerivedExecutionSpecV3; derivedSpecFingerprint: string; fingerprint: string;
}
export interface ParsedGraphRunV3 { document: BoundDocument<GraphRunV3>; run: GraphRunV3 }
export interface ExecutionInspectionV1 {
  shape: boolean; coherent: boolean; proposalAdmissible: boolean | null;
  authorityVerified: false; activationState: "not-established"; reasons: readonly string[];
}

// These records are DATA contracts. S1 neither constructs trusted handles nor executes CAS.
export interface CandidateRefV1 { generationId: string; envelopeFingerprint: string; envelopeRef: ByteRef; runRef: ByteRef }
export interface DrainEntryV1 {
  version: "l8-drain-entry-v1"; barrierRootId: string; candidateRef: CandidateRefV1; expectedT0Ref: ByteRef;
  headBefore: number; headAfter: number; controllerFence: number; engagedFamiliesRef: ByteRef; inventoryAtCutRef: ByteRef; eventSequence: number;
}
export interface ExpectationsT2V1 {
  headRevision: number; activeGenerationId: string | null; activePlanRevision: number | null; sourceMissionRevision: number;
  controllerFence: number; familyFences: Array<{ familyId: string; fence: number }>;
  knowledgeRevision: number; knowledgeRootHash: string; knowledgeLedgerRevision: number; knowledgeLedgerDigest: string;
  inventoryRevision: number; inventoryDigest: string; inventoryRef: ByteRef;
  budgetLedgerRevision: number; budgetLedgerDigest: string; spentBySlot: Array<{ slotKey: string; amount: number }>;
  encumberedBySlot: Array<{ slotKey: string; amount: number }>;
  proofRecordRefs: ByteRef[]; releaseRecordRefs: ByteRef[]; sourceCapabilityRecordRefs: ByteRef[];
  authorityRecords: Array<{ recordRef: ByteRef; revision: number; revocationRef: ByteRef | null }>;
}
export type ActivationAttemptV1 = {
  version: "l8-activation-attempt-v1"; activationAttemptOrdinal: number; previousActivationAttemptId: string | null;
  candidateRef: CandidateRefV1; barrierRootId: string; drainEntryRef: ByteRef; replacementRecordRef: ByteRef | null;
  expectationsT2: ExpectationsT2V1; authorityRecordRefs: ByteRef[];
} & ({ authorizationKind: "bootstrap-a-fixture-v1" | "transition-a-fixture-v1"; finalAdoption: null } |
  { authorizationKind: "proposal-b-host-fixture-v1"; finalAdoption: BoundDocument<PartitionAdoptionTransportV1> });
export interface CandidateReplacementV1 {
  barrierRootId: string; drainEntryRef: ByteRef; oldCandidateRef: CandidateRefV1; newCandidateRef: CandidateRefV1;
  currentHeadRevision: number; currentCandidateRevision: number; sourceBindingsRef: ByteRef;
  authorityRecordRefs: ByteRef[]; controllerFence: number;
}
export interface GenerationHeadV1 {
  version: "l8-graph-generation-head-v1"; missionId: string; lineageId: string; revision: number;
  activeGenerationId: string | null; candidateGenerationId: string | null; candidateRef: CandidateRefV1 | null;
  activePlanRevision: number | null; controlMode: "RUNNING" | "DRAIN_NEW_FAMILIES" | "OPERATOR_PAUSED";
  budgetLedgerRevision: number; knowledgeLedgerRevision: number; inventoryRevision: number;
  barrierRootId: string | null; candidateRevision: number;
}

const SHA = /^[a-f0-9]{64}$/;
const PIN_KEYS = ["envelopeCodec", "fullSnapshotSchema", "fullSnapshotModule", "proposalCodec", "plannerCodec", "inputCodec", "admissionCodec", "preparedTransportSchema", "adoptionTransportSchema",
  "domainModule", "validationModule", "plannerDerivedCodec", "functionOrderCodec", "plannerRelationCodec", "sparseGraphCodec", "groupContextCodec", "lineagePureCodec",
  "graphPersistenceErrorsCodec", "rePolicyCodec", "transportCodec", "bProjectionCodec", "clusterTypesModule", "groupTypesModule", "envelopeSchema",
  "clusterPartitionSchema", "workUnitSchema", "knowledgeCommitSchema", "missionPlanSchema", "investigationGroupSchema"] as const;
const ENVELOPE_KIND = "l8-execution-envelope-v1", RUN_KIND = "l8-graph-run-v3";
function check(condition: unknown, reason: string): asserts condition { if (!condition) throw new Error(`l8-source: ${reason}`); }
function attempt<T>(work: () => T): CodecResult<T> {
  try { return { ok: true, value: work() }; }
  catch (error) { return { ok: false, reasons: [error instanceof Error ? error.message : "l8-source: input could not be inspected"] }; }
}
function take<T>(result: CodecResult<T>): T { check(result.ok, result.ok ? "" : result.reasons.join("; ")); return result.value; }
function wellFormedText(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) { const d = s.charCodeAt(++i); if (!(d >= 0xdc00 && d <= 0xdfff)) return false; }
    else if (c >= 0xdc00 && c <= 0xdfff) return false;
  }
  return true;
}
/** Reject lossy JS values before cloning, hashing, coercion or property access. */
export function assertExecutionJsonV1(value: unknown, parents = new Set<object>()): void {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") { check(wellFormedText(value), "isolated surrogate"); return; }
  if (typeof value === "number") { check(Number.isFinite(value) && !Object.is(value, -0), "non-finite number or negative zero"); return; }
  check(typeof value === "object" && !utilTypes.isProxy(value) && !parents.has(value), "non-JSON value, proxy or cycle");
  const array = Array.isArray(value);
  check(Object.getPrototypeOf(value) === (array ? Array.prototype : Object.prototype), "non-plain prototype");
  const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
  if (array) check(keys.length === value.length + 1, "sparse array or extra array properties");
  parents.add(value);
  for (const key of keys) {
    if (array && key === "length") continue;
    const d = typeof key === "string" ? descriptors[key] : undefined;
    check(typeof key === "string" && wellFormedText(key) && d?.enumerable && "value" in d, "symbol, accessor or hidden property");
    if (array) check(/^(0|[1-9][0-9]*)$/.test(key) && Number(key) < value.length, "extra array key");
    assertExecutionJsonV1(d.value, parents);
  }
  parents.delete(value);
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") { for (const v of Object.values(value)) freeze(v); Object.freeze(value); }
  return value;
}
// This boundary is called only with the fully validated, explicitly typed DTO.
// The existing recursive freezer establishes the deep-readonly runtime invariant;
// the overload avoids an unbounded mutable/readonly structural comparison in TS.
function freezePreparation(value: BoundPreparationV1): ReadonlyData<BoundPreparationV1>;
function freezePreparation(value: unknown): unknown { return freeze(value); }
function clone<T>(value: T): T { assertExecutionJsonV1(value); return structuredClone(value); }
/** C1 is new; upstream canonical()/fingerprint() remain separate and unchanged. */
export function canonicalExecutionJsonV1(value: unknown): string {
  assertExecutionJsonV1(value);
  const encode = (v: unknown): string => {
    if (v === null || typeof v !== "object") { const encoded = JSON.stringify(v); check(typeof encoded === "string", "non-JSON scalar"); return encoded; }
    return Array.isArray(v) ? `[${v.map(encode).join(",")}]`
      : `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${encode((v as Record<string, unknown>)[k])}`).join(",")}}`;
  };
  return encode(value);
}
export function executionValueRefV1(kind: string, value: unknown): ValueRef {
  check(typeof kind === "string" && kind.length > 0 && wellFormedText(kind), "value-ref kind");
  return freeze({ kind, codec: "l8-json-c14n-v1", sha256: hash(canonicalExecutionJsonV1({ kind, value })) });
}
function ref(kind: string, bytes: Uint8Array, encoding: ByteRef["encoding"]): ByteRef {
  return { kind, encoding, byteLength: bytes.byteLength, sha256: hash(bytes) };
}
function validateByteRef(v: unknown): asserts v is ByteRef {
  const r = object(v, ["kind", "encoding", "byteLength", "sha256"]); text(r.kind); one(r.encoding, ["utf8-json-v1", "raw-v1"]); count(r.byteLength); sha(r.sha256);
}
function validateValueRef(v: unknown): asserts v is ValueRef {
  const r = object(v, ["kind", "codec", "sha256"]); text(r.kind); one(r.codec, ["l8-json-c14n-v1"]); sha(r.sha256);
}
/** Token prepass detects duplicate decoded keys BEFORE JSON.parse constructs objects. */
function strictJson(textValue: string): unknown {
  check(wellFormedText(textValue) && textValue.charCodeAt(0) !== 0xfeff, "invalid JSON Unicode or BOM");
  let i = 0;
  const ws = () => { while (i < textValue.length && /[\x20\t\r\n]/.test(textValue[i]!)) i++; };
  const string = (): string => {
    check(textValue[i] === '"', "JSON string expected"); const start = i++;
    while (i < textValue.length) {
      const c = textValue[i++]!;
      if (c === '"') { const s: unknown = JSON.parse(textValue.slice(start, i)); check(typeof s === "string" && wellFormedText(s), "isolated surrogate in JSON string"); return s; }
      if (c === "\\") { check(i < textValue.length, "truncated escape"); const e = textValue[i++]!; if (e === "u") { check(/^[0-9a-fA-F]{4}$/.test(textValue.slice(i, i + 4)), "invalid unicode escape"); i += 4; } else check('"\\/bfnrt'.includes(e), "invalid escape"); }
      else check(c.charCodeAt(0) >= 32, "unescaped JSON control");
    }
    throw new Error("l8-source: unterminated JSON string");
  };
  const value = (): void => {
    ws(); const c = textValue[i];
    if (c === "{") {
      i++; ws(); const keys = new Set<string>(); if (textValue[i] === "}") { i++; return; }
      for (;;) { ws(); const key = string(); check(!keys.has(key), `duplicate JSON key ${key}`); keys.add(key); ws(); check(textValue[i++] === ":", "JSON colon expected"); value(); ws(); const end = textValue[i++]; if (end === "}") return; check(end === ",", "JSON object separator"); }
    }
    if (c === "[") { i++; ws(); if (textValue[i] === "]") { i++; return; } for (;;) { value(); ws(); const end = textValue[i++]; if (end === "]") return; check(end === ",", "JSON array separator"); } }
    if (c === '"') { string(); return; }
    const token = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(textValue.slice(i));
    check(token, "JSON scalar expected"); i += token[0].length;
  };
  value(); ws(); check(i === textValue.length, "trailing JSON data");
  const parsed: unknown = JSON.parse(textValue); assertExecutionJsonV1(parsed); return parsed;
}
function utf8(bytes: Uint8Array): string {
  check(!(bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), "UTF-8 BOM forbidden");
  const s = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  check(wellFormedText(s), "isolated surrogate"); return s;
}
function documentBytes(v: unknown, expectedKind?: string): { document: BoundDocument<unknown>; value: unknown; bytes: Uint8Array } {
  assertExecutionJsonV1(v); const r = object(v, ["ref", "utf8"]); validateByteRef(r.ref); text(r.utf8, true);
  check(r.ref.encoding === "utf8-json-v1" && (expectedKind === undefined || r.ref.kind === expectedKind), "document encoding/kind mismatch");
  const bytes = new TextEncoder().encode(r.utf8);
  check(bytes.byteLength === r.ref.byteLength && hash(bytes) === r.ref.sha256, "document byte length/hash mismatch");
  return { document: clone(r) as unknown as BoundDocument<unknown>, value: strictJson(utf8(bytes)), bytes };
}
/** New documents only; this never rewrites an existing BoundDocument's utf8. */
export function makeBoundDocumentV1<T>(kind: string, value: T): BoundDocument<T> {
  text(kind);
  const utf8 = canonicalExecutionJsonV1(value), bytes = new TextEncoder().encode(utf8);
  return freeze({ ref: ref(kind, bytes, "utf8-json-v1"), utf8 });
}
export function makeBoundBytesV1(kind: string, bytes: Uint8Array): BoundBytesV1 {
  text(kind); check(!utilTypes.isProxy(bytes) && utilTypes.isUint8Array(bytes), "raw Uint8Array required");
  const own = new Uint8Array(bytes); return freeze({ ref: ref(kind, own, "raw-v1"), base64: Buffer.from(own).toString("base64") });
}

type RecordValue = Record<string, unknown>;
type Rule = (value: unknown) => void;
function object(v: unknown, required: readonly string[], optional: readonly string[] = []): RecordValue {
  check(v !== null && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype, "plain object required");
  const r = v as RecordValue;
  check(required.every(k => Object.hasOwn(r, k)) && Reflect.ownKeys(r).every(k => typeof k === "string" && (required.includes(k) || optional.includes(k))), `closed object fields: ${required.join(",")}`);
  return r;
}
function text(v: unknown, empty = false): asserts v is string { check(typeof v === "string" && wellFormedText(v) && (empty || v.length > 0), "text required"); }
function sha(v: unknown): asserts v is string { check(typeof v === "string" && SHA.test(v), "SHA-256 required"); }
function count(v: unknown, min = 0): asserts v is number { check(typeof v === "number" && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= min, "safe count required"); }
function finite(v: unknown): asserts v is number { check(typeof v === "number" && Number.isFinite(v) && !Object.is(v, -0), "finite number required"); }
function bool(v: unknown): asserts v is boolean { check(typeof v === "boolean", "boolean required"); }
function one(v: unknown, values: readonly unknown[]): void { check(values.includes(v), `expected ${values.join("|")}`); }
function list(v: unknown, rule: Rule): asserts v is unknown[] { check(Array.isArray(v), "array required"); for (const x of v) rule(x); }
function nullable(rule: Rule): Rule { return v => { if (v !== null) rule(v); }; }
function dictionary(v: unknown, rule: Rule): void { check(v !== null && typeof v === "object" && !Array.isArray(v), "dictionary required"); for (const x of Object.values(v)) rule(x); }
function fields(v: unknown, required: Record<string, Rule>, optional: Record<string, Rule> = {}): RecordValue {
  const r = object(v, Object.keys(required), Object.keys(optional));
  for (const [k, rule] of Object.entries(required)) rule(r[k]);
  for (const [k, rule] of Object.entries(optional)) if (Object.hasOwn(r, k)) rule(r[k]); return r;
}
const texts: Rule = v => list(v, x => text(x)), hashes: Rule = v => list(v, sha), roles = ["explore", "evaluate", "A", "B", "R"] as const;
const identity: Rule = v => { fields(v, { sha256: sha, version: text, ea: text }); validateIdentity(v); };
const binary: Rule = v => { fields(v, { sha256: sha, version: text }); };
const model: Rule = v => { fields(v, { providerID: text, id: text, variant: text }); };
const evidence: Rule = v => { fields(v, { id: text, source: text, sha256: sha, detail: x => text(x, true) }); };
const file: Rule = v => { fields(v, { path: text, sha256: sha, version: text, provenance: text, kind: x => one(x, ["native", "rule", "knowledge", "proposal", "score", "manifest"]) }, { approvedForBlind: bool, identity }); };
const factMetadata: Rule = v => { fields(v, { schemaVersion: x => one(x, [1]), resultId: text, identity, inputVersions,
  resultHash: sha, publicationReceipt, conclusion }); };
const inputVersions: Rule = v => list(v, x => { fields(x, { path: text, version: text, sha256: sha }); });
const conclusion: Rule = v => { fields(v, { text: x => text(x, true), evidence: x => list(x, evidence) }); };
const publicationReceipt: Rule = v => { fields(v, { idempotencyKey: text, targetId: text, revision: count, resultHash: sha }); };
const knowledge: Rule = v => {
  fields(v, { version: text, fingerprint: text, leadsFingerprint: text, files: x => list(x, file) }, {
    validatedFacts: x => list(x, factMetadata), commonFingerprint: text,
    scopedLeads: x => list(x, y => { fields(y, { identity, fingerprint: text }); }) }); validateKnowledge(v);
};
const fact: Rule = v => { const r = object(v, ["schemaVersion", "resultId", "identity", "inputVersions", "resultHash", "publicationReceipt", "conclusion", "file", "content", "materialization"], ["lastError"]);
  const { file: f, content, materialization, lastError: _last, ...base } = r; factMetadata(base); file(f); text(content, true); one(materialization, ["pending", "verified"]); if (Object.hasOwn(r, "lastError")) text(r.lastError, true);
};
const candidate: Rule = v => { fields(v, { identity, manifestVersion: text, evidence: x => list(x, evidence), inputs: x => list(x, file), dependencies: x => list(x, identity) }); };
const assessment: Rule = v => { fields(v, { identity, method: text, version: text, difficulty: finite, reasons: texts, evidence: x => list(x, evidence) }, { estimatedCost: finite }); };
const proposition: Rule = v => { fields(v, { id: text, text: x => text(x, true), evidence: x => list(x, evidence), contradictions: texts, questions: texts }); };
const retry: Rule = v => { fields(v, { maxAttempts: x => count(x, 1), retryDelayMs: count }, { fixtureSynthetic: x => one(x, [true]) }); };
const config: Rule = v => {
  fields(v, { schemaVersion: x => one(x, [1]), missionId: text, binary, fixture: bool,
    evaluation: x => { fields(x, { method: text, version: text, maxDifficulty: finite }); }, maxCycles: x => count(x, 1), stagnationLimit: x => count(x, 1),
    models: x => { fields(x, Object.fromEntries(roles.map(r => [r, model]))); }, knowledge, commonInputs: x => list(x, file), accessibleRules: texts, requiredTools: texts, outputDirectory: text }, {
    subsetSize: x => count(x, 1), budget: finite, retryPolicy: retry, rePolicy: x => { validateREPolicy(x); },
    fixtureSeeds: x => { fields(x, { approved: y => one(y, [true]), candidates: y => list(y, candidate), assessments: y => list(y, assessment) }); }
  }); validateConfig(v);
};
const result: Rule = v => {
  const r = v as RecordValue; check(r !== null && typeof r === "object", "worker result required");
  const header: Record<string, Rule> = { schemaVersion: x => one(x, [1]), missionId: text, taskId: text, attemptId: text, executionId: text,
    cycle: x => count(x, 1), authorId: text, inputFingerprint: sha, inputVersions, previousResultIds: texts, kind: text };
  const optional: Record<string, Rule> = { identity };
  if (r.kind === "explore") header.candidates = x => list(x, candidate);
  else if (r.kind === "evaluate") header.assessments = x => list(x, assessment);
  else if (r.kind === "proposal") { header.role = x => one(x, ["A", "B"]); header.propositions = x => list(x, proposition); }
  else { one(r.kind, ["reconciliation"]); header.decision = x => one(x, ["certain", "likely", "unlikely", "blocked"]); header.propositions = x => list(x, proposition); header.contradictions = texts; header.questions = texts;
    optional.conclusion = conclusion;
    optional.publicationGate = x => { fields(x, { nativeAsmChecked: y => one(y, [true]), independentAuthors: y => one(y, [true]), inputHashesVerified: y => one(y, [true]), opcodeCoverageComplete: y => one(y, [true]), abiChecked: y => one(y, [true]), contradictionsResolved: y => one(y, [true]), readbackPlan: y => one(y, [true]), targetId: text, targetRevision: count, evidence: y => list(y, evidence) }); };
  }
  fields(v, header, optional);
};
const storedResult: Rule = v => {
  const r = fields(v, { resultId: text, path: text, sha256: sha, authorId: text, executionId: text, sessionId: text, effectiveModel: model, content: x => text(x, true), document: result });
  check(hash(r.content as string) === r.sha256 && canonical(strictJson(r.content as string)) === canonical(r.document), "result content/document/hash mismatch");
};

const failure: Rule = v => { fields(v, { operation: x => one(x, ["ensureTeam", "submit", "inspect", "pauseAdmissions", "stop", "resumeAdmissions", "publish", "readback", "materializeKnowledge"]), at: count, cause: assertExecutionJsonV1 }, { executionId: text, attempt: count }); };
const bulletinAuthor: Rule = v => { fields(v, { executionId: text, sessionId: text, profile: text, model: x => { fields(x, { providerID: text, id: text }, { variant: text }); } }); };
const bulletinReference: Rule = v => { fields(v, { id: sha, seq: x => count(x, 1), channel: text, payloadSha256: sha, schemaSha256: sha, author: bulletinAuthor }); };
const communicationTrace: Rule = v => { fields(v, { published: x => list(x, bulletinReference), received: x => list(x, bulletinReference), cursor: count }); };
const communicationAudit: Rule = v => {
  fields(v, { version: x => one(x, [1]), verifier: x => one(x, ["ff8-harness.scoped-bulletin.v1"]), status: x => one(x, ["scope-verified"]), missionId: text, executionId: text, channel: text, schemaSha256: sha, rePolicySha256: sha,
    trace: communicationTrace, traceSha256: sha, snapshotSha256: sha,
    snapshot: x => { fields(x, { version: y => one(y, [1]), missionId: text, revision: count, messages: y => list(y, z => {
      const r = object(z, ["id", "seq", "channel", "payloadSha256", "schemaSha256", "author", "payload"]); const { payload, ...rest } = r; bulletinReference(rest); assertExecutionJsonV1(payload);
    }) }); },
    authors: x => list(x, y => { fields(y, { author: bulletinAuthor, dossierSha256: sha, rePolicySha256: sha, neighborhoodSha256: sha,
      nativeToolBindings: z => list(z, a => { fields(a, { tool: text, accesses: b => list(b, c => { fields(c, { action: text, resource: text }); }) }); }), nativeToolBindingsSha256: sha, communicationSha256: sha }); }),
    nativeDisasmWitnesses: x => list(x, y => { fields(y, { id: text, action: text, resource: text, sessionId: text, profile: text, effect: z => one(z, ["allow"]), verifierSource: text,
      native: z => { fields(z, { messageID: text, id: text, tool: text, status: a => one(a, ["completed"]) }); } }); }),
    interpretation: x => one(x, ["provisional-leads-only; not independent confirmation or scientific acceptance"]),
    evidenceHashes: x => one(x, ["publisher-declared source fingerprints; not native ASM return attestations"]) });
};
const inspection: Rule = v => { fields(v, { status: x => one(x, ["pending", "running", "completed", "failed"]), executionId: text }, {
  authorId: text, sessionId: text, effectiveModel: model, fresh: bool, parentSessionId: text,
  artifact: x => { fields(x, { path: text, sha256: sha, content: y => text(y, true) }); }, error: x => text(x, true), communicationTrace: assertExecutionJsonV1, communicationAudit }); };
const frozenProposal: Rule = v => { fields(v, { resultId: text, sha256: sha, path: text, authorId: text, executionId: text, sessionId: text, content: x => text(x, true), document: result }); };
const inputBundle: Rule = v => { fields(v, { schemaVersion: x => one(x, [1]), role: x => one(x, roles), cycle: x => count(x, 1), files: x => list(x, file), accessibleRules: texts, requiredTools: texts, knowledge }, {
  identity, candidates: x => list(x, candidate), proposals: x => list(x, frozenProposal), evaluation: x => { fields(x, { method: text, version: text }, { budget: finite }); },
  unresolvedResults: x => list(x, y => { fields(y, { resultId: text, identity, decision: z => one(z, ["likely", "unlikely"]), cycle: count, sha256: sha }); }),
  neighborhood: x => { fields(x, { id: text, members: y => list(y, identity) }); } }); };
const intent: Rule = v => { fields(v, { schemaVersion: x => one(x, [1]), missionId: text, taskId: text, attemptId: text, executionId: text, binary, fixture: bool, idempotencyKey: text,
  cycle: x => count(x, 1), role: x => one(x, roles), fresh: x => one(x, [true]), requestedModel: model, inputs: inputBundle, inputFingerprint: sha, outputPath: text, previousResultIds: texts }, { identity }); };
const publicationRequest: Rule = v => { fields(v, { idempotencyKey: text, missionId: text, identity, reconciliationId: text, resultHash: sha, document: result, targetId: text, expectedRevision: count, fixture: bool }); };
const cycleAnchor: Rule = v => {
  const r = v as RecordValue; check(r !== null && typeof r === "object", "cycle anchor required");
  if (r.version === "l8-frozen-cycle-v3") {
    fields(v, { version: x => one(x, ["l8-frozen-cycle-v3"]), lineageId: text, generationId: text, envelopeFingerprint: sha, runFingerprint: sha, envelopeRef: validateByteRef, runRef: validateByteRef }); return;
  }
  const base: Record<string, Rule> = { version: x => one(x, ["l8-frozen-cycle-v1", "l8-frozen-cycle-v2"]), runFingerprint: sha, preparedFingerprint: sha, planFingerprint: sha, snapshotId: text, partitionId: text, knowledgeRevision: count };
  if (r.version === "l8-frozen-cycle-v2") Object.assign(base, { admissionContextFingerprint: sha, allocationFingerprint: nullable(sha), budgetScopeKey: text, derivedSpecFingerprint: sha });
  fields(v, base);
};
function validateMissionSnapshot(v: unknown): ExecutionMissionSnapshotV1 {
  assertExecutionJsonV1(v);
  const r = fields(v, { schemaVersion: x => one(x, [1]), missionId: text, revision: count, config,
    status: x => one(x, ["running", "paused", "stopped", "suspended", "complete"]), cycle: count,
    stage: x => one(x, ["explore", "group", "evaluate", "freeze", "analyse", "reconcile", "validate", "consolidate"]), noProgressCycles: count,
    candidates: x => list(x, y => { fields(y, { candidate, manifestFingerprint: sha, eligibleCycle: count, assessments: z => list(z, a => { fields(a, { assessment, resultId: text, cycle: count, evidenceFingerprint: sha, manifestFingerprint: sha, accepted: bool }, { rejectionReason: text }); }) }, {
      outcome: z => one(z, ["saved_certain", "retained_uncertain", "blocked"]), reason: text,
      scientificHistory: z => list(z, a => { fields(a, { cycle: count, fingerprint: sha, phase: b => one(b, ["attempted", "reconciled"]) }, { resultId: text, decision: b => one(b, ["certain", "likely", "unlikely", "blocked"]) }); }) }); }),
    cycles: x => list(x, y => { fields(y, { number: x => count(x, 1), knowledge, subset: texts, frozen: bool, groups: z => list(z, a => { fields(a, { id: text, members: texts }); }) }, { fingerprint: sha, graph: cycleAnchor, functionFingerprints: z => dictionary(z, sha) }); }),
    intents: x => list(x, y => { fields(y, { intent, state: z => one(z, ["planned", "submitted", "resolved", "blocked"]) }, {
      result: storedResult, error: text, inputIssues: z => list(z, a => { fields(a, { kind: b => one(b, ["missing", "altered", "denied-read", "denied-list", "unavailable-tool", "invalid-manifest"]), path: text, detail: b => text(b, true) }); }),
      admissionAttempts: count, inspectionHistory: z => list(z, inspection), nextAdmissionAt: count, failureHistory: z => list(z, failure) }); }),
    reconciliations: x => list(x, y => { fields(y, { result: storedResult, proposalResultIds: texts, previousResultIds: texts, decision: z => one(z, ["certain", "likely", "unlikely", "blocked"]), outcome: z => one(z, ["saved_certain", "retained_uncertain", "blocked", "publication_pending"]) }, {
      scientificInputFingerprint: sha, publication: z => { fields(z, { request: publicationRequest, state: a => one(a, ["pending", "published", "verified"]), attempts: count }, { receipt: publicationReceipt, lastError: text, failureHistory: a => list(a, failure) }); } }); })
  }, { reason: text, controlPending: x => one(x, ["pause", "stop", "resume"]), controlError: text, teamAdmissionAttempts: count, nextTeamAdmissionAt: count, failureHistory: x => list(x, failure), validatedFacts: x => list(x, fact) });
  const s = r as unknown as ExecutionMissionSnapshotV1;
  check(s.missionId === s.config.missionId && s.config.fixture === true, "fixture mission/config binding");
  const cycleNumbers = s.cycles.map(c => c.number); check(new Set(cycleNumbers).size === cycleNumbers.length, "duplicate mission cycle");
  check(s.cycle === 0 ? s.cycles.length === 0 : s.cycles.some(c => c.number === s.cycle), "current source cycle missing");
  return s;
}

function validateBoundBytes(v: unknown, encoding: ByteRef["encoding"] = "raw-v1"): BoundBytesV1 {
  const r = fields(v, { ref: validateByteRef, base64: x => text(x, true) });
  const value = r as unknown as BoundBytesV1;
  check(value.ref.encoding === encoding && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.base64), "canonical bound base64 required");
  const bytes = Buffer.from(value.base64, "base64");
  check(bytes.toString("base64") === value.base64 && bytes.byteLength === value.ref.byteLength && hash(bytes) === value.ref.sha256, "raw byte content/hash mismatch");
  // Codec/schema *source bytes* are opaque pinned loader inputs, not business
  // BoundDocuments to decode again. Verify their UTF8 without interpreting the
  // schema language here. Business JSON still goes through strictJson below.
  if (encoding === "utf8-json-v1") utf8(bytes);
  return value;
}
function artifactBytes(v: unknown): void {
  const r = fields(v, { file, bytes: x => { validateBoundBytes(x); } });
  check((r.file as ArtifactFile).sha256 === (r.bytes as BoundBytesV1).ref.sha256, "artifact bytes/manifest SHA mismatch");
}
function validateApprovalSource(v: unknown): ApprovalSourceV1 {
  fields(v, { version: x => one(x, ["l8-approval-source-v1"]), revision: count, records: x => list(x, y => { fields(y, {
    approvalId: text, issuerRef: validateByteRef, authorityRevision: count, functionIdentity: identity, fileSha256: sha, filePath: text,
    sourceResultIds: texts, allowedRoles: z => list(z, a => one(a, roles)), knowledgeRevision: count,
    decision: z => one(z, ["approved", "denied", "revoked"]), recordRef: validateByteRef }); }) });
  const s = v as ApprovalSourceV1; check(new Set(s.records.map(r => r.approvalId)).size === s.records.length, "duplicate approval identity");
  for (const r of s.records) { check(new Set(r.allowedRoles).size === r.allowedRoles.length && new Set(r.sourceResultIds).size === r.sourceResultIds.length, "duplicate approval scope"); }
  return s;
}
function validateArtifactBinding(v: unknown): ArtifactBinding {
  fields(v, { version: x => one(x, [1]), missionId: text, artifactId: text, artifactSha256: sha, functionId: text, moduleSha256: sha,
    artifactKind: x => one(x, ["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"]), knowledgeRevision: count,
    publicationLevel: x => one(x, [1, 2]), validation: x => one(x, ["fixture-only", "parent-validated"]), producerUnitId: text, commitId: sha,
    materialization: x => one(x, ["stored-result", "parent-derived"]), content: x => text(x, true),
    sources: x => list(x, y => { fields(y, { resultId: text, executionId: text, subIntentId: text, digest: sha }); }),
    evidenceDigest: sha, parentAuthorityDigest: sha, parentActorId: text, parentAttestationId: nullable(text) });
  const b = v as ArtifactBinding; check(hash(b.content) === b.artifactSha256, "binding content SHA mismatch"); return b;
}
function validateKnowledgeSource(v: unknown): KnowledgeSourceV1 {
  fields(v, { version: x => one(x, ["l8-knowledge-source-v1"]), missionId: text, knowledgeRevision: count, rootHash: sha, frozen: knowledge,
    files: x => list(x, artifactBytes), facts: x => list(x, fact), ledgerRevision: count, ledgerDigest: sha,
    materializations: x => list(x, y => { const m = fields(y, { fileSha256: sha, filePath: text, resultId: text,
      producer: z => { fields(z, { authorId: text, executionId: text, sessionId: text, model }); }, validation: z => one(z, ["fixture-only", "parent-validated"]),
      revoked: bool, revocationRef: nullable(validateByteRef), binding: z => { validateArtifactBinding(documentBytes(z, "l8-artifact-binding-v1").value); },
      commit: z => { validateGraphDocument("knowledge-commit", documentBytes(z, "knowledge-commit-v1").value); }, result: z => { storedResult(documentBytes(z, "l8-stored-result-data-v1").value); },
      readback: z => { fields(z, { status: a => one(a, ["verified", "pending", "mismatch"]), sha256: sha, recordRef: validateByteRef }); },
      provenance: nullable(z => { documentBytes(z, "l8-knowledge-provenance-v1"); }) });
      check((m.revoked === true) === (m.revocationRef !== null), "revocation state/reference mismatch");
    }) });
  const k = v as KnowledgeSourceV1;
  check(new Set(k.files.map(f => f.file.path)).size === k.files.length, "duplicate materialized path");
  check(new Set(k.materializations.map(m => `${m.filePath}\u0000${m.resultId}`)).size === k.materializations.length, "duplicate materialization identity");
  const publications = new Map<string, unknown>();
  for (const materialization of k.materializations) if (materialization.provenance !== null) {
    validateKnowledgeProvenance(materialization, k);
    const provenance = documentBytes(materialization.provenance).value as KnowledgeProvenanceV1;
    const unit = documentBytes(provenance.producerUnit).value as WorkUnit;
    const key = `${k.missionId}\u0000${unit.unitId}`;
    const source = { pending: provenance.pendingPublication.ref, commit: materialization.commit.ref,
      readback: provenance.publicationReadback?.ref ?? null };
    if (publications.has(key)) refsEqual(publications.get(key), source, "contradictory producer publication sources");
    else publications.set(key, source);
  }
  // The backend's knowledge root is recorded, not redefined as an S1 selfhash.
  // Its equality to independently loaded K/T0 is checked below; the BoundDocument binds all its bytes.
  for (const f of k.frozen.files) check(k.files.some(b => canonical(b.file) === canonical(f)), "knowledge manifest file lacks exact bytes");
  for (const f of k.facts) {
    const b = k.files.find(b => b.file.path === f.file.path && b.file.sha256 === f.file.sha256);
    check(b && hash(f.content) === f.file.sha256 && Buffer.from(b.bytes.base64, "base64").equals(Buffer.from(f.content, "utf8")), "fact bytes missing/mismatched");
    const m = k.materializations.find(m => m.resultId === f.resultId && m.filePath === f.file.path && m.fileSha256 === f.file.sha256);
    check(m, "fact provenance/materialization missing");
    const binding = validateArtifactBinding(documentBytes(m.binding).value), commit = documentBytes(m.commit).value as KnowledgeCommit;
    const resultRecord = documentBytes(m.result).value as StoredResult;
    check(binding.missionId === k.missionId && binding.commitId === commit.commitId && commit.outputRevision <= k.knowledgeRevision
      && binding.knowledgeRevision === commit.outputRevision && binding.artifactSha256 === f.file.sha256
      && binding.sources.some(s => s.resultId === f.resultId && s.digest === f.resultHash)
      && commit.resultIds.includes(f.resultId) && resultRecord.resultId === f.resultId && fingerprint(resultRecord.document) === f.resultHash,
      "fact binding/commit/result mismatch");
    check(resultRecord.authorId === m.producer.authorId && resultRecord.executionId === m.producer.executionId && resultRecord.sessionId === m.producer.sessionId
      && canonical(resultRecord.effectiveModel) === canonical(m.producer.model), "materialization producer mismatch");
    refsEqual(f.identity, resultRecord.document.identity, "fact/result function identity mismatch");
    refsEqual(f.inputVersions, resultRecord.document.inputVersions, "fact/result input version mismatch");
    if (f.file.identity !== undefined) refsEqual(f.file.identity, f.identity, "fact/file function scope mismatch");
    check(f.publicationReceipt.targetId === commit.publicationTargetId && f.publicationReceipt.revision === commit.outputRevision
      && f.publicationReceipt.resultHash === f.resultHash, "fact publication receipt target/revision/result mismatch");
    if (f.materialization === "verified") check(!m.revoked && m.readback.status === "verified" && m.readback.sha256 === f.file.sha256
      && commit.readbackStatus === "verified", "verified fact without exact non-revoked publication/materialization readback");
    check(m.provenance !== null, "consumed materialization provenance unknown");
  }
  return k;
}
function validateKnowledgeProvenance(materialization: KnowledgeMaterializationV1, knowledgeSource: KnowledgeSourceV1): void {
  check(materialization.provenance !== null, "consumed materialization provenance unknown");
  const p = doc(materialization.provenance, "l8-knowledge-provenance-v1", value => {
    fields(value, { version: x => one(x, ["l8-knowledge-provenance-v1"]),
      producerUnit: x => { validateGraphDocument("work-unit", documentBytes(x, "work-unit-v1").value); },
      producerPlanning: x => { validateHistoricalPlanning(documentBytes(x, "l8-planning-source-v1").value); },
      results: x => list(x, y => { fields(y, { subIntentId: text, stored: z => { storedResult(documentBytes(z, "l8-stored-result-data-v1").value); },
        retained: z => { fields(documentBytes(z, "l8-retained-result-data-v1").value, { resultId: text, executionId: text, token: count,
          document: result, eligible: bool, source: a => one(a, ["artifact", "bulletin"]) }); },
        nativeAuthor: nullable(z => { fields(documentBytes(z, "l8-native-author-data-v1").value, { version: a => one(a, [1]), missionId: text,
          executionId: text, requestDigest: sha, authorId: text, sessionId: text, profile: text, model, fresh: a => one(a, [true]),
          parentSessionId: a => one(a, [null]), source: text, sourceHash: sha }); }),
        historicalAdmission: nullable(z => { doc(z, "l8-historical-admission-data-v1", validateHistoricalAdmission); }) }); }),
      wholeUnitValidation: x => { fields(documentBytes(x, "l8-whole-unit-validation-data-v1").value, { token: count, resultIds: texts,
        validation: y => { fields(y, { evidence: z => list(z, evidence), validatedFactIds: texts, source: z => one(z, ["artifact"]), parentValidated: bool }, { parentAttestationId: text }); } }); },
      pendingPublication: x => { validateGraphDocument("knowledge-commit", documentBytes(x, "knowledge-commit-v1").value); },
      publicationEffect: x => { fields(documentBytes(x, "l8-publication-effect-data-v1").value, { version: y => one(y, [1]), missionId: text,
        unitId: text, token: count, requestDigest: sha, verifiedEffect: y => one(y, ["satisfies", "does_not_satisfy", "invalidates_future"]) }); },
      publicationReadback: nullable(x => { fields(documentBytes(x, "l8-publication-readback-data-v1").value, { targetId: text, hash: sha, requestDigest: sha, source: text }); }),
      materializationReadback: nullable(x => { fields(documentBytes(x, "l8-materialization-readback-data-v1").value, { sha256: sha }); }),
      parentAuthority: x => { fields(documentBytes(x, "l8-parent-authority-data-v1").value, { version: y => one(y, [1]), role: y => one(y, ["parent"]),
        missionId: text, controllerOwner: text, principalId: text, actorId: text, source: text, sourceHash: text }); },
      parentAttestation: nullable(x => { fields(documentBytes(x, "l8-parent-attestation-data-v1").value, { version: y => one(y, [1]), attestationId: sha,
        missionId: text, unitId: text, familyToken: count, controllerToken: count, parentActorId: text, parentAuthorityDigest: sha, bindingFingerprint: sha,
        planFingerprint: sha, snapshotId: text, snapshotFingerprint: sha, partitionId: text, knowledgeRevision: count, resultIds: texts,
        resultDigests: y => dictionary(y, sha), authorDigests: y => dictionary(y, sha), evidenceDigest: sha, validatedFactIds: texts,
        checks: y => list(y, z => { fields(z, { id: text, kind: text, outcome: a => one(a, ["pass"]), evidenceDigest: sha, detail: text }); }) }); }) });
    return value as KnowledgeProvenanceV1;
  });
  const unit = documentBytes(p.producerUnit).value as WorkUnit;
  const planning = documentBytes(p.producerPlanning).value as PlannerResult;
  const pending = documentBytes(p.pendingPublication).value as KnowledgeCommit;
  const effect = documentBytes(p.publicationEffect).value as PublicationEffectDataV1;
  const validation = documentBytes(p.wholeUnitValidation).value as WholeUnitValidationDataV1;
  const authority = documentBytes(p.parentAuthority).value as ParentAuthorityIdentity;
  const binding = validateArtifactBinding(documentBytes(materialization.binding).value);
  const finalCommit = documentBytes(materialization.commit).value as KnowledgeCommit;
  check(planning.plan.missionId === knowledgeSource.missionId && authority.missionId === knowledgeSource.missionId
    && effect.missionId === knowledgeSource.missionId && effect.unitId === unit.unitId && pending.unitId === unit.unitId
    && binding.producerUnitId === unit.unitId, "historical producer mission/unit mismatch");
  const exactUnit = planning.units.find(u => u.unitId === unit.unitId);
  check(exactUnit !== undefined, "producer unit absent from retained planning"); refsEqual(exactUnit, unit, "producer unit/planning mismatch");
  check(pending.inputRevision === unit.knowledgeRevision && binding.knowledgeRevision === finalCommit.outputRevision
    && binding.publicationLevel === finalCommit.publicationLevel && binding.validation === materialization.validation,
    "producer publication revision/level/validation mismatch");
  uniqueStrings(p.results.map(r => r.subIntentId), "duplicate provenance subIntent");
  uniqueStrings(p.results.map(r => (documentBytes(r.stored).value as StoredResult).resultId), "duplicate provenance result");
  uniqueStrings(p.results.map(r => (documentBytes(r.stored).value as StoredResult).executionId), "duplicate provenance execution");
  check(p.results.length === unit.subIntents.length && unit.subIntents.every(s => p.results.some(r => r.subIntentId === s.subIntentId)), "whole-unit result coverage incomplete");
  const resultIds: string[] = [];
  const sessions: string[] = [];
  const attestation = p.parentAttestation === null ? null : documentBytes(p.parentAttestation).value as ParentAttestation;
  for (const source of p.results) {
    const stored = documentBytes(source.stored).value as StoredResult;
    const retained = documentBytes(source.retained).value as RetainedResultDataV1;
    const sub = unit.subIntents.find(s => s.subIntentId === source.subIntentId)!;
    check(retained.eligible && retained.source === "artifact" && retained.token === validation.token && stored.resultId === retained.resultId
      && stored.executionId === retained.executionId, "retained result is foreign/ineligible/token mismatch");
    check(stored.document.missionId === knowledgeSource.missionId && stored.document.executionId === stored.executionId
      && stored.document.authorId === stored.authorId, "stored result document mission/execution/author mismatch");
    refsEqual(stored.document, retained.document, "retained/stored result document mismatch");
    refsEqual(stored.document.identity, sub.harnessIdentity, "result/subIntent function mismatch");
    check(sub.role === "A" || sub.role === "B" ? stored.document.kind === "proposal" && stored.document.role === sub.role
      : stored.document.kind === (sub.role === "R" ? "reconciliation" : sub.role), "result/subIntent role mismatch");
    resultIds.push(stored.resultId);
    const admission = source.historicalAdmission === null ? null
      : doc(source.historicalAdmission, "l8-historical-admission-data-v1", validateHistoricalAdmission);
    if (admission !== null) {
      check(admission.missionId === knowledgeSource.missionId && admission.unitId === unit.unitId
        && admission.executionId === stored.executionId && admission.executionId === retained.executionId
        && admission.subIntentId === sub.subIntentId && admission.familyToken === validation.token,
        "historical admission producer/result/subIntent/token mismatch");
      refsEqual(admission.command.model, stored.effectiveModel, "historical command/stored model mismatch");
      if (Object.hasOwn(admission.receiptIdentity, "nativeSessionId")) check(admission.receiptIdentity.nativeSessionId === stored.sessionId, "historical receipt/stored session mismatch");
      if (Object.hasOwn(admission.receiptIdentity, "authorId")) check(admission.receiptIdentity.authorId === stored.authorId, "historical receipt/stored author mismatch");
    }
    if (source.nativeAuthor !== null) {
      check(admission !== null, "consumed native author historical admission unknown");
      const author = documentBytes(source.nativeAuthor).value as NativeAuthorIdentity;
      check(author.missionId === knowledgeSource.missionId && author.executionId === stored.executionId
        && author.authorId === stored.authorId && author.sessionId === stored.sessionId,
        "native author/stored result identity mismatch");
      check(author.requestDigest === admission.requestDigest && author.profile === admission.command.profile,
        "native author historical requestDigest/profile mismatch");
      refsEqual(author.model, admission.command.model, "native author historical command model mismatch");
      refsEqual(author.model, stored.effectiveModel, "native author/stored model mismatch");
      const receipt = admission.receiptIdentity;
      if (Object.hasOwn(receipt, "nativeSessionId")) check(receipt.nativeSessionId === author.sessionId, "historical receipt native session mismatch");
      if (Object.hasOwn(receipt, "authorId")) check(receipt.authorId === author.authorId, "historical receipt author mismatch");
    }
    if (attestation !== null) {
      check(source.nativeAuthor !== null, "attested author identity unknown");
      const author = documentBytes(source.nativeAuthor).value as NativeAuthorIdentity;
      check(author.missionId === knowledgeSource.missionId && author.executionId === stored.executionId && author.authorId === stored.authorId
        && author.sessionId === stored.sessionId && author.fresh && author.parentSessionId === null, "native author/result correspondence mismatch");
      refsEqual(author.model, stored.effectiveModel, "native author effective model mismatch");
      check(attestation.authorDigests[stored.executionId] === fingerprint(author) && attestation.resultDigests[stored.resultId] === fingerprint(stored.document), "attestation author/result digest mismatch");
      check(attestation.parentActorId !== author.authorId && attestation.parentActorId !== author.sessionId, "attestation parent equals author/session");
      sessions.push(author.sessionId);
    }
  }
  uniqueStrings(sessions, "attestation reuses a native author session");
  uniqueStrings(binding.sources.map(s => s.resultId), "duplicate artifact binding source");
  for (const source of binding.sources) {
    const provenance = p.results.find(r => (documentBytes(r.stored).value as StoredResult).resultId === source.resultId);
    check(provenance !== undefined, "artifact binding source outside whole-unit results");
    const stored = documentBytes(provenance.stored).value as StoredResult;
    const sub = unit.subIntents.find(s => s.subIntentId === provenance.subIntentId)!;
    check(source.executionId === stored.executionId && source.subIntentId === sub.subIntentId
      && source.digest === fingerprint(stored.document) && binding.functionId === sub.functionId
      && binding.moduleSha256 === sub.harnessIdentity.sha256, "artifact binding source function/execution/subIntent/digest mismatch");
  }
  check(binding.evidenceDigest === fingerprint(validation.validation.evidence) && binding.parentAuthorityDigest === fingerprint(authority)
    && binding.parentActorId === authority.actorId && binding.artifactKind === planning.sidecar.policy.artifactKind,
    "artifact binding evidence/parent/type mismatch");
  if (binding.materialization === "stored-result") check(binding.sources.length === 1 && binding.sources[0]!.resultId === materialization.resultId,
    "stored-result binding must name the materialized result exactly");
  refsEqual(validation.resultIds, resultIds, "validation result order/coverage mismatch");
  refsEqual(pending.resultIds, resultIds, "publication result order/coverage mismatch");
  refsEqual(pending.validatedFactIds, validation.validation.validatedFactIds, "publication validated facts mismatch");
  refsEqual(pending.evidence, validation.validation.evidence, "publication validation evidence mismatch");
  check(pending.readbackStatus === "pending" && pending.commitId === scientificCommitId(pending) && effect.token === validation.token
    && effect.requestDigest === fingerprint(pending), "immutable pending request digest mismatch");
  if (finalCommit.readbackStatus === "verified") {
    check(p.publicationReadback !== null && p.materializationReadback !== null, "verified publication readback unknown");
    const readback = documentBytes(p.publicationReadback).value as PublicationReadbackDataV1;
    check(readback.requestDigest === fingerprint(pending) && readback.targetId === pending.publicationTargetId && readback.hash === pending.readbackHash,
      "publication readback request/target/hash mismatch");
    const verified = { ...pending, readbackStatus: "verified" as const, futurePrerequisiteEffect: effect.verifiedEffect };
    refsEqual(finalCommit, { ...verified, commitId: scientificCommitId(verified) }, "final commit changed immutable pending fields");
    refsEqual(p.materializationReadback.ref, materialization.readback.recordRef, "materialization record ref mismatch");
    check((documentBytes(p.materializationReadback).value as { sha256: string }).sha256 === materialization.fileSha256,
      "materialization readback file hash mismatch");
  }
  if (attestation !== null) {
    check(attestation.parentAuthorityDigest === fingerprint(authority) && attestation.parentActorId === authority.actorId
      && attestation.unitId === unit.unitId && attestation.missionId === knowledgeSource.missionId
      && attestation.bindingFingerprint === planning.binding.fingerprint && attestation.planFingerprint === planning.plan.fingerprint
      && attestation.snapshotId === unit.snapshotId && attestation.snapshotFingerprint === planning.sidecar.snapshotFingerprint
      && attestation.partitionId === unit.partitionId && attestation.knowledgeRevision === unit.knowledgeRevision
      && attestation.familyToken === validation.token, "parent attestation historical binding mismatch");
    const { attestationId, ...content } = attestation;
    check(attestationId === fingerprint(content) && attestation.evidenceDigest === fingerprint(validation.validation.evidence)
      && binding.parentAttestationId === attestationId && validation.validation.parentAttestationId === attestationId,
      "parent attestation content/evidence/retained reference mismatch");
    refsEqual(attestation.resultIds, resultIds, "attestation ordered result coverage mismatch");
    refsEqual(Object.keys(attestation.resultDigests).sort(), [...resultIds].sort(), "attestation extra/missing result digest");
    refsEqual(Object.keys(attestation.authorDigests).sort(), p.results.map(r => (documentBytes(r.stored).value as StoredResult).executionId).sort(), "attestation extra/missing author digest");
    refsEqual(attestation.validatedFactIds, pending.validatedFactIds, "attestation fact coverage mismatch");
    check(attestation.checks.length > 0 && attestation.checks.every(c => c.evidenceDigest === attestation.evidenceDigest), "attestation scientific checks absent/mismatched");
    uniqueStrings(attestation.checks.map(c => c.id), "duplicate attestation scientific check");
  }
  check(!validation.validation.parentValidated || attestation !== null, "parentValidated without attestation");
  check(materialization.validation !== "parent-validated" || attestation !== null, "parent materialization without attestation");
  check(finalCommit.publicationLevel !== 2 || attestation !== null, "level2 publication without attestation");
  check(binding.materialization !== "parent-derived" || (attestation !== null && attestation.validatedFactIds.includes(materialization.resultId)
    && materialization.validation === "parent-validated" && finalCommit.publicationLevel === 2),
    "parent-derived materialization lacks attested fact identity");
}
/** Internal shape/content binding of the retained historical plan. There is no
 * historical full-graph input here: do not fabricate one to invoke a validator
 * that would appear to certify its scientific derivation or admission state. */
function validateHistoricalPlanning(value: unknown): void {
  const planning = fields(value, { plan: x => validateGraphDocument("mission-plan", x),
    units: x => list(x, y => validateGraphDocument("work-unit", y)), diagnostics: x => list(x, validateRetainedDiagnostic),
    binding: x => { fields(x, { schemaVersion: y => one(y, [1]), planFingerprint: sha, sidecarFingerprint: sha, fingerprint: sha }); },
    sidecar: x => { fields(x, { schemaVersion: y => one(y, [1]), policyVersion: text, estimationVersion: text, planId: text,
      planFingerprint: sha, snapshotFingerprint: sha, knowledgeRevision: count,
      policy: y => validatePlannerPolicy(y, true, true), relationView: y => {
        fields(y, { version: z => one(z, ["planner-relations-v1"]), relations: z => list(z, relation => {
          fields(relation, { relationId: text, sourceId: text, destinationId: text, kind: text, sourceEdgeIds: texts,
            sites: a => list(a, site => validateRetainedSite(site)), observations: a => list(a, observation => {
              fields(observation, { metadata: metadata => { object(metadata, [], ["status", "confidence", "direction", "schemaVersion", "appearedInRevision", "retiredInRevision", "schedulerRelevance"]); },
                sourceEdgeIds: texts, sites: b => list(b, validateRetainedSite), sitesBySourceEdgeId: b => dictionary(b, c => list(c, validateRetainedSite)) });
            }) });
        }) });
      }, requirementById: y => dictionary(y, z => { fields(z, { artifactId: text, artifactSha256: sha, functionId: text, moduleSha256: sha,
        artifactKind: text, minimumRevision: count, maximumRevision: count, publicationLevel: a => one(a, [1, 2]), validation: a => one(a, ["fixture-only", "parent-validated"]) }); }),
      dispensationById: y => dictionary(y, z => { fields(z, { reason: text, policyVersion: text, source: text, sourceHash: text,
        validation: a => one(a, ["fixture-only", "parent-validated"]), knowledgeRevision: count }); }),
      externalReceiptById: y => dictionary(y, z => { fields(z, { artifactId: text, artifactSha256: sha, functionId: text, moduleSha256: sha, artifactKind: text,
        publicationLevel: a => one(a, [1, 2]), validation: a => one(a, ["fixture-only", "parent-validated"]), knowledgeRevision: count,
        producerUnitId: nullable(text), commitId: sha, readbackStatus: a => one(a, ["verified", "pending", "mismatch"]),
        futurePrerequisiteEffect: a => one(a, ["satisfies", "does_not_satisfy", "invalidates_future"]) }); }),
      localOrders: y => dictionary(y, z => { fields(z, { sccIds: texts, functionIds: texts, recursive: bool, maxIterations: count, publication: a => one(a, ["whole-unit-only"]) }); }),
      estimatesByUnit: y => dictionary(y, z => { fields(z, { version: text, cost: unknownInteger, modelCosts: a => dictionary(a, count) }); }),
      resourcesByUnit: y => dictionary(y, z => { fields(z, { profiles: texts, models: texts, tools: texts, accounts: texts, slots: a => count(a, 1), cpu: count, gpu: count, budget: count }); }),
      envelopeBytesByUnit: y => dictionary(y, count), unitFingerprints: y => dictionary(y, sha),
      diagnostics: y => list(y, validateRetainedDiagnostic), fingerprint: sha
    }, { admissionBudget: y => {
      fields(y, { version: z => one(z, ["planner-admission-accounting-v1"]), context: z => { validateContext(z); }, allocationFingerprint: nullable(sha),
        byUnit: z => dictionary(z, a => { fields(a, { structuralEnvelopeUtf8Bytes: count, admissionCapUtf8Bytes: unknownInteger, maxNewExecutions: unknownInteger, totalAdmissionUtf8Bytes: unknownInteger }); }),
        selectedTotalAdmissionUtf8Bytes: count });
    } }); } });
  const p = planning as unknown as PlannerResult;
  for (const document of [p.plan, p.sidecar, p.binding]) {
    const { fingerprint: expected, ...content } = document;
    check(expected === fingerprint(content), "historical planning content fingerprint mismatch");
  }
  check(p.binding.planFingerprint === p.plan.fingerprint && p.binding.sidecarFingerprint === p.sidecar.fingerprint
    && p.sidecar.planFingerprint === p.plan.fingerprint && p.sidecar.planId === p.plan.planId
    && p.sidecar.policyVersion === p.plan.policyVersion && p.sidecar.estimationVersion === p.plan.estimationVersion
    && p.sidecar.knowledgeRevision === p.plan.knowledgeRevision && p.sidecar.policy.version === p.plan.policyVersion
    && p.sidecar.policy.estimationVersion === p.plan.estimationVersion && p.sidecar.policy.partitionId === p.plan.partitionId,
    "historical planning triple binding mismatch");
  uniqueStrings(p.units.map(unit => unit.unitId), "duplicate historical planning unit");
  check(p.plan.units.length === p.units.length && p.plan.units.every(entry => {
    const unit = p.units.find(unit => unit.unitId === entry.unitId);
    return unit !== undefined && canonical(unit.ownedFunctionIds) === canonical(entry.ownedFunctionIds)
      && canonical(unit.contextFunctionIds) === canonical(entry.contextFunctionIds)
      && unit.requiredPublicationLevel === entry.requiredPublicationLevel && unit.state === entry.state;
  }), "historical plan/unit projection mismatch");
  for (const unit of p.units) {
    const { state: _state, ...content } = unit;
    check(unit.snapshotId === p.plan.snapshotId && unit.partitionId === p.plan.partitionId && unit.knowledgeRevision === p.plan.knowledgeRevision
      && p.sidecar.unitFingerprints[unit.unitId] === fingerprint(content), "historical unit content/context mismatch");
    const order = p.sidecar.localOrders[unit.unitId]; check(order !== undefined, "historical local order missing");
    const estimate = derivePlannerUnitEstimate(unit.ownedFunctionIds, p.sidecar.policy, order.recursive).estimate;
    refsEqual(unit.estimatedCost, estimate.cost, "historical fixed unit cost mismatch");
    refsEqual(p.sidecar.estimatesByUnit[unit.unitId], estimate, "historical fixed estimate mismatch");
    refsEqual(p.sidecar.resourcesByUnit[unit.unitId], derivePlannerUnitResources(unit.ownedFunctionIds, p.sidecar.policy), "historical fixed resources mismatch");
  }
  refsEqual(p.plan.g3Affinities, derivePlannerG3(p.units), "historical fixed G3 mismatch");
  if (p.sidecar.admissionBudget) assertAdmissionBudgetBinding(p.plan, p.sidecar, p.sidecar.admissionBudget.context);
}
function validateRetainedDiagnostic(value: unknown): void {
  fields(value, { code: text, unitId: nullable(text), functionIds: texts, detail: x => text(x, true) });
}
function validateRetainedSite(value: unknown): void {
  fields(value, { siteRva: text, xrefType: x => one(x, ["code", "data"]), provenance: x => {
    fields(x, { moduleSha256: sha, siteRva: nullable(text), siteKind: y => one(y, ["instruction", "object", "import", "table", "extractor"]),
      xrefType: y => one(y, ["code", "data", "none"]), source: text, sourceVersion: text, sourceHash: sha, evidenceSha256: sha });
  } });
}
function validateHistoricalAdmission(value: unknown): HistoricalAdmissionDataV1 {
  fields(value, { version: x => one(x, ["l8-historical-admission-data-v1"]), missionId: text, unitId: text,
    executionId: text, subIntentId: text, familyToken: count, requestDigest: sha,
    command: x => { fields(x, { profile: text, model }); },
    receiptIdentity: x => { fields(x, { executionId: text, requestDigest: sha }, { nativeSessionId: text, authorId: text }); } });
  const admission = value as HistoricalAdmissionDataV1;
  check(admission.receiptIdentity.executionId === admission.executionId
    && admission.receiptIdentity.requestDigest === admission.requestDigest, "historical receipt execution/requestDigest mismatch");
  return admission;
}
function validateNumericSource(value: unknown): NumericGraphSourceV1 {
  fields(value, { version: x => one(x, ["l8-numeric-graph-source-v1"]), fullGraphSnapshotRef: validateByteRef,
    producerModuleRef: validateByteRef, producerPolicy: x => {
      fields(documentBytes(x, "l8-projection-policy-source-v1").value, { version: y => one(y, ["l8-projection-policy-source-v1"]),
        producer: y => one(y, ["projectStructural"]), fullGraphSnapshotRef: validateByteRef,
        numericPolicyVersion: y => one(y, ["scaled-binary64-exact-leiden-interval-ppr-v1"]), weights: y => {
          const weight = (z: unknown): void => { finite(z); check(z >= 0, "negative projection weight"); };
          fields(y, { version: text, direct: weight, tail: weight, indirectHigh: weight, indirectOther: weight, thunk: weight,
            dispatch: weight, rareData: weight, memoryWeak: weight, memoryWindow: weight,
            rareObjectMaxUsers: z => { count(z, 2); check(z <= 64, "rare object users exceeds qualified bound"); },
            importFactor: weight, utilityFactor: weight, hubThreshold: z => count(z, 1), hubFactor: weight });
        } });
    }, graph: x => { importSparseGraph(documentBytes(x, "sparse-graph-numeric-v1").value); }, hubIds: texts,
    summary: x => { fields(x, { version: y => one(y, ["scaled-binary64-exact-leiden-interval-ppr-v1"]),
      weightConvention: y => one(y, ["source-summands-v1", "canonical-arcs-v1"]), canonicalArcCount: count,
      sourceArcCount: count, retainedSourceArcCount: count, sourceArcBudget: count, budgetVersion: y => one(y, ["numeric-source-arc-budget-v1"]) }); } });
  const source = value as NumericGraphSourceV1;
  const graph = importSparseGraph(documentBytes(source.graph).value); validateSparseGraph(graph);
  uniqueStrings(source.hubIds, "duplicate numeric hub");
  check(source.hubIds.every(id => graph.ids.includes(id)), "unknown numeric hub");
  refsEqual(source.summary, numericSummary(graph), "numeric source summary mismatch");
  return source;
}
function validatePublicContexts(value: unknown): PublicContextSourcesV1 {
  fields(value, { version: x => one(x, ["l8-public-context-sources-v1"]),
    partitionContext: x => { doc(x, "l8-numeric-graph-source-v1", validateNumericSource); },
    groupAdjacency: x => {
      check(x !== null && typeof x === "object", "group adjacency required");
      const kind = (x as RecordValue).kind;
      if (kind === "raw-active-control-relations") fields(x, { kind: y => one(y, [kind]) });
      else fields(x, { kind: y => one(y, ["provided-affinity"]), source: y => { doc(y, "l8-numeric-graph-source-v1", validateNumericSource); } });
    } });
  return value as PublicContextSourcesV1;
}
function bindPublicContexts(body: ExecutionPreparationBodyV1, snapshot: GraphSnapshotV1, transport: PreparedGraphTransportV3,
  grouping: DecodedGroupSourceV1): void {
  const sources = validatePublicContexts(body.contextSources);
  const bindNumeric = (document: BoundDocument<NumericGraphSourceV1>): { source: NumericGraphSourceV1; graph: SparseGraph } => {
    const source = doc(document, "l8-numeric-graph-source-v1", validateNumericSource);
    const policy = documentBytes(source.producerPolicy).value as ProjectionPolicySourceV1;
    refsEqual(source.fullGraphSnapshotRef, body.fullGraphSnapshot.ref, "numeric source full snapshot mismatch");
    refsEqual(policy.fullGraphSnapshotRef, body.fullGraphSnapshot.ref, "numeric policy full snapshot mismatch");
    refsEqual(source.producerModuleRef, body.contractPins.clusterTypesModule, "numeric producer module differs from selected qualified source");
    const graph = importSparseGraph(documentBytes(source.graph).value);
    check(graph.ids.length === snapshot.nodes.length && graph.ids.every(id => snapshot.nodes.some(n => n.id === id)), "numeric graph node set differs from full snapshot");
    return { source, graph };
  };
  const partition = bindNumeric(sources.partitionContext);
  const contexts = deriveCommunityContextIds(partition.graph, transport.partition.communities.map(c => c.memberIds));
  transport.partition.communities.forEach((community, i) => refsEqual(community.externalContextIds, contexts[i], "fixed community context differs from supplied numeric source"));
  const groupNumeric = sources.groupAdjacency.kind === "provided-affinity" ? bindNumeric(sources.groupAdjacency.source) : null;
  const adjacency = groupNumeric === null ? { kind: "raw-active-control-relations" as const }
    : { kind: "provided-affinity" as const, graph: groupNumeric.graph };
  const hubs = groupNumeric?.source.hubIds ?? partition.source.hubIds;
  refsEqual(grouping.groupingMetrics.hubIds, hubs, "group hub ranking differs from supplied numeric source");
  const prepared = prepareGroupContextSource(snapshot, transport.partition, grouping.groupingConfig, adjacency);
  const ownership = transport.groups.map(group => ({ groupId: group.groupId, ownedFunctionIds: [...group.ownedFunctionIds] }));
  const fixed = deriveFixedGroupContexts(bindGroupContext(prepared, hubs), ownership);
  for (const [key, value] of Object.entries(fixed.metrics))
    refsEqual(value, grouping.groupingMetrics[key as keyof GroupMetrics], `fixed group metric differs: ${key}`);
  for (const context of fixed.contexts) {
    const group = transport.groups.find(g => g.groupId === context.groupId)!;
    refsEqual(group.contextFunctionIds, context.contextFunctionIds, "fixed group contexts mismatch");
    refsEqual(grouping.contextOmissions.byGroup.find(g => g.groupId === group.groupId)?.functionIds, context.omittedContextIds, "fixed group omitted context mismatch");
  }
}

function validateContext(v: unknown): AdmissionBudgetContextV1 {
  fields(v, { version: x => one(x, ["planner-admission-context-v1"]), missionId: text, snapshotId: text, snapshotFingerprint: sha, partitionId: text,
    knowledgeRevision: count, missionConfigFingerprint: sha, executionSpecFingerprint: sha, inputManifestFingerprint: sha,
    admissionCodecVersion: x => one(x, ["l8-fixture-admission-codec-v2"]), cycle: x => count(x, 1), budgetEpoch: x => count(x, 1) });
  return v as AdmissionBudgetContextV1;
}
function unknownInteger(v: unknown): void {
  const r = fields(v, { known: bool, value: nullable(count) }); check(r.known === (r.value !== null), "known/value mismatch");
}
function validateAllocation(v: unknown): AdmissionBudgetInputV1 | null {
  if (v === null) return null;
  fields(v, { version: x => one(x, ["complete-admission-cap-v1"]), scope: x => one(x, ["one-immutable-run"]), executionProfile: x => one(x, ["one-execution-per-subintent-v1"]),
    context: x => { validateContext(x); }, capsByFunction: x => dictionary(x, y => { fields(y, { completeBodyMaxUtf8Bytes: unknownInteger,
      maxNewExecutionsPerRole: z => { fields(z, { A: a => one(a, [1]), B: a => one(a, [1]), R: a => one(a, [1]) }); } }); }), fingerprint: sha });
  const a = v as AdmissionBudgetInputV1, { fingerprint: _ignored, ...body } = a;
  check(a.fingerprint === fingerprint(body), "upstream allocation fingerprint mismatch"); return a;
}
function validateExecutionSource(v: unknown): GraphExecutionSource {
  fields(v, { version: x => one(x, ["l8-execution-source-v1"]), templateFingerprint: sha,
    models: x => { fields(x, Object.fromEntries(roles.map(r => [r, model]))); }, binary, outputDirectory: text,
    rePolicy: nullable(x => { validateREPolicy(x); }) }); return v as GraphExecutionSource;
}
function validateRootLimits(v: unknown): RootLimitsV1 {
  fields(v, { allocation: x => { validateAllocation(documentBytes(x, "l8-admission-allocation-source-v1").value); }, contextEnvelopeMaxUtf8Bytes: count, totalContextBudgetUtf8Bytes: count,
    maxSelectedUnits: count, executionTemplate: x => { validateExecutionTemplate(documentBytes(x, "l8-execution-template-v1").value); },
    rootSlotGrants: nullable(x => { doc(x, "l8-root-slot-grants-v1", validateRootSlotGrants); }),
    rootModelBindings: nullable(x => { doc(x, "l8-root-model-bindings-v1", validateRootModelBindings); }) });
  return v as RootLimitsV1;
}
function uniqueStrings(values: string[], reason: string): void {
  check(values.length === new Set(values).size, reason);
}
function validateRootSlotGrants(v: unknown): RootSlotGrantsV1 {
  fields(v, { version: x => one(x, ["l8-root-slot-grants-v1"]), missionId: text, lineageId: text, rootAccountId: sha,
    rootAllocationRef: validateByteRef, sourceSnapshotRef: validateByteRef, sourcePlanningRef: validateByteRef, sourcePolicyRef: validateByteRef,
    grants: x => list(x, y => {
      fields(y, { slot: z => { fields(z, { rootAccountId: sha, functionIdentity: identity, role: a => one(a, ["A", "B", "R"]), pass: a => one(a, [1]) }); },
        functionId: text, bodyCapUtf8Bytes: z => count(z, 1), reservedDebitUtf8Bytes: z => count(z, 1) });
    }) });
  const grants = v as RootSlotGrantsV1;
  uniqueStrings(grants.grants.map(g => canonicalExecutionJsonV1(g.slot)), "duplicate acquired root slot");
  let total = 0;
  for (const grant of grants.grants) {
    check(grant.slot.rootAccountId === grants.rootAccountId && grant.bodyCapUtf8Bytes === grant.reservedDebitUtf8Bytes, "root slot account/cap/debit mismatch");
    total += grant.reservedDebitUtf8Bytes; count(total);
  }
  return grants;
}
function validateRootModelBindings(v: unknown): RootModelBindingsV1 {
  fields(v, { version: x => one(x, ["l8-root-model-bindings-v1"]), missionId: text, lineageId: text, rootAccountId: sha,
    sourceExecutionTemplateRef: validateByteRef, sourceExecutionSpecRef: validateByteRef,
    bindings: x => list(x, y => { fields(y, { label: text, model }); }),
    roleLabels: x => { fields(x, Object.fromEntries(roles.map(r => [r, text]))); } });
  const bindings = v as RootModelBindingsV1;
  uniqueStrings(bindings.bindings.map(b => b.label), "duplicate model label");
  for (const role of roles) check(bindings.bindings.some(b => b.label === bindings.roleLabels[role]), "unresolved role model label");
  return bindings;
}
function validateBootstrap(v: unknown): RootBootstrapSourcesV1 {
  fields(v, { snapshot: x => { doc(x, "graph-snapshot-v1", assertSnapshotContract); },
    missionSnapshot: x => { doc(x, "l8-source-mission-snapshot-v1", validateMissionSnapshot); },
    planning: x => { validateHistoricalPlanning(documentBytes(x, "l8-planning-source-v1").value); },
    planningPolicy: x => { validatePlannerPolicy(documentBytes(x, "l8-planning-policy-source-v1").value, true, true); },
    executionTemplate: x => { validateExecutionTemplate(documentBytes(x, "l8-execution-template-v1").value); },
    executionSourceSpec: x => { doc(x, "l8-execution-source-v1", validateExecutionSource); } });
  const sources = v as RootBootstrapSourcesV1;
  const snapshot = documentBytes(sources.snapshot).value as GraphSnapshotV1;
  const planning = documentBytes(sources.planning).value as PlannerResult;
  const admission = planning.sidecar.admissionBudget;
  validatePlanningBindingV1(planning, snapshot, { partitionId: planning.plan.partitionId }, admission ? {
    context: admission.context, allocation: planning.sidecar.policy.admissionBudget ?? null,
  } : undefined);
  return sources;
}
function bindRootModelsAndCapacity(body: ExecutionPreparationBodyV1, root: RootLimitsV1,
  current: GraphExecutionTemplate, source: GraphExecutionSource, rootTemplate: GraphExecutionTemplate): void {
  check(root.rootModelBindings !== null && root.rootSlotGrants !== null && body.rootBootstrapSources !== null, "root grants/models/bootstrap independently unknown");
  const models = doc(root.rootModelBindings, "l8-root-model-bindings-v1", validateRootModelBindings);
  const grants = doc(root.rootSlotGrants, "l8-root-slot-grants-v1", validateRootSlotGrants);
  const bootstrap = validateBootstrap(body.rootBootstrapSources);
  for (const value of [models, grants]) check(value.missionId === body.missionId && value.lineageId === body.generation.lineageId
    && value.rootAccountId === body.admissionSource.budgetLineage.rootAccountId, "root source mission/lineage/account mismatch");
  refsEqual(models.sourceExecutionTemplateRef, bootstrap.executionTemplate.ref, "root model template ref mismatch");
  refsEqual(models.sourceExecutionSpecRef, bootstrap.executionSourceSpec.ref, "root model spec ref mismatch");
  sameDocument(root.executionTemplate, bootstrap.executionTemplate, "root bootstrap template mismatch");
  refsEqual(grants.rootAllocationRef, root.allocation.ref, "root grant allocation ref mismatch");
  refsEqual(grants.sourceSnapshotRef, bootstrap.snapshot.ref, "root grant snapshot ref mismatch");
  refsEqual(grants.sourcePlanningRef, bootstrap.planning.ref, "root grant planning ref mismatch");
  refsEqual(grants.sourcePolicyRef, bootstrap.planningPolicy.ref, "root grant policy ref mismatch");
  const rootPlanning = documentBytes(bootstrap.planning).value as PlannerResult;
  refsEqual(rootPlanning.sidecar.policy, documentBytes(bootstrap.planningPolicy).value, "bootstrap planning policy mismatch");
  const rootSnapshot = doc(bootstrap.snapshot, "graph-snapshot-v1", assertSnapshotContract);
  const rootMission = doc(bootstrap.missionSnapshot, "l8-source-mission-snapshot-v1", validateMissionSnapshot);
  const rootSpec = doc(bootstrap.executionSourceSpec, "l8-execution-source-v1", validateExecutionSource);
  check(rootSnapshot.missionId === body.missionId && rootMission.missionId === body.missionId && rootPlanning.plan.missionId === body.missionId
    && rootPlanning.plan.snapshotId === rootSnapshot.snapshotId && rootPlanning.plan.knowledgeRevision === rootSnapshot.knowledgeRevision
    && rootPlanning.sidecar.snapshotFingerprint === rootSnapshot.normalizedFingerprint && rootSpec.templateFingerprint === fingerprint(rootTemplate),
    "bootstrap mission/snapshot/planning/template mismatch");
  refsEqual(rootSpec.models, rootMission.config.models, "bootstrap models/config mismatch");
  refsEqual(rootSpec.binary, rootMission.config.binary, "bootstrap binary/config mismatch");
  refsEqual(rootPlanning.sidecar.policy.admissionBudget ?? null, documentBytes(root.allocation).value, "bootstrap policy/root allocation mismatch");
  const currentMission = doc(body.sourceMissionSnapshot, "l8-source-mission-snapshot-v1", validateMissionSnapshot);
  refsEqual(currentMission.config.retryPolicy, rootMission.config.retryPolicy, "candidate changes initial root retry policy");
  const { maxConcurrent: _rootConcurrent, ...initialSettings } = rootTemplate.settings;
  const { maxConcurrent: _currentConcurrent, ...currentSettings } = current.settings;
  refsEqual(currentSettings, initialSettings, "candidate changes initial root profiles/lease/retry settings");
  const labels = new Set(models.bindings.map(binding => binding.label));
  for (const policy of [rootPlanning.sidecar.policy, documentBytes(body.planningPolicy).value as PlannerPolicy]) {
    for (const resources of Object.values(policy.resourcesByFunction)) for (const label of resources.models)
      check(labels.has(label), "policy resource model label unresolved");
    for (const estimate of Object.values(policy.estimatesByFunction)) for (const label of Object.keys(estimate.byModel ?? {}))
      check(labels.has(label), "policy estimate model label unresolved");
  }
  for (const role of roles) {
    const binding = models.bindings.find(b => b.label === models.roleLabels[role]);
    check(binding !== undefined, "unresolved root model label");
    refsEqual(binding.model, source.models[role], "role label/source model mismatch");
  }
  uniqueStrings(current.workers.map(w => w.workerId), "duplicate current worker ID");
  uniqueStrings(rootTemplate.workers.map(w => w.workerId), "duplicate root worker ID");
  uniqueStrings(current.accounts.map(a => a.accountId), "duplicate current account ID");
  uniqueStrings(rootTemplate.accounts.map(a => a.accountId), "duplicate root account ID");
  for (const worker of current.workers) {
    const original = rootTemplate.workers.find(w => w.workerId === worker.workerId);
    check(original !== undefined && worker.profile === original.profile && worker.model === original.model && worker.accountId === original.accountId,
      "worker changes root identity/profile/model/account");
    check(models.bindings.some(b => b.label === worker.model), "worker model label unresolved");
    check(worker.tools.every(t => original.tools.includes(t)), "worker introduces tool outside root");
    for (const dimension of ["slots", "cpu", "gpu", "budget"] as const)
      check(worker[dimension] <= original[dimension], `worker raises root ${dimension}`);
    check(current.accounts.some(a => a.accountId === worker.accountId), "worker account missing");
  }
  for (const account of current.accounts) {
    const original = rootTemplate.accounts.find(a => a.accountId === account.accountId);
    check(original !== undefined, "account outside root");
    for (const dimension of ["slots", "budget"] as const)
      check(account[dimension] <= original[dimension], `account raises root ${dimension}`);
  }
  const snapshot = doc(bootstrap.snapshot, "graph-snapshot-v1", assertSnapshotContract);
  for (const grant of grants.grants) {
    const node = snapshot.nodes.find(n => n.id === grant.functionId);
    check(node !== undefined, "root grant function absent from bootstrap graph");
    check(node.moduleSha256 === grant.slot.functionIdentity.sha256 && node.ea === grant.slot.functionIdentity.ea,
      "root grant function identity mismatch");
    check(snapshot.binaryArtifacts.some(a => a.contentSha256 === grant.slot.functionIdentity.sha256
      && a.versionLabel === grant.slot.functionIdentity.version), "root grant binary version mismatch");
  }
}
function validateAdmissionSourceV2(v: unknown, snapshot: GraphSnapshotV1): AdmissionSourceV2 {
  fields(v, { version: x => one(x, ["l8-admission-source-v2"]), admissionCodecVersion: x => one(x, ["l8-fixture-admission-codec-v2"]), cycle: x => count(x, 1), budgetEpoch: x => count(x, 1),
    executionTemplate: x => { validateExecutionTemplate(documentBytes(x, "l8-execution-template-v1").value); }, executionSourceSpec: x => { validateExecutionSource(documentBytes(x, "l8-execution-source-v1").value); },
    inputManifestSource: x => { fields(x, { document: y => { validateInputSource(documentBytes(y, "l8-input-source-v1").value, snapshot); }, files: y => list(y, artifactBytes) }); },
    context: x => { validateContext(x); }, allocation: x => { validateAllocation(x); },
    sourceFingerprints: x => { fields(x, { executionTemplate: sha, executionSourceSpec: sha, inputManifest: sha, context: sha, allocation: nullable(sha) }); },
    knowledgeSource: x => { validateKnowledgeSource(documentBytes(x, "l8-knowledge-source-v1").value); }, approvalSource: x => { validateApprovalSource(documentBytes(x, "l8-approval-source-v1").value); },
    budgetLineage: x => { fields(x, { version: y => one(y, ["l8-budget-lineage-v1"]), rootAccountId: sha, rootAllocationRef: validateByteRef, rootLimits: y => { validateRootLimits(documentBytes(y, "l8-root-limits-v1").value); }, epoch: y => count(y, 1) }); }
  }); return v as AdmissionSourceV2;
}

export const EXECUTION_DOCUMENT_KINDS_V1 = Object.freeze({
  envelope: ENVELOPE_KIND, run: RUN_KIND, preparedTransport: "l8-prepared-graph-v3", adoption: "l8-partition-adoption-v1",
  fullGraphSnapshot: "graph-snapshot-v1", sourceMissionSnapshot: "l8-source-mission-snapshot-v1", planning: "l8-planning-source-v1",
  executionTemplate: "l8-execution-template-v1", executionSourceSpec: "l8-execution-source-v1", inputManifest: "l8-input-source-v1",
  knowledge: "l8-knowledge-source-v1", approvals: "l8-approval-source-v1", rootLimits: "l8-root-limits-v1",
  groupingConfig: "l8-grouping-config-source-v1", groupingMetrics: "group-metrics-v1", communityBinding: "l8-community-binding-v1",
  fullContextByGroup: "l8-full-context-by-group-v1", contextOmissions: "l8-context-omissions-v1",
  planningPolicy: "l8-planning-policy-source-v1", rootAllocation: "l8-admission-allocation-source-v1", rootSlotGrants: "l8-root-slot-grants-v1",
  rootModelBindings: "l8-root-model-bindings-v1", storedResult: "l8-stored-result-data-v1", artifactBinding: "l8-artifact-binding-v1",
  knowledgeCommit: "knowledge-commit-v1", historicalAdmission: "l8-historical-admission-data-v1"
});
function doc<T>(value: unknown, kind: string, validate: (v: unknown) => T): T { return validate(documentBytes(value, kind).value); }
function refsEqual(a: unknown, b: unknown, reason: string): void { check(canonical(a) === canonical(b), reason); }
function sameDocument(a: unknown, b: unknown, reason: string): void {
  const x = documentBytes(a), y = documentBytes(b); refsEqual(x.document.ref, y.document.ref, reason); check(x.document.utf8 === y.document.utf8, reason);
}
const UPSTREAM_PINS: Partial<Record<keyof ContractPinsV1, { byteLength: number; sha256: string }>> = {
  fullSnapshotSchema: { byteLength: 47133, sha256: "e62f78b47b610e40a701203d4750025161d8ccb787224e650d1fe5b18d7c8bea" },
  fullSnapshotModule: { byteLength: 36515, sha256: "2da7c8778833097b43f23be3e878b352b7d71fc89d3b9daf0aa5478aad96ef6f" },
  proposalCodec: { byteLength: 22680, sha256: "0b81fc928053f8fd602196bbf25500a53373d85a32dd450fa4bcce5643f6e40a" },
  plannerCodec: { byteLength: 48999, sha256: "68c486ed6c5461ba6008d2b942555eb2c18f54b2cdbb51da65221ecfe27848a3" },
  inputCodec: { byteLength: 46607, sha256: "7e618cf57373a79ac5b7aad384ef80f020876fa69a4c4d96dae394533481d5cf" },
  admissionCodec: { byteLength: 46607, sha256: "7e618cf57373a79ac5b7aad384ef80f020876fa69a4c4d96dae394533481d5cf" },
  preparedTransportSchema: { byteLength: 104742, sha256: "fd4cdd41fa6b60ac39f8d40134fb5d593e37b172c04ec2750190f2e6f2fc47b9" },
  adoptionTransportSchema: { byteLength: 12396, sha256: "c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e" }
  ,domainModule: { byteLength: 15444, sha256: "3f49fa05a228549ed626b4f269818385fd23f32d7cc600eda84a1cd9cb42dbe7" }
  ,validationModule: { byteLength: 22511, sha256: "9f15f63c8c5b7ca39a3729be59b866f68f7ff6dc1f15655b0cb569d1498acb50" }
  ,plannerDerivedCodec: { byteLength: 19899, sha256: "27cc82acb9808ba6aca7307109f7ee0c9158d417df0c08bc4d79444cf9d3dd4c" }
  ,functionOrderCodec: { byteLength: 571, sha256: "8c87b7094d8bc280836fc609699af2d0b2045e59509a4a23f1fab1eaaa809415" }
  ,plannerRelationCodec: { byteLength: 8164, sha256: "afe9d66d3db8c457385f83fbe306075a935349ef49e993210e8b6aad7794bd50" }
  ,sparseGraphCodec: { byteLength: 16517, sha256: "4ca2bed30e2609d87ef499a0b1ad5c0f2d687565161059ae7e6049db25b0f718" }
  ,groupContextCodec: { byteLength: 18955, sha256: "37ef5a09f4d4e6b8172b3962e30cf1442566cef4607295ef493fe4cce6774986" }
  ,lineagePureCodec: { byteLength: 29225, sha256: "48880953cbd4a3cdb0becf9d360dd964fcbedf30f72b379cdff72665cf3f5bbf" }
  ,graphPersistenceErrorsCodec: { byteLength: 469, sha256: "5c61d9416b2b52debb2422134c19e857a3f5cf32b25d8c5189f7a5da6adeef70" }
  ,rePolicyCodec: { byteLength: 12912, sha256: "c3714c3120d3e8f87a044ef6857ca40c41900a6c74647d1bfdc6205371dfc365" }
  ,transportCodec: { byteLength: 22680, sha256: "0b81fc928053f8fd602196bbf25500a53373d85a32dd450fa4bcce5643f6e40a" }
  ,clusterTypesModule: { byteLength: 51921, sha256: "09c2035a16c1d4a1bfe03fc00807920d0af5202b290b0a68d7172a33319a3542" }
  ,groupTypesModule: { byteLength: 10684, sha256: "162c979a5c65a6c08625f255d33aba7cb16ba3bb85ddfc7937925b95073d3b1a" }
  ,clusterPartitionSchema: { byteLength: 6730, sha256: "199d505c44e0551d96ec9fafb9510571f056c13017a5d61bb5d114c2cbc4ee1b" }
  ,workUnitSchema: { byteLength: 10218, sha256: "3762f0507c081520b042e0b8ad28e777c214aebc6ec39a2e6011992259d796e5" }
  ,knowledgeCommitSchema: { byteLength: 4527, sha256: "1298b80fbc62553375c20517f58a5a07fb198e4ab946c9e1feac9a0318753761" }
  ,missionPlanSchema: { byteLength: 15810, sha256: "916ce329c1d7a67c3b5eb4affc015e7e4e02abe1ff2bd0acfa431a053e6f097d" }
  ,investigationGroupSchema: { byteLength: 4172, sha256: "732ca008ddf8e55f807bf0a1e19b77d2245048bfc5d8bf57155cea95598c6ffb" }
};
function pins(v: unknown): asserts v is ContractPinsV1 {
  const r = fields(v, Object.fromEntries(PIN_KEYS.map(k => [k, validateByteRef])));
  for (const key of PIN_KEYS) {
    const pin = r[key] as ByteRef;
    const schema = key.endsWith("Schema");
    check(pin.kind === (schema ? "json-schema-source-v1" : "typescript-source-v1")
      && pin.encoding === (schema ? "utf8-json-v1" : "raw-v1"), `codec/schema pin domain mismatch: ${key}`);
  }
  for (const key of PIN_KEYS) { const expected = UPSTREAM_PINS[key]; if (expected) {
    const actual = r[key] as ByteRef;
    check(actual.byteLength === expected.byteLength && actual.sha256 === expected.sha256, `unsupported qualified upstream pin ${key}`);
  } }
}
function slotObservations(v: unknown): void {
  list(v, x => { fields(x, { slotKey: text, amount: count }); });
  check(new Set(v.map(x => (x as { slotKey: string }).slotKey)).size === v.length, "duplicate observed execution slot");
}
function observation(v: unknown): void {
  fields(v, { observedEventSequence: count, parentGenerationId: nullable(text), headRevision: count, activePlanRevision: nullable(count), sourceMissionRevision: count,
    controllerFence: count, knowledgeRevision: count, knowledgeRootHash: sha, knowledgeLedgerRevision: count, knowledgeLedgerDigest: sha,
    budgetLedgerRevision: count, budgetLedgerDigest: sha, spentBySlot: nullable(slotObservations), encumberedBySlot: nullable(slotObservations),
    inventoryRevision: nullable(count), inventoryDigest: nullable(sha), partitionStoreDigest: sha,
    authorityRecordRefs: nullable(x => list(x, validateByteRef)), proofRecordRefs: nullable(x => list(x, validateByteRef)),
    rootLimitsRef: nullable(validateByteRef), rootSlotGrantsRef: nullable(validateByteRef), rootModelBindingsRef: nullable(validateByteRef) });
}
function decodeGrouping(v: unknown): DecodedGroupSourceV1 {
  const r = fields(v, { groupsRef: validateValueRef, groupingConfig: x => { documentBytes(x, EXECUTION_DOCUMENT_KINDS_V1.groupingConfig); },
    groupingMetrics: x => { documentBytes(x, EXECUTION_DOCUMENT_KINDS_V1.groupingMetrics); }, communityBinding: x => { documentBytes(x, EXECUTION_DOCUMENT_KINDS_V1.communityBinding); },
    fullContextByGroup: x => { documentBytes(x, EXECUTION_DOCUMENT_KINDS_V1.fullContextByGroup); }, contextOmissions: x => { documentBytes(x, EXECUTION_DOCUMENT_KINDS_V1.contextOmissions); } });
  // The dedicated projection checks these complete decoded contracts against the full snapshot.
  return { groupingConfig: documentBytes(r.groupingConfig).value, groupingMetrics: documentBytes(r.groupingMetrics).value,
    communityBinding: documentBytes(r.communityBinding).value, fullContextByGroup: documentBytes(r.fullContextByGroup).value,
    contextOmissions: documentBytes(r.contextOmissions).value } as DecodedGroupSourceV1;
}
function rawBody(v: unknown, hasPlanning: boolean): RecordValue {
  const required = ["version", "mode", "missionId", "generation", "authorizationKind", "contractPins", "preparedTransport", "adoptionIntent", "sourceRefs", "fullGraphSnapshot", "sourceMissionSnapshot", "groupSource", "admissionSource", "activationPolicy", "preparationObservationT0", "rootBootstrapSources", "planningPolicy", "contextSources", ...(hasPlanning ? ["planning"] : [])];
  const r = object(v, required); one(r.version, [ENVELOPE_KIND]); one(r.mode, ["offline-fixture-v1"]); text(r.missionId);
  fields(r.generation, { lineageId: text, ordinal: count, parentGenerationId: nullable(text) });
  one(r.authorizationKind, ["bootstrap-a-fixture-v1", "transition-a-fixture-v1", "proposal-b-host-fixture-v1"]); pins(r.contractPins);
  const decoded = decodePreparedGraphV3(documentBytes(r.preparedTransport, EXECUTION_DOCUMENT_KINDS_V1.preparedTransport).value);
  check(decoded.ok, decoded.ok ? "" : decoded.errors.join("; "));
  const snapshot = doc(r.fullGraphSnapshot, EXECUTION_DOCUMENT_KINDS_V1.fullGraphSnapshot, assertSnapshotContract);
  doc(r.sourceMissionSnapshot, EXECUTION_DOCUMENT_KINDS_V1.sourceMissionSnapshot, validateMissionSnapshot);
  const s = fields(r.sourceRefs, { partitionRef: validateValueRef, groupsRef: validateValueRef, proposalEvidenceRef: nullable(validateValueRef), lineageRef: nullable(validateValueRef), partitionStoreDigest: sha });
  if (r.authorizationKind !== "proposal-b-host-fixture-v1") check(r.adoptionIntent === null && s.proposalEvidenceRef === null && s.lineageRef === null, "A origin has no B lineage/evidence/adoption");
  else check(s.proposalEvidenceRef !== null && s.lineageRef !== null, "B origin needs complete evidence/lineage refs");
  if (r.adoptionIntent !== null) {
    const intent = fields(r.adoptionIntent, { kind: x => one(x, ["pre-drain-non-authorizing-v1"]), document: x => { documentBytes(x, EXECUTION_DOCUMENT_KINDS_V1.adoption); } });
    const d = decodePartitionAdoptionV1(documentBytes(intent.document).value); check(d.ok, d.ok ? "" : d.errors.join("; "));
  }
  decodeGrouping(r.groupSource); validateAdmissionSourceV2(r.admissionSource, snapshot);
  if (r.rootBootstrapSources !== null) validateBootstrap(r.rootBootstrapSources);
  validatePlannerPolicy(documentBytes(r.planningPolicy, "l8-planning-policy-source-v1").value, true, true);
  validatePublicContexts(r.contextSources);
  fields(r.activationPolicy, { sourcePolicyRef: validateByteRef, maxActivationAttempts: x => count(x, 1), maxCandidateReplacements: count }); observation(r.preparationObservationT0);
  if (hasPlanning) {
    const planning = documentBytes(r.planning, EXECUTION_DOCUMENT_KINDS_V1.planning).value;
    const p = object(planning, ["plan", "units", "sidecar", "diagnostics", "binding"]);
    validateGraphDocument("mission-plan", p.plan); list(p.units, x => validateGraphDocument("work-unit", x));
    const admission = r.admissionSource as AdmissionSourceV2;
    const projection = projectExecutionSourcesForL5V1(snapshot, decoded.value, decodeGrouping(r.groupSource), (p.sidecar as RecordValue).policy, admission.context);
    check(projection.ok, projection.ok ? "" : projection.reasons.join("; "));
    // Real B/v2 has been validated above; no A-shaped partition/source is synthesized.
    validatePlanningBindingV1(planning, snapshot, { partitionId: decoded.value.partition.partitionId }, { context: admission.context, allocation: admission.allocation });
  }
  return r;
}
function validateEnvelope(v: unknown): ExecutionEnvelopeV1 {
  assertExecutionJsonV1(v);
  // The caps dictionary has a standard additionalProperties rule; validateAllocation
  // checks every entry explicitly because the upstream shape subset does not traverse that rule.
  check(validateStaticJsonSchema(v, envelopeSchema as unknown as StaticJsonSchema).length === 0, "execution envelope schema");
  const r = object(v, ["version", "mode", "missionId", "generation", "authorizationKind", "contractPins", "preparedTransport", "adoptionIntent", "sourceRefs", "fullGraphSnapshot", "sourceMissionSnapshot", "groupSource", "planning", "admissionSource", "activationPolicy", "preparationObservationT0", "rootBootstrapSources", "planningPolicy", "contextSources", "fingerprint"]);
  sha(r.fingerprint); const { fingerprint: expected, ...body } = r; rawBody(body, true);
  check(expected === executionValueRefV1(ENVELOPE_KIND, body).sha256, "envelope fingerprint mismatch"); return r as unknown as ExecutionEnvelopeV1;
}
function parsedEnvelope(document: BoundDocument<unknown>): ParsedExecutionEnvelopeV1 {
  const decoded = documentBytes(document, ENVELOPE_KIND), envelope = validateEnvelope(decoded.value);
  return freeze({ document: decoded.document as BoundDocument<ExecutionEnvelopeV1>, envelope, generationId: `l8gen:${envelope.fingerprint}` });
}
export function parseExecutionEnvelopeV1(bytes: Uint8Array): CodecResult<ReadonlyData<ParsedExecutionEnvelopeV1>> {
  return attempt(() => {
    check(!utilTypes.isProxy(bytes) && utilTypes.isUint8Array(bytes), "envelope UTF-8 bytes required"); const owned = new Uint8Array(bytes);
    return parsedEnvelope({ ref: ref(ENVELOPE_KIND, owned, "utf8-json-v1"), utf8: utf8(owned) });
  });
}
export function exportExecutionEnvelopeV1(origin: ReadonlyData<ParsedExecutionEnvelopeV1>): CodecResult<Uint8Array> {
  return attempt(() => { assertExecutionJsonV1(origin); const checked = parsedEnvelope(origin.document);
    refsEqual(origin.envelope, checked.envelope, "origin/envelope substitution"); check(origin.generationId === checked.generationId, "origin generation ID mismatch");
    return new TextEncoder().encode(checked.document.utf8);
  });
}

function bindInputBytes(input: GraphInputSource, complete: CompleteInputSourceV1, k: KnowledgeSourceV1, approvals: ApprovalSourceV1): void {
  const manifests = [...input.commonInputs, ...Object.values(input.inputsByFunction).flat(), ...input.cycleKnowledge.files];
  const files = [...complete.files, ...k.files];
  for (const f of manifests) {
    check(files.some(b => canonical(b.file) === canonical(f)), "input manifest entry has no exact bound content");
    if (f.approvedForBlind === true) {
      check(f.identity, "blind input requires explicit function-scoped approval identity");
      const approving = approvals.records.filter(a => a.filePath === f.path && a.fileSha256 === f.sha256 && a.knowledgeRevision === k.knowledgeRevision
        && canonical(a.functionIdentity) === canonical(f.identity));
      check(approving.some(a => a.decision === "approved" && a.allowedRoles.includes("A") && a.allowedRoles.includes("B"))
        && !approving.some(a => a.decision !== "approved"), "blind projection without unambiguous explicit A/B approval record");
      for (const a of approving) for (const id of a.sourceResultIds) check(k.facts.some(fact => fact.resultId === id && fact.file.sha256 === f.sha256 && fact.materialization === "verified"), "approval source result/file mismatch");
    }
  }
  const unique = new Map<string, ArtifactBytesV1>();
  for (const f of files) { const prior = unique.get(f.file.path); if (prior) refsEqual(prior, f, "same input path has contradictory content/provenance"); else unique.set(f.file.path, f); }
}
function bindActivationPolicySourceV1(body: ExecutionPreparationBodyV1, independentInput: CompleteInputSourceV1,
  inputSource: GraphInputSource, missionSnapshot: ExecutionMissionSnapshotV1): void {
  const kind = "l8-activation-policy-source-v1", policyRef = body.activationPolicy.sourcePolicyRef;
  check(policyRef.kind === kind && policyRef.encoding === "utf8-json-v1", "activation policy source requires its exact JSON kind/encoding");
  check(missionSnapshot.config.fixture === true, "activation policy common rule requires fixture source config");
  // These files have already been bound byte-exactly to the envelope's input files.
  // Resolve an actual independently supplied common rule, not an echo of envelope counts.
  const candidate = independentInput.files.find(entry => entry.file.kind === "rule"
    && !Object.hasOwn(entry.file, "identity") && entry.file.approvedForBlind === false
    && entry.file.sha256 === policyRef.sha256 && entry.bytes.ref.sha256 === policyRef.sha256
    && entry.bytes.ref.byteLength === policyRef.byteLength && entry.bytes.ref.encoding === "raw-v1"
    && inputSource.commonInputs.some(file => canonical(file) === canonical(entry.file))
    && missionSnapshot.config.commonInputs.some(file => canonical(file) === canonical(entry.file))
    && inputSource.accessibleRules.includes(entry.file.path) && missionSnapshot.config.accessibleRules.includes(entry.file.path));
  check(candidate, "activation policy ref has no exact independent common rule bytes with explicit non-blind scope");
  const blob = validateBoundBytes(candidate.bytes), bytes = Buffer.from(blob.base64, "base64");
  // Typed refs deliberately differ in kind/encoding; their raw length/SHA bind the same bytes.
  const value = documentBytes({ ref: policyRef, utf8: utf8(bytes) }, kind).value;
  const policy = fields(value, { version: v => one(v, [kind]), missionId: text, lineageId: text,
    maxActivationAttempts: v => count(v, 1), maxCandidateReplacements: count });
  check(policy.missionId === body.missionId && policy.lineageId === body.generation.lineageId
    && policy.maxActivationAttempts === body.activationPolicy.maxActivationAttempts
    && policy.maxCandidateReplacements === body.activationPolicy.maxCandidateReplacements,
    "activation policy common rule mission/lineage/root ceilings mismatch");
}
function verifyParent(body: ExecutionPreparationBodyV1, source: IndependentlyLoadedSourcesV1): void {
  const { generation: g } = body;
  check((g.ordinal === 0) === (g.parentGenerationId === null), "generation ordinal/parent mismatch");
  if (g.ordinal === 0) {
    check(source.parentEnvelope === null && body.authorizationKind !== "transition-a-fixture-v1", "bootstrap origin/parent kind mismatch");
    check(body.preparationObservationT0.headRevision === 0, "bootstrap T0 head must be zero"); return;
  }
  check(source.parentEnvelope !== null && body.authorizationKind !== "bootstrap-a-fixture-v1", "transition requires actual parent origin");
  const parent = parsedEnvelope(source.parentEnvelope), p = parent.envelope;
  check(g.parentGenerationId === parent.generationId && g.ordinal === p.generation.ordinal + 1 && g.lineageId === p.generation.lineageId && p.missionId === body.missionId, "parent generation/lineage binding");
  if (body.authorizationKind === "transition-a-fixture-v1") check(p.authorizationKind !== "proposal-b-host-fixture-v1", "B to A forbidden");
  const oldBudget = p.admissionSource.budgetLineage, nextBudget = body.admissionSource.budgetLineage;
  check(nextBudget.rootAccountId === oldBudget.rootAccountId, "root account changed across generation");
  refsEqual(nextBudget.rootAllocationRef, oldBudget.rootAllocationRef, "root allocation changed across generation");
  sameDocument(nextBudget.rootLimits, oldBudget.rootLimits, "root limits changed across generation");
  refsEqual(body.rootBootstrapSources, p.rootBootstrapSources, "root bootstrap sources changed across generation");
  refsEqual(body.activationPolicy, p.activationPolicy, "activation root policy/ceilings changed across generation");
}

/** Bind DATA against separately supplied documents, not a proof of independent acquisition or authority. */
export function bindExecutionPreparationV1(raw: unknown, independent: IndependentlyLoadedSourcesV1, policy: PlannerPolicy): CodecResult<ReadonlyData<BoundPreparationV1>> {
  return attempt<ReadonlyData<BoundPreparationV1>>(() => {
    assertExecutionJsonV1([raw, independent, policy]); const body = clone(raw); rawBody(body, false);
    const b = body as ExecutionPreparationBodyV1, a = b.admissionSource;
    fields(independent, { fullGraphSnapshot: x => { documentBytes(x); }, sourceMissionSnapshot: x => { documentBytes(x); },
      executionTemplate: x => { documentBytes(x); }, executionSourceSpec: x => { documentBytes(x); }, inputManifestSource: x => { fields(x, { document: y => { documentBytes(y); }, files: y => list(y, artifactBytes) }); },
      knowledgeSource: x => { documentBytes(x); }, approvalSource: x => { documentBytes(x); }, contractPins: pins, parentEnvelope: nullable(x => { documentBytes(x, ENVELOPE_KIND); }),
      rootLimits: nullable(x => { doc(x, "l8-root-limits-v1", validateRootLimits); }), rootBootstrapSources: nullable(x => { validateBootstrap(x); }),
      planningPolicy: x => { validatePlannerPolicy(documentBytes(x, "l8-planning-policy-source-v1").value, true, true); },
      contextSources: x => { validatePublicContexts(x); }, groupingConfig: x => { documentBytes(x, EXECUTION_DOCUMENT_KINDS_V1.groupingConfig); },
      codecBytes: x => list(x, y => {
        const bytes = fields(y, { ref: validateByteRef, base64: z => text(z, true) });
        validateBoundBytes(y, (bytes.ref as ByteRef).encoding);
      }) });
    for (const k of ["fullGraphSnapshot", "sourceMissionSnapshot"] as const) sameDocument(b[k], independent[k], `independent ${k} mismatch`);
    for (const k of ["executionTemplate", "executionSourceSpec", "knowledgeSource", "approvalSource"] as const) sameDocument(a[k], independent[k], `independent ${k} mismatch`);
    sameDocument(a.inputManifestSource.document, independent.inputManifestSource.document, "independent input manifest mismatch");
    refsEqual(a.inputManifestSource.files, independent.inputManifestSource.files, "independent input bytes mismatch"); refsEqual(b.contractPins, independent.contractPins, "independent codec/schema pins mismatch");
    const expectedCodecs = new Map(PIN_KEYS.map(key => [canonicalExecutionJsonV1(b.contractPins[key]), b.contractPins[key]]));
    const actualCodecs = new Set<string>();
    for (const bytes of independent.codecBytes) {
      const key = canonicalExecutionJsonV1(bytes.ref);
      check(expectedCodecs.has(key) && !actualCodecs.has(key), "extra or duplicate independent codec bytes");
      validateBoundBytes(bytes, bytes.ref.encoding); actualCodecs.add(key);
    }
    check(actualCodecs.size === expectedCodecs.size, "missing independently loaded codec bytes");
    sameDocument(b.planningPolicy, independent.planningPolicy, "independent planning policy mismatch");
    refsEqual(documentBytes(b.planningPolicy).value, policy, "planning policy/sidecar mismatch");
    refsEqual(b.contextSources, independent.contextSources, "independent context sources mismatch");
    sameDocument(b.groupSource.groupingConfig, independent.groupingConfig, "independent grouping config mismatch");
    refsEqual(b.rootBootstrapSources, independent.rootBootstrapSources, "independent bootstrap sources mismatch");
    const snapshot = doc(b.fullGraphSnapshot, EXECUTION_DOCUMENT_KINDS_V1.fullGraphSnapshot, assertSnapshotContract);
    const missionSnapshot = doc(b.sourceMissionSnapshot, EXECUTION_DOCUMENT_KINDS_V1.sourceMissionSnapshot, validateMissionSnapshot);
    const transportResult = decodePreparedGraphV3(documentBytes(b.preparedTransport).value); check(transportResult.ok, transportResult.ok ? "" : transportResult.errors.join("; "));
    const transport = transportResult.value;
    const template = doc(a.executionTemplate, EXECUTION_DOCUMENT_KINDS_V1.executionTemplate, x => { validateExecutionTemplate(x); return x; });
    const sourceSpec = doc(a.executionSourceSpec, EXECUTION_DOCUMENT_KINDS_V1.executionSourceSpec, validateExecutionSource);
    const inputSource = doc(a.inputManifestSource.document, EXECUTION_DOCUMENT_KINDS_V1.inputManifest, x => { validateInputSource(x, snapshot); return x; });
    const k = doc(a.knowledgeSource, EXECUTION_DOCUMENT_KINDS_V1.knowledge, validateKnowledgeSource);
    const approvals = doc(a.approvalSource, EXECUTION_DOCUMENT_KINDS_V1.approvals, validateApprovalSource);
    const t0 = b.preparationObservationT0, c = a.context, f = a.sourceFingerprints;
    check(b.missionId === snapshot.missionId && b.missionId === missionSnapshot.missionId && b.missionId === k.missionId, "mission identity mismatch");
    check(sourceSpec.templateFingerprint === fingerprint(template) && canonical(sourceSpec.models) === canonical(missionSnapshot.config.models)
      && canonical(sourceSpec.binary) === canonical(missionSnapshot.config.binary) && sourceSpec.outputDirectory === missionSnapshot.config.outputDirectory
      && canonical(sourceSpec.rePolicy) === canonical(missionSnapshot.config.rePolicy ?? null), "source spec/config mismatch");
    check(snapshot.binaryArtifacts.some(artifact => artifact.contentSha256 === sourceSpec.binary.sha256 && artifact.versionLabel === sourceSpec.binary.version), "source binary absent from full snapshot");
    check(c.missionId === b.missionId && c.snapshotId === snapshot.snapshotId && c.snapshotFingerprint === snapshot.normalizedFingerprint
      && c.partitionId === transport.partition.partitionId && c.knowledgeRevision === k.knowledgeRevision && c.knowledgeRevision === snapshot.knowledgeRevision
      && c.missionConfigFingerprint === fingerprint(missionSnapshot.config) && c.executionSpecFingerprint === fingerprint(sourceSpec)
      && c.inputManifestFingerprint === fingerprint(inputSource) && c.cycle === a.cycle && c.budgetEpoch === a.budgetEpoch,
      "admission current-source/context binding");
    check(f.executionTemplate === fingerprint(template) && f.executionSourceSpec === fingerprint(sourceSpec) && f.inputManifest === fingerprint(inputSource)
      && f.context === fingerprint(c) && f.allocation === (a.allocation?.fingerprint ?? null), "admission source fingerprints mismatch");
    check(a.allocation === null || canonical(a.allocation.context) === canonical(c), "allocation bound to different context");
    refsEqual(inputSource.commonInputs, missionSnapshot.config.commonInputs, "common input source mismatch");
    refsEqual(inputSource.accessibleRules, missionSnapshot.config.accessibleRules, "input rule source mismatch"); refsEqual(inputSource.requiredTools, missionSnapshot.config.requiredTools, "input tool source mismatch");
    refsEqual(inputSource.cycleKnowledge, k.frozen, "knowledge/input source mismatch");
    check(missionSnapshot.cycles.some(cycle => cycle.number === a.cycle), "admission source cycle missing");
    check(t0.sourceMissionRevision === missionSnapshot.revision && t0.parentGenerationId === b.generation.parentGenerationId
      && t0.knowledgeRevision === k.knowledgeRevision && t0.knowledgeRootHash === k.rootHash && t0.knowledgeLedgerRevision === k.ledgerRevision && t0.knowledgeLedgerDigest === k.ledgerDigest,
      "immutable T0/source knowledge binding");
    const budget = a.budgetLineage;
    check(budget.epoch === a.budgetEpoch && budget.rootAccountId === executionValueRefV1("l8-budget-root-v1", { missionId: b.missionId, lineageId: b.generation.lineageId, rootAllocationRef: budget.rootAllocationRef }).sha256, "root account/epoch binding");
    const root = doc(budget.rootLimits, EXECUTION_DOCUMENT_KINDS_V1.rootLimits, validateRootLimits);
    check(independent.rootLimits !== null, "root limits independently unknown");
    sameDocument(budget.rootLimits, independent.rootLimits, "independent root limits mismatch");
    refsEqual(t0.rootLimitsRef, budget.rootLimits.ref, "T0 root limits reference mismatch");
    refsEqual(t0.rootSlotGrantsRef, root.rootSlotGrants?.ref ?? null, "T0 root grants reference mismatch");
    refsEqual(t0.rootModelBindingsRef, root.rootModelBindings?.ref ?? null, "T0 root model bindings reference mismatch");
    refsEqual(budget.rootAllocationRef, root.allocation.ref, "root allocation byte reference mismatch");
    const rootAllocation = validateAllocation(documentBytes(root.allocation).value);
    const rootTemplate = doc(root.executionTemplate, EXECUTION_DOCUMENT_KINDS_V1.executionTemplate, x => { validateExecutionTemplate(x); return x; });
    bindRootModelsAndCapacity(b, root, template, sourceSpec, rootTemplate);
    check(template.settings.maxConcurrent <= rootTemplate.settings.maxConcurrent && policy.maxSelectedUnits <= root.maxSelectedUnits
      && policy.totalContextBudgetUtf8Bytes <= root.totalContextBudgetUtf8Bytes && policy.contextEnvelopeMaxUtf8Bytes <= root.contextEnvelopeMaxUtf8Bytes, "candidate raises root limits");
    if (b.generation.ordinal === 0) {
      sameDocument(root.executionTemplate, a.executionTemplate, "bootstrap root inventory differs from source template");
      refsEqual(rootAllocation, a.allocation, "bootstrap root allocation mismatch");
    }
    // Account/resource limits, actual SPENT and trusted policy approval are rechecked by S2 on the OWN connection.
    verifyParent(b, independent); bindInputBytes(inputSource, a.inputManifestSource, k, approvals);
    bindActivationPolicySourceV1(b, independent.inputManifestSource, inputSource, missionSnapshot);
    const partitionRef = executionValueRefV1("l8-partition-value-v1", transport.partition), groupsRef = executionValueRefV1("l8-groups-value-v1", transport.groups);
    refsEqual(b.sourceRefs.partitionRef, partitionRef, "partition value ref mismatch"); refsEqual(b.sourceRefs.groupsRef, groupsRef, "groups value ref mismatch");
    refsEqual(b.groupSource.groupsRef, groupsRef, "group source ref mismatch");
    const storedDigest = fingerprint(transport.partition);
    check(b.sourceRefs.partitionStoreDigest === storedDigest && t0.partitionStoreDigest === storedDigest, "original stored partition digest mismatch");
    if (b.authorizationKind === "proposal-b-host-fixture-v1") {
      check(transport.partition.regime === "B" && transport.proposalEvidence, "B authorization needs actual complete B proposal");
      refsEqual(b.sourceRefs.proposalEvidenceRef, executionValueRefV1("l8-proposal-evidence-value-v1", transport.proposalEvidence), "proposal evidence value ref mismatch");
      refsEqual(b.sourceRefs.lineageRef, executionValueRefV1("l8-lineage-value-v1", transport.proposalEvidence.result.lineageSidecar), "lineage value ref mismatch");
    } else check(transport.partition.regime === "A" && !transport.proposalEvidence, "A needs structural A, not a B cast/evidence");
    if (b.adoptionIntent !== null) {
      const inspection = inspectPartitionAdoptionV1(documentBytes(b.adoptionIntent.document).value, transport);
      check(inspection.wellFormed && inspection.coherent && inspection.preparedBinding === "matched", "pre-drain adoption intent belongs to another candidate");
      const intentResult = decodePartitionAdoptionV1(documentBytes(b.adoptionIntent.document).value); check(intentResult.ok, "adoption intent decode");
      check(intentResult.value.observedDigest === storedDigest, "pre-drain intent partition digest mismatch");
    }
    const grouping = decodeGrouping(b.groupSource);
    bindPublicContexts(b, snapshot, transport, grouping);
    validatePlannerPolicy(policy, true, true);
    check(policy.admissionBudgetMode === "complete-admission-cap-v1" && canonical(policy.admissionBudget ?? null) === canonical(a.allocation), "planning policy/admission allocation mismatch");
    const projected = projectExecutionSourcesForL5V1(snapshot, transport, grouping, policy, c); check(projected.ok, projected.ok ? "" : projected.reasons.join("; "));
    const prepared: BoundPreparationV1 = { body: b, snapshot, missionSnapshot, transport: clone(transport) as PreparedGraphTransportV3, template, sourceSpec, inputSource,
      knowledge: k, approvals, grouping, projection: clone(projected.value) as ExecutionProjectionV1 };
    return freezePreparation(prepared);
  });
}

export function sealExecutionEnvelopeV1(body: unknown): CodecResult<ReadonlyData<ParsedExecutionEnvelopeV1>> {
  return attempt(() => {
    assertExecutionJsonV1(body); const own = clone(body); rawBody(own, true);
    const envelope = { ...(own as RecordValue), fingerprint: executionValueRefV1(ENVELOPE_KIND, own).sha256 };
    return parsedEnvelope(makeBoundDocumentV1(ENVELOPE_KIND, envelope));
  });
}

export function bindExecutionSourcesV1(origin: ReadonlyData<ParsedExecutionEnvelopeV1>, independent: IndependentlyLoadedSourcesV1): CodecResult<ReadonlyData<BoundExecutionV1>> {
  const measure145 = enterLocal145("bind");
  let issue145: "returned" | "rejected" | "thrown" = "thrown", text145: string | undefined;
  try {
  const result145 = attempt<ReadonlyData<BoundExecutionV1>>(() => {
    assertExecutionJsonV1(origin); const parsed = parsedEnvelope(origin.document);
    if (measure145) text145 = parsed.document.utf8; // Already validated, detached bytes; no second read of caller properties.
    refsEqual(origin.envelope, parsed.envelope, "parsed envelope substitution"); check(origin.generationId === parsed.generationId, "generation substitution");
    const planning = documentBytes(parsed.envelope.planning, EXECUTION_DOCUMENT_KINDS_V1.planning).value as PlannerResult;
    const { fingerprint: _fingerprint, planning: _planning, ...body } = parsed.envelope;
    const prepared = take(bindExecutionPreparationV1(body, independent, planning.sidecar.policy));
    // Detached validated values; never cast a B partition to structural ClusterPartition.
    const snapshot = clone(prepared.snapshot) as GraphSnapshotV1;
    validatePlanningBindingV1(planning, snapshot, { partitionId: prepared.transport.partition.partitionId }, {
      context: clone(prepared.body.admissionSource.context), allocation: clone(prepared.body.admissionSource.allocation)
    });
    // Reuse the qualified pure codec, not the planner producer. Detach only readonly
    // typing from the full-snapshot projection; no regime or source contract is cast.
    const relationView = canonicalRelationView(clone(prepared.projection.graph) as PlannerGraphInput, planning.sidecar.policy).relationView;
    refsEqual(relationView, planning.sidecar.relationView, "planning relation view differs from full snapshot records/sites/observations");
    const nodes = new Map(snapshot.nodes.map(n => [n.id, n]));
    const artifacts = new Map(snapshot.binaryArtifacts.map(a => [a.contentSha256, a]));
    const calls = new Map(planning.units.map(unit => [unit.unitId, relationView.relations.filter(edge =>
      unit.ownedFunctionIds.includes(edge.sourceId) && unit.ownedFunctionIds.includes(edge.destinationId))]));
    const root = doc(prepared.body.admissionSource.budgetLineage.rootLimits, EXECUTION_DOCUMENT_KINDS_V1.rootLimits, validateRootLimits);
    check(root.rootSlotGrants !== null && root.rootModelBindings !== null, "selected planning root grants/models unknown");
    const grants = doc(root.rootSlotGrants, "l8-root-slot-grants-v1", validateRootSlotGrants);
    const bindings = doc(root.rootModelBindings, "l8-root-model-bindings-v1", validateRootModelBindings);
    const labels = new Set(bindings.bindings.map(b => b.label));
    for (const unit of planning.units) {
      const order = planning.sidecar.localOrders[unit.unitId];
      check(order !== undefined && order.functionIds.length === unit.ownedFunctionIds.length
        && new Set(order.functionIds).size === order.functionIds.length && order.functionIds.every(id => unit.ownedFunctionIds.includes(id)), "unit local order missing/foreign/duplicate functions");
      refsEqual(unit.subIntents, derivePlannerUnitSubIntents(unit.unitId, order.functionIds, order.recursive, calls, nodes, artifacts), "fixed unit subIntent derivation mismatch");
      const estimate = derivePlannerUnitEstimate(unit.ownedFunctionIds, planning.sidecar.policy, order.recursive).estimate;
      refsEqual(planning.sidecar.estimatesByUnit[unit.unitId], estimate, "fixed unit estimate mismatch");
      refsEqual(unit.estimatedCost, estimate.cost, "fixed unit cost mismatch");
      const resources = derivePlannerUnitResources(unit.ownedFunctionIds, planning.sidecar.policy);
      refsEqual(planning.sidecar.resourcesByUnit[unit.unitId], resources, "fixed unit resources mismatch");
      if (resources) for (const label of resources.models) check(labels.has(label), "unit resource model label unresolved");
      for (const label of Object.keys(planning.sidecar.estimatesByUnit[unit.unitId]!.modelCosts)) check(labels.has(label), "unit estimate model label unresolved");
      if (!planning.plan.selectedUnitIds.includes(unit.unitId)) continue;
      const cap = planning.sidecar.admissionBudget?.byUnit[unit.unitId]?.admissionCapUtf8Bytes;
      check(cap?.known === true && cap.value !== null, "selected unit admission cap unknown");
      const bodyBytes = planning.sidecar.envelopeBytesByUnit[unit.unitId]; count(bodyBytes);
      check(bodyBytes <= cap.value, "selected unit body exceeds current admission cap");
      for (const sub of unit.subIntents) {
        check(sub.role === "A" || sub.role === "B" || sub.role === "R", "selected subIntent role outside acquired root slots");
        const grant = grants.grants.find(g => g.functionId === sub.functionId && g.slot.role === sub.role
          && canonical(g.slot.functionIdentity) === canonical(sub.harnessIdentity));
        check(grant !== undefined && cap.value <= grant.bodyCapUtf8Bytes, "selected unit lacks exact root grant or raises acquired body cap");
      }
    }
    refsEqual(planning.plan.g3Affinities, derivePlannerG3(planning.units), "fixed G3 affinity derivation mismatch");
    const bound: ReadonlyData<BoundExecutionV1> = { ...clone(prepared), origin: parsed, planning };
    return freeze(bound);
  });
  if (measure145) issue145 = result145.ok ? "returned" : "rejected"; return result145;
  } finally { if (measure145) leaveLocal145(measure145, issue145, text145); }
}

export function inspectExecutionEnvelopeV1(bytes: Uint8Array, independent: IndependentlyLoadedSourcesV1): ExecutionInspectionV1 {
  const parsed = parseExecutionEnvelopeV1(bytes);
  if (!parsed.ok) return freeze({ shape: false, coherent: false, proposalAdmissible: null, authorityVerified: false, activationState: "not-established", reasons: parsed.reasons });
  const bound = bindExecutionSourcesV1(parsed.value, independent);
  let proposalAdmissible: boolean | null = null;
  const transport = attempt(() => inspectPreparedGraphV3(documentBytes(parsed.value.envelope.preparedTransport).value));
  if (transport.ok && transport.value.branch === "B") proposalAdmissible = transport.value.evidence.admissible;
  return freeze({ shape: true, coherent: bound.ok, proposalAdmissible, authorityVerified: false, activationState: "not-established", reasons: bound.ok ? [] : bound.reasons });
}

function derived(origin: ParsedExecutionEnvelopeV1): DerivedExecutionSpecV3 {
  const e = origin.envelope, planning = documentBytes(e.planning).value as PlannerResult;
  const snapshot = doc(e.fullGraphSnapshot, EXECUTION_DOCUMENT_KINDS_V1.fullGraphSnapshot, assertSnapshotContract);
  return { version: "l8-execution-derived-v3", sourceSpecFingerprint: e.admissionSource.sourceFingerprints.executionSourceSpec,
    templateFingerprint: e.admissionSource.sourceFingerprints.executionTemplate, inputManifestFingerprint: e.admissionSource.sourceFingerprints.inputManifest,
    envelopeFingerprint: e.fingerprint, planId: planning.plan.planId, planFingerprint: planning.plan.fingerprint,
    sidecarFingerprint: planning.sidecar.fingerprint, bindingFingerprint: planning.binding.fingerprint,
    snapshotId: snapshot.snapshotId, partitionId: planning.plan.partitionId, knowledgeRevision: snapshot.knowledgeRevision };
}
function validateRun(v: unknown): GraphRunV3 {
  assertExecutionJsonV1(v); check(validateStaticJsonSchema(v, runSchema as StaticJsonSchema).length === 0, "graph run v3 schema");
  const r = fields(v, { version: x => one(x, [RUN_KIND]), mode: x => one(x, ["offline-fixture-v1"]), missionId: text, generationId: text,
    envelopeFingerprint: sha, envelope: x => { parsedEnvelope(x as BoundDocument<unknown>); },
    derivedSpec: x => { fields(x, { version: y => one(y, ["l8-execution-derived-v3"]), sourceSpecFingerprint: sha, templateFingerprint: sha, inputManifestFingerprint: sha,
      envelopeFingerprint: sha, planId: text, planFingerprint: sha, sidecarFingerprint: sha, bindingFingerprint: sha, snapshotId: text, partitionId: text, knowledgeRevision: count }); },
    derivedSpecFingerprint: sha, fingerprint: sha });
  const origin = parsedEnvelope(r.envelope as BoundDocument<unknown>), spec = derived(origin), { fingerprint: _ignored, ...body } = r;
  check(r.missionId === origin.envelope.missionId && r.generationId === origin.generationId && r.envelopeFingerprint === origin.envelope.fingerprint, "run/origin identity mismatch");
  refsEqual(r.derivedSpec, spec, "run derived source differs from exact origin");
  check(r.derivedSpecFingerprint === executionValueRefV1("l8-execution-derived-v3", spec).sha256
    && r.fingerprint === executionValueRefV1(RUN_KIND, body).sha256, "run/derived fingerprint mismatch"); return r as unknown as GraphRunV3;
}
export function makeGraphRunV3(origin: ReadonlyData<ParsedExecutionEnvelopeV1>): CodecResult<ReadonlyData<ParsedGraphRunV3>> {
  return attempt(() => {
    assertExecutionJsonV1(origin); const parsed = parsedEnvelope(origin.document);
    refsEqual(origin.envelope, parsed.envelope, "origin value differs from its original bytes"); check(origin.generationId === parsed.generationId, "origin generation differs");
    const spec = derived(parsed), body = { version: RUN_KIND, mode: "offline-fixture-v1" as const, missionId: parsed.envelope.missionId,
      generationId: parsed.generationId, envelopeFingerprint: parsed.envelope.fingerprint, envelope: parsed.document,
      derivedSpec: spec, derivedSpecFingerprint: executionValueRefV1("l8-execution-derived-v3", spec).sha256 };
    const run = validateRun({ ...body, fingerprint: executionValueRefV1(RUN_KIND, body).sha256 });
    return freeze({ document: makeBoundDocumentV1(RUN_KIND, run), run });
  });
}
export function parseGraphRunV3(bytes: Uint8Array): CodecResult<ReadonlyData<ParsedGraphRunV3>> {
  return attempt(() => { check(!utilTypes.isProxy(bytes) && utilTypes.isUint8Array(bytes), "run UTF-8 bytes required"); const own = new Uint8Array(bytes), textValue = utf8(own);
    const run = validateRun(strictJson(textValue)); return freeze({ document: { ref: ref(RUN_KIND, own, "utf8-json-v1"), utf8: textValue }, run });
  });
}
export function exportGraphRunV3(parsed: ReadonlyData<ParsedGraphRunV3>): CodecResult<Uint8Array> {
  return attempt(() => {
    assertExecutionJsonV1(parsed); const data = documentBytes(parsed.document, RUN_KIND), run = validateRun(data.value);
    refsEqual(parsed.run, run, "run object substituted for bound original"); return new Uint8Array(data.bytes);
  });
}
