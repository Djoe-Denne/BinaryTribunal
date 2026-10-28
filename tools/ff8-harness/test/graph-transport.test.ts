import { describe, expect, test } from "bun:test";
import {
  decodePreparedGraphV3,
  decodePartitionAdoptionV1,
  inspectPreparedGraphV3,
  inspectPartitionAdoptionV1,
} from "../src/graph-transport";

// Independent contract tests; SOURCE ONLY, NOT EXECUTED by their author.
// Fixtures are synthetic JSON data, not HOST receipts or adopted partitions.
const MODULE = "a".repeat(64);
const SNAPSHOT_HASH = "b".repeat(64);
const A_CONFIG_HASH = "c".repeat(64);
const F1 = `${MODULE}:0x1`;
const F2 = `${MODULE}:0x2`;
const F3 = `${MODULE}:0x3`;
const SNAPSHOT_ID = "snap:transport-qa";

// Fixture hashing only: canonical JSON data, not a decoder, schema validator,
// clustering implementation, receipt verifier, or product helper invocation.
function fixtureCanonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(fixtureCanonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${fixtureCanonical(record[key])}`).join(",")}}`;
}

function fixtureDigest(value: unknown): string {
  return new Bun.CryptoHasher("sha256").update(fixtureCanonical(value)).digest("hex");
}

function unknownMetric() { return { known: false, value: null as number | null }; }

function makeConfig() {
  return {
    rulesetVersion: "ff8-tech-syn-1", synonyms: false,
    bm25: { k1: 1.2, b: 0.75 }, topK: 2, scoreTieDecimals: 6,
    similarityThreshold: 0.5, maxPostingDf: 10, maxCandidates: 10,
    hubMinDegree: 10, hysteresis: 0.5,
    views: { structure: true, data: false, lexical: false, embeddings: false, validatedRelations: false, capabilities: false },
  };
}

function configDigest() {
  return fixtureDigest({ algorithm: "multiview-components", algorithmVersion: "2", ...makeConfig(), encoder: null });
}

function makeCommunity(algorithm: string, algorithmVersion: string, configFingerprint: string, memberIds: string[]) {
  const members = [...memberIds];
  const contentId = fixtureDigest({ algorithm, algorithmVersion, configFingerprint, memberIds: members });
  return {
    contentId,
    lineageId: algorithm === "multiview-components"
      ? `lin:c:${fixtureDigest({ role: "community-lineage", algorithm, algorithmVersion, configFingerprint, memberIds: members })}`
      : `root:${contentId}`,
    parentContentIds: [] as string[], memberIds: members, kernelIds: [] as string[],
    externalContextIds: [] as string[], conductance: unknownMetric(),
  };
}

function makePartition(regime: "A" | "B" = "A") {
  const algorithm = regime === "A" ? "hub-baseline" : "multiview-components";
  const algorithmVersion = regime === "A" ? "ff8-structural-1.2.0" : "2";
  const configFingerprint = regime === "A" ? A_CONFIG_HASH : configDigest();
  const communities = [makeCommunity(algorithm, algorithmVersion, configFingerprint, [F1, F2])];
  const contentIds = communities.map(item => item.contentId);
  const partitionId = regime === "A"
    ? fixtureDigest({ snapshot: SNAPSHOT_HASH, configFingerprint, algorithmVersion })
    : `part:${fixtureDigest({ role: "partition", configFingerprint, snapshotId: SNAPSHOT_ID, contentIds })}`;
  return {
    schemaVersion: 1,
    partitionId,
    lineageId: regime === "A" ? `root:${partitionId}` : `lin:p:${fixtureDigest({ role: "partition-lineage", configFingerprint, snapshotId: SNAPSHOT_ID, contentIds })}`,
    parentLineageId: null as string | null, snapshotId: SNAPSHOT_ID,
    snapshotFingerprint: SNAPSHOT_HASH, regime, algorithm, algorithmVersion,
    configFingerprint, seed: "none", communities,
    modularity: unknownMetric(), maturity: "structural", adopted: false,
  };
}

function makeGroup(partition: ReturnType<typeof makePartition>) {
  return {
    schemaVersion: 1, groupId: "group:transport-qa", partitionId: partition.partitionId,
    communityContentId: partition.communities[0]!.contentId,
    ownedFunctionIds: [F1], contextFunctionIds: [] as string[], capabilityIds: [] as string[],
    granularity: "function", estimatedCost: unknownMetric(), uncoveredIds: [F1, F2],
    memberMaturity: [{ functionId: F1, semanticMaturity: "none" }],
  };
}

function makePreparedA() {
  const partition = makePartition();
  return { schemaVersion: 3, partition, groups: [makeGroup(partition)] };
}

function makeProvenance() {
  return {
    moduleSha256: MODULE, siteRva: null as string | null, siteKind: "instruction",
    xrefType: "call", source: "synthetic-qa", sourceVersion: "1",
    sourceHash: "d".repeat(64), evidenceSha256: "e".repeat(64),
  };
}

function makeConstraint() {
  return { kind: "must-link", leftId: F1, rightId: F2, provenance: makeProvenance(), validation: "fixture-only" };
}

function makeEdge() {
  return {
    id: "edge:transport-qa", sourceId: F1, destinationId: F2,
    kind: "CALL", status: "observed", schedulerRelevance: "structural",
    sites: [{ siteRva: "0x1", xrefType: "call", provenance: makeProvenance() }],
  };
}

function makeDiagnostic() {
  return { code: "synthetic-negative", severity: "fail", detail: "QA only", functionIds: [] as string[] };
}

function makeProposalResult(partition: ReturnType<typeof makePartition>) {
  return {
    partition: structuredClone(partition),
    lineageSidecar: {
      version: "l4-lineage-2", partitionId: partition.partitionId,
      v1Compatible: true, proposalPass: true, projectionFingerprint: fixtureDigest(partition),
      communities: partition.communities.map(item => ({ contentId: item.contentId, parentContentIds: [...item.parentContentIds], conductance: unknownMetric() })),
    },
    diagnostics: [] as ReturnType<typeof makeDiagnostic>[],
    constraints: { status: "none", applied: 0, rejected: 0 },
  };
}

function makePreparedB() {
  const partition = makePartition("B");
  const body = {
    version: "l4-proposal-evidence-1",
    source: {
      snapshot: {
        schemaVersion: 1, snapshotId: SNAPSHOT_ID, normalizedFingerprint: SNAPSHOT_HASH,
        nodes: [F1, F2].map((id, index) => ({ id, moduleSha256: MODULE, rva: `0x${index + 1}`, name: `synthetic_${index + 1}`, observedDescription: "", semanticMaturity: "none", functionClass: "internal" })),
        edges: [] as ReturnType<typeof makeEdge>[], objects: [], unresolved: [], capabilities: [],
      },
      config: makeConfig(), constraints: [] as ReturnType<typeof makeConstraint>[],
      encoderIdentity: null, encoderIdentityStatus: "absent", previous: null,
    },
    result: makeProposalResult(partition),
  };
  return {
    schemaVersion: 3, partition, groups: [makeGroup(partition)],
    proposalEvidence: { ...body, evidenceFingerprint: fixtureDigest(body) },
  };
}

function refreshEvidence(value: ReturnType<typeof makePreparedB>) {
  const { version, source, result } = value.proposalEvidence;
  value.proposalEvidence.evidenceFingerprint = fixtureDigest({ version, source, result });
}

function makeRawNegativeB() {
  const value = makePreparedB();
  const link = makeConstraint();
  // Exactly the ten raw string paths relaxed by the pinned schema delta.
  link.leftId = "";
  link.rightId = "missing endpoint\n\u0000";
  link.provenance.moduleSha256 = "not-a-module";
  link.provenance.sourceHash = "";
  link.provenance.evidenceSha256 = "BAD";
  value.proposalEvidence.source.constraints.push(link);
  const edge = makeEdge();
  edge.sourceId = "";
  edge.destinationId = "not-a-function";
  edge.sites[0]!.provenance.moduleSha256 = "BAD";
  edge.sites[0]!.provenance.sourceHash = "short";
  edge.sites[0]!.provenance.evidenceSha256 = "";
  value.proposalEvidence.source.snapshot.edges.push(edge);
  value.proposalEvidence.result.constraints = { status: "unsatisfiable", applied: 0, rejected: 1 };
  value.proposalEvidence.result.diagnostics.push({
    code: "raw-rejection", severity: "fail", detail: "lossless: \u0000\nétat ≠ autorité",
    functionIds: ["", "raw:not-an-id", "raw:not-an-id"],
  });
  value.proposalEvidence.result.lineageSidecar.proposalPass = false;
  refreshEvidence(value);
  return value;
}

function makeInventory() {
  return {
    unitId: "unit:historical", state: "READY", snapshotId: "snap:historical",
    ownedFunctionIds: [F1], attemptIds: [] as string[], claimIds: [] as string[],
    workerStillExecutable: false, leaseHeld: false,
  };
}

function makeProof() {
  return {
    unitId: "unit:historical", snapshotId: "snap:historical", attemptIds: [] as string[], claimIds: [] as string[],
    authorityRef: "forged:quiescence-reference", revision: 7,
    quiescent: true, released: true, workerStillExecutable: false, leaseHeld: false,
  };
}

function makeAdoption(prepared = makePreparedA()) {
  const partition = prepared.partition;
  const proposalFingerprint = fixtureDigest({ ...partition, adopted: false });
  return {
    schemaVersion: 1, partitionId: partition.partitionId, lineageId: partition.lineageId,
    snapshotId: partition.snapshotId, snapshotFingerprint: partition.snapshotFingerprint,
    configFingerprint: partition.configFingerprint, proposalFingerprint, observedDigest: proposalFingerprint,
    fromRevision: 7, toRevision: 8, quiescenceProofs: [] as ReturnType<typeof makeProof>[],
    actor: { hostReceiptRef: "forged:HOST-reference-not-authenticated" },
    inventory: [] as ReturnType<typeof makeInventory>[], explicit: true,
  };
}

function expectNoAuthority(report: { authority: unknown; adoptionReady: unknown }) {
  expect(report.authority).toBe("untrusted");
  expect(report.adoptionReady).toBe(false);
}

function expectShapeFailure(decoder: (value: unknown) => { ok: boolean; errors?: readonly string[] }, value: unknown) {
  const decoded = decoder(value);
  expect(decoded.ok).toBe(false);
  if (!decoded.ok) {
    expect(Array.isArray(decoded.errors)).toBe(true);
    expect(decoded.errors!.length).toBeGreaterThan(0);
    expect(decoded.errors!.every(error => typeof error === "string")).toBe(true);
  }
}

function expectDetachedFrozen(input: unknown, output: unknown) {
  expect(output).toEqual(input);
  if (input === null || typeof input !== "object") return;
  expect(output).not.toBe(input);
  expect(Object.isFrozen(output)).toBe(true);
  const source = input as Record<string, unknown>;
  const target = output as Record<string, unknown>;
  for (const key of Object.keys(source)) expectDetachedFrozen(source[key], target[key]);
}

describe("L8 transport — closed JSON form, not aliases or adoption", () => {
  test("minimal A, B and adoption decode as exact data", () => {
    for (const input of [makePreparedA(), makePreparedB()]) {
      const decoded = decodePreparedGraphV3(input);
      expect(decoded.ok).toBe(true);
      if (decoded.ok) expect<unknown>(decoded.value).toEqual(input);
    }
    const adoption = makeAdoption();
    const decoded = decodePartitionAdoptionV1(adoption);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect<unknown>(decoded.value).toEqual(adoption);
  });

  test("versions are mandatory; v1/v2 partitions and serialized JSON are not v3 aliases", () => {
    const { schemaVersion: omitted, ...withoutVersion } = makePreparedA();
    void omitted;
    for (const input of [withoutVersion, makePartition(), JSON.stringify(makePreparedA()), null, [], 3, true]) {
      expectShapeFailure(decodePreparedGraphV3, input);
    }
    for (const version of [0, 1, 2, 4]) expectShapeFailure(decodePreparedGraphV3, { ...makePreparedA(), schemaVersion: version });
    for (const version of [0, 2, 3]) expectShapeFailure(decodePartitionAdoptionV1, { ...makeAdoption(), schemaVersion: version });
    const { schemaVersion: adoptionVersion, ...withoutAdoptionVersion } = makeAdoption();
    void adoptionVersion;
    expectShapeFailure(decodePartitionAdoptionV1, withoutAdoptionVersion);
    expectShapeFailure(decodePartitionAdoptionV1, JSON.stringify(makeAdoption()));
  });

  test("closed objects reject unknown fields instead of stripping them", () => {
    const changes: Array<(value: ReturnType<typeof makePreparedB>) => void> = [
      value => { Object.assign(value, { unexpected: true }); },
      value => { Object.assign(value.partition, { unexpected: true }); },
      value => { Object.assign(value.partition.communities[0]!, { unexpected: true }); },
      value => { Object.assign(value.groups[0]!, { unexpected: true }); },
      value => { Object.assign(value.groups[0]!.estimatedCost, { unexpected: true }); },
      value => { Object.assign(value.proposalEvidence, { unexpected: true }); },
      value => { Object.assign(value.proposalEvidence.source, { unexpected: true }); },
      value => { Object.assign(value.proposalEvidence.source.config.bm25, { unexpected: true }); },
      value => { Object.assign(value.proposalEvidence.source.snapshot.nodes[0]!, { unexpected: true }); },
      value => { Object.assign(value.proposalEvidence.result.lineageSidecar, { unexpected: true }); },
    ];
    for (const change of changes) {
      const input = makePreparedB(); change(input);
      expectShapeFailure(decodePreparedGraphV3, input);
    }
    for (const change of [
      (value: ReturnType<typeof makeAdoption>) => { Object.assign(value, { adopted: true }); },
      (value: ReturnType<typeof makeAdoption>) => { Object.assign(value.actor, { kind: "localReceipt" }); },
      (value: ReturnType<typeof makeAdoption>) => { Object.assign(value.inventory[0]!, { executionContext: {} }); },
      (value: ReturnType<typeof makeAdoption>) => { Object.assign(value.quiescenceProofs[0]!, { trusted: true }); },
    ]) {
      const input = makeAdoption(); input.inventory.push(makeInventory()); input.quiescenceProofs.push(makeProof()); change(input);
      expectShapeFailure(decodePartitionAdoptionV1, input);
    }
  });

  test("types, scalar limits and current adopted=false remain form constraints", () => {
    const invalidPrepared = [
      { ...makePreparedA(), schemaVersion: "3" },
      { ...makePreparedA(), partition: { ...makePartition(), adopted: true } },
      { ...makePreparedA(), partition: { ...makePartition(), schemaVersion: 2 } },
      { ...makePreparedA(), partition: { ...makePartition(), snapshotFingerprint: "short" } },
      { ...makePreparedA(), groups: null },
    ];
    for (const input of invalidPrepared) expectShapeFailure(decodePreparedGraphV3, input);
    const resultAdopted = makePreparedB(); resultAdopted.proposalEvidence.result.partition.adopted = true;
    expectShapeFailure(decodePreparedGraphV3, resultAdopted);
    for (const input of [
      { ...makeAdoption(), explicit: false }, { ...makeAdoption(), fromRevision: -1 },
      { ...makeAdoption(), toRevision: 100000001 }, { ...makeAdoption(), fromRevision: 1.5 },
      { ...makeAdoption(), actor: { hostReceiptRef: "" } },
    ]) expectShapeFailure(decodePartitionAdoptionV1, input);
  });
});

describe("L8 transport — detached frozen snapshots and safe data", () => {
  test("both decoders deeply detach/freeze without freezing or mutating inputs", () => {
    const prepared = makeRawNegativeB(); const beforePrepared = structuredClone(prepared);
    const adoption = makeAdoption(); adoption.inventory.push(makeInventory()); adoption.quiescenceProofs.push(makeProof());
    const beforeAdoption = structuredClone(adoption);
    const p = decodePreparedGraphV3(prepared), a = decodePartitionAdoptionV1(adoption);
    expect(p.ok).toBe(true); expect(a.ok).toBe(true);
    if (!p.ok || !a.ok) throw new Error("synthetic fixtures must decode before snapshot checks");
    expectDetachedFrozen(prepared, p.value); expectDetachedFrozen(adoption, a.value);
    expect(Object.isFrozen(prepared)).toBe(false); expect(Object.isFrozen(prepared.partition.communities[0]!.memberIds)).toBe(false);
    expect(Object.isFrozen(adoption.inventory)).toBe(false);
    expect(prepared).toEqual(beforePrepared); expect(adoption).toEqual(beforeAdoption);
    prepared.partition.communities[0]!.memberIds.push(F3);
    prepared.proposalEvidence.result.diagnostics[0]!.detail = "changed later";
    adoption.inventory[0]!.ownedFunctionIds.push(F3); adoption.actor.hostReceiptRef = "changed later";
    expect<unknown>(p.value).toEqual(beforePrepared); expect<unknown>(a.value).toEqual(beforeAdoption);
  });

  test("accessors are refused without executing getters (no Proxy guarantee claimed)", () => {
    let calls = 0;
    const prepared = makePreparedA();
    Object.defineProperty(prepared, "schemaVersion", { enumerable: true, configurable: true, get() { calls++; return 3; } });
    expectShapeFailure(decodePreparedGraphV3, prepared);
    expect(inspectPreparedGraphV3(prepared).wellFormed).toBe(false);
    const adoption = makeAdoption();
    Object.defineProperty(adoption.actor, "hostReceiptRef", { enumerable: true, configurable: true, get() { calls++; return "forged:HOST"; } });
    expectShapeFailure(decodePartitionAdoptionV1, adoption);
    expect(inspectPartitionAdoptionV1(adoption).wellFormed).toBe(false);
    expect(calls).toBe(0);
  });

  test("non-JSON values are not silently coerced by serialization", () => {
    for (const value of [undefined, NaN, Infinity, -Infinity, 1n, () => 1, Symbol("not-json")]) {
      expectShapeFailure(decodePreparedGraphV3, { ...makePreparedA(), schemaVersion: value });
      expectShapeFailure(decodePartitionAdoptionV1, { ...makeAdoption(), fromRevision: value });
    }
    const cyclic = makePreparedA(); Object.assign(cyclic, { unexpected: cyclic });
    expectShapeFailure(decodePreparedGraphV3, cyclic);
  });
});

describe("L8 prepared inspection — A, permissible transport and raw statistics", () => {
  test("coherent A has no evidence, no authority and the documented raw counters", () => {
    const input = makePreparedA(), before = structuredClone(input);
    const report = inspectPreparedGraphV3(input);
    expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(true);
    expect(report.schemaErrors).toEqual([]); expect(report.coherenceErrors).toEqual([]);
    expect(report.branch).toBe("A");
    expect(report.evidence).toEqual({ status: "not-present", present: false, wellFormed: null, admissible: null });
    expect(report.stats).toMatchObject({
      communityCount: 1, groupCount: 1, memberIdCount: 2, kernelIdCount: 0,
      externalContextIdCount: 0, ownedFunctionIdCount: 1, groupContextIdCount: 0,
      uncoveredIdCount: 2, snapshotNodeCount: null, snapshotEdgeCount: null,
    });
    expectNoAuthority(report); expect(input).toEqual(before);
  });

  test("transport includes all five granularities, empty groups and empty kernels", () => {
    for (const granularity of ["function", "family", "scc", "group", "subgroup"]) {
      const input = makePreparedA(); input.groups[0]!.granularity = granularity;
      expect(decodePreparedGraphV3(input).ok).toBe(true);
      const report = inspectPreparedGraphV3(input);
      expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(true); expectNoAuthority(report);
    }
    const input = makePreparedA(); input.groups = [];
    expect(decodePreparedGraphV3(input).ok).toBe(true);
    const report = inspectPreparedGraphV3(input);
    expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(true);
    expect(report.stats).toMatchObject({ groupCount: 0, kernelIdCount: 0, ownedFunctionIdCount: 0 });
  });

  test("owned IDs may cross community boundaries; uncovered may overlap owned; coverage is not invented", () => {
    const input = makePreparedA(), partition = input.partition;
    partition.communities.push(makeCommunity(partition.algorithm, partition.algorithmVersion, partition.configFingerprint, [F3]));
    input.groups[0]!.ownedFunctionIds = [F3];
    input.groups[0]!.uncoveredIds = [F3];
    input.groups[0]!.memberMaturity = [{ functionId: F3, semanticMaturity: "none" }];
    const report = inspectPreparedGraphV3(input);
    expect(decodePreparedGraphV3(input).ok).toBe(true);
    expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(true);
    expect(report.stats).toMatchObject({ communityCount: 2, memberIdCount: 3, ownedFunctionIdCount: 1, uncoveredIdCount: 1 });
    expectNoAuthority(report);
  });

  test("well-formed incoherent data still has raw, not deduplicated, counters", () => {
    const input = makePreparedA();
    input.partition.communities[0]!.memberIds = [F1, F1, F2];
    input.partition.communities[0]!.kernelIds = [F1, F1];
    input.partition.communities[0]!.externalContextIds = [F3, F3];
    input.groups[0]!.ownedFunctionIds = [F1, F1];
    input.groups[0]!.contextFunctionIds = [F2, F2];
    input.groups[0]!.uncoveredIds = [F2, F2, F2];
    const report = inspectPreparedGraphV3(input);
    expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(false);
    expect(report.schemaErrors).toEqual([]); expect(report.coherenceErrors.length).toBeGreaterThan(0);
    expect(report.stats).toMatchObject({ memberIdCount: 3, kernelIdCount: 2, externalContextIdCount: 2, ownedFunctionIdCount: 2, groupContextIdCount: 2, uncoveredIdCount: 3 });
    expectNoAuthority(report);
  });
});

describe("L8 prepared inspection — relational failures are not shape failures", () => {
  test("IDs, membership, lowercase hashes and group joins are checked after form", () => {
    const changes: Array<(value: ReturnType<typeof makePreparedA>) => void> = [
      value => { value.partition.lineageId = value.partition.partitionId; },
      value => { value.partition.communities[0]!.lineageId = value.partition.communities[0]!.contentId; },
      value => { value.partition.communities[0]!.kernelIds = [F3]; },
      value => { value.partition.communities[0]!.externalContextIds = [F1]; },
      value => { value.partition.communities[0]!.contentId = "f".repeat(64); },
      value => { value.partition.snapshotFingerprint = SNAPSHOT_HASH.toUpperCase(); },
      value => { value.groups[0]!.partitionId = "part:missing"; },
      value => { value.groups[0]!.communityContentId = "f".repeat(64); },
      value => { value.partition.modularity = { known: false, value: 0 }; },
    ];
    for (const change of changes) {
      const input = makePreparedA(); change(input);
      expect(decodePreparedGraphV3(input).ok).toBe(true);
      const report = inspectPreparedGraphV3(input);
      expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(false);
      expect(report.schemaErrors).toEqual([]); expect(report.coherenceErrors.length).toBeGreaterThan(0);
      expect(report.stats).not.toBeNull(); expectNoAuthority(report);
    }
  });

  test("invalid form has null stats/branch, schema errors and never authority", () => {
    const report = inspectPreparedGraphV3({ ...makePreparedA(), schemaVersion: 2 });
    expect(report.wellFormed).toBe(false); expect(report.coherent).toBe(false);
    expect(report.schemaErrors.length).toBeGreaterThan(0); expect(report.stats).toBeNull();
    expect(report.branch).toBeNull(); expectNoAuthority(report);
  });
});

describe("L8 prepared B — evidence form, consistency and admissibility are separate", () => {
  test("B without evidence decodes but cannot be coherent", () => {
    const { proposalEvidence: omitted, ...input } = makePreparedB(); void omitted;
    expect(decodePreparedGraphV3(input).ok).toBe(true);
    const report = inspectPreparedGraphV3(input);
    expect(report.branch).toBe("B"); expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(false);
    expect(report.schemaErrors).toEqual([]); expect(report.coherenceErrors.length).toBeGreaterThan(0);
    expect(report.evidence).toEqual({ status: "not-present", present: false, wellFormed: null, admissible: null });
    expectNoAuthority(report);
  });

  test("synthetic coherent B can be inspected, but admissibility is not HOST authority", () => {
    const input = makePreparedB(), before = structuredClone(input);
    const report = inspectPreparedGraphV3(input);
    expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(true); expect(report.branch).toBe("B");
    expect(report.evidence).toEqual({ status: "inspected-B", present: true, wellFormed: true, admissible: true });
    expect(report.stats).toMatchObject({ snapshotNodeCount: 2, snapshotEdgeCount: 0 });
    expectNoAuthority(report); expect(input).toEqual(before);
  });

  test("A may retain optional evidence without interpreting it as B authority", () => {
    const input = { ...makePreparedA(), proposalEvidence: makeRawNegativeB().proposalEvidence };
    const decoded = decodePreparedGraphV3(input);
    expect(decoded.ok).toBe(true); if (decoded.ok) expect<unknown>(decoded.value).toEqual(input);
    const report = inspectPreparedGraphV3(input);
    expect(report.wellFormed).toBe(true); expect(report.coherent).toBe(false); expect(report.branch).toBe("A");
    expect(report.evidence).toEqual({ status: "not-applicable-A", present: true, wellFormed: null, admissible: null });
    expectNoAuthority(report);
    // Optional presence is legal, but an unrelated B result does not mirror A.
    // A mirrored A result gives the positive without invoking the B-only gate.
    const mirrored = structuredClone(input);
    mirrored.proposalEvidence.result.partition = structuredClone(mirrored.partition);
    refreshEvidence(mirrored);
    expect(decodePreparedGraphV3(mirrored).ok).toBe(true);
    const aligned = inspectPreparedGraphV3(mirrored);
    expect(aligned.wellFormed).toBe(true); expect(aligned.coherent).toBe(true); expect(aligned.branch).toBe("A");
    expect(aligned.evidence).toEqual({ status: "not-applicable-A", present: true, wellFormed: null, admissible: null });
    expectNoAuthority(aligned);
  });

  test("ten raw negative strings and diagnostics survive decode; negative evidence is not a schema rejection", () => {
    const input = makeRawNegativeB(), before = structuredClone(input);
    const decoded = decodePreparedGraphV3(input);
    expect(decoded.ok).toBe(true); if (decoded.ok) expect<unknown>(decoded.value).toEqual(before);
    const report = inspectPreparedGraphV3(input);
    expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]);
    expect(report.evidence).toEqual({ status: "inspected-B", present: true, wellFormed: true, admissible: false });
    expect(report.stats).toMatchObject({ snapshotNodeCount: 2, snapshotEdgeCount: 1 });
    expectNoAuthority(report); expect(input).toEqual(before);
  });

  test("finite nonsafe numbers remain lossless metric data, while integer slots and numeric guards stay strict", () => {
    const input = makePreparedB();
    Object.assign(input.proposalEvidence.result.lineageSidecar.communities[0]!.conductance, {
      known: true, value: 1, numerator: 1e20, denominator: 1e20,
    });
    refreshEvidence(input);
    const before = structuredClone(input), decoded = decodePreparedGraphV3(input);
    expect(decoded.ok).toBe(true); if (decoded.ok) expect<unknown>(decoded.value).toEqual(before);
    const report = inspectPreparedGraphV3(input);
    expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]); expectNoAuthority(report);
    const unsafeInteger = makePreparedA(); unsafeInteger.partition.modularity = { known: true, value: 1e20 };
    expectShapeFailure(decodePreparedGraphV3, unsafeInteger);
    for (const badNumerator of [NaN, Infinity, -Infinity, -0, -1]) {
      const bad = makePreparedB();
      Object.assign(bad.proposalEvidence.result.lineageSidecar.communities[0]!.conductance, { known: true, value: 1, numerator: badNumerator, denominator: 1 });
      expectShapeFailure(decodePreparedGraphV3, bad);
    }
    for (const badValue of [-0, -0.1, 1.1]) {
      const bad = makePreparedB();
      Object.assign(bad.proposalEvidence.result.lineageSidecar.communities[0]!.conductance, { known: true, value: badValue });
      expectShapeFailure(decodePreparedGraphV3, bad);
    }
    expect(input).toEqual(before);
  });

  test("historical previous partitions allow adopted=true, including authoritative history", () => {
    const input = makePreparedB(), old = makeProposalResult(makePartition("B"));
    old.partition.adopted = true;
    // Historical lossless metrics share the schema's number, not safe-integer,
    // transport domain; history still is not asserted content-admissible here.
    Object.assign(old.lineageSidecar.communities[0]!.conductance, { known: true, value: 1, numerator: 1e20, denominator: 1e20 });
    const withHistory = {
      ...input,
      proposalEvidence: {
        ...input.proposalEvidence,
        source: {
          ...input.proposalEvidence.source,
          previous: {
            partition: structuredClone(old.partition), sidecar: structuredClone(old.lineageSidecar), authoritative: old,
            binding: { version: "l4-previous-binding-1", evidenceFingerprint: null, receiptRef: null, status: "unverified" },
          },
        },
      },
    };
    const before = structuredClone(withHistory), decoded = decodePreparedGraphV3(withHistory);
    expect(decoded.ok).toBe(true); if (decoded.ok) expect<unknown>(decoded.value).toEqual(before);
    const report = inspectPreparedGraphV3(withHistory);
    expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]); expectNoAuthority(report);
    // This deliberately unverified history is not asserted coherent/admissible.
    expect(withHistory).toEqual(before);
  });

  test("root/result mismatch and corrupt evidence digest fail coherence, not decoding", () => {
    const mismatch = makePreparedB(); mismatch.partition.snapshotId = "snap:other";
    const corrupt = makePreparedB(); corrupt.proposalEvidence.evidenceFingerprint = "f".repeat(64);
    for (const input of [mismatch, corrupt]) {
      expect(decodePreparedGraphV3(input).ok).toBe(true);
      const report = inspectPreparedGraphV3(input);
      expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]);
      expect(report.coherent).toBe(false); expect(report.coherenceErrors.length).toBeGreaterThan(0); expectNoAuthority(report);
    }
    const report = inspectPreparedGraphV3(corrupt);
    expect(report.evidence.wellFormed).toBe(false); expect(report.evidence.admissible).toBe(false);
  });
});

describe("L8 adoption — untrusted references, historical inventory and UNKNOWN", () => {
  test("a nonempty forged HOST reference can decode but cannot establish adoption", () => {
    const input = makeAdoption(), before = structuredClone(input);
    expect(decodePartitionAdoptionV1(input).ok).toBe(true);
    const report = inspectPartitionAdoptionV1(input);
    expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]);
    expect(report.preparedBinding).toBe("not-requested");
    expect(report.evidence).toEqual({ status: "not-applicable-adoption", present: false, wellFormed: null, admissible: null });
    expectNoAuthority(report); expect(input).toEqual(before);
    // A raw localReceipt-shaped actor is not the closed HOST-reference actor.
    expectShapeFailure(decodePartitionAdoptionV1, { ...input, actor: { kind: "localReceipt", receiptRef: "local:synthetic", proposalPass: true } });
  });

  test("absent attempt/claim inventories remain UNKNOWN, not synthesized empty arrays", () => {
    const { attemptIds: attempts, claimIds: claims, ...unknownInventory } = makeInventory(); void attempts; void claims;
    const input = { ...makeAdoption(), inventory: [unknownInventory], quiescenceProofs: [makeProof()] }, before = structuredClone(input);
    const decoded = decodePartitionAdoptionV1(input);
    expect(decoded.ok).toBe(true); if (decoded.ok) expect<unknown>(decoded.value).toEqual(before);
    const unknownReport = inspectPartitionAdoptionV1(input);
    expect(unknownReport.wellFormed).toBe(true);
    expect(unknownReport.stats).toMatchObject({ inventoryUnitCount: 1, unknownAttemptInventoryCount: 1, unknownClaimInventoryCount: 1 });
    const known = { ...input, inventory: [{ ...unknownInventory, attemptIds: [], claimIds: [] }] };
    const knownReport = inspectPartitionAdoptionV1(known);
    expect(knownReport.wellFormed).toBe(true);
    expect(knownReport.stats).toMatchObject({ inventoryUnitCount: 1, attemptIdCount: 0, claimIdCount: 0, unknownAttemptInventoryCount: 0, unknownClaimInventoryCount: 0 });
    expectNoAuthority(unknownReport); expectNoAuthority(knownReport); expect(input).toEqual(before);
  });

  test("adoption counters are raw inventory counts, not distinct IDs or performance", () => {
    const input = makeAdoption(), unit = makeInventory();
    unit.ownedFunctionIds = [F1, F1, F2]; unit.attemptIds = ["attempt:1", "attempt:1", "attempt:2"]; unit.claimIds = ["claim:1", "claim:1"];
    input.inventory.push(unit);
    const proof = makeProof(); proof.attemptIds = ["proof:attempt", "proof:attempt"]; proof.claimIds = ["proof:claim:1", "proof:claim:2", "proof:claim:3"];
    input.quiescenceProofs.push(proof);
    const report = inspectPartitionAdoptionV1(input);
    expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]);
    expect(report.stats).toMatchObject({ inventoryUnitCount: 1, quiescenceProofCount: 1, ownedFunctionIdCount: 3, attemptIdCount: 3, claimIdCount: 2, unknownAttemptInventoryCount: 0, unknownClaimInventoryCount: 0 });
    expectNoAuthority(report);
  });

  test("historical snapshot IDs and negative Q flags are transport data, never authenticated release", () => {
    const input = makeAdoption(), proof = makeProof(), unit = makeInventory();
    proof.quiescent = false; proof.released = false; proof.workerStillExecutable = true; proof.leaseHeld = true;
    unit.workerStillExecutable = true; unit.leaseHeld = true;
    input.inventory.push(unit); input.quiescenceProofs.push(proof);
    const before = structuredClone(input), decoded = decodePartitionAdoptionV1(input);
    expect(decoded.ok).toBe(true); if (decoded.ok) expect<unknown>(decoded.value).toEqual(before);
    const report = inspectPartitionAdoptionV1(input);
    expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]);
    expect(report.stats).toMatchObject({ inventoryUnitCount: 1, quiescenceProofCount: 1 });
    expectNoAuthority(report); expect(input).toEqual(before);
    expect(input.inventory[0]!.snapshotId).not.toBe(input.snapshotId);
  });

  test("nested attempts/claims retain historical snapshots and execution/lease flags", () => {
    const unit = makeInventory(); unit.attemptIds = ["attempt:1"]; unit.claimIds = ["claim:1"];
    const input = {
      ...makeAdoption(),
      inventory: [{ ...unit, attempts: [{ attemptId: "attempt:1", snapshotId: unit.snapshotId, workerStillExecutable: true }], claims: [{ claimId: "claim:1", snapshotId: unit.snapshotId, leaseHeld: true }] }],
    };
    const decoded = decodePartitionAdoptionV1(input);
    expect(decoded.ok).toBe(true); if (decoded.ok) expect<unknown>(decoded.value).toEqual(input);
    const report = inspectPartitionAdoptionV1(input);
    expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]); expectNoAuthority(report);
  });
});

describe("L8 adoption — optional prepared binding is documentary only", () => {
  test("matching identities/digests do not flip adopted, mutate either input or acquire authority", () => {
    const prepared = makePreparedA(), input = makeAdoption(prepared);
    const beforePrepared = structuredClone(prepared), beforeInput = structuredClone(input);
    const report = inspectPartitionAdoptionV1(input, prepared);
    expect(report.wellFormed).toBe(true); expect(report.preparedBinding).toBe("matched");
    expect(report.schemaErrors).toEqual([]); expectNoAuthority(report);
    expect(prepared).toEqual(beforePrepared); expect(input).toEqual(beforeInput); expect(prepared.partition.adopted).toBe(false);
  });

  test("invalid-prepared and mismatched bindings are distinguishable without shape rejection", () => {
    const prepared = makePreparedA(), input = makeAdoption(prepared);
    const invalid = inspectPartitionAdoptionV1(input, { ...prepared, schemaVersion: 2 });
    expect(invalid.wellFormed).toBe(true); expect(invalid.preparedBinding).toBe("invalid-prepared"); expectNoAuthority(invalid);
    for (const change of [
      (value: ReturnType<typeof makeAdoption>) => { value.partitionId = "part:other"; },
      (value: ReturnType<typeof makeAdoption>) => { value.lineageId = "lineage:other"; },
      (value: ReturnType<typeof makeAdoption>) => { value.snapshotId = "snap:other"; },
      (value: ReturnType<typeof makeAdoption>) => { value.snapshotFingerprint = "d".repeat(64); },
      (value: ReturnType<typeof makeAdoption>) => { value.configFingerprint = "d".repeat(64); },
      (value: ReturnType<typeof makeAdoption>) => { value.proposalFingerprint = "d".repeat(64); },
      (value: ReturnType<typeof makeAdoption>) => { value.observedDigest = "d".repeat(64); },
    ]) {
      const changed = makeAdoption(prepared); change(changed);
      expect(decodePartitionAdoptionV1(changed).ok).toBe(true);
      const report = inspectPartitionAdoptionV1(changed, prepared);
      expect(report.wellFormed).toBe(true); expect(report.schemaErrors).toEqual([]);
      expect(report.preparedBinding).toBe("mismatched"); expect(report.coherent).toBe(false); expectNoAuthority(report);
    }
  });

  test("malformed adoption has null stats and is never upgraded by a valid prepared object", () => {
    const prepared = makePreparedA(), report = inspectPartitionAdoptionV1({ ...makeAdoption(prepared), explicit: false }, prepared);
    expect(report.wellFormed).toBe(false); expect(report.coherent).toBe(false);
    expect(report.schemaErrors.length).toBeGreaterThan(0); expect(report.stats).toBeNull(); expectNoAuthority(report);
  });
});
