import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const frozen = JSON.parse(readFileSync(phase + '/l7-copy-boundary-freeze-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
assert.equal(team.leadSessionId, 'ses_eca40a8e2ffeanEKTBLiGjDNw8');
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const member = team.members.find((m: any) => m.name === 'l7-copy-astra'); assert(member);
const session = await cli.session.get({ sessionID: member.sessionId });
assert.deepEqual(session.model, { id: 'gpt-6-astra', providerID: 'openai', variant: 'max' });
const own = session.location.directory.replaceAll('\\', '/');
assert(own.endsWith('ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-copy-astra'));
for (const old of ['ses_ebb3cde8dffeG2EQhIteowOhWK', 'ses_ebf0aef70ffetlgGafSSmiNaPI', team.leadSessionId]) assert.notEqual(session.id, old);
const taskId = 'task_mvb1jeoy_0011_n4y9u9', task = team.tasks.find((t: any) => t.id === taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, member.name);
const manifest = readFileSync(frozen.sourceRoot + '/INPUT_MANIFEST.json'); assert.equal(sha(manifest), frozen.manifestSha256);
const files = JSON.parse(manifest.toString('utf8')).files.map((f: any) => ({ path: f.path, sha256: f.sha256, kind: f.kind }));
for (const f of files) assert.equal(sha(readFileSync(frozen.sourceRoot + '/' + f.path)), f.sha256);
files.push({ path: 'INPUT_MANIFEST.json', sha256: sha(manifest), kind: 'manifest' }); assert.equal(files.length, 392);
const proofDirectory = own + '/.tmp/L7_COPY_BOUNDARY_20261016'; assert(!existsSync(proofDirectory)); mkdirSync(proofDirectory, { recursive: true });
const request = { schemaVersion: 1, missionId: team.id, taskId, cycle: 1, role: 'implementer', blind: false,
  sourceRoot: frozen.sourceRoot, targetSessionId: session.id, destinationRoot: own + '/inputs/L7_COPY_BOUNDARY_20261016', files };
writeFileSync(phase + '/l7-copy-boundary-preparation-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: taskId, member: member.name, session: session.id, model: session.model, own,
  destination: request.destinationRoot, proofDirectory, files: 392, bytes: frozen.bytes, manifestSha256: frozen.manifestSha256,
  userGoBytes: frozen.userGoBytes, userGoSha256: frozen.userGoSha256,
  stage: 'ACCESS_ONLY actual fullRead392PinsRoleEffectiveAccessConditionsAck before parent baseline materialization and separate STATIC_PLAN_GO',
  noCodeTestProbeTypecheckSqliteOrIntegrationGo: true };
writeFileSync(phase + '/l7-copy-boundary-native-admission-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(proofDirectory + '/NATIVE_ADMISSION.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
