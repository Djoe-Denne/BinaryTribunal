# Gfx_CopyDescFields92_68 @ 0x40763D

- Instr (live): 16
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void __cdecl Gfx_CopyDescFields92_68(_DWORD *, _DWORD *)
- Notes parent: jz dest==0 puis src==0 (pas ja/jg). DWORD src+0x5C→dest+0xC4 et src+0x44→dest+0xC8. EAX leftover (void). Occupancy absente. +0x44 n'est pas GF Exists. Pas de callee.

## C réconcilié

```c
/* Gfx_CopyDescFields92_68 @ 0x40763D
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 16 instr, size 0x2F, end 0x40766C. cdecl, 2 args, retn C3. EBP frame. No callees.
 * 2 JCC: jz loc_40766A after cmp dword dest==0 then src==0. No ja/jg/setcc/jpt.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: 83 7D cmp DWORD; 8B loads; 89 90 C4/C8 00 00 00 store DWORD. No 66.
 * EAX leftover: caller EAX if either ptr==0, else dest. Not a designed return → void.
 * src+0x5C (92) → dest+0xC4 (196); src+0x44 (68) → dest+0xC8 (200).
 */

void __cdecl Gfx_CopyDescFields92_68(_DWORD *dest, _DWORD *src)
{
    if (dest == 0)                       /* cmp [ebp+arg_0],0 ; jz loc_40766A */
        return;
    if (src == 0)                        /* cmp [ebp+arg_4],0 ; jz loc_40766A */
        return;
    dest[0xC4 / 4] = src[0x5C / 4];      /* 89 90 C4 00 00 00: DWORD [eax+0C4h]=[ecx+5Ch] */
    dest[0xC8 / 4] = src[0x44 / 4];      /* 89 90 C8 00 00 00: DWORD [eax+0C8h]=[ecx+44h] */
}
```
