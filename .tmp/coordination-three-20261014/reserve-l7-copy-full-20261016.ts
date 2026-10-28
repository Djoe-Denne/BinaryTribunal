import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy-full-gate-request-20261016.json', 'utf8'));
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
assert.equal(team.tasks.find((t: any) => t.id === 'task_mvb5kbvg_002f_5q34sa').status, 'completed');
assert.equal(team.members.find((m: any) => m.name === 'l8-runtime16-review').status, 'shutdown');
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), '82623aa4a006946492abc3391ac689b6b25e4ad98794ef60337bec3d558cb2e6');
const b = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8')); assert.equal(b.own, own);
assert.equal(b.current370.length, 370);
for (const f of b.current370) { const bytes = readFileSync(own + '/' + f.path); assert.equal(bytes.length, f.bytes); assert.equal(sha(bytes), f.sha256); }
const lb = readFileSync(own + '/' + b.ledger.path); assert.equal(lb.length, 8943882); assert.equal(sha(lb), b.ledger.sha256);
for (const f of [...b.tc195Proof21, b.tc195Manifest]) assert.equal(sha(readFileSync(f.path)), f.sha256);
for (const f of b.old27Proofs) assert.equal(sha(readFileSync(f.path.includes(':') ? f.path : own + '/' + f.path)), f.sha256);
let inputPins = 0;
for (const p of b.packets) {
  const parent = own + '/' + p.path, rb = readFileSync(parent + '/.preparation-receipt.json'); assert.equal(sha(rb), p.receiptSha256);
  const r = JSON.parse(rb.toString('utf8')); for (const f of r.files) assert.equal(sha(readFileSync(parent + '/' + f.path)), f.sha256); inputPins += r.files.length;
}
assert.equal(inputPins, 402);
const inventory = JSON.parse(readFileSync(q.destinationRoot + '/CLEANUP_INVENTORY.json', 'utf8'));
for (const f of inventory.scanned) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0); assert.equal(process.env.FF8_ENSEMBLE_SOURCE, undefined);
const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|independent-projection\\.mjs|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(ps.status, 0); const raw = ps.stdout.trim() ? JSON.parse(ps.stdout) : [];
const observed = Array.isArray(raw) ? raw : [raw]; assert.equal(observed.length, 0, 'No concurrent full; do not kill another process');
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, parentModel: lead.model, own,
  actualFiveFiles227781BytesFullDecisionInventoryBaselineLegacyParentHashRoleConditionsAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipPolicies4_2GuardReadyUnchanged: true,
  current370Ledger8943882FourCandidate195451BytesTc195Proof21Old27Proofs402InputsAnd45TsExact: true,
  parentContextCaseInsensitiveInteropGuardStrictAbsentUnchangedWorkerPrelaunchCheckRequired: true,
  L8IndependentReviewCompletedShutdownNoOtherDynamicTestProbeTscObserved: observed,
  noKillChildTempFixtureOrFullCreatedByReservation: true, newExclusiveFullReservation: true,
  stage: 'RESERVED_AWAIT_DISTINCT_FINAL_L7_COPY_FULL_GO one invocation only',
  command: 'bun test --timeout 30000', globalLimitSeconds: 420,
  onlyLegacy12ActiveOwnFreshHooksOneGuardedInactiveNoOld636DbReadPermission: true,
  releaseImmediatelyAtNaturalOrFailedEndBeforeCollectionNoFixRerun: true,
  noFullExecutionPermissionByReservationNoAcceptanceIntegrationOrNativeAuthority: true };
writeFileSync(phase + '/l7-copy-full-exclusive-reservation-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
