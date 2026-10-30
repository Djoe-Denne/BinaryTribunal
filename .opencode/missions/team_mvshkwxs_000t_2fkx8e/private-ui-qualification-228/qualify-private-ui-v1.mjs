// Parent-only, scoped UI dependency test. NOT an RMS/OpenAI/native-work proof.
// No network, database, credential, browser click or real OAuth code.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const file = fileURLToPath(import.meta.url), here = dirname(file);
const scenario = process.argv[3];
const need = (ok, code) => { if (!ok) throw new Error(code); };
const sha = b => createHash('sha256').update(b).digest('hex');
const INTENT = '00000000-0000-0000-0000-000000000001';

async function fixtureChild() {
  need(process.argv.length === 4 && ['positive', 'duplicate'].includes(scenario) && process.connected, 'FIXTURE_ARGUMENTS');
  let acknowledged = 0, pending = null;
  const send = async (type, nonce, challenge) => {
    need(pending === null, 'FIXTURE_PENDING');
    return await new Promise((resolveAck, rejectAck) => {
      const timer = setTimeout(() => { pending = null; resolveAck(false); }, 6000);
      pending = { type: `${type}_ACK`, nonce, timer, resolveAck, rejectAck };
      process.send({ type, intentId: INTENT, uiNonce: nonce, ...(challenge ? { challenge } : {}) }, error => {
        if (error) { clearTimeout(timer); pending = null; rejectAck(new Error('FIXTURE_SEND')); }
      });
    });
  };
  const onMessage = m => {
    const p = pending;
    if (!p || !m || Object.keys(m).sort().join(',') !== 'intentId,type,uiNonce'
      || m.type !== p.type || m.intentId !== INTENT || m.uiNonce !== p.nonce) {
      if (p) { clearTimeout(p.timer); pending = null; p.rejectAck(new Error('FIXTURE_ACK_SHAPE')); }
      return;
    }
    clearTimeout(p.timer); pending = null; acknowledged++; p.resolveAck(true);
  };
  process.on('message', onMessage);
  try {
    need(await send('RMS_AUTH_PRIVATE_UI_READY', '1'.repeat(64)), 'FIXTURE_READY1');
    if (scenario === 'duplicate') {
      need(!await send('RMS_AUTH_PRIVATE_UI_READY', '1'.repeat(64)), 'FIXTURE_DUPLICATE_ACK');
    } else {
      need(await send('RMS_AUTH_PRIVATE_UI_READY', '2'.repeat(64)), 'FIXTURE_READY2');
      const now = Date.now();
      need(await send('RMS_AUTH_PRIVATE_UI_CHALLENGE', '3'.repeat(64), {
        attemptId: 'con_OFFLINE_UI_QUALIFICATION', url: 'https://auth.openai.com/codex/device',
        code: 'DUMMY-ONLY', created: now, expires: now + 30000,
      }), 'FIXTURE_CHALLENGE');
    }
    console.log(JSON.stringify({ fixtureOnly: true, scenario, acknowledged, outcome: 'EXPECTED_PROTOCOL_OBSERVED', oauthRequested: false }));
  } finally {
    process.off('message', onMessage);
    if (pending) clearTimeout(pending.timer);
    pending = null;
    if (process.connected) process.disconnect();
  }
}

async function parent() {
  need(process.argv.length === 4 && process.argv[2] === '--parent' && ['positive', 'duplicate'].includes(scenario), 'PARENT_ARGUMENTS');
  need(process.platform === 'win32' && process.arch === 'x64' && process.versions.bun === '1.4.2' && process.execArgv.length === 0, 'PARENT_RUNTIME');
  const receiptPath = join(here, `${scenario}-FINALOUTCOME.json`);
  need(!existsSync(receiptPath), 'PARENT_NO_RETRY');
  const relayPath = resolve(here, '../auth-parent-225/private-ui-relay-v1.mjs');
  const windowPath = resolve(here, '../auth-parent-225/private-ui-window-v1.ps1');
  const pins = {
    [relayPath]: '8518b843eab468c34c1b0060f61c06e98cbe499c08079992d718e529c0674053',
    [windowPath]: '230f1855d3ffc753def468f5321c4325e864002f668c93decf86d199e22d212f',
    [process.execPath]: '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4',
  };
  const verify = () => { for (const [p, h] of Object.entries(pins)) need(sha(readFileSync(p)) === h, 'PARENT_PIN'); };
  verify();
  const started = performance.now(), deadline = started + 45000;
  const { createPrivateUiRelay } = await import(pathToFileURL(relayPath).href);
  const relay = createPrivateUiRelay({ windowScriptPath: windowPath,
    powershellPath: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', deadlineMonotonicMs: deadline });
  let child, childClosed = false, exit = null, childError = false, output = '', errorBytes = 0, forced = false;
  let closeTimer, finish;
  const outcome = { version: 'private-ui-228-fixture-FINALOUTCOME-v1', status: 'HOLD', fixtureOnly: true, scenario,
    parentPid: process.pid, oauthRequested: false, rmsOriginCreated: false, realRmsQualified: false, sourcePins: pins };
  try {
    need((await relay.start()).phase === 'READY', 'PARENT_UI_READY');
    const closed = new Promise(resolveClose => { finish = resolveClose; });
    child = spawn(process.execPath, ['run', file, '--fixture-child', scenario], {
      cwd: here, env: { SystemRoot: 'C:\\Windows', WINDIR: 'C:\\Windows', OS: 'Windows_NT', PATH: 'C:\\Windows\\System32' },
      windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], serialization: 'json',
    });
    child.on('error', () => { childError = true; });
    child.on('close', (code, signal) => { childClosed = true; exit = { code, signal }; finish(); });
    child.stdout.on('data', b => { if (output.length + b.length <= 4096) output += b.toString('utf8'); else childError = true; });
    child.stderr.on('data', b => { errorBytes += b.length; });
    need(relay.bindOwnedChild(child, INTENT).phase === 'BOUND', 'PARENT_BIND');
    await Promise.race([closed, new Promise((_, reject) => { closeTimer = setTimeout(() => reject(new Error('PARENT_CHILD_BOUND')), 12000); })]);
    clearTimeout(closeTimer);
    need(childClosed && !childError && exit.code === 0 && exit.signal === null && errorBytes === 0, 'PARENT_CHILD_CLOSE');
    const transcript = JSON.parse(output.trim());
    need(transcript.fixtureOnly === true && transcript.scenario === scenario && transcript.outcome === 'EXPECTED_PROTOCOL_OBSERVED'
      && transcript.acknowledged === (scenario === 'positive' ? 3 : 1) && transcript.oauthRequested === false, 'PARENT_TRANSCRIPT');
    const ui = await relay.close();
    need(ui.windowExitObserved === true && ui.windowPid > 0, 'PARENT_UI_CLOSE');
    if (scenario === 'duplicate') need(ui.reason === 'RMS_UI_PROTOCOL_REFUSED', 'PARENT_DUPLICATE_REASON');
    verify(); need(performance.now() < deadline, 'PARENT_WHOLE_DEADLINE');
    Object.assign(outcome, { status: 'PASS_SCOPED_UI_FIXTURE_ONLY', childPid: child.pid,
      childClosed, exit, acknowledged: transcript.acknowledged, ui, sourcePinsRecheckedAfter: true });
  } catch {
    outcome.reason = 'SCOPED_UI_CHECK_REFUSED';
  } finally {
    clearTimeout(closeTimer);
    if (child && !childClosed) {
      forced = true; try { child.kill(); } catch { /* no imported message */ }
      await Promise.race([new Promise(resolveClose => { if (childClosed) resolveClose(); else child.once('close', resolveClose); }),
        new Promise(resolveTimeout => setTimeout(resolveTimeout, 2000))]);
      if (!childClosed) { try { child.disconnect(); } catch {} child.stdout?.destroy(); child.stderr?.destroy(); child.unref(); }
    }
    const ui = await relay.close();
    Object.assign(outcome, { durationMs: performance.now() - started, childClosed, exit, forced,
      windowExitObserved: ui.windowExitObserved, noRealChallengeUsed: true });
    if (forced || !childClosed || !ui.windowExitObserved || performance.now() >= deadline) outcome.status = 'HOLD';
    writeFileSync(receiptPath, JSON.stringify(outcome, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ status: outcome.status, scenario, durationMs: outcome.durationMs, fixtureOnly: true, receiptPath }));
    if (outcome.status !== 'PASS_SCOPED_UI_FIXTURE_ONLY') process.exitCode = 1;
  }
}

try {
  if (process.argv[2] === '--fixture-child') await fixtureChild();
  else await parent();
} catch { console.error('PRIVATE_UI_228_REFUSED'); process.exitCode = 1; }
