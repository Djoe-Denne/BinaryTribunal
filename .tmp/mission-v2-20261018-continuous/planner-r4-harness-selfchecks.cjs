// Parent-only fixture selfchecks AFTER source V, BEFORE any product/TSC/oncegate.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',base=root+'/.tmp/mission-v2-20261018-continuous',sha=x=>crypto.createHash('sha256').update(x).digest('hex'),stem='planner-r4-harness-selfcheck',staticRaw=fs.readFileSync(base+'/planner-gate-r4-parent-static-adjudication.json'),approval=JSON.parse(staticRaw),frozen=base+'/planner-gate-r4-frozen',gatePath=frozen+'/gate.cjs',capturePath=frozen+'/capture.ts',childPath=base+'/planner-r4-capture-selfcheck-child.ts';
if(approval.verdict!=='ACCEPTABLE_PLANNER_GATE_R4_SOURCE_SCOPED_PENDING_PARENT_SELFCHECKS'||approval.executeOnce!==false||sha(fs.readFileSync(gatePath))!==approval.sourceGateSha256||sha(fs.readFileSync(capturePath))!==approval.sourceCaptureSha256)throw Error('Source acceptance/pin missing');
for(const n of ['lease','receipt','release'])if(fs.existsSync(base+'/'+stem+'-'+n+'.json'))throw Error('Already attempted, retain red/no autoretry');
const bindingRaw=fs.readFileSync(base+'/planner-gate-r4-expected-binding.json'),binding=JSON.parse(bindingRaw);if(sha(bindingRaw)!==approval.bindingRawSha256)throw Error('Binding drift');
function checkInputs(){for(const f of binding.pins){const b=fs.readFileSync(f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Input drift '+f.path);}}checkInputs();
const tool=JSON.parse(fs.readFileSync(base+'/l8-relation-static-pure-closure.json')).tool;if(sha(fs.readFileSync(tool.path))!==tool.sha256)throw Error('ASTtool drift');const ts=require(tool.path),gateText=fs.readFileSync(gatePath,'utf8'),sf=ts.createSourceFile(gatePath,gateText,ts.ScriptTarget.ESNext,true),parseNode=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='parseTrace');if(!parseNode)throw Error('Reviewed parser not found');const parserSource=parseNode.getText(sf);
const scratch='C:/Users/djden/AppData/Local/Temp/opencode/PLANNER-R4-SELFCHECK-'+Date.now();
const lease={at:new Date().toISOString(),ownerPid:process.pid,scratch,scope:'owned capturefixtures+exactisolatedparseTrace,NOproduct/TSC/fullgate',staticApprovalSha256:sha(staticRaw)};fs.writeFileSync(base+'/'+stem+'-lease.json',JSON.stringify(lease,null,2)+'\n',{flag:'wx'});
const runs=[],parserChecks=[];let failure=null,allQualified=false;
function pin(p){const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:sha(b)};}
try {
  fs.mkdirSync(scratch);const bun=JSON.parse(fs.readFileSync(base+'/l8-relation-extraction-gate-receipt.json')).bun;
  const positive=['basic','equal-a','equal-b','holes','null-array','undefined','null','negative-zero','positive-zero','nan','positive-infinity','negative-infinity','alias','clones','cycle','null-object','map-set','error-cause-a','error-cause-b'];
  const fatal=['promise-null-proto','map-object-proto','set-object-proto','array-null-proto','error-object-proto','date-object-proto','regexp-null-proto','buffer-null-proto','boxed-number-object-proto','forged-map-proto','url-object-proto','function','symbol','accessor','proxy','ordinary-error','trace-write-failure'];
  for(const mode of [...positive,...fatal,'footer-existing','footer-directory']) {
    checkInputs();const d=scratch+'/'+mode;for(const n of ['home','config','appdata','localappdata','temp','bun-cache','node-cache','trace-directory','footer-directory'])fs.mkdirSync(d+'/'+n,{recursive:true});
    fs.copyFileSync(capturePath,d+'/capture.ts',fs.constants.COPYFILE_EXCL);fs.copyFileSync(childPath,d+'/child.ts',fs.constants.COPYFILE_EXCL);fs.writeFileSync(d+'/bunfig.toml','[test]\npreload = []\n',{flag:'wx'});
    const trace=mode==='trace-write-failure'?d+'/trace-directory':d+'/planner-full-trace.jsonl',meta=mode==='footer-directory'?d+'/footer-directory':d+'/planner-full-meta.json';
    const env={SystemRoot:process.env.SystemRoot||process.env.SYSTEMROOT,WINDIR:process.env.WINDIR||process.env.windir,HOME:d+'/home',USERPROFILE:d+'/home',XDG_CONFIG_HOME:d+'/config',APPDATA:d+'/appdata',LOCALAPPDATA:d+'/localappdata',TEMP:d+'/temp',TMP:d+'/temp',NODE_DISABLE_COMPILE_CACHE:'1',BUN_RUNTIME_TRANSPILER_CACHE_PATH:'0',FF8_PARENT_DIFF_TRACE:trace,FF8_PARENT_DIFF_META:meta,NO_COLOR:'1',FORCE_COLOR:'0'};
    const at=Date.now(),r=cp.spawnSync(bun.path,['--no-env-file','--config='+d+'/bunfig.toml',d+'/child.ts',mode],{cwd:d,env,encoding:'utf8',timeout:5000,maxBuffer:4096,windowsHide:true});
    fs.writeFileSync(d+'/stdout.txt',r.stdout||'',{flag:'wx'});fs.writeFileSync(d+'/stderr.txt',r.stderr||'',{flag:'wx'});let summary=null,footer=null;try{summary=JSON.parse(r.stdout);}catch{}if(fs.existsSync(meta)&&fs.statSync(meta).isFile())try{footer=JSON.parse(fs.readFileSync(meta,'utf8'));}catch{}
    const footerFailure=mode.startsWith('footer-'),fatalExpected=fatal.includes(mode),callsExpected=mode==='basic'?12:1;
    const ok=!r.error&&!r.signal&&!r.stderr&&summary?.ok===true&&summary.calls===callsExpected&&(footerFailure?r.status===97:r.status===0&&footer?.schema==='planner-full-trace-r4'&&footer.finalized===true&&footer.issued===callsExpected&&footer.completed===callsExpected&&Array.isArray(footer.fatal)&&(fatalExpected?footer.fatal.length>0:footer.fatal.length===0));
    const row={mode,ok,expectedFatal:fatalExpected,footerFailure,exitCode:r.status,ownedRunnerPid:r.pid,error:r.error?String(r.error):null,signal:r.signal,elapsedMs:Date.now()-at,summary,footer,stdout:pin(d+'/stdout.txt'),stderr:pin(d+'/stderr.txt'),trace:fs.existsSync(trace)&&fs.statSync(trace).isFile()?pin(trace):null,metadata:fs.existsSync(meta)&&fs.statSync(meta).isFile()?pin(meta):null};runs.push(row);
    if(fs.readdirSync(d+'/bun-cache').length||fs.readdirSync(d+'/node-cache').length||fs.existsSync(d+'/0'))throw Error('Unexpected compile cache fixture output');
    if(!ok)throw Error('Capture fixture failed: '+mode);
  }
  function bytes(mode){return fs.readFileSync(scratch+'/'+mode+'/planner-full-trace.jsonl');}
  if(!bytes('equal-a').equals(bytes('equal-b')))throw Error('Deterministic equal data differed');
  for(const [a,z]of [['holes','null-array'],['undefined','null'],['negative-zero','positive-zero'],['alias','clones'],['error-cause-a','error-cause-b']])if(bytes(a).equals(bytes(z)))throw Error('Lossy serialization: '+a+'/'+z);
  const need=(v,m)=>{if(!v)throw Error(m);},equal=(a,z)=>JSON.stringify(a)===JSON.stringify(z),parseTrace=new Function('fs','Buffer','scratch','METHODS','need','equal','filePin','return ('+parserSource+');')(fs,Buffer,scratch,['planMission','compareGranularities'],need,equal,pin);
  parseTrace('basic');parserChecks.push({name:'reviewed-parser-positive',expectedAccept:true,accepted:true});
  const original=bytes('basic').toString('utf8'),meta=JSON.parse(fs.readFileSync(scratch+'/basic/planner-full-meta.json','utf8')),rows=original.trimEnd().split('\n').map(s=>JSON.parse(s));
  const mutations=[
    ['missing-terminal',r=>r.filter((x,i)=>i!==1),m=>m],
    ['duplicate-begin',r=>[r[0],r[0],...r.slice(1)],m=>m],
    ['duplicate-terminal',r=>[...r,r[1]],m=>m],
    ['wrong-method',r=>r.map((x,i)=>i===1?{...x,name:'other'}:x),m=>m],
    ['issued-mismatch',r=>r,m=>({...m,issued:m.issued+1})],
    ['completed-mismatch',r=>r,m=>({...m,completed:m.completed-1})],
    ['fatal-footer',r=>r,m=>({...m,fatal:[{stage:'fixture',id:1,reason:'must reject'}]})],
    ['not-finalized',r=>r,m=>({...m,finalized:false})],
    ['no-refusal',r=>r.map(x=>x.kind==='THROW'?{...x,kind:'RETURN'}:x),m=>m],
    ['single-method',r=>r.map(x=>({...x,name:'planMission'})),m=>m]
  ];
  for(const [name,changeRows,changeMeta]of mutations){const d=scratch+'/'+name;fs.mkdirSync(d);fs.writeFileSync(d+'/planner-full-trace.jsonl',changeRows(rows).map(x=>JSON.stringify(x)).join('\n')+'\n',{flag:'wx'});fs.writeFileSync(d+'/planner-full-meta.json',JSON.stringify(changeMeta(meta))+'\n',{flag:'wx'});let accepted=true;try{parseTrace(name);}catch{accepted=false;}parserChecks.push({name,expectedAccept:false,accepted});if(accepted)throw Error('Reviewed parser accepted tamper '+name);}
  for(const [name,footer]of [['duplicate-footer',JSON.stringify(meta)+'\n'+JSON.stringify(meta)+'\n'],['missing-footer',null]]){const d=scratch+'/'+name;fs.mkdirSync(d);fs.writeFileSync(d+'/planner-full-trace.jsonl',original,{flag:'wx'});if(footer)fs.writeFileSync(d+'/planner-full-meta.json',footer,{flag:'wx'});let accepted=true;try{parseTrace(name);}catch{accepted=false;}parserChecks.push({name,expectedAccept:false,accepted});if(accepted)throw Error('Reviewed parser accepted '+name);}
  checkInputs();allQualified=true;
} catch(error){failure=error instanceof Error?error.message:'selfcheck infrastructure error';}
const receipt={at:new Date().toISOString(),scope:lease.scope,lease,scratch,sourceGate:pin(gatePath),sourceCapture:pin(capturePath),childFixture:pin(childPath),isolatedReviewedParserSha256:sha(parserSource),bindingRawSha256:sha(bindingRaw),runs,parserChecks,serializationPairsChecked:allQualified?6:null,allQualified,failure,noProductTscOrWholeGateExecuted:true,noGlobalConfigurationChange:true,allArtifactsRetained:true};
fs.writeFileSync(base+'/'+stem+'-receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});fs.writeFileSync(base+'/'+stem+'-release.json',JSON.stringify({at:new Date().toISOString(),lease,activeOwnedRunner:false,retention:'all fixture sources/logs/traces/metadata retained,no cleanup'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({allQualified,failure,captureCases:runs.length,positiveCases:runs.filter(r=>r.ok&&!r.expectedFatal&&!r.footerFailure).length,expectedFatalCases:runs.filter(r=>r.ok&&r.expectedFatal).length,footerFailureCases:runs.filter(r=>r.ok&&r.footerFailure).length,parserChecks:parserChecks.length,scratch}));if(!allQualified)process.exitCode=2;
