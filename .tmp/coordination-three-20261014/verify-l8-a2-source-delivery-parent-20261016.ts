import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const own = JSON.parse(readFileSync(phase + '/l8-a2-two-source-actual-final-go-20261016.json', 'utf8')).own;
const run = own + '/.tmp/L8_A2_CORRECTIVE_20261016/WRITE-fb1d83b15e3e';
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const norm = (p: string) => p.replaceAll('\\', '/');
const pin = (path: string, f: any) => { const b = readFileSync(path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256, path); return b; };
const mb = readFileSync(run + '/delivery.json'); assert.equal(mb.length, 18466);
assert.equal(sha(mb), '93868f3df49fc5d2c1831fbc4124ee6bdfed75ce47cbd7822ce5f90e436d9560');
const m = JSON.parse(mb.toString('utf8')), p = JSON.parse(readFileSync(run + '/post-static-pins.json', 'utf8'));
const before = JSON.parse(readFileSync(run + '/frame.before.json', 'utf8'));
assert.equal(m.artifactPins.length, 9); let artifactBytes = 0;
for (const f of m.artifactPins) { assert(!f.path.includes('..') && !f.path.includes(':')); artifactBytes += pin(run + '/' + f.path, f).length; }
assert.equal(artifactBytes, 843588);
const allowed = new Set([own + '/tools/ff8-harness/src/client.ts', own + '/tools/ff8-harness/src/graph-engine.ts']);
assert.equal(before.protectedBeforePins.length, 828); assert.equal(p.readonlyPostPins.length, 822);
let excluded = 0;
for (const f of before.protectedBeforePins) {
  if (allowed.has(norm(f.path))) { excluded++; continue; }
  const after = p.readonlyPostPins.find((g: any) => g.group === f.group && g.path === f.path);
  assert(after && after.exact && after.sha256 === f.sha256 && after.bytes === f.bytes);
  assert(!['.db', '-wal', '-shm', '-journal'].some(s => norm(f.path).endsWith(s)));
  pin(f.path, f);
}
assert.equal(excluded, 6); assert.equal(new Set(p.readonlyPostPins.map((f: any) => norm(f.path))).size, 784);
assert.equal(p.sources.length, 2); let sourceBytes = 0;
const lexical: any[] = [];
for (const f of p.sources) {
  assert(allowed.has(norm(f.path)));
  const after = pin(f.path, f), archived = readFileSync(f.afterArchive), old = readFileSync(f.beforeArchive);
  assert(after.equals(archived)); assert.equal(old.length, f.beforeBytes); assert.equal(sha(old), f.beforeSha256); sourceBytes += after.length;
  const ast = (bytes: Buffer) => ts.createSourceFile(f.path, bytes.toString('utf8'), ts.ScriptTarget.Latest, true);
  const imports = (file: ts.SourceFile) => file.statements.filter(ts.isImportDeclaration).map(n => n.getText(file));
  const sql = (file: ts.SourceFile) => { const values: string[] = []; const visit = (n: ts.Node) => {
    if (ts.isStringLiteral(n) && /^(SELECT |UPDATE |INSERT |CREATE |DELETE )/.test(n.text)) values.push(n.text);
    ts.forEachChild(n, visit);
  }; visit(file); return values; };
  const a = ast(old), b = ast(after); assert.equal((b as any).parseDiagnostics.length, 0);
  assert.deepEqual(imports(a), imports(b)); assert.deepEqual(sql(a), sql(b));
  lexical.push({ path: norm(f.path), importsIdentical: true, sqlLiteralsIdentical: true, parserDiagnostics: 0, notSemanticTypecheck: true });
}
assert.equal(sourceBytes, 70990); assert.equal(p.other13Runtime.length, 13);
for (const f of p.other13Runtime) pin(f.path, f);
assert.equal(sha(readFileSync(own + '/tools/ff8-harness/test/graph-integration/body-pause-regressions.test.ts')), '7085767948db576bfecea0fec9c93ab37f32e7b803e656c5d5af639eab00a145');
assert.equal(sha(readFileSync(p.registryNoAppend.path)), '11607270d18e115b56306336f351ddbfe7d6fd5c12d859954d5ebe0302f08b3e');
let runtimeBytes = 0; assert.equal(p.runtime16WrittenCandidatePins.length, 16);
for (const f of p.runtime16WrittenCandidatePins) runtimeBytes += pin(f.path, f).length;
assert.equal(runtimeBytes, 365416);
for (const value of Object.values(m.actualExecution)) assert.equal(value, 0);
assert.equal(m.issues.length, 0); assert.equal(p.issues.length, 0);
const main = JSON.parse(readFileSync(phase + '/l5-budget-main-transfer-before.json', 'utf8'));
for (const f of [...main.preserved, ...main.source]) assert.equal(sha(readFileSync(root + '/' + f.path)), f.sha256);
const out = { at: new Date().toISOString(), own, run, task: m.taskId, sourceWriteDeliverySha256: sha(mb),
  nineArtifacts843588BytesExact: true, protected822Checks784NonDbPathsExactSixCurrentSourceOccurrencesOnlyExcluded: true,
  source2Bytes: sourceBytes, runtime16Bytes: runtimeBytes, runtime16: p.runtime16WrittenCandidatePins,
  other13AndNew47TestAndRegistryNoAppendExact: true, lexical,
  parentAll12ChangedHunksInspectedAgainstRatifiedAE: true,
  privateAdmissionRefusalAppendGuardWithinExistingGraphSourceNoNewApi: true,
  latestLocalPauseChecksNotCrossConnectionOrNetworkAtomicity: true,
  stage: 'SOURCE_DELIVERY_CONFORMING_READY_FOR_SEPARATE_TYPECHECK107_TARGET_GATE not green or acceptance',
  noTestCProbeFullScratchReopenIntegrationOrNativePermissionGrantedByVerification: true, acceptedMain275Exact: true };
writeFileSync(phase + '/l8-a2-source-delivery-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, runtime16: out.runtime16.length }));
