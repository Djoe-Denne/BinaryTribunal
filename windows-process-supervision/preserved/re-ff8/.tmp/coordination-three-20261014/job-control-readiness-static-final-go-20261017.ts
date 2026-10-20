import { readFileSync, writeFileSync, statSync, lstatSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('job-control-readiness-r1-packet-admission-v2-20261017.json'),q=load('job-control-readiness-r1-request-v2-20261017.json'),v=load('job-control-readiness-r1-parent-packet-verification-v2-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);assert.equal(session.location.directory.replaceAll('\\','/'),root);
const res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.id===q.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'job-control-readiness-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'plan');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const lead=await cli.session.get({sessionID:team.leadSessionId});assert.equal(lead.id,'ses_eca40a8e2ffeanEKTBLiGjDNw8');assert.deepEqual(lead.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'xhigh'});
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
assert.equal(q.role,'reviewer');let bytes=0;for(const f of q.files){const path=q.destinationRoot+'/'+f.path,b=readFileSync(path),s=statSync(path);assert.equal(sha(b),f.sha256);assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());bytes+=b.length;}assert.equal(q.files.length,13);assert.equal(bytes,124130);assert.equal(sha(readFileSync(q.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);assert(!existsSync(a.outputDirectory));
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,profile:'plan',cycle:1,helperRole:'reviewer',actualFunction:'independent static feasibility analyst not repeated component review',packet:q.destinationRoot,outputDirectory:a.outputDirectory,scopeSha256:a.scopeSha256,
 actualWhole13Payloads124130BytesReceiptScopesBindingRoleConditionsAccessAckApproved:true,
 nativeOwnedOpenFreshNonblindSolMaxPlanLeadXhighPolicies4_2GuardReadyReadonlyNonlink1PinsMain275ProofOutputAbsentVerified:true,
 initialManifestReceiptReadOutputGuardOmissionAndPreExecutionSyntaxErrorDisclosedNotProductOrCoverageFailure:true,
 noOutsidePacketOrBinaryReadReportedNoExtraAuthorityFromIncidentNoCompletedReadsNeedRepeat:true,
 parentDispositionApproveActualAccessThenRequireAllFurtherReadsAndCalculationsViaBoundedContextModeWithHardPreEmit2800ByteGuard:true,
 stage:'FINAL_JOB_CONTROL_READINESS_STATIC_FEASIBILITY_GO_ONLY_BOUND_PROOF_OR_GAP_AND_MINIMAL_FUTURE_CONTRACT_THEN_HOLD',
 logicalAggregateCaseLimitBytesUnchanged:262144,helperEventCapBytesNotSufficientProof:67108864,
 perGapVerdicts:['PROVEN_CONDITIONAL_STATIC','NOT_PROVEN','BLOCKED_REFERENCE_AUTHORITY'],anchorsMin:3,anchorsMax:8,
 focus:'exact conditional source budgets or counterexample, observer/Job0 and original launcher handle authority contract, per-case next dependency frontier',
 noHigherBudgetPolicyWaiverSourceFixControllerCodeRequestImplementationCompilerDllReadLoadExeLaunchJobApiFixtureTestsRuntimeDbGitNativeOrIntegration:true,
 anyMissingApiReferenceEscalatesNoNavigationProbeOrInventedGuarantee:true,
 independentPlanPublicReportIfWriteRefusedNoBypassNoIndexQueryPurgeOrAdditionalContexts:true,
 case8ReferenceHoldForcedAssignNestedJobNotAcquiredAndAllRuntimeHoldsPreserved:true,
 full44GlobalL9L10MainNativeIntegrationRemainClosed:true};
writeFileSync(phase+'/job-control-readiness-static-actual-final-go-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,model:out.model,stage:out.stage,all13ReadonlyPinsExact:true,main275Exact:true,outputAbsent:true}));
