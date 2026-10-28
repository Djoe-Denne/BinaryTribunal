// L8 transport only. These documents are neither executable PreparedGraphV1/V2
// nor capabilities. No decode or inspection activates/adopts a partition.
import preparedGraphSchema from "../schemas/l8-prepared-graph-v3.schema.json";
import partitionAdoptionSchema from "../schemas/l8-partition-adoption-v1.schema.json";
import { validateStaticJsonSchema, type StaticJsonSchema } from "./graph";
import { communityContentId, inspectProposalEvidence, type ClusterPartitionView,
  type FrozenActiveUnit, type ProposalEvidence, type UnitQuiescenceProof } from "./lineage";
import type { InvestigationGroup } from "./investigation-groups";
import { canonical, hash } from "./validation";

export type TransportReadonly<T> = T extends object
  ? { readonly [K in keyof T]: TransportReadonly<T[K]> } : T;

/** Schema granularity is deliberately wider than InvestigationGroup's TS union. */
export type InvestigationGroupTransportV1 = Omit<InvestigationGroup, "granularity"> & {
  granularity: "function" | "family" | "scc" | "group" | "subgroup";
};
export type CurrentPartitionTransportV1 = Omit<ClusterPartitionView, "adopted"> & { adopted: false };
export type ProposalEvidenceTransportV1 = Omit<ProposalEvidence, "result"> & {
  result: Omit<ProposalEvidence["result"], "partition"> & { partition: CurrentPartitionTransportV1 };
};
export type PreparedGraphTransportV3 = TransportReadonly<{
  schemaVersion: 3;
  partition: CurrentPartitionTransportV1;
  groups: InvestigationGroupTransportV1[];
  proposalEvidence?: ProposalEvidenceTransportV1;
}>;
export type PartitionAdoptionTransportV1 = TransportReadonly<{
  schemaVersion: 1;
  partitionId: string;
  lineageId: string;
  snapshotId: string;
  snapshotFingerprint: string;
  configFingerprint: string;
  proposalFingerprint: string;
  observedDigest: string;
  fromRevision: number;
  toRevision: number;
  quiescenceProofs: UnitQuiescenceProof[];
  actor: { hostReceiptRef: string };
  inventory: Array<Omit<FrozenActiveUnit, "executionContext">>;
  explicit: true;
}>;

export type TransportDecodeResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly string[] };

export interface TransportEvidenceInspection {
  readonly status: "not-present" | "not-applicable-A" | "inspected-B" | "not-applicable-adoption";
  readonly present: boolean;
  /** Null means not inspected by the B-specific evidence inspector, NOT false. */
  readonly wellFormed: boolean | null;
  readonly admissible: boolean | null;
}
export interface PreparedGraphTransportStats {
  readonly communityCount: number;
  readonly groupCount: number;
  readonly memberIdCount: number;
  readonly kernelIdCount: number;
  readonly externalContextIdCount: number;
  readonly ownedFunctionIdCount: number;
  readonly groupContextIdCount: number;
  readonly uncoveredIdCount: number;
  readonly snapshotNodeCount: number | null;
  readonly snapshotEdgeCount: number | null;
}
export interface PartitionAdoptionTransportStats {
  readonly inventoryUnitCount: number;
  readonly quiescenceProofCount: number;
  readonly ownedFunctionIdCount: number;
  /** Inventory lists only; no implicit [] and no summation of proof echoes. */
  readonly attemptIdCount: number;
  readonly claimIdCount: number;
  readonly unknownAttemptInventoryCount: number;
  readonly unknownClaimInventoryCount: number;
}
interface TransportInspection {
  /** Shape/JSON decoding only; no relation, outcome or authority is implied. */
  readonly wellFormed: boolean;
  readonly coherent: boolean;
  readonly schemaErrors: readonly string[];
  readonly coherenceErrors: readonly string[];
  readonly evidence: TransportEvidenceInspection;
  readonly authority: "untrusted";
  readonly adoptionReady: false;
}
export interface PreparedGraphTransportInspection extends TransportInspection {
  readonly branch: "A" | "B" | null;
  readonly stats: PreparedGraphTransportStats | null;
}
export interface PartitionAdoptionTransportInspection extends TransportInspection {
  readonly preparedBinding: "not-requested" | "invalid-prepared" | "matched" | "mismatched";
  readonly stats: PartitionAdoptionTransportStats | null;
}

const SHA = /^[a-f0-9]{64}$/;
const FUNCTION_ID = /^[a-f0-9]{64}:0x[1-9A-F][0-9A-F]*$/;
type Partition = TransportReadonly<ClusterPartitionView>;
type InventoryUnit = PartitionAdoptionTransportV1["inventory"][number];
type Errors = string[];

/** Input-domain guard, NOT a second schema validator. Never read an accessor.
 * Shared references are allowed; cycles, sparse arrays and non-JSON own keys are
 * not. No new count/depth/byte budget is imposed on the ratified transports.
 */
function plainJson(value: unknown, parents = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || parents.has(value)) return false;
  const array = Array.isArray(value);
  if (Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype)) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors);
  if (array && keys.length !== (value as unknown[]).length + 1) return false;
  parents.add(value);
  for (const key of keys) {
    if (array && key === "length") continue;
    if (typeof key !== "string") return false;
    if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= (value as unknown[]).length)) return false;
    const descriptor = descriptors[key]!;
    if (!descriptor.enumerable || !("value" in descriptor) || !plainJson(descriptor.value, parents)) return false;
  }
  parents.delete(value);
  return true;
}
function freezeData<T>(value: T): TransportReadonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeData(child);
    Object.freeze(value);
  }
  return value as TransportReadonly<T>;
}
function decode<T>(value: unknown, schema: StaticJsonSchema): TransportDecodeResult<T> {
  try {
    if (!plainJson(value)) return { ok: false, errors: ["$: finite plain JSON data required (no accessors, cycles, holes or extra array keys)"] };
    const copy: unknown = structuredClone(value);
    const errors = validateStaticJsonSchema(copy, schema);
    if (errors.length) return { ok: false, errors };
    // Only the shared schema establishes this transport type. No domain A cast.
    return { ok: true, value: freezeData(copy) as T };
  } catch {
    return { ok: false, errors: ["$: transport decoding could not inspect, clone or validate the input"] };
  }
}

/** Shape only: does NOT call inspectProposalEvidence, clustering or a store. */
export function decodePreparedGraphV3(value: unknown): TransportDecodeResult<PreparedGraphTransportV3> {
  return decode<PreparedGraphTransportV3>(value, preparedGraphSchema as StaticJsonSchema);
}
/** Shape only: hostReceiptRef remains an unresolved string, even when nonempty. */
export function decodePartitionAdoptionV1(value: unknown): TransportDecodeResult<PartitionAdoptionTransportV1> {
  return decode<PartitionAdoptionTransportV1>(value, partitionAdoptionSchema as StaticJsonSchema);
}

function requireRelation(errors: Errors, condition: boolean, path: string, detail: string): void {
  if (!condition) errors.push(`${path}: ${detail}`);
}
function unique(ids: readonly string[], errors: Errors, path: string): Set<string> {
  const set = new Set(ids);
  requireRelation(errors, set.size === ids.length, path, "duplicate identities");
  return set;
}
function functionIds(ids: readonly string[], errors: Errors, path: string): Set<string> {
  const set = unique(ids, errors, path);
  requireRelation(errors, ids.every(id => FUNCTION_ID.test(id)), path, "canonical lowercase module SHA plus uppercase nonzero RVA required");
  return set;
}
function equalIds(left: readonly string[], right: readonly string[]): boolean {
  const a = new Set(left), b = new Set(right);
  return a.size === left.length && b.size === right.length && a.size === b.size && [...a].every(id => b.has(id));
}
function metricCoherence(metric: TransportReadonly<{ known: boolean; value: number | null }>, errors: Errors, path: string): void {
  requireRelation(errors, metric.known ? Number.isSafeInteger(metric.value) : metric.value === null, path, "known/value mismatch");
}
function partitionRelations(partition: Partition, errors: Errors): Set<string> {
  requireRelation(errors, SHA.test(partition.snapshotFingerprint), "$.partition.snapshotFingerprint", "lowercase SHA-256 required");
  requireRelation(errors, SHA.test(partition.configFingerprint), "$.partition.configFingerprint", "lowercase SHA-256 required");
  requireRelation(errors, partition.lineageId !== partition.partitionId, "$.partition.lineageId", "lineage identity must differ from partition identity");
  metricCoherence(partition.modularity, errors, "$.partition.modularity");
  const members = new Set<string>(), contentIds = new Set<string>();
  partition.communities.forEach((community, index) => {
    const path = `$.partition.communities[${index}]`;
    requireRelation(errors, SHA.test(community.contentId) && !contentIds.has(community.contentId), `${path}.contentId`, "lowercase unique content identity required");
    contentIds.add(community.contentId);
    requireRelation(errors, community.lineageId !== community.contentId, `${path}.lineageId`, "lineage identity must differ from content identity");
    const owned = functionIds(community.memberIds, errors, `${path}.memberIds`);
    requireRelation(errors, [...owned].every(id => !members.has(id)), `${path}.memberIds`, "function has multiple community owners");
    owned.forEach(id => members.add(id));
    const kernel = functionIds(community.kernelIds, errors, `${path}.kernelIds`);
    requireRelation(errors, [...kernel].every(id => owned.has(id)), `${path}.kernelIds`, "kernel must be a subset of membership");
    const context = functionIds(community.externalContextIds, errors, `${path}.externalContextIds`);
    requireRelation(errors, [...context].every(id => !owned.has(id)), `${path}.externalContextIds`, "external context intersects membership");
    unique(community.parentContentIds, errors, `${path}.parentContentIds`);
    requireRelation(errors, community.parentContentIds.every(id => SHA.test(id)), `${path}.parentContentIds`, "lowercase content identities required");
    if (community.memberIds.every(id => FUNCTION_ID.test(id))) {
      requireRelation(errors, community.contentId === communityContentId(partition.algorithm, partition.algorithmVersion, partition.configFingerprint, community.memberIds), `${path}.contentId`, "membership content hash mismatch");
    }
    metricCoherence(community.conductance, errors, `${path}.conductance`);
  });
  return members;
}
function groupRelations(prepared: PreparedGraphTransportV3, members: Set<string>, errors: Errors): void {
  const communities = new Set(prepared.partition.communities.map(item => item.contentId));
  const groupIds = new Set<string>(), owners = new Set<string>();
  prepared.groups.forEach((group, index) => {
    const path = `$.groups[${index}]`;
    requireRelation(errors, !groupIds.has(group.groupId), `${path}.groupId`, "duplicate group identity");
    groupIds.add(group.groupId);
    requireRelation(errors, group.partitionId === prepared.partition.partitionId, `${path}.partitionId`, "partition join mismatch");
    requireRelation(errors, communities.has(group.communityContentId), `${path}.communityContentId`, "community join missing");
    const owned = functionIds(group.ownedFunctionIds, errors, `${path}.ownedFunctionIds`);
    requireRelation(errors, [...owned].every(id => members.has(id) && !owners.has(id)), `${path}.ownedFunctionIds`, "unknown or multiply owned function");
    owned.forEach(id => owners.add(id));
    const context = functionIds(group.contextFunctionIds, errors, `${path}.contextFunctionIds`);
    requireRelation(errors, [...context].every(id => members.has(id) && !owned.has(id)), `${path}.contextFunctionIds`, "unknown or owned context function");
    const uncovered = functionIds(group.uncoveredIds, errors, `${path}.uncoveredIds`);
    requireRelation(errors, [...uncovered].every(id => members.has(id)), `${path}.uncoveredIds`, "unknown uncovered function");
    const maturityIds = functionIds(group.memberMaturity.map(item => item.functionId), errors, `${path}.memberMaturity`);
    requireRelation(errors, [...maturityIds].every(id => owned.has(id)), `${path}.memberMaturity`, "maturity refers to a non-owned function");
    metricCoherence(group.estimatedCost, errors, `${path}.estimatedCost`);
    // No owned-subset-of-primary-community or full-coverage requirement:
    // attach-adjacent groups and kernel-empty communities are legitimate.
  });
}
function noEvidence(status: TransportEvidenceInspection["status"] = "not-present", present = false): TransportEvidenceInspection {
  return { status, present, wellFormed: null, admissible: null };
}
function preparedStats(value: PreparedGraphTransportV3): PreparedGraphTransportStats {
  const total = <T>(items: readonly T[], length: (item: T) => number) => items.reduce((sum, item) => sum + length(item), 0);
  return {
    communityCount: value.partition.communities.length, groupCount: value.groups.length,
    memberIdCount: total(value.partition.communities, item => item.memberIds.length),
    kernelIdCount: total(value.partition.communities, item => item.kernelIds.length),
    externalContextIdCount: total(value.partition.communities, item => item.externalContextIds.length),
    ownedFunctionIdCount: total(value.groups, item => item.ownedFunctionIds.length),
    groupContextIdCount: total(value.groups, item => item.contextFunctionIds.length),
    uncoveredIdCount: total(value.groups, item => item.uncoveredIds.length),
    snapshotNodeCount: value.proposalEvidence?.source.snapshot.nodes.length ?? null,
    snapshotEdgeCount: value.proposalEvidence?.source.snapshot.edges.length ?? null,
  };
}

/** Pure documentary inspection. B evidence inspection can recompute scientific
 * consistency via the EXISTING inspector; its outcome is not HOST authority.
 * In particular coherent=true/evidence.admissible=false is a valid negative.
 */
export function inspectPreparedGraphV3(value: unknown): PreparedGraphTransportInspection {
  const decoded = decodePreparedGraphV3(value);
  if (!decoded.ok) return { wellFormed: false, coherent: false, branch: null, schemaErrors: decoded.errors,
    coherenceErrors: [], stats: null, evidence: noEvidence(), authority: "untrusted", adoptionReady: false };
  const prepared = decoded.value, errors: Errors = [], branch = prepared.partition.regime;
  let evidence = noEvidence(prepared.proposalEvidence && branch === "A" ? "not-applicable-A" : "not-present", !!prepared.proposalEvidence);
  try {
    if (branch === "B" && prepared.proposalEvidence) {
      const assessed = inspectProposalEvidence(prepared.proposalEvidence);
      evidence = { status: "inspected-B", present: true, wellFormed: assessed.wellFormed, admissible: assessed.admissible };
      requireRelation(errors, assessed.wellFormed, "$.proposalEvidence", "existing B evidence structural/content consistency check failed");
    }
    const members = partitionRelations(prepared.partition, errors);
    groupRelations(prepared, members, errors);
    if (branch === "A") {
      requireRelation(errors, prepared.partition.parentLineageId === null && prepared.partition.maturity === "structural", "$.partition", "branch A requires structural maturity and null parent lineage");
      // Presence is not forbidden on A. Its mirror is a transport relation, but
      // the B-only inspector is deliberately NOT used as an A rejection gate.
      if (prepared.proposalEvidence) {
        requireRelation(errors, canonical(prepared.partition) === canonical(prepared.proposalEvidence.result.partition), "$.proposalEvidence.result.partition", "root/evidence partition mirror mismatch");
      }
    } else if (!prepared.proposalEvidence) {
      requireRelation(errors, false, "$.proposalEvidence", "branch B requires proposal evidence");
    } else {
      requireRelation(errors, canonical(prepared.partition) === canonical(prepared.proposalEvidence.result.partition), "$.proposalEvidence.result.partition", "root/evidence partition mirror mismatch");
      // admissible=false is an outcome, NEVER an extra coherence/schema error.
    }
  } catch {
    errors.push("$: documentary relation inspection could not complete");
  }
  return { wellFormed: true, coherent: errors.length === 0, branch, schemaErrors: [], coherenceErrors: errors,
    stats: preparedStats(prepared), evidence, authority: "untrusted", adoptionReady: false };
}

function inventoryRelations(unit: InventoryUnit, index: number, errors: Errors): void {
  const path = `$.inventory[${index}]`;
  functionIds(unit.ownedFunctionIds, errors, `${path}.ownedFunctionIds`);
  if (unit.attemptIds !== undefined) unique(unit.attemptIds, errors, `${path}.attemptIds`);
  if (unit.claimIds !== undefined) unique(unit.claimIds, errors, `${path}.claimIds`);
  if (unit.attempts !== undefined) {
    const ids = unit.attempts.map(item => item.attemptId);
    unique(ids, errors, `${path}.attempts`);
    requireRelation(errors, unit.attempts.every(item => item.snapshotId === unit.snapshotId), `${path}.attempts`, "unit snapshot join mismatch");
    if (unit.attemptIds !== undefined) requireRelation(errors, equalIds(ids, unit.attemptIds), `${path}.attempts`, "attempt identities differ from inventory list");
  }
  if (unit.claims !== undefined) {
    const ids = unit.claims.map(item => item.claimId);
    unique(ids, errors, `${path}.claims`);
    requireRelation(errors, unit.claims.every(item => item.snapshotId === unit.snapshotId), `${path}.claims`, "unit snapshot join mismatch");
    if (unit.claimIds !== undefined) requireRelation(errors, equalIds(ids, unit.claimIds), `${path}.claims`, "claim identities differ from inventory list");
  }
}
function adoptionStats(value: PartitionAdoptionTransportV1): PartitionAdoptionTransportStats {
  return {
    inventoryUnitCount: value.inventory.length, quiescenceProofCount: value.quiescenceProofs.length,
    ownedFunctionIdCount: value.inventory.reduce((sum, unit) => sum + unit.ownedFunctionIds.length, 0),
    attemptIdCount: value.inventory.reduce((sum, unit) => sum + (unit.attemptIds?.length ?? 0), 0),
    claimIdCount: value.inventory.reduce((sum, unit) => sum + (unit.claimIds?.length ?? 0), 0),
    unknownAttemptInventoryCount: value.inventory.filter(unit => unit.attemptIds === undefined).length,
    unknownClaimInventoryCount: value.inventory.filter(unit => unit.claimIds === undefined).length,
  };
}

/** Checks declarations against declarations, optionally a prepared document.
 * Does not resolve HOST, consult L6, call planAdoption or grant a capability.
 * False quiescence flags and absent inventories remain data, not proof of Q.
 */
export function inspectPartitionAdoptionV1(value: unknown, prepared?: unknown): PartitionAdoptionTransportInspection {
  const decoded = decodePartitionAdoptionV1(value);
  if (!decoded.ok) return { wellFormed: false, coherent: false, schemaErrors: decoded.errors, coherenceErrors: [],
    stats: null, evidence: noEvidence("not-applicable-adoption"), preparedBinding: "not-requested", authority: "untrusted", adoptionReady: false };
  const adoption = decoded.value, errors: Errors = [];
  let preparedBinding: PartitionAdoptionTransportInspection["preparedBinding"] = "not-requested";
  try {
    for (const field of ["snapshotFingerprint", "configFingerprint", "proposalFingerprint", "observedDigest"] as const) {
      requireRelation(errors, SHA.test(adoption[field]), `$.${field}`, "lowercase SHA-256 required");
    }
    requireRelation(errors, adoption.partitionId !== adoption.lineageId, "$.lineageId", "lineage identity must differ from partition identity");
    const units = new Map<string, InventoryUnit>();
    adoption.inventory.forEach((unit, index) => {
      requireRelation(errors, !units.has(unit.unitId), `$.inventory[${index}].unitId`, "duplicate unit identity");
      units.set(unit.unitId, unit);
      inventoryRelations(unit, index, errors);
    });
    const proofs = new Set<string>();
    adoption.quiescenceProofs.forEach((proof, index) => {
      const path = `$.quiescenceProofs[${index}]`;
      requireRelation(errors, !proofs.has(proof.unitId), `${path}.unitId`, "duplicate proof unit identity");
      proofs.add(proof.unitId);
      unique(proof.attemptIds, errors, `${path}.attemptIds`);
      unique(proof.claimIds, errors, `${path}.claimIds`);
      const unit = units.get(proof.unitId);
      requireRelation(errors, unit !== undefined, `${path}.unitId`, "inventory unit join missing");
      if (unit) {
        requireRelation(errors, proof.snapshotId === unit.snapshotId, `${path}.snapshotId`, "unit snapshot join mismatch");
        if (unit.attemptIds !== undefined) requireRelation(errors, equalIds(proof.attemptIds, unit.attemptIds), `${path}.attemptIds`, "attempt inventory join mismatch");
        if (unit.claimIds !== undefined) requireRelation(errors, equalIds(proof.claimIds, unit.claimIds), `${path}.claimIds`, "claim inventory join mismatch");
      }
      // No test of flags as safety evidence, no callback, no revision authority.
    });
    if (prepared !== undefined) {
      const reference = decodePreparedGraphV3(prepared);
      if (!reference.ok) {
        preparedBinding = "invalid-prepared";
        errors.push("$prepared: prepared transport is not well formed");
      } else {
        const partition = reference.value.partition;
        const fields = ["partitionId", "lineageId", "snapshotId", "snapshotFingerprint", "configFingerprint"] as const;
        const matches = fields.every(field => adoption[field] === partition[field])
          && adoption.proposalFingerprint === hash(canonical({ ...partition, adopted: false }))
          && adoption.observedDigest === hash(canonical(partition));
        preparedBinding = matches ? "matched" : "mismatched";
        requireRelation(errors, matches, "$prepared", "partition identities, proposal fingerprint or observed digest mismatch");
      }
    }
  } catch {
    errors.push("$: documentary adoption relation inspection could not complete");
  }
  return { wellFormed: true, coherent: errors.length === 0, schemaErrors: [], coherenceErrors: errors,
    stats: adoptionStats(adoption), evidence: noEvidence("not-applicable-adoption"), preparedBinding, authority: "untrusted", adoptionReady: false };
}
