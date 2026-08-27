# Nouveau batch — G15 VM de contrôle de l’IA ennemie

Tu dois implémenter G15 complètement hors-ligne, préparer puis conduire sa
validation live minimale. Travaille de façon autonome jusqu’à ce qu’un geste
dans FF8 soit réellement nécessaire. À ce moment-là, demande une action courte
et précise à l’opérateur.

Ne committe et ne pousse rien sans demande explicite.

## Résultat attendu

À la fin :

- les sept unités U15.1–U15.7 sont implémentées et testées ;
- les 200 scripts monstres authentiques de `battle.fs` ont été analysés
  hors-ligne et disposent d’un rapport de couverture reproductible ;
- les scripts réels Init et Turn peuvent être exécutés par la VM de
  remplacement sans émettre d’action native ;
- une unique session live positive prouve le codec runtime, les lectures
  d’état, les PC, branches, variables, sélections de cible et tirages RNG ;
- aucun appel à `EnemyAI_VM_ExecuteScript` ni à un helper de domaine natif ne
  survient pendant l’évaluation de remplacement ;
- G14 reste promu et sa dette `0x71` reste explicitement attribuée à G16 ;
- les preuves, manifestes, README, matrice d’ownership et ABI ledger sont à
  jour ;
- `promotion.G15.satisfied` ne devient vrai qu’après la preuve live finale.

G15 ne doit pas exécuter les actions, mutations de combat, apparitions,
retraits, textes, récompenses ou relais de G16. Ces opcodes doivent être
décodés sans ambiguïté et produire une intention typée différée, jamais être
ignorés silencieusement ni exécutés par le moteur natif.

## Préambule outillage — vérifie une fois, puis travaille

### RTK

RTK est installé globalement et son hook Codex est déjà configuré. Vérifie une
seule fois :

```powershell
rtk --version
```

La version précédemment observée était `0.42.4`. Si le hook est présent, ne
cherche pas à l’invoquer manuellement à chaque commande : il agit seul.

### QMD / Oxygen

Utilise la commande `qmd`, pas le MCP QMD. Commence par :

```powershell
qmd status
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:670:45
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-readiness-ledger.md:524:65
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-open-questions.md:222:14
qmd get ff8-wiki/projects/re-ff8/references/enemy-ai-opcodes.md
qmd get ff8-wiki/projects/re-ff8/concepts/enemy-ai-vm.md
qmd get ff8-wiki/projects/re-ff8/skills/ff8-live-validation-operations.md
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p0-g14-presentation-validation.md
```

Le document `enemy-ai-opcodes` est l’autorité statique : ne redécompile pas les
61 opcodes un par un. Si le reranker QMD échoue avec CUDA, recommence avec
`qmd search` ou `qmd query --no-gpu --no-rerank`. Une panne du reranker ne
signifie pas que l’index ou les pages sont indisponibles.

### Context Mode

Utilise Context Mode pour filtrer les grosses sorties, rapports de corpus,
diffs et résultats de tests. Le dépôt d’implémentation doit être la racine de
travail de la session. Si Context Mode refuse un chemin extérieur à cette
racine, utilise une commande locale ciblée pour ce fichier ; ne traite pas ce
garde de périmètre comme une panne de G15.

### IDA MCP

L’IDB autoritative est :

```text
D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
```

N’utilise IDA que pour les symboles ou préimages réellement manquants au
contrat runtime. Les racines connues sont :

- `BattleArbitration_SelectNextAction` `0x485460` ;
- `EnemyAI_PrepareTurnAction` `0x485610` ;
- `EnemyAI_DispatchSection` `0x4877F0` ;
- `EnemyAI_VM_ExecuteScript` `0x487DF0` ;
- boucle principale `0x487EBA` ;
- dispatch 61 cases `0x487EDC` ;
- comparateur `EnemyAI_CompareValues` `0x48A680`.

Toute nouvelle découverte ou correction doit être immédiatement renommée,
typée et commentée dans l’IDB par le MCP IDA. Ensuite seulement, reporte-la
dans l’address map et l’ABI ledger. Ne transforme jamais une intuition issue
d’un nom de fonction en contrat natif.

## Dépôts et état de départ audité

Documentation et prompt :

```text
C:\Users\djden\source\repos\retro-eng\re-ff8
```

Implémentation :

```text
C:\Users\djden\source\repos\FinalFantasy_VIII_ReImaginated
```

Le `HEAD` d’implémentation observé avant ce batch est
`80e85e316368e419f493a2ebcbda9bea253f0cb4`, mais **le G14 promu se trouve dans
le worktree non commité**. Le worktree sale est attendu. Ne fais ni reset, ni
checkout destructif, ni nettoyage global. Préserve toutes les modifications et
tous les nouveaux fichiers G14.

État vérifié juste avant la rédaction de ce guide :

- `python .\tools\validate_contracts.py` : PASS ;
- CTest `debug-x86` : 37/37 PASS ;
- `[promotion.G14].satisfied = true` ;
- DLL G14 canonique :
  `363d91cf8a4107c41fa5cbc2f8eb692dcf834765fa88790832aea3ca2c814471` ;
- enveloppe positive G14 :
  `098c52fcc6823eb094d2c932d6a35ac261a4e54f06f0cda3e5e2591b22766f90` ;
- enveloppe négative G14 :
  `a4ed7ba370c9ab214a3fe3f264d841a26ec515a5b9b31a3e86e8ed78e3839e6d`.

Il existe une incohérence documentaire locale : `[P0.G14].status` peut encore
indiquer « live promotion pending » alors que la section de promotion et les
preuves sont closes. Corrige uniquement ce libellé si l’incohérence existe
encore. Ne relance pas G14 pour cela.

Après inspection, capture un résumé du diff G14 avant toute modification G15.
Ne mélange pas dans ton rapport les fichiers préexistants G14 et tes ajouts
G15.

## Dette G14 à préserver

G14 est promu. Sa dette exacte est :

- le worker `0x71` et ses six sites de création sont `confirmed-static` ;
- sa cadence de présence dans la liste native n’a pas été parcourue live ;
- cette observation appartient à U16.4/U16.7, lorsqu’un script fera réellement
  apparaître un monstre ;
- elle ne bloque pas G15 et ne doit pas déclencher une session G14
  supplémentaire.

Ne modifie pas le codec `0x71` pour simuler une cadence. Ne fais pas grossir le
scope G15 avec spawn/remove ou avec la présentation.

## Contrat G15 autoritatif

G15 dépend de G14 et porte uniquement :

- **U15.1** parseur de section 8 des `.dat` : bornes, offsets du bloc AI,
  offsets des sous-sections, textes et entrées invalides ;
- **U15.2** contexte d’exécution : slot, section, PC, commande préparée, cible,
  texte, requête de relais, scratch et difficulté ;
- **U15.3** STOP, IF, JUMP, skip, arrêt sur intention d’action et protection
  contre les boucles ;
- **U15.4** variables locales, globales, globales alternatives, scratch et
  arithmétique ;
- **U15.5** lecteurs de sujets : HP, statuts, niveau, scène, dernier attaquant,
  compteurs et valeurs globales ;
- **U15.6** comparaisons : opérateurs, largeurs, signe et offsets de skip ;
- **U15.7** sélecteurs : direct, aléatoire, groupes, stocké, statut/stat et
  dernier attaquant.

Le gate est atteint lorsque de vrais scripts Init/Turn exécutent tout leur
contrôle observable jusqu’à STOP ou jusqu’à une intention G16, sans émettre
d’action native.

## Hors scope strict

Ne pas implémenter dans G15 :

- l’écriture dans les pending/exec queues ;
- `BattleAction_GetText`, `BattleAction_ResolveTargetAndHitCount` ou un autre
  helper natif de domaine ;
- l’exécution de Magic, Item, attaque monstre, GF ou spécial ;
- les mutations HP/statut/ATB/visibilité ;
- spawn, activate, remove, die ou scripted exit ;
- texte, attente, scan présenté, caméra ou relais ;
- cartes, drops, flags histoire ou récompenses ;
- le comportement Berserk complet, les réactions/counters ou Angelo ;
- la dette live `0x71` ;
- le remplacement graphique.

Ces familles appartiennent à G16+ et doivent seulement produire des types
différés suffisamment précis pour que G16 n’ait pas à reparser le bytecode.

## Loi de couches obligatoire

```text
ff8iso_core -> ff8iso_application -> ff8iso_runtime -> ff8_battle_iso
ff8iso_abi  -> ff8iso_runtime
```

- `core` : script canonique, VM, contexte, traces, comparaisons, sujets,
  cibles, variables et intentions différées ;
- `application` : orchestration transactionnelle et accès aux services
  sémantiques existants ;
- `abi` : POD, symboles, globals et préimages seulement ;
- `runtime-x86` : lecture de l’archive/du `.dat` chargé, codecs, snapshots
  natifs, exports live et éventuel hook de test.

Interdictions :

- aucun `ff8iso/abi`, RVA, `find_symbol`, pointeur natif ou `import_legacy`
  dans `core` ;
- aucun `LegacyBattleImage`, codec ou accès mémoire hôte dans `application` ;
- aucun choix de règle métier dans `runtime-x86` ;
- aucune structure `.dat` native exposée au domaine ;
- aucun nouveau domaine ajouté aux adaptateurs temporaires G06/G07/G09 ou au
  `SealedNativePresentationAdapter` G14.

`tools/validate_contracts.py` doit étendre la garde de couche à G15.

## Architecture cible

### 1. Modèle canonique dans `core`

Crée des types pointer-free, par exemple :

- `AiSectionId` pour Init, Turn, Counter, Death, PreHit et sections spéciales ;
- `AiScriptBundle` propriétaire de ses octets et de ses bornes ;
- `AiInstruction` ou un décodeur borné conservant opcode, opérandes et PC ;
- `AiPreparedCommand` sémantique, sans copier les IDs pending natifs dans un
  enum canonique ;
- `AiExecutionContext` : acteur, section, PC, scratch, commande préparée,
  masque cible, texte, relais, difficulté et compteur de tour ;
- `AiVariableState` : banque locale par slot, globale, alternative globale et
  champs nécessaires ;
- `AiTraceEntry` : PC avant/après, opcode, résultat, branche, lectures,
  écritures, masque cible et tirages RNG ;
- `AiStopReason` : `StopOpcode`, `DeferredG16Intent`,
  `ActionWouldCommit`, `ActionHadNoTarget`, `MalformedScript`,
  `SafetyBudgetExceeded` ;
- `AiExecutionReport` : trace, état final, RNG consommée et intention différée.

Ne stocke aucun `span` ou pointeur dont la durée de vie dépend du buffer natif.
Le résultat doit pouvoir être sérialisé dans un test ou une preuve sans adresse
de processus.

### 2. Codec `.dat` dans `runtime-x86`

Le décodage physique de section 8 est un codec. Il doit :

- vérifier la taille minimale et tous les offsets avant lecture ;
- décoder l’offset du bloc AI, la table des sous-sections, les offsets texte et
  le blob texte ;
- convertir chaque sous-section en buffer canonique propriétaire ;
- rejeter offset hors fichier, chevauchement impossible, overflow, section
  tronquée et operand tronqué ;
- produire une erreur typée, jamais une exception non contrôlée ou une lecture
  au-delà du buffer ;
- fonctionner identiquement sur une fixture, un fichier extrait et le `.dat`
  déjà chargé en mémoire par FF8.

Le domaine ne doit jamais connaître le layout du fichier source.

### 3. VM de contrôle dans `core`

Le décodeur doit connaître la largeur exacte des 61 opcodes afin de conserver
un PC correct, mais G15 n’exécute que ses familles.

Règles obligatoires :

- `0x00` STOP termine normalement ;
- `0x02` lit `subj(1), param(1), cmp(1), value(2), jump(2)` ;
- `0x23` applique un `int16` little-endian signé au PC ;
- `0x0A`, `0x10`, `0x14`, `0x21` sont des NOP sans opérande ;
- `0x0D` et `0x19` consomment exactement un octet réservé ;
- un saut hors sous-section est `MalformedScript` ;
- un opcode inconnu est `MalformedScript`, jamais STOP implicite ;
- la fin du buffer sans STOP est une erreur bornée ;
- une intention d’action avec cible valide donne `ActionWouldCommit` et arrête
  la VM G15 sans appeler le moteur d’action ;
- une intention sans cible donne `ActionHadNoTarget`, reproduit le
  fall-through de contrôle dans l’état canonique, puis continue ;
- tout opcode G16 produit une `DeferredG16Intent` avec ses opérandes décodés et
  aucun effet hôte.

Le natif n’a pas de compteur d’itérations : STOP ou commit valide sont ses
sorties. Le remplacement doit tout de même avoir un budget de sécurité explicite
pour les données malformées. Ce budget est une divergence de sûreté documentée,
pas une prétendue mécanique native. Il ne doit jamais être atteint par le
corpus livré.

### 4. Variables et persistance

Implémente exactement :

- `0x05` scratch ;
- `0x0E` set local et `0x12` add local avec stride natif 52 par slot ;
- `0x0F` set global et `0x13` add global ;
- la sentinelle valeur `0xCB` qui désigne le slot du dernier attaquant ;
- les largeurs et wrap natifs prouvés par la référence.

Les opcodes `0x11` et `0x15` touchent `SG_ITEM_ID_AND_QUANTITY`. Ils sont
l’exception de persistance déjà identifiée : route-les par une intention de
mutation d’inventaire et le service transactionnel G12 existant. Aucun accès
direct à la savemap depuis `core` ou `application`. En live G15, cette mutation
reste simulée dans la copie canonique sauf si un scénario séparé est justifié ;
elle ne doit pas être nécessaire à la promotion.

### 5. IF, sujets et comparaisons

Implémente les six comparateurs canoniques prouvés :

```text
0 ==, 1 <, 2 >, 3 !=, 4 <=, 5 >=
```

Préserve les particularités de polarité des sujets statut/présence. Ne réduis
pas tous les sujets à une comparaison entière générique si le natif utilise une
branche spécialisée.

Le tableau complet de `0x00` à `0x14`, les plages NOP, les slots objet, les
variables globales et les champs par slot doivent être couverts par tests. Les
cas au minimum incluent :

- seuil HP relatif et absolu ;
- statut cible et statut équipe ;
- chance aléatoire `rand % param` avec `param==0` rejeté sans UB ;
- scène, compte vivant, niveau, monstre présent/vivant ;
- toutes les facettes du dernier attaquant ;
- difficulté, vivant, drawable Magic, GF disponible, countdown ;
- somme de statuts de l’équipe ;
- item slots et variables globales.

Utilise la lane RNG canonique existante. Chaque tirage doit être enregistré
dans la trace, dans l’ordre exact, sans RNG locale cachée.

### 6. Ciblage

Implémente les codes symboliques :

- `0xC8` self ;
- `0xC9` membre vivant aléatoire de l’équipe ;
- `0xCA` monstre vivant aléatoire, avec le fallback natif documenté ;
- `0xCB` dernier attaquant ;
- `0xCC`, `0xCD`, `0xCE` groupes ;
- `0xCF` monstre aléatoire autre que soi ;
- `0xD0` variante groupe équipe ;
- `0xD1` attaquant global courant ;
- `0xDC–0xE3` slot stocké dans la table locale ;
- tout autre code comme recherche du premier `com_file_id` correspondant,
  avec le masque invalide natif si absent.

Réutilise les règles canoniques G08 pour vivant, targetable, ordre des slots et
masques. Ne rappelle pas `BattleTarget_SelectByStatusOrStat` natif pour `0x26` :
porte sa sémantique dans `core` et teste-la.

### 7. Orchestration `application`

Expose une entrée semblable à :

```text
run_enemy_ai_control(script, section, actor, state, rng, policy)
  -> AiExecutionReport
```

Elle doit :

- importer un état canonique déjà décodé ;
- exécuter sur une transaction isolée ;
- rendre un diff sémantique explicite ;
- valider les écritures autorisées ;
- annuler entièrement sur malformed/budget/fault ;
- ne jamais appeler le scheduler G14 ni une queue G07 ;
- remettre une `DeferredG16Intent` à G16 sans l’exécuter.

Le live G15 utilise le mode `read_only_shadow` : les variables et cibles sont
calculées dans une copie, la mémoire FF8 ne reçoit aucune mutation de domaine.

## Corpus authentique obligatoire

Les archives installées ont été localisées ici :

```text
C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\Data\lang-en\battle.fi
C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\Data\lang-en\battle.fl
C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\Data\lang-en\battle.fs
```

Identités observées :

```text
battle.fi | 10236    | 0ed9688468e1259a7fd8dc3e16b175f3a9de29b078e34a72d64bce4d97234c03
battle.fl | 30491    | 32de82b1d2354d3544cd496b9e6e7fc2f6ede912b25425297ef4a5028a4e6469
battle.fs | 55456819 | 3565f9638d9ab7a30c47e9931989f32081a0fd01d1d6604b85838bead17b6d16
```

`battle.fl` contient 200 entrées monstres `c0m000.dat` à `c0m199.dat`, avec
quelques entrées placées plus tôt dans l’archive. Ne suppose pas l’ordre
lexicographique : associe `.fl`, `.fi` et `.fs` par index d’archive.

Réutilise l’outillage local existant au lieu d’inventer un extracteur :

```text
D:\Modding\ff8\FF8GameData\fs\fsmanager.py
D:\Modding\ff8\FF8GameData\fs\delingclimanager.py
D:\Modding\ff8\FF8GameData\fs\DelingCli\deling-cli.exe
```

L’extraction est read-only. N’écris jamais dans le dossier du jeu. Utilise un
répertoire temporaire explicite ou un cache ignoré dans le dépôt.

Produis :

- un manifest JSON avec SHA archive, nom `c0mNNN.dat`, SHA du fichier, bornes
  section 8, SHA de chaque sous-section et statut de parse ;
- un histogramme des 61 opcodes et des sujets/cibles ;
- les comptes de JUMP avant/arrière, les SCC du CFG et les sorties possibles ;
- le budget maximal réellement observé sur Init et Turn ;
- une liste minimale de scripts candidats pour le live couvrant le plus de
  familles G15 possible ;
- quelques fixtures réelles petites et hashées dans `tests/fixtures/g15/`, pas
  les 200 fichiers complets si cela gonfle inutilement le dépôt.

Le test CTest portable utilise les fixtures sélectionnées. Le scan des 200
fichiers est un test d’intégration offline obligatoire pour la promotion et
écrit son rapport de preuve, mais il peut être désactivé automatiquement si
l’archive authentifiée n’est pas présente sur une autre machine.

## SQ-G15-001 — boucles

Ne ferme pas cette question par intuition.

Le corpus doit déterminer :

- quels scripts ont des JUMP arrière ;
- si chaque cycle atteignable possède STOP, sortie conditionnelle ou intention
  d’action ;
- combien d’instructions sont exécutées au maximum par Init/Turn avec les
  fixtures bornées ;
- si un script livré peut réellement dépasser le budget de sécurité.

Si aucun script livré ne peut livelock, ferme SQ-G15-001 comme
`static-closed-by-corpus` et garde le budget comme protection des entrées
malformées. Si un cycle sans sortie est trouvé, ne lance aucun soak live :
documente le fichier, laisse la question ouverte et demande une décision avant
promotion.

## Tests offline obligatoires

Ajoute `tests/offline/test_g15.cpp` et les outils/tests Python nécessaires.
Enregistre `G15.ai-control-vm` dans CTest.

Couverture minimale :

1. parse valide des offsets section 8 et de toutes les sous-sections ;
2. fichier court, offsets hors bornes, overflow, sous-section tronquée ;
3. les 61 opcodes ont une largeur connue ;
4. NOP et reserved consomment exactement les bons octets ;
5. STOP, IF vrai/faux et JUMP avant/arrière ;
6. les six comparateurs et leurs cas limites signés ;
7. toutes les banques de variables, wrap et sentinelle `0xCB` ;
8. tous les sujets IF et leurs polarités ;
9. tous les codes cible, absence, groupes et ordre des slots ;
10. RNG déterministe et nombre exact de tirages ;
11. `EXECUTE` cible valide -> `ActionWouldCommit`, zéro action émise ;
12. `EXECUTE` cible vide -> fall-through exact ;
13. chaque famille G16 -> intention différée typée, zéro mutation ;
14. transaction annulée sur malformed et budget dépassé ;
15. scan des 200 `.dat` authentiques, histogramme et analyse CFG ;
16. scripts réels Init/Turn sélectionnés comparés à des traces dorées ;
17. régressions G00–G14, G11/G12 exhaustif et contrats de couche.

Le test de boucle infinie reste hors-ligne. Ne tente jamais de faire tourner un
bytecode malformé dans FF8.

## Contrat runtime et preuves

Étends le protocole de façon versionnée :

- `FF8ISO_EVIDENCE_SCHEMA_VERSION` suivant ;
- `FF8ISO_G15_AI_PROTOCOL_VERSION` ;
- `FF8ISO_SUITE_G15_AI_CONTROL` ;
- `FF8ISO_EVIDENCE_G15_AI_CONTROL` ;
- scénario positif G15 ;
- observation native optionnelle uniquement sur divergence nommée.

Le witness G15 doit rester compact mais contenir au minimum :

- version, scénario et flags d’entrée ;
- slot, section et difficulté ;
- ID/nom logique du `.dat`, SHA fichier et SHA sous-section ;
- PC initial/final et raison d’arrêt ;
- nombre d’opcodes, branches prises/non prises et hash de trace ;
- compte/hash des lectures et écritures de variables ;
- masque cible final et compte des sélections ;
- valeurs et compte exact des tirages RNG ;
- type/hash de l’intention G16 différée ;
- `native_ai_vm_calls`, `forbidden_calls`, `write_guard_violations` ;
- état du garde Odin/Gilgamesh ;
- hashes mémoire avant/après et résultat du cleanup ;
- statut runtime final.

N’expose aucun pointeur, adresse ou buffer `.dat` brut dans le witness.

Ajoute :

- `tests/in-process/G15.suite.toml` ;
- le payload G15 dans `tools/make_suite_payload.py` ;
- la capture dans `tools/capture_runtime_evidence.py` ;
- les règles dans `tools/validate_evidence_envelope.py` ;
- le schéma JSON et ses tests ;
- `[P1.G15]` dans `manifests/ownership-matrix.toml` ;
- `[promotion.G15]` dans `manifests/evidence-policy.toml` ;
- les assertions de `validate_contracts.py`.

## Seam live recommandé

Le live G15 ne doit pas encore prendre réellement le tour ennemi : l’émission
d’action et son handoff appartiennent à G16.

Implémente une exécution in-process contrôlée :

1. le combat est en pause ;
2. le runtime choisit un slot monstre admissible ;
3. il lit le `.dat` déjà chargé et vérifie son SHA contre le manifest corpus ;
4. il importe uniquement l’état canonique requis ;
5. il exécute les sous-sections Init et Turn dans une copie transactionnelle ;
6. il compare les traces aux résultats offline du même fichier ;
7. il ne publie aucune action et n’écrit aucun état de domaine dans FF8 ;
8. il publie le witness puis se désarme proprement.

Pendant cette fenêtre :

- `EnemyAI_VM_ExecuteScript` original doit avoir zéro appel ;
- aucun helper natif de sujet, cible, RNG, action ou queue n’est autorisé ;
- seuls les codecs de lecture runtime et les exports de preuve sont actifs ;
- les canaris et les hashes des plages de combat restent identiques ;
- le `SealedNativePresentationAdapter` G14 reste cohérent mais n’est pas appelé
  par la VM G15.

Si un hook est nécessaire pour auditer l’appel natif, il doit être
observation-only et supprimé avant le verdict. N’ajoute un adaptateur NCOMP G15
que s’il appelle réellement une compatibilité native autorisée ; le chemin
positif G15 ne devrait en appeler aucune.

## Politique live actualisée

La connaissance statique déjà épinglée ne doit pas être rejouée live par
routine.

- pas de session native d’observation par défaut ;
- pas de revalidation des 61 opcodes un par un ;
- pas de test live de bytecode malformé ;
- pas de test live de la dette `0x71` ;
- pas de test d’émission d’action avant G16 ;
- le collector runtime décide PASS/FAIL ; l’opérateur rapporte seulement
  l’état visuel et les gestes effectués ;
- une anomalie visuelle, un acteur bloqué ou un écran noir est un échec même si
  les compteurs sont verts ;
- après `Faulted`, runtime et processus sont terminaux ;
- même DLL hashée pour toutes les captures positives ;
- aucun rebuild au-dessus d’un DLL chargé ;
- rollback/désarmement exact et survie du processus sont vérifiés séparément ;
- un `BUSY` n’est retenté qu’une fois après exactement une frontière de frame.

## Stratégie live minimale

### Session P — une seule session positive

Objectif : prouver la VM de remplacement sur de vrais octets Init/Turn chargés
dans un combat, sans domaine natif et sans mutation hôte.

Le wire public reste celui du jalon :

```powershell
Invoke-IsoGroup -Group G15 -Profile P1
```

Le runtime doit refuser G15 sous `P0`, `Observe` ou tout profil implicite.

Le corpus choisit avant le live le plus petit ensemble de monstres couvrant :

- au moins un IF vrai et un IF faux ;
- une lecture de sujet non triviale ;
- une lecture/écriture de variable ;
- une sélection de cible ;
- un tirage RNG si un candidat courant le permet ;
- STOP et une intention d’action différée.

Préférer une seule formation contenant tout. Si c’est impossible, plusieurs
combats peuvent être faits dans le même processus et avec le même DLL, à
condition que chaque sous-run se désarme et restaure proprement. Un nouveau
processus n’est requis qu’après `Faulted` ou cleanup incomplet.

Déroulé opérateur :

1. Demande si FF8 est fermé avant le dernier rebuild.
2. Compile et fige le candidat. Calcule les SHA EXE/DLL/bootstrap/suite.
3. Demande : « Lance FF8 et dis-moi quand tu es sur la carte du monde. »
4. Prépare le scénario sans mutation.
5. Indique précisément la formation ou la zone choisie par le corpus.
6. Demande : « Lance ce combat, mets-le immédiatement en pause, puis dis
   combat en pause. »
7. Vérifie le PID, l’EXE, les canaris, le slot et le hash du `.dat`.
8. Arme G15 et exécute Init puis Turn sur la copie canonique.
9. Collecte le verdict automatiquement.
10. Demande seulement si l’image, l’UI et les acteurs sont restés normaux.
11. Désarme, restaure les hooks, collecte l’enveloppe post-shutdown.
12. Ne demande pas de quitter le jeu si le collector est `PASS`, `Detached` et
    que le processus est sain.

Critères PASS :

- `.dat` live identique au corpus authentifié ;
- traces Init/Turn identiques aux fixtures offline ;
- PC/branches/variables/cibles/RNG conformes ;
- arrêt STOP ou intention G16 attendu ;
- `native_ai_vm_calls == 0` ;
- `forbidden_calls == 0` ;
- `write_guard_violations == 0` ;
- aucun changement des plages hôtes protégées ;
- aucun écran noir, freeze, ATB anormale ou disparition UI ;
- runtime `PASS`, cleanup `Detached`, processus vivant.

### Session O — uniquement sur divergence nommée

N’ajoute une observation native que si l’un de ces discriminants demeure après
IDA et corpus :

- octets du `.dat` chargé différents du fichier archive ;
- offset de sous-section ambigu ;
- polarité de comparateur impossible à trancher statiquement ;
- nombre de tirages RNG différent sur une fixture réelle ;
- état runtime requis absent du codec canonique.

Écris d’abord la question exacte, la valeur A/B attendue et la capture qui la
fermera. Une observation « pour être sûr » est interdite.

Il n’y a pas de session négative live G15 par défaut. Les malformed, sauts hors
bounds et boucles infinies sont suffisamment et plus sûrement prouvés offline.

## Garde Odin/Gilgamesh

Conserve le feature flag existant
`FF8ISO_BOOTSTRAP_SUPPRESS_RANDOM_SPECIAL_GFS`. Il ne masque que les bits Odin
et Gilgamesh, se réapplique à chaque frame de combat et restaure l’octet exact
au shutdown. Ne touche pas Phoenix, Angelo, Witch ou aux autres bits. Le witness
G15 doit confirmer que le garde est actif durant la session.

## Vérifications avant live

Sans FF8 chargé :

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86
ctest --preset debug-x86 --output-on-failure
cmake --build --preset relwithdebinfo-x86
```

Vérifie explicitement :

- DLL PE32/I386 ;
- export attendu et tailles de structures ;
- schéma/version/payload alignés ;
- corpus 200/200 parsé ;
- traces dorées régénérées seulement depuis l’archive authentifiée ;
- aucun chemin local absolu dans les manifestes ou fixtures ;
- aucun symbole G15 référencé hors de son propriétaire runtime ;
- régressions G00–G14 ;
- aucune modification non voulue des preuves canoniques G14.

## Manifestes et promotion

Avant live, `[promotion.G15]` doit exister avec `satisfied = false` et des
exigences au minimum pour :

- dépendance G14 promue ;
- parser section 8 borné ;
- VM U15.1–U15.7 complète ;
- corpus authentique 200/200 ;
- SQ-G15-001 fermé par corpus ou explicitement non bloquant et borné ;
- action emission disabled ;
- zéro appel VM/helper natif ;
- enveloppe live positive représentative ;
- cleanup exact et survie du processus.

Ne passe `satisfied = true` qu’après l’enveloppe positive post-shutdown sur le
hash final. Ne prétends pas que G16 est commencé ou que les tours ennemis sont
entièrement remplacés.

## Documentation et mémoire Oxygen

Produis au minimum :

- `evidence/g15-ai-control-offline-validation-YYYY-MM-DD.md` ;
- `evidence/g15-ai-corpus-YYYY-MM-DD.json` ;
- `evidence/g15-ai-control-live-promotion-YYYY-MM-DD.md` après le live ;
- l’enveloppe JSON finale sous `evidence/battle-iso/` ;
- README, matrice d’ownership, evidence policy, ABI ledger et address map ;
- la résolution ou l’état précis de SQ-G15-001.

Après le checkpoint corpus, puis après la promotion live, utilise le skill
`ff8-evidence-wiki-ingest` et compile l’index QMD. Les pages canoniques doivent
distinguer :

- prouvé statiquement ;
- prouvé par corpus offline ;
- prouvé live ;
- intention G16 seulement reconnue ;
- dette encore ouverte.

## Stop conditions

Arrête-toi et explique précisément si :

- l’identité EXE ou archive ne correspond pas ;
- le corpus ne contient pas exactement les 200 `c0mNNN.dat` attendus ;
- le parser trouve un offset ou opcode impossible à expliquer ;
- un cycle livré peut livelock ;
- une règle exige un helper de domaine natif ;
- une structure ABI devrait remonter dans `core` ou `application` ;
- une action G16 devrait être exécutée pour faire passer G15 ;
- G14 cesse de passer ou sa promotion est altérée ;
- FF8 est encore chargé avant un rebuild ;
- le runtime devient `Faulted`, le cleanup est incomplet ou l’affichage régresse.

## Rapport final attendu

Rends un rapport compact avec :

- fichiers G15 ajoutés/modifiés, séparés du diff G14 préexistant ;
- couverture U15.1–U15.7 ;
- résultat corpus 200/200, histogramme et analyse des boucles ;
- tests et nombre final CTest ;
- SHA archive/EXE/DLL/enveloppe ;
- verdict live et cleanup ;
- appels natifs et écritures interdites ;
- statut SQ-G15-001 ;
- dettes strictement reportées à G16+ ;
- statut de `promotion.G15` ;
- pages Oxygen mises à jour et smoke queries QMD.
