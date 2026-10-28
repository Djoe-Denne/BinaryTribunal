import { readFileSync } from 'node:fs';
import { bd, decode, fp, manualPreparation, signed, value, manualPlanId, descendant } from './manual-root';
import type { Manual } from './manual-root';
import type { Data } from './manual-root';
import { bytes, fixtureJson, sha } from '../oracle/wire';
// Explicit zero-arc retained summands, with hand-calculated zero caches.
export function retainedEmptySummands(f: Manual): void {
  const source = decode(f.body.contextSources.partitionContext), graph = decode(source.graph);
  const version = 'scaled-binary64-exact-leiden-interval-ppr-v1';
  const payload = { version, arcs: [], rawArcCount: 0, budgetVersion: 'numeric-source-arc-budget-v1', maxArcs: 1000000 };
  const binding = fp({ version, weightConvention: 'source-summands-v1', projection: { ids: [f.node.id], arcs: [], out: [[]], incoming: [[]], outDegree: [0], inDegree: [0], totalWeight: 0 }, source: payload });
  graph.numericPolicy = { version, weightConvention: 'source-summands-v1', bindingFingerprint: binding };
  graph.numericSource = { ...payload, bindingFingerprint: binding };
  source.graph = bd('sparse-graph-numeric-v1', graph);
  source.summary.weightConvention = 'source-summands-v1';
  f.body.contextSources.partitionContext = bd('l8-numeric-graph-source-v1', source);
  f.independent.contextSources = structuredClone(f.body.contextSources);
}

export function scienceEnvelope(f: Manual, unit: Data): Data {
  return { snapshotId: f.snapshot.snapshotId, snapshotFingerprint: f.snapshot.normalizedFingerprint, policyVersion: f.policy.version, unit: { ...unit, state: 'PENDING' },
    functions: [...unit.ownedFunctionIds, ...unit.contextFunctionIds].map(id => f.snapshot.nodes.find((n: Data) => n.id === id)),
    requirements: unit.prerequisites.map((p: Data) => f.planning.sidecar.requirementById[p.id] ?? null),
    dispensations: unit.prerequisites.map((p: Data) => f.planning.sidecar.dispensationById[p.id] ?? null) };
}
// Only the fixed one-/two-/three-node recipes below use this data serializer.
// No clustering, graph search, ranking, producer or validator is embedded here.
function fixedUnit(f: Manual, owned: string[], context: string[]): Data {
  const unitId = 'unit:' + fp({ investigationKind: 'decompilation', functionIds: owned });
  const subIntents = owned.flatMap(functionId => {
    const n = f.snapshot.nodes.find((x: Data) => x.id === functionId), prefix = 'sub:' + fp({ unitId, functionId });
    return ['A','B','R'].map(role => ({ subIntentId: prefix + ':' + role, functionId, role, harnessIdentity: { sha256: n.moduleSha256, version: f.snapshot.binaryArtifacts[0].versionLabel, ea: n.ea }, waitsForSubIntentIds: role === 'R' ? [prefix + ':A', prefix + ':B'] : [], sharesFamilyLease: true, outputDisjoint: true }));
  });
  return { schemaVersion: 1, unitId, snapshotId: f.snapshot.snapshotId, partitionId: f.partition.partitionId, knowledgeRevision: 1, ownedFunctionIds: owned, contextFunctionIds: context,
    investigationKind: 'decompilation', pipeline: '2+1', subIntents, prerequisites: [], conflicts: owned.map(functionId => ({ id: 'conflict:' + fp({ unitId, functionId }), kind: 'owned_function', resourceKey: 'fn:' + functionId, withUnitId: null })).sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    estimatedCost: { known: true, value: 3 * owned.length }, requiredPublicationLevel: 1, state: 'PENDING' };
}
function sealFixedPlanning(f: Manual, scienceDelta: number | 'utf16' = 0): Record<string, { actualS: number; characterCount: number; C: number }> {
  f.context.snapshotId = f.snapshot.snapshotId; f.context.snapshotFingerprint = f.snapshot.normalizedFingerprint; f.context.partitionId = f.partition.partitionId;
  f.policy.partitionId = f.partition.partitionId; f.policy.maxSelectedUnits = f.planning.units.length;
  f.allocation.context = f.context; f.allocation = signed(f.allocation); f.policy.admissionBudget = f.allocation;
  const accounting: Data = {}, sizes: Record<string, { actualS: number; characterCount: number; C: number }> = {};
  const unitFingerprints: Data = {}, envelopes: Data = {}, estimates: Data = {}, resources: Data = {}, localOrders: Data = {};
  for (const u of f.planning.units) {
    const text = fixtureJson(scienceEnvelope(f, u)), actualS = bytes(text).length;
    const declaredS = scienceDelta === 'utf16' ? text.length : actualS + scienceDelta;
    const C = Math.max(declaredS, ...u.ownedFunctionIds.map((id: string) => f.allocation.capsByFunction[id].completeBodyMaxUtf8Bytes.value));
    accounting[u.unitId] = { structuralEnvelopeUtf8Bytes: declaredS, admissionCapUtf8Bytes: { known: true, value: C }, maxNewExecutions: { known: true, value: u.ownedFunctionIds.length * 3 }, totalAdmissionUtf8Bytes: { known: true, value: C * u.ownedFunctionIds.length * 3 } };
    sizes[u.unitId] = { actualS, characterCount: text.length, C };
    unitFingerprints[u.unitId] = fp(Object.fromEntries(Object.entries(u).filter(([key]) => key !== 'state')));
    envelopes[u.unitId] = C;
    estimates[u.unitId] = { version: f.policy.estimationVersion, cost: u.estimatedCost, modelCosts: {} };
    resources[u.unitId] = { profiles: ['qa'], models: ['primary'], tools: ['qa-read'], accounts: ['qa-account'], slots: 1, cpu: 1, gpu: 0, budget: u.ownedFunctionIds.length };
    localOrders[u.unitId] = { sccIds: u.ownedFunctionIds.map((id: string) => 'scc:' + fp([id])), functionIds: u.ownedFunctionIds, recursive: false, maxIterations: 1, publication: 'whole-unit-only' };
  }
  const units = f.planning.units, selectedUnitIds = units.map(u => u.unitId).sort();
  f.planning.plan = signed({ ...f.planning.plan, snapshotId: f.snapshot.snapshotId, partitionId: f.partition.partitionId,
    planId: manualPlanId(f.snapshot.normalizedFingerprint, f.policy, units.map(u => u.ownedFunctionIds), f.context),
    units: units.map(u => ({ unitId: u.unitId, ownedFunctionIds: u.ownedFunctionIds, contextFunctionIds: u.contextFunctionIds, requiredPublicationLevel: 1, state: u.state, contextEnvelopeUtf8Bytes: { known: true, value: sizes[u.unitId]!.C } })),
    selectedUnitIds, decisions: units.map(u => ({ id: 'qa-include:' + u.unitId, unitId: u.unitId, action: 'include', reason: 'fixed manual input layout' })),
    g2Conflicts: units.flatMap(u => u.conflicts), sccs: f.snapshot.nodes.map((n: Data) => ({ id: 'scc:' + fp([n.id]), functionIds: [n.id], exclusive: false, hasSelfLoop: false, selfLoopPreserved: true })) });
  const total = Object.values(accounting).reduce((sum: number, a: any) => sum + a.totalAdmissionUtf8Bytes.value, 0);
  f.planning.sidecar = signed({ ...f.planning.sidecar, planId: f.planning.plan.planId, planFingerprint: f.planning.plan.fingerprint, snapshotFingerprint: f.snapshot.normalizedFingerprint, policy: f.policy,
    unitFingerprints, envelopeBytesByUnit: envelopes, estimatesByUnit: estimates, resourcesByUnit: resources, localOrders,
    admissionBudget: { version: 'planner-admission-accounting-v1', context: f.context, allocationFingerprint: f.allocation.fingerprint, byUnit: accounting, selectedTotalAdmissionUtf8Bytes: total } });
  f.planning.binding = signed({ schemaVersion: 1, planFingerprint: f.planning.plan.fingerprint, sidecarFingerprint: f.planning.sidecar.fingerprint });
  const a = f.body.admissionSource;
  a.context = f.context; a.allocation = f.allocation;
  a.sourceFingerprints = { ...a.sourceFingerprints, context: fp(f.context), allocation: f.allocation.fingerprint };
  f.body.planningPolicy = bd('l8-planning-policy-source-v1', f.policy);
  f.independent.planningPolicy = structuredClone(f.body.planningPolicy);
  return sizes;
}
function installRoot(f: Manual, sizes: Record<string, { C: number }>, grantDelta?: number): void {
  const a = f.body.admissionSource, allocation = bd('l8-admission-allocation-source-v1', f.allocation);
  const account = value('l8-budget-root-v1', { missionId: f.body.missionId, lineageId: f.body.generation.lineageId, rootAllocationRef: allocation.ref }).sha256;
  const bootstrap = { snapshot: f.body.fullGraphSnapshot, missionSnapshot: f.body.sourceMissionSnapshot, planning: bd('l8-planning-source-v1', f.planning), planningPolicy: f.body.planningPolicy, executionTemplate: a.executionTemplate, executionSourceSpec: a.executionSourceSpec };
  const entries = f.snapshot.nodes.flatMap((n: Data) => {
    const unit = f.planning.units.find(u => u.ownedFunctionIds.includes(n.id))!;
    const cap = grantDelta === undefined ? 1000000 : sizes[unit.unitId]!.C + grantDelta;
    return ['A','B','R'].map(role => ({ slot: { rootAccountId: account, functionIdentity: { sha256: n.moduleSha256, version: f.snapshot.binaryArtifacts[0].versionLabel, ea: n.ea }, role, pass: 1 }, functionId: n.id, bodyCapUtf8Bytes: cap, reservedDebitUtf8Bytes: cap }));
  });
  const grants = { ...f.grants, rootAccountId: account, rootAllocationRef: allocation.ref, sourceSnapshotRef: bootstrap.snapshot.ref, sourcePlanningRef: bootstrap.planning.ref, sourcePolicyRef: bootstrap.planningPolicy.ref, grants: entries };
  const models = { ...f.models, rootAccountId: account, sourceExecutionTemplateRef: bootstrap.executionTemplate.ref, sourceExecutionSpecRef: bootstrap.executionSourceSpec.ref };
  f.grants = grants as typeof f.grants; f.models = models as typeof f.models;
  f.root = { ...f.root, allocation, maxSelectedUnits: f.planning.units.length, executionTemplate: a.executionTemplate, rootSlotGrants: bd('l8-root-slot-grants-v1', grants), rootModelBindings: bd('l8-root-model-bindings-v1', models) };
  const root = bd('l8-root-limits-v1', f.root);
  a.budgetLineage = { ...a.budgetLineage, rootAccountId: account, rootAllocationRef: allocation.ref, rootLimits: root };
  f.body.rootBootstrapSources = bootstrap;
  Object.assign(f.body.preparationObservationT0, { rootLimitsRef: root.ref, rootSlotGrantsRef: f.root.rootSlotGrants.ref, rootModelBindingsRef: f.root.rootModelBindings.ref });
  f.independent.rootLimits = structuredClone(root) as typeof f.independent.rootLimits;
  f.independent.rootBootstrapSources = structuredClone(bootstrap);
}
type LayoutRow = { community: number; owned: number[]; context: number[]; omitted: number[] };
function installLayout(f: Manual, rows: LayoutRow[], raw: boolean, numeric: Data, newRoot: boolean, options: { scienceDelta?: number | 'utf16'; grantDelta?: number } = {}) {
  const ids: string[] = f.snapshot.nodes.map((n: Data) => n.id), partition: Data = f.partition, communities = partition.communities;
  const config = { version: 'qa-fixed-layout', minSize: 1, maxSize: Math.max(...rows.map(r => r.owned.length)), maxContextFunctions: 1, smallPolicy: 'preserve-community', costSource: 'bytes', costPerUnit: 1, fixedCost: 0 };
  const groups = rows.map((row, i) => ({ schemaVersion: 1, groupId: 'qa-fixed-group-' + i, partitionId: partition.partitionId, communityContentId: communities[row.community].contentId,
    ownedFunctionIds: row.owned.map(n => ids[n]!), contextFunctionIds: row.context.map(n => ids[n]!), capabilityIds: [], granularity: row.owned.length > 1 ? 'group' : 'function', estimatedCost: { known: true, value: row.owned.length * 16 }, uncoveredIds: [], memberMaturity: row.owned.map(n => ({ functionId: ids[n], semanticMaturity: f.snapshot.nodes[n].semanticMaturity })) }));
  const projectionFingerprint = fp({ version: 'group-adjacency-v2', numericBinding: raw ? null : numeric.graph.numericPolicy.bindingFingerprint, nodes: ids,
    adjacency: ids.length === 3 ? (raw ? [[ids[0], [[ids[1], 1]]], [ids[1], [[ids[0], 1]]], [ids[2], []]] : [[ids[0], [[ids[2], 2]]], [ids[1], []], [ids[2], [[ids[0], 2]]]]) : ids.map(id => [id, []]) });
  const binding = { version: 'group-context-binding-v1', projectionSource: raw ? 'raw-active-control-relations' : 'provided-affinity', projectionFingerprint, hubSetFingerprint: fp([]), bindingFingerprint: '' };
  binding.bindingFingerprint = fp({ version: binding.version, projectionSource: binding.projectionSource, projectionFingerprint, hubSetFingerprint: binding.hubSetFingerprint, snapshotFingerprint: f.snapshot.normalizedFingerprint, partitionId: partition.partitionId, configFingerprint: fp(config) });
  const metrics: Data = { version: 'group-metrics-v1', configFingerprint: fp(config), partitionId: partition.partitionId, snapshotFingerprint: f.snapshot.normalizedFingerprint,
    ownerByFunctionId: {}, uncoveredOwnerByFunctionId: {}, uncoveredCommunityByFunctionId: {}, sourceCommunitiesByGroupId: {}, kernelIdsByGroupId: {}, contextIdListUtf8BytesByGroupId: {}, omittedContextIdsByGroupId: {}, omittedCommunityContextIds: {}, allCapabilityIdsByGroupId: {}, smallGroupIds: [], isolatedIds: ids.length === 3 ? [raw ? ids[2] : ids[1]] : ids, hubIds: [], nonCoveredIds: [], coverageStatus: 'complete', contextBinding: binding, contentFingerprintByGroupId: {}, diagnostics: [] };
  for (const c of communities) metrics.omittedCommunityContextIds[c.contentId] = [];
  const communityGroups: Data[] = [], fullGroups: Data[] = [], omittedGroups: Data[] = [];
  groups.forEach((g, i) => {
    const row = rows[i]!, c = communities[row.community], omitted = row.omitted.map(n => ids[n]!);
    for (const id of g.ownedFunctionIds) metrics.ownerByFunctionId[id] = g.groupId;
    metrics.sourceCommunitiesByGroupId[g.groupId] = [c.contentId]; metrics.kernelIdsByGroupId[g.groupId] = g.ownedFunctionIds;
    metrics.contextIdListUtf8BytesByGroupId[g.groupId] = bytes(JSON.stringify(g.contextFunctionIds)).length;
    metrics.omittedContextIdsByGroupId[g.groupId] = omitted; metrics.allCapabilityIdsByGroupId[g.groupId] = [];
    metrics.contentFingerprintByGroupId[g.groupId] = fp({ version: 'group-artifact-content-v1', contextBinding: binding, group: g, sourceCommunities: [c.contentId], allCapabilityIds: [], omittedContextIds: omitted, omittedCommunityContextIds: [[c.contentId, []]] });
    communityGroups.push({ groupId: g.groupId, communityContentId: c.contentId, kernelIds: c.kernelIds, parentContentIds: [], capabilityIds: [], memberMaturity: g.memberMaturity });
    const scope = new Set([...g.ownedFunctionIds, ...g.contextFunctionIds, ...omitted, ...c.externalContextIds]);
    fullGroups.push({ groupId: g.groupId, functionIds: ids.filter(id => scope.has(id)), nodes: f.snapshot.nodes.filter((n: Data) => scope.has(n.id)),
      // Every controlled three-node group contains an endpoint of the sole raw edge.
      edges: f.snapshot.edges, objects: f.snapshot.objects, unresolved: f.snapshot.unresolved.filter((r: Data) => scope.has(r.fromFunctionId)), capabilities: [] });
    omittedGroups.push({ groupId: g.groupId, functionIds: omitted });
  });
  f.group = groups[0] as typeof f.group; f.groupMetrics = metrics as typeof f.groupMetrics;
  const grouping = { groupsRef: value('l8-groups-value-v1', groups), groupingConfig: bd('l8-grouping-config-source-v1', config), groupingMetrics: bd('group-metrics-v1', metrics), communityBinding: bd('l8-community-binding-v1', { version: 'l8-community-binding-v1', groups: communityGroups }), fullContextByGroup: bd('l8-full-context-by-group-v1', { version: 'l8-full-context-by-group-v1', groups: fullGroups }), contextOmissions: bd('l8-context-omissions-v1', { version: 'l8-context-omissions-v1', byGroup: omittedGroups, byCommunity: communities.map((c: Data) => ({ communityContentId: c.contentId, functionIds: [] })) }) };
  f.body.groupSource = grouping;
  const numerical = { ...numeric.source, fullGraphSnapshotRef: f.body.fullGraphSnapshot.ref, producerModuleRef: f.body.contractPins.clusterTypesModule };
  const producerPolicy = decode(numerical.producerPolicy); producerPolicy.fullGraphSnapshotRef = f.body.fullGraphSnapshot.ref;
  if (ids.length === 3) Object.assign(producerPolicy.weights, { direct: 0, tail: 0, indirectHigh: 0, indirectOther: 0, thunk: 0, dispatch: 0, rareData: 1, memoryWeak: 0, hubThreshold: 100 });
  numerical.producerPolicy = bd('l8-projection-policy-source-v1', producerPolicy);
  const source = bd('l8-numeric-graph-source-v1', numerical);
  f.body.contextSources = { version: 'l8-public-context-sources-v1', partitionContext: source, groupAdjacency: raw ? { kind: 'raw-active-control-relations' } : { kind: 'provided-affinity', source: structuredClone(source) } };
  f.planning.units = groups.map(g => fixedUnit(f, g.ownedFunctionIds, g.contextFunctionIds));
  const units = f.planning.units;
  f.planning.plan.g3Affinities = ids.length !== 3 ? [] : raw
    ? [{ unitIds: [units[1]!.unitId, units[2]!.unitId].sort(), reason: 'shared context:' + ids[0], blocking: false }]
    : [{ unitIds: [units[0]!.unitId, units[1]!.unitId].sort(), reason: 'shared context:' + ids[2], blocking: false }];
  f.policy.estimatesByFunction = Object.fromEntries(ids.map(id => [id, { version: f.policy.estimationVersion, A: 1, B: 1, R: 1, validation: 1 }]));
  f.policy.resourcesByFunction = Object.fromEntries(ids.map(id => [id, { profiles: ['qa'], models: ['primary'], tools: ['qa-read'], accounts: ['qa-account'], slots: 1, cpu: 1, gpu: 0, budget: 1 }]));
  f.allocation.capsByFunction = Object.fromEntries(ids.map(id => [id, { completeBodyMaxUtf8Bytes: { known: true, value: 100000 }, maxNewExecutionsPerRole: { A: 1, B: 1, R: 1 } }]));
  if (ids.length === 2) {
    const S = bytes(fixtureJson(scienceEnvelope(f, units[0]!))).length;
    f.allocation.capsByFunction[ids[0]!].completeBodyMaxUtf8Bytes.value = S - 1;
    f.allocation.capsByFunction[ids[1]!].completeBodyMaxUtf8Bytes.value = S + 1;
  }
  const sizes = sealFixedPlanning(f, options.scienceDelta ?? 0);
  if (newRoot) installRoot(f, sizes, options.grantDelta);
  f.body.sourceRefs = { ...f.body.sourceRefs, partitionRef: value('l8-partition-value-v1', partition), groupsRef: value('l8-groups-value-v1', groups), partitionStoreDigest: fp(partition) };
  f.body.preparationObservationT0.partitionStoreDigest = fp(partition);
  f.body.preparedTransport = bd('l8-prepared-graph-v3', { schemaVersion: 3, partition, groups });
  f.independent.fullGraphSnapshot = structuredClone(f.body.fullGraphSnapshot);
  f.independent.contextSources = structuredClone(f.body.contextSources); f.independent.groupingConfig = grouping.groupingConfig;
  return sizes;
}
export function manualDivergent(kind: 'two-caps' | 'raw' | 'affinity', options: { scienceDelta?: number | 'utf16'; grantDelta?: number } = {}) {
  const f = manualPreparation(), raw = readFileSync(new URL('../../../../../inputs/historical-snapshots/components-disconnected.json', import.meta.url));
  if (raw.length !== 4131 || sha(raw) !== '71079dd202b0bbd50a337f0d1466b1bfb87c68396fe8f51e29ff2823ecb20242') throw Error('two-component DATA drift');
  const snapshot: Data = JSON.parse(raw.toString('utf8'));
  snapshot.snapshotId = 'qa:' + kind; snapshot.nodes[0].observedDescription = 'Aé😀';
  snapshot.scope.description = kind === 'two-caps' ? 'Synthetic fixed two-function UTF8 cap witness' : 'Synthetic fixed raw-control versus shared-data-affinity witness';
  snapshot.toolVersions = { extractor: 'manual-synthetic-qa', extractorHash: sha('manual-synthetic-qa-data-v1'), normalizer: 'qa-c14n-wire' };
  snapshot.configFingerprint = sha('manual-synthetic-qa source configuration ' + kind);
  if (kind !== 'two-caps') {
    const third = structuredClone(snapshot.nodes[1]); Object.assign(third, { id: third.moduleSha256 + ':0x9000', rva: '0x9000', ea: '0x409000', boundaries: [{ ordinal: 0, rva: '0x9000', endRvaExclusive: '0x9010', role: 'entry' }] }); snapshot.nodes.push(third); snapshot.scope.functionCount = 3;
    const provenance = (siteRva: string, xrefType: string, siteKind = 'instruction') => ({ moduleSha256: third.moduleSha256, siteRva, siteKind, xrefType, source: 'manual-synthetic-data', sourceVersion: '1', sourceHash: sha('qa-source'), evidenceSha256: sha('qa-evidence') });
    snapshot.edges = [{ schemaVersion: 1, id: 'qa-context-edge', sourceId: snapshot.nodes[0].id, destinationId: snapshot.nodes[1].id, kind: 'direct_call', direction: 'source_to_destination', sites: [{ siteRva: '0x1004', xrefType: 'code', provenance: provenance('0x1004','code') }], status: 'observed', confidence: 'high', appearedInRevision: 1, retiredInRevision: null, schedulerRelevance: 'context_only' }];
    const edge = snapshot.edges[0];
    edge.id = 'edge:' + fp({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind, sites: edge.sites });
    snapshot.objects = [{ schemaVersion: 1, id: 'qa-shared-data', moduleSha256: third.moduleSha256, kind: 'data', rva: '0xA000', name: 'qaSharedData', widthBytes: { known: true, value: 4 }, provenance: provenance('0xA000','data','object') }];
    snapshot.unresolved = [0,2].map(i => ({ schemaVersion: 1, id: 'qa-data-ref-' + i, fromFunctionId: snapshot.nodes[i].id, siteRva: i === 0 ? '0x1004' : '0x9004', kind: 'data_xref', target: 'data_object', referencedObjectId: 'qa-shared-data', fabricatedFunction: false, provenance: provenance(i === 0 ? '0x1004' : '0x9004','data') }));
  }
  const { normalizedFingerprint: ignored, ...snapshotBody } = snapshot; snapshot.normalizedFingerprint = fp(snapshotBody);
  f.snapshot = snapshot; f.node = snapshot.nodes[0]; f.body.fullGraphSnapshot = bd('graph-snapshot-v1', snapshot);
  const ids: string[] = snapshot.nodes.map((n: Data) => n.id), partition: Data = structuredClone(f.partition);
  partition.partitionId = 'qa-partition-' + kind; partition.snapshotId = snapshot.snapshotId; partition.snapshotFingerprint = snapshot.normalizedFingerprint;
  const memberships = kind === 'two-caps' ? [[ids[0],ids[1]]] : [[ids[0],ids[1]],[ids[2]]];
  partition.communities = memberships.map((memberIds,i) => ({ contentId: fp({ algorithm: partition.algorithm, algorithmVersion: partition.algorithmVersion, configFingerprint: partition.configFingerprint, memberIds }), lineageId: 'qa-community-' + i, parentContentIds: [], memberIds, kernelIds: memberIds, externalContextIds: kind === 'two-caps' ? [] : i === 0 ? [ids[2]] : [ids[0]], conductance: { known: false, value: null } }));
  f.partition = partition as typeof f.partition;
  const version = 'scaled-binary64-exact-leiden-interval-ppr-v1';
  const arcs = kind === 'two-caps' ? [] : [{ source: 0, target: 2, weight: 1 },{ source: 2, target: 0, weight: 1 }];
  const retained = kind === 'two-caps' ? null : { version, arcs: [{ source: 0, target: 2, weight: 0.5 },{ source: 0, target: 2, weight: 0.5 },{ source: 2, target: 0, weight: 1 }], rawArcCount: 3, budgetVersion: 'numeric-source-arc-budget-v1', maxArcs: 3 };
  const graphProjection = kind === 'two-caps' ? { ids, arcs, out: [[],[]], incoming: [[],[]], outDegree: [0,0], inDegree: [0,0], totalWeight: 0 }
    : { ids, arcs, out: [[[2,1]],[],[[0,1]]], incoming: [[[2,1]],[],[[0,1]]], outDegree: [1,0,1], inDegree: [1,0,1], totalWeight: 2 };
  const convention = retained ? 'source-summands-v1' : 'canonical-arcs-v1', binding = fp({ version, weightConvention: convention, projection: graphProjection, source: retained });
  const graph = { version: 'sparse-graph-numeric-v1', ids, arcs, numericPolicy: { version, weightConvention: convention, bindingFingerprint: binding }, ...(retained ? { numericSource: { ...retained, bindingFingerprint: binding } } : {}) };
  const baseSource = decode(f.body.contextSources.partitionContext);
  const source = { ...baseSource, graph: bd('sparse-graph-numeric-v1', graph), summary: { version, weightConvention: convention, canonicalArcCount: retained ? 2 : 0, sourceArcCount: retained ? 3 : 0, retainedSourceArcCount: retained ? 3 : 0, sourceArcBudget: retained ? 3 : 1000000, budgetVersion: 'numeric-source-arc-budget-v1' } };
  // These rows ARE the independent expected fixed layout, not results of a producer.
  const rows: LayoutRow[] = kind === 'two-caps' ? [{ community: 0, owned: [0,1], context: [], omitted: [] }]
    : kind === 'raw' ? [{ community: 0, owned: [0], context: [1], omitted: [2] },{ community: 0, owned: [1], context: [0], omitted: [2] },{ community: 1, owned: [2], context: [0], omitted: [] }]
      : [{ community: 0, owned: [0], context: [2], omitted: [] },{ community: 0, owned: [1], context: [2], omitted: [] },{ community: 1, owned: [2], context: [0], omitted: [] }];
  const sizes = installLayout(f, rows, kind !== 'affinity', { graph, source }, true, options);
  if (snapshot.edges.length) {
    const e = snapshot.edges[0], { id: edgeId, sites, sourceId, destinationId, kind: edgeKind, ...metadata } = e;
    const relation = { relationId: 'relation:v1:' + fp({ sourceId, destinationId, kind: edgeKind }), sourceId, destinationId, kind: edgeKind, sourceEdgeIds: [edgeId], sites, observations: [{ metadata, sourceEdgeIds: [edgeId], sites, sitesBySourceEdgeId: { [edgeId]: sites } }] };
    f.planning.sidecar = signed({ ...f.planning.sidecar, relationView: { version: 'planner-relations-v1', relations: [relation] } });
    f.planning.binding = signed({ schemaVersion: 1, planFingerprint: f.planning.plan.fingerprint, sidecarFingerprint: f.planning.sidecar.fingerprint });
    // Root retained planning must include the complete source relation view too.
    installRoot(f, sizes, options.grantDelta);
  }
  return { f, sizes, ids, expectedContexts: rows.map(r => r.context.map(n => ids[n]!)), expectedOmissions: rows.map(r => r.omitted.map(n => ids[n]!)) };
}

export function manualB() {
  const f = manualPreparation(); descendant(f);
  const snapshot: Data = structuredClone(f.snapshot);
  snapshot.snapshotId = 'qa:B-current-snapshot'; snapshot.nodes[0].semanticMaturity = 'structural';
  snapshot.scope.description = 'Synthetic current B source, not a native maturity observation';
  snapshot.toolVersions = { extractor: 'manual-synthetic-qa', extractorHash: sha('manual-synthetic-qa-data-v1'), normalizer: 'qa-c14n-wire' };
  const { normalizedFingerprint: oldFingerprint, ...snapshotBody } = snapshot; snapshot.normalizedFingerprint = fp(snapshotBody);
  f.snapshot = snapshot; f.node = snapshot.nodes[0]; f.body.fullGraphSnapshot = bd('graph-snapshot-v1', snapshot);
  const config = { rulesetVersion: 'ff8-tech-syn-1', synonyms: false, bm25: { k1: 1.2, b: 0.75 }, topK: 1, scoreTieDecimals: 6, similarityThreshold: 0.1, maxPostingDf: 16, maxCandidates: 16, hubMinDegree: 1, hysteresis: 0.5,
    views: { structure: true, data: false, lexical: false, embeddings: false, validatedRelations: false, capabilities: false } };
  const algorithm = 'multiview-components', algorithmVersion = '2', configFingerprint = fp({ algorithm, algorithmVersion, ...config, encoder: null });
  const memberIds = [f.node.id], contentId = fp({ algorithm, algorithmVersion, configFingerprint, memberIds });
  const community = { contentId, lineageId: 'lin:c:' + fp({ role: 'community-lineage', algorithm, algorithmVersion, configFingerprint, memberIds }), parentContentIds: [], memberIds, kernelIds: memberIds, externalContextIds: [], conductance: { known: false, value: null } };
  const partition: Data = { ...f.partition, snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint, algorithm, algorithmVersion, configFingerprint, regime: 'B', seed: 'none', maturity: 'multiview', communities: [community], parentLineageId: null,
    lineageId: 'lin:p:' + fp({ role: 'partition-lineage', configFingerprint, snapshotId: f.snapshot.snapshotId, contentIds: [contentId] }), partitionId: 'part:' + fp({ role: 'partition', configFingerprint, snapshotId: f.snapshot.snapshotId, contentIds: [contentId] }) };
  f.partition = partition as typeof f.partition;
  const baseNumeric = decode(f.body.contextSources.partitionContext);
  installLayout(f, [{ community: 0, owned: [0], context: [], omitted: [] }], true, { graph: decode(baseNumeric.graph), source: baseNumeric }, false);
  const view = { schemaVersion: 1, snapshotId: f.snapshot.snapshotId, normalizedFingerprint: f.snapshot.normalizedFingerprint, nodes: [{ id: f.node.id, moduleSha256: f.node.moduleSha256, rva: f.node.rva, name: f.node.name, observedDescription: f.node.observedDescription, semanticMaturity: f.node.semanticMaturity, functionClass: f.node.functionClass }], edges: [], objects: [], unresolved: [], capabilities: [] };
  const lineageSidecar = { version: 'l4-lineage-2', partitionId: partition.partitionId, v1Compatible: true, proposalPass: true, projectionFingerprint: fp(partition), communities: [{ contentId, parentContentIds: [], conductance: community.conductance }] };
  const source = { snapshot: view, config, constraints: [], encoderIdentity: null, encoderIdentityStatus: 'absent', previous: null };
  const result = { partition, lineageSidecar, diagnostics: [], constraints: { status: 'none', applied: 0, rejected: 0 } };
  const evidence = { version: 'l4-proposal-evidence-1', source, result, evidenceFingerprint: fp({ version: 'l4-proposal-evidence-1', source, result }) };
  const transport = decode(f.body.preparedTransport); transport.proposalEvidence = evidence;
  f.body.preparedTransport = bd('l8-prepared-graph-v3', transport); f.body.authorizationKind = 'proposal-b-host-fixture-v1';
  f.body.sourceRefs.proposalEvidenceRef = value('l8-proposal-evidence-value-v1', evidence); f.body.sourceRefs.lineageRef = value('l8-lineage-value-v1', lineageSidecar);
  const adoption = { schemaVersion: 1, partitionId: partition.partitionId, lineageId: partition.lineageId, snapshotId: f.snapshot.snapshotId, snapshotFingerprint: f.snapshot.normalizedFingerprint, configFingerprint, proposalFingerprint: fp(partition), observedDigest: fp(partition), fromRevision: 0, toRevision: 1, quiescenceProofs: [], actor: { hostReceiptRef: 'qa-synthetic-non-authorizing-intent' }, inventory: [], explicit: true };
  f.body.adoptionIntent = { kind: 'pre-drain-non-authorizing-v1', document: bd('l8-partition-adoption-v1', adoption) };
  return f;
}
