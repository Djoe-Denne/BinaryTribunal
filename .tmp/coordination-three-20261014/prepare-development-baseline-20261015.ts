import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',sourceRoot=root+'/.tmp/re-graph-scheduler/review-20261014/MAIN_e03e063_OFFLINE';
if(existsSync(sourceRoot))throw Error('Frozen baseline exists; never overwrite');
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const admissions=['l8-integration-r1','l7-interop-r1'].map(n=>JSON.parse(readFileSync(phase+'/'+n+'-admission-post.json','utf8')));
const names=spawnSync('git',['ls-tree','-r','--name-only','e03e063','--','tools/ff8-harness/src','tools/ff8-harness/schemas','tools/ff8-harness/test','tools/ff8-harness/scripts','tools/ff8-harness/package.json','tools/ff8-harness/bun.lock','tools/ff8-harness/tsconfig.json','docs/missions/re-graph-scheduler'],{cwd:root,encoding:'utf8'});
if(names.status!==0)throw Error('No exact committed input list');const selected=names.stdout.trim().split(/\r?\n/);
const refs=['docs/tech/investigation/battle-static-discovery/battle-indirect-registry.json','docs/tech/investigation/battle-static-discovery/magic-registry.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-pe-verification.json'];
const files:{path:string,sha256:string,kind:string}[]=[];
function freeze(path:string,bytes:Buffer,kind:string){if(bytes.length>8*1024*1024)throw Error('Input file exceeds helper limit');mkdirSync(dirname(sourceRoot+'/'+path),{recursive:true});writeFileSync(sourceRoot+'/'+path,bytes,{flag:'wx'});files.push({path,sha256:sha(bytes),kind});}
for(const p of [...selected,...refs].sort()){
 const bytes=readFileSync(admissions[0].owned+'/'+p);
 for(const a of admissions)if(sha(readFileSync(a.owned+'/'+p))!==sha(bytes))throw Error('Owned HEAD projection differs '+p);
 freeze(p,bytes,p.includes('/src/')||p.includes('/scripts/')?'source':p.includes('/test/')?'test':p.includes('/contract/')||p.includes('/schemas/')?'rule':'knowledge');
}
for(const tranche of ['L2L3','L4L5'])for(const p of JSON.parse(readFileSync(phase+'/main-transfer-'+tranche+'/readback.json','utf8')).files){const expected=p.path==='tools/ff8-harness/test/cluster.test.ts'?'c05297dfb5a84a9974cbbb50629b8cba267c3fc6124f3d0a13e14b2f40daebb2':p.sha256;for(const a of admissions)if(sha(readFileSync(a.owned+'/'+p.path))!==expected)throw Error('Accepted module pin differs '+a.name+'/'+p.path);}
const nativeRel='.tmp/ff8-decomp-semantics-20261011-r01/native',nativeSource=root+'/.tmp/re-graph-scheduler/review-20261014/L2IDSV5/'+nativeRel;
const manifestBytes=readFileSync(nativeSource+'/TRANSFER_MANIFEST.json');if(sha(manifestBytes)!=='79790bef2ea8c38d64ab8e18c4578e1b8593958aa689da88c2466063c5b177d5')throw Error('Not original manifest');
const raw=JSON.parse(manifestBytes.toString('utf8').replace(/^\uFEFF/,''));if(raw.files!==98||raw.entries.length!==98)throw Error('Wrong native count');
for(const line of raw.entries){const [name,,digest]=line.split(' ');if(!/^0x[0-9A-F]+\.json$/.test(name))throw Error('Unsafe original filename');const bytes=readFileSync(nativeSource+'/'+name);if(sha(bytes)!==digest)throw Error('Raw source pin');freeze(nativeRel+'/'+name,bytes,'native');}
freeze(nativeRel+'/TRANSFER_MANIFEST.json',manifestBytes,'manifest');
const ledger='docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json',ledgerSha='b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4';
for(const a of admissions)if(sha(readFileSync(a.owned+'/'+ledger))!==ledgerSha)throw Error('Preexisting tracked oversized ledger mismatch');
const note={purpose:'Frozen development baseline only; not worker access or scientific/native authority',head:'e03e0638d2fc570c5f8303716e03ab8b7060739c',phaseGo:'L7_L8_DEVELOPMENT_GO_20261015.md',originalRaw98:true,preexistingTrackedDependencyNotTransferred:{path:ledger,sha256:ledgerSha,reason:'8943882 bytes exceeds 8 MiB helper limit; already exists hash-exact in BOTH native-owned HEAD checkouts, not inferred as transferred'},uncommittedMainMaintenanceNotIncluded:true,main818CountNotClaimedForFreshHead:true};
freeze('BASELINE_NOTES.json',Buffer.from(JSON.stringify(note,null,2)+'\n'),'manifest');
const manifest={...note,files};freeze('BASELINE_MANIFEST.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'),'manifest');
if(files.length>512)throw Error('Too many explicit files');
for(const a of admissions){const req={schemaVersion:1,missionId:'team_mv6tmopg_0000_4urn3c',taskId:a.name==='l8-integration-r1'?'task_mv6towrm_000c_24005n':'task_mv71y0s6_004q_ksbii0',cycle:1,role:'implementer',blind:false,sourceRoot,targetSessionId:a.sessionID,destinationRoot:a.owned+'/inputs/MAIN_e03e063_OFFLINE',files};writeFileSync(phase+'/'+a.name+'-baseline-preparation-request.json',JSON.stringify(req,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({files:files.length,bytes:files.reduce((n,f)=>n+readFileSync(sourceRoot+'/'+f.path).length,0),head:note.head,acceptedModulePinsVerifiedBoth:12,rawFiles:99,oversizedLedgerAlreadyExactBoth:true,sourceRoot}));
