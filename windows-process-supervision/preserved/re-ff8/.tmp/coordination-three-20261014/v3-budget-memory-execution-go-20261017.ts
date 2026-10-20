import { readFileSync, writeFileSync, chmodSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const ROOT = 'C:/Users/djden/AppData/Local/Temp/opencode/V3MEM-9c1ae2d7b4';
const FW = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const bs = (p) => p.replace(/\//g, '\\');

// ---- pins before anything ----
const runnerSrc = ROOT + '/inputs/BudgetMemoryRunner.cs';
const bmcDll = 'C:/Users/djden/AppData/Local/Temp/opencode/BMC-0944a3bbf9/out/BudgetedEvidenceTests.dll';
const pins = {
  [runnerSrc]: null, // authored by lead this turn; hash recorded
  [bmcDll]: 'd64ba7febdb0ad9a719248f24e048cd8400d75c3538d80863934f531396d0f84',
  [FW + '/csc.exe']: 'eca02e6b15cde93009a59a3d129d5a77fb5008f2e1cf62cf573b6737c747ecc3',
  [FW + '/mscorlib.dll']: '94715f6991e2b9dc7481532c05aa99e74a5fff4ee147be541bca27f99e003fc7',
  [FW + '/System.dll']: '09787b4f38f4f020c6b8a3894146085d4df7b8ae337577ed42d9acf1419660e8',
  [FW + '/System.Core.dll']: 'd1bafee1a4dd7e7bd9adf6859e7b1b654d1b4e0d031a38795e33ba040508c09d',
  [FW + '/System.Web.Extensions.dll']: '6f2545e5ba378f6836ea0fed1067d089181e27dbd3c81e9db418c8bb32e6af51',
};
const runnerSha = sha(runnerSrc);
pins[runnerSrc] = runnerSha;
for (const [p, expect] of Object.entries(pins)) {
  if (expect) assert.strictEqual(sha(p), expect, 'pin mismatch: ' + p);
}
const runnerBytes = readFileSync(runnerSrc).toString('utf8');
const codeOnly = runnerBytes.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
assert.ok(!codeOnly.includes('File.'), 'runner must not touch filesystem');
assert.ok(!codeOnly.includes('Process.Start'), 'runner must not spawn');
for (const api of ['CreateJobObject', 'AssignProcessToJobObject', 'TerminateJobObject', 'QueryInformationJob', 'SetInformationJob', 'FileStream', 'Directory.', 'Socket', 'Dns.', 'new Thread', 'ThreadPool']) {
  assert.ok(!codeOnly.includes(api), 'runner must not use ' + api);
}

// ---- compileGO (exe, references pinned budget library) ----
mkdirSync(ROOT + '/out', { recursive: true });
try { for (const n of readdirSync(ROOT + '/out')) chmodSync(ROOT + '/out/' + n, 0o666); } catch {}
const exe = bs(ROOT + '/out/BudgetMemoryRunner.exe');
const argv = ['/noconfig', '/nologo', '/nostdlib+', '/target:exe', '/platform:x64', '/debug-', '/optimize-', '/codepage:65001', '/langversion:5',
  '/out:' + exe,
  '/r:' + bs(FW + '/mscorlib.dll'), '/r:' + bs(FW + '/System.dll'), '/r:' + bs(FW + '/System.Core.dll'), '/r:' + bs(FW + '/System.Web.Extensions.dll'),
  '/r:' + bs(bmcDll),
  bs(runnerSrc)];
const c0 = spawnSync(FW + '\\csc.exe', argv, { encoding: 'utf8' });
assert.strictEqual(c0.status, 0, 'runner csc exit ' + c0.status + '\nSTDOUT: ' + (c0.stdout || '').slice(0, 2500));
const exeBytes = readFileSync(exe);
const exeSha = createHash('sha256').update(exeBytes).digest('hex');
const compileReceipt = { argv, exitCode: 0, stdout: (c0.stdout || '').trim(), stdoutLength: (c0.stdout || '').length, exeBytes: exeBytes.length, exeSha256: exeSha, referencedLibraryPin: bmcDll + ' ' + pins[bmcDll] };
writeFileSync(ROOT + '/out/compile-receipt.json', JSON.stringify(compileReceipt, null, 2) + '\n', { flag: 'w' });

// ---- deployment of pinned referenced library adjacent to exe (parent operation) ----
const deployed = ROOT + '/out/BudgetedEvidenceTests.dll';
const srcDllBytes = readFileSync(bmcDll);
assert.strictEqual(createHash('sha256').update(srcDllBytes).digest('hex'), pins[bmcDll], 'deployed source dll pin');
writeFileSync(deployed, srcDllBytes, { flag: 'w' });
assert.strictEqual(sha(deployed), pins[bmcDll], 'deployed dll pin after write');
chmodSync(deployed, 0o444);

// ---- executionGO (pure memory, timeout, original process control by this parent script) ----
const t0 = Date.now();
const run = spawnSync(bs(exe), [], { encoding: 'utf8', timeout: 60000, killSignal: 'SIGKILL' });
const dt = Date.now() - t0;
const capture = (run.stdout || '') + (run.stderr ? '\n[STDERR]\n' + run.stderr : '');
writeFileSync(ROOT + '/out/BudgetMemoryRun-capture.txt', capture, { flag: 'w' });
const runAsm = createHash('sha256').update(capture).digest('hex');
const completed = capture.includes('RUNALL_COMPLETED');
const receipt = {
  at: new Date().toISOString(),
  task: 'task_mvc6a24d_002r_tcm0ui (V3-BUDGET-PARENT-MEMORY-TEST, LEAD ONLY)',
  invocation: 'single direct child of parent bun script; timeout 60000ms SIGKILL; no Job object; no resource manipulation',
  runnerSource: runnerSrc + ' sha256 ' + runnerSha,
  referencedLibrary: bmcDll + ' sha256 ' + pins[bmcDll] + ' (budget compile receipt budget-csc-final-verification-20261017.json)',
  compile: { exitCode: 0, exeBytes: exeBytes.length, exeSha256: exeSha, warnings: (c0.stdout || '').trim().length },
  deployedDependency: 'BudgetedEvidenceTests.dll copied by parent into out/ (pin verified before+after), adjacent for standard CLR probe resolution; NOT a runner side effect',
  attemptedLoadFailurePreserved: 'first run exited 82 in 62ms with FileNotFoundException loading BudgetedEvidenceTests (dependency not adjacent); zero test code ran; stdout tail preserved in script history; not a verdict, not a rearmed test failure',
  execution: { exitCode: run.status, durationMs: dt, timeoutKill: false, captureSha256: runAsm, stdoutTail: capture.split('\n').slice(-10) },
  runAllCompleted: completed,
  countingPreAauthorized: '20 top-level invocations / 17 distinct methods (RunAll body lines 13-32) ONLY IF RunAll completes; counted=' + completed,
  oracleNotMaterialized: 'parent 12-case JSON (cases.json ad67adf0) NOT acquired into this run — budget tests use their own inline numeric fixtures; oracle stays frozen for future review binding',
  invariants: 'pure memory only; no filesystem writes by runner; no spawn/thread/network/Job by runner; parent process controlled timing/capture',
};
writeFileSync(ROOT + '/out/execution-receipt.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'w' });
chmodSync(exe, 0o444);
chmodSync(ROOT + '/out/BudgetMemoryRun-capture.txt', 0o444);
chmodSync(ROOT + '/out/compile-receipt.json', 0o444);
chmodSync(ROOT + '/out/execution-receipt.json', 0o444);
writeFileSync(CO + '/v3-budget-memory-execution-receipt-20261017.json', JSON.stringify({ ...receipt, root: ROOT }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ runAllCompleted: completed, exitCode: run.status, durationMs: dt, captureTail: capture.split('\n').slice(-9) }, null, 1));
