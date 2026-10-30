// Parent-owned QA only. Creates retained LOCAL test SQLite, never native authority.
// No retry, renewal, adoption, deletion or transport. One explicit --execute-qa action.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const wt = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const prep = join(repo, mission, 'native-preparation-136');
const qa = join(prep, 'local-stage-qa-139');
const candidates = join(wt, mission, 'preparation-candidates');
const sha = b => createHash('sha256').update(b).digest('hex');
const need = (v, why) => { if (!v) throw new Error(why); };
const pinned = (path, expected, byteLength) => {
  const b = readFileSync(path);
  need(sha(b) === expected && (byteLength === undefined || b.length === byteLength), `Pin mismatch: ${path}`);
  return new TextDecoder('utf-8', { fatal: true }).decode(b);
};
const clone = v => JSON.parse(JSON.stringify(v));
const started = Date.now();
const cases = [];
let stageResult;
try {
  need(process.argv.length === 3 && ['--describe-qa', '--execute-qa'].includes(process.argv[2]), 'Explicit preparation or QA action required');
  need(!existsSync(qa), 'QA namespace exists: no rerun or adoption');
  const stagePath = join(candidates, 'stage-local-reservation.mjs');
  pinned(stagePath, '5bbea4d5bd9e88f36bbdbabebcbc8973577fe3d7d8a3c0c1a68f0022d4a09a72', 25729);
  need(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim()
    === '782ec396a2a7866d30645c32ca8ab864dcca5960', 'Product HEAD changed');
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'tools/ff8-harness/src', 'tools/ff8-harness/schemas'],
    { cwd: wt, stdio: ['ignore', 'pipe', 'pipe'] });
  const manifestPath = join(prep, 'source-bundle-v3/manifest.json');
  const manifestHash = '34ffa53959bf44e6023071d4f27fb939732c719bf2bad681a1bea1e877410d68';
  const manifest = JSON.parse(pinned(manifestPath, manifestHash, 2806));
  const q = {};
  for (const key of ['body', 'independentSources', 'policy']) {
    const f = manifest.files.find(f => f.path.replaceAll('\\', '/').endsWith(`/${key}.json`));
    need(f, `Manifest lacks ${key}`);
    q[key] = JSON.parse(pinned(f.path, f.sha256, f.byteLength));
  }
  const codecUrl = pathToFileURL(join(wt, 'tools/ff8-harness/src/graph-execution-envelope.ts')).href;
  const { makeBoundDocumentV1, bindExecutionPreparationV1, sealExecutionEnvelopeV1, makeGraphRunV3 } = await import(codecUrl);
  const bound = bindExecutionPreparationV1(q.body, q.independentSources, q.policy);
  need(bound.ok, `Preparation refused: ${JSON.stringify(bound.reasons)}`);
  // Original planning bytes are retained and binding already checks their inputs.
  const planning = q.body.rootBootstrapSources.planning;
  const plan = JSON.parse(planning.utf8);
  const sealed = sealExecutionEnvelopeV1({ ...clone(q.body), planning });
  need(sealed.ok, `Sealing refused: ${JSON.stringify(sealed.reasons)}`);
  const run = makeGraphRunV3(sealed.value);
  need(run.ok && plan.plan.selectedUnitIds.length === 1, 'Run or singleton selection refused');
  const expected = { missionId: q.body.missionId, unitId: plan.plan.selectedUnitIds[0],
    sourceRequestRef: makeBoundDocumentV1('rms-native-source-request-v1', q).ref,
    runRef: run.value.document.ref, planningRef: planning.ref };
  const request = { version: 'rms-stage-local-reservation-request-v1',
    sourceManifestPin: { path: manifestPath, byteLength: 2806, sha256: manifestHash }, expected,
    ownNamespace: join(qa, 'positive'), ownFileName: 'qa-own.sqlite',
    controllerId: 'rms-parent-local-qa-139-not-native-authority', leaseMs: 300000 };
  if (process.argv[2] === '--describe-qa') {
    console.log(JSON.stringify({ status: 'QA_REQUEST_DERIVED_NO_STAGE_IMPORT', request,
      durationMs: Date.now() - started, filesWritten: 0, databaseOpened: false, nativeActions: 0 }));
    process.exit(0);
  }
  const { stageLocalReservationV1 } = await import(pathToFileURL(stagePath).href);
  mkdirSync(qa); // All namespaces below this fresh owned QA directory are retained.
  const test = (name, fn) => {
    const start = performance.now();
    try { fn(); cases.push({ name, pass: true, durationMs: performance.now() - start }); }
    catch (e) { cases.push({ name, pass: false, durationMs: performance.now() - start, error: String(e?.message || e) }); throw e; }
  };
  const refusedBeforeCreate = (r, why) => {
    const result = stageLocalReservationV1(r);
    need(result.status === 'HOLD' && result.namespaceCreated === false && !existsSync(r.ownNamespace)
      && result.failure?.message.includes(why), `Wrong refusal: ${JSON.stringify(result)}`);
  };
  test('Contradictory source manifest SHA refused before mkdir', () => {
    const r = clone(request); r.ownNamespace = join(qa, 'bad-pin'); r.sourceManifestPin.sha256 = '0'.repeat(64);
    refusedBeforeCreate(r, '');
  });
  test('Contradictory run reference refused before mkdir', () => {
    const r = clone(request); r.ownNamespace = join(qa, 'bad-run'); r.expected.runRef.sha256 = '0'.repeat(64);
    refusedBeforeCreate(r, 'requested run differs');
  });
  test('Contradictory planning reference refused before mkdir', () => {
    const r = clone(request); r.ownNamespace = join(qa, 'bad-planning'); r.expected.planningRef.sha256 = '0'.repeat(64);
    refusedBeforeCreate(r, 'requested planning differs');
  });
  test('Existing partial namespace refused without adoption or DB creation', () => {
    const r = clone(request); r.ownNamespace = join(qa, 'partial'); mkdirSync(r.ownNamespace);
    const result = stageLocalReservationV1(r);
    need(result.status === 'HOLD' && result.namespaceCreated === false
      && result.failure?.message.includes('OWN namespace already exists')
      && !existsSync(join(r.ownNamespace, r.ownFileName)), 'Existing partial namespace not refused');
  });
  test('Fresh QA DB RESERVED with closed-writer readback and no native effect', () => {
    stageResult = stageLocalReservationV1(request);
    need(stageResult.status === 'LOCAL_RESERVED_NATIVE_HOLD', `Stage refused: ${JSON.stringify(stageResult)}`);
    need(stageResult.namespaceCreated && stageResult.durable.selectedUnit.state === 'RESERVED'
      && stageResult.durable.controller.owner === request.controllerId
      && stageResult.durable.controller.expiresAt > Date.now()
      && stageResult.durable.family.state === 'active', 'Durable QA ownership mismatch');
    need(stageResult.nativeGrants === 'UNKNOWN_HOLD' && stageResult.nativeOrigins === 'UNKNOWN_HOLD', 'Fixture promoted to native authority');
  });
  test('Second invocation refused without another durable effect', () => {
    const before = sha(readFileSync(stageResult.ownPath));
    const again = stageLocalReservationV1(request);
    need(again.status === 'HOLD' && again.namespaceCreated === false
      && again.failure?.message.includes('OWN namespace already exists')
      && sha(readFileSync(stageResult.ownPath)) === before, 'Repeated call altered QA DB');
  });
  const receipt = { version: 'rms-local-stage-parent-qa-v1', status: 'QA_LOCAL_ONLY_NOT_NATIVE_OWNERSHIP',
    request, cases, durationMs: Date.now() - started, stageResult,
    nativeActions: 0, adoptAsOperationalOwner: false, automaticRetry: false };
  writeFileSync(join(qa, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: receipt.status, passed: cases.length, failed: 0,
    durationMs: receipt.durationMs, cases, receiptPath: join(qa, 'receipt.json'),
    durableState: stageResult.durable.selectedUnit.state, nativeActions: 0 }));
} catch (e) {
  const failure = { status: 'LOCAL_QA_REFUSED_PRESERVE_STATE', durationMs: Date.now() - started,
    error: String(e?.message || e).slice(0, 6000), cases, stageResult, nativeActions: 0 };
  if (existsSync(qa) && !existsSync(join(qa, 'failure.json')))
    writeFileSync(join(qa, 'failure.json'), JSON.stringify(failure, null, 2) + '\n', { flag: 'wx' });
  console.error(JSON.stringify(failure)); process.exitCode = 1;
}
