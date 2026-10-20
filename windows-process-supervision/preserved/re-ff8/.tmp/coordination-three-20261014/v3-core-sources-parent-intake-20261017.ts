import { readFileSync, readdirSync, lstatSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const phase = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const expected: Record<string, { task: string; session: string; files: Record<string, [number, string]> }> = {
  V3_GUARDIAN_CORE_R1_OUTPUT_20261017: {
    task: 'task_mvc42woi_0006_kj3b51', session: 'ses_eb6ebae2affeli3UWs0CsMor2m',
    files: {
      'GuardianCore.cs': [71132, '7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f'],
      'GuardianCore.Tests.cs': [31485, '529a5d8f5f0379cdc392f5754469f331c05c025b24215ce6efa72276363b0a89'],
      'DESIGN.md': [18609, '1d5579526cc1b27eb7114703288441691855fd8b0c91edcf7a699700ee5fe8a4'],
      'MANIFEST.json': [6903, 'dcfb2c69f4d7682d4397209c6e6e1882b5eb8ae14114cc30e50092a8093d0fc7'],
    },
  },
  V3_KERNEL_OBSERVER_R1_OUTPUT_20261017: {
    task: 'task_mvc42woi_0007_28drf0', session: 'ses_eb6eb1dc5ffeFBZOGgB5yVJ5ES',
    files: {
      'KernelObserver.cs': [21557, 'a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284'],
      'KernelObserver.Tests.cs': [45179, '82a95a2fb76857cc3f70a78abc9b48168bbb849ba0666a981fa14cbdc06ab942'],
      'DESIGN.md': [17511, 'f0efc73e97f4b456addc37af9fd95a53bd4d98e8189b74a75447fd81cba37cc2'],
      'MANIFEST.json': [6572, '510ceca18085834b952864102818ee96ad212d9c0df4faabde648e7c75f7e11c'],
    },
  },
};
const deliveries: any[] = [];
for (const [directory, spec] of Object.entries(expected)) {
  const root = `${phase}/${directory}`;
  const names = readdirSync(root).sort();
  assert.deepEqual(names, Object.keys(spec.files).sort(), `${directory}: unexpected entries`);
  const files = names.map((name) => {
    const path = `${root}/${name}`, link = lstatSync(path);
    assert(link.isFile() && !link.isSymbolicLink(), `${name}: not a regular file`);
    const bytes = readFileSync(path), [size, sha] = spec.files[name]!;
    assert.equal(bytes.length, size, `${name}: size`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sha, `${name}: sha256`);
    chmodSync(path, 0o444);
    const after = statSync(path);
    assert.equal(after.mode & 0o222, 0, `${name}: still writable`);
    assert.equal(after.nlink, 1, `${name}: nlink`);
    return { name, bytes: size, sha256: sha };
  });
  deliveries.push({ directory, task: spec.task, session: spec.session, files });
}
const receipt = {
  at: new Date().toISOString(),
  owner: 'parent lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (cursor/claude-opus-5-5 Claude Opus 5.5 Max)',
  deliveries,
  workerReportedPinsMatchPhysicalBytesExactly: true,
  exactlyFourRegularFilesEachNoLinksNlink1FrozenReadonly: true,
  sourcesNotReadForCorrectnessNotCompiledNotExecutedNoNativeApi: true,
  stage: 'V3_CORE_SOURCES_PARENT_INTAKE_PHYSICAL_ONLY_FRESH_COMPOSED_REVIEW_REQUIRED_NOT_ACCEPTANCE',
};
writeFileSync(`${phase}/v3-core-sources-parent-intake-20261017.json`, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: receipt.at, stage: receipt.stage, files: deliveries.reduce((n, d) => n + d.files.length, 0) }));
