# FFBattleTransitionModule @ 0x559890

- Instr (live): 41
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=41
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=26
- A==B: non
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=CERTAIN, R=CERTAIN — ABI du descripteur close)
- Revue semantic-triple 2026-09-19: triple 2+1 sur C re-dérivé de l'ASM ; dword_204E2E4 = handle ebx posé par sub_559520 (setter), transitionTimer = 0x204E2E8, desc[0]/desc[1] = champs ABI morts (rep movsd 7 dwords copie verbatim)
- Push IDB: [glm-triple 2026-09-13] déjà présent ; append-only [semantic-triple 2026-09-19] + save_database
- SetType: int __cdecl FFBattleTransitionModule(int arg_0)
- Notes parent: TEST bossBattle / JNZ RunBoss sinon RunNormal ; add esp,8 partagé. Run* EAX==0 → INC+A3 transitionTimer et return nouvelle valeur. Done: 7 DWORD locaux, stores DWORD seulement [ebp-14..-4] (init/exit/FFBattleModule/0/dword_204E2E4) ; +0/+4 jamais écrits. EAX leftover = SwitchModule. Occupancy / 0xD0 / 0x1D0 / 0x44 absents.

## C réconcilié

```c
/* ============================================================================
 * FFBattleTransitionModule @ 0x559890 — C réconcilié (méthode triple GLM, R)
 * ----------------------------------------------------------------------------
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, PAS Hex-Rays
 * (hexrays.c = vérificateur seul). 41 instr, plage 0x559890..0x55990A,
 * taille 0x7B (fin 0x55990B). Type IDA : int __cdecl
 * FFBattleTransitionModule(int arg_0) — 1 arg @ [ebp+8], appelant nettoie.
 * Sauvegardes de registres : ESI uniquement (push 0x55989B ; pop 0x5598F6
 * et 0x559900). Cadre EBP, sub esp,1Ch : tout le local = le descripteur
 * 0x1C octets. Deux retn (0x5598FA, 0x55990A), pas de retn N.
 * Corrections add esp vérifiées : 0x5598BD (8, cleanup commun aux deux bras
 * Run* via jmp 0x5598AF) ; 0x5598F3 (8, dédié set_game_loop).
 * Callers : xrefs DATA uniquement depuis main::FFModuleHandler_main_loop
 * (0x470B4F, 0x470D65) — appel indirect via table de handlers de module.
 * Triade module : init 0x559530 / exit 0x559820 / loop 0x559890 (cette fn).
 * ========================================================================== */

/* Globals touchés (noms IDA, adresses par asm.asm) */
extern int bossBattle;      /* 0x204DB20 — TEST/JNZ : 0 => Normal, NZ => Boss */
extern int transitionTimer; /* 0x204E2E8 — lu/écrit ici, incrémenté par frame */
extern int dword_204E2E4;   /* 0x204E2E4 — dernier champ du descripteur       */

/* Callees cdecl, 2 args chacun, poussés droite->gauche (arg_0 puis timer) */
extern int __cdecl BattleTransition_RunNormal(int timer, int arg_0);
extern int __cdecl BattleTransition_RunBoss(int timer, int arg_0);
extern int __cdecl FFSwitchModule_set_game_loop(const void *desc, int arg_0);

/* Cibles stockées par OFFSET dans le descripteur : jamais appelées ici. */
extern int FFBattleInitSystem(void);                    /* 0x47CE10 */
extern void __cdecl FFBattleExitSystem(void *);         /* 0x47CEF0 : exécuté après handoff mode-5, avant la 1re frame BattleRewardMenu_MainLoop (LIVE 2026-07-12) */
extern int __cdecl main__FFBattleModule(int game_object); /* 0x47CF60 : callback de frame récurrent du module */

int __cdecl FFBattleTransitionModule(int arg_0)
{
    /* Descripteur de bascule de module : [ebp-1Ch .. ebp-4h] = 7 DWORDs,
     * couvre exactement sub esp,1Ch. Hex-Rays type _BYTE v3[8] est une
     * coquille de taille — la plage réelle est 0x1C octets, 5 DWORDs écrits.
     * ATTENTION : desc[0] (var_1C) et desc[1] (var_18) ne sont JAMAIS écrits
     * par cette fonction (aucun mov vers [ebp-1Ch]/[ebp-18h] dans le live
     * ASM) — passés tels quels à FFSwitchModule_set_game_loop (contenu de
     * pile non initialisé). Non résoluble au niveau de cette fonction seule. */
    int desc[7];
    int done; /* EAX de retour des Run*, testé à 0x5598C0 */

    /* 559896 mov eax, bossBattle ; 55989F test eax,eax ; 5598A2 jnz loc_5598B1
     * Polarité ASM : 0 => RunNormal, non-nul => RunBoss. */
    if (bossBattle == 0)
    {
        /* 5598A4 mov eax, transitionTimer ; 5598A9 push eax ;
         * 5598AA call BattleTransition_RunNormal ; 5598AF jmp loc_5598BD.
         * RunNormal : phase1 t<=20, phase2 21-70 ; done>=72 frames. */
        done = BattleTransition_RunNormal(transitionTimer, arg_0);
    }
    else
    {
        /* 5598B1 mov ecx, transitionTimer ; 5598B7 push ecx ;
         * 5598B8 call BattleTransition_RunBoss.
         * RunBoss : draw<=80, fade>=60 ; done>=82 frames. */
        done = BattleTransition_RunBoss(transitionTimer, arg_0);
    }
    /* 5598BD add esp,8 — purge cdecl commune des 2 pushes (arg_0, timer)
     * des deux bras. */

    /* 5598C0 test eax,eax ; 5598C2 jz loc_5598FB
     * Polarité : EAX != 0 => transition terminée => changer de module ;
     *           EAX == 0 => continuer => incrémenter le timer. */
    if (done != 0)
    {
        /* 5598C4 mov edx, dword_204E2E4 — chargé AVANT les stores (EDX
         * conserve la valeur jusqu'au store final) ;
         * 5598CA lea eax, [ebp+var_1C] — base du descripteur ;
         * 5598CD push esi (arg_0, ESI inchangé depuis 0x55989C) ; 5598CE push eax
         * — args cdecl droite->gauche : arg2=arg_0, arg1=&desc. */
        desc[2] = (int)FFBattleInitSystem;        /* 5598CF C7 45 EC — [ebp-14h], +0x08 */
        desc[3] = (int)FFBattleExitSystem;        /* 5598D6 C7 45 F0 — [ebp-10h], +0x0C */
        desc[4] = (int)main__FFBattleModule;      /* 5598DD C7 45 F4 — [ebp-0Ch], +0x10 */
        desc[5] = 0;                              /* 5598E4 C7 45 F8 — [ebp-08h], +0x14 */
        desc[6] = dword_204E2E4;                  /* 5598EB 89 55 FC — [ebp-04h], +0x18 : store via registre EDX, pas imm32 */

        /* 5598EE call FFSwitchModule_set_game_loop ; 5598F3 add esp,8.
         * Retour = EAX du callee, propagé tel quel jusqu'au retn 0x5598FA
         * (aucun mov supplémentaire). */
        return FFSwitchModule_set_game_loop(desc, arg_0);
    }

    /* loc_5598FB — transition pas encore finie : incrémenter le timer. */
    /* 5598FB mov eax, transitionTimer ; 559900 pop esi (AVANT inc eax) ;
     * 559901 inc eax ; 559902 mov transitionTimer, eax — INC registre puis
     * re-store plein (A3), pas d'INC mémoire. */
    transitionTimer = transitionTimer + 1;
    return transitionTimer; /* 55990A retn — EAX = nouvelle valeur du timer. */
}
```

## Preuves et validation parent

Preuves tirées de `semantic_r.md` (revue semantic-triple 2026-09-19) :

1. **2 data xrefs** : `FFModuleHandler_main_loop` (0x4706B0), sites nommés `main_loop_funct` @0x470B4F/@0x470D65 — module installé par le dispatcher, pas d'appel direct.
2. **Bifurcation bossBattle** : 0x559896 `mov eax, bossBattle` → 0x55989F `test eax,eax` → 0x5598A2 `jnz 0x5598B1` ; `RunNormal` @0x5598AA / `RunBoss` @0x5598B8, `add esp,8` commun @0x5598BD (même contrat cdecl 2 args).
3. **Gate de fin** : 0x5598C0 `test eax,eax` / 0x5598C2 `jz 0x5598FB` — retour 0 ⇒ incrément `transitionTimer` + `retn` ; retour ≠ 0 ⇒ chemin installation.
4. **Descripteur + ABI set_game_loop (0x409A57)** : 5 stores du descripteur (+0x08 `FFBattleInitSystem` 0x47CE10 @0x5598CF, +0x0C `FFBattleExitSystem` 0x47CEF0 @0x5598D6, +0x10 `main::FFBattleModule` 0x47CF60 @0x5598DD, +0x14=0 @0x5598E4, +0x18 `dword_204E2E4` @0x5598EB) ; callee garde sur `game_object+0xA64` (0x409A73) puis `rep movsd` **7 dwords** (ecx=7 @0x409A88) vers `game_object+0xB4C` (0x409A82/0x409A8D) — copie verbatim, aucune lecture champ par champ, flag posé @0x409A92.
5. **Cycle transitionTimer (0x204E2E8)** : RAZ par `FFBattleTransitionInitSystem` (0x559530) @0x55954B ; lu 2× par frame ici @0x5598A4/0x5598B1 ; incrémenté ici @0x5598FB–0x559902 (`pop esi` avant `inc eax`, INC registre puis re-store A3) ; aucune autre xref. ≠ `BATTLE_TRANSITION_COUNTDOWN` (0x1D27B0C).
6. **Writer unique dword_204E2E4 = handle dispatcher** : setter `sub_559520` @0x559526 (`dword_204E2E4 = arg_0`), appelé par `FFModuleHandler_main_loop` @0x470B5C/0x470D76 avec **ebx** ; lecteur unique = cette fonction @0x5598C4 → `desc[+0x18]` → copié verbatim à `game_object+0xB4C+0x18`. Round-trip dispatch → setter → transition → module combat.

## Divergences

Résumé de `reconcile_notes.md` (rôle R, triple GLM) :

- **Nom du callback de frame** (seule divergence inter-voix A vs B) : A écrit `FFBattleModule`, B `main__FFBattleModule` — tranché pour B : l'ASM @0x5598DD stocke l'offset 0x47CF60 et le commentaire live IDA nomme `main::FFBattleModule` ; le code suit B.
- **Type Hex-Rays `_BYTE v3[8]` sous-estimé** : le live ASM écrit jusqu'à `[ebp-4h]` @0x5598EB, donc la plage du descripteur est 0x1C octets = 7 DWORDs (5 écrits) — tranché `int desc[7]`, coquille de taille Hex-Rays notée en commentaire inline.
- **`pop esi` avant `inc eax`** : détail ASM 0x5598FB–0x559902 préservé (`pop esi` 0x559900 précède `inc eax` 0x559901 ; INC registre puis re-store plein A3, pas d'INC mémoire). Retour chemin « pas fini » = `timer+1` (valeur nouvelle), retour chemin « done » = EAX brut de `FFSwitchModule_set_game_loop` (aucun mov sur EAX après le call).
- Points de convergence structurelle confirmés contre l'ASM : polarité `bossBattle==0 → RunNormal`, polarité `done != 0` (jz → incrément), `desc[0]/desc[1]` jamais écrits (documentés, non devinés), EDX chargé avant les stores (0x5598C4) et consommé au store final via registre (`89 55 FC`), ordre des stores +0x08→+0x18.
- Non résoluble ici (laissé dans les commentaires du C) : contenu initial de `desc[0]/desc[1]` (garbage de pile, copié verbatim, non lisible par le callee) ; sémantique de `dword_204E2E4` — tranchée côté R (@voir Preuves, preuve 6), côté périmètre R de revue.


