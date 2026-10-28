import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-namespace-review-preparation-request-20261016.json', 'utf8'));
const admission = JSON.parse(readFileSync(phase + '/l7-namespace-review-native-admission-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
const lead = await cli.session.get({ sessionID: 'ses_eca40a8e2ffeanEKTBLiGjDNw8' });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
assert.deepEqual(lead.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'xhigh' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === q.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-namespace-review');
assert.equal(team.members.find((m: any) => m.name === 'l7-namespace-review').sessionId, session.id);
assert.equal(team.leadSessionId, lead.id);
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const p of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + p.path)), p.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), 'f9bdc03dbd367e06cd124c1a9858b28970407edf1f61a0e5a40f4cb44b516df3');
assert.equal(sha(readFileSync(admission.proofDirectory + '/NATIVE_ADMISSION.json')), '25fe37ec7d1ce0af39a6e246e3671da2cd4da1ed986090b7c0041d4503791292');
const audit = JSON.parse(readFileSync(phase + '/l7-namespace-review-inbox-public-call-audit-v2-20261016.json', 'utf8'));
assert.equal(audit.calls.length, 1);
assert(audit.calls[0].publicNode.content[0].text.includes('"No unread messages."'));
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = {
  at: new Date().toISOString(), task: q.taskId, session: session.id, model: session.model,
  parentModel: lead.model, destination: q.destinationRoot, proofDirectory: admission.proofDirectory,
  actualCompleteFiveParentDocs386UniquePins8295717BytesRoleEffectiveAccessAckApproved: true,
  receiptFileSha256: sha(receipt), nativeTaskOwnershipModelsGuardAndMain275Rechecked: true,
  priorEmptyInboxCallProceduralDeviationRetainedNoMaterialLeakConfirmedNotGeneralPermission: true,
  stage: 'FINAL_INDEPENDENT_NONBLIND_REVIEW_GO complete3paths typecheck131focused and own bounded publicMemoryProbes',
  sourceTestsProjectReadonlyNoSqliteFull100kOrNativeAuthority: true,
  ifProfileDeniesProofWritesReportCompletePublicReprosInlineWithoutBypass: true,
  noAcceptanceIntegrationOldReviewerReopenOrModelPolicyChange: true,
};
writeFileSync(phase + '/l7-namespace-review-final-go-readback-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(admission.proofDirectory + '/PARENT_REVIEW_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
