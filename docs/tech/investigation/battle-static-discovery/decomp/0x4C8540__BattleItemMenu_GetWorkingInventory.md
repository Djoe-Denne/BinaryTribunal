# BattleItemMenu_GetWorkingInventory @ 0x4C8540

- Instr (live): 2
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui
- Push IDB: oui
- SetType: char *__cdecl BattleItemMenu_GetWorkingInventory(void)
- Notes parent: getter 2 instr. `mov eax, offset EQUAL_ITEM_ID` (B8 788ED201) puis `retn` (C3). EAX=&EQUAL_ITEM_ID 0x1D28E78. Pas de call/add esp/setcc/ja/jg/jpt/66. Xref data: Item jumptable case 2. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleItemMenu_GetWorkingInventory @ 0x4C8540
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 2 instr, size 6, end 0x4C8546. IDA type char *().
 * Bytes: B8 78 8E D2 01 C3 = mov eax, offset EQUAL_ITEM_ID ; retn.
 * No callees, no add esp, no stack frame, no stores, no setcc, no ja/jg, no jpt, no 66.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Data xref only: push offset this func (Item jumptable case 2).
 */

extern unsigned char EQUAL_ITEM_ID[]; /* 0x1D28E78; qty at +1; pairs stride 5 */

char *__cdecl BattleItemMenu_GetWorkingInventory(void)
{
    return (char *)EQUAL_ITEM_ID;
}
```
