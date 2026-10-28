import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const old = JSON.parse(readFileSync(phase + '/l7-copy851-review-preparation-request-20261016.json', 'utf8'));
const extra = JSON.parse(readFileSync(phase + '/l7-copy851-preamble-qualification-request-20261016.json', 'utf8'));
const final = JSON.parse(readFileSync(phase + '/l7-copy851-review-target-red-final-parent-verification-20261016.json', 'utf8'));
const red = JSON.parse(readFileSync(phase + '/l7-copy851-review-target-red-parent-observation-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: old.targetSessionId }); assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === old.missionId), task = team.tasks.find((t: any) => t.id === old.taskId);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const auth = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(auth.ready && !auth.pausedTeams.includes(team.id) && !auth.admissionPausedTeams.includes(team.id));
const sourceRoot = phase + '/L7_COPY851_LEDGER_V2_REVIEW_INPUTS_20261016', destination = root + '/inputs/L7_COPY851_LEDGER_V2_REVIEW_20261016'; assert(!existsSync(sourceRoot) && !existsSync(destination));
const files = new Map<string, { bytes: Buffer; kind: string; origin: string }>();
const put = (path: string, bytes: Buffer, kind: string, origin: string) => { assert(!files.has(path) && !path.includes(':') && !path.split('/').includes('..')); assert(bytes.length <= 8 * 1024 * 1024); assert.notEqual(bytes.subarray(0, 15).toString(), 'SQLite format 3'); files.set(path, { bytes, kind, origin }); };
const relocation: Record<string, string> = { 'PARENT/SCOPE.md': 'HISTORICAL/V1_SCOPE.md', 'PARENT/NOTES.json': 'HISTORICAL/V1_NOTES.json', 'REVIEW_INPUT_MANIFEST.json': 'HISTORICAL/V1_REVIEW_INPUT_MANIFEST.json' };
for (const f of old.files) { const b = readFileSync(old.destinationRoot + '/' + f.path); assert.equal(sha(b), f.sha256); put(relocation[f.path] ?? f.path, b, f.kind, 'V1 original391 payload bytes unchanged; three authority metadata paths historical only'); }
for (const f of extra.files) { const b = readFileSync(extra.destinationRoot + '/' + f.path); assert.equal(sha(b), f.sha256); put('PARENT/PREAMBLE_QUALIFICATION/' + f.path, b, f.kind, 'accepted V1 additive NONBLIND qualification bytes unchanged'); }
assert.equal(files.size, 393);
const binding = { relativePath: red.missingFixtureRelativePath, bytes: 8943882, sha256: 'b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4',
  parentAuthorizedLocalMaterializationUnderUserAutonomy: true, notPartOfHelperPayloadOrReceipt: true,
  helperPerFile8MibLimitAndConfigurationUnchangedNoSplitTruncateReserializeOrLink: true,
  sourceRole: 'known frozen offline fixture PARTIAL/quarantined; no new native extraction',
  workerAccessOnlyStagedReadonlyDestinationAfterParentMaterializationAndExplicitAccessGo: true };
const fixture = readFileSync(red.authorOwnedExistingFixture.path); assert.equal(fixture.length, binding.bytes); assert.equal(sha(fixture), binding.sha256);
put('PARENT/SCOPE.md', readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY851_LEDGER_V2_REVIEW_SCOPE_20261016.md'), 'rule', 'current V2 staged authority and one future target gate');
put('PARENT/AUTONOMY_GO.md', readFileSync(root + '/docs/missions/re-graph-scheduler/AUTONOMY_CONTINUATION_20261016.md'), 'rule', 'explicit user autonomous continuation; bounded parent projection decision');
put('PARENT/LARGE_FIXTURE_BINDING.json', Buffer.from(JSON.stringify(binding, null, 2) + '\n'), 'manifest', 'declared separate parent local projection; NOT raw helper transfer');
put('PARENT/TARGET1_FINAL_PARENT.json', readFileSync(phase + '/l7-copy851-review-target-red-final-parent-verification-20261016.json'), 'manifest', 'failed gate final conformity; not an acceptance');
put('PARENT/TARGET1_MISSING_LEDGER_QUALIFIED.md', readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY851_REVIEW_TARGET_RED_MISSING_LEDGER_20261016.md'), 'rule', 'parent omission acknowledged; waiting-human stage superseded by current autonomy');
put('EVIDENCE/TARGET1_QUALIFICATION.json', readFileSync(final.run + '/TARGET_QUALIFICATION.json'), 'knowledge', 'immutable red target evidence, not source oracle');
put('EVIDENCE/TARGET1_ARTIFACTS.json', readFileSync(final.run + '/TARGET_ARTIFACTS.json'), 'manifest', 'immutable failed execution evidence pins, archived paths not access rights');
const notes = { role: 'same fresh independent NONBLIND SolMAX Plan whole-L7 reviewer; source unchanged continuation, task open',
  supersedesV1FalseLedgerUnneededClaimAndAwaitUserProjectionGo: true,
  original393PayloadBytesUnchanged3AuthorityMetadataHistoricalRelocationsOnly: true,
  helperCoversOnlyItsManifestedFilesLargeFixtureParentReceiptSeparatelyRequired: true,
  oldGelsProofs32L7DbAnd636L8DbPreservedNoCrossOwnerAccess: true,
  staticCoverageAndTsc0ReusableOnlyAfterParentSourceIdentityCheckNoRerunImplicit: true,
  stage: 'ACCESS_ONLY complete new contracts helper hashes plus staged large fixture and separate receipt ACK then distinct TARGET_V2_GO',
  extraProbesRemainSuspendedAndNoIntegrationNativeAuthority: true };
put('PARENT/NOTES.json', Buffer.from(JSON.stringify(notes, null, 2) + '\n'), 'rule', 'current stage and exact projection coverage distinction');
const manifest = Buffer.from(JSON.stringify({ ...notes, largeFixtureBinding: binding, files: [...files].map(([path, f]) => ({ path, bytes: f.bytes.length, sha256: sha(f.bytes), kind: f.kind, origin: f.origin })) }, null, 2) + '\n');
put('REVIEW_INPUT_MANIFEST.json', manifest, 'manifest', 'active helper payload pins plus declared non-helper fixture binding');
assert(files.size <= 512); for (const [p, f] of files) { mkdirSync(dirname(sourceRoot + '/' + p), { recursive: true }); writeFileSync(sourceRoot + '/' + p, f.bytes, { flag: 'wx' }); }
const proofDirectory = phase + '/L7_COPY851_LEDGER_V2_PROOFS_20261016'; assert(!existsSync(proofDirectory)); mkdirSync(proofDirectory);
const tempRoot = 'C:/Users/djden/AppData/Local/Temp/opencode/l7rv2-' + randomUUID().replaceAll('-', '').slice(0, 12); assert(!existsSync(tempRoot));
const request = { ...old, sourceRoot, destinationRoot: destination, files: [...files].map(([path, f]) => ({ path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l7-copy851-ledger-v2-preparation-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, destination, proofDirectory, plannedTempRoot: tempRoot,
  files: files.size, bytes: [...files.values()].reduce((n, f) => n + f.bytes.length, 0), manifestSha256: sha(manifest),
  scopeBytes: files.get('PARENT/SCOPE.md')!.bytes.length, scopeSha256: sha(files.get('PARENT/SCOPE.md')!.bytes), largeFixtureBinding: binding,
  userAutonomyReplacesAwaitUserQuestionNoModelPolicyChangeOrNewWorker: true,
  old393ExactAndFixtureSourceHashRecheckedNoOldFreezeOverwriteOrRawFixtureHelperPayload: true,
  stage: 'PREPARED_HELPER_METADATA_INPUTS nativeTransferThenSeparateParentLocalLargeFixtureMaterializationBeforeAccessGo' };
writeFileSync(phase + '/l7-copy851-ledger-v2-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(proofDirectory + '/NATIVE_ADMISSION.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
