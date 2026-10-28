import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = root + '/.tmp/coordination-three-20261014';
const end = JSON.parse(readFileSync(phase + '/l8-a2-red-natural-end-parent-observation-20261016.json', 'utf8'));
const run = end.run;
const mb = readFileSync(run + '/delivery.json'), m = JSON.parse(mb.toString('utf8'));
const qb = readFileSync(run + '/qualification.json'), q = JSON.parse(qb.toString('utf8'));
const fb = readFileSync(run + '/frame.before.json'), frame = JSON.parse(fb.toString('utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const norm = (p: string) => p.replaceAll('\\', '/');
const pin = (path: string, f: any) => {
  const b = readFileSync(path); assert.equal(b.length, f.bytes, path); assert.equal(sha(b), f.sha256, path); return b;
};
assert.equal(sha(fb), '1c4974afd8290e4049f94a82ace0a8be0a1a551df33ff9913a2062e9ab70bf4a');
assert.equal(m.taskId, 'task_mv6towrm_000c_24005n');
assert.equal(m.artifactPins.length, 14);
let artifactBytes = 0;
for (const f of m.artifactPins) {
  assert(!f.path.includes('..') && !f.path.includes(':'));
  artifactBytes += pin(run + '/' + f.path, f).length;
}
assert.equal(artifactBytes, 1400575);
assert.equal(m.result.exitCode, 1); assert.equal(m.result.signal, null);
assert(m.result.naturalExit && !m.result.timedOut); assert.equal(m.result.invocations, 1);
assert.equal(m.result.pid, 41468); assert.equal(m.result.durationMs, 7952.0021);
assert.equal(sha(readFileSync(run + '/lifecycle-end.json')), end.lifecycleSha256);
const stdout = readFileSync(run + '/stdout.log'), stderr = readFileSync(run + '/stderr.log');
assert.equal(sha(stdout), end.stdoutSha256); assert.equal(sha(stderr), end.stderrSha256);
const text = stdout.toString('utf8') + '\n' + stderr.toString('utf8');
assert(/20 pass/.test(text) && /27 fail/.test(text) && /221 expect/.test(text) && /47 tests/.test(text));
assert.equal(q.failures.length, 27); assert.equal(q.failures.filter((f: any) => f.group === 'client').length, 16);
assert.equal(q.failures.filter((f: any) => f.group === 'pause').length, 11);
for (const f of q.failures) {
  assert(f.assertionFailure && f.errors.length > 0 && f.errors.every((e: string) => e.includes('expect(received)')));
  assert(text.includes(f.name)); assert(f.site.includes('body-pause-regressions.test.ts:'));
}
assert.equal(q.setupFailuresDetected, false); assert.equal(m.issues.length, 0);
assert.equal(frame.protectedFiles.length, 791); assert.equal(q.postPins.length, 791);
for (const f of frame.protectedFiles) {
  const after = q.postPins.find((g: any) => g.group === f.group && g.path === f.path);
  assert(after && after.exact); assert.equal(after.sha256, f.sha256); assert.equal(after.bytes, f.bytes);
  assert(!['.db', '-wal', '-shm', '-journal'].some(s => norm(f.path).endsWith(s)), 'Never read historic DB');
  pin(f.path, f);
}
assert.equal(new Set(frame.protectedFiles.map((f: any) => norm(f.path))).size, 764);
const test = pin(m.sourceScope.newTest.path, m.sourceScope.newTest);
assert.equal(sha(test), '7085767948db576bfecea0fec9c93ab37f32e7b803e656c5d5af639eab00a145');
assert(test.equals(readFileSync(run + '/test.before.ts')));
const prefix = readFileSync(phase + '/l8-a2-red-registry-parent-prefix-20261016.jsonl');
const before = readFileSync(run + '/registry.before.jsonl'), after = readFileSync(run + '/registry.after.jsonl');
const tail = readFileSync(run + '/registry.tail.jsonl'), live = readFileSync(m.registry.path);
assert.equal(prefix.length, 123186); assert(prefix.equals(before)); assert(live.equals(after));
assert.equal(after.length, 157257); assert(after.subarray(0, prefix.length).equals(prefix));
assert(after.subarray(prefix.length).equals(tail)); assert.equal(tail.length, 34071);
assert.equal(sha(tail), '97f485899bc8bc1c2df6b23744ec0496b49b33a564bce4cc82b58615056a1e32');
const rows = tail.toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length, 118);
const reservations = rows.filter((r: any) => r.event === 'reserved'), closures = rows.filter((r: any) => r.event === 'closed-and-pinned');
assert.equal(reservations.length, 71); assert.equal(closures.length, 47);
const reservedPaths = new Set(reservations.map((r: any) => norm(r.path)));
assert.equal(reservedPaths.size, 71);
const ownedPath = (path: string) => {
  assert([...reservedPaths].some(p => norm(path).startsWith(p.slice(0, -'own.db'.length))));
};
const dbPaths = new Set<string>(); let dbBytes = 0;
for (const f of m.retainedDatabaseIndex) {
  const path = norm(f.path); assert(reservedPaths.has(path)); assert(!dbPaths.has(path));
  dbPaths.add(path); assert(path.startsWith('C:/Users/djden/AppData/Local/Temp/opencode/l8-central-v2-'));
  const b = pin(f.path, f); assert.equal(b.subarray(0, 15).toString(), 'SQLite format 3'); dbBytes += b.length;
  assert(statSync(f.path).birthtimeMs >= Date.parse(m.result.startedAt));
  assert(statSync(f.path).birthtimeMs <= Date.parse(m.result.finishedAt));
  const close = closures.find((r: any) => norm(r.path) === path); assert(close);
  assert.equal(close.sha256, f.perCloseReceipt.sha256); assert.equal(norm(close.receipt), norm(f.perCloseReceipt.path));
  const receipt = JSON.parse(pin(f.perCloseReceipt.path, f.perCloseReceipt).toString('utf8'));
  assert(receipt.closedNoWalShm && receipt.fixtureOnly && receipt.files.length === 1);
  const r = receipt.files[0]; assert.equal(norm(r.path), path); assert.equal(r.bytes, f.bytes); assert.equal(r.sha256, f.sha256);
  for (const sidecar of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + sidecar));
}
assert.equal(dbPaths.size, 47); assert.equal(dbBytes, 8269824);
for (const path of reservedPaths) if (!dbPaths.has(path)) assert(!existsSync(path));
let ownedBytes = 0;
for (const f of m.ownedNewFilePins) { ownedPath(f.path); ownedBytes += pin(f.path, f).length; }
assert.equal(m.ownedNewFilePins.length, 95); assert.equal(ownedBytes, 8296180);
const sb = readFileSync(run + '/future-C-seeds.json'), seeds = JSON.parse(sb.toString('utf8')).seeds;
assert.equal(seeds.length, 2);
for (const f of seeds) {
  assert(dbPaths.has(norm(f.path))); pin(f.path, f);
  assert(f.originalClosedRetained && !f.scratchCopied && !f.seedReopened && !f.rowInspectedBySql);
  assert.equal(f.cachedReceiptCanonicalEqual, true); assert.equal(f.sends, 1);
  assert.equal(f.publicObservedPayloadCoherent, f.label === 'RV01_COHERENT_CONTROL');
  assert.equal(f.expectedCanonical === f.sentCanonical, f.publicObservedPayloadCoherent);
}
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = {
  at: new Date().toISOString(), run, task: m.taskId, deliverySha256: sha(mb), qualificationSha256: sha(qb),
  futureCSeedsSha256: sha(sb), newTestSha256: sha(test), artifact14Bytes: artifactBytes,
  baselineRuntime15BothSourcesAnd60OldStillExact: true, protected791Checks764PathsExactNoHistoricalDbRead: true,
  registryOld123186BytePrefixExactTail34071Bytes118Rows71Reservations47Closes24NoDb: true,
  retainedDbs: 47, retainedDbBytes: dbBytes, owned95FilesBytes: ownedBytes,
  allNewDbBirthtimesWithinRunPerCloseReceiptsEqualPostNoSidecars: true,
  red: { pass: 20, fail: 27, tests: 47, assertions: 221, clientAssertionFailures: 16, pauseAssertionFailures: 11, exit: 1, natural: true },
  failureQualification: '27 regression expects on unchanged baseline; after-failed assertions and unentered PREPARED observer branches not executed or certified',
  seeds: seeds.map(({ label, path, bytes, sha256, publicObservedPayloadCoherent }: any) => ({ label, path, bytes, sha256, publicObservedPayloadCoherent })),
  noRowCCheckerScratchCopyOrGreenCoverageClaim: true, acceptedMain275Exact: true,
  stage: 'BASELINE_RED_CONFORMING_READY_FOR_BOUNDED_TWO_SOURCE_WRITE_GO no execution authority granted by this verification',
  accepted: false, integrated: false, noNativeAuthority: true,
};
writeFileSync(phase + '/l8-a2-red-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, seeds: out.seeds.map((s: any) => ({ label: s.label, coherent: s.publicObservedPayloadCoherent })) }));
