import { join } from 'node:path';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const source = process.argv[2] ?? join(root, '.tmp/re-graph-scheduler/review-20261014/L4WITNESS/tools/ff8-harness');
const { clusterMultiview, defaultMultiviewConfig } = await import(join(source, 'src/semantic-index.ts'));
const { planAdoption } = await import(join(source, 'src/lineage.ts'));
const H = '1c8c2893ed9b6bb1f299e0f3878518fbe1df27db1df21c5043699d1728d385bb';
const g = { schemaVersion: 1, snapshotId: 'parent-adopt-recluster', normalizedFingerprint: 'cd'.repeat(32),
  objects: [], unresolved: [], capabilities: [], edges: [],
  nodes: Array.from({ length: 3 }, (_, i) => { const rva = '0x' + ((i + 1) * 0x100).toString(16).toUpperCase();
    return { id: H + ':' + rva, moduleSha256: H, rva, name: 'Fn' + (i + 1), observedDescription: '',
      semanticMaturity: 'reconciled', functionClass: 'internal' }; }) };
const config = defaultMultiviewConfig();
config.views = { structure: false, data: false, lexical: false, embeddings: false, validatedRelations: false, capabilities: false };
const first = clusterMultiview({ snapshot: g, config, encoder: null });
if (!first.proposalEvidence || !first.proposalReceipt) throw Error('No real local evaluated receipt');
const witness = { evidence: first.proposalEvidence, localReceipt: first.proposalReceipt };
const adopted = planAdoption({ partition: first.partition, lineageSidecar: first.lineageSidecar,
  proposalWitness: witness, explicit: true, units: [] });
for (const [name, previous] of [['original', first.partition], ['actual-adopted', adopted.partition]] as const) {
  const next = clusterMultiview({ snapshot: g, config, encoder: null, previous,
    previousLineageSidecar: first.lineageSidecar, previousProposalWitness: witness });
  console.log('PARENT_RECLUSTER', JSON.stringify({ name, firstPass: first.pass, actualAdoption: adopted.adopted,
    previousAdopted: previous.adopted, nextPass: next.pass, binding: next.lineageSidecar?.previousBinding,
    diagnostics: next.diagnostics.filter((x: any) => x.severity === 'fail') }));
}
