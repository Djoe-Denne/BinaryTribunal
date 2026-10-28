import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as a from './ff8-r01-repair-audit-20261012.mjs';

export const folder = path.join(a.root, 'docs/missions/ff8-decomp-semantics-2026-10-11-run01/input-admission-hardening-20261012');
export const textOnly = m => typeof m.text==='string' ? m.text : (m.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
export const toolsOnly = m => (m.content || []).filter(c => c.type === 'tool').map(c => ({message:m.id, name:c.name, input:c.state?.input, status:c.state?.status, error:c.state?.error}));
export function writeReceipt(name, value) {
  fs.mkdirSync(folder,{recursive:true});
  const p=path.join(folder,name), bytes=JSON.stringify(value,null,2)+'\n';
  fs.writeFileSync(p,bytes,{flag:'wx'});
  return {path:p,sha256:a.sha(bytes)};
}
export async function audit(routingPath, label, names) {
  const t=await a.state();
  if(t.capacity.limit!==5 || t.scheduling.autoDispatch || t.scheduling.autoScale) throw new Error('Hardening requires paused admissions at cap 5');
  const active=(await a.native('/api/session/active')).data;
  const routing=JSON.parse(fs.readFileSync(routingPath,'utf8'));
  const tasks=t.tasks.filter(x=>names?.length ? names.includes(x.assignee) : x.status==='in_progress');
  const rows=[], sources=new Map(), profiles={};
  for(const task of tasks) {
    const m=t.members.find(m=>m.name===task.assignee);
    if(!m) throw new Error('Task missing owner: '+task.id);
    const s=(await a.native('/api/session/'+m.sessionId)).data;
    const ctx=(await a.native('/api/session/'+m.sessionId+'/context')).data;
    const routingRow=routing.members.find(x=>x.session_id===s.id);
    const route=routingRow?.model_routing ? JSON.parse(routingRow.model_routing) : null;
    const expected=route?.selected;
    const modelMatch=!!expected && `${s.model.providerID}/${s.model.id}`===expected.id && s.model.variant===expected.reasoningEffort;
    const d=task.context?.decision;
    let inheritance={mode:d?.mode,ok:false};
    if(d?.mode==='fresh') inheritance={mode:'fresh',ok:!s.fork};
    if(['checkpoint','fork'].includes(d?.mode)) {
      if(!sources.has(d.from)) sources.set(d.from,(await a.native('/api/session/'+d.from+'/context')).data);
      const source=sources.get(d.from), boundary=d.mode==='checkpoint'?source.findIndex(x=>x.id===d.messageID):source.length;
      const prefix=boundary>=0 ? source.slice(0,boundary) : [];
      const prefixEqual=prefix.length>0 && prefix.every((x,i)=>JSON.stringify(a.cleanMessage(x))===JSON.stringify(a.cleanMessage(ctx[i])));
      const sourceMatch=s.fork?.sessionID===d.from;
      const boundaryMatch=d.mode==='fork'||s.fork?.boundary?.type==='before'&&s.fork.boundary.messageID===d.messageID;
      inheritance={mode:d.mode,source:d.from,boundary:d.messageID,retained:prefix.length,prefixEqual,sourceMatch,boundaryMatch,ok:prefixEqual&&sourceMatch&&boundaryMatch};
    }
    if(!profiles[s.agent]) {
      const p=(await a.native('/api/agent/'+s.agent+'?location%5Bdirectory%5D='+encodeURIComponent(a.root))).data;
      profiles[s.agent]={name:p.name,permissions:p.permissions};
    }
    const messages=t.messages.filter(x=>x.fromName===m.name||x.toName===m.name).sort((x,y)=>x.timeCreated-y.timeCreated);
    const output=a.expectedOutput(task), outputExists=output&&fs.existsSync(path.join(a.root,output));
    const row={name:m.name,session:s.id,task:{id:task.id,status:task.status,content:task.content,context:task.context},
      memberExecution:m.executionStatus,nativeActivity:active[s.id]||{type:'idle'},
      native:{agent:s.agent,model:s.model,location:s.location,fork:s.fork},
      admission:{snapshot:routingPath,model_override:routingRow?.model_override,expected,modelMatch,route},
      inheritance,directoryMatch:a.canon(s.location.directory)===a.canon(a.root),
      inputs:a.inputCheck(task),output:output?{path:output,exists:!!outputExists,...(outputExists?{sha256:a.sha(fs.readFileSync(path.join(a.root,output)))}:{})}:null,
      messages:messages.slice(-8),lastNativeText:ctx.filter(x=>x.type==='assistant'&&textOnly(x)).slice(-2).map(x=>({id:x.id,text:textOnly(x)})),
      nativeTools:ctx.flatMap(toolsOnly),nativeTail:ctx.slice(-6).map(x=>({id:x.id,type:x.type,time:x.time}))};
    rows.push(row);
  }
  const report={at:new Date().toISOString(),summary:a.summary(t),routingPath,profiles,rows,
    decisionBaseline:t.tasks.map(x=>({id:x.id,context:x.context})),modelPolicy:t.modelPolicy,routingPolicy:t.routingPolicy};
  const receipt=writeReceipt(label+'.json',report);
  console.log(JSON.stringify({receipt,summary:report.summary,checks:{models:rows.filter(x=>x.admission.modelMatch).length,inheritance:rows.filter(x=>x.inheritance.ok).length,inputs:rows.filter(x=>x.inputs.ok).length,total:rows.length}}));
  for(const r of rows) {
    const last=r.messages.filter(m=>m.fromName===r.name).at(-1);
    const plain=(last?.content||r.lastNativeText.at(-1)?.text||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
    console.log(`${r.name} | ${r.task.content.split(',')[0]} | ${r.memberExecution}/${r.nativeActivity.type} | ${plain.slice(0,250)}`);
  }
  return report;
}
export async function prepare(name) {
  const base=JSON.parse(fs.readFileSync(path.join(folder,'baseline.json'),'utf8'));
  const row=base.rows.find(x=>x.name===name);
  if(!row || row.task.content.startsWith('RECONCILE')) throw new Error('Exception requires separate approved handoff');
  const t=await a.state(), task=t.tasks.find(x=>x.id===row.task.id), member=t.members.find(x=>x.name===name);
  // These are existing owned blocked sessions, not new admissions. Ensemble may
  // queue their wakes and enforces the unchanged shared cap of five executions.
  if(t.capacity.limit!==5 || t.scheduling.autoScale || t.scheduling.autoDispatch || t.capacity.running+t.capacity.starting>5) throw new Error('Bounded scheduling changed');
  if(task?.status!=='in_progress'||task.assignee!==name||member?.executionStatus!=='idle'||member.sessionId!==row.session) throw new Error('Task/worker changed');
  if(JSON.stringify(task.context)!==JSON.stringify(row.task.context)) throw new Error('Context changed');
  const messages=t.messages.filter(m=>m.toName===name||m.fromName===name).sort((x,y)=>x.timeCreated-y.timeCreated);
  if(messages.some(m=>m.toName===name&&m.content.includes('[INPUT-ADMISSION-HARDENING-v1]'))) throw new Error('Equivalent correction already sent');
  const s=(await a.native('/api/session/'+row.session)).data;
  const ctx=(await a.native('/api/session/'+row.session+'/context')).data;
  const active=(await a.native('/api/session/active')).data;
  if(active[row.session]&&active[row.session].type!=='idle') throw new Error('Native worker already active');
  if(!row.admission.modelMatch || JSON.stringify(s.model)!==JSON.stringify(row.native.model)||!row.inheritance.ok||!row.directoryMatch) throw new Error('Admission no longer verified');
  const d=task.context.decision, source=(await a.native('/api/session/'+d.from+'/context')).data;
  const end=d.mode==='checkpoint'?source.findIndex(x=>x.id===d.messageID):source.length;
  if(end<1 || source.slice(0,end).some((m,i)=>JSON.stringify(a.cleanMessage(m))!==JSON.stringify(a.cleanMessage(ctx[i])))) throw new Error('Inherited prefix changed');
  const checks=a.inputCheck(task);
  if(!checks.ok||checks.manifest_sha256!==row.inputs.manifest_sha256) throw new Error('Input mismatch');
  if(fs.existsSync(path.join(a.root,row.output.path))) throw new Error('Output already deposited');
  const manifest=JSON.parse(fs.readFileSync(path.join(a.root,checks.manifestPath),'utf8'));
  const frozenNative=path.join(a.root,'.tmp/ff8-decomp-semantics-20261011-r01/native',checks.ea+'.json');
  if(!fs.existsSync(frozenNative)||a.sha(fs.readFileSync(frozenNative))!==manifest.original_sha256) throw new Error('Original native provenance not established');
  const inputDir=path.posix.dirname(checks.manifestPath);
  const exact=[checks.manifestPath,...manifest.files.map(f=>inputDir+'/'+f.file),`inputs/ff8-decomp-semantics-20261011-r01/${checks.group}/common-compaction.md`];
  let supplement='';
  if(checks.ea==='0x50B830') {
    const dir=`inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B830.supplemental-v1`;
    const mb=fs.readFileSync(path.join(a.root,dir,'manifest.json')), sm=JSON.parse(mb);
    if(a.sha(mb)!=='ddf0c47e293841fdd067f43f05b0f582c733984a96d5a3317883a75f157a8e3a'||sm.original_packet_sha256!==manifest.original_sha256) throw new Error('Supplement provenance mismatch');
    for(const f of sm.files){const b=fs.readFileSync(path.join(a.root,dir,f.file));if(b.length!==f.bytes||a.sha(b)!==f.sha256)throw Error('Supplement hash mismatch');}
    exact.push(dir+'/manifest.json',...sm.files.map(f=>dir+'/'+f.file));
    supplement=`Supplément commun A/B des deux volets autorisé, version1: 32 octets natifs [0x50BAE0,0x50BB00), 8 DWORDs LE sans interprétation. Manifeste SHA256 ${a.sha(mb)}. Capture superviseur statique: racine gelée==IDB==PE, table IDB==PE, EXE SHA256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570. Ancien gel/checkpoint inchangés; utiliser ensemble original+supplément. Pas de labels sémantiques ajoutés.`;
  }
  const role=task.content.split(',')[0];
  const isC=role.startsWith('PRODUCE C');
  const text=[
    `[INPUT-ADMISSION-HARDENING-v1] Reprise bornée de votre tâche existante, pas une nouvelle admission.`,
    `Identité: ${name}; ${row.session}; ${task.id}; ${role}. Profil ${s.agent}; répertoire ${a.root}.`,
    `Règle actuelle run01 (avenant utilisateur 2026-10-12): Model.Ref comparé à model_routing.selected persisté au départ, non aux mentions historiques Sol high/Astra high/Pool25. Preuve parent native et snapshot SQLite lecture seule: attendu ${row.admission.expected.id} variante ${row.admission.expected.reasoningEffort}; observé ${s.model.providerID}/${s.model.id} variante ${s.model.variant}; override=${row.admission.model_override}; égalité provider+ID+variante PASS. Aucun changement de routage/modèle.`,
    `Contexte enregistré inchangé: ${d.mode}, révision ${task.context.revision}, source ${d.from}, ${d.mode==='checkpoint'?'frontière EXCLUSIVE before '+d.messageID:'fork factuel complet approuvé'}. Prefixe natif retenu ${end} messages: égalité vérifiée. CONTRAT run01 §Contexte point5: forks indépendants depuis le même explorateur factuel explicitement autorisés; ce n'est ni le lead ni un auteur frère. Pas de remplacement fresh.`,
    `Entrée vérifiée parent: ${manifest.projection}. ${manifest.assembly_lines} lignes ASM; manifeste SHA256 ${checks.manifest_sha256}; original SHA256 ${manifest.original_sha256}, identique au gel natif historique; compaction SHA256 ${manifest.compaction_sha256}. Tous fichiers/taille/hashes vérifiés, version inchangée. Les hashes sont attestés parent: ne pas prétendre les avoir recalculés.`,
    supplement,
    `Lecture précise autorisée (profil effectif read inputs/*). Utiliser read, sans listing, chaque fichier explicitement; metadata en tranches de 100 lignes si nécessaire, ASM/bytes en petits fichiers connus. CONTRACT.md et .tmp sont refusés, pas ces copies inputs. Ne plus les ouvrir ni demander de listing. Aucun contournement shell/API/index; outil absent distinct d'un chemin erroné.`,
    ...exact.map(p=>a.root+'/'+p),
    isC?'Livrable C complet: identité/provenance; prototype/ABI observés; code; couverture des blocs/chunks; largeurs/signedness/wrap/shift; AL/AX/EAX; args cdecl droite→gauche; effets/retours; preuves ASM et limites. Ne pas inventer de callee/type/métier.':'Livrable sémantique: identité/provenance; rôle; entrées/sorties/effets; confiance CERTAIN/UNCERTAIN/CONFLICT; nom proposé/verdict nom; 3–8 preuves ASM/xrefs; inconnues. ASM fait foi, noms IDA non probants seuls.',
    `Seule écriture: ${a.root}/${row.output.path}. A/B aveugles: aucune lecture pair/autre volet/output tiers/ledger/histoire. Pas IDB/git/registre/live/délégation. Donnée native réellement absente ou lecture précise refusée: signaler fichier+erreur sans inventer ni répéter le même essai. Dépôt ≠ validation/promotion. À la fin, signaler dépôt et terminer seulement cette tâche. Ce message contient tout le contrat nécessaire, ne pas attendre CONTRACT.md.`
  ].join('\n');
  if(Buffer.byteLength(text)>10000) throw new Error('Handoff exceeds tool limit');
  const record={at:new Date().toISOString(),task:task.id,session:row.session,model:s.model,expected:row.admission.expected,context:task.context,checks,originalNativeSha256:manifest.original_sha256,latestMessage:messages.at(-1),nativeTail:ctx.slice(-3).map(m=>({id:m.id,type:m.type})),text};
  const saved=path.join(folder,'handoff-'+name+'.json');
  if(fs.existsSync(saved)&&JSON.parse(fs.readFileSync(saved,'utf8')).text!==text) throw new Error('Prepared handoff changed; version explicitly');
  const receipt=fs.existsSync(saved)?writeReceipt('preflight-'+name+'-'+Date.now()+'.json',record):writeReceipt('handoff-'+name+'.json',record);
  return {to:name,text,receipt};
}
export async function prepareR(name) {
  const base=JSON.parse(fs.readFileSync(path.join(folder,'baseline.json'),'utf8'));
  const row=base.rows.find(x=>x.name===name);
  if(!row?.task.content.startsWith('RECONCILE'))throw Error('Not R');
  const t=await a.state(),task=t.tasks.find(x=>x.id===row.task.id),member=t.members.find(x=>x.name===name);
  if(t.capacity.limit!==5||t.scheduling.autoScale||t.scheduling.autoDispatch||t.capacity.running+t.capacity.starting>=5)throw Error('No free bounded slot');
  if(task.status!=='in_progress'||task.assignee!==name||member.executionStatus!=='idle'||JSON.stringify(task.context)!==JSON.stringify(row.task.context))throw Error('R state changed');
  const messages=t.messages.filter(x=>x.toName===name||x.fromName===name).sort((x,y)=>x.timeCreated-y.timeCreated);
  if(messages.some(x=>x.toName===name&&x.content.includes('[INPUT-ADMISSION-HARDENING-v1]')))throw Error('Correction already sent');
  const s=(await a.native('/api/session/'+member.sessionId)).data;
  const ctx=(await a.native('/api/session/'+member.sessionId+'/context')).data;
  const active=(await a.native('/api/session/active')).data;
  if(active[s.id]&&active[s.id].type!=='idle')throw Error('Already active');
  if(s.fork||task.context.decision.mode!=='fresh'||!row.admission.modelMatch||JSON.stringify(s.model)!==JSON.stringify(row.native.model)||a.canon(s.location.directory)!==a.canon(a.root))throw Error('R native admission mismatch');
  if(fs.existsSync(path.join(a.root,row.output.path)))throw Error('R output exists');
  const volet=/RECONCILE C /.test(task.content)?'C':'semantic';
  const dir=`inputs/ff8-decomp-semantics-20261011-r01/reconciliation/${row.inputs.group}/${row.inputs.ea}/${volet}`;
  const mb=fs.readFileSync(path.join(a.root,dir,'manifest.json')), manifest=JSON.parse(mb);
  if(manifest.reconciler?.session!==s.id||manifest.authors.length!==2||manifest.authors[0].session===manifest.authors[1].session)throw Error('R projection ownership/independence mismatch');
  const checks=manifest.files.map(f=>{const bytes=fs.readFileSync(path.join(a.root,dir,f.file));if(bytes.length!==f.bytes||a.sha(bytes)!==f.sha256)throw Error('Frozen R input mismatch');return {file:f.file,sha256:f.sha256,bytes:f.bytes};});
  for(const au of manifest.authors){const src=(await a.native('/api/session/'+au.fork.sessionID)).data;if(src.agent!=='explore'||src.id===t.leadSessionId||manifest.authors.some(x=>x.session===src.id))throw Error('Not a factual explorer source');if(a.sha(fs.readFileSync(path.join(a.root,au.source)))!==au.sha256)throw Error('Candidate changed after freeze');}
  const text=[
    `[INPUT-ADMISSION-HARDENING-v1] GO reprise même tâche ${task.id}, rôle ${volet} R ${row.inputs.ea}, membre ${name}, session ${s.id}. Répertoire ${a.root}.`,
    `Admission native vérifiée: attendu persisté ${row.admission.expected.id} / ${row.admission.expected.reasoningEffort}, observé ${s.model.providerID}/${s.model.id} / ${s.model.variant}, override=${row.admission.model_override}, provider+ID+variante PASS. Avenant run01 2026-10-12: anciennes mentions Sol high/Astra high/Pool25 non opposables, pas de recalcul contre la politique courante.`,
    `Votre contexte R reste fresh sans fork, révision ${task.context.revision}. A/B sont des sessions distinctes héritant uniquement de l'explorateur factuel, NON du lead ou d'un auteur. CONTRAT run01, Contexte et classification point5 (ligne53), autorisation utilisateur explicite: «Productions C et sémantique en parallèle, forks indépendants depuis la même session explorateur gelée ... Pas d'héritage des productions des frères ni du lead». Cette disposition de mission précise le défaut fresh du guide général; ne pas falsifier/effacer les champs fork du manifeste.`,
    ...manifest.authors.map(x=>`Auteur ${x.role}: ${x.session}; source explorateur ${x.fork.sessionID}; frontière exclusive ${x.fork.boundary?.messageID||'fork complet approuvé'}; candidat SHA256 ${x.sha256}. Indépendance et dépôts vérifiés par le parent, pas de validation sémantique implicite.`),
    `Projection R autorisée gelée: manifeste SHA256 ${a.sha(mb)}; ${checks.length} fichiers taille+hash vérifiés. Noms native-* sont copies verbatim, correspondance source dans manifeste extérieur. Pas de lecture directe des outputs A/B.`,
    ...['manifest.json',...manifest.files.map(f=>f.file)].map(f=>a.root+'/'+dir+'/'+f),
    `Utiliser read précis, sans listing; tranches de 100 lignes pour gros fichiers connus. Profil read inputs/* vérifié. CONTRACT/.tmp non autorisés: contrat utile fourni ici. Ni shell/API/index ni outil de contournement; si donnée/outil indispensable réellement absent, blocage précis.`,
    `Livrable: matrice des divergences A/B citant ASM/bytes, arbitrage sans moyenne, ${volet==='C'?'C complet avec couverture, ABI/largeurs/signedness/retours':'rôle/entrées/sorties/effets, confiance/nom et 3–8 preuves'}, corrections ou UNCERTAIN/CONFLICT documenté. Même accord A=B doit être confronté aux opcodes.`,
    `Seule sortie ${a.root}/${row.output.path}. Pas autre volet/outputs/ledger/histoire/IDB/git/live/délégation. Hashes attestés parent, pas recalcul worker prétendu. Dépôt ≠ promotion. Signaler puis compléter uniquement la tâche assignée.`
  ].join('\n');
  if(Buffer.byteLength(text)>10000)throw Error('R handoff too large');
  const receipt=writeReceipt('handoff-'+name+'.json',{at:new Date().toISOString(),task:task.id,session:s.id,context:task.context,model:s.model,expected:row.admission.expected,manifestSha256:a.sha(mb),checks,latestMessage:messages.at(-1),nativeTail:ctx.slice(-3).map(x=>({id:x.id,type:x.type})),text});
  return {to:name,text,receipt};
}
export async function verifyResumptions(label) {
  const b=JSON.parse(fs.readFileSync(path.join(folder,'baseline.json'),'utf8')),t=await a.state();
  const active=(await a.native('/api/session/active')).data,rows=[];
  for(const prior of b.rows) {
    const sent=t.messages.filter(x=>x.toName===prior.name&&x.content.includes('[INPUT-ADMISSION-HARDENING-v1]')).sort((x,y)=>x.timeCreated-y.timeCreated).at(-1);
    if(!sent)continue;
    const task=t.tasks.find(x=>x.id===prior.task.id),m=t.members.find(x=>x.name===prior.name);
    const s=(await a.native('/api/session/'+m.sessionId)).data,c=(await a.native('/api/session/'+m.sessionId+'/context')).data;
    const index=c.findIndex(x=>textOnly(x).includes('[INPUT-ADMISSION-HARDENING-v1]'));
    const tools=index>=0?c.slice(index).flatMap(toolsOnly):[];
    const reads=tools.filter(x=>x.name==='read'&&x.status==='completed');
    const writes=tools.filter(x=>x.name==='patch'&&x.status==='completed');
    const errors=tools.filter(x=>x.status==='error');
    const p=path.join(a.root,prior.output.path),exists=fs.existsSync(p);
    let deposit=null;
    if(exists) {
      const bytes=fs.readFileSync(p);
      const additions=writes.filter(x=>x.input?.patchText?.includes('*** Add File: '));
      let exact=false;
      if(additions.length===1&&writes.length===1) {
        const lines=additions[0].input.patchText.split(/\r?\n/),start=lines.findIndex(x=>x.startsWith('*** Add File: '));
        const dest=lines[start]?.slice('*** Add File: '.length),body=[];
        for(const l of lines.slice(start+1)){if(l.startsWith('*** '))break;if(!l.startsWith('+'))throw Error('Invalid native patch syntax');body.push(l.slice(1));}
        exact=a.canon(path.resolve(a.root,dest))===a.canon(p)&&Buffer.from(body.join('\n')+'\n').equals(bytes);
      }
      deposit={path:prior.output.path,sha256:a.sha(bytes),bytes:bytes.length,nativeWrites:writes.map(x=>x.message),nativeSingleAddByteExact:exact,scope:'Deposit/provenance only, not RE acceptance'};
    }
    const supplementalEA=['0x50B830','0x50B2A0'].includes(prior.inputs.ea)?prior.inputs.ea:null;
    const supplementalReadPaths=supplementalEA?[...new Set(reads.filter(x=>(x.input?.path||'').replaceAll('\\','/').includes('/'+supplementalEA+'.supplemental-v1/')).map(x=>path.basename(x.input.path)))]:[];
    const lastReport=t.messages.filter(x=>x.fromName===prior.name).sort((x,y)=>x.timeCreated-y.timeCreated).at(-1);
    rows.push({name:prior.name,task:task.id,status:task.status,contextUnchanged:JSON.stringify(task.context)===JSON.stringify(prior.task.context),
      nativeModel:s.model,modelMatch:JSON.stringify(s.model)===JSON.stringify(prior.native.model),native:active[m.sessionId]?.type||'idle',execution:m.executionStatus,
      handoffMessage:sent.id,handoffPresent:index>=0,readCount:reads.length,successfulReads:reads.map(x=>x.input),errors,deposit,
      supplemental: supplementalEA?{ea:supplementalEA,readPaths:supplementalReadPaths,allFourRead:['manifest.json','table.json','dispatch.txt','provenance.json'].every(x=>supplementalReadPaths.includes(x))}:null,
      lastReport:lastReport&&lastReport.timeCreated>=sent.timeCreated?lastReport:null,
      lastNativeText:c.filter(x=>x.type==='assistant'&&textOnly(x)).slice(-1).map(x=>({id:x.id,text:textOnly(x)})),
      resumedVerified:task.assignee===prior.name&&index>=0&&reads.length>0});
  }
  const unchanged={contexts:b.decisionBaseline.every(x=>JSON.stringify(t.tasks.find(y=>y.id===x.id)?.context)===JSON.stringify(x.context)),modelPolicy:JSON.stringify(b.modelPolicy)===JSON.stringify(t.modelPolicy),routingPolicy:JSON.stringify(b.routingPolicy)===JSON.stringify(t.routingPolicy)};
  const report={at:new Date().toISOString(),summary:a.summary(t),unchanged,rows};
  const receipt=writeReceipt(label+'.json',report);
  console.log(JSON.stringify({receipt,summary:report.summary,unchanged}));
  for(const r of rows)console.log(`${r.name} | ${r.status}/${r.native} | resumed=${r.resumedVerified} reads=${r.readCount} errors=${r.errors.length} | deposit=${!!r.deposit} exact=${r.deposit?.nativeSingleAddByteExact}`);
  return report;
}
export async function prepare50B2A0Supplement(name) {
  const baseline=JSON.parse(fs.readFileSync(path.join(folder,'baseline.json'),'utf8'));
  const row=baseline.rows.find(x=>x.name===name);
  if(row?.inputs.ea!=='0x50B2A0')throw Error('Wrong supplement author');
  const t=await a.state(),task=t.tasks.find(x=>x.id===row.task.id),m=t.members.find(x=>x.name===name);
  if(t.capacity.limit!==5||t.scheduling.autoScale||t.scheduling.autoDispatch||task.assignee!==name||JSON.stringify(task.context)!==JSON.stringify(row.task.context))throw Error('Changed state/context');
  const messages=t.messages.filter(x=>x.toName===name||x.fromName===name).sort((x,y)=>x.timeCreated-y.timeCreated);
  if(messages.some(x=>x.toName===name&&x.content.includes('[50B2A0-SUPPLEMENT-v1]')))throw Error('Supplement already sent');
  const s=(await a.native('/api/session/'+m.sessionId)).data,c=(await a.native('/api/session/'+m.sessionId+'/context')).data;
  if(JSON.stringify(s.model)!==JSON.stringify(row.native.model)||!row.admission.modelMatch||a.canon(s.location.directory)!==a.canon(a.root))throw Error('Model/directory divergence');
  if(!a.inputCheck(task).ok)throw Error('Base inputs changed');
  const dir='inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B2A0.supplemental-v1';
  const mb=fs.readFileSync(path.join(a.root,dir,'manifest.json')),mf=JSON.parse(mb);
  if(a.sha(mb)!=='d0abc9ed75a59c179a143a880ca67583e5c19883fcb40d86acca8bbff5072222'||mf.original_packet_sha256!=='a2948fb2cfed39d50786de24509013d91ce4e411862d0610508c371e3ce3bbaf')throw Error('Supplement manifest mismatch');
  for(const f of mf.files){const b=fs.readFileSync(path.join(a.root,dir,f.file));if(b.length!==f.bytes||a.sha(b)!==f.sha256)throw Error('Supplement bytes mismatch');}
  const previouslyResumed=c.some(x=>textOnly(x).includes('[INPUT-ADMISSION-HARDENING-v1]'));
  const force=m.executionStatus==='idle'&&previouslyResumed;
  const text=[
    `[50B2A0-SUPPLEMENT-v1] Nouvelle donnée native réellement manquante, pas un renvoi du handoff antérieur. ${task.id}; ${task.content.split(',')[0]}; ${name}; session ${s.id}; répertoire ${a.root}.`,
    `Admission relue: attendu persisté ${row.admission.expected.id} / ${row.admission.expected.reasoningEffort}, observé ${s.model.providerID}/${s.model.id} / ${s.model.variant}, override=${row.admission.model_override}, égalité PASS. Mentions historiques de modèles non opposables. Contexte ${task.context.decision.mode} r${task.context.revision}, source ${task.context.decision.from}, frontière exclusive ${task.context.decision.messageID}, inchangé.`,
    `Le superviseur vient de capturer et geler les 40 octets [0x50B7E8,0x50B810), 10 DWORD LE sans interprétation; racine gelée==IDB==PE, table IDB==PE. PE SHA256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570. Manifeste supplément SHA256 ${a.sha(mb)}; table SHA256 ${mf.table_sha256}. Tailles/hashes relus parent. Les originaux et checkpoints restent inchangés.`,
    `Extension factuelle identique autorisée aux quatre auteurs A/B C/sémantique. Lire précisément ces quatre fichiers supplémentaires, autorisés par read inputs/*, sans listing ni shell/API/IDA:`,
    ...['manifest.json',...mf.files.map(x=>x.file)].map(f=>a.root+'/'+dir+'/'+f),
    `Si vous êtes en cours de travail, poursuivez sans interruption/remplacement et intégrez ce supplément au prochain point naturel. Si vous étiez bloqué sur cette table, ce seul blocage est levé. Le handoff initial reste applicable; pas de nouvelle admission, pas de lecture frère/autre volet. Même sortie unique ${a.root}/${row.output.path}; citer version/hash parent, aucun PASS/promotion implicite. Toute autre donnée native réellement manquante reste une limite explicite à signaler.`
  ].join('\n');
  const receipt=writeReceipt('supplement-handoff-'+name+'.json',{at:new Date().toISOString(),task:task.id,session:s.id,model:s.model,expected:row.admission.expected,context:task.context,execution:m.executionStatus,previouslyResumed,force,latestMessage:messages.at(-1),text});
  return {to:name,text,force,receipt};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  await audit(process.argv[2],process.argv[3]||'baseline',process.argv.slice(4));
