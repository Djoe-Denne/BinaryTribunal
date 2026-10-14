# L6 v4 — revue Max finale et arbitrage parent

2026-10-14, mission re-graph-scheduler. **CHANGES_REQUESTED, NON ACCEPTÉ** ; ni L8 ni G4/native validés.

Reviewer `l6-rv-max`, task `task_mv74dfu6_0001_7xhni0`, Sol max natif vérifié/fresh/read-only, gel confirmé `.tmp/re-graph-scheduler/review-20261014/L6`. Manifest `eb58e2ad2a214ce563f8356443e44db81134ed5e4efdad4cc7007ca27f89bee5`,32/32 SHA inchangés avant/après. Probes SQLite mémoire seulement ; pas suite complète/reopen disque/multiprocess indépendants ni service natif exercés par ce reviewer. Le parent avait reproduit les gates du même gel : typecheck/47 propres/suite378+1skip, sans inférer ces invariants.

## Défauts et décisions

**RV6M-01 P2 confirmé** — graph-store.ts:220–235 réappend same snapshot/partition à now différent ; eventlog.ts:31–36 lie time au digest. Repro now11→12 lève «event idempotency payload changed» pour mêmes documents. Parent exige no-op après contrôle d'autorité et immutable-content equality ; conserver time/digest événement originaux, collisions document/payload/kind/unit toujours refusées. Ne pas enlever globalement time du journal. Régression même connexion, nouveau now, nouveau contrôleur autorisé/reopen.

**RV6M-02 binding confirmé** — graph-store.ts:399–418 accepte dossier functionId f2100 pour sous-intent f2000 et metadata.inputFingerprint=0*64 ; outbox PREPARED. C'est une mauvaise admission figée, pas une promotion scientifique native prouvée. **Owner L6 tranché parent** : primitive `prepareAdmission` doit refuser avant I/O, pas confiance dans une façade L8 contournable. Fonction/dossier/manifest/projection/hash canonique à binder aux inputs attendus immuables ; réutiliser le contrat/routines du harnais, pas hash d'une sortie inconnue. Si une nouvelle expectation/API/version est nécessaire, l'auteur propose au parent avant migration ; pas juste copier une déclaration worker comme valeur attendue.

**RV6M-03 obligation de sûreté conditionnelle** — graph-store.ts:481–494/635–645, unit-lease.ts:112, callback465–466. Fixture : SENDING→absence instantanée auto-déclarée quiescent→retire/release→nouvelle famille samefn→ancien submit accepted, seulement observation tardive. Si la preuve initiale était réellement un admission-fence natif permanent, le scénario contredirait la preuve. **Pas de bug natif prouvé** par cette simulation.

Parent choisit cependant une frontière fail-closed : absence simple après I/O/attempt>0/ambigu ne peut libérer claims. Jamais-envoyé0attempt distinct ; completed/definitive rejected receipt-bound distincts. Une option autorisant absence post-I/O requerrait une capability host authentifiée attestant fermeture irréversible/fence permanent, liée exact request/generation/family/execution ; source/quiescent booléens seuls insuffisants. Pas de provider implicite ni bypass fixture/unbound ; architecture/migration supplémentaire à escalader avant édition. Préférer blocage sûr à redispatch concurrent ; garder preuve/observation contradictoire et recovery explicite, pas effacer l'historique.

## Positifs bornés

Douze probes indépendantes : boolean niveau2 sans attestation refusé, acteur parent auteur/session refusé, modèle/digest incorrect refusés sans demi-write ; attestation idempotente now différent ; révocation avant readback bloque commit, post-commit satisfies true→false et historique conservé ; accepted tardif après expiry inéligible/claims quarantinées ; ancien catch ne remplace pas génération2. Ceci ne dispense pas RV6M-01/02/03 ni native G4/G6.

Replay reste projection d'audit, pas reconstructeur outbox/leases ; migrations connues additives ne réparent pas colonnes arbitraires ; limitations scans/perf maintenues.

## Correction

Task **`task_mv7v601t_001d_v9tu9r`**, nouveau writer **l6-fix-max**, session **`ses_ec669d38bffexVhLG8f0YpFhEk`**, **Sol max** vérifié (source auteur Sol high). Ancien auteur arrêté avec worktree/histoire préservés ; reviewer shutdown demandé après rapport final sans abort de travail existant. Own4 seulement eventlog.ts/unit-lease.ts/graph-store.ts/eventlog.test.ts, transferts depuis gel immutable + dépendances readonly, aucune édition central/L1/config/IDA/Git worker. Nouvelles gates/probes/reopen/concurrence puis re-review requises avant intégration.
