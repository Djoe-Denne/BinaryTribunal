import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync,cpSync,renameSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',source='C:/Users/djden/AppData/Local/Temp/opencode/ensemble-coordination-three-20261014',home='C:/Users/djden/.config/opencode',teamID='team_mv6tmopg_0000_4urn3c';
const sha=(v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
const save=(name:string,value:unknown)=>writeFileSync(phase+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const endpoint=await Service.discover();if(!endpoint)throw new Error('Public native service unavailable');
const client=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const location={directory:root};
async function state(){const response=await fetch('http://127.0.0.1:4747/api/state',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Public state unavailable');return(await response.json()).teams.find((t:{id:string})=>t.id===teamID);}
async function guard(){return(await client.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location,input:{}})).output as {ready:boolean;pausedTeams:string[];admissionPausedTeams:string[]};}
async function quiescent(){const t=await state(),active=await client.session.active();if(!t||[t.leadSessionId,...t.members.map((m:{sessionId:string})=>m.sessionId)].some(id=>active[id]))throw new Error('Campaign not natively quiescent');const g=await guard();if(!g.ready||!g.pausedTeams.includes(teamID)||!g.admissionPausedTeams.includes(teamID))throw new Error('Operator pause/guard not active');return t;}

if(process.argv[2]==='install'){
  const gates=JSON.parse(readFileSync(phase+'/release-gates-hardened.json','utf8'));if(gates.length!==8||gates.some((g:{exit:number})=>g.exit!==0))throw new Error('Release gates not green');
  const t=await quiescent();save('deployment-state-before.json',t);
  for(const id of new Set([t.leadSessionId,...t.members.filter((m:{status:string})=>!['shutdown','error'].includes(m.status)).map((m:{sessionId:string})=>m.sessionId),...Object.keys(await client.session.active())])){if((await client.session.form.list({sessionID:id})).length)throw new Error('Pending form; activation forbidden');const s=await client.session.get({sessionID:id});if((await client.permission.request.list({location:{directory:s.location.directory}})).data.length)throw new Error('Pending permission; activation forbidden');}
  const configFile=home+'/opencode.json',configBytes=readFileSync(configFile),cfg=JSON.parse(configBytes.toString()),previous=home+'/local-plugins/ensemble/20261014-member-recovery-71d3bcbee00f';
  const slots=cfg.plugins.filter((p:{package:string})=>p.package===previous);if(slots.length!==1)throw new Error('Installed plugin boundary changed');
  const prefs=readFileSync(home+'/ensemble.json');if(JSON.stringify(JSON.parse(prefs.toString()))!==JSON.stringify(JSON.parse(readFileSync(phase+'/preferences-before.json','utf8'))))throw new Error('Preferences changed during maintenance');
  const artifact=readFileSync(source+'/dist/index.js'),hash=sha(artifact),release=home+'/local-plugins/ensemble/20261014-coordination-three-'+hash.slice(0,12);if(existsSync(release))throw new Error('Never overwrite a release');mkdirSync(release);
  for(const folder of ['docs','skills'])cpSync(previous+'/'+folder,release+'/'+folder,{recursive:true});
  copyFileSync(source+'/docs/coordination-three.md',release+'/docs/coordination-three.md');
  writeFileSync(release+'/index.js',artifact,{flag:'wx'});const pkg=JSON.parse(readFileSync(previous+'/package.json','utf8'));pkg.version='0.19.0-local.20261014.coordination-three.'+hash.slice(0,12);writeFileSync(release+'/package.json',JSON.stringify(pkg,null,2)+'\n',{flag:'wx'});
  const files=['src/mechanical-preparation.ts','src/pre-review.ts','src/l2-pre-review.ts','scripts/prepare-transfer.ts','scripts/plan-review.ts','scripts/pre-review.ts','test/mechanical-preparation.test.ts','test/pre-review.test.ts','docs/COORDINATION_HELPERS.md','dist/coordination/prepare-transfer.js','dist/coordination/plan-review.js','dist/coordination/pre-review.js'];
  const stagedPkg=JSON.parse(readFileSync(phase+'/harness/package.json','utf8')),currentPkgBytes=readFileSync(root+'/tools/ff8-harness/package.json'),currentPkg=JSON.parse(currentPkgBytes.toString()),originalPkg=structuredClone(stagedPkg);
  for(const key of ['prepare:transfer','review:scope','review:preflight','build:coordination'])delete originalPkg.scripts[key];
  if(JSON.stringify(currentPkg)!==JSON.stringify(originalPkg))throw new Error('Harness package changed; reconcile, do not overwrite');
  for(const file of files)if(existsSync(root+'/tools/ff8-harness/'+file))throw new Error('New helper target already exists: '+file);
  writeFileSync(phase+'/harness-package-before.json',currentPkgBytes,{flag:'wx'});writeFileSync(phase+'/deployment-opencode-before.json',configBytes,{flag:'wx'});
  const deployed=[];
  for(const file of files){const dst=root+'/tools/ff8-harness/'+file;mkdirSync(dst.slice(0,dst.lastIndexOf('/')),{recursive:true});copyFileSync(phase+'/harness/'+file,dst);const digest=sha(readFileSync(dst));if(digest!==sha(readFileSync(phase+'/harness/'+file)))throw new Error('Helper readback mismatch');deployed.push({file,sha256:digest});}
  for(const key of ['prepare:transfer','review:scope','review:preflight','build:coordination'])currentPkg.scripts[key]=stagedPkg.scripts[key];
  if(sha(readFileSync(root+'/tools/ff8-harness/package.json'))!==sha(currentPkgBytes)||sha(readFileSync(configFile))!==sha(configBytes))throw new Error('Concurrent configuration writer');
  writeFileSync(root+'/tools/ff8-harness/package.json',JSON.stringify(currentPkg,null,2)+'\n');
  slots[0].package=release;const temp=configFile+'.coordination-three-20261014';writeFileSync(temp,JSON.stringify(cfg,null,2)+'\n',{flag:'wx'});renameSync(temp,configFile);
  save('release.json',{at:new Date().toISOString(),previous,release,artifactSha256:hash,source,deployed,gates,pauseRetained:true,schemaVersion:19,modelsUnchanged:true,powerAction:false});
  console.log(JSON.stringify({release,artifactSha256:hash,helperFiles:deployed.length,pauseRetained:true}));
}else if(process.argv[2]==='verify'){
  // OpenCode observes the configuration change itself. Do not force a global
  // reload or bypass a refused reload; require authoritative active readback.
  const t=await quiescent(),plugins=await client.plugin.list({location}),release=JSON.parse(readFileSync(phase+'/release.json','utf8'));
  const loaded=plugins.data.find(p=>p.id==='ensemble');
  if(loaded?.state.status!=='active'||loaded.source.type!=='local'||loaded.source.path.replaceAll('\\','/').toLowerCase()!==(release.release+'/index.js').toLowerCase()||sha(readFileSync(release.release+'/index.js'))!==release.artifactSha256)throw new Error('Active release readback mismatch');
  save('activation-verified.json',{at:new Date().toISOString(),plugin:loaded,artifactSha256:release.artifactSha256,forcedReload:false});
  const before=await client.session.inbox.list({sessionID:t.leadSessionId});save('inbox-before-maintenance.json',before);
  const dry=await client.rpc.call({rpcID:'ensemble',method:'notificationMaintenance',location,input:{team:teamID,apply:false}});save('notifications-dry-run.json',dry);
  const applied=await client.rpc.call({rpcID:'ensemble',method:'notificationMaintenance',location,input:{team:teamID,apply:true}});save('notifications-applied.json',applied);
  const after=await client.session.inbox.list({sessionID:t.leadSessionId});save('inbox-after-maintenance.json',after);
  const result=applied.output as {cancelled:string[];reportsBeforeSha256:string;reportsAfterSha256:string;reportRowsPreserved:boolean};
  if(!result.reportRowsPreserved||result.reportsBeforeSha256!==result.reportsAfterSha256||after.some(i=>result.cancelled.includes(i.id)))throw new Error('Notification cancellation/preservation proof failed');
  const guide=`User-authorized coordination maintenance 2026-10-14. Campaign remains paused until a new user GO. Read docs/missions/re-graph-scheduler/COORDINATION_HELPERS_GO_20261014.md and tools/ff8-harness/docs/COORDINATION_HELPERS.md before resuming. Native report wakes are now coalesced and old read/delivered hints cancelled, without removing reports/history. Do not rerun an old review from a stale hint. Use the generation-free prepare:transfer helper for explicit hash-pinned input packages; it verifies native session/task ownership, returns prepared-not-approved and does not prove worker tool access or the declared logical role. Parent alone approves projections, actual access, deliveries and transfers. Before paying for any fresh L2 review, run review:preflight on exactly its frozen module root; bind the PASS fingerprint/report and exercise affected older regressions. The bounded profile checks real generator/schema/cache agreement, Unicode/ID limits, namespace collisions, bindings, clones, invalidation and input immutability. PASS is not independent review, native/IDB validation or scientific acceptance. review:scope recommends a bounded delta only with a matching parent-endorsed prior coverage reference; absent/mismatched scope, removal or metadata change requires full review. Always keep the fresh independent reviewer and all parent gates. Preserve OLD/V4/NEW frozen inputs, current models/variants, profiles, task/cycle identity and mission scope; no extra workers, purchases, disabled models, fallback, reset, source/gels overwrite, IDB/live action or automatic L2/L8 integration. The evaluated L2 snapshot passed this finite offline preflight; scientific acceptance/status is unchanged by this maintenance. A completed task cannot be reopened implicitly by prepare:transfer; obtain the proper new assignment from the parent. All tests/readbacks and local receipts are .tmp/coordination-three-20261014/.`;
  const publication=await client.rpc.call({rpcID:'ensemble',method:'coordinationGuide',location,input:{team:teamID,guide,expectedRevision:0}});save('coordination-guide-published.json',publication);
  const readback=await client.rpc.call({rpcID:'ensemble',method:'coordinationGuide',location,input:{team:teamID}});save('coordination-guide-readback.json',readback);
  const book=readback.output as {guide:string;sha256:string;revision:number};if(book.guide!==guide||book.sha256!==sha(guide)||book.revision!==1)throw new Error('Guide readback failed');
  const completed=t.tasks.find((q:{assignee:string;status:string})=>q.assignee==='l2-ids-astra'&&q.status==='completed'),writer=t.members.find((m:{name:string})=>m.name==='l2-ids-astra');
  let completedTaskDenied=false;
  if(completed&&writer){
    const nativeSession=await client.session.get({sessionID:writer.sessionId});
    try{await client.rpc.call({rpcID:'ensemble',method:'preparationBinding',location:{directory:nativeSession.location.directory},input:{sessionID:writer.sessionId,taskID:completed.id}});}
    catch(error){if(!String(error).includes('No owned active native task binding'))throw error;completedTaskDenied=true;save('completed-task-preparation-denied.json',{task:completed.id,session:writer.sessionId,expectedDenial:String(error)});}
    if(!completedTaskDenied)throw new Error('Completed task was implicitly readmitted');
  }
  const task=t.tasks.find((q:{assignee?:string;status:string})=>q.status==='in_progress'&&t.members.some((m:{name:string;status:string})=>m.name===q.assignee&&!['shutdown','error'].includes(m.status)));
  let preparationBindingVerified=false;
  if(task){
    const member=t.members.find((m:{name:string})=>m.name===task.assignee),nativeSession=await client.session.get({sessionID:member.sessionId});
    const binding=await client.rpc.call({rpcID:'ensemble',method:'preparationBinding',location:{directory:nativeSession.location.directory},input:{sessionID:member.sessionId,taskID:task.id}});save('live-preparation-binding.json',binding);
    const value=binding.output as {teamId:string;taskId:string;sessionId:string};if(value.teamId!==teamID||value.taskId!==task.id||value.sessionId!==member.sessionId)throw new Error('Native task ownership readback mismatch');preparationBindingVerified=true;
  }
  save('native-verification.json',{at:new Date().toISOString(),release:release.release,artifactMatches:true,nativeQueueBefore:before.length,nativeQueueAfter:after.length,cancelled:result.cancelled.length,reportsSha256:result.reportsBeforeSha256,guideRevision:book.revision,completedTaskDenied,preparationBindingVerified,workerInputCopies:0,pause:await guard(),nativeInferenceProbe:false,powerAction:false});
  console.log(JSON.stringify({cancelled:result.cancelled.length,queueBefore:before.length,queueAfter:after.length,reportsPreserved:true,guideRevision:book.revision,preparationBindingVerified,completedTaskDenied,pauseRetained:true}));
}else throw new Error('Expected install or verify');
