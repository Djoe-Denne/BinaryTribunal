'use strict';
// Leaf only: importing this file performs no I/O, clock read, child or gate work.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const CAPS = Object.freeze({ chunkBytes: 1048576, traceBytes: 1073741824,
  pairBytes: 2147483648, recordBytes: 268435456, rows: 200000, calls: 100000,
  depth: 64, footerBytes: 65536, controlBytes: 16777216,
  workingBytes: 8388608, analysisMs: 600000 });
const budgets = new WeakMap();
function need(ok, why) { if (!ok) throw new Error('TRACE_STREAM: ' + why); }
function options(limits = CAPS) {
  need(limits !== null && typeof limits === 'object', 'limits object required');
  const o = {};
  for (const [k, max] of Object.entries(CAPS)) {
    const n = limits[k] === undefined ? max : limits[k];
    need(Number.isSafeInteger(n) && n > 0 && n <= max, 'invalid/relaxed cap ' + k);
    o[k] = n;
  }
  need(Object.keys(limits).every(k => Object.hasOwn(CAPS, k)), 'unknown limit');
  let budget = budgets.get(limits);
  if (!budget) {
    budget = { deadline: process.hrtime.bigint() + BigInt(o.analysisMs) * 1000000n };
    budgets.set(limits, budget);
  }
  o.check = () => need(process.hrtime.bigint() <= budget.deadline, 'shared analysis deadline');
  o.check();
  // Worst explicit reader allocation, including two compare buffers, bounded
  // call states, 64 parser frames and bounded token/header scratch. Not RSS.
  need(2 * o.chunkBytes + o.calls + 1 + 262144 <= o.workingBytes, 'reader working-state cap');
  return o;
}
class Reader {
  constructor(p, o, cap = Infinity) {
    this.o = o; this.cap = cap; this.path = path.resolve(p);
    need(!fs.lstatSync(p).isSymbolicLink(), 'file is link');
    this.fd = fs.openSync(p, 'r');
    try {
      this.before = fs.fstatSync(this.fd);
      need(this.before.isFile() && Number.isSafeInteger(this.before.size), 'not regular/safe-size file');
      need(this.before.size <= cap, 'file size cap');
      this.buffer = Buffer.allocUnsafe(o.chunkBytes);
      this.i = 0; this.n = 0; this.offset = 0; this.bytes = 0;
      this.eof = false; this.hash = crypto.createHash('sha256');
      this.rowStart = null; this.ticks = 65536;
    } catch (e) { fs.closeSync(this.fd); this.fd = null; throw e; }
  }
  fill() {
    if (this.i < this.n) return true;
    if (this.eof) return false;
    this.o.check();
    this.n = fs.readSync(this.fd, this.buffer, 0, this.buffer.length, null);
    this.i = 0;
    if (!this.n) { this.eof = true; return false; }
    this.bytes += this.n;
    need(Number.isSafeInteger(this.bytes) && this.bytes <= this.cap, 'actual file size cap');
    this.hash.update(this.buffer.subarray(0, this.n));
    return true; // A short read is NOT EOF.
  }
  peek() { return this.fill() ? this.buffer[this.i] : -1; }
  take() {
    const b = this.peek();
    need(b !== -1, 'unexpected EOF');
    ++this.i; ++this.offset;
    if (this.rowStart !== null) need(this.offset - this.rowStart <= this.o.recordBytes, 'record size cap');
    if (--this.ticks === 0) { this.o.check(); this.ticks = 65536; }
    return b;
  }
  finish() {
    need(this.eof && this.i === this.n, 'pin before both data and EOF consumed');
    const after = fs.fstatSync(this.fd);
    need(after.isFile() && after.size === this.bytes && this.before.size === this.bytes &&
      after.mtimeMs === this.before.mtimeMs && after.ctimeMs === this.before.ctimeMs &&
      after.ino === this.before.ino, 'file changed during read');
    this.o.check();
    return { path: this.path, bytes: this.bytes, sha256: this.hash.digest('hex') };
  }
  close() { if (this.fd !== null) { const fd = this.fd; this.fd = null; fs.closeSync(fd); } }
}
// This parser never retains a line, graph, DATA string or per-node object.
// Recursion is only JSON nesting (<=64), not graph/reference traversal.
class Parser {
  constructor(reader) { this.r = reader; this.depth = 0; }
  ws() { while ([9, 13, 32].includes(this.r.peek())) this.r.take(); }
  char(c) { this.ws(); need(this.r.take() === c.charCodeAt(0), 'expected ' + c); }
  enter(c) { this.char(c); need(++this.depth <= this.r.o.depth, 'JSON depth cap'); }
  leave(c) { this.char(c); --this.depth; }
  string(capture = false) {
    this.char('"');
    let s = '', small = capture;
    const add = cp => { if (small) { s += String.fromCodePoint(cp); if (s.length > 128) { s = ''; small = false; } } };
    const hex = () => {
      const b = this.r.take();
      if (b >= 48 && b <= 57) return b - 48;
      if (b >= 65 && b <= 70) return b - 55;
      if (b >= 97 && b <= 102) return b - 87;
      need(false, 'invalid JSON hex escape');
    };
    while (true) {
      const b = this.r.take();
      if (b === 34) return small ? s : null;
      need(b >= 32, 'unescaped control in JSON string');
      if (b === 92) {
        const e = this.r.take();
        const escapes = { 34: 34, 92: 92, 47: 47, 98: 8, 102: 12, 110: 10, 114: 13, 116: 9 };
        if (e === 117) add((hex() << 12) | (hex() << 8) | (hex() << 4) | hex());
        else { need(Object.hasOwn(escapes, e), 'invalid JSON escape'); add(escapes[e]); }
        // Escaped lone surrogates ARE legal JSON/JS string data. Raw UTF-8
        // surrogates, overlongs and out-of-range codepoints are NOT legal UTF-8.
      } else if (b < 128) add(b);
      else {
        let count, cp, lo = 128, hi = 191;
        if (b >= 194 && b <= 223) { count = 1; cp = b & 31; }
        else if (b >= 224 && b <= 239) { count = 2; cp = b & 15; if (b === 224) lo = 160; if (b === 237) hi = 159; }
        else if (b >= 240 && b <= 244) { count = 3; cp = b & 7; if (b === 240) lo = 144; if (b === 244) hi = 143; }
        else need(false, 'invalid UTF-8 lead');
        for (let i = 0; i < count; ++i) {
          const next = this.r.take();
          need(next >= (i ? 128 : lo) && next <= (i ? 191 : hi), 'invalid UTF-8 continuation/codepoint');
          cp = (cp << 6) | (next & 63);
        }
        add(cp);
      }
    }
  }
  literal(word, value) { this.ws(); for (const c of word) need(this.r.take() === c.charCodeAt(0), 'invalid literal'); return value; }
  boolean() { this.ws(); return this.r.peek() === 116 ? this.literal('true', true) : this.literal('false', false); }
  number() {
    this.ws(); let s = '';
    const digit = b => b >= 48 && b <= 57;
    const take = () => { need(s.length < 128, 'numeric header/token too long'); s += String.fromCharCode(this.r.take()); };
    if (this.r.peek() === 45) take();
    if (this.r.peek() === 48) take();
    else { need(this.r.peek() >= 49 && this.r.peek() <= 57, 'JSON integer grammar'); do { take(); } while (digit(this.r.peek())); }
    if (this.r.peek() === 46) { take(); need(digit(this.r.peek()), 'JSON fraction grammar'); do { take(); } while (digit(this.r.peek())); }
    if ([69, 101].includes(this.r.peek())) {
      take(); if ([43, 45].includes(this.r.peek())) take();
      need(digit(this.r.peek()), 'JSON exponent grammar'); do { take(); } while (digit(this.r.peek()));
    }
    return Number(s);
  }
  integer(min = 1, max = Number.MAX_SAFE_INTEGER) {
    const n = this.number(); need(Number.isSafeInteger(n) && n >= min && n <= max, 'integer domain'); return n;
  }
  object(fields) {
    this.enter('{'); let mask = 0;
    const names = Object.keys(fields);
    this.ws();
    if (this.r.peek() !== 125) while (true) {
      const name = this.string(true), i = names.indexOf(name);
      need(i >= 0 && !(mask & (1 << i)), 'unknown/duplicate/oversize object header');
      mask |= 1 << i; this.char(':'); fields[name](); this.ws();
      if (this.r.peek() !== 44) break;
      this.r.take(); // A trailing comma fails the next required key.
    }
    this.leave('}'); return { mask, all: (1 << names.length) - 1 };
  }
  array(item) {
    this.enter('['); let n = 0; this.ws();
    if (this.r.peek() !== 93) while (true) {
      item(n++); this.ws(); if (this.r.peek() !== 44) break; this.r.take();
    }
    this.leave(']'); return n;
  }
  // A bounded shape summary handles atom/map-pair ambiguity without depending
  // on object key order or retaining entries until node.kind is encountered.
  tupleValue() {
    this.ws(); const b = this.r.peek();
    if (b === 34) return { type: 'string', text: this.string(true), atom: true };
    if (b === 110) { this.literal('null', null); return { atom: true }; }
    if (b === 116 || b === 102) { this.boolean(); return { atom: true }; }
    if (b === 91) {
      let a, z;
      const n = this.array(i => { need(i < 2, 'atom/pair tuple length'); const v = this.tupleValue(); if (i === 0) a = v; else z = v; });
      const tag = a && a.type === 'string' ? a.text : null;
      const numeric = z && z.type === 'string' && z.text !== null &&
        (['-0', 'NaN', 'Infinity', '-Infinity'].includes(z.text) || String(Number(z.text)) === z.text);
      const atom = (n === 1 && tag === 'undefined') || (n === 2 &&
        ((tag === 'number' && numeric) || (tag === 'ref' && z.type === 'number' && Number.isSafeInteger(z.number) && z.number > 0)));
      return { atom: !!atom, pair: !!(n === 2 && a.atom && z.atom) };
    }
    if (b === 45 || (b >= 48 && b <= 57)) return { type: 'number', number: this.number(), atom: false };
    need(false, 'invalid atom/pair token');
  }
  atom() { need(this.tupleValue().atom, 'invalid atom shape'); }
  property() {
    const n = this.array(i => {
      need(i < 5, 'property tuple length');
      if (i === 0) this.string(); else if (i < 4) this.boolean(); else this.atom();
    });
    need(n === 5, 'property tuple length');
  }
  node() {
    let kind, entriesMask = 3;
    const result = this.object({
      id: () => this.integer(), kind: () => { kind = this.string(true); },
      extensible: () => this.boolean(), properties: () => this.array(() => this.property()),
      entries: () => this.array(() => { const v = this.tupleValue(); entriesMask &= (v.atom ? 1 : 0) | (v.pair ? 2 : 0); }),
      prototype: () => {
        const n = this.array(i => {
          need(i < 2, 'prototype RefAtom tuple length');
          if (i === 0) need(this.string(true) === 'ref', 'prototype RefAtom tag');
          else this.integer();
        });
        need(n === 2, 'prototype RefAtom tuple length');
      },
    });
    const kinds = ['object', 'null-object', 'object:prototype', 'array', 'map', 'set', 'error:Error', 'error:EvalError',
      'error:RangeError', 'error:ReferenceError', 'error:SyntaxError', 'error:TypeError', 'error:URIError', 'error:AggregateError'];
    need(kinds.includes(kind), 'node kind');
    const hasEntries = !!(result.mask & 0x10), hasPrototype = !!(result.mask & 0x20);
    const expected = kind === 'object:prototype' ? 0x2f : kind === 'map' || kind === 'set' ? 0x1f : 0x0f;
    need(result.mask === expected && hasPrototype === (kind === 'object:prototype'), 'node closed fields/entries/prototype');
    if (hasEntries) need(entriesMask & (kind === 'map' ? 2 : 1), 'Map/Set entry shape');
  }
  graph() {
    let roots;
    const f = this.object({ roots: () => { roots = this.array(() => this.atom()); }, nodes: () => this.array(() => this.node()) });
    need(f.mask === f.all, 'graph closed fields'); return roots;
  }
  row() {
    let kind, id, name, roots;
    const f = this.object({ kind: () => { kind = this.string(true); }, id: () => { id = this.integer(1, this.r.o.calls); },
      name: () => { name = this.string(true); }, value: () => { roots = this.graph(); } });
    need(f.mask === f.all, 'row closed fields');
    this.ws(); need(this.r.take() === 10, 'JSONL requires one LF per row');
    return { kind, id, name, roots };
  }
}
function hashFile(p, limits) {
  const o = options(limits), r = new Reader(p, o);
  try { while (r.fill()) { r.offset += r.n - r.i; r.i = r.n; } return r.finish(); }
  finally { r.close(); }
}
function scanTrace(p, limits) {
  const o = options(limits), r = new Reader(p, o, o.traceBytes);
  try {
    const parser = new Parser(r), states = new Uint8Array(o.calls + 1);
    const counts = { BEGIN: 0, RETURN: 0, THROW: 0 };
    const methodCounts = { planMission: 0, compareGranularities: 0 };
    let rows = 0, maxRecordBytes = 0;
    while (r.peek() !== -1) {
      need(rows < o.rows, 'row count cap'); r.rowStart = r.offset;
      const row = parser.row(); ++rows;
      maxRecordBytes = Math.max(maxRecordBytes, r.offset - r.rowStart); r.rowStart = null;
      const method = row.name === 'planMission' ? 1 : row.name === 'compareGranularities' ? 2 : 0;
      need(method && Object.hasOwn(counts, row.kind), 'method/BEGIN/terminal closed header');
      if (row.kind === 'BEGIN') {
        need(row.id === counts.BEGIN + 1 && states[row.id] === 0 && row.roots === 1, 'contiguous unique BEGIN/roots');
        states[row.id] = method; ++methodCounts[row.name];
      } else {
        need(states[row.id] === method && row.roots === 2, 'orphan/duplicate/mismatched terminal/roots');
        states[row.id] |= row.kind === 'RETURN' ? 4 : 8;
      }
      ++counts[row.kind];
    }
    const completed = counts.RETURN + counts.THROW;
    need(rows > 0 && completed === counts.BEGIN, 'BEGIN-terminal count totality');
    for (let id = 1; id <= counts.BEGIN; ++id) need(states[id] & 12, 'missing terminal');
    need(counts.THROW > 0 && methodCounts.planMission > 0 && methodCounts.compareGranularities > 0, 'refusal/method coverage');
    return { trace: r.finish(), rows, maxRecordBytes, counts, methodCounts,
      issued: counts.BEGIN, completed, totality: true, strictUtf8: true, grammarAndShape: true };
  } finally { r.close(); }
}
function readFooter(p, limits) {
  const o = options(limits), r = new Reader(p, o, o.footerBytes);
  try {
    const parser = new Parser(r);
    const footer = {};
    const f = parser.object({ schema: () => { footer.schema = parser.string(true); },
      finalized: () => { footer.finalized = parser.boolean(); },
      issued: () => { footer.issued = parser.integer(0, o.calls); },
      completed: () => { footer.completed = parser.integer(0, o.calls); },
      fatal: () => { need(parser.array(() => need(false, 'fatal private footer')) === 0, 'fatal private footer'); footer.fatal = []; },
      finalizedBy: () => { footer.finalizedBy = parser.string(true); } });
    need(f.mask === f.all, 'footer closed fields');
    parser.ws(); need(r.take() === 10 && r.peek() === -1, 'footer LF/unique totality');
    need(footer.schema === 'planner-full-trace-r5' && footer.finalized === true &&
      ['afterAll', 'exit'].includes(footer.finalizedBy), 'footer schema/finalization');
    return { pin: r.finish(), ...footer };
  } finally { r.close(); }
}
function compareFilesExact(left, right, limits) {
  const o = options(limits), a = new Reader(left, o, o.traceBytes);
  let b;
  try {
    b = new Reader(right, o, o.traceBytes);
    need(a.before.size + b.before.size <= o.pairBytes, 'pair size cap');
    let offset = 0, firstDifference = null;
    let windowsCompared = 0, unequalWindows = 0, comparedAlignedBytes = 0, trailingUnpairedBytes = 0;
    while (true) {
      const ah = a.fill(), bh = b.fill();
      need(a.bytes + b.bytes <= o.pairBytes, 'actual pair size cap');
      if (!ah && !bh) break;
      const an = ah ? a.n - a.i : 0, bn = bh ? b.n - b.i : 0;
      const n = an && bn ? Math.min(an, bn) : an || bn;
      if (an && bn) {
        // Never skip a later aligned comparison after finding an earlier diff.
        const sameWindow = a.buffer.subarray(a.i, a.i + n).equals(b.buffer.subarray(b.i, b.i + n));
        ++windowsCompared;
        comparedAlignedBytes += n;
        if (!sameWindow) {
          ++unequalWindows;
          if (firstDifference === null) {
            let j = 0; while (j < n && a.buffer[a.i + j] === b.buffer[b.i + j]) ++j;
            firstDifference = offset + j;
          }
        }
      } else {
        trailingUnpairedBytes += n; // Read/hash the real tail, no fake buffer.
        if (firstDifference === null) firstDifference = offset;
      }
      if (an) { a.i += n; a.offset += n; }
      if (bn) { b.i += n; b.offset += n; }
      offset += n;
    }
    need(windowsCompared <= comparedAlignedBytes && unequalWindows <= windowsCompared &&
      comparedAlignedBytes <= o.traceBytes && trailingUnpairedBytes <= o.pairBytes &&
      2 * comparedAlignedBytes + trailingUnpairedBytes === a.bytes + b.bytes, 'comparison coverage accounting');
    return { left: a.finish(), right: b.finish(), equal: firstDifference === null,
      firstDifference, fullComparison: true, bothEOF: true, pairBytes: a.bytes + b.bytes,
      windowsCompared, unequalWindows, comparedAlignedBytes, trailingUnpairedBytes };
  } finally { try { if (b) b.close(); } finally { a.close(); } }
}
function validateCapture(summary, footer) {
  need(summary && summary.totality === true && summary.strictUtf8 === true && summary.grammarAndShape === true, 'unvalidated trace summary');
  need(footer && footer.schema === 'planner-full-trace-r5' && footer.finalized === true && footer.finalizedBy === 'afterAll' &&
    Array.isArray(footer.fatal) && footer.fatal.length === 0, 'private afterAll footer required');
  need(Number.isSafeInteger(footer.issued) && footer.issued >= 10 && footer.issued <= CAPS.calls &&
    footer.issued === footer.completed && footer.issued === summary.issued && footer.completed === summary.completed &&
    summary.counts.BEGIN === footer.issued && summary.counts.RETURN + summary.counts.THROW === footer.completed &&
    summary.counts.THROW > 0 && summary.methodCounts.planMission > 0 && summary.methodCounts.compareGranularities > 0, 'independent footer/count/coverage binding');
  return { ...summary, footer: footer.pin, finalizedBy: footer.finalizedBy, fatal: [], totality: true };
}
module.exports = { hashFile, scanTrace, readFooter, compareFilesExact, validateCapture };
