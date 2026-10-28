import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const original = JSON.parse(readFileSync(phase + '/l8-runtime16-review-preparation-request-20261016.json', 'utf8'));
const admission = JSON.parse(readFileSync(phase + '/l8-runtime16-review-native-admission-20261016.json', 'utf8'));
assert(!existsSync(original.destinationRoot), 'First failure must not have delivered a partial package');
const sourceRoot = phase + '/L8_RUNTIME16_REVIEW_INPUTS_20261016_SCHEMA2'; assert(!existsSync(sourceRoot));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const oldManifestBytes = readFileSync(original.sourceRoot + '/REVIEW_INPUT_MANIFEST.json'); assert.equal(sha(oldManifestBytes), admission.manifestSha256);
const oldManifest = JSON.parse(oldManifestBytes.toString('utf8')), allowed = new Set(['native', 'source', 'test', 'rule', 'knowledge', 'proposal', 'score', 'manifest']);
const files: Array<{ path: string; bytes: Buffer; kind: string; origin: string }> = [];
const changedKinds: string[] = [];
for (const f of oldManifest.files) {
  const bytes = readFileSync(original.sourceRoot + '/' + f.path); assert.equal(sha(bytes), f.sha256);
  const kind = f.kind === 'code' ? 'source' : f.kind; assert(allowed.has(kind));
  if (kind !== f.kind) changedKinds.push(f.path);
  files.push({ path: f.path, bytes, kind, origin: f.origin });
}
assert.equal(changedKinds.length, 9);
const correction = { at: new Date().toISOString(), originalManifestSha256: sha(oldManifestBytes),
  rejectedRequest: 'l8-runtime16-review-preparation-request-20261016.json', rejectedAtInputValidationBeforeDestinationOrWorkerAccess: true,
  reason: 'nine kind=code values invalid under mechanical-preparation.ts; source is canonical kind',
  changedKinds, onlyKindsAndThisAuditMetadataAndManifestChangedAll463PayloadBytesUnchanged: true,
  scopeAndAllRuntime16SourceBytesUnchangedNoHelperConfigModelPolicyOrPermissionChange: true,
  noProductReviewTscTestsProbeOrDbByCorrection: true, stageStillAccessOnlyAfterParentSendsNoImplicitReviewGo: true };
files.push({ path: 'PARENT/SCHEMA_CORRECTION.json', bytes: Buffer.from(JSON.stringify(correction, null, 2) + '\n'), kind: 'manifest', origin: 'explicit parent input-schema correction; original rejected package preserved' });
const manifest = Buffer.from(JSON.stringify({ ...oldManifest, schemaCorrection: correction,
  files: files.map(f => ({ path: f.path, bytes: f.bytes.length, sha256: sha(f.bytes), kind: f.kind, origin: f.origin })) }, null, 2) + '\n');
files.push({ path: 'REVIEW_INPUT_MANIFEST.json', bytes: manifest, kind: 'manifest', origin: 'corrected canonical-kind full package manifest' });
assert.equal(files.length, 465);
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: original.targetSessionId });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === original.missionId);
const task = team.tasks.find((t: any) => t.id === original.taskId); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-runtime16-review');
for (const f of files) { mkdirSync(dirname(sourceRoot + '/' + f.path), { recursive: true }); writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' }); }
const request = { ...original, sourceRoot, files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l8-runtime16-review-schema2-preparation-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { ...admission, at: new Date().toISOString(), files: files.length, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  manifestSha256: sha(manifest), originalRejectedPackageRetained: true, invalidKindCountCorrected: 9,
  original463PayloadBytesAndScopeAndRuntime16Unchanged: true,
  stage: 'SCHEMA2_ACCESS_ONLY completeRead465HashRoleConditionsAck before distinct STATIC_REVIEW_GO no dynamic execution' };
writeFileSync(phase + '/l8-runtime16-review-schema2-native-admission-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(admission.proofDirectory + '/NATIVE_ADMISSION_SCHEMA2.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
