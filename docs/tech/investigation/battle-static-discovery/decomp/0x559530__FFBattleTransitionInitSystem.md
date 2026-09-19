# FFBattleTransitionInitSystem @ 0x559530

- Instr: 87 (0x559530..0x559684, 341 octets)
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=CERTAIN, R=CERTAIN)
- Callers: 2 xrefs data 0x470B3F/0x470D55 (callback init desc[2], installé par main::FFModuleHandler_main_loop) ; aucun appel direct
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, table résolution tranchée (modes 1|2 → 640×448, autre → 640×480), misnomer ENGINE_VAR1_RELATED_MUSIC documenté (lecteurs video/field, zéro musique)

## C réconcilié

```c
/* ============================================================================
 * c_reconciled.c — FFBattleTransitionInitSystem @ 0x559530 (FF8_EN.exe, base 0x400000)
 * Réconciliation A/B (triple GLM) — arbitrage contre asm.asm (ground truth live).
 *
 * Métadonnées :
 *   Instr (live) : 87 (0x559530..0x559684, 341 octets)
 *   Palier       : pack triple GLM, dossier tools/_tmp_semantic_triple/0x559530/
 *   Type IDA     : DWORD __cdecl FFBattleTransitionInitSystem(int)
 *   Sauveg.      : ebp (559530/559531 frame), esi (push 559533, pop 559650 —
 *                  AVANT le jnz 559651, porteur de la hauteur v_h à travers
 *                  tous les chemins de dispatch)
 *   Retour       : EAX 32 bits = horodatage timeGetTime() sur LES DEUX sorties
 *                  (retn 55966b et 559684) ; même valeur copiée dans
 *                  dword_204DB34. Jamais AL seul.
 *   setcc/jpt    : AUCUN setcc, AUCUNE jump table (pas de jpt_/def_).
 *
 * Corrections/add esp vérifiés :
 *   55953E add esp,4    (sub_460B60, 1 arg dword)
 *   —      (rien)       (sub_47CC70, 0 arg)
 *   55964B add esp,10h  (SetResolution, 4 args dword)
 *   55965C add esp,4    (BattleTransition_InitScanlinesNormal, 1 arg)
 *   559675 add esp,4    (BattleTransition_CaptureBoss, 1 arg)
 *
 * Table des 5 configs résolution — TRANCHÉ contre l'ASM (recolle des branches
 * 559555..559637) : mode 1 ET mode 2 → bloc 640x448 dupliqué (0x559568 et
 * 0x5595A2, valeurs ET code identiques) ; basse-res des modes 1/2 converge
 * physiquement vers loc_5595C6 (320x224) ; « autre » (ni 1 ni 2) → 640x480
 * hi-res (loc_5595F1) / 320x240 (loc_559612). B avait l'association correcte.
 * ============================================================================
 */

#include <stdint.h>
#ifndef DWORD
#define DWORD uint32_t
#endif

/* --- Externes nommés (rôles prouvés par le pack ; sub_ sinon) --------------- */
extern void    common_texture_related_sub_460B60(uint32_t); /* 0x460B60 cdecl, 1 arg dword ; ASM pousse 3F800000h = bit pattern de 1.0f */
extern int32_t sub_47CC70(void);                           /* 0x47CC70 cdecl, 0 arg -> latch bossBattle */
extern void    SetResolution(int32_t x, int32_t y, int32_t w, int32_t h); /* cdecl, add esp,10h @55964B */
extern void    BattleTransition_InitScanlinesNormal(int32_t); /* seed scanbuf ends + midpoint gen + capture ; chemin normal SEUL */
extern void    BattleTransition_CaptureBoss(int32_t);      /* capture only, NO scanlines (boss path) */
extern DWORD   __stdcall timeGetTime(void);                /* winmm, import IAT ds:timeGetTime */

/* --- Globaux ---------------------------------------------------------------- */
extern int32_t  ENGINE_VAR1_RELATED_MUSIC; /* discriminant de mode (nom IDA suspect — dispatch vidéo, valeurs 1 / 2 / autre) */
extern int32_t  High_resolution;           /* testé zéro/non-zéro uniquement (test eax,eax), jamais ==1 */
extern int32_t  bossBattle;                /* latch du retour de sub_47CC70 */
extern int32_t  transitionTimer;           /* remis à 0 à chaque init de transition */
extern int32_t  screen_x;                  /* largeur (320/640) */
extern int32_t  screen_y;                  /* hauteur (224/240/448/480) */
extern int32_t  dword_204DB2C;             /* miroir arg1 SetResolution */
extern int32_t  dword_204DB30;             /* miroir arg2 SetResolution */
extern uint32_t dword_204DB34;             /* horodatage timeGetTime() du lancement */

/* ============================================================================
 * C réconcilié — fidèle à l'ASM live.
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays.
 * NOTE : Hex-Rays fusionne le bloc dupliqué 0x5595A2 dans le 0x559568 (LABEL_3)
 * et rend l'arg de sub_460B60 comme littéral 1.0 (double). ASM gagne : les
 * deux blocs 640x448 sont conservés explicites, l'arg est le dword 3F800000h.
 * L'épilogue timeGetTime est DUPLIQUÉ dans le binaire (55965F..55966B chemin
 * normal, 559678..559684 chemin boss — séquences identiques) ; factorisé ici,
 * sémantiquement équivalent (les deux chemins exécutent le même travail).
 * ============================================================================
 */
DWORD __cdecl FFBattleTransitionInitSystem(int arg_0 /* [ebp+arg_0] */)
{
    int eax, ecx, edx, esi; /* registres porteurs du dispatch, revue 1:1 vs asm */

    /* 559534 push 3F800000h (; float = 1.0f) / 559539 call / 55953E add esp,4
     * Forme retenue : bit pattern dword (fidèle au texte ASM). Identique bit à
     * bit à un push de 1.0f — même dword 0x3F800000. */
    common_texture_related_sub_460B60(0x3F800000u /* ; float 1.0f */);

    /* 559541 call sub_47CC70 (0 arg, pas d'add esp) / 559546 mov bossBattle, eax */
    bossBattle = sub_47CC70();

    /* 55954B mov transitionTimer, 0 */
    transitionTimer = 0;

    /* --- Dispatch résolution (559555..559637) ------------------------------- */
    if (ENGINE_VAR1_RELATED_MUSIC == 1)          /* 559555 cmp,1 / 55955D jnz short loc_55958F */
    {
        if (High_resolution == 0)                /* 55955F mov eax / 559564 test / 559566 jz short loc_5595C6 */
            goto loc_5595C6;                     /* basse rés partagée modes 1 et 2 : 320x224 */

        /* 0x559568 — hi-res type A : 640x448, offset (0,16) */
        eax = 0;                                 /* 559568 xor eax, eax */
        ecx = 0x10;                              /* 55956A mov ecx, 10h */
        edx = 0x280;                             /* 55956F mov edx, 280h */
        dword_204DB2C = eax;                     /* 559574 -> 0 */
        dword_204DB30 = ecx;                     /* 559579 -> 16 */
        screen_x      = edx;                     /* 55957F -> 640 */
        esi = 0x1C0;                             /* 559585 mov esi, 1C0h (448) */
        goto loc_559637;                         /* 55958A jmp near loc_559637 */
    }

    /* loc_55958F — 2e dispatch.
     * Ordre fidèle : 559597 mov eax, High_resolution intercalé ENTRE le cmp
     * (55958F) et le jnz (55959C) — mov sans effet flags, le jnz teste le cmp. */
    if (ENGINE_VAR1_RELATED_MUSIC == 2)          /* 55958F cmp,2 / 55959C jnz short loc_5595ED */
    {
        if (High_resolution == 0)                /* 55959E test eax,eax / 5595A0 jz short loc_5595C6 */
            goto loc_5595C6;

        /* 0x5595A2 — DUPLIQUE exactement 0x559568 (Hex-Rays le fusionne en
         * LABEL_3 ; ici conservé explicite, fidèle au binaire). */
        eax = 0;                                 /* 5595A2 xor eax, eax */
        ecx = 0x10;                              /* 5595A4 mov ecx, 10h */
        edx = 0x280;                             /* 5595A9 mov edx, 280h */
        dword_204DB2C = eax;                     /* 5595AE -> 0 */
        dword_204DB30 = ecx;                     /* 5595B3 -> 16 */
        screen_x      = edx;                     /* 5595B9 -> 640 */
        esi = 0x1C0;                             /* 5595BF mov esi, 1C0h (448) */
        goto loc_559637;                         /* 5595C4 jmp short loc_559637 */
    }

    /* loc_5595ED — 3e dispatch (mode ni 1 ni 2) ; eax = High_resolution (559597) */
    if (High_resolution != 0)                    /* 5595ED test eax,eax / 5595EF jz short loc_559612 */
    {
        /* 0x5595F1 — hi-res type B : 640x480, offset (0,0) — DIFFÉRENT du type
         * A : dword_204DB30 = 0 (pas 16) et hauteur 480 (pas 448). */
        eax = 0;                                 /* 5595F1 xor eax, eax */
        ecx = 0;                                 /* 5595F3 xor ecx, ecx */
        edx = 0x280;                             /* 5595F5 mov edx, 280h */
        dword_204DB2C = eax;                     /* 5595FA -> 0 */
        dword_204DB30 = ecx;                     /* 5595FF -> 0 */
        screen_x      = edx;                     /* 559605 -> 640 */
        esi = 0x1E0;                             /* 55960B mov esi, 1E0h (480) */
        goto loc_559637;                         /* 559610 jmp short loc_559637 */
    }

    /* loc_559612 — « autre », basse résolution : 320x240, offset (160,120) */
    eax = 0xA0;                                  /* 559612 mov eax, 0A0h (160) */
    ecx = 0x78;                                  /* 559617 mov ecx, 78h 'x' (120) */
    edx = 0x140;                                 /* 55961C mov edx, 140h (320) */
    dword_204DB2C = eax;                         /* 559621 -> 160 */
    dword_204DB30 = ecx;                         /* 559626 -> 120 */
    screen_x      = edx;                         /* 55962C -> 320 */
    esi = 0xF0;                                  /* 559632 mov esi, 0F0h (240) */
    /* 559637 : tombant (pas de jmp — fin du bloc) */

loc_5595C6:                                      /* partagé modes 1/2 en basse rés */
    eax = 0xA0;                                  /* 5595C6 mov eax, 0A0h (160) */
    ecx = 0x80;                                  /* 5595CB mov ecx, 80h (128) */
    edx = 0x140;                                 /* 5595D0 mov edx, 140h (320) */
    dword_204DB2C = eax;                         /* 5595D5 -> 160 */
    dword_204DB30 = ecx;                         /* 5595DA -> 128 */
    screen_x      = edx;                         /* 5595E0 -> 320 */
    esi = 0xE0;                                  /* 5595E6 mov esi, 0E0h (224) */
    /* 5595EB jmp short loc_559637 */

loc_559637:                                      /* join unique */
    /* 559637..55963A : push esi, push edx, push ecx, push eax
     * => args cdecl droite->gauche : (eax=v_x, ecx=v_y, edx=v_w, esi=v_h) */
    screen_y = esi;                              /* 55963B mov screen_y, esi — APRÈS les pushes, AVANT le call */
    SetResolution(eax, ecx, edx, esi);           /* 559641 call / 55964B add esp,10h */

    /* 559646 mov eax, bossBattle / 55964E test eax,eax / 559650 pop esi / 559651 jnz */
    if (bossBattle == 0)
    {
        /* Chemin normal : seed scanbuf ends + midpoint gen + capture */
        /* 559653 mov eax,[ebp+arg_0] / 559656 push / 559657 call / 55965C add esp,4 */
        BattleTransition_InitScanlinesNormal(arg_0);
    }
    else
    {
        /* Chemin boss : capture SEULE, AUCUNE scanline (pas de InitScanlinesNormal) */
        /* 55966C mov ecx,[ebp+arg_0] / 55966F push / 559670 call / 559675 add esp,4 */
        BattleTransition_CaptureBoss(arg_0);
    }

    /* Épilogue DUPLIQUÉ dans le binaire (normal: 55965F..55966B ; boss:
     * 559678..559684) — séquences identiques, factorisées ici :
     * 55965F|559678 call ds:timeGetTime / 559665|55967E mov dword_204DB34, eax
     * 55966A|559683 pop ebp / 55966B|559684 retn — EAX = horodatage 32 bits. */
    dword_204DB34 = timeGetTime();
    return dword_204DB34;                        /* retn avec EAX plein, jamais AL seul */
}
```

## Preuves et validation parent

1. **Xrefs data callback** : `XrefsTo(0x559530)` = 2 xrefs data `0x470B3F`/`0x470D55` depuis `main::FFModuleHandler_main_loop` (0x4706B0) — installation de callback init desc[2], pas d'appel direct.
2. **sub_460B60 = clamp fondu [0,1]**, prouvé par sonde du corps complet `0x460B60–0x460BA6` : clamp de l'arg float à [0.0 (flt_B69568), 1.0 (CONST_1_0 @ 0xB69544, lu = 1.0)], puis `fst flt_1CA9E9C` (valeur clampée) et `fld 1.0; fsub st,st(1); fstp flt_B7CEE4` (= 1 − x) — setter de fondu/opacité. Ici appelé avec 1.0f = fondu à l'état plein en init de transition.
3. **bossBattle = sub_47CC70** : `559541 call sub_47CC70` (0 arg, pas d'add esp) / `559546 mov bossBattle, eax` ; bifurcation `test eax,eax` / `jnz` @ 0x55964E–0x559651 → bossBattle != 0 → `BattleTransition_CaptureBoss` (capture only, NO scanlines), == 0 → `BattleTransition_InitScanlinesNormal` (seed scanbuf + midpoint gen + capture). Aucun setcc dans la fonction.
4. **Table 5 configs** avec offsets 0x559568/0x5595A2/0x5595F1 : bloc mode 2 hi-res `0x5595A2–0x5595C4` est identique octet-pour-octet en constantes au bloc mode 1 `0x559568–0x55958A` → (0, 0x10, 640, 448) ; basse-res modes 1/2 converge physiquement vers loc_5595C6 (160,128,320,224) via deux `jz short loc_5595C6` distincts (559566, 5595A0) ; « autre » hi-res → 0x5595F1 (0,0,640,480), seul bloc 640-large avec offset y=0 et hauteur 480 ; « autre » basse-res → loc_559612 (160,120,320,240).
5. **Bifurcation test/jnz 0x55964E** : `test eax,eax` / `jnz` (unsigned-neutral, ZF test, pas de comparaison signée) sur `bossBattle` ; `pop esi` (559650) AVANT le `jnz` (559651) — transparent en C.
6. **timeGetTime → 0x204DB34 sur les 2 chemins** : épilogue dupliqué dans le binaire (normal 55965F–55966B, boss 559678–559684 — séquences identiques) ; `call ds:timeGetTime` / `mov dword_204DB34, eax` ; retour EAX plein = horodatage 32 bits sur les deux `retn` (0x55966B / 0x559684), jamais AL seul — non contractuel, sémantiquement void.

## Divergences

- **Table des 5 configs (B mal recollé le jnz mode 2)** : B lisait le `jnz loc_5595ED` @ 0x55959C comme « mode 2 prend le chemin ED » (mode 2 → 640×480). L'ASM tranche : le `jnz` ne saute que si mode ≠ 2 ; le bloc mode 2 hi-res 0x5595A2–0x5595C4 charge `ecx=10h, esi=1C0h` (640×448), identique au bloc mode 1. Association tranchée : modes 1|2 → 640×448 (hi-res) / 320×224 (SD), autre → 640×480 (hi-res) / 320×240 (SD). A n'avait pas d'association fausse en substance ; tranché ligne à ligne contre l'ASM.
- **Hex-Rays fusionne le bloc dupliqué** : Hex-Rays fusionne 0x5595A2 dans 0x559568 (LABEL_3). Le binaire contient les deux blocs physiquement (valeurs ET code identiques) — conservés explicites dans le C réconcilié. (Hex-Rays est par ailleurs correct sur la structure de la table — vérificateur, pas source.)
- **Arg 1.0f vs double** : l'ASM pousse `push 3F800000h ; float` (un seul dword, `add esp,4`) ; Hex-Rays rend `1.0` (littéral double), inexact en forme. Le C réconcilié passe `0x3F800000u /* ; float 1.0f */` — bit-identique à un push de 1.0f ; les deux voix compilent au même push, aucune divergence sémantique, choix de forme arbitré vers l'ASM.
- Annexe : épilogue timeGetTime dupliqué dans le binaire, factorisé en C (sémantiquement équivalent) ; misnomer `ENGINE_VAR1_RELATED_MUSIC` conservé verbatim (pas de rename IDA), lecteurs = video/field layout, zéro consommateur musique — proposition `ENGINE_MODE_VAR_VIDEO_LAYOUT` (hors pouvoir du pack).
