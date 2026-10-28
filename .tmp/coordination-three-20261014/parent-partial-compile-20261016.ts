import { readFileSync, writeFileSync, existsSync, mkdirSync, lstatSync, statSync, realpathSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(p:string)=>JSON.parse(readFileSync(p,'utf8')),local=(p:string)=>load(phase+'/'+p),sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex'),norm=(p:string)=>p.replaceAll('\\','/').toLowerCase();
const a=local('combined-partial-compile-gate-admission-20261016.json'),v=local('combined-partial-compile-image-parent-verification-20261016.json'),g=load(a.destinationRoot+'/TC_BUILD_GATE.json'),source=local('combined-full-validation-plan-preparation-request-20261016.json');
const script=resolve(import.meta.dir,'parent-partial-compile-20261016.ts'),scriptSha=sha(readFileSync(script));
const save=(p:string,j:unknown)=>writeFileSync(p,JSON.stringify(j,null,2)+'\n',{flag:'wx'});
const envDigest=()=>sha(JSON.stringify(Object.entries(process.env).sort(([a],[b])=>a.localeCompare(b))));
const guard=()=>{
 const absent=['FF8_ENSEMBLE_SOURCE','NODE_OPTIONS','BUN_OPTIONS'];for(const name of absent)assert.equal(Object.keys(process.env).filter(k=>k.toUpperCase()===name).length,0,name+' must already be absent');
 for(const name of ['APPDATA','LOCALAPPDATA']){const keys=Object.keys(process.env).filter(k=>k.toUpperCase()===name);assert.equal(keys.length,1);assert.equal(process.env[keys[0]!],g.originalAuthority[name]);}
 for(const p of g.toolchain.globalBunfigAbsentAtKnownHomePaths)assert(!existsSync(p.path));
 let d=g.harness;for(;;){for(const n of ['bunfig.toml','.bunfig.toml','.env','.env.local','.env.development','.env.production'])assert(!existsSync(d+'/'+n),'Unexpected config '+d+'/'+n);const parent=dirname(d);if(parent===d)break;d=parent;}
 return {execPath:process.execPath,pid:process.pid,alreadyAbsentCasefold:absent,originalAuthorityUniqueExact:true,digest:envDigest(),noEnvironmentDeletionMutationOrLoaderException:true};
};
const toolPins=[...g.toolchain.executables,...g.toolchain.requiredEntryPins,...g.toolchain.optionalTypeSdkPins,...g.toolchain.packages.map((p:any)=>p.metadata)];
const pins=()=>{
 const rows:Array<{path:string;bytes:number;sha256:string}>=[],seen=new Set<string>();
 const check=(path:string,hash:string,bytes?:number,readonly=true)=>{if(seen.has(norm(path)))return;seen.add(norm(path));const b=readFileSync(path),s=statSync(path);assert.equal(sha(b),hash,path);if(bytes!==undefined)assert.equal(b.length,bytes,path);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());if(readonly){assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);}rows.push({path,bytes:b.length,sha256:hash});};
 check(a.imageReceipt.path,a.imageReceipt.sha256,a.imageReceipt.bytes);const receipt=load(a.imageReceipt.path);assert.equal(receipt.files.length,436);
 for(const f of receipt.files)check(a.imageRepo+'/'+f.path,f.sha256,f.bytes);
 for(const f of source.files)check(source.destinationRoot+'/'+f.path,f.sha256);
 const srcLedger=g.imageRepo+'/'+receipt.files.find((f:any)=>f.path.endsWith('/battle-graph-ledger.json')).path;
 const ledger=receipt.files.find((f:any)=>f.path.endsWith('/battle-graph-ledger.json'));check(source.destinationRoot+'/'+ledger.path,ledger.sha256,ledger.bytes);
 check(source.destinationRoot+'/.preparation-receipt.json',g.sourceHelperReceiptSha256,undefined,false);check(source.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',g.sourceParentLedgerReceiptSha256,undefined,false);
 for(const f of g.currentPlanPins)check(g.currentPlanRoot+'/'+f.path,f.sha256,f.bytes);
 for(const f of a.files)check(a.destinationRoot+'/'+f.path,f.sha256,f.bytes);check(a.destinationRoot+'/.preparation-receipt.json',v.controlReceiptSha256,undefined,false);check(g.ownerFile.path,g.ownerFile.sha256,g.ownerFile.bytes);
 for(const f of toolPins){check(f.path,f.sha256,f.bytes,false);assert.equal(norm(realpathSync(f.path)),norm(f.realpath));assert.equal(statSync(f.path).nlink,f.nlink);}
 const main=local('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])check(root+'/'+f.path,f.sha256,undefined,false);
 assert(lstatSync(g.dependencyJunction.path).isSymbolicLink());assert.equal(norm(realpathSync(g.dependencyJunction.path)),norm(g.dependencyJunction.target));
 return {count:rows.length,digest:sha(JSON.stringify(rows)),rows};
};
const processRows=()=>{const p=spawnSync('powershell.exe',['-NoProfile','-Command','Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CreationDate,CommandLine | ConvertTo-Json -Compress'],{encoding:'utf8',timeout:20000});assert.equal(p.status,0);const j=JSON.parse(p.stdout||'[]');return Array.isArray(j)?j:[j];};
const native=async()=>{const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.id===g.missionId),task=team.tasks.find((t:any)=>t.id===g.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l8-integration-r1');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);const lead=await cli.session.get({sessionID:team.leadSessionId});assert.equal(lead.id,'ses_eca40a8e2ffeanEKTBLiGjDNw8');assert.deepEqual(lead.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'xhigh'});assert.deepEqual((await cli.session.get({sessionID:g.session})).model,g.model);const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));return {leadSession:lead.id,leadModel:lead.model,workerTask:task.id,workerRemainsHold:true};};
const mode=process.argv[2];assert(['--preflight','--run'].includes(mode));
const startEnv=guard(),n=await native(),pre=pins();assert(!existsSync(g.runRoot)&&!existsSync(g.harness+'/dist'));
// This is metadata observation, not a kill or comprehensive process sandbox.
const all=processRows(),active=all.filter((p:any)=>/^(bun|bunx|node)(\.exe)?$/i.test(p.Name)&&/(?:^|\s|\x22)test(?:\s|\x22|$)|\.test\.ts|(?:^|\s|\x22|[/\\])tsc(?:\.js|\.cjs)?(?:\s|\x22|$)|probe(?:\.ts|\.js)/.test(p.CommandLine??''));assert.equal(active.length,0,JSON.stringify(active));
if(mode==='--preflight'){
 const out={at:new Date().toISOString(),scriptSha256:scriptSha,...n,guard:startEnv,pinsCount:pre.count,pinsDigest:pre.digest,parentActualLauncherAlreadyCleanNoVariableCleared:true,workerNodeOptionsPresenceStillUnresolvedNotWaived:true,exclusiveCandidateObservationNoTestCompilerProbeRunning:true,runAndDistAbsent:true,stage:'PARENT_LAUNCHER_PARTIAL_TC_BUILD_PREFLIGHT_ONLY_NO_FINAL_GO_OR_COMPILATION'};
 save(phase+'/combined-partial-parent-launcher-preflight-20261016.json',out);console.log(JSON.stringify(out));process.exit(0);
}
const approval=local('combined-partial-parent-launcher-final-go-20261016.json');assert.equal(approval.scriptSha256,scriptSha);assert.equal(approval.parentLeadSession,n.leadSession);assert.equal(approval.imageRoot,g.imageRoot);assert(approval.workerRemainsHold&&approval.parentOnlyOneTcConditionalOneBuildNoTests);assert.equal(pre.digest,approval.pinsDigest);
save(phase+'/combined-partial-parent-exclusive-reservation-20261016.json',{at:new Date().toISOString(),...n,imageRoot:g.imageRoot,zeroObservedActiveTestsCompilersProbes:true,guard:startEnv,pinsDigest:pre.digest});
mkdirSync(g.runRoot);for(const path of [g.runRoot+'/proofs',g.runRoot+'/t/opencode',g.runRoot+'/cache-node',g.runRoot+'/cache-bun'])mkdirSync(path,{recursive:true});
save(g.runRoot+'/OWNER.json',{...g.owner,executionOwner:n.leadSession,kind:'parent-only-compile-no-tests',approvalSha256:sha(readFileSync(phase+'/combined-partial-parent-launcher-final-go-20261016.json'))});
save(g.runRoot+'/sequence.lock',{at:new Date().toISOString(),pid:process.pid});
const childEnv={...process.env};for(const [key,value]of Object.entries(g.envOverrides)){const keys=Object.keys(childEnv).filter(k=>k.toUpperCase()===key);assert(keys.length<=1&&(!keys.length||keys[0]===key),'Casefold override ambiguity');childEnv[key]=value as string;}
const changed=Object.keys(childEnv).filter(k=>childEnv[k]!==process.env[k]).sort();assert(changed.every(k=>Object.hasOwn(g.envOverrides,k)));assert.equal(Object.keys(g.envOverrides).length,5);
save(g.runRoot+'/SETUP.json',{at:new Date().toISOString(),guard:startEnv,childEnvOverrides:g.envOverrides,onlyFiveOverridesNoEnvDeletion:true,...n,pinsDigest:pre.digest,commands:g.commands,launcherScriptSha256:scriptSha});
let firstSpawn=0,hold:string|null=null;const results:any[]=[];
for(const command of g.commands){
 if(hold)break;try{
  const current=pins();assert.equal(current.digest,pre.digest);guard();save(g.runRoot+'/proofs/PRE_'+command.id+'_PINS.json',current);save(g.runRoot+'/'+command.id+'.lock',{at:new Date().toISOString(),id:command.id});
  const start=Date.now();if(!firstSpawn)firstSpawn=start;const timeout=Math.min(command.maxMs,g.globalDeadlineMsFromFirstSpawn-(start-firstSpawn));assert(timeout>0);
  const proc=spawn(command.executable,command.argv,{cwd:command.cwd,env:childEnv,stdio:['ignore','pipe','pipe'],windowsHide:true});const pid=proc.pid??null;const chunks:Buffer[]=[],errors:Buffer[]=[];proc.stdout?.on('data',b=>chunks.push(Buffer.from(b)));proc.stderr?.on('data',b=>errors.push(Buffer.from(b)));
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;proc.kill();},timeout);const sampled:any[]=[];
  const ended=await new Promise<{code:number|null;signal:string|null;error:string|null}>(resolveDone=>{let error:string|null=null;proc.once('error',e=>{error=String(e);});proc.once('close',(code,signal)=>resolveDone({code,signal,error}));
   try{sampled.push(...processRows().filter((p:any)=>p.ProcessId===pid||p.ParentProcessId===pid));}catch(e){sampled.push({observationError:String(e)});}
  });clearTimeout(timer);
  const end=Date.now(),out=Buffer.concat(chunks),err=Buffer.concat(errors);writeFileSync(g.runRoot+'/'+command.id+'.stdout.log',out,{flag:'wx'});writeFileSync(g.runRoot+'/'+command.id+'.stderr.log',err,{flag:'wx'});
  const afterRows=processRows(),descendants=new Set<number>();for(const list of [sampled,afterRows]){let more=true;while(more){more=false;for(const p of list)if((p.ParentProcessId===pid||descendants.has(p.ParentProcessId))&&p.ProcessId!==pid&&!descendants.has(p.ProcessId)){descendants.add(p.ProcessId);more=true;}}}
  const residual=afterRows.filter((p:any)=>p.ProcessId===pid||descendants.has(p.ProcessId)||p.ParentProcessId===pid),post=pins(),afterEnv=guard();
  const result={id:command.id,pid,executable:command.executable,argv:command.argv,cwd:command.cwd,startAt:new Date(start).toISOString(),endObservedAt:new Date(end).toISOString(),elapsedObservedMs:end-start,...ended,timedOut,naturalZero:ended.code===0&&ended.signal===null&&!ended.error&&!timedOut,stdoutBytes:out.length,stdoutSha256:sha(out),stderrBytes:err.length,stderrSha256:sha(err),prePostPinsExact:post.digest===pre.digest,environmentStableWithinThisLauncher:afterEnv.digest===startEnv.digest,childOverrides:g.envOverrides,sampledProcessMetadata:sampled,residualOwnedProcessObservations:residual,descendantObservationLimitedNotUniversalAudit:true};
  results.push(result);save(g.runRoot+'/'+command.id+'.execution.json',result);save(g.runRoot+'/proofs/POST_'+command.id+'_PINS.json',post);
  assert(result.naturalZero,'Compiler/build not natural zero');assert(result.prePostPinsExact&&result.environmentStableWithinThisLauncher);assert.equal(residual.length,0,'Residual owned process');assert(!sampled.some(p=>p.observationError));assert(end-firstSpawn<=g.globalDeadlineMsFromFirstSpawn);
 }catch(e){hold=String(e);}
}
const final={at:new Date().toISOString(),results,hold,allCommandsNaturalZero:!hold&&results.length===2,firstSpawnAt:firstSpawn?new Date(firstSpawn).toISOString():null,elapsedFromFirstSpawnMs:firstSpawn?Date.now()-firstSpawn:null,workerRemainedHold:true,noTestsDatabasePortsProvidersProjectRuntimeOrBundleExecuted:true,noRetrySourceEditCleanupOrEnvDeletion:true,parentEnvironmentUnchanged:envDigest()===startEnv.digest,collectionNotStarted:true,stage:hold?'PARENT_PARTIAL_COMPILE_HOLD_NO_RETRY':'PARENT_TC_BUILD_NATURAL_ZERO_RELEASE_BEFORE_COLLECTION'};
save(g.runRoot+'/SEQUENCE_END.json',final);save(phase+'/combined-partial-parent-sequence-release-20261016.json',final);console.log(JSON.stringify({stage:final.stage,hold,results:results.map(r=>({id:r.id,pid:r.pid,code:r.code,signal:r.signal,elapsedMs:r.elapsedObservedMs})),collectionNotStarted:true}));
if(hold)process.exitCode=1;
