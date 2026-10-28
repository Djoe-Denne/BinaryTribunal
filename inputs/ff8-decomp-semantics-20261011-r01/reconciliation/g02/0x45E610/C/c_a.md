# 0x45E610 — independent C A

## Frozen input and coverage

- Role: C A only; target `0x45E610`, mission `ff8-decomp-semantics-20261011-r01`.
- Native packet SHA-256, quoted from `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E610.readable/manifest.json:3-4`: `942cc92944c0c0364bd9efa7a43e04b381f5fc1cdca6710c180140ba7b5af909`.
- Common compaction SHA-256, manifest:5: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`.
- EXE SHA-256, metadata:8: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; export timestamp metadata:9: `2026-10-11T16:38:25.140966+00:00`.
- Read manifest:1-25, common-compaction:1-24, asm-001.txt:1-18, bytes-001.txt:1-3, and metadata.json:1-3286, with contiguous metadata reads. All 18 instructions and the sole CFG block/chunk `[0x45E610,0x45E666)` (86 bytes) are covered. No omitted branch, tail chunk, argument access or callee.
- Hashes are supplied provenance, not independently recomputed here. Native bytes remain authority; compaction names/comments are hypotheses.

## Complete C

This is a C11 translation unit for a 32-bit x86 ABI. The eight external objects are bindings to the distinct native addresses in the comments, not new independent copies of native state. The integrator owns those bindings. Volatile accesses preserve the native memory access widths and ordering; no `restrict` assumption, guard, saturation, library call or invented callee is introduced.

```c
#include <stdint.h>

#if defined(_MSC_VER)
#define FF8_CDECL __cdecl
#elif defined(__GNUC__) && defined(__i386__)
#define FF8_CDECL __attribute__((cdecl))
#else
#define FF8_CDECL
#endif

extern volatile uint32_t dword_1CA8A5C; /* address 0x01CA8A5C */
extern volatile uint32_t dword_1CA8A58; /* address 0x01CA8A58 */
extern volatile uint32_t dword_1CA8A54; /* address 0x01CA8A54 */
extern volatile uint32_t dword_1CA8A50; /* address 0x01CA8A50 */
extern volatile int16_t  word_1CA92F4;  /* address 0x01CA92F4 */
extern volatile uint32_t dword_1CA92F8; /* address 0x01CA92F8 */
extern volatile uint32_t dword_1CA8A2C; /* address 0x01CA8A2C */
extern volatile uint32_t dword_1CA8A70; /* address 0x01CA8A70 */

uint32_t FF8_CDECL sub_45E610(void)
{
    uint32_t eax, ecx, edx;

    eax = dword_1CA8A5C;                  /* 0045E610 */
    ecx = dword_1CA8A58;                  /* 0045E615 */
    edx = dword_1CA8A54;                  /* 0045E61B */
    eax &= UINT32_C(0xFFFF);              /* 0045E621 */
    ecx &= UINT32_C(0xFFFF);              /* 0045E626 */
    edx &= UINT32_C(0xFFFF);              /* 0045E62C */
    eax += ecx;                          /* 0045E632 */
    ecx = dword_1CA8A50;                  /* 0045E634 */
    eax += edx;                          /* 0045E63A */
    ecx &= UINT32_C(0xFFFF);              /* 0045E63C */
    edx = (uint32_t)(int32_t)word_1CA92F4; /* 0045E642: MOVSX */
    eax += ecx;                          /* 0045E649 */
    dword_1CA92F8 = UINT32_C(0);          /* 0045E64B */
    eax *= edx;                          /* 0045E655: IMUL low 32 */
    eax >>= 12;                          /* 0045E658: SHR, not SAR */
    dword_1CA8A2C = eax;                  /* 0045E65B */
    dword_1CA8A70 = eax;                  /* 0045E660 */
    return eax;                          /* 0045E665 */
}
```

On the specified x86 target, `uint32_t` arithmetic is unsigned 32-bit arithmetic (no widening signed integer promotion). Converting the sign-extended factor to `uint32_t` gives its exact two's-complement EDX bits. Unsigned multiplication modulo `2^32` equals the low 32 bits of two-operand signed `IMUL`, without signed-overflow UB. No `int16_t` pointer is used to read the four DWORD inputs: their entire 32-bit loads precede the explicit masks, as in the native code.

## Contract, ABI and numerical limits

- No stack/register arguments are read. The native leaf neither allocates stack space nor pushes anything; `C3` returns by popping only the return address. Cdecl-compatible no-argument interface; no pushed right-to-left argument order applies. A formal historical prototype or caller use of the return is not established by the packet.
- Four input DWORDs contribute unsigned low halves, in read order `5C,58,54,50`. Their sum is in `[0,262140]`, so the three native additions cannot overflow for these masked operands.
- Read the signed 16-bit scale at `92F4` before clearing the 32-bit state word at `92F8`. The signed mathematical product can exceed signed or unsigned 32-bit range; its low 32 bits, not a wider product shifted first, are retained.
- Result bits: `R = ((sum * sign_extend_16(scale)) mod 2^32) logically shifted right by 12`. Thus `R` is in `[0,0xFFFFF]`. This is not an arithmetic shift or signed division, and is not clamped to 16 bits. In particular, sum 1 and factor -1 imply `R=0xFFFFF` by the instructions; that is a derivation, not an executed test.
- Writes, in order: DWORD `92F8=0`, DWORD `8A2C=R`, DWORD `8A70=R`; EAX also contains R at return. All eight bound objects occupy distinct nonoverlapping native ranges. Output-input aliasing is not present at those addresses; input loads remain sequenced before stores.
- EAX/ECX/EDX are the only modified general registers: native exit ECX is the masked input at `8A50`, EDX is the sign-extended scale. EBX/ESI/EDI/EBP are untouched. No partial AL/AX destination writes; the WORD memory read is explicitly widened to all of EDX. No x87/SSE instructions or floating-point-environment dependence.
- The C captures ABI-visible result and native global effects, not exact instruction scheduling, caller-saved ECX/EDX residues or EFLAGS as an exported C contract. Native final arithmetic flags come from SHR: CF is product bit 11; SF=0, ZF follows R, PF follows its low byte; OF/AF are undefined for this shift count. MOV stores/RET do not modify those flags. If any nonstandard caller consumes flags or volatile-register residues, parent must separately authorize a register-state wrapper; the xrefs alone do not establish such consumption.

## Semantic interpretation and proofs

**Mechanical role, high confidence:** global-state four-U16 sum, signed-scale low-32 multiplication, logical rescaling by 12, state-word reset and duplicated result storage. Proposed descriptive name: `Sum4U16_ScaleS16_Wrap32_Lsr12`. **Contextual candidate:** `Gte_AVSZ4`, moderate confidence only as a GTE-emulation role; the provided label is not proof of hardware-equivalent behavior. In particular, no hardware-style saturation or overflow flags are added.

Proofs (paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E610.readable/`):

1. `asm-001.txt:1-10,12`, EAs `45E610-45E649`: four distinct DWORD loads, each `AND 0xFFFF`, and three sums. **Name proof 1:** establishes `Sum4U16`, not signed depths or an implicit average divided by four.
2. `asm-001.txt:11,14-15`: signed WORD widening, two-operand IMUL and logical SHR 12. **Name proof 2:** establishes `ScaleS16_Wrap32_Lsr12`, including negative-factor behavior, independently of the label.
3. `bytes-001.txt:2-3`: `0F BF 15 F4 92 CA 01`, `0F AF C2`, `C1 E8 0C` corroborate signed source extension, low-32 multiply and SHR rather than SAR. All 86 bytes agree with the displayed operand widths/addresses and terminal `C3` on manual inspection.
4. `asm-001.txt:13,16-17`: unconditional clear at `45E64B`, followed by stores at `45E65B/45E660`; establishes reset-before-output and identical DWORD results, not any clamp/status accumulation.
5. `metadata.json:11-17,3284-3285`, `asm-001.txt:18`: one CFG block ending `45E666`, 18 instructions, empty direct code-target list, and no call in the complete ASM; establishes leaf coverage, no hidden library call.
6. `metadata.json:19-30,217-222`: native code xrefs from `547F65` (function `547E60`), `556291` (function `5561E0`), `5AA11F` (function `5A9C10`). These establish multiple call sites, not caller parameter/return contracts or business names. `common-compaction.md:6,15` supplies broader GTE context only.

## Explicit unknowns and validation status

- Native object ownership, full enclosing state layout, volatile/concurrency policy, historical declared return type and callers' use of EAX are not supplied. Eight address-specific bindings are an integration requirement, not a fabricated structure. `uint32_t` return intentionally exposes the proven EAX bit pattern.
- No claim of PSX AVSZ4 hardware equivalence, ZSF/OTZ/MAC register mapping, valid-scale domain, or saturation. Negative scale and wrap behavior are retained exactly even when surprising.
- Completed: full bounded source reading and manual ASM/byte operand/coverage comparison. Not executed: compilation, linking/address binding checks, automated hashes, emulator/differential tests, live tests or final §5.6 validation. Parent should check wrap-before-shift, negative scale, upper input halves, zero factor, max masked sums and store order in its separately authorized validation.
- Output hash not computed here; parent may compute it. No file outside this owned deliverable was written.
