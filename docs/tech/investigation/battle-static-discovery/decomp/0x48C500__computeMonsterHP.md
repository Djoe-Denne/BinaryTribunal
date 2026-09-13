# computeMonsterHP @ 0x48C500

- Instr (live): 71
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2372
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=610
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=302
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl computeMonsterHP(int p_attacker_slot_id)
- Notes parent: stride ASM 0xD0 (pas F_CHAR 0x1D0). Occupancy absente. DAT=**[+0x00]. BYTE level +0xBC, DAT hp BYTE[4] +0x18, MED/HIGH +0xF4/+0xF5. BMI71[71*slot] BYTE rank (pas (slot-3)*71). DWORD HP +0x18/+0x1C, pas de 66. jge/setnl signés (7D / 0F 9D). /20 magic 66666667h. add esp,4. EAX leftover callee, pas MaxHP. Pas de GetRandomInt. Pas de Hex-Rays.

## C réconcilié

```c
/* computeMonsterHP @ 0x48C500
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 71 instr, size 0xbe. IDA type unsigned int __cdecl(int p_attacker_slot_id).
 * No domain::. Slot stride 0xD0 (lea*3/+*4/shl4). No F_CHAR 0x1D0.
 * Occupancy not tested (no flag_data 1+2, no com_file_id).
 * DAT = **[+0x00] (mov edx,[slot+0]; mov ecx,[edx]). BYTE level slot+0xBC.
 * DAT hp BYTE[4] +0x18, med_level_start +0xF4, high_level_start +0xF5.
 * BMI71_LOW_MED_HIGH_LEVEL_BIS BYTE[143] @ 0x1D28E89, index 71*slot (not slot-3).
 * Rank BYTE store (88). HP DWORD stores (89), no 66 prefix.
 * jge/setnl SIGNED (7D / 0F 9D). No GetRandomInt.
 * /20 via 66666667h sar 3 + sign(edx). Return EAX leftover from callee.
 */

extern unsigned char BATTLE_SLOT_DATA[];              /* 0x1D27B10 */
extern unsigned char BMI71_LOW_MED_HIGH_LEVEL_BIS[]; /* 0x1D28E89 */

unsigned int __cdecl BattleSlot_ApplyMonsterStatScaling(int p_slot_id);

unsigned int __cdecl computeMonsterHP(int p_attacker_slot_id)
{
    int slot;                 /* edi */
    unsigned char *sl;        /* ebp = slot base, stride 0xD0 */
    unsigned char *dat;       /* ecx = **monster_info_section */
    int level;                /* esi, BYTE zero-extend */
    int rank;                 /* eax then BYTE store */
    int hp1, hp2, hp3, hp4;
    int max_hp;
    int cur_hp;

    slot = p_attacker_slot_id;
    sl = BATTLE_SLOT_DATA + slot * 0xD0;

    /* edx = dword [sl+0]; ecx = [edx] */
    dat = *(unsigned char **)(*(unsigned char **)(sl + 0x00));
    level = (int)sl[0xBC]; /* xor eax,eax; mov al, level */

    /* signed jge (7D) vs BYTE med +0xF4 zero-ext */
    if (level < (int)dat[0xF4]) {
        rank = 0;
    } else {
        /* loc_48C538: setnl al + inc eax → 1 + (level >= HIGH) signed */
        rank = 1 + (level >= (int)dat[0xF5]);
    }

    /* loc_48C548: lea*9 shl3 sub → 71*slot; BYTE store al */
    BMI71_LOW_MED_HIGH_LEVEL_BIS[71 * slot] = (unsigned char)rank;

    hp1 = (int)dat[0x18];
    hp2 = (int)dat[0x19];
    hp3 = (int)dat[0x1A];
    hp4 = (int)dat[0x1B];

    /* lea 5/25/100: edx = 5*(HP2+100*HP4); ecx = HP1+100*HP3
     * imul eax,esi twice = HP1*lvl*lvl; imul ecx,esi = lvl*(HP1+100*HP3)
     * lea ebx,[ecx+edx*2] = lin; 66666667h imul sar 3 + sign = /20 */
    max_hp = (hp1 * level * level) / 20
           + level * (hp1 + 100 * hp3)
           + 10 * (hp2 + 100 * hp4);

    *(int *)(sl + 0x1C) = max_hp; /* DWORD max_hp */
    cur_hp = *(int *)(sl + 0x18); /* DWORD current_hp */
    /* cmp eax,ecx; jge loc_48C5B1 signed: skip if max >= cur */
    if (max_hp < cur_hp)
        *(int *)(sl + 0x18) = max_hp;

    /* loc_48C5B1: push edi; call; add esp,4. EAX leftover, not MaxHP */
    return BattleSlot_ApplyMonsterStatScaling(slot);
}
```
