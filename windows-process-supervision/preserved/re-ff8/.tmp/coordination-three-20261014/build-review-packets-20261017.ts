import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const ROOT = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const CO = ROOT + '/.tmp/coordination-three-20261014';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function verify(entry) {
  const st = statSync(entry.path);
  assert(st.isFile() && !entry.path.includes('.lnk'), 'not regular: ' + entry.path);
  assert.strictEqual(st.nlink, 1, 'nlink: ' + entry.path);
  const bytes = readFileSync(entry.path);
  const h = createHash('sha256').update(bytes).digest('hex');
  if (entry.expectBytes != null) assert.strictEqual(bytes.length, entry.expectBytes, 'bytes: ' + entry.path);
  if (entry.expectSha) assert.strictEqual(h, entry.expectSha, 'sha: ' + entry.path);
  if (entry.expectPrefix) assert.ok(h.startsWith(entry.expectPrefix), 'shaPrefix: ' + entry.path + ' got ' + h.slice(0, 16));
  return { path: entry.path, kind: entry.kind, bytes: bytes.length, sha256: h };
}

function matchFile(dir, expectBytes, expectPrefix) {
  const hit = readdirSync(dir).map((n) => dir + '/' + n).filter((p) => statSync(p).isFile())
    .find((p) => statSync(p).size === expectBytes && sha(p).startsWith(expectPrefix));
  assert(hit, 'no file matching ' + expectBytes + 'B/' + expectPrefix + ' in ' + dir);
  return hit;
}

// ---- Composed review packet ----
const compDir = CO + '/V3_COMPOSED_REVIEW_INPUTS_20261017';
const budgetDir = CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017';
const composedEntries = [
  { path: compDir + '/SCOPE.md', kind: 'rule' },
  { path: ROOT + '/docs/missions/re-graph-scheduler/JOB_GUARDIAN_V3_CONTRACT_DRAFT2_20261017.md', kind: 'rule', expectSha: 'bb69e0ade4c0b48c8d1c420e528683fe2d614eff6cac80fa64e6f58df33cafd3' },
  { path: CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs', kind: 'rule', expectBytes: 8016, expectSha: 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709' },
  { path: ROOT + '/docs/missions/re-graph-scheduler/V3_CORE_SOURCE_SCOPES_20261017.md', kind: 'rule', expectPrefix: 'f8611364' },
  { path: ROOT + '/docs/missions/re-graph-scheduler/V3_CONTRACT_PARENT_CORRECTION_DISPOSITION_20261017.md', kind: 'rule' },
  { path: ROOT + '/docs/missions/re-graph-scheduler/V3_CORE_PARENT_SOURCE_RATIFICATION_20261017.md', kind: 'rule' },
  { path: ROOT + '/docs/missions/re-graph-scheduler/V3_BUDGET_SOURCE_REVIEW_ACCEPTED_20261017.md', kind: 'rule' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs', kind: 'source-under-review', expectBytes: 71132, expectSha: '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.Tests.cs', kind: 'source-under-review', expectBytes: 31485, expectSha: '529a5d8f5f0379cdc392f5754469f331c05c025b24215ce6efa72276363b0a89' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/DESIGN.md', kind: 'source-under-review', expectBytes: 18609, expectSha: '1d5579526cc1b27eb7114703288441691855fd8b0c91edcf7a699700ee5fe8a4' },
  { path: CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/MANIFEST.json', kind: 'source-under-review', expectBytes: 6903, expectSha: 'dcfb2c69f4d7682d4397209c6e6e1882b5eb8ae14114cc30e50092a8093d0fc7' },
  { path: CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs', kind: 'source-under-review', expectBytes: 21557, expectSha: 'a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284' },
  { path: CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.Tests.cs', kind: 'source-under-review', expectBytes: 45179, expectSha: '82a95a2fb76857cc3f70a78abc9b48168bbb849ba0666a981fa14cbdc06ab942' },
  { path: CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/DESIGN.md', kind: 'source-under-review', expectBytes: 17511, expectSha: 'f0efc73e97f4b456addc37af9fd95a53bd4d98e8189b74a75447fd81cba37cc2' },
  { path: CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/MANIFEST.json', kind: 'source-under-review', expectBytes: 6572, expectSha: '510ceca18085834b952864102818ee96ad212d9c0df4faabde648e7c75f7e11c' },
  { path: matchFile(budgetDir, 11846, '0944a3bb'), kind: 'accepted-source' },
  { path: matchFile(budgetDir, 31798, 'd94776e2'), kind: 'accepted-source' },
  { path: matchFile(budgetDir, 11294, 'b54b561f'), kind: 'accepted-source' },
  { path: matchFile(budgetDir, 5987, '652101e0'), kind: 'accepted-source' },
  { path: CO + '/V3_BUDGET_PARENT_ORACLE_20261017/cases.json', kind: 'manifest', expectBytes: 5008, expectSha: 'ad67adf01a44f23444b9c1755a07f4cc4004a8504a69061d11a5eb1741db5318' },
].map(verify);

// ---- Bench review packet ----
const benchDir = CO + '/L7_SPARSE_BENCH_REVIEW_INPUTS_20261017';
const benchOut = CO + '/L7_SPARSE_BENCH_R1_OUTPUT_20261017';
const benchSrc = CO + '/L7_SPARSE_BENCH_R1_SOURCE_PACKET_20261017';
const benchEntries = [
  { path: ROOT + '/docs/missions/re-graph-scheduler/L7_SPARSE_BENCH_REVIEW_SCOPE_20261017.md', kind: 'rule' },
  { path: benchSrc + '/PARENT/SCOPE.md', kind: 'rule', expectBytes: 3041, expectSha: '8591d61c5134a4de88222c4e60e04e45967a14e83695d0d502b09b89994f5589' },
  { path: benchSrc + '/PARENT/BINDING.json', kind: 'manifest', expectBytes: 701, expectSha: 'f9856e6c13c275441efd1d3362ea0bdadc7296446e7982acdeca1b4a4b6259df' },
  { path: benchSrc + '/DOCS/FRONTIER_PARENT_ROUTING_20261017.md', kind: 'rule', expectBytes: 3241, expectSha: 'fa80b51c7237e58280a20f775b59cbfdf2182abb47f2666f837fa51001668737' },
  { path: benchOut + '/sparse-bench.ts', kind: 'source-under-review', expectBytes: 20318, expectPrefix: '91c127a4' },
  { path: benchOut + '/sparse-bench.test.ts', kind: 'source-under-review', expectBytes: 22227, expectPrefix: 'e85de41a' },
  { path: benchOut + '/PROTOCOL.md', kind: 'source-under-review', expectBytes: 20008, expectPrefix: 'c71928c7' },
  { path: benchOut + '/MANIFEST.json', kind: 'source-under-review', expectBytes: 6541, expectPrefix: 'b5e1c7d3' },
].map(verify);

function writePacket(dir, taskId, member, entries, extra) {
  mkdirSync(dir, { recursive: true });
  try { for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o666); } catch {}
  const total = entries.reduce((n, e) => n + e.bytes, 0);
  const manifest = {
    at: new Date().toISOString(),
    missionId: 'team_mv6tmopg_0000_4urn3c',
    taskId,
    member,
    role: 'reviewer',
    mode: 'in-place-admitted-source-packet',
    files: entries,
    totalBytes: total,
    stage: 'PARENT_ADMITTED_IN_PLACE_READONLY_PREPARED_NOT_APPROVED',
    ...extra,
  };
  writeFileSync(dir + '/INPUT_MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n', { flag: 'w' });
  const receipt = {
    at: new Date().toISOString(),
    owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
    note: 'Detached PARENT_ACCESS_RECEIPT per FOLLOWUP_PACKET_EPERM_DISPOSITION_20261017: in-place admitted inputs, no move, not a helper .preparation-receipt, no atomic-commit claim.',
    pinsVerifiedBy: 'bun re-hash of every listed file (regular, nlink1, bytes, sha256/prefix)',
    manifestSha256: createHash('sha256').update(readFileSync(dir + '/INPUT_MANIFEST.json')).digest('hex'),
    requiresParentApproval: true,
    workerAccessVerified: false,
    nativeValidation: false,
  };
  writeFileSync(dir + '/PARENT_ACCESS_RECEIPT.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'w' });
  for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o444);
  return { dir, files: entries.length + 2, totalBytes: total + statSync(dir + '/INPUT_MANIFEST.json').size, manifestSha256: receipt.manifestSha256 };
}

const out = {
  composed: writePacket(compDir, 'task_mvc43o9u_0009_ctebzb', 'v3-composed-review-r1', composedEntries, { supersedes: 'task_mvc42woi_0008_oa19w8 (placeholder, never admitted)' }),
  bench: writePacket(benchDir, 'task_mvc59ue8_001j_gscvw5-REVIEW', 'l7-sparse-bench-review-r1', benchEntries, { note: 'review of L7 sparse-bench author deliverables; author task task_mvc59ue8_001j_gscvw5 delivered and frozen' }),
};
console.log(JSON.stringify(out, null, 1));
