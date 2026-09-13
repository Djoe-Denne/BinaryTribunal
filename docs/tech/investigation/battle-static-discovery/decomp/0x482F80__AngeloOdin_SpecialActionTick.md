# AngeloOdin_SpecialActionTick @ 0x482F80

- Instr (live): 151
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5050
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4873
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4144 (retry max-tokens 65536 after length/empty)
- A==B: non
- Push IDB: oui
- SetType: void AngeloOdin_SpecialActionTick(void)
- Notes parent: WORD `BATTLE_DEAD_TIMER` `dec` si !=0 ; Gilgamesh `test SG,8` + BYTE flag==0 + `12/255` puis AL `quartile+7` BYTE RELATED, enqueue `(slot,7,0)`, skip Angelo ; `test SG,10h` skip Angelo ; `FindSlotByCharFileId(4)` `0xFF` skip ; party 0..2 stride `0xD0` bound `0x1D27E00` `jl` ; occupancy BYTE `flag_data` `[status_1-4]` bit0 ; HP<25% BYTE `[+1]` bit0 `8/255` Select `(0,0xC8,0,8)` RELATED=0Ch enqueue 8 ; Rinoa death BYTE status_1 `8/255` `power|0x4000` RELATED=0Dh enqueue 8 ; autre mort `2/255` Select `(0,0xC8,0,0)` `or ah,40h` Queue `0Dh` ; bit3 BYTE status_1&5 + DWORD status_2 `0x1D27B18`&4009h `8/255` Queue `0Eh` ; reset `movzx ax, K_MISC.dead_timer`. Pas de `jpt_` ; GetRandomInt absent (AL via quartile seulement).

## C réconcilié

```c
/* AngeloOdin_SpecialActionTick @ 0x482F80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 151 instr, size 0x206. IDA type void() — EAX leftover / AX=dead_timer on reset paths.
 */

typedef struct FF8BattleExecQueueCell FF8BattleExecQueueCell;

extern unsigned short BATTLE_DEAD_TIMER;        /* 0x1D28DE4 WORD ; 66 83 3d / 66 a3 / 66 ff 0d */
extern unsigned char  K_MISC_dead_timer;         /* 0x1CF8B23 BYTE K_MISC.dead_timer ; movzx ax */
extern unsigned char  SG_ODIN_ANGEL_GILGA_FLAG; /* 0x1CFE97A BYTE ; test 8 / test 10h */
extern unsigned char  GILGAMESH_TRIGGERED_FLAG; /* 0x1D28E1D BYTE */
extern unsigned char  RELATED_ODIN_SUMMONED;    /* 0x1D28E14 BYTE ; A2 / C6 */
extern unsigned short p_mask_attacker_slot;     /* 0x1D28DE6 WORD ; 66 A3 */
extern unsigned char  SG_ANGELO_COMPLETED;       /* 0x1CFE772 BYTE */

extern int __cdecl isRandomProbaNumDen255(int numerator, int denominator); /* add esp, 8 */
extern int Battle_GetRandomQuartile0To3(void); /* AL used: add al, 7 */
extern int Battle_FindFirstAlivePartySlot(void);
extern FF8BattleExecQueueCell *__cdecl Battle_EnqueueSpecialAction(int slot, short special_id, int group); /* add esp, 0Ch */
extern int __cdecl Battle_FindSlotByCharFileId(int char_file_id); /* add esp, 4 */
extern int __cdecl power_of_two(int p_exposant); /* add esp, 4 when cleaned */
extern short __cdecl BattleTarget_SelectByStatusOrStat(int p_unknown_bool, int p_target, int p_comparator, int p_status); /* add esp, 10h */
extern int __cdecl Angelo_QueueVariantAction(char variant_id, short mask);

void AngeloOdin_SpecialActionTick(void)
{
    int esi;              /* Rinoa slot from FindSlotByCharFileId(4) */
    int ecx;              /* party index 0..2 */
    unsigned char *p;    /* EAX cursor: BATTLE_SLOT_DATA.status_1 */
    unsigned short ax;
    unsigned int off;

    /* 66 83 3d ... 00 / jnz loc_48317E — ebx/esi not yet pushed */
    if (BATTLE_DEAD_TIMER != 0) {
        --BATTLE_DEAD_TIMER;
        return;
    }

    /* test al, 8 / GILGAMESH_TRIGGERED_FLAG / isRandomProbaNumDen255(0Ch, 0FFh) */
    if ((SG_ODIN_ANGEL_GILGA_FLAG & 8) != 0
        && GILGAMESH_TRIGGERED_FLAG == 0
        && isRandomProbaNumDen255(0xC, 0xFF) != 0)
    {
        /* add al, 7 ; BYTE RELATED ; Enqueue(FindFirst, 7, 0) ; BYTE flag=1 */
        RELATED_ODIN_SUMMONED = (unsigned char)(Battle_GetRandomQuartile0To3() + 7);
        Battle_EnqueueSpecialAction(Battle_FindFirstAlivePartySlot(), 7, 0);
        GILGAMESH_TRIGGERED_FLAG = 1;
        goto loc_48312B;
    }

    /* loc_482FDF: test SG, 10h / jnz loc_48312B */
    if ((SG_ODIN_ANGEL_GILGA_FLAG & 0x10) != 0)
        goto loc_48312B;

    esi = Battle_FindSlotByCharFileId(4);
    if (esi == 0xFF)
        goto loc_48312B;

    /* bit1=2: party 0..2 occupancy flag_data bit0 + status_1+1 bit0 (0x100 HP<25%) */
    if ((SG_ANGELO_COMPLETED & 2) != 0) {
        ecx = 0;
        p = (unsigned char *)0x1D27B90;
        while ((int)p < (int)0x1D27E00) {
            if (ecx != esi && (p[-4] & 1) != 0 && (p[1] & 1) != 0) {
                /* loc_483090: 8/255 fail jz loc_483032 — do not continue scan */
                if (isRandomProbaNumDen255(8, 0xFF) == 0)
                    goto loc_483032;
                /* Select then BYTE RELATED=0Ch then loc_483076 (AX unchanged) */
                ax = (unsigned short)BattleTarget_SelectByStatusOrStat(0, 0xC8, 0, 8);
                RELATED_ODIN_SUMMONED = 0xC;
                goto loc_483076;
            }
            p += 0xD0;
            ++ecx;
        }
    }

loc_483032:
    /* test SG_ANGELO_COMPLETED, 4 / jz loc_4830E0 — skips Rinoa death AND loc_4830BF */
    if ((SG_ANGELO_COMPLETED & 4) == 0)
        goto loc_4830E0;

    /* lea/shl esi*0xD0 ; test BYTE status_1, bl=1 / jz loc_4830BF */
    if ((*(unsigned char *)(0x1D27B90 + esi * 0xD0) & 1) == 0)
        goto loc_4830BF;
    if (isRandomProbaNumDen255(8, 0xFF) == 0)
        goto loc_4830BF;
    /* power_of_two ; or ah, 40h ; BYTE RELATED=0Dh */
    ax = (unsigned short)(power_of_two(esi) | 0x4000);
    RELATED_ODIN_SUMMONED = 0xD;
    goto loc_483076;

loc_4830BF:
    ecx = 0;
    p = (unsigned char *)0x1D27B90;
    while ((int)p < (int)0x1D27E00) {
        if (ecx != esi && (p[-4] & 1) != 0 && (p[0] & 1) != 0) {
            /* loc_48313C: 2/255 fail jz loc_4830E0 — do not continue scan */
            if (isRandomProbaNumDen255(2, 0xFF) == 0)
                goto loc_4830E0;
            ax = (unsigned short)BattleTarget_SelectByStatusOrStat(0, 0xC8, 0, 0);
            ax |= 0x4000; /* or ah, 40h */
            Angelo_QueueVariantAction(0xD, (short)ax);
            /* own epilogue: movzx ax, dead_timer ; add esp, 18h ; WORD store ; pop ; retn */
            BATTLE_DEAD_TIMER = (unsigned short)K_MISC_dead_timer;
            return;
        }
        p += 0xD0;
        ++ecx;
    }

loc_4830E0:
    if ((SG_ANGELO_COMPLETED & 8) != 0) {
        off = (unsigned int)(esi * 0xD0);
        /* test BYTE status_1, 5 / jnz loc_48312B ; test DWORD status_2, 4009h / jnz */
        if ((*(unsigned char *)(0x1D27B90 + off) & 5) == 0
            && (*(unsigned int *)(0x1D27B18 + off) & 0x4009) == 0
            && isRandomProbaNumDen255(8, 0xFF) != 0)
        {
            /* power_of_two not cleaned ; push eax ; push 0Eh ; add esp, 0Ch at loc_483128 */
            Angelo_QueueVariantAction(0xE, (short)power_of_two(esi));
        }
    }

loc_48312B:
    BATTLE_DEAD_TIMER = (unsigned short)K_MISC_dead_timer;
    return;

loc_483076:
    /* push 0 ; push 8 ; WORD p_mask = AX ; FindFirst ; Enqueue ; jmp loc_483128 */
    p_mask_attacker_slot = ax;
    Battle_EnqueueSpecialAction(Battle_FindFirstAlivePartySlot(), 8, 0);
    goto loc_48312B;
}
```
