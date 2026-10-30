// Parent-only deterministic DATA emitter. Never imports or executes generated code.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e/native-preparation-136';
const path = join(root, 'constructed-x86-32.bin');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.length !== 2 || existsSync(path)) throw new Error('Refuse arguments, existing target or automatic retry');
const decisionBytes = readFileSync(join(root, 'source-decision-v3.json'));
if (sha(decisionBytes) !== '1796363315de98e1866a4648441ccb99da1acfee2dbae66db75d8248a0234950')
  throw new Error('Parent construction decision bytes changed');
const d = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decisionBytes));
if (d.fixture !== true || d.nativeAuthority.status !== 'HOLD' || d.construction.targetArchitecture !== 'x86-32')
  throw new Error('Source fixture construction not authorized by pinned parent scope');
const bytes = Buffer.concat([Buffer.alloc(256, 0), Buffer.from('b800000000c3', 'hex')]);
if (bytes.length !== d.construction.rawByteLength || sha(bytes) !== d.construction.rawSha256)
  throw new Error('Constructed raw bytes differ from parent recipe');
writeFileSync(path, bytes, { flag: 'wx' });
const actual = readFileSync(path);
if (!actual.equals(bytes)) throw new Error('Exact raw readback failed; preserve artifact, do not retry');
console.log(JSON.stringify({ status: 'CONSTRUCTED_FIXTURE_BYTES_ONLY_NATIVE_HOLD', path,
  byteLength: actual.length, sha256: sha(actual), targetMode: 'x86-32 by explicit construction',
  generatedCodeExecuted: false, nativeActions: 0 }));
