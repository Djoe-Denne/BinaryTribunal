// Parent-only deployment of immutable, independently reviewed source artefacts.
// Existing code edits happen through the patch tool between preflight/finalize.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-continuous',dir=base+'/l8-central-preflight';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const guard=JSON.parse(fs.readFileSync(dir+'/supplement/inputs/CURRENT_MAIN_HARNESS_GUARD.json','utf8'));
const pins=JSON.parse(fs.readFileSync(dir+'/supplement/inputs/RUNTIME16_PINS.json','utf8')).pins;
const existing=['domain.ts','engine.ts','cli.ts','client.ts'].map(n=>'tools/ff8-harness/src/'+n);
const allow=pins.filter(p=>!p.path.endsWith('/src/adapter.ts'));
function source(f){return dir+'/inputs/old-owner/'+f.path.replace('tools/ff8-harness/','');}
function exact(p,f){const s=fs.lstatSync(p),b=fs.readFileSync(p);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Guard mismatch '+p);}
for(const f of pins)exact(source(f),f);
if(process.argv[2]==='preflight'){
for(const f of guard.files){if(f.kind)throw Error('Unexpected guard link');exact(root+'/'+f.path,f);}
for(const f of allow)if(!existing.includes(f.path)&&fs.existsSync(root+'/'+f.path))throw Error('New destination exists '+f.path);
fs.mkdirSync(base+'/l8-baseline-backup');for(const p of existing)fs.copyFileSync(root+'/'+p,base+'/l8-baseline-backup/'+path.basename(p),fs.constants.COPYFILE_EXCL);
const r={at:new Date().toISOString(),phase:'PREFLIGHT_ONLY',guard:guard.files.length,preimages:guard.files.filter(f=>existing.includes(f.path)),targets:allow,existingEditsByPatchToolRequired:true,artifactInstallPermission:'11 absent runtime16 byte-exact artifacts only after four patched outputs equal accepted pins'};
fs.writeFileSync(base+'/l8-baseline-preflight.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({preflight:true,guard:guard.files.length,backups:existing.length,newArtifacts:allow.length-existing.length}));
}else if(process.argv[2]==='finalize'){
const prior=JSON.parse(fs.readFileSync(base+'/l8-baseline-preflight.json','utf8'));
for(const f of guard.files){const expected=pins.find(x=>x.path===f.path&&existing.includes(f.path))||f;exact(root+'/'+f.path,expected);}
for(const f of allow.filter(f=>!existing.includes(f.path)))if(fs.existsSync(root+'/'+f.path))throw Error('Absent destination collision '+f.path);
const installed=[];for(const f of allow.filter(f=>!existing.includes(f.path))){fs.mkdirSync(path.dirname(root+'/'+f.path),{recursive:true});fs.copyFileSync(source(f),root+'/'+f.path,fs.constants.COPYFILE_EXCL);exact(root+'/'+f.path,f);installed.push(f.path);}
for(const f of pins)exact(root+'/'+f.path,f);
for(const f of guard.files.filter(f=>!existing.includes(f.path)))exact(root+'/'+f.path,f);
const r={at:new Date().toISOString(),stage:'RUNTIME16_PIN_EXACT_DEPLOYMENT_NOT_RUNTIME_QUALIFICATION',existingPatched:existing,newArtifactDeployments:installed,acceptedRuntime16Pins:pins,runtime16Bytes:pins.reduce((n,f)=>n+f.bytes,0),outsideAllowlistGuardExact:guard.files.length-existing.length,packageConfigAndMaintenancePreserved:true,testsRun:false,reviewPending:true};
fs.writeFileSync(base+'/l8-baseline-promotion-receipt.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({runtimePins:pins.length,bytes:r.runtime16Bytes,newArtifacts:installed.length,outsideGuard:r.outsideAllowlistGuardExact,testsRun:false,reviewPending:true}));
}else throw Error('Expected preflight|finalize');
