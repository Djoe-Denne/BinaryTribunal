import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L8_A2_TEST321_AMENDMENT_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const verified = JSON.parse(readFileSync(phase + '/l8-a2-typecheck-stop-final-parent-verification-20261016.json', 'utf8'));
const oldGo = JSON.parse(readFileSync(phase + '/l8-a2-tc107-actual-final-go-20261016.json', 'utf8'));
const post = JSON.parse(readFileSync(verified.run + '/post-typecheck-stop.json', 'utf8'));
const own = oldGo.own, testPath = 'tools/ff8-harness/test/graph-integration/body-pause-regressions.test.ts';
const old = readFileSync(own + '/' + testPath); assert.equal(sha(old), '7085767948db576bfecea0fec9c93ab37f32e7b803e656c5d5af639eab00a145');
const from = '      expect(["ACCEPTED", "TERMINAL"]).toContain(h.runtime.options.graph.admission(record.intent.executionId)?.state); expect(h.host.receipts.size).toBe(1);';
const to = '      const observedAdmission = h.runtime.options.graph.admission(record.intent.executionId);\n      if (!observedAdmission) throw new Error("linked acceptance must retain its durable admission");\n      expect(["ACCEPTED", "TERMINAL"]).toContain(observedAdmission.state); expect(h.host.receipts.size).toBe(1);';
assert.equal(old.toString('utf8').split(from).length, 2);
const expected = Buffer.from(old.toString('utf8').replace(from, to));
assert.notEqual(sha(expected), sha(old));
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: oldGo.session });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === oldGo.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
for (const f of post.postPins) assert.equal(sha(readFileSync(f.path)), f.sha256);
const baseline = { task: task.id, session: session.id, model: session.model, own,
  readonly853Before: post.postPins, runtime16Before: post.runtime16FrozenLivePins,
  allowedOneHunk: { path: testPath, beforeBytes: old.length, beforeSha256: sha(old), expectedBytes: expected.length, expectedSha256: sha(expected), from, to },
  originalFailedDelivery: verified.deliverySha256,
  exactlyTwoCurrentTestPinOccurrencesMayChangeHistoricalCopiesStay708: true,
  oneRegistryLiveRowPrefixMutableAfterTests850OtherRowsFullHashExact: true,
  priorTc107GateAndAEUnchanged: true, noWriteOrExecutionBeforeAckAndDistinctFinalGo: true };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L8_A2_TEST321_TYPING_AMENDMENT_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(baseline, null, 2) + '\n'), kind: 'manifest' },
  { path: 'EXPECTED_TEST.ts', bytes: expected, kind: 'test' },
  { path: 'PARENT_STOP_CHECK.json', bytes: readFileSync(phase + '/l8-a2-typecheck-stop-final-parent-verification-20261016.json'), kind: 'manifest' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: task.id, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: own + '/inputs/L8_A2_TEST321_AMENDMENT_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l8-a2-test321-amendment-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  destination: request.destinationRoot, files: 4, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes),
  expectedTestBytes: expected.length, expectedTestSha256: sha(expected), oldTest708AndRuntime16ExactBeforePermission: true,
  stage: 'ACCESS_ONLY fullReadHashRoleConditionsAck before separate EXACT_TEST_PATCH_THEN_TC107_GO no writeOrExecutionYet' };
writeFileSync(phase + '/l8-a2-test321-amendment-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
