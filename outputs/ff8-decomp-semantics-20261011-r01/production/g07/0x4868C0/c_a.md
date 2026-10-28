# 0x4868C0 — independent C A

## Provenance and scope

- Original packet: `inputs/ff8-decomp-semantics-20261011-r01/g07/0x4868C0.json`, manifest SHA256 `bb4e83a4a9db291ee331f1ee5a7cc16c766b37c54fd76ea9a4c44bfdf0721f28`.
- Common compaction SHA256 `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
- Read the original packet, all four verbatim assembly slices (90 instructions), the complete byte slice, metadata, and manifest. Sole code chunk: `[0x4868C0,0x4869F4)`, 308 bytes; all 23 CFG blocks represented below.
- Authorized supplement: `inputs/ff8-decomp-semantics-20261011-r01/g07/supplemental-0x4868C0/dispatch-table.json`, read in full. Capture UTC `2026-10-11T18:56:05.486171+00:00`; table-byte SHA256 `eb34ae32d9265a121193b5677eba16a6adea53fb9a98b09446dc2695b138c722`. Its raw hex is `cc69480091694800cc694800a3694800d3694800`. The parent records IDB/PE equality and unchanged target bytes; these are parent-supplied validations, not tests performed by this author.
- Executable SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, 32-bit, original export UTC `2026-10-11T16:38:25.140966+00:00`.

## C representation contract

This is complete register-explicit C for the target, not a claim about an original source-level prototype. The three actual native callees have no frozen bodies/prototypes in this function packet. Consequently, their invocation uses a **native execution adapter**, not fabricated `void`/`int` declarations. Adapter functions below are modeling operations, not additional game calls or library calls.

`Mem` callbacks access the same flat 32-bit little-endian address space; 8/16/32 operations denote the native access widths, including unaligned accesses. Reads and writes are sequenced separately, allowing aliasing across all addresses. No independent C structure layouts, pointer-provenance assumptions, bounds checks, quantity clamps, or null guards are imposed. All target arithmetic uses unsigned fixed-width values. The flags helpers track defined arithmetic flags and mark logical-operation AF undefined. Other EFLAGS bits are retained. The `opaque_machine` state includes x87/SSE/segment/other external state: the target has no x87/SSE instructions and leaves that state to the actual callees.

Entry: `s->esp` points at the native return address, and the register values are those on target entry. There are no entry argument loads. Exit: the modeled `RET` consumes that return address. EBX/EBP/ESI/EDI are saved and restored through native stack memory. All EAX/ECX/EDX effects, including the final callee's return/clobbers, remain in `s`; no Boolean or integer source return type is asserted.

`execute_callee` runs the exact native target at `s->eip` until its return to the supplied continuation, updating registers, memory, flags, and external state. The adapter below has already pushed the return address. It must not fabricate a result or assume a callee's prototype. The call at `0x486903` has the pushed slot DWORD at callee-entry ESP+4, cleaned by this caller; the other two calls have no newly pushed arguments. There are exactly three native call sites, with destinations decoded from their E8 bytes.

The constant dispatch mapping is specialized to the authenticated, unchanged jump-table bytes. This is ordinary decompilation of immutable code/data, not support for runtime patching of the table. Synchronous memory faults, asynchronous interrupts and instruction-by-instruction EIP observation are outside this C execution model; EIP is meaningful at adapter boundaries and final return.

```c
#include <stdint.h>

typedef struct X86 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eip, flags, flags_known;
    void *opaque_machine;
} X86;

typedef struct Mem {
    void *ctx;
    uint8_t  (*r8)(void *, uint32_t);
    uint16_t (*r16)(void *, uint32_t);
    uint32_t (*r32)(void *, uint32_t);
    void (*w8)(void *, uint32_t, uint8_t);
    void (*w16)(void *, uint32_t, uint16_t);
    void (*w32)(void *, uint32_t, uint32_t);
    void (*execute_callee)(void *, X86 *, uint32_t continuation);
} Mem;

enum { CF = 1u, PF = 4u, AF = 16u, ZF = 64u,
       SF = 128u, OF = 2048u, ARITH = CF|PF|AF|ZF|SF|OF };

static uint32_t width_mask(unsigned w)
{
    return w == 32u ? UINT32_MAX : ((UINT32_C(1) << w) - 1u);
}

static uint32_t zsp(uint32_t r, unsigned w)
{
    uint32_t b = r & 255u, odd = 0u;
    unsigned i;
    for (i = 0; i != 8u; ++i) odd ^= (b >> i) & 1u;
    return (r == 0u ? ZF : 0u) |
           ((r & (UINT32_C(1) << (w - 1u))) ? SF : 0u) |
           (odd == 0u ? PF : 0u);
}

static uint32_t logic(X86 *s, uint32_t r, unsigned w)
{
    r &= width_mask(w);
    /* CF=OF=0, Z/S/P defined, AF undefined; other flags untouched. */
    s->flags = (s->flags & ~(uint32_t)ARITH) | zsp(r, w);
    s->flags_known = (s->flags_known & ~(uint32_t)AF) |
                     CF | PF | ZF | SF | OF;
    return r;
}

static uint32_t alu(X86 *s, uint32_t a, uint32_t b,
                    unsigned borrow, unsigned w, unsigned subtract)
{
    uint32_t mask = width_mask(w), sign = UINT32_C(1) << (w - 1u);
    uint32_t r, f;
    uint64_t wide;
    a &= mask;
    b &= mask;
    if (subtract) {
        wide = (uint64_t)a - (uint64_t)b - borrow;
        r = (uint32_t)wide & mask;
        f = ((uint64_t)a < (uint64_t)b + borrow ? CF : 0u) |
            (((a ^ b) & (a ^ r) & sign) ? OF : 0u);
    } else {
        wide = (uint64_t)a + b;
        r = (uint32_t)wide & mask;
        f = (wide > mask ? CF : 0u) |
            (((~(a ^ b)) & (a ^ r) & sign) ? OF : 0u);
    }
    f |= ((a ^ b ^ r) & 16u) | zsp(r, w);
    s->flags = (s->flags & ~(uint32_t)ARITH) | f;
    s->flags_known |= ARITH;
    return r;
}

static uint32_t add32(X86 *s, uint32_t a, uint32_t b)
{ return alu(s, a, b, 0u, 32u, 0u); }

static void cmp32(X86 *s, uint32_t a, uint32_t b)
{ (void)alu(s, a, b, 0u, 32u, 1u); }

static uint32_t incdec(X86 *s, uint32_t a, unsigned w, unsigned dec)
{
    uint32_t cf = s->flags & CF, known = s->flags_known & CF;
    uint32_t r = alu(s, a, 1u, 0u, w, dec);
    s->flags = (s->flags & ~(uint32_t)CF) | cf;
    s->flags_known = (s->flags_known & ~(uint32_t)CF) | known;
    return r;
}

static unsigned jl(const X86 *s)
{ return ((s->flags & SF) != 0u) != ((s->flags & OF) != 0u); }

static uint32_t lo8(uint32_t a, uint32_t b)
{ return (a & UINT32_C(0xFFFFFF00)) | (b & 255u); }

static uint32_t lo16(uint32_t a, uint32_t b)
{ return (a & UINT32_C(0xFFFF0000)) | (b & 65535u); }

static void push32(X86 *s, Mem *m, uint32_t v)
{
    s->esp -= 4u;                 /* PUSH changes no flags. */
    m->w32(m->ctx, s->esp, v);
}

static uint32_t pop32(X86 *s, Mem *m)
{
    uint32_t v = m->r32(m->ctx, s->esp);
    s->esp += 4u;                 /* POP changes no flags. */
    return v;
}

static void native_call(X86 *s, Mem *m, uint32_t target, uint32_t next)
{
    push32(s, m, next);
    s->eip = target;
    m->execute_callee(m->ctx, s, next);
}

void reconstruct_004868C0(X86 *s, Mem *m)
{
    uint32_t t, cf;

    /* 4868C0..4868D0 */
    push32(s, m, s->ebx);
    push32(s, m, s->ebp);
    push32(s, m, s->esi);
    push32(s, m, s->edi);
    s->edi = logic(s, 0u, 32u);
    s->ebp = UINT32_C(0x01CFF1B2);
    s->esi = UINT32_C(0x01D27B90);
    s->ebx = lo8(s->ebx, 255u);

L4868D2:
    t = m->r8(m->ctx, s->esi + 0x3Bu);
    (void)alu(s, t, s->ebx, 0u, 8u, 1u);
    if (s->flags & ZF) goto L486912;

    /* 4868D7..48690E. Preserve the reload after the native call. */
    s->eax = logic(s, 0u, 32u);
    push32(s, m, s->edi);
    s->eax = lo8(s->eax, m->r8(m->ctx, 0x01CFE74Cu + s->edi));
    s->ecx = s->eax + s->eax * 8u;
    s->edx = s->eax + s->ecx * 2u;
    s->ecx = lo16(s->ecx, m->r16(m->ctx, s->esi - 0x68u));
    t = m->r16(m->ctx, s->esi);
    t = logic(s, t & 0xFFDFu, 16u);
    m->w16(m->ctx, s->esi, (uint16_t)t);
    s->eax = 0x01CFE0E8u + s->edx * 8u;
    m->w16(m->ctx, s->eax, (uint16_t)s->ecx);
    s->ecx = lo16(s->ecx, m->r16(m->ctx, s->esi));
    m->w16(m->ctx, s->eax + 0x96u, (uint16_t)s->ecx);
    native_call(s, m, 0x00485EC0u, 0x00486908u);
    s->edx = lo16(s->edx, m->r16(m->ctx, s->esi));
    s->esp = add32(s, s->esp, 4u);
    m->w16(m->ctx, s->ebp, (uint16_t)s->edx);

L486912:
    s->esi = add32(s, s->esi, 0xD0u);
    s->edi = incdec(s, s->edi, 32u, 0u);
    s->ebp = add32(s, s->ebp, 0x1D0u);
    cmp32(s, s->esi, 0x01D27E00u);
    if (jl(s)) goto L4868D2;

    /* 486927 */
    s->edi = 0x01D28E78u;
L48692C:
    t = m->r8(m->ctx, s->edi + 1u);
    s->ebx = (t & 128u) ? (0xFFFFFF00u | t) : t; /* MOVSX */
    s->edx = logic(s, 0u, 32u);
    s->edx = lo8(s->edx, m->r8(m->ctx, s->edi));
    (void)logic(s, s->edx, 32u);                  /* TEST EDX,EDX */
    if (s->flags & ZF) goto L486972;

    /* 486938 */
    s->eax = 0x01CFE79Cu;
    s->esi = logic(s, 0u, 32u);
L48693F:
    s->ecx = logic(s, 0u, 32u);
    s->ecx = lo8(s->ecx, m->r8(m->ctx, s->eax));
    cmp32(s, s->ecx, s->edx);
    if (s->flags & ZF) goto L48696F;
    /* 486947 */
    s->eax = add32(s, s->eax, 2u);
    s->esi = incdec(s, s->esi, 32u, 0u);
    cmp32(s, s->esi, 0xC6u);
    if (jl(s)) goto L48693F;

    /* 486953 */
    s->eax = 0x01CFE79Cu;
    s->ecx = logic(s, 0u, 32u);
L48695A:
    t = m->r8(m->ctx, s->eax);
    (void)alu(s, t, 0u, 0u, 8u, 1u);
    if (s->flags & ZF) goto L48696D;
    /* 48695F */
    s->eax = add32(s, s->eax, 2u);
    s->ecx = incdec(s, s->ecx, 32u, 0u);
    cmp32(s, s->ecx, 0xC6u);
    if (jl(s)) goto L48695A;
    /* 48696B: exhausted both searches, no write. */
    goto L486972;

L48696D:
    m->w8(m->ctx, s->eax, (uint8_t)s->edx);
L48696F:
    m->w8(m->ctx, s->eax + 1u, (uint8_t)s->ebx);
L486972:
    s->edi = add32(s, s->edi, 5u);
    cmp32(s, s->edi, 0x01D28F18u);
    if (jl(s)) goto L48692C;

    /* 48697D..48698A. Decode DEC before unsigned JA. */
    s->eax = logic(s, 0u, 32u);
    s->eax = lo8(s->eax, m->r8(m->ctx, 0x01CFF6E7u));
    s->eax = incdec(s, s->eax, 32u, 1u);
    cmp32(s, s->eax, 4u);
    if ((s->flags & (CF | ZF)) == 0u) goto L4869DC;
    /* Frozen DWORDs at 4869F4; index 0 is input result 1. */
    switch (s->eax) {
    case 0u: goto L4869CC;
    case 1u: goto L486991;
    case 2u: goto L4869CC;
    case 3u: goto L4869A3;
    case 4u: goto L4869D3;
    }
    /* No other index survives unsigned JA. */

L486991:
    t = m->r16(m->ctx, 0x01CFE93Au);
    t = incdec(s, t, 16u, 0u);
    m->w16(m->ctx, 0x01CFE93Au, (uint16_t)t);
    m->w16(m->ctx, 0x01CD8FC6u, 5u);
    goto L4869DC;

L4869A3:
    s->edx = lo8(s->edx, m->r8(m->ctx, 0x01D287DDu));
    s->ebx = m->r32(m->ctx, 0x01CFE934u);
    t = logic(s, (s->edx & 255u) & 0x10u, 8u);
    s->edx = lo8(s->edx, t);
    s->ebx = incdec(s, s->ebx, 32u, 0u);
    t = alu(s, 0u, s->edx, 0u, 8u, 1u);          /* NEG DL */
    s->edx = lo8(s->edx, t);
    cf = (s->flags & CF) != 0u;
    s->edx = alu(s, s->edx, s->edx, cf, 32u, 1u); /* SBB EDX,EDX */
    m->w32(m->ctx, 0x01CFE934u, s->ebx);
    s->edx = logic(s, s->edx & 0x5Fu, 32u);
    s->edx = add32(s, s->edx, 5u);
    m->w16(m->ctx, 0x01CD8FC6u, (uint16_t)s->edx);
    goto L4869DC;

L4869CC:
    t = m->r16(m->ctx, 0x01CFE938u);
    t = incdec(s, t, 16u, 0u);
    m->w16(m->ctx, 0x01CFE938u, (uint16_t)t);
L4869D3:
    m->w16(m->ctx, 0x01CD8FC6u, 0x64u);

L4869DC:
    native_call(s, m, 0x0046B440u, 0x004869E1u);
    m->w16(m->ctx, 0x01CDBFE0u, 0u);
    native_call(s, m, 0x004A92F0u, 0x004869EFu);
    s->edi = pop32(s, m);
    s->esi = pop32(s, m);
    s->ebp = pop32(s, m);
    s->ebx = pop32(s, m);
    s->eip = pop32(s, m);                         /* RET, not RET n */
}
```

## Instruction-level audit / risks

1. **Slot/record arithmetic and alias order:** `4868DA..4868EF` zero-extends the party byte, calculates `19*id`, then `0x1CFE0E8 + 152*id`. There is no ID-range check. The WORD at `[ESI-0x68]` is captured before ANDing WORD `[ESI]` with `0xFFDF`; the two record stores follow that AND. WORD `[ESI]` is reloaded after `CALL 485EC0` before storing through EBP (`486908..48690E`). Do not reuse the pre-call status value.
2. **Skip, strides, widths:** BYTE `[ESI+0x3B]==0xFF` skips the entire body. `486912..486925` uses stride `0xD0`, EBP stride `0x1D0`, and signed JL against `0x1D27E00`. With ordinary callee ABI preservation this is three slots, not the documented logical eleven-slot extent. There is no target stack-local allocation beyond saved registers, pushed slot, and return addresses.
3. **Two-stage scan:** `48692C` reads/sign-extends quantity even when the following ID is zero. `48693F..486969` first searches 198 two-byte records for matching zero-extended ID, then separately searches 198 for a zero ID. Existing record: quantity only. New record: ID then quantity. Both full: no write. `486972..48697B` advances the five-byte input record to exclusive `0x1D28F18` (32 records). No queue clearing or quantity addition occurs in these instructions. The low-byte store preserves all 256 quantity bit patterns despite MOVSX.
4. **Resolved dispatch, independently from raw bytes:** `48697D..486988` zero-extends BYTE `0x1CFF6E7`, decrements modulo 2^32, and uses unsigned JA. Result 0 wraps to `FFFFFFFF` and defaults, as do results 6..255. Table little-endian DWORDs give result 1/3 → `4869CC`; result 2 → `486991`; result 4 → `4869A3`; result 5 → `4869D3`. Original comments were not sufficient; the separate authorized supplement resolves this prior uncertainty.
5. **Counters/mode:** result 2 increments WORD `0x1CFE93A` with modulo-65536 wrap and writes WORD mode 5. Results 1/3 increment WORD `0x1CFE938` then write WORD mode 100. Result 5 writes 100 without incrementing that counter. At `4869A3..4869C3`, the BYTE bit `0x10` determines NEG's carry; `SBB EDX,EDX` produces full DWORD zero or `FFFFFFFF`, not merely DL. DWORD `0x1CFE934` is incremented modulo 2^32 and stored before WORD mode, which becomes 5 when the bit is clear, 100 when set. Default does not store mode or any of these counters.
6. **Common tail and ABI:** bytes give `486903 → 485EC0`, `4869DC → 46B440`, `4869EA → 4A92F0`. The middle instruction sequence writes exactly WORD zero at `0x1CDBFE0` between the final two calls. The four saved registers are restored; final EAX is the last callee's output, not synthesized. Metadata records one direct caller at `47D4AF` in function `47CCB0`; this is not evidence for a source return type.

No semantic-name verdict is claimed in this C-only deliverable. Native labels, LIVE comments, and historical purpose descriptions remain hypotheses; the numeric memory effects above do not depend on them. Callee internals, external state effects, and source-level types/prototypes remain outside the supplied evidence. The execution adapter is deliberately explicit about that boundary, rather than pretending the three calls are effect-free or providing guessed declarations.

Validation performed: manual comparison of all supplied instruction lines and chunk bytes; manual little-endian table decoding and branch/width/stack audit. No compilation, execution, differential test, new IDB inspection, or independent hash computation was performed. Parent review should compile the model, bind it to real/native-equivalent callees, and compare traces including skipped slots, callback-modified status, full/duplicate inventory records, quantities `0x80..0xFF`, all result values, and wrapping counters. These are requested validations, not PASS claims.
