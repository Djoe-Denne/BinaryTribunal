import { readFileSync, writeFileSync, existsSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('l7-l8-combined-crossqa-admission-20261016.json'),q=load('l7-l8-combined-crossqa-preparation-request-20261016.json');
const da=load('l7-l8-crossqa-dynamic-gate-admission-20261016.json'),dp=load('l7-l8-crossqa-dynamic-gate-parent-verification-20261016.json');
const sup=load('l7-l8-static-go-supplement-admission-20261016.json'),sp=load('l7-l8-static-go-supplement-parent-verification-20261016.json');
const gate=JSON.parse(readFileSync(da.destinationRoot+'/DYNAMIC_GATE.json','utf8'));
const exact=(path:string,hash:string,readonly=false)=>{const b=readFileSync(path);assert.equal(sha(b),hash,path);if(readonly)assert.equal(statSync(path).mode&0o222,0);return b;};
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);assert.equal(session.location.directory.replaceAll('\\','/'),a.own);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===a.missionId),task=team.tasks.find((t:any)=>t.id===a.task);
assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l7-interop-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'build');
const lead=await cli.session.get({sessionID:team.leadSessionId});assert.deepEqual(lead.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'xhigh'});assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
for(const f of q.files)exact(a.destinationRoot+'/'+f.path,f.sha256,true);
const ledger=a.destinationRoot+'/'+a.ledger.path;assert.equal(exact(ledger,a.ledger.sha256,true).length,8943882);assert(lstatSync(ledger).isFile()&&!lstatSync(ledger).isSymbolicLink());assert.equal(statSync(ledger).nlink,1);
exact(a.destinationRoot+'/.preparation-receipt.json',gate.commonHelperReceiptSha256,true);exact(a.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',gate.commonParentLedgerReceiptSha256,true);
for(const f of sup.files)assert.equal(exact(sup.destinationRoot+'/'+f.path,f.sha256,true).length,f.bytes);exact(sup.destinationRoot+'/.preparation-receipt.json',sp.receiptSha256,true);
for(const f of gate.existingStaticPins)assert.equal(exact(a.proofDirectory+'/'+f.path,f.sha256,true).length,f.bytes);
for(const f of da.files)assert.equal(exact(da.destinationRoot+'/'+f.path,f.sha256,true).length,f.bytes);exact(da.destinationRoot+'/.preparation-receipt.json',dp.receiptSha256,true);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])exact(root+'/'+f.path,f.sha256);
for(const k of Object.keys(process.env))assert.notEqual(k.toUpperCase(),'FF8_ENSEMBLE_SOURCE');
for(const name of ['APPDATA','LOCALAPPDATA']){const keys=Object.keys(process.env).filter(k=>k.toUpperCase()===name);assert.equal(keys.length,1);assert.equal(process.env[keys[0]!],gate.originalAuthority[name]);}
assert(!existsSync(gate.runRoot));
const psCommand=String.raw`Get-CimInstance Win32_Process | Where-Object { $_.Name -in @("bun.exe","bunx.exe","bun","bunx","node.exe","node") -and ($_.CommandLine -match '(?:^|\s|\x22)test(?:\s|\x22|$)|\.test\.ts|(?:^|\s|\x22|[/\\])tsc(?:\.js|\.cjs)?(?:\s|\x22|$)|run typecheck|probe(?:\.ts|\.js)|independent-projection\.mjs') } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress`;
const ps=spawnSync('powershell.exe',['-NoProfile','-Command',psCommand],{encoding:'utf8',timeout:20000});
writeFileSync(phase+'/l7-l8-crossqa-dynamic-process-preflight-corrected-20261016.json',JSON.stringify({at:new Date().toISOString(),status:ps.status,stdout:ps.stdout,stderr:ps.stderr,selector:psCommand,metadataObservationOnlyNoProductExecutionOrKill:true},null,2)+'\n',{flag:'wx'});
assert.equal(ps.status,0);const raw=ps.stdout.trim()?JSON.parse(ps.stdout):[],running=Array.isArray(raw)?raw:[raw];assert.equal(running.length,0,JSON.stringify(running));
const reservedAt=new Date().toISOString(),reservation={at:reservedAt,task:task.id,session:session.id,model:session.model,runId:gate.runId,runRoot:gate.runRoot,exclusive:true,zeroConcurrentBunNodeTestProbeTscObservedNoKill:true,runtimeAbsent:true,stage:'EXCLUSIVE_RESERVED_FOR_EXACT_D1_CONDITIONAL_D2_NO_OTHER_DYNAMIC_WORK'};
writeFileSync(phase+'/l7-l8-crossqa-dynamic-exclusive-reservation-20261016.json',JSON.stringify(reservation,null,2)+'\n',{flag:'wx'});
const out={at:new Date().toISOString(),reservedAt,task:task.id,session:session.id,model:session.model,leadModel:lead.model,runId:gate.runId,runRoot:gate.runRoot,
 materializedContract:da.destinationRoot,contractFiles:da.files,contractReceiptSha256:dp.receiptSha256,
 actualWholeDynamicMdJsonReceiptRoleConditionsAccessAckApproved:true,nativeOwnedOpenSolMaxBuildPolicies4_2GuardReadyAll424ReceiptsSupplementsStaticNineAndMain275Exact:true,
 stage:'FINAL_DYNAMIC_GO_EXACT_D1_ONCE_THEN_ONLY_IF_QUALIFIED_D2_V2_ONCE_GLOBAL180S_NO_TSC_FULL_RERUN',
 commands:gate.commands,envOverrides:gate.envOverrides,originalAuthority:gate.originalAuthority,ownerJsonRequired:gate.ownerJsonRequired,
 globalMaxMsFromFirstSpawn:gate.globalMaxMsFromFirstSpawn,maxNewDb:2,maxRuntimeStepsTotal:28,maxUnitsPerCase:3,maxFakeExecutionsPerRuntimeCase:9,maxPortsSubprocessesWorkersInsideTests:0,
 createOnlyExactNewRuntimeOwnerTmpOpencodeCacheAndWxLocksAfterThisGoRegistryOnlyCreatedByV2:true,
 d2OnlyAfterD1NaturalExit0ExactFourPassNamesNoExtraProductWorkAndAllPostPinsGuardWithinGlobalDeadline:true,
 anyRedSetupDriftRefusalUnexpectedEffectStopHoldNoSourceOracleFlagsFixRetryCleanupBypass:true,
 naturalEndCodesCountsExclusiveReleaseBeforeCollectionThenOnlyOwnExplicitDbSuffixesRegistryCacheRawProofsPreserved:true,
 noParentProcessEnvMutationCrossSandboxDigestEqualityOldDbSqlDirectCacheDecodeProductSourceMainNativeOrIntegrationAuthority:true};
writeFileSync(phase+'/l7-l8-crossqa-dynamic-actual-final-go-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({at:out.at,reservedAt,task:task.id,session:session.id,model:session.model,stage:out.stage,runId:gate.runId,runtimeAbsent:true,allPinsExact:true,maxNewDb:2,globalMs:180000}));
