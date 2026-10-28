# 0x493840 — analyse sémantique A indépendante

## Périmètre et provenance

- Mission `ff8-decomp-semantics-20261011-r01`, groupe g07, fonction **0x493840 uniquement**, rôle semantic A, 2+1. Aucun résultat C, B, classificateur ou review consulté.
- Source autoritative : `inputs/ff8-decomp-semantics-20261011-r01/g07/0x493840.json` (ci-dessous **N**), chunk `[0x493840,0x493AE3)`, **675 octets, 190 instructions, 26 blocs CFG**, deux retours. Lecture du paquet original et de toutes les projections `0x493840.readable/asm-001.txt` à `asm-008.txt`, `bytes-001.txt`, `bytes-002.txt`, `metadata.json`, `manifest.json`.
- Le manifest annonce SHA256 original `6df9af35d2257f0c169ad31fd7bbc4eb2db1e9d0d8f1192469ff89d17cb89704` et compaction `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Hashes déclarés, non recalculés ici. Binaire natif 32 bits SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export 2026-10-11T16:38:25.140966+00:00 (N:4–10).
- Contexte commun : `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md` (**CC**), notamment :28–31,48–54,61–63. Les documents cités par CC n'ont pas été redécouverts. Les annotations natives et le nom historique sont des hypothèses, non des preuves.

## Rôle, nom et confiance

**Nom proposé : `BattleStatus_ReconcileSlotThenCommitCharacterStatuses`.**

**Rôle LIKELY :** traiter les conséquences d'un couple de masques de statut proposé pour un slot de combat, réconcilier certains drapeaux et états de ce slot, actualiser des snapshots parallèles, puis inscrire les masques filtrés dans la fiche personnage et appeler un post-traitement. Ce n'est **pas** une simple fonction qui OR/écrit les deux masques entrants dans les champs actifs du slot.

- **CERTAIN (mécanique)** : calculs d'adresse, conditions numériques, largeurs, ordre des écritures/appels locaux, stores finaux dans la fiche et copies vers les tableaux parallèles.
- **LIKELY (métier)** : masques de statut, invalidation de disponibilité/menu, branches d'exclusion du combat ou de décès, d'après la combinaison des accès et du contexte de layout autorisé.
- **UNCERTAIN** : noms exacts de tous les bits et des helpers, rôle du WORD personnage +0x18, sens des retours des helpers, normalisations supplémentaires après le dernier appel.
- **Pas de CONFLICT mécanique constaté** entre les bytes locaux et les instructions lisibles examinées. La formulation historique « apply bits » est trop large si elle signifie remplacement complet des statuts actifs du slot. L'annotation « Doom+Zombie clears Doom and disables timer[10] » n'est pas établie dans ce corps ; elle peut concerner un helper, mais cela reste non prouvé.

Deux preuves indépendantes du nom : les stores systématiques des masques filtrés dans le record personnage (preuve 7), et le traitement conditionnel de changements/invalidations du slot avant ces stores (preuves 3–6). La copie de snapshots (preuve 4) fournit une troisième justification de « reconcile ». Aucun ancien nom ne participe à cette justification.

## Contrat d'entrée et sortie

À l'entrée, trois emplacements stack :

| Entrée | Lecture native | Usage attesté |
|---|---|---|
| slot à ESP original +4 | DWORD → ESI, 0x493849 (`8B 74 24 10` après trois pushes) | indice brut de slot/record ; aucune borne ni validation |
| masque S1 à +8 | BYTE dans les tests ; WORD à 0x493AA7 | conditions sur bits bas, comparaison à snapshot, puis conservation des seuls bits `0x7F` |
| masque S2 à +0xC | DWORD → EBX, 0x493841 (`8B 5C 24 10` après un push) | bits `0x80000000`, `0x14000`, `0x10000`, `0x9`, comparaison de changements et store filtré par `0x030E7FFF` |

Les entrées S1/S2 sont des **bitsets**, non des entiers métier signés. La taille formelle de l'argument S1 n'est pas entièrement déterminée : seuls ses BYTE/WORD bas sont consommés. L'indice slot est un DWORD non signé/non validé au niveau du calcul d'adresse ; il n'y a aucun test signé de borne à interpréter ici.

**Sortie observable :** mutations de mémoire globale et effets des helpers. EBX/EBP/ESI/EDI sont restaurés, RET simple sans dépilage des arguments : convention compatible cdecl, caller-cleanup. Les appels locaux explicitement dépilés le sont par le caller.

**Retour exact :** les deux épilogues suivent le même helper `0x493AF0` et n'écrivent plus EAX ensuite. La valeur EAX à la sortie est donc celle laissée par ce helper, sans masque ni conversion. Aucun retour booléen, aucun retour AX/AL indépendant ni type `void` démontré. Le helper reçoit, dans l'ordre cdecl apparent, **(0 ou 1, pointeur record personnage)** ; son type de retour demeure inconnu.

## Effets et cheminement mécanique complet

1. **Condition S2 bit31.** Si absent, l'entrée saute directement à 0x4938DA. Si présent, le WORD à `0x1CFF018 + 0x1D0*slot` doit être non nul, S1 ne doit pas intersecter `0x35`, S2 ne doit pas intersecter `0x14000`. Si ces conditions passent, le DWORD de drapeaux du slot gagne ou perd `0x400` selon S2 &9. Si elles échouent, le corps efface le bit31 du **statut actif S2 du slot** et efface `0x400` des drapeaux. EBX, le masque entrant, n'est pas corrigé à cet endroit.
2. **Invalidation initiale.** Si S1 &4 ou S2 &9, appel `0x484600(slot)`. Si EAX est nul et S2 bit31 absent, deux RMW distincts effacent successivement `0x8`, puis `0x4` des drapeaux et appellent `0x485030(slot)`. Si EAX est nul et bit31 présent, saut directement à la copie des snapshots ; sinon continuation au contrôle de changements.
3. **Changements par rapport aux snapshots.** Seulement si S2 bit31 absent : comparer le bit `0x20` de S1 au BYTE bas du WORD snapshot `0x1D28E30 + 2*slot`. À défaut de ce changement, comparer `(DWORD[0x1D28E38+4*slot] XOR S2) & 0x02004000`. Si un changement existe : appeler `0x484600(slot)` ; s'il laisse EAX nul et si slot diffère du BYTE zéro-étendu à `0x1D27B0F`, effacer `0x8`, puis `0x4` des drapeaux et appeler `0x485030(slot)`.
4. **Copies systématiques avant les branches terminales.** WORD slot +0x82 → WORD tableau `0x1D28E30+2*slot` ; DWORD slot +0x0C → DWORD tableau `0x1D28E38+4*slot`. Ce sont des copies **des champs copie du slot**, pas des arguments entrants. Le test S2 &0x10000 précède les MOV ; les MOV ne modifient pas ZF, et le JZ qui suit utilise bien ce test.
5. **Branche S2 &0x10000, prioritaire sur S1 &1.** Effacer ce bit du S2 actif du slot, appeler `0x486C70(slot)`, effacer successivement drapeaux `0x8`/`0x4`, appeler `0x485030(slot)` puis `0x484640(slot)`, mettre DWORD ATB slot +0x14 à zéro, mettre DWORD record personnage +0x184 à zéro, appeler `0x48C5C0(slot)`, écrire BYTE record +0x1C3 =0xFF, appeler `0x485FF0()`, `0x4A8460()`, puis `0x497110(slot)`. Dépiler ensuite 0x14 octets, puis rejoindre le commit.
6. **Sinon, branche S1 &1.** Si ce bit est absent, rejoindre le commit. S'il est présent : mêmes deux effacements des drapeaux, `0x485030(slot)`, `0x484640(slot)`, zéro DWORD ATB, zéro DWORD personnage +0x184, puis `0x485EC0(slot)` et cleanup stack 0x0C. Pas les autres appels de la branche précédente.
7. **Commit commun et post-traitement.** Calculer record `0x1CFF000+0x1D0*slot`. Écrire WORD +0x1B2 = S1 &0x7F, puis DWORD +0x188 = S2 &0x030E7FFF. Tester le bit `0x10` du BYTE effectivement relu à +0x1B2 ; appeler `0x493AF0(1,record)` si présent, sinon `0x493AF0(0,record)`. Restaurer les quatre registres sauvegardés et retourner.

Toutes ces écritures suivent l'ordre natif. Les appels peuvent modifier d'autres champs : la fonction ne permet pas de conclure que les stores locaux représentent l'état final après helpers.

## Huit preuves ASM/xref

Les chemins `A1`…`A8` désignent `0x493840.readable/asm-001.txt`…`asm-008.txt` sous le répertoire inputs g07. Bytes autoritatifs : N:15, projections bytes-001/002.

1. **ABI/strides :** 0x493841/849 chargent DWORD S2/slot (A1:2,6) ; 0x493881/887/88C calculent `(slot+4*(3*slot))<<4 = 0xD0*slot` (A1:20–24). 0x49385A–866 et 0x493A8C–A9E calculent `(slot+4*(8*slot-slot))<<4 = 0x1D0*slot` (A1:10–13 ; A7:12–16). Corroboration layout : CC:29–31.
2. **Contrôle bit31 sans remplacement intégral :** `TEST EBX,80000000h` à 0x49384D ; WORD compare à zéro 0x493869 ; tests S1 `35h` / S2 `14000h`, puis `OR CH,4` ou `AND CH,FBh` sur DWORD drapeaux ; voie d'échec `AND EDI,7FFFFFFFh` sur S2 actif (A1:7–19 ; A2:1–19).
3. **Invalidation conditionnelle :** 0x4938DA–8F9 combine S1 &4/S2 &9, appel 0x484600 et **TEST EAX,EAX** ; 0x493910/917 effacent successivement bits 8/4 et 0x49391D appelle 0x485030 (A2:20–25 ; A3:1–20). Pas de test limité à AL.
4. **Différences puis snapshots :** 0x49392D–93C XOR BYTE ancien/nouveau et test20 ; 0x49393E–94D XOR DWORD et test **0x02004000** (constante immédiate, non pointeur malgré `offset unk_2004000`) ; 0x49395C–966 compare slot au BYTE zéro-étendu ; 0x49399D/A4 et 0x4939AC/B2 copient WORD/DWORD du slot vers les tableaux (A3:21–25 ; A4:1–13 ; A5:6–10).
5. **Transition bit16 et effets multiples :** 0x493997 TEST EBX,10000h ; 0x4939C2 AND EAX,FFFEFFFFh puis store actif ; appels 0x4939CD→486C70, 0x4939F0→485030, 0x4939F6→484640 ; stores zéro à 0x4939FB/493A11 et BYTE FF à 0x493A1C ; appels 0x493A17→48C5C0, 0x493A23→485FF0, 0x493A28→4A8460, 0x493A2E→497110 (A5:5–25 ; A6:1–15). Destinations confirmées par E8 relatifs et N:254–264.
6. **Transition S1 bit0, distincte :** 0x493A38 TEST BYTE argument,1 ; 0x493A45/54 effacent drapeaux 8/4 ; 0x493A68/7E stores zéro DWORD ; 0x493A84 appelle 485EC0 (A6:16–25 ; A7:1–11). CC:53–54 donne indépendamment la boucle de deux identifiants BYTE de ce helper, mais pas une preuve de tous ses effets métier.
7. **Commit de statuts dans un autre record :** 0x493A93 `AND EBX,030E7FFFh` ; 0x493AA7 `MOV CX,[ESP+18h]`, 0x493AAC `AND ECX,7Fh`, 0x493AB0 store WORD record+1B2, 0x493AB7 store DWORD record+188 ; test BYTE +1B2,10 à 0x493ABD (A7:12–25). Aucun store général S1/S2 entrant vers les deux champs actifs du slot.
8. **Post-traitement, retour et appelants :** 0x493AAF push record, 0x493AC6 push1 / 0x493AD5 push EBP=0, appels E8→493AF0, cleanup8, pops et RET (A7:20–25 ; A8:1–15). Xrefs entrants code type17 : 47DB6C,47DC59,483613,493D01,493FF3,4940B5 (N:216–252), dont 493D01 sans fonction propriétaire. Ces xrefs attestent les sites, pas les valeurs d'arguments ni leur métier.

## Largeurs, signedness et aliasing

- Les calculs LEA/SUB/SHL utilisent DWORD et wrap modulo 2^32. Aucun clamp, aucune conversion d'indice BYTE ou borne du nombre de slots. Les deux strides **208 et 464** ne sont pas interchangeables. Les tableaux snapshots utilisent encore des strides **2 et 4**.
- Les conditions sont TEST/JZ/JNZ et égalités ; aucune comparaison d'ordre signée/non signée. Bit31 est testé comme masque, pas comme `<0`.
- Les drapeaux sont manipulés en **DWORD au slot +0x7C** : ils couvrent aussi le WORD voisin +0x7E. `CH` agit sur bits 8–15 de ce DWORD (`0x400`), `AL` sur bits 0–7 (`~4`), sans effacer les autres bits. Les deux RMW successifs ~8 puis ~4 ne doivent pas devenir un store zéro.
- `MOV AL`/`MOV DL` à 0x49392D/934 ne définissent que les BYTE bas ; leur XOR/TEST utilise seulement AL. `MOV AX` à 0x49399D définit seulement AX et le store suivant est WORD. `MOV CX` à 0x493AA7 ne définit d'abord que CX, mais l'AND **ECX**,7F efface ensuite tout bit supérieur : store final exactement S1 bas &7F.
- Les tests post-0x484600 portent sur **EAX complet**, non AL/AX. Le retour final n'est pas réduit : voir contrat. Aucune instruction x87/SSE locale ; état FP/effets des callees non gelés ici.

## Interprétation métier et limites ouvertes

L'interprétation combat/personnage s'appuie sur les layouts cités dans CC et sur les deux familles d'adresses, pas sur le label de la cible. Les noms Death, Petrify, Berserk, Sleep/Stop, GFSummoned, Eject, Confuse/Angel Wing et les helpers de UI/cleanup sont **interprétations historiques plausibles**, moins fortes que les bits et stores attestés. En particulier, le WORD personnage +0x18 n'est pas identifié comme HP ordinaire : CC mentionne HP +0x172, champ distinct.

Compléments à demander au lead si une précision métier supplémentaire est nécessaire :

1. Gel des helpers 484600/484640/485030/486C70/48C5C0/493AF0/4A8460/497110 pour établir leurs contrats, retours et effets réels. Le sens « canal occupé » du nonzéro de 484600 est un commentaire, pas démontré par son corps absent.
2. ABI/type/évidence du WORD F_CHAR+0x18, des drapeaux 0x400/4/8 et des masques filtrés de la fiche personnage.
3. Instructions d'appel et consommation du retour pour trancher le type formel de S1 et le retour propagé EAX. Les xrefs seuls ne suffisent pas.
4. Positionnement de cet appel dans la mise à jour des champs statut actifs et copie : la présente fonction ne prouve pas qui les a écrits auparavant. Ne pas affirmer une « application de tous les bits ».

Aucune compilation, exécution, validation différentielle, promotion IDB ou §5.6 réalisée. Livrable sémantique uniquement ; couverture locale complète, incertitudes des callees conservées.
