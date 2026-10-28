import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-runtime16-full-gate-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
const lead = await cli.session.get({ sessionID: 'ses_eca40a8e2ffeanEKTBLiGjDNw8' });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
assert.deepEqual(lead.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'xhigh' });
const own = session.location.directory.replaceAll('\\', '/');
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
assert.equal(team.leadSessionId, lead.id); assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const task = team.tasks.find((t: any) => t.id === q.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
assert.equal(team.members.find((m: any) => m.name === 'l8-integration-r1').sessionId, session.id);
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(sha(receipt), '39aafc941207caca3d640bcb1b80661e7f05f0509fa8f13ce55b95d5fe3e6cf7');
const baseline = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8')); assert.equal(baseline.own, own);
for (const f of [...baseline.runtime16, ...baseline.readonly957, ...baseline.immutableC16, baseline.cDelivery, baseline.registry]) {
  const b = readFileSync(f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256);
}
assert.equal(baseline.runtime16.length, 16); assert.equal(baseline.readonly957.length, 957);
for (const f of baseline.allTsScanned34) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
assert.equal(process.env.FF8_ENSEMBLE_SOURCE, undefined, 'Do not clear a present guard');
const oldGo = JSON.parse(readFileSync(phase + '/l7-copy-source-actual-final-go-20261016.json', 'utf8'));
assert.equal(oldGo.stage, 'FINAL_SOURCE_ONLY_GO simulator.ts per ratifiedPlan then staticDeliveryHoldForParentDiffGate');
const otherTasks = team.tasks.filter((t: any) => t.status === 'in_progress').map((t: any) => ({ id: t.id, assignee: t.assignee }));
assert(otherTasks.every((t: any) => ['l7-copy-astra', 'l8-integration-r1', 'l7-qa-r3', 'l7-interop-r1', 'l7-namespace-astra'].includes(t.assignee)));
const check = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(check.status, 0); const raw = check.stdout.trim() ? JSON.parse(check.stdout) : [];
const processes = Array.isArray(raw) ? raw : [raw]; assert.equal(processes.length, 0, 'Dynamic gate exists; no kill or concurrent full');
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, parentModel: lead.model, own,
  actual75LineDecisionAndAll6Files891737BytesMetadata1658RowsRoleConditionsAckApproved: true,
  receiptFileSha256: sha(receipt), nativeTaskOwnedPolicy4_2AndGuardReadyUnchanged: true,
  runtime16Readonly957C16DeliveryRegistry232965And34TsPinsExactBeforeReservation: true,
  parentContextInteropGuardStrictlyAbsentNoEnvMutationWorkerCheckStillRequired: true,
  noBunTestProbeOrTypecheckProcessesObserved: processes, noKillOrChildTempCreatedByReservation: true,
  L7SourceStaticOnlyAndOtherAuthorQaInteropHeldNoDynamicGo: true,
  newExclusiveFullReservation: true, stage: 'RESERVED_AWAIT_DISTINCT_FINAL_FULL16_GO one invocation only',
  command: 'bun test --timeout 30000', globalLimitSeconds: 420,
  old443DbPhysicalReadsForWorkerOnlyAfterFinalGo: true,
  activeLegacy12Files22CallsFreshOwnHooksOnlyOneInactiveGuardedScriptNoCleanupPermission: true,
  noFullExecutionPermissionByReservationRecordNoAcceptanceIntegrationOrNativeAuthority: true };
writeFileSync(phase + '/l8-runtime16-full-exclusive-reservation-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
