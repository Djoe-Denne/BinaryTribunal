# GfxDriver_BeginScene @ 0x41E972

- Instr (live): 18
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GfxDriver_BeginScene(int, int)
- Notes parent: FF 90 A0 00 00 00 slot driver 40 cdecl add esp,8. Occupancy absente. GetBufApp toujours. int, EAX slot retourné. Pas de ja/jg. ≠0x41E947 ≠0x41E99D. 13 xrefs.

## C réconcilié

```c
/* GfxDriver_BeginScene @ 0x41E972
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 18 instr, size 0x2B, end 0x41E99D. cdecl, 2 args, retn C3. EBP frame, push ecx = var_4.
 * Linear: no ja/jg/jl/jb, no setcc, no jump table, no range gate.
 * FF 90 A0 00 00 00 = call [eax+0xA0] driver slot 40, cdecl add esp,8. Not occupancy (disp != 0xF8).
 * GetBufApp_0xA74 always. EAX after slot call returned (int).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF: absent (0xA0 is driver slot).
 * Width: all DWORD. No 66 prefix.
 * Distinct from GfxDriver_SelectRenderTarget 0x41E947 (slot 39 / +0x9C)
 * and GfxDriver_LeaveScene 0x41E99D (slot 41 / +0xA4). Not draw-list +0xA0.
 */

int __cdecl GfxDriver_BeginScene(int a0, int engine)
{
    _DWORD var_4;                       /* ebp-4: GetBufApp_0xA74 result */

    var_4 = GetBufApp_0xA74(engine);     /* add esp,4 */
    return (*(int (__cdecl **)(int, int))(var_4 + 0xA0))(a0, engine);
}
```
