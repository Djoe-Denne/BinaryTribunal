import { compareText } from "./validation";

/** Function keys order by module hash, then numeric RVA, never locale or hex text. */
export function compareFunctionIds(a: string, b: string): number {
  const i = a.lastIndexOf(":"), j = b.lastIndexOf(":");
  const x = a.slice(i + 1), y = b.slice(j + 1);
  if (/^0x[0-9A-F]+$/i.test(x) && /^0x[0-9A-F]+$/i.test(y)) {
    const module = compareText(a.slice(0, i), b.slice(0, j));
    if (module) return module;
    const n = BigInt(x), m = BigInt(y);
    return n < m ? -1 : n > m ? 1 : 0;
  }
  return compareText(a, b);
}
