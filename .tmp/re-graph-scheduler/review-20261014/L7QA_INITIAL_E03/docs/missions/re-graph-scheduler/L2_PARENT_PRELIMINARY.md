# L2 — gates parent et revue indépendante

Mission `re-graph-scheduler-20261013`, 2026-10-13. **Pas encore accepté** : gates hors ligne reproduits, revue/corrections éventuelles avant intégration.

Gel `l2-graph-r3`, quatre fichiers own, seuls autres untracked = transferts parent `.tmp/` et `inputs/` (pas à commiter). Model.Ref/location OpenAI Sol high déjà vérifiés lors du handoff.

- src/graph.ts : `c00a43e8957a6d9a0e9d8d9d7001dc9271474de0d34226f0875b20c7d45eecc2`
- src/graph-normalize.ts : `7353a8591680fd357a39f3faaa6b64a23437c0de9005508b9c6559ce63f4ee64`
- src/capabilities.ts : `0711219437f0f53a6e26910a536ffb6b24be099420df8cb49c0eef0b7f1ffb22`
- test/graph-extract.test.ts : `c2269fd0e66fa1fea243166699394b0bb6b1e8f093e228e643f5a9657ec95bdb`

Hashes de rendu vérifiés exactement par le parent. Gates relancés dans son worktree via Context Mode, séquentiels/cwd absolu : typecheck exit0 ; **48 propres PASS / 0 fail** ; suite **421 pass / 1 skip / 0 fail**, 422 tests / 18 fichiers, 19858 expect, exit0. Aucun registre/central/config/schema/fixture/IDB modifié par ce lot.

Revue L2-RV fresh/read-only : task `task_mv6zzrhy_003n_mek7io`, membre `l2-review`, profil plan/worktree false, session `ses_ec9893ee4ffe3nwbSpeEcJfxrU`, Model.Ref natif vérifié `openai/gpt-6.1-sol/high`. Quatre sources/contrat/schémas/dépendance validation + planner réel main en lecture, pas verdict auteur fourni.

Contrôles parent commencés : normalisation relations/site-shards sans suppression, conflits de statut/provenance doivent fail-close, capability import-use vs nom de table inféré, corps/caches/joins restent à relire. Le sharding >64 sites respecte la limite de schéma mais consommateurs L5/L3/L4 doivent distinguer records/sites et relations ; pas de prérequis/poids artificiellement dupliqués.

**Gate native explicite** : export FF8 historique annoncé PARTIAL, `selfLoopsPreserved:false` ; INADMISSIBLE pour SCC/planning réel tant que réextraction statique native parent bornée n'a pas corrigé la couverture. Fixtures L1 restent planifiables. Hash d'entrée IDB ne prouve pas concordance locale des octets ; quatre divergences quarantinées, aucune promotion oracle. Aucun native/live exercé ici.

Disponibilité capa non démontrée (`--version` ENOENT déclaré par auteur), fallback local effectif ; import de rapport gelé ne constitue ni install ni exécution native capa/IDA. La cartographie annoncée 7582 nœuds ne représente pas tout le binaire.
