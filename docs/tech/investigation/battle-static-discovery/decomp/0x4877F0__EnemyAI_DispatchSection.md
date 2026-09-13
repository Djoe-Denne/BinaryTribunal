# EnemyAI_DispatchSection @ 0x4877F0

- Instr (live): 459
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=20206
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=14417
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=20254
- A==B: non
- Push IDB: oui
- SetType: char __cdecl(signed int p_target_slot_id, _DWORD *p_ai_section_to_load)
- Notes parent: jpt_487853 9 cases 0..8 ja UNSIGNED. Exists=flag_data BYTE bit0 (pas occupancy). Slot 0xD0 / CHARA 0x1D0. GetRandomInt absent. Monster blob eax+[eax+N]. Party script_add=slot id. Case 4 sans SetPhaseFlag. Case 1 phase 8. status_1&5=Death|Petrify. Monster counter status_2 BYTE&9. CheckPending!=0 skip Commit. Pas de Hex-Rays.

## C réconcilié

```c
/* EnemyAI_DispatchSection @ 0x4877F0
 * Ground truth = live ASM (asm_clean.asm) + jpt_dump.txt + dump_bytes, not Hex-Rays.
 * 459 instr, size 0x567. cdecl. char leftover EAX (no xor eax before most retn).
 * jpt_487853 @ 0x487D58: 9 cases 0..8, cmp edx,8 ; ja UNSIGNED. No case 9+.
 * Slot stride 0xD0. CHARA_ABILITIES F_CHAR stride 0x1D0. No GetRandomInt.
 * Exists gate = flag_data BYTE bit0. Occupancy 1+2 is NOT tested here.
 */

typedef unsigned int _DWORD;

extern unsigned char  BATTLE_SLOT_DATA[];              /* 0x1D27B10 stride 0xD0 */
extern unsigned char  CHARA_ABILITIES[];               /* 0x1CFF190 stride 0x1D0 */
extern unsigned char  EQUAL_ITEM_ID[];                 /* 0x1D28E78 stride 5 */
extern unsigned char  BMI_MONSTER1_DRAW_SPELL_ID1[];  /* 0x1D28F18 scan end */
extern unsigned char  AI_CURRENT_SECTION_INDEX;        /* 0x1D28E09 BYTE */
extern unsigned int   RELATED_ODIN_SUMMONED;          /* 0x1D28E14 DWORD load + &0xFF */
extern unsigned char  ATTACKER_SLOT_ID_0[];           /* 0x1D28DF8; BYTE store at +1 */
extern unsigned short p_mask_attacker_slot;           /* 0x1D28DE6 WORD (66 a1) */
extern unsigned char  K_NONJ_GF_ATTACK_NAME_OFFSET_unknown1[]; /* 0x1CF7D2F stride 20 */

extern int            BattleState_SetPhaseFlag(int phase); /* 0x47E080 */
extern unsigned char  EnemyAI_VM_ExecuteScript(unsigned int p_monster_slot_id,
                                               unsigned char *p_ai_current_subcode,
                                               int p_text_subsection,
                                               int p_text_offset_section); /* 0x487DF0 */
extern char           BattlePendingAction_SetupCommand(int p_attacker_slot_id, char p_command_type,
                                                         unsigned short a3, unsigned int p_mask_attacker_slot); /* 0x483400 */
extern char           Angelo_CheckAutoCounter(int); /* 0x482E80 */
extern int            EnemyAI_CheckCurativeAbilityAvailable(int item_id); /* 0x487D80 */
extern int            EnemyAI_UseCurativeAbility(int slot, int id); /* 0x487DB0 */
extern int            BattleEqualItemBuffer_AdjustCount(int id, int remove_one); /* 0x486B40 */
extern int            BattleExecQueue_CheckPending(int); /* 0x485E60 EQUAL qty, not exec-queue */
extern int            BattleExecQueue_CommitEntry(int); /* 0x485E90 stale name: SG_ITEM clear */
extern char           Angelo_SetupAutoCommand(int, unsigned short, unsigned int); /* 0x482E60 */
extern unsigned short BattleTarget_ComputeMaskFromDefaultTarget(unsigned char target_info); /* 0x483860 AX */
extern unsigned short BattleTarget_GetMaskFromInfoField(unsigned char target_info); /* 0x483880 AX */

#define SLOT_U8(s, o)  (*(unsigned char  *)&BATTLE_SLOT_DATA[(s) * 0xD0 + (o)])
#define SLOT_U16(s, o) (*(unsigned short *)&BATTLE_SLOT_DATA[(s) * 0xD0 + (o)])
#define SLOT_U32(s, o) (*(unsigned int   *)&BATTLE_SLOT_DATA[(s) * 0xD0 + (o)])
#define CHARA_U8(s)    (*(unsigned char  *)&CHARA_ABILITIES[(s) * 0x1D0])
#define CHARA_U32(s)   (*(unsigned int   *)&CHARA_ABILITIES[(s) * 0x1D0])

char __cdecl EnemyAI_DispatchSection(signed int p_target_slot_id, _DWORD *p_ai_section_to_load)
{
    int slot = p_target_slot_id; /* edi */
    unsigned int section = (unsigned int)p_ai_section_to_load; /* edx switch index */
    int ai_sub_base;  /* ebp after prologue */
    int text_sub;     /* ebx */
    int text_off;     /* ecx / overwritten stack p_ai_section_to_load */
    int script_add;   /* overwritten stack p_target_slot_id: monster ai_sub_base, party slot id */
    unsigned char last_att;
    unsigned short st1;
    int missing;
    unsigned int id;
    unsigned int mask;
    unsigned char ti;
    unsigned char *p;

    /* BYTE store opcode 88 */
    AI_CURRENT_SECTION_INDEX = (unsigned char)section;

    /* esi = slot*0xD0: lea [edi+edi*2]; lea [edi+eax*4]; shl 4 */
    if (!(SLOT_U8(slot, 0x7C) & 1)) /* flag_data BYTE bit0 exists; jz def. NOT occupancy */
        goto def_487853;

    if (slot >= 3) { /* jge SIGNED monster */
        /* ecx = monster_ai_section DWORD +4; eax = [ecx]; then eax+[eax+4/8/C] */
        unsigned char *hdr = *(unsigned char **)(&BATTLE_SLOT_DATA[slot * 0xD0 + 4]);
        unsigned char *base = *(unsigned char **)hdr;
        ai_sub_base = (int)(base + *(int *)(base + 4));
        text_sub    = (int)(base + *(int *)(base + 0xC));
        text_off    = (int)(base + *(int *)(base + 8));
        script_add  = ai_sub_base; /* stack args overwritten */
    } else { /* jl SIGNED party: ebp=ebx=ecx=original pointer; stack NOT overwritten */
        ai_sub_base = text_sub = text_off = (int)p_ai_section_to_load;
        script_add  = p_target_slot_id;
    }

    /* cmp edx,8 ; ja def UNSIGNED */
    if (section > 8)
        goto def_487853;

    switch (section) {

    case 0: /* loc_48785A INIT */
        BattleState_SetPhaseFlag(5);
        EnemyAI_VM_ExecuteScript((unsigned int)slot,
            (unsigned char *)(*(int *)ai_sub_base + script_add),
            text_sub, text_off);
        return (char)BattleState_SetPhaseFlag(7);

    case 1: /* loc_487886 TURN */
        BattleState_SetPhaseFlag(5);
        SLOT_U8(slot, 0x8A) = (unsigned char)(SLOT_U8(slot, 0x8A) + 1); /* number_turn BYTE */
        EnemyAI_VM_ExecuteScript((unsigned int)slot,
            (unsigned char *)(*(int *)(ai_sub_base + 4) + script_add),
            text_sub, text_off);
        return (char)BattleState_SetPhaseFlag(8); /* phase 8, not 7 */

    case 2: /* loc_4878C0 COUNTER */
        if (SLOT_U8(slot, 0x80) & 1) /* status_1 BYTE Death */
            goto def_487853;
        BattleState_SetPhaseFlag(5);
        if (slot >= 3) /* jge SIGNED */
            goto loc_487B68;

        last_att = SLOT_U8(slot, 0x88); /* last_attacker_slot_id BYTE */

        /* Counter: cmp cl,3 ; jb UNSIGNED. CHARA BYTE &4. status_1 BYTE &5 = Death|Petrify */
        if ((unsigned)last_att >= 3
            && (CHARA_U8(slot) & 4)
            && !(SLOT_U8(slot, 0x80) & 5)
            && !(SLOT_U32(slot, 8) & 0x4009)      /* status_2 DWORD Sleep|Stop|Confuse */
            && !(SLOT_U32(slot, 0x7C) & 0x4000)   /* flag_data DWORD */
            && SLOT_U8(slot, 0x89) == 0)          /* last_attacker_attack_type BYTE */
        {
            BattlePendingAction_SetupCommand(slot, 1, 0, 1u << last_att);
        }

        /* loc_487945 Angelo: com_file_id==4. Reloads last_attacker from memory (same BYTE). */
        if ((unsigned)SLOT_U8(slot, 0x88) >= 3
            && SLOT_U8(slot, 0xBB) == 4
            && SLOT_U8(slot, 0x8E) == 0
            && !(SLOT_U8(slot, 0x80) & 5)
            && !(SLOT_U32(slot, 8) & 0x4009)
            && !(SLOT_U32(slot, 0x7C) & 0x4000))
        {
            Angelo_CheckAutoCounter(slot);
        }

        /* loc_487983 auto-recover: CHARA DWORD & 0x40000. F_CHAR stride 0x1D0. */
        if (!(CHARA_U32(slot) & 0x40000))
            goto loc_487BE4;
        last_att = SLOT_U8(slot, 0x88); /* xor eax,eax; mov al */
        if (last_att == (unsigned)slot)
            goto loc_487BE4;
        st1 = SLOT_U16(slot, 0x80); /* 66 load */
        if (st1 & 5)
            goto loc_487BE4;
        if (SLOT_U32(slot, 8) & 0x4009)
            goto loc_487BE4;
        if (SLOT_U32(slot, 0x7C) & 0x4000)
            goto loc_487BE4;
        if (SLOT_U8(slot, 0x8E))
            goto loc_487BE4;
        if (!(st1 & 0x200)) /* test ah,2 : HP<50% required */
            goto loc_487BE4;

        missing = (int)SLOT_U32(slot, 0x1C) - (int)SLOT_U32(slot, 0x18); /* max_hp - current_hp */
        if (missing <= 0xC8) /* jle SIGNED 200 */
            goto loc_487BE4;
        if (missing <= 0x3E8) /* jle SIGNED 1000 */
            goto loc_487B3C;

        /* loc_487A19 EQUAL scan BYTE id==3, stride 5, jl vs BMI_MONSTER1_DRAW_SPELL_ID1 */
        p = EQUAL_ITEM_ID;
        while (p < BMI_MONSTER1_DRAW_SPELL_ID1) {
            if (*p == 3)
                goto loc_487A50;
            p += 5;
        }
        goto loc_487A28;

    loc_487A50:
        BattlePendingAction_SetupCommand(slot, 4, 3, 1u << slot);
        BattleEqualItemBuffer_AdjustCount(3, 1);
        if (BattleExecQueue_CheckPending(3)) /* EAX!=0 skip Commit */
            goto loc_487BE4;
        BattleExecQueue_CommitEntry(3);
        return (char)BattleState_SetPhaseFlag(7);

    loc_487A28: /* curative 1,2,4,5,9 — test eax, jz next */
        if (EnemyAI_CheckCurativeAbilityAvailable(1)) {
            EnemyAI_UseCurativeAbility(slot, 1);
            return (char)BattleState_SetPhaseFlag(7);
        }
        if (EnemyAI_CheckCurativeAbilityAvailable(2)) {
            EnemyAI_UseCurativeAbility(slot, 2);
            return (char)BattleState_SetPhaseFlag(7);
        }
        if (EnemyAI_CheckCurativeAbilityAvailable(4)) {
            EnemyAI_UseCurativeAbility(slot, 4);
            return (char)BattleState_SetPhaseFlag(7);
        }
        if (EnemyAI_CheckCurativeAbilityAvailable(5)) {
            EnemyAI_UseCurativeAbility(slot, 5);
            return (char)BattleState_SetPhaseFlag(7);
        }
        if (EnemyAI_CheckCurativeAbilityAvailable(9)) {
            EnemyAI_UseCurativeAbility(slot, 9);
            return (char)BattleState_SetPhaseFlag(7);
        }
        goto loc_487BE4;

    loc_487B3C: /* missing 201..1000: item 1 only */
        if (EnemyAI_CheckCurativeAbilityAvailable(1)) {
            EnemyAI_UseCurativeAbility(slot, 1);
            return (char)BattleState_SetPhaseFlag(7);
        }
        goto loc_487BE4;

    loc_487B68: /* monster counter */
        if (SLOT_U8(slot, 0x80) & 0x25) /* Death|Petrify|Berserk BYTE */
            goto loc_487BE4;
        if (SLOT_U8(slot, 8) & 9) /* status_2 BYTE Sleep|Stop, NOT DWORD 0x4009 */
            goto loc_487BE4;
        if (SLOT_U32(slot, 0x7C) & 0x4000) /* mov eax,dword; test ah,40h */
            goto loc_487BE4;
        /* loc_487BD6: subcode = [ebp+8] + stack p_target_slot_id (ai_sub_base) */
        EnemyAI_VM_ExecuteScript((unsigned int)slot,
            (unsigned char *)(*(int *)(ai_sub_base + 8) + script_add),
            text_sub, text_off);
        goto loc_487BE4;

    case 3: /* loc_487B90 DEATH */
        BattleState_SetPhaseFlag(5);
        if (slot < 3) { /* jl SIGNED party */
            mask = (1u << slot) | 0x4000; /* or dh,40h */
            Angelo_SetupAutoCommand(slot, 0x0D, mask);
            ATTACKER_SLOT_ID_0[1] = 0; /* C6 BYTE @ 0x1D28DF9 */
            return (char)BattleState_SetPhaseFlag(7);
        }
        /* monster loc_487BCD: [ebp+0xC] then shared loc_487BD6 */
        EnemyAI_VM_ExecuteScript((unsigned int)slot,
            (unsigned char *)(*(int *)(ai_sub_base + 0xC) + script_add),
            text_sub, text_off);
        goto loc_487BE4;

    case 4: /* loc_487BF3 PRE_HIT — NO SetPhaseFlag. push ecx leftover as text_off. */
        return (char)EnemyAI_VM_ExecuteScript((unsigned int)slot,
            (unsigned char *)(*(int *)(ai_sub_base + 0x10) + script_add),
            text_sub, text_off);

    case 5: /* loc_487C0D Death->def. cmd 0xF6 a3=0x2B mask=1<<slot. jmp loc_487D42 */
        if (SLOT_U8(slot, 0x80) & 1)
            goto def_487853;
        BattleState_SetPhaseFlag(5);
        mask = 1u << slot;
        BattlePendingAction_SetupCommand(slot, (char)0xF6, 0x2B, mask);
        goto loc_487D42;

    case 6: /* loc_487C37 Death->def. cmd 0 a3=4 mask=1<<slot. jmp loc_487D42 */
        if (SLOT_U8(slot, 0x80) & 1)
            goto def_487853;
        BattleState_SetPhaseFlag(5);
        mask = 1u << slot;
        BattlePendingAction_SetupCommand(slot, 0, 4, mask);
        goto loc_487D42;

    case 7: /* loc_487C5E Odin/Gilgamesh. DWORD RELATED_ODIN + and 0xFF. add esp,4 after phase 5. */
        BattleState_SetPhaseFlag(5);
        id = RELATED_ODIN_SUMMONED & 0xFFu;
        if (id == 1)
            goto loc_487CC8;
        /* ebx=eax+eax*4; ti = unknown1[ebx*4] = unknown1[20*id] */
        ti = K_NONJ_GF_ATTACK_NAME_OFFSET_unknown1[20 * id];
        mask = (unsigned int)BattleTarget_ComputeMaskFromDefaultTarget(ti); /* mov si,ax */
        mask |= (unsigned int)BattleTarget_GetMaskFromInfoField(ti);     /* or esi,eax */
        BattlePendingAction_SetupCommand(slot, (char)0xF5, (unsigned short)id, mask);
        return (char)BattleState_SetPhaseFlag(7);

    loc_487CC8: /* id==1: same table[20] plus extra SetupCommand(slot,0,8,0xC007) */
        ti = K_NONJ_GF_ATTACK_NAME_OFFSET_unknown1[20]; /* unknown1+14h */
        mask = (unsigned int)BattleTarget_ComputeMaskFromDefaultTarget(ti);
        mask |= (unsigned int)BattleTarget_GetMaskFromInfoField(ti);
        BattlePendingAction_SetupCommand(slot, (char)0xF5, (unsigned short)id, mask);
        BattlePendingAction_SetupCommand(slot, 0, 8, 0xC007);
        return (char)BattleState_SetPhaseFlag(7);

    case 8: /* loc_487D22 Angelo. WORD p_mask_attacker_slot. cmd 0xF0. falls into loc_487D42 */
        BattleState_SetPhaseFlag(5);
        id = RELATED_ODIN_SUMMONED & 0xFFu;
        mask = (unsigned int)p_mask_attacker_slot;
        BattlePendingAction_SetupCommand(slot, (char)0xF0, (unsigned short)id, mask);
        goto loc_487D42;

    default:
        goto def_487853;
    }

loc_487BE4: /* shared SetPhaseFlag(7) + epilogue (auto-recover fail, monster VM, party death) */
    return (char)BattleState_SetPhaseFlag(7);

loc_487D42: /* cases 5/6/8: SetupCommand already issued; phase 7; add esp,18h in ASM */
    return (char)BattleState_SetPhaseFlag(7);

def_487853: /* pop edi,esi,ebp,ebx ; retn. ASM does not xor eax. */
    return 0;
}
```
