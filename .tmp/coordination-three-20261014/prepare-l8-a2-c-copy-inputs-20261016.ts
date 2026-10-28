import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L8_A2_C_COPY_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const verified = JSON.parse(readFileSync(phase + '/l8-a2-amended107-final-parent-verification-20261016.json', 'utf8'));
assert(verified.stage.startsWith('FINAL_DELIVERY_CONFORMING'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: verified.session });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
const own = session.location.directory.replaceAll('\\', '/'); assert(verified.run.startsWith(own + '/.tmp/'));
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === verified.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
for (const f of verified.runtime16) assert.equal(sha(readFileSync(f.path)), f.sha256);
const metadata = readFileSync(own + '/.tmp/L8_A2_CORRECTIVE_20261016/RED-e4394246c19a/future-C-seeds.json');
assert.equal(sha(metadata), 'cd8490c2ae15c123de7c819f63c243b1ad5cec8cc57d97f38c815dbd8e66cdea');
const seeds = JSON.parse(metadata.toString('utf8')).seeds; assert.equal(seeds.length, 2);
assert.deepEqual(seeds.map((s: any) => s.sha256).sort(), [
  '460fb7d25bbede0165e020f22d2205477cca643c09e91fbf2d2c968c835db5c0',
  '282bf344f2dac6d4e4c3ef04def99f0e4ade8086aa1c779581b5f781002d8143',
].sort());
const registryPath = own + '/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl', registry = readFileSync(registryPath);
assert.equal(registry.length, 232965); assert.equal(sha(registry), '5c2bb8eca39cb81967ee3ca26af3d6e552212f9dd7d20ea0ce2f7af3bfc5e7e0');
const qualification = JSON.parse(readFileSync(verified.run + '/qualification.json', 'utf8'));
const delivery = JSON.parse(readFileSync(verified.run + '/delivery.json', 'utf8'));
const baseline = { task: task.id, session: session.id, model: session.model, own,
  runtime16: verified.runtime16, readonly887: qualification.postFullShaPins,
  immutableFinal39: delivery.artifactPins.map((f: any) => ({ ...f, path: verified.run + '/' + f.path })),
  finalDelivery: { path: verified.run + '/delivery.json', bytes: 179582, sha256: verified.deliverySha256 },
  registry: { path: registryPath, bytes: registry.length, sha256: sha(registry), noAppendDuringC: true },
  originalCopyPlan: seeds.map((s: any) => ({ label: s.label, path: s.path, bytes: s.bytes, sha256: s.sha256,
    publicObservedPayloadCoherent: s.publicObservedPayloadCoherent, noOriginalSqliteOpen: true })),
  originalDbBytesNotReadOrCopiedDuringPreparation: true,
  stage: 'ACCESS_ONLY completeReadHashRoleAck before distinct FINAL_C_COPY_ONLY_GO; originals remain sealed' };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L8_A2_LEGACY_C_COPY_GATE_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(baseline, null, 2) + '\n'), kind: 'manifest' },
  { path: 'SEEDS.json', bytes: metadata, kind: 'knowledge' },
  { path: 'PARENT_FINAL.json', bytes: readFileSync(phase + '/l8-a2-amended107-final-parent-verification-20261016.json'), kind: 'manifest' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: task.id, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: own + '/inputs/L8_A2_C_COPY_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l8-a2-c-copy-preparation-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  destination: request.destinationRoot, files: 4, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes),
  runtime16AndRegistry232965ExactFinalDeliveryConforming: true, seedMetadataOriginalDbNotReadCopiedOrOpened: true,
  stage: 'ACCESS_ONLY fullRead4HashRoleConditionsAck before separate FINAL_C_COPY_ONLY_GO no copy or execution yet' };
writeFileSync(phase + '/l8-a2-c-copy-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
