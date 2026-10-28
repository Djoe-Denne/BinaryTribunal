// Shared source-derived planner projections for a supplied unit partition.
// No family/SCC/budget selection or readiness evaluation belongs here.
import { assert, nonempty, integer, canonicalOwnershipKey, unitIdentity } from "./graph-pure-codecs";
import { compareText, fingerprint, normalizeEA, validateSHA } from "./validation";
import { isPlannerCall } from "./planner-relation-codecs";
import { compareFunctionIds } from "./function-order";
import type { ArtifactRequirement, ArtifactReceipt, Dispensation, PlannerPolicy, WorkUnit, PlannerNode, PlannerGroupInput, PlannerGraphInput, PlannerEdge, Prerequisite, ConflictRef, PlannerSidecar, Diagnostic, SubIntent, G1Edge } from "./planner";

export function unitContentFingerprint(unit: WorkUnit): string { const { state: _state, ...content } = unit; return fingerprint(content); }

export function validRequirement(r: ArtifactRequirement | undefined): r is ArtifactRequirement {
  if (!r) return false;
  try { validateSHA(r.artifactSha256); validateSHA(r.moduleSha256); canonicalOwnershipKey(r.functionId); } catch { return false; }
  return nonempty(r.artifactId) && r.functionId.startsWith(`${r.moduleSha256}:`) && integer(r.minimumRevision)
    && integer(r.maximumRevision) && r.maximumRevision >= r.minimumRevision && [1, 2].includes(r.publicationLevel)
    && ["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"].includes(r.artifactKind)
    && ["fixture-only", "parent-validated"].includes(r.validation) && (r.publicationLevel !== 2 || r.validation === "parent-validated");
}

export function validDispensation(d: Dispensation | undefined, policy: Pick<PlannerPolicy, "version" | "publicationLevel">, revision: number): d is Dispensation {
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

export function invalidatesReceipt(requirement: ArtifactRequirement, receipt: ArtifactReceipt, invalidation: ArtifactReceipt): boolean {
  try { validateSHA(invalidation.commitId); } catch { return false; }
  return invalidation.futurePrerequisiteEffect === "invalidates_future" && invalidation.readbackStatus === "verified"
    && invalidation.functionId === requirement.functionId && invalidation.moduleSha256 === requirement.moduleSha256
    && invalidation.artifactId === requirement.artifactId && invalidation.artifactKind === requirement.artifactKind
    && invalidation.publicationLevel >= requirement.publicationLevel && integer(invalidation.knowledgeRevision)
    && invalidation.knowledgeRevision >= receipt.knowledgeRevision
    && (invalidation.validation === "parent-validated" || requirement.validation === "fixture-only");
}

export type Nodes = ReadonlyMap<string, PlannerNode>;
export type Owners = ReadonlyMap<string, string>;
export type UnitRef = Pick<WorkUnit, "unitId" | "ownedFunctionIds">;
export type Unresolved = PlannerGraphInput["unresolved"][number];
export type Outgoing = ReadonlyMap<string, readonly PlannerEdge[]>;
export type DependencyPolicy = Pick<PlannerPolicy, "version" | "publicationLevel" | "artifactKind" | "requirementsByFunction">;
export interface ReconciledRelations {
  liveEdges: readonly PlannerEdge[];
  kinds: ReadonlyMap<string, Prerequisite["kind"]>;
  dispensations: ReadonlyMap<string, Dispensation>;
  receipts: ReadonlyMap<string, ArtifactReceipt>;
}
export interface PartitionContext {
  contextFunctionIdsByUnit: ReadonlyMap<string, readonly string[]>;
  unresolvedByUnit: ReadonlyMap<string, readonly Unresolved[]>;
}
export interface UnitDependencyInput {
  unit: UnitRef;
  nodes: Nodes;
  owner: Owners;
  outgoing: Outgoing;
  unresolved: readonly Unresolved[];
  relations: Pick<ReconciledRelations, "kinds" | "dispensations" | "receipts">;
  policy: DependencyPolicy;
  knowledgeRevision: number;
}
export interface UnitDependencies {
  prerequisites: Prerequisite[];
  requirementById: PlannerSidecar["requirementById"];
  dispensationById: PlannerSidecar["dispensationById"];
  externalReceiptById: PlannerSidecar["externalReceiptById"];
  diagnostics: Diagnostic[];
}

export function isEligiblePlannerFunction(nodes: Nodes, id: string): boolean {
  const n = nodes.get(id); return !!n && n.status === "observed" && !["import", "external", "incomplete"].includes(n.functionClass);
}

/** Source-group membership only; no mandatory closure or family choice. */
export function plannerGroupOwnership(groups: readonly PlannerGroupInput[], nodes: Nodes, partitionId: string): {
  eligibleOwnedFunctionIds: string[]; diagnostics: Diagnostic[];
} {
  const groupOwned = new Set<string>(), eligibleOwnedFunctionIds: string[] = [], diagnostics: Diagnostic[] = [];
  for (const g of groups) {
    assert(g.partitionId === partitionId, "group from different partition");
    for (const id of g.ownedFunctionIds) {
      assert(nodes.has(id) && !groupOwned.has(id), "unknown/duplicate group ownership"); groupOwned.add(id);
      if (isEligiblePlannerFunction(nodes, id)) eligibleOwnedFunctionIds.push(id);
      else diagnostics.push({ code: "inadmissible-owned-function", unitId: null, functionIds: [id], detail: "Quarantined/incomplete/external function cannot be investigated" });
    }
    for (const id of g.contextFunctionIds) assert(nodes.has(id) && !g.ownedFunctionIds.includes(id), "invalid shared context");
  }
  return { eligibleOwnedFunctionIds, diagnostics };
}

/** Caller checks supplied unit IDs and duplicate/unknown ownership before indexing. */
export function indexPlannerOwnership(members: readonly string[][], kind: WorkUnit["investigationKind"]): Map<string, string> {
  const owner = new Map<string, string>();
  for (const fs of members) for (const id of fs) owner.set(id, unitIdentity(fs, kind));
  return owner;
}

export function indexPlannerOutgoing(liveEdges: readonly PlannerEdge[]): Outgoing {
  const outgoing = new Map<string, PlannerEdge[]>();
  for (const e of liveEdges) { const list = outgoing.get(e.sourceId) ?? []; list.push(e); outgoing.set(e.sourceId, list); }
  return outgoing;
}

/** Planner context union for an already fixed owner map, not group production. */
export function derivePlannerPartitionContext(groups: readonly PlannerGroupInput[], owner: Owners, unresolved: readonly Unresolved[]): PartitionContext {
  const contextsByUnit = new Map<string, Set<string>>();
  const unresolvedByUnit = new Map<string, Unresolved[]>();
  for (const g of groups) for (const uid of new Set(g.ownedFunctionIds.map(id => owner.get(id)).filter((id): id is string => !!id))) {
    const set = contextsByUnit.get(uid) ?? new Set<string>();
    for (const id of g.contextFunctionIds) set.add(id);
    contextsByUnit.set(uid, set);
  }
  for (const ref of unresolved) {
    const uid = owner.get(ref.fromFunctionId); if (!uid) continue;
    const list = unresolvedByUnit.get(uid) ?? []; list.push(ref); unresolvedByUnit.set(uid, list);
  }
  for (const [id, unitId] of owner) contextsByUnit.get(unitId)?.delete(id);
  const contextFunctionIdsByUnit = new Map<string, readonly string[]>();
  for (const [unitId, context] of contextsByUnit) contextFunctionIdsByUnit.set(unitId, [...context].sort(compareFunctionIds));
  return { contextFunctionIdsByUnit, unresolvedByUnit };
}

export function subIntentPrefix(unitId: string, functionId: string): string {
  return `sub:${fingerprint({ unitId, functionId })}`;
}

export function subIntentHarnessIdentity(n: PlannerNode, artifact: PlannerGraphInput["binaryArtifacts"][number] | undefined): SubIntent["harnessIdentity"] {
  assert(artifact && BigInt(artifact.imageBase) === BigInt(n.imageBase), "missing/mismatched binary artifact projection");
  return { sha256: n.moduleSha256, version: artifact.versionLabel, ea: normalizeEA(n.ea) };
}

/** Complete source-derived obligations for one supplied unit; no producer replay. */
export function derivePlannerUnitDependencies(input: UnitDependencyInput): UnitDependencies {
  const { unit: { unitId, ownedFunctionIds }, nodes, owner, outgoing, unresolved, relations, policy, knowledgeRevision } = input;
  const isCall = isPlannerCall;
  const edgeKind = (e: PlannerEdge): Prerequisite["kind"] => relations.kinds.get(e.id)!;
  const eligible = (id: string): boolean => isEligiblePlannerFunction(nodes, id);
  const requirementById: PlannerSidecar["requirementById"] = {}, dispensationById: PlannerSidecar["dispensationById"] = {}, externalReceiptById: PlannerSidecar["externalReceiptById"] = {};
  const diagnostics: Diagnostic[] = [];
  const prerequisites: Prerequisite[] = [];
  for (const from of ownedFunctionIds) for (const e of outgoing.get(from) ?? []) {
    if (!isCall(e)) continue;
    let kind = edgeKind(e);
    // External evidence is not produced by a selected local family. Retain its
    // receipt requirement even inside that family, including invalidation checks.
    const producerUnitId = kind === "external_satisfied" ? null : owner.get(e.destinationId) ?? null;
    if (producerUnitId === unitId) continue;
    const id = `pre:${fingerprint({ relationVersion: 1, relationId: e.id, consumerUnitId: unitId })}`;
    const requested = policy.requirementsByFunction[e.destinationId];
    const requirement = validRequirement(requested) && requested.functionId === e.destinationId && requested.moduleSha256 === nodes.get(e.destinationId)!.moduleSha256 ? requested : undefined;
    if (requirement) requirementById[id] = requirement;
    const d = relations.dispensations.get(e.id), dispensed = validDispensation(d, policy, knowledgeRevision);
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
  for (const ref of unresolved) if (ref.kind !== "data_xref") prerequisites.push({ id: `pre:${fingerprint({ ref: ref.id, unitId })}`, kind: "unknown_unresolved", producerUnitId: null,
    requiredPublicationLevel: policy.publicationLevel, artifactKind: policy.artifactKind, dispensed: false, dispensationReason: null });
  prerequisites.sort((a, b) => compareText(a.id, b.id));
  return { prerequisites, requirementById, dispensationById, externalReceiptById, diagnostics };
}

export function derivePlannerUnitConflicts(unit: UnitRef, prerequisites: readonly Prerequisite[], extraConflictsByFunction: PlannerPolicy["extraConflictsByFunction"]): ConflictRef[] {
  const { unitId, ownedFunctionIds } = unit;
  const conflicts: ConflictRef[] = ownedFunctionIds.map(functionId => ({ id: `conflict:${fingerprint({ unitId, functionId })}`, kind: "owned_function", resourceKey: canonicalOwnershipKey(functionId), withUnitId: null }));
  for (const p of prerequisites) if (p.kind === "obligatory" && !p.dispensed && p.producerUnitId) conflicts.push({
    id: `conflict:${p.id}`, kind: "blocking_dependency", resourceKey: `dependency:${p.id}`, withUnitId: p.producerUnitId });
  const extra = new Map<string, ConflictRef>();
  for (const functionId of ownedFunctionIds) for (const c of extraConflictsByFunction?.[functionId] ?? []) {
    assert(nonempty(c.id) && nonempty(c.resourceKey), "unidentified exclusive resource");
    assert(["owned_function", "blocking_dependency", "non_isolated_file", "exclusive_write", "native_lease", "adapter_constraint"].includes(c.kind), "invalid conflict kind");
    const id = `conflict:${fingerprint({ unitId, sourceId: c.id, kind: c.kind, resourceKey: c.resourceKey, withUnitId: c.withUnitId })}`;
    extra.set(id, { ...c, id });
  }
  conflicts.push(...extra.values());
  conflicts.sort((a, b) => compareText(a.id, b.id));
  return conflicts;
}

export function derivePlannerG1(liveEdges: readonly PlannerEdge[], kinds: ReadonlyMap<string, Prerequisite["kind"]>, owner: Owners): G1Edge[] {
  const isCall = isPlannerCall;
  const edgeKind = (e: PlannerEdge): Prerequisite["kind"] => kinds.get(e.id)!;
  return liveEdges.filter(e => isCall(e) && owner.has(e.sourceId) && owner.has(e.destinationId) && owner.get(e.sourceId) !== owner.get(e.destinationId))
    .map(e => ({ fromUnitId: owner.get(e.destinationId)!, toUnitId: owner.get(e.sourceId)!,
      kind: edgeKind(e) === "obligatory" ? "obligatory" as const : edgeKind(e) === "optional" ? "optional" as const : "non_blocking" as const,
      callSourceFunctionId: e.sourceId, callDestinationFunctionId: e.destinationId, storedCallDirection: "source_to_destination" }));
}
