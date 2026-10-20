import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = 'ses_eb52dc4e6ffevB6tgCHf3P3ymI';
const expect = { providerID: 'opencode-go', id: 'glm-5.3-flash', variant: 'max' };
const s = await client.session.get({ sessionID: session });
const ok = s.model.providerID === expect.providerID && s.model.id === expect.id && s.model.variant === expect.variant;
const out = {
  at: new Date().toISOString(),
  member: 'v3-host-correction-r1',
  task: 'task_mvcnc4us_000j_8o9eem',
  session,
  readbackModel: s.model,
  modelRefMatchesExpectation: ok,
  idHasNoVariantSuffix: !s.id.includes('#'),
  packet: 'V3_HOST_CORRECTION_INPUTS_20261017 manifest 911ab9a5fcaed0854503f0ceb62df551bd3462fac1ce9d3b8d05fc8c4830da42 (11 inputs, 173920B incl. review verdict transcription as contract)',
  output: '.tmp/coordination-three-20261014/V3_HOST_CORRECTION_OUTPUT_20261017 (exactly WriterLedger.cs + DESIGN.md + Host.Tests.cs + MANIFEST.json)',
  phase: 'PHASE1_ACK_THEN_HOLD; PHASE2_WRITE_ON_GO',
};
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/host-correction-spawn-model-ref-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ modelRefMatchesExpectation: ok, model: s.model }));
