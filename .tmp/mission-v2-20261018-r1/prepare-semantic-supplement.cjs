// Parent-only data copy and hash; does not execute/import any project module.
const fs=require('fs'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8';
const base=root+'/.tmp/mission-v2-20261018-r1/l8-schema-source';
const dst=base+'/supplement-semantic/inputs';
const origin=root+'/tools/ff8-harness/src/semantic-index.ts';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected='bf04ce7c697b107ecc3da95c9574eb835a7d0ad984790f7ab267bcd3938b5cb1';
const qa=JSON.parse(fs.readFileSync(root+'/.tmp/re-graph-scheduler/review-20261014/L7QA_INITIAL_E03/QA_INPUT_MANIFEST.json','utf8'));
if(qa.files.find(f=>f.path==='tools/ff8-harness/src/semantic-index.ts')?.sha256!==expected)throw Error('Accepted pin mismatch');
const raw=fs.readFileSync(origin);if(raw.length!==67194||sha(raw)!==expected)throw Error('Semantic source drift');
if(fs.existsSync(dst))throw Error('Supplement exists');
fs.mkdirSync(dst,{recursive:true});const files=[];
for(const [name,source]of [['semantic-index.ts',origin],['PARENT_DESIGN_DISPOSITIONS.md',base+'/PARENT_DESIGN_DISPOSITIONS.md']]){const b=fs.readFileSync(source);fs.writeFileSync(dst+'/'+name,b,{flag:'wx'});fs.chmodSync(dst+'/'+name,0o444);files.push({path:name,source,bytes:b.length,sha256:sha(b)});}
const bytes=JSON.stringify({at:new Date().toISOString(),kind:'append-only-readonly-supplement',originalManifestUnchanged:'d582826284de34f181e181cd79f501ebbf1c50072192307f50b5c8863760a59e',files},null,2)+'\n';
fs.writeFileSync(dst+'/INPUT_MANIFEST.json',bytes,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(bytes),semanticSourceMatchesAcceptedE03Pin:true,permission:'read/ACK/disposition-confirmation only; no WRITE until native plan approval'};
fs.writeFileSync(base+'/supplement-semantic/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
