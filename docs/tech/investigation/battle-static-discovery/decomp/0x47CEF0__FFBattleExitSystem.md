# FFBattleExitSystem @ 0x47CEF0

- Instr (live): 22
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=103
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=61
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=127
- A==B: non
- Push IDB: oui
- SetType: oid __cdecl FFBattleExitSystem(void *);
- Notes parent: restore viewport; SetResolution cdecl 4 args; dword [arg0+0xB88]=1; nullsub_36 call only; Gpu + destroy TPage.

## C réconcilié

`c
/* FFBattleExitSystem @ 0x47CEF0
 * Ground truth = live ASM (asm_clean.asm), not Hex-Rays.
 * 22 instr. cdecl 1 arg; EAX leftover from last 0-arg call (not returned).
 */

extern int Render_X_Axis;
extern int Render_Y_Axis;
extern int Render_width;
extern int Render_Height;
extern int x_dword_1A77E78; /* saved by FFBattleInitSystem */
extern int y_dword_1A77E7C;
extern int w_dword_1A78BCC;
extern int h_dword_1A78BD0;

extern void nullsub_36(void);                         /* call only */
extern int  SetResolution(int x, int y, int w, int h); /* cdecl, add esp 0x10 */
extern void Gpu_EnableOTagHostPass(void);             /* sets dword_B7CC24 = 1 */
extern void Gfx_DestroyTexturePageSlots(void);        /* 96 TPage records */

void __cdecl FFBattleExitSystem(void *arg0)
{
    int x;
    int y;
    int w;
    int h;

    nullsub_36();

    /* esi=h, edx=w, ecx=y, eax=x; push esi,edx,ecx,eax → cdecl (x,y,w,h) */
    h = h_dword_1A78BD0;
    w = w_dword_1A78BCC;
    y = y_dword_1A77E7C;
    x = x_dword_1A77E78;

    /* stores AFTER the 4 pushes, BEFORE the call */
    Render_X_Axis = x;
    Render_Y_Axis = y;
    Render_width  = w;
    Render_Height = h;

    SetResolution(x, y, w, h);

    /* mov eax,[esp+14h+arg_0]; add esp,10h; mov dword ptr [eax+0B88h],1 */
    *(int *)((char *)arg0 + 0xB88) = 1;

    Gpu_EnableOTagHostPass();
    Gfx_DestroyTexturePageSlots();
}
`
