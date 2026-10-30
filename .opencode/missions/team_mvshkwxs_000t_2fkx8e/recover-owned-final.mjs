// Read-only native session recovery; persists final text/provenance only, no reasoning or credentials.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Service} from '../../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
const id=process.argv[2];
const bundle=/^--all-finals(?:-r[1-9][0-9]*)?$/.test(process.argv[3]??'');
const bundleSuffix=bundle?process.argv[3].slice('--all-finals'.length):'';
const owned=new Set(['ses_e7bfce26fffe9pekRRk3rnSFpV','ses_e7bfd1130ffeJqogvfIcT2LqBE','ses_e7bf518b0ffeIgOkK5bOJW2gKI','ses_e7bd3ecb9ffevCYWkaFJF5KMn3','ses_e7b871c97ffejOzcuBv1QZZe4s','ses_e7b0a03a5ffe7KDo96BY6HC38n','ses_e788b1f59ffeNncR9EBFemGPv1','ses_e782236a4ffeQSg60nGCm9uyn6','ses_e77d96573ffeEBTW7zjZ1vWx8F']);
owned.add('ses_e7788a8c8ffeUaP50uzCw35U24');
owned.add('ses_e7782688dffefbVWl2bQdeuGdU');
if(!owned.has(id)||!(process.argv.length===3||(process.argv.length===4&&bundle)))throw Error('Session not in mission-owned allowlist or invalid mode');
const endpoint=await Service.discover();
if(!endpoint)throw Error('No existing service; no start permitted');
async function get(route){
  const r=await fetch(new URL(route,endpoint.url),{headers:Service.headers(endpoint),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Native recovery HTTP '+r.status);
  return r.json();
}
const response=await get('/api/session/'+id);
const session=response.data??response;
const page=await get('/api/session/'+id+'/message?limit=20&order=desc&type=assistant');
const final=page.data.find(m=>m.type==='assistant'&&m.finish==='stop'&&(m.content??m.parts??[]).some(p=>p.type==='text'));
if(!final)throw Error('No final in bounded native page; not a proof of absence');
const text=(final.content??final.parts).filter(p=>p.type==='text').map(p=>p.text).join('\n');
if(bundle){
  const finals=page.data.filter(m=>m.type==='assistant'&&m.finish==='stop').map(m=>({messageID:m.id,model:m.model,text:(m.content??m.parts??[]).filter(p=>p.type==='text').map(p=>p.text).join('\n')}));
  const file=path.join(import.meta.dirname,'evidence',id+'-native-finals-bundle'+bundleSuffix+'.json');
  fs.writeFileSync(file,JSON.stringify({schema:'owned-native-finals-bundle-v1',sessionID:id,model:session.model,finals,boundedPage:20,cursor:page.cursor,scope:'Final text only; no reasoning or supervisor acceptance'},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({file,sessionID:id,model:session.model,finals:finals.map(f=>({messageID:f.messageID,textBytes:Buffer.byteLength(f.text),sha256:createHash('sha256').update(f.text).digest('hex')}))}));
} else {
const result={schema:'owned-native-final-recovery-v1',sessionID:id,messageID:final.id,model:session.model,assistantModel:final.model,agent:session.agent,finish:final.finish,precedingNewestIdle:page.data.find(m=>m.type==='idle')?.outcome,textSha256:createHash('sha256').update(text).digest('hex'),text,scope:'Exact native final response, not supervisor acceptance or native RMS product proof'};
const file=path.join(import.meta.dirname,'evidence',id+'-native-final.json');
fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({file,sessionID:id,messageID:final.id,model:session.model,textSha256:result.textSha256,finish:final.finish}));
}
