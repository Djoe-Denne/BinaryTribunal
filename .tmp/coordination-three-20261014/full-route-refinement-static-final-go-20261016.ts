import { readFileSync, writeFileSync, existsSync, lstatSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('full-route-refinement-admission-20261016.json'),p=load('full-route-refinement-parent-verification-20261016.json'),src=load('combined-full-validation-plan-admission-20261016.json'),q=load('combined-full-validation-plan-preparation-request-20261016.json'),sp=load('combined-full-validation-plan-parent-materialization-20261016.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);assert.equal(session.location.directory.replaceAll('\\','/'),src.own);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===src.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l8-integration-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'build');assert.equal(a.cycle,1);assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
const check=(path:string,hash:string,bytes?:number)=>{const b=readFileSync(path),s=statSync(path);assert.equal(sha(b),hash,path);if(bytes!==undefined)assert.equal(b.length,bytes,path);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());assert.equal(s.nlink,1);assert.equal(s.mode&0o222,0);return b;};
let supplementBytes=0;for(const f of a.files)supplementBytes+=check(a.destinationRoot+'/'+f.path,f.sha256,f.bytes).length;assert.equal(supplementBytes,16612);check(a.destinationRoot+'/.preparation-receipt.json',p.helperReceiptSha256,p.helperReceiptBytes);
let sourceBytes=0;for(const f of q.files)sourceBytes+=check(q.destinationRoot+'/'+f.path,f.sha256).length;assert.equal(sourceBytes,8681300);check(q.destinationRoot+'/'+src.ledger.path,src.ledger.sha256,8943882);check(q.destinationRoot+'/.preparation-receipt.json',sp.helperReceiptSha256,sp.helperReceiptBytes);check(q.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',sp.parentReceiptSha256,sp.parentReceiptBytes);
const plan=JSON.parse(check(src.outputDirectory+'/MANIFEST.json','03ef85bd174e1a056c7bc7f01bedf370b79c2b3adbb5f23ca15bde185a4a5b72',6411).toString('utf8'));for(const f of plan.artifacts)check(src.outputDirectory+'/'+f.path,f.sha256,f.bytes);
assert(!existsSync(a.outputDirectory));const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,cycle:1,scopeSha256:a.files[0].sha256,inputRoot:q.destinationRoot,supplementRoot:a.destinationRoot,outputDirectory:a.outputDirectory,
 actualWholeThreeSupplementFilesReceiptOld436BothReceiptsFourPlanDocsAndConditionsAckApproved:true,
 nativeOwnedOpenSolMaxBuildPolicies4_2GuardAllPhysicalReadonlyNonlink1PinsExactMain275Preserved:true,
 outputDirectoryAbsentBeforeGoGlobalL9StillBlocked:true,
 stage:'FINAL_STATIC_FULL_ROUTE_REFINEMENT_GO_ONLY_B01_CLEANUP_CANDIDATE_B02_ROOTS_B03_PARENT_JOB_PROPOSAL_THEN_HOLD',
 createOnlyNamedNewRefinementDirAndFourDeclaredDocumentsAfterThisGo:true,
 deliverables:['REFINEMENT.md','ROOTS_AND_CLEANUP.json','CHILD_TREE_PLAN.md','MANIFEST.json'],
 noCleanupWaiverJobHelperCreationCompileTestRuntimeImageCacheDbPortOrDynamicExecutionAuthorized:true,
 workerNodeOptionsDynamicHoldPreservedNoEnvClearingPreloadAccessOrNewWorkerLauncher:true,
 noSourceTestHelperPatchInterceptionCopyOnDeleteSilentExclusionOldDbCacheOtherOwnIndexInboxBoardGitNativeOrIntegrationAuthority:true,
 uncertainRouteMustRemainExplicitBlockedNoGuaranteeInvented:true,
 staticDeliveryThenParentProspectiveDecisionSeparateMeansQualificationAccessReservationAndDynamicGoRequired:true};
writeFileSync(phase+'/full-route-refinement-static-actual-final-go-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,model:out.model,stage:out.stage,scopeSha256:out.scopeSha256,allInputPinsExact:true,main275Exact:true,newOutputAbsent:true}));
