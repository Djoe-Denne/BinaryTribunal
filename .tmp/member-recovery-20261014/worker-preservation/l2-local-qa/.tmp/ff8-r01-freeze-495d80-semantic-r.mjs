import fs from 'node:fs';
import path from 'node:path';
import { root, out, state, native, sha, canon, inputCheck, cleanMessage, save } from './ff8-r01-repair-audit-20261012.mjs';

const team=await state();
const group='g14', ea='0x495D80';
const routing=JSON.parse(fs.readFileSync(path.join(out,'routing-semantic-r-495d80.json'),'utf8'));
const authorSpecs=[['A','pool-196','task_mv44seg8_00ay_ek9tzp'],['B','pool-197','task_mv44seg9_00az_s7xubp']];
const inputBase=`inputs/ff8-decomp-semantics-20261011-r01/${group}`;
const outputBase=`outputs/ff8-decomp-semantics-20261011-r01/production/${group}/${ea}`;
const base=`inputs/ff8-decomp-semantics-20261011-r01/reconciliation/${group}/${ea}/semantic`;
const destination=path.join(root,base);
if(fs.existsSync(destination))throw Error('R projection already exists; never overwrite freeze');
const frozenManifest=JSON.parse(fs.readFileSync(path.join(root,inputBase,ea+'.readable/manifest.json'),'utf8'));
const authors=[];
for(const [role,name,taskID] of authorSpecs) {
  const task=team.tasks.find(x=>x.id===taskID);
  if(task?.status!=='completed'||task.assignee!==name||!inputCheck(task).ok)throw Error('Author task/input gate failed: '+name);
  const member=team.members.find(x=>x.name===name);
  const ns=(await native(`/api/session/${member.sessionId}`)).data;
  const rr=routing.members.find(x=>x.session_id===ns.id);
  const selected=JSON.parse(rr.model_routing).selected;
  if(rr.model_override||`${ns.model.providerID}/${ns.model.id}`!==selected.id||ns.model.variant!==selected.reasoningEffort)throw Error('Author routing mismatch');
  if(canon(ns.location.directory)!==canon(root))throw Error('Author directory mismatch');
  const dec=task.context.decision;
  if(ns.fork?.sessionID!==dec.from||ns.fork?.boundary?.messageID!==dec.messageID||ns.fork?.boundary?.type!=='before')throw Error('Author native fork mismatch');
  const sc=(await native(`/api/session/${dec.from}/context`)).data;
  const end=sc.findIndex(x=>x.id===dec.messageID);
  if(end<0)throw Error('Source boundary missing');
  const child=(await native(`/api/session/${ns.id}/context`)).data;
  if(!sc.slice(0,end).every((x,i)=>child[i]&&JSON.stringify(cleanMessage(x))===JSON.stringify(cleanMessage(child[i]))))throw Error('Inherited factual prefix differs');
  const ownTools=child.slice(end).flatMap(m=>(m.content||[]).filter(p=>p.type==='tool').map(p=>({...p,message:m.id})));
  const allowed=new Set(['docs/tech/RE_MULTI_PROVIDER_MISSIONS.md',`${inputBase}/common-compaction.md`,`${inputBase}/${ea}.readable/manifest.json`,...frozenManifest.files.map(f=>`${inputBase}/${ea}.readable/${f.file}`)]);
  const reads=ownTools.filter(p=>p.name==='read'&&p.state?.status==='completed');
  if(reads.some(p=>!allowed.has(p.state.input.path.replaceAll('\\','/'))))throw Error('Unexpected successful author read');
  const required=[`${inputBase}/common-compaction.md`,`${inputBase}/${ea}.readable/manifest.json`,...frozenManifest.files.map(f=>`${inputBase}/${ea}.readable/${f.file}`)];
  if(required.some(p=>!reads.some(r=>r.state.input.path.replaceAll('\\','/')===p)))throw Error('Incomplete author input reads');
  const file=`semantic_${role.toLowerCase()}.md`;
  const source=`${outputBase}/${file}`;
  const bytes=fs.readFileSync(path.join(root,source));
  const writes=ownTools.filter(p=>p.name==='patch'&&p.state?.status==='completed'&&p.state.input?.patchText?.includes('*** Add File: '+source));
  if(writes.length!==1)throw Error('Ambiguous author deposit');
  const lines=writes[0].state.input.patchText.split(/\r?\n/);
  const start=lines.indexOf('*** Add File: '+source);
  const added=[];
  for(const line of lines.slice(start+1)){if(line.startsWith('*** '))break;if(!line.startsWith('+'))throw Error('Unexpected patch content');added.push(line.slice(1));}
  if(added.join('\n').trimEnd()!==bytes.toString('utf8').trimEnd())throw Error('Current candidate differs from native authored deposit');
  // Parent has separately inspected the short own-tool traces: remaining execute
  // calls were only reports/task-completion, not peer, classifier or live reads.
  authors.push({role,member:name,session:ns.id,task:taskID,model_ref:ns.model,selected:{id:selected.id,variant:selected.reasoningEffort},file,source,sha256:sha(bytes),bytes:bytes.length,fork:ns.fork,checked_input_reads:required.length,successful_read_paths:reads.map(r=>r.state.input.path),native_write_tool:writes[0].id});
}
if(authors[0].session===authors[1].session)throw Error('Authors not independent sessions');
const rt=team.tasks.find(x=>x.id==='task_mv44seh0_00b1_dezhco');
if(rt.assignee!=='pool-219'||rt.context.decision?.mode!=='fresh')throw Error('R ownership/context mismatch');
const rm=team.members.find(x=>x.name==='pool-219');
const rn=(await native(`/api/session/${rm.sessionId}`)).data;
const rr=routing.members.find(x=>x.session_id===rn.id);
const rs=JSON.parse(rr.model_routing).selected;
if(rr.context_mode!=='fresh'||rr.model_override||rn.fork||canon(rn.location.directory)!==canon(root)||`${rn.model.providerID}/${rn.model.id}`!==rs.id||rn.model.variant!==rs.reasoningEffort)throw Error('R native admission mismatch');
const reconciler={member:rm.name,session:rn.id,task:rt.id,model_ref:rn.model,selected:{id:rs.id,variant:rs.reasoningEffort},fresh:true,directory:rn.location.directory};

const copies=[...authors.map(x=>[x.source,x.file]),
  [`${inputBase}/${ea}.json`,`${ea}.json`],
  [`${inputBase}/common-compaction.md`,'common-compaction.md'],
  [`${inputBase}/${ea}.readable/manifest.json`,'native-manifest.json'],
  ...frozenManifest.files.map(f=>[`${inputBase}/${ea}.readable/${f.file}`,'native-'+f.file])];
fs.mkdirSync(destination,{recursive:true});
const files=[];
for(const [src,dst] of copies){const b=fs.readFileSync(path.join(root,src));fs.writeFileSync(path.join(destination,dst),b,{flag:'wx'});files.push({file:dst,source:src,bytes:b.length,sha256:sha(b)});}
const manifest={ea,group,volet:'semantic',authors,files,reconciler,
  scope:'Fresh semantic R only. Same frozen original native facts and common compaction; two independently authored semantic candidates; NO C or other-volet output. Native-prefixed copies are verbatim; native-manifest records the original filenames. No author verdict is promoted by this freeze. Helpers/callers absent from the gel remain explicit uncertainties.'};
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
if(!files.every(f=>{const b=fs.readFileSync(path.join(destination,f.file));return b.length===f.bytes&&sha(b)===f.sha256}))throw Error('R projection readback mismatch');
const manifestSha=sha(fs.readFileSync(path.join(destination,'manifest.json')));
const record={at_utc:new Date().toISOString(),event:'RECONCILIATION_INPUTS_FROZEN',ea,group,volet:'semantic',directory:base,manifest_sha256:manifestSha,files_verified:files.length,authors,reconciler,no_RE_promotion:true};
const receipt=save('495D80-semantic-r-freeze.json',record);
fs.appendFileSync(path.join(root,'docs/missions/ff8-decomp-semantics-2026-10-11-run01/ledger.jsonl'),JSON.stringify({...record,receipt})+'\n');
console.log(JSON.stringify({receipt,directory:base,manifest_sha256:manifestSha,files_verified:files.length,reconciler,authors:authors.map(x=>({role:x.role,session:x.session,hash:x.sha256}))}));
