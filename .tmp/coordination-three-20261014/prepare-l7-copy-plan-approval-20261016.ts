import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const prior = JSON.parse(readFileSync(phase + '/l7-copy-boundary-static-plan-final-go-20261016.json', 'utf8'));
const sourceRoot = phase + '/L7_COPY_PLAN_APPROVAL_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: prior.session });
assert.deepEqual(session.model, { id: 'gpt-6-astra', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), prior.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === prior.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
const baselineBytes = readFileSync(prior.proofDirectory + '/PARENT_BASELINE.json');
assert.equal(sha(baselineBytes), prior.baselineSha256);
const baseline = JSON.parse(baselineBytes.toString('utf8'));
for (const f of baseline.files) assert.equal(sha(readFileSync(prior.own + '/' + f.path)), f.sha256);
const plan = readFileSync(prior.proofDirectory + '/PLAN.md'); assert.equal(plan.length, 22634);
assert.equal(sha(plan), 'cd21bbe8682d3d1e5d1a97cc6401d85dfd5f2e7fbd3645b1b3317c564730d435');
const testPath = 'tools/ff8-harness/test/simulator/simulator-copy-boundary-regressions.test.ts'; assert(!existsSync(prior.own + '/' + testPath));
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_PLAN_APPROVAL_20261016.md'), kind: 'rule' },
  { path: 'PLAN.md', bytes: plan, kind: 'knowledge' },
  { path: 'BASELINE.json', bytes: baselineBytes, kind: 'manifest' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: task.id, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: prior.own + '/inputs/L7_COPY_PLAN_APPROVAL_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l7-copy-plan-approval-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own: prior.own,
  destination: request.destinationRoot, files: 3, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes), planSha256: sha(plan),
  baseline369ExactNewTestAbsent: true,
  stage: 'ACCESS_ONLY fullReadHashConditionsAck before separate NEW_TEST_WRITE_RED_ONLY_GO no sourceWriteOrExecutionYet' };
writeFileSync(phase + '/l7-copy-plan-approval-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
