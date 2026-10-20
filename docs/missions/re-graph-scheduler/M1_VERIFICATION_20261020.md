# M1 — étape D : vérification réelle HEAD / HEAD+T3 / candidat du 2026-10-20

## Verdict final — phase 3 autorisée par le superviseur

**Suites applicables du harness : PASS, non-régression T3 vérifiée dans ce
périmètre. M1 global reste BLOCKED, non intégré.** Les suites complètes finissent
dans les trois espaces ; **aucun FAIL**, un même SKIP historique conservé.
Le contrôle C isole exactement T3 : tous les **930 PASS HEAD sont conservés**,
avec **55 nouveaux PASS et exactement 125 assertions supplémentaires**.
Le candidat complet avec travail utilisateur conserve aussi tous les cas de C.

### Tableau final à trois colonnes

Autorisation explicite supplémentaire : **`bun test` borné à 300 s dans les
trois espaces**, Q1/typecheck restant bornés à **60 s**. Ce changement n'est ni
implicite ni rétroactif : les douze reçus précédents restent intacts. La phase 3
ajoute neuf reçus, soit **21 commandes de suites conservées au total**.

| Commande (borne) | Baseline HEAD | C = HEAD + T3 seul | Candidat-repo HEAD + utilisateur + T3 |
|---|---|---|---|
| `bun test` (300 s) | **PASS**, code 0 ; **930 PASS / 0 FAIL / 1 SKIP**, 931 tests, 28 fichiers, 77 454 assertions ; **174,713 s** | **PASS**, code 0 ; **985 PASS / 0 FAIL / 1 SKIP**, 986 tests, 29 fichiers, 77 579 assertions ; **163,796 s** | **PASS**, code 0 ; **1 209 PASS / 0 FAIL / 1 SKIP**, 1 210 tests, 41 fichiers, 79 703 assertions ; **212,990 s** |
| `bun run test:q1-primitives` (60 s) | **N/A**, code 1 : script absent, aucun test ; 0,039 s | **PASS**, code 0 ; **55 PASS / 0 FAIL**, 125 assertions ; **0,078 s** | **PASS**, code 0 ; **55 PASS / 0 FAIL**, 125 assertions ; **0,084 s** |
| `bun run typecheck` (60 s) | **PASS**, code 0 ; **4,082 s** | **PASS**, code 0 ; **4,089 s** | **PASS**, code 0 ; **4,977 s** |

Durées murales d'un run, pas une mesure statistique de performance. Les trois
commandes `bun test` ont terminé avant leur borne, sans timeout ni erreur hors
test. Le code 1 du script absent en baseline n'est pas un test rouge.

### Attribution, couverture et invariant de comparaison

- **HEAD → C : 931 identités/statuts strictement identiques** (930 PASS,
  1 SKIP), zéro cas manquant, zéro statut changé. Les **55 seuls ajouts sont
  exactement les tests `generic-target-primitives`**, tous PASS. Aucun seuil,
  oracle, test existant ou garde HEAD modifié. Q1 isolé et typecheck passent
  donc sans dépendre des changements utilisateur non commités.
- **C → candidat-repo : 986 identités/statuts strictement identiques**, zéro
  cas manquant/changé ; **224 PASS supplémentaires** proviennent du travail
  utilisateur antérieur, pas du delta T3. Les 39 familles TS du candidat sont
  effectivement exercées dans la suite complète ; les compteurs ne sont pas
  assimilés à une nouvelle qualification des contrats C# manquants.
- **Échecs produit préexistants mesurés : 0. Régressions nouvelles mesurées :
  0 dans les suites applicables exécutées.** Les 144 FAIL ENOENT et l'erreur
  initiale du candidat harness-only sont des **artefacts de méthode**
  (implantation/entrées absentes), pas des régressions. Les sorties rouges
  originales restent intégralement conservées, non réécrites.
- Le **même unique SKIP** dans les trois espaces est
  `scripts/role-sharing-offline.test.ts` : intégration réelle cross-project
  FF8/Ensemble non disponible. Sa garde reste intacte ; ce SKIP n'est ni un
  PASS ni une qualification de cette intégration. Les trois anciens SKIP
  liés aux données raw98 deviennent de vrais tests exécutés grâce à la
  disponibilité du gel de données, sans retirer leur garde.

### Implantation et fixtures possédées

Racine conservée :
`C:/Users/djden/AppData/Local/Temp/opencode/mission-m1-verify-20261020T132358307Z/`.

- HEAD : `baseline/tools/ff8-harness` ; C : `control-t3/tools/ff8-harness`.
  Le diff suivi de C reste exactement le delta T3 : trois ajouts pins et
  seulement la ligne package/bloc README documentés plus bas.
- **Nouveau candidat** : `candidate-repo/tools/ff8-harness`. Les 3 843 fichiers
  du premier candidat, dépendances comprises, ont été copiés physiquement et
  comparés par SHA-256 ; aucun changement de code n'a corrigé le premier essai.
  Le premier `candidate/ff8-harness` et ses reçus restent intacts.
- Cinq JSON de données requis sous `docs/` : registres battle/indirect/magic,
  `native-groups.json`, `native-pe-verification.json`, copiés depuis le principal
  et hashés individuellement. Leurs hashes bruts diffèrent de ceux du checkout
  HEAD, mais leurs **JSON parsés sont strictement identiques** ; aucun résultat
  attendu n'a été fabriqué depuis le candidat.
- Le gel **raw98, 99 JSON / 1 669 325 octets** manifest compris, a été copié
  à l'identique dans **les trois espaces** sous
  `.tmp/ff8-decomp-semantics-20261011-r01/native/`. Les 98 tailles/hashes du
  manifeste sont vérifiés. SHA-256 du manifeste :
  `79790bef2ea8c38d64ab8e18c4578e1b8593958aa689da88c2466063c5b177d5`.
  Ce sont des données gelées, pas un lancement live ni une nouvelle preuve OS.
- Seul répertoire de sortie supplémentaire :
  `candidate-repo/.tmp/L8_PHASE_A_V2`, créé vide pour le registre append-only
  produit par les tests existants. Aucun ancien historique/base volumineux n'a
  été copié ; les tests ont produit leurs propres fixtures possédées, conservées
  et référencées dans les flux et le registre. Aucune écriture du registre source.
- Aucun réseau, install ou junction ; dépendances physiques identiques. Les
  **302 copies d'entrées** et leurs originaux sont relus après tests sans
  divergence ; les 3 843 fichiers harness d'origine et du candidat-repo restent
  byte-exacts. HEAD principal toujours
  `bba8eb91f38828cab88251a9be0de1f5f179fb1b`.

### Zéro C# final — tout l'espace `candidate-repo`

**PASS ciblé : 3 948 fichiers / 107 232 736 octets**, y compris dépendances,
cinq docs JSON, raw98 et registre généré. **0 `.cs`, 0 source embarquée détectée,
0 PE managé, 0 commande réelle de compilation .NET**. Huit PE natifs relus par
MZ/PE32+/entrée CLR, dont les deux addons `.node` ; zéro en-tête ambigu/tronqué.
Les trois hits lexicaux `csc` sont les mêmes faux positifs mathématiques/HTML
explicités dans l'historique ; aucun n'a été ignoré silencieusement.

Ce périmètre **n'est pas tout le checkout principal ni l'arbre livré de main**.
Les équivalents complets Q1/builder/environnement/politique, Q2a/Q2b1 et V3
partagés restent manquants selon T3 ; leurs routes historiques n'ont été ni
relancées en retirant leur garde ni requalifiées par ces tests TS. Aucun live,
IDA, Job/arrêt garanti des descendants, sandbox FS/réseau ou comportement du
code scientifique reconstruit n'est acquis. **Pas d'acceptation globale M1,
pas de GO M2 ; décision d'intégration réservée au superviseur.**

### Reçus finaux

[`M1_VERIFICATION_20261020.json`](M1_VERIFICATION_20261020.json) : `commands`
conserve les **21 stdout/stderr complets**, versions, codes, UTC et bornes par
commande ; `threeColumnComparison` = tableau final, `controlledT3` et
`repositoryComparison` = qualification/comparaisons nominatives ; `zeroCSharp`
= audit de tout le nouveau candidat. Hashes, copie des 302 entrées, registre
généré et scripts possédés sont référencés. Les agrégats antérieurs sont aussi
conservés sous `<racine>/M1_VERIFICATION_20261020.round1.json` et `.round2.json`.

<details>
<summary>Historique conservé des phases 1/2 — états intermédiaires dépassés par la phase 3 ci-dessus</summary>

**Verdict intermédiaire : BLOCKED — qualification globale alors non acquise.**
Les **douze commandes** des deux phases ont réellement été exécutées, avec
conservation de tous les reçus. Le contrôle C autorisé par le superviseur isole
exactement T3 : **315 PASS existants et 2 SKIP identiques à HEAD**, plus
**55 PASS Q1** ; Q1 isolé et typecheck passent également sur **HEAD+T3 seul**.
Les suites complètes HEAD et C atteignent toutes deux 60 s, sans bilan final.
Le candidat HEAD+travail utilisateur+T3 reste privé de données et de chemins
relatifs dans sa copie harness-only. **Aucune régression T3 observée dans le
sous-ensemble mesuré ; aucune preuve globale d'absence de régression.**

Autorité : [ordre M1, §5D](ORDRE_MISSION_01_RETRAIT_CSHARP_20261020.md),
instructions T4 explicites du superviseur. Exécutant : `m1-t4-verify`.
La validation finale et toute intégration restent réservées au superviseur.

## 1. Espaces neufs et provenance

Racine possédée, conservée sans nettoyage :
`C:/Users/djden/AppData/Local/Temp/opencode/mission-m1-verify-20261020T132358307Z/`.

- **Baseline** : `baseline/tools/ff8-harness`, dans un clone local effectué par
  `git clone --no-hardlinks C:/Users/djden/source/repos/retro-eng/re-ff8 <racine>/baseline`.
  HEAD vérifié : `bba8eb91f38828cab88251a9be0de1f5f179fb1b`, arbre suivi pré-T3.
- **Candidat** : `candidate/ff8-harness`, copie physique neuve de l'intégralité
  de `tools/ff8-harness` du checkout principal, **avec les changements non
  commités**. Les cinq pins de `M1_REMPLACEMENTS_20261020.json` correspondent.
  Les 3 843 fichiers / 92 481 985 octets ont été comparés par SHA-256 entre
  origine et copie ; identité exacte à la création.
- **C / HEAD+T3 seul** : `control-t3/tools/ff8-harness`, dans un **nouveau clone
  local sans hardlinks** de `baseline`, même HEAD. Ajouts : les seuls trois
  fichiers source/test/fixture T3, dont les pins ont été revérifiés. Modifications :
  la seule ligne `test:q1-primitives` de package et le seul bloc README M1.
  Retirer ce bloc README redonne exactement le README HEAD ; aucun script de
  coordination ni changement utilisateur de package n'a été emporté.
  Le `git diff` et les fichiers non suivis contrôlés avant/après tests montrent
  **exactement deux modifications et trois ajouts**. Package C SHA-256 :
  `fc8dce2a3227ba228f2f815667e5b2f49b914d283c26d325ea24fd99dc5f184f`.
- **Dépendances** : copie physique locale de `node_modules` dans chaque espace,
  **aucune junction**, aucune installation ni requête réseau. Baseline :
  3 493 fichiers / 88 061 705 octets, identité par fichier vérifiée ; les mêmes
  3 493 hashes ont aussi été contrôlés dans C.
- **Versions** : Bun `1.4.2 (744846f84)`, TypeScript `5.9.3`, Windows x64.
  Node CLI `v24.11.1`. Les scripts de mesure s'exécutent sous Bun ; sa valeur
  de compatibilité `process.version` est `v26.3.0`, pas la version du Node CLI.

**Limite du témoin HEAD :** hors dépendances, baseline = 263 fichiers,
candidat = 350 ; 87 ajouts et 12 modifications, aucun retrait. T3 ne représente
que trois de ces ajouts et les modifications package/README. Il existe aussi
des changements antérieurs non commités, notamment graph-integration/codecs
et dix fichiers `src` modifiés. Cette A/B ne permet donc pas d'attribuer tout
écart à T3. Liste exhaustive dans le reçu JSON, champ `abFiles`. **C supprime
ce facteur de confusion pour comparer T3 à HEAD**, mais ne rend pas complet
un run interrompu par la borne.

## 2. Résultats à trois colonnes — borne 60 000 ms par commande

Les commandes sont lancées dans le répertoire harness propre à chaque espace.
L'environnement est hérité sans changement de variables ni retrait de garde.
Temps = durée murale mesurée autour du processus, pas benchmark statistique.
Tableau : **baseline phase 2 / C phase 2 / candidat phase 1**. La seconde phase
ajoute six exécutions baseline/C, sans écraser les six premières. Le candidat
initial n'a pas été déplacé, complété artificiellement ni relancé.

| Suite | Baseline HEAD | C = HEAD + T3 seul | Candidat HEAD + utilisateur + T3 |
|---|---|---|---|
| `bun test` | **TIMEOUT**, 60,067 s ; code nul/ETIMEDOUT ; **315 PASS / 0 FAIL / 2 SKIP partiels**, sans bilan final | **TIMEOUT**, 60,066 s ; code nul/ETIMEDOUT ; **370 PASS / 0 FAIL / 2 SKIP partiels**, sans bilan final | **FAIL**, code 1, 37,587 s ; **1 031 PASS / 144 FAIL / 4 SKIP**, 1 erreur hors test ; 1 179 tests, 41 fichiers, 76 510 assertions |
| `bun run test:q1-primitives` | Code 1, 0,046 s ; script absent, **aucun test exécuté** | **PASS**, code 0, 0,080 s ; **55 PASS / 0 FAIL**, 125 assertions | **PASS**, code 0, 0,071 s ; **55 PASS / 0 FAIL**, 125 assertions |
| `bun run typecheck` | **PASS**, code 0, 3,739 s | **PASS**, code 0, 3,717 s | **PASS**, code 0, 4,022 s |

Verdicts **C contre HEAD**, sans travail utilisateur :

- Suite complète : **ABSENCE DE MESURE FINALE** dans les deux espaces ; le
  timeout est reproduit sans T3. Comparaison nominative des résultats atteints :
  **315 PASS + 2 SKIP communs, zéro statut changé, zéro cas commun manquant** ;
  les **55 seuls résultats supplémentaires de C sont exactement les tests Q1,
  tous PASS**. Aucun recul constaté sur cette fraction, pas sur toute la suite.
- Q1-primitives : **PASS du port T3 isolé** ; HEAD n'a pas cette commande
  (**N/A**), ce code 1 baseline n'est pas un test rouge ni une régression.
- Typecheck : **PASS / PASS**, non-régression observée, aucun emit.

Première baseline conservée : timeout 60,058 s, 326 PASS / 0 FAIL / 2 SKIP
partiels ; Q1 absent en 0,037 s ; typecheck PASS en 3,426 s. La variation du
nombre de tests atteints à 60 s n'est pas un changement de couverture : les
deux runs ont été interrompus avant bilan, à des points différents.

Horodatages UTC, versions, arguments, cwd, erreurs, codes, stdout/stderr
**complets** des douze exécutions :
[`M1_VERIFICATION_20261020.json`](M1_VERIFICATION_20261020.json), champ `commands`.
`threeColumnComparison` sélectionne les reçus du tableau ; `controlledT3`
contient la comparaison nominative C/HEAD. Le reçu agrégé original de phase 1
est conservé en plus sous `<racine>/M1_VERIFICATION_20261020.round1.json`.
Les octets bruts des deux flux sont également conservés sous `<racine>/logs/`,
avec chemins, tailles et SHA-256 dans chaque reçu. Aucun premier reçu n'est
écrasé par une relance.

### Échecs réellement observés et attribution

- **Baseline et C :** aucun FAIL avant interruption, mais absence de bilan final.
  Il serait faux d'en déduire que la suite complète est verte ou qu'aucun
  échec préexistant n'existe au-delà des tests atteints.
- **Candidat : les 144 FAIL comportent tous un ENOENT** dans leur diagnostic
  individuel. Ils concernent neuf fichiers de tests. Les données attendues
  comprennent notamment les registres battle, `native-groups.json`,
  `native-pe-verification.json` et les schémas via une racine de dépôt.
  La copie `candidate/ff8-harness` n'est pas située dans un dépôt complet
  `tools/ff8-harness` ; les chemins `../../docs` et certains chemins reconstruits
  pointent donc vers des fichiers absents. Une erreur hors test concerne aussi
  `schemas/graph-snapshot-v1.schema.json` sous la racine attendue.
- Dix-sept de ces tests avaient déjà PASS dans la portion observée en
  baseline : leurs FAIL ENOENT candidat démontrent un défaut d'applicabilité
  de l'espace, pas une preuve de régression du produit ou du port T3.
- **Échec produit préexistant prouvé dans cette A/B : aucun. Régression produit
  prouvée : aucune. Absence globale de régression : NON DÉMONTRÉE.**
  Les échecs d'implantation/données ne sont pas requalifiés artificiellement
  en échecs préexistants, et le timeout n'est pas un PASS.
- Les quatre SKIP sont les gardes existantes : intégration cross-project
  Ensemble indisponible et trois vérifications du gel natif indisponible.
  Elles n'ont pas été retirées ; aucune garantie n'est acquise par ces SKIP.

Les noms, fichiers et diagnostics de chaque FAIL/SKIP sont conservés dans
`analysis` du JSON. Les répétitions du récapitulatif Bun ont été exclues du
comptage : il y a bien **144**, et non 288 FAIL, et **4**, non 8 SKIP.

Le superviseur a autorisé **C = HEAD+T3 strict**, pas un contournement des
fixtures manquantes du candidat initial. Le contrôle C est réalisé et conservé ;
le premier candidat et tous ses rouges restent intacts. Aucune réparation de
chemin ni copie de données supplémentaire n'a été improvisée.

## 3. Couverture et invariants : acquis et non acquis

- Copie initiale intégrale byte-exact : aucun test, seuil, oracle ou garde
  existant du candidat n'a été supprimé pour produire ces mesures.
- Les **39 familles TypeScript** recensées dans T3 restent présentes ; leur
  qualification globale ne peut cependant pas être annoncée avec cette suite
  complète non comparable. La présence des fichiers ne suffit pas.
- Les **55 tests Q1-port** passent aussi bien isolément que dans la suite
  candidat **et dans C, indépendamment du travail utilisateur** : constantes,
  exemples argv indépendants, refus et bornes UTF-16,
  compteurs d'octets réels et self-check du golden indépendant conservés.
  Les 125 assertions isolées ne constituent ni un codec canonique complet ni
  une équivalence du Q1 entier.
- Dans C, les **315 tests existants réellement atteints** conservent exactement
  leur identité et leur statut PASS face à la baseline contemporaine ; les deux
  SKIP restent SKIP. Le fichier de comparaison nomme tous les cas observés ;
  aucun seuil ni oracle HEAD n'a été changé. Les tests non atteints restent
  **non mesurés**, pas implicitement validés.
- Aucune garantie manquante de Q05–Q08/Q10–Q12, du reste de Q09, du broker,
  du dual-capture ou des parties partagées V3 n'est acquise par ce port limité.
- Les anciennes routes complètes Q1/Q2a/Q2b1 de compilation/exécution et les
  préparations historiques encore dépendantes du C# restent **BLOCKED pour
  une qualification sans C#**. Elles n'ont pas été exécutées en contournant
  leur garde, ni modifiées. Références précises : `blockedRoutes` du JSON et
  `M1_REMPLACEMENTS_20261020.json`.
- Le timeout logiciel borne la commande mesurée ; **il ne prouve pas l'arrêt
  de tous ses descendants**, ni une isolation OS/FS/réseau. Aucun Job Object,
  budget cross-process, capacité live ou comportement du code scientifique
  reconstruit n'est qualifié ici.

## 4. Contrôle zéro C# — périmètre exact du candidat harness

**PASS dans `candidate/ff8-harness`, dépendances physiques comprises.**
Ce contrôle ne porte **pas** sur l'ensemble du dépôt `re-ff8` ni sur l'arbre
Git final de main ; il ne prouve donc pas le critère global M1 à lui seul.

- 3 843 fichiers / 92 481 985 octets relus : **0 fichier `.cs`**, aucun lien
  ignoré, aucun candidat de source embarquée détecté.
- **8 PE réellement identifiés par leur contenu**, pas par leur extension :
  six launchers `.exe` de `node_modules/.bin` et deux addons `.node`.
  Pour chaque fichier : en-tête MZ, `e_lfanew`, signature PE, optional header
  PE32/PE32+ et entrée CLR `DataDirectory[14]` relus avec bornes.
  **8 natifs, 0 PE managé, 0 MZ/en-tête ambigu ou tronqué** ; RVA et taille CLR
  nulles pour tous les PE. Hashes et valeurs détaillés conservés.
- **0 commande réelle de compilation .NET** dans les scans de contenu UTF-8
  et UTF-16LE pertinent. Trois hits lexicaux `csc` ont été examinés : deux
  tokens mathématiques de cosécante dans le surligneur syntaxique Effect et
  le token HTML d'autofill `cc-csc` de TypeScript. Ce ne sont pas des commandes
  de compilation ; aucun hit n'a été écarté silencieusement.

Méthode, résultats bruts et disposition des faux positifs : `zeroCSharp` du JSON ;
script possédé `<racine>/audit.cjs`. Un PE managé aurait été signalé comme .NET,
sans prétendre pouvoir identifier son langage source d'origine.

## 5. Préservation, reçus et limites

- Relecture des **3 843 fichiers d'origine** après mesures : **0 changement
  ni disparition** par rapport aux hashes initiaux. Les cinq pins T3 restent
  exacts dans le checkout principal et le candidat. HEAD principal inchangé,
  y compris après la seconde phase C. Le diff C est identique avant/après tests.
- Aucune écriture Git dans le checkout principal, aucun stash/reset/clean/
  checkout, aucune suppression ou déplacement de C#, aucun push/amend.
  Seules écritures de cette étape dans ce checkout : ce Markdown et son JSON.
- Ni action live/IDA, ni configuration globale, ni agent supplémentaire,
  ni ressource Docker, ni action d'alimentation. Espaces et reçus conservés.
- Context Mode a exécuté et analysé les sorties volumineuses. GrepAI MCP a
  échoué deux fois ; racine commune/config/index vérifiés avant scans exacts
  ciblés. Index présent, watcher au repos et backend arrêté observés : aucune
  fausse conclusion « index absent », aucun redémarrage/reconfiguration.
- Une première invocation préparatoire par le runtime shell de Context Mode
  n'a pas trouvé `git` avant toute copie/clone. Le même script a ensuite été
  exécuté dans son runtime JavaScript fonctionnel ; les tests n'ont pas été
  réinterprétés à partir de cette erreur d'outillage.
- Les grosses sorties d'inventaire Git restent référencées/hashées dans
  l'espace possédé, plutôt que recopiées dans le document de livraison.
  Les douze stdout/stderr de tests, eux, sont entièrement embarqués dans le JSON.

**Décision attendue du superviseur :** conserver M1 BLOCKED ; le delta T3 isolé
dispose de résultats Q1/typecheck et de 315 cas communs positifs réels, mais pas
d'une qualification complète. Une mesure finale comparable reste à établir
sans relever les bornes ni désactiver de garde. Les équivalents RMS sans C#
manquants restent une condition distincte, même si cette mesure devenait verte.

</details>
