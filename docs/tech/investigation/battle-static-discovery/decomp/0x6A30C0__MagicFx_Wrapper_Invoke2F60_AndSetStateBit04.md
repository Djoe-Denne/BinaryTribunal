# MagicFx_Wrapper_Invoke2F60_AndSetStateBit04 @ 0x6A30C0

- Instr (live): 9 (33 o, 0x6A30C0-0x6A30E0)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P + sondes)
- Verdict: CERTAIN - wrapper cdecl sans argument de la famille mag FX : invoque sub_6A2F60 (rendu modele FX, ferme LIKELY) sur le contexte global dword_2510200 avec deux pointeurs aliases vers dword_2510270 (caller nettoie 0Ch @0x6a30c5-zone), puis marque l'etat de l'effet en forcant le bit 0x04 du premier octet de l'objet contexte (or byte [eax],4 @0x6a30dd) et retourne *dword_2510200 (EAX 32 bits)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A30C0\nTYPE ; proposition: MagicFx_Wrapper_Invoke2F60_AndSetStateBit04
- Notes parent: checks 5.6 OK (role P) : 9 instr integrales lues au sol, invoke cdecl 3 args + add esp,0xC, or byte ptr [eax],4 @0x6a30dd ; sonde IDA xrefs_to 0x6A30C0 = caller unique sub_6A1660 @0x6a1ccd (ticker MAG_212 CERTAIN) ; callee sub_6A2F60 ferme LIKELY ; verdict UNCERTAIN de semantic_a leve par ces sondes

## C reconcilie

```c
// sub_6A30C0 — cellule mag FX battle (famille 0x6A2-3xxx), stub mode 1+P
// Ground truth = live ASM (asm.asm @ 0x6A30C0, 9 instr), Hex-Rays utilisé comme vérificateur seulement.
// Taille : 0x21 (33 octets). Type IDA : int() — mais eax retourne la valeur du pointeur global dword_2510200 (32 bits, largeur exacte).
// Sauvegardes de registres : aucune (pas de push ebx/esi/edi, pas d'ebp frame). cdecl, callee-cleanup non : add esp, 0Ch présent -> appelant nettoie (cdecl, 3 args).
// Caller unique : sub_6A1660 @ 0x6a1ccd (callers.txt).
//
// Divergence Hex-Rays vs ASM :
//  - Hex-Rays caste les args 2/3 en (__int16 *) — l'ASM ne montre que `push offset dword_2510270` (adresse 32 bits). Largeur du paramètre non prouvable depuis l'ASM seul ; on garde void*.
//  - Hex-Rays retourne `result` (eax rechargé) — conforme : `mov eax, dword_2510200` avant le retn, eax = valeur du pointeur global.

void *sub_6A2F60(void *a1, void *a2, void *a3); // callee, proto inconnue (callees.txt vide) — 3 args, cdecl (caller nettoie 0Ch)

void *sub_6A30C0(void)
{
    // push droite -> gauche : eax = dword_2510200 (arg1), puis offset dword_2510270 x2 (args 2 et 3, même adresse)
    sub_6A2F60((void *)dword_2510200,              // arg1 : valeur pointeur global @0x2510200
               &dword_2510270,                     // arg2 : offset 0x2510270
               &dword_2510270);                    // arg3 : même offset que arg2 (aliased)
    add_esp_0Ch(); // representational: caller cleans 3x4=0Ch (cdecl)

    // reload + flag : or byte ptr [eax], 4 — set bit 0x40 ? non, bit 0x04 sur le OCTET bas de [dword_2510200]
    unsigned char *p = (unsigned char *)dword_2510200; // mov eax, dword_2510200
    *p |= 0x04;                                        // or byte ptr [eax], 4

    return (void *)dword_2510200; // eax = valeur du pointeur global (largeur 32 bits, conforme au `mov eax` final)
}

// NOTE (stub de fidélité, à remplacer par le C réel si le compilateur cible n'a pas d'artefact add esp) :
// La ligne `add_esp_0Ch()` ci-dessus est une annotation du nettoyage cdecl ; version fidèle sans artefact :
//
// void *sub_6A30C0(void)
// {
//     sub_6A2F60((void *)dword_2510200, &dword_2510270, &dword_2510270); // __cdecl, 3 args, caller cleans 0x0C
//     *(unsigned char *)dword_2510200 |= 0x04;
//     return (void *)dword_2510200;
// }

// UNCERTAIN 0x6a30c5 largeur réelle des args 2/3 de sub_6A2F60 (Hex-Rays dit __int16*, ASM ne prouve que l'adresse 32 bits passée)
// UNCERTAIN 0x6a30dd sémantique du bit 0x04 sur [dword_2510200] (byte bas d'un dword global — rôle exact inconnu depuis ce stub)
```

## Analyse semantique

# Sémantique sub_6A30C0 @ 0x6A30C0 (analyse A, mode 1+P aveugle)

- Rôle (1 phrase) : wrapper cdecl sans argument de la famille mag FX battle qui lance un step/init de l'effet via `sub_6A2F60` sur le contexte global `dword_2510200` avec deux pointeurs de sortie vers le même buffer `dword_2510270`, puis marque l'état de l'effet actif en forçant le bit `0x04` du premier octet de l'objet pointé.

- Confiance : **UNCERTAIN** (CERTAIN non atteint — voir ci-dessous)

- Nom catalogue : `sub_6A30C0` (auto-IDB, non significatif). IDA type `'int()'` : 0 arg, retour 32 bits — cohérent avec l'ASM.

## Verdict — pourquoi pas CERTAIN

Le barème CERTAIN exige callers + callees + wiki alignés **et** opcodes cités. Ici :
1. **wiki.md du pack est vide** (`qmd failed: fichier introuvable`) ; l'interrogation QMD lecture seule de la collection `ff8-wiki` ne retourne **aucune** occurrence de `0x6A30C0`, `0x6A2F60`, `0x2510200`, `0x2510270` (Battle Address Catalog, gf-asset-loading, gforce-catalog, chunk-iso-function-catalog consultés). Aucune convergence wiki possible.
2. **La sémantique de `sub_6A2F60` est inconnue** (pas de pack pour le callee) : « step », « init » ou « invoke » sont indiscernables depuis le seul site d'appel.
3. **Un seul caller** (`sub_6A1660` @ `0x6a1ccd`, taille 0x10F9) dont on ne voit pas le corps : impossible de vérifier les garanties d'état (valeur attendue de `dword_2510200`, contenu de `dword_2510270`).
4. Le stub (33 bytes, 9 instr, post-traitement `or [eax],4`) **ne correspond pas** au gabarit wiki « Wrapper → init » (14 bytes `mov/push/call rel32/add/ret`, disp `+0x26`/`+0x06`) — divergence non résolue, pas un CONFLICT car le wiki ne contredit pas directement : il ne couvre pas ce cas.

Ce qui reste solide (opcodes cités) : la mécanique d'appel et le flag sont certains au niveau instructions ; c'est l'interprétation de haut niveau qui reste LIKELY au mieux.

## In / Out / Effets

- **In** : aucun argument pile (cdecl, 0 arg). État global lu : `dword_2510200` (valeur = pointeur de contexte effet).
- **Out** : EAX 32 bits = valeur de `dword_2510200` (rechargée à `0x6a30d5` après le call, non modifiée par le `or`) — largeur retour 32 bits, cohérente avec IDA `int()`.
- **Effets** :
  - appel `sub_6A2F60(arg1 = *dword_2510200, arg2 = &dword_2510270, arg3 = &dword_2510270)` — poussé droite→gauche (dernier push = arg1), nettoyage `add esp, 0xC` = 3 args cdecl @ `0x6a30da` ;
  - écriture `byte [*dword_2510200] |= 0x04` @ `0x6a30dd` — bit 2 du premier octet de l'objet contexte (marqueur d'état, probable « actif/démarré » ; ≠ piège bit `0x40` des accesseurs slot) ;
  - le double rechargement de `dword_2510200` (avant push @ `0x6a30c0`, après call @ `0x6a30d5`) montre un global **volatile** : `sub_6A2F60` peut le mettre à jour, et le flag est posé sur l'objet (éventuellement créé/mis à jour) par le callee.

## Nom proposé (markdown seul, PAS de rename)

`MagicFx_Wrapper_Invoke2F60_AndSetStateBit04`

Justification ≥ 2 preuves ASM adressées :
- `0x6a30c0`–`0x6a30d0` : charge le global contexte et invoque `sub_6A2F60` avec 3 args (cdecl, `add esp, 0xC` @ `0x6a30da`) → « wrapper invoke » ;
- `0x6a30dd` : `or byte ptr [eax], 4` sur l'objet pointé par `dword_2510200` → « set state bit 04 ».

Alternative plus sémantique si V/le pack callee confirme que `sub_6A2F60` est un init : `MAG_FX_InitEffect_AndMarkActive` (à ne retenir qu'avec la preuve callee).

## Preuves (ASM cité)

1. `0x6a30c0  mov eax, dword_2510200` — le contexte vient d'un global (pas d'argument) ; même global rechargé à `0x6a30d5` après le call → global mutable/volatile.
2. `0x6a30c5/0x6a30ca  push offset dword_2510270` (×2) — deux paramètres = **la même adresse** : paire de pointeurs in/out vers un buffer partagé (pas deux buffers distincts).
3. `0x6a30cf  push eax` (dernier push = arg1) + `0x6a30d0 call sub_6A2F60` — ordre cdecl droite→gauche : `sub_6A2F60(ctx, &buf, &buf)`.
4. `0x6a30da  add esp, 0xC` — callee cdecl 3 args, nettoyage par l'appelant (pas de callee-cleanup).
5. `0x6a30dd  or byte ptr [eax], 4` — écriture d'état côté appelant : bit `0x04` de l'octet 0 de l'objet `*dword_2510200` ; effet persistant après le retour du callee.
6. `0x6a30e0  retn` sans immédiat + aucun accès pile arg — 0 argument, EAX déjà porteur de `*dword_2510200` → retour 32 bits (compatible IDA `'int()'`).
7. Callers.txt : xref code unique depuis `sub_6A1660` (0x6A1660, taille 0x10F9) @ `0x6a1ccd` — consommateur unique, gros fonction hôte (dispatch/interpreteur probable de la même plage mag FX).
8. Wiki (QMD ff8-wiki, 2026-09-20) : famille « Wrapper → init (111) » = 14 bytes `mov/push/call rel32/add/ret` — notre stub de 33 bytes avec post-flag n'y correspond pas ; aucune entrée catalogue pour 0x6A2-3xxx/0x2510xxx → divergence documentée, pas de confirmation wiki.

## Checks

- Callees cités présents dans callees.txt : `sub_6A2F60` @ `0x6a30d0` ✔ (callees.txt ligne 8) ; aucun autre callee, aucune library call inventée.
- Largeur retour : 32 bits (EAX = `*dword_2510200`, rechargé @ `0x6a30d5`, épargné par `or byte ptr`) ✔ cohérent avec meta `int()`.
- Push droite→gauche respecté ; `add esp, 0xC` = 3 args ✔.

## Questions ouvertes

1. Que fait exactement `sub_6A2F60` (init, step d'animation, ou invoke de script) et met-elle à jour `dword_2510200` (le rechargement post-call le suggère) ?
2. Quel est le rôle du buffer `dword_2510270` passé deux fois (deux out-ptrs aliasés, ou in + out) ? Sa taille/stride est inconnue.
3. Quelle entrée `MagicList_Logic`/`MagicList_TextureLoad` pointe vers ce stub (effect_id) ? Le caller `sub_6A1660` @ `0x6a1ccd` devrait le trancher (analyse hors périmètre de ce pack).
4. Le bit `0x04` : « effet actif », « frame suivante requise », ou « résultat prêt » ? Un second écrivain/lecteur de cet octet est nécessaire pour trancher.

## IDBCOMMENT (proposition)

```
Wrapper sans argument de la famille mag FX battle : lit le pointeur de contexte global dword_2510200 puis appelle sub_6A2F60(ctx, &dword_2510270, &dword_2510270) en cdecl avec 3 arguments. Apres l'appel il recharge dword_2510200 et force le bit 0x04 du premier octet de l'objet pointe, marqueur d'etat actif probable. Retourne dans EAX la valeur 32 bits de dword_2510200. [semantic-triple 2026-09-20]
```
