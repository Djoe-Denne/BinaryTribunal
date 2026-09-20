# MagicFx_Step_InterpVecGTE_AddSpritePrimOT @ 0x6A0AF0

- Instr (live): 72 (227 o, 0x6A0AF0-0x6A0BD2)
- Palier: 1+P (2 voix + verification parent P)
- Verdict: CERTAIN - step d'anim FX magique (12 frames, blend /12 via magie 2AAAAAABh @0x6A0B06) : interpole par GTE un vecteur global (sub_45E9D0/sub_45EBF0) contre l'etat, construit une prim (descripteur unk_117DC38 @0x6A0B79, compteur @+4, zero +0x24), l'accroche a g_BattleOTBase+0x44 via sub_571C80 (@0x6A0BA0, +44h @0x6A0B99) en chainant dword_2510194, unwind 180 o, incremente word[esi+0Ch] et retourne 0/2 via setl/dec/and 2 (@0x6A0BC6-CB) tant que compteur < 12
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A0AF0\nTYPE ; proposition: MagicFx_Step_InterpVecGTE_AddSpritePrimOT
- Notes parent: checks 5.6 OK (role P) : magie 2AAAAAABh (0x6A0B06), movsx counter (0x6A0B0B), sub_45E9D0/45EBF0 (0x6A0B37/52), unk_117DC38 (0x6A0B79), add eax,44h (0x6A0B99), sub_571C80 (0x6A0BA0), inc + reload counter (0x6A0BB7-BB), setl + and 2 (0x6A0BC6-CB), caller data xref sub_69EF60 @0x69F451 (callers.txt) ; convergence c_a/sem_a ; verdict UNCERTAIN leve par contexte + callers.txt

## C reconcilie

```c
/* ===========================================================================
 * sub_6A0AF0 — voix c_a (C réconcilié depuis l'ASM live)
 * ===========================================================================
 * Ground truth = live ASM (asm.asm @ 0x6A0AF0, 72 instr, taille 0xE3/227),
 * PAS Hex-Rays (hexrays.c = vérificateur seulement).
 *
 * Prototype (Hex-Rays, cohérent avec l'ASM) : int __cdecl sub_6A0AF0(int a1);
 * Sauvegardes : ebx, esi, edi. Local : `sub esp, 8` → var_8 (8 octets,
 * seuls 6 utilisés = 3 mots lus par GteState_GetWord3_1CA8A34).
 *
 * Contexte (indicatif, non prouvé par l'ASM seul) : tâche du stepper MAG213
 * sub_69EF60 (liste 0x25101B8). Émet un primitive GTE/sprite par frame dans
 * l'OT battle ; code retour stepper : 0 tant que le compteur word @ a1+0x0C
 * est < 12, 2 dès qu'il atteint 12 (retours 0/2 steppers).
 *
 * Divergences Hex-Rays corrigées (l'ASM gagne) :
 *   * Hex-Rays : g_BattleOTBase + 17  — ASM live 0x6A0B99 : add eax, 44h
 *     => décalage +0x44 (68), pas 17.
 *   * Hex-Rays : (x << 12) / 12 présenté comme division simple — l'ASM est
 *     une division par magie : imul 0x2AAAAAAB, sar edx,1, puis
 *     shr eax,1Fh / add edx,eax (correction d'arrondi vers zéro pour les
 *     négatifs) => division signée par 12, troncation vers zéro.
 *
 * Conventions d'appel : tous les callees sont cdecl (nettoyage appelant).
 * Les 14 pushes d'arguments sont soldés par un unique `add esp, 38h`
 * à 0x6A0BB4, APRES BattleScratch_Unwind (14 × 4 = 0x38).
 * Retour : EAX complet (0 ou 2) — pas AL only.
 * =========================================================================== */

typedef unsigned short uint16_t_;
typedef unsigned int   uint32_t_;
typedef int            int32_t_;

/* --- Externes nommés par l'ASM/IDA (rôles non ré-inventés) ---------------- */
extern uint32_t_ bs_modulo(uint32_t_ nbytes);            /* 0x5082B0 : alloc frame scratch (0xB4 = 180) */
extern void     BattleScratch_Unwind(uint32_t_ nbytes);  /* 0x6A0BAF : libère (inverse de bs_modulo) */
extern void     GteState_Set_1CA8A30(uint32_t_ v);       /* dword_1CA8A30 = arg */
extern void     GteState_SetWord3_1CA8A34(const void *src); /* copie 3 mots vers l'état GTE */
extern void     GteState_GetWord3_1CA8A34(void *dst);    /* copie 3 mots depuis l'état GTE */
extern void     sub_45E9D0(void);                        /* op GTE #1 (rôle non prouvé ici) */
extern void     sub_45EBF0(void);                        /* op GTE #2 (rôle non prouvé ici) */
extern void     sub_571BC0(const void *p, uint32_t_ w, int32_t_ q);
extern uint32_t_ sub_571C80(const void *prim, uint32_t_ otEntry, uint32_t_ n, uint32_t_ chain);

extern uint32_t_ dword_2510178;   /* base ; +0x1648 = vecteur 3 mots global */
extern uint32_t_ dword_2510194;   /* chaîne primitives / OT cursor */
extern uint32_t_ g_BattleOTBase;  /* base OT battle ; entrée +0x44 ici */
extern uint32_t_ unk_117DC38;     /* tag/données primitive (pointeur stocké tel quel) */

/* --- Struct a1 (offsets prouvés par l'ASM) --------------------------------
 * +0x0C : word  compteur, incrémenté à chaque appel, fini à 12
 * +0x10 : word[3] vecteur poussé dans l'état GTE
 * +0x16 : word  paramètre (poussé zero-extend en arg2, sar 2/neg en arg3)
 * -------------------------------------------------------------------------- */
#define A1_COUNTER 0x0C
#define A1_VEC3    0x10
#define A1_W16     0x16

int __cdecl sub_6A0AF0(int a1)
{
    uint16_t_ var_8[3];   /* [esp+..] local 8 octets : 3 mots lus du GTE */

    /* 0x6A0AF6 : alloc scratch 0xB4 = 180 octets ; pointeur -> EAX -> EDI */
    uint8_t *prim = (uint8_t *)bs_modulo(0xB4);                     /* 180 */

    /* 0x6A0B06..0x6A0B1D : v2 = ((int16)[a1+0x0C] << 12) / 12
     * (imul magie 0x2AAAAAAB, sar edx,1, fixup signe => div signée /12,
     *  troncation vers zéro — identique à la division C) */
    int32_t_ v2 = ((int32_t_)(int16_t_)*(uint16_t_ *)((uint8_t *)a1 + A1_COUNTER) << 12) / 12;

    GteState_Set_1CA8A30((uint32_t_)v2);                            /* 0x6A0B20 */

    /* 0x6A0B25 : dword_2510178 + 0x1648 (vecteur 3 mots global) */
    GteState_SetWord3_1CA8A34((const void *)(dword_2510178 + 0x1648)); /* 0x6A0B32 */
    sub_45E9D0();                                                   /* 0x6A0B37 */

    /* 0x6A0B3C : seconde pondération = 0x1000 - v2 (complément à 4096) */
    GteState_Set_1CA8A30(0x1000 - (uint32_t_)v2);                   /* 0x6A0B44 */

    /* 0x6A0B49 : vecteur 3 mots depuis a1+0x10 */
    GteState_SetWord3_1CA8A34((const void *)(a1 + A1_VEC3));        /* 0x6A0B4D */
    sub_45EBF0();                                                   /* 0x6A0B52 */

    GteState_GetWord3_1CA8A34(var_8);                               /* 0x6A0B5C : lit 3 mots */

    /* 0x6A0B61 : w = word @ a1+0x16 (arg2 = zero-extend) ;
     * arg3 = -((int16)w >> 2) (sar arithmétique puis neg) */
    {
        uint16_t_ w = *(uint16_t_ *)((uint8_t *)a1 + A1_W16);
        sub_571BC0(var_8, (uint32_t_)w, -(int32_t_)((int32_t_)(int16_t_)w >> 2)); /* 0x6A0B74 */
    }

    /* --- remplissage primitive (buffer 180 octets) ----------------------- */
    *(uint32_t_ *)(prim + 0x00) = (uint32_t_)&unk_117DC38;          /* 0x6A0B79 : tag = offset unk_117DC38 */
    *(uint16_t_ *)(prim + 0x04) = *(uint16_t_ *)((uint8_t *)a1 + A1_COUNTER); /* 0x6A0B7F : copie du compteur */
    *(uint16_t_ *)(prim + 0x24) = 0;                                /* 0x6A0B87 */

    /* 0x6A0B8D..0x6A0BA0 : chainage OT.
     * NOTE : Hex-Rays affiche g_BattleOTBase + 17 ; l'ASM live est
     * `add eax, 44h` => entrée OT = g_BattleOTBase + 0x44. */
    dword_2510194 = sub_571C80(prim,
                               g_BattleOTBase + 0x44,               /* 0x6A0B99 (pas +17 !) */
                               2,                                   /* 0x6A0B9C */
                               dword_2510194);                      /* 0x6A0B8D : ancienne chaîne */

    /* 0x6A0BA5/0x6A0BAF : libère les 180 octets ; l'unique
     * `add esp, 38h` à 0x6A0BB4 solde tous les pushes cdecl d'args. */
    BattleScratch_Unwind(0xB4);                                     /* 180 */

    /* 0x6A0BB7 : ++word[a1+0x0C] ; 0x6A0BBB : cmp si, 0Ch ; setl (signé) ;
     * 0x6A0BC9 : dec eax ; 0x6A0BCB : and eax, 2  => 0 tant que < 12, sinon 2 */
    {
        uint16_t_ *pCnt = (uint16_t_ *)((uint8_t *)a1 + A1_COUNTER);
        ++*pCnt;                                                    /* 0x6A0BB7 */
        /* cmp si, 0Ch + setl : comparaison SIGNED sur 16 bits */
        return ((int32_t_)(int16_t_)*pCnt < 12) ? 0 : 2;
    }
}

/* --- UNCERTAIN -------------------------------------------------------------
 * // UNCERTAIN 0x6A0AF0 Quel est le rôle exact de sub_45E9D0 et sub_45EBF0
 *   (opérations GTE présumées d'après leur position entre SetWord3/GetWord3 ;
 *    aucun commentaire IDA ni proto dans callees.txt pour trancher) ?
 * // UNCERTAIN 0x6A0AF0 Quelle est la sémantique du vecteur 3 mots global
 *   dword_2510178+0x1648 et du paramètre word @ a1+0x16 (poids de blend
 *   présumé via 0x1000-v2 et le sar 2/neg) ?
 * // UNCERTAIN 0x6A0AF0 Structure complète de la primitive écrite par
 *   sub_571BC0/var_8 (seul le tag @+0, counter @+4, word 0 @+0x24 sont
 *   prouvés par l'ASM).
 * --------------------------------------------------------------------------- */
```

## Analyse semantique

# Sémantique sub_6A0AF0 @ 0x6A0AF0 (analyse A, mode B aveugle)

- Rôle (1 phrase) : step d'animation d'un effet magique battle (tâche MAG213, fnptr appelée depuis sub_69EF60) : interpole via GTE un vecteur global contre un vecteur d'état selon la progression frame/12, construit un prim sprite et l'attache à l'OT battle, puis incrémente le compteur de frames et signale la fin par retour 0/2.

- Confiance : LIKELY (barème CERTAIN non atteint — voir "Pourquoi pas CERTAIN")

- Nom catalogue : absent (sub_6A0AF0, sans nom ni CMT dans meta.json).
  Proposition (markdown seul, PAS de rename) : `MagicFx_Step_InterpVecGTE_AddSpritePrimOT`

- In / Out / Effets :
  - In (cdecl, 1 arg, à [esp+18h] après prologue sub esp,8 + 3 pushes + ret) : `arg0` = pointeur (esi) vers état FX ≥ 0x26 octets :
    - `word [esi+0Ch]` : compteur de frames (lu, incrémenté, testé vs 0x0C)
    - `[esi+10h]` : vecteur 3 mots source locale (chargé dans l'état GTE)
    - `word [esi+16h]` : mot angle/taille (poussé 2× à sub_571BC0, 2e copie = -(short)v >> 2)
  - Out : retour EAX (largeur effective AL/0..2) : `0` tant que `word[esi+0Ch] < 12` (continue), `2` une fois le compteur atteint 12 (fini). Séquence 0x6A0BBB-0x6A0BCB : `mov si,[esi+0Ch]; xor eax,eax; cmp si,0Ch; setl al; dec eax; and eax,2` — signé (`setl`), conforme aux retours 0/2 des steppers.
  - Effets :
    - scratch battle : `push 0xB4; call bs_modulo` @0x6A0AF6-0x6A0AFB → buffer 0xB4 octets (edi), libéré par `push 0xB4; call BattleScratch_Unwind` @0x6A0BA5-0x6A0BAF (paire symétrique, bump dword_1D999C4).
    - état GTE dword_1CA8A30 : t = (frame<<12)/12 en Q12 (magic `imul 0x2AAAAAAB; sar 1` = division signée par 12, @0x6A0B06-0x6A0B1D), puis `0x1000 - t` @0x6A0B3C-0x6A0B44 (échelles complémentaires, 0x1000 = 1.0 Q12).
    - vecteur 3 mots `dword_2510178+0x1648` → GteState_SetWord3 @0x6A0B25-0x6A0B32 ; vecteur `[esi+10h]` → GteState_SetWord3 @0x6A0B49-0x6A0B4D ; ops GTE sub_45E9D0 @0x6A0B37 et sub_45EBF0 @0x6A0B52 ; résultat 3 mots → var_8 via GteState_GetWord3 @0x6A0B57-0x6A0B5C.
    - prim (edi) : `[edi] = offset unk_117DC38` (descripteur statique) @0x6A0B79 ; `[edi+4] = word[esi+0Ch]` @0x6A0B7F-0x6A0B83 ; `word [edi+24h] = 0` @0x6A0B87.
    - sub_571BC0(&var_8, word[esi+16h], -(short)word[esi+16h]/4) @0x6A0B61-0x6A0B74 (args cdecl droite→gauche : edx calculé 0x6A0B65-0x6A0B6D poussé en 1er).
    - insertion OT @0x6A0B8D-0x6A0BA5 : push dword_2510194 ; push `g_BattleOTBase+0x44` ; push 2 ; push edi ; call sub_571C80 ; `mov dword_2510194, eax` — l'OT+0x44 reçoit le prim, la tête de chaîne dword_2510194 est mise à jour avec le tag retourné.
    - `inc word [esi+0Ch]` @0x6A0BB7 : avance le compteur de frames (durée totale 12 frames).

- Preuves (3–8, ASM cité) :
  1. @0x6A0AF6/0x6A0AFB vs @0x6A0BA5/0x6A0BAF : paire bs_modulo(0xB4) / BattleScratch_Unwind(0xB4) autour de tout le corps → buffer prim à durée de frame, pas d'allocation persistante.
  2. @0x6A0B0B-0x6A0B1D : `movsx ecx, word [esi+0Ch]; shl ecx,0Ch; imul ecx` (eax=0x2AAAAAAB) `; sar edx,1; shr eax,1Fh; add edx,eax` → t = frame×4096/12 en Q12 ; complément `mov edx,1000h; sub edx,ebx` @0x6A0B3C-0x6A0B41 → interpolation bornée sur 12 frames.
  3. @0x6A0B25-0x6A0B4D : deux SetWord3 (dword_2510178+0x1648 puis [esi+10h]) encadrant sub_45E9D0/sub_45EBF0, résultat relu par GteState_GetWord3 @0x6A0B5C dans var_8 → calcul vectoriel GTE à deux entrées, échelles t / (1−t).
  4. @0x6A0B79-0x6A0B87 : `[edi] = offset unk_117DC38`, `[edi+4] = cx` (compteur), `[edi+24h] = 0` → le prim embarque un descripteur statique partagé + l'index de frame courant.
  5. @0x6A0B8D-0x6A0BA5 : `push dword_2510194; add eax,44h; push 2; push eax; push edi; call sub_571C80; mov dword_2510194, eax` → accrochage OT à g_BattleOTBase+0x44 avec chaînage via dword_2510194 (converge avec le contexte fourni).
  6. @0x6A0BBB-0x6A0BCB : `inc word [esi+0Ch]; cmp si,0Ch; setl al; dec eax; and eax,2` → protocole de retour stepper 0 (en cours) / 2 (terminé), signé.
  7. callers.txt : unique xref = data @0x69F451 dans sub_69EF60 (0xbcb octets) → pointeur de fonction dans une table, cohérent avec le stepper MAG213 / liste 0x25101B8 du contexte ; aucun autre caller.

- Checks :
  - Callees cités tous présents dans callees.txt : bs_modulo, GteState_Set_1CA8A30, GteState_SetWord3_1CA8A34, sub_45E9D0, sub_45EBF0, GteState_GetWord3_1CA8A34, sub_571BC0, sub_571C80, BattleScratch_Unwind — OK.
  - Strides/constantes en nombres : 0xB4 (taille scratch/prim), 0x1648 (offset vecteur global), 0x0C/12 (durée frames), 0x1000 (1.0 Q12), 0x44 (offset OT), +0x0C/+0x10/+0x16/+0x24 (champs état/prim) — OK.
  - Polarités : setl signé (fin à compteur ≥ 12) ; `neg edx` sur (angle>>2) ; échelles complémentaires t / 0x1000−t — OK.
  - Largeur retour : eax complet calculé (0 ou 2), valeur portée par AL — conforme « retours steppers AL » — OK.
  - Pas de library call inventé ; les rôles de sub_571BC0/sub_571C80 sont déduits des seuls patterns d'appel (aucun prototype fourni).

- Pourquoi pas CERTAIN (malgré mode 1+P) : la jambe « wiki » du barème manque — wiki.md du pack est en échec (`qmd failed`) et ma recherche QMD lecture-seule sur `ff8-wiki` ne contient aucune page couvrant 0x6A0AF0 ni sub_571BC0/sub_571C80. Callers + callees + opcodes sont parfaitement alignés et convergent avec les constantes du contexte (g_BattleOTBase+0x44, dword_2510194, retours 0/2, MAG213 0x69EF60), mais la sémantique exacte de sub_571BC0 (construction sprite vs autre prim) reste inférée. J'écris donc LIKELY plutôt qu'UNCERTAIN (le mécanisme ASM est déterminé opcode par opcode) et je refuse CERTAIN faute de convergence wiki.

- Questions ouvertes :
  1. Rôle exact de sub_571BC0 (build sprite texturé ? rotation ?) et de sub_45E9D0/sub_45EBF0 (quelles ops GTE précises) — à lever en analyse croisée non-aveugle.
  2. Signification du descripteur unk_117DC38 (texture page ? table d'anim ?) et de la valeur 2 poussée à sub_571C80 (nb de prims ? type de blend ?).
  3. Sémantique de dword_2510178+0x1648 (position caster ? ancre effet ?) et de dword_2510194 (tête de liste prims FX persistante vs tag OT).
  4. Les 2 autres steppers éventuels de la liste 0x25101B8 retournent-ils le même protocole 0/2 (à confirmer pour généraliser le nom proposé) ?

- IDBCOMMENT (proposition, FR sans accents) :
  Step d'effet magique MAG213 : interpole par GTE le vecteur global dword_2510178+0x1648 avec celui de l'etat (esi+10h) selon la progression (frame<<12)/12, construit un prim sprite avec le descripteur unk_117DC38 et le mot esi+16h, puis l'accroche a l'OT g_BattleOTBase+0x44 en chainant dword_2510194. Incremente le compteur esi+0Ch et retourne 0 tant que frame<12, 2 quand l'animation de 12 frames est terminee. [semantic-triple 2026-09-20]
