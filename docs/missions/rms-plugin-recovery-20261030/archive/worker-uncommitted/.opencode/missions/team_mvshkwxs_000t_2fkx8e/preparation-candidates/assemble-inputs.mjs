/** Candidate for parent inspection only. Not imported, executed or validated.
 * Returns prospective DATA in memory; no writer, runner, CLI or native action.
 * Includes the proposed root-object and closed-triplet guards.
 */
import { isAbsolute, normalize } from "node:path";
import {
  assertExecutionJsonV1, bindExecutionPreparationV1,
  bindExecutionSourcesV1, sealExecutionEnvelopeV1, makeGraphRunV3,
  makeBoundDocumentV1, EXECUTION_DOCUMENT_KINDS_V1
} from "../../../../tools/ff8-harness/src/graph-execution-envelope.ts";
import { planMission } from "../../../../tools/ff8-harness/src/planner.ts";
import { canonical, hash } from "../../../../tools/ff8-harness/src/validation.ts";

const object = v =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const text = v => typeof v === "string" && v.trim().length > 0;
const need = (v, why) => {
  if (!v) throw new Error(`HOLD: ${why}`);
};
const take = r => {
  need(r.ok, (r.reasons || ["producer refused"]).join("; "));
  return r.value;
};
const names = [
  "body", "independentSources", "policy", "admission",
  "acquisition", "permit", "permissionsEvidence"
];

export function assemble(raw) {
  assertExecutionJsonV1(raw);
  need(object(raw), "root input object");
  const p = structuredClone(raw);
  for (const k of [
    "preparation", "scope", "paths", "admission", "rights",
    "acquisitionIntent", "permitHolds", "provenance", "now"
  ]) need(Object.hasOwn(p, k), `missing ${k}`);

  const q = p.preparation, s = p.scope;
  const a = p.admission, r = p.rights;
  need([q, s, p.paths, a, r, p.acquisitionIntent].every(object),
    "object inputs");
  need([q.body, q.independentSources, q.policy].every(object),
    "preparation triplet");
  need(Object.keys(q).length === 3 &&
    ["body", "independentSources", "policy"].every(k => Object.hasOwn(q, k)),
    "closed preparation triplet");
  need(!Object.hasOwn(q.body, "planning"),
    "unsealed body without planning required");

  const fields = [
    "missionId", "ownPath", "directory", "controllerId",
    "principalId", "actorId", "rootAccountId", "permitId",
    "unitId", "sessionId", "messageId"
  ];
  const scopeKeys = [...fields, "mandateRef", "leaseMs", "expiresAt"];
  need(fields.every(k => text(s[k])) &&
    scopeKeys.every(k => Object.hasOwn(s, k)) &&
    Object.keys(s).every(k => scopeKeys.includes(k)),
    "closed complete scope");
  need(isAbsolute(s.ownPath) && isAbsolute(s.directory),
    "absolute OWN/directory");
  need(/^ses_[A-Za-z0-9_]+$/.test(s.sessionId) &&
    /^msg_[A-Za-z0-9_]+$/.test(s.messageId), "prospective IDs");
  need(object(s.mandateRef) &&
    /^[a-f0-9]{64}$/.test(s.mandateRef.sha256), "mandateRef");
  need(Number.isSafeInteger(p.now) &&
    Number.isSafeInteger(s.expiresAt) && s.expiresAt > p.now &&
    Number.isSafeInteger(s.leaseMs) &&
    s.leaseMs > 0 && s.leaseMs <= 300000,
    "explicit proposed time/lease");

  const pathKeys = [...names, "request"];
  need(Object.keys(p.paths).length === pathKeys.length &&
    pathKeys.every(k => text(p.paths[k]) && isAbsolute(p.paths[k])) &&
    new Set(pathKeys.map(k => normalize(p.paths[k]).toLowerCase())).size
      === pathKeys.length, "eight distinct absolute output paths");
  need(Array.isArray(p.provenance) && p.provenance.length > 0 &&
    p.provenance.every(v => object(v) && text(v.path) && text(v.status) &&
      /^[a-f0-9]{64}$/.test(v.sha256)), "explicit source provenance");

  need(p.acquisitionIntent.version === "rms-native-acquisition-intent-v1" &&
    p.acquisitionIntent.status === "HOLD" &&
    Array.isArray(p.acquisitionIntent.unknowns) &&
    p.acquisitionIntent.unknowns.length > 0 &&
    p.acquisitionIntent.unknowns.every(text), "honest pending acquisition");
  need(Array.isArray(p.permitHolds) && p.permitHolds.length > 0 &&
    p.permitHolds.every(text), "explicit permit/fence hold reasons");
  need(r.version === "rms-native-permission-scope-evidence-v1" &&
    r.scope === "bounded-coupling-qualification-only" &&
    [r.agentRules, r.sessionRules, r.compositionRefs, r.unknowns,
      r.nativeExerciseRefs].every(Array.isArray) &&
    r.compositionRefs.length > 0, "complete rights evidence");
  need(r.unknowns.length === 0,
    "rights unknowns unresolved; never erase them");

  const b = take(bindExecutionPreparationV1(
    q.body, q.independentSources, q.policy));
  for (const role of ["explore", "evaluate", "A", "B", "R"]) {
    const m = b.sourceSpec.models[role];
    need(m.providerID === "openai" && text(m.id) && text(m.variant),
      `model ${role}`);
  }
  need(b.projection.regime !== "B" ||
    b.projection.proposalAdmissible === true, "negative/unknown B proposal");

  const planning = planMission(
    structuredClone(b.projection.graph),
    structuredClone(b.projection.groups),
    structuredClone(q.policy),
    structuredClone(b.body.admissionSource.context));
  const origin = take(sealExecutionEnvelopeV1({
    ...structuredClone(b.body),
    planning: makeBoundDocumentV1(
      EXECUTION_DOCUMENT_KINDS_V1.planning, planning)
  }));
  const checked = take(bindExecutionSourcesV1(origin, q.independentSources));
  const run = take(makeGraphRunV3(origin)).document;

  need(s.missionId === b.body.missionId &&
    s.rootAccountId === b.body.admissionSource.budgetLineage.rootAccountId,
    "scope/source root");
  const unit = checked.planning.units.find(u => u.unitId === s.unitId);
  need(unit && checked.planning.plan.selectedUnitIds.includes(s.unitId),
    "selected unit");
  const sub = unit.subIntents.find(v => v.subIntentId === a.subIntentId);
  need(sub && ["A", "B"].includes(sub.role) && a.role === sub.role,
    "A/B source role");

  const c = a.command;
  need(object(c) && object(c.dossier) && object(c.metadata) && text(c.prompt),
    "parent-supplied admission/dossier/metadata/prompt");
  need([a.executionId, a.attemptId, a.idempotencyKey, c.taskId].every(text) &&
    a.idempotencyKey === a.executionId &&
    c.executionId === a.executionId && c.attemptId === a.attemptId &&
    c.idempotencyKey === a.executionId, "admission IDs");
  need(c.context?.mode === "fresh" && c.worktree === false &&
    ["files", "agents", "skills"].every(k => !Object.hasOwn(c, k)),
    "closed prompt mode");
  need(c.profile === checked.template.settings.profiles[sub.role] &&
    canonical(c.model) === canonical(checked.sourceSpec.models[sub.role]) &&
    r.profile === c.profile && canonical(r.model) === canonical(c.model),
    "profile/model sources");

  const ea = Number(sub.harnessIdentity.ea);
  need(Number.isSafeInteger(ea) && ea >= 0 && ea <= 0xffffffff, "function EA");
  const sourceRequestRef =
    makeBoundDocumentV1("rms-native-source-request-v1", q).ref;
  const permit = {
    version: "rms-native-permit-intent-v1", status: "HOLD",
    unknowns: p.permitHolds, role: sub.role,
    functionIdentity: { ...sub.harnessIdentity, ea },
    profile: c.profile, model: c.model,
    permissions: r.sessionRules, agentPermissions: r.agentRules,
    sourceRequestRef, runRef: run.ref,
    permissionsEvidenceRef:
      makeBoundDocumentV1("rms-native-permission-scope-evidence-v1", r).ref
  };
  const values = {
    body: q.body, independentSources: q.independentSources,
    policy: q.policy, admission: a, acquisition: p.acquisitionIntent,
    permit, permissionsEvidence: r
  };
  assertExecutionJsonV1(values);

  const packet = (key, value) => {
    const utf8 = canonical(value);
    return {
      utf8,
      pin: {
        path: p.paths[key],
        byteLength: new TextEncoder().encode(utf8).length,
        sha256: hash(utf8)
      }
    };
  };
  const files = Object.fromEntries(
    names.map(k => [k, packet(k, values[k])]));
  const request = {
    version: "rms-parent-native-request-v1", ...s,
    ...Object.fromEntries(names.map(k => [k, files[k].pin]))
  };
  files.request = packet("request", request);
  return {
    status: "HOLD_NATIVE_NOT_ATTESTED",
    files, request, runRef: run.ref, sourceRequestRef,
    provenance: p.provenance,
    acquisitionUnknowns: p.acquisitionIntent.unknowns,
    permitHolds: p.permitHolds
  };
}
