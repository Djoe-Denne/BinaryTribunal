import assert from "node:assert/strict";
import PLAN from "./PLAN.json";
import { SimEngine, SimError, runScenario, validateSimPlan, planShape, comparePolicies, captureReplayJournal, replayScenarioJournal, simPlanFromExport, SIM_RESOURCE_MODEL } from "file:///C:/Users/djden/source/repos/retro-eng/re-ff8/inputs/L7_COPY851_LEDGER_V2_REVIEW_20261016/tools/ff8-harness/src/simulator.ts";
import { planMission } from "file:///C:/Users/djden/source/repos/retro-eng/re-ff8/inputs/L7_COPY851_LEDGER_V2_REVIEW_20261016/tools/ff8-harness/src/planner.ts";
import { buildGraphSnapshot } from "file:///C:/Users/djden/source/repos/retro-eng/re-ff8/inputs/L7_COPY851_LEDGER_V2_REVIEW_20261016/tools/ff8-harness/src/graph-normalize.ts";
import { fingerprint } from "file:///C:/Users/djden/source/repos/retro-eng/re-ff8/inputs/L7_COPY851_LEDGER_V2_REVIEW_20261016/tools/ff8-harness/src/validation.ts";
const copy = (x) => structuredClone(x);
const results = [];
const exp = (id) => PLAN.cases.find(x => x.id === id).expected;
const unitState = (r,id) => r.units.find(u => u.unitId === id);
const commitTick = (r,id) => r.trace.find(e => e.ev === "committed" && e.unitId === id)?.t ?? null;
const view = (r) => ({makespan:r.metrics.makespan,publicationEnd:r.metrics.publicationEndTick,work:r.metrics.totalWorkTicks,useful:r.metrics.usefulWorkerTicks,rework:r.metrics.reworkWorkerTicks,occupied:r.metrics.occupiedWorkerTicks,reworkAttempts:r.metrics.reworkAttempts,units:r.units,commits:r.store.committedCount});
function refuse(fn, code, detail) {
  let caught;
  try { fn(); } catch(e) { caught=e; }
  assert(caught instanceof SimError, "qualified SimError required"); assert.equal(caught.code,code);
  if(detail) { assert.equal(caught.detail?.[0]?.code,"input_snapshot_non_transportable"); assert(String(caught.detail[0].detail).includes(detail)); }
  return {code:caught.code,message:caught.message,detail:caught.detail};
}
function check(id, body) {
  const start=performance.now(); console.log(JSON.stringify({kind:"case_start",id}));
  try { const actual=body(); results.push({id,status:"pass",elapsedMs:performance.now()-start,actual}); }
  catch(e) { results.push({id,status:"fail",elapsedMs:performance.now()-start,error:{name:e?.name,code:e?.code,message:String(e?.message??e),stack:String(e?.stack??"").slice(0,1200)}}); }
  console.log(JSON.stringify({kind:"case_end",...results.at(-1)}));
}
function manual() { const s=copy(PLAN.blueprints.manualDag); assert.equal(s.plan.units.length,2); assert.equal(s.plan.resourceSemantics,SIM_RESOURCE_MODEL); return s; }
function shared(id) { const s=copy(PLAN.blueprints.sharedFamilies); s.incidents=copy(PLAN.cases.find(c=>c.id===id).incidents); assert.equal(s.plan.units.length,2); return s; }
let S1,R1,J5,E7;
check("M01",()=>{
  const e=exp("M01"),s=manual(),context=["shared-read-context"],tools=["cpu"];
  for(const u of s.plan.units){u.contextFunctionIds=context;u.requiredTools=tools;u.requiredAccounts=undefined;}
  Object.setPrototypeOf(s.plan.units[0],{unusedMetadata:"legal custom prototype"}); Object.setPrototypeOf(s.plan.units[1],null); Object.setPrototypeOf(s.plan.budgets,null);
  s.plan.source=undefined; Object.freeze(context); Object.freeze(s.config); Object.freeze(s.durations);
  const before=JSON.stringify(s),proto=Object.getPrototypeOf(s.plan.units[0]),frozen=[Object.isFrozen(s.plan),Object.isFrozen(tools)];
  const shape=planShape(s.plan,s.durations,s.config.validationTicks); assert.equal(shape.criticalPathTicks,e.criticalPath);assert.equal(shape.totalWorkTicks,e.totalWork);
  const r=runScenario(s); assert.equal(r.metrics.makespan,e.makespan);assert.equal(r.metrics.totalWorkTicks,e.totalWork);assert.equal(r.metrics.usefulWorkerTicks,e.useful);assert.equal(r.metrics.occupiedWorkerTicks,e.occupied);assert.equal(r.store.committedCount,e.commits);
  assert.equal(commitTick(r,"P"),e.producerCommit);assert.equal(commitTick(r,"C"),e.consumerCommit);assert.equal(r.metrics.lowerBoundTicks,18);
  assert.equal(JSON.stringify(s),before);assert.equal(Object.getPrototypeOf(s.plan.units[0]),proto);assert.deepEqual([Object.isFrozen(s.plan),Object.isFrozen(tools)],frozen);assert(Object.hasOwn(s.plan,"source"));assert.equal(s.plan.source,undefined);assert.equal(s.plan.units[0].contextFunctionIds,s.plan.units[1].contextFunctionIds);
  S1=s;R1=r;return {shape,...view(r),callerStable:true};
});
check("M02",()=>{
  assert(S1,"M01 declared fixture required");const e=exp("M02"),before=JSON.stringify(S1);
  const rows=comparePolicies(S1,e.policies);assert.deepEqual(rows.map(r=>r.policy),e.policies);assert.deepEqual(rows.map(r=>r.makespan),e.makespans);assert.deepEqual(rows.map(r=>r.rolesParallel),e.rolesParallel);assert.deepEqual(rows.map(r=>r.criticalPathTicks),e.criticalPaths);assert.equal(JSON.stringify(S1),before);
  return {declaredScenarioVariants:["M01","M02"],rows};
});
check("M03",()=>{
  const e=exp("M03"),s=manual(),ids=[],returned={A:2,B:5,R:3};
  s.durations=id=>{ids.push(id);if(ids.length===1){s.plan.units.splice(0);s.config.workers.splice(0);s.incidents.push({kind:"cancel",atTick:0,unitId:"P"});}return returned;};
  const engine=new SimEngine(s);assert.equal(ids.length,e.durationCalls);returned.A=999;returned.B=999;returned.R=999;assert(!Object.isFrozen(returned));
  engine.runUntil(3);const observation=engine.observe(),text=JSON.stringify(observation);engine.observe();const detached=copy(observation);detached.units[0].state="FAILED";
  assert.equal(observation.metrics.observationEndTick,e.observationEventFrontier);assert.equal(observation.metrics.occupiedWorkerTicks,e.observationOccupied);assert(Object.isFrozen(observation));
  const r=engine.run();assert.equal(r.metrics.makespan,e.makespan);assert.equal(r.metrics.totalWorkTicks,e.work);assert.equal(r.store.committedCount,e.commits);assert.deepEqual(ids,e.ids);assert.equal(JSON.stringify(observation),text);assert.equal(s.plan.units.length,0);assert.equal(s.config.workers.length,0);assert.equal(s.incidents.length,1);
  return {...view(r),ids,observationEventFrontier:observation.metrics.observationEndTick,observationOccupied:observation.metrics.occupiedWorkerTicks,callbackOwnWritesAttributed:true};
});
check("M04",()=>{
  const e=exp("M04"),s=manual();let getters=0,durations=0;const getter=()=>{getters++;return "must not execute";};
  Object.defineProperty(s.plan.units[0],"auxiliaryGetter",{enumerable:true,configurable:true,get:getter});s.durations=()=>{durations++;return {A:2,B:5,R:3};};const descriptor=Object.getOwnPropertyDescriptor(s.plan.units[0],"auxiliaryGetter");
  const diagnostics=validateSimPlan(s.plan);assert.equal(diagnostics[0].code,e.diagnostic);assert(diagnostics.every(d=>d.detail.length<=320));const error=refuse(()=>new SimEngine(s),e.errorCode);assert.equal(getters,e.getterCalls);assert.equal(durations,e.durationCalls);assert.deepEqual(Object.getOwnPropertyDescriptor(s.plan.units[0],"auxiliaryGetter"),descriptor);
  return {diagnostics,error,getters,durations};
});
check("M05",()=>{
  assert(S1&&R1,"M01 declared fixture required");const e=exp("M05"),before=JSON.stringify(S1),j=captureReplayJournal(S1);assert.equal(j.scenario.durations.length,e.journalRows);assert(Object.isFrozen(j));const text=JSON.stringify(j),r=replayScenarioJournal(j);
  assert.equal(r.metrics.makespan,e.makespan);assert.equal(r.metrics.totalWorkTicks,e.work);assert.equal(r.traceHash,R1.traceHash);assert.equal(JSON.stringify(j),text);assert.equal(JSON.stringify(S1),before);J5=j;
  return {journalRows:j.scenario.durations.length,journalFrozen:true,scenarioFingerprint:j.scenarioFingerprint,traceHash:r.traceHash,...view(r)};
});
check("M06",()=>{
  assert(J5,"M05 declared valid journal required");const e=exp("M06"),j=copy(J5);j.scenario.durations.push(copy(j.scenario.durations[0]));j.scenarioFingerprint=fingerprint(j.scenario);const before=JSON.stringify(j);const error=refuse(()=>replayScenarioJournal(j),e.errorCode,e.detailContains);assert.equal(JSON.stringify(j),before);return {durationTupleCount:j.scenario.durations.length,selfHashValid:fingerprint(j.scenario)===j.scenarioFingerprint,error};
});
check("M07",()=>{
  const e=exp("M07"),b=PLAN.blueprints.export,{snapshot}=buildGraphSnapshot(copy(b.graphParts)),result=planMission(snapshot,copy(b.groups),copy(b.policy)),plan=simPlanFromExport(result),s={plan,config:copy(b.config),durations:copy(b.durations),incidents:[]};
  assert.equal(plan.units.length,e.units);assert.equal(plan.source.prerequisiteEvidence.version,e.evidenceVersion);assert.deepEqual(plan.source.prerequisiteEvidence.planDocument,result.plan);
  const producer=plan.units.find(u=>u.ownedFunctionIds.includes(b.producerFunctionId)).unitId,consumer=plan.units.find(u=>u.ownedFunctionIds.includes(b.consumerFunctionId)).unitId,sourceBefore=fingerprint(plan.source);assert.deepEqual(validateSimPlan(plan),[]);
  const r=runScenario(s);assert.equal(r.store.committedCount,e.commits);assert.equal(commitTick(r,producer),e.producerCommit);assert.equal(commitTick(r,consumer),e.consumerCommit);assert.equal(r.metrics.makespan,e.makespan);assert.equal(r.metrics.totalWorkTicks,e.work);assert.equal(fingerprint(plan.source),sourceBefore);
  E7={scenario:s,result:r,producer,consumer};return {producer,consumer,archiveVersion:plan.source.prerequisiteEvidence.version,...view(r),sourceStable:true};
});
check("M08",()=>{
  assert(E7,"M07 declared export required");const e=exp("M08"),s=copy(E7.scenario),u=s.plan.units.find(u=>u.unitId===E7.consumer),need=u.prerequisites.find(p=>p.producerUnitId===E7.producer);assert(need.requirement,"declared local need exists");delete need.requirement;const sourceBefore=fingerprint(s.plan.source),before=JSON.stringify(s);
  assert.equal(validateSimPlan(s.plan).length,e.diagnostics);const r=runScenario(s);assert.equal(r.store.committedCount,e.commits);assert.equal(commitTick(r,E7.producer),e.producerCommit);assert.equal(unitState(r,E7.consumer).state,e.consumerState);assert.equal(unitState(r,E7.consumer).attempts,e.consumerAttempts);assert.equal(r.metrics.publicationEndTick,e.publicationEnd);assert.equal(r.metrics.occupiedWorkerTicks,e.occupied);assert.equal(fingerprint(s.plan.source),sourceBefore);assert.equal(JSON.stringify(s),before);
  return {...view(r),sourceStable:true};
});
check("M09",()=>{
  assert(E7,"M07 declared export required");const e=exp("M09"),s=copy(E7.scenario);s.plan.source.prerequisiteEvidence.version=1;let calls=0;s.durations=()=>{calls++;return {A:2,B:5,R:3};};
  const diagnostics=validateSimPlan(s.plan);assert(diagnostics.some(d=>d.code==="unsupported_prerequisite_provenance"));const error=refuse(()=>runScenario(s),e.globalError);assert.equal(calls,e.callbackCallsBeforeRefusal);
  const shape=planShape(s.plan,s.durations,s.config.validationTicks);assert.equal(shape.criticalPathTicks,e.shapeCritical);const j=captureReplayJournal(s,E7.result);assert.equal(j.scenario.plan.source.prerequisiteEvidence.version,e.capturedLegacyVersion);assert.equal(j.expectedTraceHash,E7.result.traceHash);assert.equal(calls,e.totalCallbackCalls);
  return {globalRefusal:error,shape,callbackCalls:calls,capturedVersion:j.scenario.plan.source.prerequisiteEvidence.version,suppliedExpectedHashOnly:true,legacyJournalOutputNotReplayed:true};
});
check("M10",()=>{
  const e=exp("M10"),s=shared("M10"),engine=new SimEngine(s);engine.runUntil(2);const before=engine.observe();assert.equal(before.metrics.occupiedWorkerTicks,e.heldAt2);assert.equal(unitState(before,"B").dispatchTick,null);
  const r=engine.run();assert.equal(unitState(r,"A").attempts,e.attemptsA);assert.equal(unitState(r,"B").attempts,e.attemptsB);assert.equal(r.store.getCommit("A"),undefined);assert.equal(unitState(r,"B").dispatchTick,e.peerDispatch);assert.equal(commitTick(r,"B"),e.peerCommit);assert.equal(r.metrics.publicationEndTick,e.publicationEnd);assert.equal(r.metrics.occupiedWorkerTicks,e.occupied);assert.equal(r.metrics.usefulWorkerTicks,e.useful);assert.equal(r.metrics.reworkWorkerTicks,e.rework);assert.equal(r.metrics.reworkAttempts,e.reworkAttempts);
  const reserve=engine.tryReserve("A",s.config.controllerId,engine.tick);assert.equal(reserve.ok,false);assert(reserve.reason.startsWith("requires_new_immutable_plan:"));assert.equal(unitState(engine.observe(),"A").attempts,1);return {...view(r),laterReserve:reserve};
});
check("M11",()=>{
  const e=exp("M11"),s=shared("M11"),r=runScenario(s);assert.equal(unitState(r,"A").attempts,e.attemptsA);assert.equal(unitState(r,"B").attempts,e.attemptsB);assert.equal(commitTick(r,"A"),e.commitA);assert.equal(unitState(r,"B").dispatchTick,e.peerDispatch);assert.equal(commitTick(r,"B"),e.peerCommit);assert.equal(r.metrics.makespan,e.makespan);assert.equal(r.metrics.occupiedWorkerTicks,e.occupied);assert.equal(r.metrics.usefulWorkerTicks,e.useful);assert.equal(r.metrics.reworkWorkerTicks,e.rework);assert.equal(r.store.committedCount,e.publications);
  const duplicate=refuse(()=>r.store.write(r.store.getCommit("A"),r.metrics.makespan),e.duplicateCommitError);assert.equal(r.store.committedCount,e.publications);assert.equal(r.store.getCommit("A").publicationLevel,1);return {...view(r),duplicate};
});
check("M12",()=>{
  const e=exp("M12"),r=runScenario(shared("M12"));assert.equal(unitState(r,"A").attempts,e.attemptsA);assert.equal(unitState(r,"B").attempts,e.attemptsB);assert.deepEqual(r.decisions.filter(d=>d.unitId==="A").map(d=>d.t),e.AAdmissionTicks);assert.deepEqual(r.decisions.filter(d=>d.unitId==="B").map(d=>d.t),e.BAdmissionTicks);assert.equal(commitTick(r,"A"),e.commitA);assert.equal(commitTick(r,"B"),e.commitB);assert.equal(r.metrics.makespan,e.makespan);assert.equal(r.metrics.occupiedWorkerTicks,e.occupied);assert.equal(r.metrics.usefulWorkerTicks,e.useful);assert.equal(r.metrics.reworkWorkerTicks,e.rework);assert.equal(r.metrics.reworkAttempts,e.reworkAttempts);assert.equal(r.store.committedCount,e.publications);return view(r);
});
assert.equal(PLAN.cases.length,12);assert.deepEqual(results.map(r=>r.id),PLAN.cases.map(c=>c.id));
const report={kind:"probe_summary",declaredCases:12,executedCases:results.length,passed:results.filter(r=>r.status==="pass").length,failed:results.filter(r=>r.status==="fail").length,maxUnitsPerFixture:2,newDatabases:0,newPorts:0,scenarioVariantsFullyDeclared:true,limits:PLAN.limits};
console.log(JSON.stringify(report));process.exitCode=report.failed?1:0;
