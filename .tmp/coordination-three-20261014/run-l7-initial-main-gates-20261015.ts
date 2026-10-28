import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',before=JSON.parse(readFileSync(phase+'/l7-initial-main-transfer-before.json','utf8'));
const verify=()=>{for(const f of [...before.preserved,...before.files])if(createHash('sha256').update(readFileSync(root+'/'+f.path)).digest('hex')!==f.sha256)throw Error('Preserved/new harness bytes changed '+f.path);};
const commands:[string,string[]][]=[['typecheck',['run','typecheck']],['focused',['test',...before.files.filter((f:any)=>f.path.endsWith('.test.ts')).map((f:any)=>f.path.replace('tools/ff8-harness/',''))]],['full',['test']]];
const results:any[]=[];verify();
for(const [name,args]of commands){const start=Date.now(),p=spawnSync('bun',args,{cwd:root+'/tools/ff8-harness',encoding:'utf8',timeout:420000}),out=p.stdout+'\n'+p.stderr;writeFileSync(phase+'/l7-initial-main-'+name+'.log',out,{flag:'wx'});const summary=out.split(/\r?\n/).filter(l=>/ pass$| fail$| skip$|expect\(\) calls|^Ran |error TS/.test(l.trim())).slice(-12),record={name,exit:p.status,signal:p.signal,error:p.error?.message,ms:Date.now()-start,summary};results.push(record);console.log(JSON.stringify(record));verify();if(p.status!==0)break;}
const result={reviewTask:before.reviewTask,sourceAggregate:before.sourceAggregate,preservedHarnessPins:before.preserved.length,newFiles:before.files.length,allBeforeAfterPinsExact:true,results,allCommandsExit0:results.length===3&&results.every(x=>x.exit===0),notGlobalL7Closure:true,notL8OrNativeAcceptance:true};
writeFileSync(phase+'/l7-initial-main-gates.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));if(!result.allCommandsExit0)process.exitCode=1;
