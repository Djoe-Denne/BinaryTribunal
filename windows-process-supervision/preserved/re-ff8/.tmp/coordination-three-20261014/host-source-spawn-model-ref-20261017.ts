import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = 'ses_eb5e4ad26ffemZg0CkXzfsY2jM';
const expect = { providerID: 'cursor', id: 'claude-opus-5-5', variant: 'Claude Opus 5.5 Max' };
const s = await client.session.get({ sessionID: session });
const ok = s.model.providerID === expect.providerID && s.model.id === expect.id && s.model.variant === expect.variant;
const out = {
  at: new Date().toISOString(),
  member: 'v3-host-source-r1',
  task: 'task_mvcg77nv_004e_tm6rai',
  session,
  readbackModel: s.model,
  modelRefMatchesExpectation: ok,
  idHasNoVariantSuffix: !s.id.includes('#'),
  packet: 'V3_HOST_SOURCE_INPUTS_20261017 manifest 1b1d17b850f02817106328d9b832243e2b448ae9e058f52617f17f91661fc302 (10 inputs, 199151B)',
  output: '.tmp/coordination-three-20261014/V3_HOST_SOURCE_OUTPUT_20261017',
  phase: 'PHASE1_ACK_THEN_HOLD; PHASE2=PLAN_ONLY_ON_GO; PHASE3=WRITE_ON_PLAN_GO',
};
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/host-source-spawn-model-ref-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ modelRefMatchesExpectation: ok, model: s.model }));
