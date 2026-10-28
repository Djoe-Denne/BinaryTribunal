# ADR-010 — Ownership des fichiers L2–L8

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

L1 possède le contrat, les huit schémas v1, les fixtures `test/fixtures/graph/**` et `test/graph-contract.test.ts`. Les lots suivants les lisent. Un changement de forme est un schéma v2, pas une édition silencieuse.

Écritures exclusives :

- L2 : `src/graph.ts`, `src/graph-normalize.ts`, `src/capabilities.ts`, `test/graph-extract.test.ts` ; extension non destructive de `tools/battle_static_graph_ledger.py`, `tools/battle_static_registry.py`, `tools/battle_indirect_registry.py`.
- L3 : `src/cluster.ts`, `src/investigation-groups.ts`, `test/cluster.test.ts`.
- L4 : `src/semantic-index.ts`, `src/lineage.ts`, `test/lineage.test.ts`.
- L5 : `src/planner.ts`, `src/scc.ts`, `test/planner.test.ts`.
- L6 : `src/eventlog.ts`, `src/unit-lease.ts`, `src/graph-store.ts`, `test/eventlog.test.ts`. Pas `store.ts`.
- L7 : `src/simulator.ts`, `test/simulator/**`, `test/benchmarks/**`. Pas les tests unitaires des autres lots ni les fixtures L1.
- L8, seul et sérialisé : `engine.ts`, `domain.ts`, `adapter.ts`, `client.ts`, `cli.ts`, `runtime.ts`, `validation.ts`, `store.ts`.

`domain.ts` n'est pas modifié par L1. L8 y intègre la projection. Les schémas historiques `mission-v1`, `worker-result-v1`, `re-policy-v1` restent intacts.

## Conséquences

Les worktrees L2–L7 ne convergent pas sur les mêmes fichiers. L6 prépare le SQL ; L8 l'accroche au `Store` existant sans affaiblir le refus de schéma étranger.
