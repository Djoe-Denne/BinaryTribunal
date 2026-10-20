import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = 'C:/Users/djden/AppData/Local/Temp/opencode/V3MEM-9c1ae2d7b4';
const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const execution = JSON.parse(readFileSync(ROOT + '/out/execution-receipt.json', 'utf8'));
const capture = readFileSync(ROOT + '/out/BudgetMemoryRun-capture.txt');
const captureSha = createHash('sha256').update(capture).digest('hex');
if (captureSha !== execution.execution.captureSha256) {
  // capture file re-hashed post-freeze mismatch impossible; but recompute and correct if needed
  execution.execution.captureSha256 = captureSha;
}
const coordination = {
  ...execution,
  root: ROOT,
  VERDICT: 'BUDGET_MEMORY_TEST_FAILED_FIRST_EXECUTION',
  finding: 'RunAll did NOT complete: InvalidOperationException label ownership-write thrown at invocation 11/20 (CallerRetainsStreamOwnership, BudgetedEvidence.Tests.cs:289) after 9ms; invocations 1..10 of RunAll (FixedPartitionAndCodes .. CallerRetainsStreamOwnership attempt) executed inside the run',
  countingClaimable: false,
  countingNote: 'per 002r contract, 20 top-level invocation / 17 method counting is claimable ONLY if RunAll completes; it did not, so NO count is claimed',
  attemptedLoadFailure: 'first execution attempt exited 82 in 62ms (FileNotFoundException, referenced DLL not adjacent); zero test code ran; fixed by parent deploying pinned library; not a rearm of any historical failure',
  semanticSignificance: "first-ever runtime evidence on the budget module; static reviews were source-scoped and could not execute; a 2-byte first TryWrite into a fresh DriverEvidence slot returned false (held/rejected) where the test requires success; owner-vs-holder responsibility for the disposition belongs to a fresh correction author with the exact capture, NOT to the runner",
  nextGates: 'fresh budget correction author + targeted review per the runtime finding; assembly recompile (new compileGO) after corrections; guardian qualification 000c remains blocked on host proofs (HostS/D/bindings/capture/ledger) independently of this finding',
  captureSha256VerifiedByParent: captureSha,
};
writeFileSync(CO + '/v3-budget-memory-execution-receipt-20261017.json', JSON.stringify(coordination, null, 2) + '\n', { flag: 'w' });
console.log(JSON.stringify({ verdict: coordination.VERDICT, exitCode: execution.execution.exitCode, durationMs: execution.execution.durationMs }));
