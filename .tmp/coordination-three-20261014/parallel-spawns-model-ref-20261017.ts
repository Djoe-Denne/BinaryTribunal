import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const targets = [
  { member: 'v3-realnative-r1', session: 'ses_eb4fad214ffe64lZcjK8chA7uJ', expect: { providerID: 'cursor', id: 'grok-4.7', variant: 'Grok 4.7 Extra High' }, task: 'task_mvcpbp8w_0011_kkrlhn' },
  { member: 'l7-measures-driver-r1', session: 'ses_eb4f5b621ffed3M1LKI4531nLN', expect: { providerID: 'opencode-go', id: 'glm-5.3-flash', variant: 'max' }, task: 'task_mvcpivkv_0015_ajdsq7' },
];
const out = { at: new Date().toISOString(), spawns: [] };
for (const t of targets) {
  const s = await client.session.get({ sessionID: t.session });
  const ok = s.model.providerID === t.expect.providerID && s.model.id === t.expect.id && s.model.variant === t.expect.variant;
  out.spawns.push({ ...t, readbackModel: s.model, modelRefMatchesExpectation: ok, idHasNoVariantSuffix: !s.id.includes('#') });
}
out.allVerified = out.spawns.every((x) => x.modelRefMatchesExpectation);
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/parallel-spawns-model-ref-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ allVerified: out.allVerified, models: out.spawns.map((s) => s.readbackModel) }));
