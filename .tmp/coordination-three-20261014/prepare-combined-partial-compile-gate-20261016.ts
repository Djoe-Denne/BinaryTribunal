import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync, statSync, lstatSync, realpathSync, symlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('combined-full-validation-plan-admission-20261016.json'),q=load('combined-full-validation-plan-preparation-request-20261016.json'),qualified=load('combined-full-validation-plan-final-parent-qualification-20261016.json'),tools=load('combined-compile-toolchain-qualified-20261016.json');
assert(qualified.stage.startsWith('STATIC_PLAN_DELIVERY_CONFORMING'));
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);assert.equal(session.location.directory.replaceAll('\\','/'),a.own);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===a.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l8-integration-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'build');assert.equal(a.cycle,1);assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
for(const name of ['FF8_ENSEMBLE_SOURCE','NODE_OPTIONS','BUN_OPTIONS'])assert.equal(Object.keys(process.env).filter(k=>k.toUpperCase()===name).length,0,name);
const originalAuthority:Record<string,string>={};for(const name of ['APPDATA','LOCALAPPDATA']){const keys=Object.keys(process.env).filter(k=>k.toUpperCase()===name);assert.equal(keys.length,1);originalAuthority[name]=process.env[keys[0]!]!;}
for(const f of [...tools.executables,...tools.requiredEntryPins,...tools.optionalTypeSdkPins,...tools.packages.map((p:any)=>p.metadata)])assert.equal(sha(readFileSync(f.path)),f.sha256);
for(const f of tools.globalBunfigAbsentAtKnownHomePaths)assert(!existsSync(f.path));
const base='C:/Users/djden/AppData/Local/Temp/opencode';assert(lstatSync(base).isDirectory()&&!lstatSync(base).isSymbolicLink());
const nonce=randomUUID().replaceAll('-','').slice(0,10),imageRoot=base+'/CVB-'+nonce,imageRepo=imageRoot+'/repo',control=imageRoot+'/control',runRoot=imageRoot+'/run';assert(!existsSync(imageRoot));
const sourceRoot=phase+'/COMBINED_PARTIAL_TC_BUILD_GATE_INPUTS_20261016',destinationRoot=a.own+'/inputs/COMBINED_PARTIAL_TC_BUILD_GATE_20261016';assert(!existsSync(sourceRoot)&&!existsSync(destinationRoot));
mkdirSync(imageRepo,{recursive:true});mkdirSync(control);const owner={taskId:a.task,sessionId:a.session,cycle:1,nonce,purpose:'partial-static-typecheck-and-cli-build-NO-TESTS',sourceManifestSha256:a.manifestSha256,native:false};
const ownerBytes=Buffer.from(JSON.stringify(owner,null,2)+'\n');writeFileSync(imageRoot+'/OWNER.json',ownerBytes,{flag:'wx'});chmodSync(imageRoot+'/OWNER.json',0o444);
const imageFiles:any[]=[];let payloadBytes=0;
for(const f of q.files){const from=q.destinationRoot+'/'+f.path,b=readFileSync(from);assert.equal(sha(b),f.sha256);assert.equal(statSync(from).mode&0o222,0);assert.notEqual(b.subarray(0,15).toString(),'SQLite format 3');const to=imageRepo+'/'+f.path;mkdirSync(dirname(to),{recursive:true});writeFileSync(to,b,{flag:'wx'});chmodSync(to,0o444);assert.equal(sha(readFileSync(to)),f.sha256);imageFiles.push({path:f.path,bytes:b.length,sha256:f.sha256,sourceCoverage:'original-helper435'});payloadBytes+=b.length;}
const raw=readFileSync(q.destinationRoot+'/'+a.ledger.path);assert.equal(raw.length,8943882);assert.equal(sha(raw),a.ledger.sha256);const ledger=imageRepo+'/'+a.ledger.path;mkdirSync(dirname(ledger),{recursive:true});writeFileSync(ledger,raw,{flag:'wx'});chmodSync(ledger,0o444);imageFiles.push({...a.ledger,sourceCoverage:'original-separate-parent-ledger-not-helper'});payloadBytes+=raw.length;assert.equal(imageFiles.length,436);assert.equal(payloadBytes,17625182);
const harness=imageRepo+'/tools/ff8-harness',dependencyJunction=harness+'/node_modules';assert(!existsSync(dependencyJunction));symlinkSync(tools.dependenciesRealpath,dependencyJunction,'junction');assert.equal(realpathSync(dependencyJunction).toLowerCase(),tools.dependenciesRealpath.toLowerCase());
const imageReceipt={schemaVersion:'parent-byte-exact-local-execution-image-v1',at:new Date().toISOString(),taskId:a.task,sessionId:a.session,cycle:1,model:session.model,imageRoot,imageRepo,ownerSha256:sha(ownerBytes),sourceInputRoot:a.destinationRoot,sourceManifestSha256:a.manifestSha256,
 sourceHelperCoversOnlyIts435OriginalFilesLedgerSeparatelyCovered:true,newControlHelperDoesNotCoverExecutionImage:true,
 imageFiles:436,imageBytes:payloadBytes,files:imageFiles,dependencyJunction:{path:dependencyJunction,target:tools.dependenciesRealpath,outsidePayload:true,existingDependencyReadOnlyPermissionNoInstall:true},
 allImagePayloadsByteExactReadonlyNoOldDbCacheRuntimeCopied:true,sourceMetadataScopesInImageAreHistoricalCurrentCompileGateOnlyAuthority:true,
 state:'prepared-not-approved-for-execution',requiresRealAccessAckReservationAndDistinctFinalGo:true,fullTestsStillBlockedNoRetentionWaiver:true};
const imageReceiptBytes=Buffer.from(JSON.stringify(imageReceipt,null,2)+'\n');writeFileSync(control+'/IMAGE_PARENT_RECEIPT.json',imageReceiptBytes,{flag:'wx'});chmodSync(control+'/IMAGE_PARENT_RECEIPT.json',0o444);
const node=tools.executables.find((x:any)=>x.name==='node.exe'),bun=tools.executables.find((x:any)=>x.name==='bun.exe');
const tcEntry=tools.requiredEntryPins.find((p:any)=>p.path.replaceAll('\\','/').endsWith('/typescript/bin/tsc'));assert(tcEntry);
const envOverrides={TEMP:runRoot+'/t',TMP:runRoot+'/t',TMPDIR:runRoot+'/t',NODE_COMPILE_CACHE:runRoot+'/cache-node',BUN_RUNTIME_TRANSPILER_CACHE_PATH:runRoot+'/cache-bun'};
const planManifest=JSON.parse(readFileSync(a.outputDirectory+'/MANIFEST.json','utf8')),planPins=[...planManifest.artifacts,{path:'MANIFEST.json',bytes:6411,sha256:'03ef85bd174e1a056c7bc7f01bedf370b79c2b3adbb5f23ca15bde185a4a5b72'}];
for(const f of planPins){const b=readFileSync(a.outputDirectory+'/'+f.path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);}
const gate={at:new Date().toISOString(),missionId:a.missionId,task:a.task,session:a.session,model:session.model,cycle:1,
 stage:'ACCESS_ONLY_PARTIAL_TC_BUILD_CONTRACT_IMAGE_TOOLCHAIN_NO_EXECUTION_BEFORE_ACK_RESERVATION_AND_FINAL_GO',
 sourceInputRoot:a.destinationRoot,sourceInputManifestSha256:a.manifestSha256,imageRoot,imageRepo,harness,control,runRoot,owner,ownerFile:{path:imageRoot+'/OWNER.json',bytes:ownerBytes.length,sha256:sha(ownerBytes)},
 imageReceipt:{path:control+'/IMAGE_PARENT_RECEIPT.json',bytes:imageReceiptBytes.length,sha256:sha(imageReceiptBytes)},imagePayloadFiles:436,imagePayloadBytes:payloadBytes,
 dependencyJunction:{path:dependencyJunction,target:tools.dependenciesRealpath,readOnlyVendorAccessOnly:true},toolchain:tools,originalAuthority,envOverrides,
 commands:[{id:'TC',executable:node.path,argv:[tcEntry.path,'--noEmit','--project',harness+'/tsconfig.json'],cwd:harness,maxMs:180000,onlyCompilerNoProjectRuntime:true},{id:'BUILD',executable:bun.path,argv:['build','--no-install','--no-macros','--no-env-file',harness+'/src/cli.ts','--target','bun','--outdir',harness+'/dist','--external','@opencode/client','--external','@opencode/client/service'],cwd:harness,maxMs:120000,onlyAfterTcNaturalZeroAndPostPins:true}],
 globalDeadlineMsFromFirstSpawn:300000,maxApplicationDbPortsTestsPythonBunEWorkersOrProviders:0,maxObservedDistBytes:64*1024*1024,maxObservedDistFiles:16,maxObservedCacheBytesEach:64*1024*1024,maxOwnedCompilerRootProcessesSequential:2,
 sourceTsFiles:92,sourceTestFilesTypeAnalyzed:45,sourceRuntimeTestFilesAuthorized:0,
 currentPlanRoot:a.outputDirectory,currentPlanPins:planPins,sourceHelperReceiptSha256:'afa0e1ca3ae79300d35b87b13987ec09f604a02f9e5fe96d51cae0f917dc0146',sourceParentLedgerReceiptSha256:'aa27165b1d1bfbd3325436aba6ab7852fd27ec15c6e81d86b31a96b1092a45a2',
 noTypecheckBuildTestsRuntimeYet:true,noSourceTestConfigOracleEdits:true,fullB01B02AndTestChildTreeB03StillHeldNoEphemeralCleanupWaiver:true,
 timeoutOnlyOwnedChildHandleNoForeignProcessKillQuiescenceUncertainHold:true,
 noSourceFixRetryCleanupInstallGlobalConfigNativeMainTransferOrIntegrationAuthority:true};
mkdirSync(sourceRoot);const scope=readFileSync(root+'/docs/missions/re-graph-scheduler/COMBINED_PARTIAL_TC_BUILD_GATE_20261016.md');writeFileSync(sourceRoot+'/TC_BUILD_SCOPE.md',scope,{flag:'wx'});writeFileSync(sourceRoot+'/TC_BUILD_GATE.json',JSON.stringify(gate,null,2)+'\n',{flag:'wx'});
const files=['TC_BUILD_SCOPE.md','TC_BUILD_GATE.json'].map(path=>{const b=readFileSync(sourceRoot+'/'+path);return {path,bytes:b.length,sha256:sha(b),kind:'rule'};});
const request={...q,sourceRoot,destinationRoot,files:files.map(({bytes,...f})=>f)};
const out={at:gate.at,task:a.task,session:a.session,model:session.model,cycle:1,sourceRoot,destinationRoot,imageRoot,imageRepo,runRoot,files,imagePayloadFiles:436,imagePayloadBytes:payloadBytes,imageReceipt:gate.imageReceipt,ownerFile:gate.ownerFile,runAbsent:!existsSync(runRoot),distAbsent:!existsSync(harness+'/dist'),source436UnchangedParentImageOnlyNotCoveredByNewHelper:true,stage:gate.stage};
writeFileSync(phase+'/combined-partial-compile-gate-request-20261016.json',JSON.stringify(request,null,2)+'\n',{flag:'wx'});writeFileSync(phase+'/combined-partial-compile-gate-admission-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,model:out.model,imageRoot,files,imageFiles:436,imageBytes:payloadBytes,imageReceiptSha256:gate.imageReceipt.sha256,runAbsent:out.runAbsent,distAbsent:out.distAbsent,stage:out.stage}));
