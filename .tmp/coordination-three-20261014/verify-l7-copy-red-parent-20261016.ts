import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy-red-actual-final-go-20261016.json', 'utf8'));
const own = go.own, run = own + '/.tmp/L7_COPY_BOUNDARY_20261016/RED-2026-10-16T145414437Z-copy-r1';
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const ab = readFileSync(run + '/ARTIFACTS.json'); assert.equal(sha(ab), '2709b3a99dd962f3fa7a07cb6ed21097d853906cb517ac0403920bf6927d70ce');
const artifacts = JSON.parse(ab.toString('utf8')); assert.equal(artifacts.files.length, 10); let artifactBytes = 0;
for (const f of artifacts.files) {
  assert(!f.path.includes(':') && !f.path.split('/').includes('..'));
  const b = readFileSync(run + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); artifactBytes += b.length;
}
const pre = JSON.parse(readFileSync(run + '/preflight.json', 'utf8')), post = JSON.parse(readFileSync(run + '/postflight.json', 'utf8'));
const result = JSON.parse(readFileSync(run + '/result.json', 'utf8'));
assert.equal(result.code, 1); assert.equal(result.signal, null); assert.equal(result.pid, 31948);
assert(!result.timedOut && result.spawnError === null && result.applicationInvocationCount === 1);
assert.equal(result.pass, 39); assert.equal(result.fail, 25); assert.equal(result.declaredCases, 64); assert.equal(result.caseEndCount, 64);
assert.equal(pre.declaredCases, 64); assert.equal(pre.maxUnitsPerFixture, 2); assert.equal(result.parseErrors.length, 0);
const out = readFileSync(run + '/stdout.log'), err = readFileSync(run + '/stderr.log');
assert.equal(sha(out), '7fd7f75866fe7e3bf1c5c6cf8d4293606436d2f17cefc20a4b6691a3274f3b85');
assert.equal(sha(err), '55cd5fca5e77b11ae0924b42d92361f212fc20bf15a8489d0f6d1c1e6aaf13eb');
const text = out.toString('utf8') + '\n' + err.toString('utf8');
assert(text.includes('39 pass') && text.includes('25 fail') && text.includes('386 expect') && text.includes('64 tests across 1 file'));
const events = readFileSync(run + '/case-events.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
const ends = events.filter((e: any) => e.event === 'case_end'); assert.equal(ends.length, 64);
assert.equal(new Set(ends.map((e: any) => e.case)).size, 64);
assert.equal(ends.filter((e: any) => e.status === 'pass').length, 39); assert.equal(ends.filter((e: any) => e.status === 'fail').length, 25);
const runFor = (id: string) => events.find((e: any) => e.case?.startsWith(id + ' ') && e.event === 'run');
assert.equal(runFor('C01').committedUnits, 2);
assert.equal(runFor('C02').committedUnits, 1); assert(runFor('C02').units.some((u: any) => u.state === 'BLOCKED' && u.attempts === 0));
for (const id of ['C03', 'C04']) { assert.equal(runFor(id).committedUnits, 2); assert(runFor(id).units.every((u: any) => u.state === 'COMMITTED' && u.attempts === 1)); }
const baseline = JSON.parse(readFileSync(own + '/.tmp/L7_COPY_BOUNDARY_20261016/PARENT_BASELINE.json', 'utf8'));
assert.equal(baseline.files.length, 369);
for (const f of baseline.files) { const b = readFileSync(own + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); }
const source = readFileSync(own + '/tools/ff8-harness/src/simulator.ts');
assert.equal(sha(source), '6d00cf296cf22378604ea9fc07e155ccf4cb6806186c5d2e63e55fbdbc89716f');
const ast = ts.createSourceFile('simulator.ts', source.toString('utf8'), ts.ScriptTarget.Latest, true);
const dtoCount = ast.statements.filter(n => (ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n)) && n.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).length;
assert.equal(dtoCount, 33);
for (const f of pre.oldProofs) { const b = readFileSync(own + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); }
for (const requestFile of ['l7-copy-boundary-preparation-request-20261016.json', 'l7-copy-plan-approval-request-20261016.json']) {
  const q = JSON.parse(readFileSync(phase + '/' + requestFile, 'utf8'));
  for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
}
const test = readFileSync(own + '/' + go.allowedNewTest); assert.equal(test.length, 27720);
assert.equal(sha(test), 'cb111c86b1fc047915036746b053174a2a55bff2efe45424cb4b93884352d099');
assert(post.newTestUnchanged && post.changedBaselineFiles.length === 0 && post.changedPublicDtos.length === 0);
const receipt = { at: new Date().toISOString(), task: go.task, own, run, artifactsSha256: sha(ab), artifact10Bytes: artifactBytes,
  red: { pass: 39, fail: 25, tests: 64, assertions: 386, maxUnits: 2, pid: 31948, exit: 1, durationMs: result.elapsedMilliseconds },
  testPath: go.allowedNewTest, testBytes: test.length, testSha256: sha(test),
  source6d00AndBaseline369Dto33OldProofsAnd392Plus3PacketsExact: true,
  parentFourOriginalCasesAndControlsMatchOwnPriorReproduction: true,
  raw64UniqueCaseEndsNoParseErrorAndLogsCountsVerified: true,
  failedCasesQualifiedAgainstRatifiedDomainNot25IndependentPublicationBugs: true,
  parentC56CriticalPath10Work12RedDerivedFromTwoUnitsAB2_3R1Validation1: true,
  parentC57_60CallbackSingleAcquisitionJournalTuplesWithinRatifiedBoundaryContract: true,
  ordinaryMissingRequirementConsumerOnlyBlockAndHardAdoptionReleaseContrariesRetained: true,
  old131AcrossSevenFilesByteExactVia369NotPretendAll131OnlyFiveSimulatorFilesOrReexecuted: true,
  stage: 'BASELINE_RED_RECEIVABLE_READY_FOR_SEPARATE_SOURCE_ONLY_WRITE_GATE not corrective acceptance',
  noSourceFixTypecheckOldSuiteRerunSqliteFullOrIntegrationGoByVerification: true };
writeFileSync(phase + '/l7-copy-red-parent-verification-20261016.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(receipt));
