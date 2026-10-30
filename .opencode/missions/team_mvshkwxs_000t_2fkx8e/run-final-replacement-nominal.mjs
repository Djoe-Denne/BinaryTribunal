// Parent normal test selection, not the frozen replacement diagnostic.
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const R=path.resolve(import.meta.dirname,'../../..'),E=path.join(import.meta.dirname,'evidence'),H=path.join(R,'tools/ff8-harness');
const mode=process.argv[2]??'nominal';
const selections={
  nominal:{label:'replacement-nominal-ten-minutes-r1',pattern:'^replacement swap preserves barrier/T1/rights and archives OLD positively without RUNNING$',cases:1},
  activation:{label:'replacement-activation-ten-minutes-r1',pattern:'^replacement validated NEW observation is explained in fresh final and its consumed attempt evidence$',cases:1},
  invariants:{label:'replacement-invariants-ten-minutes-r1',pattern:'^replacement (?:stage charges origin3 without pointing/authorizing it and preserves the full active root|staged reopen retains OLD and cannot reserve/admit NEW or select latest on load|exact preparation lost reply retries for free at ceiling3|exact CAS lost reply and reopen replay one immutable result without recharge|(?:prepare|swap) postappend LIVE revocation rolls back the whole transaction|(?:prepare|swap) TTL equality after its real append is forbidden and rolls back|preserves actual engaged family and root encumbrance and refuses final while Q is incomplete)$',cases:9,bail:true}
};
if(process.argv.length>3||!Object.hasOwn(selections,mode))throw Error('Selection not in parent authorized list');
const chosen=selections[mode],label=chosen.label,receipt=path.join(E,label+'.execution.json');
const owned=path.join(R,'.tmp','rms-final-'+label),dbRoot=path.join(owned,'databases'),assetRoot=path.join(owned,'assets');
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(E,'projection-r6-manifest.json')));
function drift(){return manifest.rows.filter(r=>{const b=fs.readFileSync(path.join(H,r.file));return b.length!==r.bytes||sha(b)!==r.sha256}).map(r=>r.file);}
if(fs.existsSync(owned)||fs.existsSync(receipt)||drift().length)throw Error('Ownership/evidence collision or source drift; no implicit retry');
fs.mkdirSync(dbRoot,{recursive:true});fs.mkdirSync(assetRoot);
const root=fs.realpathSync(assetRoot),stat=fs.lstatSync(root,{bigint:true}),assetManifest=path.join(owned,'asset-leases.json');
const lease={version:'ff8-t2-parent-asset-leases-v1',parentOwner:'rms-final-parent-normal-validation',assetDirectory:root,directoryIdentity:`${stat.dev}:${stat.ino}`,cases:Array.from({length:chosen.cases},(_,i)=>({ordinal:i+1,caseRoot:path.join(root,`case-${i+1}`),leaseId:randomUUID()}))};
fs.writeFileSync(assetManifest,JSON.stringify(lease,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(E,label+'.ownership.json'),JSON.stringify({owned,dbRoot,assetRoot:root,assetManifest,manifestSha256:sha(fs.readFileSync(assetManifest)),caseCount:chosen.cases,ceiling:3,bootstrapIncluded:true,scope:'Each existing isolated synthetic HOST fixture has private retained acquisition and at most one NEW3. No fourth-stage request or threads; not native authority.',deletes:false},null,2)+'\n',{flag:'wx'});
const args=['--no-env-file','--config=./bunfig.integration.toml','test','./test/s2-author/replacement.test.ts','--test-name-pattern',chosen.pattern,'--timeout','600000','--max-concurrency=1'];
if(chosen.bail)args.push('--bail','1');
const processTimeoutMs=chosen.cases*600000+50000;
const out=path.join(E,label+'.stdout.log'),err=path.join(E,label+'.stderr.log');
const a=fs.openSync(out,'wx'),b=fs.openSync(err,'wx'),start=performance.now();let result;
try{result=spawnSync('C:/Users/djden/.bun/bin/bun.exe',args,{cwd:H,env:{...process.env,FF8_S2_FIXTURE_DIRECTORY:dbRoot,FF8_S2_T2_ASSET_DIRECTORY:root,FF8_S2_T2_ASSET_MANIFEST:assetManifest},stdio:['ignore',a,b],timeout:processTimeoutMs,windowsHide:true});}finally{fs.closeSync(a);fs.closeSync(b);}
const elapsedMs=Math.round(performance.now()-start),text=fs.readFileSync(err,'utf8');
const doc={schema:'rms-final-normal-replacement-validation-v1',candidateCommit:'05c3c5321a3f9f4ced1f7e8d9106027d1dea59d9',sourceManifest:'projection-r6-manifest.json',selection:mode,selectionScope:`${chosen.cases} existing normal test(s), no diagnostic test or fourth origin/thread cases`,args,perTestTimeoutMs:600000,processTimeoutMs,exitCode:result.status,signal:result.signal,error:result.error?{code:result.error.code,message:result.error.message}:null,elapsedMs,summary:text.split('\n').filter(l=>/\d+ pass|\d+ fail|\d+ skip|expect\(\) calls|Ran \d+ tests?/.test(l)).map(l=>l.trim()),stdoutSha256:sha(fs.readFileSync(out)),stderrSha256:sha(fs.readFileSync(err)),sourceDrift:drift(),ownedResourcesRetained:true,nativeProof:false};
fs.writeFileSync(receipt,JSON.stringify(doc,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(doc));
if(result.status!==0||doc.sourceDrift.length)process.exitCode=1;
