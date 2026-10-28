import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {Service} from 'file:///C:/Users/djden/source/repos/opencode-ensemble-session/node_modules/@opencode/client/dist/promise/service.js';
const specs=[
['g01','ses_ed420ceafffexZtpxhrL5gGo2J','openai','medium'],
['g02','ses_ed42744d1ffesQe83Wpxuz0q7P','opencode-go','medium'],
['g03','ses_ed420cd0fffewvN21vSSI9NvaX','zai-coding-plan','max'],
['g04','ses_ed420c8f3ffeH2npuxzJGwinbY','openai','high'],
['g05','ses_ed42349cbffePGv87XNqMPybUW','openai','medium'],
['g06','ses_ed420c679ffe1XWpDoRBdakgMq','zai-coding-plan','max'],
['g07','ses_ed41fdfb7ffeS1zuMHpVRxomRS','openai','high'],
['g08','ses_ed41fddf2ffegK7IFA995Loqlr','zai-coding-plan','max'],
['g09','ses_ed41fdb53ffe50zew52Vi4J67f','zai-coding-plan','max'],
['g10','ses_ed41fd8a0ffe00nLDACrV4l12a','openai','high'],
['g11','ses_ed427b872ffe0xhmUYh45OGOZs','zai-coding-plan','high'],
['g12','ses_ed41fd5beffeEDjPz8v7eGLgIg','zai-coding-plan','max'],
['g13','ses_ed41fd30dffesWwHN1kdzH25Zn','zai-coding-plan','max'],
['g14','ses_ed41fcf7cffekHHwWY7knEV8Af','openai','medium'],
['g15','ses_ed41fcc7affemdGBdQ0VShrDuh','openai','high'],
['g16','ses_ed41fc9baffenXvd7VTFQnW23y','zai-coding-plan','max'],
['g17','ses_ed41fc6c0ffeWZh5hkKIUXKy89','openai','high'],
['g18','ses_ed41fc3fbffeEq7HO9e7D75JI5','zai-coding-plan','max'],
['g19','ses_ed41fc0b2ffecP3EYaS1m3mgu7','zai-coding-plan','max'],
['g20','ses_ed41fbd48ffe9q3GtpL36cJoVY','openai','medium'],
['g21','ses_ed41fba20ffexCPkkuwhhXozTE','zai-coding-plan','max'],
['g22','ses_ed41fb295ffeYD3J2A6qH612D8','openai','medium'],
['g23','ses_ed41fab26ffeFl6Nvi5RVd9gut','openai','high'],
['g24','ses_ed423066dffeDbrR8MDt9xmpLU','zai-coding-plan','high'],
['g25','ses_ed41fa60affe5f8tCkylir3CG6','zai-coding-plan','max'],
['g26','ses_ed41fa1a2ffeWIPAWXdxb0LaMQ','zai-coding-plan','max'],
['g27','ses_ed41f9ac3ffeEUxhP5eKMhFLTN','openai','medium'],
['g28','ses_ed41f9356ffeJNI38Q23GiUGoO','zai-coding-plan','max'],
['g29','ses_ed41f8c06ffelsWMWJY05yKyAw','openai','high'],
['g30','ses_ed41f86ccffeIOnoRo2nbIlElt','openai','high'],
['g31','ses_ed41f8417ffeuAlp98NNcA60Om','zai-coding-plan','max'],
['g32','ses_ed41f7efbffeda4MnBIUi5OvBr','zai-coding-plan','max'],
['g33','ses_ed41f7768ffeEqkbik177TUJk8','zai-coding-plan','max'],
['g34','ses_ed41f7454ffeMmUT62aU0vibC0','openai','medium'],
['g35','ses_ed41f6fbbffeI2SrFtyj7BeEOw','zai-coding-plan','max'],
['g36','ses_ed41f6854ffemmPxPCa1inVFne','zai-coding-plan','max'],
];
const root='docs/missions/ff8-decomp-semantics-2026-10-11-run01';
const dest=path.join(root,'admissions');fs.mkdirSync(dest,{recursive:true});
const ep=await Service.discover();if(!ep)throw Error('No healthy discovered service; no service start');
const headers=Service.headers(ep);const receipts=[];
for(const [group,id,provider,variant] of specs){
  const res=await fetch(ep.url+'/api/session/'+id,{headers});if(!res.ok)throw Error('Readback HTTP '+res.status+' '+group);
  const raw=await res.text();const info=JSON.parse(raw).data;
  const model=provider==='openai'?'gpt-6.1-sol':provider==='opencode-go'?'gpt-6-luna':'glm-5.3-flash';
  if(info.model.providerID!==provider||info.model.id!==model||info.model.variant!==variant)throw Error('Model.Ref mismatch '+group);
  const file=path.join(dest,group+'.session.native.json');if(fs.existsSync(file))throw Error('Immutable admission receipt exists '+group);
  fs.writeFileSync(file,raw,'utf8');
  const e={at_utc:new Date().toISOString(),event:'SESSION_ADMISSION_NATIVE_READBACK',group,session_id:id,model_ref:info.model,outcome:info.outcome??null,artifact:'admissions/'+group+'.session.native.json',sha256:crypto.createHash('sha256').update(raw).digest('hex')};
  fs.appendFileSync(path.join(root,'ledger.jsonl'),JSON.stringify(e)+'\n','utf8');receipts.push(e);
}
fs.writeFileSync(path.join(root,'admissions.json'),JSON.stringify(receipts,null,2)+'\n','utf8');
console.log(JSON.stringify({readbacks:receipts.length,failed:receipts.filter(x=>x.outcome==='failed').map(x=>x.group),completed:receipts.filter(x=>x.outcome==='completed').map(x=>x.group),other:receipts.filter(x=>!x.outcome).length}));
