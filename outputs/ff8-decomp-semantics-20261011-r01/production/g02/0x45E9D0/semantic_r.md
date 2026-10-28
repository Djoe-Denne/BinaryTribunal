# 0x45E9D0 — contrat sémantique final réconcilié R

## Périmètre, provenance et couverture

R sémantique 2+1 uniquement, tâche `task_mv44nqd0_005t_uf5dha`. Seule projection consultée pour l'analyse : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x45E9D0/semantic/`. Aucun autre volet, sortie de peer hors A/B gelés, historique, index, service natif ou verdict antérieur consulté. Les instructions communes ont été lues. Ce document est le contrat sémantique, pas un livrable C ni une promotion IDB.

Le parent a déposé deux auteurs distincts, avec provenance explicite :

| Auteur | Session native | Modèle effectif déclaré | SHA-256 déposé |
|---|---|---|---|
| A | `ses_ed3e19d07ffeBGNbfVpKxvY1xB` | `openai/gpt-6.1-sol`, `high` | `4d503126576db697b5e9706a431ffc6dad90fb353cb7f4ac4cc4fc1fce597877` |
| B | `ses_ed3e19937ffe2LH18AhkUpXl82` | `openai/gpt-6.1-sol`, `high` | `8f4b3d40b2f0cb590b3d5d339c68605e8258e346f82dfaaa90f5740548587c70` |

Gel PE32 : EXE SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`. Paquet original SHA-256 `20a01d8e22132e51bd91786c830d7529b9608a3d0cdabc88a1981ffcda06cf5e`; compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`; métadonnées `56cbad8be49fbbb264845067e1cccd4e45b5ba9aa81b627a2c2b0b78f7c3f2ac`. Les hashes communs concordent entre les deux manifests et les déclarations A/B. A et B sont présents ; aucune incohérence déclarative identifiée. Les noms `asm-*` du native-manifest correspondent aux fichiers déposés `native-asm-*`, avec les mêmes hashes déclarés.

Lecture : manifest R 1–92, native-manifest 1–45, A 1–105, B 1–84, compaction 1–24 ; les cinq slices ASM intégrales, **109/109 instructions** ; bytes 1–17, **537 octets**, un chunk `[0x45E9D0,0x45EBE9)` ; native-metadata 1–1588 intégrales ; original 1–1596. L'affichage de la longue chaîne ASM de l'original à sa ligne 18 est tronqué par le lecteur ; elle est remplacée pour la couverture par les **109 lignes verbatim complètes** des slices autorisées, pas par une reconstruction conjecturale. CFG et xrefs originaux ont été lus jusqu'à la fin et concordent avec la projection metadata. Aucun hash de fichier n'a été recalculé faute de primitive autorisée donnant les octets bruts des fichiers ; leur contrôle cryptographique et le hash de sortie restent au parent, sans prétendre les avoir vérifiés ici. Lectures courtes bornées uniquement ; aucun outil Context Mode disponible dans le catalogue de cette session.

## Verdict, rôle et nom

**CERTAIN, au niveau des instructions capturées :** helper à état global, sans argument applicatif explicite ni appel sortant, qui calcule trois produits à facteur signé commun par x87, extrait trois motifs entiers via stockage binary64 biaisé, écrase trois résultats DWORD non saturés, écrit trois résultats DWORD saturés dans la plage s16, puis insère trois octets saturés et un octet auxiliaire dans un historique de trois DWORDs. Il réinitialise puis reconstruit un masque de saturation. **Aucune accumulation des anciens résultats bruts.**

**Nom final proposé : `ScaleGlobalS16Triplet_ClampAndPushPackedBytes`. CERTAIN comme description mécanique**, non comme restitution du nom source. Deux preuves indépendantes : les quatre chargements signés WORD et trois produits partageant ST(1) établissent `ScaleGlobalS16Triplet` ; les deux copies DWORD de l'historique et trois checks/stores BYTE établissent séparément `ClampAndPushPackedBytes` (ancres 1, 2 et 6 ci-dessous).

**LIKELY métier :** mise à l'échelle d'un triplet couleur dans un état d'émulation GTE, avec facteur nominal Q12. Les trois bytes contigus et les familles de flags sont compatibles avec ce rôle et la compaction l'apporte comme contexte. **UNCERTAIN :** identité matérielle/instruction GTE précise, usage rendu/acteur/effet, valeurs réelles des constantes, équivalence numérique spécialisée Q12 et prototype de retour source. Ces termes ne sont pas inclus dans le nom final : labels et notes ne prouvent ni contenus de données ni mapping matériel.

## Convergences et divergences tranchées contre le natif

| Sujet | A | B | Décision R et preuve |
|---|---|---|---|
| Nom/confiance | Nom mécanique, CERTAIN ; Q12/RGB hors nom | Nom principal avec Q12/RGB, LIKELY ; alternative mécanique | Retenir le nom mécanique ci-dessus. `D8 0D` prouve m32real à B695F8, pas sa valeur ; stores DL/AL/CL prouvent trois bytes, pas leur identité RGB. Q12/RGB restent LIKELY, pas conflit mécanique. |
| Terminologie des sorties brutes | « valeurs brutes », sans accumulation | « dword accumulators », mais dit qu'elles sont écrasées | Les appeler résultats bruts, pas opérations d'accumulation : stores à 45EA48/45EA6F/45EA96 sans aucune lecture des anciens 74/78/7C. |
| Position de l'octet auxiliaire | Résumé : avant les calculs ; détail : après premier FILD | Ordre détaillé compatible | Préciser l'interleaving : FILD à 45EA01 précède le store byte à 45EA09 ; le store précède le FMUL à 45EA16. Ne pas garantir que cet octet est écrit avant toute instruction x87/exception. |
| Arrondi x87 | Ne spécialise pas sans environnement | Donne un exemple conditionnel extended/53-bit et nearest-even | Retenir uniquement la séquence exacte, pas une promesse d'arrondi fondée sur PC/RC supposés. FSTP m64, extraction du DWORD bas et wrap +80000000 sont prouvés ; contenus des constantes/control word non gelés. |
| Largeurs/strides, clamps, flags | Même mécanique | Même mécanique | Recontrôlé sur bytes : MOVSX WORD, stores DWORD, JGE/JLE signés, JBE unsigned et stores BYTE. Accord non utilisé comme preuve. |
| Retour et ABI | EAX résiduel conditionnel ; pas d'API retour établie | Identique | Re-dérivation aux blocs 45EBBE/45EBCB/45EBDF : masque dans EAX seulement si troisième brut unsigned >255. Aucun retour constant ni void source CERTAIN. |

Aucune divergence mécanique restante après ces précisions. Les erreurs communes possibles ont été recherchées indépendamment : fausse conversion FISTP, arrondi portable implicite, lecture des mots hauts, stores s16 au lieu de DWORD, clamp octet basé sur les sorties s16, décalage RGB supplémentaire, bit 31 synthétique, accumulation et retour toujours égal au masque. Tous sont contredits par les opcodes. Les deux auteurs ne commettent pas ces erreurs dans leurs contrats détaillés ; leurs réserves sur données/callers sont maintenues.

## Contrat mémoire et entrées

Adresses hexadécimales, mémoire x86 little-endian. `M8/M16/M32` désignent des accès de largeur exacte, pas des types IDA. En exécution normale :

| Adresse | Accès/effet exact |
|---|---|
| `1CA8A64`, `1CA8A68` | Deux lectures DWORD avant les copies ; anciens contenus poussés vers `1CA8A60`, puis `1CA8A64`. |
| `1CA8A2B` | Une lecture BYTE ; écriture à `1CA8A6B`, quatrième byte du DWORD final de l'historique. |
| `1CA8A30` | Lecture WORD basse avec sign-extension ; multiplicateur commun ; aucun store. |
| `1CA8A34/38/3C` | Lectures des WORDs bas signés, spacing 4 ; ensuite stores des **DWORDs complets** saturés signés. Les mots hauts entrants ne sont pas des composantes. |
| `B695F8` | Une lecture réelle m32 du facteur, au FMUL à 45EA16. Valeur nominale 1/4096 seulement contextuelle. |
| `B693D8` | Lecture réelle m64 du biais, à chacun des trois FADD. Nominalement 2^52+2^31, pas de dump de ces données. |
| `1CA8A74/78/7C` | Stores DWORD des trois bruts, spacing 4 ; contenus précédents jamais lus. |
| `1CA92F8` | Store DWORD zéro, puis affectations/lectures/OR/stores de flags selon les chemins. Aucun maintien de l'ancien masque. |
| `1CA8A68/69/6A` | Trois stores BYTE, spacing 1 ; même DWORD que celui dont `6B` a été écrit auparavant, **alias volontaire**, pas quatre globals indépendants. |

Les trois historiques sont à stride 4, non 2. Les sorties brutes et les composantes WORD-in-DWORD sont également à stride 4 ; le packed final est à stride 1. Les quatre WORDs d'entrée sont chargés avant le premier store de composante saturée. Ne pas transformer ceci en boucle lisant/écrivant successivement les entrées, ni regrouper les stores packed en un store DWORD atomique. Le DWORD final à 68 conserve temporairement ses 24 bits bas précédents après l'écriture du byte 6B.

## Séquence arithmétique et accès, dans l'ordre natif

Notation : `s` est s16[M16(30)] ; `v1/v2/v3` sont s16[M16(34/38/3C)]. `X87` ci-dessous signifie **instructions natives sous l'environnement entrant**, pas des fonctions ajoutées ni des expressions C évaluables indifféremment.

1. `SUB ESP,8`. Charger ancien M32(64) dans EAX et ancien M32(68) dans ECX ; stocker à 60 puis 64. Lire `s`, puis `v1` ; écrire `s` comme m32int dans les 8 octets locaux ; lire le byte 2B dans DL.
2. `FILD m32int` de `s` (45EA01) ; remplacer le DWORD local par `v1` ; stocker DL à 6B ; lire `v2` dans EAX. `FMUL m32real[B695F8]` crée le facteur retenu `k` en ST(0), sans stockage intermédiaire binary32. `FILD(v1)` empile devant k ; **alors** M32(92F8)=0 (45EA20).
3. Pour v1 : `FMUL ST(0),ST(1)`, `FADD m64real[B693D8]`, `FSTP m64real` dans le local. Lire son **DWORD bas de bits** dans EDX. Remplacer le DWORD bas local par `v2`, puis `FILD(v2)` (45EA3E), **avant** `EDX += 0x80000000` et M32(74)=EDX. Cet ADD est modulo 2^32, pas une addition signée C susceptible d'overflow UB.
4. Pour v2 : mêmes FMUL/FADD/FSTP m64 ; lire le DWORD bas dans ECX ; `LEA EAX,[ECX+80000000]` donne le deuxième brut modulo 2^32. Lire `v3` à 45EA64 et écrire le DWORD local ; M32(78)=EAX ; `FILD(v3)` à 45EA74.
5. Pour v3 : mêmes FMUL/FADD/FSTP m64 ; lire le DWORD bas dans ECX, ajouter 80000000 modulo 2^32. `CMP EDX,FFFF8000` ; **puis** `FSTP ST(0)` enlève k à 45EA94 ; **puis** M32(7C)=ECX. Ce pop x87 et ce MOV ne changent pas les flags entiers du CMP avant JGE.
6. Saturer le brut EDX en plage s16 et écrire M32(34), avec flags ci-dessous. Comparer EAX au bas s16 ; `PUSH EBX` entre ce CMP et son JGE préserve les flags. Saturer EAX vers M32(38), puis ECX vers M32(3C). Les trois **bruts restent dans leurs registres**, non remplacés par les résultats s16.
7. Tester EDX unsigned contre FF. Hors plage, lire M32(92F8) dans EBX, `SAR EDX,31`, OR 200000 à EBX, NOT EDX, store flags. Sinon laisser EDX. Comparer EAX unsigned contre FF, stocker DL à 68, puis `POP EBX` ; CMP/MOV/POP ne changent pas la décision unsigned pour EAX.
8. Si EAX hors plage byte : lire flags dans EDX (le brut r1 n'est plus nécessaire), `SAR EAX,31`, OR 100000 à EDX, NOT EAX, store flags. Comparer ECX unsigned à FF, stocker AL à 69. Hors plage ECX : charger flags dans EAX, `SAR ECX,31`, OR 80000 à EAX, NOT ECX, store flags. Stocker CL à 6A. `ADD ESP,8 ; RET`.

Ainsi, pour chaque composante, son brut `r_i` est :

`r_i = (low32_bits(binary64_store_x87(FADD_x87(FMUL_x87(FILD(v_i), k), M64real(B693D8)))) + 0x80000000) mod 2^32`, avec `k = FMUL_x87(FILD(s), M32real(B695F8))` retenu en pile x87.

Les opérations doivent rester distinctes et dans cet ordre. `DB 44 24 00` est FILD m32int ; `DD 5C 24 00` est FSTP **m64real** ; `D8 0D` est FMUL m32real ; `DC 05` est FADD m64real. Ce n'est **ni** FISTP **ni** un cast numérique du double en entier. Le local de 8 octets est réutilisé comme m32int, m64real puis motif de bits ; ne pas introduire un alias C incompatible ou lire le DWORD haut à la place du bas.

### Saturations et masque exacts

Soit `signed32(r)` l'interprétation deux-complément du motif r, sans conversion signée C non portable présupposée.

- Les DWORDs 34/38/3C reçoivent `clamp(signed32(r_i), -32768,32767)` en représentation sign-étendue DWORD. Seuils inclus ; comparaisons JGE/JLE **signées**.
- Pour les bytes : si `uint32(r_i)<=255`, garder le registre ; sinon `NOT(SAR(reg,31))` donne 0 pour un brut signé négatif ou FFFFFFFF pour un brut non négatif hors plage. Seul DL/AL/CL est stocké, donc clamp 0..255. JBE est **unsigned**, et tous les négatifs sont hors plage. Aucun shift de couleur additionnel, aucun rechargement des composantes s16 saturées.

| Condition | Modification exacte de M32(92F8), après son clear |
|---|---|
| signed32(r1) < -32768 ou >32767 | **affecter** `81000000` |
| signed32(r2) < -32768 ou >32767 | OR `80800000` |
| signed32(r3) < -32768 ou >32767 | OR `00400000` |
| uint32(r1) >255 | OR `00200000` |
| uint32(r2) >255 | OR `00100000` |
| uint32(r3) >255 | OR `00080000` |

Ne pas ajouter de bit 31 pour une saturation de r3 ou d'un byte : ces chemins n'en posent pas. L'asymétrie des masques est native, pas un défaut à normaliser.

## ABI, sous-registres et environnement

- Aucun argument stack, registre général entrant applicatif ou pointeur n'est lu ; aucune instruction CALL. Compatible avec une fonction cdecl sans argument, mais le RET nu ne suffit pas à prouver la convention source. Les xrefs de calls sans corps caller ne tranchent pas le type de retour.
- EBX sauvegardé/restauré sur tous les chemins normaux, ESI/EDI/EBP non touchés ; ESP retrouve son niveau d'entrée avant RET. EAX/ECX/EDX volatils. Les flags arithmétiques finaux CF/PF/AF/ZF/SF/OF viennent du `ADD ESP,8`, pas d'un flag de saturation retourné ; les autres bits EFLAGS ne sont pas redéfinis par cet ADD.
- Le premier `MOV DL,[2B]` ne définit que DL ; la partie haute entrante d'EDX n'est jamais consommée : EDX est ensuite entièrement remplacé par la lecture du brut r1. Les stores DL/AL/CL **lisent**, sans modifier leurs registres. Aucun résultat AL-only/AX-only, aucun MOVZX de retour.
- Définir `b2reg = r2` si uint32(r2)<=255, sinon 0 si signed32(r2)<0, sinon FFFFFFFF. Si uint32(r3)<=255, **EAX final = b2reg**. Sinon **EAX final = masque final M32(92F8)**, par chargement à 45EBCB puis OR 80000. AL et AX sont les portions basses de cet EAX, pas des résultats indépendants. Cette fonction ne renvoie donc pas systématiquement le masque, un RGB, un booléen ou une constante. Une API source à effets seulement est plausible, pas CERTAIN ; aucun `void` source imposé.
- Le control word x87 n'est ni modifié, ni sauvegardé/restauré. Le calcul dépend de PC/RC, masques d'exception, pile/tag/status entrants et des données réelles aux deux adresses. Quatre FILD, trois FSTP mémoire et un FSTP ST(0) : profondeur nette zéro en déroulement normal sans faute de pile, avec besoin de deux slots supplémentaires au maximum ; les valeurs x87 préexistantes ne sont pas utilisées. Aucun résultat flottant nouveau retourné. Status/condition codes, exceptions sticky et métadonnées d'instructions/opérandes peuvent changer : **préserver ces effets natifs**, pas restaurer artificiellement l'environnement.
- Le contrat de résultats finaux suppose que les instructions terminent normalement avec une pile x87 utilisable. Exceptions non masquées, faute de pile ou faute mémoire peuvent empêcher la complétion ; ne pas ajouter de guard, fallback, exception clearing ou rollback. Les stores FIFO, l'octet auxiliaire, le clear des flags et les bruts sont intercalés avec les opérations susceptibles de faute ; l'état partiel dépend du point d'arrêt exact.
- État global partagé, séquence non atomique ; pas de verrou/reentrancy guard. Sérialisation externe inconnue. Aucun I/O, allocation ou appel de bibliothèque.

## Huit ancres probantes exactes

Chemins relatifs à la projection R ci-dessus ; noms des labels non utilisés comme preuve.

1. **Historique et tag, preuve du nom indépendante du calcul :** `45E9D3/45E9D8/45E9DE/45E9E3`, `45E9FB/45EA09` ; `native-asm-001.txt:2–12`, `native-bytes-001.txt:1–2`. Chargements/copies DWORD puis `88 15` BYTE à 6B.
2. **Facteur/triplet signé :** `45E9E9/45E9F0/45EA0F/45EA64`, `45EA16/45EA2A/45EA4E/45EA78` ; `native-asm-001.txt:6–25`, `native-asm-002.txt:5–9`. MOVSX WORD, FILD et un facteur partagé ST(1), preuve calcul indépendante du packed.
3. **Extraction réelle et bruts sans accumulation :** `45EA2C–45EA48`, `45EA50–45EA6F`, `45EA7A–45EA96` ; `native-bytes-001.txt:3–7`, `native-asm-001.txt:18–24`, `native-asm-002.txt:1–16`. `DC05/DD5C`, DWORD bas puis wrap ; aucun read des destinations 74/78/7C dans l'ASM entier.
4. **Saturation s16, stores 32 bits :** `45EA8E–45EB74` ; `native-asm-002.txt:14–25`, `native-asm-003.txt:1–25`, `native-asm-004.txt:1–7`, bytes `7D/7E` et stores sans préfixe 66. Masques distincts `81000000/80800000/00400000`.
5. **Clear et asymétrie flags :** `45EA20`, `45EA9E/45EABC`, `45EAF0/45EB15`, `45EB40/45EB66` ; mêmes slices et `native-bytes-001.txt:3,7–14`. Affectation du premier masque contre OR des suivants ; aucun calcul d'erreur générale.
6. **Clamps bytes et alias :** `45EB7A/45EB80`, `45EB99/45EBA5`, `45EBBE/45EBC9`, stores `45EB9E/45EBC4/45EBDF` ; `native-asm-004.txt:8–25`, `native-asm-005.txt:1–7`, `native-bytes-001.txt:14–17`. JBE opcode 76, SAR31/NOT et stores DL/AL/CL à 68/69/6A.
7. **EAX conditionnel et fin ABI/x87 :** `45EA94` (`DD D8`), `45EBCB/45EBD3/45EBDA`, `45EBE5/45EBE8` ; `native-bytes-001.txt:7,17`, `native-asm-005.txt:2–9`. Le chemin de r3 hors plage transforme EAX en masque, puis ADD ESP et RET nu.
8. **Réemploi et CFG natifs :** calls `56CB64` dans `56CB50`, `56CBD4` dans `56CBC0`, `5D9570` dans `5D9510`, `657E0F/657E42` dans `657DF0`, et `7013F0` dans `701390` ; `native-metadata.json:175–203,859–864`. CFG `:11–173` et `code_targets:[]`/109 instructions `:1586–1587`. Ces xrefs prouvent réemploi, pas consommation d'EAX ni métier particulier.

## Couverture CFG — 22/22 blocs

| Départs natifs | Effets/branches couverts |
|---|---|
| `45E9D0` | Historique/tag, les trois calculs et stores bruts, clear masque, CMP bas r1, pop du facteur x87. |
| `45EA9E`, `45EAB4`, `45EABC`, `45EAD2` | Clamp bas r1, test haut r1, clamp haut r1, store r1 dans plage ; convergence 45EAD8. |
| `45EAD8`, `45EAE0`, `45EAFE`, `45EB05`, `45EB23` | CMP bas r2 + PUSH EBX, clamp bas, test haut, clamp haut, store dans plage ; convergence 45EB28. |
| `45EB28`, `45EB30`, `45EB4E`, `45EB56`, `45EB74` | CMP bas r3, clamp bas, test haut, clamp haut, store dans plage ; convergence 45EB7A. |
| `45EB7A`, `45EB82` | Test byte unsigned r1, éventuellement SAR/NOT et OR flags. |
| `45EB99`, `45EBA7` | CMP byte r2, store premier byte, POP EBX ; éventuellement clamp r2/flags. |
| `45EBBE`, `45EBCB` | CMP byte r3, store deuxième byte ; éventuellement clamp r3/flags et remplacement EAX. |
| `45EBDF` | Store troisième byte, ADD ESP, RET. |

Branches conditionnelles et sauts de convergence concordent avec les bytes et les 22 blocs du gel. Aucune omission de chunk ou instruction dans l'analyse réconciliée.

## Limites et captures complémentaires nécessaires avant spécialisation

1. **UNCERTAIN numérique spécialisé :** geler les 4 octets à B695F8, les 8 à B693D8 et le contrat x87 entrant PC/RC/masques/pile avant d'affirmer une formule Q12/arrondi C bit-exact. Ni division entière, SAR12, cast, `round()` ni nearest-even inconditionnel ne remplacent le contrat natif actuel.
2. **UNCERTAIN prototype de retour :** geler des slices caller avant/après les calls listés pour établir une consommation de EAX/AX/AL ou son absence. Le contrat présent expose les résidus exacts sans inventer une API.
3. **UNCERTAIN identité métier/concurrence :** mapping des globals et contexte caller borné nécessaires avant nom d'instruction GTE spécifique ou garantie de sérialisation. Aucune capture supplémentaire requise pour conclure ce contrat mécanique qualifié ; toute extension passe par le lead.
4. Aucun test, compilation, exécution x87, contrôle cryptographique indépendant, contrôle natif §5.6 final ou intégration effectués. Aucune mutation IDB, Git, registre, configuration ou live, ni délégation. Le lead conserve hashage final, §5.6, validation native et décision de promotion. **Verdict de livraison : contrat mécanique réconcilié complet ; limites métier/numériques/prototype explicitement conservées UNCERTAIN.**
