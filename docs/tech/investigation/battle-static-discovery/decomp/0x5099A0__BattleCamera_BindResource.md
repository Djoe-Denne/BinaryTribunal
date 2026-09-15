# BattleCamera_BindResource @ 0x5099A0

- Instr (live): 5
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=95
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=15
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl BattleCamera_BindResource(void *resource)
- Notes parent: DWORD [esp+4] → push EAX → call BindResourceSections @ 0x509970 ; pop ecx = cdecl 4. EAX leftover. Pas occupancy 1+2. Pas 66.

## C réconcilié

```c
/* BattleCamera_BindResource @ 0x5099A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 5 instr, size 0xC, end 0x5099AC. cdecl, 1 arg. No saved regs. retn C3.
 * Bytes: 8B442404 50 E8C6FFFFFF 59 C3.
 * DWORD load arg; push EAX; call BattleCamera_BindResourceSections @ 0x509970;
 * pop ECX (cdecl 4-byte cleanup, not 83 C4 04); retn leftover EAX.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No 66 / BYTE / WORD store. No setcc / jcc / jpt / ja/jg.
 * No domain::.
 */

void *__cdecl BattleCamera_BindResourceSections(void *resource); /* 0x509970; pop ecx */

void *__cdecl BattleCamera_BindResource(void *resource)
{
    return BattleCamera_BindResourceSections(resource);
}
```
