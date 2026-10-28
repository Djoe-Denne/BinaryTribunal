# S1 — dépendances qualifiées, replan court avant GO code

Même owner/task S1, aucun transfert de contexte ou nouvelle équipe. Les anciens
38pins et préflight5helpers restent intacts ; ce nouveau paquet les remplace
pour les références source, sans modifier le modèle contractuel ratifié R3.

Parent a qualifié le factoring : tscvert,415tests/17077assertions/13fichiers,
zéroéchec/skip ; readback indépendant939hashs,268sources main+snapshot exactes,
97DB retenues/aucun sidecar, deux rouges précédents préservés. Cela qualifie
les dépendances offline sélectionnées, PAS le codeS1 encore absent.

Immédiatement : ACK_HOLD touspins/tailles/NONBLIND + planAPI/imports réconcilié
court (pas nouvelle tour contractuelle), puis attendre GO CODE parent explicite.
Montrer séparation parse/bind/export pur versus préparation volontaire et vrais
champs structuralbindings ; remonter seulement manque réel précis d'API/donnée.

Après GO seulement : outputs/src/graph-execution-envelope.ts,
graph-b-projection.ts, graph-execution-prepare.ts ; outputs/schemas/
l8-execution-envelope-v1.schema.json et l8-graph-run-v3.schema.json ; DESIGN.md
et MANIFEST.json. Aucun shared/ancien source, test/QA ou domaine central édité.
Le 5echemin est autorisé par la disposition parent du préflight antérieur.

Préserver fullsnapshot/source/planning/knowledge liés losslessly, pas snapshotView
seul ou BcastA. validatePlanningBindingV1 accepte vrais PickpartitionId/context/
allocation après validation B/v2 dédiée ; parseAdmissionSourcev1 ne s'élargit pas.
graph-execution-prepare est seul importeur S1 de planMission et prepareExecutionV1 ;
enveloppe/projection pures ne le réexportent pas en valeur. Load/export/replay ne
recluster/replan pas. T0/T1/T2 et bootstrapA/transitionA/proposalB restent distincts.

Code/module-loader trustedpinnés, pas de mutation de schémas partagés par le
consommateur ; aucune capacitéHOST/LOCAL/activation/quiescence créée depuisJSON.
La source référence inclut modules producteurs/DB à lire pour types/contrats,
PAS une autorisation de les charger dans une closure pure. Contrats réels priment
sur alias documentaires ; pas copycore/fauxadaptateur/callback certificatif.

Paquet seul, aucun origins/autreworker/QAoutput. Lecture/hash/parsing statique
autorisés, jamais import produit/compiler/typecheck/test/validator/run/OS/DB/git/
IDA/live/réseau/délégation/teamtools/claim/complete. APIstructurante nouvelle ou
besoin sharedpath→parent AVANT écriture. Codeproposé puis QA indépendante et Vfresh
avant intégration/gates parent ; S2–S4/native/full44/G5G7 et Linux restent exclus.
