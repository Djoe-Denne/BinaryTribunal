// Parent-only freeze/hash/copy for one documentation correction; no product imports.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-r1';
const doc=base+'/l8-schema-docfix-r1',old=base+'/l8-schema-delta-r1/outputs',dst=base+'/l8-schema-docfix-review-r1/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(fs.existsSync(dst))throw Error('Doc review packet already exists');
const names=['l8-prepared-graph-v3.schema.json','l8-partition-adoption-v1.schema.json','DESIGN.md','MANIFEST.json'];
if(JSON.stringify(fs.readdirSync(doc+'/outputs').sort())!==JSON.stringify([...names].sort()))throw Error('Unexpected outputs');
for(const n of names.slice(0,2))if(!fs.readFileSync(doc+'/outputs/'+n).equals(fs.readFileSync(old+'/'+n)))throw Error('Schema drift');
const manifest=JSON.parse(fs.readFileSync(doc+'/outputs/MANIFEST.json','utf8'));
for(const f of manifest.files){const b=fs.readFileSync(doc+'/outputs/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('New manifest pin mismatch');}
if(sha(fs.readFileSync(old+'/MANIFEST.json'))!==manifest.predecessor.sha256)throw Error('Predecessor manifest drift');
const entries=[];
for(const n of names){entries.push({name:'candidate/'+n,source:doc+'/outputs/'+n});entries.push({name:'previous/'+n,source:old+'/'+n});}
entries.push({name:'reference/lineage.ts',source:base+'/l8-schema-delta-r1/inputs/reference/lineage.ts',pin:'7e650185c7dff1e1845c3c0f963cf73a72a29a515874eefd535a0733b78e82a9'},
{name:'reference/semantic-index.ts',source:base+'/l8-schema-delta-r1/inputs/reference/semantic-index.ts',pin:'bf04ce7c697b107ecc3da95c9574eb835a7d0ad984790f7ab267bcd3938b5cb1'},
{name:'SCOPE.md',source:doc+'/GO_SCOPE.md'},
{name:'PREVIOUS_ADJUDICATION.md',source:base+'/L8_SCHEMA_PARENT_ADJUDICATION.md',pin:'4312953a4456484cc173ee41327139a890a3f3b08d74f802f3886b9c0500cbe6'});
const files=[];
for(const e of entries){const b=fs.readFileSync(e.source),s=fs.lstatSync(e.source);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(e.pin&&sha(b)!==e.pin))throw Error('Source drift '+e.source);fs.chmodSync(e.source,0o444);const p=dst+'/'+e.name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b)});}
const raw=JSON.stringify({at:new Date().toISOString(),role:'fresh-documentation-only-review',policyRevision:1,files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',raw,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(raw),permission:'ACK-HOLD then parent GO; doc/diff/hash review only'};
fs.writeFileSync(base+'/l8-schema-docfix-review-r1/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
