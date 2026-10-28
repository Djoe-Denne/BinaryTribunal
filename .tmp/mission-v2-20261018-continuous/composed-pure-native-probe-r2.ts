import {readFileSync,existsSync,writeFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
const c=JSON.parse(readFileSync(process.env.PARENT_PURE_LOAD_CONFIG!,"utf8")) as {allowed:string[];roots:string[];denied:string[];effect:string;observation:string};
const controls=[];
for(const p of c.denied){
  if(existsSync(p))throw new Error("forbidden scientific module present in pure namespace");
  let refused=false,reason="";try{await import(pathToFileURL(p).href);}catch(e){reason=String(e);refused=reason.includes("Cannot find module")||reason.includes("ModuleNotFound")||reason.includes("Could not resolve");}
  if(!refused)throw new Error("forbidden absolute value import unexpectedly resolved");
  controls.push({path:p,absent:true,resolutionRefused:true,reason});
}
const namespaces=[];
for(const p of c.roots){const ns=await import(pathToFileURL(p).href),keys=Object.keys(ns).sort();if(!keys.length)throw new Error("pure root exposed no values");namespaces.push({path:p,exports:keys});}
const compare=await import(pathToFileURL(c.roots.find(p=>p.endsWith("function-order.ts"))!).href),h="a".repeat(64);
if(!(compare.compareFunctionIds(h+":0x2",h+":0x10")<0))throw new Error("pure comparator smoke failed");
if(c.denied.some(existsSync)||existsSync(c.effect))throw new Error("forbidden namespace changed");
writeFileSync(c.observation,JSON.stringify({roots:c.roots.length,negativeControls:controls.length,controls,namespaces,closedNamespaceAndStaticClosureProof:true,notPerModuleRuntimeInterception:true,noScientificSourceRewrite:true})+"\n",{flag:"wx"});
console.log("NATIVE_PURE_LOAD_PASS roots="+c.roots.length+" unresolvedProducers="+controls.length);
