import fs from 'node:fs';
import crypto from 'node:crypto';
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const root='docs/missions/ff8-decomp-semantics-2026-10-11-run01';
const events=fs.readFileSync(root+'/ledger.jsonl','utf8').replace(/^\uFEFF/,'').trim().split('\n').map(x=>JSON.parse(x));
const assigned=new Set(events.filter(x=>x.event==='SESSION_ADMISSION_VERIFIED').map(x=>x.task));
const blocked=new Set();
for(const e of events){
 if((e.event==='ADMISSION_GATE_BLOCKED'||e.event==='DISCOVERY_COMPLETION_ADMISSION_GATE')&&e.admission_blocked!==false)for(const ea of e.ea_list||[e.ea])if(ea)blocked.add(ea);
 if(e.event==='ADMISSION_GATE_LIFTED')for(const ea of e.ea_list||[e.ea])blocked.delete(ea);
}
const pending=new Set(input.pending),selection=[];
for(const e of events.filter(x=>x.event==='PRODUCTION_TASKS_QUEUED')){
 if(blocked.has(e.ea))continue;
 for(const x of e.authors){
  if(assigned.has(x.task)||!pending.has(x.task))continue;
  if(x.model.startsWith('opencode/')||x.model.startsWith('zai-coding-plan/'))throw Error('Unsupported current admission route '+x.model);
  selection.push(x);
  if(selection.length===35)break;
 }
 if(selection.length===35)break;
}
if(selection.length!==35)throw Error('Only '+selection.length+' eligible requested tasks');
const file='.tmp/ff8-r01-selected-35.json';if(fs.existsSync(file))throw Error('Selection already exists, do not reselect');
fs.writeFileSync(file,JSON.stringify(selection,null,2)+'\n','utf8');
fs.appendFileSync(root+'/ledger.jsonl',JSON.stringify({at_utc:new Date().toISOString(),event:'USER_REQUEST_SELECT_35_READY_TASKS',selected_tasks:selection.map(x=>x.task),selection:file,selection_sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),observed_active_workers:input.active,max_active_workers:24,launch_budget_first_wave:Math.max(0,24-input.active),blocked_eas:[...blocked],scope:'current original98EA only; dependency-ready parent-approved author tasks, no second classifications'})+'\n','utf8');
console.log(JSON.stringify({selected:selection.length,active_before:input.active,first_wave_budget:24-input.active,functions:[...new Set(selection.map(x=>x.ea))],blocked_eas:[...blocked]}));
