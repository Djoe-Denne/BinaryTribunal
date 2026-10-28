/** Offline data codecs only. No store, producer, authority, filesystem or loader. */
import envelopeSchema from "../schemas/l8-execution-envelope-v1.schema.json";
import runSchema from "../schemas/l8-graph-run-v3.schema.json";
import { types as utilTypes } from "node:util";
import { assertSnapshotContract, validateStaticJsonSchema, type GraphSnapshotV1, type StaticJsonSchema } from "./graph";
import { decodePreparedGraphV3, decodePartitionAdoptionV1, inspectPreparedGraphV3, inspectPartitionAdoptionV1,
  type PreparedGraphTransportV3, type PartitionAdoptionTransportV1 } from "./graph-transport";
import { validateExecutionTemplate, validateInputSource, validatePlanningBindingV1, validateGraphDocument, validatePlannerPolicy } from "./graph-pure-codecs";
import { canonical, fingerprint, hash, validateConfig, validateKnowledge, validateIdentity } from "./validation";
import { validateREPolicy } from "./re-policy";
import { projectExecutionSourcesForL5V1, type DecodedGroupSourceV1, type ExecutionProjectionV1 } from "./graph-b-projection";
import type { Snapshot, CycleRecord, GraphCycleAnchorV1, GraphCycleAnchorV2, GraphExecutionTemplate,
  GraphExecutionSource, GraphInputSource, FrozenKnowledge, ArtifactFile, ValidatedFact, FunctionIdentity,
  ModelRef, Role, StoredResult } from "./domain";
import type { PlannerResult, PlannerPolicy, AdmissionBudgetContextV1, AdmissionBudgetInputV1 } from "./planner";
import type { GroupConfig, GroupMetrics } from "./investigation-groups";
import type { KnowledgeCommit, ArtifactBinding } from "./graph-store";

export type ReadonlyData<T> = T extends object ? { readonly [P in keyof T]: ReadonlyData<T[P]> } : T;
export type CodecResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reasons: readonly string[] };
export interface ByteRef { kind: string; encoding: "utf8-json-v1" | "raw-v1"; byteLength: number; sha256: string }
export interface ValueRef { kind: string; codec: "l8-json-c14n-v1"; sha256: string }
/** T describes the decoded, fully checked value, not a cast of this string. */
export interface BoundDocument<T> { ref: ByteRef; utf8: string }
export interface BoundBytesV1 { ref: ByteRef; base64: string }
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
}
export interface KnowledgeSourceV1 {
  version: "l8-knowledge-source-v1"; missionId: string; knowledgeRevision: number; rootHash: string;
  frozen: FrozenKnowledge; files: ArtifactBytesV1[]; facts: ValidatedFact[];
  materializations: KnowledgeMaterializationV1[]; ledgerRevision: number; ledgerDigest: string;
}
export interface CompleteInputSourceV1 { document: BoundDocument<GraphInputSource>; files: ArtifactBytesV1[] }
export interface RootLimitsV1 {
  allocation: BoundDocument<AdmissionBudgetInputV1 | null>; contextEnvelopeMaxUtf8Bytes: number; totalContextBudgetUtf8Bytes: number;
  maxSelectedUnits: number; executionTemplate: BoundDocument<GraphExecutionTemplate>;
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
}
export interface ContractPinsV1 {
  envelopeCodec: ByteRef; fullSnapshotSchema: ByteRef; fullSnapshotModule: ByteRef; proposalCodec: ByteRef;
  plannerCodec: ByteRef; inputCodec: ByteRef; admissionCodec: ByteRef; preparedTransportSchema: ByteRef; adoptionTransportSchema: ByteRef;
}
export interface ExecutionEnvelopeCommonV1 {
  version: "l8-execution-envelope-v1"; mode: "offline-fixture-v1"; missionId: string;
  generation: { lineageId: string; ordinal: number; parentGenerationId: string | null };
  contractPins: ContractPinsV1; preparedTransport: BoundDocument<PreparedGraphTransportV3>;
  fullGraphSnapshot: BoundDocument<GraphSnapshotV1>; sourceMissionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
  groupSource: GroupSourceV1; planning: BoundDocument<PlannerResult>; admissionSource: AdmissionSourceV2;
  activationPolicy: { sourcePolicyRef: ByteRef; maxActivationAttempts: number; maxCandidateReplacements: number };
  preparationObservationT0: PreparationObservationT0;
}
export type ExecutionEnvelopeBodyV1 = ExecutionEnvelopeCommonV1 & (
  { authorizationKind: "bootstrap-a-fixture-v1" | "transition-a-fixture-v1"; adoptionIntent: null;
    sourceRefs: { partitionRef: ValueRef; groupsRef: ValueRef; proposalEvidenceRef: null; lineageRef: null; partitionStoreDigest: string } } |
  { authorizationKind: "proposal-b-host-fixture-v1";
    adoptionIntent: null | { kind: "pre-drain-non-authorizing-v1"; document: BoundDocument<PartitionAdoptionTransportV1> };
    sourceRefs: { partitionRef: ValueRef; groupsRef: ValueRef; proposalEvidenceRef: ValueRef; lineageRef: ValueRef; partitionStoreDigest: string } }
);
export type ExecutionEnvelopeV1 = ExecutionEnvelopeBodyV1 & { fingerprint: string };
export type ExecutionPreparationBodyV1 = Omit<ExecutionEnvelopeCommonV1, "planning"> & {
  authorizationKind: ExecutionEnvelopeBodyV1["authorizationKind"];
  adoptionIntent: ExecutionEnvelopeBodyV1["adoptionIntent"];
  sourceRefs: ExecutionEnvelopeBodyV1["sourceRefs"];
};
export interface ParsedExecutionEnvelopeV1 {
  document: BoundDocument<ExecutionEnvelopeV1>; envelope: ExecutionEnvelopeV1; generationId: string;
}
export interface IndependentlyLoadedSourcesV1 {
  fullGraphSnapshot: BoundDocument<GraphSnapshotV1>; sourceMissionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
  executionTemplate: BoundDocument<GraphExecutionTemplate>; executionSourceSpec: BoundDocument<GraphExecutionSource>;
  inputManifestSource: CompleteInputSourceV1; knowledgeSource: BoundDocument<KnowledgeSourceV1>;
  approvalSource: BoundDocument<ApprovalSourceV1>; contractPins: ContractPinsV1;
  parentEnvelope: BoundDocument<ExecutionEnvelopeV1> | null;
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
const PIN_KEYS = ["envelopeCodec", "fullSnapshotSchema", "fullSnapshotModule", "proposalCodec", "plannerCodec", "inputCodec", "admissionCodec", "preparedTransportSchema", "adoptionTransportSchema"] as const;
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

function validateBoundBytes(v: unknown): BoundBytesV1 {
  const r = fields(v, { ref: validateByteRef, base64: x => text(x, true) });
  const value = r as unknown as BoundBytesV1;
  check(value.ref.encoding === "raw-v1" && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.base64), "canonical raw base64 required");
  const bytes = Buffer.from(value.base64, "base64");
  check(bytes.toString("base64") === value.base64 && bytes.byteLength === value.ref.byteLength && hash(bytes) === value.ref.sha256, "raw byte content/hash mismatch"); return value;
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
      revoked: bool, revocationRef: nullable(validateByteRef), binding: z => { validateArtifactBinding(documentBytes(z).value); },
      commit: z => { validateGraphDocument("knowledge-commit", documentBytes(z).value); }, result: z => { storedResult(documentBytes(z).value); },
      readback: z => { fields(z, { status: a => one(a, ["verified", "pending", "mismatch"]), sha256: sha, recordRef: validateByteRef }); } });
      check((m.revoked === true) === (m.revocationRef !== null), "revocation state/reference mismatch");
    }) });
  const k = v as KnowledgeSourceV1;
  check(new Set(k.files.map(f => f.file.path)).size === k.files.length, "duplicate materialized path");
  check(new Set(k.materializations.map(m => `${m.filePath}\u0000${m.resultId}`)).size === k.materializations.length, "duplicate materialization identity");
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
      && commit.resultIds.includes(f.resultId) && resultRecord.resultId === f.resultId && resultRecord.sha256 === f.resultHash,
      "fact binding/commit/result mismatch");
    check(resultRecord.authorId === m.producer.authorId && resultRecord.executionId === m.producer.executionId && resultRecord.sessionId === m.producer.sessionId
      && canonical(resultRecord.effectiveModel) === canonical(m.producer.model), "materialization producer mismatch");
    if (f.materialization === "verified") check(!m.revoked && m.readback.status === "verified" && m.readback.sha256 === f.file.sha256
      && commit.readbackStatus === "verified" && commit.readbackHash === f.resultHash, "verified fact without exact non-revoked publication/materialization readback");
  }
  return k;
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
  fields(v, { allocation: x => { validateAllocation(documentBytes(x).value); }, contextEnvelopeMaxUtf8Bytes: count, totalContextBudgetUtf8Bytes: count,
    maxSelectedUnits: count, executionTemplate: x => { validateExecutionTemplate(documentBytes(x).value); } });
  return v as RootLimitsV1;
}
function validateAdmissionSourceV2(v: unknown, snapshot: GraphSnapshotV1): AdmissionSourceV2 {
  fields(v, { version: x => one(x, ["l8-admission-source-v2"]), admissionCodecVersion: x => one(x, ["l8-fixture-admission-codec-v2"]), cycle: x => count(x, 1), budgetEpoch: x => count(x, 1),
    executionTemplate: x => { validateExecutionTemplate(documentBytes(x).value); }, executionSourceSpec: x => { validateExecutionSource(documentBytes(x).value); },
    inputManifestSource: x => { fields(x, { document: y => { validateInputSource(documentBytes(y).value, snapshot); }, files: y => list(y, artifactBytes) }); },
    context: x => { validateContext(x); }, allocation: x => { validateAllocation(x); },
    sourceFingerprints: x => { fields(x, { executionTemplate: sha, executionSourceSpec: sha, inputManifest: sha, context: sha, allocation: nullable(sha) }); },
    knowledgeSource: x => { validateKnowledgeSource(documentBytes(x).value); }, approvalSource: x => { validateApprovalSource(documentBytes(x).value); },
    budgetLineage: x => { fields(x, { version: y => one(y, ["l8-budget-lineage-v1"]), rootAccountId: sha, rootAllocationRef: validateByteRef, rootLimits: y => { validateRootLimits(documentBytes(y).value); }, epoch: y => count(y, 1) }); }
  }); return v as AdmissionSourceV2;
}

export const EXECUTION_DOCUMENT_KINDS_V1 = Object.freeze({
  envelope: ENVELOPE_KIND, run: RUN_KIND, preparedTransport: "l8-prepared-graph-v3", adoption: "l8-partition-adoption-v1",
  fullGraphSnapshot: "graph-snapshot-v1", sourceMissionSnapshot: "l8-source-mission-snapshot-v1", planning: "l8-planning-source-v1",
  executionTemplate: "l8-execution-template-v1", executionSourceSpec: "l8-execution-source-v1", inputManifest: "l8-input-source-v1",
  knowledge: "l8-knowledge-source-v1", approvals: "l8-approval-source-v1", rootLimits: "l8-root-limits-v1",
  groupingConfig: "l8-grouping-config-source-v1", groupingMetrics: "group-metrics-v1", communityBinding: "l8-community-binding-v1",
  fullContextByGroup: "l8-full-context-by-group-v1", contextOmissions: "l8-context-omissions-v1"
});
function doc<T>(value: unknown, kind: string, validate: (v: unknown) => T): T { return validate(documentBytes(value, kind).value); }
function refsEqual(a: unknown, b: unknown, reason: string): void { check(canonical(a) === canonical(b), reason); }
function sameDocument(a: unknown, b: unknown, reason: string): void {
  const x = documentBytes(a), y = documentBytes(b); refsEqual(x.document.ref, y.document.ref, reason); check(x.document.utf8 === y.document.utf8, reason);
}
const UPSTREAM_PINS: Partial<Record<keyof ContractPinsV1, { byteLength: number; sha256: string }>> = {
  fullSnapshotSchema: { byteLength: 47133, sha256: "e62f78b47b610e40a701203d4750025161d8ccb787224e650d1fe5b18d7c8bea" },
  fullSnapshotModule: { byteLength: 36515, sha256: "2da7c8778833097b43f23be3e878b352b7d71fc89d3b9daf0aa5478aad96ef6f" },
  proposalCodec: { byteLength: 29225, sha256: "48880953cbd4a3cdb0becf9d360dd964fcbedf30f72b379cdff72665cf3f5bbf" },
  plannerCodec: { byteLength: 68395, sha256: "af9950061a3f22b13e742b0fa8df119dd6decf77b24657abcb9f42b6e6a7f1ee" },
  inputCodec: { byteLength: 46607, sha256: "7e618cf57373a79ac5b7aad384ef80f020876fa69a4c4d96dae394533481d5cf" },
  admissionCodec: { byteLength: 46607, sha256: "7e618cf57373a79ac5b7aad384ef80f020876fa69a4c4d96dae394533481d5cf" },
  preparedTransportSchema: { byteLength: 104742, sha256: "fd4cdd41fa6b60ac39f8d40134fb5d593e37b172c04ec2750190f2e6f2fc47b9" },
  adoptionTransportSchema: { byteLength: 12396, sha256: "c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e" }
};
function pins(v: unknown): asserts v is ContractPinsV1 {
  const r = fields(v, Object.fromEntries(PIN_KEYS.map(k => [k, validateByteRef])));
  for (const key of PIN_KEYS) { const expected = UPSTREAM_PINS[key]; if (expected) {
    const actual = r[key] as ByteRef;
    check(actual.byteLength === expected.byteLength && actual.sha256 === expected.sha256 && actual.encoding === "raw-v1", `unsupported qualified upstream pin ${key}`);
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
    authorityRecordRefs: nullable(x => list(x, validateByteRef)), proofRecordRefs: nullable(x => list(x, validateByteRef)) });
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
  const required = ["version", "mode", "missionId", "generation", "authorizationKind", "contractPins", "preparedTransport", "adoptionIntent", "sourceRefs", "fullGraphSnapshot", "sourceMissionSnapshot", "groupSource", "admissionSource", "activationPolicy", "preparationObservationT0", ...(hasPlanning ? ["planning"] : [])];
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
  const r = object(v, ["version", "mode", "missionId", "generation", "authorizationKind", "contractPins", "preparedTransport", "adoptionIntent", "sourceRefs", "fullGraphSnapshot", "sourceMissionSnapshot", "groupSource", "planning", "admissionSource", "activationPolicy", "preparationObservationT0", "fingerprint"]);
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
  refsEqual(body.activationPolicy, p.activationPolicy, "activation root policy/ceilings changed across generation");
}

/** BLOCKED draft: never publish a positive binding on fingerprints alone. */
function requirePlanningSourceRelationCodecV1(): void {
  throw new Error("l8-source: PLANNING_SOURCE_RELATION_CODEC_UNAVAILABLE: parent must qualify a pure source-to-sidecar relation validator; planner.canonicalRelationView is private");
}

/** Bind DATA against separately supplied documents, not a proof of independent acquisition or authority. */
export function bindExecutionPreparationV1(raw: unknown, independent: IndependentlyLoadedSourcesV1, policy: PlannerPolicy): CodecResult<ReadonlyData<BoundPreparationV1>> {
  return attempt(() => {
    assertExecutionJsonV1([raw, independent, policy]); const body = clone(raw); rawBody(body, false);
    const b = body as ExecutionPreparationBodyV1, a = b.admissionSource;
    fields(independent, { fullGraphSnapshot: x => { documentBytes(x); }, sourceMissionSnapshot: x => { documentBytes(x); },
      executionTemplate: x => { documentBytes(x); }, executionSourceSpec: x => { documentBytes(x); }, inputManifestSource: x => { fields(x, { document: y => { documentBytes(y); }, files: y => list(y, artifactBytes) }); },
      knowledgeSource: x => { documentBytes(x); }, approvalSource: x => { documentBytes(x); }, contractPins: pins, parentEnvelope: nullable(x => { documentBytes(x, ENVELOPE_KIND); }) });
    for (const k of ["fullGraphSnapshot", "sourceMissionSnapshot"] as const) sameDocument(b[k], independent[k], `independent ${k} mismatch`);
    for (const k of ["executionTemplate", "executionSourceSpec", "knowledgeSource", "approvalSource"] as const) sameDocument(a[k], independent[k], `independent ${k} mismatch`);
    sameDocument(a.inputManifestSource.document, independent.inputManifestSource.document, "independent input manifest mismatch");
    refsEqual(a.inputManifestSource.files, independent.inputManifestSource.files, "independent input bytes mismatch"); refsEqual(b.contractPins, independent.contractPins, "independent codec/schema pins mismatch");
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
    refsEqual(budget.rootAllocationRef, root.allocation.ref, "root allocation byte reference mismatch");
    const rootAllocation = validateAllocation(documentBytes(root.allocation).value);
    const rootTemplate = doc(root.executionTemplate, EXECUTION_DOCUMENT_KINDS_V1.executionTemplate, x => { validateExecutionTemplate(x); return x; });
    check(template.settings.maxConcurrent <= rootTemplate.settings.maxConcurrent && policy.maxSelectedUnits <= root.maxSelectedUnits
      && policy.totalContextBudgetUtf8Bytes <= root.totalContextBudgetUtf8Bytes && policy.contextEnvelopeMaxUtf8Bytes <= root.contextEnvelopeMaxUtf8Bytes, "candidate raises root limits");
    if (b.generation.ordinal === 0) {
      sameDocument(root.executionTemplate, a.executionTemplate, "bootstrap root inventory differs from source template");
      refsEqual(rootAllocation, a.allocation, "bootstrap root allocation mismatch");
    }
    // Account/resource limits, actual SPENT and trusted policy approval are rechecked by S2 on the OWN connection.
    verifyParent(b, independent); bindInputBytes(inputSource, a.inputManifestSource, k, approvals);
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
    validatePlannerPolicy(policy, true, true);
    check(policy.admissionBudgetMode === "complete-admission-cap-v1" && canonical(policy.admissionBudget ?? null) === canonical(a.allocation), "planning policy/admission allocation mismatch");
    const projected = projectExecutionSourcesForL5V1(snapshot, transport, grouping, policy, c); check(projected.ok, projected.ok ? "" : projected.reasons.join("; "));
    return freeze({ body: b, snapshot, missionSnapshot, transport: clone(transport) as PreparedGraphTransportV3, template, sourceSpec, inputSource,
      knowledge: k, approvals, grouping, projection: clone(projected.value) as ExecutionProjectionV1 });
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
  return attempt(() => {
    assertExecutionJsonV1(origin); const parsed = parsedEnvelope(origin.document);
    refsEqual(origin.envelope, parsed.envelope, "parsed envelope substitution"); check(origin.generationId === parsed.generationId, "generation substitution");
    const planning = documentBytes(parsed.envelope.planning, EXECUTION_DOCUMENT_KINDS_V1.planning).value as PlannerResult;
    const { fingerprint: _fingerprint, planning: _planning, ...body } = parsed.envelope;
    const prepared = take(bindExecutionPreparationV1(body, independent, planning.sidecar.policy));
    // Detached validated values; never cast a B partition to structural ClusterPartition.
    const snapshot = clone(prepared.snapshot) as GraphSnapshotV1;
    validatePlanningBindingV1(planning, snapshot, { partitionId: prepared.transport.partition.partitionId }, {
      context: clone(prepared.body.admissionSource.context), allocation: clone(prepared.body.admissionSource.allocation)
    });
    requirePlanningSourceRelationCodecV1();
    return freeze({ ...clone(prepared), origin: parsed, planning }) as BoundExecutionV1;
  });
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
