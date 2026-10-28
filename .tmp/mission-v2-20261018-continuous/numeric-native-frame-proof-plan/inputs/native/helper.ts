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
