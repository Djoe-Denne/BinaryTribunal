// Parent runtime-load check only: exact whitelisted pure sources, never producers.
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
const config=JSON.parse(readFileSync(process.env.PARENT_PURE_LOAD_CONFIG!,"utf8")) as {root:string;allowed:string[];roots:string[];denied:string[];effect:string;observation:string};
const canonical=(p:string)=>resolve(p).replaceAll("\\","/").toLowerCase();
const allowed=new Set(config.allowed.map(canonical)),loaded:string[]=[],denials:string[]=[];
Bun.plugin({name:"parent-closed-pure-load",setup(build){
  build.onLoad({filter:/\.(ts|json)$/},args=>{
    const p=canonical(args.path);
    if(!allowed.has(p)){denials.push(p);throw new Error("PARENT_PURE_IMPORT_REJECT:"+p);}
    loaded.push(p);
    return {contents:readFileSync(args.path),loader:args.path.endsWith(".json")?"json":"ts"};
  });
}});
let negativeControls=0;
for(const p of config.denied){let refused=false;try{await import(pathToFileURL(p).href);}catch(error){refused=String(error).includes("PARENT_PURE_IMPORT_REJECT");}if(!refused)throw new Error("producer sentinel import was not rejected before evaluation");negativeControls++;}
if(existsSync(config.effect))throw new Error("forbidden producer executed");
const namespaces=[];
for(const p of config.roots){const before=new Set(loaded),ns=await import(pathToFileURL(p).href);if(!loaded.includes(canonical(p)))throw new Error("load guard did not observe pure root");namespaces.push({path:p,exports:Object.keys(ns).sort(),newLoads:loaded.filter(x=>!before.has(x))});}
if(loaded.some(p=>!allowed.has(p))||denials.length!==config.denied.length||existsSync(config.effect))throw new Error("unexpected runtime import or sentinel execution");
const compare=await import(pathToFileURL(config.roots.find(p=>p.endsWith("function-order.ts"))!).href);
const hash="a".repeat(64);if(!(compare.compareFunctionId(hash+":0x2",hash+":0x10")<0))throw new Error("pure comparator not usable");
writeFileSync(config.observation,JSON.stringify({negativeControls,producerSentinelsNotEvaluated:true,loaded,denials,namespaces,roots:config.roots.length,onlyWhitelistRuntimeLoaded:true})+"\n",{flag:"wx"});
console.log("PURE_LOAD_PASS roots="+config.roots.length+" negative="+negativeControls);
