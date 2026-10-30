// LOCAL diagnostic metadata only; no OpenCode import, payload, API or authority.
import {existsSync,lstatSync,realpathSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Database} from 'bun:sqlite';
const path='C:/Users/djden/.local/share/opencode/opencode.db';
const target='ses_rms168_53a8e323ef544e7c8a6db75e5bda50c8';
const out='C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e/evidence/native-session-metadata-174.json';
const need=(v,m)=>{if(!v)throw Error(m);};
const identity=p=>{const s=lstatSync(p);need(s.isFile()&&!s.isSymbolicLink()&&realpathSync(p).toLowerCase()===resolve(p).toLowerCase(),'Regular exact existing database/sidecar required');return{path:p,dev:s.dev,ino:s.ino,size:s.size,mtimeMs:s.mtimeMs};};
need(!existsSync(out),'Receipt exists; no overwrite');
const before=['','-wal','-shm'].map(s=>identity(path+s));
const started=Date.now(),db=new Database(path,{readonly:true,strict:true});let rows,observedAt;
try{
  db.exec('PRAGMA query_only=ON');db.exec('PRAGMA busy_timeout=1000');
  need(db.query('PRAGMA query_only').get().query_only===1,'Connection not query-only');
  for(const [table,required]of [['event_sequence',['aggregate_id','seq']],['event',['aggregate_id','seq','type']]]){
    const columns=db.query('PRAGMA table_info('+table+')').all().map(r=>r.name);
    need(required.every(c=>columns.includes(c)),'Unexpected diagnostic table schema; do not expand inspection');
  }
  rows=db.transaction(()=>{
    observedAt=new Date().toISOString();
    const sequence=db.query('SELECT seq FROM event_sequence WHERE aggregate_id=?').all(target);
    need(sequence.length===1&&sequence[0].seq===12,'Candidate does not match exact session/watermark; no active-path inference');
    const aggregate=db.query('SELECT COUNT(*) AS n,MIN(seq) AS lo,MAX(seq) AS hi FROM event WHERE aggregate_id=?').get(target);
    const types=db.query('SELECT type,COUNT(*) AS n,MIN(seq) AS lo,MAX(seq) AS hi FROM event WHERE aggregate_id=? GROUP BY type ORDER BY lo LIMIT 32').all(target);
    return{sequence,aggregate,types,boundedTypesComplete:types.length<32};
  })();
}finally{db.close();}
const after=['','-wal','-shm'].map(s=>identity(path+s));
need(before.every((b,i)=>b.dev===after[i].dev&&b.ino===after[i].ino),'File identity changed during diagnostic');
const receipt={version:'rms-local-session-event-metadata-diagnostic-v1',status:'READONLY_CANDIDATE_VIEW_MATCHES_SESSION_WATERMARK',
  databaseCandidate:path,activeProcessPathProven:false,sessionId:target,observedAtUtc:observedAt,durationMs:Date.now()-started,
  connection:{reader:'existing Bun SQLite',readonly:true,queryOnly:true,singleReadTransaction:true,walAware:true,immutable:false,
    applicationImported:false,payloadColumnsSelected:false,otherSessionRowsSelected:false,checkpointOrMigration:false},
  before,after,rows,
  interpretation:rows.aggregate.n===0?'Marker12 exists but no event rows are retained in this candidate snapshot. Not proof that historical events never existed.':'Event rows exist in this candidate snapshot; projection/manifest of active server still requires separate explanation.',
  nativeAuthority:false,newPromptCount:0,newOrigins:0,ownRmsModified:false};
writeFileSync(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:receipt.status,observedAtUtc:observedAt,durationMs:receipt.durationMs,rows,activeProcessPathProven:false,receipt:out}));
