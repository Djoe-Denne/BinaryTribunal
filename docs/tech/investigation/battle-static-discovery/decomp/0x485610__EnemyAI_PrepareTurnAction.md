# EnemyAI_PrepareTurnAction @ 0x485610

- Instr (live): 565
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=24218
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=27472
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=27613
- A==B: non
- Push IDB: oui
- SetType: int __cdecl EnemyAI_PrepareTurnAction(int, int)
- Notes parent: exec 0x1D288E8+group*0x108+cell*0x18+sub*0x0C ; slot stride 0xD0 occupancy 1+2 (party 0..2 jge 3 signe) ; cmd 0xFF DispatchSection ; gate status_1 BYTE 0x25 / status_2 0x4009 si sub!=0 et !byte_1D28E0C ; Magic Dual/Triple zero mask seulement si bit clair ; Angel Wing 0x02000000 ; Berserk+Confuse 0x4000 ; MutateStock 0xFF -> loc_485B0E skip var_10 ; dword_1D280D4+1[hit*20] BYTE ; GF Exists +0x44 WORD clamp unsigned 0x1770/0x3E8 ; GetRandomInt absent ; pas de jpt_ ; ret 1 seulement BuildPayload EAX!=0.

## C réconcilié

```c
/* EnemyAI_PrepareTurnAction @ 0x485610
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 565 instr, size 0x7a7. IDA type int __cdecl(int, int).
 * Exec cell: 0x1D288E8 + group*0x108 + cell*0x18 + sub*0x0C (12-byte subrecord).
 * Slot stride 0xD0. Occupancy = party 0..2 + monsters 3..6 (1+2), not flag_data.
 * F_CHAR CHARA_ABILITIES stride 0x1D0. GF Exists stride 0x44.
 * GetRandomInt not called here. No jpt_.
 */

enum {
    kBattleSlotStride = 0xD0,
    kOffStatus2       = 0x08, /* DWORD @ 0x1D27B18 */
    kOffStatus1       = 0x80, /* WORD  @ 0x1D27B90, tested as BYTE */
    kOffNumberTurn    = 0x8A, /* BYTE  @ 0x1D27B9A */
    kOffMagicBlow     = 0xB8, /* BYTE[2] @ 0x1D27BC8 */
    kFCharStride       = 0x1D0,
    kGfExistsStride    = 0x44
};

extern unsigned char  BATTLE_SLOT_DATA[];              /* 0x1D27B10 */
extern unsigned char  BATTLE_EXEC_QUEUE_BYTES[];        /* 0x1D288E8 */
extern unsigned char  byte_1D288F4[];                   /* 0x1D288E8+0x0C */
extern unsigned short  word_1D288FA[];                   /* 0x1D288F4+6, __int16[] */
extern unsigned char   WHEN_DOING_SOMETHING_VALUE_IS_1; /* 0x1D28DF2 group g */
extern unsigned char   ALWAYS_2;                        /* 0x1D28DF1 ALWAYS_2? */
extern unsigned char   unk_1D28E2A;
extern unsigned char   unk_1D28E2B;
extern unsigned char   unk_1D28E25;
extern unsigned char   byte_1D28E02;
extern unsigned char   byte_1D28E04;
extern unsigned char   byte_1D28E0C;
extern unsigned char   byte_1D28E0D;
extern unsigned char   byte_1D28E10;
extern unsigned char   byte_1D28E1C;
extern unsigned char   byte_1D28E2E;
extern unsigned char   AI_CURRENT_EXECUTING_SLOT;
extern unsigned char   AI_MULTI_HIT_COUNTER;
extern unsigned char   BOOL_LAST_COMMAND_FAILED;
extern unsigned char   BACK_PREEMTIVE_INFO_3;
extern unsigned char   byte_1D28DCD[];                  /* stride 3 */
extern unsigned int    ATTACK_HIT_COUNT;
extern unsigned int    ATTACKER_SLOT_ID;                /* 0x1D27AD8: slot@+0, cmd@+1 */
extern unsigned char  *ACTION_GF_COMPAT_DELTA_TABLE_PTR; /* 0x1D27B08 */
extern unsigned char   CHARA_ABILITIES[];                /* 0x1CFF190 */
extern unsigned char   SG_ARRAY_GF_DATA_Exists[];
extern unsigned char   SG_ARRAY_CHARA_DATA_Magic_amount[];
extern unsigned short  SG_ARRAY_CHARA_DATA_GFCompatibility[];
extern unsigned char   SG_PARTY_BATTLE[];
extern unsigned char   EQUAL_ITEM_ID[];                 /* 0x1D28E78 stride 5 */
extern signed char     EQUAL_ITEM_QUANTITY[];            /* 0x1D28E79, [edx+edx*4] */
extern unsigned char   BMI_MONSTER1_DRAW_SPELL_ID1[];
extern unsigned char   SG_ITEM_ID_AND_QUANTITY[];        /* 198 x {id,qty} */
extern unsigned char   K_MAGIC_defaultTarget[];          /* stride 0x3C */
extern unsigned char   dword_1D280D4[];                /* hit-count bytes at +1, stride 20 */
extern unsigned char   ATTACKER_SLOT_ID_1[];            /* 0x1D280C4 */
extern void           *battle_message_pointer;
extern unsigned char   SG_BATTLE_MESSAGE_SPEED_SETTING;

void          __cdecl EnemyAI_DispatchSection(int slot, int special_id);
int           __cdecl BattleStatus_EnqueueStatusCopyUpdateEx(int p_slot_id, int a2, char a3, char a4);
int           __cdecl BattleState_SetPhaseFlag(int phase);
unsigned short *__cdecl BattleLimitAngelWing_SelectAutoCast(int, unsigned int *out_section, int *out_arg, unsigned short *out_mask);
char          __cdecl BattleItem_RefundStashedItems(int slot_id);
unsigned short __cdecl BattleTarget_GetRandomPartyMask(void);
unsigned short __cdecl BattleTarget_GetRandomMonsterMask(void);
int           __cdecl EnemyAI_OverrideTargetForBerserk(unsigned char *exec, int cell_index, int command_id, short command_arg, short p_target_mask);
int           __cdecl BattleTarget_FindByCondition(int slot_index, int *out_section, int *out_arg, short *out_target_mask);
int           __cdecl BattleAction_BuildPayload(int p_attacker_slot_id, int p_command_type, unsigned short p_offset_to_execute_, unsigned char p_param_is_0_for_ai, unsigned char p_target_slot_id, int p_enemy_number, char p_always_zero);
char          __cdecl BattleAction_ResolveTargetAndHitCount(unsigned int p_target_mask);
int           __cdecl BattleMagic_MutateStock(int slot, int magic_id, int remove_flag);
int           __cdecl BattleEqualItemBuffer_AdjustCount(int id, int remove_one);
unsigned short __cdecl BattleTarget_ComputeMaskFromDefaultTarget(unsigned char target_info);
int           __cdecl BattleEvent_ActivateTargetRelay(short a1, unsigned char a2, int a3);
int           __cdecl BattleEvent_DisplayMessageAndWait(int, short, char, unsigned char, char);
int           __cdecl BattleEvent_SetTargetableCallback(int);
int                    sub_4852B0(void);
char                   sub_48F3F0(void);
int                    BattleAction_ResolveRenzokukenFinisherHits(void);
char                   RelatedToShotIrvineLimit(void);

int __cdecl EnemyAI_PrepareTurnAction(int cell_index, int subrecord_index)
{
    int random_target_bis; /* +10 */
    int out_arg;           /* +14 */
    int out_section;        /* +18 */
    int var_10;            /* Dual/Triple deferred stock remove */
    int var_C;
    int pass;              /* var_8 / ebp */
    int hit_count;         /* var_4 = ATTACK_HIT_COUNT & 0xFF */
    int pass_count;        /* reuse arg_4 stack slot */
    unsigned int g;
    unsigned int slot;
    unsigned int st2;
    unsigned char *exec;
    unsigned char *slot_base;
    int hit_base;

    unk_1D28E2B = 0;
    g = WHEN_DOING_SOMETHING_VALUE_IS_1;
    ACTION_GF_COMPAT_DELTA_TABLE_PTR = 0;
    ALWAYS_2 = (unsigned char)subrecord_index;

    /* esi = 0x1D288E8 + 12*(sub + 2*(cell + 11*g)) */
    exec = &BATTLE_EXEC_QUEUE_BYTES[12 * (subrecord_index + 2 * (cell_index + 11 * (int)g))];
    slot = exec[0];
    if (slot == 0xFF)
        goto loc_485DAD;

    AI_CURRENT_EXECUTING_SLOT = (unsigned char)slot;
    byte_1D28E10 = exec[1];
    slot_base = BATTLE_SLOT_DATA + slot * kBattleSlotStride;

    if (exec[1] == 0xFF) {
        EnemyAI_DispatchSection((int)slot, (int)*(unsigned short *)&exec[4]);
        if (*(unsigned short *)&exec[4] == 1
            && slot_base[kOffNumberTurn] == 1) {
            unsigned int *p_st2 = (unsigned int *)(slot_base + kOffStatus2);
            *p_st2 &= 0xFF7FFFFFu; /* clear 0x00800000 */
            BattleStatus_EnqueueStatusCopyUpdateEx((int)slot, 1, 0x17, 0);
        }
        goto loc_485D24;
    }

    /* ecx still = arg_4; skip gate if byte_1D28E0C || subrecord_index==0 */
    if (byte_1D28E0C == 0 && subrecord_index != 0) {
        if (slot_base[kOffStatus1] & 0x25) /* Death|Petrify|Berserk */
            goto loc_485DAD;
        if (*(unsigned int *)(slot_base + kOffStatus2) & 0x4009) /* Sleep|Stop|Confuse */
            goto loc_485DAD;
    }

    BattleState_SetPhaseFlag(5);
    hit_count = ATTACK_HIT_COUNT & 0xFF;
    AI_MULTI_HIT_COUNTER = 0;

    /* Magic Dual/Triple: zero a mask only when the corresponding bit is clear */
    if (exec[1] == 2) {
        st2 = *(unsigned int *)(slot_base + kOffStatus2);
        if (st2 & 0x40000) { /* Triple */
            if (*(unsigned short *)&exec[0xA] != 0) {
                pass_count = 3;
                goto loc_4857AE;
            }
        } else {
            *(unsigned short *)&exec[0xA] = 0;
        }
        if (st2 & 0x20000) { /* Double */
            if (*(unsigned short *)&exec[8] != 0) {
                pass_count = 2;
                goto loc_4857AE;
            }
        } else {
            *(unsigned short *)&exec[8] = 0;
        }
        pass_count = 1;
    } else {
        pass_count = 0;
        while (pass_count < 3 && *(unsigned short *)&exec[6 + 2 * pass_count] != 0)
            pass_count++; /* jl; stop at first zero word */
    }

loc_4857AE:
    var_10 = 0;
    pass = 0;

    /* loc_4857B6 */
    while (pass < 3) {
        if (*(unsigned short *)&exec[6 + 2 * pass] == 0)
            goto loc_485AE6;

        if (pass == 0 && byte_1D28E0C == 0 && g != 0) {
            out_arg = 0;
            st2 = *(unsigned int *)(slot_base + kOffStatus2);
            if (st2 & 0x02000000) { /* Angel Wing */
                BattleLimitAngelWing_SelectAutoCast(
                    (int)slot,
                    (unsigned int *)&out_section,
                    &out_arg,
                    (unsigned short *)&random_target_bis);
                var_C = out_arg;
                BattleItem_RefundStashedItems((int)slot);
                if (out_section == 4)
                    slot_base[kOffMagicBlow] = (unsigned char)var_C;
                exec[1] = (unsigned char)out_section;
                *(unsigned short *)&exec[4] = (unsigned short)var_C;
                *(unsigned short *)&exec[6] = (unsigned short)random_target_bis;
                *(unsigned short *)&exec[8] = 0; /* WORD; +0xA untouched */
                byte_1D288F4[24 * (cell_index + 11 * (int)g)] = 0xFF;
            } else if (slot_base[kOffStatus1] & 0x20) { /* Berserk */
                out_section = 1;
                if (st2 & 0x4000) /* test ah,40h Confuse */
                    random_target_bis = (int)BattleTarget_GetRandomPartyMask();
                else
                    random_target_bis = (int)BattleTarget_GetRandomMonsterMask();
                EnemyAI_OverrideTargetForBerserk(
                    exec, cell_index, out_section,
                    (short)out_arg, (short)random_target_bis);
            } else if (st2 & 0x4000) { /* Confuse only; dh from earlier status_2 */
                BattleTarget_FindByCondition(
                    (int)slot, &out_section, &out_arg,
                    (short *)&random_target_bis);
                EnemyAI_OverrideTargetForBerserk(
                    exec, cell_index, out_section,
                    (short)out_arg, (short)random_target_bis);
            }
        }

        /* loc_485915 */
        if (BattleAction_BuildPayload(
                (int)slot,
                exec[1],
                *(unsigned short *)&exec[4],
                exec[2],
                exec[3],
                (int)*(unsigned short *)&exec[6 + 2 * pass],
                0)) {
            BattleState_SetPhaseFlag(7);
            return 1;
        }

        BattleAction_ResolveTargetAndHitCount(
            (unsigned int)*(unsigned short *)&exec[6 + 2 * pass]);
        AI_MULTI_HIT_COUNTER = (unsigned char)(AI_MULTI_HIT_COUNTER + 1);

        if ((*(unsigned int *)(slot_base + kOffStatus2) & 0x02000000) == 0
            && ((ATTACKER_SLOT_ID >> 8) & 0xFF) == 2
            && BOOL_LAST_COMMAND_FAILED == 0) {
            unsigned char abil = CHARA_ABILITIES[slot * kFCharStride];
            if ((abil & 0x20) && pass_count == 2) {
                var_10 = 1;
            } else if ((abil & 0x40) && pass_count == 3) {
                var_10 = 1;
            } else {
                var_10 = 0;
                if (pass == (int)((unsigned char)AI_MULTI_HIT_COUNTER - 1)) {
                    if (BattleMagic_MutateStock(
                            ATTACKER_SLOT_ID & 0xFF,
                            (int)unk_1D28E2A,
                            1) == 0xFF)
                        goto loc_485B0E; /* skip loc_485AE6 var_10 */
                }
            }
        }

        if (unk_1D28E2B != 0)
            goto loc_485AE6;
        if (byte_1D28E0C == 0
            && ACTION_GF_COMPAT_DELTA_TABLE_PTR != 0
            && (int)slot < 3) { /* jge signed */
            int gf = 0;
            unsigned char *gp = SG_ARRAY_GF_DATA_Exists;
            while (gp < SG_ARRAY_CHARA_DATA_Magic_amount) { /* jl signed */
                if (*gp & 1) {
                    unsigned int ch = SG_PARTY_BATTLE[slot];
                    unsigned short *compat =
                        &SG_ARRAY_CHARA_DATA_GFCompatibility[gf + 76 * ch];
                    unsigned short bx;
                    /* movzx bx, table[gf]; sub ebx, 64h; add word, bx */
                    bx = (unsigned short)((int)ACTION_GF_COMPAT_DELTA_TABLE_PTR[gf] - 100);
                    *compat = (unsigned short)(*compat + bx);
                    if (*compat > 0x1770u) /* jbe unsigned */
                        *compat = 0x1770;
                    if (*compat < 0x3E8u) /* jnb unsigned */
                        *compat = 0x3E8;
                }
                gp += kGfExistsStride;
                gf++;
            }
        }

        pass++;
        /* loc_485AD4: jl vs 3 */
    }

loc_485AE6:
    if (var_10 != 0)
        BattleMagic_MutateStock(ATTACKER_SLOT_ID & 0xFF, (int)unk_1D28E2A, 1);

loc_485B0E:
    hit_base = hit_count * 20; /* lea [ebp+ebp*4]; shl 2 */
    dword_1D280D4[1 + hit_base] = (unsigned char)(AI_MULTI_HIT_COUNTER - 1);

    if (((ATTACKER_SLOT_ID >> 8) & 0xFF) == 4
        || ((ATTACKER_SLOT_ID >> 8) & 0xFF) == 0xF4) {
        unsigned char *blow = slot_base + kOffMagicBlow + ALWAYS_2;
        unsigned char id = blow[0];
        unsigned char *p = EQUAL_ITEM_ID;
        int k = 0;
        int do_sg = 1;

        while (p < BMI_MONSTER1_DRAW_SPELL_ID1) { /* jl */
            if (*p == id) {
                if (EQUAL_ITEM_QUANTITY[k + k * 4] != 0) /* movsx; jnz skip SG */
                    do_sg = 0;
                break;
            }
            p += 5;
            k++;
        }
        if (do_sg) {
            unsigned char *q = SG_ITEM_ID_AND_QUANTITY;
            int j;
            for (j = 0; j < 0xC6; j++) { /* jl */
                if (q[0] == id) {
                    q[0] = 0;
                    q[1] = 0;
                    break;
                }
                q += 2;
            }
        }
        blow[0] = 0;
    } else {
        int i;
        unsigned char *blow = slot_base + kOffMagicBlow;
        for (i = 0; i < 2; i++) {
            unsigned char id = blow[i];
            if (id != 0) {
                BattleEqualItemBuffer_AdjustCount((int)id, 0);
                blow[i] = 0;
            }
        }
    }

    /* loc_485C02 */
    if (BACK_PREEMTIVE_INFO_3 != 0) {
        unsigned char *rec;
        int i;
        byte_1D28E0C = 1;
        rec = &byte_1D288F4[24 * (11 * (int)g + byte_1D28E02)];
        rec[0] = (unsigned char)slot;
        rec[1] = 0xF7;
        rec[2] = 0;
        rec[3] = 0;
        for (i = 0; i < (int)BACK_PREEMTIVE_INFO_3; i++) { /* jl vs BYTE */
            unsigned char *src = &byte_1D28DCD[3 * i];
            unsigned short mask;
            *(unsigned short *)(rec + 4) = (unsigned short)src[0]; /* overwrite each pass */
            if (src[1] < 3u) /* jnb unsigned */
                mask = BattleTarget_GetRandomMonsterMask();
            else
                mask = BattleTarget_GetRandomPartyMask();
            mask |= BattleTarget_ComputeMaskFromDefaultTarget(
                K_MAGIC_defaultTarget[(unsigned int)src[0] * 0x3C]);
            word_1D288FA[i + 12 * (11 * (int)g + byte_1D28E02)] = mask;
        }
        BACK_PREEMTIVE_INFO_3 = 0;
        byte_1D28E0D = 0;
    }

    BattleEvent_ActivateTargetRelay(0x68, 0x80, (int)&ATTACKER_SLOT_ID_1[hit_base]);
    if (battle_message_pointer != 0) {
        BattleEvent_DisplayMessageAndWait(
            (int)battle_message_pointer,
            (short)(8 + 8 * (int)SG_BATTLE_MESSAGE_SPEED_SETTING),
            3,
            0x80,
            0x56);
        battle_message_pointer = 0;
    }

loc_485D24:
    if (byte_1D28E1C == 1) {
        BattleEvent_SetTargetableCallback((int)sub_4852B0);
        /* loc_485D9E then loc_485DA6; byte_1D28E04 not cleared */
    } else if (byte_1D28E04 != 0) {
        if (byte_1D28E2E == 3)
            BattleEvent_SetTargetableCallback((int)BattleAction_ResolveRenzokukenFinisherHits);
        else
            BattleEvent_SetTargetableCallback((int)sub_48F3F0);
        byte_1D28E04 = 0;
        AI_MULTI_HIT_COUNTER = 0;
        return 0;
    } else if (unk_1D28E25 == 1) {
        BattleEvent_SetTargetableCallback((int)RelatedToShotIrvineLimit);
    }

    AI_MULTI_HIT_COUNTER = 0;

loc_485DAD:
    return 0;
}
```

