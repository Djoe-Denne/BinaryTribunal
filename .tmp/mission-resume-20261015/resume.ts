import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/mission-resume-20261015',prefs='C:/Users/djden/.config/opencode/ensemble.json',teamId='team_mv6tmopg_0000_4urn3c',leadId='ses_eca40a8e2ffeanEKTBLiGjDNw8',location={directory:root};
const save=(n:string,v:unknown)=>writeFileSync(phase+'/'+n,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),sha=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
const endpoint=await Service.discover();if(!endpoint)throw new Error('Public native service unavailable');
const client=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
async function team(){const r=await fetch('http://127.0.0.1:4747/api/state',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Public mission state unavailable');const t=(await r.json()).teams.find((t:{id:string})=>t.id===teamId);if(!t||t.leadSessionId!==leadId||t.name!=='re-graph-scheduler'||t.status!=='active')throw new Error('Existing mission identity/status changed');return t;}
async function guard(){return(await client.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location,input:{}})).output as {ready:boolean;pausedTeams:string[];admissionPausedTeams:string[]};}
async function model(){const s=await client.session.get({sessionID:leadId}),cfg=JSON.parse(readFileSync(prefs,'utf8'));if(s.model?.providerID!=='openai'||s.model.id!=='gpt-6.1-sol'||s.model.variant!=='xhigh'||!cfg.modelRouting.models.some((m:{id:string;reasoningEffort:string;available:boolean})=>m.id===s.model.providerID+'/'+s.model.id&&m.reasoningEffort===s.model.variant&&m.available===true))throw new Error('Existing supervisor model changed or not selected; no fallback');return s.model;}
const mode=process.argv[2];
if(mode==='prepare'){
  const t=await team(),active=await client.session.active(),g=await guard(),nativeModel=await model();
  if(!g.ready||!g.pausedTeams.includes(teamId)||!g.admissionPausedTeams.includes(teamId)||[leadId,...t.members.map((m:{sessionId:string})=>m.sessionId)].some(id=>active[id]))throw new Error('Pause/quiescent precondition failed');
  if((await client.session.form.list({sessionID:leadId})).length)throw new Error('Supervisor has an unanswered native form');
  const plugin=(await client.plugin.list({location})).data.find(p=>p.id==='ensemble');if(plugin?.state.status!=='active'||plugin.source.type!=='local'||!plugin.source.path.includes('20261014-coordination-three-0b4e7444042b'))throw new Error('Verified coordination plugin not active');
  const old=(await client.rpc.call({rpcID:'ensemble',method:'coordinationGuide',location,input:{team:teamId}})).output as {guide:string;sha256:string;revision:number};
  if(old.revision!==1||sha(old.guide)!==old.sha256||!old.guide.includes('Campaign remains paused until a new user GO.'))throw new Error('Unexpected parent guide revision; reconcile instead of overwrite');
  writeFileSync(phase+'/preferences-before.json',readFileSync(prefs),{flag:'wx'});save('before.json',{at:new Date().toISOString(),team:t,guard:g,nativeModel,plugin,guide:old});
  const guide=old.guide.replace('Campaign remains paused until a new user GO.','User explicitly authorized continuation of re-graph-scheduler on 2026-10-15. Resume only the existing supervisor, under the unchanged mission contract and selected models. Read docs/missions/re-graph-scheduler/RESUME_AFTER_COORDINATION_20261015.md; its explicit GO supersedes historical pause notes.')
    .replace('no extra workers, purchases, disabled models, fallback, reset, source/gels overwrite, IDB/live action or automatic L2/L8 integration.','no workers outside the existing mission scope, purchases, disabled models, fallback, reset, source/gels overwrite, unauthorized IDB/live action or automatic L2/L8 integration.');
  const published=await client.rpc.call({rpcID:'ensemble',method:'coordinationGuide',location,input:{team:teamId,guide,expectedRevision:old.revision}});save('guide-updated.json',published);
  const read=(await client.rpc.call({rpcID:'ensemble',method:'coordinationGuide',location,input:{team:teamId}})).output as typeof old;
  if(read.revision!==2||read.guide!==guide||sha(read.guide)!==read.sha256)throw new Error('Resumption guide readback failed');
  const text=`GO explicite utilisateur du 2026-10-15 : « Tu peux lancer la mission [...] je te laisse décider » du partage de contexte. Reprends re-graph-scheduler dans cette même session de superviseur, sans nouvelle équipe ni nouveau superviseur. Le guide parent révision 2 contient ce GO et les informations ci-dessous.

Lire docs/missions/re-graph-scheduler/RESUME_AFTER_COORDINATION_20261015.md et tools/ff8-harness/docs/COORDINATION_FIX_20261014.md. Maintenance déployée et native-readback vérifié : plugin coordination-three-0b4e7444042b, un wake durable coalescé, lecture/livraison/scopes corrigés ; 30 anciens réveils annulés, 2 conservés, rapports intacts. Ne pas refaire une revue à cause d'un ancien réveil. Scripts prepare:transfer (SHA256/receipt/binding session-tâche, pas preuve d'accès), review:scope (delta seulement sur couverture parent endossée) et review:preflight (générateur/schéma/cache) disponibles. Reviewer frais/indépendant et gates parent restent obligatoires. Une tâche completed n'est pas rouverte implicitement par transfert.

Gates maintenance : 1266 tests plugin et 492 harnais PASS, types/lint/builds et exécutable déployé vérifiés. Snapshot L2 évalué hors ligne : 52 cas / 481 assertions PASS, fingerprint 845540432bf821aa70e7222d3eb560747777c5555dc5c4211f8f4964eed74509 ; PAS acceptation scientifique/native. Tâche l2-ids-astra task_mv8fxhjq_00lh_ap0fn4 marquée completed : récupérer le vrai livrable/gel et vérifier revue fresh/gates encore requises, pas la confondre avec une acceptation. Reprendre ensuite transferts et dépendances de l'ordre existant ; ne pas refaire L4/L5/L6 déjà acceptés sans preuve nouvelle ou delta. Réconcilier l'ancien claim l7-qa-r3 depuis l'état natif, sans considérer idle comme un résultat.

La pause opérateur est levée pour ce seul GO ; modèles/variantes sélectionnés, politique, budget et capacité inchangés. Tu restes seul responsable des claims, contextes, délégations, acceptations et intégrations. Aucun fallback silencieux, reset, nouveau run01/essai scientifique natif/live ou élargissement de mission n'est implicitement autorisé. Garder les protections natives, l'indépendance et les frontières d'écriture. Commencer par un accusé de réception court puis du travail utile ; signaler un blocage réel. Le chat de maintenance ne pilote aucun worker directement.`;
  writeFileSync(phase+'/handoff.txt',text+'\n',{flag:'wx'});save('prepared.json',{at:new Date().toISOString(),teamId,leadId,guideRevision:read.revision,handoffSha256:sha(text+'\n'),nativeModel});
  console.log(JSON.stringify({prepared:true,lead:leadId,guideRevision:read.revision,nativeModel,pauseStillHeld:true}));
}else if(mode==='send'){
  if(existsSync(phase+'/prompt-sent.json')||existsSync(phase+'/send-intent.json'))throw new Error('Resumption was already submitted or ambiguous; inspect receipt/inbox, never blindly resend');
  const prepared=JSON.parse(readFileSync(phase+'/prepared.json','utf8')),t=await team(),g=await guard(),nativeModel=await model(),before=JSON.parse(readFileSync(phase+'/preferences-before.json','utf8')),current=JSON.parse(readFileSync(prefs,'utf8'));
  before.modelRouting.pausedTeams=before.modelRouting.pausedTeams.filter((id:string)=>id!==teamId);
  if(JSON.stringify(before)!==JSON.stringify(current)||!g.ready||g.pausedTeams.includes(teamId)||g.admissionPausedTeams.includes(teamId))throw new Error('Pause not cleared exactly or unrelated preferences changed');
  const text=readFileSync(phase+'/handoff.txt','utf8');if(sha(text)!==prepared.handoffSha256)throw new Error('Handoff altered');
  save('send-intent.json',{at:new Date().toISOString(),teamId,leadId,nativeModel,guard:g,operation:'user-authorized-mission-resume-20261015'});
  const ack=await client.session.prompt({sessionID:leadId,text,delivery:'queue',resume:true,metadata:{operation:'user-authorized-mission-resume-20261015',handoffSha256:prepared.handoffSha256}});
  save('prompt-sent.json',{at:new Date().toISOString(),teamId,leadId,ack,nativeModel});
  const active=await client.session.active();save('first-native-activity.json',{at:new Date().toISOString(),lead:active[leadId]??null,workers:t.members.filter((m:{sessionId:string})=>active[m.sessionId]).map((m:{name:string;sessionId:string})=>({name:m.name,session:m.sessionId,activity:active[m.sessionId]}))});
  console.log(JSON.stringify({submitted:true,lead:leadId,nativeModel,ackId:ack.id,leadActive:!!active[leadId],paused:false}));
}else throw new Error('Expected prepare or send');
