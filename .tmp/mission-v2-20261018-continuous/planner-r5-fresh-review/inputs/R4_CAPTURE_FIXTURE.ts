// Parent fixtures only. The reviewed capture is copied beside this file.
import { writeFileSync } from "node:fs";
import { traceCall } from "./capture";
const mode = process.argv[2]!;
function check(value: unknown): asserts value { if (!value) throw new Error("parent fixture assertion"); }
let calls = 0;
try {
  if (mode === "basic") {
    for (let i=0;i<11;i++) {
      const input={i},result=traceCall(i===10?"compareGranularities":"planMission",[input],()=>{calls++;return {input};});
      check(result.input===input);
    }
    const cause={label:"source-data"},error=new Error("fixture refusal",{cause});
    try { traceCall("planMission",[],()=>{calls++;throw error;});check(false); }
    catch(actual){check(actual===error);}
    check(calls===12);
  } else if (mode === "footer-existing") {
    writeFileSync(process.env.FF8_PARENT_DIFF_META!,"{}\n",{flag:"wx"});
    check(traceCall("planMission",[],()=>{calls++;return 42;})===42);
  } else if (mode === "footer-directory" || mode === "trace-write-failure") {
    check(traceCall("planMission",[],()=>{calls++;return 42;})===42);
  } else if (mode === "error-cause-a" || mode === "error-cause-b") {
    const cause={value:mode.endsWith("a")?"A":"B"};Object.assign(cause,{self:cause});
    const error=new Error("same message",{cause});
    try {traceCall("planMission",[],()=>{calls++;throw error;});check(false);}catch(actual){check(actual===error);}
  } else {
    let value: unknown, touches=0;
    switch(mode) {
      case "equal-a": case "equal-b": value={x:1,nested:[undefined,null,-0],map:new Map([["x",1]]),set:new Set(["x"])};break;
      case "holes": value=new Array(1);break;
      case "null-array": value=[null];break;
      case "undefined": value=undefined;break;
      case "null": value=null;break;
      case "negative-zero": value=-0;break;
      case "positive-zero": value=0;break;
      case "nan": value=NaN;break;
      case "positive-infinity": value=Infinity;break;
      case "negative-infinity": value=-Infinity;break;
      case "alias": {const x={n:1};value={a:x,b:x};break;}
      case "clones": value={a:{n:1},b:{n:1}};break;
      case "cycle": {const x:Record<string,unknown>={n:1};x.self=x;value=x;break;}
      case "null-object": value=Object.assign(Object.create(null),{safe:1});break;
      case "map-set": value={map:new Map([["k",new Set([1,2])]]),set:new Set(["x"])};break;
      case "promise-null-proto": value=Object.setPrototypeOf(Promise.resolve(1),null);break;
      case "map-object-proto": value=Object.setPrototypeOf(new Map([["k",1]]),Object.prototype);break;
      case "set-object-proto": value=Object.setPrototypeOf(new Set([1]),Object.prototype);break;
      case "array-null-proto": value=Object.setPrototypeOf([1],null);break;
      case "error-object-proto": value=Object.setPrototypeOf(new Error("x"),Object.prototype);break;
      case "date-object-proto": value=Object.setPrototypeOf(new Date(0),Object.prototype);break;
      case "regexp-null-proto": value=Object.setPrototypeOf(/x/,null);break;
      case "buffer-null-proto": value=Object.setPrototypeOf(new ArrayBuffer(8),null);break;
      case "boxed-number-object-proto": value=Object.setPrototypeOf(new Number(1),Object.prototype);break;
      case "forged-map-proto": value=Object.create(Map.prototype);break;
      case "url-object-proto": value=Object.setPrototypeOf(new URL("https://fixture.invalid/local"),Object.prototype);break;
      case "function": value=function fixtureFunction(){};break;
      case "symbol": value=Symbol("fixture");break;
      case "accessor": value=Object.defineProperty({},"x",{get(){touches++;return 1;},enumerable:true});break;
      case "proxy": value=new Proxy({},{ownKeys(){touches++;return [];}});break;
      case "ordinary-error": value={problem:new Error("unsupported ordinary reachability")};break;
      default: throw new Error("unknown parent fixture");
    }
    const result=traceCall("planMission",[value],()=>{calls++;return value;});
    check(Object.is(result,value) && calls===1 && touches===0);
  }
  console.log(JSON.stringify({ok:true,mode,calls}));
} catch { console.log(JSON.stringify({ok:false,mode,calls}));process.exitCode=89; }
