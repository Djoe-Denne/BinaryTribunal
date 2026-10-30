// Explicit artifact/file acquisition ONLY. Never imports target packages or boots a host.
import {existsSync,lstatSync,readdirSync,readFileSync,writeFileSync,statfsSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const own='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180';
const cache='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-179/npm-cache';
const node='C:/Program Files/nodejs/node.exe',npm='C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,m)=>{if(!v)throw Error(m);};
const output=join(own,'acquisition-receipt.json');
need(!existsSync(output)&&!existsSync(join(own,'node_modules')),'Acquisition state exists; preserve, no retry');
need(!existsSync(join(own,'.npmrc')),'Unexpected project config');
need(sha(readFileSync(own+'/package-lock.json'))==='fedb6261e020da2da938614d7e0a1185dc597c212cf77fc07d454746a9eaf04e','Lock180 changed');
need(sha(readFileSync(own+'/package.json'))==='961d24337787eeff90455aa98df2321376c73e4e4125ca80cec4a312c575c9ee','Descriptor180 changed');
need(sha(readFileSync(node))==='f13ac3ca23248dc389507e8fe38c34489ab7edb3e6d6700eb6da6a0b7e128eaf'
  &&sha(readFileSync(npm))==='3ce7cba6f5128dd5f54c98b6a5036b0f850496878cc2e21044b675fe3c594e3e','Tool pin changed');
const uc=join(own,'user.npmrc'),gc=join(own,'global.npmrc');
need(readFileSync(uc).length===0&&readFileSync(gc).length===0,'Owned npm configs changed');
const fs=statfsSync(own,{bigint:true}),available=fs.bavail*fs.bsize;
need(available>=3n*1024n**3n,'Insufficient free capacity for bounded acquisition');
function inventory(root){let files=0,links=0,bytes=0,entries=0;const visit=p=>{for(const e of readdirSync(p,{withFileTypes:true})){
  need(++entries<=180000,'File-inventory safety bound exceeded');const file=join(p,e.name),s=lstatSync(file);
  if(s.isSymbolicLink()){links++;continue;}if(s.isDirectory())visit(file);else if(s.isFile()){files++;bytes+=s.size;}
}};if(existsSync(root))visit(root);return{files,links,bytes,entries};}
const beforeCache=inventory(cache),env={SystemRoot:'C:\\Windows',WINDIR:'C:\\Windows',ComSpec:'C:\\Windows\\System32\\cmd.exe',
  PATH:'C:\\Program Files\\nodejs;C:\\Windows\\System32;C:\\Windows',OS:'Windows_NT',HOME:join(own,'home'),USERPROFILE:join(own,'home'),
  APPDATA:join(own,'appdata'),LOCALAPPDATA:join(own,'localappdata'),TEMP:join(own,'tmp'),TMP:join(own,'tmp'),
  NPM_CONFIG_USERCONFIG:uc,NPM_CONFIG_GLOBALCONFIG:gc,NPM_CONFIG_CACHE:cache,
  NPM_CONFIG_REGISTRY:'https://registry.npmjs.org',NPM_CONFIG_IGNORE_SCRIPTS:'true'};
const argv=[npm,'ci','--ignore-scripts','--strict-peer-deps','--no-audit','--no-fund','--omit=dev','--os=win32','--cpu=x64',
  '--fetch-retries=0','--global=false','--registry=https://registry.npmjs.org','--cache='+cache,'--userconfig='+uc,'--globalconfig='+gc];
writeFileSync(join(own,'acquisition-invocation.json'),JSON.stringify({executable:node,argv,cwd:own,timeoutMs:120000,
  environmentKeys:Object.keys(env),inheritedEnvironment:false,freeBytesBefore:available.toString(),beforeCache,
  limits:'Additional node_modules/cache footprint acceptance <=1GiB measured after command, not hard in-flight quota',
  intent:'Install pinned files with scripts disabled; no target import, server, model or global change'},null,2)+'\n',{flag:'wx'});
const started=Date.now(),r=spawnSync(node,argv,{cwd:own,env,encoding:'utf8',timeout:120000,maxBuffer:1000000,windowsHide:true});
writeFileSync(join(own,'acquisition.stdout.log'),r.stdout??'',{flag:'wx'});
writeFileSync(join(own,'acquisition.stderr.log'),r.stderr??'',{flag:'wx'});
const receipt={version:'rms-owned-host-file-acquisition-v1',status:'ACQUISITION_NOT_RECEIVED_PRESERVE_STATE',exit:r.status,
  error:r.error?.code??null,durationMs:Date.now()-started,namespace:own,codeImported:false,lifecycleScriptsAuthorized:false,
  nativeBuildAuthorized:false,bootstrapStarted:false,serverStarted:false,nativeSessionsCreated:0,modelRequests:0,newRmsOrigins:0};
try{
  const afterCache=inventory(cache),modules=inventory(join(own,'node_modules'));
  const growth=modules.bytes+Math.max(0,afterCache.bytes-beforeCache.bytes);
  Object.assign(receipt,{beforeCache,afterCache,modules,additionalMeasuredBytes:growth,
    postAcquisitionBudgetBytes:1073741824,inFlightByteQuotaEnforced:false,
    lockUnchanged:sha(readFileSync(own+'/package-lock.json'))==='fedb6261e020da2da938614d7e0a1185dc597c212cf77fc07d454746a9eaf04e',
    engineWarningPreserved:/EBADENGINE/.test(r.stderr??''),peerWarning:/ERESOLVE/.test(r.stderr??'')});
  need(r.status===0&&!r.error,'npm acquisition refused or timed out');
  need(receipt.lockUnchanged&&!receipt.peerWarning,'Lock or peers changed');
  need(growth<=1073741824,'Post-acquisition footprint exceeds accepted budget; do not boot');
  const roots={};for(const name of ['@opencode/server','@opencode/util','effect','@effect/platform-node','@effect/platform-node-shared']){
    const p=join(own,'node_modules',name,'package.json'),b=readFileSync(p),v=JSON.parse(b);
    const expected=name.startsWith('@opencode/')?'2.2.1':'4.0.1';need(v.name===name&&v.version===expected,'Installed root version differs');
    roots[name]={version:v.version,packageJsonSha256:sha(b)};
  }
  receipt.installedRootMetadata=roots;receipt.status='FILES_ACQUIRED_ONLY_NATIVE_ASSET_AND_BOOT_GATES_PENDING';
}catch(e){receipt.failure=String(e?.message??e);}
writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
if(receipt.status!=='FILES_ACQUIRED_ONLY_NATIVE_ASSET_AND_BOOT_GATES_PENDING')process.exitCode=1;
