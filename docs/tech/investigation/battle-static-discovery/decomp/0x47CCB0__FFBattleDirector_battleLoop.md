# main::FFBattleDirector_battleLoop @ 0x47CCB0

- Instr (live): 413 (3 chunks IDA: 0x47CCB0-0x47CDE4, 0x47D490-0x47D871, 0x534640-0x5347B6)
- Palier: low (budget) / GLM: high + max_tokens=65536 (consigne >=200)
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=13838
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=12964
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10687
- A==B: non (A
eq B
eq C)
- Push IDB: oui
- SetType: oid __thiscall FFBattleDirector_battleLoop(void *this);
- Notes parent: tables jpt_47CCC3 (mode-3, 6 cases) et jpt_47CCFA (substep, 4 cases) live; fallthrough substep 0->1 (pas de ret 0x47CD12); init subsub 0 fallthrough vers countdown 0x47D616; files 1,2,0; stride slot 0xD0; float carte 0.1f (0x3DCCCCCD); gate status = BATTLE_ACTION_TAKING_PLACE_ && !BYTE1 && !dword_1D27B00 && !RESULT. Chunk 0x534640 rendu. Réconciliation Grok 4.6 Extra High.

## C réconcilié

`c
/* FFBattleDirector_battleLoop @ 0x47CCB0
 * Chunks: dispatcher 0x47CCB0-0x47CDE4, tail 0x47D490-0x47D871,
 *         card/exit 0x534640-0x5347B6.
 * Ground truth = live ASM (asm_clean.asm), not Hex-Rays.
 * this is unused (ECX still passed as __thiscall).
 */

#define BYTE1(x) (*((unsigned char *)&(x) + 1)) /* action latch  TARGET_SLOT_ID+1 */
#define BYTE2(x) (*((unsigned char *)&(x) + 2)) /* result latch TARGET_SLOT_ID+2 */

/* ---- globals (IDA names; widths from load/store opcodes) ---- */
extern short          mode_StateGlobal;            /* movsx at 0x47CCB0 */
extern int            mode3_substep;
extern int            mode3_subsub_step;
extern int            mode_3_subsubsubstep;
extern unsigned char  mode_3_subsubsubcondition;
extern unsigned char  BATTLE_TRANSITION_COUNTDOWN;
extern unsigned char  BATTLE_RESULT_CODE;           /* 0 ongoing, 1 wipe, 2 escape, 3 timer, 4 victory */
extern unsigned short POST_BATTLE_GF_ID_QUEUE;
extern unsigned char  byte_1D28E19;
extern unsigned char  byte_1CFF6E6;
extern unsigned char  byte_1D280C3;
extern unsigned short ENCOUTER_BATTLE_FLAG;
extern unsigned short COMBAT_SCENE_ID;
extern unsigned int   CURRENT_ENCOUNTER_ID;
extern unsigned char  exit_battle;
extern int            FFBattleDirector_related;
extern int            mode_Battle_AnimationState;
extern void          *btitle_ovl_DestPointer;
extern void          *off_B6D074;
extern unsigned short battle_mode_related[];       /* 0xFFFF-terminated WORD list */
extern unsigned char  CAN_BATTLE_BE_PAUSED;
extern unsigned char  AI_BATTLE_ACTIVE_FLAG;
extern unsigned char  BATTLE_ESCAPE_STATE;
extern unsigned char  BATTLE_ESCAPE_INPUT_LATCH;
extern unsigned char  BATTLE_ESCAPE_INPUT_LATCH_PREV;
extern unsigned char  BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING;
extern unsigned char  BATTLE_ACTION_TAKING_PLACE_;
extern unsigned int   TARGET_SLOT_ID;
extern int            dword_1D27B00;
extern unsigned char  g_BattlePendingActionSlot0[]; /* stride 0x18 */
extern unsigned char  byte_1D28D8C;                 /* end label (cmp with offset) */
/* BATTLE_SLOT_DATA.com_file_id: 3 enemy slots, stride 0xD0, end +0x270 */
extern unsigned char  BATTLE_SLOT_DATA_com_file_id[];
extern unsigned char  cards_byte_1DCD6F8[0x6E];

/* Fields used on CURRENT_ENCOUNTER_DATA_SCENE_OUT (FF8SceneOut, 0x80).
 * Offsets of named fields are IDA's; only these two are touched here. */
typedef struct {
    unsigned char battle_flags;                    /* mov al, ...battle_flags */
    unsigned char battle_scenario;                 /* movzx cx, ...battle_scenario */
} SCENE_OUT_ENTRY;
extern SCENE_OUT_ENTRY CURRENT_ENCOUNTER_DATA_SCENE_OUT;

extern int            dword_1DCD798;               /* card substate 0/1/2 */
extern int            dword_1DCD7A4;
extern int            dword_1DCD794;
extern int            dword_1DCD790;
extern int            dword_1DCD6F4;
extern int            dword_1DEEDA4;
extern int            dword_1DCD7A8;
extern unsigned char  byte_1DEE50C;
extern unsigned char  byte_1DCD79C;
extern unsigned char  byte_1DCD766;
extern unsigned char  byte_1DCD78E;
extern unsigned char  byte_1DCD7AC;
extern unsigned short  word_1DCD78C;
extern unsigned char  cargame_texture_cards_BA9B10[];
extern unsigned char  cardgame_texture_icons_B96A90[];

/* ---- callees (cdecl; add esp recovered from live sites) ---- */
extern void  smPcReadFileReadAll(const char *FileName, void *DstBuf); /* add esp 8 */
extern void  Battle_HiddenDebug(void);              /* tail jmp from mode 4 */
extern void  set_unknownword_maybecountdown(short v);
extern void  SetBattleCountdown(int v);             /* pair with countdown: add esp 8 */
extern int   xorEAX(int v);                         /* add esp 4 */
extern void  ClearRecordArray16(void *records, int count); /* add esp 8 */
extern void  Battle_Mode5_PackRewards(void);
extern int   _rand(void);                            /* CRT: call only */
extern void  domain__Battle_SeedRNG(unsigned int seed);
extern void  BS_CameraRelated_battle_reset(void);
extern void  domain__ReadSceneOutForEncounter(unsigned short scene_id, void *dst);
extern void  domain__Battle_ResetXPAndItemRewards(void);
extern void  domain__Battle_InitActionQueueGroup(int group_index);
extern void  domain__BattleSlot_SetEnemyVisibility(void);
extern void  BattleSlot_ClearSevenRecords(void);  /* 7 x 0xD0 */
extern void  domain__ParseBattleParty(void);
extern void  BS_ParseItems(void);
extern void  domain__Battle_ResetAttackHitCount(void);
extern void *SomeListManipulation(int id, int b, const void *payload); /* 0x500DF0 */
extern void  linkedToMonsterVisibility(void);
extern void  domain__Battle_Callback_TransitionToStep1(void);
extern void  domain__Battle_Callback_TransitionToStep3(void);
extern void  domain__Battle_SetTextureLoadingFlag(void);
extern void  domain__Battle_RunFileLoadingCallbacks(void);
extern void  BdLink_GF_battle_input_and_texture_upload(void);
extern void  domain__setAllMonsterInfoFromDatSection(void);
extern void  domain__Battle_InitPreemptiveBackAttackStatus(void);
extern void  domain__Battle_SetEnemyZCoordinates(void);
extern void  Battle_EnqueueMonsterPresentationLoad(int slot_id); /* add esp 4 */
extern void  domain__Battle_InitSlotPositionsAndSyncStatus(void);
extern void  domain__Battle_DisplayPreemptiveMessage(void);
extern void  domain__Battle_EndCleanupAndTransition(void);
extern void  Battle_FileCallbacks_Reset(void);
extern void  input_structure_vibrate_init(void);
extern void  domain__Battle_InitTimerState(void);
extern void  domain__Battle_BuildTargetVisibilityMasks(void);
extern void  memset_a_variable_20_bytes(void);
extern void  domain__Battle_EnqueueInitialPartyActions(void);
extern void  domain__Odin_BattleInit_ZantetsukenCheck(void);
extern void  domain__Gilgamesh_BattleInit_TriggerCheck(void);
extern void  domain__Battle_InitDeadTimer(void);
extern void  BattleUI_RefreshEnemyAndGrieverNames(void);
extern void  domain__BattleTick_CheckScriptedBattleEnd(void);
extern void  domain__BattleTick_CheckPartyWipe(void);
extern void  domain__BattleTick_CheckTimerExpiry(void);
extern void  domain__BattleTick_CheckAllEnemiesDead(void);
extern void  domain__BattleTick_CheckEscapeSuccess(void);
extern void  domain__BattlePendingAction_TransferToExecQueue(void *pending);
extern void  domain__Battle_EnqueueEnemyCounterActions(void);
extern void  domain__BattleArbitration_SelectNextAction(void);
extern void  domain__BattleAction_ResolveSpecialActionAndUpdateDamage(void);
extern void  domain__Status_TickAndExpire(void);
extern void  domain__AngeloOdin_SpecialActionTick(void);
extern void  domain__Battle_ProcessActionCallbackChain(void);
extern void  domain__Battle_ProcessDeferredCallbacks(void);
extern void *domain__BattleText_GetMiscText(int id);
extern void  common_texture_related_sub_460B60(float f); /* add esp 4 */
extern void  menu_init_sub_4972D0(void);
extern void  sub_56E550(void);
extern void  sub_539A30(void);
extern void  sub_539010(void);
extern void  nullsub_26(void);                      /* empty: call only */
extern void  cardgame_sub_537DD0(void);
extern void  sub_538270(void);
extern void  cardgame_sub_5379D0(void);
extern void  sub_538010(void);
extern void  cardgame_texture_sub_539500(void);
extern void  sub_538FD0(void);
extern void  cardgame_load_tim_texture_sub_539450(const void *tim);
extern unsigned char get_card_count_squall_sub_534950(int idx); /* add esp 4 */
extern void  cardgame_sub_534560(void);
extern void  sub_537A30(void);
extern void  sub_537F30(void);
extern void  win_set_field_30_to_0_sub_537DB0(void);
extern void  menu_exit_sub_4972A0(void);

void __thiscall FFBattleDirector_battleLoop(void *this)
{
    (void)this;

    /* jpt_47CCC3 @ 0x47CDE4: index = (int)mode_StateGlobal - 3, ja if > 5 */
    switch ((int)mode_StateGlobal - 3) {
    case 0: /* mode 3, loc_47CCE2 */
        FFBattleDirector_related = 0;
        /* jpt_47CCFA @ 0x47CDFC: index = mode3_substep, ja if > 3 */
        switch (mode3_substep) {
        case 0: /* loc_47CD01: no ret — falls into case 1 */
            set_unknownword_maybecountdown(0);
            SetBattleCountdown(0);            /* combined add esp 8 */
            mode3_substep = 1;
            /* fall through to loc_47CD1C */
        case 1: { /* loc_47CD1C */
            const unsigned short *p = battle_mode_related;
            int found = 0;
            if (*p != 0xFFFF) {
                unsigned short id = COMBAT_SCENE_ID;
                do {
                    if (*p == id) {
                        found = 1;
                        break;
                    }
                    p++;
                } while (*p != 0xFFFF);
            }
            xorEAX(found);                     /* add esp 4 */
            mode3_substep = 2;
            return;
        }
        case 2: /* loc_47CD64 */
            ClearRecordArray16(
                btitle_ovl_DestPointer,
                (int)((char *)off_B6D074 - (char *)btitle_ovl_DestPointer) >> 4); /* sar 4 */
            mode3_substep = 3;
            return;
        case 3: /* loc_47CD89 */
            goto tail_47D490;
        default: /* def_47CCFA: ret at 0x47CDE3 only (exit_battle=1), not full def_47CCC3 */
            exit_battle = 1;
            return;
        }

    case 1: /* mode 4, loc_47CCCA */
        smPcReadFileReadAll("btitle.ovl", btitle_ovl_DestPointer); /* add esp 8 */
        Battle_HiddenDebug();               /* jmp, not call */
        return;

    case 2: /* mode 5, loc_47CDA6 */
        Battle_Mode5_PackRewards();
        mode_Battle_AnimationState = 4;
        mode_StateGlobal = 100;
        return;

    case 5: /* mode 8, loc_47CD8E */
        mode_Battle_AnimationState = 0;
        FFBattleDirector_related = 1;
        goto chunk_534640;

    case 3: /* mode 6 -> def_47CCC3 */
    case 4: /* mode 7 -> def_47CCC3 */
    default:
        mode_StateGlobal = 4;
        if (FFBattleDirector_related != 0)
            mode_StateGlobal = 8;
        exit_battle = 1;
        return;
    }

    /* ---- tail 0x47D490: mode3_subsub_step dec-chain 0 / 1 / 2 / default ---- */
tail_47D490:
    switch (mode3_subsub_step) {
    case 0: { /* loc_47D4C1 INIT; ebx lives as 1 for the rest of this tail */
        unsigned char flags;
        void *node;

        Battle_FileCallbacks_Reset();
        input_structure_vibrate_init();
        domain__Battle_InitTimerState();
        byte_1D280C3 = 1;
        mode_3_subsubsubstep = 0;
        mode_3_subsubsubcondition = 0xFF;
        BATTLE_TRANSITION_COUNTDOWN = 0xFF;
        BATTLE_RESULT_CODE = 0;
        POST_BATTLE_GF_ID_QUEUE = 0xFFFF;   /* ax after or eax,-1 */
        byte_1D28E19 = 0xFF;
        byte_1CFF6E6 = 0xFF;
        domain__Battle_SeedRNG((unsigned int)_rand());
        BS_CameraRelated_battle_reset();
        CURRENT_ENCOUNTER_ID = (unsigned int)COMBAT_SCENE_ID & 0xFFFFu;
        domain__ReadSceneOutForEncounter(COMBAT_SCENE_ID, &CURRENT_ENCOUNTER_DATA_SCENE_OUT);
        /* SeedRNG 4 + ReadSceneOut 8 = add esp 0xC */

        flags = CURRENT_ENCOUNTER_DATA_SCENE_OUT.battle_flags;
        if (flags & 0xE0) {
            ENCOUTER_BATTLE_FLAG = (unsigned short)(
                (ENCOUTER_BATTLE_FLAG & 0xFF1F) | (flags & 0xFFEF));
        } else {
            ENCOUTER_BATTLE_FLAG = (unsigned short)(
                ENCOUTER_BATTLE_FLAG | (flags & 0xFFEF));
        }

        domain__Battle_ResetXPAndItemRewards();
        domain__Battle_InitActionQueueGroup(1); /* party melee */
        domain__Battle_InitActionQueueGroup(2); /* party ranged */
        domain__Battle_InitActionQueueGroup(0); /* enemies */
        domain__BattleSlot_SetEnemyVisibility();
        BattleSlot_ClearSevenRecords();
        domain__ParseBattleParty();
        BS_ParseItems();
        domain__Battle_ResetAttackHitCount();

        /* 5 x SomeList + 3 x InitActionQueueGroup = add esp 0x48 */
        node = SomeListManipulation(0x3EA, 0x80, 0);
        *(unsigned short *)node = CURRENT_ENCOUNTER_DATA_SCENE_OUT.battle_scenario;
        SomeListManipulation(1, 0x80, 0);
        SomeListManipulation(0x3EB, 0x80, 0);
        SomeListManipulation(9, 0x80, 0);
        linkedToMonsterVisibility();
        SomeListManipulation(0x0A, 0x80, (const void *)domain__Battle_Callback_TransitionToStep1);
        mode3_subsub_step = 1;
        /* fall through to loc_47D616 (no ret between 0x47D610 and 0x47D616) */
    }
    case 1: /* loc_47D616 */
        if (BATTLE_TRANSITION_COUNTDOWN == 0) { /* loc_47D864 */
            mode3_subsub_step = 2;
            return;
        }
        /* jpt_47D631: index = mode_3_subsubsubstep, ja if > 4 */
        switch (mode_3_subsubsubstep) {
        case 0:
        case 2: /* loc_47D638 */
            domain__Battle_RunFileLoadingCallbacks();
            BdLink_GF_battle_input_and_texture_upload();
            return;

        case 1: { /* loc_47D645 */
            int slot;
            unsigned char *com;

            domain__setAllMonsterInfoFromDatSection();
            domain__Battle_InitPreemptiveBackAttackStatus();
            domain__Battle_SetEnemyZCoordinates();
            /* esi = &com_file_id; add esi,0xD0; cmp esi, base+0x270; jl */
            com = BATTLE_SLOT_DATA_com_file_id;
            for (slot = 0; slot < 3; slot++) {
                if (com[slot * 0xD0] != 0xFF)
                    Battle_EnqueueMonsterPresentationLoad(slot);
            }
            domain__Battle_InitSlotPositionsAndSyncStatus();
            SomeListManipulation(0x0A, 0x80, (const void *)domain__Battle_SetTextureLoadingFlag);
            domain__Battle_DisplayPreemptiveMessage();
            SomeListManipulation(0x70, 0x80, 0);
            SomeListManipulation(0x0A, 0x80, (const void *)domain__Battle_Callback_TransitionToStep3);
            /* add esp 0x24 for the three SomeList sites */
            mode_3_subsubsubstep = 2;
            domain__Battle_RunFileLoadingCallbacks();
            BdLink_GF_battle_input_and_texture_upload();
            return;
        }

        case 3: /* loc_47D6CE: ret before case 4 — no same-frame active tick */
            CAN_BATTLE_BE_PAUSED = 1;
            domain__Battle_BuildTargetVisibilityMasks();
            memset_a_variable_20_bytes();
            domain__Battle_EnqueueInitialPartyActions();
            AI_BATTLE_ACTIVE_FLAG = 1;
            domain__Odin_BattleInit_ZantetsukenCheck();
            domain__Gilgamesh_BattleInit_TriggerCheck();
            domain__Battle_InitDeadTimer();
            mode_3_subsubsubstep = 4;
            domain__Battle_RunFileLoadingCallbacks();
            BdLink_GF_battle_input_and_texture_upload();
            return;

        case 4: { /* loc_47D70F ACTIVE TICK */
            unsigned char *pend;
            void *node;

            BattleUI_RefreshEnemyAndGrieverNames();
            byte_1D280C3 = 1;
            if (dword_1D27B00 == 0) {
                domain__BattleTick_CheckScriptedBattleEnd();
                domain__BattleTick_CheckPartyWipe();
                domain__BattleTick_CheckTimerExpiry();
                domain__BattleTick_CheckAllEnemiesDead();
                domain__BattleTick_CheckEscapeSuccess();
            }
            if (BATTLE_ESCAPE_STATE != 2
                && BATTLE_ESCAPE_INPUT_LATCH != BATTLE_ESCAPE_INPUT_LATCH_PREV) {
                /* cmp al, bl (bl=1): latch==1 -> 0x6C else 0x6D */
                SomeListManipulation(
                    (BATTLE_ESCAPE_INPUT_LATCH == 1) ? 0x6C : 0x6D,
                    0xF0,
                    0); /* add esp 0xC */
            }
            BATTLE_ESCAPE_INPUT_LATCH_PREV = BATTLE_ESCAPE_INPUT_LATCH;

            for (pend = g_BattlePendingActionSlot0;
                 pend < &byte_1D28D8C;
                 pend += 0x18) { /* jl signed */
                domain__BattlePendingAction_TransferToExecQueue(pend); /* add esp 4 */
            }

            domain__Battle_EnqueueEnemyCounterActions();

            if (BYTE2(TARGET_SLOT_ID) != 0) {
                domain__Battle_InitActionQueueGroup(1);
                domain__Battle_InitActionQueueGroup(2);
                domain__Battle_InitActionQueueGroup(0); /* add esp 0xC */
            }

            if (BYTE1(TARGET_SLOT_ID) == 0) {
                domain__BattleArbitration_SelectNextAction();
                domain__BattleAction_ResolveSpecialActionAndUpdateDamage();
            }

            if (BATTLE_ACTION_TAKING_PLACE_ != 0
                && BYTE1(TARGET_SLOT_ID) == 0
                && dword_1D27B00 == 0
                && BATTLE_RESULT_CODE == 0) {
                domain__Status_TickAndExpire();
                domain__AngeloOdin_SpecialActionTick();
            }

            domain__Battle_ProcessActionCallbackChain();
            domain__Battle_ProcessDeferredCallbacks();
            byte_1D280C3 = 0;
            domain__Battle_RunFileLoadingCallbacks();
            BdLink_GF_battle_input_and_texture_upload();

            if (BATTLE_TRANSITION_COUNTDOWN != 0xFF
                && BATTLE_TRANSITION_COUNTDOWN != 0)
                BATTLE_TRANSITION_COUNTDOWN--;

            if (BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING == 0)
                return; /* jz def_47D631 */

            node = SomeListManipulation(
                8, 0xF0, domain__BattleText_GetMiscText(4)); /* add esp 0x10 */
            *(unsigned short *)node = 1; /* bx = 1 */
            ((unsigned char *)node)[2] = 2;
            ((unsigned char *)node)[3] = 0x56;
            return;
        }

        default: /* def_47D631 */
            return;
        }

    case 2: /* loc_47D4AF */
        domain__Battle_EndCleanupAndTransition();
        mode3_subsub_step = 0;
        return;

    default:
        return;
    }

    /* ---- card/exit chunk 0x534640 (jmp from mode 8); ebx = 0 ---- */
chunk_534640:
    switch (dword_1DCD798) { /* dec-chain 0 / 1 / 2 / default */
    case 0: { /* loc_5346C8 */
        int i;

        common_texture_related_sub_460B60(0.1f); /* 0x3DCCCCCD, add esp 4 */
        menu_init_sub_4972D0();
        sub_56E550();
        dword_1DCD794 = dword_1DCD7A8;
        byte_1DCD766 = byte_1DCD7AC;
        if (dword_1DCD7A8 & 0x80000000) { /* test eax, 80000000h */
            ((unsigned char *)&word_1DCD78C)[0] = 2;
            ((unsigned char *)&word_1DCD78C)[1] = 2;
        } else if (dword_1DCD7A8 & 0x40000000) {
            ((unsigned char *)&word_1DCD78C)[0] = 3;
            ((unsigned char *)&word_1DCD78C)[1] = 3;
        } else {
            ((unsigned char *)&word_1DCD78C)[0] = 3;
            ((unsigned char *)&word_1DCD78C)[1] = 2;
        }
        sub_539A30();
        sub_539010();
        nullsub_26();
        cardgame_sub_537DD0();
        sub_538270();
        cardgame_sub_5379D0();
        sub_538010();
        cardgame_texture_sub_539500();
        sub_538FD0();
        cardgame_load_tim_texture_sub_539450(cargame_texture_cards_BA9B10);
        cardgame_load_tim_texture_sub_539450(cardgame_texture_icons_B96A90); /* add esp 8 */
        dword_1DCD790 = 0;
        dword_1DCD6F4 = 0;
        byte_1DCD78E = 1;
        for (i = 0; i < 0x6E; i++) /* jl signed */
            cards_byte_1DCD6F8[i] = get_card_count_squall_sub_534950(i);
        dword_1DEEDA4 = 0;
        byte_1DCD79C = 0;
        dword_1DCD798 = 1;
        return;
    }
    case 1: /* loc_53469B */
        cardgame_sub_534560();
        dword_1DCD7A4 = 0;
        if (byte_1DCD79C == 0)
            return; /* jz loc_5347B1 */
        byte_1DCD79C = 0;
        dword_1DCD798 = 2;
        return;
    case 2: { /* loc_534657 */
        int n = 2;
        dword_1DCD7A4 = 0;
        byte_1DEE50C = 0xFF;
        do {
            sub_537A30();
            sub_537F30();
        } while (--n != 0);
        win_set_field_30_to_0_sub_537DB0();
        mode_StateGlobal = 100;
        byte_1DCD79C = 1;
        dword_1DCD798 = 0;
        menu_exit_sub_4972A0();
        return;
    }
    default: /* loc_5347B1 */
        return;
    }
}
`
