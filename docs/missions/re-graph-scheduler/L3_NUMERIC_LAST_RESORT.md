# L3 — correctif numérique, dernier recours Astra

2026-10-14. **L3 NON ACCEPTÉ** : défauts RV3M-06/07 persistants après auteur Sol max et re-review Sol max, malgré les39 tests verts.

## Preuves parent

Gel `L3FIX`, cluster.ts SHA `4f51b398a63322c0e9457cd9ce755bda3f93cbf845a77d1169f877a94f17dccb`, manifest `a393ab247adab36a43fd9e5bae315654dd3be26ac1b57fcd67fb774f1d41e984`, inchangés. Reviewer a vérifié32/32 hashes et frontière transport L2 valide. Parent reproduit en mémoire sur le vrai module, avec oracles externes.

- **RV3M-06 PPR** : quatre nœuds/deux cycles disjoints, poids1e-320. Retour `[.5403162055335968,.45948616600790515,0,0]`, masse `.999802371541502`, converged=true/residualL1=0. Oracle cycle2 `[1/1.85,.85/1.85,0,0]`, résidu d'équations `.0004644268774703919`. Poids1 donne masse1 et résidu≈7.6e-13. Cause ordre `damping*score*weight/outDegree`, sous-flux avant normalisation.
- **RV3M-07 Leiden** : quatre nœuds,0→1 poids3u et2→3 poids2u, u=Number.MIN_VALUE,seedrv-subnormal,resolution1,temp0,tolu. Retour singletons/Q0/convergedtrue, originalMaxGain=originalGainTolerance=.2. Fusion0/1 ou2/3 gain rationnel **6/25=.24>.2**. Cause gains raw subnormaux avant certification. Pas une entrée invalide ni un optimum global exigé.

La suite reviewer1800graphes/61269cibles exactes normal-scale PASS ne couvre pas ce domaine accepté. Les méthodes doivent être normalisées/stables ou refuser explicitement une exécution numériquement non certifiable, jamais produire un faux converged/PASS. Pas de ban arbitraire de données ni renormalisation de sortie masquant le problème.

## Admission et contrat

User autorise Astra en dernier recours et une route renforcée après échec. Catalogue OpenAI `gpt-6-astra` actif/variante max confirmé ; mission model-policy revision2 le conserve **réserve25**, autres routes inchangées. Aucun score d'intelligence/coût fabriqué, aucune nouvelle souscription/provider. Sélection opérateur acceptée, admission/transfert effectués ; les anciennes mentions «non dispatché» du bilan précédent sont désormais historiques.

ReviewL3 terminée/task `task_mv7w9mzv_001p_hlz46a` completed = livraison seulement, shutdown demandé après rapport. Nouveau task **`task_mv7x2ofv_0026_knbdhc`**, membre **l3-numeric-astra**, session **`ses_ec6336b4bffe13rqGwQ7LdUens`**. **Model.Ref natif `{providerID:openai,id:gpt-6-astra,variant:max}` vérifié**, sélection opérateur a accepté (pas de bypass). Location initiale main déplacée vers worktree propre avant approval/édition.

Own3 uniquement cluster.ts/investigation-groups.ts/cluster.test.ts ; source et helperL2 gelés, transferts hash-match, aucun L1/central/registry/config/IDA/Git worker/live. Manifest `inputs/TRANSFER_L3_ASTRA.json` SHA `82cd1590f10ec1e1aae206d5523579185298b84aadf41092d8795945a3e8ec06`. Référence native **et location worktree relues avant approval**. Plan prescrit math approuvé : transitions normalisées, gains/certification/tol raw vs normalisés cohérents, tiny/huge/mixed/nonfinite/dangling/loops/duplicates, oracles rationnels indépendants, garder toutes RV3-01..05/budgets/context bindings. Changement structurant à escalader ; nouvelle revue indépendante + gates parent après correction, pas autoacceptance/native.

### Arbitrage sommants originaux

Astra a trouvé qu'un duplicate binary64 `1+2^-54` peut perdre un sommant avant un certificat dit exact. Parent autorise **extension interne sérialisable SparseGraph `numericSource`**, version NumPolicy/arcs source seulement siduplicates, copies défensives/canonical tri/budget liérawE. Aucun L1 modifié. Binding source↔projection effective/IDs/version à vérifier aux frontières/consommateurs ; PPR/Q/gains/cert doivent partager la même convention, aucun mix exact-source/cert avec Q arrondi caché. Tamper/stale/reload/JSON/permutations/mixed scales/rationnel à tester. PasWeakMap/état caché non exportable. Ancienne SGraph sans sidecar = convention projectioncanonique explicite, pas certification des sommants originaux inexistants. Derniers gates provisoires annoncés ne sont pas un gel final accepté.
