import { readFileSync, writeFileSync, statSync, lstatSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('job-newline-review-r1-packet-admission-20261017.json'),q=load('job-newline-review-r1-request-20261017.json'),v=load('job-newline-review-r1-parent-packet-verification-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);assert.equal(session.location.directory.replaceAll('\\','/'),root);const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===q.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'job-newline-review-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'plan');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
let bytes=0;for(const f of q.files){const path=q.destinationRoot+'/'+f.path,b=readFileSync(path),s=statSync(path);assert.equal(sha(b),f.sha256);assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());bytes+=b.length;}assert.equal(q.files.length,24);assert.equal(bytes,260867);assert.equal(sha(readFileSync(a.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);assert(!existsSync(a.outputDirectory));
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,profile:'plan',cycle:1,packet:q.destinationRoot,outputDirectory:a.outputDirectory,scopeSha256:a.scopeSha256,
 actualWhole24Payloads260867BytesReceiptBindingRoleConditionsAccessAckApproved:true,
 nativeOpenOwnedFreshNonblindSolMaxPlanPolicies4_2GuardReadyReadonlyNonlink1PinsMain275AndOutputAbsentVerified:true,
 stage:'FINAL_BOUNDED_NEWLINE_DELTA_STATIC_REVIEW_GO_ONLY_VERDICT_ANCHORS_THEN_HOLD',
 sourceOld70957212NewCb3a6dfdWrapper100eExactSingleExpressionDelta:true,
 priorCoverageEndorsedOnlyUnchangedStaticSurfacesNotHostProofOldUncertainNotOverwritten:true,
 requiredFocus:'exact delta bytes, UTF8 no BOM/NewLine/WriteLine guard, complete and partial writes/error telemetry/HOLD, only necessary callees',
 verdicts:['ACCEPTABLE_DELTA_SOURCE_SCOPED','BLOCK','UNCERTAIN'],anchorsMin:3,anchorsMax:6,
 anyInteractionNeedingWiderScopeEscalateNoSilentExpansionOrCertainProblemIgnored:true,
 publicPlanReportNoWriteBypassNoSourceFixCompilerDotnetJobApiFixtureTestsRuntimeDbGitNativeOrIntegrationAuthority:true,
 noRepeatedCompletedWholeAbiReviewUnlessExplicitEscalation:true,
 anyAcceptableStillRequiresSeparateIndependentHarmlessCompilationHostQualificationAndConcreteFullGates:true};
writeFileSync(phase+'/job-newline-delta-static-actual-final-go-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,model:out.model,stage:out.stage,all24ReadonlyPinsExact:true,main275Exact:true,outputAbsent:true}));
