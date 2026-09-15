# GfxDriver_LeaveScene @ 0x41E99D

- Instr (live): 16
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui
- Push IDB: oui
- SetType: int __cdecl GfxDriver_LeaveScene(int)
- Notes parent: FF 92 A4 00 00 00 slot driver 41 cdecl add esp,4. Occupancy absente. GetBufApp toujours. int, EAX slot retourné. Pas de ja/jg. ≠BeginScene 0x41E972 ≠SelectTarget 0x41E947 ≠Present 0x41DF0C.

## C réconcilié

```c
/* GfxDriver_LeaveScene @ 0x41E99D
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 16 instr, size 0x27, end 0x41E9C4. cdecl, 1 arg, retn C3. EBP frame, push ecx = var_4.
 * Linear: no ja/jg/jl/jb/jz, no setcc, no jump table, no NULL-guard on the slot.
 * FF 92 A4 00 00 00 = call [edx+0xA4] driver slot 41, cdecl add esp,4. Not occupancy (disp != 0xF8).
 * GetBufApp_0xA74 always. EAX after slot call returned (int).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF: absent (0xA4 is driver slot).
 * Width: all DWORD (89 45 FC). No 66 prefix.
 * Distinct from GfxDriver_BeginScene 0x41E972 (slot 40 / +0xA0, 2 args) and
 * GfxDriver_SelectRenderTarget 0x41E947 (slot 39 / +0x9C, 2 args). Not present (slot 4 @ 0x41DF0C).
 */

int __cdecl GfxDriver_LeaveScene(int engine)
{
    _DWORD var_4;                       /* ebp-4: GetBufApp_0xA74 result */

    var_4 = GetBufApp_0xA74(engine);     /* add esp,4 */
    return (*(int (__cdecl **)(int))(var_4 + 0xA4))(engine);
}
```
