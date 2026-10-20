import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = 'ses_eb51f0a9dffebVeXh3kXVZzKgK';
const expect = { providerID: 'opencode-go', id: 'glm-5.3-flash', variant: 'max' };
const s = await client.session.get({ sessionID: session });
const ok = s.model.providerID === expect.providerID && s.model.id === expect.id && s.model.variant === expect.variant;
const out = {
  at: new Date().toISOString(),
  member: 'v3-host-correction-review-r1',
  session,
  readbackModel: s.model,
  modelRefMatchesExpectation: ok,
  idHasNoVariantSuffix: !s.id.includes('#'),
  packet: 'V3_HOST_CORRECTION_REVIEW_INPUTS_20261017 manifest 28ebadbad65beb0f12d25c6ae6171cd3a308e2a1cf47f09929ec83b92e93ece9 (13 inputs, 189151B)',
  phase: 'PHASE1_ACK_THEN_HOLD_PARENT_GO_SEPARATE',
};
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/host-correction-review-spawn-model-ref-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ modelRefMatchesExpectation: ok, model: s.model }));
