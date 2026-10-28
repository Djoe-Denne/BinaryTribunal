# Independent C B — 0x464DB0

## Evidence and boundary

Input packet SHA256 (manifest citation, not recomputed): `9c59075630146d8ae274a6bcb36ffc91b884316984555a9375ec86eba9ab5c9d`. Common compaction SHA256: `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`. Executable SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Read the manifest, metadata, all six ASM slices (147 lines), all fourteen byte-slice lines, and common compaction. One contiguous chunk `[0x464DB0,0x464F6F)`, 447 bytes, ten CFG blocks. No target predecessor C, peer output, classifier, IDB, index or rediscovery consulted in this production. Inherited reader material is factual context, not target conclusions.

The C below is a complete **architectural-state lift**, deliberately not a guessed host function prototype. This choice retains pending cdecl arguments, saved registers, stack aliases, caller-saved register effects, and otherwise undocumented callees. There are exactly seven external target addresses, all in metadata. Runtime callbacks are an explicit machine-adapter interface, NOT invented game callees or library calls. A native caller starts with ESP pointing at its return address; DWORD arguments are at entry ESP+4/+8/+12. It finishes with native RET semantics and residual EAX, not a fabricated void/status contract.

## Complete C

```c
#include <stdint.h>

typedef uint32_t U32;
typedef uint16_t U16;
typedef struct X86 X86;
/* Implement these adapters against the same 32-bit address space.
 * r16/r32/w32 represent ONE access of the stated width, unaligned allowed.
 * run_callee executes the actual address through its return (including RET),
 * preserving every native memory/register/x87 effect. No host prototype or
 * purity/nonalias property is imposed on any game callee.
 */
struct X86 {
    U32 eax, ecx, edx, ebx, esp, ebp, esi, edi, eip;
    U32 flags, flags_known;
    void *memory;
    void *x87_environment; /* native control/status/tag/register state */
    U16 (*r16)(void *, U32);
    U32 (*r32)(void *, U32);
    void (*w32)(void *, U32, U32);
    void (*run_callee)(X86 *, U32);
};
enum { CF=1, PF=4, AF=16, ZF=64, SF=128, OF=2048 };

static U32 m32(X86 *s, U32 a) { return s->r32(s->memory,a); }
static void st32(X86 *s,U32 a,U32 v) { s->w32(s->memory,a,v); }
static U32 parity(U32 v) {
    v &= 255u; v ^= v>>4; v ^= v>>2; v ^= v>>1;
    return (v & 1u) ? 0u : PF;
}
static U32 psz(U32 v) {
    return parity(v) | (v==0u ? ZF : 0u) | (v>>31 ? SF : 0u);
}
static void fset(X86 *s,U32 mask,U32 value,U32 unknown) {
    s->flags=(s->flags & ~mask) | (value & mask);
    s->flags_known=(s->flags_known | mask) & ~unknown;
}
static U32 add32(X86 *s,U32 a,U32 b) {
    U32 r=a+b;
    fset(s,CF|PF|AF|ZF|SF|OF,psz(r)|(r<a?CF:0u)|
         (((a^b^r)&16u)?AF:0u)|((~(a^b)&(a^r)&0x80000000u)?OF:0u),0);
    return r;
}
static U32 sub32(X86 *s,U32 a,U32 b) {
    U32 r=a-b;
    fset(s,CF|PF|AF|ZF|SF|OF,psz(r)|(a<b?CF:0u)|
         (((a^b^r)&16u)?AF:0u)|(((a^b)&(a^r)&0x80000000u)?OF:0u),0);
    return r;
}
static U32 logic32(X86 *s,U32 r) {
    fset(s,CF|PF|ZF|SF|OF,psz(r),AF); return r;
}
static U32 shl32(X86 *s,U32 v,U32 count) {
    U32 n=count&31u, r=v, last=0;
    if(n==0u) return v;
    for(U32 i=0;i<n;i++) { last=r>>31; r<<=1; }
    fset(s,CF|PF|ZF|SF|(n==1u?OF:0u),
         psz(r)|(last?CF:0u)|((n==1u && ((r>>31)^last))?OF:0u),
         AF|(n==1u?0u:OF));
    return r;
}
static U32 shr32(X86 *s,U32 v,U32 count) {
    U32 n=count&31u, r=v, last=0;
    if(n==0u) return v;
    for(U32 i=0;i<n;i++) { last=r&1u; r>>=1; }
    fset(s,CF|PF|ZF|SF|(n==1u?OF:0u),
         psz(r)|(last?CF:0u)|((n==1u && (v>>31))?OF:0u),
         AF|(n==1u?0u:OF));
    return r;
}
static U32 sar32(X86 *s,U32 v,U32 count) {
    U32 n=count&31u, r=v, last=0;
    if(n==0u) return v;
    for(U32 i=0;i<n;i++) { last=r&1u; r=(r>>1)|(r&0x80000000u); }
    fset(s,CF|PF|ZF|SF|(n==1u?OF:0u),psz(r)|(last?CF:0u),
         AF|(n==1u?0u:OF));
    return r;
}
static void push32(X86 *s,U32 v) { s->esp-=4u; st32(s,s->esp,v); }
static U32 pop32(X86 *s) { U32 v=m32(s,s->esp); s->esp+=4u; return v; }
static void call32(X86 *s,U32 target,U32 return_pc) {
    push32(s,return_pc); s->eip=target; s->run_callee(s,target);
}

void lift_00464DB0(X86 *s) {
#define A s->eax
#define C s->ecx
#define D s->edx
#define B s->ebx
#define SP s->esp
#define BP s->ebp
#define S s->esi
#define I s->edi
#define M(a) m32(s,(U32)(a))
#define W(a,v) st32(s,(U32)(a),(U32)(v))
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

    /* 464DDF..464E07: save page's bit 4 as 0 or 256. */
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

stage: /* 464E21..464EEA */
    A=SP+0x10u; /* descriptor address, computed BEFORE push EBP */
    PUSH(BP); PUSH(A); PUSH(0u);
    CALL(0x40702Fu,0x464E2Eu);
    PUSH(S); CALL(0x464160u,0x464E34u);
    D=M(SP+0xB0u);
    A=logic32(s,0u);
    C=M(S+0x5Cu);
    /* XOR EAX,EAX; MOV AX,[...] => exactly zero-extended WORD */
    A=(A&0xFFFF0000u)|(U32)s->r16(s->memory,D+0x448u);
    D=M(S+0x14u);
    BP=A; A=logic32(s,A&63u);
    BP=shr32(s,BP,6u); BP=shl32(s,BP,6u);
    BP=add32(s,BP,A);
    A=M(0x1CB602Cu);
    BP=shl32(s,BP,5u); BP=add32(s,BP,A);
    W(SP+0x48u,C); C=M(C+0x44u);
    PUSH(BP);
    BP=M(S+0x10u); PUSH(D); PUSH(BP);
    BP=M(S+0x0Cu); PUSH(BP); PUSH(C);
    C=M(S+0x60u); BP=M(SP+0x30u); PUSH(C);
    C=2u; C=sub32(s,C,D);
    D=M(S+4u); D=sar32(s,D,C&255u);
    C=M(S+8u); PUSH(0x800u);
    C=add32(s,C,BP); C=shl32(s,C,10u);
    I=add32(s,I,D); C=add32(s,C,I);
    D=A+C*2u; /* LEA: modulo 2^32, does not change flags */
    PUSH(D); CALL(0x4677D0u,0x464EA1u);
    A=M(B+0xA50u);
    C=SP+0x40u;
    PUSH(A); PUSH(0u); PUSH(C); PUSH(6u); PUSH(1u);
    CALL(0x416D82u,0x464EB8u);
    SP=add32(s,SP,0x40u);
    W(S+0x44u,A);
    W(SP+0x40u,1u);
    PUSH(A); CALL(0x417FA6u,0x464ECCu);
    W(SP+0x48u,A);
    D=M(B+0xA50u); PUSH(D);
    A=SP+0x1Cu;
    PUSH(0u); PUSH(A); PUSH(14u); PUSH(1u);
    CALL(0x416D82u,0x464EE7u);
    SP=add32(s,SP,0x18u); W(S+0x48u,A);
    /* 464EED..464EF7: distinct EBP-saving epilogue */
    BP=pop32(s); I=pop32(s); S=pop32(s); B=pop32(s);
    SP=add32(s,SP,0x88u); s->eip=pop32(s);
    goto finished;

alternate: /* 464EF8..464F11; EBP was never pushed on this path */
    A=M(0x1CA8A00u); (void)logic32(s,A);
    if(A!=0u) {
        C=SP+0x10u; PUSH(C); PUSH(2u); /* 464F01..464F08 */
    } else {
        D=SP+0x10u; PUSH(D); PUSH(0u); /* 464F0A..464F0F */
    }
    /* 464F11..464F62 */
    CALL(0x40702Fu,0x464F16u);
    A=M(S+0x24u); SP=add32(s,SP,8u);
    W(SP+0x3Cu,1u);
    PUSH(A); CALL(0x417FA6u,0x464F2Au);
    W(SP+0x44u,A);
    C=M(B+0xA50u); PUSH(C);
    D=SP+0x18u;
    PUSH(0u); PUSH(D); PUSH(6u); PUSH(1u);
    CALL(0x416D82u,0x464F45u);
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

All arithmetic operates on `uint32_t` bits. SAR sign-fills explicitly, independent of host signed-right-shift policy. CL counts use x86's low five bits, including `(2-mode)&31`; no mode range guard is added. AX is a WORD read into already-zero EAX, never sign-extended. No AL operation exists. Undefined AF/OF from logical/shifting operations are recorded in `flags_known`, not claimed deterministic. The code does not execute host FP arithmetic: this target has no x87 opcodes; actual callees receive the native x87 environment and may modify it. The adapter must not reset/normalize that environment.

## ABI, stack and effects

* Entry saves EBX/ESI/EDI; staging branch additionally saves EBP. Local reservation is 0x88 bytes. Descriptor starts entry-ESP minus 0x84, is 0x84 bytes; first local DWORD is separate. Thus the same descriptor has different ESP-relative offsets after pushes. All local accesses use guest addresses, not host locals, so mutation through a passed descriptor remains visible.
* The call at 464E9C has eight arguments, in source order: computed source, 0x800, slot+60 value, nested-record+44 value, slot+C, slot+10, slot+14, CLUT address. Push order is reversed. The original base EAX is deliberately retained across pushes until its use in LEA, just as the bytes specify.
* Staging's cleanup 0x40 removes 8-byte init args + 4-byte 464160 arg + 32-byte blit args + 20-byte factory args. The saved EBP remains. Later 0x18 removes the nested-helper argument plus five factory arguments. Alternate path's 0x2C removes one helper argument plus two five-argument factories. Calls are not prematurely cleaned up.
* Both factories use `(1,6,descriptor,0,owner)` then `(1,14,descriptor,0,owner)`. Owner at buffer+A50 is reloaded for the second call. Factory results are published immediately to slot+44 and slot+48 in order; no NULL result guard or rollback is invented. In staging the nested-helper argument is the just-created first result; in the alternate branch it is slot+24.
* Descriptor+2C is set to 1 before the nested helper; +30 receives its returned EAX. Staging stores descriptor+28 from slot+5C before the blit. No independent slot+60 initialization is inferred beyond the literal zero store before the 464160 call; that call can change it.
* Early existing-slot exit leaves EAX=slot+44. Allocation-failure exit leaves EAX=0. Successful exits leave the second factory result in EAX. These are residual results; the evidence does not establish whether callers consume them.

## Role / proof anchors / confidence

Proposed conservative name: **`Gfx_EnsureSlotAlphaDrawLists`**. High confidence in conditional staging and two-list publication; medium confidence in the business name/alpha terminology (the alpha contract is validated neighbour evidence, not derivable from the label alone). Do not promote “CLUT upload” to hardware transfer: no direct hardware operation appears here.

1. `asm-001.txt:6–13` / 464DC0..464DD9: nonzero slot+44 suppresses all work; otherwise global 1CCFD88 selects staging versus alternate construction.
2. `asm-002.txt:1–17` / 464E09..464E40: lazy 0xF0 allocation into slot+5C, failure exit, descriptor initialization, external slot preparation, zero-extended CLUT WORD at argument2+448.
3. `asm-003.txt:4–25`, `asm-004.txt:1` / 464E68..464E9C: eight arguments carry geometry, mode, 0x800 source pitch and indexed CLUT address to 4677D0. Common compaction:13 supplies its independently validated alpha-only WORD output contract. The source expression is `base + 2 * (((slot_y + page_bit4*256)<<10) + (page_low4<<6) + SAR(slot_x,(2-mode)&31))`, modulo 2^32. CLUT address is `base + (zero_extended_clut_word<<5)`; the mask/shifts are retained in code.
4. `asm-004.txt:2–25` / 464EA1..464EEA: creates types 6 then 14 and stores +44/+48; fresh owner reload; nested helper result goes into descriptor+30 between creations.
5. `asm-005.txt:7–24`, `asm-006.txt:1–17` / 464EF8..464F62: alternate path selects filter 2 or 0 from 1CA8A00, uses existing slot+24's nested result, then makes the same pair of lists without staging/allocation.
6. `metadata.json:84–105`: two code callers, 464CCC in 464BD0 and 465FAF in 465CE0; seven external targets. Common compaction:19–20 provides validated surrounding slot-selection/record context, not proof of a broader “World” purpose.

## Explicit unknowns and validation not executed

The supplied projection establishes the instruction stream, not full bodies/contracts of 464160, 467160, 417FA6 or 40A04A. Their address-based invocation in this C leaves actual effects to the adapter instead of guessing prototypes. Expected cdecl returns are supported by these call sites' explicit cleanup and the validated context; caller-saved registers remain exposed, rather than silently preserved. The callback must implement actual return-stack behavior, memory effects, and undefined flags; faults/nonlocal control transfer must stop the lift rather than return as if a normal call completed. This is an execution-adapter requirement, not an inferred in-game safety guard.

No caller null checks, nonalias guarantees, positive geometry, mode range, or allocation cleanliness are established. Descriptor/global mutations by callbacks must remain visible. Native labels do not prove global business meanings. As with ordinary decompilation, asynchronous fault/debug instruction-PC fidelity is outside this C: only external call/return EIP is explicit, not every intermediate instruction address.

No compile, execution, differential comparison, hash recomputation or parent ASM §5.6 review was performed. Request separate validation of all three terminal paths (existing +44, allocation failure, both construction branches), aliasing through descriptor/slot/owner, and mode shift counts outside 0..2; these are test needs, **not PASS claims**. No target-specific byte/ASM contradiction was found by the bounded manual read; the separate 465720 uncertainty is not used to repair or reinterpret 464DB0.
