import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = 'ses_eb614ea7effeMhQxgmc33frHi4';
const expect = { providerID: 'cursor', id: 'grok-4.7', variant: 'Grok 4.7 Extra High' };
const s = await client.session.get({ sessionID: session });
const ok = s.model.providerID === expect.providerID && s.model.id === expect.id && s.model.variant === expect.variant;
const out = {
  at: new Date().toISOString(),
  member: 'v3-budget-runtime-correction-r1',
  task: 'task_mvcebg9b_003z_ln1wqt',
  session,
  readbackModel: s.model,
  modelRefMatchesExpectation: ok,
  idHasNoVariantSuffix: !s.id.includes('#'),
  packet: 'V3_BUDGET_RUNTIME_CORRECTION_INPUTS_20261017 manifest 17efc11290fad752a8744594836c6f6dd9973ee5a99054bb1ac34e57968bd53e (8 inputs, 77657B incl. the runtime finding receipt)',
  output: '.tmp/coordination-three-20261014/V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017',
  phase: 'PHASE1_ACK_THEN_HOLD_PARENT_GO_SEPARATE',
};
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/budget-runtime-correction-spawn-model-ref-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ modelRefMatchesExpectation: ok, model: s.model }));
