# Préflight source suivant — broker/drain, lecture seule avant ratification Q2

Q1 data/codec compilé C#4 et632assertions vertes ; ses sources sont une dépendance
qualifiée DATA_ONLY, pas une autorité kernel ni un runner générique. Contrats T
corrigés déjàrevus restent la base. Ce préflight ne ratifie aucun codeQ2/run.

ACK_HOLD touspins/tailles/NONBLIND+microplan puis attendre GO ANALYSE parent.
Rendu NATIF court, sans écriture : READY_SOURCE_SCOPE_PROPOSED | REAL_API_GAP |
PARENT_DECISION_NEEDED,3–8ancres réelles chemin:ligne et quelques signatures exactes.

Objectif : préparer la tranche source2 GenericEvidenceBroker.cs /
DualCaptureCoordinator.cs, pas refaire les contratsV3 ni les algorithmes gelés.
1. Mapper aux VRAIS types/méthodes V3 les huit slots, owners/permits/epochs,
   débit AVANTwrite, framesstdout/stderr, réserves terminales et append-only.
2. Décrire la plus petite API concrète source2, séparant budget/framing/state
   pure du backend IO/native et des lecteurs. Identifier les APIsréelles déjà
   disponibles et les seules manquantes, pas inventer des librarycalls/stubs.
3. Vérifier CDB-1 et phase FINALIZING idle-exclusive jusqu'aux GR/readback/receipt/
   ACK/records terminaux puis CLOSED. Une primitive manque→gap exact, jamais
   callback/boolean echo ou JSON label promu en preuve HOST/quiescence.
4. Examiner deux flux indépendants, pendingread simultané et bornes queues/
   chunk/permits sans Sleep comme oracle. Dire quels testsheap déterministes sont
   possibles et quelles garanties restent natives nonétablies.
5. Proposer subset sourceREADY et liste courte de décisions parent nécessaires
   avant CODE/QA. Aucun nouveau profil/cap/layout ou grand framework. Les limites
   5/20/30/55s,total262144,capture114688,control32768 restent ; 125s/DBcachetiers/
   full44workloadbindings natifs restent nonratifiés. Ne pas élargir le DTOQ1
   pour faire artificiellement passer la suitefull44.

Code proposé/signatures sont hypothèses, pas API acquises ni GOcode. Paquet seul,
sourcesde dépendance qualifiées/contrats/receipts de faits ; pas de QAimplémentation
autreworker ou origins. Pas globalreauditV3 ou recréationhelper/fixture déjàqualifiés.
Aucune écriture/compiler/typecheck/test/run/validator/import produit/OS/DB/git/
IDA/live/réseau/délégation/teamtools/claim/complete. Lecture/hash/parsing statique
permis. Le parent seul ratifiera un scope ultérieur sur ce résultat.
