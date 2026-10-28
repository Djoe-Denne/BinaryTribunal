/** Private fixture control records and positive replacement history. No native/IO port. */
import type { Database } from "bun:sqlite";
import type { ByteRef, BoundDocument, CandidateRefV1, DrainEntryV1, PreparationObservationT0, ParsedExecutionEnvelopeV1, IndependentlyLoadedSourcesV1 } from "./graph-execution-envelope";
import { assertExecutionJsonV1, bindExecutionSourcesV1 } from "./graph-execution-envelope";
import type { GenerationViewV3 } from "./graph-generation-store";
import { assertTerminalCut108 } from "./graph-terminal-history";
import { replacementKinds120, replacementStage120, replacementForOld120, readReplacementCounter120 } from "./graph-generation-replacement";
import { EventLog, invariant, integer, nonempty, immutableCopy } from "./eventlog";
import { canonical, fingerprint, hash } from "./validation";
import { resourceDocumentV1, closedResourceFieldsV1, readResourceInventoryV1 } from "./graph-resource-ledger";

export interface PreparationGrantV1 {
  version: "l8-fixture-origin-grant-v1"; issuer: "synthetic-parent85"; revision: number;
  scope: { fixtureId: string; missionId: string; lineageId: string; rootAccountId: string };
  connectionPath: string; approvalRef: ByteRef; unit: "durable-origin"; ceiling: 3;
  sourceMissionRef: ByteRef; rootAllocationRef: ByteRef; rootLimitsRef: ByteRef;
  issuerProvenanceRef: ByteRef; rootLineageOwnershipRef: ByteRef; firstIssuanceEmptyHistoryProofRef: ByteRef; hostCurrentRef: ByteRef;
}
/** Privileged, local fixture HOST input, never a request or a public S1 port.
 * The connection reference is a capability binding; records are the evidence.
 * A missing retained provider after reopen is UNKNOWN, not first issuance. */
export interface OriginHostDomainV1 { universeId: string; domainId: string; missionId: string; lineageId: string; rootAccountId: string }
export interface OriginIssuerProvenanceV1 {
  version: "l8-fixture-origin-host-issuer-v1"; revision: 1; issuer: "synthetic-parent85";
  universeId: string; isolation: "independent-synthetic-fixture"; completeDomains: OriginHostDomainV1[];
  approvedDecision: "three-durable-origins-bootstrap-included"; ceiling: 3; unit: "durable-origin";
}
export interface OriginOwnershipV1 {
  version: "l8-fixture-origin-host-ownership-v1"; revision: 1; domain: OriginHostDomainV1; issuerProvenanceRef: ByteRef;
  connectionScopeId: string; connectionPath: string; sourceMissionRef: ByteRef; rootAllocationRef: ByteRef; rootLimitsRef: ByteRef;
}
export interface OriginFirstIssuanceV1 {
  version: "l8-fixture-origin-host-first-issuance-v1"; revision: 1; domain: OriginHostDomainV1; rootLineageOwnershipRef: ByteRef;
  enumeration: "complete-before-first-issuance"; issuedGrantRefs: ByteRef[]; committedOrigins: OriginCommitV1[];
}
export interface OriginHostCurrentV1 {
  version: "l8-fixture-origin-host-current-v1"; revision: number; domain: OriginHostDomainV1;
  issuerProvenanceRef: ByteRef; rootLineageOwnershipRef: ByteRef; firstIssuanceEmptyHistoryProofRef: ByteRef;
  issuerRevision: number; ownershipRevision: number; firstIssuanceRevision: number; revokedProofRefs: ByteRef[];
}
export interface OriginHostRecordsV1 {
  issuer: BoundDocument<OriginIssuerProvenanceV1>; ownership: BoundDocument<OriginOwnershipV1>;
  firstIssuance: BoundDocument<OriginFirstIssuanceV1>; current: BoundDocument<OriginHostCurrentV1>;
}
export interface FixtureOriginHostPortV1 { readonly connection: Database; records: OriginHostRecordsV1 | null }
export interface OriginCommitV1 { candidateRef: CandidateRefV1; sourceDigest: string; commitKey: string }
export interface PreparationCounterV1 { version: "l8-fixture-origin-counter-v1"; revision: number; rootAccountId: string; grantRef: ByteRef; previousRef: ByteRef | null; used: number; origins: OriginCommitV1[] }
export interface OperationalStateV1 { families: unknown[]; units: unknown[]; claims: unknown[]; outboxes: unknown[]; slots: unknown[]; sources: unknown[]; physical: unknown[] }
export function operationalSourceRefsV1(operational: OperationalStateV1) {
  const authority: ByteRef[] = [], proofs: ByteRef[] = [];
  for (const row of operational.sources as { kind: string; document: string; digest: string }[]) {
    const data = JSON.parse(row.document) as { version?: string; kind?: string; ref?: ByteRef; utf8?: string };
    invariant(fingerprint(data) === row.digest && canonical(data) === row.document, "HOLD: operational source document corrupted");
    if (row.kind === "controller" || row.kind === "observation") invariant(data.kind === row.kind, "HOLD: source kind/document mismatch");
    const ref = data.ref && typeof data.utf8 === "string" ? data.ref : { kind: data.version ?? `l8-fixture-${row.kind}-record-v1`, encoding: "utf8-json-v1" as const,
      byteLength: Buffer.byteLength(row.document, "utf8"), sha256: hash(Buffer.from(row.document, "utf8")) };
    (row.kind === "observation" ? proofs : authority).push(ref);
  }
  return { authority, proofs };
}
export interface TransitionObservationV1 {
  version: "l8-fixture-transition-observation-v1"; revision: number; issuer: "synthetic-parent85"; expectedHead: GenerationViewV3;
  eventSequence: number; t0: PreparationObservationT0; operational: OperationalStateV1;
  sourceMissionRef: ByteRef; knowledgeRef: ByteRef; parentOriginRef: ByteRef;
}
export interface PreparedTransitionValueV1 {
  version: "l8-fixture-initial-preparation-v1"; candidateRef: CandidateRefV1; observationRef: ByteRef; expectedT0Ref: ByteRef;
  headBefore: GenerationViewV3; headAfter: GenerationViewV3; eventBefore: number; eventAfter: number; preparationCounterRef: ByteRef;
}
export interface PreparedTransitionV1 { document: BoundDocument<PreparedTransitionValueV1>; candidateRef: CandidateRefV1 }
export interface TransitionCaseV1 {
  version: "l8-fixture-transition-a-case-v1"; revision: number; issuer: "synthetic-parent85"; purpose: "request-drain"; caseId: string;
  candidateRef: CandidateRefV1; preparationRef: ByteRef; observationRef: ByteRef; expectedHead: GenerationViewV3; counterRef: ByteRef;
  owner: string; controllerFence: number;
}
export interface DrainResultV1 {
  authorizationRef: ByteRef;
  document: BoundDocument<DrainEntryV1>; value: DrainEntryV1;
  engaged: { document: BoundDocument<{ version: string; originRef: ByteRef; families: { unit: string; [key: string]: unknown }[] }>; value: { version: string; originRef: ByteRef; families: { unit: string; [key: string]: unknown }[] } };
  inventory: { document: BoundDocument<OperationalStateV1 & { version: string }>; value: OperationalStateV1 & { version: string } };
}
type Row = { record_ref: string; kind: string; revision: number; document: string; digest: string; revoked: number };
export const transitionKeyV1 = (ref: ByteRef) => `transition:${canonical(ref)}`;
export function putTransitionDocumentV1<T extends { version: string }>(db: Database, value: T, kind = "transition-source"): BoundDocument<T> {
  const doc = resourceDocumentV1(value), key = transitionKeyV1(doc.ref), old = db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(key) as Row | null;
  if (old) invariant(old.document === canonical(doc) && old.digest === fingerprint(doc), "HOLD: immutable transition document changed");
  else db.query("INSERT INTO g3_authority VALUES(?,?,1,?,?,0)").run(key, kind, canonical(doc), fingerprint(doc));
  return immutableCopy(doc);
}
export function readTransitionDocumentV1<T extends { version: string }>(db: Database, ref: ByteRef, historical = false): T {
  const row = db.query("SELECT * FROM g3_authority WHERE record_ref=?").get(transitionKeyV1(ref)) as Row | null;
  invariant(row && (historical || !row.revoked) && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: transition source unavailable/revoked");
  const doc = JSON.parse(row.document) as BoundDocument<T>, value = JSON.parse(doc.utf8) as T;
  const kinds: Record<string, string> = { "l8-fixture-origin-counter-v1": "origin-counter-record", "l8-fixture-origin-grant-v1": "origin-grant",
    "l8-fixture-origin-host-issuer-v1": "origin-host-source", "l8-fixture-origin-host-ownership-v1": "origin-host-source",
    "l8-fixture-origin-host-first-issuance-v1": "origin-host-source", "l8-fixture-origin-host-current-v1": "origin-host-source",
    "l8-candidate-staging-fixture-v1": "candidate-staging", "l8-final-a-case-fixture-v1": "activation-case",
    "l8-activation-counter-fixture-v1": "activation-counter", "l8-activation-attempt-v1": "activation-attempt", "l8-activation-outcome-fixture-v1": "activation-outcome",
    "l8-activation-record-fixture-v1": "activation-record",
    "l8-cross-epoch-terminal-history-cut-fixture-v1": "terminal-history-cut",
    "l8-fixture-initial-preparation-v1": "initial-preparation-record", "l8-fixture-engaged-families-v1": "drain-cut", "l8-fixture-inventory-at-t1-v1": "drain-cut", "l8-drain-entry-v1": "drain-entry" };
  invariant(canonical(doc) === row.document && canonical(resourceDocumentV1(value)) === canonical(doc) && canonical(doc.ref) === canonical(ref)
    && row.kind === (kinds[value.version] ?? "transition-source") && (row.revoked === 0 || row.revoked === 1) && row.revision === 1 + row.revoked,
    "HOLD: transition source bytes/ref/revision changed");
  return immutableCopy(value);
}
export function counterRecordV1(db: Database, root: string): { document: BoundDocument<PreparationCounterV1>; value: PreparationCounterV1 } {
  const row = db.query("SELECT * FROM g3_authority WHERE record_ref=? AND kind='origin-counter-current'").get(`origin-counter:${root}`) as Row | null;
  invariant(row && !row.revoked && fingerprint(JSON.parse(row.document)) === row.digest, "HOLD: preparation counter unknown/corrupt");
  const ref = JSON.parse(row.document) as ByteRef, value = readTransitionDocumentV1<PreparationCounterV1>(db, ref);
  integer(value.used); integer(value.revision, 1);
  invariant(value.version === "l8-fixture-origin-counter-v1" && value.rootAccountId === root && value.revision === row.revision && value.used === value.origins.length
    && value.revision === value.used + 1, "HOLD: preparation counter projection mismatch");
  return { document: { ref, utf8: canonical(value) }, value };
}
export function auditPreparationCounterV1(db: Database, events: EventLog, root: string) {
  const counter = counterRecordV1(db, root), grant = readTransitionDocumentV1<PreparationGrantV1>(db, counter.value.grantRef, true);
  invariant(grant.ceiling === 3 && grant.unit === "durable-origin" && grant.scope.rootAccountId === root && counter.value.used <= grant.ceiling, "HOLD: durable origin counter exceeds grant");
  // Retained HOST provenance stays auditable after revocation/reopen without
  // inventing a LIVE provider or treating an absent source as first issuance.
  const issuer = readTransitionDocumentV1<OriginIssuerProvenanceV1>(db, grant.issuerProvenanceRef, true);
  const ownership = readTransitionDocumentV1<OriginOwnershipV1>(db, grant.rootLineageOwnershipRef, true);
  const first = readTransitionDocumentV1<OriginFirstIssuanceV1>(db, grant.firstIssuanceEmptyHistoryProofRef, true);
  const issuedCurrent = readTransitionDocumentV1<OriginHostCurrentV1>(db, grant.hostCurrentRef, true);
  const domainKey = `origin-domain:${canonical(ownership.domain)}`;
  const registration = db.query("SELECT revision,document,digest,revoked FROM g3_authority WHERE record_ref=? AND kind='origin-grant-domain'").get(domainKey) as { revision: number; document: string; digest: string; revoked: number } | null;
  invariant(issuer.version === "l8-fixture-origin-host-issuer-v1" && issuer.revision === 1 && issuer.issuer === grant.issuer && issuer.ceiling === grant.ceiling && issuer.unit === grant.unit
    && issuer.approvedDecision === "three-durable-origins-bootstrap-included" && ownership.version === "l8-fixture-origin-host-ownership-v1" && ownership.revision === 1
    && first.version === "l8-fixture-origin-host-first-issuance-v1" && first.revision === 1 && issuedCurrent.version === "l8-fixture-origin-host-current-v1"
    && issuer.isolation === "independent-synthetic-fixture" && issuer.universeId === grant.scope.fixtureId
    && canonical(issuer.completeDomains) === canonical([ownership.domain]) && ownership.domain.universeId === grant.scope.fixtureId
    && ownership.domain.missionId === grant.scope.missionId && ownership.domain.lineageId === grant.scope.lineageId && ownership.domain.rootAccountId === root
    && ownership.connectionPath === grant.connectionPath && canonical(ownership.issuerProvenanceRef) === canonical(grant.issuerProvenanceRef)
    && canonical(ownership.sourceMissionRef) === canonical(grant.sourceMissionRef) && canonical(ownership.rootAllocationRef) === canonical(grant.rootAllocationRef)
    && canonical(ownership.rootLimitsRef) === canonical(grant.rootLimitsRef) && canonical(first.domain) === canonical(ownership.domain)
    && canonical(first.rootLineageOwnershipRef) === canonical(grant.rootLineageOwnershipRef) && first.enumeration === "complete-before-first-issuance"
    && canonical(first.issuedGrantRefs) === "[]" && canonical(first.committedOrigins) === "[]"
    && canonical(issuedCurrent.domain) === canonical(ownership.domain) && issuedCurrent.revision === 1
    && canonical(issuedCurrent.issuerProvenanceRef) === canonical(grant.issuerProvenanceRef)
    && canonical(issuedCurrent.rootLineageOwnershipRef) === canonical(grant.rootLineageOwnershipRef)
    && canonical(issuedCurrent.firstIssuanceEmptyHistoryProofRef) === canonical(grant.firstIssuanceEmptyHistoryProofRef)
    && issuedCurrent.issuerRevision === issuer.revision && issuedCurrent.ownershipRevision === ownership.revision && issuedCurrent.firstIssuanceRevision === first.revision
    && canonical(issuedCurrent.revokedProofRefs) === "[]" && registration && registration.revision === 1 && !registration.revoked
    && registration.document === canonical(counter.value.grantRef) && registration.digest === fingerprint(counter.value.grantRef), "HOLD: historical origin HOST/domain/grant binding mismatch");
  const origins = db.query("SELECT * FROM g3_origins ORDER BY generation").all() as { mission: string; generation: string; document: string; digest: string; run: string }[];
  invariant(origins.length === counter.value.used && new Set(counter.value.origins.map(o => o.candidateRef.generationId)).size === origins.length, "HOLD: complete origin history differs from counter");
  for (const origin of origins) {
    const commit = counter.value.origins.find(o => o.candidateRef.generationId === origin.generation);
    const data = JSON.parse(origin.document) as { origin: { document: BoundDocument<unknown>; envelope: { fingerprint: string; missionId: string; generation: { lineageId: string }; admissionSource: { budgetLineage: { rootAccountId: string } } } } };
    invariant(commit && origin.mission === grant.scope.missionId && data.origin.envelope.generation.lineageId === grant.scope.lineageId
      && data.origin.envelope.admissionSource.budgetLineage.rootAccountId === root && fingerprint(JSON.parse(origin.document)) === origin.digest
      && commit.sourceDigest === origin.digest && canonical(commit.candidateRef.envelopeRef) === canonical(data.origin.document.ref)
      && commit.candidateRef.envelopeFingerprint === data.origin.envelope.fingerprint, "HOLD: durable origin counter source/pin mismatch");
    invariant(canonical(resourceDocumentV1(JSON.parse(origin.run) as { version: string }).ref) === canonical(commit.candidateRef.runRef), "HOLD: durable origin run bytes changed");
    const event = events.read(origin.mission).find(e => e.key === commit.commitKey);
    invariant(event && ["g3_bootstrap_fixture", "g3_initial_prepared", "g3_replacement_prepared"].includes(event.kind)
      && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId }), "HOLD: durable origin commit event missing/corrupt");
    const eventCounter = (event.payload as { preparationCounterRef: ByteRef }).preparationCounterRef;
    const post = readTransitionDocumentV1<PreparationCounterV1>(db, eventCounter, true);
    const index = counter.value.origins.indexOf(commit);
    invariant(post.used === index + 1 && post.revision === post.used + 1 && canonical(post.origins) === canonical(counter.value.origins.slice(0, index + 1))
      && canonical(post.grantRef) === canonical(counter.value.grantRef) && post.previousRef, "HOLD: origin event/counter binding mismatch");
    const previous = readTransitionDocumentV1<PreparationCounterV1>(db, post.previousRef, true);
    invariant(previous.used === index && previous.revision === index + 1 && canonical(previous.origins) === canonical(counter.value.origins.slice(0, index)), "HOLD: origin counter history reset/diverged");
  }
  return counter;
}
export function initializePreparationCounterV1(db: Database, root: string, grantRef: ByteRef): void {
  invariant(!db.query("SELECT 1 FROM g3_origins UNION ALL SELECT 1 FROM g3_head").get(), "HOLD: no retrospective origin grant");
  const value: PreparationCounterV1 = { version: "l8-fixture-origin-counter-v1", revision: 1, rootAccountId: root, grantRef, previousRef: null, used: 0, origins: [] };
  const document = putTransitionDocumentV1(db, value, "origin-counter-record");
  db.query("INSERT INTO g3_authority VALUES(?,'origin-counter-current',1,?,?,0)").run(`origin-counter:${root}`, canonical(document.ref), fingerprint(document.ref));
}
export function commitPreparationCounterV1(db: Database, before: ReturnType<typeof counterRecordV1>, commit: OriginCommitV1): ByteRef {
  invariant(before.value.used < 3 && !before.value.origins.some(o => o.candidateRef.generationId === commit.candidateRef.generationId), "HOLD: durable origin grant exhausted/reused");
  const next: PreparationCounterV1 = { ...before.value, revision: before.value.revision + 1, previousRef: before.document.ref, used: before.value.used + 1, origins: [...before.value.origins, commit] };
  integer(next.revision); const document = putTransitionDocumentV1(db, next, "origin-counter-record");
  invariant(db.query("UPDATE g3_authority SET revision=?,document=?,digest=? WHERE record_ref=? AND revision=? AND digest=? AND revoked=0")
    .run(next.revision, canonical(document.ref), fingerprint(document.ref), `origin-counter:${next.rootAccountId}`, before.value.revision, fingerprint(before.document.ref)).changes === 1, "HOLD: origin counter CAS lost");
  return document.ref;
}
export function captureOperationalV1(db: Database, events: EventLog, view: GenerationViewV3): OperationalStateV1 {
  // INITIAL-only tranche has no legitimately executable second generation.
  // Do not omit unexplained older/candidate work by applying an active filter.
  auditGenerationHistoryV1(db, events, view);
  const kinds = db.query("SELECT DISTINCT kind FROM g3_authority").all() as { kind: string }[];
  const known = ["controller", "observation", "resource-acquisition", "resource-remaining", "resource-assignment", "resource-current", "transition-source", "origin-grant",
    "origin-counter-record", "origin-counter-current", "origin-host-source", "origin-grant-domain", "initial-preparation", "initial-preparation-record", "transition-case-current", "drain-cut", "drain-entry", "drain-result",
    "candidate-staging", "activation-case", "activation-attempt", "activation-receipt", "activation-counter", "activation-counter-current", "activation-outcome", "activation-result", "activation-record", "final-host-source", "terminal-history-cut", ...replacementKinds120];
  invariant(kinds.every(row => known.includes(row.kind)), "HOLD: unenumerated authority/source kind");
  const rows = (table: string, order: string) => db.query(`SELECT * FROM ${table} WHERE mission=? AND generation=? ORDER BY ${order}`).all(view.missionId, view.generationId);
  const pools = db.query("SELECT document FROM g3_authority WHERE kind='resource-acquisition' ORDER BY record_ref").all() as { document: string }[];
  const physical = pools.map(row => { const source = JSON.parse(JSON.parse(row.document).utf8) as { poolScope: { poolId: string } }; return { poolId: source.poolScope.poolId, inventory: readResourceInventoryV1(db, events, source.poolScope.poolId) }; });
  const value = { families: rows("g3_families", "unit"), units: rows("g3_units", "unit"), claims: rows("g3_claims", "resource_key"), outboxes: rows("g3_outbox", "execution_id"),
    slots: db.query("SELECT * FROM g3_slots WHERE root_id=? ORDER BY slot_key").all(view.rootAccountId),
    sources: db.query("SELECT * FROM g3_authority WHERE kind IN ('controller','observation','resource-acquisition','resource-remaining','resource-assignment','resource-current') ORDER BY record_ref").all(), physical };
  assertExecutionJsonV1(value); return immutableCopy(value);
}
export function auditGenerationHistoryV1(db: Database, events: EventLog, view: GenerationViewV3): void {
  if (db.query("SELECT 1 FROM g3_authority WHERE kind LIKE 'replacement-%' LIMIT 1").get()) readReplacementCounter120(db, events, view.rootAccountId);
  const origins = db.query("SELECT * FROM g3_origins ORDER BY mission,generation").all() as { mission: string; generation: string; document: string; digest: string; state: string }[];
  invariant(origins.filter(o => o.state === "ACTIVE").length === 1, "HOLD: multiple/missing active origin");
  for (const origin of origins) {
    invariant(origin.mission === view.missionId && fingerprint(JSON.parse(origin.document)) === origin.digest, "HOLD: unexplained origin outside root mission");
    const retained = JSON.parse(origin.document) as { origin: ParsedExecutionEnvelopeV1; independent: IndependentlyLoadedSourcesV1 };
    const bound = bindExecutionSourcesV1(retained.origin, retained.independent);
    invariant(bound.ok && retained.origin.generationId === origin.generation && retained.origin.envelope.generation.lineageId === view.lineageId
      && retained.origin.envelope.admissionSource.budgetLineage.rootAccountId === view.rootAccountId, "HOLD: historical origin source/root binding mismatch");
    if (origin.state === "ACTIVE") invariant(origin.generation === view.generationId, "HOLD: active origin projection mismatch");
    else if (origin.state === "PREPARED" || origin.state === "PENDING_DRAIN") invariant(origin.generation === view.candidateGenerationId
      || origin.state === "PREPARED" && replacementStage120(db, events, origin.generation), "HOLD: unpointed candidate/staged origin unsupported");
    else if (origin.state === "ABORTED") invariant(replacementForOld120(db, events, origin.generation), "HOLD: ABORTED origin lacks positive replacement provenance");
    else {
      invariant(origin.state === "RETIRED", "HOLD: unknown historical origin state");
      const activation = events.read(view.missionId).find(e => e.kind === "g3_generation_activated" && (e.payload as { headBefore?: GenerationViewV3 }).headBefore?.generationId === origin.generation);
      invariant(activation && (activation.payload as { outcome: string }).outcome === "COMMITTED", "HOLD: retired origin lacks committed activation provenance");
      const hasWork = ["g3_families", "g3_claims", "g3_outbox"].some(table => db.query(`SELECT 1 FROM ${table} WHERE mission=? AND generation=? LIMIT 1`).get(origin.mission, origin.generation));
      if (hasWork) {
        const result = activation.payload as { activationRecordRef: ByteRef | null };
        invariant(result.activationRecordRef, "HOLD: retired work lacks committed activation record");
        const committed = readTransitionDocumentV1<{ version: string; terminalHistoryRef?: ByteRef }>(db, result.activationRecordRef, true);
        invariant(committed.terminalHistoryRef, "HOLD: retired work lacks consumed terminal cut");
        const cut = assertTerminalCut108(db, events, committed.terminalHistoryRef, { missionId: view.missionId, lineageId: view.lineageId, rootAccountId: view.rootAccountId, owner: view.owner }, false);
        invariant(cut.families.some(f => f.generation === origin.generation), "HOLD: retired origin not covered by consumed terminal cut");
      }
    }
    const units = db.query("SELECT unit,document,digest,state FROM g3_units WHERE mission=? AND generation=? ORDER BY unit").all(origin.mission, origin.generation) as { unit: string; document: string; digest: string; state: string }[];
    for (const unit of units) { const scientific = bound.value.planning.units.find(u => u.unitId === unit.unit);
      invariant(scientific && unit.document === canonical(scientific) && unit.digest === fingerprint(scientific)
        && (origin.state !== "RETIRED" || unit.state === "RETIRED")
        && (!["PREPARED", "PENDING_DRAIN", "ABORTED"].includes(origin.state) || unit.state === "STAGED"), "HOLD: historical/staged unit metadata unexplained"); }
    if (origin.state === "ACTIVE") for (const unit of units) invariant(["READY", "BLOCKED", "RESERVED", "CANCELLED"].includes(unit.state)
      && (unit.state !== "RESERVED" || db.query("SELECT 1 FROM g3_families WHERE mission=? AND generation=? AND unit=?").get(origin.mission, origin.generation, unit.unit))
      && (unit.state !== "CANCELLED" || db.query("SELECT 1 FROM g3_families WHERE mission=? AND generation=? AND unit=? AND state='RELEASED'").get(origin.mission, origin.generation, unit.unit)), "HOLD: orphan active unit operation/state");
    const stagingRows = db.query("SELECT document FROM g3_authority WHERE kind='candidate-staging'").all() as { document: string }[];
    const isStaged = stagingRows.some(row => JSON.parse(JSON.parse(row.document).utf8).candidateRef.generationId === origin.generation) || !!replacementStage120(db, events, origin.generation);
    invariant(units.length === bound.value.planning.units.length || !isStaged && units.length === 0 && ["PREPARED", "PENDING_DRAIN", "ABORTED"].includes(origin.state), "HOLD: incomplete historical/staged origin units");
  }
  for (const table of ["g3_units", "g3_families", "g3_claims", "g3_outbox"]) {
    const rows = db.query(`SELECT DISTINCT mission,generation FROM ${table}`).all() as { mission: string; generation: string }[];
    invariant(rows.every(row => origins.some(o => o.mission === row.mission && o.generation === row.generation)), "HOLD: orphan work without retained origin");
  }
}
export function assertObservationV1(observation: TransitionObservationV1, head: GenerationViewV3, operational: OperationalStateV1, eventSequence: number): void {
  invariant(observation.version === "l8-fixture-transition-observation-v1" && observation.issuer === "synthetic-parent85"
    && canonical(observation.expectedHead) === canonical(head) && observation.eventSequence === eventSequence
    && canonical(observation.operational) === canonical(operational), "HOLD: independent T0 observation stale/incomplete");
  const t = observation.t0;
  invariant(t.headRevision === head.revision && t.parentGenerationId === head.generationId && t.activePlanRevision === head.activePlanRevision
    && t.sourceMissionRevision === head.sourceMissionRevision && t.knowledgeRevision === head.knowledgeRevision && t.knowledgeRootHash === head.knowledgeRootHash
    && t.knowledgeLedgerRevision === head.knowledgeLedgerRevision && t.knowledgeLedgerDigest === head.knowledgeLedgerDigest
    && t.controllerFence === head.controllerFence && t.inventoryRevision === head.inventoryRevision && t.inventoryDigest === fingerprint(operational)
    && t.budgetLedgerRevision === head.budgetLedgerRevision && t.budgetLedgerDigest === head.budgetLedgerDigest && t.observedEventSequence === eventSequence
    && t.authorityRecordRefs !== null && t.proofRecordRefs !== null && t.spentBySlot !== null && t.encumberedBySlot !== null, "HOLD: T0 exact source expectations mismatch");
  const slots = operational.slots as { slot_key: string; state: string; debit: number }[];
  invariant(canonical(t.spentBySlot) === canonical(slots.filter(s => ["SPENT", "BURNED"].includes(s.state)).map(s => ({ slotKey: s.slot_key, amount: s.debit })))
    && canonical(t.encumberedBySlot) === canonical(slots.filter(s => s.state === "ENCUMBERED").map(s => ({ slotKey: s.slot_key, amount: s.debit }))), "HOLD: T0 root slot inventory mismatch");
  const refs = operationalSourceRefsV1(operational);
  invariant(canonical(t.authorityRecordRefs) === canonical(refs.authority) && canonical(t.proofRecordRefs) === canonical(refs.proofs), "HOLD: T0 complete source/proof enumeration mismatch");
}
export function checkTransitionSourceV1(value: { version: string }): void {
  assertExecutionJsonV1(value);
  const keys: Record<string, string[]> = {
    "l8-fixture-origin-approval-v1": ["version", "issuer", "caseId", "decision", "missionId", "lineageId", "rootAccountId", "connectionPath"],
    "l8-fixture-origin-grant-v1": ["version", "issuer", "revision", "scope", "connectionPath", "approvalRef", "unit", "ceiling", "sourceMissionRef", "rootAllocationRef", "rootLimitsRef", "issuerProvenanceRef", "rootLineageOwnershipRef", "firstIssuanceEmptyHistoryProofRef", "hostCurrentRef"],
    "l8-fixture-transition-observation-v1": ["version", "revision", "issuer", "expectedHead", "eventSequence", "t0", "operational", "sourceMissionRef", "knowledgeRef", "parentOriginRef"],
    "l8-fixture-transition-a-case-v1": ["version", "revision", "issuer", "purpose", "caseId", "candidateRef", "preparationRef", "observationRef", "expectedHead", "counterRef", "owner", "controllerFence"],
  };
  invariant(Object.hasOwn(keys, value.version), "HOLD: unsupported transition source/native/B"); closedResourceFieldsV1(value, keys[value.version]!);
  const record = value as unknown as Record<string, unknown>;
  invariant(record.issuer === "synthetic-parent85", "HOLD: fixture issuer required");
  if (value.version !== "l8-fixture-origin-approval-v1") integer(record.revision as number, 1);
  if (value.version === "l8-fixture-origin-grant-v1") {
    const g = value as PreparationGrantV1; closedResourceFieldsV1(g.scope, ["fixtureId", "missionId", "lineageId", "rootAccountId"]);
    Object.values(g.scope).forEach(nonempty); nonempty(g.connectionPath); invariant(g.ceiling === 3 && g.unit === "durable-origin", "HOLD: grant85 bound/unit mismatch");
  } else if (value.version === "l8-fixture-transition-a-case-v1") {
    const c = value as TransitionCaseV1; nonempty(c.caseId); nonempty(c.owner); integer(c.controllerFence);
    invariant(c.purpose === "request-drain", "HOLD: transitionA purpose/native/B mismatch");
    closedResourceFieldsV1(c.candidateRef, ["generationId", "envelopeFingerprint", "envelopeRef", "runRef"]);
  } else if (value.version === "l8-fixture-transition-observation-v1") {
    const o = value as TransitionObservationV1; integer(o.eventSequence);
    closedResourceFieldsV1(o.operational, ["families", "units", "claims", "outboxes", "slots", "sources", "physical"]);
    invariant(Object.values(o.operational).every(Array.isArray), "HOLD: complete OWN collections required, not unknown");
  }
}
