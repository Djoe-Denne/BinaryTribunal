import {strict as assert} from 'node:assert';
import {createDb} from 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-v2-failure-wake-20261017/src/db';
import {MemberRegistry,DescendantTracker} from 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-v2-failure-wake-20261017/src/state';
import {dispatchV2Event} from 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-v2-failure-wake-20261017/src/v2-events';
import {requestLeadWake} from 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-v2-failure-wake-20261017/src/lead-notifications';
import type {PluginClient} from 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-v2-failure-wake-20261017/src/types';
const db=createDb(':memory:'),now=Date.now(),registry=new MemberRegistry(),tracker=new DescendantTracker();
try{
  db.run("INSERT INTO team(id,name,lead_session_id,status,delegate,time_created,time_updated) VALUES ('fixture','fixture','ses_lead','active',0,?,?)",[now,now]);
  db.run("INSERT INTO team_member(team_id,name,session_id,agent,status,execution_status,time_created,time_updated) VALUES ('fixture','author','ses_author','build','busy','running',?,?)",[now,now]);
  registry.register('fixture','author','ses_author');
  const event={id:'evt_node_native_failure',type:'session.execution.failed',data:{sessionID:'ses_author',error:{type:'provider.internal',message:'capacity_limit'}}};
  const failure=dispatchV2Event(db,registry,tracker,event);
  assert.equal(failure?.to,'error');assert.ok(failure?.executionFailure);
  const calls:unknown[]=[];
  const client={session:{promptAsync:async(options:unknown)=>{calls.push(options);return{id:'synthetic_fixture'};}}} as unknown as PluginClient;
  requestLeadWake(client,db,'fixture',failure.executionFailure.reportId);
  await Promise.resolve();
  const replay=dispatchV2Event(db,registry,tracker,event);
  requestLeadWake(client,db,'fixture',replay!.executionFailure!.reportId);
  await Promise.resolve();
  assert.equal(calls.length,1);assert.equal((db.query("SELECT COUNT(*) n FROM team_message").get() as {n:number}).n,1);
  assert.equal(dispatchV2Event(db,registry,tracker,{type:'session.idle',data:{sessionID:'ses_author'}}),undefined);
  dispatchV2Event(db,registry,tracker,{type:'session.execution.started',data:{sessionID:'ses_author'}});
  dispatchV2Event(db,registry,tracker,event);
  assert.equal((db.query("SELECT status FROM team_member WHERE name='author'").get() as {status:string}).status,'busy');
  console.log(JSON.stringify({node:process.version,driver:'node:sqlite',database:':memory:',verdict:'PASS',failureReported:true,singleLeadWake:true,staleReplayCannotCorruptRestart:true,nativeProviderCalls:0}));
}finally{db.close();}
