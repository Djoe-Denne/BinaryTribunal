// Provenance of acquired PUBLIC files only; never imports target application code.
import {existsSync,mkdirSync,readdirSync,lstatSync,readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const cc=createRequire('C:/Program Files/nodejs/node_modules/npm/package.json')('cacache');
const own='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180',modules=join(own,'node_modules');
const cache='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-179/npm-cache/_cacache';
const out=join(own,'provenance');
const need=(v,m)=>{if(!v)throw Error(m);};
const digest=(b,a='sha256',encoding='hex')=>createHash(a).update(b).digest(encoding);
if(existsSync(out)){
  need(!lstatSync(out).isSymbolicLink()&&readdirSync(out).every(name=>name==='server-2.2.1.tgz'),
    'Only preserved first-attempt server archive may exist; no overwrite of completed evidence');
}
const lockBytes=readFileSync(own+'/package-lock.json');need(digest(lockBytes)==='fedb6261e020da2da938614d7e0a1185dc597c212cf77fc07d454746a9eaf04e','Lock changed');
const lock=JSON.parse(lockBytes),index=await cc.ls(cache),keys=new Map();
const urlKey=u=>{const v=new URL(u);return v.origin+decodeURIComponent(v.pathname)+v.search;};
for(const key of Object.keys(index)){
  const prefix='make-fetch-happen:request-cache:';if(!key.startsWith(prefix))continue;
  const url=key.slice(prefix.length);if(new URL(url).origin==='https://registry.npmjs.org'&&url.includes('/-/'))keys.set(urlKey(url),key);
}
const allows=(list,target)=>!Array.isArray(list)||list.length===0||(!list.includes('!'+target)
  &&(!list.some(v=>!v.startsWith('!'))||list.includes(target)||list.includes('any')));
const installed=[],absent=[],artifacts=new Map();
for(const [path,v]of Object.entries(lock.packages)){
  if(!path)continue;const file=join(own,path,'package.json');
  if(!existsSync(file)){
    absent.push({path,version:v.version,optional:v.optional===true,platformCompatible:allows(v.os,'win32')&&allows(v.cpu,'x64')});
    need(v.optional===true||v.dev===true||!allows(v.os,'win32')||!allows(v.cpu,'x64'),'Required package metadata absent: '+path);continue;
  }
  const b=readFileSync(file),p=JSON.parse(b);need(p.version===v.version,'Installed version differs: '+path);
  const row={path,name:p.name,version:p.version,packageJsonSha256:digest(b),resolved:v.resolved,integrity:v.integrity};
  installed.push(row);const k=v.resolved+'|'+v.integrity,g=artifacts.get(k)??{name:p.name,version:p.version,resolved:v.resolved,integrity:v.integrity,packagePaths:[]};
  g.packagePaths.push(path);artifacts.set(k,g);
}
if(!existsSync(out))mkdirSync(out);
const archives=[];let archiveBytes=0,serverArtifact=null;
for(const a of artifacts.values()){
  const key=keys.get(urlKey(a.resolved));need(key&&index[key].size<=134217728,'Required archive missing/too large in owned cache: '+a.name);
  const {data}=await cc.get(cache,key);need('sha512-'+digest(data,'sha512','base64')===a.integrity,'Actual archive SRI mismatch: '+a.name);
  const row={...a,rawByteLength:data.length,sha256:digest(data),sriMatched:true};archives.push(row);archiveBytes+=data.length;
  if(a.name==='@opencode/server'&&a.version==='2.2.1'){
    const path=join(out,'server-2.2.1.tgz');
    if(existsSync(path))need(readFileSync(path).equals(data),'Preserved server archive differs');
    else writeFileSync(path,data,{flag:'wx'});
    need(digest(readFileSync(path))===row.sha256,'Server artifact exact readback differs');
    serverArtifact={path,byteLength:data.length,sha256:row.sha256,integrity:a.integrity,
      meaning:'Actual published JS distribution archive consumed, not a desktop binary/source or complete dependency closure by itself'};
  }
}
need(serverArtifact,'Actual server archive not captured');
const save=(name,data)=>{const p=join(out,name),b=Buffer.from(JSON.stringify(data,null,2)+'\n');writeFileSync(p,b,{flag:'wx'});need(readFileSync(p).equals(b),'Generated manifest readback differs');return{path:p,byteLength:b.length,sha256:digest(b)};};
const archiveManifest=save('archives.json',{version:'rms-acquired-npm-archives-v1',lockSha256:digest(lockBytes),installed,absent,archives,
  archiveCount:archives.length,uniqueRawArchiveBytes:archiveBytes,serverArtifact,signaturesOrAttestationsVerified:false});
console.log(JSON.stringify({phase:'archives-complete',archives:archives.length,installedPackages:installed.length}));
need(realpathSync(modules).toLowerCase()===resolve(modules).toLowerCase(),'Package root alias refused');
const files=[];let totalBytes=0;
const walk=dir=>{for(const name of readdirSync(dir).sort()){
  const path=join(dir,name),before=lstatSync(path,{bigint:true});need(!before.isSymbolicLink(),'Package alias refused: '+relative(modules,path));
  if(before.isDirectory()){walk(path);continue;}need(before.isFile(),'Unexpected package file kind');
  need(files.length<50000&&before.size<=134217728n,'Package file inventory bound exceeded');
  const bytes=readFileSync(path),after=lstatSync(path,{bigint:true});
  need(before.ino===after.ino&&before.size===after.size&&before.mtimeMs===after.mtimeMs&&BigInt(bytes.length)===after.size,'Package changed during hash');
  files.push({path:relative(modules,path).replaceAll('\\','/'),byteLength:bytes.length,sha256:digest(bytes)});totalBytes+=bytes.length;
  if(files.length%4000===0)console.log(JSON.stringify({phase:'file-hashing',files:files.length,bytes:totalBytes}));
}};walk(modules);
const fileManifest=save('installed-files.json',{version:'rms-owned-installed-file-closure-v1',root:modules,
  lockSha256:digest(lockBytes),fileCount:files.length,totalBytes,files,meaning:'Actual installed bytes pinned before application import, not proof of loading or in-memory equivalence'});
const receipt=save('receipt.json',{version:'rms-host-file-provenance-receipt-v1',status:'PUBLIC_ARCHIVES_AND_INSTALLED_FILES_PINNED_BOOT_NOT_AUTHORIZED',
  archiveManifest,fileManifest,serverArtifact,installedPackages:installed.length,absentLockedEntries:absent.length,
  archiveSrisMatched:archives.length,codeFilesHashed:files.length,codeBytesHashed:totalBytes,packageCodeImported:false,
  nativeAssetsLoaded:false,serverStarted:false,modelRequests:0,newRmsOrigins:0});
console.log(JSON.stringify({status:'PUBLIC_ARCHIVES_AND_INSTALLED_FILES_PINNED_BOOT_NOT_AUTHORIZED',archiveManifest,fileManifest,receipt,
  serverArtifact,installedPackages:installed.length,absentLockedEntries:absent.length,archiveSrisMatched:archives.length,
  codeFilesHashed:files.length,codeBytesHashed:totalBytes,modelRequests:0,newRmsOrigins:0}));
