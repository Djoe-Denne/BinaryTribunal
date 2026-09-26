# decomp — sub_407EB4 (resolve palette → texobj engine)

## En-tête
| | |
|---|---|
| EA | `0x407EB4`, size `0x46D`, retn `0x408320` |
| Type IDA | `int __cdecl sub_407EB4(int a1, int a2)` (idx palette, wrapper « palette-dev entry ») |
| Instr (live) | 651 (reconstruct complet par fenêtres paginées ; delegue la partie carrieres d'un sub-GFX @0x41DF96) |
| Palier | lot 15 |
| ACCÈS | 15 callers statiques (`xrefs_to(0x407EB4)` — cf. pack `/asm_407EB4_pack`) |

## C réconcilié (corps, simples environ OK)

> Preamble : ground truth = asm live (fenêtres paginées récupérées ce run via les re-paginés
> @[`0x407eb4..0x408320`]), Hex-Rays relué sur ses points. Taille 0x46D, plage
> 0x407EB4..0x408320 ; fonction de style stdcall-canonical avec frame 0x150 (sprintf inlined).

```c
void __cdecl sub_407EB4(int a1_palette_idx, int a2_W) {
    /* prologue : frame 0x150 ; arborisation wrapper non-null seulement */
    if (a2_W == 0) return;                             /* @0x407ec4 - 0x407ec8 */
    engine  = FFGetBufferAddress();                    /* @0x407ece */
    app     = GetBufApp_0xA74(engine);                 /* @0x407eda */
    wrapper = *(int*)(a2_W + 0x14);                    /* @0x407ee8 (var_1C = D) */
    if (!wrapper) return;                              /* @0x407eee */
    M = *(int*)(wrapper + 0xA0);                       /* @0x407efb (le palMgr, F_CHAR) */
    if (M == 0) goto _p242_null;                       /* @0x407f08 */
    if (a1_palette_idx < 0 || a1_palette_idx >= *(int*)(M + 0xC)) {  /* @0x407f15-24 */
        sprintf("ERROR: INVALID SPRITE PALETTE INDEX %d " (a1_palette_idx) /* @0x407f3a */);
        OutputDebugString_1(OutputString /* @0x407f55 */);
        a1_palette_idx = 0;                            /* @0x407f5d clamp */
    }
    var_24 = (*(int*)(wrapper + 0x9C) != a1_palette_idx); /* @0x407f64-72 cache-compare */
    sub_4097A0(engine);                                /* @0x407f7d (hook engine+0x104 éventuel) */
    if ((*(engine + 0xC08) != 0) || (*(engine + 0xBEC) != 0)) {   /* @0x407f99/@0x407fa9 */
        /* passer la branche « cache-purge walk » (fenêtre [60:120], check D3D-hot-swap) */
        /* @0x407fb7 : le entry-search */
        E = *(int*)(M + 0x40) + a1_palette_idx * 0x48; /* @0x407fbd-fc3 — SLOT */
        cached = *(int*)E;                             /* @0x407fcb */
        if (sub_4221E6(a1_palette_idx, M, *(int*)(wrapper+0x94), *(int*)(wrapper+0x98))) {  /* @0x407fef */
            if (cached == 0) {
                engine_agg = *(int*)(engine + 0xBDC);   /* @0x408012 */
                *(int*)(E + 0x3C) = sub_4223B8(E, engine_agg);  /* @0x408023-0x408046 */
            } else if (*(int*)(E + 0x38)) {             /* @0x408067 : already created */
                devobj = *(*(int*)(E + 0x38) + 8);      /* @0x408070-0x40808b */
                if (((dev + [devobj+0x60])(E+0x38)) == 0x887601C2)     /* @0x40808e-0x408091 */
                    E[0x38] = sub_421604(E[0x38]);      /* @0x4080a9-fc : re-build slot in extant */
                sub_41ED69(*(int*)(E + 0x38), *(engine + 0x314)); /* @0x4080c9 : drain-reseal */
                Gfx_SetRenderState(8, 1, engine);       /* @0x408103 add esp,0Ch */
                goto _drive_child_relay;                /* @0x40810b */
            }
            _drive_child_relay:
                ...
        }
    }
    /* Statistics possessing var_4 (F_CHAR) : falls-through 0x40816e */
    if (*(int*)(M + 0x1C))                              /* @0x408171 */
        var_28 = ((*(M + 0x20) + *(wrapper + 0x9C)) & 1);  /* @0x408177-0x408196 */
    else var_28 = (*(int*)(*(int*)(wrapper + 0x98) + 8) != 0);  /* @0x4081a4-0x4081bc */
    if (*(engine + 0xBA8) != 1)                         /* @0x4081c6 — pas D3D ext ? */
        if (*(int*)(M + 0x18))                          /* @0x4081d4 */
             var_28 = (*(*(int*)(M+0x18) + a1_palette_idx * *(int*)(M+0x10)) >> 24) != 0;
             /* @0x4081dd-ee — « quad-flag » sparse-image bit 3 (STP transparency) */
    if (*(engine + 0xBEC)) var_28 = 1;                  /* @0x408216-0x40821f */
    Gfx_SetRenderState(8, var_28, engine);              /* @0x408230 (add esp,0Ch @0x408235) */
    if (var_24) { /* cache swap for the wrapper */
        *(int*)(wrapper + 0x9C) = a1_palette_idx;       /* @0x408244 */
        if (*(engine + 0xBEC))                          /* @0x40824d */
            *(*(int*)(wrapper + 0x98) + 0xD0) = a1_palette_idx;  /* @0x408262 — D slots cache store */
        var_20 = *(int*)(M + 0x10);                     /* @0x40826b */
        /* vtable+0x64 : the (thiscall) main driver submit */
        ((void*)var_18)->vtable64((a1_palette_idx * var_20) /* @0x40828a */,
                                  var_20 /* @0x40827b */, 0 /* @0x408279 */,
                                  M /* @0x408278 */, wrapper /* @0x408274 */);
        /* NB : Ebay-stack args push-ordre = droite→gauche cdecl ; add esp,14h @0x40828d */
    }
    return;
}
```

> Fragments de fenêtres réutilisés : 0x407fb7 ↔ 0x40810f (publié dans la fenêtre [60:120]),
> et fenêtres [230:300] / [145:215]. Les instructions « … » couvertes en §**7** (tableau qui
> traverse le slot-table) et qui dépensent 07*per-driver* différents soulignés.

## Faites structurels
- **Le « slot E » dug the engine en M+0x40** et une strate de 0x48 bytes (72) — idem ceux du
  palMgr-slot de la chaîne VB ; stride 0x48, l'offset **E+0x38 = le TEXOBJ consommé par la
  vtable+0x64** (le push @0x408287) et **E+0x3C = le bloc sous-sub_4223B8** (DDrawAlt), sur
  l'epilogue du cache hit-test « *E+0x40 = — »  (fenêtre [230:300] @0x40824a-408046).
- Le `+0xD0` (store w en cache-hit @0x408262) EST dans le F_CHAR-block de la strate D (le
  cache-pointeur engéndéré par sub_407EB4 wrapper+0x98) — Kapok : **le F_CHAR ne manifeste pas
  dans les tableaux du driver vtable** — pas un vrai D-etag de la game pour le DDrawAlt di.

## Divergences Hex-Rays vs ASM
- Hex-Rays présentait le `call dword ptr [eax+0x64]` @0x40828a as **thiscall** avec l'implicite
  `ecx`-this — l'ASM montre au contraire la variante **cdecl** (5 args stack = add esp,14h).
- Pour cette fenêtre, la définition Hex-Rays de l'argument « a3_engine » (dans le type IDA)
  n'est PAS `int a3` (on voit un peu `var_18` de type int ; pas de diff structurelle).
