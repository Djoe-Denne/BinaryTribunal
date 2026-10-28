/**93 Private final-inventory fixture boundary. No native/IO/producer discovery. */
import { enterLocal145, leaveLocal145 } from "./graph-local-measure145";
import type { Database } from "bun:sqlite";
import type { BoundDocument, ByteRef, CandidateRefV1, BoundExecutionV1, ReadonlyData, ParsedExecutionEnvelopeV1, IndependentlyLoadedSourcesV1, PreparationObservationT0 } from "./graph-execution-envelope";
import { assertExecutionJsonV1, bindExecutionSourcesV1 } from "./graph-execution-envelope";
import { EventLog, immutableCopy, invariant, integer, type GraphEvent } from "./eventlog";
import type { GenerationViewV3 } from "./graph-generation-store";
import { canonical, fingerprint, hash } from "./validation";
import { closedResourceFieldsV1, resourceDocumentV1, readResourceInventoryV1 } from "./graph-resource-ledger";
import { readTransitionDocumentV1, type OriginOwnershipV1, type PreparedTransitionValueV1, type DrainResultV1, type TransitionObservationV1 } from "./graph-generation-transition";
import type { CandidateStagingV1, ActivationResultV1 } from "./graph-generation-activation";
import type { FixtureControllerRecordV1 } from "./graph-trusted-authority";
import { collectTerminalHistory108, terminalWorkEvent108 } from "./graph-terminal-history";
import { replacementKinds120, replacementStage120, replacementForOld120, readReplacementDocument120, type ReplacementSource120, type ReplacementAllocation120,
  type ReplacementStageValue120, type ReplacementResult120 } from "./graph-generation-replacement";

export const finalCategoriesV1 = ["origins", "families", "units", "executions", "intents", "outboxes", "attemptsL6", "claims", "publications",
  "publicationReadbacks", "materializations", "materializationReadbacks", "proofs", "releases", "sourceCapabilities", "controllerLeases",
  "physicalAllocations", "stagedUnits", "stagedBlobs", "requiredFiles"] as const;
export type FinalCategoryV1 = typeof finalCategoriesV1[number];
export interface FinalDomainV1 { universeId: string; missionId: string; lineageId: string; rootAccountId: string; owner: string; connectionPath: string; originOwnershipRef: ByteRef }
export interface FinalProducerV1 { producerId: "own-control92" | "parent-policy-file92"; authorityRef: ByteRef; operationPolicyRef: ByteRef; writes: FinalCategoryV1[] }
export interface FinalProducerRegistryV1 { version: "l8-final-producer-registry-fixture-v1"; domain: FinalDomainV1; allocationRef: ByteRef; producers: FinalProducerV1[]; externalProducerAdmissionRef: ByteRef }
export interface FinalProducerJournalV1 { version: "l8-final-producer-journal-fixture-v1"; producerId: FinalProducerV1["producerId"]; creationRef: ByteRef;
  entries: { sequence: number; operation: string; sourceRef: ByteRef; ownEventKey: string | null; actor: string; categories: FinalCategoryV1[] }[]; lastSequence: number }
export interface PolicyAssetLeaseV1 {
  version: "l8-policy-asset-lease-fixture-v1"; parentOwner: string; assetId: string; path: string; directoryOwnershipRef: ByteRef;
  assignmentRef: ByteRef; sourcePolicyRef: ByteRef; sourceManifestRef: ByteRef; exclusiveWriterRef: ByteRef;
}
export interface PolicyAssetReadbackV1 {
  version: "l8-policy-asset-readback-fixture-v1"; leaseRef: ByteRef; path: string; sourcePolicyRef: ByteRef; sourceManifestRef: ByteRef;
  closeRecordRef: ByteRef; actualReadRef: ByteRef; identityRef: ByteRef; utf8: string; byteLength: number; sha256: string;
}
export interface PolicyAssetPortV1 {
  lease: BoundDocument<PolicyAssetLeaseV1>; readback: BoundDocument<PolicyAssetReadbackV1> | null;
  evidence: BoundDocument<{ version: string }>[];
  current: { revision: number; leaseRef: ByteRef; readbackRef: ByteRef | null; revocationRef: ByteRef | null; unknownWriterRef: ByteRef | null } | null;
}
export interface FinalCategoryEvidenceV1 {
  version: "l8-final-category-evidence-fixture-v1"; category: FinalCategoryV1; domain: FinalDomainV1; registryRef: ByteRef;
  rows: unknown[]; sourceSnapshotRef: ByteRef; originRefs: ByteRef[];
  producerCuts: { producerId: FinalProducerV1["producerId"]; journalRef: ByteRef; lastSequence: number }[];
}
export interface FinalSnapshotV1 {
  version: "l8-final-snapshot-fixture-v1"; domain: FinalDomainV1; registryRef: ByteRef; expectedHead: unknown;
  categories: { [K in FinalCategoryV1]: BoundDocument<FinalCategoryEvidenceV1> };
  operationalEventKeys: string[]; rootLedger: unknown[]; knowledgeRef: ByteRef; candidateRef: CandidateRefV1; stagingRef: ByteRef;
  assetCurrent: PolicyAssetPortV1["current"];
}
export interface FinalHostPortV1 {
  readonly connection: Database; readonly registry: BoundDocument<FinalProducerRegistryV1>;
  readonly creationBeforeBootstrapRef: ByteRef; readonly asset: PolicyAssetPortV1;
  journals: BoundDocument<FinalProducerJournalV1>[];
  snapshot: BoundDocument<FinalSnapshotV1> | null;
  current: { revision: number; registryRef: ByteRef; snapshotRef: ByteRef | null; journalRefs: ByteRef[]; revocationRef: ByteRef | null } | null;
  cases: { document: BoundDocument<{ version: string }>; revision: number; currentRef: ByteRef; revocationRef: ByteRef | null }[];
  allocation: BoundDocument<{ version: string }>;
  parentAssignment: BoundDocument<{ version: string }>;
}
export const policyUtf8V1 = '{"lineageId":"lineage:author","maxActivationAttempts":2,"maxCandidateReplacements":1,"missionId":"author","version":"l8-activation-policy-source-v1"}';
export const policyShaV1 = "57f51b7201aec0bb8661a96c08d1ae4928d69e85334ea5d8da9cb7bdc2f059ec";
export function finalDocumentV1<T extends { version: string }>(doc: BoundDocument<T>): T {
  const measure145 = enterLocal145("finalDocument");
  let issue145: "returned" | "thrown" = "returned", text145: string | undefined;
  try {
  const value = JSON.parse(text145 = doc.utf8) as T; assertExecutionJsonV1(value); // Same single property read as138.
  invariant(canonical(resourceDocumentV1(value)) === canonical(doc), "HOLD: final source document bytes/ref mismatch"); return immutableCopy(value);
  } catch (error) { issue145 = "thrown"; throw error; }
  finally { if (measure145) leaveLocal145(measure145, issue145, text145); }
}
const producerWrites: Record<FinalProducerV1["producerId"], FinalCategoryV1[]> = {
  "own-control92": ["origins", "units", "proofs", "sourceCapabilities", "controllerLeases", "stagedUnits", "stagedBlobs"],
  "parent-policy-file92": ["materializations", "materializationReadbacks", "proofs", "requiredFiles"],
};
const terminalProducerWrites108: FinalCategoryV1[] = ["origins", "families", "units", "executions", "intents", "outboxes", "attemptsL6", "claims", "proofs", "releases", "sourceCapabilities", "controllerLeases", "physicalAllocations", "stagedUnits", "stagedBlobs"];
export function verifyFinalAllocationV1(db: Database, port: FinalHostPortV1): void {
  invariant(port.connection === db, "HOLD: final source wrong connection");
  const registry = finalDocumentV1(port.registry), allocation = finalDocumentV1(port.allocation) as {
    version: string; domain: { universeId: string; missionId: string; lineageId: string; rootAccountId: string }; parentLeaseRef: ByteRef;
    roster: string[]; noExternalProducerAdmission: { executor: string; dispatcher: string; scientificPublisher: string; native: string } };
  const parent = finalDocumentV1(port.parentAssignment) as { version: string; manifestSha: string; manifestUtf8: string; manifestPath: string;
    assignment: { ordinal: number; caseRoot: string; leaseId: string }; parentOwner: string; directoryIdentity: string };
  const manifest = JSON.parse(parent.manifestUtf8) as { version: string; parentOwner: string; directoryIdentity: string; cases: { ordinal: number; caseRoot: string; leaseId: string }[] };
  const lease = finalDocumentV1(port.asset.lease);
  invariant(allocation.version === "l8-host93-producer-allocation" && parent.version === "l8-parent-asset-assignment93"
    && canonical(registry.allocationRef) === canonical(port.allocation.ref) && canonical(registry.externalProducerAdmissionRef) === canonical(port.allocation.ref)
    && canonical(allocation.parentLeaseRef) === canonical(port.parentAssignment.ref)
    && allocation.domain.universeId === registry.domain.universeId && allocation.domain.rootAccountId === registry.domain.rootAccountId
    && allocation.domain.missionId === registry.domain.missionId && allocation.domain.lineageId === registry.domain.lineageId
    && canonical(allocation.roster) === canonical(["own-control92", "parent-policy-file92"])
    && canonical(allocation.noExternalProducerAdmission) === canonical({ executor: "NOT_ADMITTED", dispatcher: "NOT_ADMITTED", scientificPublisher: "NOT_ADMITTED", native: "NOT_ADMITTED" }),
    "HOLD: privileged producer allocation bytes/provenance incomplete");
  invariant(parent.manifestPath.length > 0 && hash(Buffer.from(parent.manifestUtf8, "utf8")) === parent.manifestSha
    && manifest.version === "ff8-t2-parent-asset-leases-v1" && manifest.parentOwner === parent.parentOwner && manifest.directoryIdentity === parent.directoryIdentity
    && manifest.cases.filter(entry => entry.ordinal === parent.assignment.ordinal && entry.leaseId === parent.assignment.leaseId && entry.caseRoot === parent.assignment.caseRoot).length === 1
    && lease.parentOwner === parent.parentOwner && lease.assetId === parent.assignment.leaseId
    && lease.path.replaceAll("\\", "/") === `${parent.assignment.caseRoot.replaceAll("\\", "/")}/synthetic/activation.json`
    && canonical(lease.assignmentRef) === canonical(port.parentAssignment.ref) && canonical(lease.directoryOwnershipRef) === canonical(port.parentAssignment.ref)
    && canonical(lease.exclusiveWriterRef) === canonical(port.parentAssignment.ref), "HOLD: independent parent asset assignment/manifest/source scope mismatch");
}
export function verifyPolicyAssetV1(asset: PolicyAssetPortV1, promisedPath: string, policyRef: ByteRef, manifestRef: ByteRef) {
  const lease = finalDocumentV1(asset.lease), current = asset.current;
  if (current) integer(current.revision, 1);
  invariant(current && current.revision >= 1 && !current.revocationRef && !current.unknownWriterRef && asset.readback
    && canonical(current.leaseRef) === canonical(asset.lease.ref) && canonical(current.readbackRef) === canonical(asset.readback.ref), "HOLD: promised file lease/readback/current unknown/revoked");
  const readback = finalDocumentV1(asset.readback);
  const evidence = (ref: ByteRef) => { const doc = asset.evidence.find(item => canonical(item.ref) === canonical(ref));
    invariant(doc, "HOLD: actual file close/read/identity source bytes unavailable"); return finalDocumentV1(doc); };
  const closed = evidence(readback.closeRecordRef) as { version: string; path: string; closed: boolean; leaseRef: ByteRef };
  const observed = evidence(readback.actualReadRef) as { version: string; actualPath: string; utf8: string; sha256: string; identityRef: ByteRef };
  const identity = evidence(readback.identityRef) as { version: string; actualPath: string; dev: string; ino: string; size: string; mtime: string };
  invariant(closed.version === "l8-real-policy-close93" && closed.closed === true && closed.path === readback.path && canonical(closed.leaseRef) === canonical(asset.lease.ref)
    && observed.version === "l8-real-policy-observation93" && observed.actualPath === readback.path && observed.utf8 === readback.utf8 && observed.sha256 === readback.sha256
    && canonical(observed.identityRef) === canonical(readback.identityRef) && identity.version === "l8-real-policy-identity93" && identity.actualPath === readback.path
    && identity.size === String(readback.byteLength) && identity.dev.length > 0 && identity.ino.length > 0 && identity.mtime.length > 0, "HOLD: actual file evidence/readback identity join mismatch");
  invariant(lease.path === promisedPath && readback.path === promisedPath && canonical(readback.leaseRef) === canonical(asset.lease.ref)
    && canonical(lease.sourcePolicyRef) === canonical(policyRef) && canonical(readback.sourcePolicyRef) === canonical(policyRef)
    && canonical(lease.sourceManifestRef) === canonical(manifestRef) && canonical(readback.sourceManifestRef) === canonical(manifestRef)
    && readback.utf8 === policyUtf8V1 && readback.byteLength === 149 && readback.sha256 === policyShaV1 && policyRef.sha256 === policyShaV1
    && policyRef.byteLength === 149 && lease.parentOwner.length > 0 && lease.assetId.length > 0
    && lease.directoryOwnershipRef && lease.exclusiveWriterRef && readback.closeRecordRef && readback.actualReadRef && readback.identityRef,
    "HOLD: promised actual policy file/source/readback mismatch");
  return { lease, readback };
}
type JournalEntry95 = FinalProducerJournalV1["entries"][number];
const ownOperations95: Record<string, { operation: string; categories: FinalCategoryV1[] }> = {
  g3_bootstrap_fixture: { operation: "bootstrap", categories: ["origins", "units", "sourceCapabilities", "controllerLeases"] },
  g3_initial_prepared: { operation: "prepare-initial", categories: ["origins", "proofs", "sourceCapabilities"] },
  g3_drain_entered: { operation: "request-drain", categories: ["origins", "proofs", "sourceCapabilities"] },
  g3_candidate_staged: { operation: "retain-pointed-candidate-units", categories: ["units", "stagedUnits", "stagedBlobs"] },
  g3_generation_activated: { operation: "activate-a", categories: ["origins", "units", "sourceCapabilities"] },
  g3_replacement_prepared: { operation: "prepare-replacement", categories: ["origins", "units", "proofs", "sourceCapabilities", "stagedUnits", "stagedBlobs"] },
  g3_candidate_replaced: { operation: "replace-candidate", categories: ["origins", "units", "proofs", "sourceCapabilities", "stagedUnits", "stagedBlobs"] },
};
/**98 A controller's registration is not a generation/fence grant. Resolve its
 * bound origin and the immutable authority chain that actually admitted it.
 * Historical fences come from their own bootstrap/T0 records, never today's
 * head or another caller-supplied controller with a matching number. */
function verifyControllerScope98(db: Database, registry: FinalProducerRegistryV1, document: string, digest: string, events: EventLog): void {
  const fail = "HOLD: final controller origin/envelope/fence scope join mismatch", d = registry.domain;
  invariant(digest === fingerprint(JSON.parse(document)), fail);
  const controller = JSON.parse(document) as FixtureControllerRecordV1;
  invariant(controller.kind === "controller" && controller.missionId === d.missionId && controller.owner === d.owner, fail);
  const currentRow = db.query("SELECT document,digest FROM g3_head WHERE mission=?").get(d.missionId) as { document: string; digest: string } | null;
  invariant(currentRow && currentRow.digest === fingerprint(JSON.parse(currentRow.document)), fail);
  const current = JSON.parse(currentRow.document) as GenerationViewV3;
  const checkHead = (head: GenerationViewV3) => invariant(head.missionId === d.missionId && head.lineageId === d.lineageId
    && head.rootAccountId === d.rootAccountId && head.owner === d.owner, fail);
  checkHead(current);
  const event = (key: string, kind: string) => {
    const row = db.query("SELECT kind,time,payload,unit_id,digest,sequence FROM ff8_events WHERE mission=? AND key=?").get(d.missionId, key) as
      { kind: string; time: number; payload: string; unit_id: string | null; digest: string; sequence: number } | null;
    invariant(row && row.kind === kind && row.unit_id === null, fail);
    const payload: unknown = JSON.parse(row.payload);
    invariant(row.digest === fingerprint({ kind: row.kind, time: row.time, payload, unitId: row.unit_id }), fail); return { payload, sequence: row.sequence };
  };
  const resolve = (generation: string, path: Set<string>): { bound: ReadonlyData<BoundExecutionV1>; sourceDigest: string; fence: number } => {
    invariant(!path.has(generation), fail); path.add(generation);
    const row = db.query("SELECT document,digest,state FROM g3_origins WHERE mission=? AND generation=?").get(d.missionId, generation) as
      { document: string; digest: string; state: string } | null;
    invariant(row && row.digest === fingerprint(JSON.parse(row.document)), fail);
    const retained = JSON.parse(row.document) as { origin: ParsedExecutionEnvelopeV1; independent: IndependentlyLoadedSourcesV1 };
    const binding = bindExecutionSourcesV1(retained.origin, retained.independent); invariant(binding.ok, fail);
    const bound = binding.value, body = bound.body;
    invariant(bound.origin.generationId === generation && body.missionId === d.missionId && body.generation.lineageId === d.lineageId
      && body.admissionSource.budgetLineage.rootAccountId === d.rootAccountId, fail);
    if (row.state === "ACTIVE") invariant(current.generationId === generation && current.envelopeFingerprint === bound.origin.envelope.fingerprint, fail);
    else if (row.state === "PREPARED" || row.state === "PENDING_DRAIN") invariant(row.state === "PREPARED" && replacementStage120(db, events, generation) || current.candidateGenerationId === generation && current.candidateRef
      && canonical(current.candidateRef.envelopeRef) === canonical(bound.origin.document.ref)
      && current.candidateRef.envelopeFingerprint === bound.origin.envelope.fingerprint, fail);
    else invariant(row.state === "RETIRED" || row.state === "ABORTED" && replacementForOld120(db, events, generation), fail);
    let fence: number;
    if (body.authorizationKind === "bootstrap-a-fixture-v1") {
      invariant(body.generation.ordinal === 0 && body.generation.parentGenerationId === null, fail);
      const admitted = event(`bootstrap:${generation}`, "g3_bootstrap_fixture").payload as GenerationViewV3; checkHead(admitted);
      invariant(admitted.generationId === generation && admitted.activeGenerationId === generation && admitted.sourceDigest === row.digest
        && admitted.envelopeFingerprint === bound.origin.envelope.fingerprint && admitted.controllerFence === body.preparationObservationT0.controllerFence, fail);
      fence = admitted.controllerFence;
    } else {
      invariant(body.authorizationKind === "transition-a-fixture-v1" && body.generation.parentGenerationId, fail);
      const parent = resolve(body.generation.parentGenerationId, path);
      const stage = replacementStage120(db, events, generation);
      if (stage) {
        const s = stage.value, observation = readTransitionDocumentV1<TransitionObservationV1>(db, s.observationRef, true);
        checkHead(s.headBefore); checkHead(s.headAfter);
        invariant(s.headBefore.generationId === parent.bound.origin.generationId && s.headBefore.sourceDigest === parent.sourceDigest
          && s.headBefore.controllerFence === parent.fence && s.headAfter.controllerFence === parent.fence
          && canonical(observation.parentOriginRef) === canonical(parent.bound.origin.document.ref)
          && canonical(observation.expectedHead) === canonical(s.headBefore) && canonical(observation.t0) === canonical(body.preparationObservationT0), fail);
        if (row.state === "ACTIVE") invariant(current.controllerFence === parent.fence, fail);
        path.delete(generation); return { bound, sourceDigest: row.digest, fence: parent.fence };
      }
      const index = db.query("SELECT document,digest FROM g3_authority WHERE kind='initial-preparation' AND record_ref=?").get(`initial:${generation}`) as { document: string; digest: string } | null;
      invariant(index && index.digest === fingerprint(JSON.parse(index.document)), fail);
      const prepared = JSON.parse(index.document) as { document: BoundDocument<PreparedTransitionValueV1>; candidateRef: CandidateRefV1 };
      const preparation = readTransitionDocumentV1<PreparedTransitionValueV1>(db, prepared.document.ref, true);
      invariant(canonical(resourceDocumentV1(preparation)) === canonical(prepared.document) && canonical(prepared.candidateRef) === canonical(preparation.candidateRef)
        && preparation.candidateRef.generationId === generation && canonical(preparation.candidateRef.envelopeRef) === canonical(bound.origin.document.ref)
        && preparation.candidateRef.envelopeFingerprint === bound.origin.envelope.fingerprint, fail);
      const admitted = event(`prepare:${generation}`, "g3_initial_prepared");
      invariant(canonical(admitted.payload) === canonical(preparation) && admitted.sequence === preparation.eventAfter, fail);
      checkHead(preparation.headBefore); checkHead(preparation.headAfter);
      const observation = readTransitionDocumentV1<TransitionObservationV1>(db, preparation.observationRef, true);
      const t0 = readTransitionDocumentV1<{ version: string; t0: PreparationObservationT0 }>(db, preparation.expectedT0Ref, true);
      invariant(observation.version === "l8-fixture-transition-observation-v1" && t0.version === "l8-fixture-retained-t0-v1"
        && canonical(observation.expectedHead) === canonical(preparation.headBefore)
        && canonical(observation.parentOriginRef) === canonical(parent.bound.origin.document.ref)
        && preparation.headBefore.generationId === parent.bound.origin.generationId && preparation.headBefore.sourceDigest === parent.sourceDigest
        && preparation.headBefore.envelopeFingerprint === parent.bound.origin.envelope.fingerprint
        && preparation.headBefore.controllerFence === parent.fence && preparation.headAfter.controllerFence === parent.fence
        && canonical(t0.t0) === canonical(observation.t0) && canonical(t0.t0) === canonical(body.preparationObservationT0)
        && t0.t0.controllerFence === parent.fence && observation.eventSequence === preparation.eventBefore
        && preparation.eventAfter === preparation.eventBefore + 1, fail);
      fence = parent.fence;
    }
    if (row.state === "ACTIVE") invariant(current.controllerFence === fence, fail);
    path.delete(generation); return { bound, sourceDigest: row.digest, fence };
  };
  const authority = resolve(controller.generationId, new Set<string>());
  invariant(controller.envelopeFingerprint === authority.bound.origin.envelope.fingerprint && controller.controllerFence === authority.fence, fail);
  // No historical TTL/current-generation requirement: retired controllers remain
  // explainable evidence, not current executable authority.
}
/**95 Resolve the reference from durable OWN bytes, then check the *meaning* of
 * those bytes against the admitted operation. A covered key is not authority. */
function verifyOwnEntry95(db: Database, registry: FinalProducerRegistryV1, entry: JournalEntry95, events: EventLog): void {
  const fail = "HOLD: final OWN producer/operation/source/category join mismatch", d = registry.domain;
  invariant(entry.actor === d.owner, fail);
  if (entry.ownEventKey === null) {
    if (entry.operation === "register-independent-current-template-source") {
      const rows = db.query("SELECT * FROM g3_authority WHERE kind='replacement-host-source120' ORDER BY record_ref").all() as { document: string; digest: string; revoked: number }[];
      const row = rows.find(row => canonical(resourceDocumentV1({ version: "l8-host-registered-source95", row }).ref) === canonical(entry.sourceRef));
      invariant(row && !row.revoked && row.digest === fingerprint(JSON.parse(row.document)) && canonical(entry.categories) === canonical(["sourceCapabilities", "proofs"]), fail);
      const source = finalDocumentV1(JSON.parse(row.document)) as ReplacementSource120, allocation = readReplacementDocument120<ReplacementAllocation120>(db, source.allocationRef, "replacement-host-allocation120").value;
      invariant(allocation.rootAccountId === d.rootAccountId && allocation.missionId === d.missionId && allocation.lineageId === d.lineageId && allocation.owner === d.owner, fail); return;
    }
    invariant(entry.operation === "register-source-controller", fail);
    const rows = db.query("SELECT * FROM g3_authority WHERE kind IN ('controller','origin-grant','resource-acquisition') ORDER BY record_ref").all() as
      { record_ref: string; kind: string; revision: number; document: string; digest: string; revoked: number }[];
    const row = rows.find(row => canonical(resourceDocumentV1({ version: "l8-host-registered-source95", row }).ref) === canonical(entry.sourceRef));
    invariant(row && row.digest === fingerprint(JSON.parse(row.document)) && !row.revoked, fail);
    invariant(canonical(entry.categories) === canonical(row.kind === "controller" ? ["sourceCapabilities", "controllerLeases"] : ["sourceCapabilities"]), fail);
    if (row.kind === "controller") verifyControllerScope98(db, registry, row.document, row.digest, events);
    else { const value = finalDocumentV1(JSON.parse(row.document)) as { version: string; scope?: { missionId: string; lineageId: string; rootAccountId: string }; poolScope?: { poolId: string } };
      invariant(row.kind === "origin-grant" ? value.version === "l8-fixture-origin-grant-v1" && value.scope?.missionId === d.missionId
        && value.scope.lineageId === d.lineageId && value.scope.rootAccountId === d.rootAccountId
        : value.version === "l8-s2-resource-acquisition-fixture-v1" && !!value.poolScope?.poolId, fail); }
    return;
  }
  const row = db.query("SELECT * FROM ff8_events WHERE mission=? AND key=?").get(d.missionId, entry.ownEventKey) as
    { mission: string; sequence: number; time: number; key: string; kind: string; unit_id: string | null; payload: string; digest: string } | null;
  invariant(row, fail);
  const event: GraphEvent = { version: 1, missionId: row.mission, sequence: row.sequence, time: row.time, key: row.key, kind: row.kind,
    unitId: row.unit_id, payload: JSON.parse(row.payload), digest: row.digest };
  const work = terminalWorkEvent108(db, event);
  if (work) {
    invariant(entry.operation === work.operation && canonical(entry.categories) === canonical(work.categories)
      && canonical(entry.sourceRef) === canonical(resourceDocumentV1({ version: "l8-host-own-event-source95", event }).ref), fail); return;
  }
  const spec = Object.prototype.hasOwnProperty.call(ownOperations95, event.kind) ? ownOperations95[event.kind] : undefined;
  invariant(spec && entry.operation === spec.operation && canonical(entry.categories) === canonical(spec.categories) && event.unitId === null
    && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId })
    && canonical(entry.sourceRef) === canonical(resourceDocumentV1({ version: "l8-host-own-event-source95", event }).ref), fail);
  const head = (value: GenerationViewV3) => invariant(value.missionId === d.missionId && value.lineageId === d.lineageId
    && value.rootAccountId === d.rootAccountId && value.owner === d.owner, fail);
  const origin = (generation: string) => {
    const retained = db.query("SELECT document,digest FROM g3_origins WHERE mission=? AND generation=?").get(d.missionId, generation) as { document: string; digest: string } | null;
    invariant(retained && retained.digest === fingerprint(JSON.parse(retained.document)), fail);
    const value = JSON.parse(retained.document) as { origin: { generationId: string; document: BoundDocument<{ version: string }>;
      envelope: { fingerprint: string; generation: { lineageId: string }; admissionSource: { budgetLineage: { rootAccountId: string } } } } };
    invariant(value.origin.generationId === generation && value.origin.envelope.generation.lineageId === d.lineageId
      && value.origin.envelope.admissionSource.budgetLineage.rootAccountId === d.rootAccountId, fail); return { ...value, digest: retained.digest };
  };
  const retained = (key: string, kind: string, payload: unknown) => {
    const record = db.query("SELECT document,digest FROM g3_authority WHERE record_ref=? AND kind=?").get(key, kind) as { document: string; digest: string } | null;
    invariant(record && record.digest === fingerprint(JSON.parse(record.document)) && canonical(JSON.parse(record.document)) === canonical(payload), fail);
  };
  if (event.kind === "g3_bootstrap_fixture") {
    const value = event.payload as GenerationViewV3, source = origin(value.generationId); head(value);
    invariant(event.key === `bootstrap:${value.generationId}` && value.sourceDigest === source.digest
      && value.envelopeFingerprint === source.origin.envelope.fingerprint && value.activeGenerationId === value.generationId, fail);
  } else if (event.kind === "g3_initial_prepared") {
    const value = event.payload as PreparedTransitionValueV1; head(value.headBefore); head(value.headAfter); origin(value.candidateRef.generationId);
    const document = resourceDocumentV1(value);
    invariant(event.key === `prepare:${value.candidateRef.generationId}` && event.sequence === value.eventAfter
      && canonical(readTransitionDocumentV1(db, document.ref, true)) === canonical(value), fail);
    retained(`initial:${value.candidateRef.generationId}`, "initial-preparation", { document, candidateRef: value.candidateRef });
  } else if (event.kind === "g3_replacement_prepared") {
    const value = event.payload as ReplacementStageValue120, stage = replacementStage120(db, events, value.newCandidateRef.generationId);
    invariant(stage && canonical(stage.value) === canonical(value), fail); head(value.headBefore); head(value.headAfter); origin(value.newCandidateRef.generationId);
  } else if (event.kind === "g3_candidate_replaced") {
    const value = event.payload as ReplacementResult120, proof = replacementForOld120(db, events, value.value.oldCandidateRef.generationId);
    invariant(proof && canonical({ document: proof.document, value: proof.value, proofRef: proof.proofRef }) === canonical(value), fail);
    head(proof.proof.headBefore); head(proof.proof.headAfter); origin(value.value.oldCandidateRef.generationId); origin(value.value.newCandidateRef.generationId);
  } else if (event.kind === "g3_drain_entered") {
    const value = event.payload as DrainResultV1; origin(value.value.candidateRef.generationId);
    const authorization = readTransitionDocumentV1<{ version: string; owner: string; expectedHead: GenerationViewV3 }>(db, value.authorizationRef, true); head(authorization.expectedHead);
    invariant(authorization.owner === d.owner && event.key === `drain:${value.value.barrierRootId}` && event.sequence === value.value.eventSequence
      && canonical(readTransitionDocumentV1(db, value.document.ref, true)) === canonical(value.value), fail);
    retained(event.key, "drain-result", value);
  } else if (event.kind === "g3_candidate_staged") {
    const value = event.payload as { document: BoundDocument<CandidateStagingV1>; value: CandidateStagingV1 }; origin(value.value.candidateRef.generationId);
    invariant(event.key === `candidate-staging:${value.value.candidateRef.generationId}`
      && canonical(resourceDocumentV1(value.value)) === canonical(value.document)
      && canonical(readTransitionDocumentV1(db, value.document.ref, true)) === canonical(value.value), fail);
    const cut = db.query("SELECT document FROM g3_authority WHERE kind='drain-result' AND record_ref=?").get(`drain:${value.value.barrierRootId}`) as { document: string } | null;
    invariant(cut, fail); const original = (JSON.parse(cut.document) as DrainResultV1).value.candidateRef;
    const replacement = replacementForOld120(db, events, original.generationId);
    invariant(canonical(original) === canonical(value.value.candidateRef) || replacement && replacement.value.barrierRootId === value.value.barrierRootId
      && canonical(replacement.value.newCandidateRef) === canonical(value.value.candidateRef), fail);
  } else {
    const value = event.payload as ActivationResultV1; head(value.headBefore); head(value.headAfter); origin(value.headAfter.generationId);
    invariant(value.outcome === "COMMITTED" && event.key === `activation-outcome:${value.activationAttemptId}` && value.activationRecordRef
      && canonical(readTransitionDocumentV1(db, value.document.ref, true)) === canonical((({ document: _doc, ...rest }) => rest)(value)), fail);
    const activation = readTransitionDocumentV1<{ version: string; headBefore: GenerationViewV3; headAfter: GenerationViewV3; consumedCaseRef: ByteRef }>(db, value.activationRecordRef, true);
    invariant(canonical(activation.headBefore) === canonical(value.headBefore) && canonical(activation.headAfter) === canonical(value.headAfter)
      && canonical(activation.consumedCaseRef) === canonical(value.consumedCaseRef), fail);
    retained(`activation-result:${value.activationAttemptId}`, "activation-result", value);
  }
}
function verifyFileEntry95(port: FinalHostPortV1, entry: JournalEntry95): void {
  const fail = "HOLD: final file producer/operation/source/category join mismatch", lease = finalDocumentV1(port.asset.lease);
  invariant(entry.ownEventKey === null && entry.actor === lease.parentOwner, fail);
  const document = port.asset.evidence.find(doc => canonical(doc.ref) === canonical(entry.sourceRef)); invariant(document, fail);
  const value = finalDocumentV1(document) as { version: string; path?: string; actualPath?: string; leaseRef?: ByteRef; parentAssignmentRef?: ByteRef;
    actor?: string; producerId?: string; utf8?: string; sha256?: string; byteLength?: number; mode?: string; closed?: boolean; identityRef?: ByteRef };
  if (entry.operation === "create-policy-exclusive") {
    invariant(value.version === "l8-real-policy-create95" && value.path === lease.path && value.mode === "wx" && value.actor === lease.parentOwner
      && value.producerId === "parent-policy-file92" && canonical(value.leaseRef) === canonical(port.asset.lease.ref)
      && canonical(value.parentAssignmentRef) === canonical(port.parentAssignment.ref) && typeof value.utf8 === "string"
      && hash(Buffer.from(value.utf8, "utf8")) === value.sha256 && Buffer.byteLength(value.utf8, "utf8") === value.byteLength
      && canonical(entry.categories) === canonical(["materializations", "requiredFiles"]), fail);
  } else if (entry.operation === "close-policy") {
    invariant(value.version === "l8-real-policy-close93" && value.path === lease.path && value.closed === true
      && canonical(value.leaseRef) === canonical(port.asset.lease.ref) && canonical(entry.categories) === canonical(["materializations", "proofs"]), fail);
  } else {
    invariant(entry.operation === "readback-policy" && value.version === "l8-real-policy-observation93" && value.actualPath === lease.path
      && typeof value.utf8 === "string" && hash(Buffer.from(value.utf8, "utf8")) === value.sha256 && value.identityRef
      && canonical(entry.categories) === canonical(["materializationReadbacks", "proofs", "requiredFiles"]), fail);
    const identity = port.asset.evidence.find(doc => canonical(doc.ref) === canonical(value.identityRef)); invariant(identity, fail);
    const actual = finalDocumentV1(identity) as { version: string; actualPath: string; size: string };
    invariant(actual.version === "l8-real-policy-identity93" && actual.actualPath === lease.path && actual.size === String(Buffer.byteLength(value.utf8, "utf8")), fail);
  }
}
/**95 Complete external preimage only: no OWN projections, connection object,
 * callback or IO. The legitimate T2 OWN postimage is checked separately. */
export function finalExternalSources95(port: FinalHostPortV1): string {
  return canonical({ registry: port.registry, allocation: port.allocation, parentAssignment: port.parentAssignment,
    creationBeforeBootstrapRef: port.creationBeforeBootstrapRef, asset: port.asset, journals: port.journals,
    snapshot: port.snapshot, current: port.current, cases: port.cases });
}
export function verifyFinalHostV1(db: Database, port: FinalHostPortV1, events: EventLog): { snapshot: FinalSnapshotV1; registry: FinalProducerRegistryV1 } {
  invariant(events.db === db && Object.getPrototypeOf(events) === EventLog.prototype, "HOLD: final history requires actual OWN EventLog");
  verifyFinalAllocationV1(db, port);
  invariant(port.connection === db && port.current && !port.current.revocationRef && port.snapshot, "HOLD: final HOST provider/current unavailable");
  integer(port.current.revision, 1);
  const registry = finalDocumentV1(port.registry), snapshot = finalDocumentV1(port.snapshot);
  invariant(registry.version === "l8-final-producer-registry-fixture-v1" && snapshot.version === "l8-final-snapshot-fixture-v1"
    && canonical(port.current.registryRef) === canonical(port.registry.ref) && canonical(port.current.snapshotRef) === canonical(port.snapshot.ref)
    && canonical(snapshot.registryRef) === canonical(port.registry.ref) && canonical(snapshot.domain) === canonical(registry.domain)
    && canonical(registry.producers.map(p => p.producerId).sort()) === canonical(["own-control92", "parent-policy-file92"])
    && port.creationBeforeBootstrapRef && registry.allocationRef && registry.externalProducerAdmissionRef, "HOLD: final HOST universe/closed producer provenance mismatch");
  const file = (db.query("PRAGMA database_list").all() as { name: string; file: string }[]).find(row => row.name === "main")?.file;
  invariant(file?.replaceAll("\\", "/").toLowerCase() === registry.domain.connectionPath.replaceAll("\\", "/").toLowerCase(), "HOLD: final HOST OWN assignment mismatch");
  const ownership = readTransitionDocumentV1<OriginOwnershipV1>(db, registry.domain.originOwnershipRef, true);
  invariant(ownership.domain.universeId === registry.domain.universeId && ownership.domain.rootAccountId === registry.domain.rootAccountId
    && ownership.domain.missionId === registry.domain.missionId && ownership.domain.lineageId === registry.domain.lineageId
    && canonical(ownership.issuerProvenanceRef) === canonical(port.creationBeforeBootstrapRef), "HOLD: final producer allocation lacks issued origin-domain provenance");
  invariant(canonical((finalDocumentV1(port.allocation) as { version: string; domain: unknown }).domain) === canonical(ownership.domain), "HOLD: final producer root domain is not the issued domain");
  const profile = (finalDocumentV1(port.allocation) as { version: string; terminalWorkProfile?: string }).terminalWorkProfile;
  const replacementProfile = (finalDocumentV1(port.allocation) as { version: string; replacementProfile?: string }).replacementProfile;
  invariant(replacementProfile === undefined || replacementProfile === "candidate-replacement120", "HOLD: unknown replacement producer profile");
  invariant(profile === undefined || profile === "never-sent-cross-epoch108", "HOLD: unknown producer operation profile");
  for (const producer of registry.producers) invariant(canonical([...producer.writes].sort()) === canonical([...(producer.producerId === "own-control92" && profile ? terminalProducerWrites108 : producerWrites[producer.producerId])].sort())
    && canonical(producer.authorityRef) === canonical(producer.producerId === "own-control92" ? port.allocation.ref : port.parentAssignment.ref)
    && canonical(producer.operationPolicyRef) === canonical(port.allocation.ref), "HOLD: unknown producer/operation authority");
  const journals = port.journals.map(doc => ({ doc, value: finalDocumentV1(doc) }));
  invariant(canonical(journals.map(j => j.value.producerId).sort()) === canonical(["own-control92", "parent-policy-file92"])
    && canonical(port.current.journalRefs) === canonical(port.journals.map(j => j.ref)), "HOLD: complete producer journals unknown/stale");
  const allowed = { "own-control92": ["bootstrap", "prepare-initial", "request-drain", "retain-pointed-candidate-units", "register-source-controller", "activate-a", ...(profile ? ["reserve-family", "allocate-resource", "prepare-admission", "burn-slot", "observe-execution", "release-resource", "release-family"] : []),
    ...(replacementProfile ? ["register-independent-current-template-source", "prepare-replacement", "replace-candidate"] : [])],
    "parent-policy-file92": ["create-policy-exclusive", "close-policy", "readback-policy"] };
  for (const j of journals) invariant(canonical(j.value.creationRef) === canonical(port.allocation.ref) && j.value.lastSequence === j.value.entries.length
    && j.value.entries.every((entry, i) => entry.sequence === i + 1 && allowed[j.value.producerId].includes(entry.operation) && entry.sourceRef), "HOLD: producer operation journal gap/unknown writer");
  for (const journal of journals) for (const entry of journal.value.entries) {
    closedResourceFieldsV1(entry, ["sequence", "operation", "sourceRef", "ownEventKey", "actor", "categories"]);
    if (journal.value.producerId === "own-control92") verifyOwnEntry95(db, registry, entry, events); else verifyFileEntry95(port, entry);
  }
  // Taxonomy is not authority: every admitted work entry below must also have a
  // complete positive terminal closure on this exact OWN, even postappend.
  collectTerminalHistory108(db, events, registry.domain);
  // Scope every retained controller, including one omitted from the registration
  // journal but still present in the complete controllerLeases/source inventory.
  for (const row of db.query("SELECT document,digest FROM g3_authority WHERE kind='controller' ORDER BY record_ref").all() as { document: string; digest: string }[])
    verifyControllerScope98(db, registry, row.document, row.digest, events);
  const fileEntries = journals.find(j => j.value.producerId === "parent-policy-file92")!.value.entries;
  const creates = fileEntries.filter(e => e.operation === "create-policy-exclusive"), closes = fileEntries.filter(e => e.operation === "close-policy"), reads = fileEntries.filter(e => e.operation === "readback-policy");
  invariant(creates.length === 1 && closes.length === 1 && reads.length >= 1 && creates[0]!.sequence < closes[0]!.sequence
    && reads.every(e => e.sequence > closes[0]!.sequence) && port.asset.readback, "HOLD: final file operation history incomplete/reordered");
  const readback = finalDocumentV1(port.asset.readback), create = finalDocumentV1(port.asset.evidence.find(e => canonical(e.ref) === canonical(creates[0]!.sourceRef))!) as
    { version: string; utf8: string; sha256: string; byteLength: number };
  invariant(canonical(closes[0]!.sourceRef) === canonical(readback.closeRecordRef) && canonical(reads.at(-1)!.sourceRef) === canonical(readback.actualReadRef)
    && create.utf8 === readback.utf8 && create.sha256 === readback.sha256 && create.byteLength === readback.byteLength, "HOLD: final file creation/close/latest-readback join mismatch");
  closedResourceFieldsV1(snapshot.categories, finalCategoriesV1);
  for (const category of finalCategoriesV1) {
    const evidence = finalDocumentV1(snapshot.categories[category]);
    invariant(evidence.category === category && canonical(evidence.domain) === canonical(registry.domain)
      && canonical(evidence.registryRef) === canonical(port.registry.ref) && Array.isArray(evidence.rows)
      && canonical(evidence.producerCuts.map(c => c.producerId).sort()) === canonical(["own-control92", "parent-policy-file92"]), "HOLD: final category/producer enumeration unknown");
    invariant(canonical(evidence.sourceSnapshotRef) === canonical(resourceDocumentV1({ version: "l8-host-category-raw93", category, rows: evidence.rows }).ref), "HOLD: category source snapshot bytes/ref mismatch");
    for (const cut of evidence.producerCuts) { const journal = journals.find(j => j.value.producerId === cut.producerId)!;
      invariant(canonical(cut.journalRef) === canonical(journal.doc.ref) && cut.lastSequence === journal.value.lastSequence, "HOLD: final producer high-water mark stale/incomplete"); }
  }
  return { snapshot, registry };
}
export function finalOwnRowsV1(db: Database, events: EventLog) {
  const rows = (table: string, order: string) => db.query(`SELECT * FROM ${table} ORDER BY ${order}`).all();
  const origins = rows("g3_origins", "mission,generation"), families = rows("g3_families", "mission,generation,unit"), units = rows("g3_units", "mission,generation,unit"), outboxes = rows("g3_outbox", "execution_id");
  const authority = rows("g3_authority", "record_ref") as { kind: string; record_ref: string; revision: number; document: string; digest: string; revoked: number }[];
  const controlKinds = new Set(["activation-case", "activation-attempt", "activation-receipt", "activation-counter", "activation-counter-current", "activation-outcome", "activation-result", "activation-record", "candidate-staging", "terminal-history-cut"]);
  const sources = authority.filter(row => !controlKinds.has(row.kind));
  const sourceKinds = new Set(["controller", "observation", "resource-acquisition", "resource-remaining", "resource-assignment", "resource-current", "transition-source", "origin-grant",
    "origin-counter-record", "origin-counter-current", "origin-host-source", "origin-grant-domain", "initial-preparation", "initial-preparation-record", "transition-case-current", "drain-cut", "drain-entry", "drain-result", "final-host-source", ...replacementKinds120]);
  invariant(sources.every(row => sourceKinds.has(row.kind) && row.digest === fingerprint(JSON.parse(row.document))), "HOLD: unknown/corrupt authority source in final inventory");
  invariant(sources.filter(row => row.kind === "resource-acquisition" || row.kind === "resource-current").every(row => row.revoked === 0), "HOLD: required physical source capability revoked");
  const referenced = new Set<string>();
  for (const row of sources) {
    if (row.kind === "origin-grant") referenced.add(canonical(JSON.parse(JSON.parse(row.document).utf8).approvalRef));
    if (row.kind === "initial-preparation") { const preparation = JSON.parse(JSON.parse(row.document).document.utf8); referenced.add(canonical(preparation.observationRef)); referenced.add(canonical(preparation.expectedT0Ref)); }
    if (row.kind === "drain-result") referenced.add(canonical(JSON.parse(row.document).authorizationRef));
    if (row.kind === "replacement-stage120") {
      const retained = JSON.parse(row.document) as BoundDocument<ReplacementStageValue120>, value = JSON.parse(retained.utf8) as ReplacementStageValue120;
      const stage = replacementStage120(db, events, value.newCandidateRef.generationId, true);
      invariant(stage && canonical(stage.document) === canonical(retained), "HOLD: final replacement stage/observation provenance");
      referenced.add(canonical(stage.value.observationRef));
    }
  }
  invariant(sources.filter(row => row.kind === "transition-source").every(row => referenced.has(canonical(JSON.parse(row.document).ref))), "HOLD: orphan transition source not explained by committed history");
  const pools = sources.filter(row => row.kind === "resource-acquisition").map(row => JSON.parse(JSON.parse(row.document).utf8).poolScope.poolId as string);
  const physical = pools.map(poolId => ({ poolId, inventory: readResourceInventoryV1(db, events, poolId) }));
  return { origins, families, units, outboxes, claims: rows("g3_claims", "resource_key"), sources,
    slots: rows("g3_slots", "root_id,slot_key"), roots: rows("g3_root", "root_id"), physical,
    staged: authority.filter(row => row.kind === "candidate-staging" || row.kind === "terminal-history-cut" || row.kind === "replacement-stage120") };
}
export function finalAuthorityFactsV1(db: Database, events: EventLog, port: FinalHostPortV1) {
  const sources = finalOwnRowsV1(db, events).sources;
  const refs = sources.map(row => resourceDocumentV1({ version: "l8-final-authority-row-v1", row }).ref);
  const authorityRecords = sources.map((row, i) => ({ recordRef: refs[i]!, revision: row.revision,
    revocationRef: row.revoked ? resourceDocumentV1({ version: "l8-final-authority-revocation-v1", recordRef: refs[i]!, revision: row.revision }).ref : null }));
  return { authorityRecords, proofRecordRefs: [...sources.flatMap((row, i) => row.kind === "observation" || replacementKinds120.includes(row.kind) ? [refs[i]!] : []), port.asset.readback!.ref],
    releaseRecordRefs: events.read(finalDocumentV1(port.registry).domain.missionId).filter(e => ["g3_resource_released", "g3_family_released"].includes(e.kind))
      .map(event => resourceDocumentV1({ version: "l8-terminal-release-event108", event }).ref), sourceCapabilityRecordRefs: [...sources.flatMap((row, i) => row.kind !== "observation" ? [refs[i]!] : []), port.registry.ref, port.asset.lease.ref] };
}
export function assertFinalOwnV1(db: Database, events: EventLog, port: FinalHostPortV1, expectedHead: unknown, candidate: CandidateRefV1, stagingRef: ByteRef): FinalSnapshotV1 {
  const { snapshot, registry } = verifyFinalHostV1(db, port, events), own = finalOwnRowsV1(db, events);
  //136 Only pure decoding of this invocation's immutable, already acquired
  // snapshot. Key includes ALL document bytes AND ref fields, never a ref alone.
  // No DB metadata, existence, HOST/Q state or successful LIVE guard is cached.
  //164 The name index only reuses a full key for this acquired, deeply frozen snapshot.
  // It is never an index of permission or of mutable HOST/ROW documents.
  let categoryContext164 = { keysByCategory: new Map<FinalCategoryV1, string>(), decodedByDocument: new Map<string, FinalCategoryEvidenceV1>() };
  const categoryEvidence = (name: FinalCategoryV1): FinalCategoryEvidenceV1 => {
    const doc = snapshot.categories[name];
    let key = categoryContext164.keysByCategory.get(name);
    if (key === undefined) { key = canonical(doc); categoryContext164.keysByCategory.set(name, key); }
    const old = categoryContext164.decodedByDocument.get(key);
    if (old) return old;
    const value = finalDocumentV1<FinalCategoryEvidenceV1>(doc); // returns an immutable owned copy
    categoryContext164.decodedByDocument.set(key, value); return value;
  };
  const category = (name: FinalCategoryV1) => categoryEvidence(name).rows;
  invariant(canonical(snapshot.expectedHead) === canonical(expectedHead) && canonical(snapshot.candidateRef) === canonical(candidate)
    && canonical(snapshot.stagingRef) === canonical(stagingRef), "HOLD: final inventory/head/candidate/staging stale");
  for (const [name, actual] of [["origins", own.origins], ["families", own.families], ["units", own.units], ["outboxes", own.outboxes], ["claims", own.claims],
    ["sourceCapabilities", own.sources], ["controllerLeases", own.sources.filter(row => row.kind === "controller")], ["proofs", [...own.sources.filter(row => row.kind === "observation" || replacementKinds120.includes(row.kind)), port.asset.readback]],
    ["stagedUnits", own.units.filter(row => (row as { state: string }).state === "STAGED")], ["stagedBlobs", own.staged]] as const) {
    const measure145 = enterLocal145("ownCategoryCompare");
    let issue145: "returned" | "thrown" = "returned";
    try {
    invariant(canonical(category(name)) === canonical(actual), "HOLD: final OWN enumeration incomplete/orphan");
    } catch (error) { issue145 = "thrown"; throw error; }
    finally { if (measure145) leaveLocal145(measure145, issue145); } // Objects: bytes unavailable by design, no additional serialization.
  }
  invariant(canonical(snapshot.rootLedger) === canonical(own.slots), "HOLD: final root slots/SPENT/encumbrance incomplete");
  invariant(own.roots.length === 1 && (own.roots[0] as { root_id: string }).root_id === registry.domain.rootAccountId
    && own.slots.every(row => (row as { root_id: string }).root_id === registry.domain.rootAccountId), "HOLD: orphan logical root/slot outside final domain");
  const allOrigins = (own.origins as { document: string }[]).map(row => JSON.parse(row.document).origin.document.ref as ByteRef);
  for (const name of finalCategoriesV1) invariant(canonical(categoryEvidence(name).originRefs) === canonical(allOrigins), "HOLD: final enumeration omitted historical origin");
  invariant(port.asset.readback && canonical(category("materializations")) === canonical([port.asset.readback])
    && canonical(category("materializationReadbacks")) === canonical([port.asset.readback])
    && canonical(category("requiredFiles")) === canonical([port.asset.lease]), "HOLD: final materialization/file enumeration incomplete");
  categoryContext164 = { keysByCategory: new Map<FinalCategoryV1, string>(), decodedByDocument: new Map<string, FinalCategoryEvidenceV1>() }; // Reset BOTH indexes BEFORE a fresh proof/Q read.
  const terminal = collectTerminalHistory108(db, events, registry.domain);
  invariant(own.claims.length === 0 && own.physical.every(p => p.inventory.active.length === 0), "HOLD: final fixture work is not quiescent");
  const intents = terminal ? terminal.unitSources.flatMap(row => (JSON.parse(row.document) as { subIntents: unknown[] }).subIntents.map(subIntent => ({ mission: row.mission, generation: row.generation, unit: row.unit, subIntent }))) : [];
  const attempts = own.outboxes.map(row => { const r = row as { execution_id: string; admission_utf8: string; attempt: number; state: string; receipt: string | null };
    return { executionId: r.execution_id, attemptId: JSON.parse(r.admission_utf8).attemptId, attempt: r.attempt, state: r.state, receipt: r.receipt }; });
  for (const [name, actual] of [["executions", own.outboxes], ["intents", intents], ["attemptsL6", attempts], ["releases", terminal?.releases ?? []],
    ["physicalAllocations", own.physical.flatMap(p => p.inventory.allocations)]] as const) invariant(canonical(category(name)) === canonical(actual), "HOLD: final terminal history category/source mismatch");
  for (const name of ["publications", "publicationReadbacks"] as const)
    invariant(category(name).length === 0, "HOLD: unexplained final operation/publication/attempt/release");
  categoryContext164.keysByCategory.clear(); categoryContext164.decodedByDocument.clear();
  // Emptiness here is opposed to the complete independent producer closure and
  // journals verified above, NOT inferred from absent product APIs/tables.
  const operationalEvents = events.read(registry.domain.missionId).filter(e => !["g3_activation_attempt", "g3_activation_outcome"].includes(e.kind));
  const ownJournal = port.journals.map(doc => finalDocumentV1(doc)).find(j => j.producerId === "own-control92")!;
  invariant(canonical(snapshot.operationalEventKeys) === canonical(operationalEvents.map(e => e.key))
    && canonical(ownJournal.entries.flatMap(entry => entry.ownEventKey === null ? [] : [entry.ownEventKey])) === canonical(operationalEvents.map(e => e.key)),
    "HOLD: final operation/OWN event journal unexplained");
  return immutableCopy(snapshot);
}
