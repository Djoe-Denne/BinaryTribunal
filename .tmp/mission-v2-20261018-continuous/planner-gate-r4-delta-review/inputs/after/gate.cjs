'use strict';
// SOURCE PROPOSAL. Only the parent may invoke this after fresh independent V.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const ROOT = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const BASE = ROOT + '/.tmp/mission-v2-20261018-continuous';
const HARNESS = ROOT + '/tools/ff8-harness';
const DEPS = HARNESS + '/node_modules';
const FROZEN = BASE + '/s1-r5-planner-extraction-r1-frozen';
const STEM = 's1-r5-planner-isolated-r4-gate';
const APPROVAL = BASE + '/planner-isolated-gate-r4-parent-adjudication.json';
const RED = BASE + '/s1-r5-planner-isolated-gate-receipt.json';
const RED_SHA = '72fa246c5c1e39b41c6116254f160682b9e0300ec39d59848120589de532ed21';
const SOURCE_GO = BASE + '/PLANNER_GATE_R4_MINIMAL_SOURCE_GO.md';
const R3_GO = BASE + '/PLANNER_GATE_R3_HARNESS_CORRECTION_GO.md';
const R3_CORRIGE = BASE + '/planner-gate-r3-parent-corrige-adjudication.json';
const CACHE_CONTROL_PINS = [
  { path: BASE + '/runtime-cache-control-probe-receipt.json', bytes: 4824, sha256: '4027625435fbe69a485dee3ba73907e44e0c8199e5eb0ae104adde6d46816cde' },
  { path: BASE + '/node-cache-positive-corrected-probe-receipt.json', bytes: 1803, sha256: '606030e55317b12de21f0453a0ea96da09f8ac3e352f9b097320d49e533ab872' },
  { path: DEPS + '/typescript/lib/tsc.js', bytes: 267, sha256: '2cffde0b8c6760dfb0b5b0382bbb7e00ba6a8b2d981b9205b256a700a481d983' },
];
const PLAN = BASE + '/PLANNER_ISOLATED_GATE_R2_DEPENDENCY_FIX_PLAN.md';
const PRIOR = BASE + '/l8-relation-extraction-gate-receipt.json';
const COMPILER = BASE + '/main-baseline-typecheck-receipt.json';
const DELIVERY = BASE + '/s1-r5-planner-extraction-r1-parent-delivery-audit.json';
const ACCEPTANCE = BASE + '/s1-r5-planner-r1-parent-static-adjudication.json';
const OUT = path.dirname(__filename);
const METHODS = ['planMission', 'compareGranularities'];
const FOUR = ['src/planner-derived-codecs.ts', 'src/function-order.ts', 'src/planner.ts', 'src/scc.ts'];
const ARTIFACTS = ['gate.cjs', 'capture.ts', 'DESIGN.md', 'MANIFEST.json'];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const canonical = p => path.resolve(p).replaceAll('\\', '/');
const key = p => canonical(p).toLowerCase();
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function need(condition, message) { if (!condition) throw new Error(message); }
function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function errorText(e) { return e instanceof Error ? e.message : 'non-Error infrastructure failure'; }
function relative(p) {
  need(typeof p === 'string' && p.length > 0 && !p.includes('\\') && !p.includes(':') &&
    !p.startsWith('/') && p.split('/').every(x => x && x !== '.' && x !== '..'), 'unsafe relative path');
  return p;
}
function noLink(p) {
  const q = canonical(p);
  let cursor = q;
  while (true) {
    const s = fs.lstatSync(cursor);
    need(!s.isSymbolicLink(), 'symlink/junction: ' + cursor);
    const parent = path.dirname(cursor);
    if (key(parent) === key(cursor)) break;
    cursor = parent;
  }
  need(key(fs.realpathSync(q)) === key(q), 'redirected real path: ' + q);
}
function filePin(p) {
  noLink(p);
  need(fs.lstatSync(p).isFile(), 'not regular file: ' + p);
  const bytes = fs.readFileSync(p);
  return { path: canonical(p), bytes: bytes.length, sha256: sha(bytes) };
}
function validPin(p) {
  need(p && typeof p.path === 'string' && path.isAbsolute(p.path) &&
    Number.isSafeInteger(p.bytes) && p.bytes >= 0 && /^[0-9a-f]{64}$/.test(p.sha256), 'invalid approved pin');
}
function verifyPin(p) {
  const actual = filePin(p.path);
  need(actual.bytes === p.bytes && actual.sha256 === p.sha256, 'approved hash/size drift: ' + p.path);
}

// Inventory includes directories, all regular files of all extensions, and
// rejects links/special nodes. Only the separately inventoried dependency mount
// may be skipped in the main harness walk. There is no recursive glob omission.
function inventory(root, skipDependencyMount = false) {
  noLink(root);
  need(fs.lstatSync(root).isDirectory(), 'inventory root not directory');
  const entries = [];
  function walk(directory, prefix) {
    for (const name of fs.readdirSync(directory).sort()) {
      const rel = prefix ? prefix + '/' + name : name;
      const p = directory + '/' + name;
      const s = fs.lstatSync(p);
      need(!s.isSymbolicLink(), 'inventory link: ' + p);
      need(key(fs.realpathSync(p)) === key(p), 'inventory redirected path: ' + p);
      if (s.isDirectory()) {
        entries.push({ path: rel, type: 'directory' });
        if (!(skipDependencyMount && rel === 'node_modules')) walk(p, rel);
      } else {
        need(s.isFile(), 'inventory special node: ' + p);
        const b = fs.readFileSync(p);
        entries.push({ path: rel, type: 'file', bytes: b.length, sha256: sha(b) });
      }
    }
  }
  walk(canonical(root), '');
  return entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
function normalizedEntries(entries) {
  need(Array.isArray(entries), 'missing closed inventory');
  const seen = new Set();
  return entries.map(e => {
    relative(e.path);
    need(!seen.has(e.path.toLowerCase()), 'duplicate inventory entry');
    seen.add(e.path.toLowerCase());
    if (e.type === 'directory') {
      need(equal(Object.keys(e).sort(), ['path', 'type']), 'directory inventory fields');
      return { path: e.path, type: e.type };
    }
    need(e.type === 'file' && equal(Object.keys(e).sort(), ['bytes', 'path', 'sha256', 'type']), 'file inventory fields');
    validPin({ ...e, path: ROOT + '/' + e.path });
    return { path: e.path, type: 'file', bytes: e.bytes, sha256: e.sha256 };
  }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

let lease = null;
let leaseOwned = false;
let leaseBytes = null;
let scratch = null;
let approvalRecord = null;
let cacheControlReceipts = [];
let approvedPins = new Map();
let closed = [];
let sourcePins = [];
let expectedScratch = new Map();
let scratchPrepared = false;
let guardsUnchanged = null;
let runnerState = 'not-started';
let qualified = false;
let differential = null;
let listedFiles = null;
let preparationComplete = false;
const runs = [];
const failures = [];
const infrastructureFailures = [];
const checkpoints = [];
const scratchObservations = [];
const inputInventoryChecks = [];
const globalConfigChecks = [];
const paths = Object.fromEntries(['lease', 'receipt', 'release'].map(n => [n, BASE + '/' + STEM + '-' + n + '.json']));

function requiredPin(p, upstream) {
  const pin = approvedPins.get(key(p));
  need(pin, 'not approved by parent: ' + p);
  if (upstream) {
    need(upstream.sha256 === pin.sha256 && (upstream.bytes === undefined || upstream.bytes === pin.bytes), 'upstream pin disagrees: ' + p);
  }
  return pin;
}
function requireTreeFile(treeId, absolute, upstream) {
  const t = closed.find(t => t.id === treeId);
  need(t, 'missing inventory ' + treeId);
  const rel = path.relative(t.root, absolute).replaceAll('\\', '/');
  relative(rel);
  const entry = t.entries.find(e => e.path === rel && e.type === 'file');
  need(entry, 'file outside approved inventory: ' + absolute);
  if (upstream) need(entry.sha256 === upstream.sha256 && (upstream.bytes === undefined || entry.bytes === upstream.bytes), 'inventory upstream disagreement');
  return entry;
}
function verifyInputs(label) {
  for (const pin of approvedPins.values()) verifyPin(pin);
  need(filePin(APPROVAL).sha256 === approvalRecord.sha256, 'external adjudication changed');
  for (const tree of closed) {
    const actual = inventory(tree.root, tree.id === 'mainHarness');
    const match = equal(actual, tree.entries);
    inputInventoryChecks.push({ label, id: tree.id, entries: actual.length, actualSha256: sha(JSON.stringify(actual)), match, ...(match ? {} : { actual }) });
    need(match, 'closed inventory drift: ' + tree.id);
  }
  if (guardsUnchanged !== false) guardsUnchanged = sourcePins.length === 269 ? true : null;
  checkpoints.push({ label, at: new Date().toISOString(), inputInventoriesMatch: true });
}

function ownDirectory(p) {
  const absolute = canonical(p);
  if (key(absolute) === key(scratch)) return;
  need(key(absolute).startsWith(key(scratch) + '/'), 'owned directory escape');
  const rel = path.relative(scratch, absolute).replaceAll('\\', '/');
  if (expectedScratch.has(rel)) return;
  const parent = path.dirname(absolute);
  if (key(parent) !== key(scratch)) ownDirectory(parent);
  fs.mkdirSync(absolute);
  expectedScratch.set(rel, { path: rel, type: 'directory' });
}
function rememberFile(p) {
  need(key(p).startsWith(key(scratch) + '/'), 'owned file escape');
  const rel = path.relative(scratch, p).replaceAll('\\', '/');
  need(!expectedScratch.has(rel), 'owned file reused: ' + rel);
  const pin = filePin(p);
  expectedScratch.set(rel, { path: rel, type: 'file', bytes: pin.bytes, sha256: pin.sha256 });
}
function writeOwned(p, bytes) {
  ownDirectory(path.dirname(p));
  fs.writeFileSync(p, bytes, { flag: 'wx' });
  rememberFile(p);
}
function copyOwned(from, to) {
  ownDirectory(path.dirname(to));
  fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
  rememberFile(to);
}
function checkScratch(label) {
  const actual = inventory(scratch);
  const expected = [...expectedScratch.values()].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  scratchObservations.push({ label, entries: actual });
  need(equal(actual, expected), 'closed scratch inventory drift: ' + label);
  checkpoints.push({ label, at: new Date().toISOString(), scratchEntries: actual.length, scratchInventorySha256: sha(JSON.stringify(actual)) });
}

function configCandidates(home, configRoots) {
  const result = [];
  if (home) {
    result.push(home + '/.bunfig.toml', home + '/bunfig.toml');
    configRoots = [...configRoots, home + '/.config', home + '/.config/bun'];
  }
  for (const d of configRoots.filter(Boolean)) {
    for (const n of ['bunfig.toml', '.bunfig.toml', 'bun/bunfig.toml', 'bun/.bunfig.toml']) result.push(d + '/' + n);
  }
  return result;
}
function rejectGlobalConfigs(label) {
  const homes = new Set(['C:/Users/djden', process.env.HOME, process.env.USERPROFILE].filter(Boolean));
  if (process.env.HOMEDRIVE && process.env.HOMEPATH) homes.add(process.env.HOMEDRIVE + process.env.HOMEPATH);
  const oldConfigs = [process.env.XDG_CONFIG_HOME, process.env.APPDATA, process.env.LOCALAPPDATA].filter(Boolean);
  let candidates = configCandidates(null, oldConfigs);
  for (const h of homes) candidates.push(...configCandidates(h, []));
  if (scratch) for (const side of ['baseline', 'candidate']) {
    const d = scratch + '/' + side;
    candidates.push(...configCandidates(d + '/home', [d + '/config', d + '/appdata', d + '/localappdata']));
    // Only d/bunfig.toml is the explicit approved local config. No implicit
    // bunfig is allowed in the actual cwd or the owned HOME namespaces.
    candidates.push(d + '/tools/ff8-harness/bunfig.toml', d + '/tools/ff8-harness/.bunfig.toml');
  }
  candidates = [...new Map(candidates.map(p => [key(p), canonical(p)])).values()].sort();
  for (const p of candidates) {
    try { fs.lstatSync(p); throw new Error('potential global/implicit bunfig exists: ' + p); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  globalConfigChecks.push({ label, absentPaths: candidates });
}
function childEnvironment(side, isTest, systemEnvironment) {
  const d = scratch + '/' + side;
  const home = d + '/home';
  const drive = path.parse(home).root.replace(/[\\/]$/, '');
  // No spread of process.env, PATH, NODE_OPTIONS, NODE_PATH or preload options.
  return {
    ...systemEnvironment,
    HOME: home, USERPROFILE: home, HOMEDRIVE: drive, HOMEPATH: home.slice(drive.length),
    XDG_CONFIG_HOME: d + '/config', XDG_CACHE_HOME: d + '/cache', XDG_DATA_HOME: d + '/data',
    APPDATA: d + '/appdata', LOCALAPPDATA: d + '/localappdata', TEMP: d + '/temp', TMP: d + '/temp',
    BUN_RUNTIME_TRANSPILER_CACHE_PATH: '0', NODE_DISABLE_COMPILE_CACHE: '1',
    NO_COLOR: '1', FORCE_COLOR: '0',
    ...(isTest ? { FF8_PARENT_DIFF_TRACE: d + '/planner-full-trace.jsonl', FF8_PARENT_DIFF_META: d + '/planner-full-meta.json' } : {}),
  };
}
function collectTraceOutputs(side) {
  for (const n of ['planner-full-trace.jsonl', 'planner-full-meta.json']) {
    const p = scratch + '/' + side + '/' + n;
    // Missing output remains missing; parser later produces a structured red.
    if (fs.existsSync(p)) rememberFile(p);
  }
}
function oneCounter(text, pattern, name, allowAbsent = false) {
  const matches = [...text.matchAll(pattern)];
  need(matches.length === 1 || (allowAbsent && matches.length === 0), 'ambiguous/missing test counter: ' + name);
  return matches.length ? Number(matches[0][1]) : 0;
}
function run(name, exe, argv, side, isTest, systemEnvironment) {
  verifyInputs('before-' + name);
  checkScratch('before-' + name);
  rejectGlobalConfigs('before-' + name);
  const env = childEnvironment(side, isTest, systemEnvironment);
  const started = Date.now();
  runnerState = 'inside-spawnSync';
  let result;
  try {
    result = cp.spawnSync(exe, argv, {
      cwd: scratch + '/' + side + '/tools/ff8-harness', env,
      timeout: isTest ? 90000 : 120000, maxBuffer: 2097152, windowsHide: true,
      shell: false, stdio: ['ignore', 'pipe', 'pipe'],
    });
    // spawnSync does not return until the child has exited, including timeout.
    runnerState = 'synchronous-return-child-ended';
  } catch (e) {
    runnerState = 'unknown-spawnSync-threw';
    throw e;
  }
  const stdout = result.stdout || Buffer.alloc(0);
  const stderr = result.stderr || Buffer.alloc(0);
  const rec = {
    name, exe, argv, side, environment: env, exitCode: result.status,
    error: result.error ? errorText(result.error) : null, signal: result.signal,
    ownedRunnerPid: result.pid || null, elapsedMs: Date.now() - started,
    stdoutBytes: stdout.length, stderrBytes: stderr.length,
    stdoutSha256: sha(stdout), stderrSha256: sha(stderr), ok: false,
  };
  runs.push(rec);
  writeOwned(scratch + '/' + name + '.stdout.bin', stdout);
  writeOwned(scratch + '/' + name + '.stderr.bin', stderr);
  if (isTest) collectTraceOutputs(side);
  verifyInputs('after-' + name);
  checkScratch('after-' + name);
  rejectGlobalConfigs('after-' + name);
  need(result.status === 0 && !result.error && !result.signal, 'child failed: ' + name);
  if (isTest) {
    const text = stdout.toString('utf8') + '\n' + stderr.toString('utf8');
    rec.pass = oneCounter(text, /(?:^|\n)\s*(\d+) pass\b/g, 'pass');
    rec.fail = oneCounter(text, /(?:^|\n)\s*(\d+) fail\b/g, 'fail');
    rec.assertions = oneCounter(text, /(?:^|\n)\s*(\d+) expect\(\) calls\b/g, 'assertions');
    rec.files = oneCounter(text, /across\s+(\d+)\s+files?\b/g, 'files');
    rec.skips = oneCounter(text, /(?:^|\n)\s*(\d+) skip\b/g, 'skips', true);
    need(rec.pass > 0 && rec.fail === 0 && rec.assertions > 0 && rec.files === 2 && rec.skips === 0, 'test counters red');
  }
  rec.ok = true;
  return { stdout, stderr, rec };
}

function listFilesProof(stdout, stderr) {
  need(stderr.length === 0, 'unexpected typecheck stderr');
  const allowed = new Map();
  const candidate = scratch + '/candidate/';
  for (const entry of expectedScratch.values()) if (entry.type === 'file' && key(scratch + '/' + entry.path).startsWith(key(candidate) + '/')) {
    allowed.set(key(scratch + '/' + entry.path), { path: canonical(scratch + '/' + entry.path), bytes: entry.bytes, sha256: entry.sha256, corpus: 'candidate-snapshot' });
  }
  const deps = closed.find(t => t.id === 'dependencies');
  for (const e of deps.entries) if (e.type === 'file') allowed.set(key(DEPS + '/' + e.path), { path: DEPS + '/' + e.path, bytes: e.bytes, sha256: e.sha256, corpus: 'approved-dependencies' });
  const text = stdout.toString('utf8');
  need(Buffer.from(text, 'utf8').equals(stdout), 'non-UTF8 listFiles');
  const lines = text.split(/\r?\n/).filter(Boolean);
  need(lines.length > 0, 'empty actual tsc --listFiles');
  const seen = new Set();
  const files = lines.map(line => {
    need(path.isAbsolute(line) && !seen.has(key(line)), 'invalid/duplicate listFiles line: ' + line);
    seen.add(key(line));
    need(allowed.has(key(line)), 'actual compilation escaped pinned corpus: ' + line);
    return allowed.get(key(line));
  });
  // Preserve full src/test/scripts include, not merely the two executed tests.
  for (const entry of expectedScratch.values()) {
    if (entry.type === 'file' && /^candidate\/tools\/ff8-harness\/(src|test|scripts)\/.*\.ts$/.test(entry.path)) {
      need(seen.has(key(scratch + '/' + entry.path)), 'included TS file absent from actual listFiles: ' + entry.path);
    }
  }
  for (const n of ['capture.ts', 'planner.ts']) need(seen.has(key(candidate + 'tools/ff8-harness/trace/' + n)), 'trace adapter not actually compiled');
  return { flag: '--listFiles', files, outsideApprovedCorpus: 0 };
}
function parseTrace(side) {
  const d = scratch + '/' + side;
  const bytes = fs.readFileSync(d + '/planner-full-trace.jsonl');
  const text = bytes.toString('utf8');
  need(Buffer.from(text, 'utf8').equals(bytes) && text.endsWith('\n') && !text.includes('\n\n'), 'incomplete trace framing');
  const metaBytes = fs.readFileSync(d + '/planner-full-meta.json');
  const metaText = metaBytes.toString('utf8');
  need(Buffer.from(metaText, 'utf8').equals(metaBytes) && metaText.endsWith('\n'), 'invalid footer encoding');
  const meta = JSON.parse(metaText); // Duplicate concatenated footers cannot parse.
  need(equal(Object.keys(meta).sort(), ['completed', 'fatal', 'finalized', 'issued', 'schema']), 'footer fields');
  need(meta.schema === 'planner-full-trace-r4' && meta.finalized === true && Array.isArray(meta.fatal) && meta.fatal.length === 0 &&
    Number.isSafeInteger(meta.issued) && meta.issued >= 10 && meta.issued === meta.completed, 'fatal/incomplete independent footer');
  const states = new Map();
  const counts = { BEGIN: 0, RETURN: 0, THROW: 0 };
  const methodCounts = Object.fromEntries(METHODS.map(n => [n, 0]));
  for (const line of text.slice(0, -1).split('\n')) {
    const row = JSON.parse(line);
    need(equal(Object.keys(row).sort(), ['id', 'kind', 'name', 'value']), 'trace row fields');
    need(Number.isSafeInteger(row.id) && row.id > 0 && row.id <= meta.issued && METHODS.includes(row.name) && Object.hasOwn(counts, row.kind), 'invalid terminal/BEGIN id or method');
    need(row.value && Array.isArray(row.value.roots) && Array.isArray(row.value.nodes), 'missing full graph');
    if (row.kind === 'BEGIN') {
      need(!states.has(row.id) && row.id === counts.BEGIN + 1 && row.value.roots.length === 1, 'duplicate/out-of-order BEGIN');
      states.set(row.id, { name: row.name, terminal: null });
      ++methodCounts[row.name];
    } else {
      const state = states.get(row.id);
      need(state && state.name === row.name && state.terminal === null && row.value.roots.length === 2, 'orphan/duplicate/mismatched terminal');
      state.terminal = row.kind;
    }
    ++counts[row.kind];
  }
  need(states.size === meta.issued && counts.BEGIN === meta.issued && counts.RETURN + counts.THROW === meta.completed &&
    [...states.values()].every(s => s.terminal !== null) && counts.THROW > 0 && METHODS.every(n => methodCounts[n] > 0), 'BEGIN-terminal totality/refusal/method coverage');
  return { bytes, metaBytes, summary: { trace: filePin(d + '/planner-full-trace.jsonl'), footer: filePin(d + '/planner-full-meta.json'), counts, methodCounts, issued: meta.issued, completed: meta.completed, fatal: meta.fatal, totality: true } };
}

function prepare(prior, delivery, pkg) {
  scratch = 'C:/Users/djden/AppData/Local/Temp/opencode/S1-R5-PLANNER-ISOLATED-R4-' + crypto.randomUUID();
  fs.mkdirSync(scratch); // Reservation has already happened; no recursive reuse.
  scratchPrepared = true;
  const prefix = 'tools/ff8-harness/';
  const replacements = new Map(delivery.files.filter(f => FOUR.includes(f.path)).map(f => [prefix + f.path, f]));
  for (const side of ['baseline', 'candidate']) {
    const d = scratch + '/' + side;
    for (const rel of ['home', 'config', 'cache', 'data', 'appdata', 'localappdata/Temp/opencode', 'temp/opencode', 'bun-cache', 'node-cache', 'tools/ff8-harness/trace']) ownDirectory(d + '/' + rel);
    writeOwned(d + '/bunfig.toml', '[test]\npreload = []\n');
    for (const f of prior.sources) {
      const changed = side === 'candidate' ? replacements.get(f.path) : null;
      copyOwned(changed ? FROZEN + '/' + changed.path : ROOT + '/' + f.path, d + '/' + f.path);
    }
    if (side === 'candidate') for (const f of replacements.values()) if (!prior.sources.some(a => a.path === prefix + f.path)) {
      copyOwned(FROZEN + '/' + f.path, d + '/' + prefix + f.path);
    }
    copyOwned(OUT + '/capture.ts', d + '/' + prefix + 'trace/capture.ts');
    const wrapper = 'import * as impl from "../src/planner";\nimport { traceCall } from "./capture";\nexport * from "../src/planner";\n' +
      METHODS.map(n => 'export const ' + n + ': typeof impl.' + n + ' = (...args) => traceCall("' + n + '", args, () => impl.' + n + '(...args));').join('\n') + '\n';
    writeOwned(d + '/' + prefix + 'trace/planner.ts', wrapper);
    const test = d + '/' + prefix + 'test/planner.test.ts';
    const original = fs.readFileSync(test, 'utf8');
    need(original.split('from "../src/planner"').length === 2, 'planner test import anchor');
    // This is the only copied existing source changed by instrumentation.
    fs.writeFileSync(test, original.replace('from "../src/planner"', 'from "../trace/planner"'));
    const rel = path.relative(scratch, test).replaceAll('\\', '/');
    expectedScratch.delete(rel);
    rememberFile(test);
    if (side === 'candidate') {
      const originalConfig = readJSON(d + '/' + prefix + 'tsconfig.json');
      need(!Object.hasOwn(originalConfig.compilerOptions, 'paths'), 'unexpected preexisting paths');
      const derived = JSON.parse(JSON.stringify(originalConfig));
      derived.compilerOptions.paths = {
        '@opencode/client': [DEPS + '/@opencode/client/' + pkg.exports['.'].types],
        '@opencode/client/service': [DEPS + '/@opencode/client/' + pkg.exports['./service'].types],
      };
      const restored = JSON.parse(JSON.stringify(derived));
      delete restored.compilerOptions.paths;
      need(equal(restored, originalConfig), 'config changed beyond two SDK type paths');
      writeOwned(d + '/' + prefix + 'tsconfig.gate-r4.json', JSON.stringify(derived, null, 2) + '\n');
    }
  }
  preparationComplete = true;
}

try {
  // Atomic R4 stem reservation is the FIRST filesystem mutation, before approval
  // parsing, inventories, snapshots, scratch or child preparation. Never retry.
  noLink(BASE); // Read-only containment check before the reservation mutation.
  const token = crypto.randomUUID();
  const initialLease = { at: new Date().toISOString(), ownerPid: process.pid, token, stem: STEM, scope: 'planner fixture only; once-only; no main/S1/numeric/native/full44 writes' };
  const fd = fs.openSync(paths.lease, 'wx');
  leaseOwned = true;
  lease = initialLease;
  leaseBytes = Buffer.from(JSON.stringify(initialLease, null, 2) + '\n');
  try { fs.writeFileSync(fd, leaseBytes); }
  finally { fs.closeSync(fd); }
  need(!fs.existsSync(paths.receipt) && !fs.existsSync(paths.release), 'stem previously attempted; no retry');
  const arg = process.argv.slice(2);
  need(arg.length === 1 && /^--adjudication-sha256=[0-9a-f]{64}$/.test(arg[0]), 'parent must pin post-review external adjudication on invocation');
  const approvalBytes = fs.readFileSync(APPROVAL);
  approvalRecord = { path: APPROVAL, bytes: approvalBytes.length, sha256: sha(approvalBytes), rawUtf8: approvalBytes.toString('utf8'), rawBase64: approvalBytes.toString('base64'), adjudication: null };
  need(sha(approvalBytes) === arg[0].slice('--adjudication-sha256='.length), 'adjudication invocation hash mismatch');
  const adjudication = JSON.parse(approvalBytes.toString('utf8'));
  approvalRecord.adjudication = adjudication;
  need(adjudication.schema === 'planner-gate-r4-approval-v1' && adjudication.verdict === 'ACCEPTABLE_PLANNER_GATE_R4_PENDING_PARENT_ONESHOT' && adjudication.executeOnce === true, 'parent R4 execution adjudication missing');
  need(adjudication.freshReview && adjudication.freshReview.verdict === 'ACCEPTABLE' && typeof adjudication.freshReview.candidateId === 'string' && adjudication.freshReview.candidateId.length > 0, 'fresh independent V missing');
  need(Array.isArray(adjudication.pins) && adjudication.pins.length > 0, 'approved exact pins missing');
  for (const pin of adjudication.pins) {
    validPin(pin);
    need(key(pin.path) !== key(APPROVAL) && !approvedPins.has(key(pin.path)), 'duplicate/self adjudication pin');
    approvedPins.set(key(pin.path), pin);
  }
  for (const pin of approvedPins.values()) verifyPin(pin);
  const fixed = [SOURCE_GO, R3_GO, R3_CORRIGE, PLAN, PRIOR, COMPILER, DELIVERY, ACCEPTANCE, RED, ...CACHE_CONTROL_PINS.map(p => p.path),
    BASE + '/S1_R5_PLANNER_ISOLATED_GATE_GO.md', BASE + '/producer-differential-trace.ts', ...ARTIFACTS.map(n => OUT + '/' + n),
    DEPS + '/@opencode/client/package.json', DEPS + '/@opencode/client/dist/promise/index.d.ts', DEPS + '/@opencode/client/dist/promise/service.d.ts'];
  for (const p of fixed) requiredPin(p);
  need(requiredPin(RED).sha256 === RED_SHA, 'original red receipt must remain exact');
  need(requiredPin(SOURCE_GO).sha256 === 'a04a153519c85a9708c93de2ffd1e1f778201842f794af7bcb88580e8571977b', 'R4 source GO changed');
  need(requiredPin(R3_GO).sha256 === '63ef477473138395b9e8a5aa08704b70e57be0010a44e34549556df4a95e8b3f', 'retained R3 source GO changed');
  need(requiredPin(R3_CORRIGE).sha256 === 'cca782333417cae89159bf94e926b17b9d441f145a04a3c5109afe2c22b6d0bb', 'retained R3 correction adjudication changed');
  for (const pin of CACHE_CONTROL_PINS) requiredPin(pin.path, pin);
  cacheControlReceipts = CACHE_CONTROL_PINS.slice(0, 2).map(pin => {
    const bytes = fs.readFileSync(pin.path);
    return { ...pin, rawBase64: bytes.toString('base64'), receipt: JSON.parse(bytes.toString('utf8')) };
  });
  need(requiredPin(PLAN).sha256 === 'fd089518db8e68a184d15e46fc2939647ab5e04bb3ef82d7acbd7a4c736c6a4d', 'R2 dependency plan changed');
  const vPins = adjudication.freshReview.files;
  need(Array.isArray(vPins) && vPins.length === approvedPins.size, 'fresh V must bind every approved exact artifact/upstream/tool pin');
  const vSeen = new Set();
  for (const p of vPins) {
    validPin(p);
    need(!vSeen.has(key(p.path)), 'fresh V duplicate artifact');
    vSeen.add(key(p.path));
    const approved = requiredPin(p.path);
    need(p.bytes === approved.bytes && p.sha256 === approved.sha256, 'fresh V not on these approved bytes');
  }
  need(Array.isArray(adjudication.inventories) && adjudication.inventories.length === 3, 'three closed approved input inventories required');
  const roots = { mainHarness: HARNESS, dependencies: DEPS, frozenPlanner: FROZEN };
  const treeSeen = new Set();
  closed = adjudication.inventories.map(t => {
    need(Object.hasOwn(roots, t.id) && !treeSeen.has(t.id) && key(t.root) === key(roots[t.id]), 'inventory root/id mismatch');
    treeSeen.add(t.id);
    return { id: t.id, root: roots[t.id], entries: normalizedEntries(t.entries) };
  });
  need(adjudication.freshReview.inventoriesSha256 === sha(JSON.stringify(closed)), 'fresh V did not bind full approved inventories in declared order');
  verifyInputs('approved-inputs-before-parsing-upstream');
  const prior = readJSON(PRIOR);
  const compiler = readJSON(COMPILER);
  const delivery = readJSON(DELIVERY);
  const acceptance = readJSON(ACCEPTANCE);
  need(prior.allQualified === true && Array.isArray(prior.sources) && prior.sources.length === 269 && acceptance.verdict === 'ACCEPTABLE_PLANNER_PURE_EXTRACTION_R1_PENDING_PARENT_GATES', 'qualified 269 baseline/planner acceptance missing');
  const seenSources = new Set();
  sourcePins = prior.sources.map(f => {
    relative(f.path);
    need(f.path.startsWith('tools/ff8-harness/') && !f.path.startsWith('tools/ff8-harness/node_modules/') && !seenSources.has(f.path.toLowerCase()), 'baseline corpus path/duplicate');
    seenSources.add(f.path.toLowerCase());
    const e = requireTreeFile('mainHarness', ROOT + '/' + f.path, f);
    return { path: ROOT + '/' + f.path, bytes: e.bytes, sha256: e.sha256 };
  });
  need(Array.isArray(delivery.files) && delivery.files.length === 6 && equal(delivery.files.map(f => f.path).sort(), [...FOUR, 'DESIGN.md', 'MANIFEST.json'].sort()), 'candidate must be exactly the same four planner files plus its two documents');
  for (const f of delivery.files) {
    relative(f.path);
    requireTreeFile('frozenPlanner', FROZEN + '/' + f.path, f);
  }
  const frozenFiles = closed.find(t => t.id === 'frozenPlanner').entries.filter(e => e.type === 'file');
  need(frozenFiles.length === 6, 'unapproved extra frozen candidate file');
  const red = readJSON(RED);
  need(red.qualified === false && red.main269GuardsUnchanged === true, 'prior red meaning changed');
  need(Array.isArray(red.pins) && Array.isArray(red.runs) && red.runs.length === 1 && red.runs[0].name === 'candidate-typecheck', 'original red pin/log corpus');
  const originalPins = new Map();
  for (const p of red.pins) {
    const old = originalPins.get(key(p.path));
    need(!old || (old.sha256 === p.sha256 && old.bytes === p.bytes), 'contradictory original red pin');
    originalPins.set(key(p.path), p);
  }
  function originalPin(p, current) {
    const old = originalPins.get(key(p));
    need(old && old.sha256 === current.sha256 && (old.bytes === undefined || old.bytes === current.bytes), 'no rebaseline of original guard/candidate/tool: ' + p);
  }
  for (const p of sourcePins) originalPin(p.path, p);
  for (const f of delivery.files) originalPin(FROZEN + '/' + f.path, requireTreeFile('frozenPlanner', FROZEN + '/' + f.path));
  for (const old of originalPins.values()) if (key(old.path).startsWith(key(DEPS) + '/')) requireTreeFile('dependencies', old.path, old);
  for (const p of [BASE + '/S1_R5_PLANNER_ISOLATED_GATE_GO.md', BASE + '/producer-differential-trace.ts']) originalPin(p, requiredPin(p));
  for (const stream of ['stdout', 'stderr']) requiredPin(red.scratch + '/candidate-typecheck.' + stream + '.bin', {
    bytes: red.runs[0][stream + 'Bytes'], sha256: red.runs[0][stream + 'Sha256'],
  });
  // Bind all prior tools and approval documents; never compute replacement pins.
  need(Array.isArray(compiler.toolFiles) && compiler.toolFiles.length > 0 && Array.isArray(compiler.argv), 'compiler receipt format');
  for (const f of compiler.toolFiles) { requiredPin(f.path, f); originalPin(f.path, requiredPin(f.path)); }
  requiredPin(compiler.node);
  requiredPin(prior.bun.path, prior.bun);
  originalPin(compiler.node, requiredPin(compiler.node));
  originalPin(prior.bun.path, requiredPin(prior.bun.path));
  need(key(compiler.argv[0]) === key(DEPS + '/typescript/bin/tsc'), 'unexpected compiler entrypoint');
  requireTreeFile('dependencies', compiler.argv[0]);
  const pkg = readJSON(DEPS + '/@opencode/client/package.json');
  need(pkg.name === '@opencode/client' && pkg.version === '2.0.26' && pkg.exports['.'].types === './dist/promise/index.d.ts' && pkg.exports['./service'].types === './dist/promise/service.d.ts', 'SDK export mapping/version differs from reviewed package');
  for (const n of ['package.json', 'dist/promise/index.d.ts', 'dist/promise/service.d.ts']) requireTreeFile('dependencies', DEPS + '/@opencode/client/' + n, requiredPin(DEPS + '/@opencode/client/' + n));
  for (const [n, hash] of [
    ['package.json', 'fbbd63ad8994eeea4c5f164dda7a8c5e3af82e50c66d0ecf964644e1354eaebf'],
    ['dist/promise/index.d.ts', 'bec48b084b362442c3d62c41d757fb93f23a10afa6789aff7ba45c8c81f97c23'],
    ['dist/promise/service.d.ts', '15041df3a78a2c36d162a24ad9ff2c359b2f975f86ba45db9e8f28805444ee38'],
  ]) need(requiredPin(DEPS + '/@opencode/client/' + n).sha256 === hash, 'reviewed SDK packet bytes changed');
  const config = readJSON(HARNESS + '/tsconfig.json');
  need(requireTreeFile('mainHarness', HARNESS + '/tsconfig.json').sha256 === '0f07f181d84b42f60cf4f29eae08b5c5f71678d3f99ac57d03fa37dde1a6c516', 'original full tsconfig changed');
  need(config.compilerOptions.strict === true && config.compilerOptions.noEmit === true && config.compilerOptions.moduleResolution === 'Bundler' && equal(config.include, ['src/**/*.ts', 'test/**/*.ts', 'scripts/**/*.ts']), 'original typecheck guards changed');
  need(!Object.keys(process.env).some(k => /^(BUN|NODE)/i.test(k)), 'parent gate runtime inherited BUN*/NODE* environment');
  const systemEnvironment = adjudication.systemEnvironment;
  need(systemEnvironment && equal(Object.keys(systemEnvironment).sort(), ['SystemRoot', 'WINDIR']), 'system whitelist must be exactly SystemRoot/WINDIR');
  for (const [name, value] of Object.entries(systemEnvironment)) need(typeof value === 'string' && path.isAbsolute(value) && key(value) === key('C:/Windows') && key(process.env[name] || '') === key(value), 'unexpected approved Windows system root');
  rejectGlobalConfigs('before-preparation');
  prepare(prior, delivery, pkg);
  verifyInputs('after-preparation');
  checkScratch('prepared');
  rejectGlobalConfigs('after-preparation');
  const tsc = run('candidate-typecheck', compiler.node, [compiler.argv[0], '--noEmit', '-p', scratch + '/candidate/tools/ff8-harness/tsconfig.gate-r4.json', '--typeRoots', DEPS + '/@types', '--listFiles'], 'candidate', false, systemEnvironment);
  listedFiles = listFilesProof(tsc.stdout, tsc.stderr);
  for (const side of ['baseline', 'candidate']) run(side + '-planner-lineage', prior.bun.path, [
    'test', '--no-env-file', '--config=' + scratch + '/' + side + '/bunfig.toml',
    '--max-concurrency', '1', '--timeout', '15000', './test/planner.test.ts', './test/lineage.test.ts',
  ], side, true, systemEnvironment);
  const a = parseTrace('baseline');
  const b = parseTrace('candidate');
  differential = {
    baseline: a.summary, candidate: b.summary, fullBytesEqual: a.bytes.equals(b.bytes),
    footerBytesEqual: a.metaBytes.equals(b.metaBytes),
    countersEqual: ['pass', 'fail', 'assertions', 'files', 'skips'].every(k => runs[1][k] === runs[2][k]),
  };
  need(differential.fullBytesEqual && differential.footerBytesEqual && differential.countersEqual, 'FULL output/footer/counter differential mismatch');
  verifyInputs('final');
  checkScratch('final');
  rejectGlobalConfigs('final');
  qualified = true;
} catch (e) {
  qualified = false;
  failures.push({ at: new Date().toISOString(), stage: preparationComplete ? 'gate' : 'preparation', message: errorText(e), runnerState });
  if (/drift|changed|disagrees|disagreement/.test(errorText(e))) guardsUnchanged = false;
} finally {
  if (leaseOwned) {
    let leaseIntact = false;
    try {
      const actual = filePin(paths.lease);
      leaseIntact = leaseBytes !== null && actual.bytes === leaseBytes.length && actual.sha256 === sha(leaseBytes);
      need(leaseIntact, 'owned lease contents changed or incomplete');
    } catch (e) { qualified = false; infrastructureFailures.push('LEASE_OWNERSHIP_UNPROVEN: ' + errorText(e)); }
    // Bookend verification is attempted even after parse/preparation/run failure.
    if (approvalRecord && closed.length === 3) {
      try { verifyInputs('finally-bookend'); }
      catch (e) { qualified = false; guardsUnchanged = false; failures.push({ stage: 'finally-input-bookend', message: errorText(e) }); }
    }
    if (scratchPrepared) {
      try { checkScratch('finally-bookend'); }
      catch (e) { qualified = false; failures.push({ stage: 'finally-scratch-bookend', message: errorText(e) }); }
      try { rejectGlobalConfigs('finally-bookend'); }
      catch (e) { qualified = false; failures.push({ stage: 'finally-global-config-bookend', message: errorText(e) }); }
    }
    const knownInactive = runnerState === 'not-started' || runnerState === 'synchronous-return-child-ended';
    if (!knownInactive) { qualified = false; infrastructureFailures.push('owned runner inactivity not provable: ' + runnerState); }
    const receipt = {
      at: new Date().toISOString(), gate: STEM, lease, leaseIntact, leaseSha256: leaseBytes ? sha(leaseBytes) : null, scratch,
      approval: approvalRecord, pins: [...approvedPins.values()], inputInventories: closed, cacheControlReceipts,
      source269: sourcePins, scratchInventory: [...expectedScratch.values()], scratchObservations, inputInventoryChecks,
      preparationComplete, runs, listedFiles, differential, failures,
      main269GuardsUnchanged: guardsUnchanged, qualified,
      priorRedReceiptSha256: RED_SHA, globalConfigChecks, checkpoints,
      runnerState, knownInactive, allArtifactsRetained: true,
      scope: 'planner fixture equivalence only; no universal proof/numeric/main integration/S1 repin/native/full44',
    };
    let receiptWritten = false;
    let receiptPin = null;
    try {
      fs.writeFileSync(paths.receipt, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
      receiptPin = filePin(paths.receipt);
      receiptWritten = true;
    } catch (e) { qualified = false; infrastructureFailures.push('RECEIPT_WRITE_FAILED: ' + errorText(e)); }
    try {
      fs.writeFileSync(paths.release, JSON.stringify({
        at: new Date().toISOString(), lease, runnerState,
        activeOwnedRunner: knownInactive ? false : null,
        leaseIntact, released: knownInactive && receiptWritten && leaseIntact,
        receiptWritten, receipt: receiptPin, infrastructureFailures,
        qualified: qualified && receiptWritten && knownInactive,
        retention: 'all artifacts retained; lease immutable; no retry or cleanup',
      }, null, 2) + '\n', { flag: 'wx' });
    } catch (e) { qualified = false; infrastructureFailures.push('RELEASE_WRITE_FAILED: ' + errorText(e)); }
    // A successful receipt is NOT authoritative if final infrastructure fails.
    // Parent acceptance requires exit 0 AND matching successful release/receipt.
  } else {
    qualified = false;
    infrastructureFailures.push('LEASE_NOT_ACQUIRED: no receipt/release ownership claimed');
  }
  process.exitCode = qualified && infrastructureFailures.length === 0 ? 0 : infrastructureFailures.length ? 3 : 2;
  console.log(JSON.stringify({ gate: STEM, qualified: process.exitCode === 0, exitCode: process.exitCode, leaseOwned, scratch, failures, infrastructureFailures, runnerState }));
}
