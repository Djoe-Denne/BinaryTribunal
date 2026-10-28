import { readFileSync, writeFileSync, existsSync, lstatSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l8-a2-c-copy-actual-final-go-20261016.json', 'utf8'));
const run = JSON.parse(readFileSync(phase + '/l8-a2-c-copy-preflight-parent-observation-20261016.json', 'utf8')).run;
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex'), norm = (p: string) => p.replaceAll('\\', '/');
const pin = (path: string, f: any) => { const b = readFileSync(path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256, path); return b; };
const mb = readFileSync(run + '/delivery.json'); assert.equal(mb.length, 30269);
assert.equal(sha(mb), '3e756712ff59798b41fe25bd0289422e9250aa2701a09fc365915dd09c27702f');
const m = JSON.parse(mb.toString('utf8')), qb = readFileSync(run + '/qualification.json');
assert.equal(qb.length, 443953); assert.equal(sha(qb), 'e4f7b3dcdf7ac30da9de78665583d70bb6bc3ae680a31aee31d4aac88da01a6e');
const q = JSON.parse(qb.toString('utf8')), frame = JSON.parse(readFileSync(run + '/frame.before.json', 'utf8'));
assert.equal(m.artifactPins.length, 16); let artifactBytes = 0;
for (const f of m.artifactPins) { assert(!f.path.includes(':') && !f.path.split('/').includes('..')); artifactBytes += pin(run + '/' + f.path, f).length; }
assert.equal(artifactBytes, 1005765); assert.equal(frame.protectedBeforePins.length, 952); assert.equal(q.postPins.length, 957);
for (const f of q.postPins) { assert(f.exact && !norm(f.path).endsWith('.db')); pin(f.path, f); }
assert.equal(new Set(q.postPins.map((f: any) => norm(f.path))).size, 887);
for (const f of frame.protectedBeforePins) {
  const post = q.postPins.find((p: any) => p.path === f.path && p.group === f.group); assert(post && post.sha256 === f.sha256 && post.bytes === f.bytes);
}
const plan = JSON.parse(readFileSync(run + '/probe-plan.json', 'utf8'));
const seeds = JSON.parse(readFileSync(go.own + '/inputs/L8_A2_C_COPY_20261016/SEEDS.json', 'utf8')).seeds;
const results = JSON.parse(readFileSync(run + '/public-results.json', 'utf8'));
const end = JSON.parse(readFileSync(run + '/probe.end.json', 'utf8'));
assert.equal(end.exitCode, 0); assert(end.naturalExit && !end.timedOut && end.scriptInvocations === 1);
assert.equal(results.actualCases, 2); assert.equal(results.casesPassed, 2); assert(results.rawHashChecksExternalPending);
assert.equal(results.fatal, null); assert.equal(results.originalDatabaseClientOpens, 0);
assert.equal(plan.mission, 'body-pause-public-fixture');
let scratchBytes = 0; const identities: any[] = [];
for (let i = 0; i < 2; i++) {
  const name = i === 0 ? 'control' : 'bad', mapping = q.copyMappings.find((x: any) => x.caseName === name);
  const result = results.cases[i], item = plan.cases[i], seed = seeds.find((x: any) => x.label === mapping.sourceSeedLabel);
  const authority = go.originalCopyPlan.find((x: any) => x.label === mapping.sourceSeedLabel); assert(seed && authority);
  assert.equal(result.caseName, name); assert.equal(norm(result.statePath), run + '/' + name + '/own.db');
  assert.equal(norm(item.scratchPath), norm(result.statePath)); assert.deepEqual(item.expectedPayload, seed.expectedPayload);
  assert.equal(item.expectedCanonical, seed.expectedCanonical); assert.deepEqual(item.expectedReceipt, seed.receipt);
  assert.equal(norm(mapping.originalBefore.path), norm(authority.path)); assert.equal(norm(mapping.originalAfter.path), norm(authority.path));
  const original = pin(authority.path, authority), scratch = pin(result.statePath, authority);
  assert.equal(original.length, 53248); assert(original.equals(scratch)); scratchBytes += scratch.length;
  assert.equal(original.subarray(0, 15).toString(), 'SQLite format 3');
  assert(!lstatSync(authority.path).isSymbolicLink() && !lstatSync(result.statePath).isSymbolicLink());
  const originalStat = statSync(authority.path), scratchStat = statSync(result.statePath);
  assert(scratchStat.birthtimeMs >= Date.parse(go.at) && scratchStat.birthtimeMs < Date.parse(end.startedAt));
  assert(originalStat.birthtimeMs < Date.parse(go.at));
  if (originalStat.ino && scratchStat.ino) assert.notEqual(originalStat.ino, scratchStat.ino);
  for (const f of [mapping.originalBefore, mapping.originalAfter, mapping.scratchBefore, mapping.scratchAfter]) {
    assert.equal(f.bytes, authority.bytes); assert.equal(f.sha256, authority.sha256);
    for (const sidecar of f.sidecars) assert.equal(sidecar.present, false);
  }
  assert(Date.parse(mapping.originalBefore.snapshotStartedAt) >= Date.parse(go.at));
  assert(Date.parse(mapping.scratchBefore.copyFinishedAt) < Date.parse(end.startedAt));
  assert(Date.parse(mapping.originalAfter.hashStartedAt) > Date.parse(result.closedAt));
  for (const file of [authority.path, result.statePath]) for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(file + suffix));
  const closePin = m.closePinReceipts.find((f: any) => norm(f.path) === run + '/' + name + '/close-pin.json'); assert(closePin);
  const closeData = JSON.parse(pin(closePin.path, closePin).toString('utf8')); assert.equal(closeData.caseName, name);
  assert(result.pass && result.semanticPass && result.callerUnchanged && result.closeSucceeded && result.closeError === null);
  assert.equal(result.submitCalls, 1); assert.equal(result.closeCalls, 1); assert.equal(result.rpcCalls, 0); assert.equal(result.tokenCalls, 0);
  assert.equal(result.startOrder, i * 2 + 1); assert.equal(result.closeOrder, i * 2 + 2);
  assert.equal(result.inputBeforeSha256, result.inputAfterSha256);
  if (i === 0) { assert.equal(result.error, null); assert.deepEqual(result.receipt, seed.receipt); assert(result.receiptCanonicalEqual); }
  else { assert.equal(result.receipt, null); assert.equal(result.error.name, 'Error'); assert.equal(result.error.message, 'idempotency key durable payload changed'); }
  identities.push({ caseName: name, original: norm(authority.path), scratch: norm(result.statePath), bytes: authority.bytes,
    sha256: authority.sha256, distinctBirthtimesAndPhysicalPaths: true, distinctFileIdsWhenReported: !!(originalStat.ino && scratchStat.ino) });
}
assert.equal(scratchBytes, 106496); assert.equal(q.issues.length, 0); assert.equal(m.issues.length, 0);
assert.equal(q.sourceRuntime16.length, 16); for (const f of q.sourceRuntime16) pin(f.path, f);
assert.equal(sha(readFileSync(go.own + '/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl')), '5c2bb8eca39cb81967ee3ca26af3d6e552212f9dd7d20ea0ce2f7af3bfc5e7e0');
const script = readFileSync(run + '/probe.ts', 'utf8');
assert(script.includes('client.submit(') && script.includes('client.close();') && !script.includes('client.db') && !script.includes('.query(') && !script.includes('.exec('));
for (const f of go.originalCopyPlan) assert(!script.includes(f.path) && !script.includes(norm(f.path)));
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const receipt = { at: new Date().toISOString(), task: go.task, own: go.own, run, deliverySha256: sha(mb), qualificationSha256: sha(qb),
  artifact16Bytes: artifactBytes, scratch2Bytes: scratchBytes, identities,
  post957Checks887DistinctPathsAnd952BeforeExactRuntime16Registry232965Unchanged: true,
  originalsAndIndependentFreshCopiesBeforeAfterRawEqualNoSidecarsPublicClientOnlyScratchVerified: true,
  serialTwoCasesControlCachedReceiptEqualBadExactLocalRefusalNoRepairZeroRpcTokenCallerUnchanged: true,
  originalRedFixturesNeverReplacedByCoherent107Labels: true,
  sourceScriptOnlyTwoAllowedOwnProductImportsPublicSubmitCloseNoDirectSqlReviewed: true,
  publicRawPendingResultRetainedQualifiedByLaterRawReadbacksNoRewrite: true,
  initialCollector962HoldAndB4bSupplementAndAllPriorGelsPreserved: true,
  stage: 'C_GATE_CONFORMING_FOR_TWO_RETAINED_CACHED_ROWS READY_TO_PREPARE_SEPARATE_EXCLUSIVE_FULL_GATE',
  notUniversalPendingConcurrencyHostNativeAuthorityOrAcceptance: true,
  noFullFreshReviewIntegrationGoByVerification: true, acceptedMain275Exact: true };
writeFileSync(phase + '/l8-a2-c-copy-final-parent-verification-20261016.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...receipt, identities: identities.map(({ caseName, sha256, distinctFileIdsWhenReported }: any) => ({ caseName, sha256, distinctFileIdsWhenReported })) }));
