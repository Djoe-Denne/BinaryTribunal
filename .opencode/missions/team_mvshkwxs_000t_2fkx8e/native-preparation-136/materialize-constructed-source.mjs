// Parent-only fixture SOURCE writer. Never loads generated machine bytes as code.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const wt = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const dir = join(repo, mission, 'native-preparation-136');
const target = join(dir, 'source-bundle-v3');
const candidates = join(wt, mission, 'preparation-candidates');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (v, why) => { if (!v) throw new Error(why); };
const pinnedBytes = (path, expected) => {
  const b = readFileSync(path); need(sha(b) === expected, `Pin mismatch: ${path}`); return b;
};
const pinned = (path, expected) => new TextDecoder('utf-8', { fatal: true }).decode(pinnedBytes(path, expected));
const created = [], start = Date.now();
try {
  need(process.argv.length === 2 && !existsSync(target), 'No arguments, retry, existing namespace or takeover');
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
  const cfgText = pinned(join(dir, 'source-config-v3.json'), '6978a30cabc245ab2360ad7bbd2dbb259e8b63fd844da9b9bb68c5ca76545a87');
  const D1 = pinned(join(repo, mission, 'native-preparation-121/source-decision.json'),
    '158ab93e2724a982cfb8204069dadcb1317a07e8ab2ad6bbdf01d0cda43ef989');
  const rawPath = join(dir, 'constructed-x86-32.bin');
  const raw = pinnedBytes(rawPath, '6356b01f78a791926d2fbce72456364c6c7ed17b7839736dc4249e5e3dbd3020');
  const artifact = { path: rawPath, base64: raw.toString('base64'), byteLength: raw.length, sha256: sha(raw) };
  const cfg = JSON.parse(cfgText);
  need(resolve(cfg.repoRoot) === resolve(repo) && resolve(cfg.activationRulePath)
    === resolve(dir, 'activation-policy.json'), 'Unexpected configured paths');
  need(!existsSync(cfg.activationRulePath) && !existsSync(cfg.outputDirectory), 'Source destinations exist');
  const contracts = JSON.parse(D1).corpus.map(f => pinned(resolve(repo, f.path), f.sha256));
  // Only codec DATA reused; old source graphs and ledgers are not copied.
  const previous = JSON.parse(pinned(join(repo, mission, 'native-preparation-121/source-bundle-v1/independentSources.json'),
    'b962e6dfbc864b9a28b14bd90a7d1503fe9eefe7892715d744e0183a1a6d1329'));
  const codecs = { contractPins: previous.contractPins, codecBytes: previous.codecBytes };
  need(Object.keys(codecs.contractPins).length === 29 && codecs.codecBytes.length === 27, 'Codec bundle shape');
  const { source136 } = await import(pathToFileURL(sourcePath).href);
  const result = source136(D3, Q3, D1, contracts, cfgText, codecs, artifact, { path: enumPath, utf8: code });
  need(result.status === 'CONSTRUCTED_RAW_SOURCE_FIXTURE_DATA_ONLY_NATIVE_HOLD', 'Wrong source domain');
  const proof = JSON.parse(result.enumerationEvidence.utf8), binary = result.snapshot.binaryArtifacts[0];
  need(proof.completed && proof.fixture && proof.nativeAuthority === 'NONE' && proof.generatedCodeExecuted === false
    && proof.rawArtifact.ref.sha256 === sha(raw) && proof.modelRef.sha256 === sha(Buffer.from(Q3))
    && proof.enumeratorSource.ref.sha256 === sha(Buffer.from(code)), 'Source proof differs from invoked files');
  need(binary.architecture === 'x86-32' && binary.contentSha256 === sha(raw)
    && binary.provenance.evidenceSha256 === result.enumerationEvidence.ref.sha256, 'Raw source projection/proof mismatch');
  const planning = JSON.parse(result.preparation.body.rootBootstrapSources.planning.utf8);
  need(planning.sidecar.diagnostics.length === 0, 'Planner diagnostics remain');
  const writeNew = (path, utf8) => {
    writeFileSync(path, utf8, { flag: 'wx', encoding: 'utf8' });
    created.push({ path, byteLength: Buffer.byteLength(utf8, 'utf8'), sha256: sha(Buffer.from(utf8)) });
    need(readFileSync(path).equals(Buffer.from(utf8)), `Exact readback failed: ${path}`);
  };
  mkdirSync(target);
  writeNew(cfg.activationRulePath, result.controlRule.utf8);
  for (const key of ['body', 'independentSources', 'policy'])
    writeNew(join(target, `${key}.json`), JSON.stringify(result.preparation[key], null, 2) + '\n');
  const proofPath = join(target, 'enumeration-proof.json');
  writeNew(proofPath, result.enumerationEvidence.utf8);
  const loaded = Object.fromEntries(['body', 'independentSources', 'policy'].map(key => {
    const path = join(target, `${key}.json`), record = created.find(f => f.path === path);
    return [key, JSON.parse(pinned(path, record.sha256))];
  }));
  const actualProof = JSON.parse(pinned(proofPath, result.enumerationEvidence.ref.sha256));
  const rawAgain = pinnedBytes(rawPath, sha(raw));
  need(actualProof.completed && actualProof.rawArtifact.ref.sha256 === sha(rawAgain), 'Reloaded raw evidence mismatch');
  const { bindExecutionPreparationV1 } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/graph-execution-envelope.ts')).href);
  const bound = bindExecutionPreparationV1(loaded.body, loaded.independentSources, loaded.policy);
  need(bound.ok, `Independent preparation reload refused: ${(bound.reasons || []).join('; ')}`);
  const entries = loaded.independentSources.inputManifestSource.files;
  for (const e of entries) {
    const b = readFileSync(e.file.path);
    need(sha(b) === e.file.sha256 && sha(b) === e.bytes.ref.sha256 && b.length === e.bytes.ref.byteLength
      && b.equals(Buffer.from(e.bytes.base64, 'base64')), `Actual rule input differs: ${e.file.path}`);
  }
  const receipt = { version: 'rms-constructed-source-materialization-v3', status: 'CONSTRUCTED_SOURCE_FILES_RELOADED_NATIVE_HOLD',
    productPin: '782ec396a2a7866d30645c32ca8ab864dcca5960', fixture: true, admissibleAsOracle: false,
    sourceCodeSha256: sha(readFileSync(sourcePath)), enumeratorCodeSha256: sha(Buffer.from(code)), files: created.slice(),
    rawArtifact: { path: rawPath, byteLength: raw.length, sha256: sha(raw) }, enumerationEvidenceRef: result.enumerationEvidence.ref,
    bindingAcceptedAfterReload: true, independentlyReloadedDocuments: 3, independentlyReloadedInputFiles: entries.length,
    diagnosticCount: planning.sidecar.diagnostics.length, nativeAuthority: 'HOLD', generatedCodeExecuted: false, nativeActions: 0,
    limitations: ['No actual reservation/fences', 'No concrete admission/wire', 'No native inventory/acquisition/effective rights attested'] };
  writeNew(join(target, 'manifest.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ status: receipt.status, durationMs: Date.now() - start, namespace: target,
    created, manifestSha256: created.at(-1).sha256, enumerationEvidenceRef: receipt.enumerationEvidenceRef,
    bindingAcceptedAfterReload: true, generatedCodeExecuted: false, nativeActions: 0 }));
} catch (e) {
  console.error(JSON.stringify({ status: 'MATERIALIZATION_REFUSED', durationMs: Date.now() - start,
    error: String(e?.message || e).slice(0, 2500), created,
    instruction: 'Preserve partial owned namespace; no automatic retry, overwrite or reset', nativeActions: 0 }));
  process.exitCode = 1;
}
