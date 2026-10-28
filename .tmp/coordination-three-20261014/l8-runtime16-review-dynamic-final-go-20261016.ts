import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-runtime16-review-schema2-preparation-request-20261016.json', 'utf8'));
const a = JSON.parse(readFileSync(phase + '/l8-runtime16-review-static-actual-final-go-20261016.json', 'utf8'));
const old = JSON.parse(readFileSync(phase + '/l7-copy-tc195-final-parent-verification-20261016.json', 'utf8'));
assert.equal(old.tests.pass, 195); assert(old.tests.natural && old.tests.exit === 0);
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === q.taskId); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-runtime16-review');
assert.equal(team.members.find((m: any) => m.name === 'l8-runtime16-review').agent, 'plan');
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
assert.equal(sha(readFileSync(q.destinationRoot + '/.preparation-receipt.json')), a.receiptFileSha256);
assert.equal(readdirSync(q.destinationRoot + '/.tmp/L8_PHASE_A_V2').length, 0);
const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(ps.status, 0); const raw = ps.stdout.trim() ? JSON.parse(ps.stdout) : [];
assert.equal((Array.isArray(raw) ? raw : [raw]).length, 0, 'Dynamic gate exists; no kill or concurrency');
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model,
  packet: q.destinationRoot, proofDirectory: a.proofDirectory,
  fullStatic16ReadContractsAnd465PinsActualAckConfirmedNoCertainBlockReportedYet: true,
  nativePlanSolMaxTaskOwnedGuardAnd465PinsReceiptExactHelperMetadataEmpty: true,
  L7TC195CompletedConformingNoDynamicBunTestProbeTypecheckObservedNoKill: true,
  stage: 'FINAL_REVIEW_DYNAMIC_GO under alreadyReadScope12af86e0 tighter probe bounds no source writes',
  commandCwd: q.destinationRoot + '/tools/ff8-harness', typecheck: { command: 'bun run typecheck', invocations: 1, globalMaxMs: 120000 },
  testsOnlyAfterTypecheck0AndPostPins: { expected: 107, invocations: 1, globalMaxMs: 180000,
    command: 'bun test --timeout 30000 test/graph-integration/pipeline.test.ts test/graph-integration/engine.test.ts test/graph-integration/protocol.test.ts test/graph-integration/authority.test.ts test/graph-integration/recovery.test.ts test/graph-integration/cli.test.ts test/graph-integration/body-pause-regressions.test.ts' },
  independentExtraProbesOnlyAfterTarget0: { maxCases: 6, maxUnitsPerFixture: 16, maxExtraDatabases: 4, maxInvocations: 4, maxMsEach: 60000, allDynamicDatabasesHardCap: 120 },
  hypothesesApprovedFileFactCouplingAndG1FrozenContextRequireEvidenceContrariesNotNewAuthorizationPolicyOrApi: true,
  conclusionsMustDistinguishExistingFactIntrinsicAuthorizationFromFileVisibilityAndOrderingFromArtifactAcquisition: true,
  onlyPublicOwnPackageApisFreshOwnedChildTempAndL8HelperReturnedRootsNoSqlDirectOldDbOrAuthorContexts: true,
  fakeLoopbackFixturesOnlyClosePreserveDbSidecarsReceiptsHashesNoManualDelete: true,
  helperOnlyOwnEmptyMetadataRegistryAppendNotAnyManifestedSourceMutation: true,
  sourceTests465PinsReadonlyNoFull100kInstallGitInboxSubagentsLlmNativeIntegration: true,
  anySetupToolOrPinFailureHoldNoFixRerunIfPlanDeniesStopInlineNoPermissionBypass: true,
  earlyCertainBlockConsolidateMinimalContraryNoUnboundedCampaign: true,
  reportNaturalEndsBeforeCollectionThenFinalQualifiedVerdictAndPinsParentAcceptanceSeparate: true };
writeFileSync(phase + '/l8-runtime16-review-dynamic-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(a.proofDirectory + '/PARENT_DYNAMIC_REVIEW_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, task: out.task, session: out.session, model: out.model, stage: out.stage,
  typecheck: out.typecheck, tests: out.testsOnlyAfterTypecheck0AndPostPins.expected, extraProbeBounds: out.independentExtraProbesOnlyAfterTarget0 }));
