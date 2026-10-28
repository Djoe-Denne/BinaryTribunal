import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-runtime16-review-schema2-preparation-request-20261016.json', 'utf8'));
const a = JSON.parse(readFileSync(phase + '/l8-runtime16-review-schema2-native-admission-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const audit = JSON.parse(readFileSync(phase + '/l8-runtime16-review-initial-public-audit-20261016.json', 'utf8'));
const inbox = audit.publicTools.filter((t: any) => t.input?.code?.includes('await tools.team_results('));
const board = audit.publicTools.filter((t: any) => t.input?.code?.includes('await tools.team_tasks_list('));
assert.equal(inbox.length, 1); assert.equal(board.length, 1);
assert(audit.publicTexts.includes('No unread messages.'));
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === q.taskId); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-runtime16-review');
assert.equal(team.members.find((m: any) => m.name === 'l8-runtime16-review').agent, 'plan');
const authorization = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(authorization.ready && !authorization.pausedTeams.includes(team.id) && !authorization.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), '32fc0390975a9e46ea84caad31909b84634a47b04dd208ada66ae92313b49b72');
const runtime = JSON.parse(readFileSync(q.destinationRoot + '/PARENT/RUNTIME16_PINS.json', 'utf8'));
assert.equal(runtime.pins.length, 16); assert.equal(runtime.runtime16Bytes, 365568);
for (const f of runtime.pins) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
assert.equal(readdirSync(q.destinationRoot + '/.tmp/L8_PHASE_A_V2').length, 0);
const qualification = { at: new Date().toISOString(), task: task.id, session: session.id,
  deviation: 'initial team_results(from lead) returned No unread messages; team_tasks_list and its generated tool-output cache were read before current package access approval',
  initialBroadNoInboxClaimQualifiedNotAcceptedAsZeroPriorCalls: true,
  publicEvidenceOnlyNoPrivateReasoningOrOtherSessionTranscriptObserved: true,
  actual465AccessAckReceivedLaterAndAll465PinnedInputsVerified: true,
  earlierNativeUserProjectionSubstringHeuristicFalseNotEvidenceThatCurrentMessageWasUndelivered: true,
  parentDecision: 'retain fresh NONBLIND admissibility; board metadata not scientific oracle; no general inbox or board permission; preserve and disclose deviation',
  currentRoleScopesAndIndependentRederivationUnchangedNoBlindnessClaim: true };
writeFileSync(phase + '/l8-runtime16-review-initial-deviation-parent-qualification-20261016.json', JSON.stringify(qualification, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model,
  packet: q.destinationRoot, proofDirectory: a.proofDirectory, nativeProfileReadonlyPlan: true,
  actualCompleteScopeContractsNotesSchemaCorrectionManifestReceipt465Hash9144956BytesRoleAccessAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipGuard465PinsAndEntireRuntime16AndEmptyFixtureMetadataRechecked: true,
  initialPublicInboxBoardDeviationQualifiedNonblindAdmissibilityRetainedNoGeneralPermission: true,
  stage: 'FINAL_STATIC_REVIEW_ONLY_GO complete runtime16 contracts adversarial code review source readonly',
  ownProofNotesOrPublicInlineIfNativePlanRefusesNoBypass: true,
  noTypecheckTests107ProbeProductImportExecutionDbFixtureCreationRegistryAppendUntilSeparateDynamicGo: true,
  noAuthorMainOtherSessionOrOld540DbAccessNoAcceptanceIntegrationNativeAuthority: true };
writeFileSync(phase + '/l8-runtime16-review-static-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(a.proofDirectory + '/PARENT_STATIC_REVIEW_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
