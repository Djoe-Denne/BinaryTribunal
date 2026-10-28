# Independent C B — 0x463FC0

## Provenance and representation

Input packet SHA256: `d50c7dd68e7420c7cf455a100d15735f8e6a6d5fd522533cbbb6283994602291`. Common compaction SHA256: `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`. EXE SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Read all six ASM slices, the entire byte slice, manifest and metadata in `inputs/ff8-decomp-semantics-20261011-r01/g05/0x463FC0.readable/`, and the common compaction. Coverage: all 126 exported instructions, all 21 CFG blocks, one contiguous byte chunk `[0x463FC0,0x464156)`, both return paths. No target historical C, other producer, classifier or semantic-volet output read.

The C below is a complete **machine-memory lifting of the target**, not a guessed host-pointer struct implementation. This choice preserves stack/global/record aliasing, rereads after calls, and argument-push order without inventing callee prototypes. `invoke` is an ABI execution bridge, NOT an extra binary callee or a recovered library function. Its two possible target addresses are exactly the direct calls in the packet. It executes the callee through its return, updating registers/memory/DF and ESP; the actual return address and arguments are in the modeled stack. No callee body or return guarantee is fabricated. A production harness must supply that bridge and a full mapped 32-bit address space. Unmapped-access faults, instruction fetch, external concurrency and hardware/MMIO atomicity are outside this process-RAM C model.

All address and arithmetic operations wrap modulo 2^32. All data/stack accesses in this target are DWORD; the byte-backed accessors define each little-endian DWORD transfer, not a claim of four native byte instructions. Inputs are five stack words: entry ESP+4 opaque context, +8 record, +12 mode bits, +16 dimension0, +20 dimension1. Return is EAX32, 0 on success or FFFFFFFF on allocation failure. EBX/EBP/ESI/EDI are saved/restored via actual stack addresses; no `restrict` or nonalias assumption. ESP and return-PC behavior are modeled too. Ordinary cdecl requires DF clear; the initial `rep stosd` also explicitly models DF=1, without silently correcting it. Arbitrary caller observation of arithmetic EFLAGS is not part of the C ABI represented here; branch conditions are captured at their native comparison points. No AL/AX-only operations, x87 instructions or floating arithmetic occur in this chunk. Thus it performs no direct x87 control-word change; external callees remain opaque, including their possible floating-state effects.

## Complete lifted C

```c
#include <stdint.h>

typedef struct X86 X86;
struct X86 {
    uint32_t eax, ebx, ecx, edx, esi, edi, ebp, esp, eip;
    uint32_t df;                  /* 0 or 1 */
    uint8_t *ram;                 /* modeled full 32-bit address space */
    void (*invoke)(X86 *, uint32_t target);
};

static uint32_t r32(X86 *s, uint32_t a)
{
    return (uint32_t)s->ram[a]
         | ((uint32_t)s->ram[a + UINT32_C(1)] << 8)
         | ((uint32_t)s->ram[a + UINT32_C(2)] << 16)
         | ((uint32_t)s->ram[a + UINT32_C(3)] << 24);
}
static void w32(X86 *s, uint32_t a, uint32_t v)
{
    s->ram[a] = (uint8_t)v;
    s->ram[a + UINT32_C(1)] = (uint8_t)(v >> 8);
    s->ram[a + UINT32_C(2)] = (uint8_t)(v >> 16);
    s->ram[a + UINT32_C(3)] = (uint8_t)(v >> 24);
}
static void push32(X86 *s, uint32_t v)
{
    s->esp -= UINT32_C(4);
    w32(s, s->esp, v);
}
static uint32_t pop32(X86 *s)
{
    uint32_t v = r32(s, s->esp);
    s->esp += UINT32_C(4);
    return v;
}
static void call32(X86 *s, uint32_t target, uint32_t next)
{
    push32(s, next);
    s->eip = target;
    s->invoke(s, target);         /* executes native callee through RET */
}
static int signed_ge_2(uint32_t v)
{
    /* Avoid implementation-defined uint32_t -> int32_t conversion. */
    return (v & UINT32_C(0x80000000)) == 0 && v >= UINT32_C(2);
}

uint32_t lift_00463FC0(X86 *s)
{
    int z, mode_is_two, mode_is_one;

    /* 463FC0–463FE8: read second arg before saves, clear descriptor. */
    s->eax = r32(s, s->esp + UINT32_C(8));
    push32(s, s->ebx);
    push32(s, s->ebp);
    push32(s, s->esi);
    s->esi = r32(s, s->eax + UINT32_C(0x54));
    s->edx = r32(s, UINT32_C(0x1CCFD80));
    push32(s, s->edi);
    s->ecx = UINT32_C(0x3C);
    s->eax = 0;
    s->edi = s->esi;
    while (s->ecx != 0) {
        w32(s, s->edi, s->eax);
        s->edi += s->df ? UINT32_C(0xFFFFFFFC) : UINT32_C(4);
        s->ecx -= UINT32_C(1);
    }
    s->eax = r32(s, UINT32_C(0x1CCFD84));
    s->ebp = 0;
    z = (s->eax == s->ebp);
    s->edi = s->esi + UINT32_C(0x3C);
    if (z) {
        /* 464005 */
        s->ecx = r32(s, s->esp + UINT32_C(0x1C));
        w32(s, s->esi + UINT32_C(8), UINT32_C(1));
    } else {
        /* 463FEA/463FF3/463FF7/463FFC */
        s->ecx = r32(s, s->esp + UINT32_C(0x1C));
        if (signed_ge_2(s->ecx) || s->edx != s->ebp)
            w32(s, s->esi + UINT32_C(8), s->ebp);
        else
            w32(s, s->esi + UINT32_C(8), UINT32_C(1));
    }

    /* 464010: comparison precedes the following three stores. */
    s->ebx = UINT32_C(8);
    z = (s->eax == s->ebp);
    w32(s, s->esi + UINT32_C(0x0C), s->ebp);
    w32(s, s->esi + UINT32_C(0x14), UINT32_C(4));
    w32(s, s->esi + UINT32_C(0x18), s->ebx);
    /* 464026/46402B/46402F/464038 */
    if (!z && (s->ecx == UINT32_C(2) || s->edx != s->ebp))
        w32(s, s->esi + UINT32_C(0x1C), UINT32_C(1));
    else
        w32(s, s->esi + UINT32_C(0x1C), s->ebp);

    /* 46403B–464064 */
    s->edx = r32(s, s->esp + UINT32_C(0x20));
    s->eax = r32(s, s->esp + UINT32_C(0x24));
    mode_is_two = (s->ecx == UINT32_C(2));
    w32(s, s->esi + UINT32_C(0x20), s->ebx);
    w32(s, s->esi + UINT32_C(0x24), s->ebx);
    w32(s, s->esi + UINT32_C(0x28), UINT32_C(0x20));
    w32(s, s->esi + UINT32_C(0xE8), s->ebp);
    w32(s, s->esi + UINT32_C(0xEC), s->ebp);
    w32(s, s->edi, s->edx);
    w32(s, s->edi + UINT32_C(4), s->eax);

    if (mode_is_two) {
        /* 464066–464092: six cdecl argument words, in push order. */
        push32(s, s->edi);
        push32(s, s->ebp);
        push32(s, UINT32_C(0x1F));
        s->eax = UINT32_C(0x10);
        push32(s, UINT32_C(0x3E0));
        push32(s, UINT32_C(0x7C00));
        push32(s, s->eax);
        w32(s, s->esi + UINT32_C(4), s->ebp);
        w32(s, s->esi + UINT32_C(0x38), s->eax);
        w32(s, s->esi + UINT32_C(0x1C), s->ebp);
        call32(s, UINT32_C(0x4188E2), UINT32_C(0x464088));
        s->ecx = r32(s, s->edi);
        s->esp += UINT32_C(0x18);
        s->ecx <<= 1;
        w32(s, s->edi + UINT32_C(8), s->ecx);
    } else {
        /* 464097–4640BA */
        push32(s, s->edi);
        push32(s, UINT32_C(0x8000));
        push32(s, UINT32_C(0x1F));
        push32(s, UINT32_C(0x3E0));
        push32(s, UINT32_C(0x7C00));
        push32(s, s->ebx);
        w32(s, s->esi + UINT32_C(4), UINT32_C(1));
        w32(s, s->esi + UINT32_C(0xBC), s->ebp);
        w32(s, s->esi + UINT32_C(0x38), s->ebx);
        call32(s, UINT32_C(0x4188E2), UINT32_C(0x4640BF));
        /* Reread mode while six pushed words remain on the stack. */
        s->ecx = r32(s, s->esp + UINT32_C(0x34));
        s->edx = r32(s, s->edi);
        s->eax = UINT32_C(1);
        s->esp += UINT32_C(0x18);
        mode_is_one = (s->ecx == s->eax);
        w32(s, s->edi + UINT32_C(8), s->edx);
        w32(s, s->edi + UINT32_C(0x10), s->eax);
        w32(s, s->edi + UINT32_C(0x14), s->ebx);
        w32(s, s->edi + UINT32_C(0x18), s->eax);
        if (mode_is_one) {
            /* 4640DD */
            s->eax = UINT32_C(0x100);
            w32(s, s->esi + UINT32_C(0x30), UINT32_C(0x10));
            w32(s, s->esi + UINT32_C(0x34), s->eax);
            w32(s, s->edi + UINT32_C(0x20), s->eax);
            w32(s, s->edi + UINT32_C(0x1C), UINT32_C(0x2000));
        } else {
            /* 4640F8 */
            s->eax = UINT32_C(0x10);
            w32(s, s->esi + UINT32_C(0x30), UINT32_C(0x80));
            w32(s, s->esi + UINT32_C(0x34), s->eax);
            w32(s, s->edi + UINT32_C(0x20), s->eax);
            w32(s, s->edi + UINT32_C(0x1C), UINT32_C(0x1000));
        }
        /* 464111: context reloaded, not the original context snapshot. */
        s->eax = r32(s, s->esp + UINT32_C(0x14));
        s->ecx = r32(s, s->eax + UINT32_C(0x444));
        w32(s, s->edi + UINT32_C(0x24), s->ecx);
    }

    /* 46411E: record pointer reloaded after all descriptor writes/call. */
    s->ebx = r32(s, s->esp + UINT32_C(0x18));
    if (r32(s, s->ebx + UINT32_C(0x58)) == s->ebp) {
        s->edx = r32(s, s->edi + UINT32_C(8));
        /* IMUL r32,mem32: low 32 bits, same for signed/unsigned product. */
        s->edx *= r32(s, s->edi + UINT32_C(4));
        push32(s, s->edx);
        call32(s, UINT32_C(0x467160), UINT32_C(0x464134));
        s->esp += UINT32_C(4);
        z = (s->eax == s->ebp);
        w32(s, s->ebx + UINT32_C(0x58), s->eax);
        if (z) {
            /* 46413E–464145; no descriptor+ D8 publication on failure. */
            s->edi = pop32(s);
            s->esi = pop32(s);
            s->ebp = pop32(s);
            s->eax |= UINT32_C(0xFFFFFFFF);
            s->ebx = pop32(s);
            s->eip = pop32(s);
            return s->eax;
        }
    }
    /* 464146–464155: reload pixels even after allocation store. */
    s->eax = r32(s, s->ebx + UINT32_C(0x58));
    s->edi = pop32(s);
    w32(s, s->esi + UINT32_C(0xD8), s->eax);
    s->esi = pop32(s);
    s->ebp = pop32(s);
    s->eax = 0;
    s->ebx = pop32(s);
    s->eip = pop32(s);
    return s->eax;
}
```

## Contracts, anchored observations and uncertainty

High confidence in the local numeric transformation and return behavior; moderate confidence in the business description **initialize page pixel-format descriptor and ensure pixel backing**. Suggested descriptive name `InitPageFormatAndEnsurePixels`, not an integration/rename request. Independent proofs are the mode-selected bit-depth/mask call and nested width/pitch fields, plus size-derived allocation and publication of the existing/new pixel pointer. Labels/comments are not these proofs.

Anchors (paths relative to the readable directory above):

1. `asm-001.txt:1–15` / 463FC0–463FE5: loads record+54, clears 60 DWORDs, loads globals at 1CCFD80 and 1CCFD84 at different points. Both descriptor span 0xF0 and clear/read ordering are explicit. The first global is captured before the clear; the second afterward. Global business meanings are unknown.
2. `asm-001.txt:17–25`, `asm-002.txt:1–15` / 463FEA–464038: descriptor+8 uses **signed mode >=2**, whereas descriptor+1C uses equality to 2; do not merge them into a mode-range assumption. No mode validation or null check.
3. `asm-002.txt:16–25`, `asm-003.txt:1–17` / 46403B–464092: dimensions enter descriptor+3C/+40; exact mode 2 pushes logical arguments `(16,0x7C00,0x3E0,0x1F,0,descriptor+0x3C)` to 4188E2. After the call, descriptor+44 gets the freshly read descriptor+3C doubled modulo 2^32.
4. `asm-003.txt:18–25`, `asm-004.txt:1–23` / 464097–46410A: other modes push `(8,0x7C00,0x3E0,0x1F,0x8000,descriptor+0x3C)`. Mode is reread after this call. Mode 1 sets +30=16,+34=256, nested +20=256,+1C=0x2000; otherwise +30=128,+34=16,nested +20=16,+1C=0x1000. Nested +10/+14/+18=1/8/1; direct mode omits these explicit stores.
5. `asm-004.txt:24–25`, `asm-005.txt:1–12` / 464111–46413C: non-mode-2 path copies freshly read context+444 to descriptor+60. Final record pointer is reread from stack. If record+58 equals EBP (ordinarily zero under cdecl), allocate low32(descriptor+44 * descriptor+40), write result to record+58 before branching on the saved comparison result.
6. `asm-005.txt:13–25`, `asm-006.txt:1` / 46413E–464155: allocator-zero failure returns FFFFFFFF without final descriptor+ D8 publication; success rereads record+58 and writes it to the originally selected descriptor+ D8 before returning zero. Failure is not rollback: descriptor and record mutations already occurred.
7. `metadata.json:166–178`: one exported caller at 4650B7 in 464F70 and exactly two direct targets, 4188E2/467160. `common-compaction.md:18` reports validated caller record+54 format allocation 0xF0 and record+58 current pixels, supporting the pointer-field interpretation. This is documentary support, not a new audit of that caller.

Risks/unknowns: The two native callees' complete contracts/bodies are absent; no allocator purity, failure cleanliness, memory initialization, or mask-helper side-effect guarantee is asserted. ABI callee-save and stack-return conventions are necessary for ordinary high-level interpretations, though the lifting exposes actual state updates. Initial clearing can erase an aliasing record/global/argument stack region. Helper/allocation effects can change subsequent memory reads. Dimensions may be zero/negative bit patterns or overflow products; there is no guard. Mode 2 and other-mode paths intentionally differ in fields, even when zero-filled fields look surprising. Global names and the function's original label are not evidence of renderer backend or format enum bounds. There is no retained old pixel pointer inside the descriptor after the clear except the final publication.

Validation: manually inspected all supplied ASM/byte slices and CFG against the lifting; byte displacements show 4188E2 twice and 467160 once, `F3 AB` DWORD clear, signed `7D` mode branch, DWORD `0F AF` low-product, and `C3` returns. No compilation, executable bridge, test, differential check, PE cross-check, IDB review or integration performed. Lead should compile/review and test alias cases, helper-mutated stack mode, overflowing dimensions, existing pixels and allocation failure with authorized native/harness evidence. Output hash to be computed by parent.
