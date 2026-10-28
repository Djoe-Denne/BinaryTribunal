import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });

const targets = [
  { member: 'v3-composed-review-r1', session: 'ses_eb682d8f3ffesaTiSmKoI0A1Lh', expect: { providerID: 'cursor', id: 'claude-opus-5-5', variant: 'Claude Opus 5.5 Max' }, task: 'task_mvc43o9u_0009_ctebzb', complexity: 88, risk: 85, packet: 'V3_COMPOSED_REVIEW_INPUTS_20261017', manifestSha256: '72f31cd424060eacdcc3d843748cc6785b34a36d595213ade157eb5d45b5f9c1' },
  { member: 'l7-sparse-bench-review-r1', session: 'ses_eb682d700ffe1F3Ll62sPiCjaB', expect: { providerID: 'cursor', id: 'grok-4.7', variant: 'Grok 4.7 Extra High' }, task: 'board-binding-via-packet (claim guard refused auto-claim; parent assigns after ACK+report)', complexity: 70, risk: 65, packet: 'L7_SPARSE_BENCH_REVIEW_INPUTS_20261017', manifestSha256: '1a2cb5ec8f5e7fe9e8ff599e277198ae87d0d77f874e1e4a9a604c463752d2b4' },
];

const out = { at: new Date().toISOString(), spawns: [] };
for (const t of targets) {
  const s = await client.session.get({ sessionID: t.session });
  const ok = s.model.providerID === t.expect.providerID && s.model.id === t.expect.id && s.model.variant === t.expect.variant;
  out.spawns.push({ ...t, readbackModel: s.model, modelRefMatchesExpectation: ok, idHasNoVariantSuffix: !s.id.includes('#') });
}
out.allModelRefsVerified = out.spawns.every((s) => s.modelRefMatchesExpectation);
writeFileSync(root + '/.tmp/coordination-three-20261014/review-spawns-model-ref-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ allModelRefsVerified: out.allModelRefsVerified, models: out.spawns.map((s) => s.readbackModel) }));
