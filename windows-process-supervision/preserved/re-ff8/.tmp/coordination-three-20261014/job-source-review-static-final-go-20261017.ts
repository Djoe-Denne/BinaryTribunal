import { readFileSync, writeFileSync, existsSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('job-source-review-r1-packet-admission-20261017.json'),q=load('job-source-review-r1-request-20261017.json'),v=load('job-source-review-r1-parent-packet-verification-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);assert.equal(session.location.directory.replaceAll('\\','/'),root);
const res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.id===q.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'job-source-review-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'plan');assert.equal(team.tasks.find((t:any)=>t.id===a.authorTask).status,'completed');assert.notEqual(a.session,a.authorSession);assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
let bytes=0;for(const f of q.files){const p=a.destinationRoot+'/'+f.path,b=readFileSync(p),s=statSync(p);assert.equal(sha(b),f.sha256);assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);assert(lstatSync(p).isFile()&&!lstatSync(p).isSymbolicLink());bytes+=b.length;}assert.equal(q.files.length,10);assert.equal(bytes,95874);assert.equal(sha(readFileSync(a.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);assert(!existsSync(a.outputDirectory));
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,profile:'plan',cycle:1,packet:a.destinationRoot,outputDirectory:a.outputDirectory,scopeSha256:a.scopeSha256,
 actualWhole10Payloads95874BytesReceiptContractsSourcesBindingRoleConditionsAckApproved:true,
 nativeOwnedOpenSolMaxPlanDisjointCompletedAuthorPolicies4_2GuardReadyReadonlyNonlink1PinsMain275OutputAbsentVerified:true,
 stage:'FINAL_INDEPENDENT_JOB_SOURCE_STATIC_REVIEW_GO_ONLY_VERDICT_ANCHORS_CONTRARIES_THEN_HOLD',
 independentVerdictOptions:['ACCEPTABLE_SOURCE_SCOPED','BLOCK','UNCERTAIN'],sourceAnchorsMin:3,sourceAnchorsMax:8,
 sourceGoldCs70957212Wrapper100e329aDesignAndManifestNotWin32Proof:true,
 requiredFocus:['strict data Unicode quoting env','ABI and proposed compiler compatibility','owned handles whitelist suspended assign resume','rootexit AND coherent job0','timeout refusal cleanup partial result no false success'],
 publicReportIfPlanWriteRefusesNoBypassNoSourceFix:true,
 noCompilerAddTypePowerShellChildDeliveredSourceImportJobApiFixtureTestsDbCacheRuntimePortGitNativeFf8OrIntegrationAuthority:true,
 authorReadOnlyFrozenNoRestartAndPublicBootstrapNonblindDisclosurePreserved:true,
 anyApiReferenceNeededEscalateNotOsProbeAnyAcceptableStillNeedsSeparateIndependentHarmlessCompileAndHostQualification:true,
 full44ConcreteBindingsToolsEnvAccessReservationFinalGoAndGlobalL9L10MainStillClosed:true};
writeFileSync(phase+'/job-source-review-static-actual-final-go-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,model:out.model,stage:out.stage,all10ReadonlyPinsExact:true,main275Exact:true,outputAbsent:true}));
