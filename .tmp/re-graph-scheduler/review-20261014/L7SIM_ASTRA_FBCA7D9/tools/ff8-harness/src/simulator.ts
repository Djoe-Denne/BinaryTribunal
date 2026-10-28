/** Deterministic OFFLINE fixture simulator, not a SQLite/native safety proof.
 * Immutable exports in; event trace out. No planner/SCC/clustering/LLM calls.
 * Kahn conformance + temporal test oracles are independent of L5 lowlinks.
 */
import { isAbsolute, resolve, relative } from "node:path";
import { canonical, fingerprint, hash } from "./validation";
import type { PlannerResult, ArtifactRequirement, ArtifactReceipt, Dispensation, ResourceRequirement, PlannerRelation, Diagnostic } from "./planner";

export const SIM_RESOURCE_MODEL = "l5-whole-unit-envelope-per-execution-v2" as const;
export const SIM_RESOURCE_LIMIT = "Conservative SIM envelope per execution; NOT equivalent to L5 family packing. A simulated refusal proves neither L5 infeasibility nor real saturation.";
export type SimResources = { kind: "required"; requirement: ResourceRequirement } | { kind: "unknown"; reason: string } | { kind: "unrestricted" };
export interface SimExportSource {
  policyVersion: string; estimationVersion: string; knowledgeRevision: number;
  planFingerprint: string; sidecarFingerprint: string; bindingFingerprint: string;
  relations: PlannerRelation[]; prerequisites: PlannerResult["plan"]["prerequisites"]; diagnostics: Diagnostic[];
  dispensations: Record<string, Dispensation>; externalReceipts: Record<string, ArtifactReceipt>;
}

export type SimPublicationLevel = 1 | 2;
export type SimUnitState = "PENDING" | "BLOCKED" | "READY" | "RESERVED" | "RUNNING" | "VALIDATING" | "COMMITTED" | "RETRYABLE" | "FAILED" | "STALE" | "CANCELLED" | "STOP_PENDING" | "QUARANTINED";
export type SimRole = "A" | "B" | "R";
export type SimPolicyKind = "sequential" | "fixed_groups" | "levels" | "fifo" | "event_driven" | "critical_path" | "heterogeneous";
export type SimErrorCode = "plan_non_conformant" | "unknown_unit" | "duplicate_commit" | "fenced_late_commit" | "horizon_exceeded" | "unsafe_manifest_path" | "invalid_config";
export class SimError extends Error {
  constructor(readonly code: SimErrorCode, message: string, readonly detail?: unknown) { super(`simulator[${code}]: ${message}`); }
}
export interface SimPrerequisite {
  id?: string; relationId?: string; callSourceFunctionId?: string; callDestinationFunctionId?: string;
  producerUnitId: string | null;
  kind: "obligatory" | "optional" | "external_satisfied" | "unknown_unresolved" | "non_blocking";
  requiredPublicationLevel: SimPublicationLevel; dispensed: boolean; dispensationReason?: string | null;
  requirement?: ArtifactRequirement;
  dispensation?: Dispensation; externalReceipt?: ArtifactReceipt;
}
export interface SimUnitInput {
  unitId: string; ownedFunctionIds: string[]; contextFunctionIds: string[];
  investigationKind: "structural" | "decompilation" | "semantification";
  requiredProfile?: string; requiredProfiles?: string[]; requiredAccounts?: string[]; requiredTools?: string[]; requiredPublicationLevel: SimPublicationLevel;
  prerequisites: SimPrerequisite[]; conflicts: Array<{ resourceKey: string; withUnitId?: string | null; kind?: string }>;
  sccExclusive?: boolean; knowledgeRevision: number; contextManifestLines?: string[]; outputArtifacts?: ArtifactRequirement[];
  subIntents?: Array<{ subIntentId: string; functionId: string; role: SimRole; waitsForSubIntentIds: string[] }>;
  allocatedEnvelopeUtf8Bytes?: number;
  resources?: SimResources;
}
export interface SimG1EdgeInput { fromUnitId: string; toUnitId: string; kind: "obligatory" | "optional" | "non_blocking"; callSourceFunctionId: string; callDestinationFunctionId: string }
export interface SimPlanInput {
  projectionVersion?: 2; resourceSemantics?: typeof SIM_RESOURCE_MODEL; resourceModelLimit?: string; source?: SimExportSource;
  planId: string; missionId: string; knowledgeRevision: number; units: SimUnitInput[];
  g1Edges: SimG1EdgeInput[]; g2Conflicts: Array<{ id: string; resourceKey: string }>;
  budgets: { contextEnvelopeMaxUtf8Bytes: number; nativeLineCharLimit: number };
  selectedUnitIds?: string[];
  decisions?: Array<{ id: string; unitId: string; action: "include" | "defer" | "dispense" | "exclude_budget"; reason: string }>;
}
export interface SimDiagnostic { code: string; unitId?: string; detail: string }
const textOrder = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const blocking = (p: SimPrerequisite): boolean => p.kind === "obligatory" && !p.dispensed;
const pairKey = (a: string, b: string): string => JSON.stringify([a, b]);
const dimension = (n: unknown, minimum = 0): n is number => typeof n === "number" && Number.isSafeInteger(n) && !Object.is(n, -0) && n >= minimum;
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === "string" && x.trim().length > 0) && new Set(v).size === v.length;
function sum(a: number, b: number): number { const n = a + b; if (!dimension(n)) throw new SimError("invalid_config", "integer tick/resource overflow"); return n; }
function validResources(r: ResourceRequirement): boolean {
  return !!r && [r.profiles, r.models, r.accounts, r.tools].every(strings) && dimension(r.slots, 1) && [r.cpu, r.gpu, r.budget].every(n => dimension(n));
}
function citedRelation(u: SimUnitInput, p: SimPrerequisite, relations: Map<string, PlannerRelation>): PlannerRelation | undefined {
  const e = p.relationId ? relations.get(p.relationId) : undefined;
  return e && p.id === `pre:${fingerprint({ relationVersion: 1, relationId: e.relationId, consumerUnitId: u.unitId })}` && e.sourceId === p.callSourceFunctionId && e.destinationId === p.callDestinationFunctionId && u.ownedFunctionIds.includes(e.sourceId) ? e : undefined;
}
function documentedDefer(plan: SimPlanInput, u: SimUnitInput, p: SimPrerequisite, selected: Set<string>, relations: Map<string, PlannerRelation>, prerequisites: Map<string, SimExportSource["prerequisites"][number]>, diagnostics: Map<string, Diagnostic[]>): boolean {
  const q = p.id ? prerequisites.get(p.id) : undefined;
  return plan.projectionVersion === 2 && !!plan.source && !selected.has(u.unitId) && !!citedRelation(u, p, relations) &&
    !!q && q.consumerUnitId === u.unitId && q.kind === "obligatory" && q.producerUnitId === null && !q.dispensed &&
    !!plan.decisions?.some(d => d.unitId === u.unitId && d.action === "defer") &&
    !!diagnostics.get(u.unitId)?.some(d => ["inadmissible-obligatory-callee", "missing-obligatory-callee"].includes(d.code) && d.functionIds.includes(p.callDestinationFunctionId!));
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const item of Object.values(value)) freeze(item); }
  return value;
}
/** O(N+E), no graph search per edge and no conflict-pair matrix. */
export function validateSimPlan(plan: SimPlanInput): SimDiagnostic[] {
  const diagnostics: SimDiagnostic[] = [], byId = new Map<string, SimUnitInput>(), owners = new Map<string, string>();
  const relations = new Map(plan.source?.relations.map(r => [r.relationId, r])), sourcePrerequisites = new Map(plan.source?.prerequisites.map(p => [p.id, p])), sourceDiagnostics = new Map<string, Diagnostic[]>();
  for (const d of plan.source?.diagnostics ?? []) if (d.unitId !== null) { const list = sourceDiagnostics.get(d.unitId) ?? []; list.push(d); sourceDiagnostics.set(d.unitId, list); }
  const add = (code: string, detail: string, unitId?: string) => diagnostics.push({ code, detail, unitId });
  if ((plan.projectionVersion !== undefined && plan.projectionVersion !== 2) || ((plan.source || plan.resourceSemantics !== undefined) && plan.projectionVersion !== 2) || (plan.projectionVersion === 2 && plan.resourceSemantics !== SIM_RESOURCE_MODEL)) add("unsupported_projection_version", "no export fallback to legacy assumptions");
  if (plan.source && plan.resourceModelLimit !== SIM_RESOURCE_LIMIT) add("missing_resource_model_limit", "export must declare its non-equivalence to L5 family packing");
  if (plan.source && plan.source.knowledgeRevision !== plan.knowledgeRevision) add("source_revision_mismatch", "export source revision differs");
  for (const u of plan.units) {
    if (byId.has(u.unitId)) add("duplicate_unit", "unit declared twice", u.unitId);
    byId.set(u.unitId, u);
    if (plan.projectionVersion === 2 && (!u.resources || (plan.source && u.resources.kind === "unrestricted"))) add("missing_resource_contract", "v2 export requires known or explicitly unknown resources", u.unitId);
    if (u.resources && ((u.resources.kind === "required" && !validResources(u.resources.requirement)) || (u.resources.kind === "unknown" && !u.resources.reason?.trim()) || !["required", "unknown", "unrestricted"].includes(u.resources.kind))) add("invalid_resource_contract", "invalid finite integer dimensions or resource lists", u.unitId);
    if (!u.ownedFunctionIds.length) add("empty_unit", "no owned functions", u.unitId);
    const context = new Set(u.contextFunctionIds);
    for (const fn of u.ownedFunctionIds) {
      if (owners.has(fn)) add("duplicate_possession", `already owned: ${fn}`, u.unitId);
      owners.set(fn, u.unitId);
      if (context.has(fn)) add("owned_context_overlap", fn, u.unitId);
    }
    if (u.knowledgeRevision !== plan.knowledgeRevision) add("revision_mismatch", "unit revision differs", u.unitId);
    if (u.allocatedEnvelopeUtf8Bytes !== undefined && (!Number.isSafeInteger(u.allocatedEnvelopeUtf8Bytes) || u.allocatedEnvelopeUtf8Bytes < 0 || u.allocatedEnvelopeUtf8Bytes > plan.budgets.contextEnvelopeMaxUtf8Bytes)) add("invalid_unit_budget", "allocation exceeds plan or is invalid", u.unitId);
    if (u.subIntents) {
      const subs = new Map(u.subIntents.map(s => [s.subIntentId, s])), byFunction = new Map<string, Map<SimRole, string>>(), owned = new Set(u.ownedFunctionIds);
      if (subs.size !== u.subIntents.length) add("duplicate_subintent", "id not unique", u.unitId);
      for (const s of u.subIntents) {
        if (!owned.has(s.functionId)) add("unowned_subintent", s.functionId, u.unitId);
        const roles = byFunction.get(s.functionId) ?? new Map<SimRole, string>();
        if (roles.has(s.role)) add("duplicate_role", s.role, u.unitId);
        roles.set(s.role, s.subIntentId); byFunction.set(s.functionId, roles);
      }
      const degree = new Map(u.subIntents.map(s => [s.subIntentId, s.waitsForSubIntentIds.length])), follows = new Map(u.subIntents.map(s => [s.subIntentId, [] as string[]]));
      for (const s of u.subIntents) {
        const roles = byFunction.get(s.functionId)!;
        if (s.role === "R" && canonical([...s.waitsForSubIntentIds].sort()) !== canonical([roles.get("A"), roles.get("B")].sort())) add("R_gate_mismatch", s.subIntentId, u.unitId);
        for (const id of s.waitsForSubIntentIds) {
          const prior = subs.get(id);
          if (!prior || (s.role !== "R" && (prior.role !== "R" || prior.functionId === s.functionId))) add("invalid_local_dependency", id, u.unitId);
          follows.get(id)?.push(s.subIntentId);
        }
      }
      for (const fn of u.ownedFunctionIds) {
        const roles = byFunction.get(fn);
        if (roles?.size !== 3 || !roles.has("A") || !roles.has("B") || !roles.has("R")) add("incomplete_2plus1", fn, u.unitId);
        else {
          const a = subs.get(roles.get("A")!)!, b = subs.get(roles.get("B")!)!;
          if (new Set(a.waitsForSubIntentIds).size !== a.waitsForSubIntentIds.length || new Set(b.waitsForSubIntentIds).size !== b.waitsForSubIntentIds.length || canonical([...a.waitsForSubIntentIds].sort()) !== canonical([...b.waitsForSubIntentIds].sort())) add("asymmetric_author_dependency", fn, u.unitId);
        }
      }
      const localQueue = [...degree.keys()].filter(id => degree.get(id) === 0);
      for (let i = 0; i < localQueue.length; i++) for (const id of follows.get(localQueue[i]!)!) { degree.set(id, degree.get(id)! - 1); if (degree.get(id) === 0) localQueue.push(id); }
      if (localQueue.length !== subs.size) add("local_intent_cycle", "local order cyclic", u.unitId);
    }
  }
  const selected = new Set(plan.selectedUnitIds ?? byId.keys());
  for (const id of selected) if (!byId.has(id)) add("unknown_selection", id);
  if (plan.decisions) {
    const included = new Set(plan.decisions.filter(d => d.action === "include").map(d => d.unitId));
    if (included.size !== selected.size || [...selected].some(id => !included.has(id))) add("decision_selection_mismatch", "include decisions differ from selection");
  }
  const edges = new Set<string>(), need = new Set<string>(), cited = new Set<string>(), citedCalls = new Set<string>(), projectedPrerequisites = new Map<string, string>(), adjacency = new Map<string, string[]>(), incoming = new Map<string, number>();
  for (const id of byId.keys()) { adjacency.set(id, []); incoming.set(id, 0); }
  for (const u of plan.units) for (const p of u.prerequisites) {
    if (p.dispensed && !p.dispensationReason?.trim()) add("unjustified_dispensation", "missing reason", u.unitId);
    if (plan.source) {
      const originalPrerequisite = p.id ? sourcePrerequisites.get(p.id) : undefined;
      if (!originalPrerequisite || originalPrerequisite.consumerUnitId !== u.unitId || originalPrerequisite.kind !== p.kind || originalPrerequisite.producerUnitId !== p.producerUnitId || originalPrerequisite.dispensed !== p.dispensed || originalPrerequisite.dispensationReason !== p.dispensationReason || originalPrerequisite.requiredPublicationLevel !== p.requiredPublicationLevel || projectedPrerequisites.has(p.id!)) add("prerequisite_source_mismatch", String(p.id), u.unitId);
      if (p.id) projectedPrerequisites.set(p.id, u.unitId);
      const relation = citedRelation(u, p, relations);
      if (!relation) add("prerequisite_citation_mismatch", String(p.id), u.unitId);
      if (p.dispensed) {
        const d = p.dispensation, original = p.id ? plan.source.dispensations[p.id] : undefined;
        if (!d || !original || canonical(d) !== canonical(original) || !d.reason.trim() || d.reason !== p.dispensationReason || !d.source.trim() || !/^[0-9a-f]{64}$/.test(d.sourceHash) || d.policyVersion !== plan.source.policyVersion || d.knowledgeRevision !== plan.knowledgeRevision || !["fixture-only", "parent-validated"].includes(d.validation)) add("dispensation_evidence_mismatch", String(p.id), u.unitId);
      }
      if (p.kind === "external_satisfied") {
        const receipt = p.externalReceipt, original = p.id ? plan.source.externalReceipts[p.id] : undefined, q = p.requirement;
        if (!receipt || !original || !q || canonical(receipt) !== canonical(original) || receipt.producerUnitId !== null || receipt.readbackStatus !== "verified" || receipt.futurePrerequisiteEffect !== "satisfies" || receipt.validation !== q.validation || receipt.artifactId !== q.artifactId || receipt.artifactSha256 !== q.artifactSha256 || receipt.functionId !== q.functionId || receipt.moduleSha256 !== q.moduleSha256 || receipt.artifactKind !== q.artifactKind || receipt.publicationLevel < q.publicationLevel || receipt.knowledgeRevision < q.minimumRevision || receipt.knowledgeRevision > q.maximumRevision) add("external_receipt_mismatch", String(p.id), u.unitId);
      }
    }
    if (p.kind === "obligatory" && p.producerUnitId !== null && byId.has(p.producerUnitId)) { cited.add(pairKey(p.producerUnitId, u.unitId)); citedCalls.add(canonical([p.producerUnitId, u.unitId, p.callSourceFunctionId, p.callDestinationFunctionId])); }
    if (!blocking(p)) continue;
    if (p.producerUnitId === null || !byId.has(p.producerUnitId)) { if (!documentedDefer(plan, u, p, selected, relations, sourcePrerequisites, sourceDiagnostics)) add("unknown_prerequisite_producer", String(p.producerUnitId), u.unitId); continue; }
    if (selected.has(u.unitId) && !selected.has(p.producerUnitId)) add("closure_omits_producer", p.producerUnitId, u.unitId);
    const key = pairKey(p.producerUnitId, u.unitId);
    if (!need.has(key)) { need.add(key); adjacency.get(p.producerUnitId)!.push(u.unitId); incoming.set(u.unitId, incoming.get(u.unitId)! + 1); }
  }
  for (const p of sourcePrerequisites.values()) if (projectedPrerequisites.get(p.id) !== p.consumerUnitId) add("missing_source_prerequisite", p.id, p.consumerUnitId);
  for (const e of plan.g1Edges) {
    if (!byId.has(e.fromUnitId) || !byId.has(e.toUnitId)) add("unknown_g1_unit", pairKey(e.fromUnitId, e.toUnitId));
    if (e.kind !== "obligatory") continue;
    const key = pairKey(e.fromUnitId, e.toUnitId); edges.add(key);
    if (!cited.has(key)) add("g1_prerequisite_mismatch", key);
    if (plan.source && !citedCalls.has(canonical([e.fromUnitId, e.toUnitId, e.callSourceFunctionId, e.callDestinationFunctionId]))) add("g1_citation_mismatch", key);
    if (owners.get(e.callSourceFunctionId) !== e.toUnitId || owners.get(e.callDestinationFunctionId) !== e.fromUnitId) add("call_direction_mismatch", key);
  }
  for (const key of need) if (!edges.has(key)) add("g1_prerequisite_mismatch", `missing edge ${key}`);
  const queue = [...byId.keys()].filter(id => incoming.get(id) === 0); let removed = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor]!; removed++;
    for (const to of adjacency.get(id)!) { incoming.set(to, incoming.get(to)! - 1); if (incoming.get(to) === 0) queue.push(to); }
  }
  if (removed !== byId.size) add("quotient_cycle", "cyclic quotient must be split or diagnosed");
  return diagnostics;
}

/** Boundary adaptation only; L5 type imports are erased, no decisions recomputed. */
export function simPlanFromExport(result: PlannerResult): SimPlanInput {
  const { fingerprint: _fp, ...document } = result.plan;
  const { fingerprint: _sp, ...sidecar } = result.sidecar;
  const { fingerprint: _bp, ...binding } = result.binding;
  if (fingerprint(document) !== result.plan.fingerprint || fingerprint(sidecar) !== result.binding.sidecarFingerprint || result.sidecar.fingerprint !== result.binding.sidecarFingerprint || result.binding.planFingerprint !== result.plan.fingerprint || fingerprint(binding) !== result.binding.fingerprint || result.sidecar.planFingerprint !== result.plan.fingerprint)
    throw new SimError("plan_non_conformant", "export fingerprints disagree");
  const prerequisites = new Map<string, typeof result.plan.prerequisites>();
  for (const p of result.plan.prerequisites) { const ps = prerequisites.get(p.consumerUnitId) ?? []; ps.push(p); prerequisites.set(p.consumerUnitId, ps); }
  const owner = new Map(result.units.flatMap(u => u.ownedFunctionIds.map(fn => [fn, u.unitId] as const))), relationByPrerequisite = new Map<string, PlannerRelation>();
  for (const r of result.sidecar.relationView.relations) { const consumerUnitId = owner.get(r.sourceId); if (consumerUnitId) relationByPrerequisite.set(`pre:${fingerprint({ relationVersion: 1, relationId: r.relationId, consumerUnitId })}`, r); }
  const projection = new Map(result.plan.units.map(u => [u.unitId, u]));
  const plan: SimPlanInput = {
    projectionVersion: 2, resourceSemantics: SIM_RESOURCE_MODEL, resourceModelLimit: SIM_RESOURCE_LIMIT,
    source: { policyVersion: result.sidecar.policyVersion, estimationVersion: result.sidecar.estimationVersion, knowledgeRevision: result.sidecar.knowledgeRevision,
      planFingerprint: result.plan.fingerprint, sidecarFingerprint: result.sidecar.fingerprint, bindingFingerprint: result.binding.fingerprint,
      relations: structuredClone(result.sidecar.relationView.relations), prerequisites: structuredClone(result.plan.prerequisites), diagnostics: structuredClone(result.sidecar.diagnostics),
      dispensations: structuredClone(result.sidecar.dispensationById), externalReceipts: structuredClone(result.sidecar.externalReceiptById) },
    planId: result.plan.planId, missionId: result.plan.missionId, knowledgeRevision: result.plan.knowledgeRevision,
    budgets: structuredClone(result.plan.budgets), g1Edges: structuredClone(result.plan.g1Edges), g2Conflicts: structuredClone(result.plan.g2Conflicts),
    selectedUnitIds: [...result.plan.selectedUnitIds], decisions: structuredClone(result.plan.decisions),
    units: result.units.map(u => {
      const { state: _state, ...content } = u;
      if (fingerprint(content) !== result.sidecar.unitFingerprints[u.unitId]) throw new SimError("plan_non_conformant", `unit fingerprint mismatch: ${u.unitId}`);
      const brief = projection.get(u.unitId);
      if (!brief || canonical(brief.ownedFunctionIds) !== canonical(u.ownedFunctionIds)) throw new SimError("plan_non_conformant", "unit projection mismatch");
      const resources = result.sidecar.resourcesByUnit[u.unitId], profiles = resources?.profiles ?? [];
      if (u.subIntents.some(s => s.role !== "A" && s.role !== "B" && s.role !== "R")) throw new SimError("plan_non_conformant", "v1 fixture requires 2+1");
      return { unitId: u.unitId, ownedFunctionIds: [...u.ownedFunctionIds], contextFunctionIds: [...u.contextFunctionIds],
        investigationKind: u.investigationKind, requiredPublicationLevel: u.requiredPublicationLevel, knowledgeRevision: u.knowledgeRevision,
        requiredProfile: profiles.length === 1 ? profiles[0] : undefined, conflicts: structuredClone(u.conflicts),
        resources: resources ? { kind: "required", requirement: structuredClone(resources) } : { kind: "unknown", reason: "L5 sidecar resourcesByUnit entry absent" },
        requiredProfiles: resources ? [...profiles] : undefined, requiredAccounts: resources ? [...resources.accounts] : undefined, requiredTools: resources ? [...resources.tools] : undefined,
        subIntents: u.subIntents.map(s => ({ subIntentId: s.subIntentId, functionId: s.functionId, role: s.role as SimRole, waitsForSubIntentIds: [...s.waitsForSubIntentIds] })),
        allocatedEnvelopeUtf8Bytes: result.sidecar.envelopeBytesByUnit[u.unitId],
        sccExclusive: result.sidecar.localOrders[u.unitId]?.recursive ?? false,
        prerequisites: (prerequisites.get(u.unitId) ?? []).map(p => {
          const relation = relationByPrerequisite.get(p.id);
          return { ...structuredClone(p), relationId: relation?.relationId, callSourceFunctionId: relation?.sourceId, callDestinationFunctionId: relation?.destinationId,
            requirement: structuredClone(result.sidecar.requirementById[p.id]), dispensation: structuredClone(result.sidecar.dispensationById[p.id]), externalReceipt: structuredClone(result.sidecar.externalReceiptById[p.id]) };
        }),
        outputArtifacts: u.ownedFunctionIds.flatMap(fn => result.sidecar.policy.requirementsByFunction[fn] ? [structuredClone(result.sidecar.policy.requirementsByFunction[fn]!)] : []),
      };
    }),
  };
  return freeze(plan);
}

export interface SimWorkerSpec { profile: string; accountId: string; speed?: number; tools?: string[]; model?: string; slots?: number; cpu?: number; gpu?: number; budget?: number }
export interface SimDurations { A: number; B: number; R: number }
export type SimDurationsSpec = SimDurations | Map<string, SimDurations> | ((unitId: string) => SimDurations);
export type SimIncident =
  | { kind: "crash_before_admit" | "crash_after_admit" | "heartbeat_lost" | "lease_expired_worker_active" | "double_commit_attempt" | "cancel"; atTick: number; unitId: string }
  | { kind: "response_lost"; unitId: string; reconcileAfter?: number }
  | { kind: "late_result"; unitId: string; delayTicks: number }
  | { kind: "ambiguous_stop"; atTick: number; unitId: string; confirmWindow: number }
  | { kind: "stop_confirmed"; atTick: number; unitId: string; retry?: boolean }
  | { kind: "pause"; fromTick: number; toTick: number }
  | { kind: "new_conflict"; atTick: number; resourceKey: string; unitIdA: string; unitIdB: string }
  | { kind: "new_dependency"; atTick: number; consumerUnitId: string; producerUnitId: string }
  | { kind: "new_scc" | "partition_adoption" | "invalidate_knowledge"; atTick: number; unitIds: string[] }
  | { kind: "bulletin"; atTick: number; unitId: string; authorRole: "A" | "B" | "R" | "unauthorized"; canonical: boolean; validScope?: boolean; validHash?: boolean; coherentTrace?: boolean };
export interface SimConfig {
  controllerId: string; workers: SimWorkerSpec[]; accountQuotas?: Record<string, number>;
  accountCapacities?: Record<string, { slots: number; budget: number }>;
  leaseTicks: number; heartbeatEvery: number; validationTicks: number; maxAttempts: number; maxTicks: number;
  policy: SimPolicyKind; rolesParallel?: boolean; groupSize?: number; recordTrace?: boolean;
  autoDispatch?: boolean;
  /** Old-plan ownership fixtures. Expiry alone never releases a claim. */
  externalClaims?: Array<{ familyId: string; resourceKeys: string[]; stoppedAtTick?: number }>;
}
export interface SimScenario { plan: SimPlanInput; config: SimConfig; durations: SimDurationsSpec; incidents?: SimIncident[]; seed?: string }
export interface SimTraceEntry { t: number; seq: number; ev: string; [key: string]: unknown }
export interface SimCommitRecord {
  commitId: string; inputRevision: number; outputRevision: number; unitId: string; resultIds: string[]; validatedFactIds: string[];
  publicationLevel: SimPublicationLevel; publicationTargetId: "sim-fixture-store"; readbackStatus: "verified"; readbackHash: string;
  futurePrerequisiteEffect: "satisfies"; isGitCommit: false; simulated: true;
}
export interface SimDeltaRecord { deltaId: string; fromRevision: number; toRevision: number; affectedFunctionIds: string[]; origin: string; simulated: true }
export interface SimBulletinRecord { atTick: number; unitId: string; authorRole: string; canonical: boolean; accepted: boolean; rejectionReason: string | null }
export class SimStore {
  readonly publicationTargetId = "sim-fixture-store";
  private commits = new Map<string, SimCommitRecord>();
  readonly deltas: SimDeltaRecord[] = [];
  readonly rejectedCommits: Array<{ unitId: string; code: SimErrorCode; atTick: number }> = [];
  constructor(private revisionCounter: number) {}
  get revision(): number { return this.revisionCounter; }
  get committedCount(): number { return this.commits.size; }
  getCommit(id: string): SimCommitRecord | undefined { return this.commits.get(id); }
  write(commit: Omit<SimCommitRecord, "commitId" | "isGitCommit" | "simulated">, atTick: number): SimCommitRecord {
    if (this.commits.has(commit.unitId)) { this.rejectedCommits.push({ unitId: commit.unitId, code: "duplicate_commit", atTick }); throw new SimError("duplicate_commit", commit.unitId); }
    if (commit.publicationLevel !== 1 || commit.inputRevision !== this.revision || commit.outputRevision !== this.revision + 1) throw new SimError("plan_non_conformant", "fixture cannot fabricate local publication or nonsequential revision");
    const record = freeze({ ...commit, commitId: fingerprint(commit), isGitCommit: false as const, simulated: true as const });
    this.commits.set(commit.unitId, record); this.revisionCounter++; return record;
  }
}
export interface SimUnitFinalState { unitId: string; state: SimUnitState; dispatchTick: number | null; becameReadyTick: number | null; commitLevel: SimPublicationLevel | null; attempts: number; blockedReason: string | null; waitReason: string | null; waitTicks: number }
export interface SimMetrics {
  version: 2; rolesParallel: boolean;
  makespan: number; totalUnits: number; deferredUnits: number; committedUnits: number; usefulWorkerTicks: number; reworkWorkerTicks: number; totalWorkerTicks: number; utilization: number;
  occupiedWorkerTicks: number; occupationHorizonTicks: number; occupationCapacityTicks: number; occupationUtilization: number; observationEndTick: number; publicationEndTick: number; occupationEndTick: number;
  criticalPathTicks: number; estimatedRemainingCriticalPathTicks: number; totalWorkTicks: number; lowerBoundTicks: number;
  waits: { dependency: number; conflict: number; resource: number; quota: number; barrier: number; paused: number; validation: number };
  contextFreshness: { frozenAttempts: number; staleAttempts: number; revisionLagSum: number };
  reworkAttempts: number; outcome: "complete" | "stuck"; outcomeReasons: string[];
  overhead: { dispatchPasses: number; readyPops: number; consumerEdges: number; heartbeatEvents: number; admissions: number; eventHeapComparisons: number; conflictChecks: number; readinessChecks: number; workerCompatibilityChecks: number; resourceBuckets: number; maxReady: number; resourceBucketScans: number; workerVisits: number; accountCapacityChecks: number; conflictWaiterPops: number; localDagNodes: number; localDagEdges: number };
}
export interface SimDecision { t: number; unitId: string; familyId: string; workerIds: number[]; attempt: number; token: number; executions: Array<{ executionId: string; functionId: string; role: SimRole; workerId: number }> }
export interface SimRunResult { trace: SimTraceEntry[]; traceHash: string; decisions: SimDecision[]; metrics: SimMetrics; store: SimStore; units: SimUnitFinalState[]; bulletins: SimBulletinRecord[]; diagnostics: SimDiagnostic[]; resourceModel: string; resourceModelLimit: string }
export const SIM_INTEGRATION_LIMITS = freeze(["durable-outbox-cas-fencing-sqlite", "durable-readback-byte-exact", "native-crash-admission-idempotence", "filesystem-junction-symlink-ancestors", "native-2000-char-line-boundary", "local-level2-publication", "provider-model-native-session-independence"]);
export const utf8ByteLength = (s: string): number => Buffer.byteLength(s, "utf8");
export interface SimEnvelope { text: string; utf8Bytes: number; withinBudget: boolean; withinLineLimit: boolean; fingerprint: string }
export function buildContextEnvelope(unit: SimUnitInput, budget: SimPlanInput["budgets"]): SimEnvelope {
  const text = (unit.contextManifestLines ?? [JSON.stringify({ unitId: unit.unitId, ownedFunctionIds: unit.ownedFunctionIds, contextFunctionIds: unit.contextFunctionIds, knowledgeRevision: unit.knowledgeRevision }, null, 2)]).join("\n");
  return { text, utf8Bytes: utf8ByteLength(text), withinBudget: utf8ByteLength(text) <= budget.contextEnvelopeMaxUtf8Bytes,
    withinLineLimit: text.split(/\r\n|\r|\n/).every(line => line.length <= budget.nativeLineCharLimit), fingerprint: hash(text) };
}
/** Full SIMULATED admission envelope including wrapper, never command-only.
 * Does not assert byte-identical native transport. No clipping.
 */
export function buildAdmissionEnvelope(unit: SimUnitInput, budget: SimPlanInput["budgets"], authority: { missionId: string; planId: string; controllerId: string }): SimEnvelope {
  const context = buildContextEnvelope(unit, budget), allocation = unit.allocatedEnvelopeUtf8Bytes ?? budget.contextEnvelopeMaxUtf8Bytes;
  const text = JSON.stringify({ schemaVersion: 1, ...authority, unitId: unit.unitId, commandLines: context.text.split(/\r\n|\r|\n/), contextManifestFingerprint: context.fingerprint }, null, 2);
  return { text, utf8Bytes: utf8ByteLength(text), withinBudget: utf8ByteLength(text) <= allocation && allocation <= budget.contextEnvelopeMaxUtf8Bytes,
    withinLineLimit: context.withinLineLimit && text.split(/\r\n|\r|\n/).every(line => line.length <= budget.nativeLineCharLimit), fingerprint: hash(text) };
}
/** Lexical only: no assertion about real symlink/junction ancestors. */
export function assertSafeManifestPath(root: string, name: string): string {
  if (!name || isAbsolute(name) || /^[A-Za-z]:|^[/\\]|:/.test(name) || name.includes("\0") || name.split(/[/\\]/).some(p => p === ".." || p.endsWith(".") || p.endsWith(" ") || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p))) throw new SimError("unsafe_manifest_path", name);
  const target = resolve(root, name), rel = relative(root, target);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new SimError("unsafe_manifest_path", name);
  return target;
}

class Heap<T> {
  private values: T[] = [];
  comparisons = 0;
  constructor(private compare: (a: T, b: T) => number) {}
  get size(): number { return this.values.length; }
  peek(): T | undefined { return this.values[0]; }
  private less(a: T, b: T): boolean { this.comparisons++; return this.compare(a, b) < 0; }
  push(value: T): void { let i = this.values.length; this.values.push(value); while (i > 0) { const p = (i - 1) >> 1; if (!this.less(value, this.values[p]!)) break; this.values[i] = this.values[p]!; i = p; } this.values[i] = value; }
  pop(): T | undefined {
    const first = this.values[0], last = this.values.pop(); if (!this.values.length) return first;
    let i = 0;
    while (i * 2 + 1 < this.values.length) { let c = i * 2 + 1; if (c + 1 < this.values.length && this.less(this.values[c + 1]!, this.values[c]!)) c++; if (!this.less(this.values[c]!, last!)) break; this.values[i] = this.values[c]!; i = c; }
    this.values[i] = last!; return first;
  }
}
interface SimEvent { t: number; seq: number; kind: "start" | "done" | "validate" | "heartbeat" | "lease" | "incident" | "reconcile" | "wake" | "quarantine" | "external_stop"; unitId?: string; token?: number; jobId?: string; incident?: SimIncident }
interface Task { id: string; functionId: string; role: SimRole; waits: string[]; state: "pending" | "running" | "done"; jobId?: string }
interface Job { id: string; task: Task; worker: number; start: number; end: number; work: number; token: number; reservation?: { accountId: string; slots: number; budget: number } }
interface Runtime {
  input: SimUnitInput; state: SimUnitState; reason: string | null; deps: Map<string, SimPrerequisite[]>;
  readyAt: number | null; dispatchAt: number | null; attempt: number; token: number; expiry: number; heartbeatLost: boolean;
  tasks: Task[]; taskById: Map<string, Task>; pendingTasks: Set<Task>; followers: Map<string, Task[]>; remainingTasks: number;
  jobs: Map<string, Job>; fenced: boolean; work: number; wasted: number; contextRevision: number; contextHash: string;
  keys: Set<string>; waitReason: keyof SimMetrics["waits"] | null; waitAt: number; waitTicks: number; level: number; rank: number; group: number;
  queued: boolean; queueVersion: number; waitingKey?: string; decision?: SimDecision; validationEnd?: number;
}
interface ReadyEntry { runtime: Runtime; version: number }
const activeState = (state: SimUnitState): boolean => ["RESERVED", "RUNNING", "VALIDATING", "STOP_PENDING", "QUARANTINED"].includes(state);
const durationFor = (spec: SimDurationsSpec, id: string): SimDurations => typeof spec === "function" ? spec(id) : spec instanceof Map ? spec.get(id)! : spec;
export interface PlanShapeInfo { criticalPathTicks: number; totalWorkTicks: number; units: number; edges: number; localDagNodes: number; localDagEdges: number }
type Intent = NonNullable<SimUnitInput["subIntents"]>[number];
function intents(u: SimUnitInput): Intent[] {
  return u.subIntents ?? u.ownedFunctionIds.flatMap(functionId => (["A", "B", "R"] as SimRole[]).map(role => ({ subIntentId: pairKey(functionId, role), functionId, role, waitsForSubIntentIds: role === "R" ? [pairKey(functionId, "A"), pairKey(functionId, "B")] : [] })));
}
function localPath(tasks: Intent[], weight: (task: Intent) => number, validation: number): number {
  const degree = new Map(tasks.map(t => [t.subIntentId, t.waitsForSubIntentIds.length])), followers = new Map(tasks.map(t => [t.subIntentId, [] as string[]])), byId = new Map(tasks.map(t => [t.subIntentId, t]));
  const finish = new Map<string, number>(), start = new Map<string, number>(), queue = tasks.filter(t => !t.waitsForSubIntentIds.length).map(t => t.subIntentId);
  for (const t of tasks) for (const p of t.waitsForSubIntentIds) followers.get(p)!.push(t.subIntentId);
  let end = 0;
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]!, done = sum(start.get(id) ?? 0, weight(byId.get(id)!)); finish.set(id, done); end = Math.max(end, done);
    for (const next of followers.get(id)!) { start.set(next, Math.max(start.get(next) ?? 0, done)); degree.set(next, degree.get(next)! - 1); if (!degree.get(next)) queue.push(next); }
  }
  if (queue.length !== tasks.length) throw new SimError("plan_non_conformant", "local intent cycle");
  return sum(end, validation);
}
function topology(plan: SimPlanInput): { order: string[]; consumers: Map<string, string[]> } {
  const incoming = new Map(plan.units.map(u => [u.unitId, 0])), consumers = new Map(plan.units.map(u => [u.unitId, [] as string[]]));
  for (const u of plan.units) for (const id of new Set(u.prerequisites.filter(blocking).map(p => p.producerUnitId))) if (id !== null) { incoming.set(u.unitId, incoming.get(u.unitId)! + 1); consumers.get(id)!.push(u.unitId); }
  const order = [...incoming.keys()].filter(id => incoming.get(id) === 0);
  for (let i = 0; i < order.length; i++) for (const id of consumers.get(order[i]!)!) { incoming.set(id, incoming.get(id)! - 1); if (incoming.get(id) === 0) order.push(id); }
  return { order, consumers };
}
export function planShape(plan: SimPlanInput, durations: SimDurationsSpec, validationTicks: number): PlanShapeInfo {
  if (!dimension(validationTicks)) throw new SimError("invalid_config", "validation ticks");
  return shape(plan, durations, validationTicks);
}
function shape(plan: SimPlanInput, durations: SimDurationsSpec, validationTicks: number, speed = 1, residual?: Map<string, Runtime>, now = 0): PlanShapeInfo {
  const { order, consumers } = topology(plan), byId = new Map(plan.units.map(u => [u.unitId, u])), remaining = new Map<string, number>(), selected = new Set(plan.selectedUnitIds ?? byId.keys()); let work = 0, localDagNodes = 0, localDagEdges = 0;
  for (let i = order.length - 1; i >= 0; i--) {
    if (!selected.has(order[i]!)) continue;
    const id = order[i]!, d = durationFor(durations, id), tasks = intents(byId.get(id)!), r = residual?.get(id);
    for (const task of tasks) { work = sum(work, d[task.role]); localDagEdges += task.waitsForSubIntentIds.length; }
    localDagNodes += tasks.length;
    const taskWeight = (task: Intent): number => {
      if (r?.state === "COMMITTED") return 0;
      const actual = r?.taskById.get(task.subIntentId);
      if (actual?.state === "done") return 0;
      if (actual?.state === "running") {
        const job = r!.jobs.get(actual.jobId!);
        // Nominal remaining work, not a forecast of provider/incident latency.
        if (job) return Math.max(0, Math.ceil(d[task.role] * Math.max(0, job.end - now) / job.work));
      }
      return Math.max(1, Math.ceil(d[task.role] / speed));
    };
    const validation = r?.state === "COMMITTED" ? 0 : r?.state === "VALIDATING" ? Math.max(0, (r.validationEnd ?? now) - now) : validationTicks;
    const own = localPath(tasks, taskWeight, validation);
    let next = 0; for (const c of consumers.get(id)!) next = Math.max(next, remaining.get(c) ?? 0);
    remaining.set(id, sum(own, next));
  }
  let criticalPathTicks = 0; for (const value of remaining.values()) criticalPathTicks = Math.max(value, criticalPathTicks);
  return { criticalPathTicks, totalWorkTicks: work, units: plan.units.length, edges: plan.g1Edges.length, localDagNodes, localDagEdges };
}

export class SimEngine {
  private readonly scenario: SimScenario;
  private units = new Map<string, Runtime>();
  private events = new Heap<SimEvent>((a, b) => a.t - b.t || a.seq - b.seq);
  private ready = new Map<string, Heap<ReadyEntry>>();
  private conflictWait = new Map<string, Set<Runtime>>();
  private barrierWait = new Map<number, Set<Runtime>>();
  private holders = new Map<string, string>();
  private active = new Set<Runtime>();
  private runnable = new Set<Runtime>();
  private workers = new Map<number, Job>();
  private usage = new Map<string, number>();
  private accountReservations = new Map<string, { slots: number; budget: number }>();
  private diagnostics = new Map<string, SimDiagnostic>();
  private occupied = 0; private occupationEnd = 0;
  private consumers = new Map<string, Set<string>>();
  private selected: Set<string>;
  private store: SimStore;
  private trace: SimTraceEntry[] = [];
  private decisions: SimRunResult["decisions"] = [];
  private traceDigest = "";
  private bulletins: SimBulletinRecord[] = [];
  private seq = 0; private now = 0; private completedAt = 0; private finished = false; private readyCount = 0; private logicalReadyCount = 0;
  private remainingGroups = new Map<number, number>(); private remainingLevels = new Map<number, number>();
  private firstGroup = 0; private firstLevel = 0;
  private waits: SimMetrics["waits"] = { dependency: 0, conflict: 0, resource: 0, quota: 0, barrier: 0, paused: 0, validation: 0 };
  private overhead: SimMetrics["overhead"] = { dispatchPasses: 0, readyPops: 0, consumerEdges: 0, heartbeatEvents: 0, admissions: 0, eventHeapComparisons: 0, conflictChecks: 0, readinessChecks: 0, workerCompatibilityChecks: 0, resourceBuckets: 0, maxReady: 0, resourceBucketScans: 0, workerVisits: 0, accountCapacityChecks: 0, conflictWaiterPops: 0, localDagNodes: 0, localDagEdges: 0 };
  private staleAttempts = 0; private revisionLagSum = 0; private reworkAttempts = 0;
  constructor(input: SimScenario) {
    const diagnostics = validateSimPlan(input.plan);
    if (diagnostics.length) throw new SimError("plan_non_conformant", "invalid immutable export", diagnostics);
    this.scenario = { ...input, plan: freeze(structuredClone(input.plan)), config: freeze(structuredClone(input.config)), incidents: freeze(structuredClone(input.incidents ?? [])),
      durations: new Map(input.plan.units.map(u => [u.unitId, structuredClone(durationFor(input.durations, u.unitId))])) };
    const c = this.scenario.config;
    for (const [name, n] of Object.entries({ leaseTicks: c.leaseTicks, maxAttempts: c.maxAttempts, maxTicks: c.maxTicks })) if (!Number.isSafeInteger(n) || n <= 0) throw new SimError("invalid_config", name);
    if (!Number.isSafeInteger(c.heartbeatEvery) || c.heartbeatEvery < 0 || !Number.isSafeInteger(c.validationTicks) || c.validationTicks < 0) throw new SimError("invalid_config", "timers");
    for (const n of Object.values(c.accountQuotas ?? {})) if (!Number.isSafeInteger(n) || n < 0) throw new SimError("invalid_config", "quota");
    for (const w of c.workers) if (w.speed !== undefined && (!(w.speed > 0) || !Number.isFinite(w.speed))) throw new SimError("invalid_config", "speed");
    for (const w of c.workers) {
      if (!w.profile?.trim() || !w.accountId?.trim() || (w.model !== undefined && !w.model.trim()) || (w.tools !== undefined && !strings(w.tools)) || [w.slots, w.cpu, w.gpu, w.budget].some(n => n !== undefined && !dimension(n))) throw new SimError("invalid_config", "worker capacities");
    }
    for (const [id, a] of Object.entries(c.accountCapacities ?? {})) if (!id.trim() || !dimension(a.slots) || !dimension(a.budget)) throw new SimError("invalid_config", "account capacities");
    const plan = this.scenario.plan;
    this.selected = new Set(plan.selectedUnitIds ?? plan.units.map(u => u.unitId)); this.store = new SimStore(plan.knowledgeRevision);
    const deferredDiagnostics = new Map<string, Diagnostic[]>();
    for (const d of plan.source?.diagnostics ?? []) if (d.unitId !== null) { const list = deferredDiagnostics.get(d.unitId) ?? []; list.push(d); deferredDiagnostics.set(d.unitId, list); }
    const { order, consumers } = topology(plan), sorted = [...plan.units].sort((a, b) => textOrder(a.unitId, b.unitId));
    for (const [id, list] of consumers) this.consumers.set(id, new Set(list));
    for (const [index, u] of sorted.entries()) {
      const d = durationFor(this.scenario.durations, u.unitId); if (!d || [d.A, d.B, d.R].some(n => !Number.isSafeInteger(n) || n <= 0)) throw new SimError("invalid_config", "durations");
      const envelope = buildAdmissionEnvelope(u, plan.budgets, { missionId: plan.missionId, planId: plan.planId, controllerId: c.controllerId }), deps = new Map<string, SimPrerequisite[]>();
      for (const p of u.prerequisites) if (blocking(p) && p.producerUnitId !== null) { const list = deps.get(p.producerUnitId) ?? []; list.push(p); deps.set(p.producerUnitId, list); }
      const resources = u.resources;
      const resourceReason = resources?.kind === "unknown" ? "resource_metadata_unknown" : resources?.kind === "required" && (!resources.requirement.profiles.length || !resources.requirement.models.length || !resources.requirement.accounts.length) ? "resource_intersection_empty" : null;
      if (resourceReason) this.diagnose(resourceReason, resources?.kind === "unknown" ? resources.reason : "profiles/models/accounts intersection is impossible", u.unitId);
      if (!this.selected.has(u.unitId)) for (const d of deferredDiagnostics.get(u.unitId) ?? []) this.diagnose(`planner_deferred:${d.code}`, d.detail, u.unitId);
      const reason = !this.selected.has(u.unitId) ? "not_selected" : !envelope.withinBudget ? "envelope_over_budget" : !envelope.withinLineLimit ? "envelope_line_limit" : u.requiredPublicationLevel > 1 ? "fixture_cannot_publish_level2" : resourceReason;
      const r: Runtime = { input: u, state: reason ? "BLOCKED" : "PENDING", reason, deps, readyAt: null, dispatchAt: null, attempt: 0, token: 0, expiry: 0, heartbeatLost: false,
        tasks: [], taskById: new Map(), pendingTasks: new Set(), followers: new Map(), remainingTasks: 0, jobs: new Map(), fenced: false, work: 0, wasted: 0, contextRevision: u.knowledgeRevision, contextHash: envelope.fingerprint,
        keys: new Set([...u.ownedFunctionIds.map(fn => `fn:${fn}`), ...u.conflicts.map(k => k.resourceKey)]), waitReason: null, waitAt: 0, waitTicks: 0, level: 0, rank: 0, group: Math.floor(index / Math.max(1, c.groupSize ?? 4)), queued: false, queueVersion: 0 };
      this.units.set(u.unitId, r);
    }
    // Pair-targeted conflicts are direct, symmetric exclusions even if only one
    // export mentions the peer. One canonical key per incidence, no closure.
    for (const r of this.units.values()) for (const conflict of r.input.conflicts) if (conflict.withUnitId && conflict.withUnitId !== r.input.unitId) {
      const peer = this.units.get(conflict.withUnitId);
      if (!peer) throw new SimError("plan_non_conformant", "conflict names missing peer");
      const pair = [r.input.unitId, peer.input.unitId].sort(textOrder), key = `pair:${JSON.stringify(pair)}`;
      r.keys.add(key); peer.keys.add(key);
    }
    // Fixed batches follow DAG order, avoiding lexical-batch deadlocks.
    order.forEach((id, i) => this.units.get(id)!.group = Math.floor(i / Math.max(1, c.groupSize ?? 4)));
    for (const id of order) {
      const r = this.units.get(id)!; for (const p of r.deps.keys()) r.level = Math.max(r.level, this.units.get(p)!.level + 1);
      if (this.selected.has(id)) { this.remainingGroups.set(r.group, (this.remainingGroups.get(r.group) ?? 0) + 1); this.remainingLevels.set(r.level, (this.remainingLevels.get(r.level) ?? 0) + 1); }
    }
    for (let i = order.length - 1; i >= 0; i--) {
      const r = this.units.get(order[i]!)!, d = durationFor(this.scenario.durations, r.input.unitId);
      r.rank = localPath(intents(r.input), task => d[task.role], c.validationTicks);
      let rank = 0; for (const id of consumers.get(r.input.unitId)!) rank = Math.max(rank, this.units.get(id)!.rank); r.rank = sum(r.rank, rank);
    }
    const nominal = planShape(plan, this.scenario.durations, c.validationTicks);
    this.overhead.localDagNodes = nominal.localDagNodes; this.overhead.localDagEdges = nominal.localDagEdges;
    if (!plan.projectionVersion) this.diagnose("legacy_synthetic_v1_assumptions", "Manual synthetic v1: absent resource declarations are unrestricted, not an L5 export or proof of real capacity");
    for (const claim of c.externalClaims ?? []) {
      for (const key of claim.resourceKeys) { if (this.holders.has(key)) throw new SimError("plan_non_conformant", "overlapping external claims"); this.holders.set(key, `external:${claim.familyId}`); }
      if (claim.stoppedAtTick !== undefined) this.push(claim.stoppedAtTick, "external_stop", { unitId: claim.familyId });
    }
    for (const incident of this.scenario.incidents!) {
      if (incident.kind === "response_lost" || incident.kind === "late_result") continue;
      if (incident.kind === "pause") { this.push(incident.fromTick, "wake"); this.push(incident.toTick, "wake"); continue; }
      this.push(incident.atTick, "incident", { incident });
    }
    this.push(0, "start");
  }
  get tick(): number { return this.now; }
  getUnitState(id: string): SimUnitState | undefined { return this.units.get(id)?.state; }
  private emit(ev: string, data: Record<string, unknown> = {}): void {
    const entry = { t: this.now, seq: this.seq++, ev, ...data }; this.traceDigest = hash(this.traceDigest + canonical(entry));
    if (this.scenario.config.recordTrace !== false) this.trace.push(entry);
  }
  private push(t: number, kind: SimEvent["kind"], data: Omit<SimEvent, "t" | "seq" | "kind"> = {}): void { if (!Number.isSafeInteger(t) || t < this.now) throw new SimError("invalid_config", "nonmonotonic event"); this.events.push({ t, seq: this.seq++, kind, ...data }); }
  private diagnose(code: string, detail: string, unitId?: string): void { const key = pairKey(unitId ?? "", code); if (!this.diagnostics.has(key)) this.diagnostics.set(key, { code, detail, unitId }); }
  private state(r: Runtime, state: SimUnitState, reason: string): void {
    if (r.state === state) return; const from = r.state;
    if (from === "READY") this.logicalReadyCount--;
    if (from === "READY" && state !== "READY") {
      r.queued = false; r.queueVersion++;
      const key = r.waitingKey;
      if (key) { this.conflictWait.get(key)?.delete(r); r.waitingKey = undefined; this.wakeConflict(key); }
      this.endWait(r);
    }
    if (state === "READY") { this.logicalReadyCount++; this.overhead.maxReady = Math.max(this.overhead.maxReady, this.logicalReadyCount); }
    r.state = state; this.emit("unit_state", { unitId: r.input.unitId, from, to: state, reason });
  }
  private heap(r: Runtime): Heap<ReadyEntry> {
    const profile = canonical({ profile: r.input.requiredProfile, profiles: r.input.requiredProfiles ? [...r.input.requiredProfiles].sort() : undefined, accounts: r.input.requiredAccounts ? [...r.input.requiredAccounts].sort() : undefined, tools: r.input.requiredTools ? [...r.input.requiredTools].sort() : undefined, resources: r.input.resources }); let heap = this.ready.get(profile);
    if (!heap) { heap = new Heap<ReadyEntry>((ae, be) => {
      const a = ae.runtime, b = be.runtime;
      const policy = this.scenario.config.policy;
      if (policy === "critical_path" || policy === "heterogeneous") return b.rank - a.rank || textOrder(a.input.unitId, b.input.unitId);
      return a.readyAt! - b.readyAt! || textOrder(a.input.unitId, b.input.unitId);
    }); this.ready.set(profile, heap); this.overhead.resourceBuckets = this.ready.size; }
    return heap;
  }
  private wait(r: Runtime, reason: keyof SimMetrics["waits"]): void { if (r.waitReason === reason) return; this.endWait(r); r.waitReason = reason; r.waitAt = this.now; }
  private endWait(r: Runtime): void { if (r.waitReason) { const ticks = this.now - r.waitAt; this.waits[r.waitReason] += ticks; r.waitTicks += ticks; r.waitReason = null; } }
  private markReady(r: Runtime): void {
    this.overhead.readinessChecks++;
    if (r.reason || r.deps.size || !["PENDING", "BLOCKED", "RETRYABLE"].includes(r.state)) return;
    this.endWait(r); r.readyAt = this.now; this.state(r, "READY", "prerequisites_verified"); this.wait(r, this.paused() ? "paused" : "resource"); this.enqueue(r);
  }
  private enqueue(r: Runtime): void { if (r.state !== "READY" || r.fenced || !this.selected.has(r.input.unitId) || r.queued) return; r.queued = true; this.heap(r).push({ runtime: r, version: ++r.queueVersion }); this.readyCount++; }
  private paused(): boolean { return this.scenario.incidents!.some(i => i.kind === "pause" && this.now >= i.fromTick && this.now < i.toTick); }
  private workerFor(r: Runtime): number | undefined {
    const c = this.scenario.config; let best: number | undefined;
    for (let id = 0; id < c.workers.length; id++) {
      this.overhead.workerVisits++; const w = c.workers[id]!;
      if (this.workers.has(id) || !this.workerCompatible(w, r) || (this.usage.get(w.accountId) ?? 0) >= (c.accountQuotas?.[w.accountId] ?? Infinity) || !this.accountFits(w, r)) continue;
      if (c.policy !== "heterogeneous") return id;
      if (best === undefined || (w.speed ?? 1) > (c.workers[best]!.speed ?? 1)) best = id;
    }
    return best;
  }
  private workerCompatible(w: SimWorkerSpec, r: Runtime): boolean {
    this.overhead.workerCompatibilityChecks++;
    if ((r.input.requiredProfile && r.input.requiredProfile !== w.profile) || (r.input.requiredProfiles && !r.input.requiredProfiles.includes(w.profile)) ||
      (r.input.requiredAccounts && !r.input.requiredAccounts.includes(w.accountId)) || (r.input.requiredTools && !r.input.requiredTools.every(tool => w.tools?.includes(tool)))) return false;
    const resources = r.input.resources;
    if (resources?.kind === "unknown") return false;
    if (resources?.kind !== "required") return true;
    const q = resources.requirement;
    if (!q.profiles.includes(w.profile) || !q.accounts.includes(w.accountId)) return false;
    if (!w.model || [w.slots, w.cpu, w.gpu, w.budget].some(n => n === undefined) || (q.tools.length && !w.tools)) {
      this.diagnose("worker_metadata_unknown", "Export requires explicit worker model/slots/cpu/gpu/budget/tools", r.input.unitId); return false;
    }
    return q.models.includes(w.model) && q.tools.every(t => w.tools?.includes(t)) && w.slots! >= q.slots && w.cpu! >= q.cpu && w.gpu! >= q.gpu && w.budget! >= q.budget;
  }
  private accountFits(w: SimWorkerSpec, r: Runtime): boolean {
    if (r.input.resources?.kind !== "required") return true;
    this.overhead.accountCapacityChecks++;
    const capacity = this.scenario.config.accountCapacities?.[w.accountId], q = r.input.resources.requirement, used = this.accountReservations.get(w.accountId);
    if (!capacity) { this.diagnose("account_metadata_unknown", `Missing account capacities: ${w.accountId}`, r.input.unitId); return false; }
    return capacity.slots - (used?.slots ?? 0) >= q.slots && capacity.budget - (used?.budget ?? 0) >= q.budget;
  }
  private clash(r: Runtime): string | null { for (const key of r.keys) { this.overhead.conflictChecks++; const owner = this.holders.get(key); if (owner && owner !== r.input.unitId) return key; } return null; }
  tryReserve(id: string, controllerId: string, atTick = this.now): { ok: boolean; reason?: string } {
    const r = this.units.get(id); if (!r) return { ok: false, reason: "unknown_unit" };
    if (atTick !== this.now || r.state !== "READY") return { ok: false, reason: "not_ready" };
    const key = this.clash(r); if (key) return { ok: false, reason: `conflict:${key}` };
    if (this.workerFor(r) === undefined || this.paused()) return { ok: false, reason: "resource_or_pause" };
    r.attempt++; r.token++; r.fenced = false; r.dispatchAt = this.now; this.endWait(r);
    r.expiry = this.now + this.scenario.config.leaseTicks; r.contextRevision = this.scenario.plan.knowledgeRevision;
    this.revisionLagSum += this.store.revision - r.contextRevision;
    if (r.attempt > this.scenario.config.maxAttempts) { this.state(r, "FAILED", "max_attempts_exceeded"); return { ok: false, reason: "max_attempts" }; }
    r.tasks = intents(r.input).map(s => ({ id: s.subIntentId, functionId: s.functionId, role: s.role, waits: [...s.waitsForSubIntentIds], state: "pending" as const }));
    r.taskById = new Map(r.tasks.map(t => [t.id, t]));
    r.pendingTasks = new Set(r.tasks.filter(t => !t.waits.length)); r.remainingTasks = r.tasks.length; r.followers = new Map();
    for (const task of r.tasks) for (const id of task.waits) { const followers = r.followers.get(id) ?? []; followers.push(task); r.followers.set(id, followers); }
    for (const key of r.keys) this.holders.set(key, id); this.active.add(r); this.runnable.add(r);
    this.state(r, "RESERVED", `reserved_by:${controllerId}`); this.emit("context_frozen", { unitId: id, revision: r.contextRevision, manifest: r.contextHash, attempt: r.attempt });
    this.push(r.expiry, "lease", { unitId: id, token: r.token });
    if (this.scenario.config.heartbeatEvery) this.push(this.now + this.scenario.config.heartbeatEvery, "heartbeat", { unitId: id, token: r.token });
    r.decision = { t: this.now, unitId: id, familyId: `family:${id}/${r.attempt}/${r.token}`, workerIds: [], attempt: r.attempt, token: r.token, executions: [] };
    this.decisions.push(r.decision); this.place(r); return { ok: true };
  }
  private place(r: Runtime): void {
    if (r.fenced || this.paused()) return;
    const parallel = this.scenario.config.rolesParallel ?? this.scenario.config.policy !== "sequential";
    for (const task of r.pendingTasks) {
      if (!parallel && r.jobs.size) break;
      const worker = this.workerFor(r); if (worker === undefined) { this.wait(r, "resource"); break; }
      this.endWait(r); const spec = this.scenario.config.workers[worker]!, base = durationFor(this.scenario.durations, r.input.unitId)[task.role];
      const work = Math.max(1, Math.ceil(base / (spec.speed ?? 1))), id = `${r.input.unitId}/${task.functionId}/${task.role}/${r.attempt}`;
      if (!dimension(work, 1)) throw new SimError("invalid_config", "execution duration overflow");
      const job: Job = { id, task, worker, start: this.now, end: this.now + work, work, token: r.token };
      if (r.input.resources?.kind === "required") {
        const q = r.input.resources.requirement, used = this.accountReservations.get(spec.accountId) ?? { slots: 0, budget: 0 };
        job.reservation = { accountId: spec.accountId, slots: q.slots, budget: q.budget };
        this.accountReservations.set(spec.accountId, { slots: sum(used.slots, q.slots), budget: sum(used.budget, q.budget) });
      }
      task.state = "running"; task.jobId = id; r.pendingTasks.delete(task); r.jobs.set(id, job); this.workers.set(worker, job); this.usage.set(spec.accountId, (this.usage.get(spec.accountId) ?? 0) + 1);
      const contextManifest = task.role === "R" ? fingerprint({ frozenContext: r.contextHash, functionId: task.functionId, authorResultIds: task.waits.map(prior => r.taskById.get(prior)!.jobId) }) : r.contextHash;
      this.overhead.admissions++; this.state(r, "RUNNING", "job_admitted"); this.emit("job_start", { unitId: r.input.unitId, functionId: task.functionId, role: task.role, subIntentId: task.id, workerId: worker, executionId: id, endTick: job.end, attempt: r.attempt, token: r.token, familyId: r.decision!.familyId, reservation: job.reservation, contextManifest, outputPath: `outputs/${hash(id)}.json` });
      r.decision!.workerIds.push(worker); r.decision!.executions.push({ executionId: id, functionId: task.functionId, role: task.role, workerId: worker });
      const late = this.scenario.incidents!.find(i => i.kind === "late_result" && i.unitId === r.input.unitId);
      this.push(job.end + (task.role === "R" && late?.kind === "late_result" ? late.delayTicks : 0), "done", { unitId: r.input.unitId, jobId: id, token: r.token });
      if (!parallel) break;
    }
    if (!r.pendingTasks.size) this.runnable.delete(r);
  }
  private releaseJob(r: Runtime, job: Job): void {
    if (!r.jobs.delete(job.id)) return;
    this.workers.delete(job.worker); const account = this.scenario.config.workers[job.worker]!.accountId; this.usage.set(account, this.usage.get(account)! - 1);
    this.occupied = sum(this.occupied, this.now - job.start); this.occupationEnd = Math.max(this.occupationEnd, this.now);
    if (job.reservation) { const used = this.accountReservations.get(account)!; used.slots -= job.reservation.slots; used.budget -= job.reservation.budget; }
    this.emit("execution_released", { unitId: r.input.unitId, executionId: job.id, workerId: job.worker, token: job.token, occupiedTicks: this.now - job.start, reservation: job.reservation });
  }
  private wakeConflict(key: string): void {
    if (this.holders.has(key)) return;
    const waiting = this.conflictWait.get(key);
    while (waiting?.size) {
      const next = waiting.values().next().value!; waiting.delete(next); next.waitingKey = undefined; this.overhead.conflictWaiterPops++;
      if (next.state !== "READY" || next.fenced || !this.selected.has(next.input.unitId)) continue;
      this.enqueue(next);
      // Relay past resource-ineligible waiters without dropping them or claiming
      // ownership. One resource-eligible waiter is woken; extra work is counted.
      if (this.workerFor(next) !== undefined) break;
    }
    if (!waiting?.size) this.conflictWait.delete(key);
  }
  private releaseFamily(r: Runtime): void {
    this.active.delete(r); this.runnable.delete(r);
    for (const key of r.keys) if (this.holders.get(key) === r.input.unitId) {
      this.holders.delete(key); this.wakeConflict(key);
    }
  }
  private fence(r: Runtime, reason: string): void {
    r.fenced = true; r.reason = reason; this.runnable.delete(r); this.state(r, "STOP_PENDING", reason);
    if (!r.jobs.size) { this.state(r, "QUARANTINED", reason); this.releaseFamily(r); }
  }
  private done(event: SimEvent): void {
    const r = this.units.get(event.unitId!)!, job = r.jobs.get(event.jobId!);
    if (!job || job.token !== event.token || r.token !== event.token) { this.emit("late_event_ignored", { unitId: event.unitId, jobId: event.jobId }); return; }
    this.releaseJob(r, job); job.task.state = "done"; r.work += job.work; r.remainingTasks--;
    for (const next of r.followers.get(job.task.id) ?? []) if (next.waits.every(id => r.taskById.get(id)!.state === "done")) r.pendingTasks.add(next);
    this.emit(r.fenced ? "job_done_fenced" : "job_done", { unitId: r.input.unitId, functionId: job.task.functionId, role: job.task.role, executionId: job.id, workerId: job.worker, ticks: job.work, attempt: r.attempt, token: job.token, familyId: r.decision?.familyId });
    if (r.fenced) { if (!r.jobs.size) { this.state(r, "QUARANTINED", r.reason!); this.releaseFamily(r); } return; }
    if (!r.heartbeatLost) r.expiry = this.now + this.scenario.config.leaseTicks;
    if (!r.remainingTasks) {
      this.runnable.delete(r); const lost = this.scenario.incidents!.find(i => i.kind === "response_lost" && i.unitId === r.input.unitId);
      if (lost?.kind === "response_lost") { this.emit("response_lost", { unitId: r.input.unitId, durableResult: true }); this.push(this.now + (lost.reconcileAfter ?? 2), "reconcile", { unitId: r.input.unitId, token: r.token }); }
      else this.validate(r);
    } else this.runnable.add(r);
  }
  private validate(r: Runtime): void { this.state(r, "VALIDATING", "all_function_R_complete"); this.wait(r, "validation"); r.validationEnd = sum(this.now, this.scenario.config.validationTicks); this.push(r.validationEnd, "validate", { unitId: r.input.unitId, token: r.token }); }
  private receiptMatches(producer: Runtime, p: SimPrerequisite, commit: SimCommitRecord): boolean {
    if (commit.publicationLevel < p.requiredPublicationLevel) return false;
    const q = p.requirement; if (!q) return true;
    return q.validation === "fixture-only" && commit.outputRevision >= q.minimumRevision && commit.outputRevision <= q.maximumRevision &&
      !!producer.input.outputArtifacts?.some(a => a.artifactId === q.artifactId && a.artifactSha256 === q.artifactSha256 && a.functionId === q.functionId && a.moduleSha256 === q.moduleSha256 && a.artifactKind === q.artifactKind);
  }
  private commit(r: Runtime): void {
    if (r.fenced || r.state !== "VALIDATING") return;
    this.endWait(r); const revision = this.store.revision;
    const commit = this.store.write({ inputRevision: revision, outputRevision: revision + 1, unitId: r.input.unitId,
      resultIds: r.tasks.filter(t => t.role === "R").map(t => t.jobId!), validatedFactIds: r.input.ownedFunctionIds.map(id => `fixture-fact:${id}`), publicationLevel: 1,
      publicationTargetId: "sim-fixture-store", readbackStatus: "verified", readbackHash: hash(canonical(r.tasks.map(t => t.jobId))), futurePrerequisiteEffect: "satisfies" }, this.now);
    this.state(r, "COMMITTED", "fixture_commit_readback"); this.emit("committed", { unitId: r.input.unitId, revision: commit.outputRevision, level: 1 }); this.releaseFamily(r); this.completedAt = this.now;
    this.remainingGroups.set(r.group, this.remainingGroups.get(r.group)! - 1); this.remainingLevels.set(r.level, this.remainingLevels.get(r.level)! - 1);
    while (this.remainingGroups.get(this.firstGroup) === 0) this.firstGroup++;
    while (this.remainingLevels.get(this.firstLevel) === 0) this.firstLevel++;
    for (const id of this.consumers.get(r.input.unitId) ?? []) {
      const consumer = this.units.get(id)!, requirements = consumer.deps.get(r.input.unitId); this.overhead.consumerEdges++;
      if (!requirements) continue;
      if (!requirements.every(p => this.receiptMatches(r, p, commit))) { consumer.reason = "artifact_revision_validation_or_level_shortfall"; this.state(consumer, "BLOCKED", consumer.reason); continue; }
      consumer.deps.delete(r.input.unitId); this.markReady(consumer);
    }
    const boundary = this.scenario.config.policy === "levels" ? this.firstLevel : this.firstGroup;
    const waiters = this.barrierWait.get(boundary);
    if (waiters) { this.barrierWait.delete(boundary); for (const waiter of waiters) this.enqueue(waiter); }
  }
  private barrierOpen(r: Runtime): boolean { return this.scenario.config.policy === "levels" ? r.level <= this.firstLevel : this.scenario.config.policy === "fixed_groups" ? r.group <= this.firstGroup : true; }
  private dispatch(): void {
    this.overhead.dispatchPasses++;
    if (this.scenario.config.autoDispatch === false) return;
    if (this.paused()) { for (const r of this.active) this.wait(r, "paused"); return; }
    for (const r of this.runnable) if (!r.fenced) this.place(r);
    if (this.scenario.config.policy === "sequential" && this.active.size) return;
    for (;;) {
      let candidate: Runtime | undefined;
      for (const heap of this.ready.values()) {
        this.overhead.resourceBucketScans++;
        while (heap.peek() && (heap.peek()!.runtime.state !== "READY" || heap.peek()!.version !== heap.peek()!.runtime.queueVersion)) { heap.pop(); this.readyCount--; }
        const r = heap.peek()?.runtime, worker = r ? this.workerFor(r) : undefined;
        if (r && worker === undefined) {
          const compatibleFree = this.scenario.config.workers.some((w, i) => { this.overhead.workerVisits++; return !this.workers.has(i) && this.workerCompatible(w, r); });
          this.wait(r, compatibleFree ? "quota" : "resource");
        }
        if (r && worker !== undefined && (!candidate || (this.scenario.config.policy === "critical_path" || this.scenario.config.policy === "heterogeneous" ? r.rank > candidate.rank : r.readyAt! < candidate.readyAt!) || (r.readyAt === candidate.readyAt && r.rank === candidate.rank && textOrder(r.input.unitId, candidate.input.unitId) < 0))) candidate = r;
      }
      if (!candidate) break;
      this.heap(candidate).pop(); candidate.queued = false; this.readyCount--; this.overhead.readyPops++;
      if (!this.barrierOpen(candidate)) { this.wait(candidate, "barrier"); const boundary = this.scenario.config.policy === "levels" ? candidate.level : candidate.group; const waiters = this.barrierWait.get(boundary) ?? new Set<Runtime>(); waiters.add(candidate); this.barrierWait.set(boundary, waiters); continue; }
      const clash = this.clash(candidate);
      if (clash) { this.wait(candidate, "conflict"); const wait = this.conflictWait.get(clash) ?? new Set<Runtime>(); wait.add(candidate); candidate.waitingKey = clash; this.conflictWait.set(clash, wait); continue; }
      const reserved = this.tryReserve(candidate.input.unitId, this.scenario.config.controllerId);
      if (!reserved.ok) throw new SimError("invalid_config", `unexpected reservation failure: ${reserved.reason}`);
      if (this.scenario.config.policy === "sequential") break;
    }
  }
  private incident(i: SimIncident): void {
    if (i.kind === "pause" || i.kind === "response_lost" || i.kind === "late_result") return;
    if (i.kind === "new_scc" || i.kind === "partition_adoption" || i.kind === "invalidate_knowledge") {
      const affected = i.unitIds.map(id => this.units.get(id)!).filter(Boolean);
      const delta = { fromRevision: this.store.revision, toRevision: this.store.revision + 1, affectedFunctionIds: affected.flatMap(r => r.input.ownedFunctionIds), origin: i.kind, simulated: true as const };
      this.store.deltas.push({ ...delta, deltaId: fingerprint(delta) });
      for (const r of affected) { if (activeState(r.state)) { this.staleAttempts++; this.emit("context_frozen", { unitId: r.input.unitId, revision: r.contextRevision, manifest: r.contextHash, delta: i.kind }); if (i.kind !== "partition_adoption") this.fence(r, i.kind); } else if (r.state !== "COMMITTED") { r.reason = `requires_new_immutable_plan:${i.kind}`; this.state(r, "STALE", r.reason); } }
      return;
    }
    if (i.kind === "new_dependency") {
      const r = this.units.get(i.consumerUnitId), producer = this.units.get(i.producerUnitId);
      if (!r || !producer) throw new SimError("unknown_unit", "dynamic dependency");
      if (activeState(r.state)) { this.staleAttempts++; this.emit("context_frozen", { unitId: r.input.unitId, manifest: r.contextHash }); this.fence(r, "new_dependency_requires_new_plan"); }
      else if (r.state !== "COMMITTED") { r.reason = "new_dependency_requires_new_plan"; this.state(r, "STALE", r.reason); }
      return;
    }
    if (i.kind === "new_conflict") {
      const a = this.units.get(i.unitIdA), b = this.units.get(i.unitIdB); if (!a || !b) throw new SimError("unknown_unit", "dynamic conflict");
      a.keys.add(i.resourceKey); b.keys.add(i.resourceKey);
      if (activeState(a.state) && activeState(b.state)) { this.fence(a, "new_conflict_overlap"); this.fence(b, "new_conflict_overlap"); }
      else if (activeState(a.state)) this.holders.set(i.resourceKey, a.input.unitId);
      else if (activeState(b.state)) this.holders.set(i.resourceKey, b.input.unitId);
      return;
    }
    if (!("unitId" in i)) throw new SimError("invalid_config", "unhandled incident shape");
    const r = this.units.get(i.unitId); if (!r) throw new SimError("unknown_unit", i.unitId);
    switch (i.kind) {
      case "cancel": if (activeState(r.state)) this.fence(r, "cancel_requires_stop_proof"); else if (r.state !== "COMMITTED") { r.reason = "cancelled_by_fixture"; this.state(r, "CANCELLED", r.reason); } break;
      case "bulletin": {
        const accepted = i.authorRole === "R" && i.canonical && i.validScope !== false && i.validHash !== false && i.coherentTrace !== false;
        const bulletin = { atTick: this.now, unitId: i.unitId, authorRole: i.authorRole, canonical: i.canonical, accepted, rejectionReason: accepted ? null : "author_scope_hash_or_trace" };
        this.bulletins.push(bulletin); this.emit("bulletin", { ...bulletin, canonicalKnowledge: false }); break;
      }
      case "heartbeat_lost": r.heartbeatLost = true; this.emit("heartbeat_lost", { unitId: i.unitId }); break;
      case "lease_expired_worker_active": if (activeState(r.state)) { r.expiry = this.now; this.fence(r, "forced_lease_expiry"); } break;
      case "ambiguous_stop": if (activeState(r.state)) { this.fence(r, "stop_unconfirmed"); this.push(this.now + i.confirmWindow, "quarantine", { unitId: i.unitId, token: r.token }); } break;
      case "stop_confirmed": if (r.fenced) {
        for (const job of [...r.jobs.values()]) { r.wasted += Math.min(job.work, this.now - job.start); this.emit("job_stop_confirmed", { unitId: i.unitId, executionId: job.id, workerId: job.worker }); this.releaseJob(r, job); }
        this.emit("worker_stop_confirmed", { unitId: i.unitId }); this.state(r, "CANCELLED", "fixture_stop_confirmation"); this.releaseFamily(r);
        if (i.retry) {
          r.wasted += r.work; r.work = 0; this.reworkAttempts++; r.reason = null; r.fenced = false; r.heartbeatLost = false;
          if (r.attempt >= this.scenario.config.maxAttempts) this.state(r, "FAILED", "max_attempts_exceeded");
          else { this.state(r, "RETRYABLE", "confirmed_stop_allows_retry"); this.markReady(r); }
        }
      } break;
      case "crash_before_admit": {
        if (!activeState(r.state)) this.emit("crash_before_send_replayed", { unitId: i.unitId });
        else this.fence(r, "crash_before_send_after_admission"); break;
      }
      case "crash_after_admit": if (activeState(r.state)) { this.emit("controller_crash_worker_still_active", { unitId: i.unitId }); this.push(this.now + 1, "reconcile", { unitId: i.unitId, token: r.token }); } break;
      case "double_commit_attempt": {
        const existing = this.store.getCommit(i.unitId); if (!existing) { this.emit("duplicate_before_commit_noop", { unitId: i.unitId }); break; }
        try { this.store.write(existing, this.now); } catch (error) { if (!(error instanceof SimError) || error.code !== "duplicate_commit") throw error; this.emit("double_commit_rejected", { unitId: i.unitId }); } break;
      }
    }
  }
  private process(e: SimEvent): void {
    const r = e.unitId ? this.units.get(e.unitId) : undefined;
    if (r && e.token !== undefined && e.token !== r.token) { this.emit("late_event_ignored", { unitId: e.unitId, token: e.token, currentToken: r.token, jobId: e.jobId ?? null }); return; }
    switch (e.kind) {
      case "start": for (const r of this.units.values()) { if (r.deps.size) this.wait(r, "dependency"); this.markReady(r); } break;
      case "done": this.done(e); break;
      case "validate": if (r) this.commit(r); break;
      case "incident": this.incident(e.incident!); break;
      case "heartbeat": if (r && !r.fenced && activeState(r.state) && !r.heartbeatLost) { this.overhead.heartbeatEvents++; r.expiry = this.now + this.scenario.config.leaseTicks; this.push(r.expiry, "lease", { unitId: r.input.unitId, token: r.token }); this.push(this.now + this.scenario.config.heartbeatEvery, "heartbeat", { unitId: r.input.unitId, token: r.token }); } break;
      case "lease": if (r && activeState(r.state) && !r.fenced && this.now >= r.expiry) this.fence(r, "lease_expired_no_stop_proof"); break;
      case "reconcile": if (r && !r.fenced) { this.emit("reconciled_from_outbox", { unitId: r.input.unitId, attempt: r.attempt }); if (!r.remainingTasks && r.state !== "VALIDATING" && r.state !== "COMMITTED") this.validate(r); } break;
      case "quarantine": if (r?.state === "STOP_PENDING") this.state(r, "QUARANTINED", "stop_unconfirmed"); break;
      case "wake": break;
      case "external_stop": {
        const claim = this.scenario.config.externalClaims!.find(c => c.familyId === e.unitId)!;
        for (const key of claim.resourceKeys) if (this.holders.get(key) === `external:${claim.familyId}`) {
          this.holders.delete(key); this.wakeConflict(key);
        }
        this.emit("external_family_stop_confirmed", { familyId: claim.familyId }); break;
      }
    }
  }
  runUntil(until: number): void {
    while (this.events.peek() && this.events.peek()!.t <= until) {
      const event = this.events.pop()!; if (event.t > this.scenario.config.maxTicks) throw new SimError("horizon_exceeded", String(event.t));
      this.now = event.t; this.process(event); this.dispatch();
    }
  }
  run(): SimRunResult { if (!this.finished) { this.runUntil(Number.MAX_SAFE_INTEGER); this.finished = true; } return this.finalize(); }
  private finalize(): SimRunResult {
    const candidates = [...this.units.values()].filter(r => this.selected.has(r.input.unitId)), committed = candidates.filter(r => r.state === "COMMITTED");
    const complete = committed.length === candidates.length && candidates.length === this.units.size, makespan = complete ? this.completedAt : this.now;
    let useful = 0, rework = 0; for (const r of this.units.values()) { if (r.state === "COMMITTED") useful += r.work; else rework += r.work; rework += r.wasted; }
    const maxSpeed = Math.max(1, ...this.scenario.config.workers.map(w => w.speed ?? 1));
    const nominal = planShape(this.scenario.plan, this.scenario.durations, this.scenario.config.validationTicks), capacity = this.scenario.config.workers.reduce((sum, w) => sum + (w.speed ?? 1), 0);
    if (!Number.isFinite(capacity)) throw new SimError("invalid_config", "speed capacity overflow");
    const optimistic = shape(this.scenario.plan, this.scenario.durations, this.scenario.config.validationTicks, maxSpeed);
    const residual = shape(this.scenario.plan, this.scenario.durations, this.scenario.config.validationTicks, 1, this.units, this.now);
    this.overhead.eventHeapComparisons = this.events.comparisons;
    const totalWorkerTicks = this.scenario.config.workers.length * makespan;
    let occupied = this.occupied, occupationEndTick = this.occupationEnd;
    for (const job of this.workers.values()) { occupied = sum(occupied, this.now - job.start); occupationEndTick = Math.max(occupationEndTick, this.now); }
    const occupationHorizonTicks = Math.max(this.completedAt, occupationEndTick), occupationCapacityTicks = this.scenario.config.workers.length * occupationHorizonTicks;
    const metrics: SimMetrics = { version: 2, rolesParallel: this.scenario.config.rolesParallel ?? this.scenario.config.policy !== "sequential",
      makespan, totalUnits: candidates.length, deferredUnits: this.units.size - candidates.length, committedUnits: committed.length, usefulWorkerTicks: useful, reworkWorkerTicks: rework, totalWorkerTicks, utilization: totalWorkerTicks ? useful / totalWorkerTicks : 0,
      occupiedWorkerTicks: occupied, occupationHorizonTicks, occupationCapacityTicks, occupationUtilization: occupationCapacityTicks ? occupied / occupationCapacityTicks : 0, observationEndTick: this.now, publicationEndTick: this.completedAt, occupationEndTick,
      criticalPathTicks: nominal.criticalPathTicks, estimatedRemainingCriticalPathTicks: residual.criticalPathTicks, totalWorkTicks: nominal.totalWorkTicks, lowerBoundTicks: Math.max(optimistic.criticalPathTicks, capacity ? nominal.totalWorkTicks / capacity : 0),
      waits: { ...this.waits }, contextFreshness: { frozenAttempts: candidates.reduce((n, r) => n + r.attempt, 0), staleAttempts: this.staleAttempts, revisionLagSum: this.revisionLagSum },
      reworkAttempts: this.reworkAttempts, outcome: complete ? "complete" : "stuck", outcomeReasons: [...this.units.values()].filter(r => r.state !== "COMMITTED").map(r => `${r.input.unitId}:${r.state}:${r.reason ?? (r.deps.size ? "dependency" : "profile/quota/resources")}`), overhead: { ...this.overhead } };
    return { trace: this.trace, traceHash: this.traceDigest, decisions: this.decisions, metrics, store: this.store, bulletins: this.bulletins, diagnostics: [...this.diagnostics.values()], resourceModel: this.scenario.plan.resourceSemantics ?? "legacy-manual-synthetic-v1", resourceModelLimit: SIM_RESOURCE_LIMIT,
      units: [...this.units.values()].map(r => ({ unitId: r.input.unitId, state: r.state, dispatchTick: r.dispatchAt, becameReadyTick: r.readyAt, commitLevel: this.store.getCommit(r.input.unitId)?.publicationLevel ?? null, attempts: r.attempt, blockedReason: r.reason, waitReason: r.waitReason, waitTicks: r.waitTicks })) };
  }
}
export const runScenario = (scenario: SimScenario): SimRunResult => new SimEngine(scenario).run();
export interface PolicyComparisonRow { policy: SimPolicyKind; makespan: number; utilization: number; committedUnits: number; reworkAttempts: number; lowerBoundTicks: number; criticalPathTicks: number; traceHash: string; outcome: "complete" | "stuck"; metricsVersion: 2; rolesParallel: boolean; resourceModel: string; resourceModelLimit: string; occupiedWorkerTicks: number; occupationUtilization: number }
export function comparePolicies(base: SimScenario, policies: SimPolicyKind[]): PolicyComparisonRow[] {
  return policies.map(policy => {
    const result = runScenario({ ...base, config: { ...base.config, policy } });
    return { policy, metricsVersion: 2, rolesParallel: result.metrics.rolesParallel, resourceModel: result.resourceModel, resourceModelLimit: result.resourceModelLimit, occupiedWorkerTicks: result.metrics.occupiedWorkerTicks, occupationUtilization: result.metrics.occupationUtilization,
      makespan: result.metrics.makespan, utilization: result.metrics.utilization, committedUnits: result.metrics.committedUnits, reworkAttempts: result.metrics.reworkAttempts,
      lowerBoundTicks: result.metrics.lowerBoundTicks, criticalPathTicks: result.metrics.criticalPathTicks, traceHash: result.traceHash, outcome: result.metrics.outcome };
  });
}

/** Serializable input journal + expected output. Replay reconstructs the fixture
 * queue from immutable inputs, NOT a durable SQLite/native process snapshot.
 */
export interface SimReplayJournal {
  schemaVersion: 1; scenario: Omit<SimScenario, "durations"> & { durations: Array<[string, SimDurations]> };
  scenarioFingerprint: string; expectedTraceHash: string;
}
export function captureReplayJournal(scenario: SimScenario, result = runScenario(scenario)): SimReplayJournal {
  const data = { ...structuredClone({ plan: scenario.plan, config: scenario.config, incidents: scenario.incidents ?? [], seed: scenario.seed }),
    durations: scenario.plan.units.map(u => [u.unitId, structuredClone(durationFor(scenario.durations, u.unitId))] as [string, SimDurations]) };
  return freeze({ schemaVersion: 1, scenario: data, scenarioFingerprint: fingerprint(data), expectedTraceHash: result.traceHash });
}
export function replayScenarioJournal(journal: SimReplayJournal): SimRunResult {
  if (journal.schemaVersion !== 1 || fingerprint(journal.scenario) !== journal.scenarioFingerprint) throw new SimError("plan_non_conformant", "journal schema/fingerprint");
  const result = runScenario({ ...journal.scenario, durations: new Map(journal.scenario.durations) });
  if (result.traceHash !== journal.expectedTraceHash) throw new SimError("plan_non_conformant", "replay trace divergence");
  return result;
}
