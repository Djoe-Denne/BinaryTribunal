# GfxDriver_SetBlendMode @ 0x41E752

- Instr (live): 18
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GfxDriver_SetBlendMode(int, int)
- Notes parent: FF 90 84 00 00 00 slot driver 33 cdecl add esp,8. Occupancy absente. GetBufApp toujours. int, EAX slot retourné. Pas de ja/jg. ≠0x407162.

## C réconcilié

```c
/* GfxDriver_SetBlendMode @ 0x41E752
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 18 instr, size 0x2B, end 0x41E77D. cdecl, 2 args, retn C3. EBP frame, push ecx = var_4.
 * Linear: no ja/jg/jl/jb, no setcc, no jump table, no range gate.
 * FF 90 84 00 00 00 = call [eax+0x84] driver slot 33, cdecl add esp,8. Not occupancy (disp != 0xF8).
 * GetBufApp_0xA74 always. EAX after slot call returned (int).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF: absent (0x84 is driver slot).
 * Width: all DWORD. No 66 prefix.
 * Distinct from Gfx_SetPrimBlendMode 0x407162 and Gfx_SetRenderState 0x41E650 (slot 29 / +0x74).
 */

int __cdecl GfxDriver_SetBlendMode(int blend_mode, int engine)
{
    _DWORD var_4;                       /* ebp-4: GetBufApp_0xA74 result */

    var_4 = GetBufApp_0xA74(engine);     /* add esp,4 */
    return (*(int (__cdecl **)(int, int))(var_4 + 0x84))(blend_mode, engine);
}
```
