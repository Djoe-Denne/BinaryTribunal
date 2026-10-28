import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = root + '/.tmp/coordination-three-20261014';
const frozen = JSON.parse(readFileSync(phase + '/l7-namespace-final-review-freeze-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
assert.equal(team.leadSessionId, 'ses_eca40a8e2ffeanEKTBLiGjDNw8');
const member = team.members.find((m: any) => m.name === 'l7-namespace-review'); assert(member);
const session = await cli.session.get({ sessionID: member.sessionId });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
for (const old of ['ses_ebf3163b0ffeRcsdSbmtNohYLe', 'ses_ebbbd0168ffeS27MM62vOwa0A5', 'ses_ebf0aef70ffetlgGafSSmiNaPI', team.leadSessionId]) assert.notEqual(session.id, old);
const taskId = 'task_mvayt47j_000e_gx1ukb';
const task = team.tasks.find((t: any) => t.id === taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, member.name);
const bytes = readFileSync(frozen.sourceRoot + '/REVIEW_INPUT_MANIFEST.json');
assert.equal(sha(bytes), frozen.manifestSha256);
const manifest = JSON.parse(bytes.toString('utf8'));
const files = manifest.files.map((f: any) => ({ path: f.path, sha256: f.sha256, kind: f.kind }));
for (const f of files) assert.equal(sha(readFileSync(frozen.sourceRoot + '/' + f.path)), f.sha256);
files.push({ path: 'REVIEW_INPUT_MANIFEST.json', sha256: sha(bytes), kind: 'manifest' });
assert.equal(files.length, 386);
const proofDirectory = phase + '/l7-namespace-review-evidence-20261016';
assert(!existsSync(proofDirectory)); mkdirSync(proofDirectory);
const request = {
  schemaVersion: 1, missionId: team.id, taskId, cycle: 1, role: 'reviewer', blind: false,
  sourceRoot: frozen.sourceRoot, targetSessionId: session.id,
  destinationRoot: root + '/inputs/L7_NAMESPACE6D00_FINAL_REVIEW_20261016', files,
};
writeFileSync(phase + '/l7-namespace-review-preparation-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = {
  at: new Date().toISOString(), member: member.name, taskId, session: session.id, model: session.model,
  directory: session.location.directory, files: 386, bytes: frozen.bytes,
  manifestSha256: frozen.manifestSha256, scopeSha256: frozen.scopeSha256, scopeBytes: frozen.scopeBytes,
  destination: request.destinationRoot, proofDirectory,
  stage: 'ACCESS_ONLY actual fullRead386HashRoleEffectiveAccessAck before separate REVIEW_GO',
  noSqliteFullOrSourceWritePermission: true,
};
writeFileSync(phase + '/l7-namespace-review-native-admission-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
