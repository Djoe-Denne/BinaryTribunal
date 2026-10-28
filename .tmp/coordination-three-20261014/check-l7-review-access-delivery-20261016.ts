import { writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const phase = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const sid = 'ses_ebb3cde8dffeG2EQhIteowOhWK';
const endpoint = await Service.discover(); assert(endpoint);
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const member = team.members.find((m: any) => m.name === 'l7-namespace-review');
assert.equal(member.sessionId, sid);
const userScopeMessages: unknown[] = [], publicTools: unknown[] = [];
const walk = (x: any, callback: (x: any) => void) => {
  if (!x || typeof x !== 'object') return;
  callback(x);
  for (const value of Object.values(x)) if (value && typeof value === 'object') walk(value, callback);
};
let cursor: string | undefined;
do {
  const page = await client.message.list({ sessionID: sid, ...(cursor ? { cursor } : { limit: 100, order: 'asc' }) });
  for (const m of page.data) {
    if (m.type === 'user') walk(m.content, x => {
      if (x.type === 'text' && typeof x.text === 'string' && x.text.includes('GO ACCÈS SEUL'))
        userScopeMessages.push({ messageId: m.id, time: m.time, text: x.text });
    });
    if (m.type === 'assistant') walk(m.content, x => {
      if (x.type === 'tool-call' || (x.name && x.state?.input)) publicTools.push({
        name: x.name, time: x.time, status: x.state?.status,
        publicInputPreview: JSON.stringify(x.state?.input ?? {}).slice(0, 180),
      });
    });
  }
  cursor = page.cursor.next ?? undefined;
} while (cursor);
const out = {
  at: new Date().toISOString(), session: sid,
  member: { status: member.status, executionStatus: member.executionStatus, keys: Object.keys(member) },
  userScopeMessages, latestPublicToolMetadataOnly: publicTools.slice(-6),
  noReasoningRetainedNoWakeOrMutationPerformed: true,
};
writeFileSync(phase + '/l7-review-access-delivery-native-observation-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, userScopeMessages: userScopeMessages.length }));
