// Offline artifact generation only. No candidate imports, network, DB or runtime.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const out = 'docs/missions/rms-plugin-recovery-20261030';
const base = '9c1b6aaf5288445c06d82978b122091111c2bc8f';
const candidate = '340386a9926f8afafc6dab6fe08f9a237afb2c75';
const temp = process.argv[2];
const worker = process.argv[3];
if (!temp || !worker || process.argv.length !== 4) throw Error('Explicit candidate and historical worker paths required');
function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 8e6, timeout: 30000 });
  if (r.status !== 0 || r.error) throw Error('Git read failed: ' + args[0]);
  return r.stdout;
}
if (git(root, ['branch', '--show-current']).trim() !== 'main' || git(root, ['rev-parse', 'HEAD']).trim() !== base) throw Error('Unexpected main');
if (git(temp, ['rev-parse', 'HEAD']).trim() !== candidate) throw Error('Unexpected candidate');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = p => fs.readFileSync(path.join(root, p));
const put = (p, b) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), b); };
const secret = /(?:\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}|Bearer\s+[A-Za-z0-9._~-]{24,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{15,}|(?:access_token|refresh_token|id_token|client_secret)\s*["']?\s*[:=]\s*["'][A-Za-z0-9._~-]{16,})/;
function check(b, p) { if (secret.test(b.toString('utf8'))) throw Error('Credential-pattern hold at path: ' + p); }
const changed = git(temp, ['diff', '--name-only']).trim().split('\n').filter(Boolean).sort();
const expected = ['src/client.ts', 'src/graph-runtime-binding.ts', 'src/graph-store.ts', 'src/native-runtime-transport.ts', 'test/client.test.ts', 'test/runtime-binding.test.ts'].map(p => 'tools/ff8-harness/' + p).sort();
if (JSON.stringify(changed) !== JSON.stringify(expected)) throw Error('Unexpected candidate file set');
const finalPins = {
  'src/client.ts': '7266a3affea1caa06b481b721e0c8ac1209166d997673652b6a93a4fffd5ae71',
  'src/native-runtime-transport.ts': '79dd1ef42162a3780eee9926167cc509f3dee96a4becda4c495f048880ac6f39',
  'src/graph-runtime-binding.ts': 'cbe0c5a9f56dde4ffe35eaa5d7290c5f24098ff64e7d6df7d70f6d6f520ea67e',
  'src/graph-store.ts': '8969c150273f3ec1b87fe66153c2fd48c5a825d32278e2e9c7d9dd3f523fb146',
  'test/client.test.ts': 'c64568d2e8e309b36ad4036a545353dc58e27d76c884ad2dd9b13ffcdbc761fd',
  'test/runtime-binding.test.ts': '3137556b476897ad421697b994a97aa53ef614515a89530958f30c4d3d6eb41c',
};
const artifacts = [];
// Preserve only the historical worker's known public input/candidate directories.
// Do not inspect its unrelated profile changes or any native database.
function copyWorker(dir) {
  for (const e of fs.readdirSync(path.join(worker,dir), {withFileTypes:true})) {
    const p=dir+'/'+e.name;
    if(e.isSymbolicLink())throw Error('Unexpected worker symlink');
    if(e.isDirectory())copyWorker(p);
    else {
      if(!/\.(?:md|mjs|ts|json|jsonl)$/.test(p))throw Error('Unexpected worker input format');
      const b=fs.readFileSync(path.join(worker,p));check(b,p);
      const dest=`${out}/archive/worker-uncommitted/${p}`;
      put(dest,b);artifacts.push({path:dest,bytes:b.length,sha256:sha(b),source:p,provenance:'historical worker uncommitted public inputs; no authority transferred'});
    }
  }
}
for(const p of [`${mission}/native-plan-inputs`,`${mission}/preparation-candidates`,'.tmp/L8_PHASE_A_V2'])copyWorker(p);
for (const [name, args, cwd] of [
  ['main-to-candidate340.patch', ['diff', '--binary', '--no-ext-diff', base, candidate], root],
  ['candidate340-to-final198.patch', ['diff', '--binary', '--no-ext-diff'], temp],
]) {
  const b = Buffer.from(git(cwd, args)); check(b, name); const p = `${out}/archive/${name}`; put(p, b); artifacts.push({ path: p, bytes: b.length, sha256: sha(b) });
}
for (const p of expected) {
  const rel = p.slice('tools/ff8-harness/'.length), b = fs.readFileSync(path.join(temp, p));
  if (sha(b) !== finalPins[rel]) throw Error('Final pin mismatch: ' + rel);
  check(b, p); const dest = `${out}/archive/final198/${rel}`; put(dest, b); artifacts.push({ path: dest, bytes: b.length, sha256: sha(b), source: p });
}
const preserved = [], excluded = [];
function walk(dir) {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isSymbolicLink()) { excluded.push({ path: p, reason: 'symlink not followed' }); continue; }
    if (e.isDirectory()) {
      if (/^(?:node_modules|\.git|\.cache|cache|bun-cache)$/.test(e.name) || /^auth-private-/.test(e.name)) excluded.push({ path: p, reason: 'private or dependency/cache directory, not read' });
      else walk(p);
    } else if (/\.(?:md|mjs|ps1|py|json|jsonl|ts|txt|log|bin)$/.test(p)) {
      const b = read(p); if (!p.endsWith('.bin')) check(b, p);
      preserved.push({ path: p, bytes: b.length, sha256: sha(b) });
    } else excluded.push({ path: p, reason: /\.sqlite(?:-wal|-shm)?$/.test(p) ? 'native database, not read or copied' : 'runtime/cache or non-source format, not read' });
  }
}
walk(mission);
const manifest = { schema: 1, status: 'PARTIAL_NOT_ACCEPTED', generatedAt: new Date().toISOString(), base, candidate, strategy: 'inactive reconstructible archive, no product activation', artifacts, preserved, excluded, credentialScan: 'bounded patterns, no claim of universal secret detection; private stores excluded structurally' };
put(`${out}/preservation-manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ artifacts: artifacts.length, preserved: preserved.length, excluded: excluded.length, bytes: preserved.reduce((s, p) => s + p.bytes, 0), finalPins: '6/6 match', noDatabaseRead: true }));
