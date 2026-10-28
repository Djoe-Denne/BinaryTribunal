# PRODUCE C — volet B — g20 / 0x5083C0 (sub_5083C0)

- Mission: ff8-decomp-semantics-20261011-r01, run01. Task `task_mv44sji2_00ca_gzv6u2` (2+1, author **B**).
- Producer fork base: frozen explorer session `ses_ed41fbd48ffe9q3GtpL36cJoVY` (read-only factual reader, g20).
- Independence: no read of c_a.md, no sibling productions, no other-volet output, no target ledger, no result index, no other session. No IDB, no Git write, no live, no delegation.
- Author role: mechanical decompilation only. **No semantic verdict, no purpose claim.** `sub_5083C0` is a label-only name (freeze field `name_label_only`), not evidence of purpose.

## 1. Ground truth (frozen evidence, hash-cited)

Freeze file: `.tmp/ff8-decomp-semantics-20261011-r01/native/0x5083C0.json`

| Field | Value |
|---|---|
| `native.input` | `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe` |
| `native.input_sha256` | `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` |
| `native.bits` | 32 |
| `native.exported_utc` | `2026-10-11T16:38:25.140966+00:00` |
| `ea` | `0x5083C0` ; `name_label_only` = `sub_5083C0` |
| `chunks` | exactly 1: `0x5083c0`–`0x5083e8` (0x28 = 40 bytes) |
| `chunks[0].hex` | `8b5424045633c90fbf720e8b42085785f67e10f60001740d0fbf7a0c03c7413bce7cf033c05f5ec3` |
| `instruction_count` | 19 |
| `code_targets` | `[]` → leaf function, no callee of any kind |
| `xrefs_to` | `0x508367` (in fn `0x508360`), type 17, iscode; `0x5083f6` (in fn `0x5083f0`), type 17, iscode |
| `cfg` | 5 blocks: `5083c0-5083d3`, `5083d3-5083d8`, `5083d8-5083e3`, `5083e3-5083e5`, `5083e5-5083e8` |

## 2. Byte-level decode (my verification of `chunks[0].hex`, 1:1 with the freeze `assembly` field)

| Addr | Bytes | Mnemonic | Note |
|---|---|---|---|
| 005083C0 | 8B 54 24 04 | `mov edx, [esp+arg_0]` | arg_0 = +4 at entry (pre-push) = first stack arg |
| 005083C4 | 56 | `push esi` | callee-save |
| 005083C5 | 33 C9 | `xor ecx, ecx` | counter i = 0 |
| 005083C7 | 0F BF 72 0E | `movsx esi, word ptr [edx+0Eh]` | int16 sign-extended, read ONCE |
| 005083CB | 8B 42 08 | `mov eax, [edx+8]` | dword load, ALWAYS executes |
| 005083CE | 57 | `push edi` | callee-save |
| 005083CF | 85 F6 | `test esi, esi` | signed test |
| 005083D1 | 7E 10 | `jle short 0x5083E3` | 0x5083D3 + 0x10 = 0x5083E3 ✓ |
| 005083D3 | F6 00 01 | `test byte ptr [eax], 1` | 1-byte deref at current pointer |
| 005083D6 | 74 0D | `jz short 0x5083E5` | 0x5083D8 + 0x0D = 0x5083E5 ✓ (exit with eax = current p) |
| 005083D8 | 0F BF 7A 0C | `movsx edi, word ptr [edx+0Ch]` | int16 sign-extended, RE-READ each iteration |
| 005083DC | 03 C7 | `add eax, edi` | 32-bit wraparound add |
| 005083DE | 41 | `inc ecx` | |
| 005083DF | 3B CE | `cmp ecx, esi` | signed compare |
| 005083E1 | 7C F0 | `jl short 0x5083D3` | 0x5083E3 − 0x10 = 0x5083D3 ✓ (loop) |
| 005083E3 | 33 C0 | `xor eax, eax` | return 0 |
| 005083E5 | 5F | `pop edi` | |
| 005083E6 | 5E | `pop esi` | |
| 005083E7 | C3 | `retn` | bare retn, no immediate |

Byte accounting: 4+1+2+4+3+1+2+2+3+2+4+2+1+2+2+2+1+1+1 = 40 = 0x28 = chunk size ✓; 19 instructions ✓. All jump displacements recomputed and match the freeze. No byte left unmapped; nothing invented.

## 3. Reconstructed C (complete, no callee, no library call)

Target model: i386, ILP32, `uint32_t`/`int16_t` exact widths (freeze `bits: 32`).

```c
#include <stdint.h>

/* Layout hypothesis: only offsets +0x08, +0x0C, +0x0E are FACTS (accessed here).
   +0x00..0x07 is never touched by THIS function; other fields unknown, not guessed. */
struct sub_5083C0_ctx {
    uint8_t  _unaccessed_00[8];  /* +0x00..0x07: not accessed by 0x5083C0        */
    uint32_t base_08;            /* +0x08: dword; used as a byte address          */
    int16_t  stride_0C;          /* +0x0C: signed word; re-read every iteration   */
    int16_t  count_0E;           /* +0x0E: signed word; read once before the loop */
};

/* 0x5083C0..0x5083E8 — 19 instructions, 1 chunk, leaf, no callee. */
/* Names are positional-mechanical, not semantic. */
void *sub_5083C0(struct sub_5083C0_ctx *ctx /* = [esp+arg_0] at entry */)
{
    uint32_t p;   /* eax: walked address, 32-bit wraparound */
    int16_t  n;   /* esi: loop bound                        */
    int32_t  i;   /* ecx: iteration counter                 */

    i = 0;                            /* 005083C5 xor ecx, ecx            */
    n = ctx->count_0E;                /* 005083C7 movsx esi, [edx+0Eh]    */
    p = ctx->base_08;                 /* 005083CB mov eax, [edx+8]        */

    if (n > 0) {                      /* 005083CF test esi, esi           */
        do {                          /* 005083D1 jle 0x5083E3            */
            if ((*(const uint8_t *)(uintptr_t)p & 1u) == 0u)
                return (void *)(uintptr_t)p;   /* 005083D3 test byte [eax],1 */
                                              /* 005083D6 jz 0x5083E5 (eax=p) */
            /* Freeze-faithful: stride is loaded from memory INSIDE the loop
               (005083D8 is in the loop body). Sign-extended, then added with
               32-bit wraparound (005083DC add eax, edi).                    */
            p += (uint32_t)(int32_t)ctx->stride_0C;   /* 005083D8/DC */
            i++;                                       /* 005083DE    */
        } while (i < n);              /* 005083DF cmp ecx, esi            */
                                      /* 005083E1 jl 0x5083D3             */
    }
    return (void *)(uintptr_t)0;      /* 005083E3 xor eax, eax            */
}
/* 005083E5 pop edi / 005083E6 pop esi / 005083E7 retn — epilogue. */
```

Mechanical behavior (restatement of the ASM, not a purpose claim): with `n = (int16)[ctx+0E]`, `p0 = [ctx+08]`, `s = (int16)[ctx+0C]`:
- `n <= 0` → return 0. The dword load at +0x08 still executes, but **no dereference occurs** (no `[eax]` access) — a `n <= 0` call never faults on `p0`.
- Otherwise, for k = 0..n−1: if `(byte at p0 + k*s) & 1 == 0` → return `p0 + k*s` (the value of `eax` at the moment of the `jz`, i.e. the pointer to the element whose first byte has bit 0 clear). If all n tested bytes have bit 0 set → return 0.

## 4. ABI / registers / stack (facts from the freeze)

| Item | Fact |
|---|---|
| Return | `eax` (32-bit): either a walked pointer value `p0 + k*s` (k in [0, n−1]) or 0 |
| Clobbered | `eax`, `ecx` (counter, zeroed internally), `edx` (arg pointer), flags |
| Saved/restored | `esi` (push 005083C4 / pop 005083E6), `edi` (push 005083CE / pop 005083E5) |
| Frame pointer | `ebp` untouched; no frame |
| Stack balance | net 0 at `retn`; only the two transient 4-byte saves |
| Args | only `[esp+arg_0]` (+4) is read; nothing else on the stack is accessed by this body |
| Callconv | bare `retn` (no immediate) with a stack arg read → caller cleans args → **`__cdecl` inferred** |
| Callees | none (`code_targets: []`); no library call, no import, no FP |
| Chunks | exactly one (0x5083C0–0x5083E8); no tail/duplicate chunks |

## 5. Widths / signedness / overflow / wrap — checked

- `[edx+0Eh]` and `[edx+0Ch]` are **16-bit, sign-extended** (`movsx`) → both fields are signed int16 in C terms. Range of n after movsx: [−32768, 32767]; `jle`/`jl` are signed tests, matching `int16_t`/`int32_t` in C.
- `add eax, edi` is 32-bit two's-complement addition → modeled as `p += (uint32_t)(int32_t)s` with defined wraparound at 2^32. A negative `s` makes `eax` move backward — arithmetic fact, purpose unknown.
- Counter `ecx` max value = n ≤ 32767 → no counter overflow.
- Deref is exactly 1 byte (`test byte ptr [eax], 1`): reads bit 0 of the byte at the current pointer; no word/dword deref.
- `xor eax, eax` produces the full 32-bit 0 (upper half of rAX irrelevant on i386).

## 6. Freeze-fidelity notes (deliberate choices)

- **Stride re-read per iteration**: the freeze loads `[edx+0Ch]` inside the loop body (005083D8). My C re-reads `ctx->stride_0C` inside the loop rather than hoisting it. Equivalent under single-threaded execution; I kept the re-read to match the freeze exactly.
- **Count read once** (005083C7, before the test) — kept.
- **`[edx+8]` load always executes**, even when `n <= 0` (005083CB precedes 005083CF) — kept as a plain field read; the deref is the only faulting access and it is loop-gated.
- Return type `void *`: chosen because field +0x08 is dereferenced as a byte address and returned unmodified (plus strides). If callers treat the result as an integer, that is ABI-identical on i386; caller typing was not examined (see §7).

## 7. Uncertainties (flagged, not repaired by intuition)

1. **Caller evidence missing this session**: direct reads of the two callers' frozen packets (`0x508360.json` for call site `0x508367`, `0x5083F0.json` for call site `0x5083F6`) were attempted and **denied by session permissions**. Therefore: number of stack args pushed at the call sites, and whether the caller cleans the stack, are **unverified**. `__cdecl` remains an inference from bare `retn` + a stack-arg read (a `__stdcall` 1-arg function would end in `retn 4`). Both `xrefs_to` entries are type 17 (near call), iscode — that part is frozen fact.
2. **Single-arg signature presumed** from the body reading only `[esp+arg_0]`; extra ignored args would be invisible in this body.
3. **Struct layout beyond +0x08/+0x0C/+0x0E is unknown**; +0x00..0x07 filler is a placeholder for unaccessed bytes, not a claim about real fields. Other functions may access other offsets of the same object; not examined.
4. **No semantic purpose asserted**: bit-0-of-first-byte testing and striding are mechanics; any interpretation (flags, records, iteration over entries) is out of scope for this volet.
5. **Label name** `sub_5083C0` is `name_label_only` — no meaning.
6. **No COMMON_COMPACTION artifact was consumed**: my fork inherited the frozen native packet and CONTRACT.md, but no finalized compaction was present in the inherited context; base = raw freeze. Flagged for lead awareness in case the compaction adds frozen surrounding facts.

## 8. Non-goals and validation status (honest)

- Not done here: compilation, assembly-diff/back-compile, objdump comparison, §5.6 validation, semantic classification, reconciliation, any test. **No test executed, none claimed.** Compile/diff validation belongs to the lead or a separately authorized reviewer (CONTRACT.md `docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md` lines 16–21: explorer/producer/reconciliation separation; line 11: no worker mutations).
- GrepAI/QMD were **not** consulted: the Code Mode catalog in this session carries no file/code search tool and no MCP servers; additionally, avoiding external knowledge keeps this fork strictly freeze-derived. No engine-mechanics claim in this document needs wiki evidence.
- Coverage: 19/19 instructions, 5/5 CFG blocks, 1/1 chunk mapped to C. No unreachable reconstructed code.
