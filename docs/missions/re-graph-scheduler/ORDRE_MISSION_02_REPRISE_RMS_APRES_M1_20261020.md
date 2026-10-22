# Ordre de mission 02 — Handoff et reprise RMS après retrait du C#

Date : 2026-10-20. Révision : réception post-M1 du même jour.
Amendement utilisateur du 2026-10-22 : vérification renforcée, autonome et bornée
(§7.1), avec condition d'arrêt explicite (§8). Cet amendement ne lance pas M2.
ID proposé : `rms-m2-reprise-apres-m1-20261020`.

**Statut : prérequis M1 vérifié, ordre de reprise actualisé ; M2 NON LANCÉE.**
M1 est `ACCEPTED_INTEGRATED` : intégration `e1a97a0`, clôture `54c689c`, helper
conservé sur `dev/windows-process-supervision`. Le présent ordre tient compte de
l'arbitrage utilisateur A09 et des résultats réels ; il ne demande plus de refaire
la migration. La demande de consulter M1 et d'actualiser ce document n'est pas un
GO d'exécution de M2. Aucune ancienne tâche n'est relancée automatiquement.

## 1. Finalité et autorité de reprise

Poursuivre le **RMS statique sans C#**, avec une cible de livraison générique
dans OpenCode V2 :

`faits d'un exécutable → graphe → groupes → plan → sous-agents → revue/réconciliation → connaissance durable → prochain travail`.

Le cœur déterministe calcule ; le plugin propose les tâches et contrôle les
contrats ; OpenCode possède les sessions, outils et permissions. Ne créer ni
standalone concurrent, ni second scheduler d'agents, ni dépendance obligatoire
à FF8 ou à un backend Windows renforcé.

**A09 est tranché** : pour l'acceptation de M1, le RMS est la route statique
`@re-ff8/mission-harness` (`tools/ff8-harness`, Bun/TypeScript). Cela ne démontre
pas qu'un plugin RMS générique est déjà installé ou intégré de bout en bout dans
OpenCode. Son raccordement public reste à identifier et à vérifier au jalon
d'intégration ; ne pas rouvrir A09 comme blocage de la reprise statique.

Ordre de lecture : présent document et M1 ; bilan/manifeste M1 réels ; rapports
de qualification cités ; contrats concernés. L'ancien journal et les checkpoints
ne sont consultés qu'ensuite pour une preuve précise, pas chargés intégralement.

Pour ce périmètre, les décisions utilisateur du 2026-10-20, dont l'arbitrage A09
enregistré dans M1, et les deux nouveaux ordres remplacent les instructions
historiques incompatibles. L'ancien
`HANDOFF_MISSION_20261020.md` reste une source historique, pas une file à relancer
à l'identique. Les gels et anciens verdicts ne sont pas réécrits.

## 2. Réception de M1 effectuée — base de la reprise

### 2.1. Références de clôture et contrôles relus

- [Bilan M1](M1_RETRAIT_CSHARP_BILAN.md), SHA-256
  `afda6297a99d468096d9cb638a25e8c85879e4d50dfa9a5a547e6c5267f7e64d`.
- [Manifeste final M1](M1_RETRAIT_CSHARP_MANIFEST.json), SHA-256
  `5105e39efeb456fdb1c91865709884e54f1e2bc69d1eb5ce62637edc20167316`.
- Base M1 : `bba8eb91f38828cab88251a9be0de1f5f179fb1b` ; delta intégré :
  `e1a97a0e3ab8351f32545d25437caafbebeebef5` ; HEAD de clôture reçu :
  `54c689c4cc671dd3b2a42732b066594e8c0923f8`. La ref locale de suivi
  `origin/main` désigne aussi ce dernier commit lors de cette réception.
- Archive : branche `dev/windows-process-supervision`, commit
  `9f789ff931a3dfe2aeb6497addd067368faffb88`, worktree
  `C:/Users/djden/source/repos/retro-eng/re-ff8-helper-win-wt`, racine
  `windows-process-supervision/`. Ses 1 471 copies / 17 919 783 octets sont
  documentées dans [le reçu de préservation](M1_HELPER_PRESERVATION_20261020.md).
  Le blob Git `PRESERVATION_MANIFEST.json` a été relu : SHA-256
  `47f8cc88fd7e9cdf7a85702b4d6426e62b217762a291c8575e44c7765d90102d`, conforme.

Les cinq pins T3 (source, tests, référence JSON, package et README) ont été
comparés aux fichiers actuels : cinq conformes. L'arbre Git reçu ne contient
aucun chemin `.cs`/projet C# ; les audits par contenu de M1 portent aussi sur
les sources embarquées, PE managés et commandes .NET. Aucun test produit n'a
été relancé pour cette actualisation documentaire.

Obsidian concorde : `qmd://ff8-wiki/projects/re-ff8/references/rms-m1-retrait-csharp-20261020.md`
(`#259e66`), notamment clôture/intégration lignes 30–35 et A09 lignes 69–72.
Cette note est une synthèse ; les reçus du dépôt restent les preuves primaires.

Certains paragraphes du bilan, du mapping et du rapport de vérification
conservent les états intermédiaires « BLOCKED », « A09 ouvert » ou « non intégré ».
Ils ne rouvrent pas M1 : le statut final du manifeste et le §7 du bilan
enregistrent l'arbitrage et l'intégration ultérieurs. Pour le reçu T4 final,
utiliser l'empreinte relue ci-dessous, pas les anciennes empreintes conservées
dans des récapitulatifs de phases précédentes.

### 2.2. Ce qui a réellement changé — et ce qui n'a pas été porté

L'arbre main de départ ne livrait déjà pas de C# : les 325 fichiers `.cs`
étaient des gels hors index. Après préservation, l'utilisateur a autorisé le
retrait physique de 1 261 fichiers internes du checkout. Le reçu préalable
[M1_RETRAIT_GELS_20261020.json](M1_RETRAIT_GELS_20261020.json), SHA-256
`f735859906c68a5f6a6896fbf6bb092b4f4cec48919edca744984014e80f057b`, documente
ce retrait contrôlé. **Les anciens chemins `origine` ne sont plus une garantie
de présence sur main** : résoudre les sources retirées par le mapping de
l'archive, sans les recopier dans main ni relancer les scripts historiques.

Delta livré : `src/generic-target-primitives.ts`, son test et sa référence JSON
sous `tools/ff8-harness/`, script `test:q1-primitives` et documentation du paquet.
Il couvre Q01/Q03/Q04 (modes/refus et quoting Windows borné à 128 arguments /
32 766 unités UTF-16), avec une sous-partie Q09 de comptage d'octets. Référence
indépendante ; adaptation `bool + out` vers objets `{ok,...}` documentée.

Le mapping conserve 112 familles : 39 TS inchangées, trois portées, un
autocontrôle de référence Q02, une famille Q09 partielle, 57 BLOCKED historiques,
huit Windows archivées et trois plans non qualifiés. **Ce ne sont pas des
compteurs de tests exécutés.** A09 tranche qu'aucune des 57 familles BLOCKED
n'est requise sur main pour la route statique acceptée. Ne pas transformer ces
57 familles en backlog obligatoire de portage et ne pas les déclarer qualifiées.

V01 (`BudgetedEvidenceTests`) et V04 (`HostSourceTests`, WriterLedger/CaptureWiring)
sont explicitement renvoyées à la définition de M2. Leurs mécanismes huit slots,
crédit prépayé, HOLD sticky, capture/readback/ACK ne deviennent pas automatiquement
des exigences du cœur statique : l'étape 1 de M2 doit distinguer les invariants
métier réellement consommés des mécanismes du helper archivé.

### 2.3. Base de non-régression qualifiée

Le [reçu T4 final](M1_VERIFICATION_20261020.json) contient 21 exécutions conservées,
dont la phase 3 comparable ; taille 1 644 852 octets, SHA-256 relu
`133b647a669de9d093556016575fc3bc97f8da2eed84ecea30344eda089da27e`.

- Baseline : 930 PASS / 0 FAIL / 1 SKIP, 931 tests, 77 454 assertions.
- Baseline + T3 seul : 985 PASS / 0 FAIL / 1 SKIP, 986 tests, 77 579 assertions.
- Candidat avec travail utilisateur + T3 : 1 209 PASS / 0 FAIL / 1 SKIP,
  1 210 tests, 79 703 assertions.
- Comparaisons nominatives : les 931 identités/statuts baseline sont conservées
  dans le contrôle ; +55 tests Q1 / +125 assertions. Le candidat conserve les
  986 identités du contrôle et ajoute 224 PASS issus du travail utilisateur,
  **pas du delta M1**. Q1 ciblé et typecheck passent également.
- Le SKIP commun de `scripts/role-sharing-offline.test.ts` est historique et
  concerne l'intégration réelle cross-project Ensemble : il ne vaut pas PASS.
  Le plugin RMS générique n'est pas qualifié de bout en bout par ce SKIP.

Les premiers essais incomplets/ENOENT ne sont pas la baseline : la phase 3
fournit les résultats ci-dessus après implantation cohérente des fixtures.
Commandes connues, depuis `tools/ff8-harness` : `bun run test:q1-primitives`,
`bun run typecheck`, `bun test`. Bornes utilisées dans M1 : 60 s pour les deux
premières, 300 s pour la suite complète ; ce ne sont pas des autorisations de
rejeu automatique dans M2.

Pour préparer un espace de vérification, préserver l'implantation relative du
dépôt et les données d'entrée : notamment les cinq JSON `docs/` référencés par
T4 et le gel raw98 sous `.tmp/ff8-decomp-semantics-20261011-r01/native/`
(99 JSON avec manifeste, 98 payloads vérifiés ; SHA du manifeste
`79790bef2ea8c38d64ab8e18c4578e1b8593958aa689da88c2466063c5b177d5`).
Ce sont des données gelées à lire, **pas une reprise de la campagne run01**.
Ne pas remplacer des données manquantes par un skip, une attente issue du
candidat ou un lancement live.

### 2.4. Contrôle d'entrée restant à faire au GO M2

Le prérequis de migration est satisfait ; un **GO explicite M2 reste requis**.
Au démarrage, relever le HEAD et l'état de travail réels. Le checkout contient
encore du WIP scientifique modifié/non suivi : les 1 209 PASS de l'espace
candidat ne prouvent pas que tous ces fichiers figurent dans le commit livré.
Ne pas les perdre ni les intégrer en bloc sous couvert de la clôture M1.

Réutiliser les preuves applicables sans rejouer systématiquement les suites.
Si une source/entrée a changé, qualifier l'impact et les tests nécessaires.
Tenir un seul journal de reprise : provenance post-M1, correspondance
commit/WIP/gels, décisions V01/V04 et file réellement prête. Ne pas rouvrir A09,
réinventorier tout le C# ou refaire la préservation déjà vérifiée sans dérive
constatée. Un besoin nouveau ne modifie pas rétroactivement l'acceptation M1.

## 3. Garanties permanentes de la suite RMS

- Aucun C# dans le contenu livré de main ni nécessaire à son build/usage/tests.
  Ne pas réimporter les anciens paquets contenant des sources C# sous prétexte
  de provenance. Utiliser les références vers l'archive définies par M1.
- Fonctionnement statique et couverture RMS préservés. Les validateurs de
  graphes, plans, résultats et invariants restent actifs ; les tests RMS restent
  exécutables. Aucune baisse de seuil, suppression de cas ou oracle assoupli.
- Seule la compilation/exécution du code reconstruit par les investigations est
  reportée. Un test RMS utilisant la transpilation Bun, les buffers émis ou les
  calculs numériques n'est pas cette fonctionnalité reportée.
- Un LLM peut piloter les outils de vérification autorisés et créer un harnais
  ciblé. Seuls les résultats observés font preuve ; compiler ne démontre pas
  l'équivalence complète d'une reconstruction. Pas de nouveau framework par défaut.
- Le helper Windows renforcé est un développement séparé, pas un verrou
  automatique de la chaîne métier. Une garantie toujours nécessaire à un test
  RMS doit néanmoins être fournie par la route M1, ou le test reste bloqué.
- Préserver sources, rouges, fixtures, logs et RAW aux emplacements issus de M1.
  Ne pas exiger la réapparition des gels retirés du checkout : leurs copies
  byte-exactes sont dans l'archive. Aucun nouveau nettoyage ni copie massive.
  Le mandat Git/« push all » de M1 n'autorise pas de futurs commits/push M2 ;
  opérations finales réservées au superviseur sous autorisation explicite.

## 4. État historique acquis — à raccorder, pas à promouvoir globalement

### A — Graphe, factoring et planificateur

Des tranches L8 de transport, factoring et extraction ont été qualifiées. La
complétion planner R2 est qualifiée offline, **non intégrée à MAIN/S1** au point
de pause : 415 tests / 17 077 assertions / 13 fichiers. Le rapport
`PLANNER_FIXED_PROJECTIONS_QUALIFICATION_20261019.md` décrit la portée exacte.

Ses deux traces FULL de 593 912 596 octets sont égales, SHA-256
`e5090d756ba3c475b75e868e4f415270d72834f4fe9117ac7f729896140fafa0`.
Les preuves détaillées sont sous `.tmp/mission-v2-20261018-continuous/` :

- `planner-fixed-projections-r2-parent-qualification.json` ;
- `planner-fixed-r2-parent-green-verification.json` ;
- `planner-fixed-r2-regressions-parent-verification.json` ;
- `planner-fixed-r2-public-api-closure-readback.json` ;
- `planner-fixed-r2-hand-oracles-receipt.json`.

M1 n'a pas promu cette qualification en intégration scientifique. Au GO M2,
rapprocher la version qualifiée des fichiers commités, du WIP et des gels
actuels ; ses 415 tests ne s'ajoutent pas mécaniquement aux compteurs T4.

### B — Numeric/context : qualification comportementale toujours ouverte

La source scientifique R2 est gelée et acceptée statiquement ; la qualification
comportementale n'est pas acquise. Les tests R4 étaient proposés, pas acceptés.
**450 paires (224 valeurs / 226 refus) et neuf régressions n'avaient jamais été
typées/importées/exécutées au point de pause.** Ce travail concerne le RMS
statique et reste requis ; il n'est pas la validation dynamique reportée.

Entrées historiques à réévaluer après M1 :

- `s1-r5-numeric-context-extraction-r2-frozen/` ;
- `numeric-qualification-r4-frozen/` ;
- `numeric-qualification-r4-full-review/inputs/` : ancien paquet de 77 pins,
  1 315 076 octets, manifeste RAW
  `fc3193e9711a5e9eaaf3e637c057d7013e7031c0c446b78f25babbd7dcdf5213` ;
- `NUMERIC_NATIVE_FRAME_PLAN_PARENT_ADJUDICATION.json` ;
- `numeric-native-frame-r3-homologue-audit.json`.

À la réception post-M1, le paquet R4 de 77 pins et le paquet S1 de 51 pins
ci-dessous sont présents et conformes à leurs manifestes : zéro fichier manquant
ou divergent, mêmes hashes RAW. La migration ne justifie donc pas à elle seule
de les reconstruire. Leur qualification scientifique et leur adéquation au
périmètre M2 restent à établir ; toute modification future exige un nouveau gel.

Les tentatives de review R4 n'ont livré aucun verdict récupérable : il n'existe
pas d'acceptation A/B à hériter. La séparation historique F1/observateur/ledger
et ErrorEnvelope/native/SEAL est une option de découpage, pas une obligation de
relancer deux sessions identiques sans examiner leur nécessité actuelle.

Les probes synthétiques d'émission Bun ne valent pas validation générale du
runtime ; `native:1:11` est un token runtime, pas une coordonnée source. L'extension
de l'oracle n'est pas ratifiée. Préserver la chaîne d'erreurs ; ne pas transformer
un refus de l'infrastructure d'observation en résultat scientifique acceptable.

### C — S1 et suite : pas de contrat final ratifié

Les directions root-slot, modèles et provenance ont été étudiées. Le contrat
public commun final n'est pas ratifié. Le paquet historique
`s1-common-contract-final-plan/inputs/` annonçait 51 pins / 985 343 octets et RAW
`a81b74f4e1e36c9eaf81fbd1e71c1aa3c5a2be62fec2f383e3a7b9be916ebf5b`.
Vérifier sa couverture réelle, ses chemins et sa cohérence avant réutilisation ;
une ancienne somme ou un `Model.Ref` ne prouve pas qu'un PLAN a été livré.

Ne pas ressusciter du C# via les contrats historiques Q1/broker/coordinateur.
Seules les primitives TS et leur couverture décrites au §2 sont livrées comme
équivalents M1. Les autres qualifications restent dans l'archive, pas la preuve
d'un runner RMS générique adopté ni une obligation de tout porter.

### D — Clôtures partielles et travaux non terminés

Les clôtures L1 par paires, cinq cas V3 et l'adjudication L7 sont bornées. Aucun
pourcentage global ni clôture L1/L7 générale ne s'en déduit. S2–S4, la couverture
L7 globale, L9 et L10 restent à traiter selon leurs dépendances et contrats.

## 5. File de reprise révisée, dans l'ordre des dépendances

1. **Périmètre M2, V01/V04 et base de travail.** Partir de la réception §2,
   pas d'une M1 supposée encore bloquée. Décider brièvement, pour chaque
   sous-garantie V01/V04, si un consommateur RMS statique actuel la requiert,
   quel test/contrat la couvre déjà et quel manque précis subsiste. Distinguer
   budget/provenance métier et capture/ACK/kernel Windows. Sans consommateur,
   conserver hors périmètre avec référence à l'archive ; avec besoin réel,
   prévoir l'équivalent minimal sans C# et sa QA. Pas de port automatique des
   57 familles, pas de nouvelle architecture de contrôle par défaut. Relever
   le WIP à préserver et choisir les seules vérifications encore nécessaires.
   Fermer le contrat d'acceptation selon le §7.1 avant l'implémentation.
2. **Terminer la qualification numeric/context.** Réexaminer le candidat R4,
   corriger les défauts établis et obtenir une review indépendante. Préserver
   les 450 paires et neuf régressions avec leurs oracles. Préparer uniquement les
   moyens de capture/provenance encore nécessaires au contrat réellement retenu,
   puis typecheck et exécutions autorisées. Aucun faux PASS sur des tests non lancés.
3. **Finaliser le contrat public commun S1.** Partir des dépendances qualifiées
   et des références post-M1. Produire les types/joins minimaux fermés ; distinguer
   décisions, propositions et manques. Review fraîche avant implémentation.
4. **Implémenter et qualifier S1.** Source et QA indépendante fondée sur l'API,
   pas sur les détails du candidat. Intégrer les dépendances planner/numeric
   réellement qualifiées avec tests et contrôle des codecs.
5. **Achever S2–S4 selon les contrats mis à jour.** Persistance et acquisition/CAS,
   exécution native OpenCode, gestion des conflits/ressources, reprise et replay,
   consolidation/publication de connaissance. Relire les définitions des étapes
   dans les plans concernés ; ne pas attribuer une clôture sur leur seul numéro.
6. **Compléter L7**, puis **L9 indépendant** et **L10 parent**, selon les portes de
   `ORDRE_MISSION.md` et les amendements post-M1, avec reprise des preuves et
   sélection des vérifications restantes selon le §7.1. Exécuter un parcours RMS observable
   sur une fixture maîtrisée, incluant échec/reprise et connaissance durable, sans
   exécution du code reconstruit ni lancement de l'exécutable étudié.

Ne pas reconstruire automatiquement l'ancien gateway/catalogue/protocole complet.
M1 a livré un port de primitives Q1, **pas** un équivalent général du catalogue
d'émission Bun ou de la chaîne ErrorEnvelope/native/SEAL. Réutiliser les preuves
et composants disponibles ; définir seulement les moyens encore nécessaires à
la qualification numeric/context. Une simplification doit conserver la couverture
et les garanties pertinentes. Un manque précis bloque la tâche concernée, pas
rétroactivement M1 ni les autres tâches indépendantes et prêtes.

## 6. Invariants scientifiques et métier à préserver

- Snapshots T0/T1/T2 immuables ; témoins de connaissance committée ou no-op conservés.
  Sélection par référence/génération candidate exacte et CAS ; PREPARED ne donne
  pas autorité de publier ou d'acquérir une ressource.
- Grants root fournis indépendamment et acquis par slot ; caps/débits acquis
  immuables. Budget L5 courant distinct ; aucun crédit créé par repacking.
  S1 prouve la cohérence des données, pas l'acquisition/authentification de S2.
- Bindings modèles explicites et immuables. Plusieurs labels indépendamment
  fournis peuvent désigner le même `Model.Ref` exact ; ne pas imposer une
  injectivité non ratifiée ni inventer un alias implicite.
- Hashs et domaines de provenance distincts ; références aux sources réellement
  reçues après M1. Parser, lier ou exporter ne rejoue ni clustering ni planning.
- Algorithmes déterministes et modèles ont des rôles distincts. La prose, un
  JSON valide ou un statut de session ne constituent pas une validation.

## 7. Organisation de la nouvelle session et limites

Lire les directives applicables et charger `opencode-ensemble` avant coordination.
Un seul lead ; politique modèles/budgets approuvée au lancement, références natives
vérifiées. Ne pas importer arbitrairement le plafond/pool d'une campagne FF8, ni
modifier une grille gouvernée par des messages ou des overrides opportunistes.
Workers utiles seulement, en fresh pour les reviews indépendantes ; aucun spawn
en cascade par les feuilles. Permissions cohérentes avec le rôle réel.

Les anciennes tâches claimées par des membres morts ne sont pas automatiquement
réclamables ou terminées. Si le besoin subsiste, créer une tâche fraîche liée à
la provenance ancienne. Ne pas réactiver l'ancienne équipe en bloc et ne pas
recréer trois tâches juste parce que l'ancien handoff les disait « prêtes ».

Les causes des morts de workers restent **non établies**. Le crédit a été signalé
par l'utilisateur ; les diagnostics successifs charge, outils/rehash/Context Mode
et provider ne sont pas prouvés. Les deux derniers ne deviennent ni interdiction
générale d'outils ni prétexte à modifier le routage. Un échec futur se diagnostique
sur les événements réels, avec tentatives bornées, sans polling de progression.

Lancement de tests RMS possible uniquement avec les droits et limites explicites
du rôle. Aucun contournement d'un profil RE lecture seule. Le superviseur garde
l'arbitrage, l'intégration et l'acceptation finale. Réparation du runtime partagé,
achat, fallback payant, configuration globale et nettoyage ne sont pas implicites.

Toujours hors périmètre : campagne FF8/run01, live/IDA, G5–G7, adoption native du
jeu, validation dynamique du code reconstruit, migration générale de langage et
preuve de portabilité Linux/macOS non exécutée. L'évolution séparée du helper ne
redevient pas un prérequis global sans besoin démontré et accord distinct.

### 7.1. Contrat de vérification renforcée, autonome et bornée

**Objectif : assurance élevée sur un périmètre fermé, pas couverture maximale
abstraite.** Chaque comportement requis et risque critique identifié doit avoir
une preuve pertinente ; une preuve encore valide n'est pas reproduite sans raison.
Le niveau QA est `reinforced`, indépendant du modèle et de son reasoning ; il
n'impose ni pipeline de profils ni nombre permanent de reviewers.

**Fermer les obligations au lancement.** Dans l'unique journal de reprise (§2.4),
le lead établit une liste bornée issue des six livrables du §5, des invariants du
§6 et des portes encore applicables. Pour chaque obligation : résultat observable
attendu, preuve acquise ou vérification manquante, commande/scénario pertinent et
statut (acquis, à vérifier, bloqué ou report proposé). Les reports qui changent
les livrables ou garanties exigés restent soumis à l'accord du superviseur ; le
lead ne peut pas réduire seul le périmètre pour déclarer la mission terminée.
Présenter ce contrat avec le GO de lancement ; les choix de tests internes à ce
contrat n'exigent pas ensuite une nouvelle autorisation à chaque décision.
Si disponible, `/ensemble-mission config` porte `verification.level=reinforced`,
les commandes et critères convenus, puis `start` les approuve. Sinon, conserver
le même contrat explicitement approuvé dans le journal, sans prétendre que le
plugin déployé possède déjà cette fonctionnalité ni modifier la configuration globale.

**Couvrir les risques distincts, pas multiplier les campagnes.** Conserver les
450 paires et neuf régressions numeric/context, leurs oracles, la review fraîche
du contrat S1 avant implémentation, la QA indépendante S1, L9 et L10. Vérifier les
nominaux, refus, limites et transitions pertinents ; utiliser propriétés,
permutations ou injection d'incidents lorsqu'elles explorent un risque distinct.
Les oracles ne recopient pas simplement l'implémentation. Le parcours du §5 doit
montrer la chaîne statique, l'échec/reprise et la connaissance durable ; aucun
PASS simulé ne remplace une preuve native exigée et autorisée. Une autorisation
native manquante bloque la preuve concernée, sans réouvrir G5–G7 implicitement.
Les renvois aux §§16–18 de l'ordre initial ne commandent pas de refaire les
campagnes déjà qualifiées : rattacher chaque vérification restante à une obligation
applicable. Tout test obligatoire encore applicable reste exigé ; une omission
ou un report nécessite un arbitrage, pas une simple mention « hors matrice ».

**Réutiliser et revalider selon l'impact.** Référencer les preuves avec leur
version de code, entrées, oracle et conditions pertinentes. Les réutiliser tant
qu'aucun changement n'en invalide la portée ; un nouveau worker, reviewer ou chat
ne constitue pas une invalidation. En cas de changement, consigner brièvement
quelles preuves sont affectées et rejouer ces vérifications et leurs dépendances
pertinentes. Si l'impact est incertain, effectuer le contrôle nécessaire pour le
lever, sans supposer la preuve valide. Une erreur de fixture ou d'outil se diagnostique
sur le plus petit reproducteur ; une relance inchangée exige une raison identifiée.
Prévoir une validation consolidée du candidat final intégré, avec les contrôles
de non-régression convenus ; ne la répéter que si ce candidat ou les conditions
pertinentes changent. Cela ne dispense pas des tests ciblés pendant le développement.

**Borner les revues et garder l'initiative.** Les revues portent sur les obligations
et risques du jalon ; les reprises sur les défauts bloquants et l'impact des
corrections, sans réauditer automatiquement les zones inchangées. Un bloquant
correspond à une obligation requise non satisfaite, une preuve exigée absente ou
invalide, ou un défaut concret de sûreté/correction dans le périmètre. Distinguer
ces cas des suggestions non bloquantes et améliorations différables. Un risque
critique nouvellement découvert ne peut pas être écarté pour préserver la clôture :
le signaler et l'arbitrer s'il modifie le contrat.
Le lead choisit librement les tests ciblés et corrections dans le périmètre, sous
les permissions et budgets approuvés. Toute nouvelle infrastructure importante,
extension de fonctionnalités ou d'exigences demande un accord préalable ; préférer
les outils existants ou le plus petit harnais suffisant. Face à un blocage, rendre
un diagnostic et une décision demandée après les tentatives bornées autorisées,
plutôt que créer une boucle de sondes ; continuer les travaux indépendants prêts.

## 8. Livrable et clôture

Maintenir le handoff avec les **faits post-M1**, les interfaces réellement livrées,
les références de preuves et les tâches restantes. Rapport final : fonctionnalités
réellement intégrées, tests exécutés, scénarios couverts, échecs/limites et travaux
reportés explicitement. Pas de pourcentage de complétion ou de ratio d'effort
inventé ; distinguer implémenté, vérifié, intégré et observé de bout en bout.

**Condition d'arrêt :** les livrables retenus sont intégrés et relus par le
superviseur ; chaque obligation du contrat approuvé possède une preuve recevable,
les vérifications exigées sont satisfaites et aucun défaut bloquant ne reste
ouvert. Les reports modifiant ce contrat doivent avoir été explicitement acceptés.
Le bilan référence les preuves réutilisées, les contrôles réellement rejoués et
leur justification, ainsi que les limites et améliorations différées. Il ne
déclenche pas une nouvelle campagne uniquement pour améliorer un taux de couverture.
Une preuve obligatoire indisponible conduit à un état partiel/bloqué explicite,
pas à une clôture acceptée ni à des tentatives indéfinies. Une fois les critères
satisfaits, présenter le bilan pour acceptation finale et arrêter le travail ;
ne pas consommer le budget restant en perfectionnements non demandés.

M2 ne peut annoncer une clôture RMS que sur les résultats du périmètre révisé,
sans réintroduire du C#, sans perdre de couverture statique et sans présenter
le report de la validation dynamique comme une preuve qu'elle fonctionne.
