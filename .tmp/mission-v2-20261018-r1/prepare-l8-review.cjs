// Parent-only physical intake/freezing and bounded read-only review projection.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8';
const base=root+'/.tmp/mission-v2-20261018-r1',src=base+'/l8-schema-source',dst=base+'/l8-schema-review/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected={
 'l8-prepared-graph-v3.schema.json':[102919,'7d02870a8bc411dbd9e8d66967749f4a0c310e510da301cf1d46682ac666693c'],
 'l8-partition-adoption-v1.schema.json':[12396,'c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e'],
 'DESIGN.md':[15894,'e93b3d4b662e5cc77c2d7e15e19f94a4e0d10b1edc8afb9cd508629a2cd0d359'],
 'MANIFEST.json':[7474,'9d55d9cf2931e8e2cc23bd2d7cce89426507066759f842d3ef17717cbca6b0ed']
};
if(JSON.stringify(fs.readdirSync(src+'/outputs').sort())!==JSON.stringify(Object.keys(expected).sort()))throw Error('Unexpected outputs');
const entries=[],intake=[];for(const [name,[size,pin]]of Object.entries(expected)){const p=src+'/outputs/'+name,b=fs.readFileSync(p),s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||b.length!==size||sha(b)!==pin)throw Error('Output drift '+name);if(name.endsWith('.json'))JSON.parse(b);fs.chmodSync(p,0o444);entries.push({name:'candidate/'+name,source:p,expected:pin});intake.push({path:name,bytes:size,sha256:pin,readonly:true});}
for(const [rel,pin,label]of [['inputs','d582826284de34f181e181cd79f501ebbf1c50072192307f50b5c8863760a59e','base'],['supplement-semantic/inputs','b504fd48333d158fbcdd9e082b886dc63ad8a10bfeea4ba60182716e012c8806','semantic']]){const raw=fs.readFileSync(src+'/'+rel+'/INPUT_MANIFEST.json');if(sha(raw)!==pin)throw Error('Manifest drift');for(const f of JSON.parse(raw).files){const p=src+'/'+rel+'/'+f.path,b=fs.readFileSync(p);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Input drift '+p);entries.push({name:'reference/'+label+'/'+f.path,source:p,expected:f.sha256});}}
fs.writeFileSync(src+'/PARENT_INTAKE.json',JSON.stringify({at:new Date().toISOString(),stage:'PHYSICAL_INTAKE_ONLY_NOT_ACCEPTANCE',outputs:intake,primaryInputPins:16,supplementInputPins:2,productImported:false,instancesValidated:false,centralIntegrated:false,freshReviewRequired:true},null,2)+'\n',{flag:'wx'});
entries.push({name:'SCOPE.md',source:base+'/L8_SCHEMA_REVIEW_SCOPE.md'},{name:'PARENT_SOURCE_GO.md',source:src+'/PARENT_SOURCE_GO.md'});
if(fs.existsSync(dst))throw Error('Review packet exists');const files=[];
for(const e of entries){const b=fs.readFileSync(e.source);if(e.expected&&sha(b)!==e.expected)throw Error('Copy drift');const p=dst+'/'+e.name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b)});}
const raw=JSON.stringify({at:new Date().toISOString(),role:'fresh-V-L8-schema-source',policyRevision:1,files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',raw,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(raw),permission:'ACK-HOLD then distinct static-review GO; no product/validator execution'};
fs.writeFileSync(base+'/l8-schema-review/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
