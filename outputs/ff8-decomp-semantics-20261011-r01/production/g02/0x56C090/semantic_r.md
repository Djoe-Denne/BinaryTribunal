# 0x56C090 — contrat sémantique final R (2+1)

## Périmètre, provenance et couverture

R sémantique uniquement ; pas le volet C. Autorité : bytes/opcodes/CFG du gel, non les noms, commentaires ou l'accord des auteurs. Projection exclusive : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x56C090/semantic/`.

Le manifest fournit les deux auteurs distincts, tous deux `openai/gpt-6.1-sol`, variante `medium` : A `ses_ed3e17b87ffe0vywfCffclmJoc`, tâche `task_mv44ntmr_0062_oy5r62` ; B `ses_ed3e17789ffe06yVb0FYp1FPAn`, tâche `task_mv44ntmr_0063_r0g9m7`. SHA-256 déclarés : A `5183d1c3da596b8fe83be190819ae6e8d6aaf2361f87a52415b8a32bac4516ef`, B `10827399e66c338020751fe71b6ce595de3d378519213e83cad8aa2361605e47` ; paquet `e68f56607e807248d56cc62139e98f0783ff8f47fb67210c5983f809fc4ed1ad`, compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. Aucun auteur/hash manquant ni incohérence déclarative constatée. Les hashes sont ceux du parent, non des recalculs R : aucune primitive de hash de fichier autorisée disponible. Le parent conserve le contrôle byte-exact et de l'indépendance ; deux sessions du même modèle ne constituent pas une diversité de modèles. La mention B d'un historique de lecture factuelle ne prouve pas à elle seule un contexte fresh ; aucun historique n'a été inspecté par R.

Lecture complète A/B, compaction et manifests ; 116/116 instructions via `native-asm-001..005.txt` (25/25/25/25/16), 13/13 lignes de `native-bytes-001.txt`, et `native-metadata.json` lignes 1–1747 en plages bornées contiguës. Paquet original : identité, chunk et CFG inspectés ; sa longue ligne ASM est tronquée par le lecteur et remplacée pour l'analyse par les cinq slices verbatim complètes. Les métadonnées complètes sont dans la projection dédiée, sans recours aux autres sessions/index/services. Le chunk `[0x56C090,0x56C21C)` fait 396 octets. Couverture des trois blocs : préparation `[C090,C12F)`, boucle `[C12F,C1EC)` et copie/retour `[C1EC,C21C)` ; toutes les sorties/backedges examinées. Aucun Context Mode n'est exposé dans le catalogue ; les lectures natives sont ici les lectures courtes bornées explicitement demandées par la mission.

## Verdict, rôle et nom retenu

**Nom proposé : `Mat3S16_MultiplyScaledX87_Copy20_ReturnDst`.**

- **CERTAIN, mécanisme sur chemin normal** : deux dispositions de neuf WORDs signés, neuf produits scalaires à trois termes via x87, extraction de WORDs de représentations binary64, staging local, copie de 20 octets et retour du pointeur destination en EAX entier.
- **LIKELY, interprétation** : composition de matrices 3×3 à coefficients fixes, A×B lorsque leurs neuf éléments sont indexés row-major. Le nom décrit cette topologie ; il ne fixe pas une convention géométrique du moteur.
- **UNCERTAIN** : valeur native des constantes, contrôle/état x87 aux callers, garantie numérique Q12 exacte, valeur et signification des deux octets de pile copiés en fin de résultat, métier/caméra/battle/GTE. Aucun CONFLICT mécanique non tranché.

Deux preuves séparées du nom : neuf coefficients signés B sont disposés en trois colonnes `(0,6,C)`, `(2,8,E)`, `(4,A,10)` et combinés en produits scalaires ; indépendamment, un compteur de trois et un stride de six lisent les trois lignes A et produisent neuf WORDs avant cinq stores DWORD. Les opcodes, pas l'ancien label, établissent multiplication/topologie/copie.

## Contrat ABI, mémoire et effets

Interface descriptive, non une nouvelle déclaration de structure : `void * __cdecl f(const void *A18, const void *B18, void *D20)` compatible avec l'ABI observée. `[EBP+8]` = A, `[EBP+C]` = B, `[EBP+10]` = D ; `RET` sans immédiat, arguments non dépilés par le callee. Les pushes des callers ne sont pas gelés ici. EBP et ESI sauvés/restaurés ; EBX/EDI inchangés ; EAX/ECX/EDX et flags scratch. La routine aligne ESP à huit puis réserve 0x44 octets et pousse ESI ; restauration finale par EBP. Aucun CALL, allocation externe, contrôle null/bornes/alignment, saturation ou garde ajouté.

A et B exposent chacun 18 octets lisibles ; D expose **20 octets inscriptibles**, pas seulement 18. Loads WORD little-endian non nécessairement alignés, sign-extension 16→32 (`MOVSX`), puis `FILD m32` signé. Les opérations de pointeurs/compteur sont x86 32 bits modulo 2^32 ; pas de multiplication entière ni de shift à reconstituer. La seule branche est `JNZ` sur ZF du `DEC EDX` initialisé à trois : aucune comparaison signed/unsigned de coefficients. Les instructions x87 entre DEC et JNZ ne changent pas ce ZF.

Ordre des lectures de B : offsets `C,6,0,E,8,2,10,A,4`, tous avant la boucle. La première colonne B `(0,6,C)` reste en x87 ; les six autres valeurs passent par binary32 local. Ces stores sont exacts pour les entiers s16 en environnement x87 normal ; leur ordre d'exécution et effets x87 restent natifs. La lecture de A se fait par triplets `(0,2,4)`, `(6,8,A)`, `(C,E,10)`, dans cet ordre. Le load d'un composant suivant est parfois placé avant le FMUL du précédent ; ne pas remplacer cela par une promesse générale sur fautes/lecture volatile.

Avec `a[i,k] = s16(A+6*i+2*k)` et `b[k,j] = s16(B+6*k+2*j)`, les indices décrivent exactement A×B. Pour chaque ligne :

1. Charger/sign-étendre les trois A et convertir en x87, multiplier chacun par **une lecture m32** de `0xB695F8` (C142, C153, C165). Garder les trois résultats en pile x87.
2. Pour j=0,1,2 : effectuer `(scaled_a0*b0j + scaled_a1*b1j) + scaled_a2*b2j`, avec FMUL et FADDP séparés, sans réassociation/FMA. Ajouter **une lecture m64** de `0xB693D8`, puis `FSTP m64` dans le scratch à ESP+8 (ESP après push ESI).
3. Copier les 16 bits bas little-endian de cette représentation binary64 par SI vers le résultat local. Ce n'est pas `FISTP`, un cast float→int, un SAR 12 ni une conversion saturée. Le résultat est d'abord un motif WORD ; son interprétation ultérieure comme s16 appartient aux consommateurs.

L'ordre fin est observable : les deux premières multiplications de la colonne 1 sont exécutées avant le transfert WORD du résultat colonne 0 ; de même, les deux premières multiplications colonne 2 précèdent le transfert colonne 1. Après le dernier FSTP m64 : load SI, un pop x87, store WORD colonne 2, deux autres pops x87. Aucune expression C regroupée ne suffit à garantir cet ordre face aux exceptions.

Tampon résultat : base `S+0x28`, où S est ESP après push ESI. EAX commence à `S+0x2C`, avance de six AVANT les trois stores `[EAX-A]`, `[EAX-8]`, `[EAX-6]`. Les stores écrivent donc exactement `S+28..S+39` inclus (18 octets). `S+3A..S+3B` n'ont reçu aucun store dans la routine. Ce sont deux **octets préexistants de pile**, non une valeur à zéro, un champ défini, un padding d'entrée ou le padding destination conservé.

La fin charge EAX=D et lit les deux premiers DWORDs locaux ; restaure ESI puis stocke D+0 ; lit le troisième DWORD, pop x87, stocke D+4 ; lit le quatrième, stocke D+8 ; lit le cinquième, deux pops x87, stocke D+C puis D+10. Stores destination de largeur 32 dans l'ordre `0,4,8,C,10`. Le cinquième contient le neuvième WORD et les deux octets de pile non écrits. Ne pas remplacer par une copie de 18 octets ni inventer une initialisation des deux derniers. Des faults/traps peuvent laisser une copie partielle : aucun mécanisme de rollback.

Tous les loads des deux entrées précèdent le premier store destination. Sous mémoire ordinaire stable hors frame privée, D peut chevaucher A/B (y compris D=A ou D=B), et A/B peuvent se chevaucher ; pas de `restrict`. Cette observation ne promet rien pour pointeurs forgés dans la pile active, MMIO/volatile, modifications concurrentes ou fautes. Les constantes sont relues : pas de chargement unique artificiel hors boucle si leurs lectures doivent rester observables.

Retour normal : EAX complet = D, chargé à C1EC, jamais remodifié. Pas de retour coefficient, booléen AL, entier AX ni ST0. Les écritures SI ne modifient que la moitié basse d'ESI et ESI est ensuite restauré. Effets : D[0..19], pile privée/scratch, EFLAGS, état/status/pile x87 ; aucun global écrit et deux adresses globales numériques lues.

## x87 et limites numériques

Après capture de B : `ST0..2 = b00,b10,b20`. Après scaling de A : `ST0..5 = scaled_a2,scaled_a1,scaled_a0,b00,b10,b20`. C16B duplique b00 et le multiplie par a0 ; C16F duplique b10 et le multiplie par a1 ; C175 duplique b20 et le multiplie par a2. Cette reconstruction tranche l'ordre A×B et atteint huit entrées occupées au pic. Trois A sont dépilés par tour ; trois B le sont à la fin. Entrée normale avec pile vide → sortie vide, aucun retour x87. Une pile entrante non vide/non libre peut déborder : aucun test ou nettoyage préventif.

Pas de FLDCW/FINIT/sauvegarde-restauration d'environnement/clear des exceptions. Precision control, rounding control, masks, flags sticky et état/tag initial doivent rester ceux de la machine ; la routine ne les normalise ni ne les restaure. Les arithmetic/FSTP suivent cet environnement et peuvent produire status/exceptions ou traps. Les pops de fin sont intercalés aux stores destination, non tous avant la copie.

La compaction rapporte scale=1/4096 ; le commentaire/label du bias suggère 2^52+2^31. Le gel cible contient leurs adresses et formats, **pas leurs données natives**. Sous constantes nominales et environnement approprié, le biais puis la lecture du WORD bas correspondent à une quantification fixe modulo 16 bits par idiome magic-double. Ne pas promouvoir cela en garantie universelle d'arrondi nearest-even/truncation, ni en équivalence avec produit entier décalé. Le control word peut changer le résultat de l'addition biaisée ; même nearest rounding déclaré sans précision x87 ne suffit pas à justifier une simplification générale.

## Convergences, divergences et recherche d'erreurs communes

| Point | A / B | Décision R contre le natif |
|---|---|---|
| Nom | A sans Q12 ; B `MultiplyQ12` | Retenir scaled-x87 sans Q12 dans le nom certain : les opcodes donnent m32 à B695F8, pas sa valeur. Q12 reste LIKELY/conditionnel, non un vote. |
| Matrice / ordre | Accord A×B row-major | Validé par reconstruction ST et offsets C16B–C177 ; row-major est une convention d'indexation explicite, non une convention graphique prouvée. |
| Quantification | Accord WORD bas du double biaisé | Confirmé DD5C2408 puis 66MOV SI ; pas FISTP. L'idiome ne donne pas un arrondi universel en absence des données/control word. |
| Copie / padding | Accord 18 calculés, 20 copiés | Confirmé par arithmétique des adresses ESP et cinq stores DWORD : deux octets de pile préexistants. Valeur/signification UNCERTAIN ; ne pas les réparer. |
| ABI / alias / retour | Accord cdecl compatible, staging, EAX=D | Confirmé RET simple, loads avant stores, C1EC et absence de modification EAX ; validité limitée aux buffers ordinaires. |
| x87 | Accord profondeur huit/environnement non normalisé | Confirmé par suivi de pile et opcodes ; précision ajoutée sur interleaving des transferts/pops, comportement exceptionnel et copie partielle. |

Pas d'erreur mécanique majeure commune démontrée. Deux raccourcis communs sont explicitement bornés : « sortie s16 » ne doit pas devenir un cast numérique (le natif copie un motif WORD), et « Q12 magic-double » ne doit pas devenir une promesse d'arrondi/environnement. A=B n'a servi à aucune validation ; chaque point ci-dessus a été ré-établi contre l'ASM/bytes.

## Huit ancrages de preuve exacts

Références dans la projection exclusive ci-dessus ; commentaires ignorés.

1. **ABI/type signé** : C099/C09D/C0A1/C0AD ; `native-asm-001:5–16`, bytes `0FBF` et `DB442408` : arg B, WORD signés, FILD m32. C0FC et C1EC donnent A/D ; C21B=`C3` confirme RET sans nettoyage arguments.
2. **Disposition complète B** : C0B8–C12B ; `native-asm-001:14–25`, `002:1–18`, bytes D9 stores aux offsets locaux 10/14/18/1C/20/24 : six spills m32, trois coefficients retenus.
3. **Trois lignes/scale** : C11E=EDX 3, C12F/C13E/C150 loads WORD, C137/C15D increments 6, C164 DEC et C1E6 JNZ ; `002:15–25`, `003:1–8`, `004:23`. Bytes `D80DF895B600` attestent FMUL m32 à B695F8.
4. **Ordre des dot-products** : C16B–C179 et C185–C1CB ; `003:9–25`, `004:1–15` : FLD ST(3/5/6), FMUL ST(3/3/2), FADDP, puis variantes m32 des deux colonnes suivantes. Preuve indépendante de A×B, non B×A.
5. **Extraction exacte/ordre** : C17B/C181/C191/C196, C1A4/C1AA/C1BA/C1BF, C1CD/C1D3/C1D7/C1DE ; `003:17–25`, `004:4–20`. `DC05D893B600`, `DD5C2408`, `668B742408`, `668970F6/F8/FA` : bias m64, FSTP m64, WORD bits, WORD stores.
6. **20 versus 18** : C11A adresse locale +2C, trois stores par tour, C1EF/C1F3 et C1FA/C203/C20A reads locaux ; C1F8/C200/C207/C212/C215 stores D+0/4/8/C/10 ; `004:24–25`, `005:1–13`. Bytes corroborent dernier DWORD local et store `895010`, donc copie des deux bytes locaux non écrits.
7. **Environnement/retour** : C1DC/C1E2/C1E4 et C1FE/C20E/C210=`DDD8` (pops), C1EC=`8B4510`, C218–C21B restoration/RET ; `004:19–25`, `005:1–16`. Toutes les 116 instructions : aucun CALL ni instruction normalisant l'environnement x87.
8. **CFG/xrefs, borne métier** : `native-metadata:11–32` confirme les trois blocs et la backedge ; `33–74` donne notamment calls 50344D, 508EC5, 56C233/283/304/374, 5A9E67 ; `250–321` paires 70134A/373 etc. `1745–1746` : code_targets vide et 116 instructions. Callers multiples établissent un helper partagé, pas leurs arguments, rôle graphique ni usage du retour ; entrées sans owner ne sont pas reconstruites en fonctions inventées.

## Résiduels et gate parent

Pour renforcer seulement les claims actuellement UNCERTAIN : capture bornée des données à B695F8/B693D8 ; contexte caller/control word/invariant de pile x87 ; consommateur des deux bytes finaux et politique de structure ; arguments et utilisation du retour aux callers. Rien de cela n'est nécessaire pour livrer le contrat mécanique ci-dessus, mais sans ces preuves aucune promotion vers un nom Q12/arrondi/métier CERTAIN.

Livrable sémantique final complet, aucune écriture IDB/Git/registre/config/live ni délégation. Pas de tests/compilation, pas de hash recalculé, pas de contrôle natif final §5.6 : validation, hashes et promotion restent au parent.
