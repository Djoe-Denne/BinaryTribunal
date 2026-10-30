// One-shot OFFLINE observation preloader for the owned projection candidate.
// No arguments/results, timers, files, authority, return values or promises altered.
// A returned marker means synchronous function return, not async completion.
import { GraphStore } from 'file:///C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-projection-contexte/tools/ff8-harness/src/graph-store.ts';
const methods=[
  'putSnapshot','putPartition','freezePlan','reserve','freezeAdmissionInputs',
  'prepareAdmission','dispatch','retainResult','recordParentAttestation',
  'recordPublicationMaterialization','validateUnit','preparePublication',
  'observePublication','commitReadback','recordArtifactBinding',
  'approveNextContextArtifact','freezeNextContextProjection',
  'recordNextContextMaterialized','nextContextPolicy','assertNextContextCurrent'
];
const counts=new Map();
let lines=0;
function emit(method,phase,count){
  if(lines>=128)return;
  // First call and powers of two bound logging even for unexpectedly hot methods.
  if(count!==1&&(count&(count-1))!==0)return;
  lines++;
  process.stderr.write(JSON.stringify({probe:'rms-offline-phase-v1',method,phase,count})+'\n');
}
for(const method of methods){
  const descriptor=Object.getOwnPropertyDescriptor(GraphStore.prototype,method);
  if(!descriptor||typeof descriptor.value!=='function')continue;
  const original=descriptor.value;
  Object.defineProperty(GraphStore.prototype,method,{...descriptor,value:function(...args){
    const count=(counts.get(method)??0)+1;counts.set(method,count);
    emit(method,'enter',count);
    try{
      const result=Reflect.apply(original,this,args);
      emit(method,'synchronous-return',count);
      return result;
    }catch(error){emit(method,'synchronous-throw',count);throw error;}
  }});
}
process.stderr.write(JSON.stringify({probe:'rms-offline-phase-v1',phase:'installed',methods:methods.length,logLimit:128,scope:'diagnostic only; no acceptance evidence'})+'\n');
