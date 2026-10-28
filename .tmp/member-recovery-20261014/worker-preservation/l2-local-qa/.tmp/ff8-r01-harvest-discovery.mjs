import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Service} from 'file:///C:/Users/djden/source/repos/opencode-ensemble-session/node_modules/@opencode/client/dist/promise/service.js';
const root='docs/missions/ff8-decomp-semantics-2026-10-11-run01';
const admissions=JSON.parse(fs.readFileSync(root+'/admissions.json','utf8'));
const groups=JSON.parse(fs.readFileSync(root+'/native-groups.json','utf8')).groups;
const ep=await Service.discover();if(!ep)throw Error('No healthy discovered service; no start');
const headers=Service.headers(ep);
const dest=root+'/discovery-harvest';fs.mkdirSync(dest,{recursive:true});
const records=[];
for(const a of admissions){
  const sr=await fetch(ep.url+'/api/session/'+a.session_id,{headers});if(!sr.ok)throw Error('Native session read HTTP '+sr.status);
  const session=(await sr.json()).data;
  const mr=await fetch(ep.url+'/api/session/'+a.session_id+'/message?limit=100&order=asc',{headers});if(!mr.ok)throw Error('Native messages read HTTP '+mr.status+' '+(await mr.text()).slice(0,600));
  const messages=await mr.json();
  const raw=JSON.stringify({at_utc:new Date().toISOString(),session,messages},null,2)+'\n';
  const receipt=dest+'/'+a.group+'.source.native.json';if(fs.existsSync(receipt))throw Error('Immutable harvest exists '+a.group);
  fs.writeFileSync(receipt,raw,'utf8');
  const reports=[];
  for(const m of messages.data||[]){
    for(const c of m.content||[]){
      if(c.type!=='tool'||c.state?.status!=='completed')continue;
      const input=c.state.input||{};
      const code=input.code||'';
      const text=c.name==='team_message'?input.text:(code.includes('tools.team_message')?code:'');
      if(!text||!text.includes('COMMON_COMPACTION'))continue;
      const d=text.match(/<details>\s*([\s\S]*?)\s*<\/details>/);
      if(d&&d[1].includes('COMMON_COMPACTION'))reports.push({message:m.id,compaction:d[1],time:m.time?.created});
    }
  }
  reports.sort((a,b)=>b.time-a.time);
  const errors=(messages.data||[]).filter(m=>m.error).map(m=>({message:m.id,error:m.error}));
  const found=reports[0];
  if(found)fs.writeFileSync(dest+'/'+a.group+'.common-compaction.md',found.compaction+'\n','utf8');
  const row={group:a.group,session_id:a.session_id,source:a.group==='g11'?'discover-g11-zai':'discover-'+a.group,outcome:session.outcome??null,report_found:!!found,report_message:found?.message??null,receipt:'discovery-harvest/'+a.group+'.source.native.json',receipt_sha256:crypto.createHash('sha256').update(raw).digest('hex'),compaction:found?'discovery-harvest/'+a.group+'.common-compaction.md':null,errors,eas:groups.find(g=>g.id===a.group).eas};
  records.push(row);
  fs.appendFileSync(root+'/ledger.jsonl',JSON.stringify({at_utc:new Date().toISOString(),event:'DISCOVERY_HARVEST',...row})+'\n','utf8');
}
fs.writeFileSync(root+'/discovery-harvest.json',JSON.stringify(records,null,2)+'\n','utf8');
console.log(JSON.stringify({groups:records.length,ready:records.filter(r=>r.report_found&&r.outcome==='succeeded').map(r=>r.group),missing_reports:records.filter(r=>!r.report_found).map(r=>({group:r.group,outcome:r.outcome,errors:r.errors.map(e=>({type:e.error.type,status:e.error.status,message:e.error.message}))}))}));
