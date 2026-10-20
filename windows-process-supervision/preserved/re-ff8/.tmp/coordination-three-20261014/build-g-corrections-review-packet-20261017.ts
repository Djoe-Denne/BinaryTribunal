import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const ROOT = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const CO = ROOT + '/.tmp/coordination-three-20261014';
const dir = CO + '/V3_G_CORRECTIONS_REVIEW_INPUTS_20261017';

const entries = [
  { path: dir + '/SCOPE.md', kind: 'rule' },
  { path: CO + '/V3_G_CORRECTIONS_R1_INPUTS_20261017/PARENT/COMPOSED_REVIEW_VERDICT_EXTRACT.md', kind: 'rule', expectBytes: 4961, expectSha: 'ccf05878a44c243c470e5a21d772431b5718829ced0ea24511bbee1d6e486b7b' },
  { path: CO + '/V3_G_CORRECTIONS_R1_OUTPUT_20261017/GuardianCore.Tests.cs', kind: 'target-under-review', expectBytes: 38487, expectSha: 'aefc941e19765c108acd7e573ebb1664f67dc5a57978bdd607b0cda2a8ce86fa' },
  { path: CO + '/V3_G_CORRECTIONS_R1_OUTPUT_20261017/DESIGN.md', kind: 'target-under-review', expectBytes: 19089, expectSha: 'cd2827d92748ed0829b03d9e476e2d525cafa966d87976200695fa8439a12709' },
  { path: CO + '/V3_G_CORRECTIONS_R1_OUTPUT_20261017/MANIFEST.json', kind: 'target-under-review', expectBytes: 4193, expectSha: 'd817b77056f9ab0d44d7a1a74fa50f792c78b80b5ee1b7006fa982e03a864a18' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs', kind: 'frozen-reference', expectBytes: 71132, expectSha: '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.Tests.cs', kind: 'frozen-original-diff-baseline', expectBytes: 31485, expectSha: '529a5d8f5f0379cdc392f5754469f331c05c025b24215ce6efa72276363b0a89' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/DESIGN.md', kind: 'frozen-original-diff-baseline', expectBytes: 18609, expectSha: '1d5579526cc1b27eb7114703288441691855fd8b0c91edcf7a699700ee5fe8a4' },
  { path: CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs', kind: 'frozen-reference', expectBytes: 8016, expectSha: 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709' },
  { path: CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs', kind: 'frozen-reference', expectBytes: 11846, expectSha: '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f' },
].map((e) => {
  const st = statSync(e.path);
  assert(st.isFile(), 'not regular: ' + e.path);
  assert.strictEqual(st.nlink, 1, 'nlink: ' + e.path);
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
  member: 'v3-g-corrections-review-r1',
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
