'use strict';
// SOURCE PROPOSAL. Only the parent may invoke this after fresh independent V.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { hashFile, scanTrace, readFooter, compareFilesExact, validateCapture } = require('./trace-stream.cjs');
// ONE object for the entire invocation: the leaf's monotonic budget never
// restarts between inventory files, branches, parsing, comparison or bookends.
const LIMITS = Object.freeze({ chunkBytes: 1048576, traceBytes: 1073741824,
  pairBytes: 2147483648, recordBytes: 268435456, rows: 200000, calls: 100000,
  depth: 64, footerBytes: 65536, controlBytes: 16777216,
  workingBytes: 8388608, analysisMs: 600000 });
const ROOT = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const BASE = ROOT + '/.tmp/mission-v2-20261018-continuous';
const HARNESS = ROOT + '/tools/ff8-harness';
const DEPS = HARNESS + '/node_modules';
const BASELINE_FROZEN = BASE + '/s1-r5-planner-extraction-r1-frozen';
const FROZEN = BASE + '/planner-fixed-r2-candidate-bundle';
const NATIVE_R2 = BASE + '/planner-fixed-projections-r2-frozen';
const STEM = 'planner-fixed-projections-r2-qualification-gate';
const APPROVAL = BASE + '/planner-fixed-projections-r2-gate-parent-adjudication.json';
const GATE_SOURCE_GO = BASE + '/PLANNER_FIXED_R2_GATE_SOURCE_GO.md';
const GATE_PACKET = BASE + '/planner-fixed-r2-gate-source/inputs';
const GATE_PACKET_MANIFEST_SHA = '457913b52846af318c2d8350095f71c1c4d81e966d56e01f18d6d9262c78572d';
const RED = BASE + '/s1-r5-planner-isolated-gate-receipt.json';
const RED_SHA = '72fa246c5c1e39b41c6116254f160682b9e0300ec39d59848120589de532ed21';
const SOURCE_GO = BASE + '/PLANNER_R5_STREAMING_SOURCE_GO.md';
const R4_GO = BASE + '/PLANNER_GATE_R4_MINIMAL_SOURCE_GO.md';
const PACKET = BASE + '/planner-r5-harness-source/inputs';
const PACKET_MANIFEST_SHA = '65d776ed4b3a85984fac5563e66fec154bb4a1ff22a0db66270748dce88d3e32';
const R4_RETAINED = [
  { path: BASE + '/s1-r5-planner-isolated-r4-gate-receipt.json', bytes: 5721440, sha256: '88b85430d591236c7d75249e2ece1215c0c2eb93487927e97c907562dcb979c5' },
  { path: BASE + '/s1-r5-planner-isolated-r4-gate-release.json', bytes: 851, sha256: '838a42ee617645c8958e7e9fc5ea67e6c35bef81fb2e20926b99e5c3b088f407' },
];
const TEST_PINS = [
  { path: 'test/planner.test.ts', bytes: 80223, sha256: '6a70750d15b37458baf74b3dd2d9e0742908f2e91067039ae0398e6e520e9181' },
  { path: 'test/lineage.test.ts', bytes: 100786, sha256: '02171587562cd55072037883711f72901c8e9f465294470d2747da7b0c4cb2de' },
];
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
const BASELINE_DELIVERY = BASE + '/s1-r5-planner-extraction-r1-parent-delivery-audit.json';
const BASELINE_ACCEPTANCE = BASE + '/s1-r5-planner-r1-parent-static-adjudication.json';
const DELIVERY = BASE + '/planner-fixed-r2-candidate-assembly.json';
const SOURCE_DELIVERY = BASE + '/planner-fixed-projections-r2-parent-delivery-audit.json';
const ACCEPTANCE = BASE + '/planner-fixed-projections-r2-parent-static-acceptance.json';
const BASELINE_QUALIFIED = {
  path: BASE + '/s1-r5-planner-isolated-r5-gate-receipt.json', bytes: 8306574,
  sha256: '4e213bb3c4269710f0e91cfba3fcc5e12f58ae34699ca3b6b8692c9f1260565d',
};
const BASELINE_READBACK = {
  path: BASE + '/planner-r5-parent-green-verification.json', bytes: 1556,
  sha256: 'a17c4fdf292365d4c15b778b179e1a381c8f44ab854619e9c38d2392363643a2',
};
const OUT = path.dirname(__filename);
const METHODS = ['planMission', 'compareGranularities'];
const FOUR = ['src/planner-derived-codecs.ts', 'src/function-order.ts', 'src/planner.ts', 'src/scc.ts'];
const ARTIFACTS = ['gate.cjs', 'capture.ts', 'trace-stream.cjs', 'DESIGN.md', 'MANIFEST.json'];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const canonical = p => path.resolve(p).replaceAll('\\', '/');
const key = p => canonical(p).toLowerCase();
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function need(condition, message) { if (!condition) throw new Error(message); }
function readSmall(p) {
  const pin = filePin(p);
  need(pin.bytes <= LIMITS.controlBytes, 'control/source materialization cap: ' + p);
  // Even a file growing between pin and read cannot cause an unbounded read.
  const fd = fs.openSync(p, 'r');
  let bytes;
  try {
    need(fs.fstatSync(fd).isFile() && fs.fstatSync(fd).size === pin.bytes, 'bounded file size drift');
    bytes = Buffer.alloc(pin.bytes);
    let used = 0;
    while (used < bytes.length) {
      const n = fs.readSync(fd, bytes, used, Math.min(LIMITS.chunkBytes, bytes.length - used), null);
      need(n > 0, 'bounded read early EOF'); used += n;
    }
    need(fs.readSync(fd, Buffer.alloc(1), 0, 1, null) === 0 && fs.fstatSync(fd).size === pin.bytes, 'bounded read late EOF/size drift');
  } finally { fs.closeSync(fd); }
  need(bytes.length === pin.bytes && sha(bytes) === pin.sha256 && bytes.length <= LIMITS.controlBytes, 'bounded read drift: ' + p);
  need(Buffer.from(bytes.toString('utf8'), 'utf8').equals(bytes), 'invalid bounded UTF8: ' + p);
  return bytes;
}
function parseControl(bytes) {
  need(bytes.length <= LIMITS.controlBytes, 'control JSON byte cap');
  let depth = 0, string = false, escape = false;
  for (const b of bytes) {
    if (string) {
      if (escape) escape = false;
      else if (b === 92) escape = true;
      else if (b === 34) string = false;
    } else if (b === 34) string = true;
    else if (b === 123 || b === 91) need(++depth <= LIMITS.depth, 'control JSON depth cap');
    else if (b === 125 || b === 93) need(--depth >= 0, 'control JSON nesting');
  }
  need(depth === 0 && !string, 'incomplete control JSON');
  return JSON.parse(bytes.toString('utf8'));
}
function readJSON(p) { return parseControl(readSmall(p)); }
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
  const pin = hashFile(p, LIMITS);
  return { ...pin, path: canonical(p) };
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
        const pin = filePin(p);
        entries.push({ path: rel, type: 'file', bytes: pin.bytes, sha256: pin.sha256 });
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
let diskBudget = null;
const snapshotProofs = [];
const phaseProofs = [];
const instrumentationProofs = [];
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
function rememberFile(p, cap = Infinity) {
  need(key(p).startsWith(key(scratch) + '/'), 'owned file escape');
  const rel = path.relative(scratch, p).replaceAll('\\', '/');
  need(!expectedScratch.has(rel), 'owned file reused: ' + rel);
  need(fs.lstatSync(p).size <= cap, 'owned output size cap: ' + rel);
  const pin = filePin(p);
  need(pin.bytes <= cap, 'actual owned output size cap: ' + rel);
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
  const bytes = actual.filter(e => e.type === 'file').reduce((n, e) => n + e.bytes, 0);
  need(diskBudget === null || bytes <= diskBudget, 'new scratch disk cap');
  for (const snapshot of snapshotProofs) {
    const entries = inventory(snapshot.root);
    need(equal(entries, snapshot.entries), 'immutable snapshot drift: ' + snapshot.side);
  }
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
  if (scratch) for (const side of ['snapshots/baseline', 'snapshots/candidate', 'active', 'archive-baseline']) {
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
    if (fs.existsSync(p)) rememberFile(p, n.endsWith('.jsonl') ? LIMITS.traceBytes : LIMITS.footerBytes);
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
    cwd: scratch + '/' + side + '/tools/ff8-harness',
    runtimePath: isTest ? scratch + '/active' : null,
    parentOwnedFDsClosed: true, // All explicit opens use finally-close; spawnSync pipes have returned.
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
  const candidate = scratch + '/snapshots/candidate/';
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
    if (entry.type === 'file' && /^snapshots\/candidate\/tools\/ff8-harness\/(src|test|scripts)\/.*\.ts$/.test(entry.path)) {
      need(seen.has(key(scratch + '/' + entry.path)), 'included TS file absent from actual listFiles: ' + entry.path);
    }
  }
  for (const n of ['capture.ts', 'planner.ts']) need(seen.has(key(candidate + 'tools/ff8-harness/trace/' + n)), 'trace adapter not actually compiled');
  return { flag: '--listFiles', files, outsideApprovedCorpus: 0 };
}
function parseTrace(side) {
  const d = scratch + '/' + side;
  const summary = scanTrace(d + '/planner-full-trace.jsonl', LIMITS);
  const footer = readFooter(d + '/planner-full-meta.json', LIMITS);
  return { ...validateCapture(summary, footer), runtimePath: scratch + '/active', retainedPath: d };
}

function prepare(prior, assembly, pkg) {
  scratch = 'C:/Users/djden/AppData/Local/Temp/opencode/PLANNER-FIXED-R2-QUALIFICATION-' + crypto.randomUUID();
  fs.mkdirSync(scratch); // Reservation has already happened; no recursive reuse.
  scratchPrepared = true;
  const prefix = 'tools/ff8-harness/';
  for (const side of ['baseline', 'candidate']) {
    const root = side === 'baseline' ? BASELINE_FROZEN : FROZEN;
    const replacements = new Map(assembly[side].files.filter(f => FOUR.includes(f.path)).map(f => [prefix + f.path, f]));
    const d = scratch + '/snapshots/' + side;
    for (const rel of ['home', 'config', 'cache', 'data', 'appdata', 'localappdata/Temp/opencode', 'temp/opencode', 'bun-cache', 'node-cache', 'tools/ff8-harness/trace']) ownDirectory(d + '/' + rel);
    writeOwned(d + '/bunfig.toml', '[test]\npreload = []\n');
    for (const f of prior.sources) {
      const changed = replacements.get(f.path);
      copyOwned(changed ? root + '/' + changed.path : ROOT + '/' + f.path, d + '/' + f.path);
    }
    for (const f of replacements.values()) if (!prior.sources.some(a => a.path === prefix + f.path)) {
      copyOwned(root + '/' + f.path, d + '/' + prefix + f.path);
    }
    copyOwned(OUT + '/capture.ts', d + '/' + prefix + 'trace/capture.ts');
    const wrapper = 'import * as impl from "../src/planner";\nimport { traceCall } from "./capture";\nexport * from "../src/planner";\n' +
      METHODS.map(n => 'export const ' + n + ': typeof impl.' + n + ' = (...args) => traceCall("' + n + '", args, () => impl.' + n + '(...args));').join('\n') + '\n';
    writeOwned(d + '/' + prefix + 'trace/planner.ts', wrapper);
    const test = d + '/' + prefix + 'test/planner.test.ts';
    const originalBytes = readSmall(test);
    const original = originalBytes.toString('utf8');
    need(original.split('from "../src/planner"').length === 2, 'planner test import anchor');
    const aliases = ['__ff8R5AfterAll', '__ff8R5FinalizeCapture'];
    need(aliases.every(n => !original.includes(n)), 'reserved hook alias collision');
    const hookImports = 'import { afterAll as __ff8R5AfterAll } from "bun:test";\n' +
      'import { finalizeCapture as __ff8R5FinalizeCapture } from "../trace/capture";\n';
    const hook = '\n__ff8R5AfterAll(() => { if (!__ff8R5FinalizeCapture()) throw new Error("FF8 R5 capture finalization failed"); });\n';
    const instrumented = hookImports + original.replace('from "../src/planner"', 'from "../trace/planner"') + hook;
    const restored = instrumented.slice(hookImports.length, -hook.length).replace('from "../trace/planner"', 'from "../src/planner"');
    need(Buffer.from(restored, 'utf8').equals(originalBytes), 'scientific test bytes not exactly recoverable');
    const wrapperCapsule = canonical(path.resolve(d + '/' + prefix + 'trace', './capture.ts'));
    const hookCapsule = canonical(path.resolve(d + '/' + prefix + 'test', '../trace/capture.ts'));
    need(wrapperCapsule === hookCapsule, 'hook and wrapper different absolute capsule');
    instrumentationProofs.push({ side, original: { bytes: originalBytes.length, sha256: sha(originalBytes) },
      instrumented: { bytes: Buffer.byteLength(instrumented), sha256: sha(instrumented) },
      originalBytesRecovered: true, wrapperCapsule, hookCapsule, assertionCounterAdded: false });
    // The only modified copied test. No scientific test/expect/body alteration.
    fs.writeFileSync(test, instrumented);
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
      writeOwned(d + '/' + prefix + 'tsconfig.gate-r5.json', JSON.stringify(derived, null, 2) + '\n');
    }
    const entries = inventory(d);
    snapshotProofs.push({ side, root: d, entries, sha256: sha(JSON.stringify(entries)),
      bytes: entries.filter(e => e.type === 'file').reduce((n, e) => n + e.bytes, 0) });
  }
  diskBudget = 2 * snapshotProofs.reduce((n, p) => n + p.bytes, 0) + LIMITS.pairBytes + 67108864;
  preparationComplete = true;
}

function absent(p) {
  try { fs.lstatSync(p); return false; } catch (e) { if (e.code === 'ENOENT') return true; throw e; }
}
function activate(side) {
  const snapshot = snapshotProofs.find(p => p.side === side);
  need(snapshot && equal(inventory(snapshot.root), snapshot.entries), 'snapshot changed before activation');
  const active = scratch + '/active';
  need(absent(active), 'active pathname already occupied; no reuse/cleanup');
  ownDirectory(active);
  // Parents precede their descendants in lexical inventory order.
  for (const e of snapshot.entries) {
    if (e.type === 'directory') ownDirectory(active + '/' + e.path);
    else copyOwned(snapshot.root + '/' + e.path, active + '/' + e.path);
  }
  const actual = inventory(active);
  need(equal(actual, snapshot.entries), 'fresh active copy differs from immutable snapshot');
  phaseProofs.push({ phase: 'activate-' + side, runtimePath: active, snapshot: snapshot.root,
    sourceSha256: snapshot.sha256, activeSha256: sha(JSON.stringify(actual)), fresh: true });
  checkScratch('activated-' + side);
}
function archiveBaseline() {
  need(runnerState === 'synchronous-return-child-ended' && runs.at(-1).name === 'baseline-planner-lineage' &&
    runs.at(-1).parentOwnedFDsClosed === true, 'cannot rename while owned runner/FD activity is unknown');
  verifyInputs('before-archive-baseline');
  checkScratch('before-archive-baseline');
  const active = scratch + '/active', archive = scratch + '/archive-baseline';
  need(absent(archive), 'archive already occupied');
  const before = inventory(active);
  fs.renameSync(active, archive); // Whole tree; failure is red, never delete/retry.
  for (const [rel, e] of [...expectedScratch]) if (rel === 'active' || rel.startsWith('active/')) {
    expectedScratch.delete(rel);
    const moved = 'archive-baseline' + rel.slice('active'.length);
    need(!expectedScratch.has(moved), 'archive inventory collision');
    expectedScratch.set(moved, { ...e, path: moved });
  }
  need(absent(active), 'active still exists after whole-tree rename');
  const after = inventory(archive);
  need(equal(before, after), 'baseline archive bytes not preserved');
  phaseProofs.push({ phase: 'archive-baseline', runtimePath: active, archivedPath: archive,
    beforeSha256: sha(JSON.stringify(before)), afterSha256: sha(JSON.stringify(after)),
    activeAbsent: true, childEnded: true, parentOwnedFDsClosed: true });
  checkScratch('after-archive-baseline');
  verifyInputs('after-archive-baseline');
}

try {
  // Atomic new-context stem reservation is the FIRST filesystem mutation, before approval
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
  const approvalBytes = readSmall(APPROVAL);
  approvalRecord = { path: APPROVAL, bytes: approvalBytes.length, sha256: sha(approvalBytes), rawUtf8: approvalBytes.toString('utf8'), rawBase64: approvalBytes.toString('base64'), adjudication: null };
  need(sha(approvalBytes) === arg[0].slice('--adjudication-sha256='.length), 'adjudication invocation hash mismatch');
  const adjudication = parseControl(approvalBytes);
  approvalRecord.adjudication = adjudication;
  need(adjudication.schema === 'planner-fixed-r2-gate-approval-v1' && adjudication.verdict === 'ACCEPTABLE_PLANNER_FIXED_R2_GATE_PENDING_PARENT_ONESHOT' && adjudication.executeOnce === true, 'parent fixed R2 execution adjudication missing');
  need(adjudication.freshReview && adjudication.freshReview.verdict === 'ACCEPTABLE' && typeof adjudication.freshReview.candidateId === 'string' && adjudication.freshReview.candidateId.length > 0, 'fresh independent V missing');
  need(Array.isArray(adjudication.pins) && adjudication.pins.length > 0, 'approved exact pins missing');
  for (const pin of adjudication.pins) {
    validPin(pin);
    need(key(pin.path) !== key(APPROVAL) && !approvedPins.has(key(pin.path)), 'duplicate/self adjudication pin');
    approvedPins.set(key(pin.path), pin);
  }
  for (const pin of approvedPins.values()) verifyPin(pin);
  const fixed = [SOURCE_GO, R4_GO, R3_GO, R3_CORRIGE, PLAN, PRIOR, COMPILER, DELIVERY, ACCEPTANCE, RED,
    GATE_SOURCE_GO, GATE_PACKET + '/INPUT_MANIFEST.json', BASELINE_DELIVERY, BASELINE_ACCEPTANCE,
    SOURCE_DELIVERY, BASELINE_QUALIFIED.path, BASELINE_READBACK.path,
    PACKET + '/INPUT_MANIFEST.json', ...R4_RETAINED.map(p => p.path), ...CACHE_CONTROL_PINS.map(p => p.path),
    BASE + '/S1_R5_PLANNER_ISOLATED_GATE_GO.md', BASE + '/producer-differential-trace.ts', ...ARTIFACTS.map(n => OUT + '/' + n),
    DEPS + '/@opencode/client/package.json', DEPS + '/@opencode/client/dist/promise/index.d.ts', DEPS + '/@opencode/client/dist/promise/service.d.ts'];
  for (const p of fixed) requiredPin(p);
  requiredPin(BASELINE_QUALIFIED.path, BASELINE_QUALIFIED);
  requiredPin(BASELINE_READBACK.path, BASELINE_READBACK);
  need(requiredPin(GATE_PACKET + '/INPUT_MANIFEST.json').sha256 === GATE_PACKET_MANIFEST_SHA, 'fixed R2 raw source packet manifest changed');
  const gatePacketManifest = readJSON(GATE_PACKET + '/INPUT_MANIFEST.json');
  need(Array.isArray(gatePacketManifest.files) && gatePacketManifest.files.length === 34 &&
    gatePacketManifest.files.reduce((n, p) => n + p.bytes, 0) === 1601253, 'fixed R2 source packet payload count/size');
  const gatePacketSeen = new Set();
  for (const pin of gatePacketManifest.files) {
    relative(pin.path);
    need(!gatePacketSeen.has(pin.path.toLowerCase()), 'duplicate fixed R2 source packet row');
    gatePacketSeen.add(pin.path.toLowerCase());
    validPin({ path: pin.source, bytes: pin.bytes, sha256: pin.sha256 });
    requiredPin(GATE_PACKET + '/' + pin.path, pin);
    requiredPin(pin.source, pin); // Declared provenance is also approved/verified, never a replacement binding.
    if (/\.json$/i.test(pin.path)) need(pin.bytes <= LIMITS.controlBytes, 'fixed R2 packet control JSON cap');
  }
  for (const n of ['capture.ts', 'trace-stream.cjs']) {
    const reference = gatePacketManifest.files.find(p => p.path === 'reference-R5/' + n);
    need(reference, 'missing immutable R5 capsule reference');
    requiredPin(OUT + '/' + n, reference);
  }
  need(requiredPin(RED).sha256 === RED_SHA, 'original red receipt must remain exact');
  need(requiredPin(SOURCE_GO).sha256 === '93a0e9cd1c974c151d16a68bcaac682fb75e615b5c2569ef443e5adb5df04f7a', 'R5 source GO changed');
  need(requiredPin(R4_GO).sha256 === 'a04a153519c85a9708c93de2ffd1e1f778201842f794af7bcb88580e8571977b', 'retained R4 source GO changed');
  need(requiredPin(PACKET + '/INPUT_MANIFEST.json').sha256 === PACKET_MANIFEST_SHA, 'R5 raw input manifest changed');
  for (const pin of R4_RETAINED) requiredPin(pin.path, pin);
  const packetManifest = readJSON(PACKET + '/INPUT_MANIFEST.json');
  need(Array.isArray(packetManifest.files) && packetManifest.files.length === 15 &&
    packetManifest.files.reduce((n, p) => n + p.bytes, 0) === 357441, 'R5 packet payload count/size');
  for (const pin of packetManifest.files) {
    relative(pin.path); requiredPin(PACKET + '/' + pin.path, pin);
    if (/\.json$/.test(pin.path)) need(pin.bytes <= LIMITS.controlBytes, 'packet control JSON cap');
  }
  const r4Summary = readJSON(PACKET + '/R4_RED_SUMMARY.json');
  need(r4Summary.qualified === false && r4Summary.traceStats.length === 2 &&
    r4Summary.traceStats.every(p => p.metadataExists === false), 'R4 red/missing footer evidence changed');
  for (const pin of r4Summary.traceStats) requiredPin(pin.path, pin);
  const r4Receipt = readJSON(R4_RETAINED[0].path);
  need(r4Receipt.qualified === false, 'R4 remains unqualified');
  need(requiredPin(R3_GO).sha256 === '63ef477473138395b9e8a5aa08704b70e57be0010a44e34549556df4a95e8b3f', 'retained R3 source GO changed');
  need(requiredPin(R3_CORRIGE).sha256 === 'cca782333417cae89159bf94e926b17b9d441f145a04a3c5109afe2c22b6d0bb', 'retained R3 correction adjudication changed');
  for (const pin of CACHE_CONTROL_PINS) requiredPin(pin.path, pin);
  cacheControlReceipts = CACHE_CONTROL_PINS.slice(0, 2).map(pin => {
    const bytes = readSmall(pin.path);
    return { ...pin, rawBase64: bytes.toString('base64'), receipt: parseControl(bytes) };
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
  need(Array.isArray(adjudication.inventories) && adjudication.inventories.length === 4, 'four closed approved input inventories required');
  const roots = { mainHarness: HARNESS, dependencies: DEPS, baselinePlanner: BASELINE_FROZEN, frozenPlanner: FROZEN };
  need(equal(adjudication.inventories.map(t => t.id), Object.keys(roots)), 'closed inventory declared order mismatch');
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
  const assembly = readJSON(DELIVERY);
  const baselineDelivery = readJSON(BASELINE_DELIVERY);
  const sourceDelivery = readJSON(SOURCE_DELIVERY);
  const acceptance = readJSON(ACCEPTANCE);
  need(prior.allQualified === true && Array.isArray(prior.sources) && prior.sources.length === 269, 'qualified 269 original scientific corpus missing');
  need(readJSON(BASELINE_ACCEPTANCE).verdict === 'ACCEPTABLE_PLANNER_PURE_EXTRACTION_R1_PENDING_PARENT_GATES', 'historical R1 source acceptance missing');
  need(acceptance.verdict === 'ACCEPTABLE_PLANNER_FIXED_PROJECTIONS_R2_SOURCE_PENDING_PARENT_GATES' &&
    acceptance.sourceCandidate === 'result_mvfkgpe7_00bx_lwodkz' && acceptance.sourceReviewCandidate === 'result_mvfl606y_00c8_ncqi4h' &&
    acceptance.requiresNewGateSourceReviewBeforeInvocation === true && acceptance.executeOnce === false, 'fixed R2 source-only acceptance missing');
  const seenSources = new Set();
  sourcePins = prior.sources.map(f => {
    relative(f.path);
    need(f.path.startsWith('tools/ff8-harness/') && !f.path.startsWith('tools/ff8-harness/node_modules/') && !seenSources.has(f.path.toLowerCase()), 'baseline corpus path/duplicate');
    seenSources.add(f.path.toLowerCase());
    const e = requireTreeFile('mainHarness', ROOT + '/' + f.path, f);
    return { path: ROOT + '/' + f.path, bytes: e.bytes, sha256: e.sha256 };
  });
  need(assembly.schema === 'planner-fixed-candidate-assembly-v1' && assembly.status === 'ASSEMBLED_SOURCE_NOT_RUNTIME_QUALIFIED' &&
    assembly.noCodeEditedOrOriginalArtifactOverwritten === true && assembly.noCompilerTestOrImport === true, 'source-only assembly audit missing');
  need(assembly.baseline && assembly.baseline.root === BASELINE_FROZEN && assembly.baseline.deliveryPath === BASELINE_DELIVERY &&
    equal(assembly.baseline.qualifiedReceipt, BASELINE_QUALIFIED) && equal(assembly.baseline.parentReadback, BASELINE_READBACK), 'qualified baseline assembly binding');
  need(assembly.candidate && assembly.candidate.root === FROZEN && assembly.candidate.sourceNativeCandidate === acceptance.sourceCandidate &&
    assembly.candidate.sourceDeliveryAuditPath === SOURCE_DELIVERY && assembly.candidate.sourceStaticAcceptancePath === ACCEPTANCE &&
    sourceDelivery.candidate === acceptance.sourceCandidate, 'native fixed R2 source assembly binding');
  function fileRows(rows, expected, label) {
    need(Array.isArray(rows) && rows.length === expected.length, label + ' file count');
    const seen = new Set();
    const result = rows.map(f => {
      need(f && equal(Object.keys(f).sort(), ['bytes', 'path', 'sha256']), label + ' row fields');
      relative(f.path);
      validPin({ ...f, path: ROOT + '/' + f.path });
      need(!seen.has(f.path.toLowerCase()), label + ' duplicate file');
      seen.add(f.path.toLowerCase());
      return { path: f.path, bytes: f.bytes, sha256: f.sha256 };
    }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    need(equal(result.map(f => f.path), [...expected].sort()), label + ' exact filenames');
    return result;
  }
  const sixPaths = [...FOUR, 'DESIGN.md', 'MANIFEST.json'];
  const baselineFiles = fileRows(assembly.baseline.files, sixPaths, 'baseline assembly');
  need(equal(assembly.baseline.files, baselineDelivery.files), 'baseline delivery six original rows/order changed');
  fileRows(baselineDelivery.files, sixPaths, 'baseline native delivery');
  const candidateFiles = fileRows(assembly.candidate.files, sixPaths, 'candidate assembly');
  const nativePaths = ['src/planner.ts', 'src/planner-derived-codecs.ts', 'DESIGN.md', 'MANIFEST.json'];
  const nativeFiles = fileRows(sourceDelivery.files, nativePaths, 'R2 native four-output delivery');
  for (const [id, root, files] of [['baselinePlanner', BASELINE_FROZEN, baselineFiles], ['frozenPlanner', FROZEN, candidateFiles]]) {
    const expected = [...files.map(f => ({ path: f.path, type: 'file', bytes: f.bytes, sha256: f.sha256 })), { path: 'src', type: 'directory' }]
      .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    need(equal(closed.find(t => t.id === id).entries, expected), 'exact six-file/one-directory closed tree required: ' + id);
    for (const f of files) requireTreeFile(id, root + '/' + f.path, requiredPin(root + '/' + f.path, f));
  }
  need(Array.isArray(assembly.candidate.sources) && assembly.candidate.sources.length === 6, 'six native assembly provenance rows required');
  const assemblySeen = new Set();
  for (const f of assembly.candidate.sources) {
    need(f && equal(Object.keys(f).sort(), ['bytes', 'destination', 'path', 'sha256', 'source', 'sourceRole']), 'assembly source row fields');
    relative(f.destination);
    need(f.destination === f.path && !assemblySeen.has(f.destination.toLowerCase()), 'assembly destination mismatch/duplicate');
    assemblySeen.add(f.destination.toLowerCase());
    const fresh = nativePaths.includes(f.path);
    const origin = (fresh ? NATIVE_R2 : BASELINE_FROZEN) + '/' + f.path;
    const original = (fresh ? nativeFiles : baselineFiles).find(p => p.path === f.path);
    const destination = candidateFiles.find(p => p.path === f.destination);
    need(original && destination && f.source === origin &&
      f.sourceRole === (fresh ? 'new reviewed fixed-projection R2 native output' : 'unchanged qualified R1 auxiliary source') &&
      f.bytes === original.bytes && f.sha256 === original.sha256 &&
      f.bytes === destination.bytes && f.sha256 === destination.sha256, 'native assembly source/destination bytes disagree');
    requiredPin(origin, original);
    if (!fresh) requireTreeFile('baselinePlanner', origin, original);
  }
  // The old qualified candidate is the NEW baseline. The original RED pin law
  // below still applies to this R1 tree, never to new R2 source hashes.
  const baselineQualified = readJSON(BASELINE_QUALIFIED.path);
  const baselineReadback = readJSON(BASELINE_READBACK.path);
  need(baselineQualified.gate === 's1-r5-planner-isolated-r5-gate' && baselineQualified.qualified === true &&
    baselineQualified.main269GuardsUnchanged === true && baselineQualified.priorRedReceiptSha256 === RED_SHA, 'R1 qualified baseline receipt missing');
  need(baselineReadback.status === 'PLANNER_R1_FIXTURE_DIFFERENTIAL_SCOPED_QUALIFIED_NOT_S1_INTEGRATION' &&
    baselineReadback.gateReceiptSha256 === BASELINE_QUALIFIED.sha256 && baselineReadback.typecheckExit === 0, 'qualified R1 parent readback binding');
  need(Array.isArray(baselineQualified.inputInventories) &&
    equal(baselineQualified.inputInventories.map(t => t.id), ['mainHarness', 'dependencies', 'frozenPlanner']), 'qualified R1 inventory ids/order');
  for (const t of baselineQualified.inputInventories) {
    const id = t.id === 'frozenPlanner' ? 'baselinePlanner' : t.id;
    const current = closed.find(p => p.id === id);
    need(current && t.root === current.root && equal(normalizedEntries(t.entries), current.entries), 'qualified R1 inventory differs: ' + id);
  }
  need(closed.find(t => t.id === 'dependencies').entries.length === 3716 &&
    closed.find(t => t.id === 'mainHarness').entries.some(e => e.path === 'node_modules' && e.type === 'directory'), 'separate closed dependency mount required');
  need(Array.isArray(baselineQualified.snapshotProofs), 'qualified R1 snapshot proofs missing');
  const qualifiedSnapshot = baselineQualified.snapshotProofs.find(p => p.side === 'candidate');
  need(qualifiedSnapshot && qualifiedSnapshot.root === baselineQualified.scratch + '/snapshots/candidate' && Array.isArray(qualifiedSnapshot.entries), 'qualified R1 candidate snapshot missing');
  for (const p of baselineFiles.filter(f => FOUR.includes(f.path))) {
    const e = qualifiedSnapshot.entries.find(e => e.path === 'tools/ff8-harness/' + p.path && e.type === 'file');
    need(e && e.bytes === p.bytes && e.sha256 === p.sha256, 'qualified baseline FOUR differs from actual R1 candidate snapshot');
  }
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
  for (const f of baselineFiles) originalPin(BASELINE_FROZEN + '/' + f.path, requireTreeFile('baselinePlanner', BASELINE_FROZEN + '/' + f.path));
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
  for (const pin of TEST_PINS) requireTreeFile('mainHarness', HARNESS + '/' + pin.path, pin);
  // Bound every approved control JSON BEFORE any compiler or test child.
  for (const pin of approvedPins.values()) if (/\.json$/i.test(pin.path)) need(pin.bytes <= LIMITS.controlBytes, 'approved control JSON exceeds cap: ' + pin.path);
  need(!Object.keys(process.env).some(k => /^(BUN|NODE)/i.test(k)), 'parent gate runtime inherited BUN*/NODE* environment');
  const systemEnvironment = adjudication.systemEnvironment;
  need(systemEnvironment && equal(Object.keys(systemEnvironment).sort(), ['SystemRoot', 'WINDIR']), 'system whitelist must be exactly SystemRoot/WINDIR');
  for (const [name, value] of Object.entries(systemEnvironment)) need(typeof value === 'string' && path.isAbsolute(value) && key(value) === key('C:/Windows') && key(process.env[name] || '') === key(value), 'unexpected approved Windows system root');
  rejectGlobalConfigs('before-preparation');
  prepare(prior, assembly, pkg);
  verifyInputs('after-preparation');
  checkScratch('prepared');
  rejectGlobalConfigs('after-preparation');
  const tsc = run('candidate-typecheck', compiler.node, [compiler.argv[0], '--noEmit', '-p', scratch + '/snapshots/candidate/tools/ff8-harness/tsconfig.gate-r5.json', '--typeRoots', DEPS + '/@types', '--listFiles'], 'snapshots/candidate', false, systemEnvironment);
  listedFiles = listFilesProof(tsc.stdout, tsc.stderr);
  for (const side of ['baseline', 'candidate']) {
    activate(side);
    run(side + '-planner-lineage', prior.bun.path, [
      'test', '--no-env-file', '--config=' + scratch + '/active/bunfig.toml',
      '--max-concurrency', '1', '--timeout', '15000', './test/planner.test.ts', './test/lineage.test.ts',
    ], 'active', true, systemEnvironment);
    if (side === 'baseline') archiveBaseline();
  }
  need(runs[1].exe === runs[2].exe && runs[1].cwd === runs[2].cwd && equal(runs[1].argv, runs[2].argv) &&
    equal(runs[1].environment, runs[2].environment), 'runtime pathname/argv/environment identity failed');
  const a = parseTrace('archive-baseline');
  const b = parseTrace('active');
  const traceComparison = compareFilesExact(scratch + '/archive-baseline/planner-full-trace.jsonl', scratch + '/active/planner-full-trace.jsonl', LIMITS);
  const footerComparison = compareFilesExact(scratch + '/archive-baseline/planner-full-meta.json', scratch + '/active/planner-full-meta.json', LIMITS);
  need(traceComparison.left.sha256 === a.trace.sha256 && traceComparison.left.bytes === a.trace.bytes &&
    traceComparison.right.sha256 === b.trace.sha256 && traceComparison.right.bytes === b.trace.bytes &&
    footerComparison.left.sha256 === a.footer.sha256 && footerComparison.left.bytes === a.footer.bytes &&
    footerComparison.right.sha256 === b.footer.sha256 && footerComparison.right.bytes === b.footer.bytes, 'stream scan/comparison pins drifted');
  differential = {
    baseline: a, candidate: b, fullBytesEqual: traceComparison.equal,
    footerBytesEqual: footerComparison.equal, traceComparison, footerComparison,
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
    if (approvalRecord && closed.length === 4) {
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
      limits: LIMITS, diskBudget, snapshotProofs, phaseProofs, instrumentationProofs,
      main269GuardsUnchanged: guardsUnchanged, qualified,
      priorRedReceiptSha256: RED_SHA, globalConfigChecks, checkpoints,
      runnerState, knownInactive, allArtifactsRetained: true,
      scope: 'planner fixture equivalence only; no universal proof/numeric/main integration/S1 repin/native/full44',
    };
    let receiptWritten = false;
    let receiptPin = null;
    try {
      const receiptText = JSON.stringify(receipt, null, 2) + '\n';
      need(Buffer.byteLength(receiptText) <= LIMITS.controlBytes, 'receipt control JSON cap');
      fs.writeFileSync(paths.receipt, receiptText, { flag: 'wx' });
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
