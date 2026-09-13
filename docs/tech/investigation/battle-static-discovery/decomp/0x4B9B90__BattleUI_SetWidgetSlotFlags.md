# BattleUI_SetWidgetSlotFlags @ 0x4B9B90

- Instr (live): 25
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=21
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=32
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=121
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleUI_SetWidgetSlotFlags(int slot_index, int flags);
- Notes parent: stride `lea [eax+eax*4]` + `lea ds:1D76628h[eax*4]` = index*0x14 (pas 0xD0) ; `jle` 7E signé sur arg_4 ; stores BYTE +10/+11/+12 et +13 seulement si `[+10]==1` et flags>0 ; `or cl,0FFh` si flags<=0 ; EAX leftover = pointeur slot.

## C réconcilié

```c
/* BattleUI_SetWidgetSlotFlags @ 0x4B9B90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 25 instr, size 0x43. cdecl. BYTE stores. stride 0x14.
 */

extern unsigned char g_BattleUI_WidgetSlots[]; /* 0x1D76628, 9 x 0x14 */

int __cdecl BattleUI_SetWidgetSlotFlags(int slot_index, int flags)
{
    unsigned char *slot;
    unsigned char cl;

    /* lea eax,[eax+eax*4]; lea eax, ds:1D76628h[eax*4] => index*0x14 */
    slot = g_BattleUI_WidgetSlots + slot_index * 0x14;
    cl = (unsigned char)flags;

    if (flags <= 0) { /* test ecx,ecx; jle loc_4B9BC5 (7E signed, not ja) */
        cl |= 0xFFu;               /* or cl, 0FFh */
        slot[0x10] = cl;           /* BYTE 88 48 10 current */
        slot[0x11] = cl;           /* BYTE 88 48 11 requested */
        slot[0x12] = 1;            /* C6 40 12 01 transition */
        /* +13 restore not written */
    } else if (slot[0x10] == 1) { /* mov bl,[eax+10h]; mov dl,1; cmp bl,dl; jnz loc_4B9BBB */
        slot[0x13] = cl;           /* BYTE 88 48 13 restore */
        slot[0x11] = cl;           /* BYTE 88 48 11 */
        slot[0x12] = 1;            /* mov [eax+12h], dl */
        /* +10 current not written */
    } else { /* loc_4B9BBB */
        slot[0x10] = cl;           /* BYTE 88 48 10 */
        slot[0x11] = cl;           /* BYTE 88 48 11 */
        slot[0x12] = 1;            /* mov [eax+12h], dl */
        /* +13 restore not written */
    }

    return (int)slot; /* EAX leftover from lea; three retn, no mov eax */
}
```
