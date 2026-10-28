import { readFileSync, writeFileSync, readdirSync, lstatSync, realpathSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy851-review-dynamic-actual-final-go-20261016.json', 'utf8'));
const hold = JSON.parse(readFileSync(phase + '/l7-copy851-review-env-setup-hold-public-audit-20261016.json', 'utf8'));
const run = hold.run, sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const db = readFileSync(run + '/SETUP_ENV_DIAGNOSTIC.json'); assert.equal(db.length, 4016); assert.equal(sha(db), '604a5c8b1f19a53df3565ad7efd9908ffef231b909c3a2eccc978e0dfee282b7');
const d = JSON.parse(db.toString('utf8')); assert(d.flags.guardStrictAbsent && d.flags.environmentUnchangedInThisProcess && d.flags.localAppDataUniqueExact && d.flags.appDataUniqueExact && d.flags.pins393Exact && d.flags.old4UnchangedWithinDiagnostic && d.flags.targetLifecycleAbsent);
assert.equal(d.flags.tempExistingOwnedDirsNonLinksAndEmpty, false);
assert.deepEqual(d.tempRoot.entries, ['node-compile-cache', 'opencode']); assert.deepEqual(d.nested.entries, []);
assert.equal(d.environment.localAppData.value, hold.originalSelectedLocalAppData); assert.equal(d.environment.appData.value, hold.originalSelectedAppData);
for (const f of hold.originalFourProofPins) assert.equal(sha(readFileSync(run + '/' + f.path)), f.sha256);
assert(!existsSync(run + '/target.lifecycle.json'));
assert.deepEqual(readdirSync(go.tempRoot).sort(), ['node-compile-cache', 'opencode']); assert.equal(readdirSync(join(go.tempRoot, 'opencode')).length, 0);
const cache = join(go.tempRoot, 'node-compile-cache');
for (const p of [go.tempRoot, cache, join(go.tempRoot, 'opencode')]) { const s = lstatSync(p); assert(s.isDirectory() && !s.isSymbolicLink()); }
const cacheReal = realpathSync(cache).toLowerCase(), pins: any[] = []; let totalBytes = 0, entries = 0;
const walk = (dir: string) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    assert(++entries <= 128, 'Cache metadata inspection bound exceeded'); const p = join(dir, e.name), s = lstatSync(p);
    assert(!s.isSymbolicLink()); const real = realpathSync(p).toLowerCase(); assert(real.startsWith(cacheReal + '\\'));
    if (s.isDirectory()) walk(p); else {
      assert(s.isFile() && s.size <= 16 * 1024 * 1024); const b = readFileSync(p), after = statSync(p);
      assert.equal(b.length, s.size); assert.equal(after.size, s.size); assert.equal(after.mtimeMs, s.mtimeMs);
      assert.notEqual(b.subarray(0, 15).toString(), 'SQLite format 3', 'Unexpected DB before target');
      totalBytes += b.length; assert(totalBytes <= 32 * 1024 * 1024); pins.push({ path: p, relative: relative(cache, p), bytes: b.length, sha256: sha(b), opaqueNotDeserialized: true });
    }
  }
}; walk(cache);
for (const qname of ['l7-copy851-review-preparation-request-20261016.json', 'l7-copy851-preamble-qualification-request-20261016.json']) {
  const q = JSON.parse(readFileSync(phase + '/' + qname, 'utf8')); for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
}
const out = { at: new Date().toISOString(), task: go.task, session: go.session, run, diagnosticSha256: sha(db),
  allDiagnosticGuardAuthorityPathPinsAndSameProcessEnvironmentChecksConformed: true,
  crossProcessEnvDigestsDifferentNotAttributionOfKeyOrOldOrBranch: true,
  original4AndDiagnosticUnchangedNoTargetLifecycleNoDb: true,
  originalInitialPreTscRootOnlyOpencodeStillHistoricalTrueLaterDiagnosticRootEmptyFlagFalseRetained: true,
  stage2RootEntries: ['node-compile-cache', 'opencode'], nestedStillEmptyNonLink: true,
  cacheRoot: cache, opaqueCachePins: pins, opaqueCacheBytes: totalBytes,
  cacheRawHashedOnlyNoDeserializationNoSqliteNoSourceConfigWritesOrCacheDeletion: true,
  noInstrumentedCreatorClaimCacheNotSemanticOrScientificEvidenceNotImmutableSourceInput: true,
  parentDecision: 'allow existing owned opaque cache at post-TSC stage, preserve/hash before and after; restore only within-process env immutability and original authority/guard checks for separate target-only GO',
  noTargetResumeOrProbeExecutionByThisVerification: true };
writeFileSync(phase + '/l7-copy851-review-env-diagnostic-cache-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
writeFileSync(go.proofDirectory + '/PARENT_ENV_CACHE_QUALIFICATION.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, opaqueCachePins: pins.length }));
