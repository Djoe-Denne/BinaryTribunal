import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-a2-c-copy-preparation-request-20261016.json', 'utf8'));
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
assert.equal(sha(receipt), 'ed15bfc35d01eaa50749d5e7d38950ece2bbd701d00e3f0f620d7c80bd49420b');
const baseline = JSON.parse(readFileSync(q.destinationRoot + '/BASELINE.json', 'utf8')); assert.equal(baseline.own, own);
assert.equal(baseline.runtime16.length, 16); assert.equal(baseline.readonly887.length, 887); assert.equal(baseline.immutableFinal39.length, 39);
for (const f of [...baseline.runtime16, ...baseline.readonly887, ...baseline.immutableFinal39, baseline.finalDelivery, baseline.registry]) {
  const b = readFileSync(f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256);
}
assert.equal(baseline.originalCopyPlan.length, 2);
assert.equal(baseline.originalCopyPlan.filter((f: any) => f.publicObservedPayloadCoherent).length, 1);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  actual66LineDecision6563LineBaseline196LineSeeds137LineParent4Pins426308BytesRoleConditionsAckApproved: true,
  receiptFileSha256: sha(receipt), nativeOwnershipGuardRuntime16Readonly887Final39DeliveryRegistry232965Exact: true,
  originalDbBytesNotReadHashedCopiedOrOpenedByThisReadback: true,
  stage: 'FINAL_C_COPY_ONLY_GO two exact originalRed byte copies then one public cachedClient probe60s twoSerialCases',
  originalCopyPlan: baseline.originalCopyPlan,
  originalReadHashCopyOnlyNeverSqliteClientCliOriginals: true,
  publicClientOnlyScratchExpectedControlReceiptBadLocalBindingRefusalZeroFakeRpcToken: true,
  beforeAfterHashesClosesInputsReadonlyAndNoRegistryAppendRequired: true,
  anyFailureHoldNoFixRerunOrReplacementCopy: true,
  noTypecheckTestsFullFreshReviewIntegrationOrNativeAuthority: true,
  L7IndependentSmallMemoryRedMayContinue: true };
writeFileSync(phase + '/l8-a2-c-copy-actual-final-go-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(own + '/.tmp/L8_A2_CORRECTIVE_20261016/PARENT_C_COPY_GO.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, originalCopyPlan: out.originalCopyPlan.map((f: any) => ({ label: f.label, sha256: f.sha256 })) }));
