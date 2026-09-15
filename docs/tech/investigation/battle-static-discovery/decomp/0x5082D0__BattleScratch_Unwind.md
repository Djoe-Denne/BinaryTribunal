# BattleScratch_Unwind @ 0x5082D0

- Instr (live): 7
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=22
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=80
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=98
- A==B: oui
- Push IDB: oui
- SetType: int __cdecl BattleScratch_Unwind(int nbytes)
- Notes parent: unwind DWORD `dword_1D999C4` ; `(nbytes+3)&0xFFFFFFFC` AND AL `24 FC` (pas AND EAX plein). EAX leftover = taille alignée, pas le curseur. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Inverse `bs_modulo` 0x5082B0. Pas alloc Cerberus.

## C réconcilié

```c
/* BattleScratch_Unwind @ 0x5082D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 7 instr, size 0x18, end 0x5082E8. cdecl, 1 arg. No saved regs. retn C3.
 * No call / add esp. Occupancy slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Widths: DWORD cursor 8B/2B/89. Align AND is 24 FC (AND AL,0FCh), not 83 E0 FC.
 * EAX leftover = aligned nbytes (no mov eax before ret). Inverse of bs_modulo 0x5082B0.
 * No setcc / jcc / jpt / GetRandomInt. No domain::.
 */

extern unsigned int dword_1D999C4; /* 0x1D999C4 DWORD battle-scratch bump cursor */

int __cdecl BattleScratch_Unwind(int nbytes)
{
    unsigned int aligned;

    aligned = (unsigned int)(nbytes + 3) & 0xFFFFFFFCu; /* 83 C0 03; 24 FC AND AL */
    dword_1D999C4 -= aligned;                             /* 8B 0D; 2B C8; 89 0D */
    return (int)aligned;                                  /* EAX leftover, not cursor */
}
```
