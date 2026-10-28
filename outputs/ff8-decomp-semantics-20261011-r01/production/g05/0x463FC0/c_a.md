# 0x463FC0 — independent C A

## Input and scope

- Author: c-a-463fc0; target **0x463FC0 only**. No other production consulted.
- Authoritative packet SHA-256, **as recorded in the supplied manifest**: `d50c7dd68e7420c7cf455a100d15735f8e6a6d5fd522533cbbb6283994602291`.
- Common-compaction SHA-256, as recorded: `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`.
- Original executable SHA-256, as recorded: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Read the complete readable projection: manifest, metadata, asm-001 through asm-006, bytes-001; common compaction. Hashes were cited, not independently recomputed.
- Coverage: sole chunk `[0x463FC0,0x464156)`, 406 bytes, 126 exported instructions, all 21 CFG blocks and both return paths. No target x87 instructions or partial-register operations.

## Representation and external boundary

The C below is a **complete address-based C lifting**, not a proposed host-structure definition or a directly linkable replacement ABI. Explicit machine memory and entry ESP retain accesses to mutable argument slots, saved registers, and call arguments. This avoids imposing nonalias assumptions or inventing C prototypes for the two opaque native callees. The return value is the final `m->eax`; `m->eip` and `m->esp` model native RET.

The three callbacks are analysis adapters, **not additional calls in the game**:

1. `read32`/`write32` perform one ordered little-endian DWORD access at the supplied 32-bit virtual address, including unaligned accesses; they do not mutate CPU register fields. They must share the same memory for stack, objects, globals, and callee execution. They must not add bounds/null guards. Faulting accesses are the adapter's responsibility.
2. `invoke` executes exactly the supplied native entry, with the return address already pushed, through its return to the stated continuation. It receives/restores the complete register and stack state, and exposes all callee memory effects. No allocator, bitfield algorithm, library function, return type, or purity is substituted. Only entries `0x4188E2` and `0x467160` occur.
3. `df` is the actual direction flag, represented by zero/nonzero. Ordinarily cdecl requires DF=0. The initial REP below also describes DF=1 rather than silently changing the instruction to a forward memset. Other arithmetic flags are not exposed by this C interface: branch predicates are evaluated explicitly at their native compare points. This is not an EFLAGS/fault-restart emulator or a binary ABI thunk. Ordinary cdecl incoming arithmetic flags are not callee arguments; any undocumented dependence on them would require a fuller machine adapter.

No target floating-point instruction changes x87 state. Any callee x87/environment effects must pass through `invoke` unchanged; this reconstruction does not impose rounding, precision, exception masks, or a new FP environment.

## Complete C11

```c
#include <stdint.h>

typedef uint32_t U32;
_Static_assert(sizeof(U32) == 4, "32-bit words required");

typedef struct X86_463FC0 X86_463FC0;
struct X86_463FC0 {
    U32 eax, ebx, ecx, edx, esi, edi, ebp, esp, eip;
    unsigned df;
    void *memory;
    U32  (*read32)(void *memory, U32 address);
    void (*write32)(void *memory, U32 address, U32 value);
    void (*invoke)(X86_463FC0 *machine, U32 native_entry);
};

static U32 rd(X86_463FC0 *m, U32 a)
{
    return m->read32(m->memory, a);
}

static void wr(X86_463FC0 *m, U32 a, U32 v)
{
    m->write32(m->memory, a, v);
}

static void push32(X86_463FC0 *m, U32 v)
{
    m->esp -= UINT32_C(4);
    wr(m, m->esp, v);
}

static U32 pop32(X86_463FC0 *m)
{
    U32 v = rd(m, m->esp);
    m->esp += UINT32_C(4);
    return v;
}

static void native_call(X86_463FC0 *m, U32 entry, U32 continuation)
{
    push32(m, continuation);
    m->eip = entry;
    m->invoke(m, entry);  /* Includes the callee's native RET, not caller cleanup. */
}

static void native_ret(X86_463FC0 *m)
{
    m->eip = pop32(m);
}

void re_00463FC0(X86_463FC0 *m)
{
    int equal;

    /* 463FC0: entry ESP points at the caller's return address. */
    m->eax = rd(m, m->esp + UINT32_C(8));
    push32(m, m->ebx);
    push32(m, m->ebp);
    push32(m, m->esi);
    m->esi = rd(m, m->eax + UINT32_C(0x54));
    m->edx = rd(m, UINT32_C(0x01CCFD80));
    push32(m, m->edi);
    m->ecx = UINT32_C(0x3C);
    m->eax = 0;
    m->edi = m->esi;
    while (m->ecx != 0) {                 /* 463FDA: REP STOSD, not a libcall */
        wr(m, m->edi, m->eax);
        m->edi += m->df ? UINT32_C(0xFFFFFFFC) : UINT32_C(4);
        --m->ecx;
    }
    m->eax = rd(m, UINT32_C(0x01CCFD84));
    m->ebp = 0;
    equal = (m->eax == m->ebp);
    m->edi = m->esi + UINT32_C(0x3C);
    if (equal) goto L464005;

    /* 463FEA: signed JGE; xor-bias avoids implementation-defined int casts. */
    m->ecx = rd(m, m->esp + UINT32_C(0x1C));
    if ((m->ecx ^ UINT32_C(0x80000000)) >= UINT32_C(0x80000002))
        goto L463FF7;
    /* 463FF3 */
    if (m->edx == m->ebp) goto L463FFC;
L463FF7:
    wr(m, m->esi + UINT32_C(8), m->ebp);
    goto L464010;
L463FFC:
    wr(m, m->esi + UINT32_C(8), UINT32_C(1));
    goto L464010;
L464005:
    m->ecx = rd(m, m->esp + UINT32_C(0x1C));
    wr(m, m->esi + UINT32_C(8), UINT32_C(1));

L464010:
    m->ebx = UINT32_C(8);
    equal = (m->eax == m->ebp);
    wr(m, m->esi + UINT32_C(0x0C), m->ebp);
    wr(m, m->esi + UINT32_C(0x14), UINT32_C(4));
    wr(m, m->esi + UINT32_C(0x18), m->ebx);
    if (equal) goto L464038;
    /* 464026 */
    if (m->ecx == UINT32_C(2)) goto L46402F;
    /* 46402B */
    if (m->edx == m->ebp) goto L464038;
L46402F:
    wr(m, m->esi + UINT32_C(0x1C), UINT32_C(1));
    goto L46403B;
L464038:
    wr(m, m->esi + UINT32_C(0x1C), m->ebp);

L46403B:
    m->edx = rd(m, m->esp + UINT32_C(0x20));
    m->eax = rd(m, m->esp + UINT32_C(0x24));
    equal = (m->ecx == UINT32_C(2));
    wr(m, m->esi + UINT32_C(0x20), m->ebx);
    wr(m, m->esi + UINT32_C(0x24), m->ebx);
    wr(m, m->esi + UINT32_C(0x28), UINT32_C(0x20));
    wr(m, m->esi + UINT32_C(0xE8), m->ebp);
    wr(m, m->esi + UINT32_C(0xEC), m->ebp);
    wr(m, m->edi, m->edx);
    wr(m, m->edi + UINT32_C(4), m->eax);
    if (!equal) goto L464097;

    /* 464066: six pushes, right-to-left; stores occur AFTER these pushes. */
    push32(m, m->edi);
    push32(m, m->ebp);
    push32(m, UINT32_C(0x1F));
    m->eax = UINT32_C(0x10);
    push32(m, UINT32_C(0x3E0));
    push32(m, UINT32_C(0x7C00));
    push32(m, m->eax);
    wr(m, m->esi + UINT32_C(4), m->ebp);
    wr(m, m->esi + UINT32_C(0x38), m->eax);
    wr(m, m->esi + UINT32_C(0x1C), m->ebp);
    native_call(m, UINT32_C(0x4188E2), UINT32_C(0x464088));
    m->ecx = rd(m, m->edi);
    m->esp += UINT32_C(0x18);
    m->ecx <<= 1;
    wr(m, m->edi + UINT32_C(8), m->ecx);
    goto L46411E;

L464097:
    push32(m, m->edi);
    push32(m, UINT32_C(0x8000));
    push32(m, UINT32_C(0x1F));
    push32(m, UINT32_C(0x3E0));
    push32(m, UINT32_C(0x7C00));
    push32(m, m->ebx);
    wr(m, m->esi + UINT32_C(4), UINT32_C(1));
    wr(m, m->esi + UINT32_C(0xBC), m->ebp);
    wr(m, m->esi + UINT32_C(0x38), m->ebx);
    native_call(m, UINT32_C(0x4188E2), UINT32_C(0x4640BF));
    m->ecx = rd(m, m->esp + UINT32_C(0x34)); /* Reload arg_8 BEFORE cleanup. */
    m->edx = rd(m, m->edi);
    m->eax = UINT32_C(1);
    m->esp += UINT32_C(0x18);
    equal = (m->ecx == m->eax);
    wr(m, m->edi + UINT32_C(8), m->edx);
    wr(m, m->edi + UINT32_C(0x10), m->eax);
    wr(m, m->edi + UINT32_C(0x14), m->ebx);
    wr(m, m->edi + UINT32_C(0x18), m->eax);
    if (!equal) goto L4640F8;

    /* 4640DD */
    m->eax = UINT32_C(0x100);
    wr(m, m->esi + UINT32_C(0x30), UINT32_C(0x10));
    wr(m, m->esi + UINT32_C(0x34), m->eax);
    wr(m, m->edi + UINT32_C(0x20), m->eax);
    wr(m, m->edi + UINT32_C(0x1C), UINT32_C(0x2000));
    goto L464111;
L4640F8:
    m->eax = UINT32_C(0x10);
    wr(m, m->esi + UINT32_C(0x30), UINT32_C(0x80));
    wr(m, m->esi + UINT32_C(0x34), m->eax);
    wr(m, m->edi + UINT32_C(0x20), m->eax);
    wr(m, m->edi + UINT32_C(0x1C), UINT32_C(0x1000));
L464111:
    m->eax = rd(m, m->esp + UINT32_C(0x14));
    m->ecx = rd(m, m->eax + UINT32_C(0x444));
    wr(m, m->edi + UINT32_C(0x24), m->ecx);

L46411E:
    m->ebx = rd(m, m->esp + UINT32_C(0x18)); /* Reload arg_4; do not reuse it. */
    equal = (rd(m, m->ebx + UINT32_C(0x58)) == m->ebp);
    if (!equal) goto L464146;

    /* 464127: IMUL's low 32 bits, identical for signed/unsigned operands. */
    m->edx = rd(m, m->edi + UINT32_C(8));
    m->edx *= rd(m, m->edi + UINT32_C(4));
    push32(m, m->edx);
    native_call(m, UINT32_C(0x467160), UINT32_C(0x464134));
    m->esp += UINT32_C(4);
    equal = (m->eax == m->ebp);
    wr(m, m->ebx + UINT32_C(0x58), m->eax);
    if (!equal) goto L464146;

    /* 46413E: failure is full EAX = FFFFFFFF, not AL or a Boolean. */
    m->edi = pop32(m);
    m->esi = pop32(m);
    m->ebp = pop32(m);
    m->eax |= UINT32_C(0xFFFFFFFF);
    m->ebx = pop32(m);
    native_ret(m);
    return;

L464146:
    m->eax = rd(m, m->ebx + UINT32_C(0x58));
    m->edi = pop32(m);
    wr(m, m->esi + UINT32_C(0xD8), m->eax);
    m->esi = pop32(m);
    m->ebp = pop32(m);
    m->eax = 0;
    m->ebx = pop32(m);
    native_ret(m);
}
```

## ABI, accesses, and numeric checks

- Five observed DWORD stack arguments at entry ESP+4/+8/+C/+10/+14, referred to as `arg_0` through `arg_10`. Their consumption is respectively context pointer, slot pointer, selector, first dimension, second dimension. These are behavioral descriptions, not established structure types. Plain `RET` leaves argument removal to the caller. Four saved registers use 16 bytes; no local stack frame is allocated.
- At each `0x4188E2` call, six words were pushed. In increasing argument-address order, ordinarily they contain `(16,0x7C00,0x3E0,0x1F,0,descriptor+0x3C)` on selector==2; otherwise `(8,0x7C00,0x3E0,0x1F,0x8000,descriptor+0x3C)`. Actual stack contents remain authoritative if the intervening descriptor writes alias them. Caller removes 24 bytes. Callee's complete prototype and implementation are **not** supplied.
- At `0x467160`, one pushed DWORD is the low-32-bit product of the descriptor's reloaded pitch and second dimension. Caller removes four bytes. No assumption that this is malloc, always fresh memory, zeroed memory, or an unsigned-size API.
- DWORD accesses throughout, including all arguments and globals. No AL/AX operations. C unsigned 32-bit additions, subtraction, multiplication, and fixed shift implement wrap without signed-overflow UB. `JGE` at 463FF1 is signed; its selector comparison is not interchangeable with unsigned `>=2`. The later selector tests are equality to 2 or 1.
- Read global `1CCFD80` **before** clearing the descriptor; read `1CCFD84` **after** clearing it. Retain the first value in EDX. Selector is initially read after clearing, then reloaded only in the non-2 path after the six-word helper call. Context and slot arguments are reloaded late from their stack slots. No cached object fields or argument values are substituted.
- Success re-reads slot+58 and writes it to descriptor+D8, even after storing the call's result into slot+58. Failure does not undo descriptor writes or clear/free any prior state. No validation for null pointers, dimensions, signed values, multiplication overflow, or selector range is present.
- DF=0 gives exactly 60 ascending DWORD zero stores (0xF0 bytes). The branch/control body remains unchanged for DF=1, for which those stores run downward; normal forward-initialization interpretation explicitly assumes the ordinary ABI.

## Coverage and evidence anchors

All paths resolve through these exported block starts: `463FC0,463FEA,463FF3,463FF7,463FFC,464005,464010,464026,46402B,46402F,464038,46403B,464066,464097,4640DD,4640F8,464111,46411E,464127,46413E,464146`. The final RET is 464155, immediately before chunk end 464156. Byte stream contains ordinary instructions across this entire target; the compaction's separate 465720 decoding warning is not applied to 463FC0.

Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g05/`:

1. `0x463FC0.readable/asm-001.txt:1–19`: argument+54 indirection, global order, 60-DWORD REP, signed comparison. `bytes-001.txt:1–3` corroborates entry access `[esp+8]`, REP `F3 AB`, signed JGE `7D`.
2. `0x463FC0.readable/asm-002.txt:3–25`: fixed descriptor fields, separate flag predicate, two dimension stores. `asm-003.txt:1–17`: selector==2 call and postcall doubling from the **reloaded** first dimension.
3. `0x463FC0.readable/asm-003.txt:18–25` and `asm-004.txt:1–23`: alternate helper arguments, live stack selector reload, 1-versus-other table-size constants and write order.
4. `0x463FC0.readable/asm-004.txt:24–25` and `asm-005.txt:1–4`: context+444 load then late slot reload and existing-buffer test.
5. `0x463FC0.readable/asm-005.txt:5–18`: two-operand IMUL, one-word call, publication before failure decision, full EAX failure. `bytes-001.txt:12–13` corroborates IMUL `0F AF`, zero comparison, store, OR EAX,-1 and RET.
6. `0x463FC0.readable/asm-005.txt:19–25` and `asm-006.txt:1`: second slot+58 read, descriptor+D8 publication and EAX=0; `metadata.json:11–164` supplies all 21 blocks, `:166–176` sole frozen caller at 4650B7 within 464F70 and the two direct targets.

## Interpretation, uncertainty, and validation status

Provisional descriptive role: **initialize a slot-associated format/buffer descriptor and obtain/reuse its backing-buffer handle**. Confidence is high for that numeric/dataflow description, lower for pixel-format business terminology. Proposed evidence-based name: `InitSlotFormatAndBackingBuffer`. Independent proofs are (a) slot+54 indirection, 0xF0-byte clear and mode-dependent width/mask/table fields, and (b) conditional one-word request followed by slot+58 and descriptor+D8 publication. The frozen caller context in `common-compaction.md:17–18` independently describes a slot+54 0xF0 allocation and slot+58 current-pixels field. This does not turn either helper's historical label into a proven full implementation.

Unresolved: complete helper contracts and possible nonordinary ABI behavior; concrete record types; meanings of globals 1CCFD80/84; valid selector/dimension domain; ownership and lifetime of returned addresses; guaranteed nonaliasing or concurrency restrictions. The C preserves the available accesses rather than assuming answers. For conventional returns/EBP=0, statuses are EAX=0 or EAX=FFFFFFFF (-1); EFLAGS and undocumented callee flag dependencies are outside the stated lifting interface.

Performed: source-level, instruction/byte/CFG comparison against every supplied slice. **Not performed:** compilation, execution, unit tests, differential tests, live inspection, independent packet-hash recomputation, or supervisor §5.6 validation. Requested parent validation: compile the adapter-based C; compare both returns, signed selectors (including negative and >=2), helper-mutated stack/object aliases, buffer-present/zero-result paths, wraparound pitch/product, and native callee ABI/flag assumptions. These are requests, not PASS claims. Output hash left to the parent.
