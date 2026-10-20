# Développement helper Windows préservé — M1/B, 2026-10-20

Cette branche préserve le développement et les preuves ; elle ne qualifie aucun
nouveau comportement et n'intègre rien dans main. Ne pas lancer les anciens
wrappers/gates en les prenant pour des autorisations. Leurs chemins absolus et
GO historiques sont conservés, pas réécrits pour fabriquer un nouveau reçu.

## Retrouver les originaux

`PRESERVATION_MANIFEST.json` nomme chaque origine et destination, taille, SHA-256
avant/après et résultat du readback. Les chemins `preserved/re-ff8/` gardent la
structure relative des seuls inputs/sources/tests/contrats/gates sélectionnés.
`preserved/external/` préserve les petits artefacts des racines Temp explicitement
nommées par les reçus, dont les deux runners absents du dépôt d'origine.

L'inventaire T1 accepté est copié avec tous ses chemins/hashs et sa carte de
112 familles de scénarios. Les révisions refusées, anciens rouges et limites ne
sont ni effacés ni confondus avec les versions qualifiées. Les gros RAW hors
whitelist restent aux originaux ; aucun gigaoctet de traces scientifiques n'est
dupliqué.

Les deux scripts CampaignSuspend/power sont **référencés seulement** dans le
manifest, jamais copiés ou exécutés. Le ConsoleProbe d'un autre outil FF8 est
également un arbitrage extérieur, pas une entrée de ce développement helper.

## Rebuild/test ultérieur — préservé, NON exécuté en étape B

Les compilations historiques sont explicites, sans projet csproj et sans NuGet :
Framework64/.NET4 existant, `/noconfig /nostdlib+`, x64, langue C#4 ou C#5,
références et Main fixés dans les reçus/gates préservés. Aucun outil système n'a
été copié/installé/configuré : ses chemins/versions/hashes restent dans les reçus.

Pour un futur rebuild autorisé, mapper les chemins originaux des listes de
sources de chaque reçu vers `preserved/re-ff8/<chemin relatif>` ou
`preserved/external/<chemin Temp relatif>` via le manifest. Ne pas exécuter les
gates historiques inchangés : ils pointent encore vers les originaux et des
réservations one-shot déjà utilisées. Produire de nouveaux candidats/reçus,
avec nouveaux espaces possédés et GO compile/run distincts.

- V3 matrix : neuf sources, `v3-compile-receipt.json` et `v3-compile.cjs`.
- Batch mémoire : onze sources de `ASSEMBLY_TESTS-receipt.json` et le runner
  `BatchTestRunner.cs` ; quatre suites FakeNative/FakeObserver/MemoryStream.
- Budget mémoire : module/tests corrigés et `BudgetMemoryRunner.cs`, ancien
  rouge + re-exécution verte distincts, pas preuve de budget global.
- Q1 DATA_ONLY : neuf V3 + GenericTargetPlan R3 + QA R2/R3 identique = onze sources.
- Q2a heap : V3 + Q1 + broker R2 + QA R2 = douze sources.
- Q2b1 heap : V3 + Q1 + broker R2 + coordinator R2 + QA = treize sources.

Leurs binaires historiques petits sont conservés pour la preuve, pas comme
substitut à un rebuild reproductible source→IL que les anciens reçus ne prouvent
pas universellement.

## Correspondance scénario → preuve préservée

- Q01–Q12 : `full44-q1-data-{compile,run}-receipt.json`, green verification et
  `FULL44_Q1_DATA_QUALIFIED_20261019.md` ; 632 assertions DATA_ONLY.
- B01–B18 : `full44-q2a-r2-{compile,heap-run}-receipt.json`, green verification
  et qualification Q2a ; 18 groupes / 69 759 assertions, arrêt WaitingACK.
- D01–D30 : `full44-q2b1-r2-{compile,heap-run}-receipt.json` et parent green ;
  72 cas / 7 122 assertions, race particulière statique seulement.
- V01–V04 : `v3-batchrun-receipt-20261017.json` et les receipts d'assembly ;
  quatre suites mémoire, pas vrai Job/T.
- N01 : `v3-slice2-receipt-20261017.json` (naturel) ; N02–N06 :
  `v3-matrix-summary.json`, paquet `v3-evidence-review/inputs` et
  `V3_MATRIX_SUBGATES_RESULTS_20261018.md`, cinq faits conditionnels bornés.
- JobRunner/Fixture : sources V1/V2, références newline, contrats, compilation
  réussie ou échouée et readiness HOLD conservés ; compilation ≠ wrapper exécuté.

## Limites opposables

Budgets cross-process **NOT_PROVEN** ; last-close/case6 **NOT_ESTABLISHED**.
D/S sont des events stand-ins et G un thread postRun/préACK dans les cas acquis,
pas une preuve de perte de processus indépendants. Les tests heap ne prouvent
pas vrais pipes/cancel/join/ACK/Closed/release, durabilité des writers physiques,
heap global, sandbox FS/réseau, full44/125s, Linux ou G5–G7. Un timeout ne prouve
pas l'arrêt de tous les descendants ; un Job ne prouve pas une sandbox.

Le retrait de sources de main et la conservation des garanties RMS partagées
restent des étapes distinctes C/D/E sous ownership du superviseur.
