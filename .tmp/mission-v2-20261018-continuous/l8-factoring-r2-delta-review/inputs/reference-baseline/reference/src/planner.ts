import { types as utilTypes } from "node:util";
import { canonical, compareText, fingerprint, normalizeEA, validateSHA } from "./validation";
import { compareFunctionIds, stronglyConnectedComponents, topologicalOrder, type DirectedEdge, type StrongComponent } from "./scc";

// Structural projections of CONTRAT v1. L8 owns incorporation into domain.ts.
export type PublicationLevel = 1 | 2;
export type UnitState = "PENDING" | "BLOCKED" | "READY" | "RESERVED" | "RUNNING" | "VALIDATING" | "COMMITTED" | "RETRYABLE" | "FAILED" | "STALE" | "CANCELLED" | "STOP_PENDING" | "QUARANTINED";
export type ArtifactKind = "structural_fact" | "reconciled_c" | "semantic_description" | "validated_knowledge";
export interface UnknownableInteger { known: boolean; value: number | null }
export interface PlannerNode {
  id: string; moduleSha256: string; rva: string; ea: string; imageBase: string;
  functionClass: "internal" | "import" | "external" | "thunk" | "wrapper" | "incomplete";
  status: "observed" | "incomplete" | "quarantined";
}
export interface PlannerEdge {
  id: string; sourceId: string; destinationId: string;
  kind: "direct_call" | "tail_jump" | "indirect_resolved" | "thunk" | "callback_candidate";
  status: "observed" | "inferred" | "validated" | "invalidated";
  schedulerRelevance: "may_block" | "non_blocking" | "hypothesis_not_call" | "context_only";
  retiredInRevision: number | null;
  // Legacy projection only: absent schema/direction/confidence are derived
  // conveniences, not certified native metadata. Absent appearance stays unknown.
  schemaVersion?: 1; direction?: "source_to_destination";
  confidence?: "high" | "medium" | "low" | "unknown"; appearedInRevision?: number;
  sites?: PlannerSite[];
}
export interface PlannerSite {
  siteRva: string; xrefType: "code" | "data";
  provenance: { moduleSha256: string; siteRva: string | null; siteKind: "instruction" | "object" | "import" | "table" | "extractor";
    xrefType: "code" | "data" | "none"; source: string; sourceVersion: string; sourceHash: string; evidenceSha256: string };
}
/** Not an L1 FunctionEdge: its lossless evidence union may exceed 64 sites. */
export interface PlannerRelation {
  relationId: string; sourceId: string; destinationId: string; kind: PlannerEdge["kind"];
  sourceEdgeIds: string[]; sites: PlannerSite[];
  observations: Array<{ metadata: Record<string, unknown>; sourceEdgeIds: string[]; sites: PlannerSite[];
    // Preserve record-to-citation associations too, not just their aggregate union.
    sitesBySourceEdgeId: Record<string, PlannerSite[]> }>;
}
export interface PlannerGraphInput {
  schemaVersion: 1; snapshotId: string; missionId: string; normalizedFingerprint: string; knowledgeRevision: number;
  nodes: PlannerNode[]; edges: PlannerEdge[];
  binaryArtifacts: Array<{ contentSha256: string; versionLabel: string; imageBase: string }>;
  unresolved: Array<{ id: string; fromFunctionId: string; kind: string }>;
  coverage: { status: "complete" | "partial" | "diagnostic"; selfLoopsPreserved: boolean; tailsIterated: boolean };
}
export interface PlannerGroupInput {
  groupId: string; partitionId: string; ownedFunctionIds: string[]; contextFunctionIds: string[];
}
export interface Prerequisite {
  id: string; kind: "obligatory" | "optional" | "external_satisfied" | "unknown_unresolved" | "non_blocking";
  producerUnitId: string | null; requiredPublicationLevel: PublicationLevel; artifactKind: ArtifactKind;
  dispensed: boolean; dispensationReason: string | null;
}
export interface ConflictRef {
  id: string; kind: "owned_function" | "blocking_dependency" | "non_isolated_file" | "exclusive_write" | "native_lease" | "adapter_constraint";
  resourceKey: string; withUnitId: string | null;
}
export interface SubIntent {
  subIntentId: string; functionId: string; role: "explore" | "evaluate" | "A" | "B" | "R";
  harnessIdentity: { sha256: string; version: string; ea: string };
  waitsForSubIntentIds: string[]; sharesFamilyLease: true; outputDisjoint: true;
}
export interface WorkUnit {
  schemaVersion: 1; unitId: string; snapshotId: string; partitionId: string; knowledgeRevision: number;
  ownedFunctionIds: string[]; contextFunctionIds: string[];
  investigationKind: "structural" | "decompilation" | "semantification"; pipeline: "2+1";
  subIntents: SubIntent[]; prerequisites: Prerequisite[]; conflicts: ConflictRef[];
  estimatedCost: UnknownableInteger; requiredPublicationLevel: PublicationLevel; state: UnitState;
}
export interface G1Edge {
  fromUnitId: string; toUnitId: string; kind: "obligatory" | "optional" | "non_blocking";
  callSourceFunctionId: string; callDestinationFunctionId: string; storedCallDirection: "source_to_destination";
}
export interface MissionPlan {
  schemaVersion: 1; planId: string; missionId: string; snapshotId: string; partitionId: string; knowledgeRevision: number;
  units: Array<Pick<WorkUnit, "unitId" | "ownedFunctionIds" | "contextFunctionIds" | "requiredPublicationLevel" | "state"> & { contextEnvelopeUtf8Bytes: UnknownableInteger }>;
  prerequisites: Array<Prerequisite & { consumerUnitId: string }>; g1Edges: G1Edge[]; g2Conflicts: ConflictRef[];
  g3Affinities: Array<{ unitIds: string[]; reason: string; blocking: false }>;
  sccs: StrongComponent[]; selectedUnitIds: string[];
  decisions: Array<{ id: string; unitId: string; action: "include" | "defer" | "dispense" | "exclude_budget"; reason: string }>;
  budgets: { unit: "utf8-bytes"; contextEnvelopeMaxUtf8Bytes: number; countsSqliteLength: false; nativeLineCharLimit: 2000 };
  policyVersion: string; estimationVersion: string; fingerprint: string;
}

export interface ArtifactRequirement {
  artifactId: string; artifactSha256: string; functionId: string; moduleSha256: string; artifactKind: ArtifactKind;
  minimumRevision: number; maximumRevision: number; publicationLevel: PublicationLevel;
  validation: "fixture-only" | "parent-validated";
}
export interface Dispensation {
  reason: string; policyVersion: string; source: string; sourceHash: string;
  validation: "fixture-only" | "parent-validated"; knowledgeRevision: number;
}
export interface ArtifactReceipt extends Omit<ArtifactRequirement, "minimumRevision" | "maximumRevision"> {
  knowledgeRevision: number; producerUnitId: string | null; commitId: string; readbackStatus: "verified" | "pending" | "mismatch";
  futurePrerequisiteEffect: "satisfies" | "does_not_satisfy" | "invalidates_future";
}
export interface PipelineEstimate {
  version: string; A: number; B: number; R: number; validation: number;
  byModel?: Record<string, { A: number; B: number; R: number; validation: number }>;
}
export interface ResourceRequirement {
  profiles: string[]; models: string[]; tools: string[]; accounts: string[];
  slots: number; cpu: number; gpu: number; budget: number;
}
/** Pre-plan commitments supplied independently by L8 from its current inputs.
 * No plan/prepared/run hash or future execution identity belongs in this tuple. */
export interface AdmissionBudgetContextV1 {
  version: "planner-admission-context-v1";
  missionId: string; snapshotId: string; snapshotFingerprint: string; partitionId: string; knowledgeRevision: number;
  missionConfigFingerprint: string; executionSpecFingerprint: string; inputManifestFingerprint: string;
  admissionCodecVersion: string; cycle: number; budgetEpoch: number;
}
export interface AdmissionBudgetInputV1 {
  version: "complete-admission-cap-v1"; scope: "one-immutable-run";
  executionProfile: "one-execution-per-subintent-v1";
  context: AdmissionBudgetContextV1;
  capsByFunction: Record<string, {
    completeBodyMaxUtf8Bytes: UnknownableInteger;
    maxNewExecutionsPerRole: { A: 1; B: 1; R: 1 };
  }>;
  fingerprint: string;
}
export interface AdmissionUnitBudget {
  structuralEnvelopeUtf8Bytes: number;
  admissionCapUtf8Bytes: UnknownableInteger;
  maxNewExecutions: UnknownableInteger;
  totalAdmissionUtf8Bytes: UnknownableInteger;
}
export interface AdmissionBudgetAccountingV1 {
  version: "planner-admission-accounting-v1";
  context: AdmissionBudgetContextV1; allocationFingerprint: string | null;
  byUnit: Record<string, AdmissionUnitBudget>;
  selectedTotalAdmissionUtf8Bytes: number;
}
export interface PlannerPolicy {
  version: string; estimationVersion: string; partitionId: string;
  investigationKind: WorkUnit["investigationKind"]; artifactKind: ArtifactKind; publicationLevel: PublicationLevel;
  contextEnvelopeMaxUtf8Bytes: number; totalContextBudgetUtf8Bytes: number; maxSelectedUnits: number;
  sccMaxFunctions: number; sccMaxIterations: number; sccCostBudget: number;
  requirementsByFunction: Record<string, ArtifactRequirement>;
  estimatesByFunction: Record<string, PipelineEstimate>;
  resourcesByFunction: Record<string, ResourceRequirement>;
  // Legacy API, keyed ONLY by input transport record ID (not relation ID).
  // Each record's explicit/default policy must agree across its whole relation.
  // Repacking requires an explicit policy rebind; stale keys fail closed.
  edgeKinds?: Record<string, Prerequisite["kind"]>;
  dispensationsByEdge?: Record<string, Dispensation>;
  externalReceiptsByEdge?: Record<string, ArtifactReceipt>;
  extraConflictsByFunction?: Record<string, ConflictRef[]>;
  /** Explicit opt-in. A legacy policy's opaque version string never opts in. */
  admissionBudgetMode?: "complete-admission-cap-v1";
  admissionBudget?: AdmissionBudgetInputV1;
}
export interface Diagnostic { code: string; unitId: string | null; functionIds: string[]; detail: string }
/** Approved additive metadata, separate from the strict v1 transport documents. */
export interface PlannerSidecar {
  schemaVersion: 1; policyVersion: string; estimationVersion: string;
  planId: string; planFingerprint: string; snapshotFingerprint: string; knowledgeRevision: number;
  policy: PlannerPolicy;
  relationView: { version: "planner-relations-v1"; relations: PlannerRelation[] };
  requirementById: Record<string, ArtifactRequirement>;
  dispensationById: Record<string, Dispensation>;
  externalReceiptById: Record<string, ArtifactReceipt>;
  localOrders: Record<string, { sccIds: string[]; functionIds: string[]; recursive: boolean; maxIterations: number; publication: "whole-unit-only" }>;
  estimatesByUnit: Record<string, { version: string; cost: UnknownableInteger; modelCosts: Record<string, number> }>;
  resourcesByUnit: Record<string, ResourceRequirement>;
  envelopeBytesByUnit: Record<string, number>;
  unitFingerprints: Record<string, string>;
  diagnostics: Diagnostic[];
  admissionBudget?: AdmissionBudgetAccountingV1;
  fingerprint: string;
}
export interface PlannerResult {
  plan: MissionPlan; units: WorkUnit[]; sidecar: PlannerSidecar; diagnostics: Diagnostic[];
  binding: { schemaVersion: 1; planFingerprint: string; sidecarFingerprint: string; fingerprint: string };
}

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`planner: ${message}`); }
function nonempty(s: string): boolean { return typeof s === "string" && s.trim().length > 0; }
function integer(n: number, minimum = 0): boolean { return Number.isSafeInteger(n) && !Object.is(n, -0) && n >= minimum; }
function digestDocument(value: object): string { const { fingerprint: _ignored, ...content } = value as Record<string, unknown>; return fingerprint(content); }
function unitContentFingerprint(unit: WorkUnit): string { const { state: _state, ...content } = unit; return fingerprint(content); }
function freeze<T>(value: T): T {
  const pending: unknown[] = [value];
  while (pending.length) { const x = pending.pop(); if (x && typeof x === "object" && !Object.isFrozen(x)) { for (const child of Object.values(x)) pending.push(child); Object.freeze(x); } }
  return value;
}

const ADMISSION_BUDGET_MODE = "complete-admission-cap-v1" as const;
const ADMISSION_ACCOUNTING_VERSION = "planner-admission-accounting-v1" as const;
const ADMISSION_POLICY_PREFIX = `${ADMISSION_BUDGET_MODE}:`;

/** Inspect descriptors before cloning: structuredClone would otherwise invoke
 * getters and erase prototypes. Shared JSON subobjects are OK, cycles are not. */
function assertBudgetJson(value: unknown): void {
  const pending: Array<{ value: unknown; exit?: boolean }> = [{ value }];
  const visiting = new Set<object>(), visited = new Set<object>();
  while (pending.length) {
    const item = pending.pop()!, x = item.value;
    if (x === null || typeof x === "string" || typeof x === "boolean") continue;
    if (typeof x === "number") { assert(Number.isFinite(x) && !Object.is(x, -0), "noncanonical admission budget number"); continue; }
    assert(typeof x === "object" && !utilTypes.isProxy(x), "admission budget requires plain JSON data");
    if (item.exit) { visiting.delete(x); visited.add(x); continue; }
    assert(!visiting.has(x), "cyclic admission budget data");
    if (visited.has(x)) continue;
    const proto = Object.getPrototypeOf(x), array = Array.isArray(x);
    assert(array ? proto === Array.prototype : proto === Object.prototype || proto === null, "non-JSON admission budget prototype");
    assert(Object.getOwnPropertySymbols(x).length === 0, "symbol in admission budget data");
    const descriptors = Object.getOwnPropertyDescriptors(x);
    if (array) assert(Object.keys(descriptors).length === x.length + 1, "sparse/non-JSON admission budget array");
    visiting.add(x); pending.push({ value: x, exit: true });
    for (const [key, d] of Object.entries(descriptors)) {
      if (array && key === "length") continue;
      assert("value" in d && d.enumerable, "accessor/non-enumerable admission budget data");
      if (array) assert(/^(0|[1-9][0-9]*)$/.test(key) && Number(key) < x.length, "non-JSON admission budget array key");
      pending.push({ value: d.value });
    }
  }
}
function budgetRecord(value: unknown): asserts value is Record<string, unknown> {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), "admission budget object required");
}
function budgetKeys(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> {
  budgetRecord(value);
  assert(Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k)), "unexpected/missing admission budget keys");
}
function admissionMode(policy: PlannerPolicy, context?: AdmissionBudgetContextV1): boolean {
  assert(policy && typeof policy === "object" && !utilTypes.isProxy(policy), "invalid admission policy object");
  for (const key of ["admissionBudgetMode", "admissionBudget"]) if (key in policy) {
    const d = Object.getOwnPropertyDescriptor(policy, key);
    assert(d && "value" in d && d.enumerable, "inherited/accessor admission budget field");
  }
  if (!Object.hasOwn(policy, "admissionBudgetMode")) {
    assert(!Object.hasOwn(policy, "admissionBudget") && context === undefined, "allocation/context requires explicit admissionBudgetMode");
    return false;
  }
  assertBudgetJson(policy);
  assert(policy.admissionBudgetMode === ADMISSION_BUDGET_MODE, "unsupported admissionBudgetMode");
  // L1/L6's existing text bound is UTF-16 length, not UTF-8 bytes. Do not
  // truncate or constrain the opaque legacy version namespace.
  assert(typeof policy.version === "string" && policy.version.length <= 32 && policy.version.startsWith(ADMISSION_POLICY_PREFIX)
    && nonempty(policy.version.slice(ADMISSION_POLICY_PREFIX.length)), "new admission policy version required (maximum 32 UTF-16 code units)");
  assert(context !== undefined, "independent current admission budget context required");
  validateAdmissionContext(context);
  return true;
}
function validateAdmissionContext(context: AdmissionBudgetContextV1): void {
  assertBudgetJson(context);
  budgetKeys(context, ["version", "missionId", "snapshotId", "snapshotFingerprint", "partitionId", "knowledgeRevision",
    "missionConfigFingerprint", "executionSpecFingerprint", "inputManifestFingerprint", "admissionCodecVersion", "cycle", "budgetEpoch"]);
  assert(context.version === "planner-admission-context-v1", "unsupported admission budget context version");
  for (const s of [context.missionId, context.snapshotId, context.partitionId, context.admissionCodecVersion]) assert(nonempty(s), "missing admission context identity/codec");
  for (const s of [context.snapshotFingerprint, context.missionConfigFingerprint, context.executionSpecFingerprint, context.inputManifestFingerprint]) {
    assert(typeof s === "string" && /^[a-f0-9]{64}$/.test(s), "noncanonical admission context fingerprint");
  }
  assert(integer(context.knowledgeRevision) && integer(context.cycle, 1) && integer(context.budgetEpoch, 1), "invalid admission context revision/cycle/epoch");
}
function validateAdmissionAllocation(policy: PlannerPolicy, context: AdmissionBudgetContextV1): AdmissionBudgetInputV1 | undefined {
  const allocation = policy.admissionBudget;
  if (allocation === undefined) return undefined;
  budgetKeys(allocation, ["version", "scope", "executionProfile", "context", "capsByFunction", "fingerprint"]);
  assert(allocation.version === ADMISSION_BUDGET_MODE && allocation.scope === "one-immutable-run"
    && allocation.executionProfile === "one-execution-per-subintent-v1", "unsupported admission allocation contract");
  validateAdmissionContext(allocation.context);
  assert(canonical(allocation.context) === canonical(context), "admission allocation differs from current context");
  assert(typeof allocation.fingerprint === "string" && /^[a-f0-9]{64}$/.test(allocation.fingerprint)
    && allocation.fingerprint === digestDocument(allocation), "admission allocation fingerprint mismatch");
  budgetRecord(allocation.capsByFunction);
  for (const [id, cap] of Object.entries(allocation.capsByFunction)) {
    assert(canonicalOwnershipKey(id) === `fn:${id}`, "noncanonical admission cap function");
    budgetKeys(cap, ["completeBodyMaxUtf8Bytes", "maxNewExecutionsPerRole"]);
    const bytes = cap.completeBodyMaxUtf8Bytes;
    budgetKeys(bytes, ["known", "value"]);
    assert(bytes.known === false ? bytes.value === null : bytes.known === true && integer(bytes.value!, 1), "invalid admission cap/unknown value");
    budgetKeys(cap.maxNewExecutionsPerRole, ["A", "B", "R"]);
    assert(Object.values(cap.maxNewExecutionsPerRole).every(n => n === 1), "admission profile requires exactly one new execution per role");
  }
  return allocation;
}
function assertAdmissionScope(context: AdmissionBudgetContextV1, graph: Pick<PlannerGraphInput, "missionId" | "snapshotId" | "normalizedFingerprint" | "knowledgeRevision">, policy: PlannerPolicy): void {
  assert(context.missionId === graph.missionId && context.snapshotId === graph.snapshotId && context.snapshotFingerprint === graph.normalizedFingerprint
    && context.knowledgeRevision === graph.knowledgeRevision && context.partitionId === policy.partitionId, "admission context differs from graph/partition/revision");
}
function admissionUnitBudget(structuralBytes: number, functionIds: readonly string[], allocation: AdmissionBudgetInputV1 | undefined): {
  budget: AdmissionUnitBudget; issues: Array<{ code: string; functionIds: string[]; detail: string }>;
} {
  assert(integer(structuralBytes, 1) && functionIds.length > 0 && functionIds.length <= Math.floor(Number.MAX_SAFE_INTEGER / 3), "admission measurement/count overflow");
  const count = functionIds.length * 3, issues: Array<{ code: string; functionIds: string[]; detail: string }> = [];
  const missing = functionIds.filter(id => !allocation || !Object.hasOwn(allocation.capsByFunction, id));
  const unknown = functionIds.filter(id => allocation && Object.hasOwn(allocation.capsByFunction, id) && !allocation.capsByFunction[id]!.completeBodyMaxUtf8Bytes.known);
  if (missing.length) issues.push({ code: allocation ? "admission-cap-missing" : "admission-allocation-missing", functionIds: missing,
    detail: `${ADMISSION_BUDGET_MODE}: explicit complete-body allocation required; structural size is not a substitute` });
  if (unknown.length) issues.push({ code: "admission-cap-unknown", functionIds: unknown, detail: `${ADMISSION_BUDGET_MODE}: complete-body allocation unknown` });
  let cap: UnknownableInteger = { known: false, value: null }, total: UnknownableInteger = { known: false, value: null };
  if (!issues.length) {
    let bytes = structuralBytes;
    for (const id of functionIds) bytes = Math.max(bytes, allocation!.capsByFunction[id]!.completeBodyMaxUtf8Bytes.value!);
    cap = { known: true, value: bytes };
    if (bytes > Math.floor(Number.MAX_SAFE_INTEGER / count)) issues.push({ code: "admission-budget-overflow", functionIds: [...functionIds], detail: `${ADMISSION_BUDGET_MODE}: C*N exceeds safe integer range` });
    else total = { known: true, value: bytes * count };
  }
  return { budget: { structuralEnvelopeUtf8Bytes: structuralBytes, admissionCapUtf8Bytes: cap,
    // The fixed profile and the actual 2+1 sub-intents already determine N,
    // including when a cap is missing/unknown. SCC passes do not multiply N.
    maxNewExecutions: { known: true, value: count }, totalAdmissionUtf8Bytes: total }, issues };
}
export function canonicalOwnershipKey(functionId: string): string {
  const colon = functionId.lastIndexOf(":");
  const module = functionId.slice(0, colon).toLowerCase(); validateSHA(module);
  return `fn:${module}:${normalizeEA(functionId.slice(colon + 1))}`;
}
function unitIdentity(functionIds: string[], kind: WorkUnit["investigationKind"]): string {
  return `unit:${fingerprint({ investigationKind: kind, functionIds })}`;
}
/** Additive identity for new plans only. Function/family identities stay unchanged. */
export function canonicalRelationKey(edge: Pick<PlannerEdge, "sourceId" | "destinationId" | "kind">): string {
  return `relation:v1:${fingerprint({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind })}`;
}
function isPlannerCall(e: PlannerEdge): boolean {
  return e.kind !== "callback_candidate" && e.schedulerRelevance !== "hypothesis_not_call" && e.schedulerRelevance !== "context_only";
}
function defaultEdgeKind(e: PlannerEdge): Prerequisite["kind"] {
  if (!isPlannerCall(e)) return "non_blocking";
  if (e.status === "inferred") return "unknown_unresolved";
  if (e.schedulerRelevance === "non_blocking") return "non_blocking";
  return "obligatory";
}
function ownEntry<T>(table: Record<string, T> | undefined, id: string): T | undefined {
  return table && Object.hasOwn(table, id) ? table[id] : undefined;
}
function effectiveEdgeKind(e: PlannerEdge, policy: PlannerPolicy): Prerequisite["kind"] {
  const kind = defaultEdgeKind(e);
  // Preserve single-record legacy semantics: an override cannot promote a
  // hypothesis/inferred/nonblocking edge. Still compare the declaration below.
  return kind === "obligatory" ? ownEntry(policy.edgeKinds, e.id) ?? kind : kind;
}
const RELATION_VIEW_VERSION = "planner-relations-v1" as const;
// New-plan identity only: own ByEdge declarations and external producer binding.
const RELATION_POLICY_VERSION = "planner-relation-policy-v2";

function planningIdentity(snapshot: string, policy: PlannerPolicy, families: string[][], context?: AdmissionBudgetContextV1): string {
  return `plan:${fingerprint({ snapshot, policy, families, relationViewVersion: RELATION_VIEW_VERSION, relationPolicyVersion: RELATION_POLICY_VERSION,
    ...(context ? { admissionAccountingVersion: ADMISSION_ACCOUNTING_VERSION, admissionBudgetContext: context } : {}) })}`;
}
/** Transport pages are not knowledge obligations. Reject ambiguity before any SCC/closure. */
function canonicalRelationView(graph: PlannerGraphInput, policy: PlannerPolicy) {
  const relations = new Map<string, PlannerRelation>();
  const comparedByRelation = new Map<string, { metadataKey: string; policyKey: string }>();
  const liveByRelation = new Map<string, PlannerEdge>();
  const observations = new Map<string, Map<string, PlannerRelation["observations"][number]>>();
  const kinds = new Map<string, Prerequisite["kind"]>(), dispensations = new Map<string, Dispensation>(), receipts = new Map<string, ArtifactReceipt>();
  const ids = new Set<string>();
  const unionSites = (sites: PlannerSite[]): PlannerSite[] => [...new Map(sites.map(s => [canonical(s), s])).entries()]
    .sort(([a], [b]) => compareText(a, b)).map(([, site]) => site);
  for (const input of graph.edges) {
    assert(nonempty(input.id) && !ids.has(input.id), "missing/duplicate edge identity"); ids.add(input.id);
  }
  for (const table of [policy.edgeKinds, policy.dispensationsByEdge, policy.externalReceiptsByEdge]) {
    for (const id of Object.keys(table ?? {})) assert(ids.has(id), `relation-policy-conflict: unknown transport record ${id}; explicit rebind required`);
  }
  for (const input of graph.edges) {
    const e = structuredClone(input), relationId = canonicalRelationKey(e);
    assert(["direct_call", "tail_jump", "indirect_resolved", "thunk", "callback_candidate"].includes(e.kind)
      && ["observed", "inferred", "validated", "invalidated"].includes(e.status)
      && ["may_block", "non_blocking", "hypothesis_not_call", "context_only"].includes(e.schedulerRelevance), `relation-metadata-conflict:${relationId}: invalid kind/status/relevance`);
    // planner-relations-v1 defines these three legacy projection defaults only.
    // Validate supplied values BEFORE deriving defaults. Appearance is deliberately
    // not defaulted: missing vs known (even zero) cannot be merged as source facts.
    assert((e.schemaVersion === undefined || e.schemaVersion === 1)
      && (e.direction === undefined || e.direction === "source_to_destination")
      && (e.confidence === undefined || ["high", "medium", "low", "unknown"].includes(e.confidence)), `relation-metadata-conflict:${relationId}: invalid schema/direction/confidence`);
    if (e.appearedInRevision !== undefined) assert(integer(e.appearedInRevision) && e.appearedInRevision <= graph.knowledgeRevision, `relation-revision-conflict:${relationId}: future/invalid appearance`);
    if (e.retiredInRevision !== null) assert(integer(e.retiredInRevision) && e.retiredInRevision <= graph.knowledgeRevision
      && (e.appearedInRevision === undefined || e.retiredInRevision >= e.appearedInRevision), `relation-revision-conflict:${relationId}: incoherent retirement`);
    const { id: _id, sites = [], sourceId, destinationId, kind, ...metadata } = e;
    const normalizedMetadata = { ...metadata, schemaVersion: 1 as const, direction: "source_to_destination" as const, confidence: e.confidence ?? "unknown" };
    const metadataKey = canonical(normalizedMetadata), observationKey = canonical(metadata);
    const explicitKind = ownEntry(policy.edgeKinds, e.id);
    assert(explicitKind === undefined || ["obligatory", "optional", "external_satisfied", "unknown_unresolved", "non_blocking"].includes(explicitKind), `relation-policy-conflict:${relationId}: invalid legacy edgeKind`);
    const declaredKind = explicitKind ?? defaultEdgeKind(e);
    const edgeKind = effectiveEdgeKind(e, policy), d = ownEntry(policy.dispensationsByEdge, e.id), receipt = ownEntry(policy.externalReceiptsByEdge, e.id);
    const policyKey = canonical({ declaredKind, edgeKind, dispensation: d ?? null, externalReceipt: receipt ?? null });
    const prior = comparedByRelation.get(relationId);
    assert(!prior || prior.metadataKey === metadataKey, `relation-metadata-conflict:${relationId}: incoherent observations`);
    assert(!prior || prior.policyKey === policyKey, `relation-policy-conflict:${relationId}: legacy shard policies disagree`);
    comparedByRelation.set(relationId, { metadataKey, policyKey });
    const relation = relations.get(relationId) ?? { relationId, sourceId, destinationId, kind, sourceEdgeIds: [], sites: [], observations: [] };
    relation.sourceEdgeIds.push(e.id); relation.sites.push(...sites); relations.set(relationId, relation);
    const byMetadata = observations.get(relationId) ?? new Map<string, PlannerRelation["observations"][number]>();
    const observation: PlannerRelation["observations"][number] = byMetadata.get(observationKey)
      ?? { metadata, sourceEdgeIds: [], sites: [], sitesBySourceEdgeId: Object.create(null) };
    observation.sitesBySourceEdgeId[e.id] = sites;
    observation.sourceEdgeIds.push(e.id); observation.sites.push(...sites); byMetadata.set(observationKey, observation); observations.set(relationId, byMetadata);
    // Full metadata AND policy agreement precedes retirement filtering. A retired
    // page cannot conceal contradictory evidence/policy from another page.
    if (e.status === "invalidated" || e.retiredInRevision !== null) continue;
    // Derived, not an L1 transport edge or a winning source observation.
    liveByRelation.set(relationId, { id: relationId, sourceId, destinationId, kind, ...normalizedMetadata });
    kinds.set(relationId, edgeKind); if (d) dispensations.set(relationId, d); if (receipt) receipts.set(relationId, receipt);
  }
  const ordered = [...relations.values()].sort((a, b) => compareText(a.relationId, b.relationId));
  for (const relation of ordered) {
    relation.sourceEdgeIds.sort(compareText); relation.sites = unionSites(relation.sites);
    relation.observations = [...observations.get(relation.relationId)!.entries()].sort(([a], [b]) => compareText(a, b)).map(([, observation]) => ({
      metadata: observation.metadata, sourceEdgeIds: observation.sourceEdgeIds.sort(compareText), sites: unionSites(observation.sites),
      sitesBySourceEdgeId: Object.fromEntries(Object.entries(observation.sitesBySourceEdgeId).sort(([a], [b]) => compareText(a, b)).map(([id, sites]) => [id, unionSites(sites)])),
    }));
  }
  return { relationView: { version: RELATION_VIEW_VERSION, relations: ordered },
    liveEdges: [...liveByRelation.values()].sort((a, b) => compareText(a.id, b.id)), kinds, dispensations, receipts };
}
function validRequirement(r: ArtifactRequirement | undefined): r is ArtifactRequirement {
  if (!r) return false;
  try { validateSHA(r.artifactSha256); validateSHA(r.moduleSha256); canonicalOwnershipKey(r.functionId); } catch { return false; }
  return nonempty(r.artifactId) && r.functionId.startsWith(`${r.moduleSha256}:`) && integer(r.minimumRevision)
    && integer(r.maximumRevision) && r.maximumRevision >= r.minimumRevision && [1, 2].includes(r.publicationLevel)
    && ["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"].includes(r.artifactKind)
    && ["fixture-only", "parent-validated"].includes(r.validation) && (r.publicationLevel !== 2 || r.validation === "parent-validated");
}
function validDispensation(d: Dispensation | undefined, policy: PlannerPolicy, revision: number): d is Dispensation {
  if (!d) return false;
  try { validateSHA(d.sourceHash); } catch { return false; }
  return nonempty(d.reason) && nonempty(d.source) && d.policyVersion === policy.version && d.knowledgeRevision === revision
    && (d.validation === "parent-validated" || (policy.publicationLevel === 1 && d.validation === "fixture-only"));
}
export function receiptSatisfies(requirement: ArtifactRequirement, receipt: ArtifactReceipt, producerUnitId: string | null): boolean {
  if (!validRequirement(requirement)) return false;
  try { validateSHA(receipt.commitId); validateSHA(receipt.artifactSha256); } catch { return false; }
  return receipt.producerUnitId === producerUnitId && receipt.readbackStatus === "verified" && receipt.futurePrerequisiteEffect === "satisfies"
    && receipt.artifactId === requirement.artifactId && receipt.artifactSha256 === requirement.artifactSha256
    && receipt.functionId === requirement.functionId && receipt.moduleSha256 === requirement.moduleSha256
    && receipt.artifactKind === requirement.artifactKind && receipt.publicationLevel >= requirement.publicationLevel
    && [1, 2].includes(receipt.publicationLevel) && integer(receipt.knowledgeRevision)
    && receipt.knowledgeRevision >= requirement.minimumRevision && receipt.knowledgeRevision <= requirement.maximumRevision
    && (receipt.validation === "parent-validated" || (requirement.validation === "fixture-only" && receipt.validation === "fixture-only"));
}
function invalidatesReceipt(requirement: ArtifactRequirement, receipt: ArtifactReceipt, invalidation: ArtifactReceipt): boolean {
  try { validateSHA(invalidation.commitId); } catch { return false; }
  return invalidation.futurePrerequisiteEffect === "invalidates_future" && invalidation.readbackStatus === "verified"
    && invalidation.functionId === requirement.functionId && invalidation.moduleSha256 === requirement.moduleSha256
    && invalidation.artifactId === requirement.artifactId && invalidation.artifactKind === requirement.artifactKind
    && invalidation.publicationLevel >= requirement.publicationLevel && integer(invalidation.knowledgeRevision)
    && invalidation.knowledgeRevision >= receipt.knowledgeRevision
    && (invalidation.validation === "parent-validated" || requirement.validation === "fixture-only");
}

/** Costs are supplied/versioned offline. Missing metrics remain unknown, never zero. */
export function pipelineCost(estimate: Pick<PipelineEstimate, "A" | "B" | "R" | "validation">): number {
  for (const cost of [estimate.A, estimate.B, estimate.R, estimate.validation]) assert(integer(cost), "invalid pipeline estimate");
  const cost = Math.max(estimate.A, estimate.B) + estimate.R + estimate.validation;
  assert(integer(cost), "pipeline estimate overflow"); return cost;
}

export function planMission(graph: PlannerGraphInput, groups: readonly PlannerGroupInput[], inputPolicy: PlannerPolicy,
  expectedAdmissionBudgetContext?: AdmissionBudgetContextV1): PlannerResult {
  const budgetMode = admissionMode(inputPolicy, expectedAdmissionBudgetContext);
  const budgetContext = budgetMode ? structuredClone(expectedAdmissionBudgetContext!) : undefined;
  const policy = structuredClone(inputPolicy);
  const allocation = budgetContext ? validateAdmissionAllocation(policy, budgetContext) : undefined;
  if (budgetContext) assertAdmissionScope(budgetContext, graph, policy);
  const policyValues: unknown[] = [policy];
  const seenPolicyObjects = new Set<object>();
  while (policyValues.length) {
    const value = policyValues.pop();
    if (typeof value === "number") assert(Number.isFinite(value) && !Object.is(value, -0), "noncanonical numeric policy value");
    else if (value && typeof value === "object" && !seenPolicyObjects.has(value)) {
      seenPolicyObjects.add(value); for (const child of Object.values(value)) policyValues.push(child);
    }
  }
  assert(graph.schemaVersion === 1 && graph.coverage.selfLoopsPreserved, "snapshot without preserved self-loops");
  assert(graph.coverage.status !== "diagnostic", "historical diagnostic snapshot is not schedulable");
  validateSHA(graph.normalizedFingerprint);
  assert(nonempty(policy.version) && nonempty(policy.estimationVersion) && nonempty(policy.partitionId), "unversioned policy");
  for (const n of [policy.contextEnvelopeMaxUtf8Bytes, policy.totalContextBudgetUtf8Bytes, policy.maxSelectedUnits,
    policy.sccMaxFunctions, policy.sccMaxIterations, policy.sccCostBudget]) assert(integer(n), "invalid budget/bound");
  assert(policy.sccMaxFunctions > 0 && policy.sccMaxIterations > 0, "recursive work must be bounded");
  assert([1, 2].includes(policy.publicationLevel), "inadmissible publication level");
  assert(integer(graph.knowledgeRevision), "invalid knowledge revision");
  assert(["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"].includes(policy.artifactKind), "invalid artifact kind");
  assert(["structural", "decompilation", "semantification"].includes(policy.investigationKind), "invalid investigation kind");
  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  assert(nodes.size === graph.nodes.length, "duplicate node identity");
  for (const n of graph.nodes) {
    assert(canonicalOwnershipKey(n.id) === `fn:${n.id}`, "noncanonical node identity");
    assert(n.id === `${n.moduleSha256}:${normalizeEA(n.rva)}`, "node hash/RVA mismatch");
    assert(BigInt(n.ea) === BigInt(n.imageBase) + BigInt(n.rva), "invalid EA projection");
  }
  const eligible = (id: string): boolean => {
    const n = nodes.get(id); return !!n && n.status === "observed" && !["import", "external", "incomplete"].includes(n.functionClass);
  };
  if (allocation) for (const id of Object.keys(allocation.capsByFunction)) assert(eligible(id), "admission cap for unknown/inadmissible function");
  for (const e of graph.edges) assert(nodes.has(e.sourceId) && nodes.has(e.destinationId), "edge missing function endpoint");
  const relations = canonicalRelationView(graph, policy), { liveEdges } = relations;
  const isCall = isPlannerCall;
  const edgeKind = (e: PlannerEdge): Prerequisite["kind"] => relations.kinds.get(e.id)!;
  const outgoing = new Map<string, PlannerEdge[]>();
  for (const e of liveEdges) { const list = outgoing.get(e.sourceId) ?? []; list.push(e); outgoing.set(e.sourceId, list); }
  const diagnostics: Diagnostic[] = [];
  if (!graph.coverage.tailsIterated) diagnostics.push({ code: "partial-tail-coverage", unitId: null, functionIds: [], detail: "Tail coverage unknown; not a native-completeness proof" });
  const selectedFunctions = new Set<string>();
  const queue: string[] = [];
  const groupOwned = new Set<string>();
  for (const g of groups) {
    assert(g.partitionId === policy.partitionId, "group from different partition");
    for (const id of g.ownedFunctionIds) {
      assert(nodes.has(id) && !groupOwned.has(id), "unknown/duplicate group ownership"); groupOwned.add(id);
      if (eligible(id)) { selectedFunctions.add(id); queue.push(id); }
      else diagnostics.push({ code: "inadmissible-owned-function", unitId: null, functionIds: [id], detail: "Quarantined/incomplete/external function cannot be investigated" });
    }
    for (const id of g.contextFunctionIds) assert(nodes.has(id) && !g.ownedFunctionIds.includes(id), "invalid shared context");
  }
  // Mandatory callee closure precedes grouping/budget selection. No silently omitted callee.
  for (let i = 0; i < queue.length; i++) for (const e of outgoing.get(queue[i]!) ?? []) {
    if (edgeKind(e) === "obligatory" && eligible(e.destinationId) && !validDispensation(relations.dispensations.get(e.id), policy, graph.knowledgeRevision)
      && !selectedFunctions.has(e.destinationId)) { selectedFunctions.add(e.destinationId); queue.push(e.destinationId); }
  }
  const functionIds = [...selectedFunctions].sort(compareFunctionIds);
  const mandatoryCalls = liveEdges.filter(e => selectedFunctions.has(e.sourceId) && selectedFunctions.has(e.destinationId)
    && edgeKind(e) === "obligatory" && !validDispensation(relations.dispensations.get(e.id), policy, graph.knowledgeRevision));
  // SCCs describe confirmed control flow, not a policy-weakened G1 projection.
  // A waiver/optional edge cannot erase a real native recursive cycle/self-loop.
  const structuralCalls = liveEdges.filter(e => selectedFunctions.has(e.sourceId) && selectedFunctions.has(e.destinationId)
    && e.kind !== "callback_candidate" && ["observed", "validated"].includes(e.status));
  const condensation = stronglyConnectedComponents(functionIds, structuralCalls.map(e => ({ from: e.sourceId, to: e.destinationId })));
  const componentById = new Map(condensation.sccs.map(s => [s.id, s]));
  // Proposed merges must contain whole SCCs. Recursive SCCs stay exclusive, not absorbed into a cluster.
  const proposed: string[][] = [], assigned = new Set<string>();
  for (const group of [...groups].sort((a, b) => compareText(a.groupId, b.groupId))) {
    const ids = [...new Set(group.ownedFunctionIds.filter(id => selectedFunctions.has(id)).map(id => condensation.componentByNode.get(id)!))];
    const plain = ids.filter(id => !componentById.get(id)!.exclusive && !assigned.has(id));
    if (plain.length) { proposed.push(plain.flatMap(id => componentById.get(id)!.functionIds).sort(compareFunctionIds)); plain.forEach(id => assigned.add(id)); }
  }
  for (const s of condensation.sccs) if (!assigned.has(s.id)) proposed.push(s.functionIds);
  let families = proposed;
  const quotient = (members: string[][]): { owner: Map<string, string>; edges: DirectedEdge[]; order: string[] } => {
    const owner = new Map<string, string>();
    for (const fs of members) for (const id of fs) owner.set(id, unitIdentity(fs, policy.investigationKind));
    const ids = members.map(fs => unitIdentity(fs, policy.investigationKind));
    const edges = structuralCalls.map(e => ({ from: owner.get(e.destinationId)!, to: owner.get(e.sourceId)! })).filter(e => e.from !== e.to);
    return { owner, edges, order: topologicalOrder(ids, edges) };
  };
  let q: ReturnType<typeof quotient>;
  try { q = quotient(families); } catch (error) {
    diagnostics.push({ code: "artificial-quotient-cycle-separated", unitId: null, functionIds,
      detail: `Invalid family merges separated into true SCCs: ${String(error)}` });
    families = condensation.sccs.map(s => s.functionIds); q = quotient(families);
  }
  families.sort((a, b) => compareFunctionIds(a[0]!, b[0]!));
  // A policy-weakened selection must not hide the rest of a confirmed native
  // SCC. Keep ownership scoped: diagnose/defer partial SCCs instead of silently
  // investigating extra functions or pretending the selected fragment is acyclic.
  const nativeCondensation = stronglyConnectedComponents([...nodes.keys()], liveEdges
    .filter(e => e.kind !== "callback_candidate" && ["observed", "validated"].includes(e.status))
    .map(e => ({ from: e.sourceId, to: e.destinationId })));
  for (const s of nativeCondensation.sccs) {
    const present = s.functionIds.filter(id => selectedFunctions.has(id));
    if (!s.exclusive || present.length === 0 || present.length === s.functionIds.length) continue;
    for (const unitId of new Set(present.map(id => q.owner.get(id)!))) diagnostics.push({
      code: "partial-native-scc", unitId, functionIds: s.functionIds,
      detail: "Confirmed native SCC crosses the selected ownership scope; explicit whole-SCC replan required",
    });
  }
  const contextsByUnit = new Map<string, Set<string>>(), callsByUnit = new Map<string, PlannerEdge[]>();
  const unresolvedByUnit = new Map<string, PlannerGraphInput["unresolved"]>();
  for (const g of groups) for (const uid of new Set(g.ownedFunctionIds.map(id => q.owner.get(id)).filter((id): id is string => !!id))) {
    const set = contextsByUnit.get(uid) ?? new Set<string>();
    for (const id of g.contextFunctionIds) set.add(id);
    contextsByUnit.set(uid, set);
  }
  for (const e of mandatoryCalls) {
    const uid = q.owner.get(e.sourceId)!;
    if (uid === q.owner.get(e.destinationId)) { const list = callsByUnit.get(uid) ?? []; list.push(e); callsByUnit.set(uid, list); }
  }
  for (const ref of graph.unresolved) {
    const uid = q.owner.get(ref.fromFunctionId); if (!uid) continue;
    const list = unresolvedByUnit.get(uid) ?? []; list.push(ref); unresolvedByUnit.set(uid, list);
  }
  const requirementById: PlannerSidecar["requirementById"] = {}, dispensationById: PlannerSidecar["dispensationById"] = {}, externalReceiptById: PlannerSidecar["externalReceiptById"] = {};
  const localOrders: PlannerSidecar["localOrders"] = {}, estimatesByUnit: PlannerSidecar["estimatesByUnit"] = {}, resourcesByUnit: PlannerSidecar["resourcesByUnit"] = {};
  const envelopes: Record<string, number> = {};
  const admissionBudgets: Record<string, AdmissionUnitBudget> = {};
  const artifacts = new Map(graph.binaryArtifacts.map(a => [a.contentSha256, a]));
  assert(artifacts.size === graph.binaryArtifacts.length, "ambiguous binary hash/version projection");
  for (const a of graph.binaryArtifacts) { validateSHA(a.contentSha256); assert(nonempty(a.versionLabel), "missing binary version label"); }
  const units: WorkUnit[] = families.map(ownedFunctionIds => {
    const unitId = q.owner.get(ownedFunctionIds[0]!)!;
    const context = contextsByUnit.get(unitId) ?? new Set<string>();
    for (const id of ownedFunctionIds) context.delete(id);
    const sccIds = [...new Set(ownedFunctionIds.map(id => condensation.componentByNode.get(id)!))];
    const recursive = sccIds.some(id => componentById.get(id)!.exclusive);
    const localEdges = (callsByUnit.get(unitId) ?? [])
      .map(e => ({ from: condensation.componentByNode.get(e.destinationId)!, to: condensation.componentByNode.get(e.sourceId)! })).filter(e => e.from !== e.to);
    const order = topologicalOrder(sccIds, localEdges);
    const localFunctions = order.flatMap(id => componentById.get(id)!.functionIds);
    localOrders[unitId] = { sccIds: order, functionIds: localFunctions, recursive, maxIterations: recursive ? policy.sccMaxIterations : 1, publication: "whole-unit-only" };
    let known = true, cost = 0;
    const modelCosts: Record<string, number> = {};
    const modelSets: Set<string>[] = [];
    for (const id of ownedFunctionIds) {
      const estimate = policy.estimatesByFunction[id];
      if (!estimate || estimate.version !== policy.estimationVersion) { known = false; continue; }
      cost += pipelineCost(estimate);
      modelSets.push(new Set(Object.keys(estimate.byModel ?? {})));
      for (const [model, e] of Object.entries(estimate.byModel ?? {})) modelCosts[model] = (modelCosts[model] ?? 0) + pipelineCost(e);
    }
    for (const model of Object.keys(modelCosts)) if (modelSets.length !== ownedFunctionIds.length || modelSets.some(set => !set.has(model))) delete modelCosts[model];
    if (recursive) { cost *= policy.sccMaxIterations; for (const model of Object.keys(modelCosts)) modelCosts[model]! *= policy.sccMaxIterations; }
    assert(integer(cost), "unit estimate overflow");
    estimatesByUnit[unitId] = { version: policy.estimationVersion, cost: known ? { known: true, value: cost } : { known: false, value: null }, modelCosts };
    const rs = ownedFunctionIds.map(id => policy.resourcesByFunction[id]);
    if (rs.every(r => !!r)) {
      for (const r of rs) assert([r!.slots, r!.cpu, r!.gpu, r!.budget].every(n => integer(n)) && r!.slots > 0, "invalid resource estimate");
      const intersect = (key: "profiles" | "models" | "accounts"): string[] => rs[0]![key].filter(x => rs.every(r => r![key].includes(x))).sort(compareText);
      const max = (key: "slots" | "cpu" | "gpu" | "budget"): number => rs.reduce((largest, r) => Math.max(largest, r![key]), 0);
      resourcesByUnit[unitId] = { profiles: intersect("profiles"), models: intersect("models"), accounts: intersect("accounts"),
        tools: [...new Set(rs.flatMap(r => r!.tools))].sort(compareText), slots: max("slots"), cpu: max("cpu"), gpu: max("gpu"), budget: rs.reduce((sum, r) => sum + r!.budget, 0) };
    }
    if (recursive && (ownedFunctionIds.length > policy.sccMaxFunctions || !known || cost > policy.sccCostBudget)) diagnostics.push({ code: "scc-budget-bound", unitId, functionIds: ownedFunctionIds, detail: `SCC exclusive: size=${ownedFunctionIds.length}, iterations=${policy.sccMaxIterations}, cost=${known ? cost : "unknown"}; budget requires explicit replan` });
    const prefixByFunction = new Map(localFunctions.map(functionId => [functionId, `sub:${fingerprint({ unitId, functionId })}`]));
    const localPrerequisites = new Map(localFunctions.map(functionId => [functionId, new Set<string>()]));
    if (recursive) {
      for (let i = 1; i < localFunctions.length; i++) localPrerequisites.get(localFunctions[i]!)!.add(`${prefixByFunction.get(localFunctions[i - 1]!)}:R`);
    } else for (const e of callsByUnit.get(unitId) ?? []) localPrerequisites.get(e.sourceId)!.add(`${prefixByFunction.get(e.destinationId)}:R`);
    const subIntents: SubIntent[] = localFunctions.flatMap(functionId => {
      const n = nodes.get(functionId)!, artifact = artifacts.get(n.moduleSha256);
      assert(artifact && BigInt(artifact.imageBase) === BigInt(n.imageBase), "missing/mismatched binary artifact projection");
      const identity = { sha256: n.moduleSha256, version: artifact.versionLabel, ea: normalizeEA(n.ea) };
      const prefix = prefixByFunction.get(functionId)!;
      return (["A", "B", "R"] as const).map(role => ({ subIntentId: `${prefix}:${role}`, functionId, role, harnessIdentity: identity,
        waitsForSubIntentIds: role === "R" ? [`${prefix}:A`, `${prefix}:B`] : [...localPrerequisites.get(functionId)!].sort(compareText), sharesFamilyLease: true, outputDisjoint: true }));
    });
    const prerequisites: Prerequisite[] = [];
    for (const from of ownedFunctionIds) for (const e of outgoing.get(from) ?? []) {
      if (!isCall(e)) continue;
      let kind = edgeKind(e);
      // External evidence is not produced by a selected local family. Retain its
      // receipt requirement even inside that family, including invalidation checks.
      const producerUnitId = kind === "external_satisfied" ? null : q.owner.get(e.destinationId) ?? null;
      if (producerUnitId === unitId) continue;
      const id = `pre:${fingerprint({ relationVersion: 1, relationId: e.id, consumerUnitId: unitId })}`;
      const requested = policy.requirementsByFunction[e.destinationId];
      const requirement = validRequirement(requested) && requested.functionId === e.destinationId && requested.moduleSha256 === nodes.get(e.destinationId)!.moduleSha256 ? requested : undefined;
      if (requirement) requirementById[id] = requirement;
      const d = relations.dispensations.get(e.id), dispensed = validDispensation(d, policy, graph.knowledgeRevision);
      if (dispensed) dispensationById[id] = d;
      const external = relations.receipts.get(e.id);
      if (producerUnitId === null && eligible(e.destinationId) && kind === "obligatory" && !dispensed) {
        diagnostics.push({ code: "missing-obligatory-callee", unitId, functionIds: [e.destinationId], detail: "Mandatory callee is not in the closure" });
      } else if (producerUnitId === null && !eligible(e.destinationId)) {
        const n = nodes.get(e.destinationId)!;
        if (["import", "external"].includes(n.functionClass)) {
          kind = external && requirement && receiptSatisfies(requirement, external, null) ? "external_satisfied" : "unknown_unresolved";
        } else if (kind === "obligatory" && !dispensed) diagnostics.push({ code: "inadmissible-obligatory-callee", unitId, functionIds: [e.destinationId], detail: "Mandatory callee is quarantined/incomplete; consumer deferred" });
      }
      if (kind === "external_satisfied") {
        if (external && requirement && receiptSatisfies(requirement, external, null)) externalReceiptById[id] = external;
        else { kind = "unknown_unresolved"; diagnostics.push({ code: "unverified-external", unitId, functionIds: [e.destinationId], detail: "External satisfaction without verified receipt is unknown, non-blocking" }); }
      }
      prerequisites.push({ id, kind, producerUnitId, requiredPublicationLevel: requirement?.publicationLevel ?? policy.publicationLevel,
        artifactKind: requirement?.artifactKind ?? policy.artifactKind, dispensed, dispensationReason: dispensed ? d!.reason : null });
    }
    for (const ref of unresolvedByUnit.get(unitId) ?? []) if (ref.kind !== "data_xref") prerequisites.push({ id: `pre:${fingerprint({ ref: ref.id, unitId })}`, kind: "unknown_unresolved", producerUnitId: null,
      requiredPublicationLevel: policy.publicationLevel, artifactKind: policy.artifactKind, dispensed: false, dispensationReason: null });
    prerequisites.sort((a, b) => compareText(a.id, b.id));
    const conflicts: ConflictRef[] = ownedFunctionIds.map(functionId => ({ id: `conflict:${fingerprint({ unitId, functionId })}`, kind: "owned_function", resourceKey: canonicalOwnershipKey(functionId), withUnitId: null }));
    for (const p of prerequisites) if (p.kind === "obligatory" && !p.dispensed && p.producerUnitId) conflicts.push({
      id: `conflict:${p.id}`, kind: "blocking_dependency", resourceKey: `dependency:${p.id}`, withUnitId: p.producerUnitId });
    const extra = new Map<string, ConflictRef>();
    for (const functionId of ownedFunctionIds) for (const c of policy.extraConflictsByFunction?.[functionId] ?? []) {
      assert(nonempty(c.id) && nonempty(c.resourceKey), "unidentified exclusive resource");
      assert(["owned_function", "blocking_dependency", "non_isolated_file", "exclusive_write", "native_lease", "adapter_constraint"].includes(c.kind), "invalid conflict kind");
      const id = `conflict:${fingerprint({ unitId, sourceId: c.id, kind: c.kind, resourceKey: c.resourceKey, withUnitId: c.withUnitId })}`;
      extra.set(id, { ...c, id });
    }
    conflicts.push(...extra.values());
    conflicts.sort((a, b) => compareText(a.id, b.id));
    const unit: WorkUnit = { schemaVersion: 1, unitId, snapshotId: graph.snapshotId, partitionId: policy.partitionId,
      knowledgeRevision: graph.knowledgeRevision, ownedFunctionIds, contextFunctionIds: [...context].sort(compareFunctionIds),
      investigationKind: policy.investigationKind, pipeline: "2+1", subIntents, prerequisites, conflicts,
      estimatedCost: estimatesByUnit[unitId]!.cost, requiredPublicationLevel: policy.publicationLevel, state: "PENDING" };
    // Actual canonical envelope, including metadata, not String.length or SQLite length.
    const structuralBytes = Buffer.byteLength(canonical({ snapshotId: graph.snapshotId, snapshotFingerprint: graph.normalizedFingerprint,
      policyVersion: policy.version, unit, functions: [...ownedFunctionIds, ...unit.contextFunctionIds].map(id => nodes.get(id)),
      requirements: prerequisites.map(p => requirementById[p.id] ?? null), dispensations: prerequisites.map(p => dispensationById[p.id] ?? null) }), "utf8");
    if (budgetContext) {
      const { budget, issues } = admissionUnitBudget(structuralBytes, ownedFunctionIds, allocation);
      assert(budget.maxNewExecutions.value === subIntents.length, "admission execution profile differs from generated sub-intents");
      admissionBudgets[unitId] = budget;
      if (budget.admissionCapUtf8Bytes.known) envelopes[unitId] = budget.admissionCapUtf8Bytes.value!;
      for (const issue of issues) diagnostics.push({ ...issue, unitId });
    } else envelopes[unitId] = structuralBytes;
    return unit;
  });
  const byUnit = new Map(units.map(u => [u.unitId, u]));
  const g1Edges: G1Edge[] = liveEdges.filter(e => isCall(e) && q.owner.has(e.sourceId) && q.owner.has(e.destinationId) && q.owner.get(e.sourceId) !== q.owner.get(e.destinationId))
    .map(e => ({ fromUnitId: q.owner.get(e.destinationId)!, toUnitId: q.owner.get(e.sourceId)!,
      kind: edgeKind(e) === "obligatory" ? "obligatory" as const : edgeKind(e) === "optional" ? "optional" as const : "non_blocking" as const,
      callSourceFunctionId: e.sourceId, callDestinationFunctionId: e.destinationId, storedCallDirection: "source_to_destination" }));
  const selected = new Set<string>(), decisions: MissionPlan["decisions"] = [], decided = new Set<string>();
  let spent = 0;
  const budgetExcluded = new Set<string>();
  const blocked = new Set(diagnostics.filter(d => d.unitId !== null).map(d => d.unitId!));
  const record = (unitId: string, action: MissionPlan["decisions"][number]["action"], detail: string): void => {
    const reason = `${policy.version}@knowledge:${graph.knowledgeRevision}: ${detail}`;
    decisions.push({ id: `decision:${fingerprint({ unitId, action, reason })}`, unitId, action, reason });
    if (action !== "dispense") decided.add(unitId);
  };
  for (const u of units) for (const p of u.prerequisites) if (p.dispensed) record(u.unitId, "dispense", `${p.id}: ${p.dispensationReason}`);
  const roots = [...new Set(groups.flatMap(g => g.ownedFunctionIds.map(id => q.owner.get(id)).filter((id): id is string => !!id)))]
    .sort((a, b) => compareFunctionIds(byUnit.get(a)!.ownedFunctionIds[0]!, byUnit.get(b)!.ownedFunctionIds[0]!));
  for (const root of roots) {
    if (selected.has(root)) continue;
    const closure = new Set<string>(), pending = [root]; let failure: string | null = null, budgetFailure = false, bytes = 0;
    while (pending.length) {
      const id = pending.pop()!; if (selected.has(id) || closure.has(id)) continue;
      if (budgetExcluded.has(id)) { budgetFailure = true; break; }
      closure.add(id); const u = byUnit.get(id)!;
      if (budgetContext) {
        const charge = admissionBudgets[id]!.totalAdmissionUtf8Bytes;
        if (!charge.known) failure = "unknown/overflow complete-admission allocation in mandatory closure";
        else {
          // Subtract before adding. No unsafe intermediate sum, rounded total,
          // or partial closure can be admitted even at MAX_SAFE_INTEGER.
          if (charge.value! > policy.totalContextBudgetUtf8Bytes - spent - bytes) { budgetFailure = true; break; }
          bytes += charge.value!;
        }
        if (selected.size + closure.size > policy.maxSelectedUnits) { budgetFailure = true; break; }
      } else {
        bytes += envelopes[id]!;
        if (spent + bytes > policy.totalContextBudgetUtf8Bytes || selected.size + closure.size > policy.maxSelectedUnits) { budgetFailure = true; break; }
      }
      if (blocked.has(id)) failure = "dependency diagnostic/bound";
      if (envelopes[id]! > policy.contextEnvelopeMaxUtf8Bytes) failure = "context envelope exceeds UTF8-byte budget";
      for (const p of u.prerequisites) if (p.kind === "obligatory" && !p.dispensed) {
        if (!p.producerUnitId || !byUnit.has(p.producerUnitId)) failure = "missing obligatory producer";
        else pending.push(p.producerUnitId);
      }
    }
    if (failure) { record(root, "defer", failure); continue; }
    if (budgetFailure) { budgetExcluded.add(root); record(root, "exclude_budget", "whole mandatory closure does not fit; no partial consumer inclusion"); continue; }
    for (const id of [...closure].sort(compareText)) if (!selected.has(id)) { selected.add(id); record(id, "include", budgetContext
      ? "complete mandatory closure within complete-admission C*N budget" : "complete mandatory closure within budget"); }
    spent += bytes;
  }
  for (const u of units) if (!selected.has(u.unitId) && !decided.has(u.unitId)) record(u.unitId, "defer", "not selected by any admitted root closure");
  const contextOwners = new Map<string, string[]>();
  for (const u of units) for (const id of u.contextFunctionIds) { const list = contextOwners.get(id) ?? []; list.push(u.unitId); contextOwners.set(id, list); }
  const g3Affinities = [...contextOwners].filter(([, ids]) => ids.length > 1).sort(([a], [b]) => compareFunctionIds(a, b))
    .map(([id, ids]) => ({ unitIds: ids.sort(compareText), reason: `shared context:${id}`, blocking: false as const }));
  const planContent: Omit<MissionPlan, "fingerprint"> = { schemaVersion: 1,
    // New plans are fenced from earlier relation-policy semantics; existing
    // plan/unit identities are never migrated. Neither marker is a field in L1.
    planId: planningIdentity(graph.normalizedFingerprint, policy, families, budgetContext), missionId: graph.missionId,
    snapshotId: graph.snapshotId, partitionId: policy.partitionId, knowledgeRevision: graph.knowledgeRevision,
    units: units.map(u => ({ unitId: u.unitId, ownedFunctionIds: u.ownedFunctionIds, contextFunctionIds: u.contextFunctionIds,
      requiredPublicationLevel: u.requiredPublicationLevel, state: u.state, contextEnvelopeUtf8Bytes: budgetContext
        ? admissionBudgets[u.unitId]!.admissionCapUtf8Bytes : { known: true, value: envelopes[u.unitId]! } })),
    prerequisites: units.flatMap(u => u.prerequisites.map(p => ({ ...p, consumerUnitId: u.unitId }))), g1Edges,
    g2Conflicts: units.flatMap(u => u.conflicts), g3Affinities, sccs: condensation.sccs, selectedUnitIds: [...selected].sort(compareText), decisions,
    budgets: { unit: "utf8-bytes", contextEnvelopeMaxUtf8Bytes: policy.contextEnvelopeMaxUtf8Bytes, countsSqliteLength: false, nativeLineCharLimit: 2000 },
    policyVersion: policy.version, estimationVersion: policy.estimationVersion };
  const plan: MissionPlan = { ...planContent, fingerprint: fingerprint(planContent) };
  const sidecarContent: Omit<PlannerSidecar, "fingerprint"> = { schemaVersion: 1, policyVersion: policy.version, estimationVersion: policy.estimationVersion,
    planId: plan.planId, planFingerprint: plan.fingerprint, snapshotFingerprint: graph.normalizedFingerprint, knowledgeRevision: graph.knowledgeRevision,
    policy, relationView: relations.relationView, requirementById, dispensationById, externalReceiptById, localOrders, estimatesByUnit, resourcesByUnit, envelopeBytesByUnit: envelopes,
    unitFingerprints: Object.fromEntries(units.map(u => [u.unitId, unitContentFingerprint(u)])), diagnostics,
    ...(budgetContext ? { admissionBudget: { version: ADMISSION_ACCOUNTING_VERSION, context: budgetContext,
      allocationFingerprint: allocation?.fingerprint ?? null, byUnit: admissionBudgets, selectedTotalAdmissionUtf8Bytes: spent } } : {}) };
  const sidecar: PlannerSidecar = { ...sidecarContent, fingerprint: fingerprint(sidecarContent) };
  const bindingContent = { schemaVersion: 1 as const, planFingerprint: plan.fingerprint, sidecarFingerprint: sidecar.fingerprint };
  return freeze({ plan, units, sidecar, diagnostics, binding: { ...bindingContent, fingerprint: fingerprint(bindingContent) } });
}

/** Validate the allocation commitment and its accounting after JSON readback.
 * This is not the triple-document binding or a host/L6 authority proof. In
 * particular, L8 must derive expectedContext from its current validated inputs,
 * and still check the original durable binding and the real snapshot. */
export function assertAdmissionBudgetBinding(plan: MissionPlan, sidecar: PlannerSidecar, expectedContext: AdmissionBudgetContextV1): void {
  assertBudgetJson([plan, sidecar, expectedContext]);
  assert(admissionMode(sidecar.policy, expectedContext), "explicit admission budget mode required");
  const allocation = validateAdmissionAllocation(sidecar.policy, expectedContext);
  assertAdmissionScope(expectedContext, { missionId: plan.missionId, snapshotId: plan.snapshotId,
    normalizedFingerprint: sidecar.snapshotFingerprint, knowledgeRevision: plan.knowledgeRevision }, sidecar.policy);
  assert(plan.schemaVersion === 1 && sidecar.schemaVersion === 1 && plan.fingerprint === digestDocument(plan)
    && sidecar.fingerprint === digestDocument(sidecar), "admission plan/sidecar digest mismatch");
  assert(sidecar.planId === plan.planId && sidecar.planFingerprint === plan.fingerprint && sidecar.policyVersion === plan.policyVersion
    && sidecar.policy.version === plan.policyVersion && sidecar.estimationVersion === plan.estimationVersion
    && sidecar.policy.estimationVersion === plan.estimationVersion && sidecar.knowledgeRevision === plan.knowledgeRevision
    && sidecar.policy.partitionId === plan.partitionId, "incoherent admission planning documents");
  const policy = sidecar.policy, accounting = sidecar.admissionBudget;
  assert(Object.hasOwn(sidecar, "admissionBudget") && accounting, "missing admission accounting");
  budgetKeys(accounting, ["version", "context", "allocationFingerprint", "byUnit", "selectedTotalAdmissionUtf8Bytes"]);
  assert(accounting.version === ADMISSION_ACCOUNTING_VERSION && canonical(accounting.context) === canonical(expectedContext)
    && accounting.allocationFingerprint === (allocation?.fingerprint ?? null), "admission accounting context/allocation/version mismatch");
  assert([policy.contextEnvelopeMaxUtf8Bytes, policy.totalContextBudgetUtf8Bytes, policy.maxSelectedUnits].every(n => integer(n))
    && plan.budgets.contextEnvelopeMaxUtf8Bytes === policy.contextEnvelopeMaxUtf8Bytes, "invalid/inconsistent admission planning bounds");
  assert(Array.isArray(plan.units) && Array.isArray(plan.selectedUnitIds), "invalid admission unit sets");
  const unitIds = plan.units.map(u => u.unitId), selected = new Set(plan.selectedUnitIds);
  assert(new Set(unitIds).size === unitIds.length && selected.size === plan.selectedUnitIds.length
    && selected.size <= policy.maxSelectedUnits, "duplicate/excess admission unit selection");
  budgetKeys(accounting.byUnit, unitIds); budgetKeys(sidecar.unitFingerprints, unitIds);
  const expectedEnvelopes: string[] = [], families: string[][] = [];
  const owned = new Set<string>();
  let total = 0;
  for (const unit of plan.units) {
    assert(Array.isArray(unit.ownedFunctionIds) && unit.ownedFunctionIds.length > 0, "missing admission unit ownership");
    for (const id of unit.ownedFunctionIds) {
      assert(canonicalOwnershipKey(id) === `fn:${id}` && !owned.has(id), "noncanonical/duplicate admission function ownership"); owned.add(id);
    }
    assert(unit.unitId === unitIdentity(unit.ownedFunctionIds, policy.investigationKind), "admission allocation changed family identity");
    families.push(unit.ownedFunctionIds);
    const entry = accounting.byUnit[unit.unitId]!;
    budgetKeys(entry, ["structuralEnvelopeUtf8Bytes", "admissionCapUtf8Bytes", "maxNewExecutions", "totalAdmissionUtf8Bytes"]);
    const { budget } = admissionUnitBudget(entry.structuralEnvelopeUtf8Bytes, unit.ownedFunctionIds, allocation);
    assert(canonical(entry) === canonical(budget), "inconsistent admission S/C/N/T accounting");
    assert(canonical(unit.contextEnvelopeUtf8Bytes) === canonical(budget.admissionCapUtf8Bytes), "plan admission cap differs from accounting");
    if (budget.admissionCapUtf8Bytes.known) {
      expectedEnvelopes.push(unit.unitId);
      assert(sidecar.envelopeBytesByUnit[unit.unitId] === budget.admissionCapUtf8Bytes.value, "sidecar admission cap differs from accounting");
    }
    if (selected.has(unit.unitId)) {
      assert(budget.admissionCapUtf8Bytes.known && budget.admissionCapUtf8Bytes.value! <= policy.contextEnvelopeMaxUtf8Bytes
        && budget.totalAdmissionUtf8Bytes.known && !sidecar.diagnostics.some(d => d.unitId === unit.unitId), "unallocable/diagnostic admission unit selected");
      assert(budget.totalAdmissionUtf8Bytes.value! <= policy.totalContextBudgetUtf8Bytes - total, "admission selection exceeds safe total budget");
      total += budget.totalAdmissionUtf8Bytes.value!;
    }
  }
  budgetKeys(sidecar.envelopeBytesByUnit, expectedEnvelopes);
  assert(plan.selectedUnitIds.every(id => unitIds.includes(id)), "unknown selected admission unit");
  const included = plan.decisions.filter(d => d.action === "include").map(d => d.unitId);
  assert(included.length === selected.size && new Set(included).size === included.length && included.every(id => selected.has(id)), "admission decisions differ from selection");
  for (const p of plan.prerequisites) if (selected.has(p.consumerUnitId) && p.kind === "obligatory" && !p.dispensed) {
    assert(p.producerUnitId !== null && selected.has(p.producerUnitId), "incomplete mandatory admission closure");
  }
  assert(integer(accounting.selectedTotalAdmissionUtf8Bytes) && accounting.selectedTotalAdmissionUtf8Bytes === total, "admission selected total mismatch");
  assert(plan.planId === planningIdentity(sidecar.snapshotFingerprint, policy, families, expectedContext), "admission plan identity changed; explicit replan required");
}

export interface ReadinessInput {
  plan: MissionPlan; sidecar?: PlannerSidecar; unit: WorkUnit; receipts: readonly ArtifactReceipt[];
  expectedSidecarFingerprint: string;
  snapshotFingerprint: string; knowledgeRevision: number; validContext: boolean; cancelled: boolean;
  admissionBudgetContext?: AdmissionBudgetContextV1;
}
export interface Readiness { ready: boolean; reasons: string[] }
export function evaluateReadiness(input: ReadinessInput): Readiness {
  try { return evaluateReadinessChecked(input, coherentDocuments(input)); }
  catch { return { ready: false, reasons: ["malformed sidecar/plan/requirement; fail closed"] }; }
}
function coherentDocuments(input: Pick<ReadinessInput, "plan" | "sidecar" | "expectedSidecarFingerprint" | "snapshotFingerprint" | "admissionBudgetContext">): boolean {
  const { plan, sidecar } = input;
  try {
    if (!sidecar) return false;
    // Inspect the carrier before dereferencing policy: no accessor can smuggle
    // a new mode/cap into the legacy reader. Legacy version names stay opaque.
    const descriptor = Object.getOwnPropertyDescriptor(sidecar, "policy");
    if (!descriptor || !("value" in descriptor)) return false;
    const budgetMode = admissionMode(descriptor.value, input.admissionBudgetContext);
    if (budgetMode) assertAdmissionBudgetBinding(plan, sidecar, input.admissionBudgetContext!);
    else if ("admissionBudget" in sidecar) return false;
    return sidecar.schemaVersion === 1 && digestDocument(sidecar) === sidecar.fingerprint && digestDocument(plan) === plan.fingerprint
    && sidecar.planId === plan.planId && sidecar.planFingerprint === plan.fingerprint && sidecar.policyVersion === plan.policyVersion
    && sidecar.policy.version === sidecar.policyVersion && sidecar.estimationVersion === plan.estimationVersion
    && sidecar.fingerprint === input.expectedSidecarFingerprint && sidecar.snapshotFingerprint === input.snapshotFingerprint;
  }
  catch { return false; }
}
function receiptIndexKey(producerUnitId: string | null, artifactId: string, functionId: string): string { return JSON.stringify([producerUnitId, artifactId, functionId]); }
function invalidationIndexKey(artifactId: string, functionId: string): string { return JSON.stringify([artifactId, functionId]); }
function indexInvalidations(receipts: readonly ArtifactReceipt[]): Map<string, ArtifactReceipt[]> {
  const index = new Map<string, ArtifactReceipt[]>();
  for (const r of receipts) if (r.futurePrerequisiteEffect === "invalidates_future") {
    const key = invalidationIndexKey(r.artifactId, r.functionId), list = index.get(key) ?? []; list.push(r); index.set(key, list);
  }
  return index;
}
function evaluateReadinessChecked(input: ReadinessInput, documentsCoherent: boolean,
  selected = new Set(input.plan.selectedUnitIds), diagnosticUnits = new Set(input.sidecar?.diagnostics.filter(d => d.unitId !== null).map(d => d.unitId!) ?? []),
  receiptIndex?: Map<string, ArtifactReceipt[]>, invalidationIndex = indexInvalidations(input.receipts)): Readiness {
  const { plan, sidecar, unit } = input, reasons: string[] = [];
  if (input.cancelled || !["PENDING", "BLOCKED", "READY", "RETRYABLE"].includes(unit.state)) reasons.push("not dispatchable state/cancelled");
  if (!input.validContext) reasons.push("invalid context");
  if (!documentsCoherent || sidecar?.unitFingerprints[unit.unitId] !== unitContentFingerprint(unit)) reasons.push("missing/incoherent immutable sidecar/plan/unit");
  if (plan.knowledgeRevision !== input.knowledgeRevision || unit.knowledgeRevision !== input.knowledgeRevision
    || unit.snapshotId !== plan.snapshotId || unit.partitionId !== plan.partitionId || sidecar?.knowledgeRevision !== input.knowledgeRevision) reasons.push("stale revision/snapshot/partition");
  if (!selected.has(unit.unitId)) reasons.push("unit not selected");
  const bytes = sidecar?.envelopeBytesByUnit[unit.unitId];
  if (bytes === undefined || bytes > plan.budgets.contextEnvelopeMaxUtf8Bytes) reasons.push("invalid/excess context budget");
  if (diagnosticUnits.has(unit.unitId)) reasons.push("unit diagnostic requires explicit replan");
  for (const p of unit.prerequisites) {
    if (p.dispensed) {
      const d = sidecar?.dispensationById[p.id];
      if (!sidecar || !validDispensation(d, sidecar.policy, input.knowledgeRevision) || d.reason !== p.dispensationReason) reasons.push(`invalid versioned dispensation:${p.id}`);
      continue;
    }
    if (p.kind !== "obligatory" && p.kind !== "external_satisfied") continue;
    const r = sidecar?.requirementById[p.id];
    if (!validRequirement(r) || r.artifactKind !== p.artifactKind || r.publicationLevel !== p.requiredPublicationLevel) { reasons.push(`missing/inconsistent artifact requirement:${p.id}`); continue; }
    const receipts = p.kind === "external_satisfied" ? [sidecar?.externalReceiptById[p.id]].filter((x): x is ArtifactReceipt => !!x)
      : receiptIndex ? receiptIndex.get(receiptIndexKey(p.producerUnitId, r.artifactId, r.functionId)) ?? [] : input.receipts;
    const invalidations = invalidationIndex.get(invalidationIndexKey(r.artifactId, r.functionId)) ?? [];
    if (!receipts.some(receipt => receiptSatisfies(r, receipt, p.producerUnitId)
      && !invalidations.some(invalidation => invalidatesReceipt(r, receipt, invalidation)))) reasons.push(`unsatisfied committed artifact:${p.id}`);
  }
  return { ready: reasons.length === 0, reasons };
}

/** R is same-function A+B only. No context reuse: identity/session admission remains adapter-owned. */
export function readySubIntents(unit: WorkUnit, completedSubIntentIds: readonly string[] = [], runningSubIntentIds: readonly string[] = []): SubIntent[] {
  const done = new Set(completedSubIntentIds), running = new Set(runningSubIntentIds);
  return unit.subIntents.filter(s => !done.has(s.subIntentId) && !running.has(s.subIntentId) && s.waitsForSubIntentIds.every(id => done.has(id)));
}

export interface ActiveUnit { unit: WorkUnit; familyLeaseKey: string; planId: string; workerMayStillRun: boolean }
export function unitsConflict(a: WorkUnit, b: WorkUnit): boolean {
  if (a.unitId === b.unitId) return true; // a second family admission is never A/B sharing
  const keys = new Set(a.ownedFunctionIds.map(canonicalOwnershipKey));
  if (b.ownedFunctionIds.some(id => keys.has(canonicalOwnershipKey(id)))) return true;
  const aResources = new Set(a.conflicts.filter(c => c.kind !== "blocking_dependency").map(c => c.resourceKey));
  if (b.conflicts.some(c => c.kind !== "blocking_dependency" && aResources.has(c.resourceKey))) return true;
  return [...a.conflicts.map(c => ({ c, other: b.unitId })), ...b.conflicts.map(c => ({ c, other: a.unitId }))]
    .some(({ c, other }) => c.withUnitId === other);
}

export type PriorityPolicy = "fifo" | "depth" | "critical_path" | "critical_path_influence" | "heft_like";
export interface AgingEvent { eventNumber: number; quantum: number; version: string }
export interface RankInput { readyAtEvent: Record<string, number>; aging: AgingEvent; policy: PriorityPolicy }
export interface UnitRank {
  unitId: string; score: number; depth: number; influence: number; influenceMetric: "downstream-path-count-v1";
  criticalPath: number | null; ageTier: number; readyAtEvent: number; estimationVersion: string; agingVersion: string; agingEventNumber: number;
}
export function rankUnits(result: PlannerResult, input: RankInput): UnitRank[] {
  assert(integer(input.aging.eventNumber) && integer(input.aging.quantum, 1) && nonempty(input.aging.version), "aging must be a versioned replay event");
  const ids = result.units.map(u => u.unitId), byId = new Map(result.units.map(u => [u.unitId, u]));
  const prerequisites = result.plan.prerequisites.filter(p => p.kind === "obligatory" && !p.dispensed && p.producerUnitId !== null);
  const edges = prerequisites.map(p => ({ from: p.producerUnitId!, to: p.consumerUnitId }));
  const order = topologicalOrder(ids, edges), next = new Map(ids.map(id => [id, new Set<string>()]));
  for (const e of edges) next.get(e.from)!.add(e.to);
  const depth = new Map<string, number>(), rank = new Map<string, number | null>(), influence = new Map<string, number>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]!, est = result.sidecar.estimatesByUnit[id]!;
    const known = est.version === result.plan.estimationVersion && est.cost.known && est.cost.value !== null;
    if (!["fifo", "depth"].includes(input.policy)) assert(known, `unknown versioned estimate:${id}`);
    const allowedModels = new Set(result.sidecar.resourcesByUnit[id]?.models ?? []);
    const costs = Object.keys(est.modelCosts).filter(model => allowedModels.has(model)).sort(compareText).map(model => est.modelCosts[model]!);
    const cost = known ? (input.policy === "heft_like" && costs.length ? costs.reduce((mean, n) => mean + n / costs.length, 0) : est.cost.value!) : null;
    let d = 0, r: number | null = 0, paths = 0;
    for (const to of next.get(id)!) { d = Math.max(d, depth.get(to)! + 1); const consumerRank = rank.get(to)!;
      r = r === null || consumerRank === null ? null : Math.max(r, consumerRank);
      paths = Math.min(Number.MAX_SAFE_INTEGER, paths + 1 + influence.get(to)!); }
    const value = cost === null || r === null ? null : cost + r;
    assert(value === null || (Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER), "rank estimate overflow");
    depth.set(id, d); rank.set(id, value); influence.set(id, paths);
  }
  const ranks = ids.map(id => {
    const event = input.readyAtEvent[id]; assert(event !== undefined && integer(event) && event <= input.aging.eventNumber, `missing/invalid ready event:${id}`);
    const criticalPath = rank.get(id)!, d = depth.get(id)!, inf = influence.get(id)!;
    const score = input.policy === "fifo" ? 0 : input.policy === "depth" ? d : criticalPath!;
    return { unitId: byId.get(id)!.unitId, score, depth: d, influence: inf, influenceMetric: "downstream-path-count-v1" as const, criticalPath,
      ageTier: Math.floor((input.aging.eventNumber - event) / input.aging.quantum), readyAtEvent: event, estimationVersion: result.plan.estimationVersion,
      agingVersion: input.aging.version, agingEventNumber: input.aging.eventNumber };
  });
  return ranks.sort((a, b) => b.ageTier - a.ageTier || b.score - a.score
    || (input.policy === "critical_path_influence" ? b.influence - a.influence : 0)
    || a.readyAtEvent - b.readyAtEvent || compareFunctionIds(byId.get(a.unitId)!.ownedFunctionIds[0]!, byId.get(b.unitId)!.ownedFunctionIds[0]!) || compareText(a.unitId, b.unitId));
}

export interface WorkerCapacity {
  workerId: string; profile: string; model: string; tools: string[]; accountId: string;
  slots: number; cpu: number; gpu: number; budget: number; available: boolean;
}
export interface AccountCapacity { accountId: string; slots: number; budget: number }
// AccountCapacity/WorkerCapacity describe REMAINING availability after all active reservations,
// not advertised provider maxima. Only the fenced store can authoritatively supply this snapshot.
export interface AdmissionCandidate { unit: WorkUnit; readiness: Readiness; requirements?: ResourceRequirement; modelCosts?: Record<string, number> }
export interface Assignment { unitId: string; workerId: string; familyLeaseKey: string; accountId: string }
export function selectCompatible(
  candidates: readonly AdmissionCandidate[], workers: readonly WorkerCapacity[], accounts: readonly AccountCapacity[],
  active: readonly ActiveUnit[],
): { assignments: Assignment[]; rejected: Array<{ unitId: string; reason: string }> } {
  const assignments: Assignment[] = [], rejected: Array<{ unitId: string; reason: string }> = [];
  // Do not infer lease release/worker termination from a state or expiration. The
  // store removes a family from this list only after its authoritative release proof.
  const busy = active.map(a => a.unit);
  const accountRemaining = new Map(accounts.map(a => [a.accountId, { ...a }]));
  assert(accountRemaining.size === accounts.length, "duplicate shared account");
  for (const a of accounts) assert(integer(a.slots) && integer(a.budget), "invalid account availability");
  const available = [...workers].filter(w => [w.slots, w.cpu, w.gpu, w.budget].every(n => integer(n))
    && nonempty(w.workerId) && nonempty(w.profile) && nonempty(w.model) && nonempty(w.accountId)).sort((a, b) => compareText(a.workerId, b.workerId));
  assert(new Set(workers.map(w => w.workerId)).size === workers.length, "duplicate worker");
  const usedWorkers = new Set<string>();
  for (const candidate of candidates) {
    const u = candidate.unit, r = candidate.requirements;
    if (!candidate.readiness.ready) { rejected.push({ unitId: u.unitId, reason: candidate.readiness.reasons.join("; ") }); continue; }
    if (busy.some(other => unitsConflict(u, other))) { rejected.push({ unitId: u.unitId, reason: "G2 conflict with active family (including old plans)" }); continue; }
    if (!r || !r.profiles.length || !r.models.length || !r.accounts.length || ![r.slots, r.cpu, r.gpu, r.budget].every(n => integer(n)) || r.slots < 1) { rejected.push({ unitId: u.unitId, reason: "missing/invalid compatible resource requirements" }); continue; }
    const orderedWorkers = candidate.modelCosts ? [...available].sort((a, b) =>
      (candidate.modelCosts![a.model] ?? Number.MAX_SAFE_INTEGER) - (candidate.modelCosts![b.model] ?? Number.MAX_SAFE_INTEGER) || compareText(a.workerId, b.workerId)) : available;
    const w = orderedWorkers.find(w => {
      const account = accountRemaining.get(w.accountId);
      return w.available === true && !usedWorkers.has(w.workerId) && r.profiles.includes(w.profile) && r.models.includes(w.model)
        && r.accounts.includes(w.accountId) && r.tools.every(t => w.tools.includes(t)) && w.slots >= r.slots && w.cpu >= r.cpu && w.gpu >= r.gpu && w.budget >= r.budget
        && !!account && account.slots >= r.slots && account.budget >= r.budget;
    });
    if (!w) { rejected.push({ unitId: u.unitId, reason: "no compatible worker/shared account quota" }); continue; }
    const account = accountRemaining.get(w.accountId)!; account.slots -= r.slots; account.budget -= r.budget;
    usedWorkers.add(w.workerId); busy.push(u);
    assignments.push({ unitId: u.unitId, workerId: w.workerId, familyLeaseKey: `family:${u.unitId}`, accountId: w.accountId });
  }
  return { assignments, rejected };
}

/** Pure dispatch preflight, not an atomic lease transaction. L6/L8 must fence and recheck on reservation. */
export function selectReadyUnits(result: PlannerResult, input: RankInput, readiness: Omit<ReadinessInput, "plan" | "sidecar" | "unit">,
  workers: readonly WorkerCapacity[], accounts: readonly AccountCapacity[], active: readonly ActiveUnit[]) {
  const byId = new Map(result.units.map(u => [u.unitId, u]));
  const ranks = rankUnits(result, input);
  const documentsCoherent = coherentDocuments({ ...readiness, plan: result.plan, sidecar: result.sidecar });
  const selected = new Set(result.plan.selectedUnitIds), diagnosticUnits = new Set(result.diagnostics.filter(d => d.unitId !== null).map(d => d.unitId!));
  const receiptIndex = new Map<string, ArtifactReceipt[]>();
  for (const r of readiness.receipts) { const key = receiptIndexKey(r.producerUnitId, r.artifactId, r.functionId), list = receiptIndex.get(key) ?? []; list.push(r); receiptIndex.set(key, list); }
  const invalidationIndex = indexInvalidations(readiness.receipts);
  const candidates = ranks.map(rank => { const unit = byId.get(rank.unitId)!; return { unit,
    readiness: evaluateReadinessChecked({ ...readiness, plan: result.plan, sidecar: result.sidecar, unit }, documentsCoherent, selected, diagnosticUnits, receiptIndex, invalidationIndex), requirements: result.sidecar.resourcesByUnit[unit.unitId],
    modelCosts: input.policy === "heft_like" ? result.sidecar.estimatesByUnit[unit.unitId]?.modelCosts : undefined }; });
  return { ranks, ...selectCompatible(candidates, workers, accounts, active) };
}

/** Explicit offline ablation; grouping never replaces per-function A/B/R identities or launches. */
export function compareGranularities(graph: PlannerGraphInput, groups: readonly PlannerGroupInput[], policy: PlannerPolicy) {
  const perFunction = groups.flatMap(g => g.ownedFunctionIds.map(id => ({ groupId: `single:${id}`, partitionId: g.partitionId,
    ownedFunctionIds: [id], contextFunctionIds: g.contextFunctionIds.filter(contextId => contextId !== id) })));
  const variants = ([['function-or-true-scc', perFunction], ['requested-family-or-true-scc', groups]] as const).map(([granularity, input]) => {
    const result = planMission(graph, input, policy);
    const costs = result.units.map(u => u.estimatedCost);
    const known = costs.every(c => c.known && c.value !== null);
    return { granularity, familyAdmissions: result.units.length, scientificSubIntentCount: result.units.reduce((sum, u) => sum + u.subIntents.length, 0),
      recursiveUnits: result.plan.sccs.filter(s => s.exclusive).length, largestFamily: result.units.reduce((max, u) => Math.max(max, u.ownedFunctionIds.length), 0),
      estimatedWork: known ? { known: true, value: costs.reduce((sum, c) => sum + c.value!, 0) } : { known: false, value: null },
      contextEnvelopeUtf8Bytes: Object.values(result.sidecar.envelopeBytesByUnit).reduce((sum, n) => sum + n, 0),
      obligatoryDependencyCount: result.plan.prerequisites.filter(p => p.kind === "obligatory" && !p.dispensed).length,
      diagnostics: result.diagnostics.map(d => d.code), planFingerprint: result.plan.fingerprint };
  });
  return freeze({ estimationVersion: policy.estimationVersion, policyVersion: policy.version, variants });
}
