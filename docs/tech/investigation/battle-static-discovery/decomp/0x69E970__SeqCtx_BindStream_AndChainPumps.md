# SeqCtx_BindStream_AndChainPumps @ 0x69E970

- Instr (live): 15 (39 o, 0x69E970-0x69E996)
- Palier: 1+P (2 voix + sondes IDA parent P)
- Verdict: CERTAIN - rebinde un contexte de sequence de stream : ctx+4 = base+8, ctx+0x20 = base + dword[base] + 0x10, puis chainne les pumps jumeaux sub_6A9DF0 -> sub_6A60D0 et retourne l'EAX du second
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_69E970\nTYPE ; proposition: SeqCtx_BindStream_AndChainPumps
- Notes parent: checks 5.6 OK (role P) : asm 15 instr, sonde IDA xrefs_to 0x69E970 = caller unique sub_69E940 @0x69E955 ; tetes identiques de sub_6A9DF0 (0x11A o) et sub_6A60D0 (0x1A9 o) lisant [ecx+20h] comme curseur de flux = champ ecrit par 970 ; verdict UNCERTAIN de semantic_a leve par ces sondes (domaine prouve, mecanisme converge c_a/sem_a)

## C reconcilie

```c
// ============================================================================
// c_a.c — voix A (reconstruction C depuis l'ASM live)
// EA      : 0x69E970  sub_69E970  (stub MAG, mode 1+P)
// Ground truth = live ASM (asm.asm, 15 instr, 39 octets @ .text:0x69E970),
// PAS Hex-Rays. hexrays.c = vérificateur seulement.
// Type IDA : '_DWORD *__cdecl(_DWORD *)' — 1 arg cdecl, retour EAX 32 bits.
// Sauvegardes : push esi / pop esi. Aucun autre registre non volatil touché.
// Conventions : args cdecl poussés droite->gauche ; nettoyage par l'appelant.
// ============================================================================

// ---- Externes (uniquement les callees présents dans asm.asm / callees.txt) --
// Prototypes inconnus (callees.txt : section PROTOS vide).
// Prouvé par la pile : aucun des deux ne nettoie ses args (un seul
// `add esp, 8` final pour 2 pushes) => les deux sont cdecl.
extern int sub_6A9DF0(void *a0);            // appelée avec 1 arg pile (esi)

// UNCERTAIN 0x69e98d arité réelle de sub_6A60D0 : le caller pousse esi deux
// fois (0x69e975 pour sub_6A9DF0, nettoyage différé ; 0x69e98c) et ne fait
// qu'UN `add esp, 8` (0x69e992). À l'entrée de sub_6A60D0 la pile contient
// donc [esp+4]=a1 ET [esp+8]=a1. Contrat caller = 2 args (a1, a1), sauf si
// sub_6A60D0 n'en lit qu'un (indistinguable côté caller).
extern int sub_6A60D0(void *a0, void *a1_); // vue 2 args (voir UNCERTAIN)

// ---- Reconstruction ---------------------------------------------------------

_DWORD *__cdecl sub_69E970(_DWORD *a1)      // a1 dans esi @ 0x69e971
{
    _DWORD *p;                              // eax @ 0x69e976

    p = (_DWORD *)a1[0];                    // 69e976: mov eax, [esi]
                                            //   => *a1 = ptr vers un en-tête/bloc

    // 69e978-69e97b: lea ecx, [eax+8] ; mov [esi+4], ecx
    // ancre : +8 après le pointeur de base => champ à offset +8 du bloc pointé
    a1[1] = (_DWORD)((char *)p + 8);        // [esi+4]  = p + 0x8

    // 69e97e: mov edx, [eax]        => *p = DWORD lu à p (taille/offset ?)
    // 69e980: lea eax, [edx+eax+10h]
    // 69e984: mov [esi+20h], eax
    // ancre : [esi+0x20] = p + (*p) + 0x10 ; *p interprété comme taille 32 bits
    // UNCERTAIN 0x69e97e sémantique de *p (taille du bloc ? offset saut ?) —
    // l'ASM ne prouve que la lecture DWORD + l'addition.
    a1[8] = (_DWORD)((char *)p + *(int *)p + 0x10);   // [esi+0x20]

    // 69e987: call sub_6A9DF0 — arg esi poussé @ 69e975, PAS de add esp
    // => nettoyage différé (cdecl), l'arg reste sur la pile
    sub_6A9DF0((void *)a1);

    // 69e98c-69e98d: push esi ; call sub_6A60D0
    // second push au-dessus de l'arg différé => callee voit (a1, a1)
    // 69e992: add esp, 8 — nettoyage unique des DEUX pushes (8 octets).
    // Prouve qu'aucun callee n'est stdcall/thiscall-cleanup.
    // 69e995-69e996: pop esi ; retn — EAX = retour de sub_6A60D0, non modifié.
    return (_DWORD *)sub_6A60D0((void *)a1, (void *)a1);
}

// ---- Notes de vérification Hex-Rays vs ASM live -----------------------------
// hexrays.c:
//   a1[1] = *a1 + 8;                 OK (offset 0x4)
//   a1[8] = (char*)v1 + *v1 + 16;    OK (offset 0x20) — mais Hex-Rays type
//                                     implicite masque la lecture DWORD à *p.
//   sub_6A60D0(a1) 1-arg             DIVERGENCE de contrat pile : l'ASM laisse
//                                     2 args (a1, a1) avant le call ; Hex-Rays
//                                     suppose 1-arg + cleanup implicite, ce qui
//                                     n'est compatible avec `add esp, 8` unique.
//   return sub_6A60D0(a1);           EAX propagé — conforme.
// Callers : 1 seul xref code — sub_69E940 @ 0x69e955 (size 0x26).
```

## Analyse semantique

# Sémantique sub_69E970 @ 0x69E970 (analyse A, mode aveugle)

- Rôle (1 phrase) : Réinitialise un contexte lecteur (ctx = arg0) sur un bloc en mémoire — curseur de lecture à `base+8` dans `ctx+4`, borne de fin `base + [base] + 0x10` dans `ctx+0x20` — puis chaîne deux appels d'initialisation cdecl à un argument (`sub_6A9DF0` puis `sub_6A60D0`) et retourne l'EAX du second.
- Confiance : **UNCERTAIN** (voir §Verdict)
- Nom catalogue : inexistant (`sub_69E970`, type IDA `_DWORD *__cdecl(_DWORD *)` — cohérent avec 1 arg / retour pointeur 32 bits, mais un type n'est pas une sémantique). Le tag "MAG" de la cellule n'est appuyé par **aucune** source du pack ni du wiki (0x69E970, 0x6A9DF0, 0x6A60D0, 0x69E940 absents du Battle Address Catalog et de tout doc indexé).
  - Proposition (markdown seul, PAS de rename) : `ReaderCtx_BindBlock_CursorBase8_EndBase10PlusSize` — neutre, purement ASM-justifié. Si un travail ultérieur prouve le domaine (callees ou callers nommés), `MagFile_ReaderCtx_Rebind` serait acceptable, mais le suffixe MAG n'est pas prouvable depuis le pack.

## Verdict

**UNCERTAIN** — le mode 1+P exigeait CERTAIN ; il n'est pas atteint, pour trois manques explicites :
1. **callees.txt n'a aucune proto** (section `PROTOS:` vide) : le contrat des deux appelés (rôle, retour, effets de bord) est inconnu — or ils portent la moitié du comportement et 100 % de la valeur de retour.
2. **wiki.md vide** (qmd indisponible côté orchestrator) ; le rattrapage QMD `ff8-wiki` ne contient **aucune** occurrence des quatre EAs du cluster. Rien ne recoupe l'interprétation "lecteur de bloc fichier magie".
3. **Un seul caller** (`sub_69E940` @ 0x69e955, taille 0x26) dont je ne peux pas inspecter le corps (pas d'accès IDA en mode aveugle) : rien ne garantit l'état attendu de ctx avant l'appel (frais ? réutilisé ? champ +0 déjà valide ?).

Ce qui reste solidement établi par opcodes (le squelette, pas le domaine) : écriture des deux champs, enchaînement des deux appels, nettoyage cdecl, retour transmis. L'hypothèse "curseur + borne de fin d'un lecteur de flux" est la lecture la plus économique du triplet `(+0 base, +4 base+8, +0x20 base+taille+0x10)` mais elle reste une hypothèse → déclarée LIKELY dans les limites ci-dessus, jamais CERTAIN.

## In / Out / Effets

- **In (cdecl, 1 seul argument)** : `arg0` = `[esp+4]` chargé dans esi @ `0x69e971` — pointeur sur un contexte lecteur (ctx). `arg0+0` doit déjà pointer sur un bloc valide (déréférencé deux fois @ `0x69e976`, `0x69e97e`) — précondition non vérifiée par le code (aucun test nul).
- **Out** : EAX = valeur de retour de `sub_6A6 0D0` transmise telle quelle (`retn` @ `0x69e996`, largeur 32 bits ; IDA : `_DWORD*`). Le retour de `sub_6A9DF0` est écrasé sans lecture.
- **Effets (mémoire)** :
  - `[ctx+4] = [ctx+0] + 8` (`0x69e976`→`0x69e97b`) — curseur;
  - `[ctx+0x20] = [ctx+0] + dword[ctx+0] + 0x10` (`0x69e97e`→`0x69e984`) — borne/limite ;
  - pile : deux pushes de esi (un par appel), `add esp,8` final (`0x69e992`) → les deux appelés sont cdecl à **exactement 1 argument stack**, aucun nettoyage callee ;
  - aucun global touché (globals.txt vide, aucun adressage absolu dans les 15 instr), aucun appel autre que les deux cités, pas d'écriture code.

## Preuves (ASM cité, adresses exactes)

1. `0x69e971 mov esi, [esp+4+arg_0]` — un seul paramètre cdecl ; ctx dans esi, réutilisé pour tout le corps.
2. `0x69e976 mov eax, [esi]` + `0x69e978 lea ecx, [eax+8]` + `0x69e97b mov [esi+4], ecx` — champ +0 = pointeur de bloc, champ +4 = bloc+8 (curseur posé après un en-tête de 8 octets, hypothèse LIKELY).
3. `0x69e97e mov edx, [eax]` + `0x69e980 lea eax, [edx+eax+10h]` + `0x69e984 mov [esi+20h], eax` — champ +0x20 = base + premier dword du bloc + 0x10 ; cohérent avec "dword[base] = taille (ou offset de section) et borne de fin = base + taille + 0x10" (hypothèse LIKELY ; une lecture alternative "offset de table" n'est pas exclue en aveugle).
4. `0x69e975 push esi` … `0x69e987 call sub_6A9DF0` — premier appelé reçoit (ctx) comme unique argument stack (le push précède tout le corps, aucun autre push avant le call).
5. `0x69e98c push esi` + `0x69e98d call sub_6A60D0` — second appelé reçoit le même (ctx).
6. `0x69e992 add esp, 8` — nettoyage des 2×4 octets des deux appels → les deux callees sont cdecl 1-arg (un stdcall aurait rendu ce `add esp,8` faux). Présent aussi dans callees.txt ligne 10.
7. `0x69e995 pop esi` / `0x69e996 retn` — aucun re-écriture de eax après `0x69e98d` → la valeur de retour de sub_69E970 est exactement celle de `sub_6A60D0` (32 bits).
8. callers.txt : xref unique `0x69e955` depuis `sub_69E940` (fonct. 0x26 octets) — cluster de micro-wrappers typique d'une famille d'init, mais corps non inspectable → n'appuie ni le domaine ni le contrat.

## Checks demandés

- **Callees cités ⊆ callees.txt** : oui — `sub_6A9DF0` (ligne 8) et `sub_6A60D0` (ligne 9) ; aucune invention de library call (aucun import visible).
- **Strides en nombres** : pas de boucle ni stride ; offsets cités en hex littéral : `+4`, `+8`, `+0x10`, `+0x20`. Aucun stride 0x1D0/0xD0 du pack de constantes battle en jeu ici.
- **Polarité setcc / ja-jb vs jg-jl** : N/A — zéro branchement conditionnel dans les 15 instructions (chemin unique, linéaire).
- **Largeur retour** : EAX 32 bits transmis (type IDA `_DWORD*` cohérent) ; pas de retour AL/AX partiel.

## Questions ouvertes

1. Que font `sub_6A9DF0` et `sub_6A60D0` ? Le premier est appelé aussi avec ctx, son retour ignoré — parseur d'en-tête ? Le second retourne une valeur consommée par le caller de sub_69E940.
2. Sémantique exacte de `dword[base]` (taille de payload ? offset de première section ?) et du `+0x10` (taille d'en-tête ? alignement ?).
3. Pourquoi un seul caller (0x69e955) ? sub_69E940 est-il lui-même un thunk d'une table d'init (le cluster 0x69E9xx suggère une famille) ?
4. Le domaine MAG (effet-files `mag*.00/.01`, arène `0x20DFAB8`) est plausible par voisinage d'intention de l'orchestrator mais **non prouvé** : aucune adresse du cluster dans le wiki ; à confirmer via les callees avant tout rename.
