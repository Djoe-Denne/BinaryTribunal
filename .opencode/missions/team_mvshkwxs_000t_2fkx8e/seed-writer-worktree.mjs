// Exact source-only seed of the mission-owned writer worktree. No product execution.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const R=path.resolve(import.meta.dirname,'../../..');
const W='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-runtime-public';
const branch='ensemble-8a8fc2fa-b4ad-4c52-9ab7-8841a7927c60';
const E=path.join(import.meta.dirname,'evidence');
const targetReceipt=path.join(E,'writer-base-seed.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(x,s)=>{if(!x)throw Error(s);};
const raw=fs.readFileSync(path.join(E,'base-transfer-manifest.json'));
need(sha(raw)==='13a4592a913e6717f466e4b1903af3510f490a8af754ad6dcc9774b401f187e1','parent base receipt drift');
need(!fs.existsSync(targetReceipt),'never overwrite seed receipt');
function git(args){const r=spawnSync('git',args,{cwd:W,encoding:'utf8',timeout:10000});need(r.status===0,'git observation failed');return r.stdout.trim();}
need(git(['branch','--show-current'])===branch,'not the owned branch');
need(git(['status','--porcelain=v1'])==='','writer worktree not clean; no mutation');
const m=JSON.parse(raw);
const records=[];
for(const row of m.rows){
  let rel;
  if(row.categories.includes('currentHarnessInventory'))rel=row.relativePath;
  else if(row.categories.includes('contractInput'))rel='tools/ff8-harness/test/fixtures/rms-static-inputs/'+row.relativePath.slice('inputs/'.length);
  else continue;
  need(!path.isAbsolute(rel)&&!rel.split(/[\\/]/).includes('..'),'unsafe path');
  const b=fs.readFileSync(row.destination);need(b.length===row.bytes&&sha(b)===row.sha256,'source drift');
  const target=path.join(W,rel);
  let existing=null;
  if(fs.existsSync(target)){const stat=fs.lstatSync(target);need(stat.isFile()&&!stat.isSymbolicLink(),'target not regular');const old=fs.readFileSync(target);existing={bytes:old.length,sha256:sha(old)};}
  records.push({source:row.destination,target,relativePath:rel,bytes:row.bytes,sha256:row.sha256,categories:row.categories,previous:existing});
}
need(records.length===356,'356 source/input files required');
for(const row of records){fs.mkdirSync(path.dirname(row.target),{recursive:true});fs.copyFileSync(row.source,row.target);}
for(const row of records){const b=fs.readFileSync(row.target);need(b.length===row.bytes&&sha(b)===row.sha256,'seed readback drift');}
const receipt={schema:'rms-owned-writer-seed-v1',at:new Date().toISOString(),worktree:W,branch,baseManifestSha256:sha(raw),files:records.length,rows:records,qualifiedCodecOriginalPreservedAt:path.join(R,'.tmp/rms-static-realisation-20261028-r1/preserved-qualified-codec/graph-execution-envelope.ts'),oldSourceSetReused:false,inputsByteIdentical:true,importsNotYetRewritten:true,authorityTransferred:false,originsReset:false,productCommandsExecuted:[],scope:'Source-only seed; path/dependency fixes need a new manifested revision before tests'};
fs.writeFileSync(targetReceipt,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({state:'WRITER_SEEDED_READBACK_OK',worktree:W,files:records.length,receipt:targetReceipt,receiptSha256:sha(fs.readFileSync(targetReceipt)),sourceOnly:true}));
