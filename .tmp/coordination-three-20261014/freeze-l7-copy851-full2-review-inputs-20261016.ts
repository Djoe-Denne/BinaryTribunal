import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L7_COPY851_FULL2_REVIEW_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const v = JSON.parse(readFileSync(phase + '/l7-copy-full2-final-parent-verification-20261016.json', 'utf8'));
assert(v.stage.startsWith('FULL2_FINAL_DELIVERY_CONFORMING'));
const baseline = JSON.parse(readFileSync(v.own + '/inputs/L7_COPY_FULL2_GATE_20261016/BASELINE.json', 'utf8'));
const legacy = JSON.parse(readFileSync(phase + '/l7-namespace-review-preparation-request-20261016.json', 'utf8'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const allowed = new Set(['source', 'test', 'rule', 'knowledge', 'native', 'manifest', 'proposal', 'score']);
const files = new Map<string, { bytes: Buffer; kind: string; origin: string }>();
const put = (p: string, b: Buffer, kind: string, origin: string) => {
  assert(!p.includes(':') && !p.split('/').includes('..') && !files.has(p) && b.length <= 8 * 1024 * 1024 && allowed.has(kind));
  assert.notEqual(b.subarray(0, 15).toString(), 'SQLite format 3'); files.set(p, { bytes: b, kind, origin });
};
assert.equal(baseline.current370.length, 370);
for (const f of baseline.current370) {
  const b = readFileSync(v.own + '/' + f.path); assert.equal(sha(b), f.sha256);
  const kind = legacy.files.find((g: any) => g.path === f.path)?.kind ?? (f.path.includes('/test/') ? 'test' : f.path.endsWith('.ts') ? 'source' : 'knowledge');
  put(f.path, b, kind, 'current exact frozen370 dependency/root-fixture/candidate pins; no prior reviewer analyses inherited');
}
const sourcePins = baseline.greenCandidates4;
for (const f of sourcePins) assert.equal(sha(readFileSync(v.run + '/candidate-' + (sourcePins.indexOf(f) + 1) + '-' + f.path.split('/').at(-1))), f.sha256);
put('PARENT/SCOPE.md', readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY851_FULL2_FRESH_REVIEW_SCOPE_20261016.md'), 'rule', 'current staged fresh NONBLIND whole-L7 review scope');
put('PARENT/CANDIDATE_PINS.json', Buffer.from(JSON.stringify({ candidate4Bytes: 195451, candidates: sourcePins, dto33: baseline.publicDto33 }, null, 2) + '\n'), 'manifest', 'current candidate identities, all body/API invariants still require review');
for (const [target, source] of [
  ['PARENT/APPROVED_COPY_PLAN.md', root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_PLAN_APPROVAL_20261016.md'],
  ['PARENT/APPROVED_ARCHIVE_REPLAN.md', legacy.sourceRoot + '/PARENT/ARCHIVE_REPLAN_APPROVAL.md'],
  ['PARENT/APPROVED_MANUAL_V2.md', legacy.sourceRoot + '/PARENT/MANUAL_V2_AMENDMENT.md'],
  ['PARENT/TC195_CONTRACT.md', root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_TC195_GATE_20261016.md'],
  ['PARENT/FULL1_QUALIFIED.md', root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_FULL_RED_QUALIFIED_20261016.md'],
  ['PARENT/FULL2_USER_GO.md', root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_LAUNCHER_ONLY_USER_GO_20261016.md'],
  ['PARENT/FULL2_CONTRACT.md', root + '/docs/missions/re-graph-scheduler/L7_COPY_BOUNDARY_FULL2_LAUNCHER_GATE_20261016.md'],
  ['PARENT/FULL2_PARENT.json', phase + '/l7-copy-full2-final-parent-verification-20261016.json'],
  ['EVIDENCE/FULL2_ARTIFACTS.json', v.run + '/ARTIFACTS.json'],
  ['EVIDENCE/FULL2_HANDOFF.md', v.run + '/HANDOFF.md'],
  ['EVIDENCE/FULL2_POSTFLIGHT.json', v.run + '/postflight.json'],
  ['EVIDENCE/FULL2_ANALYSIS.json', v.run + '/full-analysis.json'],
  ['EVIDENCE/FULL2_CASES.json', v.run + '/full-cases.json'],
  ['EVIDENCE/FULL2_END.json', v.run + '/full.end.json'],
  ['EVIDENCE/FULL2_STDOUT.log', v.run + '/full.stdout.log'],
  ['EVIDENCE/FULL2_STDERR.log', v.run + '/full.stderr.log'],
  ['EVIDENCE/FULL1_FAILURES_COMPARISON.json', v.run + '/full1-failures-comparison.json'],
] as const) put(target, readFileSync(source), target.includes('APPROVED') || target.includes('CONTRACT') || target.includes('GO.md') ? 'rule' : 'knowledge', 'public parent contract or frozen evidence; archived paths confer no physical access');
const notes = { role: 'fresh independent NONBLIND readonly Plan SolMAX review of complete unaccepted L7 copy851 full2 candidate',
  stage: 'INITIAL_HOLD then ACCESS_ONLY readHashRoleConditionsAck then distinct STATIC_REVIEW_GO; dynamic later separate parent GO',
  frozen370CurrentPinsAnd4CandidatesNoPriorReviewerAnalysisOrTranscriptCopied: true,
  sourceOfTruth851NotHistorical6d00Full1RedV1V2StillPreservedNotReclassified: true,
  noRawDbNoLedger9MbTransferredNoPermissionToOld22L7Or636L8DbOtherSessionOrMain: true,
  currentUnacceptedL8Runtime16NotIntegratedIntoThisCandidateOrTransferred: true,
  rootNative98AndRegistriesPartialOfflineFixturesNotScientificNativeAuthority: true,
  modelsPolicies4_2Budget5ManualClassificationUnchanged: true,
  noSourceWriteOrProductExecutionBeforeStagedGates: true };
put('PARENT/NOTES.json', Buffer.from(JSON.stringify(notes, null, 2) + '\n'), 'rule', 'current role and stage boundaries');
const manifest = Buffer.from(JSON.stringify({ ...notes, files: [...files].map(([path, f]) => ({ path, bytes: f.bytes.length, sha256: sha(f.bytes), kind: f.kind, origin: f.origin })) }, null, 2) + '\n');
put('REVIEW_INPUT_MANIFEST.json', manifest, 'manifest', 'current whole review package pins');
for (const [p, f] of files) { mkdirSync(dirname(sourceRoot + '/' + p), { recursive: true }); writeFileSync(sourceRoot + '/' + p, f.bytes, { flag: 'wx' }); }
const out = { at: new Date().toISOString(), sourceRoot, files: files.size, bytes: [...files.values()].reduce((n, f) => n + f.bytes.length, 0),
  manifestSha256: sha(manifest), scopeBytes: files.get('PARENT/SCOPE.md')!.bytes.length, scopeSha256: sha(files.get('PARENT/SCOPE.md')!.bytes),
  frozenCurrent370Candidate4_195451AndDto33NoRawDbNoPrivateReviewOracleNo9MbLedger: true,
  stage: 'FROZEN_REVIEW_INPUTS_ONLY no reviewer dispatched or access approved by freeze' };
writeFileSync(phase + '/l7-copy851-review-freeze-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
