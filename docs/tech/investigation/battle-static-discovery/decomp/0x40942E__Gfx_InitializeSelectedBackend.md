# Gfx_InitializeSelectedBackend @ 0x40942E

- Instr (live): 151
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=58
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gfx_InitializeSelectedBackend(_DWORD *)
- Notes parent: ja unsigned selector>3 (pas jg). jpt 0 DDrawAlt / 1 DDraw / 2 factory +0xBD0 call [ebp-8] / 3 OpenGL fallthrough. Init FF 10 slot 0. Occupancy absente. DWORD partout. EAX=var_4 puis sub_408E90.

## C réconcilié

```c
/* Gfx_InitializeSelectedBackend @ 0x40942E
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 151 instr, size 0x232, end 0x409660. cdecl, 1 arg, retn C3. EBP frame, sub esp,20h.
 * Switch jpt_4094AB @ 0x409660: [0]=0x4094B2 [1]=0x4094D6 [2]=0x409507 [3]=0x40952E.
 * ja (unsigned) if selector>3 → def_4094AB. Case 3 falls into def_4094AB (no jmp).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: all DWORD (C7 82 / 89 8x / C7 45). No 66 prefix. No setcc.
 * EAX return = var_4 (Init slot0, else 0, else overwritten by sub_408E90).
 * FF 55 F8 = call [ebp-8] (factory), not occupancy 0xF8.
 */

int __cdecl Gfx_InitializeSelectedBackend(_DWORD *engine)
{
    _DWORD var_20;                      /* ebp-0x20: copy of engine+0xBA8 */
    _DWORD var_1C;                      /* ebp-0x1C: vec4[0] for isGetDrawBuf */
    _DWORD var_18;                      /* ebp-0x18: vec4[1] */
    _DWORD var_14;                      /* ebp-0x14: vec4[2] */
    _DWORD var_10;                      /* ebp-0x10: vec4[3] = 0x3F800000 */
    _DWORD *var_C;                      /* ebp-0x0C: driver object */
    _DWORD var_8;                       /* ebp-0x08: factory from engine+0xBD0 */
    int var_4;                          /* ebp-0x04: status / EAX */

    sub_418FB6();
    var_4 = 0;
    if (engine == 0)                    /* cmp [ebp+arg_0],0 ; jz loc_409659 */
        return var_4;

    engine[0xB74 / 4] = engine[0xB84 / 4] + 0x9008;
    engine[0xB78 / 4] = engine[0xB84 / 4] + 0x9418;
    engine[0xB7C / 4] = engine[0xB84 / 4] + 0x9828;

    var_20 = engine[0xBA8 / 4];
    /* cmp var_20, 3 ; ja def_4094AB (UNSIGNED). C switch 0..3 is equivalent. */
    switch (var_20) {
    case 0:                             /* loc_4094B2 DDrawAlt */
        engine[0xA74 / 4] = (_DWORD)RenderBackend_Construct_DDrawAlt(engine);
        engine[0xBBC / 4] = 3;
        break;
    case 1:                             /* loc_4094D6 DDraw */
        engine[0xA74 / 4] = (_DWORD)RenderBackend_Construct_DDraw(engine);
        engine[0xBBC / 4] = 1;
        engine[0xABC / 4] = 0;
        break;
    case 2:                             /* loc_409507 DLL factory */
        var_8 = engine[0xBD0 / 4];
        if (var_8 != 0) {               /* jz loc_40952C: do not write +0xA74 */
            engine[0xA74 / 4] =
                ((int (__cdecl *)(_DWORD *))var_8)(engine);
        }
        break;
    case 3:                             /* loc_40952E OpenGL; falls into def_4094AB */
        engine[0xA74 / 4] = (_DWORD)RenderBackend_Construct_OpenGL(engine);
        engine[0xABC / 4] = 0;
        break;
    default:
        break;                          /* selector > 3 unsigned: skip ctors */
    }

    if (engine[0xA74 / 4] != 0) {       /* def_4094AB */
        var_C = (_DWORD *)GetBufApp_0xA74(engine);
        var_4 = ((int (__cdecl *)(_DWORD *))var_C[0])(engine); /* FF 10 call [eax] slot 0 */
    } else {
        var_4 = 0;
    }

    if (var_4 != 0) {
        sub_418C6E(
            engine[0xB84 / 4] + 0x9000,
            engine[0xB84 / 4] + 0x9410,
            engine[0xB84 / 4] + 0x9820,
            (_DWORD)engine + 0x87C);    /* lea/add ecx,87Ch; push ecx (address) */
    }

    if (var_4 != 0) {
        var_14 = 0;
        var_18 = 0;
        var_1C = 0;
        var_10 = 0x3F800000;            /* float 1.0; 16-byte block var_1C..var_10 */
        gfx_driver_set_viewport_sub_41E070(
            0,
            0,
            engine[0xA94 / 4],
            engine[0xA98 / 4],
            engine);
        isGetDrawBuf(&var_1C, engine);
        sub_41DF96(engine);
        Render_FramePresent_Dispatch(engine);
        sub_41DF96(engine);
    }

    if (var_4 != 0)
        var_4 = sub_408E90(engine);

    return var_4;                       /* loc_409659 */
}
```
