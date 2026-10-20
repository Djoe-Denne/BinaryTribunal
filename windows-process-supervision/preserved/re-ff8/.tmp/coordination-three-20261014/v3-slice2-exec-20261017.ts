import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';

const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const FW = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const bs = (p) => p.replace(/\//g, '\\');

const pins = {
  [CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs']: ['bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709', 8016],
  [CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs']: ['7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f', 71132],
  [CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs']: ['a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284', 21557],
  [CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs']: ['0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f', 11846],
  [CO + '/V3_HOST_SOURCE_OUTPUT_20261017/HostLauncher.cs']: ['1cc9cca0f0d2516f40c42f6d2b421126aa7b05bef29bcbfcd3e5760c1d956a15', 15729],
  [CO + '/V3_HOST_SOURCE_OUTPUT_20261017/CaptureWiring.cs']: ['d08beba3b371661a1c7a12d4ddda697514556bdc2f91dc16028b0fa20cc2987f', 6029],
  [CO + '/V3_HOST_CORRECTION_OUTPUT_20261017/WriterLedger.cs']: ['67e9b21c1f8ec6212fa3d21199254359770e5e0b4b56c7268567af55eb0323b0', 8889],
  [CO + '/V3_REALNATIVE_OUTPUT_20261017/RealNative.cs']: ['e58eef0c8086240e2e8296415cf6ff7e3cbce253aba1d0e4bf425728e1e26e14', 15934],
  [CO + '/V3_REALNATIVE_OUTPUT_20261017/RunnerReal.cs']: ['8e8bb62304267ad63856956dae6bddfb1e440638ea70d8a287fd2d89484fc5f3', 20530],
  [FW + '/csc.exe']: ['eca02e6b15cde93009a59a3d129d5a77fb5008f2e1cf62cf573b6737c747ecc3', null],
  [FW + '/mscorlib.dll']: ['94715f6991e2b9dc7481532c05aa99e74a5fff4ee147be541bca27f99e003fc7', null],
  [FW + '/System.dll']: ['09787b4f38f4f020c6b8a3894146085d4df7b8ae337577ed42d9acf1419660e8', null],
  [FW + '/System.Core.dll']: ['d1bafee1a4dd7e7bd9adf6859e7b1b654d1b4e0d031a38795e33ba040508c09d', null],
  [FW + '/System.Web.Extensions.dll']: ['6f2545e5ba378f6836ea0fed1067d089181e27dbd3c81e9db418c8bb32e6af51', null],
};
const srcs = [
  CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs',
  CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs',
  CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs',
  CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs',
  CO + '/V3_HOST_SOURCE_OUTPUT_20261017/HostLauncher.cs',
  CO + '/V3_HOST_SOURCE_OUTPUT_20261017/CaptureWiring.cs',
  CO + '/V3_HOST_CORRECTION_OUTPUT_20261017/WriterLedger.cs',
  CO + '/V3_REALNATIVE_OUTPUT_20261017/RealNative.cs',
  CO + '/V3_REALNATIVE_OUTPUT_20261017/RunnerReal.cs',
];
const combined = createHash('sha256').update(srcs.map(sha).join('\n')).digest('hex');
const ROOT = 'C:/Users/djden/AppData/Local/Temp/opencode/WINEXE1-' + combined.slice(0, 10);
mkdirSync(ROOT + '/out', { recursive: true });
try { for (const n of readdirSync(ROOT + '/out')) chmodSync(ROOT + '/out/' + n, 0o666); } catch {}

const refs = [FW + '/mscorlib.dll', FW + '/System.dll', FW + '/System.Core.dll', FW + '/System.Web.Extensions.dll'];
const argv = ['/noconfig', '/nologo', '/nostdlib+', '/target:winexe', '/platform:x64', '/debug-', '/optimize-', '/codepage:65001', '/langversion:5',
  '/out:' + bs(ROOT + '/out/GuardianRealRunner.exe'), ...refs.map((r) => '/r:' + bs(r)), ...srcs.map(bs)];
const r = spawnSync(FW + '\\csc.exe', argv, { encoding: 'utf8' });
assert.strictEqual(r.status, 0, 'winexe csc exit ' + r.status + '\nSTDOUT: ' + (r.stdout || '').slice(0, 2500));
const exeBytes = readFileSync(ROOT + '/out/GuardianRealRunner.exe');
const exeSha = createHash('sha256').update(exeBytes).digest('hex');
writeFileSync(ROOT + '/out/compile-receipt.json', JSON.stringify({ argv, exitCode: 0, stdout: (r.stdout || '').trim(), exeBytes: exeBytes.length, exeSha256: exeSha, srcs: srcs.map((s) => s + ' ' + sha(s)) }, null, 2) + '\n', { flag: 'w' });

// ---- slice-2 execution (REAL Job + real T child, self-exit sentinel) ----
// attempt 1 failed honestly: parent PRE-CREATED the case dir, but RunnerReal.cs:218
// requires a NOT-existing DosPath the runner creates itself ("répertoire de cas frais")
// — parent invocation-side misunderstanding, zero product defect, zero state left
// (0 case files). attempt 2 = corrected invocation, NO mkdir (the runner creates it).
const caseDir = 'C:/Users/djden/AppData/Local/Temp/opencode/V3SLICE2-' + combined.slice(0, 10) + '-case02';
const t0 = Date.now();
const run = spawnSync(bs(ROOT + '/out/GuardianRealRunner.exe'), [bs(caseDir)], { encoding: 'utf8', timeout: 60000, killSignal: 'SIGKILL' });
const dt = Date.now() - t0;
const capture = (run.stdout || '') + (run.stderr ? '\n[STDERR]\n' + run.stderr : '');
writeFileSync(ROOT + '/out/slice2-capture.txt', capture, { flag: 'w' });
const caseFiles = readdirSync(caseDir).sort().map((n) => {
  const p = caseDir + '/' + n;
  const b = readFileSync(p);
  return { name: n, bytes: b.length, sha256: createHash('sha256').update(b).digest('hex') };
});
const rec = {
  at: new Date().toISOString(),
  task: 'task_mvc44d90_000c qualification slice 2: REAL Job + REAL T via RunnerReal (LEAD ONLY, separate gate after ACCEPTABLE realnative review)',
  preconditionsHonest: { bitness: 'parent 64-bit (csc Framework64 ran in this script)', insideJob: 'unknown-to-parent — fail-closed facts recorded either way by the runner', sentinelNeverPassedToParent: true },
  compile: { exitCode: 0, exeBytes: exeBytes.length, exeSha256: exeSha, warnings: (r.stdout || '').trim().length, target: 'winexe' },
  execution: { exitCode: run.status, durationMs: dt, timeoutFired: dt >= 59000, captureSha256: createHash('sha256').update(capture).digest('hex'), stdout: capture.split('\n').filter(Boolean).slice(-12) },
  caseFiles,
  invariants: 'sentinel never passed to the parent; harness never calls TerminateJobObject; exit 0/QUIET are FACTS not a PASS; each case file pinned; caps 262144/chunk 4096 untouched; last-close NOT_ESTABLISHED regardless of outcome',
};
writeFileSync(ROOT + '/out/slice2-receipt.json', JSON.stringify(rec, null, 2) + '\n', { flag: 'w' });
for (const n of readdirSync(ROOT + '/out')) chmodSync(ROOT + '/out/' + n, 0o444);
writeFileSync(CO + '/v3-slice2-receipt-20261017.json', JSON.stringify({ ...rec, root: ROOT, caseDir }, null, 2) + '\n', { flag: 'w' });
console.log(JSON.stringify({ exitCode: run.status, durationMs: dt, stdoutTail: capture.split('\n').filter(Boolean).slice(-10), caseFiles: caseFiles.length }, null, 1));
