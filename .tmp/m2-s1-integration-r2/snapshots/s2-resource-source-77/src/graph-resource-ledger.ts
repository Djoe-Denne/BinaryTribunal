/** Fixture-only76 physical pool contract. No planner, issuer callback, native IO,
 * migration, scheduler or emission. Product types never depend on author inputs.
 */
import { createHash } from "node:crypto";
import type { Database } from "bun:sqlite";
import type { BoundDocument, ByteRef, ReadonlyData } from "./graph-execution-envelope";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import type { ResourceRequirement } from "./planner";
import { EventLog, immutableCopy, integer, invariant, nonempty } from "./eventlog";
import { canonical, fingerprint } from "./validation";

export interface ResourcePoolScopeV1 { fixtureId: "s2-resource-74"; poolId: string; workerNamespace: string; accountNamespace: string }
export interface ResourceWorkScopeV1 {
  fixtureId: "s2-resource-74"; poolId: string; missionId: string; generationId: string; rootAccountId: string; unitId: string;
  owner: string; controllerFence: number; familyFence: number;
  sourceEnvelopeRef: ByteRef; sourceTemplateRef: ByteRef; sourcePlanningRef: ByteRef; sourceBindingsRef: ByteRef;
}
export interface ResourceWorkCutV1 { missionId: string; generationId: string; headRevision: number; inventoryRevision: number; observedEventSequence: number }
export interface ResourceAcquisitionV1 {
  version: "l8-s2-resource-acquisition-fixture-v1"; recordId: string; revision: number; poolScope: ResourcePoolScopeV1;
  workers: { workerId: string; profile: string; model: string; accountId: string; slots: number; cpu: number; gpu: number; budget: number }[];
  accounts: { accountId: string; slots: number; budget: number }[]; maxConcurrent: number;
}
export interface ResourceRemainingV1 {
  version: "l8-s2-resource-remaining-fixture-v1"; recordId: string; revision: number; poolScope: ResourcePoolScopeV1;
  acquisitionRef: ByteRef; previousRef: ByteRef | null; includedAllocationIds: string[]; includedAllocationsDigest: string;
  poolRevision: number; workCuts: ResourceWorkCutV1[];
  workers: { workerId: string; slots: number | null; cpu: number | null; gpu: number | null; budget: number | null; available: boolean | null; occupiedBy: string | null }[];
  accounts: { accountId: string; slots: number | null; budget: number | null }[]; maxConcurrentRemaining: number | null;
}
export interface ResourceAssignmentV1 {
  version: "l8-s2-resource-assignment-fixture-v1"; recordId: string; revision: number; workScope: ResourceWorkScopeV1;
  acquisitionRef: ByteRef; allocationId: string; executionId: string; subIntentId: string; role: "A" | "B" | "R";
  assignment: { unitId: string; workerId: string; familyLeaseKey: string; accountId: string }; requirements: ResourceRequirement;
}
export interface ResourceAllocationV1 {
  allocationId: string; executionId: string; subIntentId: string; role: "A" | "B" | "R"; workerId: string; accountId: string;
  workScope: ResourceWorkScopeV1; requirements: ResourceRequirement; assignmentRef: ByteRef; acquisitionRef: ByteRef;
}
export interface ResourceCurrentV1 {
  version: "l8-s2-resource-current-fixture-v1"; recordId: string; revision: number; poolRevision: number;
  poolScope: ResourcePoolScopeV1; acquisitionRef: ByteRef; remainingRef: ByteRef; revocationRef: ByteRef | null;
}
export type ResourceSourceV1 = ResourceAcquisitionV1 | ResourceRemainingV1 | ResourceAssignmentV1;
export interface ResourceMutationV1 { version: "l8-s2-resource-mutation-fixture-v1"; poolId: string; poolRevision: number; poolScope: ResourcePoolScopeV1; allocation: ResourceAllocationV1; proofDigest: string | null }
export interface ResourceInventoryV1 { poolRevision: number; active: ResourceAllocationV1[]; allocations: ResourceAllocationV1[]; released: string[] }
export const workerDimensions = ["slots", "cpu", "gpu", "budget"] as const;
export const accountDimensions = ["slots", "budget"] as const;
const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
export function closedResourceFieldsV1(value: unknown, keys: readonly string[]): void {
  invariant(value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k)), "HOLD: closed resource record required");
}
function natural(n: number, min = 0): void { integer(n, min); invariant(!Object.is(n, -0), "HOLD: negative-zero resource counter"); }
function nullable(n: number | null): void { if (n !== null) natural(n); }
function strings(values: readonly string[]): void { invariant(Array.isArray(values), "HOLD: resource list missing"); values.forEach(nonempty); invariant(new Set(values).size === values.length, "HOLD: duplicate resource identity"); }
export function checkResourceRefV1(ref: ByteRef): void {
  closedResourceFieldsV1(ref, ["kind", "encoding", "byteLength", "sha256"]); nonempty(ref.kind); natural(ref.byteLength, 1);
  invariant(ref.encoding === "utf8-json-v1" && /^[a-f0-9]{64}$/.test(ref.sha256), "HOLD: resource byte reference");
}
export function resourceDocumentV1<T>(value: T & { version: string }): BoundDocument<T> {
  assertExecutionJsonV1(value); const utf8 = canonical(value);
  return { ref: { kind: value.version, encoding: "utf8-json-v1", byteLength: Buffer.byteLength(utf8, "utf8"), sha256: sha(utf8) }, utf8 };
}
export function resourceRefKeyV1(ref: ByteRef): string { checkResourceRefV1(ref); return `resource-source:${canonical(ref)}`; }
function pool(scope: ResourcePoolScopeV1): void {
  closedResourceFieldsV1(scope, ["fixtureId", "poolId", "workerNamespace", "accountNamespace"]);
  invariant(scope.fixtureId === "s2-resource-74", "HOLD: nonfixture resource domain"); [scope.poolId, scope.workerNamespace, scope.accountNamespace].forEach(nonempty);
}
function work(scope: ResourceWorkScopeV1): void {
  closedResourceFieldsV1(scope, ["fixtureId", "poolId", "missionId", "generationId", "rootAccountId", "unitId", "owner", "controllerFence", "familyFence", "sourceEnvelopeRef", "sourceTemplateRef", "sourcePlanningRef", "sourceBindingsRef"]);
  invariant(scope.fixtureId === "s2-resource-74", "HOLD: nonfixture resource work");
  [scope.poolId, scope.missionId, scope.generationId, scope.rootAccountId, scope.unitId, scope.owner].forEach(nonempty);
  natural(scope.controllerFence); natural(scope.familyFence, 1);
  [scope.sourceEnvelopeRef, scope.sourceTemplateRef, scope.sourcePlanningRef, scope.sourceBindingsRef].forEach(checkResourceRefV1);
}
export function checkResourceRequirementV1(r: ReadonlyData<ResourceRequirement>): void {
  closedResourceFieldsV1(r, ["profiles", "models", "tools", "accounts", "slots", "cpu", "gpu", "budget"]);
  [r.profiles, r.models, r.tools, r.accounts].forEach(strings); workerDimensions.forEach(k => natural(r[k])); natural(r.slots, 1);
}
export function checkResourceSourceV1<T extends ResourceSourceV1>(document: BoundDocument<T>): T {
  assertExecutionJsonV1(document); closedResourceFieldsV1(document, ["ref", "utf8"]); checkResourceRefV1(document.ref);
  invariant(typeof document.utf8 === "string" && Buffer.byteLength(document.utf8, "utf8") === document.ref.byteLength && sha(document.utf8) === document.ref.sha256, "HOLD: resource bytes/ref mismatch");
  const value = JSON.parse(document.utf8) as T; assertExecutionJsonV1(value);
  invariant(canonical(value) === document.utf8 && value.version === document.ref.kind, "HOLD: resource domain/encoding mismatch");
  nonempty(value.recordId); natural(value.revision, 1);
  if (value.version === "l8-s2-resource-acquisition-fixture-v1") {
    closedResourceFieldsV1(value, ["version", "recordId", "revision", "poolScope", "workers", "accounts", "maxConcurrent"]); pool(value.poolScope); natural(value.maxConcurrent, 1);
    invariant(Array.isArray(value.workers) && value.workers.length > 0 && Array.isArray(value.accounts) && value.accounts.length > 0, "HOLD: unknown acquisition inventory");
    strings(value.workers.map(w => w.workerId)); strings(value.accounts.map(a => a.accountId));
    for (const w of value.workers) {
      closedResourceFieldsV1(w, ["workerId", "profile", "model", "accountId", ...workerDimensions]); [w.profile, w.model, w.accountId].forEach(nonempty);
      workerDimensions.forEach(k => natural(w[k])); natural(w.slots, 1); invariant(value.accounts.some(a => a.accountId === w.accountId), "HOLD: acquired worker account missing");
    }
    for (const a of value.accounts) { closedResourceFieldsV1(a, ["accountId", ...accountDimensions]); accountDimensions.forEach(k => natural(a[k])); }
  } else if (value.version === "l8-s2-resource-remaining-fixture-v1") {
    closedResourceFieldsV1(value, ["version", "recordId", "revision", "poolScope", "acquisitionRef", "previousRef", "includedAllocationIds", "includedAllocationsDigest", "poolRevision", "workCuts", "workers", "accounts", "maxConcurrentRemaining"]);
    pool(value.poolScope); checkResourceRefV1(value.acquisitionRef); if (value.previousRef) checkResourceRefV1(value.previousRef);
    natural(value.poolRevision); nullable(value.maxConcurrentRemaining); strings(value.includedAllocationIds);
    invariant(canonical(value.includedAllocationIds) === canonical([...value.includedAllocationIds].sort()) && /^[a-f0-9]{64}$/.test(value.includedAllocationsDigest), "HOLD: included allocation order/digest");
    invariant(Array.isArray(value.workCuts) && Array.isArray(value.workers) && Array.isArray(value.accounts), "HOLD: unknown remaining inventory");
    strings(value.workCuts.map(c => c.missionId)); strings(value.workers.map(w => w.workerId)); strings(value.accounts.map(a => a.accountId));
    for (const c of value.workCuts) { closedResourceFieldsV1(c, ["missionId", "generationId", "headRevision", "inventoryRevision", "observedEventSequence"]); nonempty(c.generationId); [c.headRevision, c.inventoryRevision, c.observedEventSequence].forEach(n => natural(n)); }
    for (const w of value.workers) { closedResourceFieldsV1(w, ["workerId", ...workerDimensions, "available", "occupiedBy"]); workerDimensions.forEach(k => nullable(w[k])); invariant(w.available === null || typeof w.available === "boolean", "HOLD: worker availability unknown shape"); if (w.occupiedBy !== null) nonempty(w.occupiedBy); }
    for (const a of value.accounts) { closedResourceFieldsV1(a, ["accountId", ...accountDimensions]); accountDimensions.forEach(k => nullable(a[k])); }
  } else {
    invariant(value.version === "l8-s2-resource-assignment-fixture-v1", "HOLD: unsupported resource source");
    closedResourceFieldsV1(value, ["version", "recordId", "revision", "workScope", "acquisitionRef", "allocationId", "executionId", "subIntentId", "role", "assignment", "requirements"]);
    work(value.workScope); checkResourceRefV1(value.acquisitionRef); [value.allocationId, value.executionId, value.subIntentId].forEach(nonempty);
    invariant(["A", "B", "R"].includes(value.role), "HOLD: resource role");
    closedResourceFieldsV1(value.assignment, ["unitId", "workerId", "familyLeaseKey", "accountId"]); Object.values(value.assignment).forEach(nonempty); checkResourceRequirementV1(value.requirements);
  }
  return immutableCopy(value);
}
function checkAllocation(a: ResourceAllocationV1): void {
  closedResourceFieldsV1(a, ["allocationId", "executionId", "subIntentId", "role", "workerId", "accountId", "workScope", "requirements", "assignmentRef", "acquisitionRef"]);
  [a.allocationId, a.executionId, a.subIntentId, a.workerId, a.accountId].forEach(nonempty); invariant(["A", "B", "R"].includes(a.role), "HOLD: allocation role");
  work(a.workScope); checkResourceRequirementV1(a.requirements); checkResourceRefV1(a.assignmentRef); checkResourceRefV1(a.acquisitionRef);
}
export const resourceWorkerKeyV1 = (scope: ResourcePoolScopeV1, id: string) => `resource-worker:${canonical([scope.workerNamespace, id])}`;
export function resourceWorkCutsV1(db: Database): ResourceWorkCutV1[] {
  const heads = db.query("SELECT mission,document,digest FROM g3_head ORDER BY mission").all() as { mission: string; document: string; digest: string }[];
  return heads.map(row => {
    const v = JSON.parse(row.document) as { missionId: string; generationId: string; revision: number; inventoryRevision: number };
    invariant(fingerprint(v) === row.digest && v.missionId === row.mission, "HOLD: resource work head corrupt");
    const stream = db.query("SELECT sequence FROM ff8_graph_streams WHERE mission=?").get(row.mission) as { sequence: number } | null;
    invariant(stream, "HOLD: work stream unknown"); return { missionId: v.missionId, generationId: v.generationId, headRevision: v.revision, inventoryRevision: v.inventoryRevision, observedEventSequence: stream.sequence };
  });
}
/** Small physical-only reducer. All pool occupations in OWN, never unit-filtered.
 * Old outbox evidence without an allocation is UNKNOWN for new consumption.
 */
export function readResourceInventoryV1(db: Database, events: EventLog, poolId: string): ResourceInventoryV1 {
  const streams = db.query("SELECT mission FROM ff8_graph_streams ORDER BY mission").all() as { mission: string }[];
  const mutations: { kind: string; mutation: ResourceMutationV1 }[] = [];
  for (const { mission } of streams) {
    const verified = events.replay(mission, [] as ReturnType<EventLog["read"]>, (state, event) => { state.push(event); return state; });
    invariant((verified.at(-1)?.sequence ?? 0) === events.cursor(mission).sequence, "HOLD: resource stream cursor mismatch");
    for (const event of verified) if (event.kind === "g3_resource_allocated" || event.kind === "g3_resource_released") {
      const m = event.payload as ResourceMutationV1;
      closedResourceFieldsV1(m, ["version", "poolId", "poolRevision", "poolScope", "allocation", "proofDigest"]);
      invariant(m.version === "l8-s2-resource-mutation-fixture-v1" && m.poolId === m.poolScope.poolId, "HOLD: resource event domain");
      pool(m.poolScope); natural(m.poolRevision, 1); checkAllocation(m.allocation);
      invariant(m.allocation.workScope.missionId === mission && m.allocation.workScope.unitId === event.unitId && m.allocation.workScope.poolId === m.poolId, "HOLD: resource event work scope");
      invariant(event.kind === "g3_resource_allocated" ? m.proofDigest === null : typeof m.proofDigest === "string" && /^[a-f0-9]{64}$/.test(m.proofDigest), "HOLD: resource release proof missing");
      if (event.kind === "g3_resource_released") {
        const q = verified.find(e => e.sequence < event.sequence && e.key === `observation:terminal:${m.proofDigest}` && e.kind === "g3_fixture_observation");
        const payload = q?.payload as { proof: { executionId: string; missionId: string; generationId: string; familyFence: number; controllerFence: number; quiescent: boolean }; effect: string } | undefined;
        invariant(payload && ["TERMINAL", "REJECTED"].includes(payload.effect) && fingerprint(payload.proof) === m.proofDigest
          && payload.proof.executionId === m.allocation.executionId && payload.proof.missionId === mission && payload.proof.generationId === m.allocation.workScope.generationId
          && payload.proof.familyFence === m.allocation.workScope.familyFence && payload.proof.controllerFence === m.allocation.workScope.controllerFence
          && payload.proof.quiescent === true, "HOLD: physical release lacks prior exact durable Q");
        const proof = db.query("SELECT document,digest FROM g3_authority WHERE record_ref=? AND kind='observation'").get(`fixture:${m.proofDigest}`) as { document: string; digest: string } | null;
        invariant(proof && proof.document === canonical(payload.proof) && proof.digest === m.proofDigest, "HOLD: physical historical Q registration missing");
      }
      mutations.push({ kind: event.kind, mutation: m });
    }
  }
  const allAllocated = new Map<string, ResourceAllocationV1>(), allActive = new Map<string, ResourceAllocationV1>();
  const released = new Set<string>(), workerKeys = new Map<string, string>(), revisions = new Map<string, number>(), scopes = new Map<string, ResourcePoolScopeV1>();
  for (const { kind, mutation: m } of mutations.sort((a, b) => a.mutation.poolRevision - b.mutation.poolRevision)) {
    invariant(m.poolRevision === (revisions.get(m.poolId) ?? 0) + 1, "HOLD: physical pool event revision gap/duplicate"); revisions.set(m.poolId, m.poolRevision);
    invariant(!scopes.has(m.poolId) || canonical(scopes.get(m.poolId)) === canonical(m.poolScope), "HOLD: pool identity changed"); scopes.set(m.poolId, m.poolScope);
    const a = m.allocation, key = resourceWorkerKeyV1(m.poolScope, a.workerId);
    if (kind === "g3_resource_allocated") {
      invariant(!allAllocated.has(a.allocationId) && ![...allAllocated.values()].some(old => old.executionId === a.executionId) && !workerKeys.has(key), "HOLD: duplicate execution/allocation/worker");
      allAllocated.set(a.allocationId, a); allActive.set(a.allocationId, a); workerKeys.set(key, a.allocationId);
    } else {
      invariant(allActive.has(a.allocationId) && canonical(allActive.get(a.allocationId)) === canonical(a) && workerKeys.get(key) === a.allocationId, "HOLD: release of wrong allocation");
      allActive.delete(a.allocationId); workerKeys.delete(key); released.add(a.allocationId);
    }
  }
  const claims = db.query("SELECT * FROM g3_claims WHERE resource_key LIKE 'resource-worker:%' ORDER BY resource_key").all() as { resource_key: string; mission: string; generation: string; unit: string; family_fence: number }[];
  invariant(claims.length === workerKeys.size, "HOLD: physical claims/events disagree");
  for (const row of claims) {
    const id = workerKeys.get(row.resource_key), a = id ? allActive.get(id) : undefined;
    invariant(a && a.workScope.missionId === row.mission && a.workScope.generationId === row.generation && a.workScope.unitId === row.unit && a.workScope.familyFence === row.family_fence, "HOLD: physical worker claim binding");
  }
  const rows = db.query("SELECT execution_id,mission,generation,unit,sub_intent,family_fence,controller_fence,root_id,slot_key FROM g3_outbox").all() as { execution_id: string; mission: string; generation: string; unit: string; sub_intent: string; family_fence: number; controller_fence: number; root_id: string; slot_key: string }[];
  for (const a of allAllocated.values()) {
    // Audit historical immutable registration bytes even when revoked later.
    // This is NOT a consumer authority check; new work uses current source APIs.
    const auditSource = (ref: ByteRef) => {
      const row = db.query("SELECT document,digest,revision,revoked FROM g3_authority WHERE record_ref=?").get(resourceRefKeyV1(ref)) as { document: string; digest: string; revision: number; revoked: number } | null;
      invariant(row && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: physical source audit bytes unavailable/corrupt");
      const doc = JSON.parse(row.document) as BoundDocument<ResourceSourceV1>, value = checkResourceSourceV1(doc);
      invariant(canonical(doc.ref) === canonical(ref) && canonical(doc) === row.document && row.revision === value.revision + (row.revoked === 1 ? 1 : 0), "HOLD: physical source audit reference/revision mismatch");
      return value;
    };
    const assignment = auditSource(a.assignmentRef), acquisition = auditSource(a.acquisitionRef);
    invariant(assignment.version === "l8-s2-resource-assignment-fixture-v1" && acquisition.version === "l8-s2-resource-acquisition-fixture-v1", "HOLD: physical source audit kind mismatch");
    const expected: ResourceAllocationV1 = { allocationId: assignment.allocationId, executionId: assignment.executionId, subIntentId: assignment.subIntentId,
      role: assignment.role, workerId: assignment.assignment.workerId, accountId: assignment.assignment.accountId, workScope: assignment.workScope,
      requirements: assignment.requirements, assignmentRef: a.assignmentRef, acquisitionRef: assignment.acquisitionRef };
    invariant(canonical(expected) === canonical(a) && canonical(scopes.get(a.workScope.poolId)) === canonical(acquisition.poolScope), "HOLD: journal physical allocation differs from retained authority");
    const row = rows.find(r => r.execution_id === a.executionId);
    invariant(row && row.mission === a.workScope.missionId && row.generation === a.workScope.generationId && row.unit === a.workScope.unitId && row.sub_intent === a.subIntentId && row.family_fence === a.workScope.familyFence && row.controller_fence === a.workScope.controllerFence, "HOLD: physical outbox pin mismatch");
    const slot = db.query("SELECT state,claim_utf8 FROM g3_slots WHERE root_id=? AND slot_key=?").get(row.root_id, row.slot_key) as { state: string; claim_utf8: string | null } | null;
    invariant(slot?.state === "SPENT" && slot.claim_utf8, "HOLD: physical allocation has no logical SPENT pin");
    const claim = JSON.parse(slot.claim_utf8) as { executionId: string; resourceSources: { acquisitionRef: ByteRef; assignmentRef: ByteRef; remainingRef: ByteRef } };
    invariant(claim.executionId === a.executionId && claim.resourceSources && canonical(claim.resourceSources.acquisitionRef) === canonical(a.acquisitionRef)
      && canonical(claim.resourceSources.assignmentRef) === canonical(a.assignmentRef), "HOLD: physical/logical retained source mismatch");
    const observed = auditSource(claim.resourceSources.remainingRef);
    invariant(observed.version === "l8-s2-resource-remaining-fixture-v1" && canonical(observed.acquisitionRef) === canonical(a.acquisitionRef)
      && canonical(observed.poolScope) === canonical(acquisition.poolScope), "HOLD: physical original remaining source mismatch");
  }
  for (const [id, revision] of revisions) {
    const row = db.query("SELECT document,digest FROM g3_authority WHERE record_ref=? AND kind='resource-current'").get(`resource-current:${id}`) as { document: string; digest: string } | null;
    invariant(row && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: physical pool current projection missing/corrupt");
    const current = JSON.parse(row.document) as ResourceCurrentV1;
    invariant(current.poolRevision === revision && canonical(current.poolScope) === canonical(scopes.get(id)), "HOLD: physical pool current revision/scope mismatch");
  }
  invariant(rows.every(row => [...allAllocated.values()].some(a => a.executionId === row.execution_id)), "HOLD: old/untracked physical occupation is UNKNOWN");
  const ordered = (values: Iterable<ResourceAllocationV1>) => [...values].filter(a => a.workScope.poolId === poolId).sort((a, b) => a.allocationId < b.allocationId ? -1 : 1);
  return immutableCopy({ poolRevision: revisions.get(poolId) ?? 0, active: ordered(allActive.values()), allocations: ordered(allAllocated.values()), released: [...released].filter(id => allAllocated.get(id)?.workScope.poolId === poolId).sort() });
}
function sum(values: number[]): number { return values.reduce((s, n) => { natural(n); natural(s + n); return s + n; }, 0); }
/** Snapshot is already REMAINING. Existing demands are used only to check that
 * it cannot exceed acquired-minus-included, NOT subtracted a second time.
 */
export function assertResourceSnapshotV1(db: Database, events: EventLog, acquired: ResourceAcquisitionV1, remaining: ResourceRemainingV1): ResourceInventoryV1 {
  const inventory = readResourceInventoryV1(db, events, acquired.poolScope.poolId);
  invariant(canonical(remaining.poolScope) === canonical(acquired.poolScope) && remaining.poolRevision === inventory.poolRevision
    && canonical(remaining.workCuts) === canonical(resourceWorkCutsV1(db)), "HOLD: stale resource pool/work cut");
  invariant(canonical(remaining.includedAllocationIds) === canonical(inventory.active.map(a => a.allocationId)) && remaining.includedAllocationsDigest === fingerprint(inventory.active), "HOLD: incomplete/changed included pool allocations");
  invariant(canonical(remaining.workers.map(w => w.workerId).sort()) === canonical(acquired.workers.map(w => w.workerId).sort())
    && canonical(remaining.accounts.map(a => a.accountId).sort()) === canonical(acquired.accounts.map(a => a.accountId).sort()), "HOLD: resource remaining inventory differs");
  for (const w of remaining.workers) {
    const original = acquired.workers.find(a => a.workerId === w.workerId)!;
    const active = inventory.active.filter(a => a.workerId === w.workerId);
    invariant(active.length <= 1 && w.occupiedBy === (active[0]?.allocationId ?? null), "HOLD: worker occupancy observation differs");
    for (const k of workerDimensions) if (w[k] !== null) invariant(w[k]! <= original[k] - sum(active.map(a => a.requirements[k])), "HOLD: worker remaining exceeds acquired-minus-included");
  }
  for (const a of remaining.accounts) {
    const original = acquired.accounts.find(x => x.accountId === a.accountId)!;
    for (const k of accountDimensions) if (a[k] !== null) invariant(a[k]! <= original[k] - sum(inventory.active.filter(x => x.accountId === a.accountId).map(x => x.requirements[k])), "HOLD: account remaining exceeds acquired-minus-included");
  }
  if (remaining.maxConcurrentRemaining !== null) invariant(remaining.maxConcurrentRemaining <= acquired.maxConcurrent - inventory.active.length, "HOLD: concurrency remaining exceeds acquisition");
  return inventory;
}
