import type { GraphSnapshotV1 } from '../../../src/graph';
import { fixtureJson, sha } from '../oracle/wire';
export const H = 'a'.repeat(64);
export function manualSnapshot(): GraphSnapshotV1 {
  const snapshot: Omit<GraphSnapshotV1, 'normalizedFingerprint'> = {
    schemaVersion: 1, snapshotId: 'qa-snapshot', missionId: 'qa-mission',
    binaryArtifacts: [{ schemaVersion: 1, artifactId: 'qa-artifact', moduleName: 'qa.exe', contentSha256: H,
      versionLabel: 'qa-v1', format: 'PE32', architecture: 'x86-32', imageBase: '0x400000', idbIdentity: 'synthetic-only',
      sections: [], provenance: { moduleSha256: H, siteRva: null, siteKind: 'extractor', xrefType: 'none', source: 'manual-qa',
        sourceVersion: '1', sourceHash: H, evidenceSha256: H }, analysisVersion: '1', extractorVersion: '1' }],
    nodes: [{ schemaVersion: 1, id: H + ':0x2', moduleSha256: H, rva: '0x2', ea: '0x400002', imageBase: '0x400000', name: 'qa_function',
      observedDescription: 'Aé😀', boundaries: [], sizeBytes: { known: false, value: null }, instructionCount: { known: false, value: null },
      basicBlockCount: { known: false, value: null }, functionClass: 'incomplete', status: 'incomplete', semanticMaturity: 'none', analysisRefs: [],
      byteAgreement: 'unknown', admissibleAsOracle: false, byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null } }],
    edges: [], objects: [], unresolved: [], capabilities: [], knowledgeRevision: 0,
    scope: { description: 'independent synthetic fixture', moduleSha256s: [H], functionCount: 1 },
    coverage: { status: 'partial', uncoveredReason: 'synthetic incomplete function', tailsIterated: false, selfLoopsPreserved: true },
    toolVersions: { extractor: 'manual-qa', extractorHash: H, normalizer: 'qa-v1' }, configFingerprint: H,
  };
  return { ...snapshot, normalizedFingerprint: sha(fixtureJson(snapshot)) };
}
export function rehashSnapshot(s: GraphSnapshotV1): void {
  const { normalizedFingerprint: ignored, ...body } = s;
  s.normalizedFingerprint = sha(fixtureJson(body));
}
