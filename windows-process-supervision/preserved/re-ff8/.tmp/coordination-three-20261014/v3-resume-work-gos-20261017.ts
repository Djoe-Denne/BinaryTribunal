import { readFileSync, writeFileSync, statSync, lstatSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.name==='re-graph-scheduler');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert.equal(team.capacity.limit,5);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);const lead=await cli.session.get({sessionID:team.leadSessionId});assert.equal(lead.id,'ses_eca40a8e2ffeanEKTBLiGjDNw8');assert.deepEqual(lead.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'xhigh'});const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out:any[]=[];
for(const member of ['v3-budget-source-r1','v3-contract-review-r1','mission-frontier-r1']){
 const a=load(member+'-packet-admission-20261017.json'),q=load(member+'-request-20261017.json'),v=load(member+'-parent-packet-verification-20261017.json'),task=team.tasks.find((t:any)=>t.id===a.task),session=await cli.session.get({sessionID:a.session});assert.equal(task.status,'in_progress');assert.equal(task.assignee,member);assert.deepEqual(session.model,a.model);assert.equal(team.members.find((m:any)=>m.name===member).agent,a.profile);let bytes=0;
 for(const f of q.files){const p=q.destinationRoot+'/'+f.path,b=readFileSync(p),s=statSync(p);assert.equal(sha(b),f.sha256);assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);assert(lstatSync(p).isFile()&&!lstatSync(p).isSymbolicLink());bytes+=b.length;}
 assert.equal(bytes,a.bytes);assert.equal(sha(readFileSync(q.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);assert(!existsSync(a.outputDirectory));
 const source=a.mode==='budget',stage=source?'FINAL_PURE_BUDGET_SOURCE_GO_FOUR_NEW_FILES_ONLY_NO_COMPILATION_OR_TEST_EXECUTION':a.mode==='contract'?'FINAL_INDEPENDENT_V3_CONTRACT_REVIEW_GO_PUBLIC_REPORT_ONLY_NO_PRIVILEGED_SOURCE':'FINAL_MISSION_FRONTIER_INVENTORY_GO_PUBLIC_REPORT_ONLY_NO_TASK_OR_SOURCE_MUTATION';
 const j={at:new Date().toISOString(),member,task:task.id,session:session.id,model:session.model,profile:a.profile,role:q.role,cycle:1,mode:a.mode,packet:q.destinationRoot,outputDirectory:a.outputDirectory,scopeSha256:a.scopeSha256,contractSha256:a.contractSha256,
 actualWholePacketBytesReceiptRoleConditionsAccessAckApproved:true,inputFiles:q.files.length,inputBytes:bytes,nativeOpenOwnedModelAndProfilePolicies4_2Capacity5ManualGuardReadonlyNonlink1PinsMain275OutputAbsentVerified:true,
 publicBootstrapNonblindExposureAndReaderEscapeCorrectionDisclosedNoUnapprovedSourceReadOrExtraAuthority:true,
 stage,sourceOutputFiles:source?['BudgetedEvidence.cs','BudgetedEvidence.Tests.cs','DESIGN.md','MANIFEST.json']:[],
 planPublicReportOnlyNoWriteBypass:!source,pureBudgetSubcontractSourceOnlyLocallyRatifiedIndependentOfPrivilegedGuardianReview:source,
 privilegedJobSourceStillRequiresSubstantiveIndependentReviewParentRatificationAndFrozenAbi:true,
 oldLastCloseNotEstablishedAndOldBudgetNotProvenNotRelabeledAsPass:true,
 noCompileTestsExecutionJobIocpHandleApiRuntimeFixtureDbCachePortSourceCentralConfigGitNativeFf8OrIntegration:true,
 noCompletedStudyRerunOrHistoricalContextReopen:true,
 allReadsCalculationsContextModeHardPreEmit2800ByteGuardNoIndexQueryInboxBoardOtherOwnNavigationOrDelegation:true,
 deliveryThenHoldForParentQualificationAndImmediateUsefulSlotRecycle:true,
 missionContinuationNotFinishedAtLocalStudyOrOrdinaryArchitectureDecision:true};
 writeFileSync(phase+'/'+member+'-actual-work-go-20261017.json',JSON.stringify(j,null,2)+'\n',{flag:'wx'});out.push({member,at:j.at,stage,task:task.id,session:session.id,files:q.files.length,bytes});
}
console.log(JSON.stringify(out));
