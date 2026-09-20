# MAG_Scratch58_InvokeWorker @ 0x69E940

- Instr (live): 14 (38 o, 0x69E940-0x69E965)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - frame scratch de 0x58 octets : pre-call sub_69E9A0(a1) retour ignore, alloc bs_modulo(0x58), store a1 a block+0, worker sub_69E970(bloc), liberation BattleScratch_Unwind(0x58) ; 4 pushes cdecl un seul cleanup add esp,10h
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_69E940\nTYPE ; proposition: MAG_Scratch58_InvokeWorker
- Notes parent: checks 5.6 OK (role P) : asm 14 instr integral lu au sol, sub_69E9A0 (0x69E946), bs_modulo 58h (0x69E94B/0x69E94D), mov [eax],esi (0x69E953), sub_69E970 (0x69E955), Unwind 58h (0x69E95A/0x69E95C), add esp,10h unique (0x69E961) ; convergence c_a/semantic_a ; retour AL residuel marque non etaye

## C reconcilie

```c
// c_a.c — reconstruction C de sub_69E940 (CELLULE 0x69E940, stub MAG, mode 1+P), voix c_a
// Ground truth = live ASM (asm.asm @ 0x69E940, 14 instr / 38 octets) + meta.json, PAS Hex-Rays.
// Type IDA : char __cdecl(int) — retour char = AL uniquement (largeur exacte).
// Taille live : 38 octets (0x69E940..0x69E965). Unique caller : sub_69D670 @ 0x69D704.

// Notes de réconciliation :
// - 4 pushes (esi-arg, 0x58, ptr, 0x58) avec un SEUL cleanup différé
//   `add esp, 10h` @ 0x69E961 (callees.txt : CALL/ADD-ESP LINES). Hex-Rays les
//   présente comme des appels cdecl séquentiels normaux ; le code live nettoie
//   la pile en bloc. Équivalent comportemental.
// - bs_modulo (0x5082B0) : scratch allocator — nbytes=0x58, ptr retourné dans
//   eax. BattleScratch_Unwind (commentaire E3a) est l'inverse du bump sur
//   dword_1D999C4. Aucun malloc/free library call.
// - Hex-Rays déclare un retour `int` ; IDA type dit `char`. Contrat char :
//   seul AL du retour de BattleScratch_Unwind est significatif.
// - Le dword [eax] = a1 brut (esi) est écrit AVANT que sub_69E970 consomme le ptr.

#include <stdint.h>

// Externes : uniquement les callees présents dans asm.asm / callees.txt.
// Rôles d'après l'evidence live ; aucune library call inventée.
extern void  sub_69E9A0(int a1);                     // 0x69E9A0 — reçoit a1 (push esi @0x69E945)
extern void *bs_modulo(uint32_t nbytes);             // 0x5082B0 — scratch bump allocator (inverse de BattleScratch_Unwind, dword_1D999C4)
extern void  sub_69E970(void *blk);                  // 0x69E970 — consomme le bloc 0x58
extern char  BattleScratch_Unwind(uint32_t nbytes);  // E3a : unwind bump dword_1D999C4 (inverse de bs_modulo)

// Called from: sub_69D670 @ 0x69D704 (sole xref, callers.txt)
char __cdecl sub_69E940(int a1)
{
    sub_69E9A0(a1);                          // 0x69E946 — push esi; call

    void *blk = bs_modulo(0x58u);            // 0x69E94B/0x69E94D — push 58h 'X'; call ; eax = ptr bloc scratch 88 octets

    *(uint32_t *)blk = (uint32_t)a1;         // 0x69E953 — mov [eax], esi (store AVANT handoff)

    sub_69E970(blk);                         // 0x69E955 — push eax; call

    // 0x69E961 — add esp, 10h : cleanup unique des 4 pushes (10h = 4×4)

    return BattleScratch_Unwind(0x58u);      // 0x69E95A/0x69E95C — push 58h; call ; retour AL (char)
}

// UNCERTAIN 0x69E940 provenance exacte de AL : IDA type la fonction `char`,
// donc la valeur de retour = AL du retour de BattleScratch_Unwind. Hex-Rays
// prétend `int`. Quel octet AL représente dans BattleScratch_Unwind n'est pas
// prouvable depuis l'ASM de cette cellule seule.
// UNCERTAIN 0x69E953 sémantique du bloc 0x58 : premier dword = a1 est prouvé ;
// les 0x54 octets restants ne sont observables que via le contrat de
// sub_69E970 (hors de cette cellule).
```

## Analyse semantique

# Sémantique sub_69E940 @ 0x69E940 (analyse A, mode aveugle)

- Rôle (1 phrase) : Wrapper scratch-frame battle qui alloue un bloc de 0x58 octets dans l'arène scratch (`bs_modulo`), y stocke l'argument entier en premier dword, invoque le worker `sub_69E970` sur ce bloc après un pré-appel `sub_69E9A0(arg)`, puis restitue l'arène par `BattleScratch_Unwind(0x58)`.
- Confiance : **CERTAIN** (portée : mécanisme scratch-frame intégralement prouvé par opcodes ; la spécialisation domaine du worker `sub_69E970` reste hors périmètre — voir Questions ouvertes). Note barème : `wiki.md` est vide (échec qmd), mais les annotations E3a embarquées dans `asm.asm` (ground truth) + `globals.txt` (`dword_1D999C4`) tiennent lieu de convergence wiki ; aucune divergence détectée.
- Nom catalogue : aucun nom IDA (stub `sub_69E940`). Proposition markdown seul, **pas de rename** : `MAG_Scratch58_InvokeWorker` (préfixe MAG indicatif issu du libellé de cellule, non prouvé par le pack ; variante neutre : `BattleScratchCtx58_RunSub69E970`).

## In / Out / Effets

- In : 1 argument cdecl `arg_0` (int, `[esp+8]` au point d'exécution après `push esi` @69e941). Droite→gauche non observable directement (1 arg), mais cleanup caller (`add esp, 10h`) prouve cdecl pour les 4 appels.
- Out : valeur de retour **non significative** — aucune écriture de retour dans la fonction ; l'EAX visible par le caller est le résidu de `BattleScratch_Unwind` @69e95c. Le type IDA `char __cdecl` (retour AL) n'est étayé par aucun opcode : le déclaré AL n'est pas prouvé, le réel est « EAX résiduel du dernier callee ».
- Effets :
  - `sub_69E9A0(arg_0)` appelée pour effet de bord — son EAX de retour est écrasé sans lecture (par le retour de `bs_modulo`).
  - Allocation de 0x58 (88) octets via `bs_modulo(0x58)` @69e94b/69e94d ; EAX = pointeur bloc.
  - `mov [eax], esi` @69e953 : champ +0 du bloc = `arg_0` (écriture 4 octets, pas d'autre champ initialisé ici).
  - `sub_69E970(bloc)` @69e952/69e955 : worker, reçoit le pointeur bloc en 1er arg.
  - `BattleScratch_Unwind(0x58)` @69e95a/69e95c : libération symétrique, dé-bump de `dword_1D999C4` (seule globale touchée, cf. globals.txt).
- Registres : `esi` = copie d'`arg_0`, sauvegardé/restauré (push @69e940 / pop @69e964). `eax` = pointeur bloc puis résidu.

## Preuves (ASM cité)

1. `69e941 mov esi, [esp+4+arg_0]` — 1 seul argument entier lu, copié dans `esi` pour les deux usages (pré-appel + champ +0).
2. `69e945 push esi / 69e946 call sub_69E9A0` — pré-appel avec l'argument brut ; retour ignoré (EAX écrasé au prochain call), donc effet de bord pur (validation ou init d'état).
3. `69e94b push 58h ; nbytes / 69e94d call bs_modulo` — allocation de 0x58 octets ; le commentaire IDA `nbytes` et l'annotation pack « bs_modulo 0x5082B0 » caractérisent l'arène scratch.
4. `69e952 push eax / 69e953 mov [eax], esi` — le pointeur bloc est poussé pour le worker **avant** l'écriture du champ +0 = `arg_0` (ordre push/écriture inversé mais inoffensif : l'écriture mémoire précède l'exécution du call).
5. `69e955 call sub_69E970` — worker invoqué avec le bloc (premier et seul arg visible poussé).
6. `69e95a push 58h / 69e95c call BattleScratch_Unwind` — libération de exactly 0x58 octets, symétrique de l'allocation ; annotation E3a : « unwind bump dword_1D999C4 (inverse of bs_modulo) », cohérente avec globals.txt (seule globale : `dword_1D999C4`).
7. `69e961 add esp, 10h` — équilibre exactement les 4 push (4×4 = 16) → cdecl caller-cleanup sur les 4 appels, aucun arg résiduel.
8. Caller unique : `sub_69D670` @ `0x69d704` (callers.txt, `more: false`) — pas de contradiction, mais corps du caller absent du pack : la sémantique d'`arg_0` côté appelant n'est pas vérifiable en aveugle.

## Checks

- Callees cités présents dans callees.txt : `sub_69E9A0` @69e946 ✓, `bs_modulo` @69e94d ✓, `sub_69E970` @69e955 ✓, `BattleScratch_Unwind` @69e95c ✓ (section CALLS vide, lignes retrouvées sous CALL/ADD-ESP — mais les 4 adresses correspondent).
- Strides : aucun accès tableau ; constantes en nombres : taille bloc **0x58 = 88**, champ initialisé unique à l'offset **+0**. Les strides canoniques (F_CHAR 0x1D0, slot 0xD0, magie 32×5) n'apparaissent pas — absence cohérente avec un wrapper de 14 instructions.
- Polarité : **aucun setcc ni jcc** dans la fonction (14 instructions, flux linéaire) — check non applicable, signalé.
- Largeur retour : EAX résiduel de `BattleScratch_Unwind` ; type IDA `char` (AL) non étayé par opcode → déclaré non prouvé.
- Pièges §8 : pas de nom menteur ici (stub sans nom) ; pas de leurre `0x01000000` ; la constante `58h` est commentée `'X'` par IDA (caractère, trompeur) — c'est bien une **taille en octets**, preuve : poussée comme `nbytes` aux deux calls alloc/unwind.

## Questions ouvertes

1. Que fait `sub_69E970` avec le bloc 0x58 (champ +0 = argument) ? Détermine le vrai nom domaine (le préfixe MAG du libellé de cellule n'est pas prouvé par le pack).
2. Rôle exact de `sub_69E9A0` (validation ? init ?) — retour volontairement ignoré.
3. Le caller `sub_69D670` @0x69d704 utilise-t-il la valeur de retour (EAX résiduel) ? Si oui, `char __cdecl` serait sérendipité, pas conception.
4. `wiki.md` indisponible (échec qmd) : convergence wiki à rétablir lors d'une passe avec QMD opérationnel.

## IDBCOMMENT

Wrapper scratch battle : alloue 0x58 octets via bs_modulo, ecrit l'argument dans le premier dword du bloc et passe ce bloc au worker sub_69E970, apres un pre-appel sub_69E9A0(arg) dont le retour est ignore. L'arene est restituee par BattleScratch_Unwind(0x58), bump inverse de dword_1D999C4 ; EAX retourne au caller est un residu non significatif. [semantic-triple 2026-09-20]
