import { test, afterAll } from "bun:test";
import { writeFileSync } from "node:fs";
import { traceCall, finalizeCapture } from "./capture";
const mode=process.env.PARENT_PROTO_MODE!;
test("parent explicit prototype fixture",()=>{
  let calls=0,touches=0;
  const call=(value:unknown,action:()=>unknown=()=>value)=>{let result:unknown;result=traceCall("planMission",[value],()=>{calls++;return action();});return result;};
  const p:Record<string,unknown>={inherited:"value"},x=Object.create(p) as Record<string,unknown>;
  let value:unknown=x,action:()=>unknown=()=>value;
  if(mode==='nine-corpus-tables'){
    for(const id of ['constructor','toString','hasOwnProperty'])for(const table of ['edgeKinds','dispensationsByEdge','externalReceiptsByEdge']){
      const proto={[id]:'inherited-invalid-declaration','edge:unknown':'ignored-inherited-key'},receiver=Object.create(proto),policy={[table]:receiver};
      if(call(policy)!==policy)throw new Error('parent identity lost');
    }
  }else{
    switch(mode){
      case 'terminal-object':break;
      case 'terminal-null':Object.setPrototypeOf(p,null);break;
      case 'shared':value=[x,Object.create(p)];break;
      case 'distinct':value=[x,Object.create({inherited:'value'})];break;
      case 'prototype-root-alias':value=[x,p];break;
      case 'cycle':p.back=x;p.self=p;break;
      case 'shadow':x.inherited='own';break;
      case 'mutate-value':action=()=>{p.inherited='changed';return value;};break;
      case 'mutate-flags':action=()=>{Object.defineProperty(p,'inherited',{value:'value',enumerable:false,writable:false,configurable:false});return value;};break;
      case 'mutate-order':p.second='two';action=()=>{delete p.inherited;p.inherited='value';return value;};break;
      case 'mutate-extensible':action=()=>{Object.preventExtensions(p);return value;};break;
      case 'mutate-terminal':action=()=>{Object.setPrototypeOf(p,null);return value;};break;
      case 'prototype-proxy':value=Object.create(new Proxy(p,{getPrototypeOf(){touches++;return Object.prototype;},ownKeys(){touches++;return [];}}));break;
      case 'prototype-accessor':Object.defineProperty(p,'bad',{get(){touches++;return 1;}});break;
      case 'prototype-function':p.toJSON=()=>{touches++;return {};};break;
      case 'prototype-symbol':Object.defineProperty(p,Symbol('bad'),{value:1});break;
      case 'class-constructor':class C{};value=new C();break;
      case 'depth-two':value=Object.create(Object.create(p));break;
      case 'forged-builtin':value=Object.create(Map.prototype);break;
      case 'prototype-spoofed-map':value=Object.create(Object.setPrototypeOf(new Map([['k',1]]),Object.prototype));break;
      case 'prototype-spoofed-promise':value=Object.create(Object.setPrototypeOf(Promise.resolve(1),null));break;
      case 'array-custom':value=Object.setPrototypeOf([],p);break;
      case 'map-custom':value=Object.setPrototypeOf(new Map(),p);break;
      case 'set-custom':value=Object.setPrototypeOf(new Set(),p);break;
      case 'error-custom':value=Object.setPrototypeOf(new Error('bad'),p);break;
      case 'error-reachable':{const e=new Error('hidden');Object.defineProperty(e,'stack',{get(){touches++;return 'must not read';},configurable:true});p.error=e;break;}
      default:throw new Error('unknown parent fixture');
    }
    if(call(value,action)!==value)throw new Error('parent identity lost');
  }
  if(touches!==0)throw new Error('inspection invoked a getter/trap/hook');
  writeFileSync(process.env.PARENT_PROTO_OBSERVATION!,JSON.stringify({mode,calls,touches})+'\n',{flag:'wx'});
});
afterAll(()=>{if(!finalizeCapture())throw new Error('PARENT_PROTO_EXPECTED_FATAL');});
