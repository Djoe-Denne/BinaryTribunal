import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const target = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-target-actual-final-go-20261016.json', 'utf8'));
const verified = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-target-final-parent-verification-20261016.json', 'utf8'));
const request = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-preparation-request-20261016.json', 'utf8'));
assert(verified.stage.startsWith('TARGET_V2_FINAL_DELIVERY_CONFORMING'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint); const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: target.session }); assert.deepEqual(session.model, target.model);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === request.missionId), task = team.tasks.find((t: any) => t.id === target.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review'); assert.equal(team.members.find((m: any) => m.name === task.assignee).agent, 'plan');
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const auth = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(auth.ready && !auth.pausedTeams.includes(team.id) && !auth.admissionPausedTeams.includes(team.id));
for (const f of request.files) assert.equal(sha(readFileSync(target.packet + '/' + f.path)), f.sha256);
assert.equal(sha(readFileSync(target.packet + '/' + target.ledger.path)), target.ledger.sha256);
assert.equal(sha(readFileSync(target.packet + '/.preparation-receipt.json')), target.helperReceiptFileSha256);
assert.equal(sha(readFileSync(target.packet + '/LARGE_FIXTURE_PARENT_RECEIPT.json')), target.parentProjectionReceiptSha256);
assert.equal(sha(readFileSync(target.newRun + '/TARGET_V2_ARTIFACTS.json')), verified.manifestSha256);
assert.equal(sha(readFileSync(target.newRun + '/TARGET_V2_QUALIFICATION.json')), verified.qualificationSha256);
const run = target.proofDirectory + '/PROBES-9c4a62f1c225'; assert(!existsSync(run));
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0);
const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|independent-projection\\.mjs|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(ps.status, 0); const raw = ps.stdout.trim() ? JSON.parse(ps.stdout) : []; assert.equal((Array.isArray(raw) ? raw : [raw]).length, 0);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, packet: target.packet,
  proofDirectory: target.proofDirectory, run, existingOwnedTempRoot: target.tempRoot,
  targetV2SevenArtifacts303532Bytes403InputsBothReceiptsAndRaw98ActualPassConformedBeforeGo: true,
  nativePlanSolMaxOwnedOpenTaskPolicies4_2AdmissionGuardAndAllInputsRecheckedZeroDynamicConcurrentNoKill: true,
  stage: 'FINAL_PUBLIC_MEMORY_PROBES_GO independentBoundedCasesOnly_NO_TSC_TARGET_FULL_OR_DB',
  maxDeclaredCasesTotal: 12, maxUnitsPerFixture: 8, maxProductProbeInvocations: 4, maxMsPerInvocation: 60000,
  maxNewDatabases: 0, maxNewPorts: 0, noDurableGraphStoreStoreDatabaseOrNativePorts: true,
  casePlanScriptInputsExpectedHandDerivationsAndContrariesDeclaredAndPinnedBeforeTheirExecution: true,
  publicApisOfFrozenSourceOnlyNoPrivateAsAnyNoAuthorOracleOrSharedTestOracleForExpectedValues: true,
  allowedCoverage: ['hand-derived DAG work/critical path under explicitly recorded rolesParallel/workers/resources/validation', 'consumed image copies/callback timing/alias/descriptors/legitimate custom null frozen prototypes', 'shape/export/compare/capture/replay refusal stages and tuples before Map', 'L5 public export local need versus original archive independent producer', 'HARD/adoption/stop/peer/retry and hand-counted occupation controls'],
  proposed18And20NotParentPrescribedExpectedNumbersFullFixtureParametersAndIndependentDerivationRequired: true,
  existingDeclaredStandaloneStoreFreezingOutsideScenarioInputGuaranteeNotNewPureApiOracle: true,
  onlyOwnInMemoryCallbackEffectsNoFilesystemNetworkOrSystemSideEffects: true,
  noSourceTestInputFixtureHelperMutationAndAll402PlusReadonlyLedgerReceiptsAndTargetEvidenceBeforeAfter: true,
  sameSandboxEnvDigestOnlyGuardStrictCasefoldAbsentOriginalUniqueAppDataPathsChildTempTmpOnlyOverrides: true,
  existingOwnTempContinuationNoDeleteRecreateOrOldRootAccessOpaqueToolCacheIfAnyRetainedHashedNotDeserialized: true,
  old42L7And636L8DbNotAccessibleNoSqlDirectFreshDbOrSidecarCreation: true,
  anyUnexpectedRedSetupDriftNativeRefusalHoldNoFixOracleEditRerunOrPermissionBypass: true,
  plannedContrariesInSameBoundedInvocationAllowedButNoUnboundedFollowupAfterFailure: true,
  noCtxSearchSharedIndexInboxBoardTeamResultsOtherContextsGitInstallLlmIdbLiveNativeIntegration: true,
  naturalEndActualCodesCountsBeforeCollectionThenFinalScopedVerdict3To8AnchorsReproContrariesPinsLimits: true,
  disclosePublicSummaryPreambleExposureNonblindAndStandaloneStoreAndOfflineOnlyLimitsInFinal: true,
  noFinalReviewAcceptanceOrGlobalL7L8QaNativeIntegrationAuthorityByProbeGo: true };
writeFileSync(phase + '/l7-copy851-ledger-v2-public-memory-probes-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(target.proofDirectory + '/PARENT_PUBLIC_MEMORY_PROBES_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, task: out.task, session: out.session, model: out.model, stage: out.stage, run, maxCases: out.maxDeclaredCasesTotal, maxUnits: out.maxUnitsPerFixture, maxInvocations: out.maxProductProbeInvocations, maxMsEach: out.maxMsPerInvocation, newDb: 0, newPorts: 0 }));
