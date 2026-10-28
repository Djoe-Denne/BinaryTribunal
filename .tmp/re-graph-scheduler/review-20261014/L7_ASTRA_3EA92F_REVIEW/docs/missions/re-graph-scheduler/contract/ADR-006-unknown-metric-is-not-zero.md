# ADR-006 — Une métrique inconnue n'est pas zéro

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

Toute métrique quantitative est un `UnknownableInteger` : `{ known, value }`. `known: false` si et seulement si `value: null`. Un zéro observé est `{ known: true, value: 0 }`.

Cela couvre taille, instructions, blocs, largeur, coût estimé, modularité, conductance et enveloppe de contexte. Une section non extraite n'est pas inventée avec une taille 0 : elle est absente. Des tails non itérés sont inconnus, pas un compte de tails égal à zéro. `coverage.tailsIterated: false` et une raison explicite sont obligatoires.

Les ratios ne sont pas des flottants dans v1, pour éviter une canonicalisation instable. Une métrique non mesurée reste cet objet, pas `0`.

## Conséquences

L2/L3/L5 n'utilisent pas 0 comme sentinelle. La fixture `ff8-unknown-metrics` contient les deux états. `ff8-coverage-partial-tails` interdit de conclure à l'absence de tails.
