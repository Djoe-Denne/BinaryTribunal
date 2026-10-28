import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = root + '/.tmp/coordination-three-20261014';
const request = JSON.parse(readFileSync(phase + '/l8-a2-plan-approval-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: request.targetSessionId });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
const own = session.location.directory.replaceAll('\\', '/');
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === request.missionId);
const task = team.tasks.find((t: any) => t.id === request.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
const baseline = JSON.parse(readFileSync(request.destinationRoot + '/BASELINE.json', 'utf8'));
for (const f of request.files) assert.equal(sha(readFileSync(request.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(request.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), '62361ff0f4b58564967a243f387704dbb7d7071b7e28ab0957964d13f1e90e10');
for (const f of baseline.runtime15) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
const newTest = 'tools/ff8-harness/test/graph-integration/body-pause-regressions.test.ts';
assert(!existsSync(own + '/' + newTest));
const registry = readFileSync(baseline.registryAppendOnly.path);
assert.equal(registry.length, 123186);
assert.equal(sha(registry), '0227c81f58cb7082e4a96126d8fc5b393a019fd3f8c7802042642cf4c137a43e');
writeFileSync(phase + '/l8-a2-red-registry-parent-prefix-20261016.jsonl', registry, { flag: 'wx' });
const out = {
  at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  actual99Line6799ByteDecisionPlan463LinesAndBaselineAll3Pins42473BytesConditionsReadAckApproved: true,
  receiptFileSha256: sha(receipt), runtime15ExactNewTestAbsentBeforePermission: true,
  registryPrefixBytes: registry.length, registryPrefixSha256: sha(registry),
  stage: 'FINAL_TEST_WRITE_RED_ONLY_GO new one test file and one initial bounded RED against unchanged15baseline',
  allowedWrite: newTest, command: 'bun test --timeout 30000 test/graph-integration/body-pause-regressions.test.ts',
  globalSeconds: 180, freshOwnPublicApiSqliteFixturesOnlyAndImmutablePrefixAppendRegistry: true,
  originalRedBadAndGoodFixtureDbRetainedButScratchCopyReopenStillNotAuthorized: true,
  clientAndGraphEngineSourceAnd60OldTestsReadonly: true,
  noTypecheckFocused60FullIntegrationOrNativeAuthority: true,
};
writeFileSync(phase + '/l8-a2-red-stage-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
