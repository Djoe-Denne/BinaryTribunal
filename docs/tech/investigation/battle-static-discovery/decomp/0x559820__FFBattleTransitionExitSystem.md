# FFBattleTransitionExitSystem @ 0x559820

- Instr: 14
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=LIKELY, B=LIKELY, R=CERTAIN — triade module prouvée)
- Callers: 2 xrefs data 0x470B47/0x470D5D (callback exit desc[3] de la triade init 0x559530 / exit 0x559820 / loop 0x559890)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, fermé par sondes IDA (slots desc, thunk 0x559880 → 0x56D770, latch +0xB88 lu @0x41DF22, bossBattle = 0x204DB20)

## C réconcilié

```c
/* =====================================================================
 * C réconcilié — FFBattleTransitionExitSystem (0x559820)
 * Méthode triple GLM, rôle R (réconciliateur). Voix A + voix B tranchées
 * contre l'ASM live.
 * Ground truth = live ASM (asm.asm), 14 instructions, 0x31 octets,
 * plage 0x559820..0x559850, base image 0x400000. hexrays.c = vérificateur
 * uniquement, jamais source.
 * Type IDA : int __cdecl FFBattleTransitionExitSystem(int a1)
 * Sauvegardes de registres : ebp seul (push ebp / pop ebp). Aucun autre
 * registre callee-saved touché ; eax/ecx/edx scratch.
 * Convention : cdecl, retn sans imm — l'arg_0 est dépilé par le caller.
 * =====================================================================
 *
 * Divergences tranchées (détail dans reconcile_notes.md) :
 *  1. Forme du return : forme B retenue — `return Gfx_DestroyTexturePageSlots();`
 *     reproduit l'unique call @0x55984a ET l'EAX résiduel au retn @0x559850.
 *     La forme A (`call` séparé puis `return 0`) fausse EAX. La valeur de
 *     retour est un RÉSIDU non signifiant (aucune écriture EAX explicite
 *     dans l'ASM) ; le type 'int' est une convention IDA.
 *     Correction imposée : l'externe correspondant est typé `int` (B l'avait
 *     laissé `void`, incohérent avec son propre return).
 *  2. Callees zéro-arg : CONFIRMÉ contre l'ASM — aucun push d'argument avant
 *     les 4 calls (0x55982c, 0x559833, 0x559845, 0x55984a) et aucun `add esp`
 *     après. Les 4 externes sont donc sans paramètre.
 *  3. Polarité jnz @0x55982a : CONFIRMÉ — bossBattle != 0 branche vers
 *     0x559833 (j_BattleSwirl_ReleaseResources, voie boss) ; bossBattle == 0
 *     exécute BattleTransition_CleanupNormal (voie normale, teardown 0x1E)
 *     puis jmp 0x559838. A et B d'accord ; hexrays.c cohérent.
 * ===================================================================== */

/* ---- Externes (noms live IDA ; rôles par commentaires IDA du pack) ---- */
extern int  bossBattle;                              /* global testé @559823 :
                                                        0 = bataille normale,
                                                        != 0 = boss */

extern void BattleTransition_CleanupNormal(void);    /* @55982c : teardown normal (0x1E) */
extern void j_BattleSwirl_ReleaseResources(void);    /* @559833 : thunk j_ (jump tail),
                                                        voie boss */
extern void Gpu_EnableOTagHostPass(void);            /* @559845 : force dword_B7CC24 = 1,
                                                        2e pass hôte DrawOTag ;
                                                        ancien nom CRT __setargv_0 = FAUX */
extern int  Gfx_DestroyTexturePageSlots(void);       /* @55984a : teardown 96 records
                                                        de slots de pages texture, chemins
                                                        de sortie ; type int pour refléter
                                                        l'EAX résiduel transmis au caller */

int __cdecl FFBattleTransitionExitSystem(int arg_0)  /* arg_0 : contexte transition ;
                                                        unique usage = écriture +0xB88 */
{
    /* 559823  mov eax, bossBattle
     * 559828  test eax, eax
     * 55982a  jnz  short loc_559833            ; polarité : non-nul => voie boss */
    if ( bossBattle != 0 ) {
        j_BattleSwirl_ReleaseResources();    /* 559833 : release ressources swirl (boss) */
    } else {
        BattleTransition_CleanupNormal();    /* 55982c + 559831 jmp : teardown normal (0x1E) */
    }

    /* 559838  mov eax, [ebp+arg_0]
     * 55983b  mov dword ptr [eax+0B88h], 1     ; dword 32 bits (PAS word),
                                                 offset 0xB88 = 2952 : flag
                                                 "transition exit armé/done" */
    *(unsigned int *)(arg_0 + 0xB88) = 1;

    /* 559845  call Gpu_EnableOTagHostPass       ; dword_B7CC24 := 1 (dans le callee) */
    Gpu_EnableOTagHostPass();

    /* 55984a  call Gfx_DestroyTexturePageSlots ; dernier call avant épilogue.
     * 55984f  pop ebp
     * 559850  retn
     * Retour = EAX résiduel du callee ci-dessus, reproduit tel quel par la
     * forme `return f();` (1 seul call, EAX inchangé jusqu'au retn). Aucune
     * xref du pack n'exploite cette valeur ; type 'int' = convention IDA. */
    return Gfx_DestroyTexturePageSlots();
}
```

## Preuves et validation parent

1. **Slot exit de la table module — lu, pas inféré** : les 2 seules xrefs (data) de 0x559820 sont `mov [esp+34h+exit_funct], offset FFBattleTransitionExitSystem` à 0x470B47 et 0x470D5D, encadrées symétriquement par les stores `init_funct` (0x470B3F/0x470D55) et `main_loop_funct` (0x470B4F/0x470D65), chacune suivie de `call FFSwitchModule_set_game_loop` (0x470B6B/0x470D81). Triple store `0x559530 / 0x559820 / 0x559890` sur les deux sites — structure init/exit/loop de la triade transition prouvée.
2. **Cible du thunk prouvée** : `j_BattleSwirl_ReleaseResources` @0x559880 = `jmp` E9 rel32 → **0x56D770** (`BattleSwirl_ReleaseResources`, commentaire IDB « boss cleanup IS swirl-release »), cycle de vie symétrique avec `BattleSwirl_AllocCaptureResources` (0x56D240).
3. **Latch +0xB88 = réarmement du present** : le store `[ctx+0xB88]=1` @0x55983B (dword 32 bits, pas word) est lu par `Render_FramePresent_Dispatch` — `cmp dword ptr [ecx+0B88h], 0` @0x41DF22 (gate du present global, « engine+2952 awake ») ; writer focus-loss `mov [esi+0B88h], ebx` @0x47D0FA dans `main::FFBattleModule`.
4. **Branche boss alignée** : `test bossBattle` (0x204DB20) + `jnz` @0x55982A — bossBattle != 0 → `j_BattleSwirl_ReleaseResources` (voie boss), == 0 → `BattleTransition_CleanupNormal` (teardown 0x1E) puis `jmp` code commun @0x559838 ; deux machines swirl (runners normal/boss) décrites par le wiki.
5. **4 callees zéro-arg, teardown de sortie** : `BattleTransition_CleanupNormal`@0x559860, `Gpu_EnableOTagHostPass`@0x45B580 (force `dword_B7CC24=1`, 2e pass hôte DrawOTag — ancien nom CRT `__setargv_0` FAUX), `Gfx_DestroyTexturePageSlots`@0x4647A0 (teardown des 96 records de slots de pages texture), `BattleSwirl_ReleaseResources`@0x56D770 — aucun `push`/`add esp,n` avant les calls (routines pilotées par globals, cohérent avec des handlers de cycle de vie).
- Risque: le type de retour réel de `Gfx_DestroyTexturePageSlots` n'est pas prouvable depuis ce pack — seul le canal EAX vers le `retn` est un fait ASM ; le rôle exact du flag `+0xB88` (« exit armé/done ») est une interprétation des commentaires IDA, l'écriture dword 1, elle, est un fait.

## Divergences

1. **Forme du return (A vs B) → tranché : forme B**. B : `return Gfx_DestroyTexturePageSlots();` (1 call, EAX résiduel transmis au retn) ; A : `Gfx_DestroyTexturePageSlots();` puis `return 0;` (EAX forcé à 0). Verdict ASM : @0x55984A le call est le dernier avant `pop ebp` @0x55984F / `retn` @0x559850, aucune écriture EAX après — la forme B est la seule fidèle au compte d'instructions et à l'état d'EAX. La valeur est un **résidu non signifiant** (jamais exploité par les xrefs du pack) ; le type `int` est une convention IDA. Correction imposée à B : externe retypé `extern int Gfx_DestroyTexturePageSlots(void);` (incohérent avec son propre return en `void`).
2. **Writers du latch +0xB88 → site B 0x47D071 erroné, tranché** : B citait 0x47D0FA **et** 0x47D071. 0x47D0FA `mov [esi+0B88h], ebx` est confirmé (branche focus-loss de `main::FFBattleModule`), mais 0x47D071 est en réalité `call Gpu_EnableOTagHostPass` (écrit `dword_B7CC24=1`, PAS `[x+0xB88]`) — corrigé contre l'opcode ; la sémantique « latch de présentation » tient par reader @0x41DF22 + writer @0x47D0FA.
3. **Polarité jnz @0x55982A et callees zéro-arg : confirmés sans divergence** — A, B et Hex-Rays concordent (boss → release swirl ; 4 calls sans push ni `add esp,n`).

Hex-Rays (`hexrays.c`) : conforme à l'ASM sur les 14 instructions (ordre, polarité, offset 2952, forme `return Gfx_...()`), utilisé comme vérificateur uniquement, jamais source.
