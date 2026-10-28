# Independent C B — 0x493840

## Input and scope

Author: c-b-493840. Only the provided g07 compaction, target manifest, all eight ASM slices, both byte slices, metadata, and original target packet were read for this production. No other production/classification was consulted.

- Original packet SHA256, as cited by manifest: `6df9af35d2257f0c169ad31fd7bbc4eb2db1e9d0d8f1192469ff89d17cb89704`.
- Common compaction SHA256, as cited by manifest: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
- Native EXE SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; 32-bit export `2026-10-11T16:38:25.140966+00:00`.
- Complete chunk `[0x493840,0x493AE3)`, 675 bytes, 190 instructions, 26 CFG blocks. The original packet is authoritative; manifest hashes are cited, not independently recomputed here.

## Representation / ABI boundary

This is complete **machine-state C**, not an invented typed native callee signature. Entry state includes the original native stack: return address at ESP, slot at ESP+4, second input at ESP+8 (read as BYTE or WORD, never assumed a signed C int), and third input DWORD at ESP+12. EBX/EBP/ESI/EDI are saved on the actual modeled stack and restored. Native RET consumes only its return address; caller owns arguments.

Every native call is an opaque address-based bridge. `enter_call` below performs the actual PUSH of its return address, sets the destination EIP, and hands the full state to the bridge. The bridge must execute that native callee through its return, preserving all real register, flag, stack, memory, and extended-architecture effects. It does **not** automatically pop arguments, assign invented returns, or promise a prototype. The ten supplied destinations are the only native callees used. The bridge interface is a modeling dependency, not an additional EXE call or reconstructed implementation.

Memory operations retain their native access width and order, including each separate DWORD read/modify/write of the two-word flag region. The bus must provide little-endian x86 reads/writes and aliasing across widths; addresses are modular uint32_t, not host pointers. Its callbacks must not independently mutate CPU registers/flags. They can model memory side effects. No bounds, null guards, inferred struct extents, or host-library operations are added. The translation covers normally completing native execution; fault restart/exception delivery and per-instruction exception EIP are not modeled, and invalid addresses must not silently return fabricated values.

All LEA, ADD, SUB, and SHL arithmetic wraps at 32 bits. All target branches are equality/zero tests, not signed comparisons. Partial AL/AX/CH/CL/DL writes preserve the other register bits. Defined arithmetic flags are reproduced at call boundaries; `undefined_flags` explicitly records architecturally undefined AF/OF. No x87 instruction occurs in this chunk: extended state and the x87 control/environment must be retained and passed through the opaque native bridge, with no synthesized reset or rounding behavior.

## Complete C

```c
#include <stdint.h>

typedef uint32_t u32;
typedef uint64_t u64;

typedef struct X86_493840 {
    u32 eax, ecx, edx, ebx, esp, ebp, esi, edi;
    u32 eip, eflags;
    u32 undefined_flags;
    void *extended_arch; /* opaque retained x87/SIMD/segment/environment state */
} X86_493840;

typedef struct Bus_493840 {
    void *opaque;
    u32 (*read)(void *, u32 address, unsigned width_bytes);
    void (*write)(void *, u32 address, unsigned width_bytes, u32 value);
    void (*run_native_until_return)(void *, X86_493840 *);
} Bus_493840;

enum {
    F_CF = 0x001, F_PF = 0x004, F_AF = 0x010,
    F_ZF = 0x040, F_SF = 0x080, F_OF = 0x800,
    F_ARITH = F_CF | F_PF | F_AF | F_ZF | F_SF | F_OF
};

static u32 mask_width(unsigned bits)
{
    return bits == 32 ? UINT32_C(0xffffffff) :
           bits == 16 ? UINT32_C(0xffff) : UINT32_C(0xff);
}

static u32 flags_pzs(u32 value, unsigned bits)
{
    u32 v = value & mask_width(bits);
    u32 p = v & 0xffu;
    p ^= p >> 4; p ^= p >> 2; p ^= p >> 1;
    return ((p & 1u) == 0 ? F_PF : 0) |
           (v == 0 ? F_ZF : 0) |
           ((v & (UINT32_C(1) << (bits - 1))) ? F_SF : 0);
}

/* AF is architecturally undefined after AND/OR/XOR/TEST. */
static u32 logic(X86_493840 *r, u32 value, unsigned bits)
{
    value &= mask_width(bits);
    r->eflags = (r->eflags & ~(u32)F_ARITH) | flags_pzs(value, bits);
    r->undefined_flags = (r->undefined_flags & ~(u32)F_ARITH) | F_AF;
    return value;
}

static u32 add32(X86_493840 *r, u32 a, u32 b)
{
    u32 v = a + b;
    r->eflags = (r->eflags & ~(u32)F_ARITH) | flags_pzs(v, 32) |
        (((u64)a + (u64)b > UINT32_C(0xffffffff)) ? F_CF : 0) |
        (((a ^ b ^ v) & 0x10u) ? F_AF : 0) |
        ((~(a ^ b) & (a ^ v) & UINT32_C(0x80000000)) ? F_OF : 0);
    r->undefined_flags &= ~(u32)F_ARITH;
    return v;
}

static u32 sub_width(X86_493840 *r, u32 a, u32 b, unsigned bits)
{
    u32 m = mask_width(bits), sign = UINT32_C(1) << (bits - 1);
    u32 v;
    a &= m; b &= m; v = (a - b) & m;
    r->eflags = (r->eflags & ~(u32)F_ARITH) | flags_pzs(v, bits) |
        (a < b ? F_CF : 0) |
        (((a ^ b ^ v) & 0x10u) ? F_AF : 0) |
        (((a ^ b) & (a ^ v) & sign) ? F_OF : 0);
    r->undefined_flags &= ~(u32)F_ARITH;
    return v;
}

/* All SHL instructions in this target have count 4; OF and AF undefined. */
static u32 shl4(X86_493840 *r, u32 a)
{
    u32 v = a << 4;
    r->eflags = (r->eflags & ~(u32)F_ARITH) | flags_pzs(v, 32) |
                (((a >> 28) & 1u) ? F_CF : 0);
    r->undefined_flags = (r->undefined_flags & ~(u32)F_ARITH) | F_AF | F_OF;
    return v;
}

static int zf(const X86_493840 *r) { return (r->eflags & F_ZF) != 0; }
static u32 rd(Bus_493840 *b, u32 a, unsigned n)
{
    return b->read(b->opaque, a, n) & mask_width(n * 8);
}
static void wr(Bus_493840 *b, u32 a, unsigned n, u32 v)
{
    b->write(b->opaque, a, n, v & mask_width(n * 8));
}
static void push(X86_493840 *r, Bus_493840 *b, u32 value)
{
    r->esp -= 4u; wr(b, r->esp, 4, value); /* PUSH does not set flags */
}
static u32 pop(X86_493840 *r, Bus_493840 *b)
{
    u32 value = rd(b, r->esp, 4); r->esp += 4u; return value;
}
static void enter_call(X86_493840 *r, Bus_493840 *b, u32 target, u32 next)
{
    push(r, b, next); r->eip = target;
    b->run_native_until_return(b->opaque, r);
}

void ff8_493840(X86_493840 *r, Bus_493840 *b)
{
    /* 493840..493859: exact entry stack loads */
    push(r, b, r->ebx);
    r->ebx = rd(b, r->esp + 0x10u, 4);
    push(r, b, r->ebp);
    r->ebp = logic(r, r->ebp ^ r->ebp, 32);
    push(r, b, r->esi);
    r->esi = rd(b, r->esp + 0x10u, 4);
    (void)logic(r, r->ebx & UINT32_C(0x80000000), 32);
    push(r, b, r->edi);
    if (zf(r)) goto L4938DA;

    /* 49385A..493880: stride 0x1D0, WORD comparison, BYTE test */
    r->eax = r->esi * 8u;
    r->eax = sub_width(r, r->eax, r->esi, 32);
    r->ecx = r->esi + r->eax * 4u;
    r->ecx = shl4(r, r->ecx);
    (void)sub_width(r, rd(b, 0x01cff018u + r->ecx, 2), r->ebp, 16);
    if (zf(r)) goto L4938B0;
    (void)logic(r, rd(b, r->esp + 0x18u, 1) & 0x35u, 8);
    if (!zf(r)) goto L4938B0;
    (void)logic(r, r->ebx & 0x00014000u, 32);
    if (!zf(r)) goto L4938B0;

    /* 493881..49389D: flag DWORD, CH bit 2 (DWORD bit 10) */
    r->edx = r->esi + r->esi * 2u;
    (void)logic(r, (r->ebx & 0xffu) & 9u, 8);
    r->eax = r->esi + r->edx * 4u;
    if (zf(r)) goto L49389E;
    r->eax = shl4(r, r->eax);
    r->eax = 0x01d27b8cu + r->eax;
    r->ecx = rd(b, r->eax, 4);
    r->ecx = (r->ecx & 0xffff00ffu) |
             (logic(r, ((r->ecx >> 8) & 0xffu) | 4u, 8) << 8);
    wr(b, r->eax, 4, r->ecx);
    goto L4938DA;

L49389E:
    r->eax = shl4(r, r->eax);
    r->eax = 0x01d27b8cu + r->eax;
    r->ecx = rd(b, r->eax, 4);
    r->ecx = (r->ecx & 0xffff00ffu) |
             (logic(r, ((r->ecx >> 8) & 0xffu) & 0xfbu, 8) << 8);
    wr(b, r->eax, 4, r->ecx);
    goto L4938DA;

L4938B0:
    r->edx = r->esi + r->esi * 2u;
    r->eax = r->esi + r->edx * 4u;
    r->eax = shl4(r, r->eax);
    r->edi = rd(b, 0x01d27b18u + r->eax, 4);
    r->edi = logic(r, r->edi & 0x7fffffffu, 32);
    wr(b, 0x01d27b18u + r->eax, 4, r->edi);
    r->ecx = rd(b, 0x01d27b8cu + r->eax, 4);
    r->ecx = (r->ecx & 0xffff00ffu) |
             (logic(r, ((r->ecx >> 8) & 0xffu) & 0xfbu, 8) << 8);
    wr(b, 0x01d27b8cu + r->eax, 4, r->ecx);

L4938DA:
    (void)logic(r, rd(b, r->esp + 0x18u, 1) & 4u, 8);
    if (!zf(r)) goto L4938E6;
    (void)logic(r, (r->ebx & 0xffu) & 9u, 8);
    if (zf(r)) goto L493925;
L4938E6:
    push(r, b, r->esi);
    enter_call(r, b, 0x00484600u, 0x004938ecu);
    r->esp = add32(r, r->esp, 4u);
    (void)logic(r, r->eax & r->eax, 32);
    if (!zf(r)) goto L493925;
    (void)logic(r, r->ebx & 0x80000000u, 32);
    if (!zf(r)) goto L49398E;

    /* 4938FF..493924: two distinct DWORD RMWs; do not collapse */
    r->edx = r->esi + r->esi * 2u;
    r->eax = r->esi + r->edx * 4u;
    r->eax = shl4(r, r->eax);
    r->eax = 0x01d27b8cu + r->eax;
    r->ecx = rd(b, r->eax, 4);
    r->ecx = logic(r, r->ecx & 0xfffffff7u, 32);
    wr(b, r->eax, 4, r->ecx);
    r->edx = rd(b, r->eax, 4);
    r->edx = logic(r, r->edx & 0xfffffffbu, 32);
    wr(b, r->eax, 4, r->edx);
    push(r, b, r->esi);
    enter_call(r, b, 0x00485030u, 0x00493922u);
    r->esp = add32(r, r->esp, 4u);

L493925:
    (void)logic(r, r->ebx & 0x80000000u, 32);
    if (!zf(r)) goto L49398E;
    r->eax = (r->eax & 0xffffff00u) | rd(b, 0x01d28e30u + r->esi * 2u, 1);
    r->edx = (r->edx & 0xffffff00u) | rd(b, r->esp + 0x18u, 1);
    r->eax = (r->eax & 0xffffff00u) |
             logic(r, (r->eax ^ r->edx) & 0xffu, 8);
    (void)logic(r, (r->eax & 0xffu) & 0x20u, 8);
    if (!zf(r)) goto L49394F;
    r->ecx = rd(b, 0x01d28e38u + r->esi * 4u, 4);
    r->ecx = logic(r, r->ecx ^ r->ebx, 32);
    (void)logic(r, r->ecx & 0x02004000u, 32);
    if (zf(r)) goto L49398E;

L49394F:
    push(r, b, r->esi);
    enter_call(r, b, 0x00484600u, 0x00493955u);
    r->esp = add32(r, r->esp, 4u);
    (void)logic(r, r->eax & r->eax, 32);
    if (!zf(r)) goto L49398E;
    r->edx = logic(r, r->edx ^ r->edx, 32);
    r->edx = (r->edx & 0xffffff00u) | rd(b, 0x01d27b0fu, 1);
    (void)sub_width(r, r->esi, r->edx, 32);
    if (zf(r)) goto L49398E;
    /* 493968..49398D */
    r->eax = r->esi + r->esi * 2u;
    r->ecx = r->esi + r->eax * 4u;
    r->ecx = shl4(r, r->ecx);
    r->eax = 0x01d27b8cu + r->ecx;
    r->edx = rd(b, r->eax, 4);
    r->edx = logic(r, r->edx & 0xfffffff7u, 32);
    wr(b, r->eax, 4, r->edx);
    r->ecx = rd(b, r->eax, 4);
    r->ecx = logic(r, r->ecx & 0xfffffffbu, 32);
    wr(b, r->eax, 4, r->ecx);
    push(r, b, r->esi);
    enter_call(r, b, 0x00485030u, 0x0049398bu);
    r->esp = add32(r, r->esp, 4u);

L49398E:
    r->edx = r->esi + r->esi * 2u;
    r->edi = r->esi + r->edx * 4u;
    r->edi = shl4(r, r->edi);
    (void)logic(r, r->ebx & 0x00010000u, 32);
    r->eax = (r->eax & 0xffff0000u) | rd(b, 0x01d27b92u + r->edi, 2);
    wr(b, 0x01d28e30u + r->esi * 2u, 2, r->eax);
    r->ecx = rd(b, 0x01d27b1cu + r->edi, 4);
    wr(b, 0x01d28e38u + r->esi * 4u, 4, r->ecx);
    if (zf(r)) goto L493A38;

    /* 4939BB..493A37: argument words stay on stack until ADD ESP,14h */
    r->eax = rd(b, 0x01d27b18u + r->edi, 4);
    push(r, b, r->esi);
    r->eax = logic(r, r->eax & 0xfffeffffu, 32);
    wr(b, 0x01d27b18u + r->edi, 4, r->eax);
    enter_call(r, b, 0x00486c70u, 0x004939d2u);
    r->edx = rd(b, 0x01d27b8cu + r->edi, 4);
    r->edx = logic(r, r->edx & 0xfffffff7u, 32);
    wr(b, 0x01d27b8cu + r->edi, 4, r->edx);
    r->eax = rd(b, 0x01d27b8cu + r->edi, 4);
    r->eax = (r->eax & 0xffffff00u) | logic(r, (r->eax & 0xffu) & 0xfbu, 8);
    wr(b, 0x01d27b8cu + r->edi, 4, r->eax);
    push(r, b, r->esi);
    enter_call(r, b, 0x00485030u, 0x004939f5u);
    push(r, b, r->esi);
    enter_call(r, b, 0x00484640u, 0x004939fbu);
    wr(b, 0x01d27b24u + r->edi, 4, r->ebp);
    r->ecx = r->esi * 8u;
    r->ecx = sub_width(r, r->ecx, r->esi, 32);
    push(r, b, r->esi);
    r->edi = r->esi + r->ecx * 4u;
    r->edi = shl4(r, r->edi);
    wr(b, 0x01cff184u + r->edi, 4, r->ebp);
    enter_call(r, b, 0x0048c5c0u, 0x00493a1cu);
    wr(b, 0x01cff1c3u + r->edi, 1, 0xffu);
    /* No new pushes for these two calls: existing slot argument remains. */
    enter_call(r, b, 0x00485ff0u, 0x00493a28u);
    enter_call(r, b, 0x004a8460u, 0x00493a2du);
    push(r, b, r->esi);
    enter_call(r, b, 0x00497110u, 0x00493a33u);
    r->esp = add32(r, r->esp, 0x14u);
    goto L493A8C;

L493A38:
    (void)logic(r, rd(b, r->esp + 0x18u, 1) & 1u, 8);
    if (zf(r)) goto L493A8C;
    /* 493A3F..493A8B: three pushed slot arguments, delayed cleanup */
    r->edx = rd(b, 0x01d27b8cu + r->edi, 4);
    r->edx = logic(r, r->edx & 0xfffffff7u, 32);
    wr(b, 0x01d27b8cu + r->edi, 4, r->edx);
    r->eax = rd(b, 0x01d27b8cu + r->edi, 4);
    r->eax = (r->eax & 0xffffff00u) | logic(r, (r->eax & 0xffu) & 0xfbu, 8);
    wr(b, 0x01d27b8cu + r->edi, 4, r->eax);
    push(r, b, r->esi);
    enter_call(r, b, 0x00485030u, 0x00493a62u);
    push(r, b, r->esi);
    enter_call(r, b, 0x00484640u, 0x00493a68u);
    wr(b, 0x01d27b24u + r->edi, 4, r->ebp);
    r->ecx = r->esi * 8u;
    r->ecx = sub_width(r, r->ecx, r->esi, 32);
    push(r, b, r->esi);
    r->edx = r->esi + r->ecx * 4u;
    r->edx = shl4(r, r->edx);
    wr(b, 0x01cff184u + r->edx, 4, r->ebp);
    enter_call(r, b, 0x00485ec0u, 0x00493a89u);
    r->esp = add32(r, r->esp, 0x0cu);

L493A8C:
    r->eax = r->esi * 8u;
    r->ebx = logic(r, r->ebx & 0x030e7fffu, 32);
    r->eax = sub_width(r, r->eax, r->esi, 32);
    r->ecx = r->esi + r->eax * 4u;
    r->ecx = shl4(r, r->ecx);
    r->eax = 0x01cff000u + r->ecx;
    r->ecx = (r->ecx & 0xffff0000u) | rd(b, r->esp + 0x18u, 2);
    r->ecx = logic(r, r->ecx & 0x7fu, 32);
    push(r, b, r->eax);
    wr(b, r->eax + 0x1b2u, 2, r->ecx);
    wr(b, r->eax + 0x188u, 4, r->ebx);
    /* Re-read the written BYTE, preserving aliases/native order. */
    (void)logic(r, rd(b, r->eax + 0x1b2u, 1) & 0x10u, 8);
    if (zf(r)) goto L493AD5;
    push(r, b, 1u);
    enter_call(r, b, 0x00493af0u, 0x00493acdu);
    r->esp = add32(r, r->esp, 8u);
    r->edi = pop(r, b); r->esi = pop(r, b);
    r->ebp = pop(r, b); r->ebx = pop(r, b);
    r->eip = pop(r, b); /* RET @493AD4; EAX is opaque callee's exact EAX */
    return;

L493AD5:
    push(r, b, r->ebp);
    enter_call(r, b, 0x00493af0u, 0x00493adbu);
    r->esp = add32(r, r->esp, 8u);
    r->edi = pop(r, b); r->esi = pop(r, b);
    r->ebp = pop(r, b); r->ebx = pop(r, b);
    r->eip = pop(r, b); /* RET @493AE2 */
    return;
}
```

## Coverage and checks performed by inspection

All 26 frozen CFG blocks are represented: `493840`, `49385A`, `493872`, `493879`, `493881`, `49388C`, `49389E`, `4938B0`, `4938DA`, `4938E1`, `4938E6`, `4938F3`, `4938FF`, `493925`, `49392D`, `49393E`, `49394F`, `49395C`, `493968`, `49398E`, `4939BB`, `493A38`, `493A3F`, `493A8C`, `493AC6`, `493AD5`. Instruction/chunk coverage is 190/190 and one complete 675-byte chunk by inspection.

Instruction-specific fidelity anchors:

1. `493841` bytes `8B5C2410`, `493849` bytes `8B742410`, and `493872` bytes `F644241835`: original arguments are +12/+4/+8 after the respective saves, not the current apparent +16/+16/+24 native stack offsets. Code retains actual ESP-relative loads rather than immutable high-level copies.
2. `49385A..493869`: `(slot*8-slot)*4+slot`, then SHL4 = `0x1D0*slot` modulo 2^32; WORD compare is at **0x1CFF018**, not documented HP at +0x172. Surprising label `F_CHAR_ACTIVE_SUMMON_HP` is not substituted for this address.
3. `493897` OR **CH** 4, `4938A9/4938D1` AND **CH** FB: DWORD bit 0x400 changes. `4939E7/493A54` AND **AL** FB clears DWORD bit 4. All preceding/following memory accesses are DWORD, preserving adjacent +0x7E data.
4. `49393E..49394D`: cached DWORD XOR incoming EBX tested with literal **0x02004000** from bytes `F7C100400002`; symbolic `offset unk_2004000` is not a dereference.
5. `493997` TEST EBX,0x10000 precedes WORD load/copy and DWORD load/copy through `4939B2`; MOVs do not change ZF. Neither copy uses the incoming argument, nor does the final commit write incoming statuses to slot +0x80/+0x08.
6. `4939C1..493A33` retains five pushed slot DWORDs, including through the two calls with no fresh push. `493A5C..493A89` retains three. Final `493AAF..493ADB` pushes record pointer first, then literal 1 or EBP; ordinary cdecl order would present `(selector, record_pointer)` but a callee prototype is not asserted.
7. `493AA7` MOV **CX**, `[esp+18]`, followed by `493AAC` AND **ECX**,7F: upper ECX and input bits above 6 are discarded; WORD write at +1B2. `493A93` masks EBX with **0x030E7FFF**, DWORD write +188. Final BYTE test reads memory back; callee EAX passes through both epilogues.

The frozen metadata xrefs list call sites `47DB6C`, `47DC59`, `483613`, `493D01`, `493FF3`, `4940B5`; `493D01` has no owner function. Without caller instructions this does not establish caller types or business purpose.

## Role description / provisional naming, not a separate semantic verdict

A conservative provisional name is **BattleSlotStatus_SyncCachesAndCommitCharacterFlags**. Confidence is high for the numeric dataflow, moderate for the supplied contextual terms, and unresolved for individual callee purposes. Two independent naming supports are the explicit WORD/DWORD cached-copy writes at `49399D..4939B2`, and the distinct final masked WORD/DWORD character-record writes at `493AA7..493AB7`. The flag and ATB side effects at `49390E..49391A` and `4939FB/493A68` additionally exclude a pure accessor interpretation. Native labels alone were not used as proof. The C deliberately does not implement the comment claim “Doom+Zombie clears Doom/timer[10]”: any such work belongs to the opaque 493AF0 callee and is not visible here.

## Limits / requested validation

- Opaque native callee bodies, true typed prototypes, business return meanings, flags/extended-state effects, and invalid-slot behavior are absent. This is a complete target translation conditional on a faithful bus and native bridge, **not** an independently executable reimplementation of all callees. The bridge avoids making up prototypes; a direct high-level port needs independently validated callee contracts supplied by the lead.
- The local code has no x87 operations; called procedures may. No finite float/environment claim is made.
- No compilation, test execution, differential run, native injection, or hash computation was performed. Compilation and a differential harness checking memory widths/order, stack depth, partial registers, preserved registers, and callee-boundary state are requests to the authorized lead/reviewer, not PASS results.
