import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',base=root+'/.tmp/re-graph-scheduler/review-20261014',sourceRoot=base+'/L5_BUDGET_FIX_13874bc';
if(existsSync(sourceRoot))throw Error('Immutable inputs already exist');
const admission=JSON.parse(readFileSync(phase+'/l5-budget-admission-post.json','utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const tree=spawnSync('git',['ls-tree','-r','--name-only',admission.head,'--','tools/ff8-harness/src','tools/ff8-harness/schemas','tools/ff8-harness/test','tools/ff8-harness/scripts','tools/ff8-harness/package.json','tools/ff8-harness/bun.lock','tools/ff8-harness/tsconfig.json','docs/missions/re-graph-scheduler'],{cwd:root,encoding:'utf8'});if(tree.status!==0)throw Error('No owned tree');
const entries=new Map<string,{bytes:Buffer,kind:string,origin:string}>();
function stage(path:string,bytes:Buffer,kind:string,origin:string){if(entries.has(path))throw Error('Duplicate input path');if(bytes.length>8*1024*1024)throw Error('Per-file transfer bound');entries.set(path,{bytes,kind,origin});}
const refs=['docs/tech/investigation/battle-static-discovery/battle-indirect-registry.json','docs/tech/investigation/battle-static-discovery/magic-registry.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-pe-verification.json'];
for(const path of [...tree.stdout.trim().split(/\r?\n/),...refs].sort())stage(path,readFileSync(admission.owned+'/'+path),path.includes('/src/')||path.includes('/scripts/')?'source':path.includes('/test/')?'test':path.includes('/schemas/')||path.includes('/contract/')?'rule':'knowledge','owned committed HEAD '+admission.head);
const old=JSON.parse(readFileSync(phase+'/l8-integration-r1-baseline-preparation-result.json','utf8'));
for(const p of old.files.filter((p:any)=>p.path.startsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/'))){const b=readFileSync(base+'/MAIN_e03e063_OFFLINE/'+p.path);if(sha(b)!==p.sha256)throw Error('Original raw drift');stage(p.path,b,p.kind,'original accepted raw98 and manifest, no new extraction');}
const referenceRoot=base+'/L8_BUDGET_BOUNDARY_EVIDENCE',reference=JSON.parse(readFileSync(referenceRoot+'/BUDGET_INPUT_MANIFEST.json','utf8'));
for(const p of reference.files.filter((p:any)=>p.path.startsWith('tools/ff8-harness/src/')||p.path.startsWith('tools/ff8-harness/schemas/')||p.path.startsWith('.tmp/L8_BUDGET_EVIDENCE/'))){const b=readFileSync(referenceRoot+'/'+p.path);if(sha(b)!==p.sha256)throw Error('Frozen L8 reference drift');stage('REFERENCE_L8/'+p.path,b,p.kind,'frozen UNACCEPTED L8 reproduction reference; never project into ROOT');}
for(const [path,from,kind]of [
 ['PARENT/SCOPE.md',root+'/docs/missions/re-graph-scheduler/L5_ADMISSION_BUDGET_TARGETED_GO_20261015.md','rule'],
 ['PARENT/ARCHITECTURE_DECISION.md',root+'/docs/missions/re-graph-scheduler/L8_BUDGET_PARENT_DECISION_AND_ROUTING_20261015.md','rule'],
 ['PARENT/ADVISORY_REPORTS.json',phase+'/l8-budget-boundary-final-public-reports.json','proposal'],
 ['PARENT/PARENT_GROWTH.json',phase+'/l8-budget-growth-parent.json','manifest'],
 ['PARENT/PARENT_GROWTH_REFERENCE.txt',phase+'/probe-l8-budget-growth-parent-20261015.ts','knowledge']
 ] as const)stage(path,readFileSync(from),kind,'parent decision/evidence; not final API or scientific proof');
const ledger='docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json';if(sha(readFileSync(admission.owned+'/'+ledger))!=='b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4')throw Error('Tracked existing ledger drift');
const notes={purpose:'Targeted SAME Astra max exception, fresh L5 correction, ANALYSIS/PLAN before any code',sourceEffort:'Astra max',correctorEffort:'Astra max by explicit user exception',task:admission.taskId,ownedHead:admission.head,rootL5L6AcceptedAndL8Absent:true,referenceL8:'UNACCEPTED frozen candidate; pure repro may run inside REFERENCE_L8, no ROOT copy/edit/DB. Its timestamps/paths are synthetic fixture data, not tool permissions to outside files.',archivalParentProbe:'PARENT_GROWTH_REFERENCE.txt is non-executable archival text. It refers to parent paths; derive OWN probes instead, do not run or follow those paths.',oversizedLedger:'8943882 bytes, already tracked and hash-verified separately, not transferred',noMainUncommittedMaintenanceInBaseline:true,readonlyDependencyJunction:'Allowed only after explicit parent confirmation; no install or source-parent access',codeApprovalPending:true};
stage('PARENT/NOTES.json',Buffer.from(JSON.stringify(notes,null,2)+'\n'),'manifest','parent input boundaries');
if(entries.size+1>512)throw Error('Input count exceeds512: '+entries.size);
const files=[...entries].map(([path,v])=>({path,sha256:sha(v.bytes),kind:v.kind,origin:v.origin}));
stage('INPUT_MANIFEST.json',Buffer.from(JSON.stringify({...notes,files},null,2)+'\n'),'manifest','parent pins');
for(const [path,v]of entries){mkdirSync(dirname(sourceRoot+'/'+path),{recursive:true});writeFileSync(sourceRoot+'/'+path,v.bytes,{flag:'wx'});}
const request={schemaVersion:1,missionId:'team_mv6tmopg_0000_4urn3c',taskId:admission.taskId,cycle:1,role:'implementer',blind:false,sourceRoot,targetSessionId:admission.sessionID,destinationRoot:admission.owned+'/inputs/L5_BUDGET_FIX_13874bc',files:[...entries].map(([path,v])=>({path,sha256:sha(v.bytes),kind:v.kind}))};
writeFileSync(phase+'/l5-budget-preparation-request.json',JSON.stringify(request,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:entries.size,bytes:[...entries.values()].reduce((n,v)=>n+v.bytes.length,0),sourceRoot,destination:request.destinationRoot,sourceModel:admission.model,rootPlannerSha256:sha(readFileSync(admission.owned+'/tools/ff8-harness/src/planner.ts'))}));
