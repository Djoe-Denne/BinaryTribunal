import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L7_COPY_FULL_GATE_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const v = JSON.parse(readFileSync(phase + '/l7-copy-tc195-final-parent-verification-20261016.json', 'utf8'));
assert(v.stage.startsWith('TC195_DELIVERY_CONFORMING'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: 'ses_ebaf6d8c9ffeEq9w6t6V1gxFrE' });
assert.deepEqual(session.model, { id: 'gpt-6-astra', providerID: 'openai', variant: 'max' });
assert.equal(session.location.directory.replaceAll('\\', '/'), v.own);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.name === 're-graph-scheduler');
assert.equal(team.tasks.find((t: any) => t.id === v.task).status, 'in_progress');
assert.equal(team.tasks.find((t: any) => t.id === v.task).assignee, 'l7-copy-astra');
assert.equal(team.tasks.find((t: any) => t.id === 'task_mvb5kbvg_002f_5q34sa').status, 'completed');
assert.equal(team.members.find((m: any) => m.name === 'l8-runtime16-review').status, 'shutdown');
const authorization = (await cli.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
assert(authorization.ready && !authorization.pausedTeams.includes(team.id) && !authorization.admissionPausedTeams.includes(team.id));
const gate = JSON.parse(readFileSync(v.own + '/inputs/L7_COPY_TC195_GATE_20261016/BASELINE.json', 'utf8'));
for (const f of gate.current370) assert.equal(sha(readFileSync(v.own + '/' + f.path)), f.sha256);
const priorRequest = JSON.parse(readFileSync(phase + '/l7-namespace-full-gate-request-20261016.json', 'utf8'));
const old = JSON.parse(readFileSync(priorRequest.sourceRoot + '/BASELINE.json', 'utf8'));
assert.equal(old.harnessReadonly.length, 250); assert.equal(old.rootDataPins.length, 116);
for (const f of [...old.harnessReadonly, ...old.rootDataPins]) assert.equal(sha(readFileSync(v.own + '/' + f.path)), f.sha256);
const ledger = { ...old.ledger }; const lb = readFileSync(v.own + '/' + ledger.path); assert.equal(lb.length, 8943882); assert.equal(sha(lb), ledger.sha256);
const pre = JSON.parse(readFileSync(v.run + '/preflight.json', 'utf8'));
for (const f of pre.readonlyProofs) assert.equal(sha(readFileSync(f.path.includes(':') ? f.path : v.own + '/' + f.path)), f.sha256);
const tcArtifacts = readFileSync(v.run + '/ARTIFACTS.json'); assert.equal(sha(tcArtifacts), v.artifactsSha256);
const tc21 = JSON.parse(tcArtifacts.toString('utf8')).files.map((f: any) => ({ ...f, path: v.run + '/' + f.path }));
for (const f of tc21) assert.equal(sha(readFileSync(f.path)), f.sha256);
const priorCleanup = JSON.parse(readFileSync(phase + '/l8-full-existing-cleanup-inventory.json', 'utf8'));
const harness = v.own + '/tools/ff8-harness', scanned: any[] = [], cleanup: any[] = [];
const walk = (path: string) => {
  for (const item of readdirSync(path, { withFileTypes: true })) {
    assert(!item.isSymbolicLink()); const file = path + '/' + item.name;
    if (item.isDirectory()) walk(file);
    else if (item.name.endsWith('.ts')) {
      const bytes = readFileSync(file), ast = ts.createSourceFile(file, bytes.toString('utf8'), ts.ScriptTarget.Latest, true), calls: any[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
          const name = ts.isIdentifier(node.expression) ? node.expression.text : ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : '';
          if (['rmSync', 'unlinkSync', 'rmdirSync', 'rm', 'unlink', 'rmdir'].includes(name)) calls.push({ line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, expression: node.expression.getText(ast) });
        } ts.forEachChild(node, visit);
      }; visit(ast);
      const pin = { path: 'tools/ff8-harness/' + file.slice(harness.length + 1), bytes: bytes.length, sha256: sha(bytes) }; scanned.push(pin);
      if (calls.length) cleanup.push({ ...pin, calls, permission: file.includes('/scripts/') ? 'INACTIVE guarded role-sharing cleanup NOT authorized' : 'legacy ACTIVE own fresh fixture hooks only' });
    }
  }
}; walk(harness + '/test'); walk(harness + '/scripts');
assert.equal(scanned.filter(f => f.path.endsWith('.test.ts')).length, 36); assert.equal(cleanup.length, 13); assert.equal(cleanup.flatMap(f => f.calls).length, 23);
for (const row of priorCleanup.rows) {
  const current = cleanup.find(f => f.path === 'tools/ff8-harness/test/' + row.path); assert(current);
  assert.equal(current.sha256, row.sha256); assert.deepEqual(current.calls.map((c: any) => c.line), row.calls.map((c: any) => c.line));
}
assert.equal(process.env.FF8_ENSEMBLE_SOURCE, undefined, 'Do not clear a present guard');
const inventory = { scanned, cleanup, tsFiles: scanned.length, testFiles: 36, activeFiles: 12, activeCalls: 22, inactiveFiles: 1, inactiveCalls: 1,
  oldTestOnlyInventoryNotUniversalNoHistoricalUnknownCleanupExecutionClaim: true };
const candidatePaths = [...old.greenFiles.map((f: any) => f.path), 'tools/ff8-harness/test/simulator/simulator-copy-boundary-regressions.test.ts'];
const candidates = candidatePaths.map(p => { const b = readFileSync(v.own + '/' + p); return { path: p, bytes: b.length, sha256: sha(b) }; });
assert.equal(candidates.length, 4); assert.equal(candidates.reduce((n, f) => n + f.bytes, 0), 195451);
const state = { task: v.task, session: session.id, model: session.model, own: v.own,
  current370: gate.current370, greenCandidates4: candidates, harnessReadonly250: old.harnessReadonly, rootData116: old.rootDataPins,
  ledger: { ...ledger, bytes: lb.length, alreadyExistsOwnedNotTransferredOrOverwritten: true },
  tc195Proof21: tc21, tc195Manifest: { path: v.run + '/ARTIFACTS.json', bytes: tcArtifacts.length, sha256: sha(tcArtifacts) },
  old27Proofs: pre.readonlyProofs, packets: pre.packets, publicDto33: pre.publicDtos,
  raw98AndRegistriesOnlyFrozenPartialFixturesNoNativeExtraction: true,
  priorForeignDbPathsNotAccessPermissionNoOldDbTransferredToThisFreshAuthor: true,
  stage: 'ACCESS_ONLY completeReadHashRoleAck then freshExclusiveReservationDistinctFinalFullGo pending' };
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_FULL_GATE_20261016.md'), kind: 'rule' },
  { path: 'BASELINE.json', bytes: Buffer.from(JSON.stringify(state, null, 2) + '\n'), kind: 'manifest' },
  { path: 'CLEANUP_INVENTORY.json', bytes: Buffer.from(JSON.stringify(inventory, null, 2) + '\n'), kind: 'rule' },
  { path: 'LEGACY_EPHEMERAL_RULE.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L8_FULL_EPHEMERAL_FIXTURE_AMENDMENT_20261015.md'), kind: 'rule' },
  { path: 'PARENT_TC195.json', bytes: readFileSync(phase + '/l7-copy-tc195-final-parent-verification-20261016.json'), kind: 'manifest' },
]; mkdirSync(sourceRoot);
for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const request = { schemaVersion: 1, missionId: team.id, taskId: v.task, cycle: 1, role: 'implementer', blind: false,
  sourceRoot, targetSessionId: session.id, destinationRoot: v.own + '/inputs/L7_COPY_FULL_GATE_20261016',
  files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l7-copy-full-gate-request-20261016.json', JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
const out = { at: new Date().toISOString(), task: v.task, session: session.id, model: session.model, own: v.own,
  destination: request.destinationRoot, files: files.length, bytes: files.reduce((n, f) => n + f.bytes.length, 0),
  decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes), ledger8943882AlreadyOwnExactNotTransferred: true,
  current370_250Readonly116RootData4CandidatesAndTc195ProofsExact: true,
  cleanupTsFiles: scanned.length, cleanupTestFiles: 36, only12Active22CallsOneInactiveGuarded13thReviewed: true,
  stage: 'ACCESS_ONLY fullRead5HashRoleConditionsAck then freshExclusiveReservationDistinctFINAL_FULL_GO pending no full or fixtures yet' };
writeFileSync(phase + '/l7-copy-full-gate-native-inputs-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
