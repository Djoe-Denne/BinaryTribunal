# BattleUI_EnterHudMode @ 0x47D890

- Instr (live): 2
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non (sémantique identique ; largeur du store absente)
- Push IDB: oui
- SetType: int __cdecl BattleUI_EnterHudMode();
- Notes parent: octets live `66 C7 05 … 03 00` = store **word** (item_size global = 2), pas dword. Tail jmp `E9` vers `BattleUI_InitHudAndWidgetRegistry` (EAX passthrough). Unique xref `0x506D49`. Réconciliation Grok 4.6 Extra High.

## C réconcilié

```c
/* BattleUI_EnterHudMode @ 0x47D890
 * Ground truth = live ASM (asm_clean.asm), not Hex-Rays.
 * 2 instr. cdecl int(void). Tail jmp, not call.
 */

extern __int16 mode_Battle_AnimationState; /* word @ 0x1CDBFE0; 66 C7 05 */
extern int  __cdecl BattleUI_InitHudAndWidgetRegistry(void); /* 0x4A94D0 */

int __cdecl BattleUI_EnterHudMode(void)
{
    mode_Battle_AnimationState = 3; /* word ptr [0x1CDBFE0], 3 — not dword */
    return BattleUI_InitHudAndWidgetRegistry(); /* jmp @ 0x47D899; EAX passthrough */
}
```
