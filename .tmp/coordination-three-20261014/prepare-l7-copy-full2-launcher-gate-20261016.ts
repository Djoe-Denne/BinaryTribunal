import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L7_COPY_FULL2_GATE_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const v = JSON.parse(readFileSync(phase + '/l7-copy-full-red-final-parent-verification-20261016.json', 'utf8'));
assert(v.stage.startsWith('FAILED_FULL_DELIVERY_CONFORMING'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: v.session });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6-astra', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), v.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === v.task); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
const auth = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(auth.ready && !auth.pausedTeams.includes(team.id) && !auth.admissionPausedTeams.includes(team.id));
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const prior = JSON.parse(readFileSync(v.own + '/inputs/L7_COPY_FULL_GATE_20261016/BASELINE.json', 'utf8'));
for (const f of prior.current370) { const b = readFileSync(v.own + '/' + f.path); assert.equal(sha(b), f.sha256); }
const pre = JSON.parse(readFileSync(v.run + '/preflight.json', 'utf8'));
assert.equal(pre.readonlyProofs.length, 50);
for (const f of pre.readonlyProofs) assert.equal(sha(readFileSync(f.path.includes(':') ? f.path : v.own + '/' + f.path)), f.sha256);
for (const p of pre.packets) {
  const base = v.own + '/' + p.path, rb = readFileSync(base + '/.preparation-receipt.json'); assert.equal(sha(rb), p.receiptSha256);
  for (const f of JSON.parse(rb.toString('utf8')).files) assert.equal(sha(readFileSync(base + '/' + f.path)), f.sha256);
}
const ab = readFileSync(v.run + '/ARTIFACTS.json'); assert.equal(sha(ab), v.manifestSha256);
const red26 = JSON.parse(ab.toString('utf8')).files.map((f: any) => ({ ...f, path: v.run + '/' + f.path }));
for (const f of red26) assert.equal(sha(readFileSync(f.path)), f.sha256);
const retained = JSON.parse(readFileSync(v.run + '/retained-db-manifest.json', 'utf8'));
const oldDb = [...retained.graph.map((f: any) => ({ path: f.path, bytes: f.postExit.bytes, sha256: f.postExit.sha256, origin: 'red full1 explicit stdout graph return per-close/post-exit exact' })),
  ...retained.l5.map((f: any) => ({ path: f.path, bytes: f.postExit.bytes, sha256: f.postExit.sha256, origin: 'red full1 L5 explicit child return first hash post-exit only' }))];
assert.equal(oldDb.length, 11); assert.equal(oldDb.reduce((n, f) => n + f.bytes, 0), 3321856);
for (const f of oldDb) { const b = readFileSync(f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); for (const s of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + s)); }
const suffix = randomUUID().replaceAll('-', '').slice(0, 12), proofRoot = v.own + '/.tmp/L7_COPY_BOUNDARY_20261016/FULL2-' + suffix;
const tempRoot = 'C:/Users/djden/AppData/Local/Temp/opencode/l7f2-' + suffix;
assert(tempRoot.length < 100 && !existsSync(tempRoot) && !existsSync(proofRoot));
assert.equal(Object.keys(process.env).filter(k => k.toUpperCase() === 'FF8_ENSEMBLE_SOURCE').length, 0);
const baseline = { ...prior, stage: 'FULL2_LAUNCHER_ONLY_ACCESS_ONLY no physical extra preflight or new roots before final go',
  old50Proofs: pre.readonlyProofs, oldFull1Proof26: red26,
  oldFull1Artifacts: { path: v.run + '/ARTIFACTS.json', bytes: ab.length, sha256: sha(ab) },
  packets: pre.packets, oldFull1Root: v.run, newProofRoot: proofRoot, tempRoot, requiredNestedDirectory: tempRoot + '/opencode',
  shortTempNotCreatedByPreparationAndNeverReuseOrDeleteExistingPath: true,
  onlyChildSpawnTempTmpOverrideNoProcessEnvMutation: true,
  rootPrelaunchExpectedEntries: ['opencode'], nestedExpectedEmpty: true,
  command: 'bun test --timeout 30000', globalLimitMs: 420000, childLimitMs: 415000,
  source851AndTestsCbNoChangesNoNewTscOrProbe: true,
  old11DbExplicitNamedRawBeforeAfterGateNoOtherOwnerAccess: true };
const oldManifest = { files: oldDb, totalBytes: 3321856, number: 11, sidecars: ['-wal', '-shm', '-journal'],
  allAbsentExpectedBeforeAfter: true, noSqliteOpenOrMutationOrGlob: true,
  physicalWorkerAccessOnlyAfterDistinctFinalFull2Go: true, old636L8AndForeignL7DbNotAccessible: true };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_FULL2_LAUNCHER_GATE_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(baseline, null, 2) + '\n'), kind: 'manifest' },
  { path: 'OLD_FULL_DB_PINS.json', bytes: Buffer.from(JSON.stringify(oldManifest, null, 2) + '\n'), kind: 'manifest' },
  { path: 'CLEANUP_INVENTORY.json', bytes: readFileSync(v.own + '/inputs/L7_COPY_FULL_GATE_20261016/CLEANUP_INVENTORY.json'), kind: 'rule' },
  { path: 'LEGACY_EPHEMERAL_RULE.md', bytes: readFileSync(v.own + '/inputs/L7_COPY_FULL_GATE_20261016/LEGACY_EPHEMERAL_RULE.md'), kind: 'rule' },
  { path: 'PARENT_RED_CHECK.json', bytes: readFileSync(phase + '/l7-copy-full-red-final-parent-verification-20261016.json'), kind: 'manifest' },
  { path: 'USER_GO.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_LAUNCHER_ONLY_USER_GO_20261016.md'), kind: 'rule' },
]; mkdirSync(sourceRoot); for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const q = { schemaVersion: 1, missionId: team.id, taskId: v.task, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: v.own + '/inputs/L7_COPY_FULL2_GATE_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l7-copy-full2-gate-request-20261016.json', JSON.stringify(q, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: v.task, session: session.id, model: session.model, own: v.own,
  destination: q.destinationRoot, files: files.length, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes), tempRoot, proofRoot,
  userSelectedNewAttemptRecommendedButAccessAckReservationFinalGoStillRequired: true,
  all370PinsLedgerOldProofs26FailedFullAnd11Db3321856ExactBeforePreparation: true,
  noTempOrFullRootCreatedNoProductExecutedNoSourceOrConfigChanged: true,
  stage: 'ACCESS_ONLY completeRead7HashRoleConditionsAck then newExclusiveReservationAndDistinctFINAL_FULL2_GO pending' };
writeFileSync(phase + '/l7-copy-full2-gate-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
