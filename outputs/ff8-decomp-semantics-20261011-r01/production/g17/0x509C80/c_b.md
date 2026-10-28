# 0x00509C80 — independent C B

## Identity and input provenance

- Mission: `ff8-decomp-semantics-20261011-r01`; group `g17`; role C B, 2+1.
- Worker/session/task: `pool-207` / `ses_ecf1049c8ffeaKiyfjITTNMcHJ` / `task_mv44sfzh_00bf_tkcidl`.
- Admission model: `openai/gpt-6-astra`, `xhigh`, as attested by the lead's INPUT-ADMISSION-HARDENING-v1 message. The historical task's Sol mention is not the current admission reference.
- Independent factual checkpoint: source `ses_ed41fc6c0ffeWZh5hkKIUXKy89`, revision 2, EXCLUSIVE before `msg_12be1cd49001BowbZIVfuXq4cy`, per lead attestation. No peer production, other volet, target ledger, prior target C, IDB, or external session was consulted.
- Input directory: `inputs/ff8-decomp-semantics-20261011-r01/g17/0x509C80.readable/`. Read the entire `manifest.json`, `asm-001.txt` (25 lines), `asm-002.txt` (5 lines), `bytes-001.txt` (3 lines), and `metadata.json` (109 lines), plus `../common-compaction.md` (38 lines).
- Manifest SHA256, attested by lead: `f0b42bbb8338cdcc5e0640295bf7edbe92a1246a4c982092681e5281e21508a2`.
- Original packet SHA256, manifest line 4 / lead attestation: `2b5b3b9a757e4613d03a108e0bbbeccbba9a8ab8575582609814aa12d8792b32`.
- Common compaction SHA256, manifest line 5 / lead attestation: `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.
- EXE SHA256, metadata line 8: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; 32-bit export dated `2026-10-11T16:38:25.140966+00:00`.

Hashes above are cited, not independently recalculated. Semantic names and comments in the input are historical annotations, not evidence for a C prototype or purpose.

## ABI and representation

The observed entry consumes one DWORD argument at entry ESP+4. `PUSH ESI` followed by `8B 74 24 08` accesses that argument. ESI is saved/restored on every path. Both exits use plain `RET`. There is no local stack allocation.

Two direct native calls are present:

| Site | Bytes / destination | Explicit stack arguments in C order | Cleanup |
|---|---|---|---|
| `00509C8C` | `E8 7F FF FF FF` → `00509C10` | `(actor)` | `ADD ESP,4` at `00509C94` |
| `00509CB9` | `E8 F2 BF FF FF` → `00505CB0` | `(actor, eax_from_00509C10)` | `ADD ESP,8` at `00509CBE` |

For the second call, `PUSH EAX` precedes `PUSH ESI`: right-to-left argument setup. These are caller-cleanup/cdecl-compatible **call-site observations**, not authenticated helper C declarations. The helper bodies and full ABI contracts are not supplied.

No uniform native C return type is established. The entry gate returns with incoming EAX untouched; the two paths without the second call retain the first call's full EAX; the second-call path retains that call's EAX. Returning zero, returning a Boolean, or zero-extending an assumed helper byte result would invent behavior.

Accordingly the complete C below is an explicit register-value/address-space model, not a drop-in native-ABI replacement. Its extra model parameters are **not original stack arguments**. Native EAX is represented by `r->eax`, rather than by imposing a false native C return contract. ECX, EDX and the ESI save/restore are also represented. EFLAGS, physical stack bytes, EBX/EBP/EDI, exceptions, and instruction timing are outside this C model. The stack accounting is given separately below.

`mem[a]` denotes guest byte address `a`, not an actor structure or a domain-specific field. Supply a byte-addressed backing view valid for the addresses actually touched, disjoint from `r`. The native 32-bit pointer at actor+0x74 is decoded as little-endian. Memory helpers below are local translation operations, **not extra calls found in the executable**.

The two `bridge_...` declarations denote exactly the two observed native callees. They are opaque boundary interfaces, not additional game callees, guessed callee implementations, or declarations of their genuine C types. An integration adapter must execute/model the indicated callee, expose its EAX/ECX/EDX results, preserve the observed nonvolatile ESI convention, and apply its real memory effects. No body or invented no-op implementation is supplied for either external callee.

## Complete C body

```c
#include <stdint.h>
#include <limits.h>

_Static_assert(CHAR_BIT == 8, "byte-addressed x86 model");
_Static_assert(sizeof(uint32_t) == 4, "32-bit x86 register values");

typedef struct X86ValueState {
    uint32_t eax;
    uint32_t ecx;
    uint32_t edx;
    uint32_t esi;
} X86ValueState;

/* Only these two external native call boundaries occur in this target.
 * r and mem are adapter context, NOT native arguments. arg0/arg1 below
 * are the explicit DWORD stack arguments observed at the call sites.
 */
extern void bridge_00509C10(X86ValueState *r, volatile uint8_t *mem,
                           uint32_t arg0);
extern void bridge_00505CB0(X86ValueState *r, volatile uint8_t *mem,
                           uint32_t arg0, uint32_t arg1);

static uint8_t guest_read8(volatile uint8_t *mem, uint32_t address)
{
    return mem[address];
}

static void guest_write8(volatile uint8_t *mem, uint32_t address,
                         uint8_t value)
{
    mem[address] = value;
}

static uint32_t guest_read32le(volatile uint8_t *mem, uint32_t address)
{
    const uint32_t b0 = guest_read8(mem, address);
    const uint32_t b1 = guest_read8(mem, (uint32_t)(address + UINT32_C(1)));
    const uint32_t b2 = guest_read8(mem, (uint32_t)(address + UINT32_C(2)));
    const uint32_t b3 = guest_read8(mem, (uint32_t)(address + UINT32_C(3)));
    return (uint32_t)(b0 | (b1 << 8) | (b2 << 16) | (b3 << 24));
}

/* Value/effect model of [0x00509C80, 0x00509CC3).
 * actor_arg is the single original DWORD argument.
 * On return, r->eax is the raw native EAX value, including its unchanged
 * incoming value when actor[4] >= 0x10.
 */
void model_00509C80(X86ValueState *r, volatile uint8_t *mem,
                   uint32_t actor_arg)
{
    const uint32_t saved_esi = r->esi;             /* 509C80 */
    r->esi = actor_arg;                           /* 509C81 */

    /* CMP byte / JNB: unsigned comparison, not a signed char test. */
    if (guest_read8(mem, (uint32_t)(r->esi + UINT32_C(4))) >= 0x10u)
        goto common_epilogue;                    /* 509C85..509C89 */

    bridge_00509C10(r, mem, r->esi);               /* 509C8B..509C8C */
    /* Reload AFTER the first call; it may have changed actor+0x74. */
    r->ecx = guest_read32le(mem,
                           (uint32_t)(r->esi + UINT32_C(0x74)));
                                                   /* 509C91..509C94 */
    r->edx = (r->edx & UINT32_C(0xffffff00)) |
             (uint32_t)guest_read8(mem,
                           (uint32_t)(r->ecx + UINT32_C(3)));
                                                   /* MOV DL, 509C97 */
    if ((uint8_t)r->edx != 0u) {                  /* 509C9A..509C9C */
        uint32_t neg_cf;
        uint32_t new_dl;

        r->edx = UINT32_C(0);                     /* XOR EDX, 509C9E */
        r->esi = saved_esi;                       /* POP ESI, 509CA0 */
        r->edx = (uint32_t)guest_read8(mem, r->ecx);
                                                   /* MOV DL, 509CA1 */
        r->edx = (uint32_t)(r->edx - r->eax);      /* SUB EDX, 509CA3 */

        /* NEG sets CF iff its full 32-bit input was nonzero.
         * This is NOT the borrow flag produced by the preceding SUB.
         */
        neg_cf = (r->edx != UINT32_C(0)) ? UINT32_C(1) : UINT32_C(0);
        r->edx = (uint32_t)(UINT32_C(0) - r->edx); /* NEG EDX, 509CA5 */

        /* SBB DL,DL replaces just the low byte; upper EDX survives. */
        new_dl = (uint32_t)(uint8_t)(UINT32_C(0) - neg_cf);
        r->edx = (r->edx & UINT32_C(0xffffff00)) | new_dl;
                                                   /* 509CA7 */
        r->edx &= r->eax;                         /* AND EDX, 509CA9 */
        guest_write8(mem, (uint32_t)(r->ecx + UINT32_C(3)),
                     (uint8_t)r->edx);           /* MOV [...],DL, 509CAB */
        return;                                  /* RET, 509CAE */
    }

    r->edx = UINT32_C(0);                         /* XOR EDX, 509CAF */
    r->edx = (uint32_t)guest_read8(mem, r->ecx);    /* MOV DL, 509CB1 */
    if (r->edx != r->eax) {                       /* CMP/JZ, 509CB3..509CB5 */
        const uint32_t arg1 = r->eax;             /* PUSH EAX, 509CB7 */
        const uint32_t arg0 = r->esi;             /* PUSH ESI, 509CB8 */
        bridge_00505CB0(r, mem, arg0, arg1);       /* CALL, 509CB9 */
        /* 509CBE discards those two DWORD arguments, not EAX. */
    }

common_epilogue:
    r->esi = saved_esi;                           /* POP ESI, 509CC1 */
    return;                                      /* RET, 509CC2 */
}
```

No library call is substituted for either native call. The fixed shifts in `guest_read32le` implement the input's little-endian DWORD load; the target itself has no shift instruction. This byte-backed model does not claim the four byte reads have the atomicity/fault behavior of one native DWORD read. It assumes ordinary valid memory without concurrent modification/MMIO. A native integration must retain the actual DWORD load where those properties matter.

## Widths, arithmetic, and observable effects

- The entry comparison is unsigned BYTE `< 0x10`; `0x80..0xFF` take the exit. There is no signed-byte extension anywhere in this target.
- `MOV ECX,[ESI+74h]` is a DWORD/pointer load. It occurs after `00509C10`, not before. No null-pointer checks are present or added.
- Both reads of `[ECX]` follow `XOR EDX,EDX`, so they zero-extend a BYTE into the full register. The comparison at `00509CB3` is against **all 32 bits of EAX**.
- `SUB EDX,EAX` and `NEG EDX` wrap modulo 2^32; no signed C overflow is required. `SBB DL,DL` consumes NEG's CF and updates only DL. In particular, it must not be modeled as `EDX = -CF`, which would overwrite the upper 24 bits.
- With `v = zero_extend(state[0])` and `a = full first-call EAX`, the nonzero-state[3] path leaves `EDX = (((a-v) mod 2^32 & 0xffffff00) | (a != v ? 0xff : 0)) & a`. The written BYTE is `(a != v) ? low8(a) : 0`, **not** a Boolean. A differing EAX with low byte zero still writes zero. The C deliberately retains the full partial-register sequence rather than assuming a small range of helper return values.
- The first-helper return is neither masked to AL nor sign/zero-extended from an inferred return type. No AX operand occurs. DL is the only byte subregister written by the target; EAX itself is never assigned except through the native calls.
- The only explicit target memory write is BYTE `[loaded_pointer+3]` at `00509CAB`, on the initially nonzero-byte path. The zero-byte path makes the second call only on full-DWORD inequality. No explicit globals are addressed. Callee effects are opaque, not declared absent.
- All guest address calculations in the model wrap to 32 bits. Actor/state layout, allocation extent, validity, and aliasing are not inferred beyond the observed offsets and access widths.

## Complete chunk/block and stack coverage

The three byte lines contain 32 + 32 + 3 = 67 bytes: one contiguous half-open chunk `[00509C80,00509CC3)`. It has 30 instructions and six CFG blocks. There are no exported out-of-line chunks or jump-table dependencies for this function. The boundaries and count agree with metadata lines 11–52,108 and common-compaction line 14. All 30 ASM lines are represented above.

| Block (half-open) | Instructions | C coverage |
|---|---:|---|
| `[509C80,509C8B)` | 4 | Save/load ESI; unsigned byte gate to common epilogue |
| `[509C8B,509C9E)` | 7 | First native call; pointer reload; DL load/test |
| `[509C9E,509CAF)` | 9 | Zero EDX; early ESI restore; SUB/NEG/SBB/AND; byte store; early return |
| `[509CAF,509CB7)` | 4 | Zero-extended byte/full EAX equality test |
| `[509CB7,509CC1)` | 4 | Second call with two DWORD arguments; cleanup |
| `[509CC1,509CC3)` | 2 | Common ESI restore and return |

Let entry ESP be S (return address at S, actor at S+4). ESI save makes ESP S-4. The first call has one pushed argument (ESP S-8 before CALL); after its plain-return/caller-cleanup convention, `ADD ESP,4` restores S-4. On the nonzero-byte path `POP ESI` at `509CA0` restores S before the later arithmetic/store; RET consumes the original return address. On the other path the second call's two pushes reach S-12 before CALL; `ADD ESP,8` restores S-4. The common POP restores S, then RET consumes the return address. Every exit restores ESI and leaves the caller's original argument for caller cleanup. The model keeps the early ESI restoration distinct; it does not move it after the store.

## Evidence and limits

Primary instruction references are `asm-001.txt:1–25`, `asm-002.txt:1–5`, and `bytes-001.txt:1–3` in the input directory above. In particular:

1. `807E0410 7336` at `509C85..89`: byte width, unsigned JNB, destination `509CC1`.
2. `E87FFFFFFF` at `509C8C` and `8B4E74` at `509C91`: actual first target `509C10`, followed by the pointer reload.
3. `33D2 5E 8A11 2BD0 F7DA 1AD2 23D0 885103 C3` at `509C9E..AE`: full EDX reset, early POP, exact carry/partial-register sequence and sole byte store.
4. `33D2 8A11 3BD0 740A` at `509CAF..B5`: zero-extension, full-width comparison, skip-call branch.
5. `50 56 E8F2BFFFFF 83C408 5E C3` at `509CB7..C2`: argument order, second target `505CB0`, cleanup and common exit.

The frozen metadata records eight incoming code xrefs (`metadata.json:54–103`), including one without a containing function, but does not provide complete caller bodies or prove use/non-use of EAX at return. The common compaction explicitly says that native packets for `509C10` and `505CB0` are absent (`common-compaction.md:26,38`). Their purpose, complete types, hidden-register conventions, memory effects, return-value ranges, and raw clobbers remain unresolved. The bridge contract above is an explicit integration requirement, not a claim that those missing facts were validated. No body can safely be invented from the label or the historical range comment.

Checks performed: read all supplied target ASM/bytes/metadata; manually reconciled the chunk length, six blocks, 30-instruction coverage, branch destinations, direct-call displacements, unsigned widths, carry dataflow, and stack balance. No assembler/disassembler tool, compiler, execution harness, tests, live run, ABI probe, or hash recomputation was executed. Independent byte review, callee-ABI confirmation, compilation/adapters and differential tests belong to the lead/reconciler. Suggested test axes are byte-4 values `0x0f/0x10/0xff`, both state-byte-3 branches, full-EAX equality versus equal low bytes only, wraparound EAX values, low-byte-zero unequal EAX, helper mutation of actor+0x74, and the untouched incoming EAX on the entry-gate exit. These are requests, not PASS results.

Deposit only; no semantic verdict, integration, promotion, or final validation is asserted.
