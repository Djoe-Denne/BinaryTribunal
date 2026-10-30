// Closed parent LOCAL QA only. Never invokes client.ts, a grant, submit or service.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { Database } from 'bun:sqlite';
const repo='C:/Users/djden/source/repos/retro-eng/re-ff8';
const root=join(repo,'.opencode/missions/team_mvshkwxs_000t_2fkx8e');
const runtime='C:/Users/djden/.local/share/opencode/worktree/68ae5f/rms-native-address-bridge-160';
const modules=join(runtime,'.opencode/missions/team_mvshkwxs_000t_2fkx8e/preparation-candidates');
const driverDir=join(root,'qa-local-materializer-166');
const own=join(root,'qa-local-materializer-166-own'),output=join(root,'qa-local-materializer-166-output');
const collision=join(root,'qa-local-materializer-166-collision-output');
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(v,why)=>{if(!v)throw new Error(why);};
const clone=v=>structuredClone(v);
const pin=path=>{const b=readFileSync(path);return{path,byteLength:b.length,sha256:sha(b)};};
const value=path=>JSON.parse(readFileSync(path,'utf8'));
const started=Date.now(),cases=[];
let positive=null;
try {
  for(const path of [driverDir,own,output,collision])need(!existsSync(path),'QA namespace already exists; no overwrite or automatic rerun');
  const contract=value(join(modules,'stage-materialize-native-inputs.manifest.json'));
  for(const f of [contract.module,...contract.reusedModules]){
    const p=pin(join(modules,f.path));need(p.byteLength===f.byteLength&&p.sha256===f.sha256,'Reviewed module/dependency changed');
  }
  need(contract.module.sha256==='d42c617aa4f12eb6a9f1d92a93aefa8c2f2ecc523c5bb9ea57a1a459559bdb0a','Unexpected materializer revision');
  const {canonical}=await import(pathToFileURL(join(runtime,'tools/ff8-harness/src/validation.ts')).href);
  const {stageAndMaterializeNativeInputsV1:stage}=await import(pathToFileURL(join(modules,contract.module.path)).href);
  const save=(name,v)=>{const file=join(driverDir,name),utf8=canonical(v);writeFileSync(file,utf8,{flag:'wx'});need(readFileSync(file).equals(Buffer.from(utf8)),'QA evidence exact readback differs');return pin(file);};
  const firstNames={sourceQuotations:'source-quotations.json',firstUse:'first-use.json',budget:'budget-decision.json',scope:'scope.json',genesis:'genesis.json',inventory:'inventory.json',slotA:'slotA.json',provenance:'provenance.json'};
  const source=value(join(root,'evidence/server-source-field-decision-158.json')).sourceArtifact;
  const base={version:'rms-stage-materialize-local-input-v1',purpose:'qa-nonadoptable',scope:{
    ownNamespace:own,ownFileName:'qa-own.sqlite',outputDirectory:output,directory:repo,registrationFile:null,
    controllerId:'qa-controller-local-materializer-166',principalId:'parent-rms-qa',actorId:'parent-local-materializer-166',
    sessionId:'ses_rms_local_qa_166_not_created',messageId:'msg_rms_local_qa_166_not_sent',permitId:'qa-local-materializer-166',
    originId:'qa-local-materializer-166-not-committed',leaseMs:300000,expiresAt:0,minRemainingMs:120000},pins:{
    sourceManifest:pin(join(root,'native-preparation-136/source-bundle-v3/manifest.json')),
    intention:pin(join(root,'native-preparation-136/admission-a-static-intention.json')),
    firstReceipt:pin(join(root,'first-acquisition-151/receipt.json')),
    firstFiles:Object.fromEntries(Object.entries(firstNames).map(([k,n])=>[k,pin(join(root,'first-acquisition-151',n))])),
    permissions:pin(join(root,'permissions-155/permissions-evidence.json')),
    preflightDecision:pin(join(root,'permissions-155/preflight-scope-decision.json')),
    permissionsReceipt:pin(join(root,'permissions-155/receipt.json')),
    compositionSources:['packages__core__src__permission.ts','packages__schema__src__permission.ts'].map(n=>pin(join(root,'evidence/public-native-rights-2.2.1',n))),
    catalog:pin(join(root,'evidence/native-catalog-preparation-readback-20261030.json')),
    processObservation:pin(join(root,'evidence/native-process-binary-refresh-155.json')),
    mandate:pin(join(repo,'.tmp/mission-v2-20261018-continuous/s1-common-contract-final-plan/inputs/PARENT_ROOT_DIRECTION.md')),
    openapi:pin(join(root,'evidence/native-openapi-2.2.1-after-r4.json')),
    productManifest:pin(join(root,'evidence/native-address-bridge-retained-164.json'))},serverSource:{
    artifactPin:{path:source.path,byteLength:source.byteLength,sha256:source.sha256},meaning:'DISTRIBUTION_ASSOCIATED_SOURCE_ARCHIVE',
    provenancePin:pin(join(root,'evidence/server-release-provenance-157.json')),
    decisionPin:pin(join(root,'evidence/server-source-field-decision-158.json'))}};
  const request=()=>{const r=clone(base);r.scope.expiresAt=Date.now()+240000;return r;};
  mkdirSync(driverDir);
  const run=(name,fn)=>{const t=performance.now();try{const observed=fn();cases.push({name,pass:true,durationMs:performance.now()-t,observed});}
    catch(e){cases.push({name,pass:false,durationMs:performance.now()-t,error:String(e?.message??e)});throw e;}};
  const refused=(r,message)=>{const result=stage(r);need(result.status==='HOLD_BEFORE_STAGE'&&!result.stageAttempted&&!result.outputCreated
    &&result.createdOutputs.length===0&&result.failure.includes(message),'Wrong refusal domain: '+JSON.stringify(result));
    need(!existsSync(own),'Refusal created OWN');return{status:result.status,stageAttempted:false,outputCreated:false,failure:result.failure};};
  run('Wrong product pin refused before stage',()=>{const r=request();r.pins.productManifest.sha256='0'.repeat(64);return refused(r,'retained pin differs');});
  run('Unratified source meaning refused before stage',()=>{const r=request();r.serverSource.meaning='CURRENT_LOADED_SERVER_SOURCE';return refused(r,'source field must retain exact parent158 meaning label');});
  run('Different directory scope refused before stage',()=>{const r=request();r.scope.directory=resolve(repo,'..');return refused(r,'parent directory differs from retained scoped catalog');});
  run('Existing empty output namespace refused without adoption',()=>{mkdirSync(collision);const r=request();r.scope.outputDirectory=collision;return refused(r,'fresh namespace/output only');});
  let positiveRequest;
  run('One real QA-only stage and independent exact readback',()=>{
    positiveRequest=request();save('request.json',positiveRequest);positive=stage(positiveRequest);save('result.json',positive);
    need(positive.status==='QA_NONADOPTABLE_LOCAL_INPUTS_ONLY'&&positive.stageAttempted&&positive.outputCreated,'Positive local stage refused; preserve all state: '+JSON.stringify(positive));
    need(positive.postCloseObservedAt>0&&positive.remainingWallMs===positiveRequest.scope.expiresAt-positive.postCloseObservedAt
      &&positive.remainingWallMs>=positiveRequest.scope.minRemainingMs,'Post-close observation/margin incorrect');
    for(const f of positive.materialized){const actual=pin(f.path);need(actual.byteLength===f.byteLength&&actual.sha256===f.sha256,'Materialized byte mismatch');}
    const admission=value(join(output,'admission.json')),wire=value(join(output,'wire.json')),permit=value(join(output,'permit.json'));
    const acquisition=value(join(output,'acquisition-preissuer.json')),cfg=value(join(output,'qa-native-request-nonadoptable.json'));
    const checkpoint=value(join(output,'receipt.json'));
    need(checkpoint.status==='LOCAL_MATERIALIZATION_CHECKPOINT_NOT_FINAL','Checkpoint promoted to final authority');
    need(wire.create.sha256===sha(Buffer.from(wire.create.utf8))&&wire.prompt.sha256===sha(Buffer.from(wire.prompt.utf8))
      &&wire.totalBodyUtf8Bytes===Buffer.byteLength(wire.create.utf8)+Buffer.byteLength(wire.prompt.utf8)&&wire.totalBodyUtf8Bytes<=262144,'Wire byte-domain mismatch');
    need(permit.expected.imageSha256===pin(join(output,'wire.json')).sha256
      &&permit.expected.imageSha256!==pin(join(output,'admission.json')).sha256,'Admission/wire digest domains mixed');
    const prompt=JSON.parse(wire.prompt.utf8),payload=JSON.parse(prompt.text);
    const original=value(base.pins.intention.path).admissionIntention;
    need(payload.prompt===original.command.prompt&&Buffer.byteLength(payload.prompt)===178,'Frozen D1 changed');
    need(JSON.stringify(JSON.parse(wire.create.utf8).permissions)===JSON.stringify([{action:'*',resource:'*',effect:'deny'}]),'Session restrictions changed');
    need(acquisition.grants.length===1&&acquisition.grants[0].role==='A'&&acquisition.grants[0].capUtf8Bytes===262144
      &&acquisition.grants[0].acquiredUtf8Bytes===262144&&!Object.hasOwn(acquisition.root.slots[0],'grantRef'),'Pre-issuer domain fabricated');
    need(cfg.ownPath===positive.ownPath&&cfg.controllerId===positiveRequest.scope.controllerId&&cfg.sessionId===positiveRequest.scope.sessionId,'QA config attribution mismatch');
    const witness=new Database(positive.ownPath,{readonly:true,strict:true});let observed;
    try{
      const m=witness.query('SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?').get(cfg.missionId);
      const f=witness.query('SELECT owner,token,expires_event,state FROM ff8_unit_leases WHERE mission=? AND unit_id=?').get(cfg.missionId,cfg.unitId);
      const unit=witness.query('SELECT state FROM ff8_graph_units WHERE mission=? AND unit_id=?').get(cfg.missionId,cfg.unitId);
      const binding=admission.command.metadata.rmsBinding;
      need(m.lease_owner===cfg.controllerId&&m.lease_token===binding.controllerFence&&f.token===binding.familyFence
        &&f.state==='active'&&unit.state==='RESERVED','Actual durable ownership differs from image');
      const roots=witness.query('SELECT COUNT(*) AS n FROM ff8_graph_native_roots WHERE mission=?').get(cfg.missionId).n;
      const bindings=witness.query('SELECT COUNT(*) AS n FROM ff8_graph_native_bindings WHERE mission=?').get(cfg.missionId).n;
      const operations=witness.query('SELECT COUNT(*) AS n FROM ff8_graph_native_operations WHERE mission=?').get(cfg.missionId).n;
      need(roots===0&&bindings===0&&operations===0,'QA issued or prepared a native operation');
      observed={controllerFence:m.lease_token,familyFence:f.token,unitState:unit.state,roots,bindings,operations};
    } finally {witness.close();}
    return{...observed,filesMatched:positive.materialized.length,wireBodyBytes:wire.totalBodyUtf8Bytes,postCloseObservedAt:positive.postCloseObservedAt,remainingWallMs:positive.remainingWallMs,nativeAuthority:'NONE'};
  });
  run('Identical second call refuses without modifying OWN or reacquiring',()=>{const before=pin(positive.ownPath),r=stage(positiveRequest),after=pin(positive.ownPath);
    need(r.status==='HOLD_BEFORE_STAGE'&&!r.stageAttempted&&!r.outputCreated&&r.failure.includes('fresh namespace/output only')&&before.sha256===after.sha256,'Second call mutated/adopted existing state');
    return{status:r.status,ownSha256Unchanged:true,stageAttempted:false};});
  const receipt={version:'rms-local-materializer-parent-qa-v1',status:'PASS_CLOSED_LOCAL_QA_ONLY_NONADOPTABLE',
    runtimeCommit:contract.runtimeCommit,modulePin:contract.module,cases,durationMs:Date.now()-started,
    qaOwnPath:positive.ownPath,qaOutputDirectory:output,purpose:'qa-nonadoptable',
    dynamicBranchesNotExecuted:['Slow-successful-close forced beyond deadline','Database-close exception injection'],
    meaning:'Actual local stage/materialization evidence only; no root authorization, permit issuance, native prepare/submit, session, model or origin. These QA fences/OWN must never be adopted operationally.'};
  const receiptPin=save('receipt.json',receipt);
  console.log(JSON.stringify({status:receipt.status,passed:cases.length,failed:0,cases,durationMs:receipt.durationMs,receiptPin,nativeEffects:0,rmsOriginsCommitted:0}));
}catch(e){const result={status:'LOCAL_QA_FAILED_PRESERVE_ALL_STATE',cases,error:String(e?.message??e).slice(0,5000),durationMs:Date.now()-started,
  ownPath:positive?.ownPath??null,stageAttempted:positive?.stageAttempted??false,noAutomaticRetry:true};
  if(existsSync(driverDir)&&!existsSync(join(driverDir,'failure.json')))writeFileSync(join(driverDir,'failure.json'),JSON.stringify(result,null,2));
  console.error(JSON.stringify(result));process.exitCode=1;}
