# 0x500900 — C R, ASM-reconciled

## Scope, provenance and disposition

R: c-r-500900, OpenAI GPT-6.1 Sol. Only this C projection's A/B, common compaction, original packet and native slices/metadata/manifests were consulted. No semantic-volet output or prior verdict was read.

Both authors are present in `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g07/0x500900/C/manifest.json`, with distinct native sessions:

| Author | Session | Effective model recorded by parent | Deposited SHA-256 |
|---|---|---|---|
| A | ses_ed3cfd8f4ffeITDieZhMj0P56K | openai/gpt-6-astra, high | 14ddb68e600f99ea83a611e8a6a0f0a94c10383b2fb58b867f370fff4777dcd9 |
| B | ses_ed3cfd60effeH94U9ZgeZxAO1O | openai/gpt-6.1-sol, high | 2089ffd2c67f426dde09f8bb7755eb25fb81f7b79f820be37d563b5dcc8fcf8c |

Packet SHA-256 `0c68458ed2dd63fc4969914f650dfd11176145e5b11dda0e4ce2d917cff21590`; common-compaction SHA-256 `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Original/native manifest references agree with these declarations and all slice declarations. Hashes are **parent-declared, not independently recomputed**: available tools cannot read raw file bytes for hashing. Parent must verify content hashes before acceptance; no observed declaration conflict or missing author. Independent-session provenance is recorded, not independently audited through any session/API.

Freeze: 32-bit FF8_EN.exe SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export 2026-10-11T16:38:25.140966+00:00. Read the original packet, all nine native-asm slices (206 instructions), both native-bytes slices, complete native-metadata and native-manifest. The original packet's long assembly line is display-truncated; **it was not used as a complete ASM source**. Complete slices supply that field, and both chunk hex strings are fully visible. Coverage is `[500900,5009A1)` plus `[5005A0,50081F)`, 0x320 bytes, all 20 CFG blocks.

Disposition: complete reconciled C lift below, with a confirmed B call-target/order defect corrected. Bounded follow-up also corrects an **A/frozen-compaction/initial-R prose stride error**: native OT stride is 17544 decimal = 0x4488, not 0x8910. A/B and reconciled C instruction formulas were already correct and are unchanged. High confidence for normal-return local instruction effects; not native acceptance or a standalone linked replacement. Business/callee contracts remain UNCERTAIN.

## Convergences, divergences, common-error checks

| Point | A versus B | ASM/bytes decision |
|---|---|---|
| Calls at 500988 and 500992 | A: 504060 then 5033E0. B: 5033E0 then 504060. | **A correct, B defective.** `500988: E8 D3 36 00 00` gives 50098D+36D3=504060; `500992: E8 49 2A 00 00` gives 500997+2A49=5033E0. Swapping these can alter state consumed by intervening 506E30 and the later call. Correct numeric targets below. |
| Undefined arithmetic flags | A retains numeric AF/OF as permitted undefined choices; B marks undefined bits with known_flags and clears their numeric values. | Both can represent permitted architectural choices, neither proves a particular processor's unspecified values. Final model retains unspecified numeric bits and marks them unknown. Native adapter must honor this distinction. |
| Floating state | A opaque x87; B opaque complete x87/SSE state. | No local x87/SSE opcode. Preserve complete floating environment across every opaque call; assume no rounding mode, empty stack, precision or exception policy. |
| OT stride prose: common error | A states 0x8910; B does not give a numeric stride but has the same native formula. Frozen compaction and initial R prose state 0x8910. | **Reject the 0x8910 assertion independently of agreement.** Each of the three native sequences gives `(i + 8*(17*i))*16 + i = 2193*i`, then address scale 8 gives 17544*i = 0x4488*i. All three C formulas are faithful; initial R prose was defective and is corrected below. |
| Remaining instruction effects | A/B converge on chunks, reads/stores, guards, strides, delayed stack cleanup and partial registers. | Re-derived against every native slice, not accepted by agreement. Full EAX tests differ intentionally from AL stores; all camera values and flags/index observations are re-read at their native positions. |

Common-error search found the OT-stride prose error above, initially missed by R; agreement with frozen compaction was not evidence. Other checks: no missing attached tail; no mistaken fifth direct caller (47D905 is jump type 19); no invented index toggle or index<=1 condition; no replacement of labeled nullsubs with omissions; no collapse of repeated camera calls; no conflation of OT bases 1D924DC and 1D8E058; no widened camera clears; no cached bit-4 tests across calls. Both C candidates depend on unimplemented native/memory adapters and do not establish callee types, actual callback semantics or exact exception/interruption states. This shared limitation is retained explicitly, not upgraded by A=B.

## Representation / ABI

The following is complete C99 for the target's normal control flow in an explicit IA-32 state, **not a proposed native C prototype**. All actual calls are numeric E8 transfers. Helpers/hooks are evaluator primitives, not additional FF8 calls or guessed callee signatures.

Memory hooks perform one little-endian access of the stated width, in a common flat 32-bit address space including stack. Hooks preserve machine registers/flags/floating state on success, preserve aliasing and access order, and deliver native faults rather than adding guards. Valid address arithmetic wraps modulo 2^32. Use an ordinary 32/64-bit C host with unsigned uint32_t arithmetic (as on the stated Windows target).

`run_to` executes native code from the explicitly pushed return address until the specified resume VA, carrying every actual callee effect and actual stack adjustment. It does not manufacture returns from nonreturning calls. No globals or caller-saved registers are assumed preserved. Outstanding argument words remain physically on the modeled stack, including through calls that push no new arguments. Caller ADD ESP is retained exactly; the observed convention is cdecl-style caller cleanup, not proof of each callee's source prototype. Entry loads no caller argument and does not itself save/write EBX/EBP/ESI/EDI. Exit EAX is the final computed OT address; the source-level intended return type remains unknown.

`known_flags` tracks defined bits. Undefined flags are not promoted to facts. No local floating operation occurs; the opaque floating state includes x87 registers/control/status/tag and SSE/MXCSR and must pass unchanged through local integer operations, with callee changes carried by `run_to`. EIP is set at call entry and final RET; this is not a per-instruction debugger/exception emulator. Exact interrupted/faulting instruction snapshots, instruction-fetch faults, timings and asynchronous events are outside this lift's claim.

## Complete reconciled C

```c
#include <stdint.h>

typedef uint8_t U8;
typedef uint16_t U16;
typedef uint32_t U32;
typedef struct CPU CPU;
struct CPU {
    U32 eax, ecx, edx, ebx, esp, ebp, esi, edi, eip;
    U32 flags, known_flags;
    void *memory, *floating_state;
    U8  (*rd8)(CPU *, U32);
    U16 (*rd16)(CPU *, U32);
    U32 (*rd32)(CPU *, U32);
    void (*wr8)(CPU *, U32, U8);
    void (*wr16)(CPU *, U32, U16);
    void (*wr32)(CPU *, U32, U32);
    void (*run_to)(CPU *, U32 resume_va);
};
enum { CF=1, PF=4, AF=16, ZF=64, SF=128, OF=2048,
       ARITH=CF|PF|AF|ZF|SF|OF };

static U32 mask(unsigned b) { return b==8 ? 255u : UINT32_MAX; }
static U32 signbit(unsigned b) { return b==8 ? 128u : 0x80000000u; }
static U32 szp(U32 r, unsigned b) {
    U32 p;
    r &= mask(b); p=r&255u;
    p^=p>>4; p^=p>>2; p^=p>>1;
    return (r==0 ? ZF:0u) | ((r&signbit(b)) ? SF:0u)
           | ((p&1u) ? 0u:PF);
}
static void flags_set(CPU *c, U32 f, U32 known) {
    /* Retain unspecified numeric bits without asserting they are defined. */
    c->flags=(c->flags&~known)|(f&known);
    c->known_flags=(c->known_flags&~(U32)ARITH)|known;
}
static U32 addw(CPU *c, U32 a, U32 b, unsigned width) {
    U32 r, m=mask(width), s=signbit(width);
    a&=m; b&=m; r=(a+b)&m;
    flags_set(c,szp(r,width)|(r<a ? CF:0u)
        | (((a^b^r)&16u) ? AF:0u)
        | ((~(a^b)&(a^r)&s) ? OF:0u),ARITH);
    return r;
}
static U32 subw(CPU *c, U32 a, U32 b, unsigned width) {
    U32 r, m=mask(width), s=signbit(width);
    a&=m; b&=m; r=(a-b)&m;
    flags_set(c,szp(r,width)|(a<b ? CF:0u)
        | (((a^b^r)&16u) ? AF:0u)
        | (((a^b)&(a^r)&s) ? OF:0u),ARITH);
    return r;
}
static U32 logic(CPU *c, U32 r, unsigned width) {
    r&=mask(width);
    flags_set(c,szp(r,width),ARITH&~(U32)AF);
    return r;
}
static U32 shl(CPU *c, U32 a, unsigned n) {
    U32 r, carry, f, known;
    n&=31u; if (!n) return a;
    r=a<<n; carry=(a>>(32u-n))&1u;
    f=szp(r,32)|(carry ? CF:0u); known=CF|PF|ZF|SF;
    if (n==1) { known|=OF; if ((r>>31)^carry) f|=OF; }
    flags_set(c,f,known); return r;
}
static U32 sx16(U16 v) {
    return (U32)v|((v&0x8000u) ? 0xffff0000u:0u);
}
static void al_set(CPU *c, U8 v) {
    c->eax=(c->eax&0xffffff00u)|(U32)v;
}
static void push(CPU *c, U32 v) {
    c->esp-=4u; c->wr32(c,c->esp,v);
}
static void call(CPU *c, U32 dst, U32 resume) {
    push(c,resume); c->eip=dst; c->run_to(c,resume);
}
#define R8(a)    c->rd8(c,(U32)(a))
#define R16(a)   c->rd16(c,(U32)(a))
#define R32(a)   c->rd32(c,(U32)(a))
#define W8(a,v)  c->wr8(c,(U32)(a),(U8)(v))
#define W16(a,v) c->wr16(c,(U32)(a),(U16)(v))
#define W32(a,v) c->wr32(c,(U32)(a),(U32)(v))
#define ADD(d,v) ((d)=addw(c,(d),(U32)(v),32))
#define SUB(d,v) ((d)=subw(c,(d),(U32)(v),32))
#define AND(d,v) ((d)=logic(c,(d)&(U32)(v),32))
#define XOR(d,v) ((d)=logic(c,(d)^(U32)(v),32))
#define SHL(d,n) ((d)=shl(c,(d),(n)))
#define T8(a,b)  ((void)logic(c,(U32)(a)&(U32)(b),8))
#define T32(a,b) ((void)logic(c,(U32)(a)&(U32)(b),32))
#define ZERO    ((c->flags&ZF)!=0)
#define P(v)    push(c,(U32)(v))
#define C(d,r)  call(c,(d),(r))

void lift_00500900(CPU *c) {
    /* 500900 */
    C(0x0048d0d0u,0x00500905u);
    c->eax=R32(0x01d96aa4u); P(c->eax);
    C(0x00508420u,0x00500910u);
    c->ecx=R32(0x01d96a8cu); P(c->ecx);
    C(0x00508420u,0x0050091cu);
    c->edx=R32(0x01d96aa0u); P(c->edx);
    C(0x00508420u,0x00500928u);
    W8(0x01d96a90u,c->eax);
    c->eax=R32(0x01d96aacu);
    ADD(c->esp,12u); T32(c->eax,c->eax);
    if (ZERO) goto L50094b;
    /* 500939 */
    P(c->eax); C(0x00508420u,0x0050093fu);
    ADD(c->esp,4u); T32(c->eax,c->eax);
    if (!ZERO) goto L50094b;
    /* 500946 */
    W32(0x01d96aacu,c->eax);
L50094b:
    c->eax=R32(0x01d96aa8u); P(c->eax);
    C(0x00508420u,0x00500956u);
    W8(0x01d96a88u,c->eax);
    C(0x00502020u,0x00500960u);
    C(0x004bb090u,0x00500965u);
    C(0x0048d0d0u,0x0050096au);
    c->ecx=R32(0x01d96a94u); P(c->ecx);
    C(0x00508420u,0x00500976u); ADD(c->esp,8u);
    C(0x0048d0d0u,0x0050097eu);
    C(0x00506c30u,0x00500983u);
    C(0x0048d0d0u,0x00500988u);
    C(0x00504060u,0x0050098du); /* corrected B target */
    C(0x00506e30u,0x00500992u);
    C(0x005033e0u,0x00500997u); /* corrected B target */
    C(0x00502020u,0x0050099cu);
    /* E9 at 50099C -> 5005A0, no extra call/return. */

    /* 5005A0 */
    T8(R8(0x01d96a9cu),4u);
    if (ZERO) goto L50065e;
    /* 5005AD */
    c->eax=R32(0x00b8a3e4u); P(c->eax);
    c->eax=R32(0x01d96a80u); AND(c->eax,255u); XOR(c->eax,1u);
    c->ecx=c->eax+c->eax*2u;
    SHL(c->ecx,3); SUB(c->ecx,c->eax);
    c->eax=R32(0x01d8e04cu); ADD(c->eax,8u);
    c->edx=0x01d969c8u+c->ecx*4u;
    P(c->edx); P(c->eax); C(0x004a9160u,0x005005deu);
    al_set(c,R8(0x01d96a9cu)); ADD(c->esp,12u); T8(c->eax,4u);
    if (ZERO) goto L50065e;
    /* 5005EA */
    c->ecx=R32(0x01d96a80u); AND(c->ecx,255u);
    c->eax=c->ecx;
    c->edx=c->ecx+c->ecx*2u;
    XOR(c->eax,1u); SHL(c->edx,3); SUB(c->edx,c->ecx);
    c->ecx=0x01d969c8u+c->edx*4u;
    c->edx=c->eax+c->eax*2u;
    SHL(c->edx,3); SUB(c->edx,c->eax);
    P(c->ecx);
    c->ecx=0x01d969c8u+c->edx*4u;
    c->edx=c->eax+c->eax*4u;
    P(c->ecx);
    c->ecx=R32(0x00b8a3e4u);
    c->eax=0x01d96980u+c->edx*4u;
    P(c->eax); P(c->ecx); C(0x004a9220u,0x00500632u);
    al_set(c,R8(0x01d8e03au)); ADD(c->esp,16u); T8(c->eax,c->eax);
    if (ZERO) goto L50065e;
    /* 50063E: unsigned AL comparison, not signed char. */
    (void)subw(c,c->eax,16u,8);
    if (c->flags&(CF|ZF)) goto L50064b;
    /* 500642: only AL is modified. */
    al_set(c,(U8)addw(c,c->eax,0xf0u,8));
    W8(0x01d8e03au,c->eax); goto L50065e;
L50064b:
    AND(c->eax,1u); P(c->eax); C(0x0045c310u,0x00500654u);
    ADD(c->esp,4u); W8(0x01d8e03au,0u);
L50065e:
    C(0x00501b60u,0x00500663u);
    C(0x00501230u,0x00500668u);
    T8(R8(0x01d96a9cu),8u); if (ZERO) goto L50068f;
    /* 500671 */
    C(0x00505d20u,0x00500676u);
    P(1u); P(0x01d8e040u); C(0x0045c9f0u,0x00500682u);
    P(0x01d8e040u); C(0x0045c320u,0x0050068cu);
    ADD(c->esp,12u);
L50068f:
    T8(R8(0x01d96a9cu),4u); if (ZERO) goto L50074d;
    /* 50069C */
    c->eax=R32(0x01d96a80u); AND(c->eax,255u); XOR(c->eax,1u);
    c->edx=c->eax+c->eax*2u;
    SHL(c->edx,3); SUB(c->edx,c->eax);
    c->eax=0x01d969c8u+c->edx*4u;
    P(c->eax); C(0x0045b660u,0x005006beu);
    c->eax=R32(0x01d96a80u); AND(c->eax,255u);
    c->ecx=c->eax; SHL(c->ecx,4); ADD(c->ecx,c->eax);
    c->edx=c->eax+c->ecx*8u;
    SHL(c->edx,4); ADD(c->edx,c->eax);
    c->eax=0x01d924dcu+c->edx*8u;
    P(c->eax); C(0x0045d610u,0x005006e4u);
    c->ecx=sx16(R16(0x01d8e038u));
    P(c->ecx); C(0x0056cd00u,0x005006f1u);
    c->edx=sx16(R16(0x01d8e03eu));
    c->eax=sx16(R16(0x01d8e03cu));
    ADD(c->edx,0x6cu); ADD(c->eax,0xa0u);
    P(c->edx); P(c->eax); C(0x0056cce0u,0x0050070eu);
    c->ecx=sx16(R16(0x01d8e038u));
    P(c->ecx); C(0x0056cd00u,0x0050071bu);
    c->edx=sx16(R16(0x01d8e03eu));
    c->eax=sx16(R16(0x01d8e03cu));
    ADD(c->edx,0x6cu); ADD(c->eax,0xa0u);
    P(c->edx); P(c->eax); C(0x0056cce0u,0x00500738u);
    ADD(c->esp,32u);
    W16(0x01d8e03eu,0u); W16(0x01d8e03cu,0u);
L50074d:
    c->eax=R32(0x01cff834u); T32(c->eax,c->eax);
    if (!ZERO) goto L5007a9;
    /* 500756: retain PUSH placement relative to arithmetic. */
    c->eax=R32(0x01d96a80u); P(0xffffffffu);
    AND(c->eax,255u); P(0x111eu);
    c->ecx=c->eax; P(0x101eu);
    SHL(c->ecx,4); ADD(c->ecx,c->eax);
    P(0x101au); P(0x1019u); P(0x1011u);
    c->edx=c->eax+c->ecx*8u; P(0x11u);
    SHL(c->edx,4); P(9u); ADD(c->edx,c->eax);
    P(5u); P(1u); P(0u);
    c->eax=0x01d8e058u+c->edx*8u;
    P(0x1122u); P(c->eax); C(0x0045d550u,0x005007a6u);
    ADD(c->esp,52u);
L5007a9:
    T8(R8(0x01d96a9cu),0x80u);
    c->eax=R32(0x01d96a80u); /* MOV preserves the TEST flags. */
    if (ZERO) goto L5007d8;
    /* 5007B7 */
    c->edx=R32(0x00b6d094u); AND(c->eax,255u);
    c->ecx=c->eax+c->eax*8u;
    SHL(c->ecx,14); ADD(c->ecx,c->edx);
    W32(0x01d8e054u,c->ecx); ADD(c->ecx,0x24000u);
    goto L5007fd;
L5007d8:
    c->edx=R32(0x00b6d070u); AND(c->eax,255u);
    c->ecx=c->eax*8u; SUB(c->ecx,c->eax);
    SHL(c->ecx,14); ADD(c->ecx,c->edx);
    W32(0x01d8e054u,c->ecx); ADD(c->ecx,0x1c000u);
L5007fd:
    W32(0x01d969a8u,c->ecx);
    c->ecx=c->eax; SHL(c->ecx,4); ADD(c->ecx,c->eax);
    c->edx=c->eax+c->ecx*8u;
    SHL(c->edx,4); ADD(c->edx,c->eax);
    c->eax=0x01d8e058u+c->edx*8u;
    W32(0x01d8e04cu,c->eax);
    c->eip=R32(c->esp); c->esp+=4u; /* 50081E: plain near RET */
}
#undef R8
#undef R16
#undef R32
#undef W8
#undef W16
#undef W32
#undef ADD
#undef SUB
#undef AND
#undef XOR
#undef SHL
#undef T8
#undef T32
#undef ZERO
#undef P
#undef C
```

## Widths, access order, strides and outgoing stack

Every global/index load written as R32 remains a DWORD load, even where subsequently masked to FF. Tests of 1D96A9C are BYTE accesses. MOV AL at 5005DE/500632 preserves EAX high bits; ADD AL F0 is eight-bit wrap; AND EAX,1 at 50064B clears every high bit. AL result stores at 500928/500956 never normalize to Boolean. Optional 1D96AAC clears only after a full-EAX zero result, not AL==0.

Index `i=DWORD[0x01D96A80]&0xFF`, opposite `i^1`, neither bounded to {0,1}. Native formulas yield base 0x01D969C8 + 0x5C*i (92*i decimal), secondary base 0x01D96980 + 0x14*i (20*i decimal), and the following independently expanded OT addresses. All arithmetic is modulo 2^32.

| Native sequence | Exact expansion from each MOV/SHL/ADD/LEA | Final address, decimal and hex |
|---|---|---|
| 5006C8..5006D7 | 5006C8: ECX=i; 5006CA: ECX=16*i; 5006CD: ECX=17*i; 5006CF: EDX=i+8*ECX=137*i; 5006D2: EDX=2192*i (0x890*i); 5006D5: EDX=2193*i (0x891*i); 5006D7: EAX=0x01D924DC+8*EDX | 31007964 + 17544*i = **0x01D924DC + 0x4488*i** |
| 500767..500794 | 500767: ECX=i; 50076E: ECX=16*i; 500771: ECX=17*i; 500782: EDX=i+8*ECX=137*i; 500787: EDX=2192*i (0x890*i); 50078C: EDX=2193*i (0x891*i); 500794: EAX=0x01D8E058+8*EDX; interleaved PUSH instructions do not change these values | 30990424 + 17544*i = **0x01D8E058 + 0x4488*i** |
| 500803..500812 | 500803: ECX=i; 500805: ECX=16*i; 500808: ECX=17*i; 50080A: EDX=i+8*ECX=137*i; 50080D: EDX=2192*i (0x890*i); 500810: EDX=2193*i (0x891*i); 500812: EAX=0x01D8E058+8*EDX | 30990424 + 17544*i = **0x01D8E058 + 0x4488*i** |

Thus the native OT stride is **17544 decimal = 0x4488**, not 0x8910 (35088 decimal). Each sequence has its own freshly observed i; no index value is shared across calls by inference. The final sequence also determines native exit EAX and the DWORD OT-base store at 500819.

Packet arithmetic is separately correct: bit0x80 set gives 5007C2 ECX=9*i, 5007C5 ECX=(9*i)<<14=147456*i=**0x24000*i**, then adds DWORD[0x00B6D094]; end increment at 5007D0 is **0x24000 = 147456 decimal**. Bit0x80 clear gives 5007E3 ECX=8*i, 5007EA ECX=7*i, 5007EC ECX=(7*i)<<14=114688*i=**0x1C000*i**, then adds DWORD[0x00B6D070]; end increment at 5007F7 is **0x1C000 = 114688 decimal**. These are address formulas, not declarations of independently nonaliasing arrays. Arbitrary permitted i may alias other data: shared memory preserves that.

Bit-4 observations at 5005A0, 5005DE/5005E6 and 50068F are separate. Bit-8 at 500668 and bit-80 at 5007A9 are independent. Index and camera reads may change across opaque calls. Signed WORD camera reads are 038, then 03E/03C, repeated after intervening calls; 03E is cleared before 03C, each a WORD, only after all six submission/camera calls and 0x20-byte (32-byte) cleanup. Pause DWORD gates only 45D550, not the entire function. The global index is never toggled by this body.

Caller-cleaned newly pushed argument words, listed nearest the native return address first (values, not claimed prototypes; addresses/constants and cleanup sizes in the table are hexadecimal):

| Callsite(s) | Destination | Words / cleanup |
|---|---|---|
| 50090B/917/923 | 508420 | one head each: AA4/A8C/AA0; combined 0C at 500932 |
| 50093A | 508420 | current optional AAC head; 4 at 50093F |
| 500951/971 | 508420 | AA8/A94 heads; combined 8 at 500976, first persists through 502020/4BB090/48D0D0 |
| 5005D9 | 4A9160 | OT+8, opposite 1D969C8 address, DWORD[B8A3E4]; 0C |
| 50062D | 4A9220 | DWORD[B8A3E4], opposite 1D96980 address, opposite/current 1D969C8 addresses; 10 |
| 50064F | 45C310 | full EAX&1; 4 |
| 50067D/687 | 45C9F0 / 45C320 | (1D8E040,1), then (1D8E040); combined 0C |
| 5006B9/6DF/6EC/709/716/733 | 45B660 / 45D610 / 56CD00 / 56CCE0 / 56CD00 / 56CCE0 | 1+1+1+2+1+2 words; combined 20 at 500738 |
| 5007A1 | 45D550 | (OT,1122,0,1,5,9,11,1011,1019,101A,101E,111E,FFFFFFFF), all hex; 34 |

Remaining calls have zero **newly** pushed argument words; that does not prove zero-argument source signatures. Every CALL return word and every PUSH is modeled, including retained arguments visible to subsequent callees. Normal cdecl returns plus observed cleanups restore entry ESP before RET. Callee misbehavior/other stack effects are not compensated by fabricated cleanup.

## Conservative role/contract and eight exact anchors

C-only structural interpretation, not a reconciliation of the separate semantic authors: proposed descriptive name **BattleFrame_RunStagesAndPrepareBuffers**. HIGH confidence that it sequences native stages and prepares indexed output-memory regions; MEDIUM confidence of battle presentation/render/camera association from frozen common context. “GF input”, audio purpose, task completion meaning and actual callee effects remain UNCERTAIN. No authoritative rename proposed.

Input: global DWORD heads, BYTE flags/counter, DWORD index/base/pause, signed WORD parameters, inherited machine/stack/floating state. Local direct output: two AL bytes, conditional head-zero DWORD, conditional counter update/clear BYTE, conditional two WORD clears, unconditional packet-start/end and OT-base DWORDs, final EAX/ECX/EDX/flags/RET state. Additional effects of native calls are opaque. No proof of gameplay-state purity or callback-set bounds.

Two independent structural proofs are (1) distinct global heads dispatched to identical target 508420 with staged result handling; (2) address-stride construction and gated native submission sequence followed by unconditional cursor/end/OT writes. Labels/comments are not used as either proof.

1. **500905–500956**, native-asm-001:2–25 / bytes-001:1–3: distinct head loads, AL stores, optional full-EAX zero-test and DWORD clear.
2. **500988 / 500992 / 50099C**, native-asm-002:11–15 / bytes-001:5–6: corrected rel32 targets 504060/5033E0, discontiguous E9 to 5005A0.
3. **5005A0–50064B**, native-asm-002:16–25, -003, -004:1–19: re-tested BYTE bit4, unrestricted masked/XOR index, 5C/14 strides, unsigned JBE and AL-only update/full-EAX AND.
4. **50065E–50068F**, native-asm-004:20–25 / -005:1–7: unconditional 501B60/501230 followed by separate bit8 call sequence, then fresh bit4.
5. **5006D7–500744**, native-asm-005:25 / -006:1–25: 1D924DC OT address, six MOVSX WORD loads, repeated 56CD00/56CCE0 calls and ordered WORD clears.
6. **50074D–5007A6**, native-asm-007 / -008:1–2: DWORD pause-like zero gate, 13-word native stack sequence, 34-byte cleanup.
7. **5007A9–50081E**, native-asm-008:3–25 / -009, bytes-002:3–6: bit80 tested before index MOV, packet alternatives, ordered DWORD stores and plain RET.
8. **47D63D/47D6C5/47D707/47D811 and 47D905**, native-metadata:161–191: four call xrefs in owner 47CCB0, one jump xref in 47D900; corroborates shared entry use without proving caller business purpose.

## Residual risks / lead-owned validation

No compilation, emulator/native differential execution, live access, IDB write, Git, registry or integration was performed. All re-derivation here is static. Adapter implementations are absent by design; exact callee prototypes/bodies, callback set, actual array bounds, floating changes and processor-specific undefined flags are not established. The final C is a complete local-state lift conditional on those explicit adapter contracts, not an independently executable implementation of callees.

Lead should rehash deposits and output, compile/helper-test in its authorized harness, compare ordered memory/register/stack snapshots across all CFG outcomes, including callback mutations, EAX!=0 with AL==0, unsigned counter 10/11/FF, signed WORD extremes, index>1, aliasing, and both packet arms. Native §5.6, acceptance/promotion and final save/readback remain exclusively the lead's responsibility. No CERTAIN business verdict is inferred from author agreement.
