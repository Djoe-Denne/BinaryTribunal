// Snapshot an already captured bounded DTO; does not run/import the bench.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-continuous',phase=root+'/.tmp/coordination-three-20261014',source=phase+'/V3_L7_MEASURES_DRIVER_OUTPUT_20261017',dst=base+'/l7-measures-adjudication/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');if(fs.existsSync(dst))throw Error('L7 packet exists');
const receipt=JSON.parse(fs.readFileSync(phase+'/l7-measures-run-receipt-20261017.json','utf8'));const entries=[
{name:'SCOPE.md',source:base+'/L7_ADJUDICATION_SCOPE.md'},{name:'CONTINUATION.md',source:base+'/CONTINUATION.md'},
{name:'ORDER.md',source:root+'/docs/missions/re-graph-scheduler/ORDRE_MISSION_V2_20261018.md'},
{name:'PARENT_RUN_RECEIPT.json',source:phase+'/l7-measures-run-receipt-20261017.json'},
{name:'run-capture.txt',source:source+'/run-capture.txt',pin:receipt.execution.captureSha256},
{name:'measures-driver.ts',source:source+'/measures-driver.ts',pin:'04e3122d4414c8e8d408c6612810c6a2ef86358630467abb1a9de98f239b3d28'},
{name:'ORIGINAL_MANIFEST.json',source:source+'/MANIFEST.json'}];
const files=[];for(const e of entries){const b=fs.readFileSync(e.source),s=fs.lstatSync(e.source);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(e.pin&&sha(b)!==e.pin))throw Error('L7 evidence drift '+e.source);if(b.length>2*1024*1024)throw Error('L7 file bound');const p=dst+'/'+e.name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b)});}
const raw=JSON.stringify({at:new Date().toISOString(),role:'existing-L7-DTO-adjudication-no-rerun',policyRevision:1,files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',raw,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const r={at:new Date().toISOString(),files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(raw),permission:'access/hash then parent data analysis GO; never run driver'};
fs.writeFileSync(base+'/l7-measures-adjudication/PARENT_ACCESS_RECEIPT.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(r));
