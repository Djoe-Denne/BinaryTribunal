import { canonical } from "./validation";
export interface InvariantCase { id: string; input: unknown; rejectInput?: boolean; equivalentTo?: string }
export interface InvariantCache { evaluate(input: unknown): unknown; invalidate(): void; stats(): { size: number; hits: number; misses: number } }
export interface InvariantAdapter {
  profile: string; cases: InvariantCase[]; validateInput(input: unknown): string[]; generate(input: unknown): unknown;
  validateOutput(input: unknown, output: unknown): string[]; createCache(): InvariantCache; perturb(output: unknown): void;
}
export interface InvariantFailure { caseId: string; stage: string; detail: string }

/** Finite, deterministic pre-review gate. It never accepts a scientific module. */
export function runPreReview(adapter: InvariantAdapter) {
  if (!adapter.cases.length || adapter.cases.length > 512 || new Set(adapter.cases.map(c => c.id)).size !== adapter.cases.length) throw new Error("Bounded unique invariant cases required");
  const failures: InvariantFailure[] = []; let assertions = 0;
  const rawByCase = new Map<string,string>();
  const check = (c: InvariantCase, stage: string, condition: boolean, detail: string) => { assertions++; if (!condition) failures.push({caseId:c.id,stage,detail}); };
  for (const c of adapter.cases) {
    const original = canonical(c.input), cache = adapter.createCache();
    const inputErrors = adapter.validateInput(c.input);
    check(c,"input",c.rejectInput ? inputErrors.length > 0 : inputErrors.length === 0,inputErrors.join("; ") || "Expected invalid fixture was accepted");
    if (!c.rejectInput && inputErrors.length) continue;
    if (c.rejectInput) {
      for (const [stage,fn] of [["raw",()=>adapter.generate(c.input)],["miss",()=>cache.evaluate(c.input)]] as const) {
        let rejected=false;try{fn();}catch{rejected=true;}check(c,stage,rejected,"Invalid input returned generator/cache output");
      }
      check(c,"invalid-cache",cache.stats().size===0,"Invalid input polluted cache");
      check(c,"immutable-input",canonical(c.input)===original,"Rejected input was mutated");continue;
    }
    const outputs = new Map<string,unknown>();
    for (const [stage,fn] of [["raw",()=>adapter.generate(c.input)],["miss",()=>cache.evaluate(c.input)],["hit",()=>cache.evaluate(c.input)]] as const) {
      try {const value=fn();outputs.set(stage,value);const errors=adapter.validateOutput(c.input,value);check(c,stage,errors.length===0,errors.join("; "));}
      catch(error){check(c,stage,false,String(error));}
    }
    if (["raw","miss","hit"].every(s=>outputs.has(s))) check(c,"raw-miss-hit",canonical(outputs.get("raw"))===canonical(outputs.get("miss"))&&canonical(outputs.get("raw"))===canonical(outputs.get("hit")),"Raw/cache miss/cache hit differ");
    if(outputs.has("raw")) {
      const raw=canonical(outputs.get("raw"));rawByCase.set(c.id,raw);
      if(c.equivalentTo)check(c,"permutation-invariance",rawByCase.get(c.equivalentTo)===raw,"Equivalent input ordering changed generated identities/facts");
    }
    const stats=cache.stats();check(c,"cache-stats",stats.misses===1&&stats.hits===1,"Cold miss/hit counters are inconsistent");
    if(outputs.has("hit")) {
      try {adapter.perturb(outputs.get("hit"));check(c,"clone-isolation",canonical(cache.evaluate(c.input))===canonical(outputs.get("raw")),"Caller mutation changed cached result");}
      catch(error){check(c,"clone-isolation",false,String(error));}
    }
    cache.invalidate();check(c,"invalidation",cache.stats().size===0,"Invalidation retained an entry");
    try {const value=cache.evaluate(c.input);check(c,"after-invalidation",adapter.validateOutput(c.input,value).length===0&&canonical(value)===canonical(outputs.get("raw")),"Regenerated result changed or became invalid");}
    catch(error){check(c,"after-invalidation",false,String(error));}
    check(c,"immutable-input",canonical(c.input)===original,"Generator/cache mutated frozen input");
  }
  return { schemaVersion:1, profile:adapter.profile, verdict:failures.length?"FAIL":"PASS", cases:adapter.cases.length, assertions, failures,
    scope:"Offline invariants only", parentAcceptance:false, nativeValidation:false, freshReviewStillRequired:true };
}
