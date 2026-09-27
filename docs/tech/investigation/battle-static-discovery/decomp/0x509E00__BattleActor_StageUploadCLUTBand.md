# sub_509E00 — BattleActor_StageUploadCLUTBand @ 0x509E00

- Instr (live): ~120 (0x509E00..0x509EF8)
- Palier: high
- Push IDB: non (lecture seule)
- IDA type: `char *__cdecl sub_509E00(int a1_actorPtr, __int16 a2_flags)`
- Notes parent: lecteur de byte_1D98B60 + écrivain de la bande CLUT système des entités battle
  (question 4 de la closure). Ferme le lien ids{0,2,4} footer ND08 ↔ région 0x1DA0-0x1E02.

## C réconcilié

```c
/* sub_509E00 @ 0x509E00
 * Ground truth = live ASM + Hex-Rays relué (divergence aucune sur les offsets cités).
 * extern: g_BattlePresentationActors (table acteurs, stride 0x9C=156),
 *         g_BattlePacketCursor, off_B8BA38 (rect {x,y,w,h} bande CLUT),
 *         byte_1D98B60 (6 slots × 0x200 staging), GF_AlternativeTexture_pointTo0C (0x505DF0),
 *         Fixed_Sin4096_Q12 (sin Q12).
 * Branches : a2 & 0x10 = flash blanc (moyenne canaux), a2 & 0x400 = assombrissement sinusoïdal,
 * sinon = upload brute de la bande acteur.
 */

char *__cdecl sub_509E00(int a1_actorPtr, __int16 a2_flags)
{
    _WORD *out = (_WORD *)g_BattlePacketCursor;                     /* @0x509E08 */

    if ((a2_flags & 0x10) != 0) {                                   /* flash blanc */
        int v4 = (a1_actorPtr - (int)g_BattlePresentationActors) / 156;  /* @0x509E38 : id acteur g */
        unsigned short *band = (unsigned short *)((char *)&byte_1D98B60 + 1024 * v4); /* @0x509E3F */
        for (int i = 0; i < 512; ++i) {                             /* @0x509E91 : 512 u16 = 1024 B */
            unsigned short e = *band++;
            int g = ((e & 0x1F) + ((e >> 10) & 0x1F) + 2 * ((e >> 5) & 0x1F)) / 5 + 5; /* @0x509E76 */
            *out++ = (unsigned short)(g | (32 * (g | (32 * (g | 0xFFE0)))));           /* @0x509E8D */
        }
        /* @0x509EA5 : *(u16*)g_BattlePacketCursor = 0 ; @0x509EAA : HIWORD(off_B8BA38) = 2*g + 224
         * @0x509EB1 : *(u16*)(cursor+512) = 0 */
        HIWORD(off_B8BA38) = (unsigned short)(2 * v4 + 224);
        GF_AlternativeTexture_pointTo0C(&off_B8BA38, v15);          /* @0x509EBA : ring type-0 */
        g_BattlePacketCursor = (int)out;
    }
    else if ((a2_flags & 0x400) != 0) {                             /* assombrissement sin */
        int v17 = (a1_actorPtr - (int)g_BattlePresentationActors) / 156; /* @0x509EFA */
        unsigned short *band = (unsigned short *)((char *)&byte_1D98B60 + 1024 * v17); /* @0x509F01 */
        for (int i = 0; i < 512; ++i) {                             /* @0x509F75 */
            int s = (((band[0] & 0x1F) + ((band[0] >> 10) & 0x1F) + 2 * ((band[0] >> 5) & 0x1F)) << 12) / 124;
            *out++ = 32 * (((25 * s) >> 12) | (32 * (((int)(10 * Fixed_Sin4096_Q12(s / 2)) >> 12) | 0xFFE0)));
            ++band;                                                 /* @0x509F71 */
        }
        HIWORD(off_B8BA38) = (unsigned short)(2 * v17 + 224);       /* @0x509F92 */
        GF_AlternativeTexture_pointTo0C(&off_B8BA38, v16);          /* @0x509FA2 */
        g_BattlePacketCursor = (int)out;
    }
    else {                                                          /* upload brute */
        int v14 = (a1_actorPtr - (int)g_BattlePresentationActors) / 156; /* @0x509FCC */
        HIWORD(off_B8BA38) = (unsigned short)(2 * v14 + 224);       /* @0x509FDE : y VRAM = 0xE0 + 2g */
        return GF_AlternativeTexture_pointTo0C(&off_B8BA38,
                                               (int)&byte_1D98B60 + 1024 * v14); /* @0x509FEB */
    }
    return result;
}
```

## Lecture structurale (preuves EA)

| Fait | Preuve |
|---|---|
| id acteur g = (ptr - g_BattlePresentationActors) / 156 | @0x509E38 / @0x509EFA / @0x509FCC |
| bande acteur = byte_1D98B60 + 1024*g (2 palettes de 512 B) | @0x509E3F / @0x509F01 / @0x509FEB |
| rangée VRAM palette = 0xE0 + 2g (et 0xE1 + 2g pour la 2e) | HIWORD(off_B8BA38) = 224+2g @0x509EAA/0x509F92/0x509FDE |
| rect statique {x=0, y=0xE0, w=0x100 halfwords, h=2 rangées} | get_bytes 0xB8BA38 : `00 00 E0 00 00 01 02 00` |
| upload = ring 32×16B type-0 → BattleTimQueue_FlushToVram (0x505D20) case 0 → copyblockToVRAM(rect, ptr) | 0x505DF0 (pointTo0C : slot {type=0, rect[0], rect[1], ptr}) + 0x505D47 |
| copyblockToVRAM écrit le miroir 0x1B47818 + 2*(x + y*1024), stride 0x800 | 0x45BD61 / 0x45BD8B / tex_vram_rectangle @0x45BDBA |

## Lien ids{0,2,4} (footer ND08) ↔ bande système

- sub_507400 @0x50749B : CLUT VRAM y := 0xE0 + slot ; stage slot s → byte_1D98B60 + s*0x200 (@0x5074AE).
- sub_509E00 : acteur g lit byte_1D98B60 + 1024*g = slots (2g, 2g+1) et uploade aux rangées 0xE0+2g, 0xE0+2g+1.
- **Donc id du footer = numéro de slot : palette bytes = byte_1D98B60 + id*0x200, rangée VRAM = 0xE0 + id.
  ids {0,2,4} = premier slot des acteurs 0,1,2** (Δ fixe = 2 slots = 0x400 octets entre acteurs).
- Ref CLUT dans les primitives (patchée par 0x507550, consommée par sub_45B920 @0x45B94A) :
  `clut_word = (y << 6) | (x >> 4)` avec y = 0xE0+id, x = 0 → `((0xE0+id) << 6)`.
