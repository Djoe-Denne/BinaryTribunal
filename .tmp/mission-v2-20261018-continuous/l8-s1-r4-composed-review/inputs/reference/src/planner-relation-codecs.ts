// Pure planner relation normalization; body moved unchanged from planner.ts.
import { assert, nonempty, integer, RELATION_VIEW_VERSION } from "./graph-pure-codecs";
import { canonical, compareText, fingerprint } from "./validation";
import type { PlannerEdge, PlannerGraphInput, PlannerPolicy, PlannerRelation, PlannerSite, Prerequisite, Dispensation, ArtifactReceipt } from "./planner";

/** Additive identity for new plans only. Function/family identities stay unchanged. */
export function canonicalRelationKey(edge: Pick<PlannerEdge, "sourceId" | "destinationId" | "kind">): string {
  return `relation:v1:${fingerprint({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind })}`;
}
export function isPlannerCall(e: PlannerEdge): boolean {
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
// New-plan identity only: own ByEdge declarations and external producer binding.

/** Transport pages are not knowledge obligations. Reject ambiguity before any SCC/closure. */
export function canonicalRelationView(graph: PlannerGraphInput, policy: PlannerPolicy) {
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
