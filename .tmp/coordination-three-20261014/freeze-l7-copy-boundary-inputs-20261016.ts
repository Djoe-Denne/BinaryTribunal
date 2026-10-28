import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-namespace-review-preparation-request-20261016.json', 'utf8'));
const sourceRoot = phase + '/L7_COPY_BOUNDARY_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const files = new Map<string, { bytes: Buffer; kind: string; origin: string }>();
const put = (path: string, bytes: Buffer, kind: string, origin: string) => {
  assert(!files.has(path)); assert(bytes.length <= 8 * 1024 * 1024); files.set(path, { bytes, kind, origin });
};
for (const f of q.files) {
  const b = readFileSync(q.sourceRoot + '/' + f.path); assert.equal(sha(b), f.sha256);
  const p = f.path.startsWith('tools/ff8-harness/') || f.path.startsWith('docs/') || f.path.startsWith('.tmp/')
    ? f.path : 'HISTORICAL/REVIEW6D00/' + f.path;
  put(p, b, f.kind, 'unchanged386pin6d00 source/dependencies; old controls under historical not current identity or permission');
}
put('PARENT/USER_GO.md', readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_USER_GO_20261016.md'), 'rule', 'explicit current user authorization and bounded conditions');
put('PARENT/CONFIRMED_BLOCK.md', readFileSync(root + '/docs/missions/re-graph-scheduler/L7_6D00_COPY_BOUNDARY_BLOCK_ROUTING_GATE_20261016.md'), 'knowledge', 'confirmed parent publicAPI blocker; routingWAIT superseded ONLY by new USER_GO');
put('PARENT/PARENT_REPRO.json', readFileSync(phase + '/l7-copy-boundary-parent-reproduction-20261016.json'), 'knowledge', 'parent4cases public memory observations; archived absolute paths not access permission');
put('PARENT/PARENT_REPRO.code.txt', readFileSync(phase + '/L7_NAMESPACE_COPY_BOUNDARY_PARENT_REPLAY_20261016/probe.code.txt'), 'knowledge', 'public repro source data only not execution permission');
const notes = { purpose: 'fresh NONBLIND invariant-scoped AstraMAX correction PLAN first; user renewed after6d00BLOCK',
  sourceSha256: '6d00cf296cf22378604ea9fc07e155ccf4cb6806186c5d2e63e55fbdbc89716f',
  old131ControlsAndReadmeAndAll33ExportedDeclarationsReadonly: true,
  candidateSourceOnlyProposedAfterPlan: 'tools/ff8-harness/src/simulator.ts',
  newTestOnlyProposedAfterPlan: 'tools/ff8-harness/test/simulator/simulator-copy-boundary-regressions.test.ts',
  priorPublicReviewerFullReportUnavailableHereParentConfirmedFindingSufficientForNonblind: true,
  noLedger9MbDbFilesNativeOrL8CandidateTransferred: true,
  stage: 'ACCESS_ONLY fullReadRoleHashAck then separate STATIC_ANALYSIS_PLAN_GO; no execution yet',
  historicalControlsNotCurrentTaskRoleOrAccessInstructions: true };
put('PARENT/NOTES.json', Buffer.from(JSON.stringify(notes, null, 2) + '\n'), 'manifest', 'current concise boundaries');
const manifest = Buffer.from(JSON.stringify({ ...notes, files: [...files].map(([path, f]) => ({ path, sha256: sha(f.bytes), kind: f.kind, origin: f.origin })) }, null, 2) + '\n');
put('INPUT_MANIFEST.json', manifest, 'manifest', 'current full package pins'); assert(files.size <= 512);
for (const [p, f] of files) { mkdirSync(dirname(sourceRoot + '/' + p), { recursive: true }); writeFileSync(sourceRoot + '/' + p, f.bytes, { flag: 'wx' }); }
const out = { at: new Date().toISOString(), sourceRoot, files: files.size, bytes: [...files.values()].reduce((n, f) => n + f.bytes.length, 0),
  manifestSha256: sha(manifest), userGoBytes: files.get('PARENT/USER_GO.md')!.bytes.length,
  userGoSha256: sha(files.get('PARENT/USER_GO.md')!.bytes), sourceSha256: notes.sourceSha256,
  noSourceWorkerOrExecutionGoByFreeze: true };
writeFileSync(phase + '/l7-copy-boundary-freeze-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
