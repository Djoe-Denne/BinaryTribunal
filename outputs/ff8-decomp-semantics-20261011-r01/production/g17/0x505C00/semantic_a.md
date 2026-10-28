# Sémantique A — g17 / 0x505C00

## Identité et provenance

- Mission : `ff8-decomp-semantics-20261011-r01` ; tâche `task_mv44sf6k_00ba_l8kpke` ; auteur `pool-204`, session `ses_ecf10c76affeUnJuNq1ALMpkvc`, rôle sémantique A, 2+1.
- Admission attestée par le lead, message `INPUT-ADMISSION-HARDENING-v1` : `openai/gpt-6-astra`, variante `xhigh`, attendu = observé, override=0. L'ancienne mention Sol high n'est pas la référence d'admission. Aucun changement local de modèle.
- Origine factuelle indépendante attestée par le lead : checkpoint révision 2 de `ses_ed41fc6c0ffeWZh5hkKIUXKy89`, frontière exclusive avant `msg_12be1cd49001BowbZIVfuXq4cy`, préfixe de huit messages. Aucune production de pair, review, C cible ou verdict futur consulté.
- Projection autorisée : `inputs/ff8-decomp-semantics-20261011-r01/g17/0x505C00.readable/`. Ci-dessous, `P/` désigne ce chemin ; `G/` désigne `inputs/ff8-decomp-semantics-20261011-r01/g17/`.
- Lu : `P/manifest.json:1–30`, `P/asm-001.txt:1–25`, `P/asm-002.txt:1–17`, `P/bytes-001.txt:1–4`, `P/metadata.json:1–300,1300–1339`, `G/common-compaction.md:1–38`. ASM complet : 42 instructions, chunk `[0x505C00,0x505C6E)`, 110 octets ; 13 blocs CFG. Le milieu de la liste des xrefs n'a pas été relu exhaustivement.
- Binaire déclaré : FF8_EN.exe 32 bits, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00` (`P/metadata.json:4–10`).
- Hashes **attestés par le parent / déclarés dans le manifeste, non recalculés ici** : manifeste `03705a61726c3dd316bc1c4618b0e6b621394330e4fa22a5593ea7b1113cd1a5` ; paquet original `a9a3657c00325a3d8641238ff73c3400f89c3dff920d3ffdb3a9291a5cde3d58` ; compaction `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.

## Rôle et confiance

**CERTAIN — mécanisme local :** filtre une requête DWORD pour un objet, retire son bit `0x1000`, puis choisit le traitement selon la présence du pointeur à `objet+0x8C`. Sans lien, appelle directement `0x505BC0(objet, requête_normalisée)`. Avec lien, appelle `0x506C10(0x505C70)` ; si le résultat est non nul, y inscrit l'objet et l'octet bas de la requête, puis parcourt les objets liés en effaçant conditionnellement un bit d'état WORD.

**UNCERTAIN — interprétation métier :** le contexte commun rattache ces objets à la représentation des acteurs de bataille. La requête peut concerner leur animation et le nœud une opération différée, mais les corps des helpers/callbacks nécessaires ne sont pas dans cette projection. Cette fonction ne prouve seule ni « démarrer une animation », ni le moment où le callback s'exécute, ni la signification métier du bit effacé.

**Nom proposé :** `Actor_DispatchRequestByLinkPresence`.

**Verdict du nom :** proposition descriptive conservatrice, mécanisme **CERTAIN**, qualification « Actor » appuyée par le contexte factuel commun. Deux preuves indépendantes du dispatch : appel direct avec les deux arguments à `0x505C61–68` ; autre voie passant une adresse de callback puis renseignant le nœud à `0x505C26–3A`. Le choix repose explicitement sur `objet+0x8C` à `0x505C19–24`. Le nom historique `BattlePresentation_StartActorAnimation` reste **UNCERTAIN**, non validé par son existence. Aucun renommage/promote n'est effectué.

## Entrées, sorties et effets

### ABI et entrées

- Deux slots de pile de 32 bits : premier argument pointeur `objet`, deuxième argument `requête` DWORD. Les octets à `0x505C01` et `0x505C0A` établissent les positions malgré les noms de paramètres IDA. Convention compatible cdecl : `RET` sans immédiat, nettoyage des arguments des helpers par l'appelant ; EBX et ESI sauvegardés/restaurés. Ce n'est pas l'authentification d'un prototype C historique.
- Test initial de **tout** le DWORD requête. Si zéro, retour sans déréférencer l'objet.
- Pour une requête non nulle, si `BYTE[objet+8] & 0x18` est non nul, le bit `requête & 0x1000` doit être présent ; sinon retour immédiat. Ce bit permet donc de franchir ce filtre local, sans preuve d'un « force » universel.
- Après franchissement, le bit `0x1000` est effacé dans EBX, tous les autres bits conservés. Aucun nouveau test de zéro après normalisation : `requête=0x1000` passe et devient zéro. Un DWORD non nul dont BL vaut zéro n'est pas rejeté à l'entrée.

### Voies et écritures locales

1. **`DWORD[objet+0x8C] == 0` :** appel de `0x505BC0` avec le pointeur et le DWORD normalisé complet ; pas de troncature générale en octet.
2. **Lien non nul :** passage de l'adresse littérale `0x505C70` à `0x506C10`. Si EAX est nul, aucune des écritures locales suivantes n'est exécutée ; les effets éventuels du helper ne sont pas connus.
3. **Résultat non nul :** écriture DWORD de l'objet à `résultat+0x0C`, écriture BYTE de BL à `résultat+0x15`. La partie haute de la requête n'est pas stockée par cette fonction dans ce nœud.
4. Parcours démarrant sur l'objet initial, puis suivant `DWORD[courant+0x8C]`. Pour chaque objet dont `BYTE[courant+0] & 0x02` est non nul, lecture du pointeur à `courant+0x74`, puis `WORD[état+0x2C] &= 0xFFBF` : effacement du seul bit `0x0040`, préservation des autres bits de ce WORD.
5. Arrêt si le prochain pointeur est nul ou égal à l'objet initial. Une auto-boucle traite l'objet une fois. Aucun détecteur de cycle général ni compteur : un cycle accessible ne revenant pas à la tête peut ne pas terminer. Les liens sont relus après le helper et pendant le parcours, pas capturés comme un tableau immuable.

La fonction n'accède directement à aucune globale absolue de données. Le helper `0x506C10`, le helper `0x505BC0` et un éventuel callback peuvent avoir des effets supplémentaires, non bornés ici. Pas de preuve locale d'écriture HP, de rendu, de chargement de ressources ou de synchronisation.

### Retours AL / AX / EAX

**Aucun contrat de résultat exploitable uniforme établi.** Aucun chemin ne fabrique un BOOL ou une valeur de succès commune :

- Requête nulle ou filtre rejeté : EAX n'a pas été écrit par la cible ; sa valeur d'entrée subsiste.
- Helper `0x506C10` retournant nul : EAX est nul au retour.
- Branche directe : EAX résiduel du helper `0x505BC0`.
- Branche avec nœud : EAX conserve le résultat de `0x506C10` si aucun objet éligible n'est rencontré ; sinon il contient le dernier pointeur d'état chargé à `0x505C49`.

AL et AX sont seulement les sous-parties de cet EAX résiduel, pas des retours spécialement définis. Une interface sans résultat significatif est compatible avec ces observations, mais doit être confirmée par les usages chez les appelants. Le test EAX après allocation n'est pas une preuve de retour BOOL de la cible.

### Largeurs, signedness, strides et préconditions

- Requête : bits de DWORD, tests zéro/masque, aucune comparaison signée. `TEST BH,0x10` et `AND BH,0xEF` portent sur le bit **12** du DWORD, pas le bit 4 de BL.
- États : masques BYTE `0x18` et `0x02`, puis opération **WORD** `0xFFBF`. Octets `66 21 50 2C` à `0x505C4C` confirment la largeur 16 bits de l'écriture indirecte.
- Pas de stride de tableau dans cette cible : `+0x8C` est l'offset d'un pointeur de chaînage, pas un pas d'itération. Le contexte commun identifie ailleurs un tableau de représentation de stride `0x9C` ; cela ne transforme pas ce parcours en boucle arithmétique, ni ne justifie le stride de domaine `0xD0` (`G/common-compaction.md:19–20`).
- Taille exacte des structures inconnue. Offsets observés : objet `+0`, `+8`, `+0x74`, `+0x8C` ; état indirect `+0x2C` WORD ; nœud retourné `+0x0C` DWORD, `+0x15` BYTE.
- Objet valide nécessaire dès qu'une requête non nulle atteint le filtre ; aucun test de nullité de l'objet. Les liens et le pointeur d'état des objets éligibles doivent être valides ; aucune vérification du pointeur `+0x74` avant écriture. Intégrité/aliasing des structures non établis.

## Huit preuves ASM / xrefs

1. **Argument DWORD et filtre :** `0x505C01–17`, `MOV EBX,[ESP+0xC]`, `TEST EBX,EBX`, tests BYTE `[ESI+8],0x18` et `BH,0x10` ; `P/asm-001.txt:2–10`, `P/bytes-001.txt:1`. Prouve les largeurs et le bit de contournement, non la nature « animation ».
2. **Sélecteur de voie et normalisation :** `0x505C19–24`, lecture `[ESI+0x8C]`, `AND BH,0xEF`, test du lien ; `P/asm-001.txt:11–14`. Le masque modifie EBX sans modifier EAX, utilisé pour le choix de voie.
3. **Appel direct et conservation de la largeur :** `0x505C61–68`, `PUSH EBX`, `PUSH ESI`, appel puis `ADD ESP,8` ; `P/asm-002.txt:11–14`. Les octets `E8 58 FF FF FF` donnent `0x505BC0` depuis l'adresse de retour `0x505C68` (`P/bytes-001.txt:4`). Preuve indépendante du dispatch direct.
4. **Callback littéral et retour nullable :** `0x505C26–35`, `PUSH 0x505C70`, appel `0x506C10`, test EAX ; `P/asm-001.txt:15–19`. `E8 E0 0F 00 00` depuis `0x505C30` donne `0x506C10` (`P/bytes-001.txt:2`) ; correspond à `P/metadata.json:1334–1336`, indépendamment des labels.
5. **Charge utile du nœud :** `0x505C37–3A`, `[EAX+0x0C]=ESI` et `[EAX+0x15]=BL` ; `P/asm-001.txt:20–21`. Prouve pointeur + identifiant octet stockés, distinctement du passage DWORD de la voie directe ; ne prouve pas quand le callback consomme ces champs.
6. **Effet précis sur état lié :** `0x505C44–4C`, test BYTE `[ESI],2`, chargement `[ESI+0x74]`, AND WORD `[EAX+0x2C],DX` avec EDX=`0xFFBF` ; `P/asm-001.txt:23–25`, `P/asm-002.txt:1–2`, `P/bytes-001.txt:3`. L'effet certain est l'effacement de `0x40`, pas « stopper toutes les animations ».
7. **Chaînage et terminaison :** `0x505C3D`, sauvegarde de la tête dans ECX ; `0x505C50–5C`, lecture du lien, égalité à la tête puis test null ; `P/asm-001.txt:22`, `P/asm-002.txt:3–7`. Deux formes de terminaison couvertes : liste null-terminée ou cycle revenant à la tête.
8. **Usage voisin du flag :** xrefs code depuis `0x50B69A` et `0x50BA94` (`P/metadata.json:223–227,241–245`). Le gel commun rapporte à ces sites `OR AH,0x10` puis passage du plein EAX (`G/common-compaction.md:29`). Ceci corrobore l'usage délibéré du bit `0x1000`, sans démontrer un type « animationId ». Les xrefs depuis `0x502453/0x5024B1` sont également présents (`P/metadata.json:108–120`). Corps des appelants non relus ici.

## Concordances, divergences et inconnues

- Pas de conflit mécanique constaté entre ASM, octets lus, cibles d'appels et compaction pour cette fonction. La vérification des cibles relatives et de l'opération WORD ci-dessus est manuelle ; elle n'est pas un recalcul des hashes ni une validation native du lead.
- Le label `animId` et le nom historique promettent une finalité plus précise que les instructions disponibles. Ce décalage est une limite de preuve, pas la preuve que les labels sont faux. De même, `au_re_BdLinkTask_0` ne suffit pas à certifier l'allocation, l'ordonnancement ou la durée de vie du nœud.
- La compaction dit que les helpers `0x505BC0` et `0x506C10` ont été inspectés par le lecteur factuel (`G/common-compaction.md:34`), mais n'en reproduit pas le comportement complet ; cela ne vaut pas inspection indépendante de leurs corps par cet auteur.
- Pour lever l'incertitude métier, complément de gel à demander au lead : corps/ABI de `0x505BC0`, `0x506C10` et `0x505C70`, consommateurs du nœud `+0x0C/+0x15`, lecteurs/écrivains de l'état `+0x2C` bit `0x40` et du filtre objet `+8` bits `0x18`.
- Pour établir un prototype de retour : instructions après les appels de la cible, notamment usages éventuels de AL/AX/EAX, et contrat réel des helpers. Aucun retour BOOL/int n'est validé ici.
- Restent ouverts : intégrité du chaînage, cycles non-tête, aliasing nœud/objet/état, mutabilité des liens par les helpers, existence d'une exécution différée, rôle du bit `0x02`, et effets indirects sur l'état global.

**Dépôt d'auteur uniquement : aucune promotion, écriture IDB, mutation Git/registre/live, ni §5.6 final.**
