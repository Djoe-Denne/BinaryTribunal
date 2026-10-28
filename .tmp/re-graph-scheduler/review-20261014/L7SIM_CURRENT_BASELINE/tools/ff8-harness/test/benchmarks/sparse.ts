/** Bounded sparse test-data construction. No SCC algorithm and no all-pairs
 * similarity/conflict construction: exact components are known by construction.
 * DAG inter-component calls are strictly monotonic; ring components are contiguous.
 */
import { hash, fingerprint } from "../../src/validation";
import type { SimScenario, SimUnitInput, SimDurations, SimG1EdgeInput } from "../../src/simulator";

export interface SparseOptions { nodes: number; degree: number; seed: number; sccCount: number; sccSize: number; selfLoops?: number; familySize?: number; specialistRatio?: number; maxDuration?: number; workers?: number; conflicts?: "none" | "shared" | "chain" }
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
export function sparseScenario(options: SparseOptions): { scenario: SimScenario; stats: Record<string, unknown>; constructionSteps: number; inputHash: string } {
  const { nodes, degree, seed, sccCount, sccSize, selfLoops = 0, familySize = 1, specialistRatio = 0.1, maxDuration = 5, workers = 8, conflicts = "none" } = options;
  if (![nodes,degree,sccCount,sccSize,selfLoops,familySize,workers,maxDuration].every(Number.isSafeInteger) || nodes < 0 || degree < 0 || sccSize < 2 || familySize < 1 || sccCount * sccSize + selfLoops > nodes || workers < 2 || maxDuration < 1) throw new Error("invalid sparse configuration");
  const rng = seeded(seed), module = hash("synthetic-module-L7"), ids = Array.from({ length: nodes }, (_, i) => `${module}:0x${(i+1).toString(16).toUpperCase()}`);
  const groups: number[][] = [], exclusive = new Set<number>(), nodeToUnit: number[] = [], raw: Array<[number,number]> = [], relation = new Set<string>();
  let steps = nodes;
  const add = (a:number,b:number) => { steps++; const key = `${a}:${b}`; if (!relation.has(key)) { relation.add(key); raw.push([a,b]); } };
  let cursor = 0;
  for (let i=0;i<sccCount;i++) { const members = Array.from({length:sccSize},(_,j)=>cursor+j); exclusive.add(groups.length); groups.push(members); for(let j=0;j<sccSize;j++)add(members[j]!,members[(j+1)%sccSize]!); cursor+=sccSize; }
  for(let i=0;i<selfLoops;i++){ exclusive.add(groups.length); groups.push([cursor]); add(cursor,cursor); cursor++; }
  while(cursor<nodes){const n=Math.min(familySize,nodes-cursor);groups.push(Array.from({length:n},(_,j)=>cursor+j));cursor+=n;}
  groups.forEach((members,i)=>members.forEach(node=>nodeToUnit[node]=i));
  // At most degree outgoing attempts per function, no retry-until-dense loop.
  for(let from=0;from<nodes;from++) for(let k=0;k<degree;k++) {
    steps++; const next = nodeToUnit[from]! + 1, available = groups.length-next; if(available<=0)break;
    const group = next + Math.floor(rng()*Math.min(available,32)); const members=groups[group]!; add(from,members[Math.floor(rng()*members.length)]!);
  }
  const units: SimUnitInput[] = groups.map((members,i)=>({unitId:`u:${String(i).padStart(8,"0")}`,ownedFunctionIds:members.map(n=>ids[n]!),contextFunctionIds:[],investigationKind:"decompilation",requiredProfile:rng()<specialistRatio?"specialist":undefined,requiredPublicationLevel:1,knowledgeRevision:1,prerequisites:[],conflicts:[],sccExclusive:exclusive.has(i)}));
  const g1Edges:SimG1EdgeInput[]=[], seen=new Set<string>();
  for(const [from,to]of raw){steps++; const consumer=nodeToUnit[from]!,producer=nodeToUnit[to]!;if(consumer===producer)continue;const key=`${producer}:${consumer}`;if(seen.has(key))continue;seen.add(key);
    units[consumer]!.prerequisites.push({producerUnitId:units[producer]!.unitId,kind:"obligatory",requiredPublicationLevel:1,dispensed:false});
    g1Edges.push({fromUnitId:units[producer]!.unitId,toUnitId:units[consumer]!.unitId,kind:"obligatory",callSourceFunctionId:ids[from]!,callDestinationFunctionId:ids[to]!});
  }
  const durations=new Map<string,SimDurations>();
  for(let i=0;i<units.length;i++){steps++;const u=units[i]!,a=1+Math.floor(rng()*maxDuration),b=1+Math.floor(rng()*maxDuration);durations.set(u.unitId,{A:a,B:b,R:1+Math.floor(rng()*3)});
    if(conflicts==="shared")u.conflicts.push({resourceKey:"fixture:shared"});
    if(conflicts==="chain"){if(i>0)u.conflicts.push({resourceKey:`pair:${i-1}:${i}`});if(i+1<units.length)u.conflicts.push({resourceKey:`pair:${i}:${i+1}`});}
  }
  const out=Array(nodes).fill(0) as number[],incoming=Array(nodes).fill(0) as number[];for(const[a,b]of raw){out[a]++;incoming[b]++;}
  const distribution=(values:number[])=>{const histogram:Record<string,number>={};let sum=0,min=Infinity,max=0;for(const n of values){histogram[n]=(histogram[n]??0)+1;sum+=n;min=Math.min(min,n);max=Math.max(max,n);}return{min:values.length?min:0,max,mean:values.length?sum/values.length:0,histogram};};
  const scenario:SimScenario={plan:{planId:`plan:sparse:${seed}:${nodes}`,missionId:"mission:fixture",knowledgeRevision:1,units,g1Edges,g2Conflicts:[],budgets:{contextEnvelopeMaxUtf8Bytes:100_000_000,nativeLineCharLimit:2000}},config:{controllerId:"sim:fixture",workers:Array.from({length:workers},(_,i)=>({profile:i%4===0?"specialist":"build",accountId:i%2?"acct:B":"acct:A",speed:i%3===0?2:1})),accountQuotas:{"acct:A":Math.ceil(workers/2),"acct:B":Math.ceil(workers/2)},leaseTicks:64,heartbeatEvery:8,validationTicks:1,maxAttempts:3,maxTicks:10_000_000,policy:"event_driven",recordTrace:false,groupSize:8},durations,incidents:[],seed:String(seed)};
  const matureCount=Math.floor(nodes*0.4);
  return{scenario,constructionSteps:steps,inputHash:fingerprint({plan:scenario.plan,durations:[...durations],incidents:scenario.incidents,config:scenario.config}),stats:{N:nodes,E:raw.length,density:nodes>1?raw.length/(nodes*(nodes-1)):0,inDegree:distribution(incoming),outDegree:distribution(out),sccCount:nodes-sccCount*(sccSize-1),sccNontrivial:sccCount+selfLoops,sccRingSizes:Array(sccCount).fill(sccSize),selfLoops,sccSingletons:nodes-sccCount*sccSize,semanticMaturity:{none:nodes-matureCount,partial:matureCount,semantifiedRatio:nodes?matureCount/nodes:0},unitCount:units.length,quotientE:g1Edges.length,conflictIncidences:units.reduce((n,u)=>n+u.conflicts.length,0),construction:"monotone-component sparse calls + exact rings; O(N*degree+E), no pairwise similarity",options}};
}
