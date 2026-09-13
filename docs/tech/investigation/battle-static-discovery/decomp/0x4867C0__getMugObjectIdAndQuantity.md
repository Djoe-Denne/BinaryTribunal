# getMugObjectIdAndQuantity @ 0x4867C0

- Instr (live): 83
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=69
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=131
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=193
- A==B: non
- Push IDB: oui
- SetType: int __cdecl getMugObjectIdAndQuantity(int p_target_slot_id, _BYTE *p_object_id, _BYTE *p_object_quantity, int p_spd)
- Notes parent: Slot*0xD0 puis **monster_info_section (deux loads). MugRate +0x14C BYTE. GetRandomInt AL only, 0 args. jg/jge/setnl signed. cdq/sar = spd/2. Rare bit2: 80/F2/105; sinon B2/E5/F4. BMI71 slot*71. BYTE +0x11C/+0x11D. EAX 2/0/1. Occupancy 1+2 / F_CHAR / GF Exists absents.

## C réconcilié

```c
/* getMugObjectIdAndQuantity @ 0x4867C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 83 instr, size 0xF6, end 0x4868B6. cdecl, retn C3, 4 args.
 * Saved ebp/esi/edi. Slot stride 0xD0. Occupancy 1+2 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Battle_GetRandomInt: unsigned __int8 cdecl(), AL only, no add esp.
 * jg/jge/setnl signed. BYTE stores id/qty. No domain::.
 */

extern FF8BattleSlotData_s BATTLE_SLOT_DATA[]; /* 0x1D27B10, stride 0xD0 */
extern unsigned __int8 RARE_ITEM_ABILITY_IN_IT; /* 0x1CFF6D8, bit 2 */
extern unsigned __int8 BMI71_LOW_MED_HIGH_LEVEL_BIS[]; /* 0x1D28E89, index slot*71 */
unsigned __int8 __cdecl Battle_GetRandomInt(void);

int __cdecl getMugObjectIdAndQuantity(
    int p_target_slot_id,
    unsigned __int8 *p_object_id,
    unsigned __int8 *p_object_quantity,
    int p_spd)
{
    ff8_battle_monster_info *mon;
    int mug_rate;
    unsigned int roll;
    int tier;
    unsigned int level_band;
    int mug_row;

    /* mov edx, slot.monster_info_section; mov ebp, [edx] */
    mon = *BATTLE_SLOT_DATA[p_target_slot_id].monster_info_section;
    mug_rate = (unsigned __int8)mon->MugRate; /* +0x14C, xor eax,eax / mov al */
    if (!mug_rate)
        return 2;

    roll = (unsigned __int8)Battle_GetRandomInt(); /* mov cl, al; and ecx, 0FFh */
    /* cdq; sub eax, edx; sar eax, 1 == signed p_spd / 2; jg signed */
    if ((int)roll > mug_rate + p_spd / 2)
        return 0;

    roll = Battle_GetRandomInt() & 0xFF; /* and eax, 0FFh */
    if (RARE_ITEM_ABILITY_IN_IT & 2)
    {
        if ((int)roll < 0x80)
            tier = 0;
        else if ((int)roll < 0xF2)
            tier = 1;
        else
            tier = 2 + ((int)roll >= 0x105); /* setnl vs 261 */
    }
    else
    {
        if ((int)roll < 0xB2)
            tier = 0;
        else if ((int)roll < 0xE5)
            tier = 1;
        else
            tier = 2 + ((int)roll >= 0xF4); /* setnl */
    }

    level_band = (unsigned __int8)BMI71_LOW_MED_HIGH_LEVEL_BIS[p_target_slot_id * 71];
    mug_row = tier + (int)level_band * 4; /* lea eax, [eax+ecx*4] */
    *p_object_id = *((unsigned __int8 *)mon + 0x11C + mug_row * 2);
    *p_object_quantity = *((unsigned __int8 *)mon + 0x11D + mug_row * 2);
    return 1;
}
```
