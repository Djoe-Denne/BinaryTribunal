# BattleUI_RegisterWidgetSlot @ 0x4B9AD0

- Instr (live): 14
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void __cdecl BattleUI_RegisterWidgetSlot(int slot_index, void *update_callback, void *draw_callback, void *aux_callback)
- Notes parent: stride 0x14 via lea*5 puis *4 sur g_BattleUI_WidgetSlots 0x1D76628. BYTE +10/+11=0xFF (or cl,0FFh) ; BYTE +12=0 ; DWORD +00/+08/+0C. JAMAIS +04 ni +13. Occupancy/GetRandomInt/0xD0/0x1D0 absents. void, EAX leftover = slot.

## C réconcilié

```c
/* BattleUI_RegisterWidgetSlot @ 0x4B9AD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 14 instr, size 0x30, end 0x4B9B00. No domain::.
 * Live IDA: BattleHudWidgetSlot20[9] g_BattleUI_WidgetSlots @ 0x1D76628.
 * Stride: lea eax,[eax+eax*4]; lea eax,ds:1D76628h[eax*4] => index * 0x14.
 * Occupancy 1+2 unused. GetRandomInt absent. Slot 0xD0 / F_CHAR 0x1D0 unused.
 * No 66 prefix. No bounds check. No callee / add esp.
 * +04 userdata_or_reserved and +13 restore_state are never stored here.
 */

typedef struct BattleHudWidgetSlot20 {
    void *update_callback;           /* +00 DWORD 89 08 */
    void *userdata_or_reserved;     /* +04 never written */
    void *draw_callback;            /* +08 DWORD 89 50 08 */
    void *aux_callback;               /* +0C DWORD 89 48 0C */
    unsigned char current_state;     /* +10 BYTE 88 48 10 */
    unsigned char requested_state; /* +11 BYTE 88 48 11 */
    unsigned char transition_state; /* +12 BYTE C6 40 12 00 */
    unsigned char restore_state;   /* +13 never written */
} BattleHudWidgetSlot20;

extern BattleHudWidgetSlot20 g_BattleUI_WidgetSlots[9]; /* 0x1D76628 */

void __cdecl BattleUI_RegisterWidgetSlot(
    int slot_index,
    void *update_callback,
    void *draw_callback,
    void *aux_callback)
{
    unsigned char cl; /* 80 C9 FF or cl,0FFh → CL=0xFF; CH leftover unused */
    BattleHudWidgetSlot20 *slot;

    cl = 0xFFu;
    slot = &g_BattleUI_WidgetSlots[slot_index];

    slot->current_state = cl;                 /* BYTE +0x10 = 0xFF */
    slot->requested_state = cl;               /* BYTE +0x11 = 0xFF */
    slot->transition_state = 0;              /* BYTE +0x12 = 0 */
    slot->update_callback = update_callback;   /* DWORD +0x00 */
    slot->draw_callback = draw_callback;         /* DWORD +0x08 (edx) */
    slot->aux_callback = aux_callback;          /* DWORD +0x0C */
    /* void; leftover EAX = slot pointer, not a documented return */
}
```
