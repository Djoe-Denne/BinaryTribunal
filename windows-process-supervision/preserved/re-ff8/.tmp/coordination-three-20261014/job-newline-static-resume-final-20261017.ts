import { readFileSync, writeFileSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('job-source-review-r1-packet-admission-20261017.json'),old=load('job-source-review-r1-request-20261017.json'),ref=load('job-newline-reference-request-20261017.json'),ra=load('job-newline-reference-admission-20261017.json'),rv=load('job-newline-reference-parent-verification-20261017.json'),ov=load('job-source-review-r1-parent-packet-verification-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);const res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.id===old.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'job-source-review-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'plan');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
for(const q of [old,ref])for(const f of q.files){const path=q.destinationRoot+'/'+f.path,b=readFileSync(path),s=statSync(path);assert.equal(sha(b),f.sha256);assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());}
assert.equal(old.files.length,10);assert.equal(ref.files.length,8);assert.equal(sha(readFileSync(old.destinationRoot+'/.preparation-receipt.json')),ov.receiptSha256);assert.equal(sha(readFileSync(ref.destinationRoot+'/.preparation-receipt.json')),rv.receiptSha256);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,originalStaticGoUtc:'2026-10-16T22:46:03.100Z',originalScopeSha256:a.scopeSha256,referenceScopeSha256:rv.scopeSha256,referenceManifestSha256:rv.referenceManifestSha256,referenceCommit:ra.referenceCommit,
 actualWholeReference8Payloads109130BytesReceiptBindingConditionsAckApproved:true,
 nativeOwnedOpenSolMaxPlanPolicies4_2GuardReadyOriginal10AndReference8ReadonlyNonlink1PinsBothReceiptsMain275Exact:true,
 stage:'DOCUMENTARY_HOLD_LIFTED_CONFIRM_ORIGINAL_STATIC_AUDIT_RESUME_ONLY_NO_NEW_REVIEW_OR_DYNAMIC_WORK',
 resumeReferenceImpactAndRemainingOriginalAuditThenIndependentVerdictNoRepeatCompletedScans:true,
 noVerdictOrSourceFixPrescribedHypothesisStaticNotRepro:true,
 noCompileDotnetOsProbeJobApiFixtureTestsRuntimeDbSourceEditGitNativeOrIntegrationAuthority:true,
 referenceSourceFilesDataOnlyNeverImportOrCompile:true,sourceHelper70957212Unchanged:true,
 anyAcceptableStillRequiresSeparateHarmlessCompilationAndHostQualificationAndFullConcreteGo:true};
writeFileSync(phase+'/job-newline-static-resume-actual-final-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,stage:out.stage,all18ReadonlyPinsAndBothReceiptsExact:true,main275Exact:true}));
