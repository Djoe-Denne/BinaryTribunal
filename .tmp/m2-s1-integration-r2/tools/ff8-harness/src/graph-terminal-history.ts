/**108 Private synchronous OWN history reader. No sender, IO or public contract. */
import type { Database } from "bun:sqlite";
import type { BoundDocument, ByteRef, ParsedExecutionEnvelopeV1, IndependentlyLoadedSourcesV1 } from "./graph-execution-envelope";
import { bindExecutionSourcesV1 } from "./graph-execution-envelope";
import { EventLog, immutableCopy, invariant, type GraphEvent } from "./eventlog";
import { canonical, fingerprint } from "./validation";
import { captureAdmissionImageV3, verifyAdmissionImageV3, rootBudgetDataV3, safeRootSumV3 } from "./graph-generation-budget";
import { resourceDocumentV1, readResourceInventoryV1, checkResourceSourceV1 } from "./graph-resource-ledger";
import { assertFixtureRecordCurrentV1, readFixtureResourceCurrentV1 } from "./graph-fixture-records";
import type { FixtureObservationRecordV1 } from "./graph-trusted-authority";
import type { PreparedAdmissionV3 } from "./graph-generation-store";
import { replacementStage120, replacementForOld120, type ReplacementStageValue120, type ReplacementResult120 } from "./graph-generation-replacement";

export interface TerminalOutbox108 {
  execution_id: string; mission: string; generation: string; unit: string; sub_intent: string; root_id: string; slot_key: string;
  controller_fence: number; family_fence: number; admission_utf8: string; command_utf8: string; raw_sha: string; command_sha: string;
  request_digest: string; state: string; attempt: number; max_attempts: number; retry_delay: number; receipt: string | null; terminal_proof: string | null;
}
interface Domain108 { missionId: string; lineageId: string; rootAccountId: string; owner: string }
interface AuthorityRow108 { record_ref: string; kind: string; revision: number; document: string; digest: string; revoked: number }
interface Slot108 { root_id: string; slot_key: string; revision: number; state: string; grant_ref: string; cap: number; debit: number; claim_utf8: string | null }
interface Family108 { mission: string; generation: string; unit: string; owner: string; controller_fence: number; family_fence: number; expires_event: number; state: string }
export interface TerminalHistory108 {
  version: "l8-cross-epoch-terminal-history-cut-fixture-v1"; domain: Domain108; throughSequence: number; hostBinding: BoundDocument<{ version: string }>;
  families: Family108[]; outboxes: TerminalOutbox108[]; slots: Slot108[]; authority: AuthorityRow108[]; workEvents: GraphEvent[];
  unitSources: { mission: string; generation: string; unit: string; document: string; digest: string }[];
  allocations: unknown[]; releases: GraphEvent[];
  disposition: "RETIRED_WITHOUT_SCIENTIFIC_EFFECT_NEVER_SENT";
}
const workKinds108 = new Set(["g3_family_reserved", "g3_resource_allocated", "g3_admission_prepared", "g3_slot_burned", "g3_fixture_observation", "g3_resource_released", "g3_family_released"]);
const controlKinds108 = new Set(["g3_bootstrap_fixture", "g3_initial_prepared", "g3_drain_entered", "g3_candidate_staged", "g3_activation_attempt", "g3_generation_activated", "g3_activation_outcome", "g3_replacement_prepared", "g3_candidate_replaced"]);
function exactDoc108<T extends { version: string }>(doc: BoundDocument<T>): T {
  const value = JSON.parse(doc.utf8) as T; invariant(canonical(resourceDocumentV1(value)) === canonical(doc), "HOLD: terminal history source bytes/ref mismatch"); return value;
}
export function readTerminalOutbox108(db: Database, id: string): TerminalOutbox108 {
  const row = db.query("SELECT * FROM g3_outbox WHERE execution_id=?").get(id) as TerminalOutbox108 | null; invariant(row, "unknown execution");
  const image = captureAdmissionImageV3(JSON.parse(row.admission_utf8));
  invariant(image.admissionUtf8 === row.admission_utf8 && image.commandUtf8 === row.command_utf8 && image.admissionRawSha256 === row.raw_sha
    && image.commandRawSha256 === row.command_sha && image.requestDigest === row.request_digest, "outbox image corruption"); return row;
}
/** Existing currentQ semantics shared without widening the sending branch. The
 * terminal crossEpoch collector below admits ONLY positive never-sent proofs. */
export function assertTerminalQ108(db: Database, events: EventLog, row: TerminalOutbox108, live = true, throughSequence = Number.MAX_SAFE_INTEGER): FixtureObservationRecordV1 {
  invariant(["TERMINAL", "REJECTED"].includes(row.state) && row.terminal_proof, "HOLD: every execution needs exact Q");
  const proof = JSON.parse(row.terminal_proof) as FixtureObservationRecordV1;
  const source = (value: FixtureObservationRecordV1) => {
    if (live) assertFixtureRecordCurrentV1(db, value);
    else { const retained = db.query("SELECT document,digest FROM g3_authority WHERE record_ref=?").get(`fixture:${fingerprint(value)}`) as { document: string; digest: string } | null;
      invariant(retained && retained.document === canonical(value) && retained.digest === fingerprint(value), "HOLD: committed Q source bytes changed"); }
  };
  source(proof); if (row.receipt) source(JSON.parse(row.receipt));
  invariant(proof.executionId === row.execution_id && proof.missionId === row.mission && proof.familyFence === row.family_fence
    && proof.controllerFence === row.controller_fence && proof.generationId === row.generation && proof.attempt === row.attempt && proof.requestDigest === row.request_digest, "Q scope mismatch");
  const observed = events.read(row.mission).filter(e => e.sequence <= throughSequence), event = observed.find(e => e.key === `observation:terminal:${fingerprint(proof)}`);
  invariant(event && ["TERMINAL", "REJECTED"].includes((event.payload as { effect: string }).effect)
    && canonical((event.payload as { proof: unknown }).proof) === canonical(proof), "missing durable Q event");
  invariant(!observed.some(e => e.kind === "g3_fixture_observation" && (e.payload as { proof: FixtureObservationRecordV1 }).proof.executionId === row.execution_id
    && (e.payload as { proof: FixtureObservationRecordV1 }).proof.state === "accepted" && (e.payload as { effect: string }).effect === "audit_only"), "HOLD: late accepted evidence contradicts Q");
  return proof;
}
/** Reads every family/outbox/root slot, not an active-only projection. Historical
 * mode is used ONLY with a previously committed cut and its retained horizon. */
export function collectTerminalHistory108(db: Database, events: EventLog, domain: Domain108, live = true, throughSequence = events.cursor(domain.missionId).sequence, consumed?: TerminalHistory108): TerminalHistory108 | null {
  // New control taxonomy is never authority by label alone. Resolve actual
  // committed stage/swap records before admitting them to the no-work branch.
  for (const event of events.read(domain.missionId).filter(e => e.sequence <= throughSequence)) {
    if (event.kind === "g3_replacement_prepared") {
      const value = event.payload as ReplacementStageValue120, stage = replacementStage120(db, events, value.newCandidateRef.generationId);
      invariant(stage && canonical(stage.value) === canonical(value), "HOLD: terminal unproven replacement preparation");
    } else if (event.kind === "g3_candidate_replaced") {
      const value = event.payload as ReplacementResult120, record = replacementForOld120(db, events, value.value.oldCandidateRef.generationId);
      invariant(record && canonical({ document: record.document, value: record.value, proofRef: record.proofRef }) === canonical(value), "HOLD: terminal unproven replacement swap");
    }
  }
  const families = db.query("SELECT * FROM g3_families ORDER BY mission,generation,unit").all() as Family108[];
  const outboxes = db.query("SELECT * FROM g3_outbox ORDER BY execution_id").all() as TerminalOutbox108[];
  const slots = db.query("SELECT * FROM g3_slots WHERE root_id=? ORDER BY slot_key").all(domain.rootAccountId) as Slot108[];
  if (!families.length && !outboxes.length) {
    invariant(!db.query("SELECT 1 FROM g3_claims").get() && !db.query("SELECT 1 FROM g3_authority WHERE kind='observation' LIMIT 1").get()
      && slots.every(s => s.state === "AUTHORIZED" && s.claim_utf8 === null)
      && events.read(domain.missionId).every(e => controlKinds108.has(e.kind)), "HOLD: terminal history absent but work/pins exist"); return null;
  }
  invariant(families.every(f => f.state === "RELEASED"), "HOLD: terminal history requires released families");
  invariant(families.length === 1 && outboxes.length === 1 && slots.length === 3 && !db.query("SELECT 1 FROM g3_claims").get(), "HOLD: terminal history outside admitted never-sent fixture");
  const bindingRow = db.query("SELECT document,digest FROM g3_authority WHERE record_ref='final-host-prebootstrap' AND kind='final-host-source'").get() as { document: string; digest: string } | null;
  invariant(bindingRow && bindingRow.digest === fingerprint(JSON.parse(bindingRow.document)), "HOLD: independent no-send HOST allocation missing");
  const hostBinding = JSON.parse(bindingRow.document) as BoundDocument<{ version: string }>;
  const host = exactDoc108(hostBinding) as { version: string; registry: BoundDocument<{ version: string }>; allocation: BoundDocument<{ version: string }> };
  const registry = exactDoc108(host.registry) as { version: string; domain: Domain108; producers: { producerId: string }[]; allocationRef: ByteRef };
  const allocation = exactDoc108(host.allocation) as { version: string; noExternalProducerAdmission: unknown; roster: string[]; terminalWorkProfile?: string };
  invariant(registry.domain.missionId === domain.missionId && registry.domain.lineageId === domain.lineageId && registry.domain.rootAccountId === domain.rootAccountId
    && registry.domain.owner === domain.owner && canonical(registry.allocationRef) === canonical(host.allocation.ref)
    && allocation.terminalWorkProfile === "never-sent-cross-epoch108" && canonical(allocation.roster) === canonical(["own-control92", "parent-policy-file92"])
    && canonical(allocation.noExternalProducerAdmission) === canonical({ executor: "NOT_ADMITTED", dispatcher: "NOT_ADMITTED", scientificPublisher: "NOT_ADMITTED", native: "NOT_ADMITTED" }), "HOLD: no-send closed producer/domain provenance mismatch");
  const allEvents = events.read(domain.missionId).filter(e => e.sequence <= throughSequence);
  invariant(allEvents.every(e => workKinds108.has(e.kind) || controlKinds108.has(e.kind)), "HOLD: terminal history has unadmitted operation/producer");
  const workEvents = allEvents.filter(e => workKinds108.has(e.kind)), authority: AuthorityRow108[] = [];
  const retain = (key: string) => {
    if (!live && key.startsWith("resource-current:")) {
      // A mutable current pointer may legitimately advance after a commit. Its
      // consumed bytes come ONLY from that committed cut, never reconstructed
      // by resetting today's revision/revocation or treating it as permission.
      const row = consumed?.authority.find(r => r.record_ref === key && r.kind === "resource-current");
      invariant(row && row.revoked === 0 && row.digest === fingerprint(JSON.parse(row.document)), "HOLD: consumed physical source-current bytes missing");
      if (!authority.some(r => r.record_ref === key)) authority.push(row); return row;
    }
    const row = db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(key) as AuthorityRow108 | null;
    invariant(row && row.digest === fingerprint(JSON.parse(row.document)) && (!live || !row.revoked), "HOLD: terminal history authority source missing/revoked");
    if (!authority.some(r => r.record_ref === key)) authority.push(row); return row;
  };
  const resource = (ref: ByteRef) => { const row = retain(`resource-source:${canonical(ref)}`), doc = JSON.parse(row.document);
    invariant(canonical(doc.ref) === canonical(ref), "HOLD: terminal resource source ref mismatch"); return checkResourceSourceV1(doc); };
  const family = families[0]!, originRow = db.query("SELECT document,digest FROM g3_origins WHERE mission=? AND generation=?").get(family.mission, family.generation) as { document: string; digest: string } | null;
  invariant(originRow && originRow.digest === fingerprint(JSON.parse(originRow.document)) && family.mission === domain.missionId && family.owner === domain.owner, "HOLD: terminal family origin/domain mismatch");
  const retained = JSON.parse(originRow.document) as { origin: ParsedExecutionEnvelopeV1; independent: IndependentlyLoadedSourcesV1 }, binding = bindExecutionSourcesV1(retained.origin, retained.independent);
  invariant(binding.ok, "HOLD: terminal source S1 binding failed"); const bound = binding.value;
  invariant(bound.origin.generationId === family.generation && bound.body.generation.lineageId === domain.lineageId && rootBudgetDataV3(bound).rootAccountId === domain.rootAccountId, "HOLD: terminal family root/lineage mismatch");
  const unit = bound.planning.units.find(u => u.unitId === family.unit); invariant(unit && unit.subIntents.length === 3, "HOLD: complete terminal subintent source required");
  const unitRow = db.query("SELECT * FROM g3_units WHERE mission=? AND generation=? AND unit=?").get(family.mission, family.generation, family.unit) as { mission: string; generation: string; unit: string; document: string; digest: string; state: string } | null;
  invariant(unitRow && ["CANCELLED", "RETIRED"].includes(unitRow.state) && unitRow.document === canonical(unit) && unitRow.digest === fingerprint(unit), "HOLD: terminal unit metadata/disposition mismatch");
  const unitSources = [{ mission: family.mission, generation: family.generation, unit: family.unit, document: unitRow.document, digest: unitRow.digest }];
  const grants = rootBudgetDataV3(bound).grants.grants, pins: PreparedAdmissionV3[] = [];
  for (const role of ["A", "B", "R"] as const) {
    const sub = unit.subIntents.find(s => s.role === role), grant = grants.find(g => g.slot.role === role);
    const slot = slots.find(s => JSON.parse(s.grant_ref).slot.role === role);
    invariant(sub && grant && slot && grant.functionId === sub.functionId && canonical(grant.slot.functionIdentity) === canonical(sub.harnessIdentity)
      && canonical(JSON.parse(slot.grant_ref)) === canonical(grant) && slot.root_id === domain.rootAccountId
      && slot.slot_key === canonical(grant.slot) && slot.cap === 100000 && slot.debit === 100000
      && slot.state === (role === "A" ? "SPENT" : role === "B" ? "BURNED" : "ENCUMBERED"), "HOLD: terminal root entitlement/grant mismatch");
    if (role === "R") { invariant(slot.claim_utf8 === null && !outboxes.some(r => r.sub_intent === sub.subIntentId), "HOLD: R was pinned/reassigned"); continue; }
    invariant(slot.claim_utf8, "HOLD: terminal pin bytes missing"); const pin = JSON.parse(slot.claim_utf8) as PreparedAdmissionV3, image = verifyAdmissionImageV3(pin.image);
    const body = JSON.parse(image.admissionUtf8) as { executionId: string; attemptId: string; subIntentId: string; role: string; idempotencyKey: string; command: unknown };
    invariant(pin.status === (role === "A" ? "PREPARED" : "BURNED") && pin.generationId === family.generation && pin.unitId === unit.unitId && pin.subIntentId === sub.subIntentId
      && pin.executionId === body.executionId && pin.attemptId === body.attemptId && body.subIntentId === sub.subIntentId && body.role === role && body.idempotencyKey === body.executionId
      && pin.cap === 100000 && bound.planning.sidecar.admissionBudget?.byUnit[unit.unitId]?.admissionCapUtf8Bytes.value === pin.cap
      && pin.reservedDebit === slot.debit && pin.grantRef === slot.grant_ref && pin.maxAttempts === bound.template.settings.maxAdmissionAttempts
      && pin.retryDelayMs === bound.template.settings.retryDelayMs && sub.waitsForSubIntentIds.length === 0, "HOLD: terminal immutable pin/IDs/C/policy mismatch");
    invariant(canonical(body.command) === canonical({ version: "l8-s2-bound-fixture-command-v1", scope: { missionId: domain.missionId, generationId: family.generation, rootAccountId: domain.rootAccountId, unitId: unit.unitId, subIntentId: sub.subIntentId, role },
      functionIdentity: grant.slot.functionIdentity, profile: bound.template.settings.profiles[role], model: bound.sourceSpec.models[role], sourceEnvelope: bound.origin.document }), "HOLD: terminal command/source mismatch");
    invariant(role === "A" ? image.admissionUtf8Bytes <= pin.cap : image.admissionUtf8Bytes > pin.cap, "HOLD: terminal body cap evidence mismatch");
    const event = workEvents.find(e => e.key === `admission:${domain.rootAccountId}:${slot.slot_key}`);
    invariant(event && event.kind === (role === "A" ? "g3_admission_prepared" : "g3_slot_burned") && event.unitId === family.unit && canonical(event.payload) === canonical(pin), "HOLD: terminal pin event mismatch");
    const acq = resource(pin.resourceSources.acquisitionRef), assignment = resource(pin.resourceSources.assignmentRef); resource(pin.resourceSources.remainingRef);
    invariant(acq.version === "l8-s2-resource-acquisition-fixture-v1" && assignment.version === "l8-s2-resource-assignment-fixture-v1"
      && assignment.executionId === pin.executionId && assignment.subIntentId === sub.subIntentId && assignment.role === role && assignment.workScope.generationId === family.generation
      && assignment.workScope.rootAccountId === domain.rootAccountId && assignment.workScope.unitId === family.unit && assignment.workScope.owner === family.owner
      && assignment.workScope.controllerFence === family.controller_fence && assignment.workScope.familyFence === family.family_fence
      && canonical(assignment.workScope.sourceEnvelopeRef) === canonical(bound.origin.document.ref), "HOLD: terminal resource assignment scope mismatch");
    pins.push(pin);
  }
  invariant(safeRootSumV3(slots.map(s => s.debit)) === 300000, "HOLD: terminal C/N/T accounting mismatch");
  const A = pins.find(p => p.status === "PREPARED")!, B = pins.find(p => p.status === "BURNED")!, row = readTerminalOutbox108(db, A.executionId);
  invariant(row.state === "TERMINAL" && row.attempt === 0 && row.receipt === null && row.root_id === domain.rootAccountId && row.generation === family.generation
    && row.slot_key === slots.find(s => s.state === "SPENT")!.slot_key
    && row.mission === family.mission && row.unit === family.unit && row.sub_intent === A.subIntentId && row.admission_utf8 === A.image.admissionUtf8
    && row.max_attempts === A.maxAttempts && row.retry_delay === A.retryDelayMs && row.controller_fence === family.controller_fence && row.family_fence === family.family_fence, "HOLD: positive never-sent outbox/pin scope required; sent branch requires S3");
  const proof = assertTerminalQ108(db, events, row, live, throughSequence);
  invariant(proof.state === "absent" && proof.quiescent && proof.owner === family.owner && proof.envelopeFingerprint === bound.origin.envelope.fingerprint, "HOLD: terminal never-sent HOST Q mismatch"); retain(`fixture:${fingerprint(proof)}`);
  if (live) {
    // A late HOST observation is already durable DATA when registered, even if
    // the retired controller cannot project it into today's generation. Never
    // require recycling that controller as current merely to notice the ACK.
    for (const source of db.query("SELECT record_ref,document,digest FROM g3_authority WHERE kind='observation'").all() as { record_ref: string; document: string; digest: string }[]) {
      invariant(source.digest === fingerprint(JSON.parse(source.document)), "HOLD: terminal observation registration corrupt");
      const observation = JSON.parse(source.document) as FixtureObservationRecordV1;
      invariant(!(observation.executionId === row.execution_id && observation.state === "accepted"), "HOLD: late accepted evidence contradicts Q");
      invariant(source.document === canonical(proof) && source.record_ref === `fixture:${fingerprint(proof)}`, "HOLD: terminal history observation source orphan/contradictory");
    }
  }
  invariant(workEvents.length === 7 && [...workKinds108].every(kind => workEvents.filter(e => e.kind === kind).length === 1), "HOLD: terminal work operations incomplete/orphan");
  const release = workEvents.find(e => e.kind === "g3_family_released" && (e.payload as { generationId: string; unitId: string; familyFence: number }).generationId === family.generation
    && (e.payload as { unitId: string; familyFence: number }).unitId === family.unit && (e.payload as { familyFence: number }).familyFence === family.family_fence);
  const reserve = workEvents.find(e => e.kind === "g3_family_reserved" && e.unitId === family.unit);
  invariant(release && reserve && release.key === `release:${family.family_fence}` && reserve.key === `family:${family.family_fence}`
    && release.unitId === family.unit && canonical(release.payload) === canonical(reserve.payload) && release.sequence > reserve.sequence, "HOLD: terminal exact reserve/release lease missing");
  const lease = release.payload as { owner: string; controllerFence: number; subIntents: unknown; expiresAtEvent: number };
  invariant(lease.owner === family.owner && lease.controllerFence === family.controller_fence && lease.expiresAtEvent === family.expires_event
    && canonical(lease.subIntents) === canonical(unit.subIntents), "HOLD: terminal lease/source/fences mismatch");
  const allocations: unknown[] = [], releases = workEvents.filter(e => e.kind === "g3_resource_released" || e.kind === "g3_family_released");
  for (const pool of new Set(pins.map(p => { const source = resource(p.resourceSources.acquisitionRef); invariant(source.version === "l8-s2-resource-acquisition-fixture-v1", "HOLD: terminal acquisition kind"); return source.poolScope.poolId; }))) {
    const inventory = readResourceInventoryV1(db, events, pool);
    const current = live ? readFixtureResourceCurrentV1(db, pool) : JSON.parse(retain(`resource-current:${pool}`).document) as NonNullable<ReturnType<typeof readFixtureResourceCurrentV1>>;
    invariant(current && current.poolScope.poolId === pool && current.poolRevision === inventory.poolRevision && current.revocationRef === null, "HOLD: terminal physical source-current stale/revoked");
    const pointer = retain(`resource-current:${pool}`);
    invariant(pointer.digest === fingerprint(current), "HOLD: terminal consumed physical current mismatch"); resource(current.acquisitionRef); resource(current.remainingRef);
    invariant(inventory.active.length === 0 && inventory.allocations.length === 1 && inventory.released.length === 1 && inventory.allocations[0]!.executionId === A.executionId
      && canonical(inventory.allocations[0]!.assignmentRef) === canonical(A.resourceSources.assignmentRef)
      && !inventory.allocations.some(a => a.executionId === B.executionId), "HOLD: terminal physical history/occupation mismatch");
    const allocation = inventory.allocations[0]!, released = releases.find(e => e.kind === "g3_resource_released" && (e.payload as { allocation: { allocationId: string } }).allocation.allocationId === allocation.allocationId);
    const allocated = workEvents.find(e => e.key === `resource:allocate:${allocation.allocationId}`), qEvent = workEvents.find(e => e.key === `observation:terminal:${fingerprint(proof)}`);
    const pinEvent = workEvents.find(e => e.kind === "g3_admission_prepared"), burnEvent = workEvents.find(e => e.kind === "g3_slot_burned");
    invariant(released && allocated && qEvent && pinEvent && burnEvent && released.key === `resource:release:${allocation.allocationId}`
      && released.unitId === family.unit && allocated.unitId === family.unit && qEvent.unitId === family.unit
      && canonical((allocated.payload as { allocation: unknown }).allocation) === canonical(allocation)
      && canonical((released.payload as { allocation: unknown }).allocation) === canonical(allocation)
      && (released.payload as { proofDigest: string }).proofDigest === fingerprint(proof)
      && reserve.sequence < allocated.sequence && allocated.sequence < pinEvent.sequence && pinEvent.sequence < qEvent.sequence
      && burnEvent.sequence < qEvent.sequence && qEvent.sequence < released.sequence && release.sequence > released.sequence, "HOLD: terminal resource release/Q/order mismatch"); allocations.push(...inventory.allocations);
  }
  authority.sort((a, b) => a.record_ref.localeCompare(b.record_ref));
  return immutableCopy({ version: "l8-cross-epoch-terminal-history-cut-fixture-v1", domain, throughSequence, hostBinding, families, outboxes, slots, authority, workEvents,
    unitSources, allocations, releases, disposition: "RETIRED_WITHOUT_SCIENTIFIC_EFFECT_NEVER_SENT" });
}
function cutDoc108(db: Database, ref: ByteRef, live: boolean): TerminalHistory108 {
  const row = db.query("SELECT document,digest,revoked,revision FROM g3_authority WHERE record_ref=? AND kind='terminal-history-cut'").get(`transition:${canonical(ref)}`) as { document: string; digest: string; revoked: number; revision: number } | null;
  invariant(row && row.digest === fingerprint(JSON.parse(row.document)) && (!live || !row.revoked) && row.revision === 1 + row.revoked, "HOLD: committed terminal cut missing/corrupt/revoked");
  const doc = JSON.parse(row.document) as BoundDocument<TerminalHistory108>;
  invariant(canonical(doc.ref) === canonical(ref), "HOLD: terminal cut ref mismatch"); return exactDoc108(doc);
}
export function assertTerminalCut108(db: Database, events: EventLog, ref: ByteRef, domain: Domain108, live: boolean): TerminalHistory108 {
  const cut = cutDoc108(db, ref, live); invariant(canonical(cut.domain) === canonical(domain), "HOLD: terminal cut domain mismatch");
  const actual = collectTerminalHistory108(db, events, domain, live, live ? events.cursor(domain.missionId).sequence : cut.throughSequence, live ? undefined : cut);
  invariant(actual && cut.authority.every(r => r.revoked === 0), "HOLD: consumed terminal cut invalid");
  const comparable = (value: TerminalHistory108) => ({ ...value, throughSequence: 0, authority: value.authority.map(row => live ? row : ({ record_ref: row.record_ref, kind: row.kind, document: row.document, digest: row.digest })) });
  invariant(canonical(comparable(cut)) === canonical(comparable(actual)), "HOLD: terminal history changed from consumed cut"); return cut;
}
export function terminalWorkEvent108(db: Database, event: GraphEvent): { operation: string; categories: string[] } | null {
  if (!workKinds108.has(event.kind)) return null;
  const specs: Record<string, [string, string[]]> = {
    g3_family_reserved: ["reserve-family", ["families", "units", "claims", "intents"]], g3_resource_allocated: ["allocate-resource", ["claims", "physicalAllocations"]],
    g3_admission_prepared: ["prepare-admission", ["executions", "intents", "outboxes", "attemptsL6"]], g3_slot_burned: ["burn-slot", ["intents", "proofs"]],
    g3_fixture_observation: ["observe-execution", ["proofs", "outboxes", "attemptsL6"]], g3_resource_released: ["release-resource", ["claims", "releases", "physicalAllocations"]],
    g3_family_released: ["release-family", ["families", "units", "claims", "releases"]],
  };
  // Semantic payload validation is performed by the complete terminal-cut audit,
  // never by this taxonomy alone. The event must still be an actual OWN event.
  const row = db.query("SELECT payload,digest,unit_id,sequence,kind,time FROM ff8_events WHERE mission=? AND key=?").get(event.missionId, event.key) as
    { payload: string; digest: string; unit_id: string | null; sequence: number; kind: string; time: number } | null;
  invariant(row && event.unitId && row.payload === canonical(event.payload) && row.unit_id === event.unitId && row.sequence === event.sequence && row.kind === event.kind && row.time === event.time
    && row.digest === event.digest && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId }), "HOLD: terminal work event bytes/unit mismatch");
  const [operation, categories] = specs[event.kind]!; return { operation, categories };
}
