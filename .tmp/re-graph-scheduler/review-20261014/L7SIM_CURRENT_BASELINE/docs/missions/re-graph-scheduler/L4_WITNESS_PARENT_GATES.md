# L4 — gel witness et gates parent avant acceptation

2026-10-14. Livraison correcteur Astra Max terminée, **non acceptée** à ce stade.
Gel readonly `.tmp/re-graph-scheduler/review-20261014/L4WITNESS/` :231files,
manifest `487f781c206121286a2f6764f0b001d5c5159435b859c9895277d58d9404016f`.
Copie source/dépendances/fixtures/contrat et décisionAPI, aucun node_modules,
aucun effacement des gels L4 précédents.

Own3 vérifiés par parent contre hashes du rendu et utilisés pour gates :
- semantic-index.ts `bf04ce7c697b107ecc3da95c9574eb835a7d0ad984790f7ab267bcd3938b5cb1`
- lineage.ts `ad412776dd7962d457f68a3c74f07502812dd0029070a517a4d4f9d74d033a61`
- lineage.test.ts `26eed4ee05000c9ed06ec7b0fa56f209187c00231a5bb2c46d6acf9dfe8f2b60`

Parent a exécuté séquentiellement via ContextMode, cwd absolu worktree auteur
`ensemble-re-ff8-re-graph-scheduler#4urn3c-l4-last-astra/tools/ff8-harness` :
- bun run typecheck : exit0.
- bun test test/lineage.test.ts :64PASS/0FAIL,964assertions, exit0.
- bun test :437PASS/1SKIP/0FAIL,438tests18files,20297assertions, exit0.
Own3/package/lock hashes inchangés avant/après. Ce n'est PAS la suite de main
actuelle : main a déjà intégré L6 ; les gates d'intégration main restent distincts.
Un premier script de filtrage avait une regex mal échappée et n'a lancé aucun
test ; corrigé dans la même session, pas considéré panneMCP ni résultat de gate.

Revue fresh indépendante `task_mv8a7hhi_00jr_6aet4u`, membre l4-witness-review,
session `ses_ec4e86f54ffe6533wsQh6XS2GH`, Model.Ref natif confirmé
openai/gpt-6.1-sol/**max**, worktreefalse, code+contrat gelés, sans verdict auteur.
Autorité locale éphémère/durablehost et lineage restent sujets de cette revue.
Aucune intégration/acceptance implicite sur tests verts, aucune authoritynative,
adoptionG7, intégrationL8, reviewL9 ou clôtureG4 annoncée.

## Contre-exemple indépendant encore bloquant malgré les gates

Revue en cours : clusterMultiview produit une vraie evidence/receiptlocale,
planAdoption explicittrue/units[] retourne adopted=true et partition.adopted=true.
Recluster identique avec cette partition effectivement retournée, le même sidecar
et witness : FAIL lineage-previous-unverified. Contrôle partition originale non
adoptée : PASS. Cause candidate lineage.ts:513–515 égalité totale contre evidence
partition.adopted=false, vs709 état adoptedtrue et1027 evidence jamaisadoptée.
Parent a reproduit le scénario **typed**, script
`.tmp/re-graph-scheduler/l4-adopt-recluster-parent-probe-20261014.ts` exit0.
Ce cycle API valide est un défaut de liveness offline ; pas preuve native/adoption
réelle. Rapport final reviewer et contrat de correction ciblée à attendre avantwrite.
