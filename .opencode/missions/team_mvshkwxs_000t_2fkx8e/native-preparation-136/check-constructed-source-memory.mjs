// Parent-only pure checks. Generated x86 bytes are inspected as DATA, never executed.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const wt = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const dir = join(repo, mission, 'native-preparation-136');
const candidates = join(wt, mission, 'preparation-candidates');
const sha = b => createHash('sha256').update(b).digest('hex');
const need = (v, why) => { if (!v) throw new Error(why); };
const pinnedBytes = (path, hash) => {
  const b = readFileSync(path); need(sha(b) === hash, `Pin mismatch: ${path}`); return b;
};
const pinned = (path, hash) => new TextDecoder('utf-8', { fatal: true }).decode(pinnedBytes(path, hash));
const cases = [];
const check = (name, fn) => {
  const start = performance.now();
  try { fn(); cases.push({ name, pass: true, durationMs: performance.now() - start }); }
  catch (e) { cases.push({ name, pass: false, durationMs: performance.now() - start, error: String(e?.message || e).slice(0, 1500) }); }
};
const reject = (fn, expected) => {
  let message;
  try { fn(); } catch (e) { message = String(e?.message || e); }
  need(message?.includes(expected), `Expected ${expected}; received ${message ?? 'success'}`);
};
const started = Date.now();
try {
  need(process.argv.length === 2, 'No alternate action/path accepted');
  need(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim()
    === '782ec396a2a7866d30645c32ca8ab864dcca5960', 'Product HEAD changed');
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'tools/ff8-harness/src', 'tools/ff8-harness/schemas'],
    { cwd: wt, stdio: ['ignore', 'pipe', 'pipe'] });
  const enumPath = join(candidates, 'constructed-x86-enumerator-v1.mjs');
  const code = pinned(enumPath, '2d5f8335fc4a9190bf0075648c146875d6154879a674a42c58943971d85b8d8e');
  const sourcePath = join(candidates, 'source136.mjs');
  pinned(sourcePath, '26c0c4f987be393645ca7dacf30adf4f161d2b0491cfe48f7a1a1b99e24d7c74');
  const D3 = pinned(join(dir, 'source-decision-v3.json'), '1796363315de98e1866a4648441ccb99da1acfee2dbae66db75d8248a0234950');
  const Q3 = pinned(join(dir, 'constructed-function-model-v3.json'), '4be761cb6bdd2ee316c8f9446c0a9e702b7c4a6648f5f7bedfbed60d97cb0168');
  const cfg = pinned(join(dir, 'source-config-v3.json'), '6978a30cabc245ab2360ad7bbd2dbb259e8b63fd844da9b9bb68c5ca76545a87');
  const D1 = pinned(join(repo, mission, 'native-preparation-121/source-decision.json'),
    '158ab93e2724a982cfb8204069dadcb1317a07e8ab2ad6bbdf01d0cda43ef989');
  const rawPath = join(dir, 'constructed-x86-32.bin');
  const raw = pinnedBytes(rawPath, '6356b01f78a791926d2fbce72456364c6c7ed17b7839736dc4249e5e3dbd3020');
  const artifact = { path: rawPath, base64: raw.toString('base64'), byteLength: raw.length, sha256: sha(raw) };
  const codeArgument = { path: enumPath, utf8: code };
  const contracts = JSON.parse(D1).corpus.map(f => pinned(join(repo, f.path), f.sha256));
  // Reuse qualified codec bytes only; V1 state/graph/ledger is deliberately ignored.
  const previous = JSON.parse(pinned(join(repo, mission, 'native-preparation-121/source-bundle-v1/independentSources.json'),
    'b962e6dfbc864b9a28b14bd90a7d1503fe9eefe7892715d744e0183a1a6d1329'));
  const codecs = { contractPins: previous.contractPins, codecBytes: previous.codecBytes };
  need(Object.keys(codecs.contractPins).length === 29 && codecs.codecBytes.length === 27, 'Qualified codec bundle shape');
  const { enumerateConstructedX86V1 } = await import(pathToFileURL(enumPath).href);
  const { source136 } = await import(pathToFileURL(sourcePath).href);
  const enumerate = (model = Q3, a = artifact) => enumerateConstructedX86V1(D3, model, a, codeArgument);
  const variant = change => { const q = JSON.parse(Q3); change(q); return JSON.stringify(q); };
  const alteredRaw = change => { const b = Buffer.from(raw); change(b); return { ...artifact, base64: b.toString('base64') }; };
  let exactProof;
  check('Exact constructed RAW proof is byte-bound and target-declared, not native', () => {
    const r = enumerate(), proof = JSON.parse(r.evidence.utf8), end = proof.visits.at(-1);
    need(Object.isFrozen(r) && proof.completed && proof.fixture && proof.admissibleAsOracle === false
      && proof.generatedCodeExecuted === false && proof.nativeAuthority === 'NONE', 'Wrong proof domain');
    need(proof.architecture.target === 'x86-32' && proof.architecture.nativeOrServerArchitectureObserved === false,
      'Target mode confused with native observation');
    need(proof.rawArtifact.ref.sha256 === sha(raw) && proof.rawArtifact.ref.byteLength === 262
      && proof.modelRef.sha256 === sha(Buffer.from(Q3)) && proof.rawArtifact.ref.sha256 !== proof.modelRef.sha256
      && proof.enumeratorSource.ref.sha256 === sha(Buffer.from(code)), 'Hash domain confusion');
    need(end.rawBytesVerified === 262 && end.instructionsVerified === 2 && end.functionCount === 1
      && end.partCount === 1 && end.tailCount === 0 && end.successorCount === 0 && end.relationCount === 0,
      'Incomplete exact enumeration');
    need(proof.instructionFacts.length === 2 && proof.instructionFacts.every(f => f.executed === false)
      && proof.instructionFacts[0].byteLength === 5 && proof.instructionFacts[1].byteLength === 1, 'Wrong instruction facts');
    need(proof.visits.some(v => v.kind === 'table-end' && v.path === 'functions[0].tails'), 'Empty tails not visited');
    exactProof = r.evidence.ref;
  });
  check('Contrary target mode rejected rather than inferred from same bytes', () => reject(
    () => enumerate(variant(q => { q.module.targetArchitecture = 'x86-64'; })), 'declared generation target must be x86-32'));
  check('Nonzero padding byte refused by actual layout scan', () => reject(
    () => enumerate(Q3, alteredRaw(b => { b[0] = 1; })), 'nonzero reserved byte at 0'));
  check('Changed code byte refused by actual code scan', () => reject(
    () => enumerate(Q3, alteredRaw(b => { b[261] = 0x90; })), 'actual six code bytes differ'));
  check('Entry span outside fixed chunk refused semantically', () => reject(
    () => enumerate(variant(q => { q.functions[0].parts[0].endRvaExclusive = 263; })), 'exact positive entry span'));
  check('Incorrect instruction width refused with original raw bytes', () => reject(
    () => enumerate(variant(q => { q.functions[0].parts[0].instructions[0].byteLength = 4; })), 'instruction offset/width/hex'));
  check('Open parts universe refused', () => reject(
    () => enumerate(variant(q => { q.closure.parts = 'open'; })), 'closed parts universe'));
  check('Unknown successor target refused after traversal', () => reject(
    () => enumerate(variant(q => { q.functions[0].parts[0].successors = ['missing']; })), 'absent/foreign successor target'));
  check('Noncanonical base64 refused', () => reject(
    () => enumerate(Q3, { ...artifact, base64: artifact.base64 + '\n' }), 'strict bounded raw base64'));
  check('Descriptor hash cannot substitute for raw module hash', () => reject(
    () => enumerate(Q3, { ...artifact, sha256: sha(Buffer.from(Q3)) }), 'raw artifact metadata pin'));
  check('Duplicate descriptor JSON key refused', () => reject(
    () => enumerate(Q3.replace('"fixture": true,', '"fixture": true, "fixture": true,')), 'duplicate JSON key fixture'));
  check('Entry cannot masquerade as a declared tail', () => reject(
    () => enumerate(variant(q => { q.functions[0].tails = ['entry']; })), 'absent/foreign/duplicate/non-tail explicit tail'));
  let sourceSummary;
  check('Exact source uses raw identity and known constructed target without diagnostics', () => {
    const r = source136(D3, Q3, D1, contracts, cfg, codecs, artifact, codeArgument);
    need(r.status === 'CONSTRUCTED_RAW_SOURCE_FIXTURE_DATA_ONLY_NATIVE_HOLD', 'Wrong source domain');
    const a = r.snapshot.binaryArtifacts[0], n = r.snapshot.nodes[0];
    need(a.contentSha256 === sha(raw) && a.architecture === 'x86-32' && a.format === 'unknown'
      && a.provenance.moduleSha256 === sha(raw) && n.moduleSha256 === sha(raw)
      && r.identity.sha256 === sha(raw) && n.admissibleAsOracle === false, 'Incorrect canonical raw projection');
    need(r.enumerationEvidence.ref.sha256 === exactProof?.sha256, 'Source proof differs from exact traversal');
    const planning = JSON.parse(r.preparation.body.rootBootstrapSources.planning.utf8);
    need(planning.sidecar.diagnostics.length === 0 && planning.plan.selectedUnitIds.length === 1,
      'Source planning still blocked or not singleton');
    need(planning.units.every(u => u.subIntents.every(s => s.harnessIdentity.sha256 === sha(raw))),
      'Sub-intent identity is not raw module identity');
    sourceSummary = { status: r.status, missionId: r.preparation.body.missionId,
      identity: r.identity, rawModuleSha256: sha(raw), descriptorSha256: sha(Buffer.from(Q3)),
      enumerationEvidenceRef: r.enumerationEvidence.ref, diagnosticCount: 0,
      selectedUnitIds: planning.plan.selectedUnitIds, outputFilesWritten: 0, nativeAuthority: 'HOLD' };
  });
  check('Source rejects a different raw path despite identical supplied bytes', () => reject(
    () => source136(D3, Q3, D1, contracts, cfg, codecs, { ...artifact, path: join(dir, 'NOT_THE_RAW_SOURCE.bin') }, codeArgument),
    'raw file path must match parent v3 descriptor'));
  const failed = cases.filter(c => !c.pass);
  console.log(JSON.stringify({ status: failed.length ? 'TARGETED_CHECKS_FAILED' : 'TARGETED_CHECKS_PASSED',
    durationMs: Date.now() - started, passed: cases.length - failed.length, failed: failed.length,
    cases, sourceSummary, outputFilesWritten: 0, generatedCodeExecuted: false, nativeActions: 0 }));
  if (failed.length) process.exitCode = 1;
} catch (e) {
  console.error(JSON.stringify({ status: 'CHECK_SETUP_REFUSED', durationMs: Date.now() - started,
    error: String(e?.message || e).slice(0, 2500), cases, outputFilesWritten: 0, generatedCodeExecuted: false, nativeActions: 0 }));
  process.exitCode = 1;
}
