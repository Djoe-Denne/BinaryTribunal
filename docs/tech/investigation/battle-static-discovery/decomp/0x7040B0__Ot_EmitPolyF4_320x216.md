# Ot_EmitPolyF4_320x216 @ 0x7040B0

- Instr (live): 37
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=80
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=53
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Ot_EmitPolyF4_320x216(int, int, int, int, void *)
- Notes parent: POLY_F4 (0,0)-(320,216) tag 0x05000000 code 0x2A; RGB*(q12) sar 12 BYTE; 66 WORD xy; link Code1(g_BattleOTBase+0x20); ret poly+0x18. 0 JCC. Occupancy absente.

## C réconcilié

```c
/* Ot_EmitPolyF4_320x216 @ 0x7040B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 37 instr, size 0x7E, end 0x70412E. cdecl, 5 args, retn C3. ESI saved.
 * POLY_F4 (0,0)-(320,216), RGB*(q12)>>12, tag 0x05000000, GPU code 0x2A.
 * Link OtNode24_PoolAllocLink_Code1(g_BattleOTBase+0x20, poly); EAX leftover poly+0x18.
 * 0 JCC. No ja/jg/setcc/jpt. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 / 0x84: absent.
 * Width: 66 WORD xy at +8..+16; BYTE r/g/b/code at +4..+7; DWORD tag at +0.
 * imul 0F AF signed 32; sar 0Ch arithmetic >>12; store low byte only.
 */

extern unsigned int g_BattleOTBase; /* DWORD @ 0x1D8E04C, live size 4, no IDA type */

int __cdecl OtNode24_PoolAllocLink_Code1(int *, _DWORD *);

int __cdecl Ot_EmitPolyF4_320x216(int r, int g, int b, int q12, void *poly)
{
    unsigned char *p = (unsigned char *)poly;

    *(_WORD *)(p + 0x08) = 0;           /* x0, 66 89 46 08, AX=0 */
    *(_WORD *)(p + 0x10) = 0;           /* x2 */
    *(_WORD *)(p + 0x0E) = 0;           /* y1 */
    *(_WORD *)(p + 0x0A) = 0;           /* y0 */
    *(_WORD *)(p + 0x14) = 320;         /* x3, CX=0x140 */
    *(_WORD *)(p + 0x0C) = 320;         /* x1 */
    *(_WORD *)(p + 0x16) = 216;         /* y3, AX=0xD8 */
    *(_WORD *)(p + 0x12) = 216;         /* y2 */

    p[4] = (unsigned char)((r * q12) >> 12); /* BYTE [esi+4]=CL after imul/sar */
    p[5] = (unsigned char)((g * q12) >> 12);
    p[6] = (unsigned char)((b * q12) >> 12);

    *(_DWORD *)p = 0x05000000;          /* C7 06 00 00 00 05 */
    p[7] = 0x2A;                        /* GPU POLY_F4 */

    /* push esi; add edx,20h; push edx; call; add esp,8. Callee EAX discarded. */
    OtNode24_PoolAllocLink_Code1((int *)(g_BattleOTBase + 0x20), (_DWORD *)p);

    return (int)(p + 0x18);             /* lea eax,[esi+18h] */
}
```
