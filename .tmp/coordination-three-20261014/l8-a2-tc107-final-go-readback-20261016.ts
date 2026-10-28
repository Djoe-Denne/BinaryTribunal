import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-a2-tc107-preparation-request-20261016.json', 'utf8'));
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
assert.equal(sha(receipt), '9ad823b3a307a1b858b5686f263cede7935a5a6c4313b2a87fb54476b7ecbcbd');
const before = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8')); assert.equal(before.own, own);
assert.equal(before.runtime16.length, 16); assert.equal(before.readonlyPins.length, 822);
for (const f of [...before.runtime16, ...before.readonlyPins]) assert.equal(sha(readFileSync(f.path)), f.sha256);
const registry = readFileSync(before.registry.path); assert.equal(registry.length, 157257); assert.equal(sha(registry), before.registry.sha256);
const registryRows = before.readonlyPins.filter((f: any) => f.path.replaceAll('\\', '/') === before.registry.path);
assert.equal(registryRows.length, 1);
const observed = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and $_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(observed.status, 0);
const raw = observed.stdout.trim() ? JSON.parse(observed.stdout) : [];
const tests = Array.isArray(raw) ? raw : [raw]; assert.equal(tests.length, 0, 'No second gate while test process exists; do not kill');
writeFileSync(phase + '/l8-a2-tc107-parent-registry-before-20261016.jsonl', registry, { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  actual58LineDecisionFull5869LineBaseline129LineParentCheck3Pins349320BytesRoleConditionsAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipGuardRuntime16And822PrePinsExact: true,
  noBunTestProcessesObservedNoKill: true,
  stage: 'FINAL_TC_THEN_107_ONLY_GO one typecheck120s then onlyIfExit0 one named107target180s',
  sourcesTestsReadonlyRedOrSetupFailHoldNoFixRerun: true,
  freshPublicApiOfflineFixturesOnlyWithHelperAppend157257ImmutablePrefix: true,
  oneLiveRegistryRowQualifiedByPrefixAfterRunOther821RowsFullHashExactRequired: true,
  redCSeedsStillSealedNoScratchReopenCheckerOrFullGo: true,
  L7StaticPlanOnlyMayContinue: true, noIntegrationOrNativeAuthority: true };
writeFileSync(phase + '/l8-a2-tc107-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(own + '/.tmp/L8_A2_CORRECTIVE_20261016/PARENT_TC107_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
