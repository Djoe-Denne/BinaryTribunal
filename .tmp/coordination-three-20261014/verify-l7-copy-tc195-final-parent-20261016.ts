import { readFileSync, writeFileSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy-tc195-actual-final-go-20261016.json', 'utf8'));
const own = go.own, run = own + '/.tmp/L7_COPY_BOUNDARY_20261016/TC195-2026-10-16T155141945Z-copy-r1';
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const ab = readFileSync(run + '/ARTIFACTS.json'); assert.equal(ab.length, 3714);
assert.equal(sha(ab), '7b2ccb5af16e2e01e046c03b213b00537fc9fe97da4ff7a31314a7f14ef5977b');
const artifacts = JSON.parse(ab.toString('utf8')); assert.equal(artifacts.files.length, 21); let artifactBytes = 0;
for (const f of artifacts.files) { assert(!f.path.includes(':') && !f.path.split('/').includes('..')); const b = readFileSync(run + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); artifactBytes += b.length; }
assert.equal(artifactBytes, 540216);
const pre = JSON.parse(readFileSync(run + '/preflight.json', 'utf8')), post = JSON.parse(readFileSync(run + '/postflight.json', 'utf8'));
const postTc = JSON.parse(readFileSync(run + '/post-typecheck.json', 'utf8'));
const tc = JSON.parse(readFileSync(run + '/typecheck.end.json', 'utf8')), test = JSON.parse(readFileSync(run + '/tests.end.json', 'utf8'));
assert.equal(tc.code, 0); assert.equal(tc.pid, 25080); assert.equal(tc.typecheckInvocationCount, 1); assert.equal(tc.testInvocationCount, 0);
assert.equal(test.code, 0); assert.equal(test.pid, 16688); assert.equal(test.typecheckInvocationCount, 1); assert.equal(test.testInvocationCount, 1);
assert(tc.naturalExit && test.naturalExit && !tc.timedOut && !test.timedOut && tc.spawnError === null && test.spawnError === null);
assert.equal(tc.signal, null); assert.equal(test.signal, null); assert(Date.parse(postTc.at) < Date.parse(test.started));
assert(postTc.mayRun195 && postTc.pinsExact);
const stdout = readFileSync(run + '/tests.stdout.log'), stderr = readFileSync(run + '/tests.stderr.log'), text = stdout.toString('utf8') + '\n' + stderr.toString('utf8');
assert.equal(sha(stdout), '9cdbdab1fbb72b63aa4dd2c3445b242ff8a8f3f0c192176b0e00b1c71c0347c0');
assert.equal(sha(stderr), '92b310cf4ec8c6c160a3418e01aa0fcc9c1336723b72895fcec498a545adf63f');
for (const v of ['195 pass', '0 fail', '14473 expect', '195 tests across 8 files']) assert(text.includes(v));
const cases = JSON.parse(readFileSync(run + '/all-195-cases.json', 'utf8')), newCases = JSON.parse(readFileSync(run + '/new-64-cases.json', 'utf8'));
assert.equal(cases.length, 195); assert.equal(newCases.length, 64);
const analysis = JSON.parse(readFileSync(run + '/test-analysis.json', 'utf8'));
assert.equal(analysis.parseIssues.length, 0); assert.equal(analysis.failedCases.length, 0); assert(analysis.fileSetMatchesAuthorized);
assert.equal(analysis.perFile.length, 8); assert.equal(analysis.perFile.reduce((n: number, f: any) => n + f.pass, 0), 195);
assert(analysis.perFile.every((f: any) => f.fail === 0 && f.skip === 0));
const events = readFileSync(run + '/new-64-events.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
const ends = events.filter((e: any) => e.event === 'case_end'); assert.equal(ends.length, 64); assert.equal(new Set(ends.map((e: any) => e.case)).size, 64);
assert(ends.every((e: any) => e.status === 'pass'));
const observations = (id: string) => events.filter((e: any) => e.case?.startsWith(id + ' '));
assert.equal(observations('C01').find((e: any) => e.event === 'run').committedUnits, 2);
for (const id of ['C02', 'C07']) {
  const r = observations(id).find((e: any) => e.event === 'run'); assert.equal(r.committedUnits, 1);
  assert(r.units.some((u: any) => u.state === 'BLOCKED' && u.attempts === 0));
}
for (const id of ['C03', 'C04']) assert(observations(id).some((e: any) => JSON.stringify(e).includes('plan_non_conformant')));
for (const e of analysis.callbackObservations) if (e.event === 'getter_calls') assert.equal(e.calls, 0);
assert.equal(pre.baselineCurrent370.length, 370);
for (const f of pre.baselineCurrent370) { const b = readFileSync(own + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); }
assert.equal(pre.readonlyProofs.length, 27); for (const f of pre.readonlyProofs) assert.equal(sha(readFileSync(isAbsolute(f.path) ? f.path : own + '/' + f.path)), f.sha256);
const source = readFileSync(own + '/tools/ff8-harness/src/simulator.ts'), testSource = readFileSync(own + '/tools/ff8-harness/test/simulator/simulator-copy-boundary-regressions.test.ts');
assert.equal(sha(source), '851e6ab20bc14a2ebad6fcf1a8a82b0d59f668aa44e3849878d1ef82c81773ca'); assert(source.equals(readFileSync(run + '/simulator.frozen.ts')));
assert.equal(sha(testSource), 'cb111c86b1fc047915036746b053174a2a55bff2efe45424cb4b93884352d099'); assert(testSource.equals(readFileSync(run + '/new-test.frozen.ts')));
const ast = ts.createSourceFile('simulator.ts', source.toString('utf8'), ts.ScriptTarget.Latest, true);
for (const d of pre.publicDtos) {
  const node = ast.statements.find(n => (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) && n.name.text === d.name); assert(node); assert.equal(sha(node.getText(ast)), d.sha256);
}
assert.equal(pre.publicDtos.length, 33); assert.equal(pre.packets.length, 4);
let inputPins = 0;
for (const p of pre.packets) {
  const location = own + '/' + p.path, rb = readFileSync(location + '/.preparation-receipt.json'); assert.equal(sha(rb), p.receiptSha256);
  const receipt = JSON.parse(rb.toString('utf8')); assert.equal(receipt.files.length, p.pins);
  for (const f of receipt.files) assert.equal(sha(readFileSync(location + '/' + f.path)), f.sha256); inputPins += p.pins;
}
assert.equal(inputPins, 402);
const cache = JSON.parse(readFileSync(run + '/opaque-temp-files.json', 'utf8')); assert.equal(cache.entries.length, 1);
assert.equal(cache.totalOpaqueBytes, 1357740); const cb = readFileSync(join(cache.root, cache.entries[0].path));
assert.equal(sha(cb), '50df8d62b57f5a78f17f517b3b339d2c91d920859cac41fe600fad94362ff23a');
assert.notEqual(cb.subarray(0, 15).toString(), 'SQLite format 3'); assert(cache.contentsNotDeserialized && cache.noDeletion);
assert.equal(post.changedCurrent.length, 0); assert.equal(post.changedOldProofs.length, 0); assert.equal(post.changedDtos.length, 0); assert(post.pinsExact && post.gatePassed);
const out = { at: new Date().toISOString(), task: go.task, own, run, artifactsSha256: sha(ab), artifact21Bytes: artifactBytes,
  sourceSha256: sha(source), testSha256: sha(testSource), typecheck0OneNaturalPid25080: true,
  tests: { pass: 195, fail: 0, skip: 0, assertions: 14473, files: 8, pid: 16688, exit: 0, natural: true, durationMs: test.elapsedMilliseconds },
  oneExactEightPathsAfterTsc0AndPost370PinsVerified: true, raw195Cases64UniqueEndsAllPassAndParentContrariesQualified: true,
  current370Dto33Old27Proofs402InputPinsFourReceiptsAndFrozenSourceTestExact: true,
  childTempExplicitReturnedLocalOpencodeFreshPath: cache.root, retainedOpaqueNodeCache1357740BytesHashedNeverDeserialized: true,
  notPretendChildTempInsideProofDirectoryNoDbOrL8FixtureAccessByThisCheck: true,
  red39PrepassAnd25FailToPassNot25IndependentPublicationBugsOrUniversalDomainProof: true,
  stage: 'TC195_DELIVERY_CONFORMING_READY_TO_PREPARE_SEPARATE_FULL_FREEZE_GATE not acceptance or integration',
  noTestRerunFullFreshReviewSourceFixOrNativeAuthorityGrantedByParentVerification: true };
writeFileSync(phase + '/l7-copy-tc195-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
