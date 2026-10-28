import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync, readdirSync, statSync, lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const delivery=load('job-source-final-parent-verification-20261017.json'),review=load('job-source-review-final-parent-verification-20261017.json'),oldReq=load('job-source-review-r1-request-20261017.json'),refReq=load('job-newline-reference-request-20261017.json'),outDir=phase+'/JOB_HELPER_NEWLINE_FIX_OUTPUT_20261017';
const oldLine='eventBytes = checked(eventBytes + Encoding.UTF8.GetByteCount(line) + 1);',newLine='eventBytes = checked(eventBytes + Encoding.UTF8.GetByteCount(line) + Encoding.UTF8.GetByteCount(events.NewLine));';
for(const f of delivery.files){const path=delivery.outputDirectory+'/'+f.path,b=readFileSync(path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);assert.equal(statSync(path).mode&0o222,0);}
for(const req of [oldReq,refReq])for(const f of req.files)assert.equal(sha(readFileSync(req.destinationRoot+'/'+f.path)),f.sha256);
const scope=readFileSync(root+'/docs/missions/re-graph-scheduler/JOB_NEWLINE_FIX_SCOPE_20261017.md'),before=readFileSync(delivery.outputDirectory+'/JobRunner.cs','utf8');assert.equal(before.split(oldLine).length,2);assert.equal(review.verdict,'UNCERTAIN');
const mode=process.argv[2];assert(['--copy','--seal'].includes(mode));
if(mode==='--copy'){
 assert(!existsSync(outDir));const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const t=(await res.json()).teams.find((t:any)=>t.id===oldReq.missionId);const lead=await cli.session.get({sessionID:t.leadSessionId});assert.equal(lead.id,'ses_eca40a8e2ffeanEKTBLiGjDNw8');assert.deepEqual(lead.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'xhigh'});assert.equal(t.tasks.find((x:any)=>x.id===review.task).status,'completed');assert.equal(t.modelPolicy.revision,2);assert.equal(t.routingPolicy.revision,4);const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(t.id)&&!auth.admissionPausedTeams.includes(t.id));
 const go={at:new Date().toISOString(),parentLeadSession:lead.id,parentLeadModel:lead.model,scopeSha256:sha(scope),oldCsSha256:delivery.files[0].sha256,outDir,oldLine,newLine,exactlyOneTextReplacementOnly:true,oldUncertainReviewPreserved:true,logsFormatCrlfLimitsAbiLifecycleWrapperUnchanged:true,stage:'PARENT_MECHANICAL_SOURCE_FIX_GO_NEW_CANDIDATE_ONLY_NO_COMPILATION_PROBE_TEST_OR_INTEGRATION'};
 writeFileSync(phase+'/job-newline-parent-fix-go-20261017.json',JSON.stringify(go,null,2)+'\n',{flag:'wx'});
 for(const f of delivery.files){const to=f.path==='JobRunner.cs'||f.path==='Invoke-JobRunner.ps1'?f.path:'HISTORICAL/'+f.path;mkdirSync(dirname(outDir+'/'+to),{recursive:true});writeFileSync(outDir+'/'+to,readFileSync(delivery.outputDirectory+'/'+f.path),{flag:'wx'});chmodSync(outDir+'/'+to,f.path==='JobRunner.cs'?0o644:0o444);}
 writeFileSync(outDir+'/FIX_NOTE.md',scope,{flag:'wx'});chmodSync(outDir+'/FIX_NOTE.md',0o444);console.log(JSON.stringify({stage:go.stage,at:go.at,outDir,copiedFiveFilesOriginalsUnchanged:true}));
}else{
 const go=load('job-newline-parent-fix-go-20261017.json');assert.equal(sha(scope),go.scopeSha256);const after=readFileSync(outDir+'/JobRunner.cs');assert.equal(after.toString('utf8'),before.replace(oldLine,newLine));assert.equal(after.toString('utf8').split(newLine).length,2);
 const paths=['JobRunner.cs','Invoke-JobRunner.ps1','HISTORICAL/DESIGN_AND_FIXTURES.md','HISTORICAL/MANIFEST.json','FIX_NOTE.md'];const files=paths.map(path=>{const full=outDir+'/'+path,b=readFileSync(full);assert(lstatSync(full).isFile()&&!lstatSync(full).isSymbolicLink());assert.equal(statSync(full).nlink,1);return {path,bytes:b.length,sha256:sha(b)};});
 for(const f of delivery.files.filter((f:any)=>f.path!=='JobRunner.cs'))assert.equal(files.find(fx=>fx.path===(f.path==='Invoke-JobRunner.ps1'?f.path:'HISTORICAL/'+f.path))!.sha256,f.sha256);
 const manifest={schemaVersion:'job-newline-source-candidate-v2',at:new Date().toISOString(),executionOwner:'parent',parentFixGoUtc:go.at,scopeSha256:go.scopeSha256,oldReview:review.verdict,oldReviewPublicSha256:review.publicResult.sha256,oldCsSha256:delivery.files[0].sha256,newCsSha256:files[0]!.sha256,
 exactOneTextReplacement:{oldLine,newLine},files,preservedWrapperAndHistoricalDesignManifestExact:true,historicalDesignNotAProofOfNewCandidate:true,sourceOnlyUncompiledNoApiProbeOrFixture:true,
 next:'fresh independent bounded delta review with parent-endorsed unchanged prior static coverage, then separate harmless compile and host qualification',full44AndNativeIntegrationNotAuthorized:true};
 writeFileSync(outDir+'/CANDIDATE_MANIFEST.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});const mb=readFileSync(outDir+'/CANDIDATE_MANIFEST.json');files.push({path:'CANDIDATE_MANIFEST.json',bytes:mb.length,sha256:sha(mb)});for(const f of files)chmodSync(outDir+'/'+f.path,0o444);
 assert.deepEqual(readdirSync(outDir).sort(),['JobRunner.cs','Invoke-JobRunner.ps1','HISTORICAL','FIX_NOTE.md','CANDIDATE_MANIFEST.json'].sort());assert.deepEqual(readdirSync(outDir+'/HISTORICAL').sort(),['DESIGN_AND_FIXTURES.md','MANIFEST.json']);
 const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
 const out={at:new Date().toISOString(),outputDirectory:outDir,files,totalBytes:files.reduce((s,f)=>s+f.bytes,0),oldCsSha256:delivery.files[0].sha256,newCsSha256:files[0]!.sha256,manifestSha256:sha(mb),scopeSha256:go.scopeSha256,
 exactlyOneReplacementVerifiedAllSixRegularReadonlyNonlink1AndOldSourcesReviewInputsUnchanged:true,main275Exact:true,
 stage:'NEWLINE_SOURCE_FIX_CANDIDATE_SEALED_UNCOMPILED_READY_FOR_FRESH_BOUNDED_DELTA_REVIEW_NO_ADOPTION',
 noRuntimeCompilerAddTypeJobApiProbeTestsDbCacheSourceProjectGitCodeOrNativeIntegration:true};writeFileSync(phase+'/job-newline-fix-candidate-parent-verification-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
}
