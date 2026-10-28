/** Reproduction: bun test/benchmarks/run.ts 1000 10000 [100000]
 * Prints JSONL evidence, no file mutation or dependency download.
 */
import { cpus, platform, arch, totalmem } from "node:os";
import { runScenario, type SimPolicyKind } from "../../src/simulator";
import { sparseScenario } from "./sparse";
const policies: SimPolicyKind[] = ["sequential","fixed_groups","levels","fifo","event_driven","critical_path","heterogeneous"];
const sizes = process.argv.slice(2).map(Number); if(!sizes.length)sizes.push(1000,10000);
console.log(JSON.stringify({kind:"environment",version:1,runtime:process.versions,platform:platform(),arch:arch(),cpu:cpus()[0]?.model,logicalCpus:cpus().length,totalMemory:totalmem(),threads:1,clock:"integer logical ticks, not native wall-time",seed:7319,durations:"per function A/B uniform integer[1,5], R[1,3], validation1; worker speed1/2; SAME input for every policy",limitations:"simulated gains only; lowerBound is bound, not measurement; RSS/heap endpoint samples, not allocator peak"}));
for(const nodes of sizes){
  const start=performance.now(), generated=sparseScenario({nodes,degree:2,seed:7319,sccCount:Math.floor(nodes/100),sccSize:4,selfLoops:Math.floor(nodes/200),familySize:1,workers:8});
  console.log(JSON.stringify({kind:"input",inputHash:generated.inputHash,generationMs:performance.now()-start,constructionSteps:generated.constructionSteps,...generated.stats}));
  let sequential=0;
  for(const policy of policies){
    const cpu=process.cpuUsage(), before=process.memoryUsage(),t=performance.now();
    const result=runScenario({...generated.scenario,config:{...generated.scenario.config,policy}}),after=process.memoryUsage();
    if(policy==="sequential")sequential=result.metrics.makespan;
    console.log(JSON.stringify({kind:"policy",N:nodes,policy,inputHash:generated.inputHash,wallMs:performance.now()-t,cpuUs:process.cpuUsage(cpu),rssBytes:after.rss,heapDeltaBytes:after.heapUsed-before.heapUsed,traceHash:result.traceHash,speedupUseful:result.metrics.outcome==="complete"?sequential/result.metrics.makespan:null,metrics:result.metrics}));
    if(result.metrics.outcome!=="complete")process.exitCode=1;
  }
}
for(const conflicts of ["chain","shared"] as const){
  const g=sparseScenario({nodes:1000,degree:0,seed:4,sccCount:0,sccSize:2,specialistRatio:0,conflicts}),t=performance.now(),result=runScenario(g.scenario);
  console.log(JSON.stringify({kind:"worstcase",name:conflicts,wallMs:performance.now()-t,inputHash:g.inputHash,stats:g.stats,metrics:result.metrics}));
}
{
  const g=sparseScenario({nodes:8,degree:1,seed:7,sccCount:0,sccSize:2,specialistRatio:0,workers:2});
  for(const policy of ["event_driven","critical_path"] as const){const result=runScenario({...g.scenario,config:{...g.scenario.config,policy}});console.log(JSON.stringify({kind:"counterexample",seed:7,policy,inputHash:g.inputHash,metrics:result.metrics}));}
}
