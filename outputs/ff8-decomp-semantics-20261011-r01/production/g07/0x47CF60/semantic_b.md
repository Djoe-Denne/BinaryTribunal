# 0x47CF60 — analyse sémantique indépendante B

## Périmètre, sources et statut

- Mission `ff8-decomp-semantics-20261011-r01`, groupe g07, cible unique `0x47CF60`, volet sémantique B (2+1). Aucun C, review, score de classification ni livrable d'un autre auteur consulté.
- Sources utilisées : `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md` (63 lignes), puis `0x47CF60.readable/manifest.json`, `metadata.json`, **tous** les `asm-001.txt` à `asm-009.txt` et `bytes-001.txt` / `bytes-002.txt` du même répertoire.
- Gel : x86 32 bits, EXE SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`. Manifest : packet SHA256 `a502d16b154e08a955a468279c04dda5c926c4260a8b231a45a2bc2d45289fb2`, compaction SHA256 `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
- Couverture : 209 lignes/instructions ASM, chunk complet `[0x47CF60,0x47D285)`, deux retours, tous les blocs CFG de la projection examinés. Les hashes ci-dessus sont ceux du manifest, pas un recalcul local. Pas de compilation, test différentiel ou observation live effectué.
- Les anciens noms, commentaires LIVE/static et types IDA ne constituent pas mes preuves. Les références documentaires de la compaction restent du contexte antérieur avec leurs limites, non une nouvelle validation des callees.

## Conclusion et nom proposé

**Nom proposé : `BattleModule_RunFrame`. Confiance globale : LIKELY.**

- **CERTAIN, mécanique :** orchestrateur de callback avec préparation et clôture d'une scène, services répétés, progression conditionnée par un latch octet, installation conditionnelle d'un triplet de callbacks suivant, émission conditionnelle de listes et services de fin d'appel. Ce n'est pas simplement le corps de progression `0x47CCB0` : celui-ci est un appel conditionnel au milieu.
- **LIKELY, métier :** callback de frame du module de combat, regroupant orchestration rendu/UI/progression/pause et demande de transition. Le rattachement combat repose sur le contexte factuel commun g07 (notamment les relations documentées du directeur avec les routines voisines), pas sur `main::FFBattleModule` ou les noms de callees seuls.
- **UNCERTAIN :** notion exacte de « frame » vis-à-vis d'une présentation GPU réelle, signification exhaustive des modes 3/4, détail des services et transitions. Aucun appel de présentation n'est identifié de manière autonome par ce seul corps ; une fonction appelée pourrait avoir d'autres effets.

Deux familles de preuves indépendantes étayent le nom : (1) enveloppe scène et services graphiques autour du travail conditionnel, (2) orchestration de progression/pause et de callbacks successeurs. Les références entrantes sont compatibles avec une fonction installée comme callback, mais ne prouvent pas à elles seules son utilisation ni sa cadence.

## Contrat d'entrée, sortie et ABI

### Entrée et stockage local

- `0x47CF65`, opcode `8B 74 24 28`, charge le DWORD à `[ESP_initial+4]` dans ESI après `sub esp,0x1C; push ebx; push esi`. Un argument pointeur/contexte est donc effectivement lu. Le corps accède à ses DWORDs `+0xBA8` et `+0xB88`, sans contrôle de NULL ni de taille. Pas de prototype complet inventé.
- Appel compatible **cdecl** : argument conservé sur la pile du caller, retours `C3`, restauration d'EBX/ESI. Le corps réserve 28 octets et ne modifie pas directement EBP/EDI.
- EBX vaut zéro pendant le corps ; BL sert aux comparaisons et écritures octet. Cela suppose le respect de la convention de sauvegarde EBX/ESI par les callees, non une vérification de leur implémentation.
- Soit `L` le pointeur local calculé à `0x47CF87` (`ESP après prologue +8`). Avant l'appel `0x41E168`, écritures DWORD `L+0=0`, `L+4=0`, `L+8=0`, `L+12=0x3F800000`, puis arguments `(L, contexte)`. Les 12 octets restants ne sont pas initialisés ici. Le motif `0x3F800000` est certain ; son interprétation float 1.0 pour ce helper ne l'est pas sans contrat du callee.
- L'autre helper `0x41DFBA` reçoit, dans l'ordre logique cdecl, `(1,1,1,contexte)` ; nettoyage cumulé de ces deux appels : 24 octets à `0x47CFC4`.

### Sortie machine et absence de résultat métier prouvé

- Aucun chemin ne fabrique un Boolean, code de succès ou résultat de combat final.
- Retour précoce `0x47D0D2` : EAX n'est pas réécrit après l'appel `0x41E99D` à `0x47D0C5`. Il expose ce que ce callee laisse dans EAX, sans garantie de valeur utile ni de largeur de retour.
- Retour normal `0x47D284` : EAX n'est pas réécrit après l'appel réel **`0x46BD10`** à `0x47D277`. Même réserve sur sa valeur et largeur. Les restaurations de pile/registres ne constituent pas une valeur de retour.
- Les tests après `0x41E972`, `0x4A71D0` et `0x45B2E0` portent sur **EAX entier**, pas AL. Le DWORD retourné par `0x4020F0` est conservé intégralement dans `0x1CFF844`.
- Les charges de pause portent sur **AL seulement** ; le reste d'EAX est conservé et ne doit pas être interprété comme le flag. À `0x47D122`, au contraire, `xor eax,eax` précède la charge AL de l'index : l'index est exactement zéro-étendu de 8 à 32 bits.

## Effets et déroulement complets

### 1. Préparation et gate de scène (`0x47CF60–0x47D000`)

Si le DWORD contexte `+0xBA8` vaut zéro, appel `0x45B4C0` avec `(0,0,640,480)`. Après les deux helpers locaux, ce DWORD est **relu**, donc pas de cache à substituer : s'il reste zéro, le même callee reçoit les quatre DWORDs `(X,Y,largeur,hauteur)` lus respectivement aux VA `0x1A7764C`, `0x1A77648`, `0x1A77654`, `0x1A77650`.

Appel `0x41E972(0,contexte)` ; EAX nul saute directement à `0x47D243`. Dans ce cas, ni services centraux ni appel de clôture `0x41E99D` ne sont exécutés, mais le tail input/pacing/x87 existe toujours.

### 2. Services initiaux et choix pause/rattrapage (`0x47D000–0x47D10A`)

Après gate réussi : appels `0x416B9A` avec le DWORD `0x1D2A284`, `0x424BF9` avec `0x1D2A288`, puis `0x49B120`, `0x499A40`, puis quatre appels recevant le contexte : `0x43FBE8`, `0x409B42`, `0x409B08`, `0x409B25`. Nettoyage cumulé de six arguments DWORD à `0x47D039`. Puis `0x56BA40`.

Si l'octet `0x1D28DEA != 0` et le test EAX du callee `0x4A71D0` est non nul : écritures DWORD `0x1CFF834=1`, `0x1CFF844=0`, puis DWORD contexte `+0xB88=1` et appel `0x45B580`. Ce chemin ne met **pas immédiatement** l'octet `0x1D28DE9` à 1.

Sinon : écrit **BYTE** `0x1D28DE9=0` ; si la requête DWORD `0x1CFF834` est non nulle, appelle `0x5003A0`. Ensuite lit `0x1CFF844`, écrit DWORD `0x1CFF834=0`, puis, selon le DWORD précédemment lu, met contexte `+0xB88=1` / appelle `0x45B580`, ou met `+0xB88=0` / appelle `0x45B590`. Le dernier chemin rejoint les services communs et ne sort pas de la fonction.

Les appellations pause/sleep sont une interprétation LIKELY ; les dépendances à ces octets/DWORDs et l'ordre de lecture/écriture sont CERTAIN. En particulier, requête DWORD et latch BYTE sont deux cellules distinctes.

### 3. Pulses communs et sortie précoce (`0x47D076–0x47D0D3`)

Quatre appels consécutifs à `0x4701B0` sont exécutés pour tout gate de scène réussi, y compris avant la sortie précoce ultérieure. Pas d'incrément de temps démontré dans ce corps : cette description nécessiterait la preuve callee.

Si le WORD `0x1CDBFE0 == 3`, appel `0x4A76E0(0)` puis exactement trois paires `0x4A8E30(); 0x4A84E0()`. Le contexte commun relie ces services à la cible HUD, mais le corps seul ne prouve ni absence de rendu ni effets ATB internes.

Appel `0x45B2E0` ; si EAX non nul : `0x41E99D(contexte)`, restauration et retour `0x47D0D2`. Ce chemin saute progression, transition et **tout** tail input/pacing/volume. « Fenêtre inactive » est l'interprétation de contexte, non une conséquence intrinsèque de TEST/JZ.

### 4. Progression et pulse post-progression (`0x47D10A–0x47D150`)

Lecture BYTE `0x1D28DE9`. **Seulement si zéro**, appel `0x47CCB0`. La requête DWORD `0x1CFF834` n'est pas le gate de cet appel. Une première demande de pause peut donc laisser cet appel se produire avec l'ancien latch zéro ; une dé-pause empruntant la branche de reset efface le latch avant ce gate.

Relit le WORD de mode `0x1CDBFE0` après cet appel éventuel. S'il vaut 3, calcule `0x1D969C8 + 0x5C * zero_extend(BYTE[0x1D96A80])`, appelle `0x4A76E0` avec ce pointeur puis une paire `0x4A8E30/0x4A84E0` et `0x4A78E0`. Le mode peut avoir changé entre les tests pré/post ; ne pas promettre quatre paires au total sans cette condition. L'index n'est pas borné à 0/1 par ce corps.

### 5. Successeur conditionnel, sans retour immédiat (`0x47D150–0x47D1AA`)

Si DWORD `0x1CFF830 != 0`, construit dans le même stockage L un triplet DWORD :

| Condition sur le WORD mode relu | L+8 | L+12 | L+16 |
|---|---|---|---|
| `==4` | `0x4A2280` | `0x4A22A0` | `0x4A2690` |
| sinon | `0x470690` | `0x4706A0` | `0x4706B0` |

Écrit aussi `L+20=0` et `L+24=0`, puis appelle `0x409A57(L,contexte)`. Les cellules L+0/L+4 ne sont pas réinitialisées à ce point ; le premier helper a reçu L et peut l'avoir modifié. Les callbacks ne sont pas exécutés directement ici. Ce chemin **continue** à `0x47D1AA`, sans nettoyage de combat explicite ni retour immédiat. « Écran de récompense » versus « module principal » reste une identification métier des destinations, non déductible des seules constantes d'adresse.

### 6. Travail dépendant du latch et soumission (`0x47D1AA–0x47D243`)

Relit le BYTE `0x1D28DE9` (ne pas réutiliser sa valeur d'avant les callees) :

- Zéro : lit DWORD `0x1CFF6F4`. Si non nul, appelle `0x56D1D0(X,Y,largeur,hauteur,0x3AC49BA6,flag)` avec `flag = (valeur_lue == 2)`, puis écrit DWORD `0x1CFF6F4=0`. Ensuite appelle `0x56BA80` dans tous les cas de ce bras. Motif d'overlay ponctuel LIKELY ; format float/couleur non prouvé par les arguments seuls.
- Non zéro : appelle `0x45D610(0xFFFFFFFF)` ; pas de test signé de cet argument, pas de lecture de `0x1CFF6F4` dans ce bras.

Ensuite si DWORD `0x1CFF834 != 0`, écrit BYTE `0x1D28DE9=1`. S'il vaut zéro, aucune écriture symétrique zéro n'a lieu à ce point : l'effacement est plus tôt dans la branche de reset.

Si DWORD `0x1CFF844 == 0` : appels ordonnés `0x4980C0`, `0x465930`, `0x41E947(1,contexte)`, `0x499EA0`. Sinon ce groupe est sauté. Appels communs `0x45B450`, puis `0x41E99D(contexte)`. Soumission/target/clôture sont LIKELY d'après le contexte rendu ; le détail des listes et drivers reste externe.

### 7. Tail commun au chemin normal et à l'échec begin (`0x47D243–0x47D285`)

Appelle `0x56D9C0`. Si DWORD `0xB6D970 != 0` **et** DWORD `0x1CFF834 == 0`, appelle `0x4020F0` et écrit son EAX entier dans `0x1CFF844`. Sinon écrit DWORD `0x1CFF844=0`. Ce résultat est écrit après les tests centraux : il alimente potentiellement l'appel suivant, pas rétroactivement les appels déjà faits. Aucune normalisation à 0/1 n'est présente.

`FLD m64real` à `0x47D26B` lit **VA `0x1A78BE0`**, pousse une valeur x87 ; appel `0x55AD90`, puis PUSH EAX et appel **`0x46BD10`**. Le sens temporel/audio est une hypothèse de contexte. Ni valeur entière convertie précise, ni rounding/troncature, ni consommation exacte de la pile x87 ne sont prouvés sans le helper : état de contrôle x87, pile disponible et exceptions non fournis. Ne pas remplacer cela par un cast C implicitement équivalent.

## Largeurs, signedness, strides et alias

- Aucun ordre signé/unsigned (`JL/JG/JA`, etc.) dans les tests de ce corps : comparaisons d'égalité/nullité et `SETZ`. Mode lu en WORD, les trois cellules pause/éligibilité/index en BYTE, contexte et autres flags en DWORD. Les `PUSH` d'arguments ont une largeur de 32 bits, même les sentinelles.
- Stride directement prouvé : `3*index`, `<<3`, `-index`, `*4` = **92 (`0x5C`) octets**. Index zéro-étendu octet ; pas de stride d'acteur `0xD0` utilisé dans cette cible, pas de loop de slots à extrapoler depuis les voisins.
- LEA/SHL/SUB travaillent en 32 bits ; les adresses sont x86 modulo 2^32. Pour l'index admissible par largeur 0..255, ce calcul local n'overflowe pas, sans que cela prouve la validité du stockage adressé.
- Lire le latch à `0x47D10A` et `0x47D1AA`, relire le mode et les flags après les callees est significatif. Callees et contexte peuvent aliaser les globals ; aucune pureté ni immutabilité imposée. Les globals de pacing/pause peuvent aussi être modifiés par les services intermédiaires.
- `MOV AL,[...]` ne zéro-étend pas EAX ; `SETZ CL` produit ici 0/1 entier grâce au `XOR ECX,ECX` précédent. Ni AL ni AX n'est un résultat final normalisé de cette fonction.

## Huit ensembles de preuves indépendamment vérifiables

Chemins ci-dessous relatifs à `inputs/ff8-decomp-semantics-20261011-r01/g07/0x47CF60.readable/`.

1. **ABI et enveloppe** — `asm-001.txt:1-21`, `asm-002.txt:16-21`, `asm-009.txt:5-9` ; VA `47CF65`, `47CFF0/47CFF8`, `47D27F–284`. Opérations argument/contexte, setup, gate EAX et épilogue, indépendantes du nom ancien.
2. **Services répétés de mode** — `asm-003.txt:23-25`, `asm-004.txt:1-14`, `asm-005.txt:16-25`, `asm-006.txt:1-4` ; VA `47D076–085`, `47D08A`, `47D118–146`. Quatre services communs, trois paires pré et une post, stride 0x5C de la cible post.
3. **Pause requête versus latch** — `asm-003.txt:15-23`, `asm-004.txt:25`, `asm-005.txt:1-15`, `asm-008.txt:1-4` ; VA `47D057/061`, `47D0D3/0EC`, `47D10A/113`, `47D204/20C`. Écritures BYTE/DWORD distinctes, gate puis latch tardif.
4. **Sortie précoce distincte** — `asm-004.txt:15-24`, `metadata.json:96-107` ; VA `47D0BB–D0D2`. Test EAX, un appel de leave et RET qui bypassent tous les services de tail.
5. **Triplet de successeur** — `asm-006.txt:5-22`, `bytes-001.txt:16-19` ; VA `47D150–1A7`. Trois adresses alternatives et deux champs nuls passés à `0x409A57`, poursuite du corps : transition demandée, pas boucle de directeur seule.
6. **Bras rendu et clôture** — `asm-007.txt:1-25`, `asm-008.txt:1-15` ; VA `47D1AA–240`. Overlay non nul/flag égal 2, clear après appel, bras sentinelle -1 et services sous gate sleep, leave séparé.
7. **Tail pacing/x87 et divergence symboles/bytes** — `asm-008.txt:16-25`, `asm-009.txt:1-9`, **`bytes-002.txt:4-6`** ; VA `47D243–284`. `DD 05 E0 8B A7 01` donne FLD `[1A78BE0]`, et `E8 94 EA FE FF` à `47D277` donne `46BD10`, pas `46BB10`. Le nom ASM finissant `1A788B8` n'identifie pas l'adresse réelle du double.
8. **Entrantes non-call** — `metadata.json:315-327` : `4709EC` dans `4706B0` et `5598DD` dans `559890`, type 1, `iscode:false`. Ce sont des références entrantes documentées, pas deux calls directs. Elles soutiennent seulement l'hypothèse d'installation de callback. `common-compaction.md:33-36` distingue déjà owner et directeur et rappelle les preuves documentaires antérieures sans transformer leurs noms en preuve.

## Divergences et questions ouvertes

1. **CONFLICT de présentation source, mécanique résolue par bytes :** destination `47D277` = `46BD10`, alors que le label ASM contient `46BB10` ; `metadata.json:350` corrobore `46BD10`. L'interprétation de ce callee comme boucle audio exige son gel, pas une correction de nom extrapolée.
2. **CONFLICT de nom de donnée, mécanique résolue :** FLD adresse `1A78BE0`, malgré le suffixe `1A788B8` du nom ASM. Faut-il un symbole canonique, quelle unité et quelle politique de conversion x87 ? Pas de nom proposé pour cette donnée sans preuve supplémentaire.
3. Quel contrat exact des helpers `41E168`, `41DFBA`, `41E972`, `41E99D`, `409A57` ? Le premier peut-il réécrire L+0/L+4 ? Leurs retours sont-ils réellement DWORD, AL-only ou void ? Le TEST EAX impose seulement ce que ce caller observe.
4. Quel callee réalise effectivement le present, la progression, les effets HUD et l'émission de paquets ? Aucun détail interne ne doit être promu depuis les seuls labels ou commentaires.
5. Cadence garantie du callback, callback set dans les modules, validité de contexte `+BA8/+B88` et borne réelle de l'index 8 bits ? Deux xrefs de données ne répondent pas à ces questions.
6. Sens exact des modes 3/4 et callbacks `4A2280/4A22A0/4A2690` vs `470690/4706A0/4706B0`, ainsi que persistances de pause entre callbacks ? Les égalités, destinations et écritures sont établies, pas l'intégralité de la machine à états.
7. La compaction documente des validations historiques de rendu et des observations LIVE ; elles sont utiles comme contexte, mais n'ont pas été reproduites. Ma confiance métier reste LIKELY et ne vaut ni promotion ni §5.6 final.

**Limite de livraison :** analyse statique indépendante complète du corps gelé, pas validation de ses callees, pas reconstruction C, pas mutation IDB/Git/registre et pas fermeture superviseur.
