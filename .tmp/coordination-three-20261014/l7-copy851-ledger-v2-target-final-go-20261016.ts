import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const r = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-target-exclusive-reservation-20261016.json', 'utf8'));
assert(r.newExclusiveTargetV2Reservation && Date.now() - Date.parse(r.at) < 600000);
const q = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-preparation-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: r.session }); assert.deepEqual(session.model, r.model);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId), task = team.tasks.find((t: any) => t.id === r.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
const auth = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(auth.ready && !auth.pausedTeams.includes(team.id) && !auth.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
assert.equal(sha(readFileSync(r.packet + '/' + r.ledger.path)), r.ledger.sha256); assert.equal(statSync(r.packet + '/' + r.ledger.path).mode & 0o222, 0);
assert(!existsSync(r.newRun) && !existsSync(r.tempRoot));
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0);
const out = { ...r, reservedAt: r.at, at: new Date().toISOString(),
  stage: 'FINAL_TARGET_V2_GO one255Named14Files180s_FROM_NEW_LEDGER_V2_FREEZE_NO_TSC_RERUN_NO_EXTRA_PROBES',
  noProductExecutionNewTempFixtureCreationOrExtraProbeIntegrationNativeAuthorityByReservation: undefined,
  createOnlyNewExactRunAndShortTempRootWithOpencodeEmptyNonLinksAfterThisGoNoOldTempReuseOrDelete: true,
  newTargetInvocationLockExclusiveOneCommandExactNoAutomaticRerunOnRedSetupDrift: true,
  guardsSeparateStrictCasefoldAbsentOriginalAppDataPathsUniqueExactChildEnvCopyOnlyTempTmpOverrides: true,
  processEnvDigestOnlyWithinEachCurrentSandboxBeforeAfterNeverCrossProcessOldShaEquality: true,
  all402HelperPinsAndSeparateLedgerReadonlyBothReceiptsAndControlsBeforeAfterRequired: true,
  noProbesEvenIfGreenUntilParentTargetQualificationAndDistinctProbeGo: true,
  naturalEndCodesCountsAndExclusiveReleaseBeforeCollectionThenFreshGraphDbReturnsMax12CloseRetainRawHashesSidecars: true,
  noSourceTestOracleHelperConfigChangesNoOld32L7Or636L8DbSqlDirectSharedIndexInboxBoardGitNativeOrIntegration: true };
writeFileSync(phase + '/l7-copy851-ledger-v2-target-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(r.proofDirectory + '/PARENT_TARGET_V2_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, task: out.task, session: out.session, model: out.model, reservedAt: out.reservedAt, stage: out.stage, newRun: out.newRun, tempRoot: out.tempRoot }));
