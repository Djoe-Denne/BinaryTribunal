import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const f = JSON.parse(readFileSync(phase + '/l7-copy851-review-freeze-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
assert.equal(team.leadSessionId, 'ses_eca40a8e2ffeanEKTBLiGjDNw8'); assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const member = team.members.find((m: any) => m.name === 'l7-copy851-review'); assert(member); assert.equal(member.agent, 'plan');
const session = await cli.session.get({ sessionID: member.sessionId });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
for (const m of team.members.filter((m: any) => m.name !== member.name)) assert.notEqual(session.id, m.sessionId);
assert.notEqual(session.id, team.leadSessionId);
const taskId = 'task_mvb91iar_003f_0d5wmp', task = team.tasks.find((t: any) => t.id === taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, member.name);
const auth = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(auth.ready && !auth.pausedTeams.includes(team.id) && !auth.admissionPausedTeams.includes(team.id));
const manifest = readFileSync(f.sourceRoot + '/REVIEW_INPUT_MANIFEST.json'); assert.equal(sha(manifest), f.manifestSha256);
const files = JSON.parse(manifest.toString('utf8')).files.map((f: any) => ({ path: f.path, sha256: f.sha256, kind: f.kind }));
for (const f0 of files) assert.equal(sha(readFileSync(f.sourceRoot + '/' + f0.path)), f0.sha256);
files.push({ path: 'REVIEW_INPUT_MANIFEST.json', sha256: sha(manifest), kind: 'manifest' }); assert.equal(files.length, 391);
const destination = root + '/inputs/L7_COPY851_FULL2_FINAL_REVIEW_20261016'; assert(!existsSync(destination));
const proofDirectory = phase + '/L7_COPY851_REVIEW_PROOFS_20261016'; assert(!existsSync(proofDirectory)); mkdirSync(proofDirectory);
const tempRoot = 'C:/Users/djden/AppData/Local/Temp/opencode/l7rv-' + randomUUID().replaceAll('-', '').slice(0, 12); assert(!existsSync(tempRoot));
const request = { schemaVersion: 1, missionId: team.id, taskId, cycle: 1, role: 'reviewer', blind: false,
  sourceRoot: f.sourceRoot, targetSessionId: session.id, destinationRoot: destination, files };
writeFileSync(phase + '/l7-copy851-review-preparation-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: taskId, member: member.name, session: session.id, model: session.model,
  nativeProfileReadonlyPlan: true, nativeDirectory: root, noNativeWorktreeBecauseReadonly: true,
  destination, proofDirectory, plannedTempRootOnlyAfterSeparateDynamicGo: tempRoot,
  files: 391, bytes: f.bytes, manifestSha256: f.manifestSha256, scopeBytes: f.scopeBytes, scopeSha256: f.scopeSha256,
  freshDistinctFromAllOtherMemberSessionsAndAuthorVerified: true,
  mainNativeDirectoryContextOnlyNotMainSourceAccessOrOtherSessionPermission: true,
  stage: 'ACCESS_ONLY actualCompleteScopeContractsHash391RoleConditionsReadAccessAck before distinct STATIC_REVIEW_GO',
  noProductReviewTscTestsProbeDbFixturesOrTempCreationBeforeTheirSeparateGates: true };
writeFileSync(phase + '/l7-copy851-review-native-admission-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(proofDirectory + '/NATIVE_ADMISSION.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
