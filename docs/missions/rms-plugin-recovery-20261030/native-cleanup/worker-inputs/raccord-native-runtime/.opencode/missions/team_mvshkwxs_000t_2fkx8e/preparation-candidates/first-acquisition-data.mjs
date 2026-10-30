/** Inspection candidate: DATA composition only, never authority or an issuer.
 * Parent independently loads/pins files; digest agreement cannot authenticate a
 * filesystem read, a DB observation, an OS role or a native tool invocation.
 * No filesystem, clock, CLI, Store, transport or operational API in this module.
 */
import { assertExecutionJsonV1, makeBoundDocumentV1 as doc, executionValueRefV1,
  bindExecutionPreparationV1, sealExecutionEnvelopeV1, bindExecutionSourcesV1,
  makeGraphRunV3 } from "../../../../tools/ff8-harness/src/graph-execution-envelope.ts";
import { canonical, hash, exactPath } from "../../../../tools/ff8-harness/src/validation.ts";

const ROOT = "C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e/";
const MANIFEST = { path: ROOT + "native-preparation-136/source-bundle-v3/manifest.json", byteLength: 2806,
  sha256: "34ffa53959bf44e6023071d4f27fb939732c719bf2bad681a1bea1e877410d68" };
const INTENTION = { path: ROOT + "native-preparation-136/admission-a-static-intention.json", byteLength: 24112,
  sha256: "2f3425aceead82f6bfd5edb0df3c3c209d4dec121c3ff112f66ed2e65c8a8f24" };
const CATALOG = { path: ROOT + "evidence/native-catalog-preparation-readback-20261030.json", byteLength: 2215,
  sha256: "5f527fa8dd051ff723a18349dd0fd9744687a8c43c3c252b1c08825e1b98576a" };
const QUOTES = [
  ["reports/107-premiere-acquisition-possible-sans-reset-ni-autorite-fictive.md", 3224, "d34f372d31e2c21174aef4c96f3e22eab67f2981edd39d6bb554eec522e9da46"],
  ["reports/109-entree-locale-parent-concrete-autorisee.md", 2888, "3e928d4895505a2eff1e53d999422f167f3bdd9ba028997077c9b301dfda5636"],
  ["reports/143-intention-statique-retenue-verification-bornee-des-pieces-historiques.md", 2916, "60ae8a2849e42c9b5f1d96e9925a60a51782dd7c496c7bb1b02b4c419280ca6f"]
];
const need = (ok, why) => { if (!ok) throw new Error(`HOLD: ${why}`); };
const same = (a, b, why) => need(canonical(a) === canonical(b), why);
const take = r => { need(r.ok, (r.reasons || ["pure binder refused"]).join("; ")); return r.value; };
const key = p => { need(typeof p === "string" && p.length > 0, "path string required"); return p.replaceAll("\\", "/").toLowerCase(); };
const text = x => typeof x === "string" && x.trim().length > 0;
const integer = x => Number.isSafeInteger(x) && x >= 0 && !Object.is(x, -0);
function shape(x, names, where) {
  need(x !== null && typeof x === "object" && !Array.isArray(x), `${where}: object required`);
  need(Object.keys(x).length === names.length && names.every(n => Object.hasOwn(x, n)), `${where}: closed fields required`);
}
function strings(x, where) {
  need(Array.isArray(x) && x.every(text) && new Set(x).size === x.length, `${where}: unique nonempty strings required`);
}
function ref(x) {
  shape(x, ["kind", "encoding", "byteLength", "sha256"], "ByteRef");
  need(text(x.kind) && ["raw-v1", "utf8-json-v1"].includes(x.encoding) && integer(x.byteLength)
    && x.byteLength > 0 && /^[a-f0-9]{64}$/.test(x.sha256), "ByteRef value");
}
function image(x, expected) {
  shape(x, ["path", "base64", "byteLength", "sha256"], "parent-loaded file image"); exactPath(x.path);
  need(integer(x.byteLength) && x.byteLength > 0 && x.byteLength <= 16777216 && /^[a-f0-9]{64}$/.test(x.sha256), "bounded image pin");
  need(typeof x.base64 === "string" && x.base64.length === 4 * Math.ceil(x.byteLength / 3)
    && /^[A-Za-z0-9+/]+={0,2}$/.test(x.base64), "canonical bounded base64");
  const bytes = Buffer.from(x.base64, "base64");
  need(bytes.length === x.byteLength && bytes.toString("base64") === x.base64 && hash(bytes) === x.sha256, "actual supplied bytes/pin differ");
  if (expected) need(key(x.path) === key(expected.path) && x.byteLength === expected.byteLength && x.sha256 === expected.sha256, "retained file pin/path differs");
  return { bytes, pin: { path: x.path, byteLength: x.byteLength, sha256: x.sha256 },
    rawRef: { kind: "rms-parent-file-bytes-v1", encoding: "raw-v1", byteLength: bytes.length, sha256: hash(bytes) } };
}
function readJson(x, expected, canonicalOnly = false) {
  const f = image(x, expected);
  need(!(f.bytes[0] === 239 && f.bytes[1] === 187 && f.bytes[2] === 191), "BOM forbidden");
  const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(f.bytes);
  const value = JSON.parse(utf8); assertExecutionJsonV1(value);
  // New local input schemas use the EXISTING canonical codec. Requiring exact
  // canonical bytes also refuses duplicate-key JSON, without a new JSON codec.
  if (canonicalOnly) need(canonical(value) === utf8, "new parent DATA must be exact canonical JSON, no duplicate keys/pretty-print");
  return { ...f, utf8, value };
}
function finish(value) { assertExecutionJsonV1(value); return JSON.parse(canonical(value)); }

/** All image arguments describe independently loaded REAL files, not desired
 * future paths. The three not-yet-materialized parent files MUST be null.
 * Present but contradictory inputs throw HOLD; missing ones return scoped HOLD.
 */
export function prepareFirstAcquisitionDataV1(input) {
  assertExecutionJsonV1(input);
  shape(input, ["version", "files", "firstUse", "budget", "sourceQuotations", "resourceFiles"], "static request");
  need(input.version === "rms-first-acquisition-data-input-v1", "static request version");
  shape(input.files, ["manifest", "body", "independentSources", "policy", "intention", "catalog", "quotationSources"], "retained inputs");
  const f = input.files, manifest = readJson(f.manifest, MANIFEST), intention = readJson(f.intention, INTENTION), catalog = readJson(f.catalog, CATALOG);
  const pins = manifest.value.files;
  need(Array.isArray(pins) && pins.length === 5, "retained manifest file set");
  const source = name => { const p = pins.filter(p => key(p.path).endsWith("/" + key(name))); need(p.length === 1, "unique retained source pin"); return p[0]; };
  const body = readJson(f.body, source("body.json")), independent = readJson(f.independentSources, source("independentSources.json")), policy = readJson(f.policy, source("policy.json"));
  const q = { body: body.value, independentSources: independent.value, policy: policy.value };
  take(bindExecutionPreparationV1(q.body, q.independentSources, q.policy));
  const planningDoc = q.body.rootBootstrapSources.planning;
  const origin = take(sealExecutionEnvelopeV1({ ...q.body, planning: planningDoc }));
  const bound = take(bindExecutionSourcesV1(origin, q.independentSources));
  const run = take(makeGraphRunV3(origin)).document, retained = intention.value, planning = JSON.parse(planningDoc.utf8);
  same(doc("rms-native-source-request-v1", q).ref, retained.sourceRequestRef, "retained intention source differs");
  same(run.ref, retained.runRef, "retained run differs"); same(planningDoc.ref, retained.planningRef, "retained planning differs");
  const scope = { missionId: q.body.missionId, lineageId: q.body.generation.lineageId,
    rootAccountId: q.body.admissionSource.budgetLineage.rootAccountId,
    rootAllocationRef: q.body.admissionSource.budgetLineage.rootAllocationRef,
    planningRef: planningDoc.ref, generationId: origin.generationId };
  need(scope.rootAccountId === executionValueRefV1("l8-budget-root-v1", { missionId: scope.missionId, lineageId: scope.lineageId,
    rootAllocationRef: scope.rootAllocationRef }).sha256, "R must derive from retained M/L/AR");
  const a = retained.admissionIntention, unit = planning.units.find(u => u.unitId === retained.unitId);
  need(unit && planning.plan.selectedUnitIds.length === 1 && planning.plan.selectedUnitIds[0] === unit.unitId && a.role === "A", "exact selected A unit");
  const sub = unit.subIntents.find(s => s.subIntentId === a.subIntentId && s.role === "A");
  need(sub && a.command.profile === "general" && !Object.hasOwn(a.command.metadata, "rmsBinding") && retained.finalImage === null
    && retained.permit === null && retained.nativeAuthority === "HOLD", "intention is pre-ownership only");
  const functionIdentity = { sha256: sub.harnessIdentity.sha256, version: sub.harnessIdentity.version, ea: Number(BigInt(sub.harnessIdentity.ea)) };
  same(functionIdentity, { sha256: "6356b01f78a791926d2fbce72456364c6c7ed17b7839736dc4249e5e3dbd3020",
    version: "rms-qualification-x86-fixture-v3", ea: 268435712 }, "frozen V3 function, not cluster147/combat149");
  const model = { providerID: "openai", id: "gpt-6.1-sol", variant: "high" };
  same(a.command.model, model, "retained model"); same(catalog.value.selectedForProspectivePreparation, model, "declared catalog selection");
  need(catalog.value.selectedDeclaredProfile.id === "general" && catalog.value.selectedDeclaredProfile.mode === "subagent", "declared profile");
  need(Array.isArray(f.quotationSources) && f.quotationSources.length === QUOTES.length, "three actual retained quotation sources");
  const quoteFiles = f.quotationSources.map((x, i) => {
    const [path, byteLength, sha256] = QUOTES[i]; const loaded = image(x, { path: ROOT + path, byteLength, sha256 });
    return { ...loaded, utf8: new TextDecoder("utf-8", { fatal: true }).decode(loaded.bytes) };
  });
  need(Array.isArray(input.resourceFiles), "explicit resource evidence file images, possibly empty but not an absence proof");
  const resourceFiles = input.resourceFiles.map(x => image(x));
  const first = input.firstUse === null ? null : readJson(input.firstUse, undefined, true);
  const budget = input.budget === null ? null : readJson(input.budget, undefined, true);
  const quotes = input.sourceQuotations === null ? null : readJson(input.sourceQuotations, undefined, true);
  if (first) {
    shape(first.value, ["version", "factId", "userStatement", "interpretation", "scope", "sourceQuotationsRef"], "first-use fact");
    need(first.value.version === "rms-parent-first-operational-use-v1" && first.value.factId === "user145"
      && first.value.userStatement === "on ne s'est jamais servi de RMS"
      && first.value.interpretation === "first-operational-rms-genesis-not-opencode-or-qa-continuity", "literal first-use fact/meaning");
    same(first.value.scope, scope, "first-use scope"); ref(first.value.sourceQuotationsRef);
  }
  if (budget) {
    shape(budget.value, ["version", "scope", "firstUseRef", "sourceQuotationsRef", "grant"], "prospective parent budget");
    need(budget.value.version === "rms-parent-prospective-slot-A-decision-v1", "parent budget version"); same(budget.value.scope, scope, "budget scope");
    ref(budget.value.firstUseRef); ref(budget.value.sourceQuotationsRef);
    shape(budget.value.grant, ["slotKey", "functionIdentity", "role", "pass", "capUtf8Bytes", "acquiredUtf8Bytes"], "prospective A grant");
    const g = budget.value.grant;
    need(text(g.slotKey) && g.role === "A" && g.pass === 1 && g.capUtf8Bytes === 262144 && g.acquiredUtf8Bytes === 262144, "ratified A-only cap/debit262144");
    same(g.functionIdentity, functionIdentity, "budget function scope");
  }
  if (quotes) {
    shape(quotes.value, ["version", "scope", "quotations", "scopeUnresolved", "resourceRefs", "preservedUnknowns"], "source quotations");
    const v = quotes.value;
    need(v.version === "rms-parent-first-acquisition-source-quotations-v1", "quotation version"); same(v.scope, scope, "quotation AR scope");
    strings(v.scopeUnresolved, "scopeUnresolved"); strings(v.preservedUnknowns, "preservedUnknowns");
    need(Array.isArray(v.quotations) && v.quotations.length > 0, "actual source quotations required");
    for (const quotation of v.quotations) {
      shape(quotation, ["sourceRef", "startLine", "endLine", "text"], "quotation"); ref(quotation.sourceRef);
      const sourceFile = quoteFiles.find(s => canonical(s.rawRef) === canonical(quotation.sourceRef));
      need(sourceFile && integer(quotation.startLine) && quotation.startLine >= 1 && integer(quotation.endLine)
        && quotation.endLine >= quotation.startLine, "quotation must address a loaded retained file");
      const lines = sourceFile.utf8.split(/\r?\n/);
      need(quotation.endLine <= lines.length && text(quotation.text)
        && lines.slice(quotation.startLine - 1, quotation.endLine).join("\n") === quotation.text, "quotation text/line span differs from actual pinned source");
    }
    for (const sourceFile of quoteFiles) need(v.quotations.some(q => canonical(q.sourceRef) === canonical(sourceFile.rawRef)), "107/109/143 must each be cited");
    same(v.resourceRefs, resourceFiles.map(r => r.rawRef), "no resource reference without corresponding loaded file");
  }
  if (quotes && first) same(first.value.sourceQuotationsRef, quotes.rawRef, "fact quotation file ref");
  if (budget && first) same(budget.value.firstUseRef, first.rawRef, "budget first-use file ref");
  if (budget && quotes) same(budget.value.sourceQuotationsRef, quotes.rawRef, "budget quotation file ref");
  const missing = [first ? null : "firstUse", budget ? null : "budget", quotes ? null : "sourceQuotations"].filter(Boolean);
  const permissionRequirements = {
    codeBoundary: "client.ts447-456; declared DATA, not exercised/enforced authority",
    declared: { version: "rms-native-permission-scope-evidence-v1", scope: "bounded-coupling-qualification-only",
      profile: "general", model, agentRules: catalog.value.selectedDeclaredProfile.permissions, sessionRules: retained.proposedSessionRules },
    checks: ["version/scope exactly as declared", "profile/model/agentRules/sessionRules exactly equal proposed permit",
      "compositionRefs is a NONEMPTY array of actual pinned applicable composition evidence",
      "unknowns is an array: empty only after parent closes applicable preflight questions on evidence",
      "nativeExerciseRefs is an array: empty allowed by code, means no exercise attested",
      "canonical final permissions document ref equals proposed.permissionsEvidenceRef"],
    open: ["applicable composition evidence not supplied by this producer", "parent resolution of current preflight permission scope not supplied",
      "canonical final evidence/proposed-permit ref equality not yet constructed"],
    laterEvidence: ["actual future session enforcement/model", "remote quota/authentication and physical ownership", "native termination"],
    forbiddenInference: "No previous RMS exercise is required for the first acquisition; neither catalog rules nor an empty exercise array prove future enforcement. No automatic unknowns=[] or usable permissionsEvidence emitted."
  };
  const common = { version: "rms-first-acquisition-intention-v1", scope, planId: planning.plan.planId, unitId: unit.unitId, subIntentId: sub.subIntentId,
    functionIdentity, sourceRequestRef: retained.sourceRequestRef, runRef: run.ref, planningRef: planningDoc.ref,
    retainedInputPins: [manifest.pin, body.pin, independent.pin, policy.pin, intention.pin, catalog.pin],
    parentFileRefs: { firstUse: first?.rawRef ?? null, budget: budget?.rawRef ?? null, sourceQuotations: quotes?.rawRef ?? null },
    permissionRequirements,
    postOwnershipArgumentContract: {
      api: "GraphStore.authorizeNativeRootV1(authority,privateCapability,raw,expiresAt), graph-store.ts837-851",
      acquisitionKeys: ["version", "mode", "priorAuthority", "allocationRef", "planningRef", "attributionRef", "root", "inventory", "grants"],
      rootKeys: ["version", "missionId", "lineageId", "rootAccountId", "revision", "generationId", "headRevision", "controllerFence", "historyRef", "origins", "slots"],
      inventoryKeys: ["version", "rootAccountId", "missionId", "lineageId", "origins", "resourceRefs", "evidenceRefs", "unresolved"],
      grantKeys: ["slotKey", "functionIdentity", "role", "pass", "capUtf8Bytes", "acquiredUtf8Bytes", "provenanceRef"],
      slotKeys: ["slotKey", "grantRef", "capUtf8Bytes", "acquiredUtf8Bytes", "encumberedUtf8Bytes", "spentUtf8Bytes", "burnedUtf8Bytes"],
      fixed: { version: "rms-native-root-acquisition-v1", mode: "first-acquisition", priorAuthority: "no-linked-prior-authority-established",
        allocationRef: scope.rootAllocationRef, planningRef: planningDoc.ref, scope, functionIdentity, role: "A", pass: 1,
        capUtf8Bytes: 262144, acquiredUtf8Bytes: 262144 },
      rootGenesis: { version: "rms-native-root-ledger-v1", revision: 0, headRevision: 0, origins: [],
        meaning: "New first-use RMS root, subject to actual absence read and commit check; not an operative root capture" },
      materializeBeforeUse: "Parent writes/reloads the five exact draft documents. attributionRef=scope.ref, historyRef=genesis.ref, inventory=inventory.document, grant.provenanceRef=provenance.ref; those refs are NOT operative file evidence until reload.",
      completeAfterRealRead: ["Current operative OWN/controller owner and fence, not QA; valid wall-time and family-event deadlines",
        "Current root absence for mission OR R, and no root-acquisition decision for mission; scope/counters agree with first-use genesis",
        "Exact admission image bound to current controller/family fences; applicable client permission requirements and expiry"],
      parentEvidence: "Actual reads originate in the parent-owned invocation/receipt. No new attestation schema, signature, boolean capability or cryptographic proof is required from Bun. Unobtained observations remain unfinalized DATA.",
      commitAuthority: "The existing private API rechecks actual current controller/scope/root absence and performs issuance. A pure function does not establish these world facts.",
      grantRefBoundary: "NativeRootAcquisitionV1 requires slot.grantRef, but first-mode API computes it at848-849 from its real invocation source. This producer does not fabricate it or cast an incomplete argument as valid. Parent completes the actual existing API figure; no workaround/refactor/issuer added here."
    },
    nativeAuthority: "NONE", acquisitionArgument: null };
  if (missing.length) return finish({ ...common, status: "HOLD_MISSING_MATERIALIZED_PARENT_FILES", missing,
    draftDocuments: [], scopeUnresolved: quotes?.value.scopeUnresolved ?? ["sourceQuotations file absent"],
    meaning: "No genesis/provenance/grant reference manufactured for absent parent files" });
  const evidenceRefs = [first.rawRef, budget.rawRef, quotes.rawRef];
  const preservedUnknowns = [...new Set([...quotes.value.preservedUnknowns,
    "No old OpenCode/QA resource quiescence, cost-zero or RMS adoption inferred",
    "Remote quota/enforcement, physical allocation and terminality are not proved by local genesis DATA"])];
  const scopeDoc = doc("rms-first-acquisition-parent-scope-v1", { version: "rms-first-acquisition-parent-scope-v1", scope,
    sourceRequestRef: retained.sourceRequestRef, runRef: run.ref, unitId: unit.unitId, subIntentId: sub.subIntentId,
    intentionFileRef: intention.rawRef, sourceManifestFileRef: manifest.rawRef, evidenceRefs });
  const genesis = doc("rms-first-acquisition-parent-genesis-v1", { version: "rms-first-acquisition-parent-genesis-v1", scope,
    firstUseRef: first.rawRef, sourceQuotationsRef: quotes.rawRef, priorAuthority: "no-linked-prior-authority-established",
    rootRevision: 0, headRevision: 0, origins: [], preservedUnknowns,
    meaning: "Prospective new operational RMS history; not a copied fixture ledger or reset of existing resources. Current store absence must still be observed." });
  const inventory = doc("rms-native-inventory-attribution-v1", { version: "rms-native-inventory-attribution-v1",
    rootAccountId: scope.rootAccountId, missionId: scope.missionId, lineageId: scope.lineageId,
    origins: [], resourceRefs: quotes.value.resourceRefs, evidenceRefs, unresolved: quotes.value.scopeUnresolved });
  const slotA = doc("rms-first-acquisition-parent-slot-A-v1", { version: "rms-first-acquisition-parent-slot-A-v1", scope,
    ...budget.value.grant, encumberedUtf8Bytes: 0, spentUtf8Bytes: 0, burnedUtf8Bytes: 0,
    meaning: "New slot counters from first-use genesis only; NO grantRef until actual issuer" });
  const provenance = doc("rms-first-acquisition-parent-provenance-v1", { version: "rms-first-acquisition-parent-provenance-v1", scope,
    functionIdentity, role: "A", pass: 1, firstUseRef: first.rawRef, budgetDecisionRef: budget.rawRef,
    sourceQuotationsRef: quotes.rawRef, quotationSourceRefs: quoteFiles.map(s => s.rawRef),
    meaning: "Parent prospective local RMS262144-byte decision; not vendor quota/payment or an already emitted native grant" });
  return finish({ ...common, status: "FIRST_ACQUISITION_INTENTION_NATIVE_HOLD", missing: [],
    scopeUnresolved: quotes.value.scopeUnresolved, preservedUnknowns,
    draftDocuments: Object.entries({ scope: scopeDoc, genesis, inventory, slotA, provenance }).map(([name, document]) => ({ name, document, materialization: "NOT_OBSERVED" })),
    meaning: "Draft canonical documents are NOT materialized evidence; parent writes/reloads and completes the closed API argument after actual OWN readback" });
}
