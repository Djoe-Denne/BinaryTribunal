/** Pure contract DATA only. No fixture-driver, database, SDK, host or native proof. */
import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  EXECUTION_PORT_VERSION_V1 as version, captureExecutionCommandV1, assertExactExecutionRetryV1,
  captureExecutionObservationV1, captureExecutionControlV1, summarizeExecutionObservationsV1,
  type ExecutionByteRefV1, type ExecutionDigestDomainV1, type ExecutionCommandV1,
  type CapturedExecutionCommandV1, type ExecutionCodecV1, type ExecutionPortV1,
  type ExecutionAdmissionDeclarationV1, type CapturedExecutionDataV1,
} from "../../src/ports/execution";

const codec: ExecutionCodecV1 = { sha256: bytes => createHash("sha256").update(bytes).digest("hex") };
function byteRef<D extends ExecutionDigestDomainV1>(domain: D, text: string): ExecutionByteRefV1<D> {
  return { domain, byteLength: Buffer.byteLength(text, "utf8"), sha256: createHash("sha256").update(text, "utf8").digest("hex") };
}
function evidence(recordId = "synthetic-not-native") { return { source: "pure-test-DATA", recordId, bytes: byteRef("execution-evidence-v1", "reference-only") }; }
function command(): ExecutionCommandV1 {
  return { version, kind: "execute", identity: { missionId: "m", unitId: "u", subIntentId: "s", executionId: "e", generationId: "g", attemptId: "a", idempotencyKey: "k" }, fences: { family: 7, controller: 3 },
    retainedInput: { utf8: "é\r\n😀", ref: byteRef("rms-retained-input-v1", "é\r\n😀") },
    proposedRuntimeInput: { utf8: "é\r\n😀", ref: byteRef("rms-proposed-runtime-input-v1", "é\r\n😀") },
    expectations: { profile: "independent-author", modelRef: { providerID: "openai", id: "declared-model-only", variant: "high" }, context: { fresh: true, parentSessionId: null, independenceRef: evidence("expected-independence") }, permissionsRef: evidence("expected-permissions"), policyRef: evidence("expected-policy") },
    captureCaps: { maxCommandImageUtf8Bytes: 100000, maxObservationImageUtf8Bytes: 100000, maxControlImageUtf8Bytes: 100000 } };
}
function target(c: CapturedExecutionCommandV1) { return { identity: { ...c.value.identity }, fences: { ...c.value.fences }, commandRef: { ...c.image.ref } }; }
function observation(c: CapturedExecutionCommandV1, kind: string, payload: Record<string, unknown> = {}, eventId = "event-1"): Record<string, unknown> & ReturnType<typeof target> & { sourceStreamId: string; eventId: string; sourceSequence: number } {
  return { version, ...target(c), sourceStreamId: "stream-1", eventId, sourceSequence: 1, evidenceRefs: [evidence()], kind, ...payload };
}
function control(c: CapturedExecutionCommandV1) {
  return { version, kind: "control", ...target(c), controlId: "stop-1", action: "stop", sequence: 1, expectedRevision: 0, reason: "explicit DATA request" };
}
function captured() { return captureExecutionCommandV1(command(), codec); }
function admission(c: CapturedExecutionCommandV1): CapturedExecutionDataV1<ExecutionAdmissionDeclarationV1, "rms-observation-v1"> {
  const o = captureExecutionObservationV1(c, observation(c, "accepted", { receiptRef: evidence("receipt") }), codec);
  if (o.value.kind !== "accepted") throw new Error("test admission declaration");
  return { value: o.value, image: o.image };
}

test("literal UTF-8 bytes, CRLF and independent SHA vector; complete command image is measured", () => {
  const c = captured();
  expect(c.value.retainedInput.ref.byteLength).toBe(8);
  expect(c.value.retainedInput.ref.sha256).toBe("a0c8bd5ea1b67299e862358d5f32e447d3fdfdfb66bf70162fa2630b359788c1");
  expect(c.value.retainedInput.utf8).toBe("é\r\n😀");
  expect(byteRef("execution-result-v1", "abc").sha256).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  expect(c.image.ref).toEqual(byteRef("rms-command-v1", c.image.utf8));
  expect(c.image.ref.byteLength).toBe(Buffer.byteLength(JSON.stringify(command()), "utf8"));
  expect(c.image.ref.byteLength).toBeGreaterThan(c.value.retainedInput.ref.byteLength);
  expect(c.value.retainedInput.ref.sha256).toBe(c.value.proposedRuntimeInput.ref.sha256);
  expect(c.value.retainedInput.ref.domain).not.toBe(c.value.proposedRuntimeInput.ref.domain);
}, 15000);

test("capture copies and freezes nested DATA; codec mutation of original or byte argument cannot change captured image", () => {
  const raw = command(); let calls = 0;
  const mutating: ExecutionCodecV1 = { sha256(bytes) {
    const digest = codec.sha256(bytes); bytes.fill(0); calls++;
    raw.identity.executionId = "mutated"; raw.expectations.modelRef.variant = "changed";
    raw.expectations.context.independenceRef.recordId = "changed";
    raw.retainedInput.utf8 = "changed";
    return digest;
  } };
  const c = captureExecutionCommandV1(raw, mutating);
  expect(calls).toBeGreaterThan(0);
  expect(c.value.identity.executionId).toBe("e");
  expect(c.value.expectations.modelRef.variant).toBe("high");
  expect(c.value.expectations.context.independenceRef.recordId).toBe("expected-independence");
  expect(c.value.retainedInput.utf8).toBe("é\r\n😀");
  expect(Object.isFrozen(c.value.expectations.context.independenceRef.bytes)).toBe(true);
  expect(Object.isFrozen(c.image)).toBe(true);
  expect(() => { Object.assign(c.value.identity, { executionId: "forged" }); }).toThrow();
  expect(c.image.ref).toEqual(byteRef("rms-command-v1", c.image.utf8));
}, 15000);

test("exact replay checks immutable image without authorizing send; every divergence refuses", () => {
  const c = captured(), equivalent = command();
  expect(assertExactExecutionRetryV1(c, equivalent, codec)).toEqual(c);
  for (const mutate of [
    (x: ExecutionCommandV1) => { x.identity.attemptId = "other"; },
    (x: ExecutionCommandV1) => { x.identity.generationId = "other"; },
    (x: ExecutionCommandV1) => { x.fences.controller++; },
    (x: ExecutionCommandV1) => { x.expectations.profile = "other"; },
    (x: ExecutionCommandV1) => { x.captureCaps.maxObservationImageUtf8Bytes--; },
    (x: ExecutionCommandV1) => { x.proposedRuntimeInput = { utf8: "other", ref: byteRef("rms-proposed-runtime-input-v1", "other") }; },
  ]) { const next = command(); mutate(next); expect(() => assertExactExecutionRetryV1(c, next, codec)).toThrow("replay conflict"); }
  const forged = { value: c.value, image: { utf8: c.image.utf8 + " ", ref: c.image.ref } };
  expect(() => assertExactExecutionRetryV1(forged, command(), codec)).toThrow();
  const candidate = command();
  const mutating: ExecutionCodecV1 = { sha256(bytes) { candidate.identity.attemptId = "during-old-image-check"; return codec.sha256(bytes); } };
  expect(assertExactExecutionRetryV1(c, candidate, mutating)).toEqual(c);
}, 15000);

test("closed DTOs reject authority fields, old versions, accessors, exotic objects and invalid UTF-8 without calling getters", () => {
  for (const extra of [{ sessionId: "payload-is-not-actor" }, { verified: true }, { actor: "forged" }]) expect(() => captureExecutionCommandV1({ ...command(), ...extra }, codec)).toThrow("closed DTO");
  expect(() => captureExecutionCommandV1({ ...command(), version: "l8-fixture-admission-codec-v2" }, codec)).toThrow();
  expect(() => captureExecutionCommandV1({ ...command(), version: "l8-graph-run-v3" }, codec)).toThrow();
  let getterCalls = 0;
  const raw = command(); Object.defineProperty(raw.identity, "executionId", { enumerable: true, get() { getterCalls++; return "e"; } });
  expect(() => captureExecutionCommandV1(raw, codec)).toThrow("accessor"); expect(getterCalls).toBe(0);
  expect(() => captureExecutionCommandV1(Object.assign(Object.create({ inherited: true }), command()), codec)).toThrow("plain DTO");
  const unicode = command(); unicode.identity.unitId = "\uD800";
  expect(() => captureExecutionCommandV1(unicode, codec)).toThrow("surrogate");
  const wrongFresh = { ...command(), expectations: { ...command().expectations, context: { fresh: true, parentSessionId: "payload-session", independenceRef: evidence() } } };
  expect(() => captureExecutionCommandV1(wrongFresh, codec)).toThrow("fresh independent");
  for (const cap of [0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const x = command(); x.captureCaps.maxCommandImageUtf8Bytes = cap;
    expect(() => captureExecutionCommandV1(x, codec)).toThrow();
  }
  const mismatch = command(); mismatch.retainedInput.ref.byteLength++;
  expect(() => captureExecutionCommandV1(mismatch, codec)).toThrow("bytes/digest");
}, 15000);

test("runtime/provider domains stay distinct and unknown; actual different delivery remains auditable", () => {
  const c = captured(), raw = observation(c, "delivery-observed", {
    deliveredInput: { utf8: "different actual bytes", ref: byteRef("runtime-delivered-input-v1", "different actual bytes") },
    runtimeInvocationRef: null, providerRequestRef: null, hostIdentityRef: null, modelRef: null, permissionsRef: null, authorIdentityRef: null, contextRef: null,
  });
  const o = captureExecutionObservationV1(c, raw, codec);
  if (o.value.kind !== "delivery-observed") throw new Error("test kind");
  expect(o.value.runtimeInvocationRef).toBeNull(); expect(o.value.providerRequestRef).toBeNull();
  expect(o.value.hostIdentityRef).toBeNull(); expect(o.value.modelRef).toBeNull();
  expect(o.value.deliveredInput.utf8).toBe("different actual bytes");
  const audit = summarizeExecutionObservationsV1(c, [o], target(c), codec);
  expect(audit.conflicts).toEqual([{ kind: "delivery-input-mismatch", indices: [0] }]);
  expect(() => captureExecutionObservationV1(c, { ...raw, runtimeInvocationRef: c.image.ref }, codec)).toThrow("runtime-invocation-v1");
  expect(() => captureExecutionObservationV1(c, { ...raw, providerRequestRef: byteRef("runtime-invocation-v1", "actual invocation DATA") }, codec)).toThrow("provider-request-v1");
  const measured = captureExecutionObservationV1(c, { ...raw, runtimeInvocationRef: byteRef("runtime-invocation-v1", "actual invocation DATA"), providerRequestRef: byteRef("provider-request-v1", "provider DATA") }, codec);
  expect(measured.value.kind).toBe("delivery-observed");
}, 15000);

test("foreign delivery is audited without comparing another command's proposed bytes", () => {
  const retained = captured(), rawForeign = command(), foreignText = "another command's input";
  rawForeign.identity.executionId = "foreign-execution";
  rawForeign.identity.idempotencyKey = "foreign-key";
  rawForeign.proposedRuntimeInput = { utf8: foreignText, ref: byteRef("rms-proposed-runtime-input-v1", foreignText) };
  const foreign = captureExecutionCommandV1(rawForeign, codec);
  const frame = captureExecutionObservationV1(retained, observation(foreign, "delivery-observed", {
    deliveredInput: { utf8: foreignText, ref: byteRef("runtime-delivered-input-v1", foreignText) },
    runtimeInvocationRef: null, providerRequestRef: null, hostIdentityRef: null, modelRef: null,
    permissionsRef: null, authorIdentityRef: null, contextRef: null,
  }), codec);
  const audit = summarizeExecutionObservationsV1(retained, [frame], target(retained), codec);
  expect(audit.declarations[0]?.disposition).toBe("audit-only");
  expect(audit.declarations[0]?.differences).toContain("identity.executionId");
  expect(audit.conflicts.filter(conflict => conflict.kind === "delivery-input-mismatch")).toEqual([]);
}, 15000);

test("complete scope includes every identity component, command ref and BOTH fences; foreign and same-generation stale events are audit-only", () => {
  const c = captured(), o = admission(c);
  for (const key of Object.keys(c.value.identity)) {
    const current = target(c); Reflect.set(current.identity, key, "different");
    const audit = summarizeExecutionObservationsV1(c, [o], current, codec);
    expect(audit.declarations[0].disposition).toBe("audit-only"); expect(audit.declarations[0].differences).toContain(`identity.${key}`);
  }
  for (const key of ["family", "controller"] as const) {
    const current = target(c); current.fences[key]++;
    const audit = summarizeExecutionObservationsV1(c, [o], current, codec);
    expect(audit.declarations[0].disposition).toBe("audit-only"); expect(audit.declarations[0].differences).toContain(`fences.${key}`);
    expect(audit.declarations[0].observation.value.identity.generationId).toBe("g");
  }
  const current = target(c); current.commandRef.sha256 = "0".repeat(64);
  expect(summarizeExecutionObservationsV1(c, [o], current, codec).declarations[0].differences).toContain("commandRef");
  const foreign = observation(c, "ambiguous", { reason: "foreign DATA" }); foreign.identity.executionId = "foreign";
  const audited = summarizeExecutionObservationsV1(c, [captureExecutionObservationV1(c, foreign, codec)], target(c), codec);
  expect(audited.declarations[0].disposition).toBe("audit-only");
  expect(c.value.identity.executionId).toBe("e"); expect(c.value.fences).toEqual({ family: 7, controller: 3 });
}, 15000);

test("source-local duplicates, image divergences and sequence collisions retain all original images, without global ordering", () => {
  const c = captured();
  const a = observation(c, "ambiguous", { reason: "lost response" });
  const divergent = { ...a, reason: "different declaration" };
  const otherStream = { ...a, sourceStreamId: "stream-2" };
  const collision = { ...a, eventId: "other-event" };
  const earlier = { ...a, sourceStreamId: "stream-2", sourceSequence: 9, eventId: "earlier-arrival-higher-sequence" };
  const observations = [a, a, divergent, otherStream, collision, earlier].map(x => captureExecutionObservationV1(c, x, codec));
  const audit = summarizeExecutionObservationsV1(c, observations, target(c), codec);
  expect(audit.declarations).toHaveLength(6);
  expect(audit.duplicates).toEqual([{ sourceStreamId: "stream-1", eventId: "event-1", originalIndex: 0, duplicateIndex: 1 }]);
  expect(audit.conflicts.filter(x => x.kind === "event-image-divergence")).toHaveLength(2);
  expect(audit.conflicts.filter(x => x.kind === "source-sequence-collision")).toHaveLength(3);
  expect(audit.conflicts.every(x => !x.indices.includes(3) && !x.indices.includes(5))).toBe(true);
  expect(audit.declarations.map(x => x.observation.image)).toEqual(observations.map(x => x.image));
  expect(Object.isFrozen(audit.conflicts)).toBe(true);
}, 15000);

test("lost response, before-target-effect refusal, result and reported quiescence are distinct declarations; conflicts are never last-wins", () => {
  const c = captured();
  const raw = [
    observation(c, "ambiguous", { reason: "response lost after possible target entry" }, "lost"),
    observation(c, "absence-reported", { report: "absent", reason: "no row in this report" }, "absent"),
    observation(c, "result-received", { result: { utf8: "exact result\r\n", ref: byteRef("execution-result-v1", "exact result\r\n") } }, "result"),
  ];
  let observations = raw.map(x => captureExecutionObservationV1(c, x, codec));
  const incomplete = summarizeExecutionObservationsV1(c, observations, target(c), codec);
  expect(incomplete.declarations.map(x => x.observation.value.kind)).toEqual(["ambiguous", "absence-reported", "result-received"]);
  expect(Object.keys(incomplete).sort()).toEqual(["conflicts", "declarations", "duplicates"]);
  const refused = observation(c, "rejected-definitive", { reason: "declared target not entered", beforeEffect: { scope: "before-any-native-command-effect", evidenceRefs: [evidence("before-target-effect")] } }, "refusal");
  const quiet = observation(c, "quiescence-reported", { reason: "reported by source only", terminalEvidenceRefs: [evidence("terminal-claim")] }, "terminal");
  observations = [...observations, captureExecutionObservationV1(c, refused, codec), captureExecutionObservationV1(c, quiet, codec)];
  const audit = summarizeExecutionObservationsV1(c, observations, target(c), codec);
  expect(audit.declarations).toHaveLength(5);
  expect(audit.conflicts.filter(x => x.kind === "admission-declaration-conflict")).toEqual([
    { kind: "admission-declaration-conflict", indices: [2, 3] }, { kind: "admission-declaration-conflict", indices: [3, 4] },
  ]);
  expect(() => captureExecutionObservationV1(c, { ...refused, beforeEffect: { scope: "before-prompt-only", evidenceRefs: [evidence()] } }, codec)).toThrow();
  expect(() => captureExecutionObservationV1(c, { ...quiet, terminalEvidenceRefs: [] }, codec)).toThrow("evidence");
  expect(() => captureExecutionObservationV1(c, observation(c, "unavailable-before-effect", { reason: "no evidence" }), codec)).toThrow();
}, 15000);

test("control requests preserve original generation/fences; order and CAS are data, and late observations remain auditable", () => {
  const c = captured(), raw = control(c), originalImage = c.image.utf8;
  const obsolete = captureExecutionControlV1(c, { ...raw, action: "obsolete", sequence: 2, expectedRevision: 7 }, codec);
  const prior = captureExecutionControlV1(c, raw, codec);
  expect(obsolete.value.identity).toEqual(c.value.identity); expect(prior.value.sequence).toBe(1);
  expect(obsolete.value.sequence).toBe(2); expect(obsolete.value.expectedRevision).toBe(7);
  expect(c.image.utf8).toBe(originalImage);
  const refreshed = { ...raw, fences: { family: 8, controller: 3 } };
  expect(() => captureExecutionControlV1(c, refreshed, codec)).toThrow("control target conflict");
  expect(() => captureExecutionControlV1(c, { ...raw, sequence: 0 }, codec)).toThrow();
  const current = target(c); current.identity.generationId = "next-generation";
  const late = summarizeExecutionObservationsV1(c, [admission(c)], current, codec);
  expect(late.declarations[0].disposition).toBe("audit-only");
  expect(late.declarations[0].observation.value.identity.generationId).toBe("g");
}, 15000);

test("capture caps cover complete escaped UTF-8 command, observation and control images, including identities and refs", () => {
  const small = command(); small.captureCaps.maxCommandImageUtf8Bytes = 100;
  expect(Buffer.byteLength(small.retainedInput.utf8, "utf8")).toBeLessThan(100);
  expect(() => captureExecutionCommandV1(small, codec)).toThrow("complete image");
  const exact = command();
  for (let i = 0; i < 4; i++) exact.captureCaps.maxCommandImageUtf8Bytes = Buffer.byteLength(JSON.stringify(exact), "utf8");
  const c = captureExecutionCommandV1(exact, codec);
  expect(c.image.ref.byteLength).toBe(exact.captureCaps.maxCommandImageUtf8Bytes);
  exact.captureCaps.maxCommandImageUtf8Bytes--;
  expect(() => captureExecutionCommandV1(exact, codec)).toThrow("complete image");
  for (const part of ["observation", "control"] as const) {
    const x = command();
    if (part === "observation") x.captureCaps.maxObservationImageUtf8Bytes = 100;
    else x.captureCaps.maxControlImageUtf8Bytes = 100;
    const constrained = captureExecutionCommandV1(x, codec);
    const action = () => part === "observation"
      ? captureExecutionObservationV1(constrained, observation(constrained, "ambiguous", { reason: "\n\"😀\r\n" }), codec)
      : captureExecutionControlV1(constrained, control(constrained), codec);
    expect(action).toThrow("complete image");
  }
  const bigIdentity = command(); bigIdentity.identity.unitId = "é".repeat(4000); bigIdentity.captureCaps.maxCommandImageUtf8Bytes = 5000;
  expect(() => captureExecutionCommandV1(bigIdentity, codec)).toThrow("complete image");
}, 15000);

test("observation/control complete-image caps accept the exact byte boundary and refuse one byte less", () => {
  for (const part of ["observation", "control"] as const) {
    const rawCommand = command();
    for (let i = 0; i < 4; i++) {
      const c = captureExecutionCommandV1(rawCommand, codec);
      const raw = part === "observation" ? observation(c, "ambiguous", { reason: "é\r\n\"😀" }) : { ...control(c), reason: "é\r\n\"😀" };
      const bytes = Buffer.byteLength(JSON.stringify(raw), "utf8");
      if (part === "observation") rawCommand.captureCaps.maxObservationImageUtf8Bytes = bytes;
      else rawCommand.captureCaps.maxControlImageUtf8Bytes = bytes;
    }
    const c = captureExecutionCommandV1(rawCommand, codec);
    const raw = part === "observation" ? observation(c, "ambiguous", { reason: "é\r\n\"😀" }) : { ...control(c), reason: "é\r\n\"😀" };
    const completeBytes = Buffer.byteLength(JSON.stringify(raw), "utf8");
    const accepted = part === "observation" ? captureExecutionObservationV1(c, raw, codec) : captureExecutionControlV1(c, raw, codec);
    expect(accepted.image.ref.byteLength).toBe(completeBytes);
    expect(accepted.image.ref).toEqual(byteRef(part === "observation" ? "rms-observation-v1" : "rms-control-v1", JSON.stringify(raw)));
    if (part === "observation") {
      expect(rawCommand.captureCaps.maxObservationImageUtf8Bytes).toBe(completeBytes);
      rawCommand.captureCaps.maxObservationImageUtf8Bytes--;
    } else {
      expect(rawCommand.captureCaps.maxControlImageUtf8Bytes).toBe(completeBytes);
      rawCommand.captureCaps.maxControlImageUtf8Bytes--;
    }
    const below = captureExecutionCommandV1(rawCommand, codec);
    expect(() => part === "observation"
      ? captureExecutionObservationV1(below, observation(below, "ambiguous", { reason: "é\r\n\"😀" }), codec)
      : captureExecutionControlV1(below, { ...control(below), reason: "é\r\n\"😀" }, codec)).toThrow("complete image");
  }
}, 15000);

test("observations require explicit unknowns and reject accessor arrays, holes and payload authority", () => {
  const c = captured(), raw = observation(c, "ambiguous", { reason: "DATA" });
  expect(() => captureExecutionObservationV1(c, { ...raw, verified: true }, codec)).toThrow("closed DTO");
  let reads = 0;
  const accessor = [evidence()]; Object.defineProperty(accessor, "0", { enumerable: true, get() { reads++; return evidence(); } });
  expect(() => captureExecutionObservationV1(c, { ...raw, evidenceRefs: accessor }, codec)).toThrow("array accessor"); expect(reads).toBe(0);
  expect(() => captureExecutionObservationV1(c, { ...raw, evidenceRefs: new Array(1) }, codec)).toThrow("holes");
  expect(() => captureExecutionObservationV1(c, { ...raw, sourceSequence: 0 }, codec)).toThrow();
  const missingUnknowns = observation(c, "delivery-observed", { deliveredInput: { utf8: "x", ref: byteRef("runtime-delivered-input-v1", "x") } });
  expect(() => captureExecutionObservationV1(c, missingUnknowns, codec)).toThrow("closed DTO");
  for (const report of ["idle", "completed"] as const) {
    const o = captureExecutionObservationV1(c, observation(c, "absence-reported", { report, reason: "not terminal proof" }), codec);
    expect(summarizeExecutionObservationsV1(c, [o], target(c), codec).declarations[0].observation.value.kind).toBe("absence-reported");
  }
}, 15000);

test("observation/control capture detaches callers before command codec callbacks and rejects mutated captured envelopes", () => {
  const c = captured(), raw = observation(c, "ambiguous", { reason: "original" }), ctl = control(c);
  const mutating: ExecutionCodecV1 = { sha256(bytes) { raw.reason = "changed"; ctl.reason = "changed"; return codec.sha256(bytes); } };
  const o = captureExecutionObservationV1(c, raw, mutating);
  expect(o.value.kind === "ambiguous" && o.value.reason).toBe("original");
  ctl.reason = "control-original";
  expect(captureExecutionControlV1(c, ctl, mutating).value.reason).toBe("control-original");
  const fake = { value: o.value, image: { utf8: o.image.utf8 + " ", ref: o.image.ref } };
  expect(() => summarizeExecutionObservationsV1(c, [fake], target(c), codec)).toThrow();
  const events = [o], current = target(c);
  const duringSummary: ExecutionCodecV1 = { sha256(bytes) { events.length = 0; current.fences.family++; return codec.sha256(bytes); } };
  const summary = summarizeExecutionObservationsV1(c, events, current, duringSummary);
  expect(summary.declarations).toHaveLength(1); expect(summary.declarations[0].disposition).toBe("current");
}, 15000);

test("port exposes business operations without application authorization context", async () => {
  const c = captured(), ctl = captureExecutionControlV1(c, control(c), codec), calls: { operation: string }[] = [];
  const port: ExecutionPortV1 = {
    async capabilities() { calls.push({ operation: "capabilities" }); return { version, operations: ["submit", "observe", "reconcile", "control"], evidenceKinds: [], hostEvidenceRef: null }; },
    async submit(incoming) { calls.push({ operation: "submit" }); expect(incoming).toEqual(c); return admission(c); },
    async observe(request) { calls.push({ operation: "observe" }); expect(request.kind).toBe("observe-execution"); return []; },
    async reconcile(request) { calls.push({ operation: "reconcile" }); expect(request.kind).toBe("reconcile-admission"); return admission(c); },
    async control(incoming) { calls.push({ operation: "control" }); return { version, controlRef: incoming.image.ref, declaration: "recorded", evidenceRefs: [] }; },
  };
  expect((await port.capabilities()).hostEvidenceRef).toBeNull();
  await port.submit(c);
  expect(await port.observe({ version, kind: "observe-execution", ...target(c), cursors: [] })).toEqual([]);
  expect((await port.reconcile({ version, kind: "reconcile-admission", ...target(c), priorObservationRefs: [] })).value.kind).toBe("accepted");
  await port.control(ctl);
  expect(calls.map(x => x.operation)).toEqual(["capabilities", "submit", "observe", "reconcile", "control"]);
  expect(c.image.utf8).not.toContain('"actor"'); expect(c.image.utf8).not.toContain('"sessionId"');
}, 15000);
