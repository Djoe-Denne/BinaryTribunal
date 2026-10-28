import { expect,test } from "bun:test";
import { runPreReview,type InvariantAdapter } from "../src/pre-review";
function adapter(bad?:"raw"|"miss"|"clone"|"mutate-input"):InvariantAdapter {
  return {profile:"fixture",cases:[{id:"one",input:{id:"one"}},{id:"invalid",input:{id:null},rejectInput:true}],
    validateInput:value=>typeof (value as {id?:unknown}).id==="string"?[]:["id invalid"],
    generate(value){if(this.validateInput(value).length)throw new Error("invalid");if(bad==="mutate-input")(value as {id:string}).id="mutated";return [{id:bad==="raw"?null:"one"}];},
    validateOutput:(_input,output)=>Array.isArray(output)&&typeof output[0]?.id==="string"?[]:["invalid output"],
    createCache(){let entry:unknown,misses=0,hits=0;return {evaluate:(input)=>{if(typeof (input as {id?:unknown}).id!=="string")throw new Error("invalid");if(entry){hits++;return bad==="clone"?entry:structuredClone(entry);}misses++;entry=[{id:bad==="miss"?null:"one"}];return bad==="clone"?entry:structuredClone(entry);},invalidate(){entry=undefined;},stats:()=>({size:entry?1:0,hits,misses})};},
    perturb(value){(value as Array<{id:string}>)[0]!.id="caller mutation";}
  };
}
test("finite good matrix passes but never claims parent/native/fresh-review acceptance",()=>{
  expect(runPreReview(adapter())).toMatchObject({verdict:"PASS",parentAcceptance:false,nativeValidation:false,freshReviewStillRequired:true});
});
test.each(["raw","miss","clone","mutate-input"] as const)("pre-review detects %s defect before independent review",bad=>{const r=runPreReview(adapter(bad));expect(r.verdict).toBe("FAIL");expect(r.failures.length).toBeGreaterThan(0);});
test("empty/duplicate matrices cannot certify a module",()=>{const a=adapter();a.cases=[];expect(()=>runPreReview(a)).toThrow();a.cases=[{id:"same",input:{}},{id:"same",input:{}}];expect(()=>runPreReview(a)).toThrow();});
