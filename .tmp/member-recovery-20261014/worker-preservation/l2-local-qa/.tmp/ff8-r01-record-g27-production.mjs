import fs from 'node:fs';
import crypto from 'node:crypto';
import {Service} from 'file:///C:/Users/djden/source/repos/opencode-ensemble-session/node_modules/@opencode/client/dist/promise/service.js';
const root='docs/missions/ff8-decomp-semantics-2026-10-11-run01';
const folder='outputs/ff8-decomp-semantics-20261011-r01/classification/g27';
const routing=JSON.parse(fs.readFileSync(folder+'/routing.json','utf8'));
const route=routing.routes[0];
const events=[{at_utc:new Date().toISOString(),event:'CLASSIFICATION_ACCEPTED',group:'g27',ea:'0x50BF90',manifest:folder+'/routing.json',manifest_sha256:crypto.createHash('sha256').update(fs.readFileSync(folder+'/routing.json')).digest('hex'),request:JSON.parse(fs.readFileSync(route.request,'utf8')),response:JSON.parse(fs.readFileSync(route.response,'utf8')),checks:['input hashes','exact prepared payload','complete native evidence','PE/native/freeze equality'],protocol:'2+1 per volet',source:'discover-g27',checkpoint:'msg_12be31170001b3JqulokpGSCsD',checkpoint_exclusive:true,parent_override:'conservative exclusion before historical target path/annotation search; common factual compaction provided separately'}];
const specs=[
['c-a-g27','task_mv43m017_004a_j8eja1','ses_ed3fb725affeSP4CX39Mq2Ie1U','openai','gpt-6-astra'],
['sem-a-g27','task_mv43m01a_004c_g0vwc9','ses_ed3fb70f5ffeSQr1yrXUrHqSKU','openai','gpt-6.1-sol'],
['sem-b-g27','task_mv43m01b_004d_sm4hit','ses_ed3fb6ea7ffeJJy2Sc7uxpDVdE','openai','gpt-6.1-sol'],
['c-b-g27','task_mv43m019_004b_lzlnoz','ses_ed3fb6c81ffeV7SfJQSVTFzNyQ','opencode','claude-opus-5-5'],
];
const ep=await Service.discover();if(!ep)throw Error('No healthy discovered service; no start');const headers=Service.headers(ep);
fs.mkdirSync(root+'/production-admissions',{recursive:true});
for(const [role,task_id,id,providerID,modelID] of specs){
  const res=await fetch(ep.url+'/api/session/'+id,{headers});if(!res.ok)throw Error('Readback HTTP '+res.status);const raw=await res.text();const info=JSON.parse(raw).data;
  if(info.model.providerID!==providerID||info.model.id!==modelID||info.model.variant!=='high')throw Error('Model.Ref mismatch '+role);
  const artifact='production-admissions/'+role+'.native.json';if(fs.existsSync(root+'/'+artifact))throw Error('Immutable receipt exists '+role);fs.writeFileSync(root+'/'+artifact,raw,'utf8');
  const msgs=await fetch(ep.url+'/api/session/'+id+'/message?limit=100&order=asc',{headers});if(!msgs.ok)throw Error('History read HTTP '+msgs.status);const projection=await msgs.json();
  if(projection.data.some(m=>m.id==='msg_12be31170001b3JqulokpGSCsD'))throw Error('Exclusive checkpoint message leaked '+role);
  fs.writeFileSync(root+'/production-admissions/'+role+'.projection.native.json',JSON.stringify(projection,null,2)+'\n','utf8');
  events.push({at_utc:new Date().toISOString(),event:'PRODUCTION_ADMISSION',group:'g27',ea:'0x50BF90',role,task_id,session_id:id,model_ref:info.model,source:'discover-g27',checkpoint:'msg_12be31170001b3JqulokpGSCsD',checkpoint_exclusive:true,excluded_boundary_absent_in_native_projection:true,artifact,sha256:crypto.createHash('sha256').update(raw).digest('hex'),outcome:info.outcome??null});
}
events.push({at_utc:new Date().toISOString(),event:'RECONCILIATION_QUEUED',group:'g27',C:{task_id:'task_mv43oaoe_004e_8246ge',depends_on:['task_mv43m017_004a_j8eja1','task_mv43m019_004b_lzlnoz']},semantics:{task_id:'task_mv43oaoi_004f_7wsgop',depends_on:['task_mv43m01a_004c_g0vwc9','task_mv43m01b_004d_sm4hit']},spawned:false});
for(const event of events)fs.appendFileSync(root+'/ledger.jsonl',JSON.stringify(event)+'\n','utf8');
console.log(JSON.stringify({group:'g27',authors:specs.length,readbacks:'verified high',native_checkpoint_projection:'excluded boundary absent',R:'queued, not spawned',failed_at_readback:events.filter(x=>x.outcome==='failed').map(x=>x.role)}));
