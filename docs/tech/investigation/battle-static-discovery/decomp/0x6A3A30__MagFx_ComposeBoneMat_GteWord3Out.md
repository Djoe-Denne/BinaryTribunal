# MagFx_ComposeBoneMat_GteWord3Out @ 0x6A3A30

- Instr (live): 39 (146 o, 0x6A3A30-0x6A3AA3)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P + sondes)
- Verdict: CERTAIN - helper battle mag FX : pour un record arg0 (index os s16 a +6), compose la matrice os (FK BattleSkeleton_BuildHierarchicalFK sur dword_2510200+0x60 @0x6A3A3C-46, header +10h, stride 0x30 via lea eax*3 shl 4 @0x6A3A5A-67) avec 2510200+0x40 via Mat_ComposeTwoThenCopy8 @0x6A3A6D, arme le GTE (Field_readCa + Camera_ReadVariables_Space + setSomeDword5 + thunk MVMVA 0x480012 @0x6A3A77-8C) et copie les 3 mots de l'etat 1CA8A34 vers arg1 (GteState_GetWord3 @0x6A3A96) ; aucun retour demontre (epilogue sans ecriture eax)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A3A30\nTYPE ; proposition: MagFx_ComposeBoneMat_GteWord3Out
- Notes parent: checks 5.6 OK (role P) : 39 instr integraux lues au sol, FK+60h (0x6A3A3C-46), index os stride 0x30 (0x6A3A5A-67), Compose (0x6A3A6D), chaine GTE (0x6A3A77-96), epilogue sans eax (0x6A3A9B-A3), caller sub_6A1660 @0x6a194c (callers.txt) ; verdict LIKELY de semantic_a remonte en CERTAIN par le parent (mecanisme integral prouve + caller ancre)

## C reconcilie

```c
/* ============================================================================
 * sub_6A3A30 - 0x6A3A30 (.text), 39 instructions (live ASM), taille 0x74
 * Voix c_a : C fidele a l'ASM live (asm.asm). Hex-Rays (hexrays.c) = verificateur.
 * Ground truth = live ASM, pas Hex-Rays.
 * ----------------------------------------------------------------------------
 * Prototype IDA : _WORD *__cdecl(int a1, _WORD *a2)   (meta.json, SIZE 116)
 * Caller unique : sub_6A1660 @ 0x6A194C (xref code, "more": false)
 * Famille : mag FX battle (plage 0x6A3-5xxx). g_BattleOTBase+0x44 et
 * dword_2510258 (contexte famille) n'apparaissent PAS dans cette cellule.
 *
 * Shape (3 phases, ordre ASM strict) :
 *   1) FK squelettal : BattleSkeleton_BuildHierarchicalFK(dword_2510200+0x60)
 *   2) compose 2 matrices -> tampon local v4 (8 dwords, 0x20 octets) indexe
 *      par (short)a1[+6] * 0x30 ; puis Field_readCa(v4), Camera_ReadVariables_Space(v4)
 *   3) setSomeDword5(a1), thunk GTE (MVMVA-like 0x12), GteState_GetWord3_1CA8A34(a2)
 *
 * Convention d'appel : cdecl, 8 slots d'arguments pousses au total (0x20
 * octets : 1+3+1+1+1+0+1), nettoyage differe UNIQUE en deux temps :
 *   add esp,0x20 @0x6A3A9B (les 8 slots d'args, aucun add esp intermediaire)
 *   pop edi / pop esi / add esp,0x20 @0x6A3AA0 (le frame sub esp,0x20)
 * Aucun add esp apres chaque call -> pas de stdcall cache.
 * Retour : eax du dernier callee propage tel quel au retn (largeur 32 bits).
 * ========================================================================== */

typedef unsigned short _WORD;

extern unsigned int dword_2510200;                    /* 0x2510200 (globals.txt, type IDA 'int') */

extern void   BattleSkeleton_BuildHierarchicalFK(void *arg);            /* 1 arg  */
extern void   Mat_ComposeTwoThenCopy8(void *matBase, void *src, void *dst8); /* 3 args ; cf. E3a : 0x56C090 + 0x56C600 + rep movsd 8 dwords vers dst */
extern void   Field_readCa(void *v4);                                   /* 1 arg  */
extern void   Camera_ReadVariables_Space(void *v4);                     /* 1 arg  */
extern void   setSomeDword5(void *a1);                                  /* 1 arg  */
extern void   Thunk_460860_480012(void);   /* 0 arg : push 0x480012; call sub_460860 (0x28e, MVMVA-like 0x12); pop ecx; ret */
extern _WORD *GteState_GetWord3_1CA8A34(_WORD *dst);                    /* 1 arg ; copie 3 mots depuis l'etat 0x1CA8A34 */

_WORD *__cdecl sub_6A3A30(int a1, _WORD *a2)
{
    unsigned int base;      /* eax : dword_2510200, lu 2 fois dans l'ASM */
    unsigned int skelPtr;   /* ecx : [base+0x64] */
    unsigned int esi;       /* esi : *skelPtr + 0x10 */
    int          idx;       /* eax : (short)[a1+6], movsx -> SIGNE */
    int          v4[8];     /* tampon 0x20 octets BYREF (= zone reservee par sub esp,0x20 @0x6A3A35), rempli par Mat_ComposeTwoThenCopy8 puis relu 2x */

    base    = dword_2510200;                              /* 6A3A30 */
    skelPtr = *(unsigned int *)(base + 0x64);             /* 6A3A38 : +0x64 = pointeur -> pointeur (double deref) */
    esi     = *(unsigned int *)skelPtr + 0x10;            /* 6A3A40/43 */

    BattleSkeleton_BuildHierarchicalFK((void *)(base + 0x60));   /* 6A3A42-46 : arg = base+0x60 (lu AVANT l'appel) */

    base = dword_2510200;                                 /* 6A3A54 : RELECTURE live POST-call (l'ASM recharge le global) */
    idx  = *(signed short *)((char *)a1 + 6);             /* 6A3A5A : movsx word ptr [edi+6] */

    Mat_ComposeTwoThenCopy8(
        (void *)(base + 0x40),                            /* 6A3A5E : arg1 = base+0x40 */
        (void *)(esi + 0x10 + 0x30 * idx),                /* 6A3A61-67 : eax=idx*3 puis shl 4 -> stride 0x30 par entree ; lea ecx,[eax+esi+10h] */
        v4);                                              /* 6A3A53 : arg3 = tampon 8 dwords (rep movsd 8 dwords) */

    Field_readCa(v4);                                     /* 6A3A76-77 */
    Camera_ReadVariables_Space(v4);                       /* 6A3A7C-81 */
    setSomeDword5((void *)a1);                            /* 6A3A86-87 */
    Thunk_460860_480012();                                /* 6A3A8C */
    return GteState_GetWord3_1CA8A34(a2);                 /* 6A3A91-96 : arg_4 = a2 ; eax propage au retn @0x6A3AA3 */
}

/* ----------------------------------------------------------------------------
 * Notes / divergences Hex-Rays vs ASM :
 *  - Hex-Rays factorise v2 = **(_DWORD **)(dword_2510200 + 100) + 16 et ecrit
 *    l'arg2 de Mat_ComposeTwoThenCopy8 comme (48 * idx + v2 + 16), soit
 *    **(base+0x64) + 0x20 + 0x30*idx. L'ASM decompose : esi = *[base+0x64]+0x10
 *    calcule AVANT BuildHierarchicalFK, puis +0x10+0x30*idx. C reproduit la
 *    decomposition ASM (l'ordre des lectures precede l'appel FK).
 *  - Hex-Rays cache la relecture de dword_2510200 a 0x6A3A54 (post-call) ;
 *    l'ASM la fait explicitement -> conservee ici.
 *  - Bytes compte closure : 8 pushes d'args = 0x20 octets = add esp,0x20
 *    unique @0x6A3A9B. Cohereint, rien a corriger.
 * --------------------------------------------------------------------------- */

// UNCERTAIN 0x6A3AA3 valeur de retour exacte : eax du dernier callee
//   (GteState_GetWord3_1CA8A34) propage tel quel au retn. Le type IDA (_WORD*)
//   et l'annotation "copy 3 words" suggere que le callee rend a2 identique,
//   mais l'identite du pointeur retourne n'est pas prouvable depuis ce caller
//   seul. Un retour small-int de type stepper famille (0/2) n'est pas exclu
//   par l'ASM seul ; le type _WORD* de l'IDA est retenu faute de preuve contraire.

// UNCERTAIN 0x6A3A5A role semantique de idx ((short)signe @ a1+6) : index dans
//   une table de pas 0x30 octets basee a *(*(dword_2510200+0x64))+0x20
//   (structurellement prouve), mais la nature de la table (frames/matrices
//   d'effets mag ?) n'est pas determinable depuis cette cellule.
```

## Analyse semantique

# Sémantique sub_6A3A30 @ 0x6A3A30 (analyse A, mode B aveugle — pack + QMD ff8-wiki lecture seule)

- Rôle (1 phrase) : helper battle mag-FX qui, pour un record passé en arg0 (index os = `s16` à +6), calcule la matrice os composée via la FK hiérarchique du modèle battle, la charge côté GTE (MVMVA 0x12) et exporte le vecteur résultat de 3 mots (`s16`) vers le tampon arg1.

- Confiance : **LIKELY**
  - Seuil CERTAIN (mode 1+P) **non atteint**, pourquoi : (1) callers.txt ne prouve qu'un unique site d'appel (`0x6a194c` dans `sub_6A1660`, taille 0x10F9) sans accès à la construction des arguments (aveugle, pas d'IDA) ; (2) aucun lemme wiki n'existe pour l'EA lui-même — `wiki.md` du pack est vide (échec qmd), la convergence wiki a été rétablie via QMD `ff8-wiki` mais ne couvre que les callees ; (3) trois callees restent sémantiquement opaques (`Field_readCa`, `Camera_ReadVariables_Space`, `setSomeDword5`). Le flux mécanique GTE, lui, est asm-certain (opcodes cités) ; c'est le libellé métier « mag-FX » qui reste LIKELY (contexte famille 0x6A3-5xxx + voisinage catalogue `0x6DA980 MagFx_IndexPackedNodeTree` + unique caller dans la même zone 0x6A16xxx).

- Nom catalogue : inexistant (IDB `sub_6A3A30`, prototype IDA `_WORD *__cdecl(int, _WORD *)` partiellement faux : arg0 est un **pointeur** de record, pas un int — lecture `word ptr [edi+6]` @ 0x6a3a5a — et la valeur de retour `_WORD*` n'est pas démontrée).
- Nom proposé (markdown seul, PAS de rename) : `MagFx_ComposeBoneMat_GteWord3Out`
  - Justification ≥2 preuves ASM adressées : (a) indexation os `0x6a3a5a–0x6a3a6b` (`movsx word ptr [edi+6]`, `idx*3<<4` = stride 0x30, header 0x10) + FK `0x6a3a46` ; (b) pipeline GTE `0x6a3a8c` (`Thunk_460860_480012` = `Gte_MVMVA`) + sortie 3 mots `0x6a3a91–0x6a3a96` (`GteState_GetWord3_1CA8A34(arg1)`).

## In / Out / Effets

- **In arg0** (@ [esp initial+4]) : pointeur vers un record d'entité/effet ; `+6` = `s16` **index d'os** (sign-extend → peut théoriquement être négatif). Le même pointeur est repassé à `setSomeDword5` @ 0x6a3a86-87.
- **In arg1** (@ [esp initial+8], typé `_WORD*`) : tampon de sortie **3 × s16 = 6 octets**, rempli par `GteState_GetWord3_1CA8A34` (copie de l'état GTE BSS `0x1CA8A34`).
- **Out** : écriture de 6 octets dans arg1. **Largeur retour : non démontrée** — l'épilogue `0x6a3a9b–0x6a3aa3` (`add esp,20h / pop edi / pop esi / add esp,20h / retn`) n'écrit jamais `eax` ; le `_WORD*` de l'en-tête IDA est un artefact (eax hérité du dernier call). Traitement : quasi-`void`.
- **Effets de bord** : `BattleSkeleton_BuildHierarchicalFK(0x2510200+0x60)` @ 0x6a3a46 (calcul/mise à jour des matrices monde par os) ; composition matricielle via `Mat_ComposeTwoThenCopy8` (8 dwords → `var_20` local) ; programme GTE armé : `Field_readCa(&var_20)` 0x6a3a77, `Camera_ReadVariables_Space(&var_20)` 0x6a3a81, `setSomeDword5(arg0)` 0x6a3a87, puis `Gte_MVMVA` (thunk immédiat `0x480012`) 0x6a3a8c. Nettoyage cdecl : 8 pushes d'arguments (0x20) soldeés par le `add esp,20h` final @ 0x6a3aa0.
- **Globales** : `dword_2510200` seul global référencé (reads `+0x64` pointeur de record @ 0x6a3a38/3a54, ctx `+0x60` @ 0x6a3a3c, matrice `+0x40` @ 0x6a3a5e). NB : c'est bien `0x2510200`, **pas** `dword_2510258` ni `g_BattleOTBase+0x44` évoqués pour d'autres cellules de la famille.

## Preuves (ASM cité, 3–8)

1. `0x6a3a30/38/3c` : `mov eax, dword_2510200` ; `mov ecx, [eax+64h]` ; `add eax, 60h` — base module battle `0x2510200` : ctx `+0x60` (arg de la FK) et `+0x64` = pointeur vers un record (déréféré `mov esi,[ecx]` @ 0x6a3a40).
2. `0x6a3a42/46` : `push eax` (base+0x60) puis `call BattleSkeleton_BuildHierarchicalFK` — la FK est lancée **avant** toute lecture d'os ; `esi = *[base+0x64] + 0x10` (@ 0x6a3a40/43) est calculé en avance et consommé après l'appel.
3. `0x6a3a5a/61/64/67` : `movsx eax, word ptr [edi+6]` ; `lea eax,[eax+eax*2]` ; `shl eax,4` ; `lea ecx,[eax+esi+10h]` — index `s16` du record arg0+6, ×3×16 = **stride 0x30** (48 octets/os), base table `*[0x2510200+0x64]+0x10`, `+0x10` supplémentaire. Convergence wiki (`c0m-monster-archives.md` §H1) : « skeleton (byte 0 = bone count; bones **stride 0x30 after 0x10 header**) | consumer `BattleSkeleton_BuildHierarchicalFK` (`0x508C90`) ».
4. `0x6a3a5e/6c/6d` : `add edx,40h` ; `push ecx` (entrée os) ; `push edx` (0x2510200+0x40) ; `call Mat_ComposeTwoThenCopy8` — compose la matrice module `+0x40` avec l'entrée os et copie **8 dwords** (32 o) vers `var_20` ; la note callee cite `0x56C090` = `Mat3S16_MulQ12_Copy5` (3×3 s16 × vec × 1/4096) et l'ajout de la translation `[esi+14/18/1C]` — wiki (`battle-address-catalog.md`) : « `0x56C090` — Mat3S16_MulQ12_Copy5 (3×3 s16 × vec × 1/4096; 5 dwords) ».
5. `0x6a3a72–81` : le tampon `var_20` (32 o) est passé à `Field_readCa` puis `Camera_ReadVariables_Space` — chargement de la matrice composée côté caméra/GTE (rôle fin non prouvé, see questions ouvertes).
6. `0x6a3a8c` : `call Thunk_460860_480012` (`push 0x480012; call sub_460860; pop ecx; ret`) — wiki (`battle-address-catalog.md`) : « `0x460840` — Thunk_460860_480012 (canonical of the 830≡840 pair) » et « `0x460860` — Gte_MVMVA » ; lot E3a (`battle-render-pipeline-entrypoints.md`) : « MVMVA-like 0x12 via sub_460860 … 830≡840 ».
7. `0x6a3a91/95/96` : `mov edx, [esp+44h+arg_4]` ; `push edx` ; `call GteState_GetWord3_1CA8A34` — copie de **3 mots** (6 octets, « stride-6 get », wiki E3a : « GteState_* names use BSS addresses, not GTE register names … stride-6 get/set directions ») depuis l'état GTE BSS `0x1CA8A34` vers **arg1** : c'est la sortie réelle de la fonction.
8. `0x6a3a9b–a3` : épilogue sans écriture d'`eax` + solde de pile exact (8 pushes d'args = 0x20 retirés par le `add esp,20h` final) — pas de retour démontré ; conventions cdecl vérifiées droite→gauche (arg1 poussé en dernier à chaque call à 1 argument).

**Caller** (callers.txt) : xref unique `0x6a194c` dans `sub_6A1660` (0x10F9 octets) — même zone mag-FX 0x6A ; insuffisant seul pour CERTAIN (arguments du call non vérifiables en aveugle).

## Checks demandés

- Callees cités présents dans `callees.txt` : **7/7** — `BattleSkeleton_BuildHierarchicalFK` (0x6a3a46), `Mat_ComposeTwoThenCopy8` (0x6a3a6d), `Field_readCa` (0x6a3a77), `Camera_ReadVariables_Space` (0x6a3a81), `setSomeDword5` (0x6a3a87), `Thunk_460860_480012` (0x6a3a8c), `GteState_GetWord3_1CA8A34` (0x6a3a96). ✓
- Strides en nombres : os = **0x30** (×3 puis `shl 4`) ; header/offsets table = **0x10 + 0x10** ; tampon composé = **8 dwords (0x20)** = taille exacte de `var_20`. ✓
- Polarités signées : index os **signé** (`movsx`, s16 @ arg0+6) — aucune branche `ja/jb` vs `jg/jl` dans la fonction (aucune comparaison) ; pas de piège unsigned/signed actif. ✓
- Largeur retour : **aucune démontrée** (eax non écrit dans l'épilogue) ; sortie réelle = 6 octets via arg1. ✓
- Pièges §8 : pas de nom catalogue inventé (EA sans nom) ; le byte `0x40` n'apparaît pas comme masque ici (`add edx,40h` = offset matrice, pas un tag OT) ; stride 0x30 cité en dur (pas de `*232` Hex-Rays) ; le mot « Word3 » du callee est un nom BSS E3a, pas un registre GTE affirmé.

## Questions ouvertes

1. Rôle exact de `dword_2510200` (matrice `+0x40`, ctx `+0x60`, record `+0x64`) — aucun lemme wiki ; à distinguer de `dword_2510258`/`g_BattleOTBase+0x44` cités pour d'autres cellules de la famille.
2. Sémantique fine de `Field_readCa` vs `Camera_ReadVariables_Space` (chargement rotation/translation dans les registers GTE ? lecture de la ligne « Ca » de profondeur ?) et de `setSomeDword5(arg0)` (sélection du vecteur d'entrée du MVMVA ?).
3. Le vecteur transformé par le MVMVA n'est pas visiblement chargé dans cette fonction — il vient soit de `setSomeDword5`, soit d'un état GTE déjà armé par le caller `sub_6A1660` ; à confirmer côté caller.
4. Signification des 3 mots exportés (position caméra ? coordonnées écran ? IR1-3 ?) — la convention E3a interdit de les nommer comme registres GTE sans preuve.
5. arg0 : le record possède-t-il une matrice propre à `+0x14` (la note E3a du callee mentionne `0x56C600(edi+0x14)`, mais `edi` y est le registre du callee, pas notre arg0) ?

## IDBCOMMENT

Lance la FK hierarchique du modele battle (ctx 0x2510200+0x60), puis prend la matrice os dont l'index s16 est a arg0+6 dans la table pointee par [record+0x10] (header 0x10, stride 0x30). Compose cette os avec la matrice 0x2510200+0x40 dans un tampon local de 8 dwords, le charge cote GTE (readCa, camera, MVMVA 0x480012) et copie les 3 mots resultats de l'etat GTE 0x1CA8A34 vers arg1. Aucune valeur de retour demontree : la sortie reelle est le tampon arg1. [semantic-triple 2026-09-21]
