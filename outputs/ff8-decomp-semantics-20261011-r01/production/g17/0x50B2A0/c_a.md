# C A — 0x50B2A0 — run01 / g17

Author: pool-209, task `task_mv44sggq_00bk_vw0mx9`, independent C A.
Effective `openai/gpt-6.1-sol / medium` accepted from the lead's native-routing attestation; historical Astra/high dispatch wording is superseded.

## Input and status

Read the authorized readable projection: manifest, all sixteen ASM files (400 lines), all three byte files, metadata and common compaction. Original packet SHA256: `a2948fb2cfed39d50786de24509013d91ce4e411862d0610508c371e3ce3bbaf`; manifest SHA256 (lead attestation): `a30d9aef3cfb071bba60d9b0a83dc34ce14ae10f76cf4d8aa78be4741515eedf`; compaction SHA256: `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`. These hashes are supplied/attested, **not recalculated by this author**. EXE identity in metadata: SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, 32 bits, export 2026-10-11T16:38:25.140966+00:00.

The C below reconstructs the complete exported instruction body, as a register/guest-memory C translation rather than inventing native C prototypes for opaque callees. It is not promoted or compiled. A native-address jump table at `0x50B7E8` lies outside the supplied chunk: selector-to-arm mapping is deliberately read from guest memory, **not** fabricated from case annotations. Full standalone native replacement remains conditional on that table and the call/memory boundary contracts below.

## ABI and execution boundary

Observed entry: `[entry ESP+4]` is one 32-bit argument; return address at `[entry ESP]`. EBX/EBP/ESI saved; EDI additionally saved inside the `0x50B2E8` arm. Plain RET at all exits; caller retains its argument. EAX explicitly returns 0 at waits/advances and 2 at the final arm. No semantic types inferred from names.

`x86_50b2a0` takes an explicit machine state; it is a C reconstruction ABI, not a claim that the binary has this prototype. `read8`/`write8` are guest-memory integration boundaries, not binary library calls. `invoke` executes ONLY the native target address supplied: a return address has already been pushed and `eip` set, exactly as CALL. On ordinary return, the adapter must implement the callee's actual register/stack/memory effects, including popping the return address, and resume at the supplied return PC. Do not substitute guessed callee code. This preserves delayed argument cleanup, stacked earlier arguments, opaque EAX results and caller-clobbered register changes. Callees must honor the actual binary's callee-saved EBX/EBP/ESI/EDI convention for the native continuation to work.

The body models flags only where consumed locally by branches; it does not expose EFLAGS to the adapter or emulate faults, interrupts, instruction tracing, or caller observations of unspecified flags. Consequently an adapter requiring flag-based/nonstandard interprocedural behavior needs a further low-level extension, not a claimed PASS. Memory is little-endian; every guest address and register wraps modulo 2^32. Backend accesses must implement guest memory validity and aliasing; no host-pointer casts or packed guessed structs are used. Code/jump-table mutation during a call is visible on subsequent reads.

## Complete C

```c
#include <stdint.h>

typedef struct X86 X86;
struct X86 {
    uint32_t eax, ebx, ecx, edx, esi, edi, ebp, esp, eip;
    void *opaque;
    uint8_t (*read8)(void *, uint32_t);
    void (*write8)(void *, uint32_t, uint8_t);
    void (*invoke)(X86 *, uint32_t target, uint32_t return_pc);
};

static uint8_t r8(X86 *v, uint32_t a) {
    return v->read8(v->opaque, a);
}
static uint16_t r16(X86 *v, uint32_t a) {
    uint32_t x = r8(v,a);
    x |= (uint32_t)r8(v,a+1u) << 8;
    return (uint16_t)x;
}
static uint32_t r32(X86 *v, uint32_t a) {
    uint32_t x = r16(v,a);
    x |= (uint32_t)r16(v,a+2u) << 16;
    return x;
}
static void w8(X86 *v, uint32_t a, uint8_t x) {
    v->write8(v->opaque,a,x);
}
static void w16(X86 *v, uint32_t a, uint16_t x) {
    w8(v,a,(uint8_t)x); w8(v,a+1u,(uint8_t)(x>>8));
}
static void w32(X86 *v, uint32_t a, uint32_t x) {
    w16(v,a,(uint16_t)x); w16(v,a+2u,(uint16_t)(x>>16));
}
static uint32_t low8(uint32_t x, uint32_t b) {
    return (x & UINT32_C(0xffffff00)) | (b & 255u);
}
static uint32_t high8(uint32_t x, uint32_t b) {
    return (x & UINT32_C(0xffff00ff)) | ((b & 255u)<<8);
}
static uint32_t low16(uint32_t x, uint32_t b) {
    return (x & UINT32_C(0xffff0000)) | (b & 65535u);
}
static int64_t s32(uint32_t x) {
    return (x & UINT32_C(0x80000000)) ?
        (int64_t)x - INT64_C(4294967296) : (int64_t)x;
}
static uint32_t sar32(uint32_t x, unsigned c) {
    c &= 31u;
    if (!c) return x;
    return (x>>c) | ((x & UINT32_C(0x80000000)) ?
                            (UINT32_MAX << (32u-c)) : 0u);
}
static uint8_t shl8(uint8_t x, uint32_t c) {
    c &= 31u; /* x86 masks CL, even for an 8-bit destination */
    return c < 8u ? (uint8_t)((uint32_t)x << c) : 0u;
}
static void push32(X86 *v, uint32_t x) {
    v->esp -= 4u; w32(v,v->esp,x);
}
static uint32_t pop32(X86 *v) {
    uint32_t x=r32(v,v->esp); v->esp+=4u; return x;
}
static void call32(X86 *v, uint32_t target, uint32_t retpc) {
    push32(v,retpc); v->eip=target; v->invoke(v,target,retpc);
}
static void imul_eax_ecx(X86 *v) {
    int64_t p=s32(v->eax)*s32(v->ecx);
    uint64_t bits=(uint64_t)p;
    v->eax=(uint32_t)bits; v->edx=(uint32_t)(bits>>32);
}

/* All labels are binary PCs, not inferred case semantics. */
void x86_50b2a0(X86 *v) {
    uint32_t target; /* evaluation temporary, not a guest local */
    push32(v,v->ebx);
    push32(v,v->ebp);
    v->ebp=r32(v,v->esp+12u); /* [esp+8+arg_0] */
    push32(v,v->esi);
    v->ebx=low8(v->ebx,r8(v,v->ebp+13u));
    v->esi=r32(v,v->ebp+16u);
    v->eax=v->ebx;
    v->eax &= 255u;
    if (v->eax>9u) goto L50B741;
    target=r32(v,UINT32_C(0x50b7e8)+v->eax*4u);
    v->eip=target;
    switch (target) {
    case 0x50b2c4u: goto L50B2C4;
    case 0x50b2e8u: goto L50B2E8;
    case 0x50b3ccu: goto L50B3CC;
    case 0x50b429u: goto L50B429;
    case 0x50b4e9u: goto L50B4E9;
    case 0x50b56bu: goto L50B56B;
    case 0x50b5b4u: goto L50B5B4;
    case 0x50b63au: goto L50B63A;
    case 0x50b774u: goto L50B774;
    case 0x50b790u: goto L50B790;
    case 0x50b741u: goto L50B741;
    default:
        /* No native default jump is invented. External dispatcher must
           continue at this actual table target, with current saved stack. */
        return;
    }

L50B2C4:
    push32(v,0x40u); push32(v,0x1au);
    call32(v,0x508580u,0x50b2cdu);
    v->esp+=8u;
    if (v->eax) goto L50B741;
    call32(v,0x501190u,0x50b2ddu);
    if (v->eax) goto L50B741;
    w8(v,v->ebp+13u,(uint8_t)(r8(v,v->ebp+13u)+1u));
L50B2E8:
    w8(v,0x1d97705u,(uint8_t)(r8(v,0x1d97705u)|0x80u));
    push32(v,v->edi);
    w32(v,0x1d96a9cu,r32(v,0x1d96a9cu)|0x10u);
    call32(v,0x50afc0u,0x50b2fcu);
    v->eax=r32(v,0x1d99a40u);
    v->edx=r32(v,0x1d99a50u);
    v->ecx=0;
    v->esi=r32(v,v->eax+8u);
    v->ecx=low8(v->ecx,r8(v,v->edx+2u));
    v->esi &= UINT32_C(0xff7fffff);
    push32(v,v->ecx); push32(v,v->eax);
    w32(v,v->eax+8u,v->esi);
    call32(v,0x505c00u,0x50b31fu);
    call32(v,0x534aa0u,0x50b324u);
    v->edx=0; v->ecx=3u;
    /* DIV ECX: EDX was zero, so there can be no quotient overflow. */
    v->edx=v->eax%v->ecx; v->eax=v->eax/v->ecx;
    v->ecx=r32(v,0x1d99a40u);
    v->eax=0;
    v->edx=low8(v->edx,(v->edx&255u)|0x10u);
    w8(v,0x1d99a4eu,(uint8_t)v->edx);
    v->eax=low8(v->eax,v->edx);
    v->edx=r32(v,v->ecx+132u);
    push32(v,v->eax);
    v->eax=r32(v,v->edx+44u);
    push32(v,v->eax);
    call32(v,0x503520u,0x50b350u);
    v->esp+=16u; /* includes the earlier animation's two arguments */
    w8(v,0x1d99a47u,0);
    v->edi=0; v->esi=0x1d972c0u;
L50B361:
    if (v->esi==r32(v,0x1d99a40u)) goto L50B38B;
    if (!(r8(v,v->esi)&2u)) goto L50B38B;
    push32(v,11u); push32(v,v->esi);
    call32(v,0x50c090u,0x50b376u);
    v->eax=low8(v->eax,r8(v,0x1d99a47u));
    v->edx=low8(v->edx,1u);
    v->ecx=v->edi;
    v->esp+=8u;
    v->edx=low8(v->edx,shl8((uint8_t)v->edx,v->ecx));
    v->eax=low8(v->eax,(v->eax|v->edx)&255u);
    w8(v,0x1d99a47u,(uint8_t)v->eax);
L50B38B:
    v->esi+=156u; v->edi+=1u;
    if (s32(v->esi)<s32(0x1d97494u)) goto L50B361;
    v->ecx=r32(v,0x1d99a50u); v->eax=0;
    push32(v,0x21dfec4u);
    v->eax=low16(v->eax,r16(v,v->ecx+6u));
    push32(v,v->eax);
    call32(v,0x50af20u,0x50b3b1u);
    v->eax=low8(v->eax,r8(v,v->ebp+13u));
    v->esp+=8u;
    v->eax=low8(v->eax,(v->eax&255u)+1u);
    w16(v,0x1d99a44u,0);
    v->edi=pop32(v);
    w8(v,v->ebp+13u,(uint8_t)v->eax);
    goto L50B741;

L50B3CC:
    v->eax=r32(v,0x1d99c8u);
    if (s32(v->eax)<0) goto L50B741;
    v->eax=low8(v->eax,r8(v,0x1d97718u));
    if (v->eax&255u) goto L50B741;
    v->eax=r32(v,0x1d99a40u);
    v->ecx=r32(v,v->eax+116u);
    v->eax-=0x1d972c0u;
    w8(v,v->ecx+44u,(uint8_t)(r8(v,v->ecx+44u)|0x10u));
    v->ecx=v->eax; v->eax=0xd20d20d3u;
    imul_eax_ecx(v);
    v->edx+=v->ecx; v->edx=sar32(v->edx,7);
    v->eax=v->edx; v->eax>>=31; v->edx+=v->eax;
    w8(v,0x1d96dc4u,(uint8_t)v->edx);
    if ((v->edx&255u)>1u) w8(v,0x1d96dc4u,1);
    v->ebx=low8(v->ebx,(v->ebx&255u)+1u);
    v->esi=pop32(v);
    w8(v,v->ebp+13u,(uint8_t)v->ebx);
    goto L50B742;

L50B429:
    v->eax=low8(v->eax,r8(v,0x1d96a90u));
    if (v->eax&255u) goto L50B741;
    v->ecx=r32(v,0x1d99a40u);
    if (!(r8(v,v->ecx)&4u)) goto L50B741;
    call32(v,0x46b440u,0x50b44au);
    v->eax=r32(v,0x1d99a40u);
    v->edx=low16(v->edx,r16(v,v->eax));
    v->edx &= 0xfffdu; v->edx|=8u;
    w16(v,v->eax,(uint16_t)v->edx);
    v->ecx=r32(v,v->eax+116u);
    w8(v,v->eax+97u,0);
    v->eax=low8(v->eax,r8(v,0x1d99b95u));
    w16(v,v->ecx+44u,(uint16_t)(r16(v,v->ecx+44u)&0xffdfu));
    if ((v->eax&255u)==2u) goto L50B4AA;
    if (!(r8(v,0x1d99a47u)&4u)) goto L50B4AA;
    v->ecx=r32(v,0xb6d084u);
    push32(v,0x10000u);
    v->edx=v->ecx+0x20000u; push32(v,v->edx);
    v->edx=0; v->edx=low8(v->edx,v->eax);
    v->edx<<=16; v->edx+=v->ecx;
    push32(v,v->edx);
    call32(v,0x509b50u,0x50b49eu);
    v->esp+=12u;
    w16(v,0x1d973f8u,(uint16_t)(r16(v,0x1d973f8u)&0xfffdu));
L50B4AA:
    v->eax=r32(v,0x21dfec4u);
    push32(v,0x1d99a78u);
    w32(v,0x21dfec8u,v->eax);
    call32(v,v->eax,0x50b4bbu);
    w32(v,0x1d96aacu,v->eax);
    v->eax=r32(v,0x1d99a50u);
    v->esp+=4u;
    if (r8(v,v->eax+1u)!=0xfeu) goto L50B4E6;
    v->ecx=0; v->edx=0;
    v->ecx=low16(v->ecx,r16(v,v->eax+4u));
    v->edx=low8(v->edx,r8(v,0x1d28df7u));
    push32(v,v->ecx); push32(v,v->edx);
    call32(v,0x56dce0u,0x50b4e3u);
    v->esp+=8u;
L50B4E6:
    w8(v,v->ebp+13u,(uint8_t)(r8(v,v->ebp+13u)+1u));
L50B4E9:
    call32(v,0x50ae80u,0x50b4eeu);
    if (v->eax) goto L50B741;
    v->eax=low8(v->eax,r8(v,0x1d99b95u));
    if ((v->eax&255u)==2u) goto L50B531;
    if (!(r8(v,0x1d99a47u)&4u)) goto L50B531;
    v->ecx=0; push32(v,0x10000u);
    v->ecx=low8(v->ecx,v->eax);
    v->eax=r32(v,0xb6d084u);
    v->ecx<<=16; v->ecx+=v->eax; v->eax+=0x20000u;
    push32(v,v->ecx); push32(v,v->eax);
    call32(v,0x509b50u,0x50b527u);
    v->esp+=12u;
    w8(v,0x1d973f8u,(uint8_t)(r8(v,0x1d973f8u)|2u));
L50B531:
    v->esi=r32(v,0x1d99a40u);
    v->eax=0xd20d20d3u; v->ecx=v->esi;
    push32(v,0);
    v->ecx-=0x1d972c0u;
    imul_eax_ecx(v); v->edx+=v->ecx;
    v->ecx=0; v->ecx=low8(v->ecx,r8(v,v->esi+4u));
    v->edx=sar32(v->edx,7);
    v->eax=v->edx; v->eax>>=31; v->edx+=v->eax;
    push32(v,v->edx); push32(v,v->ecx);
    call32(v,0x507080u,0x50b560u);
    v->eax=low8(v->eax,r8(v,v->ebp+13u));
    v->esp+=12u; v->eax=low8(v->eax,(v->eax&255u)+1u);
    w8(v,v->ebp+13u,(uint8_t)v->eax);
L50B56B:
    call32(v,0x507070u,0x50b570u);
    if (v->eax) goto L50B741;
    v->esi=r32(v,0x1d99a40u);
    push32(v,v->eax); /* zero from tested result, not guessed pointer */
    v->ecx=v->esi; v->eax=0xd20d20d3u;
    v->ecx-=0x1d972c0u;
    imul_eax_ecx(v); v->edx+=v->ecx;
    v->ecx=0; v->ecx=low8(v->ecx,r8(v,v->esi+4u));
    v->ecx=high8(v->ecx,((v->ecx>>8)&255u)|0x10u);
    v->edx=sar32(v->edx,7);
    v->eax=v->edx; v->eax>>=31; v->edx+=v->eax;
    push32(v,v->edx); push32(v,v->ecx);
    call32(v,0x507080u,0x50b5a9u);
    v->eax=low8(v->eax,r8(v,v->ebp+13u));
    v->esp+=12u; v->eax=low8(v->eax,(v->eax&255u)+1u);
    w8(v,v->ebp+13u,(uint8_t)v->eax);
L50B5B4:
    call32(v,0x507070u,0x50b5b9u);
    if (v->eax) goto L50B741;
    v->edx=r32(v,0x1d99a40u); push32(v,v->edx);
    call32(v,0x50b810u,0x50b5cdu);
    v->ecx=r32(v,0x1d99a40u); v->eax=0xd20d20d3u;
    v->ecx-=0x1d972c0u; v->esp+=4u;
    imul_eax_ecx(v); v->edx+=v->ecx;
    v->edx=sar32(v->edx,7);
    v->eax=v->edx; v->eax>>=31; v->edx+=v->eax;
    if ((v->edx&255u)<2u)
        v->edx=low8(v->edx,(v->edx&255u)+1u);
    else
        v->edx=low8(v->edx,(v->edx&255u)-1u);
    w8(v,0x1d99a70u,(uint8_t)v->edx);
    v->ecx=r32(v,0x1d99a70u); v->ecx&=255u;
    v->eax=v->ecx+v->ecx*4u;
    v->eax<<=3; v->eax-=v->ecx; v->eax<<=2;
    if (!(r8(v,0x1d972c0u+v->eax)&2u)) goto L50B637;
    push32(v,0); push32(v,v->ecx);
    v->ecx=0; v->ecx=low8(v->ecx,r8(v,0x1d972c4u+v->eax));
    v->ecx=high8(v->ecx,((v->ecx>>8)&255u)|0x10u);
    push32(v,v->ecx);
    call32(v,0x507080u,0x50b634u); v->esp+=12u;
L50B637:
    w8(v,v->ebp+13u,(uint8_t)(r8(v,v->ebp+13u)+1u));
L50B63A:
    call32(v,0x507070u,0x50b63fu);
    if (v->eax) goto L50B741;
    v->ecx=r32(v,0x1d99a70u); v->ecx&=255u;
    v->eax=v->ecx+v->ecx*4u;
    v->eax<<=3; v->eax-=v->ecx; v->eax<<=2;
    v->edx=low8(v->edx,r8(v,0x1d972c0u+v->eax));
    v->ecx=0x1d972c0u+v->eax;
    if (!(v->edx&2u)) goto L50B6A2;
    w8(v,0x1d972c2u+v->eax,
       (uint8_t)(r8(v,0x1d972c2u+v->eax)|4u));
    push32(v,v->ecx);
    call32(v,0x509c10u,0x50b67cu);
    v->eax=high8(v->eax,((v->eax>>8)&255u)|0x10u);
    push32(v,v->eax);
    v->eax=r32(v,0x1d99a70u); v->eax&=255u;
    v->edx=v->eax+v->eax*4u;
    v->edx<<=3; v->edx-=v->eax;
    v->eax=0x1d972c0u+v->edx*4u;
    push32(v,v->eax);
    call32(v,0x505c00u,0x50b69fu);
    v->esp+=12u; /* includes earlier ClassFromScriptBits argument */
L50B6A2:
    v->ecx=r32(v,0x1d99a40u); v->esi=0x1d972c0u;
L50B6AD:
    if (v->esi==v->ecx) goto L50B6E5;
    v->eax=low16(v->eax,r16(v,v->esi));
    if (!(v->eax&2u)) goto L50B6E5;
    v->eax&=0xfffbu; w16(v,v->esi,(uint16_t)v->eax);
    v->eax=low8(v->eax,r8(v,0x1d99a81u));
    if ((v->eax&255u)==2u) goto L50B6DC;
    push32(v,12u); push32(v,v->esi);
    call32(v,0x50c090u,0x50b6d1u);
    v->ecx=r32(v,0x1d99a40u); v->esp+=8u;
    goto L50B6E5;
L50B6DC:
    v->edx=r32(v,0xb8b9a8u); w32(v,v->esi+44u,v->edx);
L50B6E5:
    v->esi+=156u;
    if (s32(v->esi)<s32(0x1d97494u)) goto L50B6AD;
    v->eax=low16(v->eax,r16(v,v->ecx));
    v->eax&=0xfff3u; v->eax=low8(v->eax,(v->eax&255u)|2u);
    w16(v,v->ecx,(uint16_t)v->eax);
    v->eax=low8(v->eax,r8(v,0x1d99a81u));
    w8(v,v->ecx+2u,(uint8_t)(r8(v,v->ecx+2u)|4u));
    if ((v->eax&255u)==2u) goto L50B747;
    push32(v,20u); push32(v,v->ecx);
    call32(v,0x505c00u,0x50b715u);
    v->edx=r32(v,0x1d99a40u); v->ecx=0;
    v->ecx=low8(v->ecx,r8(v,0x1d99a4eu));
    v->eax=r32(v,v->edx+132u); v->ecx+=3u;
    push32(v,v->ecx); v->ecx=r32(v,v->eax+44u);
    push32(v,v->ecx);
    call32(v,0x503520u,0x50b736u);
    v->eax=low8(v->eax,r8(v,v->ebp+13u));
    v->esp+=16u; v->eax=low8(v->eax,(v->eax&255u)+1u);
    w8(v,v->ebp+13u,(uint8_t)v->eax);
L50B741:
    v->esi=pop32(v);
L50B742:
    v->ebp=pop32(v); v->eax=0; v->ebx=pop32(v);
    v->eip=pop32(v); return;

L50B747:
    v->edx=r32(v,v->ecx+116u);
    push32(v,1u); push32(v,v->ecx);
    w16(v,v->edx+40u,0);
    call32(v,0x505c00u,0x50b758u);
    v->eax=r32(v,0x1d99a40u); push32(v,v->eax);
    call32(v,0x509c80u,0x50b763u);
    v->eax=low8(v->eax,r8(v,v->ebp+13u));
    v->esp+=12u; v->eax=low8(v->eax,(v->eax&255u)+1u);
    w8(v,v->ebp+13u,(uint8_t)v->eax);
    goto L50B741;
L50B774:
    v->eax=low8(v->eax,r8(v,0x1d97718u));
    if (v->eax&255u) goto L50B741;
    call32(v,0x50aed0u,0x50b782u);
    v->eax=low8(v->eax,r8(v,v->ebp+13u));
    v->esi=pop32(v); v->eax=low8(v->eax,(v->eax&255u)+1u);
    w8(v,v->ebp+13u,(uint8_t)v->eax);
    goto L50B742;
L50B790:
    if (r8(v,0x1d99a81u)!=3u) goto L50B7C3;
    push32(v,128u); push32(v,0); push32(v,0x87u);
    call32(v,0x501740u,0x50b7aau);
    push32(v,128u); push32(v,0); push32(v,0x88u);
    call32(v,0x501740u,0x50b7bbu);
    v->esp+=24u;
    call32(v,0x50a670u,0x50b7c3u);
L50B7C3:
    v->eax=r32(v,0x1d96a9cu);
    w8(v,v->esi+1u,255u); /* ESI is the node+0x10 entry capture */
    v->eax=low8(v->eax,(v->eax&255u)&0xefu);
    v->esi=pop32(v); w32(v,0x1d96a9cu,v->eax);
    v->ebp=pop32(v); w32(v,0x1d99a64u,0);
    v->eax=2; v->ebx=pop32(v);
    v->eip=pop32(v); return;
}
```

## Evidence, coverage, and limits

Source directory throughout: `inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B2A0.readable/`. ASM file references below are 1-based. One contiguous exported code chunk `[0x50B2A0,0x50B7E6)`, 0x546 bytes; bytes-001/002 contain 20 rows of 32 bytes each, bytes-003 the final 70 bytes. The immediately following table (0x50B7E8) is not part of this chunk. All 400 supplied ASM lines and all 57 CFG blocks represented by metadata are accounted for in the body; the selector mapping is not independently byte-validated.

| Native ranges, inclusive first PC / exclusive end | C coverage |
|---|---|
| B2A0–B2C4 | prologue, unsigned selector bound, dynamic table dispatch |
| B2C4–B2E8 | two opaque gates, byte increment, fallthrough |
| B2E8–B3CC | setup, two delayed-cleanup calls, unsigned DIV, three-record loop, callback-pointer load operation, EDI restore, return 0 |
| B3CC–B429 | signed gate, byte gate, word-state flag, signed-high multiply sequence, low-byte clamp, captured BL increment, return 0 |
| B429–B4E9 | two gates; actor flags; opposite copy direction from later restore; indirect callback + backup + return store; descriptor reload; optional call; fallthrough |
| B4E9–B56B | gate, restore copy, load dispatch, byte increment, fallthrough |
| B56B–B5B4 | gate, load dispatch with CH bit 0x10, byte increment, fallthrough |
| B5B4–B63A | gate, opaque helper, adjacent low-byte selection, masked selection index, conditional load, byte increment, fallthrough |
| B63A–B741 | gate, optional classification/animation, peer loop with conditional ECX reload, active-record flags, animation/camera path, return 0 |
| B741–B774 | common exit or alternate animation/tick path and return 0 |
| B774–B790 | camera-byte gate and release call; byte increment; return 0 |
| B790–B7E6 | optional two calls + apply call; captured ESI object byte, flags and marker writes; return 2 |

Key details:

* `asm-001:3,5–11` proves stack input, BYTE node+0D, node+10 capture in ESI, unsigned `JA`, table-address operand; byte data at bytes-001:1–2 confirms the absolute table address 0x50B7E8. Do not assert the case mapping from annotations alone.
* `asm-002:7`/bytes-001:4 is exactly **0xFF7FFFFF**, clearing bit 0x00800000, not a guessed 0x8000. All code-address calls are preserved by numeric E8 destinations; indirect CALL uses the actual EAX at `asm-007:3`. No calls to host memcpy/memmove/RNG are substituted.
* `asm-002:25`, `asm-012:22`, `asm-014:17`, `asm-015:9`, `asm-016:14`: actual ESP cleanup is 16, 12, 16, 12, 24 bytes respectively, and includes earlier still-stacked arguments. The C models the pushed return address and preserves those earlier arguments across nested calls. Cdecl argument interpretation is right-to-left, e.g. `0x509B50(dst,src,0x10000)`, `0x56DCE0(zext global BYTE,zext descriptor WORD)`, `0x507080(actor DWORD,index DWORD,0)`, `0x501740(id,0,128)`—these are observed DWORD slots, not validated callee prototypes.
* `asm-003:4–21` and `asm-013:1–20`: loop pointers are compared with signed JL, bounds are exactly base 0x1D972C0 to 0x1D97494 by 0x9C. First loop reloads global actor at each comparison; second holds ECX unless the particular opaque call branch explicitly reloads it. Neither loop is replaced with a universal actor-array assumption. SHL DL,CL uses x86's 5-bit count mask and truncates the 8-bit destination.
* `asm-004:22–25`, `asm-005:1–10`, `asm-008:14–25`, `asm-009:14–24`, `asm-010:14–22`: signed IMUL high half plus wrapped ADD and SAR 7 and sign correction are translated literally. There is no host signed-overflow arithmetic, implementation-defined negative right shift, or simplification to `/156`. Only comparisons explicitly made on DL use the low byte, so unusual high-bit pointer differences are not silently repaired.
* `asm-007:1–17`: callback pointer read 0x21DFEC4, copied to 0x21DFEC8, called with address 0x1D99A78; EAX stored at 0x1D96AAC. Afterwards descriptor storage 0x1D99A50 is reloaded. Unknown callback is not replaced with a semantic routine.
* `asm-009:20`, `asm-011:16`, `asm-012:12`: CH/AH bit 0x10 is a DWORD bit 0x1000. The full DWORD including other EAX bits survives the animation push after opaque 0x509C10. MOV AL/AX and MOV DL/DX preserve high bits until subsequent explicit full-width AND. Conversely XOR followed by byte/word MOV does zero-extend exactly where shown.
* `asm-016:16–25`: ESI is the original pointer captured from node+10, not the global actor/candidate reloaded elsewhere. The final low-byte AND preserves the other 24 flag bits; it writes the object byte before restoring saved ESI. EAX=2 only here.

Uncertainties: raw table values absent; opaque targets and callback runtime target/prototypes remain unresolved; concrete guest memory contents, aliases, faults, and nonstandard EFLAGS-sensitive callees are not established. Historical names and comments about presentation/no damage are not adopted as proofs. The boundary is intentionally general enough to retain actual opaque side effects, but supplying it is an integration responsibility. No compilation, execution, differential test, review, IDB validation or live observation was performed. Requested lead validation: table-byte readback, call-adapter correctness (including saved regs and real ESP effects), branch/chunk review, compilation, and differential machine-state comparison with delayed-cleanup stacks and unusual pointer/byte values. This is a deposited C A production with explicit limits, not a PASS or promotion.
