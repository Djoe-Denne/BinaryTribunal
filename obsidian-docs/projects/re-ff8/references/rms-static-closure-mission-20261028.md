---
title: Nouvelle mission RMS — terminer la chaîne statique après M2
category: reference
tags: [reverse-engineering, testing, reference]
summary: Préplan du 28 octobre : reprendre les acquis M2, fermer remplacement et parcours public, puis publication, replay, revue indépendante et intégration.
sources:
  - docs/missions/rms-static-closure-20261028/MISSION.md
  - docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/reports/181-historique-ensemble-messages-recuperation.md
provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}
created: 2026-10-28
updated: 2026-10-28
---

# Mission préparée, pas encore lancée

Le document canonique est `docs/missions/rms-static-closure-20261028/MISSION.md`, conservé aussi dans [[_raw/rms-m2-opencode-20261028/mission-prepared|la copie source du vault]]. Cette page décrit un **préplan documentaire** : aucun nouvel identifiant de tâche native n'est revendiqué, aucune politique n'est approuvée par cette page et aucun `start` n'a été exécuté.

La base factuelle est [[projects/re-ff8/references/rms-m2-archive-et-reprise-20261028|le bilan M2]], après [[projects/re-ff8/references/rms-m1-retrait-csharp-20261020|M1 accepté]].

## Objectif et file dépendante

Objectif : faits d'un exécutable → graphe → groupes → plan → sessions d'auteurs → revue/réconciliation → connaissance durable → prochain travail, dans OpenCode V2 et sans exécuter le code reconstruit.

1. Reprendre les preuves applicables et récupérer les livraisons existantes avant réaffectation.
2. Définir une voie de clôture du remplacement à partir des mesures acquises ; aucun nouveau diagnostic par défaut. Isoler les arbitrages de threads et de deux candidats distincts.
3. Compléter les manques autorisés de persistance, acquisition, versions et activation après décision sur les changements concernés.
4. Raccorder le parcours public et les observations natives OpenCode, avec contrat et préflight propres ; ne pas confondre disponibilité réelle et défaut de transmission.
5. Terminer consolidation, publication de connaissance et replay déterministe.
6. Compléter les oracles et scénarios indépendants de machine d'état, selon les prérequis d'exécution.
7. Obtenir la revue indépendante finale et l'intégration/validation finale du parent.

L'étude du contrat public et la préparation des oracles peuvent avancer après la reprise des preuves si elles sont indépendantes. Leurs exécutions ne doivent pas devancer les implémentations ou autorisations nécessaires.

## Vérification et arrêts

Vérification renforcée proposée, avec reprise des trois commandes convenues : `bun run typecheck`, `bun run test:q1-primitives`, `bun test`, depuis `tools/ff8-harness`. Elles restent non exécutées au départ. Définir les bornes et empêcher les chemins interdits avant tout lancement global ; une suite filtrée n'est pas la suite complète.

Les preuves encore valides sont réutilisées ; code, entrées, oracle ou conditions pertinents changés justifient seulement les contrôles affectés. Les 450 paires et neuf régressions ne sont pas relancées par la rédaction de ce préplan. Aucun pipeline fixe de spécialistes ou framework de test supplémentaire n'est imposé.

L'interdiction de threads, la limite des origines, les quinze secondes par test et le gel de la mesure précédente restent applicables. Pas de C#, live, jeu, IDA, run01, G5–G7 ou exécution du code reconstruit. Une preuve indispensable absente impose un bilan partiel, pas une acceptation.

## Préparation native future

Préparer dans un contexte distinct, sans tenter un second import dans l'équipe M2 déjà démarrée. Vérifier les profils et modèles disponibles ; proposer la continuité avec le contrat précédent sans migration implicite. Présenter le contrat exact avec `config`, puis laisser l'utilisateur exécuter `start`.

Les revues indépendantes demandent explicitement un contexte `fresh` au niveau de la tâche avant admission. Ne pas fournir à un auteur ou reviewer aveugle l'archive intégrale qui révèle les sorties des autres.

Pour les livraisons silencieuses, suivre [[projects/re-ff8/skills/recuperer-un-resultat-opencode-manquant|la récupération avant remplacement]]. La possibilité de réveil du superviseur n'est ni une permission nouvelle ni une preuve d'intégration RMS.
