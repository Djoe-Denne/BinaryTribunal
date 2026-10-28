# C reconciliation R — 0x45E670

Mission `ff8-decomp-semantics-20261011-r01`, g03, C-only reconciliation. No semantic-volet candidate, prior verdict, index, live service, or other session was consulted.

## Verdict and provenance

**Native instruction/data-flow reconciliation: RESOLVED, high confidence.** Complete GNU i386 C with an exact x87 instruction island is below. **Executable equivalence/compilation: UNVALIDATED**, not a final §5.6 acceptance. Pure floating-point C equivalence and a meaningful original return type remain **UNCERTAIN**.

The parent supplied both independently deposited authors in this projection:

| Author | Session | Effective model recorded by parent | Candidate SHA-256 |
|---|---|---|---|
| A | `ses_ed3e1477affeMM2PGq8z6Do5Gv` | `openai/gpt-6-astra`, high | `d6d3bf3dc3b26b213d5244f561772f559e5d1d2dc6782e574ec5bbe95d61c08c` |
| B | `ses_ed3e14368ffeFj57RRG20Hyjh5` | `opencode/claude-opus-5-5`, high | `0ad453856b3233acc352189a73b5c6c75e243092296abdc08bbaed0b5bbb0d26` |

Read all of `c_a.md`, `c_b.md`, `common-compaction.md`, original `0x45E670.json`, four complete `native-asm-*` slices, `native-bytes-001.txt`, `native-metadata.json`, and both manifests in the assigned C projection. The reader truncates the original JSON's single assembly string; **all 92 instructions are available and were read untruncated in the four native slices**. Original chunk hex is complete and agrees with the byte slice. No missing author or internally inconsistent hash declaration was found. Hashes are parent-declared, **not independently recomputed**: no authorized raw-file hash primitive is exposed. Parent must verify file hashes, including this output, before promotion.

Frozen original packet SHA-256: `06476e1094d6963e3532e19496a495b87b348503b4e79216e537b193aa571774`; common-compaction: `9959dc7995e01db21518f4c15252096543ca53ec042a342d705dce6badf71572`; PE: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`. Native-manifest declarations agree with reconciliation manifest for all slices and metadata; its short filenames refer to the supplied `native-` copies.

Coverage: **92/92 instructions, 426/426 bytes, 15/15 CFG blocks**, sole chunk `[0x45E670,0x45E81A)`, three return sites, no calls or omitted tail.

## Convergences, divergences, and common-error checks

Agreement was checked against bytes and the x87 stack, not accepted as a vote.

| Issue | A / B | Native resolution |
|---|---|---|
| Cyclic products | Agree on `b*z-c*y`, `c*x-a*z`, `a*y-b*x` | `D8 C9/CB/CA` stack indices and `DE E9` subtraction verify the direction, not labels. Here x/y/z are signed-word inputs shifted 12. |
| Input access width | A reads actual WORDs; B truncates a DWORD load | `0F BF` at 45E673/67A/681 requires 16-bit memory reads. B's value equivalence is insufficient for width/fault/observation equivalence. Retain WORD loads. |
| x87 fidelity | A retains instructions; B uses `double` and magic helper, offers `long double` alternative | Neither C type reproduces all PC/RC, exponent-range, NaN, exception and stack behavior. `FADD m64`, `FSTP m64`, and real register operations are retained, with no CW reset or assumed nearest rounding. |
| Memory/arithmetic ordering | A preserves the instruction island; B calculates each complete term before subsequent terms | Native starts term 2 before reading term 1's scratch; term 2 subtraction precedes MAC1 store, and starts term 3 before MAC2 store. B also leaves expression operand evaluation order unspecified and uses nonvolatile globals. Retain the exact sequence and repeated FLOAT loads. |
| Extra calls | A introduces none; B has helper/implementation/wrapper functions | No CALL exists in frozen bytes. B requires undocumented forced inlining/optimization to avoid extra calls. Final C has no helper or wrapper. |
| Return signature | A exposes EAX residue as uint32; B exports void and discards `_impl` result | `C3` and body establish EAX residue, not the original source-level return contract. Final code exposes raw EAX for fidelity; caller use/type remains UNCERTAIN. A void wrapper cannot guarantee physical EAX retention. |
| Saturation/flags | Both describe signed comparisons, DWORD stores and asymmetric masks | `7D/7E`, `C7/A3/89`, `0D` verify exact signed boundaries and masks. First clamp never changes EAX; third-only clipping sets 0x00400000, not a fabricated bit31. |
| x87 output stack | A describes net zero; B says empty | Nine pushes/nine pops mean **net zero**, not necessarily empty on entry/exit. Preserve underlying incoming entries on a nonfaulting execution with sufficient room; do not assume an empty incoming stack. |
| Constant numeric value | A reads actual address; B names 2^52+2^31 | Packet contains the instruction's address/width, not constant-data bytes. Compaction's attributed data capture is secondary. Read the mapped binary64 at 0xB693D8; do not hardcode a label-derived value or substitute an integer conversion. |
| Float block stride | A cautious; B identifies compaction inconsistency | Native operand addresses are 1CA923C/44/4C (8-byte separation). Given the compaction's 0xC row boundaries, these are last/middle/first positions, **not last float of each row**. A diagonal interpretation is compatible with those boundaries, not a necessary C premise. |

Common pitfalls independently excluded: saturation does not narrow stores to WORD; input DWORD upper halves are ignored; negative input shifting must not use signed-C left shift; all three **IR** reads precede IR rewrites, but **not all FLOAT reads precede all output stores**; raw results are obtained from binary64 low bits, not `FISTP`, truncation, or universally valid `round_half_even`; the three fixed addresses are not inferred camera semantics. x87 net-zero stack depth does not imply an unchanged status word. No hardware-GTE overflow/summary correction is inserted.

## Complete reconciled C

Target contract: GNU-compatible C on **32-bit i386**, AT&T assembler syntax, original virtual addresses mapped, integer-only surrounding generated code. Absolute accesses are intentional; not a portable standalone host program. Compile without instrumentation, stack-protector helper calls or floating-point compiler additions; inspect generated code before use. No compilation occurred here.

One uint64 local provides the native eight-byte scratch with DWORD integer writes and binary64 stores, followed by low-DWORD reads. All floating-point operations stay native, so incoming PC/RC/masks are used, native exception/status/tag effects occur, and no floating-point library helper is introduced. The entire x87 register stack is declared clobbered to prevent compiler-held FP values across the island. No `FNINIT`, `FNCLEX`, save/restore or added guard changes native behavior.

The C interface returns the native EAX bit pattern solely to preserve its observable residue; this is **not** evidence that callers consume an integer return. Outgoing physical ECX/EDX/EFLAGS, fault EIP, compiler frame layout, x87 FIP/FDP and scratch residue are not promised as C ABI outputs. Native-to-C instruction addresses necessarily differ.

```c
#include <stdint.h>
#include <limits.h>

#if !defined(__GNUC__) || !defined(__i386__)
#error "Requires GNU-compatible i386 C with AT&T inline assembly"
#endif

_Static_assert(CHAR_BIT == 8, "8-bit bytes");
_Static_assert(sizeof(uint32_t) == 4, "DWORD");
_Static_assert(sizeof(uint64_t) == 8, "QWORD scratch");
_Static_assert(sizeof(uintptr_t) == 4, "32-bit addresses");

#define M32(va) (*(volatile uint32_t *)(uintptr_t)(va))
/* Bias raw DWORD bit patterns into signed order, without implementation-
   defined uint32 -> int32 conversion. */
#define SORDER(v) ((v) ^ UINT32_C(0x80000000))

uint32_t __attribute__((cdecl)) sub_45E670(void)
{
    uint64_t scratch;
    uint32_t eax, ecx, edx;

    /* Entry block 45E670..45E742. Local replaces native sub esp,8.
       Early-clobbers keep scratch addressing out of EAX/ECX/EDX.
       .byte fixes x87 register opcodes, avoiding FSUBP syntax ambiguity. */
    __asm__ __volatile__(
        "movswl 0x01ca8a34, %%eax\n\t" /* 45E673 */
        "movswl 0x01ca8a38, %%ecx\n\t" /* 45E67A */
        "movswl 0x01ca8a3c, %%edx\n\t" /* 45E681 */
        "shll $12, %%eax\n\t"          /* 45E688 */
        "movl %%eax, %[s]\n\t"        /* 45E68B */
        "movl $0, 0x01ca92f8\n\t"      /* 45E68F */
        "fildl %[s]\n\t"              /* 45E699: x */
        "shll $12, %%ecx\n\t"          /* 45E69D */
        "movl %%ecx, %[s]\n\t"        /* 45E6A0 */
        "fildl %[s]\n\t"              /* 45E6A4: y,x */
        "shll $12, %%edx\n\t"          /* 45E6A8 */
        "movl %%edx, %[s]\n\t"        /* 45E6AB */
        "fildl %[s]\n\t"              /* 45E6AF: z,y,x */
        "flds 0x01ca9244\n\t"         /* 45E6B3: b,z,y,x */
        ".byte 0xd8,0xc9\n\t"        /* 45E6B9: ST0 *= ST1 */
        "flds 0x01ca924c\n\t"         /* 45E6BB */
        ".byte 0xd8,0xcb\n\t"        /* 45E6C1: ST0 *= ST3 */
        ".byte 0xde,0xe9\n\t"        /* 45E6C3: ST1 -= ST0; pop */
        "faddl 0x00b693d8\n\t"        /* 45E6C5: m64 addend */
        "fstpl %[s]\n\t"              /* 45E6CB: binary64 store/pop */
        "flds 0x01ca924c\n\t"         /* 45E6CF */
        ".byte 0xd8,0xcb\n\t"        /* 45E6D5: times x */
        "flds 0x01ca923c\n\t"         /* 45E6D7 */
        ".byte 0xd8,0xca\n\t"        /* 45E6DD: times z */
        "movl %[s], %%eax\n\t"        /* 45E6DF: low DWORD */
        "addl $0x80000000, %%eax\n\t" /* 45E6E3: modulo 2^32 */
        ".byte 0xde,0xe9\n\t"        /* 45E6E8 */
        "movl %%eax, 0x01ca8a74\n\t" /* 45E6EA */
        "faddl 0x00b693d8\n\t"        /* 45E6EF */
        "fstpl %[s]\n\t"              /* 45E6F5 */
        "movl %[s], %%ecx\n\t"        /* 45E6F9 */
        ".byte 0xdd,0xd8\n\t"        /* 45E6FD: pop z */
        "flds 0x01ca923c\n\t"         /* 45E6FF */
        ".byte 0xd8,0xc9\n\t"        /* 45E705: times y */
        "flds 0x01ca9244\n\t"         /* 45E707 */
        ".byte 0xd8,0xcb\n\t"        /* 45E70D: times x */
        "addl $0x80000000, %%ecx\n\t" /* 45E70F */
        "movl %%ecx, 0x01ca8a78\n\t" /* 45E715 */
        ".byte 0xde,0xe9\n\t"        /* 45E71B */
        "faddl 0x00b693d8\n\t"        /* 45E71D */
        "fstpl %[s]\n\t"              /* 45E723 */
        "movl %[s], %%edx\n\t"        /* 45E727 */
        ".byte 0xdd,0xd8\n\t"        /* 45E72B: pop y */
        "addl $0x80000000, %%edx\n\t" /* 45E72D */
        "cmpl $0xffff8000, %%eax\n\t" /* 45E733: before final pop */
        ".byte 0xdd,0xd8\n\t"        /* 45E738: pop x */
        "movl %%edx, 0x01ca8a7c\n\t" /* 45E73A */
        : "=&a" (eax), "=&c" (ecx), "=&d" (edx), [s] "=m" (scratch)
        :
        : "memory", "cc", "st", "st(1)", "st(2)", "st(3)",
          "st(4)", "st(5)", "st(6)", "st(7)"
    );

    /* 45E740/742/758/75F/775: signed low/high/no-clamp.
       Neither saturated branch modifies the logical EAX. */
    if (SORDER(eax) < UINT32_C(0x7fff8000)) {
        M32(0x01ca92f8) = UINT32_C(0x81000000);
        M32(0x01ca8a34) = UINT32_C(0xffff8000);
    } else if (SORDER(eax) > UINT32_C(0x80007fff)) {
        M32(0x01ca92f8) = UINT32_C(0x81000000);
        M32(0x01ca8a34) = UINT32_C(0x00007fff);
    } else {
        M32(0x01ca8a34) = eax;
    }

    /* 45E77A/782/79D/7A5/7C0: FLAG load precedes IR2 store. */
    if (SORDER(ecx) < UINT32_C(0x7fff8000)) {
        eax = M32(0x01ca92f8);
        M32(0x01ca8a38) = UINT32_C(0xffff8000);
        eax |= UINT32_C(0x80800000);
        M32(0x01ca92f8) = eax;
    } else if (SORDER(ecx) > UINT32_C(0x80007fff)) {
        eax = M32(0x01ca92f8);
        M32(0x01ca8a38) = UINT32_C(0x00007fff);
        eax |= UINT32_C(0x80800000);
        M32(0x01ca92f8) = eax;
    } else {
        M32(0x01ca8a38) = ecx;
    }

    /* 45E7C6/7CE/7EB/7F3/810: three terminal paths. */
    if (SORDER(edx) < UINT32_C(0x7fff8000)) {
        eax = M32(0x01ca92f8);
        M32(0x01ca8a3c) = UINT32_C(0xffff8000);
        eax |= UINT32_C(0x00400000);
        M32(0x01ca92f8) = eax;
        return eax; /* native add esp,8; retn at 45E7E7/7EA */
    }
    if (SORDER(edx) > UINT32_C(0x80007fff)) {
        eax = M32(0x01ca92f8);
        M32(0x01ca8a3c) = UINT32_C(0x00007fff);
        eax |= UINT32_C(0x00400000);
        M32(0x01ca92f8) = eax;
        return eax; /* 45E80C/80F */
    }
    M32(0x01ca8a3c) = edx;
    return eax;     /* 45E816/819 */
}

#undef SORDER
#undef M32
```

## Proof anchors and structural contract

These are C-side structural findings, not a substitute for the separate semantic R task.

1. **45E673–45E6AF** (`native-asm-001:2–14`; bytes `0F BF`, `C1 /4 0C`, `DB 44 24 00`): low signed WORD snapshots, unsigned hardware shift by 12, signed DWORD FILD. Shifted values span [-134217728,134213632]. No AL/AX-only write occurs anywhere; no argument loads occur.
2. **45E6B3–45E6C3** (slice 001:15–19): after FILD stack `z,y,x`, binary32 b and c loads, `D8 C9/CB` and `DE E9` establish first component `b*z-c*y`. Maximum added depth five, not four.
3. **45E6CF–45E71B** (slice 001:22–25, slice 002:1–16): second and third cyclic components `c*x-a*z`, `a*y-b*x`; repeated absolute FLOAT loads are retained. This and anchor 2 independently justify **Cross3Float**, without camera labels.
4. **45E6C5/6CB, 45E6EF/6F5, 45E71D/723**, low-DWORD reloads and adds **45E6DF/6E3, 45E6F9/70F, 45E727/72D**: bytes `DC 05 D8 93 B6 00` and `DD 5C 24 00` prove m64 add/spill then low-DWORD +0x80000000 modulo 2^32, **not integer conversion**. Unclamped DWORD outputs at 1CA8A74/78/7C precede clamps.
5. **45E733/758, 45E77A/79D, 45E7C6/7EB**: `7D`/`7E` signed tests against -32768/32767, inclusive endpoints. DWORD writes to original IR locations establish **SatS16 as range**, not memory width. First flag assignment 45E742/75F; second OR 45E791/7B4; third OR 45E7DD/802 are literal asymmetric masks.
6. **45E6FD/72B/738** (`DD D8`), **45E7E7/80C/816** (`83 C4 08 C3`): temporary x87 entries discarded, stack frame restored at all exits. Native uses no helper/call, has zero consumed explicit arguments, and is cdecl-compatible; zero-argument stdcall is indistinguishable. With no component 2/3 clipping EAX remains raw component 1 even if component 1 clipped; otherwise EAX is the final FLAG. No fixed meaningful return is established.
7. **xref 0x4026D4 and 0x40277E from 0x402620**, plus the nine other sites in metadata: 11 incoming near-call xrefs, nine distinct callers, `code_targets=[]`. These support a shared leaf entry, not an argument/return-use or camera-specific contract; caller instructions were not supplied/read.

Proposed literal descriptive name: `Cross3Float_SatS16`. Existing `Gte_` prefix is compatible with compaction's shared register-file context, but **hardware identity/complete GTE equivalence is not independently established** by this function. Confidence is high in widths, component orientation, write order, clamp masks and EAX residue; UNCERTAIN in caller-used return type, numeric shortcut equivalence and operand application meaning.

## CFG coverage

| Native block [start,end) | Final C correspondence |
|---|---|
| 45E670–45E742 | Eight-byte local; complete island; first signed low test |
| 45E742–45E758 | First below-min stores |
| 45E758–45E75F | First upper-bound test |
| 45E75F–45E775 | First above-max stores |
| 45E775–45E77A | First in-range store |
| 45E77A–45E782 | Second low test |
| 45E782–45E79D | Second below-min load/store/OR/store |
| 45E79D–45E7A5 | Second upper-bound test |
| 45E7A5–45E7C0 | Second above-max load/store/OR/store |
| 45E7C0–45E7C6 | Second in-range store |
| 45E7C6–45E7CE | Third low test |
| 45E7CE–45E7EB | Third below-min path and first return |
| 45E7EB–45E7F3 | Third upper-bound test |
| 45E7F3–45E810 | Third above-max path and second return |
| 45E810–45E81A | Third in-range store and third return |

Addresses are distinct except the intentional input/output alias at IR1/2/3. WORD reads do not access their upper halves; outputs overwrite all four bytes. No consolidation of repeated FLOAT loads or FLAG accesses is allowed. `volatile` preserves branch memory-access ordering at the C abstract-machine level; this does not authorize a portable concurrent-data-race interpretation or promise identical event timing.

## Residual limits and lead gates

- Compile/disassemble with the approved i386 toolchain. Check scratch addressing/width, register constraints, all x87 opcodes, no compiler FP or new calls, absolute address operands and branch-store ordering. This was **not executed**; no compilation PASS is claimed.
- Differential native validation should cover all eight clipping combinations, exact signed endpoints, upper-half input changes, negative shifts, wrap/large inputs, nonfinite/sNaN operands, PC=24/53/64 and RC modes, flags/EAX residue, incoming x87 entries and status. Only native exception behavior is retained by the island; initial CW/status/tags and masked/unmasked exception conditions were not supplied.
- The constant's exact data bytes are absent from the primary packet; numeric reasoning using 2^52+2^31 is attributed secondary information, not an assumption required by the C. No additional capture is necessary for this address-reading implementation; a pure C numeric simplification would require primary constant data and an explicit x87/environment domain.
- A C ABI cannot promise native fault addresses, x87 instruction/data pointers, exact caller-saved GPR/flags, native ESP-relative residue or instruction timing. If those are acceptance requirements, retain native machine code rather than declare this source byte-identical. Native peak depth adds five entries; existing full/insufficient x87 stack may fault exactly through the retained operations.
- Meaningful return type, camera meaning and exact hardware-GTE identity remain UNCERTAIN; absence of caller ASM is not filled using labels or historical verdicts.
- No IDB/git/ledger/registry/configuration/live mutation, delegation, compilation or execution occurred. Parent exclusively owns final §5.6/native validation, hashing and promotion.
