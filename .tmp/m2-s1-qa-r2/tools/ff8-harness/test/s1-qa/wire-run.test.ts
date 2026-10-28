import { test, expect } from 'bun:test';
import { assertExecutionJsonV1 as assertJson, canonicalExecutionJsonV1 as canonical,
  executionValueRefV1 as valueRef, makeBoundDocumentV1 as doc, makeBoundBytesV1 as raw,
  parseExecutionEnvelopeV1 as parse, parseGraphRunV3 as parseRun,
  inspectExecutionEnvelopeV1 as inspect } from '../../src/graph-execution-envelope';
import type { IndependentlyLoadedSourcesV1 } from '../../src/graph-execution-envelope';
import { bytes, sha, vectors } from './oracle/wire';

for (const [i, v] of vectors.entries()) test(`W1.C1.${i} literal canonical vector`, () => {
  const before = JSON.stringify(v.value);
  expect(canonical(v.value)).toBe(v.canonical);
  expect(JSON.stringify(v.value)).toBe(before);
  const domain = '{"kind":"qa-vector","value":' + v.canonical + '}';
  expect(valueRef('qa-vector', v.value)).toEqual({ kind: 'qa-vector', codec: 'l8-json-c14n-v1', sha256: sha(domain) });
  expect(doc('qa-vector', v.value)).toEqual({ ref: { kind: 'qa-vector', encoding: 'utf8-json-v1', byteLength: bytes(v.canonical).length, sha256: sha(v.canonical) }, utf8: v.canonical });
});

test('W1.UTF8 raw seven-byte vector owns input and freezes output', () => {
  const input = bytes('Aé😀');
  expect(input.length).toBe(7);
  const got = raw('qa-bytes', input);
  expect(got).toEqual({ ref: { kind: 'qa-bytes', encoding: 'raw-v1', byteLength: 7, sha256: sha('Aé😀') }, base64: 'QcOp8J+YgA==' });
  input.fill(0);
  expect(got.base64).toBe('QcOp8J+YgA==');
  expect(Object.isFrozen(got)).toBe(true);
  expect(Object.isFrozen(got.ref)).toBe(true);
});

const invalid: Array<[string, unknown]> = [
  ['negative zero', -0], ['infinity', Infinity], ['NaN', NaN], ['undefined', undefined],
  ['bigint', 1n], ['function', () => 1], ['symbol', Symbol('x')],
  ['high surrogate', '\ud800'], ['low surrogate', '\udc00'],
  ['date prototype', new Date(0)], ['null prototype', Object.create(null)],
  ['sparse array', new Array(2)], ['proxy', new Proxy({}, {})],
  ['hidden property', Object.defineProperty({}, 'x', { value: 1 })],
  ['symbol key', { [Symbol('x')]: 1 }], ['invalid key', { ['\ud800']: 1 }],
];
const cyclic: Record<string, unknown> = {}; cyclic.x = cyclic; invalid.push(['cycle', cyclic]);
for (const [name, v] of invalid) test(`W1.reject.${name}`, () => {
  expect(() => assertJson(v)).toThrow();
  expect(() => canonical(v)).toThrow();
  expect(() => valueRef('qa-vector', v)).toThrow();
  expect(() => doc('qa-vector', v)).toThrow();
});
test('W1.accessor rejected without running getter', () => {
  let reads = 0;
  const v = Object.defineProperty({}, 'x', { enumerable: true, get() { reads++; return 1; } });
  expect(() => canonical(v)).toThrow(); expect(reads).toBe(0);
});
test('W1.valid finite noninteger and repeated noncyclic reference remain valid', () => {
  const shared = { x: 0.25 };
  expect(canonical([shared, shared])).toBe('[{"x":0.25},{"x":0.25}]');
  expect(canonical(Number.MAX_VALUE)).toBe('1.7976931348623157e+308');
});
test('W1.domain separation and Unicode not normalized', () => {
  expect(valueRef('qa-vector', { b: 2, a: 1 }).sha256).not.toBe(sha('{"b":2,"a":1}'));
  expect(valueRef('one', 1).sha256).not.toBe(valueRef('two', 1).sha256);
  expect(doc('qa-vector', 'é').ref.sha256).not.toBe(doc('qa-vector', 'e\u0301').ref.sha256);
});
for (const [name, input, reason] of [
  ['duplicate escaped key', bytes('{"a":1,"\\u0061":2}'), 'duplicate JSON key'],
  ['nested duplicate', bytes('{"x":{"a":1,"a":2}}'), 'duplicate JSON key'],
  ['BOM', Uint8Array.from([239,187,191,123,125]), 'BOM'],
  ['escaped isolated surrogate', bytes('{"x":"\\ud800"}'), 'surrogate'],
] as const) test(`W1.parse.${name}`, () => {
  for (const result of [parse(input), parseRun(input)]) {
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(';')).toContain(reason);
  }
});
test('W1.malformed UTF8 produces refusal not success/throw', () => {
  expect(parse(Uint8Array.from([0xc0, 0xaf])).ok).toBe(false);
  expect(parseRun(Uint8Array.from([0xc0, 0xaf])).ok).toBe(false);
});
test('W2.malformed inspection never establishes authority', () => {
  const got = inspect(bytes('{}'), {} as IndependentlyLoadedSourcesV1);
  expect(got.shape).toBe(false); expect(got.coherent).toBe(false);
  expect(got.authorityVerified).toBe(false); expect(got.activationState).toBe('not-established');
});
