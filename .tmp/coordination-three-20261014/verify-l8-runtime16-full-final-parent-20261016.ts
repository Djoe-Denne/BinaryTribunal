import { readFileSync, writeFileSync, existsSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const natural = JSON.parse(readFileSync(phase + '/l8-runtime16-full-natural-release-parent-20261016.json', 'utf8'));
const go = JSON.parse(readFileSync(phase + '/l8-runtime16-full-actual-final-go-20261016.json', 'utf8'));
const run = natural.run, norm = (p: string) => p.replaceAll('\\', '/');
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const pin = (path: string, f: any) => { const b = readFileSync(path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256, path); return b; };
const mb = readFileSync(run + '/delivery.json'); assert.equal(mb.length, 120482);
assert.equal(sha(mb), 'ed46f1f16f5a1b9f604ebf75316e7b9e76321da84c05219209718a3e0b9aec0c');
const m = JSON.parse(mb.toString('utf8')), qb = readFileSync(run + '/qualification.json');
assert.equal(qb.length, 213373); assert.equal(sha(qb), '5a99f49d0bded41b38d24e294b136b78affd054d71fa4aef07bfa12e50d34079');
const q = JSON.parse(qb.toString('utf8')), post = JSON.parse(readFileSync(run + '/post-pins.json', 'utf8'));
const frame = JSON.parse(readFileSync(run + '/frame.before.json', 'utf8'));
const reporting = JSON.parse(readFileSync(run + '/REPORTING_QUALIFICATIONS.json', 'utf8'));
assert.equal(m.artifactPins.length, 34); let artifactBytes = 0;
for (const f of m.artifactPins) { assert(!f.path.includes(':') && !f.path.split('/').includes('..')); artifactBytes += pin(run + '/' + f.path, f).length; }
assert.equal(artifactBytes, 4822368); assert.equal(frame.protectedBeforePins.length, 1033); assert.equal(post.postFullShaPins.length, 1031);
assert.equal(new Set(post.postFullShaPins.map((f: any) => norm(f.path))).size, 906);
const registryPath = go.own + '/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl'; let mutableRows = 0;
for (const f of frame.protectedBeforePins) {
  if (norm(f.path) === registryPath) { mutableRows++; continue; }
  const after = post.postFullShaPins.find((g: any) => g.path === f.path && g.group === f.group);
  assert(after && after.exact && after.bytes === f.bytes && after.sha256 === f.sha256); pin(f.path, f);
}
assert.equal(mutableRows, 2); assert.equal(post.mutableRegistryRows.length, 2);
assert.equal(q.runtime16.length, 16); let runtimeBytes = 0;
for (const f of q.runtime16) { const bytes = pin(f.path, f); assert(bytes.equals(readFileSync(f.frozenPath))); runtimeBytes += bytes.length; }
assert.equal(runtimeBytes, 365568);
const end = JSON.parse(readFileSync(run + '/full.end.json', 'utf8'));
assert.equal(end.exitCode, 0); assert.equal(end.pid, 33464); assert(end.naturalExit && !end.timedOut && end.fullInvocations === 1);
assert.equal(end.old443PostReads, 0); assert.equal(end.postRunFixtureCollectionPerformed, false);
assert.equal(sha(readFileSync(run + '/full.end.json')), natural.fullEndSha256);
assert.equal(sha(readFileSync(run + '/full.stdout.log')), natural.stdoutSha256); assert.equal(sha(readFileSync(run + '/full.stderr.log')), natural.stderrSha256);
assert.deepEqual(q.actualCounts, { pass: 977, fail: 0, skip: 1, assertions: 75019, tests: 978, files: 29 });
assert.equal(Object.values(q.perFilePassCounts).reduce((n: number, r: any) => n + r.pass, 0), 977);
assert.equal(q.perFilePassCounts['test/graph-integration/body-pause-regressions.test.ts'].pass, 47);
assert.equal(reporting.skipReporting.actualTopLevelSkipCount, 1); assert.equal(reporting.skipReporting.actualSkippedFile, 'scripts/role-sharing-offline.test.ts');
assert.equal(reporting.skipReporting.correctedPerFileActualSkipCounts['test/graph-integration/recovery.test.ts'], 0);
const collector = pin(reporting.collectorEventsFinal.path, reporting.collectorEventsFinal), prefix = reporting.phase1EventPinDescribesEarlierPrefix;
assert.equal(collector.length, 1243); assert.equal(sha(collector.subarray(0, prefix.bytes)), prefix.sha256);
assert.equal(collector.length - prefix.bytes, 348); assert.equal(collector.toString('utf8').trim().split('\n').map(JSON.parse).length, 2);
assert.equal(reporting.disclosedCollectorErrors.length, 2);
const before = readFileSync(run + '/registry.before.jsonl'), after = readFileSync(run + '/registry.after.jsonl'), tail = readFileSync(run + '/registry.tail.jsonl');
assert.equal(before.length, 232965); assert.equal(after.length, 308673); assert.equal(tail.length, 75708);
assert.equal(sha(before), '5c2bb8eca39cb81967ee3ca26af3d6e552212f9dd7d20ea0ce2f7af3bfc5e7e0');
assert.equal(sha(after), 'd7facf094d773d81e17cfafc3e051deca1dc8e30655a592360bb1653c23b0f12');
assert.equal(sha(tail), 'cc54a5669aa239fda5681b8a51bcbe01db72cfd0712b956bc5d82740722929d8');
assert(after.subarray(0, before.length).equals(before) && after.subarray(before.length).equals(tail)); assert(readFileSync(registryPath).equals(after));
const rows = tail.toString('utf8').trim().split('\n').map(JSON.parse), reserved = rows.filter((r: any) => r.event === 'reserved'), closes = rows.filter((r: any) => r.event === 'closed-and-pinned');
assert.equal(rows.length, 275); assert.equal(reserved.length, 179); assert.equal(closes.length, 96);
const roots = new Set(reserved.map((r: any) => norm(r.path))); assert.equal(roots.size, 179);
const oldManifest = JSON.parse(readFileSync(go.own + '/inputs/L8_RUNTIME16_FULL_GATE_20261016/PREEXISTING_DBS.json', 'utf8'));
const oldAfter = JSON.parse(readFileSync(run + '/preexisting443.after.json', 'utf8'));
const oldBefore = Array.isArray(frame.old443Before) ? frame.old443Before : frame.old443Before.pins;
assert.equal(oldManifest.files.length, 443); assert.equal(oldAfter.pins.length, 443); assert.equal(oldBefore.length, 443);
const all = new Map<string, any>(); let oldBytes = 0;
for (const f of oldManifest.files) {
  const path = norm(f.path), prior = oldBefore.find((g: any) => norm(g.path) === path), postOld = oldAfter.pins.find((g: any) => norm(g.path) === path);
  assert(prior && postOld && prior.sha256 === f.sha256 && prior.bytes === f.bytes && postOld.sha256 === f.sha256 && postOld.bytes === f.bytes);
  pin(f.path, f); for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + suffix));
  assert(!all.has(path)); all.set(path, f); oldBytes += f.bytes;
}
assert.equal(oldBytes, 131350528);
let newL8Bytes = 0; const newDbs = new Map<string, any>();
for (const f of q.newL8Databases) {
  const path = norm(f.path); assert(roots.has(path) && !all.has(path));
  const bytes = pin(f.path, f); assert.equal(bytes.subarray(0, 15).toString(), 'SQLite format 3');
  assert(statSync(f.path).birthtimeMs >= Date.parse(end.startedAt) && statSync(f.path).birthtimeMs <= Date.parse(end.finishedAt));
  const close = closes.find((c: any) => norm(c.path) === path); assert(close);
  assert.equal(norm(close.receipt), norm(f.perCloseReceipt.path)); assert.equal(close.sha256, f.perCloseReceipt.sha256);
  const receipt = JSON.parse(pin(f.perCloseReceipt.path, f.perCloseReceipt).toString('utf8'));
  assert(receipt.closedNoWalShm && receipt.fixtureOnly && receipt.files.length === 1);
  assert.equal(norm(receipt.files[0].path), path); assert.equal(receipt.files[0].sha256, f.sha256); assert.equal(receipt.files[0].bytes, f.bytes);
  for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + suffix));
  all.set(path, f); newDbs.set(path, f); newL8Bytes += f.bytes;
}
assert.equal(newDbs.size, 96); assert.equal(newL8Bytes, 24633344);
for (const p of roots) if (!newDbs.has(p)) assert(!existsSync(p));
assert.equal(q.reservations.noDatabase, 83); assert.equal(q.newOwnedL8FilePins.length, 201); let ownedBytes = 0;
for (const f of q.newOwnedL8FilePins) { assert([...roots].some(p => norm(f.path).startsWith(p.slice(0, -'own.db'.length)))); ownedBytes += pin(f.path, f).length; }
assert.equal(ownedBytes, 24768944); assert.equal(q.childFilePins.length, 1); assert.equal(q.retainedChildDatabases.length, 1);
const child = q.retainedChildDatabases[0]; assert.equal(norm(child.path), run + '/temp/opencode/l5-admission-budget-3romfU/own.db');
assert.equal(pin(child.path, child).length, 385024); assert(!all.has(norm(child.path))); all.set(norm(child.path), child);
assert(child.hashChronology.includes('post-full exit')); for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(child.path + suffix));
assert.equal(q.auxiliaryAfterAllSnapshots.length, 1); const indexPin = q.auxiliaryAfterAllSnapshots[0], index = JSON.parse(pin(indexPin.path, indexPin).toString('utf8'));
const indexTime = statSync(indexPin.path).mtimeMs, early = new Set(index.files.map((f: any) => norm(f.path)));
assert.equal(early.size, 6); let earlyBytes = 0, laterBytes = 0;
for (const f of index.files) { const db = newDbs.get(norm(f.path)); assert(db && db.bytes === f.bytes && db.sha256 === f.sha256); earlyBytes += f.bytes; }
for (const [path, f] of newDbs) if (!early.has(path)) { assert(statSync(path).birthtimeMs > indexTime); laterBytes += f.bytes; }
assert.equal(earlyBytes, 2215936); assert.equal(laterBytes, 22417408);
const finalIndex = JSON.parse(readFileSync(run + '/database-index.json', 'utf8')); assert.equal(finalIndex.files.length, 540); assert.equal(all.size, 540);
const seen = new Set<string>(); let finalBytes = 0;
for (const f of finalIndex.files) {
  const path = norm(f.path), authority = all.get(path); assert(authority && !seen.has(path)); seen.add(path);
  assert.equal(f.sha256, authority.sha256); assert.equal(f.bytes, authority.bytes); assert(lstatSync(path).isFile());
  assert.equal(pin(path, f).subarray(0, 15).toString(), 'SQLite format 3'); finalBytes += f.bytes;
}
assert.equal(finalBytes, 156368896); assert.equal(m.issues.length, 0); assert.equal(q.issues.length, 0); assert.equal(reporting.issues.length, 0);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: m.taskId, session: m.session, model: m.model, own: go.own, run,
  deliverySha256: sha(mb), qualificationSha256: sha(qb), artifact34Bytes: artifactBytes, runtime16: q.runtime16, runtime16Bytes: runtimeBytes,
  full977Pass0Fail1Skip75019Assertions978Tests29FilesActualLogsVerified: true,
  exclusiveNaturalReleaseBeforeCollectionEndOldPostReads0Confirmed: true,
  protected1031FullHashes906PathsPlusTwoSameLiveRegistryPrefixRowsAll1033Qualified: true,
  old443Db131350528BytesBeforeAfterExactNoSidecars: true, newL8_96Db24633344BytesPerCloseEqualPostBornWithinRun: true,
  newL5Db385024BytesFirstHashPostExitOnlyNotPerClose: true, final540NamedDb156368896BytesRehashedNoSqliteConnection: true,
  registry232965ExactPrefixTail75708Rows275Reserved179Closed96Absent83: true, owned201File24768944BytesExact: true,
  earlyAfterAll6Plus90LaterDbBirthtimesQualifiedNoIndexEqualityWaiverOrLifecycleOmission: true,
  collectorTwoReaderErrorsQualifiedFirstUnpersistedPostAttemptNotDurableSealEvents895PrefixPlus348TailIntact: true,
  oneInteropSkipFooterNotRecoverySkipSourceCleanup12Active22OneGuardedInactivePreserved: true,
  initial962HoldB4bSupplementRedOriginalsAndCPhysicalCopiesAllPreserved: true,
  stage: 'FULL16_DELIVERY_CONFORMING_READY_FOR_FRESH_NONBLIND_SOL_MAX_REVIEW not accepted or integrated',
  acceptedMain275Exact: true, noExtraProductExecutionOrNativeAuthorityByParentVerification: true };
writeFileSync(phase + '/l8-runtime16-full-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, runtime16: out.runtime16.length }));
