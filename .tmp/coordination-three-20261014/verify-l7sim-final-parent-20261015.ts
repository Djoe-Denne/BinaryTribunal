import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',own='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-simulator-fix-max',dir=own+'/.tmp/l7sim-fix-20261015';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex'),mb=readFileSync(dir+'/FINAL_CANDIDATE.json');
if(sha(mb)!=='2f74550b05a569c5c49d8421f39aa7497412197671b154e29a781b71e62fb85e')throw Error('Final candidate manifest drift');
const m=JSON.parse(mb.toString('utf8'));
if(m.task!=='task_mv9doihe_0028_o59w3v'||m.session!=='ses_ec0f4f005ffeiESudi5ADo2QXH'||m.frozenFiles.length!==7)throw Error('Foreign candidate');
for(const f of m.frozenFiles)for(const base of [own,dir+'/FROZEN']){const b=readFileSync(base+'/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Candidate ROOT/FROZEN differs '+f.path);}
for(const f of m.evidence){const b=readFileSync(dir+'/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Evidence drift '+f.path);}
const input=own+'/inputs/L7SIM_FIX_903bf6e',receipt=JSON.parse(readFileSync(input+'/.preparation-receipt.json','utf8'));
for(const f of receipt.files){const b=readFileSync(input+'/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Original input pin drift');}
const before=JSON.parse(readFileSync(dir+'/pins-before.json','utf8')) as {path:string,sha256:string}[];
const changes=before.filter(f=>sha(readFileSync(own+'/'+f.path))!==f.sha256).map(f=>f.path).sort();
const expected=['tools/ff8-harness/src/simulator.ts','tools/ff8-harness/test/benchmarks/README.md','tools/ff8-harness/test/benchmarks/sparse.ts','tools/ff8-harness/test/simulator/scenarios.ts'].sort();
if(JSON.stringify(changes)!==JSON.stringify(expected))throw Error('Unexpected before/after delta');
const original=root+'/.tmp/re-graph-scheduler/review-20261014/L7SIM_CURRENT_BASELINE',scenarios='tools/ff8-harness/test/simulator/scenarios.ts';
const old=readFileSync(original+'/'+scenarios,'utf8'),now=readFileSync(own+'/'+scenarios,'utf8');
const newLine='workers: Array.from({ length: workers }, () => ({ profile: "build", accountId: "shared", tools: ["cpu"], model: "offline", slots: 1, cpu: 1, gpu: 0, budget: 1_000_000 })), accountCapacities: { shared: { slots: workers, budget: 1_000_000 } },';
const oldLine='workers: Array.from({ length: workers }, () => ({ profile: "build", accountId: "shared", tools: ["cpu"] })),';
if(now.split(newLine).length!==2||now.replace(newLine,oldLine)!==old)throw Error('Helper not exactly prescribed capability declaration');
for(const p of ['tools/ff8-harness/test/simulator/simulator.test.ts','tools/ff8-harness/test/simulator/oracle.ts','tools/ff8-harness/test/benchmarks/benchmarks.test.ts'])if(sha(readFileSync(original+'/'+p))!==sha(readFileSync(own+'/'+p)))throw Error('Old tests/oracle changed');
const gates=JSON.parse(readFileSync(dir+'/gates-env-retest.json','utf8'));if(gates.results.length!==2||gates.results.some((x:any)=>x.status!==0))throw Error('Author final gates not green');
const reportSha=sha(readFileSync(dir+'/FINAL_REPORT.md'));if(reportSha!=='be72e77965aa1541fddf2322f934bd8cb852f4d36ca64aba6a962bfe163d5a33')throw Error('Handoff report drift');
const result={candidateSha256:m.frozenFiles.find((f:any)=>f.path.endsWith('/src/simulator.ts')).sha256,manifestSha256:sha(mb),finalReportSha256:reportSha,candidateRootAndFrozenFilesExact:7,originalInputPinsExact:receipt.files.length,readonlyBeforePins:before.length,expectedExistingChanges:changes,allEvidencePinsExact:m.evidence.length,helperMechanicalInverseExact:true,old35TestSourcesAndOracleExact:true,authorRetestFull:gates.results.find((x:any)=>x.name==='env-retest-full'),authorTaskClosedForDeliveryOnly:true,parentAcceptance:false,mainSimulatorStillAbsent:true};
writeFileSync(phase+'/l7sim-corrective-parent-verification.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...result,authorRetestFull:{status:result.authorRetestFull.status,ms:result.authorRetestFull.ms,summary:result.authorRetestFull.summary}}));
