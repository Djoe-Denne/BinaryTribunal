# BossTransition_Phase @ 0x559F30

- File demandée: `0x559F30` (fonction entière, plage 0x559F30–0x55A0FB, 459 octets)
- Instr: 150
- Mode: 1+V
- Verdict: CERTAIN — A==V après 4 corrections factuelles de V (rampe 64+190·t, flt_B69910=0.5, EAX résiduel, bornes runner) ; corps de phase unguarded du swirl BOSS
- Caller unique: `BattleTransition_RunBoss` **0x559E40–0x559F2C** (xref = site d'appel 0x559F01) ; garde `cmp edi,52h` @0x559F1C = borne 82, clamp t≤1.0 @0x559EE7
- Pack: `tools/_tmp_semantic_triple/0x559f30/` (asm.asm = ground truth ; hexrays.c extrait le 2026-09-19)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Valeurs des constantes extraites le 2026-09-19 (RPC lecture seule) : `flt_B69994`=190.0, `flt_B69990`=64.0 (→ rampe couleur 64..254), `dbl_B695D0`=0.5, `dbl_B695C0`=1.0 (→ scale = 1.0+0.5·t), `dbl_B69988`=π (→ sin(π·t), une demi-période), `dbl_B69980`=1/3, `flt_B69910`=0.5 (facteur constant)
- Stride `[list+0x44]`=0x80 **prouvé par le writer** : `Gfx_BindDrawListBackendCallbacks` 0x4162C6–CF `[list+44h]=[list+3Ch]<<5` avec `[list+3Ch]=4` (type 0xE > 7, 0x416294) → 4×0x20

## C réconcilié

Préambule : ground truth = live ASM (`asm.asm`) + labels IDA (`loc_559FFB`, `loc_55A01F`), Hex-Rays en vérificateur (extrait le 2026-09-19). Pas de jump table (`jpt_` absent). Sauvegardes : ebp (frame 0x1C), ebx/esi/edi. Retour non valorisé (EAX = retour incident de `Gfx_WalkDrawList`). `add esp,8` à 0x559F75 (AllocDrawListBatch) ; `add esp,24h` unique à 0x55A0F1 couvrant les 4 calls finaux (8+8+0Ch+8). Le x87 calcule en 80 bits ; le C matérialise l'ordre des opérations, pas le bit-exact.

```c
void __cdecl BossTransition_Phase(float phase /* [ebp+arg_4] : float À L'USAGE */,
                                  int   arg2  /* [ebp+arg_8] : int À L'USAGE   */)
{
    unsigned int color;   /* var_4 : 0xFF000000 | al<<16 | al<<8 | al */
    float scale, var_8, var_C, var_14, var_1C;
    float A, S, Vf, C, X, y1;         /* valeurs persistantes pile x87 */
    int   outer, inner;
    void *list;  unsigned char *cur;

    /* __ftol -> EAX, seul AL conservé (0x559F48..56) : gris al, alpha FF */
    { unsigned int al = (unsigned int)(phase * flt_B69994 + flt_B69990) & 0xFFu;
      color = 0xFF000000u | (al << 16) | (al << 8) | al; }

    list = BattleSwirl_GetSecondDrawList();          /* 0x559F5A -> esi */
    Gfx_AllocDrawListBatch(4, list);                 /* 0x559F62..64 ; add esp,8 */

    scale  = (float)((double)phase * dbl_B695D0 + dbl_B695C0); /* ..0x559F82 */
    var_14 = (float)screen_x;   var_8  = (float)screen_x * scale;
    var_1C = (float)screen_y;   C      = var_1C * scale;

    { double s = sin((double)phase * dbl_B69988);    /* fsin une fois, 0x559FAC */
      var_C = (float)((double)phase * s * (double)var_14 * dbl_B69980);
      outer = 2;                                     /* 0x559FB6 [var_14+4] */
      S     = (float)(s * (double)phase * (double)var_1C * dbl_B69980); }
    A  = (float)((double)dword_204DB30 - (double)S * flt_B69910
                 - ((double)C - (double)screen_y) * flt_B69910);
    Vf = var_C * flt_B69910;

    do {                                             /* loc_559FFB : 2 lignes */
        X = (float)((double)dword_204DB2C - (double)Vf
                    - ((double)var_8 - (double)screen_x) * flt_B69910);
        inner = 2;                    /* 0x55A001 RÉUTILISE [ebp+arg_4] (float arg écrasé) */
        y1    = A + C;                /* 0x55A01B..01D */

        do {                                         /* loc_55A01F : 2 colonnes */
            cur = *(unsigned char **)((unsigned char *)list + 0x74);
            /* 4 sommets de 0x20 octets à +0x00/+0x20/+0x40/+0x60 :
               x@+0 y@+4, +8=0x3AC49BA6, +0C=1.0f, +10=couleur, uv@+18/+1C */
            *(unsigned int *)(cur + 0x08) = 0x3AC49BA6u;  *(unsigned int *)(cur + 0x0C) = 0x3F800000u;
            *(float         *)(cur + 0x00) = X;           *(unsigned int *)(cur + 0x10) = color;
            *(unsigned int *)(cur + 0x18) = 0;            *(float         *)(cur + 0x04) = A;
            *(unsigned int *)(cur + 0x1C) = 0;

            *(float         *)(cur + 0x20) = X + var_8;   /* 0x55A045 fst, resservi v3 */
            *(unsigned int *)(cur + 0x28) = 0x3AC49BA6u;  *(unsigned int *)(cur + 0x2C) = 0x3F800000u;
            *(float         *)(cur + 0x24) = A;           *(unsigned int *)(cur + 0x30) = color;
            *(unsigned int *)(cur + 0x38) = 0x3F800000u;  *(unsigned int *)(cur + 0x3C) = 0;

            *(unsigned int *)(cur + 0x48) = 0x3AC49BA6u;  *(unsigned int *)(cur + 0x4C) = 0x3F800000u;
            *(float         *)(cur + 0x40) = X;           *(unsigned int *)(cur + 0x50) = color;
            *(unsigned int *)(cur + 0x58) = 0;            *(float         *)(cur + 0x44) = y1;
            *(unsigned int *)(cur + 0x5C) = 0x3F800000u;

            *(float         *)(cur + 0x60) = X + var_8;   *(float         *)(cur + 0x64) = y1;
            *(unsigned int *)(cur + 0x68) = 0x3AC49BA6u;  *(unsigned int *)(cur + 0x6C) = 0x3F800000u;
            *(unsigned int *)(cur + 0x70) = color;
            *(unsigned int *)(cur + 0x78) = 0x3F800000u;  *(unsigned int *)(cur + 0x7C) = 0x3F800000u;

            *(int *)((unsigned char *)list + 0x74) += *(int *)((unsigned char *)list + 0x44);
            X += var_C;                    /* 0x55A09F fadd var_C */
        } while (--inner != 0);            /* jnz loc_55A01F */
        A += S;                            /* 0x55A0B7 fadd st,st(2) */
    } while (--outer != 0);                /* jnz loc_559FFB */

    GfxDriver_SetBlendMode(1, arg2);        /* push edi; push 1 */
    GfxDriver_SelectRenderTarget(1, arg2);  /* push edi; push 1 */
    Gfx_SetRenderState(0xE, 1, arg2);       /* push edi; push 1; push 0Eh */
    Gfx_WalkDrawList(list, arg2);           /* push edi; push esi ; add esp,24h */
}
```

Externes `Gfx_*` / `BattleSwirl_*` : noms IDA du pack, rôles au-delà des notes de vague non prouvés depuis ce corps. Déclinaison complète (offsets sommet par sommet, adresses par ligne) : `tools/_tmp_semantic_triple/0x559f30/c_reconciled.c`.

## Preuves et validation parent

1. Couleur : `__ftol` (0x559F48) puis AL seul stocké 3× (`var_4+2/+1/+0`, 0x559F4D..53) et `var_4+3 = 0FFh` (0x559F56) → `0xFF000000 | al<<16 | al<<8 | al`, répliqué via `ecx` aux +0x10 des 4 sommets.
2. `push esi; push 4; call Gfx_AllocDrawListBatch` (0x559F61..64) puis `add esp,8` (0x559F75) : batch de 4, cdecl.
3. Compteurs : `[var_14+4] = 2` (0x559FB6, externe) et `[arg_4] = 2` (0x55A001, interne — écrase le float arg) → 2×2 = 4 quads, chaque itération avance `[esi+74h]` de `[esi+44h]` (0x55A094..97).
4. Sommets : curseur `[esi+74h]`, slots +0x00/+0x20/+0x40/+0x60, vertex 0x20 octets ; `ebx = 3AC49BA6h`, `edx = 3F800000h`, `edi = 0` (0x559F78..8E) donnent les motifs +8/+0C/+18/+1C = (const, 1.0, 0,0)/(const, 1.0, 1.0,0)/(const, 1.0, 0,1.0)/(const, 1.0, 1.0,1.0) — `edx` aux +38/+5C/+78/+7C, `edi` ailleurs (0x55A024..91).
5. Géométrie x87 : quad `(X,A),(X+var_8,A),(X,A+C),(X+var_8,A+C)` avec `var_8 = screen_x*scale`, `C = screen_y*scale` ; `X += var_C` par quad (0x55A09F), `A += S` par ligne (0x55A0B7) ; `fsin` calculé une fois (0x559FAC) et réutilisé aux deux axes.
6. Clôture : `push edi/push 1` ×2, `push edi/push 1/push 0Eh`, `push edi/push esi` (0x55A0CE..EC) puis un seul `add esp,24h` (0x55A0F1) = 8+8+0Ch+8 exact.
7. Retour non valorisé : dernier `call Gfx_WalkDrawList` (0x55A0EC) laisse EAX, `retn` nue à 0x55A0FA — contredit le type IDA `_DWORD *`.
- Risque: pas de garde locale des bornes 80/82 (déléguée au runner 0x559E40, note ASM 0x559F30) ; le stride `[esi+44h]` et la borne du batch sont des données runtime non vérifiables hors live.

## Divergences Hex-Rays

- **Hex-Rays extrait le 2026-09-19** : globalement conforme, mais bugué ligne 99
  (`v18` non initialisé, arguments `Gfx_WalkDrawList` trompeurs) — l'ASM donne
  `push edi; push esi` (0x55A0EA..EC) = `(list, driver)`. Le C réconcilié ci-dessus
  fait foi.
- Divergences métadonnées IDA vs ASM (2, détail dans `reconcile_notes.md`) : (1) prototype `'_DWORD *__cdecl(int, float, int)'` vs usage réel `arg_4` = float (`fld`), `arg_8` = int, `arg_C` jamais lu ; (2) type de retour déclaré vs EAX non valorisé (résiduel `Gfx_WalkDrawList`, non lu par le runner 0x559F06→0x559F10).
- Pièges §8 applicables : largeur AL du `__ftol` respectée ; noms `GfxDriver_*`/`Gfx_*` issus des notes de vague (récités, non prouvés localement) ; pas de table d'enums pour `Gfx_SetRenderState` — type 0xE passé brut.

## Validation V (2026-09-19)

- Verdict : CERTAIN. 4 corrections factuelles vs analyse A (rampe couleur
  **64+190·t** et non 0..255 ; `flt_B69910` = 0.5 littéral ; EAX final = résiduel
  `Gfx_WalkDrawList` et non 0 ; bornes du runner levées — fonction 0x559E40–0x559F2C,
  xref unique). Détail : `semantic_v.md` du pack.
- Nom : `BossTransition_Phase` confirmé (xref unique du runner + machine swirl :
  GetSecondDrawList, 4 quads sin(π·t)) ; raffinement markdown accepté :
  `BossTransition_Phase_RenderSwirlQuads`.
