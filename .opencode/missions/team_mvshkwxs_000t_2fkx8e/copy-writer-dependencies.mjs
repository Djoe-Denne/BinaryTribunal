// Local installed dependency snapshot only; never install, run lifecycle scripts or use network.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const R=path.resolve(import.meta.dirname,'../../..');
const source=path.join(R,'tools/ff8-harness/node_modules');
const role=process.argv[2]??'runtime';
const roles={
  runtime:{worktree:'ensemble-793e3f62-2fkx8e-raccord-runtime-public',receipt:'writer-dependencies.json'},
  publication:{worktree:'ensemble-793e3f62-2fkx8e-publication-durable',receipt:'publication-dependencies.json'},
   projection:{worktree:'ensemble-793e3f62-2fkx8e-projection-contexte',receipt:'projection-dependencies.json'},
   atRest:{worktree:'ensemble-793e3f62-2fkx8e-admission-native-repos',receipt:'at-rest-dependencies.json'},
   observation:{worktree:'ensemble-793e3f62-2fkx8e-observations-native-data',receipt:'observation-dependencies.json'}
};
if(!Object.hasOwn(roles,role)||process.argv.length>3)throw Error('Explicit mission-owned runtime/publication/projection target required');
const target=path.join('C:/Users/djden/.local/share/opencode/worktree/68ae5f',roles[role].worktree,'tools/ff8-harness/node_modules');
const output=path.join(import.meta.dirname,'evidence',roles[role].receipt);
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(x,s)=>{if(!x)throw Error(s);};
need(!fs.existsSync(target)&&!fs.existsSync(output),'dependency destination or receipt already exists');
const versions={};
for(const [name,expected] of [['@opencode/client','2.0.26'],['typescript','5.9.3'],['@types/bun','1.4.0']]){
  const j=JSON.parse(fs.readFileSync(path.join(source,name,'package.json')));need(j.version===expected,'installed package version changed: '+name);versions[name]=j.version;
}
const rows=[];
function walk(dir,rel=''){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const r=rel?rel+'/'+e.name:e.name,f=path.join(dir,e.name),stat=fs.lstatSync(f);
    need(!stat.isSymbolicLink(),'dependency link forbidden: '+r);
    if(e.isDirectory())walk(f,r);else {need(e.isFile(),'nonregular dependency: '+r);const b=fs.readFileSync(f);rows.push({path:r,bytes:b.length,sha256:sha(b)});}
  }
}
walk(source);rows.sort((a,b)=>a.path.localeCompare(b.path));
need(rows.length===3493&&rows.reduce((n,r)=>n+r.bytes,0)===88061705,'installed dependency snapshot changed; inspect before copy');
fs.mkdirSync(target);
for(const r of rows){const f=path.join(target,r.path);fs.mkdirSync(path.dirname(f),{recursive:true});fs.copyFileSync(path.join(source,r.path),f,fs.constants.COPYFILE_EXCL);}
for(const r of rows)for(const base of [source,target]){const b=fs.readFileSync(path.join(base,r.path));need(b.length===r.bytes&&sha(b)===r.sha256,'dependency drift: '+r.path);}
const receipt={schema:'rms-owned-local-dependencies-v1',source,target,versions,files:rows.length,bytes:rows.reduce((n,r)=>n+r.bytes,0),rows,rowsSha256:sha(JSON.stringify(rows)),network:false,install:false,lifecycleScriptsExecuted:false,sourceMutated:false,authorityTransferred:false,scope:'Exact filesystem copy of installed dependencies; not runtime SDK/handler qualification'};
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({state:'DEPENDENCIES_COPIED_AND_READBACK_VERIFIED',files:receipt.files,bytes:receipt.bytes,versions,rowsSha256:receipt.rowsSha256,receiptSha256:sha(fs.readFileSync(output))}));
