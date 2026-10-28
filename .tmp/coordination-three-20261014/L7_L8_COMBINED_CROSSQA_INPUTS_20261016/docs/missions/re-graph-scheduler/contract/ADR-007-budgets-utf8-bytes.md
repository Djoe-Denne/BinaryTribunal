# ADR-007 — Les budgets sont des octets UTF-8

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

`MissionPlan.budgets.unit` n'admet que `utf8-bytes`. Le compte inclut l'enveloppe et les métadonnées. `countsSqliteLength` n'admet que `false` : `length(TEXT)` SQLite compte des caractères, pas des octets.

`"café"` : 4 caractères, 5 octets. `"関数"` : 2 caractères, 6 octets. `String.length` n'est pas non plus un compte d'octets.

`nativeLineCharLimit` est figé à 2000. C'est la limite de ligne du read natif, pas un budget de tokens et pas le budget UTF-8.

Une sélection qui inclut un consommateur et exclut un callee obligatoire sans dispensation est invalide, même si le consommateur seul tient dans le budget. Alternatives conformes : inclure la fermeture, différer le consommateur, ou dispenser explicitement.

## Conséquences

L5/L6/L7 mesurent `Buffer.byteLength` / `length(cast(x AS BLOB))`, jamais `length(TEXT)`. Fixtures : `utf8-probe`, `budget-omits-callee` (rejet), `budget-defers-consumer` (acceptation).
