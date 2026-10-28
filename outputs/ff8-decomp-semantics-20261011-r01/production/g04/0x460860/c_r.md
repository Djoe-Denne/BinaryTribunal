# 0x460860 — C R, reconciled against native instructions

## Verdict and provenance

**RECONCILED, complete instruction-level C/x86 implementation; NOT compiled or promoted.** Portable pure-C equivalence under an unspecified x87 environment remains **UNCERTAIN**. This is the C volet only, not acceptance of a separate semantic volet.

Read only the supplied C projection and common instructions. Coverage: the single 654-byte chunk `[0x460860,0x460AEE)`, all 177 instructions, all 22 CFG blocks, all three exits. ASM slices 001–008, bytes 001–002 and complete metadata were read. The original packet's long ASM string is presentation-truncated by the reader; the complete slices supply that string without loss.

Frozen authors, from `manifest.json`:

| Role | Session | Model.Ref | Candidate SHA256 |
|---|---|---|---|
| A | `ses_ed3e73d0dffe5A5manulEklGEi` | `openai/gpt-6-astra`, high | `e475093377896953566c20ba53713f2cfb16d908e06cb29d5aecb7c4d5c70727` |
| B | `ses_ed3e73b68ffeluxjFf4Fqo47V2` | `opencode/claude-opus-5-5`, high | `d02fb9768df3c8989864a5b016416d0561d68ccb49e65a567ee02494803e982a` |

Packet SHA256: `9384e033a8c2529b83d45416bffb9fc86fec628fa40990f5f60610486739861a`.
Compaction SHA256: `1ffd99c0ab16a51b4b5c26f906c3ff61d657fd111e6c8720353e656c88add668`.
Native input SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Both authors are present, session IDs disjoint, and their cited common hashes agree with both manifests. Hashes are supplied provenance, not independently recomputed here: no authorized file-hashing primitive is exposed. Parent owns content hash verification. No observed hash inconsistency; no claim of independent native Model.Ref verification. No peer/history/index/other-volet lookup was performed.

## Convergences, divergences and common-error checks

| Topic | A / B | Native ruling |
|---|---|---|
| Decoder, strides, outputs | Agree on selectors, matrix stride32, vector stride8, addend stride32, signed clamps | Confirmed by immediate address bytes and MOVSX/MOV/JGE/JLE, not by agreement. Selector3 skips addend reads entirely. |
| x87 implementation | A retains exact x87 island; B uses C `double` expressions and a union | Keep actual FILD/FMUL/FADDP/FADD/FSTP. Unknown PC/RC and exception state prohibit a universal `double` substitute. No cast/FISTP/rounding library is introduced. |
| Precision claim | B says all products/sums exact in 53/64-bit precision | Does not cover x87 PC24: products/sums can need more than 24 significant bits, and bias FADD also depends on PC. Even PC64 may double-round on the binary64 spill. Preserve instructions rather than assume a control word. |
| Read widths/order | A exact WORD reads and prefetch interleave; B feedback uses DWORD reads before LOW_S16, ordinary nonvolatile globals, rearranged row reads | Native feedback reads **2 bytes**, not 4. Coefficient reads are indices **2,1,0,5,4,8,3,7,6**. Preserve every width and interleave, even where fixed address ranges are disjoint. |
| Writable incoming argument | A intends writes via an addressed C parameter, requiring emitted-code verification; B explicitly omits this effect | Native `[entry ESP+4]` is scratch, final value = sign extension of selected matrix WORD at +0x0C. Reconciled naked body uses exactly that home and frame, avoiding compiler-dependent parameter remapping. |
| ABI certainty | Both model whole EAX, but source return type is unknown | Preserve native EAX: third wrapped result if in range, updated status if third result clamps. Caller cleanup, preserved EBX/ESI/EDI/EBP, full DWORD writes. No AL/AX return or partial-register arithmetic. |
| Semantic strength | A descriptive role/high confidence; B stronger complete GTE/register identity claims | Computational role is established. GTE-MVMVA-like identification is plausible, not proof of faithful hardware emulation or each bank's business identity. B's hardware-comparison phrase “round-to-nearest” is not established without RC. |
| Status | Both retain masks; B calls flags sticky in role prose | Status is cleared on **each invocation** at 0x460A1F, then accumulated within that invocation. Third-component clamp only ORs 0x00400000, not bit31. Preserve asymmetric third-output/status store order. |
| Bias | Both use 2^52+2^31 | Correct value is supported by constant bytes in common compaction, not the IDA label. Preserve memory reads at 0xB693D8/0xB69600 rather than embed presumed immutable C constants. |

There is no unresolved instruction/CFG conflict. Compilation, original source types, incoming FPU environment and stronger business identities remain explicitly unvalidated. Agreement does not establish any of those.

## Complete faithful C implementation

Target-specific **32-bit MS-compatible C with inline x86**, not portable ISO C. `__declspec(naked)` prevents a compiler prologue/epilogue, extra floating-point operations or copied parameter home. This is deliberately a full native instruction body inside a C callable definition, rather than a misleading pure-C numerical approximation. Instructions are primitives, **not helper calls**. No new native calls, guards or control-word changes occur.

Absolute VAs require the original mapped image/state (or a separately verified relocation). The prototype specifies observed EAX bits, not a recovered source-language return contract. Exact binary64 constants remain live memory operands. All memory operations, frame offsets, arithmetic and return paths below are native. Compilation/disassembly verification is still required before integration.

```c
#include <stdint.h>

__declspec(naked) uint32_t __cdecl ea_00460860(uint32_t command)
{
    __asm {
        // 00460860: exact entry, writable argument at current ESP+18h.
        sub esp, 8
        push ebx
        push esi
        push edi
        mov edi, dword ptr [esp+18h]
        mov ecx, edi
        mov eax, edi
        sar ecx, 0Dh
        and ecx, 3
        mov edx, edi
        sar eax, 11h
        and eax, 3
        mov esi, ecx
        sar edx, 0Fh
        shl eax, 5
        shl esi, 5
        and edx, 3
        add eax, 01CA927Ch
        add esi, 01CA9290h
        cmp edx, 3
        jnz L_4608C9

        // 0046089A: feedback source, signed low WORDs of DWORD slots.
        movsx edx, word ptr ds:[01CA8A34h]
        mov dword ptr [esp+18h], edx
        movsx edx, word ptr ds:[01CA8A38h]
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], edx
        movsx edx, word ptr ds:[01CA8A3Ch]
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], edx
        fild dword ptr [esp+18h]
        jmp L_4608F9

    L_4608C9:
        movsx ebx, word ptr [edx*8+01CA8A10h]
        mov dword ptr [esp+18h], ebx
        movsx ebx, word ptr [edx*8+01CA8A12h]
        fild dword ptr [esp+18h]
        movsx edx, word ptr [edx*8+01CA8A14h]
        mov dword ptr [esp+18h], ebx
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], edx
        fild dword ptr [esp+18h]

    L_4608F9:
        test edi, 80000h
        jz L_46091B
        // 00460901: scale v0, v1, v2 without changing incoming x87 CW.
        fxch st(2)
        fmul qword ptr ds:[00B69600h]
        fxch st(2)
        fxch st(1)
        fmul qword ptr ds:[00B69600h]
        fxch st(1)
        fmul qword ptr ds:[00B69600h]

    L_46091B:
        movsx edx, word ptr [eax+4]
        mov dword ptr [esp+18h], edx
        fild dword ptr [esp+18h]
        movsx edx, word ptr [eax+2]
        fmul st, st(1)
        mov dword ptr [esp+18h], edx
        fild dword ptr [esp+18h]
        movsx edx, word ptr [eax]
        fmul st, st(3)
        mov dword ptr [esp+18h], edx
        movsx edi, word ptr [eax+0Ah]
        faddp st(1), st
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], edi
        movsx edi, word ptr [eax+8]
        fmul st, st(4)
        movsx ebx, word ptr [eax+10h]
        faddp st(1), st
        fadd qword ptr ds:[00B693D8h]
        fstp qword ptr [esp+0Ch]
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], edi
        mov edx, dword ptr [esp+0Ch]
        movsx edi, word ptr [eax+6]
        fmul st, st(1)
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], edi
        add edx, 80000000h
        mov dword ptr ds:[01CA8A74h], edx
        fmul st, st(3)
        faddp st(1), st
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], ebx
        movsx ebx, word ptr [eax+0Eh]
        fmul st, st(4)
        movsx eax, word ptr [eax+0Ch]
        faddp st(1), st
        fadd qword ptr ds:[00B693D8h]
        fstp qword ptr [esp+0Ch]
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], ebx
        mov edi, dword ptr [esp+0Ch]
        add edi, 80000000h
        fmul st, st(1)
        fild dword ptr [esp+18h]
        mov dword ptr [esp+18h], eax
        mov dword ptr ds:[01CA8A78h], edi
        fmul st, st(3)
        faddp st(1), st
        fild dword ptr [esp+18h]
        fmul st, st(4)
        faddp st(1), st
        fadd qword ptr ds:[00B693D8h]
        fstp qword ptr [esp+0Ch]
        mov eax, dword ptr [esp+0Ch]
        fstp st(0)
        fstp st(0)
        add eax, 80000000h
        cmp ecx, 3
        fstp st(0)
        mov dword ptr ds:[01CA8A7Ch], eax
        jz L_460A1A

        // 004609FB: read/read/add/read/add/add, all additions wrap32.
        mov ecx, dword ptr [esi]
        mov ebx, dword ptr [esi+4]
        add edx, ecx
        mov ecx, dword ptr [esi+8]
        add edi, ebx
        add eax, ecx
        mov dword ptr ds:[01CA8A74h], edx
        mov dword ptr ds:[01CA8A78h], edi
        mov dword ptr ds:[01CA8A7Ch], eax

    L_460A1A:
        mov esi, 0FFFF8000h
        mov dword ptr ds:[01CA92F8h], 0
        cmp edx, esi
        mov ecx, 7FFFh
        jge L_460A44
        // 00460A32
        mov dword ptr ds:[01CA92F8h], 81000000h
        mov dword ptr ds:[01CA8A34h], esi
        jmp L_460A60

    L_460A44:
        cmp edx, ecx
        jle L_460A5A
        // 00460A48
        mov dword ptr ds:[01CA92F8h], 81000000h
        mov dword ptr ds:[01CA8A34h], ecx
        jmp L_460A60

    L_460A5A:
        mov dword ptr ds:[01CA8A34h], edx

    L_460A60:
        cmp edi, esi
        jge L_460A7E
        // 00460A64
        mov edx, dword ptr ds:[01CA92F8h]
        mov dword ptr ds:[01CA8A38h], esi
        or edx, 80800000h
        mov dword ptr ds:[01CA92F8h], edx
        jmp L_460AA2

    L_460A7E:
        cmp edi, ecx
        jle L_460A9C
        // 00460A82
        mov edx, dword ptr ds:[01CA92F8h]
        mov dword ptr ds:[01CA8A38h], ecx
        or edx, 80800000h
        mov dword ptr ds:[01CA92F8h], edx
        jmp L_460AA2

    L_460A9C:
        mov dword ptr ds:[01CA8A38h], edi

    L_460AA2:
        cmp eax, esi
        jge L_460AC2
        // 00460AA6: low clamp writes output before status.
        mov eax, dword ptr ds:[01CA92F8h]
        mov dword ptr ds:[01CA8A3Ch], esi
        or eax, 400000h
        pop edi
        pop esi
        mov dword ptr ds:[01CA92F8h], eax
        pop ebx
        add esp, 8
        ret

    L_460AC2:
        cmp eax, ecx
        jle L_460AE2
        // 00460AC6: high clamp writes status before output.
        mov eax, dword ptr ds:[01CA92F8h]
        pop edi
        or eax, 400000h
        pop esi
        mov dword ptr ds:[01CA92F8h], eax
        mov dword ptr ds:[01CA8A3Ch], ecx
        pop ebx
        add esp, 8
        ret

    L_460AE2:
        pop edi
        pop esi
        mov dword ptr ds:[01CA8A3Ch], eax
        pop ebx
        add esp, 8
        ret
    }
}
```

No C signed overflow, implementation-defined signed casts, unspecified expression evaluation order or floating-point contraction is involved. Actual SAR/AND and SHL instructions preserve all x86 shifts. Whole-register MOVSX gives sign extension of every source WORD; no AL/AX writes exist. Input bits outside 13–19 are ignored by this body. The frame home is overwritten even when no external caller inspects it. The nine wrappers' cleanup observations are not needed to justify that effect: the stores themselves prove it.

The x87 stack keeps `[v2,v1,v0]` and evaluates each row as `(m2*v2 + m1*v1) + m0*v0` with the displayed operations. Conversion is **memory FADD bias, FSTP binary64, low-DWORD load, ADD 0x80000000**, not integer conversion. Incoming precision, rounding, sticky exceptions and masking are retained. Five additional temporary stack entries are required at peak; net stack depth is unchanged on ordinary completion. No guard for an already-full x87 stack is added. Rebuilt x87 instruction/data-pointer fields identify rebuilt code/local storage, so relocated exception-pointer/address identity is not promised.

## Coverage and exact evidence anchors

All native CFG starts are covered, including fallthrough blocks without a separate C label:

| CFG starts | Body region |
|---|---|
| 460860 | prologue and decoder |
| 46089A, 4608C9 | feedback / packed-vector sources |
| 4608F9, 460901 | bit19 test / scaling |
| 46091B | three full row computations, spills, raw stores and pops |
| 4609FB | optional three DWORD additions and re-stores |
| 460A1A, 460A32, 460A44, 460A48, 460A5A | status reset and first signed clamp |
| 460A60, 460A64, 460A7E, 460A82, 460A9C | second signed clamp |
| 460AA2, 460AA6, 460AC2, 460AC6, 460AE2 | third signed clamp and three epilogues |

Eight exact proof groups, independently checked against the supplied ASM/bytes:

1. **0x460866–0x460898**: `8B7C2418`, SAR shifts13/17/15, AND3, SHL5, immediate bases **0x1CA927C / 0x1CA9290**. Proves one command DWORD and independent selected banks.
2. **0x46089A / 0x4608A5 / 0x4608B4** versus **0x4608C9 / 0x4608D5 / 0x4608E1**: MOVSX WORD feedback stride4 or packed vector stride8. Proves selected signed triple, not a passed pointer.
3. **0x4608F9–0x460915**: TEST0x80000 and three `DC0D0096B600` FMUL-m64 operands with FXCH. Proves conditional scaling in v0,v1,v2 order; value 2^-12 is supplied constant-byte evidence from compaction:26.
4. **0x46091B–0x4609DE**: nine MOVSX WORD coefficient loads and three FMUL/FADDP rows; `DC05D893B600` and `DD5C240C` prove FADD-m64 bias and binary64 spill, not FISTP. Bias 2^52+2^31 is supplied constant-byte evidence from compaction:27.
5. **0x460982 / 0x4609C6 / 0x4609F4**, then **0x4609F9–0x460A15**: first raw DWORD stores, selector3 skip, three DWORD loads/adds/re-stores. Proves two-stage output and post-conversion wrapping addition.
6. **0x460A1F–0x460A9C**: status zero, signed JGE/JLE against FFFF8000/00007FFF, MOV0x81000000 and OR0x80800000, full DWORD output stores. Proves signed16 saturation and per-call flag accumulation.
7. **0x460AA6–0x460AED**: OR0x00400000 and three plain C3 returns; low/high output/status ordering differs. Proves asymmetric mask, caller cleanup and path-dependent whole EAX.
8. **xref sites 0x4607D5/E5/F5, 0x460805/815/825/835/845/855** in metadata: nine direct inbound calls. Common compaction:31–41 supplies independently byte-checked PUSH-immediate/CALL/POP-ECX/RET wrappers with varying selector fields and bit19 set. Wrapper bytes were not recaptured by R; no stronger caller-use inference follows.

## Local role/contract (bounded, not a separate semantic-R verdict)

Proposed descriptive name: **`selected_matrix_vector_add_sat16`**. High confidence in the computation, supported by two distinct proof families: the nine-coefficient/three-vector arithmetic (proofs2–4), and independent selector-controlled addend plus signed clamp/status/output effects (proofs1,5–7). GTE-MVMVA-like software emulation is a reasonable interpretation of this structure and wrapper constants, but exact PSX hardware fidelity and specific rotation/light/color/camera identities remain **UNCERTAIN**. The existing label is not evidence.

Input: one command encoding; global signed16 source triple and selected signed16 3x3 coefficient bank; optional global three-DWORD addend bank; incoming x87 environment. Effects: command-home scratch writes, three raw result DWORDs (re-written when addends enabled), three signed-clamped DWORD outputs and status reset/accumulation. Feedback selection reads old clamped low WORDs before any overwrite. Constants are read live, not assumed immutable. Matrix/addend banks share the address family; no separate allocations, `restrict` or invented full struct is imposed. Selector3 computes but never dereferences the fourth addend bank, whose +8 would be status.

## Residuals / parent validation

- Hash recomputation, compilation, emitted-instruction comparison and native differential tests **not performed**. Parent owns final §5.6/native promotion.
- Compile this only with a verified x86-32 MS-inline-asm/naked-capable compiler. Verify no injected prologue, epilogue, stack instrumentation, helper call or FP code; correct argument home, preserved registers, memory operand widths, all exits and arithmetic sequence.
- Numerical results are environment-dependent; verify PC24/PC53/PC64 and RC modes, exception behavior and x87 entry-stack availability as appropriate. No default CW or universal round-to-nearest claim.
- Original source return type, caller consumption of EAX/ECX, indirect callers, runtime data, complete bank/global types and hardware-register identities remain unknown.
- Relocation, x87 saved instruction/data-pointer identity and exact physical instruction addresses are outside a rebuilt-C equivalence claim. No runtime, IDB, Git, registry or configuration change was made.
