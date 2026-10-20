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
  [CO + '/V3_BUDGET_SOURCE_OUTPUT_20261017/BudgetedEvidence.cs']: null,
  [CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs']: ['7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f', 71132],
  [CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs']: ['a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284', 21557],
  [CO + '/V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017/BudgetedEvidence.cs']: ['0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f', 11846],
  [CO + '/V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017/BudgetedEvidence.Tests.cs']: ['e24df7737199e7c567dc6ae82bf5a7050cd9a38a28988e386b7c36893b19bed4', 32653],
  [CO + '/V3_G_CORRECTIONS_R1_OUTPUT_20261017/GuardianCore.Tests.cs']: ['aefc941e19765c108acd7e573ebb1664f67dc5a57978bdd607b0cda2a8ce86fa', 38487],
  [CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.Tests.cs']: ['82a95a2fb76857cc3f70a78abc9b48168bbb849ba0666a981fa14cbdc06ab942', 45179],
  [CO + '/V3_HOST_CORRECTION_OUTPUT_20261017/WriterLedger.cs']: ['67e9b21c1f8ec6212fa3d21199254359770e5e0b4b56c7268567af55eb0323b0', 8889],
  [CO + '/V3_HOST_SOURCE_OUTPUT_20261017/CaptureWiring.cs']: ['d08beba3b371661a1c7a12d4ddda697514556bdc2f91dc16028b0fa20cc2987f', 6029],
  [CO + '/V3_HOST_SOURCE_OUTPUT_20261017/HostLauncher.cs']: ['1cc9cca0f0d2516f40c42f6d2b421126aa7b05bef29bcbfcd3e5760c1d956a15', 15729],
  [CO + '/V3_HOST_CORRECTION_OUTPUT_20261017/Host.Tests.cs']: ['c5770e353e8c60fa22ac753ebcc37e3cd66c9ef8c94bc4c1e64b69d88eea1716', 29049],
  [FW + '/csc.exe']: ['eca02e6b15cde93009a59a3d129d5a77fb5008f2e1cf62cf573b6737c747ecc3', null],
  [FW + '/mscorlib.dll']: ['94715f6991e2b9dc7481532c05aa99e74a5fff4ee147be541bca27f99e003fc7', null],
  [FW + '/System.dll']: ['09787b4f38f4f020c6b8a3894146085d4df7b8ae337577ed42d9acf1419660e8', null],
  [FW + '/System.Core.dll']: ['d1bafee1a4dd7e7bd9adf6859e7b1b654d1b4e0d031a38795e33ba040508c09d', null],
  [FW + '/System.Web.Extensions.dll']: ['6f2545e5ba378f6836ea0fed1067d089181e27dbd3c81e9db418c8bb32e6af51', null],
};
delete pins[CO + '/V3_BUDGET_SOURCE_OUTPUT_20261017/BudgetedEvidence.cs'];
for (const [p, [expect, size]] of Object.entries(pins)) {
  const h = sha(p);
  assert.strictEqual(h, expect, 'pin: ' + p + ' got ' + h.slice(0, 12));
  if (size) assert.strictEqual(statSync(p).size, size, 'size: ' + p);
}

const moduleCs = CO + '/V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017/BudgetedEvidence.cs';
const libSrcs = [CO + '/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs', moduleCs, CO + '/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs', CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs'];
const testSrcs = libSrcs.concat([
  CO + '/V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017/BudgetedEvidence.Tests.cs',
  CO + '/V3_G_CORRECTIONS_R1_OUTPUT_20261017/GuardianCore.Tests.cs',
  CO + '/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.Tests.cs',
  CO + '/V3_HOST_CORRECTION_OUTPUT_20261017/WriterLedger.cs',
  CO + '/V3_HOST_SOURCE_OUTPUT_20261017/CaptureWiring.cs',
  CO + '/V3_HOST_SOURCE_OUTPUT_20261017/HostLauncher.cs',
  CO + '/V3_HOST_CORRECTION_OUTPUT_20261017/Host.Tests.cs',
]);

const combined = createHash('sha256').update(testSrcs.map((p) => sha(p)).join('\n')).digest('hex');
const ROOT = 'C:/Users/djden/AppData/Local/Temp/opencode/V3ASM2-' + combined.slice(0, 10);
mkdirSync(ROOT + '/out', { recursive: true });
try { for (const n of readdirSync(ROOT + '/out')) chmodSync(ROOT + '/out/' + n, 0o666); } catch {}

const refs = [FW + '/mscorlib.dll', FW + '/System.dll', FW + '/System.Core.dll', FW + '/System.Web.Extensions.dll'];
const baseArgs = ['/noconfig', '/nologo', '/nostdlib+', '/platform:x64', '/debug-', '/optimize-', '/codepage:65001', '/langversion:5'];

function compile(label, srcs, outName, target) {
  const out = bs(ROOT + '/out/' + outName);
  const argv = [...baseArgs, '/target:' + target, '/out:' + out, ...refs.map((r) => '/r:' + bs(r)), ...srcs.map(bs)];
  const r = spawnSync(FW + '\\csc.exe', argv, { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, label + ' csc exit ' + r.status + '\nSTDOUT: ' + (r.stdout || '').slice(0, 2500));
  const dll = readFileSync(ROOT + '/out/' + outName);
  const rec = { label, argv, exitCode: 0, stdout: (r.stdout || '').trim(), bytes: dll.length, sha256: createHash('sha256').update(dll).digest('hex'), sourcePins: srcs.map((s) => s + ' ' + sha(s)) };
  writeFileSync(ROOT + '/out/' + label + '-receipt.json', JSON.stringify(rec, null, 2) + '\n', { flag: 'w' });
  return rec;
}

const libRec = compile('ASSEMBLY_LIB', libSrcs, 'GuardianV3Assembly.dll', 'library');
const testRec = compile('ASSEMBLY_TESTS', testSrcs, 'GuardianV3Tests.dll', 'library');
const expectedSameLib = 'c031009b18c2ae3fcd9f8bbd2bfce7fde216ecad742e3a8f0230e84ffd928010';
for (const n of readdirSync(ROOT + '/out')) chmodSync(ROOT + '/out/' + n, 0o444);

const summary = {
  at: new Date().toISOString(),
  task: 'new assembly compileGO after host correction delta accepted (000c chain, LEAD ONLY)',
  root: ROOT,
  lib: { bytes: libRec.bytes, sha256: libRec.sha256, byteIdenticalToPreviousCompile: libRec.sha256 === expectedSameLib, warnings: libRec.stdout.length },
  tests: { bytes: testRec.bytes, sha256: testRec.sha256, warnings: testRec.stdout.length, elevenSources: true },
  noExecutionNoLoadNoTestRunNoNativeApi: true,
};
writeFileSync(CO + '/v3-assembly-compilego2-receipt-20261017.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
writeFileSync(ROOT + '/out/summary.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'w' });
chmodSync(ROOT + '/out/summary.json', 0o444);
console.log(JSON.stringify(summary, null, 1));
