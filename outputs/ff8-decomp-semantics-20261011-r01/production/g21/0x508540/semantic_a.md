# Semantic A — `0x508540`

- Mission: `ff8-decomp-semantics-20261011-r01`
- Group: `g21`
- EA: `0x508540`
- Volet: `semantic_a` (independent; no peer volets)
- Factual reader: `ses_ed41fba20ffexCPkkuwhhXozTE` (projected discovery only)
- Producer: `pool-233`
- Native label `sub_508540` is a locator, not evidence of purpose.

This note states two behavior claims and one open point. It does not reconstruct target C.

## Claim 1 — Boolean predicate, three inputs, no stores

`0x508540` is a short callee (`size 0x3C` in the frozen native packet) that returns a boolean in `AL`.

Calling shape from the packet:

- `ECX`: pointer to a structure (this-like first object).
- Stack argument at `+4`: second pointer or value consumed by the same guard chain.
- Stack argument at `+8`: third input.
- Return: `AL` set or cleared. No memory writes are part of the function body.

The body is a guard chain. Failure of any check returns false. All checks passing returns true. It does not call other functions.

## Claim 2 — Guard chain walks fixed structure offsets

The true path requires a chain of field tests on the `ECX` object and on a pointer reached from it. Offsets named by the frozen packet and the g21 reader, not by the IDA name:

| Step | Access | Role in the predicate |
| --- | --- | --- |
| 1 | byte/field at `+0x00` | early reject |
| 2 | byte/field at `+0x05` | early reject |
| 3 | field at `+0x08` | early reject or pointer validity |
| 4 | pointer at `+0x74`, then field at `+0x2C` of that child | final relation against an input |

The third stack input participates in the comparison that uses the child field at `+0x2C`. Exact compare operator (equality vs masked test) is fixed by the instructions in `.tmp/ff8-decomp-semantics-20261011-r01/native/0x508540.json`; this volet does not rename that operator.

Callers recorded for this EA, all outside the 98-EA mission set: `0x502F30`, `0x5044B0`, `0x508580`, `0x50ADE0`, `0x50BD00`, `0x50BD80`. Sibling wrappers `0x50AE00` and `0x50AE20` are separate EAs in g21; they are not this function’s body.

## Open point

Whether `+0x00`, `+0x05`, and `+0x08` are flags on the same struct as `+0x74`, or whether one of those early loads is a null/type tag that changes which object the later offsets belong to, is not settled by the xref list alone. The packet’s instruction sequence is the authority. Xref “type” strings in the native JSON were flagged by the reader as interpretive, not as a second disassembly.

Historical names and any earlier decomp comments that assign a gameplay noun (menu, battle, card, and so on) to this predicate are unvalidated and are not used here.

## Evidence boundary

- Primary: `.tmp/ff8-decomp-semantics-20261011-r01/native/0x508540.json` as read by `ses_ed41fba20ffexCPkkuwhhXozTE`.
- Group ownership: `native-groups.json` entry g21 includes `0x508540`.
- This file was written without opening other volets, peer messages, IDA, Git, or live process state.
- Packet `sha256` was not recomputed in this producer turn.
