/** Inspection candidate. Explicit parent call: LOCAL stage + exclusive files.
 * NO client.ts import, private issuer, service connection, POST or subprocess.
 * The parent native invocation/receipt is the trust root, not these DATA checks.
 */
import { lstatSync, realpathSync, openSync, closeSync, fstatSync, readFileSync, readSync,
  writeFileSync, fsyncSync, mkdirSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { createHash } from "node:crypto";
import { Database } from "bun:sqlite";
import { stageLocalReservationV1 } from "./stage-local-reservation.mjs";
import { assertExecutionJsonV1, makeBoundDocumentV1 as doc,
  bindExecutionPreparationV1, sealExecutionEnvelopeV1, bindExecutionSourcesV1,
  makeGraphRunV3 } from "../../../../tools/ff8-harness/src/graph-execution-envelope.ts";
import { encodeNativeAdmissionWireV1 } from "../../../../tools/ff8-harness/src/native-runtime-transport.ts";
import { canonical, hash, exactPath } from "../../../../tools/ff8-harness/src/validation.ts";
import { sourceNativeFunctionIdentityMatchesV1 } from "../../../../tools/ff8-harness/src/_native-function-identity.ts";

const C = "C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e/";
const MANIFEST = { path: C + "native-preparation-136/source-bundle-v3/manifest.json", byteLength: 2806,
  sha256: "34ffa53959bf44e6023071d4f27fb939732c719bf2bad681a1bea1e877410d68" };
const INTENTION = { path: C + "native-preparation-136/admission-a-static-intention.json", byteLength: 24112,
  sha256: "2f3425aceead82f6bfd5edb0df3c3c209d4dec121c3ff112f66ed2e65c8a8f24" };
const RIGHTS = { path: C + "permissions-155/permissions-evidence.json", byteLength: 1267,
  sha256: "3456d81648c21c998b8f64fe756e2c0b0bdbf10d14ebaa27a5c131bb23b1f0e9" };
const DECISION = { path: C + "permissions-155/preflight-scope-decision.json", byteLength: 2652,
  sha256: "e827109d98f11c529f802f3089c99f4b0f573eb5297079ee746ef429a242a9b5" };
const STAGE = { path: join(import.meta.dir, "stage-local-reservation.mjs"), byteLength: 25729,
  sha256: "5bbea4d5bd9e88f36bbdbabebcbc8973577fe3d7d8a3c0c1a68f0022d4a09a72" };
const RAW_SOURCE_MAX_BYTES = 134217728;
const SOURCE_ARCHIVE = { path: "C:/Users/djden/AppData/Local/Temp/opencode/rms-build-provenance-157/opencode-source-3ebcf9a3.tar.gz",
  byteLength: 82421743, sha256: "752dbd73150920607daa8d4d87d3080451fb3f89973d98141897392348bbaedd" };
const PROVENANCE157 = { path: C + "evidence/server-release-provenance-157.json", byteLength: 4908,
  sha256: "d98df6a08fe2245ca4ec2a8acf2b75dbfcb063f90ba9caec77d0441e9cdb1999" };
const SOURCE_DECISION158 = { path: C + "evidence/server-source-field-decision-158.json", byteLength: 2106,
  sha256: "11426276ab3a23714e615947529c47979a92cd73a6c716a0cef4ff18e82b1675" };
const PRODUCT_MANIFEST164 = { path: C + "evidence/native-address-bridge-retained-164.json", byteLength: 4222,
  sha256: "63625a81b5e0f9e63c2858e0c57da4415627b18a19f073caf9bafc141b4d3da9" };
const FIRST_NAMES = { sourceQuotations: "source-quotations.json", firstUse: "first-use.json", budget: "budget-decision.json",
  scope: "scope.json", genesis: "genesis.json", inventory: "inventory.json", slotA: "slotA.json", provenance: "provenance.json" };
const need = (v, why) => { if (!v) throw new Error(`HOLD: ${why}`); };
const same = (a, b, why) => need(canonical(a) === canonical(b), why);
const copy = v => JSON.parse(canonical(v));
const take = r => { need(r.ok, (r.reasons || ["pure source refused"]).join("; ")); return r.value; };
const nat = n => Number.isSafeInteger(n) && n >= 0 && !Object.is(n, -0);
const text = s => typeof s === "string" && s.trim().length > 0;
const key = p => resolve(p).toLowerCase();
const identity = s => ({ dev: String(s.dev), ino: String(s.ino) });
function shape(v, names, where) {
  need(v !== null && typeof v === "object" && !Array.isArray(v), `${where}: object required`);
  need(Object.keys(v).length === names.length && names.every(n => Object.hasOwn(v, n)), `${where}: closed fields`);
}
function absent(path) { try { lstatSync(path); return false; } catch (e) { if (e?.code === "ENOENT") return true; throw e; } }
function noAlias(path, file = false) {
  exactPath(path); let cursor = resolve(path), first = true;
  for (;;) {
    const s = lstatSync(cursor);
    need(!s.isSymbolicLink() && (first && file ? s.isFile() && s.nlink === 1 : s.isDirectory()), "alias/unexpected path kind");
    need(key(realpathSync(cursor)) === key(cursor), "resolved alias");
    const parent = dirname(cursor); if (parent === cursor) return; cursor = parent; first = false;
  }
}
function readBytes(path) {
  noAlias(path, true); const before = lstatSync(path);
  need(nat(before.size) && before.size > 0 && before.size <= 16777216, "bounded nonempty file");
  const fd = openSync(path, "r"); let bytes;
  try {
    same(identity(fstatSync(fd)), identity(before), "file replaced on open"); bytes = readFileSync(fd);
    const after = fstatSync(fd);
    same(identity(after), identity(before), "file identity changed");
    need(after.size === before.size && after.mtimeMs === before.mtimeMs && after.ctimeMs === before.ctimeMs, "file changed during read");
  } finally { closeSync(fd); }
  const end = lstatSync(path); same(identity(end), identity(before), "file replaced after read");
  need(end.size === bytes.length && end.mtimeMs === before.mtimeMs && end.ctimeMs === before.ctimeMs, "file changed after read");
  return { bytes, pin: { path, byteLength: bytes.length, sha256: hash(bytes) } };
}
function pinShape(p) {
  shape(p, ["path", "byteLength", "sha256"], "file pin"); exactPath(p.path);
  need(nat(p.byteLength) && p.byteLength > 0 && p.byteLength <= 16777216 && /^[a-f0-9]{64}$/.test(p.sha256), "file pin value");
}
function readSourceArchive(p) {
  // RAW max128MiB/exact158 pin is separate from16MiB JSON and262144 REST bytes.
  // Hash compressed octets in1MiB chunks: no extraction, decode or REST embedding.
  shape(p, ["path", "byteLength", "sha256"], "source archive pin"); exactPath(p.path);
  need(nat(p.byteLength) && p.byteLength > 0 && p.byteLength <= RAW_SOURCE_MAX_BYTES, "RAW source archive exceeds128MiB bound");
  need(key(p.path) === key(SOURCE_ARCHIVE.path) && p.byteLength === SOURCE_ARCHIVE.byteLength
    && p.sha256 === SOURCE_ARCHIVE.sha256, "only parent158 ratified actual source archive");
  noAlias(p.path, true); const before = lstatSync(p.path);
  need(before.size > 0 && before.size <= RAW_SOURCE_MAX_BYTES && before.size === SOURCE_ARCHIVE.byteLength, "source archive actual size/bound differs");
  const digest = createHash("sha256"), chunk = Buffer.alloc(1048576), fd = openSync(p.path, "r");
  let count = 0;
  try {
    const opened = fstatSync(fd); same(identity(opened), identity(before), "archive replaced on open");
    need(opened.size === before.size, "archive size changed on open");
    while (count < before.size) {
      const n = readSync(fd, chunk, 0, Math.min(chunk.length, before.size - count), count);
      need(n > 0, "source archive truncated during hash"); digest.update(chunk.subarray(0, n)); count += n;
    }
    const after = fstatSync(fd); same(identity(after), identity(before), "archive identity changed");
    need(after.size === before.size && after.mtimeMs === before.mtimeMs && after.ctimeMs === before.ctimeMs, "archive changed during hash");
  } finally { closeSync(fd); }
  const end = lstatSync(p.path); same(identity(end), identity(before), "archive replaced after hash");
  need(end.size === before.size && end.mtimeMs === before.mtimeMs && end.ctimeMs === before.ctimeMs, "archive changed after hash");
  noAlias(p.path, true); const sha256 = digest.digest("hex");
  need(count === SOURCE_ARCHIVE.byteLength && sha256 === SOURCE_ARCHIVE.sha256, "actual RAW archive SHA differs from158");
  return { pin: { path: p.path, byteLength: count, sha256 } }; // No archive bytes retained in DATA.
}
function rawRef(f, kind = "rms-parent-file-bytes-v1") { return { kind, encoding: "raw-v1", byteLength: f.pin.byteLength, sha256: f.pin.sha256 }; }
function json(f) {
  need(!(f.bytes[0] === 239 && f.bytes[1] === 187 && f.bytes[2] === 191), "JSON BOM forbidden");
  const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(f.bytes), value = JSON.parse(utf8);
  assertExecutionJsonV1(value); return { ...f, utf8, value };
}
function boundFile(kind, file) {
  const d = doc(kind, file.value); need(d.utf8 === file.utf8 && d.ref.sha256 === file.pin.sha256, "canonical retained document bytes differ"); return d;
}

export function stageAndMaterializeNativeInputsV1(rawRequest) {
  let phase = "validate-static-inputs", stageAttempted = false, stageResult = null, outputCreated = false, ownPath = null, db;
  const readbacks = [], writes = [], createdOutputs = [], trace = [];
  let req, outputIdentity, outcome;
  const log = message => trace.push({ at: Date.now(), phase, message });
  const load = (p, expected) => {
    pinShape(p);
    if (expected) need(key(p.path) === key(expected.path) && p.byteLength === expected.byteLength && p.sha256 === expected.sha256, "retained pin differs");
    const f = readBytes(p.path); need(f.pin.byteLength === p.byteLength && f.pin.sha256 === p.sha256, "actual file pin mismatch"); readbacks.push(f.pin); return f;
  };
  const loadJson = (p, expected) => json(load(p, expected));
  const save = (name, value) => {
    need(outputCreated && /^[a-z][a-z0-9-]*\.json$/.test(name), "closed local output filename");
    noAlias(req.scope.outputDirectory); same(identity(lstatSync(req.scope.outputDirectory)), outputIdentity, "output directory replaced");
    const path = join(req.scope.outputDirectory, name), bytes = Buffer.from(canonical(value), "utf8");
    const fd = openSync(path, "wx", 0o600);
    createdOutputs.push(path); // A later write/readback failure must retain this partial path without inventing its hash.
    try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
    const f = readBytes(path); need(f.bytes.equals(bytes), "exclusive file readback differs"); writes.push(f.pin); return f;
  };
  try {
    assertExecutionJsonV1(rawRequest); req = copy(rawRequest);
    shape(req, ["version", "purpose", "scope", "pins", "serverSource"], "local runner request");
    need(req.version === "rms-stage-materialize-local-input-v1" && ["operational", "qa-nonadoptable"].includes(req.purpose), "explicit runner purpose");
    shape(req.scope, ["ownNamespace", "ownFileName", "outputDirectory", "directory", "registrationFile", "controllerId", "principalId", "actorId", "sessionId", "messageId", "permitId", "originId", "leaseMs", "expiresAt", "minRemainingMs"], "parent chosen scope");
    const s = req.scope;
    for (const p of [s.ownNamespace, s.outputDirectory, s.directory]) exactPath(p);
    if (s.registrationFile !== null) exactPath(s.registrationFile);
    need(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.sqlite$/.test(s.ownFileName) && /^ses_[A-Za-z0-9_]+$/.test(s.sessionId)
      && /^msg_[A-Za-z0-9_]+$/.test(s.messageId) && [s.controllerId, s.principalId, s.actorId, s.permitId, s.originId].every(text), "explicit closed parent labels");
    need(nat(s.leaseMs) && s.leaseMs > 0 && s.leaseMs <= 300000 && nat(s.expiresAt)
      && nat(s.minRemainingMs) && s.minRemainingMs > 0 && s.minRemainingMs <= s.leaseMs, "wall deadline/lease bounds");
    need(key(s.ownNamespace) !== key(s.outputDirectory) && !key(s.outputDirectory).startsWith(key(s.ownNamespace) + "\\")
      && !key(s.ownNamespace).startsWith(key(s.outputDirectory) + "\\"), "fresh OWN and output must be disjoint directories");
    if (req.purpose === "qa-nonadoptable") need(basename(s.ownNamespace).toLowerCase().includes("qa-")
      && basename(s.outputDirectory).toLowerCase().includes("qa-"), "QA namespaces must be explicitly labelled qa- and nonadoptable");
    need(!key(s.ownNamespace).includes("local-stage-qa-139"), "retained QA namespace cannot be adopted");
    noAlias(dirname(resolve(s.ownNamespace))); noAlias(dirname(resolve(s.outputDirectory)));
    need(absent(s.ownNamespace) && absent(s.outputDirectory), "fresh namespace/output only; no retry or adoption");
    shape(req.pins, ["productManifest", "sourceManifest", "intention", "firstReceipt", "firstFiles", "permissions", "preflightDecision", "permissionsReceipt", "compositionSources", "catalog", "processObservation", "mandate", "openapi"], "closed static pins");
    const productManifest = loadJson(req.pins.productManifest, PRODUCT_MANIFEST164), pm = productManifest.value;
    const actualCodeRoot = resolve(import.meta.dirname, "../../../..");
    exactPath(pm.candidateDirectory); noAlias(actualCodeRoot);
    need(pm.version === "rms-native-address-bridge-retained-candidate-v1" && pm.status === "PARENT_RETAINED_CORRECTIVE_CODE_ONLY_NOT_NATIVE_QUALIFIED"
      && pm.commit === "340386a9926f8afafc6dab6fe08f9a237afb2c75" && pm.baseCommit === "782ec396a2a7866d30645c32ca8ab864dcca5960"
      && pm.root === "tools/ff8-harness/" && key(actualCodeRoot) === key(pm.candidateDirectory), "retained340 scope/code root mismatch; never execute from old782 root");
    const productRoot = resolve(actualCodeRoot, "tools/ff8-harness"), productPaths = new Set();
    noAlias(productRoot);
    need(Array.isArray(pm.files) && pm.files.length === 19, "retained164 exact nineteen-file enumeration");
    const productFiles = pm.files.map(row => {
      shape(row, ["path", "bytes", "sha256"], "retained product file");
      need(typeof row.path === "string" && /^(src|test)\/[A-Za-z0-9_./-]+$/.test(row.path)
        && row.path.split("/").every(part => part && part !== "." && part !== "..")
        && !productPaths.has(row.path.toLowerCase()), "strict retained product path/duplicate");
      productPaths.add(row.path.toLowerCase());
      const path = resolve(productRoot, row.path);
      need(key(path).startsWith(key(productRoot) + "\\"), "retained product path escaped tools root");
      return load({ path, byteLength: row.bytes, sha256: row.sha256 });
    });
    need(["src/client.ts", "src/_native-function-identity.ts", "test/client.test.ts"].every(path => productPaths.has(path)), "retained helper/client/test entries required");
    const productManifestRef = rawRef(productManifest, "rms-native-address-bridge-retained-candidate-v1");
    // Parent158 ratified a distribution-associated archive referent, NOT
    // compiler inputs, memory equivalence or enforcement. Do not reimpose the
    // former loaded-source interpretation or silently substitute another asset.
    need(req.serverSource !== null, "parent158 source archive/chain inputs absent BEFORE stage");
    shape(req.serverSource, ["artifactPin", "meaning", "provenancePin", "decisionPin"], "parent158 source input");
    need(req.serverSource.meaning === "DISTRIBUTION_ASSOCIATED_SOURCE_ARCHIVE", "source field must retain exact parent158 meaning label");
    const sourceProvenance = loadJson(req.serverSource.provenancePin, PROVENANCE157);
    const sourceDecision = loadJson(req.serverSource.decisionPin, SOURCE_DECISION158), sd = sourceDecision.value, sp = sourceProvenance.value;
    need(sd.version === "rms-parent-server-source-field-decision-v1" && sd.decision === "RATIFIED_FOR_BOUNDED_COUPLING_QUALIFICATION_ONLY"
      && sd.field === "server.sourceSha256" && sd.distribution.tag === "v2.2.1"
      && sd.distribution.commit === "3ebcf9a32c7b28f658cfee80775448929361727a", "actual158 scope/distribution");
    same(sd.sourceArtifact, { ...SOURCE_ARCHIVE, kind: "rms-distribution-associated-source-archive-v1", encoding: "raw-v1" }, "158 exact RAW source referent");
    need(key(sd.provenanceFile.path) === key(sourceProvenance.pin.path), "158 actual provenance path");
    same(sd.provenanceFile.ref, rawRef(sourceProvenance, "rms-server-release-source-provenance-v1"), "158 links actual157 bytes");
    need(sp.version === "rms-server-release-source-provenance-v1" && sp.publicRelease.resolvedTagCommit === sd.distribution.commit
      && sp.desktopAssetComparison.matchesBundledAndInstalled === true
      && sp.desktopAssetComparison.binaryEntrySha256 === sd.distribution.binarySha256, "157 desktop chain scope differs");
    same({ path: sp.releaseSourceArtifact.path, byteLength: sp.releaseSourceArtifact.byteLength, sha256: sp.releaseSourceArtifact.sha256 }, SOURCE_ARCHIVE, "157 actual archive pin");
    const sourceArtifact = readSourceArchive(req.serverSource.artifactPin); readbacks.push(sourceArtifact.pin);
    const ownProgram = readBytes(import.meta.path); readbacks.push(ownProgram.pin);
    load(STAGE, STAGE); // Parent must independently pin the actual imported file before invocation too.
    const pins = req.pins, manifest = loadJson(pins.sourceManifest, MANIFEST), intention = loadJson(pins.intention, INTENTION);
    const sourcePin = name => {
      const rows = manifest.value.files.filter(p => basename(p.path).toLowerCase() === name.toLowerCase()); need(rows.length === 1, "retained V3 pin lookup"); return rows[0];
    };
    const body = loadJson(sourcePin("body.json")), independent = loadJson(sourcePin("independentSources.json")), policy = loadJson(sourcePin("policy.json"));
    const q = { body: body.value, independentSources: independent.value, policy: policy.value };
    take(bindExecutionPreparationV1(q.body, q.independentSources, q.policy));
    const planningDoc = q.body.rootBootstrapSources.planning, origin = take(sealExecutionEnvelopeV1({ ...q.body, planning: planningDoc }));
    const bound = take(bindExecutionSourcesV1(origin, q.independentSources)), run = take(makeGraphRunV3(origin)).document;
    const sourceRequest = doc("rms-native-source-request-v1", q), i = intention.value;
    same(sourceRequest.ref, i.sourceRequestRef, "retained source request"); same(run.ref, i.runRef, "retained run"); same(planningDoc.ref, i.planningRef, "retained planning");
    const planning = JSON.parse(planningDoc.utf8), unit = planning.units.find(u => u.unitId === i.unitId);
    need(unit && planning.plan.selectedUnitIds.length === 1 && planning.plan.selectedUnitIds[0] === i.unitId, "exact selected singleton");
    const sub = unit.subIntents.find(x => x.subIntentId === i.admissionIntention.subIntentId && x.role === "A");
    need(sub && !Object.hasOwn(i.admissionIntention.command.metadata, "rmsBinding") && i.finalImage === null && i.permit === null, "retained pre-ownership A intention");
    const scope = { missionId: q.body.missionId, lineageId: q.body.generation.lineageId, rootAccountId: q.body.admissionSource.budgetLineage.rootAccountId,
      rootAllocationRef: q.body.admissionSource.budgetLineage.rootAllocationRef, planningRef: planningDoc.ref, generationId: origin.generationId };
    const fi = { sha256: sub.harnessIdentity.sha256, version: sub.harnessIdentity.version, ea: Number(BigInt(sub.harnessIdentity.ea)) };
    same(fi, { sha256: "6356b01f78a791926d2fbce72456364c6c7ed17b7839736dc4249e5e3dbd3020", version: "rms-qualification-x86-fixture-v3", ea: 268435712 }, "frozen V3 only");
    // Use the SAME internal matcher as retained340, after its actual code pins
    // and root were checked. Source782 documents remain historical inputs.
    const sourceLimits = JSON.parse(q.body.admissionSource.budgetLineage.rootLimits.utf8);
    need(sourceLimits.rootSlotGrants, "source root slot bounds missing");
    const sourceSlots = JSON.parse(sourceLimits.rootSlotGrants.utf8);
    const entryBound = sourceSlots.grants.find(g => g.slot.rootAccountId === scope.rootAccountId && g.slot.role === "A" && g.slot.pass === 1
      && sourceNativeFunctionIdentityMatchesV1(g.slot.functionIdentity, fi));
    need(entryBound && entryBound.bodyCapUtf8Bytes >= 262144 && entryBound.reservedDebitUtf8Bytes >= 262144,
      "retained340 source/native identity or root/role/pass/body/debit bounds refused before stage");
    shape(pins.firstFiles, Object.keys(FIRST_NAMES), "eight retained151 files");
    need(key(pins.firstReceipt.path) === key(C + "first-acquisition-151/receipt.json"), "actual153 receipt path");
    const firstReceipt = loadJson(pins.firstReceipt);
    need(Array.isArray(firstReceipt.value.created) && firstReceipt.value.created.length === 8, "retained eight-file materialization receipt");
    const first = {};
    for (const [name, filename] of Object.entries(FIRST_NAMES)) {
      const p = pins.firstFiles[name]; need(key(p.path) === key(C + "first-acquisition-151/" + filename), "retained151 path");
      const receiptPin = firstReceipt.value.created.find(p => key(p.path) === key(pins.firstFiles[name].path));
      need(receiptPin, "151 pin absent from actual receipt"); first[name] = loadJson(p, receiptPin);
    }
    for (const name of ["sourceQuotations", "firstUse", "budget", "scope", "genesis", "slotA", "provenance"]) same(first[name].value.scope, scope, "151 scope differs");
    const scopeDocument = boundFile("rms-first-acquisition-parent-scope-v1", first.scope);
    const genesis = boundFile("rms-first-acquisition-parent-genesis-v1", first.genesis);
    const inventory = boundFile("rms-native-inventory-attribution-v1", first.inventory);
    const provenance = boundFile("rms-first-acquisition-parent-provenance-v1", first.provenance);
    const slot = first.slotA.value, budget = first.budget.value.grant, inv = first.inventory.value;
    need(slot.role === "A" && slot.pass === 1 && slot.capUtf8Bytes === 262144 && slot.acquiredUtf8Bytes === 262144
      && slot.encumberedUtf8Bytes === 0 && slot.spentUtf8Bytes === 0 && slot.burnedUtf8Bytes === 0 && text(slot.slotKey), "new A-only slot counters/bounds");
    same(slot.functionIdentity, fi, "151 A identity");
    for (const name of ["slotKey", "functionIdentity", "role", "pass", "capUtf8Bytes", "acquiredUtf8Bytes"]) same(slot[name], budget[name], "151 budget/slot mismatch");
    need(first.firstUse.value.userStatement === "on ne s'est jamais servi de RMS" && first.genesis.value.rootRevision === 0
      && first.genesis.value.headRevision === 0 && first.genesis.value.origins.length === 0
      && inv.rootAccountId === scope.rootAccountId && inv.missionId === scope.missionId && inv.lineageId === scope.lineageId
      && inv.origins.length === 0 && inv.unresolved.length === 0 && first.sourceQuotations.value.scopeUnresolved.length === 0, "closed first-use genesis, not copied operative history");
    const rights = loadJson(pins.permissions, RIGHTS), decision = loadJson(pins.preflightDecision, DECISION);
    need(key(pins.permissionsReceipt.path) === key(C + "permissions-155/receipt.json"), "permissions155 receipt path");
    const permissionsReceipt = loadJson(pins.permissionsReceipt);
    for (const f of [rights, decision]) need(permissionsReceipt.value.files?.some(p => key(p.path) === key(f.pin.path)
      && p.sha256 === f.pin.sha256 && p.byteLength === f.pin.byteLength), "155 receipt file mismatch");
    const r = rights.value, rightsDocument = boundFile("rms-native-permission-scope-evidence-v1", rights);
    need(r.version === "rms-native-permission-scope-evidence-v1" && r.scope === "bounded-coupling-qualification-only"
      && r.unknowns.length === 0 && Array.isArray(r.nativeExerciseRefs) && r.compositionRefs.length > 0, "retained declared preflight scope");
    same(permissionsReceipt.value.permissionsEvidenceRef, rightsDocument.ref, "155 canonical rights ref");
    need(decision.value.missionId === scope.missionId && Array.isArray(pins.compositionSources), "scope decision/composition pins");
    const composition = pins.compositionSources.map(p => load(p));
    for (const cr of r.compositionRefs) need([...composition, decision].some(f => f.pin.byteLength === cr.byteLength && f.pin.sha256 === cr.sha256), "composition ref lacks actual pinned bytes");
    const catalog = loadJson(pins.catalog, { path: C + "evidence/native-catalog-preparation-readback-20261030.json", byteLength: 2215,
      sha256: "5f527fa8dd051ff723a18349dd0fd9744687a8c43c3c252b1c08825e1b98576a" });
    need(key(s.directory) === key(catalog.value.location), "parent directory differs from retained scoped catalog");
    const a = i.admissionIntention, model = catalog.value.selectedDeclaredModel;
    same(r.model, a.command.model, "rights model"); same(r.sessionRules, i.proposedSessionRules, "rights session rules");
    same(r.agentRules, catalog.value.selectedDeclaredProfile.permissions, "rights agent rules");
    need(r.profile === a.command.profile && r.profile === "general" && catalog.value.selectedDeclaredProfile.mode === "subagent", "profile mode");
    const modelDocument = doc("rms-native-model-catalog-entry-v1", { id: model.id, modelID: model.modelID, providerID: model.providerID,
      enabled: model.enabled, status: model.status, variants: model.variants, capabilities: model.capabilities });
    const processEvidence = loadJson(pins.processObservation);
    need(key(pins.processObservation.path) === key(C + "evidence/native-process-binary-refresh-155.json")
      && processEvidence.value.pid === 31584 && processEvidence.value.binarySha256 === "9ecb888ec3b28a393782269f531d1528ea21ff940f694752717e48a77b90527e", "retained current155 binary observation");
    need(sd.distribution.binarySha256 === processEvidence.value.binarySha256, "158 distribution binary differs from155 observed executable");
    const mandate = load(pins.mandate), openapi = loadJson(pins.openapi);
    need(openapi.pin.sha256 === "b2b8c4cfd4ba7e4f4566481628aa22527935351d461fca29646a1df37ed5a37f", "retained actual OpenAPI pin required");
    const server = { version: "2.2.1", pid: processEvidence.value.pid, binarySha256: processEvidence.value.binarySha256,
      sourceSha256: sourceArtifact.pin.sha256, openapiSha256: openapi.pin.sha256 };
    need(s.expiresAt - Date.now() >= s.minRemainingMs && s.expiresAt <= Date.now() + s.leaseMs, "deadline not ready BEFORE lease");
    // Stage itself performs the already-qualified raw/proof/code/actual-input
    // reload before its first lease. This runner never regenerates source136.
    log("static pins/scope/source meaning/deadline closed before any lease");
    phase = "exclusive-local-output-create";
    need(absent(s.ownNamespace) && absent(s.outputDirectory), "namespace appeared; no retry");
    mkdirSync(s.outputDirectory, { mode: 0o700 }); outputCreated = true; outputIdentity = identity(lstatSync(s.outputDirectory));
    const stageRequest = { version: "rms-stage-local-reservation-request-v1", sourceManifestPin: MANIFEST,
      expected: { missionId: scope.missionId, unitId: i.unitId, sourceRequestRef: sourceRequest.ref, runRef: run.ref, planningRef: planningDoc.ref },
      ownNamespace: s.ownNamespace, ownFileName: s.ownFileName, controllerId: s.controllerId, leaseMs: s.leaseMs };
    save("stage-request.json", stageRequest);
    phase = "existing-validated-stage-once"; stageAttempted = true;
    stageResult = stageLocalReservationV1(stageRequest);
    save("stage-result.json", stageResult);
    need(stageResult.status === "LOCAL_RESERVED_NATIVE_HOLD", "existing stage refused; preserve partial OWN/output");
    ownPath = stageResult.ownPath;
    need(key(ownPath) === key(join(s.ownNamespace, s.ownFileName)), "actual staged OWN path");
    const ownIdentity = identity(lstatSync(ownPath)), namespaceIdentity = identity(lstatSync(s.ownNamespace));
    db = new Database(ownPath, { readonly: true, strict: true });
    const current = () => {
      noAlias(ownPath, true); noAlias(s.ownNamespace);
      same(identity(lstatSync(ownPath)), ownIdentity, "OWN file replaced"); same(identity(lstatSync(s.ownNamespace)), namespaceIdentity, "OWN namespace replaced");
      return db.transaction(() => {
        const m = db.query("SELECT revision,lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(scope.missionId);
        const f = db.query("SELECT owner,token,expires_event,state,resources FROM ff8_unit_leases WHERE mission=? AND unit_id=?").get(scope.missionId, i.unitId);
        const p = db.query("SELECT plan_id,revision FROM ff8_graph_active_plan WHERE mission=?").get(scope.missionId);
        const u = db.query("SELECT unit_id,state,revision,digest FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(scope.missionId, i.unitId);
        const cursor = db.query("SELECT sequence,time FROM ff8_graph_streams WHERE mission=?").get(scope.missionId);
        need(m && f && p && u && cursor, "current OWN rows missing");
        const controller = { missionId: scope.missionId, owner: m.lease_owner, token: m.lease_token, expiresAt: m.lease_until };
        const family = { missionId: scope.missionId, unitId: i.unitId, owner: f.owner, token: f.token,
          expiresAtEvent: f.expires_event, state: f.state, resourceKeys: JSON.parse(f.resources) };
        same(controller, stageResult.durable.controller, "controller changed after stage"); same(family, stageResult.durable.family, "family changed after stage");
        same(m.revision, stageResult.durable.missionRevision, "mission revision changed");
        same({ sequence: cursor.sequence, time: cursor.time }, stageResult.durable.eventCursor, "event cursor changed");
        need(controller.owner === s.controllerId && controller.expiresAt > Date.now() && s.expiresAt <= controller.expiresAt
          && Date.now() < s.expiresAt && family.state === "active" && cursor.sequence < family.expiresAtEvent
          && u.state === "RESERVED" && p.plan_id === planning.plan.planId && p.revision === stageResult.durable.activePlan.revision
          && u.revision === stageResult.durable.selectedUnit.revision && u.digest === stageResult.durable.selectedUnit.immutableDigest, "current fence/plan/deadline/event TTL mismatch");
        need(db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_roots WHERE mission=? OR root_id=?").get(scope.missionId, scope.rootAccountId).n === 0
          && db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_bindings WHERE mission=? AND binding_id LIKE 'root-acquisition:%'").get(scope.missionId).n === 0,
          "first acquisition cannot replace current root/decision");
        const claims = db.query("SELECT resource_key,unit_id,token FROM ff8_unit_claims WHERE mission=? ORDER BY resource_key").all(scope.missionId);
        same(claims.map(c => c.resource_key), [...family.resourceKeys].sort(), "canonical claim set changed");
        need(claims.every(c => c.unit_id === i.unitId && c.token === family.token), "canonical claim fence changed");
        return { ownPath, scope, observedAt: Date.now(), controller, family, missionRevision: m.revision,
          activePlan: { planId: p.plan_id, revision: p.revision }, selectedUnit: { unitId: u.unit_id, state: u.state, revision: u.revision, digest: u.digest },
          eventCursor: { sequence: cursor.sequence, time: cursor.time }, rootQuery: "mission=? OR root_id=?; zero rows observed",
          acquisitionQuery: "mission=? AND binding_id LIKE root-acquisition:%; zero rows observed", purpose: req.purpose,
          meaning: "Actual LOCAL OWN controller/family/claims only; not distant quota, native session allocation, quiescence or physical worker allocation" };
      })();
    };
    phase = "current-readback-and-materialization";
    const observation = current(); need(s.expiresAt - Date.now() >= s.minRemainingMs, "insufficient remaining deadline after stage; HOLD without renewal");
    const ownershipFile = save("ownership-readback.json", observation), ownershipRef = rawRef(ownershipFile, "rms-local-ownership-readback-v1");
    const guardedSave = (name, value) => { current(); const f = save(name, value); current(); return f; };
    guardedSave("source-request.json", q); guardedSave("run.json", JSON.parse(run.utf8)); guardedSave("model-catalog-entry.json", JSON.parse(modelDocument.utf8));
    const admission = copy(a);
    admission.command.metadata.rmsBinding = { version: "rms-native-admission-binding-v1", missionId: scope.missionId, unitId: i.unitId,
      functionId: sub.functionId, subIntentId: sub.subIntentId, role: "A", runRef: run.ref,
      familyFence: observation.family.token, controllerFence: observation.controller.token };
    const wire = encodeNativeAdmissionWireV1(admission, { sessionId: s.sessionId, messageId: s.messageId, directory: resolve(s.directory), permissions: r.sessionRules });
    need(wire.totalBodyUtf8Bytes <= 262144, "exact emitted body exceeds A cap/debit");
    const admissionFile = guardedSave("admission.json", admission); guardedSave("wire.json", wire);
    const grant = { slotKey: slot.slotKey, functionIdentity: fi, role: "A", pass: 1, capUtf8Bytes: 262144, acquiredUtf8Bytes: 262144, provenanceRef: provenance.ref };
    const acquisition = { version: "rms-native-root-acquisition-v1", mode: "first-acquisition", priorAuthority: "no-linked-prior-authority-established",
      allocationRef: scope.rootAllocationRef, planningRef: planningDoc.ref, attributionRef: scopeDocument.ref, inventory, grants: [grant],
      root: { version: "rms-native-root-ledger-v1", missionId: scope.missionId, lineageId: scope.lineageId, rootAccountId: scope.rootAccountId,
        revision: 0, generationId: scope.generationId, headRevision: 0, controllerFence: observation.controller.token, historyRef: genesis.ref, origins: [],
        slots: [{ slotKey: slot.slotKey, capUtf8Bytes: 262144, acquiredUtf8Bytes: 262144, encumberedUtf8Bytes: 0, spentUtf8Bytes: 0, burnedUtf8Bytes: 0 }] } };
    // Honest pre-issuer JSON: NOT a complete NativeRootLedgerV1 and no cast.
    // First-mode private issuer fills the missing grantRef before validation.
    const acquisitionFile = guardedSave("acquisition-preissuer.json", acquisition), imageSha256 = hash(canonical(wire));
    const expected = { missionId: scope.missionId, unitId: i.unitId, executionId: admission.executionId, runRef: run.ref, imageSha256 };
    const permit = { version: "rms-native-local-permit-v1", expected,
      permit: { version: "rms-native-qualification-permit-v1", ...expected, originId: s.originId, slotKey: slot.slotKey, maxBodyUtf8Bytes: 262144,
        proofRefs: [scopeDocument.ref, provenance.ref, rawRef(decision), rawRef(processEvidence), ownershipRef, productManifestRef,
          rawRef(sourceProvenance, "rms-server-release-source-provenance-v1"), rawRef(sourceDecision, "rms-parent-server-source-field-decision-v1")], physicalOwnershipRef: ownershipRef },
      server, sourceRefs: [sourceRequest.ref, run.ref, productManifestRef, rawRef(sourceArtifact, "rms-distribution-associated-source-archive-v1"), rawRef(openapi, "rms-native-openapi-bytes-v1"),
        rawRef(sourceProvenance, "rms-server-release-source-provenance-v1"), rawRef(sourceDecision, "rms-parent-server-source-field-decision-v1")],
      permissionsEvidenceRef: rightsDocument.ref, profile: r.profile, model: r.model, permissions: r.sessionRules,
      agentMode: catalog.value.selectedDeclaredProfile.mode, agentPermissions: r.agentRules, modelCatalogRef: modelDocument.ref,
      sourceRequestRef: sourceRequest.ref, functionIdentity: fi, role: "A" };
    const permitFile = guardedSave("permit.json", permit);
    const config = { version: "rms-parent-native-request-v1", missionId: scope.missionId, ownPath, directory: resolve(s.directory),
      controllerId: s.controllerId, principalId: s.principalId, actorId: s.actorId, mandateRef: rawRef(mandate), leaseMs: s.leaseMs,
      body: body.pin, independentSources: independent.pin, policy: policy.pin, admission: admissionFile.pin, acquisition: acquisitionFile.pin,
      permit: permitFile.pin, permissionsEvidence: rights.pin, rootAccountId: scope.rootAccountId, permitId: s.permitId, unitId: i.unitId,
      sessionId: s.sessionId, messageId: s.messageId, expiresAt: s.expiresAt,
      ...(s.registrationFile === null ? {} : { registrationFile: s.registrationFile }) };
    const configFile = guardedSave(req.purpose === "operational" ? "native-request.json" : "qa-native-request-nonadoptable.json", config);
    current(); need(s.expiresAt - Date.now() >= s.minRemainingMs, "deadline margin exhausted during materialization; preserve files without retry");
    const finalStatus = req.purpose === "operational" ? "LOCAL_INPUTS_READY_PARENT_ACTS_ONLY" : "QA_NONADOPTABLE_LOCAL_INPUTS_ONLY";
    const receipt = { version: "rms-stage-materialize-local-receipt-v1", status: "LOCAL_MATERIALIZATION_CHECKPOINT_NOT_FINAL",
      purpose: req.purpose, programPin: ownProgram.pin, requestDigest: hash(canonical(req)), ownPath, configPin: configFile.pin,
      sourceReadbacks: readbacks, materialized: [...writes], sourceMeaning: req.serverSource.meaning, sourceArtifactPin: sourceArtifact.pin,
      productManifestPin: productManifest.pin, productManifestRef, actualCodeRoot, runtimeCommitDeclared: pm.commit, runtimeBaseCommit: pm.baseCommit,
      checkedProductFiles: productFiles.map(f => f.pin),
      sourceFieldInterpretation: sd.meaning, sourceProvenancePin: sourceProvenance.pin, sourceDecisionPin: sourceDecision.pin,
      sourceNotProven: sd.notProven, sourceProvenanceLimits: sp.limits, sourceEquivalenceVerifiedByRunner: false,
      actualController: observation.controller, actualFamily: observation.family, remainingWallMs: s.expiresAt - Date.now(),
      wireSha256: imageSha256, admissionSha256: hash(canonical(admission)), wireBodyBytes: wire.totalBodyUtf8Bytes,
      createBodySha256: wire.create.sha256, promptBodySha256: wire.prompt.sha256, trace,
      grantRef: "ABSENT_PREISSUER_API_FILLS", runnerIssuerCalls: 0, runnerNetworkCalls: 0, runnerOriginsCommitted: 0,
      globalNativeState: "NOT_ASSERTED", warning: "Checkpoint only: a later check/close may still HOLD; parent native entry result is required. No issuer/service/prepare called. Recheck current deadline/ownership before direct client.ts actions. QA is NEVER operationally adoptable." };
    guardedSave("receipt.json", receipt);
    const finalObservation = current();
    need(s.expiresAt - Date.now() >= s.minRemainingMs, "deadline margin exhausted before return");
    outcome = { status: finalStatus, ownPath, stageAttempted, outputCreated, outputDirectory: s.outputDirectory, createdOutputs, materialized: writes, remainingWallMs: s.expiresAt - Date.now(),
      actualController: finalObservation.controller, actualFamily: finalObservation.family, trace, nativeAuthority: "NONE_ISSUED_BY_RUNNER" };
  } catch (error) {
    outcome = { status: stageAttempted ? "HOLD_PRESERVE_PARTIAL_LOCAL_STAGE" : "HOLD_BEFORE_STAGE", phase, stageAttempted, outputCreated, ownPath,
      outputDirectory: req?.scope?.outputDirectory ?? null, createdOutputs,
      stageResult, sourceReadbacks: readbacks, materialized: writes, trace, failure: String(error?.message ?? error).slice(0, 2000),
      recovery: "Preserve partial OWN/output/WAL/SHM; no reset/delete/retry/adopt/release/renew. Parent receipt and actual current inspection govern any next action.", nativeAuthority: "NONE_ISSUED_BY_RUNNER" };
  } finally {
    try { db?.close(); }
    catch (error) { outcome = { ...outcome, status: "HOLD_PRESERVE_PARTIAL_LOCAL_STAGE", closeFailure: String(error?.message ?? error).slice(0, 2000) }; }
  }
  // A slow successful close can exhaust a previously checked margin. Observe
  // actual wall time AFTER finally; never reopen/reacquire to refresh this fact.
  if (outcome?.status === "LOCAL_INPUTS_READY_PARENT_ACTS_ONLY" || outcome?.status === "QA_NONADOPTABLE_LOCAL_INPUTS_ONLY") {
    const observedAt = Date.now(), deadline = req.scope.expiresAt, controllerExpiry = outcome.actualController.expiresAt;
    const remainingWallMs = deadline - observedAt;
    const valid = nat(observedAt) && nat(controllerExpiry) && deadline <= controllerExpiry
      && observedAt < deadline && observedAt < controllerExpiry && remainingWallMs >= req.scope.minRemainingMs;
    trace.push({ at: observedAt, phase: "post-close-deadline-check", message: valid ? "post-close deadline/margin current" : "post-close deadline/controller/margin refused; preserve partial" });
    outcome = { ...outcome, postCloseObservedAt: observedAt, remainingWallMs, knownControllerRemainingWallMs: controllerExpiry - observedAt };
    if (!valid) outcome = { ...outcome, status: "HOLD_PRESERVE_PARTIAL_LOCAL_STAGE", phase: "post-close-deadline-check",
      failure: "deadline/controller expired, inconsistent or insufficient margin AFTER close",
      recovery: "Preserve OWN/output/claims and partial files; checkpoint is NOT final success. No reopen/acquire/retry/renew/release; parent current inspection governs next action." };
  }
  assertExecutionJsonV1(outcome); return outcome;
}

if (import.meta.main) {
  // Explicit parent LOCAL execution only; unlike client.ts this cannot mint
  // an issuer. Actual native tool receipt is captured externally by parent.
  try {
    need(process.argv.length === 3, "usage: bun stage-materialize-native-inputs.mjs <parent-request.json>");
    const requestFile = json(readBytes(resolve(process.argv[2])));
    need(requestFile.utf8 === canonical(requestFile.value), "runner request must be exact canonical JSON");
    const result = stageAndMaterializeNativeInputsV1(requestFile.value);
    console.log(JSON.stringify({ requestPin: requestFile.pin, result }));
    if (result.status.startsWith("HOLD")) process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify({ status: "HOLD_LOCAL_ENTRY", failure: String(error?.message ?? error).slice(0, 2000) })); process.exitCode = 1;
  }
}
