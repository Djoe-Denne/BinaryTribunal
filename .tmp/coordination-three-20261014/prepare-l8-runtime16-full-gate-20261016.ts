import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L8_RUNTIME16_FULL_GATE_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const verified = JSON.parse(readFileSync(phase + '/l8-a2-c-copy-final-parent-verification-20261016.json', 'utf8'));
assert(verified.stage.startsWith('C_GATE_CONFORMING'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex'), norm = (p: string) => p.replaceAll('\\', '/');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: 'ses_ec12fcc43ffeI6xXQ5rSTty2mV' });
assert.deepEqual(session.model, { id: 'gpt-6.1-sol', providerID: 'openai', variant: 'max' });
const own = norm(session.location.directory); assert(verified.run.startsWith(own + '/.tmp/'));
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const task = team.tasks.find((t: any) => t.id === verified.task);
assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l8-integration-r1');
const authorization = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(authorization.ready && !authorization.pausedTeams.includes(team.id) && !authorization.admissionPausedTeams.includes(team.id));
const cDeliveryBytes = readFileSync(verified.run + '/delivery.json'); assert.equal(sha(cDeliveryBytes), verified.deliverySha256);
const cDelivery = JSON.parse(cDeliveryBytes.toString('utf8')), cQual = JSON.parse(readFileSync(verified.run + '/qualification.json', 'utf8'));
for (const f of cQual.postPins) assert.equal(sha(readFileSync(f.path)), f.sha256);
assert.equal(process.env.FF8_ENSEMBLE_SOURCE, undefined, 'Present environment guard: do not clear it to force skip');
const oldInventory = JSON.parse(readFileSync(phase + '/l8-full-existing-cleanup-inventory.json', 'utf8'));
const harness = own + '/tools/ff8-harness', scanned: any[] = [], rows: any[] = [];
const walk = (directory: string) => {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    assert(!item.isSymbolicLink()); const path = directory + '/' + item.name;
    if (item.isDirectory()) walk(path);
    else if (item.name.endsWith('.ts')) {
      const bytes = readFileSync(path), file = ts.createSourceFile(path, bytes.toString('utf8'), ts.ScriptTarget.Latest, true), calls: any[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
          const name = ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : ts.isIdentifier(node.expression) ? node.expression.text : '';
          if (['rmSync', 'unlinkSync', 'rmdirSync', 'rm', 'unlink', 'rmdir'].includes(name)) calls.push({ line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, expression: node.expression.getText(file) });
        }
        ts.forEachChild(node, visit);
      }; visit(file);
      const relative = path.slice(harness.length + 1), pin = { path: 'tools/ff8-harness/' + relative, bytes: bytes.length, sha256: sha(bytes) };
      scanned.push(pin);
      if (calls.length) rows.push({ ...pin, calls, permission: relative.startsWith('test/') ? 'legacy-own-fresh-fixtures-only-active' : 'INACTIVE-guard-required-skip-NO-cleanup-permission' });
    }
  }
}; walk(harness + '/test'); walk(harness + '/scripts');
assert.equal(scanned.length, 34); assert.equal(scanned.filter(f => f.path.endsWith('.test.ts')).length, 29);
assert.equal(rows.length, 13); assert.equal(rows.flatMap(r => r.calls).length, 23);
for (const old of oldInventory.rows) {
  const current = rows.find(r => r.path === 'tools/ff8-harness/test/' + old.path); assert(current);
  assert.equal(current.sha256, old.sha256); assert.deepEqual(current.calls.map((c: any) => c.line), old.calls.map((c: any) => c.line));
}
const inactive = rows.filter(r => r.permission.startsWith('INACTIVE')); assert.equal(inactive.length, 1);
assert.equal(inactive[0].path, 'tools/ff8-harness/scripts/role-sharing-offline.test.ts');
assert.equal(inactive[0].calls.length, 1); assert.equal(inactive[0].calls[0].line, 146);
const roleSource = readFileSync(own + '/' + inactive[0].path, 'utf8');
assert(roleSource.includes('const plugin = process.env.FF8_ENSEMBLE_SOURCE;') && roleSource.includes('const crossProject = plugin ? test : test.skip;'));
const inventory = { filesScanned: 34, bunTestFiles: 29, potentialFiles13Calls23: true, activeLegacy12Files22CallsExactPriorHashes: true,
  inactiveScriptCleanupGuardAbsentRequiredNotPermitted: true, oldInventoryLimitedTestDirectoryNotAllBunPaths: true, scanned, rows };
const oldFull = own + '/.tmp/L8_PHASE_A_V2/full-dea00bfc36cd';
const oldFullBytes = readFileSync(oldFull + '/delivery.json');
assert.equal(sha(oldFullBytes), JSON.parse(readFileSync(phase + '/l8-full-final-parent-verification-20261016.json', 'utf8')).deliverySha256);
const oldFullDelivery = JSON.parse(oldFullBytes.toString('utf8')), oldIndexBytes = readFileSync(oldFull + '/database-index.json');
assert.equal(sha(oldIndexBytes), oldFullDelivery.artifactPins.find((f: any) => f.path === 'database-index.json').sha256);
const redRoot = own + '/.tmp/L8_A2_CORRECTIVE_20261016/RED-e4394246c19a';
const redDeliveryBytes = readFileSync(redRoot + '/delivery.json');
assert.equal(sha(redDeliveryBytes), JSON.parse(readFileSync(phase + '/l8-a2-red-final-parent-verification-20261016.json', 'utf8')).deliverySha256);
const amendedRoot = own + '/.tmp/L8_A2_CORRECTIVE_20261016/AMEND321-ce152311dd73';
const amendedQualBytes = readFileSync(amendedRoot + '/qualification.json'); assert.equal(sha(amendedQualBytes), '962c16df78f5ab1f330fc69a5717e1a48a8c865f42fd59746d731d2120f3ce12');
const origins = [
  { path: oldFull + '/database-index.json', sha256: sha(oldIndexBytes), rows: JSON.parse(oldIndexBytes.toString('utf8')).files },
  { path: redRoot + '/delivery.json', sha256: sha(redDeliveryBytes), rows: JSON.parse(redDeliveryBytes.toString('utf8')).retainedDatabaseIndex },
  { path: amendedRoot + '/qualification.json', sha256: sha(amendedQualBytes), rows: JSON.parse(amendedQualBytes.toString('utf8')).retainedDatabases },
  { path: verified.run + '/qualification.json', sha256: verified.qualificationSha256, rows: cQual.copyMappings.map((m: any) => m.scratchAfter) },
]; assert.deepEqual(origins.map(o => o.rows.length), [298, 47, 96, 2]);
const dbs = new Map<string, any>();
for (const origin of origins) for (const [index, f] of origin.rows.entries()) {
  const path = norm(f.path); assert(!path.split('/').includes('..'));
  assert(path.startsWith(own + '/.tmp/') || path.startsWith('C:/Users/djden/AppData/Local/Temp/opencode/'));
  const prior = dbs.get(path); if (prior) assert(prior.bytes === f.bytes && prior.sha256 === f.sha256);
  else dbs.set(path, { ...f, path, origin: { manifest: origin.path, manifestSha256: origin.sha256, row: index }, priorHashChronologyNotRewritten: true });
}
assert.equal(dbs.size, 443); let dbBytes = 0;
for (const f of dbs.values()) {
  assert(lstatSync(f.path).isFile() && !lstatSync(f.path).isSymbolicLink());
  const bytes = readFileSync(f.path); assert.equal(bytes.length, f.bytes); assert.equal(sha(bytes), f.sha256); assert.equal(bytes.subarray(0, 15).toString(), 'SQLite format 3');
  for (const sidecar of ['-wal', '-shm', '-journal']) assert(!existsSync(f.path + sidecar)); dbBytes += bytes.length;
}
assert.equal(dbBytes, 131350528);
const registryPath = own + '/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl', registry = readFileSync(registryPath);
assert.equal(registry.length, 232965); assert.equal(sha(registry), '5c2bb8eca39cb81967ee3ca26af3d6e552212f9dd7d20ea0ce2f7af3bfc5e7e0');
const baseline = { task: task.id, session: session.id, model: session.model, own, runtime16: cQual.sourceRuntime16,
  readonly957: cQual.postPins, immutableC16: cDelivery.artifactPins.map((f: any) => ({ ...f, path: verified.run + '/' + f.path })),
  cDelivery: { path: verified.run + '/delivery.json', bytes: cDeliveryBytes.length, sha256: sha(cDeliveryBytes) },
  registry: { path: registryPath, bytes: registry.length, sha256: sha(registry), futureHelperAppendPrefixOnlyAfterFinalFullGo: true },
  allTsScanned34: scanned, parentContextGuardAbsentNotAltered: true, callerMustIndependentlyRecheckGuardBeforeFull: true,
  priorOriginalFull930Pass1SkipNotReusedAsNewResult: true, COnlyTwoCachedRowsNotUniversalProof: true,
  stage: 'ACCESS_ONLY completeReadMetadataAck then fresh exclusiveReservation and distinct FINAL_FULL_GO; no full permission yet' };
const preexisting = { count: dbs.size, bytes: dbBytes, files: [...dbs.values()], parentRawPrepinVerifiedNoSqliteConnection: true,
  noExtensionFilterNoOldTempEnumeration: true, provenanceManifestPins: origins.map(({ rows: _rows, ...o }) => o),
  historicalLateFirstHashesRemainQualifiedNoEarlierSealClaim: true, workerPhysicalReadsOnlyAfterFinalGo: true };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L8_RUNTIME16_FULL_GATE_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(baseline, null, 2) + '\n'), kind: 'manifest' },
  { path: 'PREEXISTING_DBS.json', bytes: Buffer.from(JSON.stringify(preexisting, null, 2) + '\n'), kind: 'manifest' },
  { path: 'CLEANUP_INVENTORY.json', bytes: Buffer.from(JSON.stringify(inventory, null, 2) + '\n'), kind: 'rule' },
  { path: 'LEGACY_EPHEMERAL_RULE.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L8_FULL_EPHEMERAL_FIXTURE_AMENDMENT_20261015.md'), kind: 'rule' },
  { path: 'PARENT_C_CHECK.json', bytes: readFileSync(phase + '/l8-a2-c-copy-final-parent-verification-20261016.json'), kind: 'manifest' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
writeFileSync(phase + '/l8-runtime16-full-cleanup-and-preexisting-parent-20261016.json', JSON.stringify({ at: new Date().toISOString(), ...inventory,
  knownPreexistingDbCount: dbs.size, knownPreexistingDbBytes: dbBytes, allKnownDbHashesNoSidecarsRawOnlyVerified: true,
  noTestSqliteConnectionOldTempEnumerationOrFixtureCleanupByPreparation: true }, null, 2) + '\n', { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: task.id, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: own + '/inputs/L8_RUNTIME16_FULL_GATE_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l8-runtime16-full-gate-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model, own,
  destination: request.destinationRoot, files: files.length, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes), runtime16AndCFinalAndRegistryExact: true,
  parentKnown443Db131350528BytesRawPrepinNoSqliteOpen: true, completeInventory34Ts29Test13Potential23Calls12Active22UnchangedOneInactiveGuardSkip: true,
  stage: 'ACCESS_ONLY fullRead6HashConditionsAck then freshReservationDistinctFinalFullGo pending no full temp fixtures created' };
writeFileSync(phase + '/l8-runtime16-full-gate-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
