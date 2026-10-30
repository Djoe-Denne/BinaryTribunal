/** Inspection candidate ONLY. No CLI or top-level I/O/DB/native effect.
 * An explicit parent call performs LOCAL OWN creation/reservation, never a send.
 * Returned attribution is DATA, not native invocation authentication or a grant.
 */
import { lstatSync, realpathSync, openSync, closeSync, fstatSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { randomUUID } from "node:crypto";
import { Database } from "bun:sqlite";
import { Store } from "../../../../tools/ff8-harness/src/store.ts";
import { GraphStore } from "../../../../tools/ff8-harness/src/graph-store.ts";
import { planMission } from "../../../../tools/ff8-harness/src/planner.ts";
import { assertExecutionJsonV1, makeBoundDocumentV1, bindExecutionPreparationV1,
  sealExecutionEnvelopeV1, bindExecutionSourcesV1, makeGraphRunV3,
  EXECUTION_DOCUMENT_KINDS_V1 } from "../../../../tools/ff8-harness/src/graph-execution-envelope.ts";
import { canonical, hash, fingerprint, exactPath, validateConfig } from "../../../../tools/ff8-harness/src/validation.ts";
import { enumerateConstructedX86V1 } from "./constructed-x86-enumerator-v1.mjs";

const SOURCE_MANIFEST_PATH = "C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e/native-preparation-136/source-bundle-v3/manifest.json";
const SOURCE_MANIFEST_SHA = "34ffa53959bf44e6023071d4f27fb939732c719bf2bad681a1bea1e877410d68";
const need = (v, why) => { if (!v) throw new Error(`HOLD: ${why}`); };
const take = result => { need(result.ok, (result.reasons || ["pure producer refused"]).join("; ")); return result.value; };
const copy = value => JSON.parse(canonical(value));
const same = (a, b, why) => need(canonical(a) === canonical(b), why);
const pathKey = path => resolve(path).toLowerCase();
const identity = stat => ({ dev: String(stat.dev), ino: String(stat.ino) });
function shape(value, keys, where) {
  need(value !== null && typeof value === "object" && !Array.isArray(value), `${where}: object required`);
  need(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), `${where}: unexpected/missing field`);
}
function absent(path) {
  try { lstatSync(path); return false; }
  catch (error) { if (error?.code === "ENOENT") return true; throw error; }
}
function noAlias(path, kind) {
  exactPath(path);
  let cursor = resolve(path), first = true;
  for (;;) {
    const stat = lstatSync(cursor);
    need(!stat.isSymbolicLink(), `symlink/reparse alias refused: ${cursor}`);
    need(first && kind === "file" ? stat.isFile() : stat.isDirectory(), `unexpected filesystem kind: ${cursor}`);
    need(pathKey(realpathSync(cursor)) === pathKey(cursor), `resolved path alias refused: ${cursor}`);
    if (first && kind === "file") need(stat.nlink === 1, `hardlinked file refused: ${cursor}`);
    const parent = dirname(cursor); if (parent === cursor) return;
    cursor = parent; first = false;
  }
}
function readStable(path) {
  noAlias(path, "file");
  const before = lstatSync(path);
  need(Number.isSafeInteger(before.size) && before.size > 0 && before.size <= 16777216, "bounded nonempty source file required");
  const fd = openSync(path, "r");
  let bytes;
  try {
    const opened = fstatSync(fd); same(identity(opened), identity(before), "source identity changed on open");
    bytes = readFileSync(fd);
    const after = fstatSync(fd);
    same(identity(after), identity(before), "source identity changed during read");
    need(after.size === before.size && after.mtimeMs === before.mtimeMs && after.ctimeMs === before.ctimeMs, "source mutated during read");
  } finally { closeSync(fd); }
  const last = lstatSync(path);
  same(identity(last), identity(before), "source replaced after read");
  need(last.size === before.size && last.mtimeMs === before.mtimeMs && last.ctimeMs === before.ctimeMs
    && bytes.length === before.size, "source changed after read");
  noAlias(path, "file");
  return { bytes, pin: { path, byteLength: bytes.length, sha256: hash(bytes) } };
}
function readPinned(pin, readbacks) {
  shape(pin, ["path", "byteLength", "sha256"], "source pin");
  need(Number.isSafeInteger(pin.byteLength) && pin.byteLength > 0 && /^[a-f0-9]{64}$/.test(pin.sha256), "source pin size/SHA");
  const result = readStable(pin.path);
  need(result.pin.byteLength === pin.byteLength && result.pin.sha256 === pin.sha256, `actual source pin differs: ${pin.path}`);
  readbacks.push(result.pin); return result.bytes;
}
function utf8(bytes) {
  need(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), "UTF-8 BOM forbidden");
  const value = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  assertExecutionJsonV1(value); return value;
}
function json(bytes) { const value = JSON.parse(utf8(bytes)); assertExecutionJsonV1(value); return value; }
function closedReadback(path, missionId, expected, controller, family, source, planning) {
  const db = new Database(path, { readonly: true, strict: true });
  try {
    return db.transaction(() => {
      const mission = db.query("SELECT revision,snapshot,lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(missionId);
      need(mission, "durable mission missing");
      const snapshot = JSON.parse(mission.snapshot);
      same(snapshot.config, source.missionSnapshot.config, "durable mission config differs from source");
      need(snapshot.stage === "explore" && snapshot.cycle === 1 && snapshot.cycles.length === 1
        && snapshot.cycles[0].frozen === false && !Object.hasOwn(snapshot.cycles[0], "graph")
        && snapshot.intents.length === 0 && snapshot.reconciliations.length === 0, "local staging must not anchor or execute a cycle");
      need(mission.lease_owner === controller.owner && mission.lease_token === controller.token && mission.lease_until === controller.expiresAt
        && mission.lease_until > Date.now(), "durable controller changed/expired");
      const active = db.query("SELECT plan_id,revision FROM ff8_graph_active_plan WHERE mission=?").get(missionId);
      const plan = db.query("SELECT binding_hash,plan,sidecar,binding FROM ff8_graph_plans WHERE mission=? AND plan_id=?").get(missionId, planning.plan.planId);
      need(active && plan && active.plan_id === planning.plan.planId && active.revision === expected.activePlanRevision
        && mission.revision === expected.missionRevision && plan.binding_hash === planning.binding.fingerprint, "durable plan/revision binding changed");
      same(JSON.parse(plan.plan), planning.plan, "durable plan substituted");
      same(JSON.parse(plan.sidecar), planning.sidecar, "durable sidecar substituted");
      same(JSON.parse(plan.binding), planning.binding, "durable planning binding substituted");
      const units = db.query("SELECT unit_id,document,digest,state,revision FROM ff8_graph_units WHERE mission=?").all(missionId);
      need(units.length === planning.units.length && units.every(unit => unit.state !== "RUNNING"), "foreign or running local work unit");
      for (const unit of units) {
        const original = planning.units.find(item => item.unitId === unit.unit_id);
        need(original && unit.digest === fingerprint(original), "durable immutable unit digest changed");
        same(JSON.parse(unit.document), original, "durable immutable unit content changed");
      }
      const unit = units.find(item => item.unit_id === family.unitId);
      need(unit?.state === "RESERVED", "durable selected unit not RESERVED");
      const row = db.query("SELECT owner,token,expires_event,state,resources FROM ff8_unit_leases WHERE mission=? AND unit_id=?").get(missionId, family.unitId);
      const stream = db.query("SELECT sequence,time FROM ff8_graph_streams WHERE mission=?").get(missionId);
      need(row && stream && row.owner === controller.owner && row.token === family.token && row.state === "active"
        && row.expires_event === family.expiresAtEvent && row.expires_event > stream.sequence, "durable family lease changed/expired");
      same(JSON.parse(row.resources), family.resourceKeys, "family resource set changed");
      const claims = db.query("SELECT resource_key,unit_id,token FROM ff8_unit_claims WHERE mission=? ORDER BY resource_key").all(missionId);
      same(claims.map(claim => claim.resource_key), [...family.resourceKeys].sort(), "missing/extra canonical claims");
      need(claims.every(claim => claim.unit_id === family.unitId && claim.token === row.token), "foreign canonical claim fence");
      const allowedKinds = new Set(["snapshot_stored", "partition_stored", "unit_added", "plan_frozen", "unit_state", "unit_reserved"]);
      const events = db.query("SELECT sequence,time,key,kind,unit_id,payload,digest FROM ff8_events WHERE mission=? ORDER BY sequence").all(missionId);
      need(events.length > 0 && events.length <= 10000, "bounded durable journal required");
      for (const event of events) {
        need(allowedKinds.has(event.kind), "unexpected local journal effect");
        const payload = JSON.parse(event.payload);
        need(event.digest === fingerprint({ kind: event.kind, time: event.time, payload, unitId: event.unit_id }), "durable event digest corrupt");
      }
      const reserved = events.find(event => event.key === `reserve:${family.unitId}:${row.token}`);
      need(reserved && JSON.parse(reserved.payload).controllerToken === mission.lease_token, "durable family/controller attribution missing");
      for (const table of ["ff8_graph_outbox", "ff8_graph_results", "ff8_graph_commits", "ff8_graph_publications", "ff8_graph_native_roots", "ff8_graph_native_bindings", "ff8_graph_native_operations", "ff8_graph_parent_authorities", "ff8_graph_ordered_commands", "ff8_graph_next_context_approvals"]) {
        const count = db.query(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
        need(count === 0, `unexpected local effect rows in ${table}`);
      }
      need(mission.lease_until > Date.now(), "controller expired during durable readback");
      return { observedAt: Date.now(), missionRevision: mission.revision,
        activePlan: { planId: active.plan_id, revision: active.revision, bindingFingerprint: plan.binding_hash },
        selectedUnit: { unitId: unit.unit_id, revision: unit.revision, state: unit.state, immutableDigest: unit.digest },
        controller: { missionId, owner: mission.lease_owner, token: mission.lease_token, expiresAt: mission.lease_until },
        family: { missionId, unitId: family.unitId, owner: row.owner, token: row.token, expiresAtEvent: row.expires_event, state: row.state, resourceKeys: JSON.parse(row.resources) },
        eventCursor: { sequence: stream.sequence, time: stream.time },
        events: events.map(({ sequence, time, key, kind, unit_id, digest }) => ({ sequence, time, key, kind, unitId: unit_id, digest })) };
    })();
  } finally { db.close(); }
}

export function stageLocalReservationV1(rawRequest) {
  const trace = [], readbacks = [], attribution = { witnessId: randomUUID(), pid: process.pid, startedAt: Date.now(),
    meaning: "local control/readback DATA only; native parent invocation and external receipt remain required" };
  let step = "validate-request", request, ownPath, namespaceCreated = false, store, graph;
  let controllerObserved = null, familyObserved = null, programRef = null, scopeRef = null, result;
  const log = event => trace.push({ at: Date.now(), step, event });
  const closeWriters = () => {
    const errors = [];
    if (graph) { const handle = graph; graph = undefined; try { handle.close(); } catch (error) { errors.push(String(error?.message ?? error)); } }
    if (store) { const handle = store; store = undefined; try { handle.close(); } catch (error) { errors.push(String(error?.message ?? error)); } }
    need(errors.length === 0, `close failure; preserve OWN: ${errors.join("; ")}`);
  };
  try {
    assertExecutionJsonV1(rawRequest); request = copy(rawRequest);
    shape(request, ["version", "sourceManifestPin", "expected", "ownNamespace", "ownFileName", "controllerId", "leaseMs"], "request");
    need(request.version === "rms-stage-local-reservation-request-v1", "stage request version");
    shape(request.expected, ["missionId", "unitId", "sourceRequestRef", "runRef", "planningRef"], "expected scope");
    need(typeof request.controllerId === "string" && request.controllerId.trim().length > 0, "explicit controller owner label");
    need(Number.isSafeInteger(request.leaseMs) && request.leaseMs >= 1 && request.leaseMs <= 300000, "bounded explicit controller leaseMs");
    exactPath(request.ownNamespace);
    need(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.sqlite$/.test(request.ownFileName), "closed OWN filename (*.sqlite, no traversal)");
    ownPath = join(resolve(request.ownNamespace), request.ownFileName);
    noAlias(dirname(resolve(request.ownNamespace)), "directory");
    need(absent(request.ownNamespace), "OWN namespace already exists; no adoption/retry");
    same(request.sourceManifestPin, { path: request.sourceManifestPin?.path, byteLength: 2806, sha256: SOURCE_MANIFEST_SHA }, "exact V3 manifest pin required");
    need(pathKey(request.sourceManifestPin.path) === pathKey(SOURCE_MANIFEST_PATH), "closed V3 source manifest path");
    programRef = readStable(import.meta.path).pin;
    scopeRef = makeBoundDocumentV1("rms-stage-local-reservation-scope-DATA-v1", request).ref;
    step = "reload-v3-sources";
    const manifest = json(readPinned(request.sourceManifestPin, readbacks));
    need(manifest.version === "rms-constructed-source-materialization-v3" && manifest.fixture === true && manifest.admissibleAsOracle === false
      && manifest.productPin === "782ec396a2a7866d30645c32ca8ab864dcca5960" && manifest.nativeAuthority === "HOLD"
      && manifest.files.length === 5, "only exact V3 closed source bundle");
    const byName = new Map(manifest.files.map(pin => [basename(pin.path), pin]));
    need(byName.size === 5 && ["body.json", "independentSources.json", "policy.json", "enumeration-proof.json", "activation-policy.json"].every(name => byName.has(name)), "closed bundle file set");
    const body = json(readPinned(byName.get("body.json"), readbacks));
    const independentSources = json(readPinned(byName.get("independentSources.json"), readbacks));
    const policy = json(readPinned(byName.get("policy.json"), readbacks));
    const proofBytes = readPinned(byName.get("enumeration-proof.json"), readbacks), proof = json(proofBytes);
    const controlPin = byName.get("activation-policy.json"), controlBytes = readPinned(controlPin, readbacks);
    const root = dirname(dirname(resolve(request.sourceManifestPin.path)));
    const textAt = (name, ref) => utf8(readPinned({ path: join(root, name), byteLength: ref.byteLength, sha256: ref.sha256 }, readbacks));
    const D3text = textAt("source-decision-v3.json", proof.decisionRef);
    const Q3text = textAt("constructed-function-model-v3.json", proof.modelRef);
    const rawBytes = readPinned(manifest.rawArtifact, readbacks);
    need(pathKey(proof.rawArtifact.path) === pathKey(manifest.rawArtifact.path), "proof/raw file path differs");
    same(proof.rawArtifact.ref, { kind: "rms-constructed-x86-raw-v3", encoding: "raw-v1", byteLength: manifest.rawArtifact.byteLength, sha256: manifest.rawArtifact.sha256 }, "proof/raw ref differs");
    const codePin = { path: proof.enumeratorSource.path, byteLength: proof.enumeratorSource.ref.byteLength, sha256: proof.enumeratorSource.ref.sha256 };
    const codeText = utf8(readPinned(codePin, readbacks));
    const loadedCode = readStable(join(import.meta.dir, "constructed-x86-enumerator-v1.mjs"));
    need(loadedCode.pin.sha256 === manifest.enumeratorCodeSha256 && loadedCode.pin.sha256 === codePin.sha256, "actual imported extractor file pin differs");
    const sourceCode = readStable(join(import.meta.dir, "source136.mjs"));
    need(sourceCode.pin.sha256 === manifest.sourceCodeSha256, "source136 producer file pin differs");
    readbacks.push(loadedCode.pin, sourceCode.pin);
    const recomputed = enumerateConstructedX86V1(D3text, Q3text,
      { path: proof.rawArtifact.path, base64: rawBytes.toString("base64"), byteLength: rawBytes.length, sha256: hash(rawBytes) },
      { path: codePin.path, utf8: codeText });
    need(recomputed.evidence.utf8 === utf8(proofBytes), "independently recomputed proof bytes differ");
    same(recomputed.evidence.ref, manifest.enumerationEvidenceRef, "independent proof reference differs");
    for (const entry of independentSources.inputManifestSource.files) {
      const actual = readPinned({ path: entry.file.path, byteLength: entry.bytes.ref.byteLength, sha256: entry.file.sha256 }, readbacks);
      need(actual.equals(Buffer.from(entry.bytes.base64, "base64")), "real input bytes differ from independently supplied image");
      if (pathKey(entry.file.path) === pathKey(controlPin.path)) need(actual.equals(controlBytes), "real CONTROL rule differs from bundle pin");
    }
    need(independentSources.inputManifestSource.files.length === 3, "exact three real common input files required");
    const q = { body, independentSources, policy }, preparation = take(bindExecutionPreparationV1(body, independentSources, policy));
    const planning = planMission(copy(preparation.projection.graph), copy(preparation.projection.groups), copy(policy), copy(body.admissionSource.context));
    same(planning, JSON.parse(body.rootBootstrapSources.planning.utf8), "recomputed planning differs from retained source");
    const planningDocument = makeBoundDocumentV1(EXECUTION_DOCUMENT_KINDS_V1.planning, planning);
    same(planningDocument, body.rootBootstrapSources.planning, "retained planning original bytes differ");
    const origin = take(sealExecutionEnvelopeV1({ ...copy(body), planning: planningDocument }));
    const bound = take(bindExecutionSourcesV1(origin, independentSources));
    const run = take(makeGraphRunV3(origin)).document;
    same(makeBoundDocumentV1("rms-native-source-request-v1", q).ref, request.expected.sourceRequestRef, "requested source scope differs");
    same(run.ref, request.expected.runRef, "requested run differs");
    same(planningDocument.ref, request.expected.planningRef, "requested planning differs");
    need(body.missionId === request.expected.missionId && planning.plan.selectedUnitIds.length === 1
      && planning.plan.selectedUnitIds[0] === request.expected.unitId && planning.units.length === 1
      && planning.units[0].state === "PENDING" && planning.sidecar.diagnostics.length === 0
      && planning.diagnostics.length === 0, "exact unadmitted diagnostic-free singleton scope required");
    need(bound.snapshot.binaryArtifacts.length === 1 && bound.snapshot.binaryArtifacts[0].architecture === "x86-32"
      && bound.snapshot.binaryArtifacts[0].contentSha256 === manifest.rawArtifact.sha256
      && bound.snapshot.binaryArtifacts[0].provenance.evidenceSha256 === manifest.enumerationEvidenceRef.sha256, "canonical raw target/provenance differs");
    need(bound.template.settings.familyTtlEvents === 100, "ratified family TTL must stay100 mission events");
    const config = validateConfig(copy(bound.missionSnapshot.config));
    need(config.fixture === true, "local staging source must remain explicitly fixture");
    log("all pinned sources/proof/real inputs validated before namespace creation");

    step = "exclusive-local-create";
    noAlias(dirname(resolve(request.ownNamespace)), "directory");
    need(absent(request.ownNamespace), "OWN namespace appeared; no retry/adoption");
    mkdirSync(request.ownNamespace, { mode: 0o700 }); namespaceCreated = true;
    const namespaceIdentity = identity(lstatSync(request.ownNamespace));
    const fd = openSync(ownPath, "wx", 0o600);
    let ownIdentity;
    try { ownIdentity = identity(fstatSync(fd)); } finally { closeSync(fd); }
    const assertOwn = () => {
      noAlias(request.ownNamespace, "directory"); noAlias(ownPath, "file");
      same(identity(lstatSync(request.ownNamespace)), namespaceIdentity, "OWN namespace replaced");
      same(identity(lstatSync(ownPath)), ownIdentity, "OWN file replaced");
    };
    assertOwn(); log("exclusive namespace and empty OWN file created; failure must preserve both");
    step = "initialize-local-store-schema";
    store = new Store(ownPath);
    const initial = { schemaVersion: 1, missionId: config.missionId, revision: 0, config, status: "running", cycle: 1, stage: "explore",
      candidates: [], cycles: [{ number: 1, knowledge: structuredClone(config.knowledge), subset: [], frozen: false, groups: [] }],
      intents: [], reconciliations: [], noProgressCycles: 0 };
    step = "create-fresh-local-mission";
    store.create(initial);
    step = "initialize-graph-schema";
    graph = new GraphStore(ownPath); // No parentAuthority, nativeParentInvocation, bridge, runtime or permissive host provider.
    step = "acquire-real-controller";
    assertOwn();
    const controller = store.acquireLease(config.missionId, request.controllerId, Date.now(), request.leaseMs);
    const controllerRow = graph.db.query("SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(config.missionId);
    need(controllerRow && controllerRow.lease_owner === controller.owner && controllerRow.lease_token === controller.token
      && controllerRow.lease_until === controller.expiresAt, "actual controller readback differs");
    controllerObserved = { missionId: config.missionId, owner: controllerRow.lease_owner, token: controllerRow.lease_token, expiresAt: controllerRow.lease_until };
    const authority = () => {
      assertOwn(); store.assertLease(controller, Date.now());
      const now = Math.max(Date.now(), graph.events.cursor(config.missionId).time);
      need(now < controller.expiresAt, "controller expired; no implicit renewal");
      return { lease: controller, now };
    };
    const act = (name, operation) => {
      step = name; const a = authority(); const value = operation(a);
      log("local API returned; current controller recheck pending");
      authority(); log("current controller rechecked without renewal"); return value;
    };
    act("put-snapshot", a => graph.putSnapshot(a, copy(bound.snapshot)));
    act("put-partition", a => graph.putPartition(a, copy(bound.transport.partition)));
    for (const unit of planning.units) act("add-unit", a => graph.addUnit(a, copy(unit)));
    const active = graph.db.query("SELECT plan_id,revision FROM ff8_graph_active_plan WHERE mission=?").get(config.missionId);
    need(!active, "fresh OWN unexpectedly has an active plan; no adoption");
    // The absent active row was actually read. This0 is the initial CAS version, NOT a guessed fence.
    act("freeze-exact-plan", a => graph.freezePlan(a, copy(planning.plan), copy(planning.sidecar), copy(planning.binding), active?.revision ?? 0));
    act("transition-ready", a => graph.transition(a, request.expected.unitId, "READY", "Parent explicit local stage of exact pinned RAW fixture source; no dispatch"));
    const expected = graph.reservationExpectation(config.missionId);
    const family = act("reserve-existing-api", a => graph.reserve(a, request.expected.unitId, 100, expected));
    familyObserved = graph.leases.get(config.missionId, request.expected.unitId);
    same(familyObserved, family, "actual family lease readback differs from reserve result");
    graph.leases.assert(family, authority());
    need(graph.unit(config.missionId, request.expected.unitId).state === "RESERVED", "local API did not retain RESERVED");
    step = "close-writers-and-independent-durable-readback";
    authority(); graph.leases.assert(family, authority()); closeWriters(); assertOwn();
    const durable = closedReadback(ownPath, config.missionId, expected, controller, family, bound, planning);
    need(durable.controller.expiresAt > Date.now(), "controller expired before return; preserve partial OWN, no renewal");
    log("independent readonly durable readback completed");
    result = { status: "LOCAL_RESERVED_NATIVE_HOLD", ownPath, namespaceCreated, attribution, programRef, scopeRef,
      sourceManifestPin: request.sourceManifestPin, runRef: run.ref, planningRef: planningDocument.ref,
      durable, sourceReadbacks: readbacks, trace,
      nativeInventory: "UNKNOWN", nativeCanary: "UNKNOWN", nativeCosts: "UNKNOWN", nativeGrants: "UNKNOWN_HOLD", nativeOrigins: "UNKNOWN_HOLD",
      resourcesMeaning: "Only canonical OWN family claims; no physical worker/account/resource allocation or scientific/native effect",
      externalParentReceipt: "REQUIRED_NOT_SUPPLIED_BY_THIS_DATA" };
  } catch (error) {
    result = { status: "HOLD", step, ownPath: ownPath ?? null, namespaceCreated, attribution, programRef, scopeRef,
      controllerObserved, familyObserved, sourceReadbacks: readbacks, trace,
      failure: { message: String(error?.message ?? error).slice(0, 2000), code: typeof error?.code === "string" ? error.code : null },
      recovery: "Preserve partial namespace/OWN and any remaining WAL/SHM; no explicit file deletion/reset/retry/adoption/release/renewal. Existing SQLite close semantics apply. Parent inspection and a new explicit decision are required.",
      nativeInventory: "UNKNOWN", nativeCanary: "UNKNOWN", nativeCosts: "UNKNOWN", nativeGrants: "UNKNOWN_HOLD", nativeOrigins: "UNKNOWN_HOLD",
      externalParentReceipt: "REQUIRED_NOT_SUPPLIED_BY_THIS_DATA" };
  } finally {
    try { closeWriters(); }
    catch (error) {
      result = { ...result, status: "HOLD", closeFailure: String(error?.message ?? error).slice(0, 2000),
        recovery: "Preserve OWN and partial files; close failure is not success, no retry/reset/adoption." };
    }
  }
  assertExecutionJsonV1(result); return result;
}
