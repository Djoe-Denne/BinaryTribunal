# L3 — revue Xhigh et correction Max

2026-10-14, mission re-graph-scheduler. **NON ACCEPTÉ**, malgré gates parent typecheck/27 propres/suite400+1skip.

Reviewer `l3-rv-xhigh`, task `task_mv74dfu6_0002_dj4dpu`, session `ses_ec68c678fffexlOuchbwv5iIN8`, Sol xhigh natif vérifié, fresh/read-only. Rapport final reçu ; tâche de revue completed, shutdown demandé sans abort de travail en cours. Ni acceptation L3, ni L8/L9, ni preuve native.

Gel initial (copies identiques sous `.tmp/re-graph-scheduler/review-20261014/L3`) :

- cluster.ts `17f0939d2a335e2e5e3ffd01458afcac2e3e502ad0655fe02a1d1df1d08b4dc9`
- investigation-groups.ts `12907c2b6ab35c1c45fae9beefa7109535695decc090e4cbb6fcdf50307867fa`
- cluster.test.ts `98cd0264e9d606c22959fa9a7db595fa4636a0bb4a4f635385c5721c2ca70d11`

## Défauts retenus

1. **RV3-01 HIGH**, cluster.ts:303–314/323 : stabilité du graphe agrégé déclarée convergence de la partition originale. Contre-exemple cinq nœuds détaillé dans `REASONING_ESCALATION_20261014.json`, **reproduit par parent avec oracle dense indépendant** : Q27/128, move original-node4 vers label0 donne Q30/128, pourtant converged=true. Reprise originale bornée/refinement/connectivité à conserver ; bounds/repair ne doivent jamais produire faux converged. Aucun optimum global universel exigé.
2. **RV3-02 HIGH interop**, cluster.ts:112–119 et investigation-groups.ts:81–85 : comparaison des shards après filtre retired/invalidated et confidence seule. Reviewer a vraiment croisé snapshot L1 modifié/rehash → validation L2 transport PASS → projection relation L2 refuse contradiction → L3 accepte. Metadata à concilier avant filtre live, dans projection et fallback groupes ; frontière normalized snapshot seule ne suffit pas. Helpers L2 restent sous re-review, pas vérité native implicite.
3. **RV3-03 MEDIUM**, cluster.ts:347–359 : snapshot vide est admis par L2, mais sortie communities=[] viole minItems1 partition v1. Ancienne hypothèse parent «nodes min1 donc hors contrat» corrigée. Sans changer L1, refuser/no-partition explicite plutôt qu'émettre une partition v1 invalide ou fabriquer une communauté vide.
4. **RV3-04 MEDIUM**, cluster.ts:299/359 : seed65caractères dépasse schéma64 ; `0`/trim-empty violent invariant L1. Gate d'entrée selon contrat, pas troncature/normalisation silencieuse qui change identité.
5. **RV3-05 MEDIUM**, cluster.ts:209–221/337–340 : PPR multi-seeds matérialise S×N cellules malgré E=0 ; reviewer a compté 1M cellules pour N=S=1k, 4M pour2k. Bench existant une seule seed ne démontre pas sparsité globale. Budget/cap de cellules explicite/versionné avant allocation, ou représentation bornée avec sémantique documentée, diagnostics sans fausse couverture.

Positifs : vraies phases refinement/aggregation (pas CC/Louvain renommé), PPR/cuts/Q petits oracles corrects, groupes ownerunique/contextes/coûts inconnus, rationnels sidecars, adopted=false. Gates verts ne réparent pas les cinq défauts.

Point **non bloquant** : groupId familial stable ne signifie pas digest intégral ; même ID avec contexte dérivé différemment (graph/hubSet optionnels) demande binding/version du contenu L8, pas rename arbitraire.

## Correction et arbitrage

Task `task_mv7ubzrm_000w_5zdnkl`, **l3-fix-max**, nouvelle session Sol max `ses_ec6766f1dffeBajk2eY7NkhZcs`, référence native vérifiée ; location initiale main corrigée avant approbation/écriture. Ownership seulement cluster.ts/investigation-groups.ts/cluster.test.ts. Anciennes sources/gels préservés, aucun central/schema/config/Git worker/IDA.

Parent autorise API additive pure pour budget PPR/version/binding et refus explicite de partition vide ; aucune modification L1 ni migration de plans actifs. Valeur de budget/taille/overflow documentée et testée, pas suppression silencieuse de seeds ni faux score inexistant. Correction du point fixe original ne doit pas sacrifier connectivité/refinement ; si borne atteinte ou oracle local encore positif, converged=false/diagnostic. Regressions loops/duplicates/seeds/permutations et vrai roundtrip relation L2 gelé, parent gates puis nouvelle revue requise.
