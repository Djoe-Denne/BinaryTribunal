# MenuMagic_RemoveStockAndRefresh @ 0x4C2DD0

- Instr (live): 15
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=24
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=24
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=24
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MenuMagic_RemoveStockAndRefresh(int chara_index, int magic_id, int remove_delta)
- Notes parent: Wrapper cdecl 5 pushes + add esp,14h. EAX leftover Rebuild (__int16), RemoveStockRaw discard (pas EDI). DWORD 8B, pas de 66. Occupancy/GetRandomInt/slot/F_CHAR absents. Caller MenuRefine 0x4D7BBE (xor eax,eax).

## C réconcilié

```c
/* MenuMagic_RemoveStockAndRefresh @ 0x4C2DD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 15 instr, size 0x26, end 0x4C2DF6. cdecl. No domain::.
 * Loads arg_8/arg_4/arg_0 as DWORD (8B, no 66). ESI frozen as arg_0.
 * 5 cdecl pushes, one add esp,14h.
 * Return EAX leftover = MenuMagic_RebuildPartyDerivedState (__int16).
 * RemoveStockRaw EAX discarded (no EDI, unlike AddStockAndRefresh).
 * Occupancy 1+2 unused. GetRandomInt absent. Slot 0xD0 / F_CHAR 0x1D0 unused.
 */

int __cdecl MenuMagic_RemoveStockRaw(int chara_index, int magic_id, int remove_delta);
int __cdecl MenuMagic_PruneZeroStockAndJunctionRefs(int chara_index);
__int16 __cdecl MenuMagic_RebuildPartyDerivedState(int chara_index);

int __cdecl MenuMagic_RemoveStockAndRefresh(int chara_index, int magic_id, int remove_delta)
{
    MenuMagic_RemoveStockRaw(chara_index, magic_id, remove_delta);
    MenuMagic_PruneZeroStockAndJunctionRefs(chara_index);
    return MenuMagic_RebuildPartyDerivedState(chara_index);
}
```
