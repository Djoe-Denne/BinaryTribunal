# 0x47CF60 — independent C B

## Input and scope

Author: c-b-47cf60, GPT-6.1 Sol. Only this function is translated.
Frozen EXE SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
Packet SHA256 quoted from readable/manifest.json: `a502d16b154e08a955a468279c04dda5c926c4260a8b231a45a2bc2d45289fb2`.
Compaction SHA256 quoted from that manifest: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
Read all nine ASM slices, both byte slices, metadata.json, manifest.json and common-compaction.md in the supplied g07 projection. Hashes are supplied identifiers, not independently recomputed.

Coverage: the complete single half-open chunk `[0x0047CF60,0x0047D285)`, 209 instructions, and all 41 exported CFG blocks, including both RET paths. No peer C, classifier result, target ledger, or new discovery consulted.

## Representation and ABI contract

This is complete C for the **caller**, expressed as a register/stack/memory-preserving translation rather than inventing C prototypes for opaque native callees. `X86` and its backend are an explicit execution interface, not extra game functions or library calls. Address-named calls below are exactly the frozen E8 targets. The backend must execute each callee through its actual RET, with all its memory/register/x87 effects and faults; the backend receives the actual x86 return-address/argument stack. It does not receive a guessed argument count, return type, or semantic prototype. The implementation of each native callee is outside this function's supplied evidence.

At C entry, `esp` is the x86 entry ESP, `[esp]` the return address, `[esp+4]` the 32-bit context argument. At C exit the x86 RET has consumed only the return address. The actual caller-cleaned pushes, delayed cleanup, local addresses, EBX/ESI saves/restores, incidental EAX return bits, and scratch register effects are retained. No Boolean/void/int native return contract is asserted by the C wrapper's `void` type.

Memory callbacks perform exactly the stated 8/16/32-bit x86 access, little-endian, unaligned where necessary, to one shared address space; they must not split/reorder/cache accesses or detach stack storage from that space. Aliasing between context, globals, locals, and callee writes is preserved. Arithmetic and addresses wrap modulo 2^32; there are no signed C overflows, pointer-width assumptions, bounds guards, float casts, or invented callee/library implementations.

The x87 backend operation implements actual `FLD m64real`, using the incoming x87 stack/control/status/tag environment, including conversion to extended precision and possible exceptions. `0x55AD90` is then invoked natively with that state: no assumption of C truncation, rounding mode, signed return range, or x87 stack cleanup is made. The backend owns the opaque x87 state. Undefined arithmetic flag bits are marked in `undefined_flags` and must not be treated as defined by consumers. Flags not affected by these instructions are retained.

```c
#include <stdint.h>

typedef struct X86 X86;
typedef struct Backend {
    uint8_t  (*rd8)(X86 *, uint32_t);
    uint16_t (*rd16)(X86 *, uint32_t);
    uint32_t (*rd32)(X86 *, uint32_t);
    void (*wr8)(X86 *, uint32_t, uint8_t);
    void (*wr32)(X86 *, uint32_t, uint32_t);
    /* Run from x->eip through the native return. ESP initially addresses
       the return address pushed by call_at. Propagate nonlocal exits/faults. */
    void (*native_call)(X86 *);
    /* Execute FLD m64real at this address; preserve its real x87 behavior. */
    void (*fld_m64real)(X86 *, uint32_t);
} Backend;

struct X86 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi, eip;
    uint32_t eflags, undefined_flags;
    void *memory_and_native_state;
    void *x87_state;
    const Backend *b;
};

enum { CF=0x001u, PF=0x004u, AF=0x010u,
       ZF=0x040u, SF=0x080u, OF=0x800u };

static uint8_t r8(X86 *x, uint32_t a) { return x->b->rd8(x,a); }
static uint16_t r16(X86 *x, uint32_t a) { return x->b->rd16(x,a); }
static uint32_t r32(X86 *x, uint32_t a) { return x->b->rd32(x,a); }
static void w8(X86 *x, uint32_t a, uint8_t v) { x->b->wr8(x,a,v); }
static void w32(X86 *x, uint32_t a, uint32_t v) { x->b->wr32(x,a,v); }
static uint32_t low8(uint32_t v) { return v & UINT32_C(255); }
static uint32_t put_low8(uint32_t a, uint32_t v) {
    return (a & UINT32_C(0xffffff00)) | low8(v);
}
static int is_z(X86 *x) { return (x->eflags & ZF) != 0; }
static uint32_t szp(uint32_t r, unsigned bits) {
    uint32_t v = low8(r), odd = 0;
    unsigned i;
    for (i=0; i<8; ++i) odd ^= (v >> i) & 1u;
    return (r == 0 ? ZF : 0u) |
           ((r & (UINT32_C(1) << (bits-1))) != 0 ? SF : 0u) |
           (odd == 0 ? PF : 0u);
}
static uint32_t sub_flags(X86 *x, uint32_t a, uint32_t b,
                          unsigned bits) {
    uint32_t mask = bits == 32 ? UINT32_MAX :
                    ((UINT32_C(1) << bits)-1u);
    uint32_t sign = UINT32_C(1) << (bits-1);
    uint32_t r;
    a &= mask; b &= mask; r = (a-b) & mask;
    x->eflags = (x->eflags & ~(CF|PF|AF|ZF|SF|OF)) |
        szp(r,bits) | (a < b ? CF : 0u) |
        (((a^b^r)&16u) != 0 ? AF : 0u) |
        (((a^b)&(a^r)&sign) != 0 ? OF : 0u);
    x->undefined_flags &= ~(CF|PF|AF|ZF|SF|OF);
    return r;
}
static uint32_t add32(X86 *x, uint32_t a, uint32_t b) {
    uint32_t r = a+b;
    x->eflags = (x->eflags & ~(CF|PF|AF|ZF|SF|OF)) |
        szp(r,32) | (r < a ? CF : 0u) |
        (((a^b^r)&16u) != 0 ? AF : 0u) |
        (((~(a^b))&(a^r)&UINT32_C(0x80000000)) != 0 ? OF : 0u);
    x->undefined_flags &= ~(CF|PF|AF|ZF|SF|OF);
    return r;
}
static uint32_t logic32(X86 *x, uint32_t r) {
    x->eflags = (x->eflags & ~(CF|PF|ZF|SF|OF)) | szp(r,32);
    x->undefined_flags =
        (x->undefined_flags & ~(CF|PF|ZF|SF|OF)) | AF;
    return r;
}
static uint32_t shl3(X86 *x, uint32_t a) {
    uint32_t r = a << 3;
    x->eflags = (x->eflags & ~(CF|PF|ZF|SF)) |
        szp(r,32) | (((a >> 29)&1u) != 0 ? CF : 0u);
    x->undefined_flags = (x->undefined_flags & ~(CF|PF|ZF|SF)) | AF | OF;
    return r;
}
static void cmp32(X86 *x, uint32_t a, uint32_t b) {
    (void)sub_flags(x,a,b,32);
}
static void cmp16(X86 *x, uint32_t a, uint32_t b) {
    (void)sub_flags(x,a,b,16);
}
static void cmp8(X86 *x, uint32_t a, uint32_t b) {
    (void)sub_flags(x,a,b,8);
}
static void push32(X86 *x, uint32_t v) {
    x->esp -= 4u; w32(x,x->esp,v); /* PUSH changes no flags. */
}
static uint32_t pop32(X86 *x) {
    uint32_t v = r32(x,x->esp); x->esp += 4u; return v;
}
static void call_at(X86 *x, uint32_t target, uint32_t next) {
    push32(x,next); x->eip=target; x->b->native_call(x);
}
static void ret_near(X86 *x) { x->eip=pop32(x); }

void translated_0047CF60(X86 *x) {
    /* 0047CF60..0047CF71 */
    x->esp = sub_flags(x,x->esp,0x1cu,32);
    push32(x,x->ebx);
    push32(x,x->esi);
    x->esi = r32(x,x->esp+0x28u);
    x->ebx = logic32(x,x->ebx ^ x->ebx);
    cmp32(x,r32(x,x->esi+0xba8u),x->ebx);
    if (!is_z(x)) goto L47CF87;
    /* 0047CF73..0047CF84: pushes height,width,0,0 */
    push32(x,0x1e0u);
    push32(x,0x280u);
    push32(x,x->ebx);
    push32(x,x->ebx);
    call_at(x,0x0045b4c0u,0x0047cf84u);
    x->esp = add32(x,x->esp,0x10u);
L47CF87:
    x->eax = x->esp+8u;
    push32(x,x->esi);
    push32(x,x->eax);
    w32(x,x->esp+0x18u,0);
    w32(x,x->esp+0x14u,0);
    w32(x,x->esp+0x10u,0);
    w32(x,x->esp+0x1cu,0x3f800000u);
    call_at(x,0x0041e168u,0x0047cfb2u);
    push32(x,x->esi);
    push32(x,1);
    push32(x,1);
    push32(x,1);
    call_at(x,0x0041dfbau,0x0047cfbeu);
    x->eax = r32(x,x->esi+0xba8u);
    x->esp = add32(x,x->esp,0x18u);
    cmp32(x,x->eax,x->ebx);
    if (!is_z(x)) goto L47CFEE;
    /* 0047CFCB..0047CFEB: explicit, ordered global loads */
    x->ecx = r32(x,0x01a77650u);
    x->edx = r32(x,0x01a77654u);
    x->eax = r32(x,0x01a77648u);
    push32(x,x->ecx);
    x->ecx = r32(x,0x01a7764cu);
    push32(x,x->edx);
    push32(x,x->eax);
    push32(x,x->ecx);
    call_at(x,0x0045b4c0u,0x0047cfebu);
    x->esp = add32(x,x->esp,0x10u);
L47CFEE:
    push32(x,x->esi);
    push32(x,x->ebx);
    call_at(x,0x0041e972u,0x0047cff5u);
    x->esp = add32(x,x->esp,8);
    (void)logic32(x,x->eax & x->eax); /* 0047CFF8 TEST */
    if (is_z(x)) goto L47D243;
    /* 0047D000..0047D048 */
    x->edx = r32(x,0x01d2a284u);
    push32(x,x->edx);
    call_at(x,0x00416b9au,0x0047d00cu);
    x->eax = r32(x,0x01d2a288u);
    push32(x,x->eax);
    call_at(x,0x00424bf9u,0x0047d017u);
    call_at(x,0x0049b120u,0x0047d01cu);
    call_at(x,0x00499a40u,0x0047d021u);
    push32(x,x->esi);
    call_at(x,0x0043fbe8u,0x0047d027u);
    push32(x,x->esi);
    call_at(x,0x00409b42u,0x0047d02du);
    push32(x,x->esi);
    call_at(x,0x00409b08u,0x0047d033u);
    push32(x,x->esi);
    call_at(x,0x00409b25u,0x0047d039u);
    x->esp = add32(x,x->esp,0x18u);
    call_at(x,0x0056ba40u,0x0047d041u);
    x->eax = put_low8(x->eax,r8(x,0x01d28deau));
    cmp8(x,low8(x->eax),low8(x->ebx));
    if (is_z(x)) goto L47D0D3;
    /* 0047D04E..0047D055 */
    call_at(x,0x004a71d0u,0x0047d053u);
    (void)logic32(x,x->eax & x->eax);
    if (is_z(x)) goto L47D0D3;
    /* 0047D057..0047D061 */
    w32(x,0x01cff834u,1);
    w32(x,0x01cff844u,x->ebx);
L47D067:
    w32(x,x->esi+0xb88u,1);
    call_at(x,0x0045b580u,0x0047d076u);
L47D076:
    call_at(x,0x004701b0u,0x0047d07bu);
    call_at(x,0x004701b0u,0x0047d080u);
    call_at(x,0x004701b0u,0x0047d085u);
    call_at(x,0x004701b0u,0x0047d08au);
    cmp16(x,r16(x,0x01cdbfe0u),3);
    if (!is_z(x)) goto L47D0BB;
    /* 0047D094..0047D0B6 */
    push32(x,x->ebx);
    call_at(x,0x004a76e0u,0x0047d09au);
    x->esp = add32(x,x->esp,4);
    call_at(x,0x004a8e30u,0x0047d0a2u);
    call_at(x,0x004a84e0u,0x0047d0a7u);
    call_at(x,0x004a8e30u,0x0047d0acu);
    call_at(x,0x004a84e0u,0x0047d0b1u);
    call_at(x,0x004a8e30u,0x0047d0b6u);
    call_at(x,0x004a84e0u,0x0047d0bbu);
L47D0BB:
    call_at(x,0x0045b2e0u,0x0047d0c0u);
    (void)logic32(x,x->eax & x->eax);
    if (is_z(x)) goto L47D10A;
    /* 0047D0C4..0047D0D2: early RET, no shared tail */
    push32(x,x->esi);
    call_at(x,0x0041e99du,0x0047d0cau);
    x->esp = add32(x,x->esp,4);
    x->esi = pop32(x);
    x->ebx = pop32(x);
    x->esp = add32(x,x->esp,0x1cu);
    ret_near(x);
    return;
L47D0D3:
    w8(x,0x01d28de9u,(uint8_t)low8(x->ebx));
    x->eax = r32(x,0x01cff834u);
    cmp32(x,x->eax,x->ebx);
    if (is_z(x)) goto L47D0E7;
    /* 0047D0E2 */
    call_at(x,0x005003a0u,0x0047d0e7u);
L47D0E7:
    x->eax = r32(x,0x01cff844u);
    w32(x,0x01cff834u,x->ebx);
    cmp32(x,x->eax,x->ebx);
    if (is_z(x)) goto L47D067;
    /* 0047D0FA..0047D105 */
    w32(x,x->esi+0xb88u,x->ebx);
    call_at(x,0x0045b590u,0x0047d105u);
    goto L47D076;
L47D10A:
    x->eax = put_low8(x->eax,r8(x,0x01d28de9u));
    cmp8(x,low8(x->eax),low8(x->ebx));
    if (!is_z(x)) goto L47D118;
    /* 0047D113 */
    call_at(x,0x0047ccb0u,0x0047d118u);
L47D118:
    cmp16(x,r16(x,0x01cdbfe0u),3);
    if (!is_z(x)) goto L47D150;
    /* 0047D122..0047D14B */
    x->eax = logic32(x,x->eax ^ x->eax);
    x->eax = put_low8(x->eax,r8(x,0x01d96a80u));
    x->ecx = x->eax + x->eax*2u;
    x->ecx = shl3(x,x->ecx);
    x->ecx = sub_flags(x,x->ecx,x->eax,32);
    x->edx = 0x01d969c8u + x->ecx*4u;
    push32(x,x->edx);
    call_at(x,0x004a76e0u,0x0047d13eu);
    x->esp = add32(x,x->esp,4);
    call_at(x,0x004a8e30u,0x0047d146u);
    call_at(x,0x004a84e0u,0x0047d14bu);
    call_at(x,0x004a78e0u,0x0047d150u);
L47D150:
    cmp32(x,r32(x,0x01cff830u),x->ebx);
    if (is_z(x)) goto L47D1AA;
    /* 0047D158..0047D160 */
    cmp16(x,r16(x,0x01cdbfe0u),4);
    if (!is_z(x)) goto L47D17C;
    /* 0047D162..0047D17A */
    w32(x,x->esp+0x10u,0x004a2280u);
    w32(x,x->esp+0x14u,0x004a22a0u);
    w32(x,x->esp+0x18u,0x004a2690u);
    goto L47D194;
L47D17C:
    w32(x,x->esp+0x10u,0x00470690u);
    w32(x,x->esp+0x14u,0x004706a0u);
    w32(x,x->esp+0x18u,0x004706b0u);
L47D194:
    x->eax = x->esp+8u;
    push32(x,x->esi);
    push32(x,x->eax);
    w32(x,x->esp+0x24u,x->ebx);
    w32(x,x->esp+0x28u,x->ebx);
    call_at(x,0x00409a57u,0x0047d1a7u);
    x->esp = add32(x,x->esp,8);
L47D1AA:
    x->eax = put_low8(x->eax,r8(x,0x01d28de9u));
    cmp8(x,low8(x->eax),low8(x->ebx));
    if (!is_z(x)) goto L47D1FA;
    /* 0047D1B3..0047D1BA */
    x->eax = r32(x,0x01cff6f4u);
    cmp32(x,x->eax,x->ebx);
    if (is_z(x)) goto L47D1F3;
    /* 0047D1BC..0047D1ED; SETZ uses CMP EAX,2, not MOV EAX. */
    x->edx = r32(x,0x01a77650u);
    x->ecx = logic32(x,x->ecx ^ x->ecx);
    cmp32(x,x->eax,2);
    x->eax = r32(x,0x01a77654u);
    x->ecx = put_low8(x->ecx,is_z(x) ? 1u : 0u);
    push32(x,x->ecx);
    x->ecx = r32(x,0x01a77648u);
    push32(x,0x3ac49ba6u); /* float bits are passed unchanged */
    push32(x,x->edx);
    x->edx = r32(x,0x01a7764cu);
    push32(x,x->eax);
    push32(x,x->ecx);
    push32(x,x->edx);
    call_at(x,0x0056d1d0u,0x0047d1eau);
    x->esp = add32(x,x->esp,0x18u);
    w32(x,0x01cff6f4u,x->ebx);
L47D1F3:
    call_at(x,0x0056ba80u,0x0047d1f8u);
    goto L47D204;
L47D1FA:
    push32(x,UINT32_MAX); /* PUSH imm8 -1 sign extends to DWORD */
    call_at(x,0x0045d610u,0x0047d201u);
    x->esp = add32(x,x->esp,4);
L47D204:
    cmp32(x,r32(x,0x01cff834u),x->ebx);
    if (is_z(x)) goto L47D213;
    /* 0047D20C: only the low byte is written */
    w8(x,0x01d28de9u,1);
L47D213:
    cmp32(x,r32(x,0x01cff844u),x->ebx);
    if (!is_z(x)) goto L47D235;
    /* 0047D21B..0047D230 */
    call_at(x,0x004980c0u,0x0047d220u);
    call_at(x,0x00465930u,0x0047d225u);
    push32(x,x->esi);
    push32(x,1);
    call_at(x,0x0041e947u,0x0047d22du);
    x->esp = add32(x,x->esp,8);
    call_at(x,0x00499ea0u,0x0047d235u);
L47D235:
    call_at(x,0x0045b450u,0x0047d23au);
    push32(x,x->esi);
    call_at(x,0x0041e99du,0x0047d240u);
    x->esp = add32(x,x->esp,4);
L47D243:
    call_at(x,0x0056d9c0u,0x0047d248u);
    x->eax = r32(x,0x00b6d970u);
    cmp32(x,x->eax,x->ebx);
    if (is_z(x)) goto L47D265;
    /* 0047D251..0047D257 */
    cmp32(x,r32(x,0x01cff834u),x->ebx);
    if (!is_z(x)) goto L47D265;
    /* 0047D259..0047D263 */
    call_at(x,0x004020f0u,0x0047d25eu);
    w32(x,0x01cff844u,x->eax);
    goto L47D26B;
L47D265:
    w32(x,0x01cff844u,x->ebx);
L47D26B:
    /* DD 05 E0 8B A7 01, not an address inferred from the ASM label. */
    x->eip = 0x0047d26bu;
    x->b->fld_m64real(x,0x01a78be0u);
    call_at(x,0x0055ad90u,0x0047d276u);
    push32(x,x->eax);
    call_at(x,0x0046bd10u,0x0047d27cu);
    x->esp = add32(x,x->esp,4);
    x->esi = pop32(x);
    x->ebx = pop32(x);
    x->esp = add32(x,x->esp,0x1cu);
    ret_near(x);
}
```

## Evidence and checked details

1. `asm-001:1–20`, `bytes-001:1–3`: entry reserves 0x1C bytes, saves EBX/ESI, loads the original-stack argument at +4. Initial four local DWORD stores are at original ESP minus 20,24,28,16, in that order. Calls at CFAD/CFB9 retain their combined six pushed DWORDs until CFC4. The translation retains that real shared stack, not a guessed color/descriptor type.
2. `asm-002:16–21`, `asm-004:15–24`, `metadata.json:43–49,103–107`: zero EAX after CFF0 bypasses the entire central body to D243. Nonzero EAX from D0BB takes a separate leave-scene/RET path, skipping the entire common input/rate/x87 tail. These are not equivalent failure returns.
3. `asm-005:1–15`, `bytes-001:12–15`: pause DWORD 1CFF834, sleep DWORD 1CFF844, and pause BYTE 1D28DE9 are distinct. A normal D0D3 path clears the byte first. The pause request path D057 does not clear it. Reading the sleep DWORD precedes clearing the pause DWORD. Director D113 is gated by the byte, not the DWORD.
4. `asm-004:4`, `asm-005:16–25`, `bytes-001:10,15–16`: state comparisons are **WORD** at 1CDBFE0 (66-prefixed opcode). The zero-extended ping-pong BYTE produces 92*index+1D969C8 with no range guard. Calls can change state between comparisons; each comparison reloads memory.
5. `asm-006:9–22`, `bytes-001:17–18`: callback triplets are literal code-pointer DWORDs, conditional on WORD state 4; D194 also zeros original-stack−8 and −4. Earlier local contents, including −28/−24, are not reinitialized here. Callee-visible stack aliasing is retained.
6. `asm-007:4–19`, `bytes-001:20`/`bytes-002:1`: SETZ CL tests the swirl-latch comparison performed **before** EAX is replaced with render width. The literal 3AC49BA6 is passed as bits. Clearing the swirl DWORD happens after the callee; paused path instead pushes sign-extended FFFFFFFF. No overlay/render semantic is inferred solely from names.
7. `asm-008:16–25`, `asm-009:1–9`, `bytes-002:4–6`: shared tail conditionally writes the rate helper's full EAX into the sleep DWORD, then loads x87 memory, calls 55AD90, pushes only EAX and calls **46BD10**. Both x87 environment and incidental last-callee EAX remain native, not forced into a semantic return value.
8. `metadata.json:315–327`: two supplied inbound references, 4709EC in 4706B0 and 5598DD in 559890, are `type=1,iscode=false`. They do not prove direct CALL ABI or return meaning. CFG boundaries cited here come from supplied metadata, while operand widths/addresses and E8 destinations are grounded in bytes.

## Risks / explicit unknowns

- **Address/label discrepancies:** FLD encoding at D26B is `DD 05 E0 8B A7 01`, hence memory **1A78BE0**, although the ASM symbolic label ends in `1A788B8`. E8 at D277 is `E8 94 EA FE FF`, hence **46BD10**, although its ASM label ends in `46BB10`. These are not silently “repaired”; raw addresses are used. Parent should confirm these against its exact frozen/native readback.
- Native callee bodies and exact semantic prototypes are not supplied here. The backend contract explicitly avoids inventing them. This is a standalone caller translation, **not** a complete drop-in game implementation or a claim that those backend routines were built.
- The x87 memory value, incoming control word/status/tag, conversion behavior of 55AD90, and behavior of 46BD10 require the native backend or separately authorized context. A C floating/integer conversion would not be justified. FLD itself can fault; there is no invented exception handling.
- Memory hooks must preserve single-width x86 accesses and native side effects; host-thread atomicity/concurrency and asynchronous exception timing are not independently specified by this offline packet. EIP is set for call entry, the explicit x87 operation and RET; per-instruction debugger stepping/trap behavior is not implemented.
- Arithmetic flags are represented, including partial-register writes and undefined bits, but this is not a CPU-wide interpreter. Native hooks must carry their actual callee flags, registers and x87 effects back. No speculative cdecl prototype, callee purity, nullsub purity, flag preservation, or lifetime of passed stack pointers is assumed.
- Comments containing historical LIVE observations are context only, not newly executed validation. No compilation, runtime, differential, x87 edge-case or stack-ABI test was performed. Parent should separately compile the C and compare both RET paths, sleep/pause branches, callback selection, and x87/return-state behavior against frozen/native execution.
