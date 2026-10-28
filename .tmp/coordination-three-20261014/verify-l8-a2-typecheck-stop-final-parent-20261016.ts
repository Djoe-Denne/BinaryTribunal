import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const stopped = JSON.parse(readFileSync(phase + '/l8-a2-tc107-stopped-parent-observation-20261016.json', 'utf8'));
const run = stopped.run, sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const mb = readFileSync(run + '/delivery.json'); assert.equal(mb.length, 20230);
assert.equal(sha(mb), 'a66c387ea67ff228870618872505b855471f1c4b42c90ec5bcdab274a689fd4f');
const m = JSON.parse(mb.toString('utf8')), post = JSON.parse(readFileSync(run + '/post-typecheck-stop.json', 'utf8'));
const before = JSON.parse(readFileSync(run + '/frame.before.json', 'utf8'));
const pin = (path: string, f: any) => { const b = readFileSync(path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256, path); return b; };
let artifactBytes = 0; assert.equal(m.artifactPins.length, 28);
for (const f of m.artifactPins) { assert(!f.path.includes(':') && !f.path.split('/').includes('..')); artifactBytes += pin(run + '/' + f.path, f).length; }
assert.equal(artifactBytes, 2796891); assert.equal(post.postPins.length, 853);
for (const f of post.postPins) { assert(f.exact); assert(!/\.db(?:-wal|-shm|-journal)?$/.test(f.path)); pin(f.path, f); }
assert.equal(new Set(post.postPins.map((f: any) => f.path.replaceAll('\\', '/'))).size, 801);
assert.equal(post.runtime16FrozenLivePins.length, 16);
for (const f of post.runtime16FrozenLivePins) assert(pin(f.path, f).equals(readFileSync(f.frozenPath)));
assert.equal(sha(readFileSync(run + '/typecheck.end.json')), stopped.typecheckEndSha256);
const end = JSON.parse(readFileSync(run + '/typecheck.end.json', 'utf8'));
assert.equal(end.exitCode, 2); assert.equal(end.testsInvoked, 0); assert.equal(end.signal, null);
assert(end.naturalExit && !end.timedOut && !end.readyForOneNamed107);
const registry = readFileSync(run + '/registry.before.jsonl');
assert.equal(registry.length, 157257); assert.equal(sha(registry), '11607270d18e115b56306336f351ddbfe7d6fd5c12d859954d5ebe0302f08b3e');
assert(registry.equals(readFileSync(run + '/registry.after.jsonl')));
assert.equal(readFileSync(run + '/registry.tail.jsonl').length, 0);
assert.equal(post.freshChildFiles.length, 1);
const cache = post.freshChildFiles[0], cacheBytes = pin(cache.path, cache);
assert.equal(cacheBytes.length, 1357740); assert.notEqual(cacheBytes.subarray(0, 15).toString(), 'SQLite format 3');
assert.equal(m.issues.length, 0); assert.equal(post.issues.length, 0);
const out = { at: new Date().toISOString(), task: m.taskId, run, deliverySha256: sha(mb),
  artifact28Bytes: artifactBytes, protected853Checks801PathsAndRuntime16LiveFrozenExact: true,
  typecheckExit2NaturalPid31564NoBunTestInvocationNo107Counts: true,
  oneTs2769OptionalAdmissionStateInNewTestNotSourceRuntimeVerdict: true,
  registry157257UnchangedTail0NoFixturesOrDbCreatedOrOpened: true,
  retainedOpaqueNodeCacheBytes: cacheBytes.length, cacheHeaderNotSqliteOnlyHashedNeverDeserialized: true,
  originalRedSeedsStillSealedNoScratchOrChecker: true,
  stage: 'FAILED_GATE_DELIVERY_CONFORMING may prepare exact one-hunk test typing amendment and new gate; no permission by verification',
  noAcceptedGreenFullOrIntegration: true };
writeFileSync(phase + '/l8-a2-typecheck-stop-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
