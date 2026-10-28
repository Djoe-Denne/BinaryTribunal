import { readFileSync, readdirSync, lstatSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const OUT = CO + '/V3_L7_MEASURES_DRIVER_OUTPUT_20261017';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// ---- intake pins ----
const expected = {
  'measures-driver.ts': [45856, '04e3122d4414c8e8d408c6612810c6a2ef86358630467abb1a9de98f239b3d28'],
  'MANIFEST.json': [7932, null],
};
assert.deepEqual(readdirSync(OUT).sort(), Object.keys(expected).sort(), 'exactly 2 files');
for (const [name, [size, expect]] of Object.entries(expected)) {
  const p = OUT + '/' + name;
  const l = lstatSync(p);
  assert(l.isFile() && !l.isSymbolicLink() && statSync(p).nlink === 1, 'regular+nlink1: ' + name);
  const bytes = readFileSync(p);
  assert.strictEqual(bytes.length, size, 'size: ' + name);
  const h = createHash('sha256').update(bytes).digest('hex');
  if (expect) assert.strictEqual(h, expect, 'sha: ' + name);
}

// ---- parent spot-checks before run GO ----
const driverAll = readFileSync(OUT + '/measures-driver.ts', 'utf8');
const driver = driverAll
  .split('\n')
  .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('/*') && !l.trim().startsWith('*'))
  .join('\n')
  .replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""'); // strip string literals: DTO declarations are data, not code
assert.ok(!driver.includes('allowLarge: true') && !driver.includes('allowLarge:true'), 'never allowLarge');
assert.ok(!driver.includes("require(") && !driver.includes("node:"), 'no node imports in CODE');
assert.ok(!driver.includes('fetch(') && !driver.includes('http'), 'no network');
assert.ok(!driver.includes('writeFileSync') && !driver.includes('fs.'), 'no fs writes');
assert.ok(/SIZES[^=\n]*=\s*\[\s*1000\s*,\s*10000\s*\]/.test(driver), 'SIZES constant bounded');
assert.ok(driverAll.includes('2890') && driverAll.includes('28915'), 'anchors cross-check present in source');

// ---- freeze, then run GO (parent) ----
chmodSync(OUT + '/measures-driver.ts', 0o444);
chmodSync(OUT + '/MANIFEST.json', 0o444);
const t0 = Date.now();
const run = spawnSync('C:/Users/djden/.bun/bin/bun.exe', [OUT + '/measures-driver.ts'], { encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' });
const dt = Date.now() - t0;
const capture = (run.stdout || '') + (run.stderr ? '\n[STDERR]\n' + run.stderr : '');
assert.strictEqual(run.status, 0, 'driver exit ' + run.status + ': ' + capture.slice(0, 1500));
const jsonLine = (run.stdout || '').split('\n').filter((l) => l.trim().startsWith('{')).pop();
assert.ok(jsonLine, 'DTO single-line JSON present');
const dto = JSON.parse(jsonLine);
assert.strictEqual(dto.schemaVersion, 'l7-measures-driver-dto/v1', 'DTO schema');
assert.strictEqual(dto.budget?.withinBudget, true, 'budget honest');
assert.strictEqual(dto.invariants?.size100000Excluded, true, '100k excluded');
assert.strictEqual(dto.invariants?.network, 'none', 'no network');
assert.strictEqual(dto.invariants?.nativeGainClaims, false, 'no native gain claims');
assert.strictEqual(dto.invariants?.boundsAreNeverObservations, true, 'bounds role explicit');
writeFileSync(OUT + '/run-capture.txt', capture, { flag: 'w' });
const receipt = {
  at: new Date().toISOString(),
  owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
  runGate: 'PARENT RUN GO per standing autonomy: bench source ACCEPTABLE + driver reviewed/pinned + pure-TS bun, no native, bounded 1k/10k, 100k excluded',
  driverPin: OUT + '/measures-driver.ts ' + sha(OUT + '/measures-driver.ts'),
  execution: { exitCode: run.status, durationMs: dt, withinBudget: dto.budget?.withinBudget ?? null, captureSha256: createHash('sha256').update(capture).digest('hex') },
  note: 'run 1 also completed exit 0 but its capture was lost to a parent-script field-name assertion bug (deterministic driver, identical seeds) — this receipt records run 2',
  dtoVerified: { schemaVersion: dto.schemaVersion, budgetWithinBudget: true, size100000Excluded: true, networkNone: true, nativeGainClaimsFalse: true, boundsNeverObservations: true, anchorsCrossCheck: 'assert fail-loud family D — exit 0 implies all assertions incl. anchors passed' },
  nativeGainClaims: false,
  stage: 'L7_MEASURES_EXECUTED_PARENT_RUN_NOT_PRODUCT_NOT_NATIVE_NOT_GLOBAL',
};
writeFileSync(CO + '/l7-measures-run-receipt-20261017.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ exitCode: run.status, durationMs: dt, withinBudget: dto.budget?.withinBudget ?? null, dtoKeys: Object.keys(dto).slice(0, 12) }));
