// Parent synthetic emitter capability probe; no science/candidate imports.
import {test} from "bun:test";
import {existsSync,writeFileSync} from "node:fs";
import {raiseUnicode,raiseParameter,raiseMap,raiseForEach,raiseScaleDiagnostic,raisePprDiagnostic,intrinsicWitness} from "./helper";
test("native emitter synthetic readonly CRLF Unicode imported helper",async()=>{
  const observations=[];
  for(const [label,action]of [["unicode",raiseUnicode],["parameter",raiseParameter],["array-map",raiseMap],["array-forEach",raiseForEach],["scale-diagnostic",raiseScaleDiagnostic],["ppr-diagnostic",raisePprDiagnostic]]as const){
    const intrinsicBefore=intrinsicWitness();try{action();throw new Error("unreachable");}catch(error){
      if(!(error instanceof Error))throw error;
      const own=()=>Reflect.ownKeys(error).map(key=>({key:String(key),descriptor:Object.getOwnPropertyDescriptor(error,key)}));
      const before=own(),stack=error.stack,after=own();observations.push({label,before,stack,after,intrinsicBefore,intrinsicAfter:intrinsicWitness()});
    }
  }
  writeFileSync(process.env.PARENT_EMITTER_OBSERVATION!,JSON.stringify({observations},null,2)+"\n",{flag:"wx"});
  const start=Date.now();while(!existsSync(process.env.PARENT_EMITTER_RELEASE!)){
    if(Date.now()-start>15000)throw new Error("parent did not release emitter probe");
    await new Promise<void>(resolve=>setTimeout(resolve,20));
  }
});
