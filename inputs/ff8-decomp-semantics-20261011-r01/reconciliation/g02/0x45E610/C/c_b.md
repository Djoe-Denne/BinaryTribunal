# `0x45E610` — independent C production B

## Reconstruction

```c
#include <stdint.h>

/* PE32 absolute-address globals. Access widths are part of the reconstruction. */
#define U32_AT(address) (*(volatile uint32_t *)(uintptr_t)(address))
#define S16_AT(address) (*(volatile int16_t  *)(uintptr_t)(address))

uint32_t Gte_AVSZ4(void)
{
    uint32_t eax = U32_AT(UINT32_C(0x01CA8A5C));
    uint32_t ecx = U32_AT(UINT32_C(0x01CA8A58));
    uint32_t edx = U32_AT(UINT32_C(0x01CA8A54));

    eax &= UINT32_C(0x0000FFFF);
    ecx &= UINT32_C(0x0000FFFF);
    edx &= UINT32_C(0x0000FFFF);
    eax += ecx;

    ecx = U32_AT(UINT32_C(0x01CA8A50));
    eax += edx;
    ecx &= UINT32_C(0x0000FFFF);

    /* MOVSX WORD -> EDX, followed by the final 32-bit ADD. */
    int32_t signed_scale = (int32_t)S16_AT(UINT32_C(0x01CA92F4));
    eax += ecx;

    U32_AT(UINT32_C(0x01CA92F8)) = 0;

    /* IMUL EAX, EDX keeps the low 32 product bits; unsigned C multiplication
       gives the same low-dword bit pattern without signed-overflow UB. */
    eax *= (uint32_t)signed_scale;
    eax >>= 12; /* x86 SHR: zero-fill, not arithmetic right shift. */

    U32_AT(UINT32_C(0x01CA8A2C)) = eax;
    U32_AT(UINT32_C(0x01CA8A70)) = eax;
    return eax; /* EAX is still this value at RETN. */
}

#undef S16_AT
#undef U32_AT
```

## Contract and confidence

- **Mechanically supported behavior (high confidence):** zero-argument, leaf PE32 routine; reads four dwords and masks each to its low unsigned 16 bits, sums in 32-bit registers, sign-extends one 16-bit scale, clears a dword, retains the low 32 bits of the multiply, logically shifts the product right 12, writes the same dword to two globals, and returns with that value in EAX. The four-input sum is at most `4 * 65535`, so its additions do not overflow; the multiply can overflow the 32-bit destination and is explicitly modulo `2^32` in this C.
- **ABI/stack:** no stack arguments, prologue, stack adjustment, or calls in the complete block; `RETN` only. The C signature has no parameters and uses a 32-bit integer return, corresponding to EAX. No callee or library call is modeled.
- **Name/role:** retain the exported label `Gte_AVSZ4` as the function name, but treat its domain interpretation as a medium-confidence label-based description, not proof of an external hardware contract.
- **Name evidence:** (1) native export labels the entry `Gte_AVSZ4`; (2) native instructions at `0x45E621`–`0x45E649` mask and add four separate input dwords, followed by a signed word scale and `SHR 12` at `0x45E642`–`0x45E658`, structurally supporting “AVSZ4” as a four-value scaled accumulator. This does not establish undocumented GTE saturation/flag behavior.
- **Unknowns:** global names do not establish hardware-register identity or caller-visible purpose beyond the observed accesses. No saturation or status calculation is present; `0x1CA92F8` is simply cleared here. The `0x5AA11F` code xref from function `0x5A9C10` is a neighbor/use-site fact only, not a contract proof.

## Native evidence and coverage

Coverage is the complete single native block, all 18 assembly lines and all `0x56` chunk bytes; the projected manifest declares a complete verbatim projection with no filtering/truncation. Every operation in that block is represented above in order, including each 32-bit mask/add, the status write, wrapped multiply, logical shift, both output writes, and return.

ASM anchors: `0x45E610`–`0x45E61B` load the first three dwords; `0x45E621`–`0x45E62C` mask them; `0x45E632`–`0x45E649` add four low words and sign-extend the scale; `0x45E64B` clears `0x1CA92F8`; `0x45E655`–`0x45E658` multiply and logical shift; `0x45E65B`–`0x45E660` write both results; `0x45E665` returns. CFG has one block `[0x45E610, 0x45E666)` and no successors. Metadata records code xref `0x5AA11F` in caller function `0x5A9C10`.

## Input provenance

- Frozen native packet: `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E610.json`, native PE32 input SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; packet provides chunk bytes and complete assembly (lines 11–24), plus CFG/xrefs (from line 19 onward).
- Readable manifest: `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E610.readable/manifest.json`: original packet SHA-256 `942cc92944c0c0364bd9efa7a43e04b381f5fc1cdca6710c180140ba7b5af909`, compaction SHA-256 `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`, 18 assembly lines, projection completeness claim (lines 2–7); assembly-file SHA-256 `174b5f4acb3cf1c43b207810e3500e1fa7ef6eb4b81f74698546f10e5fb7b2a3`; bytes-file SHA-256 `d56466b16e8a6273f5c9157d78046c01500cafff5274f446ccab015caf07d864`.
- Exact projected text: `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E610.readable/asm-001.txt` (18 lines) and `bytes-001.txt` (3 lines).
- Target metadata: `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E610.readable/metadata.json`, identity/architecture lines 2–9, one-block CFG lines 11–16, xrefs including `0x5AA11F`/`0x5A9C10` lines 217–222.
- Shared factual context: `inputs/ff8-decomp-semantics-20261011-r01/g02/common-compaction.md` lines 3, 6, 13, and 20; used only as secondary context. Native packet remains authoritative.

Compilation, execution, and review were not performed.
