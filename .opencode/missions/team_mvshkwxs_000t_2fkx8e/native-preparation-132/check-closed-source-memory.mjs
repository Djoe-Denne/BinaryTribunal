// Parent-only bounded checks. No writer, DB, SDK, network or native admission.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const wt = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const input = join(repo, mission, 'native-preparation-132');
const candidates = join(wt, mission, 'preparation-candidates');
const sha = b => createHash('sha256').update(b).digest('hex');
const need = (v, why) => { if (!v) throw new Error(why); };
const pinned = (path, hash) => {
  const bytes = readFileSync(path); need(sha(bytes) === hash, `input pin mismatch: ${path}`);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};
const records = [];
const check = (name, fn) => {
  const start = performance.now();
  try { fn(); records.push({ name, pass: true, durationMs: performance.now() - start }); }
  catch (e) { records.push({ name, pass: false, durationMs: performance.now() - start,
    error: String(e?.message || e).slice(0, 1500) }); }
};
const reject = (fn, expected) => {
  let caught;
  try { fn(); } catch (e) { caught = String(e?.message || e); }
  need(caught && caught.includes(expected), `Expected refusal containing ${expected}; got ${caught ?? 'success'}`);
};
const started = Date.now();
try {
  need(process.argv.length === 2, 'No alternate action or output path accepted');
  need(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim()
    === '782ec396a2a7866d30645c32ca8ab864dcca5960', 'Product HEAD changed');
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'tools/ff8-harness/src', 'tools/ff8-harness/schemas'],
    { cwd: wt, stdio: ['ignore', 'pipe', 'pipe'] });
  const enumPath = join(candidates, 'closed-model-enumerator-v1.mjs');
  const code = pinned(enumPath, '3854cce1be60b19efe9cc0bf596266dd77846ae2ea89b4f9949bb487d20dd64e');
  const sourcePath = join(candidates, 'source132.mjs');
  pinned(sourcePath, '8e407d68ef9ab9db718b076377c63990543200b940d3d3d14489a9fc625129d5');
  const D2 = pinned(join(input, 'source-decision-v2.json'), '6d17c83633939ead1971e314e70fb5e4847dd70c15d6f8617a1128b4ab638d3f');
  const Q2 = pinned(join(input, 'closed-function-model-v2.json'), 'b5f38f84268fd2d75d43eb39b5bcbee01ab9a3174920dce37c79fb0d8d8f6230');
  const cfg = pinned(join(input, 'source-config-v2.json'), '2dcde6f0b978b8eb0959751c07bba26fedbc4a141cf2bacd1c1f0c9ecf32fb77');
  const D1 = pinned(join(repo, mission, 'native-preparation-121/source-decision.json'),
    '158ab93e2724a982cfb8204069dadcb1317a07e8ab2ad6bbdf01d0cda43ef989');
  const contractText = JSON.parse(D1).corpus.map(f => pinned(join(repo, f.path), f.sha256));
  // Reuse only qualified codec bytes/pins, never V1 graph/ledger/model state.
  const oldIndependent = JSON.parse(pinned(join(repo, mission, 'native-preparation-121/source-bundle-v1/independentSources.json'),
    'b962e6dfbc864b9a28b14bd90a7d1503fe9eefe7892715d744e0183a1a6d1329'));
  const codecs = { contractPins: oldIndependent.contractPins, codecBytes: oldIndependent.codecBytes };
  need(Object.keys(codecs.contractPins).length === 29 && codecs.codecBytes.length === 27, 'Qualified codec bundle shape');
  const enumeratorCode = { path: enumPath, utf8: code };
  const { enumerateClosedModelV1 } = await import(pathToFileURL(enumPath).href);
  const { source132 } = await import(pathToFileURL(sourcePath).href);
  const enumerate = text => enumerateClosedModelV1(D2, text, enumeratorCode);
  const variant = mutate => { const q = JSON.parse(Q2); mutate(q); return JSON.stringify(q); };
  const tailPart = () => ({ id: 'tail1', ordinal: 1, role: 'tail', rva: 257,
    endRvaExclusive: 258, operation: 'return', literal: 'OFFLINE_STRUCTURAL_VARIANT', successors: [] });

  let exactProof;
  check('Exact Q2 enumeration with byte-bound evidence and all table ends', () => {
    const result = enumerate(Q2), proof = JSON.parse(result.evidence.utf8);
    need(Object.isFrozen(result) && Object.isFrozen(result.functions), 'Result not frozen');
    need(proof.completed === true && proof.tailsIterated === true && proof.fixture === true
      && proof.admissibleAsOracle === false && proof.nativeAuthority === 'NONE', 'Evidence domain mismatch');
    need(proof.modelRef.sha256 === sha(Buffer.from(Q2)) && proof.decisionRef.sha256 === sha(Buffer.from(D2))
      && proof.enumeratorSource.ref.sha256 === sha(Buffer.from(code)), 'Evidence byte references differ');
    const last = proof.visits.at(-1);
    need(last.kind === 'enumeration-end' && last.functionCount === 1 && last.partCount === 1
      && last.tailCount === 0 && last.successorCount === 0 && last.relationCount === 0, 'Wrong enumeration counts');
    for (const path of ['functions', 'functions[0].parts', 'functions[0].parts[0].successors',
      'functions[0].tails', 'functions[0].relations'])
      need(proof.visits.some(v => v.kind === 'table-end' && v.path === path), `Missing end marker ${path}`);
    exactProof = result.evidence.ref;
  });
  check('OFFLINE variant with an explicit listed tail is actually traversed', () => {
    const result = enumerate(variant(q => { q.functions[0].parts.push(tailPart()); q.functions[0].tails = ['tail1']; }));
    const proof = JSON.parse(result.evidence.utf8);
    need(proof.visits.at(-1).partCount === 2 && proof.visits.at(-1).tailCount === 1
      && proof.visits.some(v => v.kind === 'tail' && v.partId === 'tail1'), 'Nonempty tail table not traversed');
  });
  check('Open parts universe refused by semantic closure guard', () => reject(
    () => enumerate(variant(q => { q.closure.parts = 'open'; })), 'closed universe parts'));
  check('Unknown successor refused after reference traversal', () => reject(
    () => enumerate(variant(q => { q.functions[0].parts[0].successors = ['missing']; })), 'absent/foreign successor part'));
  check('Ambiguous ordinal refused rather than dropped', () => reject(
    () => enumerate(variant(q => { const t = tailPart(); t.ordinal = 0; q.functions[0].parts.push(t); q.functions[0].tails = ['tail1']; })),
    'duplicate/invalid part id or ordinal'));
  check('Unknown declared tail refused', () => reject(
    () => enumerate(variant(q => { q.functions[0].tails = ['missing']; })), 'absent/foreign/non-tail explicit tail'));
  check('Real listed tail omitted from tail table refused', () => reject(
    () => enumerate(variant(q => { q.functions[0].parts.push(tailPart()); })), 'declared/derived tail sets differ'));
  check('Duplicate JSON key refused before JSON.parse can erase it', () => reject(
    () => enumerate(Q2.replace('"fixture": true,', '"fixture": true, "fixture": true,')), 'duplicate JSON key fixture'));
  check('Unknown part extension refused', () => reject(
    () => enumerate(variant(q => { q.functions[0].parts[0].external = true; })), 'unsupported/missing fields'));

  let sourceSummary;
  check('Exact V2 source constructed from proven model without planner diagnostics', () => {
    const result = source132(D2, Q2, D1, contractText, cfg, codecs, enumeratorCode);
    need(result.status === 'CLOSED_SOURCE_FIXTURE_DATA_ONLY_NATIVE_HOLD', 'Wrong source status');
    need(result.snapshot.coverage.status === 'complete' && result.snapshot.coverage.tailsIterated === true
      && result.snapshot.nodes[0].admissibleAsOracle === false, 'Source coverage domain mismatch');
    need(result.enumerationEvidence.ref.sha256 === exactProof?.sha256, 'Source uses different enumeration proof');
    const planning = JSON.parse(result.preparation.body.rootBootstrapSources.planning.utf8);
    need(planning.sidecar.diagnostics.length === 0, 'Reservation-blocking planner diagnostics remain');
    need(planning.plan.selectedUnitIds.length === 1, 'Wrong selected model unit count');
    sourceSummary = { status: result.status, missionId: result.preparation.body.missionId,
      identity: result.identity, enumerationEvidenceRef: result.enumerationEvidence.ref,
      selectedUnitIds: planning.plan.selectedUnitIds, diagnosticCount: planning.sidecar.diagnostics.length,
      nativeAuthority: 'HOLD', outputFilesWritten: 0 };
  });
  check('Source rejects byte-corrupt model even when JSON meaning is unchanged', () => reject(
    () => source132(D2, Q2 + ' ', D1, contractText, cfg, codecs, enumeratorCode), 'closed model v2 raw bytes'));
  const failed = records.filter(r => !r.pass);
  console.log(JSON.stringify({ status: failed.length ? 'TARGETED_CHECKS_FAILED' : 'TARGETED_CHECKS_PASSED',
    durationMs: Date.now() - started, passed: records.length - failed.length, failed: failed.length,
    cases: records, sourceSummary, outputFilesWritten: 0, nativeActions: 0 }));
  if (failed.length) process.exitCode = 1;
} catch (e) {
  console.error(JSON.stringify({ status: 'CHECK_SETUP_REFUSED', durationMs: Date.now() - started,
    error: String(e?.message || e).slice(0, 2500), cases: records, outputFilesWritten: 0, nativeActions: 0 }));
  process.exitCode = 1;
}
