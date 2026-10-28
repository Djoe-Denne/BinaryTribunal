import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',base=root+'/.tmp/re-graph-scheduler/review-20261014',destination=base+'/L5_BUDGET_985E_REVIEW';
if(existsSync(destination))throw Error('Immutable review snapshot already exists');
const own='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l5-budget-astra',sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),verification=JSON.parse(readFileSync(phase+'/l5-budget-delivery-parent-verification.json','utf8'));
if(verification.sourceRootPinsExact!==2||verification.allInputPinsExact!==487||verification.otherRootPinsExact!==306)throw Error('Parent verification incomplete');
const manifest=JSON.parse(readFileSync(own+'/.tmp/L5_ADMISSION_BUDGET/FROZEN_MANIFEST.json','utf8')),head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();if(!head.startsWith('94203d3'))throw Error('Unexpected accepted HEAD');
const tree=spawnSync('git',['ls-tree','-r','--name-only',head,'--','tools/ff8-harness/src','tools/ff8-harness/test','tools/ff8-harness/schemas','tools/ff8-harness/scripts','tools/ff8-harness/package.json','tools/ff8-harness/bun.lock','tools/ff8-harness/tsconfig.json','docs/missions/re-graph-scheduler'],{cwd:root,encoding:'utf8'});if(tree.status!==0)throw Error('No accepted source inventory');
const entries=new Map<string,{bytes:Buffer,kind:string,origin:string}>();function add(path:string,b:Buffer,kind:string,origin:string,overlay=false){if(entries.has(path)&&!overlay)throw Error('Duplicate input '+path);if(b.length>8*1024*1024)throw Error('Per-file limit');entries.set(path,{bytes:b,kind,origin});}
for(const path of tree.stdout.trim().split(/\r?\n/)){const b=spawnSync('git',['show',head+':'+path],{cwd:root,maxBuffer:12*1024*1024});if(b.status!==0)throw Error('No committed bytes '+path);const kind=path.includes('/src/')||path.includes('/scripts/')?'source':path.includes('/test/')?'test':path.includes('/contract/')||path.includes('/schemas/')?'rule':'knowledge';add(path,b.stdout,kind,'accepted committed main '+head);if(path.startsWith('tools/ff8-harness/src/')||path.startsWith('tools/ff8-harness/schemas/'))add('OLD/'+path,b.stdout,kind,'old accepted planner/deps/schema byte reference only');}
const req=JSON.parse(readFileSync(phase+'/l5-budget-preparation-request.json','utf8'));
for(const p of req.files.filter((p:any)=>p.path.startsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/')||p.path.startsWith('docs/tech/investigation/')||p.path.startsWith('docs/missions/ff8-decomp-semantics-2026-10-11-run01/'))){const b=readFileSync(req.sourceRoot+'/'+p.path);if(sha(b)!==p.sha256)throw Error('Accepted raw/ref drift');add(p.path,b,p.kind,'original accepted reference/native fixtures, not new extraction');}
for(const p of manifest.sources){const b=readFileSync(own+'/'+p.path);if(b.length!==p.bytes||sha(b)!==p.sha256)throw Error('Candidate source drift');add(p.path,b,p.path.includes('/src/')?'source':'test','UNACCEPTED budget candidate 985e, frozen',true);}
const dbIndex:any[]=[];for(const [i,db]of manifest.retainedFixtureDatabases.entries()){const b=readFileSync(db.path);if(b.length!==db.bytes||sha(b)!==db.sha256)throw Error('Author fixture DB drift');const path='ARTIFACTS/sqlite-'+i+'.db';add(path,b,'native','retained AUTHOR fixture SQLite, NOT native authority or oracle');dbIndex.push({...db,preparedPath:path});}
add('PARENT/SQLITE_INDEX.json',Buffer.from(JSON.stringify({databases:dbIndex},null,2)+'\n'),'manifest','parent artifact mapping');
const oldFixture=own+'/inputs/L5_BUDGET_FIX_13874bc/REFERENCE_L8/.tmp/L8_BUDGET_EVIDENCE/';for(const p of ['snapshot.json','groups.json','policy.json'])add('LEGACY_EXAMPLE/'+p,readFileSync(oldFixture+p),'test','one synthetic old accepted L5 input, no runtime authority');
add('LEGACY_EXAMPLE/planning.json',Buffer.from(JSON.stringify(JSON.parse(readFileSync(oldFixture+'prepared.json','utf8')).planning,null,2)+'\n'),'test','one old accepted full planning, parent replay byte-exact');
for(const [path,from,kind]of [
 ['PARENT/SCOPE.md',root+'/docs/missions/re-graph-scheduler/L5_ADMISSION_BUDGET_REVIEW_SCOPE_20261015.md','rule'],
 ['PARENT/PLAN_GO.md',root+'/docs/missions/re-graph-scheduler/L5_ADMISSION_BUDGET_PLAN_GO_20261015.md','rule'],
 ['PARENT/USER_GO.md',root+'/docs/missions/re-graph-scheduler/L5_ADMISSION_BUDGET_TARGETED_GO_20261015.md','rule'],
 ['PARENT/CLARIFICATIONS.md',root+'/docs/missions/re-graph-scheduler/L5_BUDGET_VERSION_AND_TEST_CLEANUP_20261015.md','rule'],
 ['PARENT/PARENT_VERIFICATION.json',phase+'/l5-budget-delivery-parent-verification.json','manifest']
 ] as const)add(path,readFileSync(from),kind,'parent scope/ratification/integrity, not reviewer verdict');
const notes={purpose:'Fresh independent full L5 module review with new-allocation and shared-legacy emphasis, not integration',acceptedHead:head,sourceCandidate:verification.sources[0].sha256,oldSource:'37723edf3e365be178bfce2db18e316f9e38efc4e41fbfe16f321760ffecd8b3',authorFullGateNotReviewerProof:true,authorGateLogsAndVerdictReportNotTransferred:true,L8SourceNotIncludedOrAccepted:true,L8DurableNAndCodecContextStillPending:true,ledger8943882BytesNotTransferred:true,focus143OnlyNoFullQaOrNativeDefault:true,SQLitesAreRetainedFixturesNotPrivateOrScientificEvidence:true,sourceWritesForbidden:true};
add('PARENT/NOTES.json',Buffer.from(JSON.stringify(notes,null,2)+'\n'),'manifest','parent boundaries');
if(entries.size+1>512)throw Error('Input count exceeds512: '+entries.size);
const files=[...entries].map(([path,v])=>({path,sha256:sha(v.bytes),kind:v.kind,origin:v.origin}));add('REVIEW_INPUT_MANIFEST.json',Buffer.from(JSON.stringify({...notes,files},null,2)+'\n'),'manifest','parent pins');
for(const [path,v]of entries){mkdirSync(dirname(destination+'/'+path),{recursive:true});writeFileSync(destination+'/'+path,v.bytes,{flag:'wx'});}
const result={destination,files:entries.size,bytes:[...entries.values()].reduce((n,v)=>n+v.bytes.length,0),manifestSha256:sha(readFileSync(destination+'/REVIEW_INPUT_MANIFEST.json')),acceptedHead:head,candidate:notes.sourceCandidate,old:notes.oldSource,authorSqliteArtifacts:dbIndex.length,notAccepted:true};
writeFileSync(phase+'/l5-budget-review-freeze.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
