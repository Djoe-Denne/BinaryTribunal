# 0x464850 — independent C B

## Input and boundary

Only the supplied g06 common compaction and complete readable projection were used for this production. Native packet SHA-256: `72f5e85aeda3168bd1cd97ff40d4407399a0fbbdd3d5589f58031f5fc9e7b087`; compaction SHA-256: `ded4edb4b1c6b48f28524bd123684cad1cf7bbc1743739420aa39f22a47309dc`. Manifest lists 119 ASM lines; all five ASM slices, the entire byte slice and metadata were read. One chunk `[0x464850,0x464997)`, 20 CFG blocks.

**Correction to contextual evidence, not to native code:** the load at `0x464918` is from **`0x1CAD694 + EDX`**, not `0x1CAD294 + EDX`. `asm-003.txt:22` and `bytes-001.txt:7` agree: `8B 82 94 D6 CA 01`. The compaction's `+8` gate assertion is incorrect; relative to the clear base `0x1CAD28C`, this gate is at `+0x408`. The C retains the actual instruction.

## Complete C

This is a portable register/linear-memory rendition, not a fabricated native prototype. It deliberately models the real stack so overwritten argument slots, aliasing with global writes, and incidental EAX are preserved. `read32`/`write32` are **representation primitives** for one x86 little-endian 32-bit memory access, including unaligned access, address wrapping and faults; they are not reconstructed FF8 callees or library calls. `native_call` is the unresolved bridge to the sole observed native callee `0x467550`. It receives the actual CPU and stack after CALL has pushed its return address; it must execute that callee through its RET (including any CPU/memory/DF/x87 effects). No body, return type or semantic contract for that callee is invented.

The routine enters with ESP pointing at its caller return address, four argument words at ESP+4/+8/+12/+16, and the real preserved-register values. It exits by consuming that return address. Machine addresses and all integer register arithmetic are `uint32_t`, modulo 2^32. Memory primitives must be synchronous and preserve access order and a shared address space; no disjointness of tables/stack is assumed. Host C stack allocation is not part of the modeled x86 memory.

```c
#include <stdint.h>

typedef struct X86CPU {
    uint32_t eax, ebx, ecx, edx, ebp, esi, edi, esp, eip;
    uint32_t df;             /* actual direction flag: zero or nonzero */
} X86CPU;

typedef struct X86Machine X86Machine;
struct X86Machine {
    X86CPU cpu;
    void *memory_context;
    uint32_t (*read32)(void *memory_context, uint32_t address);
    void (*write32)(void *memory_context, uint32_t address, uint32_t value);
    void (*native_call)(X86Machine *machine, uint32_t entry_address);
};

/* SAR without implementation-defined signed conversion/right shift. */
static uint32_t sar32(uint32_t x, unsigned n)
{
    return (x >> n) | ((x & UINT32_C(0x80000000))
           ? (UINT32_MAX << (32u - n)) : UINT32_C(0));
}

/* CMP/JG signed ordering without signed overflow or casts. */
static int signed_gt32(uint32_t a, uint32_t b)
{
    return (a ^ UINT32_C(0x80000000)) > (b ^ UINT32_C(0x80000000));
}

static void fn_00464850(X86Machine *m)
{
    X86CPU *r = &m->cpu;
    int gt;

#define R32(a) (m->read32(m->memory_context, (uint32_t)(a)))
#define W32(a,v) (m->write32(m->memory_context, (uint32_t)(a), (uint32_t)(v)))
#define PUSH32(v) do { r->esp -= UINT32_C(4); W32(r->esp, (v)); } while (0)
#define POP32(v) do { (v) = R32(r->esp); r->esp += UINT32_C(4); } while (0)

    /* 464850..464872: callee-saved registers and five pushed words. */
    PUSH32(r->ebx);
    r->ebx = R32(r->esp + UINT32_C(0x0c));
    PUSH32(r->ebp);
    r->ebp = R32(r->esp + UINT32_C(0x0c));
    PUSH32(r->esi);
    r->esi = R32(r->esp + UINT32_C(0x18));
    PUSH32(r->edi);
    r->edi = R32(r->esp + UINT32_C(0x20));
    PUSH32(UINT32_C(0x01cb6040));
    PUSH32(r->edi);
    PUSH32(r->esi);
    PUSH32(r->ebx);
    PUSH32(r->ebp);
    PUSH32(UINT32_C(0x00464872));
    r->eip = UINT32_C(0x00467550);
    m->native_call(m, UINT32_C(0x00467550));

    r->eax = r->ebp;
    r->esp += UINT32_C(0x14);
    r->edx = (r->eax & UINT32_C(0x80000000)) ? UINT32_MAX : 0u;
    r->edx &= UINT32_C(0x3f);
    r->eax += r->edx;
    r->ebp = r->eax;
    r->eax = r->ebx;
    r->edx = (r->eax & UINT32_C(0x80000000)) ? UINT32_MAX : 0u;
    r->edx &= UINT32_C(0xff);
    r->eax += r->edx;
    r->ecx = r->eax;

    /* 46488c..4648bd: CDQ/bias, signed SAR, overwritten argument slots. */
    r->eax = r->esi;
    r->edx = (r->eax & UINT32_C(0x80000000)) ? UINT32_MAX : 0u;
    r->edx &= UINT32_C(0x3f);
    r->eax += r->edx;
    r->esi = r->eax;
    r->eax = r->edi;
    r->edx = (r->eax & UINT32_C(0x80000000)) ? UINT32_MAX : 0u;
    r->edx &= UINT32_C(0xff);
    r->eax += r->edx;
    r->edi = r->eax;
    r->ecx = sar32(r->ecx, 8);
    r->edi = sar32(r->edi, 8);
    r->ebp = sar32(r->ebp, 6);
    r->esi = sar32(r->esi, 6);
    gt = signed_gt32(r->ecx, r->edi);
    W32(r->esp + UINT32_C(0x20), r->ebp);
    W32(r->esp + UINT32_C(0x14), r->ecx);
    W32(r->esp + UINT32_C(0x18), r->edi);
    if (gt) goto L464950;

    /* CFG 4648c3. */
    r->eax = r->edi;
    r->ebp = r->ecx;
    r->eax -= r->ecx;
    r->ebp <<= 4;
    ++r->eax;
    W32(r->esp + UINT32_C(0x1c), r->eax);

L4648D1:
    r->ebx = R32(r->esp + UINT32_C(0x20));
    if (signed_gt32(r->ebx, r->esi)) goto L464942;

L4648D9:
    r->eax = r->ebx + r->ebp;
    r->ecx = r->eax + r->eax * 4u;
    r->ecx = r->eax + r->ecx * 2u;
    r->ecx = r->ecx + r->ecx * 4u;
    r->edx = r->ecx + r->ecx * 4u;
    r->ecx = UINT32_C(0x01cb636c) + r->edx * 4u;
    r->edx = 3u;
L4648F4:
    W32(r->ecx, UINT32_MAX);
    r->ecx += UINT32_C(0x8980);
    --r->edx;
    if (r->edx != 0u) goto L4648F4;

    /* CFG 464903. */
    r->ecx = R32(UINT32_C(0x01ccfd90));
    if (r->ecx == 0u) goto L464935;
    /* CFG 46490d. */
    r->edx = r->eax + r->eax * 8u;
    r->edx <<= 3;
    r->edx -= r->eax;
    r->edx <<= 4;
    r->eax = R32(UINT32_C(0x01cad694) + r->edx);
    if (r->eax == 0u) goto L464935;
    /* CFG 464922: do NOT substitute a memset or invent CLD. */
    r->ecx = UINT32_C(0x100);
    r->eax = 0u;
    r->edi = UINT32_C(0x01cad28c) + r->edx;
    while (r->ecx != 0u) {
        W32(r->edi, r->eax);
        r->edi += (r->df != 0u) ? UINT32_C(0xfffffffc) : UINT32_C(4);
        --r->ecx;
    }
    r->edi = R32(r->esp + UINT32_C(0x18));

L464935:
    ++r->ebx;
    if (!signed_gt32(r->ebx, r->esi)) goto L4648D9;
    /* CFG 46493a: skipped when the inner range is empty. */
    r->ecx = R32(r->esp + UINT32_C(0x14));
    r->eax = R32(r->esp + UINT32_C(0x1c));
L464942:
    r->ebp += UINT32_C(0x10);
    --r->eax;
    W32(r->esp + UINT32_C(0x1c), r->eax);
    if (r->eax != 0u) goto L4648D1;
    /* CFG 46494c. */
    r->ebp = R32(r->esp + UINT32_C(0x20));

L464950:
    gt = signed_gt32(r->ecx, r->edi);
    r->ebx = r->ecx;
    if (gt) goto L464992;
    /* CFG 464956. */
    goto L46495C;
L464958:
    r->ebp = R32(r->esp + UINT32_C(0x20));
L46495C:
    r->eax = R32(r->esp + UINT32_C(0x20));
    r->ecx = r->ebp;
    if (signed_gt32(r->eax, r->esi)) goto L46498D;
    /* CFG 464966. */
    r->edx = r->ebx;
    r->edx <<= 4;
L46496B:
    r->eax = r->ecx;
    r->eax &= UINT32_C(0xfffffffe); /* AND AL,FE: upper 24 bits unchanged. */
    r->eax += r->edx;
    ++r->ecx;
    gt = signed_gt32(r->ecx, r->esi); /* flags survive the subsequent LEAs/MOV */
    r->ebp = r->eax + r->eax * 4u;
    r->eax = r->eax + r->ebp * 2u;
    r->eax = r->eax + r->eax * 4u;
    r->eax = r->eax + r->eax * 4u;
    W32(UINT32_C(0x01cbecec) + r->eax * 4u, UINT32_MAX);
    if (!gt) goto L46496B;
L46498D:
    ++r->ebx;
    if (!signed_gt32(r->ebx, r->edi)) goto L464958;
L464992:
    POP32(r->edi);
    POP32(r->esi);
    POP32(r->ebp);
    POP32(r->ebx);
    POP32(r->eip); /* RET: no callee cleanup of the four argument words. */

#undef POP32
#undef PUSH32
#undef W32
#undef R32
}
```

No signed C arithmetic is used. `sar32` is invoked only with 6 or 8. The native return is not defined as a Boolean or pointer: its incidental EAX, ECX and EDX remain in `cpu`. CPU flags other than DF are not exported by this C interface (cdecl does not promise arithmetic flags); every branch condition is nevertheless preserved. The saved comparison temporary specifically prevents MOV/LEA effects from replacing the native CMP condition. Fault/restart granularity is delegated to the memory/bridge model; this is not a cycle-accurate exception emulator.

## ABI, coverage and observable effects

- Entry save/read order is exact, including possible aliasing of input stack words. Four entry argument values are copied into EBX/EBP/ESI/EDI before the callee; no reread is substituted after the call. Actual callee push order is table pointer, arg3, arg2, arg1, arg0; argument view at its entry is arg0,arg1,arg2,arg3,table pointer. Cleanup is 20 bytes at `0x464874`. Outer function RET does not clean its four arguments.
- This routine has no x87/SSE instruction. No x87 precision/rounding environment is synthesized. An opaque `0x467550` may have effects not established by this packet; its real environment belongs to the bridge.
- `CDQ/AND/ADD/SAR` derives truncation-toward-zero division by 64 for entry args0/2 and by 256 for args1/3. Signed range checks are retained. No clamp, rectangle validation, allocation check, or unsigned comparison is added.
- First pass computes index `EBX + 16*EBP`, then offset `0x44c*index`, and performs three ordered 32-bit `0xffffffff` stores at base `0x1CB636C` with stride `0x8980`. Global gate is loaded freshly for every first-pass cell. Optional slot gate is at `0x1CAD694 + 0x470*index`; optional REP performs 256 32-bit zero stores from `0x1CAD28C + 0x470*index`, following actual DF. DF=0 gives the usual ascending 0x400-byte block; neither entry nor callee DF=0 is established by target opcodes alone. EDI is reloaded from the overwritten argument slot only on that REP path.
- Second pass retains `AND AL,FE` exactly: only bit 0 is cleared; it does not mask EAX to eight bits. Its index is `(ECX & 0xfffffffe) + 16*EBX`, producing the second table store at `0x1CBECEC + 0x44c*index`. Adjacent first-coordinate values can therefore repeat the same store. Duplicate writes are not elided.
- The empty-inner-range branch at `0x4648D7` bypasses the reload block `0x46493A`; this is preserved rather than recast as a generic nested-loop implementation. The first entry to `0x46495C` bypasses the EBP reload `0x464958`. Stack slots are reread at the exact instructions, including every outer iteration, so arbitrary aliasing does not silently change the rendition.
- All 20 metadata blocks are mapped: `464850,4648c3,4648d1,4648d9,4648f4,464903,46490d,464922,464935,46493a,464942,46494c,464950,464956,464958,46495c,464966,46496b,46498d,464992`. No extra target or tail chunk appears in metadata.

## Interpretation and uncertainty (not an independent semantic-volet result)

Suggested conservative descriptive name: `TextureRect_MarkSlotTablesAndClearOptionalCache`. High confidence in the exact write pattern; moderate confidence in texture/cache vocabulary from the frozen neighbourhood, not from the target label. Two independent supports for a marking/invalidation role are (1) triple `-1` table stores at `0x4648F4`, with a separate `-1` pass at `0x464980`, and (2) callers `0x45BDBA` / `0x45BE5D` in the supplied compaction notify destination inclusive bounds after CPU-buffer rectangle copies. Target itself contains no pixel-copy source load and no observed GPU upload call. The additional zeroing is gated; it is not an unconditional clear or a replacement for the sole opaque callee.

Proof anchors: `0x464850–0x46486D` save/argument/call setup; `0x464877–0x4648AC` width-preserving coordinate math; `0x4648D9–0x464901` triple markers; `0x464903–0x46492F` two actual gates/REP; `0x46493A–0x46495C` stack-dependent pass transition; `0x46496B–0x46498B` partial-register mask and second markers; metadata xrefs `0x45BDBA`/`0x45BE5D`; `0x464992–0x464996` ABI restoration/RET.

Open: exact callee body/prototype, application meaning of the second pass, table capacity, grid-axis terminology and meaning of the slot gate at +0x408. Context alternates unknown/overlap-clear claims for the callee; neither is promoted into its body here. No guard is justified by those unknowns. The modelling primitives require integration by the lead; this is intentionally not a guessed direct host-address implementation.

## Validation status

Manual coverage and opcode/ASM comparison only; byte-confirmed gate displacement and AL mask. No compilation, native execution, differential test, review, IDB mutation or integration was performed. Parent should validate ABI bridge, alias/fault assumptions and DF cases, and reconcile against the actual packet before promotion. Output hash is to be computed by the parent.
