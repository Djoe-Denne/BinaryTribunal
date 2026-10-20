import { readFileSync, writeFileSync, existsSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('job-fixture-source-r1-packet-admission-20261017.json'),q=load('job-fixture-source-r1-request-20261017.json'),v=load('job-fixture-source-r1-parent-packet-verification-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);assert.equal(session.location.directory.replaceAll('\\','/'),root);
const res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.id===q.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'job-fixture-source-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'build');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const lead=await cli.session.get({sessionID:team.leadSessionId});assert.equal(lead.id,'ses_eca40a8e2ffeanEKTBLiGjDNw8');assert.deepEqual(lead.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'xhigh'});assert.notEqual(session.id,lead.id);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
let bytes=0;for(const f of q.files){const path=q.destinationRoot+'/'+f.path,b=readFileSync(path),s=statSync(path);assert.equal(sha(b),f.sha256);assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());bytes+=b.length;}assert.equal(q.files.length,10);assert.equal(bytes,73279);assert.equal(sha(readFileSync(a.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);assert(!existsSync(a.outputDirectory));
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,profile:'build',cycle:1,packet:q.destinationRoot,outputDirectory:a.outputDirectory,scopeSha256:a.scopeSha256,
 actualWhole10Payloads73279BytesReceiptBindingRoleConditionsAccessAckApproved:true,
 nativeOpenOwnedFreshIndependentSolMaxBuildLeadXhighPolicies4_2GuardReadyReadonlyNonlink1PinsMain275OutputAbsentVerified:true,
 stage:'FINAL_INDEPENDENT_HARMLESS_FIXTURE_SOURCE_GO_FOUR_NEW_FILES_ONLY_NO_COMPILE_DLL_LOAD_API_JOB_OR_EXECUTION',
 onlyAuthorizedOutputFiles:['Fixture.cs','Invoke-One.ps1','QUALIFICATION_PLAN.md','MANIFEST.json'],
 applyMaterialScope681d62feCompleteNotOnlyThisGoSummary:true,
 independentOracleNotHelperAlgorithmCopyEightCasesProspectiveNoResultPrescribed:true,
 futureFiniteFixtureLimits:{simultaneousProcesses:3,selfExpiryMsMax:15000,writesBytesPerCaseMax:262144,globalQualificationMsMax:180000},
 breakawayCaseRiskExplicitAndAnyMissingApiReferenceOrAuthorityEscalatesNoOsProbeOrAssumedRefusal:true,
 noSourceHelperProjectTestConfigChangesNoDllBinaryAccessCompilerAddTypeImportPowerShellChildJobApiFixtureRuntimeTempDbCachePortGitNativeFf8OrIntegration:true,
 stdoutHardGuardBeforeEmitBelow2800BytesNoIndexQueryOrPurge:true,
 deliveryPinsRisksLimitsThenHoldIndependentSourceReviewAndSeparateCompileHarmlessHostQualificationGoStillRequired:true,
 full44GlobalL9L10MainNativeIntegrationRemainClosed:true};
writeFileSync(phase+'/job-fixture-source-actual-final-go-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,model:out.model,stage:out.stage,all10ReadonlyPinsExact:true,main275Exact:true,outputAbsent:true}));
