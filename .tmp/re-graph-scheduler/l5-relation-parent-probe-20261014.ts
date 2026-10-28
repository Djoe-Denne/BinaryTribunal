import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const source = process.argv[2] ?? join(root, '.tmp/re-graph-scheduler/review-20261014/L5REL/tools/ff8-harness');
const { buildGraphSnapshot } = await import(join(source, 'src/graph-normalize.ts'));
const { assertSnapshotContract, fingerprintWithout } = await import(join(source, 'src/graph.ts'));
const { hash } = await import(join(source, 'src/validation.ts'));
const { planMission, evaluateReadiness, receiptSatisfies } = await import(join(source, 'src/planner.ts'));
const fixture = JSON.parse(readFileSync(join(root, 'tools/ff8-harness/test/fixtures/graph/ff8-chunks-tails/content.json'), 'utf8'));
const edge = structuredClone(fixture.edges[0]);
const template = edge.sites[0];
edge.sites = Array.from({ length: 65 }, (_, i) => {
  const rva = '0x' + (i < 32 ? 0xC000 + i : 0xC200 + i - 32).toString(16).toUpperCase();
  return { ...structuredClone(template), siteRva: rva, provenance: { ...template.provenance, siteRva: rva } };
});
const g = JSON.parse(JSON.stringify(buildGraphSnapshot({
  missionId: fixture.missionId, snapshotId: fixture.snapshotId, artifacts: fixture.binaryArtifacts,
  scopeDescription: fixture.scope.description, nodes: fixture.nodes, edges: [edge],
  objects: fixture.objects, unresolved: fixture.unresolved,
  capabilities: fixture.capabilities, coverage: fixture.coverage,
  knowledgeRevision: fixture.knowledgeRevision, configFingerprint: fixture.configFingerprint,
  toolVersions: fixture.toolVersions,
}).snapshot));
assertSnapshotContract(g);
const A = edge.sourceId, B = edge.destinationId;
const req = { functionId: B, moduleSha256: B.slice(0, B.lastIndexOf(':')),
  artifactId: 'parent-external-artifact', artifactSha256: hash('external-artifact-bytes'),
  artifactKind: 'reconciled_c', minimumRevision: g.knowledgeRevision,
  maximumRevision: g.knowledgeRevision + 10, publicationLevel: 1, validation: 'fixture-only' };
const { minimumRevision, maximumRevision, ...artifact } = req;
const external = { ...artifact, knowledgeRevision: minimumRevision, producerUnitId: null,
  commitId: hash('distinct-external-commit'), readbackStatus: 'verified', futurePrerequisiteEffect: 'satisfies' };
const policy = { version: 'parent-probe-v1', estimationVersion: 'parent-estimates-v1', partitionId: 'parent-partition',
  investigationKind: 'decompilation', artifactKind: 'reconciled_c', publicationLevel: 1,
  contextEnvelopeMaxUtf8Bytes: 100_000_000, totalContextBudgetUtf8Bytes: 1_000_000_000,
  maxSelectedUnits: 100, sccMaxFunctions: 100, sccMaxIterations: 2, sccCostBudget: 100_000,
  requirementsByFunction: { [B]: req },
  estimatesByFunction: Object.fromEntries(g.nodes.map((n: any) => [n.id, { version: 'parent-estimates-v1', A: 1, B: 1, R: 1, validation: 1 }])),
  resourcesByFunction: {},
  edgeKinds: Object.fromEntries(g.edges.map((e: any) => [e.id, 'external_satisfied'])),
  externalReceiptsByEdge: Object.fromEntries(g.edges.map((e: any) => [e.id, external])),
};
function ready(r: any, u: any, receipts: any[] = []) {
  return evaluateReadiness({ plan: r.plan, sidecar: r.sidecar, expectedSidecarFingerprint: r.binding.sidecarFingerprint,
    unit: u, receipts, snapshotFingerprint: r.sidecar.snapshotFingerprint,
    knowledgeRevision: r.plan.knowledgeRevision, validContext: true, cancelled: false });
}
for (const selected of [[A], [A, B]]) {
  const groups = selected.map(id => ({ groupId: 'group:' + id, partitionId: policy.partitionId, ownedFunctionIds: [id], contextFunctionIds: [] }));
  const r = planMission(g, groups, policy), a = r.units.find((u: any) => u.ownedFunctionIds.includes(A));
  const b = r.units.find((u: any) => u.ownedFunctionIds.includes(B));
  const local = { ...external, producerUnitId: b?.unitId ?? null, knowledgeRevision: minimumRevision + 1, commitId: hash('distinct-local-commit') };
  console.log('PARENT_EXTERNAL', JSON.stringify({ selected: selected.length, shards: g.edges.map((e: any) => e.sites.length),
    prerequisite: a.prerequisites[0], externalProducer: external.producerUnitId,
    ready: ready(r, a), readyAfterLocal: ready(r, a, [local]), localMatches: b ? receiptSatisfies(req, local, b.unitId) : null }));
}
const dictionaryGraph = structuredClone(g);
dictionaryGraph.edges = [structuredClone(g.edges[0])];
dictionaryGraph.edges[0].id = 'constructor';
dictionaryGraph.normalizedFingerprint = fingerprintWithout(dictionaryGraph, 'normalizedFingerprint');
assertSnapshotContract(dictionaryGraph);
const neutral = { ...policy }; delete neutral.edgeKinds; delete neutral.externalReceiptsByEdge;
const groups = [A, B].map(id => ({ groupId: 'group:' + id, partitionId: policy.partitionId, ownedFunctionIds: [id], contextFunctionIds: [] }));
for (const edgeKinds of [undefined, {}, { constructor: 'obligatory' }]) {
  try { planMission(dictionaryGraph, groups, { ...neutral, edgeKinds }); console.log('PARENT_DICTIONARY', JSON.stringify({ edgeKinds: edgeKinds ?? 'absent', accepted: true })); }
  catch (e) { console.log('PARENT_DICTIONARY', JSON.stringify({ edgeKinds: edgeKinds ?? 'absent', accepted: false, error: String(e) })); }
}
