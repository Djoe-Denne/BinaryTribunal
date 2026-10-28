# 0x464DB0 — C R, reconciled against native instructions

## Receipt and verdict

**Complete target C over an explicit x86 execution adapter; not a standalone host-ABI replacement.** Manual instruction/byte/CFG reconciliation found no target instruction disagreement requiring an UNCERTAIN block. External implementations, business interpretation and final native validation remain bounded below; this is not a promotion or §5.6 PASS.

Only the own-C input directory `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g05/0x464DB0/C/` was used, in addition to required common instructions. Read own `manifest.json`, A/B, common-compaction, original packet, native-manifest, native-metadata, all six native-asm slices (147 instructions), and the sole native-bytes slice (14 lines, 447 bytes). Coverage is the whole contiguous chunk `[00464DB0,00464F6F)`, all ten CFG blocks. The original JSON's long assembly display was truncated by the reader; **no truncated assembly/JSON fragment was used to infer instructions**: complete verbatim ASM slices and byte slices provide that evidence. Packet chunk hex and the separately readable complete metadata provide the other fields.

Parent receipt records independent authors:

| Author | Native session | Model.Ref | Frozen output SHA-256 |
|---|---|---|---|
| A | `ses_ed3d00059ffeB7a2vXAIypZ7DG` | `openai/gpt-6-astra`, high | `1946df80cedc5e24d6226ad06962d3618fd6cbc623aca12b252a7c43d97cfdbb` |
| B | `ses_ed3cffd5bffeQSA0ZnQI31djCV` | `openai/gpt-6.1-sol`, high | `1fb2ee657b88ab3ee871c3f3227c1eaa58a45f6f72707e013584a18b442d5f4a` |

Both are present and sessions are distinct. Manifest/source citations agree: packet `9c59075630146d8ae274a6bcb36ffc91b884316984555a9375ec86eba9ab5c9d`; common-compaction `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`; executable `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, x86-32, export `2026-10-11T16:38:25.140966+00:00`. Native-manifest's six ASM hashes, bytes hash and metadata hash match the parent receipt. **These are recorded hashes, not recomputed hashes or an independent native Model.Ref query**; parent must compute/check raw-file/output hashes. No observed provenance conflict, no unsupported claim of cryptographic verification.

## Convergences, divergences and shared-error audit

| Issue | A / B | Native resolution |
|---|---|---|
| Target instructions, access sequence, shifts and stack | Agree on machine-state lift | Independently checked all slices/bytes, not accepted by agreement. Keep explicit shared guest memory and deferred cleanup. |
| EFLAGS boundary | A deliberately omits flags under an ordinary cdecl contract; B tracks defined arithmetic flags and unknown AF/OF | Native SUB/TEST/AND/shifts/ADD really update flags. R retains B's stronger defined-flag model, including flags entering external calls and after the final ADD ESP. No invented callee flag-purity assumption. |
| Callee adapter argument | A passes return PC; B passes target | Adapter design, not native ABI conflict. R explicitly passes target after pushing exact return PC. Callee executes its own RET; no extra target-side cleanup. |
| Names | A auxiliary pair; B alpha draw lists | Gate +44 and factory constants 6/14 prove pair construction; validated neighbour contract supports conditional alpha staging. Prefer conservative `Gfx_EnsureSlotAuxiliaryDrawListPair`; business-purpose certainty does not follow. |
| Documentation precision | A's prose labels EBP pop as EEE in one place | Actual byte `5D` and ASM place POP EBP at **464EED**, POP EDI at 464EEE. R uses these boundaries. No functional code difference. |

Shared-error search: do not add `&7FFF` to the CLUT WORD (E3B/E40 clear then AX load retains bit15); do not turn CL SAR into unchecked C signed shift; do not retain the initial zero at slot+60 across 464160; do not hoist owner loads; do not cache argument3 before E34; do not clear descriptor locally or assume its fields/padding initialized; do not clean cdecl pushes immediately; do not guard factory NULL returns or roll back +44; do not treat +48 as part of the early gate. Both drafts preserve these points, independently confirmed below. The common documentary row-pitch typo is not imported: native row shift is 10, then address scale 2, i.e. 0x800 bytes per row.

## Complete reconciled C

The following is executable C99 target logic given the stated adapters, not invented game prototypes. Entry ESP points to the native return address, arguments at +4/+8/+12. Each memory adapter performs one little-endian access of exactly its indicated width (unaligned permitted), against the **same** guest memory including native stack, globals and objects. Memory adapters preserve CPU/FP state, do not add checks/default values, and propagate faults rather than resume normally. `run_callee` executes the numeric native target through its actual return, including its RET and all memory/register/x87 effects. Callees are not fabricated here. Callback faults/nonlocal exits must not return to this lift as a completed call.

`fp_state` denotes the native x87 control/status/tag/register environment plus other FP/SIMD state required by the bridge. Target instructions have no x87 operations; neither host floating arithmetic nor environment normalization is introduced. Undefined arithmetic flag bits are marked unknown, not assigned an invented architectural value. Unchanged flags (e.g. DF) remain unchanged by target instructions. Native execution must resolve any needed unknown bits according to its machine policy; concrete undefined-flag behaviour is not certified.

```c
#include <stdint.h>
typedef uint32_t U32;
typedef uint16_t U16;
typedef struct CPU464DB0 CPU;
struct CPU464DB0 {
    U32 eax, ecx, edx, ebx, esp, ebp, esi, edi, eip;
    U32 flags, flags_known;
    void *memory, *fp_state;
    U16 (*r16)(void *, U32);
    U32 (*r32)(void *, U32);
    void (*w32)(void *, U32, U32);
    void (*run_callee)(CPU *, U32 target);
};
enum { CF=1u, PF=4u, AF=16u, ZF=64u, SF=128u, OF=2048u };

static U32 read32(CPU *s, U32 a) { return s->r32(s->memory,a); }
static void write32(CPU *s, U32 a, U32 v) { s->w32(s->memory,a,v); }
static U32 psz(U32 v) {
    U32 p=v & 255u;
    p ^= p>>4; p ^= p>>2; p ^= p>>1;
    return ((p&1u)?0u:PF) | (v==0u?ZF:0u) | (v>>31?SF:0u);
}
static void setflags(CPU *s,U32 mask,U32 value,U32 unknown) {
    s->flags=(s->flags & ~mask) | (value & mask);
    s->flags_known=(s->flags_known | mask) & ~unknown;
}
static U32 add32(CPU *s,U32 a,U32 b) {
    U32 r=a+b;
    setflags(s,CF|PF|AF|ZF|SF|OF,psz(r)|(r<a?CF:0u)|
        (((a^b^r)&16u)?AF:0u)|
        ((~(a^b)&(a^r)&0x80000000u)?OF:0u),0u);
    return r;
}
static U32 sub32(CPU *s,U32 a,U32 b) {
    U32 r=a-b;
    setflags(s,CF|PF|AF|ZF|SF|OF,psz(r)|(a<b?CF:0u)|
        (((a^b^r)&16u)?AF:0u)|
        (((a^b)&(a^r)&0x80000000u)?OF:0u),0u);
    return r;
}
static U32 logic32(CPU *s,U32 r) {
    setflags(s,CF|PF|ZF|SF|OF,psz(r),AF);
    return r;
}
/* All count operands here are x86 dword shifts; effective count 0..31. */
static U32 shl32(CPU *s,U32 v,U32 count) {
    U32 n=count&31u,r=v,last=0u;
    if(n==0u) return v;
    for(U32 i=0u;i<n;i++) { last=r>>31; r<<=1; }
    setflags(s,CF|PF|ZF|SF|(n==1u?OF:0u),
        psz(r)|(last?CF:0u)|
        ((n==1u && ((r>>31)^last))?OF:0u),AF|(n==1u?0u:OF));
    return r;
}
static U32 shr32(CPU *s,U32 v,U32 count) {
    U32 n=count&31u,r=v,last=0u;
    if(n==0u) return v;
    for(U32 i=0u;i<n;i++) { last=r&1u; r>>=1; }
    setflags(s,CF|PF|ZF|SF|(n==1u?OF:0u),
        psz(r)|(last?CF:0u)|((n==1u && (v>>31))?OF:0u),
        AF|(n==1u?0u:OF));
    return r;
}
static U32 sar32(CPU *s,U32 v,U32 count) {
    U32 n=count&31u,r=v,last=0u;
    if(n==0u) return v;
    for(U32 i=0u;i<n;i++) { last=r&1u; r=(r>>1)|(r&0x80000000u); }
    setflags(s,CF|PF|ZF|SF|(n==1u?OF:0u),psz(r)|(last?CF:0u),
        AF|(n==1u?0u:OF));
    return r;
}
static void push32(CPU *s,U32 v) { s->esp-=4u; write32(s,s->esp,v); }
static U32 pop32(CPU *s) { U32 v=read32(s,s->esp); s->esp+=4u; return v; }
static void call32(CPU *s,U32 target,U32 next) {
    push32(s,next); s->eip=target; s->run_callee(s,target);
}

void reconciled_00464DB0(CPU *s) {
#define A s->eax
#define C s->ecx
#define D s->edx
#define B s->ebx
#define SP s->esp
#define BP s->ebp
#define S s->esi
#define I s->edi
#define M(a) read32(s,(U32)(a))
#define W(a,v) write32(s,(U32)(a),(U32)(v))
#define PUSH(v) push32(s,(U32)(v))
#define CALL(t,r) call32(s,(t),(r))
    /* 464DB0..464DC5 */
    SP=sub32(s,SP,0x88u);
    PUSH(B); PUSH(S);
    S=M(SP+0x94u);
    PUSH(I);
    A=M(S+0x44u); (void)logic32(s,A);
    if(A!=0u) goto exit_no_bp;

    /* 464DCB..464DD9 */
    CALL(0x40A04Au,0x464DD0u);
    B=A;
    A=M(0x1CCFD88u); (void)logic32(s,A);
    if(A==0u) goto alternate;

    /* 464DDF..464E07 */
    A=M(SP+0x9Cu);
    W(S+0x60u,0u);
    I=A;
    A=sar32(s,A,4u); A=logic32(s,A&1u);
    I=logic32(s,I&15u);
    A=shl32(s,A,8u); W(SP+0x0Cu,A);
    A=M(S+0x5Cu);
    I=shl32(s,I,6u); (void)logic32(s,A);
    if(A!=0u) goto stage;

    /* 464E09..464E1B */
    PUSH(0xF0u); CALL(0x467160u,0x464E13u);
    SP=add32(s,SP,4u);
    W(S+0x5Cu,A); (void)logic32(s,A);
    if(A==0u) goto exit_no_bp;

stage: /* 464E21..464E65 */
    A=SP+0x10u;
    PUSH(BP); PUSH(A); PUSH(0u);
    CALL(0x40702Fu,0x464E2Eu);
    PUSH(S); CALL(0x464160u,0x464E34u);
    D=M(SP+0xB0u);
    A=logic32(s,0u);
    C=M(S+0x5Cu);
    A=(A&0xFFFF0000u)|(U32)s->r16(s->memory,D+0x448u);
    D=M(S+0x14u);
    BP=A; A=logic32(s,A&63u);
    BP=shr32(s,BP,6u); BP=shl32(s,BP,6u);
    BP=add32(s,BP,A);
    A=M(0x1CB602Cu);
    BP=shl32(s,BP,5u); BP=add32(s,BP,A);
    W(SP+0x48u,C); C=M(C+0x44u);

    /* 464E68..464E9C */
    PUSH(BP);
    BP=M(S+0x10u); PUSH(D); PUSH(BP);
    BP=M(S+0x0Cu); PUSH(BP); PUSH(C);
    C=M(S+0x60u); BP=M(SP+0x30u); PUSH(C);
    C=2u; C=sub32(s,C,D);
    D=M(S+4u); D=sar32(s,D,C&255u);
    C=M(S+8u); PUSH(0x800u);
    C=add32(s,C,BP); C=shl32(s,C,10u);
    I=add32(s,I,D); C=add32(s,C,I);
    D=A+C*2u; /* LEA: no flag update */
    PUSH(D); CALL(0x4677D0u,0x464EA1u);

    /* 464EA1..464ECC */
    A=M(B+0xA50u);
    C=SP+0x40u;
    PUSH(A); PUSH(0u); PUSH(C); PUSH(6u); PUSH(1u);
    CALL(0x416D82u,0x464EB8u);
    SP=add32(s,SP,0x40u);
    W(S+0x44u,A);
    W(SP+0x40u,1u);
    PUSH(A); CALL(0x417FA6u,0x464ECCu);
    W(SP+0x48u,A);

    /* 464ED0..464EF7 */
    D=M(B+0xA50u); PUSH(D);
    A=SP+0x1Cu;
    PUSH(0u); PUSH(A); PUSH(14u); PUSH(1u);
    CALL(0x416D82u,0x464EE7u);
    SP=add32(s,SP,0x18u); W(S+0x48u,A);
    BP=pop32(s); I=pop32(s); S=pop32(s); B=pop32(s);
    SP=add32(s,SP,0x88u); s->eip=pop32(s);
    goto finished;

alternate: /* 464EF8..464F11 */
    A=M(0x1CA8A00u); (void)logic32(s,A);
    if(A!=0u) {
        C=SP+0x10u; PUSH(C); PUSH(2u); /* 464F01..464F08 */
    } else {
        D=SP+0x10u; PUSH(D); PUSH(0u); /* 464F0A..464F0F */
    }
    /* 464F11..464F40 */
    CALL(0x40702Fu,0x464F16u);
    A=M(S+0x24u); SP=add32(s,SP,8u);
    W(SP+0x3Cu,1u);
    PUSH(A); CALL(0x417FA6u,0x464F2Au);
    W(SP+0x44u,A);
    C=M(B+0xA50u); PUSH(C);
    D=SP+0x18u;
    PUSH(0u); PUSH(D); PUSH(6u); PUSH(1u);
    CALL(0x416D82u,0x464F45u);
    /* 464F45..464F62 */
    W(S+0x44u,A);
    A=M(B+0xA50u); PUSH(A);
    C=SP+0x2Cu;
    PUSH(0u); PUSH(C); PUSH(14u); PUSH(1u);
    CALL(0x416D82u,0x464F5Fu);
    SP=add32(s,SP,0x2Cu); W(S+0x48u,A);

exit_no_bp: /* 464F65..464F6E */
    I=pop32(s); S=pop32(s); B=pop32(s);
    SP=add32(s,SP,0x88u); s->eip=pop32(s);
finished:
#undef A
#undef C
#undef D
#undef B
#undef SP
#undef BP
#undef S
#undef I
#undef M
#undef W
#undef PUSH
#undef CALL
    return;
}
```

## Width, stack and contract audit

All address/integer operations are unsigned 32-bit wrap. SAR explicitly sign-fills bit patterns; CL uses its low byte then low five bits. No C signed overflow/right-shift assumption, no shift by 32, no signed WORD load. E40 performs the only partial-register target write: AX after full EAX clear. There are no AL operations. SHRs are logical. CLUT calculation is `base + 32 * unsigned_word`, modulo 2^32; the native mask/SHR/SHL split remains in code, not a 15-bit substitution. No target FP arithmetic occurs.

Let entry ESP be E. Under normal cdecl completion, descriptor is E-84h, separate coordinate DWORD E-88h, saved EBX/ESI/EDI lie below the 88h local reservation; saved EBP exists only in the stage path. E61 stores descriptor+28h; EBE/F1C stores descriptor+2Ch=1; ECC/F2A stores descriptor+30h. Guest ESP-relative accesses are deliberately retained: this also handles memory aliasing and mutation of argument/local slots by helpers, rather than assuming constant host locals. Each push/store/read occurs in native order, including owner reloads and publication before later calls.

Stage cleanup EB8: `8+4+32+20 = 40h` pending argument bytes, not the saved EBP. Later EE7 removes `4+20 = 18h`. Alternate F19 removes initial 8; F5F removes `4+20+20 = 2Ch`. Native CALL pushes the precise next PC; bridge consumes its real return. Both target returns are C3, leaving caller arguments untouched (exit ESP=E+4 under the supported ABI). Restoration reads actual saved memory, not cached entry registers.

The stage blit stack has eight callee-order words: computed source, 800h, current slot+60, current nested `[slot+5C]+44`, slot+C, slot+10, slot+14, computed CLUT address. Native source expression, when intervening memory remains unchanged, is `base + 2 * (((slot_y + 256*((arg1>>4)&1)) << 10) + 64*(arg1&15) + SAR32(slot_x,(2-mode)&31))`, all wrap32. This explanatory expression does not authorize hoisting its reads.

Factories receive `(1,6,descriptor,0,owner)` and `(1,14,descriptor,0,owner)`. Results are stored to slot+44 then slot+48. Early +44 nonzero calls nothing and leaves that DWORD in EAX. Stage allocation failure leaves EAX zero, after +60 reset and +5C publication. Both construction branches leave the second factory result in EAX even if NULL. **Whether native callers consume that residual EAX is UNCERTAIN**, not a proven status or pointer-return API. Slot+48 is not tested at entry; pair consistency, allocation cleanliness, lifetime/rollback and NULL safety are not established.

## Bounded meaning and eight evidence anchors

Proposed name: **`Gfx_EnsureSlotAuxiliaryDrawListPair`**. High confidence in conditional construction/publication of the pair; medium confidence in graphics/alpha purpose from supplied previously validated neighbour contracts. Two direct independent proof families are the +44 early gate and the two factory calls/constants/publication sites. Stage-specific data preparation plus the supplied 4677D0 contract supports alpha staging, **not hardware upload, World semantics or feature-switch identity**.

Paths in this section are relative to the own-C input directory stated above; labels/comments are not proofs.

1. `native-asm-001.txt:1–13`, **464DB0–464DD9**; bytes lines 1–2: actual stack reservation, +44 gate, call to 40A04A and global 1CCFD88 branch. Gate ignores +48.
2. `native-asm-001.txt:14–25`, `native-asm-002.txt:1–6`, **464DDF–464E1B**; bytes lines 2–4: +60 literal zero, argument bits, +5C test, F0h request and allocation-result failure gate.
3. `native-asm-002.txt:7–25`, **464E21–464E5C**; bytes lines 4–6: descriptor pointer computed before EBP push, two init pushes, separate slot-helper push, third argument reloaded, `33 C0` and `66 8B 82 48 04 00 00` prove zero-extended WORD, not signed/15-bit input.
4. `native-asm-003.txt:1–25`, `native-asm-004.txt:1`, **464E5F–464E9C**; bytes lines 6–8: +28 descriptor store, eight pushes, `D3 FA` SAR by CL, row SHL 10 and LEA scale 2. Compaction line 13 supplies neighbour eight-word alpha-blit contract, not target business proof.
5. `native-asm-004.txt:2–25`, **464EA1–464EEA**; bytes lines 8–10: factory constants 6/14, immediate +44 publication, nested helper and +30 mutation, fresh owner load, then +48 publication. Compaction lines 14–15 support descriptor/factory ABI; no extra prototypes inferred.
6. `native-asm-005.txt:7–25`, `native-asm-006.txt:1–17`, **464EF8–464F62**; bytes lines 11–14: secondary switch chooses initializer input 2/0, nested helper uses slot+24, same two factory kinds without stage/blit.
7. `native-asm-005.txt:1–6`, `native-asm-006.txt:18–22`, **464EED–464EF7 / 464F65–464F6E**; bytes lines 10–11/14: conditional EBP restore and plain C3 returns. This proves two epilogues and caller argument cleanup, not a semantic return type.
8. `native-metadata.json:11–105`: ten exact CFG blocks and two incoming code xrefs **464CCC in 464BD0**, **465FAF in 465CE0**; seven direct numeric targets agree with manually checked relative call displacements. No caller body is supplied here, so these xrefs alone do not establish parameter business types or EAX use. Compaction lines 19–20 give documentary surrounding slot context only.

## Limits and parent validation requests

Full bodies/contracts of 40A04A, 467160, 464160 and 417FA6 are not supplied. The lift preserves their opaque native effects instead of inventing purity, register preservation beyond actual execution, prototypes or safeguards. FP state must travel through the adapter unchanged except for actual native callee effects. Known neighbour contracts were supplied documentary context, not newly native-audited by R.

This lift guarantees ordered target architectural behaviour under completing ABI execution with its memory/callee adapter; it does not certify restart/exception PCs at every instruction, asynchronous/debug timing, concurrent access, code-self-modification, concrete CPU behaviour for architecturally undefined flags, or a native host pointer ABI integration. Intermediate EIP is only explicit at calls/RET. No executable behaviour for unknown callees is fabricated.

No shell, IDA, index, history, other volet/output, git, registry, live, delegation, build or differential execution was used. No independent raw-file hash computation was available; parent computes hashes. Parent still owns native §5.6, bridge compilation/validation, IDB/promotion and integration. Requested checks: all ten blocks/terminal cases; source mode effective counts 0/1/31 and 32-equivalent; CLUT bit15 set; helper mutation of +60/+5C, arguments, owner and descriptor; memory aliases with stack; zero first/second factory results; both exact cleanup/restore paths; flags and x87 preservation across the native adapter. These are unexecuted validation needs, not PASS claims.
