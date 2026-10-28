import { readFileSync, writeFileSync, existsSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-preparation-request-20261016.json', 'utf8'));
const a = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-native-inputs-20261016.json', 'utf8'));
const projection = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-parent-materialization-20261016.json', 'utf8'));
const old = JSON.parse(readFileSync(phase + '/l7-copy851-review-preparation-request-20261016.json', 'utf8'));
const oldGo = JSON.parse(readFileSync(phase + '/l7-copy851-review-target-only-actual-final-go-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId }); assert.deepEqual(session.model, a.model); assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId); assert.equal(team.leadSessionId, 'ses_eca40a8e2ffeanEKTBLiGjDNw8');
const task = team.tasks.find((t: any) => t.id === q.taskId); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
assert.equal(team.members.find((m: any) => m.name === task.assignee).agent, 'plan'); assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const auth = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(auth.ready && !auth.pausedTeams.includes(team.id) && !auth.admissionPausedTeams.includes(team.id));
let count = 0, bytes = 0;
for (const f of q.files) { const b = readFileSync(q.destinationRoot + '/' + f.path); assert.equal(sha(b), f.sha256); count++; bytes += b.length; }
assert.equal(count, 402); assert.equal(bytes, 9300341);
const binding = a.largeFixtureBinding, file = q.destinationRoot + '/' + binding.relativePath, fb = readFileSync(file);
assert.equal(fb.length, 8943882); assert.equal(sha(fb), binding.sha256); assert(lstatSync(file).isFile() && !lstatSync(file).isSymbolicLink()); assert.equal(statSync(file).nlink, 1); assert.equal(statSync(file).mode & 0o222, 0);
assert.equal(sha(readFileSync(q.destinationRoot + '/.preparation-receipt.json')), projection.helperReceiptFileSha256);
assert.equal(sha(readFileSync(q.destinationRoot + '/LARGE_FIXTURE_PARENT_RECEIPT.json')), projection.parentProjectionReceiptSha256);
const code = old.files.filter((f: any) => f.path.startsWith('tools/ff8-harness/')); assert.equal(code.length, 254);
for (const f of code) { assert.equal(sha(readFileSync(old.destinationRoot + '/' + f.path)), f.sha256); assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256); }
const tcBytes = readFileSync(oldGo.run + '/typecheck.lifecycle.json'); assert.equal(sha(tcBytes), '4b9be4c7afc11e60a696f9f8e047f497ec7f7517f67899c53c7f17a27e73758e');
const tc = JSON.parse(tcBytes.toString('utf8')); assert.equal(tc.exit, 0); assert.equal(tc.pid, 45324); assert(tc.naturalExit);
const pre = JSON.parse(readFileSync(oldGo.run + '/preflight.json', 'utf8'));
const newRun = a.proofDirectory + '/TARGET-9c4a62f1c225'; assert(!existsSync(newRun) && !existsSync(a.plannedTempRoot));
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0);
const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|independent-projection\\.mjs|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(ps.status, 0); const raw = ps.stdout.trim() ? JSON.parse(ps.stdout) : []; assert.equal((Array.isArray(raw) ? raw : [raw]).length, 0);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8')); for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, packet: q.destinationRoot, proofDirectory: a.proofDirectory,
  newRun, tempRoot: a.plannedTempRoot, cwd: q.destinationRoot + '/tools/ff8-harness', command: oldGo.command, maxMs: 180000,
  actualCompleteActiveContracts402HelperPlusSeparateLedger403Payloads18244223BytesBothReceiptsReadonlyRoleAckApproved: true,
  nativePlanSolMaxOwnedOpenTaskPolicies4_2GuardReadyAndAllInputHashesExact: true,
  sourceConfigTests254ByteExactStaticWholeCoverageAndTsc45324Exit0ReusableNoNewTscRequired: true,
  tscLifecycleSha256: sha(tcBytes), originalLocalAppData: pre.localAppData, originalAppData: pre.appData,
  helperReceiptFileSha256: projection.helperReceiptFileSha256, parentProjectionReceiptSha256: projection.parentProjectionReceiptSha256,
  ledger: { path: binding.relativePath, bytes: fb.length, sha256: sha(fb), readonly: true, nonLinkNlink1: true, outsideHelperReceiptExplicit: true },
  zeroConcurrentDynamicProcessesObservedNoKillAndNewTempRunRootsAbsent: true, acceptedMain275Exact: true,
  newExclusiveTargetV2Reservation: true, stage: 'RESERVED_AWAIT_DISTINCT_FINAL_TARGET_V2_GO one new255 noTscOrProbes',
  old393AndTsc0EnvFailuresCacheAndRedTarget10DbRemainPreserved: true,
  noProductExecutionNewTempFixtureCreationOrExtraProbeIntegrationNativeAuthorityByReservation: true };
writeFileSync(phase + '/l7-copy851-ledger-v2-target-exclusive-reservation-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
