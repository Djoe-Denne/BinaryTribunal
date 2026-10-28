# L7 3ea92f — BLOCK parent confirmé, nouveau correcteur soumis à choix utilisateur

Source3ea92f5a7750dd278a8b496caf066153efbe0940b33761d8e9ad0cd97db8a031,
**NON acceptée/NON intégrée**, toujours absente du main. Dernier auteur déjà
**Astra max**, review fresh **Sol max** task task_mv9qdvek_002y_6x3kw6,
session ses_ebfaf67fcffeic9eeKh6PQkRwI, terminée BLOCK puis fermée normalement.
Native Model.Ref des deux relus. Ni ancien reviewer rejoué, ni source/gels supprimés.

## Trois familles confirmées indépendamment par le parent

1. **Obligation locale effaçable** (:204–206,782–786,798–802). Sur snapshot valide
   et vrai L5 accepté985, hash du requirement consommateur altéré → producteur
   COMMITTED/consommateur BLOCKED. Supprimer seulement ce requirement → validate=[],
   consommateur **COMMITTED à6**, alors que source/evidence gardent le besoin original.
   Pas de dispense, pas d'artefact nouveau légitimant l'effacement. Le cas manuel
   sans besoin original n'est pas ce contre-exemple. Préserver le contrôle ancien
   du producteur indépendant n'autorise pas à blanchir une absence du besoin connu.
2. **Pause surestimée après reprise** (:688–711,775–781,812–817,946–950). Une unité,
   pause[2,3) RUNNING, frontier6 : paused4. Pause[3,4) VALIDATING, frontier6 : paused3,
   validation1. Même si une pause suspendait cette attente, un seul intervalle d'un
   tick ne peut produire plus d'un paused unit-tick pour cette unité. waitReason
   reste paused après reprise, famille absente du seul ensemble runnable reclassé.
3. **Start réouvre une attente terminale** (:569–574,584–595,909,946–950). C dépend deP,
   cancel(C,0) ou invalidate(C,0) avant start, observation5 : étatCANCELLED/STALE mais
   dependency/waitTicks5, attendu null/0. Contrôle parent incident à1 : attente fermée
   d'un tick correctement conservée, raison nulle. Ne pas effacer toute l'histoire
   des unités terminales pour corriger le cas à0. État terminal ≠ preuve d'arrêt des
   jobs encore actifs ; occupation/fencing restent des invariants distincts.

Le reviewer constate ces chemins textuellement dans OLDac82 aussi. **Aucune preuve
qu'ils sont nouvellement introduits par Astra**, mais ils restent hors invariants
du lot sans waiver. Ne pas utiliser cette ancienneté pour accepter le candidat.

## Preuves et compte exact

Reviewer typecheck0/76PASS13 149assertions,138 probes propres =133PASS/5écarts en3
familles ; anciens G2/resources/provenance/receipts cohérents/observe détaché et mode
allocation985 passent ses contrôles bornés. Deux erreurs du harness corrigées,
pipeline-v1 non double-compté. Son script compact EXIT1 signifie BLOCK reproduit,
pas panne d'infrastructure ; parent a écrit/exécuté son propre probe EXIT0.

Parent vérifie **37artefacts/1 856 484B**, manifest
93a53a48503566f335bcbcfcdb5138d3bf5a01aa81bdb52c9fddfaf04db5321f ; REVIEW_RESULT
1a71d76f2d4118fdb874c6b0ba44fec4ebc96ce9b014a323c7995cd82f25080d,
455pins/5 398 908B exacts. Repros parent et contrôles conservés dans
`.tmp/coordination-three-20261014/l7-astra-block-parent-repros.json`, script
verify-l7-astra-block-parent-20261015.ts et log associé. Probes mémoire seulement,
pas DB/submit/native/science/IDA ou changement de source. Tous gels et preuves
précédents restent intacts ; L5 accepté613218f n'est pas annulé par ce BLOCK SIM.

## Gate de routage explicite — WAIT utilisateur

Le palier Astra max de dernier recours a déjà été utilisé pour cette source.
Une nouvelle correction ne peut pas être lancée comme repli Sol, mécanique moins
chère ou «nouvelle feature» pour éviter cette frontière. **Aucune exception au même
effort supplémentaire encore accordée**. Ne pas rouvrir l'auteur/reviewer terminé.

Question proposée : autoriser **une nouvelle session fresh Astra Max ciblée** sur
ces trois findings, repro/plan avant code,76 anciens contrôles préservés, nouvelle
review indépendante et gates parent ; ou maintenir le simulateur gelé et poursuivre
L8/gates indépendantes. Aucun achat/provider/config/politique globale changé,
aucune garantie de succès native ou reprise historique ajoutée.

Si autorisé, ownership proposé src/simulator.ts et un nouveau fichier de régressions
spécifique ; README seulement si son besoin est ratifié. Pas d'édition implicite
des76 tests existants, L1–L6/L8/QA/Store/config. Les choix exacts de classification
des attentes/guards doivent être proposés contre les contre-exemples, pas masqués
par suppression des métriques, changement de workload, satisfaction reconstruite
du besoin manquant ou réécriture des gels. Nouvelle permission/plan nécessaire.

L8 poursuit son **spike isolé déjà autorisé**, pas de source WRITE/full/régimeB ou
câblage simulateur libéré par cette note. Pas abort de worker, aucun nouveau run
scientifique/native/Ensemble réel. Une question interrompue ne vaut jamais accord.
