import { writeFileSync } from 'node:fs';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const endpoint = await Service.discover();
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = 'ses_eb5fd04e3ffegyogdNZMNdUhO3';
const expect = { providerID: 'cursor', id: 'grok-4.7', variant: 'Grok 4.7 Extra High' };
const s = await client.session.get({ sessionID: session });
const ok = s.model.providerID === expect.providerID && s.model.id === expect.id && s.model.variant === expect.variant;
const out = {
  at: new Date().toISOString(),
  member: 'v3-budget-correction-review-r1',
  session,
  readbackModel: s.model,
  modelRefMatchesExpectation: ok,
  idHasNoVariantSuffix: !s.id.includes('#'),
  packet: 'V3_BUDGET_CORRECTION_REVIEW_INPUTS_20261017 manifest b7b53a6814a77d1eb416bc83c98d7761017c7ffb8bb936201b330ac9832387b3 (9 inputs, 119348B)',
  phase: 'PHASE1_ACK_THEN_HOLD_PARENT_GO_SEPARATE',
};
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/budget-correction-review-spawn-model-ref-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ modelRefMatchesExpectation: ok, model: s.model }));
