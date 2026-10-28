// Parent-only bounded copies, no product imports or instance validation.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-r1';
const old=base+'/l8-schema-source',dst=base+'/l8-schema-delta-r1/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(fs.existsSync(dst))throw Error('Delta packet exists');
const pins={
'l8-prepared-graph-v3.schema.json':'7d02870a8bc411dbd9e8d66967749f4a0c310e510da301cf1d46682ac666693c',
'l8-partition-adoption-v1.schema.json':'c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e',
'DESIGN.md':'e93b3d4b662e5cc77c2d7e15e19f94a4e0d10b1edc8afb9cd508629a2cd0d359',
'MANIFEST.json':'9d55d9cf2931e8e2cc23bd2d7cce89426507066759f842d3ef17717cbca6b0ed'};
const entries=Object.entries(pins).map(([n,pin])=>({name:'original/'+n,source:old+'/outputs/'+n,pin}));
entries.push({name:'reference/lineage.ts',source:old+'/inputs/reference/tools/ff8-harness/src/lineage.ts',pin:'7e650185c7dff1e1845c3c0f963cf73a72a29a515874eefd535a0733b78e82a9'},
{name:'reference/semantic-index.ts',source:old+'/supplement-semantic/inputs/semantic-index.ts',pin:'bf04ce7c697b107ecc3da95c9574eb835a7d0ad984790f7ab267bcd3938b5cb1'},
{name:'reference/cluster-partition-v1.schema.json',source:old+'/inputs/reference/tools/ff8-harness/schemas/cluster-partition-v1.schema.json',pin:'199d505c44e0551d96ec9fafb9510571f056c13017a5d61bb5d114c2cbc4ee1b'},
{name:'reference/PARENT_DESIGN_DISPOSITIONS.md',source:old+'/supplement-semantic/inputs/PARENT_DESIGN_DISPOSITIONS.md',pin:'38aa320e9ec490bf7fc25c2dff816146dffbd22c9572503573e148a947e4003e'},
{name:'SCOPE.md',source:base+'/L8_DELTA_SCOPE.md'});
const files=[];for(const e of entries){const b=fs.readFileSync(e.source);if(e.pin&&sha(b)!==e.pin)throw Error('Source drift '+e.source);const p=dst+'/'+e.name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b)});}
const raw=JSON.stringify({at:new Date().toISOString(),role:'deterministic-L8-delta-author',policyRevision:1,originalVerdict:'CORRIGE_R1_R1bis_R2',maxCorrectionCycles:1,files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',raw,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(raw),permission:'ACK-HOLD then parent native GO; one isolated delta only'};
fs.writeFileSync(base+'/l8-schema-delta-r1/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
