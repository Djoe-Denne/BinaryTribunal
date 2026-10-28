# 0x502380 — sémantique A indépendante

## Contrat et provenance

- Mission run01, groupe g17, tâche `task_mv44sepy_00b4_tidpra`, volet sémantique A, protocole 2+1. Aucun C, pair, review ou verdict futur consulté.
- Modèle admis : `openai/gpt-6-astra`, variante `medium`, confirmé par le lead comme égal à `model_routing.selected`, `model_override=0`. La mention historique Sol high du dispatch ne constitue pas l'override actif.
- Sources effectivement lues : `inputs/ff8-decomp-semantics-20261011-r01/g17/common-compaction.md` (38 lignes), puis `0x502380.readable/manifest.json`, `metadata.json`, les dix `asm-001.txt` à `asm-010.txt` et les deux `bytes-001.txt`/`bytes-002.txt` dans ce même groupe. Tous les 243 items ASM et tous les octets projetés du chunk `[0x502380,0x502628)` ont été lus. Aucun accès direct aux chemins historiques `.tmp` cités par la compaction dans ce volet.
- Hash du packet déclaré par le manifeste : `1955590faeb8479a4a74ef892a9aff80681522f6abb4285ebd55f725551fff09`. Hash compaction déclaré : `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`. Vérification SHA256 rapportée PASS par le lead, non recalculée ici. Binaire 32 bits ; export du 2026-10-11T16:38:25.140966+00:00, SHA256 EXE `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

## Rôle et nom proposé

**Nom proposé : `BattlePresentation_DispatchCommand` — LIKELY.**

Interprétation : répartiteur d'une commande du système de présentation de combat. Selon un sélecteur WORD du record reçu, il lance un traitement par callback avec conservation du record, délègue à un autre répartiteur, ou modifie/demande la modification de l'état d'acteurs. Ce n'est pas, à lui seul, une boucle de consommation de queue : aucune progression de curseur ou itération sur des commandes n'est visible.

Le caractère **dispatch** est CERTAIN (preuve 1). Le caractère **commande avec traitement différé** est LIKELY, appuyé indépendamment par les callbacks et le record conservé (preuve 2). Le rattachement **présentation/acteurs** est LIKELY grâce aux accès à l'ensemble à stride 0x9C et aux appels des voisins documentés dans le gel (preuves 3, 6 et 8). Aucun ancien nom n'est utilisé comme preuve. Le vocabulaire métier exact des sélecteurs et le sens scheduler des retours restent UNCERTAIN. La correspondance complète sélecteur→branche est désormais CERTAIN grâce au supplément factuel v1 détaillé plus bas.

## Entrées, sorties et effets mécaniques

- Un argument pointeur sur pile, récupéré à `0x502382` ; EBX, ESI, EDI sauvegardés/restaurés ; `RET` sans immédiat. Convention à nettoyage appelant compatible cdecl, sans prototype source authentifié. Xref unique fourni : appel `0x500D29`, fonction `0x500CC0` (`metadata.json:259–265`) ; son corps n'est pas fourni.
- Record : WORD sélecteur à `+2`, pointeur à `+4` dans une branche, WORD signé à `+8` souvent utilisé comme index ; `+0A` est selon branche WORD signé ou BYTE de shift, `+0B` BYTE testé zéro/non-zéro. Ces usages alternatifs ne prouvent pas une structure uniforme sans union.
- Sélecteur : extension signée en EAX, soustraction 0x66, comparaison **non signée** à 0x11. Seuls les WORD 0x66..0x77 passent le garde ; tout autre WORD aboutit au retour EAX=15. Le tableau à `0x502628`, absent du chunk initial, est couvert intégralement par le supplément v1 : associations opcode/branche établies depuis les octets, non depuis les commentaires IDA.
- Index d'acteur : `base 0x1D972C0 + 0x9C * sign_extend16(record+8)`, calcul 32 bits sans borne locale. Ne pas le confondre avec l'autre tableau de domaine à stride 0xD0 cité par la compaction. Deux boucles portent précisément sur trois records aux indices 0,1,2, pas sur une taille universelle du tableau.
- Retours écrits en **EAX complet**, pas seulement AL/AX : 8 pour les branches qui conservent le record dans le nœud retourné par `0x500DD0` ; 15 pour les branches immédiates et le défaut. Les chemins `0x5023D0` et `0x5024C2` rendent EAX de `0x50A790` et `0x5085D0` sans le remplacer : domaine de valeurs inconnu. Interpréter 8 comme « attente/enfant » et 15 comme « terminé » serait une hypothèse de protocole, non un fait démontré par le caller gelé.
- Effets directs : écritures dans les nœuds `+0x10` et parfois BYTE `+0x0D` ; OR 0x10 dans le WORD de tête d'un acteur ; mise/effacement du bit 0x01000000 dans DWORD acteur+8 pour certains records. Pas d'écriture directe au record d'entrée identifiée, mais il est transmis aux helpers et conservé : aucune garantie d'immuabilité ou de durée de vie indépendante.
- Effets indirects via les dix cibles d'appel : allocation/enregistrement probable de callback, mises à jour d'état, lancement/changement probable d'animation et délégation. Leur étendue complète n'est pas attestée. Les nœuds retournés par `0x500DD0` sont déréférencés sans test NULL local.

## Huit preuves ASM/xref indépendantes et couverture des branches

Les chemins abrégés ci-dessous sont relatifs à `inputs/ff8-decomp-semantics-20261011-r01/g17/0x502380.readable/`. Les commentaires après point-virgule sont ignorés comme preuve.

1. **Sélection bornée et dispatch indirect.** `asm-001.txt:3–10`, `0x502382–0x50239A` : lecture `[esi+2]`, `MOVSX EAX,CX`, `ADD EAX,FFFFFF9A`, `CMP EAX,11h`, `JA`, saut `[0x502628+eax*4]`. `bytes-001.txt:1–2` authentifie la base de table. `metadata.json:11–42` rapporte les successeurs. Le complément `../0x502380.supplemental-v1/table.json:8` apporte les 18 entrées brutes et permet la dérivation indépendante présentée ci-dessous. Justifie « Dispatch » et désormais toutes ses destinations, sans recours aux associations numérotées des commentaires.

2. **Callbacks et payload conservé, statut 8.** `asm-001.txt:11–20`, `asm-002.txt:19–25`, `asm-003.txt:1–5`, `asm-007.txt:14–25`, `asm-008.txt:1–9` : appels `0x500DD0` avec littéraux callback `0x502670`, `0x502ED0`, `0x502F90`, `0x502F30`, `0x503040`; stockage du pointeur d'entrée à `[eax+10h]`, puis EAX=8. BYTE `[eax+0Dh]=0` seulement pour les trois premiers callbacks ; aucun zéro explicite dans le chemin partagé `0x50256E`. Adresses confirmables dans `bytes-001.txt:2,5,15–16`. L'enregistrement probable de travail différé est distinct de l'affirmation non prouvée « tel callback traite l'évasion/la musique ».

3. **Acteur indexé, garde et flag local.** `asm-002.txt:11–25`, `0x5023DD–0x502415` : index signé, multiplication par 156 via `(5*i<<3)-i`, puis échelle 4 ; lecture WORD base, test AL bit 2, défaut EAX=15 si absent ; sinon OR AL,0x10, écriture WORD et callback. Cette branche prouve une mutation locale d'état d'acteur indépendamment du nom du helper.

4. **Délégation et retour non uniformisé.** `asm-001.txt:21–25`/`asm-002.txt:1–10` et `asm-005.txt:15–21` : `0x5027D0(input)` suivi d'EAX=15, versus `0x50A790(input)` et `0x5085D0(input)` suivis de restauration/RET sans assignation EAX. Les E8 des `bytes-001.txt:3,11` distinguent les vraies cibles des labels historiques. Un type BOOL ou un enum strictement {8,15} ne couvre pas la mécanique observée.

5. **Traitement collectif symétrique, trois records.** `asm-005.txt:22–25`, `asm-006.txt:1–25`, `asm-007.txt:1–13`, `0x5024CF–0x502544` : pointeur initial `0x1D972C8`, pas 0x9C, fin `0x1D9749C`, `JL` signé. Si BYTE acteur+0 bit 2 : appel `0x503190(index,0x18,1)` ou `(index,0x18,0)` ; sinon OR `0x01000000` ou AND `0xFEFFFFFF` à acteur+8. L'immédiat ambigu étiqueté `VIT_0_STATUS_MASK?` vaut bien 0x01000000 (`bytes-001.txt:12`, octets `81 0E 00 00 00 01`). Deux autres branches appellent `0x503190(sign_extend16(input+8),0x17,1/0)` (`asm-004.txt:3–24`). Aucun nom de statut métier n'est prouvé.

6. **Mise à jour d'un acteur et paramètres d'animation probables.** `asm-003.txt:6–25` : `0x509CD0(actor,0)`, relecture de l'index après cet appel, puis `0x505C00(actor,3)` ; `asm-004.txt:25`/`asm-005.txt:1–14` : `0x505C00(actor,sign_extend16(input+0A))`. EAX=15 ensuite. Compaction `:25` décrit indépendamment la mécanique du voisin 0x505C00 (callback, actor+8C, paramètres parfois DWORD et parfois BL) : raison de garder la largeur DWORD et de ne pas inférer une simple entrée BYTE.

7. **Payload indirect et piège AX/EAX.** `asm-008.txt:10–25`/`asm-009.txt:1–4`, `0x502582–0x5025BB` : EAX contient l'index signé ; ESI devient `[input+4]` ; EDX lit `[ESI+0Ch]` ; `MOV AX,[ESI+82h]` ne remplace que les 16 bits bas. `PUSH EAX` transmet donc les 16 bits hauts issus de l'index signé, et non une extension à zéro arbitraire du WORD. Appel `0x50A070(actor,EAX,EDX)`, puis `0x509C80(actor)`, puis EAX=15. Adresses/opérandes visibles dans `bytes-001.txt:17–18`.

8. **Transformation d'un masque puis synchronisation probable.** `asm-009.txt:5–25` et `asm-010.txt:1–18`, `0x5025BC–0x502627` : état initial DWORD acteur+8 chargé dans EDI ; test CX==0x76 ; construction `1 << (BYTE(input+0A) & 31)` selon les règles SHL x86 ; appel `0x509BA0(bit,0)` si égal, sinon `(0,bit)`. Masque EAX rendu par ce helper : EDI devient `(ancien & ~masque)`, puis OR masque si BYTE input+0B non nul ; passage à `0x509CD0(actor,EDI)`, appel `0x509C80(actor)`, EAX=15. Le gel voisin (`common-compaction.md:26`) situe 0x509C80 sur actor+74 et une comparaison de classe, sans authentifier toute sa sémantique métier. La lecture de l'ancien état avant les helpers est significative si ceux-ci modifient l'acteur.

## Confiance, divergences et questions ouvertes

- **CERTAIN** : mécanique du chunk et largeurs décrites ci-dessus, dispatch gardé, retours explicites EAX, stride 0x9C, loops de trois records et effets directs.
- **LIKELY** : répartiteur de commandes de présentation de combat et enregistrement de travail différé ; nom proposé volontairement moins spécifique que les anciens noms de callbacks.
- **UNCERTAIN** : noms métier des opérations, bits de statut, signification contractuelle des retours, effet intégral des helpers. Pas de conclusion « présentation uniquement/sans effet sur le domaine ». L'incertitude opcode→branche initiale est levée par le supplément v1, sans lever ces autres limites.
- **CONFLICT documentaire** : annotation d'entrée « 0x64..0x77 » contre garde natif 0x66..0x77. L'ASM/bytes tranche pour ce dernier. L'annotation du saut attribue également à une commande un callback alors que 0x70 appelle directement 0x5085D0 ; ne pas confondre ce label avec l'appel attesté ni supposer une allocation locale. Aucun conflit entre bytes et instructions retenues n'a été identifié ; les associations numérotées IDA concordent avec la table fournie, mais celle-ci constitue la preuve indépendante.
- Compléments restant utiles au lead : caller 0x500CC0 autour de 0x500D29 pour le contrat des statuts ; helpers 0x500DD0/0x503190/0x5085D0/0x509BA0/0x509CD0/0x50A070/0x50A790 et callbacks pour les effets exacts. La demande de gel des 18 DWORD à `0x502628..0x50266F` est satisfaite. Ne pas déduire de prototype depuis les noms des helpers.
- À éclaircir : contraintes sur les indices négatifs/hors plage ; lifetime du record conservé ; garantie non-NULL du créateur de nœud ; initialisation de +0D sur les branches sans store ; sens et espace des deux masques passés à 0x509BA0 ; portée des mutations indirectes et aliasing des pointeurs.

## Addendum — supplément factuel commun v1, couverture exhaustive du dispatch

Révision du même livrable A, même tâche, après GO borné du lead. Lectures supplémentaires exclusivement dans `inputs/ff8-decomp-semantics-20261011-r01/g17/0x502380.supplemental-v1/` : `manifest.json:1–29`, `table.json:1–101`, `provenance.json:1–31`, `dispatch.txt:1–10`.

- Version 1 ; hash du manifeste communiqué par le lead : `0c2eb97f4f4383e93d478b3faf532024b03cea2fea4aaff0315424b8997cc861`.
- SHA256 des **72 octets de table** : `c0e337fcad03168079cbd7575dc3582d1631773094eaba3ff071cbf08e327bf0`. À distinguer du hash du **fichier JSON** déclaré dans le manifeste : `61ca1118a8789ad29c5a57af70859f5c391a8b65266385da5415a1bb27d35a9c`.
- Capture statique `2026-10-12T16:38:11.584995+00:00` ; `provenance.json:10–28` rapporte corps original==IDB==PE et table IDB==PE sur l'EXE authentifié déjà cité. Aucun contrôle live ou accès IDB effectué par cet auteur ; hashes et égalités de provenance rapportés, non recalculés localement.

**Redérivation :** `66 8B 4E 02` charge le WORD dans CX ; `0F BF C1` l'étend avec signe ; `83 C0 9A` ajoute l'immédiat signé -102. On obtient `index = (sign_extend16(selector) - 0x66) modulo 2^32`. `83 F8 11` puis `0F 87` rejettent index **unsigned >17** vers `0x50261F`. Les valeurs négatives et les positifs inférieurs à 0x66 sont donc rejetés, pas employés comme indices négatifs. `FF 24 85 28 26 50 00` lit la destination DWORD à `0x502628 + 4*index`. Les 18 groupes de quatre octets du champ hex (`table.json:8`) sont décodés little-endian ci-dessous ; les champs `entries` servent seulement à constater leur concordance.

| Index | Sélecteur WORD | Octets LE au slot | Destination | Effet mécanique de la branche / retour EAX |
|---:|---:|---|---|---|
| 0 | 0x66 | A1 23 50 00 | 0x5023A1 | Callback 0x502670 via 0x500DD0, conserve input à node+10, zéro node+0D ; 8 |
| 1 | 0x67 | BE 23 50 00 | 0x5023BE | 0x5027D0(input) ; 15 |
| 2 | 0x68 | D0 23 50 00 | 0x5023D0 | 0x50A790(input) ; EAX propagé |
| 3 | 0x69 | DD 23 50 00 | 0x5023DD | Test acteur bit 2 ; absent : 15 ; présent : OR bit 0x10, callback 0x502ED0, conserve input/zéro node+0D ; 8 |
| 4 | 0x6A | 22 24 50 00 | 0x502422 | 0x509CD0(actor,0), relecture index, 0x505C00(actor,3) ; 15 |
| 5 | 0x6B | 1F 26 50 00 | 0x50261F | Même bloc que défaut, aucun helper ; 15 |
| 6 | 0x6C | CF 24 50 00 | 0x5024CF | Trois acteurs : 0x503190(i,0x18,1) si bit 2, sinon OR acteur+8 avec 0x01000000 ; 15 |
| 7 | 0x6D | 0A 25 50 00 | 0x50250A | Trois acteurs : 0x503190(i,0x18,0) si bit 2, sinon AND acteur+8 avec 0xFEFFFFFF ; 15 |
| 8 | 0x6E | 64 24 50 00 | 0x502464 | 0x503190(index signé,0x17,1) ; 15 |
| 9 | 0x6F | 98 24 50 00 | 0x502498 | 0x505C00(actor,WORD signé input+0A) ; 15 |
| 10 | 0x70 | C2 24 50 00 | 0x5024C2 | 0x5085D0(input) ; EAX propagé |
| 11 | 0x71 | 62 25 50 00 | 0x502562 | Callback 0x502F30 via 0x500DD0, conserve input, pas de zéro node+0D explicite ; 8 |
| 12 | 0x72 | 7E 24 50 00 | 0x50247E | 0x503190(index signé,0x17,0) ; 15 |
| 13 | 0x73 | 69 25 50 00 | 0x502569 | Callback 0x503040 via 0x500DD0, conserve input, pas de zéro node+0D explicite ; 8 |
| 14 | 0x74 | 45 25 50 00 | 0x502545 | Callback 0x502F90 via 0x500DD0, conserve input/zéro node+0D ; 8 |
| 15 | 0x75 | 82 25 50 00 | 0x502582 | Payload pointé par input+4, AX partiel puis argument EAX à 0x50A070, 0x509C80 ; 15 |
| 16 | 0x76 | BC 25 50 00 | 0x5025BC | Branche CX==0x76 : 0x509BA0(bit,0), masque appliqué à ancien acteur+8, 0x509CD0 puis 0x509C80 ; 15 |
| 17 | 0x77 | BC 25 50 00 | 0x5025BC | Branche CX!=0x76 : 0x509BA0(0,bit), même suite ; 15 |
| Hors 0..17 | Tout autre WORD | Aucun slot lu | 0x50261F | Défaut direct, aucun helper ; 15 |

Dans les deux dernières branches, `bit = 1 << (input[0x0A] & 31)` et l'application du masque est commandée par input[0x0B] non nul, comme décrit en preuve 8. Le partage de destination pour 0x76/0x77 ne rend donc pas leurs paramètres identiques. Le défaut couvre également 0x64/0x65 et tous les WORD à bit de signe positionné. Les 18 indices donnent 17 destinations distinctes, dont une égale au défaut ; aucune destination ne sort du chunk de corps gelé. Ce supplément lève seulement la lacune de couverture de la table, sans attribuer de nouvelle signification métier aux branches ni de contrat aux helpers.

Livrable analytique A seulement : aucune promotion, aucun §5.6 final, aucune mutation IDB/Git/registre/live.
