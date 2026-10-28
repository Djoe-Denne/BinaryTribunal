/** Pure, explicit projections. This module never imports a clustering/planning producer. */
import groupSchema from "../schemas/investigation-group-v1.schema.json";
import { types as utilTypes } from "node:util";
import { assertSnapshotContract, validateStaticJsonSchema, type GraphSnapshotV1, type FunctionNodeV1,
  type FunctionEdgeV1, type ReferencedObjectV1, type UnresolvedReferenceV1, type CapabilityFactV1, type StaticJsonSchema } from "./graph";
import { decodePreparedGraphV3, inspectPreparedGraphV3, type PreparedGraphTransportV3 } from "./graph-transport";
import { communityContentId, partitionProposalFingerprint, sortFunctionIds } from "./lineage-pure-codecs";
import { validatePlannerPolicy } from "./graph-pure-codecs";
import { canonical, fingerprint } from "./validation";
import type { GraphSnapshotView } from "./semantic-index";
import type { ClusterPartitionView } from "./lineage";
import type { PlannerGraphInput, PlannerGroupInput, PlannerPolicy, AdmissionBudgetContextV1 } from "./planner";
import type { GroupConfig, GroupMetrics } from "./investigation-groups";
import type { CodecResult, ReadonlyData } from "./graph-execution-envelope";

export interface CommunityBindingV1 {
  version: "l8-community-binding-v1";
  groups: Array<{ groupId: string; communityContentId: string; kernelIds: string[]; parentContentIds: string[];
    capabilityIds: string[]; memberMaturity: Array<{ functionId: string; semanticMaturity: FunctionNodeV1["semanticMaturity"] }> }>;
}
export interface FullContextByGroupV1 {
  version: "l8-full-context-by-group-v1";
  groups: Array<{ groupId: string; functionIds: string[]; nodes: FunctionNodeV1[]; edges: FunctionEdgeV1[];
    objects: ReferencedObjectV1[]; unresolved: UnresolvedReferenceV1[]; capabilities: CapabilityFactV1[] }>;
}
export interface ContextOmissionsV1 {
  version: "l8-context-omissions-v1";
  byGroup: Array<{ groupId: string; functionIds: string[] }>;
  byCommunity: Array<{ communityContentId: string; functionIds: string[] }>;
}
export interface DecodedGroupSourceV1 {
  groupingConfig: GroupConfig; groupingMetrics: GroupMetrics;
  communityBinding: CommunityBindingV1; fullContextByGroup: FullContextByGroupV1; contextOmissions: ContextOmissionsV1;
}
export interface ExecutionProjectionV1 {
  graph: PlannerGraphInput; groups: PlannerGroupInput[]; partitionId: string; regime: "A" | "B";
  snapshotView: GraphSnapshotView; proposalAdmissible: boolean | null;
  /** The complete originals remain in the envelope; these are named L5 inputs, not A partitions. */
  sourceBindings: { snapshotFingerprint: string; partitionStoreDigest: string; proposalFingerprint: string;
    groupMetricsFingerprint: string; fullContextFingerprint: string };
}
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`l8-projection: ${message}`); }
function run<T>(work: () => T): CodecResult<T> { try { return { ok: true, value: work() }; } catch (e) { return { ok: false, reasons: [e instanceof Error ? e.message : "l8-projection: unreadable input"] }; } }
function plain(v: unknown, parents = new Set<object>()): void {
  if (v === null || typeof v === "boolean") return;
  if (typeof v === "string") { unicode(v); return; }
  if (typeof v === "number") { check(Number.isFinite(v) && !Object.is(v, -0), "non-finite or negative-zero input"); return; }
  check(typeof v === "object" && !utilTypes.isProxy(v) && !parents.has(v), "plain non-proxy JSON required");
  const array = Array.isArray(v); check(Object.getPrototypeOf(v) === (array ? Array.prototype : Object.prototype), "plain prototype required");
  const ds = Object.getOwnPropertyDescriptors(v), ks = Reflect.ownKeys(ds); if (array) check(ks.length === v.length + 1, "sparse/extended array");
  parents.add(v);
  for (const k of ks) { if (array && k === "length") continue; const d = typeof k === "string" ? ds[k] : undefined;
    check(typeof k === "string" && d?.enumerable && "value" in d, "accessor/symbol/hidden property");
    unicode(k);
    if (array) check(/^(0|[1-9][0-9]*)$/.test(k) && Number(k) < v.length, "extra array property"); plain(d.value, parents); }
  parents.delete(v);
}
function unicode(s: string): void {
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) { const d = s.charCodeAt(++i); check(d >= 0xdc00 && d <= 0xdfff, "isolated surrogate"); }
    else check(!(c >= 0xdc00 && c <= 0xdfff), "isolated surrogate");
  }
}
function record(v: unknown, required: string[]): Record<string, unknown> {
  check(v !== null && typeof v === "object" && !Array.isArray(v), "record required");
  const r = v as Record<string, unknown>; check(required.length === Object.keys(r).length && required.every(k => Object.hasOwn(r, k)), `closed record: ${required.join(",")}`); return r;
}
function strings(v: unknown): asserts v is string[] { check(Array.isArray(v) && v.every(x => typeof x === "string" && x.length > 0), "string list required"); check(new Set(v).size === v.length, "duplicate IDs"); }
function integer(v: unknown, min = 0): asserts v is number { check(typeof v === "number" && Number.isSafeInteger(v) && v >= min && !Object.is(v, -0), "safe nonnegative integer required"); }
function digest(v: unknown): asserts v is string { check(typeof v === "string" && /^[a-f0-9]{64}$/.test(v), "SHA required"); }
function equal(a: unknown, b: unknown, message: string): void { check(canonical(a) === canonical(b), message); }
function sameSet(a: readonly string[], b: readonly string[], message: string): void { strings(a); strings(b); check(a.length === b.length && a.every(x => b.includes(x)), message); }
function freeze<T>(v: T): T { if (v && typeof v === "object") { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v; }
function at<T>(map: Record<string, T>, key: string): T { check(Object.hasOwn(map, key), `missing dictionary key ${key}`); return map[key]!; }
function dictionary(v: unknown, validate: (x: unknown) => void): void { check(v !== null && typeof v === "object" && !Array.isArray(v), "dictionary required"); for (const x of Object.values(v)) validate(x); }

/** Exact named L4 view, with every optional edge citation/observation field explicitly populated. */
export function projectGraphSnapshotViewV1(fullSnapshot: unknown): CodecResult<ReadonlyData<GraphSnapshotView>> {
  return run(() => {
    plain(fullSnapshot); const s = assertSnapshotContract(structuredClone(fullSnapshot));
    return freeze({ schemaVersion: 1 as const, snapshotId: s.snapshotId, normalizedFingerprint: s.normalizedFingerprint,
      nodes: s.nodes.map(n => ({ id: n.id, moduleSha256: n.moduleSha256, rva: n.rva, name: n.name, observedDescription: n.observedDescription, semanticMaturity: n.semanticMaturity, functionClass: n.functionClass })),
      edges: s.edges.map(e => ({ id: e.id, sourceId: e.sourceId, destinationId: e.destinationId, kind: e.kind, status: e.status,
        schedulerRelevance: e.schedulerRelevance, sites: structuredClone(e.sites), confidence: e.confidence, appearedInRevision: e.appearedInRevision, retiredInRevision: e.retiredInRevision })),
      objects: s.objects.map(o => ({ id: o.id, kind: o.kind, name: o.name })),
      unresolved: s.unresolved.map(r => ({ fromFunctionId: r.fromFunctionId, kind: r.kind, referencedObjectId: r.referencedObjectId })),
      capabilities: s.capabilities.map(c => ({ id: c.id, subjectKind: c.subjectKind, subjectId: c.subjectId, capability: c.capability, confidence: c.confidence, hypotheticalRole: c.hypotheticalRole })) });
  });
}

function groupingSource(value: unknown): DecodedGroupSourceV1 {
  const all = record(value, ["groupingConfig", "groupingMetrics", "communityBinding", "fullContextByGroup", "contextOmissions"]);
  const c = record(all.groupingConfig, ["version", "minSize", "maxSize", "maxContextFunctions", "smallPolicy", "costSource", "costPerUnit", "fixedCost"]);
  check(typeof c.version === "string" && c.version.length > 0, "group config version");
  for (const k of ["minSize", "maxSize"]) integer(c[k], 1); for (const k of ["maxContextFunctions", "fixedCost"]) integer(c[k]);
  check((c.minSize as number) <= (c.maxSize as number) && (c.maxSize as number) <= 100000 && (c.maxContextFunctions as number) <= 100000, "group config bounds");
  check(["preserve-community", "attach-adjacent"].includes(String(c.smallPolicy)) && ["instructions", "bytes"].includes(String(c.costSource)), "group config policy");
  check(typeof c.costPerUnit === "number" && Number.isFinite(c.costPerUnit) && c.costPerUnit >= 0, "group cost coefficient");
  const m = record(all.groupingMetrics, ["version", "configFingerprint", "partitionId", "snapshotFingerprint", "ownerByFunctionId", "uncoveredOwnerByFunctionId", "uncoveredCommunityByFunctionId", "sourceCommunitiesByGroupId", "kernelIdsByGroupId", "contextIdListUtf8BytesByGroupId", "omittedContextIdsByGroupId", "omittedCommunityContextIds", "allCapabilityIdsByGroupId", "smallGroupIds", "isolatedIds", "hubIds", "nonCoveredIds", "coverageStatus", "contextBinding", "contentFingerprintByGroupId", "diagnostics"]);
  check(m.version === "group-metrics-v1" && typeof m.partitionId === "string", "group metrics identity"); digest(m.configFingerprint); digest(m.snapshotFingerprint);
  for (const k of ["ownerByFunctionId", "uncoveredOwnerByFunctionId", "uncoveredCommunityByFunctionId"]) dictionary(m[k], x => check(typeof x === "string" && x.length > 0, "owner ID"));
  for (const k of ["sourceCommunitiesByGroupId", "kernelIdsByGroupId", "omittedContextIdsByGroupId", "omittedCommunityContextIds", "allCapabilityIdsByGroupId"]) dictionary(m[k], strings);
  dictionary(m.contextIdListUtf8BytesByGroupId, integer); dictionary(m.contentFingerprintByGroupId, digest);
  for (const k of ["smallGroupIds", "isolatedIds", "hubIds", "nonCoveredIds"]) strings(m[k]);
  check(Array.isArray(m.diagnostics) && m.diagnostics.every(x => typeof x === "string"), "metrics diagnostics");
  check(["complete", "partial", "diagnostic"].includes(String(m.coverageStatus)), "coverage status");
  const cb = record(m.contextBinding, ["version", "projectionSource", "projectionFingerprint", "hubSetFingerprint", "bindingFingerprint"]);
  check(cb.version === "group-context-binding-v1" && ["provided-affinity", "raw-active-control-relations"].includes(String(cb.projectionSource)), "context binding version/source");
  digest(cb.projectionFingerprint); digest(cb.hubSetFingerprint); digest(cb.bindingFingerprint);
  const b = record(all.communityBinding, ["version", "groups"]); check(b.version === "l8-community-binding-v1" && Array.isArray(b.groups), "community binding");
  for (const v of b.groups) {
    const g = record(v, ["groupId", "communityContentId", "kernelIds", "parentContentIds", "capabilityIds", "memberMaturity"]);
    check(typeof g.groupId === "string", "group ID"); digest(g.communityContentId); for (const k of ["kernelIds", "parentContentIds", "capabilityIds"]) strings(g[k]);
    check(Array.isArray(g.memberMaturity), "member maturities"); for (const n of g.memberMaturity) { const r = record(n, ["functionId", "semanticMaturity"]); check(typeof r.functionId === "string" && ["none", "structural", "partial", "reconciled", "published-local"].includes(String(r.semanticMaturity)), "member maturity"); }
  }
  const f = record(all.fullContextByGroup, ["version", "groups"]); check(f.version === "l8-full-context-by-group-v1" && Array.isArray(f.groups), "full group contexts");
  for (const v of f.groups) { const r = record(v, ["groupId", "functionIds", "nodes", "edges", "objects", "unresolved", "capabilities"]); check(typeof r.groupId === "string", "context group ID"); strings(r.functionIds); for (const k of ["nodes", "edges", "objects", "unresolved", "capabilities"]) check(Array.isArray(r[k]), "context collection"); }
  const o = record(all.contextOmissions, ["version", "byGroup", "byCommunity"]); check(o.version === "l8-context-omissions-v1", "context omissions version");
  for (const [k, id] of [["byGroup", "groupId"], ["byCommunity", "communityContentId"]]) {
    check(Array.isArray(o[k!]), "omission collection"); for (const v of o[k!] as unknown[]) { const r = record(v, [id!, "functionIds"]); check(typeof r[id!] === "string", "omission identity"); strings(r.functionIds); }
  }
  return value as DecodedGroupSourceV1;
}

/** Validate supplied sources and project them; never reconstruct a grouping or partition. */
export function projectExecutionSourcesForL5V1(fullSnapshot: unknown, rawTransport: unknown, rawGrouping: unknown,
  rawPolicy: unknown, rawContext: unknown): CodecResult<ReadonlyData<ExecutionProjectionV1>> {
  return run(() => {
    plain([fullSnapshot, rawTransport, rawGrouping, rawPolicy, rawContext]);
    const snapshot = assertSnapshotContract(structuredClone(fullSnapshot));
    const decoded = decodePreparedGraphV3(rawTransport); check(decoded.ok, decoded.ok ? "" : decoded.errors.join("; "));
    const transport = decoded.value, inspection = inspectPreparedGraphV3(transport);
    check(inspection.wellFormed && inspection.coherent, `transport relations: ${inspection.coherenceErrors.join("; ")}`);
    const { partition } = transport;
    check(partition.snapshotId === snapshot.snapshotId && partition.snapshotFingerprint === snapshot.normalizedFingerprint, "partition/full snapshot binding");
    const viewResult = projectGraphSnapshotViewV1(snapshot); check(viewResult.ok, viewResult.ok ? "" : viewResult.reasons.join("; "));
    const view = viewResult.value;
    if (partition.regime === "B") {
      check(transport.proposalEvidence, "B evidence absent"); equal(transport.proposalEvidence.source.snapshot, view, "full snapshot/L4 view mismatch (including sites and observation metadata)");
      check(inspection.evidence.wellFormed === true, "B evidence content invalid");
    } else check(!transport.proposalEvidence, "executable A has no B evidence");
    const grouping = groupingSource(structuredClone(rawGrouping)), config = grouping.groupingConfig, metrics = grouping.groupingMetrics;
    check(metrics.partitionId === partition.partitionId && metrics.snapshotFingerprint === snapshot.normalizedFingerprint && metrics.configFingerprint === fingerprint(config), "group metrics/config source binding");
    const nodes = new Map(snapshot.nodes.map(n => [n.id, n])), communities = new Map(partition.communities.map(c => [c.contentId, c]));
    for (const c of partition.communities) check(c.contentId === communityContentId(partition.algorithm, partition.algorithmVersion, partition.configFingerprint, sortFunctionIds([...c.memberIds])), "upstream community content ID");
    const ids = transport.groups.map(g => g.groupId); strings(ids);
    sameSet(grouping.communityBinding.groups.map(g => g.groupId), ids, "community/group key set");
    sameSet(grouping.fullContextByGroup.groups.map(g => g.groupId), ids, "full context/group key set");
    sameSet(grouping.contextOmissions.byGroup.map(g => g.groupId), ids, "omission/group key set");
    sameSet(grouping.contextOmissions.byCommunity.map(g => g.communityContentId), [...communities.keys()], "omission/community key set");
    for (const key of ["sourceCommunitiesByGroupId", "kernelIdsByGroupId", "contextIdListUtf8BytesByGroupId", "omittedContextIdsByGroupId", "allCapabilityIdsByGroupId", "contentFingerprintByGroupId"] as const)
      sameSet(Object.keys(metrics[key]), ids, `metrics ${key} keys`);
    sameSet(Object.keys(metrics.omittedCommunityContextIds), [...communities.keys()], "metrics community omission keys");
    const owners = new Set<string>();
    for (const group of transport.groups) {
      check(validateStaticJsonSchema(group, groupSchema as StaticJsonSchema).length === 0, "full group schema");
      const community = communities.get(group.communityContentId); check(community, "unknown group community");
      const binding = grouping.communityBinding.groups.find(b => b.groupId === group.groupId)!;
      check(binding.communityContentId === community.contentId, "community binding content ID");
      equal(at(metrics.sourceCommunitiesByGroupId, group.groupId), [community.contentId], "cross-community ownership is not an implicit B projection");
      for (const id of group.ownedFunctionIds) { check(nodes.has(id) && community.memberIds.includes(id) && community.kernelIds.includes(id) && !owners.has(id), "group owner outside unique community kernel"); owners.add(id); check(at(metrics.ownerByFunctionId, id) === group.groupId, "owner metrics mismatch"); }
      equal(binding.kernelIds, community.kernelIds, "community kernel lost"); equal(binding.parentContentIds, community.parentContentIds, "community parents lost");
      equal(at(metrics.kernelIdsByGroupId, group.groupId), group.ownedFunctionIds, "group kernel attribution");
      equal(group.memberMaturity, group.ownedFunctionIds.map(id => ({ functionId: id, semanticMaturity: nodes.get(id)!.semanticMaturity })), "group maturity/full snapshot mismatch");
      equal(binding.memberMaturity, group.memberMaturity, "bound member maturities");
      const capabilities = [...new Set(snapshot.capabilities.filter(c => c.subjectKind === "function" && group.ownedFunctionIds.includes(c.subjectId)).map(c => c.id))].sort();
      equal(at(metrics.allCapabilityIdsByGroupId, group.groupId), capabilities, "full capability sidecar mismatch");
      equal(binding.capabilityIds, capabilities, "bound full capabilities"); equal(group.capabilityIds, capabilities.slice(0, 256), "capability transport projection");
      const omitted = at(metrics.omittedContextIdsByGroupId, group.groupId), communityOmitted = at(metrics.omittedCommunityContextIds, community.contentId);
      equal(grouping.contextOmissions.byGroup.find(g => g.groupId === group.groupId)!.functionIds, omitted, "group omissions lost");
      equal(grouping.contextOmissions.byCommunity.find(g => g.communityContentId === community.contentId)!.functionIds, communityOmitted, "community omissions lost");
      check([...group.contextFunctionIds, ...omitted, ...communityOmitted].every(id => nodes.has(id) && !group.ownedFunctionIds.includes(id)), "unknown/owned context entry");
      check(group.contextFunctionIds.length <= config.maxContextFunctions && group.ownedFunctionIds.length <= config.maxSize, "group config bounds");
      check(at(metrics.contextIdListUtf8BytesByGroupId, group.groupId) === Buffer.byteLength(JSON.stringify(group.contextFunctionIds)), "context ID byte metric");
      const full = grouping.fullContextByGroup.groups.find(g => g.groupId === group.groupId)!;
      const scope = new Set([...group.ownedFunctionIds, ...group.contextFunctionIds, ...omitted, ...communityOmitted, ...community.externalContextIds]);
      sameSet(full.functionIds, [...scope], "full context cannot drop omitted/mandatory source functions");
      equal(full.nodes, snapshot.nodes.filter(n => scope.has(n.id)), "full context node bytes/order");
      equal(full.edges, snapshot.edges.filter(e => scope.has(e.sourceId) || scope.has(e.destinationId)), "full incident relations/sites/provenances lost");
      equal(full.objects, snapshot.objects, "context object source lost"); equal(full.unresolved, snapshot.unresolved.filter(u => scope.has(u.fromFunctionId)), "context unresolved source lost");
      equal(full.capabilities, snapshot.capabilities, "context capability/provenance source lost");
      const content = fingerprint({ version: "group-artifact-content-v1", contextBinding: metrics.contextBinding, group,
        sourceCommunities: [community.contentId], allCapabilityIds: capabilities, omittedContextIds: omitted,
        omittedCommunityContextIds: [[community.contentId, communityOmitted]] });
      check(at(metrics.contentFingerprintByGroupId, group.groupId) === content, "upstream group artifact content fingerprint");
    }
    check(Object.keys(metrics.ownerByFunctionId).length === owners.size, "extraneous group owner attribution");
    for (const id of snapshot.nodes.map(n => n.id)) check(owners.has(id) || Object.hasOwn(metrics.uncoveredOwnerByFunctionId, id) || Object.hasOwn(metrics.uncoveredCommunityByFunctionId, id), "silently dropped source function");
    const cb = metrics.contextBinding;
    check(cb.hubSetFingerprint === fingerprint(metrics.hubIds), "hub set content mismatch");
    check(cb.bindingFingerprint === fingerprint({ version: "group-context-binding-v1", projectionSource: cb.projectionSource, projectionFingerprint: cb.projectionFingerprint,
      hubSetFingerprint: cb.hubSetFingerprint, snapshotFingerprint: snapshot.normalizedFingerprint, partitionId: partition.partitionId, configFingerprint: metrics.configFingerprint }), "context binding fingerprint");
    // Retain affinity's recorded binding, never recompute its scientific producer at load.
    validatePlannerPolicy(rawPolicy, true, true); const policy = structuredClone(rawPolicy) as PlannerPolicy;
    const context = record(rawContext, ["version", "missionId", "snapshotId", "snapshotFingerprint", "partitionId", "knowledgeRevision", "missionConfigFingerprint", "executionSpecFingerprint", "inputManifestFingerprint", "admissionCodecVersion", "cycle", "budgetEpoch"]);
    check(context.version === "planner-admission-context-v1" && context.missionId === snapshot.missionId && context.snapshotId === snapshot.snapshotId
      && context.snapshotFingerprint === snapshot.normalizedFingerprint && context.partitionId === partition.partitionId && context.knowledgeRevision === snapshot.knowledgeRevision
      && policy.partitionId === partition.partitionId, "L5 context/partition/full snapshot mismatch");
    integer(context.cycle, 1); integer(context.budgetEpoch, 1); for (const k of ["missionConfigFingerprint", "executionSpecFingerprint", "inputManifestFingerprint"]) digest(context[k]);
    check(context.admissionCodecVersion === "l8-fixture-admission-codec-v2", "admission codec mismatch");
    const graph: PlannerGraphInput = { schemaVersion: 1, snapshotId: snapshot.snapshotId, missionId: snapshot.missionId,
      normalizedFingerprint: snapshot.normalizedFingerprint, knowledgeRevision: snapshot.knowledgeRevision,
      nodes: structuredClone(snapshot.nodes), edges: structuredClone(snapshot.edges), binaryArtifacts: structuredClone(snapshot.binaryArtifacts),
      unresolved: structuredClone(snapshot.unresolved), coverage: structuredClone(snapshot.coverage) };
    return freeze({ graph, groups: transport.groups.map(g => ({ groupId: g.groupId, partitionId: g.partitionId, ownedFunctionIds: [...g.ownedFunctionIds], contextFunctionIds: [...g.contextFunctionIds] })),
      partitionId: partition.partitionId, regime: partition.regime, snapshotView: structuredClone(view) as GraphSnapshotView,
      proposalAdmissible: partition.regime === "B" ? inspection.evidence.admissible : null,
      sourceBindings: { snapshotFingerprint: snapshot.normalizedFingerprint, partitionStoreDigest: fingerprint(partition),
        proposalFingerprint: partitionProposalFingerprint(structuredClone(partition) as ClusterPartitionView), groupMetricsFingerprint: fingerprint(metrics), fullContextFingerprint: fingerprint(grouping.fullContextByGroup) } });
  });
}

export function projectRegimeBForL5(fullSnapshot: unknown, transport: unknown, grouping: unknown,
  policy: unknown, context: unknown): CodecResult<ReadonlyData<ExecutionProjectionV1>> {
  const result = projectExecutionSourcesForL5V1(fullSnapshot, transport, grouping, policy, context);
  return result.ok && result.value.regime !== "B" ? { ok: false, reasons: ["l8-projection: regime B required; no A cast"] } : result;
}
