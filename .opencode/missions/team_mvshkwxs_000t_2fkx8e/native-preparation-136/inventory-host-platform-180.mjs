// Fixed-lock inventory from owned public npm metadata cache; NOT a resolver.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const toolRequire=createRequire('C:/Program Files/nodejs/node_modules/npm/package.json');
const cacache=toolRequire('cacache');
const own='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180';
const cache='C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-179/npm-cache/_cacache';
const output=own+'/platform-metadata-inventory.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
if(existsSync(output))throw Error('Inventory exists; no overwrite');
const bytes=readFileSync(own+'/package-lock.json');
if(sha(bytes)!=='fedb6261e020da2da938614d7e0a1185dc597c212cf77fc07d454746a9eaf04e')throw Error('Lock candidate changed');
const lock=JSON.parse(bytes),index=await cacache.ls(cache),cacheKeys=new Map();
for(const key of Object.keys(index)){
  const prefix='make-fetch-happen:request-cache:';if(!key.startsWith(prefix))continue;
  const u=new URL(key.slice(prefix.length));if(u.origin!=='https://registry.npmjs.org'||u.pathname.includes('/-/'))continue;
  cacheKeys.set(decodeURIComponent(u.pathname.slice(1)),key);
}
const allows=(values,target)=>{
  if(!Array.isArray(values)||!values.length)return true;
  if(values.includes('!'+target))return false;
  const positive=values.filter(v=>!v.startsWith('!'));return !positive.length||positive.includes(target)||positive.includes('any');
};
const entries=Object.entries(lock.packages).filter(([key])=>key!=='');
const selected=entries.filter(([,v])=>allows(v.os,'win32')&&allows(v.cpu,'x64'));
const grouped=new Map();
for(const [path,v]of selected){const name=v.name??path.split('node_modules/').at(-1);const g=grouped.get(name)??[];g.push({path,name,version:v.version,os:v.os??null,cpu:v.cpu??null,optional:v.optional===true});grouped.set(name,g);}
const rows=[],missing=[];
for(const [name,group]of grouped){
  const key=cacheKeys.get(name);
  if(!key||index[key].size>67108864){missing.push({name,reason:key?'cache entry exceeds diagnostic read bound':'no owned cache key'});continue;}
  const {data}=await cacache.get(cache,key);const j=JSON.parse(data.toString('utf8'));
  for(const g of group){const v=j.versions?.[g.version],d=v?.dist;
    if(v?.name!==name||!Number.isSafeInteger(d?.unpackedSize)||d.unpackedSize<0){missing.push({name,version:g.version,reason:'exact-version published size unavailable'});continue;}
    rows.push({...g,announcedUnpackedBytes:d.unpackedSize,announcedFileCount:d.fileCount??null,
      metadataDistIntegrity:d.integrity??null,lockIntegrity:lock.packages[g.path].integrity,
      integrityMatches:d.integrity===lock.packages[g.path].integrity});
  }
}
const receipt={version:'rms-fixed-lock-platform-metadata-inventory-v1',lockSha256:sha(bytes),networkRequests:0,
  target:{os:'win32',cpu:'x64'},lockedEntries:entries.length,platformCompatibleEntries:selected.length,
  excludedByOsCpu:entries.length-selected.length,metadataRows:rows.length,missing,
  announcedUnpackedBytesSum:rows.reduce((s,v)=>s+v.announcedUnpackedBytes,0),
  meaning:'Sum of published unpacked sizes for OS/CPU-compatible lock entries, not actual installed size or compressed downloads. Reachability/optional selection may reduce actual files; installer must measure them.',
  metadataIntegrityMismatch:rows.filter(v=>!v.integrityMatches).map(v=>v.path),
  optionalWindowsRows:rows.filter(v=>v.optional&&v.os?.includes('win32')),rows,
  packageCodeImported:false,packagesInstalled:false,serverStarted:false};
const out=Buffer.from(JSON.stringify(receipt,null,2)+'\n');writeFileSync(output,out,{flag:'wx'});
console.log(JSON.stringify({output,byteLength:out.length,sha256:sha(out),lockedEntries:receipt.lockedEntries,
  platformCompatibleEntries:selected.length,rows:rows.length,missing,announcedUnpackedBytesSum:receipt.announcedUnpackedBytesSum,
  integrityMismatches:receipt.metadataIntegrityMismatch,optionalWindowsRows:receipt.optionalWindowsRows.map(r=>({path:r.path,version:r.version,cpu:r.cpu,size:r.announcedUnpackedBytes})),networkRequests:0}));
if(missing.length||receipt.metadataIntegrityMismatch.length)process.exitCode=1;
