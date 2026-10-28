# C A — 0x485EC0

## Frozen input and scope

- Original packet SHA-256 (manifest citation): `50a28e8cec513ad24cf73574d698fa89d1877ea254fe333b0b6d761db3c711af`.
- Common compaction SHA-256 (manifest citation): `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
- Executable input SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; 32-bit; export `2026-10-11T16:38:25.140966+00:00`.
- Read the original packet and all three manifest-listed projections. Coverage: all 23 instructions, all 59 bytes of the sole chunk `[0x485EC0,0x485EFB)`, and all five CFG blocks. No sibling production or classifier was consulted.

## Complete C

This is a register/guest-memory C reconstruction, not an asserted native C prototype. The unresolved native call is represented by an explicit execution adapter. Its signature below is **a model interface**, not a claim about the prototype or return type at 0x486B40. This representation retains otherwise untyped residual EAX, including partial-register behavior, and permits the actual callee to alias the slot or stack memory.

```c
#include <stdint.h>

typedef struct X86_485EC0 {
    uint32_t eax, ecx, edx, ebx, esi, edi, ebp, esp;
    uint32_t eip, eflags;
} X86_485EC0;

enum {
    CF = 0x001u, PF = 0x004u, AF = 0x010u,
    ZF = 0x040u, SF = 0x080u, OF = 0x800u
};

/* Guest address a indexes a full 2^32-byte, little-endian RAM view.
   Addition of guest addresses always wraps modulo 2^32. */
static uint32_t rd32(volatile uint8_t *m, uint32_t a)
{
    uint32_t b0 = m[a];
    uint32_t b1 = m[(uint32_t)(a + 1u)];
    uint32_t b2 = m[(uint32_t)(a + 2u)];
    uint32_t b3 = m[(uint32_t)(a + 3u)];
    return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
}

static void wr32(volatile uint8_t *m, uint32_t a, uint32_t v)
{
    m[a] = (uint8_t)v;
    m[(uint32_t)(a + 1u)] = (uint8_t)(v >> 8);
    m[(uint32_t)(a + 2u)] = (uint8_t)(v >> 16);
    m[(uint32_t)(a + 3u)] = (uint8_t)(v >> 24);
}

static void push32(X86_485EC0 *r, volatile uint8_t *m, uint32_t v)
{
    r->esp = (uint32_t)(r->esp - 4u);
    wr32(m, r->esp, v);
}

static uint32_t pop32(X86_485EC0 *r, volatile uint8_t *m)
{
    uint32_t v = rd32(m, r->esp);
    r->esp = (uint32_t)(r->esp + 4u);
    return v;
}

static void szp(X86_485EC0 *r, uint32_t v, uint32_t sign)
{
    uint32_t p = v & 0xffu;
    p ^= p >> 4;
    p ^= p >> 2;
    p ^= p >> 1;
    r->eflags &= ~(uint32_t)(SF | ZF | PF);
    if (v == 0u) r->eflags |= ZF;
    if ((v & sign) != 0u) r->eflags |= SF;
    if ((p & 1u) == 0u) r->eflags |= PF;
}

static void logical_flags(X86_485EC0 *r, uint32_t v, uint32_t sign)
{
    r->eflags &= ~(uint32_t)(CF | OF);
    szp(r, v, sign);
    /* AF is architecturally undefined; retaining its old bit is one
       permitted realization, not an assertion that hardware preserves it. */
}

static uint32_t add32(X86_485EC0 *r, uint32_t a, uint32_t b)
{
    uint32_t v = (uint32_t)(a + b);
    r->eflags &= ~(uint32_t)(CF | AF | OF);
    if (v < a) r->eflags |= CF;
    if (((a ^ b ^ v) & 0x10u) != 0u) r->eflags |= AF;
    if (((~(a ^ b) & (a ^ v)) & 0x80000000u) != 0u)
        r->eflags |= OF;
    szp(r, v, 0x80000000u);
    return v;
}

static void cmp32(X86_485EC0 *r, uint32_t a, uint32_t b)
{
    uint32_t v = (uint32_t)(a - b);
    r->eflags &= ~(uint32_t)(CF | AF | OF);
    if (a < b) r->eflags |= CF;
    if (((a ^ b ^ v) & 0x10u) != 0u) r->eflags |= AF;
    if ((((a ^ b) & (a ^ v)) & 0x80000000u) != 0u)
        r->eflags |= OF;
    szp(r, v, 0x80000000u);
}

/* Adapter contract: execute the ORIGINAL routine at guest EIP 0x486B40
   through its return to 0x485EEB, using these same registers and memory.
   CALL's return address has already been pushed. On adapter return, the
   native RET has already been performed. All resulting registers, flags,
   memory and ESP must be supplied, without synthesizing a return value.
   This is the sole unresolved native call, not a replacement algorithm. */
typedef void (*RunNative486B40)(X86_485EC0 *, volatile uint8_t *);

static void fn_485EC0(X86_485EC0 *r, volatile uint8_t *m,
                     RunNative486B40 run_native_486B40)
{
    uint32_t old_edx, carry;

    /* 485EC0..485ED7: original argument [entry ESP+4], saved ESI/EDI. */
    r->eax = rd32(m, (uint32_t)(r->esp + 4u));
    push32(r, m, r->esi);
    r->esi = 0u;
    logical_flags(r, r->esi, 0x80000000u);   /* XOR ESI,ESI */
    push32(r, m, r->edi);
    r->ecx = (uint32_t)(r->eax + r->eax * 2u);
    r->edx = (uint32_t)(r->eax + r->ecx * 4u);
    old_edx = r->edx;
    r->edx = (uint32_t)(old_edx << 4);
    r->eflags &= ~(uint32_t)CF;
    if ((old_edx & 0x10000000u) != 0u) r->eflags |= CF;
    szp(r, r->edx, 0x80000000u);
    /* SHL by 4 leaves OF and AF undefined; old bits are chosen here. */
    r->edi = (uint32_t)(0x01D27BC8u + r->edx);

loc_485ED7:
    /* MOV AL does NOT zero EAX[31:8]. */
    r->eax = (r->eax & 0xffffff00u)
           | (uint32_t)m[(uint32_t)(r->edi + r->esi)];
    logical_flags(r, r->eax & 0xffu, 0x80u); /* TEST AL,AL */
    if ((r->eax & 0xffu) == 0u) goto loc_485EF2;

    /* 485EDE..485EF2: zero-extended byte argument, call, THEN clear. */
    r->eax &= 0xffu;
    logical_flags(r, r->eax, 0x80000000u);
    push32(r, m, 0u);
    push32(r, m, r->eax);
    push32(r, m, 0x00485EEBu);              /* E8 55 0C 00 00 */
    r->eip = 0x00486B40u;
    run_native_486B40(r, m);
    r->esp = add32(r, r->esp, 8u);         /* caller removes two args */
    m[(uint32_t)(r->edi + r->esi)] = 0u;

loc_485EF2:
    carry = r->eflags & CF;                /* INC preserves CF */
    r->esi = add32(r, r->esi, 1u);
    r->eflags = (r->eflags & ~(uint32_t)CF) | carry;
    cmp32(r, r->esi, 2u);
    if (((r->eflags & SF) != 0u) != ((r->eflags & OF) != 0u))
        goto loc_485ED7;                   /* signed JL, not unsigned JB */

    /* 485EF8..485EFB: preserved register restore and plain RET. */
    r->edi = pop32(r, m);
    r->esi = pop32(r, m);
    r->eip = pop32(r, m);
}
```

## Instruction/ABI proof and interpretation limits

1. `485EC0` bytes `8B442404` load a DWORD at entry ESP+4. `485EC8/CB/CE` compute `(13 * argument) << 4`, i.e. stride `0xD0` with 32-bit wrap, not signed C multiplication. `485ED1` encodes the literal address `0x01D27BC8` (slot base +0xB8 per common compaction:29–30). No slot range check exists.
2. `485ED7` bytes `8A0437` load only AL. `485EDA/DC` skip the call and write when this byte is zero. `485EDE` bytes `25FF000000` erase the upper 24 bits before passing the nonzero byte value. They do not establish a return type.
3. `485EE3/E5` push zero, then the zero-extended byte; `485EE6` bytes `E8550C0000` resolve to `0x486B40`. On callee entry the first argument is at ESP+4 and the second is at ESP+8. `485EEB` removes eight bytes: cdecl-style caller cleanup at this site, without inventing a callee prototype or stock/count algorithm.
4. `485EEE` writes a BYTE zero **after** the callee returns. The next byte is loaded anew on the second iteration, so callee changes to either byte are observable. The model uses the same guest memory and rereads current ESI/EDI after the call, rather than adding an unsupported purity assumption.
5. `485EF2/F3/F6` increment ESI and use signed `JL` against 2. With normal preserved ESI/EDI this processes indices 0 and 1. `485EF8/F9/FA` restore saved EDI/ESI and perform plain RET, leaving the original argument on the caller's stack. Entry ESP minus 8 accounts for saved registers; peak extra call-site depth is 20 bytes below entry ESP, excluding the callee's own frame. Successful ordinary return ends at entry ESP+4.
6. Packet xrefs at lines 56–80 record call sites `485835`, `486903`, `486CB7`, `493A84`; these are provenance, not proof of business purpose. Native labels and historical comments are not used as callee semantics. Common compaction:62 explicitly flags conflicting historical item/magic/queue labels.

Under the ordinary preserved-register call ABI, both initially zero bytes leave residual EAX equal to `argument & 0xFFFFFF00`; a nonzero last byte leaves the callee's residual EAX; a last zero byte preserves the upper 24 bits of whatever EAX was immediately before that load. Consequently a guessed `void` or integer-return native prototype would hide uncertainty; the C above exposes it without claiming a source-level return contract. ECX/EDX are likewise caller-clobbered registers, not asserted outputs.

No x87/SSE instruction exists in this chunk. The adapter must preserve/report the actual callee's effects on unmodeled CPU state, including x87 environment if relevant; no x87 initialization or restoration is invented here. Ordinary RAM, valid readable/writable guest addresses, and normal completed memory operations are model preconditions; the byte-backed helpers are not an exception/atomicity/MMIO emulator. Undefined AF/OF choices are identified above, and no target branch depends on those undefined bits before a defining instruction. They must not be sold as bit-exact undefined-flag predictions.

## Validation status

Static byte/ASM/CFG cross-check performed against the supplied projections and original packet; no compilation, execution, live capture, or differential testing performed. Parent/reviewer should validate the native-call adapter, residual-EAX zero/nonzero combinations, aliasing (callee changes the second byte or stack), and wraparound address arithmetic. No output hash was computed; parent owns hashing and integration. No separate semantic-volet verdict is included.
