# Gfx_SetTIMDescFlags @ 0x407586

- Instr (live): 60
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: void __cdecl Gfx_SetTIMDescFlags(int, int, int, _DWORD *)
- Notes parent: jz desc==0 (pas ja/jg). DWORD +0xC=0x20002 ; +8 zero puis |=2|=0x20000 puis or al 4/8 or ah 2/80h → 0x2820E. +0x24=sub_40742E(arg_4) add esp 4. +0x28=-1. Gfx_SetPrimBlendMode(arg_0,arg_8,desc) add esp 0Ch. Occupancy absente. void, EAX leftover.

## C réconcilié

```c
/* Gfx_SetTIMDescFlags @ 0x407586
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 60 instr, size 0xB7, end 0x40763D. cdecl, 4 args, retn C3. EBP + push ecx (var_4).
 * 1 JCC: jz loc_407639 after cmp dword [ebp+14h],0 (desc==0). No ja/jg/setcc/jpt.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: cmp/stores DWORD (83 7D / 89 / C7). or al (0C) / or ah (80 CC) then DWORD store +8.
 * No 66 prefix. EAX leftover (void). Callees: sub_40742E add esp 4; Gfx_SetPrimBlendMode add esp 0Ch.
 */

extern int __cdecl sub_40742E(int);
extern void __cdecl Gfx_SetPrimBlendMode(int, int, _DWORD *);

void __cdecl Gfx_SetTIMDescFlags(int arg_0, int arg_4, int arg_8, _DWORD *desc)
{
    _DWORD var_4;                            /* push ecx; [ebp-4] */

    if (desc == 0)                           /* 83 7D 14 00 ; jz loc_407639 */
        return;

    var_4 = 0x20002u;                        /* C7 45 FC 02 00 02 00 */
    desc[3] = var_4;                         /* 89 48 0C: DWORD [desc+0x0C] */
    desc[2] = 0;                             /* C7 42 08 00 00 00 00 */
    desc[2] |= 2u;                           /* 83 C9 02 */
    desc[2] |= 0x20000u;                     /* 81 C9 00 00 02 00  → +8 == 0x20002 */

    desc[9] = (_DWORD)sub_40742E(arg_4);     /* push arg_4; call; add esp,4; 89 41 24 */

    desc[2] |= 4u;                           /* 0C 04 or al,4 */
    desc[2] |= 8u;                           /* 0C 08 or al,8 */
    desc[2] |= 0x200u;                       /* 80 CC 02 or ah,2  (bit 9) */
    desc[2] |= 0x8000u;                      /* 80 CC 80 or ah,80h (bit 15) → +8 == 0x2820E */

    desc[10] = 0xFFFFFFFFu;                  /* C7 42 28 FF FF FF FF */

    Gfx_SetPrimBlendMode(arg_0, arg_8, desc); /* push desc, arg_8, arg_0; add esp,0Ch */
}
```
