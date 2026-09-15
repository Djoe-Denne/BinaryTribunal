# RenderBackend_Construct_DDraw @ 0x425540

- Instr (live): 115
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=27
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=23
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=13
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl RenderBackend_Construct_DDraw(int)
- Notes parent: cdecl 1 arg unused (caller add esp,4), pas thiscall. calloc 0x108 via au_re_SoundData_InitializeThread_8. jz NULL queue partagée EAX=var_4. 52 DWORD C7. +0xF8 slot 62 FP pas occupancy. +0xD0 slot 52. +0x44 slot 17. Pas de ja/jg. 0x42560C = store slot 29.

## C réconcilié

```c
/* RenderBackend_Construct_DDraw @ 0x425540
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 115 instr, size 0x281, end exclusive 0x4257C1. cdecl, 1 unused DWORD arg, retn C3.
 * IDA TYPE _DWORD *__thiscall(void *this) is wrong: ECX is never this; caller
 * Gfx_InitializeSelectedBackend 0x4094DA does push engine; call; add esp,4.
 * arg_0 @ ebp+8 is never read. push ecx = var_4 only.
 * Callee au_re_SoundData_InitializeThread_8 @ 0x42615E: 0 args, EAX =
 * assert_calloc(1, 0x108, "C:\\lib\\src\\graphics\\driver.cpp", 0x12); add esp,10h.
 * jz loc_4257BA if EAX==0 (skip 52 stores, still return var_4).
 * 52 DWORD C7 stores of function-pointer immediates. No 66 prefix. No ja/jg/setcc/jpt.
 * +0x10 written after +0x20 in ASM; stores are independent.
 * 0x42560C is the +0x74 slot-29 store, not a ctor.
 * Occupancy 1+2 / battle slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF: absent.
 * +0xF8 = slot 62 FP store (C7 81 F8 ...), not call [reg+0xF8].
 * +0xD0 = gfx slot 52. +0x44 = gfx slot 17.
 * Unwritten (calloc-zero): +0x24..+0x3C, +0x54..+0x60, +0x88, +0x90, +0x104.
 * Return EAX = var_4 (object or NULL). Not Construct_OpenGL / Construct_DDrawAlt.
 */

int __cdecl au_re_SoundData_InitializeThread_8(void);

_DWORD *__cdecl RenderBackend_Construct_DDraw(int unused)
{
    _DWORD *var_4;                      /* ebp-4: calloc result / returned object */

    (void)unused;
    var_4 = (_DWORD *)au_re_SoundData_InitializeThread_8();
    if (var_4 != 0) {                   /* jz loc_4257BA */
        var_4[0x00 / 4] = (_DWORD)sub_43ABDC;
        var_4[0x04 / 4] = (_DWORD)sub_43A57B;
        var_4[0x08 / 4] = (_DWORD)DirectX_7;
        var_4[0x0C / 4] = (_DWORD)DirectX_8;
        var_4[0x14 / 4] = (_DWORD)sub_43ADE3;
        var_4[0x18 / 4] = (_DWORD)sub_43B136;
        var_4[0x1C / 4] = (_DWORD)sub_43B14D;
        var_4[0x20 / 4] = (_DWORD)sub_43B1AC;
        var_4[0x10 / 4] = (_DWORD)RenderDDraw_Frame;                 /* slot 4, after +0x20 in ASM */
        var_4[0x40 / 4] = (_DWORD)au_re_SoundData_InitializeThread_4_0;
        var_4[0x44 / 4] = (_DWORD)sub_43B21E;                        /* gfx slot 17, not GF Exists */
        var_4[0x48 / 4] = (_DWORD)sub_43B274;
        var_4[0x4C / 4] = (_DWORD)__initp_misc_winxfltr_11;
        var_4[0x50 / 4] = (_DWORD)sub_43B319;
        var_4[0x64 / 4] = (_DWORD)sub_43BCC0;
        var_4[0x68 / 4] = (_DWORD)sub_43BCCA;
        var_4[0x6C / 4] = (_DWORD)sub_43B4FA;
        var_4[0x70 / 4] = (_DWORD)sub_43BD50;
        var_4[0x74 / 4] = (_DWORD)Gfx_ShadowSetRenderState_DDraw;    /* slot 29 @ 0x42560C */
        var_4[0x78 / 4] = (_DWORD)sub_43B57F;
        var_4[0x7C / 4] = (_DWORD)sub_43B532;
        var_4[0x80 / 4] = (_DWORD)sub_43B547;
        var_4[0x84 / 4] = (_DWORD)sub_43B55C;
        var_4[0x8C / 4] = (_DWORD)sub_43BD7D;
        var_4[0x94 / 4] = (_DWORD)sub_43C693;
        var_4[0x98 / 4] = (_DWORD)sub_43BAD8;
        var_4[0x9C / 4] = (_DWORD)RenderDDraw_SelectRenderTarget;    /* slot 39 */
        var_4[0xA0 / 4] = (_DWORD)RenderDDraw_BeginScene;            /* slot 40 */
        var_4[0xA4 / 4] = (_DWORD)RenderDDraw_LeaveScene;            /* slot 41 */
        var_4[0xA8 / 4] = (_DWORD)sub_43BD65;
        var_4[0xAC / 4] = (_DWORD)sub_43CB55;
        var_4[0xB0 / 4] = (_DWORD)sub_43CB55;
        var_4[0xB4 / 4] = (_DWORD)sub_43CB8F;
        var_4[0xB8 / 4] = (_DWORD)sub_43CBC9;
        var_4[0xBC / 4] = (_DWORD)sub_43CC03;
        var_4[0xC0 / 4] = (_DWORD)sub_43CC3D;
        var_4[0xC4 / 4] = (_DWORD)sub_43CC3D;
        var_4[0xC8 / 4] = (_DWORD)sub_43CC8D;
        var_4[0xCC / 4] = (_DWORD)sub_43D48F;
        var_4[0xD0 / 4] = (_DWORD)sub_43D900;                        /* gfx slot 52, not entity stride */
        var_4[0xD4 / 4] = (_DWORD)sub_43D900;
        var_4[0xD8 / 4] = (_DWORD)sub_43DA07;
        var_4[0xDC / 4] = (_DWORD)sub_43DABE;
        var_4[0xE0 / 4] = (_DWORD)sub_43DB75;
        var_4[0xE4 / 4] = (_DWORD)sub_43D9B7;
        var_4[0xE8 / 4] = (_DWORD)sub_43D9B7;
        var_4[0xEC / 4] = (_DWORD)sub_43DC2C;
        var_4[0xF0 / 4] = (_DWORD)sub_43DC7C;
        var_4[0xF4 / 4] = (_DWORD)sub_43DDC5;
        var_4[0xF8 / 4] = (_DWORD)sub_43DE2F;                        /* slot 62 FP store, not occupancy */
        var_4[0xFC / 4] = (_DWORD)sub_43DE99;
        var_4[0x100 / 4] = (_DWORD)sub_43DEC6;
    }
    return var_4;                       /* loc_4257BA: mov eax, var_4 */
}
```
