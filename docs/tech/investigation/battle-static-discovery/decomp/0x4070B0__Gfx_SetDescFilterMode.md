# Gfx_SetDescFilterMode @ 0x4070B0

- Instr (live): 9
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void __cdecl Gfx_SetDescFilterMode(int, _DWORD *)
- Notes parent: jz desc==0 (pas ja/jg). 89 48 20 DWORD [eax+20h]=arg_0. EAX leftover (void). Occupancy absente. Pas de callee.

## C réconcilié

```c
/* Gfx_SetDescFilterMode @ 0x4070B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 9 instr, size 0x14, end 0x4070C4. cdecl, 2 args, retn C3. EBP frame. No callees.
 * 1 JCC: jz loc_4070C2 after cmp dword [ebp+arg_4],0 (desc==0). No ja/jg/setcc/jpt.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: 83 7D 0C 00 cmp DWORD; 8B loads; 89 48 20 store DWORD at +0x20. No 66.
 * EAX leftover: caller EAX if desc==0, else desc ptr. Not a designed return → void.
 * Same +0x20 field as Gfx_InitDrawListDesc arg0 (filter 0-4). Not glTexParameteri.
 */

void __cdecl Gfx_SetDescFilterMode(int filterMode, _DWORD *desc)
{
    if (desc != 0)                       /* cmp [ebp+arg_4],0 ; jz loc_4070C2 */
        desc[8] = (_DWORD)filterMode;    /* 89 48 20: DWORD [eax+20h] = arg_0 */
}
```
