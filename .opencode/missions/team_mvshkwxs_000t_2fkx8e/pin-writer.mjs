// Pin the owned writer candidate; no harness module is imported or evaluated.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const label=process.argv[2];
if(!/^r[1-9][0-9]*$/.test(label??'')||process.argv.length!==3)throw Error('Explicit revision rN required');
const root='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-runtime-public/tools/ff8-harness';
const E=path.join(import.meta.dirname,'evidence');
const file=path.join(E,'writer-'+label+'-manifest.json');
if(fs.existsSync(file))throw Error('Revision manifest already exists');
const sha=b=>createHash('sha256').update(b).digest('hex'),rows=[];
function walk(d,rel=''){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    if(e.name==='node_modules')continue;
    const r=rel?rel+'/'+e.name:e.name,f=path.join(d,e.name),s=fs.lstatSync(f);
    if(s.isSymbolicLink())throw Error('Unexpected candidate link: '+r);
    if(e.isDirectory())walk(f,r);else {if(!s.isFile())throw Error('Nonregular candidate: '+r);const b=fs.readFileSync(f);rows.push({file:r,bytes:b.length,sha256:sha(b)});}
  }
}
walk(root);rows.sort((a,b)=>a.file.localeCompare(b.file));
const seed=JSON.parse(fs.readFileSync(path.join(E,'writer-base-seed.json'))),old=new Map(seed.rows.map(r=>[r.relativePath.slice('tools/ff8-harness/'.length),r]));
const changes=rows.filter(r=>!old.has(r.file)||old.get(r.file).sha256!==r.sha256).map(r=>({...r,previousSha256:old.get(r.file)?.sha256??null}));
const missing=[...old.keys()].filter(f=>!rows.some(r=>r.file===f));
if(missing.length)throw Error('Seed files disappeared: '+missing.join(','));
const result={schema:'rms-owned-writer-candidate-v1',revision:label,root,rows,rowsSha256:sha(JSON.stringify(rows)),changes,seedManifest:'writer-base-seed.json',dependencyManifest:'writer-dependencies.json',scope:'Exact source/config/input candidate pin; no test result or native authority'};
fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({file,revision:label,files:rows.length,changedFiles:changes.map(r=>r.file),rowsSha256:result.rowsSha256,manifestSha256:sha(fs.readFileSync(file))}));
