import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const go=JSON.parse(readFileSync(phase+'/l7-copy851-ledger-v2-public-memory-probes-actual-final-go-20261016.json','utf8'));
const probe=JSON.parse(readFileSync(phase+'/l7-copy851-ledger-v2-public-memory-probes-parent-verification-20261016.json','utf8'));
const target=JSON.parse(readFileSync(phase+'/l7-copy851-ledger-v2-target-final-parent-verification-20261016.json','utf8'));
const req=JSON.parse(readFileSync(phase+'/l7-copy851-ledger-v2-preparation-request-20261016.json','utf8'));
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const session=await cli.session.get({sessionID:go.session});assert.deepEqual(session.model,go.model);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===req.missionId);
const task=team.tasks.find((t:any)=>t.id===go.task);assert.equal(task.status,'completed');assert.equal(task.assignee,'l7-copy851-review');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'plan');
const lead=await cli.session.get({sessionID:team.leadSessionId});assert.deepEqual(lead.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'xhigh'});assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);
const mb=readFileSync(go.run+'/FINAL_DELIVERY_ARTIFACTS.json'),manifest=JSON.parse(mb.toString('utf8'));assert.equal(manifest.verdict,'ACCEPTABLE_SCOPED_OFFLINE');assert.equal(manifest.files.length,13);
let total=0;for(const f of manifest.files){assert(!f.path.includes(':')&&!f.path.split('/').includes('..'));const b=readFileSync(go.run+'/'+f.path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);total+=b.length;}assert.equal(total,258996);assert.equal(manifest.totalBytes,total);
const original=JSON.parse(readFileSync(go.run+'/FINAL_ARTIFACTS.json','utf8'));assert.equal(original.files.length,11);assert.equal(original.totalBytes,255880);
const review=readFileSync(go.run+'/FINAL_REVIEW.md'),addendum=readFileSync(go.run+'/FINAL_REVIEW_ADDENDUM.md');assert.equal(review.length,11060);assert.equal(sha(review),'932b81c4c28edd4644b368529a93c087e03ed88803dfc61a6260fc58f6bb9807');assert.equal(addendum.length,934);assert.equal(sha(addendum),'374bd4899204265fee78b4eb9cb85d0505fd288cb9980738872158c80f04327c');
for(const p of ['NONBLIND','SimStore.write standalone','OFFLINE/PARTIAL/quarantined','254 PASS/1 FAIL','255 PASS/0 FAIL','12 cas déclarés','Aucune source/test/oracle'])assert(review.toString('utf8').includes(p));
assert(addendum.toString('utf8').includes('créé/écrit dix DB'));assert.equal(sha(readFileSync(go.run+'/POST_PROBE_QUALIFICATION.json')),probe.postQualificationSha256);
for(const f of req.files)assert.equal(sha(readFileSync(go.packet+'/'+f.path)),f.sha256);assert.equal(sha(readFileSync(go.packet+'/docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json')),'b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4');
assert.equal(sha(readFileSync(target.run+'/TARGET_V2_ARTIFACTS.json')),target.manifestSha256);assert.equal(sha(readFileSync(target.run+'/TARGET_V2_QUALIFICATION.json')),target.qualificationSha256);
const main=JSON.parse(readFileSync(phase+'/l5-budget-main-transfer-before.json','utf8'));for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,leadModel:lead.model,nativePlanTaskCompletedNoReopen:true,run:go.run,
 reportBytes:review.length,reportSha256:sha(review),addendumBytes:addendum.length,addendumSha256:sha(addendum),manifestBytes:mb.length,manifestSha256:sha(mb),proofFiles:13,proofBytes:total,
 independentVerdict:'ACCEPTABLE_SCOPED_OFFLINE',parentDecision:'RETAIN_ACCEPTABLE_SCOPED_OFFLINE_RECEIVABLE_parentCombinedIntegrationCrossQaGatesRemainOpen',
 oneTsc0Identity254ReuseOneV1RedPreservedOneV2_255PassAndTwelveIndependentHandDerivedPublicMemoryProbesConformed:true,
 source851FourCandidates195451BytesInputs403AndTwoReceiptsTargetProofsAndMain275Unchanged:true,
 dbClarificationAdditiveOriginalReportAndManifestPreservedNoZeroSqliteWriteClaimForTargetFixtures:true,
 independentNonblindPublicSummaryExposureStandaloneFreezeExportOriginAuthenticityHostileProxyAndOfflineLimitsExplicit:true,
 noNewTscProductTestsProbeDbSqlIdbGitSourceMutationOrIntegrationByThisVerification:true,
 stage:'FINAL_L7_COPY851_REVIEW_RECEIVABLE_COMPLETED_READY_FOR_PARENT_CROSS_QA_PACKAGE_NO_MAIN_TRANSFER_GO'};
writeFileSync(phase+'/l7-copy851-final-review-delivery-parent-verification-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(out));
