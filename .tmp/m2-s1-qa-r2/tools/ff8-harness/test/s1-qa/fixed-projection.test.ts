import { test, expect } from 'bun:test';
import { projectGraphSnapshotViewV1 } from '../../src/graph-b-projection';
import { manualSnapshot, rehashSnapshot, H } from './fixtures/manual-base';

test('L5.fixed.snapshot explicit manual view and nonmutation', () => {
  const s = manualSnapshot(), before = JSON.stringify(s);
  const result = projectGraphSnapshotViewV1(s);
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(result.reasons.join(';'));
  expect(result.value).toEqual({ schemaVersion: 1, snapshotId: 'qa-snapshot', normalizedFingerprint: s.normalizedFingerprint,
    nodes: [{ id: H + ':0x2', moduleSha256: H, rva: '0x2', name: 'qa_function', observedDescription: 'Aé😀', semanticMaturity: 'none', functionClass: 'incomplete' }],
    edges: [], objects: [], unresolved: [], capabilities: [] });
  expect(JSON.stringify(s)).toBe(before);
  expect(Object.isFrozen(result.value.nodes[0])).toBe(true);
  s.nodes[0]!.name = 'mutated';
  expect(result.value.nodes[0]!.name).toBe('qa_function');
});
for (const fault of ['duplicate-id', 'wrong-count', 'unknown-node-field'] as const) test(`L5.fixed.refreshed.${fault}`, () => {
  const s = manualSnapshot();
  if (fault === 'duplicate-id') { s.nodes.push(structuredClone(s.nodes[0]!)); s.scope.functionCount = 2; }
  if (fault === 'wrong-count') s.scope.functionCount = 2;
  if (fault === 'unknown-node-field') Object.assign(s.nodes[0]!, { unexpected: true });
  rehashSnapshot(s);
  const result = projectGraphSnapshotViewV1(s);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reasons.join(';')).not.toContain('snapshot fingerprint does not match');
});
