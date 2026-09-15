# wm_GetRegionNumber @ 0x553910

- Instr (live): 28
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=82
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=72
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=88
- A==B: non
- Push IDB: oui
- SetType: int __cdecl wm_GetRegionNumber(int, int)
- Notes parent: IDIV signed (y+0x48000)%0x30000 puis CDQ/AND 1FFFh/SAR 13 puis SHL 5. X = LEA +0x60000, AND 8003FFFFh, JNS (pas ja/jg), DEC/OR 0FFFC0000h/INC, puis même /0x2000. Retour EAX = x_tile+32*y_tile. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas d'appel. DWORD only.

## C réconcilié

```c
/* wm_GetRegionNumber @ 0x553910
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 28 instr, size 0x4D, end 0x55395D. cdecl 2 DWORD args. retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: ABSENT.
 * No CALL / add esp. No 66 prefix. No setcc / jpt / ja / jg.
 * JNS after AND 8003FFFFh only (signed % 0x40000 fixup).
 * IDIV signed. CDQ+AND 1FFFh+ADD+SAR 13 = signed /0x2000 toward-zero.
 * No domain::.
 */

int __cdecl wm_GetRegionNumber(int x, int y)
{
    int y_rem;
    int y_scaled;
    int x_mod;

    y_rem = (y + 0x48000) % 0x30000; /* CDQ; IDIV ECX=0x30000; EAX = EDX remainder */
    y_scaled = (y_rem + ((y_rem >> 31) & 0x1FFF)) >> 13; /* CDQ; AND EDX,1FFFh; ADD; SAR ECX,13 */
    y_scaled <<= 5; /* SHL ECX,5  (32-column grid) */

    x_mod = x + 0x60000; /* LEA EAX,[EDX+0x60000] */
    x_mod &= 0x8003FFFF; /* keep sign + low 18 bits */
    if (x_mod < 0) { /* JNS loc_55394D skipped when SF=1 */
        x_mod--;
        x_mod |= 0xFFFC0000;
        x_mod++;
    }
    x_mod = (x_mod + ((x_mod >> 31) & 0x1FFF)) >> 13; /* CDQ; AND 1FFFh; ADD; SAR EAX,13 */
    return x_mod + y_scaled; /* ADD EAX,ECX */
}
```
