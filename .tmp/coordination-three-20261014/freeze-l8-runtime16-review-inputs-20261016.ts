import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const sourceRoot = phase + '/L8_RUNTIME16_REVIEW_INPUTS_20261016'; assert(!existsSync(sourceRoot));
const prior = JSON.parse(readFileSync(phase + '/l8-a2-review-preparation-request-20261016.json', 'utf8'));
const full = JSON.parse(readFileSync(phase + '/l8-runtime16-full-final-parent-verification-20261016.json', 'utf8'));
assert(full.stage.startsWith('FULL16_DELIVERY_CONFORMING'));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex'), norm = (p: string) => p.replaceAll('\\', '/');
const files = new Map<string, { bytes: Buffer; kind: string; origin: string }>();
const put = (path: string, bytes: Buffer, kind: string, origin: string, overlay = false) => {
  assert(!path.split('/').includes('..') && !path.includes(':') && bytes.length <= 8 * 1024 * 1024);
  assert.notEqual(bytes.subarray(0, 15).toString(), 'SQLite format 3', 'No raw database transfer');
  assert(overlay || !files.has(path)); files.set(path, { bytes, kind, origin });
};
assert.equal(prior.files.length, 445);
for (const f of prior.files) {
  const bytes = readFileSync(prior.sourceRoot + '/' + f.path); assert.equal(sha(bytes), f.sha256);
  const path = ['PARENT/SCOPE.md', 'PARENT/NOTES.json', 'REVIEW_INPUT_MANIFEST.json'].includes(f.path)
    ? 'HISTORICAL/RUNTIME15/' + f.path : f.path;
  put(path, bytes, f.kind, 'unchanged445pin frozen dependency/contracts base; prior scope/identity is historical, not active rights');
}
for (const f of full.runtime16) {
  const bytes = readFileSync(f.frozenPath); assert.equal(sha(bytes), f.sha256);
  assert(bytes.equals(readFileSync(f.path)));
  const path = norm(f.path).slice(full.own.length + 1); assert(path.startsWith('tools/ff8-harness/'));
  put(path, bytes, path.endsWith('.test.ts') ? 'test' : 'code', 'current frozen whole runtime16 source of truth ' + full.deliverySha256, true);
}
put('PARENT/SCOPE.md', readFileSync(root + '/docs/missions/re-graph-scheduler/L8_RUNTIME16_FRESH_REVIEW_SCOPE_20261016.md'), 'rule', 'current fresh independent NONBLIND scope and staged permissions');
put('PARENT/RUNTIME16_PINS.json', Buffer.from(JSON.stringify({ runtime16Bytes: full.runtime16Bytes, pins: full.runtime16.map((f: any) => ({ path: norm(f.path).slice(full.own.length + 1), bytes: f.bytes, sha256: f.sha256 })) }, null, 2) + '\n'), 'manifest', 'current runtime16 exact identities');
for (const [target, source] of [
  ['PARENT/APPROVED_CORRECTIVE_PLAN.md', root + '/docs/missions/re-graph-scheduler/L8_A2_CORRECTIVE_PLAN_APPROVAL_20261016.md'],
  ['PARENT/APPROVED_TEST321.md', root + '/docs/missions/re-graph-scheduler/L8_A2_TEST321_TYPING_AMENDMENT_20261016.md'],
  ['PARENT/C_COPY_CONTRACT.md', root + '/docs/missions/re-graph-scheduler/L8_A2_LEGACY_C_COPY_GATE_20261016.md'],
  ['PARENT/FULL16_CONTRACT.md', root + '/docs/missions/re-graph-scheduler/L8_RUNTIME16_FULL_GATE_20261016.md'],
  ['PARENT/FULL_PARENT.json', phase + '/l8-runtime16-full-final-parent-verification-20261016.json'],
  ['PARENT/C_PARENT.json', phase + '/l8-a2-c-copy-final-parent-verification-20261016.json'],
  ['EVIDENCE/FULL16_DELIVERY.json', full.run + '/delivery.json'],
  ['EVIDENCE/FULL16_QUALIFICATION.json', full.run + '/qualification.json'],
  ['EVIDENCE/FULL16_REPORT.md', full.run + '/REPORT.md'],
  ['EVIDENCE/FULL16_REPORTING_QUALIFICATIONS.json', full.run + '/REPORTING_QUALIFICATIONS.json'],
  ['EVIDENCE/FULL16_END.json', full.run + '/full.end.json'],
  ['EVIDENCE/FULL16_STDOUT.log', full.run + '/full.stdout.log'],
  ['EVIDENCE/FULL16_STDERR.log', full.run + '/full.stderr.log'],
  ['EVIDENCE/C_PUBLIC_RESULTS.json', JSON.parse(readFileSync(phase + '/l8-a2-c-copy-preflight-parent-observation-20261016.json', 'utf8')).run + '/public-results.json'],
] as const) put(target, readFileSync(source), target.includes('CONTRACT') || target.includes('APPROVED') ? 'rule' : 'knowledge', 'frozen public parent contract/evidence only; absolute archived paths do not grant access');
const notes = { role: 'fresh independent NONBLIND SolMAX readonly reviewer of complete unaccepted runtime16',
  stage: 'INITIAL_HOLD then ACCESS_ONLY readHashRoleConditionsAck then parent STATIC_REVIEW_GO; dynamic requires separate later GO',
  sourceDelivery: full.deliverySha256, runtime16Bytes: full.runtime16Bytes,
  authorAndCompletedReviewSessionsNeverReopenedOrRead: true,
  noRawDatabasesCopiedNoPermissionToAny540HistoricalDbOrOldAuthorPaths: true,
  noL7Source851OrOtherUnacceptedCurrentCandidateTransferred: true,
  historicalContractsRetainedNotHistoricalIdentityCountsOrPermissionReactivated: true,
  opaqueUnitFingerprintsAndS_C_N_TAndScienceNativeBoundariesUnchanged: true,
  providerPolicy4ModelPolicy2ManualClassificationBudget5Unchanged: true,
  fixtureHelperWritesOnlyNewPackageOwnedMetadataAfterDynamicGoNoSourceWrite: true };
put('PARENT/NOTES.json', Buffer.from(JSON.stringify(notes, null, 2) + '\n'), 'rule', 'current stage and provenance boundaries');
const manifest = Buffer.from(JSON.stringify({ ...notes, files: [...files].map(([path, f]) => ({ path, bytes: f.bytes.length, sha256: sha(f.bytes), kind: f.kind, origin: f.origin })) }, null, 2) + '\n');
put('REVIEW_INPUT_MANIFEST.json', manifest, 'manifest', 'current full review package pins'); assert(files.size <= 512);
for (const [p, f] of files) { mkdirSync(dirname(sourceRoot + '/' + p), { recursive: true }); writeFileSync(sourceRoot + '/' + p, f.bytes, { flag: 'wx' }); }
const out = { at: new Date().toISOString(), sourceRoot, files: files.size, bytes: [...files.values()].reduce((n, f) => n + f.bytes.length, 0),
  manifestSha256: sha(manifest), scopeBytes: files.get('PARENT/SCOPE.md')!.bytes.length, scopeSha256: sha(files.get('PARENT/SCOPE.md')!.bytes),
  runtime16Bytes: full.runtime16Bytes, noRawDbOrL7CurrentCandidateNoReviewerDispatchedByFreeze: true };
writeFileSync(phase + '/l8-runtime16-review-freeze-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
