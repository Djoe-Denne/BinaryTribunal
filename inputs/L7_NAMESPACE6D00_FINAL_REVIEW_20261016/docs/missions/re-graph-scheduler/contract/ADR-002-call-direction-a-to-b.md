# ADR-002 — A appelle B = A → B

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

Toute arête stockée va de l'appelant vers l'appelé : `sourceId` est A, `destinationId` est B, `direction` vaut seulement `source_to_destination`.

La vue de planning est l'inverse et n'est pas stockée comme arête de graphe : `travail(B) → travail(A)`. Dans `MissionPlan.g1Edges`, `fromUnitId` possède le callee et `toUnitId` possède le caller.

Un tail jump confirmé est aussi A→B, kind `tail_jump`, site `code`. Ce n'est pas une xref DATA et ce n'est pas une seconde identité. Il peut être un prérequis G1 obligatoire. Une symétrisation pour un algorithme est une vue dérivée.

## Conséquences

L2 n'inverse pas les arêtes à l'export. L5 ne traite pas une arête stockée comme un prérequis déjà orienté consommateur vers producteur. La fixture `budget-defers-consumer` fige l'inversion.
