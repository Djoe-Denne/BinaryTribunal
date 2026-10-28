# 0x464850 — analyse sémantique A indépendante

## Périmètre et provenance

- Mission `ff8-decomp-semantics-20261011-r01`, rôle semantic A, seule cible `0x464850`, tâche `task_mv44rkv7_007a_mu149q`.
- Entrées exclusivement projetées : `inputs/ff8-decomp-semantics-20261011-r01/g06/common-compaction.md`, `0x464850.readable/manifest.json`, les cinq `asm-00N.txt`, `bytes-001.txt` et `metadata.json`. Les chemins courts ci-dessous sont relatifs à ce répertoire g06.
- Manifest : packet natif SHA-256 déclaré `72f5e85aeda3168bd1cd97ff40d4407399a0fbbdd3d5589f58031f5fc9e7b087`, compaction déclarée `ded4edb4b1c6b48f28524bd123684cad1cf7bbc1743739420aa39f22a47309dc`. Hashes lus, non recalculés.
- Couverture : 119/119 instructions ASM, toutes les tranches bytes, chunk `[0x464850,0x464997)`, 20/20 blocs du CFG. Aucun output d'auteur, review, score de classification ou verdict futur consulté. Les commentaires/labels ne servent pas de preuves.
- Analyse statique uniquement ; aucune compilation, exécution ou comparaison différentielle effectuée. Pas de reconstruction C ni promotion §5.6.

## Conclusion et confiance

**Nom proposé : `Gfx_InvalidateTexturePageCachesForRect`. Confiance : LIKELY.**

**Faits mécaniques CERTAIN :** prend quatre valeurs 32 bits, les transmet sans conversion à un helper avec une base globale ; calcule deux intervalles de cellules par divisions signées tronquées `/64` et `/256` ; marque `0xFFFFFFFF` dans trois banques de records ; peut effacer 256 dwords dans une table secondaire ; effectue ensuite un marquage supplémentaire avec le premier indice arrondi au pair inférieur. Ne copie aucun pixel et ne fait aucun appel GPU explicite dans le corps visible.

**Interprétation métier LIKELY :** notifie une modification rectangulaire du miroir VRAM aux caches de pages de texture. Deux preuves indépendantes du nom : (1) les écritures de sentinelles répétées dans les records à stride `0x44C` et l'effacement conditionnel d'une table annexe ; (2) les callers validés, rapportés dans le gel, notifient les bornes inclusives après copie de mots 16 bits dans le même buffer CPU. Le nom historique n'ajoute aucune preuve. Le marquage est prouvé ; la signification « invalidation » vient de ce croisement, pas de la seule valeur `-1`.

**UNCERTAIN :** rôle exact du helper, types métier des champs et du gate, raison du marquage pair dans la deuxième banque. **CONFLICT de source local résolu par le natif :** la compaction donne une mauvaise adresse pour le second gate ; voir ci-dessous. Cela ne rend pas ambiguë l'instruction effective.

## Contrat d'entrée / ABI / sortie

- Quatre arguments stack 32 bits, notés `a0,a1,a2,a3` dans l'ordre d'appel. Chargements `0x464851/56/5B/60` dans EBX/EBP/ESI/EDI. Les valeurs sont traitées comme signées pour la quantification et les tests d'intervalles.
- cdecl compatible : sauvegarde/restauration EBX, EBP, ESI, EDI, `retn` sans nettoyage d'arguments. Le gel rapporte un nettoyage caller de `0x10` après les appels validés. Les slots d'arguments sont réutilisés comme temporaires par cette fonction.
- Interprétation d'entrée rapportée par les callers gelés : `(x_start,y_start,x_end,y_end)`, bornes inclusives ; pas `(x,y,width,height)`. Toutefois les appellations X/Y du document de rendu sont contradictoires : le contrat numérique prouvé est **a0/a2 divisés par 64**, **a1/a3 divisés par 256**, indépendamment de ces noms.
- Appel initial : pushes `0x1CB6040`, a3, a2, a1, a0, puis `call 0x467550`, puis `add esp,0x14`. L'ordre effectif reçu est `(a0,a1,a2,a3,0x1CB6040)`. Son retour EAX est écrasé ; ses effets ne sont pas reconstructibles à partir du corps fourni. Cet appel a lieu même lorsque les intervalles quantifiés seront inversés.
- Pas de pointeur source ni output-param explicite. Les sorties principales sont des mutations globales. Il n'y a ni clamp, ni validation de capacité, ni garantie de zone mémoire valide pour des coordonnées arbitraires.
- **Retour API probablement void**, car le contexte gelé rapporte que les callers ignorent son résultat. Le corps ne normalise aucun résultat succès/échec et ne garantit ni booléen AL ni résultat AX. EAX est néanmoins une valeur machine définie, dépendante du chemin :
  - si `q1 > q3`, il reste `a3 + (a3 < 0 ? 255 : 0)` modulo `2^32`, avant le SAR appliqué à EDI ;
  - si `q1 <= q3` et `q0 > q2`, il vaut `q0` au retour ;
  - si les deux intervalles sont parcourus, il vaut `275 * ((q2 & 0xFFFFFFFE) + (q3 << 4))` modulo `2^32`, résultat du dernier calcul d'adresse, pas la sentinelle écrite.
  AL/AX sont seulement les sous-registres de ce résidu EAX. Aucun prototype public non-void ne peut être conclu des xrefs seuls.

## Effets mécaniques exacts et ordre

Noter `q0=trunc_s32(a0/64)`, `q2=trunc_s32(a2/64)`, `q1=trunc_s32(a1/256)`, `q3=trunc_s32(a3/256)`. Le biais ne concerne que les nombres négatifs ; ce n'est pas un ceil générique des coordonnées positives. Tous les calculs d'adresse, shifts et multiplications par LEA suivent le wrap x86 32 bits.

1. **Helper opaque**, avec les bornes originales et `0x1CB6040`, avant tout marquage local.
2. **Première passe**, si `q1<=q3`, pour chaque `r` de q1 à q3, puis chaque `c` de q0 à q2 (tests signés inclusifs) : `i=c+16*r`.
   - Écrit un dword `0xFFFFFFFF` à `0x1CB636C + 0x44C*i`, puis à cette adresse `+0x8980`, puis `+0x11300`, dans cet ordre. Le multiplicateur LEA est `5 -> 11 -> 55 -> 275`, puis scale 4, soit `0x44C`. Le stride des trois writes est `0x8980 = 32*0x44C`.
   - Ensuite lit un dword à `0x1CCFD90`. S'il est nul, passe à la cellule suivante. Sinon calcule `j=0x470*i` (`(9*i*8-i)*16`), lit le dword **`0x1CAD694+j`** ; s'il est nul, aucun effacement.
   - Si les deux gates sont non nuls : EAX=0, ECX=`0x100`, EDI=`0x1CAD28C+j`, puis `rep stosd`. Avec DF=0, efface exactement `[0x1CAD28C+j,0x1CAD68C+j)`, `0x400` bytes. Le gate est situé `0x408` bytes après le début de cette zone et n'est pas effacé par cette opération.
   - Le gate global est relu **à chaque cellule**, et le gate de record lu après les trois marquages. Les lectures et writes ne doivent pas être regroupés/reordonnés si des aliases inhabituels existent.
3. **Deuxième passe**, seulement après la totalité de la première : pour chaque r puis c, calcule `k=(c & 0xFFFFFFFE)+16*r`, et écrit un dword `0xFFFFFFFF` à `0x1CBECEC+0x44C*k`.
   - `and al,0xFE` efface seulement le bit 0 de EAX, conservant bits 8–31 et bits 1–7. Ce n'est ni une troncature à 8 bits, ni un index `c&0xFE`.
   - Identité d'adresse : `0x1CBECEC = 0x1CB636C + 0x8980`. Cette passe touche donc la même famille de champs que la deuxième banque de la première passe, mais avec c rendu pair ; les c consécutifs d'une paire peuvent écrire deux fois le même dword. Aucune lecture/append n'étaye le mot « queue ».
4. Restaure les quatre registres sauvegardés et retourne. Aucun rollback, aucune allocation, aucune synchronisation explicite dans le corps visible.

Les divisions quantifiées sont signées et tronquées vers zéro ; les boucles utilisent JG/JLE, pas JA/JBE. Une inversion de bornes brutes peut disparaître après quantification : les intervalles vides doivent être jugés sur q0/q2 et q1/q3. Si q0>q2, les deux corps de cellule sont sautés, mais le parcours externe et l'appel initial subsistent. Si q1>q3, les deux passes locales sont sautées. Les valeurs quantifiées bornent les compteurs, mais les adresses multipliées peuvent wrapper : aucune sûreté mémoire générale n'est prouvée.

`rep stosd` n'est précédé d'aucun CLD : la description d'effacement croissant suppose DF=0, convention ABI usuelle. Avec DF=1, les 256 dwords sont écrits en descendant depuis la même adresse initiale. Aucun x87/SSE n'est utilisé ; aucun arrondi ou état x87 n'intervient dans les calculs locaux. L'état laissé par le helper reste hors gel.

## Huit preuves ASM / xref

1. **ABI et helper avant traitement** : `asm-001.txt:2-16`, `0x464851–0x464874` : quatre chargements, cinq pushes right-to-left, appel `0x467550`, nettoyage `0x14`. `asm-005.txt:15-19`, `0x464992–0x464996` : pops puis RET sans immédiat.
2. **Signedness et échelles** : `asm-001.txt:15-25` et `asm-002.txt:1-19`, `0x464872–0x4648BD` : CDQ, biais `0x3F/0xFF`, SAR `6/8`, comparaison JG. `asm-004.txt:5-17`, `0x464935–0x464954`, confirme JLE/JG inclusifs et passe distincte.
3. **Trois banques de sentinelles** : `asm-003.txt:4-14`, `0x4648D9–0x464901` : LEA scale `0x44C`, write dword `0xFFFFFFFF`, stride `0x8980`, compteur 3. Preuve de marquage structurel indépendante des noms.
4. **Double gate exact** : `asm-003.txt:15-25`, `0x464903–0x464922`, avec `bytes-001.txt:6-7` : global `0x1CCFD90`, multiplicateur `0x470`, opcode `8B 82 94 D6 CA 01` lit **`[EDX+0x1CAD694]`**, puis TEST/JZ. Ce sont des dwords, non des octets.
5. **Effacement conditionnel** : `asm-004.txt:1-4`, `0x464927–0x464931`, et `asm-003.txt:25` : XOR EAX, EAX ; LEA EDI base `0x1CAD28C` ; REP STOSD avec ECX=`0x100` ; restauration de la borne EDI après l'effacement.
6. **Marquage pair et vrai retour machine** : `asm-005.txt:1-19`, `0x46496B–0x464996` : AND AL `0xFE`, LEA multiplications, write `0x1CBECEC+EAX*4`, boucles signées, puis aucune mise en forme de EAX avant RET. Le couple base/stride établit l'identité avec la banque centrale.
7. **Caller de copie de pixels gelé** : `metadata.json:181-186` donne l'appel natif `0x45BDBA` dans `0x45BD30`. `common-compaction.md:7,15,20` rapporte la copie u16 dans le buffer CPU `0x1B47818`, puis notification des bornes inclusives. Preuve contextuelle gelée, pas ASM caller relu dans cette session.
8. **Caller de déplacement gelé** : `metadata.json:187-192` donne `0x45BE5D` dans `0x45BDD0`. `common-compaction.md:16` rapporte la copie dans le même buffer et notification de la destination. Ce xref distinct renforce le rôle de notification/invalidation plutôt que de transport de pixels par la cible.

## Divergences de sources et inconnues explicites

- **Adresse du second gate : correction nécessaire de la compaction.** `common-compaction.md:9,29` parle de `0x1CAD294` / base+8. Le gel ASM complet et les bytes prouvent `0x1CAD694`. Par rapport à la base de record secondaire rapportée `0x1CAD228`, c'est offset **`0x46C`**, et par rapport au début d'effacement `0x1CAD28C`, **`+0x408`**. Aucune justification métier ne doit utiliser l'ancien offset +8.
- **Orientation X/Y :** `common-compaction.md:26` préserve un échange d'étiquettes dans la prose historique. Les échelles natives sont certaines ; l'explication GPU de ces dimensions nécessite un gel caller/page-layout supplémentaire.
- **Helper :** `common-compaction.md:14,28` oppose « rôle inconnu » et description d'overlap-clear. Aucun ASM de `0x467550` n'est fourni ici. Ne pas adopter cette description comme contrat vérifié ; demander au lead un gel de ce helper si ses effets doivent être exhaustifs.
- **Retour :** ignoré selon le contexte caller gelé, mais les six ASM callers ne sont pas présents. Ne pas promouvoir void comme convention de type certifiée sans readback caller ; le résidu EAX natif est documenté ci-dessus.
- **Pourquoi trois banques puis une passe pair sur la banque centrale ?** Géométrie des formats de texture/cache plausible, mais absence de consommateurs des champs et de layout de record natif. Demander ces xrefs/data-layout, pas déduire des noms historiques.
- **Global `0x1CCFD90` et champ `+0x46C` :** seuls leurs tests nonzero sont prouvés. Booléen, pointeur, compteur, allocation : non déterminé. La valeur `-1` peut être dirty/invalid/uninitialized ; invalidation est LIKELY, pas une définition formelle de tous les champs.
- **DF, aliases, capacité :** DF=0 est une précondition conventionnelle ; aucune borne mémoire ni isolation entre les globals n'est vérifiée. Les effets du helper et les contraintes sur les coordonnées restent nécessaires à un contrat global sûr.

## Couverture CFG

Les 20 starts de `metadata.json:11-160` ont été considérés : `464850` (ABI/helper/quantification), `4648C3` (compteur externe), `4648D1` (borne interne), `4648D9` (adresse), `4648F4` (trois writes), `464903` (gate global), `46490D` (gate secondaire), `464922` (effacement), `464935` (itération interne), `46493A` (rechargements), `464942` (itération externe), `46494C` (restauration indice), `464950` (gate seconde passe), `464956` (entrée), `464958` (réinitialisation), `46495C` (borne interne), `464966` (base ligne), `46496B` (pair/write), `46498D` (itération externe), `464992` (retour). Les chemins d'intervalles quantifiés inversés et les deux gates d'effacement sont inclus.
