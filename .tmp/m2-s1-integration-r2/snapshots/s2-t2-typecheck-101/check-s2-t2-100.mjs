// Parent finite gate101. Source-reviewed T2; older gates stay closed.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const R='C:/Users/djden/source/repos/retro-eng/re-ff8';
const M=path.join(R,'.opencode/missions/team_mvnxgnse_0000_39vpc8');
const D=path.join(R,'.tmp/m2-s1-integration-r2'),C=path.join(D,'tools/ff8-harness');
const E=path.join(D,'evidence/s2-t2-100'),F=path.join(E,'owned-databases'),A=path.join(E,'owned-assets');
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,s)=>{if(!ok)throw Error('S2 resource gate: '+s);};
const [check,...rest]=process.argv.slice(2);need(['typecheck','resources'].includes(check)&&rest.length===0,'exact check required');
const manifest=JSON.parse(fs.readFileSync(path.join(M,'evidence/s2-t2-source-100.json')));
const approved='4b84f3730d894c995d237c7712d3f0c5f8f8eca315fb1fb62d9e0193d965550c';
need(manifest.sourceSetSha256===approved&&sha(JSON.stringify(manifest.files))===approved,'reviewed manifest drift');
const rawBase=fs.readFileSync(path.join(D,'COMPOSITION_RECEIPT.json'));
need(sha(rawBase)==='c6d942afc78a19f02e307d067559a0328d51427e931c068b0f7cbb19e34098bf','base receipt drift');
const base=JSON.parse(rawBase);
const extras=[['src/graph-resource-ledger.ts','ae26217de9e2677246acde0c4cc7b36db99968376b2327334ca5be793306e49f'],
  ['test/s2-author/fixtures.ts','3bcca5253a7462a2a4d1adb09a33928a2e2f6423dcd61c1170aa63e515b547d1'],
  ['test/s2-author/t1-fixtures.ts','1ae50b58fd210f396cef2f547fd997f2e65b3bf7d7a1c01591172c6eba0be040'],
  ['test/s2-author/t1-transition.test.ts','755a26342e9ac5928870a68197fe2153ef01b77c23fbbc7a8652bb083efcf4db'],
  ['test/s2-author/origin-host-fixture.ts','42d8edbd285c459bed3a854598e37925ea01a87f4ae0623864e4f858993eec13'],
  ['test/s2-author/atomic-admission.test.ts','c4d2beb4e3d82e703b3c6cc11815f3d14c634c27b8ab7533024d1aed58c6cb7d'],
  ['test/s2-author/resource-fixtures.ts','dc1316c58b2dc4811423f32064e378caaf6830ad526b966cd4027448e17ce872'],
  ['test/s2-author/resource-admission.test.ts','3f10f55869e98fc5cc0d201bcc6889940a0e4cbc2e531703734380a01ba34385'],
  ['src/graph-generation-budget.ts','220cbe95204fb88cf013aa19c2417c6a56a15bb538681eb21cec05a046a9a98d'],
  ['test/s2-author/body.test.ts','77a3713acd5fef50ee4882c60145dfc01682956abaefe40b49b9b6cd77739e07'],
  ['test/s2-author/s1-source-fixtures.ts','6c7401cbc90e51870c0b761223b7858d6aaea9910748cecd7de6cc8618a4180a']].map(([file,sha256])=>({file,sha256}));
const inputs=[['s2-resource-complement-r2','CONTRACT.md','5baffef80c4e404a6d040eed48fd7a8fe75532328e838d607c59c2f905d05d32'],
  ['s2-resource-complement-r2','resource-fixtures.ts','bc9524497d17d94c5c083a9aadc25a8f8e50de398b63014039cb1579ae8b805f'],
  ['s2-t1-fixture-r2','CONTRACT.md','5f6f8efd29724bc91390bf9f01b8d005e88094d06b9697f114eae3185bc966ef'],
  ['s2-t1-fixture-r2','transition-fixtures.ts','51cb3329b46a6072668ab5627cd43dce505e6076b25e0112dc1cc29348aae315'],
  ['s2-t2-fixture-r2','CONTRACT.md','42f08fd8e36a8ad82d8adb6426d0a31754d3e974f8f5771bdf64edede6c39374'],
  ['s2-t2-fixture-r2','activation-fixtures.ts','5a55dd59ca6234ff2a12a16fb689c22e470f172db0e413646d09cafb79456eeb']].map(([dir,file,sha256])=>({file:path.join(M,'inputs',dir,file),sha256}));
const prior=JSON.parse(fs.readFileSync(path.join(D,'evidence/integration-typecheck.result.json')));
need(prior.status===0&&prior.sourcesUnchanged,'missing prior composition proof');
function assertPins(){
  for(const f of [...base.rows,...manifest.files]){const b=fs.readFileSync(path.join(C,f.path));need(sha(b)===f.sha256&&b.length===f.bytes,'source drift '+f.path);}
  for(const f of [...extras,...prior.controlFiles])need(sha(fs.readFileSync(path.join(C,f.file)))===f.sha256,'control/extra drift '+f.file);
  for(const f of inputs)need(sha(fs.readFileSync(f.file))===f.sha256,'fixture input drift');
}
assertPins();
const controls=['tsconfig.s2-t2.json','tsconfig.integration.json','bunfig.integration.toml'].map(file=>{const b=fs.readFileSync(path.join(C,file));return{file,bytes:b.length,sha256:sha(b)};});
need(controls[2].bytes===0,'empty Bun config required');
const sourceSetSha256=sha(JSON.stringify({base:sha(rawBase),reviewedSource:approved,extras,inputs,controls}));
const BUN='C:/Users/djden/.bun/bin/bun.exe',TSC=path.join(R,'tools/ff8-harness/node_modules/typescript/bin/tsc');
need(sha(fs.readFileSync(BUN))==='15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4','Bun drift');
need(sha(fs.readFileSync(path.join(path.dirname(TSC),'../lib/typescript.js')))==='3ae902c92cc44dace175c0e69e13a4b0899f6983c6121d76b9ab8dd5795e7675','TypeScript drift');
const windows=process.env.SystemRoot||process.env.SYSTEMROOT;
need(typeof windows==='string'&&path.isAbsolute(windows)&&fs.existsSync(path.join(windows,'System32')),'Windows path invalid');
fs.mkdirSync(E,{recursive:true});
const lock=path.join(E,'gate.lock');fs.closeSync(fs.openSync(lock,'wx'));
try{
  const ledgerFile=path.join(E,'run-ledger.json');
  const ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile)):{runs:[],elapsedMs:0};
  need(ledger.runs.every(r=>r.state==='finished'&&r.status===0&&!r.error&&!r.signal),'package stopped after incomplete/red check');
  need(check===['typecheck','resources'][ledger.runs.length],'two-check sequence closed/mismatched');
  need(ledger.runs.every(r=>r.sourceSetSha256===sourceSetSha256),'inputs changed between checks');
  const timeout=check==='typecheck'?60000:180000;need(ledger.elapsedMs+timeout<=240000,'240s ceiling');
  if(check==='resources'){
    const review=JSON.parse(fs.readFileSync(path.join(M,'evidence/s2-t2-100-source-review.json')));
    need(review.sourceSetSha256===approved&&review.verdict==='PRÊT_FIXTURE'&&review.acceptedByParent===true&&review.waiver===false,'independent source review not accepted');
  }
  const envRoot=path.join(D,'run-environments/s2-t2-100-'+check);need(!fs.existsSync(envRoot),'environment collision');
  fs.mkdirSync(envRoot,{recursive:true});for(const n of ['home','config','appdata','localappdata','temp'])fs.mkdirSync(path.join(envRoot,n));
  const env={SystemRoot:windows,WINDIR:windows,HOME:path.join(envRoot,'home'),USERPROFILE:path.join(envRoot,'home'),XDG_CONFIG_HOME:path.join(envRoot,'config'),APPDATA:path.join(envRoot,'appdata'),LOCALAPPDATA:path.join(envRoot,'localappdata'),TEMP:path.join(envRoot,'temp'),TMP:path.join(envRoot,'temp'),NO_COLOR:'1',FORCE_COLOR:'0',NODE_DISABLE_COMPILE_CACHE:'1',BUN_RUNTIME_TRANSPILER_CACHE_PATH:'0'};
  if(check==='resources'){
    need(!fs.existsSync(F)&&!fs.existsSync(A),'fixture and asset directories must be new');
    const reservation={at:new Date().toISOString(),purpose:'gate90 T0/T1 synthetic SQLite only',directory:F,existingDatabasesReused:false,inMemoryFixturesAllowed:true,sourceSetSha256,reservedPaths:Array.from({length:256},(_,i)=>({path:path.join(F,`s2-author-${i+1}.db`),state:'reserved-not-created'})),companions:['-journal','-wal','-shm'],cleanupAuthorized:false};
    fs.writeFileSync(path.join(E,'fixture-reservation.json'),JSON.stringify(reservation,null,2),{flag:'wx'});fs.mkdirSync(F);env.FF8_S2_FIXTURE_DIRECTORY=F;
    const cases=Array.from({length:128},(_,i)=>({ordinal:i+1,caseRoot:path.join(A,`case-${i+1}`),leaseId:`gate101-parent-case-${i+1}`}));
    fs.writeFileSync(path.join(E,'asset-reservation.json'),JSON.stringify({directory:A,cases,allowedFiles:['synthetic/activation.json','negative-readback.json'],cleanupAuthorized:false},null,2),{flag:'wx'});
    fs.mkdirSync(A);const stat=fs.lstatSync(A,{bigint:true});
    need(stat.isDirectory()&&!stat.isSymbolicLink()&&fs.realpathSync(A)===path.resolve(A),'asset directory identity/path');
    const leases={version:'ff8-t2-parent-asset-leases-v1',parentOwner:'gate101-parent',assetDirectory:fs.realpathSync(A),directoryIdentity:`${stat.dev}:${stat.ino}`,cases};
    const leasePath=path.join(E,'parent-asset-leases.json'),text=JSON.stringify(leases,null,2);
    fs.writeFileSync(leasePath,text,{flag:'wx'});env.FF8_S2_T2_ASSET_DIRECTORY=A;env.FF8_S2_T2_ASSET_MANIFEST=leasePath;
    env.FF8_GATE_ASSET_MANIFEST_SHA256=sha(text);
  }
  const args=check==='typecheck'?['--no-env-file','--config=./bunfig.integration.toml',TSC,'--noEmit','-p','tsconfig.s2-t2.json','--pretty','false']:['--no-env-file','--config=./bunfig.integration.toml','test','test/s2-author/atomic-admission.test.ts','test/s2-author/resource-admission.test.ts','test/s2-author/t1-transition.test.ts','test/s2-author/t2-activation.test.ts','--max-concurrency=1','--timeout','15000'];
  const receipt={at:new Date().toISOString(),state:'reserved',check,sourceSetSha256,reviewedSourceSetSha256:approved,controls,command:{executable:BUN,args,cwd:C,env,timeoutMs:timeout},scope:'PREPARE_T1_PARTIAL_FIXTURE_NOT_GLOBAL_S2_OR_NATIVE'};
  ledger.runs.push(receipt);fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
  fs.writeFileSync(path.join(E,check+'.preflight.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
  const start=Date.now(),run=spawnSync(BUN,args,{cwd:C,env,encoding:'utf8',timeout,maxBuffer:8*1024*1024,windowsHide:true}),elapsedMs=Date.now()-start;
  fs.writeFileSync(path.join(E,check+'.stdout.log'),run.stdout||'',{flag:'wx'});fs.writeFileSync(path.join(E,check+'.stderr.log'),run.stderr||'',{flag:'wx'});
  Object.assign(receipt,{state:'finished',status:run.status,signal:run.signal,error:run.error?{code:run.error.code,message:String(run.error.message).slice(0,600)}:null,elapsedMs,stdoutSha256:sha(run.stdout||''),stderrSha256:sha(run.stderr||'')});
  try{assertPins();for(const f of controls)need(sha(fs.readFileSync(path.join(C,f.file)))===f.sha256,'control changed');receipt.sourcesUnchanged=true;}
  catch(e){receipt.sourcesUnchanged=false;receipt.error={code:'SOURCE_DRIFT',message:String(e.message).slice(0,600)};}
  const lines=((run.stdout||'')+String.fromCharCode(10)+(run.stderr||'')).split(String.fromCharCode(10));
  if(check==='resources'){
    const files=fs.readdirSync(F).map(name=>{const p=path.join(F,name),stat=fs.lstatSync(p),match=/^s2-author-(\d+)\.db(?:-(journal|wal|shm))?$/.exec(name),allowed=!!match&&+match[1]>=1&&+match[1]<=256&&stat.isFile()&&!stat.isSymbolicLink();return{path:p,name,bytes:stat.size,allowed,sha256:allowed?sha(fs.readFileSync(p)):null};});
    const inventory={at:new Date().toISOString(),directory:F,files,sqliteFiles:files.filter(f=>f.name.endsWith('.db')).length,totalBytes:files.reduce((s,f)=>s+f.bytes,0),sourceSetSha256,processExited:run.status!==null&&!run.error,unusedReservationsClaimedCreated:false,cleanupPerformed:false};
    const inventoryText=JSON.stringify(inventory,null,2);fs.writeFileSync(path.join(E,'fixture-inventory.json'),inventoryText,{flag:'wx'});
    receipt.fixtureInventorySha256=sha(inventoryText);receipt.sqliteFiles=inventory.sqliteFiles;
    if(files.some(f=>!f.allowed))receipt.error={code:'OWNERSHIP_VIOLATION',message:'Unexpected fixture artifact; no cleanup'};
    const assets=[];
    function walkAsset(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),s=fs.lstatSync(p,{bigint:true}),rel=path.relative(A,p).split(path.sep).join('/');
      const match=/^case-(\d+)(?:\/(synthetic|synthetic\/activation\.json|negative-readback\.json))?$/.exec(rel);
      const expectedDirectory=!!match&&(!match[2]||match[2]==='synthetic');
      const allowed=!!match&&+match[1]>=1&&+match[1]<=128&&!s.isSymbolicLink()&&(expectedDirectory?s.isDirectory():s.isFile());
      assets.push({path:p,relative:rel,identity:`${s.dev}:${s.ino}`,bytes:s.size.toString(),directory:s.isDirectory(),symlink:s.isSymbolicLink(),allowed,sha256:allowed&&s.isFile()?sha(fs.readFileSync(p)):null});
      if(allowed&&s.isDirectory())walkAsset(p);
    }}walkAsset(A);
    const leaseBytes=fs.readFileSync(env.FF8_S2_T2_ASSET_MANIFEST),assetInventory={directory:A,assets,manifestSha256:sha(leaseBytes),manifestUnchanged:sha(leaseBytes)===env.FF8_GATE_ASSET_MANIFEST_SHA256,cleanupPerformed:false};
    const assetText=JSON.stringify(assetInventory,null,2);fs.writeFileSync(path.join(E,'asset-inventory.json'),assetText,{flag:'wx'});receipt.assetInventorySha256=sha(assetText);
    if(assets.some(f=>!f.allowed)||!assetInventory.manifestUnchanged)receipt.error={code:'ASSET_OWNERSHIP_VIOLATION',message:'Unexpected asset or manifest drift; retained without cleanup'};
    receipt.testSummary=lines.filter(s=>/^\s*\d+ (pass|fail|skip|todo)\b/.test(s)||s.includes('expect() calls')||s.startsWith('Ran '));
    if(lines.some(s=>/^\s*[1-9]\d* (skip|todo)\b/.test(s)||s.startsWith('(skip)')||s.startsWith('(todo)')))receipt.error={code:'UNEXECUTED_REQUIRED_CASE',message:'Skipped/todo tests do not satisfy gate'};
  }
  ledger.elapsedMs+=elapsedMs;fs.writeFileSync(path.join(E,check+'.result.json'),JSON.stringify(receipt,null,2),{flag:'wx'});fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
  console.log(JSON.stringify({check,status:receipt.status,error:receipt.error,signal:receipt.signal,elapsedMs,sourceSetSha256,sourcesUnchanged:receipt.sourcesUnchanged,sqliteFiles:receipt.sqliteFiles??0,ledger:{runs:ledger.runs.length,elapsedMs:ledger.elapsedMs},selected:lines.filter(s=>s.includes('error TS')||s.startsWith('(fail)')||s.startsWith('error:')||s.includes(' pass')||s.includes(' fail')||s.includes(' skip')||s.includes('expect() calls')||s.startsWith('Ran ')).slice(0,25),receipt:path.join(E,check+'.result.json')},null,2));
  process.exitCode=run.status===0&&!receipt.error&&!run.signal&&receipt.sourcesUnchanged?0:2;
}finally{fs.unlinkSync(lock);}
