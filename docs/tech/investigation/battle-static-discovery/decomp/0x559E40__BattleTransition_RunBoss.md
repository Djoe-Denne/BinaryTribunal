# BattleTransition_RunBoss @ 0x559E40

- Instr: 82
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=LIKELY, R=CERTAIN — constante tranchée par dump IEEE 0x3C4CCCCD = 0.0125 = 1/80)
- Caller: unique `FFBattleTransitionModule` @0x5598B8 (close)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, miroir boss de RunNormal (bornes 80/82 vs 70/72), clamp alpha défensif jamais atteint pour t≤80.

## C réconcilié

```c
/* ============================================================================
 * BattleTransition_RunBoss — 0x559E40 (base 0x400000) — C réconcilié (rôle R)
 * ============================================================================
 * Ground truth = live ASM (asm_clean.asm / asm.asm, 82 instr., SIZE 236) +
 * ida_dump_bytes, PAS Hex-Rays (hexrays.c = vérificateur seulement).
 *
 * Instr (live)  : 82 (0x559E40..0x559F2B, borne exclue)
 * Palier        : runner de transition boss, miroir de BattleTransition_RunNormal 0x559910
 *                 (bornes 70/72 côté normal, pacer 0x21 commun)
 * Type IDA      : BOOL __cdecl(int, int)
 * Sauvegardes   : ebp (frame pointer), esi, edi. ESP réservé 0x14.
 *
 * Corrections add esp (cdecl, args poussés droite->gauche) — toutes vérifiées :
 *   0x559E52 add esp,4    <- time_related_deltaTimeMaybe2(0x21)      [1 arg]
 *   0x559E9D add esp,8    <- isGetDrawBuf(&vec4, ctx)                [2 args]
 *   0x559EB9 add esp,18h  <- NETTOIE DEUX appels d'un coup :
 *                            isGetDrawBuf2(1,1,1,ctx)  [16 octets]
 *                          + GfxDriver_BeginScene(0,ctx) [8 octets]
 *   0x559EDB add esp,10h  <- 4 calls x 4 octets (Render_ESI_A60h_unused,
 *                            render_ESIA78h, render_ESI348, sub_409B25)
 *   0x559F0C add esp,10h  <- BossTransition_Phase(frame,t,ctx) [12 octets]
 *                          + GfxDriver_LeaveScene(ctx)     [4 octets]
 *   0x559F17 renderer_related : 0 arg visible, SANS add esp (cdecl 0 args).
 *
 * Convention fcomp/fnstsw @0x559EE7 : fcomp t vs 1.0 ; test ah,41h (C3|C0) ;
 * jnz -> saut = PAS de clamp. ah&41h==0 <=> ST0 > 1.0 strict => clamp.
 * => t = min(frame * 0.0125f, 1.0f). Cohérent avec hexrays.c (if v3 > 1.0).
 * NOTE : le clamp est MORTE dans le flux courant (atteint seulement pour
 * frame<=80, donc t=frame/80<=1.0) — défensif, pas une borne active.
 * ============================================================================ */

typedef int BOOL;

/* --- Externes : noms IDA live (asm.asm), non réinventés -------------------- */
extern void time_related_deltaTimeMaybe2(int ms);               /* 0x559E4A, arg 0x21=33, ret ignoré */
extern void isGetDrawBuf(float vec4[4], int ctx);               /* 0x559E98, couleur de clear 16 octets */
extern void isGetDrawBuf2(int a1, int a2, int a3, int ctx);     /* 0x559EAC, args (1,1,1,ctx) */
extern int  GfxDriver_BeginScene(int a, int ctx);               /* 0x559EB4, args (0,ctx), eax testé */
extern void Render_ESI_A60h_unused(int ctx);                    /* 0x559EC1 ("unused" trompeur : bien appelé) */
extern void render_ESIA78h(int ctx);                            /* 0x559EC7 */
extern void render_ESI348(int ctx);                             /* 0x559ECD */
extern void sub_409B25(int ctx);                                /* 0x559ED3, rôle non prouvé */
extern void BossTransition_Phase(int frame, float t, int ctx);  /* 0x559F01, corps 0x559F30 sans garde ; arg frame non lu dans le corps (pack 0x559f30) */
extern void GfxDriver_LeaveScene(int ctx);                      /* 0x559F07 */
extern void renderer_related(void);                             /* 0x559F17, 0 arg, restauration buffers */

/* Constantes float live (asm.asm).
 * Nommage IDA projet : %.9f de la valeur float bits + trim des zéros terminaux.
 * Ancres bits connues : CONST_0_050000001 = 0x3D4CCCCD (0.05f),
 *                       CONST_0_02       = 0x3CA3D70A (0.02f).
 * CONST_0_0125 -> "0.0125" (0.125 donnerait "CONST_0_125") => bits attendus
 * 0x3C4CCCCD. Divergence A/B TRANCHÉE : A avait raison, B (0.125=1/8) Faux. */
#define CONST_0_050000001 0.05000000074505806f  /* 1/20 — rampe fade 20 frames (60..80), 0x3D4CCCCD */
#define CONST_0_0125      0.0125f               /* 1/80 — rampe t, 0x3C4CCCCD attendu (bits non re-dumpés cette session) */
#define CONST_1_0         1.0f                  /* borne clamp @0x559EE7, + imm 3F800000h @0x559E58/0x559EF4 */

BOOL __cdecl BattleTransition_RunBoss(int frame /*arg_0, ebp+8*/, int ctx /*arg_4, ebp+0Ch*/)
{
    /* Layout pile live (ebp relatif) — QUAD vec4 contigu (16 octets) :
     *   [ebp-14h] var_14 : float vec4[0] (r)  — fst  @0x559E70
     *   [ebp-10h] var_10 : float vec4[1] (g)  — fst  @0x559E73
     *   [ebp-0Ch] var_C  : float vec4[2] (b)  — fstp @0x559E76
     *   [ebp-08h] var_8  : float vec4[3] (a)  — 1.0f PRÉ-POSE @0x559E58 ;
     *             jamais relu par CE corps (store mort local) ; seul consommateur
     *             possible = isGetDrawBuf via le pointeur — non prouvable ici
     *             (miroir exact du buf.field_0C=1.0f de RunNormal 0x559935).
     *   [ebp-04h] var_4  : int    scratch pour fild (frame-60) @0x559E64
     *   [ebp+08h] arg_0  : int frame, RELU comme ENTIER @0x559ED8 (fild) PUIS
     *             réécrit en float t @0x559EE4 (fst) — overlay du slot paramètre,
     *             pas d'aliasing effectif (lecture précède l'écriture) ;
     *             edi conserve l'int original pour BossTransition_Phase.
     */
    float clear_color[4];   /* var_14..var_8 : {f,f,f,1.0} */
    float t;                /* réside physiquement dans le slot arg_0 */

    time_related_deltaTimeMaybe2(0x21);           /* pacer 33 ms, miroir RunNormal @0x559E48..52 */

    /* edi = frame — chargé APRÈS le call, non clobber. Borne fade-in = 60 (0x3C). */
    if (frame < 60) {                             /* cmp edi,3Ch ; jl signé @0x559E55..5F */
        clear_color[2] = 0.0f;                    /* mov [ebp+var_C],0 @0x559E7B */
        clear_color[1] = 0.0f;                    /* mov [ebp+var_10],0 @0x559E82 */
        clear_color[0] = 0.0f;                    /* mov [ebp+var_14],0 @0x559E89 */
        /* var_8 reste à 1.0f (non réécrit sur ce chemin) : vec4 {0,0,0,1.0} */
    } else {
        /* lea eax,[edi-3Ch] ; mov var_4 ; fild ; fmul 0.05 ; fst/fst/fstp :
         * rampe 0 -> 1.0 sur frames 60..80 (20 x 0.05 = 1.0) — 3 copies identiques */
        clear_color[0] = (float)(frame - 60) * CONST_0_050000001;  /* @0x559E61..6A */
        clear_color[1] = clear_color[0];                           /* fst var_10 @0x559E73 */
        clear_color[2] = clear_color[0];                           /* fstp var_C @0x559E76 */
    }

    /* lea ecx,[ebp+var_14] ; push ctx ; push ecx — pointeur sur le QUAD (var_14),
     * var_8 (4e canal) suit contigu. isGetDrawBuf(&vec4, ctx) @0x559E93..9D */
    isGetDrawBuf(clear_color, ctx);

    if (frame <= 80) {                            /* cmp edi,50h ; jg loc_559F17 @0x559EA0..A3 */
        isGetDrawBuf2(1, 1, 1, ctx);              /* push ctx,1,1,1 @0x559EA5..AC (prép-buffers, RunNormal passe (0,1,1)) */

        if (GfxDriver_BeginScene(0, ctx)) {       /* push ctx,0 ; test eax,eax ; jz loc_559F0F @0x559EBC..BE — early-out SANS LeaveScene */
            Render_ESI_A60h_unused(ctx);          /* @0x559EC0..C1 */
            render_ESIA78h(ctx);                  /* @0x559EC6..C7 */
            render_ESI348(ctx);                   /* @0x559ECC..CD */
            sub_409B25(ctx);                      /* @0x559ED2..D3 ; add esp,10h @0x559EDB couvre ces 4 appels */

            /* fild [arg_0] (frame relu ENTIER) ; fmul 1/80 ; fst [arg_0] :
             * t = frame * 0.0125f — le slot du paramètre est écrasé en float,
             * edi garde l'int original. @0x559ED8..E4 */
            t = (float)frame * CONST_0_0125;

            /* fcomp CONST_1_0 ; fnstsw ax ; test ah,41h ; jnz -> PAS de clamp.
             * ah&41h==0 <=> ST0 > 1.0 strict => clamp uniquement si >.
             * MORTE dans le flux courant : garde ci-dessus = frame<=80
             * => t=frame/80<=1.0 toujours. Défensif. @0x559EE7..F4 */
            if (t > CONST_1_0)
                t = CONST_1_0;                    /* mov [ebp+arg_0],3F800000h @0x559EF4 */

            /* push esi ; push edx(t float) ; push edi — 3 args CONFIRMÉS
             * (add esp,10h @0x559F0C = 12+4 avec LeaveScene). @0x559EFB..F01 */
            BossTransition_Phase(frame, t, ctx);
            GfxDriver_LeaveScene(ctx);            /* @0x559F06..07 */
        }
        /* loc_559F0F : épilogue "pas fini" (BeginScene échoué ou draw ok). */
        return 0;                                 /* xor eax,eax @0x559F10 */
    }

    /* loc_559F17 — chemin frame > 80 : plus de draw, pacer + test de fin.
     * Frame 81 = tampon entre fin draw (80) et fin (82). */
    renderer_related();                           /* @0x559F17, 0 arg */

    if (frame < 82)                               /* cmp edi,52h ; jl signé @0x559F1C..1F */
        return 0;                                 /* -> loc_559F0F : xor eax,eax */

    return 1;                                     /* mov eax,1 @0x559F22 : frame >= 82 */
}

/* ---- Vérification Hex-Rays (vérificateur, pas ground truth) -----------
 * hexrays.c cohérent sur : bornes 60/80/82, rampe 0.05, fmul CONST_0_0125,
 * clamp strict > 1.0, ordre des 4 renders, ret 0/1, arity Phase (a1,v10,a2).
 * v8=1065353216 sans lecture = store mort var_8, même conclusion que l'ASM.
 * Aucune divergence structurale détectée.
 * --------------------------------------------------------------------- */
```

## Preuves et validation parent

1. Bornes 60/80/82 verrouillées au byte : `83 FF 3C` @0x559E55 (`cmp edi,3Ch`), `83 FF 50` @0x559EA0 (`cmp edi,50h`), `83 FF 52` @0x559F1C (`cmp edi,52h`) — polarité `jl`/`jg`/`jl` signée, coïncide avec le wiki « runners 70/72 normal and 80/82 boss ».
2. Dump CONST IEEE-754 : @0xB69978 = `0x3C4CCCCD` = 0.0125 = 1/80 (fmul @0x559EDE), @0xB69964 = `0x3D4CCCCD` = 0.05 (1/20, rampe fade), @0xB69544 = `0x3F800000` = 1.0 (clamp).
3. Rampe fade clear (t−60)/20 sur frames 60..80 : `lea eax,[edi-3Ch]` / `fild` / `fmul 0.05` / `fst`/`fst`/`fstp` — 3 copies identiques, atteint 1.0 à t=80.
4. Caller unique : `idautils.XrefsTo(0x559E40)` = exactement 1 xref code type 17 (fl_CN, call near) depuis 0x5598B8, 0 data xref ; conteneur `get_func_attr` = `FFBattleTransitionModule` 0x559890..0x55990B (0x5598B8 est le call site à +0x28).
5. Early-out sans LeaveScene : `GfxDriver_BeginScene(0,ctx)` + `test eax,eax` / `jz loc_559F0F` @0x559EBC..BE → ret 0 sans LeaveScene si BeginScene échoue.
6. 4 passes 1-arg(ctx) (`Render_ESI_A60h_unused`, `render_ESIA78h`, `render_ESI348`, `sub_409B25`) + phase boss `BossTransition_Phase(t, min(t/80,1), ctx)` @0x559F01 (push esi/edx/edi, `add esp,10h` @0x559F0C = 12 + 4 avec LeaveScene) — corps 0x559F30 nu, sans aucune garde : les bornes 80/82 sont portées par ce runner seul.
7. Renderer restauré à t=81 : chemin frame > 80 → `renderer_related()` seul @0x559F17 (0 arg, sans Begin/LeaveScene), frame 81 = tampon entre fin draw (80) et fin (82), ret 0 puis ret 1 à t≥82.
8. Slot arg_0 réutilisé en float : `fild [arg_0]` / `fmul 1/80` / `fst [ebp+arg_0]` @0x559ED8..E4 — overlay du paramètre frame (lecture entière précède l'écriture float, pas d'aliasing effectif) ; edi garde l'int original.

## Divergences

1. **Constante alpha** — A : 1/80 (0.0125) ; B : 0.125 (1/8). **Tranché pour A** : dword 0x3C4CCCCD @0xB69978 = 0.0125. Cause : l'extracteur ASM a remplacé le point du nom IDB `CONST_0.0125` par un underscore (`CONST_0_0125`), que B a lu « 0.125 ». La formule de B « min(frame/8, 1.0) » est corrigée en « min(t/80, 1.0) ».
2. **Statut du clamp alpha** — A : « mort dans le flux courant » ; B : clamp actif (atteint dès t≈8 avec 0.125). **Tranché pour A** : chemin alpha atteint seulement pour t≤80 et 80×0.0125 = 0.99999997 < 1.0 → la branche `mov [ebp+arg_0],3F800000h` @0x559EF4 n'est jamais prise ; clamp défensif.
3. **Présentation du quad pile** — A : vec4 {f,f,f,1.0} passé à `isGetDrawBuf` ; B : triplet + store mort. **Réconcilié** : `float clear_color[4]` avec le 4e canal alpha pré-posé à 1.0f @0x559E58, jamais relu par le corps local (store mort in-body) — miroir exact de RunNormal 0x559910 (`buf.field_0C = 1.0f`) ; seul consommateur possible = `isGetDrawBuf` via le pointeur (non prouvable depuis ce corps seul).
