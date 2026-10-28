// Parent-owned explicit oracles for the NEW fixed-layout API, not a copied producer.
import { expect, test } from "bun:test";
import { ClusterDiagnosticError as PublicError, clusterGraph, type ClusterInput } from "../src/cluster";
import { ClusterDiagnosticError as CodecError, sparseGraph } from "../src/sparse-graph-codecs";
import { prepareGroupContextSource, bindGroupContext, deriveFixedGroupContexts, type GroupContextPartition } from "../src/group-context-codecs";
const H = "a".repeat(64), id = (n: number) => `${H}:0x${n.toString(16).toUpperCase()}`;
function fixture() {
  const input: ClusterInput = { snapshotId: "snapshot:fixed-api", normalizedFingerprint: "b".repeat(64),
    nodes: [16,32,48].map(n => ({ id:id(n),moduleSha256:H,rva:`0x${n.toString(16).toUpperCase()}`,functionClass:"internal",status:"observed",semanticMaturity:"structural",sizeBytes:{known:true,value:8},instructionCount:{known:true,value:2} })),
    edges:[], objects:[],unresolved:[],capabilities:[],coverage:{status:"complete",uncoveredReason:null} };
  const partition: GroupContextPartition = { schemaVersion:1,partitionId:"partition:fixed-api",snapshotId:input.snapshotId,snapshotFingerprint:input.normalizedFingerprint,
    communities:[{contentId:"community:kernel",memberIds:[id(32),id(16)],kernelIds:[id(16)],externalContextIds:[]},
      {contentId:"community:emptykernel",memberIds:[id(48)],kernelIds:[],externalContextIds:[]}] };
  return {input,partition,source:bindGroupContext(prepareGroupContextSource(input,partition,{}, {kind:"raw-active-control-relations"}),[])};
}
for (const groupId of ["__proto__", "constructor", "toString", "hasOwnProperty", "ordinary:group"]) {
  test(`fixed supplied ID own metrics: ${groupId}`, () => {
    const {source}=fixture(),r=deriveFixedGroupContexts(source,[{groupId,ownedFunctionIds:[id(16)]}]);
    expect(r.contexts).toHaveLength(1); expect(r.contexts[0]!.groupId).toBe(groupId);
    expect(r.contexts[0]!.contextFunctionIds).toEqual([]); expect(r.contexts[0]!.uncoveredIds).toEqual([id(32)]);
    const m=r.metrics;
    for (const d of [m.sourceCommunitiesByGroupId,m.kernelIdsByGroupId,m.contextIdListUtf8BytesByGroupId,m.omittedContextIdsByGroupId]) {
      expect(Object.hasOwn(d,groupId)).toBe(true); expect(Object.keys(d)).toEqual([groupId]);
      expect(Object.hasOwn(JSON.parse(JSON.stringify(d)),groupId)).toBe(true);
    }
    expect(m.sourceCommunitiesByGroupId[groupId]).toEqual(["community:kernel"]);
    expect(m.kernelIdsByGroupId[groupId]).toEqual([id(16)]);
    expect(m.contextIdListUtf8BytesByGroupId[groupId]).toBe(2);
    expect(m.omittedContextIdsByGroupId[groupId]).toEqual([]);
    expect(m.ownerByFunctionId[id(16)]).toBe(groupId); expect(m.uncoveredOwnerByFunctionId[id(32)]).toBe(groupId);
    expect(m.uncoveredCommunityByFunctionId[id(48)]).toBe("community:emptykernel");
    expect(m.nonCoveredIds).toEqual([id(32),id(48)]);
  });
}
test("single diagnostic constructor survives public backward export", () => {
  expect(PublicError).toBe(CodecError);
  const error=new CodecError({version:"cluster-refusal-v1",code:"unsupported-numeric",detail:"own fixture"});
  expect(error instanceof PublicError).toBe(true);
  const {input}=fixture(); input.nodes=[];
  try { clusterGraph(input); throw new Error("accepted empty snapshot"); }
  catch(error) { expect(error instanceof PublicError).toBe(true); expect(error instanceof CodecError).toBe(true); }
});
test("fixed source and partition are not mutated; invalid ownership refused", () => {
  const {source,input,partition}=fixture(),before=JSON.stringify({input,partition}),groups=[{groupId:"g",ownedFunctionIds:[id(16)]}],owned=JSON.stringify(groups);
  deriveFixedGroupContexts(source,groups); expect(JSON.stringify({input,partition})).toBe(before); expect(JSON.stringify(groups)).toBe(owned);
  expect(()=>deriveFixedGroupContexts(source,[])).toThrow();
  expect(()=>deriveFixedGroupContexts(source,[{groupId:"g",ownedFunctionIds:[id(32)]}])).toThrow();
  expect(()=>deriveFixedGroupContexts(source,[{groupId:"g",ownedFunctionIds:[id(16)]},{groupId:"h",ownedFunctionIds:[id(16)]}])).toThrow();
});
test("uncovered nonkernel attribution follows first numeric kernel, not supplied group order", () => {
  const {input,partition}=fixture();
  input.nodes.push({...input.nodes[0]!,id:id(64),rva:"0x40"});
  partition.communities=[{contentId:"community:kernel",memberIds:[id(64),id(32),id(16)],kernelIds:[id(32),id(16)],externalContextIds:[]},partition.communities[1]!];
  const source=bindGroupContext(prepareGroupContextSource(input,partition,{}, {kind:"raw-active-control-relations"}),[]);
  const r=deriveFixedGroupContexts(source,[{groupId:"later-first",ownedFunctionIds:[id(32)]},{groupId:"__proto__",ownedFunctionIds:[id(16)]}]);
  expect(r.contexts[0]!.uncoveredIds).toEqual([]); expect(r.contexts[1]!.uncoveredIds).toEqual([id(64)]);
  expect(r.metrics.uncoveredOwnerByFunctionId[id(64)]).toBe("__proto__");
  expect(r.metrics.uncoveredCommunityByFunctionId[id(48)]).toBe("community:emptykernel");
  expect(()=>deriveFixedGroupContexts(source,[{groupId:"__proto__",ownedFunctionIds:[id(32)]},{groupId:"__proto__",ownedFunctionIds:[id(16)]}])).toThrow();
});
test("partition and raw-vs-affinity group adjacency are distinct source roles", () => {
  const {input,partition,source:raw}=fixture(),provided=sparseGraph(input.nodes.map(n=>n.id),[{source:0,target:2,weight:1}]);
  const affinity=bindGroupContext(prepareGroupContextSource(input,partition,{}, {kind:"provided-affinity",graph:provided}),[]);
  const groups=[{groupId:"g",ownedFunctionIds:[id(16)]}];
  expect(deriveFixedGroupContexts(raw,groups).contexts[0]!.contextFunctionIds).toEqual([]);
  expect(deriveFixedGroupContexts(affinity,groups).contexts[0]!.contextFunctionIds).toEqual([id(48)]);
  expect(affinity.contextBinding).not.toEqual(raw.contextBinding);
  // This demonstrates distinct projection inputs, never authenticity of either.
});
