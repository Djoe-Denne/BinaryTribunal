import { expect } from 'bun:test';
import type { CodecResult } from '../../../src/graph-execution-envelope';
import { bd, decode, fp, value, envelopeValue } from '../fixtures/manual-root';
import type { Manual } from '../fixtures/manual-root';
import { bytes, sha } from './wire';
export function requireOk<T>(r: CodecResult<T>): T {
  if (!r.ok) throw Error('NOMINAL NOT REACHED: ' + r.reasons.join(';'));
  return r.value;
}
export function requireRefusal<T>(r: CodecResult<T>, reason: string): void {
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.reasons.join(';')).toContain(reason);
}
// Names identify contract obligations, not generated expected results or a new runner.
export const completedKnowledgeFamilies = ['level1-no-consumed-author', 'level2-whole-unit', 'historical-context', 'receipt-known-presence', 'session-parent-independence', 'pending-final-readbacks', 'independent-source-comparison'] as const;

// Public GraphRun/DerivedExecutionSpec DTO and D domains (ratified04/R4 API:365–390).
// Input is the QA-owned fixture+raw origin, NEVER a result returned by a producer.
export function expectedRun(f: Manual, originUtf8: string) {
  const envelope = envelopeValue(f), a = f.body.admissionSource;
  const derivedSpec = { version: 'l8-execution-derived-v3', sourceSpecFingerprint: fp(decode(a.executionSourceSpec)), templateFingerprint: fp(decode(a.executionTemplate)), inputManifestFingerprint: fp(decode(a.inputManifestSource.document)),
    envelopeFingerprint: envelope.fingerprint, planId: f.planning.plan.planId, planFingerprint: f.planning.plan.fingerprint, sidecarFingerprint: f.planning.sidecar.fingerprint, bindingFingerprint: f.planning.binding.fingerprint,
    snapshotId: f.snapshot.snapshotId, partitionId: f.partition.partitionId, knowledgeRevision: f.snapshot.knowledgeRevision };
  const body = { version: 'l8-graph-run-v3', mode: 'offline-fixture-v1', missionId: f.body.missionId, generationId: 'l8gen:' + envelope.fingerprint, envelopeFingerprint: envelope.fingerprint,
    envelope: { ref: { kind: 'l8-execution-envelope-v1', encoding: 'utf8-json-v1', byteLength: bytes(originUtf8).length, sha256: sha(originUtf8) }, utf8: originUtf8 },
    derivedSpec, derivedSpecFingerprint: value('l8-execution-derived-v3', derivedSpec).sha256 };
  const run = { ...body, fingerprint: value('l8-graph-run-v3', body).sha256 };
  return { run, document: bd('l8-graph-run-v3', run) };
}
