// Parent-only immutable projection of already captured evidence; does not run product.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-continuous';
const dst=base+'/v3-evidence-review/inputs',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(fs.existsSync(dst))throw Error('Evidence packet exists');
const compile=JSON.parse(fs.readFileSync(base+'/v3-compile-receipt.json','utf8')),summary=JSON.parse(fs.readFileSync(base+'/v3-matrix-summary.json','utf8'));
if(compile.exitCode!==0||!summary.allFiveFactsMatchExpected||summary.results.length!==5)throw Error('Qualification not ready');
const entries=[{name:'SCOPE.md',source:base+'/V3_EVIDENCE_REVIEW_SCOPE.md'},{name:'CONTINUATION.md',source:base+'/CONTINUATION.md'},
{name:'parent/COMPILE_GATE.md',source:base+'/V3_COMPILE_GATE.md'},{name:'parent/EXECUTION_GATE.md',source:base+'/V3_EXECUTION_GATE.md'},
{name:'parent/v3-compile.cjs',source:base+'/v3-compile.cjs'},{name:'parent/v3-execute.cjs',source:base+'/v3-execute.cjs'},
{name:'parent/compile-receipt.json',source:base+'/v3-compile-receipt.json'},{name:'parent/matrix-summary.json',source:base+'/v3-matrix-summary.json'},
{name:'parent/lease.json',source:base+'/v3-execution-lease.json'},{name:'parent/release.json',source:base+'/v3-execution-release.json'},
{name:'compiled/RunnerMatrix.exe',source:compile.executable.path,pin:compile.executable.sha256},
{name:'previous/SOURCE_ADJUDICATION.md',source:root+'/.tmp/mission-v2-20261018-r1/V3_MATRIX_PARENT_ADJUDICATION.md',pin:'f1fb2e23d349c22fcaf31edb9290703b57d476c73eb7c5485fa18be489c2cca3'},
{name:'previous/SOURCE_DESIGN.md',source:root+'/.tmp/mission-v2-20261018-r1/v3-matrix-source/outputs/DESIGN.md',pin:'f230ef21b8be82356e401b690767283be18e82e0c41512a0459f44490c05a75a'}];
for(const f of compile.sources)entries.push({name:'source/'+path.basename(f.path),source:f.path,pin:f.sha256});
for(const r of summary.results){const prefix=summary.runRoot+'/'+r.case;for(const suffix of ['.stdout.txt','.stderr.txt','.receipt.json'])entries.push({name:'runs/'+r.case+suffix,source:prefix+suffix});for(const f of r.files)entries.push({name:'runs/cases/'+r.case+'/'+f.name,source:summary.runRoot+'/cases/'+r.case+'/'+f.name,pin:f.sha256});}
const files=[];for(const e of entries){const b=fs.readFileSync(e.source),s=fs.lstatSync(e.source);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(e.pin&&sha(b)!==e.pin))throw Error('Evidence pin '+e.source);if(b.length>2*1024*1024)throw Error('Evidence file bound');const p=dst+'/'+e.name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b)});}
const total=files.reduce((n,f)=>n+f.bytes,0);if(total>6*1024*1024||files.length>120)throw Error('Evidence packet bound');
const raw=JSON.stringify({at:new Date().toISOString(),role:'fresh-V-captured-evidence-review',policyRevision:1,files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',raw,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:total,manifestSha256:sha(raw),permission:'ACK-HOLD then static evidence review GO; EXE is bytes only, never executed'};
fs.writeFileSync(base+'/v3-evidence-review/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
