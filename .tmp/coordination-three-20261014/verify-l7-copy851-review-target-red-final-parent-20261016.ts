import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy851-review-target-only-actual-final-go-20261016.json', 'utf8'));
const original = JSON.parse(readFileSync(phase + '/l7-copy851-review-dynamic-actual-final-go-20261016.json', 'utf8'));
const red = JSON.parse(readFileSync(phase + '/l7-copy851-review-target-red-parent-observation-20261016.json', 'utf8'));
const run = go.run, norm = (s: string) => s.replaceAll('\\', '/'), sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const pin = (path: string, f: any) => { const b = readFileSync(path); assert.equal(b.length, f.bytes, path); assert.equal(sha(b), f.sha256, path); return b; };
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: go.session }); assert.deepEqual(session.model, go.model);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler'), task = team.tasks.find((t: any) => t.id === go.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review'); assert.equal(team.members.find((m: any) => m.name === task.assignee).agent, 'plan');
const mb = readFileSync(run + '/TARGET_ARTIFACTS.json'); assert.equal(mb.length, 2337); assert.equal(sha(mb), '8147316704de1e4671082618839da44fe92aecb213d0615c92a07ce2da43a086');
const m = JSON.parse(mb.toString('utf8')); assert.equal(m.files.length, 13); let artifactBytes = 0;
for (const f of m.files) { assert(!f.path.includes(':') && !f.path.split('/').includes('..')); artifactBytes += pin(run + '/' + f.path, f).length; } assert.equal(artifactBytes, 1761818);
const qb = readFileSync(run + '/TARGET_QUALIFICATION.json'); assert.equal(qb.length, 151096); assert.equal(sha(qb), 'b74c5bb5383460927f2715baa8fdcdd113ed7c0c2a9a016190f990752c023b54');
const q = JSON.parse(qb.toString('utf8')), end = JSON.parse(readFileSync(run + '/target.lifecycle.json', 'utf8'));
assert.equal(end.exit, 1); assert.equal(end.pid, 43764); assert(end.naturalExit && end.signal === null && end.error === null && end.sameProcessEnvironmentUnchanged && end.guardStillAbsent);
assert.equal(end.command, go.command); assert.equal(sha(readFileSync(run + '/target.lifecycle.json')), red.targetLifecycleSha256);
const stdout = readFileSync(run + '/target.stdout.log'), stderr = readFileSync(run + '/target.stderr.log'); assert.equal(sha(stdout), red.stdoutSha256); assert.equal(sha(stderr), red.stderrSha256);
const lines = stderr.toString('utf8').split('\n'), footer = lines.findIndex(s => s.trim().endsWith('tests failed:')); assert(footer > 0);
const counts = { pass: 0, fail: 0, skip: 0 }, files = new Set<string>(); let file = '';
for (const s0 of lines.slice(0, footer)) { const s = norm(s0.trim()); if (s.startsWith('test/') && s.endsWith('.test.ts:')) file = s.slice(0, -1); const match = /^\((pass|fail|skip)\) /.exec(s); if (match) { counts[match[1] as keyof typeof counts]++; files.add(file); } }
assert.deepEqual(counts, { pass: 254, fail: 1, skip: 0 }); assert.equal(files.size, 14); assert.equal(q.counts.assertions, 17608);
assert(stderr.toString('utf8').includes('17608 expect() calls') && stderr.toString('utf8').includes('battle-graph-ledger.json'));
assert.equal(q.extraProbeInvocations, 0); assert.equal(m.targetInvocations, 1); assert.equal(m.tscInvocations, 1); assert.equal(m.extraProbeInvocations, 0);
assert.equal(q.pins.checks.length, 393); let pinBytes = 0;
for (const f of q.pins.checks) { assert([original.packet, original.qualificationPacket].includes(f.root)); pinBytes += pin(f.root + '/' + f.path, f).length; } assert.equal(pinBytes, 9002942);
assert.equal(q.pins.receipts.length, 2); for (const f of q.pins.receipts) pin(f.root + '/.preparation-receipt.json', f);
assert.equal(q.pins.old4.length, 4); for (const f of q.pins.old4) pin(run + '/' + f.name, f);
assert.equal(q.pins.controls.length, 8); for (const f of q.pins.controls) { assert(!f.name.includes('/') && !f.name.includes('\\') && !f.name.includes('..')); pin(original.proofDirectory + '/' + f.name, f); }
assert.equal(sha(readFileSync(run + '/SETUP_ENV_DIAGNOSTIC.json')), '604a5c8b1f19a53df3565ad7efd9908ffef231b909c3a2eccc978e0dfee282b7');
assert(!existsSync(original.packet + '/' + red.missingFixtureRelativePath));
const oldPaths = new Set<string>();
for (const name of ['l7-copy-full-red-final-parent-verification-20261016.json', 'l7-copy-full2-final-parent-verification-20261016.json']) { const v = JSON.parse(readFileSync(phase + '/' + name, 'utf8')), d = JSON.parse(readFileSync(v.run + '/retained-db-manifest.json', 'utf8')); for (const f of [...d.graph, ...d.l5]) oldPaths.add(norm(f.path)); }
assert.equal(oldPaths.size, 22);
const emitted = stdout.toString('utf8').split('\n').filter(s => s.startsWith('{')).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(r => r?.evidence === 'graph-interop-owned-offline-db');
assert.equal(emitted.length, 10); assert.equal(new Set(emitted.map(r => norm(r.path))).size, 10); assert.equal(q.databases.dbs.length, 10); let dbBytes = 0;
for (const f of q.databases.dbs) {
  const r = emitted.find(r => r.path === f.path); assert(r && !oldPaths.has(norm(f.path))); assert(norm(f.path).startsWith('C:/Users/djden/AppData/Local/Temp/opencode/graph-interop-'));
  const b = pin(f.path, r); assert.equal(b.subarray(0, 15).toString(), 'SQLite format 3'); pin(f.path, f.postExit); pin(f.path, f.emittedAfterCloseHook);
  assert(statSync(f.path).birthtimeMs >= Date.parse(end.start) && statSync(f.path).birthtimeMs <= Date.parse(end.ended));
  for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + suffix)); dbBytes += b.length;
} assert.equal(dbBytes, 2936832);
assert.equal(q.opaqueCache.length, 1); const cache = q.opaqueCache[0]; pin(cache.origin, cache.postExit); pin(cache.snapshot, cache.snapshotAfter); assert(cache.matchesBefore);
for (const f of go.opaqueCacheBeforeSnapshots) pin(f.path, f);
assert.deepEqual(q.tempLayoutAfter.rootEntries, ['node-compile-cache', 'opencode']); assert.equal(q.tempLayoutAfter.nestedEntries.length, 0);
assert.equal(q.fileCounts['test/simulator/simulator-copy-boundary-regressions.test.ts'].pass, 64); assert.equal(q.fileCounts['test/benchmarks/graph-interop-scale.test.ts'].pass, 6);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8')); for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: go.task, session: session.id, model: session.model, run,
  manifestSha256: sha(mb), qualificationSha256: sha(qb), artifact13Bytes: artifactBytes,
  target254Pass1Fail17608Assertions255Tests14FilesRawVerifiedNaturalExit1OneInvocationTsc0PreservedProbes0: true,
  all393Pins9002942Bytes2ReceiptsOld4Diagnostic8ParentControlsAndSource4Dto33UnchangedBySourceHash: true,
  missingLedgerFixtureParentPacketDesignErrorQualifiedNo851RegressionDemonstratedNotTestWaived: true,
  tenNewDb2936832BytesExplicitStdoutPostExitHashesEqualBornWithinRunDistinctOld22NoSidecars: true,
  closeQualificationFixtureClosesAttemptedBeforeReceiptThenNaturalProcessEndNotAdditionalIndividualNativeInstrumentation: true,
  cache1357764AndImmutableSnapshotEqualOpaqueNeverDeserializedNoDeleteOrSqliteParentConnection: true,
  oldDiagnosticFalseFlagAndHistoricalInputGelsAllPreservedMain275Exact: true,
  sameFreshNonblindExposureAndStandaloneStoreLimitsRetainedTaskStillOpenNoAcceptableVerdict: true,
  stage: 'RED_TARGET_FINAL_DELIVERY_CONFORMING_PARENT_MISSING_LEDGER_QUALIFIED_HOLD_AWAIT_USER_APPROVAL_NEW_FREEZE_LARGE_FIXTURE_PROJECTION_AND_DISTINCT_TARGET_GATE',
  noLargeFixtureCopyLinkSplitHelperLimitChangeRerunProbeSourceFixNativeOrIntegrationPermission: true };
writeFileSync(phase + '/l7-copy851-review-target-red-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
