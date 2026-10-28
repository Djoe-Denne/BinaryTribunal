// Parent-owned finite runner for S1 author tests and typing, report35.
// No shell, install, DB fixture, inspector, scientific450 replay or retry loop.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const D=path.dirname(fileURLToPath(import.meta.url)), C=path.join(D,'tools/ff8-harness');
const R='C:/Users/djden/source/repos/retro-eng/re-ff8';
const expected=path.join(R,'.tmp/m2-s1-candidate-r2');
const BUN='C:/Users/djden/.bun/bin/bun.exe';
const TSC=path.join(R,'tools/ff8-harness/node_modules/typescript/bin/tsc');
const TSAPI=path.join(R,'tools/ff8-harness/node_modules/typescript/lib/typescript.js');
const E=path.join(D,'evidence'), ledgerFile=path.join(E,'s1-run-ledger.json'), lockFile=path.join(E,'s1-run.lock');
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,s)=>{if(!ok)throw Error('S1 runner: '+s);};
const [check,reason,...rest]=process.argv.slice(2);
need(rest.length===0&&typeof reason==='string'&&reason.length>=8&&reason.length<=500,'check and bounded reason required');
const tests={envelope:'test/s1-author/envelope.test.ts',projection:'test/s1-author/projection.test.ts',prepare:'test/s1-author/prepare.test.ts',all:'test/s1-author'};
need(check==='typecheck'||Object.hasOwn(tests,check),'unknown check');
need(fs.realpathSync(D).toLowerCase()===fs.realpathSync(expected).toLowerCase(),'unexpected candidate root');
const initial=JSON.parse(fs.readFileSync(path.join(D,'projection-receipt.json')));
for(const f of initial.files){
  if(f.writableProduct)continue;
  const b=fs.readFileSync(f.destination);
  need(b.length===f.bytes&&sha(b)===f.sha256,'immutable dependency drift: '+f.path);
}
need(fs.readFileSync(path.join(C,'bunfig.toml')).length===0,'nonempty Bun config');
need(sha(fs.readFileSync(BUN))==='15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4','Bun drift');
need(sha(fs.readFileSync(TSAPI))==='3ae902c92cc44dace175c0e69e13a4b0899f6983c6121d76b9ab8dd5795e7675','TS drift');
const windows=process.env.SystemRoot||process.env.SYSTEMROOT;
need(typeof windows==='string'&&path.isAbsolute(windows)&&fs.existsSync(path.join(windows,'System32')),'invalid Windows path');
const lock=fs.openSync(lockFile,'wx');fs.closeSync(lock);
try{
  const ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile)): {testUsed:0,typingUsed:0,elapsedMs:0,blocked:false,runs:[]};
  need(!ledger.blocked,'previous tool/termination ambiguity; parent decision required');
  const typing=check==='typecheck';
  need(typing?ledger.typingUsed<6:ledger.testUsed<12,'budget exhausted'); // parent report45: next readonly boundary, one further typing, no reset
  const timeout=typing?60000:30000;
  need(ledger.elapsedMs+timeout<=600000,'remaining cumulative budget insufficient');
  const ordinal=ledger.runs.length+1, stem='author-'+String(ordinal).padStart(2,'0')+'-'+check;
  const envRoot=path.join(D,'run-environments',stem);
  fs.mkdirSync(envRoot,{recursive:true});
  for(const name of ['home','config','appdata','localappdata','temp'])fs.mkdirSync(path.join(envRoot,name));
  const env={SystemRoot:windows,WINDIR:windows,HOME:path.join(envRoot,'home'),USERPROFILE:path.join(envRoot,'home'),XDG_CONFIG_HOME:path.join(envRoot,'config'),APPDATA:path.join(envRoot,'appdata'),LOCALAPPDATA:path.join(envRoot,'localappdata'),TEMP:path.join(envRoot,'temp'),TMP:path.join(envRoot,'temp'),NO_COLOR:'1',FORCE_COLOR:'0',NODE_DISABLE_COMPILE_CACHE:'1',BUN_RUNTIME_TRANSPILER_CACHE_PATH:'0'};
  const args=typing?['--no-env-file','--config=./bunfig.toml',TSC,'--noEmit','-p','tsconfig.s1.json','--pretty','false']:['--no-env-file','--config=./bunfig.toml','test',tests[check],'--max-concurrency=1','--timeout','10000'];
  const record={ordinal,check,reason,at:new Date().toISOString(),state:'reserved',command:{executable:BUN,args,cwd:C,env,timeoutMs:timeout},sourceFiles:[]};
  for(const rel of [...initial.productWriteAllowlist,...initial.authorExtraAllowlist]){
    const p=path.join(C,rel);if(fs.existsSync(p)){const b=fs.readFileSync(p);record.sourceFiles.push({path:rel,bytes:b.length,sha256:sha(b)});}
  }
  if(typing)ledger.typingUsed++;else ledger.testUsed++;
  ledger.runs.push(record);
  fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
  fs.writeFileSync(path.join(E,stem+'.preflight.json'),JSON.stringify(record,null,2),{flag:'wx'});
  const start=Date.now();
  const run=spawnSync(BUN,args,{cwd:C,env,encoding:'utf8',timeout,maxBuffer:4*1024*1024,windowsHide:true});
  const elapsedMs=Date.now()-start;
  fs.writeFileSync(path.join(E,stem+'.stdout.log'),run.stdout||'',{flag:'wx'});
  fs.writeFileSync(path.join(E,stem+'.stderr.log'),run.stderr||'',{flag:'wx'});
  Object.assign(record,{state:'finished',elapsedMs,status:run.status,signal:run.signal,error:run.error?{code:run.error.code,message:String(run.error.message).slice(0,700)}:null,stdoutSha256:sha(run.stdout||''),stderrSha256:sha(run.stderr||''),acceptance:'TARGETED_RESULT_ONLY_NOT_S1_OR_M2_ACCEPTANCE'});
  ledger.elapsedMs+=elapsedMs;
  if(run.error||run.signal||run.status===null)ledger.blocked=true;
  fs.writeFileSync(path.join(E,stem+'.result.json'),JSON.stringify(record,null,2),{flag:'wx'});
  fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
  const lines=((run.stdout||'')+'\n'+(run.stderr||'')).split('\n');
  console.log(JSON.stringify({check,ordinal,status:run.status,signal:run.signal,error:record.error,elapsedMs,budget:{tests:ledger.testUsed,typing:ledger.typingUsed,elapsedMs:ledger.elapsedMs,blocked:ledger.blocked},diagnostics:lines.filter(s=>/error TS|\(fail\)|\(pass\)| pass| fail| skip|expect\(\) calls|Ran \d+ tests/.test(s)).slice(-24),receipt:path.join(E,stem+'.result.json')},null,2));
  process.exitCode=run.status===0&&!run.error&&!run.signal?0:2;
}finally{fs.unlinkSync(lockFile);}
