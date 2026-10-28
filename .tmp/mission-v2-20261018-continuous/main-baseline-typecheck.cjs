// Parent-only static compiler invocation; no product module is imported/executed.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-continuous';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const guard=JSON.parse(fs.readFileSync(base+'/l8-central-preflight/supplement/inputs/CURRENT_MAIN_HARNESS_GUARD.json','utf8'));
function guardCheck(){for(const f of guard.files){if(f.kind==='symlink-not-followed')continue;const b=fs.readFileSync(root+'/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Main guard drift '+f.path);}}
guardCheck();const dir='C:/Users/djden/AppData/Local/Temp/opencode/L8-TSC-BASELINE-'+Date.now();fs.mkdirSync(dir);fs.mkdirSync(dir+'/temp');fs.mkdirSync(dir+'/node-cache');
const ts=root+'/tools/ff8-harness/node_modules/typescript',bin=ts+'/bin/tsc',pkg=JSON.parse(fs.readFileSync(ts+'/package.json','utf8'));
const toolFiles=[process.execPath,bin,ts+'/lib/tsc.js',...(fs.existsSync(ts+'/lib/_tsc.js')?[ts+'/lib/_tsc.js']:[])].map(p=>({path:p,sha256:sha(fs.readFileSync(p))}));
const argv=[bin,'--noEmit','-p',root+'/tools/ff8-harness/tsconfig.json'];const at=Date.now();
let run;if(process.env.NODE_OPTIONS&&process.env.NODE_OPTIONS.trim())run={status:null,signal:null,error:Error('NODE_OPTIONS present: dynamic preload not silently cleared'),stdout:'',stderr:''};
else run=cp.spawnSync(process.execPath,argv,{cwd:root+'/tools/ff8-harness',env:{...process.env,TEMP:dir+'/temp',TMP:dir+'/temp',NODE_COMPILE_CACHE:dir+'/node-cache'},encoding:'utf8',timeout:120000,maxBuffer:1048576,killSignal:'SIGKILL',windowsHide:true});
const r={at:new Date().toISOString(),gate:'MAIN_BASELINE_TYPECHECK_GATE.md',typescriptVersion:pkg.version,node:process.execPath,toolFiles,argv,ownedScratch:dir,exitCode:run.status,signal:run.signal,error:run.error?String(run.error.message):null,elapsedMs:Date.now()-at,stdout:run.stdout||'',stderr:run.stderr||'',productImported:false,testsRun:false,preGuardFiles:guard.files.length};
guardCheck();r.postGuardExact=true;fs.writeFileSync(dir+'/receipt.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});fs.chmodSync(dir+'/receipt.json',0o444);fs.writeFileSync(base+'/main-baseline-typecheck-receipt.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});fs.chmodSync(base+'/main-baseline-typecheck-receipt.json',0o444);
console.log(JSON.stringify({exitCode:r.exitCode,error:r.error,elapsedMs:r.elapsedMs,typescriptVersion:pkg.version,guardFiles:r.preGuardFiles,postGuardExact:true,diagnostics:(r.stdout+r.stderr).slice(0,10000),scratch:dir}));if(run.status!==0)process.exitCode=2;
