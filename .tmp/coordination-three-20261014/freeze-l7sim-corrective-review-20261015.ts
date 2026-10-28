import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',base=root+'/.tmp/re-graph-scheduler/review-20261014',destination=base+'/L7SIM_CORRECTIVE_AC82_V2';
if(existsSync(destination))throw Error('Immutable review snapshot exists');
const own='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-simulator-fix-max',authorDir=own+'/.tmp/l7sim-fix-20261015',sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const verification=JSON.parse(readFileSync(phase+'/l7sim-corrective-parent-verification.json','utf8'));if(verification.candidateRootAndFrozenFilesExact!==7||verification.originalInputPinsExact!==417||!verification.helperMechanicalInverseExact)throw Error('Parent verification missing');
const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();if(!head.startsWith('c5fcd00'))throw Error('Unexpected accepted main HEAD');
const tree=spawnSync('git',['ls-tree','-r','--name-only',head,'--','tools/ff8-harness/src','tools/ff8-harness/test','tools/ff8-harness/schemas','tools/ff8-harness/scripts','tools/ff8-harness/package.json','tools/ff8-harness/bun.lock','tools/ff8-harness/tsconfig.json','docs/missions/re-graph-scheduler'],{cwd:root,encoding:'utf8'});if(tree.status!==0)throw Error('HEAD inventory unavailable');
const entries=new Map<string,{bytes:Buffer,kind:string,origin:string}>();
function add(path:string,b:Buffer,kind:string,origin:string,overlay=false){if(entries.has(path)&&!overlay)throw Error('Input path collision');if(b.length>8*1024*1024)throw Error('Per-file limit');entries.set(path,{bytes:b,kind,origin});}
for(const path of tree.stdout.trim().split(/\r?\n/)){const b=spawnSync('git',['show',head+':'+path],{cwd:root,maxBuffer:12*1024*1024});if(b.status!==0)throw Error('Committed source unavailable');add(path,b.stdout,path.includes('/src/')?'source':path.includes('/test/')?'test':path.includes('/contract/')||path.includes('/schemas/')?'rule':'knowledge','accepted committed main '+head);}
const origRoot=base+'/L7SIM_CURRENT_BASELINE',original=JSON.parse(readFileSync(origRoot+'/L7_CANDIDATE_MANIFEST.json','utf8'));
for(const p of original.files.filter((p:any)=>p.origin.startsWith('historical L7')||p.kind==='native'||p.path.endsWith('/native/TRANSFER_MANIFEST.json'))){if(p.path.includes('/verification-'))continue;const b=readFileSync(origRoot+'/'+p.path);if(sha(b)!==p.sha256)throw Error('Historical original/raw drift');add(p.path,b,p.kind,p.origin);if(p.origin.startsWith('historical L7')&&p.path.endsWith('.ts'))add('OLD/'+p.path,b,p.kind,'original dcaa source/test reference only');}
const candidate=JSON.parse(readFileSync(authorDir+'/FINAL_CANDIDATE.json','utf8'));
for(const p of candidate.frozenFiles){const b=readFileSync(authorDir+'/FROZEN/'+p.path);if(sha(b)!==p.sha256||b.length!==p.bytes)throw Error('Candidate frozen bytes drift');add(p.path,b,p.path.includes('/src/')?'source':p.path.endsWith('.ts')?'test':'knowledge','UNACCEPTED corrective candidate ac82, frozen',true);}
for(const [path,from,kind]of [
 ['PARENT/SCOPE.md',root+'/docs/missions/re-graph-scheduler/L7_SIMULATOR_CORRECTIVE_REVIEW_SCOPE_20261015.md','rule'],
 ['PARENT/PLAN_GO.md',root+'/docs/missions/re-graph-scheduler/L7_SIMULATOR_CORRECTIVE_PLAN_GO_20261015.md','rule'],
 ['PARENT/INITIAL_DEFECTS.md',root+'/docs/missions/re-graph-scheduler/L7_SIMULATOR_BLOCK_AND_FIX_CONTRACT_20261015.md','rule'],
 ['PARENT/PARENT_VERIFICATION.json',phase+'/l7sim-corrective-parent-verification.json','manifest']
 ] as const)add(path,readFileSync(from),kind,'parent scope/provenance, not reviewer verdict');
const notes={purpose:'Fresh independent corrective simulator review only; no main integration/native authority',acceptedHead:head,candidateSha256:verification.candidateSha256,originSha256:'dcaa4ace0ead545469d0390921265b615b0eb6da743f0b7695e7c58219177df4',freezeRevision:2,priorIncompleteGelPreserved:'L7SIM_CORRECTIVE_AC82 omitted tracked scripts required by full typecheck. Parent TS2307 pre-gate preserved; no source defect inferred and no reviewer was admitted.',trackedScriptsNowIncluded:true,authorFinalReportNotTransferred:true,authorFinalManifestAndGateLogsNotTransferred:true,oldAuthorVerificationReportsNotTransferred:true,oldReferenceOnlyCode:true,rawJsonlIsDataNeverOracle:true,ledger8943882BytesNotTransferred:true,focusOld35PlusNew19:true,noFullQa60OrNativeClaimWithoutSeparateInputs:true,preinstalledDepsMountParentOnly:true,sourceWritesForbidden:true};
add('PARENT/NOTES.json',Buffer.from(JSON.stringify(notes,null,2)+'\n'),'manifest','parent review boundaries');
if(entries.size+1>512)throw Error('Too many explicit inputs');
const files=[...entries].map(([path,v])=>({path,sha256:sha(v.bytes),kind:v.kind,origin:v.origin}));
add('REVIEW_INPUT_MANIFEST.json',Buffer.from(JSON.stringify({...notes,files},null,2)+'\n'),'manifest','parent pins');
for(const [path,v]of entries){mkdirSync(dirname(destination+'/'+path),{recursive:true});writeFileSync(destination+'/'+path,v.bytes,{flag:'wx'});}
const result={destination,files:entries.size,bytes:[...entries.values()].reduce((n,v)=>n+v.bytes.length,0),manifestSha256:sha(readFileSync(destination+'/REVIEW_INPUT_MANIFEST.json')),candidate:verification.candidateSha256,acceptedHead:head,notAccepted:true};
writeFileSync(phase+'/l7sim-corrective-review-freeze-v2.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
