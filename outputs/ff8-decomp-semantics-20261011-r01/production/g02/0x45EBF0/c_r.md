# 0x45EBF0 — reconciled C R (2+1)

## Scope, provenance and verdict

Only the C projection `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x45EBF0/C/` was used, apart from common agent/mission instructions. No other volet, peer output, previous verdict, index, live service or IDA was consulted.

The parent manifest identifies two disjoint native author sessions:

| Author | Session | Effective model recorded by parent | Frozen candidate SHA-256 |
|---|---|---|---|
| A | `ses_ed3e1946affeM5hrupgpfhF2vS` | `openai/gpt-6-astra`, high | `18ade31683e05949ad207cae375e26d1cf80c421062d9a6019c0f86582079b5e` |
| B | `ses_ed3e19073ffed30hjl5Ic7NxI6` | `opencode/claude-opus-5-5`, high | `cdb0cbe63b75eb0a168ce8be98d74e11aed95059040b7dbd533b92c536d0abbf` |

Original packet SHA-256: `dd7611f37d54d96d1f3d3fdcb221a43aac2e371f1006d9733df00a1273427c4e`. Common compaction SHA-256: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. Native PE32 input SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; native export timestamp `2026-10-11T16:38:25.140966+00:00`.

The reconciliation manifest, native manifest and candidates' packet/compaction citations agree. No missing author or declared-hash inconsistency was found. These are **supplied hashes**, not independently recomputed file hashes: no authorized file-hashing primitive is exposed. Parent must compute input/output readback hashes. This is not a claim of byte-level cryptographic verification.

Read both candidates, all five native ASM slices (25+25+25+25+16 instructions), all 17 native-byte lines, the entire 958-line native metadata and all original-packet lines. The reader truncates the original packet's single long assembly string; the five complete verbatim ASM slices supply that field without truncation. Packet hex, boundaries, CFG and metadata agree with the readable projections. Native chunk is `[0x45EBF0,0x45EE0D)`, **541 bytes, 116 instructions, 22 blocks**.

**Verdict: RECONCILED at operand/C-ABI level, with native x87 island retained.** No unresolved integer/CFG divergence remains. Pure ISO-C FP equivalence, exact constant values, semantic return type and hardware-operation name remain **UNCERTAIN**. Compilation, differential testing and native promotion are not asserted; parent owns final §5.6.

## Convergences, divergences and common-error checks

| Issue | A / B | Native adjudication and final choice |
|---|---|---|
| FIFO, accumulation, full-DWORD signed clamps, six flag masks, unsigned byte checks | Agree | Re-derived from operands and branches, not accepted by agreement. Old FIFO entries are captured before overwritten; three `LEA`s wrap at 32 bits; byte checks use the original wrapped results, not clamped globals. |
| FP implementation | A retains native x87; B uses `double`, `magic_low32`, `memcpy`, and assumes a precision/rounding environment | `D8 0D` is m32 FMUL, `D8 C9` is ST(0)×ST(1), `DC 05` is m64 FADD, `DD 5C 24 04` is m64 FSTP, not FISTP. No control-word change exists. Choose native island; reject B's numerical replacement and helper calls as an unconditional faithful reconstruction. |
| Memory width/order | A uses exact native loads in island and volatile stores; B reads complete C DWORD objects to extract words and uses nonvolatile globals | `0F BF` reads **two bytes**, not four. Interleaving FILD/FMULT/FADD/FSTP with tag/accumulator/status accesses must not be reordered by C FP expressions. Native island plus volatile DWORD/unsigned-char views preserves these observations. |
| Signedness | A sign-bit ordering; B casts DWORD to `int32_t` | Hardware signed comparisons are exact; final C uses sign-bit-biased unsigned ordering, avoiding implementation-defined out-of-range casts. |
| Byte clamp and EAX | Both keep full 0/FFFFFFFF saturation and third-channel FLAG reload | Confirmed independently at 45EDAB/45EDD1/45EDF4 and 45EDEF. Final return is the native EAX bit pattern, not 0/255, a triplet, or a stable status result. |
| Constant values / conversion shorthand | A does not invent constants; B calls the bias value established from its label and describes `rint` as native-proven | Neither constant's **data bytes** are present. Labels are not proof. Even if scale=2^-12 and bias=2^52+2^31, the actual x87 PC/RC sequence cannot generally be replaced by ideal `rint`. Final code reads the actual memory operands; values and numerical shorthand remain conditional. |
| Aliasing | A explicitly aliases byte/DWORD FIFO views; B prose says all addresses are distinct | Reject that prose: A68..A6B are bytes of A68's DWORD, and A34/A38/A3C input words overlap their later DWORD outputs. Final code represents these overlaps, retains early tag write and late per-byte stores. |
| Descriptive name | A conservative triplet/FIFO name; B `Gte_GPL_sf1_lm0` | Keep an operand-derived descriptive name. Hardware flags/accumulation are suggestive but do not establish a complete GTE opcode contract, particularly with unshifted byte outputs and unverified constants. |

Common-error search also verified: IR3 flag is only `0x00400000`, with no added summary bit; no RGB shift-by-four; IR saturation does not overwrite the MAC globals or integer registers used for RGB; the first signed predicate uses EAX from 45EC7B although the branch is at 45ECD5; intervening x87/MOV/LEA operations do not change its integer flags. No invented overflow guard, call, clearing of x87 exceptions, or FP-environment restoration is permitted.

## Complete reconciled implementation

This is **GNU C for i386 with an explicit native-x87 inline-assembly island**, not an all-ISO-C implementation. The island is necessary because the gel lacks constant data and x87 initialization evidence. It includes the native interleaved global accesses, retains the shared x87 scale rather than spilling it to C `double`, and uses the caller's PC/RC/exception masks. No `FINIT`, `FLDCW`, `FNCLEX`, added `FWAIT`, library call or FP guard is introduced.

The required build target is little-endian i386, original absolute data mapping, GNU-compatible extended inline assembly, no instrumentation or added FP operations. The compiler owns callee-saved registers and stack allocation. Rebuilt stack addresses, instruction-pointer diagnostics, incidental EFLAGS and caller-saved ECX/EDX are not an exact machine-context replica. Normal C ABI execution with sufficient x87 stack capacity is the equivalence boundary; native diagnostic/trap context must be validated separately if observed.

```c
#include <stdint.h>
#include <limits.h>

_Static_assert(CHAR_BIT == 8 && sizeof(uint32_t) == 4,
               "8-bit bytes and 32-bit DWORDs required");
_Static_assert(sizeof(void *) == 4, "i386 mapping required");

#define D32(a) (*(volatile uint32_t *)(uintptr_t)(a))
#define B8(a)  (*(volatile unsigned char *)(uintptr_t)(a))
#define FLAG   D32(0x01ca92f8u)
/* Signed ordering of 32-bit bit patterns without signed overflow/casts. */
#define SKEY(v) ((uint32_t)(v) ^ UINT32_C(0x80000000))
/* Exact full DWORD NOT(SAR(v,31)), not merely the stored byte. */
#define SAT_BITS(v) \
    (((uint32_t)(v) & UINT32_C(0x80000000)) ? UINT32_C(0) : UINT32_MAX)

/* Return records physical EAX only; no semantic scalar return established. */
uint32_t __attribute__((cdecl)) sub_45EBF0(void)
{
    uint32_t eax, edx, ecx, f;
    unsigned char scratch[8] __attribute__((aligned(8)));

    /* 45EBF3..45ECCF. scratch replaces the native eight-byte local.
       PUSH ESI / callee-save machinery is owned by the compiler.
       45EC7B CMP is represented by the first C predicate below. */
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

    /* 45ECD5..45ED03; signed result limits, full DWORD writes. */
    if (SKEY(eax) < SKEY(UINT32_C(0xffff8000))) {
        FLAG = UINT32_C(0x81000000);
        D32(0x01ca8a34u) = UINT32_C(0xffff8000);
    } else if (SKEY(eax) > SKEY(UINT32_C(0x00007fff))) {
        FLAG = UINT32_C(0x81000000);
        D32(0x01ca8a34u) = UINT32_C(0x00007fff);
    } else {
        D32(0x01ca8a34u) = eax;
    }

    /* 45ED08..45ED4D; PUSH/POP EBX represented by C ABI preservation. */
    if (SKEY(edx) < SKEY(UINT32_C(0xffff8000))) {
        f = FLAG;
        D32(0x01ca8a38u) = UINT32_C(0xffff8000);
        f |= UINT32_C(0x80800000);
        FLAG = f;
    } else if (SKEY(edx) > SKEY(UINT32_C(0x00007fff))) {
        f = FLAG;
        D32(0x01ca8a38u) = UINT32_C(0x00007fff);
        f |= UINT32_C(0x80800000);
        FLAG = f;
    } else {
        D32(0x01ca8a38u) = edx;
    }

    /* 45ED53..45ED97; third signed mask deliberately lacks bit 31. */
    if (SKEY(ecx) < SKEY(UINT32_C(0xffff8000))) {
        f = FLAG;
        D32(0x01ca8a3cu) = UINT32_C(0xffff8000);
        f |= UINT32_C(0x00400000);
        FLAG = f;
    } else if (SKEY(ecx) > SKEY(UINT32_C(0x00007fff))) {
        f = FLAG;
        D32(0x01ca8a3cu) = UINT32_C(0x00007fff);
        f |= UINT32_C(0x00400000);
        FLAG = f;
    } else {
        D32(0x01ca8a3cu) = ecx;
    }

    /* 45ED9D..45EDBC: unsigned JBE; negative bit patterns also fail. */
    if (eax > UINT32_C(255)) {
        f = FLAG;
        eax = SAT_BITS(eax);
        f |= UINT32_C(0x00200000);
        FLAG = f;
    }
    B8(0x01ca8a68u) = (unsigned char)eax; /* AL only; no AX/EAX write */

    /* 45EDC1..45EDE8: MOV EAX,EDX replaces the complete EAX. */
    eax = edx;
    if (eax > UINT32_C(255)) {
        edx = FLAG;
        eax = SAT_BITS(eax);
        edx |= UINT32_C(0x00100000);
        FLAG = edx;
    }
    B8(0x01ca8a69u) = (unsigned char)eax;

    /* 45EDED..45EE03: overflow of component 3 replaces EAX by FLAGS.
       Native CMP ECX precedes byte +1 store; that store cannot change ECX. */
    if (ecx > UINT32_C(255)) {
        eax = FLAG;
        ecx = SAT_BITS(ecx);
        eax |= UINT32_C(0x00080000);
        FLAG = eax;
    }
    B8(0x01ca8a6au) = (unsigned char)ecx; /* CL only */
    /* 45EE09..45EE0C: local removal and plain RET handled by C ABI. */
    return eax;
}

#undef SAT_BITS
#undef SKEY
#undef FLAG
#undef B8
#undef D32
```

All global accesses in the island retain native ordering, including the early read of MAC3 and the later read of MAC2; moving all old-MAC reads to entry would not be the supplied instruction order. Integer C predicates can move relative to independent register operations but the observable global loads/stores remain sequenced. The first clamp flag write precedes its destination write; the second/third clamps read FLAG, write destination, then write updated FLAG. `unsigned char` byte views alias the DWORD view legally in this target C model. A word input is never widened into a four-byte memory read.

The three `LEA`s implement addition modulo 2^32, including the literal `0x80000000`. `SKEY` gives exact signed DWORD ordering. `SAT_BITS` is a no-call macro implementing `SAR 31; NOT`: nonnegative overflow produces **FFFFFFFF**, not 000000FF. The byte stores do not narrow the register variables. No shift with a C signed-overflow or implementation-defined negative-shift dependency occurs. No inputs are read from the argument stack; native `RET` has no immediate cleanup. EBX/ESI are restored, EDI/EBP untouched; incidental ECX/EDX are caller-saved and not part of this C result contract.

x87 depth is normally unchanged: four FILD pushes, three m64 FSTP pops and one `FSTP ST(0)` pop; maximum two additional slots. PC/RC, exception masks and existing sticky status remain caller-owned. Native instructions may set status/exception flags; **preserving the environment means retaining that behavior, not silently saving/restoring status**. A C-ABI rebuild does not preserve original scratch addresses, diagnostic FIP/FDP addresses or trap instruction addresses. Stack-overflow/underflow/unmasked-exception handler equivalence and any nonstandard register-observing convention remain outside the validated boundary.

## CFG coverage

| Region | Covered native starts |
|---|---|
| Native prefix plus first signed predicate | `45EBF0` |
| First signed clamp | `45ECD7`, `45ECED`, `45ECF1`, `45ED03` |
| Second signed clamp | `45ED08`, `45ED11`, `45ED2F`, `45ED33`, `45ED4D` |
| Third signed clamp | `45ED53`, `45ED5B`, `45ED79`, `45ED7D`, `45ED97` |
| First byte clamp | `45ED9D`, `45EDA5` |
| Second byte clamp | `45EDBC`, `45EDCB` |
| Third byte clamp and exit | `45EDE2`, `45EDEF`, `45EE03` |

All 22 native block successor alternatives are represented. The sole terminal block ends in C3 at `45EE0C`; no call, second chunk, tail transfer, hidden early return or loop occurs. Native frame balances on every path: reserve 8 bytes, save ESI, save EBX, restore EBX, restore ESI, release 8, RET.

## Operand-level role and exact evidence

Descriptive name: **`AccumulateScaledS16Triplet_ClampAndPushByteFIFO`**. High confidence for operand-level accumulation/clamping/FIFO effects; hardware/gameplay identity remains **UNCERTAIN**. This is an accompanying descriptive contract, not a reconciliation of the unseen semantic A/B volet.

No explicit arguments. Reads four signed low WORDs at A30/A34/A38/A3C, old DWORDs A74/A78/A7C, FIFO DWORDs A64/A68, tag byte A2B, m32real B695F8 and m64real B693D8. Writes three wrapped accumulator DWORDs, three signed-range-clamped DWORDs at the overlapping input addresses, the shifted FIFO, the newest entry's four individual bytes, and FLAG A92F8. Floating status may change. All are absolute addresses with the `01CA` or `00B6` prefixes shown in code. It is global-state, non-reentrant absent external serialization. Data dependencies establish the descriptive name through independent accumulation and FIFO proofs, with signed-clamp evidence separately supporting its middle term.

Eight native proof anchors (all paths relative to the C input projection):

1. **FIFO and tag:** `native-asm-001.txt:2-12`, `45EBF3..45EC29`: capture two old DWORD entries, move A64→A60 and A68→A64, then write A2B to A6B. This independently supports “push FIFO”; not an IDA-label inference.
2. **Signed inputs/shared scale:** `native-asm-001.txt:6-25`, `45EC09/45EC10/45EC2F/45EC36`, and `native-asm-002.txt:10-16`, `45EC9C..45ECB9`: MOVSX low WORDs feed four signed m32 FILDs; one scaled first input remains for three products.
3. **Native FP widths:** `native-bytes-001.txt:3-7`: `d80df895b600`, `d8c9`, `dc05d893b600`, `dd5c2404`, `ddd8` establish m32 multiply, ST(1) multiply, m64 add/store, final scale pop. Pointed-to constant data are not included; mnemonic labels establish neither their values nor PC/RC.
4. **Actual accumulation:** `45EC40/45EC74`, `45EC6E/45EC95`, `45EC46/45ECC3`, in slices 001–002: prior A74/A78/A7C values are added to the respective scratch low DWORD plus 80000000 by three 32-bit LEAs, then stored. This independently proves “accumulate”.
5. **Signed clamp and first predicate:** `45EC7B/45ECD5`, `45ECED/45ECEF`, `45ED08/45ED0F`, `45ED2F/45ED31`, `45ED53/45ED59`, `45ED79/45ED7B`: signed JGE/JLE bounds FFFF8000/7FFF. Slices 002–004 show full DWORD writes and exact masks 81000000, 80800000, 00400000. No intervening integer-flag writer invalidates the first CMP.
6. **Unsigned byte projection:** `native-asm-004.txt:13-25`, `native-asm-005.txt:1-14`: CMP 255/JBE with SAR 31/NOT paths; stores AL, AL, CL. No preceding RGB shift; results come from raw wrapped registers, not the signed-clamped globals.
7. **Physical return:** `45EDC1` replaces EAX by EDX; `45EDEF/45EDF7/45EDFE` replace EAX with FLAG|80000 only when component 3 fails its unsigned byte range. `45EE0C` is plain RET. Therefore native EAX is component-2 residual (0..255, 0 or FFFFFFFF), or final flags, depending on component 3; not a stable scalar result.
8. **Reuse, not caller contract:** `native-metadata.json:174-210,224-264,512-516` records calls at 56CB7D, 56CBED, 657E24/657E56, 659455/65948D/6594C5, 659589/6595BD/6595F1/65962B and 701405. `:956-957` records no code targets and 116 instructions. No caller instruction bodies here prove use/ignorance of EAX or pairing order with another routine; B's claimed sibling call sequence is not established by this target's xrefs alone.

## Residuals and lead checks

- **UNCERTAIN numerical simplification:** scale=1/4096 is secondary compaction context; bias value is suggested by a label only. Capture both constant data ranges and x87 initialization/caller environment before replacing the island. Even with those values, at PC64 a bias addition can round to an extended half-integer and then round again at FSTP. Conditionally, IR0=1 and IR1=6143 gives product 6143/4096: under nearest-even PC64, the bias addition rounds to bias+1.5, then m64 store rounds to bias+2, whereas ideal `rint(product)` is 1. B's unconditional native-proven `rint` contract is therefore rejected. PC24 is another reason not to substitute ordinary `double`.
- **UNCERTAIN semantic API/name:** obtain bounded caller bodies if a return type or `Gte_GPL_sf1_lm0` name is desired. The status-bit layout plus accumulation supports a hypothesis, not a hardware-equivalent opcode claim; unshifted RGB and FP rounding must not be “corrected”.
- **Unvalidated compilation:** parent should compile i386, check memory-operand addressing/early-clobbers/x87 clobbers, callee-save restoration, absence of added calls/FP instructions, and compare emitted behavior against native. No compiler/test tools were run. Tool catalog exposes no Context Mode; analysis used only the permitted short bounded file reads, not an index/API workaround.
- **Suggested differential boundaries:** signed values −32769/−32768/32767/32768 after wrapped accumulation; byte values −1/0/255/256 and INT32 extremes; wrap crossing sign bit; each separate flag bit and combinations; component-3 in-range versus overflowing return branches; rounding ties under each supported PC/RC; FIFO old-entry capture and early tag/late byte writes.
- Parent still owns cryptographic readback, final §5.6 native validation and any promotion. This worker wrote only this output; no IDB, Git, ledger, registry, configuration, live state, delegated session or API mutation occurred.
