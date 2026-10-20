// Parent-only immutable data copy, not a product run.
const fs=require('fs'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8';
const base=root+'/.tmp/mission-v2-20261018-r1/v3-matrix-source';
const origin=root+'/.tmp/coordination-three-20261014/V3_HOST_SOURCE_OUTPUT_20261017';
const dst=base+'/supplement-capture/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected='d08beba3b371661a1c7a12d4ddda697514556bdc2f91dc16028b0fa20cc2987f';
const historic=JSON.parse(fs.readFileSync(origin+'/MANIFEST.json','utf8'));
const item=historic.files.find(f=>f.path.endsWith('/CaptureWiring.cs'));
const raw=fs.readFileSync(origin+'/CaptureWiring.cs');
if(!item||item.sha256!==expected||raw.length!==6029||sha(raw)!==expected)throw Error('Capture pin drift');
if(fs.existsSync(dst))throw Error('Supplement exists');
fs.mkdirSync(dst,{recursive:true});const files=[];
for(const [name,source]of [['CaptureWiring.cs',origin+'/CaptureWiring.cs'],['SCOPE.md',base+'/CAPTURE_SUPPLEMENT_SCOPE.md']]){const bytes=fs.readFileSync(source);fs.writeFileSync(dst+'/'+name,bytes,{flag:'wx'});fs.chmodSync(dst+'/'+name,0o444);files.push({path:name,source,bytes:bytes.length,sha256:sha(bytes)});}
const bytes=JSON.stringify({at:new Date().toISOString(),kind:'append-only-input-supplement',originalManifestUnchanged:'6243ae5d0ae98667bc80e4ac44d68798dfca4e539a30cbace431ee8dcd0b1889',files},null,2)+'\n';
fs.writeFileSync(dst+'/INPUT_MANIFEST.json',bytes,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:files.reduce((s,f)=>s+f.bytes,0),manifestSha256:sha(bytes),sourceCapturePinVerifiedAgainstHistoricManifest:true,permission:'ACK-HOLD; no source writing until native plan approval'};
fs.writeFileSync(base+'/supplement-capture/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
