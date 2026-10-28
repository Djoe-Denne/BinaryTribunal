import { test, expect } from 'bun:test';
import { bindExecutionPreparationV1 as bind, parseExecutionEnvelopeV1 as parse, bindExecutionSourcesV1 as bindEnvelope,
  sealExecutionEnvelopeV1 as seal,
  exportExecutionEnvelopeV1 as exportEnvelope, makeGraphRunV3 as makeRun, parseGraphRunV3 as parseRun, exportGraphRunV3 as exportRun,
  inspectExecutionEnvelopeV1 as inspect } from '../../src/graph-execution-envelope';
import type { PlannerPolicy } from '../../src/planner';
import type { CodecResult } from '../../src/graph-execution-envelope';
import { manualPreparation, envelopeValue, descendant, refreshCurrent, bd, decode, signed } from './fixtures/manual-root';
import type { Manual, Data } from './fixtures/manual-root';
import { bytes, sha } from './oracle/wire';
import { retainedEmptySummands, manualB, manualDivergent, scienceEnvelope } from './fixtures/manual-context';
import { fixtureJson } from './oracle/wire';
import { expectedRun } from './oracle/cases';
function good<T>(r: CodecResult<T>): T { if (!r.ok) throw Error(r.reasons.join(';')); return r.value; }
const bindFixture = (f: Manual) => bind(f.body, f.independent, f.policy as PlannerPolicy);
function base(): Manual { const f = manualPreparation(); good(bindFixture(f)); return f; }

test('R1.nominal bootstrap independent sources alias labels and selected exact grants', () => {
  const f = manualPreparation(), before = JSON.stringify([f.body, f.independent, f.policy]);
  const got = good(bindFixture(f));
  expect(got.snapshot.snapshotId).toBe('snap:isolates');
  expect(got.projection.groups).toEqual([{ groupId: 'qa-group', partitionId: 'qa-partition', ownedFunctionIds: [f.node.id], contextFunctionIds: [] }]);
  expect(JSON.stringify([f.body, f.independent, f.policy])).toBe(before);
  expect(Object.isFrozen(got.body.admissionSource)).toBe(true);
  f.body.missionId = 'foreign'; expect(got.body.missionId).toBe('re-graph-scheduler-20261013');
});
test('W2.nominal exact origin bytes run and DATA-only authority', () => {
  const f = base(), e = envelopeValue(f), original = bytes(JSON.stringify(e, null, 1) + '\n');
  const origin = good(parse(original)); good(bindEnvelope(origin, f.independent));
  const { fingerprint: ignored, ...unsealedBody } = e;
  expect<unknown>(good(seal(unsealedBody)).envelope).toEqual(e);
  expect(origin.generationId).toBe('l8gen:' + e.fingerprint);
  expect(good(exportEnvelope(origin))).toEqual(original);
  original.fill(0); expect(good(exportEnvelope(origin))).toEqual(bytes(JSON.stringify(e, null, 1) + '\n'));
  const run = good(makeRun(origin));
  expect<unknown>(run).toEqual(expectedRun(f, JSON.stringify(e, null, 1) + '\n'));
  const runBytes = good(exportRun(run)), reparsed = good(parseRun(runBytes));
  expect(good(exportRun(reparsed))).toEqual(runBytes);
  expect(reparsed.run.generationId).toBe(origin.generationId);
  expect(reparsed.run.derivedSpec.snapshotId).toBe('snap:isolates');
  expect(reparsed.run.derivedSpec.partitionId).toBe('qa-partition');
  expect(reparsed.run.derivedSpec.planFingerprint).toBe(f.planning.plan.fingerprint);
  const inspection = inspect(good(exportEnvelope(origin)), f.independent);
  expect(inspection.shape).toBe(true); expect(inspection.coherent).toBe(true);
  expect(inspection.authorityVerified).toBe(false); expect(inspection.activationState).toBe('not-established');
});
test('R1.nominal descendant retains root bytes', () => { const f = base(); descendant(f); good(bindFixture(f)); });
// GO54 adjudication: retained source-summands require rawCount > canonicalCount
// and rawCount >= 1 (qualified sparse-graph-codecs:191–192). Preserve the old
// empty DATA as an explicit negative; the positive uses the fixed 3-to-2 witness.
test('N1.retained summands preserved without producer', () => {
  const { f } = manualDivergent('raw');
  const before = structuredClone({ body: f.body, independent: f.independent });
  const expected = [{ source: 0, target: 2, weight: 0.5 }, { source: 0, target: 2, weight: 0.5 }, { source: 2, target: 0, weight: 1 }];
  const source = decode(f.body.contextSources.partitionContext), originalGraph = decode(source.graph);
  expect(originalGraph.numericSource.arcs).toEqual(expected);
  const bound = good(bindFixture(f));
  const retainedSource = decode(bound.body.contextSources.partitionContext), retainedGraph = decode(retainedSource.graph);
  expect(retainedGraph.numericSource.arcs).toEqual(expected);
  expect(retainedGraph.numericSource.rawArcCount).toBe(3);
  expect(retainedGraph.arcs).toEqual([{ source: 0, target: 2, weight: 1 }, { source: 2, target: 0, weight: 1 }]);
  expect(retainedSource.graph).toEqual(source.graph);
  expect({ body: f.body, independent: f.independent }).toEqual(before);
});
test('N1.empty retained source-summands is explicitly outside qualified domain', () => {
  const f = base(); retainedEmptySummands(f);
  const before = structuredClone({ body: f.body, independent: f.independent });
  const result = bindFixture(f);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reasons.join(';')).toContain('cluster: source count');
  expect({ body: f.body, independent: f.independent }).toEqual(before);
});
for (const what of ['module', 'negative-weight', 'summary', 'missing-affinity', 'omission'] as const) test(`N1.${what}`, () => {
  const f = base(), source = decode(f.body.contextSources.partitionContext);
  if (what === 'module') source.producerModuleRef = f.body.contractPins.fullSnapshotModule;
  if (what === 'negative-weight') { const policy = decode(source.producerPolicy); policy.weights.direct = -1; source.producerPolicy = bd('l8-projection-policy-source-v1', policy); }
  if (what === 'summary') source.summary.canonicalArcCount = 1;
  f.body.contextSources.partitionContext = bd('l8-numeric-graph-source-v1', source);
  if (what === 'missing-affinity') f.body.contextSources.groupAdjacency = { kind: 'provided-affinity' };
  f.independent.contextSources = structuredClone(f.body.contextSources);
  if (what === 'omission') {
    const omissions = decode(f.body.groupSource.contextOmissions); omissions.byGroup[0].functionIds = [f.node.id];
    f.body.groupSource.contextOmissions = bd('l8-context-omissions-v1', omissions);
  }
  const got = bindFixture(f); expect(got.ok).toBe(false);
  if (!got.ok) expect(got.reasons.join(';')).toContain({ module: 'numeric producer module differs', 'negative-weight': 'negative projection weight', summary: 'numeric source summary mismatch', 'missing-affinity': 'closed object fields', omission: 'fixed group omitted context mismatch' }[what]);
});
test('R1.unselected acquired grants remain legal', () => {
  const f = base();
  f.planning.plan = signed({ ...f.planning.plan, selectedUnitIds: [], decisions: [{ ...f.planning.plan.decisions[0], action: 'defer' }] });
  f.planning.sidecar = signed({ ...f.planning.sidecar, planFingerprint: f.planning.plan.fingerprint, admissionBudget: { ...f.planning.sidecar.admissionBudget, selectedTotalAdmissionUtf8Bytes: 0 } });
  f.planning.binding = signed({ schemaVersion: 1, planFingerprint: f.planning.plan.fingerprint, sidecarFingerprint: f.planning.sidecar.fingerprint });
  good(bindEnvelope(good(parse(bytes(JSON.stringify(envelopeValue(f))))), f.independent));
});
for (const change of [-1, 0, 1]) test(`W1.multibyte.source.bytes.${change}`, () => {
  const f = base(), blob = f.independent.inputManifestSource.files[0]!.bytes;
  blob.ref.byteLength += change;
  const got = bindFixture(f);
  if (change === 0) good(got);
  else { expect(got.ok).toBe(false); if (!got.ok) expect(got.reasons.join(';')).toContain('raw byte content/hash mismatch'); }
});
for (const change of ['missing-A', 'root-cap-too-small'] as const) test(`R1.selected.${change}`, () => {
  const f = base(), root = decode(f.body.admissionSource.budgetLineage.rootLimits), grants = decode(root.rootSlotGrants);
  if (change === 'missing-A') grants.grants.shift();
  else { grants.grants[0].bodyCapUtf8Bytes = 99999; grants.grants[0].reservedDebitUtf8Bytes = 99999; }
  root.rootSlotGrants = bd('l8-root-slot-grants-v1', grants);
  const rootDoc = bd('l8-root-limits-v1', root);
  f.body.admissionSource.budgetLineage.rootLimits = rootDoc;
  f.independent.rootLimits = structuredClone(rootDoc) as typeof f.independent.rootLimits;
  f.body.preparationObservationT0.rootLimitsRef = rootDoc.ref;
  f.body.preparationObservationT0.rootSlotGrantsRef = root.rootSlotGrants.ref;
  const parsed = good(parse(bytes(JSON.stringify(envelopeValue(f)))));
  const got = bindEnvelope(parsed, f.independent);
  expect(got.ok).toBe(false); if (!got.ok) expect(got.reasons.join(';')).toContain('selected unit lacks exact root grant or raises acquired body cap');
});
test('R1.unknown grants parse inspectable never zero or authority', () => {
  const f = base(), root = decode(f.body.admissionSource.budgetLineage.rootLimits);
  root.rootSlotGrants = null;
  const rootDoc = bd('l8-root-limits-v1', root);
  f.body.admissionSource.budgetLineage.rootLimits = rootDoc;
  f.independent.rootLimits = structuredClone(rootDoc) as typeof f.independent.rootLimits;
  f.body.preparationObservationT0.rootLimitsRef = rootDoc.ref;
  f.body.preparationObservationT0.rootSlotGrantsRef = null;
  const encoded = bytes(JSON.stringify(envelopeValue(f)));
  good(parse(encoded));
  const got = inspect(encoded, f.independent);
  expect(got.shape).toBe(true); expect(got.coherent).toBe(false); expect(got.authorityVerified).toBe(false);
});
for (const [kind, dimension] of [['worker','slots'],['worker','cpu'],['worker','gpu'],['worker','budget'],['account','slots'],['account','budget']] as const) {
  for (const change of [-1, 1]) test(`R2.${kind}.${dimension}.${change < 0 ? 'decrease' : 'increase'}`, () => {
    const f = base(); descendant(f);
    const target = kind === 'worker' ? f.template.workers[0] : f.template.accounts[0];
    target[dimension] += change; refreshCurrent(f);
    const got = bindFixture(f);
    if (change < 0) good(got);
    else { expect(got.ok).toBe(false); if (!got.ok) expect(got.reasons.join(';')).toContain(`${kind} raises root ${dimension}`); }
  });
}
test('R2.available alone mutable', () => { const f = base(); descendant(f); f.template.workers[0].available = false; refreshCurrent(f); good(bindFixture(f)); });
for (const [name, mutate, reason] of [
  ['new worker', (f: Manual) => { f.template.workers[0].workerId = 'foreign'; }, 'worker changes root identity'],
  ['new tool', (f: Manual) => { f.template.workers[0].tools.push('foreign'); }, 'worker introduces tool'],
  ['new account', (f: Manual) => { f.template.accounts[0].accountId = 'foreign'; f.template.workers[0].accountId = 'foreign'; }, 'worker changes root identity'],
] as const) test(`R2.${name}`, () => {
  const f = base(); descendant(f); mutate(f); refreshCurrent(f);
  const got = bindFixture(f); expect(got.ok).toBe(false); if (!got.ok) expect(got.reasons.join(';')).toContain(reason);
});
for (const [name, change, reason] of [
  ['duplicate slot', (v: Data) => { v.grants.push(structuredClone(v.grants[0])); }, 'duplicate acquired root slot'],
  ['pass2', (v: Data) => { v.grants[0].slot.pass = 2; }, 'expected 1'],
  ['cap debit contradiction', (v: Data) => { v.grants[0].reservedDebitUtf8Bytes--; }, 'cap/debit mismatch'],
] as const) test(`R1.${name} refreshed byte hashes`, () => {
  const f = base(), root = decode(f.body.admissionSource.budgetLineage.rootLimits), grants = decode(root.rootSlotGrants);
  change(grants); root.rootSlotGrants = bd('l8-root-slot-grants-v1', grants);
  f.body.admissionSource.budgetLineage.rootLimits = bd('l8-root-limits-v1', root);
  const got = bindFixture(f); expect(got.ok).toBe(false); if (!got.ok) expect(got.reasons.join(';')).toContain(reason);
});
for (const which of ['snapshot', 'codec-missing', 'codec-extra', 'unknown-root', 'foreign-parent'] as const) test(`I1.${which}`, () => {
  const f = base();
  if (which === 'snapshot') {
    const d = f.independent.fullGraphSnapshot, utf8 = JSON.stringify(JSON.parse(d.utf8), null, 2);
    f.independent.fullGraphSnapshot = { ref: { ...d.ref, byteLength: bytes(utf8).length, sha256: sha(utf8) }, utf8 };
  }
  if (which === 'codec-missing') f.independent.codecBytes.pop();
  if (which === 'codec-extra') f.independent.codecBytes.push(structuredClone(f.independent.codecBytes[0]!));
  if (which === 'unknown-root') f.independent.rootLimits = null;
  if (which === 'foreign-parent') { descendant(f); f.body.generation.parentGenerationId = 'foreign'; f.body.preparationObservationT0.parentGenerationId = 'foreign'; }
  const got = bindFixture(f); expect(got.ok).toBe(false);
  if (!got.ok) expect(got.reasons.join(';')).toContain({ snapshot: 'independent fullGraphSnapshot', 'codec-missing': 'missing independently loaded codec', 'codec-extra': 'extra or duplicate independent codec', 'unknown-root': 'root limits independently unknown', 'foreign-parent': 'parent generation/lineage' }[which]);
});

function fullFixture(f: Manual) { return bindEnvelope(good(parse(bytes(JSON.stringify(envelopeValue(f))))), f.independent); }
function resignCurrentSide(f: Manual): void {
  f.planning.sidecar = signed(f.planning.sidecar);
  f.planning.binding = signed({ schemaVersion: 1, planFingerprint: f.planning.plan.fingerprint, sidecarFingerprint: f.planning.sidecar.fingerprint });
}
test('B.nominal complete proposal evidence and non-authorizing pre-drain intent', () => {
  const f = manualB(), before = JSON.stringify([f.body, f.independent, f.planning]);
  const bound = good(fullFixture(f));
  expect(bound.projection.regime).toBe('B'); expect(bound.projection.proposalAdmissible).toBe(true);
  const encoded = bytes(JSON.stringify(envelopeValue(f), null, 1) + '\n'), parsed = good(parse(encoded));
  expect(good(exportEnvelope(parsed))).toEqual(encoded);
  const run = good(makeRun(parsed)); expect<unknown>(run).toEqual(expectedRun(f, JSON.stringify(envelopeValue(f), null, 1) + '\n'));
  good(parseRun(good(exportRun(run))));
  const result = inspect(encoded, f.independent);
  expect(result.shape).toBe(true); expect(result.coherent).toBe(true); expect(result.proposalAdmissible).toBe(true);
  expect(result.authorityVerified).toBe(false); expect(result.activationState).toBe('not-established');
  expect(JSON.stringify([f.body, f.independent, f.planning])).toBe(before);
});
for (const fault of ['A-cast-as-B', 'foreign-adoption'] as const) test(`B.${fault}`, () => {
  const f = manualB(); good(fullFixture(f));
  if (fault === 'A-cast-as-B') {
    const transport = decode(f.body.preparedTransport); delete transport.proposalEvidence;
    f.body.preparedTransport = bd('l8-prepared-graph-v3', transport);
    const result = bindFixture(f); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(';')).toMatch(/B|evidence/);
  } else {
    const adoption = decode(f.body.adoptionIntent.document); adoption.partitionId = 'foreign';
    f.body.adoptionIntent.document = bd('l8-partition-adoption-v1', adoption);
    const result = bindFixture(f); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(';')).toContain('pre-drain adoption intent belongs to another candidate');
  }
});
test('A12.multifunction current cap exceeds smaller Cf without raising acquired grants', () => {
  const { f, sizes, ids } = manualDivergent('two-caps', { grantDelta: 0 }), u = f.planning.units[0]!, s = sizes[u.unitId]!;
  const ownBytes = bytes(fixtureJson(scienceEnvelope(f, u))).length;
  expect(s.actualS).toBe(ownBytes); expect(s.actualS - s.characterCount).toBe(3);
  expect(f.allocation.capsByFunction[ids[0]!].completeBodyMaxUtf8Bytes.value).toBe(ownBytes - 1);
  expect(f.allocation.capsByFunction[ids[1]!].completeBodyMaxUtf8Bytes.value).toBe(ownBytes + 1);
  expect(s.C).toBe(ownBytes + 1); expect(u.subIntents.length).toBe(6);
  good(fullFixture(f));
});
for (const offset of [-1, 0, 1] as const) test(`A12.actual-scientific-UTF8-length.${offset}`, () => {
  const { f } = manualDivergent('two-caps', { grantDelta: 0 }); good(fullFixture(f));
  const unitId = f.planning.units[0]!.unitId;
  f.planning.sidecar.admissionBudget.byUnit[unitId].structuralEnvelopeUtf8Bytes += offset;
  resignCurrentSide(f);
  const result = parse(bytes(JSON.stringify(envelopeValue(f))));
  if (offset === 0) good(result);
  else { expect(result.ok).toBe(false); if (!result.ok) expect(result.reasons.join(';')).toContain('S differs from actual immutable scientific envelope'); }
});
test('A12.UTF16 characters cannot substitute for scientific UTF8 bytes', () => {
  const { f, sizes } = manualDivergent('two-caps', { grantDelta: 0 }); good(fullFixture(f));
  const id = f.planning.units[0]!.unitId, s = sizes[id]!;
  expect(s.actualS - s.characterCount).toBe(3);
  f.planning.sidecar.admissionBudget.byUnit[id].structuralEnvelopeUtf8Bytes = s.characterCount; resignCurrentSide(f);
  const result = parse(bytes(JSON.stringify(envelopeValue(f))));
  expect(result.ok).toBe(false); if (!result.ok) expect(result.reasons.join(';')).toContain('S differs from actual immutable scientific envelope');
});
for (const offset of [-1, 0, 1] as const) test(`A12.acquired-cap-at-current-C.${offset}`, () => {
  good(fullFixture(manualDivergent('two-caps', { grantDelta: 0 }).f));
  const f = manualDivergent('two-caps', { grantDelta: offset }).f, result = fullFixture(f);
  if (offset >= 0) good(result);
  else { expect(result.ok).toBe(false); if (!result.ok) expect(result.reasons.join(';')).toContain('selected unit lacks exact root grant or raises acquired body cap'); }
});
for (const mode of ['raw', 'affinity'] as const) test(`A19.divergent-contexts.${mode}`, () => {
  const { f, expectedContexts, expectedOmissions, ids } = manualDivergent(mode), bound = good(fullFixture(f));
  expect(bound.projection.groups.map(g => g.contextFunctionIds)).toEqual(expectedContexts);
  expect(decode(f.body.groupSource.contextOmissions).byGroup.map((g: Data) => g.functionIds)).toEqual(expectedOmissions);
  expect<unknown>(f.partition.communities[0]!.externalContextIds).toEqual([ids[2]]);
  const source = decode(f.body.contextSources.partitionContext), graph = decode(source.graph);
  expect(graph.numericSource.arcs).toEqual([{ source: 0, target: 2, weight: 0.5 },{ source: 0, target: 2, weight: 0.5 },{ source: 2, target: 0, weight: 1 }]);
  expect(source.summary).toMatchObject({ canonicalArcCount: 2, sourceArcCount: 3, retainedSourceArcCount: 3, sourceArcBudget: 3 });
});
test('A19.raw group source cannot be silently replaced by affinity role', () => {
  const { f } = manualDivergent('raw'); good(fullFixture(f));
  f.body.contextSources.groupAdjacency = { kind: 'provided-affinity', source: f.body.contextSources.partitionContext };
  f.independent.contextSources = structuredClone(f.body.contextSources);
  const result = bindFixture(f); expect(result.ok).toBe(false); if (!result.ok) expect(result.reasons.join(';')).toContain('fixed group metric differs');
});
test('A19.omitted functions remain in complete source context', () => {
  const { f, ids } = manualDivergent('raw'); good(fullFixture(f));
  const full = decode(f.body.groupSource.fullContextByGroup);
  full.groups[0].functionIds = full.groups[0].functionIds.filter((id: string) => id !== ids[2]);
  full.groups[0].nodes = full.groups[0].nodes.filter((n: Data) => n.id !== ids[2]);
  f.body.groupSource.fullContextByGroup = bd('l8-full-context-by-group-v1', full);
  const result = bindFixture(f); expect(result.ok).toBe(false); if (!result.ok) expect(result.reasons.join(';')).toContain('full context cannot drop omitted/mandatory source functions');
});
for (const fault of ['observation', 'site-provenance'] as const) test(`L5.complete-relation.${fault}`, () => {
  const { f } = manualDivergent('raw'); good(fullFixture(f));
  const side = structuredClone(f.planning.sidecar), relation = side.relationView.relations[0];
  if (fault === 'observation') relation.observations[0].metadata.confidence = 'low';
  else relation.observations[0].sites[0].provenance.source = 'foreign-source';
  f.planning.sidecar = signed(side); resignCurrentSide(f);
  const result = fullFixture(f); expect(result.ok).toBe(false); if (!result.ok) expect(result.reasons.join(';')).toContain('planning relation view differs from full snapshot records/sites/observations');
});
