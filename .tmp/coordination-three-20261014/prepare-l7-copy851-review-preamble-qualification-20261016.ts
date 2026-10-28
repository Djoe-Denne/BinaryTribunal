import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const original = JSON.parse(readFileSync(phase + '/l7-copy851-review-preparation-request-20261016.json', 'utf8'));
const admission = JSON.parse(readFileSync(phase + '/l7-copy851-review-native-admission-20261016.json', 'utf8'));
const auditBytes = readFileSync(phase + '/l7-copy851-review-preamble-public-audit-20261016.json');
const audit = JSON.parse(auditBytes.toString('utf8')), sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const indexed = audit.publicTexts.find((t: any) => t.messageId === 'msg_145ca589300199jeWJxxyTI7fS');
assert(indexed && Buffer.byteLength(indexed.text) >= 8554 && indexed.text.includes('L7-SIMULATOR-FIX-MAX'));
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: original.targetSessionId });
assert.deepEqual(session.model, { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'max' }); assert.equal(session.location.directory.replaceAll('\\', '/'), root);
const response = await fetch('http://127.0.0.1:4747/api/state'); assert(response.ok);
const team = (await response.json()).teams.find((t: any) => t.id === original.missionId);
const task = team.tasks.find((t: any) => t.id === original.taskId); assert.equal(task.status, 'in_progress'); assert.equal(task.assignee, 'l7-copy851-review');
for (const f of original.files) assert.equal(sha(readFileSync(original.destinationRoot + '/' + f.path)), f.sha256);
assert(!existsSync(admission.plannedTempRootOnlyAfterSeparateDynamicGo));
const summary = { at: new Date().toISOString(), task: task.id, session: session.id, model: session.model,
  parentPublicAuditSha256: sha(auditBytes), publicIndexedResultMessageId: indexed.messageId,
  indexedResultUtf8Bytes: Buffer.byteLength(indexed.text), indexedResultSha256: sha(indexed.text),
  exposure: 'public historical task descriptions including earlier L7 findings/parent counterexample summaries, not strictly packet-only preamble',
  publicAuditNoPrivateReasoningOrPriorReviewerSessionTranscriptReadOrCopied: true,
  noOldReviewReportOrCandidateBodyBeforeApprovedPacketAccessObserved: true,
  actual391AccessHashAndFullContractsAckConformingButNotStaticReviewGo: true,
  parentDecision: 'retain native fresh independent NONBLIND admissibility with disclosed public-summary exposure, independent code rederivation and no shared-index queries',
  noClaimBlindOrZeroInboxSinceCreationNoOldConclusionsSeen: true,
  immutable391PackageNoContextIndexPurgeOrGlobalConfigReset: true,
  additionalQualification2FilesAccessAckThenNativePinsAndDistinctStaticGoStillPending: true,
  noStaticSemanticReviewProductExecutionTypecheckTestProbeDbTempOrIntegrationGo: true };
const sourceRoot = phase + '/L7_COPY851_PREAMBLE_QUALIFICATION_INPUTS_20261016'; assert(!existsSync(sourceRoot)); mkdirSync(sourceRoot);
const files = [
  { path: 'DECISION.md', bytes: readFileSync(root + '/docs/missions/re-graph-scheduler/L7_COPY851_REVIEW_PREAMBLE_QUALIFICATION_20261016.md'), kind: 'rule' },
  { path: 'AUDIT_SUMMARY.json', bytes: Buffer.from(JSON.stringify(summary, null, 2) + '\n'), kind: 'manifest' },
]; for (const f of files) writeFileSync(sourceRoot + '/' + f.path, f.bytes, { flag: 'wx' });
const q = { ...original, sourceRoot, destinationRoot: root + '/inputs/L7_COPY851_PREAMBLE_QUALIFICATION_20261016', files: files.map(f => ({ path: f.path, sha256: sha(f.bytes), kind: f.kind })) };
writeFileSync(phase + '/l7-copy851-preamble-qualification-request-20261016.json', JSON.stringify(q, null, 2) + '\n', { flag: 'wx' });
const out = { ...summary, destination: q.destinationRoot, files: 2, bytes: files.reduce((n, f) => n + f.bytes.length, 0), decisionBytes: files[0].bytes.length, decisionSha256: sha(files[0].bytes),
  stage: 'SUPPLEMENT_ACCESS_ONLY complete2ReadHashConditionsAck then freshNative391Plus2ReadbackAndDistinctSTATIC_REVIEW_GO pending' };
writeFileSync(phase + '/l7-copy851-preamble-qualification-parent-decision-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
