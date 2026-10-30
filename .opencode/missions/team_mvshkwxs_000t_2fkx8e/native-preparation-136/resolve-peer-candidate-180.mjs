// Explicit new metadata candidate, not a replacement/install of host179.
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const previous='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-179';
const own='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180';
const node='C:/Program Files/nodejs/node.exe',npm='C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,m)=>{if(!v)throw Error(m);};
need(!existsSync(own),'New candidate already exists; no overwrite/retry');
need(sha(readFileSync(previous+'/package-lock.json'))==='014246a6c04d67f20ff63c7729177eccf5993f84e9c3710203bbd0a7f155fd49','Historical lock changed');
need(sha(readFileSync(previous+'/package.json'))==='73d535c1d877d32d1569da07764e24b1f51cb444d2acc25b896ef974768e380f','Historical descriptor changed');
need(sha(readFileSync(node))==='f13ac3ca23248dc389507e8fe38c34489ab7edb3e6d6700eb6da6a0b7e128eaf'
  &&sha(readFileSync(npm))==='3ce7cba6f5128dd5f54c98b6a5036b0f850496878cc2e21044b675fe3c594e3e','Tool pin changed');
const descriptor=JSON.parse(readFileSync(previous+'/package.json','utf8'));
descriptor.name='rms-owned-host-preflight-180';
descriptor.overrides={'@effect/platform-node@4.0.1':{'@effect/platform-node-shared':'4.0.1'}};
mkdirSync(own);for(const d of ['home','appdata','localappdata','tmp'])mkdirSync(join(own,d));
const uc=join(own,'user.npmrc'),gc=join(own,'global.npmrc');writeFileSync(uc,'',{flag:'wx'});writeFileSync(gc,'',{flag:'wx'});
writeFileSync(join(own,'package.json'),JSON.stringify(descriptor,null,2)+'\n',{flag:'wx'});
const cache=join(previous,'npm-cache');
const env={SystemRoot:'C:\\Windows',WINDIR:'C:\\Windows',ComSpec:'C:\\Windows\\System32\\cmd.exe',
  PATH:'C:\\Program Files\\nodejs;C:\\Windows\\System32;C:\\Windows',OS:'Windows_NT',HOME:join(own,'home'),USERPROFILE:join(own,'home'),
  APPDATA:join(own,'appdata'),LOCALAPPDATA:join(own,'localappdata'),TEMP:join(own,'tmp'),TMP:join(own,'tmp'),
  NPM_CONFIG_USERCONFIG:uc,NPM_CONFIG_GLOBALCONFIG:gc,NPM_CONFIG_CACHE:cache,
  NPM_CONFIG_REGISTRY:'https://registry.npmjs.org',NPM_CONFIG_IGNORE_SCRIPTS:'true',NPM_CONFIG_OFFLINE:'true'};
const argv=[npm,'install','--offline','--strict-peer-deps','--package-lock-only','--ignore-scripts','--no-audit','--no-fund','--global=false',
  '--registry=https://registry.npmjs.org','--cache='+cache,'--userconfig='+uc,'--globalconfig='+gc];
writeFileSync(join(own,'invocation.json'),JSON.stringify({executable:node,argv,cwd:own,environmentKeys:Object.keys(env),inheritedEnvironment:false,
  timeoutMs:120000,descriptorDecision:'Scoped shared4.0.1 selection within ^4.0.1, satisfying Effect^4.0.1; no force/legacy-peer-deps',
  previousLock:'014246a6c04d67f20ff63c7729177eccf5993f84e9c3710203bbd0a7f155fd49'},null,2)+'\n',{flag:'wx'});
const t=Date.now(),r=spawnSync(node,argv,{cwd:own,env,encoding:'utf8',timeout:120000,maxBuffer:1000000,windowsHide:true});
writeFileSync(join(own,'npm.stdout.log'),r.stdout??'',{flag:'wx'});writeFileSync(join(own,'npm.stderr.log'),r.stderr??'',{flag:'wx'});
const receipt={version:'rms-peer-corrected-metadata-candidate-v1',namespace:own,exit:r.status,error:r.error?.code??null,durationMs:Date.now()-t,
  status:'REFUSED_PRESERVE_CANDIDATE_NO_RETRY',offlineRequested:true,strictPeers:true,nodeModulesPresent:existsSync(join(own,'node_modules')),
  runtimeAccepted:false,acquisitionAuthorized:false,bootstrapStarted:false,newRmsOrigins:0};
try{
  need(r.status===0&&!r.error&&!receipt.nodeModulesPresent,'Offline strict metadata resolution refused');
  need(!/ERESOLVE/.test(r.stderr??''),'Unresolved peer warning remains');
  const b=readFileSync(join(own,'package-lock.json')),j=JSON.parse(b),entries=Object.entries(j.packages).filter(([k])=>k);
  const shared=entries.filter(([k])=>k.endsWith('/@effect/platform-node-shared')).map(([path,v])=>({path,version:v.version,peerEffect:v.peerDependencies?.effect}));
  need(shared.length>0&&shared.every(v=>v.version==='4.0.1'&&v.peerEffect==='^4.0.1'),'Shared peer family not closed');
  need(j.packages['node_modules/effect']?.version==='4.0.1','Root Effect changed');
  need(entries.every(([,v])=>v.resolved?.startsWith('https://registry.npmjs.org/')&&v.integrity),'Registry/integrity fields missing');
  need(sha(readFileSync(previous+'/package-lock.json'))==='014246a6c04d67f20ff63c7729177eccf5993f84e9c3710203bbd0a7f155fd49','Historical lock changed during new resolution');
  Object.assign(receipt,{status:'STRICT_PEER_METADATA_READY_REVIEW_PENDING',packageCount:entries.length,
    lock:{path:join(own,'package-lock.json'),byteLength:b.length,sha256:sha(b)},shared,
    engineWarningsPreserved:/EBADENGINE/.test(r.stderr??''),stderrWarningExcerpt:(r.stderr??'').slice(0,1500),
    historicalLockUnchanged:true,scriptPackages:entries.filter(([,v])=>v.hasInstallScript).map(([path,v])=>({path,version:v.version}))});
}catch(e){receipt.failure=String(e?.message??e);}
writeFileSync(join(own,'metadata-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt));if(receipt.status!=='STRICT_PEER_METADATA_READY_REVIEW_PENDING')process.exitCode=1;
