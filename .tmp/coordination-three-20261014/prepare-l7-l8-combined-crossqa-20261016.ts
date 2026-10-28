import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('l7-copy851-ledger-v2-preparation-request-20261016.json'),b=load('l8-runtime16-review-schema2-preparation-request-20261016.json');
const main=load('l5-budget-main-transfer-before.json'),prior=load('l7-interop-r1-baseline-preparation-request.json');
const final=load('l7-copy851-final-review-delivery-parent-verification-20261016.json');assert.equal(final.independentVerdict,'ACCEPTABLE_SCOPED_OFFLINE');
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const session=await cli.session.get({sessionID:prior.targetSessionId});assert.deepEqual(session.model,{providerID:'openai',id:'gpt-6.1-sol',variant:'max'});
const own=session.location.directory.replaceAll('\\','/');assert(own.endsWith('ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-interop-r1'));
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===prior.missionId);
const task=team.tasks.find((t:any)=>t.id===prior.taskId);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l7-interop-r1');assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'build');
assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);assert(!team.scheduling.autoDispatch&&!team.scheduling.autoScale);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
const sourceRoot=phase+'/L7_L8_COMBINED_CROSSQA_INPUTS_20261016',destinationRoot=own+'/inputs/L7_L8_COMBINED_CROSSQA_20261016',proof=own+'/CROSSQA-20261016';
assert(!existsSync(sourceRoot)&&!existsSync(destinationRoot)&&!existsSync(proof));
type Row={bytes:Buffer;kind:string;origin:string;hash:string};const files=new Map<string,Row>();
const put=(path:string,bytes:Buffer,kind:string,origin:string,replace=false)=>{assert(replace||!files.has(path));assert(!path.includes(':')&&!path.split('/').includes('..'));assert(bytes.length<=8*1024*1024);assert.notEqual(bytes.subarray(0,15).toString(),'SQLite format 3');files.set(path,{bytes,kind,origin,hash:sha(bytes)});};
for(const f of [...main.preserved,...main.source]){const bytes=readFileSync(root+'/'+f.path);assert.equal(sha(bytes),f.sha256);put(f.path,bytes,f.path.includes('/test/')?'test':f.path.includes('/src/')?'source':'rule','accepted-main275 exact');}
assert.equal(files.size,275);
const harness='tools/ff8-harness/';
for(const f of a.files){if(!f.path.startsWith(harness))continue;const bytes=readFileSync(a.destinationRoot+'/'+f.path);assert.equal(sha(bytes),f.sha256);const p=files.get(f.path);if(p){if(p.hash!==f.sha256)assert.equal(f.path,harness+'package.json');}else put(f.path,bytes,f.kind,'receivable-L7 whole-copy851 frozen input');}
assert.equal([...files.keys()].filter(p=>p.startsWith(harness)).length,290);
const allowedCore=['cli.ts','client.ts','domain.ts','engine.ts'].map(p=>harness+'src/'+p);
for(const f of b.files){if(!f.path.startsWith(harness))continue;const bytes=readFileSync(b.destinationRoot+'/'+f.path);assert.equal(sha(bytes),f.sha256);const p=files.get(f.path);if(f.path===harness+'package.json'){assert(p);continue;}if(p&&p.hash!==f.sha256){assert(allowedCore.includes(f.path));put(f.path,bytes,f.kind,'receivable-runtime16 explicit central override',true);}else if(!p)put(f.path,bytes,f.kind,'receivable-runtime16 frozen source/test');}
assert.equal([...files.keys()].filter(p=>p.startsWith(harness)).length,301);
const isBaseline=(f:any)=>!f.path.startsWith(harness)&&!['PARENT/','HISTORICAL/','EVIDENCE/'].some(p=>f.path.startsWith(p))&&f.path!=='REVIEW_INPUT_MANIFEST.json';
for(const f of a.files.filter(isBaseline)){const bytes=readFileSync(a.destinationRoot+'/'+f.path);assert.equal(sha(bytes),f.sha256);const p=files.get(f.path);if(p)assert.equal(p.hash,f.sha256);else put(f.path,bytes,f.kind,'same known offline baseline root fixture/contract');}
const decisions=['L7_COPY851_REVIEW_ACCEPTABLE_SCOPED_20261016.md','L8_RUNTIME16_REVIEW_ACCEPTABLE_SCOPED_20261016.md','AUTONOMY_CONTINUATION_20261016.md'];
for(const n of decisions)put('PARENT/'+n,readFileSync(root+'/docs/missions/re-graph-scheduler/'+n),'rule','current parent authority; no old worker transcript');
put('PARENT/SCOPE.md',readFileSync(root+'/docs/missions/re-graph-scheduler/L7_L8_COMBINED_CROSSQA_SCOPE_20261016.md'),'rule','current ACCESS_ONLY then separate STATIC_GO and later dynamic gate');
const ledger={path:'docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json',bytes:8943882,sha256:'b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4'};
const raw=readFileSync(a.destinationRoot+'/'+ledger.path);assert.equal(raw.length,ledger.bytes);assert.equal(sha(raw),ledger.sha256);assert(!files.has(ledger.path));
put('PARENT/LARGE_FIXTURE_BINDING.json',Buffer.from(JSON.stringify({...ledger,outsideHelperReceipt:true,parentSeparateLocalByteExactReadonlyProjection:true,helperCapAndConfigurationUnchangedNoSplitParseReserializeLink:true,noNativeExtractionOrWorkerAccessToSource:true},null,2)+'\n'),'manifest','explicit separate raw parent projection');
const overrides=allowedCore.map(path=>({path,previousSha256:[...main.preserved,...main.source].find((f:any)=>f.path===path).sha256,currentSha256:files.get(path)!.hash}));
const data={stage:'ACCESS_ONLY allPinsContractsBothReceiptsAndSeparateLedgerAckThenHold',sameExistingTask:task.id,own,proofDirectory:proof,rolesNoIndependentL9OrMainIntegration:true,acceptedMain275ExceptFourDeclaredCoreOverridesAnd26NewHarnessFiles:true,
 packageJsonPreservedFromMainNoStale486BytePackageTransfer:true,explicitCentralOverrides:overrides,ledger,files:[...files].map(([path,f])=>({path,bytes:f.bytes.length,sha256:f.hash,kind:f.kind,origin:f.origin}))};
put('COMBINED_INPUT_MANIFEST.json',Buffer.from(JSON.stringify(data,null,2)+'\n'),'manifest','all helper pins and provenance; ledger separately bound not helper-covered');
assert(files.size<=512);for(const[p,f]of files){mkdirSync(dirname(sourceRoot+'/'+p),{recursive:true});writeFileSync(sourceRoot+'/'+p,f.bytes,{flag:'wx'});}
const request={...prior,cycle:2,role:'implementer',blind:false,sourceRoot,destinationRoot,files:[...files].map(([path,f])=>({path,sha256:f.hash,kind:f.kind}))};
const out={at:new Date().toISOString(),missionId:team.id,task:task.id,session:session.id,model:session.model,nativeProfile:'build',own,proofDirectory:proof,sourceRoot,destinationRoot,helperFiles:files.size,helperBytes:[...files.values()].reduce((n,f)=>n+f.bytes.length,0),manifestSha256:files.get('COMBINED_INPUT_MANIFEST.json')!.hash,scopeSha256:files.get('PARENT/SCOPE.md')!.hash,ledger,rawFixtureSource:a.destinationRoot+'/'+ledger.path,explicitCentralOverrides:overrides,mainPackageSha256:files.get(harness+'package.json')!.hash,stage:'PREPARED_INPUTS_NOT_APPROVED_AWAIT_NATIVE_TRANSFER_AND_SEPARATE_LEDGER_MATERIALIZATION'};
writeFileSync(phase+'/l7-l8-combined-crossqa-preparation-request-20261016.json',JSON.stringify(request,null,2)+'\n',{flag:'wx'});writeFileSync(phase+'/l7-l8-combined-crossqa-admission-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage:out.stage,task:task.id,session:session.id,model:session.model,helperFiles:out.helperFiles,helperBytes:out.helperBytes,manifestSha256:out.manifestSha256,scopeSha256:out.scopeSha256,harnessFiles:301,centralOverrides:allowedCore,ledgerSeparate:true,noWorkerProductExecutionOrMainTransfer:true}));
