# BattleFile_InitState_1DCD6EC @ 0x534110

- Instr (live): 14
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=50
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=42
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=57
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleFile_InitState_1DCD6EC(_BYTE *arg_0)
- Notes parent: Deux A3 DWORD `dword_1DCD6EC` / `dword_1DCD6E4` = arg_0. Cinq stores BYTE : +0/+1/+4/+3 = 0 puis +2 = 1. EAX leftover = pointeur. Occupancy / 0xD0 / 0x1D0 / 0x44 absents.

## C réconcilié

```c
/* BattleFile_InitState_1DCD6EC @ 0x534110
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 14 instr, size 0x36, end 0x534146. cdecl, 1 arg. No saved regs. retn C3.
 * No callees. No add esp. No 66. No jump table. No loc_/jpt_.
 * DWORD A3: dword_1DCD6EC @ 0x1DCD6EC and dword_1DCD6E4 @ 0x1DCD6E4 = arg_0.
 * BYTE 88 08: [arg_0+0]=0. Reloads A1/8B15/8B0D dword_1DCD6EC then:
 * BYTE 88 48 01 [+1]=0; 88 4A 04 [+4]=0; 88 48 03 [+3]=0; C6 41 02 01 [+2]=1.
 * EAX leftover = last A1 dword_1DCD6EC (the pointer).
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain::.
 */

extern int dword_1DCD6EC;
extern int dword_1DCD6E4;

int __cdecl BattleFile_InitState_1DCD6EC(_BYTE *arg_0)
{
    dword_1DCD6EC = (int)arg_0; /* A3 EC D6 DC 01 */
    dword_1DCD6E4 = (int)arg_0; /* A3 E4 D6 DC 01 */
    *arg_0 = 0;                              /* 88 08 BYTE */
    *(_BYTE *)(dword_1DCD6EC + 1) = 0;       /* 88 48 01 BYTE */
    *(_BYTE *)(dword_1DCD6EC + 4) = 0;       /* 88 4A 04 BYTE */
    *(_BYTE *)(dword_1DCD6EC + 3) = 0;       /* 88 48 03 BYTE */
    *(_BYTE *)(dword_1DCD6EC + 2) = 1;       /* C6 41 02 01 BYTE */
    return dword_1DCD6EC;
}
```
