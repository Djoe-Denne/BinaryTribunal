// Parent static arguments only: no import of runtime, OWN creation, lease or POST.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const out=join(root,'operational-preparation-168');
const need=(v,m)=>{if(!v)throw Error(m);};
const pin=p=>{const b=readFileSync(p);return{path:p,byteLength:b.length,sha256:createHash('sha256').update(b).digest('hex')};};
need(!existsSync(out),'Static namespace exists; preserve, no overwrite');
const request=JSON.parse(readFileSync(join(root,'qa-local-materializer-166/request.json'),'utf8'));
const suffix=randomUUID().replaceAll('-','');
request.purpose='operational';
Object.assign(request.scope,{
  ownNamespace:join(root,'operational-168-own'),ownFileName:'operational-own.sqlite',
  outputDirectory:join(root,'operational-168-output'),
  controllerId:'parent-rms-operation-168-'+suffix,
  principalId:'parent-rms-mission-team_mvshkwxs_000t_2fkx8e',actorId:'parent-operational-168-'+suffix,
  sessionId:'ses_rms168_'+suffix,messageId:'msg_rms168_'+suffix,
  permitId:'permit-rms168-'+suffix,originId:'origin-rms168-'+suffix,
  leaseMs:300000,expiresAt:0,minRemainingMs:120000
});
need(!existsSync(request.scope.ownNamespace)&&!existsSync(request.scope.outputDirectory),'Operational resource exists; no adoption');
const api=JSON.parse(readFileSync(request.pins.openapi.path,'utf8'));
need(new RegExp(api.components.schemas['Session.ID'].pattern).test(request.scope.sessionId)
  &&new RegExp(api.components.schemas['Session.Message.ID'].pattern).test(request.scope.messageId),'Native ID schema differs');
for(const p of [request.pins.sourceManifest,request.pins.intention,request.pins.firstReceipt,
  ...Object.values(request.pins.firstFiles),request.pins.permissions,request.pins.preflightDecision,
  request.pins.permissionsReceipt,...request.pins.compositionSources,request.pins.catalog,
  request.pins.processObservation,request.pins.mandate,request.pins.openapi,request.pins.productManifest,
  request.serverSource.artifactPin,request.serverSource.provenancePin,request.serverSource.decisionPin]){
  const actual=pin(p.path);need(actual.sha256===p.sha256&&actual.byteLength===p.byteLength,'Static input changed: '+p.path);
}
const plan={version:'rms-parent-operational-arguments-plan-v1',status:'STATIC_ONLY_NOT_EXECUTABLE_UNTIL_FRESH_IDENTITY_AND_DEADLINE',
  runtimeCommit:'340386a9926f8afafc6dab6fe08f9a237afb2c75',
  requestTemplate:'request-template.json',
  requiredBeforeStage:['Fresh native service PID/version and independent executable observation; retain new process pin',
    'Freeze final absolute expiresAt immediately before one stage call, never extend or recreate failed state'],
  actionsInOrder:['one local materializer call','independent exact files/OWN/fences/readback',
    'direct parent client.ts native-qualify inspect-inputs','direct parent preflight',
    'direct parent authorize-root','read durable root decision',
    'direct parent grant','read durable permit decision','direct parent prepare',
    'read durable preparation and counted origin before any POST',
    'separate submit only after prerequisites; ambiguous response reconciled by exact identifiers, never new prompt'],
  nonAdoption:{qa166:'preserved, never adopt; expired controller and QA fences stay historical',
    historicalCanary:'not awakened, not assigned arbitrary zero/one RMS origin',
    sourceV3:'fixture/non-oracle and historical782 pin unchanged'},
  allocation:{role:'A',capUtf8Bytes:262144,acquiredUtf8Bytes:262144,maxOriginsIncludingBootstrap:3,
    originAccounting:'first committed native prepare counts prospectively; no copy resets history'},
  permissionMeaning:'session deny-all; declarations not tool-enforcement proof',
  forbidden:['recreate QA166','init/reacquire after stage','automatic retry','second prompt on ambiguous admission',
    'HOLD125/threads/four-origins/frozen diagnostic/scientific rerun','implicit B/R authority']};
mkdirSync(out);
for(const [name,obj]of [['request-template.json',request],['plan.json',plan]]){
  const p=join(out,name),bytes=Buffer.from(JSON.stringify(obj,null,2)+'\n');writeFileSync(p,bytes,{flag:'wx'});
  need(readFileSync(p).equals(bytes),'Exact static readback differs');
}
console.log(JSON.stringify({status:plan.status,files:['request-template.json','plan.json'].map(n=>pin(join(out,n))),
  sessionId:request.scope.sessionId,messageId:request.scope.messageId,ownCreated:false,leaseAcquired:false,nativeEffects:0}));
