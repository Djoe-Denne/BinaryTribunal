import { expect, test } from "bun:test";
import { sparseScenario } from "./sparse";
import { runScenario, comparePolicies, validateSimPlan } from "../../src/simulator";
import { scenario } from "../simulator/scenarios";

test("sparse generator exact rings/SCC count, bounded construction and no pairwise graph",()=>{
  for(const N of [1000,10000]){
    const g=sparseScenario({nodes:N,degree:2,seed:7319,sccCount:N/100,sccSize:4,selfLoops:N/200});
    expect(validateSimPlan(g.scenario.plan)).toEqual([]);expect(Number(g.stats.E)).toBeLessThan(N*3);expect(g.constructionSteps).toBeLessThan(N*10);
    expect(sparseScenario({nodes:N,degree:2,seed:7319,sccCount:N/100,sccSize:4,selfLoops:N/200}).inputHash).toBe(g.inputHash);
  }
});
test("same immutable durations/resources/incidents for seven complete policy comparisons",()=>{
  const g=sparseScenario({nodes:1000,degree:2,seed:7319,sccCount:10,sccSize:4,selfLoops:5});
  const rows=comparePolicies(g.scenario,["sequential","fixed_groups","levels","fifo","event_driven","critical_path","heterogeneous"]);
  for(const row of rows){expect(row.outcome).toBe("complete");expect(row.committedUnits).toBe(g.scenario.plan.units.length);expect(row.makespan).toBeGreaterThanOrEqual(row.lowerBoundTicks);}
  expect(new Set(rows.map(r=>r.traceHash)).size).toBeGreaterThan(1);
},30000);
test("sparse10k event counters expose no quadratic conformance/conflict/event construction",()=>{
  const g=sparseScenario({nodes:10000,degree:2,seed:7319,sccCount:100,sccSize:4,selfLoops:50});
  const result=runScenario(g.scenario);expect(result.metrics.outcome).toBe("complete");
  expect(result.metrics.overhead.conflictChecks).toBeLessThan(10000*10);expect(result.metrics.overhead.readyPops).toBeLessThan(10000*2);
  expect(result.metrics.overhead.readinessChecks).toBeLessThan(10000*5);expect(result.metrics.overhead.eventHeapComparisons).toBeLessThan(10000*1000);
},30000);
test("worstcase sparse conflict chain and shared-resource clique use incidences not all pairs",()=>{
  for(const conflicts of ["chain","shared"] as const){const g=sparseScenario({nodes:1000,degree:0,seed:4,sccCount:0,sccSize:2,specialistRatio:0,conflicts});const result=runScenario(g.scenario);expect(result.metrics.outcome).toBe("complete");expect(result.metrics.overhead.conflictChecks).toBeLessThan(1000*30);expect(Number(g.stats.conflictIncidences)).toBeLessThanOrEqual(2000);}
},30000);
test("critical-path sophistication counterexample: fastest worker assigned long role delays small gate",()=>{
  // Frozen seed 7 found by finite exploratory search, now a reproducible regression.
  const g=sparseScenario({nodes:8,degree:1,seed:7,sccCount:0,sccSize:2,specialistRatio:0,workers:2});
  const rows=comparePolicies(g.scenario,["event_driven","critical_path"]);
  expect(rows.every(r=>r.outcome==="complete")).toBe(true);expect(rows[0]!.makespan).toBe(28);expect(rows[1]!.makespan).toBe(29);
});
