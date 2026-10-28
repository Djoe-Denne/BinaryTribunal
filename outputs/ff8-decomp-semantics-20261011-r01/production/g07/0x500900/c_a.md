# 0x500900 — independent C A

## Provenance and scope

Author: c-a-500900, GPT-6 Astra. Only the assigned frozen common context and complete readable projection were used for this production; no other producer/classifier output was consulted.

Input directory: `inputs/ff8-decomp-semantics-20261011-r01/g07/`.

- `0x500900.readable/manifest.json:3-7`: authoritative packet `0x500900.json`, declared SHA-256 **0c68458ed2dd63fc4969914f650dfd11176145e5b11dda0e4ce2d917cff21590**; common-compaction declared SHA-256 **6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff**. These are citations, not independently recomputed hashes.
- Read all nine `asm-001.txt` through `asm-009.txt` slices (206 instructions), both `bytes-001.txt` and `bytes-002.txt`, and all `metadata.json`.
- Executable SHA-256: **064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570**; 32-bit export dated 2026-10-11T16:38:25.140966+00:00 (`metadata.json:4-9`).
- Complete half-open code extents: **[0x500900,0x5009A1)** and **[0x5005A0,0x50081F)**, 0x320 bytes total. The E9 at 0x50099C reaches 0x5005A0; the only RET is 0x50081E. All 20 exported CFG blocks are represented below.

## Representation / ABI contract

This is complete C for the target's instruction effects, using an explicit IA-32 state and memory/native-call boundary. It deliberately does **not** invent C prototypes or semantic return types for any callee. The support callbacks below are evaluator interfaces, not calls claimed to exist in FF8 and not replacement game/library callees. Every actual native transfer has its numeric E8 target and return PC in the body.

- `rd8/rd16/rd32` and `wr8/wr16/wr32` each represent **one** little-endian access of the indicated width in the same flat 32-bit address space, including stack. Backends must preserve aliasing and access order; invalid native accesses must fault, not be clamped or silently ignored. The code does not add any null/index guards beyond native branches.
- Entry state is at 0x500900 with the caller's return address at `[ESP]`. PUSH/CALL/RET and delayed caller cleanups use that actual modeled stack; no detached argument arrays. Thus retained previous arguments remain visible during intervening calls.
- `native_until_return` executes the callee entered at `eip` until it returns to the pushed return PC. It is responsible for actual callee register, memory, flags, x87, and stack effects. It is not assumed to preserve caller-saved registers or globals. The target itself never writes EBX/EBP/ESI/EDI and loads no incoming stack arguments. No extra callee cleanup is guessed.
- GPR arithmetic/address calculation is uint32 modulo 2^32; byte operations retain EAX[31:8]. Signed WORD loads produce exact two's-complement sign extension without implementation-defined signed casts. No floating operation occurs in these chunks. `x87_environment` is the shared, opaque actual x87 register/control/status/tag environment used by the native-call bridge: no default rounding/precision/exceptions or empty x87 stack is assumed or installed.
- Defined arithmetic EFLAGS are modeled, including those reaching opaque calls and final RET. AF after logical/shift instructions and OF after multi-bit shifts are architecturally undefined; this model retains their old values as one permitted choice. It does not assert matching a particular processor's undefined flag choices. As with conventional C lifts, instruction timing, interrupts, debugger stepping and instruction-fetch faults are not emulated.
- The entry C return is `void` because the full machine state is the output. Native exit EAX is explicitly produced by the final LEA, not replaced by a guessed Boolean/void native ABI. Full call signatures and the intended native return contract remain unknown.

## Complete C

```c
#include <stdint.h>

typedef uint8_t  U8;
typedef uint16_t U16;
typedef uint32_t U32;
typedef struct X86 X86;

struct X86 {
    U32 eax, ecx, edx, ebx, esp, ebp, esi, edi, eip, eflags;
    void *memory;
    void *x87_environment;
    U8  (*rd8)(void *, U32);
    U16 (*rd16)(void *, U32);
    U32 (*rd32)(void *, U32);
    void (*wr8)(void *, U32, U8);
    void (*wr16)(void *, U32, U16);
    void (*wr32)(void *, U32, U32);
    void (*native_until_return)(X86 *);
};

enum { CF = 0x001u, PF = 0x004u, AF = 0x010u,
       ZF = 0x040u, SF = 0x080u, OF = 0x800u };

static U32 width_mask(unsigned bits) {
    return bits == 8u ? 0xffu : 0xffffffffu;
}
static U32 width_sign(unsigned bits) {
    return bits == 8u ? 0x80u : 0x80000000u;
}
static void set_szp(X86 *s, U32 r, unsigned bits) {
    U32 p = r & 0xffu;
    p ^= p >> 4; p ^= p >> 2; p ^= p >> 1;
    s->eflags &= ~(U32)(SF | ZF | PF);
    if ((r & width_mask(bits)) == 0u) s->eflags |= ZF;
    if ((r & width_sign(bits)) != 0u) s->eflags |= SF;
    if ((p & 1u) == 0u) s->eflags |= PF;
}
static U32 add_width(X86 *s, U32 a, U32 b, unsigned bits) {
    U32 mask = width_mask(bits), sign = width_sign(bits), r;
    a &= mask; b &= mask; r = (a + b) & mask;
    s->eflags &= ~(U32)(CF | AF | OF);
    if (r < a) s->eflags |= CF;
    if (((a ^ b ^ r) & 0x10u) != 0u) s->eflags |= AF;
    if (((~(a ^ b) & (a ^ r)) & sign) != 0u) s->eflags |= OF;
    set_szp(s, r, bits);
    return r;
}
static U32 sub_width(X86 *s, U32 a, U32 b, unsigned bits) {
    U32 mask = width_mask(bits), sign = width_sign(bits), r;
    a &= mask; b &= mask; r = (a - b) & mask;
    s->eflags &= ~(U32)(CF | AF | OF);
    if (a < b) s->eflags |= CF;
    if (((a ^ b ^ r) & 0x10u) != 0u) s->eflags |= AF;
    if ((((a ^ b) & (a ^ r)) & sign) != 0u) s->eflags |= OF;
    set_szp(s, r, bits);
    return r;
}
static U32 logic_width(X86 *s, U32 r, unsigned bits) {
    r &= width_mask(bits);
    s->eflags &= ~(U32)(CF | OF); /* AF undefined: retain */
    set_szp(s, r, bits);
    return r;
}
/* All target uses have fixed nonzero counts 3, 4 or 14. */
static U32 shl32(X86 *s, U32 a, unsigned n) {
    U32 c = (a >> (32u - n)) & 1u;
    U32 r = a << n;
    s->eflags = (s->eflags & ~(U32)CF) | c;
    /* AF and (for these counts) OF are undefined: retain. */
    set_szp(s, r, 32u);
    return r;
}
static U32 sx16(U16 a) {
    U32 v = a;
    return (v & 0x8000u) != 0u ? (v | 0xffff0000u) : v;
}
static void put_al(X86 *s, U8 a) {
    s->eax = (s->eax & 0xffffff00u) | (U32)a;
}
static void push32(X86 *s, U32 v) {
    s->esp -= 4u; /* PUSH does not change EFLAGS */
    s->wr32(s->memory, s->esp, v);
}
static void call_native(X86 *s, U32 target, U32 return_pc) {
    push32(s, return_pc);
    s->eip = target;
    s->native_until_return(s);
}

#define R8(a)    s->rd8(s->memory, (U32)(a))
#define R16(a)   s->rd16(s->memory, (U32)(a))
#define R32(a)   s->rd32(s->memory, (U32)(a))
#define W8(a,v)  s->wr8(s->memory, (U32)(a), (U8)(v))
#define W16(a,v) s->wr16(s->memory, (U32)(a), (U16)(v))
#define W32(a,v) s->wr32(s->memory, (U32)(a), (U32)(v))
#define ADD(d,v) ((d) = add_width(s, (d), (U32)(v), 32u))
#define SUB(d,v) ((d) = sub_width(s, (d), (U32)(v), 32u))
#define AND(d,v) ((d) = logic_width(s, (d) & (U32)(v), 32u))
#define XOR(d,v) ((d) = logic_width(s, (d) ^ (U32)(v), 32u))
#define SHL(d,n) ((d) = shl32(s, (d), (n)))
#define T8(v,k)  ((void)logic_width(s, (U32)(v) & (U32)(k), 8u))
#define T32(v,k) ((void)logic_width(s, (U32)(v) & (U32)(k), 32u))
#define IS_Z    ((s->eflags & ZF) != 0u)
#define PUSH(v) push32(s, (U32)(v))
#define CALL(t,r) call_native(s, (t), (r))

void lift_00500900(X86 *s) {
    /* 00500900..00500937 */
    CALL(0x0048d0d0u, 0x00500905u);
    s->eax = R32(0x01d96aa4u);
    PUSH(s->eax);
    CALL(0x00508420u, 0x00500910u);
    s->ecx = R32(0x01d96a8cu);
    PUSH(s->ecx);
    CALL(0x00508420u, 0x0050091cu);
    s->edx = R32(0x01d96aa0u);
    PUSH(s->edx);
    CALL(0x00508420u, 0x00500928u);
    W8(0x01d96a90u, s->eax);
    s->eax = R32(0x01d96aacu);
    ADD(s->esp, 0x0cu);
    T32(s->eax, s->eax);
    if (IS_Z) goto L50094b;

    /* 00500939..00500946: full EAX, not AL, controls the clear. */
    PUSH(s->eax);
    CALL(0x00508420u, 0x0050093fu);
    ADD(s->esp, 4u);
    T32(s->eax, s->eax);
    if (!IS_Z) goto L50094b;
    W32(0x01d96aacu, s->eax);

L50094b:
    s->eax = R32(0x01d96aa8u);
    PUSH(s->eax);
    CALL(0x00508420u, 0x00500956u);
    W8(0x01d96a88u, s->eax);
    CALL(0x00502020u, 0x00500960u);
    CALL(0x004bb090u, 0x00500965u);
    CALL(0x0048d0d0u, 0x0050096au);
    s->ecx = R32(0x01d96a94u);
    PUSH(s->ecx);
    CALL(0x00508420u, 0x00500976u);
    ADD(s->esp, 8u);
    CALL(0x0048d0d0u, 0x0050097eu);
    CALL(0x00506c30u, 0x00500983u);
    CALL(0x0048d0d0u, 0x00500988u);
    CALL(0x00504060u, 0x0050098du);
    CALL(0x00506e30u, 0x00500992u);
    CALL(0x005033e0u, 0x00500997u);
    CALL(0x00502020u, 0x0050099cu);
    /* 0050099c: E9 FF FB FF FF -> attached chunk 005005a0. */

    /* 005005a0..005005e8 */
    T8(R8(0x01d96a9cu), 4u);
    if (IS_Z) goto L50065e;
    s->eax = R32(0x00b8a3e4u);
    PUSH(s->eax);
    s->eax = R32(0x01d96a80u);
    AND(s->eax, 0xffu);
    XOR(s->eax, 1u);
    s->ecx = s->eax + s->eax * 2u;
    SHL(s->ecx, 3u);
    SUB(s->ecx, s->eax);
    s->eax = R32(0x01d8e04cu);
    ADD(s->eax, 8u);
    s->edx = 0x01d969c8u + s->ecx * 4u;
    PUSH(s->edx);
    PUSH(s->eax);
    CALL(0x004a9160u, 0x005005deu);
    put_al(s, R8(0x01d96a9cu));
    ADD(s->esp, 0x0cu);
    T8(s->eax, 4u);
    if (IS_Z) goto L50065e;

    /* 005005ea..0050063c */
    s->ecx = R32(0x01d96a80u);
    AND(s->ecx, 0xffu);
    s->eax = s->ecx;
    s->edx = s->ecx + s->ecx * 2u;
    XOR(s->eax, 1u);
    SHL(s->edx, 3u);
    SUB(s->edx, s->ecx);
    s->ecx = 0x01d969c8u + s->edx * 4u;
    s->edx = s->eax + s->eax * 2u;
    SHL(s->edx, 3u);
    SUB(s->edx, s->eax);
    PUSH(s->ecx);
    s->ecx = 0x01d969c8u + s->edx * 4u;
    s->edx = s->eax + s->eax * 4u;
    PUSH(s->ecx);
    s->ecx = R32(0x00b8a3e4u);
    s->eax = 0x01d96980u + s->edx * 4u;
    PUSH(s->eax);
    PUSH(s->ecx);
    CALL(0x004a9220u, 0x00500632u);
    put_al(s, R8(0x01d8e03au));
    ADD(s->esp, 0x10u);
    T8(s->eax, s->eax);
    if (IS_Z) goto L50065e;

    /* 0050063e..00500649: unsigned byte comparison / byte wrap. */
    (void)sub_width(s, s->eax, 0x10u, 8u);
    if ((s->eflags & (CF | ZF)) != 0u) goto L50064b;
    put_al(s, (U8)add_width(s, s->eax, 0xf0u, 8u));
    W8(0x01d8e03au, s->eax);
    goto L50065e;

L50064b:
    AND(s->eax, 1u); /* discards ALL high bits of EAX */
    PUSH(s->eax);
    CALL(0x0045c310u, 0x00500654u);
    ADD(s->esp, 4u);
    W8(0x01d8e03au, 0u);

L50065e:
    CALL(0x00501b60u, 0x00500663u);
    CALL(0x00501230u, 0x00500668u);
    T8(R8(0x01d96a9cu), 8u);
    if (IS_Z) goto L50068f;
    CALL(0x00505d20u, 0x00500676u);
    PUSH(1u);
    PUSH(0x01d8e040u);
    CALL(0x0045c9f0u, 0x00500682u);
    PUSH(0x01d8e040u);
    CALL(0x0045c320u, 0x0050068cu);
    ADD(s->esp, 0x0cu);

L50068f:
    T8(R8(0x01d96a9cu), 4u);
    if (IS_Z) goto L50074d;
    s->eax = R32(0x01d96a80u);
    AND(s->eax, 0xffu);
    XOR(s->eax, 1u);
    s->edx = s->eax + s->eax * 2u;
    SHL(s->edx, 3u);
    SUB(s->edx, s->eax);
    s->eax = 0x01d969c8u + s->edx * 4u;
    PUSH(s->eax);
    CALL(0x0045b660u, 0x005006beu);
    s->eax = R32(0x01d96a80u);
    AND(s->eax, 0xffu);
    s->ecx = s->eax;
    SHL(s->ecx, 4u);
    ADD(s->ecx, s->eax);
    s->edx = s->eax + s->ecx * 8u;
    SHL(s->edx, 4u);
    ADD(s->edx, s->eax);
    s->eax = 0x01d924dcu + s->edx * 8u;
    PUSH(s->eax);
    CALL(0x0045d610u, 0x005006e4u);
    s->ecx = sx16(R16(0x01d8e038u));
    PUSH(s->ecx);
    CALL(0x0056cd00u, 0x005006f1u);
    s->edx = sx16(R16(0x01d8e03eu));
    s->eax = sx16(R16(0x01d8e03cu));
    ADD(s->edx, 0x6cu);
    ADD(s->eax, 0xa0u);
    PUSH(s->edx);
    PUSH(s->eax);
    CALL(0x0056cce0u, 0x0050070eu);
    s->ecx = sx16(R16(0x01d8e038u));
    PUSH(s->ecx);
    CALL(0x0056cd00u, 0x0050071bu);
    s->edx = sx16(R16(0x01d8e03eu));
    s->eax = sx16(R16(0x01d8e03cu));
    ADD(s->edx, 0x6cu);
    ADD(s->eax, 0xa0u);
    PUSH(s->edx);
    PUSH(s->eax);
    CALL(0x0056cce0u, 0x00500738u);
    ADD(s->esp, 0x20u);
    W16(0x01d8e03eu, 0u);
    W16(0x01d8e03cu, 0u);

L50074d:
    s->eax = R32(0x01cff834u);
    T32(s->eax, s->eax);
    if (!IS_Z) goto L5007a9;
    s->eax = R32(0x01d96a80u);
    PUSH(0xffffffffu);
    AND(s->eax, 0xffu);
    PUSH(0x111eu);
    s->ecx = s->eax;
    PUSH(0x101eu);
    SHL(s->ecx, 4u);
    ADD(s->ecx, s->eax);
    PUSH(0x101au);
    PUSH(0x1019u);
    PUSH(0x1011u);
    s->edx = s->eax + s->ecx * 8u;
    PUSH(0x11u);
    SHL(s->edx, 4u);
    PUSH(9u);
    ADD(s->edx, s->eax);
    PUSH(5u);
    PUSH(1u);
    PUSH(0u);
    s->eax = 0x01d8e058u + s->edx * 8u;
    PUSH(0x1122u);
    PUSH(s->eax);
    CALL(0x0045d550u, 0x005007a6u);
    ADD(s->esp, 0x34u);

L5007a9:
    T8(R8(0x01d96a9cu), 0x80u);
    s->eax = R32(0x01d96a80u); /* MOV preserves prior TEST flags */
    if (IS_Z) goto L5007d8;
    s->edx = R32(0x00b6d094u);
    AND(s->eax, 0xffu);
    s->ecx = s->eax + s->eax * 8u;
    SHL(s->ecx, 14u);
    ADD(s->ecx, s->edx);
    W32(0x01d8e054u, s->ecx);
    ADD(s->ecx, 0x24000u);
    goto L5007fd;

L5007d8:
    s->edx = R32(0x00b6d070u);
    AND(s->eax, 0xffu);
    s->ecx = s->eax * 8u;
    SUB(s->ecx, s->eax);
    SHL(s->ecx, 14u);
    ADD(s->ecx, s->edx);
    W32(0x01d8e054u, s->ecx);
    ADD(s->ecx, 0x1c000u);

L5007fd:
    W32(0x01d969a8u, s->ecx);
    s->ecx = s->eax;
    SHL(s->ecx, 4u);
    ADD(s->ecx, s->eax);
    s->edx = s->eax + s->ecx * 8u;
    SHL(s->edx, 4u);
    ADD(s->edx, s->eax);
    s->eax = 0x01d8e058u + s->edx * 8u;
    W32(0x01d8e04cu, s->eax);
    /* 0050081e: near RET, no immediate argument pop. */
    s->eip = R32(s->esp);
    s->esp += 4u; /* RET does not change EFLAGS */
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
#undef IS_Z
#undef PUSH
#undef CALL
```

## Coverage and checks by static inspection

All code blocks in `metadata.json:11-159` are covered, including the two distinct nonzero/zero-return blocks at 0x500939 and 0x500946, both byte-counter branches, all three independent bit-4 observations, bit-8 gate, pause branch, and both bit-0x80 outcomes. Zero-side branches are not inferred from names.

Exact cdecl-style outgoing stack sequences (arguments listed nearest return address first; these are pushed values, **not proven callee signatures**):

| Callsite(s) | Native destination | Newly pushed argument words | Cleanup |
|---|---|---|---|
| 50090B/917/923 | 508420 | respectively loads AA4/ A8C/ AA0 at base 1D96000 | 12 bytes at 500932 |
| 50093A | 508420 | load [1D96AAC], conditional | 4 bytes at 50093F |
| 500951,500971 | 508420 | loads [1D96AA8], [1D96A94] | combined 8 bytes at 500976; intervening calls see first retained word |
| 5005D9 | 4A9160 | [1D8E04C]+8, DRAWENV opposite-index address, [B8A3E4] | 12 bytes |
| 50062D | 4A9220 | [B8A3E4], base1D96980+20*opposite, opposite DRAWENV, current DRAWENV | 16 bytes |
| 50064F | 45C310 | EAX&1 | 4 bytes |
| 50067D,500687 | 45C9F0,45C320 | (1D8E040,1), then (1D8E040) | combined 12 bytes |
| 5006B9/6DF/6EC/709/716/733 | 45B660/45D610/56CD00/56CCE0/56CD00/56CCE0 | 1+1+1+2+1+2 words, literal order above | combined 32 bytes at 500738 |
| 5007A1 | 45D550 | computed OT,1122,0,1,5,9,11,1011,1019,101A,101E,111E,FFFFFFFF (hex) | 52 bytes |

All remaining E8 sites have **zero newly pushed words**, not an asserted zero-argument signature. Even `nullsub` labels are retained as real native calls. Each numeric destination is derived from its relative E8 and agrees with the exported target set. No inferred library substitution.

Address arithmetic independently visible in the bytes:

- DRAWENV base 0x1D969C8, stride 0x5C: `(3*i*8-i)*4`. Opposite selection is `(DWORD[1D96A80]&0xFF)^1`, **not** a Boolean assertion that index is 0/1.
- Secondary base 0x1D96980, stride 0x14. This region can alias other globals for unrestricted indices; the explicit address-space model does not eliminate such aliasing.
- OT address stride 0x8910: `((i+8*(17*i))*16+i)*8`; 0x5006D7 uses base **0x1D924DC**, whereas 0x500794/0x500812 use **0x1D8E058**. Do not conflate the bases.
- Packet-start DWORD write at 0x1D8E054 precedes packet-end DWORD write at **0x1D969A8**. Stride/end increment is 0x24000 for bit0x80 set and 0x1C000 otherwise. Index loaded before branch, then ANDed to 8 bits in either arm; final EAX returns `0x1D8E058 + 0x8910*index` modulo 2^32.
- Camera reads are signed 16-bit at 0x1D8E038/3E/3C. The second triplet is re-read after the first calls; the two WORD clears occur only after all six calls and cleanup. No cached camera values across calls.
- At 0x500632/642 only AL is changed; at 0x50064B the **whole** EAX is ANDed with 1. At 0x500928/956 only AL is stored; 0x500942 tests full EAX.

## Interpretation boundary and anchors

For this C-only role no separate semantic artifact is supplied. A conservative descriptive working name is `BattleFrame_RunStagesAndPrepareBuffers`, with moderate role confidence, not an authoritative rename. Two independent structural proofs: repeated 0x508420 invocations with distinct global head values (0x500905–0x500976), and the gated address-based submission/camera sequence followed by unconditional packet/OT preparation (0x5005A0–0x50081E). Neither proves the stronger historical “GF input” label.

Eight review anchors:

1. `asm-001.txt:2-25`, bytes at 0x500905–956: six possible stage-head calls overall, two AL result stores, optional full-EAX clear.
2. `asm-002.txt:15-17`, `bytes-001.txt:5-7`: discontiguous tail transfer and first bit-4 gate.
3. `asm-003.txt:7-25` + `asm-004.txt:1-19`: **re-read** flags after native call, right-to-left four-word call, byte countdown branch with unsigned JBE.
4. `asm-004.txt:20-25` + `asm-005.txt:1-7`: unconditional 501B60/501230 before independent bit-8 and bit-4 gates.
5. `asm-006.txt:1-25`: six signed camera reads and delayed 0x20-byte cleanup; WORD stores, not DWORD clears.
6. `asm-007.txt:1-25` + `asm-008.txt:1-2`: zero test of DWORD 1CFF834 controls 13-word call; no inferred overall-function pause exit.
7. `asm-008.txt:3-25` + `asm-009.txt:1-6`, `bytes-002.txt:3-6`: 0x80 packet-span branch and exact final stores/return.
8. `metadata.json:161-191`: direct-call xrefs 47D63D/47D6C5/47D707/47D811 in 47CCB0; 47D905 in 47D900 is exported jump type19, not a fifth direct call.

## Unknowns / validation not executed

- No callee bodies, callback set, all global storage bounds, original C signatures or complete type definitions were supplied. The opaque native boundary is intentional, not an invented implementation. Stage-list meaning, return-value meanings, camera contracts, and historical rendering/audio labels are not newly proven by these chunks alone.
- Native integer/stack semantics are modeled, but evaluator memory and native-call backends are intentionally not provided or tested. This is not a standalone host-executable replacement for FF8. A lead wanting a linked replacement must supply the actual boundary/ABI bindings; do not silently convert all opaque destinations to guessed prototypes.
- Atomicity/concurrency, processor-specific undefined EFLAGS, exceptions and nonreturning callee behavior require the real execution environment. Calls may fault or not return; no recovery guards were inserted.
- All coverage/byte checks reported above are manual static inspection. **No compilation, execution, differential test, IDB modification or live validation was performed.** Requested lead validation: compile this translation unit in the chosen evaluator harness; differential-check call stack snapshots/partial registers/global read-write traces across gate outcomes and callback mutations, including non-0/1 indices, full-EAX-versus-AL return disagreement, and signed WORD extremes.
