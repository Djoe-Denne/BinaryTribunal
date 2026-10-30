// Parent-only premerge observations; no test, service or Git mutation.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),e=path.join(import.meta.dirname,'evidence');
const observation=process.argv[2]==='observation';if(process.argv.length>(observation?3:2))throw Error('Invalid premerge scope');
const worktree='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-'+(observation?'observations-native-data':'admission-native-repos');
const pin=observation?'834bc6b27d91febc8d845b5b4758db103f864745':'1a09039d4cc2a5c50151f9dcdda691c204a060a8',base=observation?'81be09dc390794aa19473438a68b6b0a0d8edabd':'05c3c5321a3f9f4ced1f7e8d9106027d1dea59d9';
const sha=b=>createHash('sha256').update(b).digest('hex');
function git(dir,args){const r=spawnSync('git',args,{cwd:dir,encoding:'utf8',timeout:10000});if(r.status!==0)throw Error('Git observation failed');return r.stdout.trim();}
if(git(root,['rev-parse','HEAD'])!==base||git(worktree,['rev-parse','HEAD'])!==pin)throw Error('HEAD mismatch');
if(git(root,['diff','--cached','--name-only'])||git(worktree,['status','--porcelain=v1','--untracked-files=no']))throw Error('Index or worker tracked state not clean');
const preserved=JSON.parse(fs.readFileSync(path.join(e,'premerge-projection-r6.json'),'utf8')).preservedParentChanges;
for(const r of preserved){const b=fs.readFileSync(path.join(root,r.file));if(b.length!==r.bytes||sha(b)!==r.sha256)throw Error('Preexisting file drift');}
const changed=git(root,['diff','--name-only']).split(/\r?\n/).filter(Boolean).sort();
if(JSON.stringify(changed)!==JSON.stringify(preserved.map(r=>r.file).sort()))throw Error('Unexpected parent changes');
const files=git(worktree,['diff','--name-only',base,pin]).split(/\r?\n/).filter(Boolean).sort();
const expected=(observation?['tools/ff8-harness/src/graph-native-observations.ts','tools/ff8-harness/src/graph-store.ts','tools/ff8-harness/src/native-observation-transport.ts','tools/ff8-harness/test/graph-integration/native-observations.test.ts']:['tools/ff8-harness/src/graph-native-at-rest.ts','tools/ff8-harness/src/graph-store.ts','tools/ff8-harness/src/native-at-rest-transport.ts','tools/ff8-harness/test/graph-integration/native-at-rest.test.ts']).sort();
if(JSON.stringify(files)!==JSON.stringify(expected)||files.some(f=>changed.includes(f)))throw Error('Scope or overlap');
const manifest=JSON.parse(fs.readFileSync(path.join(e,observation?'native-observation-r1-source-manifest.json':'native-at-rest-r7-source-manifest.json'),'utf8'));
for(const r of manifest.rows)if(sha(fs.readFileSync(path.join(worktree,'tools/ff8-harness',r.file)))!==r.sha256)throw Error('Candidate manifest drift');
const rows=files.map(file=>{const b=fs.readFileSync(path.join(worktree,file));return{file,bytes:b.length,sha256:sha(b)};});
const result={schema:'rms-at-rest-premerge-v1',base,pin,sourceFilesCompared:manifest.rows.length,sourceDrift:[],files:rows,preservedParentChanges:preserved,indexEmpty:true,overlap:[],integrationAuthorized:false,scope:'Premerge observation only; reviewer and parent acceptance still required'};
fs.writeFileSync(path.join(e,observation?'observation-premerge-r1.json':'at-rest-premerge-r7.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({base,pin,sourceFilesCompared:manifest.rows.length,sourceDrift:[],changedFiles:rows.length,preservedParentFiles:preserved.length,indexEmpty:true,overlap:[]}));
