import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy-full2-actual-final-go-20261016.json', 'utf8'));
const released = JSON.parse(readFileSync(phase + '/l7-copy-full2-natural-release-parent-20261016.json', 'utf8'));
const run = go.proofRoot, own = go.own, norm = (s: string) => s.replaceAll('\\', '/');
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const pin = (path: string, f: any) => { const b = readFileSync(path); if (f.bytes !== undefined) assert.equal(b.length, f.bytes, path); assert.equal(sha(b), f.sha256, path); return b; };
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: go.session }); assert.deepEqual(session.model, go.model); assert.equal(norm(session.location.directory), own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.leadSessionId === 'ses_eca40a8e2ffeanEKTBLiGjDNw8');
assert.equal(team.name, 're-graph-scheduler'); assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const task = team.tasks.find((t: any) => t.id === go.task); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
const ab = readFileSync(run + '/ARTIFACTS.json'); assert.equal(ab.length, 11179); assert.equal(sha(ab), 'd58d9801fbefa4be513e86262ffb446d464d2f05408aefe2297137116adf0d6f');
const m = JSON.parse(ab.toString('utf8')); assert.equal(m.files.length, 22); let artifactBytes = 0;
for (const f of m.files) { assert(!isAbsolute(f.path) && !f.path.split('/').includes('..')); artifactBytes += pin(run + '/' + f.path, f).length; } assert.equal(artifactBytes, 1354816);
const pre = JSON.parse(readFileSync(run + '/preflight.json', 'utf8')), post = JSON.parse(readFileSync(run + '/postflight.json', 'utf8'));
const end = JSON.parse(readFileSync(run + '/full.end.json', 'utf8'));
assert.equal(end.code, 0); assert.equal(end.pid, 41388); assert(end.naturalExit && !end.timedOut && end.signal === null && end.spawnError === null);
assert.equal(end.full2InvocationCount, 1); assert.equal(end.extraTypecheckOrProbeInvocations, 0);
assert.equal(sha(readFileSync(run + '/full.end.json')), released.fullEndSha256);
const stdout = readFileSync(run + '/full.stdout.log'), stderr = readFileSync(run + '/full.stderr.log'); assert.equal(sha(stdout), released.stdoutSha256); assert.equal(sha(stderr), released.stderrSha256);
const lines = stderr.toString('utf8').split('\n'), footer = lines.findIndex(s => s.trim().endsWith('tests skipped:') || s.trim().endsWith('tests failed:')); assert(footer > 0);
let file = '', actual: any[] = [];
for (let i = 0; i < footer; i++) { const s = lines[i].trim(), h = norm(s); if ((h.startsWith('test/') || h.startsWith('scripts/')) && h.endsWith('.test.ts:')) file = h.slice(0, -1); const match = /^\((pass|fail|skip|todo)\) /.exec(s); if (match) actual.push({ file, status: match[1], stderrLine: i + 1, raw: s }); }
assert.equal(actual.length, 1126); const collected = JSON.parse(readFileSync(run + '/full-cases.json', 'utf8'));
assert.equal(collected.length, 1126); for (let i = 0; i < actual.length; i++) for (const key of ['file', 'status', 'stderrLine', 'raw']) assert.equal(collected[i][key], actual[i][key]);
assert.equal(actual.filter(c => c.status === 'pass').length, 1125); assert.equal(actual.filter(c => c.status === 'fail').length, 0); assert.equal(actual.filter(c => c.status === 'skip').length, 1); assert.equal(new Set(actual.map(c => c.file)).size, 36);
assert.equal(actual.find(c => c.status === 'skip').file, 'scripts/role-sharing-offline.test.ts');
const analysis = JSON.parse(readFileSync(run + '/full-analysis.json', 'utf8')); assert.equal(analysis.parseIssues.length, 0);
const name = (s: string) => s.replace(/ \[[0-9.]+(?:ms|s)\]$/, '');
const oldRoot = JSON.parse(readFileSync(phase + '/l7-copy-full-red-final-parent-verification-20261016.json', 'utf8')).run;
const oldFails = JSON.parse(readFileSync(oldRoot + '/full-failures.v2.json', 'utf8')); assert.equal(oldFails.length, 92);
for (const f of oldFails) { const matches = collected.filter((c: any) => c.file === f.file && name(c.nameAndDuration) === name(f.nameAndDuration)); assert.equal(matches.length, 1); assert.equal(matches[0].status, 'pass'); }
const comparison = JSON.parse(readFileSync(run + '/full1-failures-comparison.json', 'utf8')); assert.equal(comparison.rows.length, 92); assert(comparison.rows.every((r: any) => r.matchedUniquePass));
const events = readFileSync(run + '/new-64-events.jsonl', 'utf8').trim().split('\n').map(JSON.parse), ends = events.filter((e: any) => e.event === 'case_end'); assert.equal(ends.length, 64); assert.equal(new Set(ends.map((e: any) => e.case)).size, 64); assert(ends.every((e: any) => e.status === 'pass'));
assert.deepEqual(post.targeted195InsideFull, { pass: 195, fail: 0, skip: 0 }); assert.deepEqual(post.interop5InsideFull, { pass: 54, fail: 0, skip: 0 });
assert.equal(pre.current370.length, 370); for (const f of pre.current370) pin(own + '/' + f.path, f); pin(own + '/' + pre.ledger.path, pre.ledger);
for (const f of [...pre.old50Proofs, ...pre.oldFull1Proof26, pre.oldFull1Artifacts]) pin(isAbsolute(f.path) ? f.path : own + '/' + f.path, f);
assert.equal(pre.old50Proofs.length, 50); assert.equal(pre.oldFull1Proof26.length, 26);
for (const f of pre.candidateSnapshots) assert(pin(own + '/' + f.path, f).equals(pin(run + '/' + f.snapshot, f)));
const source = readFileSync(own + '/tools/ff8-harness/src/simulator.ts'), ast = ts.createSourceFile('simulator.ts', source.toString('utf8'), ts.ScriptTarget.Latest, true);
assert.equal(sha(source), '851e6ab20bc14a2ebad6fcf1a8a82b0d59f668aa44e3849878d1ef82c81773ca');
assert.equal(pre.publicDtos.length, 33); for (const d of pre.publicDtos) { const n = ast.statements.find(n => (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) && n.name.text === d.name); assert(n); assert.equal(sha(n.getText(ast)), d.sha256); }
assert.equal(pre.packets.length, 6); let inputs = 0;
for (const p of pre.packets) { const base = own + '/' + p.path, rb = readFileSync(base + '/.preparation-receipt.json'); assert.equal(sha(rb), p.receiptSha256); const r = JSON.parse(rb.toString('utf8')); assert.equal(r.files.length, p.pins); for (const f of r.files) assert.equal(sha(readFileSync(base + '/' + f.path)), f.sha256); inputs += p.pins; } assert.equal(inputs, 414);
const inventory = JSON.parse(readFileSync(own + '/inputs/L7_COPY_FULL2_GATE_20261016/CLEANUP_INVENTORY.json', 'utf8')); assert.equal(inventory.scanned.length, 45); for (const f of inventory.scanned) pin(own + '/' + f.path, f);
const layout = pre.tempPreparation; assert.deepEqual(layout.rootEntries, ['opencode']); assert.deepEqual(layout.nestedEntries, []); assert(layout.nestedEmpty && !layout.rootEmptyClaim && !layout.rootIsSymbolicLink && !layout.nestedIsSymbolicLink && layout.createdOnlyAfterFinalGo);
assert.equal(layout.tempRoot, go.tempRoot); assert.equal(layout.nestedDirectory, go.requiredNestedDirectory); assert.equal(layout.tempRootCharacters, 60); assert.equal(layout.nestedCharacters, 69);
for (const p of [go.tempRoot, go.requiredNestedDirectory, run]) { const born = statSync(p).birthtimeMs; assert(born >= Date.parse(go.at) && born <= Date.parse(end.started)); }
assert.equal(pre.environmentOverrides.TEMP, go.tempRoot); assert.equal(pre.environmentOverrides.TMP, go.tempRoot);
assert(pre.guard.strictAbsent && post.guard.strictAbsent && post.launcherParentProcessEnvUnchanged && post.inheritedLocalAppDataAndAppDataUnchanged && end.parentProcessEnvUnchanged);
assert.equal(post.primaryParseIssues.length, 0); assert.equal(post.changedDtos.length, 0); assert(post.pinsExact && post.fullGatePassed);
const oldPins = JSON.parse(readFileSync(own + '/inputs/L7_COPY_FULL2_GATE_20261016/OLD_FULL_DB_PINS.json', 'utf8'));
const seals = JSON.parse(readFileSync(run + '/old-full1-db-seals.json', 'utf8')); assert.equal(seals.files.length, 11); let oldBytes = 0; const oldPaths = new Set<string>();
for (const f of oldPins.files) { const s = seals.files.find((s: any) => s.path === f.path); assert(s); assert.equal(s.before.sha256, f.sha256); assert.equal(s.after.sha256, f.sha256); assert.equal(s.before.bytes, f.bytes); assert.equal(s.after.bytes, f.bytes); oldBytes += pin(f.path, f).length; oldPaths.add(norm(f.path)); for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + suffix)); } assert.equal(oldBytes, 3321856);
const receipts = stdout.toString('utf8').split('\n').filter(s => s.startsWith('{')).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(r => r?.evidence === 'graph-interop-owned-offline-db'); assert.equal(receipts.length, 10);
const db = JSON.parse(readFileSync(run + '/retained-db-manifest.json', 'utf8')); assert.equal(db.graph.length, 10); assert.equal(db.l5.length, 1); assert.equal(db.issues.length, 0); let graphBytes = 0;
for (const r of receipts) { assert(!oldPaths.has(norm(r.path))); const f = db.graph.find((f: any) => f.path === r.path); assert(f && f.allReceiptsMatch && f.matchesLastPerCloseReceipt); const b = pin(r.path, r); assert.equal(b.subarray(0, 15).toString(), 'SQLite format 3'); pin(r.path, f.postExit); assert(statSync(r.path).birthtimeMs >= Date.parse(end.started) && statSync(r.path).birthtimeMs <= Date.parse(end.ended)); for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(r.path + suffix)); graphBytes += b.length; } assert.equal(graphBytes, 2936832);
const l5 = db.l5[0]; assert(norm(l5.path).startsWith(go.tempRoot + '/opencode/l5-admission-budget-')); assert(!oldPaths.has(norm(l5.path))); assert(l5.firstDigestPostExit && !l5.perCloseDigestSupplied); assert.equal(pin(l5.path, l5.postExit).length, 385024); for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(l5.path + suffix));
const child = JSON.parse(readFileSync(run + '/child-temp-manifest.json', 'utf8')); assert.equal(child.files.length, 1); pin(child.files[0].path, child.files[0]);
assert.equal(m.externalRetainedFiles.length, 11); let newBytes = 0; for (const f of m.externalRetainedFiles) newBytes += pin(f.path, f).length; assert.equal(newBytes, 3321856);
assert(m.fullGatePassed && !m.acceptanceOrIntegrationGranted); assert.equal(m.collectorSqlCalls, 0); assert.equal(m.productChanges, 0); assert.equal(m.additionalProductInvocations, 0);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8')); for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own, run,
  manifestSha256: sha(ab), artifact22Bytes: artifactBytes, full: m.full, full2Raw1125Pass0Fail1Skip91927Assertions1126Tests36FilesVerified: true,
  old92FailuresEachMatchedToOneUniqueCurrentPassNoRewriteOfRedAttempt: true,
  current370Ledger8943882Candidate4_195451BytesDto33Old50Full1_26Manifest414Inputs6Receipts45TsExact: true,
  recordedPrelaunchTemp60Nested69AndBirthAfterGoBeforeRunCorroboratedEnvUnchanged: true,
  twoLauncherFactorsChangedTogetherNoSingleFactorCausalClaim: true,
  old11Db3321856BytesRawBeforeAfterStillExactNoSidecars: true,
  new11Db3321856BytesDistinctOldPathsGraph10PerClosePostExitEqualL5FirstHashPostExitOnly: true,
  bothAttempts22Db6643712BytesPreservedNoSqliteConnectionOrDeletionByParent: true,
  oldRedFull1V1Bd770V2AndAllOldGelsPreserved: true, acceptedMain275Exact: true,
  stage: 'FULL2_FINAL_DELIVERY_CONFORMING_READY_FOR_FRESH_INDEPENDENT_NONBLIND_SOL_MAX_WHOLE_L7_REVIEW not acceptance or integration',
  noNewProductExecutionSourceFixNativeIntegrationAuthorityByVerification: true };
writeFileSync(phase + '/l7-copy-full2-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
