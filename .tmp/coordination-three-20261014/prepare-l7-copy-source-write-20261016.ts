import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L7_COPY_SOURCE_WRITE_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const verified = JSON.parse(readFileSync(phase + '/l7-copy-red-parent-verification-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: 'ses_ebaf6d8c9ffeEq9w6t6V1gxFrE' });
assert.deepEqual(session.model, { id: 'gpt-6-astra', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), verified.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === verified.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
const baseline = JSON.parse(readFileSync(verified.own + '/.tmp/L7_COPY_BOUNDARY_20261016/PARENT_BASELINE.json', 'utf8'));
for (const f of baseline.files) assert.equal(sha(readFileSync(verified.own + '/' + f.path)), f.sha256);
const test = readFileSync(verified.own + '/' + verified.testPath); assert.equal(sha(test), verified.testSha256);
const artifacts = JSON.parse(readFileSync(verified.run + '/ARTIFACTS.json', 'utf8'));
const state = { task: task.id, session: session.id, model: session.model, own: verified.own,
  baseline369: baseline.files, newTest: { path: verified.testPath, bytes: test.length, sha256: sha(test), mustStayExact: true },
  red10: artifacts.files.map((f: any) => ({ ...f, path: verified.run + '/' + f.path })),
  redArtifacts: { path: verified.run + '/ARTIFACTS.json', sha256: verified.artifactsSha256 },
  allowedSource: 'tools/ff8-harness/src/simulator.ts', planSha256: 'cd21bbe8682d3d1e5d1a97cc6401d85dfd5f2e7fbd3645b1b3317c564730d435',
  sourceOnlyPermissionStillPendingActualAckThenDistinctFinalGo: true, noProductModuleProbeTypecheckTestSqliteFullOrIntegrationGo: true };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_SOURCE_WRITE_GATE_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(state, null, 2) + '\n'), kind: 'manifest' },
  { path: 'RED_PARENT.json', bytes: readFileSync(phase + '/l7-copy-red-parent-verification-20261016.json'), kind: 'manifest' },
  { path: 'BASELINE_TEST.ts', bytes: test, kind: 'test' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: task.id, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: verified.own + '/inputs/L7_COPY_SOURCE_WRITE_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l7-copy-source-write-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own: verified.own,
  destination: request.destinationRoot, files: 4, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes),
  redQualified369BaselineSource6d00And64TestCb111StillExact: true,
  baselineTestFullCopyFrozenByParentAfterRedBeforeSourcePhase: true,
  stage: 'ACCESS_ONLY fullRead4HashRoleConditionsAck then separate FINAL_SOURCE_ONLY_GO no write or execution yet' };
writeFileSync(phase + '/l7-copy-source-write-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
