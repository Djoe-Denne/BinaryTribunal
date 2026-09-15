# Gfx_ShadowSetRenderState @ 0x438599

- Instr (live): 15
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=18
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gfx_ShadowSetRenderState(int, int, int)
- Notes parent: jz (74) NULL-check *(engine+0xA84). DWORD store [eax+edx*4] 89 0C 90. Pas de call, pas occupancy. EAX leftover engine/table. ≠0x41E650 ≠0x43B50C. Slot 29 install +0x74 @ 0x42537C.

## C réconcilié

```c
/* Gfx_ShadowSetRenderState @ 0x438599
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 15 instr, size 0x26, end 0x4385BF. cdecl, 3 args, retn C3. EBP frame, push ecx = var_4.
 * jz (74 0C): NULL-check var_4. Not ja/jg/jl/jge. No type range gate (wrapper 0x41E650 has jl/jge [0,25]).
 * 8B 88 84 0A 00 00 = *(engine+0xA84) shadow table ptr (2692). Direct field, not GetBufApp_0xA74.
 * 89 0C 90 = DWORD store [eax+edx*4], no 66 prefix.
 * No call. No add esp. No driver-slot call [reg]. Occupancy 0xF8 absent.
 * Leftover EAX: engine on jz path, table on store path. IDA type int.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * Distinct from Gfx_SetRenderState 0x41E650 (wrapper slot 29) and Gfx_ShadowSetRenderState_DDraw 0x43B50C.
 * Vtable install: RenderBackend_Construct_OpenGL @ 0x42537C stores this at driver+0x74 (slot 29).
 */

int __cdecl Gfx_ShadowSetRenderState(int type, int value, int engine)
{
    _DWORD var_4;                       /* ebp-4: *(engine+0xA84) */

    var_4 = *(_DWORD *)(engine + 0xA84);
    if (!var_4)                         /* jz loc_4385BB */
        return engine;                  /* leftover EAX = arg_8 */
    *(_DWORD *)(var_4 + type * 4) = value; /* 89 0C 90 DWORD */
    return var_4;                       /* leftover EAX = table */
}
```
