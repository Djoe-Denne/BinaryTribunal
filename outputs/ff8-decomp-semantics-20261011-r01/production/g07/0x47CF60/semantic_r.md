# 0x47CF60 — contrat sémantique final réconcilié R

## Verdict, périmètre et provenance

**Nom proposé : `BattleModule_RunFrame`. Confiance métier : LIKELY.**

Rôle : orchestration d'un appel de frame du module de combat, avec préparation/admission graphique, services UI, progression conditionnelle, gestion de pause et de scheduling, demande de changement de module et travail de clôture. Ce n'est ni le directeur seul, ni un simple appel de présentation. Les mots combat/UI/scène/module sont des interprétations appuyées par la compaction commune ; la mécanique des branches, accès et destinations est établie séparément par les bytes.

Deux supports distincts du nom : (1) l'appel conditionnel `0x47CCB0` est encadré par des services répétés, une sélection de cible et des gates de pause/rendu ; (2) un gate indépendant construit deux alternatives de triplets d'adresses et transmet le stockage à `0x409A57`, puis poursuit la clôture. Cela justifie un propriétaire d'orchestration plutôt qu'une routine de progression seule. La fréquence réelle d'invocation et l'identité métier exhaustive des helpers restent **UNCERTAIN**.

Entrées exclusivement lues dans `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g07/0x47CF60/semantic/` : manifest, A/B, common-compaction, packet original, native-manifest, native-metadata, les neuf native-asm et les deux native-bytes. Aucun autre volet/output/historique/index/service natif consulté.

- A : session `ses_ed3cfdfb6ffe0o4mfAKkxnmTjB`, tâche `task_mv44rlfn_007h_5wrflk`, OpenAI `gpt-6.1-sol`, variante high ; SHA256 déclaré `bd845a64139620d9764b57d3f18b008bf206f70439d4f4b0dc599801a77e9ce5`.
- B : session distincte `ses_ed3cfdbf4ffekYm7W4xJopsH8D`, tâche `task_mv44rlfo_007i_lcklvh`, même modèle/variante ; SHA256 déclaré `48008d13e22c17bd2e94a84bc56b9e39df15e0bb2fc23b9d21b3c3286e98ea78`.
- Gel packet : `a502d16b154e08a955a468279c04dda5c926c4260a8b231a45a2bc2d45289fb2` ; compaction : `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Ces valeurs concordent entre manifest R, native-manifest et déclarations A/B. Tous les hashes de slices/metadata du manifest R concordent avec native-manifest, avec le préfixe de dépôt `native-`.
- Provenance native : x86 32 bits, EXE SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`, IDB déclaré `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`.
- Les deux auteurs et leurs hashes sont présents, distincts et cohérents au niveau des déclarations. **Pas de recalcul cryptographique local** : outils autorisés sans accès fichier brut de hashing ; vérification effective des hashes par le parent avant intégration. Ce rapport n'atteste donc pas un hash check exécuté.
- Couverture : chunk unique `[0x47CF60,0x47D285)`, 805 bytes, 209 instructions, tous les blocs/successeurs du CFG et les deux RET. Le rendu de la longue chaîne `assembly` du packet est tronqué par l'outil : **cette chaîne tronquée n'a pas été utilisée**. Les neuf slices verbatim complètes fournissent les 209 lignes ; les deux slices bytes complètes et le champ hex intégral du packet fournissent tout le chunk. Metadata JSON et les champs structurés nécessaires sont complets.

## Réconciliation A/B, y compris erreurs communes

| Sujet | A / B | Décision par preuve native |
|---|---|---|
| Rôle et nom | Accord `BattleModule_RunFrame`, LIKELY | Retenu LIKELY, non promu par accord. Gate du directeur + triplets transmis + enveloppe de services sont deux supports ; noms/commentaires seuls exclus. |
| Nettoyage de préparation | A place `ADD ESP,0x18` à `47CFBE` ; B à `47CFC4` | **B exact** : `47CFBE` est `MOV EAX,[ESI+BA8]` (`8B 86 A8 0B 00 00`) ; `47CFC4` est `83 C4 18`. La relecture précède le nettoyage. |
| Ordre des écritures locales initiales | Tous deux énumèrent L+0/+4/+8/+12, sans conserver l'ordre natif dans leur inventaire | Clarification commune : écritures effectives **L+8, L+4, L+0, L+12** aux VA `47CF8D/95/9D/A5`. Ne pas transformer cet inventaire en ordre de stores fidèle. |
| Retours / largeur | Accord : résultat métier non prouvé, EAX résiduel de helper | Retenu, avec réserve : aucun prototype ni largeur de retour du helper n'est prouvé. Dire « entier/Boolean retourné » serait excessif. |
| Pause et services | Accord : requête DWORD distincte du latch BYTE, copie tardive ; mode relu | Retenu par `A0`, `88 1D`, `C6 05`, `C7 05` et gates séparés. Pas de garantie que trois paires pré et une post se produisent ensemble : les callees peuvent modifier mode/latch. |
| Effets graphiques/callbacks CERTAIN | B inclut scène/listes/installation de callbacks dans sa conclusion mécanique ; A qualifie davantage les contrats | **Restriction de certitude** : CERTAIN = destinations, arguments et tests. Scène/listes/installation réelle = LIKELY par contexte ; le packet ne contient ni corps des helpers ni sites d'installation/dispatch. Triplets = constantes passées, pas exécution directe. |
| Présentation/temps/audio | Les auteurs se retiennent dans leurs limites mais utilisent parfois « tail volume », « begin/leave », « pacing » comme raccourcis | R les traite comme interprétations contextuelles, jamais preuve autonome de present, incrément de temps, unité audio ou temporisation. Les commentaires LIVE et noms des helpers ne fondent pas CERTAIN. |
| Anomalies labels/bytes | Accord : double réel `1A78BE0`, call final réel `46BD10` | Recalcul contre encodages : `DD 05 E0 8B A7 01` et rel32 `E8 94 EA FE FF` à `47D277` donnent ces adresses. Les suffixes `1A788B8` / `46BB10` sont rejetés pour l'adressage. **Conflit de présentation résolu**, pas conflit mécanique résiduel. |
| Xrefs entrantes | Accord : références non-code, pas deux CALL | Retenu : metadata `iscode:false`, type 1, sites `4709EC` et `5598DD`. L'usage comme callback/cadence n'est pas CERTAIN. |

Aucun désaccord mécanique non tranché identifié après contrôle des opcodes et du CFG. Les inconnues de métier/ABI des callees demeurent UNCERTAIN, et ne sont pas transformées en consensus CERTAIN.

## Contrat d'entrée, stockage et sortie

- Le DWORD `[ESP_entrée+4]` est chargé dans ESI à `47CF65` : `8B 74 24 28` après allocation 0x1C et sauvegarde EBX/ESI. Il sert d'adresse de contexte. Lectures DWORD `contexte+BA8`, écritures DWORD `contexte+B88`, sans NULL check ni garde de taille.
- Convention cible compatible cdecl : RET simple aux deux sorties, argument non dépilé par la cible, sauvegarde/restauration EBX/ESI ; EDI/EBP non modifiés directement. EBX vaut zéro, BL sert de zéro octet. Ceci suppose le respect des registres préservés par les callees ; leurs prototypes complets ne sont pas exportés.
- Les listes d'arguments ci-dessous signifient **DWORDs explicitement poussés dans l'ordre logique cdecl**, non prototypes inventés ; elles n'excluent pas un usage supplémentaire de registres par un helper. Les nettoyages sont caller-side, parfois cumulés entre plusieurs appels.
- Soit L = adresse locale à `ESP_après_prologue+8`, région 28 bytes. Initialisation dans l'ordre : L+8=0, L+4=0, L+0=0, L+12=`3F800000`. L+16/+20/+24 non initialisés alors. Le motif `3F800000` n'impose pas un prototype float au helper.
- Même région L réutilisée pour le triplet ultérieur. Les cellules L+0/+4 ne sont pas réinitialisées avant `409A57`; `41E168` a reçu L et peut les modifier. Pas de deuxième objet implicitement zéro-initialisé, ni preuve que les helpers ne retiennent pas ce pointeur.
- **Résultat sémantique : UNCERTAIN.** Aucun succès/Boolean/resultat de combat construit. À la sortie précoce EAX est celui laissé par `41E99D`; aux sorties ordinaires EAX est celui laissé par `46BD10`. Aucun élargissement AL/AX ou normalisation n'est exécuté. Les autres registres volatils/x87 peuvent porter des effets des callees.

## Déroulement exhaustif, ordre des effets

Notation : B/W/D = accès mémoire 8/16/32 bits ; les adresses sont des VA x86. Chaque lecture décrite survient à son site, après les éventuels appels précédents, sans hypothèse de pureté.

### 1. Préparation et admission : blocs `47CF60/73/87/CB/EE`

Si D[contexte+BA8]==0 : `45B4C0(0,0,0x280,0x1E0)`. Calculer L, pousser contexte puis L, réaliser les quatre stores locaux dans l'ordre ci-dessus, appeler `41E168(L,contexte)`. Puis `41DFBA(1,1,1,contexte)`. Relire D[contexte+BA8] à `47CFBE`, nettoyer 24 bytes à `47CFC4`. S'il vaut zéro, charger D[1A77650] (hauteur), D[1A77654] (largeur), D[1A77648] (Y), D[1A7764C] (X), dans cet ordre de lectures ; appeler `45B4C0(X,Y,largeur,hauteur)`.

`41E972(0,contexte)` ; **TEST EAX entier**. Zéro saute à `47D243` : pas de corps central ni d'appel `41E99D` sur ce chemin, mais tail exécuté. Nonzero poursuit.

### 2. Services et pause/scheduling : blocs `47D000/04E/057/067/0D3/0E2/0E7/0FA`

Appels ordonnés : `416B9A(D[1D2A284])`, `424BF9(D[1D2A288])`, `49B120`, `499A40`, puis `43FBE8(contexte)`, `409B42(contexte)`, `409B08(contexte)`, `409B25(contexte)`. Nettoyage cumulé de 24 bytes à `47D039`, puis `56BA40`.

Lire B[1D28DEA]. Si nonzero, appeler `4A71D0` et tester EAX entier. Si EAX nonzero : D[1CFF834]=1 puis D[1CFF844]=0 ; rejoindre `47D067`, écrire D[contexte+B88]=1 et appeler `45B580`. **Pas de store B[1D28DE9]=1 ici.**

Sinon (`47D0D3`) : B[1D28DE9]=0 ; lire D[1CFF834] et, s'il est nonzero, appeler `5003A0`. Lire ensuite D[1CFF844] à `47D0E7`, puis D[1CFF834]=0. Si la valeur lue est zéro, rejoindre `47D067` ; sinon D[contexte+B88]=0 et appeler `45B590`, puis saut à `47D076`. Ne pas hoister la lecture scheduling avant `5003A0` ni annuler les stores répétés.

### 3. Services communs et véritable sortie précoce : blocs `47D076/094/0BB/0C4`

Quatre appels `4701B0`, exactement. Comparer W[1CDBFE0] à 3. Si égal : `4A76E0(0)` puis exactement trois paires `4A8E30`, `4A84E0`. Appeler `45B2E0` et tester EAX entier. Si nonzero : `41E99D(contexte)` puis épilogue/RET `47D0D2`. Ce chemin **bypasse tout le tail**, pas seulement le directeur.

### 4. Progression conditionnelle et services post : blocs `47D10A/113/118/122`

Lire B[1D28DE9] ; si zéro, `47CCB0`, sinon le sauter. Relire W[1CDBFE0] ; si égal à 3 : XOR EAX,EAX puis MOV AL,B[1D96A80], calculer `1D969C8 + 92*index`, appeler `4A76E0(adresse)` puis `4A8E30`, `4A84E0`, `4A78E0`. Ce groupe peut se produire directeur sauté ; il peut aussi ne pas se produire après les trois paires pré si le mode a changé.

### 5. Demande de successeur : blocs `47D150/158/162/17C/194`

Si D[1CFF830]!=0, relire W[1CDBFE0]. Si égal à 4, écrire successivement L+8=`4A2280`, L+12=`4A22A0`, L+16=`4A2690`; sinon L+8=`470690`, L+12=`4706A0`, L+16=`4706B0`. Calculer L, pousser contexte puis L, écrire L+20=0 puis L+24=0, appeler `409A57(L,contexte)`, nettoyer 8 bytes. Le corps continue à `47D1AA`. Pas de retour immédiat, pas d'appel direct à ces trois constantes, pas de cleanup métier démontré ici.

### 6. Bras latch/overlay : blocs `47D1AA/1B3/1BC/1F3/1FA`

Relire B[1D28DE9]. Si zéro : lire D[1CFF6F4]. S'il est nonzero, charger hauteur D[1A77650], XOR ECX,ECX, comparer la valeur de latch à 2, charger largeur D[1A77654], SETZ CL, pousser ECX (DWORD exactement 0/1), charger Y D[1A77648], pousser `3AC49BA6`, pousser hauteur, charger X D[1A7764C], pousser largeur/Y/X. Appeler `56D1D0(X,Y,largeur,hauteur,3AC49BA6,flag)`, nettoyer 24 bytes, **puis** D[1CFF6F4]=0. Appeler `56BA80` que le latch DWORD ait été zéro ou non.

Si B[1D28DE9] nonzero : `45D610(FFFFFFFF)` ; pas de lecture/clear de D[1CFF6F4] dans ce bras. Le DWORD de sentinelle n'est pas une preuve de prototype signed int.

### 7. Latch tardif, soumission et clôture : blocs `47D204/20C/213/21B/235`

Relire D[1CFF834]. Si nonzero : B[1D28DE9]=1 ; sinon aucune écriture de ce byte ici. Relire D[1CFF844]. Si zéro : `4980C0`, `465930`, `41E947(1,contexte)`, puis `499EA0` ; sinon sauter ce groupe. Toujours `45B450` puis `41E99D(contexte)`, et rejoindre le tail.

### 8. Tail : blocs `47D243/251/259/265/26B`

Appeler `56D9C0`, lire D[B6D970]. S'il est nonzero, lire D[1CFF834] ; si ce dernier est zéro, `4020F0` puis D[1CFF844]=EAX entier. Tous les autres cas écrivent D[1CFF844]=0. Cette écriture intervient après le gate de soumission et n'affecte pas rétroactivement les appels antérieurs.

À `47D26B` : **FLD m64real [1A78BE0]**, puis appel `55AD90`, PUSH EAX, appel **`46BD10`**, nettoyage 4 bytes, restauration ESI/EBX/local, RET `47D284`. Ni cast C ni politique d'arrondi/volume inventés.

## Largeurs, alias, arithmétique et environnement

- Gates pause/éligibilité/index = BYTE ; mode = WORD (`66 83 3D ... 03/04`) ; autres gates et champs contexte = DWORD. Les branches sont égalité/nullité, non comparaisons d'ordre signé/unsigned. Les nonzero DWORD ne sont pas normalisés sauf le flag SETZ.
- Les MOV AL de gates conservent les 24 bits hauts d'EAX, mais CMP AL,BL ne regarde que le byte. L'index, lui, est zéro-étendu par XOR EAX,EAX avant MOV AL. SETZ CL fournit un DWORD 0/1 parce que XOR ECX,ECX précède le CMP et que MOV ne modifie pas ZF. Aucun résultat AX n'est établi.
- LEA `3*i`, SHL 3, SUB i, LEA base+4*ECX = stride 92 (`0x5C`). Shift fixe 3, arithmétique 32 bits modulo 2^32, index 0..255. Le calcul local reste dans l'espace 32 bits pour cette base/domain ; aucune garde `index<=1` ni preuve de validité du stockage. Aucun stride de slot `0xD0`, boucle d'acteurs ou update inventaire natif dans ce corps.
- Les appels peuvent modifier contexte/globals/L. Garder toutes les relectures et l'ordre d'accès décrit ; pas de const/pure/restrict inventé. En particulier le mode est testé séparément avant les services, après directeur, puis pour le triplet, et le latch octet est relu après plusieurs helpers. Une aliasation avec les champs contexte n'est pas exclue par la capture.
- Le seul accès flottant direct est le FLD de 64 bits à VA `1A78BE0`. Aucun FLDCW/FNSTCW/changement explicite d'environnement x87 dans la cible. L'état initial de pile, les exceptions masquées/non masquées et l'état de contrôle influencent le résultat/les fautes possibles ; les helpers peuvent modifier cet état. Consommation de ST(0), arrondi/troncature, exceptional-input policy, éventuel résultat EDX de `55AD90` sont **UNCERTAIN**. Seul EAX est explicitement transmis au dernier appel. Pas d'équivalence prouvée à une conversion C standard.

## Huit ancres ASM/xref exactes

Chemins relatifs au répertoire d'inputs déclaré ci-dessus. Les commentaires des lignes ne servent pas de preuve.

1. **ABI et gate initial** : `native-asm-001.txt:2-20`, `native-asm-002.txt:1-21`; `47CF65` = `8B742428`, `47CFC4` = `83C418`, `47CFF8/FA` TEST EAX/JZ `47D243`. Bytes `native-bytes-001.txt:1-5`.
2. **Pause à deux cellules et relecture** : `native-asm-003.txt:15-24`, `native-asm-004.txt:25`, `native-asm-005.txt:1-11`; `47D057` DWORD `1CFF834=1`, `47D0D3` BYTE `1D28DE9=0`, `47D0E7/EC` read scheduling puis clear requête. Bytes slice 001:8-14.
3. **Services puis RET sans tail** : `native-asm-003.txt:25`, `native-asm-004.txt:1-24`; quatre calls `47D076/7B/80/85`, WORD gate `47D08A`, TEST `47D0C0` et RET `47D0D2`. CFG metadata blocs `47D0BB/0C4`.
4. **Gate directeur et stride** : `native-asm-005.txt:12-25`, `native-asm-006.txt:1-4`; `47D10A/111/113` byte gate vers call `47CCB0`; `47D122–131` XOR/MOV AL/LEA/SHL/SUB/LEA ; `47D14B` rel32 vers `4A78E0`. Bytes slice 001:14-16.
5. **Triplets et poursuite** : `native-asm-006.txt:5-22`, bytes slice 001:16-19 ; `47D162/16A/172` versus `47D17C/184/18C`, stores L+20/+24 à `47D19A/19E`, call `47D1A2` vers `409A57`, successeur CFG `47D1AA`.
6. **Stores tardifs et render gate** : `native-asm-007.txt:1-25`, `native-asm-008.txt:1-15`; SETZ CL `47D1CC`, clear DWORD après call `47D1ED`, store BYTE `47D20C`, DWORD gate `47D213`, call `47D230` vers **499EA0**, clôture `47D23B` vers `41E99D`. Bytes slice 002:1-4.
7. **Tail et adresses corrigées** : `native-asm-008.txt:16-25`, `native-asm-009.txt:1-9`, bytes slice 002:4-6 ; `47D25E` store EAX entier, `47D26B` `DD05E08BA701` = `[1A78BE0]`, `47D277` `E894EAFEFF` = `47D27C + FFFEEA94` modulo 2^32 = **46BD10**. Metadata code_targets corrobore cette dernière destination.
8. **Xrefs réellement fournies** : `native-metadata.json:315-327` : `4709EC` dans `4706B0`, `5598DD` dans `559890`, type 1 et `iscode:false`. Ce ne sont pas des CALL démontrés ; contexte documentaire antérieur borné : `common-compaction.md:33-36`, distinct de la preuve opcode.

## Limites résiduelles et fermeture

1. **UNCERTAIN** : contrats des helpers, signification exhaustive des modes 3/4, des triplets, de B6D970 et du résultat de 4020F0 ; cadence et enregistrement/dispatch callback. Les gel/ASM de ces voisins ne font pas partie de ce périmètre.
2. **UNCERTAIN** : disposition complète du contexte, pureté/alias des callees, durée de rétention de L, domaine réel de l'index et mutabilité entre gates. Aucun nouveau guard ni invariant inter-frame imposé.
3. **UNCERTAIN** : vrais types de retours, contrat x87 et unité du double réel ; pas de « present » matériel ou de volume prouvé par ce seul corps. Les validations historiques résumées dans la compaction n'ont pas été reproduites.
4. Anomalies de labels résolues mécaniquement par bytes, sans mutation IDB ni proposition de renommage de globals/helpers non démontrés. Pas de CONFLICT mécanique restant dans le chunk inspecté.
5. Livrable du volet **sémantique uniquement**, pas un C substitutif. Aucun test, compilation, live, IDB/Git/registre/config/API ou sous-agent. Hashing effectif et contrôle natif final §5.6/promotion réservés au lead. Le rapport décrit tous les chemins normaux, échec admission, RET anticipé, pause/unpause, modes 3/4, transition et scheduling ; il ne certifie pas les corps externes.
