# sub_4623A0 (GpuPrimDispatch[0x02] opaque — GP0 FillRect VRAM) @ 0x4623A0

- Instr (live): 50 (0x4623A0–0x462467)
- Rôle IDA: sans nom (`sub_4623A0`), entrée 0x02 de `g_GpuPrimDispatchOpaque` (0xB7CF08)
- Source: disasm live IDB FF8_EN.exe base 0x400000 — pas de Hex-Rays exploitable (fn non typée)
- Contexte lot 15 (closure ciel/fond battle)

## Rôle prouvé

GP0 **0x02 FillRect** de l'émulation GPU : remplit la VRAM PSX émulée **0x1B47818** (stride ligne 0x800 = 1024 halfwords) avec une couleur 16 bpp reconstituée du paquet. **Ce n'est pas un draw driver** : aucune émission Gfx/driver, aucune vertex. Tout l'effet reste confiné à la VRAM source de textures/framebuffer PSX.

## C réconcilié

```c
/* sub_4623A0 @ 0x4623A0 — ground truth = live ASM (disasm 0x4623A0..0x462467)
 * cdecl, arg_0 = paquet PSX (GP0 fill). 50 instr, retn C3.
 * Appelé uniquement via g_GpuPrimDispatchOpaque[0x02] (0xB7CF08+8)
 *   — i.e. pendant la re-émission Gpu_DrawOTag (dword_B7CC24 != 0)
 *   — ou via sub_45B3B0 (packet[7] & 0xFD == 0x02).
 */
void __cdecl GpuPrimDispatch02_FillRectVRAM(const unsigned char *pkt)
{
    /* couleur : [pkt+4]=R&0xF8, [pkt+5]=G&0xF8, [pkt+6]=B&0xF8 (bit STP |1 du bas masqué) */
    unsigned int color = (((pkt[6] & 0xF8u) << 5) | ((pkt[5] & 0xF8u) << 2)
                          | (pkt[4] >> 3)) & 0x7FFFu;
    unsigned int color2 = color | (color << 16);           /* 4623ce shl eax,10h / or ebx,eax */

    short w = *(const short *)(pkt + 8);                    /* 4623c7 mov dx,[ecx+8]  */
    short h = *(const short *)(pkt + 0xA);                  /* 4623df mov si,[ecx+0Ah]*/
    short x = *(const short *)(pkt + 0xC);                  /* 4623f4 mov bp,[ecx+0Ch]*/
    short y = *(const short *)(pkt + 0xE);                  /* 462409 movsx edi,[ecx+0Eh] */

    if (w < 640) return;                                    /* 4623d3 cmp dx,280h / jl exit */
    if (h < 240) return;                                    /* 4623e3 cmp si,0F0h  / jl exit */
    if (x < 0 || y < 0) return;                             /* 4623ea/4623ef test dx/si */
    if (x + w > 1024) return;                               /* 462401 cmp edi,400h / jg exit */
    if (y + h > 512)  return;                               /* 462413 cmp esi,200h / jg exit */

    unsigned short *dst = (unsigned short *)(0x1B47818 + 2u * (y * 1024 + x)); /* 46241b shl ecx,0Ah ; 462422 lea esi,1B47818[ecx*2] */
    unsigned int  *dst32 = (unsigned int *)dst;             /* mot double = couleur 2x */
    int left_odd  = x & 1;                                  /* 462436 and ebp,1 */
    unsigned int  n32  = w >> 1;                            /* 46242b..462434 abs(y)?? y>=0 requis: cdq/sub/sar1 = y>>... en fait y est edi déjà signé; n32 dérive de w/2 */

    for (int row = 0; row < h; ++row) {                     /* 462452..462461 boucle lignes */
        if (left_odd) {                                     /* 46244a test bp,bp */
            *dst = (unsigned short)color;                   /* 46244f mov [eax],bx */
            dst32 = (unsigned int *)(dst + 1);
        }
        for (unsigned int i = 0; i < n32; ++i)              /* 462443 rep stosd */
            dst32[i] = color2;
        dst = (unsigned short *)((char *)dst + 0x800);      /* 462456 add esi,800h */
    }
}
```

Notes de fidélité :
- Les gardes `cmp dx,280h` / `cmp si,0F0h` sont `jl` **signé** (saute au `exit` si plus petit) : le fill ne s'exécute que si **w >= 640 et h >= 240** — dimensionné pour couvrir la zone framebuffer PSX (battle = 640×480/640×240), pas pour les petits fills.
- Bornes : `x+w <= 0x400` (1024) et `y+h <= 0x200` (512) — VRAM PSX standard.
- Couleur 16 bpp : 5 bits/canal, `and 0FFFFFFF8h/0F8h`, reconstituée via `shl 5`/`shl 2` (4623af–4623c5), doublée en `shl eax,10h / or` pour le `rep stosd`.
- Écriture dans `ds:1B47818h[ecx*2]` avec `add esi,800h` par ligne = **VRAM émulée 1024 halfwords de stride** (xrefs lecteurs : 0x45B481 `Gfx_InitTexturePageDrawLists(unk_1B47818)`, uploads 0x45B944/0x45BEE9/0x45C609, TPDirty 0x463BDA/0x463D5C, blits SW 0x467397/0x46749C).

## Preuves ASM (sélection)

1. `4623a9/4623ac mov bl,[ecx+6] / mov al,[ecx+5]` + `and 0FFFFFFF8h/0F8h` — extraction couleur GP0.
2. `4623c7 mov dx,[ecx+8]` puis `4623d3 cmp dx,280h / jl loc_462463` — garde w>=640 (signé).
3. `4623df mov si,[ecx+0Ah]` puis `4623e3 cmp si,0F0h / jl` — garde h>=240.
4. `462401 cmp edi,400h / jg` et `462413 cmp esi,200h / jg` — bornes VRAM 1024×512.
5. `46241b shl ecx,0Ah` / `462422 lea esi,ds:1B47818h[ecx*2]` — base VRAM, index halfword.
6. `462443 rep stosd` + `462456 add esi,800h` — remplissage 32-bit, stride 1024 halfwords/ligne.

## Conséquence capture

Le handler n'émet **aucun** appel driver (pas de `Gfx_*`, pas de slot 43–64). Le fond uni qu'il peint n'existe que dans la VRAM émulée ; il n'est visible à l'écran que si un chemin VRAM→RT/écran (non wrappé) le présente. C'est l'un des constituant du verdict closure ciel/fond (voir `driver-passthrough/CLOSURE_sky-path.md`).
