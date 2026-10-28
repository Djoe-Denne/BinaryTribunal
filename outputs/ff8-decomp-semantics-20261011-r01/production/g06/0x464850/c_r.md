# 0x464850 — C R, reconciled against native instructions

## Provenance and decision

Scope: function 0x464850 only, C volet. Both independently authored candidates
are present in the parent-frozen `reconciliation/g06/0x464850/C` projection:

| Author | Native session | Model.Ref | Deposited SHA-256 |
|---|---|---|---|
| A | ses_ed3cff3ecffetbfFwRJSUNBdXA | openai/gpt-6-astra, high | f1f5ccc964c52e9ffb40c20e49475c77a14d8ad15a4c8edc3ce410e1304f619a |
| B | ses_ed3cff0d8ffeMFxGIe0I1jp0Hz | openai/gpt-6.1-sol, high | 9132803cf19ccfee7babaad888eaafa180245d7d71ed18676629924328c5dc0a |

Read both complete candidates, common-compaction, original packet, all five
native-ASM slices, the complete native-byte slice, native-manifest and complete
native-metadata. The original JSON's long assembly field was display-truncated;
**no analysis relies on that truncated field**: its complete verbatim replacement
is native-asm-001 through -005 (25+25+25+25+19 instructions). All other original
packet fields and all metadata were read. The byte slice covers the sole chunk
`[0x464850,0x464997)`, 327 bytes; metadata gives 20 blocks, 119 instructions.

Parent manifest packet SHA-256:
`72f5e85aeda3168bd1cd97ff40d4407399a0fbbdd3d5589f58031f5fc9e7b087`;
compaction:
`ded4edb4b1c6b48f28524bd123684cad1cf7bbc1743739420aa39f22a47309dc`;
native EXE:
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
Hashes are parent-supplied provenance, not independently recomputed here; no
permitted byte-exact file hashing tool is available. Parent must compute/check
input and output hashes. No missing author, repeated session, or inconsistent
hash declaration was observed. This is not a cryptographic integrity PASS.

**Decision:** native mechanisms agree with both candidates after independent
instruction/CFG checking. Deliver the complete ABI-level register/memory C below.
No disagreement is settled by voting. No inferred game callee implementation,
bounds guard, memset call, or invented native prototype is introduced.

## Convergences, differences, and common-error search

| Point | A / B | Native adjudication |
|---|---|---|
| Four input words, five outgoing words; cdecl | Agree | Stack displacements, pushes, CALL and `add esp,14h` at 464850–464874; plain RET at 464996. Preserve argument-slot overwrites. |
| Signed /64 and /256, not ceil or unsigned | Agree | CDQ/AND/ADD and SAR at 464877–4648AC. Preserve 32-bit values and signed branch ordering. |
| Slot gate address | Both reject compaction's 1CAD294 | Bytes `8B 82 94 D6 CA 01` at 464918 prove **1CAD694**, +408 relative to clear base 1CAD28C. This common agreement is independently byte-supported. |
| Triple marker / optional clearing / paired marker | Agree | LEA chains yield 44C and 470, three stores separated by 8980, REP count 100h, final AL mask. Store order and duplicate stores remain. |
| SAR and CDQ helper expressions | Different spelling | Equivalent for the observed 6/8 shifts and bit-pattern sign extension. R uses unsigned arithmetic and explicit sign fill. |
| REP do-while (A) versus while (B) | Different shape | ECX is set to 100h immediately before REP; both execute 256 stores on normal completion. R retains while with exact ECX/EDI updates and DF. |
| Names | A: InvalidateRectangleIndexedTextureSlots; B: TextureRect_MarkSlotTablesAndClearOptionalCache | Mechanisms support marking/invalidation; texture/cache nomenclature is contextual. R proposes conservative `MarkRectangleSlotTablesAndClearOptionalBlocks`. |
| Flags / x87 / faults | Both omit arithmetic flag export and delegate environment | Accept only the stated ABI-level normal-execution scope. Bridge must carry **incoming** flags and actual callee x87 state, not silently reset them. Neither candidate is a complete exception/CPU emulator. R makes that boundary explicit. |

Common-error search also checked: original argument indices and push order;
first-pass inner-empty branch bypassing 46493A; initial second-pass entry bypassing
464958; rereads of overwritten stack slots; EDI reload only after REP; global gate
read after the three stores on every cell; signed JLE using the CMP before LEAs;
AL not AX/EAX truncation; no assumed table/stack disjointness; no deduplication of
even-pair writes; incidental EAX, not a constant result. No additional functional
defect in A/B was found within the explicit normal-execution ABI contract.

## Complete reconciled C

This is C for a 32-bit x86 register/guest-memory representation, **not** a guessed
four-argument host-pointer replacement. `load32` and `store32` are representation
primitives, not FF8 calls: one ordered little-endian dword memory access, including
unaligned guest addresses, in a shared address space. They do not modify CPU
registers, flags, or the arithmetic environment. Address arithmetic wraps modulo
2^32. They must not assume that tables, stack arguments, or saved words are disjoint.

`native_call` is the sole unresolved native target, 0x467550, with an actual pushed
return address. It executes through that callee's RET and reflects all CPU/memory,
DF, x87/SSE/environment effects. `architectural_context` carries the real incoming
arithmetic flags and opaque floating-point context across this call, which occurs
before any target arithmetic changes flags. Local arithmetic flags other than DF
are not exported; branches below are exact. This is ABI-level normal execution,
not instruction-fault/restart emulation. No local x87 instruction occurs, and no
local precision, rounding, exception, or control-word change is synthesized.

```c
#include <stdint.h>
#include <limits.h>

/* Required target-C arithmetic model: no widened integer promotions. */
_Static_assert(UINT_MAX == UINT32_MAX, "32-bit unsigned int required");

typedef uint32_t U32;
typedef struct CPU464850 {
    U32 eax, ebx, ecx, edx, ebp, esi, edi, esp, eip;
    unsigned df; /* native DF, zero or nonzero; bridge updates it */
    void *architectural_context; /* incoming flags, x87/SSE state/environment */
} CPU464850;

typedef struct Machine464850 {
    CPU464850 cpu;
    void *memory;
    U32  (*load32)(void *, U32);
    void (*store32)(void *, U32, U32);
    void (*native_call)(struct Machine464850 *, U32);
} Machine464850;

static int signed_gt464850(U32 a, U32 b)
{
    return (a ^ UINT32_C(0x80000000)) >
           (b ^ UINT32_C(0x80000000));
}
static U32 sar464850(U32 a, unsigned n)
{
    /* n is always 6 or 8 here; never shift by 32. */
    return (a >> n) | ((0u - (a >> 31)) << (32u - n));
}

void translated_00464850(Machine464850 *m)
{
    CPU464850 *r = &m->cpu;
    int gt;
#define RD(a) (m->load32(m->memory, (U32)(a)))
#define WR(a,v) (m->store32(m->memory, (U32)(a), (U32)(v)))
#define PUSH(v) do { r->esp -= 4u; WR(r->esp, (v)); } while (0)
#define POP(v) do { (v) = RD(r->esp); r->esp += 4u; } while (0)

    /* 464850: ESP initially addresses the caller's return word. */
    PUSH(r->ebx);
    r->ebx = RD(r->esp + 0x0Cu); /* original arg1 */
    PUSH(r->ebp);
    r->ebp = RD(r->esp + 0x0Cu); /* original arg0 */
    PUSH(r->esi);
    r->esi = RD(r->esp + 0x18u); /* original arg2 */
    PUSH(r->edi);
    r->edi = RD(r->esp + 0x20u); /* original arg3 */
    PUSH(UINT32_C(0x01CB6040));
    PUSH(r->edi);
    PUSH(r->esi);
    PUSH(r->ebx);
    PUSH(r->ebp);
    PUSH(UINT32_C(0x00464872)); /* CALL's return address */
    r->eip = UINT32_C(0x00467550);
    m->native_call(m, UINT32_C(0x00467550));

    r->eax = r->ebp; /* 464872 */
    r->esp += 0x14u;
    r->edx = 0u - (r->eax >> 31); /* CDQ */
    r->edx &= 0x3Fu;
    r->eax += r->edx;
    r->ebp = r->eax;
    r->eax = r->ebx;
    r->edx = 0u - (r->eax >> 31);
    r->edx &= 0xFFu;
    r->eax += r->edx;
    r->ecx = r->eax;
    r->eax = r->esi;
    r->edx = 0u - (r->eax >> 31);
    r->edx &= 0x3Fu;
    r->eax += r->edx;
    r->esi = r->eax;
    r->eax = r->edi;
    r->edx = 0u - (r->eax >> 31);
    r->edx &= 0xFFu;
    r->eax += r->edx;
    r->edi = r->eax;
    r->ecx = sar464850(r->ecx, 8);
    r->edi = sar464850(r->edi, 8);
    r->ebp = sar464850(r->ebp, 6);
    r->esi = sar464850(r->esi, 6);
    gt = signed_gt464850(r->ecx, r->edi);
    WR(r->esp + 0x20u, r->ebp);
    WR(r->esp + 0x14u, r->ecx);
    WR(r->esp + 0x18u, r->edi);
    if (gt) goto L464950;

    /* 4648C3 */
    r->eax = r->edi;
    r->ebp = r->ecx;
    r->eax -= r->ecx;
    r->ebp <<= 4;
    ++r->eax;
    WR(r->esp + 0x1Cu, r->eax);
L4648D1:
    r->ebx = RD(r->esp + 0x20u);
    if (signed_gt464850(r->ebx, r->esi)) goto L464942;
L4648D9:
    r->eax = r->ebx + r->ebp;
    r->ecx = r->eax + r->eax * 4u;
    r->ecx = r->eax + r->ecx * 2u;
    r->ecx = r->ecx + r->ecx * 4u;
    r->edx = r->ecx + r->ecx * 4u;
    r->ecx = UINT32_C(0x01CB636C) + r->edx * 4u;
    r->edx = 3u;
L4648F4:
    WR(r->ecx, UINT32_MAX);
    r->ecx += 0x8980u;
    --r->edx;
    if (r->edx != 0u) goto L4648F4;

    /* 464903: fresh gate read, after all three marker stores. */
    r->ecx = RD(UINT32_C(0x01CCFD90));
    if (r->ecx == 0u) goto L464935;
    /* 46490D */
    r->edx = r->eax + r->eax * 8u;
    r->edx <<= 3;
    r->edx -= r->eax;
    r->edx <<= 4;
    r->eax = RD(UINT32_C(0x01CAD694) + r->edx);
    if (r->eax == 0u) goto L464935;
    /* 464922: REP STOSD; no native memset call, no inserted CLD. */
    r->ecx = 0x100u;
    r->eax = 0u;
    r->edi = UINT32_C(0x01CAD28C) + r->edx;
    while (r->ecx != 0u) {
        WR(r->edi, r->eax);
        r->edi += r->df ? UINT32_C(0xFFFFFFFC) : 4u;
        --r->ecx;
    }
    r->edi = RD(r->esp + 0x18u);
L464935:
    ++r->ebx;
    if (!signed_gt464850(r->ebx, r->esi)) goto L4648D9;
    /* 46493A: NOT executed on the inner-empty branch from 4648D7. */
    r->ecx = RD(r->esp + 0x14u);
    r->eax = RD(r->esp + 0x1Cu);
L464942:
    r->ebp += 0x10u;
    --r->eax;
    WR(r->esp + 0x1Cu, r->eax);
    if (r->eax != 0u) goto L4648D1;
    /* 46494C */
    r->ebp = RD(r->esp + 0x20u);
L464950:
    gt = signed_gt464850(r->ecx, r->edi);
    r->ebx = r->ecx;
    if (gt) goto L464992;
    /* 464956: first entry bypasses 464958. */
    goto L46495C;
L464958:
    r->ebp = RD(r->esp + 0x20u);
L46495C:
    r->eax = RD(r->esp + 0x20u);
    r->ecx = r->ebp;
    if (signed_gt464850(r->eax, r->esi)) goto L46498D;
    /* 464966 */
    r->edx = r->ebx;
    r->edx <<= 4;
L46496B:
    r->eax = r->ecx;
    r->eax &= UINT32_C(0xFFFFFFFE); /* AND AL,FE: only bit 0 changes */
    r->eax += r->edx;
    ++r->ecx;
    gt = signed_gt464850(r->ecx, r->esi); /* CMP at 464972 */
    r->ebp = r->eax + r->eax * 4u;
    r->eax = r->eax + r->ebp * 2u;
    r->eax = r->eax + r->eax * 4u;
    r->eax = r->eax + r->eax * 4u;
    WR(UINT32_C(0x01CBECEC) + r->eax * 4u, UINT32_MAX);
    if (!gt) goto L46496B; /* LEA/MOV did not replace CMP flags */
L46498D:
    ++r->ebx;
    if (!signed_gt464850(r->ebx, r->edi)) goto L464958;
L464992:
    POP(r->edi);
    POP(r->esi);
    POP(r->ebp);
    POP(r->ebx);
    POP(r->eip); /* RET, no immediate; incidental EAX remains */
#undef POP
#undef PUSH
#undef WR
#undef RD
}
```

All register expressions are unsigned modulo-2^32; signed ordering is performed
by XORing the sign bit, not by overflowing signed subtraction. No AX instruction
occurs. The sole partial-register instruction is `AND AL,FE`, equivalent to
clearing bit zero of EAX without clearing its upper 24 bits. No memory access is
cached, reordered, coalesced, or guarded in this translation.

## Contract, role, and exact evidence anchors

Working name: **MarkRectangleSlotTablesAndClearOptionalBlocks**. High confidence
in this mechanism; contextual texture-page invalidation is LIKELY, not a proof of
a GPU upload or of the opaque callee's complete effects. This C report is not a
substitute for the independently reconciled semantic volet.

Inputs: four stack dwords interpreted as signed bounds; after the native call,
preserved registers holding args0/2 are divided toward zero by 64 and args1/3 by
256. Under ordinary cdecl preservation and non-aliasing table/stack execution,
these are inclusive index ranges. No legal range, table capacity, or axis naming
is inferred. The machine C deliberately covers stack aliasing as well.

Effects: one opaque five-word cdecl call, four overwritten incoming argument
slots, then ordered marker and optional zero stores. For first-pass index
`i = q64 + 16*q256`, marker addresses are `1CB636C + 44C*i + k*8980`, k=0,1,2.
Only if both freshly read gates permit does it zero 256 dwords from
`1CAD28C + 470*i` in the actual DF direction. Second-pass index uses
`(q64 & FFFFFFFE) + 16*q256`; adjacent q64 values can repeat a marker write to
`1CBECEC + 44C*index`. All formulas are modulo 2^32 explanations, not replacement
loops that discard native stack rereads. No meaningful scalar return contract is
proven; EAX/ECX/EDX remain path-dependent. Four saved register words and RET are
read from actual guest memory, including any prior aliasing writes.

Eight anchors, using native instructions rather than labels/comments:

1. **464850–464874:** saves, actual operand displacements, five pushes, relative
   CALL (`E8 DE 2C 00 00` => 467550), 14h caller cleanup. Establishes argument
   order `{arg0,arg1,arg2,arg3,1CB6040}` at callee entry.
2. **464877–4648AC:** CDQ biases 3F/FF plus SAR 6/8 prove signed truncation math.
3. **4648D9–464901:** LEAs produce 5i,11i,55i,275i; scale four is 1100=44Ch.
   `mov edx,3`, ordered -1 writes and `add ecx,8980h` establish three banks.
4. **464903–464929:** global load/test first, then index transform
   `(9i*8-i)*16=1136i=470h*i`; **464918 bytes `8B8294D6CA01`** independently
   establish 1CAD694, not compaction's 1CAD294. Gate is +408 from clear base.
5. **464922–464931:** `mov ecx,100h; xor eax,eax; lea edi,...; F3 AB` proves
   256 zero dword stores, no library call or CLD; EDI is subsequently reloaded.
6. **46493A–46495C:** row count and start rereads plus explicit branch targets
   prove the empty-inner bypass and initial second-pass reload bypass.
7. **46496B–46498B:** `24 FE` is AL-only mask; LEAs and store preserve the CMP
   at 464972 for JLE; the final -1 store is at base 1CBECEC. Along with anchor 3,
   this is a second distinct native support for the marking/invalidation role.
8. **metadata xrefs 45BDBA and 45BE5D:** actual code callers 45BD30 and 45BDD0
   exist. Compaction lines 15–16 supply destination-notification context after
   CPU-buffer copies; this is frozen contextual evidence, not newly examined
   caller ASM. It supports texture-related interpretation only with that limit.

The local store patterns in anchors 3 and 7 independently establish marker-table
updates. Anchor 5 independently establishes conditional block clearing. Target
ASM has no local pixel-source load/copy loop; the opaque call prevents asserting
that the **whole routine plus callee** cannot copy/upload anything.

## Coverage and residual uncertainty

All 20 CFG starts are covered:
`464850,4648C3,4648D1,4648D9,4648F4,464903,46490D,464922,464935,46493A,
464942,46494C,464950,464956,464958,46495C,464966,46496B,46498D,464992`.
No extra chunk or target appears in the frozen metadata. Manual opcode checks
included branch destinations, immediate/displacement widths, CALL/RET, AL mask,
and REP. No native score, other session, index, or other output was consulted.

- **UNCERTAIN:** callee 467550 body/prototype and effects. Compaction alternates
  unknown and overlap-clearing descriptions; vote counts are not evidence. Its
  body is absent; do not resolve this by prose or instantiate a guessed call.
- **UNCERTAIN:** exact axis terminology, second marker's resource meaning, table
  capacities, and business meaning of the slot gate at +408. Preserve mechanisms.
- DF=0 is the usual cdecl requirement, not set by these instructions. Both DF
  directions are represented; no inserted CLD. No x87 mode is changed locally;
  actual callee environment effects require the native bridge.
- This complete C is a normal-execution ABI translation requiring faithful guest
  memory and native-call adapters. Arithmetic EFLAGS on return, every internal
  EIP, asynchronous observation, and precise instruction-fault rollback are not
  modeled. These omissions are not claimed to be CPU-emulation equivalence.
- No compiler, execution, differential test, hash recomputation, IDB mutation,
  integration, or final §5.6 validation was performed. Parent owns all such gates.
  Recommended parent checks: hashes; compile/bridge integration; traces for
  negative and reversed bounds, both gates, both DF values, paired duplicate
  writes, argument-slot/table aliasing, and actual callee x87/flag preservation.

Only the requested `production/g06/0x464850/c_r.md` was written.
