import fs from 'node:fs';
import path from 'node:path';
import * as a from './ff8-r01-repair-audit-20261012.mjs';
import * as h from './ff8-r01-hardening-20261012.mjs';

const t=await a.state(), group='g17',ea='0x506690';
const baseline=JSON.parse(fs.readFileSync(path.join(h.folder,'baseline.json'),'utf8'));
const routing=JSON.parse(fs.readFileSync(baseline.routingPath,'utf8'));
const base=`inputs/ff8-decomp-semantics-20261011-r01/${group}`;
const out=`outputs/ff8-decomp-semantics-20261011-r01/production/${group}/${ea}`;
const dir=`inputs/ff8-decomp-semantics-20261011-r01/reconciliation/${group}/${ea}/C`;
if(fs.existsSync(path.join(a.root,dir)))throw Error('Never overwrite an R freeze');
const mf=JSON.parse(fs.readFileSync(path.join(a.root,base,ea+'.readable/manifest.json'),'utf8'));
const rel=p=>path.relative(a.root,path.resolve(a.root,p)).replaceAll('\\','/');
const authors=[];
for(const [role,name,id] of [['A','pool-213','task_mv44si5y_00bq_fbrytp'],['B','pool-214','task_mv44si5z_00br_5dw85o']]) {
  const task=t.tasks.find(x=>x.id===id),m=t.members.find(x=>x.name===name);
  if(task.status!=='completed'||task.assignee!==name||!a.inputCheck(task).ok||m.executionStatus!=='idle')throw Error('Author not frozen/complete');
  const s=(await a.native('/api/session/'+m.sessionId)).data;
  const r=routing.members.find(x=>x.session_id===s.id),selected=JSON.parse(r.model_routing).selected;
  if(r.model_override||`${s.model.providerID}/${s.model.id}`!==selected.id||s.model.variant!==selected.reasoningEffort||a.canon(s.location.directory)!==a.canon(a.root))throw Error('Author admission mismatch');
  const d=task.context.decision,source=(await a.native('/api/session/'+d.from+'/context')).data,sc=(await a.native('/api/session/'+d.from)).data;
  if(sc.agent!=='explore'||sc.id===t.leadSessionId||s.fork?.sessionID!==d.from||s.fork?.boundary?.type!=='before'||s.fork.boundary.messageID!==d.messageID)throw Error('Author context mismatch');
  const end=source.findIndex(x=>x.id===d.messageID),c=(await a.native('/api/session/'+s.id+'/context')).data;
  if(end<1||source.slice(0,end).some((x,i)=>JSON.stringify(a.cleanMessage(x))!==JSON.stringify(a.cleanMessage(c[i]))))throw Error('Prefix mismatch');
  const tools=c.slice(end).flatMap(h.toolsOnly),required=[base+'/common-compaction.md',base+'/'+ea+'.readable/manifest.json',...mf.files.map(f=>base+'/'+ea+'.readable/'+f.file)];
  const file='c_'+role.toLowerCase()+'.md',own=out+'/'+file;
  // Historical successful listings expose filenames only, not peer candidates.
  // Keep them in provenance; do not turn this into permission to list new inputs.
  const historicalListings=['inputs/ff8-decomp-semantics-20261011-r01',base,base+'/'+ea+'.readable'];
  if(historicalListings.some(p=>!fs.statSync(path.join(a.root,p)).isDirectory()))throw Error('Listing target changed');
  const allowed=new Set([...required,...historicalListings,base+'/'+ea+'.json','AGENT.md','AGENTS.md','docs/tech/RE_MULTI_PROVIDER_MISSIONS.md',own]);
  const reads=tools.filter(x=>x.name==='read'&&x.status==='completed');
  if(reads.some(x=>!allowed.has(rel(x.input.path))))throw Error('Unexpected successful author read: '+reads.filter(x=>!allowed.has(rel(x.input.path))).map(x=>rel(x.input.path)));
  if(required.some(p=>!reads.some(x=>rel(x.input.path)===p)))throw Error('Missing author input read');
  const other=tools.filter(x=>x.status==='completed'&&!['read','patch'].includes(x.name));
  for(const x of other) {
    if(x.name!=='execute')throw Error('Unreviewed author tool '+x.name);
    const code=x.input.code;
    if(/fetch|require\s*\(|import\s|tools\.(?!team_tasks_complete\b|team_message\b)/.test(code))throw Error('Unexpected author external access');
  }
  const writes=tools.filter(x=>x.name==='patch'&&x.status==='completed');
  let rebuilt=null;
  for(const w of writes) {
    const lines=w.input.patchText.split(/\r?\n/),heads=lines.filter(l=>/^\*\*\* (Add|Update|Delete) File: /.test(l));
    if(heads.length!==1||rel(heads[0].replace(/^\*\*\* (Add|Update|Delete) File: /,''))!==own)throw Error('Unexpected write target');
    if(heads[0].startsWith('*** Add')) {
      if(rebuilt!==null)throw Error('Duplicate Add');
      const start=lines.indexOf(heads[0]),body=[];
      for(const l of lines.slice(start+1)){if(l.startsWith('*** '))break;if(!l.startsWith('+'))throw Error('Unexpected Add syntax');body.push(l.slice(1));}
      rebuilt=body.join('\n')+'\n';
    } else {
      // This author's sole update is the small, independently inspected comment correction.
      if(name!=='pool-214'||!w.input.patchText.includes('same three slots but bit 4 is not cleared.'))throw Error('Unreviewed update');
      const old='/* 506736..506746: same three slots but bit 4 is not cleared. */';
      const replacement='/* 506736..506746: same three slots but mask 0x04 is not cleared. */';
      if(rebuilt?.split(old).length!==2)throw Error('Update old text not unique');
      rebuilt=rebuilt.replace(old,replacement);
    }
  }
  const bytes=fs.readFileSync(path.join(a.root,own));
  if(rebuilt===null||!Buffer.from(rebuilt).equals(bytes))throw Error('Native authored bytes differ from deposited file');
  authors.push({role,member:name,session:s.id,task:id,model_ref:s.model,selected,file,source:own,sha256:a.sha(bytes),bytes:bytes.length,fork:s.fork,checked_input_reads:required.length,successful_read_paths:reads.map(x=>rel(x.input.path)),native_write_tools:writes.map(x=>x.message),scope:'Ownership and independence only; no scientific acceptance'});
}
if(authors[0].session===authors[1].session)throw Error('A/B same session');
const rt=t.tasks.find(x=>x.id==='task_mv44sib0_00bu_gjr7xw'),rm=t.members.find(x=>x.name==='pool-228');
const rn=(await a.native('/api/session/'+rm.sessionId)).data,rr=routing.members.find(x=>x.session_id===rn.id),selected=JSON.parse(rr.model_routing).selected;
if(rt.assignee!==rm.name||rt.status!=='in_progress'||rt.context.decision.mode!=='fresh'||rn.fork||rr.model_override||`${rn.model.providerID}/${rn.model.id}`!==selected.id||rn.model.variant!==selected.reasoningEffort)throw Error('R admission mismatch');
const reconciler={member:rm.name,session:rn.id,task:rt.id,model_ref:rn.model,selected,fresh:true,directory:rn.location.directory};
const copies=[...authors.map(x=>[x.source,x.file]),[base+'/'+ea+'.json',ea+'.json'],[base+'/common-compaction.md','common-compaction.md'],[base+'/'+ea+'.readable/manifest.json','native-manifest.json'],...mf.files.map(f=>[base+'/'+ea+'.readable/'+f.file,'native-'+f.file])];
fs.mkdirSync(path.join(a.root,dir),{recursive:true});
const files=copies.map(([src,dst])=>{const b=fs.readFileSync(path.join(a.root,src));fs.writeFileSync(path.join(a.root,dir,dst),b,{flag:'wx'});return {file:dst,source:src,bytes:b.length,sha256:a.sha(b)};});
const manifest={ea,group,volet:'C',version:1,authors,reconciler,files,scope:'Only fresh C R; independent author candidates plus same frozen native inputs. No semantic candidates. No RE promotion.'};
const mb=JSON.stringify(manifest,null,2)+'\n';fs.writeFileSync(path.join(a.root,dir,'manifest.json'),mb,{flag:'wx'});
if(files.some(f=>a.sha(fs.readFileSync(path.join(a.root,dir,f.file)))!==f.sha256))throw Error('Freeze readback failed');
const record={at:new Date().toISOString(),event:'RECONCILIATION_INPUTS_FROZEN',ea,group,volet:'C',directory:dir,manifest_sha256:a.sha(mb),authors,reconciler,no_RE_promotion:true};
const receipt=h.writeReceipt('506690-c-r-freeze.json',record);
fs.appendFileSync(path.join(a.root,'docs/missions/ff8-decomp-semantics-2026-10-11-run01/ledger.jsonl'),JSON.stringify({...record,receipt})+'\n');
console.log(JSON.stringify({receipt,manifest_sha256:record.manifest_sha256,files:files.length,authors:authors.map(x=>({role:x.role,member:x.member,sha256:x.sha256})),reconciler}));
