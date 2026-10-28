# 0x464850 — independent C A

## Evidence and scope

Input packet SHA-256 (manifest citation, not independently recomputed):
`72f5e85aeda3168bd1cd97ff40d4407399a0fbbdd3d5589f58031f5fc9e7b087`.
Common compaction SHA-256: `ded4edb4b1c6b48f28524bd123684cad1cf7bbc1743739420aa39f22a47309dc`.
Executable SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Read all five ASM slices, the complete byte slice, manifest, metadata and common
compaction under `inputs/ff8-decomp-semantics-20261011-r01/g06/`.
Coverage: all 119 instructions, all 20 CFG blocks, the sole chunk
`[0x464850,0x464997)` (327 bytes). No other author/semantic output consulted.

**Important correction to the supplied compaction, not to the instructions:**
the second gate is `[EDX + 0x01CAD694]`, NOT `[EDX + 0x01CAD294]`.
`asm-003.txt:22` and bytes `8B 82 94 D6 CA 01` at `0x464918` agree.
It is 0x408 bytes beyond the clearing base `0x01CAD28C`.

## Complete C target translation

This is a register/guest-memory C translation, deliberately retaining stack
accesses and incidental EAX, rather than asserting a recovered game C prototype
or assuming that table accesses cannot alias stack slots. The adapter interfaces
below are translation infrastructure, **not additional game callees**. They let
the integrator map the actual 32-bit address space and the one unresolved native
callee without fabricating its implementation or C type.

Contract: `r32`/`w32` perform one little-endian x86 dword load/store at the supplied
32-bit address, in invocation order, including unaligned accesses; they must not
modify CPU registers. Mapped memory/fault handling belongs to the adapter. On
entry ESP points at the native return address. `run_callee` starts execution at
the supplied address with the already-pushed return address and runs through its
return, updating registers, memory and DF exactly. Its only target here is
0x467550. It must also carry any opaque x87/SSE/environment effects of that
callee. No callee prototype, purity, return value or hidden memory effects are
assumed. This code models normal execution; instruction-granular fault rollback,
interrupts, and non-ABI-observable arithmetic EFLAGS are not implemented.

```c
#include <stdint.h>

typedef uint32_t U32;
typedef struct CPU464850 {
    U32 eax, ecx, edx, ebx, esp, ebp, esi, edi;
    U32 eip;
    unsigned df;                 /* 0 or 1: direction flag */
} CPU464850;

typedef struct Env464850 {
    void *opaque;
    U32  (*r32)(void *, U32);
    void (*w32)(void *, U32, U32);
    void (*run_callee)(void *, CPU464850 *, U32);
} Env464850;

static U32 rd464850(Env464850 *m, U32 a)
{
    return m->r32(m->opaque, a);
}
static void wr464850(Env464850 *m, U32 a, U32 v)
{
    m->w32(m->opaque, a, v);
}
static void push464850(Env464850 *m, CPU464850 *r, U32 v)
{
    r->esp -= 4u;
    wr464850(m, r->esp, v);
}
static U32 pop464850(Env464850 *m, CPU464850 *r)
{
    U32 v = rd464850(m, r->esp);
    r->esp += 4u;
    return v;
}
/* Exact two's-complement signed comparison without signed conversion. */
static int sgt464850(U32 a, U32 b)
{
    return (a ^ UINT32_C(0x80000000)) >
           (b ^ UINT32_C(0x80000000));
}
/* Used only with counts 6 and 8. No implementation-defined signed shift. */
static U32 sar464850(U32 a, unsigned n)
{
    return (a >> n) | ((0u - (a >> 31)) << (32u - n));
}

void translate_00464850(Env464850 *m, CPU464850 *r)
{
    int greater, less_equal;

    /* 464850..46486D: preserve registers; push fifth argument first. */
    push464850(m, r, r->ebx);
    r->ebx = rd464850(m, r->esp + 0x0Cu);
    push464850(m, r, r->ebp);
    r->ebp = rd464850(m, r->esp + 0x0Cu);
    push464850(m, r, r->esi);
    r->esi = rd464850(m, r->esp + 0x18u);
    push464850(m, r, r->edi);
    r->edi = rd464850(m, r->esp + 0x20u);
    push464850(m, r, 0x01CB6040u);
    push464850(m, r, r->edi);
    push464850(m, r, r->esi);
    push464850(m, r, r->ebx);
    push464850(m, r, r->ebp);
    push464850(m, r, 0x00464872u); /* CALL return address */
    r->eip = 0x00467550u;
    m->run_callee(m->opaque, r, 0x00467550u);

    /* 464872..4648AC: CDQ/sign bias, then arithmetic right shifts. */
    r->eax = r->ebp;
    r->esp += 0x14u;
    r->edx = 0u - (r->eax >> 31);
    r->edx &= 0x3Fu;
    r->eax += r->edx;
    r->ebp = r->eax;
    r->eax = r->ebx;
    r->edx = 0u - (r->eax >> 31);
    r->edx &= 0xFFu;
    r->eax += r->edx;
    r->ecx = r->eax;
    r->eax = r->esi;
    r->edx = 0u - (r->eax >> 31);
    r->edx &= 0x3Fu;
    r->eax += r->edx;
    r->esi = r->eax;
    r->eax = r->edi;
    r->edx = 0u - (r->eax >> 31);
    r->edx &= 0xFFu;
    r->eax += r->edx;
    r->edi = r->eax;
    r->ecx = sar464850(r->ecx, 8);
    r->edi = sar464850(r->edi, 8);
    r->ebp = sar464850(r->ebp, 6);
    r->esi = sar464850(r->esi, 6);
    greater = sgt464850(r->ecx, r->edi);
    wr464850(m, r->esp + 0x20u, r->ebp);
    wr464850(m, r->esp + 0x14u, r->ecx);
    wr464850(m, r->esp + 0x18u, r->edi);
    if (greater) goto L464950;

    /* 4648C3 */
    r->eax = r->edi;
    r->ebp = r->ecx;
    r->eax -= r->ecx;
    r->ebp <<= 4;
    ++r->eax;
    wr464850(m, r->esp + 0x1Cu, r->eax);
L4648D1:
    r->ebx = rd464850(m, r->esp + 0x20u);
    if (sgt464850(r->ebx, r->esi)) goto L464942;
L4648D9:
    r->eax = r->ebx + r->ebp;
    r->ecx = r->eax + r->eax * 4u;
    r->ecx = r->eax + r->ecx * 2u;
    r->ecx = r->ecx + r->ecx * 4u;
    r->edx = r->ecx + r->ecx * 4u;
    r->ecx = 0x01CB636Cu + r->edx * 4u;
    r->edx = 3u;
L4648F4:
    wr464850(m, r->ecx, UINT32_C(0xFFFFFFFF));
    r->ecx += 0x8980u;
    --r->edx;
    if (r->edx != 0) goto L4648F4;

    /* 464903 */
    r->ecx = rd464850(m, 0x01CCFD90u);
    if (r->ecx == 0) goto L464935;
    /* 46490D */
    r->edx = r->eax + r->eax * 8u;
    r->edx <<= 3;
    r->edx -= r->eax;
    r->edx <<= 4;
    r->eax = rd464850(m, 0x01CAD694u + r->edx);
    if (r->eax == 0) goto L464935;
    /* 464922 */
    r->ecx = 0x100u;
    r->eax = 0;
    r->edi = 0x01CAD28Cu + r->edx;
    /* REP STOSD, not an invented memset call; no CLD occurs here. */
    do {
        wr464850(m, r->edi, r->eax);
        r->edi += r->df ? UINT32_C(0xFFFFFFFC) : 4u;
        --r->ecx;
    } while (r->ecx != 0);
    r->edi = rd464850(m, r->esp + 0x18u);
L464935:
    ++r->ebx;
    if (!sgt464850(r->ebx, r->esi)) goto L4648D9;
    /* 46493A */
    r->ecx = rd464850(m, r->esp + 0x14u);
    r->eax = rd464850(m, r->esp + 0x1Cu);
L464942:
    r->ebp += 0x10u;
    --r->eax;
    wr464850(m, r->esp + 0x1Cu, r->eax);
    if (r->eax != 0) goto L4648D1;
    /* 46494C */
    r->ebp = rd464850(m, r->esp + 0x20u);
L464950:
    greater = sgt464850(r->ecx, r->edi);
    r->ebx = r->ecx;
    if (greater) goto L464992;
    goto L46495C;
L464958:
    r->ebp = rd464850(m, r->esp + 0x20u);
L46495C:
    r->eax = rd464850(m, r->esp + 0x20u);
    r->ecx = r->ebp;
    if (sgt464850(r->eax, r->esi)) goto L46498D;
    /* 464966 */
    r->edx = r->ebx;
    r->edx <<= 4;
L46496B:
    r->eax = r->ecx;
    r->eax &= UINT32_C(0xFFFFFFFE); /* AND AL,FE: upper 24 bits stay */
    r->eax += r->edx;
    ++r->ecx;
    less_equal = !sgt464850(r->ecx, r->esi);
    /* LEA/MOV preserve the preceding CMP flags through 46498B. */
    r->ebp = r->eax + r->eax * 4u;
    r->eax = r->eax + r->ebp * 2u;
    r->eax = r->eax + r->eax * 4u;
    r->eax = r->eax + r->eax * 4u;
    wr464850(m, 0x01CBECECu + r->eax * 4u,
             UINT32_C(0xFFFFFFFF));
    if (less_equal) goto L46496B;
L46498D:
    ++r->ebx;
    if (!sgt464850(r->ebx, r->edi)) goto L464958;
L464992:
    r->edi = pop464850(m, r);
    r->esi = pop464850(m, r);
    r->ebp = pop464850(m, r);
    r->ebx = pop464850(m, r);
    r->eip = pop464850(m, r); /* RET, no immediate argument cleanup */
}
```

All register/address arithmetic above uses modulo-2^32 unsigned operations.
There are no signed-overflow expressions or casts of out-of-range unsigned values
to signed. The 32-bit x86 target requires 32-bit unsigned arithmetic (`uint32_t`
as unsigned int, as on conventional C11 x86/Windows toolchains). No memory loads
are hoisted/cached or writes deduplicated, including repeated even-pair writes.
No AX operations occur; the only partial-register operation is AND AL,FE.

## ABI, effects, evidence anchors

1. `asm-001.txt:1-16`, bytes at 0x464850–0x464874: four incoming dwords,
   saved EBX/EBP/ESI/EDI, five outgoing pushes in right-to-left order. At callee
   entry `[ESP+4..20] = {arg0,arg1,arg2,arg3,0x1CB6040}` (decimal offsets).
   Cleanup is 0x14.
   Final RET at 0x464996 does not pop the four incoming arguments. Their slots
   are overwritten as scratch; the translation retains these writes.
2. `asm-001.txt:15-25`, `asm-002.txt:1-14`: signed truncation toward zero by
   64 for arg0/arg2 and by 256 for arg1/arg3, not unsigned division or ceil.
3. `asm-003.txt:4-14` (0x4648D9–0x464901): for register index `i`, write -1
   to `0x1CB636C + 0x44C*i + k*0x8980`, k=0,1,2, in that order.
4. `asm-003.txt:15-25`, `asm-004.txt:1-4` (0x464903–0x464931): global gate,
   then per-index gate at `0x1CAD694+0x470*i`; only then 256 dword zero stores
   starting at `0x1CAD28C+0x470*i`. Normally DF=0 under the C ABI; DF=1 is
   nevertheless represented, not silently repaired with CLD or memset.
5. `asm-005.txt:1-11` (0x46496B–0x46498B): clearing bit 0 of AL retains all
   other EAX bits. The final writes use `0x1CBECEC+0x44C*((column&~1)+16*row)`;
   adjacent columns can intentionally repeat the same write. JLE uses CMP at
   0x464972, not arithmetic from the intervening LEAs.
6. `metadata.json:162-201`: six code xrefs at 0x45B6D8, 0x45BAB8, 0x45BC10,
   0x45BDBA, 0x45BE5D, 0x45BFA7; the sole direct callee is 0x467550. Frozen
   compaction lines 7,15–16 report caller evidence for inclusive endpoint
   arguments and ignored return values. This is context, not fresh caller ASM
   verification by this author.

These anchors support the descriptive role **rectangle-indexed texture-table
invalidation with optional slot clearing**, not a pixel blit performed here.
A cautious working name is `InvalidateRectangleIndexedTextureSlots` (high
confidence in write mechanism; medium in texture-domain terminology inherited
from context). Geometry names and exact resource ownership remain contextual.
This is an explanatory C-author note, not a separately validated semantic verdict.

## Coverage / risks / unexecuted validation

- CFG starts covered: 464850, 4648C3, 4648D1, 4648D9, 4648F4, 464903,
  46490D, 464922, 464935, 46493A, 464942, 46494C, 464950, 464956,
  464958, 46495C, 464966, 46496B, 46498D, 464992. Every emitted store/read
  retains its native width and ordering, including the overwritten argument
  slots. Return EAX is incidental/path-dependent, exposed in the register state;
  no fabricated constant or void-return ABI is imposed.
- There are no native local x87 instructions, no local floating-point rounding
  assumptions and no local x87 environment changes. Callee x87 effects are
  unknown and delegated intact to the native adapter.
- Callee 0x467550 remains opaque. Compaction's conflicting role descriptions
  cannot establish its implementation. This deliverable neither substitutes a
  library call nor uses a guessed high-level prototype.
- Table extents, legal rectangle ranges, alignment and allocation identity are
  not proven. No clamps, null guards or array bounds are added. A real integration
  must supply faithful memory/callee adapters; this is not an executable native
  function replacement by itself. EIP is exposed at call/return boundaries only.
- Manual source/byte checks only. No compiler, tests, differential execution,
  hash recomputation, IDB or live access used. Requested lead checks: review the
  corrected 0x1CAD694 gate, compile the translation adapter, and compare memory
  traces/EAX for negative coordinates, reversed bounds, both gates, paired
  writes and stack/table alias cases. These are requests, not PASS claims.
