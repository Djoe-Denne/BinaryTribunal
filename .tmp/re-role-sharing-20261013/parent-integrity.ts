import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = join(root, '.tmp/re-role-sharing-20261013');
const harness = join(root, 'tools/ff8-harness');
const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const recordPath = join(phase, 'integrity-before.json');
if (process.argv[2] === 'baseline') {
  if (existsSync(recordPath)) throw new Error('Do not replace the phase baseline');
  const review = JSON.parse(readFileSync(join(harness, 'evidence/native-canary-20261013-attempt16-review.json'), 'utf8'));
  const globals = review.globalProtectedFiles.map((f: {path: string; sha256: string}) => ({ path: f.path, sha256: sha(f.path), matchesCanary: sha(f.path) === f.sha256 }));
  const paths = readdirSync(join(harness, 'evidence')).filter(p => p.endsWith('.json')).map(p => join(harness, 'evidence', p));
  paths.push(join(harness, 'scripts/native-canary.ts'), join(harness, 'scripts/canary-output-policy.ts'));
  const immutable = paths.sort().map(path => ({ path, sha256: sha(path) }));
  const value = { schemaVersion: 1, at: new Date().toISOString(), globals, immutable };
  writeFileSync(recordPath, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ globalCount: globals.length, globalMatchCanary: globals.every((f: {matchesCanary: boolean}) => f.matchesCanary), immutableCount: immutable.length }));
} else if (process.argv[2] === 'verify') {
  const before = JSON.parse(readFileSync(recordPath, 'utf8'));
  const entries = [...before.globals, ...before.immutable];
  const changed = entries.filter(f => !existsSync(f.path) || sha(f.path) !== f.sha256).map(f => f.path);
  console.log(JSON.stringify({ checked: entries.length, unchanged: changed.length === 0, changed }));
  if (changed.length) process.exitCode = 1;
} else throw new Error('Expected baseline or verify');
