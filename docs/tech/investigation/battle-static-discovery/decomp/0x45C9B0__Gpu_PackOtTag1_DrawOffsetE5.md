# Gpu_PackOtTag1_DrawOffsetE5 @ 0x45C9B0

- Instr (live): 15
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: unsigned int *__cdecl Gpu_PackOtTag1_DrawOffsetE5(unsigned int *pkt, unsigned short *xy)
- Notes parent: tag 1 (OR 0x01000000, VIT leurre IDA) + GP0 E5 via (Y|0xFFFCA000)<<11|X. WORD X/Y + AND 0x7FF, pas movsx. Tag 07/code 24, TEST AL,2, occupancy 1+2, +44h GF Exists absents. Leaf cdecl retn C3, EAX=pkt.

## C réconcilié

```c
/* Gpu_PackOtTag1_DrawOffsetE5 @ 0x45C9B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 15 instr, size 0x3A, end exclusive 0x45C9EA. cdecl, 2 args, retn C3, no EBP frame.
 * Leaf: no calls, no add esp. EAX = pkt for the whole body (return pkt).
 * pkt[0] DWORD: (old & 0x00FFFFFF) | 0x01000000. Bytes 81 E1 FFFFFF00 / 81 C9 00000001.
 *   unk_FFFFFF is the mask 0x00FFFFFF. VIT_0_STATUS_MASK? is a false IDA name for 0x01000000 (OT len=1).
 *   NOT tag 07 / NOT GPU code 24 (those are AVSZ3 POLY, other functions).
 * xy: WORD Y at +2 (66 8B 51 02), WORD X at +0 (66 8B 09), then AND 0x7FF each. Not movsx.
 *   MOV DX/CX do not zero-extend; AND 0x7FF clears the high bits.
 * pkt[1] DWORD: ((Y|0xFFFCA000)<<11)|X. (0xFFFCA000<<11)==0xE5000000 -> GP0 DrawOffset E5.
 * Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / +44h GF Exists: ABSENT. TEST AL,2 unlink: ABSENT.
 * Caller-side g_BattleOTBase+44h is the Obj44 OT bucket, not this body.
 * No jcc, no setcc, no jump table. No packed struct.
 */

unsigned int *__cdecl Gpu_PackOtTag1_DrawOffsetE5(unsigned int *pkt, unsigned short *xy)
{
    unsigned int y;
    unsigned int x;

    pkt[0] = (pkt[0] & 0x00FFFFFFu) | 0x01000000u;

    y = xy[1];
    x = xy[0];
    y &= 0x7FFu;
    x &= 0x7FFu;

    pkt[1] = ((y | 0xFFFCA000u) << 11) | x;
    return pkt;
}
```
