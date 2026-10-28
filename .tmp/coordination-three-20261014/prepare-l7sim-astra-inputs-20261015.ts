import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',base=root+'/.tmp/re-graph-scheduler/review-20261014',sourceRoot=base+'/L7SIM_ASTRA_FBCA7D9';
if(existsSync(sourceRoot))throw Error('Immutable input snapshot exists');
const a=JSON.parse(readFileSync(phase+'/l7sim-astra-admission-post.json','utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const dirty=spawnSync('git',['diff','--name-only'],{cwd:a.owned,encoding:'utf8'});if(dirty.status!==0||dirty.stdout.trim())throw Error('Fresh OWN tracked files changed before access');
const tree=spawnSync('git',['ls-tree','-r','--name-only',a.head,'--','tools/ff8-harness/src','tools/ff8-harness/test','tools/ff8-harness/schemas','tools/ff8-harness/scripts','tools/ff8-harness/package.json','tools/ff8-harness/bun.lock','tools/ff8-harness/tsconfig.json','docs/missions/re-graph-scheduler'],{cwd:root,encoding:'utf8'});if(tree.status!==0)throw Error('No committed inventory');
const entries=new Map<string,{bytes:Buffer,kind:string,origin:string}>();
function add(path:string,b:Buffer,kind:string,origin:string){if(entries.has(path))throw Error('Duplicate projection path '+path);if(b.length>8*1024*1024)throw Error('Per-file input limit');entries.set(path,{bytes:b,kind,origin});}
const refs=['docs/tech/investigation/battle-static-discovery/battle-indirect-registry.json','docs/tech/investigation/battle-static-discovery/magic-registry.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-pe-verification.json'];
for(const path of [...tree.stdout.trim().split(/\r?\n/),...refs])add(path,readFileSync(a.owned+'/'+path),path.includes('/src/')||path.includes('/scripts/')?'source':path.includes('/test/')?'test':path.includes('/contract/')||path.includes('/schemas/')?'rule':'knowledge','accepted OWN HEAD '+a.head);
const reviewRoot=base+'/L7SIM_CORRECTIVE_AC82_V2',m=JSON.parse(readFileSync(reviewRoot+'/REVIEW_INPUT_MANIFEST.json','utf8'));
for(const p of m.files.filter((p:any)=>p.origin.startsWith('UNACCEPTED corrective candidate')||p.origin.startsWith('historical L7')||p.path.startsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/')||p.path.startsWith('OLD/'))){const b=readFileSync(reviewRoot+'/'+p.path);if(sha(b)!==p.sha256)throw Error('ac82/OLD/raw source drift');add(p.path,b,p.kind,p.path.startsWith('OLD/')?'original dcaa OLD reference only':p.path.startsWith('.tmp/')?'original raw98+manifest, no extraction':'unaccepted ac82 corrective simulator candidate, explicit ROOT projection');}
for(const [path,from,kind]of [
 ['PARENT/SCOPE.md',root+'/docs/missions/re-graph-scheduler/L7_SIMULATOR_AC82_BLOCK_AND_LAST_RESORT_20261015.md','rule'],
 ['PARENT/PREVIOUS_PLAN_GO.md',root+'/docs/missions/re-graph-scheduler/L7_SIMULATOR_CORRECTIVE_PLAN_GO_20261015.md','rule'],
 ['PARENT/FINAL_REVIEW_REPORTS.json',phase+'/l7sim-ac82-final-review-public-reports.json','proposal'],
 ['PARENT/PARENT_REPRO_CASES.json',phase+'/l7sim-ac82-parent-repros.json','manifest'],
 ['PARENT/REPRO_REFERENCE.txt',phase+'/probe-l7sim-ac82-review-parent-20261015.ts','knowledge']
 ] as const)add(path,readFileSync(from),kind,'parent scope/explicit completed report/probes, not native authority');
const ledger='docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json';if(sha(readFileSync(a.owned+'/'+ledger))!=='b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4')throw Error('Existing tracked ledger differs');
const notes={purpose:'Last-resort fresh Astra max simulator correction after source/review Sol max BLOCK; plan before code',task:a.taskId,session:a.sessionID,model:a.model,head:a.head,candidate:'ac82e53ab62943dab81d9aa0ad634443f0af28ef06d60ad8d559c00a1b43fb3a',original:'dcaa4ace0ead545469d0390921265b615b0eb6da743f0b7695e7c58219177df4',L5AcceptedOldSourceOnly:'Parallel L5 budget correction is unaccepted and NOT in this package; do not touch or rely on its worktree',rawOriginal:true,ledger8943882BytesNotTransferredButExistingTrackedVerified:true,mainUncommittedMaintenanceNotIncluded:true,archivalReference:'REPRO_REFERENCE.txt refers to parent paths/imports and writes; DO NOT run unchanged or follow paths. Re-derive OWN pure in-memory probes from received data/code.',reproDataUsage:'PARENT_REPRO_CASES scenarios include real snapshots/policies/exports and traces. P1-new-key-unheld duration entries must be restored as Map before SimEngine; other scenario durations are plain objects. Reports/traces are counterexamples to verify, not independent native authority.',readonlyDependencies:'Parent mounts OWN/tools/ff8-harness/node_modules after lock/deps check. No OWN-root node_modules is promised; never install or read parent repository sources.',sourceCodeApprovalPending:true};
add('PARENT/NOTES.json',Buffer.from(JSON.stringify(notes,null,2)+'\n'),'manifest','parent boundaries');
if(entries.size+1>512)throw Error('Explicit input count exceeds512: '+entries.size);
const files=[...entries].map(([path,v])=>({path,sha256:sha(v.bytes),kind:v.kind,origin:v.origin}));
add('INPUT_MANIFEST.json',Buffer.from(JSON.stringify({...notes,files},null,2)+'\n'),'manifest','parent pins');
for(const [path,v]of entries){mkdirSync(dirname(sourceRoot+'/'+path),{recursive:true});writeFileSync(sourceRoot+'/'+path,v.bytes,{flag:'wx'});}
const request={schemaVersion:1,missionId:'team_mv6tmopg_0000_4urn3c',taskId:a.taskId,cycle:1,role:'implementer',blind:false,sourceRoot,targetSessionId:a.sessionID,destinationRoot:a.owned+'/inputs/L7SIM_ASTRA_FBCA7D9',files:[...entries].map(([path,v])=>({path,sha256:sha(v.bytes),kind:v.kind}))};
writeFileSync(phase+'/l7sim-astra-preparation-request.json',JSON.stringify(request,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({files:entries.size,bytes:[...entries.values()].reduce((n,v)=>n+v.bytes.length,0),sourceRoot,destination:request.destinationRoot,model:a.model,codeApprovalPending:true}));
