import { readFileSync, writeFileSync, statSync, lstatSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript/lib/typescript.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8', phase=root+'/.tmp/coordination-three-20261014';
const go=JSON.parse(readFileSync(phase+'/l7-copy851-ledger-v2-public-memory-probes-actual-final-go-20261016.json','utf8'));
const target=JSON.parse(readFileSync(phase+'/l7-copy851-ledger-v2-target-actual-final-go-20261016.json','utf8'));
const request=JSON.parse(readFileSync(phase+'/l7-copy851-ledger-v2-preparation-request-20261016.json','utf8'));
const run=go.run, sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const pin=(path:string,p:any)=>{const b=readFileSync(path);assert.equal(b.length,p.bytes,path);assert.equal(sha(b),p.sha256,path);return b;};
const fixed=[
 {path:'PLAN.json',bytes:31776,sha256:'132b4b86587bc13d7771da990dca3ccf0f13196e051572b52d09373a6c8e954e'},
 {path:'PROBE_SCRIPT.ts',bytes:14312,sha256:'8ee92923240f5d8417720b254d8b69d12655fbe60f596edd5f9d5df157e22f98'},
 {path:'DECLARATION_PINS.json',bytes:841,sha256:'4a7ebde96916f3d59f6a0cf0c41eeb046fabbaeef36216fa78fa659838e1fb0d'}];
for(const f of fixed)pin(run+'/'+f.path,f);
const plan=JSON.parse(readFileSync(run+'/PLAN.json','utf8')), declarations=JSON.parse(readFileSync(run+'/DECLARATION_PINS.json','utf8'));
const pre=JSON.parse(readFileSync(run+'/PRE_EXECUTION.json','utf8')), qb=readFileSync(run+'/POST_PROBE_QUALIFICATION.json'),q=JSON.parse(qb.toString('utf8'));
const endBytes=readFileSync(run+'/probe.lifecycle.json'), end=JSON.parse(endBytes.toString('utf8'));
assert.equal(end.pid,48168);assert.equal(end.exit,0);assert(end.naturalExit&&end.signal===null&&end.error===null);
assert(end.sameProcessEnvironmentUnchanged&&end.guardStillAbsent);assert.equal(end.productProbeInvocations,1);assert.equal(end.tscInvocations,0);assert.equal(end.targetInvocations,0);
assert.deepEqual(end.command,['bun',(run+'/PROBE_SCRIPT.ts').replaceAll('/','\\')]);assert(end.elapsedMs<=60000);
assert(Date.parse(declarations.at)>Date.parse(go.at)&&Date.parse(declarations.at)<Date.parse(end.start));assert.equal(declarations.declaredCases,12);assert.equal(declarations.maxUnits,2);
assert.equal(pre.cwd,target.cwd);assert.equal(pre.goAt,go.at);assert(Date.parse(pre.at)<=Date.parse(end.start));
const stdout=readFileSync(run+'/probe.stdout.log'),stderr=readFileSync(run+'/probe.stderr.log');assert.equal(stderr.length,0);
const rows=stdout.toString('utf8').trim().split('\n').map(l=>JSON.parse(l)), ids=Array.from({length:12},(_,i)=>'M'+String(i+1).padStart(2,'0'));
const starts=rows.filter(r=>r.kind==='case_start'),ends=rows.filter(r=>r.kind==='case_end'),summaries=rows.filter(r=>r.kind==='probe_summary');
assert.equal(rows.length,25);assert.deepEqual(starts.map(r=>r.id),ids);assert.deepEqual(ends.map(r=>r.id),ids);assert(ends.every(r=>r.status==='pass'));assert.equal(summaries.length,1);
assert.equal(plan.cases.length,12);assert.deepEqual(plan.cases.map((r:any)=>r.id),ids);assert.deepEqual(declarations.caseIds,ids);
const summary=summaries[0];for(const k of ['declaredCases','executedCases','passed'])assert.equal(summary[k],12);for(const k of ['failed','newDatabases','newPorts'])assert.equal(summary[k],0);assert.equal(summary.maxUnitsPerFixture,2);
assert.deepEqual(q.summary,summary);assert.deepEqual(q.cases,ends);assert.deepEqual(q.lifecycle,end);
const src=readFileSync(run+'/PROBE_SCRIPT.ts','utf8'),ast=ts.createSourceFile('PROBE_SCRIPT.ts',src,ts.ScriptTarget.Latest,true);assert.equal(ast.parseDiagnostics.length,0);
const imports=ast.statements.filter(ts.isImportDeclaration).map(n=>(n.moduleSpecifier as ts.StringLiteral).text);
assert.deepEqual(imports.slice(0,2),['node:assert/strict','./PLAN.json']);assert.equal(imports.length,6);
for(const [i,n] of ['simulator.ts','planner.ts','graph-normalize.ts','validation.ts'].entries())assert.equal(imports[i+2],'file:///'+go.packet+'/tools/ff8-harness/src/'+n);
for(const s of ['bun:sqlite','new GraphStore','new Store','new Database','as any','node:fs','node:net','node:http'])assert(!src.includes(s));
let bytes=0;assert.equal(q.inputChecks.length,402);
for(const f of request.files){const row=q.inputChecks.find((r:any)=>r.path===f.path);assert(row&&row.match&&row.sha256===f.sha256);bytes+=pin(go.packet+'/'+f.path,row).length;}assert.equal(bytes,9300341);
assert.equal(pin(go.packet+'/'+q.ledger.path,q.ledger).length,8943882);assert.equal(q.ledger.sha256,target.ledger.sha256);assert.equal(statSync(go.packet+'/'+q.ledger.path).mode&0o222,0);assert.equal(statSync(go.packet+'/'+q.ledger.path).nlink,1);assert(!lstatSync(go.packet+'/'+q.ledger.path).isSymbolicLink());
pin(go.packet+'/.preparation-receipt.json',q.receipts.helper);pin(go.packet+'/LARGE_FIXTURE_PARENT_RECEIPT.json',q.receipts.parent);
for(const f of q.parentControls)pin(go.proofDirectory+'/'+f.path,f);for(const f of q.targetFiles)pin(target.newRun+'/'+f.path,f);pin(target.newRun+'/TARGET_V2_ARTIFACTS.json',q.targetManifest);
for(const f of q.declarationFiles)pin(run+'/'+f.path,f);
assert.deepEqual(q.tempAfter.rootEntries,['opencode']);assert.deepEqual(q.tempAfter.nestedEntries,[]);assert.equal(q.tempAfter.opaqueCacheFiles.length,0);assert.equal(q.tempAfter.forcedCacheAbsence,false);
assert.deepEqual(readdirSync(go.existingOwnedTempRoot),['opencode']);assert.deepEqual(readdirSync(go.existingOwnedTempRoot+'/opencode'),[]);
const actual=(id:string)=>ends.find(r=>r.id===id).actual;
assert.equal(actual('M01').makespan,2*(Math.max(2,5)+3+1));assert.equal(actual('M01').work,2*(2+5+3));assert.equal(actual('M02').rows[1].makespan,2*(2+5+3+1));
assert.equal(actual('M03').observationOccupied,4);assert.equal(actual('M04').getters,0);assert.equal(actual('M04').durations,0);
assert.equal(actual('M06').selfHashValid,true);assert.equal(actual('M06').durationTupleCount,3);assert.equal(actual('M07').commits,2);assert.equal(actual('M08').commits,1);assert.equal(actual('M08').units.find((u:any)=>u.attempts===0).state,'BLOCKED');
assert.equal(actual('M10').occupied,2*3+(4+7+2));assert.equal(actual('M10').rework,6);assert.equal(actual('M10').publicationEnd,3+Math.max(4,7)+2+1);
assert.equal(actual('M11').occupied,2*(4+7+2));assert.equal(actual('M11').makespan,2*(Math.max(4,7)+2+1));assert.equal(actual('M12').occupied,6+2*(4+7+2));assert.equal(actual('M12').makespan,3+2*(Math.max(4,7)+2+1));
const main=JSON.parse(readFileSync(phase+'/l5-budget-main-transfer-before.json','utf8'));for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
const out={at:new Date().toISOString(),task:go.task,session:go.session,run,pid:end.pid,exit:0,durationMs:end.elapsedMs,caseCount:12,pass:12,fail:0,invocations:1,maxUnits:2,newDb:0,newPorts:0,
 planScriptDeclarationPins:fixed,lifecycleSha256:sha(endBytes),stdoutSha256:sha(stdout),stderrSha256:sha(stderr),postQualificationSha256:sha(qb),
 declaredBeforeExecutionAndTwelveNamedCasesActualStartsEndsSummaryVerified:true,
 scriptHasOnlyFourApprovedPublicSourceImportsNoForbiddenDirectApis:true,parentHandDerivationsDag18Work20Sequential22Occupation19_26_32AndContrariesVerified:true,
 all403InputsBothReceiptsParentControlsTargetSevenArtifactsManifestAndDeclarationsExact:true,guardAbsentSameProcessEnvStableNoTscTargetOrFollowupProbe:true,
 ownTempNoCacheObservedNotForcedNoSystemwideFilesystemAuditOrNativeClaim:true,main275Exact:true,
 stage:'PUBLIC_MEMORY_PROBES_PARENT_CONFORMING_finalWholeCandidateReviewDeliveryAndVerdictStillRequired',nonblindPreambleStandaloneStoreOfflineLimitsNotWaived:true};
writeFileSync(phase+'/l7-copy851-ledger-v2-public-memory-probes-parent-verification-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage:out.stage,pid:out.pid,pass:out.pass,fail:out.fail,invocations:out.invocations,maxUnits:2,newDb:0,newPorts:0,all403PinsAndProofsExact:true,manualArithmeticVerified:true,postQualificationSha256:out.postQualificationSha256}));
