import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',sourceRoot=root+'/.tmp/re-graph-scheduler/review-20261014/L3MAINTESTADAPT';
if(existsSync(sourceRoot))throw Error('Frozen package exists; do not overwrite');
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const selected:string[]=[];
for(const dir of ['tools/ff8-harness/src','tools/ff8-harness/schemas','tools/ff8-harness/test/fixtures/graph']){
 const walk=(p:string)=>{for(const e of readdirSync(root+'/'+p,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('Unowned symlink');if(e.isDirectory())walk(p+'/'+e.name);else if(e.isFile())selected.push(p+'/'+e.name);}};walk(dir);
}
selected.push('tools/ff8-harness/test/cluster.test.ts','docs/missions/re-graph-scheduler/contract/CONTRAT.md','docs/missions/re-graph-scheduler/L3_MAIN_FIXTURE_ADAPTATION.md');
const files:{path:string,sha256:string,kind:string}[]=[];
for(const p of selected.sort()){
 const path='NEW/'+p,bytes=readFileSync(root+'/'+p);mkdirSync(dirname(sourceRoot+'/'+path),{recursive:true});writeFileSync(sourceRoot+'/'+path,bytes,{flag:'wx'});
 files.push({path,sha256:sha(bytes),kind:p.includes('/test/')?'test':p.includes('/src/')?'source':'rule'});
}
const oldPath='OLD/test/cluster.test.ts',oldSource=root+'/.tmp/re-graph-scheduler/review-20261014/L3NUM/tools/ff8-harness/test/cluster.test.ts';
mkdirSync(dirname(sourceRoot+'/'+oldPath),{recursive:true});copyFileSync(oldSource,sourceRoot+'/'+oldPath);files.push({path:oldPath,sha256:sha(readFileSync(oldSource)),kind:'test'});
writeFileSync(sourceRoot+'/manifest.json',JSON.stringify({purpose:'Frozen parent test-only integration delta; not acceptance',files},null,2)+'\n',{flag:'wx'});
files.push({path:'manifest.json',sha256:sha(readFileSync(sourceRoot+'/manifest.json')),kind:'manifest'});
const endpoint=await Service.discover();if(!endpoint)throw Error('No public native API');const client=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const response=await fetch('http://127.0.0.1:4747/api/state');if(!response.ok)throw Error('No public team state');
const team=(await response.json()).teams.find((t:any)=>t.name==='re-graph-scheduler');if(team?.leadSessionId!=='ses_eca40a8e2ffeanEKTBLiGjDNw8')throw Error('Foreign mission');
const member=team.members.find((m:any)=>m.name==='l3-main-fixture-review');if(!member)throw Error('Missing owned reviewer');
const native=await client.session.get({sessionID:member.sessionId});if(native.model?.providerID!=='openai'||native.model.id!=='gpt-6.1-sol'||native.model.variant!=='max')throw Error('Unexpected native reviewer model');
writeFileSync(phase+'/l3-main-fixture-native-admission.json',JSON.stringify({member,session:native},null,2)+'\n',{flag:'wx'});
const req={schemaVersion:1,missionId:team.id,taskId:'task_mv9ao561_000g_l8bbm2',cycle:1,role:'reviewer',blind:false,sourceRoot,targetSessionId:native.id,destinationRoot:root+'/inputs/l3-main-fixture-review-20261015',files};
writeFileSync(phase+'/l3-main-fixture-preparation-request.json',JSON.stringify(req,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:files.length,nativeSession:native.id,model:native.model,testSha256:files.find(f=>f.path==='NEW/tools/ff8-harness/test/cluster.test.ts')!.sha256,sourceRoot,destination:req.destinationRoot}));
