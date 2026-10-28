import { expect, test } from "bun:test";
import { planMission } from "../../src/planner";
import { fingerprint } from "../../src/validation";
import {
  SimEngine, SimError, SIM_RESOURCE_MODEL, runScenario, simPlanFromExport, validateSimPlan,
  planShape, comparePolicies, captureReplayJournal, replayScenarioJournal,
  type SimPlanInput, type SimScenario, type SimDurations, type SimRunResult,
} from "../../src/simulator";
import { plannerFixture, scenario } from "./scenarios";

// Ratified copy-boundary contract. All fixtures have at most two units. No SQL,
// private engine access, timers, native services, or assertions derived from a
// replacement implementation. Pre-fix failures and pre-passing controls are both
// retained; the harness emits actual outcomes before asserting the contract.
const names: string[] = [];
let currentCase = "registration";
function evidence(event: string, data: Record<string, unknown>): void {
  console.log(`L7_COPY_EVIDENCE ${JSON.stringify({ case: currentCase, event, ...data })}`);
}
function errorView(error: unknown): { name: string; code: string | null; message: string } {
  return { name: error instanceof Error ? error.name : typeof error,
    code: error instanceof SimError ? error.code : null,
    message: error instanceof Error ? error.message.slice(0, 400) : String(error).slice(0, 400) };
}
function contractCase(name: string, body: () => void): void {
  names.push(name);
  test(name, () => {
    currentCase = name; evidence("case_start", {});
    try { body(); evidence("case_end", { status: "pass" }); }
    catch (error) { evidence("case_end", { status: "fail", error: errorView(error) }); throw error; }
  });
}
type Attempt<T> = { ok: true; value: T } | { ok: false; error: unknown };
function attempt<T>(action: () => T): Attempt<T> {
  try { return { ok: true, value: action() }; } catch (error) { return { ok: false, error }; }
}
function qualified<T>(outcome: Attempt<T>, code: "plan_non_conformant" | "invalid_config"): void {
  evidence("qualified_refusal", outcome.ok ? { accepted: true } : { accepted: false, error: errorView(outcome.error) });
  expect(outcome.ok).toBe(false);
  if (outcome.ok) return;
  expect(outcome.error).toBeInstanceOf(SimError);
  expect((outcome.error as SimError).code).toBe(code);
}
function accepted<T>(outcome: Attempt<T>): T {
  if (!outcome.ok) { evidence("unexpected_api_error", { error: errorView(outcome.error) }); throw outcome.error; }
  return outcome.value;
}
function config(): SimScenario["config"] {
  return { ...scenario(["fixture"], [], 4).config, maxTicks: 256 };
}
function manual(): SimScenario {
  const s = scenario(["P", "C"], [["C", "P"]], 4); s.config.maxTicks = 256; return s;
}
function fixture() {
  const inputs = plannerFixture(2, [[0, 1]]), result = planMission(inputs.graph, inputs.groups, inputs.policy);
  const exported = simPlanFromExport(result), plan = structuredClone(exported);
  expect(plan.units.length).toBe(2);
  const consumer = plan.units.find(u => u.prerequisites.length)!;
  const need = consumer.prerequisites[0]!, source = plan.source!;
  const s: SimScenario = { plan, config: config(), durations: { A: 2, B: 3, R: 1 } };
  return { result, exported, plan, s, need, source, consumer: consumer.unitId, producer: need.producerUnitId!,
    sourceBytes: JSON.stringify(source), sourceFingerprint: fingerprint(source) };
}
type Fixture = ReturnType<typeof fixture>;
function usePlan(f: Fixture, plan: SimPlanInput): void { f.plan = plan; f.s.plan = plan; }
function archiveUnchanged(f: Fixture): void {
  const byteExact = JSON.stringify(f.source) === f.sourceBytes, hashExact = fingerprint(f.source) === f.sourceFingerprint;
  evidence("archive_immutability", { byteExact, hashExact, fingerprint: f.sourceFingerprint });
  expect(byteExact).toBe(true); expect(hashExact).toBe(true);
}
function rememberCaller(f: Fixture): () => void {
  const bytes = JSON.stringify(f.plan), descriptor = Object.getOwnPropertyDescriptor(f.need, "id"), prototype = Object.getPrototypeOf(f.need);
  const frozen = [Object.isFrozen(f.plan), Object.isFrozen(f.need), Object.isFrozen(f.source), Object.isFrozen(f.s.config)];
  return () => {
    const byteExact = JSON.stringify(f.plan) === bytes;
    evidence("caller_immutability", { byteExact }); expect(byteExact).toBe(true);
    expect(Object.getOwnPropertyDescriptor(f.need, "id")).toEqual(descriptor);
    expect(Object.getPrototypeOf(f.need)).toBe(prototype);
    expect([Object.isFrozen(f.plan), Object.isFrozen(f.need), Object.isFrozen(f.source), Object.isFrozen(f.s.config)]).toEqual(frozen);
    archiveUnchanged(f);
  };
}
function observedRun(s: SimScenario): Attempt<SimRunResult> {
  const result = attempt(() => runScenario(s));
  evidence("run", result.ok ? { committedUnits: result.value.metrics.committedUnits, traceHash: result.value.traceHash,
    units: result.value.units.map(u => ({ unitId: u.unitId, state: u.state, attempts: u.attempts, dispatchTick: u.dispatchTick })) }
    : { error: errorView(result.error) });
  return result;
}
function inspectRefusal(f: Fixture, checkArchive = true) {
  const diagnostics = attempt(() => validateSimPlan(f.plan)), execution = observedRun(f.s);
  evidence("validation", diagnostics.ok ? { codes: diagnostics.value.map(d => d.code) } : { error: errorView(diagnostics.error) });
  if (checkArchive) archiveUnchanged(f);
  return { diagnostics, execution };
}
function assertRefusal(outcome: ReturnType<typeof inspectRefusal>): void {
  expect(outcome.diagnostics.ok).toBe(true);
  if (!outcome.diagnostics.ok) return;
  expect(outcome.diagnostics.value.length).toBeGreaterThan(0);
  qualified(outcome.execution, "plan_non_conformant");
}
function refused(f: Fixture, checkArchive = true): void { assertRefusal(inspectRefusal(f, checkArchive)); }
function published(f: Fixture, count: 1 | 2): SimRunResult {
  const diagnostics = attempt(() => validateSimPlan(f.plan)), result = observedRun(f.s);
  archiveUnchanged(f); expect(accepted(diagnostics)).toEqual([]);
  const r = accepted(result); expect(r.metrics.committedUnits).toBe(count);
  expect(r.units.find(u => u.unitId === f.producer)!.state).toBe("COMMITTED");
  const consumer = r.units.find(u => u.unitId === f.consumer)!;
  expect(consumer.state).toBe(count === 2 ? "COMMITTED" : "BLOCKED");
  expect(consumer.attempts).toBe(count === 2 ? 1 : 0);
  if (count === 1) expect(r.trace.some(e => e.ev === "committed" && e.unitId === f.consumer)).toBe(false);
  return r;
}
function inheritedId(f: Fixture): void {
  const id = f.need.id; delete f.need.id; Object.setPrototypeOf(f.need, { id });
}
function hiddenId(f: Fixture): void { Object.defineProperty(f.need, "id", { enumerable: false }); }
function publicRunRefusal(s: SimScenario, code: "plan_non_conformant" | "invalid_config"): void { qualified(observedRun(s), code); }

contractCase("C01 parent baseline: intact export publishes producer and consumer", () => {
  const f = fixture(), unchanged = rememberCaller(f); published(f, 2); unchanged();
});
contractCase("C02 parent missing local need: only producer publishes", () => {
  const f = fixture(); delete f.need.requirement; const unchanged = rememberCaller(f); published(f, 1); unchanged();
});
contractCase("C03 parent inherited ID plus missing need: qualified refusal before admission", () => {
  const f = fixture(); delete f.need.requirement; inheritedId(f); const unchanged = rememberCaller(f);
  const out = inspectRefusal(f); unchanged(); assertRefusal(out);
});
contractCase("C04 parent nonenumerable ID plus missing need: qualified refusal before admission", () => {
  const f = fixture(); delete f.need.requirement; hiddenId(f); const unchanged = rememberCaller(f);
  const out = inspectRefusal(f); unchanged(); assertRefusal(out);
});
contractCase("C05 contrary: clone-first inherited ID is already rejected", () => {
  const f = fixture(); delete f.need.requirement; inheritedId(f); usePlan(f, structuredClone(f.plan)); refused(f);
});
contractCase("C06 contrary: clone-first nonenumerable ID is already rejected", () => {
  const f = fixture(); delete f.need.requirement; hiddenId(f); usePlan(f, structuredClone(f.plan)); refused(f);
});
contractCase("C07 contrary: restoring only the own ID does not restore the local need", () => {
  const f = fixture(), id = f.need.id; delete f.need.requirement; inheritedId(f);
  Object.defineProperty(f.need, "id", { value: id, enumerable: true, writable: true, configurable: true }); published(f, 1);
});
contractCase("C08 changed local artifact hash blocks only its consumer", () => {
  const f = fixture(); f.need.requirement!.artifactSha256 = "0".repeat(64); published(f, 1);
});
contractCase("C09 changed local artifact kind blocks only its consumer", () => {
  const f = fixture(); f.need.requirement!.artifactKind = "structural_fact"; published(f, 1);
});

contractCase("C10 genuinely source-less manual v1 remains legal", () => {
  const s = manual(); expect(validateSimPlan(s.plan)).toEqual([]); expect(accepted(observedRun(s)).metrics.committedUnits).toBe(2);
});
contractCase("C11 genuinely source-less manual v2 remains legal", () => {
  const s = manual(); s.plan.projectionVersion = 2; s.plan.resourceSemantics = SIM_RESOURCE_MODEL;
  for (const u of s.plan.units) u.resources = { kind: "unrestricted" };
  expect(validateSimPlan(s.plan)).toEqual([]); expect(accepted(observedRun(s)).metrics.committedUnits).toBe(2);
});
contractCase("C12 manual own source undefined is still absence", () => {
  const s = manual(); s.plan.source = undefined;
  expect(Object.hasOwn(s.plan, "source")).toBe(true); expect(accepted(observedRun(s)).metrics.committedUnits).toBe(2);
});
contractCase("C13 supplied inherited source cannot disappear into manual", () => {
  const f = fixture(); delete f.need.requirement; delete f.plan.source; Object.setPrototypeOf(f.plan, { source: f.source }); refused(f);
});
contractCase("C14 supplied nonenumerable source cannot disappear into manual", () => {
  const f = fixture(); delete f.need.requirement; Object.defineProperty(f.plan, "source", { enumerable: false }); refused(f);
});
contractCase("C15 supplied source accessor is refused without calling its getter", () => {
  const f = fixture(); let calls = 0;
  Object.defineProperty(f.plan, "source", { enumerable: true, configurable: true, get: () => { calls++; return f.source; } });
  const out = inspectRefusal(f); evidence("getter_calls", { calls }); expect(calls).toBe(0); assertRefusal(out);
});
contractCase("C16 supplied null source is a qualified refusal", () => {
  const f = fixture(); f.plan.source = null as never; refused(f);
});
contractCase("C17 supplied empty source is a qualified refusal", () => {
  const f = fixture(); f.plan.source = {} as never; refused(f);
});
contractCase("C18 supplied archive v1 is refused without backfill", () => {
  const f = fixture(); f.source.prerequisiteEvidence!.version = 1 as never; refused(f, false);
});
contractCase("C19 supplied source without archive is refused without manual fallback", () => {
  const f = fixture(); delete f.source.prerequisiteEvidence; refused(f, false);
});

contractCase("C20 a hidden projected unit ID cannot survive only raw validation", () => {
  const f = fixture(); Object.defineProperty(f.plan.units[0]!, "unitId", { enumerable: false }); refused(f);
});
contractCase("C21 a hidden source prerequisite ID is not a valid copied namespace", () => {
  const f = fixture(); Object.defineProperty(f.source.prerequisites[0]!, "id", { enumerable: false }); refused(f, false);
});
contractCase("C22 a hidden requirement index entry is refused, not silently discarded", () => {
  const f = fixture(); Object.defineProperty(f.source.prerequisiteEvidence!.requirementById, f.need.id!, { enumerable: false }); refused(f, false);
});
contractCase("C23 inherited unit-fingerprint index entries are not own evidence", () => {
  const f = fixture(), e = f.source.prerequisiteEvidence!; e.unitFingerprints = Object.create(e.unitFingerprints); refused(f, false);
});
contractCase("C24 null-prototype indexes with the same own entries remain legal", () => {
  const f = fixture(), e = f.source.prerequisiteEvidence!;
  for (const index of [e.unitFingerprints, e.requirementById, e.unresolvedById, f.source.dispensations, f.source.externalReceipts]) Object.setPrototypeOf(index, null);
  published(f, 2);
});

contractCase("C25 unit array hole produces diagnostics, never an iterator TypeError", () => {
  const f = fixture(); delete f.plan.units[0]; refused(f);
});
contractCase("C26 prerequisite array hole produces a qualified refusal", () => {
  const f = fixture(); delete f.plan.units.find(u => u.unitId === f.consumer)!.prerequisites[0]; refused(f);
});
contractCase("C27 source prerequisite array hole produces a qualified refusal", () => {
  const f = fixture(); delete f.source.prerequisites[0]; refused(f, false);
});
contractCase("C28 selected-unit array hole produces a qualified refusal", () => {
  const f = fixture(); delete f.plan.selectedUnitIds![0]; refused(f);
});
contractCase("C29 sub-intent array hole produces a qualified refusal", () => {
  const f = fixture(); delete f.plan.units[0]!.subIntents![0]; refused(f);
});
contractCase("C30 inherited array index is not a dense own transport array", () => {
  const f = fixture(), first = f.plan.units[0], prototype = Object.create(Array.prototype);
  Object.defineProperty(prototype, "0", { value: first, enumerable: true }); delete f.plan.units[0]; Object.setPrototypeOf(f.plan.units, prototype); refused(f);
});
contractCase("C31 nonenumerable array index is refused before destructive copying", () => {
  const f = fixture(); Object.defineProperty(f.plan.units, "0", { enumerable: false }); refused(f);
});
contractCase("C32 null unit row is refused with diagnostics", () => {
  const f = fixture(); f.plan.units[0] = null as never; refused(f);
});
contractCase("C33 shared acyclic data alias is legal and caller-owned", () => {
  const f = fixture(), tools = ["cpu"];
  for (const u of f.plan.units) u.requiredTools = tools;
  published(f, 2); expect(Object.isFrozen(tools)).toBe(false); expect(f.plan.units[0]!.requiredTools).toBe(f.plan.units[1]!.requiredTools);
});
contractCase("C34 cyclic copied data is refused before recursive processing", () => {
  const f = fixture(); Object.defineProperty(f.plan, "cycle", { value: f.plan, enumerable: true }); refused(f);
});
contractCase("C35 deep acyclic data never leaks an unqualified native stack error", () => {
  const f = fixture(), root: Record<string, unknown> = {}; let cursor = root;
  for (let i = 0; i < 2048; i++) { const child = {}; cursor.next = child; cursor = child; }
  Object.defineProperty(f.plan, "deep", { value: root, enumerable: true });
  const diagnostics = attempt(() => validateSimPlan(f.plan)), execution = observedRun(f.s);
  expect(diagnostics.ok).toBe(true);
  if (execution.ok) expect(execution.value.metrics.committedUnits).toBe(2);
  else qualified(execution, "plan_non_conformant");
  archiveUnchanged(f); expect(Object.isFrozen(root)).toBe(false);
});

contractCase("C36 ID getter is refused without invoking it", () => {
  const f = fixture(), id = f.need.id; let calls = 0;
  Object.defineProperty(f.need, "id", { enumerable: true, configurable: true, get: () => { calls++; return id; } });
  const out = inspectRefusal(f); evidence("getter_calls", { calls }); expect(calls).toBe(0); assertRefusal(out);
});
contractCase("C37 throwing DTO getter is refused without invoking user code", () => {
  const f = fixture(); let calls = 0;
  Object.defineProperty(f.need, "id", { enumerable: true, configurable: true, get: () => { calls++; throw new Error("caller getter sentinel"); } });
  const out = inspectRefusal(f); evidence("getter_calls", { calls }); expect(calls).toBe(0); assertRefusal(out);
});
contractCase("C38 index getter is refused without materializing its returned graph", () => {
  const f = fixture(), e = f.source.prerequisiteEvidence!, original = e.requirementById; let calls = 0;
  Object.defineProperty(e, "requirementById", { enumerable: true, configurable: true, get: () => { calls++; return original; } });
  const out = inspectRefusal(f, false); evidence("getter_calls", { calls }); expect(calls).toBe(0); assertRefusal(out);
});
contractCase("C39 a noncloneable Proxy is qualified without a native DataCloneError escape", () => {
  const f = fixture(); usePlan(f, new Proxy(f.plan, {})); refused(f);
});
contractCase("C40 a function inside copied DTO data is a qualified refusal", () => {
  const f = fixture(); Object.defineProperty(f.plan, "nonTransportable", { value: () => 1, enumerable: true }); refused(f);
});
contractCase("C41 unused external scenario getter is never traversed", () => {
  const f = fixture(); let calls = 0;
  Object.defineProperty(f.s, "unconsumedExtra", { enumerable: true, get: () => { calls++; throw new Error("unconsumed envelope getter"); } });
  const out = observedRun(f.s); evidence("getter_calls", { calls }); expect(calls).toBe(0);
  expect(accepted(out).metrics.committedUnits).toBe(2); archiveUnchanged(f);
});

contractCase("C42 frozen exported data and intrinsic array length remain legal", () => {
  const f = fixture(); usePlan(f, f.exported); expect(Object.isFrozen(f.plan)).toBe(true); published(f, 2);
});
contractCase("C43 JSON data round-trip preserves deterministic execution", () => {
  const f = fixture(), baseline = accepted(observedRun(f.s)); usePlan(f, JSON.parse(JSON.stringify(f.plan)) as SimPlanInput);
  const copy = published(f, 2); expect(copy.traceHash).toBe(baseline.traceHash); expect(copy.metrics).toEqual(baseline.metrics);
});
contractCase("C44 custom prototype without inherited consumed fields is not blacklisted", () => {
  const f = fixture(); Object.setPrototypeOf(f.need, { unusedMetadata: "not an ID" }); published(f, 2);
});
contractCase("C45 UTF8 context data is preserved without normalizing caller bytes", () => {
  const s = manual(); for (const u of s.plan.units) u.contextManifestLines = ["é😀", "界", "line\r\nnext"];
  const bytes = JSON.stringify(s), a = accepted(observedRun(s)), b = accepted(observedRun(JSON.parse(bytes) as SimScenario));
  expect(a.metrics.committedUnits).toBe(2); expect(b.traceHash).toBe(a.traceHash); expect(JSON.stringify(s)).toBe(bytes);
});

contractCase("C46 duration object remains a legal public API", () => { published(fixture(), 2); });
contractCase("C47 duration Map agrees with the object API", () => {
  const f = fixture(), baseline = accepted(observedRun(f.s));
  f.s.durations = new Map(f.plan.units.map(u => [u.unitId, { A: 2, B: 3, R: 1 }]));
  expect(published(f, 2).traceHash).toBe(baseline.traceHash);
});
contractCase("C48 duration function is acquired once for each image unit", () => {
  const f = fixture(), baseline = accepted(observedRun(f.s)), calls: string[] = [], ids = f.plan.units.map(u => u.unitId);
  f.s.durations = id => { calls.push(id); return { A: 2, B: 3, R: 1 }; };
  expect(published(f, 2).traceHash).toBe(baseline.traceHash); expect(calls).toEqual(ids);
});
contractCase("C49 callback mutation of caller units config and incidents cannot alter the captured image", () => {
  const f = fixture(); f.s.incidents = []; const baseline = accepted(observedRun(f.s)), ids = f.plan.units.map(u => u.unitId), calls: string[] = [];
  f.s.durations = id => {
    calls.push(id);
    if (calls.length === 1) { f.plan.units.splice(0); f.s.config.workers.splice(0); f.s.incidents!.push({ kind: "cancel", atTick: 0, unitId: f.consumer }); }
    return { A: 2, B: 3, R: 1 };
  };
  const outcome = observedRun(f.s); evidence("duration_calls", { calls, expected: ids });
  const r = accepted(outcome); expect(r.traceHash).toBe(baseline.traceHash); expect(calls).toEqual(ids);
  // These writes belong to the callback above, not to the simulator.
  expect(f.plan.units).toEqual([]); expect(f.s.config.workers).toEqual([]); archiveUnchanged(f);
});
contractCase("C50 shared returned duration object is detached before the next callback", () => {
  const f = fixture(), values = new Map<string, SimDurations>(f.plan.units.map((u, i) => [u.unitId, { A: i + 2, B: i + 3, R: 1 }]));
  f.s.durations = values; const baseline = accepted(observedRun(f.s)), returned = { A: 0, B: 0, R: 0 };
  f.s.durations = id => Object.assign(returned, values.get(id)!);
  const engine = new SimEngine(f.s); returned.A = 99; returned.B = 99;
  expect(engine.run().traceHash).toBe(baseline.traceHash); expect(Object.isFrozen(returned)).toBe(false); archiveUnchanged(f);
});
contractCase("C51 callback failure is qualified as invalid_config", () => {
  const f = fixture(); f.s.durations = () => { throw new Error("duration callback sentinel"); }; publicRunRefusal(f.s, "invalid_config"); archiveUnchanged(f);
});
contractCase("C52 invalid plan never invokes a duration callback", () => {
  const f = fixture(); delete f.need.id; let calls = 0;
  f.s.durations = () => { calls++; return { A: 2, B: 3, R: 1 }; };
  refused(f); expect(calls).toBe(0);
});
contractCase("C53 observations and continuation neither recapture durations nor mutate caller", () => {
  const f = fixture(), baseline = accepted(observedRun(f.s)); let calls = 0; const returned = { A: 2, B: 3, R: 1 };
  f.s.durations = () => { calls++; return returned; }; const unchanged = rememberCaller(f), engine = new SimEngine(f.s);
  engine.runUntil(2); const observation = engine.observe(), text = JSON.stringify(observation);
  engine.observe(); const detached = structuredClone(observation); detached.units[0]!.state = "FAILED";
  expect(engine.run().traceHash).toBe(baseline.traceHash); expect(calls).toBe(2); expect(JSON.stringify(observation)).toBe(text);
  expect(Object.isFrozen(observation)).toBe(true); expect(Object.isFrozen(returned)).toBe(false); unchanged();
});

contractCase("C54 export acquisition refuses a getter without invoking it", () => {
  const f = fixture(), result = structuredClone(f.result), id = result.plan.planId; let calls = 0;
  Object.defineProperty(result.plan, "planId", { enumerable: true, configurable: true, get: () => { calls++; return id; } });
  const out = attempt(() => simPlanFromExport(result)); evidence("getter_calls", { calls }); expect(calls).toBe(0); qualified(out, "plan_non_conformant");
});
contractCase("C55 ordinary incorrect export fingerprint keeps its refusal stage", () => {
  const f = fixture(), result = structuredClone(f.result); result.plan.fingerprint = "0".repeat(64);
  const out = attempt(() => simPlanFromExport(result)); qualified(out, "plan_non_conformant");
  if (!out.ok) expect((out.error as Error).message).toContain("fingerprint");
});
contractCase("C56 public planShape uses the captured plan despite callback mutation", () => {
  const f = fixture(), expected = planShape(f.plan, { A: 2, B: 3, R: 1 }, 1), ids = f.plan.units.map(u => u.unitId), calls: string[] = [];
  expect(expected.criticalPathTicks).toBe(10);
  const actual = planShape(f.plan, id => {
    calls.push(id); for (const u of f.plan.units) { u.ownedFunctionIds.splice(0); u.subIntents = []; }
    return { A: 2, B: 3, R: 1 };
  }, 1);
  evidence("duration_calls", { calls, expected: ids }); expect(actual).toEqual(expected); expect(calls).toEqual(ids); archiveUnchanged(f);
});
contractCase("C57 policy comparison acquires common durations once, not once per policy", () => {
  const f = fixture(); let calls = 0;
  f.s.durations = () => { calls++; return { A: 2, B: 3, R: 1 }; };
  const rows = comparePolicies(f.s, ["event_driven", "fifo"]); evidence("duration_calls", { calls, expected: 2 });
  expect(rows.map(r => r.policy)).toEqual(["event_driven", "fifo"]); expect(rows.map(r => r.committedUnits)).toEqual([2, 2]);
  expect(rows[0]!.traceHash).toBe(rows[1]!.traceHash); expect(calls).toBe(2); archiveUnchanged(f);
});
contractCase("C58 default capture and replay use one duration acquisition, not a second sample", () => {
  const f = fixture(); let calls = 0;
  f.s.durations = () => { calls++; return calls <= 2 ? { A: 2, B: 3, R: 1 } : { A: 20, B: 30, R: 1 }; };
  const journal = captureReplayJournal(f.s), replay = attempt(() => replayScenarioJournal(JSON.parse(JSON.stringify(journal))));
  evidence("capture_replay", { calls, replay: replay.ok ? { traceHash: replay.value.traceHash } : { error: errorView(replay.error) } });
  expect(calls).toBe(2); expect(accepted(replay).traceHash).toBe(journal.expectedTraceHash); archiveUnchanged(f);
});
contractCase("C59 duplicate journal duration IDs cannot be erased by Map construction", () => {
  const journal = structuredClone(captureReplayJournal(manual()));
  journal.scenario.durations.push(structuredClone(journal.scenario.durations[0]!));
  // A public helper recomputes the test journal's integrity field, not any archive
  // or missing need. Thus refusal must not rely on an unrelated stale self-hash.
  journal.scenarioFingerprint = fingerprint(journal.scenario);
  qualified(attempt(() => replayScenarioJournal(journal)), "plan_non_conformant");
});
contractCase("C60 malformed journal tuple is qualified before destructive Map construction", () => {
  const journal = structuredClone(captureReplayJournal(manual())); journal.scenario.durations[0] = 7 as never;
  journal.scenarioFingerprint = fingerprint(journal.scenario);
  qualified(attempt(() => replayScenarioJournal(journal)), "plan_non_conformant");
});
contractCase("C61 journal fingerprint corruption still refuses", () => {
  const journal = structuredClone(captureReplayJournal(manual())); journal.scenarioFingerprint = "0".repeat(64);
  qualified(attempt(() => replayScenarioJournal(journal)), "plan_non_conformant");
});

contractCase("C62 HARD survives adoption and retry request while real stop releases the peer", () => {
  const s = scenario(["A", "B"], [], 4); s.config.maxTicks = 256; s.config.heartbeatEvery = 0;
  s.durations = { A: 10, B: 11, R: 1 }; for (const u of s.plan.units) u.conflicts = [{ resourceKey: "shared-copy-control" }];
  s.incidents = [{ kind: "new_scc", atTick: 1, unitIds: ["A"] }, { kind: "partition_adoption", atTick: 2, unitIds: ["A"] },
    { kind: "stop_confirmed", atTick: 3, unitId: "A", retry: true }];
  const baseline = accepted(observedRun(s)), engine = new SimEngine(s); engine.runUntil(2);
  const held = engine.observe(); expect(held.units.find(u => u.unitId === "B")!.dispatchTick).toBeNull();
  const r = engine.run(); expect(r.traceHash).toBe(baseline.traceHash);
  expect(r.units.find(u => u.unitId === "A")!.attempts).toBe(1); expect(r.store.getCommit("A")).toBeUndefined();
  expect(r.units.find(u => u.unitId === "B")!.dispatchTick).toBe(3); expect(r.store.getCommit("B")).toBeDefined();
});
contractCase("C63 ordinary cancel plus confirmed stop still permits a legal retry", () => {
  const s = scenario(["A"], [], 2); s.config.maxTicks = 256; s.durations = { A: 10, B: 11, R: 1 };
  s.incidents = [{ kind: "cancel", atTick: 1, unitId: "A" }, { kind: "stop_confirmed", atTick: 2, unitId: "A", retry: true }];
  const r = accepted(observedRun(s)); expect(r.units[0]!.attempts).toBe(2); expect(r.units[0]!.state).toBe("COMMITTED");
});
contractCase("C64 adoption permits the eligible current generation to finish once", () => {
  const s = scenario(["A"], [], 2); s.config.maxTicks = 256;
  s.incidents = [{ kind: "partition_adoption", atTick: 1, unitIds: ["A"] }];
  const r = accepted(observedRun(s)); expect(r.units[0]!.attempts).toBe(1); expect(r.units[0]!.state).toBe("COMMITTED");
  expect(r.trace.filter(e => e.ev === "committed" && e.unitId === "A")).toHaveLength(1);
});

if (names.length > 80 || new Set(names).size !== names.length) throw new Error("copy-boundary test declaration budget or duplicate name");
evidence("suite_manifest", { declaredCases: names.length, maxUnitsPerFixture: 2, names });
