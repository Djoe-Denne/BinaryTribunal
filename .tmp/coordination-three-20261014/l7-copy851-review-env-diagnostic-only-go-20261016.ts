import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy851-review-dynamic-actual-final-go-20261016.json', 'utf8'));
const audit = JSON.parse(readFileSync(phase + '/l7-copy851-review-env-setup-hold-public-audit-20261016.json', 'utf8'));
const run = audit.run, sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: go.session }); assert.deepEqual(session.model, go.model);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === go.task); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const auth = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(auth.ready && !auth.pausedTeams.includes(team.id) && !auth.admissionPausedTeams.includes(team.id));
for (const f of audit.originalFourProofPins) assert.equal(sha(readFileSync(run + '/' + f.path)), f.sha256);
assert(!existsSync(run + '/target.lifecycle.json'));
const wrapper = audit.publicFailedWrapperInputs.find((t: any) => !t.input.code?.startsWith('return await tools.team_message'))?.input.code;
assert(wrapper && wrapper.indexOf('HOLD env/guard changed') < wrapper.indexOf('const checks=[]') && wrapper.indexOf('const checks=[]') < wrapper.indexOf('spawnSync'));
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, run,
  originalTsc0FourProofsExactTargetAndProbeInvocations0CorroboratedByPublicShortCircuitBeforePostpinsAndSpawn: true,
  wholeEnvHashComparedAcrossDistinctCtxExecuteProcessesCannotIdentifyDifferingKeyOrAttributeGuardChange: true,
  noClaimWhichKeyVariedOrThatAllVariationIsHarmlessOriginalPerKeySnapshotAbsent: true,
  stage: 'ENV_DIAGNOSTIC_ONLY_GO one readonly ctx_execute max30s no target or probe resume',
  authorized: {
    exactSource393AndBothReceiptsReadonlyHash: true,
    sameCurrentSandboxWholeEnvDigestBeforeAfterReadonlyDiagnosticNoMutation: true,
    compareLocalAppDataAndAppDataCaseInsensitiveUniqueValuesToOriginalPinnedPreflight: true,
    recordCurrentInheritedTempTmpForExplanationOnlyNotWholeEnvOrSecrets: true,
    guardCaseInsensitiveNamePresenceOnlyMustBeStrictAbsentNoValueReadOrClear: true,
    existingOwnTempRootAndNestedDirTypesAndBoundedOwnEntriesInspectNoMkdirDeleteOrRecreate: true,
    newArtifactOnly: run + '/SETUP_ENV_DIAGNOSTIC.json',
    noTargetLifecycleOrDbArtifactBeforeDiagnostic: true
  },
  originalLocalAppData: audit.originalSelectedLocalAppData, originalAppData: audit.originalSelectedAppData,
  oldWholeEnvDigestPreservedAsHistoricalNotCrossProcessEqualityGate: audit.originalWholeProcessEnvSha256,
  noChildProcessSpawnProductImportCommandTypecheckTestProbeDbOrPort: true,
  noGlobalEnvConfigPolicyWrapperSourceCandidateOrOldFourArtifactsModified: true,
  currentGuardPresentSelectedAuthorityPathMismatchOrAnyPinDriftStopHoldNoClearRepairOrAutomaticResume: true,
  reportExactMeasurementsParentArbitratesPreciseWrapperAmendmentAndSeparateTargetOnlyGoLater: true,
  noCtxSearchInboxBoardOtherContextsOld22L7Or636L8DbAccess: true };
writeFileSync(phase + '/l7-copy851-review-env-diagnostic-only-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(go.proofDirectory + '/PARENT_ENV_DIAGNOSTIC_ONLY_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
