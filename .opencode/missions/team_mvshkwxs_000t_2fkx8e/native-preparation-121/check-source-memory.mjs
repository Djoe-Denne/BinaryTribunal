// Parent-owned bounded preparation check; optional explicit source materialization.
// Writes only a fresh parent source namespace and its exact control file (wx).
// No database, HTTP, session, grant or native runtime entry.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const worktree = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const prep = join(repo, '.opencode/missions/team_mvshkwxs_000t_2fkx8e/native-preparation-121');
const candidate = join(worktree, '.opencode/missions/team_mvshkwxs_000t_2fkx8e/preparation-candidates/source122.mjs');
const harness = join(worktree, 'tools/ff8-harness');
const digest = b => createHash('sha256').update(b).digest('hex');
const need = (v, why) => { if (!v) throw new Error(`HOLD: ${why}`); };
const read = (path, expected) => {
  const bytes = readFileSync(path);
  need(digest(bytes) === expected, `input pin mismatch: ${path}`);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

const paths = {
  envelopeCodec: 'src/graph-execution-envelope.ts',
  fullSnapshotSchema: 'schemas/graph-snapshot-v1.schema.json',
  fullSnapshotModule: 'src/graph.ts',
  proposalCodec: 'src/graph-transport.ts',
  plannerCodec: 'src/planner.ts',
  inputCodec: 'src/graph-pure-codecs.ts',
  admissionCodec: 'src/graph-pure-codecs.ts',
  preparedTransportSchema: 'schemas/l8-prepared-graph-v3.schema.json',
  adoptionTransportSchema: 'schemas/l8-partition-adoption-v1.schema.json',
  domainModule: 'src/domain.ts',
  validationModule: 'src/validation.ts',
  plannerDerivedCodec: 'src/planner-derived-codecs.ts',
  functionOrderCodec: 'src/function-order.ts',
  plannerRelationCodec: 'src/planner-relation-codecs.ts',
  sparseGraphCodec: 'src/sparse-graph-codecs.ts',
  groupContextCodec: 'src/group-context-codecs.ts',
  lineagePureCodec: 'src/lineage-pure-codecs.ts',
  graphPersistenceErrorsCodec: 'src/graph-persistence-errors.ts',
  rePolicyCodec: 'src/re-policy.ts',
  transportCodec: 'src/graph-transport.ts',
  bProjectionCodec: 'src/graph-b-projection.ts',
  clusterTypesModule: 'src/cluster.ts',
  groupTypesModule: 'src/investigation-groups.ts',
  envelopeSchema: 'schemas/l8-execution-envelope-v1.schema.json',
  clusterPartitionSchema: 'schemas/cluster-partition-v1.schema.json',
  workUnitSchema: 'schemas/work-unit-v1.schema.json',
  knowledgeCommitSchema: 'schemas/knowledge-commit-v1.schema.json',
  missionPlanSchema: 'schemas/mission-plan-v1.schema.json',
  investigationGroupSchema: 'schemas/investigation-group-v1.schema.json'
};

const start = Date.now();
try {
  const args = process.argv.slice(2);
  need(args.length === 0 || (args.length === 1 && args[0] === '--materialize-source'), 'unsupported preparation action');
  const materialize = args[0] === '--materialize-source';
  need(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktree, encoding: 'utf8' }).trim()
    === '782ec396a2a7866d30645c32ca8ab864dcca5960', 'product HEAD changed');
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'tools/ff8-harness/src', 'tools/ff8-harness/schemas'],
    { cwd: worktree, stdio: ['ignore', 'pipe', 'pipe'] });
  read(candidate, '9e97ed7ae3627817d4a79fc5c2292a40695560bc2bf8fd0ed2a58cab7c518b06');
  const Dtext = read(join(prep, 'source-decision.json'), '158ab93e2724a982cfb8204069dadcb1317a07e8ab2ad6bbdf01d0cda43ef989');
  const Qtext = read(join(prep, 'function-model.json'), 'd447d28b89e3dec58db1e35f1f550d1921be9bbea66e4eaa4d3b24b841e1274c');
  const cfgText = read(join(prep, 'source-config.json'), '768da8d5f107144555dc94b4332cc4d24c7d6b271db0401d43fa1994b731ff6a');
  const D = JSON.parse(Dtext), cfg = JSON.parse(cfgText);
  need(resolve(cfg.repoRoot) === resolve(repo), 'unexpected source root');
  need(!existsSync(cfg.outputDirectory) && !existsSync(cfg.activationRulePath), 'source destination already exists');
  const contractText = D.corpus.map(c => read(resolve(repo, c.path), c.sha256));
  need(Object.keys(paths).length === 29, 'contract pin key count');
  const blobs = new Map(), contractPins = {};
  for (const [key, path] of Object.entries(paths)) {
    const file = key === 'domainModule'
      ? 'test/fixtures/qualified-upstream/domain-3f49fa05a228549ed626b4f269818385fd23f32d7cc600eda84a1cd9cb42dbe7.ts.txt' : path;
    const bytes = readFileSync(join(harness, file));
    if (key === 'domainModule') need(bytes.length === 15444 && digest(bytes)
      === '3f49fa05a228549ed626b4f269818385fd23f32d7cc600eda84a1cd9cb42dbe7', 'qualified historical domain bytes');
    const schema = path.endsWith('.json');
    const ref = { kind: schema ? 'json-schema-source-v1' : 'typescript-source-v1',
      encoding: schema ? 'utf8-json-v1' : 'raw-v1', byteLength: bytes.length, sha256: digest(bytes) };
    contractPins[key] = ref;
    blobs.set(JSON.stringify(ref), { ref, base64: bytes.toString('base64') });
  }
  const { source122 } = await import(pathToFileURL(candidate).href);
  const result = source122(Dtext, Qtext, contractText, cfg, { contractPins, codecBytes: [...blobs.values()] });
  need(result.status === 'SOURCE_FIXTURE_DATA_ONLY_NATIVE_HOLD', 'unexpected result status');
  let materialization = null;
  if (materialize) {
    // All destinations are parent-owned constants or hash-pinned configuration.
    // A partial failure is left as evidence; never overwrite, retry or clean it.
    const target = join(prep, 'source-bundle-v1');
    need(!existsSync(target), 'source namespace already exists; no retry/overwrite');
    need(resolve(cfg.activationRulePath) === resolve(prep, 'activation-policy.json'), 'unexpected control destination');
    need(!existsSync(cfg.activationRulePath), 'control rule already exists');
    const records = [];
    const writeNew = (path, utf8) => {
      writeFileSync(path, utf8, { encoding: 'utf8', flag: 'wx' });
      const bytes = readFileSync(path), expected = Buffer.from(utf8, 'utf8');
      need(bytes.equals(expected), `exact source readback failed: ${path}`);
      records.push({ path, byteLength: bytes.length, sha256: digest(bytes) });
    };
    mkdirSync(target); // No recursive creation and no takeover of an existing directory.
    writeNew(cfg.activationRulePath, result.controlRule.utf8);
    for (const [name, value] of Object.entries(result.preparation)) {
      need(['body', 'independentSources', 'policy'].includes(name), 'unexpected source output');
      writeNew(join(target, `${name}.json`), JSON.stringify(value, null, 2) + '\n');
    }
    const loaded = Object.fromEntries(['body', 'independentSources', 'policy'].map(name => {
      const path = join(target, `${name}.json`), expected = records.find(r => r.path === path);
      need(expected, 'source file pin missing');
      return [name, JSON.parse(read(path, expected.sha256))];
    }));
    // This is a separate file load, not a claim of independently authored data.
    const { bindExecutionPreparationV1 } = await import(pathToFileURL(join(harness, 'src/graph-execution-envelope.ts')).href);
    const rebound = bindExecutionPreparationV1(loaded.body, loaded.independentSources, loaded.policy);
    need(rebound.ok, `separately loaded preparation refused: ${(rebound.reasons || []).join('; ')}`);
    // Re-read the actual files promised in the source input manifest, including control.
    const entries = loaded.independentSources.inputManifestSource.files;
    for (const entry of entries) {
      const bytes = readFileSync(entry.file.path);
      need(digest(bytes) === entry.file.sha256 && digest(bytes) === entry.bytes.ref.sha256
        && bytes.length === entry.bytes.ref.byteLength && bytes.equals(Buffer.from(entry.bytes.base64, 'base64')),
      `independent input bytes differ: ${entry.file.path}`);
    }
    const receipt = { version: 'rms-source-fixture-materialization-v1', status: 'SOURCE_FILES_RELOADED_NATIVE_HOLD',
      productPin: '782ec396a2a7866d30645c32ca8ab864dcca5960',
      sourceCandidateSha256: digest(readFileSync(candidate)), fixture: true, admissibleAsOracle: false,
      files: records, independentlyReloadedDocuments: 3, independentlyReloadedInputFiles: entries.length,
      bindingAccepted: true, nativeAuthority: 'HOLD', nativeActions: 0,
      limitations: ['No admission or wire checked', 'No native account, inventory, grant or effective permission attested'] };
    writeNew(join(target, 'manifest.json'), JSON.stringify(receipt, null, 2) + '\n');
    materialization = { namespace: target, filesWritten: records.length, bindingAcceptedAfterReload: true,
      manifestSha256: records.at(-1).sha256, nativeActions: 0 };
  }
  console.log(JSON.stringify({ status: result.status, durationMs: Date.now() - start,
    contractPinFields: Object.keys(contractPins).length, distinctCodecBlobs: blobs.size,
    missionId: result.preparation.body.missionId, functionIdentity: result.identity,
    preparationKeys: Object.keys(result.preparation), corpusCount: result.qualificationCorpus.length,
    controlByteLength: new TextEncoder().encode(result.controlRule.utf8).length,
    outputFilesWritten: materialization?.filesWritten ?? 0, materialization, nativeAction: false }));
} catch (e) {
  console.error(JSON.stringify({ status: 'PREPARATION_REFUSED', durationMs: Date.now() - start,
    name: e?.name, code: e?.code, message: String(e?.message || e).slice(0, 4000),
    outputFilesWritten: 'UNKNOWN_IF_MATERIALIZATION_FAILED; inspect owned namespace before any further action', nativeAction: false }));
  process.exitCode = 1;
}
