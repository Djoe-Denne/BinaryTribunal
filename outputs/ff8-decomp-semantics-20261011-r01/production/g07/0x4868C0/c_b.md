# Independent C B — 0x4868C0

## Evidence and scope

- Original packet: `inputs/ff8-decomp-semantics-20261011-r01/g07/0x4868C0.json`, SHA256 **bb4e83a4a9db291ee331f1ee5a7cc16c766b37c54fd76ea9a4c44bfdf0721f28** (manifest citation; not independently recomputed).
- Common factual compaction SHA256 **6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff** (manifest citation).
- Read all four verbatim ASM files, all ten byte-slice lines, metadata, manifest, and original packet. Original chunk `[0x4868C0,0x4869F4)` contains 308 bytes / 90 instructions. The long original JSON ASM line is presentation-truncated by the reader; the complete 90-line verbatim projection supplies its content.
- Additional parent-authorized evidence: `inputs/ff8-decomp-semantics-20261011-r01/g07/supplemental-0x4868C0/dispatch-table.json`, entire file, captured **2026-10-11T18:56:05.486171+00:00**. Its complete 20-byte hex is `cc69480091694800cc694800a3694800d3694800`; table SHA256 **eb34ae32d9265a121193b5677eba16a6adea53fb9a98b09446dc2695b138c722**. This is the JSON's verbatim byte representation; the companion binary was not separately read or hashed. Parent records table-IDB = authenticated PE and target chunks = original freeze; those are parent evidence, not tests performed here.
- Build: 32-bit FF8_EN.exe SHA256 **064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570**, native export **2026-10-11T16:38:25.140966+00:00**. Supplemental table VA `0x4869F4`, PE offset `0x869F4`.

Little-endian decoding gives indices 0..4 → `4869CC,486991,4869CC,4869A3,4869D3`. At `48697D–486988`, zero-extended result byte is decremented modulo 2^32 and compared **unsigned** to 4. Thus results 1/3 → 4869CC, 2 → 486991, 4 → 4869A3, 5 → 4869D3, and 0 or 6..255 → 4869DC. This follows bytes, not the IDA case comments.

## Complete C execution model

This is a register/stack-explicit C reconstruction, not a guessed high-level ABI for opaque callees. The original function has no explicit argument loads and ends in plain RET; its EAX return meaning is unproved. Three native call destinations are **0x485EC0**, **0x46B440**, and **0x4A92F0**. No library calls or semantic callee prototypes are introduced.

The adapter below is explicitly infrastructure, **not an original callee prototype**. `read` / `write` perform one little-endian memory access of the requested width (1, 2, or 4 bytes), in program order, at the supplied 32-bit VA. `execute_to` executes the actual opaque native callee, including its RET, until the specified return address is reached; it shares all memory, registers, flags and opaque machine environment. Therefore it does not invent callee effects, return types, preservation beyond what the callee actually does, or a library implementation. An integration harness must supply these adapters; no stub may silently pretend that callees are no-ops. Its initial memory image includes the authenticated five-DWORD dispatch table.

`other_machine_state` retains the x87/SSE environment and any other unlisted state. This target contains no x87/SSE instruction and never alters that environment directly; native callees can. Arithmetic helpers maintain the six integer arithmetic flags; logical AF is recorded undefined rather than invented. The model excludes asynchronous interruption and exact instruction-PC reporting on faults. Code and the authenticated supplemental dispatch table are assumed immutable during this invocation, as in a frozen-build C reconstruction. The DWORD table read is retained and the decoded destinations are resolved into control flow, not treated as a semantic result enum.

```c
#include <stdint.h>

typedef struct X86 X86;
struct X86 {
    uint32_t eax, ebx, ecx, edx, esi, edi, ebp, esp, eip;
    uint32_t eflags, flags_known;
    void *memory_context;
    void *other_machine_state;
    uint32_t (*read)(void *context, uint32_t va, unsigned width);
    void (*write)(void *context, uint32_t va, unsigned width, uint32_t value);
    void (*execute_to)(X86 *cpu, uint32_t resume_va);
};

enum {
    CF = 0x001, PF = 0x004, AF = 0x010,
    ZF = 0x040, SF = 0x080, OF = 0x800,
    ARITH = CF | PF | AF | ZF | SF | OF
};

static uint32_t lo8(uint32_t old, uint32_t value)
{ return (old & UINT32_C(0xFFFFFF00)) | (value & 0xFFu); }

static uint32_t lo16(uint32_t old, uint32_t value)
{ return (old & UINT32_C(0xFFFF0000)) | (value & 0xFFFFu); }

static uint32_t rd8(X86 *c, uint32_t a)
{ return c->read(c->memory_context, a, 1) & 0xFFu; }
static uint32_t rd16(X86 *c, uint32_t a)
{ return c->read(c->memory_context, a, 2) & 0xFFFFu; }
static uint32_t rd32(X86 *c, uint32_t a)
{ return c->read(c->memory_context, a, 4); }
static void wr8(X86 *c, uint32_t a, uint32_t v)
{ c->write(c->memory_context, a, 1, v & 0xFFu); }
static void wr16(X86 *c, uint32_t a, uint32_t v)
{ c->write(c->memory_context, a, 2, v & 0xFFFFu); }
static void wr32(X86 *c, uint32_t a, uint32_t v)
{ c->write(c->memory_context, a, 4, v); }

static uint32_t mask_for(unsigned bits)
{ return bits == 32 ? UINT32_MAX : ((UINT32_C(1) << bits) - 1u); }

static uint32_t parity_flag(uint32_t r)
{
    uint32_t p = r & 0xFFu;
    p ^= p >> 4; p ^= p >> 2; p ^= p >> 1;
    return (p & 1u) == 0 ? PF : 0u;
}

static void set_arith(X86 *c, uint32_t result, unsigned bits,
                      uint32_t carry, uint32_t aux, uint32_t overflow)
{
    uint32_t f = parity_flag(result);
    if (result == 0) f |= ZF;
    if (result & (UINT32_C(1) << (bits - 1))) f |= SF;
    if (carry) f |= CF;
    if (aux) f |= AF;
    if (overflow) f |= OF;
    c->eflags = (c->eflags & ~(uint32_t)ARITH) | f;
    c->flags_known |= ARITH;
}

static uint32_t add_flags(X86 *c, uint32_t a, uint32_t b, unsigned bits)
{
    uint32_t m = mask_for(bits), s = UINT32_C(1) << (bits - 1);
    uint64_t full;
    uint32_t r;
    a &= m; b &= m;
    full = (uint64_t)a + (uint64_t)b;
    r = (uint32_t)full & m;
    set_arith(c, r, bits, (uint32_t)(full >> bits),
              (a ^ b ^ r) & 0x10u, (~(a ^ b) & (a ^ r)) & s);
    return r;
}

static uint32_t sub_flags(X86 *c, uint32_t a, uint32_t b,
                         uint32_t borrow, unsigned bits)
{
    uint32_t m = mask_for(bits), s = UINT32_C(1) << (bits - 1), r;
    uint64_t rhs;
    a &= m; b &= m;
    rhs = (uint64_t)b + (uint64_t)borrow;
    r = (uint32_t)((uint64_t)a - rhs) & m;
    set_arith(c, r, bits, (uint64_t)a < rhs,
              (a ^ b ^ r) & 0x10u, ((a ^ b) & (a ^ r)) & s);
    return r;
}

static uint32_t logic_flags(X86 *c, uint32_t r, unsigned bits)
{
    r &= mask_for(bits);
    set_arith(c, r, bits, 0, 0, 0);
    c->flags_known &= ~(uint32_t)AF; /* AF undefined after XOR/AND/TEST. */
    return r;
}

static uint32_t inc_flags(X86 *c, uint32_t a, unsigned bits)
{
    uint32_t cf = c->eflags & CF, known_cf = c->flags_known & CF;
    uint32_t r = add_flags(c, a, 1, bits);
    c->eflags = (c->eflags & ~(uint32_t)CF) | cf;
    c->flags_known = (c->flags_known & ~(uint32_t)CF) | known_cf;
    return r;
}

static uint32_t dec_flags(X86 *c, uint32_t a, unsigned bits)
{
    uint32_t cf = c->eflags & CF, known_cf = c->flags_known & CF;
    uint32_t r = sub_flags(c, a, 1, 0, bits);
    c->eflags = (c->eflags & ~(uint32_t)CF) | cf;
    c->flags_known = (c->flags_known & ~(uint32_t)CF) | known_cf;
    return r;
}

static int zero_flag(const X86 *c) { return (c->eflags & ZF) != 0; }
static int signed_less(const X86 *c)
{ return ((c->eflags & SF) != 0) != ((c->eflags & OF) != 0); }
static int unsigned_above(const X86 *c)
{ return (c->eflags & (CF | ZF)) == 0; }

static void push32(X86 *c, uint32_t v)
{
    c->esp -= 4u; /* modulo 2^32 */
    wr32(c, c->esp, v);
}
static uint32_t pop32(X86 *c)
{
    uint32_t v = rd32(c, c->esp);
    c->esp += 4u;
    return v;
}
static void native_call(X86 *c, uint32_t target, uint32_t resume)
{
    push32(c, resume); /* CALL's return-address store; no flag change. */
    c->eip = target;
    c->execute_to(c, resume); /* Actual callee executes its own RET. */
}

/* Enter with the original caller's return address at [ESP].
   No host C parameter below is an argument of the native target. */
static void reconstruct_004868C0(X86 *c)
{
    uint32_t t;

    /* 4868C0–4868D0: preserve the actual entry register values on stack. */
    push32(c, c->ebx);
    push32(c, c->ebp);
    push32(c, c->esi);
    push32(c, c->edi);
    c->edi = logic_flags(c, c->edi ^ c->edi, 32);
    c->ebp = UINT32_C(0x01CFF1B2);
    c->esi = UINT32_C(0x01D27B90);
    c->ebx = lo8(c->ebx, 0xFFu);

L_4868D2:
    (void)sub_flags(c, rd8(c, c->esi + 0x3Bu), c->ebx & 0xFFu, 0, 8);
    if (zero_flag(c)) goto L_486912;

    /* 4868D7–48690E. LEA does NOT set flags. Compute EDX before CX overwrite. */
    c->eax = logic_flags(c, c->eax ^ c->eax, 32);
    push32(c, c->edi); /* sole explicitly supplied stack argument */
    c->eax = lo8(c->eax, rd8(c, UINT32_C(0x01CFE74C) + c->edi));
    c->ecx = c->eax + c->eax * 8u;
    c->edx = c->eax + c->ecx * 2u;
    c->ecx = lo16(c->ecx, rd16(c, c->esi - 0x68u));
    t = logic_flags(c, rd16(c, c->esi) & 0xFFDFu, 16);
    wr16(c, c->esi, t);
    c->eax = UINT32_C(0x01CFE0E8) + c->edx * 8u;
    wr16(c, c->eax, c->ecx);
    c->ecx = lo16(c->ecx, rd16(c, c->esi));
    wr16(c, c->eax + 0x96u, c->ecx);
    native_call(c, UINT32_C(0x00485EC0), UINT32_C(0x00486908));
    c->edx = lo16(c->edx, rd16(c, c->esi)); /* fresh post-call read */
    c->esp = add_flags(c, c->esp, 4, 32); /* cdecl caller cleanup */
    wr16(c, c->ebp, c->edx);

L_486912:
    c->esi = add_flags(c, c->esi, 0xD0u, 32);
    c->edi = inc_flags(c, c->edi, 32);
    c->ebp = add_flags(c, c->ebp, 0x1D0u, 32);
    (void)sub_flags(c, c->esi, UINT32_C(0x01D27E00), 0, 32);
    if (signed_less(c)) goto L_4868D2;
    c->edi = UINT32_C(0x01D28E78);

L_48692C:
    t = rd8(c, c->edi + 1u);
    c->ebx = (t & 0x80u) ? (t | UINT32_C(0xFFFFFF00)) : t; /* MOVSX */
    c->edx = logic_flags(c, c->edx ^ c->edx, 32);
    c->edx = lo8(c->edx, rd8(c, c->edi));
    (void)logic_flags(c, c->edx & c->edx, 32);
    if (zero_flag(c)) goto L_486972;
    c->eax = UINT32_C(0x01CFE79C);
    c->esi = logic_flags(c, c->esi ^ c->esi, 32);

L_48693F:
    c->ecx = logic_flags(c, c->ecx ^ c->ecx, 32);
    c->ecx = lo8(c->ecx, rd8(c, c->eax));
    (void)sub_flags(c, c->ecx, c->edx, 0, 32);
    if (zero_flag(c)) goto L_48696F;
    c->eax = add_flags(c, c->eax, 2, 32);
    c->esi = inc_flags(c, c->esi, 32);
    (void)sub_flags(c, c->esi, 0xC6u, 0, 32);
    if (signed_less(c)) goto L_48693F;
    c->eax = UINT32_C(0x01CFE79C);
    c->ecx = logic_flags(c, c->ecx ^ c->ecx, 32);

L_48695A:
    (void)sub_flags(c, rd8(c, c->eax), 0, 0, 8);
    if (zero_flag(c)) goto L_48696D;
    c->eax = add_flags(c, c->eax, 2, 32);
    c->ecx = inc_flags(c, c->ecx, 32);
    (void)sub_flags(c, c->ecx, 0xC6u, 0, 32);
    if (signed_less(c)) goto L_48695A;
    goto L_486972; /* full destination inventory: no write for this source row */

L_48696D:
    wr8(c, c->eax, c->edx);
L_48696F:
    wr8(c, c->eax + 1u, c->ebx); /* replace, not add/clamp; writes BL */
L_486972:
    c->edi = add_flags(c, c->edi, 5, 32);
    (void)sub_flags(c, c->edi, UINT32_C(0x01D28F18), 0, 32);
    if (signed_less(c)) goto L_48692C;

    /* 48697D–48698A; immutable table's five DWORDs resolved from raw bytes. */
    c->eax = logic_flags(c, c->eax ^ c->eax, 32);
    c->eax = lo8(c->eax, rd8(c, UINT32_C(0x01CFF6E7)));
    c->eax = dec_flags(c, c->eax, 32);
    (void)sub_flags(c, c->eax, 4, 0, 32);
    if (unsigned_above(c)) goto L_4869DC;
    t = rd32(c, UINT32_C(0x004869F4) + c->eax * 4u);
    c->eip = t;
    switch (t) {
        case UINT32_C(0x004869CC): goto L_4869CC;
        case UINT32_C(0x00486991): goto L_486991;
        case UINT32_C(0x004869A3): goto L_4869A3;
        case UINT32_C(0x004869D3): goto L_4869D3;
    }
    /* No extra native guard/default: JA proves index 0..4 and the frozen
       table proves exactly one of these four destinations. */

L_486991:
    t = inc_flags(c, rd16(c, UINT32_C(0x01CFE93A)), 16);
    wr16(c, UINT32_C(0x01CFE93A), t);
    wr16(c, UINT32_C(0x01CD8FC6), 5);
    goto L_4869DC;

L_4869A3:
    c->edx = lo8(c->edx, rd8(c, UINT32_C(0x01D287DD)));
    c->ebx = rd32(c, UINT32_C(0x01CFE934));
    c->edx = lo8(c->edx, logic_flags(c, (c->edx & 0xFFu) & 0x10u, 8));
    c->ebx = inc_flags(c, c->ebx, 32); /* INC preserves CF */
    t = sub_flags(c, 0, c->edx & 0xFFu, 0, 8); /* NEG DL */
    c->edx = lo8(c->edx, t);
    t = (c->eflags & CF) ? 1u : 0u;
    c->edx = sub_flags(c, c->edx, c->edx, t, 32); /* SBB EDX,EDX */
    wr32(c, UINT32_C(0x01CFE934), c->ebx);
    c->edx = logic_flags(c, c->edx & 0x5Fu, 32);
    c->edx = add_flags(c, c->edx, 5, 32);
    wr16(c, UINT32_C(0x01CD8FC6), c->edx);
    goto L_4869DC;

L_4869CC:
    t = inc_flags(c, rd16(c, UINT32_C(0x01CFE938)), 16);
    wr16(c, UINT32_C(0x01CFE938), t);
    /* Native fallthrough, NOT a separate case-5-only write. */
L_4869D3:
    wr16(c, UINT32_C(0x01CD8FC6), 0x64u);

L_4869DC:
    native_call(c, UINT32_C(0x0046B440), UINT32_C(0x004869E1));
    wr16(c, UINT32_C(0x01CDBFE0), 0);
    native_call(c, UINT32_C(0x004A92F0), UINT32_C(0x004869EF));
    c->edi = pop32(c);
    c->esi = pop32(c);
    c->ebp = pop32(c);
    c->ebx = pop32(c);
    c->eip = pop32(c); /* 4869F3 RET; no RET-immediate argument cleanup */
}
```

## Width, ordering, ABI, alias and arithmetic notes

- All VAs/arithmetic/pointers/registers are uint32_t modulo 2^32. LEAs multiply without modifying flags. There are **no native shift instructions** in this target; helper shifts only calculate flags. Signed JL uses SF≠OF, avoiding implementation-defined unsigned-to-signed conversion. All listed addresses are below 0x80000000; the raw branch signedness is nonetheless retained.
- `[ESI+0x3B]` is BYTE, not a signed character or a DWORD; comparison to BL=FF gates all work on that party row. Normal ABI-preserving callees leave EBX/EBP/ESI/EDI intact, but the model delegates actual callee execution rather than fabricating that behavior.
- SG party index is zero-extended with XOR EAX / MOV AL before stride **0x98**. EDX holds 19×index before CX is overwritten with HP. WORD stores, WORD AND FFDF and later WORD post-call read are ordered exactly. The status snapshot to save+96 happens **before** the refund call; F_CHAR+1B2 is read/stored **after** it. They must not be merged or hoisted across the call.
- Party pass has ESI stride D0 and EBP stride 1D0; three iterations under the documented cdecl-preserved registers. The sentinel-skipped path leaves corresponding records untouched. There is no extra validity/bounds guard for the party byte.
- The 32 source rows have stride 5; ID is zero-extended EDX while quantity is sign-extended EBX. Search examines up to 198 destination rows at stride 2. MOVSX is preserved even though final write uses BL. Existing quantity is **overwritten**; neither quantity addition, saturation, signed positivity test nor clearing of source rows exists. Destination order is first matching ID, otherwise first zero ID; no vacancy means skip. ID zero skips the source row even with nonzero quantity.
- Counter increments at 486991 and 4869CC are WORD (`66 FF 05`), wrap at 16 bits; 4869B2 increments DWORD EBX and 4869B7 stores DWORD. Mode and animation-state stores are WORD. Mode-branch EDX becomes 0 or FFFFFFFF via NEG-DL carry / SBB, then `(EDX & 0x5F)+5` = 5 or 100. Full EDX is overwritten by SBB; replacing only DL would be wrong.
- Native stack: four saved-register pushes = 16 bytes; conditional slot push = 4 bytes; each CALL additionally pushes its own 4-byte resume VA. The first explicit argument is caller-cleaned at 48690B. The last two calls supply no new explicit argument words; this is not proof of their C prototypes. Final POPs restore the entry registers from actual stack memory; RET pops caller continuation. EAX/ECX/EDX/flags after the last opaque callee are not fabricated as a Boolean/void scalar result. No local stack frame or ESP subtraction is present.
- Memory is accessed by numeric VA without incompatible C struct casts; no strict-aliasing assumption is made. Requested widths are explicit. No LOCK-prefixed operations, target x87 instructions, hidden library calls, invented clamps or blanket clears were added.

## Coverage and proofs

All 23 supplied CFG blocks and all 90 frozen instructions have representations above, including the rarely omitted 48696B full-inventory skip, 4869CC→4869D3 fallthrough, every result/default path, call cleanup and final RET. Table bytes supply the previously missing selector mapping; no additional target chunk is claimed.

1. `asm-001.txt:9–25` / VA 4868D2–48690E: sentinel gate; byte party lookup; 19×8 save stride; WORD HP/status persistence; raw E8 at 486903 resolves to 485EC0; post-call WORD read and cdecl cleanup.
2. `asm-002.txt:1–5` / VA 486912–486925: D0/1D0 advances and signed comparison to 1D27E00; defines the party pass's independent bound.
3. `asm-002.txt:7–25`, `asm-003.txt:1–10` / VA 48692C–48697B: MOVSX quantity, zero-extended ID, two separate C6-count scans, BYTE writes and five-byte source stride; proves persistence/merge behavior without assuming the IDA label's purpose.
4. `asm-003.txt:11–16` and supplemental JSON:4–7,12–32: raw unsigned guard plus independently decoded five selector DWORDs; completes all result routing.
5. `bytes-001.txt:7–10` / VA 486991–4869D3: operand-size prefixes prove WORD counters/mode; DWORD victory-counter load/store and NEG DL / SBB EDX prove flag-controlled 5-versus-100 mode selection. Results 1/3 increment the 16-bit counter and **fall through** to mode100; result5 reaches mode100 without that increment.
6. `asm-004.txt:8–15` / VA 4869DC–4869F3: unconditional raw calls to 46B440 then 4A92F0, separated by WORD animation-state=0; register pops and plain RET. `metadata.json:184–195` gives the direct caller at 47D4AF in 47CCB0 and the same three numeric callees; no caller business contract is inferred from names alone.

## C-role assessment / explicit unknowns

For description only, not a separate semantic-volet production: a plausible descriptive name is **Battle_PersistPartyAndItems_ThenExitByResult**. Two independent behavior proofs support the wording: (i) the bounded party HP/status transfers plus conditional 485EC0 call at 4868DA–48690E, and (ii) the separate inventory synchronization at 48692C–48697B followed by result-dependent global mode/counter updates at 48697D–4869D3. The party/inventory interpretation uses common-compaction:28–31's documented layouts, not the target's label. Structural confidence is high for frozen control, widths and writes; business names and opaque callee effects are not newly validated.

Unknowns remain: callee implementation/effects and exact C prototypes, numeric result meanings beyond the now-proved table mapping, return-value contract, complete save-record structure, why the bit20 status is cleared, and the business meaning of the two WORD counters. The model requires legitimate initial memory/stack and a faithful native-call adapter; it is not a standalone game replacement or proof that arbitrary inputs are safe. Native embedded LIVE/static comments were not accepted as fresh runtime evidence. No compile, execution, tests, differential run, IDB mutation or integration validation was performed. Parent must review/adapt the model, check native-call integration and execute any desired validation.
