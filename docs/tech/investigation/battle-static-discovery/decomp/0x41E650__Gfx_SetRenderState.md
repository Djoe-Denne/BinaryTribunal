# Gfx_SetRenderState @ 0x41E650

- Instr (live): 28
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui
- Push IDB: oui
- SetType: void __cdecl Gfx_SetRenderState(int, int, int)
- Notes parent: jl/jge signed type [0,25] (7C/7D, pas ja). FF 51 74 slot driver 29 cdecl add esp,0Ch. Occupancy absente. GetBufApp toujours. void, EAX slot ignoré.

## C réconcilié

```c
/* Gfx_SetRenderState @ 0x41E650
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 28 instr, size 0x47, end 0x41E697. cdecl, 3 args, retn C3. EBP frame, push ecx = var_4.
 * jl (7C) then jge (7D): signed type in [0, 25]. Not ja/jae.
 * FF 51 74 = call [ecx+0x74] driver slot 29, cdecl add esp,0Ch. Not occupancy (disp != 0xF8).
 * GetBufApp_0xA74 always. EAX after slot call discarded. void.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: all DWORD. No 66 prefix. No setcc. No jump table.
 */

void __cdecl Gfx_SetRenderState(int type, int value, int engine)
{
    _DWORD var_4;                       /* ebp-4: GetBufApp_0xA74 result */

    var_4 = GetBufApp_0xA74(engine);     /* add esp,4 */
    if (type < 0 || type >= 0x1A)       /* jl loc_41E686 ; jge loc_41E686 */
        OutputDebugString_1("ERROR: INVALID RENDER STATE TYPE \n");
    else
        (*(void (__cdecl **)(int, int, int))(var_4 + 0x74))(type, value, engine);
}
```
