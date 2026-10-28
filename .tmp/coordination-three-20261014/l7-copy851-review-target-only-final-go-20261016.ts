import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy851-review-dynamic-actual-final-go-20261016.json', 'utf8'));
const cache = JSON.parse(readFileSync(phase + '/l7-copy851-review-env-diagnostic-cache-parent-verification-20261016.json', 'utf8'));
const hold = JSON.parse(readFileSync(phase + '/l7-copy851-review-env-setup-hold-public-audit-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex'), run = hold.run;
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: go.session }); assert.deepEqual(session.model, go.model);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
assert.equal(team.leadSessionId, 'ses_eca40a8e2ffeanEKTBLiGjDNw8');
const task = team.tasks.find((t: any) => t.id === go.task); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
assert.equal(team.members.find((m: any) => m.name === 'l7-copy851-review').agent, 'plan');
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const auth = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(auth.ready && !auth.pausedTeams.includes(team.id) && !auth.admissionPausedTeams.includes(team.id));
for (const qname of ['l7-copy851-review-preparation-request-20261016.json', 'l7-copy851-preamble-qualification-request-20261016.json']) { const q = JSON.parse(readFileSync(phase + '/' + qname, 'utf8')); for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256); }
assert.equal(sha(readFileSync(go.packet + '/.preparation-receipt.json')), '63a11cb5cdc80209d9358c6f7dc51627b7399a2edd5d56e6e635f33e0a5984c5');
assert.equal(sha(readFileSync(go.qualificationPacket + '/.preparation-receipt.json')), '5c9ecd95179e49c8f51474923bbd188472d6f1ae382420e2cfe6a0ea7c921189');
for (const f of hold.originalFourProofPins) assert.equal(sha(readFileSync(run + '/' + f.path)), f.sha256);
assert.equal(sha(readFileSync(run + '/SETUP_ENV_DIAGNOSTIC.json')), cache.diagnosticSha256);
for (const f of ['target.lifecycle.json', 'target.start.json', 'TARGET.INVOCATION.lock']) assert(!existsSync(run + '/' + f));
assert.deepEqual(readdirSync(go.tempRoot).sort(), ['node-compile-cache', 'opencode']); assert.equal(readdirSync(go.tempRoot + '/opencode').length, 0);
for (const p of [go.tempRoot, go.tempRoot + '/opencode', cache.cacheRoot]) { const s = lstatSync(p); assert(s.isDirectory() && !s.isSymbolicLink()); }
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0);
const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|independent-projection\\.mjs|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(ps.status, 0); const raw = ps.stdout.trim() ? JSON.parse(ps.stdout) : []; assert.equal((Array.isArray(raw) ? raw : [raw]).length, 0);
const snapshotRoot = run + '/OPAQUE_CACHE_BEFORE'; assert(!existsSync(snapshotRoot)); mkdirSync(snapshotRoot);
const snapshots = cache.opaqueCachePins.map((f: any, i: number) => { const b = readFileSync(f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); const p = snapshotRoot + '/file-' + String(i + 1).padStart(3, '0') + '.bin'; writeFileSync(p, b, { flag: 'wx' }); return { path: p, bytes: b.length, sha256: sha(b), origin: f.path, opaqueNotDeserialized: true }; });
const scope = readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY851_REVIEW_TARGET_RESUME_GATE_20261016.md');
writeFileSync(go.proofDirectory + '/PARENT_TARGET_RESUME_SCOPE.md', scope, { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, run,
  stage: 'FINAL_TARGET_ONLY_GO first255Named14Files180s_NO_TSC_RERUN_NO_EXTRA_PROBES',
  scopeBytes: scope.length, scopeSha256: sha(scope), scopePath: go.proofDirectory + '/PARENT_TARGET_RESUME_SCOPE.md',
  nativePlanSolMaxOwnedOpenTaskPolicies4_2Guard393PinsBothReceiptsOld4AndDiagnosticExactZeroConcurrentChecked: true,
  tsc45324Exit0RetainedTargetActualInvocations0NewExclusiveLockRequired: true,
  wholeEnvDigestOnlyWithinCurrentSandboxBeforeAndAfterNeverCrossProcessEqualityGate: true,
  currentGuardStrictAbsentSeparateChecksOriginalCasefoldUniqueLocalAppDataAppDataMatchAndChildDiffOnlyTempTmp: true,
  stage2ExistingOwnedRootExactlyNodeCompileCacheAndOpencodeNestedEmptyNonLinksBeforeTarget: true,
  oldDiagnosticRootEmptyFlagFalseAndOldInitialPreTscLayoutUnchangedNoRetroactiveRewrite: true,
  opaqueCacheBeforeSnapshots: snapshots, opaqueCacheBytes: cache.opaqueCacheBytes,
  opaqueCacheMayBeUpdatedByRuntimeOnlyRecordBeforeAfterAndPreserveSnapshotsNoManualDeleteNoDeserialization: true,
  cwd: go.cwd, command: go.tests.command, maxMs: 180000, expectedTestsNotOracle: 255, targetInvocationsAuthorized: 1,
  source393TestsOracleDependenciesNativeProfilesModelsGlobalConfigUnchanged: true,
  noFurtherTypecheckOrIndependentProbeEvenIfTargetGreenRequiresSeparateParentGoAfterTargetQualification: true,
  onlyNewGraphDbExplicitReturnsMax12ClosePreservePerClosePostHashesSidecarsNoOld22L7Or636L8DbSqlDirectAccess: true,
  anySetupRedDriftRefusalStopHoldNoRepairClearEnvLockDeleteRerunOrPermissionBypass: true,
  naturalEndCodesCountsBeforeCollectionThenFinalTargetDeliveryAndParentHoldNoVerdictIntegrationNativeAuthority: true };
writeFileSync(phase + '/l7-copy851-review-target-only-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(go.proofDirectory + '/PARENT_TARGET_ONLY_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, task: out.task, session: out.session, model: out.model, stage: out.stage, scopeBytes: out.scopeBytes, scopeSha256: out.scopeSha256, cacheSnapshots: snapshots.length, opaqueCacheBytes: out.opaqueCacheBytes }));
