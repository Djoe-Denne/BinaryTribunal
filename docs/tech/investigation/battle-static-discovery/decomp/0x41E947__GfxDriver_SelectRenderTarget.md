# GfxDriver_SelectRenderTarget @ 0x41E947

- Instr (live): 18
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=13
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui
- Push IDB: oui
- SetType: int __cdecl GfxDriver_SelectRenderTarget(int, int)
- Notes parent: FF 90 9C 00 00 00 slot driver 39 cdecl add esp,8. Occupancy absente. GetBufApp toujours. int, EAX slot renvoyé. Linéaire, pas de jcc.

## C réconcilié

```c
/* GfxDriver_SelectRenderTarget @ 0x41E947
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 18 instr, size 0x2B, end 0x41E972. cdecl, 2 args, retn C3. EBP frame, push ecx = var_4.
 * FF 90 9C 00 00 00 = call [eax+0x9C] driver slot 39, cdecl add esp,8. Not occupancy (disp != 0xF8).
 * GetBufApp_0xA74 always. EAX after slot call returned (int). Linear, no jcc.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: all DWORD. No 66 prefix. No setcc. No jump table.
 */

int __cdecl GfxDriver_SelectRenderTarget(int target, int engine)
{
    _DWORD var_4;                       /* ebp-4: GetBufApp_0xA74 result */

    var_4 = GetBufApp_0xA74(engine);     /* add esp,4 */
    return (*(int (__cdecl **)(int, int))(var_4 + 0x9C))(target, engine);
}
```
