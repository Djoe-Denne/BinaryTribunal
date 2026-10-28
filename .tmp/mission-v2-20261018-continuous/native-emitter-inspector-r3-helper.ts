// Parent synthetic helper only, copied with CRLF to distinguish native units.
export class ParameterDiagnosticError extends Error {
  constructor(public readonly diagnostic:{version:string;code:string;detail:string}){
    super("cluster: native-emitter-synthetic");this.name="ClusterDiagnosticError";
  }
}
export function raiseUnicode():never { const text="😀é"; throw new Error("cluster: "+text); }
export function raiseParameter():never { throw new ParameterDiagnosticError({version:"cluster-refusal-v1",code:"probe",detail:"synthetic"}); }

export function raiseMap():never { [1].map(()=>{throw new Error("cluster: synthetic map");});throw new Error("unreachable"); }
export function raiseForEach():never { [1].forEach(()=>{throw new Error("cluster: synthetic forEach");});throw new Error("unreachable"); }

// Parent SYNTHETIC homologue only; no scientific module is imported or executed.
const initialMap = Array.prototype.map, initialForEach = Array.prototype.forEach;
const initialMapDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, "map")!;
const initialForEachDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, "forEach")!;
const receiverProofs: unknown[] = [];
function rememberArrayLiteral(value: unknown[]): void {
  receiverProofs.push({arrayIsArray:Array.isArray(value),prototypeIsInitialArrayPrototype:Object.getPrototypeOf(value)===Array.prototype,
    ownMapAbsent:Object.getOwnPropertyDescriptor(value,"map")===undefined,ownForEachAbsent:Object.getOwnPropertyDescriptor(value,"forEach")===undefined,
    resolvedMapIsInitial:value.map===initialMap,resolvedForEachIsInitial:value.forEach===initialForEach});
}
export function intrinsicWitness(){
  const describe=(key:"map"|"forEach",initial:Function,descriptor:PropertyDescriptor)=>{
    const d=Object.getOwnPropertyDescriptor(Array.prototype,key)!;
    return {sameFunction:d.value===initial,sameFlags:d.writable===descriptor.writable&&d.enumerable===descriptor.enumerable&&d.configurable===descriptor.configurable,
      writable:d.writable,enumerable:d.enumerable,configurable:d.configurable,valueType:typeof d.value,accessorAbsent:d.get===undefined&&d.set===undefined};
  };
  return {map:describe("map",initialMap,initialMapDescriptor),forEach:describe("forEach",initialForEach,initialForEachDescriptor),receiverProofs:[...receiverProofs]};
}
class HomologousDiagnosticError extends Error {
  constructor(readonly diagnostic:{version:"cluster-refusal-v1";code:"unsupported-numeric";detail:string}){
    super(`cluster: ${diagnostic.code}: ${diagnostic.detail}; no partition produced`);this.name="ClusterDiagnosticError";
  }
}
function numericFailure(detail:string):never {throw new HomologousDiagnosticError({version:"cluster-refusal-v1",code:"unsupported-numeric",detail});}
export function raiseScaleDiagnostic():never {
  const source=[{source:0,target:1,weight:Number.MIN_VALUE},{source:1,target:0,weight:1e308}];rememberArrayLiteral(source);
  const scale=1e308;
  const arcs = source.map(a => {
    const weight = a.weight / scale;
    if (!weight) numericFailure("weight dynamic range loses a positive arc during scaling");
    return { ...a, weight };
  });
  throw new Error("unreachable scale homologue: "+arcs.length);
}
export function raisePprDiagnostic():never {
  const rows:Array<Array<[number,number]>>=[[[1,Number.MIN_VALUE],[0,1e308]]];
  for(let source=0;source<rows.length;source++){
    const row=rows[source]!;rememberArrayLiteral(row);
    const scale=1e308;
    const scaled = row.map(([target, w]) => {
      const value = w / scale; if (!value) numericFailure("PPR transition dynamic range loses a positive arc");
      return {target,value,bounds:{lo:value,hi:value}};
    });
    if(scaled.length===0)throw new Error("unreachable PPR empty");
  }
  throw new Error("unreachable PPR homologue");
}
