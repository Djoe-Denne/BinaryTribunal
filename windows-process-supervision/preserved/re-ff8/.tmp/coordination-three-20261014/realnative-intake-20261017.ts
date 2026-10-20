import { readFileSync, readdirSync, lstatSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const OUT = CO + '/V3_REALNATIVE_OUTPUT_20261017';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const expected = {
  'RealNative.cs': [15934, 'e58eef0c8086240e2e8296415cf6ff7e3cbce253aba1d0e4bf425728e1e26e14'],
  'RunnerReal.cs': [20530, '8e8bb62304267ad63856956dae6bddfb1e440638ea70d8a287fd2d89484fc5f3'],
  'DESIGN.md': [13435, '0cf2057a94b7f08434bc791ae837ba0d92a75d55b9b7da9faa1d3557ad8bfd1f'],
  'MANIFEST.json': [4065, '06a1b8bf07180b8309916bb5cdf3f5562d80eab9310e86bab51b1629eed067b4'],
};
assert.deepEqual(readdirSync(OUT).sort(), Object.keys(expected).sort(), 'exactly 4 files');
for (const [name, [size, expect]] of Object.entries(expected)) {
  const p = OUT + '/' + name;
  const l = lstatSync(p);
  assert(l.isFile() && !l.isSymbolicLink() && statSync(p).nlink === 1, 'regular+nlink1: ' + name);
  const bytes = readFileSync(p);
  assert.strictEqual(bytes.length, size, 'size: ' + name);
  assert.strictEqual(createHash('sha256').update(bytes).digest('hex'), expect, 'sha: ' + name);
  chmodSync(p, 0o444);
}
// frozen core intactness re-hash (author claim + parent duty)
const kernel = {
  [CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs']: 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709',
  [CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs']: '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f',
  [CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs']: 'a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284',
  [CO + '/V3_HOST_SOURCE_OUTPUT_20261017/HostLauncher.cs']: '1cc9cca0f0d2516f40c42f6d2b421126aa7b05bef29bcbfcd3e5760c1d956a15',
  [CO + '/V3_HOST_CORRECTION_OUTPUT_20261017/WriterLedger.cs']: '67e9b21c1f8ec6212fa3d21199254359770e5e0b4b56c7268567af55eb0323b0',
  [CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs']: '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f',
};
for (const [p, expect] of Object.entries(kernel)) assert.strictEqual(sha(p), expect, 'kernel pin: ' + p);

const receipt = {
  at: new Date().toISOString(),
  owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
  author: 'v3-realnative-r1 ses_eb4fad214ffe64lZcjK8chA7uJ (cursor/grok-4.7 Grok 4.7 Extra High)',
  files: Object.entries(expected).map(([name, [size, h]]) => ({ name, bytes: size, sha256: h, frozenReadonly: true })),
  frozenCoreRehashedIntact: Object.keys(kernel).length,
  compiledNeverExecutedNever: true,
  stage: 'REALNATIVE_DELIVERY_PARENT_INTAKE_PHYSICAL_ONLY_FRESH_REVIEW_REQUIRED_NOT_ACCEPTANCE',
};
writeFileSync(CO + '/realnative-parent-intake-20261017.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ files: 4, kernelIntact: Object.keys(kernel).length, stage: receipt.stage }));
