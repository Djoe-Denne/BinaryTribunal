// Parent phase1 ONLY: public dependency metadata + lock, no package installation.
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const own='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-179';
const node='C:/Program Files/nodejs/node.exe',npm='C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(v,m)=>{if(!v)throw Error(m);};
need(!existsSync(own),'Owned namespace exists; preserve it, no retry');
need(sha(readFileSync(node))==='f13ac3ca23248dc389507e8fe38c34489ab7edb3e6d6700eb6da6a0b7e128eaf','Node pin changed');
need(sha(readFileSync(npm))==='3ce7cba6f5128dd5f54c98b6a5036b0f850496878cc2e21044b675fe3c594e3e','npm launcher changed');
need(JSON.parse(readFileSync('C:/Program Files/nodejs/node_modules/npm/package.json','utf8')).version==='11.6.2','npm version changed');
mkdirSync(own);
for(const name of ['home','appdata','localappdata','tmp','npm-cache'])mkdirSync(join(own,name));
const userconfig=join(own,'user.npmrc'),globalconfig=join(own,'global.npmrc');
writeFileSync(userconfig,'',{flag:'wx'});writeFileSync(globalconfig,'',{flag:'wx'});
const dependencies={'@opencode/server':'2.2.1','@opencode/util':'2.2.1','effect':'4.0.1','@effect/platform-node':'4.0.1'};
writeFileSync(join(own,'package.json'),JSON.stringify({name:'rms-owned-host-preflight-179',version:'0.0.0',private:true,dependencies},null,2)+'\n',{flag:'wx'});
const env={SystemRoot:'C:\\Windows',WINDIR:'C:\\Windows',ComSpec:'C:\\Windows\\System32\\cmd.exe',
  PATH:'C:\\Program Files\\nodejs;C:\\Windows\\System32;C:\\Windows',OS:'Windows_NT',
  HOME:join(own,'home'),USERPROFILE:join(own,'home'),APPDATA:join(own,'appdata'),LOCALAPPDATA:join(own,'localappdata'),
  TEMP:join(own,'tmp'),TMP:join(own,'tmp'),NPM_CONFIG_USERCONFIG:userconfig,NPM_CONFIG_GLOBALCONFIG:globalconfig,
  NPM_CONFIG_CACHE:join(own,'npm-cache'),NPM_CONFIG_REGISTRY:'https://registry.npmjs.org',NPM_CONFIG_IGNORE_SCRIPTS:'true'};
const argv=[npm,'install','--package-lock-only','--ignore-scripts','--no-audit','--no-fund','--global=false',
  '--registry=https://registry.npmjs.org','--cache='+join(own,'npm-cache'),'--userconfig='+userconfig,'--globalconfig='+globalconfig];
writeFileSync(join(own,'invocation.json'),JSON.stringify({version:'rms-host-dependency-metadata-invocation-v1',
  executable:node,argv,cwd:own,environmentKeys:Object.keys(env),inheritedEnvironment:false,timeoutMs:120000,
  nodeVersion:'v24.11.1',npmVersion:'11.6.2',intent:'package-lock metadata only; no node_modules/scripts/bootstrap/model'},null,2)+'\n',{flag:'wx'});
const started=Date.now();
const r=spawnSync(node,argv,{cwd:own,env,encoding:'utf8',timeout:120000,maxBuffer:1000000,windowsHide:true});
writeFileSync(join(own,'npm.stdout.log'),r.stdout??'',{flag:'wx'});
writeFileSync(join(own,'npm.stderr.log'),r.stderr??'',{flag:'wx'});
const summary={version:'rms-host-dependency-metadata-receipt-v1',status:'RESOLUTION_FAILED_PRESERVE_STATE',
  namespace:own,exit:r.status,error:r.error?.code??null,durationMs:Date.now()-started,
  nodeModulesPresent:existsSync(join(own,'node_modules')),scriptsRequested:false,bootstrapStarted:false,serverStarted:false,
  nativeSessionsCreated:0,modelRequests:0,newRmsOrigins:0};
try{
  need(r.status===0&&!r.error,'Metadata resolution failed; preserve logs without retry');
  need(!summary.nodeModulesPresent,'Unexpected node_modules; no phase2 allowed');
  const p=join(own,'package-lock.json'),b=readFileSync(p),lock=JSON.parse(b),entries=Object.entries(lock.packages??{}).filter(([key])=>key!=='');
  need(lock.lockfileVersion===3&&entries.length>0,'Expected full v3 dependency lock');
  const foreign=[],missingIntegrity=[];
  for(const [name,v] of entries){
    if(typeof v.resolved!=='string'||!v.resolved.startsWith('https://registry.npmjs.org/'))foreign.push(name);
    if(typeof v.integrity!=='string'||!/^sha(256|384|512|1)-[A-Za-z0-9+/=]+$/.test(v.integrity))missingIntegrity.push(name);
  }
  for(const [name,version]of Object.entries(dependencies))need(lock.packages['node_modules/'+name]?.version===version,'Root version diverged');
  Object.assign(summary,{lock:{path:p,byteLength:b.length,sha256:sha(b)},packageCount:entries.length,
    installScriptPackages:entries.filter(([,v])=>v.hasInstallScript).map(([name,v])=>({name,version:v.version,optional:v.optional===true})),
    foreignResolutions:foreign,missingIntegrity,
    optionalWindowsPackages:entries.filter(([name,v])=>/win32|windows/.test(name)||v.os?.includes('win32')).map(([name,v])=>({name,version:v.version,os:v.os,cpu:v.cpu,optional:v.optional===true})),
    rootEngines:Object.fromEntries(Object.keys(dependencies).map(n=>[n,lock.packages['node_modules/'+n]?.engines??null]))});
  need(foreign.length===0&&missingIntegrity.length===0,'Lock resolution/integrity policy unresolved; no acquisition allowed');
  summary.status='METADATA_LOCK_CREATED_PHASE2_NOT_AUTHORIZED';
}catch(e){summary.failure=String(e?.message??e);}
writeFileSync(join(own,'metadata-receipt.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(summary));
if(summary.status!=='METADATA_LOCK_CREATED_PHASE2_NOT_AUTHORIZED')process.exitCode=1;
