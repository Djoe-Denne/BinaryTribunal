# Ordre de mission 01 — Retrait du C# de main, garanties RMS conservées

Date : 2026-10-20. ID proposé : `rms-m1-retrait-csharp-20261020`.

**Statut : ordre préparé, mission NON LANCÉE.** L'utilisateur a demandé la
rédaction des deux ordres, pas leur exécution. La mission précédente reste en
pause. Aucun dispatch, déplacement, compilation, test, commit ou changement de
branche n'est autorisé par la seule présence de ce document.

Suite : [mission 02 — reprise RMS après M1](ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md).

## 1. Décision utilisateur et critères de réussite

1. Aucun code C# ni dépendance C#/.NET nécessaire pour construire, utiliser ou
   tester le RMS ne doit rester dans le contenu livré de `main`.
2. Aucun recul du fonctionnement statique du RMS ni de sa couverture de tests.
   Déplacer un test hors de main, le désactiver ou affaiblir son oracle n'est pas
   un remplacement acceptable d'une garantie RMS.
3. Seule la validation dynamique du **code reconstruit par les investigations**
   est reportée : compiler et exécuter ce code pour en vérifier le comportement.
   Les tests exécutables du RMS, sa compilation/typecheck et la validation des
   graphes, plans, résultats et invariants restent dans le périmètre.
4. Le travail du helper Windows est conservé dans un développement séparé,
   avec ses tests, limites, échecs et preuves ; il n'est pas jeté.
5. RMS est un **plugin OpenCode V2 générique**. FF8 est un premier cas d'essai,
   pas sa définition. Aucun orchestrateur standalone concurrent n'est à créer.

Ces décisions remplacent pour ce périmètre l'idée d'un report général des tests
ou d'une dépendance obligatoire du cœur RMS au helper C#. Elles ne modifient
aucune campagne FF8, autorisation live ou règle de sûreté extérieure à ce travail.

## 2. Sens précis de « main sans C# »

Le contrôle porte sur l'arbre Git final de `main` et sur les fichiers nécessaires
à son utilisation et à ses tests, pas seulement sur les imports du produit.
Inventorier aussi tests, scripts, générateurs, CI, paquets d'entrée et snapshots :

- sources C#, y compris code embarqué dans des scripts ou documents exécutables ;
- projets, commandes de compilation et chargements .NET spécifiques au C# ;
- binaires C# livrés ou nécessaires, même si leurs sources ont été déplacées ;
- dépendances indirectes utilisées par les tests ou leurs préparations.

Une extension `.dll`, `.exe` ou `.sln` seule n'identifie pas du C# : distinguer les
artefacts natifs des artefacts managés. Renommer un fichier, cacher du code dans
un JSON ou l'ajouter à gitignore ne satisfait pas le critère.

Les mentions historiques du langage et les liens vers l'archive sont permis ;
elles ne doivent pas embarquer les sources retirées ni les rendre nécessaires
à main. Aucun effacement ou réécriture de l'historique Git n'est demandé. Les
originaux gelés contenant du C# sont préservés hors du contenu livré de main,
avec leur emplacement et leur hash documentés.

## 3. Frontière de travail

Autorisé après GO : inventorier et séparer le helper ; adapter les dépendances
RMS ; remplacer le code ou les tests C# encore nécessaires ; corriger les points
d'entrée et la documentation active ; vérifier les non-régressions concernées.

Préserver les fonctions existantes : extraction de faits, graphe, partitions,
groupes, planification, codecs, contrats, état/provenance et interfaces OpenCode.
Un codec contrôle/encode/décode ; il ne doit pas rejouer un producteur scientifique
pour fabriquer un résultat conforme à son propre contrôle.

Hors périmètre : portage général vers Python/Rust/C++, nouvel exécutable RMS,
implémentation complète de la supervision OS renforcée, extension de la mission
scientifique, FF8/live/IDA, run01, G5–G7, changements globaux et nettoyage.

La validation dynamique du code reconstruit est distincte des tests du RMS qui
exécutent Bun/TypeScript, compilent un outil ou vérifient des calculs numériques.
Ces derniers ne deviennent pas reportables sous prétexte de « code généré ».

## 4. État de départ et conservation

L'audit préparatoire a observé `main` avec de nombreux changements et fichiers
non suivis. Une partie du travail récent se trouve sous
`.tmp/mission-v2-20261018-continuous/`. **Une nouvelle branche ne transporte pas
automatiquement ces fichiers.** Refaire l'inventaire réel au démarrage ; les
observations préparatoires ne sont pas un snapshot d'exécution.

Avant retrait, enregistrer HEAD, branche, état index/worktree, fichiers possédés
par cette mission et changements utilisateur à ne pas toucher. Aucun stash
global, reset, clean ou checkout écrasant. Pas de copie massive des traces.

Conserver les preuves existantes, y compris rouges, logs, bases et gels. Utiliser
des manifests vers les originaux plutôt que dupliquer les gigaoctets de RAW.
Une adaptation produit un nouveau candidat ; elle ne réécrit pas un gel ancien.

## 5. Exécution en cinq étapes

### A — Inventaire et carte des dépendances

Recenser le C# dans le dépôt `re-ff8` entier et dans les entrées réellement
nécessaires au RMS. Séparer : helper Windows seul ; composants/tests partagés ;
contrats RMS indépendants ; preuves historiques. Ne pas décider par le nom
`full44` ou par l'extension seule. Un fichier hors ownership demande un arbitrage
ciblé ; il ne peut être ignoré pour annoncer ensuite « zéro C# ».

Pour chaque comportement testé, identifier scénario, oracle, couche couverte,
preuve existante et dépendance d'exécution. Distinguer test qualifié, test proposé
jamais exécuté et simple plan. Les nombres d'assertions ne suffisent pas.

### B — Préservation du développement Windows

Préparer une branche dédiée, nom proposé `dev/windows-process-supervision`,
idéalement dans un worktree séparé. Y préserver sélectivement sources, tests et
contrats du helper, avec les références vers ses preuves conservées. Inclure
explicitement les fichiers non suivis utiles ; ne pas embarquer les autres
changements utilisateur. Vérifier l'identité des copies avant tout retrait.

Le développement séparé ne prétend pas que ses garanties sont déjà acquises :
notamment budgets cross-process et certains cas de perte/last-close non établis.
Sur main, garder un bref index de conservation et les limites pertinentes.

### C — Remplacements minimaux pour main

Pour chaque dépendance C# du RMS, choisir le remplacement le moins invasif :
capacité OpenCode V2 vérifiée, TypeScript existant, ou script Python ciblé si
justifié. Aucun framework supplémentaire par défaut. Un besoin réel d'exécutable
compilé est escaladé ; la préférence utilisateur est Rust/C++, pas C#.

Préserver entrées/sorties, refus, erreurs, bornes et cas limites. Porter les tests
RMS nécessaires avec une référence indépendante ; ne pas fabriquer leurs attentes
à partir du candidat. Conserver la correspondance ancien scénario → nouveau test.

Les tests purement propres à la feature Windows suivent son développement séparé.
Mais si l'un couvre une garantie encore requise par le RMS ou sa non-régression,
un équivalent vérifié sur main est obligatoire. Si cet équivalent manque : M1
est BLOCKED, pas « réussie avec test différé ». Pas de waiver implicite.

### D — Vérification réelle

Exécuter les suites RMS concernées et la vérification finale déterminée par la
carte des dépendances, dans des espaces neufs possédés et avec des commandes
bornées. Réutiliser les preuves acquises pour les parties inchangées seulement
si leur applicabilité est démontrée ; aucune qualification globale par héritage.

Un LLM peut piloter compilation/tests et écrire un programme de test dédié via
les outils autorisés. Le rôle et les permissions sont explicités au lancement ;
un profil RE privé de shell ne doit pas les contourner. Résultats attendus,
commandes, versions, codes de sortie, sorties et erreurs sont conservés. La
validation finale appartient au superviseur, pas au statut « done » du worker.

OpenCode possède les sessions et permissions. Un timeout logiciel ne prouve pas
l'arrêt de tous les descendants ; un Job Object ne prouve pas une sandbox FS ou
réseau. Si une suite exige une garantie que la route sans C# ne fournit pas,
implémenter/qualifier l'équivalent minimal ou déclarer BLOCKED. Ne pas lancer la
suite en supprimant simplement sa garde historique.

Comparer les comportements et invariants, les cas positifs/négatifs et les
métriques de couverture lorsqu'elles sont comparables. Conserver les seuils
existants. Distinguer clairement absence de mesure, échec préexistant et régression.

### E — Intégration et reçu de clôture

Le superviseur seul réalise les opérations Git finales. Commits locaux et
intégration à main nécessitent une autorisation Git explicite dans le GO de
lancement/intégration ; pas de push distant, amend ou réécriture d'historique.
Sans cette autorisation, livrer un candidat vérifié mais **non intégré** ; ne pas
déclarer que main satisfait déjà le contrat. Vérifier le diff final, l'arbre
livré et les fichiers auxiliaires réellement requis après intégration.

## 6. Livrables de M1 et passage à M2

Produire dans ce dossier, après travail réel :

- `M1_RETRAIT_CSHARP_BILAN.md` : périmètre exact, décisions, remplacements,
  correspondance de couverture, résultats exécutés, limites et reste à faire.
- `M1_RETRAIT_CSHARP_MANIFEST.json` : état final et références vérifiables.

Le manifeste contient au minimum : ID/version ; statut ; HEAD de départ et HEAD
livré ; branche/commit du helper conservé ; inventaire et hashes source/destination
des retraits ; dépendances partagées et remplacements ; suites et scénarios de
référence/remplacement ; commandes et reçus de tests ; contrôle zéro C# ; preuve
de préservation des changements étrangers ; impacts sur la suite RMS.

Statuts : `BLOCKED`, `VERIFIED_NOT_INTEGRATED`, `ACCEPTED_INTEGRATED`.
Seul le dernier ouvre le passage à M2. Aucune de ces valeurs n'est acquise à la
rédaction de cet ordre. Un résultat partiel reste partiel.

Acceptation finale : zéro C# livré/nécessaire sur main ; fonctionnement statique
et couverture RMS préservés ; tests applicables réellement vérifiés ; archive
retrouvable ; aucune preuve détruite ni changement étranger écrasé ; bilan et
manifeste suffisants pour reprendre sans réinterpréter les vieux checkpoints.

## 7. Organisation et documents de référence

Avant coordination, lire `AGENTS.md`, `AGENT.md`, le guide
`docs/tech/RE_MULTI_PROVIDER_MISSIONS.md` et charger `opencode-ensemble`.
Pas de reprise de la campagne battle-static-discovery ni de son pool historique.
Ces travaux sont de l'ingénierie du plugin, pas une campagne de décompilation RE.

Un seul superviseur. Concurrence proportionnée ; livrables disjoints ; review
indépendante des remplacements sensibles ; intégration sérialisée. Politique
modèles/budgets approuvée au lancement, références natives vérifiées, aucun
changement de routage silencieux ni relances sans borne. Ne pas réactiver en bloc
l'ancienne équipe. La préparation de ces ordres n'autorise aucun spawn.

Références historiques à confronter au contrat ci-dessus :

- `ORDRE_MISSION.md` et `ORDRE_MISSION_V2_20261018.md` ;
- `JOB_HELPER_SOURCE_SCOPE_20261017.md` et `FULL44_POLICY_RATIFICATION_20261017.md` ;
- `PLANNER_FIXED_PROJECTIONS_QUALIFICATION_20261019.md` ;
- `FULL44_Q1_DATA_QUALIFIED_20261019.md` et
  `FULL44_Q2A_HEAP_QUALIFIED_S1_R4_REVIEW_20261019.md` ;
- `HANDOFF_MISSION_20261020.md`, historique à corriger par le bilan M1 et M2.

L'ancien diagnostic des morts de workers n'est pas établi : ni provider, ni
volume du paquet, ni rehash/Context Mode n'ont été prouvés responsables. Ne pas
en faire une nouvelle règle technique ou un préalable à cette mission.
