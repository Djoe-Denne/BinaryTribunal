// Parent-only, closed offline QA selection. No global suite or native call.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-admission-native-repos';
const h=path.join(root,'tools/ff8-harness'),e=path.join(import.meta.dirname,'evidence');
const candidates={r1:'a246f6f24fb00ba76d2ee43340e72f84f9377001',r2:'16f48383b6ff1e93609fef159bc353684d48c301',r3:'d6e4085dd05a964120d5e5f1c41a3ec5d3791b0d',r4:'e880a2581290df0506220a429dc4484f14fc1deb',r5:'6272a6de60c6b7d673aa352a8a6f3bc8f22d600c',r6:'0c6d228ae1d67ac54bf9e5d0b89cd74983febbfe',r7:'1a09039d4cc2a5c50151f9dcdda691c204a060a8',legacy:'0c6d228ae1d67ac54bf9e5d0b89cd74983febbfe'};
const revision=process.argv[2]??'r1';if(!Object.hasOwn(candidates,revision)||process.argv.length>3)throw Error('Unapproved QA pin');
const pin=candidates[revision],labelPrefix='native-at-rest-'+revision;
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:10000});if(r.status!==0)throw Error('Git read failed');return r.stdout.trim();};
if(git(['rev-parse','HEAD'])!==pin||git(['status','--porcelain=v1','--untracked-files=no']))throw Error('Candidate changed or tracked dirty');
const names=new Set(JSON.parse(fs.readFileSync(path.join(e,'projection-r6-manifest.json'),'utf8')).rows.map(r=>r.file));
for(const f of git(['diff','--name-only','05c3c5321a3f9f4ced1f7e8d9106027d1dea59d9',pin]).split(/\r?\n/))if(f.startsWith('tools/ff8-harness/'))names.add(f.slice('tools/ff8-harness/'.length));
const rows=[...names].sort().map(file=>{const b=fs.readFileSync(path.join(h,file));return{file,bytes:b.length,sha256:sha(b)};});
const manifest=path.join(e,labelPrefix+'-source-manifest.json');
fs.writeFileSync(manifest,JSON.stringify({pin,rows},null,2)+'\n',{flag:'wx'});
const drift=()=>rows.filter(r=>sha(fs.readFileSync(path.join(h,r.file)))!==r.sha256).map(r=>r.file);
const commands=[['typecheck',['--no-env-file','--config=./bunfig.integration.toml','run','typecheck']],['primitives',['--no-env-file','--config=./bunfig.integration.toml','run','test:q1-primitives']],['targeted',['--no-env-file','--config=./bunfig.integration.toml','test','./test/graph-integration/native-at-rest.test.ts','--timeout','600000','--max-concurrency=1']]];
if(revision==='legacy')commands.splice(0,commands.length,['targeted',['--no-env-file','--config=./bunfig.integration.toml','test','./test/eventlog.test.ts','--test-name-pattern','dispatch expiry at admission_sending rolls back before transport|complete request before effects, immutable digest, crash before send/reopen|response lost after native acceptance: no retry until authoritative reconciliation|crash during SENDING conservatively blocks; unknown readback is not absence','--timeout','600000','--max-concurrency=1']]);
for(const[label,args]of commands){
 if(['r3','r4','r5','r6','r7'].includes(revision)&&label==='primitives')continue; // Unchanged proof from r2; not counted as a new execution.
 const file=path.join(e,labelPrefix+'-'+label+'.execution.json');if(fs.existsSync(file))throw Error('No implicit replay');
 const start=performance.now(),r=spawnSync('C:/Users/djden/.bun/bin/bun.exe',args,{cwd:h,encoding:'utf8',timeout:label==='targeted'?9650000:650000,windowsHide:true});
 const out=r.stdout??'',err=r.stderr??'';for(const[k,s]of[['stdout',out],['stderr',err]])fs.writeFileSync(path.join(e,labelPrefix+'-'+label+'.'+k+'.log'),s,{flag:'wx'});
 const doc={schema:'rms-at-rest-offline-qa-v1',pin,label,args,exitCode:r.status,signal:r.signal,error:r.error?.code??null,elapsedMs:Math.round(performance.now()-start),perTestTimeoutMs:label==='targeted'?600000:null,stdoutSha256:sha(out),stderrSha256:sha(err),sourceDrift:drift(),summary:(out+'\n'+err).split(/\r?\n/).filter(l=>/pass|fail|expect\(\) calls|Ran \d+ test|error TS/.test(l)),nativeCallRequested:false};
 fs.writeFileSync(file,JSON.stringify(doc,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(doc));
 if(r.status!==0||doc.sourceDrift.length){process.exitCode=1;break;}
}
