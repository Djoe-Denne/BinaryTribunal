import { bd, decode, fp, manualPlanId, manualPreparation, signed } from './manual-root';
import type { Data, Manual } from './manual-root';
import { sha } from '../oracle/wire';

export type KnowledgeView = { f: Manual; k: Data; m: Data; p: Data };
const scientificId = (v: Data): string => fp(Object.fromEntries(Object.entries(v).filter(([key]) => key !== 'commitId')));

// Entirely synthetic DATA. A JSON nativeAuthor/attestation is NEVER a native proof.
export function manualKnowledge(level: 1 | 2 = 2, knownAbsentReceiptOptionals = false, withDerivedArtifact = false): KnowledgeView {
  const seed = manualPreparation(), missionId = seed.snapshot.missionId, node = seed.node;
  const unit = structuredClone(seed.planning.units[0]) as Data;
  unit.snapshotId = 'qa-historical-snapshot'; unit.partitionId = 'qa-historical-partition'; unit.knowledgeRevision = 0; unit.requiredPublicationLevel = level;
  const historyPolicy: Data = structuredClone(seed.policy);
  delete historyPolicy.admissionBudget; delete historyPolicy.admissionBudgetMode;
  historyPolicy.version = 'qa-history-policy-v1'; historyPolicy.partitionId = unit.partitionId; historyPolicy.publicationLevel = level;
  const snapshotFingerprint = sha('independent historical snapshot identity, not current snapshot');
  const plan = signed({ ...seed.planning.plan, snapshotId: unit.snapshotId, partitionId: unit.partitionId, knowledgeRevision: 0,
    planId: manualPlanId(snapshotFingerprint, historyPolicy, [[node.id]]), policyVersion: historyPolicy.version,
    units: [{ ...seed.planning.plan.units[0], requiredPublicationLevel: level }] });
  const side: Data = structuredClone(seed.planning.sidecar);
  delete side.admissionBudget;
  Object.assign(side, { planId: plan.planId, planFingerprint: plan.fingerprint, snapshotFingerprint, knowledgeRevision: 0, policyVersion: historyPolicy.version, policy: historyPolicy,
    unitFingerprints: { [unit.unitId]: fp(Object.fromEntries(Object.entries(unit).filter(([key]) => key !== 'state'))) } });
  const sidecar = signed(side);
  const historicalPlanning = { plan, units: [unit], sidecar, diagnostics: [], binding: signed({ schemaVersion: 1, planFingerprint: plan.fingerprint, sidecarFingerprint: sidecar.fingerprint }) };
  const evidence = [{ id: 'qa-data-evidence', source: 'synthetic-offline-data', sha256: sha('qa-evidence'), detail: 'Synthetic input only: no native execution or scientific acceptance asserted.' }];
  const historicalModel = { providerID: 'qa-history', id: 'historical-model', variant: 'high' };
  const authority = { version: 1, role: 'parent', missionId, controllerOwner: 'qa-controller', principalId: 'qa-principal', actorId: 'qa-parent', source: 'synthetic-authority-data', sourceHash: sha('qa-authority-source') };
  const results: Data[] = unit.subIntents.map((sub: Data, i: number) => {
    const executionId = 'qa-history-execution-' + sub.role, authorId = 'qa-author-' + sub.role, sessionId = 'qa-session-' + sub.role;
    const resultId = 'qa-result-' + sub.role, requestDigest = sha('opaque independently supplied historical row.digest ' + i);
    const header = { schemaVersion: 1, missionId, taskId: 'qa-historical-task-' + sub.role, attemptId: 'qa-historical-attempt-' + sub.role, executionId, cycle: 1, authorId, inputFingerprint: sha('historical-input'), inputVersions: [], previousResultIds: [], identity: sub.harnessIdentity };
    const proposition = { id: 'qa-proposition-' + sub.role, text: 'Aé😀 — synthetic data', evidence, contradictions: [], questions: [] };
    const document = sub.role === 'R'
      ? { ...header, kind: 'reconciliation', decision: 'certain', propositions: [proposition], contradictions: [], questions: [], conclusion: { text: 'Synthetic retained conclusion only', evidence } }
      : { ...header, kind: 'proposal', role: sub.role, propositions: [proposition] };
    // Retained raw source bytes intentionally differ from its upstream value fingerprint.
    const content = JSON.stringify(document, null, 1) + '\n';
    const stored = { resultId, path: 'C:/synthetic-qa/results/' + sub.role + '.json', sha256: sha(content), authorId, executionId, sessionId, effectiveModel: historicalModel, content, document };
    const native = { version: 1, missionId, executionId, requestDigest, authorId, sessionId, profile: 'qa-history-profile', model: historicalModel, fresh: true, parentSessionId: null, source: 'synthetic-native-identity-DATA-not-authentication', sourceHash: sha('qa-native-identity-source') };
    const receiptIdentity = knownAbsentReceiptOptionals ? { executionId, requestDigest } : { executionId, requestDigest, nativeSessionId: sessionId, authorId };
    const history = { version: 'l8-historical-admission-data-v1', missionId, unitId: unit.unitId, executionId, subIntentId: sub.subIntentId, familyToken: 2, requestDigest, command: { profile: 'qa-history-profile', model: historicalModel }, receiptIdentity };
    return { subIntentId: sub.subIntentId, stored: bd('l8-stored-result-data-v1', stored),
      retained: bd('l8-retained-result-data-v1', { resultId, executionId, token: 2, document, eligible: true, source: 'artifact' }),
      nativeAuthor: level === 2 ? bd('l8-native-author-data-v1', native) : null,
      historicalAdmission: level === 2 ? bd('l8-historical-admission-data-v1', history) : null };
  });
  const resultIds = results.map(r => decode(r.stored).resultId), rResult = decode(results[2]!.stored);
  const attestationContent = { version: 1, missionId, unitId: unit.unitId, familyToken: 2, controllerToken: 7, parentActorId: authority.actorId, parentAuthorityDigest: fp(authority), bindingFingerprint: historicalPlanning.binding.fingerprint,
    planFingerprint: plan.fingerprint, snapshotId: unit.snapshotId, snapshotFingerprint, partitionId: unit.partitionId, knowledgeRevision: 0, resultIds,
    resultDigests: Object.fromEntries(results.map(r => { const s = decode(r.stored); return [s.resultId, fp(s.document)]; })),
    authorDigests: level === 2 ? Object.fromEntries(results.map(r => [decode(r.stored).executionId, fp(decode(r.nativeAuthor))])) : {},
    evidenceDigest: fp(evidence), validatedFactIds: [rResult.resultId], checks: [{ id: 'qa-parent-check', kind: 'synthetic-data-consistency', outcome: 'pass', evidenceDigest: fp(evidence), detail: 'Synthetic attestation field, NOT a scientific/native PASS.' }] };
  const attestation = { ...attestationContent, attestationId: fp(attestationContent) };
  const pendingContent = { schemaVersion: 1, inputRevision: 0, outputRevision: 1, unitId: unit.unitId, resultIds, validatedFactIds: [rResult.resultId], evidence,
    publicationLevel: level, publicationTargetId: 'qa-publication-target', readbackStatus: 'pending', readbackHash: sha('qa-publication-byte-readback'), futurePrerequisiteEffect: 'does_not_satisfy', isGitCommit: false };
  const pending = { ...pendingContent, commitId: fp(pendingContent) };
  const finalContent = { ...pending, readbackStatus: 'verified', futurePrerequisiteEffect: 'satisfies' };
  const final = { ...finalContent, commitId: scientificId(finalContent) };
  const publicationReadback = { targetId: pending.publicationTargetId, hash: pending.readbackHash, requestDigest: fp(pending), source: 'synthetic-publication-data' };
  const materializationReadback = bd('l8-materialization-readback-data-v1', { sha256: rResult.sha256 });
  const binding = { version: 1, missionId, producerUnitId: unit.unitId, artifactId: 'qa-knowledge-artifact', artifactSha256: rResult.sha256, functionId: node.id, moduleSha256: node.moduleSha256,
    artifactKind: 'reconciled_c', knowledgeRevision: 1, publicationLevel: level, validation: level === 2 ? 'parent-validated' : 'fixture-only', commitId: final.commitId, materialization: 'stored-result', content: rResult.content,
    sources: [{ resultId: rResult.resultId, executionId: rResult.executionId, subIntentId: results[2]!.subIntentId, digest: fp(rResult.document) }], evidenceDigest: fp(evidence), parentAuthorityDigest: fp(authority), parentActorId: authority.actorId, parentAttestationId: level === 2 ? attestation.attestationId : null };
  const validation = { token: 2, resultIds, validation: { evidence, validatedFactIds: [rResult.resultId], source: 'artifact', parentValidated: level === 2, ...(level === 2 ? { parentAttestationId: attestation.attestationId } : {}) } };
  const p: Data = { version: 'l8-knowledge-provenance-v1', producerUnit: bd('work-unit-v1', unit), producerPlanning: bd('l8-planning-source-v1', historicalPlanning), results,
    wholeUnitValidation: bd('l8-whole-unit-validation-data-v1', validation), pendingPublication: bd('knowledge-commit-v1', pending),
    publicationEffect: bd('l8-publication-effect-data-v1', { version: 1, missionId, unitId: unit.unitId, token: 2, requestDigest: fp(pending), verifiedEffect: 'satisfies' }),
    publicationReadback: bd('l8-publication-readback-data-v1', publicationReadback), materializationReadback, parentAuthority: bd('l8-parent-authority-data-v1', authority), parentAttestation: level === 2 ? bd('l8-parent-attestation-data-v1', attestation) : null };
  const file = { path: rResult.path, sha256: rResult.sha256, version: '1', provenance: 'synthetic-offline-knowledge', kind: 'knowledge', approvedForBlind: false, identity: rResult.document.identity };
  const publicationReceipt = { idempotencyKey: 'qa-publication-idempotency', targetId: pending.publicationTargetId, revision: 1, resultHash: fp(rResult.document) };
  const metadata = { schemaVersion: 1, resultId: rResult.resultId, identity: rResult.document.identity, inputVersions: rResult.document.inputVersions, resultHash: fp(rResult.document), publicationReceipt, conclusion: rResult.document.conclusion };
  const m: Data = { fileSha256: rResult.sha256, filePath: rResult.path, resultId: rResult.resultId, producer: { authorId: rResult.authorId, executionId: rResult.executionId, sessionId: rResult.sessionId, model: historicalModel }, validation: binding.validation,
    revoked: false, revocationRef: null, binding: bd('l8-artifact-binding-v1', binding), commit: bd('knowledge-commit-v1', final), result: results[2]!.stored,
    readback: { status: 'verified', sha256: rResult.sha256, recordRef: materializationReadback.ref }, provenance: bd('l8-knowledge-provenance-v1', p) };
  const k: Data = { version: 'l8-knowledge-source-v1', missionId, knowledgeRevision: 1, rootHash: 'a'.repeat(64),
    frozen: { version: 'qa-frozen-historical-knowledge', fingerprint: sha('retained synthetic frozen knowledge identity'), leadsFingerprint: sha('retained synthetic leads identity'), files: [file], validatedFacts: [metadata] },
    files: [{ file, bytes: { ref: { kind: 'qa-knowledge-bytes', encoding: 'raw-v1', byteLength: Buffer.byteLength(rResult.content), sha256: rResult.sha256 }, base64: Buffer.from(rResult.content).toString('base64') } }],
    facts: [{ ...metadata, file, content: rResult.content, materialization: 'verified' }], materializations: [m], ledgerRevision: 1, ledgerDigest: 'a'.repeat(64) };
  if (withDerivedArtifact) {
    if (level !== 2) throw Error('manual derived artifact requires its explicit level2 fixture');
    const derivedContent = '{"derived":"Aé😀","source":"qa-result-R"}\n', derivedHash = sha(derivedContent);
    const derivedFile = { ...file, path: 'C:/synthetic-qa/derived/qa-derived.json', sha256: derivedHash, provenance: 'synthetic parent-derived bytes' };
    const derivedBinding = { ...binding, artifactId: 'qa-derived-artifact', artifactSha256: derivedHash, materialization: 'parent-derived', content: derivedContent };
    const derivedReadback = bd('l8-materialization-readback-data-v1', { sha256: derivedHash });
    const derivedProvenance = { ...p, materializationReadback: derivedReadback };
    const derived = { ...m, filePath: derivedFile.path, fileSha256: derivedHash, binding: bd('l8-artifact-binding-v1', derivedBinding),
      readback: { status: 'verified', sha256: derivedHash, recordRef: derivedReadback.ref }, provenance: bd('l8-knowledge-provenance-v1', derivedProvenance) };
    k.frozen.files.push(derivedFile); k.frozen.fingerprint = sha('retained frozen knowledge with two artifacts from one result');
    k.files.push({ file: derivedFile, bytes: { ref: { kind: 'qa-knowledge-bytes', encoding: 'raw-v1', byteLength: Buffer.byteLength(derivedContent), sha256: derivedHash }, base64: Buffer.from(derivedContent).toString('base64') } });
    k.facts.push({ ...metadata, file: derivedFile, content: derivedContent, materialization: 'verified' }); k.materializations.push(derived);
    k.rootHash = sha('retained synthetic two-artifact root'); k.ledgerDigest = sha('retained synthetic two-artifact ledger');
  }
  return { f: manualPreparation(k), k, m, p };
}

// Rewrap only explicitly changed untrusted data; never recompute expected outcomes.
export function packKnowledge(v: KnowledgeView): void {
  v.m.provenance = bd('l8-knowledge-provenance-v1', v.p);
  v.f.body.admissionSource.knowledgeSource = bd('l8-knowledge-source-v1', v.k);
}
export function resignAuthors(v: KnowledgeView): void {
  const authority = decode(v.p.parentAuthority), a = decode(v.p.parentAttestation), validation = decode(v.p.wholeUnitValidation), binding = decode(v.m.binding);
  a.parentActorId = authority.actorId; a.parentAuthorityDigest = fp(authority);
  a.resultDigests = Object.fromEntries(v.p.results.map((r: Data) => { const s = decode(r.stored); return [s.resultId, fp(s.document)]; }));
  a.authorDigests = Object.fromEntries(v.p.results.map((r: Data) => [decode(r.stored).executionId, fp(decode(r.nativeAuthor))]));
  const { attestationId: ignored, ...content } = a; a.attestationId = fp(content);
  binding.parentActorId = authority.actorId; binding.parentAuthorityDigest = fp(authority); binding.parentAttestationId = a.attestationId;
  validation.validation.parentAttestationId = a.attestationId;
  v.m.binding = bd('l8-artifact-binding-v1', binding);
  v.p.wholeUnitValidation = bd('l8-whole-unit-validation-data-v1', validation);
  v.p.parentAttestation = bd('l8-parent-attestation-data-v1', a);
}
export function mutateAuthorSession(v: KnowledgeView, index: number, sessionId: string): void {
  const r = v.p.results[index], author = decode(r.nativeAuthor), stored = decode(r.stored), history = decode(r.historicalAdmission);
  author.sessionId = sessionId; stored.sessionId = sessionId; history.receiptIdentity.nativeSessionId = sessionId;
  r.nativeAuthor = bd('l8-native-author-data-v1', author); r.stored = bd('l8-stored-result-data-v1', stored); r.historicalAdmission = bd('l8-historical-admission-data-v1', history);
  resignAuthors(v);
}
