import { readFileSync, writeFileSync, readdirSync, lstatSync, statSync, chmodSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('full-route-refinement-admission-20261016.json'),src=load('combined-full-validation-plan-admission-20261016.json'),q=load('combined-full-validation-plan-preparation-request-20261016.json');
const fixed=[{path:'REFINEMENT.md',bytes:11904,sha256:'2d3a8f56f45be8457d76ec21f122b84062191283066518ef9d56e93446f505d2'},{path:'ROOTS_AND_CLEANUP.json',bytes:55039,sha256:'c2a508fc85ec43c3772dd020017ebafbe2ed743b91909f1db5c9092e312ac1d4'},{path:'CHILD_TREE_PLAN.md',bytes:9912,sha256:'f3d459827dab0b6565385ee40ee734e78682fe0176c72fbf6e3329aa4994c2bd'},{path:'MANIFEST.json',bytes:9643,sha256:'9ba22e138a0d52c7373e00aa6c2e7bdb066d53acb0eaaabd844c69131c83fa78'}];
const check=(base:string,f:any)=>{const path=base+'/'+f.path,b=readFileSync(path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());assert.equal(statSync(path).nlink,1);};
assert.deepEqual(readdirSync(a.outputDirectory).sort(),fixed.map(f=>f.path).sort());for(const f of fixed)check(a.outputDirectory,f);
const manifest=JSON.parse(readFileSync(a.outputDirectory+'/MANIFEST.json','utf8')),data=JSON.parse(readFileSync(a.outputDirectory+'/ROOTS_AND_CLEANUP.json','utf8'));
assert.equal(manifest.artifacts.length,3);for(const f of manifest.artifacts)check(a.outputDirectory,f);assert.equal(data.cleanupSites.length,25);assert.equal(new Set(data.cleanupSites.map((r:any)=>r.id)).size,25);assert.equal(data.roots.length,22);assert.equal(data.physicalEphemeralDbGroups.length,9);assert.equal(data.coverage.unchangedProposedMembership,44);assert.equal(data.coverage.actualProductInvocations,0);
const sources:any[]=[];for(const f of q.files){const b=readFileSync(q.destinationRoot+'/'+f.path);assert.equal(sha(b),f.sha256);sources.push({path:f.path,bytes:b.length,sha256:f.sha256});}assert.equal(sources.length,435);assert.equal(sha(readFileSync(q.destinationRoot+'/'+src.ledger.path)),src.ledger.sha256);
const old=JSON.parse(readFileSync(src.outputDirectory+'/MANIFEST.json','utf8'));for(const f of old.artifacts)check(src.outputDirectory,f);assert.equal(sha(readFileSync(src.outputDirectory+'/MANIFEST.json')),'03ef85bd174e1a056c7bc7f01bedf370b79c2b3adbb5f23ca15bde185a4a5b72');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===src.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l8-integration-r1');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
for(const f of fixed)chmodSync(a.outputDirectory+'/'+f.path,0o444);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,outputDirectory:a.outputDirectory,files:fixed,totalBytes:86498,
 staticDeliveryConformingFourFilesOnlyArtifacts3_76855BytesAndCounts25Sites22Roots9Groups44MembershipVerified:true,
 source435AndSeparateLedger436OldPlan4AndMain275Unchanged:true,newFourDocumentsNowReadonly:true,
 sourceAnchorsSelectivelyChecked:['fixture-driver.ts:45-65 registry gap and afterAll temporal scope','graph-interop-durability.test.ts:17-34 volatile push before Store','eventlog.test.ts:497-508,948-960,1089-1105,1389-1400 owned Bun contenders','ida-publication.test.ts:270-315 Python stub no actual IDB'],
 stage:'REFINEMENT_STATIC_DELIVERY_CONFORMING_FULL44_ROUTE_NOT_EXECUTABLE_B01_B02_B03_HOLD',
 candidateEphemeralCleanupPolicyNotApprovedNoRawDbLossWaiver:true,jobObjectProposalNotCompiledTestedOrQualifiedNotFilesystemConfinement:true,
 noProductJobCompilerDbRuntimeTestsCleanupOrSourceChangesByThisQualification:true,
 parentNext:'separate independent prospective B01_B02 contract review and source-only Job helper work no dynamic GO',globalL9L10MainNativeIntegrationStillClosed:true};
writeFileSync(phase+'/full-route-refinement-final-parent-verification-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({stage:out.stage,files:4,bytes:86498,source436AndPlan4Main275Exact:true,sourceOnlyNextNoDynamicGo:true}));
