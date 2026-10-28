import { expect } from "bun:test";
import type { SimRunResult, SimScenario, SimTraceEntry } from "../../src/simulator";

/** Declarative interval/causality oracle: does not use queue/ranking/readiness code. */
export function verifyTrace(scenario: SimScenario, result: SimRunResult): void {
  const starts = new Map<string, SimTraceEntry>(), workerOwner = new Map<number, string>(), committed = new Set<string>(), done = new Set<string>();
  const units = new Map(scenario.plan.units.map(u => [u.unitId, u])), accountUse = new Map<string, number>();
  const activeFamily = new Set<string>(), paths = new Set<string>(), completedSubs = new Set<string>();
  let revision = scenario.plan.knowledgeRevision;
  for (const e of result.trace) {
    const id = String(e.unitId), u = units.get(id);
    if (e.ev === "job_start") {
      const worker = Number(e.workerId), execution = String(e.executionId), spec = scenario.config.workers[worker]!;
      expect(workerOwner.has(worker), `worker ${worker} already owned`).toBe(false);
      workerOwner.set(worker, execution); starts.set(execution, e);
      accountUse.set(spec.accountId, (accountUse.get(spec.accountId) ?? 0) + 1);
      expect(accountUse.get(spec.accountId)!).toBeLessThanOrEqual(scenario.config.accountQuotas?.[spec.accountId] ?? Infinity);
      expect(!u!.requiredProfile || spec.profile === u!.requiredProfile).toBe(true);
      expect(paths.has(String(e.outputPath)), "A/B output overlap").toBe(false); paths.add(String(e.outputPath));
      for (const p of u!.prerequisites) if (p.kind === "obligatory" && !p.dispensed) expect(committed.has(p.producerUnitId!)).toBe(true);
      if (e.role === "R") for (const role of ["A", "B"]) expect(done.has(`${id}/${e.functionId}/${role}`), "R must await same-function A+B").toBe(true);
      for (const prior of u!.subIntents?.find(s => s.subIntentId === e.subIntentId)?.waitsForSubIntentIds ?? []) expect(completedSubs.has(prior), "local prereq must be complete").toBe(true);
      if (!activeFamily.has(id)) {
        for (const otherId of activeFamily) {
          const other = units.get(otherId)!;
          expect(u!.ownedFunctionIds.some(fn => other.ownedFunctionIds.includes(fn))).toBe(false);
          expect(u!.conflicts.some(k => other.conflicts.some(o => o.resourceKey === k.resourceKey)), "direct exclusive conflict overlaps").toBe(false);
        }
        activeFamily.add(id);
      }
    }
    if (e.ev === "job_done" || e.ev === "job_done_fenced") {
      const execution = String(e.executionId), start = starts.get(execution)!;
      expect(start).toBeDefined(); expect(e.t).toBeGreaterThanOrEqual(Number(start.endTick));
      const worker = Number(start.workerId), account = scenario.config.workers[worker]!.accountId;
      expect(workerOwner.get(worker)).toBe(execution); workerOwner.delete(worker);
      accountUse.set(account, accountUse.get(account)! - 1); done.add(`${id}/${e.functionId}/${e.role}`);
      completedSubs.add(String(start.subIntentId));
    }
    if (e.ev === "job_stop_confirmed") {
      const execution = String(e.executionId), start = starts.get(execution)!; const worker = Number(start.workerId), account = scenario.config.workers[worker]!.accountId;
      expect(workerOwner.get(worker)).toBe(execution); workerOwner.delete(worker); accountUse.set(account, accountUse.get(account)! - 1);
    }
    if (e.ev === "committed") {
      expect(committed.has(id)).toBe(false);
      for (const fn of u!.ownedFunctionIds) expect(done.has(`${id}/${fn}/R`)).toBe(true);
      expect(Number(e.level)).toBe(1); expect(Number(e.revision)).toBe(++revision);
      committed.add(id); activeFamily.delete(id);
    }
    if (e.ev === "unit_state" && ["CANCELLED", "QUARANTINED"].includes(String(e.to))) {
      // A quarantined worker may still be active: do not remove its ownership.
      if (![...workerOwner.values()].some(execution => starts.get(execution)?.unitId === id)) activeFamily.delete(id);
    }
  }
  expect(result.store.committedCount).toBe(committed.size);
  expect(result.metrics.utilization).toBeLessThanOrEqual(1);
  expect(result.metrics.utilization).toBeGreaterThanOrEqual(0);
}
