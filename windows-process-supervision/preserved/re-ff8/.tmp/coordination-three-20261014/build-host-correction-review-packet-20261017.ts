import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const dir = CO + '/V3_HOST_CORRECTION_REVIEW_INPUTS_20261017';
const COUT = CO + '/V3_HOST_CORRECTION_OUTPUT_20261017';
const SOUT = CO + '/V3_HOST_SOURCE_OUTPUT_20261017';

const entries = [
  { path: dir + '/SCOPE.md', kind: 'rule' },
  { path: CO + '/V3_HOST_CORRECTION_INPUTS_20261017/PARENT/HOST_REVIEW_VERDICT.md', kind: 'rule' },
  { path: CO + '/V3_HOST_REVIEW_INPUTS_20261017/PARENT/HOST_PLAN.md', kind: 'rule' },
  { path: COUT + '/WriterLedger.cs', kind: 'target-under-review', expectSha: '67e9b21c1f8ec6212fa3d21199254359770e5e0b4b56c7268567af55eb0323b0' },
  { path: COUT + '/DESIGN.md', kind: 'target-under-review', expectSha: 'b61274fde7739c8f12b49308b96d6931d51130d350c49c3989a68d8983176b5c' },
  { path: COUT + '/Host.Tests.cs', kind: 'target-under-review', expectSha: 'c5770e353e8c60fa22ac753ebcc37e3cd66c9ef8c94bc4c1e64b69d88eea1716' },
  { path: COUT + '/MANIFEST.json', kind: 'target-under-review', expectSha: '1b9a15be86557241955bff222babddecef82372f49824452f5f89d65ce89a4c2' },
  { path: CO + '/host-correction-parent-intake-20261017.json', kind: 'rule' },
  { path: SOUT + '/HostLauncher.cs', kind: 'frozen-context', expectSha: '1cc9cca0f0d2516f40c42f6d2b421126aa7b05bef29bcbfcd3e5760c1d956a15' },
  { path: SOUT + '/CaptureWiring.cs', kind: 'frozen-context', expectSha: 'd08beba3b371661a1c7a12d4ddda697514556bdc2f91dc16028b0fa20cc2987f' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs', kind: 'frozen-reference', expectSha: '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f' },
  { path: CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs', kind: 'frozen-reference', expectSha: 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709' },
  { path: CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs', kind: 'frozen-reference', expectSha: '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f' },
].map((e) => {
  const st = statSync(e.path);
  assert(st.isFile() && st.nlink === 1, 'regular+nlink1: ' + e.path);
  const bytes = readFileSync(e.path);
  const h = createHash('sha256').update(bytes).digest('hex');
  if (e.expectSha) assert.strictEqual(h, e.expectSha, 'sha: ' + e.path);
  return { path: e.path, kind: e.kind, bytes: bytes.length, sha256: h };
});

mkdirSync(dir, { recursive: true });
try { for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o666); } catch {}

const manifest = {
  at: new Date().toISOString(),
  missionId: 'team_mv6tmopg_0000_4urn3c',
  member: 'v3-host-correction-review-r1',
  role: 'reviewer',
  mode: 'in-place-admitted-source-packet',
  files: entries,
  totalBytes: entries.reduce((n, e) => n + e.bytes, 0),
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
