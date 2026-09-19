# time_related_deltaTimeMaybe2 @ 0x559A10

- Instr: 19
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=CERTAIN, R=CERTAIN — NOM IDA MENSONGER : c'est un pacer de frame, pas un delta time)
- Nom proposé (markdown seul, pas de rename IDB): **BattleTransition_FramePace**
- Callers: `BattleTransition_RunNormal` @0x559954 (push 0x21 = 33 ms) et `BattleTransition_RunBoss` @0x559E4A (push 0x21, prouvé par dump)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, ancre `dword_204DB34` privée au module transition (4 accès : 2 writes init 0x559530, read+write ici).

## C réconcilié

```c
/* ==========================================================================
 * 0x559A10  time_related_deltaTimeMaybe2  —  C réconcilié (rôle R, triple GLM)
 * --------------------------------------------------------------------------
 * Ground truth = live ASM (asm.asm @ 0x559A10) + ida_dump_bytes, PAS Hex-Rays
 * (hexrays.c = vérificateur ; ici Hex-Rays concorde, aucune divergence).
 *
 * Instr (live) : 19  |  Taille : 0x30 octets  |  Plage : [0x559A10 .. 0x559A40)
 * Type IDA     : DWORD __cdecl time_related_deltaTimeMaybe2(signed int)
 *                `retn` nu en 559A3F (pas de `ret 4`) => __cdecl, 1 arg,
 *                l'appelant nettoie la pile.
 * Sauvegardes  : ebp (cadre), esi (callee-saved — cache du thunk IAT
 *                timeGetTime, appelé 2x via `call esi`).
 * Corrections  : aucune `add esp` nécessaire — timeGetTime (winmm) et Sleep
 *                (kernel32) sont __stdcall importés via ds: thunks ; après
 *                `call ds:Sleep` en 559A30, 559A36 enchaîne direct sans
 *                `add esp,4`.
 * Divergences Hex-Rays vs ASM : aucune. Les 19 instructions sont couvertes ;
 *                la comparaison signée est explicite dans l'ASM (`jge`,
 *                SF=OF) et implicite chez Hex-Rays ((int)(..) < a1).
 *
 * Rôle (prouvé par l'ASM) : limiteur de cadence (frame pacer) des transitions
 * de combat. Garantit qu'au moins `target_ms` ms s'écoulent entre deux appels :
 * si la frame est trop rapide, dort le reste, puis (re)échantillonne et
 * enregistre le nouveau baseline dans le global dword_204DB34. Le nom IDA
 * « deltaTimeMaybe2 » est trompeur : la fonction ne retourne pas un delta,
 * elle fait dormir (retour = tick stocké).
 * ========================================================================== */

/* ---- Externes (rôles prouvés par l'ASM : ds: thunks IAT réels) ----------- */

/* winmm.dll via IAT — thunk chargé une fois dans esi (559A14), appelé 2x
 * (559A1A premier échantillon, 559A36 re-échantillon après Sleep). */
DWORD __stdcall timeGetTime(void);

/* kernel32.dll via IAT, stdcall — preuve : pas de `add esp,4` après
 * `call ds:Sleep` (559A30 -> 559A36 enchaîne direct). */
void __stdcall Sleep(DWORD dwMilliseconds);

/* dword_204DB34 (.data) — dernier tick timeGetTime échantillonné.
 * Lu en 559A1C (baseline précédent), écrit en 559A38 avec eax
 * (tick frais ou re-échantillonné). Rôle prouvé : baseline inter-appels
 * du throttle. */
extern DWORD dword_204DB34;

/* ---- C réconcilié -------------------------------------------------------- */

DWORD __cdecl time_related_deltaTimeMaybe2(signed int target_ms /* [ebp+arg_0] */)
{
    DWORD ( __stdcall *p_timeGetTime )(void); /* esi */
    DWORD now;       /* eax — échantillon timeGetTime (1er ou 2e) */
    signed int el;   /* ecx — elapsed = now - dword_204DB34 ; le `sub` est
                      * identique bit à bit en signé/non-signé, la polarité ne
                      * compte qu'au cmp. Flags du sub morts (cmp suivant les
                      * écrase). */

    p_timeGetTime = timeGetTime;         /* 559A14  mov esi, ds:timeGetTime  */
    now = p_timeGetTime();               /* 559A1A  call esi                  */

    el = (signed int)(now - dword_204DB34);
                                         /* 559A1C mov edx, dword_204DB34    */
                                         /* 559A22 mov ecx, eax              */
                                         /* 559A24 sub ecx, edx              */

    if (el < target_ms)                  /* 559A26 mov edx, [ebp+arg_0]      */
                                         /* 559A29 cmp ecx, edx              */
                                         /* 559A2B jge short loc_559A38      */
                                         /* --- comparaison SIGNÉE (jge) --- */
    {
        /* Moins de target_ms écoulé : dort le manque (cible - écoulé).
         * Si el < 0 (wrap timeGetTime ~49,7 j, ou baseline > now), l'argument
         * devient > target_ms : Sleep plus LONG. Fidèle à l'ASM, aucune
         * normalisation de wrap inventée. */
        Sleep((DWORD)(target_ms - el));  /* 559A2D sub edx, ecx              */
                                         /* 559A2F push edx (dwMilliseconds) */
                                         /* 559A30 call ds:Sleep (stdcall)   */
        now = p_timeGetTime();           /* 559A36 call esi — le chemin Sleep
                                          * RE-ÉCHANTILLONNE timeGetTime ;   */
    }
    /* Chemin sec (jge pris) : eax garde le 1er échantillon de 559A1A. */

    /* loc_559A38 — store INCONDITIONNEL, atteint par les 2 chemins : */
    dword_204DB34 = now;                 /* 559A38 mov dword_204DB34, eax    */
    return now;                          /* 559A3D pop esi                   */
                                         /* 559A3E pop ebp                   */
                                         /* 559A3F retn (cdecl, eax = tick   */
                                         /* stocké)                          */
}

/* ---- Ancres / notes ------------------------------------------------------
 * - dword_204DB34 = état statique de pacing : lu puis écrit à CHAQUE appel,
 *   y compris sur le chemin sans Sleep.
 * - Asymétrie d'échantillonnage : chemin Sleep => 2e call esi @0x559A36
 *   (tick frais post-sommeil) ; chemin sec => réutilise le 1er tick de
 *   559A1A. eax au retour = valeur stockée dans dword_204DB34.
 * - jge @0x559A2B signé : wrap timeGetTime ~49,7 j => el négatif =>
 *   remaining > target_ms (sommeil long), comportement exact de l'ASM.
 * - Appelants : BattleTransition_RunNormal (0x559954, arg 0x21 = 33 ms
 *   ~30 fps), BattleTransition_RunBoss (0x559E4A) — usage du retour non
 *   prouvé depuis ce pack (probablement ignoré).
 * - Hex-Rays : contrôle, signé, store, retour identiques ; différences
 *   cosmétiques seulement (cache esi du thunk).
 * ========================================================================== */
```

## Preuves et validation parent

1. **Séquence timeGetTime/sub/jge signé/Sleep du reliquat/re-store.** 0x559A1A `call esi` (timeGetTime) ; 0x559A1C/0x559A24 `mov edx, dword_204DB34` / `sub ecx, edx` → `elapsed = now − tick_précédent`, signature d'un pacer. 0x559A29–0x559A2B `cmp ecx, edx` / `jge short 0x559A38` — comparaison **signée** (pas `jae`) : `arg_0` est une durée cible signée ; elapsed ≥ arg_0 → pas de Sleep. 0x559A2D–0x559A30 `sub edx, ecx` / `push edx` / `call ds:Sleep` : on ne dort que le reliquat `arg_0 − elapsed`, jamais plus. 0x559A36 `call esi` puis 0x559A38 `mov dword_204DB34, eax` : re-horodatage après Sleep + store inconditionnel sur les deux chemins (resynchro, pas d'accumulation).
2. **Constantes 0x21 aux 2 callers.** `push 21h` @0x559952 (RunNormal) **et** @0x559E48 (RunBoss, lu à l'IDB via dump `next_head` 0x559E40..0x559E50 : bytes `6A21 E8…`) : les deux transitions cadencent à 33 ms ≈ 30 fps.
3. **Ancre privée XrefsTo=4.** `XrefsTo(0x204DB34)` : exactement 4 accès — écritures init `FFBattleTransitionInitSystem` @0x559665/0x55967E (chacune précédée de `call ds:timeGetTime` @0x55965F/0x559678), lecture @0x559A1C + écriture @0x559A38 (pacer). Aucun autre reader/écrivain dans tout l'IDB : l'ancre est privée au module transition.
4. **cdecl confirmée, `retn` nu.** `retn` nu @0x559A3F (pas de `ret 4`) ⇒ __cdecl, 1 arg nettoyé par le caller : cleanup `add esp,1Ch` @0x55995C (RunNormal, arg partagé avec la séquence de frame) et `add esp,4` @0x559E52 (RunBoss, dédié) ; aucun `add esp,4` dans 0x559A10. `timeGetTime` (winmm) et `Sleep` (kernel32) sont __stdcall via thunks IAT — preuve directe : 559A30→559A36 enchaîne sans `add esp,4` après `call ds:Sleep`.
5. **Retour EAX résiduel jamais consommé.** Les deux callers ignorent EAX — instruction suivant le `call` : `mov edi, [ebp+arg_0]` @0x559959 et @0x559E4F suit immédiatement les deux `call` sans lire EAX. Le type IDA `DWORD __cdecl(signed int)` surclasse `void` mais rien ne consomme EAX — rester descriptif, ne pas promettre un retour.

## Divergences

Convergence totale : A, B et Hex-Rays sont structurellement identiques sur les 19 instructions — **0 divergence**. Reprise de la formulation B (plus proche de l'ASM instruction par instruction). Points de contrôle confirmés par l'ASM : (1) chemin Sleep re-échantillonne (`call esi` @0x559A36) vs chemin sec qui réutilise le 1er échantillon de 559A1A ; (2) store ancre @0x559A38 inconditionnel, cible du `jge` ET chute du if, atteint par les deux chemins — aucune voix n'a inventé de store conditionnel ; (3) `jge` @0x559A2B signé (SF=OF), hexrays concorde (`(int)(..) < a1`), aucune voix n'a « corrigé » le wrap en non-signé — comportement ASM fidèle préservé (wrap timeGetTime ~49,7 j → sommeil long). Différences cosmétiques seulement chez Hex-Rays (réutilisation de `result`, thunk caché esi, flags morts du `sub` @0x559A24). Arbitrage de nom tranché en réconciliation : A `FramePacer_SleepToTargetInterval` vs B `BattleTransition_FramePace` → **B retenu** (2 callers BattleTransition exclusifs + ancre privée au module). Aucune divergence A/B restante à arbitrer.
