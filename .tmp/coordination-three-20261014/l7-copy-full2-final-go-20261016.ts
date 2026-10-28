import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const r = JSON.parse(readFileSync(phase + '/l7-copy-full2-exclusive-reservation-20261016.json', 'utf8'));
assert(r.newExclusiveFull2Reservation && Date.now() - Date.parse(r.at) < 600000);
const q = JSON.parse(readFileSync(phase + '/l7-copy-full2-gate-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: r.session }); assert.deepEqual(session.model, r.model);
assert.equal(session.location.directory.replaceAll('\\', '/'), r.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === r.task); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const b = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8'));
for (const f of b.greenCandidates4) assert.equal(sha(readFileSync(r.own + '/' + f.path)), f.sha256);
assert(!existsSync(r.tempRoot) && !existsSync(r.proofRoot));
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0);
const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|independent-projection\\.mjs|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(ps.status, 0); const raw = ps.stdout.trim() ? JSON.parse(ps.stdout) : [];
assert.equal((Array.isArray(raw) ? raw : [raw]).length, 0);
const out = { ...r, reservedAt: r.at, at: new Date().toISOString(),
  stage: 'FINAL_FULL2_GO one bun test --timeout 30000 global420s child415s immediateExclusiveReleaseBeforeCollection',
  noExecutionPermissionByReservationNoSourceChangeReviewPromotionIntegrationOrNativeAuthority: undefined,
  userExplicitLauncherOnlyNewAttemptAndReadScope98ae21c0FullyBinding: true,
  createOnlyExactFreshProofRootAndShortTempRootWithNestedOpencodeAfterThisDistinctFinalGo: true,
  tempRootContainsExactlyEmptyOpencodeMeasuredAndChildTempTmpEqualsRootNotNested: true,
  old11RawDbSealsBeforeAfterRequiredNoSqliteNoForeignOwnerAccess: true,
  current414InputPinsAndSameSourceTestsNoTscProbeFixRerun: true,
  parentProcessRecheckAgainZeroNoKillAndBothRootsAbsent: true,
  full1StillFailedNewGreenWouldNeedFreshL7SolMaxReviewAndParentCrossGatesBeforeIntegration: true };
writeFileSync(phase + '/l7-copy-full2-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(r.own + '/.tmp/L7_COPY_BOUNDARY_20261016/PARENT_FULL2_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, task: out.task, session: out.session, model: out.model, reservedAt: out.reservedAt, tempRoot: out.tempRoot, stage: out.stage }));
