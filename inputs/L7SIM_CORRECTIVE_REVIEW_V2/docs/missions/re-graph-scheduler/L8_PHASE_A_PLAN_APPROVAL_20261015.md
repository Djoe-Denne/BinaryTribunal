# L8 — approbation parent du plan, tranche A

2026-10-15. Tâche `task_mv6towrm_000c_24005n`, auteur fresh `l8-integration-r1`,
session `ses_ec12fcc43ffeI6xXQ5rSTty2mV`, Sol max natif/OWN/projection vérifiés.
**GO d'édition de la tranche A ci-dessous**, pas acceptation de son futur code.
Les contrôles et revues L7/L9/L10, ainsi que les GO réels, restent requis.

## Périmètre exact

Sous `tools/ff8-harness/`, existants autorisés :
`src/engine.ts`, `src/domain.ts`, `src/adapter.ts`, `src/client.ts`, `src/cli.ts`.

Nouveaux autorisés : `src/graph-pipeline.ts`, `src/graph-adapter.ts`,
`src/graph-engine.ts` ; `test/graph-integration/fixture-driver.ts`,
`pipeline.test.ts`, `engine.test.ts`, `protocol.test.ts`, `authority.test.ts`,
`recovery.test.ts`, `cli.test.ts`. Aucun autre fichier sans escalade.

DTOs publics additifs GraphRun/PreparedGraph et façade explicite Engine graph
approuvés dans ces fichiers, **sans changer MissionConfig, schémas L1 ou chemins
legacy par défaut**. Tous modules acceptés L2–L6, SCC/simulator, store/validation,
anciens tests, fixtures L1, package/lock/config/scripts/bridge extérieurs readonly.

## Tranche A autorisée

Phases 1–4 du plan auteur : préparation immuable via vrais L2/L3/L5 ; adaptateur
fonctionnel A/B/R et protocoles ; boucle READY événementielle sur APIs OWN v6 ;
persistance/reprise/replay. CLI offline préparation/cluster/groupes/plan/explain/
export/replay et inspection de reprise fixture autorisée, sans initialisation
du client/réseau legacy. Driver injecté simulé seulement.

Après gates A, livrer fichiers/pins/probes/gaps et **PAUSE avant régime B L4** ou
branchement du simulateur historique : nouveau GO parent après examen de A et de
la revue L7 correspondante. Ne pas annoncer L8 achevé si la simulation CLI ou le
régime B requis restent en attente. Les commandes réelles dispatch/shadow/adoption
peuvent être refusées explicitement, pas comptées comme capacités exécutées.

## Vérifications parent et conditions opposables

Parent a directement relu les APIs : EventLog accepte des kind:string/payloads
génériques, et vérifie séquence/temps/digest au replay ; GraphStore expose
freezeAdmissionInputs, prepareAdmission, reservationExpectation,
bootstrapParentAuthority, recordParentAttestation et validateUnit. Le journal
générique est possible **mais n'est pas une autorité ou un schéma de run**.

- Namespace/payload GraphRun versionné, validation stricte aux frontières et à la
  reprise, hashes/plans/mission/revisions exacts. Aucun token/secret dans le journal.
  Unknown propre namespace/version ou payload invalide = fail-closed ; pas de cast
  pour contourner une API manquante, pas d'écriture directe des tables/projections
  acceptées, pas de IDs/replan/reclustering régénérés à la reprise.
- Préserver réellement l'immutabilité des CycleRecord.groups et des exports, ne
  pas remplacer silencieusement le contrat par un second pipeline non branché.
  Store impose déjà l'immutabilité du cycle frozen ; incompatibilité → escalade.
- Chaque Intent reste une fonction ; attribution/famille/baux/executions/pins et
  A/B→R restent exacts. Commit d'unité complet puis drain READY immédiat sans F ;
  résultat d'exécution, bulletin ou R partiel ne vaut pas COMMITTED scientifique.
- Client actuel perd bien le discriminant execution_rejected. L'ajout doit retenir
  seulement le vrai discriminant et les champs non secrets requis d'une erreur
  authentifiée ; texte/category/recoverable ne le créent jamais. Ce discriminant
  **seul ne constitue pas** une preuve négative v6 ni une clôture d'admission.
- Autorité parent native/level2 uniquement depuis port réellement supporté et
  configuré, preuves complètes ; défaut/ambiguïté garde les claims. Le fournisseur
  fixture est explicitement tel, aucune auto-autorisation du principal demandé ou
  confiance dans un booléen/self-hash. Model.Ref demandé ≠ inspection observée.
- Garder support strict/file/providers exact et compatibilité du constructeur
  BridgeAdmissionError ; aucune substitution ou politique modèle implicite.
- Toute API/proof/atomicité insuffisante des modules readonly est escaladée AVANT
  extension. Ni nouvelle migration/table ni faux reçu pour faire passer une gate.

Gates réels par phase puis typecheck/full OWN : baseline 792 PASS / 1 SKIP, pas
main818 (maintenance non committée). Inclure D/E→B pendant F, SCC/multifonction,
claims/fences deux contrôleurs, I/O/crash/reopen, révocation/publication dupliquée,
payloads versionnés corrompus, legacy et CLI zéro-connect. Hash readonly avant/après.
Artefacts SQLite fixture uniques OWN/temp approuvé à conserver, aucune suppression.
Pas de Git/commit worker, install, réseau réel, LLM, native/IDA/live, sous-agents ou
inbox/team_results. Parent seul valide/intègre et approuve la tranche B.
