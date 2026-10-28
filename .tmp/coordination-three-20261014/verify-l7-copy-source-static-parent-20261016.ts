import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy-source-actual-final-go-20261016.json', 'utf8'));
const own = go.own, run = own + '/.tmp/L7_COPY_BOUNDARY_20261016/WRITE-2026-10-16T152136110Z-copy-r1';
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const ab = readFileSync(run + '/ARTIFACTS.json'); assert.equal(ab.length, 1651);
assert.equal(sha(ab), 'e6221f5ef4d6a95b09b191e90a4abdca9e6d4e60d803c4a75bac149470634e36');
const artifacts = JSON.parse(ab.toString('utf8')); assert.equal(artifacts.files.length, 8); let artifactBytes = 0;
for (const f of artifacts.files) {
  assert(!f.path.includes(':') && !f.path.split('/').includes('..'));
  const b = readFileSync(run + '/' + f.path); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); artifactBytes += b.length;
}
assert.equal(artifactBytes, 291596);
const old = readFileSync(run + '/simulator.before.ts'), current = readFileSync(own + '/' + go.allowedSource);
assert.equal(sha(old), '6d00cf296cf22378604ea9fc07e155ccf4cb6806186c5d2e63e55fbdbc89716f');
assert.equal(current.length, 122803); assert.equal(sha(current), '851e6ab20bc14a2ebad6fcf1a8a82b0d59f668aa44e3849878d1ef82c81773ca');
assert(current.equals(readFileSync(run + '/simulator.after.ts')));
const a = ts.createSourceFile('old.ts', old.toString('utf8'), ts.ScriptTarget.Latest, true);
const b = ts.createSourceFile('new.ts', current.toString('utf8'), ts.ScriptTarget.Latest, true);
assert.equal((a as any).parseDiagnostics.length, 0); assert.equal((b as any).parseDiagnostics.length, 0);
const dto = (f: ts.SourceFile) => new Map(f.statements.filter(n => (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) && n.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).map(n => [(n as ts.InterfaceDeclaration).name.text, n.getText(f)]));
const oldDto = dto(a), newDto = dto(b); assert.equal(oldDto.size, 33); assert.deepEqual(newDto, oldDto);
const exported = (f: ts.SourceFile) => f.statements.filter(n => (n as ts.HasModifiers).modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).flatMap(n => {
  if (ts.isVariableStatement(n)) return n.declarationList.declarations.map(d => d.name.getText(f));
  return (n as ts.FunctionDeclaration).name ? [(n as ts.FunctionDeclaration).name!.getText(f)] : [];
}).sort(); assert.deepEqual(exported(a), exported(b));
const imports = (f: ts.SourceFile) => f.statements.filter(ts.isImportDeclaration).map(n => n.getText(f)); assert.deepEqual(imports(a), imports(b));
const getClass = (f: ts.SourceFile, name: string) => f.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === name) as ts.ClassDeclaration;
const getFunction = (f: ts.SourceFile, name: string) => f.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name) as ts.FunctionDeclaration;
assert.equal(getFunction(a, 'validateSimPlan').body!.getText(a), getFunction(b, 'validatePlanImage').body!.getText(b));
assert.equal(getFunction(a, 'simPlanFromExport').body!.getText(a), getFunction(b, 'projectExportImage').body!.getText(b));
assert.equal(getClass(a, 'SimStore').getText(a), getClass(b, 'SimStore').getText(b));
const members = (f: ts.SourceFile) => new Map(getClass(f, 'SimEngine').members.map(n => [ts.isConstructorDeclaration(n) ? 'constructor' : n.name!.getText(f), n.getText(f)]));
const oldMembers = members(a), newMembers = members(b); assert.equal(oldMembers.size, 85); assert.equal(newMembers.size, 85);
const changed = [...oldMembers].filter(([name, text]) => newMembers.get(name) !== text).map(([name]) => name).sort();
assert.deepEqual(changed, ['constructor', 'finalize']);
const fixedFunctions = ['validateExportArchive', 'receiptMatches', 'shape', 'topology', 'localPath', 'intents'];
const callableText = (f: ts.SourceFile, name: string) => {
  const declaration = getFunction(f, name);
  if (declaration) return declaration.getText(f);
  for (const statement of f.statements) if (ts.isVariableStatement(statement)) {
    const value = statement.declarationList.declarations.find(d => d.name.getText(f) === name);
    if (value) return value.getText(f);
  }
  const method = getClass(f, 'SimEngine').members.find(n => n.name?.getText(f) === name);
  if (method) return method.getText(f);
  assert.fail('Missing function/arrow/engine method declaration ' + name);
};
for (const name of fixedFunctions) assert.equal(callableText(a, name), callableText(b, name));
assert(callableText(a, 'freeze').includes('freeze(item)'));
assert(callableText(b, 'freeze').includes('while (pending.length)') && callableText(b, 'freeze').includes('Object.freeze(item)'));
const baseline = JSON.parse(readFileSync(own + '/inputs/L7_COPY_SOURCE_WRITE_20261016/BASELINE.json', 'utf8'));
assert.equal(baseline.baseline369.length, 369); let readonly = 0;
for (const f of baseline.baseline369) if (f.path !== go.allowedSource) { assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256); readonly++; }
assert.equal(readonly, 368);
const test = readFileSync(own + '/' + baseline.newTest.path); assert.equal(sha(test), baseline.newTest.sha256);
assert(test.equals(readFileSync(own + '/inputs/L7_COPY_SOURCE_WRITE_20261016/BASELINE_TEST.ts')));
for (const f of baseline.red10) assert.equal(sha(readFileSync(f.path)), f.sha256);
assert.equal(sha(readFileSync(baseline.redArtifacts.path)), baseline.redArtifacts.sha256);
const beforePins = JSON.parse(readFileSync(run + '/before-pins.json', 'utf8'));
for (const f of beforePins.oldProofs) assert.equal(sha(readFileSync(own + '/' + f.path)), f.sha256);
for (const name of ['l7-copy-boundary-preparation-request-20261016.json', 'l7-copy-plan-approval-request-20261016.json', 'l7-copy-source-write-request-20261016.json']) {
  const q = JSON.parse(readFileSync(phase + '/' + name, 'utf8'));
  for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
  const expected = beforePins.packets.find((p: any) => p.path === q.destinationRoot.slice(own.length + 1)); assert(expected);
  assert.equal(sha(readFileSync(q.destinationRoot + '/.preparation-receipt.json')), expected.receiptSha256);
}
const diff = readFileSync(run + '/simulator.diff', 'utf8'); assert.equal(diff.split('\n').filter(x => x.startsWith('@@')).length, 9);
const afterPins = JSON.parse(readFileSync(run + '/after-pins.json', 'utf8'));
assert.deepEqual(afterPins.baseline369Changes, [go.allowedSource]); assert.equal(afterPins.applicationInvocationCount, 0);
const out = { at: new Date().toISOString(), task: go.task, own, run, manifestSha256: sha(ab), artifact8Bytes: artifactBytes,
  sourcePath: go.allowedSource, sourceBytes: current.length, sourceSha256: sha(current), beforeSourceSha256: sha(old),
  allNineChangedHunksReadAgainstPlanCd21RatificationEe53AndSourceOnlyScope: true,
  parser0NotTypecheckPublicDto33AndExportedNamesImportsExact: true,
  originalValidatorAndProjectionBodiesExactSimStoreExact83Of85EngineMembersExactOnlyConstructorFinalizeChanged: true,
  shapeTopologyLocalPathIntentsReceiptMatchesBodiesExactNoNewObserveScanOrEventLoopRewrite: true,
  privateFreezeRecursiveToIterativeChangeReadMatchesRatifiedStackSafeImageDesign: true,
  parentStaticCheckerTopLevelMethodAndFreezeUnchangedAssumptionsCorrectedNoProductInvocationOrSourceEdit: true,
  readonly368PlusNew64TestAndOld131SevenFilesReadmeHelpersOldProofsRed10And392Plus3Plus4PacketsExact: true,
  copyBeforeConsumedImageValidationDescriptorDomainQualifiedNoPrototypeBlacklistScopeExpansion: true,
  aliasesCyclesBoundedVisitsRawErrorsWrappedCallbackValuesAcquiredAfterDetachedPlanConfigIncidents: true,
  stage: 'STATIC_SOURCE_DELIVERY_CONFORMING_NOT_EXECUTED wait L8FullExclusiveRelease before separate TC195_GATE',
  noProductModuleExecutionTypecheckTestProbeSqliteFullOrIntegrationByThisCheck: true,
  residualRequiresRealTypecheckOld131New64AndFreshIndependentReviewNotGreen: true };
writeFileSync(phase + '/l7-copy-source-static-parent-verification-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
