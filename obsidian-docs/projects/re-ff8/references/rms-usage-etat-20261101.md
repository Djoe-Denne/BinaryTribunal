---
title: >-
  RMS — usage, missions bornées et raccords manquants au 1er novembre 2026
category: reference
tags: [reverse-engineering, testing, reference]
summary: >-
  Le noyau sait borner le travail, mais le plugin ne pilote pas encore une mission réelle complète ; décisions d'usage et corrections de la discussion.
sources:
  - docs/missions/re-graph-scheduler/DISCUSSION_USAGE_RMS_20261101.md
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
created: 2026-11-01
updated: 2026-11-01
---

# RMS — fonctionnement attendu et état vérifié

## Décisions utilisateur

L'objectif actuel est : exécutable analysé via IDA ou Ghidra → graphe → clusters
→ sélection autonome du travail → machine à états de décompilation et d'analyse
sémantique → connaissances pour la suite. Ghidra est un objectif d'adaptateur,
pas une intégration déjà qualifiée dans la mission en cours.

**Les petites missions sont à conserver.** L'utilisateur accepte explicitement
de borner un travail plutôt que d'imposer le traitement de tout l'exécutable.
Il ne demande aucun changement des règles de transition pendant cette discussion.

## Ce qui est possible dans le noyau

Le planificateur reçoit des groupes avec leurs fonctions à traiter et leurs
fonctions de contexte. Il peut préparer un travail ciblé, en incluant les
dépendances obligatoires et en différant un périmètre qui découpe un cycle
récursif. Une cible n'est donc pas une promesse de traiter exactement une seule
fonction. L'algorithme PPR peut aussi prendre une fonction comme point de départ
d'un voisinage ; cela ne sélectionne pas à lui seul un travail à exécuter.

La préparation publique reconstruit les groupes avant le passage au planner.
Le ciblage programmatique interne ne prouve pas l'existence d'une commande
utilisateur opérationnelle « lance ce cluster ou cette fonction ».

Le superviseur dispose de pause, arrêt, reprise et récupération, mais pas d'un
forçage universel de n'importe quel état. Un travail encore actif ou incertain
ne devient pas absent par décision verbale. Les bornes de cycles, de stagnation
et de candidats font qu'une mission terminée n'implique pas un programme entier
compris.

## Ce qui est livré, sans preuve native de bout en bout

Les tranches d'état durable, de création/relecture/envoi de session, de service
optionnel et de client sont acceptées avec leurs contrôles ciblés et revues
indépendantes. Les sélections respectives comptaient 31, 29, 26 et 35 tests ;
elles ne sont pas un résultat de suite globale. Les tests à doublures ne prouvent
pas le chargement ou l'orchestration réelle dans OpenCode.

Le [[projects/re-ff8/concepts/rms-plugin-hote-opencode-v2|plugin RMS]] prépare une
fabrique sans mission active. Il n'expose encore ni outil utilisateur RMS ni
commande `/rms` ; le service par défaut n'active pas son raccord scientifique.
Le client implémente soumission, suivi et rapprochement, mais son contrôle distant
reste indisponible localement.

**Il manque le raccord de l'entrée utilisateur au consommateur métier et au
service, puis la consommation des réponses réelles pour continuer.** Une réponse
visible dans OpenCode ne prouve pas son intégration durable dans RMS. La
[[projects/re-ff8/concepts/rms-publication-et-contexte-suivant|publication et le contexte suivant]] restent des preuves distinctes, pas des conséquences d'un
commit Git ou d'une notification.

## Cas FF8 et corrections à préserver

Un groupe de 149 fonctions de commandes, sous-menus et widgets a été retrouvé
dans une partition calculée sur un export IDA conservé : 33 935 fonctions et
80 047 relations. `BattleDrawMenu_Open` à `0x4ADD10` est une petite entrée déjà
documentée à 32 instructions ; elle peut servir de référence de non-régression,
pas être comptée comme découverte nouvelle. Le graphe reste partiel.

Ce choix est **documentaire** : il n'établit pas que RMS sait déjà exécuter cette
cible depuis le plugin. Le voisin `0x4ADDB0`, SKIP_CHUNK, reste différé. Aucun
traitement des 149 fonctions ni nouvelle campagne n'est lancé.

« Natif » signifie ici réellement envoyé à l'hôte OpenCode, pas code machine FF8
exécuté. La demande d'un dossier de travail existant à fournir par l'utilisateur
a été retirée. Le petit essai doit être préparé par le superviseur, sans deuxième
hôte ni remise à zéro des origines durables ; leur inventaire réel reste non
acquis et aucun crédit n'est présumé disponible.

Les étapes de validation distinguées sont le départ unique du travail, puis la
récupération/reprise durable, puis le parcours scientifique. La discussion et son
ingestion ne valent ni déploiement, ni lancement, ni acceptation native.

## Provenance

Source : compte rendu de discussion du 1er novembre 2026, avec références de code
et périmètres de vérification. Les constats du 30 octobre restent historiques et
ne sont pas rétroactivement transformés en succès. Voir aussi les
[[projects/re-ff8/concepts/rms-frontieres-runtime-v2-v3|frontières des anciens raccords]] et le [[projects/re-ff8/re-ff8|projet RE FF8]].
