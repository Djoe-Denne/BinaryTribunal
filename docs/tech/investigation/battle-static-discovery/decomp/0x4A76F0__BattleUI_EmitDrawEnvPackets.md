# BattleUI_EmitDrawEnvPackets @ 0x4A76F0

- Instr (live): 56
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=35
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=328
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=184
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl BattleUI_EmitDrawEnvPackets(int p_ctx, _DWORD *p_pkt, int x, int y)
- Notes parent: 3 packets stride 0xC, tag immédiat 0x02000000. E2 zeros + nullsub_9 ; E5 via (y&0x7FF|0xFFFCA000)<<11|(x&0x7FF) + sub_49C950 (ignore packet, zero 2 floats) ; E3+E4 clip +0x13F/+0xD7 (320×216) puis ApplyDrawEnvClipOrSubmit. add esp,18h. Retour p_pkt+0x24. arg_8/arg_C loads DWORD (pas __int16). Occupancy 1+2 / GetRandomInt / 0xD0 / 0x1D0 absents. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* BattleUI_EmitDrawEnvPackets @ 0x4A76F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 56 instr, size 0xC0, end 0x4A77B0. IDA type had __int16 for arg_8;
 * ASM is DWORD `mov ebp/ebx` — proto uses int. No domain::.
 * Packet stride 0xC (3 DWORDs). Occupancy 1+2 / GetRandomInt / slot 0xD0 /
 * F_CHAR 0x1D0 unused. No 66 prefix: all stores DWORD.
 * add esp,18h after the third call (3 cdecl × 2 args). Return p_pkt+0x24.
 * 0x02000000 is an immediate tag, not a pointer (IDA unk_2000000).
 */

extern void nullsub_9(int p_ctx, _DWORD *p_pkt);
extern void sub_49C950(int p_ctx, _DWORD *p_pkt);
extern int BattleUI_ApplyDrawEnvClipOrSubmit(int p_ctx, _DWORD *p_pkt);

_DWORD *__cdecl BattleUI_EmitDrawEnvPackets(int p_ctx, _DWORD *p_pkt, int x, int y)
{
    unsigned int e5;
    unsigned int e3;
    unsigned int e4;
    unsigned int ux;
    unsigned int uy;

    /* Packet 1 @ +0: GP0 E2 texture window (fields 0). Stores then nullsub_9. */
    p_pkt[0] = 0x02000000;
    p_pkt[1] = 0xE2000000;
    p_pkt[2] = 0;
    nullsub_9(p_ctx, p_pkt);

    uy = (unsigned int)y;
    ux = (unsigned int)x;

    /* Packet 2 @ +0xC: GP0 E5 drawing offset, 11-bit X/Y.
     * ((y & 0x7FF) | 0xFFFCA000) << 11 | (x & 0x7FF)
     * == 0xE5000000 | ((y & 0x7FF) << 11) | (x & 0x7FF). */
    e5 = ((uy & 0x7FFu) | 0xFFFCA000u) << 11;
    e5 |= ux & 0x7FFu;
    p_pkt += 3;
    p_pkt[0] = 0x02000000;
    p_pkt[1] = e5;
    p_pkt[2] = 0;
    sub_49C950(p_ctx, p_pkt); /* zeroes flt_1D2B0DC / flt_1D2B0E0; ignores packet */

    /* Packet 3 @ +0x18: GP0 E3 top-left + E4 bottom-right, 10-bit.
     * E3: ((y & 0x3FF) | 0xFFF8C000) << 10 | (x & 0x3FF)
     * E4: 0xE4000000 | (((y+0xD7) << 10) & 0xFFC00) | ((x+0x13F) & 0x3FF)
     * clip 0x140 x 0xD8 (320x216). Stores then ApplyDrawEnvClipOrSubmit. */
    e3 = (uy & 0x3FFu) | 0xFFF8C000u;
    e4 = (uy + 0xD7u) << 10;
    e3 <<= 10;
    e4 &= 0xFFC00u;
    e4 |= (ux + 0x13Fu) & 0x3FFu;
    e3 |= ux & 0x3FFu;
    e4 |= 0xE4000000u;
    p_pkt += 3;
    p_pkt[0] = 0x02000000;
    p_pkt[1] = e3;
    p_pkt[2] = e4;
    BattleUI_ApplyDrawEnvClipOrSubmit(p_ctx, p_pkt);

    return p_pkt + 3;
}
```
