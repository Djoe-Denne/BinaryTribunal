// Parent DATA only. No OWN, service connection, permit issuance or native execution.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const repo='C:/Users/djden/source/repos/retro-eng/re-ff8';
const wt='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const root=join(repo,'.opencode/missions/team_mvshkwxs_000t_2fkx8e');
const out=join(root,'permissions-155');
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,why)=>{if(!ok)throw new Error(why);};
const pin=(path,kind)=>{const bytes=readFileSync(path);return{path,bytes,ref:{kind,encoding:'raw-v1',byteLength:bytes.length,sha256:sha(bytes)}};};
const started=Date.now(),created=[];
try {
  need(!existsSync(out),'Namespace exists; preserve state, no overwrite/retry');
  need(execFileSync('git',['rev-parse','HEAD'],{cwd:wt,encoding:'utf8'}).trim()==='782ec396a2a7866d30645c32ca8ab864dcca5960','Product HEAD differs');
  execFileSync('git',['diff','--exit-code','HEAD','--','tools/ff8-harness/src'],{cwd:wt,stdio:['ignore','pipe','pipe']});
  const {canonical}=await import(pathToFileURL(join(wt,'tools/ff8-harness/src/validation.ts')).href);
  const {makeBoundDocumentV1}=await import(pathToFileURL(join(wt,'tools/ff8-harness/src/graph-execution-envelope.ts')).href);
  const catalog=pin(join(root,'evidence/native-catalog-preparation-readback-20261030.json'),'rms-parent-file-bytes-v1');
  const intention=pin(join(root,'native-preparation-136/admission-a-static-intention.json'),'rms-parent-file-bytes-v1');
  need(intention.ref.sha256==='2f3425aceead82f6bfd5edb0df3c3c209d4dec121c3ff112f66ed2e65c8a8f24','Retained intention differs');
  const latest=pin(join(root,'evidence/native-declarations-refresh-154.json'),'rms-parent-file-bytes-v1');
  const binary=pin(join(root,'evidence/native-process-binary-refresh-155.json'),'rms-parent-file-bytes-v1');
  const c=JSON.parse(catalog.bytes),a=JSON.parse(intention.bytes),l=JSON.parse(latest.bytes),b=JSON.parse(binary.bytes);
  need(l.server.version==='2.2.1'&&l.server.pid===31584&&b.pid===31584&&b.binarySha256==='9ecb888ec3b28a393782269f531d1528ea21ff940f694752717e48a77b90527e','Server identity differs');
  need(canonical(c.selectedDeclaredProfile.permissions)===canonical(l.profile.permissions)&&l.profile.id==='general'&&l.profile.mode==='subagent','Current declared profile differs');
  need(l.modelProjection.enabled&&l.modelProjection.variantIds.includes('high')&&l.modelProjection.providerID==='openai'&&l.modelProjection.id==='gpt-6.1-sol','Selected declared model unavailable');
  need(canonical(a.proposedSessionRules)===canonical([{action:'*',resource:'*',effect:'deny'}]),'Retained session restriction differs');
  const publicDir=join(root,'evidence/public-native-rights-2.2.1');
  const source=pin(join(publicDir,'packages__core__src__permission.ts'),'rms-public-permission-source-v1');
  const schema=pin(join(publicDir,'packages__schema__src__permission.ts'),'rms-public-permission-schema-v1');
  need(source.ref.byteLength===13612&&source.ref.sha256==='5038c579ed632333a4b0eb3b8ec9582305724ef68d5b1dce2e1bb98db6f6a5d7','Public permission source pin differs');
  need(schema.ref.byteLength===2282&&schema.ref.sha256==='45b63a6d9f7619d9285663111f26a9a939d64683cac3272881e6dd196409bc1d','Public schema pin differs');
  const transport=pin(join(wt,'tools/ff8-harness/src/native-runtime-transport.ts'),'rms-product-source-bytes-v1');
  const client=pin(join(wt,'tools/ff8-harness/src/client.ts'),'rms-product-source-bytes-v1');
  const write=(name,value)=>{const path=join(out,name),utf8=canonical(value);writeFileSync(path,utf8,{flag:'wx'});const f=pin(path,'rms-parent-file-bytes-v1');need(f.bytes.equals(Buffer.from(utf8)),'Exact readback differs');created.push({path,byteLength:f.ref.byteLength,sha256:f.ref.sha256});return f;};
  mkdirSync(out);
  const decision=write('preflight-scope-decision.json',{
    version:'rms-parent-bounded-permission-preflight-decision-v1',scope:'bounded-coupling-qualification-only',
    missionId:'rms-qualification-6356b01f78a79192',review:{candidate:'result_mvusvyxd_0002_nzh56b',message:'msg_18c3fa2170019neL4cJrKzK1Ep'},
    resolvedPreflightQuestions:['Explicit general subagent and OpenAI Sol high declarations match current observed catalog','Nine agent rules retained in order; session deny-all is unchanged','Public composition is last-match with configured deny before saved allowances and hooks, under those public sources only','Existing transport must match native session rules/profile/model/location/metadata after create and before prompt; actual future success is not asserted'],
    unresolvedApplicableStaticQuestions:[],
    notProven:['Public sources equal code loaded by the server','Future behavioral denial of tool calls','Actual model execution or quota','Native result, terminality or physical resource release'],
    requiredFutureGuards:['Fresh current server/PID/binary anchoring before native effects','Exact guarded wire plus actual ownership and current fences','Native session readback matches before prompt; mismatch/ambiguity does not authorize a new attempt','No qualification-complete or M2-close claim from declarations, empty exercise refs or absence of tool calls'],
    references:[catalog.ref,intention.ref,latest.ref,binary.ref,source.ref,schema.ref,transport.ref,client.ref],
    authority:'Parent scope decision only; not a native grant or enforcement certificate'
  });
  const rights={version:'rms-native-permission-scope-evidence-v1',scope:'bounded-coupling-qualification-only',profile:'general',
    model:{providerID:'openai',id:'gpt-6.1-sol',variant:'high'},agentRules:l.profile.permissions,sessionRules:a.proposedSessionRules,
    compositionRefs:[source.ref,schema.ref,decision.ref],unknowns:[],nativeExerciseRefs:[]};
  const file=write('permissions-evidence.json',rights);
  const independentlyReloaded=JSON.parse(readFileSync(file.path,'utf8'));
  const bound=makeBoundDocumentV1('rms-native-permission-scope-evidence-v1',independentlyReloaded);
  need(bound.utf8===canonical(rights)&&bound.ref.sha256===file.ref.sha256&&bound.ref.byteLength===file.ref.byteLength,'Canonical permission document differs on reload');
  need(independentlyReloaded.nativeExerciseRefs.length===0&&independentlyReloaded.compositionRefs.length===3,'Evidence domains mixed');
  const receipt=write('receipt.json',{version:'rms-parent-permission-materialization-receipt-v1',status:'DECLARED_PERMISSIONS_ONLY_NATIVE_HOLD',
    files:created.slice(),permissionsEvidenceRef:bound.ref,durationMs:Date.now()-started,
    independentlyReloaded:true,nativeEnforcementProven:false,nativeExerciseRefs:[],grantsIssued:0,rmsOriginsCommitted:0});
  console.log(JSON.stringify({status:'DECLARED_PERMISSIONS_ONLY_NATIVE_HOLD',created,permissionsEvidenceRef:bound.ref,receiptSha256:receipt.ref.sha256,durationMs:Date.now()-started,nativeEnforcementProven:false,grantsIssued:0,rmsOriginsCommitted:0}));
} catch(e){console.error(JSON.stringify({status:'REFUSED_PRESERVE_PARTIAL',error:String(e?.message||e).slice(0,1200),created,durationMs:Date.now()-started}));process.exitCode=1;}
