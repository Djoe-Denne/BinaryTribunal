import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { canonical } from "./validation";
import type { InvariantAdapter, InvariantCase } from "./pre-review";
const sha = (x: string | Uint8Array) => createHash("sha256").update(x).digest("hex");
type Obj = Record<string,unknown>;
function object(value:unknown):Obj {if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Expected strict graph object");return value as Obj;}
function list(value:unknown):unknown[]{if(!Array.isArray(value))throw new Error("Expected graph array");return value;}
function fn(module:Obj,name:string):(...args:unknown[])=>unknown {const f=module[name];if(typeof f!=="function")throw new Error(`Required L2 export absent: ${name}`);return f as (...args:unknown[])=>unknown;}

/** Profile consumes an explicitly selected local module; no graph-code backport. */
export async function loadL2PreReview(moduleRoot:string) {
  const pins=[];
  for(const path of ["src/graph.ts","src/graph-normalize.ts","src/capabilities.ts","src/validation.ts","schemas/graph-snapshot-v1.schema.json"]) pins.push({path,sha256:sha(await readFile(join(moduleRoot,path)))});
  const graph=await import(pathToFileURL(join(moduleRoot,"src/graph.ts")).href) as Obj;
  const normal=await import(pathToFileURL(join(moduleRoot,"src/graph-normalize.ts")).href) as Obj;
  const capabilities=await import(pathToFileURL(join(moduleRoot,"src/capabilities.ts")).href) as Obj;
  const validate=fn(graph,"validateGraphSnapshot"),fingerprint=fn(graph,"fingerprintWithout"),withFacts=fn(normal,"withCapabilities"),generate=fn(capabilities,"evaluateCapabilities"),cached=fn(capabilities,"evaluateCapabilitiesCached");
  const constructor=capabilities.CapabilityCache;if(typeof constructor!=="function")throw new Error("Required CapabilityCache export absent");
  const fixturePath=join(moduleRoot,"test/fixtures/graph/ff8-imports-thunks/content.json"),fixtureBytes=await readFile(fixturePath),base=object(JSON.parse(fixtureBytes.toString("utf8")));
  pins.push({path:"test/fixtures/graph/ff8-imports-thunks/content.json",sha256:sha(fixtureBytes)});
  const fixtureErrors=validate(base) as string[];if(fixtureErrors.length)throw new Error(`Pinned input fixture invalid: ${fixtureErrors.join("; ")}`);
  const cases:InvariantCase[]=[];
  const make=(length:number,char:string,kind:"import"|"table")=>{
    const input=object(structuredClone(base)),objects=list(input.objects);if(!objects.length)throw new Error("Import fixture has no object");
    const o=object(objects[0]),old=o.id; o.id=char.repeat(length);o.kind=kind;o.name=kind==="import"?"DDRAW.dll!DirectDrawCreate":"g_PrimDispatch";
    const p=object(o.provenance);p.siteKind=kind;
    if(kind==="table"){input.unresolved=[];o.rva="0x8000";p.siteRva="0x8000";p.xrefType="data";}
    else for(const item of list(input.unresolved)){const u=object(item);if(u.referencedObjectId===old)u.referencedObjectId=o.id;}
    input.capabilities=[];input.normalizedFingerprint=fingerprint(input,"normalizedFingerprint");return input;
  };
  for(const kind of ["import","table"] as const)for(const char of ["x","é","😀"])for(const length of [1,64,125,126,128,129,159,160]) cases.push({id:`${kind}-${char.codePointAt(0)}-${length}`,input:make(length,char,kind),...(length===1?{rejectInput:true}:{})});
  const duplicate=make(64,"x","import");list(duplicate.objects).push(structuredClone(list(duplicate.objects)[0]));duplicate.normalizedFingerprint=fingerprint(duplicate,"normalizedFingerprint");cases.push({id:"reject-duplicate-object",input:duplicate,rejectInput:true});
  const dangling=make(64,"x","import");object(list(dangling.unresolved)[0]).referencedObjectId="missing";dangling.normalizedFingerprint=fingerprint(dangling,"normalizedFingerprint");cases.push({id:"reject-dangling-object",input:dangling,rejectInput:true});
  // An adversarial *natural namespace* collision, not a probabilistic SHA test.
  const long=make(160,"x","import");
  try {
    const regional=list(generate(long)).map(object).find(f=>f.subjectKind==="region");
    if(regional&&typeof regional.subjectId==="string"&&[...regional.subjectId].length<=128&&regional.subjectId!=="x".repeat(160)) {
      const collision=object(structuredClone(long)),short=object(structuredClone(list(collision.objects)[0]));short.id=regional.subjectId;short.name="g_PrimDispatch";short.kind="table";short.rva="0x8000";Object.assign(object(short.provenance),{siteKind:"table",siteRva:"0x8000",xrefType:"data"});
      list(collision.objects).push(short);list(collision.objects).sort((a,b)=>String(object(a).id)<String(object(b).id)?-1:1);collision.normalizedFingerprint=fingerprint(collision,"normalizedFingerprint");cases.push({id:"reserved-natural-alias-collision",input:collision});
      const reordered=object(structuredClone(collision));list(reordered.objects).reverse();reordered.normalizedFingerprint=fingerprint(reordered,"normalizedFingerprint");cases.push({id:"reserved-collision-reordered",input:reordered,equivalentTo:"reserved-natural-alias-collision"});
    }
  } catch { /* The regular long-ID cases report generator failure independently. */ }
  const adapter:InvariantAdapter={profile:"l2-capabilities-v1",cases,validateInput:input=>validate(input) as string[],generate,
    validateOutput:(input,value)=>{
      const errors:string[]=[];try{const candidate=withFacts(input,value);errors.push(...validate(candidate) as string[]);}catch(e){errors.push(String(e));}
      const source=list(object(input).objects).map(object),facts=Array.isArray(value)?value.map(object):[];
      const originalIds=new Set(source.map(o=>o.id)),aliases=new Set<string>();
      for(const original of source){
        const fact=facts.find(f=>f.subjectKind==="region"&&(f.subjectId===original.id||list(f.evidence).some(e=>String(object(e).detail).includes(String(original.id)))));
        if(!fact){errors.push("Regional object fact/citation absent");continue;}
        const id=String(fact.subjectId),longId=[...String(original.id)].length>128;
        if(!longId&&id!==original.id)errors.push("Short original ID changed");
        if(longId&&(originalIds.has(id)||[...id].length>128))errors.push("Long alias is unbounded or steals a reserved original ID");
        if(aliases.has(id))errors.push("Distinct source regions share an alias");aliases.add(id);
        if(!list(fact.evidence).some(e=>object(e).sha256===sha(canonical(original))))errors.push("Evidence hash does not bind exact source object");
        if(longId&&!list(fact.evidence).some(e=>String(object(e).detail).includes(String(original.id))))errors.push("Long original ID citation lost");
      }
      return errors;
    },
    createCache:()=>{const cache=object(Reflect.construct(constructor,[]));return {evaluate:input=>cached(input,cache),invalidate:()=>{fn(cache,"invalidate").call(cache);},stats:()=>fn(cache,"stats").call(cache) as {size:number;hits:number;misses:number}};},
    perturb:value=>{const a=list(value);if(a.length){const f=object(a[0]);const evidence=list(f.evidence);if(evidence.length)object(evidence[0]).detail="caller changed clone";}}
  };
  return {adapter,pins,moduleFingerprint:sha(canonical(pins))};
}
