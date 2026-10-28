import { test, expect } from 'bun:test';
import { bindExecutionPreparationV1 as bind, parseExecutionEnvelopeV1 as parse, bindExecutionSourcesV1 as bindEnvelope, inspectExecutionEnvelopeV1 as inspect } from '../../src/graph-execution-envelope';
import type { PlannerPolicy } from '../../src/planner';
import { manualKnowledge, packKnowledge, resignAuthors, mutateAuthorSession } from './fixtures/manual-knowledge';
import type { KnowledgeView } from './fixtures/manual-knowledge';
import { bd, decode, fp, envelopeValue } from './fixtures/manual-root';
import { bytes, sha } from './oracle/wire';
import { requireOk, requireRefusal } from './oracle/cases';
const bindView = (v: KnowledgeView) => bind(v.f.body, v.f.independent, v.f.policy as PlannerPolicy);
function nominal(level: 1 | 2 = 2): KnowledgeView { const v = manualKnowledge(level); requireOk(bindView(v)); return v; }

for (const level of [1, 2] as const) test(`K.nominal.level${level}.whole-unit-and-current-context`, () => {
  const v = manualKnowledge(level), before = JSON.stringify([v.f.body, v.f.independent]);
  const result = requireOk(bindView(v));
  requireOk(bindEnvelope(requireOk(parse(bytes(JSON.stringify(envelopeValue(v.f))))), v.f.independent));
  expect(result.knowledge.facts.length).toBe(1);
  expect(result.knowledge.materializations[0]!.resultId).toBe('qa-result-R');
  expect(decode(v.m.result).sha256).not.toBe(fp(decode(v.m.result).document));
  expect(decode(v.p.publicationReadback).hash).not.toBe(v.m.fileSha256);
  expect(JSON.stringify([v.f.body, v.f.independent])).toBe(before);
  const inspection = inspect(bytes(JSON.stringify(envelopeValue(v.f))), v.f.independent);
  expect(inspection.coherent).toBe(true); expect(inspection.authorityVerified).toBe(false);
  expect(decode(v.p.producerUnit).knowledgeRevision).toBe(0);
  expect(result.body.preparationObservationT0.knowledgeRevision).toBe(1);
  if (level === 1) expect(v.p.results.every((r: { nativeAuthor: unknown; historicalAdmission: unknown }) => r.nativeAuthor === null && r.historicalAdmission === null)).toBe(true);
  else {
    expect(decode(v.p.results[0].nativeAuthor).model.id).toBe('historical-model');
    expect(v.f.spec.models.A.id).toBe('manual');
  }
});
test('K07.nominal known absent optional receipt identities', () => { const v = manualKnowledge(2, true); requireOk(bindView(v)); });
test('K.publication.same-unit exact publication refs reused across two materializations', () => {
  const v = manualKnowledge(2, false, true); requireOk(bindView(v));
  expect(v.k.materializations.length).toBe(2);
  expect(decode(v.k.materializations[1].binding).materialization).toBe('parent-derived');
  const other = decode(v.k.materializations[1].provenance);
  expect(other.pendingPublication.ref).toEqual(v.p.pendingPublication.ref);
  expect(other.publicationReadback.ref).toEqual(v.p.publicationReadback.ref);
  expect(v.k.materializations[1].commit.ref).toEqual(v.m.commit.ref);
});
for (const fault of ['contradictory-publication-source', 'unattested-derived-fact', 'missing-derived-bytes'] as const) test(`K.parent-derived.${fault}`, () => {
  const v = manualKnowledge(2, false, true); requireOk(bindView(v)); let reason = '';
  const other = v.k.materializations[1];
  if (fault === 'contradictory-publication-source') {
    const p = decode(other.provenance), readback = decode(p.publicationReadback);
    readback.source = 'different independently claimed publication record'; p.publicationReadback = bd('l8-publication-readback-data-v1', readback);
    other.provenance = bd('l8-knowledge-provenance-v1', p); reason = 'contradictory producer publication sources';
  }
  if (fault === 'unattested-derived-fact') { other.resultId = 'foreign-unattested-fact'; reason = 'parent-derived materialization lacks attested fact identity'; }
  if (fault === 'missing-derived-bytes') { v.k.files.pop(); reason = 'knowledge manifest file lacks exact bytes'; }
  packKnowledge(v); requireRefusal(bindView(v), reason);
});
test('K07.level1 supplied non-null history remains checked without requiring native author', () => {
  const v = nominal(1), historicalData = manualKnowledge(2).p.results[0].historicalAdmission;
  v.p.results[0].historicalAdmission = historicalData;
  packKnowledge(v); v.f.independent.knowledgeSource = structuredClone(v.f.body.admissionSource.knowledgeSource);
  requireOk(bindView(v));
  const history = decode(v.p.results[0].historicalAdmission); history.executionId = 'foreign'; history.receiptIdentity.executionId = 'foreign';
  v.p.results[0].historicalAdmission = bd('l8-historical-admission-data-v1', history);
  packKnowledge(v); requireRefusal(bindView(v), 'historical admission producer/result/subIntent/token mismatch');
});
for (const kind of ['missing-history', 'missing-author', 'missing-receipt', 'stale-author', 'parented-author', 'wrong-profile', 'wrong-model', 'wrong-token', 'wrong-execution', 'wrong-receipt-execution', 'wrong-receipt-digest', 'null-receipt-session', 'wrong-receipt-session', 'wrong-receipt-author', 'wrong-request-domain', 'unknown-history-key'] as const) test(`K07.${kind}`, () => {
  const v = nominal(), r = v.p.results[0], history = decode(r.historicalAdmission);
  let reason = '';
  if (kind === 'missing-history') { r.historicalAdmission = null; reason = 'consumed native author historical admission unknown'; }
  if (kind === 'missing-author') { r.nativeAuthor = null; reason = 'attested author identity unknown'; }
  if (kind === 'missing-receipt') { delete history.receiptIdentity; reason = 'closed object fields'; }
  // These two are closed-shape refusals, not proofs of a deeper native join.
  if (kind === 'stale-author' || kind === 'parented-author') { const a = decode(r.nativeAuthor); if (kind === 'stale-author') a.fresh = false; else a.parentSessionId = 'foreign-parent'; r.nativeAuthor = bd('l8-native-author-data-v1', a); resignAuthors(v); reason = kind === 'stale-author' ? 'expected true' : 'expected '; }
  if (kind === 'wrong-profile') { history.command.profile = 'current-compatible-but-historically-wrong'; reason = 'historical requestDigest/profile mismatch'; }
  if (kind === 'wrong-model') { history.command.model.variant = 'foreign'; reason = 'historical command/stored model mismatch'; }
  if (kind === 'wrong-token') { history.familyToken = 3; reason = 'historical admission producer/result/subIntent/token mismatch'; }
  if (kind === 'wrong-execution') { history.executionId = 'foreign'; history.receiptIdentity.executionId = 'foreign'; reason = 'historical admission producer/result/subIntent/token mismatch'; }
  if (kind === 'wrong-receipt-execution') { history.receiptIdentity.executionId = 'foreign'; reason = 'historical receipt execution/requestDigest mismatch'; }
  if (kind === 'wrong-receipt-digest') { history.receiptIdentity.requestDigest = fp(history); reason = 'historical receipt execution/requestDigest mismatch'; }
  if (kind === 'null-receipt-session') { history.receiptIdentity.nativeSessionId = null; reason = 'text required'; }
  if (kind === 'wrong-receipt-session') { history.receiptIdentity.nativeSessionId = 'foreign'; reason = 'historical receipt/stored session mismatch'; }
  if (kind === 'wrong-receipt-author') { history.receiptIdentity.authorId = 'foreign'; reason = 'historical receipt/stored author mismatch'; }
  if (kind === 'unknown-history-key') { history.bodyHashVerified = true; reason = 'closed object fields'; }
  if (kind === 'wrong-request-domain') {
    const a = decode(r.nativeAuthor); a.requestDigest = r.historicalAdmission.ref.sha256;
    r.nativeAuthor = bd('l8-native-author-data-v1', a); resignAuthors(v); reason = 'historical requestDigest/profile mismatch';
  }
  if (r.historicalAdmission !== null) r.historicalAdmission = bd('l8-historical-admission-data-v1', history);
  packKnowledge(v); requireRefusal(bindView(v), reason);
});
test('K07.known-present receipt cannot be silently elided to known-absent', () => {
  const v = nominal(), r = v.p.results[0], history = decode(r.historicalAdmission);
  delete history.receiptIdentity.nativeSessionId; delete history.receiptIdentity.authorId;
  r.historicalAdmission = bd('l8-historical-admission-data-v1', history);
  packKnowledge(v); requireRefusal(bindView(v), 'independent knowledgeSource mismatch');
});
test('K07.coherent foreign historical projection still differs from independent source', () => {
  const v = nominal(), r = v.p.results[0], history = decode(r.historicalAdmission), author = decode(r.nativeAuthor);
  author.profile = 'cofabricated-profile'; history.command.profile = author.profile;
  r.historicalAdmission = bd('l8-historical-admission-data-v1', history); r.nativeAuthor = bd('l8-native-author-data-v1', author);
  resignAuthors(v); packKnowledge(v); requireRefusal(bindView(v), 'independent knowledgeSource mismatch');
});
test('K.B1.sessions duplicated despite coherent refreshed author digests', () => {
  const v = nominal(); mutateAuthorSession(v, 0, decode(v.p.results[1].nativeAuthor).sessionId);
  packKnowledge(v); requireRefusal(bindView(v), 'attestation reuses a native author session');
});
for (const field of ['authorId', 'sessionId'] as const) test(`K.B1.parent equals ${field}`, () => {
  const v = nominal(), authority = decode(v.p.parentAuthority);
  authority.actorId = decode(v.p.results[0].nativeAuthor)[field]; v.p.parentAuthority = bd('l8-parent-authority-data-v1', authority);
  resignAuthors(v); packKnowledge(v); requireRefusal(bindView(v), 'attestation parent equals author/session');
});
for (const fault of ['omit-result', 'duplicate-result', 'ineligible', 'bulletin', 'foreign-token', 'foreign-function', 'parent-without-attestation', 'extra-author-digest', 'raw-result-digest', 'raw-binding-digest', 'validation-order'] as const) test(`K02.${fault}`, () => {
  const v = nominal(); let reason = '';
  if (fault === 'omit-result') { v.p.results.pop(); reason = 'whole-unit result coverage incomplete'; }
  if (fault === 'duplicate-result') { v.p.results.push(structuredClone(v.p.results[0])); reason = 'duplicate provenance subIntent'; }
  if (fault === 'ineligible' || fault === 'bulletin' || fault === 'foreign-token') {
    const r = v.p.results[0], retained = decode(r.retained);
    if (fault === 'ineligible') retained.eligible = false;
    if (fault === 'bulletin') retained.source = 'bulletin';
    if (fault === 'foreign-token') retained.token = 9;
    r.retained = bd('l8-retained-result-data-v1', retained); reason = 'retained result is foreign/ineligible/token mismatch';
  }
  if (fault === 'foreign-function') {
    const r = v.p.results[0], stored = decode(r.stored), retained = decode(r.retained);
    stored.document.identity.ea = '0x1234'; stored.content = JSON.stringify(stored.document); stored.sha256 = sha(stored.content);
    retained.document = structuredClone(stored.document);
    r.stored = bd('l8-stored-result-data-v1', stored); r.retained = bd('l8-retained-result-data-v1', retained);
    reason = 'result/subIntent function mismatch';
  }
  if (fault === 'parent-without-attestation') { v.p.parentAttestation = null; reason = 'parentValidated without attestation'; }
  if (fault === 'extra-author-digest' || fault === 'raw-result-digest') { const a = decode(v.p.parentAttestation); if (fault === 'extra-author-digest') a.authorDigests.foreign = fp('foreign'); else a.resultDigests['qa-result-A'] = decode(v.p.results[0].stored).sha256; const { attestationId: ignored, ...rest } = a; a.attestationId = fp(rest); v.p.parentAttestation = bd('l8-parent-attestation-data-v1', a); const b = decode(v.m.binding), w = decode(v.p.wholeUnitValidation); b.parentAttestationId = a.attestationId; w.validation.parentAttestationId = a.attestationId; v.m.binding = bd('l8-artifact-binding-v1', b); v.p.wholeUnitValidation = bd('l8-whole-unit-validation-data-v1', w); reason = fault === 'extra-author-digest' ? 'attestation extra/missing author digest' : 'attestation author/result digest mismatch'; }
  if (fault === 'raw-binding-digest') { const b = decode(v.m.binding); b.sources[0].digest = decode(v.m.result).sha256; v.m.binding = bd('l8-artifact-binding-v1', b); reason = 'artifact binding source function/execution/subIntent/digest mismatch'; }
  if (fault === 'validation-order') { const w = decode(v.p.wholeUnitValidation); w.resultIds = [...w.resultIds].reverse(); v.p.wholeUnitValidation = bd('l8-whole-unit-validation-data-v1', w); reason = 'validation result order/coverage mismatch'; }
  packKnowledge(v); requireRefusal(bindView(v), reason);
});
for (const fault of ['final-id-as-request', 'changed-final-target', 'effect-mismatch', 'readback-target', 'readback-hash', 'materialization-hash', 'pending-materialization'] as const) test(`K.publication.${fault}`, () => {
  const v = nominal(); let reason = '';
  if (fault === 'final-id-as-request' || fault === 'effect-mismatch') {
    const effect = decode(v.p.publicationEffect);
    if (fault === 'final-id-as-request') effect.requestDigest = decode(v.m.commit).commitId;
    else effect.verifiedEffect = 'does_not_satisfy';
    v.p.publicationEffect = bd('l8-publication-effect-data-v1', effect);
    reason = fault === 'final-id-as-request' ? 'immutable pending request digest mismatch' : 'final commit changed immutable pending fields';
  }
  if (fault === 'changed-final-target') { const final = decode(v.m.commit); final.publicationTargetId = 'foreign'; const { commitId: ignored, ...content } = final; final.commitId = fp(content); v.m.commit = bd('knowledge-commit-v1', final); const b = decode(v.m.binding); b.commitId = final.commitId; v.m.binding = bd('l8-artifact-binding-v1', b); reason = 'final commit changed immutable pending fields'; }
  if (fault === 'readback-target' || fault === 'readback-hash') { const r = decode(v.p.publicationReadback); if (fault === 'readback-target') r.targetId = 'foreign'; else r.hash = fp('foreign'); v.p.publicationReadback = bd('l8-publication-readback-data-v1', r); reason = 'publication readback request/target/hash mismatch'; }
  if (fault === 'materialization-hash') { v.p.materializationReadback = bd('l8-materialization-readback-data-v1', { sha256: fp('foreign') }); v.m.readback.recordRef = v.p.materializationReadback.ref; reason = 'materialization readback file hash mismatch'; }
  if (fault === 'pending-materialization') { v.m.readback.status = 'pending'; reason = 'verified fact without exact non-revoked publication/materialization readback'; }
  packKnowledge(v); requireRefusal(bindView(v), reason);
});
