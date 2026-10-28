import { test, expect, mock } from 'bun:test';
import { manualSnapshot } from './fixtures/manual-base';
import { manualPreparation, envelopeValue, decode } from './fixtures/manual-root';
import type { Manual } from './fixtures/manual-root';
import { manualB, manualDivergent } from './fixtures/manual-context';
import { manualKnowledge } from './fixtures/manual-knowledge';
import { requireOk, expectedRun } from './oracle/cases';
import type { PlannerPolicy } from '../../src/planner';
import { fixtureJson } from './oracle/wire';
// Import itself is forbidden: no producer-shaped values are returned by these guards.
const forbidden = ['planner', 'cluster', 'scc', 'investigation-groups', 'graph-execution-prepare', 'graph-store', 'store', 'client', 'lineage', 'semantic-index', 'eventlog', 'unit-lease'];
let forbiddenLoads = 0;
for (const name of forbidden) mock.module('../../src/' + name, () => { forbiddenLoads++; throw Error('forbidden pure-boundary import: ' + name); });
test('PURE.import and malformed codec/fixed-view calls under fail-closed guards', async () => {
  const api = await import('../../src/graph-execution-envelope');
  const projection = await import('../../src/graph-b-projection');
  expect(api.canonicalExecutionJsonV1({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  expect(api.parseExecutionEnvelopeV1(new TextEncoder().encode('{}')).ok).toBe(false);
  expect(api.parseGraphRunV3(new TextEncoder().encode('{}')).ok).toBe(false);
  expect(projection.projectGraphSnapshotViewV1(manualSnapshot()).ok).toBe(true);
  expect(forbiddenLoads).toBe(0);
});
test('PURE.complete nominal A B caps divergent contexts knowledge and all transport paths', async () => {
  const api = await import('../../src/graph-execution-envelope');
  const projections = await import('../../src/graph-b-projection');
  const fixtures: Array<[string, Manual]> = [
    ['A', manualPreparation()], ['B', manualB()], ['multi-cap', manualDivergent('two-caps', { grantDelta: 0 }).f],
    ['raw-context', manualDivergent('raw').f], ['affinity-context', manualDivergent('affinity').f],
    ['knowledge-level1', manualKnowledge(1).f], ['knowledge-level2', manualKnowledge(2).f], ['knowledge-parent-derived', manualKnowledge(2, false, true).f],
  ];
  for (const [name, f] of fixtures) {
    const before = JSON.stringify([f.body, f.independent, f.policy, f.planning, f.snapshot]);
    const raw = new TextEncoder().encode(JSON.stringify(envelopeValue(f), null, 1) + '\n');
    requireOk(api.bindExecutionPreparationV1(f.body, f.independent, f.policy as PlannerPolicy));
    const parsed = requireOk(api.parseExecutionEnvelopeV1(raw));
    const ownedEnvelope = envelopeValue(f), { fingerprint: ignored, ...ownedBody } = ownedEnvelope;
    const sealed = requireOk(api.sealExecutionEnvelopeV1(ownedBody));
    expect<unknown>(sealed.envelope).toEqual(ownedEnvelope);
    expect(requireOk(api.exportExecutionEnvelopeV1(sealed))).toEqual(new TextEncoder().encode(fixtureJson(ownedEnvelope)));
    requireOk(api.bindExecutionSourcesV1(parsed, f.independent));
    expect(requireOk(api.exportExecutionEnvelopeV1(parsed))).toEqual(raw);
    const run = requireOk(api.makeGraphRunV3(parsed)), runRaw = requireOk(api.exportGraphRunV3(run));
    expect<unknown>(run).toEqual(expectedRun(f, JSON.stringify(envelopeValue(f), null, 1) + '\n'));
    expect(requireOk(api.exportGraphRunV3(requireOk(api.parseGraphRunV3(runRaw))))).toEqual(runRaw);
    const inspection = api.inspectExecutionEnvelopeV1(raw, f.independent);
    expect(inspection.coherent).toBe(true); expect(inspection.authorityVerified).toBe(false);
    expect(inspection.activationState).toBe('not-established');
    if (name === 'B') expect(inspection.proposalAdmissible).toBe(true);
    const transport = decode(f.body.preparedTransport), g = f.body.groupSource;
    const grouping = { groupingConfig: decode(g.groupingConfig), groupingMetrics: decode(g.groupingMetrics), communityBinding: decode(g.communityBinding), fullContextByGroup: decode(g.fullContextByGroup), contextOmissions: decode(g.contextOmissions) };
    const directBefore = JSON.stringify([f.snapshot, transport, grouping, f.policy, f.context]);
    const projection = requireOk(projections.projectExecutionSourcesForL5V1(f.snapshot, transport, grouping, f.policy, f.context));
    const expectedGroups = transport.groups.map((group: { groupId: string; partitionId: string; ownedFunctionIds: string[]; contextFunctionIds: string[] }) => ({ groupId: group.groupId, partitionId: group.partitionId, ownedFunctionIds: group.ownedFunctionIds, contextFunctionIds: group.contextFunctionIds }));
    expect(projection.groups).toEqual(expectedGroups); expect(projection.graph.edges).toEqual(f.snapshot.edges);
    expect(projection.partitionId).toBe(f.partition.partitionId);
    if (name === 'B') expect(requireOk(projections.projectRegimeBForL5(f.snapshot, transport, grouping, f.policy, f.context)).groups).toEqual(expectedGroups);
    expect(JSON.stringify([f.snapshot, transport, grouping, f.policy, f.context])).toBe(directBefore);
    expect(JSON.stringify([f.body, f.independent, f.policy, f.planning, f.snapshot])).toBe(before);
  }
  expect(forbiddenLoads).toBe(0);
});
