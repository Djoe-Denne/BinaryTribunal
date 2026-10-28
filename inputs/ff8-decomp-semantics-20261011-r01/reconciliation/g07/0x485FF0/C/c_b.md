# 0x485FF0 — independent C B

## Evidence / coverage

Ground truth: frozen native packet `inputs/ff8-decomp-semantics-20261011-r01/g07/0x485FF0.json`, SHA-256 `cda0002d86ac4ddd92e07c4113dc843be7e9918846d93248d7039944999ac590`. Source is 32-bit `FF8_EN.exe`, SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export time `2026-10-11T16:38:25.140966+00:00` (packet lines 1–9). Read the complete readable projection: `0x485FF0.readable/manifest.json` (lines 1–30), `metadata.json` (lines 1–208), `asm-001.txt` (lines 1–25), `asm-002.txt` (lines 1–12), `bytes-001.txt` (lines 1–5), and the authoritative JSON packet (lines 1–216). Projection manifest says assembly is complete (37 instructions) and bytes are complete for `[0x485ff0,0x486074)`; hashes for each projection file and packet are recorded in the manifest. Common facts used only for memory/layout addresses and slot stride: `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md` lines 23–31 and 44–46.

The C below covers every instruction in `[0x485FF0,0x486074)`, including both seven-iteration passes, both word stores, callee-saved EBX handling and return. It models the explicit memory reads/writes and control flow, not compiler-generated register allocation. No build, compilation, runtime, or differential check was performed.

## C reconstruction

```c
#include <stdint.h>

/*
 * 32-bit x86 absolute addresses and byte offsets from the frozen image.
 * BATTLE_SLOT_DATA base = 0x1D27B10; slot stride = 0xD0.
 * The instruction reads the byte at slot+0x7C and, conditionally, the
 * byte at slot+0x80. Output accesses are WORD stores.
 */
void build_battle_slot_eligibility_masks(void)
{
    volatile uint8_t *const slots =
        (volatile uint8_t *)(uintptr_t)0x1D27B10u;
    volatile uint16_t *const mask_a =
        (volatile uint16_t *)(uintptr_t)0x1CFF570u;
    volatile uint16_t *const mask_b =
        (volatile uint16_t *)(uintptr_t)0x1CFF572u;

    /* Pass 1: EAX starts at 6*0xD0 and visits offsets down through zero. */
    uint32_t eax = 0x4E0u;
    uint32_t ecx = 0u;
    const uint32_t edx = 1u;
    const uint8_t bl = 0x40u;

    for (;;) {
        ecx <<= 1; /* SHL ECX,1: unsigned 32-bit wrap semantics. */

        if ((slots[eax + 0x7Cu] & (uint8_t)edx) != 0u &&
            (slots[eax + 0x7Cu] & bl) == 0u) {
            /* CMP EAX,270h / JGE is a signed comparison. */
            if ((int32_t)eax >= 0x270 ||
                (slots[eax + 0x80u] & (uint8_t)edx) == 0u) {
                ecx |= edx;
            }
        }

        eax -= 0xD0u; /* SUB wraps as 32-bit unsigned arithmetic. */
        /* CMP EAX,FFFFFF30h / JG: signed EAX > -208. */
        if (!((int32_t)eax > -208))
            break;
    }
    *mask_a = (uint16_t)ecx; /* MOV [1CFF570],CX; only a WORD is stored. */

    /* Pass 2 repeats the same scan with the other signed threshold branch. */
    eax = 0x4E0u;
    ecx = 0u;
    for (;;) {
        ecx <<= 1;

        if ((slots[eax + 0x7Cu] & (uint8_t)edx) != 0u &&
            (slots[eax + 0x7Cu] & bl) == 0u) {
            /* CMP EAX,270h / JL is signed; below threshold skips status. */
            if ((int32_t)eax < 0x270 ||
                (slots[eax + 0x80u] & (uint8_t)edx) == 0u) {
                ecx |= edx;
            }
        }

        eax -= 0xD0u;
        if (!((int32_t)eax > -208))
            break;
    }
    *mask_b = (uint16_t)ecx; /* MOV [1CFF572],CX. */
}
```

## Semantic reading and confidence

**Neutral suggested name:** `build_battle_slot_eligibility_masks` (not an assertion about downstream “visibility”). **Confidence: high** that it builds two per-slot bitmasks; **medium** for any higher-level game meaning. Evidence independent of the IDB name/comment: (1) the routine stores the low 16 bits of two separately accumulated values to `0x1CFF570` and `0x1CFF572` (ASM `0x48602E`, `0x48606B`); (2) each accumulator is constructed by one bit per slot after tests of the slot flag byte and, conditionally by slot offset, status bit (ASM `0x486001–0x486020`, `0x48603E–0x48605D`).

- Each pass scans offsets `0x4E0,0x410,0x340,0x270,0x1A0,0xD0,0`, i.e. seven slots at stride `0xD0`; the signed post-decrement `JG` against `0xFFFFFF30` terminates after offset zero (ASM `0x485FF3`, `0x486022–0x48602C`, `0x486037`, `0x48605F–0x486069`).
- For each slot, the byte at base+offset+`0x7C` must have bit `0x01` set and bit `0x40` clear. Only then is the byte at base+offset+`0x80` tested, and only for one offset range. That status access is a **byte** load testing bit `0x01`; do not widen it to the documented WORD field.
- Pass A uses signed `EAX >= 0x270` to bypass the status test at offsets `0x4E0` through `0x270`; for lower offsets, it sets the bit iff status bit 0 is clear (`0x486011–0x486020`). Pass B uses signed `EAX < 0x270` to bypass the status test at lower offsets; for offsets at/above the threshold it sets the bit iff status bit 0 is clear (`0x48604E–0x48605D`).
- `ECX` is shifted left before each slot's optional OR of `EDX=1`; thus for the actual descending scan, the bit for offset `0x4E0` is bit 0, and offset 0 contributes bit 6. This follows directly from instruction order (`0x485FFF`, `0x486020`, `0x48603C`, `0x48605D`). It conflicts with the embedded static comment in packet/ASM line 1 (“LSB=slot0”), which is not followed as ground truth.
- Common compaction lines 29–31 record the documented base `0x1D27B10`, stride `0xD0`, logical party slots 0–2/enemy slots 3–7, and the distinction that the `+0x7C` DWORD field covers two WORDs. On that layout only slots 0–6 are visited; slot 7 and GF slots are not visited. This routine's output consumers and intended game-facing interpretation are not established here.

## ABI / exactness limits

Entry instruction `0x485FF0` pushes EBX; there is no stack allocation and no argument load. EBX is used through BL=`0x40` and restored at `0x486072`; plain `RET` is at `0x486073` (ASM projection lines 1, 5, 11–12). No calls or x87 instructions occur in this function. The `RET` does not establish a return type/value: no return-value contract is proven. The C `void` signature is a convenient translation choice, not an inferred ABI fact. The target is 32-bit; `EAX` decrement and `ECX` shifts are modeled with `uint32_t` wrap/shift behavior, while both threshold decisions and the loop bound reproduce signed x86 branches. The function accesses the output words sequentially: A before starting pass B. No guards or external calls were added.

Unknown: why these two distinct range-specific masks are consumed, their exact semantic names, and whether any higher-level interpretation corresponds to “visibility.” The packet's xrefs (metadata lines 126–204) show code references but do not by themselves establish those consumers' contracts. No prototype for another function or library call is involved.
