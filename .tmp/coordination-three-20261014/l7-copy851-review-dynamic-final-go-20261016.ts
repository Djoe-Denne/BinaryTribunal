import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy851-review-preparation-request-20261016.json', 'utf8'));
const extra = JSON.parse(readFileSync(phase + '/l7-copy851-preamble-qualification-request-20261016.json', 'utf8'));
const admission = JSON.parse(readFileSync(phase + '/l7-copy851-review-native-admission-20261016.json', 'utf8'));
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' }); assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
const task = team.tasks.find((t: any) => t.id === q.taskId); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
assert.equal(team.members.find((m: any) => m.name === 'l7-copy851-review').agent, 'plan');
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const authorization = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(authorization.ready && !authorization.pausedTeams.includes(team.id) && !authorization.admissionPausedTeams.includes(team.id));
let count = 0, bytes = 0; for (const request of [q, extra]) for (const f of request.files) { const b = readFileSync(request.destinationRoot + '/' + f.path); assert.equal(sha(b), f.sha256); count++; bytes += b.length; }
assert.equal(count, 393); assert.equal(bytes, 9002942);
assert.equal(sha(readFileSync(q.destinationRoot + '/.preparation-receipt.json')), '63a11cb5cdc80209d9358c6f7dc51627b7399a2edd5d56e6e635f33e0a5984c5');
assert.equal(sha(readFileSync(extra.destinationRoot + '/.preparation-receipt.json')), '5c9ecd95179e49c8f51474923bbd188472d6f1ae382420e2cfe6a0ea7c921189');
assert(!existsSync(admission.plannedTempRootOnlyAfterSeparateDynamicGo));
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0);
const source = readFileSync(q.destinationRoot + '/tools/ff8-harness/src/simulator.ts', 'utf8');
const author = JSON.parse(readFileSync(phase + '/l7-copy-full2-final-parent-verification-20261016.json', 'utf8'));
const old = readFileSync(author.own + '/.tmp/L7_COPY_BOUNDARY_20261016/WRITE-2026-10-16T152136110Z-copy-r1/simulator.before.ts', 'utf8');
assert.equal(sha(old), '6d00cf296cf22378604ea9fc07e155ccf4cb6806186c5d2e63e55fbdbc89716f');
const a = ts.createSourceFile('old.ts', old, ts.ScriptTarget.Latest, true), b = ts.createSourceFile('new.ts', source, ts.ScriptTarget.Latest, true);
const store = (f: ts.SourceFile) => f.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'SimStore')!.getText(f);
assert.equal(store(a), store(b));
for (const name of ['buildContextEnvelope', 'buildAdmissionEnvelope']) {
  const fn = (f: ts.SourceFile) => f.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name)!.getText(f); assert.equal(fn(a), fn(b));
}
const boundary = { at: new Date().toISOString(), task: task.id, session: session.id,
  scopeConfirmationNotNewHardeningOrWaiver: true,
  source851Store648_652ShallowOuterSpreadThenFreezeSharesNestedStandaloneCallerArrays: true,
  oldSimStoreAndBuildContextEnvelopeAndBuildAdmissionEnvelopeTextExactAgainstPreserved6d00: true,
  scenarioInputAcquisitionGuaranteeAppliesNamedPlanScenarioConfigIncidentsDurationExportShapeCompareCaptureReplayBoundaries: true,
  standaloneStoreWriteNestedFreezingAndLowLevelEnvelopeHostileJsAreNotNewDetachedInputGuarantees: true,
  engineCommit1157_1159UsesFreshArraysButPublicationRevisionDuplicatesEffectsStillFullyReviewable: true,
  noBlanketSimStoreCorrectnessWaiverOrPromiseAllPublicFunctionsArePure: true,
  finalReportMustDiscloseStandaloneSharingAndPreambleNonblindLimit: true,
  workerProposed18CriticalPath20WorkOracleNotEndorsedWithoutExplicitRolesParallelWorkersResourcesValidationAccounting: true,
  noSourceFixNewPolicyOrProductProbeExecutedByThisParentQualification: true };
writeFileSync(phase + '/l7-copy851-review-standalone-boundary-parent-20261016.json', JSON.stringify(boundary, null, 2) + '\n', { flag: 'wx' });
writeFileSync(admission.proofDirectory + '/PARENT_STANDALONE_BOUNDARY.json', JSON.stringify(boundary, null, 2) + '\n', { flag: 'wx' });
const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx") -and ($_.CommandLine -match "(?:^|\\s)test(?:\\s|$)" -or $_.CommandLine -match "(?:probe\\.ts|independent-projection\\.mjs|tsc --noEmit| run typecheck)") } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', timeout: 20000 });
assert.equal(ps.status, 0); const raw = ps.stdout.trim() ? JSON.parse(ps.stdout) : []; assert.equal((Array.isArray(raw) ? raw : [raw]).length, 0, 'Other dynamic gate exists; no kill/concurrent tests');
const paths = [
  'test/simulator/simulator.test.ts', 'test/simulator/simulator-corrective.test.ts', 'test/simulator/simulator-g2-review-regressions.test.ts', 'test/simulator/simulator-final-review-regressions.test.ts', 'test/simulator/simulator-identity-replan-regressions.test.ts', 'test/simulator/simulator-copy-boundary-regressions.test.ts',
  'test/benchmarks/benchmarks.test.ts', 'test/benchmarks/simulator-corrective.test.ts',
  'test/simulator/graph-interop-adoption.test.ts', 'test/simulator/graph-interop-durability.test.ts', 'test/simulator/graph-interop-planning.test.ts', 'test/simulator/graph-interop-relations.test.ts', 'test/simulator/graph-interop-structure.test.ts', 'test/benchmarks/graph-interop-scale.test.ts',
]; assert.equal(paths.length, 14); for (const p of paths) assert(existsSync(q.destinationRoot + '/tools/ff8-harness/' + p));
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model,
  packet: q.destinationRoot, qualificationPacket: extra.destinationRoot, proofDirectory: admission.proofDirectory,
  tempRoot: admission.plannedTempRootOnlyAfterSeparateDynamicGo, createTempRootAndNestedOpencodeOnlyAfterThisGoFreshNoReuse: true,
  staticEntire1385Lines33Dto85MembersAnd4CandidatesReadAckReceivedNoCertainBlockReported: true,
  standaloneStoreBoundaryConfirmedAndRecordedNoBroadPurePublicApiPromiseOrPublicationWaiver: true,
  nativePlanSolMaxOwnedOpenTaskPolicies4_2Guard393PinsBothReceiptsExactTempAbsent: true,
  zeroOtherDynamicBunTestProbeTscObservedNoKill: true,
  stage: 'FINAL_REVIEW_DYNAMIC_GO oneTsc120s then onlyIf0PostPins one255Named14Files180s then onlyIf0 boundedPublicMemoryProbes',
  cwd: q.destinationRoot + '/tools/ff8-harness', typecheck: { command: 'bun run typecheck', invocations: 1, maxMs: 120000 },
  tests: { command: 'bun test --timeout 30000 ' + paths.join(' '), expectedTestsNotOracle: 255, invocations: 1, maxMs: 180000 },
  extraOnlyAfterTarget0: { maxCases: 12, maxUnitsPerFixture: 8, maxInvocations: 4, maxMsEach: 60000, maxExtraDb: 0, maxExtraPorts: 0, publicApisOnlyNoPrivateAsAny: true },
  totalFreshGraphDbMax12ExactOwnExplicitReturnsOnlyClosePreservePerCloseAndPostHashSidecarsNoSqlDirectOrDelete: true,
  shortTempRootEntriesExactlyOpencodeNestedEmptyMeasuredBeforeLaunchChildTempTmpRootGuardAbsentEnvInheritedUnchanged: true,
  all393InputsReadOnlyNoOld22L7Or636L8DbOtherOwnerOrMainAccess: true,
  noCtxSearchSharedIndexInboxBoardTeamResultsNoFull100kGitInstallLlmNativeOrIntegrationGo: true,
  anyRedSetupToolPinFailureHoldNoFixRerunExtraProbeIfPlanRefusesStopInlineNoBypass: true,
  naturalEndsActualCodesCountsBeforeCollectionThenScopedVerdictAnchorsContrariesPinsRetainedDbParentGates: true };
writeFileSync(phase + '/l7-copy851-review-dynamic-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(admission.proofDirectory + '/PARENT_DYNAMIC_REVIEW_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, task: out.task, session: out.session, model: out.model, stage: out.stage, paths: paths.length, expectedTests: 255, tempRoot: out.tempRoot, bounds: out.extraOnlyAfterTarget0 }));
