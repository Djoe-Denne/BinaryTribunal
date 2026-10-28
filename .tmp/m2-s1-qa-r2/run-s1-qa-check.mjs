// Parent-owned finite independent QA runner, report48. No product code imports.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const Q=path.dirname(fileURLToPath(import.meta.url)),C=path.join(Q,'tools/ff8-harness');
const R='C:/Users/djden/source/repos/retro-eng/re-ff8';
const BUN='C:/Users/djden/.bun/bin/bun.exe',TSC=path.join(R,'tools/ff8-harness/node_modules/typescript/bin/tsc');
const E=path.join(Q,'evidence'),ledgerFile=path.join(E,'qa-run-ledger.json'),lockFile=path.join(E,'qa-run.lock');
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,s)=>{if(!ok)throw Error('S1 QA runner: '+s);};
const [check,reason,...rest]=process.argv.slice(2);
const kinds=['wire-run','root-sources','knowledge','fixed-projection','isolation','typecheck'];
need(kinds.includes(check)&&rest.length===0&&typeof reason==='string'&&reason.length>=8&&reason.length<=500,'check and bounded reason required');
need(fs.realpathSync(Q).toLowerCase()===fs.realpathSync(path.join(R,'.tmp/m2-s1-qa-r2')).toLowerCase(),'unexpected namespace');
const projection=JSON.parse(fs.readFileSync(path.join(Q,'projection-receipt.json')));
for(const f of projection.files){const b=fs.readFileSync(f.destination);need(b.length===f.bytes&&sha(b)===f.sha256,'readonly candidate drift '+f.path);}
for(const f of projection.controls){const b=fs.readFileSync(path.join(Q,f.path));need(b.length===f.bytes&&sha(b)===f.sha256,'parent control changed '+f.path);}
need(fs.existsSync(path.join(Q,'reports/plan-and-cases.md')),'independent case ledger required before execution');
need(sha(fs.readFileSync(BUN))==='15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4','Bun drift');
need(sha(fs.readFileSync(path.join(R,'tools/ff8-harness/node_modules/typescript/lib/typescript.js')))==='3ae902c92cc44dace175c0e69e13a4b0899f6983c6121d76b9ab8dd5795e7675','TS API drift');
const windows=process.env.SystemRoot||process.env.SYSTEMROOT;
need(typeof windows==='string'&&path.isAbsolute(windows)&&fs.existsSync(path.join(windows,'System32')),'Windows path invalid');
const sourcePaths=[...kinds.filter(k=>k!=='typecheck').map(k=>'test/s1-qa/'+k+'.test.ts'),...['manual-base','manual-root','manual-knowledge','manual-context'].map(k=>'test/s1-qa/fixtures/'+k+'.ts'),...['cases','wire'].map(k=>'test/s1-qa/oracle/'+k+'.ts'),'tsconfig.s1-qa.json'];
const sourceFiles=sourcePaths.filter(p=>fs.existsSync(path.join(C,p))).map(p=>{const b=fs.readFileSync(path.join(C,p));return{path:p,bytes:b.length,sha256:sha(b)};});
const sourceSetSha256=sha(JSON.stringify(sourceFiles));
const fd=fs.openSync(lockFile,'wx');fs.closeSync(fd);
try{
  const ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile)):{runs:[],counts:{},repeatsUsed:0,elapsedMs:0,blocked:false};
  need(!ledger.blocked,'previous tool/termination ambiguity; parent decision required');
  need(ledger.runs.every(r=>r.state==='finished'),'prior invocation incomplete; no retry');
  need(ledger.runs.length<15,'fifteen-invocation cap exhausted'); // parent report54: localized QA corrections, no reset
  const completion=ledger.runs.slice(11);
  need(completion.every(r=>r.status===0),'report54 package closed after red group');
  const expected=['typecheck','root-sources','knowledge','isolation'][completion.length];
  need(check===expected,'report54 fixed sequence; no additional invocation');
  need(completion.length===0||completion[0].sourceSetSha256===sourceSetSha256,'report54 source edits between checks forbidden');
  const repeat=(ledger.counts[check]||0)>0;
  need(!repeat||ledger.repeatsUsed<9,'nine targeted repeats exhausted'); // report54: typing, root, isolation; knowledge initial
  const old=ledger.runs.filter(r=>r.check===check).at(-1);
  need(!(old?.status===0&&old.sourceSetSha256===sourceSetSha256),'unchanged valid result must be reused');
  const timeout=check==='typecheck'?60000:30000;
  need(ledger.elapsedMs+timeout<=300000,'remaining300s insufficient');
  const ordinal=ledger.runs.length+1,stem='qa-'+String(ordinal).padStart(2,'0')+'-'+check;
  const envRoot=path.join(Q,'run-environments',stem);fs.mkdirSync(envRoot,{recursive:true});
  for(const n of ['home','config','appdata','localappdata','temp'])fs.mkdirSync(path.join(envRoot,n));
  const env={SystemRoot:windows,WINDIR:windows,HOME:path.join(envRoot,'home'),USERPROFILE:path.join(envRoot,'home'),XDG_CONFIG_HOME:path.join(envRoot,'config'),APPDATA:path.join(envRoot,'appdata'),LOCALAPPDATA:path.join(envRoot,'localappdata'),TEMP:path.join(envRoot,'temp'),TMP:path.join(envRoot,'temp'),NO_COLOR:'1',FORCE_COLOR:'0',NODE_DISABLE_COMPILE_CACHE:'1',BUN_RUNTIME_TRANSPILER_CACHE_PATH:'0'};
  const args=check==='typecheck'?['--no-env-file','--config=./bunfig.toml',TSC,'--noEmit','-p','tsconfig.s1-qa.json','--pretty','false']:['--no-env-file','--config=./bunfig.toml','test','test/s1-qa/'+check+'.test.ts','--max-concurrency=1','--timeout','10000'];
  const record={ordinal,check,reason,at:new Date().toISOString(),state:'reserved',repeat,sourceFiles,sourceSetSha256,caseLedgerSha256:sha(fs.readFileSync(path.join(Q,'reports/plan-and-cases.md'))),candidateManifestSha256:projection.candidateManifestSha256,command:{executable:BUN,args,cwd:C,env,timeoutMs:timeout}};
  ledger.counts[check]=(ledger.counts[check]||0)+1;if(repeat)ledger.repeatsUsed++;
  ledger.runs.push(record);fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
  fs.writeFileSync(path.join(E,stem+'.preflight.json'),JSON.stringify(record,null,2),{flag:'wx'});
  const start=Date.now(),run=spawnSync(BUN,args,{cwd:C,env,encoding:'utf8',timeout,maxBuffer:4*1024*1024,windowsHide:true});
  const elapsedMs=Date.now()-start;
  fs.writeFileSync(path.join(E,stem+'.stdout.log'),run.stdout||'',{flag:'wx'});fs.writeFileSync(path.join(E,stem+'.stderr.log'),run.stderr||'',{flag:'wx'});
  Object.assign(record,{state:'finished',elapsedMs,status:run.status,signal:run.signal,error:run.error?{code:run.error.code,message:String(run.error.message).slice(0,700)}:null,stdoutSha256:sha(run.stdout||''),stderrSha256:sha(run.stderr||''),acceptance:'INDEPENDENT_QA_OBSERVATION_NOT_M2_ACCEPTANCE'});
  ledger.elapsedMs+=elapsedMs;if(run.error||run.signal||run.status===null)ledger.blocked=true;
  fs.writeFileSync(path.join(E,stem+'.result.json'),JSON.stringify(record,null,2),{flag:'wx'});fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
  const lines=((run.stdout||'')+String.fromCharCode(10)+(run.stderr||'')).split(String.fromCharCode(10));
  console.log(JSON.stringify({check,ordinal,status:run.status,signal:run.signal,error:record.error,elapsedMs,budget:{used:ledger.runs.length,repeats:ledger.repeatsUsed,elapsedMs:ledger.elapsedMs,blocked:ledger.blocked},selected:lines.filter(s=>s.includes('error TS')||s.includes('(fail)')||s.includes(' pass')||s.includes(' fail')||s.includes(' skip')||s.includes('expect() calls')||s.startsWith('Ran ')).slice(-24),receipt:path.join(E,stem+'.result.json')},null,2));
  process.exitCode=run.status===0&&!run.error&&!run.signal?0:2;
}finally{fs.unlinkSync(lockFile);}
