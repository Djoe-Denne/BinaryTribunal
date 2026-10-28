import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const release = JSON.parse(readFileSync(phase + '/l7-copy-full-failed-natural-release-parent-20261016.json', 'utf8'));
const go = JSON.parse(readFileSync(phase + '/l7-copy-full-actual-final-go-20261016.json', 'utf8'));
const run = release.run, own = go.own, norm = (s: string) => s.replaceAll('\\', '/');
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const check = (path: string, f: any) => { const b = readFileSync(path); if (f.bytes !== undefined) assert.equal(b.length, f.bytes, path); assert.equal(sha(b), f.sha256, path); return b; };
const endpoint = await Service.discover(); assert(endpoint);
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await client.session.get({ sessionID: go.session });
const lead = await client.session.get({ sessionID: 'ses_eca40a8e2ffeanEKTBLiGjDNw8' });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6-astra', variant: 'max' });
assert.deepEqual(lead.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'xhigh' });
assert.equal(norm(session.location.directory), own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.leadSessionId === lead.id); assert.equal(team.name, 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === go.task); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy-astra');
assert.equal(team.members.find((m: any) => m.name === 'l7-copy-astra').sessionId, session.id);
assert.equal(team.modelPolicy.revision, 2); assert.equal(team.routingPolicy.revision, 4);
const ab = readFileSync(run + '/ARTIFACTS.json'); assert.equal(ab.length, 10913);
assert.equal(sha(ab), '88695448e860fd91af0ee9a74d02ac1c57386a62b9ba4c673b6b3dc4c781335e');
const m = JSON.parse(ab.toString('utf8')); assert.equal(m.files.length, 26); assert.equal(m.externalRetainedFiles.length, 10);
let proofBytes = 0; for (const f of m.files) {
  assert(!isAbsolute(f.path) && !f.path.split('/').includes('..')); proofBytes += check(run + '/' + f.path, f).length;
} assert.equal(proofBytes, 2774952);
const pre = JSON.parse(readFileSync(run + '/preflight.json', 'utf8')), post = JSON.parse(readFileSync(run + '/postflight.json', 'utf8'));
const end = JSON.parse(readFileSync(run + '/full.end.json', 'utf8'));
assert.equal(end.code, 1); assert.equal(end.pid, 40332); assert.equal(end.signal, null); assert(end.naturalExit && !end.timedOut && end.spawnError === null);
assert.equal(sha(readFileSync(run + '/full.end.json')), release.fullEndSha256);
const stdout = readFileSync(run + '/full.stdout.log'), stderr = readFileSync(run + '/full.stderr.log');
assert.equal(sha(stdout), release.stdoutSha256); assert.equal(sha(stderr), release.stderrSha256);
const allText = stdout.toString('utf8') + '\n' + stderr.toString('utf8');
for (const s of ['1033 pass', '92 fail', '1 skip', '91154 expect', '1126 tests across 36 files']) assert(allText.includes(s));
const lines = stderr.toString('utf8').split('\n'), footer = lines.findIndex(s => s.trim().endsWith('tests skipped:') || s.trim().endsWith('tests failed:')); assert(footer > 0);
let file = '', actual: any[] = [];
for (let i = 0; i < footer; i++) {
  const s = lines[i].trim(), header = norm(s); if ((header.startsWith('test/') || header.startsWith('scripts/')) && header.endsWith('.test.ts:')) file = header.slice(0, -1);
  const match = /^\((pass|fail|skip|todo)\) /.exec(s);
  if (match) actual.push({ file, status: match[1], stderrLine: i + 1, raw: s });
}
assert.equal(actual.length, 1126); const v2 = JSON.parse(readFileSync(run + '/full-cases.v2.json', 'utf8'));
assert.equal(v2.length, actual.length); for (let i = 0; i < actual.length; i++) for (const key of ['file', 'status', 'stderrLine', 'raw']) assert.equal(v2[i][key], actual[i][key]);
const counts = { pass: 0, fail: 0, skip: 0, todo: 0 }; for (const c of actual) counts[c.status as keyof typeof counts]++;
assert.deepEqual(counts, { pass: 1033, fail: 92, skip: 1, todo: 0 });
assert.equal(new Set(actual.map(c => c.file)).size, 36);
const failFiles: Record<string, number> = {}; for (const c of actual.filter(c => c.status === 'fail')) failFiles[c.file] = (failFiles[c.file] ?? 0) + 1;
assert.deepEqual(failFiles, { 'test/engine.test.ts': 2, 'test/eventlog.test.ts': 90 });
const failures = JSON.parse(readFileSync(run + '/full-failures.v2.json', 'utf8')); assert.equal(failures.length, 92);
assert(failures[0].errorLines.join('\n').includes('SQLITE_CANTOPEN'));
assert(failures.slice(1).every((f: any) => f.errorLines.join('\n').includes('ENOENT')));
assert.equal(failures.filter((f: any) => f.classification.endsWith('for mkdir')).length, 1);
assert.equal(failures.filter((f: any) => f.classification.endsWith('for mkdtemp')).length, 90);
const v1 = readFileSync(run + '/full-failures.json');
assert.equal(sha(v1), 'bd770c9286422da098752349270f7599ff67487c0ee5f9cc0c287e49894e913e');
assert(v1.equals(readFileSync(phase + '/l7-copy-full-initial-parser184-preserved-20261016.json')));
assert.equal(JSON.parse(v1.toString('utf8')).length, 184);
for (const f of m.oldV1Preserved) check(run + '/' + f.path, f);
const correction = JSON.parse(readFileSync(run + '/reader-correction.json', 'utf8')); assert.equal(correction.v2PrimaryRows, 1126); assert.equal(correction.footerRowsExcluded, 93);
const analysis = JSON.parse(readFileSync(run + '/full-analysis.v2.json', 'utf8')); assert.equal(analysis.parseIssues.length, 0);
assert.deepEqual(analysis.targeted195InsideFull, { pass: 195, fail: 0, skip: 0 }); assert.deepEqual(analysis.interop5InsideFull, { pass: 54, fail: 0, skip: 0 });
assert.equal(analysis.perFile.find((f: any) => f.file === 'test/benchmarks/graph-interop-scale.test.ts').pass, 6);
const events = readFileSync(run + '/new-64-events.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
const ends = events.filter((e: any) => e.event === 'case_end'); assert.equal(ends.length, 64); assert.equal(new Set(ends.map((e: any) => e.case)).size, 64); assert(ends.every((e: any) => e.status === 'pass'));
assert.equal(pre.current370.length, 370); for (const f of pre.current370) check(own + '/' + f.path, f);
assert.equal(pre.readonlyProofs.length, 50); for (const f of pre.readonlyProofs) check(isAbsolute(f.path) ? f.path : own + '/' + f.path, f);
const lb = check(own + '/' + pre.ledger.path, pre.ledger); assert.equal(lb.length, 8943882);
let candidateBytes = 0; for (const f of pre.candidateSnapshots) { const bytes = check(own + '/' + f.path, f); assert(bytes.equals(check(run + '/' + f.snapshot, f))); candidateBytes += bytes.length; }
assert.equal(candidateBytes, 195451);
const source = readFileSync(own + '/tools/ff8-harness/src/simulator.ts'), ast = ts.createSourceFile('simulator.ts', source.toString('utf8'), ts.ScriptTarget.Latest, true);
for (const f of pre.publicDtos) { const n = ast.statements.find(n => (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) && n.name.text === f.name); assert(n); assert.equal(sha(n.getText(ast)), f.sha256); }
assert.equal(pre.publicDtos.length, 33); assert.equal(pre.packets.length, 5); let inputPins = 0;
for (const p of pre.packets) {
  const base = own + '/' + p.path, rb = readFileSync(base + '/.preparation-receipt.json'); assert.equal(sha(rb), p.receiptSha256);
  const r = JSON.parse(rb.toString('utf8')); assert.equal(r.files.length, p.pins); inputPins += r.files.length;
  for (const f of r.files) assert.equal(sha(readFileSync(base + '/' + f.path)), f.sha256);
} assert.equal(inputPins, 407);
const inventory = JSON.parse(readFileSync(own + '/inputs/L7_COPY_FULL_GATE_20261016/CLEANUP_INVENTORY.json', 'utf8'));
assert.equal(inventory.scanned.length, 45); for (const f of inventory.scanned) check(own + '/' + f.path, f);
assert.equal(post.current370.changed.length, 0); assert.equal(post.oldProofs.changed.length, 0); assert.equal(post.changedDtos.length, 0); assert(post.pinsExact && !post.fullGatePassed);
assert(pre.guard.strictAbsent && post.guard.strictAbsent && post.guard.notClearedOrChanged);
assert(post.inheritedLocalAppDataAndAppDataUnchanged && post.postFailureDynamicInvocations === 0);
assert(pre.tempInitiallyEmpty); const temp = pre.environmentOverrides.TEMP; assert.equal(temp, pre.environmentOverrides.TMP);
assert.equal(norm(temp), run + '/temp/opencode');
const nestedStat = statSync(join(temp, 'opencode'));
assert(nestedStat.birthtimeMs > Date.parse(end.started) && nestedStat.birthtimeMs < Date.parse(end.ended));
for (const f of failures.filter((f: any) => f.errorLines.some((l: string) => l.startsWith('ENOENT')))) assert(f.errorLines.join('\n').includes(temp + '\\opencode\\'));
const receipts = stdout.toString('utf8').split('\n').filter(l => l.startsWith('{')).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(r => r?.evidence === 'graph-interop-owned-offline-db');
assert.equal(receipts.length, 10); assert.equal(new Set(receipts.map(r => norm(r.path))).size, 10);
const db = JSON.parse(readFileSync(run + '/retained-db-manifest.json', 'utf8')); assert.equal(db.graph.length, 10); assert.equal(db.l5.length, 1); assert.equal(db.issues.length, 0);
let graphBytes = 0, l5Bytes = 0;
for (const r of receipts) {
  const bytes = check(r.path, r); assert.equal(bytes.subarray(0, 15).toString(), 'SQLite format 3'); assert.equal(r.native, false);
  const f = db.graph.find((f: any) => f.path === r.path); assert(f && f.allReceiptsMatch && f.matchesLastPerCloseReceipt); check(r.path, f.postExit);
  assert(norm(r.path).startsWith('C:/Users/djden/AppData/Local/Temp/opencode/graph-interop-'));
  assert(statSync(r.path).birthtimeMs >= Date.parse(end.started) && statSync(r.path).birthtimeMs <= Date.parse(end.ended));
  for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(r.path + suffix)); graphBytes += bytes.length;
}
assert.equal(graphBytes, 2936832);
const l5 = db.l5[0]; assert(norm(l5.path).startsWith(run + '/temp/opencode/opencode/l5-admission-budget-'));
assert(l5.firstDigestPostExit && !l5.perCloseDigestSupplied); l5Bytes = check(l5.path, l5.postExit).length;
assert.equal(l5Bytes, 385024); for (const suffix of ['-wal', '-shm', '-journal']) assert(!existsSync(l5.path + suffix));
const child = JSON.parse(readFileSync(run + '/child-temp-manifest.json', 'utf8')); assert.equal(child.files.length, 1); assert.equal(child.issues.length, 0); check(child.files[0].path, child.files[0]);
assert.equal(m.fullGatePassed, false); assert.equal(m.collectorSqlCalls, 0);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own, run,
  manifestBytes: ab.length, manifestSha256: sha(ab), artifact26Bytes: proofBytes, external10GraphDbBytes: graphBytes, retainedL5Bytes: l5Bytes,
  total11RetainedDbBytes: graphBytes + l5Bytes, full: m.full, nativeOwnershipPolicies4_2AndParentLeadRechecked: true,
  oneFullNaturalExit1AndExclusiveReleasedBeforeCollectionVerified: true,
  actual1126PrimaryCases1033Pass92Fail1Skip36Files91154AssertionsVerifiedRawFooterExcluded: true,
  primaryFailuresEngine2Eventlog90Setup1SqliteCantopen1MkdirEnoent90MkdtempEnoentBeforeScientificAssertions: true,
  tempInitiallyEmptyAndNestedOpencodeBornDuringRunCorroborateMissingLauncherFixtureParent: true,
  notInstrumentedFirstCreatorAndWindowsLengthEffectNotExperimentallyRuledOut: true,
  noSimulatorSourceRegressionEstablishedNo92IndependentBugsAndFullRemainsFailed: true,
  oldV1_184FailRecords92Body92FooterPreservedByteExactSupplementV2Only93FooterRowsExcluded: true,
  targeted195And64NewUniqueEndsAnd54InteropPlus6ScalePassOnlyPartialEvidence: true,
  current370Ledger8943882Candidate4_195451BytesDto33Old50Proofs407InputsAnd45TsExact: true,
  graph10PerClosePostExitHashesEqualDbBornDuringRunSidecarsAbsentNoSqliteParentConnection: true,
  L5FirstHashPostExitNotInventedPerCloseAndOneRemainingChildFilePreserved: true,
  acceptedMain275Exact: true, noProductExecutionRerunMkdirEnvChangeDbReopenSourceFixByParentVerification: true,
  stage: 'FAILED_FULL_DELIVERY_CONFORMING_SETUP_QUALIFICATION_ACCEPTED_HOLD_AWAIT_EXPLICIT_USER_GO_FOR_SEPARATE_LAUNCHER_ONLY_ATTEMPT',
  consumedFullGateNoNewReviewPromotionIntegrationNativeOrCorrectivePermission: true };
writeFileSync(phase + '/l7-copy-full-red-final-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
