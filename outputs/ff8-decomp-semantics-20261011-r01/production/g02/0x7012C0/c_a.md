# 0x7012C0 — independent C A

## Frozen input and coverage

- Packet SHA-256 (manifest citation, not recomputed): `1266b0df632a32ee19635b92615cab7a74f81d7e9bd28c0c70afcb3fd08f3ba8`.
- Common-compaction SHA-256: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`.
- EXE SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; PE32 export `2026-10-11T16:38:25.140966+00:00`.
- Read all manifest entries: asm-001.txt lines 1–25, asm-002.txt lines 1–4, bytes-001.txt lines 1–3, metadata.json lines 1–205; common-compaction.md lines 1–24. No sibling production read.
- Complete single chunk `[0x7012C0,0x70130C)`, 76 bytes, 29 instructions, one basic block, no branches. Byte slices contain 32 + 32 + 12 bytes and span this chunk without gaps. The calls encoded at 0x7012DF and 0x7012E7 resolve respectively to 0x56D130 and 0x56D100, using next-instruction address plus signed rel32.

## Complete C

This is binary-target C for **32-bit little-endian x86**, with MSVC-style cdecl and unaligned integer accesses. It requires the binary-reconstruction aliasing model (MSVC C/no strict-alias optimization); it is not claimed to be portable ISO C for arbitrary effective types. Volatile typed stores retain the native access widths and order; no `restrict`, alignment guard, null guard, allocation, or library call is added. The two external declarations denote the actual native callees, not substitutes or invented implementations. Linkage binding to their EAs belongs to integration.

```c
#include <stdint.h>

#if defined(_MSC_VER)
# define FF8_CDECL __cdecl
#elif defined(__GNUC__) && defined(__i386__)
# define FF8_CDECL __attribute__((cdecl))
#else
# define FF8_CDECL /* documentation only outside the required x86 ABI */
#endif

/* Exact native boundaries; their implementations are outside this packet. */
extern uint32_t FF8_CDECL sub_0056D130(int32_t angle);
extern uint32_t FF8_CDECL sub_0056D100(int32_t angle);

/*
 * arg0: a four-byte stack slot; only its low WORD is consumed.
 * arg4: destination address; native writes twenty bytes.
 * Returns the entire EAX value produced by sub_0056D100.
 */
uint32_t FF8_CDECL sub_007012C0(uint32_t angle_slot, void *destination)
{
    volatile uint8_t *const out = (volatile uint8_t *)destination;
    const uint32_t low_word = angle_slot & UINT32_C(0xffff);
    const int32_t angle = (low_word < UINT32_C(0x8000))
        ? (int32_t)low_word
        : (int32_t)low_word - INT32_C(65536);

    /* 007012D0, D3, D6, D9, DC: five DWORD stores, before either call. */
    *(volatile uint32_t *)(out + 0x00) = UINT32_C(0);
    *(volatile uint32_t *)(out + 0x04) = UINT32_C(0);
    *(volatile uint32_t *)(out + 0x08) = UINT32_C(0);
    *(volatile uint32_t *)(out + 0x0c) = UINT32_C(0);
    *(volatile uint32_t *)(out + 0x10) = UINT32_C(0);

    /* 007012D2/DF then 007012E4/E7: signed, four-byte cdecl arguments. */
    const uint32_t sine_eax = sub_0056D130(angle);
    const uint32_t cosine_eax = sub_0056D100(angle);

    /* 007012EC/F1: full 32-bit NEG, modulo 2^32 (no signed overflow). */
    const uint32_t negative_sine_edx = UINT32_C(0) - sine_eax;

    /* 007012F3, F6, FA, FE, 00701302: exact WORD destinations/order. */
    *(volatile uint16_t *)(out + 0x00) = (uint16_t)cosine_eax;        /* AX */
    *(volatile uint16_t *)(out + 0x06) = (uint16_t)negative_sine_edx; /* DX */
    *(volatile uint16_t *)(out + 0x02) = (uint16_t)sine_eax;          /* BX */
    *(volatile uint16_t *)(out + 0x08) = (uint16_t)cosine_eax;        /* AX */
    *(volatile uint16_t *)(out + 0x10) = UINT16_C(0x1000);

    return cosine_eax;
}
```

The source-level conditional implements `MOVSX` without implementation-defined narrowing; it is not a native control-flow branch or an added input guard. Native pushes/pops are represented by ordinary ABI-preserved C locals, not extra callees. No shifts occur in the target; integer negation is explicitly unsigned wrap. `AX`, `BX`, and `DX` stores truncate independently to 16 bits; no `AL` store occurs and EAX is not narrowed on return.

## ABI, order, aliasing, stack

- Let S be entry ESP. Original angle slot is `[S+4]`, output pointer `[S+8]`. Bytes `8B 74 24 10` at 0x7012C2 read the pointer after saving EBX/ESI (ESP=S−8). Bytes `0F BF 7C 24 10` at 0x7012CB read/sign-extend the angle WORD after saving EDI (ESP=S−12). Hence inputs are `(angle_slot, destination)`, not reversed.
- EBX, ESI, EDI are saved and restored; there is no EBP frame or local-stack allocation. First angle push occurs between the first and second zero stores but does not change the destination register. First call runs with ESP=S−16 immediately before CALL; after it returns, its argument remains on stack. A second identical four-byte argument is pushed; second call runs with ESP=S−20 immediately before CALL. `ADD ESP,8` at 0x7012EE removes both argument slots; the three pops restore ESP=S, followed by plain `RET`. The outer caller cleans its own argument slots. There is no `RET 8`.
- Sine result is retained in EBX across the cosine call; destination/angle remain in ESI/EDI. Callees must obey the observed cdecl callee-saved register contract. EAX is left as the cosine callee's full result through the WORD stores and return.
- All five zero DWORD writes precede the first callee; all coefficient WORD writes follow both callees. Consequently a callee may observe the already-zeroed destination through other aliases; the code does not delay, merge, or move those stores across calls. No destination is passed explicitly to either callee.
- Required ordinary-memory contract: destination provides at least 20 writable bytes and does not overlap live return-address/stack-control storage. Destination alignment need not be four bytes on x86. Output is not just an 18-byte object: offsets 18–19 are explicitly zeroed by the DWORD store at +0x10. They remain zero if callees do not mutate them through aliases. Aliasing with callee-visible ordinary memory is otherwise not excluded. Hardware/MMIO, invalid-address fault equivalence, CPU flags, or exotic self-overlap with active call-stack storage are not modeled by a conventional C function.

## Contract and evidence

Proposed descriptive name: **Mat3S16_MakeRotZ_Q12_ReturnCos**. High confidence in access widths/order, signed angle, helper boundaries, wrap, and residual EAX. Rotation/Q12 naming is conditional on the supplied factual helper description; exact handedness/vector convention and caller use of EAX are unknown. The native label alone is not proof.

1. `asm-001.txt:3,7` / 0x7012C2, 0x7012CB: destination from second stack slot, angle from signed low WORD of first. `bytes-001.txt:1` supplies the load encodings.
2. `asm-001.txt:8–13` / 0x7012D0–DC: writes five zero DWORDs over 20 bytes, establishing both initialization and the trailing two bytes, not merely nine WORDs.
3. `asm-001.txt:14–17`, `bytes-001.txt:1–2`, `metadata.json:200–203`: exactly two direct calls, sine-address 0x56D130 then cosine-address 0x56D100; no source-level trig/library replacement is justified. Helper names/comments are secondary context, not bodies.
4. `asm-001.txt:18–25` / 0x7012EC–0x701302: unsigned-model 32-bit NEG followed by low-WORD stores gives matrix-index layout `[[c,s,0],[-s,c,0],[0,0,0x1000]]` under row-major nine-WORD convention. **Name proof 1:** paired equal diagonal coefficients and opposite off-diagonal coefficients affect the first two coordinates while the third diagonal remains fixed, supporting a Z-plane rotation description rather than X/Y.
5. `asm-001.txt:25` plus supplied `common-compaction.md:11,13`: diagonal literal 0x1000 and documented Q12 sine/cosine neighbours support Q12 scaling. **Name proof 2:** unity literal 4096 and the sine/cosine-boundary context independently support the scale-qualified rotation name; exact trigonometric semantics remain external.
6. `asm-002.txt:1–4` / 0x701308–0x70130B with `asm-001.txt:17–25`: register restoration/plain return never overwrites EAX after cosine; returning only AX or destination would lose native register information. `metadata.json:164–198` gives six nearby callers 0x701310/430/4B0/530/5B0/630, but lacks their instruction bodies, so does not prove how they consume the return.

All paths above are relative to `inputs/ff8-decomp-semantics-20261011-r01/g02/0x7012C0.readable/` except the explicitly named common-compaction file in its parent directory.

## Unknowns and unexecuted validation

- No callee ASM/body is supplied here. Preserve both real calls; do not manufacture an exact C sin/cos calculation. The target contains no x87 opcode or control-word change. Any x87 precision/rounding/status effect is inherited from these opaque native callees and their incoming environment; comments do not establish a portable replacement or default environment.
- No documented structure alignment/type declaration, vector convention, helper return-range proof, callee alias effects, or caller return-use body is supplied. Full EAX return is preserved even if callers later ignore it.
- The C models ordinary destination memory and observable values/stores/calls under the stated x86 ABI. CPU flags and transient stack-image identity require a lower-level machine model if requested.
- Only static reading and opcode/operand comparison were performed. Compilation, runtime tests, instrumented store-order/unaligned checks, and native callee ABI verification were **not executed**. Lead should validate compiler options and EA binding; no PASS, integration, or closure verdict is claimed. Output hash to be computed by lead.
