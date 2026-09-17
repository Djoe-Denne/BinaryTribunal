# Gpu_EmitPolyF3 @ 0x460F20

- File demandée: `0x460F30`; correction parent: l'EA est intérieure à la fonction. IDA live donne le vrai début `0x460F20`, fin `0x460FF9`.
- Instr (live): 60
- Mode: 1+P (≤80 instructions, ré-derivation parent ASM live)
- Verdict: CERTAIN — réserve une entrée draw-list, initialise trois sommets PC de stride 0x20 depuis un paquet PS1 `POLY_F3`, duplique la couleur et transforme les XY signés
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database sur le début réel `0x460F20`

## Contrat

```c
int __cdecl Gpu_EmitPolyF3(const unsigned char *packet);
```

- Entrée: paquet PS1 `POLY_F3`: RGB/code à `+0x04`, trois couples `s16 x,y` à `+0x08/+0x0C/+0x10`.
- Sortie sémantique: trois sommets de 0x20 octets dans le flux courant de la draw-list sélectionnée par `packet[7]`.
- EAX résiduel: `sign_extend(packet->x2)`. Les dispatchers l'utilisent comme callback d'émission et ignorent cette valeur; ce n'est pas un statut.

## C réconcilié

```c
typedef struct GpuVertex20 {
    float x;             /* +0x00 */
    float y;             /* +0x04 */
    float z;             /* +0x08, initialisé par sub_461220 */
    float rhw;           /* +0x0C, initialisé par sub_461220 */
    unsigned int color;  /* +0x10 */
    unsigned int rest[3];
} GpuVertex20;

int __cdecl Gpu_EmitPolyF3(const unsigned char *packet)
{
    unsigned int code = packet[7];
    unsigned char *draw_list = (unsigned char *)sub_4610C0(code);
    unsigned int color = sub_461000(packet + 4);
    GpuVertex20 *v = *(GpuVertex20 **)(draw_list + 0x74);

    sub_461220((float *)v);

    v[0].color = color;
    v[1].color = color;
    v[2].color = color;

    v[0].x = (float)*(const short *)(packet + 0x08) * g_ScaleX + g_OffsetX;
    v[0].y = (float)*(const short *)(packet + 0x0A) * g_ScaleY + g_OffsetY;
    v[1].x = (float)*(const short *)(packet + 0x0C) * g_ScaleX + g_OffsetX;
    v[1].y = (float)*(const short *)(packet + 0x0E) * g_ScaleY + g_OffsetY;
    v[2].x = (float)*(const short *)(packet + 0x10) * g_ScaleX + g_OffsetX;
    v[2].y = (float)*(const short *)(packet + 0x12) * g_ScaleY + g_OffsetY;

    return *(const short *)(packet + 0x10); /* EAX résiduel */
}
```

`g_ScaleX/g_ScaleY/g_OffsetX/g_OffsetY` correspondent aux globals live `dword_B7CC00`, `dword_B7CC04`, `flt_1CA89E0`, `flt_1CA89E4`.

## Preuves ASM (live)

1. `460f20 push ebx` / `460f21 push esi` / `460f22 push edi` / `460f23 mov edi,[esp+10h]` — début réel et unique argument cdecl. `0x460F30` tombe dans l'encodage du `call sub_4610C0` commencé à `460f2d`.
2. `460f29 mov al,[edi+7]` / `460f2d call sub_4610C0` — sélection/réservation draw-list par code primitive. Le callee appelle `Gfx_SelectTexturePageDrawList(code,0,0,0,0,0)` puis `Gfx_ReserveDrawListEntries(1,list)`.
3. `460f32 lea ecx,[edi+4]` / `460f38 call sub_461000` — conversion du RGB/code du paquet vers la couleur sommet PC.
4. `460f3d mov esi,[esi+74h]` — récupération du début de réservation publié par `Gfx_ReserveDrawListEntries`.
5. `460f43 call sub_461220` — initialisation commune des composantes profondeur/rhw des trois sommets aux offsets `+0x08/+0x0C`, `+0x28/+0x2C`, `+0x48/+0x4C`.
6. `460f65 mov [esi+10h],ebx`, `460f80 mov [esi+30h],ebx`, `460f97 mov [esi+50h],ebx` — couleur identique sur trois sommets, stride exact 0x20.
7. Six `movsx ... word ptr [edi+08h..12h]` — coordonnées XY signées 16 bits, trois sommets.
8. Les paires `fmul dword_B7CC00/B7CC04` puis `fadd flt_1CA89E0/1CA89E4` écrivent X/Y aux offsets `0/4`, `0x20/0x24`, `0x40/0x44`.
9. Après `460f83 movsx eax,word ptr [edi+10h]`, aucune instruction entière ne remplace EAX avant `retn`: retour résiduel 32 bits = x2 signé.

## Validation parent

- Callees confirmés: `sub_4610C0`, `sub_461000`, `sub_461220`.
- Strides développés: sommet 0x20; couleurs +0x10/+0x30/+0x50; XY +0x00/+0x20/+0x40.
- Polarité: aucune branche conditionnelle dans l'émetteur.
- Callers statiques absents: cohérent avec le dispatch indirect des émetteurs GPU; ne pas conclure « dead code ».
- Nom justifié par le layout exact PS1 `POLY_F3` et l'émission de trois sommets non texturés.
