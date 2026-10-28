/** Public-API regressions with synthetic transports/ports only.
 * No native/scientific authority, SQL seeds, historical DBs or ignored inputs.
 * Every database is newly reserved by fixturePath and retained after close.
 */
import { describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { ExecutionClient, type ClientOptions, type RpcTransport } from "../../src/client";
import { graphInputs, makeGraphIntent, type FixtureExecutionPort } from "../../src/graph-adapter";
import { graphEvents, prepareGraphExecution, preparedGraphRun } from "../../src/graph-engine";
import { canonical, fingerprint, hash } from "../../src/validation";
import { fixturePath, graphHarness, preparationV2, preserveFixture, snapshotFixture } from "./fixture-driver";

type Data = Record<string, unknown>;
type Harness = ReturnType<typeof graphHarness>;
type Observation = Awaited<ReturnType<FixtureExecutionPort["observe"]>>;
const mission = "body-pause-public-fixture";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
async function outcome<T>(operation: () => T | Promise<T>) {
  try { return { value: await operation(), error: undefined }; }
  catch (error) { return { value: undefined, error }; }
}
function evidence(caseId: string, data: Data) {
  console.log(`L8_A2_REGRESSION ${JSON.stringify({ caseId, fixtureOnly: true, nativeVerified: false, scientificAuthority: false, ...data })}`);
}
function payload(label: string): Data {
  return { idempotencyKey: `key:${label}`, executionId: `execution:${label}`, taskId: "synthetic-task", attemptId: "synthetic-attempt", profile: "offline-worker",
    prompt: "ORIGINAL é 日本 🙂 quote\" slash\\ newline\n", model: { providerID: "fixture", id: "local", variant: "high" },
    dossier: { source: "offline synthetic, not ASM", nested: { value: "ORIGINAL_NESTED" } },
    metadata: { labels: ["first", "second"], inputHash: "a".repeat(64) }, context: { mode: "fresh" }, worktree: false };
}
/** Inspect the external payload, not a private DB or a duplicated snapshot helper. */
function wirePayload(request: Data): Data {
  const { missionId: _m, directory: _d, controllerId: _c, expectedRevision: _r, principalId: _p, token: _t, ...body } = request;
  return body;
}
function clientFixture(seedRole?: "RV01_COHERENT_CONTROL" | "RV01_MUTATED_BASELINE") {
  const path = fixturePath(), sends: Data[] = [], methods: string[] = [], receipts = new Map<string, Data>(), remotePayloads = new Map<string, string>();
  const hooks: { token?: () => void; snapshot?: () => void | Promise<void>; renew?: () => void | Promise<void> } = {};
  const faults: Array<"before-acceptance" | "after-acceptance"> = [];
  let revision = 1, shortLease = false, closed = false;
  const transport: RpcTransport = { async call(method, request) {
    methods.push(method);
    if (method === "capabilities") return { version: 1, capabilities: { rpc: "ensemble.execution.v1", fresh: true, replay: true } };
    if (method === "ensureTeam") return { version: 1, revision, teamId: "fake-team", leadSessionId: "fake-session" };
    if (method === "snapshot") {
      await hooks.snapshot?.();
      return { version: 1, revision, admissions: { controllerId: "fixture-controller", leaseUntil: Date.now() + (shortLease ? 10000 : 600000), paused: false }, executions: [...receipts.values()].map(value => structuredClone(value)) };
    }
    if (method === "control") {
      if (request.action === "renew") { await hooks.renew?.(); shortLease = false; }
      revision++; return { version: 1, revision };
    }
    if (method === "submit") {
      const sent = structuredClone(request), key = String(sent.idempotencyKey), bytes = canonical(wirePayload(sent)); sends.push(sent);
      const fault = faults.shift(); if (fault === "before-acceptance") throw new Error("explicit fake cut before acceptance");
      const old = remotePayloads.get(key); if (old !== undefined && old !== bytes) throw new Error("explicit fake remote idempotency conflict");
      let receipt = receipts.get(key);
      if (!receipt) {
        receipt = { version: 1, revision: ++revision, executionId: sent.executionId ?? key, idempotencyKey: key, state: "accepted", nativeSessionId: `fake-session:${key}`, source: "synthetic public RPC fixture NOT native" };
        receipts.set(key, receipt); remotePayloads.set(key, bytes);
      }
      if (fault === "after-acceptance") throw new Error("explicit fake accepted then response lost");
      return structuredClone(receipt);
    }
    throw new Error(`unexpected fake RPC method ${method}`);
  } };
  const options: ClientOptions = { statePath: path, directory: "offline-fixture-directory", principalId: "offline-fixture-principal", controllerId: "fixture-controller", teamName: "offline-fixture-team", leaseMs: 300000, maxRunning: 2,
    token: () => { hooks.token?.(); return "SYNTHETIC-NOT-A-REAL-OPERATOR-TOKEN"; }, transport };
  let client = new ExecutionClient(options);
  return { path, sends, methods, receipts, remotePayloads, hooks, faults, options,
    get client() { return client; },
    shortLease() { shortLease = true; },
    reopenSameFreshNonSeed() {
      // C evidence originals are NEVER reopened or copied by this test.
      if (seedRole) throw new Error("seed DB must stay closed after its first pin; separate scratch permission required");
      client.close(); client = new ExecutionClient(options);
    },
    seed(expected: Data, first: Data, retry: Data) {
      const actual = wirePayload(sends[0]!);
      evidence(seedRole ?? "CLIENT_IMAGE", { path, seedRole: seedRole ?? null, expectedPayload: expected, expectedCanonical: canonical(expected), sentPayload: actual,
        sentCanonical: canonical(actual), payloadCoherent: canonical(actual) === canonical(expected), cachedReceiptCanonicalEqual: canonical(first) === canonical(retry), sends: sends.length,
        receipt: first, futureScratchOnlyAfterSeparateGo: !!seedRole, noDatabaseReadOrRepair: true });
    },
    close() {
      if (closed) return;
      client.close(); closed = true; preserveFixture(path);
      if (seedRole) evidence(`${seedRole}_CLOSED`, { path, seedRole, originalRetained: true, copied: false, reopened: false, pinRecordedByReadonlyHelper: true });
    } };
}

describe("RV8A2-01 public client immutable body boundary (offline only)", () => {
  test("coherent control and retained fresh C seed use original bytes and cached receipt", async () => {
    const f = clientFixture("RV01_COHERENT_CONTROL"), input = payload("coherent-control"), expected = structuredClone(input);
    try {
      await f.client.ensure(mission); const first = await f.client.submit(mission, input), retry = await f.client.submit(mission, structuredClone(expected));
      f.seed(expected, first, retry);
      expect(canonical(wirePayload(f.sends[0]!))).toBe(canonical(expected)); expect(f.sends).toHaveLength(1); expect(retry).toEqual(first);
      expect(f.sends[0]!.directory).toBe(f.options.directory); expect(f.sends[0]!.controllerId).toBe(f.options.controllerId);
      expect(input.idempotencyKey).not.toBe(input.executionId); expect(Object.isFrozen(input)).toBe(false);
    } finally { f.close(); }
  });

  for (const boundary of ["snapshot", "renew", "token"] as const) for (const field of ["prompt", "nested", "array", "identity"] as const) {
    test(`capture before ${boundary} callback mutates ${field}`, async () => {
      const primarySeed = boundary === "snapshot" && field === "prompt";
      const f = clientFixture(primarySeed ? "RV01_MUTATED_BASELINE" : undefined), input = payload(`${boundary}-${field}`), expected = structuredClone(input);
      let calls = 0, afterMutation: Data | undefined;
      const mutate = () => {
        if (calls++) return;
        if (field === "prompt") input.prompt = "MUTATED_DURING_CALLBACK";
        else if (field === "nested") ((input.dossier as Data).nested as Data).value = "MUTATED_NESTED";
        else if (field === "array") ((input.metadata as Data).labels as string[]).reverse();
        else { input.idempotencyKey = "MUTATED_KEY"; input.executionId = "MUTATED_EXECUTION"; (input.model as Data).variant = "MUTATED_MODEL"; }
        afterMutation = structuredClone(input);
      };
      try {
        await f.client.ensure(mission); f.hooks[boundary] = mutate; if (boundary === "renew") f.shortLease();
        const first = await f.client.submit(mission, input), retry = await f.client.submit(mission, structuredClone(expected));
        f.seed(expected, first, retry);
        evidence("CLIENT_CALLBACK", { path: f.path, boundary, field, callbackRan: calls > 0, callerMutationPreserved: canonical(input) === canonical(afterMutation), source: "explicit fake callback, not native" });
        expect(calls).toBeGreaterThan(0); expect(canonical(input)).toBe(canonical(afterMutation));
        expect(Object.isFrozen(input)).toBe(false); expect(Object.isFrozen(input.dossier)).toBe(false); expect(Object.isFrozen((input.metadata as Data).labels)).toBe(false);
        expect(canonical(wirePayload(f.sends[0]!))).toBe(canonical(expected)); expect(f.sends).toHaveLength(1); expect(canonical(retry)).toBe(canonical(first));
      } finally { f.close(); }
    });
  }

  test("caller mutation while public snapshot Promise is pending cannot change the invocation image", async () => {
    const f = clientFixture(), entered = deferred(), release = deferred(), input = payload("await-race"), expected = structuredClone(input);
    let pending: Promise<Data> | undefined;
    try {
      await f.client.ensure(mission); f.hooks.snapshot = async () => { entered.resolve(); await release.promise; };
      pending = f.client.submit(mission, input); await entered.promise;
      input.prompt = "MUTATED_BETWEEN_AWAIT_AND_RESOLUTION"; ((input.dossier as Data).nested as Data).value = "MUTATED_ASYNC_NESTED";
      release.resolve(); await pending;
      evidence("CLIENT_AWAIT", { path: f.path, expectedPayload: expected, sentPayload: wirePayload(f.sends[0]!), callerStillWritable: !Object.isFrozen(input) });
      expect(canonical(wirePayload(f.sends[0]!))).toBe(canonical(expected)); expect(input.prompt).toBe("MUTATED_BETWEEN_AWAIT_AND_RESOLUTION");
    } finally { release.resolve(); await pending?.catch(() => undefined); f.close(); }
  });

  test("authority introduced by a Proxy during canonical capture is refused on the captured image", async () => {
    const f = clientFixture(), target = payload("captured-authority"); let traps = 0;
    const input = new Proxy(target, { ownKeys(value) { traps++; value.controllerId = "CALLER_AUTHORITY_INTRODUCED_BY_OWNKEYS"; return Reflect.ownKeys(value); } });
    try {
      await f.client.ensure(mission); const before = f.methods.length, result = await outcome(() => f.client.submit(mission, input));
      evidence("CAPTURED_AUTHORITY", { path: f.path, traps, rejected: result.error !== undefined, newTransportMethods: f.methods.slice(before), sends: f.sends.length,
        proxyEffectIsItsOwnSerializationEffect: target.controllerId, noAtomicHostileJsSnapshotClaim: true });
      expect(traps).toBeGreaterThan(0); expect(result.error).toBeDefined(); expect(f.methods.length).toBe(before); expect(f.sends).toHaveLength(0);
    } finally { f.close(); }
  });

  test("raw forbidden authority presence including undefined and inherited values stays rejected", async () => {
    const f = clientFixture();
    try {
      await f.client.ensure(mission); const before = f.methods.length;
      for (const key of ["token", "principalId", "controllerId", "expectedRevision", "directory", "missionId"]) {
        const own = { ...payload(`own-${key}`), [key]: undefined }, inherited = Object.assign(Object.create({ [key]: undefined }), payload(`inherited-${key}`)) as Data;
        expect((await outcome(() => f.client.submit(mission, own))).error).toBeDefined();
        expect((await outcome(() => f.client.submit(mission, inherited))).error).toBeDefined();
      }
      expect(f.methods.length).toBe(before); expect(f.sends).toHaveLength(0);
    } finally { f.close(); }
  });

  for (const kind of ["non-enumerable-key", "root-array"] as const) test(`out-of-contract captured image ${kind} is refused before transport`, async () => {
    const f = clientFixture();
    const input: Data = kind === "root-array" ? Object.assign(["not an admission object"], { idempotencyKey: "root-array-key", executionId: "root-array-execution" }) as unknown as Data : payload("non-enumerable-key");
    if (kind === "non-enumerable-key") Object.defineProperty(input, "idempotencyKey", { value: "non-enumerable-key", enumerable: false, writable: true, configurable: true });
    try {
      await f.client.ensure(mission); const before = f.methods.length, result = await outcome(() => f.client.submit(mission, input));
      evidence("CAPTURED_IMAGE_DOMAIN", { path: f.path, kind, rejected: result.error !== undefined, newTransportMethods: f.methods.slice(before), sends: f.sends.length });
      expect(result.error).toBeDefined(); expect(f.methods.length).toBe(before); expect(f.sends).toHaveLength(0);
    } finally { f.close(); }
  });

  test("benign getters and Proxy keep the existing canonical JSON payload without caller freezing", async () => {
    const f = clientFixture(), target = payload("benign-proxy"); let reads = 0;
    Object.defineProperty(target, "prompt", { enumerable: true, configurable: true, get() { reads++; return "STABLE_GETTER é 日本 🙂"; } });
    target.omitted = undefined; target.existingScalarNormalization = Number.NaN;
    const input = new Proxy(target, {}), expectedBytes = canonical(input);
    try {
      await f.client.ensure(mission); await f.client.submit(mission, input);
      expect(canonical(wirePayload(f.sends[0]!))).toBe(expectedBytes); expect(reads).toBeGreaterThan(0);
      expect(Object.isFrozen(target)).toBe(false); expect(typeof Object.getOwnPropertyDescriptor(target, "prompt")?.get).toBe("function");
    } finally { f.close(); }
  });

  test("cyclic and BigInt serialization failures do not become admissions or transport calls", async () => {
    const f = clientFixture(), cyclic = payload("cyclic"); cyclic.self = cyclic;
    try {
      await f.client.ensure(mission); const before = f.methods.length;
      expect((await outcome(() => f.client.submit(mission, cyclic))).error).toBeDefined();
      expect((await outcome(() => f.client.submit(mission, { ...payload("bigint"), unsupported: 1n }))).error).toBeDefined();
      expect(f.methods.length).toBe(before); expect(f.sends).toHaveLength(0);
    } finally { f.close(); }
  });

  test("changed payload is refused and mutation of returned receipt does not rewrite its durable cache", async () => {
    const f = clientFixture(), input = payload("receipt-cache");
    try {
      await f.client.ensure(mission); const receipt = await f.client.submit(mission, input), original = structuredClone(receipt);
      receipt.executionId = "MUTATED_RETURN_VALUE";
      expect((await outcome(() => f.client.submit(mission, { ...input, prompt: "CHANGED_UNDER_SAME_KEY" }))).error).toBeDefined();
      f.reopenSameFreshNonSeed(); expect(await f.client.submit(mission, input)).toEqual(original); expect(f.sends).toHaveLength(1);
    } finally { f.close(); }
  });

  for (const fault of ["before-acceptance", "after-acceptance"] as const) test(`public pending retry/reopen preserves payload after ${fault}`, async () => {
    const f = clientFixture(), input = payload(`lost-${fault}`), expectedBytes = canonical(input);
    try {
      await f.client.ensure(mission); f.faults.push(fault);
      expect((await outcome(() => f.client.submit(mission, input))).error).toBeDefined();
      const first = structuredClone(f.sends[0]!); f.reopenSameFreshNonSeed();
      if (fault === "before-acceptance") await f.client.control(mission, "renew");
      const receipt = await f.client.submit(mission, structuredClone(input));
      evidence("CLIENT_PUBLIC_RETRY", { path: f.path, fault, sends: f.sends.length, remoteExecutions: f.receipts.size, originalExecutionId: first.executionId, retriedExecutionId: f.sends[1]!.executionId,
        firstRevision: first.expectedRevision, retriedRevision: f.sends[1]!.expectedRevision, firstPayload: wirePayload(first), retriedPayload: wirePayload(f.sends[1]!), sameRunFreshNonSeedOnly: true });
      expect(receipt.state).toBe("accepted"); expect(f.receipts.size).toBe(1); expect(f.sends).toHaveLength(2);
      expect(canonical(wirePayload(f.sends[0]!))).toBe(expectedBytes); expect(canonical(wirePayload(f.sends[1]!))).toBe(expectedBytes);
      if (fault === "after-acceptance") expect(canonical(f.sends[1]!)).toBe(canonical(first));
      else expect(Number(f.sends[1]!.expectedRevision)).toBeGreaterThan(Number(first.expectedRevision));
    } finally { f.close(); }
  });

  for (const changed of [false, true]) test(`concurrent public same-key calls retain the winner image (changed=${changed})`, async () => {
    const f = clientFixture(), entered = deferred(), release = deferred(), left = payload(`concurrent-${changed}`), right = structuredClone(left);
    if (changed) right.prompt = "CONCURRENT_OTHER_IMAGE";
    let waiting = 0, pending: Promise<PromiseSettledResult<Data>[]> | undefined;
    try {
      await f.client.ensure(mission); f.hooks.snapshot = async () => { if (++waiting === 2) entered.resolve(); await release.promise; };
      pending = Promise.allSettled([f.client.submit(mission, left), f.client.submit(mission, right)]); await entered.promise; release.resolve();
      const results = await pending, accepted = results.flatMap((r, index) => r.status === "fulfilled" ? [index] : []);
      evidence("CLIENT_CONCURRENT", { path: f.path, changed, statuses: results.map(r => r.status), sends: f.sends.length, remoteExecutions: f.receipts.size,
        sentPayloads: f.sends.map(wirePayload), singlePacketNotPromised: true });
      expect(accepted).toHaveLength(changed ? 1 : 2); expect(f.receipts.size).toBe(1);
      const winningBytes = canonical(accepted[0] === 0 ? left : right); expect(f.sends.every(sent => canonical(wirePayload(sent)) === winningBytes)).toBe(true);
      const [first, second] = results;
      if (!changed && first?.status === "fulfilled" && second?.status === "fulfilled") expect(first.value).toEqual(second.value);
    } finally { release.resolve(); await pending; f.close(); }
  });
});

function freshGraph(maxConcurrent = 1, retryDelayMs = 10) {
  const request = preparationV2(snapshotFixture(1), maxConcurrent); request.executionTemplate.settings.retryDelayMs = retryDelayMs;
  return graphHarness(request);
}
function claims(h: Harness) { return graphEvents(h.runtime.options.graph, h.missionId).filter(event => event.kind === "l8.graph2.execution-claimed"); }
function graphEvidence(caseId: string, h: Harness, extra: Data = {}) {
  const view = h.runtime.view(), graph = h.runtime.options.graph;
  evidence(caseId, { path: h.path, status: view.status, submits: h.host.submissions.length, fakeAccepted: h.host.receipts.size,
    ids: h.host.submissions.map(s => s.command.executionId), states: view.intents.map(record => ({ executionId: record.intent.executionId, role: record.intent.role, admission: graph.admission(record.intent.executionId) })),
    claimTimes: claims(h).map(event => ({ key: event.key, time: event.time, sequence: event.sequence })), results: view.resultIds, lateResults: view.lateResultIds, ...extra });
}
function setPort(h: Harness, change: Partial<Pick<FixtureExecutionPort, "submit" | "observe">>) {
  h.host.ports.executions = { kind: "offline-fixture-v1", submit: h.host.executions.submit, observe: h.host.executions.observe, ...change };
}
async function quotaPrepared(h: Harness) {
  h.start(); h.host.submissionFailures.push("quota"); await h.step();
  const record = h.runtime.view().intents[0];
  if (!record || h.host.submissions.length !== 1 || h.runtime.options.graph.admission(record.intent.executionId)?.state !== "PREPARED") throw new Error("fixture setup: public explicit quota did not produce exactly one PREPARED admission");
  return record;
}
function reservePublic(h: Harness) {
  h.start(); const graph = h.runtime.options.graph, run = preparedGraphRun(graph, h.missionId)!;
  if (run.version !== "l8-graph-run-v2") throw new Error("fixture setup: v2 run required");
  const authority = h.runtime.options.authority(), unit = run.prepared.planning.units[0]!, sub = unit.subIntents.find(s => s.role === "A")!;
  if (graph.unit(h.missionId, unit.unitId).state !== "READY") graph.transition(authority, unit.unitId, "READY", "public offline fixture readiness");
  const lease = graph.reserve(authority, unit.unitId, run.settings.familyTtlEvents, graph.reservationExpectation(h.missionId)), snapshot = h.store.load(h.missionId);
  const record = makeGraphIntent(run, snapshot, unit, sub, lease, graphInputs(run, snapshot, sub), run.workers[0]!, authority.lease.token);
  if (record.version !== "l8-graph-intent-v2") throw new Error("fixture setup: v2 intent required");
  return { graph, run, authority, unit, lease, record };
}

describe("RV8A2-02 public graph pause boundaries, observations remain live", () => {
  test("control pause before first step creates no claim or submission", async () => {
    const h = freshGraph();
    try { h.start(); h.runtime.pause(); await h.step(); graphEvidence("PAUSE_FRESH_CONTROL", h); expect(h.runtime.view().status).toBe("paused"); expect(h.host.submissions).toHaveLength(0); expect(claims(h)).toHaveLength(0); }
    finally { h.close(); }
  });

  test("PREPARED quota cannot make its first acceptance while paused after backoff", async () => {
    const h = freshGraph();
    try {
      const record = await quotaPrepared(h), before = h.runtime.options.graph.admission(record.intent.executionId), claimBytes = canonical(claims(h));
      h.runtime.pause(); h.advance(1000); await h.step(); await h.step(); graphEvidence("PAUSED_PREPARED_RED", h, { beforeAdmission: before, originalBody: record.admission });
      expect(h.runtime.view().status).toBe("paused"); expect(h.host.submissions).toHaveLength(1); expect(h.host.receipts.size).toBe(0);
      expect(h.runtime.options.graph.admission(record.intent.executionId)).toEqual(before); expect(canonical(claims(h))).toBe(claimBytes);
    } finally { h.close(); }
  });

  test("pause/reopen/resume preserves original delay, body, claim time and execution slot", async () => {
    const h = freshGraph(1, 1000);
    try {
      const record = await quotaPrepared(h), originalClaims = canonical(claims(h)), before = h.runtime.options.graph.admission(record.intent.executionId);
      h.runtime.pause(); await h.step(); h.reopen(); await h.step();
      expect(h.runtime.view().status).toBe("paused"); expect(h.host.submissions).toHaveLength(1); expect(h.runtime.options.graph.admission(record.intent.executionId)).toEqual(before);
      h.runtime.resume(); await h.step(); expect(h.host.submissions).toHaveLength(1); h.advance(1000); await h.step();
      graphEvidence("PAUSE_RESUME_BACKOFF", h, { originalBody: record.admission, originalClaimsUnchanged: canonical(claims(h)) === originalClaims });
      expect(h.host.submissions).toHaveLength(2); expect(h.host.submissions[1]!.command).toEqual(h.host.submissions[0]!.command);
      expect(canonical(claims(h))).toBe(originalClaims); expect(h.runtime.options.graph.admission(record.intent.executionId)?.attempts).toBe(2); expect(h.host.receipts.size).toBe(1);
    } finally { h.close(); }
  });

  test("paused PREPARED can observe a linked acceptance that actually happened before pause, without a new send", async () => {
    const h = freshGraph(); let observed = 0;
    setPort(h, { observe: async record => { observed++; return h.host.executions.observe(record); } });
    try {
      const record = await quotaPrepared(h), run = preparedGraphRun(h.runtime.options.graph, h.missionId)!;
      h.host.holds.add(run.prepared.planning.units.find(unit => unit.unitId === record.unitId)!.ownedFunctionIds[0]!);
      // The real configured fake submit creates this fact BEFORE pause. It is
      // neither a new submission by the paused engine nor fabricated L6 SQL.
      await h.host.executions.submit(h.missionId, record.admission.command);
      const before = h.host.submissions.length; h.runtime.pause(); h.advance(1000); await h.step();
      graphEvidence("PREPARED_REAL_POSITIVE_READBACK", h, { publicFakeAcceptanceBeforePause: true, beforeSubmits: before, observerCalls: observed });
      expect(h.host.submissions).toHaveLength(before); expect(observed).toBeGreaterThan(0);
      const observedAdmission = h.runtime.options.graph.admission(record.intent.executionId);
      if (!observedAdmission) throw new Error("linked acceptance must retain its durable admission");
      expect(["ACCEPTED", "TERMINAL"]).toContain(observedAdmission.state); expect(h.host.receipts.size).toBe(1);
    } finally { h.close(); }
  });

  for (const observation of ["pending", "absent", "unknown", "rejected"] as const) test(`paused PREPARED ${observation} observation never invents a send, rejection transition or release`, async () => {
    const h = freshGraph(); let observed = 0;
    setPort(h, { observe: async record => {
      observed++; const result: Observation = { inspection: { status: "pending", executionId: record.intent.executionId } };
      if (observation === "pending") return result;
      let receipt: Data | null = null;
      if (observation === "rejected") {
        const event = graphEvents(h.runtime.options.graph, h.missionId).find(e => e.kind === "admission_rejected" && (e.payload as Data).executionId === record.intent.executionId);
        if (!event) throw new Error("fixture setup: actual prior public rejection proof missing");
        const proof = event.payload as Data, generation = proof.generation as { attempt: number; token: number };
        receipt = { type: proof.type, executionId: proof.executionId, requestDigest: proof.requestDigest, attempt: generation.attempt, token: generation.token, category: proof.category, recoverable: proof.recoverable };
      }
      result.admissionObservation = { executionId: record.intent.executionId, requestDigest: fingerprint(record.admission), state: observation, receipt,
        proof: "explicit offline observer: instantaneous or previously recorded public rejection; NOT native quiescence" };
      return result;
    } });
    try {
      const record = await quotaPrepared(h), before = h.runtime.options.graph.admission(record.intent.executionId); h.runtime.pause(); h.advance(1000);
      const result = await outcome(() => h.step()); graphEvidence("PREPARED_NONPOSITIVE_OBSERVATION", h, { observation, observerCalls: observed, stepError: result.error ? String(result.error) : null, beforeAdmission: before });
      expect(result.error).toBeUndefined(); expect(observed).toBeGreaterThan(0); expect(h.host.submissions).toHaveLength(1);
      expect(h.runtime.options.graph.admission(record.intent.executionId)).toEqual(before); expect(h.host.receipts.size).toBe(0);
      expect(h.runtime.options.graph.leases.get(h.missionId, record.unitId)?.state).toBe("active"); expect(h.host.publications).toHaveLength(0);
    } finally { h.close(); }
  });

  test("same-connection public preparation refuses pause before any pin, claim or outbox effect", async () => {
    const h = freshGraph();
    try {
      const x = reservePublic(h); h.runtime.pause(); const before = x.graph.events.cursor(h.missionId), beforeEvents = canonical(graphEvents(x.graph, h.missionId));
      const result = await outcome(() => prepareGraphExecution(x.graph, h.store, x.run, h.runtime.options.authority(), x.lease, x.record));
      graphEvidence("PAUSED_ATOMIC_PREPARATION", h, { preparationRejected: result.error !== undefined, afterAdmission: x.graph.admission(x.record.intent.executionId), error: result.error ? String(result.error) : null });
      expect(result.error).toBeDefined(); expect(x.graph.admission(x.record.intent.executionId)).toBeNull(); expect(x.graph.events.cursor(h.missionId)).toEqual(before);
      expect(canonical(graphEvents(x.graph, h.missionId))).toBe(beforeEvents); expect(claims(h)).toHaveLength(0); expect(h.host.submissions).toHaveLength(0);
    } finally { h.close(); }
  });

  for (const callback of ["inputs", "authority"] as const) test(`pause from the configured public ${callback} callback is reread before admission`, async () => {
    const h = freshGraph(); let armed = false, paused = false;
    try {
      h.start(); const inputs = h.runtime.options.inputs, authority = h.runtime.options.authority;
      h.runtime.options.inputs = (...args) => { const result = inputs(...args); if (callback === "inputs" && !paused) { paused = true; h.runtime.pause(); } else armed = true; return result; };
      if (callback === "authority") h.runtime.options.authority = () => { const result = authority(); if (armed && !paused) { paused = true; h.runtime.pause(); } return result; };
      await h.step(); graphEvidence("PAUSE_CONFIGURED_CALLBACK", h, { callback, pauseCallbackRan: paused, delegatesActualOriginalAuthority: true, noPrivateMethodInjection: true });
      expect(paused).toBe(true); expect(h.runtime.view().status).toBe("paused"); expect(h.host.submissions).toHaveLength(0); expect(claims(h)).toHaveLength(0);
    } finally { h.close(); }
  });

  test("pause during awaited public input-access check prevents subsequent pin and admission", async () => {
    const source = snapshotFixture(1), request = preparationV2(source, 1), content = "explicit synthetic checked input", file = join(dirname(fixturePath()), "synthetic-pause-check.asm");
    request.inputsByFunction[source.nodes[0]!.id] = [{ path: file, sha256: hash(content), version: "offline-pause-v1", kind: "native", provenance: "synthetic fixture content, not native ASM validation" }];
    const h = graphHarness(request), entered = deferred(), release = deferred(), read = h.host.access.read; let pending: Promise<unknown> | undefined;
    h.host.files.set(file, content); h.host.access.read = async (...args) => { entered.resolve(); await release.promise; return read(...args); };
    try {
      h.start(); pending = h.step(); await entered.promise; h.runtime.pause(); release.resolve(); await pending;
      graphEvidence("PAUSE_DURING_INPUT_AWAIT", h, { inputAccessActuallyEntered: true, checkedSyntheticPath: file });
      expect(h.runtime.view().status).toBe("paused"); expect(h.host.submissions).toHaveLength(0); expect(claims(h)).toHaveLength(0);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "admission_inputs_frozen")).toHaveLength(0);
    } finally { release.resolve(); await pending?.catch(() => undefined); h.close(); }
  });

  test("pause triggered by observing accepted A blocks the next PREPARED B despite the old step journal", async () => {
    const h = freshGraph(2), actualSubmit = h.host.executions.submit, actualObserve = h.host.executions.observe; let sends = 0, paused = false;
    setPort(h, { submit: async (m, command) => { if (++sends === 2) h.host.submissionFailures.push("quota"); return actualSubmit(m, command); },
      observe: async record => { const observation = await actualObserve(record); if (!paused && record.intent.role === "A") { paused = true; h.runtime.pause(); } return observation; } });
    try {
      h.start(); await h.step(); const b = h.runtime.view().intents.find(r => r.intent.role === "B")!;
      expect(h.runtime.options.graph.admission(b.intent.executionId)?.state).toBe("PREPARED"); h.advance(1000); await h.step();
      graphEvidence("PAUSE_BETWEEN_OBSERVATIONS", h, { pauseInsideExistingObserver: paused });
      expect(paused).toBe(true); expect(h.host.submissions).toHaveLength(2); expect(h.runtime.options.graph.admission(b.intent.executionId)?.state).toBe("PREPARED");
      expect(h.runtime.view().resultIds).toHaveLength(1); expect(h.host.publications).toHaveLength(0);
    } finally { h.close(); }
  });

  for (const lostReply of [false, true]) test(`already-entered public port survives pause and retains its real result (lostReply=${lostReply})`, async () => {
    const h = freshGraph(), entered = deferred(), release = deferred(), actual = h.host.executions.submit; let pending: Promise<unknown> | undefined;
    setPort(h, { submit: async (m, command) => {
      const sent = await outcome(() => actual(m, command)); entered.resolve(); await release.promise;
      if (sent.error) throw sent.error; return sent.value!;
    } });
    try {
      if (lostReply) h.host.submissionFailures.push("ambiguous"); h.start(); pending = h.step(); await entered.promise;
      expect(h.host.receipts.size).toBe(1); h.runtime.pause(); release.resolve(); await pending;
      const record = h.runtime.view().intents[0]!, firstState = h.runtime.options.graph.admission(record.intent.executionId)?.state;
      await h.step(); graphEvidence("PAUSE_ALREADY_ENTERED_PORT", h, { lostReply, firstState, actualPortEntryPrecededPause: true, externalAtomicCancellationClaimed: false });
      expect(firstState).toBe(lostReply ? "AMBIGUOUS" : "ACCEPTED"); expect(h.host.submissions).toHaveLength(1);
      expect(h.runtime.view().resultIds).toHaveLength(1); expect(h.runtime.options.graph.admission(record.intent.executionId)?.state).toBe("TERMINAL");
      expect(h.runtime.view().intents).toHaveLength(1); expect(h.host.publications).toHaveLength(0);
    } finally { release.resolve(); await pending?.catch(() => undefined); h.close(); }
  });

  for (const state of ["absent", "unknown"] as const) test(`AMBIGUOUS ${state} readback during pause is not refund, resubmit or release`, async () => {
    const h = freshGraph(); let observed = 0;
    setPort(h, { observe: async record => { observed++; return { inspection: { status: "pending", executionId: record.intent.executionId },
      admissionObservation: { executionId: record.intent.executionId, requestDigest: fingerprint(record.admission), state, receipt: null, proof: "instantaneous offline observer only, no quiescence or absence-over-time proof" } }; } });
    try {
      h.host.submissionFailures.push("ambiguous"); h.start(); await h.step(); const record = h.runtime.view().intents[0]!, beforeClaims = canonical(claims(h));
      h.runtime.pause(); h.advance(1000); await h.step(); graphEvidence("PAUSED_AMBIGUOUS_NONPOSITIVE", h, { state, observerCalls: observed });
      expect(observed).toBeGreaterThan(0); expect(h.runtime.options.graph.admission(record.intent.executionId)?.state).toBe("AMBIGUOUS");
      expect(h.runtime.options.graph.admission(record.intent.executionId)?.attempts).toBe(1); expect(h.host.submissions).toHaveLength(1);
      expect(h.runtime.options.graph.leases.get(h.missionId, record.unitId)?.state).toBe("active"); expect(canonical(claims(h))).toBe(beforeClaims);
    } finally { h.close(); }
  });

  test("accepted A+B results are observed while pause prevents a newly ready R", async () => {
    const h = freshGraph(2);
    try {
      h.start(); await h.step(); h.runtime.pause(); await h.step(); graphEvidence("PAUSED_AUTHORS_OBSERVED_NO_R", h);
      expect(h.runtime.view().resultIds).toHaveLength(2); expect(h.runtime.view().intents.map(r => r.intent.role).sort()).toEqual(["A", "B"]);
      expect(h.host.submissions).toHaveLength(2); expect(h.host.publications).toHaveLength(0); expect(h.runtime.options.graph.leases.get(h.missionId, h.runtime.view().units[0]!.unitId)?.state).toBe("active");
    } finally { h.close(); }
  });

  test("fully accepted family can publish, read back and release normally during pause", async () => {
    const h = freshGraph(2);
    try {
      h.start(); await h.step(); await h.step(); expect(h.host.submissions).toHaveLength(3); h.runtime.pause(); await h.step(); graphEvidence("PAUSED_EXISTING_FAMILY_FINISHES", h);
      expect(h.runtime.view().status).toBe("complete"); expect(h.runtime.view().resultIds).toHaveLength(3); expect(h.host.submissions).toHaveLength(3);
      expect(h.host.publications).toHaveLength(1); expect(h.runtime.options.graph.leases.get(h.missionId, h.runtime.view().units[0]!.unitId)?.state).toBe("released");
      expect(h.runtime.view().nativeVerified).toBe(false); expect(h.runtime.view().scientificAuthority).toBe(false);
    } finally { h.close(); }
  });

  test("a real quarantined family fence still retains late ineligible results while paused", async () => {
    const h = freshGraph();
    try {
      h.start(); await h.step(); const graph = h.runtime.options.graph, record = h.runtime.view().intents[0]!, lease = graph.leases.get(h.missionId, record.unitId)!;
      graph.leases.quarantine(h.runtime.options.authority(), lease, "explicit fixture fence change before late observation; not native quiescence");
      h.runtime.pause(); await h.step(); graphEvidence("PAUSED_FENCED_LATE_RESULT", h);
      expect(h.runtime.view().lateResultIds).toHaveLength(1); expect(h.runtime.view().resultIds).toHaveLength(0); expect(h.host.submissions).toHaveLength(1);
      expect(claims(h)).toHaveLength(1); expect(h.host.publications).toHaveLength(0); expect(graph.leases.get(h.missionId, record.unitId)?.state).toBe("quarantined");
    } finally { h.close(); }
  });

  test("STOP_PENDING accepted work remains observed without pause inventing quiescence or a release", async () => {
    const h = freshGraph(); let observed = 0;
    setPort(h, { observe: async record => { observed++; return h.host.executions.observe(record); } });
    try {
      h.start(); await h.step(); const record = h.runtime.view().intents[0]!, graph = h.runtime.options.graph;
      const run = preparedGraphRun(graph, h.missionId)!, unit = run.prepared.planning.units.find(u => u.unitId === record.unitId)!; h.host.holds.add(unit.ownedFunctionIds[0]!);
      graph.transition(h.runtime.options.authority(), record.unitId, "STOP_PENDING", "explicit fixture stop pending, worker not proven terminal");
      h.runtime.pause(); await h.step(); graphEvidence("PAUSED_STOP_PENDING", h, { observerCalls: observed });
      expect(observed).toBeGreaterThan(0); expect(graph.unit(h.missionId, record.unitId).state).toBe("STOP_PENDING"); expect(graph.admission(record.intent.executionId)?.state).toBe("ACCEPTED");
      expect(graph.leases.get(h.missionId, record.unitId)?.state).toBe("active"); expect(h.host.submissions).toHaveLength(1); expect(h.runtime.view().resultIds).toHaveLength(0);
    } finally { h.close(); }
  });

  test("completed inspection without the required terminal proof stays ineligible during pause", async () => {
    const h = freshGraph(); let observed = 0;
    setPort(h, { observe: async record => { observed++; const { terminalProof: _omitted, ...observation } = await h.host.executions.observe(record); return observation; } });
    try {
      h.start(); await h.step(); h.runtime.pause(); const result = await outcome(() => h.step());
      graphEvidence("PAUSED_MISSING_TERMINAL_PROOF", h, { observerCalls: observed, error: result.error ? String(result.error) : null });
      expect(observed).toBeGreaterThan(0); expect(String(result.error)).toContain("terminal result requires configured observer's proof");
      expect(h.runtime.view().resultIds).toHaveLength(0); expect(h.host.publications).toHaveLength(0); expect(h.host.submissions).toHaveLength(1);
    } finally { h.close(); }
  });
});
