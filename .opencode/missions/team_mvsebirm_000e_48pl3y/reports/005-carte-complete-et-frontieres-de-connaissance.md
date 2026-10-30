# 5. Carte complète reçue : deux jonctions à rendre explicites

## Objectif et résultat vérifié

La mission doit documenter toute la chaîne statique RMS, pas seulement le
remplacement. La [carte du parcours complet](../../../../docs/missions/re-graph-scheduler/rms-static-documentation-20261028/02-parcours-et-frontieres.md)
est reçue et acceptée comme entrée documentaire. Les trois premières études
disponibles sont reliées dans l’[index en cours](../../../../docs/missions/re-graph-scheduler/rms-static-documentation-20261028/index.md).

Deux jonctions importantes sont désormais circonscrites :

1. Le moteur lu exige le run v2, tandis que la préparation candidate v3 et son
   admission administrative DATA ne démontrent pas un runtime public v3 intégré.
   Enlever un garde de version ou renommer une commande ne suffirait pas.
2. Après publication/readback, les receipts peuvent débloquer le travail suivant,
   mais ses entrées sont encore projetées depuis la connaissance du cycle gelé.
   Ce déblocage ne prouve donc pas l’acquisition des nouveaux octets d’artefacts
   dans son contexte. Une frontière explicite de matérialisation/projection sera
   à décider, sans rafraîchir silencieusement les états gelés.

## Preuve et portée

Le parent a relu symboliquement `runtimeRun`, `graphInputs`, `GraphEngine.finish`
et `observe`. La source confirme le garde v2, la projection depuis `cycleKnowledge`
et l’appel immédiat de `fill` après le commit de cette unité et ses receipts.
Il s’agit de constats statiques, pas de scénarios natifs exécutés. Les références
exactes et les limites figurent dans la carte.

La route publique et la publication restent distinguées du moteur fixture.
Aucune responsabilité de sessions/outils/permissions n’est transférée à RMS ;
aucun second ordonnanceur ou récupérateur n’est proposé.

## Suite engagée et limites conservées

L’étude du remplacement a commencé sur les preuves et la carte acceptées.
Elle doit proposer une correction minimale ou localiser une frontière à arbitrer,
sans nouvelle mesure, promesse de gain ou optimisation de copie injustifiée.
Les threads interdits et quatre origines contre plafond trois restent des
arbitrages distincts. Les oracles et la consolidation attendent cette étude.

La finale du parcours a, elle aussi, été retrouvée directement dans la session
native après un échec de récupération Ensemble. Aucun remplacement ou reprise
d’auteur. L’auteur est arrêté après réception ; lecture seule, aucune fusion Git.

## Annexe de traçabilité

- Finale D2 : `ses_e7c59f3d9ffe6PS5DpgaUbaU4k`,
  `msg_183ab5660001yaWmJHNxKpivML`, `finish:stop`, idle/succeeded ; Sol high conforme.
- Auteur remplacement : `doc-remplacement`, session `ses_e7c4d0590ffe0ltmz2cox0pJWX` ;
  `{providerID:openai,id:gpt-6.1-sol,variant:xhigh}` lu nativement après admission,
  sans override.

Localisation / impact / limites : trois livrables documentaires et leurs suivis,
aucun changement de source ou preuve fonctionnelle. Les options de remplacement,
le plan de vérification, le plan détaillé et la revue restent à terminer.
La suite continue dans le contrat approuvé, sans nouvelle demande de GO.
