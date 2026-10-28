# L2 — revue indépendante bloquante et corrections

Mission `re-graph-scheduler-20261013`, 2026-10-13. **L2 NON ACCEPTÉ**, pas d'intégration native/production sur ces gates seuls.

## Rapport récupéré sans accès DB

`team_results({from:'l2-review'})` ne retrouvait aucun unread malgré notification. Le code du plugin installé `executeTeamResults` utilise une marque `read` **globale équipe**, sans filtre destinataire et avec accès des membres. Cela permet à un membre de consommer des messages destinés au lead ; ce n'est pas une preuve de notification creuse.

Le parent a récupéré le **rapport explicitement envoyé au lead**, pas le raisonnement interne, via `Service.discover/headers` + API publique `message.list` sur la session possédée `ses_ec9893ee4ffe3nwbSpeEcJfxrU`. Message preuve final : `msg_1367e1f6500194J4pdO2KR67qW`, appel `team_message(to:'lead')` contenant task-result completed/BLOQUANT. Aucun `ensemble.db` lu/écrit, aucune configuration/plugin modifié. Steering local aux workers : pas de collecte globale `team_results()`, messages ciblés dans sessions / from lead seulement si besoin.

Reviewer Sol high fresh/read-only, gel initial hashes conformes (`L2_PARENT_PRELIMINARY.md`), aucune édition/IDA/install ; probes en mémoire. Dernier rapport = six défauts (complète un premier rapport cinq défauts).

## Défauts retenus et correction requise

1. **RV2-01 P1** : `graph.ts:366–390`, `capabilities.ts:137–141` : provenance d'un autre module acceptée pour source/function alpha. Binding module/site/xref au **source** requis ; cibles/objets multi-modules légitimes restent possibles, cap function doit avoir provenance module sujet.
2. **RV2-02 P1** : `graph-normalize.ts:341–349` et joins magic293–314 : PE duplicate-EA last-wins. Cas0x460860 divergent valide puis concordant vs inverse donne observed/quarantined selon ordre. Canonical-EA uniques, doubles identiques dédupliqués, contradictoires rejetés ; permutations de preuves testées.
3. **RV2-03 P1** : `graph.ts:236–416` n'applique pas vraiment schéma strict L1. Node.schemaVersion99/functionClassBOGUS/extra/toolVersions{} rehash+cache admis. Validation required/enums/bounds/additionalPropertiesfalse runtime **puis** invariants croisés, cache et évaluateurs fail-close sur entrée invalide ; aucun schéma gelé modifié.
4. **RV2-04 P2** :493 lignes ne garantit pas493 sites uniques. Remplacement0x40221B par copie0x40218D conserve counts mais supprime site (unresolved486→485) sans diagnostic. Unicité module/site canonique et conflits/comptes classes/familles, distinguer inventaire du multi-target légitime.
5. **RV2-05 P2** : gel rawSHA/bytes vérifié isolément sans join bornes ledger.0x460860 chunkEnd ledger+1 accepté avec gel original et concordance. Entry/chunksets/étendue ledger↔gel↔PE à comparer, divergence rejet/quarantaine/diagnostic, jamais concordance implicite.
6. **RV2-06 P2 interop** : L2 shards lossless, mais L5 duplique G1/prérequis/enveloppe :64sites→1pre/4053bytes,65sites→2pre/5119bytes (même relation). Relations/politiques/prérequis par clé sémantique, union sites/preuves, divergences policies shard fail-closed ; regression64/65/129 + budget frontière.

Positifs conservés : callback hypothèse DATA non-call, hash:RVA/EA arithmetic/zero, métriques inconnues, quatre quarantaines sans PEjoin/oraclefalse, invalidations cap/propagation bornée, clones/invalidation caches multi-module, baseline98/36 fidèle, capa non-native. Corpus FF8 historique toujours selfLoopsfalse/inadmissible planning.

## Ownership / reprise

- Parent a checkpointé les quatre sources initiales **`ff414ad`** dans la branche L2-r3 avant correction (non intégrée main), SHA identiques au gel de revue. `.tmp/`/`inputs/` non committés, sources/history conservées.
- **L2-FIX** task `task_mv717o3c_0049_j4dthw` : reprise auteur L2-r3 Sol high, mêmes quatre fichiers, corrections01–05 + API relation éventuelle pure ; aucun planner/central/schema/config/registre/Git/IDA modifié.
- **L5-SHARD-FIX** task `task_mv717o3v_004a_goswoa` : correction planner/tests par owner distinct au prochain slot utile, jamais concurrence sur ces interfaces ; parent décide policies clés sémantiques et rétrocompatibilité.
- Reviewer arrêté avant reprise des sources. Nouvelle revue et parent gates requis ; les91 tests reviewer/48 propres parent verts ne couvrent pas ces attaques.
