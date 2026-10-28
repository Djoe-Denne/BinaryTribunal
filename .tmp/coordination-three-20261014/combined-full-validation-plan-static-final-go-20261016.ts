import { readFileSync, writeFileSync, existsSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('combined-full-validation-plan-admission-20261016.json'),q=load('combined-full-validation-plan-preparation-request-20261016.json'),p=load('combined-full-validation-plan-parent-materialization-20261016.json');
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'max'});assert.equal(session.location.directory.replaceAll('\\','/'),a.own);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===a.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l8-integration-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'build');assert.equal(a.cycle,1);assert.equal(q.cycle,1);assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
let bytes=0;for(const f of q.files){const path=q.destinationRoot+'/'+f.path,b=readFileSync(path);assert.equal(sha(b),f.sha256);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());assert.equal(statSync(path).nlink,1);assert.equal(statSync(path).mode&0o222,0);bytes+=b.length;}assert.equal(q.files.length,435);assert.equal(bytes,8681300);
const ledger=q.destinationRoot+'/'+a.ledger.path;assert.equal(sha(readFileSync(ledger)),a.ledger.sha256);assert.equal(statSync(ledger).size,8943882);assert.equal(statSync(ledger).mode&0o222,0);assert.equal(statSync(ledger).nlink,1);assert(lstatSync(ledger).isFile()&&!lstatSync(ledger).isSymbolicLink());
assert.equal(sha(readFileSync(q.destinationRoot+'/.preparation-receipt.json')),p.helperReceiptSha256);assert.equal(sha(readFileSync(q.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json')),p.parentReceiptSha256);assert.equal(sha(readFileSync(q.destinationRoot+'/PARENT/SCOPE.md')),a.scopeSha256);assert(!existsSync(a.outputDirectory));
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,profile:'build',cycle:1,packet:q.destinationRoot,outputDirectory:a.outputDirectory,scopeSha256:a.scopeSha256,manifestSha256:a.manifestSha256,
 actualCompleteScopeContractsDecisionsManifest435HelperPlusSeparateLedger436_17625182BytesBothReceiptsRoleAccessAckApproved:true,
 nativeSameOwnedOpenL8SolMaxBuildCycle1Policies4_2GuardReadyAllInputsReadonlyRegularNonlink1ExactMain275Preserved:true,
 outputDirectoryAbsentBeforeGoAndGlobalL9StillBlocked:true,
 stage:'FINAL_STATIC_FULL_VALIDATION_PLAN_GO_ONLY_inventoriesEffectsCleanupProposedImageExactCommandsBounds_thenHold_NO_PRODUCT_EXECUTION',
 createOnlyNamedNewPlanOutputDirectoryAfterThisGo:true,
 deliverables:['PLAN.md explicit coverage and executed/excluded membership proposal','inventory45 test files and tsconfig src/test/scripts','effects path:line all hooks cleanup transitives SQL/DB/cache/ports/threads','new owned execution-image and retention/environment proposal, no source or oracle changes','exact conditional argv/cwd/time/resource bounds and output manifest'],
 ifUnmodifiedImageCannotMeetRetentionOrOwnershipEscalateNoPatchInterceptOrSilentExclusion:true,
 noExecutionImageRuntimeTempCacheDbPortThreadCreationOrImportTscTestBuildProbeCliGeneratorNow:true,
 noOldDbCacheOtherOwnSessionIndexInboxBoardGitLlmExternalAgentsNativeIdbIntegrationOrMainAuthority:true,
 anyDriftAmbiguityToolRefusalHoldNoFixRerunResetCleanupBypass:true,
 staticDeliveryThenParentImageAccessReservationAndDistinctBoundedDynamicGoRequired:true};
writeFileSync(phase+'/combined-full-validation-plan-static-actual-final-go-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,model:out.model,cycle:1,stage:out.stage,all436ReadonlyPinsExact:true,outputDirectoryAbsent:true,main275Exact:true}));
