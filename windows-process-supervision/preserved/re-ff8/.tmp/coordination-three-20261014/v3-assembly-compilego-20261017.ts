import { readFileSync, readdirSync, mkdirSync, writeFileSync, chmodSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';

const ROOTR = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const CO = ROOTR + '/.tmp/coordination-three-20261014';
const FW = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// ---- 1. serial toolchain pin checks (000c: toolchain/env/pins) ----
const toolPins = {
  'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe': '60c9b29843624dd8af6b6a7b26147753be6aeef65098b9a503cc50850afe410f',
  [FW + '/csc.exe']: 'eca02e6b15cde93009a59a3d129d5a77fb5008f2e1cf62cf573b6737c747ecc3',
  [FW + '/mscorlib.dll']: '94715f6991e2b9dc7481532c05aa99e74a5fff4ee147be541bca27f99e003fc7',
  [FW + '/System.dll']: '09787b4f38f4f020c6b8a3894146085d4df7b8ae337577ed42d9acf1419660e8',
  [FW + '/System.Core.dll']: 'd1bafee1a4dd7e7bd9adf6859e7b1b654d1b4e0d031a38795e33ba040508c09d',
  [FW + '/System.Web.Extensions.dll']: '6f2545e5ba378f6836ea0fed1067d089181e27dbd3c81e9db418c8bb32e6af51',
  [FW + '/csc.exe.config']: '2d4610ade011e530d817dd3ba4fc787e5dc0c2297cc520c30a643b8fb13f9093',
  [FW + '/csc.rsp']: 'e2021640c1f8ad500549fc89cd53bc4c2f0fa13fee9034714142d93c5d554042',
};
for (const [p, expect] of Object.entries(toolPins)) {
  assert.strictEqual(sha(p), expect, 'toolchain pin mismatch: ' + p);
}

// ---- 2. serial source checks (7 sources, frozen bytes) ----
const G = CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017';
const O = CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017';
const B = CO + '/V3_BUDGET_SOURCE_OUTPUT_R1_20261017';
const GC = CO + '/V3_G_CORRECTIONS_R1_OUTPUT_20261017';
const sources = {
  [CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs']: ['bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709', 8016],
  [B + '/BudgetedEvidence.cs']: ['0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f', 11846],
  [G + '/GuardianCore.cs']: ['7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f', 71132],
  [O + '/KernelObserver.cs']: ['a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284', 21557],
  [GC + '/GuardianCore.Tests.cs']: ['aefc941e19765c108acd7e573ebb1664f67dc5a57978bdd607b0cda2a8ce86fa', 38487],
  [O + '/KernelObserver.Tests.cs']: ['82a95a2fb76857cc3f70a78abc9b48168bbb849ba0666a981fa14cbdc06ab942', 45179],
  [B + '/BudgetedEvidence.Tests.cs']: ['d94776e2858b223a3f0e85d255f4c694ae1520194c1dc48798cd8e61b6b94198', 31798],
};
const sourceNames = {};
for (const [p, [expect, size]] of Object.entries(sources)) {
  assert.strictEqual(statSync(p).size, size, 'size: ' + p);
  assert.strictEqual(sha(p), expect, 'source pin mismatch: ' + p);
  sourceNames[p] = sha(p).slice(0, 8);
}

// ---- 3. owned root named by combined source hash ----
const combined = createHash('sha256').update(
  Object.entries(sources).map(([p, [h]]) => p + ' ' + h).sort().join('\n'),
).digest('hex');
const root = 'C:/Users/djden/AppData/Local/Temp/opencode/V3ASM-' + combined.slice(0, 10);
mkdirSync(root + '/out', { recursive: true });

// ---- 4. compileGO x2 (library only; NEVER executed or loaded) ----
const refs = [FW + '/mscorlib.dll', FW + '/System.dll', FW + '/System.Core.dll', FW + '/System.Web.Extensions.dll'];
const baseArgs = ['/noconfig', '/nologo', '/nostdlib+', '/target:library', '/platform:x64', '/debug-', '/optimize-', '/codepage:65001', '/langversion:5'];
const libSrcs = Object.keys(sources).slice(0, 4);
const testSrcs = Object.keys(sources);

function compile(label, srcs, outName) {
  const bs = (p) => p.replace(/\//g, '\\');
  const out = bs(root + '/out/' + outName);
  const argv = [...baseArgs, '/out:' + out, ...refs.map((r) => '/r:' + bs(r)), ...srcs.map(bs)];
  const t0 = Date.now();
  const r = spawnSync(FW + '\\csc.exe', argv, { encoding: 'utf8' });
  const dt = Date.now() - t0;
  assert.strictEqual(r.status, 0, label + ' csc exit ' + r.status + '\nSTDOUT: ' + (r.stdout || '').slice(0, 3000) + '\nSTDERR: ' + (r.stderr || '').slice(0, 1500));
  const dll = readFileSync(out);
  const rec = {
    label, outName, argv, exitCode: r.status, durationMs: dt,
    stdout: (r.stdout || '').slice(0, 4000), stderr: (r.stderr || '').slice(0, 4000),
    dllBytes: dll.length, dllSha256: createHash('sha256').update(dll).digest('hex'),
    sourcePins: srcs.map((s) => s + ' ' + sources[s][0]),
    compiledOnlyNeverExecutedNeverLoaded: true,
  };
  writeFileSync(root + '/out/' + label + '-receipt.json', JSON.stringify(rec, null, 2) + '\n', { flag: 'w' });
  return rec;
}

const libRec = compile('ASSEMBLY_LIB', libSrcs, 'GuardianV3Assembly.dll');
const testRec = compile('ASSEMBLY_TESTS', testSrcs, 'GuardianV3Tests.dll');
for (const n of readdirSync(root + '/out')) chmodSync(root + '/out/' + n, 0o444);

const summary = {
  at: new Date().toISOString(),
  task: 'task_mvc44d90_000c_xic81o (compileGO subgate, LEAD ONLY)',
  root,
  toolchainPinsVerified: Object.keys(toolPins).length,
  sourcePinsVerified: Object.keys(sources).length,
  lib: { dll: libRec.dllBytes + 'B', sha: libRec.dllSha256, ms: libRec.durationMs, stdout: libRec.stdout.trim() },
  tests: { dll: testRec.dllBytes + 'B', sha: testRec.dllSha256, ms: testRec.durationMs, stdout: testRec.stdout.trim() },
  noExecutionNoLoadNoTestRunNoNativeApi: true,
};
writeFileSync(CO + '/v3-assembly-compilego-receipt-20261017.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary, null, 1));
