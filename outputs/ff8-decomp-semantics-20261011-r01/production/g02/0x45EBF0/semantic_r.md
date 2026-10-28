# 0x45EBF0 — réconciliation sémantique R

## Autorité, provenance et couverture

Mission `ff8-decomp-semantics-20261011-r01`, g02, **volet sémantique exclusivement**, tâche `task_mv44nt8z_005z_4x52yx`. Aucun livrable C ni autre volet/session consulté. Ce document est le contrat sémantique final offline, pas une promotion native §5.6.

Projection lue : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x45EBF0/semantic/` (ci-dessous `P/`). Lecture intégrale des deux candidats, de la compaction, des manifestes, des 958 lignes de métadonnées et des 966 lignes du paquet original. Sa ligne ASM monolithique dépasse le plafond d'affichage de `read` ; **les cinq slices verbatim ont fourni intégralement ses 116 instructions**, sans dépendre de cette ligne tronquée. Les 17 slices bytes et le hex du chunk original couvrent les **541 octets**, `[0x45EBF0,0x45EE0D)`. Les **22 blocs CFG** et tous les xrefs exportés ont été examinés.

| Auteur gelé | Session indépendante déclarée | Model.Ref déclaré | SHA-256 déclaré du candidat |
|---|---|---|---|
| A | `ses_ed3e18d85ffeQ3Fk95CdMbuXnt` | `openai/gpt-6.1-sol`, high | `b5c61782f6c95128656ee12aae6f17db2564d0352a015631cf0fd619ea543960` |
| B | `ses_ed3e18a67ffejF9GVEmVGyZIXY` | `openai/gpt-6.1-sol`, high | `7e255cd9d0f57078941d7271fccba16dc984a7d6146cac01eab8bd423ce9996d` |

Identité native déclarée : PE32 FF8_EN.exe, SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`. SHA-256 paquet `dd7611f37d54d96d1f3d3fdcb221a43aac2e371f1006d9733df00a1273427c4e`, compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. Ces identités concordent entre manifestes et candidats ; les hashes des slices concordent entre les deux manifestes. **Hashes non recalculés** : aucun accès brut/hachage de fichier autorisé disponible ; le parent conserve le contrôle cryptographique et le hash de sortie. Aucun auteur manquant ni incohérence déclarative constatée. Deux sessions du même modèle ne constituent pas une diversité de modèles.

## Verdict et nom final

**Nom proposé : `GlobalTriple_AccumulateScaledS16_ClampAndPackU8FIFO`.**

**CERTAIN — contrat mécanique borné au gel :** primitive leaf à état global qui décale deux anciens DWORDs de file, copie un octet auxiliaire dans le nouveau DWORD, forme trois produits x87 à sources s16 et facteur commun, convertit par magasin flottant/lecture de bits, accumule dans trois DWORDs avec wrap 32 bits, écrit trois images saturées dans l'intervalle s16 et trois octets saturés séparément, avec flags de plage.

Deux preuves indépendantes du nom : anciens accumulateurs chargés puis inclus par les trois LEA (ancre 3) ; déplacements DWORD et magasins AL/AL/CL aux octets consécutifs de la file (ancres 1 et 6). Les clamps signés et unsigned établissent séparément les deux images de sortie (ancres 4–6). « Scaled » décrit un facteur mémoire x87, **pas une certification de Q12**.

**LIKELY — contexte :** primitive de calcul couleur/registres de type GTE logiciel, cohérente avec le triplet empaqueté et les masques, corroborée seulement par la compaction autorisée. **UNCERTAIN :** commande GTE exacte, identité matérielle IR/MAC/RGB, fonction d'éclairage/blend précise, valeur des constantes, formule numérique Q12 inconditionnelle, usage de retour par les callers. Aucun nom métier exact promu ; aucun conflit mécanique résiduel entre A et B.

## Convergences, divergences et contrôle d'erreurs communes

| Point | A / B | Décision R contre le natif |
|---|---|---|
| Nom et confiance | A : nom descriptif sans IR/RGB, CERTAIN mécanique ; B : `...ClampIR_PushRGB`, LIKELY interprétation | Retenir le nom d'A pour la mécanique, non par préférence d'auteur mais parce que les seules adresses/largeurs/opcodes prouvent s16/u8/FIFO ; IR/RGB restent interprétatifs. Ne pas étendre CERTAIN au métier. |
| Constantes/Q12 | Tous deux conditionnent la simplification ; B explicite un biais attendu `2^52+2^31` | Les bytes `D8 0D`/`DC 05` établissent formats et adresses, pas contenu. F et K restent symboliques. Ni la valeur numérique du label ni une note commune ne certifient les données. |
| « Tag » / « retain » | A : octet auxiliaire ; B : source tag conservé | Le natif copie `[0x1CA8A2B]` vers `[0x1CA8A6B]`. Il ne conserve pas nécessairement l'ancien octet supérieur de FIFO68. Identité « tag » UNCERTAIN ; contrat : remplacement par octet opaque copié. |
| ABI/retour | Accord sur zéro argument explicite, EAX résiduel | Vérifié sur tous les chemins : pas de retour uniforme flags/RGB/255 ; le DWORD `0xFFFFFFFF` reste observable quand Y positif déborde et Z est dans la plage byte. cdecl-like compatible, prototype historique non prouvé. |
| Statut asymétrique | Accord sur six masques | Contrôle des immédiats bytes : Z-s16 ajoute **0x00400000 seulement**, pas bit 31. Accord A=B ne justifie aucun masque « corrigé » de matériel. |
| Ordre des effets | Accord global, descriptions regroupées | Raffiner chronologie ci-dessous : ancien Z lu avant ancien Y ; FIFO/tag et remise à zéro précèdent certaines opérations x87 ; stores s16 Y/Z précèdent leurs OR de flags, contrairement au premier clamp. Ne pas présenter la routine comme transaction atomique. |
| x87 / EFLAGS | A décrit les CMP différés ; B précise flags d'épilogue | Les deux sont vrais : MOV/LEA/FILD/FMUL/FADD/FSTP/PUSH/POP n'écrasent pas les EFLAGS du CMP différé. À RET les flags arithmétiques viennent de `ADD ESP,8`, pas du dernier test de plage. |

Erreurs communes recherchées, **non constatées dans leurs contrats détaillés** : confusion FSTP/FISTP, addition flottante de l'ancien accumulateur, saturation avant accumulation, magasin WORD au lieu de DWORD, conversion tronquante/SHR12 forcée, pack issu des IR déjà saturés, division implicite par 16, SAR interprété unsigned, changement d'EAX par un magasin AL, summary-bit uniforme. Chacun est exclu par les opérandes/opcodes ci-dessous, non par consensus. La connaissance secondaire commune reste exclue comme preuve de valeur ou d'opcode métier.

## Contrat final

### ABI, entrées et alias

Pas de CALL, pas de lecture d'argument pile ou de registre général entrant comme donnée ; RET near sans immédiat. Compatible avec une opération cdecl-like sans argument explicite ; ne suffit pas à attribuer un prototype source historique `void` ou `int`. Allocation locale de huit octets, ESI/EBX sauvegardés et restaurés, ESP rétabli, EBP/EDI intacts. EAX/ECX/EDX et EFLAGS écrasés. Aucun accès pointeur utilisateur ni garde d'erreur.

Entrées globales : anciens DWORDs `0x1CA8A64/68`, byte `0x1CA8A2B`, **low WORDs signés** `0x1CA8A30/34/38/3C`, anciens DWORDs `0x1CA8A74/78/7C`, operand binary32 à `0xB695F8` et operand binary64 à `0xB693D8`, environnement/pile x87 entrants.

Sources s16 espacées de **4 bytes**, accumulateurs et file DWORD espacés de **4 bytes** ; composantes empaquetées espacées de **1 byte**. Pas de tableau s16 compact, boucle ou stride implicite supplémentaire. Les adresses `34/38/3C` sont à la fois sources low-WORD et sorties **full DWORD** : leurs high WORDs initiaux sont ignorés puis remplacés. Les quatre byte stores couvrent le DWORD `68`, déjà lu comme ancienne entrée de file. Ne pas séparer ces vues en objets C indépendants sans préserver leur alias mémoire.

### Chronologie native des accès/effets

Notation `Axx = 0x1CA8Axx`, `S = 0x1CA92F8` ; lectures/écritures ci-dessous suivent l'ASM, pas une vectorisation.

1. Lit DWORD A64 puis A68 ; écrit A60=ancien A64, puis A64=ancien A68.
2. Lit signed WORD A30 puis A34 ; écrit A30 sign-étendu dans scratch. Lit byte A2B ; FILD du scratch ; remplace scratch par A34 ; écrit byte A68+3 ; lit signed WORD A38. FMUL mémoire F sur le facteur ; FILD du scratch A34.
3. Lit ancien DWORD A74 ; sauvegarde ESI ; lit ancien DWORD A7C ; **écrit S=0**. Premier FMUL ST,ST(1), FADD mémoire K, FSTP binary64 dans scratch, puis lecture du DWORD bas. Remplace scratch par A38, FILD de celui-ci ; lit ancien DWORD A78.
4. LEA calcule X avec l'ancien A74 ; CMP X,-32768 ; **écrit A74=X** avant le calcul flottant Y. Effectue deuxième FMUL/FADD/FSTP/lecture low-DWORD ; LEA calcule Y ; lit signed WORD A3C et le place dans scratch ; **écrit A78=Y** ; FILD A3C.
5. Troisième FMUL/FADD/FSTP/lecture low-DWORD ; dépile le facteur ; LEA calcule Z avec l'ancien A7C ; fixe ESI=32767 ; **écrit A7C=Z**. Aucun résultat brut n'est saturé dans A74/78/7C.
6. Clamp X signé : branche basse/haute écrit S=0x81000000 **avant** A34=borne ; branche normale A34=X. Clamp Y : lit S si nécessaire, écrit A38=borne **avant** OR/store S ; sinon A38=Y. Clamp Z : même ordre sortie avant OR/store S ; sinon A3C=Z. Les six sorties de borne sont des DWORDs.
7. Test unsigned X<=255 ; si échec lit S, SAR/NOT EAX, OR/store S ; écrit byte A68+0=AL. EAX=Y ; test unsigned Y<=255 ; si échec lit S, SAR/NOT EAX, OR/store S. Test unsigned Z<=255 ; **écrit byte A68+1=AL avant la branche Z**. Si échec Z, lit S en EAX, SAR/NOT ECX, OR/store S ; écrit byte A68+2=CL. Épilogue ADD ESP,8 ; RET.

Les PUSH/POP intercalés sauvegardent des registres, pas des paramètres. Aucun store n'est annulé si une exception x87 ou un défaut mémoire interrompt le chemin : le contrat de sortie complet s'applique au retour normal seulement. Pas de synchronisation, non-réentrant sans discipline externe ; aucune atomicité ou sérialisation ajoutée.

### Arithmétique et x87 exacts

Soient `s=sext16(A30)`, `vi=sext16(A34/A38/A3C)` aux instants de lecture. Le facteur est le résultat de **FILD m32int puis FMUL m32real F**. Pour chaque vi : FILD m32int, FMUL ST,ST(1), FADD m64real K, **FSTP m64real** dans les huit octets scratch. Soit `Li` le DWORD bas des bits binary64 effectivement stockés, non un cast numérique.

`X = old_A74 + L1 + 0x80000000 (mod 2^32)` ; `Y = old_A78 + L2 + 0x80000000 (mod 2^32)` ; `Z = old_A7C + L3 + 0x80000000 (mod 2^32)`.

Addition entière **après** magasin flottant, réalisée par LEA sans flags ; aucun traitement d'overflow 32 bits. Toute implémentation doit préserver les bits/wrap et éviter l'overflow signé C indéfini. Ni entier illimité, ni accumulation dans le domaine flottant, ni conversion FISTP, cast tronquant, SHR/SAR12 ou clamp 32-bit ne sont équivalents inconditionnellement.

Quatre FILD, quatre FMUL, trois FADD, trois FSTP m64 puis un FSTP ST(0) : net zéro profondeur x87 au retour normal, besoin maximal de deux slots supplémentaires. Les opérations suivent le control word entrant et les frontières d'arrondi x87, y compris le magasin binary64. Pas de FLDCW, FNINIT, FNCLEX, sauvegarde/restauration d'environnement ou arrondi imposé. Le control word n'est pas changé ; status/condition/exception flags peuvent l'être. Slots insuffisants ou exceptions non masquées peuvent empêcher le retour normal. **Préserver l'environnement signifie respecter celui utilisé par le natif, pas restaurer des flags que le natif modifie.** Valeurs F/K et conditions d'une simplification Q12 restent UNCERTAIN.

### Clamps et flags

Chaque brut est interprété signed32 pour clamp `[-32768,32767]` écrit full DWORD. Bornes incluses. Puis le **brut**, sans recharge des sorties saturées, est testé unsigned32 contre 255. Si unsigned<=255, valeur inchangée ; sinon `NOT(SAR32(brut,31))` donne DWORD zéro pour signed-négatif, DWORD `0xFFFFFFFF` pour signed-non-négatif. Seul son low byte est stocké, donc 0/255. Le shift compte 31 est exact, sans ambiguïté de masque de compte.

| Condition sur brut | Effet statut S, après clear initial |
|---|---|
| signed X hors [-32768,32767] | affecte `0x81000000` |
| signed Y hors [-32768,32767] | OR `0x80800000` |
| signed Z hors [-32768,32767] | OR `0x00400000` |
| unsigned X >255 | OR `0x00200000` |
| unsigned Y >255 | OR `0x00100000` |
| unsigned Z >255 | OR `0x00080000` |

Aucun ancien bit de S conservé par le clear ; aucun summary-bit synthétisé. Le pack final est byte0=X-clamp-u8, byte1=Y-clamp-u8, byte2=Z-clamp-u8, byte3=byte opaque A2B copié plus tôt. Les byte stores n'écrasent pas les autres octets.

### AL/AX/EAX et retour

AL alimente les magasins X puis Y ; CL le magasin Z. Aucun magasin mémoire d'AL/CL ne remplace EAX/ECX par la valeur byte. AX n'est jamais construit comme résultat dédié.

Au RET normal : si `unsigned Z>255`, **EAX=S final** ; sinon EAX vaut **Y** si `unsigned Y<=255`, **0** si Y signed-négatif, **0xFFFFFFFF** si Y signed-positif et >255. AL/AX sont ses sous-parties. Pas de retour uniforme flags, RGB, booléen ou troisième accumulateur. Sans corps de callers, usage contractuel de ce résidu **UNCERTAIN** ; ne pas l'effacer dans une traduction qui promet l'équivalence de registres.

### Couverture CFG explicite

Entrée/calcul : `45EBF0`. Clamp X : `45ECD7,45ECED,45ECF1,45ED03`. Clamp Y : `45ED08,45ED11,45ED2F,45ED33,45ED4D`. Clamp Z : `45ED53,45ED5B,45ED79,45ED7D,45ED97`. Pack/retour : `45ED9D,45EDA5,45EDBC,45EDCB,45EDE2,45EDEF,45EE03`. Total **22/22** ; toutes les branches basses/hautes/in-range, les trois branches unsigned et l'unique épilogue sont couvertes. Pas de chunk ni appel inventé.

## Huit ancres exactes ASM / bytes / xrefs

Références toutes dans P ; labels et commentaires ne servent pas de preuve.

1. **FIFO et byte opaque** — `45EBF3/45EBF8/45EBFE/45EC03`, `45EC1B/45EC29` ; `native-asm-001.txt:2-5,9-12`. Lit avant écriture, décale DWORDs, écrit DL à A68+3. Preuve FIFO du nom.
2. **Entrées signées/facteur partagé** — MOVSX WORD `45EC09,45EC10,45EC2F,45EC9C` ; FMUL `45EC36,45EC56,45EC85,45ECB1` ; `native-asm-001:6-25`, `native-asm-002:5-16`. Bytes `D8 0D F8 95 B6 00` à EC36 et `DC 05 D8 93 B6 00` aux FADD prouvent m32/m64, non leur valeur.
3. **Accumulation wrap** — charges anciens `45EC40/45EC46/45EC6E`, LEA `45EC74/45EC95/45ECC3`, stores `45EC80/45ECA7/45ECCF` ; `native-asm-001:16,18`, `native-asm-002:1-21`. LEA ajoute ancien accumulateur et low bits +0x80000000 : preuve accumulation indépendante de la FIFO.
4. **Conversion flottante, flags différés** — FSTP m64 `45EC5E/45EC8D/45ECB9`, bytes `DD 5C 24 04` ; CMP `45EC7B` → JGE `45ECD5`. `native-bytes-001:4-8`, `native-asm-002:3-22`. Pas FISTP ; aucun écrasement d'EFLAGS dans l'intervalle.
5. **Clamps signed32/full-DWORD et flags** — `45ECD7–45ED97`, `native-asm-002:23-25`, `native-asm-003:1-25`, `native-asm-004:1-12`. Branches bytes `7D/7E`, bornes FFFF8000/00007FFF, stores DWORD et masques 81000000/80800000/00400000.
6. **Unsigned bytes à partir des bruts** — `45ED9D/45EDA3`, `45EDC3/45EDC9`, `45EDE2/45EDED`, bytes JBE `76` ; SAR31/NOT et stores `45EDBC/45EDE8/45EE03`. `native-asm-004:13-25`, `native-asm-005:1-14`, `native-bytes-001:14-17`. Aucun IR rechargé ni division par 16.
7. **Résidu EAX/ABI** — MOV EAX,EDX `45EDC1` ; chargement flags seulement sur branche Z `45EDEF`, OR `45EDF7` ; ADD ESP,8 `45EE09`, RET `45EE0C`. `native-asm-005:6-16`, `native-bytes-001:16-17`. Confirme les deux familles de retour, plain RET et flags d'épilogue.
8. **Xrefs et limites métier** — `native-metadata.json:174-204` : `56CB7D→45EBF0` dans `56CB50`, `56CBED→45EBF0` dans `56CBC0`, `5D9585→45EBF0` dans `5D9510`, `657E24/657E56→45EBF0` dans `657DF0` ; `:956-958` code_targets vide, 116 instructions. Confirme réutilisation/leaf, ne prouve ni consommation d'EAX ni identité d'une commande matérielle.

## Résidu, preuves complémentaires et livraison

Contrat mécanique réconcilié complet ; pas de CONFLICT mécanique non tranché. **UNCERTAIN** maintenu pour le métier exact, F/K, arrondi numérique simplifié, contraintes d'entrée des callers et usage de retour. Pour lever ces seules limites, demander au lead un complément **gelé** des quatre bytes B695F8, huit bytes B693D8, snippets bornés des callers établissant l'environnement x87/consommation d'EAX et, si disponible, une preuve indépendante de mapping des registres. Aucun de ces compléments n'est requis pour conserver le présent contrat instructionnel symbolique.

Pas de C produit dans ce volet ; pas de compilation/test/exécution revendiqué. Seul fichier écrit : ce `semantic_r.md`. Aucune IDB, Git, registre/ledger, configuration, live, délégation, API ou autre service/index touché. Contrôle des hashes, §5.6 natif final et toute promotion restent au parent.
