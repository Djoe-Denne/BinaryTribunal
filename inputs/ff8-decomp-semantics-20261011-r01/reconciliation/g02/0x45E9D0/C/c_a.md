# 0x45E9D0 — independent C A

## Boundary and provenance

Reconstruction only; not integration, promotion, or an equivalence-test result.
Model: GPT-6 Astra. Role: C A, this EA only.

- Input packet SHA-256: `20a01d8e22132e51bd91786c830d7529b9608a3d0cdabc88a1981ffcda06cf5e`.
- Common compaction SHA-256: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`.
- PE SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Read all of `inputs/ff8-decomp-semantics-20261011-r01/g02/common-compaction.md`, and `0x45E9D0.readable/{manifest.json,asm-001.txt,asm-002.txt,asm-003.txt,asm-004.txt,asm-005.txt,bytes-001.txt,metadata.json}` under that directory. Hashes above are cited from the manifest, not independently recomputed.
- Complete native range: `[0x45E9D0,0x45EBE9)`, one chunk, 537 bytes, 109 instructions, 22 CFG blocks. No truncated ASM used for reconstruction.
- Parent explicitly authorized a native inline-x87 core after the missing constant bytes/environment were reported. Neither the prose value of the float nor the numeric-looking double label is substituted for memory.

## Reconstruction contract

The following is **GNU C for 32-bit x86**, with GNU extended inline assembly in AT&T syntax. It is not ISO-portable C and is not claimed to be a drop-in binary/stack-layout replacement. Original absolute addresses must denote the original mapped storage. No external callee or library operation is introduced. Macros are source notation, not calls. The integer portion is expressed in C; the interleaved x87/load/store core remains native to preserve the inherited x87 control word, precision, rounding, exception masks, existing stack contents, and actual constant loads.

All memory access widths and their order are retained. The x87 core uses the same 8-byte scratch object for integer FILD inputs and binary64 FSTP outputs. Its numeric operations are not rewritten as C arithmetic, casts to integer, or a rounding-library call. The core has no FINIT, FLDCW, SSE conversion, or synthetic constant. In ordinary successful execution it temporarily uses two additional x87 slots, then removes both, leaving pre-existing x87 stack values in place. Native exception behavior of the actual x87 instructions is retained, but exception EIP, physical stack addresses, and compiler-generated C machine instructions are **not** asserted identical to the original function.

`eax`, `ecx`, `edx` represent 32-bit register bit patterns. Comparisons using XOR with `0x80000000` express signed ordering without implementation-defined unsigned-to-signed conversion. The byte saturation idiom retains its whole-register outcome: nonnegative out-of-range becomes `0xffffffff`, negative becomes zero. It is not replaced with full-register `255`.

```c
#include <stdint.h>

/* GNU alias-qualified word access; byte access uses unsigned char. */
typedef uint32_t alias_u32 __attribute__((__may_alias__));
#define MEM32(a) (*(volatile alias_u32 *)(uintptr_t)(a))
#define MEM8(a)  (*(volatile unsigned char *)(uintptr_t)(a))
#define SIGNED_KEY(x) ((uint32_t)(x) ^ UINT32_C(0x80000000))
/* Bit-exact NOT(SAR(x,31)); no signed right shift or signed overflow. */
#define NOT_SAR31(x) (~(UINT32_C(0) - ((uint32_t)(x) >> 31)))

/* Return type exposes the native EAX residue, NOT a semantic success value. */
uint32_t __attribute__((__cdecl__)) sub_45E9D0_reconstruction(void)
{
    uint32_t eax, ecx, edx, ebx_work;
    uint64_t scratch;
    unsigned int first_ge;

    /* Native block 45E9D0..45EA9E.
       SUB ESP,8 is represented by the private 8-byte scratch object.
       The exact physical home of scratch is compiler-selected.
       No C floating operations exist outside this asm. */
    __asm__ volatile (
        "movl 0x01ca8a64, %%eax\n\t"       /* 45E9D3 */
        "movl 0x01ca8a68, %%ecx\n\t"       /* 45E9D8 */
        "movl %%eax, 0x01ca8a60\n\t"
        "movl %%ecx, 0x01ca8a64\n\t"
        "movswl 0x01ca8a30, %%eax\n\t"
        "movswl 0x01ca8a34, %%ecx\n\t"
        "movl %%eax, %[tmp]\n\t"
        "movb 0x01ca8a2b, %%dl\n\t"
        "fildl %[tmp]\n\t"               /* 45EA01: signed m32 */
        "movl %%ecx, %[tmp]\n\t"
        "movb %%dl, 0x01ca8a6b\n\t"
        "movswl 0x01ca8a38, %%eax\n\t"
        "fmuls 0x00b695f8\n\t"           /* m32 real, NOT a constant */
        "fildl %[tmp]\n\t"
        "movl $0, 0x01ca92f8\n\t"
        "fmul %%st(1), %%st(0)\n\t"
        "faddl 0x00b693d8\n\t"           /* m64 real */
        "fstpl %[tmp]\n\t"              /* 45EA32: m64, not FISTP */
        "movl %[tmp], %%edx\n\t"         /* low dword of stored real */
        "movl %%eax, %[tmp]\n\t"
        "fildl %[tmp]\n\t"
        "addl $0x80000000, %%edx\n\t"    /* modulo 2^32 */
        "movl %%edx, 0x01ca8a74\n\t"
        "fmul %%st(1), %%st(0)\n\t"
        "faddl 0x00b693d8\n\t"
        "fstpl %[tmp]\n\t"
        "movl %[tmp], %%ecx\n\t"
        "leal -2147483648(%%ecx), %%eax\n\t"
        "movswl 0x01ca8a3c, %%ecx\n\t"
        "movl %%ecx, %[tmp]\n\t"
        "movl %%eax, 0x01ca8a78\n\t"
        "fildl %[tmp]\n\t"
        "fmul %%st(1), %%st(0)\n\t"
        "faddl 0x00b693d8\n\t"
        "fstpl %[tmp]\n\t"
        "movl %[tmp], %%ecx\n\t"
        "addl $0x80000000, %%ecx\n\t"
        "cmpl $0xffff8000, %%edx\n\t"     /* 45EA8E */
        "fstp %%st(0)\n\t"               /* 45EA94; integer flags survive */
        "movl %%ecx, 0x01ca8a7c\n\t"
        : "=&a" (eax), "=&c" (ecx), "=&d" (edx),
          [tmp] "=m" (scratch), "=@ccge" (first_ge)
        :
        : "memory", "st", "st(1)"
    );
    if (first_ge) goto L45EAB4;            /* 45EA9C: signed JGE */

L45EA9E:
    MEM32(0x01ca92f8) = UINT32_C(0x81000000);
    MEM32(0x01ca8a34) = UINT32_C(0xffff8000);
    goto L45EAD8;

L45EAB4:
    if (SIGNED_KEY(edx) <= UINT32_C(0x80007fff)) goto L45EAD2;
L45EABC:
    MEM32(0x01ca92f8) = UINT32_C(0x81000000);
    MEM32(0x01ca8a34) = UINT32_C(0x00007fff);
    goto L45EAD8;
L45EAD2:
    MEM32(0x01ca8a34) = edx;

L45EAD8:
    /* Original PUSH EBX saves incoming EBX; ebx_work is a private temporary. */
    if (SIGNED_KEY(eax) >= UINT32_C(0x7fff8000)) goto L45EAFE;
L45EAE0:
    ebx_work = MEM32(0x01ca92f8);
    MEM32(0x01ca8a38) = UINT32_C(0xffff8000);
    ebx_work |= UINT32_C(0x80800000);
    MEM32(0x01ca92f8) = ebx_work;
    goto L45EB28;
L45EAFE:
    if (SIGNED_KEY(eax) <= UINT32_C(0x80007fff)) goto L45EB23;
L45EB05:
    ebx_work = MEM32(0x01ca92f8);
    MEM32(0x01ca8a38) = UINT32_C(0x00007fff);
    ebx_work |= UINT32_C(0x80800000);
    MEM32(0x01ca92f8) = ebx_work;
    goto L45EB28;
L45EB23:
    MEM32(0x01ca8a38) = eax;

L45EB28:
    if (SIGNED_KEY(ecx) >= UINT32_C(0x7fff8000)) goto L45EB4E;
L45EB30:
    ebx_work = MEM32(0x01ca92f8);
    MEM32(0x01ca8a3c) = UINT32_C(0xffff8000);
    ebx_work |= UINT32_C(0x00400000);
    MEM32(0x01ca92f8) = ebx_work;
    goto L45EB7A;
L45EB4E:
    if (SIGNED_KEY(ecx) <= UINT32_C(0x80007fff)) goto L45EB74;
L45EB56:
    ebx_work = MEM32(0x01ca92f8);
    MEM32(0x01ca8a3c) = UINT32_C(0x00007fff);
    ebx_work |= UINT32_C(0x00400000);
    MEM32(0x01ca92f8) = ebx_work;
    goto L45EB7A;
L45EB74:
    MEM32(0x01ca8a3c) = ecx;

L45EB7A:
    if (edx <= UINT32_C(255)) goto L45EB99; /* unsigned JBE */
L45EB82:
    ebx_work = MEM32(0x01ca92f8);
    edx = NOT_SAR31(edx);
    ebx_work |= UINT32_C(0x00200000);
    MEM32(0x01ca92f8) = ebx_work;
L45EB99:
    /* Original CMP EAX,255 precedes store/POP EBX; neither changes its flags. */
    MEM8(0x01ca8a68) = (unsigned char)edx;
    /* Original POP EBX restores the incoming callee-saved register here. */
    if (eax <= UINT32_C(255)) goto L45EBBE;
L45EBA7:
    edx = MEM32(0x01ca92f8);
    eax = NOT_SAR31(eax);
    edx |= UINT32_C(0x00100000);
    MEM32(0x01ca92f8) = edx;
L45EBBE:
    /* Original CMP ECX,255 precedes this AL store, with flags preserved. */
    MEM8(0x01ca8a69) = (unsigned char)eax;
    if (ecx <= UINT32_C(255)) goto L45EBDF;
L45EBCB:
    eax = MEM32(0x01ca92f8);
    ecx = NOT_SAR31(ecx);
    eax |= UINT32_C(0x00080000);
    MEM32(0x01ca92f8) = eax;
L45EBDF:
    MEM8(0x01ca8a6a) = (unsigned char)ecx;
    /* Native ADD ESP,8; RET. Expose exact path-dependent EAX bit pattern. */
    return eax;
}

#undef NOT_SAR31
#undef SIGNED_KEY
#undef MEM8
#undef MEM32
```

### ABI, registers, stack and alias details

Native has no argument reads, no CALL, no home-slot argument setup, and plain RET (no immediate). A no-argument cdecl-shaped interface is compatible with those observations, but callers' declared prototypes are not in this gel. There is no right-to-left argument sequence to recover here. Original entry ESP is decreased by 8, then temporarily by another 4 at `45EADD` (saved EBX), restored by `45EBA4` and `45EBE5`; RET then consumes the return address. EBP/ESI/EDI are not modified; EBX is restored. The C compiler owns its own prologue, frame and callee-saved preservation, not the native offsets.

The inline core's early-clobber output registers are EAX/ECX/EDX (not available as the scratch operand's address registers), and its condition-code output represents the signed comparison at `45EA8E`; MOV and x87 FSTP after that comparison do not overwrite integer flags. Memory and the two transient x87 stack positions are declared clobbered. The core does not change ESP, so the compiler-chosen memory operand for `scratch` stays valid. It is fully written before each actual read; `=m` describes its write-only relationship to surrounding C, not the internal sequence of writes/reads.

The initial `MOV DL` changes only eight bits and is used only for the byte write to `1CA8A6B`; EDX is subsequently overwritten from scratch before any other use. There are no AX writes. Final AL/CL/DL stores change memory only, not the remainder of their registers. Whole-dword input reads at `1CA8A64/68` and low-word reads at `1CA8A30/34/38/3C` must not be interchanged. All IR output stores are DWORD, not WORD. Byte views of the final FIFO DWORD share storage with it; no duplicated independent global is introduced.

EAX on normal return is: the green raw result if green is in unsigned `[0,255]` and blue is in unsigned `[0,255]`; otherwise the full-register green saturation outcome (zero or `0xffffffff`) when only green is out of range; or the final status DWORD if blue is out of range. Consequently no boolean/colour/constant return is inferred. EDX and ECX are tracked through their last native uses, but their physical values at the C function's return are not ABI promises; neither are original EFLAGS, native stack residue, or exception instruction addresses.

## Coverage and evidence

Every CFG start in `metadata.json:11-173` is represented by the inline entry block or a corresponding C label:

| Native block start(s) | Reconstruction / evidence |
|---|---|
| 45E9D0 | Core plus signed first branch; `asm-001:1-25`, `asm-002:1-17` |
| 45EA9E,45EAB4,45EABC,45EAD2 | First signed clamp; `asm-002:18-25`, `asm-003:1` |
| 45EAD8,45EAE0,45EAFE,45EB05,45EB23 | Second signed clamp, temporary EBX; `asm-003:2-17` |
| 45EB28,45EB30,45EB4E,45EB56,45EB74 | Third signed clamp; `asm-003:18-25`, `asm-004:1-7` |
| 45EB7A,45EB82 | Unsigned red test and SAR/NOT; `asm-004:8-14` |
| 45EB99,45EBA7 | Red byte, EBX restore, green test/saturation; `asm-004:15-23` |
| 45EBBE,45EBCB,45EBDF | Green/blue byte writes, blue flag path, epilogue; `asm-004:24-25`, `asm-005:1-9` |

All 17 byte-slice lines were read. Critical opcode/width checks against them: `DB 44 24 00` is FILD m32, `D8 0D F8 95 B6 00` is FMUL m32 real, `DC 05 D8 93 B6 00` is FADD m64 real, `DD 5C 24 00` is FSTP m64, `DD D8` discards ST(0). Thus the scratch extraction is a low-dword bit read from a stored double, not an integer FIST conversion. The branch bytes distinguish signed `7D/7E` from unsigned `76`; `C1 FA/F8/F9 1F` and subsequent NOT operate on full DWORD registers.

## Bounded semantic description (supporting C, not a separate semantic verdict)

Suggested descriptive name: `ScaleSignedTriplet_ReplaceAccumulators_ClampAndPushPackedBytes`. High confidence in the observable transformation and storage widths; only tentative GTE/IR/MAC/RGB terminology, following the factual compaction rather than promoting a hardware opcode identity.

1. FIFO proof/name support: `45E9D3..45E9E3` copies old DWORDs `64 -> 60`, `68 -> 64`, and `45EA09` preserves the separate input tag byte as the new high byte. This supports “PushPackedBytes.”
2. Multiplication/name support: `45E9E9/45E9F0/45EA0F/45EA64` sign-extend four words; `45EA16` scales the first, and `45EA2A/45EA4E/45EA78` multiply the other three by that resident x87 value. This supports “ScaleSignedTriplet” without assuming the float's value.
3. Replacement proof: `45EA48/45EA6F/45EA96` store new raw DWORDs to `74/78/7C`; there are no reads of those old DWORDs. This supports “ReplaceAccumulators,” distinct from adding an old accumulator.
4. Signed clamp proof: `45EA8E..45EB74` compares signed values against -32768 and 32767 and writes DWORDs `34/38/3C`. The three masks are deliberately unequal: `81000000`, `80800000`, `00400000`.
5. Byte/flag proof: `45EB7A..45EBDF` applies unsigned comparisons with 255, SAR/NOT and byte stores. Byte checks use the raw result registers, not the clamped DWORD outputs; the red/green/blue masks are `00200000/00100000/00080000`.
6. ABI/xref proof: `metadata.json:174-204` records calls at `56CB64`, `56CBD4`, `5D9570`, `657E0F`, `657E42`; `metadata.json:1586-1587` records no outgoing code targets and 109 instructions. Callers' business meaning is not established by these xrefs alone.

## Explicit unknowns and validation boundary

- Bytes at `0xB695F8` and `0xB693D8` are not supplied in this readable gel. They remain actual runtime memory inputs, with their native operand widths and repeated load count. No constant-value proof is claimed from their labels or from the parent mentioning evidence outside this input.
- x87 PC/RC/masks/status/initial stack are not frozen. They remain inherited native inputs, not normalized. The source preserves the native x87 operation sequence, including exception-sensitive ordering of global writes relative to FILD/FMUL/FADD/FSTP. Arithmetic simplification under presumed round-to-nearest is not used.
- No assumption that status bit 31 must accompany every saturation: the third signed mask is only `0x00400000`. No extra division or right shift by four is inserted before byte packing.
- The compiler/assembler must support x86 GNU flag outputs and these x87 operands. The parent must inspect generated code for operand addressing, x87 instructions, no injected FP operations, and ABI preservation before using this reconstruction. Instruction identity is by mnemonic/operand width; original instruction addresses and exact regenerated encoding/layout are not claimed.
- No complete machine-state/trap-context equivalence is claimed for compiler-generated C. Non-x87 EFLAGS, caller-saved register residues other than exposed EAX, stack memory after return, and physical asynchronous observation of instruction boundaries are outside this C interface.
- No compilation, execution, differential test, checksum recomputation, or native integration was performed. Requested parent/R checks: all signed and unsigned boundaries (especially negative raw values), distinct status masks, blue-overflow EAX replacement, inherited x87 RC/PC modes, and the three low-dword binary64 extractions. These are validation requests, **not PASS results**.
