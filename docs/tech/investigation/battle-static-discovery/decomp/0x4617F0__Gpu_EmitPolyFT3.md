# Gpu_EmitPolyFT3 @ 0x4617F0

- File demandée: `0x461800`; correction parent: l'EA est dans le prologue. Début IDA live `0x4617F0`, fin `0x461A2A`.
- Instr: 161
- Mode: 1+V local (analyse aveugle puis relecture adversariale ré-dérivée de l'ASM)
- Verdict: CERTAIN — sélectionne/réserve une draw-list texturée et convertit un paquet PS1 `POLY_FT3` en trois sommets PC de stride 0x20
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## Analyse A

Le paquet fournit `RGB/code`, trois XY signés, trois UV, un CLUT et un TPage. `sub_461A30` sélectionne la liste par `(code,tpage,clut)`, réserve une primitive et retourne un octet de page. La fonction choisit un convertisseur de couleur, initialise Z/RHW, remplit UV, couleur et XY pour trois sommets, puis écrit l'octet de page dans le troisième flux sauf en mode 2.

## Vérification V adversariale

1. `0x461800` n'est pas l'entrée: le premier argument est chargé à `4617fd`; l'appel de sélection commence à `461812`.
2. Ordre exact: `sub_461A30(code, packet->tpage@+0x16, packet->clut@+0x0E, &page_byte)`. Inverser TPage/CLUT contredit les pushes.
3. Index convertisseur couleur = `2*dword_1CA8884 + ((code>>1)&1)`, pas le code complet. Table live: `460D30,460E60,460D30,460D30,460D30,460E80,460D30,460EF0`.
4. `code bit0` force seulement RGB à `0xFFFFFF`; l'octet haut issu du convertisseur est conservé.
5. Les UV ont deux chemins distincts: multiplication directe par deux scales si `dword_1CA8848!=0`, sinon lookup dword `dword_1CA9EB0[uv]`.

## C réconcilié (structure fidèle)

```c
typedef struct GpuVertex20 {
    float x, y, z, rhw;          /* +0x00..+0x0C */
    unsigned int color;          /* +0x10 */
    unsigned int field_14;
    float u, v;                  /* +0x18/+0x1C */
} GpuVertex20;

unsigned char __cdecl Gpu_EmitPolyFT3(const unsigned char *p)
{
    unsigned int page_byte;
    unsigned char *list = (unsigned char *)sub_461A30(
        p[7], *(const unsigned short *)(p + 0x16),
        *(const unsigned short *)(p + 0x0E), &page_byte);
    if (!list)
        return 0;

    unsigned int index = 2 * dword_1CA8884 + ((p[7] >> 1) & 1);
    unsigned int color = funcs_461842[index](p + 4);
    GpuVertex20 *v = *(GpuVertex20 **)(list + 0x74);
    sub_461220((float *)v); /* Z/RHW x3 */

    for (int i = 0; i < 3; ++i) {
        unsigned int uv_off = 0x0C + i * 8;
        unsigned int xy_off = 0x08 + i * 8;
        unsigned char u = p[uv_off + 0];
        unsigned char vv = p[uv_off + 1];

        if (dword_1CA8848) {
            v[i].u = (float)u * g_UScale;
            v[i].v = (float)vv * g_VScale;
        } else {
            *(unsigned int *)&v[i].u = dword_1CA9EB0[u];
            *(unsigned int *)&v[i].v = dword_1CA9EB0[vv];
        }

        v[i].color = (p[7] & 1) ? ((color & 0xFF000000u) | 0x00FFFFFFu)
                                      : color;
        v[i].x = (float)*(const short *)(p + xy_off + 0) * g_ScaleX + g_OffsetX;
        v[i].y = (float)*(const short *)(p + xy_off + 2) * g_ScaleY + g_OffsetY;
    }

    if (dword_1B4780C != 2) {
        **(unsigned char **)(list + 0x7C) = (unsigned char)page_byte;
        *(unsigned int *)(list + 0x80) = page_byte;
        return (unsigned char)page_byte;
    }
    return 2; /* AL résiduel du test de mode */
}
```

## Preuves ASM

1. `461804 mov cx,[esi+0Eh]`, `461808 mov dx,[esi+16h]`, pushes out/CLUT/TPage/code — contrat exact de sélection.
2. `46181e jz 461A24` — aucune écriture si la sélection retourne NULL.
3. `46182d shr ecx,1` / `and ecx,1` / `lea eax,[ecx+edx*2]` — index table couleur exact.
4. `461844 mov edi,[ebp+74h]` — début de réservation de sommets; offsets couleurs `+0x10/+0x30/+0x50` prouvent stride 0x20.
5. UV source `+0x0C/+0x0D`, `+0x14/+0x15`, `+0x1C/+0x1D`; destination `+0x18/+0x1C`, `+0x38/+0x3C`, `+0x58/+0x5C`.
6. `461947 test byte ptr [esi+7],1`; séquence `LOWORD=FFFF`, `BYTE2=FF` — RGB blanc, octet haut préservé.
7. XY `movsx word ptr` aux offsets `+8/+A`, `+10/+12`, `+18/+1A`, transformés par les mêmes scales/offsets que F3.
8. `4619cc mov al,dword_1B4780C` / `cmp ...,2`; si différent, écrit `page_byte` via `list+0x7C` et dans `list+0x80`.

## Validation parent

- Callees directs: `sub_461A30`, `sub_461220`; convertisseur couleur indirect vérifié par table live.
- Callers statiques absents: callback de dispatch GPU, attendu.
- Largeur retour: AL seulement selon prototype IDA; valeur non consommée par le dispatch.
- Nom: layout paquet FT3 + trois sommets texturés + CLUT/TPage fournissent plus de deux preuves indépendantes.
