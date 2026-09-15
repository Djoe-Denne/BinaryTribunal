# BattleFile_StoreCharacterLoadResult @ 0x508470

- Instr (live): 3
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleFile_StoreCharacterLoadResult(int)
- Notes parent: 8B442404 A3C899D901 C3. DWORD store moffs32 0x1D999C8. EAX=arg. Occupancy 1+2 / 0xD0 absents. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleFile_StoreCharacterLoadResult @ 0x508470
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 3 instr, size 0xA, end 0x50847A. cdecl, 1 arg. No saved regs. retn C3.
 * Bytes: 8B442404 A3C899D901 C3. DWORD only. No 66. No call / add esp.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * EAX = arg_0 (A3 moffs32 does not clobber EAX). No setcc / jcc / jpt.
 * Data xrefs: callback pushed by BattleFile_CharacterLoad / LoadBS_b0wave.
 * No domain::.
 */

extern int BATTLE_PRESENTATION_FILE_RESULT; /* 0x1D999C8 DWORD A3 moffs32 */

int __cdecl BattleFile_StoreCharacterLoadResult(int result)
{
    BATTLE_PRESENTATION_FILE_RESULT = result;
    return result;
}
```
