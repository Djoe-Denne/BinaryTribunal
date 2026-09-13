# BattleUI_ClampWidgetSlotsDown @ 0x4B9C40

- Instr (live): 21
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=474
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=722
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=741
- A==B: non
- Push IDB: oui
- SetType: _BYTE *__cdecl BattleUI_ClampWidgetSlotsDown(int)
- Notes parent: stride 0x14 g_BattleUI_WidgetSlots. jl signé index<0. Walk edx=index+1, cursor +10, sub 14h. BYTE +10/+13. jle signé +10<=0 → +13/+10=FF sinon +10=1 (copy +13 sauf si +10==1). Occupancy/GetRandomInt/0xD0/0x1D0 absents. EAX leftover 0x1D76624. Pas de Hex-Rays. Pas de callee.

## C réconcilié

```c
/* BattleUI_ClampWidgetSlotsDown @ 0x4B9C40
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 21 instr, size 0x3A, end 0x4B9C7A. IDA type _BYTE *__cdecl(int).
 * No domain::. No callee / add esp.
 * Stride 0x14 (not slot 0xD0 / F_CHAR 0x1D0). Occupancy 1+2 unused.
 * GetRandomInt absent (no AL). GF Exists 0x44 unused.
 * test ecx,ecx / jl SIGNED index<0 (LEA does not clobber flags).
 * cmp byte ptr [eax],0 / jle SIGNED. BYTE 8A/88/C6 only, no 66.
 * Walk: edx=index+1, eax=+10 of slot[index], sub 0x14 per iter down to slot[0].
 * EAX leftover: early &slots[index]; after loop 0x1D76624.
 */

typedef struct BattleHudWidgetSlot20 {
    void *update_callback;          /* +00 DWORD, untouched */
    void *userdata_or_reserved;     /* +04 never written */
    void *draw_callback;            /* +08 DWORD, untouched */
    void *aux_callback;             /* +0C DWORD, untouched */
    unsigned char current_state;    /* +10 BYTE 8A/C6 */
    unsigned char requested_state;  /* +11 untouched */
    unsigned char transition_state; /* +12 untouched */
    unsigned char restore_state;    /* +13 BYTE 88/C6 */
} BattleHudWidgetSlot20;

extern BattleHudWidgetSlot20 g_BattleUI_WidgetSlots[9]; /* 0x1D76628 */

unsigned char *__cdecl BattleUI_ClampWidgetSlotsDown(int slot_index)
{
    unsigned char *p;
    int count;
    unsigned char cur;

    p = (unsigned char *)&g_BattleUI_WidgetSlots[slot_index];

    if (slot_index < 0)
        return p;

    p += 0x10;
    count = slot_index + 1;

    do {
        cur = p[0];

        if (cur != 1)
            p[3] = cur;

        if ((signed char)p[0] <= 0) {
            p[3] = 0xFF;
            p[0] = 0xFF;
        } else {
            p[0] = 1;
        }

        p -= 0x14;
        count--;
    } while (count != 0);

    return p;
}
```
