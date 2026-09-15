# RenderBackend_Construct_OpenGL @ 0x4252B0

- Instr (live): 115
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=13
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=18
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl RenderBackend_Construct_OpenGL(int)
- Notes parent: cdecl 1 arg unused (caller push+add esp,4); thiscall IDA rejeté. jz 0F 84 calloc==0. 52 DWORD fnptr, gaps 0. +10 Present après +20. +0xF8/+0xD0/+0x44 = slots driver 62/52/17 pas occupancy/stride/GF. DWORD only. 0x42537C = store slot 29.

## C réconcilié

```c
/* RenderBackend_Construct_OpenGL @ 0x4252B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 115 instr, size 0x281, end 0x425531. cdecl 1 unused stack arg (caller add esp,4), retn C3.
 * EBP frame, push ecx = var_4. IDA thiscall REJECTED (caller 0x409531 push engine).
 * jz (0F 84) var_4==0 -> loc_42552A. No ja/jg. No setcc. No jump table. No call [reg].
 * Callee au_re_SoundData_InitializeThread_8 @ 0x42615E: assert_calloc(1, 0x108, driver.cpp, 0x12).
 * 52 DWORD fnptr stores into 66-slot gfx_driver. Gaps stay 0 from calloc.
 * Occupancy 1+2 / battle stride 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * +0xF8 / +0xD0 / +0x44 / +0x84 = driver slots 62/52/17/33 fnptr stores, not those domains.
 * Width: all DWORD (C7/89). No 66 prefix. 0x42537C = slot 29 store, not a ctor.
 */

_DWORD *__cdecl RenderBackend_Construct_OpenGL(int engine)
{
    _DWORD *var_4;                      /* ebp-4: calloc(1,0x108) driver */

    (void)engine;                       /* pushed by caller, never read */
    var_4 = (_DWORD *)au_re_SoundData_InitializeThread_8(); /* 0-arg cdecl */
    if (var_4 != 0) {                   /* cmp var_4,0 ; jz loc_42552A */
        var_4[0]  = (_DWORD)sub_437B3D;                           /* +00 slot 0 */
        var_4[1]  = (_DWORD)sub_437B1D;                           /* +04 slot 1 */
        var_4[2]  = (_DWORD)sub_437BD1;                           /* +08 slot 2 */
        var_4[3]  = (_DWORD)sub_437C06;                           /* +0C slot 3 */
        var_4[5]  = (_DWORD)sub_437D0B;                           /* +14 slot 5 */
        var_4[6]  = (_DWORD)sub_437CF4;                           /* +18 slot 6 */
        var_4[7]  = (_DWORD)sub_437C10;                           /* +1C slot 7 */
        var_4[8]  = (_DWORD)sub_437D95;                           /* +20 slot 8 */
        var_4[4]  = (_DWORD)RenderGL_Present;                     /* +10 slot 4 (after +20 in stream) */
        var_4[16] = (_DWORD)au_re_SoundData_InitializeThread_4_0; /* +40 slot 16 */
        var_4[17] = (_DWORD)sub_43B21E;                           /* +44 slot 17 */
        var_4[18] = (_DWORD)sub_439018;                           /* +48 slot 18 */
        var_4[19] = (_DWORD)sub_437DCB;                           /* +4C slot 19 */
        var_4[20] = (_DWORD)sub_4381F8;                           /* +50 slot 20 */
        var_4[25] = (_DWORD)sub_438E62;                           /* +64 slot 25 */
        var_4[26] = (_DWORD)sub_438F2D;                           /* +68 slot 26 */
        var_4[27] = (_DWORD)sub_438525;                           /* +6C slot 27 */
        var_4[28] = (_DWORD)sub_43BD50;                           /* +70 slot 28 */
        var_4[29] = (_DWORD)Gfx_ShadowSetRenderState;             /* +74 slot 29 */
        var_4[30] = (_DWORD)RenderGL_CommitRenderState;           /* +78 slot 30 */
        var_4[31] = (_DWORD)sub_4385BF;                           /* +7C slot 31 */
        var_4[32] = (_DWORD)sub_4385D4;                           /* +80 slot 32 */
        var_4[33] = (_DWORD)RenderGL_SetBlendMode;                /* +84 slot 33 */
        var_4[35] = (_DWORD)sub_439367;                           /* +8C slot 35 */
        var_4[37] = (_DWORD)sub_439C2D;                           /* +94 slot 37 */
        var_4[38] = (_DWORD)sub_438CC9;                           /* +98 slot 38 */
        var_4[39] = (_DWORD)RenderGL_SelectRenderTarget;          /* +9C slot 39 */
        var_4[40] = (_DWORD)RenderGL_BeginScene;                  /* +A0 slot 40 */
        var_4[41] = (_DWORD)RenderGL_LeaveScene;                  /* +A4 slot 41 */
        var_4[42] = (_DWORD)sub_439000;                           /* +A8 slot 42 */
        var_4[43] = (_DWORD)sub_4370A6;                           /* +AC slot 43 */
        var_4[44] = (_DWORD)sub_4370A6;                           /* +B0 slot 44 same as +AC */
        var_4[45] = (_DWORD)sub_4370C4;                           /* +B4 slot 45 */
        var_4[46] = (_DWORD)sub_4370E2;                           /* +B8 slot 46 */
        var_4[47] = (_DWORD)sub_437100;                           /* +BC slot 47 */
        var_4[48] = (_DWORD)sub_43711E;                           /* +C0 slot 48 */
        var_4[49] = (_DWORD)sub_43711E;                           /* +C4 slot 49 same as +C0 */
        var_4[50] = (_DWORD)sub_437177;                           /* +C8 slot 50 */
        var_4[51] = (_DWORD)sub_437276;                           /* +CC slot 51 */
        var_4[52] = (_DWORD)sub_437422;                           /* +D0 slot 52 */
        var_4[53] = (_DWORD)sub_437422;                           /* +D4 slot 53 same as +D0 */
        var_4[54] = (_DWORD)sub_4374F6;                           /* +D8 slot 54 */
        var_4[55] = (_DWORD)sub_437564;                           /* +DC slot 55 */
        var_4[56] = (_DWORD)sub_4375D2;                           /* +E0 slot 56 */
        var_4[57] = (_DWORD)sub_437490;                           /* +E4 slot 57 */
        var_4[58] = (_DWORD)sub_437490;                           /* +E8 slot 58 same as +E4 */
        var_4[59] = (_DWORD)sub_437640;                           /* +EC slot 59 */
        var_4[60] = (_DWORD)sub_4376A6;                           /* +F0 slot 60 */
        var_4[61] = (_DWORD)sub_437808;                           /* +F4 slot 61 */
        var_4[62] = (_DWORD)sub_437826;                           /* +F8 slot 62 */
        var_4[63] = (_DWORD)sub_437844;                           /* +FC slot 63 */
        var_4[64] = (_DWORD)sub_437866;                           /* +100 slot 64 */
    }
    return var_4;                       /* loc_42552A: mov eax, [ebp+var_4] */
}
```
