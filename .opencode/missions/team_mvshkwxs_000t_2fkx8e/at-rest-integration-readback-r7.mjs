// Parent exact-byte acceptance after native merge, before parent commit.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),e=path.join(import.meta.dirname,'evidence'),h=path.join(root,'tools/ff8-harness');
const mode=process.argv[2]??'merge',observation=['observation','observation-postcommit'].includes(mode),postcommit=['postcommit','observation-postcommit'].includes(mode);
if(!['merge','postcommit','observation','observation-postcommit'].includes(mode)||process.argv.length>(mode==='observation-postcommit'?4:mode==='merge'?2:3))throw Error('Invalid readback mode');
const sha=b=>createHash('sha256').update(b).digest('hex');
const pre=JSON.parse(fs.readFileSync(path.join(e,observation?'observation-premerge-r1.json':'at-rest-premerge-r7.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(e,observation?'native-observation-r1-source-manifest.json':'native-at-rest-r7-source-manifest.json'),'utf8'));
function git(args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:10000});if(r.status!==0)throw Error('Git observation failed');return r.stdout.trim();}
const expectedHead=postcommit?(observation?process.argv[3]:'81be09dc390794aa19473438a68b6b0a0d8edabd'):pre.base;
if(!/^[a-f0-9]{40}$/.test(expectedHead??''))throw Error('Explicit pinned parent commit required');
if(git(['rev-parse','HEAD'])!==expectedHead||git(['diff','--cached','--name-only']))throw Error('Unexpected HEAD/index');
for(const r of manifest.rows){const b=fs.readFileSync(path.join(h,r.file));if(b.length!==r.bytes||sha(b)!==r.sha256)throw Error('Merged source drift: '+r.file);}
for(const r of pre.preservedParentChanges){const b=fs.readFileSync(path.join(root,r.file));if(b.length!==r.bytes||sha(b)!==r.sha256)throw Error('Preexisting change drift: '+r.file);}
const deps=JSON.parse(fs.readFileSync(path.join(e,observation?'observation-dependencies.json':'at-rest-dependencies.json'),'utf8'));
for(const r of deps.rows){const b=fs.readFileSync(path.join(h,'node_modules',r.path));if(b.length!==r.bytes||sha(b)!==r.sha256)throw Error('Dependency drift');}
const expectedModified=[...pre.preservedParentChanges.map(r=>r.file),...(postcommit?[]:['tools/ff8-harness/src/graph-store.ts'])].sort();
if(JSON.stringify(git(['diff','--name-only']).split(/\r?\n/).sort())!==JSON.stringify(expectedModified))throw Error('Unexpected tracked diff');
const receipts=[];
for(const label of (observation?['native-observation-r1-typecheck','native-observation-r1-targeted','native-observation-r1-admission-impact','native-at-rest-r2-primitives']:['native-at-rest-r7-typecheck','native-at-rest-r7-targeted','native-at-rest-r2-primitives','native-at-rest-legacy-targeted'])){
 const file=path.join(e,label+'.execution.json'),j=JSON.parse(fs.readFileSync(file,'utf8').trimStart());if(j.exitCode!==0||j.sourceDrift.length)throw Error('Invalid QA receipt');
 for(const stream of ['stdout','stderr'])if(sha(fs.readFileSync(path.join(e,label+'.'+stream+'.log')))!==j[stream+'Sha256'])throw Error('QA capture drift');
 receipts.push({file:path.basename(file),sha256:sha(fs.readFileSync(file)),exitCode:j.exitCode,elapsedMs:j.elapsedMs});
}
const result={schema:'rms-at-rest-integration-readback-v1',candidate:pre.pin,base:pre.base,head:expectedHead,postcommit,sourceFilesCompared:manifest.rows.length,sourceDrift:[],dependenciesCompared:deps.rows.length,dependencyDrift:[],preservedParentChanges:pre.preservedParentChanges.length,preservedDrift:[],exactFiles:pre.files,receiptsVerified:receipts,indexEmpty:true,behavioralReplay:false,scope:'Same candidate bytes after native merge; all new tests/fixtures/dependencies present. No new runtime execution or native qualification.'};
const output=observation?(postcommit?'observation-postcommit-r1.parent-readback.json':'observation-integration-r1.parent-readback.json'):(postcommit?'at-rest-postcommit-r7.parent-readback.json':'at-rest-integration-r7.parent-readback.json');
fs.writeFileSync(path.join(e,output),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...result,exactFiles:pre.files.length,receiptsVerified:receipts.length}));
