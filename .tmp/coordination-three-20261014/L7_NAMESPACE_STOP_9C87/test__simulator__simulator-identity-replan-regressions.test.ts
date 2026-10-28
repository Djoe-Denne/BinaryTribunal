import { describe, expect, test } from "bun:test";
import { buildGraphSnapshot, type GraphParts } from "../../src/graph-normalize";
import { planMission, type AdmissionBudgetContextV1, type AdmissionBudgetInputV1, type PlannerPolicy } from "../../src/planner";
import { canonical, fingerprint, hash } from "../../src/validation";
import { SimEngine, SimError, runScenario, simPlanFromExport, validateSimPlan,
  type SimConfig, type SimIncident, type SimPlanInput, type SimRunResult, type SimScenario } from "../../src/simulator";

// Synthetic records, not extracted/native facts. No old helpers or SIM-derived oracle.
const moduleHash = hash("namespace-regressions:synthetic-module"), evidenceHash = hash("namespace-regressions:synthetic-records");
const addr = (n: number) => `0x${n.toString(16).toUpperCase()}`;
const provenance = (siteRva: string | null = null) => ({ moduleSha256: moduleHash, siteRva,
  siteKind: siteRva === null ? "extractor" as const : "instruction" as const, xrefType: siteRva === null ? "none" as const : "code" as const,
  source: "synthetic-memory-fixture", sourceVersion: "1", sourceHash: evidenceHash, evidenceSha256: evidenceHash });
function config(): SimConfig {
  return { controllerId: "fixture-controller", workers: Array.from({ length: 4 }, () => ({ profile: "build", model: "fixture", accountId: "offline", slots: 1, cpu: 1, gpu: 0, budget: 10 })),
    accountCapacities: { offline: { slots: 4, budget: 40 } }, leaseTicks: 40, heartbeatEvery: 5,
    validationTicks: 1, maxAttempts: 4, maxTicks: 300, policy: "event_driven", recordTrace: true };
}
function exported(options: { edge?: boolean; need?: boolean; deferred?: boolean; external?: boolean; uncited?: boolean; shared?: boolean; completeBudget?: "known" | "unknown" } = {}) {
  const nodes: GraphParts["nodes"] = [0x21A0, 0x21C0, 0x21E0].map((rva, i) => ({ schemaVersion: 1, id: `${moduleHash}:${addr(rva)}`,
    moduleSha256: moduleHash, rva: addr(rva), ea: addr(0x400000 + rva), imageBase: "0x400000", name: `fixture-${i}`, observedDescription: "synthetic, not native evidence",
    boundaries: [{ ordinal: 0, rva: addr(rva), endRvaExclusive: addr(rva + 16), role: "entry" }], sizeBytes: { known: true, value: 16 },
    instructionCount: { known: false, value: null }, basicBlockCount: { known: false, value: null }, functionClass: options.external && i === 1 ? "external" : "internal",
    status: "observed", semanticMaturity: "none", analysisRefs: [], byteAgreement: "unknown", admissibleAsOracle: false,
    byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null } }));
  const [caller, callee, context] = nodes.map(n => n.id) as [string, string, string];
  const { snapshot } = buildGraphSnapshot({ missionId: "namespace-fixture", snapshotId: "namespace-snapshot", knowledgeRevision: 1,
    artifacts: [{ schemaVersion: 1, artifactId: "synthetic-module", moduleName: "fixture.bin", contentSha256: moduleHash, versionLabel: "fixture-v1", format: "unknown", architecture: "unknown",
      imageBase: "0x400000", idbIdentity: "fixture:no-idb", sections: [], provenance: provenance(), analysisVersion: "fixture-v1", extractorVersion: "fixture-v1" }], nodes,
    edges: options.edge === false ? [] : [{ schemaVersion: 1, id: "fixture-call", sourceId: caller, destinationId: callee, kind: "direct_call", direction: "source_to_destination",
      sites: [{ siteRva: "0x21A4", xrefType: "code", provenance: provenance("0x21A4") }], status: "observed", confidence: "high", appearedInRevision: 1, retiredInRevision: null, schedulerRelevance: "may_block" }],
    objects: [], unresolved: options.uncited ? [{ schemaVersion: 1, id: "fixture-unresolved", fromFunctionId: caller, siteRva: "0x21A8", kind: "indirect_call", target: "register",
      referencedObjectId: null, fabricatedFunction: false, provenance: provenance("0x21A8") }] : [], capabilities: [],
    scopeDescription: "synthetic namespace fixture", coverage: { status: "partial", uncoveredReason: "not native coverage", tailsIterated: true, selfLoopsPreserved: true },
    toolVersions: { extractor: "fixture-v1", extractorHash: evidenceHash, normalizer: "normalizer-v1" }, configFingerprint: hash("fixture-config") });
  const policy: PlannerPolicy = { version: "namespace-policy-v1", estimationVersion: "cost-v1", partitionId: "fixture-partition", investigationKind: "decompilation", artifactKind: "reconciled_c", publicationLevel: 1,
    contextEnvelopeMaxUtf8Bytes: 100_000, totalContextBudgetUtf8Bytes: 1_000_000, maxSelectedUnits: options.deferred ? 0 : 10, sccMaxFunctions: 4, sccMaxIterations: 1, sccCostBudget: 1000,
    requirementsByFunction: options.need === false ? {} : { [callee]: { artifactId: "callee-c", artifactSha256: hash("callee-c-content"), functionId: callee, moduleSha256: moduleHash,
      artifactKind: "reconciled_c", minimumRevision: 1, maximumRevision: 100, publicationLevel: 1, validation: "fixture-only" } },
    estimatesByFunction: Object.fromEntries(nodes.map(n => [n.id, { version: "cost-v1", A: 2, B: 2, R: 1, validation: 1 }])),
    resourcesByFunction: Object.fromEntries(nodes.map(n => [n.id, { profiles: ["build"], models: ["fixture"], accounts: ["offline"], tools: [], slots: 1, cpu: 1, gpu: 0, budget: 1 }])),
    ...(options.shared ? { extraConflictsByFunction: Object.fromEntries(nodes.slice(0, 2).map(n => [n.id, [{ id: "fixture-shared", kind: "exclusive_write" as const, resourceKey: "shared", withUnitId: null }]])) } : {}) };
  let budgetContext: AdmissionBudgetContextV1 | undefined;
  if (options.completeBudget) {
    budgetContext = { version: "planner-admission-context-v1", missionId: snapshot.missionId, snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint,
      partitionId: policy.partitionId, knowledgeRevision: snapshot.knowledgeRevision, missionConfigFingerprint: hash("fixture-mission-config"), executionSpecFingerprint: hash("fixture-execution-spec"),
      inputManifestFingerprint: hash("fixture-manifest"), admissionCodecVersion: "fixture-codec-v1", cycle: 1, budgetEpoch: 1 };
    const allocation: Omit<AdmissionBudgetInputV1, "fingerprint"> = { version: "complete-admission-cap-v1", scope: "one-immutable-run", executionProfile: "one-execution-per-subintent-v1", context: budgetContext,
      capsByFunction: Object.fromEntries(nodes.slice(0, 2).map(n => [n.id, { completeBodyMaxUtf8Bytes: options.completeBudget === "known" ? { known: true, value: 90_000 } : { known: false, value: null },
        maxNewExecutionsPerRole: { A: 1, B: 1, R: 1 } }])) };
    policy.admissionBudgetMode = "complete-admission-cap-v1"; policy.admissionBudget = { ...allocation, fingerprint: fingerprint(allocation) };
  }
  const result = planMission(snapshot, nodes.slice(0, options.external ? 1 : 2).map((n, i) => ({ groupId: `group-${i}`, partitionId: policy.partitionId, ownedFunctionIds: [n.id], contextFunctionIds: [context] })), policy, budgetContext);
  const plan = simPlanFromExport(result), consumer = plan.units.find(u => u.ownedFunctionIds.includes(caller))!.unitId;
  const producer = plan.units.find(u => u.ownedFunctionIds.includes(callee))?.unitId;
  const scenario: SimScenario = { plan, config: config(), durations: { A: 2, B: 2, R: 1 } };
  return { result, plan, consumer, producer, scenario };
}
function replaceStrings(value: unknown, replacements: Array<[string, string]>): unknown {
  if (typeof value === "string") { for (const [from, to] of replacements) value = (value as string).split(from).join(to); return value; }
  if (Array.isArray(value)) return value.map(v => replaceStrings(v, replacements));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, replaceStrings(v, replacements)]));
  return value;
}
function altered(plan: SimPlanInput, replacements: Array<[string, string]>) {
  const copy = replaceStrings(plan, replacements) as SimPlanInput;
  copy.source!.prerequisiteEvidence = structuredClone(plan.source!.prerequisiteEvidence);
  return copy;
}
function rejects(plan: SimPlanInput) {
  let diagnostics: ReturnType<typeof validateSimPlan> = [];
  expect(() => { diagnostics = validateSimPlan(plan); }).not.toThrow();
  expect(diagnostics.length).toBeGreaterThan(0);
  try { new SimEngine({ plan, config: config(), durations: { A: 2, B: 2, R: 1 } }); throw new Error("expected qualified refusal"); }
  catch (error) { expect(error).toBeInstanceOf(SimError); expect((error as SimError).code).toBe("plan_non_conformant"); }
}
const state = (r: Pick<SimRunResult, "units">, id: string) => r.units.find(u => u.unitId === id)!;
const commitTick = (r: SimRunResult, id: string) => r.trace.find(e => e.ev === "committed" && e.unitId === id)?.t;

describe("L7 archived namespace closure", () => {
  test("evidence v2 keeps the real complete MissionPlan detached and frozen", () => {
    const f = exported(), evidence = f.plan.source!.prerequisiteEvidence!;
    expect(evidence.version).toBe(2);
    const document = (evidence as unknown as { planDocument: unknown }).planDocument;
    expect(document).toEqual(f.result.plan); expect(document).not.toBe(f.result.plan); expect(Object.isFrozen(document)).toBe(true);
    expect(validateSimPlan(f.plan)).toEqual([]); expect(runScenario(f.scenario).metrics.committedUnits).toBe(2);
  });
  test("coherent consumer aliases and legal-shaped foreign IDs cannot erase a known need", () => {
    for (const suffix of [":alias", "foreign"]) {
      const f = exported(), old = f.plan.units.find(u => u.unitId === f.consumer)!.prerequisites[0]!;
      const next = suffix === "foreign" ? `unit:${hash("unarchived-consumer")}` : f.consumer + suffix;
      const nextPre = `pre:${fingerprint({ relationVersion: 1, relationId: old.relationId, consumerUnitId: next })}`;
      const plan = altered(f.plan, [[f.consumer, next], [old.id!, nextPre]]);
      delete plan.units.find(u => u.unitId === next)!.prerequisites[0]!.requirement;
      expect(canonical(plan.source!.prerequisiteEvidence)).toBe(canonical(f.plan.source!.prerequisiteEvidence)); rejects(plan);
    }
  });
  test("producer and requirement-free prerequisite namespaces are also archived", () => {
    const f = exported(); rejects(altered(f.plan, [[f.producer!, `unit:${hash("unarchived-producer")}`]]));
    for (const need of [true, false]) {
      const f = exported({ need }), pre = f.plan.units.find(u => u.unitId === f.consumer)!.prerequisites[0]!;
      const relationId = `relation:${hash("unarchived-relation")}`, id = `pre:${fingerprint({ relationVersion: 1, relationId, consumerUnitId: f.consumer })}`;
      const plan = altered(f.plan, [[pre.relationId!, relationId], [pre.id!, id]]);
      delete plan.units.find(u => u.unitId === f.consumer)!.prerequisites[0]!.requirement; rejects(plan);
    }
  });
  test("coherent requirement-free prerequisite deletion is not a manual plan", () => {
    const f = exported({ need: false }), plan = structuredClone(f.plan);
    plan.units.forEach(u => { u.prerequisites = []; }); plan.source!.prerequisites = []; plan.g1Edges = [];
    rejects(plan);
  });
  test("archive covers deferred units and owned/context membership, not only selected IDs", () => {
    const f = exported({ deferred: true }); expect(f.plan.selectedUnitIds).toEqual([]); expect(validateSimPlan(f.plan)).toEqual([]);
    const missing = structuredClone(f.plan); missing.units = []; missing.source!.prerequisites = []; missing.g1Edges = []; rejects(missing);
    for (const field of ["ownedFunctionIds", "contextFunctionIds"] as const) {
      const plan = structuredClone(exported({ edge: false }).plan); plan.units[0]![field] = [`${moduleHash}:0x9000`]; rejects(plan);
    }
  });
  test("structural copies cannot jointly rewrite the archived plan", () => {
    const mutations: Array<(p: SimPlanInput) => void> = [
      p => { p.planId += "-other"; }, p => { p.missionId += "-other"; },
      p => { p.knowledgeRevision++; p.source!.knowledgeRevision++; p.units.forEach(u => u.knowledgeRevision++); },
      p => { p.source!.policyVersion += "-other"; }, p => { p.source!.estimationVersion += "-other"; },
      p => { p.selectedUnitIds = []; p.decisions = p.decisions!.map(d => ({ ...d, action: "defer" })); },
      p => { p.decisions![0]!.reason = "changed"; }, p => { p.g2Conflicts = []; },
      p => { p.budgets.contextEnvelopeMaxUtf8Bytes++; },
      p => { p.g1Edges.push({ ...p.g1Edges[0]!, kind: "optional" }); },
      p => { p.units[0]!.requiredPublicationLevel = 2; },
    ];
    for (const mutate of mutations) { const plan = structuredClone(exported().plan); mutate(plan); rejects(plan); }
  });
  test("normalized projected views accept permutations and omit non-exposed G1/G2 fields", () => {
    const plan = structuredClone(exported().plan); plan.units.reverse(); plan.selectedUnitIds!.reverse(); plan.decisions!.reverse();
    plan.g1Edges = plan.g1Edges.map(e => ({ fromUnitId: e.fromUnitId, toUnitId: e.toUnitId, kind: e.kind, callSourceFunctionId: e.callSourceFunctionId, callDestinationFunctionId: e.callDestinationFunctionId }));
    plan.g2Conflicts = plan.g2Conflicts.map(c => ({ id: c.id, resourceKey: c.resourceKey })).reverse();
    expect(validateSimPlan(plan)).toEqual([]); expect(runScenario({ plan, config: config(), durations: { A: 2, B: 2, R: 1 } }).metrics.committedUnits).toBe(2);
  });
  test("missing, legacy and malformed evidence are qualified refusals, never TypeErrors", () => {
    for (const value of [undefined, null, {}, { version: 1 }, { version: 2 }]) {
      const plan = structuredClone(exported().plan); plan.source!.prerequisiteEvidence = value as never; rejects(plan);
    }
    const legacy = structuredClone(exported().plan), e = legacy.source!.prerequisiteEvidence! as unknown as Record<string, unknown>;
    e.version = 1; delete e.planDocument; const { fingerprint: _ignored, ...content } = e; e.fingerprint = fingerprint(content); rejects(legacy);
    for (const document of [null, {}, { units: null }, { units: [null], prerequisites: [] }]) {
      const plan = structuredClone(exported().plan); (plan.source!.prerequisiteEvidence! as unknown as Record<string, unknown>).planDocument = document; rejects(plan);
    }
    const missing = structuredClone(exported().plan); delete missing.source!.prerequisiteEvidence;
    expect(validateSimPlan(missing).some(d => d.code === "unsupported_prerequisite_provenance")).toBe(true);
    const noSource = structuredClone(exported().plan); delete noSource.source; rejects(noSource);
  });
  test("archive body and own-only index domains remain bound even after self-rehash", () => {
    const edits: Array<(e: Record<string, unknown>) => void> = [
      e => { (e.planDocument as { missionId: string }).missionId += "-tampered"; },
      e => { e.unitFingerprints = {}; }, e => { (e.unitFingerprints as Record<string, string>)[`unit:${hash("foreign")}`] = hash("opaque"); },
      e => { (e.requirementById as Record<string, unknown>)[`pre:${hash("foreign")}`] = {}; },
      e => { (e.unresolvedById as Record<string, unknown>)[`pre:${hash("foreign")}`] = {}; },
    ];
    for (const edit of edits) {
      const plan = structuredClone(exported().plan), e = plan.source!.prerequisiteEvidence! as unknown as Record<string, unknown>;
      // The old reader lacks planDocument; absence is a behavioral failure, not a TypeError oracle.
      expect(e.planDocument).toBeDefined(); edit(e); const { fingerprint: _ignored, ...content } = e; e.fingerprint = fingerprint(content); rejects(plan);
    }
    const plan = structuredClone(exported().plan), evidence = plan.source!.prerequisiteEvidence!;
    evidence.unitFingerprints = Object.create(evidence.unitFingerprints) as Record<string, string>; rejects(plan);
  });
  test("local absent/hash/field needs block only C and are not substituted from archive", () => {
    for (const mutation of ["absent", "hash", "field"]) {
      const f = exported(), plan = structuredClone(f.plan), before = canonical(plan.source), pre = plan.units.find(u => u.unitId === f.consumer)!.prerequisites[0]!;
      if (mutation === "absent") delete pre.requirement;
      else if (mutation === "hash") pre.requirement!.artifactSha256 = hash("different");
      else pre.requirement!.artifactKind = "structural_fact";
      expect(validateSimPlan(plan)).toEqual([]); const r = runScenario({ ...f.scenario, plan });
      expect(commitTick(r, f.producer!)).toBe(4); expect(state(r, f.consumer).state).toBe("BLOCKED"); expect(state(r, f.consumer).attempts).toBe(0); expect(canonical(plan.source)).toBe(before);
    }
  });
  test("true manual and true export without original needs remain legal", () => {
    expect(runScenario(exported({ need: false }).scenario).metrics.committedUnits).toBe(2);
    const plan: SimPlanInput = { planId: "manual", missionId: "manual", knowledgeRevision: 1, budgets: { contextEnvelopeMaxUtf8Bytes: 100_000, nativeLineCharLimit: 2000 }, g2Conflicts: [],
      g1Edges: [{ fromUnitId: "P", toUnitId: "C", kind: "obligatory", callSourceFunctionId: "fn-C", callDestinationFunctionId: "fn-P" }],
      units: ["P", "C"].map(unitId => ({ unitId, ownedFunctionIds: [`fn-${unitId}`], contextFunctionIds: [], investigationKind: "decompilation", requiredPublicationLevel: 1, knowledgeRevision: 1, conflicts: [],
        prerequisites: unitId === "P" ? [] : [{ producerUnitId: "P", kind: "obligatory", requiredPublicationLevel: 1, dispensed: false }] })) };
    expect(runScenario({ plan, config: config(), durations: { A: 2, B: 2, R: 1 } }).metrics.committedUnits).toBe(2);
  });
  test("cited unknown and genuinely uncited provenance v1 stay distinct", () => {
    const cited = exported({ external: true }), pre = cited.plan.units[0]!.prerequisites[0]!;
    expect(pre.kind).toBe("unknown_unresolved"); expect(pre.relationId).toBeDefined(); expect(pre.provenance).toBeUndefined(); expect(validateSimPlan(cited.plan)).toEqual([]);
    const uncited = exported({ edge: false, uncited: true }), raw = uncited.plan.units.flatMap(u => u.prerequisites).find(p => p.provenance)!;
    expect(raw.provenance!.version).toBe(1); expect(raw.relationId).toBeUndefined(); expect(validateSimPlan(uncited.plan)).toEqual([]);
  });
  test("real L5 complete-body allocation is not reconstructed from structural size", () => {
    const f = exported({ completeBudget: "known" });
    for (const u of f.plan.units) {
      const accounting = f.result.sidecar.admissionBudget!.byUnit[u.unitId]!;
      expect(accounting.structuralEnvelopeUtf8Bytes).toBeLessThan(90_000);
      expect(accounting.admissionCapUtf8Bytes.value).toBe(90_000); expect(u.allocatedEnvelopeUtf8Bytes).toBe(90_000);
    }
    expect(validateSimPlan(f.plan)).toEqual([]); expect(runScenario(f.scenario).metrics.committedUnits).toBe(2);
    const unknown = exported({ completeBudget: "unknown" }); expect(unknown.plan.selectedUnitIds).toEqual([]);
    expect(unknown.plan.units.every(u => u.allocatedEnvelopeUtf8Bytes === undefined)).toBe(true); expect(validateSimPlan(unknown.plan)).toEqual([]);
  });
  test("duplicate and additional archived namespaces fail independently of selection", () => {
    for (const kind of ["duplicate-unit", "duplicate-pre", "source-duplicate", "foreign-unit"]) {
      const plan = structuredClone(exported().plan);
      if (kind === "duplicate-unit") plan.units.push(structuredClone(plan.units[0]!));
      if (kind === "duplicate-pre") { const u = plan.units.find(u => u.prerequisites.length)!; u.prerequisites.push(structuredClone(u.prerequisites[0]!)); }
      if (kind === "source-duplicate") plan.source!.prerequisites.push(structuredClone(plan.source!.prerequisites[0]!));
      if (kind === "foreign-unit") {
        const u = structuredClone(plan.units.find(u => !u.prerequisites.length)!); u.unitId = `unit:${hash("new-owner")}`; u.ownedFunctionIds = [`${moduleHash}:0x9100`];
        u.subIntents = undefined; u.conflicts = []; plan.units.push(u); plan.selectedUnitIds!.push(u.unitId);
        plan.decisions!.push({ id: "new-decision", unitId: u.unitId, action: "include", reason: "forged additional owner" });
      }
      rejects(plan);
    }
  });
});

function independent(shared = false) {
  const f = exported({ edge: false, need: false, shared }), [a, b] = f.plan.units.map(u => u.unitId).sort() as [string, string];
  const scenario: SimScenario = { ...f.scenario, durations: new Map([[a, { A: 7, B: 6, R: 2 }], [b, { A: 23, B: 19, R: 1 }]]) };
  return { scenario, a, b };
}
type HardKind = "new_dependency" | "new_scc" | "invalidate_knowledge";
const hard = (kind: HardKind, a: string, b: string, atTick: number): SimIncident => kind === "new_dependency" ? { kind, consumerUnitId: a, producerUnitId: b, atTick } : { kind, unitIds: [a], atTick };
const stop = (unitId: string, atTick: number, retry = true): SimIncident => ({ kind: "stop_confirmed", unitId, atTick, retry });
const adopt = (unitId: string, atTick: number): SimIncident => ({ kind: "partition_adoption", unitIds: [unitId], atTick });
const cancel = (unitId: string, atTick: number): SimIncident => ({ kind: "cancel", unitId, atTick });

describe("L7 monotone new-plan obligation", () => {
  for (const kind of ["new_dependency", "new_scc", "invalidate_knowledge"] as const) {
    test(`${kind}: stop proves release, never authorizes a fresh generation`, () => {
      for (const retry of [false, true]) {
        const { scenario: s, a, b } = independent(); s.incidents = [hard(kind, a, b, 2), stop(a, 3, retry), stop(a, 4, true)];
        const r = runScenario(s); expect(state(r, a).attempts).toBe(1); expect(commitTick(r, a)).toBeUndefined(); expect(commitTick(r, b)).toBe(25);
        expect(r.metrics.reworkAttempts).toBe(0); expect(r.metrics.occupiedWorkerTicks).toBe(49);
        expect(r.trace.filter(e => e.unitId === a && e.ev === "execution_released").map(e => e.occupiedTicks)).toEqual([3, 3]);
        expect(r.decisions.filter(d => d.unitId === a).map(d => d.token)).toEqual([1]);
      }
    });
    test(`${kind}: invalidation survives a prior legal retry and later operational cause`, () => {
      const { scenario: s, a, b } = independent(); s.incidents = [cancel(a, 1), stop(a, 2), hard(kind, a, b, 4), cancel(a, 4), stop(a, 5), adopt(a, 6), stop(a, 7)];
      const r = runScenario(s); expect(state(r, a).attempts).toBe(2); expect(commitTick(r, a)).toBeUndefined(); expect(commitTick(r, b)).toBe(25); expect(r.metrics.reworkAttempts).toBe(1);
    });
    test(`${kind}: pre-admission, READY and blocked consumers cannot be revived`, () => {
      for (const atTick of [0, 2]) {
        const { scenario: s, a, b } = independent(); s.incidents = [{ kind: "pause", fromTick: 0, toTick: 6 }, hard(kind, a, b, atTick), cancel(a, 3), stop(a, 4), adopt(a, 5)];
        const r = runScenario(s); expect(state(r, a).attempts).toBe(0); expect(commitTick(r, a)).toBeUndefined(); expect(commitTick(r, b)).toBe(31);
      }
      const f = exported(); f.scenario.incidents = [hard(kind, f.consumer, f.producer!, 1), stop(f.consumer, 2)];
      const r = runScenario(f.scenario); expect(state(r, f.consumer).attempts).toBe(0); expect(commitTick(r, f.producer!)).toBe(4); expect(commitTick(r, f.consumer)).toBeUndefined();
    });
  }
  test("partition adoption lets the eligible current attempt finish, forbids the next", () => {
    const first = independent(); first.scenario.incidents = [adopt(first.a, 2)];
    expect(commitTick(runScenario(first.scenario), first.a)).toBe(10);
    const second = independent(); second.scenario.incidents = [adopt(second.a, 2), cancel(second.a, 4), stop(second.a, 5)];
    const r = runScenario(second.scenario); expect(state(r, second.a).attempts).toBe(1); expect(commitTick(r, second.a)).toBeUndefined(); expect(commitTick(r, second.b)).toBe(25);
  });
  test("HARD dominates adoption in both orders and at equal ticks", () => {
    for (const kind of ["new_dependency", "new_scc", "invalidate_knowledge"] as const) for (const reverse of [false, true]) for (const same of [false, true]) {
      const { scenario: s, a, b } = independent(), pair = [adopt(a, 2), hard(kind, a, b, same ? 2 : 3)];
      if (reverse) { pair.reverse(); if (!same) { (pair[0] as { atTick: number }).atTick = 2; (pair[1] as { atTick: number }).atTick = 3; } }
      s.incidents = [...pair, stop(a, 4), adopt(a, 5), stop(a, 6)];
      const r = runScenario(s); expect(state(r, a).attempts).toBe(1); expect(commitTick(r, a)).toBeUndefined(); expect(commitTick(r, b)).toBe(25);
    }
  });
  test("adoption never reauthorizes an already fenced or cancelled attempt", () => {
    for (const when of [0, 2]) {
      const { scenario: s, a, b } = independent(); s.incidents = [cancel(a, when), adopt(a, when + 1), stop(a, when + 2)];
      const r = runScenario(s); expect(state(r, a).attempts).toBe(when === 0 ? 0 : 1); expect(commitTick(r, a)).toBeUndefined(); expect(commitTick(r, b)).toBe(25);
    }
  });
  test("ordinary cancel/ambiguous stop/lease still allow retry after confirmed release", () => {
    for (const kind of ["cancel", "ambiguous_stop", "lease_expired_worker_active"] as const) {
      const { scenario: s, a, b } = independent(); s.incidents = [kind === "ambiguous_stop" ? { kind, unitId: a, atTick: 2, confirmWindow: 1 } : { kind, unitId: a, atTick: 2 }, stop(a, 3)];
      const r = runScenario(s); expect(state(r, a).attempts).toBe(2); expect(commitTick(r, a)).toBe(13); expect(commitTick(r, b)).toBe(25); expect(r.metrics.reworkAttempts).toBe(1);
    }
  });
  test("operational G2 overlap retry waits for the other actual holder", () => {
    const { scenario: s, a, b } = independent(); s.incidents = [{ kind: "new_conflict", unitIdA: a, unitIdB: b, resourceKey: "new-key", atTick: 2 }, stop(a, 3), stop(b, 5, false)];
    const r = runScenario(s); expect(r.decisions.filter(d => d.unitId === a).map(d => d.t)).toEqual([0, 5]); expect(commitTick(r, a)).toBe(15);
  });
  test("fencing retains live jobs/claims, then stop or real done releases the waiting peer", () => {
    for (const confirmed of [false, true]) {
      const { scenario: s, a, b } = independent(true); s.incidents = [hard("invalidate_knowledge", a, b, 2), ...(confirmed ? [stop(a, 4)] : [])];
      const engine = new SimEngine(s); engine.runUntil(2); const before = engine.observe(), frozen = canonical(before);
      expect(state(before, a).state).toBe("STOP_PENDING"); expect(state(before, b).attempts).toBe(0); expect(before.metrics.occupiedWorkerTicks).toBe(4);
      expect(before.trace.some(e => e.ev === "execution_released")).toBe(false);
      const r = engine.run(); expect(state(r, a).attempts).toBe(1); expect(commitTick(r, a)).toBeUndefined(); expect(state(r, b).dispatchTick).toBe(confirmed ? 4 : 7);
      expect(r.metrics.occupiedWorkerTicks).toBe((confirmed ? 8 : 13) + 43); expect(canonical(before)).toBe(frozen);
      expect(r.traceHash).toBe(runScenario(s).traceHash);
    }
  });
  test("validation and response-loss callbacks cannot revive a hard-invalidated generation", () => {
    for (const responseLost of [false, true]) {
      const { scenario: s, a, b } = independent(true); s.durations = { A: 1, B: 1, R: 1 }; s.config.validationTicks = 5;
      s.incidents = [...(responseLost ? [{ kind: "response_lost" as const, unitId: a, reconcileAfter: 10 }] : []), hard("new_scc", a, b, 3), stop(a, 6), adopt(a, 7)];
      const engine = new SimEngine(s); engine.runUntil(3); expect(state(engine.observe(), a).state).toBe("QUARANTINED"); expect(state(engine.observe(), b).attempts).toBe(0);
      const r = engine.run(); expect(state(r, a).attempts).toBe(1); expect(commitTick(r, a)).toBeUndefined(); expect(state(r, b).dispatchTick).toBe(6);
    }
  });
  test("adoption with no new admission preserves active phase and delayed R occupation", () => {
    const { scenario: s, a, b } = independent(true); s.durations = { A: 1, B: 1, R: 1 };
    s.incidents = [adopt(a, 1), { kind: "late_result", unitId: a, delayTicks: 5 }];
    const r = runScenario(s); expect(commitTick(r, a)).toBe(8); expect(state(r, a).attempts).toBe(1); expect(state(r, b).dispatchTick).toBe(8);
  });
});
