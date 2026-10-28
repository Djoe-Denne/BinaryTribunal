# 0x45E670 — contrat sémantique réconcilié R

## Périmètre, provenance et verdict

Mission `ff8-decomp-semantics-20261011-r01`, groupe g03, **sémantique uniquement**, tâche `task_mv44o8wk_006n_re4gj4`. Aucun C d'un autre volet, résultat historique, index, service de découverte ou état IDA consulté. Le présent contrat ne constitue ni une décompilation C ni le contrôle natif final §5.6.

Projection autorisée : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g03/0x45E670/semantic/` (abrégée `P/` ci-dessous). Tous ses fichiers ont été lus. La longue chaîne `assembly` du paquet JSON est tronquée **à l'affichage du lecteur** ; ses quatre slices `native-asm-*` ont été lues entièrement, sans troncature, ainsi que les bytes et les métadonnées. Aucun suffixe ASM n'a été déduit de la seule chaîne tronquée.

Le manifest remet bien deux auteurs distincts :

| Auteur | Session native déclarée | Modèle effectif déclaré | SHA-256 du candidat |
|---|---|---|---|
| A | `ses_ed3e1403cffeoC70hxIl5U7FVh` | `openai/gpt-6.1-sol`, high | `b739c9e58f029e338dd0c11a55daec2c9a4b2918961e4ed538bd724131b2e036` |
| B | `ses_ed3e13ba1ffelE4sC5SAxLKIsE` | `openai/gpt-6.1-sol`, high | `c28369c21053c6aeb1b7535f8e82a46d44e8217939d66855e80ac670714e63e6` |

Paquet original : `06476e1094d6963e3532e19496a495b87b348503b4e79216e537b193aa571774`. Compaction : `9959dc7995e01db21518f4c15252096543ca53ec042a342d705dce6badf71572`. Les déclarations des deux auteurs et du native-manifest concordent avec le manifest de réconciliation ; les hashes des slices correspondent également entre manifests, moyennant le préfixe de fichier `native-`. Pas d'auteur manquant ni d'incohérence déclarée constatée. **Hashes fournis, non recalculés** : aucun outil de lecture binaire/hash de fichier n'est disponible dans ce rôle ; le parent conserve leur vérification et le hash de cette sortie. Cela n'est pas présenté comme une vérification cryptographique indépendante.

**Nom final proposé : `GlobalCross3F32_Scale4096_ClampS16`.** Deux preuves indépendantes pour les mots essentiels : différences cycliques de produits (ancres 2–3), puis branches signées et stores aux bornes S16 (ancre 6). Échelle et représentation d'entrée sont établies séparément par l'ancre 1 ; le préfixe Global et F32 par les adresses absolues et les opcodes de charge.

**CERTAIN, au niveau mécanique :** calcul ordonné de trois différences de produits de coefficients globaux binary32 avec un triplet signé S16 mis à l'échelle 4096 ; extraction des résultats par biais binary64 et low-dword, conservation des résultats bruts, réécriture des slots d'entrée par clamp signé S16 et indicateurs littéraux. Ceci décrit les instructions, sans promettre un arrondi entier portable pour tout environnement x87.

**LIKELY, au niveau métier :** primitive de géométrie d'un fichier de registres GTE émulé, corroborée seulement par le contexte secondaire autorisé. **UNCERTAIN :** opération matérielle exacte, layout/axes de matrice, usage caméra, prototype source/consommation du retour, domaine des coefficients et simplification de la conversion pour tout PC/RC. Aucun CONFLICT natif non résolu dans ce gel.

## Convergences, divergences et recherche d'erreurs communes

| Point A/B ou source | Arbitrage indépendant R |
|---|---|
| A et B : coefficients × triplet signé mis à l'échelle, sens du produit vectoriel identique | Retenu par suivi des indices ST(1/2/3) et opcode `DE E9` = FSUBP ST(1),ST(0), pas par accord. Les trois termes sont donnés ci-dessous. |
| A : `Cross3Float_Scale4096_ClampS16Globals` ; B : `GlobalVec3_CrossF32ScaledS16_SaturateS16` | Divergence de nom seulement. Nom final ci-dessus : distingue les coefficients F32 de l'entrée S16 et explicite 4096 ; ne prétend pas que le calcul intermédiaire est en précision float32. |
| A : CERTAIN mécanique / LIKELY métier ; B : LIKELY global / CERTAIN mécanique | Même frontière pratique. Maintenir deux niveaux séparés ; ne pas promouvoir l'identité GTE OP sur la seule compaction. |
| A/B : FSTP m64, extraction low-dword ; trois résultats bruts et clamps signés | Retenu après vérification des opcodes `DD 5C 24 00`, MOV dword, ADD modulo 2^32, `7D/7E` et stores dword. Une conversion C directe, un FISTP ou des stores short seraient faux. |
| A/B : EAX = FLAG si composante 2 ou 3 clampée, sinon résultat brut 1 | Retenu après analyse de chaque chemin. Le clamp de composante 1 écrit FLAG par MOV-immediate sans toucher EAX. Ni `void` source ni retour uniforme de FLAG n'est prouvé. |
| A/B : masks exacts, dont composante 3 seule sans bit31 | Retenu sur les MOV/OR natifs. Pas de correction selon une convention matérielle présumée. |
| Compaction : « last float of each 0xC-stride row » ; A/B signalent l'erreur | Erreur secondaire confirmée : parmi les lignes listées, les adresses chargées sont le dernier, le milieu et le premier champ. Écart numérique entre coefficients sélectionnés = 8 ; aucune preuve primaire de layout de matrice. |
| Compaction : ancienne prose `2^52+2^51`, validation attribuée `2^52+2^31` | Le code charge m64 à `0xB693D8`. Les bytes de cette **donnée** ne sont pas dans le chunk cible ; la séquence `00 00 00 80 00 00 30 43` rapportée en compaction est cohérente avec `2^52+2^31`, mais reste evidence secondaire. Contrat final paramétré par la donnée m64 réellement chargée. |
| A/B : possible arrondi entier dans un domaine adapté | Limité strictement : deux points d'arrondi possibles (FADD suivant PC/RC puis store binary64 suivant RC), produits et différence déjà arrondis. Ni « nearest-even » inconditionnel, ni remplacement par `round`, `lrint`, cast ou opération fusionnée. Aucun guard natif n'est ajouté. |

Recherche d'erreurs communes : vérification explicite du sens FSUBP, de la largeur du scratch (8, pas 4), des relectures de coefficients, du pic x87, des stores globaux intercalés dans le calcul, des bornes inclusives, du cas où seule la première composante sature et du cas où seule la troisième sature. Pas de défaut mécanique majeur commun identifié. Les limitations constantes/FP/callers ci-dessous sont maintenues, pas comblées par consensus.

## Contrat final : entrées, calcul et effets

### Entrées et ABI observables

- `I1/I2/I3` sont les **16 bits bas signés** lus à `0x1CA8A34/38/3C`, sign-étendus en EAX/ECX/EDX avant toute réécriture de ces adresses. Leurs anciennes moitiés hautes sont ignorées. Slots espacés de 4 octets, pas tableau packed de shorts.
- Chacun est décalé à gauche de 12 dans un registre de 32 bits, puis chargé par FILD m32 signé. Soit `Jk = 4096*Ik`, compris dans `[-134217728,134213632]` : la valeur signée est représentable. Le SHL est néanmoins un SHL x86 ; un shift C d'une valeur signée négative ne serait pas une traduction portable.
- Coefficients : `D1` à `0x1CA923C`, `D2` à `0x1CA9244`, `D3` à `0x1CA924C`, chacun chargé par FLD m32-real. Charges dans l'ordre **D2, D3, D3, D1, D1, D2** ; deux lectures par adresse, pas snapshot unique. Les noms Cam/axes ne servent pas de preuve.
- Biais `K` : FADD m64-real à `0xB693D8`, relu trois fois. Valeur secondaire attendue `2^52+2^31` ; la lecture de cette mémoire, et non un littéral supposé, est le contrat primaire.
- État x87 entrant : PC, RC, masques/status et disponibilité de la pile. Aucune initialisation, sauvegarde ou modification du control word.
- Leaf, aucun appel, aucun argument stack ou GPR d'entrée utilisé comme donnée de calcul. ESP sert au scratch local de huit octets et à RET ; trois épilogues `ADD ESP,8; RET C3`. Compatible avec une routine sans paramètres cdecl, non preuve unique d'une convention/prototype source. EBX/ESI/EDI/EBP inchangés.

### Arithmétique exacte et résultats bruts

Sur exécution normale, les termes suivent cette orientation, si l'on note les charges correspondantes par les symboles ci-dessus :

1. `T1 = D2*J3 - D3*J2` ;
2. `T2 = D3*J1 - D1*J3` ;
3. `T3 = D1*J2 - D2*J1`.

Il s'agit de trois suites **FMUL distinctes puis FSUBP**, avec la précision et l'arrondi x87 ambiants. L'identité vectorielle `D × J` est valable comme description algébrique lorsque les coefficients restent stables ; elle n'autorise ni fusion, ni réassociation, ni suppression des relectures. Aucun diviseur 4096 en sortie.

Chaque `Tk` est suivi de FADD du biais, puis de FSTP m64-real dans le scratch. Le dword bas de la représentation binary64 little-endian stockée est lu, puis augmenté de `0x80000000` **modulo 2^32**. Noter `R1/R2/R3` ces bit patterns. Ce n'est ni FISTP, ni une conversion d'entier C ; NaN/Inf, précision réduite et valeurs hors domaine du trick restent traités par les instructions natives et leurs exceptions. L'interprétation signée de R n'arrive que pour les branches de clamp.

### Ordre d'accès et intercalage FP/entier

Cet ordre est à conserver, notamment si une exception interrompt le calcul ; les résultats ne sont pas publiés atomiquement :

1. Lire les trois low-words d'entrée. SHL/stager J1, **clear dword FLAG à `0x1CA92F8`**, FILD J1 ; SHL/stager/FILD J2 puis J3. La même zone stack est réutilisée.
2. Charger/multiplier D2 puis D3, soustraire T1, ajouter K, stocker m64 dans le scratch.
3. Charger/multiplier D3 puis D1 pour T2 ; **lire le low-dword de T1 et former R1 avant FSUBP T2**. FSUBP T2 ; store brut R1 à `0x1CA8A74` ; ajouter K à T2 et stocker m64 scratch.
4. Lire le low-dword destiné à R2 ; FSTP ST(0) retire J3. Charger/multiplier D1 puis D2 pour T3 ; former R2 et store brut à `0x1CA8A78` **avant FSUBP T3**. FSUBP T3 ; ajouter K et stocker m64 scratch.
5. Lire low-dword destiné à R3 ; FSTP ST(0) retire J2 ; former R3 ; CMP R1 avec -32768 ; FSTP ST(0) retire J1 **sans changer les EFLAGS du CMP** ; store brut R3 à `0x1CA8A7C` ; JGE démarre le clamp de R1.
6. Clamps composantes 1, 2, 3 dans cet ordre, avec les stores/masks ci-dessous, puis l'un des trois retours. Scratch local et changements x87 intermédiaires ne sont pas annulés rétroactivement.

Les sorties brutes et les entrées/résultats saturés sont deux triplets distincts à stride 4 ; aucun alias entre leurs plages dans le gel. En revanche chaque slot saturé **alias son propre slot d'entrée**. La capture initiale des trois low-words préserve donc les inputs utilisés malgré leurs réécritures ultérieures.

### Saturation et FLAG, y compris ordre des stores

Pour chaque R interprété comme S32 : si `< -32768`, écrire le **dword** `0xFFFF8000` ; si `> 32767`, écrire le dword `0x00007FFF` ; sinon copier le dword R. Les deux égalités restent en plage. Destination : `0x1CA8A34/38/3C` respectivement.

- Composante 1 hors plage : **store FLAG = `0x81000000` avant** le store de la composante saturée ; EAX reste R1. Sinon store R1 seulement.
- Composante 2 hors plage : load FLAG dans EAX ; store de la composante saturée ; OR EAX,`0x80800000` ; store EAX dans FLAG. Sinon store R2 seulement.
- Composante 3 hors plage : load FLAG dans EAX ; store de la composante saturée ; OR EAX,`0x00400000` ; store EAX dans FLAG ; épilogue. Sinon store R3 puis épilogue.

Sans modification concurrente et sur retour normal, FLAG est donc l'union des masks des clamps : `(s1?0x81000000:0) | (s2?0x80800000:0) | (s3?0x00400000:0)`. Même mask pour dépassement négatif ou positif d'une composante. La troisième composante seule ne positionne pas bit31. Aucun bit de résumé supplémentaire, guard ou règle GTE matérielle inventé.

### Retours et environnement x87

Sur retour normal sans interference externe : si composante 2 **ou** 3 clampée, EAX contient FLAG final ; sinon EAX contient **R1 brut**, y compris si seule composante 1 clampée. Aucun write AL ou AX distinct ; AL/AX ne sont que les vues basse 8/16 bits de cet EAX. ECX = R2, EDX = R3. EFLAGS finaux sont ceux de l'ADD ESP d'épilogue, pas ceux du dernier CMP. Le prototype source `void` et une éventuelle consommation d'EAX/AL/AX sont UNCERTAIN.

Suivi de pile x87, hors exceptions/stack faults : après les FILD, `[J3,J2,J1]` ; après le store de T1, même pile ; après le store de T2 puis le premier FSTP ST, `[J2,J1]` ; après le store de T3 puis les deux FSTP ST, pile entrante retrouvée. Maximum **cinq temporaires** au-dessus de la pile entrante. Les trois FSUBP, trois FSTP m64 et trois FSTP ST compensent trois FILD et six FLD ; aucune valeur FP nouvelle retournée dans ST0. Pour une exécution sans débordement de pile, il faut cinq entrées libres. Les valeurs plus anciennes restent sous les temporaires sur ce chemin normal.

Le control word n'est pas changé ; le status word, ses exceptions sticky et les condition bits ne sont **pas** préservés. Des exceptions masquées peuvent influer sur les valeurs ; des exceptions non masquées/stack faults peuvent empêcher la terminaison ou certains stores. Ce contrat n'efface pas les exceptions et n'ajoute pas de sanitization. Routine à état global, sans synchronisation et non réentrante sans discipline externe ; l'ordre des relectures et des loads/stores FLAG reste significatif en cas d'interférence.

## Huit groupes de preuves exactes

Dans les citations courtes, `asm-00N` désigne `P/native-asm-00N.txt` et `bytes-001` désigne `P/native-bytes-001.txt` ; les numéros après les deux-points sont les lignes complètes des slices.

1. **Entrées/échelle :** `0x45E673/67A/681` MOVSX word, `0x45E688/69D/6A8` SHL 0Ch, `0x45E699/6A4/6AF` FILD dword (`P/native-asm-001.txt:2–14`, `P/native-bytes-001.txt:1–3`). Les bytes `0F BF`/`DB 44 24 00` confirment signed-word puis signed-dword, indépendamment des types IDA.
2. **Premier terme et orientation :** `0x45E6B3–6C3`, FLD m32 D2 ; FMUL ST,ST(1) avec J3 ; FLD m32 D3 ; FMUL ST,ST(3) avec J2 ; `DE E9` FSUBP (`asm-001:15–19`, `bytes-001:3`). Donne D2*J3-D3*J2, non son inverse.
3. **Deux autres termes :** `0x45E6CF/6D5/6D7/6DD/6E8`, puis `0x45E6FD/6FF/705/707/70D/71B` (`asm-001:22–25`, `asm-002:1–15`, `bytes-001:4–6`). ST(3) puis ST(2) prouvent T2 ; retrait de J3 puis ST(1)/ST(3) prouvent T3. Pas de dot product.
4. **Conversion et intercalage :** FADD m64 `0x45E6C5/6EF/71D` (`DC 05 D8 93 B6 00`), FSTP m64 `0x45E6CB/6F5/723` (`DD 5C 24 00`), loads low-dword `0x45E6DF/6F9/727`, ADD `0x45E6E3/70F/72D` ; stores bruts `0x45E6EA/715/73A` (`asm-001:20–21`, `asm-002:1–23`, `bytes-001:3–7`). Prouve binary64, wrap et publication avant clamps.
5. **Masks/store order :** clear `0x45E68F`, MOV FLAG `0x45E742/75F` avant stores composante 1 ; load FLAG `0x45E782/7A5/7CE/7F3`, stores clamp puis OR `0x45E791/7B4/7DD/802` et stores FLAG (`asm-001:7`, `asm-002:25`, `asm-003:1–21`, `asm-004:1–12`). Masks littéraux 81000000/80800000/00400000, sans bit31 automatique pour la troisième.
6. **Clamps signés :** CMP/JGE/JLE `0x45E733/740/758/75D`, `0x45E77A/780/79D/7A3`, `0x45E7C6/7CC/7EB/7F1`, puis stores immédiats/raw (`asm-002:21–25`, `asm-003:1–25`, `asm-004:1–17`). `7D/7E` = conditions signées ; JLE signifie ZF=1 ou SF!=OF. Bornes inclusives et dwords, pas shorts.
7. **ABI/retour/x87 :** SUB ESP,8 `0x45E670` ; cleanup `0x45E6FD/72B/738` (`DD D8`) ; trois ADD ESP,8/RET `0x45E7E7/7EA`, `0x45E80C/80F`, `0x45E816/819` (`asm-001:1`, `asm-002:8,19,22`, `asm-004:5–17`, `bytes-001:12–14`). Chargements d'EAX limités aux clamps 2/3 après R1 ; aucun FNINIT/FLDCW, aucune instruction de call dans les 92 instructions.
8. **Réutilisation, pas preuve de métier/retour :** `P/native-metadata.json:118–188` donne 11 near-call xrefs dans neuf fonctions : `0x4026D4/277E`, `0x549E3C`, `0x61A05A/A7A6`, `0x668293`, `0x671741`, `0x676121`, `0x6B722A`, `0x6C91BA`, `0x7041EA`. `code_targets=[]`. Sans bytes des callers, ces xrefs ne prouvent ni prototype, ni valeur consommée, ni usage caméra.

## Couverture et limites finales

Couverture confrontée : **92/92 instructions, 426/426 octets de code, chunk unique `[0x45E670,0x45E81A)`, 15/15 blocs, trois RET**. Blocs (tous préfixés 0x45E) : `670–742`, `742–758`, `758–75F`, `75F–775`, `775–77A`, `77A–782`, `782–79D`, `79D–7A5`, `7A5–7C0`, `7C0–7C6`, `7C6–7CE`, `7CE–7EB`, `7EB–7F3`, `7F3–810`, `810–81A`. L'entrée fait le calcul ; les trois groupes suivants portent clamps inférieur/supérieur/in-range. Les blocs terminaux correspondent aux retours inférieur, supérieur et in-range de composante 3 ; aucun bloc ou chunk manquant.

Limites non bloquantes pour le contrat mécanique, **bloquantes pour les promotions plus fortes** :

- Certifier numériquement K en primaire demande au lead une capture des huit bytes `0xB693D8..0xB693E0` dans le même gel/version binaire. La valeur n'est pas nécessaire pour définir la séquence native.
- Simplifier la conversion exige evidence des PC/RC/masks, domaines d'inputs et préconditions de pile ; même avec K attendu, ne pas omettre le double arrondi possible ou les valeurs exceptionnelles.
- Proposer un prototype source ou un retour uniforme exige quelques instructions avant/après les calls, pas un ancien SetType. Contrat EAX observable déjà tranché pour les chemins normaux.
- Identifier matrice/diagonale, caméra ou instruction GTE matérielle exige evidence primaire des producteurs/consommateurs de ces globals. Labels/comments/types et voisinage secondaire ne suffisent pas ; encodages FLAG logiciels sont conservés tels quels.
- Hashes, contrôle natif §5.6 et éventuelle promotion restent au parent. Aucun test/compile/exécution, mutation IDB/Git/registre/configuration/live, délégation ou appel API effectué.
