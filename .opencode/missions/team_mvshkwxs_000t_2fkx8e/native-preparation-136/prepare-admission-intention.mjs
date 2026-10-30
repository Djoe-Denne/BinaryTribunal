// Parent-only prospective DATA preparation. No DB, transport, grant or session.
// Does not create a native image: no rmsBinding/fences and no native permission.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const wt = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const dir = join(repo, mission, 'native-preparation-136');
const target = join(dir, 'admission-a-static-intention.json');
const sha = b => createHash('sha256').update(b).digest('hex');
const need = (v, why) => { if (!v) throw new Error(why); };
const pinned = (path, expected) => {
  const b = readFileSync(path); need(sha(b) === expected, `Input pin differs: ${path}`);
  return new TextDecoder('utf-8', { fatal: true }).decode(b);
};
const started = Date.now();
try {
  need(process.argv.length === 2 && !existsSync(target), 'Refuse arguments, overwrite or automatic rerun');
  need(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim()
    === '782ec396a2a7866d30645c32ca8ab864dcca5960', 'Product HEAD differs');
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'tools/ff8-harness/src', 'tools/ff8-harness/schemas'],
    { cwd: wt, stdio: ['ignore', 'pipe', 'pipe'] });
  const manifest = JSON.parse(pinned(join(dir, 'source-bundle-v3/manifest.json'),
    '34ffa53959bf44e6023071d4f27fb939732c719bf2bad681a1bea1e877410d68'));
  const q = {};
  for (const key of ['body', 'independentSources', 'policy']) {
    const file = manifest.files.find(f => f.path.replaceAll('\\', '/').endsWith(`/${key}.json`));
    need(file, `Source ${key} missing`); q[key] = JSON.parse(pinned(file.path, file.sha256));
  }
  const D1 = JSON.parse(pinned(join(repo, mission, 'native-preparation-121/source-decision.json'),
    '158ab93e2724a982cfb8204069dadcb1317a07e8ab2ad6bbdf01d0cda43ef989'));
  const { canonical, fingerprint } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/validation.ts')).href);
  const { bindExecutionPreparationV1, sealExecutionEnvelopeV1, bindExecutionSourcesV1,
    makeGraphRunV3, makeBoundDocumentV1 } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/graph-execution-envelope.ts')).href);
  const take = r => { need(r.ok, `Producer refused: ${JSON.stringify(r.reasons)}`); return r.value; };
  take(bindExecutionPreparationV1(q.body, q.independentSources, q.policy));
  const planningDocument = q.body.rootBootstrapSources.planning;
  const origin = take(sealExecutionEnvelopeV1({ ...q.body, planning: planningDocument }));
  const bound = take(bindExecutionSourcesV1(origin, q.independentSources));
  const run = take(makeGraphRunV3(origin)).document;
  const planning = bound.planning;
  need(planning.plan.selectedUnitIds.length === 1, 'Expected singleton fixture selection');
  const unit = planning.units.find(u => u.unitId === planning.plan.selectedUnitIds[0]);
  const sub = unit?.subIntents.find(s => s.role === 'A');
  need(sub && sub.harnessIdentity.sha256 === manifest.rawArtifact.sha256, 'A identity not the pinned RAW fixture');
  // Existing exact projection, not a hand-maintained copy. Import alone opens no store.
  const { nativeFrozenGraphInputsV1 } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/graph-adapter.ts')).href);
  const inputs = nativeFrozenGraphInputsV1(bound, sub);
  const inputFingerprint = fingerprint(inputs);
  const inputVersions = inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 }));
  const qualificationCorpus = D1.corpus.map(c => {
    const matches = q.independentSources.inputManifestSource.files.filter(e => e.file.sha256 === c.sha256);
    need(matches.length === 1, 'Corpus source must have one exact independent entry');
    const e = matches[0], bytes = Buffer.from(e.bytes.base64, 'base64');
    need(sha(bytes) === c.sha256 && e.bytes.ref.sha256 === c.sha256 && e.bytes.ref.byteLength === bytes.length,
      'Corpus byte identity differs');
    const actual = readFileSync(e.file.path);
    need(actual.equals(bytes), 'Actual contract differs from embedded corpus');
    return { ...c, absolutePath: e.file.path, utf8: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  });
  need(qualificationCorpus.length === 2, 'Exactly two supplied contracts required');
  const model = { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'high' };
  need(canonical(bound.sourceSpec.models.A) === canonical(model) && bound.template.settings.profiles.A === 'general',
    'Source model/profile differs from parent selection');
  // Explicit prospective parent identifiers, not admitted/native IDs or reservations.
  const E = 'rms-q-v3-a-6356b01f78a79192-p1';
  const At = 'attempt-rms-q-v3-a-6356b01f78a79192-p1';
  const T = 'task-rms-q-v3-a-6356b01f78a79192-p1';
  const dossier = { version: 1, role: 'A', cycle: inputs.cycle, functionId: sub.functionId,
    function: sub.harnessIdentity, effectiveModel: model, inputs, qualificationCorpus,
    qualificationSource: { fixture: true, admissibleAsOracle: false, rawArtifact: manifest.rawArtifact,
      meaning: 'Constructed return-zero fixture source; actual worker task is the separate non-scientific contract acknowledgement. No native binary or stub execution attested.' },
    resultHeader: { schemaVersion: 1, missionId: q.body.missionId, taskId: T, attemptId: At,
      executionId: E, authorId: E, cycle: inputs.cycle, identity: sub.harnessIdentity,
      inputFingerprint, inputVersions, previousResultIds: [] } };
  const admissionIntention = { executionId: E, subIntentId: sub.subIntentId, attemptId: At, role: 'A', idempotencyKey: E,
    command: { executionId: E, attemptId: At, idempotencyKey: E, taskId: T, profile: 'general', model,
      prompt: D1.prompt, dossier, metadata: { inputFingerprint }, context: { mode: 'fresh' }, worktree: false, requiredAccess: [] } };
  need(!Object.hasOwn(admissionIntention.command.metadata, 'rmsBinding'), 'No operational fences in a static intention');
  const value = { version: 'rms-static-admission-intention-v1', status: 'NOT_AN_OPERATIONAL_ADMISSION_NATIVE_HOLD',
    sourceRequestRef: makeBoundDocumentV1('rms-native-source-request-v1', q).ref,
    runRef: run.ref, planningRef: planningDocument.ref, unitId: unit.unitId,
    prospectiveIdentifiersMeaning: 'Parent choices before native admission; no session, origin, permission or uniqueness against server history proved',
    proposedSessionRules: D1.proposedSessionRules, admissionIntention,
    unresolved: ['authoritative native inventory and canary attribution', 'authentic acquisition and acquired debit',
      'current effective permissions and enforcement', 'fresh explicitly retained operational ownership and actual fences',
      'final rmsBinding, exact wire and distinct final images/digests'],
    forbiddenUses: ['native prepare/submit', 'grant or permit authority', 'adoption of QA ownership', 'physical resource or origin claim'],
    finalImage: null, permit: null, nativeAuthority: 'HOLD' };
  const utf8 = JSON.stringify(value, null, 2) + '\n';
  writeFileSync(target, utf8, { flag: 'wx', encoding: 'utf8' });
  need(readFileSync(target).equals(Buffer.from(utf8)), 'Exact intention readback failed; preserve, do not retry');
  console.log(JSON.stringify({ status: value.status, durationMs: Date.now() - started, path: target,
    byteLength: Buffer.byteLength(utf8), sha256: sha(Buffer.from(utf8)), corpusCount: qualificationCorpus.length,
    corpusUtf8Bytes: qualificationCorpus.map(c => Buffer.byteLength(c.utf8)), inputFileCount: inputs.files.length,
    inputFingerprint, rmsBindingPresent: false, finalWireMeasured: false, databaseOpened: false, nativeActions: 0 }));
} catch (e) {
  console.error(JSON.stringify({ status: 'STATIC_INTENTION_REFUSED', durationMs: Date.now() - started,
    error: String(e?.message || e).slice(0, 3000), nativeActions: 0 })); process.exitCode = 1;
}
