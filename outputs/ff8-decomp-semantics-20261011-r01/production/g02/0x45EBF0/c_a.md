# 0x45EBF0 — independent C A

## Provenance and scope

Input root: `inputs/ff8-decomp-semantics-20261011-r01/g02/`.
Read `common-compaction.md`, the readable manifest, **all** `asm-001.txt` through `asm-005.txt`, `bytes-001.txt`, and `metadata.json` (958 lines). No other production consulted.

- Original packet SHA-256, as supplied: `dd7611f37d54d96d1f3d3fdcb221a43aac2e371f1006d9733df00a1273427c4e`.
- Common compaction SHA-256, as supplied: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`.
- EXE SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- One native chunk `[0x45EBF0,0x45EE0D)`, 0x21D bytes, 116 instructions, 22 CFG blocks. Hashes are cited from the manifest, not independently recomputed.

## Implementation contract

The complete implementation below is **GNU C for i386, with one explicit native x87 island**, not portable ISO C. The island preserves the actual floating instruction sequence, intermediate extended precision, binary64 store, and low-DWORD extraction. Replacing it with a C cast, `round`, `lrint`, ordinary `double` multiplication, or integer division is not justified. It introduces **no callee or library call**. All subsequent control flow and saturation are C.

The island includes the interleaved global accesses so that an x87 fault cannot move those accesses across a floating operation. It reads the actual m32real at `0xB695F8` and m64real at `0xB693D8`; it does not manufacture their values from their labels. It does not change the x87 control word, clear exceptions, or insert `finit`/`fwait`. Thus PC/RC and exception masks remain caller-owned. The byte sequence `DD 5C 24 04` proves the scratch store is binary64, not an integer conversion; `D8 C9` is multiplication by ST(1), and `DD D8` is the final pop.

Build contract for lead validation: GNU-compatible i386 compiler, AT&T assembler syntax, original absolute data mapping, no instrumentation, no fast-math transformation; ordinary C ABI entry with an available x87 stack. The compiler must not synthesize floating operations around the island. Compilation/disassembly verification is **not performed** here. This is deliberately a native-FP C reconstruction, not a claim that an all-ISO-C implementation has been established.

```c
#include <stdint.h>
#include <limits.h>

_Static_assert(CHAR_BIT == 8 && sizeof(uint32_t) == 4,
               "8-bit bytes and 32-bit uint32_t required");
_Static_assert(sizeof(void *) == 4, "i386 address model required");

/* Absolute PE addresses; byte views must alias the DWORD views. */
#define D32(a) (*(volatile uint32_t *)(uintptr_t)(a))
#define B8(a)  (*(volatile unsigned char *)(uintptr_t)(a))
#define FLAG  D32(0x01CA92F8u)

/* Signed ordering of a DWORD bit pattern, without an out-of-range
   unsigned-to-signed conversion or signed overflow. */
#define SKEY(v) ((uint32_t)(v) ^ UINT32_C(0x80000000))

/* Exact DWORD result of NOT(SAR(v,31)), including its high 24 bits. */
#define BYTE_SAT_BITS(v) \
    (((uint32_t)(v) & UINT32_C(0x80000000)) ? UINT32_C(0) : UINT32_MAX)

/* Return type records the actual EAX bits, NOT an established semantic API.
   No stack arguments are read; native RET has no immediate stack cleanup. */
uint32_t __attribute__((cdecl)) sub_45EBF0(void)
{
    uint32_t eax, edx, ecx, upper_bound, flags;
    /* Raw eight-byte scratch. Accessed only by the assembly island.
       A byte object avoids float/integer effective-type punning. */
    unsigned char scratch[8] __attribute__((aligned(8)));

    /* 45EBF3..45ECCF. Native SUB ESP / PUSH ESI are represented by
       C local allocation and the ESI clobber's ABI preservation.
       CMP 45EC7B is deferred to the first C predicate: intervening
       MOV/LEA/x87 instructions do not overwrite the integer flags. */
    __asm__ volatile (
        "movl 0x01ca8a64, %%eax\n\t"
        "movl 0x01ca8a68, %%ecx\n\t"
        "movl %%eax, 0x01ca8a60\n\t"
        "movl %%ecx, 0x01ca8a64\n\t"
        "movswl 0x01ca8a30, %%eax\n\t"
        "movswl 0x01ca8a34, %%ecx\n\t"
        "movl %%eax, %[tmp]\n\t"
        "movb 0x01ca8a2b, %%dl\n\t"
        "fildl %[tmp]\n\t"
        "movl %%ecx, %[tmp]\n\t"
        "movb %%dl, 0x01ca8a6b\n\t"
        "movswl 0x01ca8a38, %%ecx\n\t"
        "fmuls 0x00b695f8\n\t"
        "fildl %[tmp]\n\t"
        "movl 0x01ca8a74, %%eax\n\t"
        "movl 0x01ca8a7c, %%esi\n\t"
        "movl $0, 0x01ca92f8\n\t"
        "fmul %%st(1), %%st\n\t"
        "faddl 0x00b693d8\n\t"
        "fstpl %[tmp]\n\t"
        "movl %[tmp], %%edx\n\t"
        "movl %%ecx, %[tmp]\n\t"
        "fildl %[tmp]\n\t"
        "movl 0x01ca8a78, %%ecx\n\t"
        "leal -2147483648(%%eax,%%edx), %%eax\n\t"
        "movl %%eax, 0x01ca8a74\n\t"
        "fmul %%st(1), %%st\n\t"
        "faddl 0x00b693d8\n\t"
        "fstpl %[tmp]\n\t"
        "movl %[tmp], %%edx\n\t"
        "leal -2147483648(%%ecx,%%edx), %%edx\n\t"
        "movswl 0x01ca8a3c, %%ecx\n\t"
        "movl %%ecx, %[tmp]\n\t"
        "movl %%edx, 0x01ca8a78\n\t"
        "fildl %[tmp]\n\t"
        "fmul %%st(1), %%st\n\t"
        "faddl 0x00b693d8\n\t"
        "fstpl %[tmp]\n\t"
        "movl %[tmp], %%ecx\n\t"
        "fstp %%st(0)\n\t"
        "leal -2147483648(%%esi,%%ecx), %%ecx\n\t"
        "movl $32767, %%esi\n\t"
        "movl %%ecx, 0x01ca8a7c\n\t"
        : "=&a" (eax), "=&d" (edx), "=&c" (ecx), [tmp] "=m" (scratch)
        :
        : "esi", "cc", "memory", "st", "st(1)"
    );
    /* The name below is a C local, not another global read. Native ESI
       has ceased holding the old MAC3 and now holds the upper bound. */
    upper_bound = UINT32_C(0x00007fff);

    /* 45ECD5..45ED03: first signed-16 clamp, full DWORD writes. */
    if (SKEY(eax) < SKEY(UINT32_C(0xffff8000))) {
        FLAG = UINT32_C(0x81000000);
        D32(0x01ca8a34u) = UINT32_C(0xffff8000);
    } else if (SKEY(eax) > SKEY(upper_bound)) {
        FLAG = UINT32_C(0x81000000);
        D32(0x01ca8a34u) = upper_bound;
    } else {
        D32(0x01ca8a34u) = eax;
    }

    /* 45ED08..45ED4D: EBX is scratch, saved/restored by native code. */
    if (SKEY(edx) < SKEY(UINT32_C(0xffff8000))) {
        flags = FLAG;
        D32(0x01ca8a38u) = UINT32_C(0xffff8000);
        flags |= UINT32_C(0x80800000);
        FLAG = flags;
    } else if (SKEY(edx) > SKEY(upper_bound)) {
        flags = FLAG;
        D32(0x01ca8a38u) = upper_bound;
        flags |= UINT32_C(0x80800000);
        FLAG = flags;
    } else {
        D32(0x01ca8a38u) = edx;
    }

    /* 45ED53..45ED97: third flag is ONLY 0x00400000. */
    if (SKEY(ecx) < SKEY(UINT32_C(0xffff8000))) {
        flags = FLAG;
        D32(0x01ca8a3cu) = UINT32_C(0xffff8000);
        flags |= UINT32_C(0x00400000);
        FLAG = flags;
    } else if (SKEY(ecx) > SKEY(upper_bound)) {
        flags = FLAG;
        D32(0x01ca8a3cu) = upper_bound;
        flags |= UINT32_C(0x00400000);
        FLAG = flags;
    } else {
        D32(0x01ca8a3cu) = ecx;
    }

    /* 45ED9D..45EDBC: unsigned JBE rejects negative DWORDs too.
       Uses the ORIGINAL MAC in EAX, not the saturated IR global. */
    if (eax > UINT32_C(255)) {
        flags = FLAG;
        eax = BYTE_SAT_BITS(eax);
        flags |= UINT32_C(0x00200000);
        FLAG = flags;
    }
    B8(0x01ca8a68u) = (unsigned char)eax;

    /* 45EDC1..45EDE8: whole EAX replaced, not just AL. */
    eax = edx;
    if (eax > UINT32_C(255)) {
        edx = FLAG;
        eax = BYTE_SAT_BITS(eax);
        edx |= UINT32_C(0x00100000);
        FLAG = edx;
    }
    B8(0x01ca8a69u) = (unsigned char)eax;

    /* 45EDED..45EE03: this path REPLACES EAX WITH FLAGS. */
    if (ecx > UINT32_C(255)) {
        eax = FLAG;
        ecx = BYTE_SAT_BITS(ecx);
        eax |= UINT32_C(0x00080000);
        FLAG = eax;
    }
    B8(0x01ca8a6au) = (unsigned char)ecx;
    return eax;
}

#undef BYTE_SAT_BITS
#undef SKEY
#undef FLAG
#undef B8
#undef D32
```

`upper_bound` after the island denotes ESI's repurposed bound, not the accumulator value. All three accumulator additions execute as 32-bit LEA, wrapping modulo 2^32. Signed ordering uses a sign-bit bias; it never performs undefined signed arithmetic. `BYTE_SAT_BITS` intentionally returns `0xFFFFFFFF`, not 255, on a nonnegative overflow: AL alone is stored, but EAX can survive as that full DWORD. No shift by four is present before the RGB-byte stores.

## ABI, x87 and memory details

- Native scratch occupies entry-ESP−8 through entry-ESP−1. ESI is saved at entry-ESP−12 and EBX at entry-ESP−16; pops occur at 45EDA2 and 45EDC8, followed by `ADD ESP,8; RET`. No argument reads, pushes of call arguments, or calls exist. The implementation abstracts stack placement and callee-save machinery into C ABI machinery; it does not reproduce stack addresses, return-address bytes, or incidental EFLAGS.
- Native EBX/ESI are preserved; EBP/EDI are untouched. EAX, ECX and EDX are scratch. The C return preserves native EAX's bit pattern, but is not a promise about incidental caller-saved ECX/EDX at the compiled function boundary. A custom calling convention observing them would need a register wrapper.
- x87 uses at most two additional stack slots, four FILDs and four pops (three binary64 stores, final discard of scale). In the ordinary valid entry state its stack depth is unchanged. It can change status/exception flags; it does not restore the x87 environment. Exact x87 instruction-pointer/data-pointer diagnostic fields necessarily refer to the rebuilt instructions/scratch, not original addresses. Full machine-context identity under exception handlers is outside this C ABI reconstruction.
- The FIFO moves two complete DWORDs before modifying the newest entry's tag byte. Byte +3 at 1CA8A68 is written early from 1CA8A2B; bytes +0,+1,+2 are written individually late. No separate alias-incompatible C object is assigned to the byte views.
- Four signed low-WORD reads are widened by MOVSX then FILD. Outputs 1CA8A34/38/3C are **full DWORD** sign-extended/clamped values; MACs 1CA8A74/78/7C remain the unclamped wrapped sums.

## Coverage and proof map

Every ASM slice was read untruncated: 25+25+25+25+16 instructions. Byte slice has 17 lines, ending with the RET at 45EE0C. Metadata lists the following covered block starts:

| C region | Native block starts |
|---|---|
| x87 island and first signed test | 45EBF0 |
| first signed clamp | 45ECD7, 45ECED, 45ECF1, 45ED03 |
| second signed clamp | 45ED08, 45ED11, 45ED2F, 45ED33, 45ED4D |
| third signed clamp | 45ED53, 45ED5B, 45ED79, 45ED7D, 45ED97 |
| first byte clamp/store | 45ED9D, 45EDA5 |
| second byte clamp/store | 45EDBC, 45EDCB |
| third byte clamp/store and return | 45EDE2, 45EDEF, 45EE03 |

Eight source proofs, all under the input root above:

1. `asm-001.txt:2-12`: FIFO DWORD copies and separate byte tag transfer. Supports the FIFO portion of the descriptive contract/name, independently of labels.
2. `asm-001.txt:6-25`, `asm-002.txt:1-21`: signed low-WORD loads, x87 scale/product/bias/store sequence, and addition of *old* 74/78/7C values. This is independent evidence for “accumulate”, not merely “multiply”.
3. `bytes-001.txt:3-7`: actual operand widths of FMUL m32real, FADD m64real, FSTP m64real; LEAs include 0x80000000. Their pointed-to constant bytes are **not** exported in this packet.
4. `asm-002.txt:3-22`: first signed comparison survives all intervening x87/MOV/LEA operations; no FNSTSW/SAHF changes EFLAGS. It tests wrapped EAX, not the last x87 quantity.
5. `asm-002.txt:23-25`, `asm-003.txt:1-25`, `asm-004.txt:1-12`: signed bounds −32768/+32767 and three unequal status masks. Third clamp's 0x00400000 lacks the high summary bit used by the first two.
6. `asm-004.txt:13-25`, `asm-005.txt:1-8`: unsigned 255 tests followed by SAR 31/NOT and AL stores; full-register residual must not be simplified to a byte result.
7. `asm-005.txt:9-16`: third byte overflow reloads FLAG into EAX; if absent, EAX remains the second-channel residual. This excludes a stable scalar-result interpretation without caller evidence.
8. `metadata.json:174-210,512-516,956-957`: callsites from 56CB50/56CBC0/5D9510/657DF0/658010 and 701390; no recorded outgoing calls. These establish reuse, not a particular gameplay purpose.

## Descriptive contract / uncertainty

Suggested descriptive name: `AccumulateScaledS16Triplet_ClampAndPushByteFIFO`. Confidence high in the operand-level behavior; medium in the “triplet/FIFO” organization; no definitive hardware-operation or gameplay name asserted. The name's two independent bases are proofs 1 (FIFO movement) and 2 (three old-accumulator additions); proof 5 separately supports the clamping term. “Q12” and “GTE” remain contextual hypotheses: the compaction reports 1/4096, but constant data bytes are missing here.

Reads: four signed low words, three prior MAC DWORDs, two prior FIFO DWORDs, tag byte, and the two real constants. Writes: MAC triplet, saturated signed triplet, FIFO/tag/three byte channels, status DWORD. No explicit arguments. This is global-state, non-reentrant code unless externally serialized.

Remaining validation requests for lead: verify emitted i386 code/inline constraints and absence of added floating operations; supply constant-byte and x87 initialization evidence before replacing the native island with an all-C numerical model; inspect caller uses of EAX if a semantic prototype is desired. Boundary cases should include each signed limit, −1/0/255/256, 32-bit accumulator wrap, rounding ties and supported PC/RC settings. None of these tests, compilation, differential checks, integration, or IDB operations were executed. Output hash to be computed by parent. No promotion/PASS asserted.
