import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hash, fingerprint } from "../../src/validation";
import { validateGraphSnapshot, type GraphSnapshotV1 } from "../../src/graph";
import { planMission, type PlannerPolicy } from "../../src/planner";
import { comparePolicies, runScenario, simPlanFromExport, planShape, SIM_RESOURCE_MODEL, type SimPolicyKind } from "../../src/simulator";
import { scenario } from "../simulator/scenarios";
import { sparseScenario } from "./sparse";

const policies: SimPolicyKind[] = ["sequential","fixed_groups","levels","fifo","event_driven","critical_path","heterogeneous"];
function realExport() {
  const g: GraphSnapshotV1 = JSON.parse(readFileSync(join(import.meta.dir,"../fixtures/graph/communities-obvious/content.json"),"utf8"));
  expect(validateGraphSnapshot(g)).toEqual([]);
  const p: PlannerPolicy = { version:"benchmark-corrective-v2",estimationVersion:"duration:v1",partitionId:"partition:benchmark",investigationKind:"decompilation",artifactKind:"reconciled_c",publicationLevel:1,
    contextEnvelopeMaxUtf8Bytes:100_000_000,totalContextBudgetUtf8Bytes:1_000_000_000,maxSelectedUnits:100,sccMaxFunctions:100,sccMaxIterations:2,sccCostBudget:1_000_000,
    resourcesByFunction:Object.fromEntries(g.nodes.map(n=>[n.id,{profiles:["build"],models:["offline"],accounts:["shared"],tools:["cpu"],slots:1,cpu:1,gpu:0,budget:1}])),
    estimatesByFunction:Object.fromEntries(g.nodes.map(n=>[n.id,{version:"duration:v1",A:2,B:3,R:1,validation:1}])),
    requirementsByFunction:Object.fromEntries(g.nodes.map(n=>[n.id,{functionId:n.id,moduleSha256:n.moduleSha256,artifactId:`artifact:${n.id}`,artifactSha256:hash(`C:${n.id}`),artifactKind:"reconciled_c",minimumRevision:2,maximumRevision:100,publicationLevel:1,validation:"fixture-only"}])) };
  return planMission(g,g.nodes.map(n=>({groupId:`group:${n.id}`,partitionId:p.partitionId,ownedFunctionIds:[n.id],contextFunctionIds:[]})),p);
}

test("bounded real L5 SCC export: seven policies share immutable work/resources/parallel-role setting",()=>{
  const e=realExport(),s=scenario([],[],4);s.plan=simPlanFromExport(e);s.config.rolesParallel=true;
  const before=fingerprint(s),rows=comparePolicies(s,policies);
  for(const row of rows){expect(row.outcome).toBe("complete");expect(row.committedUnits).toBe(2);expect(row.rolesParallel).toBe(true);expect(row.metricsVersion).toBe(2);expect(row.lowerBoundTicks).toBeLessThanOrEqual(row.makespan);expect(row.resourceModel).toBe(SIM_RESOURCE_MODEL);expect(row.resourceModelLimit).toContain("NOT equivalent");}
  for(const policy of policies){const r=runScenario({...s,config:{...s.config,policy}});expect(r.metrics.overhead.admissions).toBe(12);expect(r.metrics.totalWorkTicks).toBe(24);expect(r.metrics.criticalPathTicks).toBe(9);expect(r.metrics.estimatedRemainingCriticalPathTicks).toBe(0);}
  expect(fingerprint(s)).toBe(before);
  const legacy=comparePolicies({...s,config:{...s.config,rolesParallel:undefined}},["sequential","event_driven"]);
  expect(legacy.map(r=>r.rolesParallel)).toEqual([false,true]);
  console.log(JSON.stringify({kind:"bounded-real-L5-export-v2",nodes:4,units:e.units.length,subIntents:e.units.reduce((n,u)=>n+u.subIntents.length,0),planFingerprint:e.plan.fingerprint,binding:e.binding.fingerprint,rows,legacyRoleDefaults:legacy}));
});

test("sparse recursive local work matches actual exported shape; graph/DAG/total construction costs are separate",()=>{
  const e=realExport(),real=scenario([],[],4);real.plan=simPlanFromExport(e);real.config.rolesParallel=true;
  const built=sparseScenario({nodes:4,degree:0,seed:7,sccCount:2,sccSize:2,specialistRatio:0,workers:4}),s=built.scenario;
  s.config=structuredClone(real.config);s.durations={A:2,B:3,R:1};
  for(const u of s.plan.units){u.resources={kind:"required",requirement:{profiles:["build"],models:["offline"],accounts:["shared"],tools:["cpu"],slots:1,cpu:1,gpu:0,budget:2}};}
  expect(s.plan.units.every(u=>u.subIntents?.length===6)).toBe(true);
  expect(s.plan.units.every(u=>u.subIntents!.filter(t=>t.role!=="R"&&t.waitsForSubIntentIds.length===1).length===2)).toBe(true);
  expect(planShape(s.plan,s.durations,1).criticalPathTicks).toBe(9);
  const synthetic=comparePolicies(s,policies),actual=comparePolicies(real,policies);
  expect(synthetic.map(r=>r.makespan)).toEqual(actual.map(r=>r.makespan));
  expect(runScenario(s).metrics.overhead.admissions).toBe(12);
  expect(built.localDagConstructionSteps).toBeGreaterThan(0);expect(built.totalConstructionSteps).toBe(built.constructionSteps+built.localDagConstructionSteps);
  expect(String(built.stats.model)).toContain("not itself an L5 export");
  console.log(JSON.stringify({kind:"synthetic-vs-real-L5-local-shape-v2",graphSteps:built.constructionSteps,localDagSteps:built.localDagConstructionSteps,totalSteps:built.totalConstructionSteps,syntheticRows:synthetic}));
});

test("K1 and K=N at 16/32/64 expose bucket and worker costs, not only conflict/ready counts",()=>{
  const samples=[];
  for(const n of [16,32,64])for(const distinct of [false,true]){
    const g=sparseScenario({nodes:n,degree:0,seed:19,sccCount:0,sccSize:2,specialistRatio:0,workers:2});
    g.scenario.plan.units.forEach((u,i)=>{u.requiredTools=[`tool:${distinct?i:0}`];});
    const tools=Array.from({length:n},(_,i)=>`tool:${i}`);g.scenario.config.workers.forEach(w=>{w.tools=tools;});
    const start=performance.now(),r=runScenario(g.scenario),ms=performance.now()-start;
    expect(r.metrics.outcome).toBe("complete");expect(r.metrics.overhead.resourceBuckets).toBe(distinct?n:1);
    expect(r.metrics.overhead.resourceBucketScans).toBeGreaterThan(0);expect(r.metrics.overhead.workerVisits).toBeGreaterThanOrEqual(r.metrics.overhead.workerCompatibilityChecks);
    expect(r.metrics.overhead.localDagNodes).toBe(3*n);
    samples.push({n,k:distinct?n:1,w:2,ms,construction:{graph:g.constructionSteps,local:g.localDagConstructionSteps,total:g.totalConstructionSteps},overhead:r.metrics.overhead});
  }
  expect(samples[5]!.overhead.workerVisits).toBeGreaterThan(samples[4]!.overhead.workerVisits);
  console.log(JSON.stringify({kind:"bounded-K-by-W-costs-v2",universalLinearClaim:false,ran100k:false,samples}));
});
