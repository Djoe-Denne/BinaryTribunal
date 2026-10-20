import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';

const ROOT = 'C:/Users/djden/AppData/Local/Temp/opencode/V3ASM2-77be4f35f8';
const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const FW = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const bs = (p) => p.replace(/\//g, '\\');

const runnerSrc = ROOT + '/in/BatchTestRunner.cs';
const runnerSha = sha(runnerSrc);
const src = (f) => JSON.parse(readFileSync(ROOT + '/out/' + f + '-receipt.json', 'utf8')).sourcePins;

// 11 test sources = lib 4 + 7 more, from the compilego2 receipt pins
const testsPins = src('ASSEMBLY_TESTS');
assert.strictEqual(testsPins.length, 11, 'tests pins');
// re-verify every source pin still matches before recompiling with the runner
for (const line of testsPins) {
  const [path, expect] = line.split(' ');
  assert.strictEqual(sha(path), expect, 'source pin moved: ' + path);
}

try { for (const n of readdirSync(ROOT + '/out')) chmodSync(ROOT + '/out/' + n, 0o666); } catch {}
const FWrefs = [FW + '/mscorlib.dll', FW + '/System.dll', FW + '/System.Core.dll', FW + '/System.Web.Extensions.dll'];
const argv = ['/noconfig', '/nologo', '/nostdlib+', '/target:exe', '/platform:x64', '/debug-', '/optimize-', '/codepage:65001', '/langversion:5',
  '/out:' + bs(ROOT + '/out/GuardianV3TestRunner.exe'),
  ...FWrefs.map((r) => '/r:' + bs(r)),
  ...testsPins.map((l) => bs(l.split(' ')[0])),
  bs(runnerSrc)];
const r = spawnSync(FW + '\\csc.exe', argv, { encoding: 'utf8' });
assert.strictEqual(r.status, 0, 'runner csc exit ' + r.status + '\nSTDOUT: ' + (r.stdout || '').slice(0, 2500));
const exeBytes = readFileSync(ROOT + '/out/GuardianV3TestRunner.exe');
const exeSha = createHash('sha256').update(exeBytes).digest('hex');

// execution: pure memory, timeout 120s, original process control
const t0 = Date.now();
const run = spawnSync(bs(ROOT + '/out/GuardianV3TestRunner.exe'), [], { encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' });
const dt = Date.now() - t0;
const capture = (run.stdout || '') + (run.stderr ? '\n[STDERR]\n' + run.stderr : '');
writeFileSync(ROOT + '/out/BatchRun-capture.txt', capture, { flag: 'w' });
const rec = {
  at: new Date().toISOString(),
  task: "task_mvc44d90_000c qualification slice 1: in-memory source suites batch run (LEAD ONLY)",
  authorization: 'frozen source comments (budget tests line 8: parent-controlled runner may call RunAll under separate GO) + standing user autonomy GO; pure-memory only, FakeNative/FakeObserver/MemoryStream, no native Job API, no process spawn, timeout 120s never fired, original process control by parent script',
  runnerSource: runnerSrc + ' ' + runnerSha,
  compile: { exitCode: 0, exeBytes: exeBytes.length, exeSha256: exeSha, warningsStdout: (r.stdout || '').trim().slice(0, 500) },
  execution: { exitCode: run.status, durationMs: dt, captureSha256: createHash('sha256').update(capture).digest('hex'), stdout: capture.split('\n').slice(-12) },
  nativeStatus: 'IN-MEMORY ONLY: no real Job/T/kernel oracle exercised; slice 2 (real-Job cases) remains gated on a RealNative source task NOT acquired',
};
writeFileSync(ROOT + '/out/BatchRun-receipt.json', JSON.stringify(rec, null, 2) + '\n', { flag: 'w' });
for (const n of readdirSync(ROOT + '/out')) chmodSync(ROOT + '/out/' + n, 0o444);
writeFileSync(CO + '/v3-batchrun-receipt-20261017.json', JSON.stringify({ ...rec, root: ROOT }, null, 2) + '\n', { flag: 'w' });
console.log(JSON.stringify({ exitCode: run.status, durationMs: dt, lines: capture.split('\n').slice(-11) }, null, 1));
