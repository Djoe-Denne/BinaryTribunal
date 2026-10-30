// Auth225 parent tooling candidate. Importing this module starts nothing.
// Parent must pin both files, qualify their Windows identity/rights, own the
// real RMS ChildProcess, and discard private IPC rather than recording it.
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { win32 } from 'node:path';

const READY = 'RMS_AUTH_PRIVATE_UI_READY';
const CHALLENGE = 'RMS_AUTH_PRIVATE_UI_CHALLENGE';
const PAGE = 'https://auth.openai.com/codex/device';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const keys = (o, names) => o !== null && typeof o === 'object' && !Array.isArray(o)
  && Object.keys(o).length === names.length && names.every(k => Object.hasOwn(o, k));
const pathOK = p => typeof p === 'string' && /^[A-Za-z]:\\/.test(p)
  && win32.normalize(p) === p && !/[\r\n\0]/.test(p);

/**
 * start() before RMS spawn; bindOwnedChild(realChild,intentId) immediately
 * after spawn, synchronously, before yielding. Never route these messages to
 * logs. Return values contain no challenge or UI nonce. ACKs are IPC only.
 * closed is a bounded local outcome, NOT an OAuth/native termination proof;
 * windowExitObserved explicitly distinguishes kill/request from observed exit.
 */
export function createPrivateUiRelay({ windowScriptPath, powershellPath, deadlineMonotonicMs } = {}) {
  const created = performance.now();
  // Preserve the caller's original monotonic deadline; never extend it.
  const valid = process.platform === 'win32' && pathOK(windowScriptPath)
    && win32.basename(windowScriptPath) === 'private-ui-window-v1.ps1'
    && pathOK(powershellPath) && win32.basename(powershellPath).toLowerCase() === 'powershell.exe'
    && Number.isFinite(deadlineMonotonicMs) && deadlineMonotonicMs > created
    && deadlineMonotonicMs - created <= 240000;
  const deadline = valid ? deadlineMonotonicMs : created;
  let phase = 'NEW', reason = null, ui = null, child = null, rmsPid = null;
  let intent = null, hwnd = null, uiPid = null, started = false, bound = false;
  let pending = null, busy = false, step = 0, output = '', observed = false;
  let workTimer, totalTimer, closeTimer, resolveClosed;
  const seen = new Set(); // Nonces only; never retain a challenge here.
  const closed = new Promise(resolve => { resolveClosed = resolve; });
  let closedResolved = false;
  const left = () => deadline - performance.now();
  const snapshot = () => Object.freeze({ phase, reason, rmsPid, windowPid: uiPid,
    windowHandle: hwnd, windowExitObserved: observed, authSuccess: false });
  const finishClosed = () => {
    if (closedResolved) return;
    closedResolved = true;
    clearTimeout(workTimer); clearTimeout(totalTimer); clearTimeout(closeTimer);
    resolveClosed(snapshot());
  };
  const settlePending = ok => {
    const p = pending; pending = null;
    if (p) { clearTimeout(p.timer); p.resolve(ok); }
  };
  const stop = (code, intentional = false) => {
    if (phase === 'REFUSED' || phase === 'CLOSED') return;
    reason = code; phase = intentional ? 'CLOSED' : 'REFUSED';
    settlePending(false); output = ''; seen.clear();
    if (child) {
      child.removeListener('message', onRmsMessage);
      child.removeListener('exit', onRmsGone);
      child.removeListener('disconnect', onRmsGone);
      child.removeListener('error', onRmsGone);
    }
    // Kill ONLY the PowerShell process whose native handle we created.
    // Never terminate RMS, infer release, reconnect, or retry CONNECT here.
    if (ui && !observed) {
      try { ui.stdin.destroy(); } catch { /* no raw exception */ }
      try { ui.kill(); } catch { /* exit is still unproven */ }
      closeTimer = setTimeout(finishClosed, Math.max(0, Math.min(5000, left())));
    } else finishClosed();
  };
  const liveWindow = () => ui && !observed && ui.exitCode === null && ui.signalCode === null;
  const liveRms = () => child && child.pid === rmsPid && child.connected === true
    && child.exitCode === null && child.signalCode === null;
  const active = () => phase !== 'REFUSED' && phase !== 'CLOSED' && left() > 15000;
  const exchange = (op, seq, fields = {}) => {
    if (!active() || !liveWindow() || pending) { stop('UI_NOT_AVAILABLE'); return Promise.resolve(false); }
    return new Promise(resolve => {
      const expires = performance.now() + Math.min(5000, left() - 15000);
      const timer = setTimeout(() => stop('UI_ACK_DEADLINE'), Math.max(1, expires - performance.now()));
      pending = { op, seq, expires, resolve, timer };
      try {
        // Only this pipe carries the ephemeral code. No stdout, argv, file,
        // inherited environment, exception interpolation, or diagnostic hook.
        ui.stdin.write(JSON.stringify({ v: 1, op, seq, ...fields }) + '\n', error => {
          if (error) stop('UI_PIPE_WRITE_REFUSED');
        });
      } catch { stop('UI_PIPE_WRITE_REFUSED'); }
    });
  };
  const onUiLine = line => {
    try {
      const m = JSON.parse(line);
      if (!keys(m, ['v', 'event', 'seq', 'pid', 'hwnd']) || m.v !== 1 || m.pid !== uiPid
        || typeof m.hwnd !== 'string' || !/^[1-9][0-9]{0,19}$/.test(m.hwnd)) return stop('UI_FRAME_REFUSED');
      if (hwnd !== null && m.hwnd !== hwnd) return stop('UI_IDENTITY_CHANGED');
      if (m.event === 'CLOSED') return stop('UI_WINDOW_CLOSED');
      const p = pending;
      if (!p || !active() || !liveWindow() || performance.now() >= p.expires
        || m.seq !== p.seq || m.event !== (p.op === 'init' ? 'READY' : 'ACK')) return stop('UI_ACK_REFUSED');
      hwnd = m.hwnd; settlePending(true);
    } catch { stop('UI_FRAME_REFUSED'); }
  };
  const start = async () => {
    if (started || phase !== 'NEW' || !valid || left() <= 15000) {
      stop('UI_START_REFUSED'); return snapshot();
    }
    started = true; phase = 'STARTING';
    workTimer = setTimeout(() => stop('UI_WORK_DEADLINE'), Math.max(1, left() - 15000));
    totalTimer = setTimeout(() => { stop('UI_TOTAL_DEADLINE'); finishClosed(); }, Math.max(1, left()));
    try {
      ui = spawn(powershellPath, ['-NoLogo', '-NoProfile', '-NonInteractive', '-STA', '-File', windowScriptPath], {
        windowsHide: true, shell: false, cwd: win32.dirname(windowScriptPath),
        env: { SystemRoot: 'C:\\Windows', WINDIR: 'C:\\Windows', OS: 'Windows_NT' },
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      uiPid = Number.isSafeInteger(ui.pid) ? ui.pid : null;
      ui.on('error', () => stop('UI_PROCESS_REFUSED'));
      ui.stdin.on('error', () => stop('UI_PIPE_REFUSED'));
      ui.stdout.on('error', () => stop('UI_PIPE_REFUSED'));
      ui.once('exit', () => { observed = true; stop('UI_PROCESS_EXIT'); finishClosed(); });
      ui.stdout.once('end', () => { if (phase !== 'CLOSED' && phase !== 'REFUSED') stop('UI_PIPE_ENDED'); });
      ui.stdout.on('data', chunk => {
        if (phase === 'CLOSED' || phase === 'REFUSED') return;
        // Window stdout is a NONSECRET control pipe, never exposed/captured.
        if (!Buffer.isBuffer(chunk) || chunk.length > 4096 || chunk.some(b => b > 127 || b === 0)) return stop('UI_FRAME_BOUND');
        output += chunk.toString('ascii');
        if (output.length > 4096) return stop('UI_FRAME_BOUND');
        let i;
        while ((i = output.indexOf('\n')) !== -1) {
          const line = output.slice(0, i).replace(/\r$/, ''); output = output.slice(i + 1);
          onUiLine(line);
          if (phase === 'CLOSED' || phase === 'REFUSED') break;
        }
      });
      if (!uiPid || !await exchange('init', 0, { remainingMs: Math.floor(left() - 15000) })) {
        stop('UI_START_REFUSED'); return snapshot();
      }
      if (active()) phase = 'READY'; else stop('UI_START_REFUSED');
    } catch { stop('UI_START_REFUSED'); }
    return snapshot();
  };
  const onRmsGone = () => stop('RMS_CHANNEL_CLOSED');
  const onRmsMessage = message => {
    // The listener is installed on exactly the retained ChildProcess handle.
    // No public entry point accepts fabricated sender IDs or arbitrary ACKs.
    void receive(message).catch(() => stop('RMS_MESSAGE_REFUSED'));
  };
  const receive = async m => {
    if (!active()) return stop('UI_NOT_AVAILABLE');
    try {
      const isReady = m?.type === READY, isChallenge = m?.type === CHALLENGE;
      // A shared native receiver may use other non-UI IPC messages.
      if (!isReady && !isChallenge) return;
      if (!liveRms() || busy || step >= 3 || (step < 2) !== isReady
        || !keys(m, isReady ? ['type', 'intentId', 'uiNonce'] : ['type', 'intentId', 'uiNonce', 'challenge'])
        || m.intentId !== intent || typeof m.uiNonce !== 'string' || !/^[a-f0-9]{64}$/.test(m.uiNonce)
        || seen.has(m.uiNonce)) return stop('RMS_UI_PROTOCOL_REFUSED');
      busy = true; seen.add(m.uiNonce);
      const nonce = m.uiNonce, type = m.type;
      let fields = {};
      if (isChallenge) {
        const c = m.challenge, now = Date.now();
        if (!keys(c, ['attemptId', 'url', 'code', 'created', 'expires'])
          || typeof c.attemptId !== 'string' || !/^con_[A-Za-z0-9_]{1,160}$/.test(c.attemptId)
          || c.url !== PAGE || typeof c.code !== 'string' || !/^[A-Z0-9]{3,8}(?:-[A-Z0-9]{3,8}){0,2}$/.test(c.code)
          || !Number.isSafeInteger(c.created) || !Number.isSafeInteger(c.expires)
          || c.created > now || c.expires <= now) return stop('RMS_CHALLENGE_REFUSED');
        fields = { code: c.code, expires: c.expires };
      }
      const ackLimit = performance.now() + Math.min(5000, left() - 15000);
      if (!await exchange(isReady ? 'probe' : 'challenge', step + 1, fields)
        || !active() || !liveRms() || !liveWindow() || performance.now() >= ackLimit
        || isChallenge && Date.now() >= fields.expires) return stop('RMS_UI_ACK_REFUSED');
      fields = {}; // Do not retain challenge content in relay state/results.
      const sent = await new Promise(resolve => {
        const timer = setTimeout(() => resolve(false), Math.max(1, ackLimit - performance.now()));
        try {
          child.send({ type: `${type}_ACK`, intentId: intent, uiNonce: nonce }, error => {
            clearTimeout(timer); resolve(!error);
          });
        } catch { clearTimeout(timer); resolve(false); }
      });
      if (!sent || !active() || !liveRms() || performance.now() >= ackLimit) return stop('RMS_ACK_SEND_REFUSED');
      step++; phase = step === 3 ? 'DISPLAYED' : 'BOUND'; busy = false;
    } catch { stop('RMS_MESSAGE_REFUSED'); }
  };
  const bindOwnedChild = (ownedChild, intentId) => {
    if (bound || phase !== 'READY' || !active() || !liveWindow() || !UUID.test(intentId)
      || !ownedChild || !Number.isSafeInteger(ownedChild.pid) || ownedChild.pid <= 0 || ownedChild.pid === process.pid
      || typeof ownedChild.send !== 'function' || typeof ownedChild.on !== 'function'
      || typeof ownedChild.removeListener !== 'function' || ownedChild.connected !== true
      || ownedChild.exitCode !== null || ownedChild.signalCode !== null) {
      stop('RMS_BIND_REFUSED'); return snapshot();
    }
    bound = true; child = ownedChild; rmsPid = child.pid; intent = intentId; phase = 'BOUND';
    child.on('message', onRmsMessage); child.on('exit', onRmsGone);
    child.on('disconnect', onRmsGone); child.on('error', onRmsGone);
    return snapshot();
  };
  return Object.freeze({ start, bindOwnedChild,
    close: () => { stop('PARENT_CLOSED', true); return closed; },
    closed, identity: snapshot });
}
