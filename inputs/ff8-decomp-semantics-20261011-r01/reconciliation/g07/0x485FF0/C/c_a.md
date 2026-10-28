# Independent C A — 0x00485FF0

## Frozen inputs and scope

- Manifest: `inputs/ff8-decomp-semantics-20261011-r01/g07/0x485FF0.readable/manifest.json:1–30`.
- Original packet SHA-256, **quoted from manifest**, not recomputed: `cda0002d86ac4ddd92e07c4113dc843be7e9918846d93248d7039944999ac590`.
- Common-compaction SHA-256, quoted from manifest: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
- Read all of `asm-001.txt` (25 instructions), `asm-002.txt` (12 instructions), `bytes-001.txt` (complete 132 bytes), and `metadata.json` (CFG/xrefs/native metadata). One half-open chunk: `[0x00485FF0,0x00486074)`.
- EXE SHA-256 from metadata: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; export `2026-10-11T16:38:25.140966+00:00`.
- Only authorized frozen context was used for this production. Embedded semantic labels/comments are not premises.

## Complete C

This is a fixed-address **32-bit x86, little-endian** reconstruction. Its unsigned return exposes the final machine EAX value; it does **not** assert that the original source declared a meaningful return value. No parameters are read by the native function. Address expressions use explicit 32-bit wrapping. Volatile accesses retain both independent byte tests, their conditional order, and the two ordered WORD stores; the C introduces no snapshot or extra read.

```c
#include <stdint.h>

#if defined(_MSC_VER)
# define FF8_CDECL __cdecl
#elif defined(__GNUC__) && defined(__i386__)
# define FF8_CDECL __attribute__((cdecl))
#else
# define FF8_CDECL
#endif

/* Target contract: 32-bit x86 addressing and little-endian uint16_t stores.
 * For a signed x86 comparison, xor 0x80000000 maps signed ordering
 * into unsigned ordering without an implementation-defined signed cast.
 */
uint32_t FF8_CDECL sub_00485FF0(void)
{
    uint32_t eax;
    uint32_t ecx;
    uint32_t edx;
    uint8_t bl;

    /* 00485FF0 PUSH EBX: preserved by the native ABI, not an input.
     * 00485FF1..00485FFD: full ECX/EAX/EDX writes, partial BL write. */
    ecx = UINT32_C(0);
    eax = UINT32_C(0x000004E0);
    edx = UINT32_C(1);
    bl = UINT8_C(0x40);

L_00485FFF:
    ecx = (uint32_t)(ecx << 1);
    if ((*(volatile uint8_t *)(uintptr_t)
             (uint32_t)(UINT32_C(0x01D27B8C) + eax)
         & (uint8_t)edx) == 0)
        goto L_00486022;

    /* 00486009..0048600F: a second read, not a reused first value. */
    if ((*(volatile uint8_t *)(uintptr_t)
             (uint32_t)(UINT32_C(0x01D27B8C) + eax)
         & bl) != 0)
        goto L_00486022;

    /* 00486011..00486016: signed JGE. */
    if ((eax ^ UINT32_C(0x80000000)) >=
        (UINT32_C(0x00000270) ^ UINT32_C(0x80000000)))
        goto L_00486020;

    /* 00486018..0048601E: BYTE read, not a WORD status read. */
    if ((*(volatile uint8_t *)(uintptr_t)
             (uint32_t)(UINT32_C(0x01D27B90) + eax)
         & (uint8_t)edx) != 0)
        goto L_00486022;

L_00486020:
    ecx |= edx;

L_00486022:
    eax = (uint32_t)(eax - UINT32_C(0xD0));
    /* 00486027..0048602C: signed JG against -208, not unsigned JG. */
    if ((eax ^ UINT32_C(0x80000000)) >
        (UINT32_C(0xFFFFFF30) ^ UINT32_C(0x80000000)))
        goto L_00485FFF;

    /* 0048602E: exactly one WORD store of CX. */
    *(volatile uint16_t *)(uintptr_t)UINT32_C(0x01CFF570) = (uint16_t)ecx;
    ecx = UINT32_C(0);
    eax = UINT32_C(0x000004E0);

L_0048603C:
    ecx = (uint32_t)(ecx << 1);
    if ((*(volatile uint8_t *)(uintptr_t)
             (uint32_t)(UINT32_C(0x01D27B8C) + eax)
         & (uint8_t)edx) == 0)
        goto L_0048605F;

    /* 00486046..0048604C: another independent BYTE read. */
    if ((*(volatile uint8_t *)(uintptr_t)
             (uint32_t)(UINT32_C(0x01D27B8C) + eax)
         & bl) != 0)
        goto L_0048605F;

    /* 0048604E..00486053: signed JL, opposite to the first pass. */
    if ((eax ^ UINT32_C(0x80000000)) <
        (UINT32_C(0x00000270) ^ UINT32_C(0x80000000)))
        goto L_0048605D;

    if ((*(volatile uint8_t *)(uintptr_t)
             (uint32_t)(UINT32_C(0x01D27B90) + eax)
         & (uint8_t)edx) != 0)
        goto L_0048605F;

L_0048605D:
    ecx |= edx;

L_0048605F:
    eax = (uint32_t)(eax - UINT32_C(0xD0));
    if ((eax ^ UINT32_C(0x80000000)) >
        (UINT32_C(0xFFFFFF30) ^ UINT32_C(0x80000000)))
        goto L_0048603C;

    /* 0048606B: exactly one WORD store, after completing the second pass. */
    *(volatile uint16_t *)(uintptr_t)UINT32_C(0x01CFF572) = (uint16_t)ecx;
    /* 00486072 POP EBX; 00486073 RET, without argument cleanup. */
    return eax;
}
```

## Coverage and machine contract

All 37 instructions and all 15 metadata CFG blocks are represented. CFG block starts, in native order: `485FF0`, `485FFF`, `486009`, `486011`, `486018`, `486020`, `486022`, `48602E`, `48603C`, `486046`, `48604E`, `486055`, `48605D`, `48605F`, `48606B`. The two tests of the flag byte must remain separate, even at the same address. No flags/status read occurs after a taken rejection branch. The first output store precedes every second-pass load.

- Native frame: one saved DWORD EBX at entry; no local-stack allocation, stack arguments, nested calls, or callee cleanup. POP restores the complete EBX, including the original BL. RET consumes the caller's return address. ESI/EDI/EBP are untouched. C ABI preservation is a target/toolchain requirement, not a claim about generated code already inspected.
- EDX is fully set to 1; both passes use DL=1 and the full EDX=1 for OR. BL is set to `0x40`; EBX's upper 24 bits never affect a computation and are restored at exit. No AL or AX write occurs. EAX writes are full-width; CX stores do not modify ECX.
- EAX visits `4E0,410,340,270,1A0,D0,0`, then wraps to `FFFFFF30` after the last SUB. The signed exit comparison stops at equality with -208. The subtraction and SHL use uint32 arithmetic; each shift count is exactly 1. Actual ECX values are at most `0x7F`.
- Native exit EAX=`0xFFFFFF30`, EDX=1, ECX=second accumulated mask. The C exposes EAX but does not promise the same physical ECX/EDX placement after compilation; these are caller-saved register side effects, not established source-level outputs. Final arithmetic flags come from `CMP EAX,0xFFFFFF30` (equal: ZF=1, CF=0, SF=0, OF=0, AF=0, PF=1); MOV/POP/RET leave those arithmetic flags alone. The C does not expose EFLAGS as an ABI output.
- No floating-point/SSE/x87 instruction exists in the chunk. No x87 rounding mode, precision mode, exception state, stack effect, or environment dependency is introduced; native x87/MXCSR state is untouched. No library calls or invented native callees occur.
- Fixed addresses denote valid mapped native globals. No null/range checks or synchronization are added. The two output WORDs are adjacent but do not overlap each other or any input address visited here. Aliasing with other program objects is not suppressed by `restrict` or a speculative structure definition.

## Proof anchors and bounded interpretation

1. `485FF3/486022/486027/48602C` (bytes slice lines 1–2): start `0x4E0`, stride subtraction `0xD0`, signed terminal -208. Seven rows, descending 6..0; SHL before OR makes bit index equal row index.
2. `486001/486009` and `48603E/486046`: bytes encode input address `0x01D27B8C+EAX`, BYTE tests `0x01` then `0x40`. Acceptance requires the first bit set and the second clear. This follows tests/branches, not the field label.
3. `486011/486016/486018`: signed threshold `0x270` bypasses the status test for rows 3..6 in pass A; rows 0..2 require bit 0 clear at `0x01D27B90+EAX`.
4. `48604E/486053/486055`: pass B bypasses that status test for rows 0..2 instead; rows 3..6 require bit 0 clear. Reversing this branch would change the result.
5. `48602E` and `48606B` (operand-size prefix `66`, bytes slice lines 2–5): distinct WORD stores at `0x01CFF570` and `0x01CFF572`; not DWORD stores or flag mutations.
6. `485FF0/486072/486073`: EBX save/restore and plain near RET; no incoming argument consumption and no nested call (`metadata.json:206`, empty code-target list).
7. `metadata.json:157–162` records incoming code xref `493A23` owned by `493840`; common-compaction lines 49–51 supplies the frozen neighboring instruction provenance. This establishes a caller connection only, not a purpose inferred from the caller's name.

The native calculation is two eligibility bitmasks over seven D0-spaced rows. The common layout associates these rows with battle slots, but names such as “alive”, “Death”, “visibility”, or “targetable” are not needed to reconstruct the C. In particular bit `0x40` is excluded, not included. No independent semantic deliverable or naming verdict is supplied by this C author.

## Uncertainties and validation status

- Original source return type is unknown. Returning EAX here is an explicit machine-value adapter, not proof of an intended result contract. Exact caller-saved register/EFLAGS exposure would need a separately authorized assembly wrapper or machine-state harness if required.
- C integer-to-pointer conversions and aligned uint16 stores rely on the specified native x86 implementation. Volatile source order is explicit, but compiler emission of exact access widths/prologue/register choices still requires lead review. This is not a verified drop-in binary replacement.
- Concurrent mutation between repeated reads or between passes is possible; no stability assumption, cached snapshot, atomicity enhancement, or extra guard was inserted. Machine/device-level concurrent behavior beyond the native execution model is not validated here.
- Static manual opcode/ASM/CFG comparison only. **No compilation, tests, differential execution, runtime validation, or output-hash calculation was performed.** Requested lead checks: compile for the 32-bit target, inspect BYTE/WORD access widths and retained ordered reads, and compare both masks including the row-2/row-3 threshold and rejection paths. A requested check is not a PASS.
