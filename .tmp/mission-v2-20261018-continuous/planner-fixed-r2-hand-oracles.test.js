// Parent bounded API-only hand oracles, separate from unchanged scientific suites.
import {test,expect} from 'bun:test';
import {createHash} from 'node:crypto';
import {pipelineCost,derivePlannerUnitEstimate,derivePlannerUnitResources,derivePlannerUnitSubIntents,derivePlannerG3} from './src/planner-derived-codecs';
const p=(unitId,functionId)=>'sub:'+createHash('sha256').update(JSON.stringify({functionId,unitId})).digest('hex');
test('pipeline max(A,B)+R+validation and invalid integer',()=>{expect(pipelineCost({A:2,B:5,R:3,validation:1})).toBe(9);expect(()=>pipelineCost({A:-1,B:5,R:3,validation:1})).toThrow('invalid pipeline estimate');});
test('fixed recursive estimate and full-model coverage only',()=>{
  const one={A:2,B:5,R:3,validation:1},two={A:4,B:1,R:1,validation:2};
  const policy=Object.freeze({estimationVersion:'e',sccMaxIterations:3,estimatesByFunction:{a:{...one,version:'e',byModel:{common:one,onlyA:one}},b:{...two,version:'e',byModel:{common:two}}}});
  expect(derivePlannerUnitEstimate(Object.freeze(['a','b']),policy,true)).toEqual({estimate:{version:'e',cost:{known:true,value:48},modelCosts:{common:48}},known:true,cost:48});
});
test('missing and obsolete estimates are unknown, not zero known',()=>{
  const policy={estimationVersion:'e',sccMaxIterations:2,estimatesByFunction:{a:{version:'old',A:3,B:4,R:1,validation:2}}};
  expect(derivePlannerUnitEstimate(['a','missing'],policy,false)).toEqual({estimate:{version:'e',cost:{known:false,value:null},modelCosts:{}},known:false,cost:0});
});
test('resources intersect in original multiplicity, union tools and sum budget',()=>{
  const a=Object.freeze({profiles:['z','a','z'],models:['m'],accounts:['account'],tools:['q'],slots:2,cpu:1,gpu:0,budget:3}),b=Object.freeze({profiles:['z'],models:['m','n'],accounts:['account'],tools:['a','q'],slots:1,cpu:4,gpu:1,budget:5});
  expect(derivePlannerUnitResources(['a','b'],{resourcesByFunction:{a,b}})).toEqual({profiles:['z','z'],models:['m'],accounts:['account'],tools:['a','q'],slots:2,cpu:4,gpu:1,budget:8});
  expect(derivePlannerUnitResources(['a','missing'],{resourcesByFunction:{a}})).toBeUndefined();
  expect(()=>derivePlannerUnitResources(['bad'],{resourcesByFunction:{bad:{...a,slots:0}}})).toThrow('invalid resource estimate');
});
const hash='1'.repeat(64),nodes=new Map([['a',{moduleSha256:hash,imageBase:'0x400000',ea:'0x10'}],['b',{moduleSha256:hash,imageBase:'0x400000',ea:'0x20'}]]),artifacts=new Map([[hash,{imageBase:'0x400000',versionLabel:'v'}]]);
test('subintents accept endpoint-only calls, A/B/R order and shared identity refs',()=>{
  const x=derivePlannerUnitSubIntents('u',['a','b'],false,new Map([['u',[{sourceId:'a',destinationId:'b'}]]]),nodes,artifacts),pa=p('u','a'),pb=p('u','b');
  expect(x.map(v=>[v.functionId,v.role,v.subIntentId,v.waitsForSubIntentIds])).toEqual([['a','A',pa+':A',[pb+':R']],['a','B',pa+':B',[pb+':R']],['a','R',pa+':R',[pa+':A',pa+':B']],['b','A',pb+':A',[]],['b','B',pb+':B',[]],['b','R',pb+':R',[pb+':A',pb+':B']]]);
  expect(x[0].harnessIdentity).toBe(x[1].harnessIdentity);expect(x[1].harnessIdentity).toBe(x[2].harnessIdentity);expect(x[0].harnessIdentity).not.toBe(x[3].harnessIdentity);
  expect(x[0].harnessIdentity).toEqual({sha256:hash,version:'v',ea:'0x10'});expect(x.every(v=>v.sharesFamilyLease&&v.outputDisjoint)).toBe(true);
});
test('recursive fixed order waits on prior function R instead of supplied cycle',()=>{
  const x=derivePlannerUnitSubIntents('u',['a','b'],true,new Map([['u',[{sourceId:'a',destinationId:'b'},{sourceId:'b',destinationId:'a'}]]]),nodes,artifacts);
  expect(x[0].waitsForSubIntentIds).toEqual([]);expect(x[3].waitsForSubIntentIds).toEqual([p('u','a')+':R']);
});
test('G3 numeric context order, deferred units included and multiplicity preserved',()=>{
  const units=[{unitId:'z',contextFunctionIds:['m:0x10','m:0x2','m:0x2']},{unitId:'a',contextFunctionIds:['m:0x10']}],before=JSON.stringify(units);
  expect(derivePlannerG3(units)).toEqual([{unitIds:['z','z'],reason:'shared context:m:0x2',blocking:false},{unitIds:['a','z'],reason:'shared context:m:0x10',blocking:false}]);expect(JSON.stringify(units)).toBe(before);
});
