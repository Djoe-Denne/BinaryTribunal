import { readFileSync, writeFileSync, readdirSync, statSync, lstatSync, chmodSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('job-source-r1-packet-admission-20261017.json'),q=load('job-source-r1-request-20261017.json'),v=load('job-source-r1-parent-packet-verification-20261017.json');
const files=[{path:'JobRunner.cs',bytes:40298,sha256:'709572128a71ca20fc0119ba059d3e79d817968c653492aa27adb6a7cd291c53'},{path:'Invoke-JobRunner.ps1',bytes:2920,sha256:'100e329ac33228d08e9bae323090925588d26115e0f9ee53382cd8c9940c1a77'},{path:'DESIGN_AND_FIXTURES.md',bytes:22639,sha256:'9ca22a88e361323ecd27ee0721c5bc8491687b05850efa062f3f9173f273a99d'},{path:'MANIFEST.json',bytes:5228,sha256:'eb0f69900ebf7388dead6d73fbd1855dedd9638583d01c5ad4e2d4eb246fe7e2'}];
assert.deepEqual(readdirSync(a.outputDirectory).sort(),files.map(f=>f.path).sort());
for(const f of files){const path=a.outputDirectory+'/'+f.path,b=readFileSync(path),s=statSync(path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());assert.equal(s.nlink,1);}
const m=JSON.parse(readFileSync(a.outputDirectory+'/MANIFEST.json','utf8'));assert.equal(m.outputs.length,3);for(const f of m.outputs){const expected=files.find(x=>x.path===f.path);assert(expected);assert.equal(f.bytes,expected.bytes);assert.equal(f.sha256,expected.sha256);}
for(const f of q.files){const path=a.destinationRoot+'/'+f.path;assert.equal(sha(readFileSync(path)),f.sha256);assert.equal(statSync(path).mode&0o222,0);}assert.equal(sha(readFileSync(a.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===q.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert(['in_progress','completed'].includes(task.status));assert.equal(task.assignee,'job-source-r1');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
for(const f of files)chmodSync(a.outputDirectory+'/'+f.path,0o444);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,nativeTaskStatus:task.status,outputDirectory:a.outputDirectory,files,totalBytes:71085,
 physicalExactlyFourRegularNonlink1PayloadsAndThreeManifestPinsConformingNowReadonly:true,
 input4AndReceiptUnchangedMain275Preserved:true,
 parentSelectiveRead:'PowerShell wrapper complete, C# declarations/ABI signatures and output manifest; author design is not accepted proof of Win32 correctness',
 sourceOnlyNoCompilerAddTypeJobApiFixtureOrDeliveredSourceImportPerformedByQualification:true,
 stage:'JOB_SOURCE_DELIVERY_CONFORMING_UNCOMPILED_UNQUALIFIED_READY_FOR_FRESH_INDEPENDENT_REVIEW_NOT_ADOPTION',
 claimsPollingLayoutsOwnershipLimitsQuiescenceNotScientificallyOrDynamicallyValidated:true,
 noSourceChangesByParentNoExistingProjectTestConfigGitNativeFf8OrIntegrationAuthority:true,
 requiredNext:['native author task closure if still open after verified delivery','fresh independent source/ABI/lifecycle review','separate toolchain/harmless compilation and Job qualification GO','full44 concrete image/environment/paths and final execution GO']};
writeFileSync(phase+'/job-source-final-parent-verification-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({stage:out.stage,task:out.task,nativeTaskStatus:out.nativeTaskStatus,files:4,bytes:71085,sourceCsSha256:files[0]!.sha256,uncompiled:true,main275Exact:true}));
