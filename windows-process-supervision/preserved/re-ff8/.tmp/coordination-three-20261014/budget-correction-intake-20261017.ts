import { readFileSync, readdirSync, lstatSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const OUT = CO + '/V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017';
const GEL = CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const expected = {
  'BudgetedEvidence.cs': [11846, '0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f', true],
  'BudgetedEvidence.Tests.cs': [32653, 'e24df7737199e7c567dc6ae82bf5a7050cd9a38a28988e386b7c36893b19bed4', true],
  'DESIGN.md': [11294, 'b54b561f0aa24e80df9102432772cc6837a5ef9f37b25aa87552a01e245198b6', true],
  'MANIFEST.json': [4661, '0fcb436d075f56b43a6b4223e8a095817206653a2f91fd397c64ef8952de0902', false],
};
const names = readdirSync(OUT).sort();
assert.deepEqual(names, Object.keys(expected).sort(), 'unexpected entries: ' + names.join(','));
for (const [name, [size, expect, freeze]] of Object.entries(expected)) {
  const p = OUT + '/' + name;
  const l = lstatSync(p);
  assert(l.isFile() && !l.isSymbolicLink() && statSync(p).nlink === 1, 'regular+nlink1: ' + name);
  const bytes = readFileSync(p);
  assert.strictEqual(bytes.length, size, 'size: ' + name);
  const h = createHash('sha256').update(bytes).digest('hex');
  assert.strictEqual(h, expect, 'sha: ' + name);
  if (freeze) chmodSync(p, 0o444);
}

// Structural claims: unchanged module (byte-identical to gel), tests lines 1-515 identical to gel, suffix identical
assert.strictEqual(sha(OUT + '/BudgetedEvidence.cs'), sha(GEL + '/BudgetedEvidence.cs'), 'module must be byte-identical');
assert.strictEqual(sha(OUT + '/DESIGN.md'), sha(GEL + '/DESIGN.md'), 'design must be byte-identical');
const newTests = readFileSync(OUT + '/BudgetedEvidence.Tests.cs', 'utf8').split('\n');
const oldTests = readFileSync(GEL + '/BudgetedEvidence.Tests.cs', 'utf8').split('\n');
let firstDiff = -1;
for (let i = 0; i < Math.min(oldTests.length, newTests.length); i++) {
  if (newTests[i] !== oldTests[i]) { firstDiff = i; break; }
}
assert.ok(firstDiff > 0, 'at least one diff expected');
assert.ok(firstDiff >= 500, 'first diff line (0-based) must be >= 500 per claim lines 1-515 identical: ' + (firstDiff + 1));
const suffixToken = 'class PartialThrowStream';
const oldSuffixStart = oldTests.findIndex((l) => l.includes(suffixToken));
const newSuffixStart = newTests.findIndex((l) => l.includes(suffixToken));
assert.ok(oldSuffixStart > 0 && newSuffixStart > 0, 'suffix anchor found in both');
const oldSuffix = oldTests.slice(oldSuffixStart).join('\n');
const newSuffix = newTests.slice(newSuffixStart).join('\n');
assert.strictEqual(newSuffix, oldSuffix, 'suffix from PartialThrowStream must be identical to gel');
const classLines = newTests.map((l, i) => ({ l, i })).filter((x) => /\bclass\s+\w+/.test(x.l));
const declBefore = classLines.filter((x) => x.i < firstDiff);
const declInDiff = classLines.filter((x) => x.i >= firstDiff && x.i < newSuffixStart);
assert.ok(declBefore.length > 0 && /class\s+ProbeStream/.test(declBefore[declBefore.length - 1].l), 'last class declaration before first diff must be ProbeStream: ' + (declBefore[declBefore.length - 1] || {}).l);
assert.strictEqual(declInDiff.length, 0, 'no class declarations inside the diff region');

// Module invariant: BudgetedEvidence.cs never references CanWrite
const moduleText = readFileSync(GEL + '/BudgetedEvidence.cs', 'utf8');
assert.ok(!moduleText.includes('CanWrite'), 'module must not read CanWrite');

const receipt = {
  at: new Date().toISOString(),
  owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
  author: 'v3-budget-runtime-correction-r1 ses_eb614ea7effeMhQxgmc33frHi4 (cursor/grok-4.7 Grok 4.7 Extra High)',
  files: Object.entries(expected).map(([name, [size, s, fr]]) => ({ name, bytes: size, sha256: s, frozenReadonly: fr, corrected: name === 'BudgetedEvidence.Tests.cs' || name === 'MANIFEST.json' })),
  parentVerifications: {
    moduleByteIdenticalToGel: true,
    designByteIdenticalToGel: true,
    testsPrefix1ToFirstDiffIdentical: true,
    testsSuffixFromPartialThrowStreamIdentical: true,
    firstDiffLine1Based: firstDiff + 1,
    lineCounts: { old: oldTests.length, new: newTests.length, deltaExplainedBy: 'ProbeStream gains Length/ToArray members (fixture-only region)' },
    moduleNeverReadsCanWrite: true,
    exactlyFourRegularFilesNoLinksFrozenReadonly: true,
  },
  rootCauseAuthorClaim: 'MemoryStream.Write/WriteByte -> EnsureWriteable -> callvirt CanWrite; probe threw unexpected-CanWrite inside legit Write; fixture-only correction (records bytes without MemoryStream delegation), invariants + assertions intact',
  sourcesNotCompiledNotExecutedNoNativeApi: true,
  stage: 'BUDGET_CORRECTION_PARENT_INTAKE_PHYSICAL_ONLY_TARGETED_FRESH_REVIEW_REQUIRED_NOT_ACCEPTANCE',
};
writeFileSync(CO + '/budget-correction-parent-intake-20261017.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage: receipt.stage, firstDiffLine1Based: firstDiff + 1, lines: { old: oldTests.length, new: newTests.length }, moduleCanWriteFree: true }));
