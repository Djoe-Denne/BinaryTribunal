# Battle_ApplyDamageOrHeal @ 0x494410

- Instr (live): 397
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=16710
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=25769
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=18816
- A==B: non
- Push IDB: oui
- SetType: DWORD __cdecl Battle_ApplyDamageOrHeal(int p_target_slot_id, int p_damage_related, _BYTE *p_hit_type_2, _BYTE *a4, int p_attacker_slot_id, _BYTE *p_hit_type_animation_related, WORD *a7, DWORD *a8, int param_bool)
- Notes parent: stride slot 0xD0 ; occupancy 1+2 absents (flag_data 0x10/0x20/0x40000). F_CHAR 0x1D0 timer WORD + GF id + CHARA_ABILITIES BYTE bit8. GF row 0x44 NumberOfKOs. GetRandomInt absent. Pas de jpt_/setcc/ja/jg (jge/jl/jns SIGNED). GF absorb 6 gates, mask WORD movsx. last_attacker depuis ATTACKER_SLOT_ID global. DispatchSection imm 4 OnHit. Death BYTE or ; AI KO WORD &=0xFFFE. Retour EAX=status_2_copy. Pas de struct packée. Pas de Hex-Rays.

## C réconcilié

```c
/* Battle_ApplyDamageOrHeal @ 0x494410
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 397 instr, size 0x64B, end 0x494A5B. IDA type DWORD __cdecl 9 args.
 * No domain::. Slot stride 0xD0. Occupancy 1+2 unused (flag_data 0x10/0x20/0x40000).
 * F_CHAR stride 0x1D0 USED (timer WORD, GF id BYTE, CHARA_ABILITIES BYTE).
 * GF Exists/row 0x44. GetRandomInt absent. No setcc. No ja/jg (jz/jnz/jge/jl/jns SIGNED).
 * No jump table. WORD 66: mask, timer, NumberOfKOs, status_1, accum DI, NumKOs/NumKills,
 * status_1_copy, and ax,1 / 0xFFFE. Return EAX = status_2_copy leftover.
 */

extern unsigned char BATTLE_SLOT_DATA[];                      /* 0x1D27B10 stride 0xD0 */
extern unsigned char F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER[];     /* 0x1CFF014 stride 0x1D0 WORD */
extern unsigned char F_CHAR_ACTIVE_SUMMON_GF_ID[];            /* 0x1CFF01D stride 0x1D0 BYTE */
extern unsigned char CHARA_ABILITIES[];                       /* 0x1CFF190 stride 0x1D0 BYTE */
extern unsigned char SG_ARRAY_GF_DATA[];                      /* 0x1CFDCA8 row 0x44 */
extern unsigned char SG_ARRAY_CHARA_DATA[];                   /* 0x1CFE0E8 stride 0x98 */
extern unsigned char SG_PARTY_BATTLE[];                       /* 0x1CFE74C BYTE[] */
extern unsigned char ATTACK_FLAG;                             /* 0x1D28E0E BYTE */
extern unsigned char ATTACKER_SLOT_ID;                        /* 0x1D27AD8 BYTE */
extern unsigned char ATTACKER_SLOT_ID_0[];                    /* 0x1D28DF8; [1] Angelo */
extern unsigned char COMMAND_TYPE_ID;                         /* 0x1D27AD9 BYTE */
extern unsigned short CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID; /* 0x1D27AF4 WORD */
extern unsigned char HIT_ELEMENT;                             /* 0x1D2A244 BYTE */
extern unsigned char byte_1D28E10;                            /* BYTE */
extern unsigned char byte_1D27ADD;                            /* BYTE */
extern unsigned char byte_1D28E00;                            /* BYTE */
extern unsigned char byte_1D28DF5;                            /* BYTE */
extern unsigned char WHEN_DOING_SOMETHING_VALUE_IS_1;         /* 0x1D28DF2 BYTE */

extern void *__cdecl RelatedToStatus1And2(int p_target_slot_id, short p_status_1_mask_to_set,
                                          int p_status_2_mask_to_set);
extern short __cdecl Battle_ComputeCrisisLevelFromHP(int p_target_slot_id, int p_current_hp,
                                                     unsigned short *param_pointer_status_1);
extern char __cdecl EnemyAI_DispatchSection(int p_target_slot_id, unsigned int *p_ai_section_to_load);
extern int __cdecl Angelo_DamageCounter_ReverseCheck(int, int);
extern char __cdecl computeCardDrop(int p_target_slot_id);
extern int __cdecl ComputeProbabilityGetItemMug(int p_monster_slot_id);
extern short __cdecl ComputeGFLevelAndApAfterKill(int p_attacker_slot_id, int p_target_slot_id,
                                                  int p_command_type_id, int a4);
extern unsigned int __cdecl BattleStatus_UpdateSlotStatusCopy(int);

#define SLOT8(slot, off)  (*(unsigned char  *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define SLOT16(slot, off) (*(unsigned short *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define SLOT32(slot, off) (*(unsigned int   *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define FCHAR_TIMER(slot) (*(unsigned short *)(F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER + (unsigned int)(slot) * 0x1D0u))
#define FCHAR_GFID(slot)  (F_CHAR_ACTIVE_SUMMON_GF_ID[(unsigned int)(slot) * 0x1D0u])
#define GF_NUMKOS(n)      (*(unsigned short *)(SG_ARRAY_GF_DATA + (unsigned int)(n) * 0x44u + 0x3E))
#define CHARA_NUMKILLS(i) (*(unsigned short *)(SG_ARRAY_CHARA_DATA + (unsigned int)(i) * 0x98u + 0x90))
#define CHARA_NUMKOS(i)   (*(unsigned short *)(SG_ARRAY_CHARA_DATA + (unsigned int)(i) * 0x98u + 0x92))

/* Shared by 4 sites. last_attacker_* from GLOBAL ATTACKER_SLOT_ID, not p_attacker_slot_id. */
#define FILL_LAST_ATTACKER(slot, reaction)                                                 \
    do {                                                                                   \
        unsigned int att_ = (unsigned int)ATTACKER_SLOT_ID & 0xFFu;                        \
        SLOT8((slot), 0x88) = ATTACKER_SLOT_ID;                                            \
        SLOT8((slot), 0x8D) = SLOT8(att_, 0xBB);                                           \
        SLOT8((slot), 0x8B) = byte_1D28E10;                                                \
        SLOT8((slot), 0x8F) = (unsigned char)CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID;      \
        SLOT8((slot), 0x8C) = HIT_ELEMENT;                                                 \
        SLOT8((slot), 0xC7) = (unsigned char)(reaction);                                   \
        SLOT8((slot), 0xC8) = ATTACKER_SLOT_ID_0[0];                                       \
        ATTACKER_SLOT_ID_0[0] = (unsigned char)(ATTACKER_SLOT_ID_0[0] + 1);                \
    } while (0)

unsigned int __cdecl Battle_ApplyDamageOrHeal(int p_target_slot_id, int p_damage_related,
                                              unsigned char *p_hit_type_2, unsigned char *a4,
                                              int p_attacker_slot_id,
                                              unsigned char *p_hit_type_animation_related,
                                              unsigned short *a7, unsigned int *a8,
                                              int param_bool)
{
    unsigned char *S;
    int hp;
    unsigned short st1;
    int maxhp;
    int attacker;
    unsigned int gf;

    /* loc_494410: bool_related_to_damage_deal +0x8E only if param_bool==0 */
    if (param_bool == 0) {
        if ((*p_hit_type_2 & 1) != 0)
            SLOT8(p_target_slot_id, 0x8E) = 1;
        else if (p_damage_related != 0)
            SLOT8(p_target_slot_id, 0x8E) = 0;
        else
            SLOT8(p_target_slot_id, 0x8E) = 1;
    }

    S = BATTLE_SLOT_DATA + (unsigned int)p_target_slot_id * 0xD0u;

    /* first-match RelatedToStatus1And2: status_2 0x800 / Petrify BYTE&4 / Angel Wing 0x02000000 */
    if ((SLOT32(p_target_slot_id, 0x08) & 0x800u) != 0)
        RelatedToStatus1And2(p_target_slot_id, 0x7E, 0x180560D);
    else if ((S[0x80] & 4) != 0)
        RelatedToStatus1And2(p_target_slot_id, 0x7A, 0x30E77FF);
    else if ((SLOT32(p_target_slot_id, 0x08) & 0x02000000u) != 0)
        RelatedToStatus1And2(p_target_slot_id, 0x10, 0);

    hp = (int)SLOT32(p_target_slot_id, 0x18); /* ebx */

    /* GF absorb: target<3 SIGNED, mask WORD!=0, GFSummoned, a4 bit1==0, timer WORD!=0, not heal */
    if (p_target_slot_id < 3
        && SLOT16(p_target_slot_id, 0x84) != 0
        && (SLOT32(p_target_slot_id, 0x08) & 0x80000000u) != 0
        && (*a4 & 1) == 0
        && FCHAR_TIMER(p_target_slot_id) != 0
        && (*p_hit_type_2 & 1) == 0) {
        int remaining = (int)(short)SLOT16(p_target_slot_id, 0x84) - p_damage_related;
        if (remaining < 0) /* jns / xor eax,eax */
            remaining = 0;
        SLOT16(p_target_slot_id, 0x84) = (unsigned short)remaining;
        if (remaining == 0) {
            gf = (unsigned int)FCHAR_GFID(p_target_slot_id) - 0x40u;
            GF_NUMKOS(gf) = (unsigned short)(GF_NUMKOS(gf) + 1); /* 66 inc WORD */
        }
        /* edi = &status_1; current_hp not add/sub; ebx stays original hp */
        if (byte_1D28E00 != 0 || S[0xC9] != 0) {
            Battle_ComputeCrisisLevelFromHP(p_target_slot_id, (int)SLOT32(p_target_slot_id, 0x18),
                                            (unsigned short *)(S + 0x80));
        } else if (hp != 0 && (SLOT16(p_target_slot_id, 0x80) & 1) == 0) {
            st1 = (unsigned short)(SLOT16(p_target_slot_id, 0x80) & 0xFCFF);
            SLOT16(p_target_slot_id, 0x80) = st1;
            maxhp = (int)SLOT32(p_target_slot_id, 0x1C);
            if (hp < (maxhp >> 1)) { /* sar SIGNED jge */
                st1 = (unsigned short)(st1 | 0x200);
                SLOT16(p_target_slot_id, 0x80) = st1;
                if (hp < (maxhp >> 2)) {
                    st1 = (unsigned short)(st1 | 0x100);
                    SLOT16(p_target_slot_id, 0x80) = st1;
                }
            }
        } else if ((S[0x7C] & 0x20) == 0) {
            S[0x80] |= 1; /* BYTE or Death */
        }
        *p_hit_type_2 |= 0x20; /* loc_4945A5 and loc_4945D0 */
        goto loc_494665;
    }

    /* loc_4945DC heal / damage */
    if ((*p_hit_type_2 & 1) != 0) {
        maxhp = (int)SLOT32(p_target_slot_id, 0x1C);
        hp += p_damage_related;
        if (maxhp < hp) /* cmp max, ebx; jge skip */
            hp = maxhp;
    } else {
        if (p_attacker_slot_id >= 3 && p_damage_related != 0
            && (CHARA_ABILITIES[(unsigned int)p_target_slot_id * 0x1D0u] & 8) != 0)
            SLOT16(p_target_slot_id, 0xCC) =
                (unsigned short)(SLOT16(p_target_slot_id, 0xCC) + (unsigned short)p_damage_related);
        hp -= p_damage_related;
        if (hp < 0) /* jns */
            hp = 0;
    }

    SLOT16(p_target_slot_id, 0x80) = (unsigned short)(SLOT16(p_target_slot_id, 0x80) & 0xFCFF);
    if (hp != 0) {
        st1 = SLOT16(p_target_slot_id, 0x80);
        maxhp = (int)SLOT32(p_target_slot_id, 0x1C);
        if (hp < (maxhp >> 1)) {
            st1 = (unsigned short)(st1 | 0x200);
            SLOT16(p_target_slot_id, 0x80) = st1;
            if (hp < (maxhp >> 2)) {
                st1 = (unsigned short)(st1 | 0x100);
                SLOT16(p_target_slot_id, 0x80) = st1;
            }
        }
    }

loc_494665:
    st1 = SLOT16(p_target_slot_id, 0x80);
    if ((st1 & 1) != 0 && (ATTACK_FLAG & 3) == 0 && p_target_slot_id >= 3
        && (S[0x7C] & 0x20) == 0)
        byte_1D27ADD = (unsigned char)((byte_1D27ADD & 0xCF) | 0x40);

    /* KO: ebx==0 OR (ax after and 1) OR Eject 0x10000 */
    if (hp == 0 || (st1 & 1) != 0 || (SLOT32(p_target_slot_id, 0x08) & 0x10000u) != 0)
        goto loc_494803;

    SLOT32(p_target_slot_id, 0x18) = (unsigned int)hp;
    if (param_bool != 0 || byte_1D28DF5 != 0)
        goto loc_494A33;
    if (p_target_slot_id < 3) {
        FILL_LAST_ATTACKER(p_target_slot_id, 2);
        goto loc_494A33;
    }
    if (WHEN_DOING_SOMETHING_VALUE_IS_1 == 0)
        goto loc_494A33;
    FILL_LAST_ATTACKER(p_target_slot_id, 2);
    if ((S[0x7C] & 0x10) != 0 && byte_1D28E00 == 0 && S[0xC9] == 0)
        EnemyAI_DispatchSection(p_target_slot_id, (unsigned int *)4); /* push imm 4 */
    goto loc_494A33;

loc_494803:
    SLOT32(p_target_slot_id, 0x18) = 0;
    if (byte_1D28E00 != 0 || S[0xC9] != 0)
        goto loc_494A33;
    S[0x80] |= 1; /* BYTE or Death */
    if (p_target_slot_id >= 3)
        goto loc_494903;

    RelatedToStatus1And2(p_target_slot_id, 0x37E, 0x38E7FFF);
    if ((SLOT32(p_target_slot_id, 0x08) & 0x10000u) == 0) {
        if (Angelo_DamageCounter_ReverseCheck(p_target_slot_id, p_attacker_slot_id) != 0) {
            ATTACKER_SLOT_ID_0[1] = 1;
            FILL_LAST_ATTACKER(p_target_slot_id, 3);
        }
    }
    *a4 |= 0x0C;
    CHARA_NUMKOS(SG_PARTY_BATTLE[p_target_slot_id]) =
        (unsigned short)(CHARA_NUMKOS(SG_PARTY_BATTLE[p_target_slot_id]) + 1);
    goto loc_494A33;

loc_494903:
    if ((SLOT32(p_target_slot_id, 0x7C) & 0x40000u) == 0) {
        computeCardDrop(p_target_slot_id);
        ComputeProbabilityGetItemMug(p_target_slot_id);
        attacker = p_attacker_slot_id;
        ComputeGFLevelAndApAfterKill(attacker, p_target_slot_id, (int)COMMAND_TYPE_ID,
                                     (int)(CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID & 0xFFFF));
        if (attacker < 3 && COMMAND_TYPE_ID != 0xFE)
            CHARA_NUMKILLS(SG_PARTY_BATTLE[attacker]) =
                (unsigned short)(CHARA_NUMKILLS(SG_PARTY_BATTLE[attacker]) + 1);
        SLOT32(p_target_slot_id, 0x7C) |= 0x40000u;
    }
    if ((S[0x7C] & 0x20) != 0) {
        if ((SLOT32(p_target_slot_id, 0x08) & 0x10000u) != 0)
            goto loc_494A33;
        FILL_LAST_ATTACKER(p_target_slot_id, 3);
        EnemyAI_DispatchSection(p_target_slot_id, (unsigned int *)4);
        SLOT16(p_target_slot_id, 0x80) = (unsigned short)(SLOT16(p_target_slot_id, 0x80) & 0xFFFE);
    } else {
        RelatedToStatus1And2(p_target_slot_id, 0x37E, 0x38E7FFF);
        *a4 |= 8;
        *p_hit_type_animation_related = 3;
    }

loc_494A33:
    BattleStatus_UpdateSlotStatusCopy(p_target_slot_id);
    *a7 = SLOT16(p_target_slot_id, 0x82);
    *a8 = SLOT32(p_target_slot_id, 0x0C);
    return SLOT32(p_target_slot_id, 0x0C);
}
```
