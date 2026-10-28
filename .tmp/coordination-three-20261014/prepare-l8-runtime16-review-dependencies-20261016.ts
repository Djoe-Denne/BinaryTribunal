import { readFileSync, writeFileSync, mkdirSync, existsSync, symlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l8-runtime16-review-schema2-preparation-request-20261016.json', 'utf8'));
const a = JSON.parse(readFileSync(phase + '/l8-runtime16-review-schema2-native-admission-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
for (const f of q.files) assert.equal(sha(readFileSync(q.destinationRoot + '/' + f.path)), f.sha256);
const receipt = readFileSync(q.destinationRoot + '/.preparation-receipt.json');
assert.equal(JSON.parse(receipt.toString('utf8')).fingerprint, '1625aaef1dde65589e5ee7f14bd536a85d71950e727baf28b7a19d05953544c4');
const dependencies = q.destinationRoot + '/tools/ff8-harness/node_modules'; assert(!existsSync(dependencies));
symlinkSync(root + '/tools/ff8-harness/node_modules', dependencies, 'junction');
const metadata = q.destinationRoot + '/.tmp/L8_PHASE_A_V2'; assert(!existsSync(metadata)); mkdirSync(metadata, { recursive: true });
const out = { at: new Date().toISOString(), session: a.session, task: a.task, destination: q.destinationRoot, proofDirectory: a.proofDirectory,
  pins465Exact: true, receiptFileBytes: receipt.length, receiptFileSha256: sha(receipt),
  dependencyJunctionOnlyNoInstallSourceOrPackageMutation: true, helperMetadataDirectoryEmptyNoRegistryOrFixtureCreated: true,
  stage: 'ACCESS_ONLY dependency setup not actual worker access or review/dynamic GO' };
writeFileSync(phase + '/l8-runtime16-review-dependencies-parent-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
