# ADR-005 — Les auto-arêtes sont conservées

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

Une arête `sourceId === destinationId` est conservée. `GraphSnapshot.coverage.selfLoopsPreserved` doit valoir `true` pour tout snapshot admissible au SCC ou au planning. `false` est un rejet de contrat, pas une simplification.

Les exports run01 qui suppriment les auto-arêtes ne sont pas une entrée SCC suffisante. Une fonction seule avec auto-arête est une SCC de taille 1, `hasSelfLoop: true`, exclusive dans le premier prototype. Une paire A↔B est une SCC exclusive sans ordre bottom-up total fictif.

`MissionPlan.sccs[].selfLoopPreserved` n'admet que `true`.

## Conséquences

L2 ne filtre pas les self-loops. L5/L6 ne condensent pas un cycle en le faisant disparaître. Fixtures : `ff8-self-loop`, `cycles-recursion`, `plan-scc-cycle`, `negative-self-loop-stripped`.
