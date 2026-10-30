// Parent-only normal validation. Fixed owned candidate, no preloader or package script.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const [revision,label,selection]=process.argv.slice(2);
if(process.argv.length!==5||!/^r[0-9]+$/.test(revision??'')||!/^projection-[a-z0-9-]+$/.test(label??''))throw Error('Explicit revision, unique label and selection required');
const choices={
  core:{file:'./test/graph-integration/next-context.test.ts',pattern:'exact NEW raw published bytes enter the complete actual command input set, without changing the cycle$'},
  union:{file:'./test/graph-integration/next-context.test.ts',pattern:'blind bodies exclude the other grant/path and shared image; R receives the explicitly authorized exact union plus unchanged A[+]B proposals$'},
  remaining:{file:'./test/graph-integration/next-context.test.ts',pattern:'^(?!.*(?:exact NEW raw published bytes enter|blind bodies exclude the other grant/path)).*$',processTimeoutMs:30000000,bail:true}
};
if(!Object.hasOwn(choices,selection))throw Error('Selection not in owned authorized list');
const E=path.join(import.meta.dirname,'evidence'), manifestFile=path.join(E,`projection-${revision}-manifest.json`);
const manifest=JSON.parse(fs.readFileSync(manifestFile));
const sha=b=>createHash('sha256').update(b).digest('hex');
const receipt=path.join(E,label+'.execution.json'),out=path.join(E,label+'.stdout.log'),err=path.join(E,label+'.stderr.log');
for(const file of [receipt,out,err])if(fs.existsSync(file))throw Error('Never overwrite or implicitly repeat an observation');
function drift(){return manifest.rows.filter(row=>{const b=fs.readFileSync(path.join(manifest.root,row.file));return b.length!==row.bytes||sha(b)!==row.sha256;}).map(row=>row.file);}
if(drift().length)throw Error('Pinned inputs changed before test');
const chosen=choices[selection];
const args=['--no-env-file','--config=./bunfig.integration.toml','test',chosen.file,'--test-name-pattern',chosen.pattern,'--timeout','600000','--max-concurrency=1'];
if(chosen.bail)args.push('--bail','1');
const externalProcessTimeoutMs=chosen.processTimeoutMs??650000;
const stdout=fs.openSync(out,'wx'),stderr=fs.openSync(err,'wx'),start=performance.now();let result;
try{result=spawnSync('C:/Users/djden/.bun/bin/bun.exe',args,{cwd:manifest.root,stdio:['ignore',stdout,stderr],timeout:externalProcessTimeoutMs,windowsHide:true});}
finally{fs.closeSync(stdout);fs.closeSync(stderr);}
const elapsedMs=Math.round(performance.now()-start),stderrText=fs.readFileSync(err,'utf8');
const summary=stderrText.split('\n').filter(l=>/\d+ pass|\d+ fail|\d+ skip|expect\(\) calls|Ran \d+ tests?/.test(l)).map(l=>l.trim());
const testResults=stderrText.split('\n').filter(l=>l.includes('(pass)')||l.includes('(fail)')).map(line=>({line:line.trim(),durationMs:Number((line.match(/\[([0-9.]+)ms\]/)??[])[1])||null}));
const doc={schema:'rms-normal-validation-ten-minutes-v1',selection,candidateManifest:path.basename(manifestFile),manifestSha256:sha(fs.readFileSync(manifestFile)),command:{executable:'bun.exe',args,cwd:manifest.root},perTestTimeoutMs:600000,externalProcessTimeoutMs,exitCode:result.status,signal:result.signal,error:result.error?{code:result.error.code,message:result.error.message}:null,elapsedMs,summary,testResults,stdoutSha256:sha(fs.readFileSync(out)),stderrSha256:sha(fs.readFileSync(err)),sourceDrift:drift(),preloader:false,scope:'Normal OFFLINE fixture validation, no actual worker/model, native proof, prohibited global suite or frozen diagnostic'};
fs.writeFileSync(receipt,JSON.stringify(doc,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(doc));
if(result.status!==0||doc.sourceDrift.length)process.exitCode=1;
