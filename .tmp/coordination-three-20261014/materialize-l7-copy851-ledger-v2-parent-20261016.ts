import { readFileSync, writeFileSync, chmodSync, statSync, lstatSync, existsSync, symlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-preparation-request-20261016.json', 'utf8'));
const admission = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-native-inputs-20261016.json', 'utf8'));
const red = JSON.parse(readFileSync(phase + '/l7-copy851-review-target-red-parent-observation-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId }); assert.deepEqual(session.model, admission.model);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId), task = team.tasks.find((t: any) => t.id === q.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
let helperBytes = 0;
for (const f of q.files) { const b = readFileSync(q.destinationRoot + '/' + f.path); assert.equal(sha(b), f.sha256); assert(b.length <= 8 * 1024 * 1024); helperBytes += b.length; }
assert.equal(q.files.length, 402); assert.equal(helperBytes, 9300341);
const helperReceipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json'), hr = JSON.parse(helperReceipt.toString('utf8'));
assert.equal(hr.fingerprint, 'c95d16e8a9af1f6eb9e0b82cf20354c09a3b8071b32a0d51ebc4531c6108e77c'); assert.equal(hr.files.length, 402);
const binding = JSON.parse(readFileSync(q.destinationRoot + '/PARENT/LARGE_FIXTURE_BINDING.json', 'utf8'));
assert(!q.files.some((f: any) => f.path === binding.relativePath));
assert(!binding.relativePath.includes(':') && !binding.relativePath.split('/').includes('..'));
const dest = q.destinationRoot + '/' + binding.relativePath; assert(!existsSync(dest));
assert(lstatSync(red.authorOwnedExistingFixture.path).isFile() && !lstatSync(red.authorOwnedExistingFixture.path).isSymbolicLink());
const source = readFileSync(red.authorOwnedExistingFixture.path); assert.equal(source.length, 8943882); assert.equal(sha(source), binding.sha256);
writeFileSync(dest, source, { flag: 'wx' }); chmodSync(dest, 0o444);
const result = readFileSync(dest); assert.equal(result.length, binding.bytes); assert.equal(sha(result), binding.sha256); assert.equal(statSync(dest).mode & 0o222, 0);
assert.equal(sha(readFileSync(red.authorOwnedExistingFixture.path)), binding.sha256);
for (const name of ['l7-copy851-review-preparation-request-20261016.json', 'l7-copy851-preamble-qualification-request-20261016.json']) { const old = JSON.parse(readFileSync(phase + '/' + name, 'utf8')); for (const f of old.files) assert.equal(sha(readFileSync(old.destinationRoot + '/' + f.path)), f.sha256); }
const receipt = { schemaVersion: 'parent-local-large-fixture-v1', at: new Date().toISOString(), missionId: q.missionId, taskId: task.id, session: session.id, model: session.model,
  destinationRoot: q.destinationRoot, fixture: { path: binding.relativePath, bytes: result.length, sha256: sha(result), readOnlyAttribute: true },
  sourceProvenanceOnlyNotWorkerAccessPermission: red.authorOwnedExistingFixture.path,
  sourceBeforeAfterShaExact: true, allOld393PayloadsStillExactAndUnmodified: true,
  userAutonomyAndExplicitParentOneFixtureProjectionDecision: true,
  helperReceiptFingerprint: hr.fingerprint, helperReceiptFileSha256: sha(helperReceipt), helperCoveredFiles: 402, helperCoveredBytes: helperBytes,
  separateLocalFixtureFiles: 1, separateLocalFixtureBytes: result.length, combinedPayloadFiles: 403, combinedPayloadBytes: helperBytes + result.length,
  helperDidNotTransferOrCoverLargeFixturePerFileCapAndConfigurationUnchangedNoSplitTruncateReserializeOrLink: true,
  noNativeExtractionOrScientificAcceptanceNoWorkerAccessProofByReceipt: true,
  state: 'parent-projection-complete-await-worker-read-hash-ack-and-distinct-target-v2-go' };
const rb = Buffer.from(JSON.stringify(receipt, null, 2) + '\n'); writeFileSync(q.destinationRoot + '/LARGE_FIXTURE_PARENT_RECEIPT.json', rb, { flag: 'wx' });
writeFileSync(admission.proofDirectory + '/LARGE_FIXTURE_PARENT_RECEIPT.json', rb, { flag: 'wx' });
const junction = q.destinationRoot + '/tools/ff8-harness/node_modules'; assert(!existsSync(junction)); symlinkSync(root + '/tools/ff8-harness/node_modules', junction, 'junction');
assert(!existsSync(admission.plannedTempRoot));
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, destination: q.destinationRoot, proofDirectory: admission.proofDirectory,
  helper402Files9300341BytesExact: true, helperReceiptFileBytes: helperReceipt.length, helperReceiptFileSha256: sha(helperReceipt),
  locallyMaterializedLedger8943882BytesShaB5c9ReadOnlyAndSourceBeforeAfterExact: true,
  parentProjectionReceiptBytes: rb.length, parentProjectionReceiptSha256: sha(rb), total403PayloadFiles18244223Bytes: true,
  old393AndAllPriorGelsUntouchedNoSourceCodeTestOrHelperLimitChange: true,
  dependencyJunctionOnlyNoInstallAndPlannedTempAbsent: true,
  stage: 'ACCESS_ONLY completeActiveContractsHash402PlusOneLargeFixtureBothReceiptsAndRoleConditionsAck before distinctTARGET_V2_GO' };
writeFileSync(phase + '/l7-copy851-ledger-v2-parent-materialization-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
