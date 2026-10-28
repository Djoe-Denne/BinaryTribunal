import { canonical } from "C:/Users/djden/source/repos/retro-eng/re-ff8/inputs/L8_A2_RUNTIME15_REVIEW_20261016/tools/ff8-harness/src/validation.ts";
import { test, expect } from "bun:test";
import { ExecutionClient } from "C:/Users/djden/source/repos/retro-eng/re-ff8/inputs/L8_A2_RUNTIME15_REVIEW_20261016/tools/ff8-harness/src/client.ts";
import { fixturePath, preserveFixture, graphHarness, preparationV2, snapshotFixture } from "C:/Users/djden/source/repos/retro-eng/re-ff8/inputs/L8_A2_RUNTIME15_REVIEW_20261016/tools/ff8-harness/test/graph-integration/fixture-driver.ts";

for (const mutate of [false, true]) test("independent client body is snapshotted before awaited RPC (mutate=" + mutate + ")", async () => {
  const db = fixturePath(), sent: Array<{prompt: unknown; id: unknown}> = [];
  const input: Record<string, unknown> = {idempotencyKey: "review-exec-1", executionId: "review-exec-1", prompt: "ORIGINAL_REVIEW_BODY"};
  const client = new ExecutionClient({statePath:db,directory:"offline-review-fixture",principalId:"review-fixture-principal",controllerId:"review-controller",teamName:"review-fixture-team",leaseMs:1000,maxRunning:1,token:()=>"review-fixture-token",transport:{async call(method, body){
    if(method === "capabilities") return {version:1,capabilities:{rpc:"ensemble.execution.v1",fresh:true,replay:true}};
    if(method === "ensureTeam") return {version:1,revision:1};
    if(method === "snapshot") { if(mutate) input.prompt="MUTATED_DURING_SNAPSHOT"; return {version:1,revision:1,admissions:{controllerId:"review-controller",leaseUntil:Date.now()+60000},executions:[]}; }
    if(method === "submit") {sent.push({prompt:body.prompt,id:body.executionId});return {version:1,revision:2,executionId:body.executionId,state:"accepted"};}
    throw new Error("unexpected fake RPC "+method);
  }}});
  try {await client.ensure("review-client-body");const a=await client.submit("review-client-body",input);input.prompt="ORIGINAL_REVIEW_BODY";const b=await client.submit("review-client-body",input);
    console.log("REVIEW_CLIENT_BODY "+JSON.stringify({mutate,db,sent,retrySameReceipt:canonical(a)===canonical(b)}));
    expect(sent).toEqual([{prompt:"ORIGINAL_REVIEW_BODY",id:"review-exec-1"}]);expect(b).toEqual(a);
  } finally {client.close();preserveFixture(db);}
});

test("independent pause before any admission submits nothing", async()=>{
  const h=graphHarness(preparationV2(snapshotFixture(1),1));try {h.start();h.runtime.pause();const v=await h.step();console.log("REVIEW_PAUSE_FRESH "+JSON.stringify({path:h.path,status:v.status,submits:h.host.submissions.length}));expect(v.status).toBe("paused");expect(h.host.submissions.length).toBe(0);}finally{h.close();}
});

test("independent pause blocks a PREPARED recoverable retry until resume",async()=>{
  const h=graphHarness(preparationV2(snapshotFixture(1),1));try {h.start();h.host.submissionFailures.push("quota");await h.step();const before=h.host.submissions.length,ids=h.host.submissions.map(s=>s.command.executionId);const beforeAdmission=h.runtime.options.graph.admission(String(ids[0]))?.state;h.runtime.pause();h.advance(1000);const v=await h.step();const after=h.host.submissions.length,afterAdmission=h.runtime.options.graph.admission(String(ids[0]))?.state;
    console.log("REVIEW_PAUSED_RETRY "+JSON.stringify({path:h.path,before,after,beforeAdmission,afterAdmission,acceptedFixtureReceipts:h.host.receipts.size,status:v.status,idsBefore:ids,idsAfter:h.host.submissions.map(s=>s.command.executionId)}));expect(before).toBe(1);expect(v.status).toBe("paused");expect(after).toBe(before);
  }finally{h.close();}
});
