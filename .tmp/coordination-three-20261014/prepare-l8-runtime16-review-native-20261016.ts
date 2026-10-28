import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const frozen = JSON.parse(readFileSync(phase + '/l8-runtime16-review-freeze-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
assert.equal(team.leadSessionId, 'ses_eca40a8e2ffeanEKTBLiGjDNw8');
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const member = team.members.find((m: any) => m.name === 'l8-runtime16-review'); assert(member); assert.equal(member.agent, 'plan');
const session = await cli.session.get({ sessionID: member.sessionId });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
for (const m of team.members.filter((m: any) => m.name !== member.name)) assert.notEqual(session.id, m.sessionId);
assert.notEqual(session.id, team.leadSessionId); assert.notEqual(session.id, 'ses_ec12fcc43ffeI6xXQ5rSTty2mV');
const taskId = 'task_mvb5kbvg_002f_5q34sa', task = team.tasks.find((t: any) => t.id === taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, member.name);
const authorization = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(authorization.ready && !authorization.pausedTeams.includes(team.id) && !authorization.admissionPausedTeams.includes(team.id));
const manifest = readFileSync(frozen.sourceRoot + '/REVIEW_INPUT_MANIFEST.json'); assert.equal(sha(manifest), frozen.manifestSha256);
const files = JSON.parse(manifest.toString('utf8')).files.map((f: any) => ({ path: f.path, sha256: f.sha256, kind: f.kind }));
for (const f of files) assert.equal(sha(readFileSync(frozen.sourceRoot + '/' + f.path)), f.sha256);
files.push({ path: 'REVIEW_INPUT_MANIFEST.json', sha256: sha(manifest), kind: 'manifest' }); assert.equal(files.length, 464);
const destination = root + '/inputs/L8_RUNTIME16_FINAL_REVIEW_20261016'; assert(!existsSync(destination));
const proofDirectory = phase + '/L8_RUNTIME16_REVIEW_PROOFS_20261016'; assert(!existsSync(proofDirectory)); mkdirSync(proofDirectory);
const request = { schemaVersion: 1, missionId: team.id, taskId, cycle: 1, role: 'reviewer', blind: false,
  sourceRoot: frozen.sourceRoot, targetSessionId: session.id, destinationRoot: destination, files };
writeFileSync(phase + '/l8-runtime16-review-preparation-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: taskId, member: member.name, session: session.id, model: session.model,
  nativeProfileReadonlyPlan: true, nativeDirectory: root, noNativeWorktreeBecauseReadonly: true,
  destination, proofDirectory, files: 464, bytes: frozen.bytes, manifestSha256: frozen.manifestSha256,
  scopeBytes: frozen.scopeBytes, scopeSha256: frozen.scopeSha256, freshDistinctFromEveryOtherMemberAndAuthorVerified: true,
  wholeMainNativeRootDoesNotGrantMainSourceOrOtherSessionAccess: true,
  stage: 'ACCESS_ONLY actualCompleteScopeContractsHash464RoleConditionsReadAccessAck before distinct STATIC_REVIEW_GO',
  noProductSourceReviewTscTestsProbeDbExecutionBeforeTheirSeparateGates: true };
writeFileSync(phase + '/l8-runtime16-review-native-admission-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(proofDirectory + '/NATIVE_ADMISSION.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
