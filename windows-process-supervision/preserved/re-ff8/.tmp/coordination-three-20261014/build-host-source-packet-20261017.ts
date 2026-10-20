import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const dir = CO + '/V3_HOST_SOURCE_INPUTS_20261017';
const G = CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017';
const B = CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017';
const O = CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017';

const entries = [
  { path: dir + '/SCOPE.md', kind: 'rule' },
  { path: 'C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/re-graph-scheduler/JOB_GUARDIAN_V3_CONTRACT_DRAFT2_20261017.md', kind: 'rule', expectBytes: 9919, expectSha: 'bb69e0ade4c0b48c8d1c420e528683fe2d614eff6cac80fa64e6f58df33cafd3' },
  { path: CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs', kind: 'frozen-reference', expectBytes: 8016, expectSha: 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709' },
  { path: G + '/GuardianCore.cs', kind: 'frozen-reference', expectBytes: 71132, expectSha: '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f' },
  { path: G + '/DESIGN.md', kind: 'frozen-reference', expectBytes: 18609, expectSha: '1d5579526cc1b27eb7114703288441691855fd8b0c91edcf7a699700ee5fe8a4' },
  { path: CO + '/V3_G_CORRECTIONS_R1_OUTPUT_20261017/GuardianCore.Tests.cs', kind: 'style-reference', expectBytes: 38487, expectSha: 'aefc941e19765c108acd7e573ebb1664f67dc5a57978bdd607b0cda2a8ce86fa' },
  { path: B + '/BudgetedEvidence.cs', kind: 'frozen-reference', expectBytes: 11846, expectSha: '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f' },
  { path: B + '/DESIGN.md', kind: 'frozen-reference', expectBytes: 11294, expectSha: 'b54b561f0aa24e80df9102432772cc6837a5ef9f37b25aa87552a01e245198b6' },
  { path: O + '/KernelObserver.cs', kind: 'frozen-reference', expectBytes: 21557, expectSha: 'a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284' },
  { path: CO + '/V3_G_CORRECTIONS_R1_INPUTS_20261017/PARENT/COMPOSED_REVIEW_VERDICT_EXTRACT.md', kind: 'rule', expectBytes: 4961, expectSha: 'ccf05878a44c243c470e5a21d772431b5718829ced0ea24511bbee1d6e486b7b' },
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
  member: 'v3-host-source-r1',
  role: 'author',
  mode: 'in-place-admitted-source-packet',
  files: entries,
  totalBytes: entries.reduce((n, e) => n + e.bytes, 0),
  outputDirectory: CO + '/V3_HOST_SOURCE_OUTPUT_20261017',
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
