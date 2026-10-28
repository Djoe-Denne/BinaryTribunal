# ADR-004 — callback_candidate est une hypothèse

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

`callback_candidate` peut exister comme `FunctionEdge` pour ne pas perdre le site, mais ce n'est pas un appel. Règles fermées : `status` `inferred` ou plus tard `invalidated`, jamais `observed` ni `validated` ; `schedulerRelevance` toujours `hypothesis_not_call` ; sites `xrefType: "data"`.

Le promouvoir exige une **nouvelle** arête `direct_call`, `tail_jump` ou `indirect_resolved`, avec sa propre preuve code. L'hypothèse n'est pas réécrite en appel. L'heuristique push-immédiat de `battle_static_graph_ledger.py` reste une hypothèse.

Elle ne crée pas un prérequis G1 obligatoire et n'est pas un callee.

## Conséquences

L2 conserve le kind historique sans le compter dans les appels confirmés. L5 ignore ces arêtes pour le blocage. La fixture `ff8-data-callback-not-call` est le cas de non-promotion.
