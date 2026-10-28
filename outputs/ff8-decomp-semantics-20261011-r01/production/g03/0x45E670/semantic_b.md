# 0x45E670 — analyse sémantique B indépendante

## Périmètre et provenance

- Rôle : sémantique B uniquement, mission run01, tâche `task_mv44o5gy_006l_jiz5rw`.
- Entrées lues : `inputs/ff8-decomp-semantics-20261011-r01/g03/common-compaction.md` (56 lignes), `0x45E670.readable/manifest.json` (40), `asm-001.txt` (25), `asm-002.txt` (25), `asm-003.txt` (25), `asm-004.txt` (17), `bytes-001.txt` (14), `metadata.json` (188), sous le même répertoire g03. Instructions communes également lues. Aucun autre auteur, C cible, review, score ou verdict consulté.
- Autorité : paquet natif projeté sans correction selon le manifest ; SHA256 déclaré `06476e1094d6963e3532e19496a495b87b348503b4e79216e537b193aa571774`. Compaction déclarée `9959dc7995e01db21518f4c15252096543ca53ec042a342d705dce6badf71572`. Hashes non recalculés ici.
- Couverture : 92/92 instructions, 426/426 octets affichés, chunk unique `[0x45E670,0x45E81A)`, 15/15 blocs, trois sorties. Aucun tronquage des slices lus. Pas de compilation, test ou exécution.

## Rôle et nom proposés

**Nom : `GlobalVec3_CrossF32ScaledS16_SaturateS16`. Confiance : LIKELY globalement ; CERTAIN pour la structure mécanique du calcul et des saturations.**

La fonction transforme un triplet signé lu dans des slots globaux : elle multiplie chaque composante par 4096, calcule trois différences de produits avec trois coefficients globaux float32, réalise une extraction entière via biais flottant, conserve les trois résultats bruts dans des slots 32 bits, puis réécrit le triplet initial avec saturation signée à [-32768,32767]. Un autre slot global reçoit des indicateurs de saturation.

Les différences de produits établissent indépendamment le produit vectoriel ; les comparaisons signées et leurs stores établissent indépendamment la saturation S16. Le préfixe Global est établi par les adresses absolues, F32 par les opcodes `D9 05`, et ScaledS16 par `MOVSX word` suivi de `SHL 12`. Le nom existant n'est pas une preuve. Le nom proposé ne prétend pas à une conversion portable indépendante de l'environnement x87.

**Interprétation métier LIKELY :** opération de géométrie d'un fichier de registres GTE émulé, compatible avec une opération OP utilisant trois coefficients diagonaux. La compaction décrit un voisinage et des slots partagés qui corroborent cette lecture, mais les noms « Cam », « IR », « MAC », l'usage caméra et l'équivalence exacte au GTE matériel ne sont pas établis par cette fonction seule. Aucun nom métier plus précis proposé.

## Contrat mécanique

### Entrées et représentation

- Aucune lecture d'argument stack ni de registre d'entrée général ; leaf sans CALL. `SUB ESP,8`, puis `ADD ESP,8; RET` sans immédiat. ABI compatible avec routine sans paramètres/cdecl, mais le RET seul ne démontre pas une convention source ou un prototype void.
- `a,b,c` = sign-extension des 16 bits bas aux adresses `0x1CA8A34`, `0x1CA8A38`, `0x1CA8A3C`. Les bits hauts existants ne participent pas. Slots espacés de **4 octets**, pas vecteur packed de shorts.
- `A=a*4096`, `B=b*4096`, `C=c*4096` sont obtenus par shifts 32 bits puis `FILD m32int`. Pour tout S16 initial, leur plage [-134217728,134213632] tient dans S32 ; aucun overflow ici. Une réécriture C par shift signé négatif ne serait cependant pas portable.
- Coefficients float32 aux adresses `x=0x1CA923C`, `y=0x1CA9244`, `z=0x1CA924C`, déduites des bytes. **Stride observé 8 octets** entre coefficients sélectionnés. Aucun parcours ni stride de boucle. Chaque coefficient est relu deux fois ; pas de snapshot commun des trois coefficients.
- Biais chargé en float64 depuis `0xB693D8`. Les octets de cette donnée ne figurent pas dans les slices cible. La compaction :40 rapporte une validation externe `2^52+2^31`, pas une validation locale de B.

### Calcul, ordre et sorties

Pour coefficients stables et environnement x87 adéquat, les expressions algébriques sont :

- `t1 = y*C - z*B`,
- `t2 = z*A - x*C`,
- `t3 = x*B - y*A`.

C'est donc `(x,y,z) × (A,B,C)`, et non le produit vectoriel inverse. Ces expressions désignent l'ordre natif des opérations x87, pas une garantie de précision réelle infinie ou une permission de fusionner des opérations.

Pour chacun : FADD m64 du biais, FSTP **m64** dans les huit octets scratch stack, lecture des 32 bits bas little-endian, ADD `0x80000000` modulo 2^32. Aucun FIST/FISTP, aucune conversion int par instruction dédiée. Appelons les résultats de cette extraction `r1,r2,r3` (bit patterns 32 bits interprétés signés pour les clamps).

Ordre observable des stores normaux :

1. `0x1CA92F8 = 0` avant les FILD et produits.
2. `0x1CA8A74 = r1` à 0x45E6EA.
3. `0x1CA8A78 = r2` à 0x45E715.
4. `0x1CA8A7C = r3` à 0x45E73A.
5. `0x1CA8A34 = clamp_signed(r1)` ; indicateur `0x81000000` si hors plage.
6. `0x1CA8A38 = clamp_signed(r2)` ; OR `0x80800000` si hors plage.
7. `0x1CA8A3C = clamp_signed(r3)` ; OR `0x00400000` si hors plage.

Tous ces stores sont **dword**, y compris les slots de résultats S16 : les valeurs négatives y sont sign-étendues. Les bornes elles-mêmes ne déclenchent pas d'indicateur. Si `s1,s2,s3` indiquent les trois dépassements, le flag final est exactement `(s1 ? 0x81000000 : 0) | (s2 ? 0x80800000 : 0) | (s3 ? 0x00400000 : 0)`. Un dépassement de la troisième composante seul **ne met pas bit31**. Ne pas ajouter un bit résumé supposé « matériel ».

Inputs et sorties saturées partagent les mêmes adresses. Les trois shorts sont capturés dans les registres avant toute réécriture de ces slots. Fonction à état global, non réentrante sans sérialisation externe ; aucune protection interne. Les stores intermédiaires et le flag déjà remis à zéro peuvent rester visibles en cas d'interruption/exception : aucune atomicité du triplet.

### EAX, AX, AL et effets x87

Sur retour normal :

- Si la deuxième **ou** la troisième composante sature, **EAX = flag final**.
- Sinon, **EAX = r1 brut**, même si la première composante seule sature. Les stores immédiats de sa saturation ne modifient pas EAX.
- Aucun retour dédié AL/AX : AL/AX sont seulement les sous-parties de cet EAX. Ce n'est donc ni un booléen uniforme, ni toujours le flag, ni toujours le premier résultat saturé. L'usage par les callers n'est pas gelé ici ; intention source du retour **UNCERTAIN**.
- ECX conserve r2 et EDX r3 ; ESP restauré, aucun EBX/ESI/EDI/EBP modifié. EFLAGS sont notamment écrasés par l'ADD ESP de l'épilogue.
- x87 : trois FILD et six FLD, trois FSUBP, trois FSTP m64 et trois FSTP ST de nettoyage. Pic de **cinq valeurs temporaires** au-dessus de l'état d'entrée, bilan de profondeur nul en exécution normale sans défaut. Aucune valeur FP retournée dans ST0 ; un éventuel contenu antérieur reste sous les temporaires.
- Pas de lecture/écriture du control word, pas de FINIT/FNCLEX. PC, RC, masques d'exception et disponibilité des slots x87 sont préconditions ambiantes. Les opérations peuvent changer le status word/sticky exception bits ; ils ne sont pas sauvegardés/restaurés.
- Avec biais `2^52+2^31`, valeurs finies dans le domaine utile, précision suffisante et RC nearest-even, l'extraction implémente une quantification vers un entier via l'arrondi du flottant biaisé (typiquement entier le plus proche, égalités paires). **Ce comportement conditionnel n'est pas un contrat inconditionnel de cast ou de round.** PC=24, autres RC, NaN/Inf, dépassement du domaine du trick ou exceptions non masquées exigent l'exécution x87 exacte. Aucun guard natif ne borne ces cas.

## Huit preuves ASM/xrefs

Chemins abrégés ci-dessous : `R = inputs/ff8-decomp-semantics-20261011-r01/g03/0x45E670.readable/`.

1. **Global/ScaledS16** : `R/asm-001.txt:2-14`, 0x45E673/67A/681 et 688/69D/6A8 : MOVSX word, SHL 0Ch, FILD m32. Preuve du type signé, facteur 4096 et absence de packed-short stride.
2. **Cross, premier terme** : `R/asm-001.txt:15-19`, 0x45E6B3–6C3 : avec pile `[C,B,A]`, y*C puis z*B et FSUBP donnent y*C-z*B. Preuve du sens du produit vectoriel, indépendante du nom historique.
3. **Cross, deux autres termes** : `R/asm-001.txt:22-25`, `R/asm-002.txt:3,8-15`, 0x45E6CF–6E8 et 6FD–71B : z*A-x*C puis, après retrait de C, x*B-y*A. Confirme la permutation cyclique et exclut un produit scalaire.
4. **Extraction et brut** : `R/asm-001.txt:20-21`, `R/asm-002.txt:1-7,13-23`, 0x45E6C5–6EA, 6EF–715, 71D–73A ; `R/bytes-001.txt:3-6` confirme `DD 5C 24 00` = FSTP m64, ADD 0x80000000 et stores des bruts. Pas de FISTP.
5. **Saturation signée x** : `R/asm-002.txt:21,24-25`, `R/asm-003.txt:1-8`, 0x45E733–775 : JGE/JLE signés, bornes -32768/32767, dword stores. Preuve indépendante du mot SaturateS16 et maintien d'EAX brut sur ces branches.
6. **Saturation y/z et masks** : `R/asm-003.txt:9-25`, `R/asm-004.txt:1-17`, 0x45E77A–819 : mêmes comparaisons signées, OR 0x80800000/0x00400000 ; EAX rechargé du flag uniquement sur saturation y/z ; trois RET. Prouve le retour conditionnel et l'absence de bit31 automatique pour z.
7. **État FP et ABI** : `R/asm-001.txt:1,8,11,14-25`, `R/asm-002.txt:3,6,8-22`, `R/asm-004.txt:5-6,13-17` : scratch huit octets, opérations x87 équilibrées, nettoyage explicite, pas de CW reset ni d'argument, RET C3 confirmé par `R/bytes-001.txt:12-14`.
8. **Leaf réutilisée, métier non prouvé** : `R/metadata.json:118-187` : 11 xrefs near-call réparties sur neuf fonctions, dont 0x4026D4 et 0x40277E dans 0x402620, 0x61A05A/0x61A7A6 dans 0x619B70 ; `code_targets=[]`. La multiplicité des callers prouve la réutilisation, pas leur préparation des coefficients ou leur consommation d'EAX.

## Couverture CFG

Les 15 blocs de `metadata.json:11-117` ont été confrontés aux slices : `670–742`, `742–758`, `758–75F`, `75F–775`, `775–77A`, `77A–782`, `782–79D`, `79D–7A5`, `7A5–7C0`, `7C0–7C6`, `7C6–7CE`, `7CE–7EB`, `7EB–7F3`, `7F3–810`, `810–81A` (préfixe 0x45E). Entrée calculante, trois diamonds de clamp, sorties en 0x45E7EA/80F/819 ; aucun bloc omis.

## Divergences de sources et questions ouvertes

- La compaction :39 qualifie les trois floats de « last float of each 0xC-stride row ». Ses propres adresses de neuf champs ne corroborent pas cette phrase : les adresses effectivement chargées sont 0x1CA923C/244/24C, espacées de 8, et 0x1CA9244 est intermédiaire dans la deuxième ligne listée. Retenir les offsets natifs, pas cette qualification. La lecture diagonale reste une interprétation possible, pas un layout démontré.
- La compaction :40/48 signale une ancienne prose erronée `2^52+2^51` contre validation attribuée `2^52+2^31`. Je ne transforme ni label ni ancienne prose en preuve des bytes de la constante : un gel borné de `0xB693D8..E0` lèverait ce manque.
- Quel PC/RC et quel état x87 les callers garantissent-ils ? Domaines effectifs des trois floats ? Aucun gel caller ni CW d'entrée disponible. La mécanique est définie par les opcodes ; le raccourci « arrondi S32 » reste conditionnel.
- Les callers ignorent-ils EAX, ou attendent-ils son résultat conditionnel ? Il faut un gel de quelques instructions après les calls, pas un prototype historique, pour conclure.
- L'identification GTE OP/diagonale et l'usage caméra demandent le contexte des producteurs/consommateurs des globals. Les labels seuls sont exclus comme preuve ; conformité au FLAG matériel non affirmée.
- Les mentions de C historique et de statut SKIP dans la compaction :41-47 sont inventaire secondaire uniquement ; fichiers historiques non ouverts, aucune conclusion reprise à leur seule autorité.

Aucune promotion, écriture IDB/Git/registre/live ou §5.6 effectuée. Le lead possède la validation et le hash de sortie.
