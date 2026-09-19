# BattleSwirl_EnsureAndCapture @ 0x56D720

- Instr: 17
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=CERTAIN, R=CERTAIN)
- Callers: BattleTransition_InitScanlinesNormal @0x55972F et BattleTransition_CaptureBoss @0x55980A (2 code xrefs, 0 data)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, 0 divergence sémantique A/B ; `dword_209ADE8` = handle 1re draw-list type 14 (writer 0x56D324, clear 0x56D79E) ; polarité alloc 0=succès/-1=échec

## C réconcilié

```c
// ============================================================================
// c_reconciled.c — BattleSwirl_EnsureAndCapture @ 0x56D720 (rôle R, triple GLM)
// ============================================================================
// Métadonnées :
//   Instr (live) : 17 (0x56D720..0x56D74F, 47 octets, base 0x400000)
//   Type IDA     : int __cdecl(int, int, int, int)
//   Sauvegardes de registres : AUCUNE (pas d'ebx/esi/edi/ebp, pas de frame EBP)
//   Palier : close — AllocCaptureResources 0x56D240 (CERTAIN, arène 0x20000 +
//            2 draw-lists type 14), CaptureFrame 0x56D390 (noyau CERTAIN :
//            locks/composite/unlocks + Alt22/23 ssi engine+0xBA8 == 0)
//   Callers (xrefs_to, 2, fan-in faible) :
//     0x55972F BattleTransition_InitScanlinesNormal
//     0x55980A BattleTransition_CaptureBoss
//     Les deux passent (dword_204DB2C, dword_204DB30, screen_x, screen_y) —
//     observation côté callers, non dérivée du corps.
//   Préambule : Ground truth = live ASM (asm.asm) + ida_dump_bytes, not
//   Hex-Rays. hexrays.c = vérificateur seulement (conforme ici).
//
// Divergences A vs B : AUCUNE sur la sémantique. Seule différence de style :
//   - A : `if (dword_209ADE8) goto capture;` (contrôle plat, miroir du jnz)
//   - B : valeur lue dans un local `alloc` (style Hex-Rays)
//   Les deux compilent vers le même test/jnz ; forme retenue : goto plat (A),
//   car elle reflète littéralement les arcs loc_56D732 / locret_56D74E.
// ============================================================================

// 0x209ADE8 — porte "ressources de capture swirl déjà allouées".
// Lecture booléenne pure (test eax,eax) : nonzero => skip alloc.
// Type IDB `_DWORD *` non prouvé par l'ASM ; rôle exact (handle vs flag vs
// ptr) indécis. Ici exposé comme dword (valeur lue, jamais déréférencée).
extern unsigned int dword_209ADE8; // @ 0x209ADE8

// 0x56D240 — CERTAIN. Arène 0x20000 + 2 draw-lists type 14.
// __cdecl 0 arg (aucun push avant le call @0x56D729, aucun add esp après).
// Contrat imposé par CE site : eax==0 => succès (on capture) ;
// eax!=0 => bail, statut retourné tel quel.
extern int __cdecl BattleSwirl_AllocCaptureResources(void);

// 0x56D390 — CERTAIN (noyau). locks/composite/unlocks + Alt22/23
// ssi engine+0xBA8 == 0. __cdecl 4 args ; 0x56D746 est son 2e caller (PH10).
extern int __cdecl BattleSwirl_CaptureFrame(int arg_0, int arg_4, int arg_8, int arg_C);

int __cdecl BattleSwirl_EnsureAndCapture(
        int arg_0, // [esp+4] @0x56D73F relu avec base +4
        int arg_4, // [esp+8]
        int arg_8, // [esp+C]
        int arg_C) // [esp+10]
{
    int result; // eax

    // 56d720  mov eax, dword_209ADE8
    // 56d725  test eax, eax
    // 56d727  jnz short loc_56D732     ; nonzero => déjà alloué, capture directe
    if (dword_209ADE8 != 0)
        goto capture;                 // loc_56D732

    // 56d729  call BattleSwirl_AllocCaptureResources (0x56D240)
    // 56d72e  test eax, eax
    // 56d730  jnz short locret_56D74E  ; POLARITÉ : 0=continue, nonzero=bail
    //         ; add esp,10h NON exécuté sur ce chemin — correct : aucun push
    //         ; n'a été fait, eax (statut d'échec) est retourné tel quel.
    result = BattleSwirl_AllocCaptureResources(); // call unique @0x56D729
    if (result != 0)
        return result;                // locret_56D74E: retn (statut brut)

capture:
    // loc_56D732 : pass-through strict des 4 args, ordre cdecl droite->gauche.
    // 56d732  mov eax, [esp+arg_C]
    // 56d736  mov ecx, [esp+arg_8]
    // 56d73a  mov edx, [esp+arg_4]
    // 56d73e  push eax                 ; arg_C poussé 1er
    // 56d73f  mov eax, [esp+4+arg_0]   ; +4 = compensation du push de 0x56D73E
    //                                  ; (artefact, PAS un 5e argument)
    // 56d743  push ecx                 ; arg_8
    // 56d744  push edx                 ; arg_4
    // 56d745  push eax                 ; arg_0 poussé en dernier
    // 56d746  call BattleSwirl_CaptureFrame (0x56D390)
    // 56d74b  add esp, 10h             ; cleanup cdecl des 4 pushes internes
    // 56d74e  retn                     ; sortie unique, eax = retour CaptureFrame
    return BattleSwirl_CaptureFrame(arg_0, arg_4, arg_8, arg_C);
}

// ============================================================================
// Notes de fidélité :
// 1. Garde 0x209ADE8 : test/jnz, nonzero => loc_56D732 (capture directe).
//    eax est réécrit par les loads d'args ensuite : il ne fuit jamais dans
//    le retour.
// 2. AllocCaptureResources : __cdecl 0 arg prouvé (zéro push autour du call
//    unique @0x56D729). Polarité 0=OK / nonzero=bail imposée par le jnz
//    @0x56D730.
// 3. Retour du chemin d'échec : eax (statut nonzero de l'alloc) propagé brut
//    32 bits au retn — pas de troncature AL ici (contrairement à
//    Battle_GetRandomInt qui ne retourne que AL).
// 4. Pass-through : 4 args recopiés via eax/ecx/edx puis poussés dans l'ordre
//    arg_C, arg_8, arg_4, arg_0 = cdecl droite->gauche. Le `mov eax,
//    [esp+4+arg_0]` @0x56D73F est l'artefact de compensation après le 1er
//    push — aucun 5e argument, aucune mutation d'argument.
// 5. add esp,10h @0x56D74B : cleanup des 4 pushes internes (cdecl, caller
//    cleanup). Situé après le call ; le chemin d'échec (jnz short
//    locret_56D74E) saute directement au retn SANS l'exécuter — cohérent car
//    la pile d'args entrante n'est jamais touchée (pas de pop arg, pas de
//    retn imm).
// 6. Divergence Hex-Rays : AUCUNE. hexrays.c reproduit la même structure
//    (garde, polarité, pass-through, retour statut d'échec). Son `if (!
//    result)` = test/jnz identique. Vérificateur validé.
// ============================================================================
```

## Preuves et validation parent

1. `56d720 mov eax, dword_209ADE8` / `56d725 test eax,eax` / `56d727 jnz short loc_56D732` : gate lazy-init — alloc uniquement si sentinelle nulle.
2. `56d729 call BattleSwirl_AllocCaptureResources` / `56d72e test eax,eax` / `56d730 jnz short locret_56D74E` : échec alloc (retour -1) ⇒ retn immédiat sans capture.
3. `56d732`–`56d746` : forwarding cdecl exact — pousse `arg_C, arg_8, arg_4, arg_0` puis `call BattleSwirl_CaptureFrame` ; `56d74b add esp,10h` + `56d74e retn` nu = wrapper pur, aucun arg consommé/modifié.
4. Polarité alloc prouvée par opcodes : échecs `or eax, 0FFFFFFFFh` @`0x56D2FE` et @`0x56D32E` ; succès `neg eax; sbb eax,eax; neg eax; dec eax` @`0x56D37B`–`0x56D384` (0 ssi handle non nul, sinon -1).
5. `dword_209ADE8` = handle de la 1re `Gfx_CreateDrawList(1, 0xE, …)` @`0x56D318`, stocké @`0x56D324` ; 2e draw-list → `dword_209ADEC` @`0x56D376` ; clear unique @`0x56D79E`.
6. XrefsTo(0x56D720) : 2 code (0x55972F, 0x55980A), 0 data — point de capture partagé par les runners transition normal et boss (wiki `battle-render-pipeline-entrypoints.md` L88 « two machines sharing alloc/capture »).
7. Callers : pushes `0x559725`–`0x55972E` et `0x559801`–`0x559809` → args = `(dword_204DB2C, dword_204DB30, screen_x, screen_y)` ; `screen_x`/`screen_y` sont des symboles nommés de l'IDB.
8. Callees alignés catalogue wiki (`decomp-function-catalog.md` L431-434 : 0x56D240 LIKELY, 0x56D390 UNCERTAIN) ; noms IDB confirmés par les dumps (`fn= BattleSwirl_AllocCaptureResources`, `fn= BattleSwirl_CaptureFrame`).
- Risque: la 2e `Gfx_CreateDrawList` en échec laisserait `dword_209ADE8` non nul (alloc jamais retentée) avec `dword_209ADEC` = 0 — hors périmètre du wrapper, à observer côté CaptureFrame.

## Divergences

Triple 2+1 (A, B aveugles ; R réconciliateur) : **0 divergence sémantique A/B**, les deux voix sont conformes à l'ASM ligne à ligne. Seules différences de style :

- **Garde `dword_209ADE8`** : A `if (dword_209ADE8) goto capture;` (contrôle plat) vs B local `alloc` + test (style Hex-Rays) — **forme A (goto plat) retenue**, miroir littéral des arcs `jnz loc_56D732` / `locret_56D74E` ; compilées, les deux sont le même test/jnz.
- **Alloc** : appel direct dans le `if` (A) vs stockée dans `result` (B) — forme à local unique retenue (call unique @0x56D729, aucune duplication).
- **Typage du global** : `extern unsigned int dword_209ADE8` retenu — lecture booléenne pure prouvée, typage IDB `_DWORD *` non prouvé par l'ASM.

**Hex-Rays (vérificateur) : conforme** — même garde, même polarité (`if (!result)`), même pass-through 4 args, même retour du statut d'échec. Aucune divergence Hex-Rays vs ASM. Auto-correction R : squelette initial avec call d'alloc dupliqué et symbole inventé, corrigé vers la forme canonique à call unique.
