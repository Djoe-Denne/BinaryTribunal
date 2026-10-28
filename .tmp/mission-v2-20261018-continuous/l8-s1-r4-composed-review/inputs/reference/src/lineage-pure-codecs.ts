// Pure structural evidence/lineage inspection. These checks never confer authority.
import { isDeepStrictEqual } from "node:util";
import { canonical, hash } from "./validation";
import { configFingerprint, validConfig, provenanceReady } from "./semantic-config-codec";
import PARTITION_SCHEMA from "../schemas/cluster-partition-v1.schema.json";
import type { GraphSnapshotView } from "./semantic-index";
import type { ClusterPartitionView, CommunityView, UnknownableInteger, Diagnostic, LineageAssignment, ProposalEvidence, LineageCounters, PartitionComparison } from "./lineage";
export { PARTITION_SCHEMA };

export const SHA = /^[a-f0-9]{64}$/;


export const FUNCTION_ID = /^[a-f0-9]{64}:0x[1-9A-F][0-9A-F]*$/;


export function compareFunctionIds(a: string, b: string): number {
  const left = splitFunctionId(a);
  const right = splitFunctionId(b);
  if (!left || !right) return a < b ? -1 : a > b ? 1 : 0;
  if (left[0] !== right[0]) return left[0] < right[0] ? -1 : 1;
  const delta = BigInt(left[1]) - BigInt(right[1]);
  return delta < 0n ? -1 : delta > 0n ? 1 : 0;
}


export function sortFunctionIds(ids: readonly string[]): string[] {
  return [...ids].sort(compareFunctionIds);
}


export function communityContentId(
  algorithm: string,
  algorithmVersion: string,
  configFingerprint: string,
  memberIds: readonly string[],
): string {
  return hash(canonical({ algorithm, algorithmVersion, configFingerprint, memberIds: sortFunctionIds(memberIds) }));
}


/** This digest is only a content address; it never confers authority. */
export function proposalEvidenceFingerprint(evidence: Omit<ProposalEvidence, "evidenceFingerprint">): string {
  return hash(canonical({ version: evidence.version, source: evidence.source, result: evidence.result }));
}


/** Only a previous partition's lifecycle flag may differ from its full proposal.
 * Check both exact shapes before normalization; callers establish evidence authority.
 */
export function matchesPreviousProposal(partition: ClusterPartitionView, proposal: ClusterPartitionView): boolean {
  return strictSchemaErrors(partition, PARTITION_SCHEMA).length === 0 && partitionInvariants(partition)
    && strictSchemaErrors(proposal, PARTITION_SCHEMA).length === 0 && partitionInvariants(proposal)
    && isDeepStrictEqual({ ...partition, adopted: proposal.adopted }, proposal);
}


export function resolveLineage(
  previous: ClusterPartitionView | null,
  draft: { contentId: string; memberIds: string[] },
  candidates: OverlapCandidate[],
  meta: { algorithm: string; algorithmVersion: string; configFingerprint: string; hysteresis: number },
  splitParents: Set<string>,
  previousAncestry: Map<string, string[]>,
): { lineageId: string; parentContentIds: string[] } {
  const fresh = () => freshCommunityLineage(meta.algorithm, meta.algorithmVersion, meta.configFingerprint, draft.memberIds);
  if (!previous) {
    return { lineageId: fresh(), parentContentIds: [] };
  }
  const exact = candidates.find(item => item.common === draft.memberIds.length && item.common === item.community.memberIds.length)?.community;
  if (exact) return { lineageId: exact.lineageId, parentContentIds: [...(previousAncestry.get(exact.contentId) ?? exact.parentContentIds)] };
  const splitParent = candidates.find(item => item.common === draft.memberIds.length && item.community.memberIds.length > draft.memberIds.length && splitParents.has(item.community.contentId))?.community;
  if (splitParent) return { lineageId: fresh(), parentContentIds: [splitParent.contentId] };
  const covered = candidates.filter(item => item.common === item.community.memberIds.length && item.community.memberIds.length < draft.memberIds.length);
  if (covered.length >= 2 && covered.reduce((sum, item) => sum + item.common, 0) === draft.memberIds.length) {
    return { lineageId: fresh(), parentContentIds: covered.map(item => item.community.contentId).sort() };
  }
  let best: CommunityView | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    const item = candidate.community;
    const score = candidate.common / (item.memberIds.length + draft.memberIds.length - candidate.common);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  if (best && bestScore >= meta.hysteresis && bestScore < 1) return { lineageId: best.lineageId, parentContentIds: [] };
  return { lineageId: fresh(), parentContentIds: [] };
}


export function detectSplits(previous: ClusterPartitionView, next: ClusterPartitionView, counters?: LineageCounters): PartitionComparison["splits"] {
  const splits: PartitionComparison["splits"] = [];
  const overlaps = overlapCandidates(next, previous.communities, counters);
  for (const parent of [...previous.communities].sort((a, b) => a.contentId.localeCompare(b.contentId))) {
    const children = (overlaps.get(parent.contentId) ?? []).filter(item => item.common === item.community.memberIds.length && item.common < parent.memberIds.length).map(item => item.community);
    if (children.length < 2) continue;
    if (!sameIdSet(children.flatMap(item => item.memberIds), parent.memberIds)) continue;
    splits.push({ parentContentId: parent.contentId, childContentIds: children.map(item => item.contentId).sort() });
  }
  return splits;
}


export function membership(partition: ClusterPartitionView, counters?: LineageCounters): Map<string, CommunityView> {
  const map = new Map<string, CommunityView>();
  for (const community of partition.communities) for (const id of community.memberIds) { map.set(id, community); if (counters) counters.indexedMemberVisits += 1; }
  return map;
}


export function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length && new Set(left).size !== new Set(right).size) return false;
  const a = new Set(left);
  const b = new Set(right);
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}


function freshCommunityLineage(algorithm: string, algorithmVersion: string, configFingerprint: string, memberIds: readonly string[]): string {
  return prefixedId("lin:c:", { role: "community-lineage", algorithm, algorithmVersion, configFingerprint, memberIds: [...memberIds] });
}


export function prefixedId(prefix: string, payload: unknown): string {
  return `${prefix}${hash(canonical(payload))}`;
}


function splitFunctionId(id: string): [string, string] | null {
  const index = id.lastIndexOf(":0x");
  if (index < 0) return null;
  const rva = id.slice(index + 1);
  return /^0x[0-9a-f]+$/i.test(rva) ? [id.slice(0, index), rva] : null;
}


export interface OverlapCandidate { community: CommunityView; common: number }


export function overlapCandidates(previous: ClusterPartitionView, drafts: readonly { contentId: string; memberIds: string[] }[], counters?: LineageCounters): Map<string, OverlapCandidate[]> {
  const owner = membership(previous, counters);
  const result = new Map<string, OverlapCandidate[]>();
  for (const draft of drafts) {
    const counts = new Map<string, OverlapCandidate>();
    for (const id of draft.memberIds) {
      if (counters) counters.overlapMemberVisits += 1;
      const community = owner.get(id);
      if (!community) continue;
      const item = counts.get(community.contentId) ?? { community, common: 0 };
      item.common += 1;
      counts.set(community.contentId, item);
    }
    if (counters) counters.overlapPairs += counts.size;
    result.set(draft.contentId, [...counts.values()].sort((a, b) => a.community.contentId.localeCompare(b.community.contentId) || a.community.lineageId.localeCompare(b.community.lineageId)));
  }
  return result;
}


export function validIntegerMetric(metric: UnknownableInteger | undefined): metric is UnknownableInteger {
  return !!metric && (metric.known === false ? metric.value === null : metric.known === true && Number.isSafeInteger(metric.value) && !Object.is(metric.value, -0));
}


export function partitionProposalFingerprint(partition: ClusterPartitionView): string {
  return hash(canonical({ ...partition, adopted: false }));
}


export function partitionInvariants(partition: ClusterPartitionView): boolean {
  if (!SHA.test(partition.configFingerprint) || !SHA.test(partition.snapshotFingerprint) || !validIntegerMetric(partition.modularity)) return false;
  const owners = new Set<string>(), contentIds = new Set<string>();
  for (const community of partition.communities) {
    const members = new Set(community.memberIds), kernels = new Set(community.kernelIds), context = new Set(community.externalContextIds);
    if (members.size !== community.memberIds.length || members.size === 0 || kernels.size !== community.kernelIds.length || context.size !== community.externalContextIds.length || contentIds.has(community.contentId)
      || !validIntegerMetric(community.conductance) || community.parentContentIds.some(id => !SHA.test(id))
      || community.memberIds.some(id => !FUNCTION_ID.test(id) || owners.has(id)) || community.kernelIds.some(id => !members.has(id)) || community.externalContextIds.some(id => !FUNCTION_ID.test(id) || members.has(id))
      || community.contentId !== communityContentId(partition.algorithm, partition.algorithmVersion, partition.configFingerprint, sortFunctionIds(community.memberIds))) return false;
    contentIds.add(community.contentId); members.forEach(id => owners.add(id));
  }
  return true;
}


export function hasKeys(value: unknown, required: string[], optional: string[] = []): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
    && required.every(key => Object.hasOwn(value, key))
    && Reflect.ownKeys(value).every(key => typeof key === "string" && (required.includes(key) || optional.includes(key)));
}


function jsonData(value: unknown, parents = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || parents.has(value) || parents.size > 128) return false;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return false;
  parents.add(value);
  let valid = true;
  if (Array.isArray(value)) {
    valid = Object.keys(value).length === value.length;
    for (let i = 0; valid && i < value.length; i++) valid = Object.hasOwn(value, i) && jsonData(value[i], parents);
  } else {
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (typeof key !== "string" || !descriptor.enumerable || !("value" in descriptor) || !jsonData(descriptor.value, parents)) { valid = false; break; }
    }
  }
  parents.delete(value);
  return valid;
}


/** JSON evidence admits dense, finite plain data only (maximum nesting 128).
 * Non-serializable optional adapters may still fall back lexically, but cannot
 * acquire a receipt through JSON's lossy NaN/undefined/accessor coercions.
 */
export function isSerializableProposalData(value: unknown): boolean {
  try { return jsonData(value); } catch { return false; }
}


function provenanceShape(value: unknown): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && ["moduleSha256", "siteKind", "xrefType", "source", "sourceVersion", "sourceHash", "evidenceSha256"].every(key => typeof (value as Record<string, unknown>)[key] === "string")
    && ((value as Record<string, unknown>).siteRva === null || typeof (value as Record<string, unknown>).siteRva === "string");
}


function diagnosticsValid(value: unknown): value is Diagnostic[] {
  return Array.isArray(value) && value.every(item => hasKeys(item, ["code", "severity", "detail", "functionIds"])
    && typeof item.code === "string" && item.code.length > 0 && ["info", "warning", "fail"].includes(item.severity)
    && typeof item.detail === "string" && Array.isArray(item.functionIds) && item.functionIds.every((id: unknown) => typeof id === "string"));
}


function sidecarValid(sidecar: unknown, partition: ClusterPartitionView): sidecar is LineageAssignment["sidecar"] {
  if (!hasKeys(sidecar, ["version", "partitionId", "v1Compatible", "proposalPass", "projectionFingerprint", "communities"])
    || sidecar.version !== "l4-lineage-2" || sidecar.partitionId !== partition.partitionId
    || sidecar.projectionFingerprint !== partitionProposalFingerprint(partition)
    || typeof sidecar.v1Compatible !== "boolean" || typeof sidecar.proposalPass !== "boolean" || !Array.isArray(sidecar.communities)
    || sidecar.communities.length !== partition.communities.length) return false;
  const projected = new Map(partition.communities.map(item => [item.contentId, item]));
  const seen = new Set<string>();
  for (const item of sidecar.communities) {
    if (!hasKeys(item, ["contentId", "parentContentIds", "conductance"]) || !projected.has(item.contentId) || seen.has(item.contentId)
      || !Array.isArray(item.parentContentIds) || item.parentContentIds.some((id: unknown) => typeof id !== "string" || !SHA.test(id))
      || new Set(item.parentContentIds).size !== item.parentContentIds.length
      || !isDeepStrictEqual(projected.get(item.contentId)!.parentContentIds, item.parentContentIds.length > 2 ? [] : item.parentContentIds)) return false;
    const metric = item.conductance;
    if (!hasKeys(metric, ["known", "value"], ["numerator", "denominator"])
      || (metric.known === false ? metric.value !== null : metric.known !== true || typeof metric.value !== "number" || !Number.isFinite(metric.value) || metric.value < 0 || metric.value > 1)
      || ((metric.numerator === undefined) !== (metric.denominator === undefined))) return false;
    if (metric.numerator !== undefined && (typeof metric.numerator !== "number" || typeof metric.denominator !== "number"
      || metric.numerator < 0 || metric.denominator < 0 || !Number.isFinite(metric.numerator) || !Number.isFinite(metric.denominator)
      || (metric.known ? metric.denominator <= 0 || metric.value !== metric.numerator / metric.denominator : metric.denominator !== 0))) return false;
    const projection = projected.get(item.contentId)!.conductance;
    if (projection.known && (!metric.known || projection.value !== metric.value)) return false;
    seen.add(item.contentId);
  }
  return true;
}


function resultShape(value: unknown): value is ProposalEvidence["result"] {
  return hasKeys(value, ["partition", "lineageSidecar", "diagnostics", "constraints"])
    && strictSchemaErrors(value.partition, PARTITION_SCHEMA).length === 0 && partitionInvariants(value.partition)
    && sidecarValid(value.lineageSidecar, value.partition) && diagnosticsValid(value.diagnostics)
    && hasKeys(value.constraints, ["status", "applied", "rejected"]) && ["satisfied", "unsatisfiable", "none"].includes(value.constraints.status)
    && Number.isSafeInteger(value.constraints.applied) && value.constraints.applied >= 0
    && Number.isSafeInteger(value.constraints.rejected) && value.constraints.rejected >= 0;
}


function outcome(value: ProposalEvidence["result"]): boolean {
  return !value.diagnostics.some(item => item.severity === "fail") && value.constraints.status !== "unsatisfiable"
    && value.lineageSidecar.communities.every(item => item.parentContentIds.length <= 2);
}


/** Structural/content check only: callers MUST separately establish authority. */
export function inspectProposalEvidence(value: unknown): { wellFormed: boolean; admissible: boolean } {
  const refused = { wellFormed: false, admissible: false };
  try {
    if (!jsonData(value) || !hasKeys(value, ["version", "evidenceFingerprint", "source", "result"])
      || value.version !== "l4-proposal-evidence-1" || !SHA.test(value.evidenceFingerprint)
      || value.evidenceFingerprint !== proposalEvidenceFingerprint(value as ProposalEvidence)
      || !hasKeys(value.source, ["snapshot", "config", "constraints", "encoderIdentity", "encoderIdentityStatus", "previous"])
      || !resultShape(value.result)) return refused;
    const evidence = value as ProposalEvidence, { source, result } = evidence, { partition, lineageSidecar } = result;
    const graph = source.snapshot;
    if (!graph || graph.schemaVersion !== 1 || typeof graph.snapshotId !== "string" || !SHA.test(graph.normalizedFingerprint)
      || ![graph.nodes, graph.edges, graph.objects, graph.unresolved, graph.capabilities].every(Array.isArray)
      || !hasKeys(source.config, ["rulesetVersion", "synonyms", "bm25", "topK", "scoreTieDecimals", "similarityThreshold", "maxPostingDf", "maxCandidates", "hubMinDegree", "hysteresis", "views"])
      || !hasKeys(source.config.bm25, ["k1", "b"]) || !hasKeys(source.config.views, ["structure", "data", "lexical", "embeddings", "validatedRelations", "capabilities"])
      || !validConfig(source.config) || !Array.isArray(source.constraints)
      || !["absent", "captured", "unreadable"].includes(source.encoderIdentityStatus)
      || ((source.encoderIdentityStatus === "captured") !== (source.encoderIdentity !== null))) return refused;
    if (source.encoderIdentity && (!hasKeys(source.encoderIdentity, ["modelId", "tokenizerRevision", "parameterFingerprint", "dimension"], ["implementationSha256", "tokenizerSha256"])
      || typeof source.encoderIdentity.modelId !== "string" || typeof source.encoderIdentity.tokenizerRevision !== "string"
      || typeof source.encoderIdentity.parameterFingerprint !== "string" || typeof source.encoderIdentity.dimension !== "number"
      || (source.encoderIdentity.implementationSha256 !== undefined && typeof source.encoderIdentity.implementationSha256 !== "string")
      || (source.encoderIdentity.tokenizerSha256 !== undefined && typeof source.encoderIdentity.tokenizerSha256 !== "string"))) return refused;
    const nodes = new Map<string, GraphSnapshotView["nodes"][number]>();
    for (const node of graph.nodes) {
      if (!node || typeof node.id !== "string" || !FUNCTION_ID.test(node.id) || node.id !== `${node.moduleSha256}:${node.rva}` || nodes.has(node.id)
        || typeof node.name !== "string" || typeof node.observedDescription !== "string" || typeof node.functionClass !== "string"
        || !["none", "structural", "partial", "reconciled", "published-local"].includes(node.semanticMaturity)) return refused;
      nodes.set(node.id, node);
    }
    const members = partition.communities.flatMap(item => item.memberIds);
    if (!sameIdSet(members, [...nodes.keys()]) || partition.communities.some(item => item.externalContextIds.some(id => !nodes.has(id)))
      || partition.snapshotId !== graph.snapshotId || partition.snapshotFingerprint !== graph.normalizedFingerprint || partition.adopted !== false
      || partition.algorithm !== "multiview-components" || partition.algorithmVersion !== "2" || partition.regime !== "B" || partition.seed !== "none"
      || partition.configFingerprint !== configFingerprint(source.config, source.encoderIdentity)) return refused;
    for (const edge of graph.edges) {
      if (!edge || ![edge.id, edge.sourceId, edge.destinationId, edge.kind, edge.status, edge.schedulerRelevance].every(item => typeof item === "string")
        || (edge.confidence !== undefined && typeof edge.confidence !== "string")
        || (edge.appearedInRevision !== undefined && (!Number.isSafeInteger(edge.appearedInRevision) || edge.appearedInRevision < 0))
        || (edge.retiredInRevision !== undefined && edge.retiredInRevision !== null && (!Number.isSafeInteger(edge.retiredInRevision) || edge.retiredInRevision < 0))
        || (edge.sites !== undefined && (!Array.isArray(edge.sites) || edge.sites.some(site => !site || typeof site.siteRva !== "string" || typeof site.xrefType !== "string" || !provenanceShape(site.provenance))))) return refused;
    }
    for (const object of graph.objects) if (!object || ![object.id, object.kind, object.name].every(item => typeof item === "string")) return refused;
    for (const ref of graph.unresolved) if (!ref || typeof ref.fromFunctionId !== "string" || typeof ref.kind !== "string" || (ref.referencedObjectId !== null && typeof ref.referencedObjectId !== "string")) return refused;
    for (const fact of graph.capabilities) if (!fact || ![fact.id, fact.subjectKind, fact.subjectId, fact.capability, fact.confidence].every(item => typeof item === "string") || (fact.hypotheticalRole !== null && typeof fact.hypotheticalRole !== "string")) return refused;
    const owners = new Map(partition.communities.flatMap(item => item.memberIds.map(id => [id, item.contentId] as const)));
    let applied = 0, rejected = 0, unsatisfiable = false;
    for (const link of source.constraints) {
      if (!link || !["must-link", "cannot-link"].includes(link.kind) || typeof link.leftId !== "string" || typeof link.rightId !== "string"
        || !["validated", "unvalidated", "fixture-only"].includes(link.validation) || !provenanceShape(link.provenance)) return refused;
      if (!nodes.has(link.leftId) || !nodes.has(link.rightId) || link.leftId === link.rightId) { rejected++; unsatisfiable = true; continue; }
      const p = link.provenance;
      if (link.validation !== "validated" || !provenanceReady(p)
        || ![nodes.get(link.leftId)!.moduleSha256, nodes.get(link.rightId)!.moduleSha256].includes(p.moduleSha256)) { rejected++; continue; }
      applied++;
      const same = owners.get(link.leftId) === owners.get(link.rightId);
      if (same !== (link.kind === "must-link")) unsatisfiable = true;
    }
    if (!isDeepStrictEqual(result.constraints, { applied, rejected, status: unsatisfiable ? "unsatisfiable" : applied ? "satisfied" : "none" })) return refused;
    let previous: ClusterPartitionView | null = null, previousSidecar: LineageAssignment["sidecar"] | null = null;
    if (source.previous !== null) {
      const old = source.previous;
      if (!hasKeys(old, ["partition", "sidecar", "authoritative", "binding"])
        || strictSchemaErrors(old.partition, PARTITION_SCHEMA).length || !partitionInvariants(old.partition)
        || !hasKeys(old.binding, ["version", "evidenceFingerprint", "receiptRef", "status"]) || old.binding.version !== "l4-previous-binding-1"
        || !["verified-pass", "verified-fail", "unverified"].includes(old.binding.status)
        || (old.binding.evidenceFingerprint !== null && !SHA.test(old.binding.evidenceFingerprint))
        || (old.binding.receiptRef !== null && (typeof old.binding.receiptRef !== "string" || !old.binding.receiptRef.trim()))
        || (old.authoritative !== null && !resultShape(old.authoritative))) return refused;
      if (old.binding.status !== "unverified" && (!old.authoritative || !old.binding.evidenceFingerprint
        || !matchesPreviousProposal(old.partition, old.authoritative.partition) || !isDeepStrictEqual(old.sidecar, old.authoritative.lineageSidecar)
        || (old.binding.status === "verified-pass") !== outcome(old.authoritative))) return refused;
      if (old.binding.status !== "verified-pass" && !result.diagnostics.some(item => item.severity === "fail" && ["lineage-previous-unverified", "lineage-previous-incompatible"].includes(item.code))) return refused;
      if (old.authoritative && old.authoritative.diagnostics.some(item => item.severity === "fail" && !result.diagnostics.some(next => isDeepStrictEqual(next, item)))) return refused;
      previous = old.partition;
      previousSidecar = old.authoritative && matchesPreviousProposal(old.partition, old.authoritative.partition) ? old.authoritative.lineageSidecar : old.sidecar;
    }
    // Recheck ancestry against the complete immediate previous, including replay.
    const compatible = previous && previous.configFingerprint === partition.configFingerprint && previous.algorithm === partition.algorithm && previous.algorithmVersion === partition.algorithmVersion ? previous : null;
    const candidates = compatible ? overlapCandidates(compatible, partition.communities) : new Map<string, OverlapCandidate[]>();
    const splitParents = new Set(compatible ? detectSplits(compatible, partition).map(item => item.parentContentId) : []);
    const ancestry = new Map(previousSidecar?.communities.map(item => [item.contentId, item.parentContentIds]) ?? []);
    const full = new Map(lineageSidecar.communities.map(item => [item.contentId, item]));
    for (const community of partition.communities) {
      const expected = resolveLineage(compatible, community, candidates.get(community.contentId) ?? [], { algorithm: partition.algorithm,
        algorithmVersion: partition.algorithmVersion, configFingerprint: partition.configFingerprint, hysteresis: source.config.hysteresis }, splitParents, ancestry);
      if (community.lineageId !== expected.lineageId || !isDeepStrictEqual(full.get(community.contentId)!.parentContentIds, expected.parentContentIds)) return refused;
    }
    const contentIds = partition.communities.map(item => item.contentId).sort();
    const sameGeneration = !!compatible && sameIdSet(compatible.communities.map(item => item.contentId), contentIds);
    const expectedLineage = sameGeneration ? previous!.lineageId : prefixedId("lin:p:", { role: "partition-lineage", configFingerprint: partition.configFingerprint, snapshotId: graph.snapshotId, contentIds });
    if (partition.lineageId !== expectedLineage || partition.parentLineageId !== (previous === null ? null : sameGeneration ? previous.parentLineageId : previous.lineageId)
      || partition.partitionId !== prefixedId("part:", { role: "partition", configFingerprint: partition.configFingerprint, snapshotId: graph.snapshotId, contentIds })) return refused;
    const admissible = outcome(result);
    if (lineageSidecar.proposalPass !== admissible || (admissible && !lineageSidecar.v1Compatible)
      || (lineageSidecar.communities.some(item => item.parentContentIds.length > 2) && lineageSidecar.v1Compatible)) return refused;
    return { wellFormed: true, admissible };
  } catch { return refused; }
}


/** Frozen L1 strict subset, evaluated from the actual schema rather than a TS assertion. */
export function strictSchemaErrors(value: unknown, schema: Record<string, any>, path = "$", parents = new Set<object>()): string[] {
  const errors: string[] = [];
  const allowed = new Set(["$schema", "$id", "title", "description", "type", "additionalProperties", "required", "properties", "enum", "minimum", "maximum", "minLength", "maxLength", "items", "minItems", "maxItems"]);
  for (const key of Object.keys(schema)) if (!allowed.has(key)) errors.push(`${path}: unsupported schema keyword ${key}`);
  const types: string[] = Array.isArray(schema.type) ? schema.type : [schema.type];
  const valid = types.some(type => type === "null" ? value === null
    : type === "integer" ? typeof value === "number" && Number.isSafeInteger(value)
    : type === "number" ? typeof value === "number" && Number.isFinite(value)
    : type === "array" ? Array.isArray(value)
    : type === "object" ? !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
    : type === "string" ? typeof value === "string"
    : type === "boolean" ? typeof value === "boolean" : false);
  if (!valid) return [...errors, `${path}: expected ${types.join("|")}`];
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: value outside enum`);
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: above maximum`);
  }
  if (typeof value === "string") {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) errors.push(`${path}: below minLength`);
    if (schema.maxLength !== undefined && length > schema.maxLength) errors.push(`${path}: above maxLength`);
  }
  if (value && typeof value === "object") {
    if (parents.has(value)) return [...errors, `${path}: cyclic non-JSON value`];
    const nested = new Set(parents); nested.add(value);
    if (Array.isArray(value)) {
      if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: below minItems`);
      if (schema.maxItems !== undefined && value.length > schema.maxItems) return [...errors, `${path}: above maxItems`];
      for (let i = 0; i < value.length; i++) {
        errors.push(...strictSchemaErrors(value[i], schema.items, `${path}[${i}]`, nested));
        if (errors.length >= 32) break;
      }
    } else {
      const object = value as Record<string, unknown>;
      for (const key of schema.required ?? []) if (!Object.hasOwn(object, key)) errors.push(`${path}.${key}: required`);
      for (const key of Reflect.ownKeys(object)) {
        if (typeof key !== "string" || !Object.hasOwn(schema.properties ?? {}, key)) {
          if (schema.additionalProperties === false) errors.push(`${path}.${String(key)}: additional property`);
        } else errors.push(...strictSchemaErrors(object[key], schema.properties[key], `${path}.${key}`, nested));
        if (errors.length >= 32) break;
      }
    }
  }
  return errors;
}

