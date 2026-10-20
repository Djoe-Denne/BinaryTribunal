import { readFileSync, readdirSync, lstatSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const dir = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/V3_G_CORRECTIONS_R1_OUTPUT_20261017';
const expected = {
  'GuardianCore.Tests.cs': [38487, 'aefc941e19765c108acd7e573ebb1664f67dc5a57978bdd607b0cda2a8ce86fa'],
  'DESIGN.md': [19089, 'cd2827d92748ed0829b03d9e476e2d525cafa966d87976200695fa8439a12709'],
  'MANIFEST.json': [4193, 'd817b77056f9ab0d44d7a1a74fa50f792c78b80b5ee1b7006fa982e03a864a18'],
};
const names = readdirSync(dir).sort();
assert.deepEqual(names, Object.keys(expected).sort(), 'unexpected entries');
const files = Object.keys(expected).sort().map((name) => {
  const path = dir + '/' + name;
  const l = lstatSync(path);
  assert(l.isFile() && !l.isSymbolicLink(), name + ': not regular');
  const bytes = readFileSync(path);
  const [size, sha] = expected[name];
  assert.equal(bytes.length, size, name + ': size');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), sha, name + ': sha256');
  // C2: tautology must be gone
  if (name === 'GuardianCore.Tests.cs') {
    const text = bytes.toString('utf8');
    assert.ok(!text.includes('96 * 192 == 18432 && 18432 < 24576'), 'tautology still present');
    assert.ok(text.includes('GuardianEvidenceCapacityBytes') && text.includes('GuardianResultCapacityBytes'), 'C2 const bindings missing');
  }
  chmodSync(path, 0o444);
  assert.equal(statSync(path).nlink, 1, name + ': nlink');
  return { name, bytes: size, sha256: sha };
});
const receipt = {
  at: new Date().toISOString(),
  owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
  author: 'v3-g-corrections-r1 ses_eb65d2f1fffef6f6lFY3ag98gn (cursor/grok-4.7 Grok 4.7 Extra High)',
  files,
  pinsMatchWorkerReportExactly: true,
  c2TautologyRemovedAndConstBindingsPresent: true,
  exactlyThreeRegularFilesNoLinksFrozenReadonly: true,
  frozenSourcesReverifiedUnchangedByAuthor: 'GuardianCore.cs 7d4d2c66 / ABI1 bb4758cc / BudgetedEvidence.cs 0944a3bb / draft2 bb69e0ad / originals intact',
  sourcesNotCompiledNotExecutedNoNativeApi: true,
  stage: 'G_CORRECTIONS_PARENT_INTAKE_PHYSICAL_ONLY_TARGETED_FRESH_REVIEW_REQUIRED_NOT_ACCEPTANCE',
};
writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/g-corrections-parent-intake-20261017.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ files: files.length, stage: receipt.stage, c2: receipt.c2TautologyRemovedAndConstBindingsPresent }));
