import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',base=root+'/.tmp/re-graph-scheduler/review-20261014',destination=base+'/L8_BUDGET_BOUNDARY_EVIDENCE',owned='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l8-integration-r1';
if(existsSync(destination))throw Error('Immutable budget snapshot exists');const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(readFileSync(phase+'/l8-integration-r1-baseline-preparation-result.json','utf8')),map=new Map<string,{bytes:Buffer,kind:string,origin:string}>();
for(const p of baseline.files){const bytes=readFileSync(base+'/MAIN_e03e063_OFFLINE/'+p.path);if(sha(bytes)!==p.sha256)throw Error('Baseline drift');map.set(p.path,{bytes,kind:p.kind,origin:'accepted baseline e03e063, except explicitly overlaid L8 candidate paths'});}
const evidence=owned+'/.tmp/L8_BUDGET_EVIDENCE',manifestBytes=readFileSync(evidence+'/manifest.json');if(sha(manifestBytes)!=='ec7ef12b2c2200718eb3b9058d6f5ba50718d576ff691e535251dc7698b30ce4')throw Error('Actor evidence manifest drift');
const manifest=JSON.parse(manifestBytes.toString('utf8')),sourcePins=JSON.parse(readFileSync(evidence+'/source-freeze-pins.json','utf8'));
if(sourcePins.files.length!==13)throw Error('Source freeze count');
for(const p of sourcePins.files){const bytes=readFileSync(owned+'/'+p.path);if(bytes.length!==p.bytes||sha(bytes)!==p.sha256)throw Error('L8 partial source drift '+p.path);map.set(p.path,{bytes,kind:p.path.includes('/test/')?'test':'source',origin:'UNACCEPTED L8 partial source, frozen for budget analysis only'});}
for(const p of sourcePins.approvedPathsStillAbsent)if(existsSync(owned+'/'+p))throw Error('Reported absent L8 source appeared');
for(const p of [...manifest.files,{path:'manifest.json',bytes:manifestBytes.length,sha256:sha(manifestBytes)}]){if(p.path.includes('/')||p.path.includes('\\'))throw Error('Unsafe evidence path');const bytes=readFileSync(evidence+'/'+p.path);if(bytes.length!==p.bytes||sha(bytes)!==p.sha256)throw Error('Evidence payload drift');map.set('.tmp/L8_BUDGET_EVIDENCE/'+p.path,{bytes,kind:p.path.endsWith('.ts')?'source':p.path.endsWith('.md')?'knowledge':'manifest',origin:'fixture proof only, no native authority'});}
for(const [path,from,kind]of [
 ['PARENT/SCOPE.md',root+'/docs/missions/re-graph-scheduler/L8_ADMISSION_BUDGET_BOUNDARY_20261015.md','rule'],
 ['PARENT/ANCHOR_GO.md',root+'/docs/missions/re-graph-scheduler/L8_FROZEN_CYCLE_ANCHOR_GO_20261015.md','rule'],
 ['PARENT/PHASE_A_GO.md',root+'/docs/missions/re-graph-scheduler/L8_PHASE_A_PLAN_APPROVAL_20261015.md','rule'],
 ['PARENT/REPRO_OUTPUT.txt',phase+'/l8-budget-parent-repro.log','manifest']
 ] as const)map.set(path,{bytes:readFileSync(from),kind,origin:'parent scope/proof, not implementation approval'});
const files:{path:string,sha256:string,kind:string,origin:string}[]=[];
for(const [path,value]of [...map.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0)){if(value.bytes.length>8*1024*1024)throw Error('Per-file input bound');mkdirSync(dirname(destination+'/'+path),{recursive:true});writeFileSync(destination+'/'+path,value.bytes,{flag:'wx'});files.push({path,sha256:sha(value.bytes),kind:value.kind,origin:value.origin});}
const notes={purpose:'Read-only architectural budget-boundary analysis; not L8 acceptance or code permission',acceptedL5L6Unmodified:true,L8CandidatePaths:sourcePins.files.map((p:any)=>p.path),absentPaths:sourcePins.approvedPathsStillAbsent,originalActorEvidenceManifest:sha(manifestBytes),parentReproduced:{A:3578,B:3578,R:13590,frozenUnit:3073,global:1000000,submits:0},oversizedLedgerNotIncluded:true,files};
const b=Buffer.from(JSON.stringify(notes,null,2)+'\n');writeFileSync(destination+'/BUDGET_INPUT_MANIFEST.json',b,{flag:'wx'});
console.log(JSON.stringify({destination,files:files.length+1,bytes:[...map.values()].reduce((n,v)=>n+v.bytes.length,0)+b.length,sourceCandidateFiles:13,evidenceFiles:32,manifestSha256:sha(b),notAccepted:true}));
