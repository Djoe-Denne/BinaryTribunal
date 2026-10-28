import { readFileSync, writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-runtime16-review-schema2-preparation-request-20261016.json', 'utf8'));
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
const tools: any[] = [], texts: any[] = [], userProjection: any[] = [];
const scan = (value: any, role: string) => {
  if (!value || typeof value !== 'object' || value.type === 'reasoning') return;
  if (value.name && value.state?.input) tools.push({ role, name: value.name, time: value.time, input: value.state.input,
    output: value.state.output, error: value.state.error, status: value.state.status });
  if (value.type === 'text' && typeof value.text === 'string') {
    if (role === 'assistant') texts.push(value.text);
    else if (role === 'user') userProjection.push(value.text);
  }
  for (const child of Object.values(value)) if (child && typeof child === 'object') scan(child, role);
};
let cursor: string | undefined, pages = 0;
do {
  assert(++pages <= 10);
  const page = await cli.message.list({ sessionID: session.id, ...(cursor ? { cursor } : { limit: 100, order: 'asc' }) });
  for (const message of page.data) scan(message.content, message.type);
  cursor = page.cursor.next ?? undefined;
} while (cursor);
const inbox = tools.filter(t => JSON.stringify(t.input).includes('team_results'));
const currentProjected = userProjection.filter(t => t.includes('465pins9144956B') && t.includes('12af86e06f0a24f3'));
const out = { at: new Date().toISOString(), task: q.taskId, session: session.id, model: session.model,
  publicSubmittedInputsOutputsAndTextsOnlyNoReasoningCopied: true, publicTools: tools, publicTexts: texts,
  currentSchema2AccessMessagePresentInNativeUserProjection: currentProjected.length > 0,
  matchingCurrentProjectionCount: currentProjected.length,
  inboxToolPublicEvidence: inbox, initialPublicInboxDeviationRequiresQualificationNotSilentlyAuthorized: inbox.length > 0,
  actual465AccessAckStillNotApprovedByThisAudit: true, noReviewDynamicOrSourceWriteGo: true };
writeFileSync(phase + '/l8-runtime16-review-initial-public-audit-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, session: out.session, publicTools: tools.length, publicTexts: texts.length,
  currentSchema2AccessProjected: out.currentSchema2AccessMessagePresentInNativeUserProjection,
  inboxEvidence: inbox.map(t => ({ name: t.name, time: t.time, input: t.input, output: t.output, error: t.error, status: t.status })) }));
