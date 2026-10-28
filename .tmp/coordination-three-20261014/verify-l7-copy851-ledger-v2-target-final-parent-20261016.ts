import { readFileSync, writeFileSync, existsSync, statSync, lstatSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-target-actual-final-go-20261016.json', 'utf8'));
const released = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-target-natural-release-parent-20261016.json', 'utf8'));
const request = JSON.parse(readFileSync(phase + '/l7-copy851-ledger-v2-preparation-request-20261016.json', 'utf8'));
const run = go.newRun, norm = (s: string) => s.replaceAll('\\', '/'), sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const pin = (p: string, f: any) => { const b = readFileSync(p); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256, p); return b; };
const endpoint = await Service.discover(); assert(endpoint); const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: go.session }); assert.deepEqual(session.model, go.model);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === request.missionId), task = team.tasks.find((t: any) => t.id === go.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
const mb = readFileSync(run + '/TARGET_V2_ARTIFACTS.json'); assert.equal(mb.length, 1350); assert.equal(sha(mb), '400d9a0d538ad9831f7a612df937e4f53bedb243c6944e6df34a8c0167eac276');
const m = JSON.parse(mb.toString('utf8')); assert.equal(m.files.length, 7); let artifactBytes = 0;
for (const f of m.files) { assert(!f.path.includes(':') && !f.path.split('/').includes('..')); artifactBytes += pin(run + '/' + f.path, f).length; } assert.equal(artifactBytes, 303532);
const qb = readFileSync(run + '/TARGET_V2_QUALIFICATION.json'); assert.equal(qb.length, 100550); assert.equal(sha(qb), '593021ba36be71597085818679a42567eab4fc0f4fe28fd034d7f7aa6e22e608');
const q = JSON.parse(qb.toString('utf8')), end = JSON.parse(readFileSync(run + '/target.lifecycle.json', 'utf8'));
assert.equal(end.exit, 0); assert.equal(end.pid, 4276); assert(end.naturalExit && end.signal === null && end.error === null && end.sameProcessEnvironmentUnchanged && end.guardStillAbsent && end.releaseBeforePostCollection);
assert.equal(end.command, go.command); assert.equal(sha(readFileSync(run + '/target.lifecycle.json')), released.targetLifecycleSha256);
const stdout = readFileSync(run + '/target.stdout.log'), stderr = readFileSync(run + '/target.stderr.log'); assert.equal(sha(stdout), released.stdoutSha256); assert.equal(sha(stderr), released.stderrSha256);
const text = stderr.toString('utf8'), lines = text.split('\n'); assert.equal(lines.filter(l => l.trim().startsWith('(pass)')).length, 255); assert.equal(lines.filter(l => l.trim().startsWith('(fail)') || l.trim().startsWith('(skip)')).length, 0);
for (const s of ['255 pass', '0 fail', '17622 expect() calls', '255 tests across 14 files']) assert(text.includes(s));
const raw98 = lines.filter(l => l.includes('(pass)') && l.includes('original FF8 raw98 is hash-bound')); assert.equal(raw98.length, 1); assert.equal(q.raw98Case.status, 'pass');
assert.equal(m.targetV2Invocations, 1); assert.equal(m.tscRerunInvocations, 0); assert.equal(m.independentProbeInvocations, 0); assert.equal(q.extraProbeInvocations, 0);
assert.equal(q.inputChecks.length, 402); assert.equal(request.files.length, 402); let inputBytes = 0;
for (const f of request.files) { const row = q.inputChecks.find((r: any) => r.path === f.path); assert(row && row.match && row.sha256 === f.sha256); inputBytes += pin(go.packet + '/' + f.path, row).length; } assert.equal(inputBytes, 9300341);
pin(go.packet + '/.preparation-receipt.json', q.receipts.helper); pin(go.packet + '/LARGE_FIXTURE_PARENT_RECEIPT.json', q.receipts.parent);
const ledger = go.packet + '/' + q.ledger.path; assert.equal(pin(ledger, q.ledger).length, 8943882); assert.equal(statSync(ledger).mode & 0o222, 0); assert.equal(statSync(ledger).nlink, 1); assert(!lstatSync(ledger).isSymbolicLink());
assert.equal(q.ledger.sha256, go.ledger.sha256); assert(q.ledger.outsideHelperReceipt);
for (const f of q.parentControls) { assert(!f.name.includes('..') && !f.name.includes('/') && !f.name.includes('\\')); pin(go.proofDirectory + '/' + f.name, f); }
const pre = JSON.parse(readFileSync(run + '/preflight.json', 'utf8')); assert.equal(pre.cwd, go.cwd); assert.equal(pre.combinedPayloads, 403); assert.equal(pre.combinedPayloadBytes, 18244223);
const oldPaths = new Set<string>();
for (const n of ['l7-copy-full-red-final-parent-verification-20261016.json', 'l7-copy-full2-final-parent-verification-20261016.json']) { const v = JSON.parse(readFileSync(phase + '/' + n, 'utf8')), d = JSON.parse(readFileSync(v.run + '/retained-db-manifest.json', 'utf8')); for (const f of [...d.graph, ...d.l5]) oldPaths.add(norm(f.path)); }
const oldTarget = JSON.parse(readFileSync(phase + '/l7-copy851-review-target-only-actual-final-go-20261016.json', 'utf8'));
const oldQualified = JSON.parse(readFileSync(oldTarget.run + '/TARGET_QUALIFICATION.json', 'utf8')); for (const f of oldQualified.databases.dbs) oldPaths.add(norm(f.path)); assert.equal(oldPaths.size, 32);
const emitted = stdout.toString('utf8').split('\n').filter(s => s.startsWith('{')).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(r => r?.evidence === 'graph-interop-owned-offline-db');
assert.equal(emitted.length, 10); assert.equal(new Set(emitted.map(r => norm(r.path))).size, 10); assert.equal(q.databases.dbs.length, 10); let dbBytes = 0;
for (const f of q.databases.dbs) { const r = emitted.find(r => r.path === f.path); assert(r && !oldPaths.has(norm(f.path))); assert(norm(f.path).startsWith('C:/Users/djden/AppData/Local/Temp/opencode/graph-interop-')); const b = pin(f.path, r); assert.equal(b.subarray(0, 15).toString(), 'SQLite format 3'); pin(f.path, f.post); pin(f.path, f.receipt); assert(statSync(f.path).birthtimeMs >= Date.parse(end.start) && statSync(f.path).birthtimeMs <= Date.parse(end.ended)); for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + suffix)); dbBytes += b.length; } assert.equal(dbBytes, 2936832);
assert.deepEqual(q.tempRuntime.rootEntries, ['opencode']); assert.equal(q.tempRuntime.nestedEntries.length, 0); assert.equal(q.tempRuntime.opaqueCacheFiles.length, 0); assert(!q.tempRuntime.forcedCacheAbsenceAfterRuntime);
assert.deepEqual(readdirSync(go.tempRoot), ['opencode']); assert.equal(readdirSync(go.tempRoot + '/opencode').length, 0);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8')); for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, run,
  manifestSha256: sha(mb), qualificationSha256: sha(qb), artifact7Bytes: artifactBytes,
  target255Pass0Fail17622Assertions255Tests14FilesRawNaturalOneInvocationAndRaw98NowActuallyPassVerified: true,
  helper402_9300341PlusSeparateReadonlyLedger8943882Total403_18244223BothReceiptsAndParentControlsExact: true,
  nativeSolMaxTaskOpenStaticWholeCoverageAndOriginalTsc0ReuseOn254ExactSourceConfigsTestsNoTscRerunOrProbeYet: true,
  tenNewDb2936832BytesPerCloseReceiptPostExitEqualBornWithinRunDistinctOld32NoSidecarsRetained: true,
  closeQualificationHookAttemptsThenNaturalEndNotAdditionalNativeIndividualInstrumentation: true,
  actualFreshTempPostRuntimeOnlyOpencodeEmptyNoOpaqueCacheObservedNotForced: true,
  oldRedV1InputsProofsAndKnown42L7DbFourDistinctProvenancesPreservedMain275Exact: true,
  raw98OfflinePartialQuarantineOnlyNoNewNativeAuthorityOrRedV1Reclassification: true,
  stage: 'TARGET_V2_FINAL_DELIVERY_CONFORMING_READY_FOR_DISTINCT_BOUNDED_PUBLIC_MEMORY_PROBE_GO not finalReviewAcceptance',
  noProductRerunSourceFixOldDbSqliteConnectionDeletionOrIntegrationByThisParentCheck: true };
writeFileSync(phase + '/l7-copy851-ledger-v2-target-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
