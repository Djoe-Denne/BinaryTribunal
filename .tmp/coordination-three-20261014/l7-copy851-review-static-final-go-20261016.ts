import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy851-review-preparation-request-20261016.json', 'utf8'));
const extra = JSON.parse(readFileSync(phase + '/l7-copy851-preamble-qualification-request-20261016.json', 'utf8'));
const admission = JSON.parse(readFileSync(phase + '/l7-copy851-review-native-admission-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
assert.equal(q.targetSessionId, extra.targetSessionId); assert.equal(q.taskId, extra.taskId);
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
assert.equal(team.leadSessionId, 'ses_eca40a8e2ffeanEKTBLiGjDNw8'); assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const task = team.tasks.find((t: any) => t.id === q.taskId); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
const member = team.members.find((m: any) => m.name === 'l7-copy851-review'); assert.equal(member.sessionId, session.id); assert.equal(member.agent, 'plan');
for (const m of team.members.filter((m: any) => m.name !== member.name)) assert.notEqual(m.sessionId, session.id);
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
let files = 0, bytes = 0;
for (const request of [q, extra]) for (const f of request.files) { const b = readFileSync(request.destinationRoot + '/' + f.path); assert.equal(sha(b), f.sha256); files++; bytes += b.length; }
assert.equal(files, 393); assert.equal(bytes, 9002942);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json'), extraReceipt = readFileSync(extra.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), '63a11cb5cdc80209d9358c6f7dc51627b7399a2edd5d56e6e635f33e0a5984c5');
assert.equal(sha(extraReceipt), '5c9ecd95179e49c8f51474923bbd188472d6f1ae382420e2cfe6a0ea7c921189');
assert.equal(extraReceipt.length, 881);
const candidates = JSON.parse(readFileSync(q.destinationRoot + '/PARENT/CANDIDATE_PINS.json', 'utf8')); assert.equal(candidates.candidates.length, 4); assert.equal(candidates.candidate4Bytes, 195451);
for (const f of candidates.candidates) { const b = readFileSync(q.destinationRoot + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); }
assert.equal(candidates.dto33.length, 33); assert(!existsSync(admission.plannedTempRootOnlyAfterSeparateDynamicGo));
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8')); for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model,
  packet: q.destinationRoot, qualificationPacket: extra.destinationRoot, proofDirectory: admission.proofDirectory,
  actualCompleteOriginal391AndAdditive2ReadHash9002942BytesRoleConditionsAccessAckApproved: true,
  parentNonblindPublicSummaryExposureQualificationExplicitlyAcceptedNoClaimBlindnessOrNoPriorPublicKnowledge: true,
  receiptFileSha256: sha(receipt), supplementReceiptFileSha256: sha(extraReceipt),
  nativePlanSolMaxOwnedOpenTaskPolicies4_2GuardReady393Pins4Candidate195451Dto33AndMain275Rechecked: true,
  plannedReviewerTempStillAbsentNoProductSourceExecutionByReadback: true,
  stage: 'FINAL_STATIC_REVIEW_ONLY_GO entireL7Copy851 contracts adversarial sourceReadonly no dynamic permission',
  noCtxSearchSharedIndexInboxBoardTeamResultsOtherSessionOrHistoricalVerdictOracle: true,
  exactAuthorizedFilesAndShortTargetedCtxExecuteOrSlicesOnlyNativePlanRefusalStopInlineNoBypass: true,
  ownStaticNotesOrPublicInlineIfNativePlanRefusesNoCandidateEdits: true,
  noTypecheck255TestsProbeProductImportExecutionDbTempCreationUntilSeparateDynamicGo: true,
  noOld22L7Or636L8DbMainAuthorTranscriptAccessNoReviewVerdictGlobalAcceptanceIntegrationOrNativeAuthority: true };
writeFileSync(phase + '/l7-copy851-review-static-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(admission.proofDirectory + '/PARENT_STATIC_REVIEW_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
