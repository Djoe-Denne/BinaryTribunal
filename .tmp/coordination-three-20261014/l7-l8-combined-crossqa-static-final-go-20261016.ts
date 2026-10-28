import { readFileSync, writeFileSync, statSync, lstatSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('l7-l8-combined-crossqa-admission-20261016.json'),q=load('l7-l8-combined-crossqa-preparation-request-20261016.json'),p=load('l7-l8-combined-crossqa-parent-materialization-20261016.json');
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'max'});assert.equal(session.location.directory.replaceAll('\\','/'),a.own);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===a.missionId);
const task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l7-interop-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'build');
const lead=await cli.session.get({sessionID:team.leadSessionId});assert.deepEqual(lead.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'xhigh'});assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
let bytes=0;for(const f of q.files){const b=readFileSync(a.destinationRoot+'/'+f.path);assert.equal(sha(b),f.sha256);assert.equal(statSync(a.destinationRoot+'/'+f.path).mode&0o222,0);bytes+=b.length;}assert.equal(q.files.length,423);assert.equal(bytes,8465094);
const ledger=a.destinationRoot+'/'+a.ledger.path;assert.equal(sha(readFileSync(ledger)),a.ledger.sha256);assert.equal(statSync(ledger).size,8943882);assert.equal(statSync(ledger).mode&0o222,0);assert.equal(statSync(ledger).nlink,1);assert(lstatSync(ledger).isFile()&&!lstatSync(ledger).isSymbolicLink());
assert.equal(sha(readFileSync(a.destinationRoot+'/.preparation-receipt.json')),p.helperReceiptFileSha256);assert.equal(sha(readFileSync(a.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json')),p.parentProjectionReceiptSha256);assert.equal(sha(readFileSync(a.destinationRoot+'/PARENT/SCOPE.md')),a.scopeSha256);assert(!existsSync(a.proofDirectory));
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),missionId:team.id,task:task.id,session:session.id,model:session.model,leadModel:lead.model,packet:a.destinationRoot,proofDirectory:a.proofDirectory,scopeSha256:a.scopeSha256,manifestSha256:a.manifestSha256,
 actualRead423HelperPlusSeparateLedger424Payloads17408976BytesBothReceiptsWholeContractsRoleAccessAckApproved:true,
 nativeOwnedOpenSolMaxBuildTaskPolicies4_2GuardReadyAndAllPayloadsReadonlyExactNewOutputDirectoryAbsent:true,
 main275AndOldInputsProofsDbUnchanged:true,
 stage:'FINAL_STATIC_CROSS_QA_GO inventoryCoveragePublicInterfacePathsEffectsCleanupBoundedProposedTestsPlan_ONLY_NO_PRODUCT_EXECUTION',
 createOnlyNewOwnCrossQaDirectoryAfterThisGoNoSourceOrPacketChanges:true,
 deliverables:['PLAN.md coverage and open gates','effects/cleanup/env/DB ownership inventory with path:line','explicit commands/bounds and independently derived expected cases','isolated proposed tests only if existing coverage insufficient','file manifest of new outputs'],
 inputsReadOnlyNoImportsTscTestsBuildProbesCliGeneratorSqliteDbPortsOrRuntimeTemp:true,
 noOld42L7Or636L8DbOtherOwnSharedIndexInboxBoardGitLlmNativeOrIntegrationAuthority:true,
 noCentralEditsL8SoleAuthorAndNoIndependentL9OrGlobalAcceptanceByStaticPlan:true,
 anyDriftToolRefusalOrAmbiguityHoldNoFixRerunBypassOrUserQuestion:true,
 staticDeliveryThenHoldForParentQualificationAndDistinctBoundedDynamicGo:true};
writeFileSync(phase+'/l7-l8-combined-crossqa-static-actual-final-go-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({at:out.at,task:task.id,session:session.id,model:session.model,stage:out.stage,all424ReadonlyPinsAndBothReceiptsExact:true,main275Exact:true,newOutputAbsent:true,proofDirectory:a.proofDirectory}));
