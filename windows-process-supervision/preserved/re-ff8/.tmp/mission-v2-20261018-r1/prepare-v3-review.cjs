// Parent-only intake/freezing and bounded review projection; no product import.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8';
const base=root+'/.tmp/mission-v2-20261018-r1';
const src=base+'/v3-matrix-source',dst=base+'/v3-matrix-review/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected={
 'RunnerMatrix.cs':[35669,'ee6a830ce4e6e03fcdc7c3d743835bc87b1e96b9ce86cf05a635604fc2e16a7c'],
 'DESIGN.md':[17576,'f230ef21b8be82356e401b690767283be18e82e0c41512a0459f44490c05a75a'],
 'MANIFEST.json':[4186,'2226b3fbc313a81851a42b7d71c5787287b47e33005e4d7cd475f6f97f958232']
};
if(JSON.stringify(fs.readdirSync(src+'/outputs').sort())!==JSON.stringify(Object.keys(expected).sort()))throw Error('Unexpected outputs');
const entries=[],intake=[];
for(const [name,[bytes,hash]]of Object.entries(expected)){const p=src+'/outputs/'+name,st=fs.lstatSync(p),b=fs.readFileSync(p);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||b.length!==bytes||sha(b)!==hash)throw Error('Output drift '+name);fs.chmodSync(p,0o444);entries.push({name:'candidate/'+name,source:p,expected:hash});intake.push({path:name,bytes,sha256:hash,readonly:true});}
const manifests=[['inputs','6243ae5d0ae98667bc80e4ac44d68798dfca4e539a30cbace431ee8dcd0b1889','base'],['supplement-capture/inputs','2df4ff7b2b9730dcac07b8934e72326dfc476c70c723260e916069c234ab1fa7','capture']];
for(const [dir,pin,label]of manifests){const raw=fs.readFileSync(src+'/'+dir+'/INPUT_MANIFEST.json');if(sha(raw)!==pin)throw Error('Input manifest drift');for(const f of JSON.parse(raw).files){const p=src+'/'+dir+'/'+f.path,b=fs.readFileSync(p);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Input drift '+p);entries.push({name:'reference/'+label+'/'+f.path,source:p,expected:f.sha256});}}
fs.writeFileSync(src+'/PARENT_INTAKE.json',JSON.stringify({at:new Date().toISOString(),stage:'PHYSICAL_INTAKE_ONLY_NOT_ACCEPTANCE',outputs:intake,inputRehash:{base:14,capture:2},compiled:false,executed:false,freshReviewRequired:true},null,2)+'\n',{flag:'wx'});
entries.push({name:'SCOPE.md',source:base+'/V3_MATRIX_REVIEW_SCOPE.md'});
if(fs.existsSync(dst))throw Error('Review projection exists');
const files=[];for(const e of entries){const b=fs.readFileSync(e.source);if(e.expected&&sha(b)!==e.expected)throw Error('Copy drift');const p=dst+'/'+e.name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b)});}
const bytes=JSON.stringify({at:new Date().toISOString(),role:'fresh-V-static-source-review',policyRevision:1,files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',bytes,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(bytes),frozenSourceOutputs:3,immutableInputPins:16,permission:'ACK-HOLD then static-review GO; no execution'};
fs.writeFileSync(base+'/v3-matrix-review/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
