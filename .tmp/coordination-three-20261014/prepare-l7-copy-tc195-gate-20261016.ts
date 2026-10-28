import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L7_COPY_TC195_GATE_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const verified = JSON.parse(readFileSync(phase + '/l7-copy-source-static-parent-verification-20261016.json', 'utf8'));
const release = JSON.parse(readFileSync(phase + '/l8-runtime16-full-natural-release-parent-20261016.json', 'utf8'));
assert(release.authorExplicitExclusiveReleaseAtNaturalEndBeforeCollection);
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: 'ses_ebaf6d8c9ffeEq9w6t6V1gxFrE' });
assert.deepEqual(session.model, { id: 'gpt-6-astra', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), verified.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === verified.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
const old = JSON.parse(readFileSync(verified.own + '/inputs/L7_COPY_SOURCE_WRITE_20261016/BASELINE.json', 'utf8'));
const current = old.baseline369.map((f: any) => f.path === verified.sourcePath ? { ...f, bytes: verified.sourceBytes, sha256: verified.sourceSha256 } : f);
for (const f of current) { const b = readFileSync(verified.own + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); }
const test = readFileSync(verified.own + '/' + old.newTest.path); assert.equal(sha(test), old.newTest.sha256);
const manifest = readFileSync(verified.run + '/ARTIFACTS.json'); assert.equal(sha(manifest), verified.manifestSha256);
const write8 = JSON.parse(manifest.toString('utf8')).files.map((f: any) => ({ ...f, path: verified.run + '/' + f.path }));
for (const f of write8) assert.equal(sha(readFileSync(f.path)), f.sha256);
const beforePins = JSON.parse(readFileSync(verified.run + '/before-pins.json', 'utf8'));
const baseline = { task: task.id, session: session.id, model: session.model, own: verified.own,
  current370: [...current, old.newTest], readonlyWrite8: write8,
  writeArtifacts: { path: verified.run + '/ARTIFACTS.json', bytes: manifest.length, sha256: sha(manifest) },
  red10: old.red10, redArtifacts: old.redArtifacts, oldProofs: beforePins.oldProofs, packets: beforePins.packets,
  publicDto33: beforePins.publicDtos, sourceImage851NotTypecheckedYet: true,
  L8FullReleasedBeforePreparationNoRightToReadItsFixtures: true,
  stage: 'ACCESS_ONLY readHashConditionsAck then separate TC_THEN_195_ONLY_GO no execution yet' };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_TC195_GATE_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(baseline, null, 2) + '\n'), kind: 'manifest' },
  { path: 'PARENT_STATIC.json', bytes: readFileSync(phase + '/l7-copy-source-static-parent-verification-20261016.json'), kind: 'manifest' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: task.id, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: verified.own + '/inputs/L7_COPY_TC195_GATE_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l7-copy-tc195-gate-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own: verified.own,
  destination: request.destinationRoot, files: files.length, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes), current370AndWrite8ExactL8FullReleased: true,
  stage: 'ACCESS_ONLY fullRead3HashRoleConditionsAck then distinct TC_THEN_195_ONLY_GO pending no product execution yet' };
writeFileSync(phase + '/l7-copy-tc195-gate-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
