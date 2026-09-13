# BattleRewardMenu_MainLoop @ 0x4A2690

- Instr (live): 127
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1872
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2579
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1116
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleRewardMenu_MainLoop(int p_draw_ctx)
- Notes parent: callback post-FFBattleExitSystem (xref FFBattleModule). isGetDrawBuf2 cdecl (1,1,1,ctx) pas (ctx,1,1,1). BeginScene (0,ctx). var_1C[3]=0x3F800000; module [2..6]=init/exit/loop/0/0. WORD 66 mode_Battle_AnimationState. [edi+0xB88] DWORD. fcomp C0 wait. Strides/occupancy/GetRandomInt absents. ja/jg absents. EAX leftover IsWindowNOTActive ou now.lo.

## C réconcilié

```c
/* BattleRewardMenu_MainLoop @ 0x4A2690
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 127 instr, size 0x1EC, end 0x4A287C. IDA type int __cdecl(int). No domain::.
 * Slot 0xD0 / F_CHAR 0x1D0 / CharacterData 0x98 / occupancy / GetRandomInt: unused.
 * ja/jg/setcc/jpt: none. WORD store only mode_Battle_AnimationState (66 C7 05).
 * add esp: 20h (8) after BeginScene; 18h (6) after sub_424BF9; 8 after FFSwitch;
 *   1Ch (7) after LeaveScene; 14h (5) after each timing trio; 1Ch epilogue.
 */

extern int IsWindowNOTActive(void);
extern int isGetDrawBuf(unsigned int *p_rgba, int p_draw_ctx);
extern int isGetDrawBuf2(int a1, int a2, int a3, int a4);
extern int GfxDriver_BeginScene(int a1, int p_draw_ctx);
extern int Render_ESI_A60h_unused(int p_draw_ctx);
extern int render_ESIA78h(int p_draw_ctx);
extern int render_ESI348(int p_draw_ctx);
extern int sub_409B25(int p_draw_ctx);
extern int sub_416B9A(int p_dummy4_39);
extern int sub_424BF9(int p_a);
extern int Gfx_CopyRenderTuningDefaults(void);
extern void ___setargv_2(void);
extern int GameTime_Tick2191_SG(void);
extern int sub_56D9D0(void);
extern int sub_4A6660(void);
extern int sub_4A3D10(void);
extern int FFGetBufferAddress(void);
extern int FFSwitchModule_set_game_loop(const void *p_desc, int p_buf);
extern int Gfx_DestroyTexturePageSlots(void);
extern void Gpu_EnableOTagHostPass(void);
extern int Gfx_SubmitDisplayLists(void);
extern void nullsub_35(void);
extern int sub_56BA50(int a, int p_draw_ctx);
extern int GfxDriver_SelectRenderTarget(int a, int p_draw_ctx);
extern int Gfx_SubmitViewportLists(void);
extern void common_set_dword_1B477F4_to_zero_sub_45B450(void);
extern int sub_499A40(void);
extern int GfxDriver_LeaveScene(int p_draw_ctx);
extern void reset_dword_209CEEC_input_related_sub_56D9C0(void);
extern int au_re_timeGetTime(unsigned int *p_now);
extern unsigned long long sub_40AA62(unsigned int *p_now, unsigned int *p_prev, unsigned int *p_out);
extern double sub_40AAEF(unsigned int *p_qword);

extern unsigned int dword_1D2BB90; /* 0x1D2BB90 now.lo */
extern unsigned int dword_1D2BB94; /* 0x1D2BB94 now.hi */
extern unsigned int dword_1D2BB88; /* 0x1D2BB88 prev.lo */
extern unsigned int dword_1D2BB8C; /* 0x1D2BB8C prev.hi */
extern double dbl_1D2BB80;          /* 0x1D2BB80 fcomp target, BSS */
extern unsigned int dummy4_39;     /* 0x1D2A284 */
extern unsigned int dword_1D2A288; /* 0x1D2A288 */
extern unsigned int dword_209AB50;
extern unsigned int dword_209AB58;
extern unsigned short mode_Battle_AnimationState; /* 0x1CDBFE0 WORD */

extern int main_init_sub_470690(void);
extern int main_exit_sub_4706A0(void);
extern int FFModuleHandler_main_loop(int);

int __cdecl BattleRewardMenu_MainLoop(int p_draw_ctx)
{
    unsigned int var_1C[7];
    int eax;
    int buf;
    double elapsed;

    /* mov eax, now.lo; mov ecx, now.hi; sub esp,1Ch; prev = now */
    eax = dword_1D2BB90;
    dword_1D2BB88 = eax;
    dword_1D2BB8C = dword_1D2BB94;

    eax = IsWindowNOTActive();
    if (eax != 0)
        return eax; /* jnz loc_4A2878 before push esi */

    /* RGBA: var_1C/var_18/var_14 = 0 (EAX), var_10 = 0x3F800000 (1.0f) */
    var_1C[0] = 0;
    var_1C[1] = 0;
    var_1C[2] = 0;
    var_1C[3] = 0x3F800000u;

    /* cdecl: push esi; push &var_1C -> (p_rgba, ctx) */
    isGetDrawBuf(var_1C, p_draw_ctx);
    /* cdecl: push esi; push 1; push 1; push 1 -> (1, 1, 1, ctx) */
    isGetDrawBuf2(1, 1, 1, p_draw_ctx);
    /* cdecl: push esi; push 0 -> (0, ctx). add esp,20h. jz loc_4A27EC if EAX==0 */
    if (GfxDriver_BeginScene(0, p_draw_ctx) != 0) {
        Render_ESI_A60h_unused(p_draw_ctx);
        render_ESIA78h(p_draw_ctx);
        render_ESI348(p_draw_ctx);
        sub_409B25(p_draw_ctx);
        sub_416B9A((int)dummy4_39);
        sub_424BF9((int)dword_1D2A288); /* add esp,18h */

        Gfx_CopyRenderTuningDefaults();
        ___setargv_2();
        GameTime_Tick2191_SG();
        sub_56D9D0();
        sub_4A6660();

        /* sub_4A3D10 = movsx eax, byte_1D6BC78; jz loc_4A27A9 */
        if (sub_4A3D10() != 0) {
            buf = FFGetBufferAddress();
            /* var_14/var_10/var_C/var_8/var_4 = [2..6]; [0],[1] leftover RGBA */
            var_1C[2] = (unsigned int)&main_init_sub_470690;
            var_1C[3] = (unsigned int)&main_exit_sub_4706A0;
            var_1C[4] = (unsigned int)&FFModuleHandler_main_loop;
            var_1C[5] = 0;
            var_1C[6] = 0;
            FFSwitchModule_set_game_loop(var_1C, buf); /* add esp,8 */

            Gfx_DestroyTexturePageSlots();
            *(unsigned int *)(buf + 0xB88) = 1; /* DWORD C7 87 */
            Gpu_EnableOTagHostPass();
            mode_Battle_AnimationState = 0; /* 66 C7 05 WORD */
        }

        /* loc_4A27A9 */
        Gfx_SubmitDisplayLists();
        nullsub_35();
        sub_56BA50((int)dword_209AB50, p_draw_ctx);
        GfxDriver_SelectRenderTarget(1, p_draw_ctx); /* push esi; push 1 */
        sub_56BA50((int)dword_209AB58, p_draw_ctx);
        Gfx_SubmitViewportLists();
        common_set_dword_1B477F4_to_zero_sub_45B450();
        sub_499A40();
        GfxDriver_LeaveScene(p_draw_ctx); /* add esp,1Ch */
    }

    /* loc_4A27EC */
    reset_dword_209CEEC_input_related_sub_56D9C0();

    au_re_timeGetTime(&dword_1D2BB90);
    sub_40AA62(&dword_1D2BB90, &dword_1D2BB88, var_1C);
    elapsed = sub_40AAEF(var_1C);
    /* fcomp dbl_1D2BB80; fnstsw ax; test ah,1 (C0). jz loc_4A2862 if not ST<mem */
    if (elapsed < dbl_1D2BB80) {
        do { /* loc_4A282A */
            au_re_timeGetTime(&dword_1D2BB90);
            sub_40AA62(&dword_1D2BB90, &dword_1D2BB88, var_1C);
            elapsed = sub_40AAEF(var_1C);
        } while (elapsed < dbl_1D2BB80); /* jnz loc_4A282A while C0 */
    }

    /* loc_4A2862: prev = now; EAX leftover = now.lo */
    eax = dword_1D2BB90;
    dword_1D2BB88 = eax;
    dword_1D2BB8C = dword_1D2BB94;
    return eax;
}
```
