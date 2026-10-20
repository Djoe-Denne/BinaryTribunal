import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const dir = CO + '/V3_REALNATIVE_REVIEW_INPUTS_20261017';
const OUT = CO + '/V3_REALNATIVE_OUTPUT_20261017';

const entries = [
  { path: dir + '/SCOPE.md', kind: 'rule' },
  { path: dir + '/PARENT/REALNATIVE_PLAN.md', kind: 'rule' },
  { path: CO + '/realnative-parent-intake-20261017.json', kind: 'rule' },
  { path: OUT + '/RealNative.cs', kind: 'target-under-review', expectSha: 'e58eef0c8086240e2e8296415cf6ff7e3cbce253aba1d0e4bf425728e1e26e14' },
  { path: OUT + '/RunnerReal.cs', kind: 'target-under-review', expectSha: '8e8bb62304267ad63856956dae6bddfb1e440638ea70d8a287fd2d89484fc5f3' },
  { path: OUT + '/DESIGN.md', kind: 'target-under-review', expectSha: '0cf2057a94b7f08434bc791ae837ba0d92a75d55b9b7da9faa1d3557ad8bfd1f' },
  { path: OUT + '/MANIFEST.json', kind: 'target-under-review', expectSha: '06a1b8bf07180b8309916bb5cdf3f5562d80eab9310e86bab51b1629eed067b4' },
  { path: CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs', kind: 'frozen-reference', expectSha: 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs', kind: 'frozen-reference', expectSha: '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f' },
  { path: CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs', kind: 'frozen-reference', expectSha: 'a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284' },
  { path: CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs', kind: 'frozen-reference', expectSha: '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f' },
  { path: CO + '/V3_HOST_SOURCE_OUTPUT_20261017/HostLauncher.cs', kind: 'frozen-reference', expectSha: '1cc9cca0f0d2516f40c42f6d2b421126aa7b05bef29bcbfcd3e5760c1d956a15' },
  { path: CO + '/V3_HOST_CORRECTION_OUTPUT_20261017/WriterLedger.cs', kind: 'frozen-reference', expectSha: '67e9b21c1f8ec6212fa3d21199254359770e5e0b4b56c7268567af55eb0323b0' },
  { path: CO + '/V3_G_CORRECTIONS_R1_OUTPUT_20261017/GuardianCore.Tests.cs', kind: 'style-reference', expectSha: 'aefc941e19765c108acd7e573ebb1664f67dc5a57978bdd607b0cda2a8ce86fa' },
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
  member: 'v3-realnative-review-r1',
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
  note: 'Detached PARENT_ACCESS_RECEIPT per FOLLOWUP_PACKET_EPERM_DISPOSITION_20261017. Packet completed AFTER the reviewer spawn (its first turn may HOLD on absent manifest — resolved by the parent GO).',
  manifestSha256: createHash('sha256').update(readFileSync(dir + '/INPUT_MANIFEST.json')).digest('hex'),
  requiresParentApproval: true,
  workerAccessVerified: false,
  nativeValidation: false,
};
writeFileSync(dir + '/PARENT_ACCESS_RECEIPT.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'w' });
for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o444);
console.log(JSON.stringify({ files: entries.length, totalBytes: manifest.totalBytes, manifestSha256: receipt.manifestSha256 }));
