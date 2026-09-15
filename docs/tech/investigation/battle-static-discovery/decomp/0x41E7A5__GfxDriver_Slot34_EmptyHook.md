# GfxDriver_Slot34_EmptyHook @ 0x41E7A5

- Instr (live): 19
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui
- Push IDB: oui
- SetType: int __cdecl GfxDriver_Slot34_EmptyHook(int)
- Notes parent: jz slot driver+0x88==0 skip. FF 90 88 00 00 00 slot 34 pas occupancy. EAX skip=GetBufApp, call=slot. DWORD; pas ja/0xD0/GF+44. 0 xref.

## C réconcilié

```c
/* GfxDriver_Slot34_EmptyHook @ 0x41E7A5
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 19 instr, size 0x33, end 0x41E7D8. cdecl, 1 arg, retn C3. EBP frame, push ecx.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: all DWORD (89 45 FC / 83 B9 88 00 00 00 00). No 66 prefix. No setcc. jz only.
 * FF 90 88 00 00 00 = call [eax+88h] driver slot 34, not occupancy 0xF8.
 * EAX skip = GetBufApp leftover; EAX call = slot+0x88 return. 0 xrefs.
 */

int __cdecl GfxDriver_Slot34_EmptyHook(int engine)
{
    _DWORD var_4;                       /* ebp-4: GetBufApp_0xA74 result (driver) */
    int eax;

    var_4 = GetBufApp_0xA74(engine);     /* add esp,4 */
    eax = (int)var_4;
    if (*(_DWORD *)(var_4 + 0x88) != 0) { /* cmp dword [ecx+88h],0 ; jz loc_41E7D4 */
        eax = ((int (__cdecl *)(int))*(_DWORD *)(var_4 + 0x88))(engine);
                                        /* FF 90 88 00 00 00 call [eax+88h]; add esp,4 */
    }
    return eax;                         /* loc_41E7D4: no extra EAX write */
}
```
