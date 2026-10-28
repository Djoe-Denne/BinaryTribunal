import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy-source-write-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { id: 'gpt-6-astra', providerID: 'openai', variant: 'max' });
const own = session.location.directory.replaceAll('\\', '/');
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === q.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
assert.equal(team.members.find((m: any) => m.name === 'l7-copy-astra').sessionId, session.id);
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), '4b6db630cedabf890082886bc7fc877b28dd645225f5c1fcd09e55cb7f22f798');
const baseline = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8')); assert.equal(baseline.own, own);
assert.equal(baseline.baseline369.length, 369);
for (const f of baseline.baseline369) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
const test = readFileSync(own + '/' + baseline.newTest.path);
assert.equal(sha(test), 'cb111c86b1fc047915036746b053174a2a55bff2efe45424cb4b93884352d099');
assert(test.equals(readFileSync(q.destinationRoot + '/BASELINE_TEST.ts')));
for (const f of baseline.red10) assert.equal(sha(readFileSync(f.path)), f.sha256);
assert.equal(sha(readFileSync(baseline.redArtifacts.path)), baseline.redArtifacts.sha256);
assert.equal(sha(readFileSync(own + '/.tmp/L7_COPY_BOUNDARY_20261016/PLAN.md')), baseline.planSha256);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  actual4Entries118325BytesDecisionBaselineRedParentFullTestHashRoleConditionsReadAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipGuard369BaselineSource6d00TestCb111Red10PlanCd21ExactBeforeWrite: true,
  stage: 'FINAL_SOURCE_ONLY_GO simulator.ts per ratifiedPlan then staticDeliveryHoldForParentDiffGate',
  allowedSource: baseline.allowedSource, readonlyOther368BaselineAndNew64TestOld131SevenFilesReadmeHelpersAnd33Dto: true,
  noProductModuleLoadProbeTypecheckTests195SqliteFullGitIntegrationOrNativeGo: true,
  beforeAfterDiffDeltaPinsAnd33DtoStaticChecksRequiredNoOpportunisticEventModelRewrite: true,
  L8CCopyGateIndependentNoL8RightsInferred: true };
writeFileSync(phase + '/l7-copy-source-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(own + '/.tmp/L7_COPY_BOUNDARY_20261016/PARENT_SOURCE_WRITE_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
