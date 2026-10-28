# L8 A2 runtime15 — BLOCK confirmé parent, route corrective en attente

Nouvelle review indépendante NONBLIND Sol/max, task`task_mvatt7q4_000c_w991j0`,
session`ses_ebbbd0168ffeS27MM62vOwa0A5` : **completed puis shutdown**. Ne jamais
rouvrir cette review sur réveil tardif. Le gel runtime15 n'est ni accepté ni intégré.
L'auteur`l8-integration-r1`/task`task_mv6towrm_000c_24005n` reste in_progress/HOLD,
sans GO correctif déduit. Aucune migration de modèle/harness/politique.

## RV8A2-01 — digest/body/receipt non liés au même snapshot immuable

`tools/ff8-harness/src/client.ts:60–71`, client hérité SHAaf00b119…189498 :digest
calculé ligne62 sur l'objet caller ; await snapshot/control ligne67–69 ; nouvelle
lecture de l'objet pour construire le body ligne70. La receipt existante retourne
ligne65 sans renvoi.

Probe APIsPUBLIQUES, transport FAKE, SQLite NEUVE : inputpromptORIGINAL, mutation
pendant faux snapshot enMUTATED. Un seul submit envoieMUTATED sous le key/digest
précédemment calculé surORIGINAL. RestaurerORIGINAL puis submit rend la même receipt,
égalité **canonical** vraie et aucun deuxième submit. Contrôle sans mutation envoie
seulementORIGINAL. Parent confirme les deux observations dans copie isolée.

Défaut de l'hérité readonly, **pas régression v2 nouvellement prouvée** ni défaut
native réel. Clientaf00 n'est PAS le hash du client accepté main ; aucun rollback/
réécriture de l'historique main justifié par cette seule preuve. Il faut pour une
future correction lier digest/body/retry/receipt à un même snapshot détaché avant
callbacks/await, y compris données imbriquées, sans nouvelle body/key à la reprise.
La stratégie exacte et ses compatibilités restent à proposer/ratifier.

## RV8A2-02 — première acceptation PREPARED possible pendant pause

`graph-engine.ts:318–322` resoumet stateabsent/PREPARED depuis observe sans guard
paused ; step470–474 appelle observe AVANTfill ; guardpaused limité àfill413.

Probe graphHarness/preparationV2/snapshotFixture1, portsFAKE : premier A reçoit
quota recoverable,1submit/outboxPREPARED sans worker accepté ; pause,advance1000,
step →2submits/outboxACCEPTED/1receipt alors que view.status=paused. MêmeexecutionId.
Contrôle pause avant premierstep →0submit. Parent confirme les deux cas.

C'est une **première acceptation effective sous pause**, pas une preuve de nouveau
bodydistinct, remboursement ou violationN=1. Future correction devra distinguer
nouvelles soumissions/acceptations de l'observation des travaux déjà acceptés : ne
pas arrêter les vrais observations/résultats tardifs/stop/fences/releases, ne pas
traiter pause comme quiescence, ni perdre reprise/lostreply/body/IDs originaux.

## Preuves et reproduction parent

- ReviewerTC0,60PASS/424assertions ; probes puis confirmation2PASS/2FAIL/8assertions,
  sans échecsetup. La seconde version corrige SEULEMENT une métrique auxiliaire
  JSON.stringify/ordreclés en canonical ; versions/logs antérieurs conservés.
- `confirmed-boundaries.test.ts`3614B/SHA534ff093…34c432, log4671B/6167e522…d961e0.
  `ARTIFACTS_FINAL.json`35030B/SHA21b30de0…13fda1. Parent vérifie445pins8320550B,
  10proofpins,57DB17874944B/125fichiers17999131B fermés/hashés/sanssidecars,
  123racines EXPLICITEMENT retournées parfixturehelper ; aucun ancienTempinventorié.
- Parent copie445pins dans`L8_A2_PARENT_BLOCK_REPLAY_20261016/package`, rebase SEULES
  trois racines d'import du test ; logique inchangée. Une invocation ciblée :
  **2PASS/2FAIL/8assertions**, quatre observations attendues confirment les deux BLOCK.
- Parentretient4DBNEUVES692224B fermées/pinnées/sansWALSHMjournal,7racines réservées
  dont3sansDB. Son premier postcollecteur exigeait à tort DBpourchaqueréservation :
  correction de collecte sur LE MÊME run, **aucun rerun** ni mutation de source.
  Registry/57DB/125fichiers/10preuves reviewer restent exacts après reproduction.
- Tous sous-processus terminés naturellement ; reviewerfermé, aucune boucleheavy
  oubackground restante annoncée. Résultatsfull930PASS1SKIP restent historiques
  verts, mais ne lèvent pas ces contre-exemples. Pasfullnouveau/native/host/science.

## Gate de décision, aucune correction implicite

L'écriture L8 v2 ratifiée couvrait6src+7tests ; client/adapter hérités étaient
readonly malgré leur inclusion obligatoire dans la review15. **client.ts n'est
pas silencieusement promu en écriture**. Proposition à l'utilisateur : phase
corrective ciblée avec auteurSolMAX existant, plan avantcode/ratification parent,
extensionclientexplicitementbornée, graph-engine dans scope existant ; nouvelles
gates ciblées/full et freshreview indépendante ensuite. Option planseulement ou
HOLD conserve tous gels. Pasfallback, nouveau modèle, achat ouworker implicite.

Jusqu'à décision : L8BLOCK/HOLD, pastransfertcorrectif/réactivationauteur/sourcepatch/
intégration. Le taskL8 global est encore in_progress ; toute tâchecompleted devrait
recevoir une nouvelle affectation explicite, jamais réouverte par prepare:transfer.
L7indépendant6d00 a maintenant replayparentTC0+131PASS100old31new14004assertions,
380pins/main275 exacts ; son FULL n'est encore ni réservé ni autorisé. Aucun retrait
des gates L7, régimeB/L4,simCLI,post-L8QA,L9/L10 ou science/native.
