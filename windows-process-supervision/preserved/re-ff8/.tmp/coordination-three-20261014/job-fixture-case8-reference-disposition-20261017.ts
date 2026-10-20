import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('job-fixture-source-r1-packet-admission-20261017.json'),q=load('job-fixture-source-r1-request-20261017.json'),go=load('job-fixture-source-actual-final-go-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);const res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.id===q.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'job-fixture-source-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'build');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
for(const f of q.files)assert.equal(sha(readFileSync(q.destinationRoot+'/'+f.path)),f.sha256);assert.equal(go.scopeSha256,a.scopeSha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,sourceGoUtc:go.at,scopeSha256:a.scopeSha256,
 stage:'CASE8_REFERENCE_HOLD_EXPLICIT_NO_IMPLEMENTATION_OR_WAIVER_CONTINUE_OTHER_ALREADY_AUTHORIZED_SOURCE_ONLY_WORK',
 case8:{status:'HOLD_REFERENCE_NOT_IMPLEMENTED',reason:'No material authoritative CREATE_BREAKAWAY_FROM_JOB contract flags conditions or oracle in admitted packet',noGuessedConstantPInvokeOrAssumedOsRefusal:true,noTestSkippedSilentlyOrBreakawayRequirementWaived:true,
 requiredFuture:'separately pinned authoritative reference, independent oracle/control argument, reviewed finite implementation and distinct compile/host qualification GO'},
 sourceDisposition:'finish four declared new files under existing source-only GO; preserve case8 in plan and manifest as explicit blocked coverage, do not present other cases as full host qualification',
 noNewInputPacketOrNavigationAllowedNoRepeatedCompletedReadsOrSourceScan:true,
 remainingCasesAreOnlyProspectiveSourceProposalsNoExecutionOrGuaranteedOutcome:true,
 noHelperSourceChangesCompilerDllLoadAddTypeJobApiFixtureTestsRuntimeDbGitNativeOrIntegration:true,
 allExistingSourceScopeSafetyBoundsAndIndependentReviewGatesUnchanged:true};
writeFileSync(phase+'/job-fixture-case8-reference-disposition-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,stage:out.stage,task:out.task,scopeUnchanged:true,noNewExecutionAuthority:true}));
