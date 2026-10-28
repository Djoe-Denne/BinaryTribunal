import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript/lib/typescript.js';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('l7-l8-combined-crossqa-admission-20261016.json'),q=load('l7-l8-combined-crossqa-preparation-request-20261016.json'),s=load('l7-l8-static-go-supplement-admission-20261016.json');
const old=JSON.parse(readFileSync(a.proofDirectory+'/MANIFEST.json','utf8')),cmBytes=readFileSync(a.proofDirectory+'/CORRECTIVE_MANIFEST.json'),cm=JSON.parse(cmBytes.toString('utf8'));
assert.equal(sha(cmBytes),'34a5211c9b5f1252a12759fbb4780d6183144c8918b76ff014ff06567070cd4a');
const pin=(base:string,f:any)=>{const b=readFileSync(base+'/'+f.path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);return b;};
for(const f of [...cm.preservedPriorFiles,...cm.newPayloadFiles])pin(a.proofDirectory,f);
const before=readFileSync(a.proofDirectory+'/proposed/crossqa.test.ts','utf8');let corrected=before;
const replacements=[['leaseTicks: 1000, heartbeatEvery: 10','leaseTicks: 16, heartbeatEvery: 0'],['maxTicks: 80','maxTicks: 32'],['expect(result.metrics.makespan).toBe(11); expect(JSON.stringify(plan.source)).toBe(archive);','expect(result.metrics.publicationEndTick).toBe(11); expect(result.metrics.outcome).toBe("stuck");\n  expect(result.metrics.makespan).toBe(result.metrics.observationEndTick); expect(JSON.stringify(plan.source)).toBe(archive);'],['[path, path + "-wal", path + "-shm"]','[path, path + "-wal", path + "-shm", path + "-journal"]']];
for(const[from,to]of replacements){assert.equal(corrected.split(from).length,2);corrected=corrected.replace(from,to);}
const draft=readFileSync(a.proofDirectory+'/proposed/crossqa.v2.test.ts');assert.equal(corrected,draft.toString('utf8'));assert.equal(draft.length,16633);assert.equal(sha(draft),'5420398b28676ae8f2c0ebc72cf7d6d36ea64f1035f5b31b2959050e0c8bc878');
const ast=ts.createSourceFile('crossqa.v2.test.ts',corrected,ts.ScriptTarget.Latest,true);assert.equal(ast.parseDiagnostics.length,0);
for(const f of q.files){assert.equal(sha(readFileSync(q.destinationRoot+'/'+f.path)),f.sha256);assert.equal(statSync(q.destinationRoot+'/'+f.path).mode&0o222,0);}assert.equal(sha(readFileSync(a.destinationRoot+'/'+a.ledger.path)),a.ledger.sha256);
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===a.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'l7-interop-r1');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));
const originalAuthority:Record<string,string>={};for(const name of ['APPDATA','LOCALAPPDATA']){const keys=Object.keys(process.env).filter(k=>k.toUpperCase()===name);assert.equal(keys.length,1);assert(process.env[keys[0]!]!==undefined);originalAuthority[name]=process.env[keys[0]!]!;}
assert.equal(Object.keys(process.env).filter(k=>k.toUpperCase()==='FF8_ENSEMBLE_SOURCE').length,0);
const runId='xq-'+randomUUID().replaceAll('-','').slice(0,8),runRoot=a.proofDirectory+'/runtime-'+runId;assert(!existsSync(runRoot));
const selectedNames=['S remains the scientific measurement; C, N, T and total are separate commitments','caller closure prices required callee before include and rejects missing callee allocation','shared/already-selected callees are charged once, with no partial consumer closure','SCC caps use max owned cap, N counts sub-intents once across all passes; context is not charged'];
const testSource=readFileSync(a.destinationRoot+'/tools/ff8-harness/test/planner-admission-budget.test.ts','utf8');for(const n of selectedNames)assert(testSource.includes(n));
const envOverrides={XQA_RUN_ID:runId,XQA_EXECUTION_GO:'parent-approved-combined-crossqa-v1',TEMP:runRoot+'/tmp',TMP:runRoot+'/tmp',TMPDIR:runRoot+'/tmp',BUN_RUNTIME_TRANSPILER_CACHE_PATH:runRoot+'/bun-cache'};
const existingStaticPins=[...cm.preservedPriorFiles,...cm.newPayloadFiles,{path:'CORRECTIVE_MANIFEST.json',bytes:cmBytes.length,sha256:sha(cmBytes)}];assert.equal(existingStaticPins.length,9);
const gate={at:new Date().toISOString(),missionId:a.missionId,task:a.task,session:a.session,model:session.model,cycle:2,packet:a.destinationRoot,proofDirectory:a.proofDirectory,scopeSha256:a.scopeSha256,packetManifestSha256:a.manifestSha256,
 stage:'ACCESS_ONLY_DYNAMIC_GATE_CONTRACT_NO_RUNTIME_CREATION_OR_EXECUTION_BEFORE_ACK_RESERVATION_AND_DISTINCT_FINAL_GO',
 runId,runRoot,ownerJsonRequired:{taskId:a.task,sessionId:a.session,runId,packetManifestSha256:a.manifestSha256,native:false},originalAuthority,envOverrides,
 commands:[{id:'D1',argv:['test','--bail=1','--timeout=30000','test/planner-admission-budget.test.ts','--test-name-pattern',selectedNames.join('|')],cwd:a.destinationRoot+'/tools/ff8-harness',maxMs:30000,expectedExecutedTests:4,expectedNames:selectedNames,newDbLimit:0},{id:'D2',argv:['test','--bail=1','--timeout=30000','./CROSSQA-20261016/proposed/crossqa.v2.test.ts'],cwd:a.own,maxMs:150000,expectedExecutedTests:5,expectedNames:['XQA-01','XQA-02','XQA-03','XQA-04','XQA-05'],newDbLimit:2,onlyAfterNaturalD1ExactFourPassAndPostPins:true}],
 globalMaxMsFromFirstSpawn:180000,maxUnitsPerCase:3,maxFakeExecutionsPerRuntimeCase:9,maxRuntimeStepsTotal:28,maxNewDb:2,maxPortsSubprocessesWorkersInsideTests:0,
 explicitDbPaths:['event-unlock','readback-reopen'].map(n=>runRoot+'/'+n+'/own.db'),sidecarSuffixes:['','-wal','-shm','-journal'],newRegistryPath:runRoot+'/registry.jsonl',
 maxObservedDbBytesEach:20*1024*1024,maxObservedOpaqueCacheBytes:64*1024*1024,resourceLimitsObservedNotBackendEnforced:true,
 staticDraftOriginalSixPreservedV2OnlyFourLiteralReplacementsVerified:true,staticSimPositiveEvents:[0,3,7,9,11,14,16,18,20,22,27],staticSimBlockedEvents:[0,3,7,9,11,16],
 staticManualOracles:{perUnit:11,totalPublication:22,usefulWorkerTicks:24,lease:16,heartbeat:0,horizon:32,blockedPublication:11,blockedObservation:16,completeBodyCap:60000,newExecutions:3,totalPerUnit:180000,selectedTotal:360000},
 existingStaticPins,commonHelperReceiptSha256:'9f84fec4e3ab996a61fd975ac359a6df4a1fcde558ec9e9266590370c42c3a85',commonParentLedgerReceiptSha256:'74f206aed3ece1dd4b8ae459339fae2741ae0a7bcf428529f5d0684954f71de7',
 separateStaticGoSupplement:s.destinationRoot,all424CommonInputsAndTwoReceiptsSupplementTwoReceiptStaticNineAndDynamicContractBothFilesReceiptBeforeAfter:true,
 anyRedSetupPinGuardRefusalUnexpectedCaseOrEffectHoldNoFixOracleSourceRerunCleanupBypass:true,
 noTscFullOld107Old255NativeRealInteropMainTransferOrGlobalAcceptanceAuthority:true};
const sourceRoot=phase+'/L7_L8_CROSSQA_DYNAMIC_INPUTS_20261016',destinationRoot=a.own+'/inputs/L7_L8_CROSSQA_DYNAMIC_GATE_20261016';assert(!existsSync(destinationRoot));
writeFileSync(sourceRoot+'/DYNAMIC_GATE.json',JSON.stringify(gate,null,2)+'\n',{flag:'wx'});
const files=['DYNAMIC_GATE.md','DYNAMIC_GATE.json'].map(path=>{const b=readFileSync(sourceRoot+'/'+path);return {path,bytes:b.length,sha256:sha(b),kind:'rule'};});
const req={...q,sourceRoot,destinationRoot,files:files.map(({bytes,...f})=>f)};
writeFileSync(phase+'/l7-l8-crossqa-dynamic-gate-request-20261016.json',JSON.stringify(req,null,2)+'\n',{flag:'wx'});
const out={at:gate.at,task:a.task,session:a.session,model:session.model,sourceRoot,destinationRoot,runId,runRoot,files,runtimeAbsent:true,static9Files88480BytesExactNoProductExecution:true,parentVerifiedFourLiteralReplacementsAndManualTimerBounds:true,runnerQualification:load('l7-l8-crossqa-runner-qualification-20261016.json'),stage:gate.stage};
writeFileSync(phase+'/l7-l8-crossqa-dynamic-gate-admission-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,task:a.task,session:a.session,model:session.model,files,runId,runRoot,runtimeAbsent:true,stage:out.stage}));
