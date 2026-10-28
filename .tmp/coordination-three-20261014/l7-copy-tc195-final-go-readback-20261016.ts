import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy-tc195-gate-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const release = JSON.parse(readFileSync(phase + '/l8-runtime16-full-natural-release-parent-20261016.json', 'utf8'));
assert(release.authorExplicitExclusiveReleaseAtNaturalEndBeforeCollection && release.exit === 0);
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
assert.equal(sha(receipt), '52b75c5c9ad4257e64614a9b516a27934c8c4094890417453e5cc9996d2286b1');
const b = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8')); assert.equal(b.own, own);
assert.equal(b.current370.length, 370);
for (const f of b.current370) { const bytes = readFileSync(own + '/' + f.path); assert.equal(bytes.length, f.bytes); assert.equal(sha(bytes), f.sha256); }
for (const f of [...b.readonlyWrite8, b.writeArtifacts, ...b.red10, b.redArtifacts]) assert.equal(sha(readFileSync(f.path)), f.sha256);
for (const f of b.oldProofs) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
assert.equal(sha(readFileSync(own + '/tools/ff8-harness/src/simulator.ts')), '851e6ab20bc14a2ebad6fcf1a8a82b0d59f668aa44e3849878d1ef82c81773ca');
const check = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(check.status, 0); const raw = check.stdout.trim() ? JSON.parse(check.stdout) : [];
assert.equal((Array.isArray(raw) ? raw : [raw]).length, 0, 'Dynamic test/probe exists; stop without kill');
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  actualFullDecisionBaseline370EntriesParentStatic3Pins100269BytesRoleConditionsReadAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipGuardSource851Current370Red10Write8OldProofsExact: true,
  L8FullReleasedBeforeCollectionAndNoTestProbeTypecheckProcessObservedNoKill: true,
  stage: 'FINAL_TC_THEN_195_ONLY_GO oneTypecheck120s then onlyIfExit0AndPostPins one8NamedFilesExpected195_300s',
  sourceTestsReadonlyAnyRedSetupDriftHoldNoPatchFixRerun: true,
  noInterop5Scale100kCliAnnexProbeSqliteFullOrIntegrationGo: true,
  L8RawEvidenceCollectionIndependentNoRightsToItsFixtures: true,
  freshReviewAndFutureFullParentGatesRemainSeparateNoNativeAuthority: true };
writeFileSync(phase + '/l7-copy-tc195-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(own + '/.tmp/L7_COPY_BOUNDARY_20261016/PARENT_TC195_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
