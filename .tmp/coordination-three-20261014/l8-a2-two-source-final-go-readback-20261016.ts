import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-a2-source-write-request-20261016.json', 'utf8'));
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
assert.equal(sha(receipt), 'eb3e3b2bfe48dd5bad0993589dffdbecde283fa01d1d8e070325a3b791def23b');
const baseline = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8'));
assert.equal(baseline.own, own);
for (const f of baseline.runtime15) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
assert.equal(sha(readFileSync(own + '/' + baseline.newTest.path)), baseline.newTest.sha256);
assert.equal(sha(readFileSync(baseline.registry.path)), baseline.registry.sha256);
assert.equal(readFileSync(baseline.registry.path).length, 157257);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  actual54LineDecisionAndAll3Pins9554BytesRoleConditionsFullReadAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipGuardRuntime15NewTestRegistryExactBeforePermission: true,
  stage: 'FINAL_TWO_SOURCE_WRITE_ONLY_GO according to ratified A-E then HOLD for distinct execution gates',
  allowedSources: baseline.allowedSources, newTest70857679AndOther13RuntimeAnd60OldReadonly: true,
  noModuleLoadProbeTypecheckTestSqliteScratchCopyReopenRegistryAppendOrIntegrationGo: true,
  L7BlockedRoutingWaitSeparate: true, noNativeAuthority: true };
writeFileSync(phase + '/l8-a2-two-source-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(own + '/.tmp/L8_A2_CORRECTIVE_20261016/PARENT_TWO_SOURCE_WRITE_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
