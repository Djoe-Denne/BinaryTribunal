import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canonical, fingerprint, hash, validateConfig } from "../src/validation";
import { assertSnapshotContract } from "../src/graph";
import { clusterGraph } from "../src/cluster";
import { Store } from "../src/store";
import { GraphStore, validateGraphDocument, type Admission, type PersistencePlan, type PersistenceSidecar } from "../src/graph-store";
import type { InputBundle, MissionConfig, Snapshot } from "../src/domain";
import type { ControllerAuthority } from "../src/unit-lease";
import { assertAdmissionBudgetBinding, evaluateReadiness, planMission, selectCompatible, selectReadyUnits, unitsConflict,
  type AdmissionBudgetContextV1, type AdmissionBudgetInputV1, type PlannerGraphInput, type PlannerGroupInput,
  type PlannerPolicy, type PlannerResult, type ResourceRequirement, type WorkUnit } from "../src/planner";

const MODULE = hash("admission-budget-test-module");
const MODE = "complete-admission-cap-v1" as const;
const RESOURCE: ResourceRequirement = { profiles: ["fixture-worker"], models: ["fixture/local#high"], tools: [],
  accounts: ["fixture-account"], slots: 1, cpu: 1, gpu: 0, budget: 1 };
const fn = (index: number) => `${MODULE}:0x${(index + 1).toString(16).toUpperCase()}`;
function graph(count = 1, calls: [number, number][] = []): PlannerGraphInput {
  return { schemaVersion: 1, snapshotId: "snapshot:admission-budget", missionId: "mission:admission-budget",
    normalizedFingerprint: hash("admission-budget-snapshot"), knowledgeRevision: 2,
    binaryArtifacts: [{ contentSha256: MODULE, versionLabel: "fixture-v1", imageBase: "0x400000" }],
    nodes: Array.from({ length: count }, (_, n) => ({ id: fn(n), moduleSha256: MODULE, rva: fn(n).split(":")[1]!,
      ea: `0x${(0x400001 + n).toString(16).toUpperCase()}`, imageBase: "0x400000", functionClass: "internal", status: "observed" })),
    edges: calls.map(([a, b], i) => ({ id: `edge:${i}`, sourceId: fn(a), destinationId: fn(b), kind: "direct_call", status: "observed",
      schedulerRelevance: "may_block", retiredInRevision: null })), unresolved: [],
    coverage: { status: "complete", selfLoopsPreserved: true, tailsIterated: true } };
}
function policy(g: PlannerGraphInput, partitionId = "partition:admission-budget"): PlannerPolicy {
  return { version: "planner-admission-test-v1", estimationVersion: "admission-estimates-v1", partitionId,
    investigationKind: "decompilation", artifactKind: "reconciled_c", publicationLevel: 1,
    contextEnvelopeMaxUtf8Bytes: 100_000, totalContextBudgetUtf8Bytes: 1_000_000, maxSelectedUnits: 100,
    sccMaxFunctions: 100, sccMaxIterations: 2, sccCostBudget: 10_000,
    requirementsByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { artifactId: `artifact:${n.id}`, artifactSha256: hash(`artifact:${n.id}`),
      functionId: n.id, moduleSha256: n.moduleSha256, artifactKind: "reconciled_c", minimumRevision: g.knowledgeRevision,
      maximumRevision: g.knowledgeRevision + 1, publicationLevel: 1, validation: "fixture-only" }])),
    estimatesByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { version: "admission-estimates-v1", A: 1, B: 1, R: 1, validation: 1 }])),
    resourcesByFunction: Object.fromEntries(g.nodes.map(n => [n.id, structuredClone(RESOURCE)])) };
}
function groups(g: PlannerGraphInput, p: PlannerPolicy, ids = g.nodes.map(n => n.id)): PlannerGroupInput[] {
  return ids.map(id => ({ groupId: `group:${id}`, partitionId: p.partitionId, ownedFunctionIds: [id], contextFunctionIds: [] }));
}
function context(g: PlannerGraphInput, p: PlannerPolicy): AdmissionBudgetContextV1 {
  return { version: "planner-admission-context-v1", missionId: g.missionId, snapshotId: g.snapshotId,
    snapshotFingerprint: g.normalizedFingerprint, partitionId: p.partitionId, knowledgeRevision: g.knowledgeRevision,
    missionConfigFingerprint: hash("current-config"), executionSpecFingerprint: hash("current-execution-spec"),
    inputManifestFingerprint: hash("current-input-manifest"), admissionCodecVersion: "fixture-complete-admission-v1", cycle: 1, budgetEpoch: 1 };
}
function allocation(g: PlannerGraphInput, c: AdmissionBudgetContextV1, bytes = 20_000): AdmissionBudgetInputV1 {
  const content: Omit<AdmissionBudgetInputV1, "fingerprint"> = { version: MODE, scope: "one-immutable-run",
    executionProfile: "one-execution-per-subintent-v1", context: structuredClone(c),
    capsByFunction: Object.fromEntries(g.nodes.map(n => [n.id, { completeBodyMaxUtf8Bytes: { known: true, value: bytes },
      maxNewExecutionsPerRole: { A: 1, B: 1, R: 1 } as const }])) };
  return { ...content, fingerprint: fingerprint(content) };
}
function budgeted(g = graph(), bytes = 20_000) {
  const p = policy(g); p.version = `${MODE}:test1`; p.admissionBudgetMode = MODE;
  const c = context(g, p); p.admissionBudget = allocation(g, c, bytes);
  return { graph: g, policy: p, context: c, groups: groups(g, p) };
}
type Scenario = ReturnType<typeof budgeted>;
const plan = (s: Scenario) => planMission(s.graph, s.groups, s.policy, s.context);
function rehashAllocation(p: PlannerPolicy): void {
  const { fingerprint: _old, ...content } = p.admissionBudget!; p.admissionBudget!.fingerprint = fingerprint(content);
}
function rehashDocuments(r: PlannerResult): void {
  const { fingerprint: _plan, ...pc } = r.plan; r.plan.fingerprint = fingerprint(pc);
  r.sidecar.planFingerprint = r.plan.fingerprint;
  const { fingerprint: _side, ...sc } = r.sidecar; r.sidecar.fingerprint = fingerprint(sc);
  const bc = { schemaVersion: 1 as const, planFingerprint: r.plan.fingerprint, sidecarFingerprint: r.sidecar.fingerprint };
  r.binding = { ...bc, fingerprint: fingerprint(bc) };
}
function ready(r: PlannerResult, c?: AdmissionBudgetContextV1, expected = r.binding.sidecarFingerprint) {
  return evaluateReadiness({ plan: r.plan, sidecar: r.sidecar, unit: r.units[0]!, receipts: [],
    expectedSidecarFingerprint: expected, snapshotFingerprint: r.sidecar.snapshotFingerprint,
    knowledgeRevision: r.plan.knowledgeRevision, validContext: true, cancelled: false, admissionBudgetContext: c });
}
const metrics = (r: PlannerResult, index = 0) => r.sidecar.admissionBudget!.byUnit[r.units[index]!.unitId]!;

describe("explicit, prospective complete-admission allocation", () => {
  test("legacy complete output is byte-exact, including an opaque version resembling the new prefix", () => {
    const g = graph(3, [[0, 1], [1, 0], [2, 0]]), p = policy(g), gs = groups(g, p);
    const ordinary = planMission(g, gs, p);
    // Generated from the pinned, accepted pre-change planner (SHA37723edf...).
    expect(hash(canonical(ordinary))).toBe("c3bc050cec422ef263c63a33bdf0cda898cc556461a932d96d1019f620a39a48");
    p.version = `${MODE}:legacy`;
    const prefixed = planMission(g, gs, p);
    expect(hash(canonical(prefixed))).toBe("9d962f5d21944364ad6ba145db481481e04272f88770b72f0c98768cf374bdab");
    expect(Object.hasOwn(prefixed.sidecar, "admissionBudget")).toBe(false);
    expect(Object.hasOwn(prefixed.sidecar.policy, "admissionBudgetMode")).toBe(false);
    expect(Object.isFrozen(prefixed)).toBe(true);
  });

  test("S remains the scientific measurement; C, N, T and total are separate commitments", () => {
    const s = budgeted(), before = canonical(s), r = plan(s);
    const legacy = structuredClone(s.policy); delete legacy.admissionBudget; delete legacy.admissionBudgetMode;
    const old = planMission(s.graph, s.groups, legacy), m = metrics(r);
    expect(m.structuralEnvelopeUtf8Bytes).toBe(old.sidecar.envelopeBytesByUnit[r.units[0]!.unitId]!);
    expect(m.admissionCapUtf8Bytes).toEqual({ known: true, value: 20_000 });
    expect(m.maxNewExecutions).toEqual({ known: true, value: 3 });
    expect(m.totalAdmissionUtf8Bytes).toEqual({ known: true, value: 60_000 });
    expect(r.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBe(60_000);
    expect(r.units).toEqual(old.units);
    expect(r.plan.planId).not.toBe(old.plan.planId);
    expect(canonical(s)).toBe(before);
    expect(Object.isFrozen(s.policy)).toBe(false); expect(Object.isFrozen(s.context)).toBe(false);
    expect(Object.isFrozen(m.admissionCapUtf8Bytes)).toBe(true); expect(Object.isFrozen(r.sidecar.policy.admissionBudget!.capsByFunction)).toBe(true);
    s.policy.admissionBudget!.capsByFunction[fn(0)]!.completeBodyMaxUtf8Bytes.value = 40_000;
    expect(metrics(r).admissionCapUtf8Bytes.value).toBe(20_000);
  });

  test("a declared cap below S yields C=S without rewriting scientific content", () => {
    const s = budgeted(graph(), 1), r = plan(s), m = metrics(r);
    expect(m.admissionCapUtf8Bytes.value).toBe(m.structuralEnvelopeUtf8Bytes);
    expect(m.totalAdmissionUtf8Bytes.value).toBe(m.structuralEnvelopeUtf8Bytes * 3);
    expect(r.units[0]!.estimatedCost.value).toBe(3);
  });

  test("new policy cannot be admitted by structural price then widened after selection", () => {
    const s = budgeted(); s.policy.totalContextBudgetUtf8Bytes = 20_000;
    const r = plan(s);
    expect(metrics(r).structuralEnvelopeUtf8Bytes).toBeLessThan(20_000);
    expect(r.plan.selectedUnitIds).toEqual([]);
    expect(r.plan.decisions.some(d => d.action === "exclude_budget")).toBe(true);
    expect(r.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBe(0);
  });

  test("JSON re-read uses real L1/L6 shapes and new readiness requires independent current context", () => {
    const s = budgeted(), r: PlannerResult = JSON.parse(canonical(plan(s)));
    const persistedPlan: PersistencePlan = r.plan, persistedSidecar: PersistenceSidecar = r.sidecar;
    expect(() => validateGraphDocument("mission-plan", persistedPlan)).not.toThrow();
    for (const u of r.units) expect(() => validateGraphDocument("work-unit", u)).not.toThrow();
    expect(persistedSidecar.envelopeBytesByUnit[r.units[0]!.unitId]).toBe(20_000);
    expect(() => assertAdmissionBudgetBinding(r.plan, r.sidecar, s.context)).not.toThrow();
    expect(ready(r, s.context).ready).toBe(true); expect(ready(r).ready).toBe(false);
    const selection = selectReadyUnits(r, { policy: "fifo", readyAtEvent: Object.fromEntries(r.units.map(u => [u.unitId, 0])),
      aging: { eventNumber: 1, quantum: 1, version: "fixture-v1" } },
      { receipts: [], expectedSidecarFingerprint: r.binding.sidecarFingerprint, snapshotFingerprint: r.sidecar.snapshotFingerprint,
        knowledgeRevision: r.plan.knowledgeRevision, validContext: true, cancelled: false, admissionBudgetContext: s.context },
      [{ workerId: "fixture-worker-1", profile: "fixture-worker", model: "fixture/local#high", tools: [], accountId: "fixture-account",
        slots: 1, cpu: 1, gpu: 0, budget: 100, available: true }], [{ accountId: "fixture-account", slots: 1, budget: 100 }], []);
    expect(selection.assignments).toHaveLength(1);
  });

  test("insertion/graph/group order does not change allocation planning bytes", () => {
    const s = budgeted(graph(3, [[0, 2], [1, 2]])), expected = canonical(plan(s));
    s.graph.nodes.reverse(); s.graph.edges.reverse(); s.groups.reverse();
    s.policy.admissionBudget!.capsByFunction = Object.fromEntries(Object.entries(s.policy.admissionBudget!.capsByFunction).reverse());
    rehashAllocation(s.policy);
    expect(canonical(plan(s))).toBe(expected);
  });
});

describe("admission input validation and scope", () => {
  test("new policy version respects L6's 32/33 UTF-16 boundary including BMP and astral suffixes", () => {
    for (const suffix of ["abcdef", "漢字漢字漢字", "💠💠💠"]) {
      const s = budgeted(); s.policy.version = `${MODE}:${suffix}`;
      expect(s.policy.version.length).toBe(32);
      const r = plan(s); expect(() => validateGraphDocument("mission-plan", r.plan)).not.toThrow();
      expect(() => assertAdmissionBudgetBinding(r.plan, r.sidecar, s.context)).not.toThrow();
      s.policy.version += "x";
      expect(s.policy.version.length).toBe(33); expect(() => plan(s)).toThrow(/32 UTF-16/);
    }
  });

  test("allocation/context without own explicit mode and mode without context are rejected", () => {
    const s = budgeted(); delete s.policy.admissionBudgetMode;
    expect(() => plan(s)).toThrow(/explicit admissionBudgetMode/);
    delete s.policy.admissionBudget;
    expect(() => plan(s)).toThrow(/explicit admissionBudgetMode/);
    s.policy.admissionBudgetMode = MODE;
    expect(() => planMission(s.graph, s.groups, s.policy)).toThrow(/independent current/);
    s.policy.version = "old-policy";
    expect(() => plan(s)).toThrow(/new admission policy version/);
    s.policy.version = `${MODE}: `;
    expect(() => plan(s)).toThrow(/new admission policy version/);
  });

  for (const mode of [undefined, null, "unknown", false, 1]) test(`mode ${String(mode)} cannot silently fall back`, () => {
    const s = budgeted(); Reflect.set(s.policy, "admissionBudgetMode", mode);
    expect(() => plan(s)).toThrow();
  });

  for (const key of Object.keys(context(graph(), policy(graph())))) test(`current context mismatch: ${key}`, () => {
    const s = budgeted(), old = Reflect.get(s.context, key);
    Reflect.set(s.context, key, typeof old === "number" ? old + 1 : key.endsWith("Fingerprint") ? hash(`changed:${key}`) : `${old}-changed`);
    expect(() => plan(s)).toThrow();
  });

  for (const key of ["missionId", "snapshotId", "snapshotFingerprint", "partitionId", "knowledgeRevision"] as const) test(`allocation and caller cannot override actual graph ${key}`, () => {
    const s = budgeted(), old = s.context[key];
    Reflect.set(s.context, key, typeof old === "number" ? old + 1 : key === "snapshotFingerprint" ? hash("another-graph") : `${old}-changed`);
    s.policy.admissionBudget!.context = structuredClone(s.context); rehashAllocation(s.policy);
    expect(() => plan(s)).toThrow(/graph\/partition\/revision/);
  });

  test("allocation and context reject future IDs, extra keys, bad version/scope/profile and digest drift", () => {
    for (const [key, value] of [["planId", "future-plan"], ["fingerprint", hash("wrong")], ["version", "v2"],
      ["scope", "all-runs"], ["executionProfile", "two-executions"]]) {
      const s = budgeted(); Reflect.set(s.policy.admissionBudget!, key!, value); expect(() => plan(s)).toThrow();
    }
    const s = budgeted(); Reflect.set(s.context, "preparedFingerprint", hash("future")); expect(() => plan(s)).toThrow(/keys/);
  });

  test("inherited fields/getters/proxies never supply a mode, cap or context and are not invoked", () => {
    let reads = 0;
    const inherited = budgeted(); delete inherited.policy.admissionBudgetMode;
    Object.setPrototypeOf(inherited.policy, { admissionBudgetMode: MODE });
    expect(() => plan(inherited)).toThrow(/inherited/);
    const modeGetter = budgeted(); Object.defineProperty(modeGetter.policy, "admissionBudgetMode", { enumerable: true, get() { reads++; return MODE; } });
    expect(() => plan(modeGetter)).toThrow(/accessor/);
    const capGetter = budgeted(); Object.defineProperty(capGetter.policy.admissionBudget!.capsByFunction, fn(0), { enumerable: true, get() { reads++; return {}; } });
    expect(() => plan(capGetter)).toThrow(/accessor/);
    const inheritedCaps = budgeted(); inheritedCaps.policy.admissionBudget!.capsByFunction = Object.create(inheritedCaps.policy.admissionBudget!.capsByFunction);
    expect(() => plan(inheritedCaps)).toThrow(/prototype/);
    const contextGetter = budgeted(); Object.defineProperty(contextGetter.context, "cycle", { enumerable: true, get() { reads++; return 1; } });
    expect(() => plan(contextGetter)).toThrow(/accessor/);
    const inheritedContext = budgeted(); Object.setPrototypeOf(inheritedContext.context, { future: true });
    expect(() => plan(inheritedContext)).toThrow(/prototype/);
    const proxy = budgeted(); proxy.context = new Proxy(proxy.context, { getPrototypeOf() { reads++; return Object.prototype; } });
    expect(() => plan(proxy)).toThrow(/JSON/);
    expect(reads).toBe(0);
  });

  test("non-JSON/cyclic/sparse data is rejected before clone, without mutating input", () => {
    const cycle: Record<string, unknown> = {}; cycle.self = cycle;
    for (const value of [new Date(), new Map(), new Set(), () => 1, undefined, 1n, Symbol("x"), cycle, new Array(2)]) {
      const s = budgeted(); Reflect.set(s.policy.admissionBudget!, "extra", value); expect(() => plan(s)).toThrow();
      expect(Object.isFrozen(s.policy)).toBe(false);
    }
  });

  for (const value of [0, -0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) test(`unsafe/nonpositive cap ${String(value)} is rejected`, () => {
    const s = budgeted(); s.policy.admissionBudget!.capsByFunction[fn(0)]!.completeBodyMaxUtf8Bytes.value = value;
    rehashAllocation(s.policy); expect(() => plan(s)).toThrow();
  });

  for (const value of [0, -0, 2, 0.5, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) test(`new execution count ${String(value)} is not the v1 one-execution profile`, () => {
    const s = budgeted(); Reflect.set(s.policy.admissionBudget!.capsByFunction[fn(0)]!.maxNewExecutionsPerRole, "A", value);
    rehashAllocation(s.policy); expect(() => plan(s)).toThrow();
  });

  test("missing/extra roles and unknown/ineligible function keys fail closed", () => {
    const extra = budgeted(); Reflect.set(extra.policy.admissionBudget!.capsByFunction[fn(0)]!.maxNewExecutionsPerRole, "explore", 1);
    rehashAllocation(extra.policy); expect(() => plan(extra)).toThrow(/keys/);
    const missing = budgeted(); Reflect.deleteProperty(missing.policy.admissionBudget!.capsByFunction[fn(0)]!.maxNewExecutionsPerRole, "R");
    rehashAllocation(missing.policy); expect(() => plan(missing)).toThrow(/keys/);
    const foreign = budgeted(); foreign.policy.admissionBudget!.capsByFunction[fn(2)] = structuredClone(foreign.policy.admissionBudget!.capsByFunction[fn(0)]!);
    rehashAllocation(foreign.policy); expect(() => plan(foreign)).toThrow(/unknown\/inadmissible/);
    const external = budgeted(graph(2)); external.graph.nodes[1]!.functionClass = "external";
    expect(() => plan(external)).toThrow(/unknown\/inadmissible/);
  });

  test("admissible caps outside the closure are accepted but never charged", () => {
    const s = budgeted(graph(2)); s.groups = groups(s.graph, s.policy, [fn(0)]);
    s.policy.admissionBudget!.capsByFunction[fn(1)]!.completeBodyMaxUtf8Bytes.value = 90_000; rehashAllocation(s.policy);
    const r = plan(s); expect(r.units).toHaveLength(1); expect(r.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBe(60_000);
  });

  for (const kind of ["allocation", "missing", "unknown"] as const) test(`${kind} allocation yields diagnostic unknown C/T, known N, never zero or S`, () => {
    const s = budgeted();
    if (kind === "allocation") delete s.policy.admissionBudget;
    else if (kind === "missing") { delete s.policy.admissionBudget!.capsByFunction[fn(0)]; rehashAllocation(s.policy); }
    else { s.policy.admissionBudget!.capsByFunction[fn(0)]!.completeBodyMaxUtf8Bytes = { known: false, value: null }; rehashAllocation(s.policy); }
    const r = plan(s), m = metrics(r);
    expect(m.admissionCapUtf8Bytes).toEqual({ known: false, value: null }); expect(m.totalAdmissionUtf8Bytes).toEqual({ known: false, value: null });
    expect(m.maxNewExecutions).toEqual({ known: true, value: 3 }); expect(m.structuralEnvelopeUtf8Bytes).toBeGreaterThan(0);
    expect(Object.hasOwn(r.sidecar.envelopeBytesByUnit, r.units[0]!.unitId)).toBe(false);
    expect(r.plan.units[0]!.contextEnvelopeUtf8Bytes).toEqual({ known: false, value: null });
    expect(r.plan.selectedUnitIds).toEqual([]); expect(r.diagnostics.some(d => d.code.startsWith("admission-"))).toBe(true);
    expect(() => validateGraphDocument("mission-plan", r.plan)).not.toThrow();
    expect(() => assertAdmissionBudgetBinding(r.plan, r.sidecar, s.context)).not.toThrow();
    expect(ready(r, s.context).ready).toBe(false);
  });

  test("known/null and unknown/non-null caps are not canonical unknowns", () => {
    for (const cap of [{ known: true, value: null }, { known: false, value: 0 }, { known: false, value: 1 }]) {
      const s = budgeted(); s.policy.admissionBudget!.capsByFunction[fn(0)]!.completeBodyMaxUtf8Bytes = cap;
      rehashAllocation(s.policy); expect(() => plan(s)).toThrow(/cap\/unknown/);
    }
  });
});

describe("C*N budget thresholds and whole mandatory closure", () => {
  const sample = { role: "R", text: 'café 漢字 "\\\n'.repeat(1500), metadata: { fixture: true } };
  const cap = Buffer.byteLength(canonical(sample), "utf8");
  for (const offset of [-1, 0, 1]) test(`UTF8 common cap ceiling C${offset >= 0 ? "+" : ""}${offset}`, () => {
    const s = budgeted(graph(), cap); s.policy.contextEnvelopeMaxUtf8Bytes = cap + offset;
    const r = plan(s); expect(metrics(r).admissionCapUtf8Bytes.value).toBe(cap);
    expect(r.plan.selectedUnitIds.length).toBe(offset < 0 ? 0 : 1);
    expect(cap).toBeGreaterThan(canonical(sample).length); expect(r.plan.budgets.nativeLineCharLimit).toBe(2000);
  });
  for (const offset of [-1, 0, 1]) test(`unique-body total T${offset >= 0 ? "+" : ""}${offset}`, () => {
    const s = budgeted(graph(), cap); s.policy.totalContextBudgetUtf8Bytes = cap * 3 + offset;
    expect(plan(s).plan.selectedUnitIds.length).toBe(offset < 0 ? 0 : 1);
  });

  test("caller closure prices required callee before include and rejects missing callee allocation", () => {
    const s = budgeted(graph(2, [[0, 1]]), 10_000); s.groups = groups(s.graph, s.policy, [fn(0)]);
    s.policy.totalContextBudgetUtf8Bytes = 60_000; expect(plan(s).plan.selectedUnitIds).toHaveLength(2);
    s.policy.totalContextBudgetUtf8Bytes--; expect(plan(s).plan.selectedUnitIds).toEqual([]);
    s.policy.totalContextBudgetUtf8Bytes++; delete s.policy.admissionBudget!.capsByFunction[fn(1)]; rehashAllocation(s.policy);
    const r = plan(s); expect(r.units).toHaveLength(2); expect(r.plan.selectedUnitIds).toEqual([]);
    expect(r.diagnostics.some(d => d.code === "admission-cap-missing" && d.functionIds.includes(fn(1)))).toBe(true);
  });

  test("shared/already-selected callees are charged once, with no partial consumer closure", () => {
    const s = budgeted(graph(3, [[0, 2], [1, 2]]), 10_000); s.groups = groups(s.graph, s.policy, [fn(0), fn(1)]);
    s.policy.totalContextBudgetUtf8Bytes = 90_000;
    const r = plan(s); expect(r.plan.selectedUnitIds).toHaveLength(3); expect(r.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBe(90_000);
    s.policy.totalContextBudgetUtf8Bytes--;
    const limited = plan(s); expect(limited.plan.selectedUnitIds).toHaveLength(2); expect(limited.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBe(60_000);
    for (const p of limited.plan.prerequisites) if (limited.plan.selectedUnitIds.includes(p.consumerUnitId)) expect(limited.plan.selectedUnitIds).toContain(p.producerUnitId!);
  });

  test("SCC caps use max owned cap, N counts sub-intents once across all passes; context is not charged", () => {
    const s = budgeted(graph(3, [[0, 1], [1, 0]])); s.groups = [{ groupId: "scc-root", partitionId: s.policy.partitionId,
      ownedFunctionIds: [fn(0)], contextFunctionIds: [fn(2)] }];
    s.policy.admissionBudget!.capsByFunction[fn(1)]!.completeBodyMaxUtf8Bytes.value = 30_000;
    s.policy.admissionBudget!.capsByFunction[fn(2)]!.completeBodyMaxUtf8Bytes.value = 90_000; rehashAllocation(s.policy);
    s.policy.totalContextBudgetUtf8Bytes = 180_000;
    const r = plan(s), u = r.units[0]!; expect(r.units).toHaveLength(1); expect(u.ownedFunctionIds).toHaveLength(2);
    expect(u.contextFunctionIds).toEqual([fn(2)]); expect(u.subIntents).toHaveLength(6);
    expect(r.sidecar.localOrders[u.unitId]!.maxIterations).toBe(2);
    expect(metrics(r).admissionCapUtf8Bytes.value).toBe(30_000); expect(metrics(r).maxNewExecutions.value).toBe(6);
    expect(metrics(r).totalAdmissionUtf8Bytes.value).toBe(180_000); expect(r.plan.selectedUnitIds).toHaveLength(1);
    s.policy.totalContextBudgetUtf8Bytes--; expect(plan(s).plan.selectedUnitIds).toEqual([]);
    s.policy.totalContextBudgetUtf8Bytes++; s.policy.admissionBudget!.capsByFunction[fn(1)]!.completeBodyMaxUtf8Bytes = { known: false, value: null };
    rehashAllocation(s.policy); const unknown = plan(s); expect(unknown.plan.selectedUnitIds).toEqual([]); expect(metrics(unknown).maxNewExecutions.value).toBe(6);
  });

  test("singleton self-loop and nonrecursive multi-function family keep honest N", () => {
    const loop = budgeted(graph(1, [[0, 0]])); const r = plan(loop);
    expect(r.plan.sccs[0]!.hasSelfLoop).toBe(true); expect(metrics(r).maxNewExecutions.value).toBe(3);
    const s = budgeted(graph(3)); s.groups = [{ groupId: "aggregate", partitionId: s.policy.partitionId,
      ownedFunctionIds: [fn(0), fn(1)], contextFunctionIds: [fn(2)] }];
    const aggregate = plan(s); expect(aggregate.units).toHaveLength(1); expect(metrics(aggregate).maxNewExecutions.value).toBe(6);
    expect(aggregate.units[0]!.subIntents.every(sub => sub.functionId !== fn(2))).toBe(true);
  });

  test("C*N safe boundary is exact; product overflow keeps C/N known and T unknown", () => {
    const cap = Math.floor(Number.MAX_SAFE_INTEGER / 3), s = budgeted(graph(), cap);
    s.policy.contextEnvelopeMaxUtf8Bytes = Number.MAX_SAFE_INTEGER; s.policy.totalContextBudgetUtf8Bytes = Number.MAX_SAFE_INTEGER;
    const r = plan(s); expect(metrics(r).totalAdmissionUtf8Bytes.value).toBe(cap * 3); expect(r.plan.selectedUnitIds).toHaveLength(1);
    s.policy.admissionBudget!.capsByFunction[fn(0)]!.completeBodyMaxUtf8Bytes.value!++; rehashAllocation(s.policy);
    const overflow = plan(s); expect(overflow.plan.selectedUnitIds).toEqual([]); expect(metrics(overflow).admissionCapUtf8Bytes.value).toBe(cap + 1);
    expect(metrics(overflow).maxNewExecutions.value).toBe(3); expect(metrics(overflow).totalAdmissionUtf8Bytes).toEqual({ known: false, value: null });
    expect(overflow.diagnostics.some(d => d.code === "admission-budget-overflow")).toBe(true);
    expect(() => assertAdmissionBudgetBinding(overflow.plan, overflow.sidecar, s.context)).not.toThrow();
  });

  test("closure sum is rejected before unsafe addition, including the MAX_SAFE_INTEGER boundary", () => {
    const cap = Math.floor(Number.MAX_SAFE_INTEGER / 6), s = budgeted(graph(2, [[0, 1]]), cap);
    s.groups = groups(s.graph, s.policy, [fn(0)]); s.policy.contextEnvelopeMaxUtf8Bytes = Number.MAX_SAFE_INTEGER;
    s.policy.totalContextBudgetUtf8Bytes = cap * 6;
    const r = plan(s); expect(r.plan.selectedUnitIds).toHaveLength(2); expect(r.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBe(cap * 6);
    s.policy.totalContextBudgetUtf8Bytes--; expect(plan(s).plan.selectedUnitIds).toEqual([]);
    s.policy.totalContextBudgetUtf8Bytes = Number.MAX_SAFE_INTEGER;
    for (const entry of Object.values(s.policy.admissionBudget!.capsByFunction)) entry.completeBodyMaxUtf8Bytes.value = Math.floor(Number.MAX_SAFE_INTEGER / 3);
    rehashAllocation(s.policy); const overflow = plan(s); expect(overflow.plan.selectedUnitIds).toEqual([]);
    expect(overflow.sidecar.admissionBudget!.selectedTotalAdmissionUtf8Bytes).toBe(0);
  });
});

describe("new document binding, old identities and claims", () => {
  test("stripping/rehashing mode or metadata never passes the original frozen expected binding", () => {
    const s = budgeted(), original = plan(s);
    for (const strip of ["mode", "accounting", "allocation", "all"] as const) {
      const r = structuredClone(original);
      if (strip === "mode" || strip === "all") delete r.sidecar.policy.admissionBudgetMode;
      if (strip === "accounting" || strip === "all") delete r.sidecar.admissionBudget;
      if (strip === "allocation" || strip === "all") delete r.sidecar.policy.admissionBudget;
      rehashDocuments(r);
      expect(ready(r, s.context, original.binding.sidecarFingerprint).ready).toBe(false);
      expect(ready(r, undefined, original.binding.sidecarFingerprint).ready).toBe(false);
      expect(() => assertAdmissionBudgetBinding(r.plan, r.sidecar, s.context)).toThrow();
    }
    const unknown = structuredClone(original); Reflect.set(unknown.sidecar.policy, "admissionBudgetMode", "unknown"); rehashDocuments(unknown);
    expect(ready(unknown, s.context, original.binding.sidecarFingerprint).ready).toBe(false);
  });

  for (const field of ["structuralEnvelopeUtf8Bytes", "admissionCapUtf8Bytes", "maxNewExecutions", "totalAdmissionUtf8Bytes", "selectedTotal", "exposedPlanCap", "exposedSidecarCap", "allocationFingerprint", "byUnitExtra"] as const) test(`rehashed accounting drift is rejected: ${field}`, () => {
    const s = budgeted(), r = structuredClone(plan(s)), m = metrics(r), accounting = r.sidecar.admissionBudget!;
    if (field === "structuralEnvelopeUtf8Bytes") m.structuralEnvelopeUtf8Bytes = 21_000;
    else if (field === "selectedTotal") accounting.selectedTotalAdmissionUtf8Bytes++;
    else if (field === "exposedPlanCap") r.plan.units[0]!.contextEnvelopeUtf8Bytes.value!++;
    else if (field === "exposedSidecarCap") r.sidecar.envelopeBytesByUnit[r.units[0]!.unitId]!++;
    else if (field === "allocationFingerprint") accounting.allocationFingerprint = hash("wrong-allocation");
    else if (field === "byUnitExtra") accounting.byUnit["unit:extra"] = structuredClone(m);
    else m[field].value!++;
    rehashDocuments(r); expect(() => assertAdmissionBudgetBinding(r.plan, r.sidecar, s.context)).toThrow();
    expect(ready(r, s.context).ready).toBe(false);
  });

  test("new allocation/epoch produces new documents, not a widening of an old plan or a new family", () => {
    const s = budgeted(), old = plan(s); s.context.budgetEpoch++;
    s.policy.admissionBudget!.context = structuredClone(s.context); s.policy.admissionBudget!.capsByFunction[fn(0)]!.completeBodyMaxUtf8Bytes.value = 40_000;
    rehashAllocation(s.policy); const next = plan(s);
    expect(next.plan.planId).not.toBe(old.plan.planId); expect(next.plan.fingerprint).not.toBe(old.plan.fingerprint);
    expect(next.sidecar.fingerprint).not.toBe(old.sidecar.fingerprint); expect(next.binding.fingerprint).not.toBe(old.binding.fingerprint);
    expect(next.units).toEqual(old.units); expect(next.units[0]!.conflicts).toEqual(old.units[0]!.conflicts);
    expect(unitsConflict(next.units[0]!, old.units[0]!)).toBe(true);
    for (const state of ["RUNNING", "QUARANTINED"] as const) {
      const selected = selectCompatible([{ unit: next.units[0]!, readiness: ready(next, s.context), requirements: RESOURCE }],
        [{ workerId: "fixture-worker", profile: "fixture-worker", model: "fixture/local#high", tools: [], accountId: "fixture-account", slots: 1, cpu: 1, gpu: 0, budget: 10, available: true }],
        [{ accountId: "fixture-account", slots: 1, budget: 10 }],
        [{ unit: { ...old.units[0]!, state }, familyLeaseKey: `family:${old.units[0]!.unitId}`, planId: old.plan.planId, workerMayStillRun: true }]);
      expect(selected.assignments).toEqual([]); expect(selected.rejected[0]!.reason).toMatch(/old plans/);
    }
    const widened = structuredClone(next); widened.plan.planId = old.plan.planId; widened.sidecar.planId = old.plan.planId; rehashDocuments(widened);
    expect(() => assertAdmissionBudgetBinding(widened.plan, widened.sidecar, s.context)).toThrow(/plan identity changed/);
  });
});

function fixtureInputs(sub: WorkUnit["subIntents"][number]): InputBundle {
  return { schemaVersion: 1, role: sub.role, cycle: 1, identity: structuredClone(sub.harnessIdentity), files: [], accessibleRules: [], requiredTools: [],
    knowledge: { version: "l5-fixture-inputs-v1", fingerprint: hash("fixture-known-inputs"), leadsFingerprint: fingerprint([]), files: [] } };
}
function fixtureAdmission(missionId: string, unit: WorkUnit, role: "A" | "B", prompt: string): Admission {
  const sub = unit.subIntents.find(s => s.role === role)!, executionId = `fixture:${unit.unitId}:${role}`, attemptId = `attempt:${executionId}`;
  const inputs = fixtureInputs(sub), inputFingerprint = fingerprint(inputs), model = { providerID: "fixture", id: "local", variant: "high" };
  const taskId = `task:${executionId}`, resultHeader = { schemaVersion: 1, missionId, taskId, executionId, attemptId, cycle: 1,
    authorId: executionId, identity: sub.harnessIdentity, inputFingerprint, inputVersions: [], previousResultIds: [] };
  return { executionId, attemptId, role, subIntentId: sub.subIntentId, idempotencyKey: executionId,
    command: { taskId, attemptId, executionId, idempotencyKey: executionId, profile: "fixture-worker", model, prompt,
      dossier: { version: 1, functionId: sub.functionId, function: sub.harnessIdentity, role, cycle: 1, effectiveModel: model, inputs, resultHeader },
      metadata: { inputFingerprint }, context: { mode: "fresh" }, worktree: false, requiredAccess: [] } };
}

test("real L6 public APIs freeze/reopen new allocation and guard C-1/C/C+1 complete bodies without dispatch", () => {
  const temp = join(process.env.TEMP || tmpdir(), "opencode"); mkdirSync(temp, { recursive: true });
  const directory = mkdtempSync(join(temp, "l5-admission-budget-")), database = join(directory, "own.db");
  let store: Store | undefined, graphStore: GraphStore | undefined;
  try {
    const snapshot = assertSnapshotContract(JSON.parse(readFileSync(join(import.meta.dir, "fixtures/graph/isolates/content.json"), "utf8")));
    const clustered = clusterGraph(snapshot, { algorithm: "historical-cc" }), base = policy(snapshot, clustered.partition.partitionId);
    const gs = groups(snapshot, base), legacy = planMission(snapshot, gs, base), u = legacy.units[0]!;
    const model = { providerID: "fixture", id: "local", variant: "high" };
    const config: MissionConfig = validateConfig({ schemaVersion: 1, missionId: snapshot.missionId,
      binary: { sha256: snapshot.binaryArtifacts[0]!.contentSha256, version: snapshot.binaryArtifacts[0]!.versionLabel }, fixture: true,
      evaluation: { method: "fixture", version: "v1", maxDifficulty: 100 }, subsetSize: 1, maxCycles: 1, stagnationLimit: 1,
      models: { explore: model, evaluate: model, A: model, B: model, R: model }, knowledge: fixtureInputs(u.subIntents[0]!).knowledge,
      commonInputs: [], accessibleRules: [], requiredTools: [], outputDirectory: join(directory, "output") });
    const mission: Snapshot = { schemaVersion: 1, missionId: config.missionId, revision: 0, config, status: "running", cycle: 1, stage: "explore",
      candidates: [], cycles: [], intents: [], reconciliations: [], noProgressCycles: 0 };
    const prompt = 'café 漢字 "\\\n'.repeat(1500) + "x", exact = fixtureAdmission(config.missionId, u, "A", prompt);
    const cap = Buffer.byteLength(canonical(exact), "utf8"), p = structuredClone(base);
    p.version = `${MODE}:l6v1`; p.admissionBudgetMode = MODE;
    p.contextEnvelopeMaxUtf8Bytes = cap + 1000; p.totalContextBudgetUtf8Bytes = cap * 3;
    const c = context(snapshot, p); c.missionConfigFingerprint = fingerprint(config); c.inputManifestFingerprint = fingerprint(config.commonInputs);
    c.executionSpecFingerprint = fingerprint({ fixture: true, profiles: RESOURCE.profiles, models: config.models, newExecutionsPerSubIntent: 1 });
    p.admissionBudget = allocation(snapshot, c, cap);
    const r = planMission(snapshot, gs, p, c);
    expect(metrics(r).structuralEnvelopeUtf8Bytes).toBeLessThan(cap); expect(r.plan.selectedUnitIds).toEqual([u.unitId]);
    expect(r.units[0]!.subIntents).toEqual(u.subIntents);
    store = new Store(database); store.create(mission);
    const authority: ControllerAuthority = { lease: store.acquireLease(config.missionId, "l5-fixture-controller", 10, 100_000), now: 11 };
    graphStore = new GraphStore(database); graphStore.putSnapshot(authority, { ...snapshot }); graphStore.putPartition(authority, { ...clustered.partition });
    for (const candidate of r.units) graphStore.addUnit(authority, candidate);
    expect(graphStore.freezePlan(authority, r.plan, r.sidecar, r.binding)).toBe(1);
    graphStore.close(); graphStore = undefined; store.close(); store = undefined;
    store = new Store(database); graphStore = new GraphStore(database);
    expect(store.load(config.missionId).config.fixture).toBe(true);
    const event = graphStore.events.read(config.missionId).find(e => e.kind === "plan_frozen")!;
    const stored: Pick<PlannerResult, "plan" | "sidecar" | "binding"> = JSON.parse(canonical(event.payload));
    const frozen = { plan: stored.plan, sidecar: stored.sidecar, binding: stored.binding };
    expect(canonical(frozen)).toBe(canonical({ plan: r.plan, sidecar: r.sidecar, binding: r.binding }));
    expect(() => assertAdmissionBudgetBinding(frozen.plan, frozen.sidecar, c)).not.toThrow();
    expect(graphStore.reservationExpectation(config.missionId).bindingFingerprint).toBe(r.binding.fingerprint);
    expect(graphStore.freezePlan(authority, frozen.plan, frozen.sidecar, frozen.binding, 1)).toBe(1);
    graphStore.transition(authority, u.unitId, "READY", "offline fixture readiness after frozen allocation readback");
    const lease = graphStore.reserve(authority, u.unitId, 1000, graphStore.reservationExpectation(config.missionId));
    for (const sub of u.subIntents.filter(s => s.role === "A" || s.role === "B")) graphStore.freezeAdmissionInputs(authority, lease, sub.subIntentId, fixtureInputs(sub));
    const oversized = fixtureAdmission(config.missionId, u, "A", prompt + "x"), smaller = fixtureAdmission(config.missionId, u, "B", prompt.slice(0, -1));
    expect(Buffer.byteLength(canonical(oversized), "utf8")).toBe(cap + 1); expect(Buffer.byteLength(canonical(smaller), "utf8")).toBe(cap - 1);
    const cursor = graphStore.events.cursor(config.missionId), activeGraphStore = graphStore;
    expect(() => activeGraphStore.prepareAdmission(authority, lease, oversized)).toThrow(/complete admission exceeds frozen unit\/plan UTF-8 byte budget/);
    expect(graphStore.admission(oversized.executionId)).toBeNull(); expect(graphStore.events.cursor(config.missionId)).toEqual(cursor);
    expect(graphStore.prepareAdmission(authority, lease, exact)).toBe(fingerprint(exact));
    expect(graphStore.prepareAdmission(authority, lease, smaller)).toBe(fingerprint(smaller));
    expect(graphStore.admission(exact.executionId)).toMatchObject({ state: "PREPARED", attempts: 0 });
    // Repeating the identical body is idempotent; this does not claim L8's
    // future durable cross-generation N=1 enforcement or any scientific gate.
    const preparedCursor = graphStore.events.cursor(config.missionId);
    expect(graphStore.prepareAdmission(authority, lease, exact)).toBe(fingerprint(exact));
    expect(graphStore.events.cursor(config.missionId)).toEqual(preparedCursor);
    expect(graphStore.events.read(config.missionId).some(e => ["admission_sending", "result_retained", "publication_requested"].includes(e.kind))).toBe(false);
  } finally {
    graphStore?.close(); store?.close();
    console.log(`[l5-admission-budget fixture retained; no submit/publication] ${database}`);
  }
});
