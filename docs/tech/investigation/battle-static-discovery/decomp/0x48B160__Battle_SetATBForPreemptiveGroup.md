# Battle_SetATBForPreemptiveGroup @ 0x48B160

- Instr (live): 42
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=199
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4568
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=135
- A==B: non
- Push IDB: oui
- SetType: void __cdecl Battle_SetATBForPreemptiveGroup(int p_0_to_3_related_back_preemptive)
- Notes parent: jpt_48B16D 4 cases 0..3 `ja` UNSIGNED ; occupancy 1+2 absent (`test byte status_1, 5`) ; party 0..2 / ennemis 3..6 stride `0xD0` ; CHARA `0x1D0` bit DWORD `0x10000` ; stores DWORD ATB ; `jl` signé ; pas de `66` / setcc / call. Pas de Hex-Rays.

## C réconcilié

```c
/* Battle_SetATBForPreemptiveGroup @ 0x48B160
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 42 instr, size 0xA3. No args besides DWORD mode. No call / add esp.
 * No domain::. No occupancy 1+2. No 66. No setcc.
 * jpt_48B16D @ 0x48B204: cases 0..3, cmp eax,3 ; ja UNSIGNED.
 * Slot stride 0xD0. F_CHAR CHARA_ABILITIES stride 0x1D0.
 * status_1 tested as BYTE mask 5 (Death|Petrify). ATB stores DWORD.
 * Loop cmps are jl SIGNED (7C); addrs 0x01xxxxxx so same as unsigned.
 */

extern unsigned char  BATTLE_SLOT_DATA[];              /* 0x1D27B10 stride 0xD0 */
extern unsigned char  CHARA_ABILITIES[];               /* 0x1CFF190 stride 0x1D0 */
extern unsigned short word_1CFF700[];                   /* 0x1CFF700 CHARA exclusive end */
extern unsigned short END_MONSTER_DATA_IN_BATTLE[];    /* 0x1D28140 slot[7].status_1 exclusive */
extern unsigned int   dword_1D280D4[];                 /* 0x1D280D4 slot[7].cur_atb exclusive */

void __cdecl Battle_SetATBForPreemptiveGroup(int p_0_to_3_related_back_preemptive)
{
    unsigned char *st1; /* eax walker on status_1 */
    unsigned char *cur; /* ecx/eax walker on cur_atb */
    unsigned char *ab;  /* eax walker on CHARA_ABILITIES */

    /* 8B 44 24 04 ; 83 F8 03 ; 0F 87 95 00 00 00 ja def_48B16D */
    switch ((unsigned int)p_0_to_3_related_back_preemptive) {
    case 0: /* loc_48B174 party full: slots 0..2 */
        st1 = BATTLE_SLOT_DATA + 0x80; /* 0x1D27B90 */
        do {
            /* F6 00 05 ; 75 08 */
            if (*st1 & 5)
                *(unsigned int *)(st1 - 0x6C) = 0; /* C7 40 94 DWORD cur_atb */
            else
                *(unsigned int *)(st1 - 0x6C) = *(unsigned int *)(st1 - 0x70);
            st1 += 0xD0;
        } while ((int)st1 < (int)(BATTLE_SLOT_DATA + 0x80 + 0x270)); /* 7C E0 vs 0x1D27E00 */
        return;

    case 1: /* loc_48B19A party zero unless CHARA DWORD 0x10000 */
        cur = BATTLE_SLOT_DATA + 0x14; /* 0x1D27B24 */
        ab = CHARA_ABILITIES;            /* 0x1CFF190 */
        do {
            /* F7 00 00 00 01 00 ; 75 06 */
            if (!(*(unsigned int *)ab & 0x10000))
                *(unsigned int *)cur = 0; /* C7 01 DWORD */
            ab += 0x1D0;
            cur += 0xD0;
        } while ((int)ab < (int)word_1CFF700); /* 7C E0 */
        return;

    case 2: /* loc_48B1C5 enemy full: slots 3..6 */
        st1 = BATTLE_SLOT_DATA + 0x80 + 0x270; /* 0x1D27E00 */
        do {
            if (*st1 & 5)
                *(unsigned int *)(st1 - 0x6C) = 0;
            else
                *(unsigned int *)(st1 - 0x6C) = *(unsigned int *)(st1 - 0x70);
            st1 += 0xD0;
        } while ((int)st1 < (int)END_MONSTER_DATA_IN_BATTLE); /* 0x1D28140 */
        return;

    case 3: /* loc_48B1EB enemy zero: slots 3..6, no status test */
        cur = BATTLE_SLOT_DATA + 0x14 + 0x270; /* 0x1D27D94 */
        do {
            *(unsigned int *)cur = 0; /* C7 00 */
            cur += 0xD0;
        } while ((int)cur < (int)dword_1D280D4); /* 7C EE */
        return;

    default: /* def_48B16D @ 0x48B202 shared retn */
        return;
    }
}
```
