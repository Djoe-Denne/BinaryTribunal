// Parent-only read/hash/snapshot. Never changes old worktree, main or runtime evidence.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-continuous',phase=root+'/.tmp/coordination-three-20261014';
const old='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l8-integration-r1';
const historic=phase+'/L8_RUNTIME16_REVIEW_INPUTS_20261016_SCHEMA2',dst=base+'/l8-central-preflight/supplement/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');if(fs.existsSync(dst))throw Error('Supplement exists');
const rp=JSON.parse(fs.readFileSync(historic+'/PARENT/RUNTIME16_PINS.json','utf8')),runtime=[];
for(const f of rp.pins){const b=fs.readFileSync(old+'/'+f.path);runtime.push({path:f.path,bytes:b.length,sha256:sha(b),matchesHistoric:b.length===f.bytes&&sha(b)===f.sha256,expected:f});}
const dependencyNames=['graph-store.ts','lineage.ts','semantic-index.ts','graph.ts','cluster.ts','planner.ts','validation.ts','investigation-groups.ts','scc.ts','runtime.ts'];
const dependencies=dependencyNames.map(n=>{const a=fs.readFileSync(root+'/tools/ff8-harness/src/'+n),b=fs.readFileSync(old+'/tools/ff8-harness/src/'+n);return {name:n,mainSha256:sha(a),oldOwnerSha256:sha(b),equal:a.equals(b)};});
const guard=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name),s=fs.lstatSync(p);if(s.isSymbolicLink()){guard.push({path:path.relative(root,p).replaceAll('\\','/'),kind:'symlink-not-followed'});continue;}if(s.isDirectory())walk(p);else if(/\.(ts|json|md|jsonc|lock)$/.test(e.name)){const b=fs.readFileSync(p);guard.push({path:path.relative(root,p).replaceAll('\\','/'),bytes:b.length,sha256:sha(b)});}}}
for(const rel of ['src','test','schemas','scripts'])walk(root+'/tools/ff8-harness/'+rel);
for(const n of ['package.json','tsconfig.json','bun.lock']){const p=root+'/tools/ff8-harness/'+n,b=fs.readFileSync(p);guard.push({path:'tools/ff8-harness/'+n,bytes:b.length,sha256:sha(b)});}
fs.mkdirSync(dst,{recursive:true});const files=[];
function add(name,source,pin){const b=fs.readFileSync(source);if(pin&&sha(b)!==pin)throw Error('Supplement pin drift');const p=dst+'/'+name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:name,source,bytes:b.length,sha256:sha(b)});}
function data(name,value){const b=JSON.stringify(value,null,2)+'\n';fs.writeFileSync(dst+'/'+name,b,{flag:'wx'});fs.chmodSync(dst+'/'+name,0o444);files.push({path:name,bytes:Buffer.byteLength(b),sha256:sha(b),provenance:'parent current read-only derivation'});}
add('RUNTIME16_PINS.json',historic+'/PARENT/RUNTIME16_PINS.json','fff34791919cfeba7d23db2641144f02e7ecb76b8492237acb9f61ce51d28097');
add('HISTORIC_REVIEW_INPUT_MANIFEST.json',historic+'/REVIEW_INPUT_MANIFEST.json','4b9c20cdd2819c43c2d5c45426cdde7835a33f1ba079474b8eb8e0a66b1ce3d2');
add('HISTORIC_TRANSFER_RESULT.json',phase+'/l8-runtime16-review-schema2-transfer-result-20261016.json');
add('SCOPE.md',base+'/L8_SUPPLEMENT_SCOPE.md');
for(const n of dependencyNames)add('main/src/'+n,root+'/tools/ff8-harness/src/'+n);
for(const n of ['scc.ts','runtime.ts'])add('old-owner/src/'+n,old+'/tools/ff8-harness/src/'+n);
for(const n of ['package.json','tsconfig.json','bun.lock'])add('main/'+n,root+'/tools/ff8-harness/'+n);
data('PARENT_BASELINE_COMPARISON.json',{at:new Date().toISOString(),runtime16:{count:runtime.length,bytes:runtime.reduce((n,f)=>n+f.bytes,0),allMatch:runtime.every(f=>f.matchesHistoric),files:runtime},mainDependencies:dependencies});
data('CURRENT_MAIN_HARNESS_GUARD.json',{at:new Date().toISOString(),scope:'current src/test/schemas/scripts textual files plus package/tsconfig/bun.lock; no runtime DB, no node_modules',originalMain275RehashClaim:false,files:guard});
const raw=JSON.stringify({at:new Date().toISOString(),role:'L8-preflight-context-supplement',files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',raw,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(raw),runtime16AllMatch:runtime.every(f=>f.matchesHistoric),runtime16Count:runtime.length,mainGuardCount:guard.length,permission:'access/hash then continue previously authorized analysis only'};
fs.writeFileSync(base+'/l8-central-preflight/supplement/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
