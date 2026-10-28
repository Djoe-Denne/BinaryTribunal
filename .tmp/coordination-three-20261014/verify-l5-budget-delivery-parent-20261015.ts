import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {strict as assert} from 'node:assert';
import {canonical} from '../../tools/ff8-harness/src/validation';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',own='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l5-budget-astra',proof=own+'/.tmp/L5_ADMISSION_BUDGET',sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const mb=readFileSync(proof+'/FROZEN_MANIFEST.json');assert.equal(sha(mb),'bb50a722c7475a742522ecbdd2e8dfbc99e7a326d93a73945dc36142fa687200');
const m=JSON.parse(mb.toString('utf8'));assert.equal(m.taskId,'task_mv9k1ikn_0000_bo44nq');assert.equal(m.sources.length,2);
for(const f of [...m.sources,...m.evidence]){const b=readFileSync(own+'/'+f.path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);}
let inputPins=0;for(const label of ['L5_BUDGET_FIX_13874bc','L5_BUDGET_PLAN_GO_V1']){const base=own+'/inputs/'+label,receipt=JSON.parse(readFileSync(base+'/.preparation-receipt.json'));for(const f of receipt.files){const b=readFileSync(base+'/'+f.path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);}inputPins+=receipt.files.length;}
const im=JSON.parse(readFileSync(own+'/inputs/L5_BUDGET_FIX_13874bc/INPUT_MANIFEST.json','utf8'));let unchanged=0;
for(const f of im.files.filter((f:any)=>f.origin.startsWith('owned committed HEAD'))){if(f.path==='tools/ff8-harness/src/planner.ts')continue;assert.equal(sha(readFileSync(own+'/'+f.path)),f.sha256,'Readonly ROOT differs '+f.path);unchanged++;}assert.equal(unchanged,306);
const norm=(s:string)=>s.split(String.fromCharCode(92)).join('/');let dbBytes=0;
for(const db of m.retainedFixtureDatabases){const p=norm(db.path);assert(p.startsWith('C:/Users/djden/AppData/Local/Temp/opencode/l5-admission-budget-')||p.startsWith(own+'/.tmp/L5_ADMISSION_BUDGET/full-temp-'));assert(p.endsWith('/own.db'));const b=readFileSync(p);assert.equal(b.length,db.bytes);assert.equal(sha(b),db.sha256);assert.equal(b.subarray(0,15).toString(),'SQLite format 3');assert(!existsSync(p+'-wal')&&!existsSync(p+'-shm'));dbBytes+=b.length;}
assert.equal(m.retainedFixtureDatabases.length,4);assert(m.gates.every((g:any)=>g.exitCode===0));
const module=await import(pathToFileURL(own+'/tools/ff8-harness/src/planner.ts').href),fixture=own+'/inputs/L5_BUDGET_FIX_13874bc/REFERENCE_L8/.tmp/L8_BUDGET_EVIDENCE/';
const get=(p:string)=>JSON.parse(readFileSync(fixture+p,'utf8')),actual=module.planMission(get('snapshot.json'),get('groups.json'),get('policy.json')),expected=get('prepared.json').planning;
assert.equal(canonical(actual),canonical(expected),'Legacy full planning changed');const oldDigest=sha(canonical(actual));assert.equal(oldDigest,'8f5a36ff063a30ca16fafee89236b8e67ba7d9c79172e838274fd7ee0888d7c8');
const result={task:m.taskId,manifestSha256:sha(mb),reportedManifestFingerprint:m.fingerprint,sources:m.sources,sourceRootPinsExact:2,proofPinsExact:m.evidence.length,allInputPinsExact:inputPins,otherRootPinsExact:unchanged,oldPlannerTestUnchanged:true,retainedDatabases:m.retainedFixtureDatabases.length,retainedDatabaseBytes:dbBytes,parentLegacyReplayByteExact:oldDigest,gates:m.gates.map((g:any)=>({name:g.gate,exit:g.exitCode,pass:g.pass,fail:g.fail,skip:g.skip,assertions:g.expectCalls,ms:g.durationMs})),parentAcceptance:false,noMainModification:true};
writeFileSync(phase+'/l5-budget-delivery-parent-verification.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
