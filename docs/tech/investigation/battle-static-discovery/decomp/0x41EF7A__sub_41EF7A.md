# sub_41EF7A @ 0x41EF7A

- Instr (live): ~200 (0x41EF7A..0x41F996 approx, frame sub esp,0x38)
- Palier: high
- Ground truth = live ASM + Hex-Rays (décompilation MCP du 2026-09-26), divergences corrigées par ASM. Pas de renames IDA.
- cdecl, 3 args : a1=int enable_texture, a2=matdesc (descripteur render-state), a3=buffer (singleton FFGetBufferAddress).
- Ancre principale : device wrapper = *(buffer+0x314) (0x41EF83 : `mov ecx,[eax+314h]` avec eax=[arg_8]); tous les sets d'état passent par `call [vt+88]` sur cet objet.
- Path texture (bit 2) : texobj = *(matdesc+0x14) (0x41F011 : `v8 = a2[5]`), test bit *(matdesc+8), puis branches v8[39]=+0x9C (byte test), v8[40]=+0xA0 (liste), v8[38]=+0x98, et **sub_41ED69(v8, device) @0x41F0FC / 0x41F942 = le bind D3D réel**.
- Path sous-appel direct : sub_41EF3C = SetTexture(stage 0, *(texobj+0x0C)) via call [device+152].

## C réconcilié

```c
/* sub_41EF7A @ 0x41EF7A
 * Ground truth = live ASM, not Hex-Rays.
 * Applique les render states de matdesc sur le device wrapper *(buffer+0x314)
 * et, si le bit 2 du masque *(matdesc+0x0C) est actif, binde la texture du
 * texobj = *(matdesc+0x14) via sub_41ED69.
 */
void __cdecl sub_41EF7A(int enable /*a1*/, _DWORD *matdesc /*a2*/, _DWORD *buffer /*a3*/)
{
    DWORD *device = (_DWORD *)buffer[197];        /* a3[197] = *(buffer+0x314) */ /*0x41EF89*/
    if (!matdesc || !device)                      /*0x41EF9A*/
        return;

    DWORD v17 = matdesc[3];                       /* *(matdesc+0x0C) mask */ /*0x41EF9A..*/
    if ((v17 & 0xFFFDFBFD) != 0)
    {
        if (v17 & 1)                              /* alpha-blend mode States 8 */
            SetState(device, 8, (matdesc[2] & 1) ? 2 : 3);              /*0x41EFC2..*/
        if (enable && (v17 & 2))                  /* texture path */
        {
            DWORD *texobj = (_DWORD *)matdesc[5]; /* texobj = *(matdesc+0x14) */ /*0x41F011*/
            if (texobj && (matdesc[2] & 2))
            {
                DWORD v9  = texobj[38];           /* *(texobj+0x98) = TIM/T data ptr */ /*0x41F038*/
                DWORD v10 = texobj[40];           /* *(texobj+0xA0) = upload/page list */ /*0x41F050*/
                BOOL  v12 = v10
                    ? (v10[7] ? (BYTE)*(DWORD*)(v10[8] + texobj[39]) & 1  /* +0x9C section/entree */
                              : (v9[2] != 0))
                    : (v9[2] != 0);
                SetState(device, 41, v12);        /* texture-palette/filter */ /*0x41F0D2*/
            }
            else
                SetState(device, 41, 0);                                /*0x41F0E4*/
            sub_41ED69(texobj, device);           /* <-- bind D3D reel (SetTexture stage 0) */ /*0x41F0FC*/
        }
        /* ... render states restants : 17/18 (Z), 4, 22 (CULL), 7/23, 14, 41, 27, 19/20,
           21, 15/25/24, 2, 28, 29, 9, 5, 6 — tous via call/device vt+88 ... */
    }
    /* second bloc (masque & 2 seul) 0x41F727..0x41F996 : meme bind texture
       via sub_41ED69(a1 path) @0x41F942 */
}
```

Notes ASM (indices) :
- Tout appel d'état indirect = `call dword ptr [edx+58h]` (vt+88) sur *(buffer+0x314) — wrapper, pas device D3D brut (vt D3D9 index 22 ne colle pas).
- Bind texture réel délégué : sub_41ED69 → (hot, FFGetBufferAddress()[763]!=0) sub_41EF3C(a1=texobj, a2=device) → `call [device+98h]` (0x41EF5D) avec *(texobj+0x0C) = texture D3D nine brute.
