# setAllMonsterInfoFromDatSection @ 0x48BA10

- Instr (live): 145
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2183
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2750
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4127
- A==B: non
- Push IDB: oui
- SetType: int *()
- Notes parent: 8 scene idx (ebx 7..0, jg vs -1). Pack compact slot 3+ seulement si ENEMIES_VISIBILITY BYTE. Occupancy CONTRARY 1+2 (bit0 loop2). ** DAT via [edi-0BCh] puis [eax]. BMI setnl+inc, jge signed vs +0xF4/+0xF5. HP DWORD /20 (66666667h). Flag OR 2/0x40/0x80. Draw 4× BYTE ID+1 stride 4, jl vs END (4 rec 0x47). EAX leftover InitDrawSpell. Pas de Hex-Rays. GLM A offsets slot faux.

## C réconcilié

```c
/* setAllMonsterInfoFromDatSection @ 0x48BA10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 145 instr, size 0x1B4, range 0x48BA10..0x48BBC3. IDA type int *(). No domain::.
 * Slot stride 0xD0. Enemy pack from slot 3. BMI record stride 0x47 (4 records to END).
 * Occupancy CONTRARY to flag 1+2: loop1 ENEMIES_VISIBILITY BYTE; loop2 flag_data bit0 only.
 * monster_info_section @+0 is ** (mov eax,[edi-0BCh]; mov ecx,[eax]).
 * No 66 prefix. No jpt_. EAX = Battle_InitDrawSpellAvailability leftover.
 */

extern int __cdecl setMonsterInfoFromDatInfoSection(unsigned int p_slot_id, int p_level_code,
                                                    unsigned __int8 p_com_id); /* 0x48BBD0 add esp,0Ch */
extern unsigned int __cdecl BattleSlot_ApplyMonsterStatScaling(int p_slot_id);  /* 0x48C1C0; cleaned with next isBi */
extern BOOL __cdecl isBiAtpositionInIntegerSet(int integer_to_check, char bit_position); /* 0x47D9C0 */
extern int *__cdecl Battle_InitDrawSpellAvailability(void); /* 0x48C7A0 no args */

extern unsigned char BATTLE_SLOT_DATA[];                     /* 0x1D27B10 stride 0xD0 */
extern unsigned char ENEMIES_VISIBILITY[8];                  /* 0x1D2885C */
extern unsigned char CURRENT_ENCOUNTER_DATA_SCENE_OUT[];     /* 0x1D287DC FF8SceneOut */
extern unsigned char BMI_LOW_MED_HIGH_LEVEL;                 /* 0x1D28F5E */
extern unsigned char BMI_MONSTER1_DRAW_SPELL_ID1;            /* 0x1D28F18 */
extern unsigned char END_SOME_DATA_MONSTER;                  /* 0x1D29035 */

int *setAllMonsterInfoFromDatSection(void)
{
    int slot_id;              /* esi / attacker_slot_id: packed battle slot, starts 3 */
    int scene_idx;            /* eax / monster_slot_id_bis: scene 0..7, always ++ */
    int bitpos;               /* ebx / monster_index_bis: 7..0, signed jg vs -1 */
    unsigned char *bmi_rank;  /* ebp: BMI_LOW_MED_HIGH_LEVEL, +=0x47 only if visible */
    unsigned char *p_level;   /* edi: &slot.level, +=0xD0 only if visible */
    unsigned char *flagp;
    unsigned char *draw;
    unsigned char **info_pp;
    unsigned char *dat;
    int lv;
    int rank;
    int hp0, hp1, hp2, hp3;
    int max_hp;
    int i;

    slot_id = 3;
    scene_idx = 0;
    bitpos = 7;
    bmi_rank = &BMI_LOW_MED_HIGH_LEVEL;
    p_level = &BATTLE_SLOT_DATA[3 * 0xD0 + 0xBC]; /* offset BATTLE_SLOT_DATA.level+270h */

    /* loc_48BA39: cmp ebx,-1 / jg signed — 8 scene indices */
    while (bitpos > -1) {
        if (ENEMIES_VISIBILITY[scene_idx]) {
            /* push com, level, slot — cdecl (slot, level_code, com_id) */
            setMonsterInfoFromDatInfoSection(
                (unsigned int)slot_id,
                (int)CURRENT_ENCOUNTER_DATA_SCENE_OUT[0x78 + scene_idx], /* enemy_levels BYTE */
                CURRENT_ENCOUNTER_DATA_SCENE_OUT[0x38 + scene_idx]);     /* enemy_com_value BYTE */

            /* mov eax,[edi-0BCh]; mov ecx,[eax] — ** to DAT */
            info_pp = *(unsigned char ***)(p_level - 0xBC);
            dat = *info_pp;
            lv = p_level[0]; /* level BYTE zero-ext */

            /* signed jge vs DAT+0xF4/+0xF5 BYTE; setnl; inc */
            if (lv < (int)dat[0xF4])
                rank = 0;
            else
                rank = ((lv >= (int)dat[0xF5]) ? 1 : 0) + 1;
            bmi_rank[0] = (unsigned char)rank;

            /* BYTE hp0=+0x18 hp1=+0x19 hp2=+0x1A hp3=+0x1B; signed /20 via 66666667h sar 3 */
            hp0 = dat[0x18];
            hp1 = dat[0x19];
            hp2 = dat[0x1A];
            hp3 = dat[0x1B];
            max_hp = hp0 * lv * lv / 20
                   + lv * (hp0 + 100 * hp2)
                   + 10 * (hp1 + 100 * hp3);
            *(int *)(p_level - 0xA0) = max_hp; /* max_hp DWORD @ slot+0x1C */
            if (max_hp < *(int *)(p_level - 0xA4)) /* signed jge; current_hp @ slot+0x18 */
                *(int *)(p_level - 0xA4) = max_hp;

            BattleSlot_ApplyMonsterStatScaling(slot_id);
            /* add esp,0Ch cleans this 4-byte arg + next isBi's 8 */

            /* flag_data DWORD @ edi-40h = slot+0x7C. bitpos = ebx (7 for scene 0). */
            if (isBiAtpositionInIntegerSet(
                    CURRENT_ENCOUNTER_DATA_SCENE_OUT[4] & 0xFF, (char)bitpos))
                *(int *)(p_level - 0x40) |= 2; /* visible_enemies BYTE */
            if (isBiAtpositionInIntegerSet(
                    CURRENT_ENCOUNTER_DATA_SCENE_OUT[6], (char)bitpos))
                *(int *)(p_level - 0x40) |= 0x40; /* targetable_enemies BYTE */
            if (isBiAtpositionInIntegerSet(
                    CURRENT_ENCOUNTER_DATA_SCENE_OUT[5], (char)bitpos))
                *(int *)(p_level - 0x40) |= 0x80; /* loaded_enemies; or al,80h */

            slot_id++;
            bmi_rank += 0x47;
            p_level += 0xD0;
        }
        /* loc_48BB74: scene++ / bitpos-- always */
        scene_idx++;
        bitpos--;
    }

    /* loc_48BB91: 4 BMI records; test byte [flag],1; jl signed vs END */
    flagp = &BATTLE_SLOT_DATA[3 * 0xD0 + 0x7C];
    draw = &BMI_MONSTER1_DRAW_SPELL_ID1 + 1;
    while ((int)draw < (int)&END_SOME_DATA_MONSTER) {
        if (*flagp & 1) {
            for (i = 0; i < 4; i++)
                draw[4 * i] = 0; /* BYTE zeros at ID1+1/+5/+9/+13, not the ID bytes */
        }
        draw += 0x47;
        flagp += 0xD0;
    }

    return Battle_InitDrawSpellAvailability();
}
```
