import fs from 'node:fs';
import crypto from 'node:crypto';
import {Service} from 'file:///C:/Users/djden/source/repos/opencode-ensemble-session/node_modules/@opencode/client/dist/promise/service.js';
const root='docs/missions/ff8-decomp-semantics-2026-10-11-run01';
const specs=JSON.parse(fs.readFileSync(process.argv[2]==='--stdin'?0:process.argv[2],'utf8'));
const ep=await Service.discover();if(!ep)throw Error('No healthy service, never start');
const headers=Service.headers(ep);fs.mkdirSync(root+'/session-receipts',{recursive:true});
const results=[];
for(const x of specs){
  const r=await fetch(ep.url+'/api/session/'+x.session,{headers});if(!r.ok)throw Error('HTTP '+r.status+' '+x.name);
  const raw=await r.text(),j=JSON.parse(raw).data;
  const split=x.model.indexOf('/'),provider=x.model.slice(0,split),id=x.model.slice(split+1);
  if(j.model.providerID!==provider||j.model.id!==id||j.model.variant!==x.variant)throw Error('Model.Ref mismatch '+x.name);
  const dest=root+'/session-receipts/'+x.name+'.native.json';
  if(fs.existsSync(dest))throw Error('Immutable receipt already exists '+x.name);
  fs.writeFileSync(dest,raw,'utf8');
  let projection;
  if(x.context?.mode==='checkpoint'||x.context?.mode==='fork'){
    const r=await fetch(ep.url+'/api/session/'+x.session+'/message?limit=100&order=asc',{headers});if(!r.ok)throw Error('History HTTP '+r.status);
    projection=await r.json();
    if(x.context.mode==='checkpoint'&&projection.data.some(m=>m.id===x.context.messageID))throw Error('Exclusive boundary leaked '+x.name);
    fs.writeFileSync(root+'/session-receipts/'+x.name+'.projection.native.json',JSON.stringify(projection,null,2)+'\n','utf8');
  }
  const e={at_utc:new Date().toISOString(),event:'SESSION_ADMISSION_VERIFIED',...x,model_ref:j.model,outcome:j.outcome??null,artifact:'session-receipts/'+x.name+'.native.json',sha256:crypto.createHash('sha256').update(raw).digest('hex'),checkpoint_excluded:x.context?.mode==='checkpoint'?true:null};
  fs.appendFileSync(root+'/ledger.jsonl',JSON.stringify(e)+'\n','utf8');results.push({name:x.name,model_ref:j.model,outcome:j.outcome??null});
}
console.log(JSON.stringify({verified:results.length,sessions:results}));
