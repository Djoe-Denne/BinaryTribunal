# sub_45BC60 — Gpu_SetTextureWindow_PageRectScales @ 0x45BC60

- Instr (live): voir disasm (fenêtre 0x45BC60..0x45BD2C), taille ~0xCC
- Palier: high
- Push IDB: non (lecture seule)
- IDA type: `int __cdecl sub_45BC60(int pkt)`
- Notes parent: pivot UV de la chaîne battle — décode le word « texture window » du packet
  et alimente la rect page consommée par Gfx_SelectTexturePageDrawList / Gfx_AllocTexturePageSlot.

## C réconcilié

```c
/* sub_45BC60 @ 0x45BC60
 * Ground truth = live ASM + Hex-Rays relué contre l'ASM (aucune divergence de fond relevée).
 * 1 arg cdecl (packet GPU). Callers (2) : 0x462EC5 et 0x463225 — handlers de dispatch
 * de la zone Gpu (traitement du packet texture-window/DR_TPAGE du stream).
 *
 * Effet : dword_1CA8848 (latch 24 bits) != 0 après cet appel → les émetteurs de polygones
 * (Gpu_EmitPolyFT3 @0x461853, Gpu_EmitPolyFT4 @0x461AF4, sub_461E00 @0x461E55, sub_462030
 * @0x46208F) passent par le chemin MULTIPLY u8*scale au lieu de la LUT.
 */

extern unsigned int dword_1CA8848;   /* latch window word (24 bits) */
extern unsigned int dword_1CA8870;   /* LOWORD = x page, HIWORD = y page (u16/u16) */
extern unsigned short word_1CA8874;  /* W page (texels) */
extern unsigned short word_1CA8876;  /* H page (texels) */

int __cdecl sub_45BC60(int pkt)
{
    unsigned int v = *(unsigned int *)(pkt + 4);          /* @0x45BC65 : word window */

    dword_1CA8848 = v & 0xFFFFFFu;                        /* @0x45BC74 : latch 24 bits */

    unsigned int y = (v >> 12) & 0xF8u;                   /* @0x45BC8A/9B : bits 15..19 *8 → HIWORD */
    unsigned int x = (v >> 7)  & 0xF8u;                   /* @0x45BC90/B1 : bits 10..14 *8 → LOWORD */
    unsigned short h = (unsigned short)(-(v >> 2) & 0xF8);/* @0x45BCA4/BB : 256 - (bits 5..9)*8 → word_1CA8876 */
    unsigned short w = (unsigned short)(-(unsigned char)(v * 8)); /* @0x45BCAC/C2 : 256 - (bits 0..4)*8 → word_1CA8874 */

    if (h == 0) { h = 256; word_1CA8876 = 256; }          /* @0x45BCC8-CE */
    if (w == 0) { w = 256; word_1CA8874 = 256; }          /* @0x45BCD8-DE */

    if ((short)y + (short)h > 256)                        /* @0x45BCF4 : clamp bas */
        word_1CA8876 = (unsigned short)(256 - y);         /* @0x45BCFD */
    if ((short)x + (short)w > 256)                        /* @0x45BD0A-12 : clamp droite */
        word_1CA8874 = (unsigned short)(256 - x);         /* @0x45BD20 */
    return 0;
}
```

## Conséquence UV (formule finale du moteur)

- `Gfx_AllocTexturePageSlot` @0x464F70 stocke `slot[+0x18] = 1.0f/W`, `slot[+0x1C] = 1.0f/H`
  (fild w / fdivr 1.0 @0xB69544) pour la rect (x,y,W,H) ci-dessus.
- `Gfx_SelectTexturePageDrawList` @0x465FC5/0x465FCB copie ces floats vers
  `dword_1CB603C` (=1/W, U) et `dword_1CB6038` (=1/H, V).
- `Gpu_EmitPolyFT3/FT4` (ASM live @0x461891-0x4618E4 / fenêtre FT4) :
  `U = (float)u8 * dword_1CB603C` → vert+0x18/0x38/0x58 ; `V = (float)v8 * dword_1CB6038` → vert+0x1C/0x3C/0x5C.
- Si latch == 0 (pas de window packet) : fallback LUT `dword_1CA9EB0[u8]` = clamp(u8,1,254)/256
  (init @0x460BB1 : LUT[0]=0x3B800000=1/256, step flt_B695FC=0x3B800000=1/256, LUT[255]=0x3F7E0000=254/256).

**Aucun offset de page n'est ajouté aux UV** : l'origine (x,y) de la fenêtre sert au blit VRAM
(`TexStaging_BlitRows` dst = base + ((y<<10) + ((tpage&0xF)<<6) + (x>>(2-mode)))*2, @0x465000
dans Gfx_AllocTexturePageSlot) et à la sélection de texture (slot par mode+txbase), pas à U/V.
