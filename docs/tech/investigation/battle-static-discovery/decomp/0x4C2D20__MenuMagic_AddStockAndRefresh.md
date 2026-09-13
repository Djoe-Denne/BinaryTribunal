# MenuMagic_AddStockAndRefresh @ 0x4C2D20

- Instr (live): 19
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=31
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MenuMagic_AddStockAndRefresh(int chara_index, int magic_id, int add_delta)
- Notes parent: Wrapper cdecl 5 pushes + add esp,14h. EAX=AddStockRaw (EDI). Prune/Rebuild discard. DWORD 8B, pas de 66. Occupancy/GetRandomInt/slot/F_CHAR absents. Callers MenuRefine 0x4D7A8F / 0x4D7BAD.

## C réconcilié

```c
/* MenuMagic_AddStockAndRefresh @ 0x4C2D20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 19 instr, size 0x2C, end 0x4C2D4C. cdecl. No domain::.
 * Loads arg_8/arg_4/arg_0 as DWORD (8B, no 66). ESI frozen as arg_0.
 * 5 cdecl pushes, one add esp,14h. Return EAX = AddStockRaw (saved EDI).
 * Occupancy 1+2 unused. GetRandomInt absent. Slot 0xD0 / F_CHAR 0x1D0 unused.
 */

int __cdecl MenuMagic_AddStockRaw(int chara_index, int magic_id, int add_delta);
int __cdecl MenuMagic_PruneZeroStockAndJunctionRefs(int chara_index);
__int16 __cdecl MenuMagic_RebuildPartyDerivedState(int chara_index);

int __cdecl MenuMagic_AddStockAndRefresh(int chara_index, int magic_id, int add_delta)
{
    int added;

    added = MenuMagic_AddStockRaw(chara_index, magic_id, add_delta);
    MenuMagic_PruneZeroStockAndJunctionRefs(chara_index);
    MenuMagic_RebuildPartyDerivedState(chara_index);
    return added;
}
```
