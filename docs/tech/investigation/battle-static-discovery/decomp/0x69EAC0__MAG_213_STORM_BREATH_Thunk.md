# MAG_213_STORM_BREATH_Thunk @ 0x69EAC0

- Instr (live): 5 (14 o, 0x69EAC0-0x69EACD)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - thunk cdecl pur : recharge arg0 (0x69EAC0), le repousse, appelle sub_69EAF0 (0x69EAC5), cleanup add esp,4 (0x69EACA), retourne EAX tel quel (0x69EACD) ; entree tabulee de dispatch de la magie 213 (xref data 0xC81AC4, slot +1 apres 0xC81AC0 = magie 212)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: MAG_213_STORM_BREATH\nTYPE ; proposition: MAG_213_STORM_BREATH_Thunk
- Notes parent: checks 5.6 OK (role P) : asm 5 instr integral lu au sol (0x69EAC0-ECD), forwarding pur, xref data 0xC81AC4 dans callers.txt, mapping slot = magie 213 coherent avec 0.1 (0xC81AC0 = 212, fichiers mag212.tim = offset -1) ; convergence c_a/sem_a

## C reconcilie

```c
// c_a.c — reconstruction C fidèle à l'ASM live
// Ground truth = live ASM (asm.asm @ 0x69EAC0), PAS Hex-Rays.
// Taille : 0x0D (0x69EAC0..0x69EACC inclus), 5 instructions.
// Type IDA : 'int __cdecl(int)'. Hex-Rays : void* __cdecl(unsigned __int8*).
// Sauvegardes de registres : aucune (eax modifié sans sauvegarde).
//
// Structure : thunk / trampoline pur — pas de logique propre.
//  - lit arg_0 (dword à [esp+4] à l'entrée)
//  - le repousse (cdecl, 1 arg)
//  - appelle sub_69EAF0
//  - nettoie 1 slot (add esp, 4)
//  - retourne tel quel la valeur d'eax laissée par sub_69EAF0
//
// Xrefs : uniquement une data ref à 0xC81AC4 (table de vtables/handlers de
// magies) — pas de caller code direct. Cohérent avec un stub de sort MAG_213
// "STORM_BREATH" dispatché par table.
//
// Hex-Rays (hexrays.c) est cohérent avec l'ASM ici : simple return
// sub_69EAF0(a1). Aucune divergence détectée. Seul le type du paramètre
// (int vs unsigned __int8*) n'est pas prouvable depuis ce thunk seul.

int __cdecl MAG_213_STORM_BREATH(int arg_0) // arg_0 = dword @ [esp+4] à l'entrée
{
    // 69eac0  mov eax, [esp+arg_0]
    // 69eac4  push eax                       ; 1 seul arg, poussé droite→gauche
    // 69eac5  call sub_69EAF0                ; callee inconnu par ailleurs (callees.txt sans proto)
    // 69eaca  add esp, 4                     ; nettoyage cdecl du 1er slot
    // 69eacd  retn                           ; eax = retour de sub_69EAF0 transmis tel quel
    return sub_69EAF0(arg_0);
}

// UNCERTAIN 0x69EAC0 largeur/type exact du retour : le thunk transmet eax de
//   sub_69EAF0 sans conversion ; 'int' (type IDA) vs 'void*' (Hex-Rays)
//   indécidable depuis ce seul stub.
// UNCERTAIN 0x69EAC0 type réel de arg_0 : 'int' (IDA) vs 'unsigned __int8*'
//   (Hex-Rays) — aucun accès/masque dans le thunk pour trancher.
// UNCERTAIN 0x69EAC0 rôle sémantique de sub_69EAF0 : callee listé mais sans
//   prototype ; pas de reconstruction possible depuis ce pack.
```

## Analyse semantique

# Sémantique MAG_213_STORM_BREATH @ 0x69EAC0 (analyse A, mode aveugle 1+P)

- Rôle (1 phrase) : thunk cdecl pur (14 octets) qui retransmet son unique argument à `sub_69EAF0` et retourne son EAX inchangé — point d'entrée tabulé de la magie 213, toute la logique résidant dans le callee.
- Confiance : **CERTAIN** pour le rôle structurel (thunk/trampoline 1-arg → 0x69EAF0, prouvé par les 5 opcodes cités ci-dessous). L'identité thématique « souffle d'orage / sort 213 » reste **LIKELY** : ni wiki (pack en échec + QMD ff8-wiki sans hit) ni proto du callee dans `callees.txt` — non déguisée en fait.
- Nom catalogue : **confirme en tant que point d'entrée MAG_xxx** ; le qualificatif `STORM_BREATH` est ni confirmé ni contredit depuis ce pack (nom non preuve). Proposition markdown seule (PAS de rename) : `MAG_213_STORM_BREATH_Thunk` ou annotation `MAG_213_STORM_BREATH -> sub_69EAF0`.

## In / Out / Effets
- **In** : 1 argument cdecl 32 bits `[esp+4]` (`arg_0`), poussé par le caller droite→gauche (1 seul arg). Sémantique (index de cible ? contexte de sort ?) **indéterminée** depuis le pack.
- **Out** : `int` 32 bits = EAX du callee, transmis sans troncature (aucune instruction ne touche EAX après le `call` ; pas de réduction AL type `Battle_GetRandomInt` dans le thunk).
- **Effets** : pile équilibrée (`push` 4 o @0x69eac4 / `add esp,4` @0x69eaca, ESP restauré au `retn`) ; aucun accès global (`globals.txt` vide) ; aucun flag ni registre persistant modifié ; appel indirect impossible — forwarding statique vers 0x69EAF0.

## Preuves (ASM adresées)
1. `0x69eac0  mov eax,[esp+arg_0]` — lit l'unique argument cdecl du frame appelant.
2. `0x69eac4  push eax` + `0x69eac5  call sub_69EAF0` — ré-empilement droite→gauche d'exactement 1 argument puis forwarding : le callee voit `[esp+4]` identique à l'entrée de 0x69EAC0.
3. `0x69eaca  add esp,4` — nettoyage cdecl d'1 seul argument, aligné sur le type `int __cdecl(int)` de `meta.json` (SIZE 14 = 0xE, somme des 5 instructions).
4. `0x69eacd  retn` sans instruction intermédiaire touchant EAX — largeur de retour = EAX 32 bits du callee, passthrough strict.
5. `callers.txt` : unique xref **data** `0xc81ac4` (`fn: null`) — la fonction n'est jamais appelée en code : elle est enregistrée comme pointeur de fonction dans une table de données (dispatch par ID de magie), cohérent avec le préfixe `MAG_`.
6. Wiki (rattrapage QMD `ff8-wiki`, le `wiki.md` du pack ayant échoué) : convention `MAG_xxx` documentée pour des entrées sœurs (« MAG_234 FamilyB » @0xA4A00C → `ParsePolygons_GfMagic 0x5106E0`) — cohérence de famille, mais **aucun** hit sur MAG_213 / 0x69EAC0 / sub_69EAF0 / « Storm Breath ».

## Checks
- Callees cités présents dans `callees.txt` : oui — `sub_69EAF0` figure dans la section « CALL/ADD-ESP LINES » (ligne `69eac5 call sub_69EAF0`) ; à noter : les sections `CALLS:` et `PROTOS:` sont vides, donc **aucun proto ni arbre du callee**.
- Strides en nombres : N/A (aucun accès mémoire structuré, aucun stride).
- Polarité : N/A (aucune branche, aucun test de bit, pas de `0x40` ni masque).
- Largeur retour : EAX 32 bits passthrough confirmé par opcodes ; comportement AL-only éventuel **du callee** invérifiable ici (question ouverte).

## Questions ouvertes
- Contenu de `sub_69EAF0` (dégâts ? élément foudre/vent ? animation ?) : invérifiable depuis ce pack — décide seul de l'identité « Storm Breath ».
- Contenu de la table à `0xc81ac4` (index réel de l'entrée, voisins `MAG_xxx`) : non lisible depuis le pack.
- Le callee tronque-t-il son retour à AL (comme `Battle_GetRandomInt`) ? Le thunk, lui, ne tronque pas.

## IDBCOMMENT
Thunk cdecl 1 argument : recharge arg0 depuis la pile (0x69EAC0), le repousse puis appelle sub_69EAF0 (0x69EAC5), nettoie 4 octets (0x69EACA) et retourne EAX sans modification. Enregistre comme pointeur de fonction dans une table de donnees (xref data 0xC81AC4), coherent avec une entree de dispatch de la magie 213. Toute la logique du sort reside dans sub_69EAF0. [semantic-triple 2026-09-20]
