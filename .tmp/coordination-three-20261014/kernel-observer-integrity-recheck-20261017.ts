import { readFileSync, readdirSync, lstatSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const dir = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017';
const expected = {
  'KernelObserver.cs': [21557, 'a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284'],
  'KernelObserver.Tests.cs': [45179, '82a95a2fb76857cc3f70a78abc9b48168bbb849ba0666a981fa14cbdc06ab942'],
  'DESIGN.md': [17511, 'f0efc73e97f4b456addc37af9fd95a53bd4d98e8189b74a75447fd81cba37cc2'],
  'MANIFEST.json': [6572, '510ceca18085834b952864102818ee96ad212d9c0df4faabde648e7c75f7e11c'],
};
const names = readdirSync(dir).sort();
assert.deepEqual(names, Object.keys(expected).sort(), 'unexpected entries in observer output');
const hashes = Object.keys(expected).sort().map((name) => {
  const path = dir + '/' + name;
  const l = lstatSync(path);
  assert(l.isFile() && !l.isSymbolicLink(), name + ': not regular');
  const [size, sha] = expected[name];
  const bytes = readFileSync(path);
  const h = createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, size, name + ': size');
  assert.equal(h, sha, name + ': sha256');
  assert.strictEqual(statSync(path).nlink, 1, name + ': nlink');
  return name + ' ' + sha.slice(0, 8) + ' OK';
});
const out = { at: new Date().toISOString(), verifiedBy: 'parent lead', result: 'KERNEL_OBSERVER_ALL_4_FILES_BYTE_IDENTICAL_TO_INTAKE_PINS', files: hashes };
const write = await import('node:fs');
write.writeFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/kernel-observer-integrity-recheck-20261017.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ result: out.result }));
