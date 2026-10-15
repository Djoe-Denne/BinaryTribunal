# L7 — exception utilisateur Astra Max ciblée après BLOCK3ea

2026-10-15. Réponse explicite à la question de routage :
**«Astra Max ciblé (Recommended)»**. Autorise une nouvelle session fresh
openai/gpt-6-astra/max au même effort pour les **trois findings confirmés** de
`L7_ASTRA_BLOCK_AND_USER_ROUTING_GATE_20261015.md`. Pas changement global de
provider/modèle/harness, achat, reprise d'auteur/reviewer completed ou garantie native.

Cela lève la gate de routage seulement. Model.Ref natif/OWN/paquet/lecture réelle
restent à vérifier, puis **repros et PLAN avant code**. Nouvelle review indépendante
fresh et gates parent après toute correction ; source3ea/OLD/76tests/gels/preuves
intacts. Simulateur non accepté/non intégré tant que ces gates ne passent pas.

## Objectif et ownership proposés, à ratifier par le plan

OWN/tools/ff8-harness/src/simulator.ts ; nouveau
test/simulator/simulator-final-review-regressions.test.ts. README seulement si besoin
exact proposé/ratifié, pas autorisation implicite. Tous76 contrôles existants,
helpers/oracles/benchmarks et dossiers inputs readonly ; aucun L1–L6/L8/QA/Store/
validation/config/package/registre modifié. Logs/probes OWN/.tmp/l7-final-fix-20261015/.

Re-dériver le vrai export L5 accepté985 et les trois familles, avec contrôles :

- Besoin original local connu dans source/evidence : absence ou altération ne peut
  devenir satisfaction niveau-seul. Laisser producteur indépendant progresser,
  consommateur bloqué sans artefact/requirement substitué ou dispense fabriquée.
  Distinguer explicitement les anciens scénarios manuels n'ayant **aucun** besoin
  original ; ne pas les bannir ni affaiblir external/unresolved/receipt guards.
- Pause des nouvelles admissions n'est pas interruption des jobs/validation déjà
  actifs. Classifier correctement les attentes au début/fin de pause pour toutes
  phases, pas seulement l'ensemble runnable. Un tick d'une unité ne devient pas
  3/4 paused ticks ; validation/occupation restent mesurées au bon horizon. Proposer
  les règles explicites, pas suppression de métriques ou changement du workload.
- Les événements start/obsolètes n'ouvrent pas dependency/paused après état non
  dispatchable/terminal. Conserver attente **déjà écoulée** avant cancel à1 (1tick),
  mais cancel/invalidate à0 avant start donne raison nulle/0. Aucun état seul ne
  prouve l'arrêt d'un job encore actif ; garder claims/ressources jusqu'à quiescence
  modélisée réelle. Ne pas «corriger» en réinitialisant toute l'histoire terminale.

Plan invariants/delta/paths avant code, contrôles contraires, permutations ordre
événements/ticks et observations répétées, vrais petits normalizer→L5 pour le besoin,
pas oracle repris du source ni faux receipt. Préserver G2 multiclé/multiholders,
ressourcesv2conservatrices≠packingL5, force/niveau/guardreceipt2fixture, provenance
versionnée du vrai indirect_call sans relation, DTO observe détaché/gelé sans store,
replay, DAG/CP/attribution et coûts honnêtes. Aucun100k/near-linear universel.

Typecheck/76anciens+nouveaux/five counterexamples/permutations et full offline réel,
codes/comptes/pins puis gel. Le full nécessite reservation/GO parent distinct ;
fixtures neuves et lifecycle conservés bornés, aucune suppression manuelle ou
source readonly patchée pour obtenir vert. Aucun full/DB avant plan ratifié.

Pas Git/commit worker/install/réseau/LLM/dispatch réel/IDA/live/DB privée/sous-agent/
inbox/reset/suppression. Toute décision supplémentaire/permission insuffisante
→parent avant extension. L8 continue son spike autorisé indépendamment, pas source
WRITE/B/simulateur/GO scientifique libéré par cette exception.
