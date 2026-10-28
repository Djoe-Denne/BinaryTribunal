import { readFileSync, writeFileSync, mkdirSync, existsSync, symlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = root + '/.tmp/coordination-three-20261014';
const q = JSON.parse(readFileSync(phase + '/l7-namespace-review-preparation-request-20261016.json', 'utf8'));
const frame = phase + '/L7_NAMESPACE_COPY_BOUNDARY_PARENT_REPLAY_20261016';
const pkg = frame + '/package';
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
assert(!existsSync(frame));
for (const f of q.files) {
  const bytes = readFileSync(q.sourceRoot + '/' + f.path); assert.equal(sha(bytes), f.sha256);
  mkdirSync(dirname(pkg + '/' + f.path), { recursive: true });
  writeFileSync(pkg + '/' + f.path, bytes, { flag: 'wx' });
}
symlinkSync(root + '/tools/ff8-harness/node_modules', pkg + '/tools/ff8-harness/node_modules', 'junction');
const code = `
import {planMission} from './src/planner.ts';
import {simPlanFromExport,validateSimPlan,runScenario} from './src/simulator.ts';
import {plannerFixture,scenario} from './test/simulator/scenarios.ts';
import {canonical} from './src/validation.ts';
const f=plannerFixture(2,[[0,1]]),base=simPlanFromExport(planMission(f.graph,f.groups,f.policy));
const results=[];
for(const mode of ['baseline','missing','inherited','nonenum']){
 const plan=structuredClone(base),u=plan.units.find(u=>u.prerequisites.length),p=u.prerequisites[0],id=p.id;
 if(mode!=='baseline')delete p.requirement;
 if(mode==='inherited'){delete p.id;Object.setPrototypeOf(p,{id});}
 if(mode==='nonenum')Object.defineProperty(p,'id',{enumerable:false});
 const detached=structuredClone(plan),copied=detached.units.find(v=>v.unitId===u.unitId).prerequisites[0];
 const diagnostics=validateSimPlan(plan),r=runScenario({plan,config:scenario(['fixture'],[],4).config,durations:{A:2,B:3,R:1}});
 let detachedRunError=null;if(mode==='inherited'||mode==='nonenum'){
  try{runScenario({plan:detached,config:scenario(['fixture'],[],4).config,durations:{A:2,B:3,R:1}});}
  catch(e){detachedRunError={name:e.name,code:e.code};}
 }
 results.push({mode,diagnostics,sourceSame:canonical(plan.source)===canonical(base.source),originalId:id,
  detachedId:copied.id??null,committedUnits:r.metrics.committedUnits,consumer:r.units.find(v=>v.unitId===u.unitId),
  committedTrace:r.trace.filter(e=>e.ev==='committed'),detachedDiagnostics:validateSimPlan(detached),detachedRunError});
}
console.log(JSON.stringify(results));
`;
writeFileSync(frame + '/probe.code.txt', code, { flag: 'wx' });
const started = new Date().toISOString();
const p = spawnSync('bun', ['-e', code], { cwd: pkg + '/tools/ff8-harness', encoding: 'utf8', timeout: 30000 });
writeFileSync(frame + '/stdout.log', p.stdout, { flag: 'wx' });
writeFileSync(frame + '/stderr.log', p.stderr, { flag: 'wx' });
assert.equal(p.status, 0); assert.equal(p.signal, null);
const observations = JSON.parse(p.stdout);
assert.equal(observations.length, 4);
for (const x of observations) { assert.equal(x.diagnostics.length, 0); assert.equal(x.sourceSame, true); }
const normal = observations.find((x: any) => x.mode === 'baseline');
const missing = observations.find((x: any) => x.mode === 'missing');
assert.equal(normal.committedUnits, 2); assert.equal(normal.consumer.state, 'COMMITTED');
assert.equal(missing.committedUnits, 1); assert.equal(missing.consumer.state, 'BLOCKED'); assert.equal(missing.consumer.attempts, 0);
for (const x of observations.filter((x: any) => ['inherited', 'nonenum'].includes(x.mode))) {
  assert.equal(x.detachedId, null); assert.equal(x.committedUnits, 2);
  assert.equal(x.consumer.state, 'COMMITTED'); assert.equal(x.consumer.attempts, 1);
  assert(x.detachedDiagnostics.length > 0); assert.equal(x.detachedRunError.code, 'plan_non_conformant');
}
for (const f of q.files) assert.equal(sha(readFileSync(pkg + '/' + f.path)), f.sha256);
const out = {
  at: new Date().toISOString(), started, frame, task: q.taskId,
  parentPublicMemoryProbeExit0FourCases: true, observations,
  scriptSha256: sha(code), stdoutSha256: sha(p.stdout), package386PinsBeforeAfterExact: true,
  verdict: 'BLOCK_CONFIRMED P1 raw validation before destructive clone loses prerequisite id and bypasses archived known requirement',
  providedArchiveAndSourceUnchangedNoRehashNotTotalOriginRemovalLimit: true,
  noSqliteFullSourceFixNativeOrIntegrationGo: true,
};
writeFileSync(phase + '/l7-copy-boundary-parent-reproduction-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...out, observations: observations.map((x: any) => ({ mode: x.mode, state: x.consumer.state, attempts: x.consumer.attempts, commits: x.committedUnits, detachedId: x.detachedId, sourceSame: x.sourceSame, detachedRunError: x.detachedRunError })) }));
