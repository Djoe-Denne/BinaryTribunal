import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L8_A2_TWO_SOURCE_WRITE_INPUTS_20261016';
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex'); assert(!existsSync(sourceRoot));
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: 'ses_ec12fcc43ffeI6xXQ5rSTty2mV' });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
const own = session.location.directory.replaceAll('\\', '/');
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === 'task_mv6towrm_000c_24005n');
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
const red = JSON.parse(readFileSync(phase + '/l8-a2-red-final-parent-verification-20261016.json', 'utf8'));
assert.equal(red.retainedDbs, 47); assert(red.baselineRuntime15BothSourcesAnd60OldStillExact);
const delivery = JSON.parse(readFileSync(phase + '/l8-full-final-parent-verification-20261016.json', 'utf8'));
for (const f of delivery.runtime) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
const testPath = 'tools/ff8-harness/test/graph-integration/body-pause-regressions.test.ts';
const test = readFileSync(own + '/' + testPath); assert.equal(sha(test), red.newTestSha256);
const registryPath = own + '/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl', registry = readFileSync(registryPath);
assert(registry.equals(readFileSync(red.run + '/registry.after.jsonl')));
const baseline = { task: task.id, session: session.id, model: session.model, own,
  runtime15: delivery.runtime.map(({ frozenPath: _f, ...f }: any) => f),
  newTest: { path: testPath, bytes: test.length, sha256: sha(test), mustStayExact: true },
  allowedSources: ['tools/ff8-harness/src/client.ts', 'tools/ff8-harness/src/graph-engine.ts'],
  registry: { path: registryPath, bytes: registry.length, sha256: sha(registry), noAppendInWriteOnlyStage: true },
  inheritedPlanAndApprovalRemainInForce: true, noExecutionOrSourcePermissionBeforeActualAckThenSeparateGo: true };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L8_A2_TWO_SOURCE_WRITE_GATE_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(baseline, null, 2) + '\n'), kind: 'manifest' },
  { path: 'RED_PARENT.json', bytes: readFileSync(phase + '/l8-a2-red-final-parent-verification-20261016.json'), kind: 'manifest' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: task.id, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: own + '/inputs/L8_A2_TWO_SOURCE_WRITE_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l8-a2-source-write-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  destination: request.destinationRoot, files: 3, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes),
  runtime15AndNewTestStillExact: true, registryBytes: registry.length, registrySha256: sha(registry),
  stage: 'ACCESS_ONLY actualAck before separate twoSourceWriteOnlyGo; no code or execution yet' };
writeFileSync(phase + '/l8-a2-source-write-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
