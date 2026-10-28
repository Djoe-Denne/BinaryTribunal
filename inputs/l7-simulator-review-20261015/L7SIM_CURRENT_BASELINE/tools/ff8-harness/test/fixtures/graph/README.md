# Fixtures du contrat graphe v1

Chaque répertoire a `content.json` (hashé), `volatile.json` (exclu du digest), `reordered.json` (même canonique) et `manifest.json`.

`oracle` est toujours `false`. `ff8-idb-pe-quarantine` cite les divergences `0x465720`, `0x495960`, `0x48D200`, `0x48FE20` : quarantaine, jamais corpus oracle. Les autres cas FF8-shaped sont synthétiques, pas des observations natives.

`budget-omits-callee`, `negative-ea-zero`, `negative-data-as-callee` et `negative-self-loop-stripped` sont des rejets de contrat. `negative-fabricated-callee` est un rejet de schéma.

Norme : `docs/missions/re-graph-scheduler/contract/CONTRAT.md`.
