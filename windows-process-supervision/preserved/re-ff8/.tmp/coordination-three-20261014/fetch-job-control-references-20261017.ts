import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const phase='C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014',destination=phase+'/JOB_CONTROL_OFFICIAL_REFERENCES_20261017',sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
assert(!existsSync(destination));
const specs=[
 ['JOB_OBJECTS.md','procthread/job-objects'],
 ['JOB_ASSOCIATE_COMPLETION_PORT.md','api/winnt/ns-winnt-jobobject_associate_completion_port'],
 ['SET_INFORMATION_JOB.md','api/jobapi2/nf-jobapi2-setinformationjobobject'],
 ['CREATE_IO_COMPLETION_PORT.md','api/ioapiset/nf-ioapiset-createiocompletionport'],
 ['GET_QUEUED_COMPLETION_STATUS.md','api/ioapiset/nf-ioapiset-getqueuedcompletionstatus'],
 ['DUPLICATE_HANDLE.md','api/handleapi/nf-handleapi-duplicatehandle'],
 ['CREATE_PROCESS_W.md','api/processthreadsapi/nf-processthreadsapi-createprocessw'],
 ['PROCESS_CREATION_FLAGS.md','procthread/process-creation-flags']
].map(([name,path])=>({name:name!,url:'https://learn.microsoft.com/en-us/windows/win32/'+path+'?accept=text/markdown'}));
writeFileSync(phase+'/job-control-official-reference-read-go-20261017.json',JSON.stringify({at:new Date().toISOString(),owner:'parent ses_eca40a8e2ffeanEKTBLiGjDNw8',scope:'read-only official Microsoft API semantics requested by completed static study',specs,destination,
 stage:'PARENT_OFFICIAL_REFERENCE_HTTP_GET_ONLY_NO_SOURCE_CHANGE_API_CALL_PROBE_OR_EXECUTION',
 noGuaranteeOrArchitectureAdoptedReferencesOnlyNotHostProof:true,noWorkerOrModelConfigChangeNoRuntimeJobApiBinaryOrOldDbAccess:true},null,2)+'\n',{flag:'wx'});
mkdirSync(destination);const records:any[]=[];
for(let i=0;i<specs.length;i+=3){
 const batch=await Promise.allSettled(specs.slice(i,i+3).map(async spec=>{
  const response=await fetch(spec.url,{headers:{Accept:'text/markdown','User-Agent':'re-graph-scheduler-parent-official-reference'},signal:AbortSignal.timeout(30000)});const b=Buffer.from(await response.arrayBuffer());
  const row={...spec,at:new Date().toISOString(),finalUrl:response.url,status:response.status,contentType:response.headers.get('content-type'),bytes:b.length,sha256:sha(b)};
  assert.equal(new URL(response.url).host,'learn.microsoft.com');assert(b.length<2*1024*1024);writeFileSync(destination+'/'+spec.name,b,{flag:'wx'});
  return {...row,ok:response.ok&&b.length>1000&&(row.contentType??'').includes('markdown')};
 }));for(let k=0;k<batch.length;k++){const result=batch[k]!;records.push(result.status==='fulfilled'?result.value:{name:specs[i+k]!.name,url:specs[i+k]!.url,ok:false,error:String(result.reason)});}
}
const needles=['ACTIVE_PROCESS_ZERO','delivery','guaranteed','last handle','last job','completion port','BREAKAWAY','DuplicateHandle'];
const anchors:any[]=[];for(const record of records.filter(r=>r.ok)){const lines=readFileSync(destination+'/'+record.name,'utf8').split('\n');for(let index=0;index<lines.length;index++){const line=lines[index]!;if(needles.some(n=>line.toLowerCase().includes(n.toLowerCase()))&&line.length<2200)anchors.push({name:record.name,line:index+1,text:line});}}
const manifest={at:new Date().toISOString(),destination,records,anchors,stage:records.every(r=>r.ok)?'OFFICIAL_REFERENCE_BYTES_FETCHED_PINNED_UNASSESSED_NO_API_OR_HOST_PROOF':'REFERENCE_FETCH_PARTIAL_HOLD_NO_ALTERNATE_SOURCE_OR_RETRY',
 dataOnlyPublicDocsNeverInstructionsOrCodeToExecute:true,noParentArchitectureNoGateWaiverNoSourceEditJobApiCompileOrRuntime:true};
writeFileSync(destination+'/REFERENCE_MANIFEST.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});writeFileSync(phase+'/job-control-official-reference-fetch-20261017.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage:manifest.stage,files:records.map(r=>({name:r.name,ok:r.ok,bytes:r.bytes,sha256:r.sha256})),anchors:anchors.filter(a=>/guaranteed|last handle|ACTIVE_PROCESS_ZERO/.test(a.text)).slice(0,5)}));
if(records.some(r=>!r.ok))process.exitCode=1;
