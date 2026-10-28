import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Service} from 'file:///C:/Users/djden/source/repos/opencode-ensemble-session/node_modules/@opencode/client/dist/promise/service.js';
const root='docs/missions/ff8-decomp-semantics-2026-10-11-run01';
const events=fs.readFileSync(root+'/ledger.jsonl','utf8').replace(/^\uFEFF/,'').trim().split('\n').map(x=>JSON.parse(x));
const admissions=events.filter(x=>x.event==='SESSION_ADMISSION_VERIFIED'||x.event==='PRODUCTION_ADMISSION');
const ep=await Service.discover();if(!ep)throw Error('No healthy native service');const headers=Service.headers(ep);
const native=new Map();
for(const a of admissions.filter(x=>x.ea&&x.role!=='R')){
 const id=a.session||a.session_id;if(!id||native.has(id))continue;
 const res=await fetch(ep.url+'/api/session/'+id,{headers});if(!res.ok)throw Error('Native read HTTP '+res.status);native.set(id,(await res.json()).data);
}
const ready=[],waiting=[];
for(const q of events.filter(x=>x.event==='RECONCILIATION_QUEUED'||x.event==='PRODUCTION_TASKS_QUEUED')){
 const specs=q.R||(['C','semantics'].filter(v=>q[v]).map(v=>({volet:v==='semantics'?'semantic':v,task:q[v].task_id,depends_on:q[v].depends_on,model:'openai/gpt-6.1-sol',variant:'high'})));
 for(const s of specs){
  const volet=s.volet,ea=q.ea||(q.group==='g27'?'0x50BF90':null);if(!ea)continue;
  if(admissions.some(x=>x.ea===ea&&x.role==='R'&&x.volet===volet))continue;
  const stem=volet==='C'?'c':'semantic',group=q.group;
  const candidates=(q.authors||admissions).filter(x=>(x.ea===ea||q.authors)&&((x.volet===volet)||(!x.volet&&x.role?.startsWith(volet==='C'?'C':'semantic'))));
  const authors=['A','B'].map(role=>{
   const x=candidates.find(x=>x.role===role||x.role===`${volet} ${role}`||x.role===`${volet==='C'?'C':'semantic'} ${role}`||x.name?.startsWith(`${volet==='C'?'c':'sem'}-${role.toLowerCase()}-`));
   const admission=x&&(admissions.find(a=>a.task===x.task||a.task_id===x.task||a.name===x.name)||x);
   return {role,spec:x,admission};
  });
  const problems=[];
  for(const a of authors){
   const file=`outputs/ff8-decomp-semantics-20261011-r01/production/${group}/${ea}/${stem}_${a.role.toLowerCase()}.md`;
   a.file=file;const id=a.admission?.session||a.admission?.session_id;a.session=id;
   if(!id||!native.has(id)){problems.push(a.role+' admission missing');continue;}
   if(native.get(id).outcome!=='succeeded')problems.push(a.role+' outcome '+(native.get(id).outcome??'running'));
   if(!fs.existsSync(file)||fs.statSync(file).size<500)problems.push(a.role+' deposited output absent/too short');
   else if(volet==='C'&&!/```(?:c|cpp|C)\b/.test(fs.readFileSync(file,'utf8')))problems.push(a.role+' no C code block');
  }
  if(problems.length){waiting.push({ea,group,volet,problems});continue;}
  if(authors[0].session===authors[1].session)throw Error('A/B independence fail '+ea);
  const dest=`inputs/ff8-decomp-semantics-20261011-r01/reconciliation/${group}/${ea}/${volet}`;fs.mkdirSync(dest,{recursive:true});
  const files=[];
  const copy=(src,name)=>{const b=fs.readFileSync(src),target=path.join(dest,name);if(fs.existsSync(target)){if(!fs.readFileSync(target).equals(b))throw Error('Frozen artifact changed '+target);}else fs.writeFileSync(target,b);files.push({file:name,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});};
  for(const a of authors)copy(a.file,path.basename(a.file));
  const base=`inputs/ff8-decomp-semantics-20261011-r01/${group}`;copy(base+'/common-compaction.md','common-compaction.md');copy(base+'/'+ea+'.json',ea+'.json');
  const readable=base+'/'+ea+'.readable';
  for(const f of fs.readdirSync(readable))copy(readable+'/'+f,'native-'+f);
  const manifest={ea,group,volet,authors:authors.map(a=>({role:a.role,session:a.session,task:a.spec?.task||a.admission.task||a.admission.task_id,model_ref:native.get(a.session).model,file:path.basename(a.file)})),files,scope:'deposited independently authored candidates only; not final RE acceptance'};
  const mf=dest+'/manifest.json';if(!fs.existsSync(mf))fs.writeFileSync(mf,JSON.stringify(manifest,null,2)+'\n','utf8');
  ready.push({ea,group,volet,task:s.task||s.task_id,depends_on:s.depends_on,model:s.model||'openai/gpt-6.1-sol',variant:s.variant||'high',name:(volet==='C'?'c':'sem')+'-r-'+ea.slice(2).toLowerCase(),input:dest,output:`outputs/ff8-decomp-semantics-20261011-r01/production/${group}/${ea}/${stem}_r.md`});
 }
}
fs.writeFileSync('.tmp/ff8-r01-ready-R.json',JSON.stringify(ready,null,2)+'\n','utf8');
console.log(JSON.stringify({ready:ready.length,ready_tasks:ready.map(x=>({ea:x.ea,volet:x.volet,task:x.task})),waiting:waiting.slice(0,15),waiting_count:waiting.length}));
