# C A — g17 / 0x00505C00

Task `task_mv44sf62_00b8_2lvx7d`; independent producer `pool-202`, session `ses_ecf111b2cffeYfsVUiZqMpqlbS`. Admission per parent INPUT-ADMISSION-HARDENING-v1: `openai/gpt-6.1-sol`, `medium`, override=0. Only this candidate is written; no peer C or semantic output read.

## Frozen input and provenance

Authorized root: `inputs/ff8-decomp-semantics-20261011-r01/g17/`.

- `0x505C00.readable/manifest.json`: SHA256 `03705a61726c3dd316bc1c4618b0e6b621394330e4fa22a5593ea7b1113cd1a5` (parent attestation).
- Original packet hash, manifest:4: `a9a3657c00325a3d8641238ff73c3400f89c3dff920d3ffdb3a9291a5cde3d58`.
- Common compaction hash, manifest:5: `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.
- Complete ASM read: `asm-001.txt`:1–25 and `asm-002.txt`:1–17; hashes respectively `46ffde591fdda0a9b67879163e21d8bf59d677f24bd4c9b9f7ca178559a3f53f` and `52a3df9b7208c64aa5d47915b2845f01396981c538d45d556791e87f78f9b4b8`.
- Complete bytes read: `bytes-001.txt`:1–4; hash `2953b7088230db2d6717a3999d997b3d5aab17b3ddf47c55fdfab5ad7801cf17`.
- `metadata.json`:1–200 read for native identity, complete CFG and initial xrefs; hash in manifest `dffa9ff5c54b81d368d603fa911699c50e8d3af8aa580b61e1a9e43612d4f84e`. Remaining xref inventory not needed or claimed reviewed.
- EXE SHA256, metadata:8: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; native export `2026-10-11T16:38:25.140966+00:00`.

Hashes quoted from the manifest/parent, not independently recomputed. Instruction behavior is derived from ASM and the supplied octets, not the historical names/comments.

## ABI and representation

Observed x86-32 entry: first DWORD at entry ESP+4 (address), second DWORD at entry ESP+8 (untyped bits). `53 8B 5C 24 0C` saves EBX then reads the second argument; after saving ESI, `8B 74 24 0C` reads the first. Both saved registers are restored at every normal return. Plain `C3` leaves argument cleanup to the caller. A nominal source prototype is `void __cdecl sub_00505C00(uint32_t object_address, uint32_t bits)`; **void is a statement that no meaningful result contract is established**, not that EAX is zero or unavailable.

The code below instead returns the observed EAX bits and takes entry EAX as an explicit third *adapter* input. This is not a third native stack argument and is not a directly ABI-compatible replacement. It preserves otherwise indeterminate early-exit EAX and the incidental return values rather than inventing BOOL success. ESP save/restore and argument pushes are accounted for below, not modeled as memory writes in C.

All object references are opaque 32-bit addresses; no packed actor/task type is invented. `mem->linear` is a caller-provided mapping of guest address zero to a byte array covering accessed addresses. Byte accessors implement little-endian unaligned storage and unsigned address wrap. The two declared external **binding adapters** correspond only to observed CALL targets; their bodies, memory side effects, and semantic prototypes are unknown. They must share this memory mapping and return the actual EAX. They are not invented library functions or additional target callees. Standard caller-cleaned x86 convention (including EBX/ESI preservation) is the ABI assumption at these boundaries.

## Complete C data/control lift

```c
#include <stdint.h>
#include <limits.h>

_Static_assert(CHAR_BIT == 8, "guest byte width");
_Static_assert(sizeof(uint32_t) == 4, "guest DWORD width");

typedef struct GuestMemory {
    volatile uint8_t *linear;
} GuestMemory;

static uint8_t r8(GuestMemory *m, uint32_t a)
{
    return m->linear[a];
}
static uint16_t r16(GuestMemory *m, uint32_t a)
{
    uint32_t b0 = r8(m, a);
    uint32_t b1 = r8(m, a + UINT32_C(1));
    return (uint16_t)(b0 | (b1 << 8));
}
static uint32_t r32(GuestMemory *m, uint32_t a)
{
    uint32_t b0 = r8(m, a);
    uint32_t b1 = r8(m, a + UINT32_C(1));
    uint32_t b2 = r8(m, a + UINT32_C(2));
    uint32_t b3 = r8(m, a + UINT32_C(3));
    return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
}
static void w8(GuestMemory *m, uint32_t a, uint8_t v)
{
    m->linear[a] = v;
}
static void w16(GuestMemory *m, uint32_t a, uint16_t v)
{
    w8(m, a, (uint8_t)v);
    w8(m, a + UINT32_C(1), (uint8_t)((uint32_t)v >> 8));
}
static void w32(GuestMemory *m, uint32_t a, uint32_t v)
{
    w8(m, a, (uint8_t)v);
    w8(m, a + UINT32_C(1), (uint8_t)(v >> 8));
    w8(m, a + UINT32_C(2), (uint8_t)(v >> 16));
    w8(m, a + UINT32_C(3), (uint8_t)(v >> 24));
}

/* Opaque bindings to actual native targets. Not asserted source prototypes.
   mem is adapter state, not a native pushed argument. */
extern uint32_t bind_00506C10(GuestMemory *mem, uint32_t native_arg0);
extern uint32_t bind_00505BC0(GuestMemory *mem, uint32_t native_arg0,
                           uint32_t native_arg1);

uint32_t lift_00505C00(GuestMemory *mem, uint32_t object_address,
                     uint32_t bits, uint32_t entry_eax)
{
    uint32_t eax = entry_eax;
    uint32_t ebx = bits;
    uint32_t esi;
    uint32_t ecx;

    /* 00505C00..00505C08: full-DWORD gate; no object dereference yet. */
    if (ebx == 0)
        return eax;

    esi = object_address;
    /* 00505C0E..00505C17: BH bit 4 is argument bit 12. */
    if ((r8(mem, esi + UINT32_C(8)) & UINT8_C(0x18)) != 0 &&
        (ebx & UINT32_C(0x1000)) == 0)
        return eax;

    eax = r32(mem, esi + UINT32_C(0x8C)); /* 00505C19 */
    ebx &= UINT32_C(0xFFFFEFFF);          /* AND BH,0xEF */
    if (eax == 0) {
        /* PUSH EBX; PUSH ESI; CALL 00505BC0; ADD ESP,8. */
        eax = bind_00505BC0(mem, esi, ebx);
        return eax;
    }

    /* PUSH literal 00505C70; CALL 00506C10; ADD ESP,4. */
    eax = bind_00506C10(mem, UINT32_C(0x00505C70));
    if (eax == 0)
        return eax;

    w32(mem, eax + UINT32_C(0x0C), esi); /* 00505C37 */
    w8(mem, eax + UINT32_C(0x15), (uint8_t)ebx); /* BL only */
    ecx = esi; /* Original object, set AFTER external call and both stores. */

    for (;;) { /* 00505C44..00505C5C; process original object first. */
        if ((r8(mem, esi) & UINT8_C(2)) != 0) {
            eax = r32(mem, esi + UINT32_C(0x74));
            w16(mem, eax + UINT32_C(0x2C),
                (uint16_t)(r16(mem, eax + UINT32_C(0x2C)) &
                           UINT16_C(0xFFBF)));
        }
        /* Reload next AFTER the possible word store (aliasing matters). */
        esi = r32(mem, esi + UINT32_C(0x8C));
        if (esi == ecx)
            return eax; /* 00505C58 -> 00505C6B */
        if (esi == 0)
            return eax; /* 00505C5C fallthrough -> 00505C5E */
    }
}
```

No C helper performs allocation, animation, pointer validation, or cycle repair. Native allocator-like names do not establish such purposes. External bindings remain unresolved intentionally, rather than synthesizing callee bodies from intuition.

## Coverage and instruction evidence

Single byte-covered chunk `[0x00505C00,0x00505C6E)`, 110 bytes, 42 instructions. No extra chunks or branch tables are required. All 13 CFG blocks from metadata:11–106 map as follows:

| Native half-open block | C coverage |
|---|---|
| 5C00–5C0A | full DWORD zero gate, saved-register prologue |
| 5C0A–5C14 | first argument and byte +8 gate |
| 5C14–5C19 | bit 0x1000 gate |
| 5C19–5C26 | DWORD +8C read; partial BH clear; branch |
| 5C26–5C37 | opaque call at 506C10 and zero EAX gate |
| 5C37–5C44 | DWORD +0C and byte +15 writes; original address retained |
| 5C44–5C49 | byte +0 bit 2 test |
| 5C49–5C50 | DWORD +74 read; WORD +2C AND |
| 5C50–5C5A | +8C reload and original-address comparison |
| 5C5A–5C5E | null test; backedge otherwise |
| 5C5E–5C61 | restore registers and return on null terminator |
| 5C61–5C6B | opaque call at 505BC0 with full cleared EBX |
| 5C6B–5C6E | shared restore/return |

Key byte checks (`bytes-001.txt`:1–4; instruction addresses in both ASM files):

1. `F6 C7 10` at 5C14 tests BH; `80 E7 EF` at 5C1F modifies BH alone. Thus only 0x1000 is removed from full argument; bits above 15 survive to the 505BC0 call. Testing only BL for the first zero gate is wrong: e.g. bits=0x1000 passes the gate, then becomes zero later.
2. `68 70 5C 50 00 E8 E0 0F 00 00` at 5C26–5C2F: literal callback address 505C70, direct CALL target `505C30 + 0xFE0 = 506C10`. This is passing an address, not invoking callback 505C70 locally.
3. `89 70 0C 88 58 15` at 5C37–5C3C stores the original address as DWORD, then only BL as byte. Do not truncate the alternate call's DWORD argument by analogy.
4. `BA BF FF 00 00` sets EDX=0x0000FFBF, then `66 21 50 2C` at 5C4C masks exactly a WORD with DX. No adjacent DWORD high half is cleared. EAX is the +74 pointer on each flagged iteration, not the masked word.
5. `8B B6 8C 00 00 00 3B F1 74 11 85 F6 75 E6` at 5C50–5C5D reloads the successor, exits when it equals original ECX, otherwise tests null, otherwise repeats. A cycle not containing the original object does not receive a timeout/visited set.
6. `53 56 E8 58 FF FF FF 83 C4 08` at 5C61–5C6A passes `(object, cleared_full_bits)` right-to-left to target `505C68 - 0xA8 = 505BC0`. Entry arguments themselves are not modified in their stack slots.

## Effects, partial registers and result limits

- No absolute global is directly accessed. Only the literal callback address is absolute. Memory effects are the two returned-node stores, zero or more pointed WORD masks, and opaque callee effects.
- EBX full DWORD is used for zero test; BH test/clear preserve BL and bits 16–31; BL is used only for the node byte store. AX and AL are not independently modified in this function. The mask uses DX; EDX is set to 0x0000FFBF on the successful-node path. No target shifts, signed comparisons, arithmetic overflow, or sign extension occur. Adapter shifts only assemble unsigned little-endian values.
- Early argument-zero or byte/BH gate exits leave entry EAX unchanged. The failed 506C10 branch returns EAX=0. The null-link branch returns whatever EAX 505BC0 leaves. Successful-node traversal returns the 506C10 result unless a flagged object overwrites EAX with its +74 pointer; thereafter the last such pointer survives. Native purpose/return type cannot be inferred from these residues.
- Local call stack: EBX and ESI consume 8 saved bytes; 506C10 temporarily consumes one DWORD argument (explicit ADD ESP,4); 505BC0 consumes two (ADD ESP,8); both return addresses are transient CALL effects. Each return restores saved ESI/EBX and leaves the original two argument slots to its caller. ECX/EDX/EFLAGS are caller-clobbered; this lift does not expose their final residues.

## Explicit uncertainties and validation status

This is a complete normal-execution data/control/EAX lift of the supplied function, not a built binary replacement or a reconstruction of its two callees. No authenticated callee body/prototype is supplied in this projection. Opaque bindings require a separately authorized implementation/native bridge; null-return behavior is represented without assigning an allocation purpose. Callback ABI/body at 505C70 remains unknown.

Guest mapping assumes valid accessible storage for each performed access and no concurrent observer requiring atomic word/DWORD bus behavior. Byte-wise accessors do not model precise x86 exception ordering, hardware memory atomicity, EFLAGS, or the saved stack words. Address-zero is not silently checked or repaired; with nonzero bits the object must be dereferenceable. Invalid +74 pointers and malformed non-original cycles remain native faults/nontermination, not fabricated safety checks. Stores and later reads remain ordered to retain ordinary memory alias effects, including returned node aliasing an object.

All ASM lines and byte lines were manually inspected for the candidate. No hash calculation, compilation, test, execution, review, IDB validation, or integration was performed by this author. Requested lead validation: compile the adapter and compare normal-path trace/EAX/memory effects against native calls, especially (1) full-DWORD/nonzero but BL-zero arguments, (2) gate bit 0x1000 removal, (3) helper failure, (4) null/singleton/ring links, (5) mixed flagged nodes, and (6) aliases involving node stores, +74 WORD store and successor reload. These are requests, not PASS results.
