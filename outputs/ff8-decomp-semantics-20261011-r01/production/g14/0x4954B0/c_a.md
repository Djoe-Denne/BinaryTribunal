# 0x004954B0 — independent C A

## Scope and provenance

- Mission: `ff8-decomp-semantics-20261011-r01`; group `g14`; task `task_mv44se4p_00aq_66iml4`; author `pool-182`; role C A, 2+1.
- Reconstructed only this target from its frozen bytes/ASM. No peer production, target historical C, target ledger, other-volet result, IDB, or live state was read. Names/comments in the export are not semantic evidence.
- Input directory `I = inputs/ff8-decomp-semantics-20261011-r01/g14/`.
- `I/0x4954B0.readable/manifest.json:3-6` cites original packet SHA-256 **`0d3ae552496212fc6656e5c02fe6db6830acc5b6b35ab41b58a693811db60ac6`** and common-compaction SHA-256 **`1972f7b1c746b0faf2526a5bbd825130cf653de28074b5ba617852d5661d6c0c`**. These hashes are cited from the supplied manifest, not independently recomputed by this author.
- `I/0x4954B0.json:4-16`: 32-bit image; input EXE SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; export `2026-10-11T16:38:25.140966+00:00`; one chunk **[0x004954B0, 0x0049552F)**, **127 bytes**.
- Full readable ASM: `I/0x4954B0.readable/asm-001.txt:1-25` and `asm-002.txt:1-19`: **44 instructions**. Raw bytes: `bytes-001.txt:1-4`. Metadata: `metadata.json:11-61`, seven CFG blocks. `I/common-compaction.md` was also read; its historical annotations were not substituted for native instructions.

## Complete C

This is a C11 **32-bit x86, fixed-VA native-memory lift**, not a portable host simulation. All addresses are calculated as unsigned 32-bit bit patterns before conversion to native pointers. The only call is bound to the observed native target `0x0047EEB0`; its body is not invented. The full outgoing EAX is returned, without claiming that callers use it as a semantic result.

```c
#include <stdint.h>
#include <limits.h>

#if defined(_MSC_VER) && defined(_M_IX86)
#  define FF8_CDECL __cdecl
#elif (defined(__GNUC__) || defined(__clang__)) && defined(__i386__)
#  define FF8_CDECL __attribute__((cdecl))
#else
#  error This lift requires a 32-bit x86 C ABI.
#endif

_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(uint32_t) == 4, "32-bit dwords required");
_Static_assert(sizeof(uintptr_t) == 4, "32-bit native addresses required");

/* Volatile prevents removal, coalescing, or reuse of the observed byte accesses.
 * This is not a claim that the original storage is MMIO or thread-atomic. */
#define FF8_U8_AT(a) \
    (*(volatile uint8_t *)(uintptr_t)(uint32_t)(a))

/* A call-site binding, not an inferred implementation/prototype for the
 * callee's internal logic. EAX is observed as all 32 result bits. */
typedef uint32_t (FF8_CDECL *ff8_0047EEB0_fn)(uint32_t slot_bits,
                                          uint32_t id_zext);

uint32_t FF8_CDECL ff8_004954B0(uint32_t slot_bits)
{
    uint32_t eax_bits;
    uint32_t esi_addr;
    uint32_t remaining = UINT32_C(32);
    uint32_t ecx_index;
    uint32_t edx_index;
    uint8_t cl_byte;

    /* 4954BC..4954D0: retain the 32-bit wrap of LEA/SUB/SHL/ADD.
     * Equivalent address: 0x01CFF000 + 464*slot_bits + 0x86 (mod 2^32). */
    eax_bits = slot_bits << 3;
    eax_bits -= slot_bits;
    eax_bits = slot_bits + (eax_bits << 2);
    eax_bits <<= 4;
    eax_bits += UINT32_C(0x01CFF000);
    esi_addr = eax_bits + UINT32_C(0x86);

    do {
        /* 4954D6..4954EA: XOR ECX / MOV CL is a zero-extended byte. */
        FF8_U8_AT(esi_addr) = UINT8_C(0);
        ecx_index = (uint32_t)FF8_U8_AT(esi_addr - UINT32_C(4));
        ecx_index *= UINT32_C(0x3C);
        if ((FF8_U8_AT(UINT32_C(0x01CF406F) + ecx_index)
             & UINT8_C(0x80)) != 0) {
            FF8_U8_AT(esi_addr) = UINT8_C(1);
        }

        /* 4954ED..4954FE: re-read ID; push ID, push original slot;
         * CALL 0047EEB0; caller removes 8 bytes; TEST the whole EAX. */
        edx_index = (uint32_t)FF8_U8_AT(esi_addr - UINT32_C(4));
        eax_bits = ((ff8_0047EEB0_fn)(uintptr_t)UINT32_C(0x0047EEB0))
            (slot_bits, edx_index);
        if (eax_bits != UINT32_C(0)) {
            /* 495500: use the byte as it exists AFTER the call. */
            FF8_U8_AT(esi_addr) =
                (uint8_t)(FF8_U8_AT(esi_addr) | UINT8_C(4));
        }

        /* 495503..49550D: XOR EAX / MOV AL zero-extends this new ID.
         * This load is deliberately not replaced with the pre-call ID. */
        eax_bits = (uint32_t)FF8_U8_AT(esi_addr - UINT32_C(4));
        esi_addr += UINT32_C(5);
        eax_bits *= UINT32_C(0x3C);

        /* 495510..495516: CL-only value; ECX's other bits are dead. */
        cl_byte = FF8_U8_AT(UINT32_C(0x01CF406E) + eax_bits);
        FF8_U8_AT(esi_addr - UINT32_C(6)) = cl_byte;

        /* 495505 and 495519..49551C: zeroed EDX followed by DL load.
         * Re-read after the preceding store, as the native code does. */
        edx_index = (uint32_t)FF8_U8_AT(esi_addr - UINT32_C(9));
        edx_index *= UINT32_C(0x3C);

        /* 49551F: the final JNZ uses DEC EBP's ZF, not the loaded byte. */
        --remaining;

        /* 495520: MOV AL, [table+EDX] replaces ONLY EAX bits 7:0.
         * The upper 24 bits of the earlier ID*60 remain observable. */
        eax_bits = (eax_bits & UINT32_C(0xFFFFFF00))
                 | (uint32_t)FF8_U8_AT(UINT32_C(0x01CF406D) + edx_index);
        FF8_U8_AT(esi_addr - UINT32_C(7)) = (uint8_t)eax_bits;
    } while (remaining != UINT32_C(0));  /* 495529 */

    /* 49552B..49552E: restore nonvolatiles and plain RET. */
    return eax_bits;
}

#undef FF8_U8_AT
#undef FF8_CDECL
```

## Width, ordering, and ABI findings

1. **Entry / stack.** `55 56 57` at `4954B0..B2` saves EBP, ESI, EDI. `8B 7C 24 10` at `4954B3` reads `[current ESP+0x10]`, hence **entry ESP+4**, one raw 32-bit stack argument. There are no stack locals. `4954F2/F3` pushes zero-extended ID then the original argument; `4954F9` is `ADD ESP,8`. `49552B..2E` restores EDI/ESI/EBP and executes plain `C3`, not `RET 4`. This gives the observed caller-clean call shape. The C signature uses `uint32_t` to retain argument bits, not to assert a game-level unsigned slot type.
2. **Record arithmetic.** `4954BC..D0` computes `(slot*8 - slot)`, then `slot + 4*that`, then `SHL 4`, adds raw immediate `0x01CFF000`, then `0x86`. The unsigned C shifts/adds/subtracts preserve 32-bit wrap, including out-of-range or negative-as-bits arguments. No range check, clamp, or array-length assumption is introduced.
3. **Byte accesses.** For initial record base `R = 0x01CFF000 + 464*slot (mod 2^32)` and iteration `i=0..31`, the ID loads are at `R+0x82+5*i`. The target itself writes byte `R+0x86+5*i` (zero, optionally one, optionally post-call OR four), then byte `R+0x85+5*i`, then byte `R+0x84+5*i`. It does not itself access byte `R+0x83+5*i`. This describes the target's accesses only; the callee's effects are unknown.
4. **Table accesses.** Raw displacements are `0x01CF406F` at `4954E1` (`F6 81 ... 80`, a byte TEST), `0x01CF406E` at `495510` (`8A 88 ...`, byte into CL), and `0x01CF406D` at `495520` (`8A 82 ...`, byte into AL). Each index is a zero-extended byte multiplied by `0x3C`. Although the instructions are signed IMUL, operands here are 0..255 and products 0..15300; the C unsigned product has exactly the same 32-bit result. There are no arithmetic right shifts or signed comparisons in this target.
5. **Call effects / reloads.** The callee is not treated as pure. A nonzero **full EAX** at `4954FC` causes OR four into the byte **after** the call. Its previous value is not reconstructed from the pre-call branch. The ID is read four times per iteration: for the TEST table, for the call, for the first copy, then for the second copy. The last read remains after the first copy. The code therefore does not silently assume those ID values or the flag byte survive the callee unchanged, nor does it hoist reads across stores.
6. **Loop flags.** EBP starts at 32. `DEC EBP` at `49551F` supplies the ZF used by `JNZ 4954D6` at `495529`; the intervening two MOV instructions do not change flags. Exactly 32 iterations and 32 calls occur on a normally returning, nonfaulting execution, regardless of IDs and copied byte values. The last iteration has advanced ESI by 160 bytes in total.
7. **Critical AL/EAX detail.** `XOR EAX,EAX; MOV AL,[...]` at `495503/507` first zero-extends ID, and `IMUL EAX,0x3C` at `49550D` populates the entire dword. At `495520`, only **AL** is replaced. No subsequent instruction changes EAX. Consequently the raw exit value is `(60*id_read_at_495507 & 0xFFFFFF00) | byte_read_at_495520`, using the final iteration's reads. The latter byte is indexed by the separate ID read at `495519`. Returning only that byte would be wrong; for instance, ID five gives an upper contribution of `0x100`. The export comment describing the result as the last byte is not adopted. No AX-only operation occurs.

## Complete block/chunk coverage

Addresses are half-open intervals, matching `metadata.json:11-61`.

| Native block | C coverage |
|---|---|
| `4954B0..4954D6` | cdecl entry, saved-register obligations, argument, 32-count setup, modular address construction |
| `4954D6..4954EA` | zero flag byte, zero-extended ID, stride-60 TEST and conditional branch |
| `4954EA..4954ED` | conditional flag-byte assignment one |
| `4954ED..495500` | fresh ID, two pushes/native call, caller cleanup, full-EAX branch |
| `495500..495503` | conditional post-call byte read/OR/write |
| `495503..49552B` | fresh ID, cursor advance, first byte copy, ID reload, decrement, partial-AL update, second copy, loop branch |
| `49552B..49552F` | preserved-register restoration, raw EAX return, plain RET |

The byte envelope contains one contiguous chunk; no tail chunk, switch table, or indirect jump is present in the supplied target. The direct CALL bytes `E8 B7 99 FE FF` at `4954F4` resolve from next EIP `4954F9` to `0047EEB0`. The back-edge bytes `75 AB` at `495529` resolve from `49552B` to `4954D6`. Coverage was checked by static reading against the supplied ASM and bytes; this is not an execution test or independent review.

## Assumptions, uncertainties, and unexecuted validation

- The absolute memory regions and code target must be mapped as in the supplied 32-bit image. Integer-to-pointer binding is specific to that execution environment; this is not safe to execute as an ordinary host program. There is no introduced bounds check: inaccessible addresses retain a native invalid-access precondition, not a fabricated recovery path.
- The `0x47EEB0` body is outside this target projection. The binding expresses the observed two-dword caller-clean interface and assumes the native call returns with the stack balanced and ABI nonvolatiles preserved, as this target itself relies on EDI/ESI/EBP across calls. The callee's purpose, other effects, accepted ID domain, and higher-level type declaration are not established here. No replacement callee/library behavior is supplied.
- Returning `uint32_t` preserves outgoing EAX; whether native callers intentionally consume it remains unvalidated. EFLAGS and incidental ECX/EDX exit values are not additional C return channels. C ABI preservation covers nonvolatile registers; exact compiler stack layout, exception/unwind behavior, fault timing, and instruction-atomicity/concurrent interleavings are not promised by a C lift.
- The common compaction cites historical table bounds and labels, plus discrepancies for other group EAs. No historical bound or name was used to change this target's bytes or add guards; no other target was reconstructed.
- No compilation, executable test, native/live invocation, differential harness, or separate review was performed. The current mission-contract reread was permission-denied; no bypass was attempted. The inherited contract, current shared guide, explicit assignment, and supplied target projection were sufficient for this scoped author deliverable.
- Lead/separately authorized validation requested: 32-bit C build; native-vs-C comparison including helper-mutated flag/ID, helper result with AL zero but upper EAX nonzero, IDs at/above five (full-EAX return), both TEST branches and both helper-result branches, byte-store order, and all 32 iterations. These are requested checks, **not PASS results**.
