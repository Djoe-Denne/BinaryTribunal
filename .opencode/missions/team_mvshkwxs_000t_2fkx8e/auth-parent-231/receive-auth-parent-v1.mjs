// AUTH231 CANDIDATE. Native parent Connect receiver, NEVER a capability issuer.
import { readFileSync, lstatSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { dirname, join, win32 } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Database } from 'bun:sqlite';
const HERE = dirname(fileURLToPath(import.meta.url));
const PREPARE_SHA = '01fa116885f974bc5592c6e47edcd05578a35c30fa0cb84fbfad1d5cb53c4e95';
const hash = b => createHash('sha256').update(b).digest('hex');
const check = ok => { if (!ok) throw new Error('AUTH_RECEIVE_REFUSED'); };
const keys = (v, names) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === names.length && names.every(n => Object.hasOwn(v, n));
const integer = n => Number.isSafeInteger(n) && n >= 0;
const digest = s => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);
async function bounded(pending, ms) {
  let timer; try { return await Promise.race([pending, new Promise(resolve => { timer = setTimeout(() => resolve(false), Math.max(1, ms)); })]); }
  finally { if (timer !== undefined) clearTimeout(timer); }
}
const uuid = s => typeof s === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(s);
const AUTH_STATUS = ['INTENDED', 'CONNECT_CLAIMED', 'ATTEMPT_KNOWN', 'PENDING', 'COMPLETE', 'FAILED', 'EXPIRED', 'HOLD', 'REVOKED', 'NOT_RETAINED'];
const FAILURES = ['AUTH_TOTAL_DEADLINE', 'AUTH_WORK_DEADLINE_RESERVE_CLOSE', 'AUTH_CHILD_KILL_REFUSED', 'AUTH_CHILD_KILL_IDENTITY_REFUSED',
  'AUTH_PRIVATE_PARENT_DISCONNECTED', 'AUTH_PRIVATE_UI_UNAVAILABLE', 'AUTH_CHILD_ERROR', 'AUTH_LOG_SHAPE', 'AUTH_LOG_BOUND', 'AUTH_BOOTSTRAP_HOLD',
  'AUTH_IPC_OR_CUSTODY_REFUSED', 'AUTH_INIT_FAILED', 'AUTH_ATTEMPT_SEND_FAILED', 'AUTH_EXPIRED', 'AUTH_REFUSED', 'AUTH_HTTP_REFUSED',
  'AUTH_IO_TIMEOUT', 'AUTH_IO_AMBIGUOUS', 'AUTH_RESPONSE_REFUSED', 'AUTH_REFUSED_OR_AMBIGUOUS_NO_RETRY', 'AUTH_STOP_SEND_FAILED', 'AUTH_STOP_FAILED',
  'AUTH_CHILD_CLOSE_UNPROVEN', 'AUTH_DETACHED_CLEANUP_UNCERTAIN', 'AUTH_GRACEFUL_CLOSURE_UNPROVEN', 'AUTH_AUTHORITY_CHANGED_BEFORE_FINALIZATION',
  'AUTH_FINALIZATION_FAILED', 'AUTH_FINAL_AUTHORITY_CHANGED', 'AUTH_OWN_CLOSE_FAILED'];
function publicData(d, provisional = false) {
  const fields = ['version', 'status', 'authOnly', 'provider', 'method', 'intentId', 'invocationId', 'nativeLoadEvidence', 'workAuthority',
    'modelOrSessionEffects', 'rootOrOriginAuthority', 'preflightProgress', 'logs', 'noRetryOrCleanup', 'nativeDbIdentity', 'runtimeAuthPersisted',
    'connectClaimed', 'attemptId', 'authStatus', 'credentialMayHavePersisted', 'failure', 'pid', 'scopeClosed', 'childClosed', 'childExit', 'forced',
    'durationMs', 'privateNativeDirectoryMustBePreservedNotIngested', 'nativeDbNeverReadOrCopiedOrHashed', 'completionProtocol', 'publicStatuses'];
  if (!provisional) fields.push('provisionalReceipt', 'deadline');
  check(keys(d, fields) && d.version === 'rms-owned-auth-outcome-v1' && d.status === (provisional ? 'PROVISIONAL_NOT_ADOPTABLE' : 'AUTH_CONNECTED_ONLY_NO_WORK_AUTHORITY')
    && d.authOnly === true && d.provider === 'openai' && d.method === 'chatgpt-headless' && uuid(d.intentId) && uuid(d.invocationId)
    && d.nativeLoadEvidence === 'UNPROVEN' && d.workAuthority === false && d.modelOrSessionEffects === 0 && d.rootOrOriginAuthority === false
    && d.noRetryOrCleanup === true && d.runtimeAuthPersisted === true && d.connectClaimed === true && typeof d.attemptId === 'string' && /^con_[A-Za-z0-9_]{1,160}$/.test(d.attemptId)
    && d.authStatus === 'COMPLETE' && d.credentialMayHavePersisted === true && d.failure === null && integer(d.pid) && d.pid > 0
    && d.scopeClosed === true && d.childClosed === true && keys(d.childExit, ['code', 'signal']) && d.childExit.code === 0 && d.childExit.signal === null
    && d.forced === false && integer(d.durationMs) && d.durationMs <= 240000 && d.privateNativeDirectoryMustBePreservedNotIngested === true && d.nativeDbNeverReadOrCopiedOrHashed === true);
  check(keys(d.nativeDbIdentity, ['encoding', 'devDecimal', 'inoDecimal']) && d.nativeDbIdentity.encoding === 'decimal-bigint-v1'
    && typeof d.nativeDbIdentity.devDecimal === 'string' && typeof d.nativeDbIdentity.inoDecimal === 'string'
    && /^(0|[1-9][0-9]*)$/.test(d.nativeDbIdentity.devDecimal) && /^[1-9][0-9]*$/.test(d.nativeDbIdentity.inoDecimal));
  check(keys(d.publicStatuses, ['authentication', 'invocation', 'closure']) && d.publicStatuses.authentication === 'PERSISTED'
    && d.publicStatuses.invocation === 'COMPLETED_AUTH_ONLY' && d.publicStatuses.closure === 'NORMAL');
  const p = d.preflightProgress;
  check(keys(p, ['phase', 'stage', 'hold', 'total', 'admitted', 'started', 'verified', 'settled', 'failed', 'inFlight', 'maxInFlight', 'bytesVerified', 'reservedDeclaredBytes', 'maxReservedDeclaredBytes', 'elapsedMs'])
    && p.phase === 'complete' && p.stage === 'verified' && p.hold === false && ['total', 'admitted', 'started', 'verified', 'settled'].every(n => p[n] === 32227)
    && p.failed === 0 && p.inFlight === 0 && p.reservedDeclaredBytes === 0 && p.bytesVerified === 332635368
    && integer(p.maxInFlight) && p.maxInFlight > 0 && p.maxInFlight <= 4 && integer(p.maxReservedDeclaredBytes) && p.maxReservedDeclaredBytes <= 32 * 1024 * 1024
    && Number.isFinite(p.elapsedMs) && p.elapsedMs >= 0 && p.elapsedMs < 225000);
  check(Array.isArray(d.logs) && d.logs.length === 2 && d.logs.every((l, i) => keys(l, ['channel', 'receivedBytes', 'retainedBytes', 'discarded', 'byteExact'])
    && l.channel === ['stdout', 'stderr'][i] && integer(l.receivedBytes) && l.receivedBytes <= 1048576 && l.retainedBytes === 0 && l.discarded === true && l.byteExact === false));
  check(keys(d.completionProtocol, ['provisionalAloneAdoptable', 'candidateAloneAdoptable', 'parentObservedExitZeroRequired', 'parentMeasuredWholeInvocationAtMostMs', 'parentExactCandidateAndReceiptHashesRequired'])
    && d.completionProtocol.provisionalAloneAdoptable === false && d.completionProtocol.candidateAloneAdoptable === false && d.completionProtocol.parentObservedExitZeroRequired === true
    && d.completionProtocol.parentMeasuredWholeInvocationAtMostMs === 240000 && d.completionProtocol.parentExactCandidateAndReceiptHashesRequired === true);
  if (!provisional) check(keys(d.deadline, ['startedMonotonicMs', 'deadlineMonotonicMs', 'lastMonotonicMs', 'hold']) && d.deadline.hold === false
    && [d.deadline.startedMonotonicMs, d.deadline.deadlineMonotonicMs, d.deadline.lastMonotonicMs].every(n => Number.isFinite(n) && n >= 0)
    && d.deadline.lastMonotonicMs >= d.deadline.startedMonotonicMs && d.deadline.lastMonotonicMs < d.deadline.deadlineMonotonicMs
    && d.deadline.deadlineMonotonicMs > d.deadline.startedMonotonicMs && d.deadline.deadlineMonotonicMs - d.deadline.startedMonotonicMs <= 240000);
}
async function main() {
  const entryMono = performance.now(), entryWall = Date.now();
  check(import.meta.main && process.platform === 'win32' && process.versions.bun === '1.4.2' && process.execArgv.length === 0 && process.argv.length === 5);
  const [id, remainingText, psHash] = process.argv.slice(2); check(uuid(id) && /^[1-9][0-9]*$/.test(remainingText) && digest(psHash));
  const remaining = Number(remainingText); check(integer(remaining) && remaining <= 240000);
  const prepFile = join(HERE, 'prepare-auth-controller-v1.mjs'); check(hash(readFileSync(prepFile)) === PREPARE_SHA);
  const { parent231: h } = await import(pathToFileURL(prepFile).href);
  const { MISSION, C, HOST, BUN, sha, canonical, write, key, identity, pin, PRODUCT, SUPPORT, hostProvenance, observeOwn } = h;
  const out = join(HERE, `attempt-${id}`), requestPath = join(out, 'request-auth-v1.json');
  const reqBytes = readFileSync(requestPath), req = JSON.parse(reqBytes), act = JSON.parse(readFileSync(join(out, 'controller-act.json'), 'utf8'));
  const pm = JSON.parse(readFileSync(join(HERE, `prepare-${id}.marker.json`), 'utf8')), cm = JSON.parse(readFileSync(join(HERE, `connect-${id}.marker.json`), 'utf8'));
  check(keys(pm, ['version', 'intentId', 'expectedPriorFence', 'preparedAt', 'deadlineAt', 'clockStart', 'clockDeadline', 'clockFrequency'])
    && pm.version === 'rms-auth-native-prepare-marker-v1' && integer(pm.preparedAt) && integer(pm.deadlineAt) && integer(pm.expectedPriorFence)
    && pm.preparedAt <= entryWall && keys(cm, ['version', 'intentId', 'powerShellSha256', 'remainingMs']) && integer(cm.remainingMs) && cm.remainingMs >= remaining
    && keys(act.lease, ['missionId', 'owner', 'token', 'expiresAt']) && integer(act.lease.token) && integer(act.lease.expiresAt)
    && integer(act.expectedPriorFence) && integer(act.acquiredAt) && act.acquiredAt >= pm.preparedAt && act.lease.expiresAt === act.acquiredAt + 300000
    && integer(req.expiresAt) && integer(req.expectedControllerFence) && act.expectedPriorFence === pm.expectedPriorFence
    && key(process.execPath) === key(BUN));
  check(keys(req, ['version', 'purpose', 'missionId', 'ownPath', 'controllerId', 'principalId', 'actorId', 'mandateRef', 'expiresAt', 'expectedControllerFence', 'intentId', 'ui', 'connection'])
    && req.version === 'rms-parent-owned-auth-request-v1' && req.purpose === 'connect-owned-openai-auth-v1' && req.intentId === id && req.ui === 'private-parent-ipc-v1'
    && req.missionId === 'rms-qualification-6356b01f78a79192' && keys(req.connection, ['kind', 'namespace', 'provenance'])
    && req.connection.kind === 'owned-bun-openai-auth-v1' && req.connection.namespace === HOST
    && keys(req.connection.provenance, ['version', 'base', 'bootstrap', 'plan']) && req.connection.provenance.version === 'rms-owned-auth-provenance-v1'
    && keys(req.mandateRef, ['kind', 'encoding', 'byteLength', 'sha256']) && req.mandateRef.kind === 'rms-parent-file-bytes-v1' && req.mandateRef.encoding === 'raw-v1'
    && integer(req.mandateRef.byteLength) && digest(req.mandateRef.sha256));
  check(act.lease.missionId === req.missionId && act.lease.owner === req.controllerId);
  check(keys(act, ['version', 'status', 'intentId', 'preparedAt', 'deadlineAt', 'acquiredAt', 'lease', 'expectedPriorFence', 'ownIdentity', 'privateRootIdentity', 'sourcePins', 'supportingPins', 'requestSha256', 'afterSnapshotSha256', 'unchangedExceptLease', 'modelPermitReactivated', 'newRmsOrigins'])
    && act.version === 'rms-auth-controller-act-v1' && act.status === 'PREPARED_NO_AUTH_CONNECT' && act.intentId === id && act.requestSha256 === sha(reqBytes)
    && canonical(act.sourcePins) === canonical(PRODUCT) && canonical(act.supportingPins) === canonical(SUPPORT)
    && pm.intentId === id && pm.deadlineAt === pm.preparedAt + 240000 && req.expiresAt === pm.deadlineAt && act.deadlineAt === req.expiresAt && act.preparedAt === pm.preparedAt
    && cm.version === 'rms-auth-native-connect-marker-v1' && cm.intentId === id && cm.powerShellSha256 === psHash
    && req.expectedControllerFence === act.lease.token && act.lease.token === act.expectedPriorFence + 1 && act.lease.expiresAt > req.expiresAt
    && act.unchangedExceptLease === true && act.modelPermitReactivated === false && act.newRmsOrigins === 0 && Date.now() < req.expiresAt
    && !existsSync(join(out, 'rms-spawn-claim.json')) && !existsSync(join(out, 'FINALOUTCOME.json')));
  const start = entryMono, deadline = start + Math.min(remaining, req.expiresAt - entryWall);
  const budget = () => { check(performance.now() < deadline && Date.now() < req.expiresAt); };
  const pins = () => { for (const [n, digest] of Object.entries({ ...PRODUCT, ...SUPPORT })) pin(join(C, n), digest);
    pin(BUN, '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4', 86096984);
    pin(join(HOST, 'bootstrap-auth-v1.mjs'), '398a184afe71dc0b7abe41cb0fe1c47a7db0ef0b4b4667c618d009e188c76f76', 10124);
    pin(join(HOST, 'host-plan-auth-v1.json'), '2fdeb0e560621963b9bc53334a7e5b05788ce16b345febbbd28c3c17eac1d880', 1329);
    pin(join(MISSION, 'auth-parent-225/private-ui-relay-v1.mjs'), '8518b843eab468c34c1b0060f61c06e98cbe499c08079992d718e529c0674053', 11439);
    pin(join(MISSION, 'auth-parent-225/private-ui-window-v1.ps1'), '230f1855d3ffc753def468f5321c4325e864002f668c93decf86d199e22d212f', 9775);
    pin('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe', psHash);
    check(canonical(req.connection.provenance) === canonical(hostProvenance())); budget(); };
  pins();
  const metaPath = join(MISSION, 'evidence/owned-runtime-authority-preparation-205.json'); pin(metaPath, '9a7b8ee68340d5a25d2f1000ce6bc5be50338f71c5205e316f3bd64e0070b052', 2210);
  const prepared = JSON.parse(readFileSync(metaPath, 'utf8')); check(req.ownPath === prepared.ownPath && req.controllerId === prepared.expectedControllerId
    && req.principalId === prepared.expectedPrincipalId && req.actorId === prepared.expectedActorId && canonical(req.mandateRef) === canonical(prepared.mandateRef));
  const afterBytes = readFileSync(join(out, 'after-prepare.json')); check(sha(afterBytes) === act.afterSnapshotSha256);
  const before = observeOwn(req, prepared); check(canonical(before) === canonical(JSON.parse(afterBytes)) && before.lease.lease_until > req.expiresAt && canonical(before.ownIdentity) === canonical(act.ownIdentity));
  const root = join(HOST, `auth-private-${id}`); check(canonical(identity(root, true)) === canonical(act.privateRootIdentity) && readdirSync(root).length === 0);
  let child, relay, exit = null, signal = null, closed = false, killed = false, bad = false, stdoutBytes = 0, stderrBytes = 0;
  let chunks = [], readyFrames = 0, challengeFrames = 0, resolveClosed;
  const closedPromise = new Promise(resolve => { resolveClosed = resolve; });
  const outcome = { version: 'rms-auth-parent-FINALOUTCOME-v1', status: 'HOLD', intentId: id, startedAt: entryWall, endedAt: null,
    durationMs: null, exitCode: null, signal: null, rmsPid: null, hostPid: null, requestSha256: act.requestSha256,
    newRmsOrigins: null, newRmsOriginsAuthorized: 0, rmsAudit: 'UNPROVEN', workAuthority: false, nativeLoadEvidence: 'UNPROVEN', requiresNativeClockEnvelope: true,
    automaticRetry: false, resourcesReleased: 'NOT_INFERRED', credentialMayHavePersisted: 'UNKNOWN_UNTIL_ATTRIBUTED' };
  // The SAME conservation audit also runs on failed/ambiguous Auth. It grants
  // nothing and never turns an incomplete audit or running RMS into PASS.
  const auditFinishedRms = () => {
    check(!child || closed);
    const after = observeOwn(req, prepared);
    check(after.schemaSha256 === before.schemaSha256 && canonical(after.lease) === canonical(before.lease) && canonical(after.ownIdentity) === canonical(before.ownIdentity));
    for (const [name, value] of Object.entries(before.tableDigests)) if (!['ff8_events', 'ff8_graph_streams'].includes(name)) check(canonical(after.tableDigests[name]) === canonical(value));
    const db = new Database(req.ownPath, { readonly: true, strict: true }); let rows;
    try { db.transaction(() => {
      const prefix = db.query('SELECT mission,sequence,time,key,kind,unit_id,payload,digest FROM ff8_events WHERE sequence<=? ORDER BY mission,sequence').all(before.events.sequence);
      check(sha(canonical(prefix)) === before.events.prefixSha256);
      rows = db.query('SELECT mission,sequence,time,key,kind,unit_id,payload,digest FROM ff8_events WHERE sequence>? ORDER BY sequence').all(before.events.sequence);
    })(); } finally { db.close(); }
    check(rows.length <= 160); let sequence = before.events.sequence, time = before.events.time, revision = 0, stateDigest = null;
    let claimed = false, known = null, terminal = false, invocation = null, lastStatus = 'NO_INTENT';
    const scope = sha(canonical({ config: req, action: 'connect-owned-openai-auth-v1', argv: ['native-owned-auth', 'connect', requestPath] }));
    const projected = [];
    for (const [index, e] of rows.entries()) {
      const p = JSON.parse(e.payload);
      check(e.mission === req.missionId && e.sequence === ++sequence && integer(e.time) && e.time >= time && e.unit_id === null
        && e.digest === sha(canonical({ kind: e.kind, time: e.time, payload: p, unitId: null }))); time = e.time;
      if (index === 0) {
        check(child && e.key === `rms.auth.intent:${id}` && e.kind === 'rms_owned_auth_intent_v1'
          && keys(p, ['version', 'id', 'authOnly', 'provider', 'method', 'missionId', 'controllerOwner', 'controllerFence', 'principalId', 'actorId', 'invocationId', 'pid', 'ownPath', 'programSha256', 'scopeSha256', 'pinsSha256', 'issuedAt', 'expiresAt'])
          && p.version === 'rms-owned-auth-intent-v1' && p.id === id && p.authOnly === true && p.provider === 'openai' && p.method === 'chatgpt-headless'
          && p.missionId === req.missionId && p.controllerOwner === req.controllerId && p.controllerFence === req.expectedControllerFence && p.principalId === req.principalId && p.actorId === req.actorId
          && uuid(p.invocationId) && p.pid === child.pid && key(p.ownPath) === key(req.ownPath) && p.programSha256 === PRODUCT['src/client.ts']
          && p.scopeSha256 === scope && p.pinsSha256 === sha(canonical(req.connection.provenance)) && p.issuedAt === e.time && p.issuedAt >= entryWall && p.expiresAt === req.expiresAt);
        invocation = p.invocationId; stateDigest = sha(canonical(p)); lastStatus = 'INTENDED';
      } else {
        check(keys(p, ['version', 'id', 'revision', 'previousDigest', 'status', 'attemptId', 'at']) && e.kind === 'rms_owned_auth_transition_v1'
          && e.key === `rms.auth.transition:${id}:${++revision}` && p.version === 'rms-owned-auth-transition-v1' && p.id === id
          && p.revision === revision && p.previousDigest === stateDigest && p.at === e.time && AUTH_STATUS.includes(p.status) && p.status !== 'INTENDED');
        if (p.status === 'CONNECT_CLAIMED') { check(!claimed && !terminal && revision === 1 && p.attemptId === null); claimed = true; }
        else if (p.status === 'ATTEMPT_KNOWN') { check(claimed && !terminal && known === null && typeof p.attemptId === 'string' && /^con_[A-Za-z0-9_]{1,160}$/.test(p.attemptId)); known = p.attemptId; }
        else if (['HOLD', 'REVOKED'].includes(p.status)) { check(p.attemptId === known); terminal = true; }
        else { check(claimed && !terminal && known !== null && p.attemptId === known && ['PENDING', 'COMPLETE', 'FAILED', 'EXPIRED'].includes(p.status)); terminal = p.status !== 'PENDING'; }
        if (!['HOLD', 'REVOKED', 'FAILED', 'EXPIRED'].includes(p.status)) check(e.time < req.expiresAt);
        stateDigest = sha(canonical({ previous: stateDigest, transition: p })); lastStatus = p.status;
      }
      projected.push({ sequence: e.sequence, time: e.time, key: e.key, kind: e.kind, payload: p, digest: e.digest });
    }
    check(after.events.sequence === sequence && after.events.time === time && after.events.count === before.events.count + rows.length);
    if (outcome.invocationId) check(outcome.invocationId === invocation);
    const auditPin = write(join(out, 'rms-auth-audit.json'), { version: 'rms-auth-journal-audit-v1', intentId: id, unchangedOtherTables: 35, historicalPrefixPreserved: true,
      exactAuthEvents: projected, sourceInvocationId: invocation, status: lastStatus, claimed, attemptId: known, afterSnapshot: after });
    return { rmsAudit: 'EXACT_AUTH_SUFFIX_ONLY', rmsAuditPin: auditPin, newRmsOrigins: 0, credentialMayHavePersisted: claimed, authJournalStatus: lastStatus, unchangedOtherTables: 35 };
  };
  const stop = () => { bad = true; if (child && !closed && child.pid === outcome.rmsPid && child.spawnfile === BUN) {
    try { if (child.connected) child.disconnect(); } catch { /* No imported error text. */ }
  } };
  const total = setTimeout(stop, Math.max(1, deadline - performance.now() - 1000));
  try {
    const { createPrivateUiRelay } = await import(pathToFileURL(join(MISSION, 'auth-parent-225/private-ui-relay-v1.mjs')).href);
    relay = createPrivateUiRelay({ windowScriptPath: win32.resolve(join(MISSION, 'auth-parent-225/private-ui-window-v1.ps1')),
      powershellPath: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', deadlineMonotonicMs: deadline });
    const ui = await relay.start(); check(ui.phase === 'READY' && ui.authSuccess === false); budget();
    write(join(out, 'rms-spawn-claim.json'), { version: 'rms-auth-spawn-claim-v1', intentId: id, requestSha256: act.requestSha256, automaticRetry: false });
    const env = { SystemRoot: 'C:\\Windows', WINDIR: 'C:\\Windows', ComSpec: 'C:\\Windows\\System32\\cmd.exe', OS: 'Windows_NT', PATH: dirname(BUN) + ';C:\\Windows\\System32' };
    const argv = ['run', join(C, 'src/client.ts'), 'native-owned-auth', 'connect', requestPath];
    child = spawn(BUN, argv, { cwd: C, env, windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], serialization: 'json' });
    // Attach the existing relay synchronously, without yielding or logging IPC.
    const bound = relay.bindOwnedChild(child, id); outcome.rmsPid = Number.isSafeInteger(child.pid) ? child.pid : null;
    child.on('error', stop); child.once('close', (code, sig) => { exit = code; signal = sig; closed = true; resolveClosed(); });
    check(bound.phase === 'BOUND' && bound.rmsPid === child.pid && integer(child.pid) && child.pid > 0 && child.spawnfile === BUN);
    child.on('message', m => { // Identity/type counters only; NEVER serialize the message.
      if (m?.type === 'RMS_AUTH_PRIVATE_UI_READY') readyFrames++;
      else if (m?.type === 'RMS_AUTH_PRIVATE_UI_CHALLENGE') challengeFrames++;
      else bad = true;
      if (readyFrames > 2 || challengeFrames > 1 || m?.intentId !== id) stop();
    });
    relay.closed.then(v => { if (!closed && !['RMS_CHANNEL_CLOSED', 'PARENT_CLOSED'].includes(v.reason)) stop(); });
    child.stdout.on('data', b => { stdoutBytes += b.length; if (!Buffer.isBuffer(b) || stdoutBytes > 1048576) { chunks = []; stop(); } else if (!bad) chunks.push(b); });
    child.stderr.on('data', b => { stderrBytes += b.length; if (stderrBytes > 1048576) stop(); }); // no decoding/storage
    await bounded(closedPromise, deadline - performance.now() - 500);
    if (!closed) { stop(); try { if (child.pid === outcome.rmsPid && child.spawnfile === BUN) { killed = true; child.kill(); } } catch {} }
    await bounded(closedPromise, 1000);
    const uiClosed = await relay.close(); budget();
    check(!bad && !killed && closed && exit === 0 && signal === null && stderrBytes === 0 && readyFrames === 2 && challengeFrames === 1
      && uiClosed.windowExitObserved === true && uiClosed.rmsPid === child.pid && integer(uiClosed.windowPid) && uiClosed.windowPid > 0 && /^[1-9][0-9]{0,19}$/.test(uiClosed.windowHandle));
    const observedBytes = Buffer.concat(chunks), observedBytesSha256 = sha(observedBytes);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(observedBytes).trim(); chunks = [];
    const candidate = JSON.parse(text); check(text === JSON.stringify(candidate) && keys(candidate, ['event', 'resultSha256', 'data']) && candidate.event === 'native-owned-auth-candidate-v1' && digest(candidate.resultSha256));
    publicData(candidate.data); const d = candidate.data;
    check(d.intentId === id && sha(canonical(d)) === candidate.resultSha256);
    const ref = d.provisionalReceipt, receiptPath = join(HOST, `auth-receipt-${id}.json`);
    check(keys(ref, ['path', 'byteLength', 'sha256']) && key(ref.path) === key(receiptPath) && integer(ref.byteLength) && ref.byteLength < 1048576 && digest(ref.sha256));
    identity(receiptPath); const rb = readFileSync(receiptPath); check(rb.length === ref.byteLength);
    const provisional = JSON.parse(rb); publicData(provisional, true); check(rb.toString('utf8') === JSON.stringify(provisional, null, 2) && sha(rb) === ref.sha256);
    const { provisionalReceipt, deadline: _deadline, durationMs: duration, status: _status, ...stable } = d;
    const { durationMs: pduration, status: _pstatus, ...pstable } = provisional;
    check(canonical(stable) === canonical(pstable) && pduration <= duration);
    const nativeIdentity = identity(join(root, 'native.sqlite')); // metadata ONLY; no DB contents/SQL/hash
    check(canonical(nativeIdentity) === canonical(d.nativeDbIdentity) && canonical(identity(root, true)) === canonical(act.privateRootIdentity));
    const after = observeOwn(req, prepared); check(after.schemaSha256 === before.schemaSha256 && canonical(after.lease) === canonical(before.lease)
      && canonical(after.ownIdentity) === canonical(before.ownIdentity));
    for (const [name, td] of Object.entries(before.tableDigests)) if (!['ff8_events', 'ff8_graph_streams'].includes(name)) check(canonical(after.tableDigests[name]) === canonical(td));
    const db = new Database(req.ownPath, { readonly: true, strict: true }); let authRows;
    try { db.transaction(() => {
      const prefix = db.query('SELECT mission,sequence,time,key,kind,unit_id,payload,digest FROM ff8_events WHERE sequence<=? ORDER BY mission,sequence').all(before.events.sequence);
      check(sha(canonical(prefix)) === before.events.prefixSha256);
      authRows = db.query('SELECT mission,sequence,time,key,kind,unit_id,payload,digest FROM ff8_events WHERE sequence>? ORDER BY sequence').all(before.events.sequence);
    })(); } finally { db.close(); }
    check(authRows.length >= 4 && authRows.length <= 160); let sequence = before.events.sequence, time = before.events.time, revision = 0, stateDigest, claimed = false, attempt = null, stopped = false;
    const pinsSha = sha(canonical(req.connection.provenance)), scopeSha = sha(canonical({ config: req, action: 'connect-owned-openai-auth-v1', argv: argv.slice(2) }));
    for (const [index, e] of authRows.entries()) {
      const p = JSON.parse(e.payload); check(e.mission === req.missionId && e.sequence === ++sequence && integer(e.time) && e.time >= time && e.unit_id === null
        && e.digest === sha(canonical({ kind: e.kind, time: e.time, payload: p, unitId: null }))); time = e.time;
      if (index === 0) {
        check(e.key === `rms.auth.intent:${id}` && e.kind === 'rms_owned_auth_intent_v1'
          && keys(p, ['version', 'id', 'authOnly', 'provider', 'method', 'missionId', 'controllerOwner', 'controllerFence', 'principalId', 'actorId', 'invocationId', 'pid', 'ownPath', 'programSha256', 'scopeSha256', 'pinsSha256', 'issuedAt', 'expiresAt'])
          && p.version === 'rms-owned-auth-intent-v1' && p.id === id && p.authOnly === true && p.provider === 'openai' && p.method === 'chatgpt-headless'
          && p.missionId === req.missionId && p.controllerOwner === req.controllerId && p.controllerFence === req.expectedControllerFence && p.principalId === req.principalId && p.actorId === req.actorId
          && p.invocationId === d.invocationId && p.pid === child.pid && key(p.ownPath) === key(req.ownPath) && p.programSha256 === PRODUCT['src/client.ts']
          && p.scopeSha256 === scopeSha && p.pinsSha256 === pinsSha && p.issuedAt === e.time && p.issuedAt >= act.preparedAt && p.expiresAt === req.expiresAt); stateDigest = sha(canonical(p));
      } else {
        check(e.key === `rms.auth.transition:${id}:${++revision}` && e.kind === 'rms_owned_auth_transition_v1'
          && keys(p, ['version', 'id', 'revision', 'previousDigest', 'status', 'attemptId', 'at']) && p.version === 'rms-owned-auth-transition-v1'
          && p.id === id && p.revision === revision && p.previousDigest === stateDigest && p.at === e.time && e.time < req.expiresAt && AUTH_STATUS.includes(p.status));
        if (p.status === 'CONNECT_CLAIMED') { check(!claimed && !stopped && revision === 1 && p.attemptId === null); claimed = true; }
        else if (p.status === 'ATTEMPT_KNOWN') { check(claimed && !stopped && attempt === null && p.attemptId === d.attemptId); attempt = p.attemptId; }
        else { check(claimed && !stopped && attempt === d.attemptId && p.attemptId === attempt && ['PENDING', 'COMPLETE'].includes(p.status)); if (p.status === 'COMPLETE') stopped = true; }
        stateDigest = sha(canonical({ previous: stateDigest, transition: p }));
      }
    }
    check(claimed && stopped && after.events.sequence === sequence && after.events.time === time && after.events.count === before.events.count + authRows.length);
    pins(); budget();
    // Persist ONLY validated PUBLIC projections, never raw stdout/stderr/IPC.
    const publicCandidatePin = write(join(out, 'candidate-public.json'), candidate), publicProvisionalPin = write(join(out, 'provisional-public.json'), provisional);
    write(join(out, 'auth-events-public.json'), authRows.map(e => ({ sequence: e.sequence, time: e.time, key: e.key, kind: e.kind, payload: JSON.parse(e.payload), digest: e.digest })));
    write(join(out, 'after-auth.json'), after); budget();
    Object.assign(outcome, { status: 'AUTH_CONNECTED_ONLY_NO_WORK_AUTHORITY', hostPid: d.pid, invocationId: d.invocationId, programSha256: PRODUCT['src/client.ts'], scopeSha256: scopeSha,
      candidateDataSha256: candidate.resultSha256, observedPublicCandidateSha256: observedBytesSha256, provisionalReceipt: ref,
      publicCandidatePin, publicProvisionalPin,
      readyRequests: 2, challengeRequests: 1, uiWindowPid: uiClosed.windowPid, uiWindowExitObserved: true, rmsClosed: true,
      unchangedOtherTables: 35, exactAuthEvents: authRows.length, historicalPrefixPreserved: true, nativeDbMetadata: nativeIdentity,
      newRmsOrigins: 0, rmsAudit: 'EXACT_AUTH_SUFFIX_ONLY', credentialMayHavePersisted: true });
  } catch { outcome.status = 'HOLD'; outcome.code = 'AUTH_RECEIVE_REFUSED_OR_INCOMPLETE'; stop(); }
  finally {
    clearTimeout(total);
    if (child && !closed) { stop(); try { if (child.pid === outcome.rmsPid && child.spawnfile === BUN) child.kill(); } catch {}
      await bounded(closedPromise, 1000); }
    if (relay) { try { await bounded(relay.close(), 1000); } catch {} }
    if (child && !closed) { try { child.stdout?.destroy(); child.stderr?.destroy(); if (child.connected) child.disconnect(); child.unref(); } catch {} }
    try { Object.assign(outcome, auditFinishedRms()); } catch { outcome.rmsAudit = 'UNPROVEN'; outcome.newRmsOrigins = null; outcome.status = 'HOLD'; outcome.code = 'AUTH_RMS_AUDIT_INCOMPLETE'; }
    outcome.endedAt = Date.now(); outcome.durationMs = performance.now() - start; outcome.exitCode = exit; outcome.signal = signal;
    outcome.stdoutBytesDiscarded = stdoutBytes; outcome.stderrBytesDiscarded = stderrBytes;
    if (!closed || performance.now() >= deadline || Date.now() >= req.expiresAt || bad || killed) { outcome.status = 'HOLD'; outcome.code = 'AUTH_RECEIVE_CLOSURE_OR_DEADLINE'; }
  }
  write(join(out, 'FINALOUTCOME.json'), outcome);
  if (performance.now() >= deadline || Date.now() >= req.expiresAt) outcome.status = 'HOLD';
  console.log(JSON.stringify({ status: outcome.status, intentId: id, durationMs: outcome.durationMs, rmsPid: outcome.rmsPid, exitCode: exit, requiresNativeClockEnvelope: true }));
  if (outcome.status !== 'AUTH_CONNECTED_ONLY_NO_WORK_AUTHORITY') process.exitCode = 1;
}
if (import.meta.main) void main().catch(() => { console.log(JSON.stringify({ status: 'HOLD', code: 'AUTH_RECEIVE_REFUSED', automaticRetry: false })); process.exitCode = 1; });
