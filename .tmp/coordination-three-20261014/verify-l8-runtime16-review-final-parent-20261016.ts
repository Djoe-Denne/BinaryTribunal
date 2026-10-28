import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l8-runtime16-review-dynamic-actual-final-go-20261016.json', 'utf8'));
const q = JSON.parse(readFileSync(phase + '/l8-runtime16-review-schema2-preparation-request-20261016.json', 'utf8'));
const run = go.proofDirectory + '/DYNAMIC-62456fc9-9739-4956-990b-cd9191b73af3';
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex'), norm = (p: string) => p.replaceAll('\\', '/');
const pin = (path: string, f: any) => { const b = readFileSync(path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256, path); return b; };
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: q.targetSessionId });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' });
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === q.missionId);
assert.equal(team.tasks.find((t: any) => t.id === q.taskId).status, 'completed');
assert.equal(team.members.find((m: any) => m.name === 'l8-runtime16-review').sessionId, session.id);
const mb = readFileSync(run + '/FINAL_DELIVERY.json'); assert.equal(mb.length, 6101);
assert.equal(sha(mb), '1ef4e304daf54eb119bed7cb4f68e6ddb22a08590e90c050cd42fdf4627f1ff7');
const m = JSON.parse(mb.toString('utf8')); assert.equal(m.proofFiles.length, 15); let proofBytes = 0;
for (const f of m.proofFiles) { assert(!f.path.includes(':') && !f.path.split('/').includes('..')); proofBytes += pin(run + '/' + f.path, f).length; }
const integrity = JSON.parse(readFileSync(run + '/final-integrity.json', 'utf8'));
assert.equal(sha(readFileSync(run + '/final-integrity.json')), 'abdacc67a753e20cd5f4a8bd13648cabeca359ab57f29ebe0dd3c0dffe036410');
let inputBytes = 0; assert.equal(q.files.length, 465);
for (const f of q.files) { const b = readFileSync(q.destinationRoot + '/' + f.path); assert.equal(sha(b), f.sha256); inputBytes += b.length; }
assert.equal(inputBytes, 9144956); assert.equal(integrity.pinFailures.length, 0);
assert.equal(sha(readFileSync(q.destinationRoot + '/.preparation-receipt.json')), '32fc0390975a9e46ea84caad31909b84634a47b04dd208ada66ae92313b49b72');
const tc = JSON.parse(readFileSync(run + '/typecheck.run.json', 'utf8')), focused = JSON.parse(readFileSync(run + '/focused.run.json', 'utf8'));
const independent = JSON.parse(readFileSync(run + '/independent.run.json', 'utf8'));
for (const r of [tc, focused, independent]) { assert.equal(r.status, 0); assert.equal(r.signal, null); assert.equal(r.error, null); assert.equal(r.invocations, 1); assert(Date.parse(r.end) > Date.parse(r.start)); }
assert(tc.durationMs < 120000 && focused.durationMs < 180000 && independent.durationMs < 60000);
assert(Date.parse(tc.end) < Date.parse(focused.start) && Date.parse(focused.end) < Date.parse(independent.start));
assert.equal(focused.command, go.testsOnlyAfterTypecheck0AndPostPins.command);
const stdout = pin(run + '/focused.stdout.log', { bytes: focused.stdoutBytes, sha256: focused.stdoutSha256 });
const stderr = pin(run + '/focused.stderr.log', { bytes: focused.stderrBytes, sha256: focused.stderrSha256 });
const log = stdout.toString('utf8') + '\n' + stderr.toString('utf8');
for (const text of ['107 pass', '0 fail', '714 expect', '107 tests across 7 files']) assert(log.includes(text));
const independentLog = readFileSync(run + '/independent.stdout.log'); assert.equal(sha(independentLog), independent.stdoutSha256);
const probes = JSON.parse(independentLog.toString('utf8')); assert.equal(probes.cases, 6); assert.equal(probes.extraDatabases, 0); assert.equal(probes.unitsPerFixture, 2);
assert(probes.results.every((r: any) => r.pass)); assert.equal(probes.authorityOrPublicationCreated, false);
assert.equal(probes.results.find((r: any) => r.id.startsWith('P5-')).readiness.ready, false);
assert(probes.results.find((r: any) => r.id.startsWith('P6-')).refusal.includes('actual current config/spec/input/cycle'));
const script = readFileSync(run + '/independent-projection.mjs', 'utf8');
assert(script.includes('graphInputs(') && script.includes('evaluateReadiness(') && !script.includes('new Database') && !script.includes('.db.exec') && !script.includes('.db.query'));
const c = JSON.parse(readFileSync(run + '/focused.collection.json', 'utf8')); assert.equal(c.dbs.length, 96); assert.equal(c.receipts.length, 96);
assert.equal(c.bad.length, 0); assert.equal(c.sidecars.length, 0); assert.equal(c.pinBad.length, 0);
const registryPath = q.destinationRoot + '/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl', registry = readFileSync(registryPath);
assert.equal(registry.length, 75708); assert.equal(sha(registry), '99dab6500e45260e73ed1ab8361e836e66388d2b7b1e49f7353ad7203d37426d');
const rows = registry.toString('utf8').trim().split('\n').map(JSON.parse), reserved = rows.filter((r: any) => r.event === 'reserved'), closes = rows.filter((r: any) => r.event === 'closed-and-pinned');
assert.equal(rows.length, 275); assert.equal(reserved.length, 179); assert.equal(closes.length, 96);
const roots = new Set(reserved.map((r: any) => norm(r.path))), retained = new Map<string, any>(); let dbBytes = 0;
const authorFull = JSON.parse(readFileSync(phase + '/l8-runtime16-full-final-parent-verification-20261016.json', 'utf8'));
const oldPaths = new Set(JSON.parse(readFileSync(authorFull.run + '/database-index.json', 'utf8')).files.map((f: any) => norm(f.path)));
for (const f of c.dbs) {
  const path = norm(f.path); assert(roots.has(path) && !oldPaths.has(path) && !retained.has(path));
  const bytes = pin(f.path, f); assert.equal(bytes.subarray(0, 15).toString(), 'SQLite format 3');
  assert(statSync(f.path).birthtimeMs >= Date.parse(focused.start) && statSync(f.path).birthtimeMs <= Date.parse(focused.end));
  const close = closes.find((r: any) => norm(r.path) === path); assert(close);
  const receiptPin = c.receipts.find((r: any) => norm(r.path) === norm(close.receipt)); assert(receiptPin); assert.equal(receiptPin.sha256, close.sha256);
  const receipt = JSON.parse(pin(receiptPin.path, receiptPin).toString('utf8'));
  assert(receipt.closedNoWalShm && receipt.files.length === 1); assert.equal(norm(receipt.files[0].path), path);
  assert.equal(receipt.files[0].sha256, f.sha256); assert.equal(receipt.files[0].bytes, f.bytes);
  for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + suffix));
  dbBytes += f.bytes; retained.set(path, f);
}
assert.equal(dbBytes, 24633344); for (const p of roots) if (!retained.has(p)) assert(!existsSync(p));
assert.equal(integrity.afterAll.length, 1); const ap = integrity.afterAll[0], early = JSON.parse(pin(ap.path, ap).toString('utf8'));
assert.equal(early.files.length, 6); const earlySet = new Set(early.files.map((f: any) => norm(f.path))), indexTime = statSync(ap.path).mtimeMs;
for (const f of early.files) { const db = retained.get(norm(f.path)); assert(db && db.sha256 === f.sha256 && db.bytes === f.bytes); }
for (const [path] of retained) if (!earlySet.has(path)) assert(statSync(path).birthtimeMs > indexTime);
assert.equal(m.retention.retainedOpaqueCache.length, 1); const cache = m.retention.retainedOpaqueCache[0];
assert(norm(cache.path).startsWith(run + '/temp/')); assert.equal(pin(cache.path, cache).length, 1357764);
assert.equal(readFileSync(cache.path).subarray(0, 15).toString() === 'SQLite format 3', false);
assert.equal(m.verdict, 'ACCEPTABLE_SCOPED_OFFLINE_ONLY'); assert.equal(m.blockingDefectsFound.length, 0);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: q.taskId, session: session.id, model: session.model, run,
  completedReviewNeverReopen: true, finalDeliverySha256: sha(mb), proof15Bytes: proofBytes,
  freshNonblindWholeRuntime16ScopedAcceptableReceivableNotGlobalAcceptance: true,
  all465Pins9144956BytesRuntime16UnchangedAuthorMain275Preserved: true,
  oneTypecheck0One107Pass714AssertionsAndOnePure6CaseProbe0ExtraDbVerified: true,
  new96Db24633344BytesDistinctOld540PathsPerClose96ReceiptsRawEqualNoSidecars: true,
  ownRegistry75708Bytes275Rows179Reservations96Closed83AbsentAndEarly6Plus90LaterQualified: true,
  nodeCache1357764BytesOpaqueRetainedNoSqliteNoDeletionClaim: true,
  publicFactsProbeIsConfigurationProjectionNotAuthorizationProofNoRevocationPolicyInvented: true,
  adapterApproveKnowledgeBindingForAcquiredPublicFactsRetainedNoClaimMetadataAloneAuthorizesNativeReads: true,
  G1OrderingEvidenceNotFutureArtifactAcquisitionFrozenSourceChangeStillFailClosed: true,
  scopeOfflineFixtureOnlyNoNativeScienceInteropGlobalQAOrL8IntegrationAcceptance: true,
  stage: 'INDEPENDENT_RUNTIME16_REVIEW_ACCEPTABLE_RECEIVABLE_PARENT_FINAL_INTEGRATION_AND_CROSS_QA_GATES_STILL_OPEN',
  noReviewerResumeSourceFixNewTestProbeFullOrIntegrationGo: true };
writeFileSync(phase + '/l8-runtime16-review-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
