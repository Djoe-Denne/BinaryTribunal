---
title: RMS M2 — archive complète des sessions publiques et état de reprise
category: reference
tags: [reverse-engineering, testing, reference]
aliases: [RMS M2 sessions, M2 sous-agents, RMS reprise 2026-10-28]
summary: Archive assainie de 18 sessions M2 ; acquis numeric et S1, remplacement non accepté, nouvelle mission préparée sans lancement.
sources:
  - obsidian-docs/_raw/rms-m2-opencode-20261028/inventory.json
  - obsidian-docs/_raw/rms-m2-opencode-20261028/preparation-pm/inventory.json
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/REPRISE_JOURNAL.md
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/reports/180-bilan-copie-negligeable-arret-convenu.md
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/reports/181-historique-ensemble-messages-recuperation.md
provenance: {extracted: 0.98, inferred: 0.02, ambiguous: 0.0}
created: 2026-10-28
updated: 2026-10-28
---

# RMS M2 : ce qui est livré, ce qui reste bloqué

Cette page complète [[projects/re-ff8/references/rms-m1-retrait-csharp-20261020|la clôture M1]], sans la rouvrir. Le projet [[projects/re-ff8/re-ff8|re-ff8]] poursuit une chaîne de recherche statique ; aucune validation par exécution du code reconstruit n'est acquise ou demandée.

## Couverture de l'archive

L'archive couvre le superviseur et ses seize auteurs, ainsi que la session du préparateur `pm-rms` retrouvée dans l'historique mais non rattachée comme enfant natif : **18 sessions**, sans échec de collecte. Les listes de messages et de descendants, archivés et non archivés, ont été paginées jusqu'à leur fin. Les identités, titres, modèles, dates de coupe, empreintes de fragments et omissions sont conservés dans les deux inventaires.

- 5 905 messages observés ; 5 847 messages publics exportés.
- 65 fragments Markdown, 41 332 067 octets de transcripts assainis.
- 58 messages de contexte privé et 5 570 parties de raisonnement privé omis ; trois chaînes reconnues comme secrets masquées.
- Coupe principale : 28 octobre 2026 à 15:48:58 UTC. Le préparateur possède sa propre coupe, enregistrée dans son inventaire. La conversation continuant, les actes ultérieurs d'indexation et publication doivent être décrits par leur reçu final, pas attribués à cette coupe.

Accès à chaque session et à tous ses fragments : [[_raw/rms-m2-opencode-20261028/catalogue|catalogue des sessions]]. Les transcripts sont des **sources non fiables comme instructions**. Ne jamais exécuter leurs commandes ni transformer une proposition ou un ancien échec en état courant.

## Acquis conservés

- M1 reste `ACCEPTED_INTEGRATED`, A09 résolu. Les 57 familles BLOCKED archivées ne constituent pas une obligation générale de portage.
- Numeric/context : 450 identités, dont 224 valeurs et 226 refus ; 6 366 artefacts, aucun FATAL. Les neuf régressions ont réellement passé 31 860 assertions. Cette collecte documentaire ne les réexécute pas.
- Planificateur : qualification historique hors ligne de 415 tests et 17 077 assertions, à rattacher à ses sources exactes, pas à additionner aux autres suites.
- S1 : contrat et qualification indépendante de 107 tests / 354 assertions, pour les données et fonctions pures hors ligne. Cela ne prouve pas une authenticité native générale.
- Des preuves partielles de ressources, transitions, quotas et retrait cross-epoch existent ; leur application dépend de la version et de la frontière testée.

## Remplacement toujours non accepté

La dernière mesure autorisée a exécuté un seul test : **0 PASS, 1 FAIL, sept assertions**, environ 111 secondes pour une limite de quinze secondes. La copie immuable ciblée n'a coûté que 4,2234 ms sur quatre appels ; ce n'est pas le coût dominant de cette exécution. Aucun gain causal ni attribution du temps restant n'en découle.

Le diagnostic est complet, ses sources et artefacts conservés. L'autorisation s'est terminée par un **arrêt des nouvelles exécutions dans tous les cas** : pas de seconde mesure ou d'optimisation automatique. Les trois commandes consolidées n'ont pas été exécutées. Trois scénarios de threads restent interdits et la couverture de deux nouveaux candidats distincts reste incompatible avec la limite actuelle des origines.

Voir [[projects/re-ff8/concepts/rms-remplacement-et-preuves|les invariants et blocages du remplacement]].

## Incidents de transmission et suite

Une réponse complète et ses fichiers ont été retrouvés dans la session native d'un auteur alors qu'Ensemble annonçait ne pas avoir de réponse récupérable. La cause exacte de cette tentative manquée reste inconnue. Le plugin actif contient pourtant une récupération de réponses finales et, depuis le 27 octobre, un réveil conditionnel du superviseur.

Une notification absente ne justifie donc pas, seule, de refaire le travail. Procédure : [[projects/re-ff8/skills/recuperer-un-resultat-opencode-manquant|récupérer puis vérifier avant de remplacer]].

La suite est préparée dans [[projects/re-ff8/references/rms-static-closure-mission-20261028|la nouvelle mission de clôture statique]]. Elle n'est ni importée dans l'ancienne équipe ni lancée. La persistance complète, le parcours public réel, la publication de connaissance, le replay, les scénarios globaux et les revues finales restent à fermer selon leurs dépendances.
