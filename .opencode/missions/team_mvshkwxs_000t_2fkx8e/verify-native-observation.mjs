// Parent-only closed offline selections; no runtime session or global suite.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-observations-native-data';
const h=path.join(root,'tools/ff8-harness'),e=path.join(import.meta.dirname,'evidence');
const candidates={r1:'834bc6b27d91febc8d845b5b4758db103f864745'};
const revision=process.argv[2]??'r1';if(!Object.hasOwn(candidates,revision)||process.argv.length>3)throw Error('Unapproved QA pin');
const pin=candidates[revision],prefix='native-observation-'+revision;
const sha=b=>createHash('sha256').update(b).digest('hex');
function git(args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:10000});if(r.status!==0)throw Error('Git observation failed');return r.stdout.trim();}
if(git(['rev-parse','HEAD'])!==pin||git(['status','--porcelain=v1','--untracked-files=no']))throw Error('Candidate changed/dirty');
const names=new Set(JSON.parse(fs.readFileSync(path.join(e,'native-at-rest-r7-source-manifest.json'),'utf8')).rows.map(r=>r.file));
for(const f of git(['diff','--name-only','81be09dc390794aa19473438a68b6b0a0d8edabd',pin]).split(/\r?\n/))if(f.startsWith('tools/ff8-harness/'))names.add(f.slice('tools/ff8-harness/'.length));
const rows=[...names].sort().map(file=>{const b=fs.readFileSync(path.join(h,file));return{file,bytes:b.length,sha256:sha(b)};});
fs.writeFileSync(path.join(e,prefix+'-source-manifest.json'),JSON.stringify({pin,rows},null,2)+'\n',{flag:'wx'});
const drift=()=>rows.filter(r=>sha(fs.readFileSync(path.join(h,r.file)))!==r.sha256).map(r=>r.file);
const commands=[['typecheck',['--no-env-file','--config=./bunfig.integration.toml','run','typecheck']],['targeted',['--no-env-file','--config=./bunfig.integration.toml','test','./test/graph-integration/native-observations.test.ts','--timeout','600000','--max-concurrency=1']],['admission-impact',['--no-env-file','--config=./bunfig.integration.toml','test','./test/graph-integration/native-at-rest.test.ts','--timeout','600000','--max-concurrency=1']]];
for(const[label,args]of commands){
 const file=path.join(e,prefix+'-'+label+'.execution.json');if(fs.existsSync(file))throw Error('No implicit replay');
 const start=performance.now(),r=spawnSync('C:/Users/djden/.bun/bin/bun.exe',args,{cwd:h,encoding:'utf8',timeout:label==='typecheck'?650000:36050000,windowsHide:true});
 const out=r.stdout??'',err=r.stderr??'';for(const[k,s]of[['stdout',out],['stderr',err]])fs.writeFileSync(path.join(e,prefix+'-'+label+'.'+k+'.log'),s,{flag:'wx'});
 const doc={schema:'rms-observation-offline-qa-v1',pin,label,args,exitCode:r.status,signal:r.signal,error:r.error?.code??null,elapsedMs:Math.round(performance.now()-start),perTestTimeoutMs:label==='typecheck'?null:600000,stdoutSha256:sha(out),stderrSha256:sha(err),sourceDrift:drift(),summary:(out+'\n'+err).split(/\r?\n/).filter(l=>/pass|fail|expect\(\) calls|Ran \d+ test|error TS/.test(l)),nativeCallRequested:false};
 fs.writeFileSync(file,JSON.stringify(doc,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(doc));
 if(r.status!==0||doc.sourceDrift.length){process.exitCode=1;break;}
}
