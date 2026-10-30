// Parent readonly capture of the ONE submitted operation; no authority renewal.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Database} from 'bun:sqlite';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const dir=root+'/operational-preparation-168',out=root+'/operational-168-output';
const cfg=JSON.parse(readFileSync(out+'/native-request.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const pin=p=>{const b=readFileSync(p);return{path:p,byteLength:b.length,sha256:sha(b)};};
const need=(v,m)=>{if(!v)throw Error(m);};
const path=dir+'/milestone-170.json';need(!existsSync(path),'Evidence exists; no overwrite');
const session=JSON.parse(readFileSync(dir+'/native-session-utf8-170.json','utf8')).data;
const messages=JSON.parse(readFileSync(dir+'/native-messages-utf8-170.json','utf8')).data;
need(session.id===cfg.sessionId&&session.agent==='general'&&session.model.providerID==='openai'
  &&session.model.id==='gpt-6.1-sol'&&session.model.variant==='high'&&session.outcome==='succeeded','Native session identity/outcome mismatch');
const reply=messages.filter(m=>m.type==='assistant'&&m.finish==='stop');
need(reply.length===1&&reply[0].model.providerID==='openai'&&reply[0].model.id==='gpt-6.1-sol'&&reply[0].model.variant==='high','Actual assistant identity mismatch');
const texts=reply[0].content.filter(p=>p.type==='text').map(p=>p.text);
need(texts.length===1&&texts[0]==='QUALIFICATION_RMS_REÇUE','Unexpected native response');
need(messages.some(m=>m.type==='user'&&m.id===cfg.messageId),'Admitted user message absent');
const db=new Database(cfg.ownPath,{readonly:true,strict:true});let snapshot;
try{
  const roots=db.query('SELECT root_id,document,digest,revision FROM ff8_graph_native_roots WHERE mission=?').all(cfg.missionId);
  const operations=db.query('SELECT execution_id,session_id,message_id,document,digest,revision,create_claim,prompt_claim FROM ff8_graph_native_operations WHERE mission=?').all(cfg.missionId);
  const bindings=db.query('SELECT binding_id,document,digest FROM ff8_graph_native_bindings WHERE mission=?').all(cfg.missionId);
  for(const r of [...roots,...operations,...bindings])need(sha(Buffer.from(r.document))===r.digest,'Durable document digest mismatch');
  need(roots.length===1&&JSON.parse(roots[0].document).origins.length===1&&operations.length===1
    &&operations[0].create_claim===1&&operations[0].prompt_claim===1,'Origin/operation claims mismatch');
  const resultCount=db.query('SELECT COUNT(*) n FROM ff8_graph_results WHERE mission=?').get(cfg.missionId).n;
  const authors=db.query('SELECT COUNT(*) n FROM ff8_graph_native_authors WHERE mission=?').get(cfg.missionId).n;
  const unit=db.query('SELECT state,revision FROM ff8_graph_units WHERE mission=? AND unit_id=?').get(cfg.missionId,cfg.unitId);
  const controller=db.query('SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?').get(cfg.missionId);
  const events=db.query('SELECT sequence,time,kind,unit_id FROM ff8_events WHERE mission=? ORDER BY sequence').all(cfg.missionId);
  snapshot={roots,operations,bindings,resultCount,nativeAuthorCount:authors,unit,controller,events};
}finally{db.close();}
const refs=['request.json','stage-invocation.json','request-canonical-169.json','stage-invocation-canonical-169.json',
  'request-retained-identity-169.json','stage-retained-identity-169.json','inspect-inputs-169.jsonl','preflight-169.jsonl',
  'authorize-root-169.jsonl','inspect-root-169.jsonl','grant-169.jsonl','inspect-permit-169.jsonl',
  'prepare-169.jsonl','submit-169.jsonl','observe-169.jsonl','observe-terminal-170.jsonl',
  'native-session-170.json','native-messages-170.json','native-session-utf8-170.json','native-messages-utf8-170.json'].map(n=>pin(dir+'/'+n));
const receipt={version:'rms-first-native-operational-milestone-v1',observedAtUtc:new Date().toISOString(),
  status:'ONE_NATIVE_RESPONSE_OBSERVED_NOT_RESULT_RETAINED_OR_MISSION_CLOSED',
  sourceFixtureNonOracle:true,runtimeCommit:'340386a9926f8afafc6dab6fe08f9a237afb2c75',
  missionId:cfg.missionId,sessionId:cfg.sessionId,messageId:cfg.messageId,
  model:reply[0].model,assistantMessageId:reply[0].id,assistantFinish:reply[0].finish,sessionOutcome:session.outcome,
  captureCorrection:'Initial PowerShell GET text capture corrupted accented UTF8 via OEM decoding; kept unchanged as a failed capture. New raw CLI stdout-byte GET captures used, not repaired response text.',
  text:texts[0],toolCallsObserved:reply[0].content.filter(p=>p.type==='tool').length,
  toolEnforcementProven:false,nativeOriginsCommitted:1,maximumOriginsIncludingBootstrap:3,
  nativePromptSubmissions:1,submitProcessDurationMs:3378,
  priorRefusals:{noncanonicalEntry:{stageAttempted:false,durationMs:39},differentHistoricalReference:{stageAttempted:false,durationMs:217},
    finalRequestExpiryUnchangedAcrossCorrections:cfg.expiresAt},
  controllerUnexpiredAtCapture:Date.now()<snapshot.controller.lease_until,invocationUnexpiredAtCapture:Date.now()<cfg.expiresAt,
  refs,snapshot,
  notCompleted:['Native result retention and parent attestation','Durable publication and readback','Replay and next-content projection','D5 end-to-end scenario and final independent review/M2 acceptance'],
  noRetryOrRenewal:'No second prompt, no new origin, no QA ownership adoption; retain identities and durable history'};
const b=Buffer.from(JSON.stringify(receipt,null,2)+'\n');writeFileSync(path,b,{flag:'wx'});
need(readFileSync(path).equals(b),'Capture readback differs');
console.log(JSON.stringify({path,byteLength:b.length,sha256:sha(b),status:receipt.status,model:receipt.model,
  nativeOriginsCommitted:1,createClaims:1,promptClaims:1,resultCount:snapshot.resultCount,nativeAuthorCount:snapshot.nativeAuthorCount,
  unit:snapshot.unit,controllerUnexpiredAtCapture:receipt.controllerUnexpiredAtCapture,invocationUnexpiredAtCapture:receipt.invocationUnexpiredAtCapture}));
