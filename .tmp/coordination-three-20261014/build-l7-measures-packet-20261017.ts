import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const dir = CO + '/V3_L7_MEASURES_DRIVER_INPUTS_20261017';
const BENCH = CO + '/L7_SPARSE_BENCH_R1_OUTPUT_20261017';
const D = 'C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/re-graph-scheduler';

const entries = [
  { path: dir + '/SCOPE.md', kind: 'rule' },
  { path: BENCH + '/sparse-bench.ts', kind: 'frozen-dependency', expectPrefix: '91c127a4' },
  { path: BENCH + '/PROTOCOL.md', kind: 'frozen-rule', expectPrefix: 'c71928c7' },
  { path: D + '/L7_SPARSE_BENCH_REVIEW_SCOPE_20261017.md', kind: 'rule' },
].map((e) => {
  const st = statSync(e.path);
  assert(st.isFile() && st.nlink === 1, 'regular+nlink1: ' + e.path);
  const bytes = readFileSync(e.path);
  const h = createHash('sha256').update(bytes).digest('hex');
  if (e.expectPrefix) assert.ok(h.startsWith(e.expectPrefix), 'shaPrefix: ' + e.path);
  return { path: e.path, kind: e.kind, bytes: bytes.length, sha256: h };
});

mkdirSync(dir, { recursive: true });
try { for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o666); } catch {}

const manifest = {
  at: new Date().toISOString(),
  missionId: 'team_mv6tmopg_0000_4urn3c',
  member: 'l7-measures-driver-r1',
  role: 'author',
  mode: 'in-place-admitted-source-packet',
  files: entries,
  totalBytes: entries.reduce((n, e) => n + e.bytes, 0),
  outputDirectory: CO + '/V3_L7_MEASURES_DRIVER_OUTPUT_20261017',
  stage: 'PARENT_ADMITTED_IN_PLACE_READONLY_PREPARED_NOT_APPROVED',
};
writeFileSync(dir + '/INPUT_MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n', { flag: 'w' });
const receipt = {
  at: new Date().toISOString(),
  owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
  note: 'Detached PARENT_ACCESS_RECEIPT per FOLLOWUP_PACKET_EPERM_DISPOSITION_20261017.',
  manifestSha256: createHash('sha256').update(readFileSync(dir + '/INPUT_MANIFEST.json')).digest('hex'),
  requiresParentApproval: true,
  workerAccessVerified: false,
  nativeValidation: false,
};
writeFileSync(dir + '/PARENT_ACCESS_RECEIPT.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'w' });
for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o444);
console.log(JSON.stringify({ files: entries.length, totalBytes: manifest.totalBytes, manifestSha256: receipt.manifestSha256 }));
