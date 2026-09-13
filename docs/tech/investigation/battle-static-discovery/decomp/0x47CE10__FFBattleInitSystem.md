# FFBattleInitSystem @ 0x47CE10

- Instr (live): 56
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=199
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=95
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=183
- A==B: non
- Push IDB: oui
- SetType: int FFBattleInitSystem(void);
- Notes parent: flags 0 puis rep stosd 0x4D1 dwords; timestep 3.22265625f si mode 8 sinon 2.734375f (cdecl 0 puis float); texture 0.8f; viewport hi-res (0,24,640,432) else (160,132,320,216); retour EAX SetResolution.

## C réconcilié

`c
/* FFBattleInitSystem @ 0x47CE10
 * Ground truth = live ASM (asm_clean.asm), not Hex-Rays.
 * 56 instr. cdecl int(); EAX leftover from SetResolution.
 */

#include <string.h>

extern int            dword_1D27B00[];            /* 0x4D1 dwords = 0x1344 bytes */
extern int            exit_battle;                 /* mov exit_battle, esi — dword */
extern int            mode3_substep;
extern int            mode_StateGlobal;            /* cmp mode_StateGlobal, 8 */
extern int            Render_X_Axis;
extern int            Render_Y_Axis;
extern int            Render_width;
extern int            Render_Height;
extern int            x_dword_1A77E78;
extern int            y_dword_1A77E7C;
extern int            w_dword_1A78BCC;
extern int            h_dword_1A78BD0;
extern int            High_resolution;            /* mov eax, High_resolution */

extern void engine_set_time_sub_4020C0(int zero, float timestep); /* cdecl, add esp 8 */
extern void common_texture_related_sub_460B60(float scale);         /* cdecl, add esp 4 */
extern int  SetResolution(int x, int y, int w, int h);            /* cdecl, add esp 0x10 */

int FFBattleInitSystem(void)
{
    int x;
    int y;
    int w;
    int h;

    /* xor esi,esi; ecx=0x4D1; xor eax,eax; edi=&dword_1D27B00 */
    exit_battle = 0;
    mode3_substep = 0;
    memset(dword_1D27B00, 0, 0x4D1 * sizeof(int)); /* THEN rep stosd */

    /* loc_47CE3F / loc_47CE44: two 32-bit pushes, not a double.
     * push float; push esi(0); call; add esp, 8 */
    if (mode_StateGlobal == 8)                      /* jnz loc_47CE3F if != 8 */
        engine_set_time_sub_4020C0(0, 3.22265625f); /* 0x404E4000 */
    else
        engine_set_time_sub_4020C0(0, 2.734375f);   /* 0x402F0000 */

    common_texture_related_sub_460B60(0.8f);       /* 0x3F4CCCCD; add esp,4 delayed */

    x_dword_1A77E78 = Render_X_Axis;
    y_dword_1A77E7C = Render_Y_Axis;
    w_dword_1A78BCC = Render_width;
    h_dword_1A78BD0 = Render_Height;

    /* cmp High_resolution, esi(0); jz loc_47CEB3 if == 0 */
    if (High_resolution != 0) {
        x = 0;
        y = 0x18;                                   /* 24 */
        w = 0x280;                                  /* 640 */
        h = 0x1B0;                                  /* 432 */
    } else {                                        /* loc_47CEB3 */
        x = 0xA0;                                   /* 160 */
        y = 0x84;                                   /* 132 */
        w = 0x140;                                  /* 320 */
        h = 0xD8;                                   /* 216 */
    }

    Render_X_Axis = x;
    Render_Y_Axis = y;
    Render_width  = w;
    Render_Height = h;                             /* store after the 4 pushes, before call */

    /* loc_47CED8: push h, w, y, x; call SetResolution; add esp, 0x10 */
    return SetResolution(x, y, w, h);
}
`
