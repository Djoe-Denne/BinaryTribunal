import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const reservation = JSON.parse(readFileSync(phase + '/l8-runtime16-full-exclusive-reservation-20261016.json', 'utf8'));
assert(reservation.newExclusiveFullReservation && Date.now() - Date.parse(reservation.at) < 600000);
const q = JSON.parse(readFileSync(phase + '/l8-runtime16-full-gate-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: reservation.session });
assert.deepEqual(session.model, reservation.model); assert.equal(session.location.directory.replaceAll('\\', '/'), reservation.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
assert.equal(team.tasks.find((t: any) => t.id === reservation.task)?.status, 'in_progress');
const guard = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(guard.ready && !guard.pausedTeams.includes(team.id) && !guard.admissionPausedTeams.includes(team.id));
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const baseline = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8'));
for (const f of [...baseline.runtime16, baseline.registry]) assert.equal(sha(readFileSync(f.path)), f.sha256);
assert.equal(process.env.FF8_ENSEMBLE_SOURCE, undefined);
const out = { ...reservation, reservedAt: reservation.at, at: new Date().toISOString(),
  stage: 'FINAL_FULL16_GO one bun test --timeout 30000 global420s then immediateExclusiveReleaseBeforeCollection',
  noSecondInvocationFixRerunAndSourcesReadonly: true,
  guardRequiredAbsentUnchangedWorkerPrelaunchCheckAnd443NamedRawSealsBeforeAfterRequired: true,
  noOtherDynamicGatePermittedDuringExclusiveFullL7StaticOnly: true,
  noFullExecutionPermissionByReservationRecordNoAcceptanceIntegrationOrNativeAuthority: undefined,
  fullOnlyAfterThisSeparateFinalPermission: true, freshFullReviewAndParentIntegrationStillSeparate: true };
writeFileSync(phase + '/l8-runtime16-full-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(reservation.own + '/.tmp/L8_A2_CORRECTIVE_20261016/PARENT_FULL16_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, task: out.task, session: out.session, model: out.model, reservedAt: out.reservedAt, stage: out.stage }));
