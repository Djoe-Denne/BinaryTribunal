# BattleAction_ResolveAndApplyStatusResult @ 0x493D80

- Instr (live): 281
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9655
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=13191
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10915
- A==B: non
- Push IDB: oui
- SetType: unsigned __int8 __cdecl BattleAction_ResolveAndApplyStatusResult(unsigned __int8 *)
- Notes parent: stride slot 0xD0 / F_CHAR 0x1D0. Occupancy 1+2 et Exists +0x44 absents (0x44 = stride GF). GetRandomInt absent. Pas de jpt_/setcc/ja. jle/jge/jg/jl SIGNED, jbe UNSIGNED qty. flag_data DWORD 0x20000. Bit5 1er INLINE +0x18, 2e sub_494110. 5 pushes add esp,14h. 0xFBA9 dans ManageDeathState. EAX AL=0xFF si slot_b==0xFF sinon leftover. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* BattleAction_ResolveAndApplyStatusResult @ 0x493D80
 * Ground truth = live ASM (asm_clean.asm) + dump_bytes, not Hex-Rays.
 * 281 instr, size 0x38C, end 0x49410C. IDA type unsigned __int8 __cdecl(unsigned __int8 *).
 * No domain::. Slot stride 0xD0. F_CHAR 0x1D0 used (+0x18 summon HP, +0x1D gf id,
 * +0x122 junction list stride 5, +0x172 current HP WORD).
 * Occupancy 1+2 unused. GF Exists field unused (0x44 = SG_ARRAY_GF_DATA stride).
 * GetRandomInt unused. No setcc. No jump table. No ja.
 * jle/jge/jg/jl SIGNED; jbe UNSIGNED on byte_1D28E13. 66 on WORD HP/status.
 * 5 dword pushes + add esp,14h to sub_494110/130 despite 4-arg IDA types.
 * First-target bit5 = INLINE F_CHAR+0x18; second-target bit5 = sub_494110.
 * EAX: no mov before retn except mov al,[p+0xC] on the 0xFF skip; else leftover callee.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 stride 0xD0 */
extern unsigned char F_CHAR_DATA[];      /* 0x1CFF000 stride 0x1D0 */
extern unsigned char SG_ARRAY_GF_DATA[]; /* 0x1CFDCA8 stride 0x44, HP WORD +0x12 */
extern unsigned char SG_GF_MAX_HP[];     /* 0x1CFF61A WORD, records stride 12 */
extern unsigned char SG_GF_CURRENT_HP_[]; /* 0x1CFF318 WORD, stride 12 */
extern unsigned char byte_1D28E11;
extern unsigned char byte_1D28E12;
extern unsigned char byte_1D28E13;
extern unsigned char byte_1D28E23; /* dword_1D28E20+3 */

extern int __cdecl sub_494AA0(int slot, unsigned char *out_gf_ids); /* add esp,8 */
extern __int16 __cdecl BattleGF_RecomputeBattleData(int gf_id);     /* add esp,4 */
extern int __cdecl BattleMagic_MutateStock(int slot, int magic_id, int remove_flag); /* add esp,0Ch */
extern void __cdecl sub_486C10(void);
extern int __cdecl sub_47ED00(int item_id, char qty); /* add esp,8 */
extern unsigned char *__cdecl BS_ParseItems(void);
extern int __cdecl Battle_BuildTargetVisibilityMasks(void);
extern int __cdecl sub_494130(int slot, int hp_mode, int hp_delta, unsigned char *fchar, int status_1);
extern int __cdecl sub_494110(int slot, int hp_mode, int hp_delta, unsigned char *fchar, int status_1);
extern __int16 __cdecl Battle_ComputeCrisisLevelFromHP(int slot, int current_hp, __int16 *p_status_1);
extern unsigned char *__cdecl BattleStatus_ApplyAndSyncSlot(int slot, unsigned __int16 status_1, unsigned int status_2);
extern int __cdecl pre_manageAttackerDeath(int slot); /* add esp,4 */
extern unsigned int __cdecl BattleStatus_UpdateSlotStatusCopy(int slot); /* add esp,4 */
extern char *__cdecl BattleState_ResetForEject(int slot);
extern int __cdecl BattleSlot_ManageDeathState(int slot);

unsigned __int8 __cdecl BattleAction_ResolveAndApplyStatusResult(unsigned __int8 *p_result)
{
    unsigned char gf_ids[16];
    unsigned int slot_off;
    unsigned int status_1;
    unsigned int status_2;
    int slot;
    unsigned char flags;
    unsigned char hp_mode;
    unsigned short hp_delta;
    unsigned char *fchar;
    int count;
    int i;
    int j;

    slot = (int)p_result[0];
    slot_off = (unsigned int)(slot * 0xD0);

    if (*(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x7C] & 0x20000u) {
        count = sub_494AA0(slot, gf_ids);
        if (count != 0) {
            if (count > 0) {
                for (i = 0; i < count; i++) {
                    int gf = (int)gf_ids[i];
                    int max_hp;
                    int delta;

                    max_hp = (int)*(__int16 *)&SG_GF_MAX_HP[gf * 12];
                    delta = (max_hp * (int)byte_1D28E23) / 100;
                    *(__int16 *)&SG_ARRAY_GF_DATA[gf * 0x44 + 0x12] =
                        (__int16)(*(__int16 *)&SG_ARRAY_GF_DATA[gf * 0x44 + 0x12] + (__int16)delta);
                    BattleGF_RecomputeBattleData(gf);
                    for (j = 0; j < 16; j++) {
                        if ((int)F_CHAR_DATA[slot * 0x1D0 + 0x122 + j * 5] == gf + 0x40) {
                            F_CHAR_DATA[slot * 0x1D0 + 0x122 + j * 5 + 4] &= (unsigned char)0xFDu;
                            break;
                        }
                    }
                }
            }
            if (*(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x08] & 0x80000000u) {
                unsigned int active_gf = (unsigned int)F_CHAR_DATA[slot * 0x1D0 + 0x1D];
                unsigned short hp = *(unsigned short *)&SG_GF_CURRENT_HP_[active_gf * 12];
                *(unsigned short *)&F_CHAR_DATA[slot * 0x1D0 + 0x18] = hp;
                *(unsigned short *)&BATTLE_SLOT_DATA[slot_off + 0x84] = hp;
            }
        }
        *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x7C] &= 0xFFFDFFFFu;
    }

    slot = (int)p_result[0];
    if (byte_1D28E11 == 1) {
        sub_486C10();
        sub_47ED00((int)byte_1D28E12, (char)byte_1D28E13);
        BS_ParseItems();
    } else if (byte_1D28E11 == 2) {
        if (byte_1D28E13 != 0) {
            for (i = 0; i < (int)byte_1D28E13; i++)
                BattleMagic_MutateStock(slot, (int)byte_1D28E12, 1);
        }
    }

    status_2 = *(unsigned int *)&p_result[8];
    hp_delta = *(unsigned short *)&p_result[6];
    status_1 = (unsigned int)*(unsigned short *)&p_result[4];
    flags = p_result[2];
    slot = (int)p_result[0];
    hp_mode = p_result[3];

    byte_1D28E11 = 0;
    byte_1D28E13 = 0;
    byte_1D28E12 = 0;

    if (flags & 4)
        Battle_BuildTargetVisibilityMasks();

    if (slot >= 3) {
        pre_manageAttackerDeath(slot);
    } else {
        fchar = &F_CHAR_DATA[slot * 0x1D0];
        if (hp_mode & 0x20) {
            *(__int16 *)&fchar[0x18] = (__int16)(*(__int16 *)&fchar[0x18] - (__int16)hp_delta);
            if (*(__int16 *)&fchar[0x18] <= 0)
                *(unsigned short *)&fchar[0x18] = 0;
        } else {
            sub_494130(slot, (int)hp_mode, (int)hp_delta, fchar, (int)status_1);
        }
        if (status_1 & 1)
            *(unsigned short *)&fchar[0x172] = 0;
        Battle_ComputeCrisisLevelFromHP(
            slot,
            (int)*(__int16 *)&fchar[0x172],
            (__int16 *)&BATTLE_SLOT_DATA[slot * 0xD0 + 0x80]);
        BattleStatus_ApplyAndSyncSlot(slot, (unsigned __int16)status_1, status_2);
    }
    BattleStatus_UpdateSlotStatusCopy(slot);

    if (p_result[0x0C] == 0xFF)
        return p_result[0x0C];

    status_2 = *(unsigned int *)&p_result[0x14];
    hp_delta = *(unsigned short *)&p_result[0x12];
    slot = (int)p_result[0x0C];
    status_1 = (unsigned int)*(unsigned short *)&p_result[0x10];
    flags = p_result[0x0E];
    hp_mode = p_result[0x0F];

    if (flags & 4)
        Battle_BuildTargetVisibilityMasks();

    if (slot >= 3) {
        slot_off = (unsigned int)(slot * 0xD0);
        if ((*(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x08] & 0x10000u)
            || (BATTLE_SLOT_DATA[slot_off + 0x80] & 1)) {
            BattleState_ResetForEject(slot);
            BattleSlot_ManageDeathState(slot);
        }
        return (unsigned __int8)BattleStatus_UpdateSlotStatusCopy(slot);
    }

    fchar = &F_CHAR_DATA[slot * 0x1D0];
    if (hp_mode & 0x20)
        sub_494110(slot, (int)hp_mode, (int)hp_delta, fchar, (int)status_1);
    else
        sub_494130(slot, (int)hp_mode, (int)hp_delta, fchar, (int)status_1);
    if (status_1 & 1)
        *(unsigned short *)&fchar[0x172] = 0;
    Battle_ComputeCrisisLevelFromHP(
        slot,
        (int)*(__int16 *)&fchar[0x172],
        (__int16 *)&BATTLE_SLOT_DATA[slot * 0xD0 + 0x80]);
    BattleStatus_ApplyAndSyncSlot(slot, (unsigned __int16)status_1, status_2);
    return (unsigned __int8)BattleStatus_UpdateSlotStatusCopy(slot);
}
```
