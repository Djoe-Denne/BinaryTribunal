import { readFileSync, readdirSync, lstatSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const OUT = CO + '/V3_HOST_CORRECTION_OUTPUT_20261017';
const SRC = CO + '/V3_HOST_SOURCE_OUTPUT_20261017';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const expected = {
  'WriterLedger.cs': [8889, '67e9b21c1f8ec6212fa3d21199254359770e5e0b4b56c7268567af55eb0323b0'],
  'DESIGN.md': [13866, 'b61274fde7739c8f12b49308b96d6931d51130d350c49c3989a68d8983176b5c'],
  'Host.Tests.cs': [29049, 'c5770e353e8c60fa22ac753ebcc37e3cd66c9ef8c94bc4c1e64b69d88eea1716'],
  'MANIFEST.json': [7228, '1b9a15be86557241955bff222babddecef82372f49824452f5f89d65ce89a4c2'],
};
const names = readdirSync(OUT).sort();
assert.deepEqual(names, Object.keys(expected).sort(), 'unexpected entries: ' + names.join(','));
for (const [name, [size, expect]] of Object.entries(expected)) {
  const p = OUT + '/' + name;
  const l = lstatSync(p);
  assert(l.isFile() && !l.isSymbolicLink() && statSync(p).nlink === 1, 'regular+nlink1: ' + name);
  const bytes = readFileSync(p);
  assert.strictEqual(bytes.length, size, 'size: ' + name);
  assert.strictEqual(createHash('sha256').update(bytes).digest('hex'), expect, 'sha: ' + name);
  chmodSync(p, 0o444);
}

// intake sources untouched (author claim: re-hash perfect)
const untouched = {
  'HostLauncher.cs': '1cc9cca0f0d2516f40c42f6d2b421126aa7b05bef29bcbfcd3e5760c1d956a15',
  'CaptureWiring.cs': 'd08beba3b371661a1c7a12d4ddda697514556bdc2f91dc16028b0fa20cc2987f',
  'GuardianCore.cs': '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f',
  'GuardV3.Contracts.cs': 'bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709',
  'BudgetedEvidence.cs': '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f',
  'KernelObserver.cs': 'a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284',
};
const intact = {};
for (const [name, expect] of Object.entries(untouched)) {
  const p = name === 'GuardianCore.cs' ? CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/' + name
    : name === 'GuardV3.Contracts.cs' ? CO + '/V3_CORE_ABI1_20261017/' + name
    : name === 'BudgetedEvidence.cs' ? CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/' + name
    : name === 'KernelObserver.cs' ? CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/' + name
    : SRC + '/' + name;
  const h = sha(p);
  assert.strictEqual(h, expect, 'intactness: ' + name);
  intact[name] = true;
}
// Host.Tests byte-identical to intake pin
assert.strictEqual(sha(OUT + '/Host.Tests.cs'), 'c5770e353e8c60fa22ac753ebcc37e3cd66c9ef8c94bc4c1e64b69d88eea1716', 'tests re-pin identical');

const receipt = {
  at: new Date().toISOString(),
  owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
  author: 'v3-host-correction-r1 ses_eb52dc4e6ffevB6tgCHf3P3ymI (opencode-go/glm-5.3-flash max)',
  files: Object.entries(expected).map(([name, [size, h]]) => ({ name, bytes: size, sha256: h, frozenReadonly: true })),
  intakeSourcesUntouchedRehashed: Object.keys(intact),
  hostTestsByteIdenticalToPin: true, // no test changes needed (tests exercise TryReadBack transitively via HostLauncher:234)
  sourcesNotCompiledNotExecutedNoNativeApi: true,
  stage: 'HOST_CORRECTION_DELTA_PARENT_INTAKE_PHYSICAL_ONLY_FRESH_DELTA_REVIEW_REQUIRED_NOT_ACCEPTANCE',
};
writeFileSync(CO + '/host-correction-parent-intake-20261017.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ files: Object.keys(expected).length, intakeUntouched: Object.keys(intact).length, stage: receipt.stage }));
