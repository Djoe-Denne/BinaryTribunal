# 0x464DB0 — independent C A

## Input and scope

Author: c-a-464db0, GPT-6 Astra. Only this target is reconstructed. Input packet SHA-256 (manifest citation, not independently computed): `9c59075630146d8ae274a6bcb36ffc91b884316984555a9375ec86eba9ab5c9d`. Common compaction SHA-256: `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`. Executable SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Read all six `inputs/ff8-decomp-semantics-20261011-r01/g05/0x464DB0.readable/asm-*.txt` slices (147 lines), `bytes-001.txt` (the complete 447-byte chunk `[00464DB0,00464F6F)`), `metadata.json`, `manifest.json`, and the supplied common compaction. Names and instruction comments are not semantic evidence. No target history, other production, classifier, or additional discovery was consulted in this author turn.

## Representation / ABI boundary

The complete C below uses **32-bit guest addresses and an explicit native stack**, not host pointers or invented native callee prototypes. This is intentional: the freeze does not supply full contracts for 40A04A, 467160, 464160, or 417FA6. A conventional expression-level rewrite could silently assume purity, nonaliasing, initialized locals, or callee signatures. None is needed here.

`read16/read32/write32` are harness memory primitives, **not executable library calls**. Each represents one little-endian native access of the stated width, allowing unaligned addresses. They must access a single shared guest memory including stack, objects and globals, preserve CPU registers, and propagate invalid access rather than adding guards. `execute_callee` is an opaque native-execution boundary, not a proposed prototype for any of the seven callees. It receives the actual register file and actual argument/return-address stack; it must execute that callee through its return and retain its observable effects. Its code is intentionally not fabricated. The callee may change caller-save registers and memory, including argument slots. This target's own instructions are all implemented here.

At entry, `esp` addresses the caller's return address; DWORD slots at entry ESP+4/+8/+C are the three observed arguments. At exit `eip` receives the return address, and `esp` is entry ESP+4; caller argument cleanup is external. EBX/ESI/EDI and, on the relevant branch, EBP are saved/restored through actual guest memory. The entry value of EBP is otherwise untouched by target instructions on the other branch. No return-status type is asserted: `eax` is the observable residual return register.

The code models ABI-visible integer/memory/control behavior, not EFLAGS-exact instruction emulation, timing, exception restart PCs, or concurrent access. TEST flags are expressed as conditions; no incoming flag is consumed. Callee flag inputs and flags on return are unspecified under the ordinary cdecl boundary evidenced here. A harness requiring arbitrary non-ABI flag dependencies must additionally implement instruction flags. The target has no x87, MMX or SSE instruction; it neither sets a control word nor performs host floating-point arithmetic. `opaque_machine` must retain the native x87/SIMD environment across opaque calls; callee FP effects cannot be inferred or normalized.

## Complete C

```c
#include <stdint.h>

typedef struct X86_464DB0 X86_464DB0;
struct X86_464DB0 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi, eip;
    void *opaque_machine; /* memory + native callee state, including x87 */
    uint16_t (*read16)(X86_464DB0 *, uint32_t address);
    uint32_t (*read32)(X86_464DB0 *, uint32_t address);
    void (*write32)(X86_464DB0 *, uint32_t address, uint32_t bits);
    void (*execute_callee)(X86_464DB0 *, uint32_t return_eip);
};

/* All arithmetic in these helpers is on unsigned 32-bit bit patterns. */
static uint32_t sar32_464DB0(uint32_t value, uint32_t count)
{
    uint32_t n = count & UINT32_C(31);
    if (n == 0) return value;
    return (value >> n) |
        ((UINT32_C(0) - (value >> 31)) << (32u - n));
}

static void push32_464DB0(X86_464DB0 *c, uint32_t value)
{
    c->esp -= UINT32_C(4);
    c->write32(c, c->esp, value);
}

static uint32_t pop32_464DB0(X86_464DB0 *c)
{
    uint32_t value = c->read32(c, c->esp);
    c->esp += UINT32_C(4);
    return value;
}

static void call_464DB0(X86_464DB0 *c, uint32_t target,
                        uint32_t return_eip)
{
    push32_464DB0(c, return_eip);
    c->eip = target;
    /* Executes the real supplied callee, including its RET. No extra cleanup. */
    c->execute_callee(c, return_eip);
}

void reconstructed_00464DB0(X86_464DB0 *c)
{
    /* 00464DB0..00464DC5 */
    c->esp -= UINT32_C(0x88);
    push32_464DB0(c, c->ebx);
    push32_464DB0(c, c->esi);
    c->esi = c->read32(c, c->esp + UINT32_C(0x94));
    push32_464DB0(c, c->edi);
    c->eax = c->read32(c, c->esi + UINT32_C(0x44));
    if (c->eax != 0) goto L_464F65;

    /* 00464DCB..00464DD9 */
    call_464DB0(c, UINT32_C(0x40A04A), UINT32_C(0x464DD0));
    c->ebx = c->eax;
    c->eax = c->read32(c, UINT32_C(0x1CCFD88));
    if (c->eax == 0) goto L_464EF8;

    /* 00464DDF..00464E07 */
    c->eax = c->read32(c, c->esp + UINT32_C(0x9C));
    c->write32(c, c->esi + UINT32_C(0x60), UINT32_C(0));
    c->edi = c->eax;
    c->eax = sar32_464DB0(c->eax, UINT32_C(4));
    c->eax &= UINT32_C(1);
    c->edi &= UINT32_C(0xF);
    c->eax <<= 8;
    c->write32(c, c->esp + UINT32_C(0xC), c->eax);
    c->eax = c->read32(c, c->esi + UINT32_C(0x5C));
    c->edi <<= 6;
    if (c->eax != 0) goto L_464E21;

    /* 00464E09..00464E1B */
    push32_464DB0(c, UINT32_C(0xF0));
    call_464DB0(c, UINT32_C(0x467160), UINT32_C(0x464E13));
    c->esp += UINT32_C(4);
    c->write32(c, c->esi + UINT32_C(0x5C), c->eax);
    if (c->eax == 0) goto L_464F65;

L_464E21:
    /* 00464E21..00464E40: AX load follows XOR EAX,EAX. */
    c->eax = c->esp + UINT32_C(0x10);
    push32_464DB0(c, c->ebp);
    push32_464DB0(c, c->eax);
    push32_464DB0(c, UINT32_C(0));
    call_464DB0(c, UINT32_C(0x40702F), UINT32_C(0x464E2E));
    push32_464DB0(c, c->esi);
    call_464DB0(c, UINT32_C(0x464160), UINT32_C(0x464E34));
    c->edx = c->read32(c, c->esp + UINT32_C(0xB0));
    c->eax = UINT32_C(0);
    c->ecx = c->read32(c, c->esi + UINT32_C(0x5C));
    c->eax = (c->eax & UINT32_C(0xFFFF0000)) |
             (uint32_t)c->read16(c, c->edx + UINT32_C(0x448));

    /* 00464E47..00464E65 */
    c->edx = c->read32(c, c->esi + UINT32_C(0x14));
    c->ebp = c->eax;
    c->eax &= UINT32_C(0x3F);
    c->ebp >>= 6;
    c->ebp <<= 6;
    c->ebp += c->eax;
    c->eax = c->read32(c, UINT32_C(0x1CB602C));
    c->ebp <<= 5;
    c->ebp += c->eax;
    c->write32(c, c->esp + UINT32_C(0x48), c->ecx);
    c->ecx = c->read32(c, c->ecx + UINT32_C(0x44));

    /* 00464E68..00464E9C; native right-to-left argument construction. */
    push32_464DB0(c, c->ebp);
    c->ebp = c->read32(c, c->esi + UINT32_C(0x10));
    push32_464DB0(c, c->edx);
    push32_464DB0(c, c->ebp);
    c->ebp = c->read32(c, c->esi + UINT32_C(0xC));
    push32_464DB0(c, c->ebp);
    push32_464DB0(c, c->ecx);
    c->ecx = c->read32(c, c->esi + UINT32_C(0x60));
    c->ebp = c->read32(c, c->esp + UINT32_C(0x30));
    push32_464DB0(c, c->ecx);
    c->ecx = UINT32_C(2);
    c->ecx -= c->edx;
    c->edx = c->read32(c, c->esi + UINT32_C(4));
    c->edx = sar32_464DB0(c->edx, c->ecx & UINT32_C(0xFF));
    c->ecx = c->read32(c, c->esi + UINT32_C(8));
    push32_464DB0(c, UINT32_C(0x800));
    c->ecx += c->ebp;
    c->ecx <<= 10;
    c->edi += c->edx;
    c->ecx += c->edi;
    c->edx = c->eax + c->ecx * UINT32_C(2);
    push32_464DB0(c, c->edx);
    call_464DB0(c, UINT32_C(0x4677D0), UINT32_C(0x464EA1));

    /* 00464EA1..00464ECC */
    c->eax = c->read32(c, c->ebx + UINT32_C(0xA50));
    c->ecx = c->esp + UINT32_C(0x40);
    push32_464DB0(c, c->eax);
    push32_464DB0(c, UINT32_C(0));
    push32_464DB0(c, c->ecx);
    push32_464DB0(c, UINT32_C(6));
    push32_464DB0(c, UINT32_C(1));
    call_464DB0(c, UINT32_C(0x416D82), UINT32_C(0x464EB8));
    c->esp += UINT32_C(0x40);
    c->write32(c, c->esi + UINT32_C(0x44), c->eax);
    c->write32(c, c->esp + UINT32_C(0x40), UINT32_C(1));
    push32_464DB0(c, c->eax);
    call_464DB0(c, UINT32_C(0x417FA6), UINT32_C(0x464ECC));
    c->write32(c, c->esp + UINT32_C(0x48), c->eax);

    /* 00464ED0..00464EF7 */
    c->edx = c->read32(c, c->ebx + UINT32_C(0xA50));
    push32_464DB0(c, c->edx);
    c->eax = c->esp + UINT32_C(0x1C);
    push32_464DB0(c, UINT32_C(0));
    push32_464DB0(c, c->eax);
    push32_464DB0(c, UINT32_C(0xE));
    push32_464DB0(c, UINT32_C(1));
    call_464DB0(c, UINT32_C(0x416D82), UINT32_C(0x464EE7));
    c->esp += UINT32_C(0x18);
    c->write32(c, c->esi + UINT32_C(0x48), c->eax);
    c->ebp = pop32_464DB0(c);
    c->edi = pop32_464DB0(c);
    c->esi = pop32_464DB0(c);
    c->ebx = pop32_464DB0(c);
    c->esp += UINT32_C(0x88);
    c->eip = pop32_464DB0(c);
    return;

L_464EF8:
    /* 00464EF8..00464F0F */
    c->eax = c->read32(c, UINT32_C(0x1CA8A00));
    if (c->eax == 0) goto L_464F0A;
    c->ecx = c->esp + UINT32_C(0x10);
    push32_464DB0(c, c->ecx);
    push32_464DB0(c, UINT32_C(2));
    goto L_464F11;
L_464F0A:
    c->edx = c->esp + UINT32_C(0x10);
    push32_464DB0(c, c->edx);
    push32_464DB0(c, UINT32_C(0));

L_464F11:
    /* 00464F11..00464F40 */
    call_464DB0(c, UINT32_C(0x40702F), UINT32_C(0x464F16));
    c->eax = c->read32(c, c->esi + UINT32_C(0x24));
    c->esp += UINT32_C(8);
    c->write32(c, c->esp + UINT32_C(0x3C), UINT32_C(1));
    push32_464DB0(c, c->eax);
    call_464DB0(c, UINT32_C(0x417FA6), UINT32_C(0x464F2A));
    c->write32(c, c->esp + UINT32_C(0x44), c->eax);
    c->ecx = c->read32(c, c->ebx + UINT32_C(0xA50));
    push32_464DB0(c, c->ecx);
    c->edx = c->esp + UINT32_C(0x18);
    push32_464DB0(c, UINT32_C(0));
    push32_464DB0(c, c->edx);
    push32_464DB0(c, UINT32_C(6));
    push32_464DB0(c, UINT32_C(1));
    call_464DB0(c, UINT32_C(0x416D82), UINT32_C(0x464F45));

    /* 00464F45..00464F62 */
    c->write32(c, c->esi + UINT32_C(0x44), c->eax);
    c->eax = c->read32(c, c->ebx + UINT32_C(0xA50));
    push32_464DB0(c, c->eax);
    c->ecx = c->esp + UINT32_C(0x2C);
    push32_464DB0(c, UINT32_C(0));
    push32_464DB0(c, c->ecx);
    push32_464DB0(c, UINT32_C(0xE));
    push32_464DB0(c, UINT32_C(1));
    call_464DB0(c, UINT32_C(0x416D82), UINT32_C(0x464F5F));
    c->esp += UINT32_C(0x2C);
    c->write32(c, c->esi + UINT32_C(0x48), c->eax);

L_464F65:
    /* 00464F65..00464F6E */
    c->edi = pop32_464DB0(c);
    c->esi = pop32_464DB0(c);
    c->ebx = pop32_464DB0(c);
    c->esp += UINT32_C(0x88);
    c->eip = pop32_464DB0(c);
}
```

## Coverage and arithmetic/stack audit

All ten metadata blocks are represented: DB0–DCB (entry/early exit), DCB–DDF (global branch), DDF–E09 (coordinate bits and lazy allocation branch), E09–E21 (allocation/failure), E21–EF8 (conversion and two creations, own epilogue), EF8–F01 (filter branch), F01–F0A (filter 2), F0A–F11 (filter 0), F11–F65 (reuse and two creations), F65–F6F (shared epilogue). No omitted chunks or extra guards. The allocation failure path still has already stored slot+60=0 and slot+5C=0.

Let S be entry ESP. Fixed locals occupy `[S-88h,S)`. `desc=S-84h`, length 84h from the validated initializer; temporary coordinate DWORD is `S-88h`. The native writes at E61/EBE/ECC are respectively `desc+28h/+2Ch/+30h`; fallback F1C/F2A writes `desc+2Ch/+30h`. The code preserves these accesses at their **current ESP displacements**, including retained argument groups. It does not zero a host local descriptor or substitute cached pointers.

On the nonzero-global path, E29 leaves two arguments (8 bytes), E2F adds one (4 bytes), E9C adds eight (20h bytes), and EB3 adds five (14h bytes): EB8 removes exactly 40h. EEE's preceding EBP pop matches only E25's conditional save. EC7 plus EE2 leaves 4+14h=18h removed at EE7. The other path removes the initializer's 8 bytes at F19; F25/F40/F5A leave 4+14h+14h=2Ch removed at F5F. Calls push exact next-instruction return PCs separately; RET belongs to the opaque callee. Both target epilogues use plain C3, not RET n.

The blit call stack contains exactly eight words in callee order: source address, 800h byte source pitch, slot+60 DWORD, `[slot+5C]+44h` DWORD, slot+C DWORD, slot+10 DWORD, slot+14 DWORD, CLUT-derived address. Push order and intervening reloads remain explicit. No assumption that 464160 leaves slot+60 zero, slot+5C unchanged, or argument slots unchanged is made. Each create reads owner `[buffer+A50h]` afresh. The first creation result is published at slot+44 before the subsequent work and slot+48 is published last. Neither create result gets a new null check.

All ADD/SUB/LEA/SHL effects use modulo-2^32 unsigned arithmetic. SAR uses sign-extension of the 32-bit pattern with x86 count masking; in E85 the effective count is `(2-mode)&31`, not a C shift by an unchecked signed integer. E40's AX write is explicitly partial-register preservation following E3B's full clear; therefore the CLUT input is unsigned 16-bit, not signed 16-bit. There is no AL access. Both SHR instructions are logical. The native CLUT calculation is retained as `((u16>>6)<<6)+(u16&3Fh)`, then SHL 5 and base addition; **no 7FFF mask is added**. No multiply overflow, signed-right-shift implementation dependence, or host-pointer-width dependence is introduced.

## Target-facing contracts and bounded interpretation

Suggested descriptive name (not a promotion): **`EnsureSlotAuxiliaryDrawListPair`**. High confidence in lazy pair creation; medium confidence in the graphics-specific interpretation from the validated surrounding contracts. Two independent native supports are the slot+44 early gate and the two five-word calls with immediate types 6/14 whose results land at +44/+48. The conditional eight-argument call to the validated 4677D0 additionally supports a staged-alpha-data branch. The existing “UploadCLUTSlot” label does not itself establish GPU upload, CLUT lifetime, or the meaning of the feature switches.

Observed input: slot pointer; a DWORD whose bits 0..3 and 4 contribute to source coordinates; a pointer whose WORD at +448 is read on the staged path. They are read at their actual stack positions, possibly after external calls. Effects include guest stack writes, slot+60 reset and optional +5C allocation publication, optional native blit, descriptor initialization/mutation, opaque helper effects, two creation calls and slot+44/+48 publication. If slot+44 is nonzero, the function calls nothing and returns that DWORD in EAX. If 467160 returns zero, EAX returns zero. Ordinary successful traversal returns whatever EAX the **second** creation produced, including zero; that does not imply an intended status API or transactional success. +48 is not inspected on the early-return gate.

### Eight native/source anchors

1. `.../0x464DB0.readable/asm-001.txt:1–13`, EA 464DB0–464DD9: frame, saved registers, +44 gate, base acquisition and switch load. Relative call bytes are in `bytes-001.txt:1–2`.
2. `asm-001.txt:14–25` and `asm-002.txt:1–6`, EA 464DDF–464E1B: DWORD source bits, +60 zero, +5C lookup/0F0h request/failure.
3. `asm-002.txt:7–25`, EA 464E21–464E5C: initializer call, separate 464160 call, post-call argument reload, unsigned AX load and CLUT arithmetic.
4. `asm-003.txt:1–25` and `asm-004.txt:1`, EA 464E5F–464E9C: descriptor+28 store, exact eight arguments, variable SAR and source LEA.
5. `asm-004.txt:2–25`, EA 464EA1–464EEA: owner reloads, types 6/14, distinct descriptor mutations and results.
6. `asm-005.txt:7–25` and `asm-006.txt:1–17`, EA 464EF8–464F62: global-select filter 2/0, nested value from slot+24, two creations, deferred cleanup.
7. `asm-005.txt:1–6` and `asm-006.txt:18–22`: distinct EBP-save/restore path and plain returns; no callee-pop argument return.
8. `metadata.json:84–105`: code callers 464CCC in 464BD0 and 465FAF in 465CE0, and the seven direct target addresses. `common-compaction.md:13–15` supplies already-validated neighbour ABI for the eight-word blit, two-word initializer and five-word creation; it does not provide implementations of opaque callees.

All abbreviated ASM/byte/metadata paths above have prefix `inputs/ff8-decomp-semantics-20261011-r01/g05/0x464DB0.readable/`; compaction has prefix `inputs/ff8-decomp-semantics-20261011-r01/g05/`.

## Explicit limits / requested validation

- Full business types, feature-switch meaning, lifetime/ownership, allocation strategy, and unknown helpers' complete side effects are not established. Numeric native targets, not invented C signatures, are the external boundary.
- Alias fidelity includes stack/object/global overlap under a normal completing ABI execution, because accesses and pushes remain ordered in one guest memory. No restrict qualification, structural cast, or purity assumption is present. Memory faults, asynchronous concurrency and arbitrary EFLAGS dependencies are outside this C contract, as stated above.
- This is complete **target** C over a declared machine boundary, not a standalone linked replacement with reconstructed callees. A lead-owned native bridge or emulator is required to execute it. Lowering to an ordinary host-pointer native ABI function needs separate ABI/integration validation.
- Manual correspondence inspection of the supplied ASM and raw-byte displacements only. **No compilation, execution, differential test, hash recomputation, IDA validation, or live check was performed.** Lead requests: compile this C in a harness; differential-check all ten blocks, zero/nonzero creation returns, aliasing/reloads, shift counts including 0/31/32-equivalent, and both epilogues against the frozen native code. These are requests, not PASS claims.
