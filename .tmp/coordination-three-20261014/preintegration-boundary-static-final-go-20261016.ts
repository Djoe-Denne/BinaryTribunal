import { readFileSync, writeFileSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('preintegration-boundary-review-native-inputs-20261016.json'),q=load('preintegration-boundary-review-preparation-request-20261016.json'),p=load('preintegration-boundary-review-parent-materialization-20261016.json');
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'max'});assert.equal(session.location.directory.replaceAll('\\','/'),root);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===a.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'preintegration-boundary-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'plan');
assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
let bytes=0;for(const f of q.files){const path=q.destinationRoot+'/'+f.path,b=readFileSync(path);assert.equal(sha(b),f.sha256);assert.equal(statSync(path).mode&0o222,0);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());assert.equal(statSync(path).nlink,1);bytes+=b.length;}
assert.equal(q.files.length,452);assert.equal(bytes,8865020);const ledger=q.destinationRoot+'/'+a.ledger.path;assert.equal(sha(readFileSync(ledger)),a.ledger.sha256);assert.equal(statSync(ledger).size,8943882);assert.equal(statSync(ledger).mode&0o222,0);assert.equal(statSync(ledger).nlink,1);assert(lstatSync(ledger).isFile()&&!lstatSync(ledger).isSymbolicLink());
assert.equal(sha(readFileSync(q.destinationRoot+'/.preparation-receipt.json')),p.helperReceiptSha256);assert.equal(sha(readFileSync(q.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json')),p.parentReceiptSha256);assert.equal(sha(readFileSync(q.destinationRoot+'/PARENT/SCOPE.md')),a.scopeSha256);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,profile:'plan',packet:q.destinationRoot,proofDirectory:a.proofDirectory,scopeSha256:a.scopeSha256,manifestSha256:a.manifestSha256,
 actualWholeScopeContractsPreambleManifest452HelperPlusSeparateLedger453_17808902BothReceiptsRoleAccessAckApproved:true,
 nativeOwnedOpenSolMaxPlanPolicies4_2GuardReadyAllInputsRegularNonlinkNlink1ReadonlyExactMain275Preserved:true,
 firstHoldPublicBootstrapExposureQualifiedNonblindNeverPacketOnlyNoFurtherIndexInboxBoardQueries:true,
 globalL9TaskStillBlockedNoDependencyWaiver:true,
 stage:'FINAL_STATIC_BOUNDARY_AUDIT_GO_SOURCE_ONLY_verdictAnchorsContrariesOrBoundedProbeProposal_thenHold_NO_PRODUCT_EXECUTION',
 inspectInteractionSurfaceAndNecessaryCalleesNotRepeatWholeAcceptedComponentReviews:true,
 verdicts:['ACCEPTABLE_BOUNDARY_SCOPED','BLOCK','UNCERTAIN'],sourceAnchorsMin:3,sourceAnchorsMax:8,
 outputsOnlyNamedProofDirOrPublicReportIfNativePlanRefusesNoBypass:true,
 noSourceTestInputMutationImportTscTestBuildProbeCliSqliteDbPortRuntimeTempOldDbCacheOtherOwnSharedIndexInboxGitLlmNativeOrIntegrationAuthority:true,
 anyRequiredDynamicCounterexampleNeedsNewParentRelevanceBoundsEffectsAndDistinctGo:true,
 staticHypothesisNotExecutedReproAndScopedVerdictNotGlobalL9L10MainTransfer:true};
writeFileSync(phase+'/preintegration-boundary-static-actual-final-go-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:out.task,session:out.session,model:out.model,stage:out.stage,all453ReadonlyPinsExact:true,globalL9StillBlocked:true,main275Exact:true}));
