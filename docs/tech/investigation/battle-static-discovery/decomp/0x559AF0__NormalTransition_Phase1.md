# NormalTransition_Phase1 @ 0x559AF0

- File demandée: `0x559AF0` (entrée directe de la fonction)
- Instr: 130
- Mode: 1+V
- Verdict: CERTAIN — A==V (ACCEPT_A) ; corps de phase 1 (t≤20) du runner BattleTransition_RunNormal : quad plein écran expansé + états + WalkDrawList
- Hex-Rays: extrait le 2026-09-19 après correction du pack (`addr` au lieu de `addrs`) — conforme à l'ASM, artefact `v13` écarté (voir Divergences)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue V 2026-09-19: Phase1 **prouvé** (dispatch 0x559992 `cmp edi,14h` → appel 0x5599A8 avant Phase2 0x5599D6) ; `Gfx_WalkDrawList` = 2 args (proto IDB `void __cdecl(_DWORD *, int)` @0x4178D7)

## C réconcilié

Préambule : ground truth = live ASM (`asm.asm`, 130 instructions, Intel + labels
IDA), taille 0x179 octets (0x559AF0–0x559C68), type IDA
`_DWORD *__cdecl(int, float, int, int)`. Sauvegardes de registres : EBX/ESI/EDI.
Nettoyage arguments : un seul `add esp, 44h` en fin (559c5f) → tous les callees
sont cdecl pour l'appelant. Le fichier `tools/_tmp_semantic_triple/0x559af0/c_reconciled.c`
fait foi ; transcription fidèle ci-dessous (structs inconnus en `unsigned char*`
+ offsets hex, strides réels 0x20, divisions signées /8 et /9, ftol = troncature
vers zéro). Correction review V 2026-09-19 : la magie `38E38E39h` = ⌈2³³/9⌉ →
division par **9** (pas /6) ; `3AC49BA6h` = **0.0015f** exact (pas 0.0013736).
NB : les noms de grattage `left`/`right` de c_reconciled.c sont trompeurs —
`left` = bord **droit** du quad, `right` = bord **haut**.

```c
/* Slots IDA réutilisés comme grattage : arg_8 (q, right, stash float left),
   arg_4 (float f lu 2x puis RÉÉCRIT en int d/bottom), var_4 (0xFF404040),
   var_8 (xbase), var_C (left). arg_0 (ebp+8) JAMAIS lu. */

void *__cdecl NormalTransition_Phase1(int a1, float f, int a3, int a4)
{
    xbase  = dword_204DB2C + a3;                       /* 559af6-559b0b */
    q      = (screen_x + xbase) / 8;                   /* signé vers zéro, 559b0d-559b18 */
    color  = 0xFF404040;                               /* octets 40 40 40 FF, 559b14-559b2c */
    left   = (int)((float)q * f * 2.0f + (float)(screen_x + xbase)); /* ftol après fiadd, 559b22-559b3b */
    y9     = screen_y / 9;                             /* magie 38E38E39h = ceil(2^33/9), 559b49-559b59 */
    right  = (int)((float)dword_204DB30 - (float)y9 * f);            /* 559b5c-559b6a */
    d      = dword_204DB30 + screen_y;                 /* réécrit slot arg_4, 559b6f-559b7a */
    bottom = (int)((float)d + (float)y9 * f);          /* + fstp st purge FPU, 559b7d-559b89 */

    list = BattleSwirl_GetSecondDrawList();            /* 559b8c — dword_209ADEC d'après commentaire IDA */
    Gfx_AllocDrawListBatch(1, list);                   /* 559b93-559b96 ; retour ignoré */

    V = *(unsigned char **)(list + 0x74);              /* rechargé 4x : 559b9e/ca/e8/c09 */

    /* 4 sommets, stride 0x20 ; constantes : 3AC49BA6h (= 0.0015f, z), 3F800000h (1.0f, rhw) */
    /* v0 @ +0x00 : x=(f)xbase, y=(f)right, +08=3AC49BA6h, +0C=1.0f, +10=color,
                    +18=0, +1C=0            ; +14 NON ÉCRIT */
    /* v1 @ +0x20 : x=(f)left,  y=(f)right, +28=3AC49BA6h, +2C=1.0f, +30=color,
                    +38=1.0f, +3C=0         ; +34 NON ÉCRIT */
    /* v2 @ +0x40 : x=(f)xbase, y=(f)bottom,+48=3AC49BA6h, +4C=1.0f, +50=color,
                    +58=0,    +5C=1.0f      ; +54 NON ÉCRIT */
    /* v3 @ +0x60 : x=(f)left (stashé via fst [arg_8] + mov edi), y=(f)bottom,
                    +68=3AC49BA6h, +6C=1.0f, +70=color, +78=1.0f, +7C=1.0f
                                            ; +74 NON ÉCRIT */

    GfxDriver_SetBlendMode(1, a4);                     /* 559c2e — slot 33 (+0x84) : BLEND 0-4, PAS fog */
    GfxDriver_SelectRenderTarget(1, a4);               /* 559c36 — slot 39 (+0x9C), pas une fin de scène */
    Gfx_SetRenderState(0x0E, 1, a4);                   /* 559c40 — type 14 = cull, bit 0x4000 */
    Gfx_SetRenderState(0x0F, 1, a4);                   /* 559c4a — type 15 */
    Gfx_SetRenderState(0x10, 0, a4);                   /* 559c53 — type 16 = ZWRITE/glDepthMask, valeur 0 */
    return Gfx_WalkDrawList(list, a4);                 /* 559c5a — EAX propagé jusqu'au retn (559c68) */
}
```

(Full version with per-instruction VA comments and per-slot scratch history:
`tools/_tmp_semantic_triple/0x559af0/c_reconciled.c`.)

## Preuves et validation parent

1. Division signée /8 : `cdq / and edx,7 / add eax,edx / sar eax,3`
   (559b0d–559b18) → `q = (screen_x + dword_204DB2C + arg_8)/8`, arrondi vers
   zéro — pas une division logique ni un masque.
2. Division signée /9 par magie `38E38E39h` (= ⌈2³³/9⌉) + `imul esi` + `sar edx,1` +
   correction (559b49–559b59) → `screen_y/9` signé vers zéro. Confirmé par V :
   l'expansion verticale vaut `screen_y/9 × f` (haut **et** bas).
3. ftol de 559b3b porte sur `fadd st,st` (×2 exact) suivi de `fiadd esi` :
   la troncature s'applique à `2*q*f + (screen_x+xbase)`, pas au seul produit ;
   le `fstp st` (559b87) purge le reste FPU du ftol de 559b6a — purge, pas calcul.
4. Slot `arg_4` (paramètre float f) est RÉÉCRIT en int à 559b7a puis 559b89
   après ses deux lectures (559b33, 559b5f) — grattage de pile, fidèle à l'ASM.
5. Sommets : base `*(list+0x74)` rechargée 4× (559b9e, 559bca, 559be8, 559c09),
   stride réel **0x20**, dword 3 de chaque sommet (V+0x14/0x34/0x54/0x74) jamais
   écrit ; couleur dword 0xFF404040 (octets 40 40 40 FF) à +0x10/+0x30/+0x50/+0x70.
6. Callees cités, tous présents dans `callees.txt` (lignes CALL 559b3b…559c5a,
   `add esp,44h` unique en 559c5f = 8+8+8+12+12+12+8) :
   `BattleSwirl_GetSecondDrawList`, `Gfx_AllocDrawListBatch`,
   `GfxDriver_SetBlendMode` (slot 33, wrapper [driver+0x84], BLEND 0-4),
   `GfxDriver_SelectRenderTarget` (slot 39, +0x9C), `Gfx_SetRenderState`
   (types 0x0E/0x0F valeur 1, type 0x10 valeur **0** — ZWRITE/glDepthMask off),
   `Gfx_WalkDrawList` (GfxDrawList236, stamp +88).
7. Caller unique confirmé par `callers.txt` (`more:false`) :
   `BattleTransition_RunNormal` @ 0x5599a8.
8. `arg_0` (ebp+08h) du type IDA n'est lu nulle part dans les 130 instructions ;
   `arg_C` (a4) est le même int réutilisé pour les 6 wrappers driver.

## Divergences Hex-Rays

- **Hex-Rays extrait le 2026-09-19** (pack corrigé) : conforme à l'ASM sur tous
  les points contrôlés par V. Artefacts écartés : `v13` non initialisé dans
  l'appel final `Gfx_WalkDrawList(v13, v5, a4)` — l'ASM donne **2 pushes**
  (559c58/59) et le proto IDB `void __cdecl(_DWORD *, int)` confirme 2 args ;
  Hex-Rays montre aussi `2*(screen_x/8)*a2` (fadd st,st) et `/9`, cohérents.
- **2 erreurs de commentaire dans c_reconciled.c corrigées via V** :
  `/6` → `/9` (magie 38E38E39h = ⌈2³³/9⌉), `0.0013736f` → `0.0015f`
  (3AC49BA6h = 0x75 exp × 1.536035 mantisse = 0.001500032) ; labels bords
  mélangés documentés (voir préambule).
- Divergences métadonnées IDA vs ASM : prototype `_DWORD *__cdecl(int, float, int, int)`
  — retour jamais conçu (EAX résiduel de WalkDrawList), `arg_0` jamais lu.
- Pièges §8 applicables : largeur AL du `__ftol` respectée (couleur), types 0x0E/0x0F/0x10
  passés bruts à `Gfx_SetRenderState` (pas de table d'enums).
