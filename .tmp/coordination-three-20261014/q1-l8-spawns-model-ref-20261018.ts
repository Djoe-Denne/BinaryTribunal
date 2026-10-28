import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const targets = [
  { member: 'l1-arbitration-r1', session: 'ses_eb1ef5546ffeye3txx4zNalV8v', expect: { providerID: 'opencode-go', id: 'glm-5.3-flash', variant: 'max' }, task: 'task_mvdjqmb1_0000_4j3t2i' },
  { member: 'v3-l8-parser-b-ratifier-r1', session: 'ses_eb1ef539dffe3PccXbFYey2SNj', expect: { providerID: 'cursor', id: 'grok-4.7', variant: 'Grok 4.7 Extra High' }, task: 'task_mvdjqmc4_0001_t0qmvt' },
];
const out = { at: new Date().toISOString(), spawns: [] };
for (const t of targets) {
  const s = await client.session.get({ sessionID: t.session });
  const ok = s.model.providerID === t.expect.providerID && s.model.id === t.expect.id && s.model.variant === t.expect.variant;
  out.spawns.push({ ...t, readbackModel: s.model, modelRefMatchesExpectation: ok, idHasNoVariantSuffix: !s.id.includes('#') });
}
out.allVerified = out.spawns.every((x) => x.modelRefMatchesExpectation);
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/q1-l8-spawns-model-ref-20261018.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ allVerified: out.allVerified, models: out.spawns.map((s) => s.readbackModel) }));
