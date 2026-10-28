import { readFileSync, writeFileSync, mkdirSync, existsSync, symlinkSync, lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy-boundary-preparation-request-20261016.json', 'utf8'));
const admission = JSON.parse(readFileSync(phase + '/l7-copy-boundary-native-admission-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { id: 'gpt-6-astra', providerID: 'openai', variant: 'max' });
const own = session.location.directory.replaceAll('\\', '/'); assert.equal(own, admission.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === q.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
assert.equal(team.members.find((m: any) => m.name === 'l7-copy-astra').sessionId, session.id);
assert.equal(team.leadSessionId, 'ses_eca40a8e2ffeanEKTBLiGjDNw8');
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), 'efb3f772b11a40a425cb757ea6c4670e4cdf7d2a59d8866408972d0ae40a0213');
assert.equal(execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: own, encoding: 'utf8' }).trim(), '');
const materialize = q.files.filter((f: any) => f.path.startsWith('tools/ff8-harness/') || f.path.startsWith('docs/') || f.path.startsWith('.tmp/'));
assert.equal(materialize.length, 369);
const missing: any[] = [];
for (const f of materialize) {
  assert(!f.path.includes(':') && !f.path.split('/').includes('..'));
  for (let p = dirname(own + '/' + f.path); p.length >= own.length; p = dirname(p)) {
    if (existsSync(p)) assert(!lstatSync(p).isSymbolicLink(), 'No source path through existing symlink');
    if (p === own) break;
  }
  if (existsSync(own + '/' + f.path)) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
  else missing.push(f);
}
assert.equal(missing.length, 113);
for (const f of missing) {
  mkdirSync(dirname(own + '/' + f.path), { recursive: true });
  writeFileSync(own + '/' + f.path, readFileSync(q.destinationRoot + '/' + f.path), { flag: 'wx' });
}
for (const f of materialize) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
const dep = own + '/tools/ff8-harness/node_modules'; assert(!existsSync(dep));
symlinkSync(root + '/tools/ff8-harness/node_modules', dep, 'junction');
const newTest = 'tools/ff8-harness/test/simulator/simulator-copy-boundary-regressions.test.ts'; assert(!existsSync(own + '/' + newTest));
const baseline = { task: task.id, session: session.id, model: session.model, own,
  files: materialize.map((f: any) => ({ path: f.path, bytes: readFileSync(own + '/' + f.path).length, sha256: f.sha256, kind: f.kind })),
  existing256ExactNoOverwrite113MissingFilesSeededByParent: true,
  baselineSource6d00NotCorrectiveCode: true, newCopyBoundaryTestAbsent: true,
  dependencyJunctionNoInstall: true, noLedger9MbOrDbTransferred: true };
const baselineBytes = Buffer.from(JSON.stringify(baseline, null, 2) + '\n');
writeFileSync(admission.proofDirectory + '/PARENT_BASELINE.json', baselineBytes, { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  proofDirectory: admission.proofDirectory, actualCompleteParentDocs392Pins8441428BytesRoleConditionsEffectiveAccessAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipTaskInProgressGuardAnd392PinsRechecked: true,
  baselineFiles: 369, baselineSha256: sha(baselineBytes), existing256ExactNoOverwrite: true,
  parentSeeded113MissingBaselineFilesOnlyNoCandidateFix: true, newTestAbsent: true,
  stage: 'STATIC_ANALYSIS_PLAN_ONLY_GO to transmit separately no executable repro test typecheck code Sqlite yet',
  old131Readme33PublicDtoReadonlyPlanBeforeSourceOrTestWrites: true, noNativeAuthorityOrIntegration: true };
writeFileSync(phase + '/l7-copy-boundary-static-plan-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(admission.proofDirectory + '/PARENT_PLAN_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
