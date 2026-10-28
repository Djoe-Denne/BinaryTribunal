# Parent GO R2 : deux correctifs uniquement, R1 CORRIGE conservé

Review result_mvf7psmv_0076_re3jtq confirmée par lecture parent cluster1–57 et
group-context169–210. R1 NON accepté, NON compilé, artefacts conservés.

1. Supprimer la déclaration locale ClusterDiagnosticError restée dans cluster.ts
   (avec son commentaire de classe si nécessaire). Garder uniquement l'import/
   réexport de sparse-graph-codecs : UN constructeur, aucun wrapper ni copie.
2. Dans deriveFixedGroupContexts seulement, créer les QUATRE dictionnaires indexés
   par groupId avec prototype nul (Object.create(null)), même API Record.
   sourceCommunitiesByGroupId/kernelIdsByGroupId/contextIdListUtf8BytesByGroupId/
   omittedContextIdsByGroupId : tous identifiants nonvides uniques restent admis,
   y compris __proto__/constructor/toString. Pas rename ni durcissement contrat.

Hors ces deux deltas, sources BYTE-identiques R1. sparse-graph-codecs.ts et
investigation-groups.ts strictement identiques ; nouveaux six outputs frères,
mêmes noms. DESIGN/MANIFEST R2 corrigent les revendications de constructeur et
documentent delta/restauration R1/exact spans conservés/pins bookends.

GO CODE direct après hash packet, pas ACK→GO routinier. Ancien propriétaire,
aucun main/S1/QA/validation/schema/planner/autre-worker écrit. Aucune compilation,
typecheck/transpile/test/run/import produit/validator/OS/DB/git/IDA/live/network/
origins/delegation/teamtools/clôture. Static read/hash/parsing et OWN6outputs
uniquement. Nouvel arbitrage structurant → parent avant inventer.

Final natif six hashes/tailles/delta exact/bookend, SOURCE_PROPOSED nonqualifiée.
Fresh deltaV, puis gates parent d'équivalence FULL outputs/erreurs/fingerprints/
diagnostics, tests identifiants spéciaux/constructoridentity/numeric/context et
régressions/pure closure restent obligatoires avant repin S1.
