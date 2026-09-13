# BattleUI_SetWidget_11hFF_12_1 @ 0x4B9C00

- Instr (live): 6
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleUI_SetWidget_11hFF_12_1(int slot_index)
- Notes parent: stride 0x14 via lea*5 puis *4 sur g_BattleUI_WidgetSlots 0x1D76628. BYTE +11=0xFF (C6 40 11 FF), BYTE +12=1 (C6 40 12 01). JAMAIS +10/+13/+04. Occupancy/GetRandomInt/0xD0/0x1D0 absents. EAX leftover = slot.

## C réconcilié

```c
/* BattleUI_SetWidget_11hFF_12_1 @ 0x4B9C00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 6 instr, size 0x17, end 0x4B9C17. IDA type int __cdecl(int).
 * Slot 0xD0 / F_CHAR 0x1D0 / occupancy / GetRandomInt: unused.
 * ja/jg/setcc/jpt: none. add esp: none. No callee.
 * BYTE C6: +11=0xFF requested, +12=1 transition. Never +10/+13/+04.
 */

typedef struct BattleHudWidgetSlot20 {
    void *update_callback;            /* +00 untouched */
    void *userdata_or_reserved;       /* +04 untouched */
    void *draw_callback;              /* +08 untouched */
    void *aux_callback;               /* +0C untouched */
    unsigned char current_state;      /* +10 untouched */
    unsigned char requested_state;    /* +11 BYTE C6 40 11 FF */
    unsigned char transition_state;   /* +12 BYTE C6 40 12 01 */
    unsigned char restore_state;      /* +13 untouched */
} BattleHudWidgetSlot20;

extern BattleHudWidgetSlot20 g_BattleUI_WidgetSlots[9]; /* 0x1D76628 */

int __cdecl BattleUI_SetWidget_11hFF_12_1(int slot_index)
{
    BattleHudWidgetSlot20 *slot;

    /* lea eax,[eax+eax*4]; lea eax,ds:1D76628h[eax*4] => index * 0x14 */
    slot = &g_BattleUI_WidgetSlots[slot_index];
    slot->requested_state = 0xFF;
    slot->transition_state = 1;
    return (int)slot; /* leftover EAX from lea; retn, no mov eax */
}
```
