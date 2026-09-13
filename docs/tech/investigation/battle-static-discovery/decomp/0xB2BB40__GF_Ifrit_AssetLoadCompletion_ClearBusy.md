# GF_Ifrit_AssetLoadCompletion_ClearBusy @ 0xB2BB40

- Instr (live): 2
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void __cdecl GF_Ifrit_AssetLoadCompletion_ClearBusy(void)
- Notes parent: Callback completion BattleFile_preLoad. Store BYTE C6 05 GF_IFRIT_ASSET_LOAD_BUSY@0x2798219 = 0 puis retn C3. Pas d'EAX écrit. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 / 0x84 absents.

## C réconcilié

```c
/* GF_Ifrit_AssetLoadCompletion_ClearBusy @ 0xB2BB40
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 2 instr, size 0x8, end 0xB2BB48. IDA type void(); cdecl, 0 args, retn C3.
 * FLAGS 0x5400. FRSIZE 0. FRREGS 0. FUNC_THUNK=0. No ebp. No locals. No esi/edi/ebx.
 * No call. No add esp. No loc_/jpt_/setcc/jcc.
 * Store: C6 05 19 82 79 02 00 = MOV r/m8, imm8 → BYTE GF_IFRIT_ASSET_LOAD_BUSY@0x2798219 = 0.
 * item_size=1. No 66. Not WORD/DWORD. EAX not written (void leftover).
 * Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0 / GFSG 0x44 / K_GF 0x84: absent.
 * No packed struct. No domain::.
 */

extern unsigned char GF_IFRIT_ASSET_LOAD_BUSY; /* 0x2798219, size 1 */

void __cdecl GF_Ifrit_AssetLoadCompletion_ClearBusy(void)
{
    GF_IFRIT_ASSET_LOAD_BUSY = 0;
}
```
