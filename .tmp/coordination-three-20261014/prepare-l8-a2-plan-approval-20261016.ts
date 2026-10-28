import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L8_A2_PLAN_APPROVAL_INPUTS_20261016';
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
assert(!existsSync(sourceRoot));
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: 'ses_ec12fcc43ffeI6xXQ5rSTty2mV' });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
const own = session.location.directory.replaceAll('\\', '/');
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const taskId = 'task_mv6towrm_000c_24005n';
const task = team.tasks.find((t: any) => t.id === taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
const plan = readFileSync(own + '/.tmp/L8_A2_CORRECTIVE_20261016/PLAN.md');
assert.equal(plan.length, 32071);
assert.equal(sha(plan), '00fbd781e6018dd60ea12913145e1dbd9ea15132739aefa96f8cf2b6dd1b1b11');
const delivery = JSON.parse(readFileSync(phase + '/l8-full-final-parent-verification-20261016.json', 'utf8'));
for (const f of delivery.runtime) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
assert(!existsSync(own + '/tools/ff8-harness/test/graph-integration/body-pause-regressions.test.ts'));
const registryPath = own + '/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl';
const registry = readFileSync(registryPath);
const decision = readFileSync(root + '/docs/missions/re-graph-scheduler/L8_A2_CORRECTIVE_PLAN_APPROVAL_20261016.md');
const baseline = {
  taskId, session: session.id, model: session.model, own,
  runtime15: delivery.runtime.map(({ frozenPath: _p, ...f }: any) => f),
  planSha256: sha(plan), newTestAbsent: true,
  registryAppendOnly: { path: registryPath, bytes: registry.length, sha256: sha(registry) },
  stage: 'ACCESS_ONLY fullReadConditionsAck then distinct TEST_WRITE_RED_ONLY_GO; both sources readonly',
  archivedAbsolutePathsDoNotAuthorizeOldDbAccess: true,
};
const files = [
  { path: 'DECISION.md', bytes: decision, kind: 'rule' },
  { path: 'PLAN.md', bytes: plan, kind: 'knowledge' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(baseline, null, 2) + '\n'), kind: 'manifest' },
];
mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = {
  schemaVersion: 1, missionId: team.id, taskId, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: own + '/inputs/L8_A2_PLAN_APPROVAL_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })),
};
writeFileSync(phase + '/l8-a2-plan-approval-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = {
  at: new Date().toISOString(), taskId, session: session.id, model: session.model, own,
  destination: request.destinationRoot, files: 3, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: decision.length, decisionSha256: sha(decision), planSha256: sha(plan),
  registryBytes: registry.length, registrySha256: sha(registry),
  source15ExactNewTestAbsentBeforePermission: true,
  stage: 'ACCESS_ONLY actual fullReadAck before RED stage GO no code tests Sqlite yet',
};
writeFileSync(phase + '/l8-a2-plan-approval-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
