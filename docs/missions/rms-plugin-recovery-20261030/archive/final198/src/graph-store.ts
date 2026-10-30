import { graphKeys, scientificCommitId, validateSchema, validateGraphDocument } from "./graph-pure-codecs";
export { validateGraphDocument } from "./graph-pure-codecs";
import type { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { openOwnDatabase } from "./store";
import { canonical, fingerprint, failureCause, bridgeFailureCategory, hash, validateFile, validateIdentity, validateKnowledge } from "./validation";
import type { GraphRun, GraphRunV2, InputBundle, Snapshot, StoredResult, GraphExecutionSource, GraphExecutionTemplate } from "./domain";
import type { PlannerResult } from "./planner";
import { graphInputs, parseGraphRun, nativeFrozenGraphInputsV1 } from "./graph-adapter";
import { assertNextContextRunScopesV1, nextContextFileV1, nextContextRootIdentityV1, parseNextContextApprovalRequestV1, parseNextContextApprovalV1, parseNextContextPolicyV1, parseNextContextProjectionV1, verifyNextContextRoleFilesV1, type NextContextApprovalRequestV1, type NextContextApprovalV1, type NextContextPolicyV1, type NextContextProjectionV1 } from "./graph-next-context";
import { assertPublicationManifestEvidenceV1, parsePublicationMaterializationV1, parseStaticPublicationPolicyV1, publicationTargetIdV1, type PublicationMaterializationV1, type StaticPublicationPolicyV1 } from "./graph-publication-materialization";
import { staticPublicationReadbackSourceV1 } from "./graph-static-publication";
import type { ExecutionClient } from "./client";
import { EventLog, GraphPersistenceError, immutableCopy, integer, invariant, nonempty, type ErrorClass, type GraphEvent } from "./eventlog";
import { UnitLeaseStore, assertController, assertExecutionQuiescence, assertCanonicalUnitProjection, contradictoryAcceptedObservation, type ControllerAuthority, type UnitLease } from "./unit-lease";
import { bindOwnedAtRestTransportV1 } from "./native-at-rest-transport";
import { observationDataHashV1, runNativeObservationDataV1, NATIVE_OBSERVATION_LIMITS_V1, type NativeObservationDataV1, type NativeObservationTransportV1 } from "./graph-native-observations";
import { bindOwnedNativeObservationTransportV1 } from "./native-observation-transport";
import { runNativeRuntimeObservationV2, nativeCompletionIntervalV1, type NativeRuntimeObservationV2 } from "./graph-native-observations";
import type { NativeRuntimeAuthorityV1, NativeRootLedgerV1, NativeRuntimeBindingV2, NativeRestWireImageV1 } from "./graph-runtime-binding";
import { assertNativeRootContinuityV1, readRuntimeDocumentV1 } from "./graph-runtime-binding";
import { assertOwnedAuthIntentV1, ownedAuthStateV1, type OwnedAuthIntentV1, type OwnedAuthStateV1, type OwnedAuthTransitionV1 } from "./graph-runtime-binding";
import { assertExecutionJsonV1, parseGraphRunV3, parseExecutionEnvelopeV1, bindExecutionSourcesV1, makeBoundDocumentV1, type GraphRunV3, type BoundDocument, type ByteRef, type IndependentlyLoadedSourcesV1, type BoundExecutionV1, type ReadonlyData } from "./graph-execution-envelope";
import { encodeNativeAdmissionWireV1, encodeNativeNotificationWireV1, submitNativeNotificationWireV1, submitNativeRestWireImageV1,
  type NativeRuntimeHttpPortV1, type NativeRuntimeAdmissionDataV1, type NativeNotificationWireV1 } from "./native-runtime-transport";

const nativeAtRestGuards = new WeakSet<() => void>();
/** Membership only: no public DTO/guard registration or authority factory. */
export function isOwnedNativeAtRestGuardV1(check: () => void): boolean { return nativeAtRestGuards.has(check); }
const nativeObservationGuards = new WeakSet<() => void>();
export function isOwnedNativeObservationGuardV1(check: () => void): boolean { return nativeObservationGuards.has(check); }
const nativeRuntimeGuards = new WeakSet<() => void>();
/** Capability membership only; DATA or a caller callback cannot register itself. */
export function isOwnedNativeRuntimeGuardV1(check: () => void): boolean { return nativeRuntimeGuards.has(check); }
/** Internal working ledger only; immutable captures at trust boundaries remain
 * frozen. A mutable draft is never retained as an authorization capability. */
function nativeLedgerDraft(root: NativeRootLedgerV1): NativeRootLedgerV1 { return JSON.parse(canonical(root)); }
interface NativeRetainedGrantV1 { identity: ReturnType<typeof nativeGrantIdentity>; maxBodyUtf8Bytes: number; unitCapUtf8Bytes: number; requiredBodyUtf8Bytes: number }
function nativeGrantIdentity(host: NativeRuntimeHostVerificationV1, expected: NativeRuntimeExpectedV1) {
  const slot = host.rootLedger.slots.find(s => s.slotKey === host.permit.slotKey); invariant(slot, "native retained grant slot unavailable", "auth");
  return { missionId: expected.missionId, unitId: expected.unitId, executionId: expected.executionId, commandId: expected.commandId ?? null,
    runRef: expected.runRef, imageSha256: expected.imageSha256, rootAccountId: host.rootLedger.rootAccountId, lineageId: host.rootLedger.lineageId,
    originId: host.permit.originId, slotKey: slot.slotKey, grantRef: slot.grantRef, slotCapUtf8Bytes: slot.capUtf8Bytes };
}
function retainNativeGrant(host: NativeRuntimeHostVerificationV1, expected: NativeRuntimeExpectedV1, unitCap: number, bytes: number): NativeRetainedGrantV1 {
  const grant = { identity: nativeGrantIdentity(host, expected), maxBodyUtf8Bytes: host.permit.maxBodyUtf8Bytes, unitCapUtf8Bytes: unitCap, requiredBodyUtf8Bytes: bytes };
  assertCurrentNativeGrant(host, expected, grant, bytes); return JSON.parse(canonical(grant));
}
function assertRetainedNativeGrant(host: NativeRuntimeHostVerificationV1, expected: NativeRuntimeExpectedV1, grant: NativeRetainedGrantV1, bytes: number): void {
  invariant(grant && canonical(grant.identity) === canonical(nativeGrantIdentity(host, expected)), "native stable grant root/origin/slot/image/scope changed", "auth");
  invariant([grant.maxBodyUtf8Bytes, grant.unitCapUtf8Bytes, grant.requiredBodyUtf8Bytes, bytes].every(n => Number.isSafeInteger(n) && n > 0)
    && bytes === grant.requiredBodyUtf8Bytes && bytes <= grant.maxBodyUtf8Bytes
    && grant.maxBodyUtf8Bytes <= grant.unitCapUtf8Bytes && grant.unitCapUtf8Bytes <= grant.identity.slotCapUtf8Bytes,
    "native retained body cap/integrity unavailable", "auth");
}
/** New effects need current POST capacity; physical GET/DATA preservation does
 * not spend that capacity and must survive its reduction or logical expiry. */
function assertCurrentNativeGrant(host: NativeRuntimeHostVerificationV1, expected: NativeRuntimeExpectedV1, grant: NativeRetainedGrantV1, bytes: number): void {
  assertRetainedNativeGrant(host, expected, grant, bytes);
  invariant(Number.isSafeInteger(host.permit.maxBodyUtf8Bytes) && bytes <= host.permit.maxBodyUtf8Bytes,
    "native current body cap unavailable or reduced below exact wire", "auth");
}

/** Durable classification is GLOBAL by identity, never a caller's native flag
 * or supplied mission filter. Also closes orphan/missing-table downgrade. */
export function assertLegacyNativeDispatchAbsentV1(db: Database, missionId: string, identities: unknown[] = []): void {
  const table = db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_graph_native_operations'").get();
  const events = db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_events'").get();
  if (!table) {
    invariant(!events || !db.query("SELECT 1 FROM ff8_events WHERE kind='rms_native_operation_prepared' LIMIT 1").get(), "native history lost; legacy downgrade forbidden", "auth");
    const meta = db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_graph_metadata'").get();
    invariant(!meta || (db.query("SELECT version FROM ff8_graph_metadata WHERE id=1").get() as { version: number }).version < 9, "native classification table missing; legacy forbidden", "auth"); return;
  }
  db.transaction(() => assertNativeRuntimeIntegrityV1(db))();
  const ids = new Set(identities.filter((v): v is string => typeof v === "string" && v.length > 0));
  const local = db.query("SELECT mission,document FROM ff8_graph_native_bindings WHERE binding_id LIKE 'root-acquisition:%' OR binding_id LIKE 'host-permit:%'").all() as Array<{ mission: string; document: string }>;
  for (const row of local) {
    const d = JSON.parse(row.document) as NativeLocalDecisionV1;
    invariant(row.mission !== missionId && (d.subject.version !== "rms-native-local-permit-v1"
      || ![d.subject.expected.executionId, d.subject.expected.runRef.sha256].some(v => ids.has(v))),
      "native parent decision requires native route; legacy downgrade forbidden", "auth");
  }
  const rows = db.query("SELECT n.execution_id,n.mission,n.document,n.digest,o.body FROM ff8_graph_native_operations n LEFT JOIN ff8_graph_outbox o ON o.execution_id=n.execution_id").all() as Array<{ execution_id: string; mission: string; document: string; digest: string; body: string | null }>;
  for (const row of rows) {
    const op = JSON.parse(row.document), admission = row.body ? JSON.parse(row.body) : null, command = admission?.command;
    invariant(fingerprint(op) === row.digest && admission, "native classification image lost/corrupt", "auth");
    invariant(row.mission !== missionId && ![row.execution_id, admission.idempotencyKey, admission.attemptId, command?.taskId,
      op.run?.ref?.sha256, op.wire?.sessionId, op.wire?.messageId].some(v => typeof v === "string" && ids.has(v)), "native operation requires native route; legacy downgrade forbidden", "auth");
  }
}

/** v7 adds only private next-context approvals; v1-v6 scientific rows/codecs stay exact. */
export const GRAPH_SCHEMA_VERSION = 9;
const NATIVE_RUNTIME_DDL = [
  "CREATE TABLE IF NOT EXISTS ff8_graph_native_roots(root_id TEXT PRIMARY KEY,mission TEXT NOT NULL,lineage TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,revision INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS ff8_graph_native_bindings(mission TEXT NOT NULL,binding_id TEXT NOT NULL,root_id TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,PRIMARY KEY(mission,binding_id))",
  "CREATE TABLE IF NOT EXISTS ff8_graph_native_operations(execution_id TEXT PRIMARY KEY,mission TEXT NOT NULL,unit_id TEXT NOT NULL,binding_id TEXT NOT NULL,session_id TEXT NOT NULL UNIQUE,message_id TEXT NOT NULL UNIQUE,document TEXT NOT NULL,digest TEXT NOT NULL,revision INTEGER NOT NULL,create_claim INTEGER NOT NULL,prompt_claim INTEGER NOT NULL)"
] as const;
/** Private rows and complete journal images must agree before reopen or any
 * native boundary. This checks integrity, never reconstructs missing authority. */
function assertNativeRuntimeIntegrityV1(db: Database): void {
  const operations = db.query("SELECT * FROM ff8_graph_native_operations").all() as Array<any>;
  const bindings = db.query("SELECT * FROM ff8_graph_native_bindings").all() as Array<any>;
  const roots = db.query("SELECT * FROM ff8_graph_native_roots").all() as Array<any>;
  const hasEvents = db.query("SELECT 1 FROM sqlite_master WHERE name='ff8_events' AND type='table'").get();
  const events = hasEvents ? db.query("SELECT * FROM ff8_events WHERE kind IN ('rms_native_operation_prepared','rms_native_effect_engaged','rms_native_ordered_grant_retained','rms_native_ordered_engaged','rms_native_ordered_admission_data','rms_native_local_decision') ORDER BY mission,sequence").all() as Array<any> : [];
  const usedEvents = new Set<any>(), usedBindings = new Set<any>();
  for (const mission of new Set<string>([...operations.map(r => r.mission), ...events.map(e => e.mission)])) {
    let sequence = 0, time = 0;
    const history = db.query("SELECT * FROM ff8_events WHERE mission=? ORDER BY sequence").all(mission) as Array<any>;
    for (const e of history) {
      invariant(e.sequence === ++sequence && e.time >= time && Number.isSafeInteger(e.time)
        && e.digest === fingerprint({ kind: e.kind, time: e.time, payload: JSON.parse(e.payload), unitId: e.unit_id }),
        "native mission event ordering/digest corrupt", "schema"); time = e.time;
    }
    const cursor = db.query("SELECT sequence,time FROM ff8_graph_streams WHERE mission=?").get(mission) as { sequence: number; time: number } | null;
    invariant(cursor && cursor.sequence === sequence && cursor.time === time, "native mission event cursor detached", "schema");
  }
  for (const e of events) {
    const p = JSON.parse(e.payload);
    invariant(Number.isSafeInteger(e.time) && e.time >= 0 && Number.isSafeInteger(e.sequence) && e.sequence > 0
      && canonical(p) === e.payload && e.digest === fingerprint({ kind: e.kind, time: e.time, payload: p, unitId: e.unit_id }),
      "native complete event digest corrupt", "schema");
  }
  const event = (mission: string, key: string, kind: string, unitId: string | null) => {
    const e = events.find(e => e.mission === mission && e.key === key);
    invariant(e && e.kind === kind && e.unit_id === unitId && !usedEvents.has(e), "native event mission/key/kind/unit join lost", "schema");
    usedEvents.add(e); return e;
  };
  const binding = (mission: string, id: string, root: string, document: unknown) => {
    const b = bindings.find(b => b.mission === mission && b.binding_id === id);
    invariant(b && !usedBindings.has(b) && b.root_id === root && b.document === canonical(document) && b.digest === fingerprint(document),
      "native private binding join corrupt", "schema"); usedBindings.add(b); return b;
  };
  const transitions: Array<{ e: any; before: NativeRootLedgerV1; after: NativeRootLedgerV1 }> = [];
  for (const row of bindings.filter(b => /^(root-acquisition:|host-permit:)/.test(b.binding_id))) {
    const d = JSON.parse(row.document) as NativeLocalDecisionV1;
    validateNativeLocalDecision(d);
    invariant(d.id === row.binding_id && d.missionId === row.mission && d.rootAccountId === row.root_id, "native local decision scope corrupt", "schema");
    binding(row.mission, row.binding_id, row.root_id, d);
    const history = events.filter(e => e.mission === row.mission && e.kind === "rms_native_local_decision" && JSON.parse(e.payload).id === d.id);
    invariant(history.length === d.revision + 1, "native local decision revisions/history lost", "schema");
    let previous: NativeLocalDecisionV1 | undefined;
    for (const e of history) {
      const v = JSON.parse(e.payload) as NativeLocalDecisionV1; validateNativeLocalDecision(v);
      event(row.mission, `rms.native.local:${d.id}:${v.revision}`, "rms_native_local_decision", null);
      invariant(e.key === `rms.native.local:${d.id}:${v.revision}` && v.revision === (previous ? previous.revision + 1 : 0)
        && canonical({ ...v, revision: 0, rights: null, lastInvocationSource: null }) === canonical({ ...d, revision: 0, rights: null, lastInvocationSource: null })
        && (!previous || (!v.rights.effect || previous.rights.effect) && (!v.rights.physical || previous.rights.physical)),
        "native local immutable decision/revocation corrupt", "schema"); previous = v;
    }
    invariant(canonical(previous) === row.document, "native local decision head corrupt", "schema");
  }
  const transition = (e: any, before: NativeRootLedgerV1, after: NativeRootLedgerV1, slotKey: string, encumber: number, spend: number, originId?: string) => {
    invariant(before && after && after.revision === before.revision + 1 && before.missionId === e.mission && after.missionId === e.mission,
      "native root transition identity/revision corrupt", "schema");
    invariant(JSON.parse(e.payload).rootId === before.rootAccountId && after.rootAccountId === before.rootAccountId,
      "native event/root account join corrupt", "schema");
    assertNativeRootContinuityV1(before, after);
    const next = nativeLedgerDraft(before), slot = next.slots.find(s => s.slotKey === slotKey);
    invariant(slot, "native root transition grant lost", "schema");
    if (originId && !next.origins.some(o => o.originId === originId)) {
      const added = after.origins.find(o => o.originId === originId); invariant(added && next.origins.length < 3, "native root origin evidence lost", "schema");
      next.origins.push(added);
    }
    slot.encumberedUtf8Bytes += encumber; slot.spentUtf8Bytes += spend; next.revision++;
    invariant(canonical(next) === canonical(after), "native root transition debit/postimage corrupt", "schema");
    transitions.push({ e, before, after });
  };
  for (const r of operations) {
    const d = JSON.parse(r.document), b = readRuntimeDocumentV1<NativeRuntimeBindingV2>(d.binding), run = readRuntimeDocumentV1<GraphRunV3>(d.run);
    invariant(r.document === canonical(d) && r.digest === fingerprint(d) && d.version === "rms-native-operation-v1"
      && d.expected.missionId === r.mission && d.expected.unitId === r.unit_id && d.expected.executionId === r.execution_id
      && d.lease.missionId === r.mission && d.lease.unitId === r.unit_id && d.wire.sessionId === r.session_id && d.wire.messageId === r.message_id
      && r.binding_id === d.binding.ref.sha256 && b.missionId === r.mission && b.rootAccountId === d.rootBefore.rootAccountId
      && b.lineageId === d.rootBefore.lineageId && b.generationId === d.rootBefore.generationId && b.headRevision === d.rootBefore.headRevision
      && canonical(b.runRef) === canonical(d.run.ref) && canonical(d.expected.runRef) === canonical(d.run.ref)
      && run.missionId === r.mission && d.expected.imageSha256 === hash(canonical(d.wire)), "native operation scope/image join corrupt", "schema");
    const g = d.grant as NativeRetainedGrantV1;
    invariant(g && g.identity.missionId === r.mission && g.identity.unitId === r.unit_id && g.identity.executionId === r.execution_id
      && g.identity.commandId === null && g.identity.rootAccountId === b.rootAccountId && g.identity.lineageId === b.lineageId
      && g.identity.imageSha256 === d.expected.imageSha256 && canonical(g.identity.runRef) === canonical(d.run.ref)
      && g.requiredBodyUtf8Bytes === d.wire.totalBodyUtf8Bytes, "native retained grant scope corrupt", "schema");
    const slot = d.rootBefore.slots.find((s: NativeRootLedgerV1["slots"][number]) => s.slotKey === g.identity.slotKey);
    invariant(slot && slot.capUtf8Bytes === g.identity.slotCapUtf8Bytes && canonical(slot.grantRef) === canonical(g.identity.grantRef)
      && [g.requiredBodyUtf8Bytes, g.maxBodyUtf8Bytes, g.unitCapUtf8Bytes].every(n => Number.isSafeInteger(n) && n > 0)
      && g.requiredBodyUtf8Bytes <= g.maxBodyUtf8Bytes && g.maxBodyUtf8Bytes <= g.unitCapUtf8Bytes && g.unitCapUtf8Bytes <= slot.capUtf8Bytes,
      "native retained slot/cap evidence corrupt", "schema");
    binding(r.mission, r.binding_id, b.rootAccountId, d.binding);
    const outbox = db.query("SELECT mission,unit_id,token,body,digest FROM ff8_graph_outbox WHERE execution_id=?").get(r.execution_id) as any;
    invariant(outbox && outbox.mission === r.mission && outbox.unit_id === r.unit_id && outbox.token === d.lease.token
      && fingerprint(JSON.parse(outbox.body)) === outbox.digest && outbox.digest === d.admissionDigest, "native outbox join corrupt", "schema");
    const create = JSON.parse(d.wire.create.utf8);
    invariant(canonical(encodeNativeAdmissionWireV1(JSON.parse(outbox.body), { sessionId: r.session_id, messageId: r.message_id,
      directory: create.location.directory, permissions: create.permissions })) === canonical(d.wire), "native retained REST bytes corrupt", "schema");
    const prepared = event(r.mission, `rms.native.operation:${r.execution_id}`, "rms_native_operation_prepared", r.unit_id);
    invariant(prepared.payload === canonical({ bindingId: r.binding_id, documentDigest: r.digest, rootId: b.rootAccountId,
      rootBefore: fingerprint(d.rootBefore), rootDigest: fingerprint(d.rootAfter) }), "native prepared root/document join corrupt", "schema");
    transition(prepared, d.rootBefore, d.rootAfter, g.identity.slotKey, d.wire.totalBodyUtf8Bytes, 0, g.identity.originId);
    invariant([r.create_claim, r.prompt_claim].every(n => n === 0 || n === 1) && r.prompt_claim <= r.create_claim
      && r.revision === r.create_claim + r.prompt_claim, "native claim flags/revision corrupt", "schema");
    let previous = prepared.sequence;
    for (const phase of ["create", "prompt"] as const) {
      const key = `rms.native.claim:${r.execution_id}:${phase}`, exists = events.find(e => e.mission === r.mission && e.key === key);
      invariant(Boolean(exists) === Boolean(r[`${phase}_claim`]), "native claim flag/history mismatch", "schema");
      if (!exists) continue;
      const e = event(r.mission, key, "rms_native_effect_engaged", r.unit_id), p = JSON.parse(e.payload);
      invariant(e.sequence > previous && e.payload === canonical({ executionId: r.execution_id, phase, imageSha256: d.expected.imageSha256,
        rootId: b.rootAccountId, rootBefore: fingerprint(p.before), rootAfter: fingerprint(p.after), before: p.before, after: p.after }),
        "native claim image/root/order corrupt", "schema");
      transition(e, p.before, p.after, g.identity.slotKey, 0, d.wire[phase].byteLength); previous = e.sequence;
    }
  }
  const commands = db.query("SELECT * FROM ff8_graph_ordered_commands").all() as Array<any>;
  for (const c of commands) {
    const image = JSON.parse(c.document); if (!image.nativeWire) continue;
    const opRow = operations.find(o => o.mission === c.mission && o.execution_id === image.request.executionId);
    invariant(opRow && c.digest === fingerprint(image) && c.command_id === image.request.commandId && c.unit_id === image.request.unitId
      && image.missionId === c.mission, "native ordered command join corrupt", "schema");
    const op = JSON.parse(opRow.document), wire = image.nativeWire;
    invariant(canonical(encodeNativeNotificationWireV1(opRow.session_id, c.mission, c.command_id, image.request, hash(canonical(op.wire)))) === canonical(wire),
      "native ordered image corrupt", "schema");
    const retained = bindings.find(b => b.mission === c.mission && b.binding_id === `ordered-grant:${c.command_id}`);
    if (!retained) { invariant(c.delivery === "PENDING" && !c.remote_receipt, "native ordered grant lost", "schema"); continue; }
    const d = JSON.parse(retained.document), g = d.grant as NativeRetainedGrantV1;
    binding(c.mission, retained.binding_id, op.grant.identity.rootAccountId, d);
    invariant(d.version === "rms-native-ordered-grant-v1" && d.commandId === c.command_id && d.executionId === opRow.execution_id
      && d.unitId === c.unit_id && d.commandDigest === c.digest && canonical(d.wire) === canonical(wire)
      && canonical(d.expected) === canonical({ ...op.expected, imageSha256: hash(canonical(wire)), commandId: c.command_id, purpose: "effect" })
      && g.identity.originId === op.grant.identity.originId && g.identity.slotKey === op.grant.identity.slotKey
      && g.identity.rootAccountId === op.grant.identity.rootAccountId && g.identity.imageSha256 === hash(canonical(wire))
      && g.identity.commandId === c.command_id && g.requiredBodyUtf8Bytes === wire.byteLength,
      "native ordered stable grant corrupt", "schema");
    const retainedEvent = event(c.mission, `rms.native.ordered-grant:${c.command_id}`, "rms_native_ordered_grant_retained", c.unit_id);
    invariant(retainedEvent.payload === canonical({ bindingId: retained.binding_id, documentDigest: retained.digest }), "native ordered grant event corrupt", "schema");
    const claimKey = `rms.native.ordered-claim:${c.command_id}`, claimed = events.find(e => e.mission === c.mission && e.key === claimKey);
    invariant(["PENDING", "SENDING", "AMBIGUOUS", "ADMITTED"].includes(c.delivery) && Boolean(claimed) === (c.delivery !== "PENDING"), "native ordered claim state corrupt", "schema");
    if (claimed) {
      const e = event(c.mission, claimKey, "rms_native_ordered_engaged", c.unit_id), p = JSON.parse(e.payload);
      invariant(e.sequence > retainedEvent.sequence && e.payload === canonical({ commandId: c.command_id, imageDigest: c.digest,
        wireSha256: hash(canonical(wire)), bodyUtf8Bytes: wire.byteLength, rootId: retained.root_id,
        rootBefore: fingerprint(p.before), rootAfter: fingerprint(p.after), before: p.before, after: p.after, resume: false }), "native ordered claim event corrupt", "schema");
      transition(e, p.before, p.after, g.identity.slotKey, wire.byteLength, wire.byteLength);
    }
    const admissions = events.filter(e => e.mission === c.mission && e.kind === "rms_native_ordered_admission_data" && JSON.parse(e.payload).commandId === c.command_id);
    invariant((c.delivery === "ADMITTED") === Boolean(c.remote_receipt) && Boolean(admissions.length) === Boolean(c.remote_receipt), "native ordered admission history corrupt", "schema");
    for (const e of admissions) {
      event(c.mission, e.key, e.kind, c.unit_id); const p = JSON.parse(e.payload);
      invariant(p.imageDigest === c.digest && p.wireSha256 === hash(canonical(wire)) && p.applicationProven === false && e.sequence > claimed.sequence,
        "native ordered admission join corrupt", "schema");
    }
    if (c.remote_receipt) invariant(c.remote_receipt === canonical({ commandId: c.command_id, imageDigest: c.digest, state: "admitted",
      native: { sessionId: wire.sessionId, messageId: wire.messageId, wireSha256: hash(canonical(wire)) }, applicationProven: false }), "native ordered receipt corrupt", "schema");
  }
  for (const r of roots) {
    const chain = transitions.filter(t => t.after.rootAccountId === r.root_id).sort((a, b) => a.e.sequence - b.e.sequence);
    invariant(chain.length && chain[0]!.e.kind === "rms_native_operation_prepared", "native root has no private anchored transition", "schema");
    let last = chain[0]!.before;
    for (const t of chain) { invariant(canonical(last) === canonical(t.before), "native root revision/postimage chain broken", "schema"); last = t.after; }
    invariant(r.document === canonical(last) && r.digest === fingerprint(last) && r.revision === last.revision
      && r.mission === last.missionId && r.lineage === last.lineageId, "native current root/head detached from committed chain", "schema");
    const acquisition = bindings.find(b => b.mission === r.mission && b.binding_id === `root-acquisition:${r.root_id}`);
    if (acquisition) {
      const d = JSON.parse(acquisition.document) as NativeLocalDecisionV1;
      invariant(d.subject.version === "rms-native-root-acquisition-v1", "native root acquisition type changed", "schema");
      const issued = events.find(e => e.mission === r.mission && e.key === `rms.native.local:${d.id}:0`);
      const atIssue = d.subject.mode === "first-acquisition" ? chain[0]!.before
        : chain.filter(t => t.e.sequence < issued.sequence).at(-1)?.after;
      invariant(atIssue && canonical(atIssue) === canonical(d.subject.root)
        && (d.subject.mode !== "first-acquisition" || issued.sequence < chain[0]!.e.sequence), "native acquisition/root transition provenance detached", "schema");
    }
  }
  invariant(usedEvents.size === events.length && usedBindings.size === bindings.length
    && transitions.every(t => roots.some(r => r.root_id === t.after.rootAccountId)), "native orphan/lost private history", "schema");
}
const ORDERED_COMMAND_DDL = "CREATE TABLE IF NOT EXISTS ff8_graph_ordered_commands(mission TEXT NOT NULL,command_id TEXT NOT NULL,stream TEXT NOT NULL,sequence INTEGER NOT NULL,unit_id TEXT NOT NULL,action TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,receipt TEXT NOT NULL,delivery TEXT NOT NULL,remote_receipt TEXT,PRIMARY KEY(mission,command_id),UNIQUE(mission,stream,sequence))";
export interface OrderedCommandRequestV1 {
  commandId: string; unitId: string; executionId: string | null; sessionId: string | null;
  action: "obsolete" | "notify"; reason: string; sequence: number;
  expectedMissionRevision: number; expectedUnitRevision: number; expectedEventSequence: number;
  expectedFamilyToken: number | null; notify: boolean;
}
export interface OrderedCommandReceiptV1 { commandId: string; imageDigest: string; stream: string; sequence: number; eventSequence: number; obsolete: boolean }

/** Detect lost private authority, never rebuild it from public history. */
function rmsCommandImages(db: Database, missionId?: string): any[] {
  const rows = db.query(`SELECT * FROM ff8_graph_ordered_commands${missionId === undefined ? "" : " WHERE mission=?"}`).all(...(missionId === undefined ? [] : [missionId])) as Array<{ mission: string; command_id: string; stream: string; sequence: number; unit_id: string; document: string; digest: string; action: string; receipt: string }>;
  const images = rows.map(r => {
    const d = JSON.parse(r.document), receipt = JSON.parse(r.receipt);
    invariant(fingerprint(d) === r.digest && d.request.action === r.action && d.missionId === r.mission && d.request.commandId === r.command_id
      && d.request.unitId === r.unit_id && d.stream === r.stream && d.request.sequence === r.sequence && receipt.imageDigest === r.digest
      && receipt.commandId === r.command_id && receipt.stream === r.stream && receipt.sequence === r.sequence && receipt.obsolete === (r.action === "obsolete"), "corrupt RMS decision", "schema"); return d;
  });
  const hasEvents = db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_events'").get();
  invariant(hasEvents || !rows.length, "missing RMS command history", "schema");
  if (!hasEvents) return images;
  const events = db.query(`SELECT mission,key,kind,time,unit_id,payload,digest,sequence FROM ff8_events WHERE kind='rms_command_committed'${missionId === undefined ? "" : " AND mission=?"}`).all(...(missionId === undefined ? [] : [missionId])) as Array<{ mission: string; key: string; kind: string; time: number; unit_id: string; payload: string; digest: string; sequence: number }>;
  invariant(events.length === rows.length && rows.every(r => events.some(e => e.mission === r.mission && e.key === `rms.command:${r.command_id}` && e.unit_id === r.unit_id
    && e.payload === r.document && e.sequence === JSON.parse(r.receipt).eventSequence
    && e.digest === fingerprint({ kind: e.kind, time: e.time, payload: JSON.parse(e.payload), unitId: e.unit_id }))), "lost/mismatched private RMS command authority", "schema");
  return images;
}

/** Current authorization only. Historical rows, receipts and terminal witnesses
 * are deliberately not rewritten. Safe for the client sharing this OWN file. */
export function assertRmsWorkCurrentV1(db: Database, missionId: string, unitId?: string, executionId?: string, taskId?: string): void {
  // execution_id is globally unique in OWN, not merely unique within a mission.
  // Resolve first, so a caller cannot hide its durable target behind an alias.
  const hasOutbox = db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_graph_outbox'").get();
  const execution = executionId && hasOutbox ? db.query("SELECT mission,execution_id,unit_id,body FROM ff8_graph_outbox WHERE execution_id=?").get(executionId) as { mission: string; execution_id: string; unit_id: string; body: string } | null : null;
  if (execution) {
    const body = JSON.parse(execution.body), command = body.command;
    invariant(execution.mission === missionId && execution.execution_id === executionId && body.executionId === executionId && command.executionId === executionId
      && (unitId === undefined || unitId === execution.unit_id) && (taskId === undefined || taskId === command.taskId), "RMS supplied mission/unit/execution/task contradicts durable target", "auth");
    unitId = execution.unit_id;
  }
  const table = db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_graph_ordered_commands'").get();
  if (!table) {
    const metadata = db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_graph_metadata'").get();
    const hasEvents = db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_events'").get();
    invariant(!hasEvents || !db.query("SELECT 1 FROM ff8_events WHERE kind='rms_command_committed' LIMIT 1").get(), "lost private RMS command authority", "schema");
    invariant(!metadata || (db.query("SELECT version FROM ff8_graph_metadata WHERE id=1").get() as { version: number }).version < 8, "missing RMS command authority", "schema"); return;
  }
  const images = rmsCommandImages(db, missionId).filter(d => d.request.action === "obsolete");
  if (!images.length) return;
  invariant(!images.some(d => d.request.executionId === executionId && executionId !== undefined), "RMS work obsolete; no retry", "auth");
  invariant(!images.some(d => taskId !== undefined && d.taskId === taskId), "RMS task obsolete; no retry", "auth");
  if (!unitId) return;
  const visiting = new Set<string>();
  const check = (id: string) => {
    invariant(!visiting.has(id), "RMS dependency cycle", "auth"); visiting.add(id);
    invariant(!images.some(d => d.request.unitId === id), "RMS work/source obsolete; no retry", "auth");
    const row = db.query("SELECT document FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(missionId, id) as { document: string } | null;
    invariant(row, "RMS dependency missing", "auth"); const unit = JSON.parse(row.document) as WorkUnit;
    for (const p of unit.prerequisites.filter(p => !p.dispensed && p.producerUnitId)) check(p.producerUnitId!);
    const approvals = db.query("SELECT document FROM ff8_graph_next_context_approvals WHERE mission=?").all(missionId) as Array<{ document: string }>;
    for (const a of approvals) { const d = JSON.parse(a.document); if (d.consumerUnitId === id) check(d.producerUnitId); }
    visiting.delete(id);
  };
  check(unitId);
}
const NEXT_CONTEXT_APPROVAL_DDL = "CREATE TABLE IF NOT EXISTS ff8_graph_next_context_approvals(mission TEXT NOT NULL,approval_key TEXT NOT NULL,grant_id TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,event_key TEXT NOT NULL,revocation_event TEXT,PRIMARY KEY(mission,approval_key),UNIQUE(mission,grant_id))";
function contentDigest(value: object): string { const { fingerprint: _ignored, ...content } = value as Record<string, unknown>; return fingerprint(content); }

export type WorkUnitState = "PENDING" | "BLOCKED" | "READY" | "RESERVED" | "RUNNING" | "VALIDATING" | "COMMITTED" | "RETRYABLE" | "FAILED" | "STALE" | "CANCELLED" | "STOP_PENDING" | "QUARANTINED";
export interface WorkUnit {
  schemaVersion: 1; unitId: string; snapshotId: string; partitionId: string; knowledgeRevision: number;
  ownedFunctionIds: string[]; contextFunctionIds: string[]; requiredPublicationLevel: number; state: WorkUnitState;
  investigationKind: "structural" | "decompilation" | "semantification"; pipeline: "2+1";
  estimatedCost: { known: boolean; value: number | null };
  subIntents: Array<{ subIntentId: string; functionId: string; role: "explore" | "evaluate" | "A" | "B" | "R"; waitsForSubIntentIds: string[]; harnessIdentity: { sha256: string; version: string; ea: string }; sharesFamilyLease: true; outputDisjoint: true }>;
  prerequisites: Array<{ id: string; kind: string; producerUnitId: string | null; requiredPublicationLevel: number; artifactKind: string; dispensed: boolean; dispensationReason: string | null }>;
  conflicts: Array<{ id: string; kind: string; resourceKey: string; withUnitId: string | null }>;
}
export interface ArtifactRequirement {
  artifactId: string; artifactSha256: string; functionId: string; moduleSha256: string; artifactKind: string;
  minimumRevision: number; maximumRevision: number; publicationLevel: number; validation: "fixture-only" | "parent-validated";
}
export interface ArtifactReceipt extends Omit<ArtifactRequirement, "minimumRevision" | "maximumRevision"> {
  knowledgeRevision: number; producerUnitId: string | null; commitId: string; readbackStatus: "verified" | "pending" | "mismatch";
  futurePrerequisiteEffect: "satisfies" | "does_not_satisfy" | "invalidates_future";
}
/** OWN v6 host-parent witness. Types are explicit, never inferred from a unit's
 * investigation kind or from membership in its global result/fact lists. */
export interface ArtifactBindingRequest {
  commitId: string; artifactId: string; functionId: string;
  artifactKind: "structural_fact" | "reconciled_c" | "semantic_description" | "validated_knowledge";
  sourceResultIds: string[];
  /** Required only for a derived fact; these are already-known UTF-8 bytes. */
  content?: string;
}
export interface ArtifactBinding extends Omit<ArtifactReceipt, "readbackStatus" | "futurePrerequisiteEffect"> {
  version: 1; missionId: string; producerUnitId: string;
  materialization: "stored-result" | "parent-derived"; content: string;
  sources: Array<{ resultId: string; executionId: string; subIntentId: string; digest: string }>;
  evidenceDigest: string; parentAuthorityDigest: string; parentActorId: string; parentAttestationId: string | null;
}
export interface PublicationEffect { verifiedEffect: KnowledgeCommit["futurePrerequisiteEffect"] }
interface PublicationEffectWitness extends PublicationEffect { version: 1; missionId: string; unitId: string; token: number; requestDigest: string }
export interface PlanBinding { schemaVersion: 1; planFingerprint: string; sidecarFingerprint: string; fingerprint: string }
export interface PersistencePlan {
  schemaVersion: 1; missionId: string; planId: string; snapshotId: string; partitionId: string; knowledgeRevision: number;
  fingerprint: string; policyVersion: string; estimationVersion: string; selectedUnitIds: string[];
  budgets: { contextEnvelopeMaxUtf8Bytes: number };
}
export interface PersistenceSidecar {
  schemaVersion: 1; planId: string; planFingerprint: string; snapshotFingerprint: string; knowledgeRevision: number;
  fingerprint: string; policyVersion: string; estimationVersion: string; policy: { version: string };
  unitFingerprints: Record<string, string>; envelopeBytesByUnit: Record<string, number>;
  requirementById: Record<string, ArtifactRequirement>;
  dispensationById: Record<string, { reason: string; policyVersion: string; source: string; sourceHash: string; validation: string; knowledgeRevision: number }>;
  externalReceiptById: Record<string, ArtifactReceipt>;
  diagnostics: Array<{ unitId: string | null }>;
}
export interface ReservationExpectation {
  bindingFingerprint: string; planFingerprint: string; sidecarFingerprint: string;
  knowledgeRevision: number; activePlanRevision: number; missionRevision: number;
}
/** Privileged HOST capability, never populated from worker/output payloads.
 * Implementations must verify authenticated parent/native identities from the
 * public adapter's cached readbacks. These synchronous hooks perform no RPC in
 * the SQLite transaction and are not scientific truth/signature substitutes.
 */
export interface ParentAuthorityProvider {
  verifyParent(authority: ControllerAuthority): ParentAuthorityIdentity | undefined;
  verifyNativeAuthor(authority: ControllerAuthority, expected: { missionId: string; unitId: string; executionId: string; requestDigest: string }): NativeAuthorIdentity | undefined;
  /** Current authenticated HOST read, never populated from worker DATA or EventLog.
   * The host must verify this actual OWN connection, complete prior accounting,
   * source/binary/schema coupling, physical ownership and the exact bounded permit.
   * Absence is fail-closed and does not change historical provider implementations. */
  verifyNativeRuntime?(authority: ControllerAuthority, db: Database, expected: NativeRuntimeExpectedV1, transport?: NativeRuntimeHttpPortV1): NativeRuntimeHostVerificationV1 | undefined;
  /** Authenticated service facts only; runs outside every SQLite transaction. */
  refreshNativeRuntime?(authority: ControllerAuthority, db: Database, expected: NativeRuntimeExpectedV1, transport: NativeRuntimeHttpPortV1 | undefined,
    signal: AbortSignal, observation?: NativeRuntimeObservationV2): Promise<void>;
}
export interface NativeRuntimeExpectedV1 {
  missionId: string; unitId: string; executionId: string; runRef: ByteRef; imageSha256: string;
  purpose: "prepare" | "effect" | "physical-observation";
  commandId?: string;
}
export interface NativeRuntimeHostVerificationV1 {
  /** Live HOST-owned capability, stripped before DATA capture; not a flag/ref. */
  transport?: NativeRuntimeHttpPortV1;
  authority: NativeRuntimeAuthorityV1;
  independentSources: IndependentlyLoadedSourcesV1;
  rootLedger: NativeRootLedgerV1;
  permit: { version: "rms-native-qualification-permit-v1"; missionId: string; unitId: string; executionId: string;
    runRef: ByteRef; imageSha256: string; originId: string; slotKey: string; maxBodyUtf8Bytes: number;
    proofRefs: ByteRef[]; physicalOwnershipRef: ByteRef; commandId?: string };
}
export interface ParentAuthorityIdentity {
  version: 1; role: "parent"; missionId: string; controllerOwner: string;
  principalId: string; actorId: string; source: string; sourceHash: string;
}
export interface NativeAuthorIdentity {
  version: 1; missionId: string; executionId: string; requestDigest: string;
  authorId: string; sessionId: string; profile: string;
  model: { providerID: string; id: string; variant: string };
  fresh: true; parentSessionId: null; source: string; sourceHash: string;
}
export interface ParentScientificCheck { id: string; kind: string; outcome: "pass"; evidenceDigest: string; detail: string }
export interface ParentAttestationRequest {
  bindingFingerprint: string; planFingerprint: string; snapshotId: string; knowledgeRevision: number;
  resultIds: string[]; resultDigests: Record<string, string>; evidence: unknown[]; validatedFactIds: string[];
  checks: ParentScientificCheck[];
}
export interface ParentAttestation {
  version: 1; attestationId: string; missionId: string; unitId: string; familyToken: number; controllerToken: number;
  parentActorId: string; parentAuthorityDigest: string;
  bindingFingerprint: string; planFingerprint: string; snapshotId: string; snapshotFingerprint: string; partitionId: string; knowledgeRevision: number;
  resultIds: string[]; resultDigests: Record<string, string>; authorDigests: Record<string, string>;
  evidenceDigest: string; validatedFactIds: string[]; checks: ParentScientificCheck[];
}
function assertScientificChecks(checks: ParentScientificCheck[], evidenceDigest: string): void {
  invariant(/^[a-f0-9]{64}$/.test(evidenceDigest) && Array.isArray(checks) && checks.length > 0 && new Set(checks.map(c => c.id)).size === checks.length, "parent attestation needs explicit nonempty unique checks", "scientific_block");
  for (const check of checks) {
    nonempty(check.id); nonempty(check.kind); nonempty(check.detail);
    invariant(check.outcome === "pass" && check.evidenceDigest === evidenceDigest && Object.keys(check).every(k => ["id", "kind", "outcome", "evidenceDigest", "detail"].includes(k)), "parent scientific check/evidence digest mismatch", "scientific_block");
  }
}
function assertScientificEvidence(evidence: unknown[]): void {
  const schema = JSON.parse(readFileSync(join(import.meta.dir, "..", "schemas", "knowledge-commit-v1.schema.json"), "utf8"));
  validateSchema(evidence, schema.properties.evidence, "attestation evidence");
}
export interface NativeInvocationSourceV1 {
  version: "rms-parent-owned-invocation-v1"; invocationId: string; pid: number; startedAt: number;
  expiresAt: number;
  missionId: string; controllerOwner: string; controllerFence: number | null;
  ownPath: string; programSha256: string; scopeSha256: string;
  /** External native tool receipt is supplied/attested by the parent, not SDK magic. */
  externalReceiptRef: null;
}
export interface NativeRootAcquisitionV1 {
  version: "rms-native-root-acquisition-v1"; mode: "first-acquisition" | "continuity";
  priorAuthority: "no-linked-prior-authority-established" | "linked-continuity-proven" | "UNKNOWN";
  allocationRef: ByteRef; planningRef: ByteRef; attributionRef: ByteRef;
  root: NativeRootLedgerV1; inventory: BoundDocument<{
    version: "rms-native-inventory-attribution-v1"; rootAccountId: string; missionId: string; lineageId: string;
    origins: NativeRootLedgerV1["origins"]; resourceRefs: ByteRef[]; evidenceRefs: ByteRef[]; unresolved: string[];
  }>;
  grants: Array<{ slotKey: string; functionIdentity: { sha256: string; version: string; ea: number }; role: "A" | "B" | "R"; pass: 1;
    capUtf8Bytes: number; acquiredUtf8Bytes: number; provenanceRef: ByteRef }>;
}
export interface NativeLocalPermitV1 {
  version: "rms-native-local-permit-v1"; expected: Omit<NativeRuntimeExpectedV1, "purpose">;
  permit: NativeRuntimeHostVerificationV1["permit"]; server: NativeRuntimeAuthorityV1["server"];
  sourceRefs: ByteRef[]; permissionsEvidenceRef: ByteRef; profile: string;
  model: { providerID: string; id: string; variant: string }; permissions: Array<{ action: string; resource: string; effect: "allow" | "deny" | "ask" }>;
  agentMode: "primary" | "subagent" | "all"; agentPermissions: NativeLocalPermitV1["permissions"]; modelCatalogRef: ByteRef;
  sourceRequestRef: ByteRef;
  functionIdentity: NativeRootAcquisitionV1["grants"][number]["functionIdentity"]; role: "A" | "B";
}
export interface NativeLocalDecisionV1 {
  version: "rms-native-local-decision-v1"; id: string; missionId: string; rootAccountId: string; revision: number;
  issuedAt: number; expiresAt: number; parentDigest: string; source: NativeInvocationSourceV1;
  lastInvocationSource: NativeInvocationSourceV1;
  rights: { effect: boolean; physical: boolean }; subject: NativeRootAcquisitionV1 | NativeLocalPermitV1;
}
function validateNativeLocalDecision(d: NativeLocalDecisionV1): void {
  assertExecutionJsonV1(d);
  const closed = (v: object, keys: string[]) => invariant(v && typeof v === "object" && !Array.isArray(v)
    && Object.keys(v).every(k => keys.includes(k)), "native local proposal contains unsupported fields", "schema");
  const sourceKeys = ["version", "invocationId", "pid", "startedAt", "expiresAt", "missionId", "controllerOwner", "controllerFence", "ownPath", "programSha256", "scopeSha256", "externalReceiptRef"];
  closed(d, ["version", "id", "missionId", "rootAccountId", "revision", "issuedAt", "expiresAt", "parentDigest", "source", "lastInvocationSource", "rights", "subject"]);
  closed(d.source, sourceKeys); closed(d.lastInvocationSource, sourceKeys); closed(d.rights, ["effect", "physical"]);
  invariant(d.version === "rms-native-local-decision-v1" && /^(root-acquisition:|host-permit:).+/.test(d.id)
    && Number.isSafeInteger(d.revision) && d.revision >= 0 && Number.isSafeInteger(d.issuedAt) && Number.isSafeInteger(d.expiresAt)
    && d.expiresAt > d.issuedAt && /^[a-f0-9]{64}$/.test(d.parentDigest)
    && d.source.version === "rms-parent-owned-invocation-v1" && d.source.externalReceiptRef === null
    && Number.isSafeInteger(d.source.pid) && d.source.pid > 0 && Number.isSafeInteger(d.source.startedAt)
    && Number.isSafeInteger(d.source.expiresAt) && d.source.expiresAt > d.source.startedAt && d.expiresAt <= d.source.expiresAt
    && d.source.missionId === d.missionId && d.source.controllerOwner.length > 0
    && typeof d.source.controllerFence === "number" && Number.isSafeInteger(d.source.controllerFence) && d.source.controllerFence > 0
    && d.source.invocationId.length > 0 && d.source.ownPath.length > 0 && /^[a-f0-9]{64}$/.test(d.source.programSha256)
    && /^[a-f0-9]{64}$/.test(d.source.scopeSha256) && typeof d.rights.effect === "boolean" && typeof d.rights.physical === "boolean",
    "invalid native local decision/provenance", "schema");
  const last = d.lastInvocationSource;
  invariant(last && last.version === d.source.version && last.externalReceiptRef === null && last.ownPath === d.source.ownPath
    && Number.isSafeInteger(last.pid) && last.pid > 0 && last.invocationId.length > 0 && Number.isSafeInteger(last.startedAt)
    && Number.isSafeInteger(last.expiresAt) && last.expiresAt > last.startedAt
    && last.missionId === d.missionId && last.controllerOwner === d.source.controllerOwner
    && typeof last.controllerFence === "number" && Number.isSafeInteger(last.controllerFence) && last.controllerFence > 0
    && /^[a-f0-9]{64}$/.test(last.programSha256) && /^[a-f0-9]{64}$/.test(last.scopeSha256), "invalid native local decision invocation head", "schema");
  if (d.subject.version === "rms-native-root-acquisition-v1") {
    const a = d.subject, inventory = readRuntimeDocumentV1(a.inventory); assertNativeRootContinuityV1(a.root, a.root);
    closed(a, ["version", "mode", "priorAuthority", "allocationRef", "planningRef", "attributionRef", "root", "inventory", "grants"]);
    closed(inventory, ["version", "rootAccountId", "missionId", "lineageId", "origins", "resourceRefs", "evidenceRefs", "unresolved"]);
    closed(a.root, ["version", "missionId", "lineageId", "rootAccountId", "revision", "generationId", "headRevision", "controllerFence", "historyRef", "origins", "slots"]);
    invariant(d.id === `root-acquisition:${d.rootAccountId}` && a.root.rootAccountId === d.rootAccountId && a.root.missionId === d.missionId
      && (a.mode === "first-acquisition" ? a.priorAuthority === "no-linked-prior-authority-established" : a.mode === "continuity" && a.priorAuthority === "linked-continuity-proven")
      && [a.allocationRef, a.planningRef, a.attributionRef].every(r => r && /^[a-f0-9]{64}$/.test(r.sha256))
      && inventory.version === "rms-native-inventory-attribution-v1" && inventory.rootAccountId === d.rootAccountId
      && inventory.missionId === d.missionId && inventory.lineageId === a.root.lineageId && inventory.unresolved.length === 0
      && inventory.evidenceRefs.length > 0 && canonical(inventory.origins) === canonical(a.root.origins)
      && a.grants.length > 0 && a.grants.length === a.root.slots.length && new Set(a.grants.map(g => g.slotKey)).size === a.grants.length,
      "native bootstrap attribution/acquisition unknown", "auth");
    for (const g of a.grants) {
      const slot = a.root.slots.find(s => s.slotKey === g.slotKey);
      closed(g, ["slotKey", "functionIdentity", "role", "pass", "capUtf8Bytes", "acquiredUtf8Bytes", "provenanceRef"]);
      closed(g.functionIdentity, ["sha256", "version", "ea"]);
      invariant(slot && g.pass === 1 && ["A", "B", "R"].includes(g.role) && /^[a-f0-9]{64}$/.test(g.functionIdentity.sha256)
        && typeof g.functionIdentity.version === "string" && g.functionIdentity.version.length > 0 && Number.isSafeInteger(g.functionIdentity.ea)
        && g.functionIdentity.ea >= 0 && g.functionIdentity.ea <= 0xffffffff
        && Number.isSafeInteger(g.capUtf8Bytes) && g.capUtf8Bytes > 0 && Number.isSafeInteger(g.acquiredUtf8Bytes) && g.acquiredUtf8Bytes > 0
        && g.capUtf8Bytes === slot.capUtf8Bytes && g.acquiredUtf8Bytes === slot.acquiredUtf8Bytes
        && /^[a-f0-9]{64}$/.test(g.provenanceRef.sha256), "native independent slot acquisition invalid", "auth");
      invariant(canonical(slot.grantRef) === canonical(a.mode === "continuity" ? g.provenanceRef : makeBoundDocumentV1("rms-native-slot-acquisition-v1", {
        rootAccountId: a.root.rootAccountId, missionId: a.root.missionId, lineageId: a.root.lineageId, grant: g, source: d.source }).ref),
        "native independent slot acquisition provenance mismatch", "schema");
    }
  } else {
    const p = d.subject;
    closed(p, ["version", "expected", "permit", "server", "sourceRefs", "permissionsEvidenceRef", "profile", "model", "permissions", "agentMode", "agentPermissions", "modelCatalogRef", "sourceRequestRef", "functionIdentity", "role"]);
    closed(p.expected, ["missionId", "unitId", "executionId", "runRef", "imageSha256", "commandId"]);
    closed(p.permit, ["version", "missionId", "unitId", "executionId", "runRef", "imageSha256", "originId", "slotKey", "maxBodyUtf8Bytes", "proofRefs", "physicalOwnershipRef", "commandId"]);
    closed(p.server, ["version", "pid", "binarySha256", "sourceSha256", "openapiSha256"]);
    closed(p.model, ["providerID", "id", "variant"]); closed(p.functionIdentity, ["sha256", "version", "ea"]);
    invariant(p.version === "rms-native-local-permit-v1" && d.id.startsWith("host-permit:") && p.expected.missionId === d.missionId
      && p.permit.missionId === d.missionId && p.permit.executionId === p.expected.executionId && p.permit.unitId === p.expected.unitId
      && p.permit.commandId === p.expected.commandId && p.permit.imageSha256 === p.expected.imageSha256
      && canonical(p.permit.runRef) === canonical(p.expected.runRef) && p.model.providerID === "openai" && p.model.variant.length > 0
      && p.profile.length > 0 && p.sourceRefs.length > 0 && /^[a-f0-9]{64}$/.test(p.permissionsEvidenceRef.sha256)
      && ["primary", "subagent", "all"].includes(p.agentMode) && Array.isArray(p.agentPermissions) && Array.isArray(p.permissions)
      && /^[a-f0-9]{64}$/.test(p.modelCatalogRef.sha256)
      && ["A", "B"].includes(p.role) && /^[a-f0-9]{64}$/.test(p.functionIdentity.sha256) && Number.isSafeInteger(p.functionIdentity.ea)
      && Number.isSafeInteger(p.permit.maxBodyUtf8Bytes) && p.permit.maxBodyUtf8Bytes > 0,
      "native local permit scope/source unavailable", "auth");
    invariant(p.server.version === "2.2.1" && Number.isSafeInteger(p.server.pid) && p.server.pid > 0
      && [p.server.binarySha256, p.server.sourceSha256, p.server.openapiSha256, p.sourceRequestRef.sha256,
        p.permit.physicalOwnershipRef.sha256, p.expected.imageSha256].every(s => /^[a-f0-9]{64}$/.test(s))
      && p.permit.proofRefs.length > 0 && p.model.id.length > 0, "native local server/ownership evidence unavailable", "auth");
    for (const rule of [...p.permissions, ...p.agentPermissions]) {
      closed(rule, ["action", "resource", "effect"]);
      invariant(typeof rule.action === "string" && rule.action.length > 0 && typeof rule.resource === "string" && rule.resource.length > 0
        && ["allow", "deny", "ask"].includes(rule.effect), "native local permission rules malformed", "schema");
    }
  }
}
export interface GraphStoreOptions { parentAuthority?: ParentAuthorityProvider;
  /** Trust is the owning native invocation, not the descriptor or a public DTO. */
  nativeParentInvocation?: { capability: object; source: NativeInvocationSourceV1 } }
export interface UnitValidation {
  evidence: unknown[]; validatedFactIds: string[]; source: "artifact";
  /** Compatibility only. This boolean grants NO level-2 authorization. */
  parentValidated: boolean; parentAttestationId?: string;
}
export interface KnowledgeCommit {
  schemaVersion: 1; commitId: string; inputRevision: number; outputRevision: number; unitId: string;
  resultIds: string[]; validatedFactIds: string[]; evidence: unknown[]; publicationLevel: number;
  publicationTargetId: string; readbackStatus: "verified" | "pending" | "mismatch"; readbackHash: string;
  futurePrerequisiteEffect: "satisfies" | "does_not_satisfy" | "invalidates_future"; isGitCommit: false;
}
export interface Admission {
  executionId: string; subIntentId: string; attemptId: string; role: string; idempotencyKey: string;
  command: Record<string, unknown>;
  [key: string]: unknown;
}
export interface AdmissionObservation {
  executionId: string; requestDigest: string; state: "accepted" | "absent" | "unknown" | "rejected";
  receipt: Record<string, unknown> | null; proof: string;
}
export interface AdmissionInputPin {
  version: 1; missionId: string; unitId: string; familyToken: number; controllerToken: number; missionRevision: number;
  bindingFingerprint: string; planFingerprint: string; snapshotId: string; partitionId: string; knowledgeRevision: number;
  subIntentId: string; functionId: string; role: string; inputFingerprint: string; inputs: InputBundle;
  inputVersions: Array<{ path: string; version: string; sha256: string }>;
}
/** Dossier v3 is transport-only. Decode exactly the existing harness LF-lines
 * contract before comparing it to a pinned domain InputBundle. No future output
 * digest is synthesized here or substituted for a frozen input byte hash.
 */
function admissionProjection(value: unknown, version: unknown): InputBundle {
  invariant(value && typeof value === "object" && !Array.isArray(value), "admission input projection must be an InputBundle", "schema");
  const inputs = JSON.parse(canonical(value)) as InputBundle;
  if (version === 3 && inputs.proposals !== undefined) {
    invariant(Array.isArray(inputs.proposals), "invalid proposal projection", "schema");
    inputs.proposals = inputs.proposals.map(raw => {
      const proposal = raw as unknown as Record<string, unknown>;
      invariant(proposal.content === undefined && proposal.contentEncoding === "utf8-lines-lf" && Array.isArray(proposal.contentLines) && proposal.contentLines.every(line => typeof line === "string"), "invalid v3 frozen proposal encoding", "schema");
      const { contentLines, contentEncoding: _encoding, ...metadata } = proposal;
      return { ...metadata, content: (contentLines as string[]).join("\n") } as unknown as NonNullable<InputBundle["proposals"]>[number];
    });
  }
  return inputs;
}
function validateAdmissionInputs(inputs: InputBundle, sub: WorkUnit["subIntents"][number]): void {
  invariant(inputs.schemaVersion === 1 && inputs.role === sub.role, "pinned input schema/role mismatch", "schema"); integer(inputs.cycle, 1);
  invariant(inputs.identity && canonical(validateIdentity(inputs.identity)) === canonical(sub.harnessIdentity) && canonical(inputs.identity) === canonical(sub.harnessIdentity), "pinned input function identity mismatch");
  invariant(Array.isArray(inputs.files) && Array.isArray(inputs.accessibleRules) && Array.isArray(inputs.requiredTools), "pinned input manifest/rules/tools required", "schema");
  inputs.accessibleRules.forEach(nonempty); inputs.requiredTools.forEach(nonempty);
  inputs.files.forEach(validateFile); validateKnowledge(inputs.knowledge);
  invariant(new Set(inputs.files.map(file => file.path)).size === inputs.files.length, "duplicate exact pinned input manifest path");
  if (inputs.proposals !== undefined) {
    invariant(sub.role === "R" && Array.isArray(inputs.proposals), "blind authors cannot receive frozen proposals");
    invariant(new Set(inputs.proposals.map(p => p.resultId)).size === inputs.proposals.length, "duplicate pinned proposal");
    for (const proposal of inputs.proposals) {
      const manifest = inputs.files.find(file => file.path === proposal.path);
      invariant(manifest && manifest.kind === "proposal" && manifest.sha256 === proposal.sha256 && typeof proposal.content === "string" && hash(Buffer.from(proposal.content, "utf8")) === proposal.sha256, "frozen proposal content/manifest hash binding mismatch");
      let parsed: unknown; try { parsed = JSON.parse(proposal.content); } catch { invariant(false, "frozen proposal invalid JSON", "schema"); }
      invariant(canonical(parsed) === canonical(proposal.document), "frozen proposal document mismatch");
      for (const key of ["resultId", "authorId", "executionId", "sessionId"] as const) nonempty(proposal[key]);
    }
  }
}
interface UnitRow { document: string; digest: string; state: WorkUnitState; revision: number }
interface OutboxRow { mission: string; unit_id: string; execution_id: string; sub_intent: string; token: number; body: string; digest: string; state: string; attempts: number; max_attempts: number; retry_delay: number; next_time: number; receipt: string | null; terminal_proof: string | null }
interface DispatchGeneration { attempt: number; token: number; digest: string }
const transitions: Record<WorkUnitState, WorkUnitState[]> = {
  PENDING: ["BLOCKED", "READY", "CANCELLED", "STALE"], BLOCKED: ["READY", "CANCELLED", "STALE", "FAILED"],
  READY: ["RESERVED", "BLOCKED", "STALE", "CANCELLED"], RESERVED: ["RUNNING", "READY", "STOP_PENDING", "QUARANTINED", "CANCELLED"],
  RUNNING: ["VALIDATING", "RETRYABLE", "FAILED", "STOP_PENDING", "QUARANTINED"], VALIDATING: ["COMMITTED", "RETRYABLE", "FAILED", "BLOCKED"],
  RETRYABLE: ["READY", "FAILED"], STOP_PENDING: ["CANCELLED", "QUARANTINED", "FAILED"], QUARANTINED: [], COMMITTED: [], FAILED: [], STALE: [], CANCELLED: [],
};

export function graphErrorClass(error: unknown): Exclude<ErrorClass, "none"> {
  const category = bridgeFailureCategory(error)?.category;
  if (error instanceof GraphPersistenceError) return error.category;
  if (["auth", "refusal", "unauthorized", "forbidden"].includes(category ?? "")) return "auth";
  if (["input", "invalid_input"].includes(category ?? "")) return "input";
  if (["schema", "unsupported_schema"].includes(category ?? "")) return "schema";
  if (category === "quota") return "quota";
  if (category === "scientific_block") return "scientific_block";
  return "outage";
}
function openGraphDatabase(path: string): Database {
  // The legacy OWN opener writes metadata before installing busy_timeout. Only
  // typed SQLite contention is retried, never auth/schema/foreign-file failures.
  for (let attempt = 0; ; attempt++) {
    try { return openOwnDatabase(path, "engine"); }
    catch (error) {
      if ((error as { code?: string } | null)?.code !== "SQLITE_BUSY" || attempt >= 5) throw error;
      Bun.sleepSync(20 * (attempt + 1));
    }
  }
}

/** Additive extension on the existing OWN engine database, never Ensemble's DB.
 * Migrations add the known v1/v3/v4/v5/v6 tables; they are NOT a general column-diff or
 * repair engine for malformed/foreign historical layouts. Legacy scientific
 * records without receipt-bound provenance stay evidence, not prerequisites.
 */
import { atRestCheck, captureAtRestRequestV1, makeAtRestImageV1, runAtRestV1, type AtRestImageV1, type AtRestRequestV1, type AtRestResultV1, type AtRestTransportV1 } from "./graph-native-at-rest";

export class GraphStore {
  private nativePreparing?: { expected: NativeRuntimeExpectedV1; bound: ReadonlyData<BoundExecutionV1> };
  readonly db: Database;
  readonly events: EventLog;
  readonly leases: UnitLeaseStore;
  private readonly parentAuthority?: Readonly<ParentAuthorityProvider>;
  private readonly nativeParentInvocation?: GraphStoreOptions["nativeParentInvocation"];
  /** One derived, immutable parse entry only. Never a cache of current rights,
   * private approvals, publications, config, leases, epochs, access or FS state. */
  private nextContextOriginCache?: Readonly<{ missionId: string; identity: string; payloadBytes: string; run: GraphRun; policy?: NextContextPolicyV1 }>;
  constructor(readonly path = ":memory:", options: GraphStoreOptions = {}) {
    if (options.nativeParentInvocation) this.nativeParentInvocation = Object.freeze({ capability: options.nativeParentInvocation.capability,
      source: immutableCopy(options.nativeParentInvocation.source) });
    if (options.parentAuthority) {
      const provider = options.parentAuthority;
      this.parentAuthority = Object.freeze({ verifyParent: provider.verifyParent.bind(provider), verifyNativeAuthor: provider.verifyNativeAuthor.bind(provider),
        ...(provider.verifyNativeRuntime ? { verifyNativeRuntime: provider.verifyNativeRuntime.bind(provider) } : {}),
        ...(provider.refreshNativeRuntime ? { refreshNativeRuntime: provider.refreshNativeRuntime.bind(provider) } : {}) });
    }
    this.db = openGraphDatabase(path);
    try {
      const names = this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;
      const ownTables = new Set(["ff8_harness_metadata", "ff8_missions", "ff8_intents", "ff8_history", "ff8_fixture_targets", "ff8_fixture_publications",
        "ff8_bridge_missions", "ff8_bridge_requests", "ff8_bridge_command_attempts", "ff8_bridge_events", "ff8_bridge_communication_audits",
        "ff8_graph_metadata", "ff8_graph_snapshots", "ff8_graph_partitions", "ff8_graph_units", "ff8_graph_results", "ff8_graph_commits", "ff8_graph_outbox", "ff8_graph_publications", "ff8_graph_streams", "ff8_graph_fence", "ff8_graph_plans", "ff8_graph_active_plan", "ff8_graph_receipts", "ff8_graph_parent_authorities", "ff8_graph_native_authors", "ff8_graph_parent_attestations", "ff8_graph_input_pins", "ff8_graph_artifact_bindings", "ff8_graph_publication_effects", "ff8_graph_next_context_approvals", "ff8_graph_ordered_commands", "ff8_events", "ff8_unit_leases", "ff8_unit_claims"]);
      for (const name of ["ff8_graph_native_roots", "ff8_graph_native_bindings", "ff8_graph_native_operations"]) ownTables.add(name);
      // ExecutionClient already creates this historical DATA-only join table in
      // the same OWN file. Recognize its name without deriving authority from it.
      ownTables.add("ff8_bridge_dispatch_joins");
      invariant(names.every(r => ownTables.has(r.name)), "foreign tables in OWN database", "schema");
      this.db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
      this.db.transaction(() => {
        this.db.exec("CREATE TABLE IF NOT EXISTS ff8_graph_metadata(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL); INSERT OR IGNORE INTO ff8_graph_metadata VALUES(1,0);");
        const version = (this.db.query("SELECT version FROM ff8_graph_metadata WHERE id=1").get() as { version: number }).version;
        invariant(version >= 0 && version <= GRAPH_SCHEMA_VERSION, "unsupported graph schema version", "schema");
        invariant(version < 8 || names.some(n => n.name === "ff8_graph_ordered_commands"), "missing private RMS command table", "schema");
        const nativeNames = ["ff8_graph_native_roots", "ff8_graph_native_bindings", "ff8_graph_native_operations"];
        invariant(version < 9 || nativeNames.every(name => names.some(n => n.name === name)), "missing private native runtime table", "schema");
        const hasNativeHistory = names.some(n => n.name === "ff8_events")
          && this.db.query("SELECT 1 FROM ff8_events WHERE kind IN ('rms_native_operation_prepared','rms_native_effect_engaged') LIMIT 1").get();
        invariant(!hasNativeHistory || nativeNames.every(name => names.some(n => n.name === name)), "lost private native runtime authority", "schema");
        for (const ddl of NATIVE_RUNTIME_DDL) {
          const name = ddl.split(" ")[5]!;
          const existing = this.db.query("SELECT type,sql FROM sqlite_master WHERE name=?").get(name.split("(")[0]!) as { type: string; sql: string } | null;
          const normalize = (sql: string) => sql.replace(/IF\s+NOT\s+EXISTS\s+/gi, "").replace(/\s+/g, "").replace(/;+$/, "").toLowerCase();
          invariant(!existing || existing.type === "table" && normalize(existing.sql) === normalize(ddl), "incompatible native runtime declaration", "schema");
          invariant(!this.db.query("SELECT 1 FROM sqlite_master WHERE type='trigger' AND tbl_name=?").get(name.split("(")[0]!), "native runtime trigger refused", "schema");
          this.db.exec(ddl);
          const table = name.split("(")[0]!, indexes = this.db.query(`PRAGMA index_list(${table})`).all() as Array<{ unique: number; origin: string; partial: number }>;
          invariant(indexes.length === (table === "ff8_graph_native_operations" ? 3 : 1)
            && indexes.every(i => i.unique === 1 && ["pk", "u"].includes(i.origin) && i.partial === 0), "incompatible private native runtime indexes", "schema");
        }
        this.db.exec(`CREATE TABLE IF NOT EXISTS ff8_graph_snapshots(id TEXT PRIMARY KEY,digest TEXT NOT NULL,document TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS ff8_graph_partitions(id TEXT PRIMARY KEY,snapshot_id TEXT NOT NULL REFERENCES ff8_graph_snapshots(id),digest TEXT NOT NULL,document TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS ff8_graph_units(mission TEXT NOT NULL,unit_id TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(mission,unit_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_results(mission TEXT NOT NULL,unit_id TEXT NOT NULL,result_id TEXT NOT NULL,execution_id TEXT NOT NULL,token INTEGER NOT NULL,digest TEXT NOT NULL,document TEXT NOT NULL,eligible INTEGER NOT NULL,PRIMARY KEY(mission,result_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_commits(mission TEXT NOT NULL,unit_id TEXT NOT NULL,commit_id TEXT NOT NULL UNIQUE,document TEXT NOT NULL,PRIMARY KEY(mission,unit_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_outbox(mission TEXT NOT NULL,unit_id TEXT NOT NULL,execution_id TEXT PRIMARY KEY,sub_intent TEXT NOT NULL,token INTEGER NOT NULL,body TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,max_attempts INTEGER NOT NULL,retry_delay INTEGER NOT NULL,next_time INTEGER NOT NULL DEFAULT 0,receipt TEXT,terminal_proof TEXT);
          CREATE TABLE IF NOT EXISTS ff8_graph_publications(mission TEXT NOT NULL,unit_id TEXT NOT NULL,token INTEGER NOT NULL,request TEXT NOT NULL,digest TEXT NOT NULL,readback TEXT,PRIMARY KEY(mission,unit_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_plans(mission TEXT NOT NULL,plan_id TEXT NOT NULL,binding_hash TEXT NOT NULL,plan TEXT NOT NULL,sidecar TEXT NOT NULL,binding TEXT NOT NULL,PRIMARY KEY(mission,plan_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_active_plan(mission TEXT PRIMARY KEY,plan_id TEXT NOT NULL,revision INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS ff8_graph_receipts(mission TEXT NOT NULL,commit_id TEXT NOT NULL,artifact_id TEXT NOT NULL,document TEXT NOT NULL,PRIMARY KEY(mission,commit_id,artifact_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_parent_authorities(mission TEXT PRIMARY KEY,document TEXT NOT NULL,digest TEXT NOT NULL,event_key TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS ff8_graph_native_authors(mission TEXT NOT NULL,execution_id TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,PRIMARY KEY(mission,execution_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_parent_attestations(mission TEXT NOT NULL,attestation_id TEXT NOT NULL,unit_id TEXT NOT NULL,token INTEGER NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,event_key TEXT NOT NULL,revocation_event TEXT,PRIMARY KEY(mission,attestation_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_input_pins(mission TEXT NOT NULL,unit_id TEXT NOT NULL,token INTEGER NOT NULL,sub_intent TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,event_key TEXT NOT NULL,PRIMARY KEY(mission,unit_id,token,sub_intent));
          CREATE TABLE IF NOT EXISTS ff8_graph_artifact_bindings(mission TEXT NOT NULL,commit_id TEXT NOT NULL,artifact_id TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,event_key TEXT NOT NULL,PRIMARY KEY(mission,commit_id,artifact_id));
          CREATE TABLE IF NOT EXISTS ff8_graph_publication_effects(mission TEXT NOT NULL,unit_id TEXT NOT NULL,document TEXT NOT NULL,digest TEXT NOT NULL,event_key TEXT NOT NULL,PRIMARY KEY(mission,unit_id));
          ${NEXT_CONTEXT_APPROVAL_DDL};${ORDERED_COMMAND_DDL};`);
        // IF NOT EXISTS is not a schema check: a homonymous view/table must not
        // become an authorization store merely because its name is allowlisted.
        const approvalTable = "ff8_graph_next_context_approvals", definition = this.db.query("SELECT type,sql FROM sqlite_master WHERE name=?").get(approvalTable) as { type: string; sql: string } | null;
        invariant(definition?.type === "table" && !/^CREATE\s+VIRTUAL\s+TABLE/i.test(definition.sql), "incompatible private next context approval table", "schema");
        const normalizedDdl = (sql: string) => sql.replace(/\bIF\s+NOT\s+EXISTS\b/gi, "").replace(/\s+/g, "").replace(/;+$/, "").toLowerCase();
        invariant(normalizedDdl(definition.sql) === normalizedDdl(NEXT_CONTEXT_APPROVAL_DDL), "incompatible private next context approval declaration", "schema");
        const columns = this.db.query("PRAGMA table_xinfo(ff8_graph_next_context_approvals)").all() as Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: unknown; pk: number; hidden: number }>;
        const expectedColumns = ["mission", "approval_key", "grant_id", "document", "digest", "event_key", "revocation_event"];
        invariant(columns.length === expectedColumns.length && columns.every((c, i) => c.cid === i && c.name === expectedColumns[i] && c.type === "TEXT"
          && c.notnull === (i === 6 ? 0 : 1) && c.dflt_value === null && c.pk === (i === 0 ? 1 : i === 1 ? 2 : 0) && c.hidden === 0), "incompatible private approval columns/primary key", "schema");
        const indexes = this.db.query("PRAGMA index_list(ff8_graph_next_context_approvals)").all() as Array<{ name: string; unique: number; origin: string; partial: number }>;
        invariant(indexes.length === 2 && indexes.every(i => i.unique === 1 && ["pk", "u"].includes(i.origin) && i.partial === 0 && /^sqlite_autoindex_ff8_graph_next_context_approvals_[12]$/.test(i.name)), "incompatible private approval indexes", "schema");
        const indexColumns = indexes.map(i => (this.db.query(`PRAGMA index_info("${i.name}")`).all() as Array<{ name: string }>).map(c => c.name));
        invariant(canonical(indexColumns.map(canonical).sort()) === canonical([["mission", "approval_key"], ["mission", "grant_id"]].map(canonical).sort())
          && this.db.query("PRAGMA foreign_key_list(ff8_graph_next_context_approvals)").all().length === 0
          && !this.db.query("SELECT 1 FROM sqlite_master WHERE type='trigger' AND tbl_name=?").get(approvalTable), "incompatible private approval constraints/triggers", "schema");
        const commands = this.db.query("SELECT type,sql FROM sqlite_master WHERE name='ff8_graph_ordered_commands'").get() as { type: string; sql: string };
        invariant(commands?.type === "table" && normalizedDdl(commands.sql) === normalizedDdl(ORDERED_COMMAND_DDL)
          && !this.db.query("SELECT 1 FROM sqlite_master WHERE type='trigger' AND tbl_name='ff8_graph_ordered_commands'").get(), "incompatible private RMS command table", "schema");
        const commandIndexes = this.db.query("PRAGMA index_list(ff8_graph_ordered_commands)").all() as Array<{ name: string; unique: number; origin: string; partial: number }>;
        invariant(commandIndexes.length === 2 && commandIndexes.every(i => i.unique === 1 && ["pk", "u"].includes(i.origin) && i.partial === 0
          && /^sqlite_autoindex_ff8_graph_ordered_commands_[12]$/.test(i.name)), "incompatible RMS command indexes", "schema");
        rmsCommandImages(this.db);
        assertNativeRuntimeIntegrityV1(this.db);
        this.db.query("UPDATE ff8_graph_metadata SET version=? WHERE id=1").run(GRAPH_SCHEMA_VERSION);
      }).immediate();
      this.events = new EventLog(this.db); this.leases = new UnitLeaseStore(this.db, this.events);
    } catch (error) { this.db.close(); throw error; }
  }
  close(): void { this.db.close(); }
  /** Auth records live solely in the existing event journal, not root/slot tables.
   * Reading DATA never authenticates the caller or creates a host capability. */
  ownedAuthIntentStateV1(missionId: string, id: string): OwnedAuthStateV1 | undefined {
    invariant(/^[A-Za-z0-9_-]{1,80}$/.test(id), "auth intent id refused", "auth");
    const events = this.events.read(missionId), first = events.find(e => e.key === `rms.auth.intent:${id}`);
    if (!first) return undefined;
    invariant(first.kind === "rms_owned_auth_intent_v1" && first.unitId === null
      && first.digest === fingerprint({ kind: first.kind, time: first.time, payload: first.payload, unitId: first.unitId }), "auth intent event refused", "auth");
    const intent = first.payload as OwnedAuthIntentV1; assertOwnedAuthIntentV1(intent);
    invariant(intent.id === id && intent.missionId === missionId && first.time === intent.issuedAt, "auth intent scope refused", "auth");
    const transitions = events.filter(e => e.key.startsWith(`rms.auth.transition:${id}:`)).map(e => {
      const t = e.payload as OwnedAuthTransitionV1;
      invariant(e.kind === "rms_owned_auth_transition_v1" && e.unitId === null && e.key === `rms.auth.transition:${id}:${t.revision}`
        && e.time === t.at && e.digest === fingerprint({ kind: e.kind, time: e.time, payload: e.payload, unitId: e.unitId }), "auth transition event refused", "auth"); return t;
    });
    return immutableCopy(ownedAuthStateV1(intent, transitions));
  }
  private assertOwnedAuthParentV1(authority: ControllerAuthority, capability: object): ParentAuthorityIdentity {
    const i = this.nativeParentInvocation;
    invariant(i && capability === i.capability && i.source.ownPath === this.path && i.source.pid > 0
      && i.source.missionId === authority.lease.missionId && i.source.controllerOwner === authority.lease.owner
      && i.source.controllerFence === authority.lease.token && authority.now < i.source.expiresAt,
      "auth private current parent invocation required", "auth");
    assertController(this.db, authority, authority.lease.missionId);
    invariant(this.db.query("SELECT 1 FROM ff8_graph_parent_authorities WHERE mission=?").get(authority.lease.missionId), "auth requires retained parent identity", "auth");
    return this.bootstrapParentAuthority(authority).identity;
  }
  retainOwnedAuthIntentV1(authority: ControllerAuthority, capability: object, value: OwnedAuthIntentV1): OwnedAuthStateV1 {
    assertOwnedAuthIntentV1(value);
    return this.db.transaction(() => {
      const parent = this.assertOwnedAuthParentV1(authority, capability), i = this.nativeParentInvocation!.source;
      invariant(value.missionId === authority.lease.missionId && value.controllerOwner === authority.lease.owner && value.controllerFence === authority.lease.token
        && value.principalId === parent.principalId && value.actorId === parent.actorId && value.invocationId === i.invocationId && value.pid === i.pid
        && value.ownPath === i.ownPath && value.programSha256 === i.programSha256 && value.scopeSha256 === i.scopeSha256
        && value.issuedAt === authority.now && value.expiresAt <= Math.min(i.expiresAt, authority.lease.expiresAt)
        && !this.ownedAuthIntentStateV1(value.missionId, value.id), "auth intent source/expiry/duplicate refused", "auth");
      const cursor = this.events.cursor(value.missionId);
      this.events.append(value.missionId, `rms.auth.intent:${value.id}`, "rms_owned_auth_intent_v1", authority.now, value, null, cursor.sequence);
      this.assertOwnedAuthParentV1(authority, capability);
      return this.ownedAuthIntentStateV1(value.missionId, value.id)!;
    }).immediate();
  }
  assertOwnedAuthIntentCurrentV1(authority: ControllerAuthority, capability: object, id: string, pinsSha256: string): OwnedAuthStateV1 {
    const parent = this.assertOwnedAuthParentV1(authority, capability), s = this.ownedAuthIntentStateV1(authority.lease.missionId, id), i = this.nativeParentInvocation!.source;
    invariant(s && s.intent.invocationId === i.invocationId && s.intent.pid === i.pid && s.intent.ownPath === i.ownPath && s.intent.programSha256 === i.programSha256
      && s.intent.scopeSha256 === i.scopeSha256 && s.intent.pinsSha256 === pinsSha256 && s.intent.controllerFence === authority.lease.token
      && s.intent.principalId === parent.principalId && s.intent.actorId === parent.actorId && authority.now >= s.intent.issuedAt
      && authority.now < s.intent.expiresAt && !["HOLD", "REVOKED", "FAILED", "EXPIRED"].includes(s.status), "auth intent expired/revoked/divergent", "auth");
    return s;
  }
  transitionOwnedAuthIntentV1(authority: ControllerAuthority, capability: object, id: string, pinsSha256: string,
    revision: number, digest: string, status: OwnedAuthTransitionV1["status"], attemptId: string | null): OwnedAuthStateV1 {
    return this.db.transaction(() => {
      const s = status === "REVOKED" || status === "HOLD"
        ? (this.assertOwnedAuthParentV1(authority, capability), this.ownedAuthIntentStateV1(authority.lease.missionId, id))
        : this.assertOwnedAuthIntentCurrentV1(authority, capability, id, pinsSha256);
      invariant(s && s.revision === revision && s.digest === digest, "auth transition CAS refused", "auth");
      const t: OwnedAuthTransitionV1 = { version: "rms-owned-auth-transition-v1", id, revision: revision + 1, previousDigest: digest, status, attemptId, at: authority.now };
      // Validate the full next state BEFORE appending. Claim is never reset.
      const history = this.events.read(authority.lease.missionId).filter(e => e.key.startsWith(`rms.auth.transition:${id}:`)).map(e => e.payload as OwnedAuthTransitionV1);
      ownedAuthStateV1(s.intent, [...history, t]); const cursor = this.events.cursor(authority.lease.missionId);
      this.events.append(authority.lease.missionId, `rms.auth.transition:${id}:${t.revision}`, "rms_owned_auth_transition_v1", authority.now, t, null, cursor.sequence);
      this.assertOwnedAuthParentV1(authority, capability);
      return this.ownedAuthIntentStateV1(authority.lease.missionId, id)!;
    }).immediate();
  }
  nativeLocalDecisionV1(id: string, missionId?: string): NativeLocalDecisionV1 | undefined {
    return this.db.transaction(() => {
      assertNativeRuntimeIntegrityV1(this.db);
      const rows = this.db.query(`SELECT document FROM ff8_graph_native_bindings WHERE binding_id=?${missionId === undefined ? "" : " AND mission=?"}`)
        .all(...(missionId === undefined ? [id] : [id, missionId])) as Array<{ document: string }>;
      invariant(rows.length <= 1, "native local decision mission ambiguous", "auth");
      return rows[0] ? immutableCopy(JSON.parse(rows[0].document)) : undefined;
    })();
  }
  private retainNativeLocalDecision(authority: ControllerAuthority, capability: object, id: string, rootAccountId: string,
    subject: NativeLocalDecisionV1["subject"], expiresAt: number): NativeLocalDecisionV1 {
    invariant(this.nativeParentInvocation && capability === this.nativeParentInvocation.capability
      && this.nativeParentInvocation.source.ownPath === this.path && authority.now < this.nativeParentInvocation.source.expiresAt,
      "native parent owning invocation required; actor/JSON is not a capability", "auth");
    return this.db.transaction(() => {
      const parent = this.bootstrapParentAuthority(authority);
      invariant(this.nativeParentInvocation!.source.missionId === authority.lease.missionId
        && this.nativeParentInvocation!.source.controllerOwner === authority.lease.owner
        && this.nativeParentInvocation!.source.controllerFence === authority.lease.token, "native invocation mission/controller epoch changed", "auth");
      invariant(authority.now < expiresAt && expiresAt <= authority.lease.expiresAt && expiresAt <= this.nativeParentInvocation!.source.expiresAt,
        "native parent decision outside current lease", "auth");
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_native_bindings WHERE mission=? AND binding_id=?").get(authority.lease.missionId, id),
        "native local acquisition/permit already retained; no replacement", "auth");
      const d: NativeLocalDecisionV1 = { version: "rms-native-local-decision-v1", id, missionId: authority.lease.missionId, rootAccountId,
        revision: 0, issuedAt: authority.now, expiresAt, parentDigest: parent.digest, source: this.nativeParentInvocation!.source,
        lastInvocationSource: this.nativeParentInvocation!.source,
        rights: { effect: true, physical: true }, subject: immutableCopy(subject) };
      validateNativeLocalDecision(d);
      if (subject.version === "rms-native-root-acquisition-v1") {
        const rows = this.db.query("SELECT document FROM ff8_graph_native_roots WHERE mission=? OR root_id=?").all(d.missionId, rootAccountId) as Array<{ document: string }>;
        invariant(subject.mode === "first-acquisition" ? rows.length === 0 : rows.length === 1 && rows[0]!.document === canonical(subject.root),
          "native acquisition operative preimage changed", "auth");
        invariant(!this.db.query("SELECT 1 FROM ff8_graph_native_bindings WHERE mission=? AND binding_id LIKE 'root-acquisition:%'").get(d.missionId),
          "native root acquisition cannot replace/reassign an existing decision", "auth");
      } else {
        const acquired = this.nativeLocalDecisionV1(`root-acquisition:${rootAccountId}`, d.missionId);
        invariant(acquired?.rights.effect && acquired.subject.version === "rms-native-root-acquisition-v1"
          && acquired.issuedAt <= authority.now && authority.now < acquired.expiresAt && expiresAt <= acquired.expiresAt
          && acquired.subject.grants.some(g => g.slotKey === subject.permit.slotKey && g.role === subject.role
            && canonical(g.functionIdentity) === canonical(subject.functionIdentity) && subject.permit.maxBodyUtf8Bytes <= g.capUtf8Bytes),
          "native acquired grant expired/revoked/changed before permit commit", "auth");
        // The preflight lookup is not an exclusion lock. Recheck under this
        // IMMEDIATE transaction, including revoked scopes: no implicit renewal.
        const peers = this.db.query("SELECT document FROM ff8_graph_native_bindings WHERE mission=? AND binding_id LIKE 'host-permit:%'").all(d.missionId) as Array<{ document: string }>;
        invariant(!peers.some(p => { const peer = JSON.parse(p.document) as NativeLocalDecisionV1;
          return peer.subject.version === "rms-native-local-permit-v1" && canonical(peer.subject.expected) === canonical(subject.expected); }),
          "native permit scope already retained; no replacement", "auth");
      }
      this.db.query("INSERT INTO ff8_graph_native_bindings VALUES(?,?,?,?,?)").run(d.missionId, id, rootAccountId, canonical(d), fingerprint(d));
      this.events.append(d.missionId, `rms.native.local:${id}:0`, "rms_native_local_decision", authority.now, d);
      invariant(this.bootstrapParentAuthority(authority).digest === parent.digest, "native parent changed during local decision", "auth");
      assertController(this.db, authority, d.missionId); assertNativeRuntimeIntegrityV1(this.db); return immutableCopy(d);
    }).immediate();
  }
  authorizeNativeRootV1(authority: ControllerAuthority, capability: object, raw: NativeRootAcquisitionV1, expiresAt: number): NativeLocalDecisionV1 {
    const a = JSON.parse(canonical(raw)) as NativeRootAcquisitionV1;
    const operative = this.db.query("SELECT document FROM ff8_graph_native_roots WHERE mission=? OR root_id=?").all(a.root.missionId, a.root.rootAccountId) as Array<{ document: string }>;
    invariant(a.root.missionId === authority.lease.missionId && a.root.controllerFence === authority.lease.token
      && (a.mode === "first-acquisition" ? operative.length === 0 : a.mode === "continuity" && operative.length === 1 && operative[0]!.document === canonical(a.root))
      && !this.db.query("SELECT 1 FROM ff8_graph_native_bindings WHERE mission=? AND binding_id LIKE 'root-acquisition:%'").get(a.root.missionId),
      "native first acquisition cannot replace an operative root", "auth");
    invariant(new Set(a.grants.map(g => canonical({ root: a.root.rootAccountId, identity: g.functionIdentity, role: g.role, pass: g.pass }))).size === a.grants.length,
      "duplicate native acquisition identity/role/pass", "auth");
    for (const g of a.grants) {
      const slot = a.root.slots.find(s => s.slotKey === g.slotKey); invariant(slot, "native acquisition slot missing", "auth");
      if (a.mode === "first-acquisition") slot.grantRef = makeBoundDocumentV1("rms-native-slot-acquisition-v1", { rootAccountId: a.root.rootAccountId, missionId: a.root.missionId,
        lineageId: a.root.lineageId, grant: g, source: this.nativeParentInvocation?.source }).ref;
    }
    return this.retainNativeLocalDecision(authority, capability, `root-acquisition:${a.root.rootAccountId}`, a.root.rootAccountId, a, expiresAt);
  }
  grantNativeRuntimePermitV1(authority: ControllerAuthority, capability: object, id: string, rootAccountId: string,
    permit: NativeLocalPermitV1, expiresAt: number): NativeLocalDecisionV1 {
    const root = this.nativeLocalDecisionV1(`root-acquisition:${rootAccountId}`, authority.lease.missionId);
    invariant(root?.subject.version === "rms-native-root-acquisition-v1" && root.rights.effect
      && root.issuedAt <= authority.now && authority.now < root.expiresAt && expiresAt <= root.expiresAt
      && root.subject.root.missionId === authority.lease.missionId && root.subject.root.slots.some(s => s.slotKey === permit.permit.slotKey
        && permit.permit.maxBodyUtf8Bytes <= s.capUtf8Bytes), "native permit has no unexpired authentic acquired root/slot", "auth");
    invariant(root.subject.grants.some(g => g.slotKey === permit.permit.slotKey && g.role === permit.role
      && canonical(g.functionIdentity) === canonical(permit.functionIdentity)), "native permit function/role differs from acquisition", "auth");
    const peers = this.db.query("SELECT document FROM ff8_graph_native_bindings WHERE mission=? AND binding_id LIKE 'host-permit:%'").all(authority.lease.missionId) as Array<{ document: string }>;
    invariant(!peers.some(p => { const d = JSON.parse(p.document) as NativeLocalDecisionV1;
      return d.subject.version === "rms-native-local-permit-v1" && canonical(d.subject.expected) === canonical(permit.expected); }),
      "native permit scope already retained; no replacement", "auth");
    nonempty(id); return this.retainNativeLocalDecision(authority, capability, `host-permit:${id}`, rootAccountId, permit, expiresAt);
  }
  revokeNativeRuntimePermitV1(authority: ControllerAuthority, capability: object, id: string, expectedRevision: number,
    rights: { effect?: false; physical?: false }): NativeLocalDecisionV1 {
    invariant(this.nativeParentInvocation?.capability === capability && this.nativeParentInvocation.source.ownPath === this.path
      && authority.now < this.nativeParentInvocation.source.expiresAt, "native parent owning invocation required", "auth");
    return this.db.transaction(() => {
      const parent = this.bootstrapParentAuthority(authority), previous = this.nativeLocalDecisionV1(id);
      invariant(this.nativeParentInvocation!.source.missionId === authority.lease.missionId
        && this.nativeParentInvocation!.source.controllerOwner === authority.lease.owner
        && this.nativeParentInvocation!.source.controllerFence === authority.lease.token, "native invocation revoke epoch changed", "auth");
      invariant(previous && previous.missionId === authority.lease.missionId && previous.revision === expectedRevision
        && previous.parentDigest === parent.digest && Object.keys(rights).length > 0 && Object.keys(rights).every(k => k === "effect" || k === "physical")
        && Object.values(rights).every(v => v === false), "native decision revoke CAS/scope mismatch", "auth");
      const next = { ...previous, revision: previous.revision + 1, rights: { ...previous.rights, ...rights }, lastInvocationSource: this.nativeParentInvocation!.source };
      invariant(this.db.query("UPDATE ff8_graph_native_bindings SET document=?,digest=? WHERE mission=? AND binding_id=? AND digest=?")
        .run(canonical(next), fingerprint(next), previous.missionId, id, fingerprint(previous)).changes === 1, "native local revoke CAS failed", "auth");
      this.events.append(previous.missionId, `rms.native.local:${id}:${next.revision}`, "rms_native_local_decision", authority.now, next);
      assertController(this.db, authority, previous.missionId); assertNativeRuntimeIntegrityV1(this.db); return immutableCopy(next);
    }).immediate();
  }
  /** Remote facts are refreshed only outside SQL; local rights/fences are reread
   * after await. This is not an atomic transaction with the remote service. */
  async refreshNativeRuntimeV1(currentAuthority: () => ControllerAuthority, expected: NativeRuntimeExpectedV1,
    transport?: NativeRuntimeHttpPortV1, signal: AbortSignal = AbortSignal.timeout(10000), observation?: NativeRuntimeObservationV2): Promise<void> {
    if (!this.parentAuthority?.refreshNativeRuntime) return;
    const before = immutableCopy(currentAuthority());
    const local = () => this.db.transaction(() => {
      const a = immutableCopy(currentAuthority()); assertController(this.db, a, expected.missionId); assertNativeRuntimeIntegrityV1(this.db);
      this.assertNativeLocalRuntimeRightsV1(a, expected);
      if (expected.purpose !== "physical-observation") this.assertWorkCurrent(expected.missionId, expected.unitId, expected.executionId);
      const physical = expected.purpose === "physical-observation", { purpose: _purpose, ...scope } = expected;
      const decisions = (this.db.query("SELECT binding_id,document,digest FROM ff8_graph_native_bindings WHERE mission=? AND (binding_id LIKE 'host-permit:%' OR binding_id LIKE 'root-acquisition:%') ORDER BY binding_id").all(expected.missionId) as Array<{ binding_id: string; document: string; digest: string }>)
        .map(r => ({ row: r, d: JSON.parse(r.document) as NativeLocalDecisionV1 }))
        .filter(({ d }) => d.subject.version === "rms-native-root-acquisition-v1" || canonical(d.subject.expected) === canonical(scope))
        .map(({ row, d }) => physical ? { id: row.binding_id, subject: d.subject, physical: d.rights.physical, expiresAt: d.expiresAt } : { id: row.binding_id, digest: row.digest });
      const operation = this.db.query("SELECT digest,revision,create_claim,prompt_claim FROM ff8_graph_native_operations WHERE execution_id=?").get(expected.executionId) as { digest: string } | null;
      const roots = (this.db.query("SELECT root_id,document,digest,revision FROM ff8_graph_native_roots WHERE mission=? ORDER BY root_id").all(expected.missionId) as Array<{ root_id: string; document: string; digest: string; revision: number }>).map(r => {
        if (!physical) return { id: r.root_id, digest: r.digest, revision: r.revision };
        const d = JSON.parse(r.document) as NativeRootLedgerV1;
        return { id: r.root_id, missionId: d.missionId, lineageId: d.lineageId, generationId: d.generationId, headRevision: d.headRevision,
          controllerFence: d.controllerFence, grants: d.slots.map(s => ({ slotKey: s.slotKey, grantRef: s.grantRef, cap: s.capUtf8Bytes })) };
      });
      return fingerprint({ fence: { missionId: a.lease.missionId, owner: a.lease.owner, token: a.lease.token }, decisions,
        operation: physical ? operation?.digest ?? null : operation, roots });
    })();
    const snapshot = local(); signal.throwIfAborted();
    await this.parentAuthority.refreshNativeRuntime(before, this.db, immutableCopy(expected), transport, signal, observation);
    signal.throwIfAborted(); invariant(local() === snapshot, "native local rights/fence/CAS changed during authenticated refresh", "auth");
    this.nativeRuntimeHost(immutableCopy(currentAuthority()), expected, transport);
  }
  nativeOperationBindingV2(executionId: string): BoundDocument<NativeRuntimeBindingV2> {
    this.db.transaction(() => assertNativeRuntimeIntegrityV1(this.db))();
    const row = this.db.query("SELECT document,digest FROM ff8_graph_native_operations WHERE execution_id=?").get(executionId) as { document: string; digest: string } | null;
    invariant(row && fingerprint(JSON.parse(row.document)) === row.digest, "native operation image lost/corrupt", "schema");
    const document = JSON.parse(row.document), binding = document.binding as BoundDocument<NativeRuntimeBindingV2>;
    readRuntimeDocumentV1(binding);
    const retained = this.db.query("SELECT document,digest FROM ff8_graph_native_bindings WHERE mission=? AND binding_id=?").get(document.expected.missionId, binding.ref.sha256) as { document: string; digest: string } | null;
    invariant(retained?.document === canonical(binding) && retained.digest === fingerprint(binding), "native binding private image lost/corrupt", "schema");
    return immutableCopy(binding);
  }
  /** Native composition reuses the operative plan/reservation/pins/outbox. All
   * mutations roll back if the exact host permit or the final native image fails. */
  prepareNativeGraphExecutionV1(authority: ControllerAuthority, request: {
    run: BoundDocument<unknown>; unitId: string; admission: Admission; wire: NativeRestWireImageV1;
  }): BoundDocument<NativeRuntimeBindingV2> {
    authority = immutableCopy(authority); request = immutableCopy(request);
    const expected: NativeRuntimeExpectedV1 = { missionId: authority.lease.missionId, unitId: request.unitId,
      executionId: request.admission.executionId, runRef: request.run.ref, imageSha256: hash(canonical(request.wire)), purpose: "prepare" };
    return this.db.transaction(() => {
      invariant(!this.nativePreparing, "nested native preparation forbidden", "auth");
      this.assertWorkCurrent(expected.missionId, expected.unitId, expected.executionId);
      const host = this.nativeRuntimeHost(authority, expected), parsed = parseGraphRunV3(Buffer.from(request.run.utf8, "utf8"));
      invariant(parsed.ok && canonical(parsed.value.document) === canonical(request.run), "native source bytes changed", "schema");
      const origin = parseExecutionEnvelopeV1(Buffer.from(parsed.value.run.envelope.utf8, "utf8")); invariant(origin.ok, "invalid native source envelope", "schema");
      const bound = bindExecutionSourcesV1(origin.value, host.independentSources); invariant(bound.ok, "native sources not independently bound", "auth");
      const source = bound.value, plan = source.planning;
      invariant(plan.plan.selectedUnitIds.includes(request.unitId), "native unit not selected by retained planner", "auth");
      const prior = this.db.query("SELECT document,digest FROM ff8_graph_native_operations WHERE execution_id=?").get(expected.executionId) as { document: string; digest: string } | null;
      if (prior) {
        invariant(fingerprint(JSON.parse(prior.document)) === prior.digest, "native recovery operation corrupt", "schema");
        const op = JSON.parse(prior.document);
        invariant(canonical(op.run) === canonical(request.run) && canonical(op.wire) === canonical(request.wire)
          && this.outbox(expected.executionId)?.digest === fingerprint(request.admission), "native recovery cannot substitute an admission/source/image", "auth");
        return op.binding;
      }
      this.nativePreparing = { expected, bound: source };
      try {
        this.putSnapshot(authority, JSON.parse(canonical(source.snapshot))); this.putPartition(authority, JSON.parse(canonical(source.transport.partition)));
        for (const unit of plan.units) this.addUnit(authority, JSON.parse(canonical(unit)));
        const active = this.db.query("SELECT plan_id,revision FROM ff8_graph_active_plan WHERE mission=?").get(expected.missionId) as { plan_id: string; revision: number } | null;
        if (active) invariant(active.plan_id === plan.plan.planId, "native recovery cannot replace/replan active origin", "auth");
        this.freezePlan(authority, JSON.parse(canonical(plan.plan)), JSON.parse(canonical(plan.sidecar)), JSON.parse(canonical(plan.binding)), active?.revision ?? 0);
        const unit = this.unit(expected.missionId, request.unitId), sub = unit.subIntents.find(s => s.subIntentId === request.admission.subIntentId);
        invariant(sub && sub.role === request.admission.role, "native admission sub-intent differs from selected planner", "auth");
        const template = source.template, sourceModel = source.sourceSpec.models[sub.role];
        invariant(canonical(request.admission.command.model) === canonical(sourceModel)
          && request.admission.command.profile === template.settings.profiles[sub.role as "A" | "B" | "R"], "native profile/model differs from source", "auth");
        let lease = this.leases.get(expected.missionId, request.unitId);
        if (!lease) {
          if (unit.state === "PENDING" || unit.state === "BLOCKED") this.transition(authority, unit.unitId, "READY", "native retained planner prerequisites satisfied");
          lease = this.reserve(authority, unit.unitId, 1000, this.reservationExpectation(expected.missionId));
        }
        this.leases.assert(lease, authority);
        const metadata = request.admission.command.metadata as Record<string, any>;
        invariant(metadata && canonical(metadata.rmsBinding) === canonical({ version: "rms-native-admission-binding-v1", missionId: expected.missionId,
          unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: sub.role, runRef: request.run.ref,
          familyFence: lease.token, controllerFence: authority.lease.token }), "native command must bind exact source scope and actual acquired fences", "auth");
        const inputs = nativeFrozenGraphInputsV1(source, sub);
        this.freezeAdmissionInputs(authority, lease, sub.subIntentId, inputs);
        this.prepareAdmission(authority, lease, request.admission, 1, 0);
        const binding = this.prepareNativeRuntimeV1(authority, lease, expected.executionId, request.run, request.wire);
        this.nativeRuntimeHost(authority, expected); this.leases.assert(lease, authority); return binding;
      } finally { this.nativePreparing = undefined; }
    }).immediate();
  }
  async submitNativeRuntimeV1(currentAuthority: () => ControllerAuthority, executionId: string,
    port: NativeRuntimeHttpPortV1): Promise<NativeRuntimeAdmissionDataV1> {
    const retained = this.db.query("SELECT document,digest FROM ff8_graph_native_operations WHERE execution_id=?").get(executionId) as { document: string; digest: string } | null;
    invariant(retained && fingerprint(JSON.parse(retained.document)) === retained.digest, "native retained operation unavailable", "auth");
    const op = JSON.parse(retained.document) as { wire: NativeRestWireImageV1; lease: UnitLease; expected: NativeRuntimeExpectedV1;
      binding: BoundDocument<NativeRuntimeBindingV2>; admissionDigest: string };
    const expected = { ...op.expected, purpose: "effect" as const };
    const ioSignal = AbortSignal.timeout(10000);
    await this.refreshNativeRuntimeV1(currentAuthority, expected, port, ioSignal);
    const check = () => {
      invariant(nativeRuntimeGuards.has(check), "native operation binding ended", "auth");
      const a = immutableCopy(currentAuthority()), host = this.nativeRuntimeHost(a, expected, port); this.leases.assert(op.lease, a);
      const binding = readRuntimeDocumentV1(op.binding), root = this.db.query("SELECT document,digest FROM ff8_graph_native_roots WHERE root_id=?").get(binding.rootAccountId) as { document: string; digest: string } | null;
      invariant(root && fingerprint(JSON.parse(root.document)) === root.digest && canonical(host.rootLedger) === root.document,
        "native root/head current authority mismatch", "auth");
      invariant(host.rootLedger.generationId === binding.generationId && host.rootLedger.headRevision === binding.headRevision,
        "native operation generation/head obsolete; no retry", "auth");
      const mission = this.db.query("SELECT snapshot FROM ff8_missions WHERE id=?").get(expected.missionId) as { snapshot: string } | null;
      const snapshot = mission ? JSON.parse(mission.snapshot) as Snapshot : undefined;
      const cycle = snapshot?.cycles.find(c => c.number === snapshot.cycle), anchor = cycle?.graph;
      invariant(cycle?.frozen === true && anchor?.version === "rms-native-frozen-cycle-v1" && anchor.cycle === snapshot?.cycle
        && canonical(anchor.bindingRef) === canonical(op.binding.ref) && canonical(anchor.runRef) === canonical(binding.runRef)
        && anchor.rootAccountId === binding.rootAccountId && anchor.generationId === binding.generationId && anchor.headRevision === binding.headRevision,
        "native effect requires exact prospective native cycle anchor; no fixture/legacy fallback", "auth");
      this.assertWorkCurrent(expected.missionId, expected.unitId, executionId);
      const current = this.db.query("SELECT document,digest FROM ff8_graph_native_operations WHERE execution_id=?").get(executionId) as { document: string; digest: string } | null;
      invariant(current?.document === retained.document && current.digest === retained.digest, "native operation changed/lost", "auth");
      const outbox = this.outbox(executionId); invariant(outbox && outbox.digest === op.admissionDigest && outbox.token === op.lease.token
        && ["PREPARED", "SENDING", "AMBIGUOUS"].includes(outbox.state), "native outbox/fence changed", "auth");
      this.assertDurableAdmission(outbox); this.assertAdmissionInputs(a, op.lease, JSON.parse(outbox.body));
    };
    nativeRuntimeGuards.add(check);
    try {
      check(); const authority = this.nativeRuntimeHost(immutableCopy(currentAuthority()), expected, port).authority;
      return await submitNativeRestWireImageV1(op.wire, authority, port, {
        check, signal: ioSignal,
        refresh: (purpose, signal) => this.refreshNativeRuntimeV1(currentAuthority, { ...expected, purpose }, port, signal),
        claimed: phase => {
          check(); const column = phase === "create" ? "create_claim" : "prompt_claim";
          return (this.db.query(`SELECT ${column} AS claimed FROM ff8_graph_native_operations WHERE execution_id=?`).get(executionId) as { claimed: number }).claimed === 1;
        },
        claim: phase => this.db.transaction(() => {
          check(); const column = phase === "create" ? "create_claim" : "prompt_claim";
          const row = this.db.query(`SELECT revision,${column} AS claimed FROM ff8_graph_native_operations WHERE execution_id=?`).get(executionId) as { revision: number; claimed: number };
          if (row.claimed) return false;
          const a = immutableCopy(currentAuthority());
          const host = this.nativeRuntimeHost(a, expected, port), root = nativeLedgerDraft(host.rootLedger), slot = root.slots.find(s => s.slotKey === host.permit.slotKey);
          invariant(this.db.query(`UPDATE ff8_graph_native_operations SET ${column}=1,revision=revision+1 WHERE execution_id=? AND revision=? AND ${column}=0`).run(executionId, row.revision).changes === 1,
            "native effect claim CAS failed", "auth");
          invariant(slot, "native acquired slot lost", "auth");
          const beforeDigest = fingerprint(root), previousRevision = root.revision, debit = phase === "create" ? op.wire.create.byteLength : op.wire.prompt.byteLength;
          invariant(Number.isSafeInteger(slot.spentUtf8Bytes + debit) && slot.spentUtf8Bytes + debit <= slot.encumberedUtf8Bytes, "native REST effect lacks retained debit", "auth");
          slot.spentUtf8Bytes += debit; root.revision++;
          invariant(this.db.query("UPDATE ff8_graph_native_roots SET document=?,digest=?,revision=? WHERE root_id=? AND revision=? AND digest=?")
            .run(canonical(root), fingerprint(root), root.revision, root.rootAccountId, previousRevision, beforeDigest).changes === 1, "native debit CAS failed", "auth");
          this.db.query("UPDATE ff8_graph_outbox SET state='SENDING',attempts=CASE WHEN attempts=0 THEN 1 ELSE attempts END WHERE execution_id=?").run(executionId);
          this.events.append(expected.missionId, `rms.native.claim:${executionId}:${phase}`, "rms_native_effect_engaged", a.now,
            { executionId, phase, imageSha256: expected.imageSha256, rootId: root.rootAccountId,
              rootBefore: beforeDigest, rootAfter: fingerprint(root), before: host.rootLedger, after: root }, expected.unitId);
          check(); return true;
        }).immediate(),
        observed: (phase, responseSha256) => {
          // Facts remain attributable after logical revocation. Physical ownership
          // must still be verified; no current-use or resource-release authority.
          const a = immutableCopy(currentAuthority());
          this.nativeRuntimeHost(a, { ...expected, purpose: "physical-observation" }, port);
          const cursor = this.events.cursor(expected.missionId);
          this.events.append(expected.missionId, `rms.native.io:${executionId}:${cursor.sequence + 1}`, "rms_native_io_data", Math.max(a.now, cursor.time),
            { executionId, imageSha256: expected.imageSha256, phase, responseSha256, terminalProof: null }, expected.unitId, cursor.sequence);
        },
      });
    } finally { nativeRuntimeGuards.delete(check); }
  }
  async observeNativeRuntimeV2(currentAuthority: () => ControllerAuthority, executionId: string,
    port: NativeRuntimeHttpPortV1): Promise<NativeRuntimeObservationV2> {
    const row = this.db.query("SELECT document,digest FROM ff8_graph_native_operations WHERE execution_id=?").get(executionId) as { document: string; digest: string } | null;
    invariant(row && fingerprint(JSON.parse(row.document)) === row.digest, "native observation operation unavailable", "auth");
    const op = JSON.parse(row.document) as { expected: NativeRuntimeExpectedV1; wire: NativeRestWireImageV1 };
    const expected = { ...op.expected, purpose: "physical-observation" as const };
    const ioSignal = AbortSignal.timeout(10000);
    await this.refreshNativeRuntimeV1(currentAuthority, expected, port, ioSignal);
    const previous = this.events.read(expected.missionId).filter(e => e.kind === "rms_native_runtime_observation" && e.unitId === expected.unitId
      && (e.payload as NativeRuntimeObservationV2).imageSha256 === expected.imageSha256).at(-1);
    const before = previous ? (previous.payload as NativeRuntimeObservationV2).after : null;
    const after = previous && (previous.payload as NativeRuntimeObservationV2).complete ? (previous.payload as NativeRuntimeObservationV2).watermark : before;
    const check = () => {
      invariant(nativeRuntimeGuards.has(check), "native physical observation binding ended", "auth");
      const owner = this.nativeRuntimeHost(immutableCopy(currentAuthority()), expected, port);
      invariant(owner.permit.physicalOwnershipRef, "native physical ownership unavailable", "auth");
      const current = this.db.query("SELECT document,digest FROM ff8_graph_native_operations WHERE execution_id=?").get(executionId) as { document: string; digest: string } | null;
      invariant(current?.document === row.document && current.digest === row.digest, "native physical operation changed", "auth");
      // No logical current-work test: obsolete work can still consume resources
      // and produce attributable observations under independently verified rights.
    };
    nativeRuntimeGuards.add(check);
    try {
      check(); const authority = this.nativeRuntimeHost(immutableCopy(currentAuthority()), expected, port).authority;
      const known = this.events.read(expected.missionId).filter(e => e.kind === "rms_native_runtime_observation" && e.unitId === expected.unitId
        && (e.payload as NativeRuntimeObservationV2).imageSha256 === expected.imageSha256).flatMap(e => (e.payload as NativeRuntimeObservationV2).facts);
      invariant(known.length <= 4096, "native finite observation history bound exhausted", "auth");
      const data = await runNativeRuntimeObservationV2(op.wire, authority, after, port, check, known, undefined, ioSignal);
      // Commit the received DATA/cursor under still-current local physical
      // rights and the bounded pre-read host snapshot. An author refresh or
      // witness failure below must never roll back this attributable receipt.
      const retained = this.db.transaction(() => {
        check(); const nowPrevious = this.events.read(expected.missionId).filter(e => e.kind === "rms_native_runtime_observation" && e.unitId === expected.unitId
          && (e.payload as NativeRuntimeObservationV2).imageSha256 === expected.imageSha256).at(-1);
        invariant((nowPrevious?.sequence ?? null) === (previous?.sequence ?? null), "native observation cursor CAS changed", "auth");
        const cursor = this.events.cursor(expected.missionId), a = immutableCopy(currentAuthority());
        const receipt = this.events.append(expected.missionId, `rms.native.runtime-observation:${executionId}:${cursor.sequence + 1}`, "rms_native_runtime_observation",
           Math.max(a.now, cursor.time), data, expected.unitId, cursor.sequence); check();
        return receipt;
      }).immediate();
      const assistant = data.assistant;
      if (!ioSignal.aborted && assistant) {
        // Propagate a failed refresh as a failed observation call, not successful
        // qualification. The prior DATA transaction remains committed, and no
        // stale author from an earlier refresh is consulted on this path.
        await this.refreshNativeRuntimeV1(currentAuthority, expected, port, ioSignal, data);
        this.db.transaction(() => {
          check(); const latest = this.events.read(expected.missionId).filter(e => e.kind === "rms_native_runtime_observation" && e.unitId === expected.unitId
            && (e.payload as NativeRuntimeObservationV2).imageSha256 === expected.imageSha256).at(-1);
          invariant(latest?.sequence === retained.sequence && canonical(latest.payload) === canonical(data), "native observation witness cursor CAS changed", "auth");
          const interval = nativeCompletionIntervalV1(data, known), a = immutableCopy(currentAuthority());
          if (interval) {
            const outbox = this.outbox(executionId); invariant(outbox, "native witness lost its admission", "auth");
            const author = this.parentAuthority?.verifyNativeAuthor(a, { missionId: expected.missionId, unitId: expected.unitId, executionId, requestDigest: outbox.digest });
            if (author && author.version === 1 && author.missionId === expected.missionId && author.executionId === executionId && author.requestDigest === outbox.digest
              && author.sessionId === data.sessionId && author.profile === assistant.profile && canonical(author.model) === canonical(assistant.model)
              && author.fresh === true && author.parentSessionId === null) {
              const witnessCursor = this.events.cursor(expected.missionId);
              this.events.append(expected.missionId, `rms.native.interval:${executionId}:${witnessCursor.sequence + 1}`, "rms_native_interval_data", Math.max(a.now, witnessCursor.time),
                { executionId, imageSha256: expected.imageSha256, interval, authorDigest: fingerprint(author), assistant,
                  scope: "one-native-busy-interval-only", scientificAuthority: false, terminalProof: null, releasesResources: false }, expected.unitId, witnessCursor.sequence);
              check();
            }
          }
        }).immediate();
      }
      return data;
    } finally { nativeRuntimeGuards.delete(check); }
  }
  /** Persisted local rights remain authoritative even for an external provider. */
  private assertNativeLocalRuntimeRightsV1(authority: ControllerAuthority, expected: NativeRuntimeExpectedV1): void {
    const rows = this.db.query("SELECT document FROM ff8_graph_native_bindings WHERE mission=? AND (binding_id LIKE 'root-acquisition:%' OR binding_id LIKE 'host-permit:%')").all(expected.missionId) as Array<{ document: string }>;
    // Retain the historical external-provider contract when no local decisions
    // exist. Once acquired locally, no provider may bypass that root's lifetime.
    if (rows.length === 0) return;
    const { purpose: _purpose, ...scope } = expected, decisions = rows.map(r => JSON.parse(r.document) as NativeLocalDecisionV1);
    const permits = decisions.filter(d => d.subject.version === "rms-native-local-permit-v1" && canonical(d.subject.expected) === canonical(scope));
    invariant(permits.length === 1, "native local permit scope unavailable/ambiguous", "auth");
    const permit = permits[0]!, acquired = decisions.find(d => d.id === `root-acquisition:${permit.rootAccountId}`);
    invariant(acquired?.subject.version === "rms-native-root-acquisition-v1" && permit.expiresAt <= acquired.expiresAt,
      "native local permit exceeds acquired root lifetime", "auth");
    for (const d of [acquired, permit]) invariant(d.issuedAt <= authority.now && authority.now < d.expiresAt
      && authority.now < d.source.expiresAt && d.rights.physical
      && (expected.purpose === "physical-observation" || d.rights.effect), "native local acquisition/permit expired or revoked", "auth");
    if (this.nativeParentInvocation) invariant(authority.now < this.nativeParentInvocation.source.expiresAt,
      "native parent invocation expired at runtime boundary", "auth");
  }
  /** Current host verification is deliberately never cached across a boundary. */
  private nativeRuntimeHost(authority: ControllerAuthority, expected: NativeRuntimeExpectedV1, transport?: NativeRuntimeHttpPortV1): NativeRuntimeHostVerificationV1 {
    this.db.transaction(() => assertNativeRuntimeIntegrityV1(this.db))();
    assertController(this.db, authority, expected.missionId);
    this.assertNativeLocalRuntimeRightsV1(authority, expected);
    invariant(this.db === this.events.db && this.db === this.leases.db && this.events === this.leases.events, "native OWN connection mismatch", "auth");
    const verified = this.parentAuthority?.verifyNativeRuntime?.(immutableCopy(authority), this.db, immutableCopy(expected), transport);
    invariant(verified, "native runtime host authority/provenance/permissions unavailable", "auth");
    if (transport) invariant(verified.transport === transport, "native transport is not the independently verified HOST capability", "auth");
    const { transport: _hostCapability, ...facts } = verified;
    const v = immutableCopy(facts), a = v.authority, p = v.permit, root = v.rootLedger;
    invariant(a.version === "rms-native-runtime-authority-v1" && a.missionId === expected.missionId
      && a.controllerOwner === authority.lease.owner && a.controllerFence === authority.lease.token
      && a.sourceRefs.length > 0 && a.proofRefs.length > 0, "native host scope/fence/provenance refused", "auth");
    invariant(a.server.version === "2.2.1" && Number.isSafeInteger(a.server.pid) && a.server.pid > 0
      && [a.server.binarySha256, a.server.sourceSha256, a.server.openapiSha256].every(s => /^[a-f0-9]{64}$/.test(s)), "native server qualification incomplete", "auth");
    invariant(p.version === "rms-native-qualification-permit-v1" && p.missionId === expected.missionId && p.unitId === expected.unitId
      && p.executionId === expected.executionId && p.imageSha256 === expected.imageSha256 && canonical(p.runRef) === canonical(expected.runRef)
      && p.proofRefs.length > 0 && p.physicalOwnershipRef && Number.isSafeInteger(p.maxBodyUtf8Bytes) && p.maxBodyUtf8Bytes >= 0
      && (expected.purpose === "physical-observation" || p.maxBodyUtf8Bytes > 0),
      "native exact qualification permit unavailable", "auth");
    invariant(expected.commandId === undefined ? p.commandId === undefined : p.commandId === expected.commandId,
      "native permit command scope mismatch", "auth");
    invariant(root.missionId === a.missionId && root.lineageId === a.lineageId && root.rootAccountId === a.rootAccountId
      && root.generationId === a.generationId && root.headRevision === a.headRevision && root.controllerFence === a.controllerFence
      && canonical(root.historyRef) === canonical(a.historyRef), "native root/head/history authority mismatch", "auth");
    assertNativeRootContinuityV1(root, root);
    const retainedGrant = expected.commandId
      ? this.db.query("SELECT document FROM ff8_graph_native_bindings WHERE mission=? AND binding_id=?").get(expected.missionId, `ordered-grant:${expected.commandId}`) as { document: string } | null
      : this.db.query("SELECT document FROM ff8_graph_native_operations WHERE execution_id=?").get(expected.executionId) as { document: string } | null;
    if (retainedGrant) {
      const retained = JSON.parse(retainedGrant.document);
      const bytes = expected.commandId ? retained.wire.byteLength : retained.wire.totalBodyUtf8Bytes;
      if (expected.purpose === "physical-observation") assertRetainedNativeGrant(v, expected, retained.grant, bytes);
      else assertCurrentNativeGrant(v, expected, retained.grant, bytes);
    } else invariant(expected.purpose !== "physical-observation", "native physical observation requires retained private grant", "auth");
    this.db.transaction(() => assertNativeRuntimeIntegrityV1(this.db))();
    this.assertNativeLocalRuntimeRightsV1(authority, expected);
    assertController(this.db, authority, expected.missionId); return v;
  }
  /** Exposes no native send. Requires an independently pinned, unsent outbox and
   * genuine family/controller lease; all private images and debits commit together. */
  prepareNativeRuntimeV1(authority: ControllerAuthority, lease: UnitLease, executionId: string, runDocument: BoundDocument<unknown>,
    wire: NativeRestWireImageV1): BoundDocument<NativeRuntimeBindingV2> {
    authority = immutableCopy(authority); lease = immutableCopy(lease); runDocument = immutableCopy(runDocument); wire = immutableCopy(wire);
    const parsed = parseGraphRunV3(Buffer.from(runDocument.utf8, "utf8"));
    invariant(parsed.ok && canonical(parsed.value.document) === canonical(runDocument), "native requires exact original v3 DATA bytes", "schema");
    const run = parsed.value.run, execution = this.outbox(executionId);
    invariant(execution && execution.mission === lease.missionId && execution.unit_id === lease.unitId && execution.token === lease.token
      && execution.state === "PREPARED" && execution.attempts === 0, "native preparation requires exact independently pinned unsent admission", "auth");
    const imageSha256 = hash(canonical(wire));
    const expected: NativeRuntimeExpectedV1 = { missionId: lease.missionId, unitId: lease.unitId, executionId,
      runRef: runDocument.ref, imageSha256, purpose: "prepare" };
    return this.db.transaction(() => {
      this.assertWorkCurrent(lease.missionId, lease.unitId, executionId); this.leases.assert(lease, authority);
      const host = this.nativeRuntimeHost(authority, expected), root = host.rootLedger, permit = host.permit;
      invariant(!this.events.read(lease.missionId).some(e => e.kind === "l8.graph.preparing" || e.kind === "l8.graph2.preparing"),
        "native authority cannot promote a historical fixture preparation", "auth");
      invariant(run.missionId === lease.missionId, "native run mission mismatch", "auth");
      const origin = parseExecutionEnvelopeV1(Buffer.from(run.envelope.utf8, "utf8")); invariant(origin.ok, "native envelope DATA invalid", "schema");
      const bound = bindExecutionSourcesV1(origin.value, host.independentSources); invariant(bound.ok, "native independently loaded sources differ", "auth");
      const planning = bound.value.planning, snapshot = bound.value.snapshot;
      invariant(root.rootAccountId === bound.value.body.admissionSource.budgetLineage.rootAccountId
        && root.lineageId === bound.value.body.generation.lineageId, "native binding cannot reset/alias source root lineage", "auth");
      const outbox = this.outbox(executionId)!; this.assertDurableAdmission(outbox);
      const admission = JSON.parse(outbox.body) as Admission, unit = this.unit(lease.missionId, lease.unitId), sub = unit.subIntents.find(s => s.subIntentId === admission.subIntentId);
      invariant(sub && (admission.command.dossier as any)?.fixture !== true, "fixture command cannot become a native operation", "auth");
      invariant(canonical((admission.command.metadata as any)?.rmsBinding) === canonical({ version: "rms-native-admission-binding-v1", missionId: lease.missionId,
        unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: sub.role, runRef: runDocument.ref,
        familyFence: lease.token, controllerFence: authority.lease.token })
        && canonical(admission.command.model) === canonical(bound.value.sourceSpec.models[sub.role])
        && admission.command.profile === bound.value.template.settings.profiles[sub.role as "A" | "B" | "R"],
        "native admission source scope/profile/model/fences differ", "auth");
      const inputs = nativeFrozenGraphInputsV1(bound.value, sub);
      invariant(canonical(admissionProjection((admission.command.dossier as any)?.inputs, (admission.command.dossier as any)?.version)) === canonical(inputs), "native command does not emit exact independently derived inputs", "auth");
      const createBody = JSON.parse(wire.create.utf8);
      invariant(canonical(encodeNativeAdmissionWireV1(admission, { sessionId: wire.sessionId, messageId: wire.messageId,
        directory: createBody.location.directory, permissions: createBody.permissions })) === canonical(wire), "native emitted REST bodies differ from durable admission", "auth");
      const oldRoot = this.db.query("SELECT document,digest,revision FROM ff8_graph_native_roots WHERE root_id=?").get(root.rootAccountId) as { document: string; digest: string; revision: number } | null;
      if (oldRoot) {
        invariant(fingerprint(JSON.parse(oldRoot.document)) === oldRoot.digest && JSON.parse(oldRoot.document).revision === oldRoot.revision, "native root corrupt", "schema");
        assertNativeRootContinuityV1(JSON.parse(oldRoot.document), root);
        invariant(canonical(root) === oldRoot.document, "native root checkpoint differs from current durable head", "auth");
      }
      const prior = this.db.query("SELECT document,digest FROM ff8_graph_native_operations WHERE execution_id=?").get(executionId) as { document: string; digest: string } | null;
      if (prior) {
        invariant(fingerprint(JSON.parse(prior.document)) === prior.digest, "native operation corrupt", "schema");
        const original = JSON.parse(prior.document);
        invariant(canonical(original.wire) === canonical(wire) && canonical(original.run) === canonical(runDocument)
          && original.lease.token === lease.token, "native retained image/identity changed", "auth");
        this.nativeRuntimeHost(authority, expected); return original.binding;
      }
      const next = nativeLedgerDraft(root), slot = next.slots.find(s => s.slotKey === permit.slotKey);
      const unitCap = planning.sidecar.admissionBudget?.byUnit[lease.unitId]?.admissionCapUtf8Bytes;
      invariant(unitCap?.known && typeof unitCap.value === "number" && Number.isSafeInteger(unitCap.value) && unitCap.value >= 1, "native current unit body cap unknown", "auth");
      invariant(slot && wire.totalBodyUtf8Bytes <= permit.maxBodyUtf8Bytes && permit.maxBodyUtf8Bytes <= unitCap.value && unitCap.value <= slot.capUtf8Bytes,
        "native total REST body exceeds fixed permit/slot cap", "auth");
      if (!next.origins.some(o => o.originId === permit.originId)) {
        invariant(next.origins.length < 3, "native origin ceiling includes bootstrap/qualification", "auth");
        next.origins.push({ originId: permit.originId, sourceRef: permit.proofRefs[0]! });
      }
      invariant(Number.isSafeInteger(slot.encumberedUtf8Bytes + wire.totalBodyUtf8Bytes)
        && slot.encumberedUtf8Bytes + wire.totalBodyUtf8Bytes <= slot.acquiredUtf8Bytes, "native acquired budget exhausted", "auth");
      slot.encumberedUtf8Bytes += wire.totalBodyUtf8Bytes; next.revision++; assertNativeRootContinuityV1(root, next);
      const binding = makeBoundDocumentV1<NativeRuntimeBindingV2>("rms-native-runtime-binding-v2", {
        version: "rms-native-runtime-binding-v2", stateOwner: "graph-store-native-v1", mode: "frozen-qualification-only-v1",
        missionId: run.missionId, lineageId: root.lineageId, rootAccountId: root.rootAccountId,
        generationId: root.generationId, headRevision: root.headRevision, runRef: runDocument.ref, envelopeRef: run.envelope.ref,
        planRef: makeBoundDocumentV1("native-source-planning", planning).ref, snapshotRef: makeBoundDocumentV1("native-source-snapshot", snapshot).ref,
        authorityRef: makeBoundDocumentV1("rms-native-runtime-authority-v1", host.authority).ref, knowledgeProjectionPolicyRef: null });
      const document = { version: "rms-native-operation-v1", binding, run: runDocument, wire, lease, expected,
        permitRef: makeBoundDocumentV1("rms-native-qualification-permit-v1", permit).ref, grant: retainNativeGrant(host, expected, unitCap.value, wire.totalBodyUtf8Bytes),
        rootBefore: root, rootAfter: next, admissionDigest: this.outbox(executionId)!.digest };
      const bindingId = binding.ref.sha256;
      if (oldRoot) invariant(this.db.query("UPDATE ff8_graph_native_roots SET document=?,digest=?,revision=? WHERE root_id=? AND revision=? AND digest=?")
        .run(canonical(next), fingerprint(next), next.revision, root.rootAccountId, oldRoot.revision, oldRoot.digest).changes === 1, "native root CAS failed", "auth");
      else this.db.query("INSERT INTO ff8_graph_native_roots VALUES(?,?,?,?,?,?)").run(root.rootAccountId, root.missionId, root.lineageId, canonical(next), fingerprint(next), next.revision);
      this.db.query("INSERT INTO ff8_graph_native_bindings VALUES(?,?,?,?,?)").run(run.missionId, bindingId, root.rootAccountId, canonical(binding), fingerprint(binding));
      this.db.query("INSERT INTO ff8_graph_native_operations VALUES(?,?,?,?,?,?,?,?,0,0,0)").run(executionId, run.missionId, lease.unitId, bindingId, wire.sessionId, wire.messageId, canonical(document), fingerprint(document));
      this.events.append(run.missionId, `rms.native.operation:${executionId}`, "rms_native_operation_prepared", authority.now,
        { bindingId, documentDigest: fingerprint(document), rootId: root.rootAccountId, rootBefore: fingerprint(root), rootDigest: fingerprint(next) }, lease.unitId);
      // Host still verifies the PREIMAGE checkpoint; the local postimage was
      // changed only by this transaction and is reread, never reset from a copy.
      this.nativeRuntimeHost(authority, expected); this.leases.assert(lease, authority); this.assertWorkCurrent(run.missionId, lease.unitId, executionId);
      invariant((this.db.query("SELECT digest FROM ff8_graph_native_roots WHERE root_id=?").get(root.rootAccountId) as { digest: string }).digest === fingerprint(next), "native root postimage changed", "auth");
      return binding;
    }).immediate();
  }
  /** Finite DATA read only. Cursor progress is not execution authority. */
  async observeNativeAtRestDataV1(currentAuthority: () => ControllerAuthority, suppliedLease: UnitLease,
    executionId: string, transport: NativeObservationTransportV1): Promise<NativeObservationDataV1> {
    const deadline = performance.now() + NATIVE_OBSERVATION_LIMITS_V1.timeoutMs, lease = immutableCopy(suppliedLease);
    const eventValid = (e: GraphEvent) => e.digest === fingerprint({ kind: e.kind, time: e.time, payload: e.payload, unitId: e.unitId });
    const retained = this.events.read(lease.missionId).find(e => e.key === `rms.native-at-rest.image:${executionId}`);
    invariant(retained && retained.kind === "rms.native-at-rest.image" && retained.unitId === lease.unitId && eventValid(retained), "missing retained at-rest image");
    const image = immutableCopy(retained.payload as AtRestImageV1), imageDigest = fingerprint(image);
    const bound = () => {
      const e = this.events.read(lease.missionId).find(e => e.key === retained.key);
      invariant(e && eventValid(e) && fingerprint(e.payload) === imageDigest && e.kind === retained.kind && e.unitId === lease.unitId, "observation image changed");
    };
    const check = () => {
      invariant(nativeObservationGuards.has(check), "observation scope ended"); bound();
      const authority = immutableCopy(currentAuthority()); assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      this.assertWorkCurrent(lease.missionId, lease.unitId, executionId);
      const row = this.outbox(executionId);
      invariant(row && row.mission === lease.missionId && row.unit_id === lease.unitId && row.token === lease.token && row.state === "PREPARED"
        && row.attempts === 0 && !row.receipt && !row.terminal_proof && this.unit(lease.missionId, lease.unitId).state === "RESERVED", "observation requires owned unsent admission");
      this.assertDurableAdmission(row); this.assertAdmissionInputs(authority, lease, JSON.parse(row.body));
      const revision = (this.db.query("SELECT revision FROM ff8_missions WHERE id=?").get(lease.missionId) as { revision: number }).revision;
      invariant(canonical(image.scope) === canonical({ missionId: lease.missionId, unitId: lease.unitId, executionId, owner: lease.owner,
        controllerFence: authority.lease.token, familyFence: lease.token, revision, admissionDigest: row.digest })
        && canonical(image) === canonical(makeAtRestImageV1(image.scope, image.request, JSON.parse(row.body).command, image)), "observation admission/image mismatch");
      return authority;
    };
    const history = () => {
      let after: number | null = null, cursorKey: string | null = null;
      const items: NativeObservationDataV1["logItems"] = [];
      for (const e of this.events.read(lease.missionId)) {
        if (e.kind !== "rms.native-observation.result" || (e.payload as NativeObservationDataV1).imageDigest !== imageDigest) continue;
        const d = e.payload as NativeObservationDataV1;
        invariant(eventValid(e) && e.unitId === lease.unitId && d.version === "rms-native-observation-data-v1" && d.dataSha256 === observationDataHashV1(d)
          && d.sessionId === image.sessionId && d.messageId === image.messageId && d.logItems.length <= NATIVE_OBSERVATION_LIMITS_V1.frames, "corrupt observation DATA");
        const begin = this.events.read(lease.missionId).find(b => b.key === d.attemptKey);
        invariant(begin && begin.kind === "rms.native-observation.begin" && eventValid(begin) && begin.unitId === lease.unitId
          && (begin.payload as any).imageDigest === imageDigest && (begin.payload as any).after === d.afterBefore, "observation lacks BEGIN");
        if (d.progressCommitted) {
          invariant(d.logComplete && d.reason === "OK" && d.authorityCurrentBeforeAppend && d.afterBefore === after
            && (d.afterCommitted === null ? after === null : Number.isSafeInteger(d.afterCommitted) && d.afterCommitted >= (after ?? -1)), "invalid observation cursor chain");
          after = d.afterCommitted; cursorKey = e.key;
        } else invariant(d.afterCommitted === d.afterBefore, "incomplete observation advanced cursor");
        items.push(...d.logItems);
      }
      return { after, cursorKey, items };
    };
    nativeObservationGuards.add(check);
    try {
      const begin = this.db.transaction(() => {
        const authority = check(), base = history(), c = this.events.cursor(lease.missionId), key = `rms.native-observation.begin:${executionId}:${c.sequence + 1}`;
        invariant(performance.now() < deadline, "observation deadline");
        this.events.append(lease.missionId, key, "rms.native-observation.begin", Math.max(c.time, authority.now),
          { version: "rms-native-observation-begin-v1", imageDigest, after: base.after, cursorKey: base.cursorKey, limits: NATIVE_OBSERVATION_LIMITS_V1 }, lease.unitId, c.sequence);
        check(); invariant(performance.now() < deadline, "observation deadline"); return { ...base, key };
      }).immediate();
      const port = bindOwnedNativeObservationTransportV1(transport, check, image);
      const data = await runNativeObservationDataV1(image, imageDigest, begin.key, begin.after, begin.items, port, check, deadline);
      const append = () => {
        const c = this.events.cursor(lease.missionId);
        let time = c.time; try { time = Math.max(time, check().now); } catch { /* late DATA retains the original journal clock */ }
        data.dataSha256 = observationDataHashV1(data);
        this.events.append(lease.missionId, `rms.native-observation.result:${executionId}:${c.sequence + 1}`, "rms.native-observation.result",
          time, data, lease.unitId, c.sequence);
      };
      const divergent = () => {
        const old = history().items.filter(i => i.kind === "EVENT");
        return data.logItems.some(i => i.kind === "EVENT" && old.some(o => o.kind === "EVENT"
          && (o.seq === i.seq || o.eventIdSha256 === i.eventIdSha256) && canonical(o) !== canonical(i)));
      };
      if (data.logComplete && data.reason === "OK") {
        try {
          this.db.transaction(() => {
            check(); invariant(performance.now() < deadline, "observation deadline");
            const current = history(); invariant(current.cursorKey === begin.cursorKey && current.after === begin.after, "observation cursor CAS");
            invariant(!divergent(), "observation event divergence");
            data.authorityCurrentBeforeAppend = true; data.progressCommitted = true;
            data.afterCommitted = data.logItems.findLast(i => i.kind === "SYNCED")?.seq ?? null;
            append(); check(); invariant(performance.now() < deadline, "observation deadline");
          }).immediate(); return structuredClone(data);
        } catch {
          data.progressCommitted = false; data.afterCommitted = begin.after; data.logComplete = false;
          data.reason = performance.now() >= deadline ? "DEADLINE" : "CURSOR_CAS";
        }
      }
      this.db.transaction(() => {
        bound(); data.authorityCurrentBeforeAppend = false;
        try { check(); data.authorityCurrentBeforeAppend = true; } catch { data.reason = "REVOKED"; }
        if (divergent()) { data.logItems = []; data.reason = "DIVERGENT_EVENT"; data.logComplete = false; }
        append(); // Physical late DATA only, never progress or a resource release.
        try { check(); } catch { /* no cursor or rights were granted by this append */ }
      }).immediate();
      return structuredClone(data);
    } finally { nativeObservationGuards.delete(check); }
  }
  /** Prospective data admission only. Host supplies fresh authority, never a DTO capability.
   * No generic late-event API escapes this call's retained operation closure. */
  async admitNativeAtRestV1(currentAuthority: () => ControllerAuthority, suppliedLease: UnitLease, executionId: string,
    suppliedRequest: AtRestRequestV1, transport: AtRestTransportV1): Promise<AtRestResultV1> {
    const lease = immutableCopy(suppliedLease), request = captureAtRestRequestV1(suppliedRequest);
    const key = `rms.native-at-rest.image:${executionId}`;
    const check = () => {
      const authority = immutableCopy(currentAuthority());
      this.assertWorkCurrent(lease.missionId, lease.unitId, executionId);
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const row = this.outbox(executionId);
      invariant(row && row.mission === lease.missionId && row.unit_id === lease.unitId && row.token === lease.token
        && row.state === "PREPARED" && row.attempts === 0 && !row.receipt && !row.terminal_proof, "at-rest requires exact unsent owned admission");
      invariant(this.unit(lease.missionId, lease.unitId).state === "RESERVED", "at-rest family unavailable");
      this.assertDurableAdmission(row); this.assertAdmissionInputs(authority, lease, JSON.parse(row.body) as Admission);
      return { authority, row };
    };
    const retained = () => this.events.read(lease.missionId).find(e => e.key === key);
    const image = this.db.transaction(() => {
      const { authority, row } = check();
      const revision = (this.db.query("SELECT revision FROM ff8_missions WHERE id=?").get(lease.missionId) as { revision: number }).revision;
      const scope = { missionId: lease.missionId, unitId: lease.unitId, executionId, owner: lease.owner,
        controllerFence: authority.lease.token, familyFence: lease.token, revision, admissionDigest: row.digest };
      const old = retained();
      if (old) {
        const stored = old.payload as AtRestImageV1;
        atRestCheck(old.kind === "rms.native-at-rest.image" && old.unitId === lease.unitId
          && old.digest === fingerprint({ kind: old.kind, time: old.time, payload: stored, unitId: old.unitId })
          && canonical(stored.scope) === canonical(scope) && canonical(stored.request) === canonical(request));
        atRestCheck(canonical(stored) === canonical(makeAtRestImageV1(scope, request, JSON.parse(row.body).command, stored)));
        check(); return immutableCopy(stored);
      }
      const made = makeAtRestImageV1(scope, request, JSON.parse(row.body).command);
      this.events.append(lease.missionId, key, "rms.native-at-rest.image", Math.max(authority.now, this.events.cursor(lease.missionId).time), made,
        lease.unitId, this.events.cursor(lease.missionId).sequence);
      check(); return immutableCopy(made);
    }).immediate();
    const imageDigest = fingerprint(image);
    const bound = () => {
      const e = retained(); invariant(e && e.kind === "rms.native-at-rest.image" && e.unitId === lease.unitId && fingerprint(e.payload) === imageDigest
        && e.digest === fingerprint({ kind: e.kind, time: e.time, payload: e.payload, unitId: e.unitId }), "at-rest retained operation changed");
    };
    const assertCurrent = () => { invariant(nativeAtRestGuards.has(assertCurrent), "at-rest operation scope ended"); bound(); check(); };
    nativeAtRestGuards.add(assertCurrent);
    try {
    const port = bindOwnedAtRestTransportV1(transport, assertCurrent, image);
    return await runAtRestV1(image, port, {
      check: assertCurrent,
      claim: phase => this.db.transaction(() => {
        assertCurrent(); const eventKey = `rms.native-at-rest.claim:${executionId}:${phase}`;
        if (this.events.read(lease.missionId).some(e => e.key === eventKey)) return false;
        const { authority } = check();
        this.events.append(lease.missionId, eventKey, "rms.native-at-rest.claim", Math.max(authority.now, this.events.cursor(lease.missionId).time),
          { imageDigest, phase }, lease.unitId, this.events.cursor(lease.missionId).sequence);
        assertCurrent(); return true;
      }).immediate(),
      observed: (phase, outcome, responseSha256) => this.db.transaction(() => {
        bound(); let authorized = true, observedAt = Date.now();
        try { observedAt = check().authority.now; } catch { authorized = false; }
        const cursor = this.events.cursor(lease.missionId);
        // Bounded, non-authorizing physical observation, even after fencing.
        // Never persist transport exceptions, credentials or untrusted remote bodies.
        this.events.append(lease.missionId, `rms.native-at-rest.observation:${executionId}:${cursor.sequence + 1}`,
          "rms.native-at-rest.observation", Math.max(observedAt, cursor.time),
          { version: "rms-native-at-rest-observation-v1", imageDigest, phase, outcome, responseSha256, authorityCurrentBeforeAppend: authorized }, lease.unitId, cursor.sequence);
        if (authorized) { try { check(); } catch { /* append itself can consume the last TTL: fact stays DATA */ } }
      }).immediate(),
    });
    } finally { nativeAtRestGuards.delete(assertCurrent); }
  }
  isWorkCurrent(missionId: string, unitId: string, executionId?: string): boolean {
    try { assertRmsWorkCurrentV1(this.db, missionId, unitId, executionId); return true; } catch { return false; }
  }
  assertWorkCurrent(missionId: string, unitId: string, executionId?: string): void { assertRmsWorkCurrentV1(this.db, missionId, unitId, executionId); }
  assertResultCurrent(missionId: string, unitId: string, resultId: string): void { this.scientificResult(missionId, unitId, resultId); }
  /** Receipt of the RMS decision is not a native admission or agent read receipt. */
  retainOrderedCommandV1(authority: ControllerAuthority, raw: OrderedCommandRequestV1): OrderedCommandReceiptV1 {
    authority = immutableCopy(authority); const request = immutableCopy(raw), missionId = authority.lease.missionId;
    nonempty(request.commandId); nonempty(request.unitId); nonempty(request.reason); integer(request.sequence, 1);
    invariant(["obsolete", "notify"].includes(request.action) && typeof request.notify === "boolean", "invalid RMS command");
    return this.db.transaction(() => {
      const parent = this.bootstrapParentAuthority(authority), unit = this.row(missionId, request.unitId);
      const old = this.db.query("SELECT document,receipt FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(missionId, request.commandId) as { document: string; receipt: string } | null;
      if (old) {
        const image = JSON.parse(old.document); invariant(canonical(image.request) === canonical(request) && image.parentDigest === parent.digest, "RMS command identity diverged", "auth");
        this.assertAuthorizationEvent(missionId, `rms.command:${request.commandId}`, "rms_command_committed", image, request.unitId); return JSON.parse(old.receipt);
      }
      const lease = this.leases.get(missionId, request.unitId), execution = request.executionId ? this.outbox(request.executionId) : null;
      invariant(!lease || lease.owner === authority.lease.owner, "RMS family owner mismatch", "auth");
      invariant(!request.executionId || execution?.mission === missionId && execution.unit_id === request.unitId && execution.token === request.expectedFamilyToken, "RMS execution scope mismatch", "auth");
      let sessionId: string | null = null, nativeWire: NativeNotificationWireV1 | undefined;
      if (execution) {
        const author = this.db.query("SELECT document FROM ff8_graph_native_authors WHERE mission=? AND execution_id=?").get(missionId, execution.execution_id) as { document: string } | null;
        const atRest = this.events.read(missionId).find(e => e.key === `rms.native-at-rest.image:${execution.execution_id}`)?.payload as AtRestImageV1 | undefined;
        const native = this.db.query("SELECT session_id,document,digest FROM ff8_graph_native_operations WHERE mission=? AND execution_id=?").get(missionId, execution.execution_id) as { session_id: string; document: string; digest: string } | null;
        if (native) invariant(fingerprint(JSON.parse(native.document)) === native.digest && JSON.parse(native.document).wire.sessionId === native.session_id,
          "RMS native session image corrupt", "schema");
        const candidates = [author ? JSON.parse(author.document).sessionId : null, atRest?.sessionId ?? null, native?.session_id ?? null].filter(s => s !== null);
        invariant(new Set(candidates).size <= 1, "RMS native session provenance diverged", "auth");
        sessionId = candidates[0] ?? null;
        if (native && request.notify) nativeWire = encodeNativeNotificationWireV1(native.session_id, missionId, request.commandId,
          JSON.parse(canonical(request)), hash(canonical(JSON.parse(native.document).wire)));
      }
      invariant(request.sessionId === sessionId, "RMS session binding absent/ambiguous", "auth");
      const stream = sessionId ? `session:${sessionId}` : request.executionId ? `execution:${request.executionId}` : `unit:${request.unitId}`;
      const priorImages = this.db.query("SELECT document,stream FROM ff8_graph_ordered_commands WHERE mission=?").all(missionId) as Array<{ document: string; stream: string }>;
      invariant(!request.executionId || priorImages.every(p => JSON.parse(p.document).request.executionId !== request.executionId || p.stream === stream), "RMS stream/session binding changed", "auth");
      const currentSequence = () => (this.db.query("SELECT COALESCE(MAX(sequence),0) AS n FROM ff8_graph_ordered_commands WHERE mission=? AND stream=?").get(missionId, stream) as { n: number }).n;
      const before = this.events.cursor(missionId), check = (after: boolean) => {
        assertController(this.db, authority, missionId); invariant(this.bootstrapParentAuthority(authority).digest === parent.digest, "RMS issuer revoked", "auth");
        const revision = (this.db.query("SELECT revision FROM ff8_missions WHERE id=?").get(missionId) as { revision: number }).revision;
        invariant(revision === request.expectedMissionRevision && this.row(missionId, request.unitId).revision === request.expectedUnitRevision
          && this.events.cursor(missionId).sequence === request.expectedEventSequence + (after ? 1 : 0)
          && currentSequence() === request.sequence - (after ? 0 : 1), "RMS command CAS mismatch", "auth");
        invariant((lease?.token ?? null) === request.expectedFamilyToken && canonical(this.leases.get(missionId, request.unitId) ?? null) === canonical(lease ?? null), "RMS ownership changed", "auth");
      };
      check(false);
      const image = { version: "rms-ordered-command-v1", missionId, request, stream, parentDigest: parent.digest, parentActorId: parent.identity.actorId,
        unitDigest: unit.digest, executionDigest: execution?.digest ?? null, taskId: execution ? JSON.parse(execution.body).command.taskId : null,
        ...(nativeWire ? { nativeWire } : {}) };
      const receipt = { commandId: request.commandId, imageDigest: fingerprint(image), stream, sequence: request.sequence, eventSequence: before.sequence + 1, obsolete: request.action === "obsolete" };
      invariant(!this.events.read(missionId).some(e => e.key === `rms.command:${request.commandId}`), "orphan RMS event is not authority", "auth");
      this.db.query("INSERT INTO ff8_graph_ordered_commands VALUES(?,?,?,?,?,?,?,?,?,?,NULL)").run(missionId, request.commandId, stream, request.sequence, request.unitId, request.action, canonical(image), fingerprint(image), canonical(receipt), request.notify ? "PENDING" : "NOT_REQUESTED");
      this.events.append(missionId, `rms.command:${request.commandId}`, "rms_command_committed", authority.now, image, request.unitId, before.sequence);
      check(true); return receipt;
    }).immediate();
  }
  /** OFFLINE port only: native notifications require a separately qualified join.
   * Recovery calls reconcile, never send again, even if the first reply was lost. */
  async deliverOrderedCommandV1(authority: ControllerAuthority, commandId: string, port: {
    kind: "offline-fixture-v1"; send(image: unknown): Promise<Record<string, unknown>>; reconcile(image: unknown): Promise<Record<string, unknown> | null>;
  }): Promise<Record<string, unknown> | null> {
    authority = immutableCopy(authority); invariant(port.kind === "offline-fixture-v1", "native ordered delivery not qualified");
    const missionId = authority.lease.missionId;
    const retained = this.db.transaction(() => {
      assertController(this.db, authority, missionId); const parent = this.bootstrapParentAuthority(authority);
      const row = this.db.query("SELECT * FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(missionId, commandId) as { document: string; digest: string; stream: string; sequence: number; delivery: string; remote_receipt: string | null } | null;
      invariant(row && fingerprint(JSON.parse(row.document)) === row.digest && JSON.parse(row.document).parentDigest === parent.digest, "RMS delivery binding", "auth");
      invariant(!JSON.parse(row.document).nativeWire, "native ordered command requires its qualified native route; offline fallback forbidden", "auth");
      invariant(row.delivery !== "NOT_REQUESTED", "RMS notification not requested");
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_ordered_commands WHERE mission=? AND stream=? AND sequence<? AND delivery NOT IN ('NOT_REQUESTED','ADMITTED','REJECTED')").get(missionId, row.stream, row.sequence), "previous command admission unknown");
      if (row.delivery === "PENDING") this.db.query("UPDATE ff8_graph_ordered_commands SET delivery='SENDING' WHERE mission=? AND command_id=? AND delivery='PENDING'").run(missionId, commandId);
      return row;
    }).immediate();
    if (retained.remote_receipt) return JSON.parse(retained.remote_receipt);
    let response: Record<string, unknown> | null;
    try { response = immutableCopy(await (retained.delivery === "PENDING" ? port.send(JSON.parse(retained.document)) : port.reconcile(JSON.parse(retained.document)))); }
    catch { this.db.query("UPDATE ff8_graph_ordered_commands SET delivery='AMBIGUOUS' WHERE mission=? AND command_id=? AND remote_receipt IS NULL").run(missionId, commandId); throw new Error("ordered command admission ambiguous; reconcile only"); }
    if (response === null) return null;
    invariant(response.commandId === commandId && response.imageDigest === retained.digest && ["admitted", "rejected"].includes(String(response.state)), "ordered receipt identity diverged");
    return this.db.transaction(() => {
      const row = this.db.query("SELECT document,remote_receipt FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(missionId, commandId) as { document: string; remote_receipt: string | null };
      invariant(row.document === retained.document && (!row.remote_receipt || row.remote_receipt === canonical(response)), "ordered receipt changed");
      this.db.query("UPDATE ff8_graph_ordered_commands SET delivery=?,remote_receipt=? WHERE mission=? AND command_id=?").run(response!.state === "admitted" ? "ADMITTED" : "REJECTED", canonical(response), missionId, commandId);
      return response;
    }).immediate();
  }
  /** Native delivery consumes the SAME durable RMS command row/stream. No
   * operation or session is created, and resume:false cannot be caller-overridden. */
  async deliverNativeOrderedCommandV1(currentAuthority: () => ControllerAuthority, executionId: string, commandId: string,
    port: NativeRuntimeHttpPortV1): Promise<Record<string, unknown> | null> {
    const initial = immutableCopy(currentAuthority()), missionId = initial.lease.missionId;
    const row = this.db.query("SELECT document,digest,delivery,remote_receipt FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(missionId, commandId) as { document: string; digest: string; delivery: string; remote_receipt: string | null } | null;
    invariant(row && fingerprint(JSON.parse(row.document)) === row.digest, "native ordered image unavailable/corrupt", "auth");
    const image = JSON.parse(row.document), wire = image.nativeWire as NativeNotificationWireV1 | undefined;
    invariant(wire && image.missionId === missionId && image.request.commandId === commandId && image.request.notify === true,
      "native ordered notification was not retained before effect", "auth");
    invariant(image.request.executionId === executionId, "native ordered supplied execution contradicts durable target", "auth");
    const original = this.db.query("SELECT document,digest,session_id FROM ff8_graph_native_operations WHERE mission=? AND execution_id=?").get(missionId, image.request.executionId) as { document: string; digest: string; session_id: string } | null;
    invariant(original && fingerprint(JSON.parse(original.document)) === original.digest && original.session_id === wire.sessionId
      && image.request.sessionId === wire.sessionId, "native ordered operation/session mismatch", "auth");
    const op = JSON.parse(original.document), expected: NativeRuntimeExpectedV1 = { ...op.expected, imageSha256: hash(canonical(wire)), commandId, purpose: "effect" };
    const ioSignal = AbortSignal.timeout(10000);
    await this.refreshNativeRuntimeV1(currentAuthority, expected, port, ioSignal);
    invariant(canonical(encodeNativeNotificationWireV1(original.session_id, missionId, commandId, image.request, hash(canonical(op.wire)))) === canonical(wire),
      "native ordered wire diverged from retained command", "auth");
    this.db.transaction(() => {
      const a = immutableCopy(currentAuthority()), host = this.nativeRuntimeHost(a, expected, port), key = `ordered-grant:${commandId}`;
      const prior = this.db.query("SELECT document,digest,root_id FROM ff8_graph_native_bindings WHERE mission=? AND binding_id=?").get(missionId, key) as { document: string; digest: string; root_id: string } | null;
      if (prior) {
        invariant(fingerprint(JSON.parse(prior.document)) === prior.digest && prior.root_id === op.grant.identity.rootAccountId,
          "native ordered retained grant corrupt", "auth"); return;
      }
      const g = op.grant as NativeRetainedGrantV1;
      invariant(host.permit.originId === g.identity.originId && host.permit.slotKey === g.identity.slotKey
        && host.rootLedger.rootAccountId === g.identity.rootAccountId, "native ordered cannot substitute operation origin/slot/root", "auth");
      const document = { version: "rms-native-ordered-grant-v1", commandId, executionId, unitId: image.request.unitId,
        commandDigest: row.digest, wire, expected, grant: retainNativeGrant(host, expected, g.unitCapUtf8Bytes, wire.byteLength) };
      this.db.query("INSERT INTO ff8_graph_native_bindings VALUES(?,?,?,?,?)").run(missionId, key, host.rootLedger.rootAccountId, canonical(document), fingerprint(document));
      this.events.append(missionId, `rms.native.ordered-grant:${commandId}`, "rms_native_ordered_grant_retained", a.now,
        { bindingId: key, documentDigest: fingerprint(document) }, image.request.unitId);
      this.nativeRuntimeHost(a, expected, port);
    }).immediate();
    const check = () => {
      invariant(nativeRuntimeGuards.has(check), "native ordered ownership binding ended", "auth");
      const a = immutableCopy(currentAuthority()), parent = this.bootstrapParentAuthority(a), host = this.nativeRuntimeHost(a, expected, port);
      invariant(parent.digest === image.parentDigest, "native ordered issuer revoked", "auth");
      this.assertAuthorizationEvent(missionId, `rms.command:${commandId}`, "rms_command_committed", image, image.request.unitId);
      const current = this.db.query("SELECT document,digest,delivery FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(missionId, commandId) as { document: string; digest: string; delivery: string } | null;
      invariant(current?.document === row.document && current.digest === row.digest && current.delivery !== "NOT_REQUESTED", "native ordered image changed", "auth");
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_ordered_commands WHERE mission=? AND stream=? AND sequence<? AND delivery NOT IN ('NOT_REQUESTED','ADMITTED','REJECTED')")
        .get(missionId, image.stream, image.request.sequence), "previous command admission unknown", "auth");
      const retained = this.db.query("SELECT document,digest FROM ff8_graph_native_operations WHERE mission=? AND execution_id=?").get(missionId, image.request.executionId) as { document: string; digest: string } | null;
      invariant(retained?.document === original.document && retained.digest === original.digest, "native ordered physical operation changed", "auth");
      const root = this.db.query("SELECT document,digest FROM ff8_graph_native_roots WHERE root_id=?").get(host.rootLedger.rootAccountId) as { document: string; digest: string } | null;
      invariant(root && fingerprint(JSON.parse(root.document)) === root.digest && root.document === canonical(host.rootLedger)
        && host.rootLedger.origins.some(o => o.originId === host.permit.originId), "native ordered root/history/origin continuity unproved", "auth");
    };
    nativeRuntimeGuards.add(check);
    try {
      check(); if (row.remote_receipt) return JSON.parse(row.remote_receipt);
      const result = await submitNativeNotificationWireV1(wire, op.wire, this.nativeRuntimeHost(immutableCopy(currentAuthority()), expected, port).authority, port, {
        check, signal: ioSignal,
        refresh: (purpose, signal) => this.refreshNativeRuntimeV1(currentAuthority, { ...expected, purpose }, port, signal),
        claimed: () => {
          check(); const current = this.db.query("SELECT delivery FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(missionId, commandId) as { delivery: string };
          return ["SENDING", "AMBIGUOUS", "ADMITTED"].includes(current.delivery);
        },
        claim: () => this.db.transaction(() => {
          check(); const current = this.db.query("SELECT delivery FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(missionId, commandId) as { delivery: string };
          if (current.delivery !== "PENDING") return false;
          const a = immutableCopy(currentAuthority()), host = this.nativeRuntimeHost(a, expected, port), root = nativeLedgerDraft(host.rootLedger);
          const beforeDigest = fingerprint(root), beforeRevision = root.revision, slot = root.slots.find(s => s.slotKey === host.permit.slotKey);
          const sourceRun = readRuntimeDocumentV1(op.run) as any, sourceEnvelope = readRuntimeDocumentV1(sourceRun.envelope) as any;
          const sourcePlanning = readRuntimeDocumentV1(sourceEnvelope.planning) as any;
          const unitCap = sourcePlanning.sidecar.admissionBudget?.byUnit[image.request.unitId]?.admissionCapUtf8Bytes;
          invariant(unitCap?.known && typeof unitCap.value === "number" && Number.isSafeInteger(unitCap.value) && unitCap.value >= 1, "native ordered current unit cap unknown", "auth");
          invariant(slot && wire.byteLength <= host.permit.maxBodyUtf8Bytes && host.permit.maxBodyUtf8Bytes <= slot.capUtf8Bytes
            && host.permit.maxBodyUtf8Bytes <= unitCap.value && unitCap.value <= slot.capUtf8Bytes
            && Number.isSafeInteger(slot.encumberedUtf8Bytes + wire.byteLength) && slot.encumberedUtf8Bytes + wire.byteLength <= slot.acquiredUtf8Bytes,
            "native ordered REST body has no acquired budget", "auth");
          slot.encumberedUtf8Bytes += wire.byteLength; slot.spentUtf8Bytes += wire.byteLength; root.revision++;
          assertNativeRootContinuityV1(host.rootLedger, root);
          invariant(this.db.query("UPDATE ff8_graph_native_roots SET document=?,digest=?,revision=? WHERE root_id=? AND revision=? AND digest=?")
            .run(canonical(root), fingerprint(root), root.revision, root.rootAccountId, beforeRevision, beforeDigest).changes === 1, "native ordered budget CAS failed", "auth");
          invariant(this.db.query("UPDATE ff8_graph_ordered_commands SET delivery='SENDING' WHERE mission=? AND command_id=? AND delivery='PENDING' AND digest=?")
            .run(missionId, commandId, row.digest).changes === 1, "native ordered claim CAS failed", "auth");
          this.events.append(missionId, `rms.native.ordered-claim:${commandId}`, "rms_native_ordered_engaged", a.now,
            { commandId, imageDigest: row.digest, wireSha256: expected.imageSha256, bodyUtf8Bytes: wire.byteLength,
              rootId: root.rootAccountId, rootBefore: beforeDigest, rootAfter: fingerprint(root), before: host.rootLedger, after: root, resume: false }, image.request.unitId);
          check(); return true;
        }).immediate(),
        observed: (phase, responseSha256) => {
          const a = immutableCopy(currentAuthority()); this.nativeRuntimeHost(a, { ...expected, purpose: "physical-observation" }, port);
          const cursor = this.events.cursor(missionId);
          this.events.append(missionId, `rms.native.ordered-io:${commandId}:${cursor.sequence + 1}`, "rms_native_ordered_io_data", Math.max(a.now, cursor.time),
            { commandId, imageDigest: row.digest, wireSha256: expected.imageSha256, phase, responseSha256, applicationProven: false }, image.request.unitId, cursor.sequence);
        },
      });
      return this.db.transaction(() => {
        check(); const current = this.db.query("SELECT remote_receipt,delivery FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(missionId, commandId) as { remote_receipt: string | null; delivery: string };
        if (!result) {
          if (!current.remote_receipt && current.delivery === "SENDING") this.db.query("UPDATE ff8_graph_ordered_commands SET delivery='AMBIGUOUS' WHERE mission=? AND command_id=? AND remote_receipt IS NULL").run(missionId, commandId);
          return current.remote_receipt ? JSON.parse(current.remote_receipt) : null;
        }
        const { responseSha256, ...nativeBinding } = result;
        const receipt = { commandId, imageDigest: row.digest, state: "admitted", native: nativeBinding, applicationProven: false };
        invariant(!current.remote_receipt || current.remote_receipt === canonical(receipt), "native ordered receipt diverged", "auth");
        const cursor = this.events.cursor(missionId), a = immutableCopy(currentAuthority());
        this.events.append(missionId, `rms.native.ordered-admission:${commandId}:${cursor.sequence + 1}`, "rms_native_ordered_admission_data", Math.max(a.now, cursor.time),
          { commandId, imageDigest: row.digest, wireSha256: expected.imageSha256, responseSha256, applicationProven: false }, image.request.unitId, cursor.sequence);
        this.db.query("UPDATE ff8_graph_ordered_commands SET delivery='ADMITTED',remote_receipt=? WHERE mission=? AND command_id=?")
          .run(canonical(receipt), missionId, commandId); check(); return receipt;
      }).immediate();
    } finally { nativeRuntimeGuards.delete(check); }
  }
  private row(missionId: string, unitId: string): UnitRow {
    const r = this.db.query("SELECT document,digest,state,revision FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(missionId, unitId) as UnitRow | null;
    invariant(r, "unknown work unit"); return r;
  }
  unit(missionId: string, unitId: string): WorkUnit {
    const r = this.row(missionId, unitId), unit = JSON.parse(r.document) as WorkUnit;
    invariant(fingerprint(unit) === r.digest && unit.unitId === unitId, "immutable unit digest mismatch", "schema");
    assertCanonicalUnitProjection(this.db, missionId, unit);
    return { ...unit, state: r.state };
  }
  private change(authority: ControllerAuthority, unitId: string, state: WorkUnitState, reason: string): void {
    const missionId = authority.lease.missionId, r = this.row(missionId, unitId);
    invariant(transitions[r.state].includes(state), `invalid unit transition ${r.state}->${state}`);
    const updated = this.db.query("UPDATE ff8_graph_units SET state=?,revision=revision+1 WHERE mission=? AND unit_id=? AND revision=?").run(state, missionId, unitId, r.revision);
    invariant(updated.changes === 1, "stale unit revision");
    this.events.append(missionId, `state:${unitId}:${r.revision + 1}`, "unit_state", authority.now, { from: r.state, state, reason }, unitId);
  }
  putSnapshot(authority: ControllerAuthority, snapshot: Record<string, unknown>): void {
    validateGraphDocument("graph-snapshot", snapshot); const id = snapshot.snapshotId as string;
    invariant(snapshot.missionId === authority.lease.missionId, "graph snapshot mission mismatch");
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const digest = fingerprint(snapshot), old = this.db.query("SELECT digest FROM ff8_graph_snapshots WHERE id=?").get(id) as { digest: string } | null;
      invariant(!old || old.digest === digest, "immutable graph snapshot changed");
      // Immutable content is already stored. Preserve the original audit time
      // and digest rather than replaying an event with the caller's new clock.
      if (old) return;
      this.db.query("INSERT OR IGNORE INTO ff8_graph_snapshots VALUES(?,?,?)").run(id, digest, canonical(snapshot));
      this.events.append(authority.lease.missionId, `snapshot:${id}`, "snapshot_stored", authority.now, snapshot);
    }).immediate();
  }
  putPartition(authority: ControllerAuthority, partition: Record<string, unknown>): void {
    validateGraphDocument("cluster-partition", partition);
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const id = partition.partitionId as string, digest = fingerprint(partition), old = this.db.query("SELECT digest FROM ff8_graph_partitions WHERE id=?").get(id) as { digest: string } | null;
      const source = this.db.query("SELECT document FROM ff8_graph_snapshots WHERE id=?").get(partition.snapshotId as string) as { document: string } | null;
      invariant(source && JSON.parse(source.document).normalizedFingerprint === partition.snapshotFingerprint, "partition snapshot fingerprint mismatch");
      invariant(!old || old.digest === digest, "immutable partition changed");
      if (old) return;
      this.db.query("INSERT OR IGNORE INTO ff8_graph_partitions VALUES(?,?,?,?)").run(id, partition.snapshotId as string, digest, canonical(partition));
      this.events.append(authority.lease.missionId, `partition:${id}`, "partition_stored", authority.now, partition);
    }).immediate();
  }
  addUnit(authority: ControllerAuthority, unit: WorkUnit): void {
    validateGraphDocument("work-unit", unit);
    invariant(["PENDING", "BLOCKED", "READY"].includes(unit.state), "new unit must be unadmitted");
    invariant(unit.ownedFunctionIds.length > 0 && new Set(unit.ownedFunctionIds).size === unit.ownedFunctionIds.length, "owned functions must be unique");
    for (const id of unit.ownedFunctionIds) invariant(/^[a-f0-9]{64}:0x[1-9A-F][0-9A-F]*$/.test(id), "noncanonical module-hash/RVA function identity");
    invariant(unit.contextFunctionIds.every(id => !unit.ownedFunctionIds.includes(id)), "context function cannot be owned");
    for (const id of unit.ownedFunctionIds) {
      const family = unit.subIntents.filter(s => s.functionId === id);
      invariant(family.length === 3 && ["A", "B", "R"].every(role => family.filter(s => s.role === role).length === 1), "unit needs one A/B/R per function");
      const r = family.find(s => s.role === "R")!, ab = family.filter(s => s.role === "A" || s.role === "B");
      invariant(canonical([...ab[0]!.waitsForSubIntentIds].sort()) === canonical([...ab[1]!.waitsForSubIntentIds].sort()) && canonical([...r.waitsForSubIntentIds].sort()) === canonical(ab.map(s => s.subIntentId).sort()), "invalid blind-family prerequisites");
      for (const author of ab) for (const wait of author.waitsForSubIntentIds) {
        const dependency = unit.subIntents.find(s => s.subIntentId === wait);
        invariant(dependency && dependency.role === "R" && dependency.functionId !== id && unit.ownedFunctionIds.includes(dependency.functionId), "authors may await only an owned other-function R");
      }
    }
    invariant(unit.subIntents.every(s => unit.ownedFunctionIds.includes(s.functionId)) && new Set(unit.subIntents.map(s => s.subIntentId)).size === unit.subIntents.length, "orphan or duplicate sub-intent");
    const indegrees = new Map<string, number>(), consumers = new Map<string, string[]>();
    for (const sub of unit.subIntents) {
      invariant(new Set(sub.waitsForSubIntentIds).size === sub.waitsForSubIntentIds.length, "duplicate sub-intent prerequisite");
      indegrees.set(sub.subIntentId, sub.waitsForSubIntentIds.length);
      for (const wait of sub.waitsForSubIntentIds) {
        invariant(unit.subIntents.some(s => s.subIntentId === wait), "unknown sub-intent prerequisite");
        consumers.set(wait, [...(consumers.get(wait) ?? []), sub.subIntentId]);
      }
    }
    const ready = [...indegrees].filter(([, n]) => n === 0).map(([id]) => id);
    for (let i = 0; i < ready.length; i++) for (const id of consumers.get(ready[i]!) ?? []) {
      const n = indegrees.get(id)! - 1; indegrees.set(id, n); if (n === 0) ready.push(id);
    }
    invariant(ready.length === unit.subIntents.length, "cyclic sub-intent dependency DAG");
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      invariant(this.db.query("SELECT 1 FROM ff8_graph_partitions WHERE id=? AND snapshot_id=?").get(unit.partitionId, unit.snapshotId), "unit snapshot/partition unavailable");
      assertCanonicalUnitProjection(this.db, authority.lease.missionId, unit);
      const old = this.db.query("SELECT digest FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(authority.lease.missionId, unit.unitId) as { digest: string } | null;
      invariant(!old || old.digest === fingerprint(unit), "immutable work unit changed");
      if (old) return;
      if (unit.state === "READY") this.assertPrerequisites(authority.lease.missionId, unit);
      this.db.query("INSERT INTO ff8_graph_units(mission,unit_id,document,digest,state) VALUES(?,?,?,?,?)").run(authority.lease.missionId, unit.unitId, canonical(unit), fingerprint(unit), unit.state);
      this.events.append(authority.lease.missionId, `unit:${unit.unitId}`, "unit_added", authority.now, unit, unit.unitId);
    }).immediate();
  }
  private assertPrerequisites(missionId: string, unit: WorkUnit): void {
    for (const p of unit.prerequisites.filter(p => p.kind === "obligatory" && !p.dispensed)) {
      invariant(p.producerUnitId && this.satisfies(missionId, p.producerUnitId, p.requiredPublicationLevel), `unsatisfied prerequisite: ${p.id}`);
    }
    for (const p of unit.prerequisites.filter(p => p.dispensed)) invariant(p.dispensationReason?.trim(), "dispensation needs versioned rationale");
  }
  private assertNoRetainedPublication(missionId: string, unitId: string): void {
    invariant(!this.db.query("SELECT 1 FROM ff8_graph_publications p LEFT JOIN ff8_graph_commits c ON c.mission=p.mission AND c.unit_id=p.unit_id WHERE p.mission=? AND p.unit_id=? AND c.unit_id IS NULL").get(missionId, unitId), "fenced/retained publication requires recovery under a new unit/revision; READY and redispatch forbidden");
  }
  /** Parent-authorized immutable plan/sidecar binding; no unbound production/test path. */
  freezePlan(authority: ControllerAuthority, plan: PersistencePlan, sidecar: PersistenceSidecar, binding: PlanBinding, expectedActiveRevision = 0): number {
    validateGraphDocument("mission-plan", plan);
    invariant(plan.missionId === authority.lease.missionId && plan.fingerprint === contentDigest(plan) && sidecar.fingerprint === contentDigest(sidecar) && binding.fingerprint === contentDigest(binding), "invalid frozen plan/sidecar/binding digest");
    invariant(binding.schemaVersion === 1 && sidecar.schemaVersion === 1 && binding.planFingerprint === plan.fingerprint && binding.sidecarFingerprint === sidecar.fingerprint && sidecar.planFingerprint === plan.fingerprint && sidecar.planId === plan.planId && sidecar.knowledgeRevision === plan.knowledgeRevision && sidecar.policyVersion === plan.policyVersion && sidecar.policy.version === plan.policyVersion && sidecar.estimationVersion === plan.estimationVersion, "incoherent frozen plan binding");
    return this.db.transaction(() => {
      assertController(this.db, authority, plan.missionId);
      const source = this.db.query("SELECT document FROM ff8_graph_snapshots WHERE id=?").get(plan.snapshotId) as { document: string } | null;
      invariant(source && JSON.parse(source.document).normalizedFingerprint === sidecar.snapshotFingerprint, "frozen plan snapshot mismatch");
      invariant(this.db.query("SELECT 1 FROM ff8_graph_partitions WHERE id=? AND snapshot_id=?").get(plan.partitionId, plan.snapshotId), "frozen plan partition mismatch");
      for (const id of plan.selectedUnitIds) {
        const u = this.unit(plan.missionId, id), { state: _state, ...content } = u;
        invariant(u.snapshotId === plan.snapshotId && u.partitionId === plan.partitionId && u.knowledgeRevision === plan.knowledgeRevision && sidecar.unitFingerprints[id] === fingerprint(content), "frozen unit content/revision mismatch");
      }
      const old = this.db.query("SELECT binding_hash FROM ff8_graph_plans WHERE mission=? AND plan_id=?").get(plan.missionId, plan.planId) as { binding_hash: string } | null;
      invariant(!old || old.binding_hash === binding.fingerprint, "immutable plan binding changed");
      const active = this.db.query("SELECT plan_id,revision FROM ff8_graph_active_plan WHERE mission=?").get(plan.missionId) as { plan_id: string; revision: number } | null;
      if (active?.plan_id === plan.planId) return active.revision;
      invariant((active?.revision ?? 0) === expectedActiveRevision, "stale active plan CAS revision");
      this.db.query("INSERT OR IGNORE INTO ff8_graph_plans VALUES(?,?,?,?,?,?)").run(plan.missionId, plan.planId, binding.fingerprint, canonical(plan), canonical(sidecar), canonical(binding));
      const revision = expectedActiveRevision + 1;
      this.db.query("INSERT INTO ff8_graph_active_plan VALUES(?,?,?) ON CONFLICT(mission) DO UPDATE SET plan_id=excluded.plan_id,revision=excluded.revision").run(plan.missionId, plan.planId, revision);
      this.events.append(plan.missionId, `plan:${revision}`, "plan_frozen", authority.now, { plan, sidecar, binding, activePlanRevision: revision }); return revision;
    }).immediate();
  }
  reservationExpectation(missionId: string): ReservationExpectation {
    const r = this.db.query("SELECT a.revision,p.binding,p.plan FROM ff8_graph_active_plan a JOIN ff8_graph_plans p ON p.mission=a.mission AND p.plan_id=a.plan_id WHERE a.mission=?").get(missionId) as { revision: number; binding: string; plan: string } | null;
    invariant(r, "no durable frozen plan binding"); const binding = JSON.parse(r.binding) as PlanBinding, plan = JSON.parse(r.plan) as PersistencePlan;
    const mission = this.db.query("SELECT revision FROM ff8_missions WHERE id=?").get(missionId) as { revision: number };
    return { bindingFingerprint: binding.fingerprint, planFingerprint: binding.planFingerprint, sidecarFingerprint: binding.sidecarFingerprint, knowledgeRevision: plan.knowledgeRevision, activePlanRevision: r.revision, missionRevision: mission.revision };
  }
  recordKnowledgeReceipt(authority: ControllerAuthority, receipt: ArtifactReceipt): void {
    authority = immutableCopy(authority); receipt = immutableCopy(receipt);
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      this.assertArtifactReceipt(authority.lease.missionId, receipt);
      const prior = this.db.query("SELECT document FROM ff8_graph_receipts WHERE mission=? AND commit_id=? AND artifact_id=?").get(authority.lease.missionId, receipt.commitId, receipt.artifactId) as { document: string } | null;
      invariant(!prior || prior.document === canonical(receipt), "immutable artifact receipt changed");
      if (prior) { this.assertAuthorizationEvent(authority.lease.missionId, `artifact_receipt:${receipt.commitId}:${receipt.artifactId}`, "artifact_receipt", receipt); return; }
      this.db.query("INSERT INTO ff8_graph_receipts VALUES(?,?,?,?)").run(authority.lease.missionId, receipt.commitId, receipt.artifactId, canonical(receipt));
      this.events.append(authority.lease.missionId, `artifact_receipt:${receipt.commitId}:${receipt.artifactId}`, "artifact_receipt", authority.now, receipt, receipt.producerUnitId);
    }).immediate();
  }
  /** The authenticated parent supplies semantics explicitly. A stored result's
   * bytes/function are resolved, never relabeled. A new derived fact needs known
   * content and an exact prior whole-unit attestation naming that fact. */
  recordArtifactBinding(authority: ControllerAuthority, request: ArtifactBindingRequest): ArtifactBinding {
    authority = immutableCopy(authority); request = immutableCopy(request);
    return this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      invariant(Object.keys(request).every(k => ["commitId", "artifactId", "functionId", "artifactKind", "sourceResultIds", "content"].includes(k)), "artifact binding authority/hash/revision must not come from payload", "auth");
      const parent = this.bootstrapParentAuthority(authority), doc = this.resolveArtifactBinding(authority.lease.missionId, request, parent.identity, parent.digest);
      const old = this.db.query("SELECT document FROM ff8_graph_artifact_bindings WHERE mission=? AND commit_id=? AND artifact_id=?").get(doc.missionId, doc.commitId, doc.artifactId) as { document: string } | null;
      invariant(!old || old.document === canonical(doc), "immutable artifact binding changed");
      if (old) return this.artifactBinding(doc.missionId, doc.commitId, doc.artifactId);
      const eventKey = `artifact_binding:${doc.commitId}:${doc.artifactId}`;
      this.db.query("INSERT INTO ff8_graph_artifact_bindings VALUES(?,?,?,?,?,?)").run(doc.missionId, doc.commitId, doc.artifactId, canonical(doc), fingerprint(doc), eventKey);
      this.events.append(doc.missionId, eventKey, "artifact_binding_verified", authority.now, doc, doc.producerUnitId);
      assertController(this.db, authority, doc.missionId); return this.artifactBinding(doc.missionId, doc.commitId, doc.artifactId);
    }).immediate();
  }
  private resolveArtifactBinding(missionId: string, request: ArtifactBindingRequest, parent: ParentAuthorityIdentity, parentDigest: string): ArtifactBinding {
    nonempty(request.artifactId); nonempty(request.functionId);
    invariant(["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"].includes(request.artifactKind), "explicit artifact type required", "schema");
    invariant(Array.isArray(request.sourceResultIds) && request.sourceResultIds.length > 0 && new Set(request.sourceResultIds).size === request.sourceResultIds.length, "exact nonempty artifact sources required");
    const row = this.db.query("SELECT unit_id,document FROM ff8_graph_commits WHERE mission=? AND commit_id=?").get(missionId, request.commitId) as { unit_id: string; document: string } | null;
    invariant(row, "artifact must reference final scientific COMMITTED identity");
    const commit = JSON.parse(row.document) as KnowledgeCommit;
    invariant(this.satisfies(missionId, row.unit_id, commit.publicationLevel), "artifact not bound to verified publication");
    const publication = this.db.query("SELECT token FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(missionId, row.unit_id) as { token: number };
    const validation = this.assertPublicationEvidence(missionId, row.unit_id, publication.token, commit);
    const manifest = this.publicationPolicy(missionId) ? this.assertMaterializationEvidence(missionId, row.unit_id, commit.resultIds, commit.evidence, commit.validatedFactIds, true)! : undefined;
    const sources = request.sourceResultIds.map(id => {
      invariant(commit.resultIds.includes(id), "artifact source not part of exact publication");
      const result = this.scientificResult(missionId, row.unit_id, id, publication.token);
      invariant(result.sub.functionId === request.functionId, "artifact source belongs to another canonical function");
      return { resultId: id, executionId: result.execution_id, subIntentId: result.sub.subIntentId, digest: result.digest };
    });
    const isResult = !!this.db.query("SELECT 1 FROM ff8_graph_results WHERE mission=? AND result_id=?").get(missionId, request.artifactId);
    let content: string;
    if (isResult) {
      invariant(commit.resultIds.includes(request.artifactId) && canonical(request.sourceResultIds) === canonical([request.artifactId]) && request.content === undefined, "stored result cannot be rematerialized/relabelled as a derived fact");
      if (manifest) {
        const retained = this.assertMaterializationScope(missionId, row.unit_id, manifest, true).get(request.artifactId);
        invariant(retained, "stored artifact requires exact retained source image", "scientific_block");
        content = retained.content; // raw SHA/record digest/author checked; never reserialize the scientific document
      } else content = this.scientificResult(missionId, row.unit_id, request.artifactId, publication.token).bytes; // historical mode unchanged
    } else {
      invariant(commit.validatedFactIds.includes(request.artifactId) && typeof request.content === "string" && request.content.length > 0 && validation.parentAttestationId, "derived fact requires known bytes and exact parent-attested fact identity", "scientific_block");
      content = request.content;
    }
    if (manifest) {
      const artifact = manifest.artifacts.find(a => a.artifactId === request.artifactId);
      invariant(artifact && artifact.functionId === request.functionId && artifact.artifactKind === request.artifactKind && canonical(artifact.sourceResultIds) === canonical(request.sourceResultIds)
        && artifact.materialization === (isResult ? "stored-result" : "parent-derived") && artifact.content === content, "artifact differs from exact parent-attested publication manifest", "scientific_block");
    }
    const parentAttestationId = validation.parentAttestationId ?? null;
    if (parentAttestationId) {
      const attestation = this.parentAttestation(missionId, parentAttestationId);
      invariant(attestation.unitId === row.unit_id && attestation.familyToken === publication.token && attestation.parentAuthorityDigest === parentDigest && attestation.evidenceDigest === fingerprint(commit.evidence)
        && canonical(attestation.resultIds) === canonical(commit.resultIds) && canonical(attestation.validatedFactIds) === canonical(commit.validatedFactIds), "artifact parent attestation tuple mismatch", "scientific_block");
    }
    return { version: 1, missionId, commitId: commit.commitId, producerUnitId: row.unit_id, artifactId: request.artifactId, functionId: request.functionId, moduleSha256: request.functionId.split(":")[0]!,
      artifactKind: request.artifactKind, artifactSha256: hash(Buffer.from(content, "utf8")), knowledgeRevision: commit.outputRevision, publicationLevel: commit.publicationLevel, validation: commit.publicationLevel === 2 ? "parent-validated" : "fixture-only",
      materialization: isResult ? "stored-result" : "parent-derived", content, sources, evidenceDigest: fingerprint(commit.evidence), parentAuthorityDigest: parentDigest, parentActorId: parent.actorId, parentAttestationId };
  }
  artifactBinding(missionId: string, commitId: string, artifactId: string): ArtifactBinding {
    const row = this.db.query("SELECT document,digest,event_key FROM ff8_graph_artifact_bindings WHERE mission=? AND commit_id=? AND artifact_id=?").get(missionId, commitId, artifactId) as { document: string; digest: string; event_key: string } | null;
    invariant(row, "missing authoritative artifact binding; legacy receipts are evidence only");
    const doc = JSON.parse(row.document) as ArtifactBinding;
    invariant(doc.version === 1 && doc.missionId === missionId && doc.commitId === commitId && doc.artifactId === artifactId && fingerprint(doc) === row.digest, "immutable artifact binding digest/scope mismatch", "schema");
    this.assertAuthorizationEvent(missionId, row.event_key, "artifact_binding_verified", doc);
    const parent = this.db.query("SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?").get(missionId) as { document: string; digest: string; event_key: string } | null;
    invariant(parent && parent.digest === doc.parentAuthorityDigest && fingerprint(JSON.parse(parent.document)) === parent.digest, "artifact parent authority mismatch", "auth");
    const identity = JSON.parse(parent.document) as ParentAuthorityIdentity;
    invariant(identity.version === 1 && identity.role === "parent" && identity.missionId === missionId && identity.actorId === doc.parentActorId && /^[a-f0-9]{64}$/.test(identity.sourceHash), "artifact parent authority identity mismatch", "auth");
    for (const key of ["principalId", "actorId", "controllerOwner", "source"] as const) nonempty(identity[key]);
    this.assertAuthorizationEvent(missionId, parent.event_key, "parent_authority_bootstrapped", identity);
    const resolved = this.resolveArtifactBinding(missionId, { commitId, artifactId, functionId: doc.functionId, artifactKind: doc.artifactKind as ArtifactBindingRequest["artifactKind"], sourceResultIds: doc.sources.map(s => s.resultId), ...(doc.materialization === "parent-derived" ? { content: doc.content } : {}) }, identity, parent.digest);
    invariant(canonical(resolved) === canonical(doc), "artifact binding tuple/provenance changed", "scientific_block"); return doc;
  }
  private assertArtifactReceipt(missionId: string, receipt: ArtifactReceipt): void {
    invariant(receipt.readbackStatus === "verified" && receipt.futurePrerequisiteEffect === "satisfies" && receipt.producerUnitId && this.satisfies(missionId, receipt.producerUnitId, receipt.publicationLevel), "receipt not bound to verified publication");
    const binding = this.artifactBinding(missionId, receipt.commitId, receipt.artifactId);
    const exact: ArtifactReceipt = { artifactId: binding.artifactId, artifactSha256: binding.artifactSha256, functionId: binding.functionId, moduleSha256: binding.moduleSha256, artifactKind: binding.artifactKind,
      knowledgeRevision: binding.knowledgeRevision, publicationLevel: binding.publicationLevel, validation: binding.validation, producerUnitId: binding.producerUnitId, commitId: binding.commitId, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
    invariant(canonical(receipt) === canonical(exact), "receipt differs from authoritative artifact tuple");
  }
  private hasArtifactReceipt(missionId: string, receipt: ArtifactReceipt): boolean {
    try {
      this.assertArtifactReceipt(missionId, receipt);
      const row = this.db.query("SELECT document FROM ff8_graph_receipts WHERE mission=? AND commit_id=? AND artifact_id=?").get(missionId, receipt.commitId, receipt.artifactId) as { document: string } | null;
      invariant(row && row.document === canonical(receipt), "missing durable artifact receipt");
      this.assertAuthorizationEvent(missionId, `artifact_receipt:${receipt.commitId}:${receipt.artifactId}`, "artifact_receipt", receipt); return true;
    } catch { return false; }
  }
  private assertBinding(missionId: string, unit: WorkUnit, expected?: ReservationExpectation): void {
    invariant(expected, "reservation requires explicit durable plan binding expectation");
    invariant(canonical(expected) === canonical(this.reservationExpectation(missionId)), "stale binding/knowledge/mission/active-plan revision");
    const r = this.db.query("SELECT p.plan,p.sidecar,p.binding FROM ff8_graph_active_plan a JOIN ff8_graph_plans p ON p.mission=a.mission AND p.plan_id=a.plan_id WHERE a.mission=?").get(missionId) as { plan: string; sidecar: string; binding: string };
    const plan = JSON.parse(r.plan) as PersistencePlan, sidecar = JSON.parse(r.sidecar) as PersistenceSidecar, binding = JSON.parse(r.binding) as PlanBinding, { state: _state, ...content } = unit;
    invariant(plan.fingerprint === contentDigest(plan) && sidecar.fingerprint === contentDigest(sidecar) && binding.fingerprint === contentDigest(binding) && binding.planFingerprint === plan.fingerprint && binding.sidecarFingerprint === sidecar.fingerprint && sidecar.planFingerprint === plan.fingerprint, "corrupt immutable binding/sidecar/plan digest", "schema");
    invariant(plan.selectedUnitIds.includes(unit.unitId) && sidecar.unitFingerprints[unit.unitId] === fingerprint(content) && unit.knowledgeRevision === expected.knowledgeRevision, "unit not selected/stale frozen unit content");
    const bytes = sidecar.envelopeBytesByUnit[unit.unitId]; integer(bytes);
    invariant(bytes <= plan.budgets.contextEnvelopeMaxUtf8Bytes && !sidecar.diagnostics.some(d => d.unitId === null || d.unitId === unit.unitId), "budget/diagnostic prevents admission");
    for (const p of unit.prerequisites) {
      if (p.dispensed) {
        const d = sidecar.dispensationById[p.id];
        invariant(d && d.reason === p.dispensationReason && d.policyVersion === sidecar.policyVersion && d.knowledgeRevision === unit.knowledgeRevision && d.source.trim() && /^[a-f0-9]{64}$/.test(d.sourceHash) && ["fixture-only", "parent-validated"].includes(d.validation) && (unit.requiredPublicationLevel !== 2 || d.validation === "parent-validated"), "invalid versioned prerequisite dispensation"); continue;
      }
      if (!["obligatory", "external_satisfied"].includes(p.kind)) continue;
      const requirement = sidecar.requirementById[p.id];
      invariant(requirement && requirement.artifactKind === p.artifactKind && requirement.publicationLevel === p.requiredPublicationLevel && /^[a-f0-9]{64}$/.test(requirement.artifactSha256), "missing typed artifact requirement");
      integer(requirement.minimumRevision); integer(requirement.maximumRevision); invariant(requirement.minimumRevision <= requirement.maximumRevision && requirement.functionId.startsWith(`${requirement.moduleSha256}:0x`) && /^[a-f0-9]{64}$/.test(requirement.moduleSha256) && ["fixture-only", "parent-validated"].includes(requirement.validation), "invalid artifact identity/revision requirement");
      const receipts = p.kind === "external_satisfied" ? [sidecar.externalReceiptById[p.id]] : (this.db.query("SELECT document FROM ff8_graph_receipts WHERE mission=?").all(missionId) as Array<{ document: string }>).map(r => JSON.parse(r.document) as ArtifactReceipt);
      invariant(receipts.some(receipt => receipt && receipt.producerUnitId === p.producerUnitId && receipt.readbackStatus === "verified" && receipt.futurePrerequisiteEffect === "satisfies" && receipt.artifactId === requirement.artifactId && receipt.artifactSha256 === requirement.artifactSha256 && receipt.functionId === requirement.functionId && receipt.moduleSha256 === requirement.moduleSha256 && receipt.artifactKind === requirement.artifactKind && receipt.knowledgeRevision >= requirement.minimumRevision && receipt.knowledgeRevision <= requirement.maximumRevision && receipt.publicationLevel >= requirement.publicationLevel && [1, 2].includes(receipt.publicationLevel) && (receipt.validation === "parent-validated" || (receipt.validation === "fixture-only" && requirement.validation === "fixture-only")) && this.hasArtifactReceipt(missionId, receipt)), "stale/missing artifact receipt cannot satisfy prerequisite");
    }
  }
  transition(authority: ControllerAuthority, unitId: string, state: WorkUnitState, reason: string): void {
    nonempty(reason);
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      invariant(!["RESERVED", "RUNNING", "VALIDATING", "COMMITTED", "QUARANTINED"].includes(state), "use fenced reservation/result/publication operations");
      const lease = this.leases.get(authority.lease.missionId, unitId);
      invariant(!lease || lease.state === "released" || state === "STOP_PENDING", "active family cannot be released by state change");
      if (state === "READY") { this.assertNoRetainedPublication(authority.lease.missionId, unitId); this.assertPrerequisites(authority.lease.missionId, this.unit(authority.lease.missionId, unitId)); }
      this.change(authority, unitId, state, reason);
    }).immediate();
  }
  reserve(authority: ControllerAuthority, unitId: string, ttlEvents = 100, expected?: ReservationExpectation): UnitLease {
    this.assertWorkCurrent(authority.lease.missionId, unitId);
    return this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      this.assertNoRetainedPublication(authority.lease.missionId, unitId);
      const u = this.unit(authority.lease.missionId, unitId); invariant(u.state === "READY", "only READY units can be reserved"); this.assertBinding(authority.lease.missionId, u, expected); this.assertPrerequisites(authority.lease.missionId, u);
      const projected = this.assertNextContextReservation(authority, unitId);
      const lease = this.leases.reserve(authority, unitId, [...u.ownedFunctionIds.map(id => `fn:${id}`), ...u.conflicts.map(c => c.resourceKey)], ttlEvents, expected!);
      this.change(authority, unitId, "RESERVED", "canonical family ownership acquired");
      if (projected) { this.assertNextContextReservation(authority, unitId); this.leases.assert(lease, authority); } this.assertWorkCurrent(authority.lease.missionId, unitId); return lease;
    }).immediate();
  }
  tick(authority: ControllerAuthority, key: string, count = 1): void {
    integer(count, 1); invariant(count <= 10000, "tick batch bound exceeded");
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      for (let i = 0; i < count; i++) this.events.append(authority.lease.missionId, `tick:${key}:${i}`, "clock_tick", authority.now, { index: i });
    }).immediate();
  }
  expire(authority: ControllerAuthority, unitId: string): UnitLease {
    return this.db.transaction(() => {
      const lease = this.leases.get(authority.lease.missionId, unitId); invariant(lease, "no family lease");
      invariant(lease.expiresAtEvent <= this.events.cursor(lease.missionId).sequence, "family lease has not expired");
      const next = this.leases.quarantine(authority, lease, "heartbeat expired; execution may still be active");
      const state = this.unit(lease.missionId, unitId).state;
      if (state === "VALIDATING") this.change(authority, unitId, "BLOCKED", "expired validation fence; publication quarantined");
      else if (state !== "QUARANTINED" && state !== "BLOCKED") this.change(authority, unitId, "QUARANTINED", "expiry does not prove worker termination"); return next;
    }).immediate();
  }
  private nextContextOrigin(missionId: string): Readonly<{ missionId: string; identity: string; payloadBytes: string; run: GraphRun; policy?: NextContextPolicyV1 }> | undefined {
    // Always reread current origin rows before considering a parse hit. Including
    // the closed key namespace also rejects an origin whose kind was altered.
    const origins = this.db.query("SELECT mission,sequence,time,key,kind,unit_id,payload,hex(CAST(payload AS BLOB)) AS payload_hex,digest FROM ff8_events WHERE mission=? AND (kind IN ('l8.graph2.preparing','l8.graph.preparing') OR key GLOB 'l8.graph2.prepare:*' OR key GLOB 'l8.graph.prepare:*') ORDER BY sequence LIMIT 2").all(missionId) as Array<{ mission: string; sequence: number; time: number; key: string; kind: string; unit_id: string | null; payload: string; payload_hex: string; digest: string }>;
    invariant(origins.length <= 1, "multiple next context origins", "schema");
    if (!origins.length) {
      // A genuinely legacy OWN mission may have no graph preparation. A missing
      // known/anchored origin must never turn an existing graph into legacy.
      const owned = this.db.query("SELECT 1 FROM ff8_events WHERE mission=? AND (kind GLOB 'l8.graph.*' OR kind GLOB 'l8.graph2.*' OR kind GLOB 'next_context_*') LIMIT 1").get(missionId);
      const approved = this.db.query("SELECT 1 FROM ff8_graph_next_context_approvals WHERE mission=? LIMIT 1").get(missionId);
      const hasMissions = this.db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ff8_missions'").get();
      const snapshot = hasMissions ? this.db.query("SELECT snapshot FROM ff8_missions WHERE id=?").get(missionId) as { snapshot: string } | null : null;
      const cycles = snapshot ? (JSON.parse(snapshot.snapshot) as Snapshot).cycles : [];
      const anchored = Array.isArray(cycles) && cycles.some(c => c && Object.hasOwn(c, "graph"));
      invariant(this.nextContextOriginCache?.missionId !== missionId && !owned && !approved && !anchored, "missing next context origin; no legacy fallback", "schema"); return;
    }
    const origin = origins[0]!, cursor = this.events.cursor(missionId);
    invariant(origin.mission === missionId && Number.isSafeInteger(origin.sequence) && origin.sequence >= 1 && Number.isSafeInteger(cursor.sequence) && origin.sequence <= cursor.sequence
      && Number.isSafeInteger(origin.time) && origin.time >= 0 && Number.isSafeInteger(cursor.time) && origin.time <= cursor.time && origin.unit_id === null && typeof origin.payload === "string"
      && typeof origin.payload_hex === "string" && /^(?:[0-9A-F]{2})+$/.test(origin.payload_hex)
      && ["l8.graph2.preparing", "l8.graph.preparing"].includes(origin.kind), "invalid next context origin identity/sequence/time/attribution", "schema");
    const payload = graphKeys(JSON.parse(origin.payload), ["version", "run"], ["publicationPolicy", "nextContextPolicy"]);
    invariant(origin.digest === fingerprint({ kind: origin.kind, time: origin.time, payload, unitId: origin.unit_id }), "next context origin digest mismatch", "schema");
    const identity = canonical({ missionId: origin.mission, sequence: origin.sequence, time: origin.time, key: origin.key, kind: origin.kind, unitId: origin.unit_id, digest: origin.digest });
    const old = this.nextContextOriginCache;
    if (old?.missionId === missionId && old.identity === identity && old.payloadBytes === origin.payload_hex) return old;
    const run = parseGraphRun(payload.run), v2 = run.version === "l8-graph-run-v2";
    invariant(run.missionId === missionId && payload.version === (v2 ? "l8-graph-preparing-v2" : "l8-graph-preparing-v1")
      && origin.kind === (v2 ? "l8.graph2.preparing" : "l8.graph.preparing") && origin.key === `${v2 ? "l8.graph2" : "l8.graph"}.prepare:${run.cycle}`, "next context origin attribution/version/key mismatch", "schema");
    invariant(v2 || !Object.hasOwn(payload, "publicationPolicy"), "historical run refuses prospective publication policy", "schema");
    const policy = Object.hasOwn(payload, "nextContextPolicy") ? parseNextContextPolicyV1(payload.nextContextPolicy) : undefined;
    invariant(!policy || (v2 && Object.hasOwn(payload, "publicationPolicy")), "historical run refuses next context policy", "schema");
    if (policy) assertNextContextRunScopesV1(policy, run);
    for (const grant of policy?.grants ?? []) {
      const producer = run.prepared.planning.units.find(u => u.unitId === grant.producerUnitId), consumer = run.prepared.planning.units.find(u => u.unitId === grant.consumerUnitId);
      invariant(producer && consumer && run.prepared.planning.plan.selectedUnitIds.includes(producer.unitId) && run.prepared.planning.plan.selectedUnitIds.includes(consumer.unitId)
        && producer.ownedFunctionIds.includes(grant.producerFunctionId) && consumer.ownedFunctionIds.includes(grant.consumerFunctionId)
        && grant.roles.every(role => consumer.subIntents.some(s => s.functionId === grant.consumerFunctionId && s.role === role))
        && grant.knowledgeRevision === producer.knowledgeRevision + 1 && grant.publicationLevel >= producer.requiredPublicationLevel, "grant differs from exact selected producer/consumer/revision/roles", "auth");
    }
    // All values in this entry are pure derivations of the exact source bytes.
    // immutableCopy prevents a returned object from mutating a future parse hit.
    const parsed = immutableCopy({ missionId, identity, payloadBytes: origin.payload_hex, run, ...(policy ? { policy } : {}) });
    this.nextContextOriginCache = parsed; return parsed;
  }
  private nextContextRun(missionId: string): GraphRunV2 {
    const run = this.nextContextOrigin(missionId)?.run;
    invariant(run && run.version === "l8-graph-run-v2", "next context requires original prospective preparation", "schema"); return run;
  }
  nextContextPolicy(missionId: string): NextContextPolicyV1 | undefined {
    const origin = this.nextContextOrigin(missionId), policy = origin?.policy; if (!policy) return;
    // These are CURRENT authorization reads, never part of the parse cache.
    const publication = this.publicationPolicy(missionId);
    invariant(publication && publication.ownerActorId === policy.ownerActorId, "next context requires matching prospective publication parent", "auth");
    const parent = this.db.query("SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?").get(missionId) as { document: string; digest: string; event_key: string } | null;
    invariant(parent && fingerprint(JSON.parse(parent.document)) === parent.digest && (JSON.parse(parent.document) as ParentAuthorityIdentity).actorId === policy.ownerActorId,
      "next context policy lacks original verified parent record", "auth");
    this.assertAuthorizationEvent(missionId, parent.event_key, "parent_authority_bootstrapped", JSON.parse(parent.document), null);
    return structuredClone(policy);
  }
  assertNextContextPolicyOwner(authority: ControllerAuthority, policy: NextContextPolicyV1): void {
    assertController(this.db, authority, authority.lease.missionId);
    invariant(this.bootstrapParentAuthority(authority).identity.actorId === parseNextContextPolicyV1(policy).ownerActorId, "next context policy owner is not the verified parent", "auth");
    assertController(this.db, authority, authority.lease.missionId);
  }
  /** A preflight hint only. It grants nothing; freeze/pin/dispatch repeat the
   * authoritative checks. Invalid sources cannot monopolize a scheduling slot. */
  nextContextSourcesAvailable(missionId: string, unitId: string): boolean {
    const policy = this.nextContextPolicy(missionId); if (!policy?.grants.some(g => g.consumerUnitId === unitId)) return true;
    let pending = false;
    for (const grant of policy.grants.filter(g => g.consumerUnitId === unitId)) {
      const approval = this.db.query("SELECT approval_key,revocation_event FROM ff8_graph_next_context_approvals WHERE mission=? AND grant_id=?").get(missionId, grant.id) as { approval_key: string; revocation_event: string | null } | null;
      const source = this.db.query("SELECT 1 FROM ff8_graph_commits WHERE mission=? AND unit_id=?").get(missionId, grant.producerUnitId);
      if (!source) {
        const producer = this.unit(missionId, grant.producerUnitId), lease = this.leases.get(missionId, grant.producerUnitId);
        invariant(!approval && ["PENDING", "BLOCKED", "READY", "RESERVED", "RUNNING", "VALIDATING", "RETRYABLE"].includes(producer.state), "next context source failed/fenced or lost its private commit", "scientific_block");
        invariant(lease?.state !== "quarantined", "next context producer fence quarantined before publication", "auth");
        if (lease?.state === "active") this.leases.assert(lease);
        pending = true; continue;
      }
      invariant(this.satisfies(missionId, grant.producerUnitId, grant.publicationLevel), "next context committed source is currently unauthorized/revoked/corrupt", "scientific_block");
      if (!approval) {
        const events = this.events.read(missionId);
        invariant(!events.some(e => e.kind === "next_context_approved" && (e.payload as { grantId?: unknown } | null)?.grantId === grant.id), "public approval event without private authorization row", "auth");
        invariant(!events.some(e => e.kind === "next_context_projection_frozen" && e.unitId === unitId), "frozen context lost its private approval", "auth");
        const manifest = this.publicationMaterialization(missionId, grant.producerUnitId); invariant(manifest, "committed next context source lost its publication manifest", "schema");
        const artifacts = manifest.artifacts.filter(a => a.functionId === grant.producerFunctionId && a.artifactKind === grant.artifactKind);
        invariant(artifacts.length === 1, "published next context source absent/ambiguous for exact grant", "scientific_block"); pending = true; continue;
      }
      invariant(!approval.revocation_event, "next context consumer approval revoked", "auth");
    }
    if (pending) return false; // only an ordinary, still-unpublished/unapproved source waits
    this.currentNextContextEntries(missionId, unitId, { missionId, runFingerprint: this.nextContextRun(missionId).fingerprint, unitId, familyToken: 1, policy, policySha256: fingerprint(policy) }); return true;
  }
  private assertNextContextReservation(authority: ControllerAuthority, unitId: string): boolean {
    if (this.nativePreparing?.expected.missionId === authority.lease.missionId && this.nativePreparing.expected.unitId === unitId) {
      this.nativeRuntimeHost(authority, this.nativePreparing.expected); return false;
    }
    const policy = this.nextContextPolicy(authority.lease.missionId); if (!policy?.grants.some(g => g.consumerUnitId === unitId)) return false;
    assertController(this.db, authority, authority.lease.missionId); this.assertNextContextPolicyOwner(authority, policy);
    invariant(this.nextContextSourcesAvailable(authority.lease.missionId, unitId), "next context still awaits publication/private approval; reservation forbidden", "auth");
    assertController(this.db, authority, authority.lease.missionId); return true;
  }
  /** Historical image ONLY. No current source authorization or FS availability
   * is inferred from its presence, event digest, paths or approvedForBlind. */
  nextContextProjection(missionId: string, unitId: string, familyToken: number): NextContextProjectionV1 | undefined {
    const event = this.events.read(missionId).find(e => e.key === `next_context_projection:${unitId}:${familyToken}`);
    if (!event) return;
    const image = parseNextContextProjectionV1(event.payload), policy = this.nextContextPolicy(missionId), run = this.nextContextRun(missionId);
    invariant(policy && canonical(policy) === canonical(image.policy) && image.missionId === missionId && image.unitId === unitId && image.familyToken === familyToken
      && image.runFingerprint === run.fingerprint && image.planFingerprint === run.prepared.planning.plan.fingerprint && image.bindingFingerprint === run.prepared.planning.binding.fingerprint
      && image.baseKnowledgeRevision === run.prepared.planning.units.find(u => u.unitId === unitId)?.knowledgeRevision, "historical projection scope/policy changed", "schema");
    this.assertAuthorizationEvent(missionId, event.key, "next_context_projection_frozen", image, unitId); return image;
  }
  private resolveNextContextApproval(missionId: string, request: NextContextApprovalRequestV1, parent: { identity: ParentAuthorityIdentity; digest: string }): NextContextApprovalV1 {
    const policy = this.nextContextPolicy(missionId), run = this.nextContextRun(missionId), grant = policy?.grants.find(g => g.id === request.grantId);
    invariant(policy && grant && parent.identity.actorId === policy.ownerActorId && parent.identity.missionId === missionId, "next context approval requires actual scoped parent", "auth");
    invariant(request.producerUnitId === grant.producerUnitId && request.producerFunctionId === grant.producerFunctionId && request.consumerUnitId === grant.consumerUnitId
      && request.consumerFunctionId === grant.consumerFunctionId && request.knowledgeRevision === grant.knowledgeRevision && request.publicationLevel === grant.publicationLevel
      && canonical(request.roles) === canonical(grant.roles), "approval tuple/roles differ from exact prospective scope", "auth");
    const expectation = this.reservationExpectation(missionId);
    invariant(expectation.bindingFingerprint === run.prepared.planning.binding.fingerprint && expectation.planFingerprint === run.prepared.planning.plan.fingerprint
      && expectation.missionRevision === run.missionRevision && expectation.knowledgeRevision === run.prepared.snapshot.knowledgeRevision, "approval targets stale run/plan/binding/revision", "auth");
    const row = this.db.query("SELECT unit_id,document FROM ff8_graph_commits WHERE mission=? AND commit_id=?").get(missionId, request.commitId) as { unit_id: string; document: string } | null;
    invariant(row && row.unit_id === grant.producerUnitId, "approval source requires exact final COMMITTED identity", "scientific_block");
    const commit = JSON.parse(row.document) as KnowledgeCommit, manifest = this.publicationMaterialization(missionId, grant.producerUnitId);
    invariant(manifest && this.satisfies(missionId, grant.producerUnitId, grant.publicationLevel) && commit.outputRevision === grant.knowledgeRevision && commit.publicationLevel === grant.publicationLevel,
      "approval source lacks exact verified publication/readback", "scientific_block");
    const artifact = manifest.artifacts.find(a => a.artifactId === request.artifactId), binding = this.artifactBinding(missionId, request.commitId, request.artifactId);
    invariant(artifact && artifact.functionId === grant.producerFunctionId && artifact.artifactKind === grant.artifactKind && binding.producerUnitId === grant.producerUnitId
      && binding.functionId === grant.producerFunctionId && binding.artifactKind === grant.artifactKind && binding.knowledgeRevision === request.knowledgeRevision && binding.publicationLevel === request.publicationLevel
      && binding.content === artifact.content && binding.artifactSha256 === request.artifactSha256 && hash(binding.content) === request.artifactSha256
      && binding.parentActorId === parent.identity.actorId && binding.parentAuthorityDigest === parent.digest && binding.parentAttestationId,
      "approval differs from exact raw parent-attested binding", "scientific_block");
    const attestation = this.parentAttestation(missionId, binding.parentAttestationId);
    invariant(attestation.parentActorId === parent.identity.actorId && attestation.parentAuthorityDigest === parent.digest, "approval source attestation parent mismatch", "auth");
    const body = { ...request, version: "rms-next-context-approval-v1" as const, missionId, runFingerprint: run.fingerprint, planFingerprint: run.prepared.planning.plan.fingerprint,
      bindingFingerprint: run.prepared.planning.binding.fingerprint, policySha256: fingerprint(policy), artifactKind: binding.artifactKind, sourceBindingSha256: fingerprint(binding), publicationManifestSha256: fingerprint(manifest),
      parentAttestationId: attestation.attestationId, parentAttestationSha256: fingerprint(attestation), parentActorId: parent.identity.actorId, parentAuthorityDigest: parent.digest };
    return parseNextContextApprovalV1({ ...body, approvalId: fingerprint(body) });
  }
  /** Private row + exact event, not an imported event or a self-hashed document.
   * Historical reads deliberately do not reauthorize or require today's files. */
  nextContextApproval(missionId: string, approvalKey: string): NextContextApprovalV1 {
    const row = this.db.query("SELECT grant_id,document,digest,event_key FROM ff8_graph_next_context_approvals WHERE mission=? AND approval_key=?").get(missionId, approvalKey) as { grant_id: string; document: string; digest: string; event_key: string } | null;
    invariant(row, "missing private next context approval; public events are evidence only", "auth");
    const doc = parseNextContextApprovalV1(JSON.parse(row.document));
    invariant(doc.missionId === missionId && doc.approvalKey === approvalKey && doc.grantId === row.grant_id && row.document === canonical(doc) && row.digest === fingerprint(doc)
      && row.event_key === `next_context_approval:${doc.approvalId}`, "private approval digest/scope changed", "schema");
    this.assertAuthorizationEvent(missionId, row.event_key, "next_context_approved", doc, doc.consumerUnitId);
    const parent = this.db.query("SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?").get(missionId) as { document: string; digest: string; event_key: string } | null;
    invariant(parent && parent.digest === doc.parentAuthorityDigest && fingerprint(JSON.parse(parent.document)) === parent.digest
      && (JSON.parse(parent.document) as ParentAuthorityIdentity).actorId === doc.parentActorId, "approval original private parent record changed", "auth");
    this.assertAuthorizationEvent(missionId, parent.event_key, "parent_authority_bootstrapped", JSON.parse(parent.document), null); return doc;
  }
  approveNextContextArtifact(authority: ControllerAuthority, rawRequest: NextContextApprovalRequestV1): NextContextApprovalV1 {
    authority = immutableCopy(authority); const request = parseNextContextApprovalRequestV1(immutableCopy(rawRequest));
    return this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const parent = this.bootstrapParentAuthority(authority), doc = this.resolveNextContextApproval(authority.lease.missionId, request, parent);
      const old = this.db.query("SELECT approval_key,document,digest,revocation_event FROM ff8_graph_next_context_approvals WHERE mission=? AND (approval_key=? OR grant_id=?)").get(doc.missionId, doc.approvalKey, doc.grantId) as { approval_key: string; document: string; digest: string; revocation_event: string | null } | null;
      if (old) {
        invariant(!old.revocation_event && old.approval_key === doc.approvalKey && old.document === canonical(doc) && old.digest === fingerprint(doc), "immutable/revoked exact approval cannot be changed or re-keyed", "auth");
        const retained = this.nextContextApproval(doc.missionId, doc.approvalKey);
        invariant(canonical(this.resolveNextContextApproval(doc.missionId, request, this.bootstrapParentAuthority(authority))) === canonical(retained), "approval retry source/parent changed", "auth");
        assertController(this.db, authority, doc.missionId); return retained;
      }
      const eventKey = `next_context_approval:${doc.approvalId}`;
      invariant(!this.events.read(doc.missionId).some(e => e.key === eventKey), "orphan public approval event cannot be promoted into authority", "auth");
      this.db.query("INSERT INTO ff8_graph_next_context_approvals VALUES(?,?,?,?,?,?,NULL)").run(doc.missionId, doc.approvalKey, doc.grantId, canonical(doc), fingerprint(doc), eventKey);
      this.events.append(doc.missionId, eventKey, "next_context_approved", authority.now, doc, doc.consumerUnitId);
      invariant(canonical(this.resolveNextContextApproval(doc.missionId, request, this.bootstrapParentAuthority(authority))) === canonical(doc), "approval source/parent changed during append", "auth");
      const current = this.db.query("SELECT revocation_event FROM ff8_graph_next_context_approvals WHERE mission=? AND approval_key=?").get(doc.missionId, doc.approvalKey) as { revocation_event: string | null } | null;
      invariant(current && !current.revocation_event, "approval absent/revoked during append", "auth");
      assertController(this.db, authority, doc.missionId); return this.nextContextApproval(doc.missionId, doc.approvalKey);
    }).immediate();
  }
  revokeNextContextApproval(authority: ControllerAuthority, approvalKey: string, reason: string): void {
    authority = immutableCopy(authority); nonempty(approvalKey); nonempty(reason);
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const parent = this.bootstrapParentAuthority(authority), doc = this.nextContextApproval(authority.lease.missionId, approvalKey), policy = this.nextContextPolicy(doc.missionId);
      invariant(policy?.ownerActorId === parent.identity.actorId && doc.parentActorId === parent.identity.actorId && doc.parentAuthorityDigest === parent.digest, "only original verified parent may revoke approval", "auth");
      const row = this.db.query("SELECT revocation_event FROM ff8_graph_next_context_approvals WHERE mission=? AND approval_key=?").get(doc.missionId, approvalKey) as { revocation_event: string | null };
      const key = `next_context_approval_revoked:${doc.approvalId}`, payload = { approvalKey, approvalId: doc.approvalId, parentActorId: parent.identity.actorId, parentAuthorityDigest: parent.digest, reason };
      if (row.revocation_event) { invariant(row.revocation_event === key, "approval revocation reference changed", "schema"); this.assertAuthorizationEvent(doc.missionId, key, "next_context_approval_revoked", payload, doc.consumerUnitId); return; }
      this.events.append(doc.missionId, key, "next_context_approval_revoked", authority.now, payload, doc.consumerUnitId);
      invariant(this.db.query("UPDATE ff8_graph_next_context_approvals SET revocation_event=? WHERE mission=? AND approval_key=? AND revocation_event IS NULL").run(key, doc.missionId, approvalKey).changes === 1, "approval revocation CAS changed", "auth");
      invariant(this.bootstrapParentAuthority(authority).digest === doc.parentAuthorityDigest, "parent changed during approval revocation", "auth"); assertController(this.db, authority, doc.missionId);
    }).immediate();
  }
  private currentNextContextEntries(missionId: string, unitId: string, scope: Pick<NextContextProjectionV1, "missionId" | "runFingerprint" | "unitId" | "familyToken" | "policy" | "policySha256">): NextContextProjectionV1["entries"] {
    return scope.policy.grants.filter(g => g.consumerUnitId === unitId).map(grant => {
      const row = this.db.query("SELECT approval_key,revocation_event FROM ff8_graph_next_context_approvals WHERE mission=? AND grant_id=?").get(missionId, grant.id) as { approval_key: string; revocation_event: string | null } | null;
      invariant(row && !row.revocation_event, "required private next context approval absent/revoked", "auth");
      const approval = this.nextContextApproval(missionId, row.approval_key), parent = this.db.query("SELECT document,digest FROM ff8_graph_parent_authorities WHERE mission=?").get(missionId) as { document: string; digest: string };
      const request = parseNextContextApprovalRequestV1({ approvalKey: approval.approvalKey, grantId: approval.grantId, producerUnitId: approval.producerUnitId, producerFunctionId: approval.producerFunctionId,
        commitId: approval.commitId, artifactId: approval.artifactId, artifactSha256: approval.artifactSha256, knowledgeRevision: approval.knowledgeRevision, publicationLevel: approval.publicationLevel,
        consumerUnitId: approval.consumerUnitId, consumerFunctionId: approval.consumerFunctionId, roles: approval.roles });
      invariant(canonical(this.resolveNextContextApproval(missionId, request, { identity: JSON.parse(parent.document) as ParentAuthorityIdentity, digest: parent.digest })) === canonical(approval), "approved source images/digests/parent/grant changed", "auth");
      const binding = this.artifactBinding(missionId, approval.commitId, approval.artifactId);
      return { grantId: grant.id, roles: structuredClone(grant.roles), binding, approval, file: nextContextFileV1(scope, grant, binding, approval) };
    });
  }
  /** CURRENT effect gate, not historical parsing. A private exact approval,
   * publication attestation AND prospective consumer scope are all required. */
  assertNextContextCurrent(authority: ControllerAuthority, lease: UnitLease, raw?: NextContextProjectionV1): void {
    this.assertWorkCurrent(lease.missionId, lease.unitId);
    assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
    const policy = this.nextContextPolicy(lease.missionId); if (!policy?.grants.some(g => g.consumerUnitId === lease.unitId)) { invariant(!raw, "unapproved context image", "auth"); return; }
    const image = raw === undefined ? this.nextContextProjection(lease.missionId, lease.unitId, lease.token) : parseNextContextProjectionV1(raw);
    invariant(image, "required next context image absent", "auth");
    const retained = this.nextContextProjection(lease.missionId, lease.unitId, lease.token);
    invariant(!retained || canonical(retained) === canonical(image), "frozen next context image cannot be replaced", "auth");
    const run = this.nextContextRun(lease.missionId), parent = this.bootstrapParentAuthority(authority), current = this.familyPublicationContext(lease);
    invariant(parent.identity.actorId === policy.ownerActorId && image.missionId === lease.missionId && image.unitId === lease.unitId && image.familyToken === lease.token && image.controllerToken === authority.lease.token
      && image.runFingerprint === run.fingerprint && image.policySha256 === fingerprint(policy) && canonical(image.policy) === canonical(policy)
      && image.bindingFingerprint === current.bindingFingerprint && image.planFingerprint === current.plan.fingerprint && image.baseKnowledgeRevision === current.plan.knowledgeRevision,
      "next context parent/current consumer fence/policy/binding changed", "auth");
    invariant(canonical(nextContextRootIdentityV1(policy)) === canonical(image.rootIdentity), "next context frozen parent root changed", "auth");
    invariant(canonical(image.entries) === canonical(this.currentNextContextEntries(lease.missionId, lease.unitId, image)), "next context frozen source tuple/authorization changed", "scientific_block");
    assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
  }
  freezeNextContextProjection(authority: ControllerAuthority, lease: UnitLease): NextContextProjectionV1 | undefined {
    authority = immutableCopy(authority); lease = immutableCopy(lease);
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const policy = this.nextContextPolicy(lease.missionId); if (!policy?.grants.some(g => g.consumerUnitId === lease.unitId)) return;
      const old = this.nextContextProjection(lease.missionId, lease.unitId, lease.token);
      if (old) { this.assertNextContextCurrent(authority, lease, old); return old; }
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_input_pins WHERE mission=? AND unit_id=? AND token=?").get(lease.missionId, lease.unitId, lease.token)
        && !this.db.query("SELECT 1 FROM ff8_graph_outbox WHERE mission=? AND unit_id=? AND token=?").get(lease.missionId, lease.unitId, lease.token), "old inputs/outbox cannot be retroactively projected", "auth");
      const run = this.nextContextRun(lease.missionId), unit = this.unit(lease.missionId, lease.unitId);
      const scope = { version: "rms-next-context-projection-v1" as const, missionId: lease.missionId, runFingerprint: run.fingerprint, planFingerprint: run.prepared.planning.plan.fingerprint,
        bindingFingerprint: run.prepared.planning.binding.fingerprint, unitId: lease.unitId, familyToken: lease.token, controllerToken: authority.lease.token, baseKnowledgeRevision: unit.knowledgeRevision,
        rootIdentity: nextContextRootIdentityV1(policy), policy, policySha256: fingerprint(policy) };
      const body = { ...scope, entries: this.currentNextContextEntries(lease.missionId, lease.unitId, scope) }, image = parseNextContextProjectionV1({ ...body, fingerprint: fingerprint(body) });
      this.assertNextContextCurrent(authority, lease, image);
      this.events.append(lease.missionId, `next_context_projection:${lease.unitId}:${lease.token}`, "next_context_projection_frozen", authority.now, image, lease.unitId);
      this.assertNextContextCurrent(authority, lease, image); return image;
    }).immediate();
  }
  nextContextMaterialized(image: NextContextProjectionV1): boolean {
    const key = `next_context_materialized:${image.unitId}:${image.familyToken}`, event = this.events.read(image.missionId).find(e => e.key === key);
    if (!event) return false;
    this.assertAuthorizationEvent(image.missionId, key, "next_context_materialized", { version: "rms-next-context-materialized-v1", projectionFingerprint: image.fingerprint }, image.unitId); return true;
  }
  recordNextContextMaterialized(authority: ControllerAuthority, lease: UnitLease, image: NextContextProjectionV1): void {
    this.db.transaction(() => {
      this.assertNextContextCurrent(authority, lease, image);
      for (const grant of image.policy.grants.filter(g => g.consumerUnitId === image.unitId)) for (const role of grant.roles) verifyNextContextRoleFilesV1(image, grant.consumerFunctionId, role);
      if (!this.nextContextMaterialized(image)) this.events.append(image.missionId, `next_context_materialized:${image.unitId}:${image.familyToken}`, "next_context_materialized", authority.now,
        { version: "rms-next-context-materialized-v1", projectionFingerprint: image.fingerprint }, image.unitId);
      this.assertNextContextCurrent(authority, lease, image);
    }).immediate();
  }
  private assertNextContextInputs(authority: ControllerAuthority, lease: UnitLease, sub: WorkUnit["subIntents"][number], inputs: InputBundle, current: boolean): void {
    if (this.nativePreparing?.expected.missionId === lease.missionId && this.nativePreparing.expected.unitId === lease.unitId) {
      // A historical pin check has reservation metadata, not a live authority.
      // Its exact role view is the independently bound source already captured
      // by this preparation; current preparation checks still verify the host.
      if (current) this.nativeRuntimeHost(authority, this.nativePreparing.expected);
      invariant(canonical(inputs) === canonical(nativeFrozenGraphInputsV1(this.nativePreparing.bound, sub)), "native frozen inputs differ from independently derived role view", "auth");
      return;
    }
    const native = this.db.query("SELECT n.document,n.digest FROM ff8_graph_native_operations n JOIN ff8_graph_outbox o ON o.execution_id=n.execution_id WHERE n.mission=? AND n.unit_id=? AND o.sub_intent=? AND o.token=?")
      .get(lease.missionId, lease.unitId, sub.subIntentId, lease.token) as { document: string; digest: string } | null;
    if (native) {
      invariant(fingerprint(JSON.parse(native.document)) === native.digest, "native frozen input authority lost", "schema");
      if (!current) {
        // Pure durable/source integrity: no temporal host, fresh permission or
        // authority reconstructed from reserve. The original independent input
        // pin/event is checked by assertAdmissionInputs around this branch.
        assertNativeRuntimeIntegrityV1(this.db);
        const op = JSON.parse(native.document) as { run: BoundDocument<GraphRunV3>; binding: BoundDocument<NativeRuntimeBindingV2>;
          expected: NativeRuntimeExpectedV1; admissionDigest: string };
        const parsed = parseGraphRunV3(Buffer.from(op.run.utf8, "utf8"));
        invariant(parsed.ok && canonical(parsed.value.document) === canonical(op.run), "native historical run image corrupt", "schema");
        const origin = parseExecutionEnvelopeV1(Buffer.from(parsed.value.run.envelope.utf8, "utf8"));
        invariant(origin.ok, "native historical source envelope corrupt", "schema");
        const envelope = origin.value.envelope, binding = readRuntimeDocumentV1(op.binding), planning = readRuntimeDocumentV1<PlannerResult>(envelope.planning);
        const original = planning.units.flatMap(u => u.subIntents).find(s => s.subIntentId === sub.subIntentId);
        invariant((sub.role === "A" || sub.role === "B") && original && canonical(original) === canonical(sub)
          && canonical(binding.envelopeRef) === canonical(parsed.value.run.envelope.ref)
          && canonical(binding.planRef) === canonical(makeBoundDocumentV1("native-source-planning", planning).ref)
          && canonical(binding.snapshotRef) === canonical(makeBoundDocumentV1("native-source-snapshot", readRuntimeDocumentV1(envelope.fullGraphSnapshot)).ref),
          "native historical role/plan/snapshot source changed", "schema");
        const retained = this.outbox(op.expected.executionId);
        invariant(retained && retained.digest === op.admissionDigest && retained.sub_intent === sub.subIntentId
          && retained.mission === lease.missionId && retained.unit_id === lease.unitId && retained.token === lease.token,
          "native historical admission source detached", "schema");
        const body = JSON.parse(retained.body) as Admission, template = readRuntimeDocumentV1<GraphExecutionTemplate>(envelope.admissionSource.executionTemplate), spec = readRuntimeDocumentV1<GraphExecutionSource>(envelope.admissionSource.executionSourceSpec);
        const dossier = body.command.dossier as Record<string, unknown> | undefined;
        invariant(dossier && body.role === sub.role && canonical(body.command.model) === canonical(spec.models[sub.role])
          && body.command.profile === template.settings.profiles[sub.role]
          && canonical(inputs) === canonical(admissionProjection(dossier.inputs, dossier.version)), "native historical role/model/input image changed", "schema");
        return;
      }
      const op = JSON.parse(native.document), expected: NativeRuntimeExpectedV1 = { ...op.expected, purpose: "effect" };
      const host = this.nativeRuntimeHost(authority, expected), run = readRuntimeDocumentV1(op.run) as any;
      const origin = parseExecutionEnvelopeV1(Buffer.from(run.envelope.utf8, "utf8")); invariant(origin.ok, "native frozen input envelope corrupt", "schema");
      const bound = bindExecutionSourcesV1(origin.value, host.independentSources); invariant(bound.ok, "native frozen input sources changed", "auth");
      invariant(canonical(inputs) === canonical(nativeFrozenGraphInputsV1(bound.value, sub)), "native pinned inputs differ from independent source", "auth"); return;
    }
    const policy = this.nextContextPolicy(lease.missionId); if (!policy?.grants.some(g => g.consumerUnitId === lease.unitId)) return;
    const image = this.nextContextProjection(lease.missionId, lease.unitId, lease.token); invariant(image, "next context input image missing", "auth");
    if (current) { this.assertNextContextCurrent(authority, lease, image); verifyNextContextRoleFilesV1(image, sub.functionId, sub.role); }
    const row = this.db.query("SELECT snapshot FROM ff8_missions WHERE id=?").get(lease.missionId) as { snapshot: string }, snapshot = JSON.parse(row.snapshot) as Snapshot;
    const expected = graphInputs(this.nextContextRun(lease.missionId), snapshot, sub, inputs.proposals as StoredResult[] | undefined, image);
    invariant(canonical(inputs) === canonical(expected), "actual next context input set differs from exact authorized role view", "auth");
    if (current) this.assertNextContextCurrent(authority, lease, image);
  }
  /** Controller freezes already-known inputs independently of the worker command.
   * Every family/sub-intent requires this durable pin, including fixtures. An
   * old outbox cannot be retroactively authorized by pinning its own declaration.
   */
  freezeAdmissionInputs(authority: ControllerAuthority, lease: UnitLease, subIntentId: string, inputs: InputBundle): string {
    authority = immutableCopy(authority); lease = immutableCopy(lease); inputs = immutableCopy(inputs);
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const unit = this.unit(lease.missionId, lease.unitId), sub = unit.subIntents.find(s => s.subIntentId === subIntentId);
      invariant(sub && ["RESERVED", "RUNNING"].includes(unit.state), "input pin requires an active attributable sub-intent");
      validateAdmissionInputs(inputs, sub);
      this.assertNextContextInputs(authority, lease, sub, inputs, true);
      const frozen = this.familyPublicationContext(lease), { state: _state, ...content } = unit;
      invariant(frozen.sidecar.unitFingerprints[unit.unitId] === fingerprint(content) && frozen.plan.snapshotId === unit.snapshotId && frozen.plan.partitionId === unit.partitionId && frozen.plan.knowledgeRevision === unit.knowledgeRevision, "stale input pin unit/plan/revision binding");
      const mission = this.db.query("SELECT revision FROM ff8_missions WHERE id=?").get(lease.missionId) as { revision: number };
      const pin: AdmissionInputPin = { version: 1, missionId: lease.missionId, unitId: lease.unitId, familyToken: lease.token, controllerToken: authority.lease.token,
        missionRevision: mission.revision + (this.nativePreparing ? 1 : 0),
        bindingFingerprint: frozen.bindingFingerprint, planFingerprint: frozen.plan.fingerprint, snapshotId: unit.snapshotId, partitionId: unit.partitionId, knowledgeRevision: unit.knowledgeRevision,
        subIntentId, functionId: sub.functionId, role: sub.role, inputFingerprint: fingerprint(inputs), inputs: JSON.parse(canonical(inputs)), inputVersions: inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })) };
      const digest = fingerprint(pin), eventKey = `input_pin:${lease.unitId}:${lease.token}:${subIntentId}`;
      const old = this.db.query("SELECT document,digest,event_key FROM ff8_graph_input_pins WHERE mission=? AND unit_id=? AND token=? AND sub_intent=?").get(lease.missionId, lease.unitId, lease.token, subIntentId) as { document: string; digest: string; event_key: string } | null;
      if (old) {
        invariant(old.digest === digest && old.document === canonical(pin), "immutable admission input pin changed"); this.assertAuthorizationEvent(lease.missionId, old.event_key, "admission_inputs_frozen", pin); return pin.inputFingerprint;
      }
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_outbox WHERE mission=? AND unit_id=? AND token=? AND sub_intent=?").get(lease.missionId, lease.unitId, lease.token, subIntentId), "legacy unpinned admission cannot be retroactively authorized");
      this.db.query("INSERT INTO ff8_graph_input_pins VALUES(?,?,?,?,?,?,?)").run(lease.missionId, lease.unitId, lease.token, subIntentId, canonical(pin), digest, eventKey);
      this.events.append(lease.missionId, eventKey, "admission_inputs_frozen", authority.now, pin, lease.unitId);
      this.assertNextContextInputs(authority, lease, sub, inputs, true); this.leases.assert(lease, authority); return pin.inputFingerprint;
    }).immediate();
  }
  private assertAdmissionInputs(authority: ControllerAuthority, lease: UnitLease, body: Admission, currentRevision = true): void {
    const unit = this.unit(lease.missionId, lease.unitId), sub = unit.subIntents.find(s => s.subIntentId === body.subIntentId);
    invariant(sub && sub.role === body.role, "admission sub-intent/role mismatch");
    const dossier = body.command.dossier as Record<string, unknown> | undefined, metadata = body.command.metadata as Record<string, unknown> | undefined;
    invariant(dossier && dossier.functionId === sub.functionId, "admission dossier function mismatch");
    const row = this.db.query("SELECT document,digest,event_key FROM ff8_graph_input_pins WHERE mission=? AND unit_id=? AND token=? AND sub_intent=?").get(lease.missionId, lease.unitId, lease.token, sub.subIntentId) as { document: string; digest: string; event_key: string } | null;
    invariant(row, "admission requires independent durable frozen input pin");
    const pin = JSON.parse(row.document) as AdmissionInputPin, frozen = this.familyPublicationContext(lease), { state: _state, ...content } = unit;
    invariant(fingerprint(pin) === row.digest && pin.inputFingerprint === fingerprint(pin.inputs), "corrupt immutable admission input pin digest", "schema");
    this.assertAuthorizationEvent(lease.missionId, row.event_key, "admission_inputs_frozen", pin);
    const mission = this.db.query("SELECT revision FROM ff8_missions WHERE id=?").get(lease.missionId) as { revision: number };
    invariant(pin.version === 1 && pin.missionId === lease.missionId && pin.unitId === lease.unitId && pin.familyToken === lease.token && pin.controllerToken === authority.lease.token && (!currentRevision || pin.missionRevision === mission.revision + (this.nativePreparing ? 1 : 0))
      && pin.subIntentId === sub.subIntentId && pin.functionId === sub.functionId && pin.role === sub.role && pin.bindingFingerprint === frozen.bindingFingerprint && pin.planFingerprint === frozen.plan.fingerprint
      && pin.snapshotId === unit.snapshotId && pin.partitionId === unit.partitionId && pin.knowledgeRevision === unit.knowledgeRevision && frozen.sidecar.unitFingerprints[unit.unitId] === fingerprint(content), "stale admission input pin function/fence/revision/binding");
    validateAdmissionInputs(pin.inputs, sub);
    this.assertNextContextInputs(authority, lease, sub, pin.inputs, currentRevision);
    invariant(canonical(pin.inputVersions) === canonical(pin.inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 }))), "corrupt pinned input manifest", "schema");
    invariant([1, 3].includes(dossier.version as number) && dossier.role === sub.role && dossier.cycle === pin.inputs.cycle && canonical(dossier.function) === canonical(sub.harnessIdentity) && canonical(dossier.effectiveModel) === canonical(body.command.model), "admission dossier role/function/model/header mismatch");
    const projected = admissionProjection(dossier.inputs, dossier.version);
    invariant(canonical(projected) === canonical(pin.inputs), "admission normalized projection/manifest differs from frozen input pin");
    invariant(metadata?.inputFingerprint === pin.inputFingerprint, "admission inputFingerprint differs from frozen input pin");
    const header = dossier.resultHeader as Record<string, unknown> | undefined;
    invariant(header && header.schemaVersion === 1 && header.missionId === lease.missionId && header.taskId === body.command.taskId && header.attemptId === body.attemptId && header.executionId === body.executionId && header.authorId === body.executionId
      && header.cycle === pin.inputs.cycle && canonical(header.identity) === canonical(sub.harnessIdentity) && header.inputFingerprint === pin.inputFingerprint && canonical(header.inputVersions) === canonical(pin.inputVersions), "admission resultHeader identity/inputFingerprint/manifest mismatch");
    invariant(Array.isArray(header.previousResultIds) && header.previousResultIds.every(id => typeof id === "string"), "admission resultHeader previousResultIds required");
    if (pin.inputs.proposals !== undefined) invariant(canonical(header.previousResultIds) === canonical(pin.inputs.proposals.map(p => p.resultId)), "admission header frozen proposal attribution mismatch");
    if (dossier.resultEnvelope !== undefined) {
      const envelope = dossier.resultEnvelope as Record<string, unknown>;
      invariant(envelope && Object.entries(header).every(([key, value]) => canonical(envelope[key]) === canonical(value)), "admission resultEnvelope contradicts pinned header");
    }
  }
  prepareAdmission(authority: ControllerAuthority, lease: UnitLease, body: Admission, maxAttempts = 3, retryDelayMs = 1000): string {
    this.assertWorkCurrent(lease.missionId, lease.unitId, body.executionId);
    authority = immutableCopy(authority); lease = immutableCopy(lease); body = immutableCopy(body);
    integer(maxAttempts, 1); invariant(maxAttempts <= 10, "admission retry bound exceeded"); integer(retryDelayMs);
    invariant(body.idempotencyKey === body.executionId, "executionId is the admission idempotency key");
    invariant(!["token", "principalId", "controllerId", "expectedRevision", "directory", "missionId"].some(k => k in body), "outbox must not contain authority/secrets");
    const command = body.command;
    invariant(command && command.executionId === body.executionId && command.attemptId === body.attemptId && command.idempotencyKey === body.executionId, "complete bridge admission identity required");
    invariant(!["token", "principalId", "controllerId", "expectedRevision", "directory", "missionId"].some(k => k in command), "bridge command must not contain authority/secrets");
    for (const key of ["taskId", "profile", "prompt"]) invariant(typeof command[key] === "string" && (command[key] as string).trim(), `complete admission missing ${key}`);
    const model = command.model as { providerID: string; id: string; variant: string } | undefined;
    invariant(model && typeof model.providerID === "string" && model.providerID.trim() && typeof model.id === "string" && model.id.trim() && !model.id.includes("#") && typeof model.variant === "string" && model.variant.trim(), "complete native model reference required");
    invariant(command.dossier && command.metadata && (command.context as { mode: string } | undefined)?.mode === "fresh" && command.worktree === false && (command.requiredAccess || (command.expectedAccess && command.resourceBoundary)), "complete fresh dossier/access admission required");
    nonempty(body.attemptId); nonempty(body.executionId);
    const digest = fingerprint(body);
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const unit = this.unit(lease.missionId, lease.unitId), sub = unit.subIntents.find(s => s.subIntentId === body.subIntentId);
      invariant(["RESERVED", "RUNNING"].includes(unit.state), "family is stop-pending/validating/terminal; no new admission");
      const reservation = this.events.read(lease.missionId).find(e => e.key === `reserve:${lease.unitId}:${lease.token}`);
      const bindingHash = (reservation?.payload as { bindingFingerprint: string } | undefined)?.bindingFingerprint;
      const frozen = this.db.query("SELECT plan,sidecar FROM ff8_graph_plans WHERE mission=? AND binding_hash=?").get(lease.missionId, bindingHash ?? "") as { plan: string; sidecar: string } | null;
      invariant(frozen, "missing frozen admission budget");
      const envelopeBytes = JSON.parse(frozen.sidecar).envelopeBytesByUnit[lease.unitId]; integer(envelopeBytes);
      invariant(Buffer.byteLength(canonical(body), "utf8") <= envelopeBytes && envelopeBytes <= JSON.parse(frozen.plan).budgets.contextEnvelopeMaxUtf8Bytes, "complete admission exceeds frozen unit/plan UTF-8 byte budget");
      invariant(sub && sub.role === body.role, "admission sub-intent/role mismatch");
      this.assertAdmissionInputs(authority, lease, body);
      const old = this.outbox(body.executionId);
      if (old) { invariant(old.digest === digest && old.token === lease.token && old.unit_id === lease.unitId && old.mission === lease.missionId, "admission idempotency contract changed"); return digest; }
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_outbox WHERE mission=? AND unit_id=? AND sub_intent=? AND token=? AND state!='REJECTED'").get(lease.missionId, lease.unitId, body.subIntentId, lease.token), "sub-intent already has an admission");
      for (const dependency of sub.waitsForSubIntentIds) {
        const result = this.db.query("SELECT o.execution_id FROM ff8_graph_results r JOIN ff8_graph_outbox o ON o.execution_id=r.execution_id WHERE r.mission=? AND r.unit_id=? AND o.sub_intent=? AND r.token=? AND r.eligible=1").get(lease.missionId, lease.unitId, dependency, lease.token) as { execution_id: string } | null;
        invariant(result && this.hasScientificCompletion(this.outbox(result.execution_id)!), sub.role === "R" ? "R awaits attributable A+B results" : "author awaits attributable other-function R result");
      }
      this.db.query("INSERT INTO ff8_graph_outbox(mission,unit_id,execution_id,sub_intent,token,body,digest,state,max_attempts,retry_delay) VALUES(?,?,?,?,?,?,?,'PREPARED',?,?)").run(lease.missionId, lease.unitId, body.executionId, body.subIntentId, lease.token, canonical(body), digest, maxAttempts, retryDelayMs);
      this.events.append(lease.missionId, `admission:${body.executionId}`, "admission_prepared", authority.now, { body, digest, token: lease.token, maxAttempts, retryDelayMs }, lease.unitId); this.assertWorkCurrent(lease.missionId, lease.unitId, body.executionId); return digest;
    }).immediate();
  }
  private outbox(executionId: string): OutboxRow | null { return this.db.query("SELECT * FROM ff8_graph_outbox WHERE execution_id=?").get(executionId) as OutboxRow | null; }
  private assertDurableAdmission(row: OutboxRow): void {
    invariant(row, "missing durable admission");
    const body = JSON.parse(row.body) as Admission;
    invariant(fingerprint(body) === row.digest && body.executionId === row.execution_id && body.subIntentId === row.sub_intent, "corrupt durable admission binding", "schema");
    const event = this.events.read(row.mission).find(e => e.key === `reserve:${row.unit_id}:${row.token}`);
    const reserved = event?.payload as { lease: UnitLease; controllerToken: number } | undefined;
    invariant(reserved && reserved.lease.missionId === row.mission && reserved.lease.unitId === row.unit_id && reserved.lease.token === row.token, "durable admission lacks original reservation", "schema");
    // This descriptor is historical fence metadata only. currentRevision=false
    // must never promote it into a timed host authority or authorize an effect.
    this.assertAdmissionInputs({ lease: { missionId: row.mission, owner: reserved.lease.owner, token: reserved.controllerToken, expiresAt: 0 }, now: 0 }, reserved.lease, body, false);
  }
  private scientificResult(missionId: string, unitId: string, resultId: string, token?: number) {
    this.assertWorkCurrent(missionId, unitId);
    const row = this.db.query("SELECT execution_id,document,digest,token,eligible FROM ff8_graph_results WHERE mission=? AND unit_id=? AND result_id=?").get(missionId, unitId, resultId) as { execution_id: string; document: string; digest: string; token: number; eligible: number } | null;
    invariant(row && row.eligible === 1 && (token === undefined || token === row.token), "ineligible/missing scientific result", "scientific_block");
    const document = JSON.parse(row.document), admission = this.outbox(row.execution_id), unit = this.unit(missionId, unitId);
    invariant(admission && admission.mission === missionId && admission.unit_id === unitId && admission.token === row.token && fingerprint(document) === row.digest && this.hasScientificCompletion(admission), "scientific result digest/admission/fence mismatch", "scientific_block");
    const sub = unit.subIntents.find(s => s.subIntentId === admission.sub_intent)!;
    invariant(sub && (document.executionId === undefined || document.executionId === row.execution_id) && (document.resultId === undefined || document.resultId === resultId)
      && (document.identity === undefined || canonical(document.identity) === canonical(sub.harnessIdentity)) && (document.role === undefined || document.role === sub.role), "scientific result function/execution attribution mismatch", "scientific_block");
    this.assertAuthorizationEvent(missionId, `result:${resultId}`, "result_retained", { resultId, executionId: row.execution_id, token: row.token, document, eligible: true, source: "artifact" }, unitId);
    return { ...row, bytes: row.document, document, admission, sub };
  }
  admission(executionId: string): { state: string; attempts: number; digest: string; receipt: unknown } | null {
    const r = this.outbox(executionId); return r ? { state: r.state, attempts: r.attempts, digest: r.digest, receipt: r.receipt ? JSON.parse(r.receipt) : null } : null;
  }
  /** The client adds its own exact bridge CAS envelope before its network I/O. */
  async dispatch(authority: ControllerAuthority, lease: UnitLease, executionId: string, client: Pick<ExecutionClient, "submit">): Promise<Record<string, unknown>> {
    assertLegacyNativeDispatchAbsentV1(this.db, lease.missionId, [executionId]);
    this.assertWorkCurrent(lease.missionId, lease.unitId, executionId);
    authority = immutableCopy(authority); lease = immutableCopy(lease);
    const row = this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const r = this.outbox(executionId); invariant(r && r.mission === lease.missionId && r.unit_id === lease.unitId && r.token === lease.token, "outbox scope/fence mismatch");
      assertLegacyNativeDispatchAbsentV1(this.db, lease.missionId, [executionId, JSON.parse(r.body).idempotencyKey]);
      invariant(!this.events.read(lease.missionId).some(e => e.key === `rms.native-at-rest.image:${executionId}`), "at-rest DATA cannot use execution dispatch");
      if (r.receipt) { this.assertDurableAdmission(r); return r; }
      invariant(["RESERVED", "RUNNING"].includes(this.unit(lease.missionId, lease.unitId).state), "family stop/validation prevents dispatch");
      invariant(fingerprint(JSON.parse(r.body)) === r.digest, "corrupt outbox admission digest", "schema");
      this.assertAdmissionInputs(authority, lease, JSON.parse(r.body) as Admission);
      invariant(r.state === "PREPARED" && r.attempts < r.max_attempts && authority.now >= r.next_time, "admission ambiguous, blocked, delayed, or retry exhausted");
      this.db.query("UPDATE ff8_graph_outbox SET state='SENDING',attempts=attempts+1 WHERE execution_id=?").run(executionId);
      this.events.append(lease.missionId, `send:${executionId}:${r.attempts + 1}`, "admission_sending", authority.now, { executionId, attempt: r.attempts + 1, digest: r.digest }, lease.unitId);
      // Appending advances the family event clock. Refusal here rolls back the
      // send generation/event atomically, before transport or ambiguous handling.
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      this.assertAdmissionInputs(authority, lease, JSON.parse(r.body) as Admission);
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority); this.assertWorkCurrent(lease.missionId, lease.unitId, executionId);
      assertLegacyNativeDispatchAbsentV1(this.db, lease.missionId, [executionId]); return r;
    }).immediate();
    if (row.receipt) return JSON.parse(row.receipt);
    try {
      const receipt = immutableCopy(await client.submit(lease.missionId, immutableCopy(JSON.parse(row.body).command)));
      assertLegacyNativeDispatchAbsentV1(this.db, lease.missionId, [executionId]);
      this.acceptReceipt(authority, lease, executionId, receipt, { attempt: row.attempts + 1, token: row.token, digest: row.digest }); return structuredClone(receipt);
    } catch (error) {
      assertLegacyNativeDispatchAbsentV1(this.db, lease.missionId, [executionId]);
      this.db.transaction(() => {
        const category = graphErrorClass(error), declared = bridgeFailureCategory(error);
        // A category/recoverable pair is not a no-admission proof. The explicit
        // negative protocol response must survive the client/transport boundary.
        const rejected = (error as { type?: string } | null)?.type === "execution_rejected" && declared && ["auth", "input", "schema", "quota"].includes(category);
        const r = this.outbox(executionId)!;
        const state = rejected ? (category === "quota" && declared.recoverable && r.attempts < r.max_attempts && this.isWorkCurrent(r.mission, r.unit_id, executionId) ? "PREPARED" : "REJECTED") : "AMBIGUOUS";
        const rejection = rejected ? this.rejectionProof(row, row.attempts + 1, category, declared.recoverable, "dispatch_rejection", failureCause(error)) : null;
        const updated = this.db.query("UPDATE ff8_graph_outbox SET state=?,next_time=?,terminal_proof=? WHERE execution_id=? AND mission=? AND unit_id=? AND state='SENDING' AND attempts=? AND token=? AND digest=? AND receipt IS NULL").run(state, authority.now + r.retry_delay, rejection ? canonical(rejection) : null, executionId, row.mission, row.unit_id, row.attempts + 1, row.token, row.digest);
        if (updated.changes === 1 && rejection) this.events.append(lease.missionId, `rejection:${executionId}:${row.attempts + 1}`, "admission_rejected", Math.max(authority.now, this.events.cursor(lease.missionId).time), rejection, lease.unitId);
        this.events.append(lease.missionId, `send_error:${executionId}:${row.attempts + 1}`, updated.changes === 1 ? "admission_error" : "admission_late_observation", Math.max(authority.now, this.events.cursor(lease.missionId).time), { executionId, errorClass: category, cause: failureCause(error), originalGeneration: { attempt: row.attempts + 1, token: row.token, digest: row.digest }, applied: updated.changes === 1, state: updated.changes === 1 ? state : r.state }, lease.unitId);
      }).immediate(); throw error;
    }
  }
  private acceptReceipt(authority: ControllerAuthority, lease: UnitLease, executionId: string, receipt: Record<string, unknown>, generation?: DispatchGeneration): void {
    assertLegacyNativeDispatchAbsentV1(this.db, lease.missionId, [executionId]);
    this.db.transaction(() => {
      const r = this.outbox(executionId)!;
      const observedAuthority = { ...authority, now: Math.max(authority.now, this.events.cursor(lease.missionId).time) };
      invariant(receipt.executionId === executionId && receipt.state === "accepted" && (receipt.requestDigest === undefined || receipt.requestDigest === r.digest), "receipt execution/digest/accepted status mismatch", "schema");
      if (generation && (r.state !== "SENDING" || r.attempts !== generation.attempt || r.token !== generation.token || r.digest !== generation.digest)) {
        const payload = { executionId, receipt, originalGeneration: generation, applied: false, state: r.state };
        this.events.append(lease.missionId, `late_receipt:${executionId}:${generation.attempt}`, "admission_late_observation", observedAuthority.now, { ...payload, contradiction: contradictoryAcceptedObservation(r, payload) }, lease.unitId); return;
      }
      const boundReceipt = { ...receipt, requestDigest: r.digest };
      invariant(!r.receipt || r.receipt === canonical(boundReceipt), "immutable admission receipt changed", "schema");
      if (r.receipt) return;
      if (["REJECTED", "TERMINAL"].includes(r.state)) {
        this.events.append(lease.missionId, `contradictory_receipt:${executionId}:${fingerprint(boundReceipt)}`, "admission_late_observation", observedAuthority.now, { executionId, receipt: boundReceipt, originalGeneration: { attempt: r.attempts, token: r.token, digest: r.digest }, applied: false, contradiction: true, state: r.state }, lease.unitId); return;
      }
      const updated = this.db.query("UPDATE ff8_graph_outbox SET state='ACCEPTED',receipt=?,terminal_proof=NULL WHERE execution_id=? AND state=? AND attempts=? AND token=? AND digest=? AND receipt IS NULL").run(canonical(boundReceipt), executionId, r.state, r.attempts, r.token, r.digest);
      invariant(updated.changes === 1, "stale receipt admission generation");
      this.events.append(lease.missionId, `receipt:${executionId}`, "admission_accepted", observedAuthority.now, { executionId, receipt: boundReceipt, requestDigest: r.digest, token: r.token, attempt: r.attempts, source: generation ? "dispatch" : "positive_readback" }, lease.unitId);
      const u = this.unit(lease.missionId, lease.unitId);
      // A delayed native response is retained even after controller/family fencing, never resurrected.
      try { this.leases.assert(lease, observedAuthority); if (u.state === "RESERVED" && this.isWorkCurrent(lease.missionId, lease.unitId, executionId)) this.change(observedAuthority, lease.unitId, "RUNNING", "native admission acknowledged"); } catch (error) { if (!(error instanceof GraphPersistenceError)) throw error; }
    }).immediate();
  }
  private rejectionProof(row: OutboxRow, attempt: number, category: string, recoverable: boolean, source: string, cause: unknown): Record<string, unknown> {
    return { proofKind: "definitive_protocol_rejection", type: "execution_rejected", executionId: row.execution_id, requestDigest: row.digest, state: "rejected", generation: { attempt, token: row.token }, category, recoverable, source, cause };
  }
  reconcileAdmission(authority: ControllerAuthority, lease: UnitLease, observation: AdmissionObservation): void {
    assertLegacyNativeDispatchAbsentV1(this.db, lease.missionId, [observation.executionId]);
    authority = immutableCopy(authority); lease = immutableCopy(lease); observation = immutableCopy(observation);
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId);
      const r = this.outbox(observation.executionId); invariant(r && r.mission === lease.missionId && r.unit_id === lease.unitId && r.token === lease.token && r.digest === observation.requestDigest, "readback admission identity/digest/fence mismatch"); nonempty(observation.proof);
      const eventKey = `reconcile:${r.execution_id}:${r.attempts}:${fingerprint(observation)}`;
      if (this.events.read(lease.missionId).some(event => event.key === eventKey)) return;
      if (observation.state === "accepted") { invariant(observation.receipt, "accepted readback needs receipt"); this.acceptReceipt(authority, lease, r.execution_id, observation.receipt); }
      else if (observation.state === "rejected") {
        const receipt = observation.receipt;
        invariant(receipt && receipt.type === "execution_rejected" && receipt.executionId === r.execution_id && receipt.requestDigest === r.digest && receipt.attempt === r.attempts && receipt.token === r.token && ["auth", "input", "schema", "quota"].includes(receipt.category as string) && typeof receipt.recoverable === "boolean", "definitive rejection readback requires exact protocol/generation binding");
        invariant(!r.receipt && ["SENDING", "AMBIGUOUS"].includes(r.state), "only unacknowledged admissions accept a definitive rejection readback");
        this.leases.assert(lease, authority);
        const state = receipt.category === "quota" && receipt.recoverable && r.attempts < r.max_attempts && this.isWorkCurrent(r.mission, r.unit_id, r.execution_id) ? "PREPARED" : "REJECTED";
        const proof = this.rejectionProof(r, r.attempts, receipt.category as string, receipt.recoverable as boolean, "protocol_readback", observation);
        this.db.query("UPDATE ff8_graph_outbox SET state=?,next_time=?,terminal_proof=? WHERE execution_id=? AND state=? AND attempts=? AND token=? AND digest=? AND receipt IS NULL").run(state, authority.now + r.retry_delay, canonical(proof), r.execution_id, r.state, r.attempts, r.token, r.digest);
        this.events.append(lease.missionId, `rejection:${r.execution_id}:${r.attempts}`, "admission_rejected", authority.now, proof, lease.unitId);
      }
      // absent/unknown are instantaneous observations only. In particular an
      // attempted send is never reopened, declared terminal, or released here.
      this.events.append(lease.missionId, eventKey, "admission_readback", authority.now, observation, lease.unitId);
    }).immediate();
  }
  private hasAcceptedReceipt(row: OutboxRow): boolean {
    if (!row.receipt) return false;
    const receipt = JSON.parse(row.receipt) as Record<string, unknown>;
    const event = this.events.read(row.mission).find(e => e.key === `receipt:${row.execution_id}`);
    const accepted = event?.payload as { executionId: string; requestDigest: string; token: number; attempt: number; receipt: unknown; source: string } | undefined;
    return receipt.executionId === row.execution_id && receipt.state === "accepted" && receipt.requestDigest === row.digest
      && event?.kind === "admission_accepted" && accepted?.executionId === row.execution_id && accepted.requestDigest === row.digest
      && accepted.token === row.token && accepted.attempt === row.attempts && ["dispatch", "positive_readback"].includes(accepted.source)
      && canonical(accepted.receipt) === row.receipt && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId });
  }
  private assertNoNativeQualificationUse(missionId: string, unitId: string): void {
    invariant(!this.db.query("SELECT 1 FROM ff8_graph_native_operations WHERE mission=? AND unit_id=? LIMIT 1").get(missionId, unitId),
      "native qualification-only operation cannot validate/publish/consume scientific results", "scientific_block");
  }
  private hasScientificCompletion(row: OutboxRow): boolean {
    if (this.db.query("SELECT 1 FROM ff8_graph_native_operations WHERE execution_id=?").get(row.execution_id)) return false;
    try { this.assertDurableAdmission(row); } catch { return false; }
    if (row.state !== "TERMINAL" || !row.terminal_proof || !this.hasAcceptedReceipt(row)) return false;
    const proof = JSON.parse(row.terminal_proof), journal = this.events.read(row.mission), terminal = journal.find(e => e.key === `terminal:${row.execution_id}`);
    return proof.proofKind === "receipt_bound_terminal" && proof.state === "completed" && proof.executionId === row.execution_id && proof.requestDigest === row.digest && proof.generation?.token === row.token && proof.generation?.attempt === row.attempts
      && terminal?.kind === "execution_terminal" && terminal.unitId === row.unit_id && canonical(terminal.payload) === canonical({ executionId: row.execution_id, status: "completed", proof })
      && terminal.digest === fingerprint({ kind: terminal.kind, time: terminal.time, payload: terminal.payload, unitId: terminal.unitId })
      && !journal.some(event => event.kind === "admission_late_observation" && (event.payload as any)?.executionId === row.execution_id
        && (contradictoryAcceptedObservation(row, event.payload) || event.digest !== fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId })));
  }
  /** No actor parameter: identity comes ONLY from the verified host capability. */
  bootstrapParentAuthority(authority: ControllerAuthority): { identity: ParentAuthorityIdentity; digest: string } {
    authority = immutableCopy(authority);
    return this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      invariant(this.parentAuthority, "level-2 gate: verified host parent authority is not configured", "auth");
      const raw = immutableCopy(this.parentAuthority.verifyParent(structuredClone(authority)));
      invariant(raw && raw.version === 1 && raw.role === "parent" && raw.missionId === authority.lease.missionId && raw.controllerOwner === authority.lease.owner, "level-2 gate: controller is not an authenticated parent", "auth");
      for (const key of ["principalId", "actorId", "source"] as const) nonempty(raw[key]);
      invariant(/^[a-f0-9]{64}$/.test(raw.sourceHash), "parent authority source digest required", "auth");
      invariant(Object.keys(raw).every(k => ["version", "role", "missionId", "controllerOwner", "principalId", "actorId", "source", "sourceHash"].includes(k)), "parent identity must not include worker payload or mutable authority fields", "auth");
      const identity = JSON.parse(canonical(raw)) as ParentAuthorityIdentity, digest = fingerprint(identity);
      const old = this.db.query("SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?").get(identity.missionId) as { document: string; digest: string; event_key: string } | null;
      if (old) {
        invariant(old.document === canonical(identity) && old.digest === digest, "immutable parent bootstrap identity changed", "auth");
        this.assertAuthorizationEvent(identity.missionId, old.event_key, "parent_authority_bootstrapped", identity); return { identity, digest };
      }
      const eventKey = `parent_authority:${digest}`;
      this.db.query("INSERT INTO ff8_graph_parent_authorities VALUES(?,?,?,?)").run(identity.missionId, canonical(identity), digest, eventKey);
      this.events.append(identity.missionId, eventKey, "parent_authority_bootstrapped", authority.now, identity);
      return { identity, digest };
    }).immediate();
  }
  private assertAuthorizationEvent(missionId: string, key: string, kind: string, payload: unknown, unitId?: string | null): void {
    const event = this.events.read(missionId).find(e => e.key === key);
    const expectedUnit = unitId === undefined ? (payload as { unitId?: string } | null)?.unitId : unitId;
    invariant(event && event.kind === kind && (expectedUnit === undefined || event.unitId === expectedUnit) && canonical(event.payload) === canonical(payload)
      && event.digest === fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId }), "authorization event/digest mismatch", "schema");
  }
  private familyPublicationContext(lease: UnitLease): { bindingFingerprint: string; plan: PersistencePlan; sidecar: PersistenceSidecar } {
    const reservation = this.events.read(lease.missionId).find(e => e.key === `reserve:${lease.unitId}:${lease.token}`);
    const bindingFingerprint = (reservation?.payload as { bindingFingerprint: string } | undefined)?.bindingFingerprint;
    invariant(bindingFingerprint, "missing frozen family binding");
    this.assertAuthorizationEvent(lease.missionId, reservation!.key, "unit_reserved", reservation!.payload);
    const reserved = (reservation!.payload as { lease: UnitLease }).lease;
    invariant(reservation!.unitId === lease.unitId && reserved.missionId === lease.missionId && reserved.unitId === lease.unitId && reserved.token === lease.token, "frozen reservation scope/fence mismatch", "schema");
    const row = this.db.query("SELECT plan,sidecar,binding FROM ff8_graph_plans WHERE mission=? AND binding_hash=?").get(lease.missionId, bindingFingerprint) as { plan: string; sidecar: string; binding: string } | null;
    invariant(row, "missing immutable parent attestation plan binding");
    const plan = JSON.parse(row.plan) as PersistencePlan, sidecar = JSON.parse(row.sidecar) as PersistenceSidecar, binding = JSON.parse(row.binding) as PlanBinding;
    invariant(contentDigest(plan) === plan.fingerprint && contentDigest(sidecar) === sidecar.fingerprint && contentDigest(binding) === bindingFingerprint && binding.planFingerprint === plan.fingerprint && binding.sidecarFingerprint === sidecar.fingerprint, "parent attestation frozen binding digest mismatch", "schema");
    return { bindingFingerprint, plan, sidecar };
  }
  /** Optional ONLY in a prospective preparing image, never added by reopen. */
  publicationPolicy(missionId: string): StaticPublicationPolicyV1 | undefined {
    const origins = this.events.read(missionId).filter(e => e.kind === "l8.graph2.preparing" || e.kind === "l8.graph.preparing");
    invariant(origins.length <= 1, "multiple publication preparation origins", "schema");
    const event = origins[0], payload = event?.payload as { version: string; run: { missionId: string; cycle: number }; publicationPolicy?: unknown } | undefined;
    if (!payload || !Object.hasOwn(payload, "publicationPolicy")) return;
    invariant(event!.kind === "l8.graph2.preparing" && payload.version === "l8-graph-preparing-v2" && payload.run.missionId === missionId && event!.key === `l8.graph2.prepare:${payload.run.cycle}`, "prospective publication origin mismatch", "schema");
    this.assertAuthorizationEvent(missionId, event!.key, event!.kind, payload, null);
    return parseStaticPublicationPolicyV1(payload.publicationPolicy);
  }
  publicationMaterialization(missionId: string, unitId: string): PublicationMaterializationV1 | undefined {
    const event = this.events.read(missionId).find(e => e.key === `publication_materialization:${unitId}`);
    if (!event) return;
    invariant(this.publicationPolicy(missionId), "orphan prospective publication manifest", "schema");
    const manifest = parsePublicationMaterializationV1(event.payload);
    this.assertAuthorizationEvent(missionId, event.key, "publication_materialization_frozen", manifest, unitId);
    this.assertMaterializationScope(missionId, unitId, manifest); return manifest;
  }
  private assertMaterializationScope(missionId: string, unitId: string, m: PublicationMaterializationV1, verifyAuthors = false): ReadonlyMap<string, StoredResult> {
    const policy = this.publicationPolicy(missionId); invariant(policy, "prospective publication policy required", "schema");
    const unit = this.unit(missionId, unitId), lease = { missionId, unitId, token: m.familyToken } as UnitLease, frozen = this.familyPublicationContext(lease);
    const events = this.events.read(missionId), origin = events.find(e => e.kind === "l8.graph2.preparing")!.payload as { run: { fingerprint: string } };
    const reservation = events.find(e => e.key === `reserve:${unitId}:${m.familyToken}`)!.payload as { controllerToken: number };
    invariant(m.missionId === missionId && m.unitId === unitId && m.runFingerprint === origin.run.fingerprint && m.controllerToken === reservation.controllerToken
      && m.bindingFingerprint === frozen.bindingFingerprint && m.planFingerprint === frozen.plan.fingerprint && m.snapshotId === unit.snapshotId
      && m.inputRevision === unit.knowledgeRevision && m.outputRevision === unit.knowledgeRevision + 1 && m.publicationLevel >= unit.requiredPublicationLevel
      && m.policySha256 === fingerprint(policy) && m.targetId === publicationTargetIdV1(m, policy), "manifest immutable scope/policy/fence/revision mismatch", "scientific_block");
    invariant(m.resultPins.length === unit.subIntents.length && unit.subIntents.every(s => m.resultPins.some(p => p.subIntentId === s.subIntentId)), "manifest requires exact whole-family coverage", "scientific_block");
    const retained = new Map<string, StoredResult>();
    for (const pin of m.resultPins) {
      const result = this.scientificResult(missionId, unitId, pin.resultId, m.familyToken);
      const event = events.find(e => e.key === `l8.graph2.result:${pin.resultId}` && e.kind === "l8.graph2.result"), payload = event?.payload as { runFingerprint: string; unitId: string; familyToken: number; subIntentId: string; result: StoredResult } | undefined;
      invariant(event && payload && event.unitId === unitId && payload.unitId === unitId && payload.familyToken === m.familyToken && payload.runFingerprint === m.runFingerprint && payload.subIntentId === pin.subIntentId, "manifest lacks exact eligible retained result image", "scientific_block");
      this.assertAuthorizationEvent(missionId, event.key, event.kind, payload, unitId);
      const stored = payload.result;
      invariant(stored.resultId === pin.resultId && stored.executionId === pin.executionId && result.execution_id === pin.executionId && result.sub.subIntentId === pin.subIntentId && result.sub.functionId === pin.functionId && result.sub.role === pin.role
        && result.digest === pin.documentDigest && fingerprint(stored.document) === pin.documentDigest && canonical(JSON.parse(stored.content)) === canonical(result.document)
        && hash(stored.content) === stored.sha256 && stored.sha256 === pin.rawContentSha256 && fingerprint(stored) === pin.recordDigest, "manifest raw/document/record pin mismatch", "scientific_block");
      if (verifyAuthors) {
        const row = this.db.query("SELECT document,digest FROM ff8_graph_native_authors WHERE mission=? AND execution_id=?").get(missionId, pin.executionId) as { document: string; digest: string } | null;
        invariant(row && fingerprint(JSON.parse(row.document)) === row.digest, "manifest lacks parent-verified author", "scientific_block");
        const author = JSON.parse(row.document) as NativeAuthorIdentity;
        invariant(stored.authorId === author.authorId && stored.sessionId === author.sessionId && canonical(stored.effectiveModel) === canonical(author.model), "manifest retained record/native author mismatch", "scientific_block");
      }
      retained.set(pin.resultId, stored);
    }
    invariant(m.artifacts.length === unit.ownedFunctionIds.length && new Set(m.artifacts.map(a => a.functionId)).size === m.artifacts.length && unit.ownedFunctionIds.every(id => m.artifacts.some(a => a.functionId === id)), "manifest needs exact owned-function artifact coverage", "scientific_block");
    for (const artifact of m.artifacts) {
      for (const id of artifact.sourceResultIds) {
        const source = this.scientificResult(missionId, unitId, id, m.familyToken);
        invariant(source.sub.functionId === artifact.functionId && source.sub.role === "R" && source.document.kind === "reconciliation" && source.document.decision === "certain", "artifact requires exact accepted certain R", "scientific_block");
      }
      if (artifact.materialization === "stored-result") invariant(artifact.content === retained.get(artifact.artifactId)?.content, "stored artifact must contain exact retained source bytes", "scientific_block");
      else invariant(!this.db.query("SELECT 1 FROM ff8_graph_results WHERE mission=? AND result_id=?").get(missionId, artifact.artifactId), "derived artifact cannot relabel a stored result", "scientific_block");
    }
    return retained;
  }
  recordPublicationMaterialization(authority: ControllerAuthority, lease: UnitLease, raw: PublicationMaterializationV1): void {
    authority = immutableCopy(authority); lease = immutableCopy(lease); const m = parsePublicationMaterializationV1(raw);
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const parent = this.bootstrapParentAuthority(authority), policy = this.publicationPolicy(lease.missionId);
      invariant(policy && parent.identity.actorId === policy.ownerActorId && m.familyToken === lease.token && m.controllerToken === authority.lease.token, "manifest requires actual configured parent/fences", "auth");
      this.assertMaterializationScope(lease.missionId, lease.unitId, m);
      const old = this.publicationMaterialization(lease.missionId, lease.unitId);
      invariant(!old || canonical(old) === canonical(m), "immutable publication manifest changed", "scientific_block");
      if (!old) {
        invariant(this.unit(lease.missionId, lease.unitId).state === "RUNNING", "manifest must freeze before validation/pending");
        this.events.append(lease.missionId, `publication_materialization:${lease.unitId}`, "publication_materialization_frozen", authority.now, m, lease.unitId);
      }
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
    }).immediate();
  }
  private assertMaterializationEvidence(missionId: string, unitId: string, resultIds: string[], evidence: unknown[], factIds: string[], verifyAuthors = false): PublicationMaterializationV1 | undefined {
    if (!this.publicationPolicy(missionId)) return;
    const m = this.publicationMaterialization(missionId, unitId); invariant(m, "durable prospective publication manifest required", "scientific_block");
    this.assertMaterializationScope(missionId, unitId, m, verifyAuthors); assertPublicationManifestEvidenceV1(m, evidence);
    invariant(canonical([...resultIds].sort()) === canonical(m.resultPins.map(p => p.resultId).sort()) && canonical([...factIds].sort()) === canonical(m.artifacts.map(a => a.artifactId).sort()), "manifest/evidence exact result/fact set mismatch", "scientific_block"); return m;
  }
  /** A synchronous pre-I/O check, NOT a transaction spanning external FS effects. */
  assertPublicationMaterializationCurrent(authority: ControllerAuthority, lease: UnitLease, raw: PublicationMaterializationV1): void {
    authority = immutableCopy(authority); lease = immutableCopy(lease); const m = parsePublicationMaterializationV1(raw);
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const row = this.db.query("SELECT request,digest,token FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { request: string; digest: string; token: number } | null;
      invariant(row && row.token === lease.token, "missing/fenced durable publication"); const pending = JSON.parse(row.request) as KnowledgeCommit;
      const durable = this.assertMaterializationEvidence(lease.missionId, lease.unitId, pending.resultIds, pending.evidence, pending.validatedFactIds, true);
      invariant(durable && canonical(durable) === canonical(m) && pending.readbackHash === hash(canonical(m)) && pending.publicationTargetId === m.targetId && fingerprint(pending) === row.digest && this.unit(lease.missionId, lease.unitId).state === "VALIDATING", "publication image/state changed before external effect", "scientific_block");
      const validation = this.assertPublicationEvidence(lease.missionId, lease.unitId, lease.token, pending);
      const parent = this.assertParentAttestation(authority, lease, validation.parentAttestationId, pending.resultIds, pending.evidence, pending.validatedFactIds);
      invariant(parent.parentActorId === this.publicationPolicy(lease.missionId)!.ownerActorId, "publication target parent ownership changed", "auth");
      this.assertQuiescence(lease); assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
    }).immediate();
  }
  recordParentAttestation(authority: ControllerAuthority, lease: UnitLease, request: ParentAttestationRequest): ParentAttestation {
    this.assertWorkCurrent(lease.missionId, lease.unitId);
    authority = immutableCopy(authority); lease = immutableCopy(lease); request = immutableCopy(request);
    return this.db.transaction(() => {
      this.leases.assert(lease, authority);
      invariant(Object.keys(request).every(k => ["bindingFingerprint", "planFingerprint", "snapshotId", "knowledgeRevision", "resultIds", "resultDigests", "evidence", "validatedFactIds", "checks"].includes(k)), "parent attestation actor/authority must not come from payload", "auth");
      const parent = this.bootstrapParentAuthority(authority), u = this.unit(lease.missionId, lease.unitId), frozen = this.familyPublicationContext(lease);
      invariant(u.state === "RUNNING" && request.bindingFingerprint === frozen.bindingFingerprint && request.planFingerprint === frozen.plan.fingerprint && request.snapshotId === u.snapshotId && request.knowledgeRevision === u.knowledgeRevision && frozen.plan.knowledgeRevision === u.knowledgeRevision, "stale parent attestation unit/fence/binding/snapshot/revision");
      invariant(Array.isArray(request.evidence) && request.evidence.length > 0 && request.validatedFactIds.length > 0 && new Set(request.validatedFactIds).size === request.validatedFactIds.length, "parent attestation evidence/facts required", "scientific_block");
      assertScientificEvidence(request.evidence);
      request.validatedFactIds.forEach(nonempty);
      const evidenceDigest = fingerprint(request.evidence);
      assertScientificChecks(request.checks, evidenceDigest);
      invariant(request.resultIds.length === new Set(request.resultIds).size && request.resultIds.length === u.subIntents.length && Object.keys(request.resultDigests).length === request.resultIds.length, "parent attestation needs exact whole-unit result set", "scientific_block");
      const covered = new Set<string>(), authorDigests: Record<string, string> = {}, sessions = new Set<string>();
      for (const resultId of request.resultIds) {
        const result = this.db.query("SELECT execution_id,digest,document,token FROM ff8_graph_results WHERE mission=? AND unit_id=? AND result_id=? AND eligible=1").get(lease.missionId, lease.unitId, resultId) as { execution_id: string; digest: string; document: string; token: number } | null;
        invariant(result && result.token === lease.token && result.digest === fingerprint(JSON.parse(result.document)) && request.resultDigests[resultId] === result.digest, "parent attestation result/digest/fence mismatch", "scientific_block");
        const admission = this.outbox(result.execution_id)!;
        invariant(this.hasScientificCompletion(admission), "parent attestation needs receipt-bound completed artifacts", "scientific_block");
        invariant(!covered.has(admission.sub_intent), "duplicate parent attestation sub-intent result", "scientific_block"); covered.add(admission.sub_intent);
        const native = immutableCopy(this.parentAuthority!.verifyNativeAuthor(structuredClone(authority), { missionId: lease.missionId, unitId: lease.unitId, executionId: admission.execution_id, requestDigest: admission.digest }));
        invariant(native && native.version === 1 && native.missionId === lease.missionId && native.executionId === admission.execution_id && native.requestDigest === admission.digest && native.fresh === true && native.parentSessionId === null, "level-2 gate: verified native author identity missing/mismatched", "scientific_block");
        for (const key of ["authorId", "sessionId", "profile", "source"] as const) nonempty(native[key]);
        const command = JSON.parse(admission.body).command as Record<string, unknown>, receipt = JSON.parse(admission.receipt!) as Record<string, unknown>, document = JSON.parse(result.document) as Record<string, unknown>;
        invariant(native.profile === command.profile && canonical(native.model) === canonical(command.model) && /^[a-f0-9]{64}$/.test(native.sourceHash)
          && (receipt.nativeSessionId === undefined || receipt.nativeSessionId === native.sessionId) && (receipt.authorId === undefined || receipt.authorId === native.authorId) && (document.authorId === undefined || document.authorId === native.authorId), "native author/model/profile/artifact provenance mismatch", "scientific_block");
        invariant(parent.identity.actorId !== native.authorId && parent.identity.actorId !== native.sessionId && !sessions.has(native.sessionId), "parent actor must be distinct from all fresh native authors", "auth"); sessions.add(native.sessionId);
        const nativeDigest = fingerprint(native), old = this.db.query("SELECT document,digest FROM ff8_graph_native_authors WHERE mission=? AND execution_id=?").get(lease.missionId, admission.execution_id) as { document: string; digest: string } | null;
        invariant(!old || (old.document === canonical(native) && old.digest === nativeDigest), "immutable native author identity changed", "auth");
        if (!old) {
          this.db.query("INSERT INTO ff8_graph_native_authors VALUES(?,?,?,?)").run(lease.missionId, admission.execution_id, canonical(native), nativeDigest);
          this.events.append(lease.missionId, `native_author:${admission.execution_id}`, "native_author_verified", authority.now, native, lease.unitId);
        }
        authorDigests[admission.execution_id] = nativeDigest;
      }
      invariant(u.subIntents.every(sub => covered.has(sub.subIntentId)), "parent attestation does not cover whole unit", "scientific_block");
      this.assertMaterializationEvidence(lease.missionId, lease.unitId, request.resultIds, request.evidence, request.validatedFactIds, true);
      invariant(!this.publicationPolicy(lease.missionId) || parent.identity.actorId === this.publicationPolicy(lease.missionId)!.ownerActorId, "prospective manifest requires configured actual parent", "auth");
      const content = { version: 1 as const, missionId: lease.missionId, unitId: lease.unitId, familyToken: lease.token, controllerToken: authority.lease.token, parentActorId: parent.identity.actorId, parentAuthorityDigest: parent.digest, bindingFingerprint: frozen.bindingFingerprint, planFingerprint: frozen.plan.fingerprint, snapshotId: u.snapshotId, snapshotFingerprint: frozen.sidecar.snapshotFingerprint, partitionId: u.partitionId, knowledgeRevision: u.knowledgeRevision, resultIds: [...request.resultIds], resultDigests: { ...request.resultDigests }, authorDigests, evidenceDigest, validatedFactIds: [...request.validatedFactIds], checks: structuredClone(request.checks) };
      const attestation: ParentAttestation = { ...content, attestationId: fingerprint(content) }, digest = fingerprint(attestation), eventKey = `parent_attestation:${attestation.attestationId}`;
      const old = this.db.query("SELECT document,revocation_event FROM ff8_graph_parent_attestations WHERE mission=? AND attestation_id=?").get(lease.missionId, attestation.attestationId) as { document: string; revocation_event: string | null } | null;
      invariant(!old || (old.document === canonical(attestation) && !old.revocation_event), "immutable/revoked parent attestation cannot be overwritten", "auth");
      if (!old) {
        this.db.query("INSERT INTO ff8_graph_parent_attestations VALUES(?,?,?,?,?,?,?,NULL)").run(lease.missionId, attestation.attestationId, lease.unitId, lease.token, canonical(attestation), digest, eventKey);
        this.events.append(lease.missionId, `attestation_evidence:${attestation.attestationId}`, "parent_attestation_evidence", authority.now, { attestationId: attestation.attestationId, evidence: request.evidence }, lease.unitId);
        this.events.append(lease.missionId, eventKey, "parent_attested", authority.now, attestation, lease.unitId);
      }
      this.leases.assert(lease, authority); this.assertWorkCurrent(lease.missionId, lease.unitId); return this.parentAttestation(lease.missionId, attestation.attestationId);
    }).immediate();
  }
  parentAttestation(missionId: string, attestationId: string): ParentAttestation {
    const row = this.db.query("SELECT unit_id,token,document,digest,event_key,revocation_event FROM ff8_graph_parent_attestations WHERE mission=? AND attestation_id=?").get(missionId, attestationId) as { unit_id: string; token: number; document: string; digest: string; event_key: string; revocation_event: string | null } | null;
    invariant(row && !row.revocation_event, "level-2 gate: durable nonrevoked parent attestation required", "scientific_block");
    const doc = JSON.parse(row.document) as ParentAttestation, { attestationId: _id, ...content } = doc;
    invariant(doc.version === 1 && doc.attestationId === attestationId && fingerprint(content) === attestationId && fingerprint(doc) === row.digest && doc.missionId === missionId && doc.unitId === row.unit_id && doc.familyToken === row.token, "immutable parent attestation digest mismatch", "schema");
    assertScientificChecks(doc.checks, doc.evidenceDigest);
    const evidenceEvent = this.events.read(missionId).find(e => e.key === `attestation_evidence:${attestationId}`);
    const evidence = (evidenceEvent?.payload as { attestationId: string; evidence: unknown[] } | undefined)?.evidence;
    invariant(evidence && fingerprint(evidence) === doc.evidenceDigest, "missing/corrupt durable parent evidence", "scientific_block"); assertScientificEvidence(evidence);
    this.assertAuthorizationEvent(missionId, `attestation_evidence:${attestationId}`, "parent_attestation_evidence", { attestationId, evidence }, doc.unitId);
    invariant(Array.isArray(doc.validatedFactIds) && doc.validatedFactIds.length > 0 && new Set(doc.validatedFactIds).size === doc.validatedFactIds.length, "parent attestation facts required", "scientific_block"); doc.validatedFactIds.forEach(nonempty);
    this.assertAuthorizationEvent(missionId, row.event_key, "parent_attested", doc);
    const parent = this.db.query("SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?").get(missionId) as { document: string; digest: string; event_key: string } | null;
    invariant(parent && fingerprint(JSON.parse(parent.document)) === parent.digest && parent.digest === doc.parentAuthorityDigest && JSON.parse(parent.document).actorId === doc.parentActorId, "attestation immutable parent authority mismatch", "auth");
    this.assertAuthorizationEvent(missionId, parent.event_key, "parent_authority_bootstrapped", JSON.parse(parent.document));
    const parentIdentity = JSON.parse(parent.document) as ParentAuthorityIdentity, unit = this.unit(missionId, doc.unitId);
    invariant(parentIdentity.version === 1 && parentIdentity.role === "parent" && parentIdentity.missionId === missionId && /^[a-f0-9]{64}$/.test(parentIdentity.sourceHash), "invalid durable parent authority", "auth");
    for (const key of ["principalId", "actorId", "controllerOwner", "source"] as const) nonempty(parentIdentity[key]);
    const lease = { missionId, unitId: doc.unitId, token: doc.familyToken } as UnitLease, frozen = this.familyPublicationContext(lease);
    const reserved = this.events.read(missionId).find(e => e.key === `reserve:${doc.unitId}:${doc.familyToken}`)!.payload as { controllerToken: number };
    const { state: _state, ...unitContent } = unit;
    invariant(doc.controllerToken === reserved.controllerToken && doc.bindingFingerprint === frozen.bindingFingerprint && doc.planFingerprint === frozen.plan.fingerprint && frozen.sidecar.unitFingerprints[unit.unitId] === fingerprint(unitContent)
      && doc.snapshotId === unit.snapshotId && doc.partitionId === unit.partitionId && doc.snapshotFingerprint === frozen.sidecar.snapshotFingerprint && doc.knowledgeRevision === unit.knowledgeRevision && frozen.plan.knowledgeRevision === unit.knowledgeRevision, "stale durable parent attestation binding", "scientific_block");
    invariant(Array.isArray(doc.resultIds) && doc.resultIds.length === unit.subIntents.length && new Set(doc.resultIds).size === doc.resultIds.length && Object.keys(doc.resultDigests).length === doc.resultIds.length && Object.keys(doc.authorDigests).length === doc.resultIds.length, "parent attestation exact result/author coverage required", "scientific_block");
    const covered = new Set<string>(), sessions = new Set<string>();
    for (const id of doc.resultIds) {
      const result = this.scientificResult(missionId, doc.unitId, id, doc.familyToken), executionId = result.execution_id, digest = doc.authorDigests[executionId];
      invariant(doc.resultDigests[id] === result.digest && !covered.has(result.sub.subIntentId), "parent attestation result digest/coverage mismatch", "scientific_block"); covered.add(result.sub.subIntentId);
      const author = this.db.query("SELECT document,digest FROM ff8_graph_native_authors WHERE mission=? AND execution_id=?").get(missionId, executionId) as { document: string; digest: string } | null;
      invariant(author && fingerprint(JSON.parse(author.document)) === digest && author.digest === digest, "attestation native author digest mismatch", "schema");
      const native = JSON.parse(author.document) as NativeAuthorIdentity, command = JSON.parse(result.admission.body).command, receipt = JSON.parse(result.admission.receipt!);
      invariant(native.version === 1 && native.missionId === missionId && native.executionId === executionId && native.requestDigest === result.admission.digest && native.fresh === true && native.parentSessionId === null
        && native.profile === command.profile && canonical(native.model) === canonical(command.model) && /^[a-f0-9]{64}$/.test(native.sourceHash)
        && (receipt.nativeSessionId === undefined || receipt.nativeSessionId === native.sessionId) && (receipt.authorId === undefined || receipt.authorId === native.authorId) && (result.document.authorId === undefined || result.document.authorId === native.authorId), "durable native author/provenance mismatch", "scientific_block");
      for (const key of ["authorId", "sessionId", "profile", "source"] as const) nonempty(native[key]);
      invariant(native.authorId !== doc.parentActorId && native.sessionId !== doc.parentActorId && !sessions.has(native.sessionId), "parent/native author independence mismatch", "auth"); sessions.add(native.sessionId);
      this.assertAuthorizationEvent(missionId, `native_author:${executionId}`, "native_author_verified", native);
    }
    invariant(unit.subIntents.every(s => covered.has(s.subIntentId)), "parent attestation whole-unit coverage mismatch", "scientific_block");
    this.assertMaterializationEvidence(missionId, doc.unitId, doc.resultIds, evidence, doc.validatedFactIds, true);
    invariant(!this.publicationPolicy(missionId) || doc.parentActorId === this.publicationPolicy(missionId)!.ownerActorId, "prospective parent target ownership mismatch", "auth");
    return doc;
  }
  revokeParentAttestation(authority: ControllerAuthority, attestationId: string, reason: string): void {
    authority = immutableCopy(authority);
    nonempty(reason);
    this.db.transaction(() => {
      const parent = this.bootstrapParentAuthority(authority), row = this.db.query("SELECT unit_id,revocation_event FROM ff8_graph_parent_attestations WHERE mission=? AND attestation_id=?").get(authority.lease.missionId, attestationId) as { unit_id: string; revocation_event: string | null } | null;
      invariant(row, "unknown parent attestation");
      const payload = { attestationId, actorId: parent.identity.actorId, parentAuthorityDigest: parent.digest, reason }, key = `revoke_parent_attestation:${attestationId}`;
      if (row.revocation_event) { this.assertAuthorizationEvent(authority.lease.missionId, key, "parent_attestation_revoked", payload); return; }
      this.events.append(authority.lease.missionId, key, "parent_attestation_revoked", authority.now, payload, row.unit_id);
      this.db.query("UPDATE ff8_graph_parent_attestations SET revocation_event=? WHERE mission=? AND attestation_id=? AND revocation_event IS NULL").run(key, authority.lease.missionId, attestationId);
    }).immediate();
  }
  private assertParentAttestation(authority: ControllerAuthority, lease: UnitLease, attestationId: string | undefined, resultIds: string[], evidence: unknown[], factIds: string[]): ParentAttestation {
    invariant(attestationId, "level-2 gate: parentValidated boolean is not a parent attestation", "scientific_block");
    this.leases.assert(lease, authority); const parent = this.bootstrapParentAuthority(authority), doc = this.parentAttestation(lease.missionId, attestationId), u = this.unit(lease.missionId, lease.unitId), frozen = this.familyPublicationContext(lease);
    invariant(doc.parentAuthorityDigest === parent.digest && doc.parentActorId === parent.identity.actorId && doc.unitId === lease.unitId && doc.familyToken === lease.token && doc.controllerToken === authority.lease.token && doc.bindingFingerprint === frozen.bindingFingerprint && doc.planFingerprint === frozen.plan.fingerprint && doc.snapshotId === u.snapshotId && doc.snapshotFingerprint === frozen.sidecar.snapshotFingerprint && doc.partitionId === u.partitionId && doc.knowledgeRevision === u.knowledgeRevision, "stale parent attestation actor/unit/fence/binding/plan/snapshot/revision", "scientific_block");
    invariant(canonical(doc.resultIds) === canonical(resultIds) && doc.evidenceDigest === fingerprint(evidence) && canonical(doc.validatedFactIds) === canonical(factIds) && doc.checks.length > 0, "parent attestation result/evidence/facts/checks mismatch", "scientific_block");
    for (const id of doc.resultIds) {
      const result = this.db.query("SELECT digest,document,execution_id,token,eligible FROM ff8_graph_results WHERE mission=? AND unit_id=? AND result_id=?").get(lease.missionId, lease.unitId, id) as { digest: string; document: string; execution_id: string; token: number; eligible: number } | null;
      invariant(result && result.token === lease.token && result.eligible === 1 && result.digest === doc.resultDigests[id] && fingerprint(JSON.parse(result.document)) === result.digest && this.hasScientificCompletion(this.outbox(result.execution_id)!), "stale parent attestation result/digest/fence", "scientific_block");
    }
    return doc;
  }
  proveTerminal(authority: ControllerAuthority, unitId: string, executionId: string, status: "completed" | "stopped" | "failed" | "rejected" | "absent", proof: Record<string, unknown>): void {
    assertLegacyNativeDispatchAbsentV1(this.db, authority.lease.missionId, [executionId]);
    authority = immutableCopy(authority); proof = immutableCopy(proof);
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId); const r = this.outbox(executionId);
      invariant(r && r.mission === authority.lease.missionId && r.unit_id === unitId, "terminal proof scope mismatch");
      invariant(["absent", "rejected"].includes(status) || r.attempts > 0, "unsubmitted outbox cannot prove a native execution terminal");
      invariant(proof.executionId === executionId && proof.state === status && proof.requestDigest === r.digest && proof.quiescent === true && typeof proof.source === "string" && proof.source.trim(), "terminal native readback proof required");
      invariant(!["absent", "rejected"].includes(status) || !r.receipt, "accepted execution cannot become absent/rejected");
      if (status === "absent" && r.attempts > 0) {
        this.events.append(r.mission, `terminal_observation:${executionId}:${fingerprint(proof)}`, "terminal_observation", authority.now, { executionId, status, proof, effect: "audit_only_not_admission_closed" }, unitId); return;
      }
      if (status === "rejected") {
        invariant(r.state === "REJECTED" && r.terminal_proof && JSON.parse(r.terminal_proof).proofKind === "definitive_protocol_rejection", "rejected requires an already recorded definitive protocol rejection");
        this.assertAuthorizationEvent(r.mission, `rejection:${executionId}:${r.attempts}`, "admission_rejected", JSON.parse(r.terminal_proof)); return;
      }
      if (status === "absent") invariant(r.attempts === 0 && ["PREPARED", "TERMINAL"].includes(r.state), "absence releases only a never-sent PREPARED admission");
      else invariant(["ACCEPTED", "TERMINAL"].includes(r.state) && this.hasAcceptedReceipt(r), `${status} requires a durable accepted receipt bound to execution/digest`, "scientific_block");
      const boundProof = { ...proof, proofKind: status === "absent" ? "never_sent" : "receipt_bound_terminal", generation: { attempt: r.attempts, token: r.token } }, body = canonical(boundProof);
      if (r.state === "TERMINAL") { invariant(r.terminal_proof === body, "terminal proof changed"); return; }
      this.db.query("UPDATE ff8_graph_outbox SET state='TERMINAL',terminal_proof=? WHERE execution_id=?").run(body, executionId);
      this.events.append(r.mission, `terminal:${executionId}`, "execution_terminal", authority.now, { executionId, status, proof: boundProof }, unitId);
    }).immediate();
  }
  retainResult(authority: ControllerAuthority, lease: UnitLease, executionId: string, resultId: string, document: Record<string, unknown>, source: "artifact" | "bulletin" = "artifact"): boolean {
    authority = immutableCopy(authority); lease = immutableCopy(lease); document = immutableCopy(document);
    nonempty(resultId);
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); const r = this.outbox(executionId);
      invariant(r && r.mission === lease.missionId && r.unit_id === lease.unitId && r.token === lease.token, "result attribution mismatch");
      const digest = fingerprint(document), old = this.db.query("SELECT unit_id,execution_id,token,digest,eligible FROM ff8_graph_results WHERE mission=? AND result_id=?").get(lease.missionId, resultId) as { unit_id: string; execution_id: string; token: number; digest: string; eligible: number } | null;
      let current = true; try { this.leases.assert(lease, authority); } catch { current = false; }
      const eligible = current && source === "artifact" && this.hasScientificCompletion(r) && this.isWorkCurrent(lease.missionId, lease.unitId, executionId);
      if (old) { invariant(old.digest === digest && old.unit_id === lease.unitId && old.execution_id === executionId && old.token === lease.token, "result identity/attribution changed"); return old.eligible === 1 && eligible; }
      this.db.query("INSERT INTO ff8_graph_results VALUES(?,?,?,?,?,?,?,?)").run(lease.missionId, lease.unitId, resultId, executionId, lease.token, digest, canonical(document), eligible ? 1 : 0);
      this.events.append(lease.missionId, `result:${resultId}`, "result_retained", authority.now, { resultId, executionId, token: lease.token, document, eligible, source }, lease.unitId); return eligible;
    }).immediate();
  }
  validateUnit(authority: ControllerAuthority, lease: UnitLease, resultIds: string[], validation: UnitValidation): void {
    this.assertNoNativeQualificationUse(lease.missionId, lease.unitId);
    this.assertWorkCurrent(lease.missionId, lease.unitId);
    authority = immutableCopy(authority); lease = immutableCopy(lease); resultIds = immutableCopy(resultIds); validation = immutableCopy(validation);
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const u = this.unit(lease.missionId, lease.unitId);
      invariant(validation.source === "artifact" && validation.evidence.length > 0 && validation.validatedFactIds.length > 0, "scientific validation evidence required", "scientific_block");
      if (u.requiredPublicationLevel === 2 || validation.parentAttestationId || this.publicationPolicy(lease.missionId)) this.assertParentAttestation(authority, lease, validation.parentAttestationId, resultIds, validation.evidence, validation.validatedFactIds);
      const candidates = this.db.query("SELECT r.result_id,o.sub_intent,o.execution_id FROM ff8_graph_results r JOIN ff8_graph_outbox o ON o.execution_id=r.execution_id WHERE r.mission=? AND r.unit_id=? AND r.token=? AND r.eligible=1").all(lease.missionId, lease.unitId, lease.token) as Array<{ result_id: string; sub_intent: string; execution_id: string }>;
      const results = candidates.filter(candidate => this.hasScientificCompletion(this.outbox(candidate.execution_id)!));
      invariant(resultIds.length === u.subIntents.length && resultIds.length === new Set(resultIds).size && resultIds.every(id => results.some(r => r.result_id === id)) && u.subIntents.every(s => results.some(r => r.sub_intent === s.subIntentId && resultIds.includes(r.result_id))), "validation requires all attributable family artifacts", "scientific_block");
      for (const id of resultIds) this.scientificResult(lease.missionId, lease.unitId, id, lease.token);
      this.change(authority, lease.unitId, "VALIDATING", "family validation executed");
      this.events.append(lease.missionId, `validation:${lease.unitId}:${lease.token}`, "unit_validated", authority.now, { token: lease.token, resultIds, validation }, lease.unitId);
      this.assertWorkCurrent(lease.missionId, lease.unitId);
    }).immediate();
  }
  preparePublication(authority: ControllerAuthority, lease: UnitLease, commit: KnowledgeCommit, effect: PublicationEffect = { verifiedEffect: "does_not_satisfy" }): void {
    this.assertNoNativeQualificationUse(lease.missionId, lease.unitId);
    this.assertWorkCurrent(lease.missionId, lease.unitId);
    authority = immutableCopy(authority); lease = immutableCopy(lease); commit = immutableCopy(commit); effect = immutableCopy(effect);
    validateGraphDocument("knowledge-commit", commit);
    invariant(effect && Object.keys(effect).length === 1 && ["satisfies", "does_not_satisfy", "invalidates_future"].includes(effect.verifiedEffect), "explicit valid verified publication effect required", "schema");
    invariant(/^[a-f0-9]{64}$/.test(commit.commitId) && /^[a-f0-9]{64}$/.test(commit.readbackHash), "publication identities must be SHA256 digests", "schema");
    invariant(commit.commitId === scientificCommitId(commit), "pending publication content commitId mismatch", "schema");
    invariant(commit.unitId === lease.unitId && commit.outputRevision === commit.inputRevision + 1 && commit.isGitCommit === false && [1, 2].includes(commit.publicationLevel) && commit.readbackStatus === "pending", "inadmissible scientific publication");
    invariant(!/^(?:idb|ida)(?::|$)/i.test(commit.publicationTargetId), "IDB publication outside mission");
    this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority);
      const u = this.unit(lease.missionId, lease.unitId); invariant(u.state === "VALIDATING" && commit.inputRevision === u.knowledgeRevision && commit.publicationLevel >= u.requiredPublicationLevel, "publication revision/level/state mismatch");
      this.assertPublicationEvidence(lease.missionId, lease.unitId, lease.token, commit);
      const event = this.events.read(lease.missionId).find(e => e.key === `validation:${lease.unitId}:${lease.token}`);
      invariant(event, "no executed validation"); const validated = event.payload as { resultIds: string[]; validation: UnitValidation };
      invariant(canonical(commit.resultIds) === canonical(validated.resultIds) && canonical(commit.evidence) === canonical(validated.validation.evidence) && canonical(commit.validatedFactIds) === canonical(validated.validation.validatedFactIds), "publication differs from validated evidence", "scientific_block");
      if (commit.publicationLevel === 2 || this.publicationPolicy(lease.missionId)) {
        const attestation = this.assertParentAttestation(authority, lease, validated.validation.parentAttestationId, commit.resultIds, commit.evidence, commit.validatedFactIds);
        const payload = { attestationId: attestation.attestationId, commitDigest: fingerprint(commit), parentAuthorityDigest: attestation.parentAuthorityDigest, token: lease.token };
        const key = `parent_publication:${lease.unitId}`;
        const oldAuthorization = this.events.read(lease.missionId).find(e => e.key === key);
        if (oldAuthorization) this.assertAuthorizationEvent(lease.missionId, key, "parent_publication_authorized", payload);
        else this.events.append(lease.missionId, key, "parent_publication_authorized", authority.now, payload, lease.unitId);
      }
      const old = this.db.query("SELECT digest FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { digest: string } | null;
      invariant(!old || old.digest === fingerprint(commit), "publication idempotency changed");
      if (old) { invariant(this.publicationEffect(lease.missionId, lease.unitId, lease.token, old.digest).verifiedEffect === effect.verifiedEffect, "immutable publication effect changed"); return; }
      const intent: PublicationEffectWitness = { version: 1, missionId: lease.missionId, unitId: lease.unitId, token: lease.token, requestDigest: fingerprint(commit), verifiedEffect: effect.verifiedEffect };
      const effectKey = `publication_effect:${lease.unitId}`;
      invariant(!this.db.query("SELECT 1 FROM ff8_graph_publication_effects WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId), "orphan publication effect cannot be replaced", "schema");
      this.db.query("INSERT INTO ff8_graph_publications VALUES(?,?,?,?,?,NULL)").run(lease.missionId, lease.unitId, lease.token, canonical(commit), fingerprint(commit));
      this.events.append(lease.missionId, `publication:${lease.unitId}`, "publication_prepared", authority.now, commit, lease.unitId);
      this.db.query("INSERT INTO ff8_graph_publication_effects VALUES(?,?,?,?,?)").run(lease.missionId, lease.unitId, canonical(intent), fingerprint(intent), effectKey);
      this.events.append(lease.missionId, effectKey, "publication_effect_frozen", authority.now, intent, lease.unitId);
      this.assertWorkCurrent(lease.missionId, lease.unitId);
      if (this.publicationPolicy(lease.missionId)) { assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority); }
    }).immediate();
  }
  private publicationEffect(missionId: string, unitId: string, token: number, requestDigest: string): PublicationEffectWitness {
    const row = this.db.query("SELECT document,digest,event_key FROM ff8_graph_publication_effects WHERE mission=? AND unit_id=?").get(missionId, unitId) as { document: string; digest: string; event_key: string } | null;
    invariant(row, "legacy publication lacks immutable verified-effect intent", "schema");
    const doc = JSON.parse(row.document) as PublicationEffectWitness;
    invariant(doc.version === 1 && doc.missionId === missionId && doc.unitId === unitId && doc.token === token && doc.requestDigest === requestDigest && fingerprint(doc) === row.digest
      && ["satisfies", "does_not_satisfy", "invalidates_future"].includes(doc.verifiedEffect), "immutable publication effect binding mismatch", "schema");
    this.assertAuthorizationEvent(missionId, row.event_key, "publication_effect_frozen", doc); return doc;
  }
  private assertPublicationEvidence(missionId: string, unitId: string, token: number, commit: KnowledgeCommit): UnitValidation {
    const unit = this.unit(missionId, unitId), event = this.events.read(missionId).find(e => e.key === `validation:${unitId}:${token}`);
    invariant(event && event.unitId === unitId, "no executed validation", "scientific_block");
    const payload = event.payload as { token: number; resultIds: string[]; validation: UnitValidation }, validation = payload.validation;
    this.assertAuthorizationEvent(missionId, event.key, "unit_validated", payload);
    invariant(payload.token === token && validation.source === "artifact" && commit.inputRevision === unit.knowledgeRevision && commit.publicationLevel >= unit.requiredPublicationLevel
      && validation.evidence.length > 0 && validation.validatedFactIds.length > 0 && canonical(payload.resultIds) === canonical(commit.resultIds)
      && canonical(validation.evidence) === canonical(commit.evidence) && canonical(validation.validatedFactIds) === canonical(commit.validatedFactIds), "publication differs from validated evidence", "scientific_block");
    const subs = new Set(commit.resultIds.map(id => this.scientificResult(missionId, unitId, id, token).sub.subIntentId));
    invariant(commit.resultIds.length === unit.subIntents.length && subs.size === commit.resultIds.length && unit.subIntents.every(s => subs.has(s.subIntentId)), "publication requires exact whole-unit result coverage", "scientific_block");
    const manifest = this.assertMaterializationEvidence(missionId, unitId, commit.resultIds, commit.evidence, commit.validatedFactIds, true);
    if (manifest) invariant(manifest.familyToken === token && commit.publicationTargetId === manifest.targetId && commit.readbackHash === hash(canonical(manifest)) && commit.inputRevision === manifest.inputRevision && commit.outputRevision === manifest.outputRevision && commit.publicationLevel === manifest.publicationLevel, "pending/verified commit differs from exact attested manifest", "scientific_block");
    return validation;
  }
  commitReadback(authority: ControllerAuthority, lease: UnitLease, readback: { targetId: string; hash: string; requestDigest: string; source: string }): KnowledgeCommit {
    this.assertNoNativeQualificationUse(lease.missionId, lease.unitId);
    this.assertWorkCurrent(lease.missionId, lease.unitId);
    authority = immutableCopy(authority); lease = immutableCopy(lease); readback = immutableCopy(readback);
    return this.db.transaction(() => {
      assertController(this.db, authority, lease.missionId);
      const done = this.db.query("SELECT document FROM ff8_graph_commits WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { document: string } | null;
      if (done) {
        const commit = JSON.parse(done.document) as KnowledgeCommit;
        this.assertScientificCommitMapping(lease.missionId, lease.unitId, commit);
        invariant((commit.publicationLevel !== 2 && !this.publicationPolicy(lease.missionId)) || this.hasCommittedParentAttestation(lease.missionId, lease.unitId, commit), "committed parent attestation is no longer valid", "scientific_block");
        invariant(commit.publicationTargetId === readback.targetId && commit.readbackHash === readback.hash, "double commit readback changed");
        const prior = this.db.query("SELECT readback FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { readback: string };
        invariant(prior.readback === canonical(readback), "double commit provenance changed"); return commit;
      }
      this.leases.assert(lease, authority);
      const r = this.db.query("SELECT * FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(lease.missionId, lease.unitId) as { request: string; digest: string; token: number } | null;
      invariant(r && r.token === lease.token, "missing/fenced durable publication"); const pending = JSON.parse(r.request) as KnowledgeCommit;
      validateGraphDocument("knowledge-commit", pending);
      invariant(pending.readbackStatus === "pending" && pending.commitId === scientificCommitId(pending) && fingerprint(pending) === r.digest, "immutable pending publication content/digest mismatch", "schema");
      const effect = this.publicationEffect(lease.missionId, lease.unitId, lease.token, r.digest);
      this.assertPublicationEvidence(lease.missionId, lease.unitId, lease.token, pending);
      this.assertAuthorizationEvent(lease.missionId, `publication:${lease.unitId}`, "publication_prepared", pending);
      if (pending.publicationLevel === 2 || this.publicationPolicy(lease.missionId)) {
        const validationEvent = this.events.read(lease.missionId).find(e => e.key === `validation:${lease.unitId}:${lease.token}`);
        const validation = (validationEvent?.payload as { validation: UnitValidation } | undefined)?.validation;
        const attestation = this.assertParentAttestation(authority, lease, validation?.parentAttestationId, pending.resultIds, pending.evidence, pending.validatedFactIds);
        this.assertAuthorizationEvent(lease.missionId, `parent_publication:${lease.unitId}`, "parent_publication_authorized", { attestationId: attestation.attestationId, commitDigest: r.digest, parentAuthorityDigest: attestation.parentAuthorityDigest, token: lease.token });
      }
      invariant(readback.targetId === pending.publicationTargetId && readback.hash === pending.readbackHash && readback.requestDigest === r.digest && readback.source.trim(), "publication readback mismatch", "scientific_block");
      const policy = this.publicationPolicy(lease.missionId);
      if (policy) invariant(readback.source === staticPublicationReadbackSourceV1(policy, readback.targetId), "static readback provenance changed", "scientific_block");
      this.assertQuiescence(lease);
      // The pending request is the immutable operation/readback identity. The
      // scientific document has a different content ID after verified readback;
      // the existing mission/unit join durably maps the two without rewriting
      // the request, its digest, authorization, receipt, or historical event.
      const verified: KnowledgeCommit = { ...pending, readbackStatus: "verified", futurePrerequisiteEffect: effect.verifiedEffect };
      const commit: KnowledgeCommit = { ...verified, commitId: scientificCommitId(verified) };
      validateGraphDocument("knowledge-commit", commit);
      invariant(commit.commitId === scientificCommitId(commit), "verified scientific content commitId mismatch", "schema");
      this.observePublication(authority, lease.unitId, readback);
      this.db.query("INSERT INTO ff8_graph_commits VALUES(?,?,?,?)").run(lease.missionId, lease.unitId, commit.commitId, canonical(commit));
      this.change(authority, lease.unitId, "COMMITTED", "scientific publication readback verified");
      this.events.append(lease.missionId, `commit:${lease.unitId}`, "knowledge_committed", authority.now, commit, lease.unitId);
      this.assertWorkCurrent(lease.missionId, lease.unitId);
      if (policy) { assertController(this.db, authority, lease.missionId); this.leases.assert(lease, authority); }
      this.leases.releaseProven(authority, lease); return commit;
    }).immediate();
  }
  /** Lost publication replies can be retained even after fencing, without scientific promotion. */
  observePublication(authority: ControllerAuthority, unitId: string, readback: { targetId: string; hash: string; requestDigest: string; source: string }): void {
    authority = immutableCopy(authority); readback = immutableCopy(readback);
    this.db.transaction(() => {
      assertController(this.db, authority, authority.lease.missionId);
      const r = this.db.query("SELECT request,digest,readback FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(authority.lease.missionId, unitId) as { request: string; digest: string; readback: string | null } | null;
      invariant(r, "no durable publication intent"); const pending = JSON.parse(r.request) as KnowledgeCommit;
      validateGraphDocument("knowledge-commit", pending);
      invariant(fingerprint(pending) === r.digest, "immutable pending publication digest mismatch", "schema");
      invariant(readback.targetId === pending.publicationTargetId && readback.hash === pending.readbackHash && readback.requestDigest === r.digest && readback.source.trim(), "publication readback mismatch", "scientific_block");
      const policy = this.publicationPolicy(authority.lease.missionId);
      if (policy) invariant(readback.source === staticPublicationReadbackSourceV1(policy, readback.targetId), "static observation provenance changed", "scientific_block");
      const content = canonical(readback); invariant(!r.readback || r.readback === content, "immutable publication readback changed");
      if (r.readback) return;
      this.db.query("UPDATE ff8_graph_publications SET readback=? WHERE mission=? AND unit_id=?").run(content, authority.lease.missionId, unitId);
      this.events.append(authority.lease.missionId, `publication_readback:${unitId}`, "publication_readback", authority.now, readback, unitId);
    }).immediate();
  }
  satisfies(missionId: string, unitId: string, level: number): boolean {
    this.assertNoNativeQualificationUse(missionId, unitId);
    try {
      this.assertWorkCurrent(missionId, unitId);
      const r = this.db.query("SELECT document FROM ff8_graph_commits WHERE mission=? AND unit_id=?").get(missionId, unitId) as { document: string } | null;
      if (!r) return false; const c = JSON.parse(r.document) as KnowledgeCommit;
      this.assertScientificCommitMapping(missionId, unitId, c);
      if ((c.publicationLevel === 2 || this.publicationPolicy(missionId)) && !this.hasCommittedParentAttestation(missionId, unitId, c)) return false;
      return [1, 2].includes(level) && c.readbackStatus === "verified" && c.futurePrerequisiteEffect === "satisfies" && c.publicationLevel >= level;
    } catch { return false; }
  }
  private assertScientificCommitMapping(missionId: string, unitId: string, commit: KnowledgeCommit): void {
    validateGraphDocument("knowledge-commit", commit);
    const row = this.db.query("SELECT commit_id FROM ff8_graph_commits WHERE mission=? AND unit_id=?").get(missionId, unitId) as { commit_id: string } | null;
    const publication = this.db.query("SELECT token,request,digest,readback FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(missionId, unitId) as { token: number; request: string; digest: string; readback: string | null } | null;
    invariant(row && row.commit_id === commit.commitId && commit.unitId === unitId && commit.readbackStatus === "verified" && commit.commitId === scientificCommitId(commit), "legacy/invalid scientific content commitId", "schema");
    invariant(publication && publication.readback, "scientific commit lacks durable operation/readback mapping", "schema");
    const pending = JSON.parse(publication.request) as KnowledgeCommit, readback = JSON.parse(publication.readback) as { targetId: string; hash: string; requestDigest: string; source: string };
    validateGraphDocument("knowledge-commit", pending);
    invariant(pending.readbackStatus === "pending" && pending.commitId === scientificCommitId(pending) && fingerprint(pending) === publication.digest && readback.requestDigest === publication.digest && readback.hash === pending.readbackHash && readback.targetId === pending.publicationTargetId && readback.source.trim(), "invalid immutable publication operation/readback mapping", "schema");
    const effect = this.publicationEffect(missionId, unitId, publication.token, publication.digest);
    const verified = { ...pending, readbackStatus: "verified" as const, futurePrerequisiteEffect: effect.verifiedEffect };
    invariant(canonical(commit) === canonical({ ...verified, commitId: scientificCommitId(verified) }), "scientific commit differs from verified operation content", "schema");
    this.assertPublicationEvidence(missionId, unitId, publication.token, commit);
    this.assertAuthorizationEvent(missionId, `publication:${unitId}`, "publication_prepared", pending);
    this.assertAuthorizationEvent(missionId, `publication_readback:${unitId}`, "publication_readback", readback);
    this.assertAuthorizationEvent(missionId, `commit:${unitId}`, "knowledge_committed", commit);
  }
  private hasCommittedParentAttestation(missionId: string, unitId: string, commit: KnowledgeCommit): boolean {
    try {
      const publication = this.db.query("SELECT token,digest FROM ff8_graph_publications WHERE mission=? AND unit_id=?").get(missionId, unitId) as { token: number; digest: string } | null;
      if (!publication) return false;
      const validationEvent = this.events.read(missionId).find(e => e.key === `validation:${unitId}:${publication.token}`);
      const validation = (validationEvent?.payload as { validation: UnitValidation } | undefined)?.validation;
      if (!validation?.parentAttestationId) return false;
      const attestation = this.parentAttestation(missionId, validation.parentAttestationId);
      if (attestation.unitId !== unitId || attestation.familyToken !== publication.token || canonical(attestation.resultIds) !== canonical(commit.resultIds) || attestation.evidenceDigest !== fingerprint(commit.evidence) || canonical(attestation.validatedFactIds) !== canonical(commit.validatedFactIds)) return false;
      this.assertAuthorizationEvent(missionId, `parent_publication:${unitId}`, "parent_publication_authorized", { attestationId: attestation.attestationId, commitDigest: publication.digest, parentAuthorityDigest: attestation.parentAuthorityDigest, token: publication.token });
      return true;
    } catch { return false; } // Corrupt/legacy/revoked authorizations never unblock consumers.
  }
  private assertQuiescence(lease: UnitLease): void {
    const rows = this.db.query("SELECT state,terminal_proof FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").all(lease.missionId, lease.unitId) as Array<{ state: string; terminal_proof: string | null }>;
    invariant(rows.every(r => ["TERMINAL", "REJECTED"].includes(r.state) && r.terminal_proof), "old execution still active/ambiguous; redispatch forbidden");
    assertExecutionQuiescence(this.db, this.events, lease.missionId, lease.unitId);
  }
  retireFamily(authority: ControllerAuthority, lease: UnitLease, outcome: "RETRYABLE" | "FAILED" | "CANCELLED", reason: string, errorClass: Exclude<ErrorClass, "none">): void {
    nonempty(reason);
    this.db.transaction(() => {
      this.leases.assert(lease, authority); this.assertQuiescence(lease);
      this.change(authority, lease.unitId, outcome, reason);
      this.leases.releaseProven(authority, lease);
      this.events.append(lease.missionId, `retire:${lease.unitId}:${lease.token}`, "family_retired", authority.now, { token: lease.token, outcome, reason, errorClass }, lease.unitId);
    }).immediate();
  }
  releaseQuarantine(authority: ControllerAuthority, unitId: string): void {
    this.db.transaction(() => {
      const lease = this.leases.get(authority.lease.missionId, unitId); invariant(lease && lease.state === "quarantined", "family not quarantined");
      this.assertQuiescence(lease); this.leases.releaseProven(authority, lease);
      // The old revision remains historical. A fresh unit/plan is required; never auto-READY.
      this.events.append(lease.missionId, `quiescent:${unitId}:${lease.token}`, "quarantine_quiescent", authority.now, { token: lease.token }, unitId);
    }).immediate();
  }
  /** Audit projection only: NOT reconstruction of leases/outbox/plan tables.
   * EventLog.replay supports a supplied reducer; repairing/rebuilding materialized
   * state from the journal needs a separate reviewed recovery implementation.
   */
  replay(missionId: string): { states: Record<string, WorkUnitState>; committed: string[]; time: number; sequence: number } {
    return this.events.replay(missionId, { states: {} as Record<string, WorkUnitState>, committed: [] as string[], time: 0, sequence: 0 }, (state, event: GraphEvent) => {
      if (event.kind === "unit_added") state.states[event.unitId!] = (event.payload as WorkUnit).state;
      if (event.kind === "unit_state") state.states[event.unitId!] = (event.payload as { state: WorkUnitState }).state;
      if (event.kind === "knowledge_committed") state.committed.push(event.unitId!);
      state.time = event.time; state.sequence = event.sequence; return state;
    });
  }
}
