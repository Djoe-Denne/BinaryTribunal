import { readFileSync, writeFileSync, chmodSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const OUT = CO + '/V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017';
const RUNNER_SRC = 'C:/Users/djden/AppData/Local/Temp/opencode/V3MEM-9c1ae2d7b4/inputs/BudgetMemoryRunner.cs';
const FW = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const bs = (p) => p.replace(/\//g, '\\');

// ---- serial pin checks ----
const pins = {
  [OUT + '/BudgetedEvidence.cs']: ['0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f', 11846],
  [OUT + '/BudgetedEvidence.Tests.cs']: ['e24df7737199e7c567dc6ae82bf5a7050cd9a38a28988e386b7c36893b19bed4', 32653],
  [FW + '/csc.exe']: ['eca02e6b15cde93009a59a3d129d5a77fb5008f2e1cf62cf573b6737c747ecc3', null],
  [FW + '/mscorlib.dll']: ['94715f6991e2b9dc7481532c05aa99e74a5fff4ee147be541bca27f99e003fc7', null],
  [FW + '/System.dll']: ['09787b4f38f4f020c6b8a3894146085d4df7b8ae337577ed42d9acf1419660e8', null],
  [FW + '/System.Core.dll']: ['d1bafee1a4dd7e7bd9adf6859e7b1b654d1b4e0d031a38795e33ba040508c09d', null],
  [FW + '/System.Web.Extensions.dll']: ['6f2545e5ba378f6836ea0fed1067d089181e27dbd3c81e9db418c8bb32e6af51', null],
};
for (const [p, [expect, size]] of Object.entries(pins)) {
  const h = sha(p);
  assert.strictEqual(h, expect, 'pin: ' + p);
  if (size) assert.strictEqual(statSync(p).size, size, 'size: ' + p);
}
const runnerSha = sha(RUNNER_SRC);

// ---- new owned root ----
const combined = createHash('sha256').update(
  ['module:0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f', 'tests:e24df7737199e7c567dc6ae82bf5a7050cd9a38a28988e386b7c36893b19bed4', 'runner:' + runnerSha].join('\n'),
).digest('hex');
const ROOT = 'C:/Users/djden/AppData/Local/Temp/opencode/V3MEM2-' + combined.slice(0, 10);
mkdirSync(ROOT + '/out', { recursive: true });

const refs = [FW + '/mscorlib.dll', FW + '/System.dll', FW + '/System.Core.dll', FW + '/System.Web.Extensions.dll'];
const baseArgs = ['/noconfig', '/nologo', '/nostdlib+', '/platform:x64', '/debug-', '/optimize-', '/codepage:65001', '/langversion:5'];

// ---- compile 1: corrected budget library (module + corrected tests) ----
const libOut = bs(ROOT + '/out/BudgetedEvidenceTests.dll');
let r = spawnSync(FW + '\\csc.exe', [...baseArgs, '/target:library', '/out:' + libOut, ...refs.map((x) => '/r:' + bs(x)), bs(OUT + '/BudgetedEvidence.cs'), bs(OUT + '/BudgetedEvidence.Tests.cs')], { encoding: 'utf8' });
assert.strictEqual(r.status, 0, 'budget lib csc exit ' + r.status + ' STDOUT: ' + (r.stdout || '').slice(0, 2000));
const libDll = readFileSync(ROOT + '/out/BudgetedEvidenceTests.dll');
const libSha = createHash('sha256').update(libDll).digest('hex');

// ---- compile 2: memory runner against corrected library ----
const exe = bs(ROOT + '/out/BudgetMemoryRunner.exe');
r = spawnSync(FW + '\\csc.exe', [...baseArgs, '/target:exe', '/out:' + exe, ...refs.map((x) => '/r:' + bs(x)), '/r:' + libOut, bs(RUNNER_SRC)], { encoding: 'utf8' });
assert.strictEqual(r.status, 0, 'runner csc exit ' + r.status + ' STDOUT: ' + (r.stdout || '').slice(0, 2000));
const exeBytes = readFileSync(ROOT + '/out/BudgetMemoryRunner.exe');
const exeSha = createHash('sha256').update(exeBytes).digest('hex');

// ---- execution 002r' (pure memory, timeout, original process control) ----
const t0 = Date.now();
const run = spawnSync(bs(ROOT + '/out/BudgetMemoryRunner.exe'), [], { encoding: 'utf8', timeout: 60000, killSignal: 'SIGKILL' });
const dt = Date.now() - t0;
const capture = (run.stdout || '') + (run.stderr ? '\n[STDERR]\n' + run.stderr : '');
const captureSha = createHash('sha256').update(capture).digest('hex');
writeFileSync(ROOT + '/out/BudgetMemoryRun-capture-prime.txt', capture, { flag: 'w' });
const completed = capture.includes('RUNALL_COMPLETED');

const receipt = {
  at: new Date().toISOString(),
  task: "task_mvc6a24d_002r' memory re-execution after ACCEPTABLE targeted review of fixture-only correction",
  inputs: { module: 'BudgetedEvidence.cs 0944a3bb (unchanged byte-identical)', tests: 'BudgetedEvidence.Tests.cs e24df773 (corrected fixture, review verdict ACCEPTABLE_SOURCE_SCOPED)', runner: 'BudgetMemoryRunner.cs ' + runnerSha + ' (unchanged from first execution)' },
  compiles: { library: { bytes: libDll.length, sha256: libSha, warnings: (r.stdout || '').trim().length }, runner: { bytes: exeBytes.length, sha256: exeSha } },
  execution: { exitCode: run.status, durationMs: dt, timeoutFired: dt >= 59000, captureSha256: captureSha, tail: capture.split('\n').slice(-10) },
  runAllCompleted: completed,
  counting: completed ? 'RunAll completed: 20 top-level invocations / 17 distinct methods (RunAll body lines 13-32) claimable per 002r contract' : 'RunAll did NOT complete: no count claimable',
  oracleNotMaterialized: 'parent 12-case JSON not acquired (unchanged policy)',
  invariants: 'pure memory only; no Job API; no filesystem writes by runner; timeout/originalprocesscontrol by parent; DLLs+capture frozen readonly',
};
writeFileSync(ROOT + '/out/execution-receipt-prime.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'w' });
for (const n of readdirSync(ROOT + '/out')) chmodSync(ROOT + '/out/' + n, 0o444);
writeFileSync(CO + '/v3-budget-memory-reexecution-receipt-20261017.json', JSON.stringify({ ...receipt, root: ROOT }, null, 2) + '\n', { flag: 'w' });
console.log(JSON.stringify({ runAllCompleted: completed, exitCode: run.status, durationMs: dt, tail: capture.split('\n').slice(-9), libSha, exeSha }, null, 1));
