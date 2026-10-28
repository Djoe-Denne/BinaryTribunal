import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/re-graph-scheduler/review-20261014',source=base+'/MAIN_e03e063_OFFLINE',destination=base+'/L7SIM_CURRENT_BASELINE';
if(existsSync(destination))throw Error('Immutable candidate exists');
const old='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-qa-r3',sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
if(sha(readFileSync(old+'/tools/ff8-harness/src/simulator.ts'))!=='dcaa4ace0ead545469d0390921265b615b0eb6da743f0b7695e7c58219177df4')throw Error('Historical simulator changed');
const files:{path:string,sha256:string,kind:string,origin:string}[]=[];
function add(path:string,b:Buffer,kind:string,origin:string){mkdirSync(dirname(destination+'/'+path),{recursive:true});writeFileSync(destination+'/'+path,b,{flag:'wx'});files.push({path,sha256:sha(b),kind,origin});}
const baseline=JSON.parse(readFileSync(root+'/.tmp/coordination-three-20261014/l8-integration-r1-baseline-preparation-result.json','utf8'));
for(const p of baseline.files){const b=readFileSync(source+'/'+p.path);if(sha(b)!==p.sha256)throw Error('Baseline drift');add(p.path,b,p.kind,'accepted HEAD e03e063');}
const candidate=['tools/ff8-harness/src/simulator.ts'];
for(const dir of ['tools/ff8-harness/test/simulator','tools/ff8-harness/test/benchmarks']){
 const walk=(p:string)=>{for(const e of readdirSync(old+'/'+p,{withFileTypes:true})){if(e.isDirectory())walk(p+'/'+e.name);else if(e.isFile())candidate.push(p+'/'+e.name);else throw Error('Candidate link');}};walk(dir);
}
for(const p of candidate.sort())add(p,readFileSync(old+'/'+p),p.includes('/src/')?'source':'test','historical L7 delivery; NOT accepted/integrated');
const note={purpose:'Recover preserved historical L7 scheduler delivery against accepted current dependencies; not authority or acceptance',candidateSource:'dcaa4ace0ead545469d0390921265b615b0eb6da743f0b7695e7c58219177df4',sourceWorktreePreserved:old,parentOld35TestsNotCurrentInteropEvidence:true,candidateFiles:candidate,mainAndBothActiveDevelopmentTreesUntouched:true,oversizedLedgerNotIncluded:true};
add('L7_CANDIDATE_NOTES.json',Buffer.from(JSON.stringify(note,null,2)+'\n'),'manifest','parent scope');
const manifest={...note,files};writeFileSync(destination+'/L7_CANDIDATE_MANIFEST.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,baselineFiles:baseline.files.length,candidateFiles:candidate.length,files:files.length,manifestSha256:sha(readFileSync(destination+'/L7_CANDIDATE_MANIFEST.json')),candidateAccepted:false}));
