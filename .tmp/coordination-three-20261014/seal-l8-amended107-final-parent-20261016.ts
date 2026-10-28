import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const prior = JSON.parse(readFileSync(phase + '/l8-a2-amended107-raw-parent-verification-20261016.json', 'utf8'));
const run = prior.run, sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const mb = readFileSync(run + '/delivery.json'); assert.equal(mb.length, 179582);
assert.equal(sha(mb), '90f55b573b3f5df3695379492730271815beb3b62a1b9c0ee0731298eb14c819');
const m = JSON.parse(mb.toString('utf8')), q = JSON.parse(readFileSync(run + '/qualification.json', 'utf8'));
assert.equal(sha(readFileSync(run + '/qualification.json')), prior.initialHoldQualificationSha256);
assert.equal(sha(readFileSync(run + '/AFTERALL_SCOPE_SUPPLEMENT.json')), prior.scopeSupplementSha256);
assert.equal(m.artifactPins.length, 39); let artifactBytes = 0;
for (const f of m.artifactPins) {
  assert(!f.path.includes(':') && !f.path.split('/').includes('..'));
  const b = readFileSync(run + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); artifactBytes += b.length;
}
assert.equal(artifactBytes, 4333845); assert.equal(m.runtime16.count, 16); let runtimeBytes = 0;
for (const f of m.runtime16.pins) {
  const b = readFileSync(f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); assert(b.equals(readFileSync(f.frozenPath))); runtimeBytes += b.length;
}
assert.equal(runtimeBytes, 365568); assert.equal(m.databasePins.length, 96); let dbBytes = 0;
for (const f of m.databasePins) {
  const old = q.retainedDatabases.find((x: any) => x.path === f.path); assert(old && old.sha256 === f.sha256 && old.bytes === f.bytes);
  const b = readFileSync(f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); dbBytes += b.length;
}
assert.equal(dbBytes, 24633344); assert.equal(m.ownedNewFileCount, 201); assert.equal(m.ownedNewFileBytes, 24768944);
assert.equal(m.collectorExpectationCorrection.remainingUnexplainedCollectorContradictions.length, 0);
assert.equal(m.invocationsThisGo.typecheck, 1); assert.equal(m.invocationsThisGo.named107, 1);
for (const key of ['reruns', 'extraProbes', 'CChecker', 'full']) assert.equal(m.invocationsThisGo[key], 0);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: m.taskId, session: m.session, model: m.model, run,
  deliverySha256: sha(mb), artifact39Bytes: artifactBytes, runtime16: m.runtime16.pins, runtime16Bytes: runtimeBytes,
  rawEvidenceParentCheck: 'l8-a2-amended107-raw-parent-verification-20261016.json',
  raw96Dbs24633344BytesRehashedFinalPinsExact: true,
  postReadonly887AndRegistryPrefixAnd201OwnedFilesPriorVerifiedStillBoundByPinnedQualification: true,
  initialCollectorHoldAndEarlyIndexSupplementPreservedNoMandatoryLifecycleGateWaived: true,
  typecheck0And107Pass714AssertionsActualOneEachNotNativeAuthority: true,
  stage: 'FINAL_DELIVERY_CONFORMING_READY_FOR_C_ACCESS_ONLY not acceptance or integration',
  originalRedSeedsSealedNoCProbeCopyYet: true, acceptedMain275Exact: true,
  noCExecutionFullFreshReviewIntegrationOrNativePermissionGrantedBySeal: true };
writeFileSync(phase + '/l8-a2-amended107-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, runtime16: out.runtime16.length }));
