// Parent synthetic Bun tests. Only the exact candidate capture is imported.
import { test, afterAll, mock } from "bun:test";
import * as fs from "node:fs";
import { createHash } from "node:crypto";
const realAppend=fs.appendFileSync,realWrite=fs.writeFileSync,realRead=fs.readFileSync;
let failAppend=false,failedWrites=0;
mock.module("node:fs",()=>({...fs,appendFileSync:(...args: Parameters<typeof fs.appendFileSync>)=>{
  if(failAppend){failedWrites++;throw new Error("PARENT_INJECTED_APPEND_FAILURE");}
  return realAppend(...args);
}}));
const {traceCall,finalizeCapture}=await import("./capture");
const mode=process.env.PARENT_CAPTURE_MODE!,trace=process.env.FF8_PARENT_DIFF_TRACE!,footer=process.env.FF8_PARENT_DIFF_META!;
const digest=(p:string)=>createHash("sha256").update(realRead(p)).digest("hex");
let manuallySealed=false;
test("parent exact capture fixture",()=>{
  let calls=0,identity=true,cleanBefore:unknown=null,cleanAfter:unknown=null;
  const beforeCall=(value:unknown)=>traceCall("planMission",[value],()=>{calls++;return value;});
  for(let i=0;i<11;i++)beforeCall({i});
  const original=new Error("product refusal",{cause:{source:"fixture"}});
  try{traceCall("compareGranularities",[],()=>{calls++;throw original;});identity=false;}catch(e){identity=e===original;}
  if(mode.startsWith("postseal")){
    if(!finalizeCapture())throw new Error("fixture failed clean initial seal");
    manuallySealed=true;cleanBefore={trace:digest(trace),footer:digest(footer)};failAppend=true;
    if(mode==="postseal-throw"){
      try{traceCall("planMission",[],()=>{calls++;throw original;});identity=false;}catch(e){identity=identity&&e===original;}
    }else{const value={sentinel:42};identity=identity&&traceCall("planMission",[],()=>{calls++;return value;})===value;}
    process.exitCode=0;cleanAfter={trace:digest(trace),footer:digest(footer)};
  }else if(mode==="custom-data-prototype"){
    const inherited=Object.create({constructor:"inherited-invalid-declaration","edge:unknown":"ignored-inherited-key"});
    identity=identity&&beforeCall(inherited)===inherited;
  }else if(mode==="unsupported-accessor"){
    let touched=0;const value=Object.defineProperty({},"x",{get(){touched++;return 1;}});
    identity=identity&&beforeCall(value)===value&&touched===0;
  }
  realWrite(process.env.PARENT_OBSERVATION!,JSON.stringify({mode,calls,identity,failedWrites,cleanBefore,cleanAfter,exitCodeReset:process.exitCode===0})+"\n",{flag:"wx"});
  if(!identity)throw new Error("fixture identity failed");
});
afterAll(()=>{if(!manuallySealed&&!finalizeCapture())throw new Error("PARENT_EXPECTED_CAPTURE_REFUSAL");});
