import { readFileSync, writeFileSync, existsSync, lstatSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.name==='re-graph-scheduler');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
const checks:any[]=[];
for(const member of ['job-source-r1','full44-policy-r1']){
 const a=load(member+'-packet-admission-20261017.json'),q=load(member+'-request-20261017.json'),v=load(member+'-parent-packet-verification-20261017.json'),session=await cli.session.get({sessionID:a.session}),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,member);assert.deepEqual(session.model,a.model);assert.equal(team.members.find((m:any)=>m.name===member).agent,a.profile);
 for(const f of q.files){const p=a.destinationRoot+'/'+f.path,b=readFileSync(p),s=statSync(p);assert.equal(sha(b),f.sha256);assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);assert(lstatSync(p).isFile()&&!lstatSync(p).isSymbolicLink());}
 assert.equal(sha(readFileSync(a.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);assert(!existsSync(a.outputDirectory));checks.push({member,task:task.id,session:session.id,model:session.model,profile:a.profile,packet:a.destinationRoot,outputDirectory:a.outputDirectory,files:q.files.length,scopeSha256:a.scopeSha256,receiptSha256:v.receiptSha256,readonlyRegularNonlink1Exact:true,outputAbsent:true});
}
const job=checks[0],out={at:new Date().toISOString(),...job,actualWholeFourPayloadsReceiptBindingRoleConditionsAccessAckApproved:true,
 nativeOpenOwnedSolMaxBuildPolicies4_2GuardReadyAndNewOutputAbsentVerified:true,
 stage:'FINAL_JOB_HELPER_SOURCE_GO_FOUR_NEW_SOURCE_DOC_FILES_ONLY_NO_COMPILATION_IMPORT_JOB_API_OR_EXECUTION',
 authorizedNewFiles:['JobRunner.cs','Invoke-JobRunner.ps1','DESIGN_AND_FIXTURES.md','MANIFEST.json'],
 sourceRequirements:'apply immutable PARENT/SCOPE056f81f5 complete; fail-closed handles/lifecycle/quoting/env/limits; escalate ambiguity rather than run probes',
 noAddTypeCscPowerShellChildNativeJobFixtureCompilerTestDbRuntimeCachePortSourceTestConfigGitOrInstall:true,
 noMainOrCentralL8EditB01B02CleanupWaiverFull44OrNativeFf8IntegrationAuthority:true,
 futureIndependentSourceReviewAndSeparatelyAuthorizedHarmlessQualificationStillRequired:true,
 sourceDeliveryWithPinsThenHoldNoSelfValidationByExecutingSources:true,
 reviewerCheck:checks[1],reviewerOnlyFirstHoldAckSoStillAccessOnlyNoStaticReviewGo:true};
writeFileSync(phase+'/job-source-actual-final-go-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,job:{task:job.task,session:job.session,scopeSha256:job.scopeSha256,files:job.files},stage:out.stage,reviewerStillAccessOnly:true}));
