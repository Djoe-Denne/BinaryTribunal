# sub_41EF3C @ 0x41EF3C

- Instr (live): ~16 (0x41EF3C..0x41EF78, retn)
- Palier: trivial
- Ground truth = live ASM + Hex-Rays, pas de divergence repérée. Pas de renames IDA.
- cdecl, 2 args : a1 = texobj (ou 0), a2 = device wrapper (ou 0).

## C réconcilié

```c
/* sub_41EF3C @ 0x41EF3C
 * SetTexture stage 0 sur le device wrapper.
 * Uniquement live disasm:
 *   0x41EF5D call dword ptr [eax+98h]  ; device wrapper vt+152
 *   args stdcall pushes: 0 (stage), *(a1+12) (texture), a2 (this) — 0x41EF4B..0x41EF5D
 * La texture D3D brute = *(texobj+0x0C) (COM IDirect3DTexture9*).
 */
int __cdecl sub_41EF3C(DWORD *texobj /*a1*/, DWORD *device /*a2*/)
{
    if (!device)                                                  /*0x41EF43*/
        return 0;
    return ((int (__stdcall *)(DWORD*, DWORD, DWORD))device[0])(   /* vt+152 = idx 38 */
        device, 0 /*stage 0*/, texobj ? texobj[3] /* *(texobj+0x0C) */ : 0); /*0x41EF5D*/
}
```

Ancre : `*(texobj+0x0C)` = pointeur IDirect3DTexture9 gebruikt par SetTexture (provenance : wrapper texobj créé par l'upload TIM, cf. sub_42022C @0x4202C1/0x4202D3 lit *(T+0x3C)/w et *(T+0x40)/h).
