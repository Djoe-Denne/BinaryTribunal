# 0x493840 — independent C A

## Provenance and scope

- Author: c-a-493840, GPT-6 Astra; target only, independent A.
- Authoritative input: `inputs/ff8-decomp-semantics-20261011-r01/g07/0x493840.json`, manifest SHA-256 `6df9af35d2257f0c169ad31fd7bbc4eb2db1e9d0d8f1192469ff89d17cb89704`.
- Common compaction manifest SHA-256: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
- Executable SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; export 2026-10-11T16:38:25.140966+00:00.
- Read original packet, manifest, all eight verbatim ASM slices, both byte slices, metadata and common compaction. Hashes above are **cited manifest values**, not independently recomputed.
- Coverage: all 190 instructions, all 26 CFG blocks, sole half-open chunk `[0x493840,0x493AE3)` (675 bytes), including both returns and all 16 call sites. No other author, classifier or semantic output read.

## Representation and ABI contract

The complete C below is an **ABI-explicit address-space lift**, not a guessed native C prototype or an executable replacement wrapper. Its memory and native-call adapter interfaces are modeling infrastructure, not additional game/library calls. They make the unresolved callee contracts explicit rather than inventing ten C prototypes. All game calls use only actual E8 destinations. The adapter must execute the specified existing function to its return, updating registers, memory and the external machine environment. It must implement the real callee, not a guessed stub. Integration belongs to the lead.

Entry `ESP=S`: `[S]` return address, `[S+4]` 32-bit slot/index bits, `[S+8]` second stack argument (only byte/word accesses here), `[S+12]` third argument (DWORD). Four pushes save EBX/EBP/ESI/EDI; the arguments are not copied into invented narrower ABI slots. EBX and ESI retain the third and first arguments across ordinary cdecl calls. At the last call the stack arguments are `(0 or 1, address of F_CHAR row)`, **not the reverse**. Plain RET leaves the caller's three argument slots untouched. No source-level return meaning is established; EAX after the last call survives to the caller. The model preserves that result, as well as stack residue and saved-register restoration.

The callback memory space is one shared little-endian, 32-bit-addressed space for globals, rows and stack. Width is supplied explicitly; an adapter must not split a DWORD access into invented independent volatile byte accesses. This avoids host pointer truncation, strict-aliasing, alignment and signed-overflow UB. All address and arithmetic operations use unsigned 32-bit wrap. There are no slot bounds checks in the native function and none here. Native access faults are the adapter's responsibility; this code adds no validation/fault recovery.

The register lift keeps AL/AX/DL/CX/CH operations explicit. Defined arithmetic flags are modeled, including flags carried through MOV/PUSH/LEA. Architecturally undefined AF/OF values after logical/shift operations are retained as one allowed choice, not asserted meaningful. No x87/SSE instruction occurs locally; `environment` is opaque and untouched locally, and the native-call adapter must carry its actual x87/control environment and all other nonlocal effects through the callees. External interruption/debug stepping and exact exception restart PCs are not modeled.

```c
#include <stdint.h>

typedef struct X493840 X493840;
struct X493840 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eip, eflags;
    void *environment; /* includes real external floating-point environment */
};

typedef struct {
    void *context;
    /* widths in bytes: 1, 2, 4; returned value is little-endian */
    uint32_t (*load)(void *, uint32_t address, unsigned width);
    void (*store)(void *, uint32_t address, unsigned width, uint32_t value);
    /* CALL has already pushed its return address. Execute actual EA to RET. */
    void (*native)(void *, X493840 *, uint32_t target);
} Bus493840;

enum { F_CF=1u, F_PF=4u, F_AF=16u, F_ZF=64u, F_SF=128u,
       F_OF=2048u };

static uint32_t lo8(uint32_t old, uint32_t x)
{ return (old & UINT32_C(0xffffff00)) | (x & UINT32_C(0xff)); }
static uint32_t lo16(uint32_t old, uint32_t x)
{ return (old & UINT32_C(0xffff0000)) | (x & UINT32_C(0xffff)); }
static uint32_t hi8(uint32_t old, uint32_t x)
{ return (old & UINT32_C(0xffff00ff)) | ((x & UINT32_C(0xff)) << 8); }

static void szp(X493840 *x, uint32_t v, unsigned bits)
{
    uint32_t p = v & 255u;
    uint32_t sign = UINT32_C(1) << (bits - 1u);
    if (bits != 32u) v &= (UINT32_C(1) << bits) - 1u;
    p ^= p >> 4; p ^= p >> 2; p ^= p >> 1;
    x->eflags = (x->eflags & ~(F_SF | F_ZF | F_PF))
              | ((v & sign) ? F_SF : 0u)
              | ((v == 0u) ? F_ZF : 0u)
              | (((p & 1u) == 0u) ? F_PF : 0u);
}
static uint32_t logic(X493840 *x, uint32_t v, unsigned bits)
{
    if (bits != 32u) v &= (UINT32_C(1) << bits) - 1u;
    x->eflags &= ~(F_CF | F_OF); /* AF undefined: leave representative value */
    szp(x, v, bits);
    return v;
}
static uint32_t plus32(X493840 *x, uint32_t a, uint32_t b)
{
    uint32_t r = a + b;
    x->eflags = (x->eflags & ~(F_CF | F_OF | F_AF))
        | ((r < a) ? F_CF : 0u)
        | (((~(a ^ b) & (a ^ r)) >> 31) ? F_OF : 0u)
        | (((a ^ b ^ r) & 16u) ? F_AF : 0u);
    szp(x, r, 32u);
    return r;
}
static uint32_t minus32(X493840 *x, uint32_t a, uint32_t b)
{
    uint32_t r = a - b;
    x->eflags = (x->eflags & ~(F_CF | F_OF | F_AF))
        | ((a < b) ? F_CF : 0u)
        | ((((a ^ b) & (a ^ r)) >> 31) ? F_OF : 0u)
        | (((a ^ b ^ r) & 16u) ? F_AF : 0u);
    szp(x, r, 32u);
    return r;
}
static void cmp16(X493840 *x, uint32_t a, uint32_t b)
{
    uint32_t r;
    a &= 65535u; b &= 65535u; r = (a - b) & 65535u;
    x->eflags = (x->eflags & ~(F_CF | F_OF | F_AF))
        | ((a < b) ? F_CF : 0u)
        | ((((a ^ b) & (a ^ r)) & 32768u) ? F_OF : 0u)
        | (((a ^ b ^ r) & 16u) ? F_AF : 0u);
    szp(x, r, 16u);
}
static uint32_t shl4(X493840 *x, uint32_t a)
{
    uint32_t r = a << 4;
    x->eflags = (x->eflags & ~F_CF) | (((a >> 28) & 1u) ? F_CF : 0u);
    szp(x, r, 32u); /* OF, AF undefined for this count */
    return r;
}
static uint32_t rd(const Bus493840 *b, uint32_t a, unsigned w)
{
    uint32_t v = b->load(b->context, a, w);
    return w == 1u ? v & 255u : w == 2u ? v & 65535u : v;
}
static void wr(const Bus493840 *b, uint32_t a, unsigned w, uint32_t v)
{
    if (w == 1u) v &= 255u;
    else if (w == 2u) v &= 65535u;
    b->store(b->context, a, w, v);
}
static void push32(X493840 *x, const Bus493840 *b, uint32_t v)
{ x->esp -= 4u; wr(b, x->esp, 4u, v); }
static uint32_t pop32(X493840 *x, const Bus493840 *b)
{ uint32_t v = rd(b, x->esp, 4u); x->esp += 4u; return v; }
static void call_native(X493840 *x, const Bus493840 *b,
                        uint32_t target, uint32_t next)
{
    push32(x, b, next);
    x->eip = target;
    b->native(b->context, x, target);
    /* Native callback includes the actual callee RET, not caller ADD ESP. */
}

void lift_00493840(X493840 *x, const Bus493840 *b)
{
#define R8(a)   rd(b, (uint32_t)(a), 1u)
#define R16(a)  rd(b, (uint32_t)(a), 2u)
#define R32(a)  rd(b, (uint32_t)(a), 4u)
#define W8(a,v)  wr(b, (uint32_t)(a), 1u, (v))
#define W16(a,v) wr(b, (uint32_t)(a), 2u, (v))
#define W32(a,v) wr(b, (uint32_t)(a), 4u, (v))
#define TEST(v,m,n) ((void)logic(x, (v) & (m), (n)))
#define Z() ((x->eflags & F_ZF) != 0u)
#define PUSH(v) push32(x, b, (v))
#define CALL(t,r) call_native(x, b, (t), (r))
#define DROP(n) (x->esp = plus32(x, x->esp, (n)))

    /* 493840..493854 */
    PUSH(x->ebx);
    x->ebx = R32(x->esp + 0x10u);
    PUSH(x->ebp);
    x->ebp = logic(x, x->ebp ^ x->ebp, 32u);
    PUSH(x->esi);
    x->esi = R32(x->esp + 0x10u);
    TEST(x->ebx, 0x80000000u, 32u);
    PUSH(x->edi);
    if (Z()) goto L4938DA;

    /* 49385A..493870: 0x1D0 * index, modulo 2^32 */
    x->eax = x->esi * 8u;
    x->eax = minus32(x, x->eax, x->esi);
    x->ecx = x->esi + x->eax * 4u;
    x->ecx = shl4(x, x->ecx);
    cmp16(x, R16(0x01CFF018u + x->ecx), x->ebp);
    if (Z()) goto L4938B0;
    /* 493872..49387F */
    TEST(R8(x->esp + 0x18u), 0x35u, 8u);
    if (!Z()) goto L4938B0;
    TEST(x->ebx, 0x00014000u, 32u);
    if (!Z()) goto L4938B0;
    /* 493881..49389C */
    x->edx = x->esi + x->esi * 2u;
    TEST(x->ebx, 9u, 8u);
    x->eax = x->esi + x->edx * 4u;
    if (Z()) goto L49389E;
    x->eax = shl4(x, x->eax);
    x->eax += 0x01D27B8Cu;
    x->ecx = R32(x->eax);
    x->ecx = hi8(x->ecx, logic(x, (x->ecx >> 8) | 4u, 8u));
    W32(x->eax, x->ecx);
    goto L4938DA;

L49389E:
    x->eax = shl4(x, x->eax);
    x->eax += 0x01D27B8Cu;
    x->ecx = R32(x->eax);
    x->ecx = hi8(x->ecx, logic(x, (x->ecx >> 8) & 0xFBu, 8u));
    W32(x->eax, x->ecx);
    goto L4938DA;

L4938B0:
    x->edx = x->esi + x->esi * 2u;
    x->eax = x->esi + x->edx * 4u;
    x->eax = shl4(x, x->eax);
    x->edi = R32(0x01D27B18u + x->eax);
    x->edi = logic(x, x->edi & 0x7FFFFFFFu, 32u);
    W32(0x01D27B18u + x->eax, x->edi);
    x->ecx = R32(0x01D27B8Cu + x->eax);
    x->ecx = hi8(x->ecx, logic(x, (x->ecx >> 8) & 0xFBu, 8u));
    W32(0x01D27B8Cu + x->eax, x->ecx);

L4938DA:
    TEST(R8(x->esp + 0x18u), 4u, 8u);
    if (!Z()) goto L4938E6;
    TEST(x->ebx, 9u, 8u);
    if (Z()) goto L493925;
L4938E6:
    PUSH(x->esi);
    CALL(0x00484600u, 0x004938ECu);
    DROP(4u);
    TEST(x->eax, x->eax, 32u);
    if (!Z()) goto L493925;
    TEST(x->ebx, 0x80000000u, 32u);
    if (!Z()) goto L49398E;
    /* 4938FF..493922; two separate DWORD read/modify/write operations */
    x->edx = x->esi + x->esi * 2u;
    x->eax = x->esi + x->edx * 4u;
    x->eax = shl4(x, x->eax);
    x->eax += 0x01D27B8Cu;
    x->ecx = R32(x->eax);
    x->ecx = logic(x, x->ecx & 0xFFFFFFF7u, 32u);
    W32(x->eax, x->ecx);
    x->edx = R32(x->eax);
    x->edx = logic(x, x->edx & 0xFFFFFFFBu, 32u);
    W32(x->eax, x->edx);
    PUSH(x->esi);
    CALL(0x00485030u, 0x00493922u);
    DROP(4u);

L493925:
    TEST(x->ebx, 0x80000000u, 32u);
    if (!Z()) goto L49398E;
    x->eax = lo8(x->eax, R8(0x01D28E30u + x->esi * 2u));
    x->edx = lo8(x->edx, R8(x->esp + 0x18u));
    x->eax = lo8(x->eax, logic(x, x->eax ^ x->edx, 8u));
    TEST(x->eax, 0x20u, 8u);
    if (!Z()) goto L49394F;
    x->ecx = R32(0x01D28E38u + x->esi * 4u);
    x->ecx = logic(x, x->ecx ^ x->ebx, 32u);
    TEST(x->ecx, 0x02004000u, 32u);
    if (Z()) goto L49398E;

L49394F:
    PUSH(x->esi);
    CALL(0x00484600u, 0x00493955u);
    DROP(4u);
    TEST(x->eax, x->eax, 32u);
    if (!Z()) goto L49398E;
    x->edx = logic(x, x->edx ^ x->edx, 32u);
    x->edx = lo8(x->edx, R8(0x01D27B0Fu));
    (void)minus32(x, x->esi, x->edx);
    if (Z()) goto L49398E;
    /* 493968..49398B */
    x->eax = x->esi + x->esi * 2u;
    x->ecx = x->esi + x->eax * 4u;
    x->ecx = shl4(x, x->ecx);
    x->eax = 0x01D27B8Cu + x->ecx;
    x->edx = R32(x->eax);
    x->edx = logic(x, x->edx & 0xFFFFFFF7u, 32u);
    W32(x->eax, x->edx);
    x->ecx = R32(x->eax);
    x->ecx = logic(x, x->ecx & 0xFFFFFFFBu, 32u);
    W32(x->eax, x->ecx);
    PUSH(x->esi);
    CALL(0x00485030u, 0x0049398Bu);
    DROP(4u);

L49398E:
    x->edx = x->esi + x->esi * 2u;
    x->edi = x->esi + x->edx * 4u;
    x->edi = shl4(x, x->edi);
    TEST(x->ebx, 0x00010000u, 32u);
    x->eax = lo16(x->eax, R16(0x01D27B92u + x->edi));
    W16(0x01D28E30u + x->esi * 2u, x->eax);
    x->ecx = R32(0x01D27B1Cu + x->edi);
    W32(0x01D28E38u + x->esi * 4u, x->ecx);
    if (Z()) goto L493A38; /* MOVs above do not replace TEST's flags */

    /* 4939BB..493A36: keep the original deferred stack cleanups */
    x->eax = R32(0x01D27B18u + x->edi);
    PUSH(x->esi);
    x->eax = logic(x, x->eax & 0xFFFEFFFFu, 32u);
    W32(0x01D27B18u + x->edi, x->eax);
    CALL(0x00486C70u, 0x004939D2u);
    x->edx = R32(0x01D27B8Cu + x->edi);
    x->edx = logic(x, x->edx & 0xFFFFFFF7u, 32u);
    W32(0x01D27B8Cu + x->edi, x->edx);
    x->eax = R32(0x01D27B8Cu + x->edi);
    x->eax = lo8(x->eax, logic(x, x->eax & 0xFBu, 8u));
    W32(0x01D27B8Cu + x->edi, x->eax);
    PUSH(x->esi);
    CALL(0x00485030u, 0x004939F5u);
    PUSH(x->esi);
    CALL(0x00484640u, 0x004939FBu);
    W32(0x01D27B24u + x->edi, x->ebp);
    x->ecx = x->esi * 8u;
    x->ecx = minus32(x, x->ecx, x->esi);
    PUSH(x->esi);
    x->edi = x->esi + x->ecx * 4u;
    x->edi = shl4(x, x->edi);
    W32(0x01CFF184u + x->edi, x->ebp);
    CALL(0x0048C5C0u, 0x00493A1Cu);
    W8(0x01CFF1C3u + x->edi, 0xFFu);
    CALL(0x00485FF0u, 0x00493A28u);
    CALL(0x004A8460u, 0x00493A2Du);
    PUSH(x->esi);
    CALL(0x00497110u, 0x00493A33u);
    DROP(0x14u);
    goto L493A8C;

L493A38:
    TEST(R8(x->esp + 0x18u), 1u, 8u);
    if (Z()) goto L493A8C;
    /* 493A3F..493A89 */
    x->edx = R32(0x01D27B8Cu + x->edi);
    x->edx = logic(x, x->edx & 0xFFFFFFF7u, 32u);
    W32(0x01D27B8Cu + x->edi, x->edx);
    x->eax = R32(0x01D27B8Cu + x->edi);
    x->eax = lo8(x->eax, logic(x, x->eax & 0xFBu, 8u));
    W32(0x01D27B8Cu + x->edi, x->eax);
    PUSH(x->esi);
    CALL(0x00485030u, 0x00493A62u);
    PUSH(x->esi);
    CALL(0x00484640u, 0x00493A68u);
    W32(0x01D27B24u + x->edi, x->ebp);
    x->ecx = x->esi * 8u;
    x->ecx = minus32(x, x->ecx, x->esi);
    PUSH(x->esi);
    x->edx = x->esi + x->ecx * 4u;
    x->edx = shl4(x, x->edx);
    W32(0x01CFF184u + x->edx, x->ebp);
    CALL(0x00485EC0u, 0x00493A89u);
    DROP(0x0Cu);

L493A8C:
    x->eax = x->esi * 8u;
    x->ebx = logic(x, x->ebx & 0x030E7FFFu, 32u);
    x->eax = minus32(x, x->eax, x->esi);
    x->ecx = x->esi + x->eax * 4u;
    x->ecx = shl4(x, x->ecx);
    x->eax = 0x01CFF000u + x->ecx;
    x->ecx = lo16(x->ecx, R16(x->esp + 0x18u));
    x->ecx = logic(x, x->ecx & 0x7Fu, 32u);
    PUSH(x->eax);
    W16(x->eax + 0x1B2u, x->ecx);
    W32(x->eax + 0x188u, x->ebx);
    TEST(R8(x->eax + 0x1B2u), 0x10u, 8u);
    if (Z()) goto L493AD5;
    /* 493AC6..493AD4 */
    PUSH(1u);
    CALL(0x00493AF0u, 0x00493ACDu);
    DROP(8u);
    x->edi = pop32(x, b);
    x->esi = pop32(x, b);
    x->ebp = pop32(x, b);
    x->ebx = pop32(x, b);
    x->eip = pop32(x, b);
    return;

L493AD5:
    PUSH(x->ebp);
    CALL(0x00493AF0u, 0x00493ADBu);
    DROP(8u);
    x->edi = pop32(x, b);
    x->esi = pop32(x, b);
    x->ebp = pop32(x, b);
    x->ebx = pop32(x, b);
    x->eip = pop32(x, b);
    return;

#undef R8
#undef R16
#undef R32
#undef W8
#undef W16
#undef W32
#undef TEST
#undef Z
#undef PUSH
#undef CALL
#undef DROP
}
```

## Coverage and proof notes

References below are to `0x493840.readable/` under the input directory unless stated otherwise. Bytes, not symbolic comments, fix absolute addresses and call targets.

1. **Argument/stack identity:** `asm-001.txt:1–9`, bytes `538B5C2410...568B742410`: after one push, `[ESP+10h]` is original argument three; after three pushes the other `[ESP+10h]` is argument one. `asm-008.txt:1–15` has both four-pop/plain-RET exits. Neither a Boolean return nor a callee-pop entry convention is proved.
2. **Two row strides, different storage:** `49385A–493869` computes `(slot+(slot*8-slot)*4)<<4 = slot*0x1D0` and reads a WORD at `1CFF018+offset`; `493881–493895` computes `slot*0xD0` and accesses a DWORD at `1D27B8C+offset`. This independently supports “slot” and per-character row terminology, not any assumed array bound.
3. **Partial-register/width trap:** `493897 OR CH,4` changes mask `0x00000400`, not `4` of the full DWORD. `4938A9/4938D1 AND CH,FB` clears that same bit. `4939E7/493A54 AND AL,FB` clears mask `4` only, retaining EAX bits 8–31. All those writes are DWORD writes at slot+0x7C, spanning the adjacent WORD too. `493AA7 MOV CX` preserves high ECX until `493AAC AND ECX,7F` clears it. The lift keeps each of these distinctions.
4. **Input bits vs current memory must remain separate:** `4938B9–4938C5` clears memory bit `0x80000000` but leaves EBX unchanged; subsequent `4938F3/493925` still test the original third argument. `4939BB–4939C7` similarly clears memory bit `0x10000`, not the working EBX argument. No “repair” replaces either with a single unified status variable.
5. **Change-sensitive path and call gates:** `49392D–49394D` compares low-byte bit `0x20` against `1D28E30+2*slot`, then DWORD bits `0x02004000` against `1D28E38+4*slot`. The second DWORD read is skipped if the first test succeeds. `493950–493966` tests the full EAX result of `484600` and compares slot to zero-extended BYTE `1D27B0F` before clearing two flag bits and calling `485030`. Thus a full-EAX test, not an AL test, is required for the unknown callee.
6. **Copy direction and precedence:** `493997` tests EBX bit `0x10000`, then `49399D–4939B2` copies WORD slot+0x82 to `1D28E30+2*slot` and DWORD slot+0x0C to `1D28E38+4*slot`. MOVs preserve the TEST flags used by `4939B9`. The `0x10000` branch takes precedence over the second argument's bit-1 branch at `493A38`. That path calls `486C70,485030,484640,48C5C0,485FF0,4A8460,497110` in exactly that order. It sets BYTE `1CFF1C3+0x1D0*slot` only after `48C5C0` returns. Native five pending argument pushes are removed together at `493A33`; the alternate branch has three pending pushes removed at `493A89`.
7. **Final destination and native reread:** `493A8C–493AB7` stores `(second-argument WORD & 0x7F)` at character-row+0x1B2 and `(third-argument & 0x030E7FFF)` at character-row+0x188. These are not blanket writes to the slot's status fields. `493ABD` rereads destination BYTE after both stores (retained for alias/order fidelity), then `493AC6/493AD5` selects the first pushed argument for `493AF0`. Pointer push occurs **before** the two stores at `493AB0/493AB7`, also retained.
8. **Independent call-site inventory:** metadata `xrefs_to` gives code references at `47DB6C,47DC59,483613,493D01,493FF3,4940B5`; the `493D01` owner is null. This proves use sites, not their semantics. All ten unique E8 targets in metadata are represented, including both `493AF0` calls.

CFG coverage by start address: `493840,49385A,493872,493879,493881,49388C,49389E,4938B0,4938DA,4938E1,4938E6,4938F3,4938FF,493925,49392D,49393E,49394F,49395C,493968,49398E,4939BB,493A38,493A3F,493A8C,493AC6,493AD5`. Straight-line fallthrough blocks are represented inline; label names mark nontrivial join/branch targets. Sole chunk and both epilogues covered; no jump table or secondary chunk is missing for this EA.

## Functional contract, hypotheses and remaining risks

Conservative descriptive candidate: **`BattleStatus_RefreshSlotEffectsAndCharacterStatus`**. This is not an integration rename. “Slot effects” is supported by the independent `0xD0` indexing and repeated flag/ATB writes plus cleanup call sequence; “character status” is supported independently by `0x1D0` indexing and the final two masked writes. These name proofs come from instruction dataflow, not the existing IDA function label. Common-compaction lines 28–31 supply the historical battle/character layout association; the numerical memory effects themselves do not depend on those names.

The local contract is bit-driven synchronization and side effects followed by masked character-row writes, **not** an unconditional commit of both arguments into slot status fields. The state-copy source is the existing slot copy fields; the prior-value arrays are compared before being overwritten. Runtime row contents, stack/global aliasing and real callee effects remain inputs. No range, enum, allocation extent, return-value interpretation or call purity is inferred.

High confidence: local control flow, encoded addresses, widths, wrap, store/call order, distinct input vs memory bits, and stack balance. Conditional confidence: application-level status names, valid slot domain, formal return type and hidden callee behavior. Neither the entry comment's Doom/Zombie/timer claim nor the callees' annotated purposes is implemented as an extra operation. In particular, there is no local Doom timer update or invented library operation.

This deliverable supplies no replacement implementations for neighboring functions. The native-call adapter is deliberately necessary because their complete ABI/body evidence is absent; the preserved live register/stack state allows an integration harness to use real callees without guessing formal signatures. An ordinary C wrapper could only be produced after independently validating their contracts. The unsigned lift also does not pretend to prove a signed or unsigned source-level slot type: the observed indexing merely wraps 32-bit bits; there is no signed ordering test in this function.

Validation performed: manual source-to-ASM/bytes inspection and control-flow/stack/width accounting only. **Not executed:** compilation, static analyzer, unit tests, differential execution, runtime observation, hash recomputation or integration. Requested lead validation: compile the isolated C with a suitable adapter; differential-check both last-call branches, all earlier branch combinations and callback-visible register/stack state; include values causing address arithmetic wrap, CH versus AL bit-clears, repeated flag DWORD RMW, and callbacks modifying shared memory/second argument. No PASS is claimed for these requests.
