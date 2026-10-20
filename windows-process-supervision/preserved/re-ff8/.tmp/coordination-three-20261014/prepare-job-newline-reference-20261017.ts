import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const original=load('job-source-review-r1-request-20261017.json'),a=load('job-source-review-r1-packet-admission-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);const res=await fetch('http://127.0.0.1:4747/api/state');assert(res.ok);const team=(await res.json()).teams.find((t:any)=>t.id===original.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'in_progress');assert.equal(task.assignee,'job-source-review-r1');assert.equal(team.modelPolicy.revision,2);assert.equal(team.routingPolicy.revision,4);
const auth=(await cli.rpc.call({rpcID:'ensemble',method:'modelAuthorizationStatus',location:{directory:root},input:{}})).output as any;assert(auth.ready&&!auth.pausedTeams.includes(team.id)&&!auth.admissionPausedTeams.includes(team.id));assert.equal(team.members.find((m:any)=>m.name===task.assignee).agent,'plan');
const sourceRoot=phase+'/JOB_NEWLINE_REFERENCE_INPUTS_20261017',destinationRoot=root+'/inputs/JOB_NEWLINE_REFERENCE_20261017';assert(!existsSync(destinationRoot));
const refs=JSON.parse(readFileSync(sourceRoot+'/REFERENCE_MANIFEST.json','utf8'));assert.equal(refs.commit,'ec9fa9ae770d522a5b5f0607898044b7478574a3');for(const f of refs.records){const b=readFileSync(sourceRoot+'/'+f.name);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);}
const binding={taskId:task.id,targetSessionId:session.id,model:session.model,cycle:1,role:'reviewer',purpose:'requested authoritative NewLine reference, same original static audit only',sourceScopeSha256:a.scopeSha256,originalHelperCsSha256:'709572128a71ca20fc0119ba059d3e79d817968c653492aa27adb6a7cd291c53',referenceCommit:refs.commit,accessAckThenHoldBeforeParentStaticResume:true,noRuntimeProbeOrHelperEditOrVerdictPrescribed:true};
writeFileSync(sourceRoot+'/TASK_BINDING.json',JSON.stringify(binding,null,2)+'\n',{flag:'wx'});
const names=[...refs.records.map((r:any)=>r.name),'REFERENCE_MANIFEST.json','PARENT_REFERENCE_SCOPE.md','TASK_BINDING.json'];assert.equal(new Set(names).size,names.length);
const files=names.map((path:string)=>{const b=readFileSync(sourceRoot+'/'+path);return {path,bytes:b.length,sha256:sha(b),kind:'knowledge'};});
const request={...original,sourceRoot,destinationRoot,files:files.map(({bytes,...f})=>f)};
for(const f of original.files)assert.equal(sha(readFileSync(original.destinationRoot+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,sourceRoot,destinationRoot,files,totalBytes:files.reduce((s:any,f:any)=>s+f.bytes,0),referenceCommit:refs.commit,original10PayloadsUnchanged:true,
 stage:'REQUESTED_NEWLINE_REFERENCE_PREPARED_ACCESS_ONLY_ACK_THEN_HOLD_NO_PROBE_FIX_OR_VERDICT'};
writeFileSync(phase+'/job-newline-reference-request-20261017.json',JSON.stringify(request,null,2)+'\n',{flag:'wx'});writeFileSync(phase+'/job-newline-reference-admission-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
