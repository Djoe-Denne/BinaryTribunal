/**120 Author-only future composition. No construction/IO/thread at module load. */
import { Worker } from "node:worker_threads";
import { spyOn } from "bun:test";
import { t2Fixture, collectT2, reopenT2, type T2Fixture93, type T2Ready93 } from "./t2-fixtures";
import { hostObservation, type childInput } from "./t1-fixtures";
import { canonical, decoded, document, digest } from "./s1-source-fixtures";
import { prepareExecutionV1 } from "../../src/graph-execution-prepare";
import type { ExecutionPreparationBodyV1, IndependentlyLoadedSourcesV1 } from "../../src/graph-execution-envelope";
import type { PlannerPolicy } from "../../src/planner";
import type { GenerationViewV3 } from "../../src/graph-generation-store";
import type { FixtureTrustedAuthorityV1, FixtureReplacementHandle120 } from "../../src/graph-trusted-authority";
import { readReplacementCounter120, type ReplacementHostPort120, type ReplacementSource120,
  type ReplacementCurrent120, type ReplacementCase120, type ReplacementStage120, type ReplacementResult120 } from "../../src/graph-generation-replacement";

export type Cap120 = ReturnType<FixtureTrustedAuthorityV1["resolveReplacement120"]>;
export interface ReplacementFixture120 extends T2Fixture93 {
  replacementPort: ReplacementHostPort120; oldCandidate: NonNullable<GenerationViewV3["candidateRef"]>; originalCut: unknown;
  stage: ReplacementStage120 | null; swap: ReplacementResult120 | null; newChild: ReturnType<typeof childInput>;
  oldFinal: T2Ready93 | null; stageExpected: GenerationViewV3;
  withoutBarrier?: boolean;
  now(): number; cut(): unknown; activeWork(): unknown; snapshot(): ReturnType<typeof snapshot120>;
  replacementCounter(): ReturnType<typeof readReplacementCounter120>; newUnitStates(): string[]; newUnitId(): string;
  fourthStage(): () => ReplacementStage120;
}
function note120(x: ReplacementFixture120, operation: string) {
  const event = x.events.read("author").at(-1)!;
  if (!x.host93.logs.own.entries.some(entry => entry.ownEventKey === event.key))
    x.host93.note("own", operation, document("l8-host-own-event-source95", { version: "l8-host-own-event-source95", event }).ref, event.key);
}
function sourceRegistration120(x: ReplacementFixture120): void {
  const current = decoded<ReplacementCurrent120>(x.replacementPort.records!.current!);
  const row = x.db.query("SELECT * FROM g3_authority WHERE record_ref=? AND kind='replacement-host-source120'").get(`transition:${canonical(current.sourceRef)}`);
  if (!row) throw new Error("actual retained replacement source required");
  const ref = document("l8-host-registered-source95", { version: "l8-host-registered-source95", row }).ref;
  if (!x.host93.logs.own.entries.some(e => canonical(e.sourceRef) === canonical(ref))) x.host93.note("own", "register-independent-current-template-source", ref, null);
}
function buildChild120(x: ReplacementFixture120): ReturnType<typeof childInput> {
  const current = decoded<ReplacementCurrent120>(x.replacementPort.records!.current!);
  const retained = x.replacementPort.records!.sources.find(s => canonical(s.ref) === canonical(current.sourceRef));
  if (!retained) throw new Error("independent current source missing");
  const source = decoded<ReplacementSource120>(retained), independent: IndependentlyLoadedSourcesV1 = structuredClone(source.independent);
  const observation = hostObservation(x), observationRef = x.authority.registerTransitionDocument(document(observation.version, observation));
  const { fingerprint: _old, planning: _oldPlanning, ...oldBody } = JSON.parse(x.sealed.document.utf8);
  const policy = decoded<PlannerPolicy>(independent.planningPolicy);
  if (!policy.admissionBudget) throw new Error("current complete allocation required");
  const context = policy.admissionBudget.context;
  const body: ExecutionPreparationBodyV1 = { ...oldBody, authorizationKind: "transition-a-fixture-v1", adoptionIntent: null,
    generation: { lineageId: x.sealed.envelope.generation.lineageId, ordinal: 1, parentGenerationId: x.sealed.generationId },
    planningPolicy: independent.planningPolicy, preparationObservationT0: observation.t0,
    admissionSource: { ...oldBody.admissionSource, executionTemplate: independent.executionTemplate, executionSourceSpec: independent.executionSourceSpec,
      allocation: policy.admissionBudget, context, sourceFingerprints: { ...oldBody.admissionSource.sourceFingerprints,
        executionTemplate: digest(decoded(independent.executionTemplate)), executionSourceSpec: digest(decoded(independent.executionSourceSpec)),
        context: digest(context), allocation: policy.admissionBudget.fingerprint } } };
  // The ONLY new preparation invokes the genuine S1 producer/replanner. Loading,
  // exact retry and CAS below never call it and never copy an old planning result.
  const prepared = prepareExecutionV1({ body, independentSources: independent, policy });
  if (!prepared.ok) throw new Error(`HOLD: replacement concrete source S1 contradiction: ${prepared.reasons.join(";")}`);
  return { origin: prepared.value.origin, independent, run: prepared.value.run, observation, observationRef };
}
function snapshot120(x: ReplacementFixture120) {
  return { head: x.store.read("author"), slots: x.store.slots("author"), activeWork: x.activeWork(), cut: x.cut(), cursor: x.events.cursor("author"),
    origins: x.db.query("SELECT * FROM g3_origins ORDER BY mission,generation").all(), units: x.db.query("SELECT * FROM g3_units ORDER BY mission,generation,unit").all(),
    authority: x.db.query("SELECT * FROM g3_authority ORDER BY record_ref").all() };
}
function decorate120(x: ReplacementFixture120): ReplacementFixture120 {
  x.now = () => x.events.cursor("author").time + 1;
  // Read the original barrier identity directly from the original retained T1
  // result; do not require today's candidate to still equal DrainEntry.OLD.
  const drainRows = x.db.query("SELECT * FROM g3_authority WHERE kind='drain-result' ORDER BY record_ref").all() as { record_ref: string }[];
  if (drainRows.length !== 1 && !(x.withoutBarrier && drainRows.length === 0)) throw new Error("one actual original T1 barrier required");
  const drainKey = drainRows[0]?.record_ref; x.cut = () => drainKey ? x.db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(drainKey) : null;
  x.activeWork = () => ({ families: x.db.query("SELECT * FROM g3_families ORDER BY mission,generation,unit").all(), claims: x.db.query("SELECT * FROM g3_claims ORDER BY resource_key").all(),
    outboxes: x.db.query("SELECT * FROM g3_outbox ORDER BY execution_id").all(), roots: x.db.query("SELECT * FROM g3_root ORDER BY root_id").all() });
  x.snapshot = () => snapshot120(x); x.replacementCounter = () => readReplacementCounter120(x.db, x.events, x.store.read("author").rootAccountId);
  x.newUnitId = () => decoded<{ units: { unitId: string }[] }>(x.newChild.origin.envelope.planning).units[0]!.unitId;
  x.newUnitStates = () => (x.db.query("SELECT state FROM g3_units WHERE generation=? ORDER BY unit").all(x.newChild.origin.generationId) as { state: string }[]).map(r => r.state);
  x.fourthStage = () => { const child = buildChild120(x), expected = x.store.read("author"); return () => x.store.prepareReplacement(x.handle, expected, child.origin, child.independent, x.originGrant, child.observationRef, x.now()); };
  return x;
}
export function replacementFixture120(options: { oldFinal?: boolean; parentExpiresAtEvent?: number; withoutBarrier?: boolean; engaged?: boolean } = {}): ReplacementFixture120 {
  const base = t2Fixture({ replacement120: true, parentExpiresAtEvent: options.parentExpiresAtEvent ?? 10000, stopBeforeDrain120: options.withoutBarrier, engaged: options.engaged });
  if (!base.replacementPort) throw new Error("prebootstrap replacement HOST required");
  const oldFinal = options.oldFinal ? collectT2(base) : null;
  const x = { ...base, replacementPort: base.replacementPort, oldCandidate: base.store.read("author").candidateRef!, oldFinal, stage: null, swap: null, withoutBarrier: options.withoutBarrier } as ReplacementFixture120;
  // HOST changes its own retained source before any replacement demand.
  x.host93.reduceAvailability120(x.replacementPort, x.sealed); x.authority.registerReplacementCurrent120();
  sourceRegistration120(x); x.newChild = buildChild120(x); x.stageExpected = x.store.read("author"); decorate120(x); x.originalCut = x.cut(); return x;
}
export function stageReplacement120(x: ReplacementFixture120): ReplacementStage120 {
  const c = x.newChild; const stage = x.store.prepareReplacement(x.handle, x.stageExpected, c.origin, c.independent, x.originGrant, c.observationRef, x.now());
  x.stage = stage; note120(x, "prepare-replacement"); return stage;
}
export function replacementCap120(x: ReplacementFixture120, requestId: string): Cap120 {
  const ref = x.host93.replacementCase120(x.replacementPort, requestId); x.authority.registerReplacementCurrent120(); return x.authority.resolveReplacement120(ref);
}
export function swapReplacement120(x: ReplacementFixture120, cap = replacementCap120(x, "nominal")): ReplacementResult120 {
  const c = decoded<ReplacementCase120>(x.replacementPort.records!.cases.find(doc => canonical(doc.ref) === canonical(cap.ref))!);
  const result = x.store.replaceCandidateA(x.handle, c.expectedHead, cap.handle, x.now()); x.swap = result; note120(x, "replace-candidate"); return result;
}
export function reopenReplacement120(x: ReplacementFixture120): ReplacementFixture120 {
  const y = reopenT2(x, { reconnectRetainedOrigin: true, reconnectRetainedReplacement: true });
  if (!y.replacementPort) throw new Error("retained current replacement HOST reconnect required");
  return decorate120({ ...x, ...y, replacementPort: y.replacementPort } as ReplacementFixture120);
}
export function freshReplacementFinal120(x: ReplacementFixture120): T2Ready93 {
  x.replacementChild120 = x.newChild; x.childControllerRef = null; return collectT2(x);
}
export function replacementFault120(x: ReplacementFixture120, cap: Cap120, defect: string): () => ReplacementResult120 {
  const c = decoded<ReplacementCase120>(x.replacementPort.records!.cases.find(doc => canonical(doc.ref) === canonical(cap.ref))!);
  let expected = structuredClone(c.expectedHead), handle: FixtureReplacementHandle120 = cap.handle;
  if (defect === "stale-old") expected = { ...expected, candidateGenerationId: "not-the-current-candidate" };
  else if (defect === "stale-head") expected.revision += 1;
  else if (defect === "stale-fence") expected.controllerFence += 1;
  else if (defect === "stale-inventory") expected.inventoryRevision += 1;
  else if (defect === "same-hc-old-preparation") expected = structuredClone(x.stage!.value.headBefore);
  else if (defect === "current-unknown") { if (x.replacementPort.epoch) Atomics.add(x.replacementPort.epoch, 0, 1); x.replacementPort.records!.current = null; }
  else if (defect === "current-revoked" || defect === "revoked-cap") {
    const current = decoded<ReplacementCurrent120>(x.replacementPort.records!.current!);
    const next = { ...current, revision: current.revision + 1, revokedRefs: [...current.revokedRefs, defect === "revoked-cap" ? cap.ref : current.sourceRef] };
    if (x.replacementPort.epoch) Atomics.add(x.replacementPort.epoch, 0, 1);
    x.replacementPort.records!.current = document(next.version, next); if (defect === "revoked-cap") x.authority.registerReplacementCurrent120();
  } else if (defect === "forged-cap" || defect === "B-native") handle = {} as never; // deliberately invalid opaque handle, not an admitted S1 cast
  else if (defect === "wrong-purpose") handle = x.drainCase!.handle as never;
  else if (defect === "counter-unknown") x.db.query("DELETE FROM g3_authority WHERE record_ref=? AND kind='replacement-counter-current120'").run(`replacement-counter:${expected.rootAccountId}`);
  else throw new Error("unknown replacement negative");
  return () => x.store.replaceCandidateA(x.handle, expected, handle, x.now());
}
/**124 External HOST mutations only: intentionally NEVER register them in OWN. */
export function invalidateReplacementHost124(x: ReplacementFixture120, defect: "current-unknown" | "revoked-cap" | "epoch-only" | "current-revision" | "source-bytes" | "case-bytes"): void {
  const records = x.replacementPort.records!;
  if (defect === "current-unknown") { records.current = null; return; }
  if (defect === "epoch-only") { if (!x.replacementPort.epoch) throw new Error("actual HOST epoch required"); Atomics.add(x.replacementPort.epoch, 0, 1); return; }
  const current = decoded<ReplacementCurrent120>(records.current!);
  if (defect === "current-revision") { records.current = document(current.version, { ...current, revision: current.revision + 1 }); return; }
  const cap = records.cases.find(doc => x.swap!.value.authorityRecordRefs.some(ref => canonical(ref) === canonical(doc.ref)))!;
  if (defect === "revoked-cap") { records.current = document(current.version, { ...current, revokedRefs: [...current.revokedRefs, cap.ref] }); return; }
  if (defect === "case-bytes") { cap.utf8 += " "; return; }
  const source = records.sources.find(doc => canonical(doc.ref) === canonical(current.sourceRef))!;
  source.utf8 += " ";
}
export class ReplacementContenderFailure124 extends Error {
  constructor(readonly primaryError: unknown, readonly cleanupErrors: unknown[], readonly exitObserved: boolean,
    readonly terminationRequested: boolean, readonly signalsReleased: boolean, readonly spyReleased: boolean, readonly exitCode: number | null) {
    super(exitObserved ? "replacement contender failed; exit observed" : "BLOCKED: replacement contender exit UNOBSERVED; no join guarantee");
  }
}
export async function contendReplacement120(x: ReplacementFixture120, fault124?: "after-handshake-before-reply" | "after-reply-before-exit") {
  // One work deadline (5s), then at most 2s for termination/exit/final collection.
  // Neither Bun's test timeout nor a join timeout is treated as an exit event.
  const workDeadline = performance.now() + 5000;
  const a = replacementCap120(x, "contender-A"), b = replacementCap120(x, "contender-B"), flags = new Int32Array(new SharedArrayBuffer(6 * Int32Array.BYTES_PER_ELEMENT));
  const worker = new Worker(new URL("./replacement-contender.ts", import.meta.url), { workerData: { path: x.path, controller: x.controller,
    originRecords: x.originHostPort.records, replacementRecords: x.replacementPort.records, sourceEpoch: x.replacementPort.epoch?.buffer,
    sourceObservedEpoch: x.replacementPort.observedEpoch, capRef: b.ref, flags: flags.buffer, fault124 } });
  let exited = false, exitCode: number | null = null, settleReplyFailure: (error: unknown) => void = () => {};
  const workerErrors: unknown[] = [];
  let onExit: (code: number) => void = () => {};
  const exit = new Promise<number>(resolve => { onExit = code => { exited = true; exitCode = code; resolve(code); }; worker.once("exit", onExit); });
  type Reply124 = { actualBusyDuringWinnerTransaction: boolean; secondBeginBeforeWinnerCommit: boolean; winnerVisibleBeforeLoserAction: boolean; loserError: string; requestId: string; capRef: Cap120["ref"] };
  let onMessage: (value: Reply124 | { error: string } | { cleanupErrors124: string[] }) => void = () => {}, onError: (error: Error) => void = () => {}, onExitWithoutReply: (code: number) => void = () => {};
  const reply = new Promise<Reply124>((resolve, reject) => {
    settleReplyFailure = reject; onMessage = value => {
      if ("cleanupErrors124" in value) { workerErrors.push(...value.cleanupErrors124.map(message => new Error(message))); return; }
      if ("error" in value) { reject(new Error(value.error)); return; } resolve(value);
    };
    onError = error => { workerErrors.push(error); reject(error); };
    onExitWithoutReply = code => reject(new Error(`replacement contender exited without a reply (${code})`));
    worker.on("message", onMessage); worker.on("error", onError); worker.once("exit", onExitWithoutReply);
  });
  const bounded = async <T>(promise: Promise<T>, deadline: number, phase: string): Promise<T> => {
    void promise.catch(() => {}); // Even an already-expired deadline must observe a late terminate rejection.
    if (performance.now() >= deadline) throw new Error(`replacement contender ${phase} deadline`);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`replacement contender ${phase} deadline`)), Math.max(0, deadline - performance.now())); })]); }
    finally { if (timer !== undefined) clearTimeout(timer); }
  };
  const wait = (index: number, value: number) => { while (Atomics.load(flags, index) !== value) {
    const actual = Atomics.load(flags, index); if (actual < 0 || performance.now() >= workDeadline) throw new Error(`replacement contender rendezvous[${index}] deadline/abort`);
    Atomics.wait(flags, index, actual, Math.max(1, workDeadline - performance.now())); } };
  let restore: (() => void) | undefined, primaryError: unknown, failed = false, terminationRequested = false, signalsReleased = false, spyReleased = true;
  const cleanupErrors: unknown[] = [];
  let result: Awaited<typeof reply> | undefined, winnerCommittedBeforeLoserReturned = false;
  void reply.catch(() => {}); // raw event errors always have an observer, including during cleanup
  try {
    worker.postMessage("start");
    wait(0, 1); const real = x.events.append.bind(x.events);
    const spy = spyOn(x.events, "append").mockImplementation((...args) => { const event = real(...args); if (args[2] === "g3_candidate_replaced") {
      Atomics.store(flags, 1, 1); Atomics.notify(flags, 1); wait(2, 1); // flag2 is set ONLY after actual SQLITE_BUSY from second BEGIN
    } return event; });
    restore = () => spy.mockRestore(); spyReleased = false;
    swapReplacement120(x, a); restore(); restore = undefined; spyReleased = true; Atomics.store(flags, 3, 1); Atomics.notify(flags, 3);
    result = await bounded(reply, workDeadline, "reply");
    winnerCommittedBeforeLoserReturned = result.winnerVisibleBeforeLoserAction && Atomics.load(flags, 4) === 1 && Atomics.load(flags, 3) === 1;
    const code = await bounded(exit, workDeadline, "exit");
    if (code !== 0) throw new Error(`replacement contender exit ${code}`);
    if (canonical(result.capRef) !== canonical(b.ref)) throw new Error("actual contender capability identity mismatch");
  } catch (error) { failed = true; primaryError = error; }
  finally {
    const cleanupDeadline = performance.now() + 2000;
    try { restore?.(); spyReleased = true; } catch (error) { cleanupErrors.push(error); }
    // Release every rendezvous, including the two local abnormal-lifecycle faults.
    try { for (const index of [0, 1, 2, 3, 5]) { Atomics.store(flags, index, -1); Atomics.notify(flags, index); } signalsReleased = true; }
    catch (error) { cleanupErrors.push(error); }
    if (!exited) {
      terminationRequested = true;
      try { await bounded(worker.terminate(), cleanupDeadline, "terminate"); } catch (error) { cleanupErrors.push(error); }
    }
    try { await bounded(exit, cleanupDeadline, "cleanup-exit"); } catch (error) { cleanupErrors.push(error); }
    const cancellation = new Error("replacement contender reply cancelled during cleanup"); settleReplyFailure(cancellation);
    try {
      const collected = await bounded(Promise.allSettled([reply, exit]), cleanupDeadline, "final-collection");
      const first = collected[0]!;
      if (first.status === "rejected" && first.reason !== cancellation && (!failed || first.reason !== primaryError)) cleanupErrors.push(first.reason);
    } catch (error) { cleanupErrors.push(error); }
    for (const error of workerErrors) if (error !== primaryError && !cleanupErrors.includes(error)) cleanupErrors.push(error);
    worker.off("message", onMessage); worker.off("exit", onExitWithoutReply);
    if (exited) { worker.off("error", onError); worker.off("exit", onExit); }
    else worker.once("exit", () => worker.off("error", onError)); // Do not turn an unobserved late Worker error into an uncaught exception.
  }
  if (failed || cleanupErrors.length || !exited) throw new ReplacementContenderFailure124(primaryError, cleanupErrors, exited, terminationRequested, signalsReleased, spyReleased, exitCode);
  if (!result) throw new Error("replacement contender missing collected reply");
  const actualA = decoded<ReplacementCase120>(x.replacementPort.records!.cases.find(doc => canonical(doc.ref) === canonical(a.ref))!);
  return { ...result, winnerCommittedBeforeLoserReturned,
    requestIdentities: [actualA.requestId, result.requestId], capRefsDistinct: canonical(a.ref) !== canonical(result.capRef), exitObserved: exited };
}
