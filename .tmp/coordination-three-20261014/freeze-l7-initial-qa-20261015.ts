import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',base=root+'/.tmp/re-graph-scheduler/review-20261014',destination=base+'/L7QA_INITIAL_E03';
if(existsSync(destination))throw Error('Frozen QA input already exists');
const owned='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-interop-r1',sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const deliveryBytes=readFileSync(owned+'/.tmp/L7_INITIAL_DELIVERY/manifest.json');if(sha(deliveryBytes)!=='b3e4286054ecebef6f6c28faaa4b634d0095eabb22b348845ed741d27988f3c7')throw Error('Delivery manifest drift');
const delivery=JSON.parse(deliveryBytes.toString('utf8')),files:{path:string,sha256:string,kind:string,origin:string}[]=[];
function add(path:string,bytes:Buffer,kind:string,origin:string){if(bytes.length>8*1024*1024)throw Error('Per-file input budget exceeded');mkdirSync(dirname(destination+'/'+path),{recursive:true});writeFileSync(destination+'/'+path,bytes,{flag:'wx'});files.push({path,sha256:sha(bytes),kind,origin});}
const baseline=JSON.parse(readFileSync(phase+'/l7-interop-r1-baseline-preparation-result.json','utf8'));
for(const p of baseline.files){const b=readFileSync(base+'/MAIN_e03e063_OFFLINE/'+p.path);if(sha(b)!==p.sha256)throw Error('Baseline input drift');if(p.path.startsWith('tools/ff8-harness/')&&sha(readFileSync(owned+'/'+p.path))!==p.sha256)throw Error('Readonly harness source changed');add(p.path,b,p.kind,'accepted e03 baseline');}
for(const f of delivery.frozenSources.files){const b=readFileSync(owned+'/'+f.path);if(sha(b)!==f.sha256)throw Error('QA delivery changed');add(f.path,b,'test','new L7 initial QA, not accepted');}
const aggregate=sha([...delivery.frozenSources.files].map((f:any)=>f.path+':'+f.sha256).sort().join('|'));if(aggregate!==delivery.frozenSources.sha256Aggregate)throw Error('QA aggregate mismatch');
add('PARENT/DELIVERY_MANIFEST.json',deliveryBytes,'manifest','author provenance, not verdict');
const dbIndex:any[]=[];let bytes=0;
for(const [i,db]of delivery.lastFullSQLiteEvidence.databases.entries()){
 if(!db.path.startsWith('C:/Users/djden/AppData/Local/Temp/opencode/graph-interop-')||!db.path.endsWith('/own.sqlite'))throw Error('Out-of-scope DB');
 const b=readFileSync(db.path);if(b.length!==db.bytes||sha(b)!==db.sha256)throw Error('SQLite artefact drift');const path='ARTIFACTS/sqlite-'+String(i).padStart(2,'0')+'.sqlite';add(path,b,'native','author own SQLite fixture, not oracle');dbIndex.push({...db,preparedPath:path});bytes+=b.length;
}
add('PARENT/SQLITE_INDEX.json',Buffer.from(JSON.stringify({files:dbIndex.length,totalBytes:bytes,databases:dbIndex},null,2)+'\n'),'manifest','parent read-only hash verification');
for(const [path,from,kind]of [
 ['PARENT/REVIEW_SCOPE.md',root+'/docs/missions/re-graph-scheduler/L7_INITIAL_QA_REVIEW_SCOPE_20261015.md','rule'],
 ['PARENT/BRIDGES_DECISION.md',root+'/docs/missions/re-graph-scheduler/L1_BRIDGES_RARE_INCOMPATIBILITY_20261015.md','rule'],
 ['PARENT/BRIDGES_PARENT_REPRO.json',phase+'/bridges-rare-parent-arbitration.json','manifest'],
 ['PARENT/PARENT_GATES.json',phase+'/l7-initial-parent-gates.json','manifest']
 ] as const)add(path,readFileSync(from),kind,'parent scope/evidence, not reviewer verdict');
const notes={purpose:'Fresh independent initial L7 QA review; not integration or post-L8 closure',sourceAuthor:owned,sourceAggregate:aggregate,maintenanceNotInHead:true,historicalSimulatorNotIncluded:true,ledgerNotTransferred:'Tracked immutable 8943882-byte ledger is separately verified in the reviewer checkout; never counted as helper-transferred',reviewSourceWritesForbidden:true,generatedOwnSqliteFixturesAllowedWithRetention:true,files};
add('QA_INPUT_MANIFEST.json',Buffer.from(JSON.stringify(notes,null,2)+'\n'),'manifest','parent frozen input pins');
if(files.length>512)throw Error('Too many explicit inputs');console.log(JSON.stringify({destination,files:files.length,bytes:files.reduce((n,f)=>n+readFileSync(destination+'/'+f.path).length,0),QAaggregate:aggregate,authorSqliteFiles:dbIndex.length,manifestSha256:sha(readFileSync(destination+'/QA_INPUT_MANIFEST.json')),accepted:false}));
