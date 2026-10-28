import { readFileSync, writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const phase = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const sid = 'ses_ebb3cde8dffeG2EQhIteowOhWK';
const q = JSON.parse(readFileSync(phase + '/l7-namespace-review-preparation-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await client.session.get({ sessionID: sid });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
assert.equal(team.tasks.find((t: any) => t.id === q.taskId).status, 'completed');
const publicTools: unknown[] = [], publicTexts: string[] = [];
const scan = (x: any) => {
  if (!x || typeof x !== 'object') return;
  if (x.name && x.state?.input) publicTools.push({ name: x.name, time: x.time, state: x.state });
  if (x.type === 'text' && typeof x.text === 'string') publicTexts.push(x.text);
  if (x.type === 'reasoning') return;
  for (const value of Object.values(x)) if (value && typeof value === 'object') scan(value);
};
let cursor: string | undefined;
do {
  const page = await client.message.list({ sessionID: sid, ...(cursor ? { cursor } : { limit: 100, order: 'asc' }) });
  for (const m of page.data) if (m.type === 'assistant') scan(m.content);
  cursor = page.cursor.next ?? undefined;
} while (cursor);
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const out = {
  at: new Date().toISOString(), task: q.taskId, session: sid, model: session.model,
  completedNeverReopen: true, onlyPublicTextAndSubmittedToolInputOutputNoReasoning: true,
  publicTools, publicTexts, all386PackagePinsStillExact: true,
  reportedVerdict: 'BLOCK scoped P1 validation before destructive clone loses prerequisite identity',
  parentReproductionPending: true, noCorrectionOrIntegrationGo: true,
};
writeFileSync(phase + '/l7-namespace-review-completed-public-archive-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, publicTools: publicTools.length, publicTexts: publicTexts.length }));
