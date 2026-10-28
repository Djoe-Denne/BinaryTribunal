import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-a2-test321-amendment-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
const own = session.location.directory.replaceAll('\\', '/');
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === q.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
assert.equal(team.members.find((m: any) => m.name === 'l8-integration-r1').sessionId, session.id);
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), '37e57c439766597c4340b8e69c9533854e509899ec05c07a698fa3199e090ac5');
const baseline = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8')); assert.equal(baseline.own, own);
for (const f of baseline.readonly853Before) assert.equal(sha(readFileSync(f.path)), f.sha256);
const change = baseline.allowedOneHunk, old = readFileSync(own + '/' + change.path);
assert.equal(sha(old), change.beforeSha256);
const expected = readFileSync(q.destinationRoot + '/EXPECTED_TEST.ts');
assert.equal(sha(expected), change.expectedSha256);
assert.equal(expected.toString('utf8').replace(change.to, change.from), old.toString('utf8'));
const observed = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and $_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(observed.status, 0); const raw = observed.stdout.trim() ? JSON.parse(observed.stdout) : [];
assert.equal((Array.isArray(raw) ? raw : [raw]).length, 0);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  actual61LineDecision6111LineBaseline483LineExpected16LineParent4Pins408955BytesRoleConditionsAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipGuard853BeforePinsAndExactInversePatchRechecked: true,
  noBunTestObservedNoKill: true,
  stage: 'FINAL_EXACT_TEST_PATCH_THEN_TC107_GO one preratified hunk then newTsc120s onlyIf0 oneNamed107180s',
  allowedTestPath: change.path, expectedBytes: expected.length, expectedSha256: sha(expected),
  sources15OtherRuntimeReadonlyHistoricalTest708CopiesImmutable: true,
  twoLiveTestRowsNewPinOneLiveRegistryPrefix850OtherRowsFullHashRequired: true,
  redOrSetupOrDriftHoldNoFurtherFixRerun: true,
  redCSeedsSealedNoScratchReopenCheckerFullIntegrationOrNativeAuthority: true,
  L7StaticPlanOnlyContinues: true };
writeFileSync(phase + '/l8-a2-test321-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(own + '/.tmp/L8_A2_CORRECTIVE_20261016/PARENT_TEST321_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
