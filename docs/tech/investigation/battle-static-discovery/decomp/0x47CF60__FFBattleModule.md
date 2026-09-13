# main::FFBattleModule @ 0x47CF60

- Instr (live): 209
- Palier: low (budget) / GLM: high + max_tokens=65536 (consigne >=200)
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5634
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4399
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5457
- A==B: non
- Push IDB: oui
- SetType: int __cdecl FFBattleModule(int game_object);
- Notes parent: HUD x3 pre + x1 post; Director ssi !IS_BATTLE_PAUSED; pause_game_battle=0 @ 0x47D0EC (ebx); __ftol/nullsub appels seuls; 1.0f=0x3F800000. Réconciliation Grok 4.6 Extra High.

## C réconcilié

`c
/* FFBattleModule @ 0x47CF60
 * Ground truth = live ASM (asm_clean.asm), not Hex-Rays.
 * 209 instr. cdecl int(int game_object). Whole-frame battle owner.
 * One call == one rendered frame.
 */

extern int            Render_X_Axis;
extern int            Render_Y_Axis;
extern int            Render_width;
extern int            Render_Height;
extern int            dummy4_39;
extern int            dword_1D2A288;
extern unsigned char  CAN_BATTLE_BE_PAUSED;       /* mov al / cmp al, bl */
extern int            pause_game_battle;          /* dword */
extern int            is_sleeping;                /* dword */
extern int            mode_Battle_AnimationState;
extern unsigned char  IS_BATTLE_PAUSED;           /* mov bl / mov al / mov 1 */
extern unsigned char  g_BattleFramePingPongIndex; /* xor eax,eax; mov al */
extern int            exit_battle;
extern int            battle_swirl_dword_1CFF6F4;
extern int            movie_dword_B6D970;
extern double         timer_volume_change_related_dbl_1A788B8;

extern int  SetResolution(int x, int y, int w, int h); /* add esp 0x10 */
extern void isGetDrawBuf(void *desc, int game_object);
extern void isGetDrawBuf2(int a, int b, int c, int game_object);
extern int  GfxDriver_BeginScene(int a1, int game_object); /* add esp 8 */
extern void sub_416B9A(int a);
extern void sub_424BF9(int a);
extern void Gfx_CopyRenderTuningDefaults(void);
extern void sub_499A40(void);
extern void Render_ESI_A60h_unused(int game_object);
extern void render_ESIA78h(int game_object);
extern void render_ESI348(int game_object);
extern void sub_409B25(int game_object);
extern void ___setargv_2(void);
extern int  battle_pause_related_sub_4A71D0(void);
extern void Gpu_EnableOTagHostPass(void);
extern void GameTime_Tick2191_SG(void);
extern void BattleUI_SetHudDrawTarget(void *draw_env); /* add esp 4 */
extern void isBattle_HUDupdate(void);
extern void BattleUI_HudInputAndATBTick(void);
extern int  IsWindowNOTActive(void);
extern int  GfxDriver_LeaveScene(int game_object); /* add esp 4; EAX leftover */
extern void battle_sub_5003A0(void);
extern void sub_45B590(void);
extern void FFBattleDirector_battleLoop(void); /* 0 args @ 0x47D113 */
extern void Battle_cursor_battle_win_and_pause_menu_render_related(void);
extern void FFSwitchModule_set_game_loop(void *desc, int game_object); /* add esp 8 */
extern void start_battle_swirl_sub_56D1D0(int x, int y, int w, int h,
                                          unsigned int z, int swirl_is_2); /* add esp 0x18 */
extern void nullsub_35(void); /* call only */
extern void Gpu_DrawOTagCurrent(int ot_head); /* add esp 4 */
extern void Gfx_SubmitDisplayLists(void);
extern void Gfx_SubmitTexturePageLists(void);
extern void GfxDriver_SelectRenderTarget(int a1, int game_object); /* add esp 8 */
extern void Gfx_SubmitViewportLists(void);
extern void common_set_dword_1B477F4_to_zero_sub_45B450(void);
extern void reset_dword_209CEEC_input_related_sub_56D9C0(void);
extern int  UpdateRateRelated(void);
extern int  music_sfx_volume_changes_loop_sub_46BB10(int frames); /* add esp 4 */
extern int  __ftol(double); /* CRT, call only — do not decompile */

extern void menu_init_sub_4A2280(void);
extern void menu_exit_sub_4A22A0(void);
extern void BattleRewardMenu_MainLoop(void);
extern void main_init_sub_470690(void);
extern void main_exit_sub_4706A0(void);
extern void FFModuleHandler_main_loop(void);

int __cdecl FFBattleModule(int game_object)
{
    int desc[7]; /* var_1C .. var_4 : 0x1C-byte module/draw-buf block */
    char *g = (char *)game_object;
    int swirl;
    int vol;

    /* ebx := 0 for the whole function */

    if (*(int *)(g + 0xBA8) == 0)
        SetResolution(0, 0, 0x280, 0x1E0); /* push 1E0,280,ebx,ebx; add esp 0x10 */

    desc[0] = 0;          /* var_1C */
    desc[1] = 0;          /* var_18 */
    desc[2] = 0;          /* var_14 */
    desc[3] = 0x3F800000; /* var_10 = 1.0f */
    isGetDrawBuf(desc, game_object);
    isGetDrawBuf2(1, 1, 1, game_object); /* combined add esp 0x18 */

    if (*(int *)(g + 0xBA8) == 0)
        SetResolution(Render_X_Axis, Render_Y_Axis, Render_width, Render_Height);

    if (GfxDriver_BeginScene(0, game_object) == 0)
        goto loc_47D243; /* no LeaveScene, still run frame tail */

    sub_416B9A(dummy4_39);
    sub_424BF9(dword_1D2A288);
    Gfx_CopyRenderTuningDefaults();
    sub_499A40();
    Render_ESI_A60h_unused(game_object);
    render_ESIA78h(game_object);
    render_ESI348(game_object);
    sub_409B25(game_object); /* 6 pushes with the two 1-arg calls; add esp 0x18 */
    ___setargv_2();

    /* jz loc_47D0D3 if CAN==0 (no call) or related()==0 */
    if (CAN_BATTLE_BE_PAUSED != 0 && battle_pause_related_sub_4A71D0() != 0) {
        pause_game_battle = 1;
        is_sleeping = 0;
        goto loc_47D067; /* fallthrough in ASM; skips loc_47D0D3 */
    }

    /* loc_47D0D3 */
    IS_BATTLE_PAUSED = 0; /* byte = bl */
    if (pause_game_battle != 0)
        battle_sub_5003A0();
    pause_game_battle = 0; /* 0x47D0EC dword = ebx; A/B/C dropped this */
    if (is_sleeping == 0)
        goto loc_47D067;
    *(int *)(g + 0xB88) = 0;
    sub_45B590(); /* dword_B7CC24 = 0; sleeping / focus-loss only */
    goto loc_47D076; /* skips Gpu_EnableOTagHostPass */

loc_47D067:
    *(int *)(g + 0xB88) = 1; /* dword */
    Gpu_EnableOTagHostPass(); /* dword_B7CC24 = 1, every non-sleeping battle frame */

loc_47D076:
    GameTime_Tick2191_SG();
    GameTime_Tick2191_SG();
    GameTime_Tick2191_SG();
    GameTime_Tick2191_SG();

    if (mode_Battle_AnimationState == 3) {
        BattleUI_SetHudDrawTarget((void *)0); /* ebx; ticks skip RenderHud */
        isBattle_HUDupdate();
        BattleUI_HudInputAndATBTick();
        isBattle_HUDupdate();
        BattleUI_HudInputAndATBTick();
        isBattle_HUDupdate();
        BattleUI_HudInputAndATBTick();
    }

    if (IsWindowNOTActive() != 0)
        return GfxDriver_LeaveScene(game_object); /* EAX leftover; no tail */

    /* loc_47D10A: jnz skip if IS_BATTLE_PAUSED != 0 */
    if (IS_BATTLE_PAUSED == 0)
        FFBattleDirector_battleLoop();

    if (mode_Battle_AnimationState == 3) {
        unsigned int idx = (unsigned char)g_BattleFramePingPongIndex;
        /* lea ecx,[eax+eax*2]; shl ecx,3; sub ecx,eax → *23; *4 → *92 */
        BattleUI_SetHudDrawTarget((void *)(0x1D969C8 + idx * 92));
        isBattle_HUDupdate();
        BattleUI_HudInputAndATBTick();
        Battle_cursor_battle_win_and_pause_menu_render_related();
    }

    if (exit_battle != 0) {
        if (mode_Battle_AnimationState == 4) {
            desc[2] = (int)menu_init_sub_4A2280;      /* var_14 */
            desc[3] = (int)menu_exit_sub_4A22A0;      /* var_10 */
            desc[4] = (int)BattleRewardMenu_MainLoop; /* var_C */
        } else {
            /* not a jump table: any state != 4 */
            desc[2] = (int)main_init_sub_470690;
            desc[3] = (int)main_exit_sub_4706A0;
            desc[4] = (int)FFModuleHandler_main_loop;
        }
        desc[5] = 0; /* var_8 */
        desc[6] = 0; /* var_4 */
        FFSwitchModule_set_game_loop(desc, game_object);
    }

    /* jnz loc_47D1FA if IS_BATTLE_PAUSED != 0 */
    if (IS_BATTLE_PAUSED != 0) {
        Gpu_DrawOTagCurrent(-1); /* ot_head = 0xFFFFFFFF */
    } else {
        if (battle_swirl_dword_1CFF6F4 != 0) {
            swirl = battle_swirl_dword_1CFF6F4; /* eax before width overwrite */
            start_battle_swirl_sub_56D1D0(
                Render_X_Axis, Render_Y_Axis, Render_width, Render_Height,
                0x3AC49BA6, /* Z; color 0x55FFFFFF lives in the callee */
                swirl == 2); /* setz cl after cmp eax, 2 */
            battle_swirl_dword_1CFF6F4 = 0;
        }
        nullsub_35(); /* call only; unpaused path always, even if swirl==0 */
    }

    /* 0x47D204: latch for next frame's director gate; does not clear if 0 */
    if (pause_game_battle != 0)
        IS_BATTLE_PAUSED = 1; /* byte */

    if (is_sleeping == 0) {
        Gfx_SubmitDisplayLists();
        Gfx_SubmitTexturePageLists();
        GfxDriver_SelectRenderTarget(1, game_object);
        Gfx_SubmitViewportLists();
    }
    common_set_dword_1B477F4_to_zero_sub_45B450();
    GfxDriver_LeaveScene(game_object);

loc_47D243:
    reset_dword_209CEEC_input_related_sub_56D9C0();

    if (movie_dword_B6D970 != 0 && pause_game_battle == 0)
        is_sleeping = UpdateRateRelated();
    else
        is_sleeping = 0;

    /* fld timer_volume_change_related_dbl_1A788B8 ; call __ftol ; push eax */
    vol = __ftol(timer_volume_change_related_dbl_1A788B8);
    return music_sfx_volume_changes_loop_sub_46BB10(vol);
}
`
