# ADR-003 — Une xref DATA n'est pas un appel

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

Une xref DATA n'est pas une `FunctionEdge`. Elle est un `ReferencedObject` (`data`, `table`, `global`, `structure`, `vtable`, `string` ou `import`) et, si la cible n'est pas un appel démontré, une `UnresolvedReference` de kind `data_xref`, `callback_slot` ou `import_unresolved`.

`FunctionEdge.destinationId` doit être un `FunctionNode.id`. Un objet n'est jamais un callee. `fabricatedFunction` n'admet que `false`. Aucune entité fonction à EA ou RVA zéro. Un import pur a `rva: null`, pas `0x0`.

Une projection « fonctions qui partagent une donnée » reste dérivée et conserve l'objet et la preuve.

## Conséquences

L2 sépare code et data à l'extraction. L5 n'ouvre pas de prérequis G1 sur une xref DATA. `negative-data-as-callee` doit rester rejeté.
