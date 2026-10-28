// Parent-only immutable intake/copy, no product modules or instance validation.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-r1';
const source=base+'/l8-schema-delta-r1',prior=base+'/l8-schema-review/inputs',dst=base+'/l8-schema-delta-review-r1/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected={
'l8-prepared-graph-v3.schema.json':[104742,'fd4cdd41fa6b60ac39f8d40134fb5d593e37b172c04ec2750190f2e6f2fc47b9'],
'l8-partition-adoption-v1.schema.json':[12396,'c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e'],
'DESIGN.md':[20833,'27115fdf14aaa3aa39b1b4679a54eae5b6cda488734d1d2bd3009b3f5bc2b0bf'],
'MANIFEST.json':[11073,'0e8f76bfd728728920fa987fe7d5d4ad27624e15d0c62d30410356f18090ecd7']};
if(JSON.stringify(fs.readdirSync(source+'/outputs').sort())!==JSON.stringify(Object.keys(expected).sort()))throw Error('Unexpected delta outputs');
const entries=[],intake=[];for(const[n,[size,pin]]of Object.entries(expected)){const p=source+'/outputs/'+n,b=fs.readFileSync(p),s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||b.length!==size||sha(b)!==pin)throw Error('Output drift '+n);if(n.endsWith('.json'))JSON.parse(b);fs.chmodSync(p,0o444);entries.push({name:'candidate/'+n,source:p,pin});intake.push({path:n,bytes:size,sha256:pin,readonly:true});}
const deltaRaw=fs.readFileSync(source+'/inputs/INPUT_MANIFEST.json');if(sha(deltaRaw)!=='98ddf0ba63893f43010b5b525879c638e006c56a9b21865ca20d8f6eca8a8adb')throw Error('Delta manifest drift');for(const f of JSON.parse(deltaRaw).files){const b=fs.readFileSync(source+'/inputs/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Delta input drift');}
const raw=fs.readFileSync(prior+'/INPUT_MANIFEST.json');if(sha(raw)!=='ff2d168a57aa52f71561f24a598df6abc0077cc569900c50aba60141afdcbd70')throw Error('Prior review manifest drift');for(const f of JSON.parse(raw).files){const p=prior+'/'+f.path,b=fs.readFileSync(p);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Prior input drift');let name=f.path;if(name.startsWith('candidate/'))name=name.replace('candidate/','original/');else if(name==='SCOPE.md')name='OLD_REVIEW_SCOPE.md';else if(name==='PARENT_SOURCE_GO.md')name='ORIGINAL_SOURCE_GO.md';entries.push({name,source:p,pin:f.sha256});}
entries.push({name:'DELTA_SCOPE.md',source:source+'/inputs/SCOPE.md'},{name:'DELTA_SOURCE_GO.md',source:source+'/PARENT_SOURCE_GO.md'},{name:'DELTA_INPUT_MANIFEST.json',source:source+'/inputs/INPUT_MANIFEST.json'},{name:'SCOPE.md',source:base+'/L8_DELTA_REVIEW_SCOPE.md'});
fs.writeFileSync(source+'/PARENT_INTAKE.json',JSON.stringify({at:new Date().toISOString(),stage:'DELTA_PHYSICAL_INTAKE_ONLY',outputs:intake,deltaInputPinsVerified:9,originalReviewPinsVerified:24,productImported:false,instancesValidated:false,secondCorrectionAuthorized:false,freshReviewRequired:true},null,2)+'\n',{flag:'wx'});
if(fs.existsSync(dst))throw Error('Re-review packet exists');const files=[];
for(const e of entries){const b=fs.readFileSync(e.source);if(e.pin&&sha(b)!==e.pin)throw Error('Copy drift');const p=dst+'/'+e.name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b)});}
const out=JSON.stringify({at:new Date().toISOString(),role:'fresh-L8-delta-V-final-cycle',policyRevision:1,files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',out,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(out),permission:'ACK-HOLD then static-review GO; no new correction loop'};
fs.writeFileSync(base+'/l8-schema-delta-review-r1/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
