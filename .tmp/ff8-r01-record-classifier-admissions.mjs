import fs from 'node:fs';
import crypto from 'node:crypto';
import {Service} from 'file:///C:/Users/djden/source/repos/opencode-ensemble-session/node_modules/@opencode/client/dist/promise/service.js';
const root='docs/missions/ff8-decomp-semantics-2026-10-11-run01';
const specs=JSON.parse(fs.readFileSync('.tmp/ff8-r01-classifier-admissions.json','utf8'));
const ep=await Service.discover();if(!ep)throw Error('No healthy discovered service; no start');const headers=Service.headers(ep);
fs.mkdirSync(root+'/classifier-admissions',{recursive:true});
const rows=[];
for(const [group,id,task] of specs){
  const res=await fetch(ep.url+'/api/session/'+id,{headers});if(!res.ok)throw Error('Native readback HTTP '+res.status);
  const raw=await res.text();const info=JSON.parse(raw).data;
  if(info.model.providerID!=='openai'||info.model.id!=='gpt-6.1-sol'||info.model.variant!=='medium')throw Error('Model.Ref mismatch '+group);
  const artifact='classifier-admissions/'+group+'.native.json';if(fs.existsSync(root+'/'+artifact))throw Error('Immutable receipt exists '+group);
  fs.writeFileSync(root+'/'+artifact,raw,'utf8');
  const e={at_utc:new Date().toISOString(),event:'CLASSIFIER_ADMISSION_NATIVE_READBACK',group,task_id:task,session_id:id,source:'discover-'+group,model_ref:info.model,outcome:info.outcome??null,artifact,sha256:crypto.createHash('sha256').update(raw).digest('hex')};
  fs.appendFileSync(root+'/ledger.jsonl',JSON.stringify(e)+'\n','utf8');rows.push(e);
}
fs.writeFileSync(root+'/classifier-admissions.json',JSON.stringify(rows,null,2)+'\n','utf8');
console.log(JSON.stringify({additional_classifiers:rows.length,readbacks_verified:rows.length,failed:rows.filter(x=>x.outcome==='failed').map(x=>x.group)}));
