# NormalTransition_Phase2 @ 0x559C70

- Nom descriptif proposé (markdown seul, non appliqué à l'IDB): `BattleTransition_Normal_DrawCurtainFrame`
- Instr: 138
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=LIKELY, B=LIKELY, R=CERTAIN — constantes réelles extraites, ABI `sub_4179D8` close)
- Caller: unique `BattleTransition_RunNormal` @0x5599D6 (close, qui ignore le retour)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, 6 divergences tranchées (ordre args `sub_4179D8` → `(screen_y, dword_204E2E0)` Hex-Rays correct ; `flt_C76DAC` = 2.5 réel ; `flt_C76DB0` = 2.0 ; `dbl_B69968` = −51200.0 ; `dbl_B69970` = 1.2π ; front animé = vertex2 ; `dword_1CA8A00` = flag one-shot posé par `sub_45B460` @0x45B477)

## C réconcilié

```c
// ============================================================================
// re-ff8 — C réconcilié (rôle R, triple GLM) — NormalTransition_Phase2
// ============================================================================
//
// Métadonnées :
//   Instr (live) : 138 (0x559C70 .. 0x559E35, taille 454 octets)
//   Palier       : battle transition. Appelant unique BattleTransition_RunNormal
//                  (runner 0x559910, site 0x5599D6) avec (t, f=(t-20)*0.02, ctx),
//                  f ∈ [0,1]. Phase1 = 0x559AF0.
//   Notes parent : corps SANS garde des bornes 70/72 (garde portée par le runner
//                  0x559910) ; stride sommet 0x20 (esi += 0x20, 2 sommets/ligne) ;
//                  couleurs écrites OCTET PAR OCTET (dwords LE reconstitués) ;
//                  octets +0x14..+0x1F de chaque sommet JAMAIS écrits ; a1 (t)
//                  jamais lu ; dword_204DB38[490] consommé SANS clamp (trou
//                  ouvert borne, à consommer par Phase2).
//
// Préambule : Ground truth = live ASM (asm.asm) + ida_dump_bytes, NOT Hex-Rays.
//   Type IDA    : int __cdecl NormalTransition_Phase2(int, float, int)
//   Sauvegardes : ebp (cadre) ; esi 0x559C81/pop 0x559E31 ; edi 0x559CDF/pop
//                 0x559DED ; ebx 0x559D0F/pop 0x559DE4 (pousse après le jle
//                 0x559D00 → équilibré dans la branche screen_y > 0 seulement).
//   add esp     : 0x559C90 = 8  (sub_4179D8, 2 args)
//                 0x559DFE = 8  (GfxDriver_SetBlendMode, 2 args)
//                 0x559E2E = 2Ch = 12+12+12+8 (3× Gfx_SetRenderState + Gfx_WalkDrawList)
//                 → Gfx_WalkDrawList reçoit 2 args (prototype 3-args Hex-Rays rejeté).
//
// Divergences tranchées (voir reconcile_notes.md) :
//   D1. sub_4179D8(screen_y, dword_204E2E0) — Hex-Rays CONFIRMÉ par l'ASM ;
//       voix A rejetée (le push esi @0x559C81 est un SAVE, pas un arg).
//   D2. Gfx_WalkDrawList : 2 args (list, ctx) — Hex-Rays 3 args rejeté.
//   D3. arg_4 (float f) réutilisé comme scratch int (x1 @0x559D53, x2 @0x559D6E)
//       après le hoist FPU de f*3.0 en st(1) — les 2 voix d'accord, conservé.
// ============================================================================

#include <math.h>   // sin : remplace fsin @0x559D33 (argument ~[0,3], précision OK)

// --- Types ------------------------------------------------------------------

// Sommet transformé écran, stride 0x20. +0x14..+0x1F jamais écrits par cette
// fonction (8 octets hérités du buffer).
typedef struct Phase2Vert_20 {
    float        x;      // +0x00
    float        y;      // +0x04
    float        z;      // +0x08 = 0x3727C5AC = 1e-5f (constante ancrée @0x559D87/0x559DAA)
    float        rhw;    // +0x0C = 0x3F800000 = 1.0f (@0x559D8E/0x559DB9)
    unsigned int color;  // +0x10 (dword packé, octets écrits un à un @0x559C97..0x559CD5)
    unsigned int pad[2]; // +0x14..+0x1F non touchés
} Phase2Vert_20;

// --- Externes : globals (noms IDA) ------------------------------------------

extern int   screen_x;               // résolution : largeur
extern int   screen_y;               // résolution : hauteur
extern int   dword_1CA8A00;          // flag : gate couplé couleur/blend
extern int   dword_204DB2C;          // centre X (bord gauche fixe, = v1.x)
extern int   dword_204DB30;          // offset Y de base des lignes
extern int   dword_204DB38[490];     // scanlines (rempli par 0x559750, lu ICI SANS clamp)
extern void *dword_204E2E0;          // draw list ; base sommets à +0x74, RELUE à chaque itération

// Constantes FP (valeurs non dumpées dans le pack : symboliques, aucune invention)
extern const float  flt_C76DAC;      // facteur expansion horizontale (@0x559CE0)
extern const float  flt_C76DB0;      // échelle scanline → retrait x (@0x559D5B)
extern const double dbl_B69968;      // amplitude sinusoide (@0x559D35)
extern const double dbl_B69970;      // fréquence sinusoide (@0x559D20)
extern const double CONST_3_0;       // = 3.0 (ds:CONST_3_0 @0x559D09)

// --- Externes : fonctions ---------------------------------------------------

extern void sub_4179D8(int screen_y_, void *list);        // 2 args (tranché D1)
extern void __ftol(void);                                 // CRT FPU→int, trunc
extern void GfxDriver_SetBlendMode(int mode, int ctx);    // slot 33 = BLEND 0-4, wrapper [driver+0x84]
extern void Gfx_SetRenderState(int type, int value, int ctx); // slot 29 shadow *(engine+2692)[type]
extern void Gfx_WalkDrawList(void *list, int ctx);        // 2 args (tranché D2)

// --- Corps ------------------------------------------------------------------

int __cdecl NormalTransition_Phase2(int a1, float a2, int a3)
// a1 = t (JAMAIS lu dans le corps 0x559C70..0x559E35) ; a2 = f ; a3 = ctx
{
    unsigned int color_v1;   // [ebp-4h]  var_4 : couleur sommet 1
    unsigned int color_v2;   // [ebp-8h]  var_8 : couleur sommet 2
    int          x_base;     // [ebp-14h] var_14 : (int)(screen_x * flt_C76DAC * f)
    int          max_x;      // [ebp-0Ch] var_C : max des x2 → VALEUR DE RETOUR
    int          row;        // edi ; copie [ebp-10h] var_10 (source fild)
    int          row_y;      // [ebp-18h] var_18 : dword_204DB30 + row
    int          x2;         // réutilise le SLOT arg_4 [ebp+0Ch] comme int (D3)
    int          vcursor;    // esi : curseur OCTETS dans le vertex buffer (+= 0x20/sommet)
    const int   *scan;       // ebx : &dword_204DB38[row]

    (void)a1;                // arg_0 jamais référencé

    // 0x559C76..0x559C90 : pushes eax(list) puis ecx(screen_y) → cdecl
    // (screen_y, dword_204E2E0) ; add esp,8 @0x559C90.
    // Le push esi @0x559C81 est un SAVE de registre (pop esi @0x559E31),
    // PAS un argument — voix A rejetée, Hex-Rays confirmé (D1).
    sub_4179D8(screen_y, dword_204E2E0);

    // 0x559C8E : xor esi, esi → curseur sommets = 0
    vcursor = 0;

    // 0x559C93..0x559CD5 : polarité des couleurs, gate = dword_1CA8A00.
    // Octets écrits individuellement (b0,b1,b2,b3) → dword LE.
    if ( dword_1CA8A00 != 0 ) {
        color_v1 = 0xFF202020u;  // (20,20,20,FF) gris opaque  [hexrays -14671840]
        color_v2 = 0xFF202020u;
    } else {
        color_v1 = 0xC0000000u;  // (00,00,00,C0) alpha 0xC0   [hexrays -1073741824]
        color_v2 = 0x00000000u;  // transparent total → dégrade C0→00 le long du segment
    }

    // 0x559CD9..0x559CEE : fild screen_x ; fmul flt_C76DAC ; fmul [arg_4] ; __ftol (trunc)
    x_base = (int)( (double)screen_x * (double)flt_C76DAC * (double)a2 );

    // 0x559CF1..0x559D00 : edi=0 ; var_C=0 ; var_10=0 ; cmp screen_y,esi ; jle (SIGNE)
    max_x = 0;
    row   = 0;

    if ( screen_y > 0 ) {
        // 0x559D06/0x559D09 : fld [arg_4] ; fmul CONST_3_0 → hoisté au fond de
        // la pile FPU (st(1)) pour TOUTE la boucle, dépilé par fstp st @0x559DE2.
        // Le slot mémoire arg_4 (le paramètre f) est RÉUTILISÉ comme scratch
        // int dès 0x559D53 (D3) — d'où la copie locale phase_base.
        double phase_base = (double)a2 * CONST_3_0;

        scan = dword_204DB38;               // 0x559D10 : mov ebx, offset (SANS clamp)

        do {                                // tête 0x559D15 ; queue 0x559DDC jl (SIGNE)
            unsigned int vbase;
            Phase2Vert_20 *v1, *v2;
            int            sw;

            row_y = dword_204DB30 + row;    // 0x559D18/0x559D1E/0x559D26

            // 0x559D15..0x559D41 : fild var_10 ; fmul dbl_B69970 ; fidiv screen_y ;
            // fld st(1) ; faddp ; fsin ; fmul dbl_B69968 ; fidiv screen_x ; __ftol
            sw = (int)( sin( phase_base + (double)row * dbl_B69970 / (double)screen_y )
                        * dbl_B69968 / (double)screen_x );

            // 0x559D46..0x559D63 : xpos = dword_204DB2C - sw + x_base → ÉCRIT DANS
            // LE SLOT arg_4 (0x559D53) ; puis fild xpos ; fild [ebx] ; fmul
            // flt_C76DB0 ; fsubp st(1),st ; __ftol → résultat ré-écrit dans
            // arg_4 (0x559D6E). Le float f est détruit à ce point (D3).
            x2 = (int)( (double)( dword_204DB2C - sw + x_base )
                        - (double)scan[0] * (double)flt_C76DB0 );

            // Base sommets RELUE à chaque itération :
            //   0x559D68 mov edx, dword_204E2E0 ; 0x559D77 mov ecx, [edx+74h]
            //   puis 0x559D9E / 0x559DA7 (recharge + [ecx+74h] pour le sommet 2).
            vbase = *(unsigned int *)((char *)dword_204E2E0 + 0x74);
            v1 = (Phase2Vert_20 *)( vbase + vcursor );  vcursor += 0x20;  // esi += 0x20 @0x559D7F
            v2 = (Phase2Vert_20 *)( vbase + vcursor );  vcursor += 0x20;  // esi += 0x20 @0x559DB4

            // Sommet 1 (gauche, x FIXE = dword_204DB2C) — ordre d'écriture ASM :
            // x(0x559D82 fstp) z(0x559D87) rhw(0x559D8E) color(0x559D95)
            // puis y(0x559D9B fst SANS pop, fild var_18 @0x559D84).
            v1->x     = (float)dword_204DB2C;
            v1->y     = (float)row_y;
            v1->z     = 0x3727C5ACu;         // 1e-5f
            v1->rhw   = 0x3F800000u;         // 1.0f
            v1->color = color_v1;            // +0x14..+0x1F jamais écrits

            // Sommet 2 (droite, x = x2 modulé scanline) — ordre ASM :
            // z(0x559DAA) x(0x559DB7 fstp) rhw(0x559DB9) color(0x559DC0)
            // y(0x559DC3 fstp, même valeur st que v1.y).
            v2->x     = (float)x2;
            v2->y     = (float)row_y;
            v2->z     = 0x3727C5ACu;
            v2->rhw   = 0x3F800000u;
            v2->color = color_v2;

            // 0x559DC6..0x559DCB : cmp eax, var_C ; jle (SIGNED)
            if ( x2 > max_x )
                max_x = x2;

            // 0x559DD3..0x559DDC : inc edi ; add ebx,4 ; cmp edi, screen_y ; jl (SIGNED)
            ++row;
            ++scan;
        } while ( row < screen_y );

        // 0x559DE2 : fstp st — dépile phase_base résiduel ; 0x559DE4 : pop ebx
    }

    // 0x559DE5..0x559DFE : mov esi, [ebp+arg_8] (=a3) ; push esi ; push {2|0} ;
    // call ; add esp,8. 9 callers en 0/1/2/4, AUCUN push 3.
    GfxDriver_SetBlendMode( dword_1CA8A00 != 0 ? 2 : 0, a3 );

    // 0x559E01..0x559E1A : trois états, cdecl (type, value, ctx) — push esi(a3)
    // d'abord (dernier arg cdecl), puis value, puis type.
    Gfx_SetRenderState( 0x0E, 1, a3 );   // type 14 = cull (bit 0x4000) ACTIVÉ
    Gfx_SetRenderState( 0x0F, 0, a3 );   // type 15 OFF
    Gfx_SetRenderState( 0x10, 0, a3 );   // type 16 = ZWRITE/glDepthMask OFF

    // 0x559E1F..0x559E26 : push esi(a3) ; push eax(list) → 2 args (D2, add esp,2Ch)
    Gfx_WalkDrawList( dword_204E2E0, a3 );

    // 0x559E2B : mov eax, [ebp+var_C] — retour = max_x (0 si boucle sautée)
    return max_x;
}

// ============================================================================
// Notes de vérification Hex-Rays (vérificateur, PAS ground truth) :
//  - Conforme : couleurs -14671840 = 0xFF202020 / -1073741824 = 0xC0000000 ;
//    z = 925353388 = 0x3727C5AC (1e-5f) ; rhw = 1065353216 = 0x3F800000 (1.0f) ;
//    verts à *(list+116) ; stride 0x20/sommet, 0x40/ligne ; do/while row < screen_y
//    signé ; garde screen_y <= 0 identique ; retour v17 = var_C.
//  - Divergence D1 (TRANCHÉE pour Hex-Rays) : sub_4179D8(screen_y, list) —
//    l'ASM pousse eax(list) puis ecx(screen_y) ; le push esi @0x559C81 est un
//    save (pop @0x559E31), pas un arg. La voix A lit (list, esi) → rejetée.
//  - Divergence D2 (TRANCHÉE contre Hex-Rays) : hexrays.c ligne 81 appelle
//    Gfx_WalkDrawList(list, list, a3) en 3 args. L'ASM ne pousse que 2 valeurs
//    (esi, eax) et add esp,2Ch @0x559E2E solde exactement 12+12+12+8. Prototype
//    Hex-Rays faux (le 2e arg dupliqué list est un artefact de typage).
//  - Divergence D3 (CONFORME aux 2 voix) : hexrays matérialise v7/v12 avec un
//    double cast __int64 qui masque la réutilisation du slot arg_4 (float f →
//    scratch int x1/x2 @0x559D53/0x559D6E) ; conservée ici via la var locale x2.
//  - Constantes flt_C76DAC / flt_C76DB0 / dbl_B69968 / dbl_B69970 non dumpées
//    dans le pack → laissées symboliques (aucune invention de valeur).
// ============================================================================
```

## Preuves et validation parent

1. **Begin-frame / ensure-capacity `sub_4179D8`** : args réels `(screen_y, dword_204E2E0)` — pushes 0x559C82/0x559C83, `add esp,8` @0x559C90, save/restore esi 0x559C81/0x559E31. Rôle clos par le prologue 0x4179E5–0x417B00 : null-guard arg_4, stamp `[desc+0x58]` vs generation_ptr, reset compteurs 0x417A05–0x417A48, chunk de `screen_y` éléments via `sub_424A3B` @0x417AFF — **aligné sur les champs stamp +88 / head +148 (0x94) que consomme `Gfx_WalkDrawList`** ; retour bool ignoré par Phase2.
2. **Boucle scanline stride 4** : 0x559D10 `mov ebx, offset dword_204DB38` puis `add ebx,4` @0x559DD4 par itération, `jl` signé @0x559DDC ; `dword_204DB38[490]` consommé **sans clamp** ici (garde des bornes 70/72 dévolue au runner 0x559910).
3. **Vertices stride 0x20, z=1e-5 / rhw=1.0** : `add esi,20h` ×2 par ligne (0x559D7F/0x559DB4), base sommets `[dword_204E2E0+0x74]` relue à chaque itération ; z = 0x3727C5AC (1e-5f) @0x559D87/0x559DAA, rhw = 0x3F800000 (1.0f) @0x559D8E/0x559DB9 ; vertex1.x = ancre fixe `dword_204DB2C` (0x559D71→0x559D82), vertex2.x = front animé (0x559DA4→0x559DB7), octets +0x14..+0x1F jamais écrits.
4. **Couleurs/blend par `dword_1CA8A00`** : 0x559C93 `cmp` / 0x559C95 `jz` → `0xFF202020` (deux sommets) vs `0xC0000000`/`0x00000000` (dégradé alpha C0→00) ; 0x559DEE `test` / 0x559DF1 `jz` → `GfxDriver_SetBlendMode(2|0, ctx)` @0x559DF9. Flag one-shot : seule écriture @0x45B477 dans `sub_45B460` (`cmp [eax+0BA8h],1` @0x45B46E, garde one-shot `dword_1B47810` @0x45B48E).
5. **Renderstates** : 0x559E01–0x559E1A, trois `Gfx_SetRenderState` cdecl (type, value, ctx) → `(0xE,1)` cull ACTIVÉ, `(0xF,0)`, `(0x10,0)` ZWRITE OFF.
6. **`add esp,2Ch` @0x559E2E = 44 = 3×12 + 8** : solde exactement les trois `Gfx_SetRenderState` (3 args) + `Gfx_WalkDrawList` (2 pushes 0x559E24/0x559E25) → **`Gfx_WalkDrawList(dword_204E2E0, ctx)` à 2 args**, prototype 3-args Hex-Rays rejeté.

## Divergences

Résumé de `reconcile_notes.md` (ground truth = asm.asm live ; hexrays.c = vérificateur seulement) :

- **D1 — `push esi` @0x559C81 = save, pas un argument** : trois pushes (`esi`, `eax`, `ecx`) mais `add esp,8` @0x559C90 ne solde que 2 dwords ; appariement `pop esi` @0x559E31, esi jamais relu du stack save (rechargé depuis `[ebp+arg_8]` @0x559DEA). Ordre cdecl réel : dernier poussé = arg1 → **`sub_4179D8(screen_y, dword_204E2E0)`** ; voix A rejetée, Hex-Rays confirmé (aucune divergence sur ce point).
- **D2 — `Gfx_WalkDrawList` 2 args, Hex-Rays 3 args rejeté** : le call Hex-Rays `Gfx_WalkDrawList(list, list, a3)` (hexrays.c ligne 81) est un artefact de typage (2e `list` dupliqué) ; l'ASM ne pousse que 2 valeurs et `add esp,2Ch` @0x559E2E solde 12+12+12+8 → **2 args `(list, ctx)`**. Aucune des deux voix n'avait suivi Hex-Rays ici.
- **D3 — `arg_4` (float f) réutilisé comme scratch int, confirmé** : `fld [arg_4]`/`fmul CONST_3_0` @0x559D06/0x559D09 hoiste `f*3.0` en st(1) pour toute la boucle (dépilé `fstp st` @0x559DE2) ; le slot mémoire est réécrit avec x1 @0x559D53 puis x2 @0x559D6E — le float f n'existe plus en mémoire dès 0x559D53. Représenté dans le C réconcilié par la locale `phase_base` + la var `x2` ; les casts `__int64` de Hex-Rays (v7/v12) masquent ce scratch, forme rejetée au profit de l'explicite.

Résiduel non bloquant : valeurs `flt_C76DAC`/`flt_C76DB0`/`dbl_B69968`/`dbl_B69970` tranchées au niveau R (2.5 / 2.0 / −51200.0 / 1.2π, cf. revue en tête) mais le C réconcilié du pack les laisse symboliques ; bits exacts de `CONST_3_0` non dumpés ; rôle fonctionnel de `sub_4179D8` réduit à begin-frame/ensure-capacity (ABI close).
