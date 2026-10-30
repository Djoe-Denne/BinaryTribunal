// Parent-only source-file materialization. No database, service or native admission.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const wt = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const dir = join(repo, mission, 'native-preparation-132');
const candidates = join(wt, mission, 'preparation-candidates');
const target = join(dir, 'source-bundle-v2');
const sha = b => createHash('sha256').update(b).digest('hex');
const need = (v, why) => { if (!v) throw new Error(why); };
const pinned = (path, expected) => {
  const bytes = readFileSync(path); need(sha(bytes) === expected, `Source pin mismatch: ${path}`);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};
const created = [];
const start = Date.now();
try {
  need(process.argv.length === 2, 'No alternate action or output destination');
  need(!existsSync(target), 'Source namespace exists; no retry, overwrite or takeover');
  need(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim()
    === '782ec396a2a7866d30645c32ca8ab864dcca5960', 'Product HEAD changed');
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'tools/ff8-harness/src', 'tools/ff8-harness/schemas'],
    { cwd: wt, stdio: ['ignore', 'pipe', 'pipe'] });
  const enumPath = join(candidates, 'closed-model-enumerator-v1.mjs');
  const code = pinned(enumPath, '3854cce1be60b19efe9cc0bf596266dd77846ae2ea89b4f9949bb487d20dd64e');
  const sourcePath = join(candidates, 'source132.mjs');
  pinned(sourcePath, '8e407d68ef9ab9db718b076377c63990543200b940d3d3d14489a9fc625129d5');
  const D2 = pinned(join(dir, 'source-decision-v2.json'), '6d17c83633939ead1971e314e70fb5e4847dd70c15d6f8617a1128b4ab638d3f');
  const Q2 = pinned(join(dir, 'closed-function-model-v2.json'), 'b5f38f84268fd2d75d43eb39b5bcbee01ab9a3174920dce37c79fb0d8d8f6230');
  const cfgText = pinned(join(dir, 'source-config-v2.json'), '2dcde6f0b978b8eb0959751c07bba26fedbc4a141cf2bacd1c1f0c9ecf32fb77');
  const D1 = pinned(join(repo, mission, 'native-preparation-121/source-decision.json'),
    '158ab93e2724a982cfb8204069dadcb1317a07e8ab2ad6bbdf01d0cda43ef989');
  const cfg = JSON.parse(cfgText);
  need(resolve(cfg.repoRoot) === resolve(repo) && resolve(cfg.activationRulePath)
    === resolve(dir, 'activation-policy.json'), 'Unexpected configured source paths');
  need(!existsSync(cfg.activationRulePath) && !existsSync(cfg.outputDirectory), 'Source destinations already exist');
  const contracts = JSON.parse(D1).corpus.map(f => pinned(resolve(repo, f.path), f.sha256));
  // Only codec DATA is reused, not any V1 graph, knowledge, root or ledger.
  const old = JSON.parse(pinned(join(repo, mission, 'native-preparation-121/source-bundle-v1/independentSources.json'),
    'b962e6dfbc864b9a28b14bd90a7d1503fe9eefe7892715d744e0183a1a6d1329'));
  const codecs = { contractPins: old.contractPins, codecBytes: old.codecBytes };
  need(Object.keys(codecs.contractPins).length === 29 && codecs.codecBytes.length === 27, 'Codec bundle shape');
  const { source132 } = await import(pathToFileURL(sourcePath).href);
  const result = source132(D2, Q2, D1, contracts, cfgText, codecs, { path: enumPath, utf8: code });
  need(result.status === 'CLOSED_SOURCE_FIXTURE_DATA_ONLY_NATIVE_HOLD', 'Wrong source domain');
  const proof = JSON.parse(result.enumerationEvidence.utf8);
  need(proof.completed === true && proof.fixture === true && proof.nativeAuthority === 'NONE'
    && proof.modelRef.sha256 === sha(Buffer.from(Q2)) && proof.enumeratorSource.ref.sha256 === sha(Buffer.from(code)),
    'Enumeration evidence differs from invoked inputs');
  need(result.snapshot.binaryArtifacts[0].provenance.evidenceSha256 === result.enumerationEvidence.ref.sha256,
    'Graph provenance does not reference the enumeration proof');
  const planning = JSON.parse(result.preparation.body.rootBootstrapSources.planning.utf8);
  need(planning.sidecar.diagnostics.length === 0, 'Planner diagnostic prevents source reservation');
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
  const reloadedProof = JSON.parse(pinned(proofPath, result.enumerationEvidence.ref.sha256));
  need(reloadedProof.completed && reloadedProof.modelRef.sha256 === sha(Buffer.from(Q2)), 'Reloaded proof differs');
  const { bindExecutionPreparationV1 } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/graph-execution-envelope.ts')).href);
  const bound = bindExecutionPreparationV1(loaded.body, loaded.independentSources, loaded.policy);
  need(bound.ok, `Separately loaded preparation refused: ${(bound.reasons || []).join('; ')}`);
  const entries = loaded.independentSources.inputManifestSource.files;
  for (const e of entries) {
    const bytes = readFileSync(e.file.path);
    need(sha(bytes) === e.file.sha256 && sha(bytes) === e.bytes.ref.sha256
      && bytes.length === e.bytes.ref.byteLength && bytes.equals(Buffer.from(e.bytes.base64, 'base64')),
    `Actual input bytes differ: ${e.file.path}`);
  }
  const receipt = { version: 'rms-closed-source-materialization-v2', status: 'CLOSED_SOURCE_FILES_RELOADED_NATIVE_HOLD',
    productPin: '782ec396a2a7866d30645c32ca8ab864dcca5960', fixture: true, admissibleAsOracle: false,
    sourceCodeSha256: sha(readFileSync(sourcePath)), enumeratorCodeSha256: sha(Buffer.from(code)),
    files: created.slice(), enumerationEvidenceRef: result.enumerationEvidence.ref, bindingAcceptedAfterReload: true,
    independentlyReloadedDocuments: 3, independentlyReloadedInputFiles: entries.length,
    diagnosticCount: planning.sidecar.diagnostics.length, nativeAuthority: 'HOLD', nativeActions: 0,
    limitations: ['No actual reservation or fence', 'No concrete admission or wire', 'No native acquisition or effective rights attested'] };
  const manifestPath = join(target, 'manifest.json');
  writeNew(manifestPath, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ status: receipt.status, durationMs: Date.now() - start, namespace: target,
    created, manifestSha256: created.at(-1).sha256, enumerationEvidenceRef: receipt.enumerationEvidenceRef,
    bindingAcceptedAfterReload: true, nativeActions: 0 }));
} catch (e) {
  console.error(JSON.stringify({ status: 'MATERIALIZATION_REFUSED', durationMs: Date.now() - start,
    error: String(e?.message || e).slice(0, 2500), created,
    instruction: 'Inspect partial owned namespace; no automatic retry, overwrite or cleanup', nativeActions: 0 }));
  process.exitCode = 1;
}
