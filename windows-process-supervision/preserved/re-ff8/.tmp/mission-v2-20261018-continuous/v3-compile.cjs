// Parent-only compiler gate. No product executable is loaded or run here.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-continuous';
const matrix=root+'/.tmp/mission-v2-20261018-r1/v3-matrix-source';
const fw='C:/Windows/Microsoft.NET/Framework64/v4.0.30319';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),bs=p=>p.replaceAll('/','\\');
const sources=[
['inputs/frozen/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs','bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709'],
['inputs/frozen/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs','7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f'],
['inputs/frozen/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs','a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284'],
['inputs/frozen/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs','0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f'],
['inputs/frozen/V3_HOST_SOURCE_OUTPUT_20261017/HostLauncher.cs','1cc9cca0f0d2516f40c42f6d2b421126aa7b05bef29bcbfcd3e5760c1d956a15'],
['supplement-capture/inputs/CaptureWiring.cs','d08beba3b371661a1c7a12d4ddda697514556bdc2f91dc16028b0fa20cc2987f'],
['inputs/frozen/V3_HOST_CORRECTION_OUTPUT_20261017/WriterLedger.cs','67e9b21c1f8ec6212fa3d21199254359770e5e0b4b56c7268567af55eb0323b0'],
['inputs/frozen/V3_REALNATIVE_OUTPUT_20261017/RealNative.cs','e58eef0c8086240e2e8296415cf6ff7e3cbce253aba1d0e4bf425728e1e26e14'],
['outputs/RunnerMatrix.cs','ee6a830ce4e6e03fcdc7c3d743835bc87b1e96b9ce86cf05a635604fc2e16a7c']
].map(([p,h])=>({path:matrix+'/'+p,sha256:h}));
const tools=[
['csc.exe','eca02e6b15cde93009a59a3d129d5a77fb5008f2e1cf62cf573b6737c747ecc3'],
['mscorlib.dll','94715f6991e2b9dc7481532c05aa99e74a5fff4ee147be541bca27f99e003fc7'],
['System.dll','09787b4f38f4f020c6b8a3894146085d4df7b8ae337577ed42d9acf1419660e8'],
['System.Core.dll','d1bafee1a4dd7e7bd9adf6859e7b1b654d1b4e0d031a38795e33ba040508c09d']
].map(([n,h])=>({path:fw+'/'+n,sha256:h}));
function pins(){for(const f of [...sources,...tools]){const s=fs.lstatSync(f.path);if(!s.isFile()||s.isSymbolicLink()||sha(fs.readFileSync(f.path))!==f.sha256)throw Error('Pin mismatch '+f.path);}}
pins();
const combined=sha(sources.map(f=>f.sha256).join('\n'));
const scratch='C:/Users/djden/AppData/Local/Temp/opencode/V3MATRIX-'+combined.slice(0,10)+'-'+Date.now();
fs.mkdirSync(scratch);const output=scratch+'/RunnerMatrix.exe';
const argv=['/noconfig','/nologo','/nostdlib+','/target:winexe','/platform:x64','/debug-','/optimize-','/codepage:65001','/langversion:5','/main:ReGraph.GuardV3.RunnerMatrix','/out:'+bs(output),...tools.slice(1).map(f=>'/r:'+bs(f.path)),...sources.map(f=>bs(f.path))];
const started=Date.now(),run=cp.spawnSync(bs(tools[0].path),argv,{cwd:scratch,encoding:'utf8',timeout:120000,maxBuffer:262144,killSignal:'SIGKILL',windowsHide:true});
const receipt={at:new Date().toISOString(),gate:'V3_COMPILE_GATE.md',scratch,compiler:tools[0],references:tools.slice(1),sources,argv,exitCode:run.status,signal:run.signal,error:run.error?String(run.error.message):null,elapsedMs:Date.now()-started,stdout:run.stdout||'',stderr:run.stderr||'',productExecuted:false};
if(run.status===0&&fs.existsSync(output)){const b=fs.readFileSync(output),pe=b.readUInt32LE(0x3c);if(b.toString('ascii',0,2)!=='MZ'||b.toString('ascii',pe,pe+4)!=='PE\0\0'||b.readUInt16LE(pe+4)!==0x8664||b.readUInt16LE(pe+24)!==0x20b||b.readUInt16LE(pe+24+68)!==2)throw Error('Unexpected PE type');receipt.executable={path:output,bytes:b.length,sha256:sha(b),machine:'AMD64',optionalHeader:'PE32+',subsystem:'WindowsGUI'};fs.chmodSync(output,0o444);}
pins();receipt.postPinsExact=true;
const text=JSON.stringify(receipt,null,2)+'\n';fs.writeFileSync(scratch+'/compile-receipt.json',text,{flag:'wx'});fs.chmodSync(scratch+'/compile-receipt.json',0o444);fs.writeFileSync(base+'/v3-compile-receipt.json',text,{flag:'wx'});fs.chmodSync(base+'/v3-compile-receipt.json',0o444);
console.log(JSON.stringify({exitCode:receipt.exitCode,error:receipt.error,elapsedMs:receipt.elapsedMs,executable:receipt.executable,diagnostics:(receipt.stdout+receipt.stderr).slice(0,4500),sources:sources.length,postPinsExact:true,productExecuted:false}));
if(run.status!==0)process.exitCode=2;
