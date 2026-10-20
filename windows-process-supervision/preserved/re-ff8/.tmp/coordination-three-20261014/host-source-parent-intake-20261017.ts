import { readFileSync, readdirSync, lstatSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const OUT = CO + '/V3_HOST_SOURCE_OUTPUT_20261017';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// frozen kernel intactness re-check (parent, before review)
const kernel = {
  [CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs']: '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f',
  [CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs']: 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709',
  [CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs']: '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f',
  [CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs']: 'a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284',
};
for (const [p, expect] of Object.entries(kernel)) assert.strictEqual(sha(p), expect, 'kernel pin: ' + p);

// author sources (5) — parent does NOT modify them
const names = ['HostLauncher.cs', 'WriterLedger.cs', 'CaptureWiring.cs', 'Host.Tests.cs', 'DESIGN.md'];
const files = names.map((name) => {
  const p = OUT + '/' + name;
  const l = lstatSync(p);
  assert(l.isFile() && !l.isSymbolicLink() && statSync(p).nlink === 1, 'regular+nlink1: ' + name);
  return { path: p, name, bytes: statSync(p).size, sha256: sha(p) };
});
assert.deepEqual(readdirSync(OUT).sort(), [...names].sort(), 'exactly 5 files, no MANIFEST yet: ' + readdirSync(OUT).join(','));

// quick C#5 sanity on the 4 .cs (no interpolation / no ?.)
for (const f of files.filter((x) => x.name.endsWith('.cs'))) {
  const text = readFileSync(f.path, 'utf8');
  assert.ok(!text.includes('$"'), 'no interpolation: ' + f.name);
  assert.ok(!/[\w\)]\?\.[\w]/.test(text), 'no ?. chain: ' + f.name);
}

// parent-completed MANIFEST.json (mechanical artifact; sources untouched)
const manifest = {
  at: new Date().toISOString(),
  missionId: 'team_mv6tmopg_0000_4urn3c',
  member: 'v3-host-source-r1',
  role: 'author',
  mode: 'PARENT_COMPLETED_DELIVERY_ARTIFACT_AUTHOR_PROVIDER_CAPACITY_FAILURE',
  authorSession: 'ses_eb5e4ad26ffemZg0CkXzfsY2jM (cursor/claude-opus-5-5 Claude Opus 5.5 Max)',
  files: files.map((f) => ({ path: f.path, bytes: f.bytes, sha256: f.sha256 })),
  totalBytes: files.reduce((n, f) => n + f.bytes, 0),
  authorFailureHistory: 'phase-3 writes succeeded 14:15-14:37Z (5 files); completion turn failed on cursor capacity_limit at 15:07Z after 3 attempts; failure reported by failure-wake maintenance to parent; NO source touched by parent; author self-report superseded by the parent-approved PLAN (integration map) + fresh review',
  publishedLimits: {
    coLocatedModel: 'S/G in-process per frozen ABI (GuardianSupervisorAcknowledgement.Matches ReferenceEquals GuardianCore.cs:409; guardian DESIGN G:150-157) — parent-arbitrated contract-conformant',
    multiProcessSG: 'out of tranche = NOT_PROVEN, published as model limit (not a defect)',
    case6LastClose: 'NOT_ESTABLISHED unchanged',
    case8Host: 'unqualified until 000c qualificationGO',
    durableLease: 'lease/reservation durable = memory objects; file/registry durability NOT_PROVEN',
    fixtureMarkers: 'reserved for closed-source writers, not proven',
    crossProcessLedgerUniqueness: 'local only, NOT_PROVEN'
  },
  stage: 'PARENT_COMPLETED_DELIVERY_FRESH_REVIEW_REQUIRED_NOT_ACCEPTANCE',
};
writeFileSync(OUT + '/MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n', { flag: 'w' });
for (const n of readdirSync(OUT)) chmodSync(OUT + '/' + n, 0o444);
for (const n of readdirSync(OUT)) assert.strictEqual(statSync(OUT + '/' + n).nlink, 1, 'nlink after freeze: ' + n);

const receipt = {
  at: new Date().toISOString(),
  owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
  kernelIntactnessRehashed: Object.keys(kernel).length,
  authorFiles: files.map((f) => ({ name: f.name, bytes: f.bytes, sha256: f.sha256 })),
  manifestAuthoredBy: 'parent (mechanical completion; author capacity-failed; sources untouched)',
  c5Sanity: 'no interpolation, no ?. in the 4 .cs files',
  exactlySixRegularFilesFrozenReadonly: true,
  stage: 'HOST_DELIVERY_PARENT_COMPLETED_INTAKE_PHYSICAL_ONLY_TARGETED_FRESH_REVIEW_REQUIRED_NOT_ACCEPTANCE',
};
writeFileSync(CO + '/host-source-parent-intake-20261017.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ files: 6, authorFiles: files.map((f) => f.name + ' ' + f.bytes + 'B'), kernelOk: true }));
