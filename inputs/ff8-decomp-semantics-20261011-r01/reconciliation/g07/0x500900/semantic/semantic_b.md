# 0x500900 — sémantique B indépendante

## Périmètre et provenance

- Rôle : semantic B uniquement, mission run01, tâche `task_mv44rlvz_007o_dq7urv`. Aucune lecture d'auteur, review, classifier ou C cible.
- Sources effectivement lues : `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md` (63 lignes), et dans `0x500900.readable/` : `manifest.json`, `metadata.json`, **asm-001.txt à asm-009.txt**, **bytes-001.txt et bytes-002.txt**, en entier. Ci-dessous, A1…A9 désignent ces neuf fichiers ASM, B1/B2 les bytes, M les métadonnées, CC la compaction.
- Gel natif : FF8_EN.exe 32 bits, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export 2026-10-11T16:38:25.140966+00:00 (M:4–9). SHA256 du packet d'origine déclaré par le manifest : `0c68458ed2dd63fc4969914f650dfd11176145e5b11dda0e4ce2d917cff21590`; compaction : `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Hashes lus, non recalculés ici.
- Couverture : 206 instructions, les deux chunks `[0x500900,0x5009A1)` et `[0x5005A0,0x50081F)`, les 20 blocs de M:11–160, branches conditionnelles et sortie commune comprises. Le saut 0x50099C appartient à cette fonction : sa queue n'est pas une autre fonction.
- Les noms/types/commentaires dans l'ASM sont des annotations historiques, pas des preuves. Les références documentaires ci-dessous sont celles de CC, sans consultation supplémentaire.

## Conclusion et nom proposé

**Nom proposé : `BattlePresentation_RunTasksAndPrepareBuffers`. Confiance : LIKELY.**

Rôle mécanique **CERTAIN** : orchestrateur sans argument explicite consommé, qui appelle successivement un même helper sur plusieurs têtes globales, enregistre deux résultats bas-octet et termine un contexte conditionnel sur résultat EAX nul; enchaîne des helpers; exécute des opérations conditionnées par trois bits d'un octet global; puis installe des adresses de travail de paquets et d'ordering table indexées.

Interprétation métier **LIKELY** : étape de présentation de bataille, coordonnant progression des tâches, soumission/préparation graphique, traitement de file de textures et paramètres caméra, puis préparation des buffers. Deux familles de preuves indépendantes motivent le nom : six dispatchs à 0x508420 avec état de tâche, et calculs/écritures distincts des buffers de paquets/OT dans la queue. CC:38–42 apporte le contexte de scheduling/render et les callers de bataille. L'ASM seul ne prouve pas la finalité exacte des callbacks.

**UNCERTAIN** : « input », « GF » ou « upload » comme résumé exclusif. Aucun contrôle d'entrée utilisateur n'est identifiable indépendamment dans le corps; l'adresse du contexte conditionnel ne prouve pas GF. Le passage graphique inclut plusieurs opérations différentes : ne pas assimiler chaque call à un upload. Aucun nouveau fait live ni verdict de prise de contrôle n'est déduit du commentaire d'entrée.

## Contrat, entrées et sortie

- Aucun argument de la fonction lu sur la pile; aucune donnée `this` consommée avant le premier call. ABI observée compatible avec cdecl sans argument explicite : pushes aux callees puis ADD ESP, sortie RET simple, pas de sauvegarde/modification explicite d'EBX/ESI/EDI/EBP. Les effets des callees demeurent opaques hors contexte gelé.
- Entrées principales : têtes DWORD `0x1D96AA4`, `0x1D96A8C`, `0x1D96AA0`, optionnelle `0x1D96AAC`, `0x1D96AA8`, `0x1D96A94`; octet de flags `0x1D96A9C`; DWORD index `0x1D96A80` dont seul l'octet bas est conservé; DWORD `0xB8A3E4`, base OT `0x1D8E04C`; byte `0x1D8E03A`; trois WORD `0x1D8E038/03C/03E`; DWORD gate `0x1CFF834`; pointeurs DWORD `0xB6D094/070`.
- Résultats locaux : stockage **AL seulement** de 0x508420 à `0x1D96A90` puis `0x1D96A88`; pour `0x1D96AAC`, test du **DWORD EAX entier**, et remise à zéro uniquement lorsque ce résultat entier est nul. Ne pas convertir ces trois usages en un même booléen.
- **Retour machine CERTAIN : EAX = `0x1D8E058 + 0x8910 * (index & 0xFF)`**, calculé après le dernier call, écrit aussi à `0x1D8E04C`, puis RET. Aucun retour AL/AX séparé. Le rôle contractuel de cette valeur pour les callers reste **UNCERTAIN** : le gel ne montre pas leur consommation de retour; ne pas déclarer un booléen ni affirmer un retour void de langage source.

## Effets et ordre observé

1. Appels à 0x508420 sur les trois premières têtes, stockage du troisième AL; tête optionnelle testée/dispatchée/éventuellement annulée; cinquième tête et stockage AL; helpers 0x502020 et 0x4BB090; sixième tête; autres helpers dont 0x506C30, 0x504060, 0x506E30, 0x5033E0, puis de nouveau 0x502020. Des calls à 0x48D0D0 sont intercalés; leur annotation « nullsub » ne permet pas de les supprimer par raisonnement local.
2. Si flags byte &4 : passage à 0x4A9160 avec base OT+8 et adresse `0x1D969C8 + 0x5C*(i XOR 1)`. **Rerelecture** du flag après ce call; si &4 toujours présent, call 0x4A9220 avec les environnements indexés et `0x1D96980 + 0x14*(i XOR 1)`. Le byte `0x1D8E03A` non nul est réduit de 0x10 s'il est **unsigned >0x10**; sinon call 0x45C310 avec `byte &1`, puis byte remis à zéro.
3. Calls inconditionnels 0x501B60 puis 0x501230; test actuel flags &8, et si vrai calls 0x505D20, 0x45C9F0 avec arguments `(0x1D8E040, 1)`, puis 0x45C320 avec `(0x1D8E040)`. Le contexte CC/TIM interprète le premier comme flush de textures; le gate est dans cette fonction, non une garantie interne du callee.
4. Nouveau test flags &4 : call 0x45B660 sur environnement opposé; call 0x45D610 sur `0x1D924DC+0x8910*i`; deux passages successifs 0x56CD00 puis 0x56CCE0 sur les WORD signés, chacun **rerelevant** les globals après les calls. Les WORD 03E puis 03C sont ensuite remis à zéro. Ne pas fusionner les passages ni mettre leurs lectures en cache.
5. Si DWORD `0x1CFF834` nul, call 0x45D550 avec 13 DWORD arguments, dans l'ordre logique cdecl : `(OT_i, 0x1122, 0, 1, 5, 9, 0x11, 0x1011, 0x1019, 0x101A, 0x101E, 0x111E, 0xFFFFFFFF)`. Sa finalité précise est inconnue ici. Ce gate **ne suspend pas toute la fonction**.
6. Dans tous les cas, flags &0x80 choisit base `*[0xB6D094]` et span 0x24000, sinon base `*[0xB6D070]` et span 0x1C000. Écriture DWORD cursor `0x1D8E054 = base+span*i`, puis end `0x1D969A8 = cursor+span`, puis base OT `0x1D8E04C = 0x1D8E058+0x8910*i` et retour. Aucun basculement de l'index global n'est effectué par ces instructions.

## Huit preuves ASM/xref

1. **Dispatch et résultats distincts** : 0x500905–0x500956, A1:2–25/B1:1–3 : six sites de call au même 0x508420 (sixième A2:4–7), stores A2/AL, test EAX entier à 0x500942 et store conditionnel 0x500946. CC:40 mentionne le callback `[node+8]` dans le voisin; ensemble de callbacks non fourni.
2. **Continuité des chunks et ordre** : 0x50095B–0x50099C, A2:1–15, B1:3–7 : le E9 `FFFBFFFF` rejoint exactement 0x5005A0. Les opérations de la queue sont donc des effets de 0x500900, pas des effets optionnels d'un callee indépendant.
3. **Environnements indexés** : 0x5005A0–0x50062D, A2:16–25/A3/A4:1–5, B1:7–11 : tests byte &4, deux calls et arithmétique `23*i*4 = 0x5C*i`; autre famille `5*i*4 = 0x14*i`. XOR1 vise un index d'environnement opposé, sans écrire l'index global.
4. **Gate texture séparé** : 0x50065E–0x50068C, A4:20–25/A5:1–5, B1:13–14 : 0x501B60 et 0x501230 précèdent le test &8; 0x505D20 n'est appelé qu'après ce test. CC:40/TIM:79–89 contextualise le flush sans attribuer ce gate au callee.
5. **Coordonnées signées et consommation** : 0x5006E4–0x500744, A6/B1:17–20 : six MOVSX WORD, offset +0xA0 pour 03C, +0x6C pour 03E, appels doublés 0x56CD00/0x56CCE0, deux stores WORD zéro. Argument logique à 0x56CCE0 : `(signed03C+0xA0, signed03E+0x6C)`.
6. **Gate partiel de pause** : 0x50074D–0x5007A6, A7/A8:1–2, B2:1–3 : test **DWORD**, saute uniquement le call 0x45D550; le bloc 0x5007A9 est rejoint dans les deux cas. ADD ESP 0x34 confirme 13 mots d'arguments.
7. **Préparation de paquets et retour OT** : 0x5007A9–0x50081E, A8:3–25/A9/B2:3–6 : bases alternatives et spans, stores DWORD à 0x1D8E054/0x1D969A8/0x1D8E04C, puis RET avec EAX calculé. Cette famille est indépendante des dispatchs et justifie « PrepareBuffers ».
8. **Contexte de bataille sans inventer un cinquième call** : M:161–191 : quatre refs type17 de 0x47CCB0 (47D63D/47D6C5/47D707/47D811); ref type19 à 47D905 dans 47D900. CC:42/P:89–107 distingue cette dernière comme saut/orphelin, pas une cinquième invocation directe du directeur.

## Signedness, arithmétique et limites

- Index chargé DWORD puis AND 0xFF : domaine **unsigned 0..255**, pas un int8 signé. Aucun guard `i<=1` dans le gel; « ping-pong » suggère deux valeurs mais ne prouve pas l'invariant. Les calculs d'adresse ont la sémantique x86 DWORD modulo 2^32; les appels pouvant changer les globals imposent les rerelectures natives.
- Le compteur byte à 0x50063E utilise JBE **unsigned**, et ADD AL 0xF0 conserve les bits hauts d'EAX. À 0x50064B, AND EAX,1 supprime effectivement tous les autres bits avant l'argument; rien n'autorise un test signed du byte.
- MOVSX des WORD caméra : int16 vers int32; pas uint16. Les stores d'annulation sont WORD, non DWORD. Flags 1D96A9C lus BYTE même si l'annotation les nomme DWORD; pause 1CFF834 lue DWORD malgré des commentaires voisins de pause byte.
- Aucun opcode x87/SSE dans le corps. Effets/environnement flottant des callees caméra inconnus, pas de garantie de préservation ajoutée.
- Pas de preuve locale de validité des pointeurs, de capacité allouée, d'absence d'alias, d'absence de mutation via callbacks, ni d'idempotence. Les effets indirects peuvent excéder les stores explicités.

## Questions ouvertes / divergences

1. Quel est le contrat complet de 0x508420 (notamment signification de l'octet et du DWORD de retour), et quels callbacks ces six têtes contiennent-elles ?
2. Les callers utilisent-ils EAX final comme adresse OT, ou est-ce une valeur résiduelle non contractualisée ?
3. Quels invariants établissent l'index 0/1 et les allocations des deux familles de paquets/OT/environnements ? Aucun bounds check ne peut être inventé.
4. Quel est le rôle exact de 0x45D550, 0x502020, 0x4BB090, 0x501230/501B60 et du contexte 1D96AAC ? « audio », « input » et « GF » restent des hypothèses quand seules les étiquettes les suggèrent.
5. Les callbacks/helper calls modifient-ils flags/index/coordonnées entre les lectures ? L'ordre observé est préservé, aucun état same-frame ajouté.

Pas de conflit établi entre bytes et instructions pertinentes. Divergence de niveau de preuve : l'étiquette globale mélange GF/input/upload, le commentaire LIVE affirme des invariants de latches/ATB; ces conclusions historiques ne sont pas vérifiées par ce gel. Le nom proposé est volontairement plus étroit et non fondé sur ces étiquettes. Aucune compilation, exécution, differential, promotion ou §5.6 réalisée.
