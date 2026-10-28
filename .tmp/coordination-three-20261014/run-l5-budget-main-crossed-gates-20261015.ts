import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {strict as assert} from 'node:assert';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',before=JSON.parse(readFileSync(phase+'/l5-budget-main-transfer-before.json','utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const verify=()=>{for(const f of [...before.preserved,...before.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256,'Preserved/candidate bytes drift '+f.path);};
const qa=JSON.parse(readFileSync(phase+'/l7-initial-main-transfer-before.json','utf8')).files.filter((f:any)=>f.path.endsWith('.test.ts')).map((f:any)=>f.path.replace('tools/ff8-harness/',''));
const commands:[string,string[]][]=[['typecheck',['run','typecheck']],['focused',['test','test/planner.test.ts','test/planner-admission-budget.test.ts']],['crossed-initial-qa',['test',...qa]]];
verify();const results:any[]=[];
for(const [name,args] of commands){const start=Date.now(),p=spawnSync('bun',args,{cwd:root+'/tools/ff8-harness',encoding:'utf8',timeout:150000}),out=p.stdout+'\n'+p.stderr;writeFileSync(phase+'/l5-budget-main-'+name+'.log',out,{flag:'wx'});const row={name,exit:p.status,signal:p.signal,error:p.error?.message,ms:Date.now()-start,summary:out.split(/\r?\n/).filter(l=>/ pass$| fail$| skip$|expect\(\) calls|^Ran |error TS/.test(l.trim())).slice(-12)};results.push(row);console.log(JSON.stringify(row));verify();if(p.status!==0)break;}
const result={reviewTask:before.reviewTask,results,preservedHarnessPins:before.preserved.length,candidateSourcePins:2,allBeforeAfterPinsExact:true,allThreeExit0:results.length===3&&results.every(r=>r.exit===0),fullNotStarted:true,fullWaitsForOtherSimulatorFullNaturalCompletion:true,noGlobalL7L8OrNativeAcceptance:true};
writeFileSync(phase+'/l5-budget-main-crossed-gates.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));if(!result.allThreeExit0)process.exitCode=1;
