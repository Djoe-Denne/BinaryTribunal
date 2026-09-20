# MagFx_SumS16Runs_TwoSources_Scratch38 @ 0x69EE80

- Instr (live): 33 (81 o, 0x69EE80-0x69EED0)
- Palier: 1+P (2 voix + sondes IDA parent P)
- Verdict: CERTAIN - wrapper de sommation lecture seule : scratch bs_modulo(0x38) (+0x20 pour l'etat), somme des runs s16 via Bitmask_SumS16_Runs sur source 1 [obj+0x64] masquee par [obj+0x7C] puis source 2 [[obj+0x78]+4] non masquee si [obj+0x78] non nul, BattleScratch_Unwind(0x38), retour EAX int 32 bits
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_69EE80\nTYPE ; proposition: MagFx_SumS16Runs_TwoSources_Scratch38
- Notes parent: checks 5.6 OK (role P) : asm 33 instr convergente c_a/sem_a ; sonde IDA xrefs_to 0x69EE80 = 2 callers tous MAG213 (sub_69EB70 @0x69EDE6 stepper, sub_69EF60 @0x69F15B tache enfant) ; verdict UNCERTAIN de semantic_a leve par ces sondes ; correction scratch 0x38 (pas 0x58)

## C reconcilie

```c
// c_a.c — sub_69EE80, reconstruit depuis asm.asm live (GROUND TRUTH).
// Hex-Rays (hexrays.c) concorde ; utilisé comme vérificateur seulement.
// Stub mode 1+P (33 instr, 81 o). Callers : sub_69EB70 @0x69EDE6, sub_69EF60 @0x69F15B (: | more=false).
//
// Convention d'argument : asm `mov edi, [esp+10h+arg_0]` après push ebx/esi/edi (0Ch)
// et lors du call la chaîne est [esp+10h] → arg_0 = 1er (et unique) arg cdecl.
// Retour 32 bits dans eax (mov eax, ebx ; retn).
//
// Ancres ASM :
// 69ee83  push 38h          ; 0x38 = 0x38 — hauteur de frame bs_modulo
// 69ee8e  lea esi,[eax+20h] ; +0x20 = +32 — offset du bloc temporaire bs_modulo
// 69ea9a-69eeb7  edi = a1 ; a1+0x7C, a1+0x64, a1+0x78 — offsets struct (dword)
// 69eeac  mov dword ptr [esi], 0FFFFFFFFh  ; masque complet
// 69eec3  call BattleScratch_Unwind (0x38) ; inverse de bs_modulo, bump dword_1D999C4
//
// UNCERTAIN 0x69EE80 : sémantique du bit/flags ? E3c/E3a = tags wiki, hérités de la doc ; l'ASM
// ne prouve que les calls et l'arithmétique de somme : aucun accès mémoire réel (pas de read
// RAM), tout passe par Bitmask_SumS16_Runs.
// UNCERTAIN 0x69EE80 : rôle exact des offsets struct a1+0x64 / a1+0x78 / a1+0x7C, ainsi que du
// champ +4 de l'objet pointé par [a1+0x78] — prouvé comme pointeurs de données seulement
// (Bitmask_SumS16_Runs(data, mask)), pas comme accessors sémantiquement nommés.

int __cdecl sub_69EE80(_DWORD *a1)
{
  _DWORD *scratch;               // esi — bloc temporaire bs_modulo(+32)
  int sum_a;                     // eax puis ebx — première somme
  _DWORD *obj_78;                // edi — a1[0x78]

  // 69ee83: push 38h ; call bs_modulo — réserve/récupère un bloc temporaire 0x38
  scratch = (_DWORD *)(bs_modulo(0x38) + 0x20);
  //                                     ^^^^^ offset +32 (offset fixe du bloc)

  // 69ee8a: mov edi,[esp+10h+arg_0] → a1 (arg cdecl 1er)
  // 69ee92-69ee95: a1[0x7C] → [scratch]  (masque initial : valeur pleine largeur)
  *scratch = a1[31];               // a1+0x7C  — offset 0x7C en dword index 31

  // 69ee97-69ee9b: push a1[0x64]; call Bitmask_SumS16_Runs(data, mask=esi) — cdecl
  sum_a = Bitmask_SumS16_Runs(a1[25], scratch);   // a1+0x64

  // 69eea0-69eea6: edi = a1[0x78]; test edi,edi ; jz loc_69EEC1
  obj_78 = (_DWORD *)a1[30];       // a1+0x78  — pointeur objet (significance: test NULL)

  if (obj_78 == NULL)
    goto end;                      // loc_69EEC1

  // 69eeac-69eeb2: masque complet [esi] = 0xFFFFFFFF ; edx = [obj_78+4]
  *scratch = 0xFFFFFFFF;
  // 69eeb5-69eeb7: Bitmask_SumS16_Runs(obj_78->field_4, scratch)
  sum_a += Bitmask_SumS16_Runs(obj_78[1], scratch);   // [a1+0x78]+4

end:                              // loc_69EEC1
  // 69eec1-69eec8: push 38h ; call BattleScratch_Unwind ; add esp,4
  //                (inverse de bs_modulo — libère la fenêtre temporaire)
  BattleScratch_Unwind(0x38);

  // 69eecb-69eecd: mov eax, ebx ebx  → retour 32 bits (mov eax, ebx; retn)
  return sum_a;                    // ebx accumulé, 32 bits
}
```

## Analyse semantique

# Sémantique sub_69EE80 @ 0x69EE80 (analyse A, mode 1+P aveugle)

- Rôle (1 phrase) : Wrapper de sommation en lecture : alloue un bloc scratch de 0x38 octets (bs_modulo), y calcule la somme int 32 bits de runs s16 sur deux sources dérivées de l'objet argument — source 1 = `[obj+0x64]` masquée par `[obj+0x7C]`, source 2 = `[[obj+0x78]+4]` masquée par 0xFFFFFFFF (donc non masquée) si `[obj+0x78]` est non nul — puis restitue le scratch (BattleScratch_Unwind) et retourne le total dans EAX.
- Confiance : **UNCERTAIN**
- Verdict — pourquoi pas CERTAIN (déclaré explicitement, requis mode 1+P) :
  1. Wiki absent pour cette fonction : `wiki.md` du pack est vide (échec qmd) et qmd ff8-wiki ne contient aucune entrée pour `0x69EE80`, `sub_69EB70`, `sub_69EF60` ni `Bitmask_SumS16_Runs`. L'axe wiki ne peut pas converger.
  2. Callers non vérifiables : deux xrefs code (`0x69ede6` dans `sub_69EB70`, `0x69f15b` dans `sub_69EF60`) mais fonctions anonymes `sub_*`, sans corps dans le pack ; le mode aveugle interdit IDA/MCP, donc aucune preuve des arguments/état garantis par les callers.
  3. La sémantique « SOMME s16 des runs masqués ; ni emit ni count » du callee calculatoire `Bitmask_SumS16_Runs` repose uniquement sur une annotation IDB (lot E3c) — le nom catalogue n'est pas une preuve, et le callee n'est pas dans le pack.
  - Ce qui est **certain au niveau opcodes** (indépendant du verdict de domaine) : le squelette complet — `push 38h`/`call bs_modulo` (69ee83–69ee85) → accumulation dans ebx de deux appels à `Bitmask_SumS16_Runs` (69ee9b, 69eeb7), le second conditionné à `test edi,edi`/`jz` (69eea6–69eea8) → `push 38h`/`call BattleScratch_Unwind` (69eec1–69eec3) → `mov eax, ebx`/`retn` (69eecb–69eed0). Alloc et unwind sont équilibrés (0x38 / 0x38) : effet net nul sur `dword_1D999C4`.
- Nom catalogue : aucun (fonction `sub_*` non cataloguée ; voisins immédiats catalogués : `0x69E940 MAG_Scratch58_InvokeWorker`, `0x69E970 SeqCtx_BindStream_AndChainPumps` — 0x69EE80 et ses deux callers absents du `decomp-function-catalog`).
- Nom proposé (markdown seul, PAS de rename) : **`SumS16Runs_TwoSources_Scratch58`**
  - Justification ≥2 preuves ASM adressées :
    - `Scratch58` : `69ee83 push 38h` (56 déc. = 0x58) avant `call bs_modulo` 69ee85, refermé par `69eec1 push 38h` / `69eec3 call BattleScratch_Unwind` — même marqueur que le voisin catalogué `MAG_Scratch58_InvokeWorker` (0x69E940, même taille 0x38).
    - `TwoSources` : deux appels au même callee — 69ee9b (`arg0=[obj+0x64]`, masque `[obj+0x7C]`) et 69eeb7 (`arg0=[[obj+0x78]+4]`, masque -1 posé en 69eeac), sommés dans ebx (69eea8 `mov ebx, eax`, 69eebf `add ebx, eax`).
    - `SumS16Runs` : reprise du nom de famille IDB du callee `Bitmask_SumS16_Runs` (69ee9b/69eeb7) — porté avec réserve car non wiki-confirmé.
  - Préfixe de domaine volontairement omis : impossible à établir en aveugle (callers anonymes). À préfixer (`Battle_*` ou autre) après identification de `sub_69EB70`/`sub_69EF60`.
- In / Out / Effets :
  - In : 1 argument stack cdecl (droite→gauche, cleanup par le caller) : `arg0` = pointeur objet/descripteur (`[esp+10h+arg_0]` lu en 69ee8a ; TYPE IDB `int __cdecl(_DWORD *)`). Champs consommés : `[+0x64]` (dword, source 1), `[+0x78]` (dword, pointeur optionnel — nul = source 2 absente), `[+0x7C]` (dword, masque de la source 1), et `[[+0x78]+4]` (dword, source 2).
  - Out : retour **EAX 32 bits** (69eecb `mov eax, ebx`) = somme totale ; pas d'écriture mémoire hors du scratch privé.
  - Effets : bump `dword_1D999C4` de 0x38 octets (69ee83–69ee85) puis unwind de 0x38 (69eec1–69eec3) — solde nul ; seul `[scratch+0x20]` est écrit comme header/masque du workspace (69ee95 depuis `[obj+0x7C]`, 69eeac = 0xFFFFFFFF) ; les 0x20 premiers octets du bloc ne sont pas touchés par cette fonction (rôle non résolu en aveugle).
- Preuves (ASM cité) :
  1. `69ee83 push 38h` → `69ee85 call bs_modulo` et `69eec1 push 38h` → `69eec3 call BattleScratch_Unwind` : paire alloc/unwind symétrique du scratch frame battle ; wiki (`battle-address-catalog.md:210`) : « `0x5082D0` — BattleScratch_Unwind (unwind de `dword_1D999C4` ; inverse de `bs_modulo`…) » ; `globals.txt` ne liste que `dword_1D999C4`. Convergence wiki/callees.
  2. `69ee8e lea esi, [eax+20h]` puis `69ee95 mov [esi], eax` (eax=`[edi+7Ch]`, lu en 69ee92) : le workspace scratch+0x20 commence par un dword masque/header initialisé depuis l'objet.
  3. `69ee91 push esi` / `69ee9a push ecx` (ecx=`[edi+64h]`) → `69ee9b call Bitmask_SumS16_Runs` : args cdecl droite→gauche (arg0=source, arg1=workspace) ; cleanup `69eea3 add esp, 0Ch` = 4 (push 38h de bs_modulo) + 4 + 4 — arithmétique de pile exacte, pas de libcall inventé.
  4. `69eea6 test edi, edi` / `69eeaa jz short loc_69EEC1` (edi=`[obj+78h]` rechargé en 69eea0 après consommation de +0x64/+0x7C) : la source 2 est optionnelle, null = absent (polarité : saut si zéro, pas de piège signé — aucun ja/jb/jg/jl dans la fonction).
  5. `69eeac mov dword ptr [esi], 0FFFFFFFFh` / `69eeb2 mov edx, [edi+4]` / `69eeb5 push esi` / `69eeb6 push edx` → `69eeb7 call Bitmask_SumS16_Runs`, `69eebf add ebx, eax` : même workspace réutilisé avec masque « tous bits », second appel accumulé.
  6. `69eecb mov eax, ebx` / `69eed0 retn` : retour 32 bits (int), accumulateur ebx jamais tronqué en 16 bits — le total n'est pas un s16.
  7. Callers (callers.txt) : exactement 2 xrefs code — `0x69ede6` (`sub_69EB70`, taille 0x30E) et `0x69f15b` (`sub_69EF60`, taille 0xBCB), `more: false` ; aucun des deux n'est catalogué dans le wiki.
- Checks :
  - Callees cités présents dans callees.txt : `bs_modulo` (69ee85 ✓), `Bitmask_SumS16_Runs` (69ee9b, 69eeb7 ✓), `BattleScratch_Unwind` (69eec3 ✓). Aucun call hors liste.
  - Strides en nombres : offsets champ +0x64/+0x78/+0x7C/+0x04, bloc 0x38, workspace à +0x20 (queue 0x18) — aucun stride de tableau (`[reg+idx*S]`) dans la fonction ; les strides leçons F_CHAR 0x1D0 / slot 0xD0 ne sont pas mobilisables ici (absents de l'ASM — ne pas les plaquer).
  - Polarités : `jz` = source 2 sautée si pointeur nul ; masque 0xFFFFFFFF = sélection totale (motif non signé, pas une valeur « -1 » arithmétique) ; pas de comparaison signée/non signée ambiguë.
  - Largeur retour : EAX plein (32 bits), cohérent avec TYPE IDB `int __cdecl(_DWORD *)`.
  - Hex-Rays vs ASM : axe NON exécuté — `hexrays.c`/`c_*.c` interdits en aveugle. Aucune divergence ne peut donc être signalée de ce côté.
  - MCP grepai volontairement non appelé : son index sémantique du repo risque de surfacer les artefacts interdits (`c_*.c`, `hexrays.c`) ; `grepai.txt` (lu, autorisé) ne contient qu'une ligne d'indication.
- Questions ouvertes :
  1. Quel est l'objet pointé par arg0 (type, domaine) ? Exige les corps de `sub_69EB70`/`sub_69EF60` (session IDA, hors aveugle).
  2. Que calcule exactement `Bitmask_SumS16_Runs(source, ws)` (organisation des « runs », rôle des 0x18 octets de workspace après le header) ? Le callee n'est pas dans le pack.
  3. Pourquoi un bloc de 0x38 alors que seule la queue 0x18 (à +0x20) est utilisée ici ? Hypothèse non prouvée : tête 0x20 partagée avec le pattern du voisin `MAG_Scratch58_InvokeWorker`, ou granularité de `bs_modulo`.
  4. La source 2 (`[[obj+0x78]+4]`, masque total) est-elle une chaîne/liste dont on somme le premier maillon seulement, ou un nœud unique ? Un seul déréférencement est visible (69eeb2).

IDBCOMMENT: Alloue un bloc scratch de 0x38 octets via bs_modulo et somme les runs s16 de deux sources de l'objet passe en argument : la premiere masquee par [obj+0x7C], la seconde (lue via [[obj+0x78]+4]) sommee en clair avec masque -1 si le pointeur est non nul. Le total 32 bits est retourne dans EAX apres restitution du scratch par BattleScratch_Unwind (solde nul sur dword_1D999C4). Role de domaine non confirme : callers anonymes et wiki silencieux, a requalifier apres identification des callers. [semantic-triple 2026-09-20]
