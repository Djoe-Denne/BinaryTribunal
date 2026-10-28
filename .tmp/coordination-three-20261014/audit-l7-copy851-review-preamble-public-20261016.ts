import { readFileSync, writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy851-review-preparation-request-20261016.json', 'utf8'));
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
const publicTools: any[] = [], publicTexts: any[] = [];
const scan = (value: any, role: string, messageId: string) => {
  if (!value || typeof value !== 'object' || value.type === 'reasoning') return;
  if (value.name && value.state?.input) publicTools.push({ role, messageId, name: value.name, time: value.time,
    input: value.state.input, output: value.state.output, error: value.state.error, status: value.state.status });
  if (value.type === 'text' && typeof value.text === 'string' && role !== 'user') publicTexts.push({ role, messageId, text: value.text });
  for (const child of Object.values(value)) if (child && typeof child === 'object') scan(child, role, messageId);
};
let cursor: string | undefined, pages = 0;
do {
  assert(++pages <= 10);
  const page = await cli.message.list({ sessionID: session.id, ...(cursor ? { cursor } : { limit: 100, order: 'asc' }) });
  for (const m of page.data) scan(m.content, m.type, m.id);
  cursor = page.cursor.next ?? undefined;
} while (cursor);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId), task = team.tasks.find((t: any) => t.id === q.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model,
  publicToolInputsOutputsAndTextsOnlyNoPrivateReasoningReadOrCopied: true, publicTools, publicTexts,
  currentReadHash391AckNotYetApprovedBeforePreambleExposureQualification: true,
  stage: 'HOLD no STATIC_REVIEW_GO or dynamic permission; parent assesses actual indexed historical excerpts' };
writeFileSync(phase + '/l7-copy851-review-preamble-public-audit-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
const targeted = publicTools.filter(t => ['ctx_search', 'team_results', 'team_status', 'team_tasks_list', 'AGENT.md'].some(s => JSON.stringify(t.input).includes(s)));
console.log(JSON.stringify({ at: out.at, task: task.id, session: session.id, publicToolCount: publicTools.length,
  targetedInputs: targeted.map(t => ({ name: t.name, time: t.time, input: t.input, output: t.output, error: t.error })),
  toolTextExcerpts: publicTexts.filter(t => t.role !== 'assistant' && /L7|review|inbox|No unread/.test(t.text)).map(t => ({ role: t.role, text: t.text.slice(0,6000) })).slice(0,8) }));
