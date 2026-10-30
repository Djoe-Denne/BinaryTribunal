/** AUTH222 CANDIDATE. Parent deploys at the pinned namespace180 destination.
 * No job/session/model, credential export, discovery or restart adoption. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const key = p => path.resolve(p).toLowerCase();
const sha = b => createHash('sha256').update(b).digest('hex');
const need = ok => { if (!ok) throw new Error('AUTH_BOOTSTRAP_REFUSED'); };
function readPin(pin) {
  const a = fs.lstatSync(pin.path, { bigint: true });
  need(a.isFile() && !a.isSymbolicLink() && key(fs.realpathSync(pin.path)) === key(pin.path)
    && a.size === BigInt(pin.byteLength) && a.size <= 100n * 1024n * 1024n);
  const b = fs.readFileSync(pin.path), z = fs.lstatSync(pin.path, { bigint: true });
  need(z.isFile() && !z.isSymbolicLink() && key(fs.realpathSync(pin.path)) === key(pin.path)
    && a.dev === z.dev && a.ino === z.ino && a.size === z.size && a.mtimeNs === z.mtimeNs && a.ctimeNs === z.ctimeNs
    && b.length === pin.byteLength && sha(b) === pin.sha256);
  return b;
}
const abort = new AbortController();
let nonce, initialized = false, authorizedStop = false, ready = false, connectEngaged = false, knownAttempt;
let resolveInit, rejectInit;
const initialization = new Promise((resolve, reject) => { resolveInit = resolve; rejectInit = reject; });
const send = data => new Promise((resolve, reject) => {
  if (!process.connected || !process.send) return reject(new Error('AUTH_IPC_REFUSED'));
  process.send({ ...data, nonce }, error => error ? reject(new Error('AUTH_IPC_REFUSED')) : resolve());
});
process.on('message', message => {
  if (!initialized) {
    if (!message || message.type !== 'INIT' || !/^[a-f0-9]{64}$/.test(message.nonce ?? '') || !/^[a-f0-9]{64}$/.test(message.password ?? '')
      || !/^[a-f0-9]{64}$/.test(message.intentDigest ?? '')) { rejectInit(new Error('AUTH_INIT_REFUSED')); return; }
    initialized = true; nonce = message.nonce; resolveInit(message); return;
  }
  if (message?.type === 'STOP' && message.nonce === nonce) { authorizedStop = true; abort.abort(); return; }
  if (message?.type === 'AUTH_ATTEMPT' && message.nonce === nonce && ready && connectEngaged && !knownAttempt
    && /^con_[A-Za-z0-9_]{1,160}$/.test(message.attemptId ?? '')) {
    knownAttempt = message.attemptId;
    void send({ type: 'AUTH_ATTEMPT_RETAINED', attemptId: knownAttempt, at: Date.now() }).catch(() => abort.abort()); return;
  }
  abort.abort();
});
process.on('disconnect', () => { abort.abort(); if (!initialized) rejectInit(new Error('AUTH_PARENT_DISCONNECTED')); });
try {
  need(process.connected && typeof process.send === 'function');
  const [expectedPlanSha, runRootArg] = process.argv.slice(2);
  need(process.argv.length === 4 && /^[a-f0-9]{64}$/.test(expectedPlanSha ?? ''));
  const planBytes = fs.readFileSync(path.join(ROOT, 'host-plan-auth-v1.json')); need(sha(planBytes) === expectedPlanSha);
  const auth = JSON.parse(planBytes);
  need(auth.version === 'rms-owned-auth-host-plan-v1' && key(auth.namespace) === key(ROOT)
    && auth.purpose === 'connect-owned-openai-auth-v1' && auth.provider === 'openai' && auth.method === 'chatgpt-headless'
    && auth.totalMs === 240000 && auth.closeReserveMs === 15000 && auth.simulation === false);
  readPin(auth.bootstrap);
  const plan = JSON.parse(readPin(auth.basePlan));
  need(plan.namespace === auth.namespace && auth.basePlan.sha256 === '5d147c490a05f61323fb05436f835b058275c6933c3c6c9cd12494d83029ed67');
  need(process.platform === 'win32' && process.arch === 'x64' && process.versions.bun === '1.4.2'
    && key(process.execPath) === key(plan.runtime.bun.path)); readPin(plan.runtime.bun);
  need(import.meta.url.startsWith('file:') && !import.meta.url.includes('$bunfs') && (!Bun.embeddedFiles || Bun.embeddedFiles.length === 0) && process.execArgv.length === 0);
  const init = await initialization;
  need(init.planSha256 === expectedPlanSha && key(init.runRoot) === key(runRootArg));
  const runRoot = path.resolve(runRootArg);
  need(path.dirname(runRoot).toLowerCase() === key(ROOT) && /^auth-private-[a-f0-9-]+$/.test(path.basename(runRoot)));
  const own = JSON.parse(fs.readFileSync(path.join(runRoot, 'OWN.json')));
  need(own.runnerPid === process.ppid && own.planSha256 === expectedPlanSha && own.intentDigest === init.intentDigest
    && key(process.cwd()) === key(path.join(runRoot, 'work')));
  const runtimeNames = new Set(['HOMEDRIVE', 'HOMEPATH', 'LOGONSERVER', 'SYSTEMDRIVE', 'USERDOMAIN', 'USERNAME']);
  for (const name of Object.keys(process.env)) if (runtimeNames.has(name.toUpperCase())) delete process.env[name];
  need(!Object.keys(process.env).some(name => runtimeNames.has(name.toUpperCase())));
  const env = { HOME: 'home', USERPROFILE: 'home', APPDATA: 'appdata', LOCALAPPDATA: 'localappdata', XDG_DATA_HOME: 'data',
    XDG_CACHE_HOME: 'cache', XDG_CONFIG_HOME: 'xdg-config', XDG_STATE_HOME: 'state', TEMP: 'tmp', TMP: 'tmp', ProgramData: 'program-data' };
  for (const [name, relative] of Object.entries(env)) need(key(process.env[name] ?? '') === key(path.join(runRoot, relative)));
  need(key(os.homedir()) === key(path.join(runRoot, 'home')));
  const allowed = [...Object.keys(env), 'SystemRoot', 'WINDIR', 'ComSpec', 'PATH', 'OS'];
  need(Object.keys(process.env).every(name => allowed.some(a => a.toLowerCase() === name.toLowerCase())));
  for (const name of ['BUN_PTY_LIB', 'OPENCODE_PTY_BIN', 'OTUI_ASSET_ROOT', 'BUN_OPTIONS', 'NODE_OPTIONS', 'NODE_PATH']) need(process.env[name] === undefined);
  for (const pin of plan.inputs) readPin(pin);
  for (const dir of ['config', 'home', 'program-data', 'work']) need(fs.readdirSync(path.join(runRoot, dir)).length === 0);
  const database = path.join(runRoot, 'native.sqlite'); need(!fs.existsSync(database));
  need(key(fileURLToPath(import.meta.resolve('@opencode/server/process'))) === key(path.join(ROOT, 'node_modules/@opencode/server/dist/process.js')));
  need(!abort.signal.aborted); await send({ type: 'PHASE', name: 'APPLICATION_IMPORT_BEGIN', at: Date.now() });
  const [{ Effect, Schema, Exit, Cause }, { NodeServices }, { Global }, { start }, { ServerOptions }, { Info }] = await Promise.all([
    import('effect'), import('@effect/platform-node'), import('@opencode/util/global'), import('@opencode/server/process'), import('@opencode/server/options'), import('@opencode/schema/config')
  ]);
  const { HttpServerRequest, HttpServerResponse } = await import('effect/http');
  need(!abort.signal.aborted && key(Global.Path.home) === key(path.join(runRoot, 'home'))
    && key(Global.Path.data) === key(path.join(runRoot, 'data/opencode')) && key(Global.Path.tmp) === key(path.join(runRoot, 'tmp/opencode')));
  const content = JSON.stringify(plan.configContent); Schema.decodeUnknownSync(Info)(JSON.parse(content));
  const publicOptions = { app: { name: 'rms-owned-auth-only', version: '2.2.1', channel: 'owned-auth-only' },
    hostname: '127.0.0.1', port: 0, events: { persist: true }, database: { path: database },
    config: { directory: path.join(runRoot, 'config'), project: false, claude: false, content },
    models: { fetch: false }, fs: { filewatcher: false, fff: false }, simulation: false, cors: [] };
  Schema.decodeUnknownSync(ServerOptions)({ ...publicOptions, password: 'PRIVATE_PLACEHOLDER' });
  const options = { ...publicOptions, password: init.password };
  const connect = '/api/integration/openai/connect/oauth', body = '{"methodID":"chatgpt-headless"}';
  const transform = app => Effect.gen(function* () {
    const req = yield* HttpServerRequest.HttpServerRequest;
    const h = req.headers, connection = String(h.connection ?? '').toLowerCase().split(',').map(s => s.trim());
    const safe = req.url === req.originalUrl && h.upgrade === undefined && !connection.includes('upgrade') && h['transfer-encoding'] === undefined;
    const read = req.method === 'GET' && (h['content-length'] === undefined || h['content-length'] === '0')
      && (['/api/info', '/openapi.json', '/api/integration', '/api/integration/openai'].includes(req.originalUrl)
        || knownAttempt && req.originalUrl === `${connect}/${knownAttempt}`);
    const write = req.method === 'POST' && req.originalUrl === connect && !connectEngaged && h['content-length'] === String(Buffer.byteLength(body));
    if (!safe || (!read && !write)) return HttpServerResponse.empty({ status: 403 });
    if (write) { const text = yield* req.text; if (text !== body) return HttpServerResponse.empty({ status: 403 }); connectEngaged = true; }
    return yield* app;
  });
  await send({ type: 'PHASE', name: 'SCOPED_START_BEGIN', at: Date.now() });
  const program = Effect.scoped(Effect.gen(function* () {
    const handle = yield* start(options, undefined, transform); // public scope, lifecycle intentionally omitted
    need(handle.address._tag === 'InetAddressV4' && handle.address.address.toString() === '127.0.0.1' && Number.isInteger(handle.address.port) && handle.address.port > 0);
    ready = true;
    yield* Effect.promise(() => send({ type: 'READY', at: Date.now(), pid: process.pid, parentPid: process.ppid,
      execPath: process.execPath, runtime: process.versions.bun, platform: process.platform, arch: process.arch,
      port: handle.address.port, tmp: Global.Path.tmp, nativeLoadEvidence: 'UNPROVEN', policy: 'rms-owned-openai-auth-policy-v1' }));
    yield* Effect.never;
  })).pipe(Effect.provide(NodeServices.layer));
  const exit = await Effect.runPromiseExit(program, { signal: abort.signal });
  need(authorizedStop && ready && Exit.isFailure(exit) && Cause.hasInterruptsOnly(exit.cause));
  await send({ type: 'SCOPE_CLOSED', at: Date.now(), pid: process.pid }); process.exitCode = 0;
} catch {
  // No imported exception, OAuth response, header or token is ever logged/sent.
  if (initialized && process.connected) await send({ type: 'HOLD', at: Date.now(), reason: 'AUTH_BOOTSTRAP_REFUSED' }).catch(() => {});
  process.exitCode = 1;
} finally { if (process.connected) process.disconnect(); }
