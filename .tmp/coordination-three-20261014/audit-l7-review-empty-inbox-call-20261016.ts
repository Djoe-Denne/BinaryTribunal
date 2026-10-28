import { writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const phase = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const sid = 'ses_ebb3cde8dffeG2EQhIteowOhWK';
const endpoint = await Service.discover(); assert(endpoint);
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await client.session.get({ sessionID: sid });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
const calls: unknown[] = [];
const scan = (x: any, path = '$', parent: any = null) => {
  if (!x || typeof x !== 'object') return;
  if (typeof x.input?.code === 'string' && x.input.code.includes('tools.team_results(')) {
    calls.push({ path, nodeKeys: Object.keys(x), parentKeys: parent && Object.keys(parent), publicNode: x });
  }
  for (const [key, value] of Object.entries(x)) if (value && typeof value === 'object') scan(value, path + '.' + key, x);
};
let cursor: string | undefined;
do {
  const page = await client.message.list({ sessionID: sid, ...(cursor ? { cursor } : { limit: 100, order: 'asc' }) });
  for (const message of page.data) if (message.type === 'assistant') scan(message.content);
  cursor = page.cursor.next ?? undefined;
} while (cursor);
const out = {
  at: new Date().toISOString(), session: sid, model: session.model,
  kind: 'public submitted tool input/output only; no model reasoning retained', calls,
  actualRoleReadHashAckAndReviewGoStillPending: true,
};
writeFileSync(phase + '/l7-namespace-review-inbox-public-call-audit-v2-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
