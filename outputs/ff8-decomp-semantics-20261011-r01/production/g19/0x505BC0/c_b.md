# C B — 0x00505BC0

Author: `pool-223`. Task: `task_mv44sj60_00c4_g37b93`. Independent production;
no other producer output, target C, target ledger, or result index consulted.

## Frozen inputs and scope

- `inputs/ff8-decomp-semantics-20261011-r01/g19/0x505BC0.json`, lines 1–72.
  Packet SHA-256, as supplied in `0x505BC0.readable/manifest.json:4`:
  `d41fd7e1ce633cfa43a0062dff38b5a3ed45d7a18a7f9d80b71f2e9a7692b22e`.
- Same directory: `common-compaction.md`, lines 1–54. Supplied compaction hash
  (`manifest.json:5`):
  `ab02d76b1f80b862aa3369da292b583fbcd817528c2f853222538ed22f04aeda`.
- Read the entire readable projection: `asm-001.txt:1–25`, `asm-002.txt:1`,
  `bytes-001.txt:1–2`, `metadata.json:1–64`, and `manifest.json:1–30`.
- Executable hash (`0x505BC0.json:8`):
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
  native export timestamp `2026-10-11T16:38:25.140966+00:00`.

The code below covers all 26 instructions and five CFG blocks. The only chunk
is **[0x505BC0, 0x505BFF), 0x3F = 63 bytes**, ending with `C3` at 0x505BFE.
The compaction's line 4 says `0x40 bytes`; that count conflicts with the native
bytes/instruction boundaries and is not used here. No padding byte is invented.
Hashes above are citations, not independently recomputed file hashes.

## Complete C reconstruction

Target: GNU-compatible C11 on little-endian **32-bit x86**, with the x86 cdecl
ABI. The packed, alias-permitting scalar views express unaligned native dword
and word memory accesses without pretending to know an object layout. Volatile
accesses retain the listed access order and widths in the source model; this
does **not** assert MMIO, atomicity, or a source-language volatile declaration.

`uint32_t` return means the observed **EAX bits**, not a recovered original
source prototype. The sole external declaration is the actual native target
of the `CALL`; its implementation is deliberately not fabricated.

```c
#include <limits.h>
#include <stdint.h>

#if !defined(__i386__) || \
    !(defined(__GNUC__) || defined(__clang__))
#error "This reconstruction requires GNU-compatible C11 targeting i386."
#endif

#define FF8_CDECL __attribute__((cdecl))

_Static_assert(CHAR_BIT == 8, "Native bytes are 8 bits");
_Static_assert(sizeof(void *) == 4, "Native pointers are 32 bits");
_Static_assert(sizeof(uintptr_t) == 4, "Native address width is 32 bits");
_Static_assert(sizeof(uint16_t) == 2, "Native words are 16 bits");
_Static_assert(sizeof(uint32_t) == 4, "Native dwords are 32 bits");

typedef struct __attribute__((packed, may_alias)) {
    uint16_t value;
} FF8_U16View;

typedef struct __attribute__((packed, may_alias)) {
    uint32_t value;
} FF8_U32View;

/* Native EA 0x00505850. Two stack slots; observe the full returned EAX. */
extern uint32_t FF8_CDECL sub_505850(unsigned char *arg0,
                                  uint32_t arg1_bits);

uint32_t FF8_CDECL sub_505BC0(unsigned char *arg0, uint32_t arg1_bits)
{
    /* 505BC0..505BCA: EAX retains arg0 on the taken guard branch. */
    if (((const volatile unsigned char *)arg0)[0x04] == 0x8Fu) {
        return (uint32_t)(uintptr_t)arg0;
    }

    /* 505BCC..505BD0: full EBX argument and ESI value cached before CALL. */
    const uint32_t esi_bits =
        ((const volatile FF8_U32View *)(arg0 + 0x74))->value;
    volatile unsigned char *const state =
        (volatile unsigned char *)(uintptr_t)esi_bits;

    /* 505BD3..505BDF: push arg1, push arg0, call, caller removes 8 bytes. */
    const uint32_t callee_eax = sub_505850(arg0, arg1_bits);
    if (callee_eax == UINT32_C(0)) {
        /* 505BE1: BYTE read/modify/write, not a WORD assignment. */
        state[0x2C] = (unsigned char)(state[0x2C] | 0x40u);
        return callee_eax;               /* 505BE5..505BE7: EAX == 0 */
    }

    /* 505BE8 zeros all of EAX, hence both AL and AX below are zero. */
    state[0x00] = (unsigned char)arg1_bits;                 /* 505BEA: BL */
    state[0x03] = 0;                                       /* 505BEC: AL */
    ((volatile FF8_U16View *)(state + 0x2E))->value = 0;     /* 505BEF: AX */
    ((volatile FF8_U16View *)(state + 0x2C))->value = 1;     /* 505BF3 */
    state[0x2A] = 0;                                       /* 505BF9: AL */
    return UINT32_C(0);                     /* 505BFC..505BFE */
}
```

No library calls or new native callees are introduced. The scalar-view types
are C representation devices, not claimed original structures. This is not an
executable by itself: linkage to the genuine callee belongs to integration.

## Instruction, byte, and ABI evidence

All instruction references below are in `0x505BC0.json:18`, also expanded in
`0x505BC0.readable/asm-001.txt` and `asm-002.txt`.

| Native interval / CFG block | Coverage and observable effect |
|---|---|
| `505BC0–505BCC` | `8B 44 24 04` reads entry `[ESP+4]`; save EBX/ESI; `80 78 04 8F` compares one byte; `74 30` branches from `505BCC` to `505BFC`. Taken path returns the unchanged pointer bits in EAX, performs no call, and never loads `[arg0+0x74]`. |
| `505BCC–505BE1` | After two saved-register pushes, `8B 5C 24 10` reads original `[entry ESP+8]` into full EBX. `8B 70 74` loads a **32-bit** value into ESI before the call. Push EBX then EAX. `E8 76 FC FF FF` at `505BD5` resolves from `505BDA` by displacement `-0x38A` to `505850`. `83 C4 08` removes two argument slots. `85 C0` tests all 32 EAX bits; `75 07` branches from `505BE1` to `505BE8`. |
| `505BE1–505BE8` | `80 4E 2C 40` ORs a **byte** with 0x40. Other bits of that byte survive; byte `+0x2D` is untouched by this instruction. EAX remains the zero callee result. Pop ESI, pop EBX, plain `C3`. |
| `505BE8–505BFC` | `33 C0` clears EAX. Ordered writes: byte `+0` from BL, byte `+3` from AL, word `+0x2E` from AX, word `+0x2C` from immediate 1, byte `+0x2A` from AL. `66 89 46 2E` and `66 C7 46 2C 01 00` prove 16-bit stores, not byte stores. Little-endian word 1 writes bytes `+0x2C=1`, `+0x2D=0`. |
| `505BFC–505BFF` | Shared pop ESI / pop EBX / plain `C3`. The guard reaches this block with EAX=arg0; the nonzero-callee path reaches it with EAX=0. |

- **Stack:** let S be entry ESP. Argument slots are `[S+4]` and `[S+8]`.
  Saved EBX/ESI occupy `S-4`/`S-8`. The two call arguments occupy `S-12`
  (arg1) and `S-16` (arg0); the nested return address is at `S-20`.
  After the nested return and `add esp,8`, ESP is `S-8`; both pops restore S.
  Both native `RET`s are plain, leaving target-argument cleanup to the caller.
  No native local allocation, EBP frame, or extra chunk is present.
- **Widths/signedness:** arg1 is passed to the callee as all 32 bits; only the
  later BL store truncates it modulo 256. The guard is byte equality and the
  callee test is full-dword zero/nonzero, with no signed ordering. A nonzero
  EAX with AL=0 still selects the initialization stores. There is no native
  multiply, arithmetic shift, division, or arithmetic-overflow computation.
- **Register/alias lifetime:** ESI and EBX are preserved across the nested call
  under the observed cdecl-style contract. The captured destination is not
  reloaded from `arg0+0x74` afterwards, even if the callee changes that field.
  No `restrict`, disjointness promise, or layout-purpose label is assumed.
- **Return:** guard -> pointer bits; zero-callee path -> 0; nonzero-callee
  path -> 0. No invented Boolean success return and no use of AL alone.
- **Xrefs only:** `0x505BC0.json:54–69` records incoming code references at
  `505C63` (function `505C00`) and `505C88` (function `505C70`), and the sole
  outgoing target `505850`. Those labels/xrefs do not prove business meaning.

## Limits, assumptions, and validation status

1. The projected callee body is absent. Its name, purpose, own memory effects,
   exception behavior, and original source-level parameter/return types are
   unknown. The declaration records the two stack values and observed full EAX
   result only. Ordinary cdecl callee-save behavior is assumed; a custom ABI
   that clobbers EBX/ESI would require new evidence and a different model.
2. The native function's original return type may have been void. Returning
   `uint32_t` intentionally preserves observable EAX on every exit rather than
   silently discarding the unusual pointer-valued guard exit.
3. C pointer operations assume valid ordinary x86 memory for each executed
   access, including any unaligned word/dword accesses supported by the target.
   No null, bounds, or tag sanitization is added. Fault timing, wrap across the
   32-bit address-space boundary, races, MMIO, and asynchronous observation are
   not modeled; volatile here does not make read/modify/write atomic.
4. Byte `arg0+4`, pointer-sized field `arg0+0x74`, and destination offsets are
   known only by access width/offset. No animation, state-machine, or flag
   meaning is assigned. Do not treat compaction historical conclusions as
   additional verified native evidence.
5. Performed: manual examination of all supplied bytes, 26 instructions,
   five blocks, call displacement, argument slots, write widths/order, and
   EAX paths. No compilation, tests, native execution, differential harness,
   IDB access, Git action, or independent review was executed. Supplied hashes
   were not recomputed. A fresh read of the central mission contract was denied
   by the read permission boundary; no alternate access was attempted.
6. Lead validation requests (not PASS claims): compile the C for the stated
   target; verify the real callee ABI; check guard/non-guard paths, full-EAX
   nonzero with AL=0, high arg1 bits forwarded intact, unchanged `+0x2D` on
   byte-OR, cleared `+0x2D` on word-store, and pre-call destination caching if
   the callee changes `[arg0+0x74]`. Tests must include callee effects rather
   than attributing all resulting memory changes to this wrapper.
