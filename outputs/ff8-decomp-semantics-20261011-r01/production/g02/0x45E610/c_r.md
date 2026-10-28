# 0x45E610 — C R, reconciliation against frozen native evidence

## Verdict and scope

**RECONCILED: complete C for the ordinary PE32 C ABI, high confidence in the memory effects and EAX result.** No unresolved arithmetic, width, access-order or CFG disagreement. **UNCERTAIN:** historical declared return type, consumption of caller-saved registers/flags, and hardware/domain register identities. This is not final native acceptance or §5.6 promotion.

Only the assigned C projection was used: `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x45E610/C/` (abbreviated `P/` below), plus project instructions. No other volet, peer output location, historical verdict, index, IDA rediscovery or live state was consulted. The common compaction was treated as secondary context, not authority for target behavior.

### Frozen authors and integrity boundary

`P/manifest.json:5–38` records both independent authors, distinct sessions and models:

| Role | Native session | Effective model recorded by parent | Candidate SHA-256 |
|---|---|---|---|
| A | `ses_ed3e1b42bffewEOCtaZJQVGpdF` | `openai/gpt-6.1-sol`, `high` | `1e6860aa7501429fe3ee337eddba66f1147d369002205ce6ddf268d1d906f604` |
| B | `ses_ed3e1afcfffetlnqBRgkImvAu5` | `opencode-go/gpt-6-luna`, `medium` | `5f28edbeb9d6e966c1e7e508c5695dd743bb821d00646bba4bf032551faf71f5` |

Frozen packet: `942cc92944c0c0364bd9efa7a43e04b381f5fc1cdca6710c180140ba7b5af909`; compaction: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`; ASM: `174b5f4acb3cf1c43b207810e3500e1fa7ef6eb4b81f74698546f10e5fb7b2a3`; bytes: `d56466b16e8a6273f5c9157d78046c01500cafff5274f446ccab015caf07d864`; metadata: `a07db8191f91c895456e16d7e8c21edfc2a5f4ec08d2dbca9dccc6d94b72ec8e`. These agree as recorded between reconciliation manifest, native manifest and candidate provenance. Both candidates are present. No recorded hash conflict was found. Independence is parent-attested by the frozen provenance, not independently audited through session history.

These are **quoted hashes, not recomputed hashes**: no permitted raw-file hash primitive is exposed. Parent must verify content hashes, including this output; no substitute API/shell was used. The recorded EXE SHA-256 is `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, exported `2026-10-11T16:38:25.140966+00:00` (`P/native-metadata.json:4–9`).

Full bounded contiguous reads: candidates A 1–91 and B 1–69; compaction 1–24; original packet 1–3294; native metadata 1–3286; ASM 1–18; bytes 1–3; both manifests complete. Every continuation was read through EOF; no truncated suffix was accepted as coverage. Context Mode tools are absent from this worker's catalog; the mission's explicitly requested bounded `read` projection was used without index/API/shell access.

## Convergences, divergences and common-error checks

Agreement below was checked against the native opcodes rather than accepted by vote.

| Issue | A | B | R decision and native reason |
|---|---|---|---|
| Loads and input signedness | DWORD loads then U16 masks | Same | Confirmed by `A1`/`8B` loads and `25`/`81 /4` masks at `45E610–45E63C`. Do not replace the loads with WORD reads or signed-16 inputs. |
| Factor and product | S16 → S32 → U32, unsigned wrapped multiply | S16 → S32 local, then U32 multiply | Equivalent EDX bit pattern and low product. `0F BF 15` at `45E642` sign-extends WORD; `0F AF C2` at `45E655` retains only EAX low 32 bits. R uses A's explicit register-bit expression. |
| Shift and output widths | U32 SHR 12, two DWORD stores | Same | Confirmed by `C1 E8 0C` and two `A3` stores. No SAR, signed division, saturation, output U16 truncation, or shift-before-wrap. |
| Access order | Explicit sequential volatile accesses | Same | Confirmed: `5C,58,54,50,92F4` reads, then `92F8,8A2C,8A70` writes. Clear is after factor read but before multiply and outputs. |
| Address binding | Eight external symbols, requiring native bindings | Integer-to-pointer absolute-address macros | Both are integration strategies, not native disagreement. Choose external bindings for the final C; explicit addresses/ranges below prevent accidental standalone copies. B's casts additionally require target-specific pointer/effective-type assumptions. |
| Convention | Explicit cdecl macro | Unannotated default convention | Native `C3`, no stack arguments/calls/cleanup. Use explicit cdecl for integration consistency, not a claim that RET alone distinguishes every zero-argument convention. B's omission is harmless only with a matching compiler default. |
| Function name/domain | Neutral `sub_45E610`; mechanical descriptive proposal | `Gte_AVSZ4`; exported label counted as name evidence | Neutral entry name retained. B's label is **not** one of the required independent proofs. ASM proves the descriptive name below, not hardware AVSZ4 equivalence. Domain identity remains UNCERTAIN. |
| Return contract | Exposes EAX; notes declared prototype unknown | Exposes EAX; stronger return phrasing | EAX at RET is proven. An intentional original C integer return or caller consumption is not proven by xref addresses. Final C exposes that bit pattern; historical prototype remains UNCERTAIN. |
| Register/flag/FPU effects | Enumerated caveats | Not fully enumerated | R supplies exact native register/flag residues and unchanged x87 environment below. Standard C does not promise arbitrary EFLAGS/ECX/EDX residue reproduction. |

Common-error audit: both candidates' arithmetic is correct on the specified 32-bit x86 target; no hidden branch/callee is missing. Their shared return representation is deliberately limited to exposing EAX, not promoted into proof of the original prototype. Neither a GTE label nor the word “status” proves the meaning of `1CA92F8`; here it is simply a DWORD reset. No hardware clamp, overflow flag, extra divide-by-four, or valid-scale guard may be added. Both use volatile to retain the access trace; this does not prove native volatile declarations, synchronization, or thread safety.

## Complete reconciled C

This is C11 for the native 32-bit x86 environment. External symbols must bind to the exact existing native objects at the addresses shown, **not** newly allocated disconnected copies. `volatile` preserves the ordered memory-access trace on the target compiler; no `restrict` or fabricated struct/array layout is assumed. Every full expression containing a native access is separately sequenced. Static assertions constrain the compilation environment, not native execution guards.

```c
#include <stdint.h>
#include <limits.h>

#if defined(_MSC_VER)
#define FF8_CDECL __cdecl
#elif defined(__GNUC__) && defined(__i386__)
#define FF8_CDECL __attribute__((cdecl))
#else
#define FF8_CDECL
#endif

_Static_assert(CHAR_BIT == 8, "native byte width");
_Static_assert(sizeof(void *) == 4, "native PE32 ABI");
_Static_assert(UINT_MAX == UINT32_MAX, "32-bit unsigned arithmetic");
_Static_assert(INT_MAX == INT32_MAX, "32-bit integer promotion model");

extern volatile uint32_t dword_1CA8A5C; /* 0x01CA8A5C, read DWORD */
extern volatile uint32_t dword_1CA8A58; /* 0x01CA8A58, read DWORD */
extern volatile uint32_t dword_1CA8A54; /* 0x01CA8A54, read DWORD */
extern volatile uint32_t dword_1CA8A50; /* 0x01CA8A50, read DWORD */
extern volatile int16_t  word_1CA92F4;  /* 0x01CA92F4, read signed WORD */
extern volatile uint32_t dword_1CA92F8; /* 0x01CA92F8, write DWORD */
extern volatile uint32_t dword_1CA8A2C; /* 0x01CA8A2C, write DWORD */
extern volatile uint32_t dword_1CA8A70; /* 0x01CA8A70, write DWORD */

uint32_t FF8_CDECL sub_45E610(void)
{
    uint32_t eax, ecx, edx;

    eax = dword_1CA8A5C;                   /* 0045E610 */
    ecx = dword_1CA8A58;                   /* 0045E615 */
    edx = dword_1CA8A54;                   /* 0045E61B */
    eax &= UINT32_C(0xFFFF);               /* 0045E621 */
    ecx &= UINT32_C(0xFFFF);               /* 0045E626 */
    edx &= UINT32_C(0xFFFF);               /* 0045E62C */
    eax += ecx;                           /* 0045E632 */
    ecx = dword_1CA8A50;                   /* 0045E634 */
    eax += edx;                           /* 0045E63A */
    ecx &= UINT32_C(0xFFFF);               /* 0045E63C */
    edx = (uint32_t)(int32_t)word_1CA92F4; /* 0045E642: exact MOVSX bits */
    eax += ecx;                           /* 0045E649 */
    dword_1CA92F8 = UINT32_C(0);           /* 0045E64B */
    eax *= edx;                           /* 0045E655: low 32 IMUL bits */
    eax >>= 12;                           /* 0045E658: SHR, zero fill */
    dword_1CA8A2C = eax;                   /* 0045E65B */
    dword_1CA8A70 = eax;                   /* 0045E660 */
    return eax;                           /* 0045E665: EAX at RET */
}

#undef FF8_CDECL
```

No support function, library call, floating operation, branch or dynamic guard is required. The C describes standard ABI-visible state rather than a byte-identical machine-code replacement.

## Width, numeric, memory and ABI contract

Let `a,b,c,d` be the four DWORD values sampled **in read order** at `5C,58,54,50`, and `s` the signed WORD subsequently sampled at `92F4`:

`S = (a & 65535) + (b & 65535) + (c & 65535) + (d & 65535)`

`P = (S * sign_extend_16(s)) mod 2^32`

`R = logical_right_shift_32(P,12)`.

- `0 <= S <= 262140`; the three additions do not overflow. The full signed product need not fit 32 bits. Unsigned multiplication of the EDX two's-complement bit pattern gives exactly the low DWORD from signed two-operand IMUL and has no signed-overflow UB. Discard high product bits **before** shifting.
- `0 <= R <= 0xFFFFF`; this is a 20-bit-range result stored as DWORD, not a saturating U16 result. Negative scales are allowed by the native code and must not be rejected or arithmetically shifted.
- Ordered writes: `DWORD[01CA92F8]=0`, `DWORD[01CA8A2C]=R`, `DWORD[01CA8A70]=R`. No read of the former contents of these output locations. Upper input halves are ignored numerically but are still read by the native DWORD loads.
- Exact byte ranges: inputs `[01CA8A50,54)`, `[01CA8A54,58)`, `[01CA8A58,5C)`, `[01CA8A5C,60)`; factor `[01CA92F4,92F6)`; reset `[01CA92F8,92FC)`; outputs `[01CA8A2C,8A30)` and `[01CA8A70,8A74)`. These ranges do not overlap. Input address spacing is 4 bytes, but no enclosing array or structure is established. All native accesses are aligned at the displayed widths. No pointer argument or caller-controlled alias exists here. Other code may use overlapping views of this state; integration must share native storage rather than introduce new objects.
- No explicit inputs from entry registers or stack arguments. No frame, push/pop, local stack memory, call or hidden tail call. `C3` is a near RET with no immediate cleanup: normal x86 cdecl-compatible leaf, no argument order to reconstruct. RET consumes the return address. Original source-level parameter/return declaration is not independently known.
- Native exit: `EAX=R`, `ECX=(d & 65535)`, `EDX=sign_extend_16(s)`. EBX, ESI, EDI and EBP are untouched; ESP changes only by RET. All destinations are full EAX/ECX/EDX; **there are no AL or AX partial writes**. MOVSX reads 16 bits but writes all of EDX.
- Native final arithmetic flags are from SHR 12: CF is P bit 11, SF=0, ZF follows whether R is zero, PF is even parity of R's low byte; OF and AF are undefined for count 12. Other unaffected flags retain their entry state. MOV stores and RET do not overwrite these arithmetic flags. Standard C does not guarantee this flag state or ECX/EDX residues; unusual callers consuming them would require a separately authorized machine-state wrapper/capture, not invented C arguments or outputs.
- No x87, SSE or FPU-environment operation appears in the complete bytes. Native x87 control/status/tag registers, stack values and rounding environment remain unchanged. The C uses integer arithmetic only and introduces no floating emulation helper; the parent's generated-code check must ensure this remains true.
- Volatile is not atomicity, a lock or a concurrency guarantee. Hardware faults and precise instruction-interruption timing are outside this ordinary C model. Access validity and correct native address binding are integration preconditions, not guards inserted into the function.

### Arithmetic witnesses (derived, not native differential tests)

Pure arithmetic checks of the instruction formula (products are within exact JS integer range) give:

| S | s | Low product DWORD | R |
|---:|---:|---:|---:|
| 1 | -1 | `FFFFFFFF` | `FFFFF` |
| 262140 | 32767 | `FFFA0004` | `FFFA0` |
| 262140 | -32768 | `00020000` | `20` |
| 65535 | 4096 | `0FFFF000` | `FFFF` |

These specifically refute SAR, saturation and wide-product-shift-first rewrites. A zero sum or zero factor gives R=0 without bypassing the reset or either output store. Arbitrary high 16 input bits do not alter R.

## Coverage and exact evidence anchors

The original packet has one chunk `[0045E610,0045E666)`, hex length `0x56` (86 bytes), and one CFG block with no successors (`P/0x45E610.json:11–25`). Metadata agrees at 11–17 and 3284–3285. All 18 instruction starts and lengths match a complete manual byte decode:

| EA | Bytes | C coverage |
|---|---:|---|
| 45E610 | 5 | DWORD load EAX |
| 45E615 | 6 | DWORD load ECX |
| 45E61B | 6 | DWORD load EDX |
| 45E621 | 5 | EAX mask |
| 45E626 | 6 | ECX mask |
| 45E62C | 6 | EDX mask |
| 45E632 | 2 | first add |
| 45E634 | 6 | fourth DWORD load |
| 45E63A | 2 | second add |
| 45E63C | 6 | fourth mask |
| 45E642 | 7 | signed WORD → EDX |
| 45E649 | 2 | third add |
| 45E64B | 10 | reset DWORD |
| 45E655 | 3 | wrapped product |
| 45E658 | 3 | logical shift |
| 45E65B | 5 | first result DWORD |
| 45E660 | 5 | second result DWORD |
| 45E665 | 1 | RET / EAX exposure |

Seven proof anchors, all within this projection:

1. **Four unsigned low halves:** `P/native-asm-001.txt:1–10,12`, `45E610–45E649`: four absolute DWORD loads, four `AND 0FFFFh`, three ADDs. This establishes the `Sum4U16` component without relying on any label.
2. **Signed scale and wrap:** `P/native-asm-001.txt:11,14`, `45E642`/`45E655`; bytes `0F BF 15 F4 92 CA 01` and `0F AF C2` in `P/native-bytes-001.txt:2–3`. MOVSX supplies signed S16 scale; IMUL's two-register form keeps a DWORD, not EDX:EAX or a 64-bit shifted product.
3. **Logical Q12-style rescale:** `45E658`, `P/native-asm-001.txt:15`, bytes `C1 E8 0C` (`P/native-bytes-001.txt:3`). ModRM `/5` establishes SHR rather than SAR `/7`. Together with anchor 2 this independently proves `ScaleS16_Wrap32_Lsr12`.
4. **Reset before publication:** `45E64B`, `P/native-asm-001.txt:13`, bytes `C7 05 F8 92 CA 01 00 00 00 00`, spanning bytes slice lines 2–3. This is an unconditional DWORD zero write, not status recomputation.
5. **Duplicated DWORD result:** `45E65B`/`45E660`, `P/native-asm-001.txt:16–17`, bytes `A3 2C 8A CA 01 A3 70 8A CA 01`. Both store the unchanged full EAX; no clamp or post-shift mask intervenes.
6. **Leaf and complete block:** terminal `C3` at `45E665`; `P/0x45E610.json:11–25,3292–3293` and `P/native-metadata.json:11–17,3284–3285`. Complete 86-byte decode has no call, jump or FPU opcode; CFG has one block and no successor. Empty code-target list corroborates, rather than alone proving, leaf behavior.
7. **Bounded xref context:** `P/native-metadata.json:19–30,217–222` (original packet 27–38,225–230) records code xrefs `547F65` in `547E60`, `556291` in `5561E0`, `5AA11F` in `5A9C10`. These establish repeated use sites, not depth/OTZ/MAC identities or caller consumption of EAX/flags. No caller instruction window was supplied, so none is inferred from function labels.

## Mechanical role/name and residual uncertainty

**Proven role:** reset-and-publish global four-U16 scaled accumulator with signed-S16 scale, low-32 wrap and logical rescale by 12. Proposed descriptive name: `Sum4U16_ScaleS16_Wrap32_Lsr12` (high confidence, supported independently by anchors 1 and 2–3). Effects are the three ordered DWORD writes and EAX result stated above. This is not intrinsically an arithmetic average: no explicit divide by four exists; any normalization is encoded in the sampled scale.

`Gte_AVSZ4` remains a contextual label/hypothesis only. Neither the exported label, compaction's historical notes nor xref lists prove hardware register mapping, depth meaning, saturation or full PlayStation GTE semantics. Those claims remain **UNCERTAIN**, not CERTAIN by agreement. No semantic A/B volet was read, and this C-local role description does not substitute for the independent semantic reconciliation.

Remaining integration/validation risks: correct external storage bindings; historical return prototype and possible nonstandard register/flag consumers; compiler preservation of DWORD/WORD access widths and store order; final generated code maintaining the unchanged x87 environment. Native instructions themselves leave no arithmetic conflict requiring an additional capture for this ordinary C contract. If the parent needs stronger caller-state or hardware-domain claims, request a specifically bounded caller ASM/data capture rather than infer it.

Performed: complete frozen-source reading, manual 86-byte/18-instruction/CFG comparison, independent arithmetic/ABI/access-trace derivation, reconciliation and simple formula witnesses. Not performed: raw-file hash computation, compilation/linking, generated-code inspection, emulator/native differential tests, live work, §5.6 final checks or promotion. Parent owns all final native validation, IDB/save/readback and integration. Only this owned output was written; no Git/IDB/ledger/registry/config/live mutations or delegation.
