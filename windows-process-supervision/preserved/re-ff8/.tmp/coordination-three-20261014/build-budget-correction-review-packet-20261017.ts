import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const dir = CO + '/V3_BUDGET_CORRECTION_REVIEW_INPUTS_20261017';
const OUT = CO + '/V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017';
const GEL = CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017';

const entries = [
  { path: dir + '/SCOPE.md', kind: 'rule' },
  { path: CO + '/v3-budget-memory-execution-receipt-20261017.json', kind: 'rule', expectBytes: 3764, expectSha: '23b51154a3452c80617a2a7f3e8ed592761ed94cd64627ad58d79d970064e9c5' },
  { path: OUT + '/BudgetedEvidence.cs', kind: 'target-under-review', expectBytes: 11846, expectSha: '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f' },
  { path: OUT + '/BudgetedEvidence.Tests.cs', kind: 'target-under-review', expectBytes: 32653, expectSha: 'e24df7737199e7c567dc6ae82bf5a7050cd9a38a28988e386b7c36893b19bed4' },
  { path: OUT + '/DESIGN.md', kind: 'target-under-review', expectBytes: 11294, expectSha: 'b54b561f0aa24e80df9102432772cc6837a5ef9f37b25aa87552a01e245198b6' },
  { path: OUT + '/MANIFEST.json', kind: 'target-under-review', expectBytes: 4661, expectSha: '0fcb436d075f56b43a6b4223e8a095817206653a2f91fd397c64ef8952de0902' },
  { path: GEL + '/BudgetedEvidence.Tests.cs', kind: 'frozen-original-diff-baseline', expectBytes: 31798, expectSha: 'd94776e2858b223a3f0e85d255f4c694ae1520194c1dc48798cd8e61b6b94198' },
  { path: GEL + '/BudgetedEvidence.cs', kind: 'frozen-reference', expectBytes: 11846, expectSha: '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f' },
  { path: CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs', kind: 'frozen-reference', expectBytes: 8016, expectSha: 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709' },
].map((e) => {
  const st = statSync(e.path);
  assert(st.isFile() && st.nlink === 1, 'regular+nlink1: ' + e.path);
  const bytes = readFileSync(e.path);
  const h = createHash('sha256').update(bytes).digest('hex');
  if (e.expectBytes != null) assert.strictEqual(bytes.length, e.expectBytes, 'bytes: ' + e.path);
  if (e.expectSha) assert.strictEqual(h, e.expectSha, 'sha: ' + e.path);
  return { path: e.path, kind: e.kind, bytes: bytes.length, sha256: h };
});

mkdirSync(dir, { recursive: true });
try { for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o666); } catch {}

const manifest = {
  at: new Date().toISOString(),
  missionId: 'team_mv6tmopg_0000_4urn3c',
  member: 'v3-budget-correction-review-r1',
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
