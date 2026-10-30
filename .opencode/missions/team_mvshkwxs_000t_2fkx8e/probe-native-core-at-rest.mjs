// Parent-only, one owned admission-data canary. NEVER wake or execute the prompt.
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {Service} from '../../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
const R=path.resolve(import.meta.dirname,'../../..'),E=path.join(import.meta.dirname,'evidence');
const root=path.join(E,'native-core-at-rest-r1');
if(fs.existsSync(root))throw Error('Canary already reserved; never retry with a new identity');
const sha=b=>createHash('sha256').update(b).digest('hex');
function canon(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(canon).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}';}
const need=(ok,code)=>{if(!ok)throw Object.assign(new Error(code),{safeCode:code});};
const nonce=randomBytes(16).toString('hex'),sid='ses_rmsq_'+nonce,mid='msg_rmsq_'+nonce;
const model={providerID:'openai',id:'gpt-6.1-sol',variant:'high'},permissions=[{action:'*',resource:'*',effect:'deny'}];
const policy=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'model-policy.json'),'utf8'));
need(policy.providers.includes(model.providerID)&&policy.models.some(m=>m.id===`${model.providerID}/${model.id}`&&m.reasoningEffort===model.variant&&m.available!==false),'model-not-in-current-catalogue');
const create={id:sid,parentID:null,title:'RMS admission-data qualification; paused, not a work item',agent:'explore',model,location:{directory:R},permissions,metadata:{rmsQualification:{version:'rms-core-at-rest-v1',nonce,executionRequested:false}}};
const prompt={id:mid,text:'RMS admission-only qualification '+nonce+'. Retain this queued message without execution.',metadata:{rmsQualification:{nonce,executionRequested:false}},delivery:'queue',resume:false};
const divergentCreate={...create,title:create.title+' DIVERGENT',metadata:{rmsQualification:{version:'rms-core-at-rest-v1',nonce,executionRequested:false,divergent:true}}};
const divergentPrompt={...prompt,text:'DIVERGENT admission-only qualification '+nonce};
const identity=JSON.parse(fs.readFileSync(path.join(E,'native-service-identity-r1.json'),'utf8'));
fs.mkdirSync(root);
const plan={schema:'rms-native-core-at-rest-plan-v1',ownedSessionId:sid,ownedMessageId:mid,create,prompt,divergentCreate,divergentPrompt,bodyDigests:{create:sha(canon(create)),prompt:sha(canon(prompt)),divergentCreate:sha(canon(divergentCreate)),divergentPrompt:sha(canon(divergentPrompt))},expectedServer:{version:identity.reportedVersion,pid:identity.pid},scope:'One fresh session and one queued user message, no wake/model/tool/execution request, no generation origin or RMS admission',resourcesRetained:true};
fs.writeFileSync(path.join(root,'plan.json'),JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
let endpoint,step='preflight';const steps=[],findings={};
async function request(label,method,route,body,allowed=[200]){
  step=label;const requestRecord={label,method,route,bodySha256:body?sha(canon(body)):null};
  fs.appendFileSync(path.join(root,'requests.jsonl'),JSON.stringify(requestRecord)+'\n');
  const response=await fetch(new URL(route,endpoint.url),{method,headers:{...Service.headers(endpoint),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:canon(body)}:{}),signal:AbortSignal.timeout(20000)});
  const bytes=Buffer.from(await response.arrayBuffer());let raw;try{raw=JSON.parse(bytes.toString('utf8'));}catch{raw=undefined;}
  const observation={label,status:response.status,responseSha256:sha(bytes)};steps.push(observation);
  fs.appendFileSync(path.join(root,'observations.jsonl'),JSON.stringify(observation)+'\n');
  need(allowed.includes(response.status),'unexpected-http-status-'+response.status);
  return{status:response.status,raw,data:raw?.data??raw};
}
function verifySession(s){
  need(s&&s.id===sid,'session-identity-mismatch');
  need(s.parentID==null,'session-not-parentless');
  need(s.agent===create.agent&&canon(s.model)===canon(model),'stored-agent-or-model-mismatch');
  need(s.location?.directory&&path.resolve(s.location.directory).toLowerCase()===R.toLowerCase(),'session-location-mismatch');
  need(canon(s.permissions)===canon(permissions),'stored-permissions-mismatch');
  need(s.title===create.title&&canon(s.metadata)===canon(create.metadata),'session-payload-collision');
  return sha(canon({id:s.id,parentID:s.parentID??null,agent:s.agent,model:s.model,location:{directory:R},permissions:s.permissions,title:s.title,metadata:s.metadata}));
}
let outcome='FAILED_CLOSED',failure;
try{
  endpoint=await Service.discover();need(endpoint,'no-existing-service-no-start');
  const before=(await request('server-before','GET','/api/info')).data;
  need(before?.version===identity.reportedVersion&&before.pid===identity.pid,'server-identity-changed-before-probe');
  await request('owned-id-must-be-absent','GET','/api/session/'+sid,undefined,[404]);
  verifySession((await request('create-first','POST','/api/session',create,[200,201])).data);
  const firstImage=verifySession((await request('read-created','GET','/api/session/'+sid)).data);
  need(verifySession((await request('create-identical','POST','/api/session',create,[200,201])).data)===firstImage,'identical-create-changed-image');
  need(verifySession((await request('create-divergent','POST','/api/session',divergentCreate,[200,201])).data)===firstImage,'divergent-create-replaced-original');
  findings.createIdenticalReturnsOriginal=true;findings.createDivergentReturnsOriginalWithoutReject=true;
  const first=(await request('prompt-first-paused','POST',`/api/session/${sid}/prompt`,prompt,[200,201])).data;
  need(first?.id===mid&&first.sessionID===sid,'prompt-admission-identity-mismatch');
  need(canon(first).includes(prompt.text),'first-admission-does-not-contain-original-text');
  const promptImage=sha(canon(first));
  need(sha(canon((await request('prompt-identical-paused','POST',`/api/session/${sid}/prompt`,prompt,[200,201])).data))===promptImage,'identical-prompt-admission-changed');
  need(sha(canon((await request('prompt-divergent-paused','POST',`/api/session/${sid}/prompt`,divergentPrompt,[200,201])).data))===promptImage,'divergent-prompt-replaced-original');
  findings.promptIdenticalReturnsOriginal=true;findings.promptDivergentReturnsOriginalWithoutReject=true;
  const inbox=(await request('read-paused-inbox','GET',`/api/session/${sid}/inbox`)).data;
  need(Array.isArray(inbox)&&inbox.length===1&&inbox[0].id===mid,'paused-inbox-not-exactly-one-owned-item');
  const assistants=(await request('no-assistant-observed','GET',`/api/session/${sid}/message?limit=10&order=desc&type=assistant`)).data;
  need(Array.isArray(assistants)&&assistants.length===0,'unexpected-assistant-message-observed');
  verifySession((await request('read-session-after','GET','/api/session/'+sid)).data);
  const after=(await request('server-after','GET','/api/info')).data;
  need(after?.version===before.version&&after.pid===before.pid,'server-changed-during-probe');
  findings.storedModelIsNotInferenceProof=true;findings.noAssistantObservedAtFinalRead=true;findings.oneQueuedOwnedItem=true;
  outcome='OBSERVED_AT_REST_NOT_EXECUTION_QUALIFIED';
}catch(error){failure={step,code:error?.safeCode??error?.code??'transport-or-decode-error'};}
const result={schema:'rms-native-core-at-rest-result-v1',outcome,ownedSessionId:sid,ownedMessageId:mid,findings,steps,failure,executionRequested:false,wakeCalled:false,interruptCalled:false,resourcesRetained:true,scope:'Native session and paused prompt admission observations only; not worker effective rights, quiescence, native fencing or crash exactly-once qualification'};
fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));if(failure)process.exitCode=1;
