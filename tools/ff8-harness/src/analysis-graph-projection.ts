import type { FunctionNodeV1, FunctionEdgeV1, UnresolvedReferenceV1, Provenance } from "./graph";
import { captureAnalysisRequestV1, captureAnalysisFactsV1, type StaticAcquisitionRequestV1, type StaticAnalysisFactsV1 } from "./ports/analysis";

export interface AnalysisProjectionCodecV1 { canonical(value: unknown): string; sha256(value: string): string }
export interface AnalysisGraphFragmentV1 {
  version: "rms-analysis-graph-fragment-v1";
  nodes: FunctionNodeV1[]; edges: FunctionEdgeV1[]; unresolved: UnresolvedReferenceV1[];
  sourceFacts: StaticAnalysisFactsV1;
  limitations: string[];
  unprojected: Array<{ kind: "function" | "relation"; id: string; reason: string }>;
}
/** New DATA fragment only: no artifact, IDB identity, snapshot, publication or native admission.
 * The parent must validate historical quarantine, artifact and revision invariants at assembly.
 * codec is trusted serialization, not a native-evidence verifier.
 */
export function projectAnalysisFactsToGraphV1(request: StaticAcquisitionRequestV1, input: StaticAnalysisFactsV1, codec: AnalysisProjectionCodecV1, context: { graphRevision: number }): AnalysisGraphFragmentV1 {
  const revision = context?.graphRevision;
  if (!Number.isSafeInteger(revision) || revision < 0) throw new Error("analysis: graphRevision context required");
  const capturedRequest = captureAnalysisRequestV1(request);
  const facts = captureAnalysisFactsV1(capturedRequest, input);
  const module = facts.observedIdentity.moduleSha256, base = facts.observedIdentity.imageBase;
  const fnId = (rva: string) => `${module}:${rva}`;
  const result: AnalysisGraphFragmentV1 = { version: "rms-analysis-graph-fragment-v1", nodes: [], edges: [], unresolved: [], sourceFacts: facts, limitations: [...facts.limitations, "Fragment only; no native qualification or snapshot admission. Coverage, bytes and raw references remain in sourceFacts."], unprojected: [] };
  for (const rva of capturedRequest.scope.functionRvas) if (!facts.functions.some(f => f.rva === rva)) result.unprojected.push({ kind: "function", id: fnId(rva), reason: "Requested function not observed; existence remains unknown." });
  for (const f of facts.functions) {
    // v1 requires known chunks to attribute instruction sites; do not invent them.
    if (!f.chunks.length) { result.unprojected.push({ kind: "function", id: fnId(f.rva), reason: "No observed chunks; v1 function projection withheld." }); continue; }
    result.nodes.push({ schemaVersion: 1, id: fnId(f.rva), moduleSha256: module, rva: f.rva, ea: f.ea, imageBase: base, name: f.name, observedDescription: "", boundaries: f.chunks.map((c, ordinal) => ({ ...c, ordinal })), sizeBytes: { ...f.sizeBytes }, instructionCount: { ...f.instructionCount }, basicBlockCount: { ...f.basicBlockCount }, functionClass: "incomplete", status: "incomplete", semanticMaturity: "none", analysisRefs: [...f.sourceIds], byteAgreement: "unknown", admissibleAsOracle: false, byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null } });
  }
  const nodes = new Map(result.nodes.map(n => [n.rva, n]));
  const provenance = (sourceId: string, siteRva: string, xrefType: "code" | "data"): Provenance => {
    const s = facts.sources.find(s => s.id === sourceId)!;
    return { moduleSha256: module, siteRva, siteKind: "instruction", xrefType, source: s.locator, sourceVersion: s.sourceVersion, sourceHash: s.sourceSha256, evidenceSha256: s.evidenceSha256 };
  };
  for (const r of facts.relations) {
    const source = nodes.get(r.fromFunctionRva);
    const omit = (reason: string) => result.unprojected.push({ kind: "relation", id: r.id, reason });
    if (!source || !source.boundaries.some(c => BigInt(r.siteRva) >= BigInt(c.rva) && BigInt(r.siteRva) < BigInt(c.endRvaExclusive))) { omit("Source/site not in projected observed chunks."); continue; }
    if (r.kind === "data_xref") { omit("DATA reference retained without inventing a v1 call or referenced object."); continue; }
    const sites = r.sourceIds.map(s => ({ siteRva: r.siteRva, xrefType: r.xrefType, provenance: provenance(s, r.siteRva, r.xrefType) }));
    if (r.target.kind === "function" && nodes.has(r.target.rva)) {
      if (r.kind === "indirect_jump") { omit("Generic indirect jump is not a proven v1 tail jump."); continue; }
      const kind: FunctionEdgeV1["kind"] = r.kind === "indirect_call" ? "indirect_resolved" : r.kind;
      const identity = { sourceId: source.id, destinationId: fnId(r.target.rva), kind, sites };
      const digest = codec.sha256(codec.canonical(identity));
      if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error("analysis: codec sha256 invalid");
      result.edges.push({ schemaVersion: 1, id: `edge:${digest.slice(0, 40)}`, ...identity, direction: "source_to_destination", status: "observed", confidence: "unknown", appearedInRevision: revision, retiredInRevision: null, schedulerRelevance: "may_block" });
    } else if (r.target.kind === "unknown" && (r.kind === "indirect_call" || r.kind === "indirect_jump")) {
      // Each citation is retained; no fabricated destination function.
      for (const [index, site] of sites.entries()) result.unresolved.push({ schemaVersion: 1, id: `analysis:${facts.requestId}:${r.id}:${index}`, fromFunctionId: source.id, siteRva: r.siteRva, kind: r.kind, target: "unknown", referencedObjectId: null, fabricatedFunction: false, provenance: site.provenance });
    } else omit("Target/semantics not honestly representable in graph v1; no function fabricated or direct call relabeled.");
  }
  function protect(value: unknown): void { if (value && typeof value === "object") { Object.values(value).forEach(protect); Object.freeze(value); } }
  protect(result);
  return result;
}
