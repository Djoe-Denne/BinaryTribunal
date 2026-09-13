# bs_modulo @ 0x5082B0

- Instr (live): 8
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl bs_modulo(int nbytes)
- Notes parent: bump DWORD `dword_1D999C4` ; `(nbytes+3)&0xFFFFFFFC` AND EDX plein (pas AND AL). EAX = ancien curseur. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Inverse `BattleScratch_Unwind` 0x5082D0.

## C réconcilié

```c
/* bs_modulo @ 0x5082B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 8 instr, size 0x1B, end 0x5082CB. cdecl, 1 arg. No saved regs. retn C3.
 * No call / add esp. Occupancy slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Widths: all DWORD (8B/83/03/89). No 66. Align AND is 83 E2 FC (full EDX), not AND AL.
 * EAX = old dword_1D999C4 (8B C1 before 03 CA). Inverse: BattleScratch_Unwind 0x5082D0.
 * No setcc / jcc / jpt / GetRandomInt. No domain::.
 */

extern unsigned int dword_1D999C4; /* 0x1D999C4 DWORD battle-scratch bump cursor */

int __cdecl bs_modulo(int nbytes)
{
    unsigned int aligned;
    unsigned int old;

    aligned = (unsigned int)(nbytes + 3) & 0xFFFFFFFCu; /* 83 C2 03; 83 E2 FC */
    old = dword_1D999C4;                                 /* 8B 0D; 8B C1 EAX=old */
    dword_1D999C4 = old + aligned;                         /* 03 CA; 89 0D */
    return (int)old;
}
```
