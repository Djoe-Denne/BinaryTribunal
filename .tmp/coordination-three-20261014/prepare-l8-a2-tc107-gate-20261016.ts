import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L8_A2_TC107_GATE_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const verified = JSON.parse(readFileSync(phase + '/l8-a2-source-delivery-parent-verification-20261016.json', 'utf8'));
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: 'ses_ec12fcc43ffeI6xXQ5rSTty2mV' });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), verified.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === verified.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
for (const f of verified.runtime16) assert.equal(sha(readFileSync(f.path)), f.sha256);
const registryPath = verified.own + '/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl', registry = readFileSync(registryPath);
assert.equal(registry.length, 157257); assert.equal(sha(registry), '11607270d18e115b56306336f351ddbfe7d6fd5c12d859954d5ebe0302f08b3e');
const before = { task: task.id, session: session.id, model: session.model, own: verified.own,
  runtime16: verified.runtime16, readonlyPins: JSON.parse(readFileSync(verified.run + '/post-static-pins.json', 'utf8')).readonlyPostPins,
  registry: { path: registryPath, bytes: registry.length, sha256: sha(registry), upcomingHelperAppendOnlyAfterFinalGo: true },
  sourceWriteDelivery: verified.sourceWriteDeliverySha256, noFixRerunOrScratchAuthority: true };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L8_A2_TYPECHECK_107_GATE_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(before, null, 2) + '\n'), kind: 'manifest' },
  { path: 'PARENT_SOURCE_CHECK.json', bytes: readFileSync(phase + '/l8-a2-source-delivery-parent-verification-20261016.json'), kind: 'manifest' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: task.id, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: verified.own + '/inputs/L8_A2_TC107_GATE_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l8-a2-tc107-preparation-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own: verified.own,
  destination: request.destinationRoot, files: 3, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes), runtime16AndRegistryStillExact: true,
  stage: 'ACCESS_ONLY actualFullReadHashConditionsAck then separate TC_THEN_107_ONLY_GO pending' };
writeFileSync(phase + '/l8-a2-tc107-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
