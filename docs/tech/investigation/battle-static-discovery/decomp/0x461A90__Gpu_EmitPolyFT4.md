# Gpu_EmitPolyFT4 @ 0x461A90

- Instr: 243
- Mode: 2+1 local — analyse A, contre-analyse B indépendante, réconciliation parent ASM
- Verdict: CERTAIN — convertit un paquet PS1 `POLY_FT4` en quatre sommets texturés PC de stride 0x20, avec correction UV conditionnelle pour rectangle semi-transparent
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## Analyse A

Même famille que FT3: sélection `(code,TPage,CLUT)`, réservation d'une primitive, conversion couleur par table, initialisation profondeur/rhw, deux chemins UV, duplication de couleur, transformation des quatre XY et émission d'un octet de page dans le flux auxiliaire.

## Contre-analyse B

1. FT4 utilise `sub_461460`, pas `sub_461220`: quatre groupes Z/RHW sont initialisés.
2. Les sommets suivent les offsets paquet `XY/UV`: `(8,12)`, `(16,20)`, `(24,28)`, `(32,36)`; stride destination 0x20.
3. Le chemin lookup contient une correction absente de FT3. Elle exige `code&2`, un quad axis-aligné selon quatre égalités XY, puis une topologie UV exacte. Si les quatre V concordent comme rectangle, les bords U/V sont décalés d'un texel avant lookup.
4. Cette correction n'est pas un clamp générique et ne s'applique pas au chemin UV multiplié (`dword_1CA8848!=0`).
5. Le bit 0 du code force RGB blanc en conservant l'octet haut de couleur, comme FT3.

## C réconcilié (condensé fidèle)

```c
unsigned char __cdecl Gpu_EmitPolyFT4(const unsigned char *p)
{
    unsigned int page_byte;
    unsigned char *list = (unsigned char *)sub_461A30(
        p[7], *(const unsigned short *)(p + 0x16),
        *(const unsigned short *)(p + 0x0E), &page_byte);
    if (!list)
        return 0;

    unsigned int color_index = 2 * dword_1CA8884 + ((p[7] >> 1) & 1);
    unsigned int color = funcs_461842[color_index](p + 4);
    GpuVertex20 *v = *(GpuVertex20 **)(list + 0x74);
    sub_461460((float *)v); /* Z/RHW x4 */

    unsigned char u[4] = { p[12], p[20], p[28], p[36] };
    unsigned char t[4] = { p[13], p[21], p[29], p[37] };

    if (!dword_1CA8848) {
        int rectangle = (p[7] & 2)
          && *(const short *)(p+8)  == *(const short *)(p+24)
          && *(const short *)(p+16) == *(const short *)(p+32)
          && *(const short *)(p+10) == *(const short *)(p+18)
          && *(const short *)(p+26) == *(const short *)(p+34)
          && u[0] == u[2] && u[1] == u[3] && t[0] == t[1];

        if (rectangle && t[2] == t[3]) {
            ++u[0]; --u[1]; ++u[2]; --u[3];
            ++t[0]; ++t[1]; --t[2]; --t[3];
        }
    }

    for (int i = 0; i < 4; ++i) {
        if (dword_1CA8848) {
            v[i].u = (float)u[i] * g_UScale;
            v[i].v = (float)t[i] * g_VScale;
        } else {
            *(unsigned int *)&v[i].u = dword_1CA9EB0[u[i]];
            *(unsigned int *)&v[i].v = dword_1CA9EB0[t[i]];
        }

        unsigned int xy = 8 + i * 8;
        v[i].color = (p[7] & 1) ? ((color & 0xFF000000u) | 0x00FFFFFFu)
                                      : color;
        v[i].x = (float)*(const short *)(p + xy)     * g_ScaleX + g_OffsetX;
        v[i].y = (float)*(const short *)(p + xy + 2) * g_ScaleY + g_OffsetY;
    }

    if (dword_1B4780C != 2) {
        **(unsigned char **)(list + 0x7C) = (unsigned char)page_byte;
        *(unsigned int *)(list + 0x80) = page_byte;
        return (unsigned char)page_byte;
    }
    return 2;
}
```

`GpuVertex20` garde le layout confirmé par FT3: XY/Z/RHW `+0x00..0x0C`, couleur `+0x10`, UV `+0x18/+0x1C`, stride 0x20.

## Preuves ASM

1. `461a94..461ab2`: pushes `&page_byte`, CLUT `+0x0E`, TPage `+0x16`, code `+7`, puis `sub_461A30`.
2. `461ac2 jz 461DED` — sortie immédiate si aucune liste.
3. `461ad7 lea eax,[ecx+edx*2]` / table `funcs_461842` — même sélection couleur vérifiée que FT3.
4. `461ae7 mov edi,[ebx+74h]` / `461aef call sub_461460` — flux réservé et initialisation quatre sommets.
5. Destinations UV `+0x18/+0x1C`, `+0x38/+0x3C`, `+0x58/+0x5C`, `+0x78/+0x7C` — quatre sommets stride 0x20.
6. Bloc `461bea–461c62`: test `code&2`, égalités XY/UV, puis ajustements `+1/-1`; aucune branche équivalente dans le chemin direct.
7. Couleurs écrites `+0x10/+0x30/+0x50/+0x70`; `code&1` force les trois octets bas à FF.
8. XY signés lus aux huit mots `+8..+0x22`, transformés et écrits `+0/+4`, `+0x20/+0x24`, `+0x40/+0x44`, `+0x60/+0x64`.
9. `461d3b cmp dword_1B4780C,2`; si différent, `461de1` écrit l'octet via `list+0x7C`, `461de7` met à jour `list+0x80`.

## Validation parent

- Callees directs: `sub_461A30`, `sub_461460`; dispatch couleur indirect vérifié.
- Strides: paquet 8 octets par sommet; destination 0x20; toutes les adresses développées.
- Callers statiques absents: émetteur atteint par table de dispatch GPU.
- Retour: AL résiduel/page, ignoré par le dispatcher; pas un booléen de succès.
- Risque: la finalité visuelle exacte du décalage UV d'un texel reste une inférence (« anti-seam rectangle »); les conditions et mutations sont certaines.
