import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Service } from 'file:///C:/Users/djden/source/repos/opencode-ensemble-session/node_modules/@opencode/client/dist/promise/service.js';

export const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
export const teamID = 'team_mv41qy6o_0000_vbge32';
export const out = path.join(root, 'docs/missions/ff8-decomp-semantics-2026-10-11-run01/resume-repair-20261012');
export const sha = data => crypto.createHash('sha256').update(data).digest('hex');
export const canon = p => path.resolve(p).replaceAll('\\', '/').toLowerCase();
export function save(name, data) {
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, name);
  if (fs.existsSync(file)) throw new Error(`Receipt already exists: ${file}`);
  const text = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(file, text, { flag: 'wx' });
  return { path: path.relative(root, file).replaceAll('\\', '/'), sha256: sha(text) };
}
export async function state() {
  const r = await fetch('http://127.0.0.1:4747/api/state');
  if (!r.ok) throw new Error(`Dashboard HTTP ${r.status}`);
  const t = (await r.json()).teams.find(t => t.id === teamID);
  if (!t || canon(t.projectId) !== canon(root)) throw new Error('Wrong team or project');
  return t;
}
let endpoint;
export async function native(p) {
  endpoint ??= await Service.discover();
  if (!endpoint) throw new Error('No existing native service');
  const r = await fetch(endpoint.url + p, { headers: Service.headers(endpoint) });
  if (!r.ok) throw new Error(`Native ${p} HTTP ${r.status}`);
  return await r.json();
}
export function contextDigest(messages) {
  return sha(JSON.stringify(messages));
}
export function summary(t) {
  const counts = {};
  for (const x of t.tasks) counts[x.status] = (counts[x.status] || 0) + 1;
  return { team: t.id, capacity: t.capacity, scheduling: t.scheduling, statuses: counts,
    contextErrors: t.tasks.filter(x => x.context?.error).length,
    explicitPending: t.tasks.filter(x => x.context?.decision?.mode === 'pending').length };
}
export function inputCheck(t) {
  const m = t.content.match(/(g\d+)\/(0x[0-9A-F]+)/i);
  if (!m) return { ok: false, reason: 'No exact group/EA in task' };
  const group = m[1], ea = m[2];
  const base = `inputs/ff8-decomp-semantics-20261011-r01/${group}`;
  const manifestPath = `${base}/${ea}.readable/manifest.json`;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestPath), 'utf8'));
    const checks = [{ path: manifest.original_packet, expected: manifest.original_sha256 },
      { path: `${base}/common-compaction.md`, expected: manifest.compaction_sha256 },
      ...manifest.files.map(f => ({ path: `${base}/${ea}.readable/${f.file}`, expected: f.sha256, bytes: f.bytes }))];
    for (const c of checks) {
      const buf = fs.readFileSync(path.join(root, c.path));
      c.actual = sha(buf); c.actualBytes = buf.length;
      c.ok = c.actual === c.expected && (c.bytes === undefined || c.bytes === buf.length);
    }
    return { ok: checks.every(c => c.ok), group, ea, manifestPath,
      manifest_sha256: sha(fs.readFileSync(path.join(root, manifestPath))), checks };
  } catch(e) { return { ok: false, group, ea, reason: e.message }; }
}

async function validateSources() {
  const t = await state();
  if (t.scheduling.autoScale || t.scheduling.autoDispatch || t.capacity.running || t.capacity.starting)
    throw new Error('Admissions must be stopped for baseline');
  const baseline = save('baseline.json', { at: new Date().toISOString(), team: t });
  const errors = t.tasks.filter(x => x.context?.error);
  const allowedErrors = new Set([
    'Error: Non-transferable source/worktree changes: commit or resolve them before inheriting into another directory',
    'Error: Cannot verify source/worktree Git isolation; refusing session.move'
  ]);
  const sources = new Map();
  for (const task of errors) {
    const d = task.context.decision;
    const key = `${d?.from}|${d?.messageID || ''}`;
    if (sources.has(key)) continue;
    const rec = { key, mode: d?.mode, from: d?.from, messageID: d?.messageID, task_ids: errors.filter(x => `${x.context.decision?.from}|${x.context.decision?.messageID || ''}` === key).map(x => x.id) };
    try {
      const member = t.members.find(x => x.sessionId === d.from || x.name === d.from);
      if (!member) throw new Error('Source not owned by team');
      const s = (await native(`/api/session/${member.sessionId}`)).data;
      rec.native = { id: s.id, agent: s.agent, model: s.model, location: s.location, projectID: s.projectID, outcome: s.outcome, fork: s.fork };
      rec.directory_ok = canon(s.location.directory) === canon(root) && fs.statSync(s.location.directory).isDirectory();
      if (!rec.directory_ok) throw new Error('Source native directory mismatch');
      const ctx = (await native(`/api/session/${s.id}/context`)).data;
      let prefix = ctx;
      if (d.mode === 'checkpoint') {
        const b = (await native(`/api/session/${s.id}/message/${d.messageID}`)).data;
        const i = ctx.findIndex(x => x.id === d.messageID);
        if (b.id !== d.messageID || i < 0) throw new Error('Boundary absent from active native context');
        rec.boundary = { id: b.id, type: b.type, created: b.time.created, sha256: sha(JSON.stringify(b)), exclusive: true, index: i };
        prefix = ctx.slice(0, i);
      } else if (d.mode !== 'fork') throw new Error('Unsupported retained context mode');
      rec.source_context_count = ctx.length;
      rec.source_context_sha256 = contextDigest(ctx);
      rec.retained_message_ids = prefix.map(x => x.id);
      rec.retained_context_sha256 = contextDigest(prefix);
      rec.retained_count = prefix.length;
      rec.retained_types = prefix.reduce((a,x)=>(a[x.type]=(a[x.type]||0)+1,a),{});
      rec.retained_tools = prefix.flatMap(m => (m.content || []).filter(c => c.type === 'tool').map(c => ({ message: m.id, name: c.name, input: c.state?.input, status: c.state?.status })));
      rec.ok = prefix.length > 0 && s.agent === 'explore';
      if (!rec.ok) rec.reason = 'Empty retained context or source is no longer explorer';
    } catch(e) { rec.ok = false; rec.reason = e.message; }
    sources.set(key, rec);
  }
  const rows = errors.map(task => {
    const d = task.context.decision;
    const source = sources.get(`${d?.from}|${d?.messageID || ''}`);
    const inputs = inputCheck(task);
    const ok = allowedErrors.has(task.context.error) && source.ok && inputs.ok && d.worktree === false && task.assignee === null && ['pending','blocked'].includes(task.status);
    return { task_id: task.id, revision: task.context.revision, context: d, old_error: task.context.error,
      status: task.status, source_key: source.key, inputs, rearm_ok: ok,
      reason: ok ? 'Obsolete cross-directory isolation error; source and destination now identical, worktree:false preserved' : 'See source/input/assignment checks' };
  });
  const receipt = save('source-validation.json', { at: new Date().toISOString(), baseline, sources: [...sources.values()], tasks: rows,
    untouched_pending: t.tasks.filter(x => x.context?.decision?.mode === 'pending').map(x => ({ id:x.id, context:x.context, assignee:x.assignee, status:x.status })) });
  console.log(JSON.stringify({ ...summary(t), baseline, receipt, sourceChecks: [...sources.values()].map(x => ({from:x.from,ok:x.ok,mode:x.mode,retained:x.retained_count,boundary:x.boundary?.id,reason:x.reason})), rearmable: rows.filter(x=>x.rearm_ok).length, failures:rows.filter(x=>!x.rearm_ok).map(x=>({id:x.task_id,source:x.source_key,input:x.inputs.reason})) }));
}

if (process.argv[2] === 'sources') await validateSources();

export function expectedOutput(task) {
  const explicit = task.content.match(/outputs\/[^\s]+\.md/)?.[0];
  if (explicit) return explicit;
  const m = task.content.match(/(g\d+)\/(0x[0-9A-F]+)/i);
  if (!m) return null;
  const volet = /semantic/i.test(task.content) ? 'semantic' : 'c';
  const role = task.content.startsWith('RECONCILE') ? 'r' : task.content.match(/PRODUCE (?:C|semantic) ([AB])/i)?.[1].toLowerCase();
  return role ? `outputs/ff8-decomp-semantics-20261011-r01/production/${m[1]}/${m[2]}/${volet}_${role}.md` : null;
}
export const cleanMessage = x => JSON.parse(JSON.stringify(x, (k,v) => ['id','time','providerState','snapshot','cost','tokens','finish'].includes(k) ? undefined : v));

async function canaryReadback() {
  const t = await state();
  const member = t.members.find(m=>m.name==='resume-canary-495d80-b');
  const task = t.tasks.find(t=>t.id==='task_mv44seg7_00ax_4z2amv');
  const decision = task.context.decision;
  const s = (await native(`/api/session/${member.sessionId}`)).data;
  const ctx = (await native(`/api/session/${s.id}/context`)).data;
  const source = (await native(`/api/session/${decision.from}/context`)).data;
  const prefix = source.slice(0, source.findIndex(x=>x.id===decision.messageID));
  const prefixChecks = prefix.map((x,i)=>({index:i,source_id:x.id,child_id:ctx[i]?.id,type:x.type,
    sha256:sha(JSON.stringify(cleanMessage(x))),match:JSON.stringify(cleanMessage(x))===JSON.stringify(cleanMessage(ctx[i]))}));
  const snap = JSON.parse(fs.readFileSync(path.join(out,'routing-snapshot.json'),'utf8'));
  const row = snap.members.find(m=>m.session_id===s.id);
  const routing = JSON.parse(row.model_routing);
  const selected = routing.selected;
  const modelOK = `${s.model.providerID}/${s.model.id}`===selected.id && s.model.variant===selected.reasoningEffort;
  const checks = {
    claimed:task.assignee===member.name && task.status==='in_progress',
    directory:canon(s.location.directory)===canon(root), model:modelOK,
    source:s.fork?.sessionID===decision.from,
    boundary:s.fork?.boundary?.type==='before' && s.fork.boundary.messageID===decision.messageID,
    retained_prefix:prefixChecks.every(x=>x.match),
    input_hashes:inputCheck(task).ok
  };
  const rec = {at:new Date().toISOString(),task_id:task.id,member:member.name,session:s.id,model_ref:s.model,
    location:s.location,fork:s.fork,decision,routing,checks,prefixChecks,
    note:'Native clone assigns new message IDs. Retained prefix equality checked excluding IDs/timestamps/provider accounting only; not merely a source string in the prompt.'};
  console.log(JSON.stringify({receipt:save('canary-native-readback.json',rec),...rec, routing:{selected,reason:routing.reason},prefixChecks}));
}

async function inventory() {
  const t = await state();
  const b = JSON.parse(fs.readFileSync(path.join(out,'baseline.json'),'utf8')).team;
  const ids = new Set(b.tasks.filter(t=>t.status==='in_progress').map(t=>t.id));
  const rows = t.tasks.filter(x=>ids.has(x.id)).map(x=>{
    const m=t.members.find(m=>m.name===x.assignee);
    const p=expectedOutput(x); const f=p&&path.join(root,p);
    const exists=!!f&&fs.existsSync(f); const text=exists?fs.readFileSync(f,'utf8'):'';
    return {id:x.id,content:x.content,member:m?.name,session:m?.sessionId,execution:m?.executionStatus,status:x.status,context:x.context,
      output:p,exists,bytes:Buffer.byteLength(text),sha256:exists?sha(text):null,head:text.slice(0,220),
      pendingDependants:t.tasks.filter(z=>z.dependsOn?.includes(x.id)).map(z=>({id:z.id,assignee:z.assignee,context:z.context,status:z.status}))};
  });
  console.log(JSON.stringify({receipt:save('inactive-inventory.json',{at:new Date().toISOString(),rows}),inventory:rows.map(x=>({id:x.id,member:x.member,output:x.output,exists:x.exists,bytes:x.bytes,head:x.head}))}));
}
if (process.argv[2] === 'canary') await canaryReadback();
if (process.argv[2] === 'inventory') await inventory();

async function disposition() {
  const t = await state();
  const rows=JSON.parse(fs.readFileSync(path.join(out,'inactive-inventory.json'),'utf8')).rows;
  const reports=JSON.parse(fs.readFileSync(path.join(out,'inactive-reports.json'),'utf8'));
  const retest=t.members.find(m=>m.name==='c-a-47e3f0-retest');
  const ns=(await native(`/api/session/${retest.sessionId}`)).data;
  const ctx=(await native(`/api/session/${retest.sessionId}/context`)).data;
  const ca=rows.find(x=>x.id==='task_mv44rtpr_009f_26rcd2');
  const patch=ctx.flatMap(m=>(m.content||[]).filter(p=>p.type==='tool'&&p.name==='patch'&&p.state?.status==='completed'))
    .find(p=>p.state.input?.patchText?.includes('*** Add File: '+ca.output));
  if (!patch) throw new Error('No native successful author patch found');
  const payload=patch.state.input.patchText.split(/\r?\n/);
  const start=payload.findIndex(l=>l==='*** Add File: '+ca.output);
  const lines=[];
  for(const line of payload.slice(start+1)) { if(line.startsWith('*** ')) break; if(!line.startsWith('+')) throw new Error('Unexpected patch shape'); lines.push(line.slice(1)); }
  const reconstructed=lines.join('\n')+'\n';
  const body=fs.readFileSync(path.join(root,ca.output),'utf8');
  if (reconstructed!==body && reconstructed.trimEnd()!==body.trimEnd()) throw new Error('Current output does not match native author deposit');
  const originalTask=t.tasks.find(x=>x.id===ca.id);
  if(!inputCheck(originalTask).ok) throw new Error('Candidate source hashes failed');
  const attachment={task_id:ca.id,original_assignee:ca.member,actual_author:retest.name,actual_session:ns.id,
    source:ns.fork,model_ref:ns.model,output:ca.output,sha256:sha(body),bytes:Buffer.byteLength(body),native_write:patch.id,
    native_write_matches_current_file:true,source_hashes_match:true,
    inspection:'Parent inspected complete 9-instruction/24-byte C reconstruction against frozen ASM. cdecl forwarding of three DWORDs; call 0x500DF0; ADD ESP,12; full EAX preserved. Byte table matches. Production deposit complete, NOT final RE approval, no IDB/Git/semantic promotion. Historical off-board writer explicitly attached, not attributed falsely to pool-143.'};
  const parked=rows.filter(x=>x.id!==ca.id).map(x=>{
    let cause='No assigned output deposited; native/report evidence confirms blocked or unfinished input handoff. Author independence and exact authorized input delivery require explicit validation before retry.';
    if(x.content.startsWith('RECONCILE')) {
      const parts=x.output.split('/'); const volet=parts[5].startsWith('semantic')?'semantic':'C';
      const proj=`inputs/ff8-decomp-semantics-20261011-r01/reconciliation/${parts[3]}/${parts[4]}/${volet}`;
      cause=fs.existsSync(path.join(root,proj)) ? `R not produced. Projection ${proj} exists, but exact-path handoff, frozen hashes and A/B provenance must be checked before retry; no completion inferred from idle.` : `R not produced; canonical frozen A+B projection absent: ${proj}. Loose outputs do not authorize reconciliation.`;
    }
    if(x.member==='pool-191') cause='g32 DISCOVERY_COMPLETION not delivered: only a blocker/request about 0x55CBD2 is recorded, no complete v2 common compaction. Offline unresolved-target continuation was authorized but not completed.';
    if(x.member==='pool-195') cause+=' Model alert was false: native Astra low matches persisted selected Astra low. Model is NOT a remaining blocker.';
    const r=reports.find(y=>y.task_id===x.id);
    return {task_id:x.id,member:x.member,session:x.session,old_context:x.context,output:x.output,cause,
      prior_report_ids:r?.reports.map(m=>m.id)||[],
      hold_context:{mode:'pending',worktree:false,reason:`REPAIR_HOLD 2026-10-12: ${cause} Original decision preserved verbatim in resume-repair-20261012/inactive-inventory.json and board-disposition-plan.json for task ${x.id}. No fresh fallback. Previous mode/source/checkpoint: ${JSON.stringify(x.context.decision)}`}};
  });
  const p195=reports.find(x=>x.member==='pool-195');
  const n195=(await native(`/api/session/${p195.session_id}`)).data;
  const selection=p195.model_routing.selected;
  const modelOK=`${n195.model.providerID}/${n195.model.id}`===selection.id&&n195.model.variant===selection.reasoningEffort;
  if(!modelOK) throw new Error('Actual pool-195 routing mismatch');
  const rec={at:new Date().toISOString(),attachment,parked,pool195:{session:n195.id,selected:selection,native:n195.model,model_override:p195.model_override,match:modelOK,remaining_gate:parked.find(x=>x.member==='pool-195').cause}};
  console.log(JSON.stringify({receipt:save('board-disposition-plan.json',rec),complete_candidate:attachment,parked:parked.length,pool195:rec.pool195}));
}

async function canaryAccess() {
  const t=await state(); const m=t.members.find(x=>x.name==='resume-canary-495d80-b');
  const ctx=(await native(`/api/session/${m.sessionId}/context`)).data;
  const expected=['common-compaction.md','0x495D80.json','0x495D80.readable/manifest.json','0x495D80.readable/metadata.json',...Array.from({length:5},(_,i)=>`0x495D80.readable/asm-${String(i+1).padStart(3,'0')}.txt`),'0x495D80.readable/bytes-001.txt'];
  const reads=ctx.flatMap(m=>(m.content||[]).filter(c=>c.type==='tool'&&c.name==='read').map(c=>({message_id:m.id,tool_id:c.id,status:c.state?.status,path:c.state?.input?.path,result:JSON.stringify(c.state?.content||[])})));
  const checks=expected.map(p=>{const r=reads.find(r=>r.path?.replaceAll('\\','/').endsWith('/g14/'+p));return {path:p,ok:!!r&&r.status==='completed'&&!/Permission denied|File not found/i.test(r.result),message_id:r?.message_id,tool_id:r?.tool_id};});
  if(checks.some(x=>!x.ok))throw new Error('Input access incomplete: '+JSON.stringify(checks));
  console.log(JSON.stringify({receipt:save('canary-input-access.json',{at:new Date().toISOString(),session:m.sessionId,checks}),reads_verified:checks.length,plan_approval:m.planApproval}));
}
if(process.argv[2]==='disposition') await disposition();
if(process.argv[2]==='access') await canaryAccess();

async function liveReadback() {
  const t=await state();
  const snapshot=JSON.parse(fs.readFileSync(path.join(out,'routing-live.json'),'utf8'));
  const checks=[]; const sources=new Map();
  for(const row of snapshot.members.filter(m=>m.name!=='pool-195')) {
    const task=t.tasks.find(x=>x.assignee===row.name&&x.status==='in_progress');
    if(!task) continue;
    const ns=(await native(`/api/session/${row.session_id}`)).data;
    const dec=task.context.decision; const routing=JSON.parse(row.model_routing);
    const selected=routing.selected;
    const child=(await native(`/api/session/${ns.id}/context`)).data;
    const key=dec.from+'|'+(dec.messageID||'');
    if(!sources.has(key)) {
      const src=(await native(`/api/session/${dec.from}/context`)).data;
      sources.set(key,dec.mode==='checkpoint'?src.slice(0,src.findIndex(m=>m.id===dec.messageID)):src);
    }
    const prefix=sources.get(key);
    const p=prefix.every((m,i)=>child[i]&&JSON.stringify(cleanMessage(m))===JSON.stringify(cleanMessage(child[i])));
    const rec={member:row.name,task_id:task.id,session:ns.id,model:ns.model,selected:{id:selected.id,variant:selected.reasoningEffort},override:row.model_override,
      directory:ns.location.directory,fork:ns.fork,checks:{model:`${ns.model.providerID}/${ns.model.id}`===selected.id&&ns.model.variant===selected.reasoningEffort,
        directory:canon(ns.location.directory)===canon(root),source:ns.fork?.sessionID===dec.from,
        boundary:dec.mode!=='checkpoint'||ns.fork?.boundary?.messageID===dec.messageID&&ns.fork.boundary.type==='before',prefix:p,inputs:inputCheck(task).ok}};
    checks.push(rec);
  }
  console.log(JSON.stringify({receipt:save('automatic-admissions-readback.json',{at:new Date().toISOString(),checks}),checks}));
  if(checks.some(x=>Object.values(x.checks).some(v=>!v)))throw new Error('Native admission mismatch');
  const active=await native('/api/session/active');
  console.log(JSON.stringify({activeKeys:Object.keys(active),shape:Array.isArray(active.data)?'array':typeof active.data,
    activeTeam:Array.isArray(active.data)?active.data.filter(x=>t.members.some(m=>m.sessionId===(x.sessionID||x.id))):Object.entries(active.data||{}).filter(([k])=>t.members.some(m=>m.sessionId===k))}));
}
if(process.argv[2]==='live') await liveReadback();

async function finalReceipt() {
  const t=await state();
  const b=JSON.parse(fs.readFileSync(path.join(out,'baseline.json'),'utf8')).team;
  const v=JSON.parse(fs.readFileSync(path.join(out,'source-validation.json'),'utf8'));
  const d=JSON.parse(fs.readFileSync(path.join(out,'board-disposition-plan.json'),'utf8'));
  const canary=JSON.parse(fs.readFileSync(path.join(out,'canary-native-readback.json'),'utf8'));
  const active=(await native('/api/session/active')).data;
  const actual=t.members.filter(m=>active[m.sessionId]?.type==='running').map(m=>({member:m.name,session:m.sessionId}));
  const retained=v.tasks.map(x=>{const y=t.tasks.find(y=>y.id===x.task_id);return {task_id:x.task_id,revision:y.context.revision,source:x.context.from,checkpoint:x.context.messageID,ok:!y.context.error&&y.context.revision===x.revision+1&&JSON.stringify(y.context.decision)===JSON.stringify(x.context)};});
  const originalsPending=v.untouched_pending.every(x=>JSON.stringify(t.tasks.find(y=>y.id===x.id).context)===JSON.stringify(x.context));
  const parked=d.parked.map(x=>{const y=t.tasks.find(y=>y.id===x.task_id);return {task_id:x.task_id,cause:x.cause,old_context:x.old_context,current_context:y.context,status:y.status,assignee:y.assignee,ok:y.status==='pending'&&!y.assignee&&y.context.state==='pending'};});
  const checks={all119Preserved:retained.every(x=>x.ok),original50Unchanged:originalsPending,all29IncompleteHeld:parked.every(x=>x.ok),
    oneDepositAttached:t.tasks.find(x=>x.id===d.attachment.task_id).status==='completed',
    dependentRGate:t.tasks.find(x=>x.id==='task_mv44rtr3_009j_adxhqx').context.state==='pending',
    policyUnchanged:JSON.stringify(t.modelPolicy)===JSON.stringify(b.modelPolicy)&&JSON.stringify(t.routingPolicy)===JSON.stringify(b.routingPolicy),
    autoscale:t.scheduling.autoScale===true,dispatchOff:t.scheduling.autoDispatch===false,cap5:t.capacity.limit===5&&t.capacity.running+t.capacity.starting<=5&&actual.length<=5};
  if(Object.values(checks).some(x=>!x))throw new Error('Final gate failed: '+JSON.stringify(checks));
  const event={at_utc:new Date().toISOString(),event:'RUN01_CONTEXT_REPAIR_VERIFIED',team_id:teamID,
    context_errors_before:v.tasks.length,context_errors_after:t.tasks.filter(x=>x.context?.error).length,
    rearmed:retained.length,original_pending_untouched:50,checks,canary:{task:canary.task_id,session:canary.session,model_ref:canary.model_ref,source:canary.fork,inputs_readback:'canary-input-access.json'},
    previous_inactive_tasks:{total:30,deposit_attached:d.attachment,incomplete_held:parked.length},
    actual_running:actual,capacity:t.capacity,scheduling:t.scheduling,explicit_context_pending:t.tasks.filter(x=>x.context?.decision?.mode==='pending').length,
    residuals:{original50:v.untouched_pending,incomplete29:parked,dependent_R:{task_id:'task_mv44rtr3_009j_adxhqx',cause:'Frozen A+B projection absent after attaching the historical C A deposit; no R admission permitted.'}},
    pool195:d.pool195,no_RE_promotion:true,no_IDB_git_changes:true};
  const receipt=save('resume-result.json',event);
  const ledger=path.join(root,'docs/missions/ff8-decomp-semantics-2026-10-11-run01/ledger.jsonl');
  fs.appendFileSync(ledger,JSON.stringify({at_utc:event.at_utc,event:event.event,team_id:teamID,artifact:receipt.path,sha256:receipt.sha256,context_errors_before:119,context_errors_after:event.context_errors_after,rearmed:119,original_pending_unchanged:50,old_in_progress_reconciled:30,completed_deposit:1,held_incomplete:29,canary:event.canary,capacity:event.capacity,scheduling:event.scheduling,no_RE_promotion:true})+'\n');
  console.log(JSON.stringify({receipt,checks,context_errors_before:119,context_errors_after:event.context_errors_after,rearmed:119,original50Unchanged:originalsPending,old30:{completeDeposit:1,heldIncomplete:29},canary:event.canary,actualRunning:actual,capacity:t.capacity,scheduling:t.scheduling,explicitPending:event.explicit_context_pending}));
}
if(process.argv[2]==='final') await finalReceipt();
