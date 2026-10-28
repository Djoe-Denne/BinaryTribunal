import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy-plan-approval-request-20261016.json', 'utf8'));
const prior = JSON.parse(readFileSync(phase + '/l7-copy-boundary-static-plan-final-go-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { id: 'gpt-6-astra', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), prior.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === q.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
assert.equal(team.members.find((m: any) => m.name === 'l7-copy-astra').sessionId, session.id);
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(JSON.parse(receipt.toString('utf8')).fingerprint, '3ccf257d231460c68dfe8c5f21457fc4b20a5256b79b9512ac53c30b60156696');
const baseline = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8'));
assert.equal(baseline.files.length, 369);
for (const f of baseline.files) assert.equal(sha(readFileSync(prior.own + '/' + f.path)), f.sha256);
assert.equal(sha(readFileSync(prior.proofDirectory + '/PLAN.md')), 'cd21bbe8682d3d1e5d1a97cc6401d85dfd5f2e7fbd3645b1b3317c564730d435');
const testPath = 'tools/ff8-harness/test/simulator/simulator-copy-boundary-regressions.test.ts';
assert(!existsSync(prior.own + '/' + testPath));
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own: prior.own,
  actualCompleteDecisionPlanBaseline369Entries3Pins109766BytesRoleConditionsAccessAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipGuardAndBaseline369ExactNewTestAbsentRechecked: true,
  stage: 'FINAL_NEW_TEST_WRITE_RED_ONLY_GO one new test then one baseline6d00 invocation120s',
  allowedNewTest: testPath, maxDeclaredCases: 80, maxUnitsPerFixture: 8,
  command: 'bun test --timeout 30000 test/simulator/simulator-copy-boundary-regressions.test.ts',
  source6d00Old131Readme33DtoAndAllOtherBaselineFilesReadonly: true,
  noTypecheckOldSuiteAnnexProbeSourceFixRerunSqliteFullOrNativeGo: true,
  independentSmallMemoryRunMayCoexistWithAuthorizedL8FocusedNoExclusiveHeavySlotClaim: true,
  qualifiedRedThenHoldForParentSeparateSourceWriteGoRequired: true };
writeFileSync(phase + '/l7-copy-red-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(prior.proofDirectory + '/PARENT_RED_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
