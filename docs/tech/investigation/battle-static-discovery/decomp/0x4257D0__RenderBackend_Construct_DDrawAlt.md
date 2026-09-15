# RenderBackend_Construct_DDrawAlt @ 0x4257D0

- Instr (live): 125
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=83
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=968
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=143
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl RenderBackend_Construct_DDrawAlt(int)
- Notes parent: calloc(1,0x108) 57 FP DWORD C7. Slot 4 +0x10 = RenderDDraw_Present (pas Frame). Alt-only +0x54..+0x60 et +0x104. +0xF8 slot 62 FP pas occupancy. jz only. cdecl arg engine unused. Caller case 0 @ 0x4094B6 add esp,4. 0x4258EF = store slot 33. Occupancy 1+2 absente.

## C réconcilié

```c
/* RenderBackend_Construct_DDrawAlt @ 0x4257D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 125 instr, size 0x2B6, end 0x425A86. cdecl, 1 unused DWORD (engine), retn C3.
 * EBP frame, push ecx = var_4. jz loc_425A7F only; no ja/jg/setcc/jpt.
 * Callee au_re_SoundData_InitializeThread_8 @ 0x42615E: assert_calloc(1,0x108), add esp,10h.
 * 57 DWORD FP stores (C7, no 66). +0x10 Present written after +0x20. +0xF8 = slot 62 FP, not occupancy.
 * Gaps calloc-zero: +0x24..+0x3C, +0x88, +0x90. Alt-only written: +0x54..+0x60, +0x104.
 * Occupancy 1+2 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF: absent (those disps are driver slots).
 * Caller Gfx_InitializeSelectedBackend 0x4094B6 case 0: push engine; add esp,4; store EAX at engine+0xA74.
 * ≠ Construct_DDraw 0x425540 ≠ Construct_OpenGL 0x4252B0. 0x4258EF is slot-33 store, not a ctor.
 */

extern int __cdecl au_re_SoundData_InitializeThread_8(void);

extern void DD_init(void);
extern void DD_uninit(void);
extern void DirectX_7(void);
extern void DirectX_8(void);
extern void RenderDDraw_Present(void);
extern void sub_426900(void);
extern void au_re_isGetDrawBuf2(void);
extern void sub_426AE4(void);
extern void sub_426C31(void);
extern void au_re_SoundData_InitializeThread_4(void);
extern void sub_41ED04(void);
extern void sub_41296A(void);
extern void sub_420097(void);
extern void sub_420917(void);
extern void sub_420143(void);
extern void sub_4203B2(void);
extern void sub_420476(void);
extern void sub_436864(void);
extern void sub_4365FF(void);
extern void sub_4367A8(void);
extern void sub_4427CF(void);
extern void sub_4307C3(void);
extern void RenderDDrawAlt_SetRenderState(void);
extern void sub_41F99A(void);
extern void sub_441560(void);
extern void sub_441581(void);
extern void sub_44162E(void);
extern void sub_4422FD(void);
extern void sub_4425C4(void);
extern void sub_44233F(void);
extern void RenderDDrawAlt_SelectRenderTarget(void);
extern void RenderDDrawAlt_BeginScene(void);
extern void RenderDDrawAlt_LeaveScene(void);
extern void sub_43F96E(void);
extern void sub_43DF00(void);
extern void sub_43DF2A(void);
extern void sub_43DF54(void);
extern void sub_43DFA6(void);
extern void RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4(void);
extern void RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB(void);
extern void sub_43DFD0(void);
extern void sub_43E059(void);
extern void sub_43E0E2(void);
extern void sub_43E197(void);
extern void sub_43E5E9(void);
extern void sub_43E692(void);
extern void sub_43E220(void);
extern void sub_43E540(void);
extern void sub_42172A(void);

_DWORD *__cdecl RenderBackend_Construct_DDrawAlt(int engine)
{
    _DWORD *obj; /* var_4 @ ebp-4 */

    (void)engine; /* Arg_0 @ ebp+8 never read */

    obj = (_DWORD *)au_re_SoundData_InitializeThread_8();
    if (obj != 0) {
        obj[0x00 / 4] = (_DWORD)DD_init;
        obj[0x04 / 4] = (_DWORD)DD_uninit;
        obj[0x08 / 4] = (_DWORD)DirectX_7;
        obj[0x0C / 4] = (_DWORD)DirectX_8;
        obj[0x14 / 4] = (_DWORD)sub_426900;
        obj[0x18 / 4] = (_DWORD)au_re_isGetDrawBuf2;
        obj[0x1C / 4] = (_DWORD)sub_426AE4;
        obj[0x20 / 4] = (_DWORD)sub_426C31;
        obj[0x10 / 4] = (_DWORD)RenderDDraw_Present;
        obj[0x40 / 4] = (_DWORD)au_re_SoundData_InitializeThread_4;
        obj[0x44 / 4] = (_DWORD)sub_41ED04;
        obj[0x48 / 4] = (_DWORD)sub_41296A;
        obj[0x4C / 4] = (_DWORD)sub_420097;
        obj[0x50 / 4] = (_DWORD)sub_420917;
        obj[0x54 / 4] = (_DWORD)sub_420143;
        obj[0x58 / 4] = (_DWORD)sub_4203B2;
        obj[0x5C / 4] = (_DWORD)sub_420476;
        obj[0x60 / 4] = (_DWORD)sub_436864;
        obj[0x64 / 4] = (_DWORD)sub_4365FF;
        obj[0x68 / 4] = (_DWORD)sub_4367A8;
        obj[0x6C / 4] = (_DWORD)sub_4427CF;
        obj[0x70 / 4] = (_DWORD)sub_4307C3;
        obj[0x74 / 4] = (_DWORD)RenderDDrawAlt_SetRenderState;
        obj[0x78 / 4] = (_DWORD)sub_41F99A;
        obj[0x7C / 4] = (_DWORD)sub_441560;
        obj[0x80 / 4] = (_DWORD)sub_441581;
        obj[0x84 / 4] = (_DWORD)sub_44162E;
        obj[0x8C / 4] = (_DWORD)sub_4422FD;
        obj[0x94 / 4] = (_DWORD)sub_4425C4;
        obj[0x98 / 4] = (_DWORD)sub_44233F;
        obj[0x9C / 4] = (_DWORD)RenderDDrawAlt_SelectRenderTarget;
        obj[0xA0 / 4] = (_DWORD)RenderDDrawAlt_BeginScene;
        obj[0xA4 / 4] = (_DWORD)RenderDDrawAlt_LeaveScene;
        obj[0xA8 / 4] = (_DWORD)sub_43F96E;
        obj[0xAC / 4] = (_DWORD)sub_43DF00;
        obj[0xB0 / 4] = (_DWORD)sub_43DF00;
        obj[0xB4 / 4] = (_DWORD)sub_43DF2A;
        obj[0xB8 / 4] = (_DWORD)sub_43DF54;
        obj[0xBC / 4] = (_DWORD)sub_43DFA6;
        obj[0xC0 / 4] = (_DWORD)RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4;
        obj[0xC4 / 4] = (_DWORD)RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4;
        obj[0xC8 / 4] = (_DWORD)RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4;
        obj[0xCC / 4] = (_DWORD)RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB;
        obj[0xD0 / 4] = (_DWORD)sub_43DFD0;
        obj[0xD4 / 4] = (_DWORD)sub_43DFD0;
        obj[0xD8 / 4] = (_DWORD)sub_43E059;
        obj[0xDC / 4] = (_DWORD)sub_43E0E2;
        obj[0xE0 / 4] = (_DWORD)sub_43E197;
        obj[0xE4 / 4] = (_DWORD)sub_43E5E9;
        obj[0xE8 / 4] = (_DWORD)sub_43E5E9;
        obj[0xEC / 4] = (_DWORD)sub_43E5E9;
        obj[0xF0 / 4] = (_DWORD)sub_43E692;
        obj[0xF4 / 4] = (_DWORD)sub_43E220;
        obj[0xF8 / 4] = (_DWORD)sub_43E220;
        obj[0xFC / 4] = (_DWORD)sub_43E540;
        obj[0x100 / 4] = (_DWORD)sub_43E540;
        obj[0x104 / 4] = (_DWORD)sub_42172A;
    }
    return obj;
}
```
