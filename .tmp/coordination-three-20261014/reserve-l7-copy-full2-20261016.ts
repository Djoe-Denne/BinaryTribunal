import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy-full2-gate-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
const lead = await cli.session.get({ sessionID: 'ses_eca40a8e2ffeanEKTBLiGjDNw8' });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6-astra', variant: 'max' });
assert.deepEqual(lead.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'xhigh' });
const own = session.location.directory.replaceAll('\\', '/');
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
assert.equal(team.leadSessionId, lead.id); assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const task = team.tasks.find((t: any) => t.id === q.taskId); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
assert.equal(team.members.find((m: any) => m.name === 'l7-copy-astra').sessionId, session.id);
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(receipt.length, 1775); assert.equal(sha(receipt), '0f04ee2a4c202fb7b89e22a1fadfd9a42f41ba92590eb6d7927d13bfb0bc0f7e');
assert.equal(JSON.parse(receipt.toString('utf8')).fingerprint, '963976112c34d772e134be9c3f4dd63501eae10d1fe93df0d54267273a001f44');
const baseline = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8')); assert.equal(baseline.own, own);
const check = (path: string, f: any) => { const b = readFileSync(path); if (f.bytes !== undefined) assert.equal(b.length, f.bytes, path); assert.equal(sha(b), f.sha256, path); };
assert.equal(baseline.current370.length, 370); for (const f of baseline.current370) check(own + '/' + f.path, f);
check(own + '/' + baseline.ledger.path, baseline.ledger);
assert.equal(baseline.old50Proofs.length, 50); assert.equal(baseline.oldFull1Proof26.length, 26);
for (const f of [...baseline.old50Proofs, ...baseline.oldFull1Proof26, baseline.oldFull1Artifacts]) check(isAbsolute(f.path) ? f.path : own + '/' + f.path, f);
let inputPins = 0;
for (const p of baseline.packets) {
  const base = own + '/' + p.path, rb = readFileSync(base + '/.preparation-receipt.json'); assert.equal(sha(rb), p.receiptSha256);
  const r = JSON.parse(rb.toString('utf8')); assert.equal(r.files.length, p.pins);
  for (const f of r.files) assert.equal(sha(readFileSync(base + '/' + f.path)), f.sha256); inputPins += r.files.length;
} assert.equal(inputPins, 407);
const dbs = JSON.parse(readFileSync(q.destinationRoot + '/OLD_FULL_DB_PINS.json', 'utf8'));
assert.equal(dbs.files.length, 11); assert.equal(dbs.files.reduce((n: number, f: any) => n + f.bytes, 0), 3321856);
for (const f of dbs.files) { check(f.path, f); for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + suffix)); }
const inventory = JSON.parse(readFileSync(q.destinationRoot + '/CLEANUP_INVENTORY.json', 'utf8'));
assert.equal(inventory.scanned.length, 45); for (const f of inventory.scanned) check(own + '/' + f.path, f);
assert.equal(inventory.activeFiles, 12); assert.equal(inventory.activeCalls, 22); assert.equal(inventory.inactiveFiles, 1);
assert.equal(baseline.tempRoot, 'C:/Users/djden/AppData/Local/Temp/opencode/l7f2-8feac6522642');
assert.equal(baseline.requiredNestedDirectory, baseline.tempRoot + '/opencode');
assert.equal(baseline.newProofRoot, own + '/.tmp/L7_COPY_BOUNDARY_20261016/FULL2-8feac6522642');
assert(!existsSync(baseline.tempRoot) && !existsSync(baseline.newProofRoot));
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0);
assert.equal(process.env.FF8_ENSEMBLE_SOURCE, undefined);
const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|independent-projection\\.mjs|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(ps.status, 0); const raw = ps.stdout.trim() ? JSON.parse(ps.stdout) : [];
const processes = Array.isArray(raw) ? raw : [raw]; assert.equal(processes.length, 0, 'Dynamic gate exists; no kill or concurrent full');
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, parentModel: lead.model, own,
  actualSevenFiles261183BytesFullReadRoleConditionsAckApproved: true,
  receiptFingerprint: '963976112c34d772e134be9c3f4dd63501eae10d1fe93df0d54267273a001f44', receiptFileSha256: sha(receipt),
  nativeOwnershipPolicies4_2AndGuardReadyUnchanged: true,
  current370Ledger8943882Old50ProofsFull1_26AndManifestOld407InputsNew7And45TsExact: true,
  old11Db3321856RawPinsExactNoSidecarsNoSqliteConnection: true,
  tempRoot: baseline.tempRoot, requiredNestedDirectory: baseline.requiredNestedDirectory, proofRoot: baseline.newProofRoot,
  newRootsStillAbsentParentCreatedNoTempProofFixtureOrProductRun: true,
  parentContextInteropGuardStrictlyAbsentCaseInsensitiveUnchangedWorkerRecheckRequired: true,
  noBunTestProbeTypecheckObservedNoKill: processes, acceptedMain275Exact: true,
  newExclusiveFull2Reservation: true, stage: 'RESERVED_AWAIT_DISTINCT_FINAL_FULL2_GO one new invocation only',
  full1RemainsRedAllProofsAnd11DbProtected: true,
  noExecutionPermissionByReservationNoSourceChangeReviewPromotionIntegrationOrNativeAuthority: true };
writeFileSync(phase + '/l7-copy-full2-exclusive-reservation-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
