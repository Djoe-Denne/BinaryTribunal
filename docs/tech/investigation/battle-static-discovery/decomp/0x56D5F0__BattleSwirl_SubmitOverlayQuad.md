# BattleSwirl_SubmitOverlayQuad @ 0x56D5F0

- Instr (live): 95
- Palier: high
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=LIKELY, R=CERTAIN — arg5=z prouvé par layout XYZRHW, arg6=0x55FFFFFF prouvé par le caller)
- Revue semantic-triple 2026-09-19: triple 2+1, C réconcilié (6 divergences A/B tranchées, 0 indécise)
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1318
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=614
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=73
- A==B: non
- Push IDB: oui
- Push IDB: append-only [semantic-triple 2026-09-19] + save_database
- SetType: int __cdecl BattleSwirl_SubmitOverlayQuad(int, int, int, int, int, int, int)
- Notes parent: Alloc EAX jeté; dest=[ADE8+74h]. Quad stride 0x20, Z=arg_10 puis slot=right. Expand ±16 si arg_18!=0. FPU V2.x=left (A/B/C faux). add esp 8+20h. Retour=Invalidate. Occupancy absente.
## C réconcilié

```c/* =============================================================================
 * c_reconciled.c — Triple GLM, voix A/B réconciliées contre l'ASM live
 * BattleSwirl_SubmitOverlayQuad @ 0x56D5F0 (base 0x400000)
 * -----------------------------------------------------------------------------
 * Ground truth = live ASM (asm.asm, Intel + labels IDA) + ida_dump_bytes,
 * PAS Hex-Rays (hexrays.c = vérificateur seulement).
 *
 * Métadonnées live :
 *   - 95 instructions, taille 0x12D, plage 0x56D5F0..0x56D71C (fin 0x56D71D).
 *   - Type IDA : int __cdecl(int, int, int, int, int, int, int) — 7 dwords.
 *   - cdecl, cleanup APPELANT : add esp,8 immédiat après Gfx_AllocDrawListBatch
 *     (56d619), puis add esp,20h final groupé (56d717) = 8+12+8+4 octets des
 *     pushes cdecl cumulés. `retn` SANS immédiat (56d71c) → PAS callee-cleanup.
 *     La fonction réutilise les slots d'args de l'appelant comme scratch
 *     ([esp+8+arg_0/4/8/10]) — légal en cdecl (stack de l'appelant).
 *   - Sauvegardes : ESI (56d5f5/56d71b), EDI (56d5fa/56d71a). Pas de sub esp.
 *   - Retour : EAX = retour de Gfx_InvalidateDrawListStamp (56d712 → retn).
 *
 * Layout sommet (stride 0x20 = 8 dwords, format D3D TL déduit) :
 *   +0x00 x (f32) | +0x04 y (f32) | +0x08 a5 (z ?, rôle NON prouvé) | +0x0C 1.0f
 *   +0x10 a6 (couleur diffuse) | +0x14 (JAMAIS écrit) | +0x18 u | +0x1C v
 *   Quad TL,TR,BL,BR en strip ; UV = (0,0),(1,0),(0,1),(1,1).
 * ========================================================================== */

extern int dword_209ADE8;   /* singleton draw list (transition swirl) ; +0x74 = buffer sommets */

int __cdecl Gfx_AllocDrawListBatch(int count, int list);            /* EAX ignoré */
int __cdecl FFGetBufferAddress(void);
int __cdecl GfxDriver_SelectRenderTarget(int which, int buffer);    /* slot driver 39 (+0x9C) */
void __cdecl Gfx_SetRenderState(unsigned int type, int value, int buffer); /* type 14 = cull */
int __cdecl Gfx_WalkDrawList(int list, int buffer);
int __cdecl Gfx_InvalidateDrawListStamp(int list);

int __cdecl BattleSwirl_SubmitOverlayQuad(
    int a1,     /* arg_0  : x gauche */
    int a2,     /* arg_4  : y haut */
    int a3,     /* arg_8  : largeur  → right = a1 + a3 - 2 (rect inclusif) */
    int a4,     /* arg_C  : hauteur  → bottom = a2 + a4 - 2 */
    int a5,     /* arg_10 : dword +0x08 des 4 sommets (z ? rôle non prouvé) */
    int a6,     /* arg_14 : couleur diffuse (0x55FFFFFF vu chez caller 0x56D1D0) */
    int a7)     /* arg_18 : si != 0, expansion ±0x10 px */
{
    unsigned int dest;   /* = *(DWORD *)(list + 0x74) : buffer de sommets du batch */
    unsigned int bits;   /* bits float32 de right, transités par le slot pile arg_0 */
    int buffer;
    int left, top, right, bottom;

    /* --- 56d5f6/56d5fb : esi = a1, edi = a2 ; 56d5ff/56d600 : dec → -1 --- */
    left = a1 - 1;
    top  = a2 - 1;

    /* --- 56d601..56d60c : push eax(list) puis push 1 → (count=1, list).
     * Poussé droite→gauche : eax d'abord (dernier arg), 1 ensuite.
     * 56d604/56d608 : left/top réécrits dans les slots pile arg_0/arg_4
     * AVANT l'appel (slots d'args réutilisés comme scratch). --- */
    Gfx_AllocDrawListBatch(1, dword_209ADE8);       /* 56d60c ; add esp,8 @56d619 ; EAX ignoré */

    /* --- 56d611 : RELOAD du singleton après Alloc (peut muter le global) ;
     * 56d61c : dest = *(list + 0x74) --- */
    dest = *(unsigned int *)(dword_209ADE8 + 0x74); /* mov ecx,dword_209ADE8 ; mov eax,[ecx+74h] */

    /* --- 1.0f (0x3F800000) : ordre EXACT des stores live 56d624..56d639 --- */
    *(unsigned int *)(dest + 0x38) = 0x3F800000;    /* 56d624 v1.u */
    *(unsigned int *)(dest + 0x5C) = 0x3F800000;    /* 56d627 v2.v */
    *(unsigned int *)(dest + 0x78) = 0x3F800000;    /* 56d62a v3.u */
    *(unsigned int *)(dest + 0x7C) = 0x3F800000;    /* 56d62d v3.v */
    *(unsigned int *)(dest + 0x6C) = 0x3F800000;    /* 56d630 v3.w (rhw) */
    *(unsigned int *)(dest + 0x4C) = 0x3F800000;    /* 56d633 v2.w */
    *(unsigned int *)(dest + 0x2C) = 0x3F800000;    /* 56d636 v1.w */
    *(unsigned int *)(dest + 0x0C) = 0x3F800000;    /* 56d639 v0.w */

    /* --- 56d63c : ecx = a5 (arg_10 lu AVANT réutilisation du slot) ;
     * edx = 0 depuis 56d617 (xor edx,edx), vivant jusqu'à 56d674 --- */
    *(unsigned int *)(dest + 0x18) = 0;             /* 56d640 v0.u = 0 */
    *(unsigned int *)(dest + 0x68) = a5;            /* 56d643 v3.z (a5) */
    *(unsigned int *)(dest + 0x48) = a5;            /* 56d646 v2.z */
    *(unsigned int *)(dest + 0x28) = a5;            /* 56d649 v1.z */
    *(unsigned int *)(dest + 0x08) = a5;            /* 56d64c v0.z */

    /* --- 56d64f : ecx = a3 (arg_8 lu AVANT réutilisation du slot) --- */
    *(unsigned int *)(dest + 0x1C) = 0;             /* 56d653 v0.v = 0 */
    *(unsigned int *)(dest + 0x3C) = 0;             /* 56d656 v1.v = 0 */
    *(unsigned int *)(dest + 0x58) = 0;             /* 56d659 v2.u = 0 */

    /* --- right/bottom : slots pile réutilisés --- */
    right  = left + a3 - 1;     /* 56d65c lea ecx,[esi+ecx-1] ; 56d660 → slot arg_10 */
    bottom = top  + a4 - 1;     /* 56d668 lea ecx,[edi+ecx-1] ; 56d66c → slot arg_8 */

    /* --- 56d674 : cmp ecx(a7), edx(0) ; 56d676 jz loc_56D69F ---
     * Polarité exacte : le saut COURT-CIRCUITE l'expansion quand a7 == 0,
     * elle s'applique quand a7 != 0. */
    if (a7 != 0) {                                  /* loc_56D678..56d69b */
        left   -= 0x10;     /* 56d683 sub edx,ecx ; 56d685 → slot arg_0 */
        top    -= 0x10;     /* 56d68d sub edi,ecx ; 56d693 → slot arg_4 */
        right  += 0x10;     /* 56d68f add esi,ecx ; 56d697 → slot arg_10 */
        bottom += 0x10;     /* 56d691 add edx,ecx ; 56d69b → slot arg_8 */
    }
    /* loc_56D69F : */

    /* --- Bloc FPU : fild charge l'int en 80-bit, fst/fstp arrondissent en f32.
     * Ordre EXACT des stores dest live :
     *   +00 (56d6ad) +04 (56d6b9) +20 (56d6c4) +24 (56d6cb)
     *   +60 (56d6ce) +40 (56d6d1) +44 (56d6d8) +64 (56d6db) --- */

    /* 56d69f fild [arg_0] → ST0 = (double)left ; 56d6a3 ecx = a6 */
    *(unsigned int *)(dest + 0x10) = a6;            /* 56d6a7 v0.color */
    *(unsigned int *)(dest + 0x30) = a6;            /* 56d6aa v1.color */
    *(float *)(dest + 0x00) = (float)(double)left;  /* 56d6ad fst [eax] (ST0 conservé) */

    /* 56d6af fild [arg_4] → ST0 = top, ST1 = left */
    *(unsigned int *)(dest + 0x50) = a6;            /* 56d6b3 v2.color */
    *(unsigned int *)(dest + 0x70) = a6;            /* 56d6b6 v3.color */
    *(float *)(dest + 0x04) = (float)(double)top;   /* 56d6b9 fst [eax+4] (ST0 conservé) */

    /* 56d6bc fild [arg_10] → ST0 = right, ST1 = top, ST2 = left.
     * 56d6c0 fst [esp+8+arg_0] : bits f32 de right STOCKÉS dans le slot pile
     * arg_0 (pression de registres), relus à 56d6c7 mov edx,[slot].
     * → dest+0x60 reçoit une COPIE DE BITS du f32 de right (pas une
     * re-conversion). Aucun aliasing dest ↔ slot pile. */
    {
        float f_right = (float)(double)right;       /* valeur du slot pile */
        bits = *(unsigned int *)&f_right;           /* 56d6c7 edx = bits f32 right */
    }
    *(float *)(dest + 0x20) = (float)(double)right; /* 56d6c4 fstp [eax+20h] (pop) */
    *(float *)(dest + 0x24) = (float)(double)top;   /* 56d6cb fstp [eax+24h] (pop ; ST0=top) */
    *(unsigned int *)(dest + 0x60) = bits;          /* 56d6ce mov [eax+60h],edx (bits f32) */
    *(float *)(dest + 0x40) = (float)(double)left;  /* 56d6d1 fstp [eax+40h] (pop ; ST0=left) */

    /* 56d6d4 fild [arg_8] → ST0 = bottom */
    *(float *)(dest + 0x44) = (float)(double)bottom; /* 56d6d8 fst [eax+44h] */
    *(float *)(dest + 0x64) = (float)(double)bottom; /* 56d6db fstp [eax+64h] (pop) */

    /* --- Séquence rendu : 3× FFGetBufferAddress ; chaque usage du singleton
     * RELIT dword_209ADE8 (56d700, 56d70b) — pas de cache local. --- */
    buffer = FFGetBufferAddress();                  /* 56d6de */
    GfxDriver_SelectRenderTarget(1, buffer);        /* 56d6e3 push eax ; 56d6e4 push 1 → (1, buffer) ; 8 octets */

    buffer = FFGetBufferAddress();                  /* 56d6eb */
    Gfx_SetRenderState(0x0E, 1, buffer);            /* 56d6f0/f1/f3 push eax,1,0Eh → (0xE, 1, buffer) ; 12 octets ; type 14 = cull */

    buffer = FFGetBufferAddress();                  /* 56d6fa */
    Gfx_WalkDrawList(dword_209ADE8, buffer);        /* 56d6ff push eax ; 56d700/705 push global relu → (list, buffer) ; 8 octets */

    return Gfx_InvalidateDrawListStamp(dword_209ADE8);
    /* 56d70b mov ecx,dword_209ADE8 ; 56d711 push ; 56d712 call ; EAX → retn.
     * 56d717 add esp,20h (8+12+8+4, cleanup groupé cdecl APPELANT — `retn`
     * sans immédiat à 56d71c n'est PAS callee-cleanup) ; pop edi ; pop esi. */
}
```

## Preuves et validation parent

- Mode 2+1 (triple GLM) : voix A (CERTAIN), voix B (LIKELY), voix R (réconciliatrice) — réconciliation tranchant contre l'ASM live, jamais la moyenne.
- 5 preuves clés (semantic_r.md) :
  1. Alloc batch(1) sur la draw-list swirl globale `dword_209ADE8` (push droite→gauche @0x56D601/0x56D602, call @0x56D60C, `add esp,8` @0x56D619, EAX jeté) ; 4 sommets de stride 0x20 écrits à `*(list + 0x74)` — x @+0x00/+0x20/+0x40/+0x60, y @+0x04/+0x24/+0x44/+0x64, rhw=1.0f (0x3F800000) @+0x0C/+0x2C/+0x4C/+0x6C ⇒ layout XYZRHW (D3DTLVERTEX).
  2. Rect inclusif : `dec esi/edi` @0x56D5FF/0x56D600 puis `lea ecx,[esi+ecx-1]` @0x56D65C / `lea ecx,[edi+ecx-1]` @0x56D668 ⇒ coins `(x-1,y-1)`–`(x+w-2,y+h-2)` ; UV (0,0),(1,0),(0,1),(1,1) ; `+0x14` (specular) jamais écrit.
  3. Expansion ±0x10 px si arg7≠0 : `cmp ecx,edx` @0x56D674 (edx=0), polarité `jz loc_56D69F` @0x56D676 — le saut court-circuite l'expansion quand arg7==0 ; `mov ecx,10h` + sub/add @0x56D678–0x56D69B.
  4. Épilogue rendu direct : 3× `FFGetBufferAddress` @0x56D6DE/0x56D6EB/0x56D6FA → `GfxDriver_SelectRenderTarget(1,buf)` (buffer select, pas end-scene) + `Gfx_SetRenderState(0x0E,1,buf)` (type 14 = cull off) + `Gfx_WalkDrawList` @0x56D706 + `Gfx_InvalidateDrawListStamp` @0x56D712 ; `retn` C3 sans immédiat @0x56D71C.
  5. Caller unique `XrefsTo(0x56D5F0)` = [0x56D225] (dans `start_battle_swirl_sub_56D1D0`, one-shot lattché via `BattleSwirl_ArmOneShot`) ; le caller pousse 7 args puis nettoie `add esp,2Ch` @0x56D22A = 11 dwords = 4 (CaptureFrame) + 7 (Submit) — confirme cdecl cleanup APPELANT.
- Convergence wiki QMD : battle-address-catalog.md L143 (`0x56D240/0x56D530/0x56D5F0` alloc/resample/submit), decomp-function-catalog.md L434, battle-render-pipeline-entrypoints.md L33/58/88.

## Divergences

Résumé reconcile_notes.md (6 divergences A/B tranchées contre l'ASM, 0 indécise ; Hex-Rays = vérificateur seulement, 4 corrigées H1–H3/H6, H4/H5 conformes) :

- **D1 — Bits float de right (+0x60)** : A copie de bits du f32 vs B relecture des bits de l'int. **Tranché : A** — `fild [arg_10]` @0x56D6BC → `fst [esp+8+arg_0]` @0x56D6C0 (le slot pile contient le f32) → `mov edx,[slot]` @0x56D6C7 → `mov [eax+60h],edx` @0x56D6CE.
- **D2 — Ordre stores +0x20/+0x24/+0x60** : tranché **B** — adresses strictement croissantes 0x56D6C4 → 0x56D6CB → 0x56D6CE (Hex-Rays avait interverti).
- **D3 — Ordre des stores 1.0f** : tranché **B** (ordre live exact 38h,5Ch,78h,7Ch,6Ch,4Ch,2Ch,0Ch @0x56D624–0x56D639) ; sémantiquement identique à A.
- **D4 — Cache du singleton `dword_209ADE8`** : tranché **A** — deux rechargements explicites @0x56D700/0x56D70B avant les calls Walk/Invalidate ; pas de cache local.
- **D5 — Commentaire « stdcall cleanup zéro propre » de B** : tranché **FAUX** — cdecl, cleanup APPELANT : `retn` sans immédiat @0x56D71C, `add esp,8` @0x56D619 puis `add esp,20h` @0x56D717 (8+12+8+4 = pushes cdecl des 4 callees) ; le code de B est correct, commentaire corrigé dans le réconcilié.
- **D6 — Conversion FPU** : tranché **B** — `(float)(double)x` : `fild` charge en 80-bit, `fst/fstp` arrondissent en f32 (chemin int → 80-bit → f32).
- Réserves non bloquantes : arg5 = z par inférence structurelle (rhw=1.0f ⇒ XYZRHW) ; `+0x14` (specular) et slots backend du walk hors de ce corps.