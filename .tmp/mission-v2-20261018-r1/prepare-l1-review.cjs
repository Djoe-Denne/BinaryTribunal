// Parent-only bounded copy/hash preparation; imports no product.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8';
const base=root+'/.tmp/mission-v2-20261018-r1';
const src=base+'/l1-b1-search/inputs';
const dst=base+'/l1-b1-review/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(fs.existsSync(dst))throw Error('Review input exists');
const original=fs.readFileSync(src+'/INPUT_MANIFEST.json');
if(sha(original)!=='cba86fa601d401d3bd51b57c67e334635eaf3f27b25b5e0b63be4e227b6917ec')throw Error('Manifest drift');
const manifest=JSON.parse(original);
const entries=manifest.files.map(f=>({name:'SOURCE/'+f.path,source:src+'/'+f.path,expected:f.sha256}));
entries.push({name:'A_PARENT_DIGEST.md',source:base+'/L1_B1_A_PARENT_DIGEST.md'});
entries.push({name:'PARENT_INITIAL_QA_REVIEW_RECEIPT.json',source:root+'/.tmp/coordination-three-20261014/l7-initial-qa-review-parent-verification.json'});
const files=[];
for(const e of entries){const b=fs.readFileSync(e.source);if(e.expected&&sha(b)!==e.expected)throw Error('Source drift '+e.name);const target=dst+'/'+e.name;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});fs.chmodSync(target,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b)});}
const m={role:'fresh-static-review',policyRevision:1,originalManifestSha256:sha(original),at:new Date().toISOString(),files};
const bytes=JSON.stringify(m,null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',bytes,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),destination:dst,files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(bytes),sourcePinsVerified:true,scope:'ACK-HOLD then fresh static adversarial review; no run/write/closure'};
fs.writeFileSync(base+'/l1-b1-review/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
