import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8', phase = root + '/.tmp/coordination-three-20261014';
const go = JSON.parse(readFileSync(phase + '/l7-copy851-review-dynamic-actual-final-go-20261016.json', 'utf8'));
const run = go.proofDirectory + '/DYNAMIC-5620a967a0ed', sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const endpoint = await Service.discover(); assert(endpoint);
const cli = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const session = await cli.session.get({ sessionID: go.session }); assert.deepEqual(session.model, go.model);
const page = await cli.message.list({ sessionID: session.id, limit: 40, order: 'desc' });
const publicTools: any[] = [], publicTexts: any[] = [];
const scan = (v: any, messageId: string) => {
  if (!v || typeof v !== 'object' || v.type === 'reasoning') return;
  if (v.name && v.state?.input && JSON.stringify(v.state.input).includes('HOLD env/guard changed')) publicTools.push({ messageId, name: v.name, time: v.time, input: v.state.input, status: v.state.status, error: v.state.error });
  if (v.type === 'text' && typeof v.text === 'string' && v.text.includes('HOLD env/guard changed')) publicTexts.push({ messageId, text: v.text });
  for (const child of Object.values(v)) if (child && typeof child === 'object') scan(child, messageId);
}; for (const m of page.data) if (m.type !== 'user') scan(m.content, m.id);
assert(publicTools.some(t => t.input.code?.includes('ctx_execute'))); assert(publicTexts.some(t => t.text.includes('HOLD env/guard changed')));
const old4 = readdirSync(run).filter(f => ['preflight.json', 'typecheck.lifecycle.json', 'typecheck.stderr.log', 'typecheck.stdout.log'].includes(f)).map(path => { const b = readFileSync(run + '/' + path); return { path, bytes: b.length, sha256: sha(b) }; });
assert.equal(old4.length, 4); assert(!readdirSync(run).some(f => /^(focused|target|tests|probe)/.test(f)));
const tc = JSON.parse(readFileSync(run + '/typecheck.lifecycle.json', 'utf8')); assert.equal(tc.exit, 0); assert.equal(tc.pid, 45324); assert(tc.naturalExit && tc.parentEnvironmentUnchanged);
const pre = JSON.parse(readFileSync(run + '/preflight.json', 'utf8')); assert.equal(pre.totalPins, 393); assert.equal(pre.totalBytes, 9002942);
const out = { at: new Date().toISOString(), task: go.task, session: session.id, model: session.model, run,
  publicInputsAndOutputsOnlyNoPrivateReasoning: true, publicFailedWrapperInputs: publicTools, publicFailureOutputs: publicTexts,
  originalFourProofPins: old4, typecheck0RemainsValidAndNotRerun: true,
  noTargetLifecycleOrLogOrProbeArtifactObservedBeforeNewQualification: true,
  workerReportedTargetAndProbeInvocations0NoDbCreated: true,
  originalWholeProcessEnvSha256: pre.envBeforeSha256, originalSelectedLocalAppData: pre.localAppData, originalSelectedAppData: pre.appData,
  originalGuardCaseInsensitiveNames: pre.guardCaseInsensitiveNames,
  qualification: 'whole process.env SHA from a different ctx_execute sandbox cannot identify changed fields or attribute failure to guard; no original full per-key snapshot exists',
  noAssertionWhichKeyDifferedOrThatGuardChangedOrThatAllCrossProcessVariationIsHarmless: true,
  stage: 'SETUP_HOLD originalTargetGoNotConsumedByAnyTargetInvocation no wrapperFixOrTargetRerunAuthorizedYet' };
writeFileSync(phase + '/l7-copy851-review-env-setup-hold-public-audit-20261016.json', JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ at: out.at, session: out.session, failedWrapperInputs: publicTools.length, failureOutputs: publicTexts.length, old4, tcExit: tc.exit,
  selectedLocalAppData: pre.localAppData, selectedAppData: pre.appData, originalGuardNames: pre.guardCaseInsensitiveNames, stage: out.stage }));
