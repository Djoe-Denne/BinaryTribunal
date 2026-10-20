import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = 'ses_eb65d2f1fffef6f6lFY3ag98gn';
const expect = { providerID: 'cursor', id: 'grok-4.7', variant: 'Grok 4.7 Extra High' };
const s = await client.session.get({ sessionID: session });
const ok = s.model.providerID === expect.providerID && s.model.id === expect.id && s.model.variant === expect.variant;
const out = {
  at: new Date().toISOString(),
  member: 'v3-g-corrections-r1',
  task: 'task_mvcbhxtk_003g_xtyje3',
  session,
  readbackModel: s.model,
  modelRefMatchesExpectation: ok,
  idHasNoVariantSuffix: !s.id.includes('#'),
  packet: 'V3_G_CORRECTIONS_R1_INPUTS_20261017 manifest 976158a7106748e4d62f4793095bbc16cf2a66183485eb5a0945b58fd412dcab (8 inputs, 159033B)',
  output: '.tmp/coordination-three-20261014/V3_G_CORRECTIONS_R1_OUTPUT_20261017 (exactly GuardianCore.Tests.cs + DESIGN.md + MANIFEST.json)',
  phase: 'PHASE1_ACK_THEN_HOLD_PARENT_GO_SEPARATE',
};
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/g-corrections-spawn-model-ref-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ modelRefMatchesExpectation: ok, model: s.model }));
