# 0x45EBF0 — sémantique A indépendante

## Frontière et couverture

- Rôle : sémantique A uniquement ; aucun C, score, auteur voisin ou verdict consulté.
- Autorité : export natif 0x45EBF0, représenté par la projection verbatim ; SHA-256 du paquet déclaré dans `manifest.json:4` : `dd7611f37d54d96d1f3d3fdcb221a43aac2e371f1006d9733df00a1273427c4e`.
- Entrées : `inputs/ff8-decomp-semantics-20261011-r01/g02/common-compaction.md:1-24` ; sous-répertoire `0x45EBF0.readable/`, `manifest.json:1-45`, `metadata.json:1-958`, `asm-001.txt:1-25`, `asm-002.txt:1-25`, `asm-003.txt:1-25`, `asm-004.txt:1-25`, `asm-005.txt:1-16`, `bytes-001.txt:1-17`.
- Couverture : 116/116 instructions, un chunk `[0x45EBF0,0x45EE0D)` de 541 octets, toutes les 22 entrées CFG et tous les xrefs du gel. Les cinq slices ASM et la slice bytes ont été lues intégralement, sans ligne ASM tronquée. Les hashes sont ceux du manifeste, non recalculés ici.
- Analyse statique seulement ; aucune compilation, exécution, vérification live ou promotion §5.6.

## Rôle, nom et confiance

**Nom proposé : `GlobalTriple_AccumulateScaledS16_ClampAndPackU8FIFO`.**

**CERTAIN** pour ce nom descriptif et les effets mécaniques : accumulation de trois produits à partir de quatre valeurs s16 globales, mise à jour de trois accumulateurs 32 bits, saturation de leurs images vers s16 et u8, puis production d'un DWORD empaqueté dans une portion de file globale comportant trois DWORDs observés. Le nom ne présuppose ni objet métier ni registre matériel. Deux preuves indépendantes du nom : (1) chargements des anciens accumulateurs et trois LEA additionnants ; (2) déplacements DWORD de la file et magasins AL/CL après les contrôles de plage (preuves 3 et 1/6 ci-dessous).

**LIKELY** : composant d'émulation GTE produisant un triplet couleur RGB, utilisant une échelle Q12. La compaction commune décrit cette famille ; le triplet d'octets et les masques de statut sont compatibles avec elle. **UNCERTAIN** : nom exact d'une commande GTE, emploi dans un effet/éclairage précis, correspondance canonique IR/MAC/RGB des adresses, valeur effective des constantes et environnement x87. Le label `sub_45EBF0`, les anciens noms et les commentaires ne constituent pas des preuves.

## Contrat mécanique

### ABI et entrées

- Fonction leaf, sans `call`, sans lecture d'argument sur la pile ; `retn` sans immédiat. Compatible avec une interface x86 cdecl à zéro argument explicite, mais le gel ne prouve pas un prototype source historique.
- État implicite : WORDs signés à `0x1CA8A30`, `0x1CA8A34`, `0x1CA8A38`, `0x1CA8A3C` ; DWORDs anciens à `0x1CA8A74`, `0x1CA8A78`, `0x1CA8A7C` ; DWORDs de file à `0x1CA8A64`, `0x1CA8A68` ; octet à `0x1CA8A2B`.
- `fmul` lit une constante mémoire binary32 à `0xB695F8` ; les trois `fadd` lisent une constante mémoire binary64 à `0xB693D8`. Le premier `fmul` transforme le WORD `0x1CA8A30` en facteur commun. La compaction donne 1/4096 pour la première constante ; les bytes des constantes ne sont pas inclus dans la projection.
- Strides : quatre sources WORD espacées de **4 octets**, pas un tableau s16 compact ; trois accumulateurs DWORD espacés de **4 octets** ; file DWORD espacée de **4 octets** ; composantes empaquetées aux offsets **0,1,2**, octet auxiliaire à **3**. Aucun parcours ni boucle.

### Ordre et effets mémoire

1. Lit les anciens DWORDs `A64` et `A68`, écrit `A60 = ancien A64`, puis `A64 = ancien A68`. Ici et ci-dessous `Axx` abrège `0x1CA8Axx`.
2. Copie l'octet `0x1CA8A2B` vers `A68+3` (adresse `0x1CA8A6B`) avant la production du nouveau triplet ; il n'est pas altéré par les magasins des trois autres octets.
3. Lit les sources signées ; lit les anciens accumulateurs ; efface **tout** le DWORD de statut `0x1CA92F8`, sans préserver ses anciens bits. Chaque source WORD est consommée avant son propre remplacement DWORD par saturation.
4. Calcule le facteur x87 à partir de `s16(A30)` et de la constante binary32. Pour les composantes issues de `A34`, `A38`, `A3C`, effectue multiplication x87, addition de la constante binary64, magasin binary64 dans un scratch de 8 octets, puis lecture du DWORD bas de ses **bits**. Ce n'est pas une conversion `fistp`.
5. Pour chaque composante, ajoute au DWORD bas l'ancien accumulateur correspondant et `0x80000000`, **modulo 2^32** ; écrit les trois résultats bruts `X,Y,Z` à `A74,A78,A7C`. Les accumulations entières surviennent après les conversions flottantes, pas à l'intérieur d'une expression flottante unique. Aucun drapeau d'overflow arithmétique n'est traité par les LEA.
6. Interprète chaque résultat brut en signé 32 bits ; écrit son clamp `[-32768,32767]` en **DWORD** à `A34,A38,A3C`. Les moitiés hautes sont donc remplacées, pas préservées. Les sorties accumulateurs conservent les résultats bruts, non saturés.
7. À partir de ces mêmes `X,Y,Z` bruts, et non des trois DWORDs saturés, teste chaque composante en **unsigned 32 bits** contre 255. Si hors plage, `SAR 31` suivi de `NOT` produit 0 pour un résultat signé négatif, `0xFFFFFFFF` pour un résultat signé non négatif. Stocke seulement l'octet bas : 0 ou 255. Si dans la plage unsigned, stocke sa valeur exacte. Écrit `A68+0`, `A68+1`, `A68+2` dans cet ordre.

Notation arithmétique exacte, sans imposer un environnement flottant : pour chaque source `v`, soit `L(v)` le DWORD bas des bits binary64 du magasin x87 de `(v * facteur) + constante64`, avec la précision/arrondi réellement actifs ; alors `X = ancien A74 + L(s16(A34)) + 0x80000000 (mod 2^32)`, et analogiquement pour `Y/A78/A38`, `Z/A7C/A3C`. Sous les constantes usuelles et l'environnement approprié, `L(v)+0x80000000` s'interprète comme un entier arrondi du produit Q12. Cette simplification est conditionnelle, pas le contrat natif inconditionnel.

### Statut final

Après remise à zéro :

| Condition sur résultat brut signé | Masque ajouté au DWORD `0x1CA92F8` |
|---|---|
| X < -32768 ou X > 32767 | `0x81000000` (affectation, premier clamp) |
| Y < -32768 ou Y > 32767 | `0x80800000` (OR) |
| Z < -32768 ou Z > 32767 | `0x00400000` (OR) |
| X hors [0,255] unsigned | `0x00200000` (OR) |
| Y hors [0,255] unsigned | `0x00100000` (OR) |
| Z hors [0,255] unsigned | `0x00080000` (OR) |

Ne pas ajouter automatiquement un bit de résumé à la saturation Z ni aux seuls débordements u8 : l'ASM n'en ajoute pas. Les comparaisons s16 utilisent `JGE/JLE` signés ; les contrôles u8 utilisent `JBE` unsigned. Valeurs exactement aux bornes acceptées.

### Registres, retour et x87

- ESI et EBX sauvegardés/restaurés ; ESP retrouve sa valeur d'entrée. Les PUSH/POP sont des sauvegardes de registres, pas des paramètres de callee. EBP/EDI ne sont pas employés. EAX/ECX/EDX sont écrasés.
- Aucun retour AL ou AX dédié : `AL` n'est que la source de deux magasins d'octets. `CL` est la source du troisième. Le magasin `A68+1 = AL` n'écrit pas EAX.
- **EAX à RET est déterminé mais dépend du chemin** : si Z est hors [0,255] unsigned, EAX contient le statut final (chargé/OR à `0x45EDEF-0x45EDFE`). Sinon il contient Y lorsque Y est dans [0,255], 0 lorsque Y est signé négatif, ou `0xFFFFFFFF` lorsque Y est signé positif et >255. C'est le motif complet de `SAR/NOT`, pas nécessairement 255 en EAX. AX/AL sont simplement ses parties basses ; aucune preuve que les callers exploitent ce résidu comme valeur de retour contractuelle.
- Quatre `FILD m32int`, quatre `FMUL` (dont celui du facteur), trois `FADD m64real`, trois `FSTP m64real`, puis un `FSTP ST(0)` : profondeur x87 équilibrée sur un retour normal, au plus deux temporaires empilés au-dessus de la pile d'entrée. Le facteur demeure en ST(1) pendant les trois produits puis est dépilé.
- Aucun `FLDCW`, changement de précision/arrondi, sauvegarde/restauration d'environnement ou nettoyage d'exceptions. Les résultats dépendent du control word entrant et des arrondis de multiplication/addition/magasin. Les flags/status x87 et exceptions peuvent être modifiés ; des exceptions non masquées ou une pile x87 sans place invalident l'hypothèse de retour normal. Ne pas substituer une division entière, `SAR 12`, cast C tronquant ou mode round-to-nearest forcé à cette chaîne.
- Le `CMP EAX,-32768` à `0x45EC7B` fournit les EFLAGS du `JGE` à `0x45ECD5` malgré les calculs x87 et LEA/MOV intermédiaires : ceux-ci ne remplacent pas les EFLAGS. PUSH/POP intercalés entre CMP et branche ne les modifient pas non plus.

## Huit preuves ASM/xrefs

Chemins ci-dessous relatifs à `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45EBF0.readable/`.

1. **File et octet auxiliaire** : `asm-001.txt:2-5,9-12`, `0x45EBF3-0x45EC29` : DWORDs décalés A64→A60 et A68→A64, copie de DL à A68+3. Preuve indépendante de la partie FIFO du nom.
2. **Entrées s16 et facteur commun** : `asm-001.txt:6-15,20-25` et `asm-002.txt:10-16`, `0x45EC09-0x45ECB9` : MOVSX WORD puis FILD ; FMUL du facteur, réutilisation de ST(1) ; FADD/FSTP de trois doubles.
3. **Accumulate, non remplacement pur** : `asm-001.txt:16,18` et `asm-002.txt:1-4,8-9,17-21`, `0x45EC40,0x45EC46,0x45EC6E,0x45EC74,0x45EC95,0x45ECC3` : anciens A74/A78/A7C intégrés par LEA au résultat de conversion avec 0x80000000, puis magasins DWORD. Preuve indépendante de la partie accumulation du nom.
4. **Saturation signée et largeur effective** : `asm-002.txt:22-25`, `asm-003.txt:1-25`, `asm-004.txt:1-12`, `0x45ECD5-0x45ED97` : bornes -32768/32767, JGE/JLE et magasins DWORD A34/A38/A3C. ESI reste 32767 jusqu'à la décision de clamp Z ; sa réutilisation en statut sur la branche Z négative ne change pas le chemin supérieur.
5. **Statut asymétrique** : `asm-001.txt:19`, `asm-002.txt:23`, `asm-003.txt:3,12,19`, `asm-004.txt:2,9,18`, `asm-005.txt:3,11` : clear, puis masques exacts 81000000/80800000/00400000 et 00200000/00100000/00080000.
6. **Clamp u8 du résultat brut et empaquetage** : `asm-004.txt:13-25`, `asm-005.txt:1-14`, `0x45ED9D-0x45EE03` : CMP 255/JBE, SAR 31/NOT, magasins AL/AL/CL aux trois octets A68. Aucune recharge des IR saturés.
7. **Retour résiduel, pas RGB/IR stable** : `asm-004.txt:22-25`, `asm-005.txt:1-16`, `0x45EDC1-0x45EE0C` : EAX reçoit Y, éventuellement SAR/NOT ; la branche Z débordante le remplace par les flags. Épilogue sans construction d'un retour dédié.
8. **Contexte d'appel borné** : `metadata.json:174-216,512-516,956-958` : appels depuis 0x56CB50 à 0x56CB7D, 0x56CBC0 à 0x56CBED, 0x5D9510 à 0x5D9585, 0x657DF0, 0x658010 et 0x701390 ; aucun code_target sortant. Les xrefs corroborent une primitive largement réutilisée, pas son métier exact. La compaction `common-compaction.md:7-8,13` décrit les voisins à même famille et l'accumulation distinctive ; aucune lecture supplémentaire des voisins.

## Divergences, limites et questions ouvertes

- Pas de contradiction mécanique constatée entre projection ASM/bytes et compaction. Nuances nécessaires : la compaction dit « RGB/IR/MAC » et « 1/4096 » ; ces identités sont du contexte secondaire, tandis que l'ASM établit les adresses/largeurs/chaîne x87. « EAX path-dependent » est précisé ci-dessus avec ses deux familles de chemins. Une saturation u8 n'implique pas que le registre entier devient 255.
- Le gel contient les opcodes de lecture des constantes, non leurs données ; le nom de la constante64 ne prouve pas sa valeur. Besoin d'un complément **gelé par le lead** pour certifier binary32 B695F8 et binary64 B693D8, ainsi que control word/occupation x87 attendus aux callers, si une formule numérique simplifiée inconditionnelle est requise.
- Les trois accumulateurs 32 bits ont une addition à wrap sans clamp de débordement 32 bits. Quelles bornes les callers garantissent-ils ? Sans ces bornes, une interprétation mathématique en entier illimité est fausse.
- Les callers consomment-ils EAX ou uniquement l'état global ? Xrefs seuls insuffisants ; un prototype métier `void` reste une recommandation conditionnelle, sans nier le résidu observable.
- Quel nom métier est validé pour le facteur A30, les canaux A34/A38/A3C et le byte A2B ? Ne pas baptiser une commande matérielle particulière avec ce seul gel.
- État global partagé, non réentrant sans discipline externe ; aucune synchronisation native. Aucun pointeur d'appel ni structure complète n'est établi par cette fonction.
- Hash de sortie non calculé ; parent peut le calculer. Aucune validation dynamique ou compilation revendiquée.
