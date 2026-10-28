# Ratification documentaire phase2 — GO S1 source pure uniquement

La reprise sous politique Ensemble v2 approuvée ne migre aucune campagne RE.
Parent accepte V R3 `result_mvdy2nv4_000n_4nsytw`, native session
ses_eb0843d98ffePGKGDZqF7P9eBj, tâche task_mvdwb1gr_000c_l8wn65 :
ACCEPTABLE_R3_CONTRACT_DELTA. Revue R1/R2 historique conservée ; correction
documentaire R3 seule : current=head-selected, staging PREPARED non autorisant
borné, sélection/retrait par CAS, barrière et actif/familles inchangés.

Contrats ratifiés pour le modèle offline fixture décrit : EXECUTION_ENVELOPE,
DRAIN_AND_ACTIVATION et QA_MATRIX des outputs l8-phase2-r3-fix ; manifest
fdef256266c279a96abfb67c7df30dde10fca673bba61fa5c6163354f7041e25.
T0 origine immuable, T1 cut/barrière et final ActivationAttempt/T2 séparés.
Knowledge witness J→K déjà commis ou no-op K→K attesté ; aucune réapplication
de delta à T2. Bootstrap-A, transition-A et proposition-B ont ports distincts ;
aucun callback echo/boolean ne remplace les futurs handles du backend trusted.
OWN v3 neuf dédié, bootstrap A/B, A→A/A→B/B→B seulement ; B→A interdit.
Ledger root borné et succession L6 fixture requis avant S2/S3, pas acquis.

Autorisation immédiate limitée S1 pure source isolée :
- src/graph-execution-envelope.ts ; src/graph-b-projection.ts ;
- schemas/l8-execution-envelope-v1.schema.json ; schemas/l8-graph-run-v3.schema.json.
Auteur reçoit closure source/schema/config figée. API/types et dépendances
proposés au plan initial avant GO code, sans nouveau détour contractuel global.
QA indépendante ensuite : test/graph-phase2/envelope.test.ts et b-projection.test.ts.
V fresh composé avant toute intégration et gate parent typecheck/tests distincte.
Pas d'édition source centrale/ancienne, pas SQL/DB/process ou exécution worker.

Les vrais contrats source priment sur les alias documentaires. Une API/donnée
manquante est escaladée, pas inventée/castée ni remplacée par un digest seul.
BoundDocuments contiennent full snapshot/source/planning/knowledge/config, pas
GraphSnapshotView seul ; B→L5 lossless explicite, pas B-as-A ni mode executable
v1/v2 élargi. Préparation peut calculer une nouvelle projection/plan explicitement ;
load/export/replay ne recluster/replan jamais. Distinguer validation pure,
admissibilité et autorisation, S1 n'émet aucun HOST/activation/proof/handle.
AdoptionIntent pré-drain non autorisant distinct du final adoption T2.
Transport préparé/adoption déjà intégré reste byte-identique, aucune nouvelle
forme à y injecter. Schema fermé et validateur complet, pas JSON opaque casté.

S2/S3/S4 gardent leurs dépendances et ownership futurs ; aucun GO code concurrent
sur store/engine/CLI/domain. Pas activation native, 000d/full44, L9/L10 implicites,
run01/live/FF8/G5–G7 ni assouplissement des checks existants. Les autres travaux
indépendants data-only full44 peuvent progresser sans promotion croisée.
