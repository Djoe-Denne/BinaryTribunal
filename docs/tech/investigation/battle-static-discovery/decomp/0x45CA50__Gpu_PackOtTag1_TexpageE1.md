# Gpu_PackOtTag1_TexpageE1 @ 0x45CA50

- Instr (live): 20
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3
- A==B: non
- Push IDB: oui
- SetType: unsigned int *__cdecl Gpu_PackOtTag1_TexpageE1(unsigned int *, int, int, __int16)
- Notes parent: tag 1 (`&0xFFFFFF|0x01000000`), GP0 E1 (`0xE1000000`). dfe neg/sbb→0x400, dtd→0x200, arg_C DWORD `&0x9FF`. EAX=packet. VIT_0_STATUS_MASK? leurre. Occupancy 1+2 / tag 07 / code 24 / TEST AL,2 / +44h absents.

## C réconcilié

```c
/* Gpu_PackOtTag1_TexpageE1 @ 0x45CA50
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 20 instr, size 0x48, end 0x45CA98. cdecl leaf, 4 args, retn C3. EAX = packet (never overwritten).
 * OT tag: (*packet & 0x00FFFFFF) | 0x01000000 (word-count 1). IDA VIT_0_STATUS_MASK? is a leurre.
 * GP0 E1 at packet[1]: 0xE1000000 | (dfe?0x400:0) | (dtd?0x200:0) | (tpage_dword & 0x9FF).
 * neg/sbb boolean, not a shift. DWORD stores (no 66). arg_C loaded as DWORD then AND 0x9FF.
 * Occupancy 1+2 / tag 07 / code 24 / TEST AL,2 / +44h / 0xD0 / 0x1D0 ABSENT.
 * Distinct from Gpu_PackOtTag1_DrawOffsetE5 0x45C9B0 and Gpu_PackDrawEnvPacket 0x45C0F0.
 */
unsigned int *__cdecl Gpu_PackOtTag1_TexpageE1(unsigned int *packet, int dfe, int dtd, __int16 tpage)
{
    unsigned int e1;

    packet[0] = (packet[0] & 0x00FFFFFFu) | 0x01000000u;

    e1 = (dfe != 0) ? 0x400u : 0u;
    e1 |= (dtd != 0) ? 0x200u : 0u;
    e1 |= (unsigned int)tpage & 0x9FFu;
    e1 |= 0xE1000000u;
    packet[1] = e1;

    return packet;
}
```
