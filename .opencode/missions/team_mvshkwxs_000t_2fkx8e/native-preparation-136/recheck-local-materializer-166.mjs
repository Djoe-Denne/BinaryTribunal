// Verify EXISTING QA166 artifacts only. Never recreates or renews its stage.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { Database } from 'bun:sqlite';
const repo='C:/Users/djden/source/repos/retro-eng/re-ff8';
const root=join(repo,'.opencode/missions/team_mvshkwxs_000t_2fkx8e');
const driver=join(root,'qa-local-materializer-166'),out=join(root,'qa-local-materializer-166-output');
const own=join(root,'qa-local-materializer-166-own/qa-own.sqlite');
const recheck=join(root,'qa-local-materializer-166-recheck');
const runtime='C:/Users/djden/.local/share/opencode/worktree/68ae5f/rms-native-address-bridge-160';
const modules=join(runtime,'.opencode/missions/team_mvshkwxs_000t_2fkx8e/preparation-candidates');
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,why)=>{if(!ok)throw new Error(why);};
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const pin=p=>{const b=readFileSync(p);return{path:p,byteLength:b.length,sha256:sha(b)};};
const started=Date.now();
try{
  need(!existsSync(recheck),'Recheck namespace exists; no overwrite');
  need(existsSync(own)&&existsSync(out),'Existing QA state required; never create a stage');
  const priorFailure=pin(join(driver,'failure.json')),failed=json(priorFailure.path),result=json(join(driver,'result.json'));
  need(failed.status==='LOCAL_QA_FAILED_PRESERVE_ALL_STATE'&&failed.error==='Session restrictions changed'
    &&failed.cases.length===5&&failed.cases.slice(0,4).every(c=>c.pass===true)&&failed.cases[4].pass===false,'Unexpected initial failure; no recovery assertion');
  const request=json(join(driver,'request.json'));
  need(request.purpose==='qa-nonadoptable'&&result.status==='QA_NONADOPTABLE_LOCAL_INPUTS_ONLY'
    &&result.ownPath===own.replaceAll('/',String.fromCharCode(92)),'Not the retained QA state');
  const matched=result.materialized.map(f=>{const a=pin(f.path);need(a.byteLength===f.byteLength&&a.sha256===f.sha256,'Historical output bytes changed');return a;});
  const admission=json(join(out,'admission.json')),wire=json(join(out,'wire.json')),permit=json(join(out,'permit.json'));
  const acquisition=json(join(out,'acquisition-preissuer.json')),cfg=json(join(out,'qa-native-request-nonadoptable.json')),checkpoint=json(join(out,'receipt.json'));
  const create=JSON.parse(wire.create.utf8),prompt=JSON.parse(wire.prompt.utf8),payload=JSON.parse(prompt.text);
  const permissions=create.permissions;
  need(Array.isArray(permissions)&&permissions.length===1&&permissions[0]!==null&&typeof permissions[0]==='object'
    &&!Array.isArray(permissions[0])&&Object.keys(permissions[0]).sort().join(',')==='action,effect,resource'
    &&permissions[0].action==='*'&&permissions[0].resource==='*'&&permissions[0].effect==='deny','Exact deny-all rule/field set differs');
  const original=json(request.pins.intention.path).admissionIntention;
  need(payload.prompt===original.command.prompt&&Buffer.byteLength(payload.prompt)===178
    &&isDeepStrictEqual(payload.dossier,original.command.dossier),'Frozen prompt or dossier changed');
  need(wire.create.sha256===sha(Buffer.from(wire.create.utf8))&&wire.prompt.sha256===sha(Buffer.from(wire.prompt.utf8))
    &&wire.create.byteLength===Buffer.byteLength(wire.create.utf8)&&wire.prompt.byteLength===Buffer.byteLength(wire.prompt.utf8)
    &&wire.totalBodyUtf8Bytes===wire.create.byteLength+wire.prompt.byteLength&&wire.totalBodyUtf8Bytes<=262144,'Actual wire byte/hash/cap differs');
  const wirePin=pin(join(out,'wire.json')),admissionPin=pin(join(out,'admission.json'));
  need(permit.expected.imageSha256===wirePin.sha256&&wirePin.sha256!==admissionPin.sha256,'Wire/admission domains mixed');
  need(checkpoint.status==='LOCAL_MATERIALIZATION_CHECKPOINT_NOT_FINAL'&&checkpoint.runtimeProductCommit==='340386a9926f8afafc6dab6fe08f9a237afb2c75'
    &&checkpoint.runtimeCodePins.length===19,'Checkpoint scope differs');
  for(const f of checkpoint.runtimeCodePins){const a=pin(f.path);need(a.byteLength===f.byteLength&&a.sha256===f.sha256,'Retained runtime bytes changed');}
  need(result.postCloseObservedAt>0&&result.remainingWallMs===request.scope.expiresAt-result.postCloseObservedAt
    &&result.remainingWallMs>=request.scope.minRemainingMs
    &&result.knownControllerRemainingWallMs===result.actualController.expiresAt-result.postCloseObservedAt,'Historical post-close observation inconsistent');
  need(acquisition.grants.length===1&&acquisition.grants[0].role==='A'&&acquisition.grants[0].capUtf8Bytes===262144
    &&acquisition.grants[0].acquiredUtf8Bytes===262144&&acquisition.root.origins.length===0
    &&!Object.hasOwn(acquisition.root.slots[0],'grantRef'),'Pre-issuer domain fabricated');
  need(cfg.ownPath===result.ownPath&&cfg.controllerId===request.scope.controllerId&&cfg.sessionId===request.scope.sessionId,'QA attribution changed');
  const beforeOwn=pin(own),db=new Database(own,{readonly:true,strict:true});let rows;
  try{
    const m=db.query('SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?').get(cfg.missionId);
    const f=db.query('SELECT token,state,expires_event FROM ff8_unit_leases WHERE mission=? AND unit_id=?').get(cfg.missionId,cfg.unitId);
    const u=db.query('SELECT state FROM ff8_graph_units WHERE mission=? AND unit_id=?').get(cfg.missionId,cfg.unitId);
    need(m.lease_owner===cfg.controllerId&&m.lease_token===admission.command.metadata.rmsBinding.controllerFence
      &&f.token===admission.command.metadata.rmsBinding.familyFence&&f.state==='active'&&u.state==='RESERVED','Durable QA rows differ');
    const roots=db.query('SELECT COUNT(*) AS n FROM ff8_graph_native_roots WHERE mission=?').get(cfg.missionId).n;
    const bindings=db.query('SELECT COUNT(*) AS n FROM ff8_graph_native_bindings WHERE mission=?').get(cfg.missionId).n;
    const operations=db.query('SELECT COUNT(*) AS n FROM ff8_graph_native_operations WHERE mission=?').get(cfg.missionId).n;
    need(roots===0&&bindings===0&&operations===0,'Native authority/operation unexpectedly exists in QA');
    rows={controllerFence:m.lease_token,familyFence:f.token,unitState:u.state,roots,bindings,operations,
      controllerLeaseUntil:m.lease_until,controllerUnexpiredAtRead:Date.now()<m.lease_until,
      meaning:'Historical QA rows only; no assertion of current operational ownership, release or global absence'};
  }finally{db.close();}
  need(pin(own).sha256===beforeOwn.sha256,'Readonly verification changed OWN bytes');
  const contract=json(join(modules,'stage-materialize-native-inputs.manifest.json'));
  for(const f of [contract.module,...contract.reusedModules]){const a=pin(join(modules,f.path));need(a.byteLength===f.byteLength&&a.sha256===f.sha256,'Module dependency changed before repeat refusal');}
  need(contract.module.sha256==='d42c617aa4f12eb6a9f1d92a93aefa8c2f2ecc523c5bb9ea57a1a459559bdb0a','Unexpected materializer code');
  const {stageAndMaterializeNativeInputsV1}=await import(pathToFileURL(join(modules,contract.module.path)).href);
  const repeatStarted=performance.now(),repeat=stageAndMaterializeNativeInputsV1(request),repeatDurationMs=performance.now()-repeatStarted;
  need(repeat.status==='HOLD_BEFORE_STAGE'&&!repeat.stageAttempted&&!repeat.outputCreated&&repeat.createdOutputs.length===0
    &&repeat.failure.includes('fresh namespace/output only')&&pin(own).sha256===beforeOwn.sha256,'Repeat adopted or modified existing state');
  need(pin(priorFailure.path).sha256===priorFailure.sha256,'Original FAIL evidence changed');
  const receipt={version:'rms-local-materializer-existing-state-recheck-v1',status:'PASS_EXISTING_ARTIFACT_RECHECK_AND_REPEAT_REFUSAL_ONLY',
    initialRunStatus:'FAIL_PRESERVED_NOT_RECLASSIFIED',initialFailure:priorFailure,initialFourRefusalsReused:4,
    correctedOracle:'Exact one-rule array, exact field set and exact values; object property insertion order irrelevant, array order not relaxed',
    existingOutputPinsMatched:matched.length,runtimeCodePinsMatched:19,wireBodyBytes:wire.totalBodyUtf8Bytes,
    wirePin,admissionPin,qaOwnPin:beforeOwn,rows,postCloseObservedAt:result.postCloseObservedAt,
    repeat:{status:repeat.status,stageAttempted:false,outputCreated:false,ownBytesUnchanged:true,durationMs:repeatDurationMs},
    dynamicBranchesNotExecuted:['Slow-successful-close deadline injection','Database-close exception injection'],
    durationMs:Date.now()-started,newStageCalls:0,leaseAcquisitions:0,nativeEffects:0,rmsOriginsCommitted:0,
    purpose:'QA only, never operationally adoptable'};
  mkdirSync(recheck);writeFileSync(join(recheck,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({...receipt,receiptPin:pin(join(recheck,'receipt.json'))}));
}catch(e){console.error(JSON.stringify({status:'RECHECK_FAILED_PRESERVE_ALL_STATE',error:String(e?.message??e).slice(0,5000),durationMs:Date.now()-started,newStageCalls:0,noAutomaticRetry:true}));process.exitCode=1;}
