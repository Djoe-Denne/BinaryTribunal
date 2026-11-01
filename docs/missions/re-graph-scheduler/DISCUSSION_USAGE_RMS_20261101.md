# RMS — fonctionnement, missions bornées et raccords manquants

Date : 1er novembre 2026.

Compte rendu fonctionnel de la discussion utilisateur, avec les corrections
vérifiées dans le code. Ce document conserve les décisions et quelques citations
exactes ; ce n'est ni un export intégral de la session ni une nouvelle preuve
d'exécution. Il complète le [plan SDK actif](PLAN_RMS_PLUGIN_SDK_20261031.md).

## 1. Objectif utilisateur actuel

RMS doit recevoir un exécutable par un outil d'analyse tel qu'IDA ou Ghidra,
construire un graphe de fonctions et de relations, le découper en groupes, puis
choisir et traiter du travail dans sa machine à états. Les analyses alimentent
les connaissances et les travaux suivants. La sélection autonome reste
l'objectif ; un choix fait à la main par le superviseur n'en est pas la preuve.

Ghidra fait partie de cet objectif général. Aucun adaptateur Ghidra n'a été
implémenté ou qualifié par les vérifications de cette discussion.

L'utilisateur confirme que les petites missions doivent rester possibles :

> « Avoir la possibilité d'avoir des missions plus petites ne me dérange pas.
> Donc si c'est le cas, c'est quelque chose qui est à garder. »

Il ne demande pas de modifier les règles de transition :

> « C'est pas grave, on va rien changer pour le moment. »

## 2. Comment l'usage devrait fonctionner

L'utilisateur reste dans sa conversation OpenCode habituelle et exprime un
objectif. L'assistant le transmet à RMS par une action du plugin ; RMS organise
les sessions d'analyse dans le même hôte OpenCode. La conversation de pilotage
et les sessions de travail sont distinctes.

Ce parcours est **l'usage proposé, pas une interface déjà raccordée**. Le plugin
actuel n'enregistre ni outil utilisateur RMS ni commande `/rms`. Créer une
session directement par le SDK contournerait le moteur : cela testerait OpenCode,
pas la capacité de RMS à piloter ce travail.

## 3. Ce que le noyau sait faire

- Construire une partition à partir d'un graphe normalisé et de configurations
  numériques. Les groupes calculés restent des hypothèses structurelles, pas des
  verdicts sémantiques sur toutes leurs fonctions.
- Préparer un plan à partir de groupes explicitement fournis. Chaque groupe
  distingue les fonctions à traiter des fonctions servant de contexte.
- Partir de fonctions choisies pour calculer un voisinage avec l'algorithme PPR.
  Ce point de départ ne signifie pas « exécuter uniquement cette fonction ».
- Fermer les dépendances obligatoires avant sélection, contrôler les budgets et
  différer un périmètre qui découpe incorrectement un cycle récursif.
- Faire progresser et conserver un état de mission avec des commandes de pause,
  d'arrêt, de reprise et de récupération, selon leurs conditions.

Une mission peut donc être **bornée**, sans obligation de traiter tout
l'exécutable. Mais le noyau peut inclure d'autres fonctions nécessaires ; une
cible n'est pas une garantie d'isolation à une seule fonction. Les paramètres
de nombre et de budget ne sont pas des sélecteurs d'identité de cluster.

La préparation publique du graphe reconstruit ses groupes avant de les remettre
au planificateur. Une composition programmatique ciblée du noyau n'est pas encore
une commande opérationnelle du plugin « lance ce cluster/cette fonction ».

## 4. Pouvoir du superviseur et conditions d'arrêt

Le superviseur peut décider d'une réparation et utiliser les opérations prévues.
Il ne dispose pas, dans les interfaces examinées, d'un forçage universel
« ignore les règles et impose cet état ». Les transitions vérifient l'état
précédent, la révision, les dépendances et les conditions propres aux effets.

Une réponse perdue ne prouve pas qu'une tâche n'a jamais démarré. Un travail
encore actif ou incertain ne peut pas être libéré par un simple changement
d'étiquette, puis renvoyé comme si aucun effet n'avait eu lieu. La sortie de
quarantaine exige des preuves de fin d'activité et ne remet pas automatiquement
l'ancien travail en attente d'exécution.

Le moteur historique possède des bornes de cycles et de stagnation, ainsi que
des critères de candidats admissibles. Une mission terminée ne signifie donc
pas nécessairement que tout le programme est décompilé et compris.

## 5. État du raccord OpenCode

Les tranches logicielles suivantes sont acceptées avec des vérifications ciblées
et des revues indépendantes, à leurs portées respectives :

- état de progression sur les réservations existantes : 31 tests et contrôle du
  véritable adaptateur Node sur une base en mémoire ;
- coordinateur de création, relecture de session et envoi du prompt : 29 tests ;
- raccord optionnel au service existant : 26 tests ;
- client RMS avec captures complètes et annulation à la fermeture : 35 tests.

Ces nombres ne doivent pas être additionnés en un résultat de suite globale.
Les vérifications de types associées ont réussi. Les tests à doublures du SDK
ne constituent pas une preuve de chargement dans l'hôte ou de travail réel.

Lorsqu'il est explicitement configuré, le service enregistre les étapes avant
les appels de création et d'envoi, relit les paramètres de session et conserve
les accusés complets. Un rejeu ne doit pas doubler l'envoi. Le client implémente
la soumission, le suivi et le rapprochement sur la même interface V2 ; son
opération distante `control` reste refusée localement comme non implémentée.

Le plugin prépare encore une fabrique non activée et l'enregistrement par défaut
du service ne fournit pas le raccord scientifique optionnel. Le moteur de graphe
examiné accepte actuellement des ports de test explicitement déclarés.

**Il reste à raccorder** l'entrée utilisateur, le consommateur métier et la
nouvelle admission native au client/service existants, puis la consommation des
réponses réelles permettant de poursuivre le travail. Voir une réponse dans une
session OpenCode ne prouve pas que RMS l'a récupérée et conservée. La publication
unique et l'utilisation des nouveaux octets par le prochain travail restent à
observer ; aucune nouvelle file ou nouvelle base n'est requise par ce constat.

## 6. Cas FF8 proposé, sans lancement

Un export conservé d'IDA contient 33 935 fonctions et 80 047 relations. Une
partition Leiden y comporte un groupe de 149 fonctions rapproché du périmètre
« commandes de combat, sous-menus et widgets ».

`BattleDrawMenu_Open` à `0x4ADD10` est une petite entrée documentée : 32
instructions dans la page existante, 151 octets dans l'export conservé. Son C est
déjà réconcilié ; l'utiliser comme témoin serait une vérification de
non-régression, pas une découverte nouvelle. Le voisin `0x4ADDB0` reste différé
avec son obstacle historique SKIP_CHUNK.

La sélection est documentaire. Elle ne prouve ni une sélection autonome de RMS,
ni une admission native, ni un parcours du plugin terminé. Le graphe lui-même
reste partiel, notamment pour les appels indirects et certaines relations de
contexte. Aucun travail sur les 149 fonctions n'est lancé par cette discussion.

## 7. Validation et corrections de vocabulaire

Trois étapes ont été distinguées : départ réel d'un travail sans doublon,
récupération et conservation de la réponse avec reprise, puis parcours de
reverse engineering avec analyses indépendantes et publication.

« Natif » désigne ici un appel réel à l'hôte OpenCode, pas l'exécution du code
machine de FF8. La demande d'un dossier de travail déjà préparé par l'utilisateur
a été retirée : sa nécessité n'était pas établie. Le superviseur doit préparer
le petit cas dans le périmètre convenu.

L'inventaire réel des origines durables reste non acquis ; aucun crédit
disponible n'est présumé, et un dossier neuf ne remet pas les compteurs à zéro.
Les conditions doivent être fermées avant les effets concernés. Aucun second
hôte, nouvel OAuth, déploiement global, scénario arrêté, FF8 live, mutation IDB ou
exécution de code reconstruit n'est autorisé par le choix du cas.

## 8. Références techniques et portée

- `tools/ff8-harness/src/planner.ts:51–54,196–247,279–289` et
  `planner-derived-codecs.ts:88–102` : ciblage du noyau et dépendances.
- `tools/ff8-harness/src/cluster.ts:558–602` et `graph-pipeline.ts:13–39,59–81` :
  partition, graines PPR, groupes et préparation.
- `tools/ff8-harness/src/graph-store.ts:261–266,621–627,865–875,1873–1894` :
  transitions, règles de reprise et quarantaine.
- `tools/ff8-harness/src/engine.ts:356–381,476–487,535–566` : sélection historique,
  bornes et pilotage ; `graph-engine.ts:262–267` : garde des ports de test.
- `tools/rms-opencode-v2/src/plugin.ts:9–26` et `native-execution.ts:130` :
  fabrique actuelle et contrôle distant indisponible.
- Commit re-ff8 `05ba50670354cd68f998c8925bb3f97bf52e10d1` : client accepté.
- Commits Ensemble `9cf4543`, `bb888d1` et `eba1251` : tranches acceptées ;
  ils appartiennent au dépôt distinct `opencode-ensemble-session`.
- `.opencode/missions/team_mvshkwxs_000t_2fkx8e/cluster-native-147/` : export et
  partition conservés, relus sans réextraction. Les rapports parent 089–091 de
  la session courante détaillent ces vérifications statiques.

Aucun produit n'a été modifié et aucun nouveau test ou travail scientifique n'a
été exécuté pendant ces clarifications. L'ingestion et la publication Git de ce
compte rendu ne constituent pas un lancement de la validation réelle.
