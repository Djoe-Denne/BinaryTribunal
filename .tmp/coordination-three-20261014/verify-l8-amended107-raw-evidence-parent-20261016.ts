import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const natural = JSON.parse(readFileSync(phase + '/l8-a2-test321-107-natural-end-parent-observation-20261016.json', 'utf8'));
const go = JSON.parse(readFileSync(phase + '/l8-a2-test321-actual-final-go-20261016.json', 'utf8'));
const run = natural.run, norm = (p: string) => p.replaceAll('\\', '/');
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const pin = (path: string, f: any) => { const b = readFileSync(path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256, path); return b; };
const qb = readFileSync(run + '/qualification.json'); assert.equal(qb.length, 555200);
assert.equal(sha(qb), '962c16df78f5ab1f330fc69a5717e1a48a8c865f42fd59746d731d2120f3ce12');
const q = JSON.parse(qb.toString('utf8')), sb = readFileSync(run + '/AFTERALL_SCOPE_SUPPLEMENT.json');
assert.equal(sb.length, 81221); assert.equal(sha(sb), 'b4b25ac4690df384ff5c8544b495322664c30b490d8cb3db63383a5f22a2090d');
const supplement = JSON.parse(sb.toString('utf8'));
const ready = JSON.parse(readFileSync(run + '/patch.ready.json', 'utf8'));
assert.equal(ready.protectedAfterPatchPins.length, 888); assert.equal(q.postFullShaPins.length, 887);
const registryPath = norm(q.registry.path);
for (const f of ready.protectedAfterPatchPins) {
  if (norm(f.path) === registryPath) continue;
  const after = q.postFullShaPins.find((g: any) => g.path === f.path && g.group === f.group);
  assert(after && after.exact && after.bytes === f.bytes && after.sha256 === f.sha256); pin(f.path, f);
}
assert.equal(new Set(q.postFullShaPins.map((f: any) => norm(f.path))).size, 835);
const original = JSON.parse(readFileSync(go.own + '/inputs/L8_A2_TEST321_AMENDMENT_20261016/BASELINE.json', 'utf8'));
let ordinary = 0, patched = 0, prefixRows = 0;
for (const f of original.readonly853Before) {
  if (norm(f.path) === registryPath) { prefixRows++; continue; }
  if (norm(f.path) === go.own + '/' + go.allowedTestPath) {
    assert.equal(sha(readFileSync(f.path)), go.expectedSha256); patched++; continue;
  }
  pin(f.path, f); ordinary++;
}
assert.equal(ordinary, 850); assert.equal(patched, 2); assert.equal(prefixRows, 1);
assert.equal(q.frozenRuntime.length, 16); let runtimeBytes = 0;
for (const f of q.frozenRuntime) { const b = pin(f.path, f); assert(b.equals(readFileSync(f.frozenPath))); runtimeBytes += b.length; }
assert.equal(runtimeBytes, 365568);
const before = readFileSync(run + '/registry.before.jsonl'), after = readFileSync(run + '/registry.after.jsonl'), tail = readFileSync(run + '/registry.tail.jsonl');
assert.equal(before.length, 157257); assert.equal(after.length, 232965); assert.equal(tail.length, 75708);
assert.equal(sha(before), '11607270d18e115b56306336f351ddbfe7d6fd5c12d859954d5ebe0302f08b3e');
assert.equal(sha(tail), '61a75a4cdca8d622aa279d50e3700c0b1aa3f20b0af262120444e874bcf22c70');
assert(after.subarray(0, before.length).equals(before)); assert(after.subarray(before.length).equals(tail));
assert(readFileSync(q.registry.path).equals(after));
const rows = tail.toString('utf8').trim().split('\n').map(JSON.parse), reserved = rows.filter((r: any) => r.event === 'reserved');
const closes = rows.filter((r: any) => r.event === 'closed-and-pinned');
assert.equal(rows.length, 275); assert.equal(reserved.length, 179); assert.equal(closes.length, 96);
const roots = new Set(reserved.map((r: any) => norm(r.path))); assert.equal(roots.size, 179);
const end = JSON.parse(readFileSync(run + '/tests.end.json', 'utf8'));
assert.equal(end.exitCode, 0); assert(end.naturalExit && !end.timedOut && end.testsInvocations === 1);
assert.equal(sha(readFileSync(run + '/tests.end.json')), natural.testsEndSha256);
assert.equal(sha(readFileSync(run + '/tests.stdout.log')), natural.stdoutSha256);
assert.equal(sha(readFileSync(run + '/tests.stderr.log')), natural.stderrSha256);
const dbs = new Map<string, any>(); let dbBytes = 0;
for (const f of q.retainedDatabases) {
  const path = norm(f.path); assert(roots.has(path) && !dbs.has(path));
  const bytes = pin(f.path, f); assert.equal(bytes.subarray(0, 15).toString(), 'SQLite format 3');
  assert(statSync(f.path).birthtimeMs >= Date.parse(end.startedAt) && statSync(f.path).birthtimeMs <= Date.parse(end.finishedAt));
  const close = closes.find((c: any) => norm(c.path) === path); assert(close);
  assert.equal(norm(close.receipt), norm(f.perCloseReceipt.path)); assert.equal(close.sha256, f.perCloseReceipt.sha256);
  const receipt = JSON.parse(pin(f.perCloseReceipt.path, f.perCloseReceipt).toString('utf8'));
  assert(receipt.closedNoWalShm && receipt.fixtureOnly && receipt.files.length === 1);
  assert.equal(norm(receipt.files[0].path), path); assert.equal(receipt.files[0].bytes, bytes.length); assert.equal(receipt.files[0].sha256, f.sha256);
  for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + suffix));
  dbs.set(path, f); dbBytes += bytes.length;
}
assert.equal(dbs.size, 96); assert.equal(dbBytes, 24633344);
for (const path of roots) if (!dbs.has(path)) assert(!existsSync(path));
assert.equal(q.reservationsWithoutDatabase.length, 83);
let ownedBytes = 0; assert.equal(q.newOwnedFilePins.length, 201);
for (const f of q.newOwnedFilePins) {
  assert([...roots].some(p => norm(f.path).startsWith(p.slice(0, -'own.db'.length))));
  ownedBytes += pin(f.path, f).length;
}
assert.equal(ownedBytes, 24768944);
assert.equal(q.afterAllIndex.length, 1);
const indexPin = q.afterAllIndex[0], index = JSON.parse(pin(indexPin.path, indexPin).toString('utf8'));
const indexTime = statSync(indexPin.path).mtimeMs, early = new Set(index.files.map((f: any) => norm(f.path)));
assert.equal(early.size, 6); assert(indexTime < Date.parse(end.finishedAt));
for (const f of index.files) { const db = dbs.get(norm(f.path)); assert(db && db.bytes === f.bytes && db.sha256 === f.sha256); }
assert.equal(supplement.unifiedFinalDatabaseMapping.length, 96); let earlyBytes = 0, laterBytes = 0;
const mappingPaths = new Set<string>();
for (const f of supplement.unifiedFinalDatabaseMapping) {
  const path = norm(f.path), db = dbs.get(path); assert(db && !mappingPaths.has(path)); mappingPaths.add(path);
  assert.equal(f.bytes, db.bytes); assert.equal(f.sha256, db.sha256); assert.equal(f.inEarlyAfterAll, early.has(path));
  const n = Number(f.currentQualificationPointer.split('/').at(-1)); assert.equal(norm(q.retainedDatabases[n].path), path);
  if (early.has(path)) earlyBytes += db.bytes;
  else { laterBytes += db.bytes; assert(statSync(path).birthtimeMs > indexTime); }
}
assert.equal(earlyBytes, 2215936); assert.equal(laterBytes, 22417408);
assert.equal(q.freshChildFiles.length, 1); const cache = q.freshChildFiles[0];
assert(norm(cache.path).startsWith(run + '/temp/')); assert.equal(pin(cache.path, cache).length, 1357748);
assert.equal(q.currentRunFixtureLabelsNotOriginalCSeeds.length, 2);
for (const f of q.currentRunFixtureLabelsNotOriginalCSeeds) assert(f.payloadCoherent && f.cachedReceiptCanonicalEqual && f.sends === 1);
assert.equal(q.fourPreparedNonpositiveBranchesActuallyObserved.length, 4);
for (const f of q.fourPreparedNonpositiveBranchesActuallyObserved) {
  assert(f.observerCalls > 0 && f.stepError === null && f.submits === 1 && f.fakeAccepted === 0);
  assert.equal(f.status, 'paused'); assert.equal(f.states[0].admission.state, 'PREPARED');
}
assert.equal(q.issues.length, 1); assert.equal(q.issues[0].kind, 'afterAll-index-does-not-match-current-databases');
assert.equal(supplement.remainingCollectorIssuesAfterThisNarrowCorrection.length, 0);
const out = { at: new Date().toISOString(), task: q.taskId, run,
  initialHoldQualificationSha256: sha(qb), scopeSupplementSha256: sha(sb), bothPreservedNotRelabeled: true,
  fullReadonly887Checks835PathsExactAndBaseline850PlusTwoTestNewPinsOneRegistryPrefixQualified: true,
  runtime16LiveFrozenExactBytes: runtimeBytes,
  registryOld157257PrefixExactTail75708Rows275Reserved179Closed96AbsentDb83: true,
  retainedDbCount: 96, retainedDbBytes: dbBytes, perClose96ReceiptsEqualPostAllBornWithinRunNoSidecars: true,
  retainedOwned201FilesBytes: ownedBytes, retainedOpaqueNodeCacheBytes: 1357748,
  earlyIndex6Exact2215936BytesAndOther90BornAfterIndex22417408BytesMappingVerified: true,
  fourNonpositivePreparedObserversActuallyEnteredInGreen107LocalFixturesNotNativeProof: true,
  newSeedLabelsBothCoherentOriginalRedSeedsNotReplacedOrOpened: true,
  typecheck0And107Pass714AssertionsLogsPinnedPrior: true,
  stage: 'RAW_POSTCOLLECTION_CONFORMS_WITH_EXPLICIT_SCOPE_SUPPLEMENT finalDeliveryArtifactSealStillPending',
  noSqliteConnectionCodeTestRerunScratchCFullIntegrationOrNativeAuthority: true };
writeFileSync(phase + '/l8-a2-amended107-raw-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
