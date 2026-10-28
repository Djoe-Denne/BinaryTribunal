# 0x463FC0 — C R, reconciled against the frozen native evidence

## Provenance and scope

Target **0x463FC0 only**, C reconciliation task `task_mv44rk70_006z_op2cpf`, author `c-r-463fc0`. Read only the supplied C projection and common instructions; no semantic-volet output, historical target verdict, index, IDA, executable service, or other production was consulted. Context Mode is absent from the tool catalog; used the explicitly permitted bounded file reads instead.

The parent manifest deposits two authors with distinct native sessions:

| Author | Native session | Recorded effective model | Deposited SHA-256 |
|---|---|---|---|
| A | `ses_ed3d00d18ffeCfdIXJZDjABx6G` | `openai/gpt-6-astra`, high | `c31322788b7e0ab4909a6389af7ddb7c55695050a37ed6e72604052291c4e57d` |
| B | `ses_ed3d00a47ffeumEE1gxzeQD5fx` | `openai/gpt-6.1-sol`, high | `41e84b88225f28540cc2d49dd0776326b67595fc535e4585cd574933e3529584` |

Source provenance: native export `2026-10-11T16:38:25.140966+00:00`, 32-bit input `FF8_EN.exe`, input executable SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, IDB source `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`. Packet SHA-256 `d50c7dd68e7420c7cf455a100d15735f8e6a6d5fd522533cbbb6283994602291`; common compaction SHA-256 `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`.

Read A and B completely, common compaction, original packet, `native-manifest.json`, all six `native-asm-*` slices, the entire `native-bytes-001.txt`, and complete `native-metadata.json`. The original JSON assembly line was display-truncated by the file tool: **it was not used as assembly evidence**. Its complete verbatim assembly projection, all 126 lines, and complete byte projection were used instead; no missing portion was inferred from a truncated JSON string. CFG/xrefs were taken from complete native metadata. Packet chunk hex was also fully visible.

Recorded hashes agree across the reconciliation manifest, native manifest and the authors' citations; neither author is missing and no recorded hash contradiction was found. No independent file-byte hashing interface is available within this role's allowed tools. These are **recorded**, not recomputed, hashes; parent must compute/check input and output hashes. No cryptographic PASS is claimed.

Coverage: sole chunk `[0x00463FC0,0x00464156)`, **406 bytes, 126 instructions, 21 CFG blocks, both returns**. Reconciliation is complete for normal-return execution of this chunk under the adapter contract below, not native final acceptance.

## A/B reconciliation and common-error check

| Topic | A / B | Native adjudication and R decision |
|---|---|---|
| Control structure | A uses block labels; B structured predicates | Both preserve the CFG. Keep labels to expose all 21 native blocks. In particular 463FF1 is signed JGE, whereas 464029 and 464064 depend on equality to 2. No averaging of these tests. |
| Signed comparison | A uses sign-bit bias; B uses sign-bit test plus unsigned comparison | Equivalent for all 32-bit patterns. Bytes `83 F9 02 7D 04` at 463FEE–463FF2 prove signed `>=2`. R uses B's explicit predicate, including negative selector bit patterns. |
| Memory representation | A supplies one-DWORD transfer callbacks; B implements transfers as four host byte accesses | The target uses DWORD operations, including REP STOSD. R selects ordered one-DWORD adapters, not an apparent byte-store translation. B's representation is valid only within its stated nonfaulting plain-RAM abstraction; it is not a hardware atomicity/fault model. |
| Return representation | A returns through EAX in machine state; B also returns a host `uint32_t` | Both model the same full EAX32. R provides both machine RET state and the host EAX result. 464141 is `OR EAX,-1`, not AL, AX, or a Boolean. |
| Name/role | A proposes slot format/backing buffer; B proposes page pixel format/pixels | Local evidence proves descriptor initialization and conditional acquisition/reuse/publication of a backing value. Pixel/page interpretation has additional supplied caller-document support but neither label proves it. Use the narrower `InitSlotFormatAndBackingBuffer`; renderer/backend, original enum and helper identity remain UNCERTAIN. |
| Shared assumptions | Both use opaque native-call bridges, omit arithmetic EFLAGS, and describe an allocation-failure path | Re-derived every memory transfer and live branch predicate. No local instruction-level dataflow error found in either candidate under ordinary cdecl. Strengthen qualifications: the second helper is an **opaque acquisition call**, not proven malloc; zero-result failure assumes EBP remains zero under cdecl. Neither candidate is a complete arbitrary-EFLAGS, fault-restart or hostile-return-address emulator. |

Agreement was not treated as proof. Independent checks included the global read/clear ordering, signed branch opcode, three relative call displacements, stack offsets before versus after cleanup, low32 IMUL, non-2-path selector reload, omitted mode-2 field stores, and the POP EDI **before** descriptor+D8 publication. Do not simplify these into cached struct/argument accesses: aliasing can change observable behavior. In particular a returned value is stored into slot+58 **before** the saved zero predicate controls failure, and success reads slot+58 again.

## Complete reconciled C11

This is an address-based C lifting, **not** a proposed native helper prototype, linkable ABI thunk, or recovered host struct. Native function arguments are five DWORD stack slots at entry ESP+4/+8/+C/+10/+14 (context, slot, selector, dimension0, dimension1). Plain RET and explicit cleanup of each call establish ordinary cdecl use. No null, range, overflow or allocation guard is added.

Adapter contract:

- `load32` and `store32` implement one ordered little-endian DWORD transfer at a wrapped 32-bit virtual start address, including unaligned addresses; all stack/global/object accesses use the same memory. They do not modify modeled CPU registers or environment. No hidden null/bounds guard, caching, `restrict`, or deferred write is allowed. Hardware faults, access spanning an unmapped/segment boundary, interrupts and concurrency are outside this normal-completion lifting.
- `invoke` executes exactly the specified native entry, using the actual modeled stack containing the pushed return address and argument words; it returns after the callee's ordinary native RET to the continuation. It exposes register, stack, memory and environment effects and does not remove caller-owned arguments. Only the two entries in the native packet may be dispatched. It is an analysis bridge, not an additional game call or an invented helper implementation.
- `native_environment` carries the unchanged external x87/SSE environment and any bridge state. There are **no x87 instructions** in this chunk and no imposed FP control-word/rounding/precision setting. Callee environment effects must remain visible through the bridge.
- `df` is the actual direction flag. cdecl ordinarily requires DF=0; the C also retains DF=1 REP behavior. Arithmetic flags are represented only by their live local predicates. Undocumented callee dependence on incoming arithmetic EFLAGS or arbitrary caller observation of final EFLAGS requires a fuller instruction emulator; that behavior is not claimed here. Ordinary cdecl does not pass such flags as arguments.
- Execution assumes ordinary 32-bit flat data/stack addressing and that each native call returns to its stated continuation. Aliases affecting argument/saved-register/return slots are kept as memory accesses, but a corrupted PC causing control to leave this chunk is outside this C's control-flow contract.

```c
#include <stdint.h>

typedef uint32_t U32;
_Static_assert(sizeof(U32) == 4, "32-bit words required");

typedef struct X86_463FC0 X86_463FC0;
struct X86_463FC0 {
    U32 eax, ebx, ecx, edx, esi, edi, ebp, esp, eip;
    unsigned df;
    void *memory;
    void *native_environment;
    U32  (*load32)(void *memory, U32 address);
    void (*store32)(void *memory, U32 address, U32 value);
    void (*invoke)(X86_463FC0 *machine, U32 native_entry);
};

static U32 rd(X86_463FC0 *m, U32 address)
{
    return m->load32(m->memory, address);
}
static void wr(X86_463FC0 *m, U32 address, U32 value)
{
    m->store32(m->memory, address, value);
}
static void push32(X86_463FC0 *m, U32 value)
{
    m->esp -= UINT32_C(4);
    wr(m, m->esp, value);
}
static U32 pop32(X86_463FC0 *m)
{
    U32 value = rd(m, m->esp);
    m->esp += UINT32_C(4);
    return value;
}
static void call32(X86_463FC0 *m, U32 target, U32 continuation)
{
    push32(m, continuation);
    m->eip = target;
    m->invoke(m, target); /* Through native RET; no caller cleanup here. */
}
static int signed_ge_two(U32 value)
{
    return (value & UINT32_C(0x80000000)) == 0
        && value >= UINT32_C(2);
}

U32 re_00463FC0(X86_463FC0 *m)
{
    int equal;

    /* 463FC0: entry ESP addresses the caller's return PC. */
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
    while (m->ecx != 0) { /* 463FDA: sixty STOSD transfers. */
        wr(m, m->edi, m->eax);
        m->edi += m->df ? UINT32_C(0xFFFFFFFC) : UINT32_C(4);
        --m->ecx;
    }
    m->eax = rd(m, UINT32_C(0x01CCFD84));
    m->ebp = 0;
    equal = (m->eax == m->ebp);
    m->edi = m->esi + UINT32_C(0x3C);
    if (equal) goto L464005;

    /* 463FEA */
    m->ecx = rd(m, m->esp + UINT32_C(0x1C));
    if (signed_ge_two(m->ecx)) goto L463FF7;
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

    /* 464066: pushes precede the three descriptor stores. */
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
    call32(m, UINT32_C(0x4188E2), UINT32_C(0x464088));
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
    call32(m, UINT32_C(0x4188E2), UINT32_C(0x4640BF));
    m->ecx = rd(m, m->esp + UINT32_C(0x34));
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
    m->ebx = rd(m, m->esp + UINT32_C(0x18));
    equal = (rd(m, m->ebx + UINT32_C(0x58)) == m->ebp);
    if (!equal) goto L464146;

    /* 464127: low 32 bits of the IMUL, with no overflow test. */
    m->edx = rd(m, m->edi + UINT32_C(8));
    m->edx *= rd(m, m->edi + UINT32_C(4));
    push32(m, m->edx);
    call32(m, UINT32_C(0x467160), UINT32_C(0x464134));
    m->esp += UINT32_C(4);
    equal = (m->eax == m->ebp);
    wr(m, m->ebx + UINT32_C(0x58), m->eax);
    if (!equal) goto L464146;

    /* 46413E */
    m->edi = pop32(m);
    m->esi = pop32(m);
    m->ebp = pop32(m);
    m->eax |= UINT32_C(0xFFFFFFFF);
    m->ebx = pop32(m);
    m->eip = pop32(m); /* 464145: RET, no argument removal. */
    return m->eax;

L464146:
    m->eax = rd(m, m->ebx + UINT32_C(0x58));
    m->edi = pop32(m);
    wr(m, m->esi + UINT32_C(0xD8), m->eax);
    m->esi = pop32(m);
    m->ebp = pop32(m);
    m->eax = 0;
    m->ebx = pop32(m);
    m->eip = pop32(m); /* 464155: RET. */
    return m->eax;
}
```

All arithmetic register/address operations are unsigned 32-bit operations, giving modulo-2^32 wrap on the intended host. Two-operand signed IMUL and unsigned multiplication have identical low 32 bits. SHL uses the literal count 1, so neither a variable-count rule nor a signed shift is introduced. All target data accesses and registers are full DWORDs; **no AL/AX partial writes** occur. The 8-bit PUSH immediates in the byte stream sign-extend to DWORDs (here 0x1F); `83 C8 FF` is a full-EAX OR with sign-extended -1.

Ordinary arguments to 4188E2, in increasing address order above its return address, are `(16,0x7C00,0x3E0,0x1F,0,descriptor+0x3C)` for selector==2; otherwise `(8,0x7C00,0x3E0,0x1F,0x8000,descriptor+0x3C)`. These are descriptions of the pushes, **not prototypes or immutable snapshots**: descriptor stores between PUSH and CALL may alias these stack words. Caller cleanup is 0x18. The 467160 call has one word, low32(reloaded nested+8 * reloaded nested+4), with caller cleanup 4. Both call bridges expose the callees rather than substituting algorithms.

## Semantic contract and exact evidence

**Proposed name:** `InitSlotFormatAndBackingBuffer`.

**Role:** initialize the descriptor selected by the incoming slot's DWORD at +54, select numeric format/layout fields from the selector and two sampled globals, and reuse or acquire a backing value recorded at the late-reloaded slot+58. On success publish that backing value at the originally selected descriptor+D8. High confidence in the local numeric/dataflow contract; medium confidence in pixel-format/page terminology from the supplied caller documentation. Complete helper semantics, renderer/backend identity, valid enum range and ownership remain **UNCERTAIN**, not CERTAIN by A=B.

**Inputs/effects:** five cdecl DWORD slots; global 1CCFD80 read before the clear, global 1CCFD84 after it; DF-dependent 60-DWORD zeroing; descriptor and stack mutations in precisely the lifted order; two alternative six-word calls to 4188E2 and optional one-word call to 467160. Non-2 path rereads the selector after the helper and copies the late-loaded context+444 to descriptor+60. Slot pointer is separately reread late. For conforming callees preserving EBP=0, return EAX is 0 on success, FFFFFFFF when the acquisition result is zero. Failure retains all preceding stores, writes the zero result to slot+58, and skips final descriptor+D8 publication. No free/rollback or dimension/product validation exists.

Seven exact native/xref anchors (paths relative to the deposited C projection):

1. **463FC0/463FC7/463FCA/463FDA/463FDC**, `native-asm-001.txt:1–12`, `native-bytes-001.txt:1–2`: `[ESP+8]` selects slot, `[EAX+54]` selects descriptor, global-before-clear, `B9 3C 00 00 00` and `F3 AB` clear sixty DWORDs, then the second global load. Independent proof of descriptor initialization, not inferred from its label.
2. **463FEE–463FF5 and 464015–464038**, `native-asm-001.txt:18–21`, `native-asm-002.txt:4–15`, bytes lines 2–4: signed JGE `7D 04` for the first flag versus equality-only and global tests for the second. The predicates must not be unified into an assumed selector range.
3. **46403B/46403F/464066–464092**, `native-asm-002.txt:16–25`, `native-asm-003.txt:1–17`, bytes lines 5–7: dimensions stored at descriptor+3C/+40; masks 7C00/3E0/1F and 16-word parameter; `E8 5A 48 FB FF` at 464083 resolves to **4188E2**; fresh dimension read followed by `D1 E1` puts twice its low32 value at descriptor+44. Supports numeric format/layout interpretation independently of names.
4. **464097–4640DB**, `native-asm-003.txt:18–25`, `native-asm-004.txt:1–12`, bytes lines 7–9: alternate pushes include 8000 and 8; `E8 23 48 FB FF` at 4640BA also resolves to **4188E2**; `[ESP+34]` reload at 4640BF precedes cleanup and the selector==1 predicate is captured before nested stores.
5. **4640DD–46411B**, `native-asm-004.txt:13–25`, `native-asm-005.txt:1`, bytes lines 9–11: mode-1 fields 16/256/256/2000 versus other fields 128/16/16/1000, followed by `[ESP+14]`, `[EAX+444]`, nested+24 store. These explicit stores are absent on the mode-2 branch; no inferred guard or extra context read.
6. **46411E–46413C**, `native-asm-005.txt:2–12`, bytes lines 11–12: late slot reload, slot+58 test, `0F AF 57 04` low32 product, `E8 2C 30 00 00` at 46412F resolves to **467160**, result publication before failure branch. Independent proof of conditional backing acquisition/reuse, without proving allocator identity.
7. **46413E–464155**, `native-asm-005.txt:13–25`, `native-asm-006.txt:1`, bytes line 13: `83 C8 FF`/`C3` failure; success re-read, POP EDI, descriptor+D8 store, `33 C0`/`C3`. `native-metadata.json:166–176` supplies the single frozen caller at **4650B7 in 464F70** and the two targets. `common-compaction.md:18` separately records validated caller slot+54 allocation span F0 and slot+58 current-pixels field; documentary support only, not a new audit of that caller.

For DF=0, initialized descriptor span is [descriptor,descriptor+F0), matching caller-document allocation size F0. For DF=1 the sixty transfers descend from descriptor instead; no claim of a forward-clear span in that case.

CFG coverage, each block represented above: `463FC0, 463FEA, 463FF3, 463FF7, 463FFC, 464005, 464010, 464026, 46402B, 46402F, 464038, 46403B, 464066, 464097, 4640DD, 4640F8, 464111, 46411E, 464127, 46413E, 464146`. Final instruction 464155 ends exactly at the chunk's exclusive end 464156. The compaction warning about a different EA's decode is not a defect in this target's ordinary instruction stream.

## Limits and parent validation

Residual risks: opaque helpers and actual ABI behavior; exact field/global business meanings; dimensions with negative bit patterns/zero/product wrap; descriptor/global/stack/slot aliases; callee mutation of arguments and memory; allocation ownership/lifetime; fault/segment/MMIO/concurrent behavior; arithmetic EFLAGS and unexpected control-flow transfer at call/RET. In ordinary cdecl the helpers preserve EBX/EBP/ESI/EDI, but the lifting exposes those registers rather than fabricating a callee implementation. If a helper violates callee-save behavior, local comparisons still use its actual returned EBP; the simplified zero-result semantic sentence then no longer applies.

Performed: manual instruction/byte/CFG reconciliation and all recorded provenance/hash cross-checks described above. **Not performed:** independent hashing, compilation, execution, tests, native PE comparison, live/native §5.6, mutation, integration or promotion. Parent owns final native §5.6 and must compute hashes and validate the bridge/ABI. Suggested checks: negative selectors and selectors 0/1/2/3; preexisting backing versus zero/nonzero acquisition result; overflow pitch/product; helper-mutated selector/slot/context stack slots; descriptor aliases with globals/stack/backing fields; saved-register alias during POP-before-publication. These are proposed checks, not PASS results. No native promotion request is implied by completion of R.
