# Independent C B — 0x500900

## Evidence and scope

Input packet SHA-256 (manifest claim, not independently rehashed):
`0c68458ed2dd63fc4969914f650dfd11176145e5b11dda0e4ce2d917cff21590`.
Common compaction SHA-256: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
EXE SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
Read all nine ASM slices, both byte slices, metadata and manifest in the supplied
`inputs/ff8-decomp-semantics-20261011-r01/g07/0x500900.readable/` projection.
Both half-open chunks `[0x500900,0x5009A1)` and `[0x5005A0,0x50081F)` are covered,
including all 206 instructions and all 20 CFG blocks. No neighboring production
or classifier result was consulted. Labels and embedded comments are not proofs.

## Representation contract

The complete C below is a register/stack-explicit lift, not a guessed native
prototype. It needs an address-space/native-call adapter supplied by integration.
Adapter hooks are modelling primitives, **not new calls attributed to FF8**.
No callee signature, return meaning, purity or register-clobber assumption is
invented. In particular a label containing `nullsub` is still dispatched.

`rd8/rd16/rd32` and stores are individual little-endian x86 accesses of the stated
width; they must not cache globals, add guards, or split a DWORD into extra visible
transactions. They preserve CPU registers/flags. `run_to` executes the specified
native call from its actual entry stack (return address already pushed) until
control resumes at the supplied return VA. It carries all callee changes,
registers, memory, flags, stack cleanup and floating environment. It is not a
typed C invocation of any native callee. Nonreturning callees do not return from
this hook. The adapter must propagate native faults rather than manufacture a
return. This lift does not simulate asynchronous instruction-level interrupts.

All integer arithmetic below is modulo 2^32. AL updates retain EAX[31:8]. WORD
sign extension is explicit without implementation-defined signed casts. Caller
argument pushes remain on the real emulated stack until the native ADD ESP; this
preserves pending arguments visible to intervening callees. Native near RET is
explicit, so no native return type is presumed. EBX/ESI/EDI/EBP are untouched by
the lifted instructions themselves. No x87/SSE instruction occurs in this body;
the complete floating state (including x87 control/status/tag, stack contents,
precision/rounding/exceptions and MXCSR) is opaque and unchanged locally, but
must be carried through `run_to`. No default x87 environment is asserted.

`known_flags` distinguishes architecturally undefined flags after logic and
shifts. A native-call adapter must respect those undefined bits rather than
pretend their retained numeric values are defined. Defined arithmetic flags,
including flags at call boundaries, are modelled. Faults are outside the normal
return domain: the adapter owns architectural exception delivery.

```c
#include <stdint.h>

typedef struct FF8CPU FF8CPU;
struct FF8CPU {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi, eip;
    uint32_t flags, known_flags;
    void *floating_state;  /* complete opaque x87/SSE environment */
    void *address_space;
    uint8_t  (*rd8)(FF8CPU *, uint32_t);
    uint16_t (*rd16)(FF8CPU *, uint32_t);
    uint32_t (*rd32)(FF8CPU *, uint32_t);
    void (*wr8)(FF8CPU *, uint32_t, uint8_t);
    void (*wr16)(FF8CPU *, uint32_t, uint16_t);
    void (*wr32)(FF8CPU *, uint32_t, uint32_t);
    void (*run_to)(FF8CPU *, uint32_t resume_va);
};

enum { CF=1, PF=4, AF=16, ZF=64, SF=128, OF=2048,
       ARITH=CF|PF|AF|ZF|SF|OF };

static uint32_t parity_flag(uint32_t x)
{
    x &= 255u; x ^= x >> 4; x ^= x >> 2; x ^= x >> 1;
    return (x & 1u) ? 0u : PF;
}
static uint32_t szp(uint32_t x, unsigned bits)
{
    uint32_t mask = bits == 8 ? 255u : UINT32_MAX;
    x &= mask;
    return (x == 0 ? ZF : 0u) | ((x >> (bits-1)) ? SF : 0u)
           | parity_flag(x);
}
static void setflags(FF8CPU *c, uint32_t f, uint32_t known)
{
    c->flags = (c->flags & ~(uint32_t)ARITH) | f;
    c->known_flags = (c->known_flags & ~(uint32_t)ARITH) | known;
}
static uint32_t add32(FF8CPU *c, uint32_t a, uint32_t b)
{
    uint32_t r = a+b;
    setflags(c, szp(r,32) | (r<a ? CF:0u)
       | (((a^b^r)&16u) ? AF:0u)
       | (((~(a^b)&(a^r))>>31) ? OF:0u), ARITH);
    return r;
}
static uint32_t sub32(FF8CPU *c, uint32_t a, uint32_t b)
{
    uint32_t r = a-b;
    setflags(c, szp(r,32) | (a<b ? CF:0u)
       | (((a^b^r)&16u) ? AF:0u)
       | ((((a^b)&(a^r))>>31) ? OF:0u), ARITH);
    return r;
}
static uint32_t logic32(FF8CPU *c, uint32_t r)
{
    setflags(c,szp(r,32),ARITH & ~AF); return r;
}
static void test8(FF8CPU *c, uint8_t a, uint8_t b)
{
    setflags(c,szp((uint32_t)(a&b),8),ARITH & ~AF);
}
static void cmp8(FF8CPU *c, uint8_t a, uint8_t b)
{
    uint8_t r=(uint8_t)((uint32_t)a-b);
    setflags(c,szp(r,8) | (a<b ? CF:0u)
       | (((a^b^r)&16u) ? AF:0u)
       | (((a^b)&(a^r)&128u) ? OF:0u), ARITH);
}
static uint8_t add8(FF8CPU *c, uint8_t a, uint8_t b)
{
    uint32_t sum=(uint32_t)a+b; uint8_t r=(uint8_t)sum;
    setflags(c,szp(r,8) | (sum>255u ? CF:0u)
       | (((a^b^r)&16u) ? AF:0u)
       | ((~(a^b)&(a^r)&128u) ? OF:0u), ARITH);
    return r;
}
static uint32_t shl32(FF8CPU *c, uint32_t a, unsigned n)
{
    n &= 31u; if (!n) return a;
    uint32_t r=a<<n, carry=(a>>(32u-n))&1u;
    uint32_t f=szp(r,32)|(carry ? CF:0u);
    uint32_t known=CF|PF|ZF|SF;
    if (n==1) { known|=OF; if (((r>>31)^carry)!=0) f|=OF; }
    setflags(c,f,known); return r;
}
static uint32_t sx16(uint16_t x)
{
    return (uint32_t)x | ((x&0x8000u) ? 0xFFFF0000u : 0u);
}
static void al_set(FF8CPU *c, uint8_t x)
{
    c->eax=(c->eax&0xFFFFFF00u)|(uint32_t)x;
}
static void push32(FF8CPU *c, uint32_t x)
{
    c->esp-=4u; c->wr32(c,c->esp,x); /* PUSH leaves flags alone */
}
static void native_call(FF8CPU *c, uint32_t target, uint32_t resume)
{
    push32(c,resume); c->eip=target; c->run_to(c,resume);
}

void lift_00500900(FF8CPU *c)
{
    /* 500900..50094B: no argument loads, no saved-register prologue. */
    native_call(c,0x0048D0D0u,0x00500905u);
    c->eax=c->rd32(c,0x01D96AA4u);
    push32(c,c->eax);
    native_call(c,0x00508420u,0x00500910u);
    c->ecx=c->rd32(c,0x01D96A8Cu);
    push32(c,c->ecx);
    native_call(c,0x00508420u,0x0050091Cu);
    c->edx=c->rd32(c,0x01D96AA0u);
    push32(c,c->edx);
    native_call(c,0x00508420u,0x00500928u);
    c->wr8(c,0x01D96A90u,(uint8_t)c->eax);
    c->eax=c->rd32(c,0x01D96AACu);
    c->esp=add32(c,c->esp,12u);
    (void)logic32(c,c->eax & c->eax);
    if (c->flags & ZF) goto L50094B;
    push32(c,c->eax);
    native_call(c,0x00508420u,0x0050093Fu);
    c->esp=add32(c,c->esp,4u);
    (void)logic32(c,c->eax & c->eax);
    if (!(c->flags & ZF)) goto L50094B;
    c->wr32(c,0x01D96AACu,c->eax);
L50094B:
    c->eax=c->rd32(c,0x01D96AA8u);
    push32(c,c->eax);
    native_call(c,0x00508420u,0x00500956u);
    c->wr8(c,0x01D96A88u,(uint8_t)c->eax);
    native_call(c,0x00502020u,0x00500960u);
    native_call(c,0x004BB090u,0x00500965u);
    native_call(c,0x0048D0D0u,0x0050096Au);
    c->ecx=c->rd32(c,0x01D96A94u);
    push32(c,c->ecx);
    native_call(c,0x00508420u,0x00500976u);
    c->esp=add32(c,c->esp,8u);
    native_call(c,0x0048D0D0u,0x0050097Eu);
    native_call(c,0x00506C30u,0x00500983u);
    native_call(c,0x0048D0D0u,0x00500988u);
    native_call(c,0x005033E0u,0x0050098Du);
    native_call(c,0x00506E30u,0x00500992u);
    native_call(c,0x00504060u,0x00500997u);
    native_call(c,0x00502020u,0x0050099Cu);
    goto L5005A0; /* native E9: not RET, not a second function */

L5005A0:
    test8(c,c->rd8(c,0x01D96A9Cu),4u);
    if (c->flags & ZF) goto L50065E;
    c->eax=c->rd32(c,0x00B8A3E4u);
    push32(c,c->eax);
    c->eax=c->rd32(c,0x01D96A80u);
    c->eax=logic32(c,c->eax&255u);
    c->eax=logic32(c,c->eax^1u);
    c->ecx=c->eax+c->eax*2u;
    c->ecx=shl32(c,c->ecx,3u);
    c->ecx=sub32(c,c->ecx,c->eax);
    c->eax=c->rd32(c,0x01D8E04Cu);
    c->eax=add32(c,c->eax,8u);
    c->edx=0x01D969C8u+c->ecx*4u;
    push32(c,c->edx);
    push32(c,c->eax);
    native_call(c,0x004A9160u,0x005005DEu);
    al_set(c,c->rd8(c,0x01D96A9Cu));
    c->esp=add32(c,c->esp,12u);
    test8(c,(uint8_t)c->eax,4u);
    if (c->flags & ZF) goto L50065E;
    c->ecx=c->rd32(c,0x01D96A80u);
    c->ecx=logic32(c,c->ecx&255u);
    c->eax=c->ecx;
    c->edx=c->ecx+c->ecx*2u;
    c->eax=logic32(c,c->eax^1u);
    c->edx=shl32(c,c->edx,3u);
    c->edx=sub32(c,c->edx,c->ecx);
    c->ecx=0x01D969C8u+c->edx*4u;
    c->edx=c->eax+c->eax*2u;
    c->edx=shl32(c,c->edx,3u);
    c->edx=sub32(c,c->edx,c->eax);
    push32(c,c->ecx);
    c->ecx=0x01D969C8u+c->edx*4u;
    c->edx=c->eax+c->eax*4u;
    push32(c,c->ecx);
    c->ecx=c->rd32(c,0x00B8A3E4u);
    c->eax=0x01D96980u+c->edx*4u;
    push32(c,c->eax);
    push32(c,c->ecx);
    native_call(c,0x004A9220u,0x00500632u);
    al_set(c,c->rd8(c,0x01D8E03Au));
    c->esp=add32(c,c->esp,16u);
    test8(c,(uint8_t)c->eax,(uint8_t)c->eax);
    if (c->flags & ZF) goto L50065E;
    cmp8(c,(uint8_t)c->eax,16u);
    if (c->flags & (CF|ZF)) goto L50064B; /* unsigned JBE */
    al_set(c,add8(c,(uint8_t)c->eax,0xF0u));
    c->wr8(c,0x01D8E03Au,(uint8_t)c->eax);
    goto L50065E;
L50064B:
    c->eax=logic32(c,c->eax&1u);
    push32(c,c->eax);
    native_call(c,0x0045C310u,0x00500654u);
    c->esp=add32(c,c->esp,4u);
    c->wr8(c,0x01D8E03Au,0u);
L50065E:
    native_call(c,0x00501B60u,0x00500663u);
    native_call(c,0x00501230u,0x00500668u);
    test8(c,c->rd8(c,0x01D96A9Cu),8u);
    if (c->flags & ZF) goto L50068F;
    native_call(c,0x00505D20u,0x00500676u);
    push32(c,1u);
    push32(c,0x01D8E040u);
    native_call(c,0x0045C9F0u,0x00500682u);
    push32(c,0x01D8E040u);
    native_call(c,0x0045C320u,0x0050068Cu);
    c->esp=add32(c,c->esp,12u);
L50068F:
    test8(c,c->rd8(c,0x01D96A9Cu),4u);
    if (c->flags & ZF) goto L50074D;
    c->eax=c->rd32(c,0x01D96A80u);
    c->eax=logic32(c,c->eax&255u);
    c->eax=logic32(c,c->eax^1u);
    c->edx=c->eax+c->eax*2u;
    c->edx=shl32(c,c->edx,3u);
    c->edx=sub32(c,c->edx,c->eax);
    c->eax=0x01D969C8u+c->edx*4u;
    push32(c,c->eax);
    native_call(c,0x0045B660u,0x005006BEu);
    c->eax=c->rd32(c,0x01D96A80u);
    c->eax=logic32(c,c->eax&255u);
    c->ecx=c->eax;
    c->ecx=shl32(c,c->ecx,4u);
    c->ecx=add32(c,c->ecx,c->eax);
    c->edx=c->eax+c->ecx*8u;
    c->edx=shl32(c,c->edx,4u);
    c->edx=add32(c,c->edx,c->eax);
    c->eax=0x01D924DCu+c->edx*8u;
    push32(c,c->eax);
    native_call(c,0x0045D610u,0x005006E4u);
    c->ecx=sx16(c->rd16(c,0x01D8E038u));
    push32(c,c->ecx);
    native_call(c,0x0056CD00u,0x005006F1u);
    c->edx=sx16(c->rd16(c,0x01D8E03Eu));
    c->eax=sx16(c->rd16(c,0x01D8E03Cu));
    c->edx=add32(c,c->edx,0x6Cu);
    c->eax=add32(c,c->eax,0xA0u);
    push32(c,c->edx);
    push32(c,c->eax);
    native_call(c,0x0056CCE0u,0x0050070Eu);
    c->ecx=sx16(c->rd16(c,0x01D8E038u));
    push32(c,c->ecx);
    native_call(c,0x0056CD00u,0x0050071Bu);
    c->edx=sx16(c->rd16(c,0x01D8E03Eu));
    c->eax=sx16(c->rd16(c,0x01D8E03Cu));
    c->edx=add32(c,c->edx,0x6Cu);
    c->eax=add32(c,c->eax,0xA0u);
    push32(c,c->edx);
    push32(c,c->eax);
    native_call(c,0x0056CCE0u,0x00500738u);
    c->esp=add32(c,c->esp,32u);
    c->wr16(c,0x01D8E03Eu,0u);
    c->wr16(c,0x01D8E03Cu,0u);
L50074D:
    c->eax=c->rd32(c,0x01CFF834u);
    (void)logic32(c,c->eax&c->eax);
    if (!(c->flags & ZF)) goto L5007A9;
    c->eax=c->rd32(c,0x01D96A80u);
    push32(c,0xFFFFFFFFu);
    c->eax=logic32(c,c->eax&255u);
    push32(c,0x111Eu);
    c->ecx=c->eax;
    push32(c,0x101Eu);
    c->ecx=shl32(c,c->ecx,4u);
    c->ecx=add32(c,c->ecx,c->eax);
    push32(c,0x101Au);
    push32(c,0x1019u);
    push32(c,0x1011u);
    c->edx=c->eax+c->ecx*8u;
    push32(c,0x11u);
    c->edx=shl32(c,c->edx,4u);
    push32(c,9u);
    c->edx=add32(c,c->edx,c->eax);
    push32(c,5u);
    push32(c,1u);
    push32(c,0u);
    c->eax=0x01D8E058u+c->edx*8u;
    push32(c,0x1122u);
    push32(c,c->eax);
    native_call(c,0x0045D550u,0x005007A6u);
    c->esp=add32(c,c->esp,52u);
L5007A9:
    test8(c,c->rd8(c,0x01D96A9Cu),0x80u);
    c->eax=c->rd32(c,0x01D96A80u); /* MOV retains test flags */
    if (c->flags & ZF) goto L5007D8;
    c->edx=c->rd32(c,0x00B6D094u);
    c->eax=logic32(c,c->eax&255u);
    c->ecx=c->eax+c->eax*8u;
    c->ecx=shl32(c,c->ecx,14u);
    c->ecx=add32(c,c->ecx,c->edx);
    c->wr32(c,0x01D8E054u,c->ecx);
    c->ecx=add32(c,c->ecx,0x24000u);
    goto L5007FD;
L5007D8:
    c->edx=c->rd32(c,0x00B6D070u);
    c->eax=logic32(c,c->eax&255u);
    c->ecx=c->eax*8u;
    c->ecx=sub32(c,c->ecx,c->eax);
    c->ecx=shl32(c,c->ecx,14u);
    c->ecx=add32(c,c->ecx,c->edx);
    c->wr32(c,0x01D8E054u,c->ecx);
    c->ecx=add32(c,c->ecx,0x1C000u);
L5007FD:
    c->wr32(c,0x01D969A8u,c->ecx);
    c->ecx=c->eax;
    c->ecx=shl32(c,c->ecx,4u);
    c->ecx=add32(c,c->ecx,c->eax);
    c->edx=c->eax+c->ecx*8u;
    c->edx=shl32(c,c->edx,4u);
    c->edx=add32(c,c->edx,c->eax);
    c->eax=0x01D8E058u+c->edx*8u;
    c->wr32(c,0x01D8E04Cu,c->eax);
    c->eip=c->rd32(c,c->esp); /* 50081E: native RET */
    c->esp+=4u;
}
```

## Coverage and proof anchors

The explicit labels reproduce conditional CFG joins; straight-line blocks are
consecutive assignments. All 20 blocks in metadata:11–159 are represented:
500900, 500939, 500946, 50094B, 5005A0, 5005AD, 5005EA, 50063E,
500642, 50064B, 50065E, 500671, 50068F, 50069C, 50074D, 500756,
5007A9, 5007B7, 5007D8, 5007FD.

1. asm-001:2–25 / bytes-001:1–3: six list-head dispatch sites overall;
   full EAX zero-test at 500942 versus low-AL stores at 500928/500956.
   Optional head is written only on the zero full-register result.
2. asm-002:1–15 / bytes-001:3–6: preserved outstanding argument at 50095B;
   eight-byte caller cleanup at 500976; E9 FF FB FF FF attaches the tail.
3. asm-002:16–25 + asm-003:1–25 + asm-004:1–19:
   two separately read bit-4 gates, read index masked FF then XOR 1, unsigned
   AL<=16 branch, ADD AL F0 and byte store. No asserted index bound of one.
4. asm-004:20–25 + asm-005:1–5:
   bit-8 gate, exact 45C9F0/45C320 push order and accumulated 12-byte cleanup.
5. asm-005:6–25 + asm-006:1–25:
   bit-4 third gate, signed WORD extension, two separate repeated reads/calls
   rather than commoned camera values, 32-byte cleanup, WORD-zero stores in order.
6. asm-007:1–25 + asm-008:1–2:
   full DWORD zero gate and 13 pushed DWORDs; native argument order at 45D550 is
   `(OT,1122,0,1,5,9,11,1011,1019,101A,101E,111E,FFFFFFFF)` in hexadecimal.
7. asm-008:3–25 + asm-009:1–6 / bytes-002:3–6:
   bit-80 test before index MOV, two packet-base/extent branches, DWORD cursor
   before end store, final OT-base store, plain RET, not Boolean return.
8. metadata:161–191 supplies four code call xrefs in owner 47CCB0 and a type-19
   jump from 47D905 in 47D900; no caller purpose inferred from names.

Exact caller cleanup sums, excluding the automatically returned CALL words:
entry mandatory three heads 12; optional head 4; fifth plus sixth heads 8;
4A9160 12; 4A9220 16; 45C310 4; 45C9F0 plus 45C320 12;
45B660 plus 45D610 plus camera calls 32; 45D550 52. Stack is restored on
normal cdecl callee returns. The lift deliberately delegates any actual callee
stack adjustment to the adapter instead of silently compensating for it.

## Limits / validation requests

This is C B only, not a semantic-volet verdict. Structural behavior is supported
by the accesses and branches above; native business names, callback contracts,
precise task return interpretation and floating effects of callees remain opaque.
The adapter is necessary because callee bodies/signatures are not provided and
cannot be fabricated. Numeric targets were checked against supplied rel32 bytes
and metadata, not against live IDA. No bounds guard, toggling of the global index,
task traversal implementation or extra upload call was added.

Compilation, harness implementation, native-call differential runs, all flag
helper tests, fault-state comparisons and hash verification have **not** been
executed. Request separate validation of every CFG path, mutations by intervening
callees (including flags/index changes), AL high bits, signed WORD extrema,
index values above one, and branch-specific stack contents. Native exception/
interrupt delivery is an adapter obligation, not a tested property of this C.
