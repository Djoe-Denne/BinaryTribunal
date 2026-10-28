import { createHash } from 'node:crypto';
export const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);
export const sha = (s: string | Uint8Array): string => createHash('sha256').update(s).digest('hex');
// JSON-only fixture encoder implementing the published C1 ordering, not a SUT call.
export function fixtureJson(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(fixtureJson).join(',') + ']';
  if (v !== null && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + fixtureJson(obj[k])).join(',') + '}';
  }
  const encoded = JSON.stringify(v);
  if (encoded === undefined) throw Error('non JSON fixture');
  return encoded;
}
// Independent literal wire vectors, not generated from SUT output.
export const vectors = [
  { value: { b: 2, a: 1 }, canonical: '{"a":1,"b":2}' },
  { value: { '10': 10, '2': 2 }, canonical: '{"10":10,"2":2}' },
  { value: { z: [2, 1], a: { y: true, x: null } }, canonical: '{"a":{"x":null,"y":true},"z":[2,1]}' },
  { value: { '\ue000': 1, '😀': 2 }, canonical: '{"😀":2,"":1}' },
  { value: 'Aé😀', canonical: '"Aé😀"' },
];
